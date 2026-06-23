const express = require("express");
const cors    = require("cors");
const bcrypt  = require("bcrypt");
const db      = require("./database");

const app  = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ── POST /api/register ──────────────────────────────────────────
app.post("/api/register", async (req, res) => {
  console.log("\n📥 /api/register hit");
  console.log("   Body received:", req.body);

  const { companyName, vendorName, contact, email, password } = req.body;

  if (!companyName || !vendorName || !contact || !email || !password) {
    console.warn("⚠️  Missing fields");
    return res.status(400).json({ error: "All fields are required." });
  }

  // Check for duplicate email
  db.get("SELECT id FROM vendors WHERE email = ?", [email], async (err, row) => {
    if (err) {
      console.error("❌ DB error on SELECT:", err.message);
      return res.status(500).json({ error: "Database error." });
    }

    if (row) {
      console.warn("⚠️  Email already registered:", email);
      return res.status(409).json({ error: "Email is already registered." });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    console.log("🔒 Password hashed successfully");

    // INSERT into vendors
    const sql = `INSERT INTO vendors (company_name, vendor_name, contact, email, password)
                 VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [companyName, vendorName, contact, email, hashed], function (err) {
      if (err) {
        console.error("❌ INSERT failed:", err.message);
        return res.status(500).json({ error: "Failed to register vendor." });
      }
      console.log(`✅ Vendor inserted — row id: ${this.lastID}`);
      return res.status(201).json({ message: "Vendor Registration Successful" });
    });
  });
});

// ── POST /api/admin-register ───────────────────────────────────
app.post("/api/admin-register", async (req, res) => {
  console.log("\n📥 /api/admin-register hit");
  console.log("   Body received:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    console.warn("⚠️  Missing fields");
    return res.status(400).json({ error: "All fields are required." });
  }

  db.get("SELECT id FROM admins WHERE email = ?", [email], async (err, row) => {
    if (err) {
      console.error("❌ DB error on SELECT:", err.message);
      return res.status(500).json({ error: "Database error." });
    }
    if (row) {
      console.warn("⚠️  Admin email already registered:", email);
      return res.status(409).json({ error: "Email is already registered." });
    }

    const hashed = await bcrypt.hash(password, 10);
    console.log("🔒 Password hashed successfully");

    db.run("INSERT INTO admins (email, password) VALUES (?, ?)", [email, hashed], function (err) {
      if (err) {
        console.error("❌ INSERT failed:", err.message);
        return res.status(500).json({ error: "Failed to register admin." });
      }
      console.log(`✅ Admin inserted — row id: ${this.lastID}`);
      return res.status(201).json({ message: "Admin Registration Successful" });
    });
  });
});

// ── POST /api/admin-login ───────────────────────────────────────
app.post("/api/admin-login", async (req, res) => {
  console.log("\n📥 /api/admin-login hit");
  console.log("   Body received:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    console.warn("⚠️  Missing fields");
    return res.status(400).json({ error: "All fields are required." });
  }

  db.get("SELECT * FROM admins WHERE email = ?", [email], async (err, row) => {
    if (err) {
      console.error("❌ DB error on SELECT:", err.message);
      return res.status(500).json({ error: "Database error." });
    }

    if (!row) {
      console.warn("⚠️  No admin found for email:", email);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, row.password);
    if (!match) {
      console.warn("⚠️  Password mismatch for admin:", email);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    console.log("✅ Admin login successful for:", email);
    return res.json({ message: "Login Successful", admin: { id: row.id, email: row.email } });
  });
});

// ── POST /api/login ─────────────────────────────────────────────
app.post("/api/login", async (req, res) => {
  console.log("\n📥 /api/login hit");
  console.log("   Body received:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    console.warn("⚠️  Missing fields");
    return res.status(400).json({ error: "All fields are required." });
  }

  db.get("SELECT * FROM vendors WHERE email = ?", [email], async (err, row) => {
    if (err) {
      console.error("❌ DB error on SELECT:", err.message);
      return res.status(500).json({ error: "Database error." });
    }

    if (!row) {
      console.warn("⚠️  No vendor found for email:", email);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, row.password);
    if (!match) {
      console.warn("⚠️  Password mismatch for:", email);
      return res.status(401).json({ error: "Invalid email or password." });
    }

    console.log("✅ Login successful for:", email);
    return res.json({
      message: "Login Successful",
      vendor: {
        id:          row.id,
        companyName: row.company_name,
        vendorName:  row.vendor_name,
        email:       row.email,
      },
    });
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend running at http://localhost:${PORT}`);
});
