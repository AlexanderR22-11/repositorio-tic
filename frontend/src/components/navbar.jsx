// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import DarkModeToggle from "./DarkModeToggle";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Navbar({ usuario, onLogout, q, setQ }) {
  const navigate = useNavigate();

  const openDashboard = () => {
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
      className="w-full bg-[#006847] text-white px-6 py-3 shadow-md fixed top-0 left-0 right-0 z-40"
    >
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        <div className="flex items-center gap-3">
          <motion.div whileHover={{ rotate: -4, scale: 1.04 }}>
            <Link to="/">
              <img src="/logo-utn.png" alt="UTN" className="w-10 h-10" />
            </Link>
          </motion.div>
          <div>
            <div className="font-bold">Repositorio UTN</div>
            <div className="text-xs text-white/80">Material académico para Ingeniería</div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-4 text-sm">
          <motion.a whileHover={{ y: -2 }} href="/#inicio" className="hover:underline">Inicio</motion.a>
          <motion.a whileHover={{ y: -2 }} href="/#materiales" className="hover:underline">Materias</motion.a>
          <motion.a whileHover={{ y: -2 }} href="/#materiales" className="hover:underline">Archivos</motion.a>
        </nav>

        <div className="flex-1 flex justify-center">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="bg-white px-3 py-1 rounded-full flex items-center gap-2 text-black shadow w-full max-w-xl"
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

        <div className="flex items-center gap-4">
          <motion.button whileHover={{ y: -2 }} onClick={openDashboard} className="btn btn-ghost text-white">Dashboard</motion.button>

          {usuario ? (
            <>
              <div className="flex items-center gap-2">
                <FaUserCircle className="text-2xl" />
                <div className="text-sm">
                  <div className="font-medium">{usuario.nombre}</div>
                  <div className="text-xs text-white/80">{usuario.correo}</div>
                </div>
              </div>
              <motion.button whileHover={{ y: -2 }} onClick={onLogout} className="btn btn-ghost text-white">Salir</motion.button>
            </>
          ) : (
            <motion.div whileHover={{ y: -2 }}>
              <Link to="/login" className="btn btn-outline text-white">Iniciar sesión</Link>
            </motion.div>
          )}

          <DarkModeToggle />
        </div>
      </div>
    </motion.header>
  );
}
