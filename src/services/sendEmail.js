import dotenv from "dotenv";
import nodemailer from "nodemailer";
import dns from "dns";
import EmailDelivery from "../database/models/EmailDelivery.js";
import { buildEmail } from "../utils/EmailTemplates.js";

dotenv.config({ quiet: true });


dns.setDefaultResultOrder("ipv4first");

export const sendEmail = async (options) => {
  const type = options.action || options.type;
  const mail = buildEmail(type, options);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_HOST_PORT) || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_GMAIL_SENDER_EMAIL,
      pass: process.env.SMTP_GMAIL_SENDER_PASSWORD
        ? process.env.SMTP_GMAIL_SENDER_PASSWORD.replace(/\s+/g, "")
        : "",
    },
    family: 4,
  });

  try {
    const info = await transporter.sendMail(mail);

    
    EmailDelivery.create({
      type,
      recipient: mail.to,
      subject: mail.subject,
      status: "sent",
      providerMessageId: info.messageId,
      relatedId: options.relatedId || "",
    }).catch(() => {});

    return info;
  } catch (error) {
    console.error("Email sending failed:", error);

    EmailDelivery.create({
      type,
      recipient: mail.to,
      subject: mail.subject,
      status: "failed",
      error: error.message,
      relatedId: options.relatedId || "",
    }).catch(() => {});

    throw error;
  }
};