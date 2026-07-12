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
