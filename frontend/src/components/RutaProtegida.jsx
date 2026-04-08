// src/components/RutaProtegida.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function RutaProtegida({ children, rolPermitido }) {
  // Leer desde localStorage o sessionStorage
  const stored = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
  const usuario = stored ? JSON.parse(stored) : null;

  console.log("RutaProtegida usuario:", usuario);

  if (!usuario) {
    console.log("RutaProtegida: no hay usuario, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  // Soportar ambos nombres de campo y normalizar
  const role = (usuario.role || usuario.rol || "").toString().toLowerCase();
  const required = (rolPermitido || "").toString().toLowerCase();

  console.log("RutaProtegida role:", role, "required:", required);

  if (required && role !== required) {
    console.log("RutaProtegida: role no permitido, redirigiendo a /login");
    return <Navigate to="/login" replace />;
  }

  return children;
}
