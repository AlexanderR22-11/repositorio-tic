// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import HomePage from "./pages/HomePage";
import AlumnoInicio from "./pages/AlumnoInicio";
import MaestroPanel from "./pages/MaestroPanel";
import Login from "./pages/Login";
import Register from "./pages/Register"; // <-- importar Register
import RutaProtegida from "./components/RutaProtegida";
import Navbar from "./components/navbar";

function AppRoutes() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const location = useLocation();

  // Rutas donde NO queremos mostrar la Navbar
  const hideNavbarOn = ["/login", "/register"]; // <-- ocultar también en register

  // Búsqueda global (si quieres que Navbar controle la búsqueda)
  const [q, setQ] = useState("");

  const logout = () => {
    localStorage.removeItem("usuario");
    window.location.href = "/login";
  };

  return (
    <>
      {!hideNavbarOn.includes(location.pathname) && (
        <Navbar usuario={usuario} onLogout={logout} q={q} setQ={setQ} />
      )}

      <div
        className="min-h-screen"
        style={{ paddingTop: hideNavbarOn.includes(location.pathname) ? 0 : 72 }}
      >
        <Routes>
          <Route path="/" element={<HomePage q={q} />} />

          {/* Login público */}
          <Route path="/login" element={<Login />} />

          {/* Register público */}
          <Route path="/register" element={<Register />} />

          {/* Dashboard Alumno (protegido) */}
          <Route
            path="/dashboard/alumno"
            element={
              <RutaProtegida rolPermitido="alumno">
                <AlumnoInicio />
              </RutaProtegida>
            }
          />

          {/* Dashboard Maestro (protegido) */}
          <Route
            path="/dashboard/maestro"
            element={
              <RutaProtegida rolPermitido="maestro">
                <MaestroPanel />
              </RutaProtegida>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
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
