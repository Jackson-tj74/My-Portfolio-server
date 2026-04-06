import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { 
  ContactMeTemplate, 
  welcomePortfolioTemplate, 
  thankYouContactTemplate 
} from "../utils/EmailTemplates.js";

dotenv.config({ quiet: true });

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_HOST_PORT) || 465,
  secure: true, 
  auth: {
    user: process.env.SMTP_GMAIL_SENDER_EMAIL,
    pass: process.env.SMTP_GMAIL_SENDER_PASSWORD,
  },
  family: 4, 
});


export const sendEmail = async (options) => {
  const { action, receiverEmail, fullName, email, subject, message, link } = options;

  try {
    let mailOptions;

    switch (action) {
      case "welcome-message":
        
        mailOptions = welcomePortfolioTemplate(receiverEmail, action, link);
        break;

      case "thank-message":
        mailOptions = thankYouContactTemplate(receiverEmail, action, link);
        break;

      case "contact-us":
        mailOptions = ContactMeTemplate(receiverEmail, fullName, email, subject, message);
        break;

      default:
        console.warn(`No template found for action: ${action}`);
        return null;
    }

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error(`Email sending failed for action [${action}]:`, error);
    throw error; 
  }
};
