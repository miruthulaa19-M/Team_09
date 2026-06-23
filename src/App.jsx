import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import VendorLogin from "./components/VendorLogin";
import VendorRegister from "./components/VendorRegister";
import AdminLogin from "./components/AdminLogin";
import TestDashboard from "./components/TestDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/vendor-login" element={<VendorLogin />} />
        <Route path="/vendor-register" element={<VendorRegister />} />
        <Route path="/test-dashboard" element={<TestDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;