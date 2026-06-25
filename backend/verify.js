const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("vendor.db");

const tables = ["admins", "vendors", "quotations", "purchase_history", "ratings"];
let done = 0;

tables.forEach((t) => {
  db.all(`PRAGMA table_info(${t})`, [], (_, rows) => {
    console.log(`\n[${t.toUpperCase()}]`);
    rows.forEach((c) =>
      console.log(`  ${c.pk ? "[PK]" : "    "} ${c.name} (${c.type})`)
    );
    if (++done === tables.length) db.close(() => console.log("\n✅ Verification complete"));
  });
});
