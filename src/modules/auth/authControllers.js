
import bcrypt from "bcrypt";
import { handleError,handleSuccess } from "../../utils/responseUtils.js";
import { StatusCodes } from "http-status-codes";
import { sendEmail } from "../../services/sendEmail.js";


import { 
  createUser, findUser, deleteOneToken, FindUserByID, 
  updatedProfile, createMessage, getAllMessages, findMessageAndDelete,deleteUserComplete
} from './authRepositories.js';


import { generateAccessToken } from '../../utils/jwtUtils.js';

class authControllers {
  
  static signup = async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const userExists = await findUser({ email });
      if (userExists) return handleError(res, StatusCodes.CONFLICT, "User already exists");

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createUser({ name, email, password: hashedPassword });

      await sendEmail({
        action: "wellcome-message",
        receiverEmail: user.email,
        link: `${process.env.CLIENT_URL}/projects`,
      });

      return handleSuccess(res, StatusCodes.CREATED, "User successfully created", user);
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static login = async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await findUser({ email });
      if (!user) return handleError(res, StatusCodes.UNAUTHORIZED, "Please register your account");

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return handleError(res, StatusCodes.UNAUTHORIZED, "Invalid email or password");

      
      const token = generateAccessToken(user._id);

      return res.status(StatusCodes.OK).json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static message = async (req, res) => {
    try {
      const { name, email, service, message } = req.body;

      const newMessage = await createMessage({ name, email, service, message });

     
      await sendEmail({
        action: "contact-us",
        receiverEmail: process.env.SMTP_GMAIL_SENDER_EMAIL,
        fullName: name,
        email: email,
        subject: service || "New Contact Message",
        message: message,
      });

      
      await sendEmail({
        action: "thank-message",
        receiverEmail: email,
        link: "https://my-portfolio-tj.netlify.app",
      });

      return handleSuccess(res, StatusCodes.CREATED, "Message sent successfully", newMessage);
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static findMessages = async (req, res) => {
    try {
      const visitorsMessages = await getAllMessages();
      if (!visitorsMessages || visitorsMessages.length === 0) {
        return handleError(res, StatusCodes.NOT_FOUND, "No messages found");
      }
      return handleSuccess(res, StatusCodes.OK, "Messages retrieved successfully", visitorsMessages);
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static deleteMessage = async (req, res) => {
    try {
      const { id } = req.params; 
      const deleted = await findMessageAndDelete(id);
      if (!deleted) return handleError(res, StatusCodes.NOT_FOUND, "Message not found");

      return handleSuccess(res, StatusCodes.OK, "Message deleted successfully");
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static logout = async (req, res) => {
    try {
      const deviceId = req.deviceId;
      const userId = req.user?._id;

      await deleteOneToken({ userId, deviceId });
      return handleSuccess(res, StatusCodes.OK, "Logged out successfully");
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static getProfile = async (req, res) => {
    try {
      const userProfile = await FindUserByID(req.user?._id);
      return handleSuccess(res, StatusCodes.OK, "Profile retrieved", userProfile);
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static updateProfile = async (req, res) => {
    try {
      const updatedUser = await updatedProfile(req.user?._id, req.body);
      return handleSuccess(res, StatusCodes.OK, 'Profile updated successfully', updatedUser);
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static deleteAccount = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return handleError(res, StatusCodes.UNAUTHORIZED, "Unauthorized action");
    }

    const deletedUser = await deleteUserComplete(userId);

    if (!deletedUser) {
      return handleError(res, StatusCodes.NOT_FOUND, "User not found");
    }

    return handleSuccess(res, StatusCodes.OK, "Account and associated data deleted successfully");
  } catch (error) {
    return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }
};

}







export default authControllers;