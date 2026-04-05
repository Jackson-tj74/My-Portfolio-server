import dotenv from "dotenv";
import nodemailer from "nodemailer";

import {  ContactMeTemplate, welcomePortfolioTemplate } from "../utils/EmailTemplates.js";
import { thankYouContactTemplate } from "../utils/EmailTemplates.js";


dotenv.config({ quiet: true });

export const sendEmail = async (email) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_HOST_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_GMAIL_SENDER_EMAIL,
      pass: process.env.SMTP_GMAIL_SENDER_PASSWORD,
    },
    family: 4,
  });

  try {
  if (email?.action === 'wellcome-message') return await transporter.sendMail(welcomePortfolioTemplate(email?.receiverEmail, email?.action, email?.link));
  if (email?.action === 'thank-message') return await transporter.sendMail(thankYouContactTemplate(email?.receiverEmail, email?.action, email?.link));
 if (email?.action === "contact-us") return await transporter.sendMail(ContactMeTemplate(email.receiverEmail,email.fullName,email.email,email.subject,email.message) );
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};