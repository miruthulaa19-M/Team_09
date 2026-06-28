const express    = require("express");
const cors       = require("cors");
const bcrypt     = require("bcrypt");
const jwt        = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const db         = require("./database");

const app  = express();
const PORT = 5000;
const JWT_SECRET = "your_secret_key_here_change_in_production";

const SENDER_EMAIL = "miruthulaa358@gmail.com";
const SENDER_PASS  = "eokrpsgwlkqqyzum";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: SENDER_EMAIL, pass: SENDER_PASS },
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ════════════════════════════════════════════════
// FORGOT / RESET PASSWORD
// ════════════════════════════════════════════════

function sendResetEmail(email, role, res) {
  const table = role === "admin" ? "admins" : "vendors";
  db.get(`SELECT id FROM ${table} WHERE email = ?`, [email], (err, row) => {
    if (err)  return res.status(500).json({ error: "Database error." });
    if (!row) return res.status(404).json({ error: "Email not registered." });

    const token     = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "15m" });
    const expiresAt = Date.now() + 15 * 60 * 1000;

    db.run("INSERT INTO reset_tokens (email, token, expires_at) VALUES (?,?,?)", [email, token, expiresAt], (err) => {
      if (err) return res.status(500).json({ error: "Failed to generate reset token." });

      const resetUrl = `http://localhost:5173/reset-password/${token}`;
      transporter.sendMail({
        from: SENDER_EMAIL, to: email, subject: "Reset Your Password",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#FB923C">Password Reset Request</h2>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#FB923C;color:white;text-decoration:none;border-radius:8px;margin:16px 0">Reset Password</a>
          <p>This link expires in <strong>15 minutes</strong>.</p></div>`,
      }, (err) => {
        if (err) return res.status(500).json({ error: "Failed to send email." });
        res.json({ message: "Password reset link sent to your email." });
      });
    });
  });
}

app.post("/api/forgot-password",       (req, res) => { const { email } = req.body; if (!email) return res.status(400).json({ error: "Email is required." }); sendResetEmail(email, "vendor", res); });
app.post("/api/admin-forgot-password", (req, res) => { const { email } = req.body; if (!email) return res.status(400).json({ error: "Email is required." }); sendResetEmail(email, "admin",  res); });

app.get("/api/reset-password/:token", (req, res) => {
  db.get("SELECT * FROM reset_tokens WHERE token = ? AND used = 0", [req.params.token], (err, row) => {
    if (err || !row)            return res.status(400).json({ error: "Invalid or expired reset link." });
    if (Date.now() > row.expires_at) return res.status(400).json({ error: "Reset link has expired." });
    try { jwt.verify(req.params.token, JWT_SECRET); res.json({ message: "Token is valid.", email: row.email }); }
    catch { res.status(400).json({ error: "Invalid or expired reset link." }); }
  });
});

app.post("/api/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password is required." });
  db.get("SELECT * FROM reset_tokens WHERE token = ? AND used = 0", [req.params.token], async (err, row) => {
    if (err || !row)            return res.status(400).json({ error: "Invalid or expired reset link." });
    if (Date.now() > row.expires_at) return res.status(400).json({ error: "Reset link has expired." });
    let decoded;
    try { decoded = jwt.verify(req.params.token, JWT_SECRET); } catch { return res.status(400).json({ error: "Invalid or expired reset link." }); }
    const hashed = await bcrypt.hash(password, 10);
    const table  = decoded.role === "admin" ? "admins" : "vendors";
    db.run(`UPDATE ${table} SET password = ? WHERE email = ?`, [hashed, row.email], (err) => {
      if (err) return res.status(500).json({ error: "Failed to update password." });
      db.run("UPDATE reset_tokens SET used = 1 WHERE token = ?", [req.params.token]);
      res.json({ message: "Password reset successfully." });
    });
  });
});

// ════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════

app.post("/api/register", async (req, res) => {
  const { companyName, vendorName, contact, email, password, category } = req.body;
  if (!companyName || !vendorName || !contact || !email || !password || !category)
    return res.status(400).json({ error: "All fields are required." });
  db.get("SELECT id FROM vendors WHERE email = ?", [email], async (err, row) => {
    if (err)  return res.status(500).json({ error: "Database error." });
    if (row)  return res.status(409).json({ error: "Email is already registered." });
    const hashed = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO vendors (company_name, vendor_name, contact, email, password, category) VALUES (?,?,?,?,?,?)",
      [companyName, vendorName, contact, email, hashed, category],
      function (err) {
        if (err) return res.status(500).json({ error: "Failed to register vendor." });
        res.status(201).json({ message: "Vendor Registration Successful" });
      }
    );
  });
});

app.post("/api/admin-register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required." });
  db.get("SELECT id FROM admins WHERE email = ?", [email], async (err, row) => {
    if (err)  return res.status(500).json({ error: "Database error." });
    if (row)  return res.status(409).json({ error: "Email is already registered." });
    const hashed = await bcrypt.hash(password, 10);
    db.run("INSERT INTO admins (email, password) VALUES (?,?)", [email, hashed], function (err) {
      if (err) return res.status(500).json({ error: "Failed to register admin." });
      res.status(201).json({ message: "Admin Registration Successful" });
    });
  });
});

app.post("/api/admin-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required." });
  db.get("SELECT * FROM admins WHERE email = ?", [email], async (err, row) => {
    if (err || !row) return res.status(401).json({ error: "Invalid email or password." });
    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password." });
    res.json({ message: "Login Successful", admin: { id: row.id, email: row.email } });
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required." });
  db.get("SELECT * FROM vendors WHERE email = ?", [email], async (err, row) => {
    if (err || !row) return res.status(401).json({ error: "Invalid email or password." });
    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password." });
    res.json({
      message: "Login Successful",
      vendor: { id: row.id, companyName: row.company_name, vendorName: row.vendor_name, email: row.email, category: row.category },
    });
  });
});

// ════════════════════════════════════════════════
// ADMIN PROFILE
// ════════════════════════════════════════════════

app.get("/api/admin/profile/:id", (req, res) => {
  db.get("SELECT id, name, email, contact, address FROM admins WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Admin not found." });
    res.json(row);
  });
});

app.put("/api/admin/profile/:id", (req, res) => {
  const { name, email, contact, address } = req.body;
  db.run("UPDATE admins SET name=?, email=?, contact=?, address=? WHERE id=?",
    [name, email, contact, address, req.params.id],
    (err) => { if (err) return res.status(500).json({ error: "Failed to update profile." }); res.json({ message: "Profile updated successfully." }); }
  );
});

// ════════════════════════════════════════════════
// VENDORS (admin management)
// ════════════════════════════════════════════════

app.get("/api/vendors", (req, res) => {
  db.all("SELECT id, company_name, vendor_name, email, contact, category, status FROM vendors ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error." });
    res.json(rows);
  });
});

app.get("/api/vendors/:id", (req, res) => {
  db.get(
    "SELECT id, company_name, vendor_name, email, contact, company_address, gst_number, category, status FROM vendors WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err || !row) return res.status(404).json({ error: "Vendor not found." });
      res.json(row);
    }
  );
});

app.put("/api/vendors/:id", (req, res) => {
  const { company_name, contact, company_address } = req.body;
  db.run("UPDATE vendors SET company_name=?, contact=?, company_address=? WHERE id=?",
    [company_name, contact, company_address, req.params.id],
    (err) => { if (err) return res.status(500).json({ error: "Failed to update vendor." }); res.json({ message: "Vendor profile updated." }); }
  );
});

app.patch("/api/vendors/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Status must be approved or rejected." });
  db.run("UPDATE vendors SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
    if (err || this.changes === 0) return res.status(500).json({ error: "Failed to update vendor status." });
    res.json({ message: `Vendor ${status} successfully.` });
  });
});

// ════════════════════════════════════════════════
// VENDOR PROFILE (legacy endpoint kept for compatibility)
// ════════════════════════════════════════════════

app.get("/api/vendor/profile/:id", (req, res) => {
  db.get("SELECT id, company_name, vendor_name, email, contact, company_address, gst_number, category FROM vendors WHERE id = ?",
    [req.params.id], (err, row) => {
      if (err || !row) return res.status(404).json({ error: "Vendor not found." });
      res.json(row);
    }
  );
});

app.put("/api/vendor/profile/:id", (req, res) => {
  const { company_name, vendor_name, email, contact, company_address, gst_number } = req.body;
  db.run("UPDATE vendors SET company_name=?, vendor_name=?, email=?, contact=?, company_address=?, gst_number=? WHERE id=?",
    [company_name, vendor_name, email, contact, company_address, gst_number, req.params.id],
    (err) => { if (err) return res.status(500).json({ error: "Failed to update profile." }); res.json({ message: "Profile updated successfully." }); }
  );
});

// ════════════════════════════════════════════════
// VENDOR DASHBOARD STATS
// ════════════════════════════════════════════════

app.get("/api/vendor/dashboard/:vendor_id", (req, res) => {
  const vid = req.params.vendor_id;
  db.get("SELECT category FROM vendors WHERE id = ?", [vid], (err, vendor) => {
    if (err || !vendor) return res.status(404).json({ error: "Vendor not found." });
    const cat = vendor.category;
    db.get("SELECT COUNT(*) AS c FROM requirements WHERE category = ?", [cat], (err, r1) => {
      db.get("SELECT COUNT(*) AS c FROM quotations WHERE vendor_id = ?", [vid], (err, r2) => {
        db.get("SELECT COUNT(*) AS c FROM quotations WHERE vendor_id = ? AND status = 'Accepted'", [vid], (err, r3) => {
          db.get("SELECT COUNT(*) AS c FROM quotations WHERE vendor_id = ? AND status = 'Rejected'", [vid], (err, r4) => {
            res.json({
              total_requirements: r1 ? r1.c : 0,
              total_quotations:   r2 ? r2.c : 0,
              total_accepted:     r3 ? r3.c : 0,
              total_rejected:     r4 ? r4.c : 0,
            });
          });
        });
      });
    });
  });
});

// ════════════════════════════════════════════════
// ADMIN DASHBOARD STATS
// ════════════════════════════════════════════════

app.get("/api/dashboard/admin", (req, res) => {
  db.get("SELECT COUNT(*) AS total FROM vendors", [], (err, r1) => {
    db.get("SELECT COUNT(*) AS total FROM quotations", [], (err, r2) => {
      db.get("SELECT COUNT(*) AS total FROM purchase_history", [], (err, r3) => {
        res.json({ total_vendors: r1 ? r1.total : 0, total_quotations: r2 ? r2.total : 0, total_purchases: r3 ? r3.total : 0 });
      });
    });
  });
});

// ════════════════════════════════════════════════
// REQUIREMENTS
// ════════════════════════════════════════════════

app.get("/api/requirements", (req, res) => {
  db.all("SELECT * FROM requirements ORDER BY created_at DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error." });
    res.json(rows);
  });
});

app.post("/api/requirements", (req, res) => {
  const { category, product_name, quantity, unit, delivery_date, last_date, notes } = req.body;
  if (!category || !product_name || !quantity || !delivery_date)
    return res.status(400).json({ error: "category, product_name, quantity and delivery_date are required." });
  db.run(
    "INSERT INTO requirements (category, product_name, quantity, unit, delivery_date, last_date, notes) VALUES (?,?,?,?,?,?,?)",
    [category, product_name, quantity, unit || "", delivery_date, last_date || "", notes || ""],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to create requirement." });
      res.status(201).json({ message: "Requirement created.", id: this.lastID });
    }
  );
});

app.get("/api/requirements/vendor/:vendor_id", (req, res) => {
  db.get("SELECT category FROM vendors WHERE id = ?", [req.params.vendor_id], (err, vendor) => {
    if (err || !vendor) return res.status(404).json({ error: "Vendor not found." });
    db.all("SELECT * FROM requirements WHERE category = ? ORDER BY created_at DESC", [vendor.category], (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error." });
      res.json(rows);
    });
  });
});

// ════════════════════════════════════════════════
// QUOTATIONS
// ════════════════════════════════════════════════

app.post("/api/quotations", (req, res) => {
  const { req_id, vendor_id, product_name, unit_price, total_amount, delivery_timeline, notes } = req.body;
  if (!vendor_id || !product_name || !unit_price || !total_amount)
    return res.status(400).json({ error: "vendor_id, product_name, unit_price and total_amount are required." });
  db.run(
    "INSERT INTO quotations (req_id, vendor_id, product_name, unit_price, total_amount, delivery_timeline, notes) VALUES (?,?,?,?,?,?,?)",
    [req_id || null, vendor_id, product_name, unit_price, total_amount, delivery_timeline || "", notes || ""],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to submit quotation." });
      res.status(201).json({ message: "Quotation submitted.", id: this.lastID });
    }
  );
});

app.get("/api/quotations", (req, res) => {
  db.all(
    `SELECT q.*, v.company_name, v.vendor_name, v.category
     FROM quotations q JOIN vendors v ON v.id = q.vendor_id
     ORDER BY q.submitted_date DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error." });
      res.json(rows);
    }
  );
});

app.get("/api/quotations/vendor/:vendor_id", (req, res) => {
  db.all("SELECT * FROM quotations WHERE vendor_id = ? ORDER BY submitted_date DESC", [req.params.vendor_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error." });
    res.json(rows);
  });
});

app.put("/api/quotations/:id/status", (req, res) => {
  const { status, rating, comments } = req.body;
  if (!["Accepted", "Rejected"].includes(status))
    return res.status(400).json({ error: "Status must be Accepted or Rejected." });
  db.get("SELECT * FROM quotations WHERE id = ?", [req.params.id], (err, q) => {
    if (err || !q) return res.status(404).json({ error: "Quotation not found." });
    db.run("UPDATE quotations SET status = ? WHERE id = ?", [status, req.params.id], function (err) {
      if (err) return res.status(500).json({ error: "Failed to update quotation." });
      if (status === "Accepted") {
        db.get("SELECT company_name FROM vendors WHERE id = ?", [q.vendor_id], (err, vendor) => {
          db.run(
            "INSERT INTO purchase_history (vendor_id, company_name, product_name, total_quantity, total_price, delivery_date) VALUES (?,?,?,?,?,?)",
            [q.vendor_id, vendor ? vendor.company_name : "", q.product_name, 1, q.total_amount, q.delivery_timeline || ""],
            (err) => { if (err) console.error("❌ purchase_history insert:", err.message); }
          );
          if (rating) {
            db.run(
              "INSERT INTO ratings (vendor_id, quotation_id, product_name, stars, comments) VALUES (?,?,?,?,?)",
              [q.vendor_id, q.id, q.product_name, rating, comments || ""],
              (err) => { if (err) console.error("❌ rating insert:", err.message); }
            );
          }
        });
      }
      res.json({ message: `Quotation ${status}.` });
    });
  });
});

// ════════════════════════════════════════════════
// VENDOR PRODUCTS
// ════════════════════════════════════════════════

app.get("/api/vendor-products/:vendor_id", (req, res) => {
  db.all("SELECT * FROM vendor_products WHERE vendor_id = ? ORDER BY created_at DESC", [req.params.vendor_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error." });
    res.json(rows);
  });
});

app.post("/api/vendor-products", (req, res) => {
  const { vendor_id, category, product_name, description } = req.body;
  if (!vendor_id || !category || !product_name)
    return res.status(400).json({ error: "vendor_id, category and product_name are required." });
  db.run(
    "INSERT INTO vendor_products (vendor_id, category, product_name, description) VALUES (?,?,?,?)",
    [vendor_id, category, product_name, description || ""],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to add product." });
      res.status(201).json({ message: "Product added.", id: this.lastID });
    }
  );
});

