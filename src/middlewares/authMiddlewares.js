import { StatusCodes } from "http-status-codes";
import {  FindUserByID } from "../modules/auth/authRepositories.js"
import { handleError,handleSuccess } from "../utils/responseUtils.js";

import { verifyToken } from "../utils/jwtUtils.js";




const verifyAccessToken = (passRoles) => {
  return async (req,res,next)=>{
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

    const decoded = verifyToken(token);

    if (!decoded?.id) {
      return handleError(res, StatusCodes.UNAUTHORIZED, "Invalid token");
    }

    const user = await FindUserByID(decoded.id);

    if (!user) {
      return handleError(res, StatusCodes.NOT_FOUND, "Unauthenticated");
    }

    if (!passRoles.includes(user.role)) {
          return res.status(401).json({ status: 403, message: 'Unauthorized' });
        }

    req.user = user;
    req.token = token;

    next();

  } catch (error) {
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
  }
};




export {
verifyAccessToken
}
