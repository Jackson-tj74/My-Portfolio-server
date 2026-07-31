import PortfolioContent from "../database/models/PortfolioContent.js";
import PortfolioSetting from "../database/models/PortfolioSetting.js";

const getConfig = () => ({
  // LLM_* is the public configuration contract. Keep ZAI_* as a backwards
  // compatible fallback for existing deployments.
  url: process.env.LLM_API_URL || process.env.ZAI_API_URL || "",
  key: process.env.LLM_API_KEY || process.env.ZAI_API_KEY || "",
  model: process.env.LLM_MODEL || process.env.ZAI_MODEL || "",
  temperature: Number(process.env.LLM_TEMPERATURE || process.env.ZAI_TEMPERATURE) || 0.3,
  provider: process.env.LLM_PROVIDER || "openai-compatible",
});

const clean = (value, max = 1200) => typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : value;

const publicProjectKnowledge = `PUBLIC PROJECT CAPABILITIES:
- Public frontend: React with Vite and Tailwind CSS, responsive Home, About, Projects, Services, Contact, login, and dashboard routes.
- Portfolio content: published projects, services, skills, experience, education, languages, certificates, testimonials, gallery, profile settings, social links, and call-to-action settings.
- Dashboard: protected provider access, content CRUD, status publishing, image and icon uploads, skill logo selection, theme customization, settings, contact messages, notifications, AI analytics, and account settings.
- Public experience: project cards with technologies and links, service cards with details, About-page skill groups and credentials, testimonials, contact form, and an AI portfolio assistant.
- Backend: Express API, MongoDB content storage, authentication, Cloudinary media uploads, email notifications, contact-message management, real-time notifications, rate limiting, and an OpenAI-compatible LLM integration.
- Never reveal source code, environment variables, API keys, passwords, email credentials, database connection strings, access tokens, private dashboard data, or implementation secrets.`;

const formatItem = (item) => {
  const data = item.data && typeof item.data === "object" ? item.data : {};
  const details = Object.entries(data)
    .filter(([key, value]) => key !== "image" && value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : clean(String(value), 500)}`)
    .join(" | ");
  return `- ${item.title}${item.excerpt ? ` — ${clean(item.excerpt)}` : ""}${details ? ` | ${details}` : ""}`;
};

export const getPortfolioKnowledge = async () => {
  const [settings, content] = await Promise.all([
    PortfolioSetting.find().select("key value -_id").lean(),
    PortfolioContent.find({ status: "published", deletedAt: null }).select("kind title excerpt data -_id").sort({ kind: 1, sortOrder: 1, createdAt: -1 }).limit(500).lean(),
  ]);
  const settingLines = settings.filter(({ key }) => !/password|secret|token|api[-_]?key/i.test(key)).map(({ key, value }) => `- ${key}: ${clean(String(value), 1000)}`).join("\n");
  const grouped = content.reduce((result, item) => { (result[item.kind] ||= []).push(formatItem(item)); return result; }, {});
  const contentText = Object.entries(grouped).map(([kind, items]) => `${kind.toUpperCase()}:\n${items.join("\n")}`).join("\n\n");
  return `${publicProjectKnowledge}\n\nPORTFOLIO SETTINGS:\n${settingLines || "No additional settings have been published."}\n\nPUBLISHED PORTFOLIO CONTENT:\n${contentText || "No published content is available yet."}`.slice(0, 70000);
};

export const buildPortfolioSystemPrompt = (knowledge) => `You are the professional portfolio assistant for Jackson, a Full Stack Software Developer. Help visitors, recruiters, and potential clients understand his abilities and confidently take the next step toward hiring or contacting him.

Use the portfolio reference below as your source of truth. Never invent skills, employers, certificates, years, prices, results, clients, links, or availability. If a detail is missing, say you do not have it and invite the visitor to contact the owner.

Be warm, concise, confident, and professional. Always describe Jackson using the exact title “Full Stack Software Developer”; never replace it with “Full Stack Web Developer” or another title. For recruiters, give a clear elevator pitch and connect skills to real projects, experience, education, certificates, and testimonials. For clients, explain relevant services plainly, ask one useful discovery question, and suggest a next step. Do not claim to be Jackson. Highlight concrete evidence and end hiring/client answers with a natural call to action about the role, project, timeline, or requirements.

PORTFOLIO REFERENCE:
${knowledge}`;

export const getLLMConfigStatus = () => {
  const config = getConfig();
  return { configured: Boolean(config.url && config.key && config.model), provider: config.provider, model: config.model };
};

export const generateAssistantReply = async (messages) => {
  const config = getConfig();
  if (!config.url || !config.key || !config.model) {
    const error = new Error("AI is not configured on the server. Add LLM_API_URL, LLM_API_KEY, and LLM_MODEL to backend/.env.");
    error.code = "LLM_NOT_CONFIGURED";
    throw error;
  }
  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.key}` },
    body: JSON.stringify({ model: config.model, messages, temperature: config.temperature, stream: false }),
    signal: AbortSignal.timeout(45000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || payload.message || `LLM request failed with status ${response.status}`);
  const content = payload.choices?.[0]?.message?.content || payload.output?.text || payload.response || payload.content;
  if (!content || typeof content !== "string") throw new Error("LLM provider returned no assistant content");
  return { content, provider: config.provider, model: config.model };
};
