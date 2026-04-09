// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import DarkModeToggle from "./DarkModeToggle";
import { FaBars, FaSearch, FaTimes, FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Navbar({ usuario, onLogout, q, setQ }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const openDashboard = () => {
    setIsMenuOpen(false);
    if (!usuario) return navigate("/login");
    const role = (usuario?.role || usuario?.rol || "").toLowerCase();

    let destino = "/dashboard/alumno";
    if (role === "maestro") destino = "/dashboard/maestro";
    if (role === "admin" || role === "superadmin") destino = "/dashboard/admin";

    navigate(destino);
  };

  return (
    <motion.header
      initial={{ y: -35, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full bg-[#006847] text-white px-4 sm:px-6 py-3 shadow-md fixed top-0 left-0 right-0 z-40"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: -4, scale: 1.04 }}>
            <Link to="/">
              <img src="/logo-utn.png" alt="UTN" className="w-10 h-10" />
            </Link>
          </motion.div>
          <div>
            <div className="font-bold text-sm sm:text-base leading-tight">Repositorio UTN</div>
            <div className="text-[11px] sm:text-xs text-white/80 hidden sm:block">Material académico UT Nayarit</div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-4 text-sm">
          <motion.a whileHover={{ y: -2 }} href="/#inicio" className="hover:underline">Inicio</motion.a>
          <Link to="/explorar" className="hover:underline">Explorar</Link>
          <motion.a whileHover={{ y: -2 }} href="/#materiales" className="hover:underline">Materias</motion.a>
        </nav>

        <div className="hidden md:flex flex-1 justify-center min-w-0">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-white px-3 py-1 rounded-full flex items-center gap-2 text-black shadow w-full max-w-xl min-w-0"
          >
            <FaSearch />
            <input
              value={q || ""}
              onChange={(e) => setQ && setQ(e.target.value)}
              placeholder="Buscar materia, autor o palabra clave..."
              className="outline-none bg-transparent w-full"
              aria-label="Buscar en repositorio"
            />
          </motion.div>
        </div>

        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <motion.button whileHover={{ y: -2 }} onClick={openDashboard} className="btn btn-ghost text-white">Dashboard</motion.button>

          {usuario ? (
            <>
              <div className="flex items-center gap-2">
                <FaUserCircle className="text-2xl" />
                <div className="text-sm min-w-0 max-w-52">
                  <div className="font-medium truncate">{usuario.nombre}</div>
                  <div className="text-xs text-white/80 truncate">{usuario.correo}</div>
                </div>
              </div>
              <motion.button whileHover={{ y: -2 }} onClick={onLogout} className="btn btn-ghost text-white">Salir</motion.button>
            </>
          ) : (
            <motion.div whileHover={{ y: -2 }} className="flex items-center gap-2">
              <Link to="/login" className="btn btn-outline text-white btn-sm lg:btn-md">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-ghost text-white btn-sm lg:btn-md">Registro</Link>
            </motion.div>
          )}

          <DarkModeToggle />
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="md:hidden ml-auto btn btn-ghost btn-circle text-white"
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <FaTimes className="text-lg" /> : <FaBars className="text-lg" />}
        </button>
      </div>

      <div className="max-w-7xl mx-auto mt-3 md:hidden">
        <div className="bg-white px-3 py-2 rounded-full flex items-center gap-2 text-black shadow w-full">
          <FaSearch />
          <input
            value={q || ""}
            onChange={(e) => setQ && setQ(e.target.value)}
            placeholder="Buscar..."
            className="outline-none bg-transparent w-full text-sm"
            aria-label="Buscar en repositorio"
          />
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 pt-[116px] bg-black/35 z-30" onClick={() => setIsMenuOpen(false)}>
          <div
            className="mx-4 rounded-2xl bg-white text-base-content shadow-xl p-4 space-y-4 max-h-[calc(100vh-132px)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="flex flex-col gap-2 text-sm">
              <a href="/#inicio" className="btn btn-ghost justify-start" onClick={() => setIsMenuOpen(false)}>Inicio</a>
              <a href="/#materiales" className="btn btn-ghost justify-start" onClick={() => setIsMenuOpen(false)}>Materias</a>
              <Link to="/explorar" className="btn btn-ghost justify-start" onClick={() => setIsMenuOpen(false)}>Explorar</Link>
            </nav>

            {usuario && (
              <div className="rounded-xl bg-base-200 p-3">
                <p className="font-semibold text-sm truncate">{usuario.nombre}</p>
                <p className="text-xs text-base-content/70 truncate">{usuario.correo}</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button type="button" onClick={openDashboard} className="btn btn-primary">Dashboard</button>
              {usuario ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout && onLogout();
                  }}
                  className="btn btn-outline"
                >
                  Salir
                </button>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="btn btn-outline">Iniciar sesión</Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)} className="btn btn-ghost">Registro</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}
