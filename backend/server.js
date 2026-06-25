const express = require("express");
const cors    = require("cors");
const bcrypt  = require("bcrypt");
const jwt     = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const db      = require("./database");

const app  = express();
const PORT = 5000;
const JWT_SECRET = "your_secret_key_here_change_in_production";

// ────────────────────────────────────────────────
// NODEMAILER SETUP
// Step 1: Enable 2-Step Verification on your Google account
// Step 2: Go to Google Account → Security → App passwords
// Step 3: Generate a 16-char app password and paste below (no spaces)
// ────────────────────────────────────────────────
const SENDER_EMAIL = "miruthulaa358@gmail.com";
const SENDER_PASS  = "eokrpsgwlkqqyzum";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: SENDER_EMAIL, pass: SENDER_PASS }
});

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ════════════════════════════════════════════════
// FORGOT PASSWORD & RESET
// ════════════════════════════════════════════════

function sendResetEmail(email, role, res) {
  const table = role === "admin" ? "admins" : "vendors";
  db.get(`SELECT id FROM ${table} WHERE email = ?`, [email], (err, row) => {
    if (err)  return res.status(500).json({ error: "Database error." });
    if (!row) return res.status(404).json({ error: "Email not registered." });

    const token     = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "15m" });
    const expiresAt = Date.now() + 15 * 60 * 1000;

    db.run(
      "INSERT INTO reset_tokens (email, token, expires_at) VALUES (?,?,?)",
      [email, token, expiresAt],
      (err) => {
        if (err) return res.status(500).json({ error: "Failed to generate reset token." });

        const resetUrl = `http://localhost:5173/reset-password/${token}`;
        const mailOptions = {
          from: SENDER_EMAIL,
          to: email,
          subject: "Reset Your Password",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #FB923C;">Password Reset Request</h2>
              <p>You requested to reset your password. Click the link below to proceed:</p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #FB923C; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Reset Password</a>
              <p>This link will expire in <strong>15 minutes</strong>.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          `
        };

        transporter.sendMail(mailOptions, (err) => {
          if (err) {
            console.error("❌ Email send error:", err.message);
            return res.status(500).json({ error: "Failed to send email. Check Gmail App Password setup." });
          }
          console.log(`✅ Reset email sent to ${email}`);
          res.json({ message: "Password reset link sent to your email." });
        });
      }
    );
  });
}

// POST /api/forgot-password  (vendor)
app.post("/api/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });
  sendResetEmail(email, "vendor", res);
});

// POST /api/admin-forgot-password  (admin)
app.post("/api/admin-forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });
  sendResetEmail(email, "admin", res);
});

// GET /api/reset-password/:token - Verify token validity
app.get("/api/reset-password/:token", (req, res) => {
  const { token } = req.params;

  db.get(
    "SELECT * FROM reset_tokens WHERE token = ? AND used = 0",
    [token],
    (err, row) => {
      if (err)  return res.status(500).json({ error: "Database error." });
      if (!row) return res.status(400).json({ error: "Invalid or expired reset link." });
      if (Date.now() > row.expires_at)
        return res.status(400).json({ error: "Reset link has expired." });

      try {
        jwt.verify(token, JWT_SECRET);
        res.json({ message: "Token is valid.", email: row.email });
      } catch {
        res.status(400).json({ error: "Invalid or expired reset link." });
      }
    }
  );
});

// POST /api/reset-password/:token - Update password
app.post("/api/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ error: "Password is required." });

  db.get(
    "SELECT * FROM reset_tokens WHERE token = ? AND used = 0",
    [token],
    async (err, row) => {
      if (err)  return res.status(500).json({ error: "Database error." });
      if (!row) return res.status(400).json({ error: "Invalid or expired reset link." });
      if (Date.now() > row.expires_at)
        return res.status(400).json({ error: "Reset link has expired." });

      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(400).json({ error: "Invalid or expired reset link." });
      }

      const table  = decoded.role === "admin" ? "admins" : "vendors";
      const hashed = await bcrypt.hash(password, 10);

      db.run(`UPDATE ${table} SET password = ? WHERE email = ?`, [hashed, row.email], (err) => {
        if (err) return res.status(500).json({ error: "Failed to update password." });

        db.run("UPDATE reset_tokens SET used = 1 WHERE token = ?", [token], (err) => {
          if (err) console.error("❌ Token invalidation error:", err.message);
          console.log(`✅ Password reset for ${row.email}`);
          res.json({ message: "Password reset successfully." });
        });
      });
    }
  );
});

// ════════════════════════════════════════════════
// AUTH — existing routes (unchanged)
// ════════════════════════════════════════════════

// POST /api/register
app.post("/api/register", async (req, res) => {
  const { companyName, vendorName, contact, email, password } = req.body;
  if (!companyName || !vendorName || !contact || !email || !password)
    return res.status(400).json({ error: "All fields are required." });

  db.get("SELECT id FROM vendors WHERE email = ?", [email], async (err, row) => {
    if (err)  return res.status(500).json({ error: "Database error." });
    if (row)  return res.status(409).json({ error: "Email is already registered." });

    const hashed = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO vendors (company_name, vendor_name, contact, email, password) VALUES (?,?,?,?,?)",
      [companyName, vendorName, contact, email, hashed],
      function (err) {
        if (err) return res.status(500).json({ error: "Failed to register vendor." });
        console.log(`✅ Vendor inserted — id: ${this.lastID}`);
        res.status(201).json({ message: "Vendor Registration Successful" });
      }
    );
  });
});

// POST /api/admin-register
app.post("/api/admin-register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "All fields are required." });

  db.get("SELECT id FROM admins WHERE email = ?", [email], async (err, row) => {
    if (err)  return res.status(500).json({ error: "Database error." });
    if (row)  return res.status(409).json({ error: "Email is already registered." });

    const hashed = await bcrypt.hash(password, 10);
    db.run("INSERT INTO admins (email, password) VALUES (?,?)", [email, hashed], function (err) {
      if (err) return res.status(500).json({ error: "Failed to register admin." });
      console.log(`✅ Admin inserted — id: ${this.lastID}`);
      res.status(201).json({ message: "Admin Registration Successful" });
    });
  });
});

// POST /api/admin-login
app.post("/api/admin-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "All fields are required." });

  db.get("SELECT * FROM admins WHERE email = ?", [email], async (err, row) => {
    if (err)   return res.status(500).json({ error: "Database error." });
    if (!row)  return res.status(401).json({ error: "Invalid email or password." });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password." });

    console.log("✅ Admin login:", email);
    res.json({ message: "Login Successful", admin: { id: row.id, email: row.email } });
  });
});

// POST /api/login (vendor)
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "All fields are required." });

  db.get("SELECT * FROM vendors WHERE email = ?", [email], async (err, row) => {
    if (err)   return res.status(500).json({ error: "Database error." });
    if (!row)  return res.status(401).json({ error: "Invalid email or password." });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: "Invalid email or password." });

    console.log("✅ Vendor login:", email);
    res.json({
      message: "Login Successful",
      vendor: { id: row.id, companyName: row.company_name, vendorName: row.vendor_name, email: row.email },
    });
  });
});

// ════════════════════════════════════════════════
// ADMIN PROFILE
// ════════════════════════════════════════════════

// GET /api/admin/profile/:id
app.get("/api/admin/profile/:id", (req, res) => {
  db.get(
    "SELECT id, name, email, contact, address FROM admins WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err)   return res.status(500).json({ error: "Database error." });
      if (!row)  return res.status(404).json({ error: "Admin not found." });
      res.json(row);
    }
  );
});

// PUT /api/admin/profile/:id
app.put("/api/admin/profile/:id", (req, res) => {
  const { name, email, contact, address } = req.body;
  db.run(
    "UPDATE admins SET name=?, email=?, contact=?, address=? WHERE id=?",
    [name, email, contact, address, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to update profile." });
      res.json({ message: "Profile updated successfully." });
    }
  );
});

// ════════════════════════════════════════════════
// VENDOR PROFILE
// ════════════════════════════════════════════════

// GET /api/vendor/profile/:id
app.get("/api/vendor/profile/:id", (req, res) => {
  db.get(
    "SELECT id, company_name, vendor_name, email, contact, company_address, gst_number FROM vendors WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err)   return res.status(500).json({ error: "Database error." });
      if (!row)  return res.status(404).json({ error: "Vendor not found." });
      res.json(row);
    }
  );
});

// PUT /api/vendor/profile/:id
app.put("/api/vendor/profile/:id", (req, res) => {
  const { company_name, vendor_name, email, contact, company_address, gst_number } = req.body;
  db.run(
    `UPDATE vendors SET company_name=?, vendor_name=?, email=?, contact=?,
     company_address=?, gst_number=? WHERE id=?`,
    [company_name, vendor_name, email, contact, company_address, gst_number, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to update profile." });
      res.json({ message: "Profile updated successfully." });
    }
  );
});

// ════════════════════════════════════════════════
// QUOTATIONS  (Vendor submits → Admin sees)
// ════════════════════════════════════════════════

// POST /api/quotations  — vendor submits a quotation
app.post("/api/quotations", (req, res) => {
  const { vendor_id, product_name, product_price, total_quantity, total_price, delivery_date } = req.body;
  if (!vendor_id || !product_name || !product_price || !total_quantity || !total_price || !delivery_date)
    return res.status(400).json({ error: "All fields are required." });

  db.run(
    `INSERT INTO quotations (vendor_id, product_name, product_price, total_quantity, total_price, delivery_date)
     VALUES (?,?,?,?,?,?)`,
    [vendor_id, product_name, product_price, total_quantity, total_price, delivery_date],
    function (err) {
      if (err) return res.status(500).json({ error: "Failed to submit quotation." });
      console.log(`✅ Quotation submitted — id: ${this.lastID}`);
      res.status(201).json({ message: "Quotation submitted successfully.", quotation_id: this.lastID });
    }
  );
});

// GET /api/quotations  — admin gets all quotations with vendor details
app.get("/api/quotations", (req, res) => {
  db.all(
    `SELECT q.id, q.vendor_id, v.company_name, v.vendor_name, q.product_name,
            q.product_price, q.total_quantity, q.total_price,
            q.delivery_date, q.submitted_date, q.status, q.rating
     FROM quotations q
     JOIN vendors v ON v.id = q.vendor_id
     ORDER BY q.submitted_date DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error." });
      res.json(rows);
    }
  );
});

