/** @format */

import Joi from "joi";

export const signinSchema = Joi.object({
  email: Joi.string().trim().email().required().messages({
    "string.empty": "Email is required.",
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required.",
  }),

  password: Joi.string()
    .trim()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must not exceed 20 characters.",
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one number, and one special character.",
      "any.required": "Password is required.",
    }),
})
.options({ allowUnknown: false })
.messages({
  "object.unknown": "Invalid field provided.",
});
export const signupSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Name is required.",
      "string.min": "Name must be at least 3 characters long.",
      "string.max": "Name must not exceed 50 characters.",
      "any.required": "Name is required.",
    }),

  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required.",
      "string.email": "Please enter a valid email address.",
      "any.required": "Email is required.",
    }),

  password: Joi.string()
    .trim()
    .min(8)
    .max(20)
    .pattern(/^(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/)
    .required()
    .messages({
      "string.empty": "Password is required.",
      "string.min": "Password must be at least 8 characters long.",
      "string.max": "Password must not exceed 20 characters.",
      "string.pattern.base":
        "Password must contain at least one lowercase letter, one number, and one special character.",
      "any.required": "Password is required.",
    }),
});
export const contactSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "Name is required.",
      "string.min": "Name must be at least 3 characters long.",
      "any.required": "Name is required.",
    }),

  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      "string.empty": "Email is required.",
      "string.email": "Please enter a valid email address.",
      "any.required": "Email is required.",
    }),

  service: Joi.string()
    .valid("Web Development", "Cloud Solutions", "Other")
    .required()
    .messages({
      "any.only":
        "Service must be one of the following: Web Development, Cloud Solutions, or Other.",
      "any.required": "Service is required.",
    }),

  message: Joi.string()
    .trim()
    .min(10)
    .max(500)
    .required()
    .messages({
      "string.empty": "Message is required.",
      "string.min": "Message must be at least 10 characters long.",
      "string.max": "Message must not exceed 500 characters.",
      "any.required": "Message is required.",
    }),
});