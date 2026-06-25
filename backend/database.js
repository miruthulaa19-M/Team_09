const sqlite3 = require("sqlite3").verbose();
const bcrypt  = require("bcrypt");
const path    = require("path");

const DB_PATH = path.join(__dirname, "vendor.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error("❌ Failed to connect:", err.message);
  else     console.log("✅ Connected to SQLite:", DB_PATH);
});

db.serialize(() => {

  // ── ADMINS ────────────────────────────────────────────────────
  // Admin Portal — Profile
  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL DEFAULT 'Admin User',
      email      TEXT    NOT NULL UNIQUE,
      password   TEXT    NOT NULL,
      contact    TEXT,
      address    TEXT
    )
  `, (err) => {
    if (err) { console.error("❌ admins:", err.message); return; }
    console.log("✅ admins table ready");

    db.get("SELECT id FROM admins WHERE email = ?", ["admin@gmail.com"], async (err, row) => {
      if (err || row) return;
      const hashed = await bcrypt.hash("Admin123", 10);
      db.run(
        "INSERT INTO admins (name, email, password, contact, address) VALUES (?,?,?,?,?)",
        ["Admin User", "admin@gmail.com", hashed, "9876543210", "123, Business Park, Chennai"],
        (err) => {
          if (err) console.error("❌ seed admin:", err.message);
          else     console.log("✅ Default admin seeded → admin@gmail.com / Admin123");
        }
      );
    });
  });

  // ── VENDORS ───────────────────────────────────────────────────
  // Vendor Portal — Profile + Auth
  db.run(`
    CREATE TABLE IF NOT EXISTS vendors (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name    TEXT    NOT NULL,
      vendor_name     TEXT    NOT NULL,
      email           TEXT    NOT NULL UNIQUE,
      password        TEXT    NOT NULL,
      contact         TEXT    NOT NULL,
      company_address TEXT,
      gst_number      TEXT
    )
  `, (err) => {
    if (err) console.error("❌ vendors:", err.message);
    else     console.log("✅ vendors table ready");
  });

  // ── QUOTATIONS ────────────────────────────────────────────────
  // Vendor submits → appears in Admin Vendor Management
  // Admin Portal : S.No, Company Name, Product Name, Product Price,
  //                Total Quantity, Total Price, Status, Rating
  // Vendor Portal : Company Name, Product Name, Product Price,
  //                 Total Quantity, Total Price, Submitted Date, Delivery Date
  db.run(`
    CREATE TABLE IF NOT EXISTS quotations (
      sno             INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name    TEXT    NOT NULL,
      product_name    TEXT    NOT NULL,
      product_price   REAL    NOT NULL,
      total_quantity  INTEGER NOT NULL,
      total_price     REAL    NOT NULL,
      submitted_date  TEXT    NOT NULL DEFAULT (datetime('now')),
      delivery_date   TEXT    NOT NULL,
      status          TEXT    NOT NULL DEFAULT 'Pending'
                               CHECK(status IN ('Pending','Accepted','Rejected')),
      rating          INTEGER          CHECK(rating BETWEEN 1 AND 5)
    )
  `, (err) => {
    if (err) console.error("❌ quotations:", err.message);
    else     console.log("✅ quotations table ready");
  });

  // ── PURCHASE_HISTORY ──────────────────────────────────────────
  // Admin Portal — auto-filled when admin Accepts a quotation
  // Shows: Company Name, Product Name, Total Quantity, Total Price, Purchase Date
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_history (
      sno             INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name    TEXT    NOT NULL,
      product_name    TEXT    NOT NULL,
      total_quantity  INTEGER NOT NULL,
      total_price     REAL    NOT NULL,
      purchase_date   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error("❌ purchase_history:", err.message);
    else     console.log("✅ purchase_history table ready");
  });

  // ── RESET TOKENS ──────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS reset_tokens (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL,
      token      TEXT    NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0
    )
  `, (err) => {
    if (err) console.error("❌ reset_tokens:", err.message);
    else     console.log("✅ reset_tokens table ready");
  });

  // ── RATINGS ───────────────────────────────────────────────────
  // Vendor Portal — rating given by Admin per accepted quotation
  // Shows: Overall Rating, Individual Product Rating
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      sno             INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name    TEXT    NOT NULL,
      product_name    TEXT    NOT NULL,
      stars           INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      overall_rating  REAL,
      rated_at        TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error("❌ ratings:", err.message);
    else     console.log("✅ ratings table ready");
  });

});

module.exports = db;
