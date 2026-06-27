let currentUser = null;
let currentEditingContactId = null;
let allContacts = [];
let currentSearch = "";
let currentCategory = "all";
let dashboardBanner = null;
let contactModalBanner = null;
let contactSubmitButton = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();
  setupEventListeners();
  loadContacts();
});

// Check if user is authenticated
async function checkAuthentication() {
  try {
    const response = await fetch("/api/auth/me");
    const data = await response.json();

    if (data.userId) {
      currentUser = data;
      document.getElementById("username").textContent =
        `Welcome back, ${data.username}! 👋`;
    } else {
      window.location.href = "/index.html";
    }
  } catch (error) {
    console.error("Auth check error:", error);
    window.location.href = "/index.html";
  }
}

// Setup event listeners
function setupEventListeners() {
  dashboardBanner = document.getElementById("dashboardBanner");
  contactModalBanner = document.getElementById("contactModalBanner");
  contactSubmitButton = document.querySelector(
    "#contactForm button[type='submit']",
  );

  document
    .getElementById("createContactBtn")
    .addEventListener("click", openCreateModal);
  document.getElementById("logoutBtn").addEventListener("click", logout);
  document.getElementById("importContactsBtn").addEventListener("click", () => {
    document.getElementById("importFileInput").click();
  });
  document
    .getElementById("exportCsvBtn")
    .addEventListener("click", () => exportContacts("csv"));
  document
    .getElementById("exportJsonBtn")
    .addEventListener("click", () => exportContacts("json"));
  document
    .getElementById("importFileInput")
    .addEventListener("change", handleImportFile);
  document.getElementById("contactSearch").addEventListener("input", (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    displayContacts();
  });
  document.getElementById("categoryFilter").addEventListener("change", (e) => {
    currentCategory = e.target.value;
    displayContacts();
  });
  document.querySelector(".close").addEventListener("click", closeContactModal);
  document
    .getElementById("contactForm")
    .addEventListener("submit", saveContact);

  // Close modal when clicking outside
  document.getElementById("contactModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("contactModal")) {
      closeContactModal();
    }
  });

  // Close delete modal when clicking outside
  document.getElementById("deleteModal").addEventListener("click", (e) => {
    if (e.target === document.getElementById("deleteModal")) {
      closeDeleteModal();
    }
  });
}

// Load all contacts
async function loadContacts() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();

    if (response.ok) {
      allContacts = data;
      updateCategoryFilterOptions();
      renderDashboardMetrics();
      displayContacts();
    } else {
      showBanner(data.error || "Unable to load contacts.", "error");
      console.error("Error loading contacts:", data.error);
    }
  } catch (error) {
    showBanner("Unable to load contacts. Please refresh.", "error");
    console.error("Load contacts error:", error);
  }
}

function updateCategoryFilterOptions() {
  const filter = document.getElementById("categoryFilter");
  if (!filter) return;

  const categories = allContacts
    .map((contact) => contact.category?.trim())
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  filter.innerHTML =
    '<option value="all">All categories</option>' +
    categories
      .map((category) => `<option value="${category}">${category}</option>`)
      .join("");
  if (!categories.includes(currentCategory)) {
    currentCategory = "all";
    filter.value = "all";
  }
}

function renderDashboardMetrics() {
  const totalElement = document.getElementById("metricTotal");
  const popularElement = document.getElementById("metricPopular");
  if (!totalElement || !popularElement) return;

  const total = allContacts.length;
  totalElement.textContent = total;

  const categoryCounts = allContacts.reduce((counts, contact) => {
    const category = contact.category?.trim() || "Uncategorized";
    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});

  const topCategory = Object.entries(categoryCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];
  popularElement.textContent = topCategory
    ? `${topCategory[0]} (${topCategory[1]})`
    : "None";
}

