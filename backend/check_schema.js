const sqlite3 = require("sqlite3").verbose();
const path    = require("path");
const db = new sqlite3.Database(path.join(__dirname, "vendor.db"), (err) => {
  if (err) { console.error("❌ DB connect:", err.message); process.exit(1); }
});

const checks = [
  ["vendors",         ["id","company_name","vendor_name","email","contact","company_address","gst_number","category","status"]],
  ["quotations",      ["id","req_id","vendor_id","product_name","unit_price","total_amount","delivery_timeline","notes","submitted_date","status"]],
  ["purchase_history",["id","vendor_id","company_name","product_name","total_quantity","total_price","delivery_date","purchase_date"]],
  ["ratings",         ["id","vendor_id","quotation_id","product_name","stars","comments","rated_at"]],
  ["vendor_products", ["id","vendor_id","category","product_name","description","created_at"]],
  ["requirements",    ["id","category","product_name","quantity","unit","delivery_date","last_date","notes","status","created_at"]],
];

let done = 0;
checks.forEach(([table, expected]) => {
  db.all(`PRAGMA table_info(${table})`, (err, cols) => {
    if (err) { console.error(`❌ ${table}:`, err.message); }
    else {
      const actual   = cols.map(c => c.name);
      const missing  = expected.filter(c => !actual.includes(c));
      if (missing.length) console.error(`❌ ${table} missing cols: ${missing.join(", ")}`);
      else                console.log(`✅ ${table}: all columns OK`);
    }
    if (++done === checks.length) db.close(() => process.exit(0));
  });
});
