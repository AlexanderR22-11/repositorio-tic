// src/pages/Register.jsx
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !correo.trim() || !password) {
      toast.error("Completa todos los campos");
      return;
    }
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), correo: correo.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      toast.success("Registro exitoso");
      setNombre("");
      setCorreo("");
      setPassword("");
      setConfirm("");
      // redirigir o actualizar UI según tu flujo
    } catch (err) {
      console.error("Register error", err);
      toast.error("Error en el registro: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <Toaster position="top-right" />
      <h2 className="text-xl font-semibold mb-4">Registro de alumno</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" className="input w-full" />
        <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Correo @utnay.edu.mx" type="email" className="input w-full" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" className="input w-full" />
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar contraseña" type="password" className="input w-full" />
        <button type="submit" className="btn bg-[#006847] text-white w-full" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}
