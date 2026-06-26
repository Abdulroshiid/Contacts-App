// Authentication middleware to protect routes
const requireLogin = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: "Authentication failed" });
  }
};

module.exports = { requireLogin };