// GET /api/quotations/vendor/:vendor_id  — vendor sees own quotations
app.get("/api/quotations/vendor/:vendor_id", (req, res) => {
  db.all(
    `SELECT q.id, q.product_name, q.product_price, q.total_quantity, q.total_price,
            q.delivery_date, q.submitted_date, q.status, q.rating
     FROM quotations q
     WHERE q.vendor_id = ?
     ORDER BY q.submitted_date DESC`,
    [req.params.vendor_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error." });
      res.json(rows);
    }
  );
});

// ════════════════════════════════════════════════
// ADMIN — Accept / Reject quotation
// Auto-inserts into purchase_history on Accept
// ════════════════════════════════════════════════

// PUT /api/quotations/:id/status
app.put("/api/quotations/:id/status", (req, res) => {
  const { status, rating } = req.body;
  if (!["Accepted", "Rejected"].includes(status))
    return res.status(400).json({ error: "Status must be Accepted or Rejected." });

  db.get("SELECT * FROM quotations WHERE id = ?", [req.params.id], (err, q) => {
    if (err)  return res.status(500).json({ error: "Database error." });
    if (!q)   return res.status(404).json({ error: "Quotation not found." });

    db.run(
      "UPDATE quotations SET status=?, rating=? WHERE id=?",
      [status, rating || null, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: "Failed to update status." });

        if (status === "Accepted") {
          if (rating) {
            db.run(
              "INSERT OR REPLACE INTO ratings (quotation_id, vendor_id, stars) VALUES (?,?,?)",
              [q.id, q.vendor_id, rating]
            );
          }

          db.get("SELECT company_name FROM vendors WHERE id=?", [q.vendor_id], (err, vendor) => {
            if (err || !vendor) return res.json({ message: "Status updated." });

            db.run(
              `INSERT OR IGNORE INTO purchase_history
               (quotation_id, vendor_id, company_name, product_name, total_quantity, total_price)
               VALUES (?,?,?,?,?,?)`,
              [q.id, q.vendor_id, vendor.company_name, q.product_name, q.total_quantity, q.total_price],
              (err) => {
                if (err) console.error("❌ purchase_history insert:", err.message);
                else     console.log(`✅ Purchase history recorded for quotation ${q.id}`);
              }
            );
          });
        }

        res.json({ message: `Quotation ${status} successfully.` });
      }
    );
  });
});