app.put("/api/vendor-products/:id", (req, res) => {
  const { category, product_name, description } = req.body;
  db.run("UPDATE vendor_products SET category=?, product_name=?, description=? WHERE id=?",
    [category, product_name, description || "", req.params.id],
    (err) => { if (err) return res.status(500).json({ error: "Failed to update product." }); res.json({ message: "Product updated." }); }
  );
});

app.delete("/api/vendor-products/:id", (req, res) => {
  db.run("DELETE FROM vendor_products WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: "Failed to delete product." });
    res.json({ message: "Product deleted." });
  });
});

// ════════════════════════════════════════════════
// PURCHASE HISTORY
// ════════════════════════════════════════════════

app.get("/api/purchase-history", (req, res) => {
  db.all("SELECT * FROM purchase_history ORDER BY purchase_date DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error." });
    res.json(rows);
  });
});

app.get("/api/purchase-history/vendor/:vendor_id", (req, res) => {
  db.all("SELECT * FROM purchase_history WHERE vendor_id = ? ORDER BY purchase_date DESC", [req.params.vendor_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error." });
    res.json(rows);
  });
});

// ════════════════════════════════════════════════
// RATINGS
// ════════════════════════════════════════════════

app.get("/api/ratings/vendor/:vendor_id", (req, res) => {
  db.all("SELECT * FROM ratings WHERE vendor_id = ? ORDER BY rated_at DESC", [req.params.vendor_id], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error." });
    const overall = rows.length ? (rows.reduce((s, r) => s + r.stars, 0) / rows.length).toFixed(1) : null;
    res.json({ overall_rating: overall, ratings: rows });
  });
});

