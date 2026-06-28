const sqlite3 = require("sqlite3").verbose();
const path    = require("path");

const db = new sqlite3.Database(path.join(__dirname, "vendor.db"), (err) => {
  if (err) { console.error("❌ DB connect:", err.message); process.exit(1); }
  console.log("✅ Connected");
});

db.serialize(() => {
  // Force drop tables that have wrong/old schema
  db.run("DROP TABLE IF EXISTS quotations");
  db.run("DROP TABLE IF EXISTS purchase_history");
  db.run("DROP TABLE IF EXISTS ratings");

  // Add missing gst_number to vendors (safe — ignored if exists)
  db.run("ALTER TABLE vendors ADD COLUMN gst_number TEXT DEFAULT ''", () => {});

  // Recreate with correct schema
  db.run(`
    CREATE TABLE quotations (
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
    )
  `, (err) => { console.log(err ? "❌ quotations: " + err.message : "✅ quotations recreated"); });

  db.run(`
    CREATE TABLE purchase_history (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id       INTEGER NOT NULL,
      company_name    TEXT    NOT NULL,
      product_name    TEXT    NOT NULL,
      total_quantity  INTEGER NOT NULL,
      total_price     REAL    NOT NULL,
      delivery_date   TEXT    DEFAULT '',
      purchase_date   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => { console.log(err ? "❌ purchase_history: " + err.message : "✅ purchase_history recreated"); });

  db.run(`
    CREATE TABLE ratings (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_id    INTEGER NOT NULL,
      quotation_id INTEGER,
      product_name TEXT    NOT NULL,
      stars        INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      comments     TEXT    DEFAULT '',
      rated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `, (err) => { console.log(err ? "❌ ratings: " + err.message : "✅ ratings recreated"); });
});

setTimeout(() => {
  console.log("\n✅ Migration complete — restart backend now.");
  db.close();
  process.exit(0);
}, 1000);
