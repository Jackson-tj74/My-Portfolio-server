import PortfolioContent, { CONTENT_KINDS } from "../database/models/PortfolioContent.js";

const assertKind = (kind) => {
  if (!CONTENT_KINDS.includes(kind)) throw new Error(`Unsupported content type: ${kind}`);
  return kind;
};

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const listContent = async ({ kind, publishedOnly = false, page = 1, limit = 20, search, featured }) => {
  assertKind(kind);
  const query = { kind, deletedAt: null };
  if (publishedOnly) query.status = "published";
  if (featured !== undefined) query.featured = featured === "true";
  if (search?.trim()) query.$or = [
    { title: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
    { excerpt: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } },
  ];
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const [items, total] = await Promise.all([
    PortfolioContent.find(query).sort({ sortOrder: 1, createdAt: -1 }).skip((safePage - 1) * safeLimit).limit(safeLimit),
    PortfolioContent.countDocuments(query),
  ]);
  return { items, pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) } };
};

export const getContent = (kind, id) => {
  assertKind(kind);
  return PortfolioContent.findOne({ _id: id, kind, deletedAt: null });
};

export const createContent = async (kind, payload) => {
  assertKind(kind);
  const slug = slugify(payload.slug || payload.title);
  return PortfolioContent.create({ ...payload, kind, slug });
};

export const updateContent = async (kind, id, payload) => {
  assertKind(kind);
  const update = { ...payload };
  if (payload.slug || payload.title) update.slug = slugify(payload.slug || payload.title);
  return PortfolioContent.findOneAndUpdate({ _id: id, kind, deletedAt: null }, update, { returnDocument: "after", runValidators: true });
};

export const softDeleteContent = (kind, id) => {
  assertKind(kind);
  return PortfolioContent.findOneAndUpdate({ _id: id, kind, deletedAt: null }, { deletedAt: new Date(), status: "draft" }, { returnDocument: "after" });
};