// ════════════════════════════════════════════════
// PURCHASE ORDERS
// ════════════════════════════════════════════════

app.get("/api/purchase-orders", (req, res) => {
  db.all("SELECT * FROM purchase_orders ORDER BY dateSubmitted DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error." });
    res.json(rows);
  });
});

app.post("/api/purchase-orders", (req, res) => {
  const { category, productName, quantity, unit, deliveryDate, notes } = req.body;
  if (!category || !productName || !quantity || !unit || !deliveryDate)
    return res.status(400).json({ error: "Category, Product Name, Quantity, Unit and Delivery Date are required." });
  db.get("SELECT COUNT(*) AS cnt FROM vendors WHERE category = ? AND status = 'approved'", [category], (err, row) => {
    const matchedVendors = row ? row.cnt : 0;
    db.run(
      "INSERT INTO purchase_orders (category, productName, quantity, unit, deliveryDate, notes, status, dateSubmitted) VALUES (?,?,?,?,?,?,?,datetime('now'))",
      [category, productName, quantity, unit, deliveryDate, notes || "", "Pending"],
      function (err) {
        if (err) return res.status(500).json({ error: "Failed to create purchase order." });
        const requestNo = "PO-" + String(this.lastID).padStart(4, "0");
        db.run("UPDATE purchase_orders SET requestNo = ? WHERE id = ?", [requestNo, this.lastID]);
        res.status(201).json({ message: "Purchase order created.", id: this.lastID, requestNo, matchedVendors });
      }
    );
  });
});

app.get("/api/purchase-orders/vendor/:vendor_id", (req, res) => {
  db.get("SELECT category FROM vendors WHERE id = ?", [req.params.vendor_id], (err, vendor) => {
    if (err || !vendor) return res.status(404).json({ error: "Vendor not found." });
    db.all("SELECT * FROM purchase_orders WHERE category = ? ORDER BY dateSubmitted DESC", [vendor.category], (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error." });
      res.json(rows);
    });
  });
});

app.listen(PORT, () => console.log(`\n🚀 Backend running at http://localhost:${PORT}`));
