import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Onboarding from "./pages/onboarding/Onboarding";
import Dashboard from "./pages/dashboard/Dashboard";
import Planner from "./pages/planner/Planner";
import Chatbot from "./pages/chatbot/Chatbot";
import Analytics from "./pages/analytics/Analytics";

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
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />
        <Route
          path="/register"
          element={
            <RequireGuest>
              <Register />
            </RequireGuest>
          }
        />

        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />

        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="planner" element={<Planner />} />
          <Route path="chatbot" element={<Chatbot />} />
          <Route path="analytics" element={<Analytics />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
