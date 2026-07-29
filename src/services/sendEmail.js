import dotenv from "dotenv";
import nodemailer from "nodemailer";
import EmailDelivery from "../database/models/EmailDelivery.js";
import { buildEmail } from "../utils/EmailTemplates.js";

dotenv.config({ quiet: true });

const port = Number(process.env.SMTP_HOST_PORT) || 465;


const emailPassword = process.env.SMTP_GMAIL_SENDER_PASSWORD
  ? process.env.SMTP_GMAIL_SENDER_PASSWORD.replace(/\s+/g, "")
  : "";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
  secure: port === 465, 
  auth: {
    user: process.env.SMTP_GMAIL_SENDER_EMAIL,
    pass: emailPassword,
  },
  family: 4, 
  connectionTimeout: 10000,
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
    console.error("❌ Nodemailer sendMail Error:", emailError);

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
      console.warn("⚠️ Could not write email failure log to Database:", dbError.message);
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
    console.warn("⚠️ Email sent, but failed to record in Database log:", dbError.message);
  }

  return info;
};

export const getEmailTransportStatus = () => ({
  configured: Boolean(
    (process.env.SMTP_HOST || "smtp.gmail.com") &&
      process.env.SMTP_GMAIL_SENDER_EMAIL &&
      process.env.SMTP_GMAIL_SENDER_PASSWORD
  ),
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
});