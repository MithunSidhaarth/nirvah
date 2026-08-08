import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import ForNgos from "./pages/ForNgos";
import Contact from "./pages/Contact";
import NgoImpact from "./pages/NgoImpact";
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
import ComingSoon from "./pages/ComingSoon";

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

        <Route path="/dashboard/donor" element={<DonorDashboard />} />
        <Route path="/dashboard/donor/new" element={<NewListing />} />
        <Route path="/dashboard/donor/wrapped" element={<DonorWrapped />} />
        <Route
          path="/dashboard/donor/listings"
          element={<ComingSoon role="donor" title="My listings" description="Every donation you have ever posted, in one place." />}
        />
        <Route path="/dashboard/donor/tax" element={<TaxSummary />} />

        <Route path="/dashboard/ngo" element={<NgoDashboard />} />
        <Route
          path="/dashboard/ngo/claims"
          element={<ComingSoon role="ngo" title="Claimed by us" description="Everything your organisation has claimed and delivered." />}
        />
        <Route path="/dashboard/ngo/csr" element={<CsrSummary />} />
        <Route
          path="/dashboard/ngo/team"
          element={<ComingSoon role="ngo" title="Our team" description="Add volunteers so claims move faster during busy hours." />}
        />

        <Route
          path="/dashboard/settings"
          element={<ComingSoon role="donor" title="Settings" description="Manage your account, notifications and organisation details." />}
        />

        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
