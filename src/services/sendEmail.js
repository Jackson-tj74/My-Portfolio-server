import dotenv from "dotenv";
import nodemailer from "nodemailer";

import {  welcomePortfolioTemplate } from "../utils/wellcomeTemplateUtils.js";
import { thankYouContactTemplate } from "../utils/thanksTemplate.js";

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
  });

  try {
  if (email?.action === 'my-portfoliotj.vercel.app') return await transporter.sendMail(welcomePortfolioTemplate(email?.receiverEmail, email?.action, email?.link));
  if (email?.action === 'https://my-portfoliotj.vercel.app') return await transporter.sendMail(thankYouContactTemplate(email?.receiverEmail, email?.action, email?.link));
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};