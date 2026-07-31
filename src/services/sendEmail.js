import dotenv from "dotenv";
import { Resend } from "resend";
import EmailDelivery from "../database/models/EmailDelivery.js";
import { buildEmail } from "../utils/EmailTemplates.js";

dotenv.config({ quiet: true });

const resend = new Resend(process.env.RESEND_API_KEY);

export const isSandboxMode = () =>
  (process.env.RESEND_FROM_EMAIL || "").includes("onboarding@resend.dev");

export const getEmailConfig = () => ({
  configured: Boolean(process.env.RESEND_API_KEY),
  provider: "resend",
  from: process.env.RESEND_FROM_EMAIL || "Acme <onboarding@resend.dev>",
  sandbox: isSandboxMode(),
  adminEmail: process.env.ADMIN_EMAIL || "",
  warning: isSandboxMode()
    ? "Using Resend sandbox address. Verify a domain at resend.com/domains to send to any address."
    : "",
});

export const canSendToEmail = (email) => {
  if (!email) return false;
  if (!isSandboxMode()) return true;
  return email.toLowerCase() === (process.env.ADMIN_EMAIL || "").toLowerCase();
};

export const sendEmail = async (options) => {
  const type = options.action || options.type;
  const mail = buildEmail(type, options);

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Acme <onboarding@resend.dev>",
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    if (error) throw new Error(error.message);

    EmailDelivery.create({
      type,
      recipient: Array.isArray(mail.to) ? mail.to.join(",") : mail.to,
      subject: mail.subject,
      status: "sent",
      providerMessageId: data.id,
      relatedId: options.relatedId || "",
    }).catch((err) => console.error("DB Log error:", err.message));

    return data;
  } catch (error) {
    console.error("Email sending failed:", error.message);

    EmailDelivery.create({
      type,
      recipient: Array.isArray(mail.to) ? mail.to.join(",") : mail.to,
      subject: mail.subject,
      status: "failed",
      error: error.message,
      relatedId: options.relatedId || "",
    }).catch((err) => console.error("DB Log error:", err.message));

    throw error;
  }
};