import crypto from "node:crypto";
import { StatusCodes } from "http-status-codes";
import AIConversation from "../../database/models/AIConversation.js";
import User from "../../database/models/User.js";
import { handleError, handleSuccess } from "../../utils/responseUtils.js";
import { buildPortfolioSystemPrompt, generateAssistantReply, getLLMConfigStatus, getPortfolioKnowledge } from "../../services/llmService.js";
import { sendEmail, canSendToEmail } from "../../services/sendEmail.js";

const session = (req) => req.body.sessionId || req.query.sessionId || crypto.randomUUID();
const safeText = (value, max = 12000) => typeof value === "string" ? value.trim().slice(0, max) : "";

class aiControllers {
  static config = async (_req, res) => handleSuccess(res, StatusCodes.OK, "AI configuration status", getLLMConfigStatus());

  static chat = async (req, res) => {
    const sessionId = safeText(session(req), 100);
    const content = safeText(req.body.message, 12000);
    if (!content) return handleError(res, StatusCodes.BAD_REQUEST, "Message is required");
    try {
      let conversation = await AIConversation.findOne({ sessionId, status: { $ne: "failed" } });
      if (!conversation) conversation = await AIConversation.create({ sessionId, user: req.user?._id || null });
      conversation.messages.push({ role: "user", content });
      conversation.messageCount += 1;
      const knowledge = await getPortfolioKnowledge();
      const result = await generateAssistantReply([
        { role: "system", content: buildPortfolioSystemPrompt(knowledge) },
        ...conversation.messages.map(({ role, content: text }) => ({ role, content: text })),
      ]);
      conversation.messages.push({ role: "assistant", content: result.content });
      conversation.messageCount += 1;
      conversation.provider = result.provider; conversation.model = result.model; conversation.status = "completed"; conversation.lastError = "";
      await conversation.save();
      return handleSuccess(res, StatusCodes.OK, "Assistant response generated", { sessionId, reply: result.content, conversationId: conversation._id });
    } catch (error) {
      await AIConversation.updateOne({ sessionId }, { $set: { status: "failed", lastError: error.message } }, { upsert: true }).catch(() => {});
      const status = error.code === "LLM_NOT_CONFIGURED" ? StatusCodes.SERVICE_UNAVAILABLE : StatusCodes.BAD_GATEWAY;
      return handleError(res, status, error.message);
    }
  };

  static history = async (req, res) => {
    try {
      const conversation = await AIConversation.findOne({ sessionId: safeText(req.params.sessionId, 100) }).select("sessionId messages createdAt updatedAt status").lean();
      return handleSuccess(res, StatusCodes.OK, "Conversation retrieved", conversation || { sessionId: req.params.sessionId, messages: [] });
    } catch (error) { return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message); }
  };

  static feedback = async (req, res) => {
    const sessionId = safeText(req.body.sessionId, 100);
    const visitorEmail = safeText(req.body.visitorEmail, 180);
    if (!sessionId) return handleError(res, StatusCodes.BAD_REQUEST, "Conversation session is required");
    if (visitorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(visitorEmail)) return handleError(res, StatusCodes.BAD_REQUEST, "Please enter a complete email like name@example.com, or leave the email field blank");
    try {
      const [conversation, owner, knowledge] = await Promise.all([
        AIConversation.findOne({ sessionId, status: { $ne: "failed" } }).lean(),
        User.findOne({ role: "provider" }).select("name email").lean(),
        getPortfolioKnowledge(),
      ]);
      if (!conversation?.messages?.length) return handleError(res, StatusCodes.BAD_REQUEST, "Start a conversation before sending feedback");
      const recipientEmail = process.env.AI_FEEDBACK_EMAIL || process.env.ADMIN_EMAIL || owner?.email;
      if (!recipientEmail) return handleError(res, StatusCodes.SERVICE_UNAVAILABLE, "AI feedback recipient email is not configured");
      const transcript = conversation.messages.map(({ role, content }) => `${role.toUpperCase()}: ${content}`).join("\n\n");
      const analysis = await generateAssistantReply([
        { role: "system", content: `${buildPortfolioSystemPrompt(knowledge)}\n\nPrepare a private lead brief for the portfolio owner. Return exactly these sections: Visitor need, Problem or opportunity, Relevant portfolio fit, Lead quality, Recommended follow-up. Do not invent facts.` },
        { role: "user", content: transcript.slice(0, 30000) },
      ]);
      const message = `Visitor email: ${visitorEmail || "Not provided"}\nSession: ${sessionId}\n\n${analysis.content}`;
      let emailDelivered = false;
      let emailError = null;
      if (canSendToEmail(recipientEmail)) {
        try {
          await sendEmail({ action: "ai-feedback", receiverEmail: recipientEmail, subject: "New portfolio assistant lead", message });
          emailDelivered = true;
        } catch (err) {
          console.error("AI feedback email failed:", err.message);
          emailError = err.message;
        }
      } else {
        console.warn(`Skipping feedback email to ${recipientEmail} — not allowed in Resend sandbox mode.`);
      }
      return handleSuccess(res, StatusCodes.OK, emailDelivered ? "Feedback sent to the portfolio owner" : "Feedback saved, but email delivery failed.", { emailDelivered, ...(emailError ? { emailError } : {}) });
    } catch (error) { return handleError(res, error.code === "LLM_NOT_CONFIGURED" ? StatusCodes.SERVICE_UNAVAILABLE : StatusCodes.BAD_GATEWAY, error.message); }
  };

  static clear = async (req, res) => {
    try { await AIConversation.deleteOne({ sessionId: safeText(req.params.sessionId, 100) }); return handleSuccess(res, StatusCodes.OK, "Conversation cleared"); }
    catch (error) { return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message); }
  };

  static analytics = async (_req, res) => {
    try {
      const [totalChats, completedChats, failedChats, totals, recent] = await Promise.all([
        AIConversation.countDocuments(), AIConversation.countDocuments({ status: "completed" }), AIConversation.countDocuments({ status: "failed" }),
        AIConversation.aggregate([{ $group: { _id: null, messages: { $sum: "$messageCount" } } }]),
        AIConversation.find().sort({ updatedAt: -1 }).limit(10).select("sessionId messageCount status updatedAt provider model").lean(),
      ]);
      return handleSuccess(res, StatusCodes.OK, "AI analytics retrieved", { totalChats, completedChats, failedChats, totalMessages: totals[0]?.messages || 0, recent });
    } catch (error) { return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message); }
  };
}
export default aiControllers;
