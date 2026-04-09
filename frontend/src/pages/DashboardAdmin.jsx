import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import DashboardShell from "../components/DashboardShell";

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

  useEffect(() => localStorage.setItem(USERS_KEY, JSON.stringify(usuarios)), [usuarios]);
  useEffect(() => localStorage.setItem(SUBJECTS_KEY, JSON.stringify(materias)), [materias]);
  useEffect(() => localStorage.setItem(MATERIALS_KEY, JSON.stringify(materiales)), [materiales]);

  const usuariosFiltrados = useMemo(() => {
    if (!filtroRol) return usuarios;
    return usuarios.filter((u) => u.role === filtroRol);
  }, [usuarios, filtroRol]);

  const crearUsuario = () => {
    const nombre = nuevoUsuario.nombre.trim();
    const correo = nuevoUsuario.correo.trim().toLowerCase();
    if (!nombre || !correo) return toast.error("Completa nombre y correo");
    if (usuarios.some((u) => u.correo.toLowerCase() === correo)) return toast.error("Ya existe un usuario con ese correo");

    setUsuarios((prev) => [...prev, { ...nuevoUsuario, nombre, correo, id: crypto.randomUUID() }]);
    setNuevoUsuario({ nombre: "", correo: "", role: "alumno" });
    toast.success("Usuario creado");
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Toaster position="top-right" />
      <DashboardShell role="admin" description="Supervisa usuarios, materiales, reportes y exportaciones del sistema.">
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200"><div className="stat-title">Usuarios</div><div className="stat-value text-primary">{usuarios.length}</div></div>
            <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200"><div className="stat-title">Materias</div><div className="stat-value text-primary">{materias.length}</div></div>
            <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200"><div className="stat-title">Materiales</div><div className="stat-value text-primary">{materiales.length}</div></div>
          </div>


          <div className="grid lg:grid-cols-3 gap-3">
            <div className="alert alert-info"><div><span className="badge badge-info badge-outline">Usuarios</span><p className="text-sm mt-1">Crear, filtrar y eliminar cuentas por rol.</p></div></div>
            <div className="alert alert-info"><div><span className="badge badge-info badge-outline">Materiales</span><p className="text-sm mt-1">Supervisar materiales globales y coordinar limpieza.</p></div></div>
            <div className="alert alert-info"><div><span className="badge badge-info badge-outline">Reportes</span><p className="text-sm mt-1">Exportaciones y reportes para evidencias de exposición.</p></div></div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <section className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h2 className="card-title">Gestión de usuarios</h2>
                <div className="grid md:grid-cols-3 gap-2">
                  <input className="input input-bordered" placeholder="Nombre" value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario((s) => ({ ...s, nombre: e.target.value }))} />
                  <input className="input input-bordered" placeholder="Correo" value={nuevoUsuario.correo} onChange={(e) => setNuevoUsuario((s) => ({ ...s, correo: e.target.value }))} />
                  <select className="select select-bordered" value={nuevoUsuario.role} onChange={(e) => setNuevoUsuario((s) => ({ ...s, role: e.target.value }))}>
                    <option value="alumno">Alumno</option><option value="maestro">Maestro</option><option value="admin">Administrador</option>
                  </select>
                </div>
                <button className="btn btn-primary" onClick={crearUsuario}>Crear usuario</button>

                <div className="overflow-x-auto">
                  <table className="table table-zebra table-sm">
                    <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th></th></tr></thead>
                    <tbody>
                      {usuariosFiltrados.map((u) => (
                        <tr key={u.id}>
                          <td>{u.nombre}</td><td>{u.correo}</td><td><span className="badge badge-outline">{u.role}</span></td>
                          <td><button className="btn btn-xs btn-error text-white" onClick={() => setUsuarios((prev) => prev.filter((x) => x.id !== u.id))}>Eliminar</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <select className="select select-bordered select-sm w-full md:w-52" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                  <option value="">Todos los roles</option><option value="alumno">Alumno</option><option value="maestro">Maestro</option><option value="admin">Administrador</option>
                </select>
              </div>
            </section>

            <section className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h2 className="card-title">Materias, reportes y exportaciones</h2>
                <div className="join join-vertical sm:join-horizontal w-full">
                  <input className="input input-bordered join-item flex-1" placeholder="Nueva materia" value={nuevaMateria} onChange={(e) => setNuevaMateria(e.target.value)} />
                  <button className="btn btn-primary join-item sm:w-auto w-full" onClick={() => {
                    const value = nuevaMateria.trim();
                    if (!value) return toast.error("Escribe una materia");
                    if (materias.some((m) => m.toLowerCase() === value.toLowerCase())) return toast.error("La materia ya existe");
                    setMaterias((prev) => [...prev, value]);
                    setNuevaMateria("");
                  }}>Agregar</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {materias.map((m) => <span key={m} className="badge badge-neutral badge-lg">{m}</span>)}
                </div>
                <div className="alert alert-info text-sm">Exportaciones y reportes están integrados en backend (rutas /api/admin/*). Esta vista usa simulación local para exposición.</div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-outline" onClick={() => toast.success("Exportación CSV simulada")}>Exportar CSV</button>
                  <button className="btn btn-outline" onClick={() => toast.success("Reporte PDF simulado")}>Generar reporte</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
