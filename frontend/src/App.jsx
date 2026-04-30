import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout      from "./components/Layout";
import Login       from "./pages/auth/Login";
import Register    from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import Onboarding  from "./pages/onboarding/Onboarding";
import Dashboard   from "./pages/dashboard/Dashboard";
import Planner     from "./pages/planner/Planner";
import Chatbot     from "./pages/chatbot/Chatbot";
import Analytics   from "./pages/analytics/Analytics";

function RequireAuth({ children }) {
  const token = localStorage.getItem("stucare_access_token");
  return token ? children : <Navigate to="/login" replace />;
}

function RequireGuest({ children }) {
  const token = localStorage.getItem("stucare_access_token");
  return !token ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest-only routes */}
        <Route path="/login"    element={<RequireGuest><Login /></RequireGuest>} />
        <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />

        {/* Verify email — accessible without token (user has no token yet after register)
            Also accessible if they somehow have a token but aren't verified */}
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Onboarding — requires token (issued after OTP verified) */}
        <Route path="/onboarding" element={<RequireAuth><Onboarding /></RequireAuth>} />

        {/* Main app — requires token */}
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="planner"   element={<Planner />} />
          <Route path="chatbot"   element={<Chatbot />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}