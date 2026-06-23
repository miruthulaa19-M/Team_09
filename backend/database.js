const sqlite3 = require("sqlite3").verbose();
const bcrypt  = require("bcrypt");
const path    = require("path");

const DB_PATH = path.join(__dirname, "vendor.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("❌ Failed to connect to vendor.db:", err.message);
  } else {
    console.log("✅ Connected to SQLite database:", DB_PATH);
  }
});

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS vendors (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT    NOT NULL,
      vendor_name  TEXT    NOT NULL,
      contact      TEXT    NOT NULL,
      email        TEXT    NOT NULL UNIQUE,
      password     TEXT    NOT NULL
    )`,
    (err) => {
      if (err) console.error("❌ Failed to create vendors table:", err.message);
      else      console.log("✅ vendors table ready");
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS admins (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      email    TEXT    NOT NULL UNIQUE,
      password TEXT    NOT NULL
    )`,
    async (err) => {
      if (err) { console.error("❌ Failed to create admins table:", err.message); return; }
      console.log("✅ admins table ready");

      // Seed default admin if none exists
      db.get("SELECT id FROM admins WHERE email = ?", ["admin@gmail.com"], async (err, row) => {
        if (err || row) return;
        const hashed = await bcrypt.hash("Admin123", 10);
        db.run("INSERT INTO admins (email, password) VALUES (?, ?)", ["admin@gmail.com", hashed], (err) => {
          if (err) console.error("❌ Failed to seed admin:", err.message);
          else     console.log("✅ Default admin seeded → admin@gmail.com / Admin123");
        });
      });
    }
  );
});

module.exports = db;
