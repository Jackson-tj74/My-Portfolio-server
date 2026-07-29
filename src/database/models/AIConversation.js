import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true, maxlength: 12000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const aiConversationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  messages: { type: [messageSchema], default: [] },
  provider: { type: String, default: "configured-provider" },
  model: { type: String, default: "" },
  status: { type: String, enum: ["active", "completed", "failed"], default: "active", index: true },
  lastError: { type: String, default: "" },
  messageCount: { type: Number, default: 0 },
}, { timestamps: true });

aiConversationSchema.index({ sessionId: 1, updatedAt: -1 });
aiConversationSchema.index({ createdAt: -1 });

export default mongoose.model("AIConversation", aiConversationSchema);
