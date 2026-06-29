const express = require("express");
const controller = require("../controllers/apiController");

const router = express.Router();

router.post("/forgot-password", controller.forgotPassword);
router.post("/admin-forgot-password", controller.adminForgotPassword);
router.get("/reset-password/:token", controller.validateResetToken);
router.post("/reset-password/:token", controller.resetPassword);

router.post("/register", controller.registerVendor);
router.post("/admin-register", controller.adminRegister);
router.post("/admin-login", controller.adminLogin);
router.post("/login", controller.loginVendor);

router.get("/admin/profile/:id", controller.getAdminProfile);
router.put("/admin/profile/:id", controller.updateAdminProfile);

router.get("/vendors", controller.listVendors);
router.get("/vendors/:id", controller.getVendor);
router.put("/vendors/:id", controller.updateVendorProfile);
router.patch("/vendors/:id/status", controller.updateVendorStatus);

router.get("/vendor/dashboard/:vendor_id", controller.getVendorDashboardStats);
router.get("/dashboard/admin", controller.getAdminDashboardStats);

router.get("/requirements", controller.listRequirements);
router.post("/requirements", controller.createRequirement);
router.put("/requirements/:id/status", controller.updateRequirementStatus);
router.get("/requirements/vendor/:vendor_id", controller.listRequirementsForVendor);

router.post("/quotations", controller.submitQuotation);
router.get("/quotations", controller.listQuotations);
router.get("/quotations/vendor/:vendor_id", controller.listVendorQuotations);
router.put("/quotations/:id/status", controller.updateQuotationStatus);

router.get("/vendor-products/:vendor_id", controller.listVendorProducts);
router.post("/vendor-products", controller.createVendorProduct);
router.put("/vendor-products/:id", controller.updateVendorProduct);
router.delete("/vendor-products/:id", controller.deleteVendorProduct);

router.get("/purchase-history", controller.listPurchaseHistory);
router.get("/purchase-history/vendor/:vendor_id", controller.listVendorPurchaseHistory);
router.get("/ratings/vendor/:vendor_id", controller.listVendorRatings);

router.get("/purchase-orders", controller.listPurchaseOrders);
router.post("/purchase-orders", controller.createPurchaseOrder);
router.get("/purchase-orders/vendor/:vendor_id", controller.listVendorPurchaseOrders);

module.exports = router;
