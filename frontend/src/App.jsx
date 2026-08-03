import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./components/dashboard/Dashboard";
import DashboardNavbar from "./components/layout/DashboardNavbar";
import CreateProjectFlow from "./components/CreateProjectFlow/CreateProjectFlow";
import NavBar from "./components/layout/NavBar";
import Footer from "./components/layout/Footer";
import "./styles/landing-layout.css";
import "./pages/style/Home.css";
import "./pages/style/Auth.css";

export default function App() {
  const [flowOpen, setFlowOpen] = useState(false);

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
          <div className="min-h-screen bg-background font-display">
            <DashboardNavbar onCreateProject={() => setFlowOpen(true)} />
            <Dashboard onCreateProject={() => setFlowOpen(true)} />
            {flowOpen && <CreateProjectFlow onClose={() => setFlowOpen(false)} />}
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
