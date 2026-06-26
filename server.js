require("dotenv").config();
const express = require("express");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const cors = require("cors");
const bodyParser = require("body-parser");
const passport = require("./passport-config");
const router = require("./router");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    store: new SQLiteStore({ db: "sessions.db" }),
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

// Passport authentication
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from public folder
app.use(express.static("public"));

// Use router
app.use(router);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});
