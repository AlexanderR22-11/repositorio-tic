// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";

import HomePage from "./pages/HomePage";
import AlumnoInicio from "./pages/AlumnoInicio";
import MaestroPanel from "./pages/MaestroPanel";
import Login from "./pages/Login";
import Register from "./pages/Register";
import RutaProtegida from "./components/RutaProtegida";
import Navbar from "./components/navbar";

function AppRoutes() {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const location = useLocation();

  const hideNavbarOn = ["/login", "/register"];
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
          <Route path="/explorar" element={<HomePage q={q} />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard/alumno"
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
