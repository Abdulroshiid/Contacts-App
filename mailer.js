require("dotenv").config();
const nodemailer = require("nodemailer");

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return (
    normalized.includes("your-") ||
    normalized.includes("your") ||
    normalized.includes("placeholder") ||
    normalized === "your-email@gmail.com" ||
    normalized === "your-app-password" ||
    normalized === "your-gmail-app-password"
  );
}

function createTransporter() {
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL);
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  if (isPlaceholder(host) || isPlaceholder(user) || isPlaceholder(pass)) {
    return { placeholder: true };
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_PORT || "587") === "465",
    auth: {
      user,
      pass,
    },
  });
}

function formatMailErrorMessage(error) {
  const rawMessage = error?.response || error?.message || String(error || "");
  const normalized = String(rawMessage).toLowerCase();

  if (
    normalized.includes("invalid login") ||
    normalized.includes("bad credentials") ||
    normalized.includes("username and password") ||
    normalized.includes("auth")
  ) {
    return "The email server rejected the login. Please check your Gmail app password in .env and try again.";
  }

  if (
    normalized.includes("econnrefused") ||
    normalized.includes("getaddrinfo") ||
    normalized.includes("timed out") ||
    normalized.includes("connect")
  ) {
    return "The email server could not be reached. Please check your SMTP host, port, and network connection.";
  }

  if (
    normalized.includes("certificate") ||
    normalized.includes("self signed")
  ) {
    return "The email server connection is being blocked by a certificate issue. Please review your SMTP settings.";
  }

  return "We could not send the reset email. Please check your SMTP settings and try again.";
}

async function sendPasswordResetEmail(toEmail, resetLink) {
  const transporter = createTransporter();

  if (!transporter) {
    const message =
      "SMTP is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS, and optionally SMTP_FROM to send reset emails.";
    console.error("[password-reset]", message);
    return { skipped: true, reason: message };
  }

  if (transporter.placeholder) {
    const message =
      "SMTP credentials are still placeholders. Replace SMTP_USER and SMTP_PASS in .env with your real Gmail address and app password, then restart the app.";
    console.error("[password-reset]", message);
    return { skipped: true, reason: message };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

  try {
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
  } catch (error) {
    const message = formatMailErrorMessage(error);
    console.error("[password-reset]", message);
    return { skipped: true, reason: message };
  }
}

module.exports = { sendPasswordResetEmail, formatMailErrorMessage };
