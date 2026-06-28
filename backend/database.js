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
  db.run(`
    CREATE TABLE IF NOT EXISTS vendors (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name    TEXT    NOT NULL,
      vendor_name     TEXT    NOT NULL,
      email           TEXT    NOT NULL UNIQUE,
      password        TEXT    NOT NULL,
      contact         TEXT    NOT NULL,
      company_address TEXT    DEFAULT '',
      gst_number      TEXT    DEFAULT '',
      status          TEXT    NOT NULL DEFAULT 'pending',
      category        TEXT    NOT NULL DEFAULT ''
    )
  `, (err) => {
    if (err) console.error("❌ vendors:", err.message);
    else {
      console.log("✅ vendors table ready");
      db.run("ALTER TABLE vendors ADD COLUMN status          TEXT NOT NULL DEFAULT 'pending'", () => {});
      db.run("ALTER TABLE vendors ADD COLUMN category        TEXT NOT NULL DEFAULT ''",        () => {});
      db.run("ALTER TABLE vendors ADD COLUMN company_address TEXT DEFAULT ''",                 () => {});
    }
  });

  // ── REQUIREMENTS (admin creates → vendors see by category) ────
  db.run(`
    CREATE TABLE IF NOT EXISTS requirements (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      category      TEXT    NOT NULL,
      product_name  TEXT    NOT NULL,
      quantity      INTEGER NOT NULL,
      unit          TEXT    DEFAULT '',
      delivery_date TEXT    NOT NULL,
      last_date     TEXT    DEFAULT '',
      notes         TEXT    DEFAULT '',
      status        TEXT    NOT NULL DEFAULT 'Open',
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error("❌ requirements:", err.message);
    else     console.log("✅ requirements table ready");
  });

  // ── QUOTATIONS (vendor submits against a requirement) ─────────
  db.run(`
    CREATE TABLE IF NOT EXISTS quotations (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      req_id            INTEGER,
      vendor_id         INTEGER NOT NULL,
      product_name      TEXT    NOT NULL,
      unit_price        REAL    NOT NULL,
      total_amount      REAL    NOT NULL,
      delivery_timeline TEXT    DEFAULT '',
      notes             TEXT    DEFAULT '',
      submitted_date    TEXT    NOT NULL DEFAULT (datetime('now')),
      status            TEXT    NOT NULL DEFAULT 'Pending'
                                 CHECK(status IN ('Pending','Accepted','Rejected'))
    )
  `, (err) => {
    if (err) console.error("❌ quotations:", err.message);
    else     console.log("✅ quotations table ready");
  });

  // ── PURCHASE_HISTORY (auto-created when admin accepts quotation)
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_history (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id       INTEGER NOT NULL,
      company_name    TEXT    NOT NULL,
      product_name    TEXT    NOT NULL,
      total_quantity  INTEGER NOT NULL,
      total_price     REAL    NOT NULL,
      delivery_date   TEXT    DEFAULT '',
      purchase_date   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error("❌ purchase_history:", err.message);
    else     console.log("✅ purchase_history table ready");
  });

  // ── VENDOR_PRODUCTS ───────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS vendor_products (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id    INTEGER NOT NULL,
      category     TEXT    NOT NULL,
      product_name TEXT    NOT NULL,
      description  TEXT    DEFAULT '',
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error("❌ vendor_products:", err.message);
    else     console.log("✅ vendor_products table ready");
  });

  // ── PURCHASE_ORDERS (admin-created, category-filtered) ────────
  db.run("DROP TABLE IF EXISTS purchase_orders");
  db.run(`
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      requestNo     TEXT,
      category      TEXT    NOT NULL,
      productName   TEXT    NOT NULL,
      quantity      INTEGER NOT NULL,
      unit          TEXT    NOT NULL,
      deliveryDate  TEXT    NOT NULL,
      notes         TEXT    DEFAULT '',
      status        TEXT    NOT NULL DEFAULT 'Pending',
      dateSubmitted TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error("❌ purchase_orders:", err.message);
    else     console.log("✅ purchase_orders table ready");
  });

  // ── RATINGS ───────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id    INTEGER NOT NULL,
      quotation_id INTEGER,
      product_name TEXT    NOT NULL,
      stars        INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      comments     TEXT    DEFAULT '',
      rated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => {
    if (err) console.error("❌ ratings:", err.message);
    else     console.log("✅ ratings table ready");
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

});

module.exports = db;
