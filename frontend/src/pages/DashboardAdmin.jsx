import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const USERS_KEY = "admin_usuarios";
const SUBJECTS_KEY = "admin_materias";
const MATERIALS_KEY = "materiales";

const initialUsers = [
  { id: 1, nombre: "Alumno Demo", correo: "alumno@utn.com", role: "alumno" },
  { id: 2, nombre: "Maestro Demo", correo: "maestro@utn.com", role: "maestro" },
  { id: 3, nombre: "Admin Demo", correo: "admin@utn.com", role: "admin" },
];

const initialSubjects = ["Desarrollo Web", "Bases de Datos", "POO", "Redes"];

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export default function DashboardAdmin() {
  const [usuarios, setUsuarios] = useState(() => safeRead(USERS_KEY, initialUsers));
  const [materias, setMaterias] = useState(() => safeRead(SUBJECTS_KEY, initialSubjects));
  const [materiales, setMateriales] = useState(() => safeRead(MATERIALS_KEY, []));
  const [nuevaMateria, setNuevaMateria] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", correo: "", role: "alumno" });
  const [filtroRol, setFiltroRol] = useState("");

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
  }, [usuarios]);

  useEffect(() => {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(materias));
  }, [materias]);

  useEffect(() => {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materiales));
  }, [materiales]);

  const usuariosFiltrados = useMemo(() => {
    if (!filtroRol) return usuarios;
    return usuarios.filter((u) => u.role === filtroRol);
  }, [usuarios, filtroRol]);

  const crearUsuario = () => {
    const nombre = nuevoUsuario.nombre.trim();
    const correo = nuevoUsuario.correo.trim().toLowerCase();

    if (!nombre || !correo) {
      toast.error("Completa nombre y correo");
      return;
    }

    const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
    if (!correoValido) {
      toast.error("Ingresa un correo válido");
      return;
    }

    if (usuarios.some((u) => u.correo.toLowerCase() === correo)) {
      toast.error("Ya existe un usuario con ese correo");
      return;
    }

    setUsuarios((prev) => [...prev, { ...nuevoUsuario, nombre, correo, id: crypto.randomUUID() }]);
    setNuevoUsuario({ nombre: "", correo: "", role: "alumno" });
    toast.success("Usuario creado");
  };

  const eliminarUsuario = (id) => {
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    toast.success("Usuario eliminado");
  };

  const agregarMateria = () => {
    const value = nuevaMateria.trim();
    if (!value) {
      toast.error("Escribe una materia");
      return;
    }

    if (materias.some((m) => m.toLowerCase() === value.toLowerCase())) {
      toast.error("La materia ya existe");
      return;
    }

    setMaterias((prev) => [...prev, value]);
    setNuevaMateria("");
    toast.success("Materia agregada");
  };

  const eliminarMateria = (m) => {
    setMaterias((prev) => prev.filter((x) => x !== m));
    toast.success("Materia eliminada");
  };

  const eliminarMaterial = (id) => {
    setMateriales((prev) => prev.filter((m) => m.id !== id));
    toast.success("Material eliminado del sistema");
  };

  const limpiarMateriales = () => {
    if (materiales.length === 0) {
      toast("No hay materiales para limpiar");
      return;
    }
    setMateriales([]);
    toast.success("Todos los materiales fueron eliminados");
  };

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="navbar bg-primary text-white px-6 rounded-xl">
          <h1 className="font-bold">Administrador - UTN</h1>
        </div>

        <h2 className="text-2xl font-bold">Panel de Administración</h2>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="card bg-base-100 shadow p-4">Usuarios: <strong>{usuarios.length}</strong></div>
          <div className="card bg-base-100 shadow p-4">Materias: <strong>{materias.length}</strong></div>
          <div className="card bg-base-100 shadow p-4">Materiales: <strong>{materiales.length}</strong></div>
        </div>

        <section className="grid lg:grid-cols-2 gap-6">
          <article className="card bg-base-100 shadow p-4 space-y-3">
            <h3 className="font-semibold">Gestionar usuarios</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className="input input-bordered" placeholder="Nombre" value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario((s) => ({ ...s, nombre: e.target.value }))} />
              <input className="input input-bordered" placeholder="Correo" value={nuevoUsuario.correo} onChange={(e) => setNuevoUsuario((s) => ({ ...s, correo: e.target.value }))} />
              <select className="select select-bordered" value={nuevoUsuario.role} onChange={(e) => setNuevoUsuario((s) => ({ ...s, role: e.target.value }))}>
                <option value="alumno">Alumno</option>
                <option value="maestro">Maestro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <button className="btn btn-primary" onClick={crearUsuario}>Crear usuario</button>

            <div className="flex gap-2 items-center">
              <label className="text-sm">Filtrar por rol:</label>
              <select className="select select-sm select-bordered" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                <option value="">Todos</option>
                <option value="alumno">Alumno</option>
                <option value="maestro">Maestro</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="space-y-2">
              {usuariosFiltrados.map((u) => (
                <div key={u.id} className="border rounded p-2 flex items-center justify-between gap-2">
                  <span className="truncate">{u.nombre} ({u.role})</span>
                  <button className="btn btn-xs btn-error text-white" onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
                </div>
              ))}
            </div>
          </article>

          <article className="card bg-base-100 shadow p-4 space-y-3">
            <h3 className="font-semibold">Gestionar materias</h3>
            <div className="flex gap-2">
              <input className="input input-bordered flex-1" placeholder="Nueva materia" value={nuevaMateria} onChange={(e) => setNuevaMateria(e.target.value)} />
              <button className="btn btn-primary" onClick={agregarMateria}>Agregar</button>
            </div>
            <div className="space-y-2">
              {materias.map((m) => (
                <div key={m} className="border rounded p-2 flex items-center justify-between">
                  <span>{m}</span>
                  <button className="btn btn-xs btn-error text-white" onClick={() => eliminarMateria(m)}>Eliminar</button>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="card bg-base-100 shadow p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="font-semibold">Gestionar todos los materiales</h3>
            <button className="btn btn-sm btn-outline" onClick={limpiarMateriales}>Limpiar todo</button>
          </div>

          <div className="space-y-2">
            {materiales.length === 0 ? <p className="text-sm text-gray-500">Sin materiales cargados.</p> : null}
            {materiales.map((m) => (
              <div key={m.id} className="border rounded p-2 flex items-center justify-between gap-2">
                <span className="truncate">{m.titulo} — {m.materia}</span>
                <button className="btn btn-xs btn-error text-white" onClick={() => eliminarMaterial(m.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