// Display contacts in the UI
function displayContacts() {
  const container = document.getElementById("contactsContainer");
  const filteredContacts = allContacts.filter((contact) => {
    if (currentCategory !== "all" && contact.category !== currentCategory) {
      return false;
    }
    const search = currentSearch;
    if (!search) return true;
    return [contact.name, contact.phone, contact.address, contact.category]
      .join(" ")
      .toLowerCase()
      .includes(search);
  });

  if (filteredContacts.length === 0) {
    if (!allContacts.length) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No contacts yet. Start building your contact list now!</p>
          <button class="btn-primary" style="width: auto;" onclick="openCreateModal()">+ Add Your First Contact</button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state">
          <p>No contacts match your search.</p>
        </div>
      `;
    }
    return;
  }

  container.innerHTML = filteredContacts
    .map(
      (contact) => `
    <div class="contact-card">
      <div class="contact-info">
        <div class="contact-name">${escapeHtml(contact.name)}</div>
        <div class="contact-detail">
          <span class="contact-detail-label">Phone:</span>
          <span>${escapeHtml(contact.phone)}</span>
        </div>
        <div class="contact-detail">
          <span class="contact-detail-label">Address:</span>
          <span>${escapeHtml(contact.address)}</span>
        </div>
        ${contact.category ? `<div class="contact-detail contact-category"><span class="contact-detail-label">Category:</span><span>${escapeHtml(contact.category)}</span></div>` : ""}
      </div>
      <div class="contact-actions">
        <button class="btn-edit" onclick="openEditModal(${contact.id})">Edit</button>
        <button class="btn-delete" onclick="openDeleteModal(${contact.id})">Delete</button>
      </div>
    </div>
  `,
    )
    .join("");
}

function exportContacts(format) {
  if (!allContacts.length) {
    showBanner("No contacts available to export.", "error");
    return;
  }

  const contactsToExport = allContacts.map((contact) => ({
    name: contact.name,
    phone: contact.phone,
    address: contact.address,
    category: contact.category || "",
  }));

  if (format === "json") {
    const content = JSON.stringify(contactsToExport, null, 2);
    downloadContent("contacts-export.json", content, "application/json");
    return;
  }

  const csvHeader = ["Name", "Phone", "Address", "Category"];
  const csvRows = [csvHeader.join(",")];
  contactsToExport.forEach((contact) => {
    const row = [
      contact.name,
      contact.phone,
      contact.address,
      contact.category || "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",");
    csvRows.push(row);
  });

  downloadContent("contacts-export.csv", csvRows.join("\n"), "text/csv");
}

function downloadContent(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleImportFile(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const text = reader.result;
    let contacts = [];
    let type = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";

    try {
      if (type === "json") {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON file must contain an array of contacts.");
        }
        contacts = parsed.map((item) => ({
          name: item.name || "",
          phone: item.phone || "",
          address: item.address || "",
          category: item.category || "",
        }));
      } else {
        contacts = parseContactsCsv(String(text));
      }
    } catch (error) {
      showBanner(error.message || "Unable to parse import file.", "error");
      event.target.value = "";
      return;
    }

    if (!contacts.length) {
      showBanner("No valid contacts were found in the import file.", "error");
      event.target.value = "";
      return;
    }

    importContacts(contacts);
    event.target.value = "";
  };

  reader.readAsText(file);
}

function parseContactsCsv(csvText) {
  const rows = csvText
    .trim()
    .split(/\r?\n/)
    .filter((row) => row.trim().length > 0);

  if (!rows.length) {
    return [];
  }

  const headers = rows[0].split(",").map((value) => value.trim().toLowerCase());
  const nameIndex = headers.indexOf("name");
  const phoneIndex = headers.indexOf("phone");
  const addressIndex = headers.indexOf("address");
  const categoryIndex = headers.indexOf("category");

  if (nameIndex < 0 || phoneIndex < 0 || addressIndex < 0) {
    throw new Error("CSV file must contain Name, Phone, and Address headers.");
  }

  return rows.slice(1).map((row) => {
    const cells = row.split(",").map((cell) => cell.trim());
    return {
      name: cells[nameIndex] || "",
      phone: cells[phoneIndex] || "",
      address: cells[addressIndex] || "",
      category: categoryIndex >= 0 ? cells[categoryIndex] || "" : "",
    };
  });
}

async function importContacts(contacts) {
  try {
    const response = await fetch("/api/data/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contacts }),
    });

    const data = await response.json();
    if (response.ok) {
      let message = `${data.createdCount} contacts imported successfully.`;
      if (data.errors?.length) {
        message += ` ${data.errors.length} rows had issues.`;
      }
      showBanner(message, "success");
      loadContacts();
    } else {
      showBanner(data.error || "Unable to import contacts.", "error");
    }
  } catch (error) {
    console.error("Import error:", error);
    showBanner("Unable to import contacts. Please try again.", "error");
  }
}

// Open create contact modal
function openCreateModal() {
  currentEditingContactId = null;
  document.getElementById("modalTitle").textContent = "Create Contact";
  clearFieldErrors();
  clearContactModalBanner();
  document.getElementById("contactForm").reset();
  document.getElementById("contactModal").classList.add("show");
  document.getElementById("contactName").focus();
}

// Open edit contact modal
function openEditModal(contactId) {
  const contact = allContacts.find((c) => c.id === contactId);
  if (!contact) return;

  currentEditingContactId = contactId;
  document.getElementById("modalTitle").textContent = "Edit Contact";
  clearFieldErrors();
  clearContactModalBanner();
  document.getElementById("contactName").value = contact.name;
  document.getElementById("contactPhone").value = contact.phone;
  document.getElementById("contactAddress").value = contact.address;
  document.getElementById("contactCategory").value = contact.category || "";
  document.getElementById("contactModal").classList.add("show");
  document.getElementById("contactName").focus();
}

// Close contact modal
function closeContactModal() {
  document.getElementById("contactModal").classList.remove("show");
  clearContactModalBanner();
  currentEditingContactId = null;
  document.getElementById("contactForm").reset();
}

// Save contact (create or update)
async function saveContact(e) {
  e.preventDefault();
  clearFieldErrors();
  clearBanner();

  const name = document.getElementById("contactName").value.trim();
  const phone = document.getElementById("contactPhone").value.trim();
  const address = document.getElementById("contactAddress").value.trim();
  const category = document.getElementById("contactCategory").value.trim();

  const validationErrors = validateContactForm({
    name,
    phone,
    address,
    category,
  });

  if (validationErrors) {
    displayFieldErrors(validationErrors);
    showContactModalBanner(
      "Please check the highlighted fields for errors.",
      "error",
    );
    return;
  }

  updateContactSubmitState(true);

  try {
    let response;
    let url = "/api/data";
    let method = "POST";

    if (currentEditingContactId) {
      url = `/api/data/${currentEditingContactId}`;
      method = "PUT";
    }

    response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone, address, category }),
    });

    const data = await response.json();

    if (response.ok) {
      closeContactModal();
      showBanner(
        currentEditingContactId
          ? "Contact updated successfully."
          : "Contact added successfully.",
        "success",
      );
      loadContacts();
    } else {
      showContactModalBanner(data.error || "Unable to save contact.", "error");
    }
  } catch (error) {
    console.error("Save error:", error);
    showContactModalBanner(
      "Unable to save contact. Please try again.",
      "error",
    );
  } finally {
    updateContactSubmitState(false);
  }
}

function updateContactSubmitState(isSubmitting) {
  if (!contactSubmitButton) {
    return;
  }

  contactSubmitButton.disabled = isSubmitting;
  contactSubmitButton.textContent = isSubmitting ? "Saving..." : "Save Contact";
}

function displayFieldErrors(errors) {
  Object.keys(errors).forEach((field) => {
    const errorElement = document.getElementById(`${field}Error`);
    const inputElement = document.getElementById(field);

    if (errorElement) {
      errorElement.textContent = errors[field];
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

function validateContactForm({ name, phone, address, category }) {
  const errors = {};

  if (!name) {
    errors.contactName = "Name is required.";
  } else if (name.length < 5 || name.length > 20) {
    errors.contactName = "Name must be between 5–20 characters.";
  }

  if (!phone) {
    errors.contactPhone = "Phone number is required.";
  } else if (!/^\d{11}$/.test(phone)) {
    errors.contactPhone =
      "Phone must be exactly 11 digits (e.g., 08001234567).";
  }

  if (!address) {
    errors.contactAddress = "Address is required.";
  } else if (address.length > 30) {
    errors.contactAddress = "Address must not exceed 30 characters.";
  }

  if (category && category.length > 20) {
    errors.contactCategory = "Category must not exceed 20 characters.";
  }

  return Object.keys(errors).length ? errors : null;
}

// Open delete confirmation modal
function openDeleteModal(contactId) {
  currentEditingContactId = contactId;
  clearBanner();
  document.getElementById("deleteModal").classList.add("show");
}

// Close delete modal
function closeDeleteModal() {
  document.getElementById("deleteModal").classList.remove("show");
  currentEditingContactId = null;
}

// Confirm and delete contact
async function confirmDelete() {
  if (!currentEditingContactId) return;

  const contactId = currentEditingContactId;

  try {
    const response = await fetch(`/api/data/${contactId}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (response.ok) {
      closeDeleteModal();
      showBanner("Contact deleted successfully.", "success");
      loadContacts();
    } else {
      showBanner(data.error || "Unable to delete contact.", "error");
    }
  } catch (error) {
    console.error("Delete error:", error);
    showBanner("Unable to delete contact. Please try again.", "error");
  }
}

