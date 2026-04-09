// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";

import HomePage from "./pages/HomePage";
import MaestroPanel from "./pages/MaestroPanel";
import DashboardAdmin from "./pages/DashboardAdmin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import RutaProtegida from "./components/RutaProtegida";
import Navbar from "./components/navbar";
import Footer from "./components/Footer";
import { clearStoredAuth, getStoredUser } from "./utils/auth";

function AppRoutes() {
  const location = useLocation();
  const usuario = useMemo(() => getStoredUser(), [location.pathname]);

  const hideNavbarOn = ["/login", "/register", "/forgot-password"];
  const dashboardWithoutChrome = ["/dashboard/maestro", "/dashboard/admin"];
  const shouldHideChrome =
    hideNavbarOn.includes(location.pathname) ||
    dashboardWithoutChrome.some((path) => location.pathname.startsWith(path));
  const [q, setQ] = useState("");

  const logout = () => {
    clearStoredAuth();
    window.location.href = "/login";
  };

  return (
    <>
      {!shouldHideChrome && (
        <Navbar usuario={usuario} onLogout={logout} q={q} setQ={setQ} />
      )}

      <div
        className={`min-h-screen ${
          shouldHideChrome ? "" : "pt-[126px] md:pt-[72px]"
        }`}
      >
        <Routes>
          {/* La homepage actual se conserva como experiencia base de consulta. */}
          <Route path="/" element={<HomePage q={q} />} />
          <Route path="/explorar" element={<HomePage q={q} />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Dashboard del alumno: reutiliza HomePage como experiencia principal. */}
          <Route
            path="/dashboard/alumno"
            element={
              <RutaProtegida rolPermitido="alumno">
                <HomePage />
              </RutaProtegida>
            }
          />

          <Route path="/alumno/inicio" element={<Navigate to="/dashboard/alumno" replace />} />

          <Route
            path="/dashboard/maestro"
            element={
              <RutaProtegida rolPermitido={["maestro", "admin", "superadmin"]}>
                <MaestroPanel />
              </RutaProtegida>
            }
          />

          <Route
            path="/dashboard/admin"
            element={
              <RutaProtegida rolPermitido={["admin", "superadmin"]}>
                <DashboardAdmin />
              </RutaProtegida>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {!shouldHideChrome && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
