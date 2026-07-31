import { StatusCodes } from "http-status-codes";
import NewsletterSubscription from "../../database/models/NewsletterSubscription.js";
import { handleError, handleSuccess } from "../../utils/responseUtils.js";
import { sendEmail, getEmailConfig } from "../../services/sendEmail.js";

class emailControllers {
  static subscribe = async (req, res) => {
    try {
      const email = req.body.email.toLowerCase();
      const subscription = await NewsletterSubscription.findOneAndUpdate({ email }, { email, status: "active" }, { new: true, upsert: true, setDefaultsOnInsert: true });
      // Confirmation email is best-effort; the subscription is already saved.
      void sendEmail({ action: "newsletter", receiverEmail: email, subject: "Newsletter subscription confirmed", message: "You are now subscribed to portfolio updates." }).catch((err) => console.error("Newsletter email failed:", err.message));
      return handleSuccess(res, StatusCodes.CREATED, "Newsletter subscription confirmed", subscription);
    } catch (error) { return handleError(res, error.code === 11000 ? StatusCodes.CONFLICT : StatusCodes.BAD_GATEWAY, error.message); }
  };

  static transportStatus = async (_req, res) => handleSuccess(res, StatusCodes.OK, "Email transport status", getEmailConfig());
}
export default emailControllers;
