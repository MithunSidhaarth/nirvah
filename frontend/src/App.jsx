import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import ForNgos from "./pages/ForNgos";
import Contact from "./pages/Contact";
import NgoImpact from "./pages/NgoImpact";
import DonateMoney from "./pages/DonateMoney";
import DonorWrapped from "./pages/DonorWrapped";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DonorDashboard from "./pages/DonorDashboard";
import NgoDashboard from "./pages/NgoDashboard";
import NewListing from "./pages/NewListing";
import Browse from "./pages/Browse";
import DonationDetail from "./pages/DonationDetail";
import TaxSummary from "./pages/TaxSummary";
import CsrSummary from "./pages/CsrSummary";
import MyListings from "./pages/MyListings";
import ClaimedByUs from "./pages/ClaimedByUs";
import Team from "./pages/Team";
import MonetaryProfile from "./pages/MonetaryProfile";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDonations from "./pages/AdminDonations";
import AdminNgoVerification from "./pages/AdminNgoVerification";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import RequireRole from "./components/RequireRole";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/for-ngos" element={<ForNgos />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/browse" element={<Browse />} />
        <Route path="/browse/:id" element={<DonationDetail />} />
        <Route path="/impact/:ngoId" element={<NgoImpact />} />
        <Route path="/donate-money" element={<DonateMoney />} />

        <Route path="/dashboard/donor" element={<RequireRole roles={["donor"]}><DonorDashboard /></RequireRole>} />
        <Route path="/dashboard/donor/new" element={<RequireRole roles={["donor"]}><NewListing /></RequireRole>} />
        <Route path="/dashboard/donor/wrapped" element={<RequireRole roles={["donor"]}><DonorWrapped /></RequireRole>} />
        <Route path="/dashboard/donor/listings" element={<RequireRole roles={["donor"]}><MyListings /></RequireRole>} />
        <Route path="/dashboard/donor/tax" element={<RequireRole roles={["donor"]}><TaxSummary /></RequireRole>} />

        <Route path="/dashboard/ngo" element={<RequireRole roles={["ngo"]}><NgoDashboard /></RequireRole>} />
        <Route path="/dashboard/ngo/claims" element={<RequireRole roles={["ngo"]}><ClaimedByUs /></RequireRole>} />
        <Route path="/dashboard/ngo/csr" element={<RequireRole roles={["ngo"]}><CsrSummary /></RequireRole>} />
        <Route path="/dashboard/ngo/team" element={<RequireRole roles={["ngo"]}><Team /></RequireRole>} />
        <Route path="/dashboard/ngo/donate-setup" element={<RequireRole roles={["ngo"]}><MonetaryProfile /></RequireRole>} />

        <Route path="/dashboard/settings" element={<RequireRole roles={["donor", "ngo", "admin", "manager"]}><Settings /></RequireRole>} />

        <Route path="/dashboard/admin" element={<RequireRole roles={["admin", "manager"]}><AdminDashboard /></RequireRole>} />
        <Route path="/dashboard/admin/donations" element={<RequireRole roles={["admin", "manager"]}><AdminDonations /></RequireRole>} />
        <Route path="/dashboard/admin/ngos" element={<RequireRole roles={["admin", "manager"]}><AdminNgoVerification /></RequireRole>} />
        <Route path="/dashboard/admin/users" element={<RequireRole roles={["admin"]}><AdminUsers /></RequireRole>} />
        <Route path="/dashboard/admin/settings" element={<RequireRole roles={["admin"]}><AdminSettings /></RequireRole>} />

        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
