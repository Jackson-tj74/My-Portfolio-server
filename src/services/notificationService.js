import Notification from "../database/models/Notification.js";
import User from "../database/models/User.js";
import { emitToUser } from "./realtimeService.js";
import { sendEmail } from "./sendEmail.js";

export const createNotification = async ({ recipient, type, title, message, link = "", metadata = {} }) => {
  const notification = await Notification.create({ recipient, type, title, message, link, metadata });
  emitToUser(recipient, "notification:new", notification.toObject());
  const user = await User.findById(recipient).select("email").lean();
  if (user?.email) void sendEmail({ action: "notification", receiverEmail: user.email, subject: title, message, link }).catch(() => {});
  return notification;
};

export const notifyProviders = async (payload) => {
  const providers = await User.find({ role: "provider" }).select("_id").lean();
  return Promise.all(providers.map(({ _id }) => createNotification({ ...payload, recipient: _id })));
};
