import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import HowItWorks from "./pages/HowItWorks";
import ForNgos from "./pages/ForNgos";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DonorDashboard from "./pages/DonorDashboard";
import NgoDashboard from "./pages/NgoDashboard";
import NewListing from "./pages/NewListing";
import Browse from "./pages/Browse";
import DonationDetail from "./pages/DonationDetail";
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

        <Route path="/browse" element={<Browse />} />
        <Route path="/browse/:id" element={<DonationDetail />} />

        <Route path="/dashboard/donor" element={<DonorDashboard />} />
        <Route path="/dashboard/donor/new" element={<NewListing />} />
        <Route
          path="/dashboard/donor/listings"
          element={<ComingSoon role="donor" title="My listings" description="Every donation you have ever posted, in one place." />}
        />

        <Route path="/dashboard/ngo" element={<NgoDashboard />} />
        <Route
          path="/dashboard/ngo/claims"
          element={<ComingSoon role="ngo" title="Claimed by us" description="Everything your organisation has claimed and delivered." />}
        />
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
