import randomstring from 'randomstring';
import jwt from "jsonwebtoken"

const requireJwtSecret = () => {
  const jwtSecret = process.env.SECRET_KEY;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("SECRET_KEY must be configured with at least 32 characters");
  }
  return jwtSecret;
};

const generateAccessToken = (id) => {
  return jwt.sign({ id }, requireJwtSecret(), { expiresIn: "1d" });
};

const verifyToken = (token) => {
  return jwt.verify(token, requireJwtSecret());
};
const generateRandomString = ()=> {
  return randomstring.generate(process.env.RANDOM_STRING_LENGTH);
};

const generateOtp = () => {
  return randomstring.generate({ length: 6, charset: 'numeric' });
};

export { generateAccessToken, verifyToken, generateRandomString, generateOtp };
