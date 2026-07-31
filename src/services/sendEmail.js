import dotenv from "dotenv";
import nodemailer from "nodemailer";
import EmailDelivery from "../database/models/EmailDelivery.js";
import { buildEmail } from "../utils/EmailTemplates.js";

dotenv.config({ quiet: true });

const emailUser = process.env.SMTP_GMAIL_SENDER_EMAIL;
const rawPassword = process.env.SMTP_GMAIL_SENDER_PASSWORD;

const emailPassword = rawPassword ? rawPassword.replace(/\s+/g, "") : "";

const port = Number(process.env.SMTP_HOST_PORT) || 587;

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: port,
  secure: port === 465, 
  auth: {
    user: emailUser,
    pass: emailPassword,
  },

  family: 4, 
  dnsTimeout: 10000,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  tls: {
   
    rejectUnauthorized: false
  }
});

export const verifyEmailTransport = async () => {
  try {
    const verification = await transporter.verify();
    console.log("✅ SMTP Server is ready to send messages");
    return verification;
  } catch (error) {
    console.error("❌ SMTP Verification Failed:", error.message);
    throw error;
  }
};

export const sendEmail = async (options) => {
  const type = options.action || options.type;
  const mail = buildEmail(type, options);

  let info;

  try {
    info = await transporter.sendMail(mail);
    console.log("✅ Email sent successfully:", info.messageId);
  } catch (emailError) {
    console.error("❌ Nodemailer sendMail Error:", emailError.message);

    try {
      await EmailDelivery.create({
        type,
        recipient: mail.to,
        subject: mail.subject,
        status: "failed",
        error: emailError.message,
        relatedId: options.relatedId || "",
      });
    } catch (dbError) {
      console.warn("⚠️ Could not write failure log to DB:", dbError.message);
    }

    throw emailError;
  }

  try {
    await EmailDelivery.create({
      type,
      recipient: mail.to,
      subject: mail.subject,
      status: "sent",
      providerMessageId: info.messageId,
      relatedId: options.relatedId || "",
    });
  } catch (dbError) {
    console.warn("⚠️ Email sent, but failed to log to DB:", dbError.message);
  }

  return info;
};

export const getEmailTransportStatus = () => ({
  configured: Boolean(emailUser && emailPassword),
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
});