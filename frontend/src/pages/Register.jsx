// src/pages/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createLocalSession = () => {
    const user = {
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      role: "alumno",
      materias: [],
    };

    localStorage.setItem("usuario", JSON.stringify(user));
    localStorage.setItem("token", "mock-token");
    sessionStorage.setItem("usuario", JSON.stringify(user));
    sessionStorage.setItem("token", "mock-token");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = correo.trim().toLowerCase();

    if (!nombre.trim() || !email || !password) {
      toast.error("Completa todos los campos");
      return;
    }

    if (!email.endsWith("@utnay.edu.mx")) {
      toast.error("Usa un correo institucional @utnay.edu.mx");
      return;
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener mínimo 6 caracteres");
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
        body: JSON.stringify({ nombre: nombre.trim(), correo: email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar el usuario");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("usuario", JSON.stringify(data.user));
      }

      toast.success("Registro exitoso");
      navigate("/login");
    } catch (err) {
      // Fallback para demo local sin backend activo.
      createLocalSession();
      toast.success("Registro local exitoso (modo demo)");
      navigate("/dashboard/alumno");
      console.error("Register fallback:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow">
        <Toaster position="top-right" />
        <h2 className="text-xl font-semibold mb-4">Registro de alumno</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" className="input input-bordered w-full" />
          <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Correo @utnay.edu.mx" type="email" className="input input-bordered w-full" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" className="input input-bordered w-full" />
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirmar contraseña" type="password" className="input input-bordered w-full" />
          <button type="submit" className="btn bg-[#006847] text-white w-full" disabled={loading}>
            {loading ? "Registrando..." : "Registrarse"}
          </button>
        </form>
      </div>
    </div>
  );
}
