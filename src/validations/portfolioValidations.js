import Joi from "joi";

export const contentKindSchema = Joi.object({
  kind: Joi.string().valid("projects", "blogs", "services", "skills", "experience", "education", "languages", "certificates", "testimonials", "gallery").required(),
});

export const contentSchema = Joi.object({
  title: Joi.string().trim().min(1).max(160).required(),
  slug: Joi.string().trim().max(180).pattern(/^[a-zA-Z0-9- ]+$/).optional(),
  excerpt: Joi.string().trim().max(500).allow("").default(""),
  image: Joi.string().uri().allow("").optional(),
  data: Joi.object().unknown(true).default({}),
  status: Joi.string().valid("draft", "published").default("draft"),
  featured: Joi.boolean().default(false),
  sortOrder: Joi.number().integer().min(0).max(100000).default(0),
}).options({ allowUnknown: false });

export const contentQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
  featured: Joi.string().valid("true", "false"),
}).options({ allowUnknown: false });
