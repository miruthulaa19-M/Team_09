import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home             from "./components/Home";
import AdminLogin       from "./components/AdminLogin";
import VendorLogin      from "./components/VendorLogin";
import ForgotPassword   from "./components/ForgotPassword";
import ResetPassword    from "./components/ResetPassword";
import TestDashboard    from "./components/TestDashboard";
import AdminDashboard   from "./components/AdminDashboard";
import DashboardHome    from "./components/DashboardHome";
import VendorManagement from "./components/VendorManagement";
import PurchaseHistory  from "./components/PurchaseHistory";
import Profile          from "./components/Profile";
import VendorList       from "./pages/admin/VendorList";
import PurchaseOrders   from "./pages/admin/PurchaseOrders";

import VendorDashboard  from "./pages/vendor/VendorDashboard";
import VendorProfile    from "./pages/vendor/VendorProfile";
import Requirements     from "./pages/vendor/Requirements";
import SubmitQuotation  from "./pages/vendor/SubmitQuotation";
import MyQuotations     from "./pages/vendor/MyQuotations";
import MyOrders         from "./pages/vendor/MyOrders";
import MyRatings        from "./pages/vendor/MyRatings";

// Guard — redirect to /vendor-login if vendor_id missing
function VendorRoute({ children }) {
  return localStorage.getItem("vendor_id")
    ? children
    : <Navigate to="/vendor-login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"            element={<Home />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/vendor-login" element={<VendorLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/test-dashboard" element={<TestDashboard />} />

        {/* Admin Dashboard */}
        <Route path="/admin-dashboard" element={<AdminDashboard />}>
          <Route index                    element={<DashboardHome />} />
          <Route path="vendor-management" element={<VendorManagement />} />
          <Route path="purchase-history"  element={<PurchaseHistory />} />
          <Route path="vendor-list"       element={<VendorList />} />
          <Route path="purchase-orders"   element={<PurchaseOrders />} />
          <Route path="profile"           element={<Profile />} />
        </Route>

        {/* Vendor Portal — all protected */}
        <Route path="/vendor/dashboard"        element={<VendorRoute><VendorDashboard /></VendorRoute>} />
        <Route path="/vendor/profile"          element={<VendorRoute><VendorProfile /></VendorRoute>} />
        <Route path="/vendor/requirements"     element={<VendorRoute><Requirements /></VendorRoute>} />
        <Route path="/vendor/submit-quotation" element={<VendorRoute><SubmitQuotation /></VendorRoute>} />
        <Route path="/vendor/my-quotations"    element={<VendorRoute><MyQuotations /></VendorRoute>} />
        <Route path="/vendor/my-orders"        element={<VendorRoute><MyOrders /></VendorRoute>} />
        <Route path="/vendor/my-ratings"       element={<VendorRoute><MyRatings /></VendorRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
