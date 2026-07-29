import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true },
  service: { type: String, required: true, trim: true, maxlength: 80 },
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  status: { type: String, enum: ["unread", "read", "archived"], default: "unread", index: true },
  repliedAt: { type: Date, default: null },
}, { timestamps: true });

messageSchema.index({ createdAt: -1 });
messageSchema.index({ email: 1 });

export default mongoose.model("Message", messageSchema);
