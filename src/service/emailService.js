import nodemailer from "nodemailer";
import { emailConfig } from "../config/emailConfig.js";
import ApiError from "../utils/apiError.js";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.user,
        pass: emailConfig.pass,
      },
    });
  }

  return transporter;
};

export const sendEmail = async ({ to, subject, html }) => {
  if (!to || !subject || !html) {
    throw new ApiError(400, "Email recipient, subject and html are required");
  }

  const mailer = getTransporter();

  try {
    const info = await mailer.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to,
      subject,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    throw new ApiError(500, `Failed to send email: ${error.message}`);
  }
};
