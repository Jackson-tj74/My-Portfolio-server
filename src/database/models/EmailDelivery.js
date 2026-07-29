import mongoose from "mongoose";

const emailDeliverySchema = new mongoose.Schema({
  type: { type: String, required: true, index: true },
  recipient: { type: String, required: true, lowercase: true, trim: true },
  subject: { type: String, required: true },
  status: { type: String, enum: ["sent", "failed"], required: true, index: true },
  providerMessageId: { type: String, default: "" },
  error: { type: String, default: "" },
  relatedId: { type: String, default: "" },
}, { timestamps: true });

emailDeliverySchema.index({ createdAt: -1 });
export default mongoose.model("EmailDelivery", emailDeliverySchema);
