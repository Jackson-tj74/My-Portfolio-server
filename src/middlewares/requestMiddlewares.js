/** @format */

import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';

import { handleError } from '../utils/responseUtils.js';

export const routeBodyValidation = (schema) => async (req, res, next) => {
  try {
    
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessage = `${error.details[0].message} in the body`;
      return handleError(res, StatusCodes.BAD_REQUEST, errorMessage);
    }
    return next();
  } catch (error) {
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const routeParamsValidation = (schema) => async (req, res, next) => {
  try {
    const { error } = schema.validate(req.params, { abortEarly: false });
    if (error) {
      const errorMessage = `${error.details[0].message} in the params`;
      return handleError(res, StatusCodes.BAD_REQUEST, errorMessage);
    }
    return next();
  } catch (error) {
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

export const routeQueryValidation = (schema) => async (req, res, next) => {
  try {
    const { error } = schema.validate(req.query, { abortEarly: false });
    if (error) {
      const errorMessage = `${error.details[0].message} in the query`;
      return handleError(res, StatusCodes.BAD_REQUEST, errorMessage);
    }
    return next();
  } catch (error) {
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

// connect-multiparty leaves every form field as a string. Normalize the
// portfolio fields before the controller applies the normal Joi schema.
export const normalizePortfolioMultipart = (req, _res, next) => {
  if (typeof req.body?.data === "string") {
    try { req.body.data = JSON.parse(req.body.data); }
    catch { return next(Object.assign(new Error("Custom data must be valid JSON"), { statusCode: StatusCodes.BAD_REQUEST })); }
  }
  if (req.body?.featured !== undefined) req.body.featured = req.body.featured === "true";
  if (req.body?.sortOrder !== undefined) req.body.sortOrder = Number(req.body.sortOrder);
  next();
};
