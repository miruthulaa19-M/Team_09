const Database = require("better-sqlite3");
const bcrypt = require("bcrypt");
const path = require("path");

const DB_PATH = path.join(__dirname, "vendor.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

function hasColumn(tableName, columnName) {
  const row = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return row.some((col) => col.name === columnName);
}

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT 'Admin User',
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      contact TEXT,
      address TEXT
    );

    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      contact TEXT NOT NULL,
      company_address TEXT DEFAULT '',
      gst_number TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      category TEXT NOT NULL DEFAULT '',
      products_supplied TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT DEFAULT '',
      delivery_date TEXT NOT NULL,
      last_date TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Open',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      req_id INTEGER,
      vendor_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      delivery_timeline TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      submitted_date TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Accepted','Rejected'))
    );

    CREATE TABLE IF NOT EXISTS purchase_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL,
      company_name TEXT NOT NULL,
      product_name TEXT NOT NULL,
      total_quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      delivery_date TEXT DEFAULT '',
      purchase_date TEXT NOT NULL DEFAULT (datetime('now')),
      po_number TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS vendor_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      product_name TEXT NOT NULL,
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requestNo TEXT,
      category TEXT NOT NULL,
      productName TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit TEXT NOT NULL,
      deliveryDate TEXT NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending',
      dateSubmitted TEXT NOT NULL DEFAULT (datetime('now')),
      requirement_id INTEGER DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id INTEGER NOT NULL,
      quotation_id INTEGER,
      product_name TEXT NOT NULL,
      stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      comments TEXT DEFAULT '',
      rated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );
  `);

  if (!hasColumn("purchase_history", "po_number")) {
    db.exec("ALTER TABLE purchase_history ADD COLUMN po_number TEXT DEFAULT '';");
  }

  if (!hasColumn("purchase_history", "vendor_name")) {
    db.exec("ALTER TABLE purchase_history ADD COLUMN vendor_name TEXT DEFAULT '';");
  }

  if (!hasColumn("purchase_history", "unit_price")) {
    db.exec("ALTER TABLE purchase_history ADD COLUMN unit_price REAL DEFAULT 0;");
  }

  if (!hasColumn("purchase_orders", "requirement_id")) {
    db.exec("ALTER TABLE purchase_orders ADD COLUMN requirement_id INTEGER DEFAULT NULL;");
  }
  if (!hasColumn("vendors", "products_supplied")) {
    db.exec("ALTER TABLE vendors ADD COLUMN products_supplied TEXT DEFAULT '';");
  }
}

createSchema();

const existingAdmin = db.prepare("SELECT id FROM admins WHERE email = ?").get("admin@gmail.com");
if (!existingAdmin) {
  const hash = bcrypt.hashSync("Admin123", 10);
  db.prepare("INSERT INTO admins (name, email, password, contact, address) VALUES (?,?,?,?,?)").run(
    "Admin User",
    "admin@gmail.com",
    hash,
    "9876543210",
    "123, Business Park, Chennai"
  );
}

console.log("✅ Connected to SQLite:", DB_PATH);
module.exports = db;
