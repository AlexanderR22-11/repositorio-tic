// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import HomePage from "./pages/HomePage";
import AlumnoInicio from "./pages/AlumnoInicio";
import MaestroPanel from "./pages/MaestroPanel";
import DashboardAdmin from "./pages/DashboardAdmin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RutaProtegida from "./components/RutaProtegida";
import Navbar from "./components/navbar";
import Footer from "./components/Footer";

function AppRoutes() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const location = useLocation();

  const hideNavbarOn = ["/login", "/register"];
  const [q, setQ] = useState("");

  const logout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    sessionStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      {!hideNavbarOn.includes(location.pathname) && (
        <Navbar usuario={usuario} onLogout={logout} q={q} setQ={setQ} />
      )}

      <div
        className={`min-h-screen ${
          hideNavbarOn.includes(location.pathname) ? "" : "pt-[126px] md:pt-[72px]"
        }`}
      >
        <Routes>
          {/* La homepage actual se conserva como experiencia base de consulta. */}
          <Route path="/" element={<HomePage q={q} />} />
          <Route path="/explorar" element={<HomePage q={q} />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Alumno: vista completa con materiales y acciones funcionales. */}
          <Route
            path="/dashboard/alumno"
            element={
              <RutaProtegida rolPermitido="alumno">
                <AlumnoInicio />
              </RutaProtegida>
            }
          />

          {/* Ruta legacy: se conserva por compatibilidad, sin romper flujo existente. */}
          <Route
            path="/alumno/inicio"
            element={
              <RutaProtegida rolPermitido="alumno">
                <AlumnoInicio />
              </RutaProtegida>
            }
          />

          <Route
            path="/dashboard/maestro"
            element={
              <RutaProtegida rolPermitido="maestro">
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

      {!hideNavbarOn.includes(location.pathname) && <Footer />}
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