// ════════════════════════════════════════════════
// PURCHASE HISTORY
// ════════════════════════════════════════════════

// GET /api/purchase-history  — admin sees all accepted purchases
app.get("/api/purchase-history", (req, res) => {
  db.all(
    `SELECT ph.id, ph.company_name, ph.product_name, ph.total_quantity,
            ph.total_price, ph.purchase_date, r.stars AS rating
     FROM purchase_history ph
     LEFT JOIN ratings r ON r.quotation_id = ph.quotation_id
     ORDER BY ph.purchase_date DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error." });
      res.json(rows);
    }
  );
});

// ════════════════════════════════════════════════
// RATINGS
// ════════════════════════════════════════════════

// GET /api/ratings/vendor/:vendor_id  — vendor sees own ratings
app.get("/api/ratings/vendor/:vendor_id", (req, res) => {
  db.all(
    `SELECT r.id, r.stars, r.rated_at, q.product_name
     FROM ratings r
     JOIN quotations q ON q.id = r.quotation_id
     WHERE r.vendor_id = ?
     ORDER BY r.rated_at DESC`,
    [req.params.vendor_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error." });

      const overall = rows.length
        ? (rows.reduce((s, r) => s + r.stars, 0) / rows.length).toFixed(1)
        : null;

      res.json({ overall_rating: overall, ratings: rows });
    }
  );
});

// ════════════════════════════════════════════════
// DASHBOARD STATS
// ════════════════════════════════════════════════

// GET /api/dashboard/admin  — admin dashboard counts
app.get("/api/dashboard/admin", (req, res) => {
  const stats = {};

  db.get("SELECT COUNT(*) AS total FROM vendors",          [], (err, r) => {
    if (err) return res.status(500).json({ error: "Database error." });
    stats.total_vendors = r.total;

    db.get("SELECT COUNT(*) AS total FROM quotations",     [], (err, r) => {
      if (err) return res.status(500).json({ error: "Database error." });
      stats.total_quotations = r.total;

      db.get("SELECT COUNT(*) AS total FROM purchase_history", [], (err, r) => {
        if (err) return res.status(500).json({ error: "Database error." });
        stats.total_purchases = r.total;

        res.json(stats);
      });
    });
  });
});

// GET /api/dashboard/vendor/:vendor_id  — vendor dashboard counts
app.get("/api/dashboard/vendor/:vendor_id", (req, res) => {
  const vid = req.params.vendor_id;
  const stats = {};

  db.get("SELECT COUNT(*) AS total FROM quotations WHERE vendor_id=?",                       [vid], (err, r) => {
    if (err) return res.status(500).json({ error: "Database error." });
    stats.total_submitted = r.total;

    db.get("SELECT COUNT(*) AS total FROM quotations WHERE vendor_id=? AND status='Accepted'", [vid], (err, r) => {
      if (err) return res.status(500).json({ error: "Database error." });
      stats.total_accepted = r.total;

      db.get("SELECT COUNT(*) AS total FROM quotations WHERE vendor_id=? AND status='Rejected'", [vid], (err, r) => {
        if (err) return res.status(500).json({ error: "Database error." });
        stats.total_rejected = r.total;

        db.get("SELECT ROUND(AVG(stars),1) AS avg FROM ratings WHERE vendor_id=?", [vid], (err, r) => {
          if (err) return res.status(500).json({ error: "Database error." });
          stats.overall_rating = r.avg || null;

          res.json(stats);
        });
      });
    });
  });
});

// GET /api/vendors  — list all vendors (admin use)
app.get("/api/vendors", (req, res) => {
  db.all(
    "SELECT id, company_name, vendor_name, email, contact, created_at FROM vendors ORDER BY created_at DESC",
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error." });
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`\n🚀 Backend running at http://localhost:${PORT}`);
});
