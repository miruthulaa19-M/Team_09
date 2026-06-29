const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const db = require("../database");

const JWT_SECRET = process.env.JWT_SECRET || "vendor-portal-secret";
const SENDER_EMAIL = process.env.SENDER_EMAIL || "miruthulaa358@gmail.com";
const SENDER_PASS = process.env.SENDER_PASS || "eokrpsgwlkqqyzum";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: SENDER_EMAIL, pass: SENDER_PASS },
});

function sendResetEmail(email, role, res) {
  const table = role === "admin" ? "admins" : "vendors";
  const existing = db.prepare(`SELECT id FROM ${table} WHERE email = ?`).get(email);
  if (!existing) return res.status(404).json({ error: "Email not registered." });

  const token = jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "15m" });
  const expiresAt = Date.now() + 15 * 60 * 1000;
  db.prepare("INSERT INTO reset_tokens (email, token, expires_at) VALUES (?,?,?)").run(email, token, expiresAt);

  const resetUrl = `http://localhost:5173/reset-password/${token}`;
  transporter.sendMail(
    {
      from: SENDER_EMAIL,
      to: email,
      subject: "Reset Your Password",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#FB923C">Password Reset Request</h2><p>Click the link below to reset your password:</p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#FB923C;color:white;text-decoration:none;border-radius:8px;margin:16px 0">Reset Password</a><p>This link expires in <strong>15 minutes</strong>.</p></div>`,
    },
    (err) => {
      if (err) return res.status(500).json({ error: "Failed to send email." });
      res.json({ message: "Password reset link sent to your email." });
    }
  );
}

function normalizeVendorRow(row) {
  if (!row) return null;
  return {
    ...row,
    status: row.status || "pending",
    category: row.category || "",
  };
}

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });
  sendResetEmail(email, "vendor", res);
};

exports.adminForgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required." });
  sendResetEmail(email, "admin", res);
};

exports.validateResetToken = (req, res) => {
  const token = req.params.token;
  const row = db.prepare("SELECT * FROM reset_tokens WHERE token = ? AND used = 0").get(token);
  if (!row) return res.status(400).json({ error: "Invalid or expired reset link." });
  if (Date.now() > row.expires_at) return res.status(400).json({ error: "Reset link has expired." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: "Token is valid.", email: row.email, role: decoded.role });
  } catch {
    res.status(400).json({ error: "Invalid or expired reset link." });
  }
};

exports.resetPassword = (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password is required." });

  const row = db.prepare("SELECT * FROM reset_tokens WHERE token = ? AND used = 0").get(req.params.token);
  if (!row) return res.status(400).json({ error: "Invalid or expired reset link." });
  if (Date.now() > row.expires_at) return res.status(400).json({ error: "Reset link has expired." });

  let decoded;
  try {
    decoded = jwt.verify(req.params.token, JWT_SECRET);
  } catch {
    return res.status(400).json({ error: "Invalid or expired reset link." });
  }

  const hashed = bcrypt.hashSync(password, 10);
  const table = decoded.role === "admin" ? "admins" : "vendors";
  db.prepare(`UPDATE ${table} SET password = ? WHERE email = ?`).run(hashed, row.email);
  db.prepare("UPDATE reset_tokens SET used = 1 WHERE token = ?").run(req.params.token);
  res.json({ message: "Password reset successfully." });
};

exports.adminRegister = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required." });

  const existing = db.prepare("SELECT id FROM admins WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "Email is already registered." });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare("INSERT INTO admins (email, password) VALUES (?, ?)").run(email, hashed);
  res.status(201).json({ message: "Admin Registration Successful", id: result.lastInsertRowid });
};

exports.adminLogin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required." });

  const row = db.prepare("SELECT * FROM admins WHERE email = ?").get(email);
  if (!row) return res.status(401).json({ error: "Invalid email or password." });
  if (!bcrypt.compareSync(password, row.password)) return res.status(401).json({ error: "Invalid email or password." });

  res.json({ message: "Login Successful", admin: { id: row.id, email: row.email } });
};

