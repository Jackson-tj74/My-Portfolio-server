import dotenv from "dotenv";
import nodemailer from "nodemailer";
import EmailDelivery from "../database/models/EmailDelivery.js";
import { buildEmail } from "../utils/EmailTemplates.js";

dotenv.config({ quiet: true });

const port = Number(process.env.SMTP_HOST_PORT) || 465;
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: { user: process.env.SMTP_GMAIL_SENDER_EMAIL, pass: process.env.SMTP_GMAIL_SENDER_PASSWORD },
  family: 4,
});

export const verifyEmailTransport = () => transporter.verify();

export const sendEmail = async (options) => {
  const type = options.action || options.type;
  const mail = buildEmail(type, options);
  try {
    const info = await transporter.sendMail(mail);
    await EmailDelivery.create({ type, recipient: mail.to, subject: mail.subject, status: "sent", providerMessageId: info.messageId, relatedId: options.relatedId || "" });
    return info;
  } catch (error) {
    await EmailDelivery.create({ type, recipient: mail.to, subject: mail.subject, status: "failed", error: error.message, relatedId: options.relatedId || "" }).catch(() => {});
    throw error;
  }
};

export const getEmailTransportStatus = () => ({ configured: Boolean(process.env.SMTP_HOST && process.env.SMTP_GMAIL_SENDER_EMAIL && process.env.SMTP_GMAIL_SENDER_PASSWORD), host: process.env.SMTP_HOST || "", port });
