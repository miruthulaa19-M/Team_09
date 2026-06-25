const express = require("express");
const cors    = require("cors");
const bcrypt  = require("bcrypt");
const db      = require("./database");

const app  = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

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
  const { status, rating } = req.body;   // status: 'Accepted' | 'Rejected'
  if (!["Accepted", "Rejected"].includes(status))
    return res.status(400).json({ error: "Status must be Accepted or Rejected." });

  db.get("SELECT * FROM quotations WHERE id = ?", [req.params.id], (err, q) => {
    if (err)  return res.status(500).json({ error: "Database error." });
    if (!q)   return res.status(404).json({ error: "Quotation not found." });

    // Update quotation status + optional rating
    db.run(
      "UPDATE quotations SET status=?, rating=? WHERE id=?",
      [status, rating || null, req.params.id],
      function (err) {
        if (err) return res.status(500).json({ error: "Failed to update status." });

        if (status === "Accepted") {
          // Insert rating row
          if (rating) {
            db.run(
              "INSERT OR REPLACE INTO ratings (quotation_id, vendor_id, stars) VALUES (?,?,?)",
              [q.id, q.vendor_id, rating]
            );
          }

          // Auto-insert into purchase_history
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

  db.get("SELECT COUNT(*) AS total FROM vendors",                          [], (err, r) => {
    if (err) return res.status(500).json({ error: "Database error." });
    stats.total_vendors = r.total;

    db.get("SELECT COUNT(*) AS total FROM quotations",                     [], (err, r) => {
      if (err) return res.status(500).json({ error: "Database error." });
      stats.total_quotations = r.total;

      db.get("SELECT COUNT(*) AS total FROM purchase_history",             [], (err, r) => {
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

  db.get("SELECT COUNT(*) AS total FROM quotations WHERE vendor_id=?",                      [vid], (err, r) => {
    if (err) return res.status(500).json({ error: "Database error." });
    stats.total_submitted = r.total;

    db.get("SELECT COUNT(*) AS total FROM quotations WHERE vendor_id=? AND status='Accepted'", [vid], (err, r) => {
      if (err) return res.status(500).json({ error: "Database error." });
      stats.total_accepted = r.total;

      db.get("SELECT COUNT(*) AS total FROM quotations WHERE vendor_id=? AND status='Rejected'", [vid], (err, r) => {
        if (err) return res.status(500).json({ error: "Database error." });
        stats.total_rejected = r.total;

        db.get("SELECT ROUND(AVG(stars),1) AS avg FROM ratings WHERE vendor_id=?",            [vid], (err, r) => {
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
