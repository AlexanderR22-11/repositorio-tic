import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const initialUsers = [
  { id: 1, nombre: "Alumno Demo", correo: "alumno@utn.com", role: "alumno" },
  { id: 2, nombre: "Maestro Demo", correo: "maestro@utn.com", role: "maestro" },
  { id: 3, nombre: "Admin Demo", correo: "admin@utn.com", role: "admin" },
];

const initialSubjects = ["Desarrollo Web", "Bases de Datos", "POO", "Redes"];

export default function DashboardAdmin() {
  const [usuarios, setUsuarios] = useState(initialUsers);
  const [materias, setMaterias] = useState(initialSubjects);
  const [nuevaMateria, setNuevaMateria] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", correo: "", role: "alumno" });

  const materiales = useMemo(() => JSON.parse(localStorage.getItem("materiales") || "[]"), [usuarios, materias]);

  const crearUsuario = () => {
    if (!nuevoUsuario.nombre.trim() || !nuevoUsuario.correo.trim()) {
      toast.error("Completa nombre y correo");
      return;
    }
    setUsuarios((prev) => [...prev, { ...nuevoUsuario, id: crypto.randomUUID() }]);
    setNuevoUsuario({ nombre: "", correo: "", role: "alumno" });
    toast.success("Usuario creado");
  };

  const eliminarUsuario = (id) => {
    setUsuarios((prev) => prev.filter((u) => u.id !== id));
    toast.success("Usuario eliminado");
  };

  const agregarMateria = () => {
    const value = nuevaMateria.trim();
    if (!value) return;
    if (materias.includes(value)) {
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
    const actual = JSON.parse(localStorage.getItem("materiales") || "[]");
    localStorage.setItem("materiales", JSON.stringify(actual.filter((m) => m.id !== id)));
    toast.success("Material eliminado del sistema");
    // Trigger render mínimo
    setMaterias((prev) => [...prev]);
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

            <div className="space-y-2">
              {usuarios.map((u) => (
                <div key={u.id} className="border rounded p-2 flex items-center justify-between">
                  <span>{u.nombre} ({u.role})</span>
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
          <h3 className="font-semibold mb-3">Gestionar todos los materiales</h3>
          <div className="space-y-2">
            {materiales.length === 0 ? <p className="text-sm text-gray-500">Sin materiales cargados.</p> : null}
            {materiales.map((m) => (
              <div key={m.id} className="border rounded p-2 flex items-center justify-between">
                <span>{m.titulo} — {m.materia}</span>
                <button className="btn btn-xs btn-error text-white" onClick={() => eliminarMaterial(m.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
