// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { HiEye, HiEyeOff, HiAcademicCap } from "react-icons/hi";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const palette = {
    primary: "#006847",
    primaryDark: "#005c3f",
    gradientStart: "#0f1f17",
    gradientMid: "#003d2b",
    gradientEnd: "#006847",
  };

  const notify = {
    ok: (m) => toast.success(m),
    err: (m) => toast.error(m),
  };

  // Helper: guarda token/usuario en storage. Para compatibilidad con tu guard,
  // siempre escribimos en localStorage (para que RutaProtegida lo encuentre).
  // Además escribimos en sessionStorage si remember === false, and keep localStorage
  // so guards that read localStorage work reliably.
  const saveAuth = (user, token) => {
    // Siempre mantener en localStorage para evitar problemas de lectura por guards
    localStorage.setItem("usuario", JSON.stringify(user));
    localStorage.setItem("token", token);

    // Si el usuario no quiere "remember", también mantener en sessionStorage
    // (no borraremos localStorage para compatibilidad con tu guard)
    sessionStorage.setItem("usuario", JSON.stringify(user));
    sessionStorage.setItem("token", token);
  };

  // Login real: POST /api/auth/login
  const login = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!correo.trim() || !password) {
      notify.err("Completa todos los campos");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      notify.err("Ingresa un correo válido");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) notify.err(data.error || "Credenciales inválidas");
        else if (res.status === 403) notify.err(data.error || "Acceso denegado");
        else notify.err(data.error || "Error en autenticación");
        return;
      }

      if (!data.user || !data.token) {
        notify.err("Respuesta inválida del servidor");
        console.error("Login: respuesta incompleta", data);
        return;
      }

      // Guardar credenciales en storage
      saveAuth(data.user, data.token);

      notify.ok(`Bienvenido ${data.user.nombre || data.user.correo}`);

      // --- Normalizar role y redirigir a rutas de la app (NO rutas de archivos) ---
      console.log("Login: role recibido (raw):", data.user.role);
      const role = (data.user.role || "").toString().toLowerCase();

      if (role === "alumno") {
        console.log("Login: navegando a /dashboard/alumno");
        navigate("/dashboard/alumno");
      } else if (role === "maestro") {
        console.log("Login: navegando a /dashboard/maestro");
        navigate("/dashboard/maestro");
      } else {
        console.log("Login: role desconocido, navegando a /");
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      notify.err("Error en autenticación");
    } finally {
      setLoading(false);
    }
  };

  // Google login: decodifica y envía credential al backend
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        notify.err("Respuesta inválida de Google");
        return;
      }

      const decodeJwt = (token) => {
        try {
          const base64Url = token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          return JSON.parse(jsonPayload);
        } catch {
          return null;
        }
      };

      const decoded = decodeJwt(credentialResponse.credential);
      if (!decoded) {
        notify.err("No se pudo decodificar el token de Google");
        return;
      }

      const email = (decoded?.email || "").toLowerCase();
      if (!email || !email.endsWith("@utnay.edu.mx")) {
        notify.err("Solo correos institucionales @utnay.edu.mx");
        return;
      }

      // Enviar credential al backend para validar/crear usuario y recibir token propio
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3000/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: credentialResponse.credential }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          notify.err(data.error || "Error autenticando con Google en el servidor");
          console.error("Google backend error:", data);
          return;
        }

        if (!data.user || !data.token) {
          notify.err("Respuesta inválida del servidor tras Google login");
          console.error("Google login respuesta incompleta:", data);
          return;
        }

        saveAuth(data.user, data.token);
        notify.ok("Login con Google exitoso");

        const role = (data.user.role || "").toString().toLowerCase();
        if (role === "maestro") navigate("/dashboard/maestro");
        else navigate("/pages/MaestroPanel");
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error en handleGoogleLogin:", error);
      notify.err("Error en autenticación con Google");
      setLoading(false);
    }
  };

  // lee el client id de Vite
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: `linear-gradient(135deg, ${palette.gradientStart}, ${palette.gradientMid}, ${palette.gradientEnd})`,
      }}
    >
      <Toaster position="top-right" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-4xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Lado izquierdo visual mejorado */}
          <div className="hidden md:flex relative items-center justify-center p-8 overflow-hidden">
            <motion.img
              src="/repo.png"
              alt="Ilustración educativa"
              initial={{ y: 10, opacity: 0.95 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              className="absolute inset-0 w-full h-full object-cover opacity-95"
              loading="lazy"
              decoding="async"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/35 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-white/10 border border-white/10">
                  <HiAcademicCap size={28} className="text-white/95" />
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold drop-shadow-md">Repositorio UTN</h2>
                  <p className="text-white/80 text-sm drop-shadow-sm">Plataforma académica institucional</p>
                </div>
              </div>

              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-56 opacity-100"
              >
                <img src="/logo-utn.png" alt="" className="w-full object-contain" />
              </motion.div>

              <p className="text-white/85 text-sm mt-6 px-6 drop-shadow-sm">
                Accede con tu correo institucional para ver recursos, tareas y material de clase.
              </p>
            </div>
          </div>

          {/* Lado derecho formulario */}
          <div className="p-8">
            <header className="mb-6 text-center">
              <h1 className="text-2xl font-extrabold text-[#006847]">Iniciar sesión</h1>
              <p className="text-sm text-gray-500">Usa tu cuenta institucional para continuar</p>
            </header>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                login(e);
              }}
              className="space-y-4"
              noValidate
            >
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Correo institucional</span>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tu@utnay.edu.mx"
                  className="mt-1 w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006847] focus:border-[#006847] transition"
                  required
                  aria-label="Correo institucional"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Contraseña</span>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#006847] focus:border-[#006847] transition pr-12"
                    required
                    aria-label="Contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={() => setRemember((r) => !r)}
                    className="checkbox checkbox-sm checkbox-primary"
                    aria-label="Recuérdame"
                  />
                  <span className="text-gray-600">Recuérdame</span>
                </label>

                <button
                  type="button"
                  className="text-[#006847] hover:underline"
                  onClick={() => notify.err("Función de recuperación no implementada")}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 bg-[#006847] hover:bg-[#005c3f] text-white py-2 rounded-lg shadow-md disabled:opacity-60 transition"
                aria-busy={loading}
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  "Iniciar sesión"
                )}
              </button>
            </form>

            <div className="flex items-center my-5">
              <div className="flex-grow h-px bg-gray-200"></div>
              <span className="px-3 text-gray-400 text-sm">o</span>
              <div className="flex-grow h-px bg-gray-200"></div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-center">
                {typeof window !== "undefined" && googleClientId ? (
                  <GoogleLogin onSuccess={handleGoogleLogin} onError={() => notify.err("Error con Google")} />
                ) : (
                  <button
                    onClick={() => notify.err("Google OAuth no configurado. Define VITE_GOOGLE_CLIENT_ID")}
                    className="btn btn-outline"
                  >
                    Iniciar con Google
                  </button>
                )}
              </div>

              <div className="flex gap-3 justify-center mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCorreo("alumno@utn.com");
                    setPassword("123");
                    notify.ok("Credenciales de prueba (alumno) cargadas");
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Cargar credenciales alumno
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCorreo("maestro@utn.com");
                    setPassword("123");
                    notify.ok("Credenciales de prueba (maestro) cargadas");
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Cargar credenciales maestro
                </button>
              </div>
            </div>

            <footer className="mt-6 text-xs text-gray-500 text-center">
              <p>Alumno: <span className="font-medium">alumno@utn.com</span> / <span className="font-medium">123</span></p>
              <p>Maestro: <span className="font-medium">maestro@utn.com</span> / <span className="font-medium">123</span></p>
            </footer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
