document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");
  const statusBanner = document.getElementById("statusBanner");
  let statusTimeout;

  if (!form) {
    return;
  }

  function clearStatusTimer() {
    if (statusTimeout) {
      clearTimeout(statusTimeout);
      statusTimeout = null;
    }
  }

  function setStatus(message, type = "success") {
    if (!statusBanner) {
      return;
    }

    clearStatusTimer();
    statusBanner.textContent = message;
    statusBanner.classList.remove("show", "success", "error");
    statusBanner.classList.add("show", type);

    statusTimeout = window.setTimeout(() => {
      statusBanner.classList.remove("show", "success", "error");
      statusBanner.textContent = "";
    }, 10000);
  }

  function clearErrors() {
    const errorElements = document.querySelectorAll(".field-error");
    errorElements.forEach((el) => {
      el.textContent = "";
    });

    const errorGroups = document.querySelectorAll(".form-group.error");
    errorGroups.forEach((group) => group.classList.remove("error"));
  }

  function getFriendlyMessage(errorText) {
    const text = String(errorText || "").toLowerCase();

    if (
      text.includes("smtp") ||
      text.includes("mail") ||
      text.includes("app password")
    ) {
      return "We couldn’t send the reset email right now. Please try again in a moment.";
    }

    if (text.includes("email is required")) {
      return "Please enter the email address linked to your account.";
    }

    if (text.includes("invalid") || text.includes("not found")) {
      return "We couldn’t find an account with that email. Please check the email and try again.";
    }

    return "We couldn’t complete that request right now. Please try again in a moment.";
  }

  emailInput?.addEventListener("input", () => {
    const group = document.getElementById("emailGroup");
    const errorElement = document.getElementById("emailError");
    group?.classList.remove("error");
    errorElement.textContent = "";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const email = emailInput?.value.trim();

    if (!email) {
      const group = document.getElementById("emailGroup");
      const errorElement = document.getElementById("emailError");
      group?.classList.add("error");
      errorElement.textContent = "Email is required.";
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({ email }),
      });

      const rawText = await response.text();
      let data = {};

      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (parseError) {
        console.warn("Forgot password response was not valid JSON:", rawText);
      }

      if (!response.ok) {
        const friendlyMessage = getFriendlyMessage(data.error);
        setStatus(friendlyMessage, "error");
        return;
      }

      setStatus(
        data.message ||
          "If the email you provided exists, a reset link has been sent to it.",
        "success",
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      setStatus(
        "We couldn’t complete your request right now. Please try again in a moment.",
        "error",
      );
    }
  });
});
