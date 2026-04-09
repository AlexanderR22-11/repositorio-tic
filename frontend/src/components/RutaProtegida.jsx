// src/components/RutaProtegida.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { getDefaultRouteForRole, getStoredToken, getStoredUser, normalizeRole } from "../utils/auth";

export default function RutaProtegida({ children, rolPermitido }) {
  const usuario = getStoredUser();
  const token = getStoredToken();

  if (!usuario || !token) {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(usuario);
  const permitidos = Array.isArray(rolPermitido)
    ? rolPermitido.map((r) => r.toLowerCase())
    : [(rolPermitido || "").toLowerCase()];

  if (permitidos[0] && !permitidos.includes(role)) {
    // Redirige al dashboard correcto según rol real.
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return children;
}
