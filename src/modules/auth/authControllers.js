

import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../database/models/User.js";
import Message from "../../database/models/Message.js";
import { sendEmail } from "../../services/sendEmail.js";
import { handleError, handleSuccess } from "../../utils/responseUtils.js";
import { StatusCodes } from "http-status-codes";

class authControllers{


 
 static signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return handleError(res, StatusCodes.CONFLICT, "User already exist");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const MyportfolioLink = `${process.env.CLIENT_URL}/my-portfoliotj.vercel.app`;

    await sendEmail({
      action: "my-portfoliotj.vercel.app",
      receiverEmail: user.email,
      link: MyportfolioLink,
    });

    return handleSuccess(res, StatusCodes.CREATED, "User successfully created", user);
  } catch (error) {
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

// LOGIN
 static login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return handleError(
        res,
        StatusCodes.NOT_FOUND,
        "Please register your account",
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       return handleError(
        res,
        StatusCodes.UNAUTHORIZED,
        "Invalid email or Password",
      );
    }

    const token = jwt.sign(
      { id: user._id },
      "secretkey",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
      },
    });
   

  } catch (error) {
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
}

static message = async (req, res) => {
  try {
    const { name, email, service, message } = req.body;

    const newMessage = new Message({
      name,
      email,
      service,
      message,
    });

    await newMessage.save();

   const MyportfolioLink = `${process.env.CLIENT_URL}https://my-portfoliotj.vercel.app`;

    await sendEmail({
      action: "https://my-portfoliotj.vercel.app",
      receiverEmail: email,
      link: MyportfolioLink,
    });

   return handleSuccess(
      res,
      StatusCodes.CREATED,
      'Message sent successfully',
      newMessage,
    );
   

  } catch (error) {
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
}

}
export default authControllers

