import { useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function ForgotPassword() {
  const [correo, setCorreo] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!correo.trim()) {
      toast.error("Ingresa tu correo institucional");
      return;
    }
    toast.success("Simulación: se envió un enlace de recuperación");
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <Toaster position="top-right" />
      <div className="card bg-base-100 w-full max-w-md shadow-xl border border-base-200">
        <div className="card-body">
          <h1 className="card-title">Recuperar contraseña</h1>
          <p className="text-sm text-base-content/70">Módulo placeholder para exposición. La recuperación real se integra con correo SMTP en una siguiente iteración.</p>
          <form onSubmit={submit} className="space-y-3">
            <input className="input input-bordered w-full" type="email" placeholder="tu@utnay.edu.mx" value={correo} onChange={(e) => setCorreo(e.target.value)} />
            <button className="btn btn-primary w-full" type="submit">Enviar enlace</button>
          </form>
          <Link to="/login" className="link link-primary text-sm">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}
