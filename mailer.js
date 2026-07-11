require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_PORT || "587") === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

async function sendPasswordResetEmail(toEmail, resetLink) {
  if (!transporter) {
    console.log(
      "[password-reset] SMTP is not configured. Reset link:",
      resetLink,
    );
    return { skipped: true };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: fromAddress,
    to: toEmail,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Password reset request</h2>
        <p>We received a request to reset your password.</p>
        <p>Use the link below to choose a new password:</p>
        <p><a href="${resetLink}" style="display: inline-block; padding: 10px 16px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">Reset password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return { skipped: false, messageId: info.messageId };
}

module.exports = { sendPasswordResetEmail };
