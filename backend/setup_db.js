const sqlite3 = require("sqlite3").verbose();
const bcrypt  = require("bcrypt");
const fs      = require("fs");
const path    = require("path");

const DB_PATH = path.join(__dirname, "vendor.db");

if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log("🗑  Deleted old vendor.db");
}

const db = new sqlite3.Database(DB_PATH, () => console.log("✅ Created fresh vendor.db"));

db.serialize(() => {

  db.run(`CREATE TABLE admins (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT    NOT NULL DEFAULT 'Admin User',
    email    TEXT    NOT NULL UNIQUE,
    password TEXT    NOT NULL,
    contact  TEXT,
    address  TEXT
  )`, err => console.log(err ? "❌ admins: "+err.message : "✅ admins"));

  db.run(`CREATE TABLE vendors (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name    TEXT NOT NULL,
    vendor_name     TEXT NOT NULL,
    email           TEXT NOT NULL UNIQUE,
    password        TEXT NOT NULL,
    contact         TEXT NOT NULL,
    company_address TEXT,
    gst_number      TEXT
  )`, err => console.log(err ? "❌ vendors: "+err.message : "✅ vendors"));

  db.run(`CREATE TABLE quotations (
    sno            INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name   TEXT    NOT NULL,
    product_name   TEXT    NOT NULL,
    product_price  REAL    NOT NULL,
    total_quantity INTEGER NOT NULL,
    total_price    REAL    NOT NULL,
    submitted_date TEXT    NOT NULL DEFAULT (datetime('now')),
    delivery_date  TEXT    NOT NULL,
    status         TEXT    NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Accepted','Rejected')),
    rating         INTEGER          CHECK(rating BETWEEN 1 AND 5)
  )`, err => console.log(err ? "❌ quotations: "+err.message : "✅ quotations"));

  db.run(`CREATE TABLE purchase_history (
    sno            INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name   TEXT    NOT NULL,
    product_name   TEXT    NOT NULL,
    total_quantity INTEGER NOT NULL,
    total_price    REAL    NOT NULL,
    purchase_date  TEXT    NOT NULL DEFAULT (datetime('now'))
  )`, err => console.log(err ? "❌ purchase_history: "+err.message : "✅ purchase_history"));

  db.run(`CREATE TABLE ratings (
    sno            INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name   TEXT    NOT NULL,
    product_name   TEXT    NOT NULL,
    stars          INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
    overall_rating REAL,
    rated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  )`, err => console.log(err ? "❌ ratings: "+err.message : "✅ ratings"));

  setTimeout(async () => {
    const hashed = await bcrypt.hash("Admin123", 10);
    db.run(
      "INSERT INTO admins (name,email,password,contact,address) VALUES (?,?,?,?,?)",
      ["Admin User","admin@gmail.com",hashed,"9876543210","123, Business Park, Chennai"],
      err => {
        if (err) console.error("❌ seed:", err.message);
        else console.log("✅ Seeded admin@gmail.com / Admin123");

        // Final verification
        const tables = ["admins","vendors","quotations","purchase_history","ratings"];
        let done = 0;
        tables.forEach(t => {
          db.all(`PRAGMA table_info(${t})`, [], (_, rows) => {
            console.log(`\n[${t.toUpperCase()}]`);
            rows.forEach(c => console.log(`  ${c.pk?"[PK]":"    "} ${c.name} (${c.type})`));
            if (++done === tables.length) db.close(() => console.log("\n✅ All tables verified"));
          });
        });
      }
    );
  }, 500);
});
