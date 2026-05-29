import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Header } from "./components/Header";

// Pages
import { LandingPage } from "./pages/LandingPage";
import { JoinPage } from "./pages/JoinPage";
import { ClaimPage } from "./pages/ClaimPage";
import { OfflinePage } from "./pages/OfflinePage";
import { StaffLoginPage } from "./pages/StaffLoginPage";
import { TabletPage } from "./pages/TabletPage";
import { AdminPage } from "./pages/AdminPage";

import { DashboardPage } from "./pages/DashboardPage";
import { MyQrPage } from "./pages/MyQrPage";
import { RewardsPage } from "./pages/RewardsPage";
import { SpecialsPage } from "./pages/SpecialsPage";
import { ProfilePage } from "./pages/ProfilePage";

// Layout wrapper for customer-facing app routes (appends mobile header)
const CustomerAppLayout: React.FC = () => {
  return (
    <div className="bg-brand-light min-h-screen">
      <Header />
      <div className="pb-12"> {/* Tab padding */}
        <Outlet />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const basename = import.meta.env.DEV ? "" : "/test/rewards10";

  return (
    <AuthProvider>
      <Router basename={basename}>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/claim" element={<ClaimPage />} />
          <Route path="/offline" element={<OfflinePage />} />

          {/* Staff Portal */}
          <Route path="/staff/login" element={<StaffLoginPage />} />
          <Route path="/tablet" element={<TabletPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Customer Logged In Dashboard (Serves mobile PWA experience) */}
          <Route path="/app" element={<CustomerAppLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="my-qr" element={<MyQrPage />} />
            <Route path="rewards" element={<RewardsPage />} />
            <Route path="specials" element={<SpecialsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
