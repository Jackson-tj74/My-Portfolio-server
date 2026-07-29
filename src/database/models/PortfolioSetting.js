import mongoose from "mongoose";

const portfolioSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, trim: true, lowercase: true },
  value: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

export default mongoose.model("PortfolioSetting", portfolioSettingSchema);
