// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import DarkModeToggle from "./DarkModeToggle";
import { FaSearch, FaUserCircle } from "react-icons/fa";

export default function Navbar({ usuario, onLogout, q, setQ }) {
  const navigate = useNavigate();

  const openDashboard = () => {
    if (!usuario) return navigate("/login");
    const destino = usuario.rol === "maestro" ? "/dashboard/maestro" : "/dashboard/alumno";
    navigate(destino);
  };

  return (
    <header className="w-full bg-[#006847] text-white px-6 py-3 shadow-md fixed top-0 left-0 right-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        <div className="flex items-center gap-3">
          <Link to="/">
            <img src="/logo-utn.png" alt="UTN" className="w-10 h-10" />
          </Link>
          <div>
            <div className="font-bold">Repositorio UTN</div>
            <div className="text-xs text-white/80">Material académico para Ingeniería</div>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-4 text-sm">
          <a href="/#inicio" className="hover:underline">Inicio</a>
          <a href="/#materiales" className="hover:underline">Materias</a>
          <a href="/#materiales" className="hover:underline">Archivos</a>
        </nav>

        <div className="flex-1 flex justify-center">
          <div className="bg-white px-3 py-1 rounded-full flex items-center gap-2 text-black shadow w-full max-w-xl">
            <FaSearch />
            <input
              value={q || ""}
              onChange={(e) => setQ && setQ(e.target.value)}
              placeholder="Buscar materia, autor o palabra clave..."
              className="outline-none bg-transparent w-full"
              aria-label="Buscar en repositorio"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={openDashboard} className="btn btn-ghost text-white">Dashboard</button>

          {usuario ? (
            <>
              <div className="flex items-center gap-2">
                <FaUserCircle className="text-2xl" />
                <div className="text-sm">
                  <div className="font-medium">{usuario.nombre}</div>
                  <div className="text-xs text-white/80">{usuario.correo}</div>
                </div>
              </div>
              <button onClick={onLogout} className="btn btn-ghost text-white">Salir</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-outline text-white">Iniciar sesión</Link>
          )}

          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}
