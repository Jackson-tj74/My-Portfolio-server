import randomstring from 'randomstring';
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.SECRET_KEY || "fallback_secret";

const generateAccessToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "1d" });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
const generateRandomString = ()=> {
  return randomstring.generate(process.env.RANDOM_STRING_LENGTH);
};

const generateOtp = () => {
  return randomstring.generate({ length: 6, charset: 'numeric' });
};

export { generateAccessToken, verifyToken, generateRandomString, generateOtp };
