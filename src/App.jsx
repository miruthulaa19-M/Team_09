import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Home            from "./components/Home";
import AdminLogin      from "./components/AdminLogin";
import VendorLogin     from "./components/VendorLogin";
import ForgotPassword  from "./components/ForgotPassword";
import ResetPassword   from "./components/ResetPassword";
import TestDashboard   from "./components/TestDashboard";
import AdminDashboard  from "./components/AdminDashboard";
import DashboardHome   from "./components/DashboardHome";
import VendorManagement from "./components/VendorManagement";
import PurchaseHistory from "./components/PurchaseHistory";
import Profile         from "./components/Profile";
import VendorList      from "./pages/admin/VendorList";
import PurchaseOrders  from "./pages/admin/PurchaseOrders";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/admin-login"  element={<AdminLogin />} />
        <Route path="/vendor-login" element={<VendorLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/test-dashboard" element={<TestDashboard />} />

        <Route path="/admin-dashboard" element={<AdminDashboard />}>
          <Route index                       element={<DashboardHome />} />
          <Route path="vendor-management"    element={<VendorManagement />} />
          <Route path="purchase-history"     element={<PurchaseHistory />} />
          <Route path="vendor-list"          element={<VendorList />} />
          <Route path="purchase-orders"      element={<PurchaseOrders />} />
          <Route path="profile"              element={<Profile />} />
        </Route>

        {/* Legacy flat routes (redirect into dashboard) */}
        <Route path="/admin/vendors"          element={<Navigate to="/admin-dashboard/vendor-list"      replace />} />
        <Route path="/admin/purchase-orders"  element={<Navigate to="/admin-dashboard/purchase-orders"  replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
