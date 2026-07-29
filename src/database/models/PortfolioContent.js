import mongoose from "mongoose";

export const CONTENT_KINDS = [
  "projects", "blogs", "services", "skills", "experience", "education", "languages",
  "certificates", "testimonials", "gallery",
];

const portfolioContentSchema = new mongoose.Schema({
  kind: { type: String, enum: CONTENT_KINDS, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  slug: { type: String, required: true, trim: true, lowercase: true },
  excerpt: { type: String, trim: true, maxlength: 500, default: "" },
  image: { type: String, default: "" },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ["draft", "published"], default: "draft", index: true },
  featured: { type: Boolean, default: false, index: true },
  sortOrder: { type: Number, default: 0, index: true },
  deletedAt: { type: Date, default: null, index: true },
}, { timestamps: true });

portfolioContentSchema.index({ kind: 1, slug: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
portfolioContentSchema.index({ kind: 1, status: 1, sortOrder: 1, createdAt: -1 });

export default mongoose.model("PortfolioContent", portfolioContentSchema);
