import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["message", "content", "email", "login", "security", "upload", "system"], default: "system", index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  link: { type: String, trim: true, maxlength: 300, default: "" },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  readAt: { type: Date, default: null, index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, deletedAt: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, readAt: 1, deletedAt: 1 });

export default mongoose.model("Notification", notificationSchema);
