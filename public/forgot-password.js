document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotPasswordForm");
  const emailInput = document.getElementById("email");
  const statusBanner = document.getElementById("statusBanner");
  const resetLinkPanel = document.getElementById("resetLinkPanel");
  const resetLink = document.getElementById("resetLink");
  const continueResetBtn = document.getElementById("continueResetBtn");

  if (!form) {
    return;
  }

  function setStatus(message, type = "success") {
    if (!statusBanner) {
      return;
    }

    statusBanner.textContent = message;
    statusBanner.classList.remove("show", "success", "error");
    statusBanner.classList.add("show", type);
  }

  function clearErrors() {
    const errorElements = document.querySelectorAll(".field-error");
    errorElements.forEach((el) => {
      el.textContent = "";
    });

    const errorGroups = document.querySelectorAll(".form-group.error");
    errorGroups.forEach((group) => group.classList.remove("error"));
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
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Unable to prepare a reset link.", "error");
        return;
      }

      setStatus(
        data.message || "If an account exists, a reset link is ready.",
        "success",
      );

      if (data.resetLink) {
        resetLink.href = data.resetLink;
        resetLink.textContent = data.resetLink;
        continueResetBtn.href = data.resetLink;
        resetLinkPanel.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setStatus("An error occurred. Please try again.", "error");
    }
  });
});
