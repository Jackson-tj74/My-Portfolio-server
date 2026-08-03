import bcrypt from "bcrypt";
import { handleError, handleSuccess } from "../../utils/responseUtils.js";
import { StatusCodes } from "http-status-codes";
import { sendEmail, canSendToEmail } from "../../services/sendEmail.js";
import {
  createUser, findUser, deleteOneToken, FindUserByID,
  updatedProfile, createMessage, getAllMessages, countMessages, updateMessage, findMessageAndDelete, deleteUserComplete
} from './authRepositories.js';
import { generateAccessToken } from '../../utils/jwtUtils.js';
import { notifyProviders } from '../../services/notificationService.js';
import Message from '../../database/models/Message.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

class authControllers {

  static signup = async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const userExists = await findUser({ email });
      if (userExists) return handleError(res, StatusCodes.CONFLICT, "User already exists");
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await createUser({ name, email, password: hashedPassword });

      if (canSendToEmail(user.email)) {
        void sendEmail({
          action: "welcome-message",
          receiverEmail: user.email,
          link: `${process.env.CLIENT_URL}/projects`,
        }).catch((err) => console.error("Welcome email failed:", err.message));
      }

      return handleSuccess(res, StatusCodes.CREATED, "User successfully created", {
        id: user._id, name: user.name, email: user.email, role: user.role,
      });
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await findUser({ email: email.toLowerCase() }, true);
      if (!user) return handleError(res, StatusCodes.UNAUTHORIZED, "Please register your account");
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return handleError(res, StatusCodes.UNAUTHORIZED, "Invalid email or password");

      const token = generateAccessToken(user._id);

      await notifyProviders({
        type: "login", title: "Admin login",
        message: `${user.name || user.email} signed in to the dashboard.`,
        link: "/dashboard", metadata: { userId: user._id.toString() },
      }).catch(() => {});

      if (canSendToEmail(user.email)) {
        void sendEmail({
          action: "login-alert",
          receiverEmail: user.email,
          message: `A dashboard login was detected for ${user.email}.`,
        }).catch(() => {});
      }

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

      await notifyProviders({
        type: "message",
        title: "New contact message",
        message: `${name} sent a new ${service || "portfolio"} inquiry.`,
        link: "/dashboard",
        metadata: { messageId: newMessage._id.toString(), senderEmail: email },
      }).catch(() => {});

      const portfolioLink = process.env.PORTFOLIO_URL || "my-portfolio-tj.netlify.app";
      const messageAction = ["Web Development", "Cloud Solutions"].includes(service) ? "project-inquiry" : "contact-us";

      let emailDelivered = false;
      let emailError = null;

      try {
        await sendEmail({
          action: messageAction,
          receiverEmail: process.env.ADMIN_EMAIL,
          fullName: name,
          email,
          subject: service || "New Contact Message",
          message,
          relatedId: newMessage._id.toString(),
        });
        emailDelivered = true;
      } catch (err) {
        console.error("Contact notification email failed:", err.message);
        emailError = err.message;
      }

      let thankYouDelivered = false;
      if (canSendToEmail(email)) {
        try {
          await sendEmail({ action: "thank-message", receiverEmail: email, link: portfolioLink });
          thankYouDelivered = true;
        } catch (err) {
          console.error("Thank-you email failed:", err.message);
        }
      } else {
        console.warn(`Skipping thank-you email to ${email} — not allowed in Resend sandbox mode.`);
      }

      return res.status(StatusCodes.CREATED).json({
        success: true,
        message: emailDelivered ? "Message sent successfully" : "Message saved, but email notification failed.",
        data: newMessage,
        emailDelivered,
        thankYouDelivered,
        ...(emailError ? { emailError } : {}),
      });
    } catch (error) {
      console.error("Controller Error:", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: error.message });
    }
  };

  static replyToMessage = async (req, res) => {
    try {
      const messageRecord = await Message.findById(req.params.id);
      if (!messageRecord) return handleError(res, StatusCodes.NOT_FOUND, "Message not found");
      const { reply } = req.body;

      let emailDelivered = false;
      if (canSendToEmail(messageRecord.email)) {
        try {
          await sendEmail({
            action: "admin-reply",
            receiverEmail: messageRecord.email,
            subject: `Reply to ${messageRecord.service}`,
            reply,
            relatedId: messageRecord._id.toString(),
          });
          emailDelivered = true;
        } catch (err) {
          console.error("Reply email failed:", err.message);
        }
      }

      const updated = await updateMessage(req.params.id, { repliedAt: new Date(), status: "read" });
      return handleSuccess(res, StatusCodes.OK, emailDelivered ? "Reply sent successfully" : "Reply saved, but email delivery failed.", updated);
    } catch (error) {
      return handleError(res, StatusCodes.BAD_GATEWAY, error.message);
    }
  };

  static findMessages = async (req, res) => {
    try {
      const { status, search } = req.query;
      const query = {};
      if (["unread", "read", "archived"].includes(status)) query.status = status;
      if (search?.trim()) {
        const safeSearch = escapeRegex(search.trim());
        query.$or = [
          { name: { $regex: safeSearch, $options: "i" } },
          { email: { $regex: safeSearch, $options: "i" } },
          { service: { $regex: safeSearch, $options: "i" } },
          { message: { $regex: safeSearch, $options: "i" } },
        ];
      }
      const visitorsMessages = await getAllMessages(query);
      return handleSuccess(res, StatusCodes.OK, "Messages retrieved successfully", visitorsMessages);
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static getDashboardStats = async (req, res) => {
    try {
      const [messages, unreadMessages, archivedMessages] = await Promise.all([
        countMessages(), countMessages({ status: "unread" }), countMessages({ status: "archived" }),
      ]);
      return handleSuccess(res, StatusCodes.OK, "Dashboard statistics retrieved", { messages, unreadMessages, archivedMessages });
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static updateMessageStatus = async (req, res) => {
    try {
      const { status } = req.body;
      if (!["unread", "read", "archived"].includes(status)) {
        return handleError(res, StatusCodes.BAD_REQUEST, "Invalid message status");
      }
      const message = await updateMessage(req.params.id, { status });
      if (!message) return handleError(res, StatusCodes.NOT_FOUND, "Message not found");
      return handleSuccess(res, StatusCodes.OK, "Message status updated", message);
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
      const allowedFields = ["name", "location", "phone", "avatar"];
      const updates = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
      }
      const updatedUser = await updatedProfile(req.user?._id, updates);
      return handleSuccess(res, StatusCodes.OK, "Profile updated successfully", updatedUser);
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };

  static deleteAccount = async (req, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) return handleError(res, StatusCodes.UNAUTHORIZED, "Unauthorized action");
      const deletedUser = await deleteUserComplete(userId);
      if (!deletedUser) return handleError(res, StatusCodes.NOT_FOUND, "User not found");
      return handleSuccess(res, StatusCodes.OK, "Account and associated data deleted successfully");
    } catch (error) {
      return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message);
    }
  };
}

export default authControllers;