// Logout
async function logout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (response.ok) {
      window.location.href = "/index.html";
    } else {
      showBanner("Unable to logout. Please try again.", "error");
    }
  } catch (error) {
    console.error("Logout error:", error);
    showBanner("Unable to logout. Please try again.", "error");
  }
}

function showContactModalBanner(message, type = "success") {
  if (!contactModalBanner) {
    return;
  }

  contactModalBanner.textContent = message;
  contactModalBanner.classList.remove("success", "error");
  contactModalBanner.classList.add("show", type);

  if (type === "success") {
    setTimeout(() => {
      clearContactModalBanner();
    }, 4000);
  }
}

function clearContactModalBanner() {
  if (!contactModalBanner) {
    return;
  }

  contactModalBanner.textContent = "";
  contactModalBanner.classList.remove("show", "success", "error");
}

function showBanner(message, type = "success") {
  if (!dashboardBanner) {
    return;
  }

  dashboardBanner.textContent = message;
  dashboardBanner.classList.remove("success", "error");
  dashboardBanner.classList.add("show", type);

  if (type === "success") {
    setTimeout(() => {
      clearBanner();
    }, 4000);
  }
}

function clearBanner() {
  if (!dashboardBanner) {
    return;
  }

  dashboardBanner.textContent = "";
  dashboardBanner.classList.remove("show", "success", "error");
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Make functions globally available
window.openCreateModal = openCreateModal;
window.openEditModal = openEditModal;
window.closeContactModal = closeContactModal;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.saveContact = saveContact;
