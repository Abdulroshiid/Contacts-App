document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetPasswordForm");
  const statusBanner = document.getElementById("statusBanner");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");

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

  if (!token) {
    setStatus("This reset link is invalid or missing a token.", "error");
  }

  [passwordInput, confirmPasswordInput].forEach((input) => {
    input?.addEventListener("input", () => {
      clearErrors();
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearErrors();

    const password = passwordInput?.value;
    const confirmPassword = confirmPasswordInput?.value;

    if (!password) {
      document.getElementById("passwordGroup")?.classList.add("error");
      const passwordError = document.getElementById("passwordError");
      if (passwordError) passwordError.textContent = "Password is required.";
      return;
    }

    if (password.length < 6) {
      document.getElementById("passwordGroup")?.classList.add("error");
      const passwordError = document.getElementById("passwordError");
      if (passwordError) {
        passwordError.textContent = "Password must be at least 6 characters.";
      }
      return;
    }

    if (!confirmPassword) {
      document.getElementById("confirmPasswordGroup")?.classList.add("error");
      const confirmPasswordError = document.getElementById(
        "confirmPasswordError",
      );
      if (confirmPasswordError) {
        confirmPasswordError.textContent = "Please confirm your password.";
      }
      return;
    }

    if (password !== confirmPassword) {
      document.getElementById("confirmPasswordGroup")?.classList.add("error");
      const confirmPasswordError = document.getElementById(
        "confirmPasswordError",
      );
      if (confirmPasswordError) {
        confirmPasswordError.textContent = "Passwords do not match.";
      }
      return;
    }

    if (!token) {
      setStatus("This reset link is invalid or missing a token.", "error");
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Unable to reset password.", "error");
        return;
      }

      setStatus(data.message || "Password reset successfully.", "success");
      window.setTimeout(() => {
        window.location.href = "/index.html";
      }, 1800);
    } catch (error) {
      console.error("Reset password error:", error);
      setStatus("An error occurred. Please try again.", "error");
    }
  });
});