exports.registerVendor = (req, res) => {
  const { companyName, vendorName, contact, email, password, category } = req.body;
  if (!companyName || !vendorName || !contact || !email || !password || !category) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const existing = db.prepare("SELECT id FROM vendors WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "Email is already registered." });

  const hashed = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    "INSERT INTO vendors (company_name, vendor_name, contact, email, password, category, status) VALUES (?,?,?,?,?,?,?)"
  ).run(companyName, vendorName, contact, email, hashed, category, "pending");

  res.status(201).json({ message: "Vendor Registration Successful", id: result.lastInsertRowid });
};

exports.loginVendor = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "All fields are required." });

  const row = db.prepare("SELECT * FROM vendors WHERE email = ?").get(email);
  if (!row) return res.status(401).json({ error: "Invalid email or password." });
  if (!bcrypt.compareSync(password, row.password)) return res.status(401).json({ error: "Invalid email or password." });

  res.json({
    message: "Login Successful",
    vendor: {
      id: row.id,
      companyName: row.company_name,
      vendorName: row.vendor_name,
      email: row.email,
      category: row.category,
      status: row.status,
    },
  });
};

exports.getAdminProfile = (req, res) => {
  const row = db.prepare("SELECT id, name, email, contact, address FROM admins WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Admin not found." });
  res.json(row);
};

exports.updateAdminProfile = (req, res) => {
  const { name, email, contact, address } = req.body;
  db.prepare("UPDATE admins SET name = ?, email = ?, contact = ?, address = ? WHERE id = ?").run(name, email, contact, address, req.params.id);
  res.json({ message: "Profile updated successfully." });
};

