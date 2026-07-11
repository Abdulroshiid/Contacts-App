const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "app.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("Database connection error:", err);
  else console.log("Connection to SQLite Database successful!");
});

// Initialize tables
const initializeDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(
      `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        googleId TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) console.error("Error creating users table:", err);
        else console.log("Users table ready");
      },
    );

    // Contacts table (multiple contacts per user)
    db.run(
      `
      CREATE TABLE IF NOT EXISTS user_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT,
        phone NUMBER,
        address TEXT,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      (err) => {
        if (err) console.error("Error creating user_data table:", err);
        else {
          console.log("User data table ready");
          db.all("PRAGMA table_info(user_data)", (pragmaErr, columns) => {
            if (pragmaErr) {
              return console.error(
                "Error checking user_data schema:",
                pragmaErr,
              );
            }

            const hasCategory = columns.some(
              (column) => column.name === "category",
            );
            if (!hasCategory) {
              db.run(
                "ALTER TABLE user_data ADD COLUMN category TEXT",
                (alterErr) => {
                  if (alterErr) {
                    console.error(
                      "Error adding category column to user_data:",
                      alterErr,
                    );
                  } else {
                    console.log("Added category column to user_data table");
                  }
                },
              );
            }
          });
        }
      },
    );

    // Password reset tokens table
    db.run(
      `
      CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `,
      (err) => {
        if (err) console.error("Error creating password_resets table:", err);
        else console.log("Password reset table ready");
      },
    );

    // Sessions table
    db.run(
      `
      CREATE TABLE IF NOT EXISTS sessions (
        sid TEXT PRIMARY KEY,
        sess TEXT NOT NULL,
        expire INTEGER NOT NULL
      )
    `,
      (err) => {
        if (err) console.error("Error creating sessions table:", err);
        else console.log("Sessions table ready");
      },
    );
  });
};

initializeDatabase();

module.exports = db;
