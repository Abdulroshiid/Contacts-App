const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./database");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3000/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      const { id, displayName, emails } = profile;
      const email = emails[0].value;

      // Check if user already exists by email or googleId
      db.get(
        "SELECT * FROM users WHERE email = ? OR googleId = ?",
        [email, id],
        (err, user) => {
          if (err) return done(err);

          if (user) {
            return done(null, user);
          }

          // Create new user with Google data
          db.run(
            "INSERT INTO users (username, email, password, googleId) VALUES (?, ?, ?, ?)",
            [displayName, email, "google_auth", id],
            function (err) {
              if (err) return done(err);
              done(null, {
                id: this.lastID,
                username: displayName,
                email,
                googleId: id,
              });
            },
          );
        },
      );
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    done(err, user);
  });
});

module.exports = passport;
