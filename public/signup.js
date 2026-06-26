window.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const errorModal = document.getElementById("errorModal");
  const closeButton = document.querySelector(".close");
  const statusBanner = document.getElementById("statusBanner");
  const submitButton = signupForm?.querySelector("button[type='submit']");

  if (!signupForm) {
    return;
  }

  fetch("/api/auth/me")
    .then((res) => res.json())
    .then((data) => {
      if (data.userId) {
        window.location.href = "/dashboard.html";
      }
    })
    .catch(() => {
      // User not logged in, stay on signup page
    });

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideStatusBanner();
    clearFieldErrors();
    updateSubmitState(true);

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const validationErrors = validateSignup({
      username,
      email,
      password,
      confirmPassword,
    });

    if (validationErrors) {
      updateSubmitState(false);
      displayFieldErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showStatusBanner(
          "Account created successfully. Redirecting to login…",
          "success",
        );
        setTimeout(() => {
          window.location.href = "/index.html";
        }, 1800);
      } else {
        updateSubmitState(false);
        showStatusBanner(data.error || "Signup failed.", "error");
      }
    } catch (error) {
      console.error("Signup error:", error);
      updateSubmitState(false);
      showStatusBanner("An error occurred. Please try again.", "error");
    }
  });

  function updateSubmitState(isSubmitting) {
    if (!submitButton) {
      return;
    }

    submitButton.disabled = isSubmitting;
    submitButton.textContent = isSubmitting ? "Creating account..." : "Sign Up";
  }

  function displayFieldErrors(errors) {
    Object.keys(errors).forEach((field) => {
      const errorText = errors[field];
      const errorElement = document.getElementById(`${field}Error`);
      const inputElement = document.getElementById(field);

      if (errorElement) {
        errorElement.textContent = errorText;
      }

      if (inputElement) {
        inputElement.closest(".form-group")?.classList.add("error");
      }
    });
  }

  function clearFieldErrors() {
    const errorElements = document.querySelectorAll(".field-error");
    errorElements.forEach((el) => {
      el.textContent = "";
    });
    const errorGroups = document.querySelectorAll(".form-group.error");
    errorGroups.forEach((group) => group.classList.remove("error"));
  }

  function showStatusBanner(message, type = "success") {
    if (!statusBanner) {
      return;
    }

    statusBanner.textContent = message;
    statusBanner.classList.remove("success", "error");
    statusBanner.classList.add("show", type);
  }

  function hideStatusBanner() {
    if (!statusBanner) {
      return;
    }

    statusBanner.textContent = "";
    statusBanner.classList.remove("show", "success", "error");
  }

  function validateSignup({ username, email, password, confirmPassword }) {
    const errors = {};

    if (!username) {
      errors.username = "Username is required.";
    } else if (username.length < 3 || username.length > 10) {
      errors.username = "Username must be 3–10 characters.";
    }

    if (!email) {
      errors.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 6 || password.length > 10) {
      errors.password = "Password must be 6–10 characters.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords don't match.";
    }

    return Object.keys(errors).length ? errors : null;
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function showErrorModal(message) {
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    errorModal.classList.add("show");
  }

  function closeErrorModal() {
    errorModal.classList.remove("show");
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeErrorModal);
  }

  if (errorModal) {
    errorModal.addEventListener("click", (e) => {
      if (e.target === errorModal) {
        closeErrorModal();
      }
    });
  }

  window.closeErrorModal = closeErrorModal;
});
