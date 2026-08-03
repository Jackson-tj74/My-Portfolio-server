import { StatusCodes } from "http-status-codes";
import { FindUserByID } from "../modules/auth/authRepositories.js";
import { handleError } from "../utils/responseUtils.js";
import { verifyToken } from "../utils/jwtUtils.js";

const verifyAccessToken = (passRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return handleError(res, StatusCodes.UNAUTHORIZED, "Token missing");
      }

      const parts = authHeader.split(" ");

      if (parts.length !== 2 || parts[0] !== "Bearer") {
        return handleError(res, StatusCodes.UNAUTHORIZED, "Invalid token format");
      }

      const token = parts[1];

      let decoded;
      try {
        decoded = verifyToken(token);
      } catch {
        return handleError(res, StatusCodes.UNAUTHORIZED, "Invalid or expired token");
      }

      if (!decoded?.id) {
        return handleError(res, StatusCodes.UNAUTHORIZED, "Invalid token");
      }

      const user = await FindUserByID(decoded.id);

      if (!user) {
        return handleError(res, StatusCodes.UNAUTHORIZED, "User not found");
      }

      const allowedRoles = Array.isArray(passRoles) ? passRoles : [passRoles];
      if (!allowedRoles.includes(user.role)) {
        return handleError(res, StatusCodes.FORBIDDEN, "Insufficient permissions");
      }

      req.user = user;
      req.token = token;

      return next();
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };
};

export { verifyAccessToken };