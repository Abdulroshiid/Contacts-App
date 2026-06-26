const express = require("express");
const router = express.Router();
const controller = require("./controller/controller");
const { requireLogin } = require("./auth-middleware");
const passport = require("passport");

// ==================== AUTH ROUTES ====================

// POST /api/auth/signup
router.post("/api/auth/signup", controller.signup);

// POST /api/auth/login
router.post("/api/auth/login", controller.login);

// POST /api/auth/logout
router.post("/api/auth/logout", controller.logout);

// GET /api/auth/me
router.get("/api/auth/me", controller.getMe);

// Google OAuth routes
router.get(
  "/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/signup.html" }),
  (req, res) => {
    // Successful authentication
    req.session.userId = req.user.id;
    req.session.username = req.user.username;
    res.redirect("/dashboard.html");
  },
);

// ==================== CONTACTS ROUTES ====================

// GET /api/data - Get all contacts for user
router.get("/api/data", requireLogin, controller.getAllContacts);

// POST /api/data - Create new contact
router.post("/api/data", requireLogin, controller.createContact);

// POST /api/data/import - Import contacts in bulk
router.post("/api/data/import", requireLogin, controller.importContacts);

// PUT /api/data/:id - Update specific contact
router.put("/api/data/:id", requireLogin, controller.updateContact);

// DELETE /api/data/:id - Delete specific contact
router.delete("/api/data/:id", requireLogin, controller.deleteContact);

module.exports = router;
