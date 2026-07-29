import { StatusCodes } from "http-status-codes";
import Notification from "../../database/models/Notification.js";
import { handleError, handleSuccess } from "../../utils/responseUtils.js";
import { emitToUser } from "../../services/realtimeService.js";

const currentUser = (req) => req.user?._id;

class notificationControllers {
  static list = async (req, res) => {
    try {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
      const query = { recipient: currentUser(req), deletedAt: null };
      if (req.query.read === "true") query.readAt = { $ne: null };
      if (req.query.read === "false") query.readAt = null;
      const [items, total, unread] = await Promise.all([
        Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        Notification.countDocuments(query),
        Notification.countDocuments({ recipient: currentUser(req), deletedAt: null, readAt: null }),
      ]);
      return handleSuccess(res, StatusCodes.OK, "Notifications retrieved", { items, unread, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) { return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message); }
  };

  static markRead = async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: currentUser(req), deletedAt: null }, { readAt: new Date() }, { new: true }).lean();
      if (!notification) return handleError(res, StatusCodes.NOT_FOUND, "Notification not found");
      emitToUser(currentUser(req), "notification:updated", notification);
      return handleSuccess(res, StatusCodes.OK, "Notification marked as read", notification);
    } catch (error) { return handleError(res, StatusCodes.BAD_REQUEST, "Invalid notification id"); }
  };

  static markAllRead = async (req, res) => {
    try {
      await Notification.updateMany({ recipient: currentUser(req), deletedAt: null, readAt: null }, { readAt: new Date() });
      emitToUser(currentUser(req), "notification:all-read", {});
      return handleSuccess(res, StatusCodes.OK, "Notifications marked as read");
    } catch (error) { return handleError(res, StatusCodes.INTERNAL_SERVER_ERROR, error.message); }
  };

  static remove = async (req, res) => {
    try {
      const notification = await Notification.findOneAndUpdate({ _id: req.params.id, recipient: currentUser(req), deletedAt: null }, { deletedAt: new Date() }, { new: true }).lean();
      if (!notification) return handleError(res, StatusCodes.NOT_FOUND, "Notification not found");
      emitToUser(currentUser(req), "notification:deleted", { id: req.params.id });
      return handleSuccess(res, StatusCodes.OK, "Notification deleted");
    } catch (error) { return handleError(res, StatusCodes.BAD_REQUEST, "Invalid notification id"); }
  };
}

export default notificationControllers;
