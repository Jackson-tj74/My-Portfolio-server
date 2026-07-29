import Joi from "joi";

export const replySchema = Joi.object({ reply: Joi.string().trim().min(1).max(5000).required() }).options({ allowUnknown: false });
export const newsletterSchema = Joi.object({ email: Joi.string().trim().email().required() }).options({ allowUnknown: false });
