import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import DashboardPage from "./components/dashboard/DashboardPage";
import NavBar from "./components/layout/NavBar";
import Footer from "./components/layout/Footer";
import { isAuthenticated } from "./lib/api";
import "./styles/landing-layout.css";
import "./pages/style/Home.css";
import "./pages/style/Auth.css";

/** Every /projects, /stats and task endpoint requires a session, so the
 * dashboard route needs one too — otherwise every request just 401s. */
function RequireAuth({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <NavBar />
            <Home />
            <Footer />
          </>
        }
      />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
