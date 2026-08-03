const brand = "Tuyikunde Jackson Portfolio";

const AMP = String.fromCharCode(38);
export const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (character) => ({ "&": AMP + "amp;", "<": AMP + "lt;", ">": AMP + "gt;", "'": AMP + "#39;", '"': AMP + "quot;" })[character]);

const baseTemplate = ({ title, intro, body, cta, ctaLink }) => ({
  html: `<!doctype html><html><body style="margin:0;background:#f3f7f4;font-family:Arial,sans-serif;color:#173226"><table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #dcebe0"><tr><td style="padding:28px;background:#14532d;color:#fff"><h1 style="margin:0;font-size:22px">${brand}</h1></td></tr><tr><td style="padding:36px"><h2 style="margin:0 0 12px;color:#14532d">${escapeHtml(title)}</h2><p style="font-size:15px;line-height:1.7;color:#52665a">${escapeHtml(intro)}</p>${body || ""}${cta && ctaLink ? `<p style="margin-top:28px"><a href="${escapeHtml(ctaLink)}" style="display:inline-block;background:#16a34a;color:#fff;padding:13px 20px;border-radius:10px;text-decoration:none;font-weight:bold">${escapeHtml(cta)}</a></p>` : ""}</td></tr><tr><td style="padding:20px 36px;background:#f5faf6;color:#718078;font-size:12px">This is an automated message from ${brand}.</td></tr></table></td></tr></table></body></html>`,
});

const paragraph = (label, value) => `<p style="font-size:14px;line-height:1.6;color:#52665a"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;

export const buildEmail = (type, options = {}) => {
  const { receiverEmail, fullName, email, subject, message, link, reply } = options;
  const common = { to: receiverEmail };
  switch (type) {
    case "welcome-message": return { ...common, subject: "Welcome to my portfolio", text: "Welcome to my portfolio.", ...baseTemplate({ title: "Welcome aboard", intro: "Thank you for connecting. Explore the portfolio and recent work.", cta: "Explore portfolio", ctaLink: link }) };
    case "thank-message": return { ...common, subject: "Your message was received", text: "Your message was received.", ...baseTemplate({ title: "Thanks for reaching out", intro: "Your message has been received and I will respond as soon as possible.", cta: "Visit portfolio", ctaLink: link }) };
    case "contact-us":
    case "project-inquiry": return { ...common, subject: `New ${type === "project-inquiry" ? "project inquiry" : "contact message"}: ${escapeHtml(subject || "Portfolio contact")}`, text: `${fullName} (${email}) sent: ${message}`, ...baseTemplate({ title: type === "project-inquiry" ? "New project inquiry" : "New contact message", intro: "A visitor submitted a message through the portfolio.", body: paragraph("Name", fullName) + paragraph("Email", email) + paragraph("Subject", subject) + `<div style="padding:16px;background:#f5faf6;border-radius:10px;white-space:pre-wrap">${escapeHtml(message)}</div>` }) };
    case "newsletter": return { ...common, subject: subject || "Portfolio newsletter", text: message || "New portfolio update.", ...baseTemplate({ title: subject || "Portfolio update", intro: message || "Thank you for subscribing to portfolio updates." }) };
    case "admin-reply": return { ...common, subject: subject || "Reply to your portfolio message", text: reply || message, ...baseTemplate({ title: "Reply to your message", intro: "Thank you for contacting me. Here is my reply:", body: `<div style="padding:16px;background:#f5faf6;border-radius:10px;white-space:pre-wrap">${escapeHtml(reply || message)}</div>` }) };
    case "login-alert": return { ...common, subject: "Dashboard login alert", text: message, ...baseTemplate({ title: "Dashboard login", intro: message }) };
    case "new-message": return { ...common, subject: "New portfolio message", text: message, ...baseTemplate({ title: "New message", intro: message, cta: "Open dashboard", ctaLink: link }) };
    case "notification": return { ...common, subject: subject || "Portfolio notification", text: message, ...baseTemplate({ title: subject || "Portfolio notification", intro: message, cta: link ? "Open dashboard" : "", ctaLink: link }) };
    case "ai-feedback": return { ...common, subject: subject || "New portfolio assistant lead", text: message, ...baseTemplate({ title: "New assistant lead", intro: "A visitor used the portfolio assistant and shared a conversation for follow-up.", body: `<div style="padding:16px;background:#f5faf6;border-radius:10px;white-space:pre-wrap">${escapeHtml(message)}</div>` }) };
    default: throw new Error(`Unsupported email type: ${type}`);
  }
};