exports.listVendors = (req, res) => {
  const search = (req.query.search || "").trim();
  const stmt = search
    ? db.prepare("SELECT id, company_name, vendor_name, email, contact, category, status FROM vendors WHERE company_name LIKE ? OR vendor_name LIKE ? OR email LIKE ? OR category LIKE ? ORDER BY id DESC")
    : db.prepare("SELECT id, company_name, vendor_name, email, contact, category, status FROM vendors ORDER BY id DESC");
  const rows = search ? stmt.all(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`) : stmt.all();
  res.json(rows.map(normalizeVendorRow));
};

exports.getVendor = (req, res) => {
  const row = db.prepare("SELECT id, company_name, vendor_name, email, contact, company_address, gst_number, category, status FROM vendors WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Vendor not found." });
  res.json(normalizeVendorRow(row));
};

exports.updateVendorProfile = (req, res) => {
  const existing = db.prepare("SELECT company_name, vendor_name, email, contact, company_address, gst_number FROM vendors WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Vendor not found." });

  const { company_name, vendor_name, email, contact, company_address, gst_number } = req.body;
  db.prepare("UPDATE vendors SET company_name = ?, vendor_name = ?, email = ?, contact = ?, company_address = ?, gst_number = ? WHERE id = ?").run(
    company_name ?? existing.company_name,
    vendor_name ?? existing.vendor_name,
    email ?? existing.email,
    contact ?? existing.contact,
    company_address ?? existing.company_address,
    gst_number ?? existing.gst_number,
    req.params.id
  );
  res.json({ message: "Profile updated successfully." });
};

exports.updateVendorStatus = (req, res) => {
  const { status } = req.body;
  if (!status || !["approved", "rejected"].includes(status)) return res.status(400).json({ error: "Status must be approved or rejected." });

  const result = db.prepare("UPDATE vendors SET status = ? WHERE id = ?").run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Vendor not found." });
  res.json({ message: `Vendor ${status} successfully.` });
};

exports.getVendorDashboardStats = (req, res) => {
  const vendorId = req.params.vendor_id;
  const vendor = db.prepare("SELECT category FROM vendors WHERE id = ?").get(vendorId);
  if (!vendor) return res.status(404).json({ error: "Vendor not found." });

  const requirements = db.prepare("SELECT COUNT(*) as c FROM requirements WHERE category = ?").get(vendor.category);
  const quotations = db.prepare("SELECT COUNT(*) as c FROM quotations WHERE vendor_id = ?").get(vendorId);
  const accepted = db.prepare("SELECT COUNT(*) as c FROM quotations WHERE vendor_id = ? AND status = 'Accepted'").get(vendorId);
  const rejected = db.prepare("SELECT COUNT(*) as c FROM quotations WHERE vendor_id = ? AND status = 'Rejected'").get(vendorId);

  res.json({
    total_requirements: requirements?.c || 0,
    total_quotations: quotations?.c || 0,
    total_accepted: accepted?.c || 0,
    total_rejected: rejected?.c || 0,
  });
};

exports.getAdminDashboardStats = (req, res) => {
  const vendors = db.prepare("SELECT COUNT(*) as total FROM vendors").get();
  const quotes = db.prepare("SELECT COUNT(*) as total FROM quotations").get();
  const accepted = db.prepare("SELECT COUNT(*) as total FROM quotations WHERE status = 'Accepted'").get();
  const purchases = db.prepare("SELECT COUNT(*) as total FROM purchase_history").get();
  res.json({
    total_vendors: vendors?.total || 0,
    total_quotations: quotes?.total || 0,
    total_accepted_quotations: accepted?.total || 0,
    total_purchases: purchases?.total || 0,
  });
};

exports.listRequirements = (req, res) => {
  const rows = db.prepare("SELECT * FROM requirements ORDER BY created_at DESC").all();
  res.json(rows);
};

function createRequirementAndPurchaseOrder(payload) {
  const { category, product_name, quantity, unit, delivery_date, last_date, notes } = payload;
  const requirementResult = db.prepare(
    "INSERT INTO requirements (category, product_name, quantity, unit, delivery_date, last_date, notes) VALUES (?,?,?,?,?,?,?)"
  ).run(category, product_name, quantity, unit || "", delivery_date, last_date || "", notes || "");

  const purchaseOrderResult = db.prepare(
    "INSERT INTO purchase_orders (category, productName, quantity, unit, deliveryDate, notes, status, dateSubmitted, requirement_id) VALUES (?,?,?,?,?,?,?,datetime('now'),?)"
  ).run(category, product_name, quantity, unit || "", delivery_date, notes || "", "Pending", requirementResult.lastInsertRowid);

  const requestNo = `PO-${String(purchaseOrderResult.lastInsertRowid).padStart(4, "0")}`;
  db.prepare("UPDATE purchase_orders SET requestNo = ? WHERE id = ?").run(requestNo, purchaseOrderResult.lastInsertRowid);

  return { requirementId: requirementResult.lastInsertRowid, requestNo };
}

exports.createRequirement = (req, res) => {
  const { category, product_name, quantity, unit, delivery_date, last_date, notes } = req.body;
  if (!category || !product_name || !quantity || !delivery_date) {
    return res.status(400).json({ error: "category, product_name, quantity and delivery_date are required." });
  }

  const created = createRequirementAndPurchaseOrder({ category, product_name, quantity, unit, delivery_date, last_date, notes });
  const vendorCount = db.prepare("SELECT COUNT(*) as cnt FROM vendors WHERE category = ? AND status = 'approved'").get(category);
  res.status(201).json({ message: "Requirement created.", id: created.requirementId, requestNo: created.requestNo, matchedVendors: vendorCount?.cnt || 0 });
};

exports.listRequirementsForVendor = (req, res) => {
  const vendor = db.prepare("SELECT category FROM vendors WHERE id = ?").get(req.params.vendor_id);
  if (!vendor) return res.status(404).json({ error: "Vendor not found." });
  const rows = db.prepare("SELECT * FROM requirements WHERE category = ? ORDER BY created_at DESC").all(vendor.category);
  res.json(rows);
};

exports.updateRequirementStatus = (req, res) => {
  const { status } = req.body;
  if (!status || !["Accepted", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be Accepted or Rejected." });
  }

  const requirement = db.prepare("SELECT * FROM requirements WHERE id = ?").get(req.params.id);
  if (!requirement) return res.status(404).json({ error: "Requirement not found." });

  db.prepare("UPDATE requirements SET status = ? WHERE id = ?").run(status, req.params.id);
  db.prepare("UPDATE purchase_orders SET status = ? WHERE requirement_id = ?").run(status, req.params.id);

  res.json({ message: `Requirement ${status}.` });
};

exports.submitQuotation = (req, res) => {
  const { req_id, vendor_id, product_name, unit_price, total_amount, delivery_timeline, notes, company_name, vendor_name } = req.body;
  if (!vendor_id || !product_name || !unit_price || !total_amount) {
    return res.status(400).json({ error: "vendor_id, product_name, unit_price and total_amount are required." });
  }

  const vendor = db.prepare("SELECT id FROM vendors WHERE id = ?").get(vendor_id);
  if (!vendor) return res.status(404).json({ error: "Vendor not found." });

  if (req_id) {
    const requirement = db.prepare("SELECT id FROM requirements WHERE id = ?").get(req_id);
    if (!requirement) return res.status(404).json({ error: "Requirement not found." });
  }

  const result = db.prepare(
    "INSERT INTO quotations (req_id, vendor_id, product_name, unit_price, total_amount, delivery_timeline, notes, status) VALUES (?,?,?,?,?,?,?,?)"
  ).run(req_id || null, vendor_id, product_name, unit_price, total_amount, delivery_timeline || "", notes || "", "Pending");

  res.status(201).json({ message: "Quotation submitted.", id: result.lastInsertRowid, status: "Pending" });
};

exports.listQuotations = (req, res) => {
  const search = (req.query.search || "").trim();
  let rows;
  if (search) {
    rows = db.prepare(`
      SELECT q.*, v.company_name, v.vendor_name, v.category
      FROM quotations q
      JOIN vendors v ON v.id = q.vendor_id
      WHERE v.company_name LIKE ? OR v.vendor_name LIKE ? OR q.product_name LIKE ?
      ORDER BY q.submitted_date DESC
    `).all(`%${search}%`, `%${search}%`, `%${search}%`);
  } else {
    rows = db.prepare(`
      SELECT q.*, v.company_name, v.vendor_name, v.category
      FROM quotations q
      JOIN vendors v ON v.id = q.vendor_id
      ORDER BY q.submitted_date DESC
    `).all();
  }
  res.json(rows);
};

exports.listVendorQuotations = (req, res) => {
  const rows = db.prepare("SELECT * FROM quotations WHERE vendor_id = ? ORDER BY submitted_date DESC").all(req.params.vendor_id);
  res.json(rows);
};

exports.updateQuotationStatus = (req, res) => {
  const { status, rating, comments } = req.body;
  if (!status || !["Accepted", "Rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be Accepted or Rejected." });
  }

  const quotation = db.prepare("SELECT * FROM quotations WHERE id = ?").get(req.params.id);
  if (!quotation) return res.status(404).json({ error: "Quotation not found." });

  db.prepare("UPDATE quotations SET status = ? WHERE id = ?").run(status, req.params.id);

  if (status === "Accepted") {
    const otherRows = db.prepare("SELECT id FROM quotations WHERE req_id = ? AND id != ?").all(quotation.req_id, req.params.id);
    for (const row of otherRows) {
      db.prepare("UPDATE quotations SET status = 'Rejected' WHERE id = ?").run(row.id);
    }

    const vendor = db.prepare("SELECT company_name, vendor_name FROM vendors WHERE id = ?").get(quotation.vendor_id);
    const poNumber = `PO-${String(quotation.id).padStart(4, "0")}`;
    db.prepare(
      "INSERT INTO purchase_history (vendor_id, company_name, vendor_name, product_name, total_quantity, total_price, delivery_date, po_number, unit_price) VALUES (?,?,?,?,?,?,?,?,?)"
    ).run(quotation.vendor_id, vendor?.company_name || "", vendor?.vendor_name || "", quotation.product_name, 1, quotation.total_amount, quotation.delivery_timeline || "", poNumber, quotation.unit_price || 0);

    if (rating) {
      db.prepare("INSERT INTO ratings (vendor_id, quotation_id, product_name, stars, comments) VALUES (?,?,?,?,?)").run(quotation.vendor_id, quotation.id, quotation.product_name, rating, comments || "");
    }
  }

  res.json({ message: `Quotation ${status}.` });
};

exports.listVendorProducts = (req, res) => {
  const rows = db.prepare("SELECT * FROM vendor_products WHERE vendor_id = ? ORDER BY created_at DESC").all(req.params.vendor_id);
  res.json(rows);
};

exports.createVendorProduct = (req, res) => {
  const { vendor_id, category, product_name, description } = req.body;
  if (!vendor_id || !category || !product_name) return res.status(400).json({ error: "vendor_id, category and product_name are required." });

  const result = db.prepare("INSERT INTO vendor_products (vendor_id, category, product_name, description) VALUES (?,?,?,?)").run(vendor_id, category, product_name, description || "");
  res.status(201).json({ message: "Product added.", id: result.lastInsertRowid });
};

exports.updateVendorProduct = (req, res) => {
  const { category, product_name, description } = req.body;
  db.prepare("UPDATE vendor_products SET category = ?, product_name = ?, description = ? WHERE id = ?").run(category, product_name, description || "", req.params.id);
  res.json({ message: "Product updated." });
};

exports.deleteVendorProduct = (req, res) => {
  db.prepare("DELETE FROM vendor_products WHERE id = ?").run(req.params.id);
  res.json({ message: "Product deleted." });
};

exports.listPurchaseHistory = (req, res) => {
  const search = (req.query.search || "").trim();
  const date = (req.query.date || "").trim();

  let rows;
  if (search || date) {
    const where = [];
    const params = [];
    if (search) {
      where.push("(ph.company_name LIKE ? OR ph.product_name LIKE ? OR ph.vendor_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date) {
      where.push("date(ph.purchase_date) = date(?)");
      params.push(date);
    }
    const sql = `SELECT ph.*, v.company_name AS vendor_company_name, v.vendor_name AS vendor_display_name FROM purchase_history ph LEFT JOIN vendors v ON v.id = ph.vendor_id${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY ph.purchase_date DESC`;
    rows = db.prepare(sql).all(...params);
  } else {
    rows = db.prepare("SELECT ph.*, v.company_name AS vendor_company_name, v.vendor_name AS vendor_display_name FROM purchase_history ph LEFT JOIN vendors v ON v.id = ph.vendor_id ORDER BY ph.purchase_date DESC").all();
  }
  res.json(rows);
};

exports.listVendorPurchaseHistory = (req, res) => {
  const rows = db.prepare("SELECT ph.*, v.company_name AS vendor_company_name, v.vendor_name AS vendor_display_name FROM purchase_history ph LEFT JOIN vendors v ON v.id = ph.vendor_id WHERE ph.vendor_id = ? ORDER BY ph.purchase_date DESC").all(req.params.vendor_id);
  res.json(rows);
};

exports.listVendorRatings = (req, res) => {
  const rows = db.prepare("SELECT * FROM ratings WHERE vendor_id = ? ORDER BY rated_at DESC").all(req.params.vendor_id);
  const overall = rows.length ? (rows.reduce((sum, row) => sum + row.stars, 0) / rows.length).toFixed(1) : null;
  res.json({ overall_rating: overall, ratings: rows });
};

exports.listPurchaseOrders = (req, res) => {
  const rows = db.prepare("SELECT * FROM purchase_orders ORDER BY dateSubmitted DESC").all();
  res.json(rows);
};

exports.createPurchaseOrder = (req, res) => {
  const { category, productName, quantity, unit, deliveryDate, notes } = req.body;
  if (!category || !productName || !quantity || !unit || !deliveryDate) {
    return res.status(400).json({ error: "Category, Product Name, Quantity, Unit and Delivery Date are required." });
  }

  const created = createRequirementAndPurchaseOrder({
    category,
    product_name: productName,
    quantity,
    unit,
    delivery_date: deliveryDate,
    notes,
  });
  const vendorCount = db.prepare("SELECT COUNT(*) as cnt FROM vendors WHERE category = ? AND status = 'approved'").get(category);
  res.status(201).json({ message: "Purchase order created.", id: created.requirementId, requestNo: created.requestNo, matchedVendors: vendorCount?.cnt || 0 });
};

exports.listVendorPurchaseOrders = (req, res) => {
  const vendor = db.prepare("SELECT category FROM vendors WHERE id = ?").get(req.params.vendor_id);
  if (!vendor) return res.status(404).json({ error: "Vendor not found." });
  const rows = db.prepare("SELECT * FROM purchase_orders WHERE category = ? ORDER BY dateSubmitted DESC").all(vendor.category);
  res.json(rows);
};
