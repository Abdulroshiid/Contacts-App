// ==================== Password Toggle Function ====================
function togglePassword(event, fieldId) {
  const input = document.getElementById(fieldId);
  const button = event.target.closest(".password-toggle");
  const icon = button.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.classList.remove("fa-eye");
    icon.classList.add("fa-eye-slash");
  } else {
    input.type = "password";
    icon.classList.remove("fa-eye-slash");
    icon.classList.add("fa-eye");
  }
}

function setFieldError(fieldId, message) {
  const fieldGroup = document.getElementById(`${fieldId}Group`);
  const errorElement = document.getElementById(`${fieldId}Error`);
  if (fieldGroup) {
    fieldGroup.classList.add("error");
  }
  if (errorElement) {
    errorElement.textContent = message;
  }
}

function clearFieldError(fieldId) {
  const fieldGroup = document.getElementById(`${fieldId}Group`);
  const errorElement = document.getElementById(`${fieldId}Error`);
  if (fieldGroup) {
    fieldGroup.classList.remove("error");
  }
  if (errorElement) {
    errorElement.textContent = "";
  }
}

function clearLoginErrors() {
  ["username", "password"].forEach(clearFieldError);
}

// ==================== Login Page ====================
if (document.getElementById("loginForm")) {
  // Check if already logged in
  document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.userId) {
          // User is logged in, redirect to dashboard
          window.location.href = "/dashboard.html";
        }
      })
      .catch(() => {
        // User not logged in, stay on login page
      });
  });

  // Handle login form submission
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    clearLoginErrors();

    let hasError = false;
    if (!username) {
      setFieldError("username", "Username or email is required.");
      hasError = true;
    }

    if (!password) {
      setFieldError("password", "Password is required.");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Login successful
        window.location.href = "/dashboard.html";
      } else {
        // Show error modal
        showErrorModal(data.error || "Login failed");
      }
    } catch (error) {
      showErrorModal("An error occurred. Please try again.");
      console.error("Login error:", error);
    }
  });

  document
    .getElementById("username")
    .addEventListener("input", () => clearFieldError("username"));
  document
    .getElementById("password")
    .addEventListener("input", () => clearFieldError("password"));

  function showErrorModal(message) {
    const errorModal = document.getElementById("errorModal");
    const errorMessage = document.getElementById("errorMessage");
    errorMessage.textContent = message;
    errorModal.classList.add("show");
  }

  function closeErrorModal() {
    const errorModal = document.getElementById("errorModal");
    errorModal.classList.remove("show");
  }

  // Close modal when clicking X
  document.querySelector(".close").addEventListener("click", closeErrorModal);

  // Close modal when clicking outside
  document.getElementById("errorModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("errorModal")) {
      closeErrorModal();
    }
  });

  // Make closeErrorModal globally available
  window.closeErrorModal = closeErrorModal;
}

// Make togglePassword globally available
window.togglePassword = togglePassword;
