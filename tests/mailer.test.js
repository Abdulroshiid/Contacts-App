const test = require("node:test");
const assert = require("node:assert/strict");
const { formatMailErrorMessage } = require("../mailer");

test("formats Gmail authentication errors into a readable message", () => {
  const message = formatMailErrorMessage(
    "Invalid login: 535 Username and Password not accepted",
  );
  assert.equal(
    message,
    "The email server rejected the login. Please check your Gmail app password in .env and try again.",
  );
});

test("formats connection errors into a readable message", () => {
  const message = formatMailErrorMessage("ECONNREFUSED 127.0.0.1:587");
  assert.equal(
    message,
    "The email server could not be reached. Please check your SMTP host, port, and network connection.",
  );
});

test("returns a demo-mode result when SMTP is not configured", async () => {
  const previousConfig = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
  };

  process.env.SMTP_HOST = "";
  process.env.SMTP_USER = "";
  process.env.SMTP_PASS = "";
  process.env.SMTP_FROM = "";

  try {
    const { sendPasswordResetEmail } = require("../mailer");
    const result = await sendPasswordResetEmail(
      "user@example.com",
      "http://localhost:3000/reset-password.html?token=demo-token",
    );

    assert.equal(result.skipped, true);
    assert.equal(result.demoMode, true);
    assert.match(result.reason, /SMTP.*configured|demo mode/i);
  } finally {
    Object.entries(previousConfig).forEach(([key, value]) => {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  }
});
