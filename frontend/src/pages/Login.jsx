import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { HiEye, HiEyeOff, HiAcademicCap } from "react-icons/hi";
import { findMockUser } from "../config/mockUsers";
import { getDefaultRouteForRole, normalizeRole } from "../utils/auth";

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

  const saveAuth = (user, token) => {
    const safeToken = token || "mock-token";
    if (remember) {
      localStorage.setItem("usuario", JSON.stringify(user));
      localStorage.setItem("token", safeToken);
      sessionStorage.removeItem("usuario");
      sessionStorage.removeItem("token");
      return;
    }

    sessionStorage.setItem("usuario", JSON.stringify(user));
    sessionStorage.setItem("token", safeToken);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
  };

  const redirectByRole = (user) => {
    const role = normalizeRole(user);
    navigate(getDefaultRouteForRole(role));
  };

  const mockLoginFallback = () => {
    const mockUser = findMockUser(correo, password);
    if (!mockUser) {
      notify.err("Credenciales inválidas");
      return false;
    }

    const safeUser = {
      nombre: mockUser.nombre,
      correo: mockUser.correo,
      role: mockUser.role,
      materias: mockUser.materias,
    };

    saveAuth(safeUser, "mock-token");
    notify.ok(`Bienvenido ${safeUser.nombre}`);
    redirectByRole(safeUser);
    return true;
  };

  const login = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (!correo.trim() || !password) {
      notify.err("Completa todos los campos");
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

      if (!res.ok || !data.user || !data.token) {
        // Si el backend falla o no devuelve role utilizable, usar fallback local.
        const ok = mockLoginFallback();
        if (!ok) notify.err(data.error || "Error en autenticación");
        return;
      }

      saveAuth(data.user, data.token);
      notify.ok(`Bienvenido ${data.user.nombre || data.user.correo}`);
      redirectByRole(data.user);
    } catch (error) {
      // Entorno sin backend: fallback con usuarios mock.
      if (!mockLoginFallback()) {
        notify.err("No fue posible iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      if (!credentialResponse?.credential) {
        notify.err("Respuesta inválida de Google");
        return;
      }

      setLoading(true);
      const res = await fetch("http://localhost:3000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.user || !data.token) {
        notify.err(data.error || "Error autenticando con Google");
        return;
      }

      saveAuth(data.user, data.token);
      notify.ok("Login con Google exitoso");
      redirectByRole(data.user);
    } catch (error) {
      notify.err("Error en autenticación con Google");
    } finally {
      setLoading(false);
    }
  };

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
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-3 bg-[#006847] hover:bg-[#005c3f] text-white py-2 rounded-lg shadow-md disabled:opacity-60 transition"
                aria-busy={loading}
              >
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>

            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-sm text-[#006847] hover:underline">¿Olvidaste tu contraseña?</Link>
            </div>

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

              {/* Botones de carga rápida para pruebas por rol */}
              <div className="flex gap-3 justify-center mt-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setCorreo("alumno@utn.com");
                    setPassword("123");
                    notify.ok("Credenciales de prueba (alumno) cargadas");
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Cargar alumno
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
                  Cargar maestro
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCorreo("admin@utn.com");
                    setPassword("123");
                    notify.ok("Credenciales de prueba (admin) cargadas");
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Cargar admin
                </button>
              </div>
            </div>

            <footer className="mt-6 text-xs text-gray-500 text-center">
              <p>Alumno: <span className="font-medium">alumno@utn.com</span> / <span className="font-medium">123</span></p>
              <p>Maestro: <span className="font-medium">maestro@utn.com</span> / <span className="font-medium">123</span></p>
              <p>Admin: <span className="font-medium">admin@utn.com</span> / <span className="font-medium">123</span></p>
            </footer>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
