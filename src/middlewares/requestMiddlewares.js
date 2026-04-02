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
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
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
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
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
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);
  }
};
