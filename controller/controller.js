const bcryptjs = require("bcryptjs");
const db = require("../database");
const { requireLogin } = require("../auth-middleware");

// ========== AUTH CONTROLLERS ========

// POST /api/auth/signup
exports.signup = (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  // Validate input
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  // Hash password
  bcryptjs.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: "Error hashing password" });
    }

    // Create user
    db.run(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE constraint failed")) {
            return res
              .status(400)
              .json({ error: "Username or email already exists" });
          }
          return res
            .status(500)
            .json({ error: "Encounterd an error while creating a user" });
        }

        const userId = this.lastID;

        // Set session (no need to create empty contact on signup)
        req.session.userId = userId;
        req.session.username = username;
        res
          .status(201)
          .json({ message: "User account was created successfully" });
      },
    );
  });
};

// POST /api/auth/login
exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username/email and password are required" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: "Error querying database" });
      }

      if (!user) {
        return res
          .status(401)
          .json({ error: "Invalid username, email or password" });
      }

      bcryptjs.compare(password, user.password, (err, isPasswordValid) => {
        if (err) {
          return res.status(500).json({ error: "Error comparing passwords" });
        }

        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ error: "Invalid username/email or password" });
        }

        // Set session
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ message: "Login was successful", username: user.username });
      });
    },
  );
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res
        .status(500)
        .json({ error: "Encoutered an error while logging out" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
};

// GET /api/auth/me
exports.getMe = (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ userId: req.session.userId, username: req.session.username });
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
};

// ==================== CONTACTS CONTROLLERS ====================

// GET /api/data - Get all contacts for user
exports.getAllContacts = (req, res) => {
  db.all(
    "SELECT id, name, phone, address, category, created_at, updated_at FROM user_data WHERE user_id = ? ORDER BY created_at DESC",
    [req.session.userId],
    (err, contacts) => {
      if (err) {
        return res.status(500).json({ error: "Error fetching contacts" });
      }
      res.json(contacts || []);
    },
  );
};

// POST /api/data - Create new contact
exports.createContact = (req, res) => {
  const { name, phone, address, category } = req.body;
  const trimmedCategory = category ? String(category).trim() : "";

  if (!name || !phone || !address) {
    return res
      .status(400)
      .json({ error: "Name, phone, and address are required" });
  }

  db.run(
    "INSERT INTO user_data (user_id, name, phone, address, category) VALUES (?, ?, ?, ?, ?)",
    [req.session.userId, name, phone, address, trimmedCategory],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error creating contact" });
      }
      res.status(201).json({
        id: this.lastID,
        name,
        phone,
        address,
        category: trimmedCategory,
        message: "Contact created successfully",
      });
    },
  );
};

// POST /api/data/import - Bulk import contacts
exports.importContacts = (req, res) => {
  const { contacts } = req.body;

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: "No contacts provided for import." });
  }

  const insertStmt = db.prepare(
    "INSERT INTO user_data (user_id, name, phone, address, category) VALUES (?, ?, ?, ?, ?)",
  );
  let createdCount = 0;
  let errors = [];

  db.serialize(() => {
    contacts.forEach((contact, index) => {
      const name = contact.name?.trim();
      const phone = contact.phone?.trim();
      const address = contact.address?.trim();
      const category = contact.category?.trim() || "";

      if (!name || !phone || !address) {
        errors.push(`Row ${index + 1}: name, phone, and address are required.`);
        return;
      }

      insertStmt.run(
        [req.session.userId, name, phone, address, category],
        function (err) {
          if (err) {
            errors.push(`Row ${index + 1}: could not import contact.`);
          } else {
            createdCount += 1;
          }
        },
      );
    });

    insertStmt.finalize((err) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error importing contacts into the database." });
      }

      const response = {
        createdCount,
      };

      if (errors.length) {
        response.errors = errors;
      }

      res.json(response);
    });
  });
};

// PUT /api/data/:id - Update specific contact
exports.updateContact = (req, res) => {
  const contactId = req.params.id;
  const { name, phone, address, category } = req.body;
  const trimmedCategory = category ? String(category).trim() : "";

  if (!name || !phone || !address) {
    return res
      .status(400)
      .json({ error: "Name, phone, and address are required" });
  }

  db.run(
    "UPDATE user_data SET name = ?, phone = ?, address = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
    [name, phone, address, trimmedCategory, contactId, req.session.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error updating contact" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({
        message: "Contact updated successfully",
        id: contactId,
        name,
        phone,
        address,
        category: trimmedCategory,
      });
    },
  );
};

// DELETE /api/data/:id - Delete specific contact
exports.deleteContact = (req, res) => {
  const contactId = req.params.id;

  db.run(
    "DELETE FROM user_data WHERE id = ? AND user_id = ?",
    [contactId, req.session.userId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Error deleting contact" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json({ message: "Contact deleted successfully", id: contactId });
    },
  );
};
