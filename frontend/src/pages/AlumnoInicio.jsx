import { useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaDownload, FaSearch } from "react-icons/fa";
import DashboardShell from "../components/DashboardShell";
import { getImageForSubject } from "../utils/subjectImages";

const demoData = [
  { id: 1, titulo: "Guía de prácticas", tipo: "PDF", materia: "Desarrollo Web", fecha: "2026-04-01" },
  { id: 2, titulo: "Ejercicios resueltos", tipo: "DOCX", materia: "POO", fecha: "2026-04-03" },
  { id: 3, titulo: "Presentación clase 3", tipo: "PPTX", materia: "Redes", fecha: "2026-04-05" },
];

export default function AlumnoInicio() {
  const [q, setQ] = useState("");
  const [materia, setMateria] = useState("");
  const [status, setStatus] = useState("idle");

  const materiales = useMemo(() => {
    const stored = JSON.parse(localStorage.getItem("materiales") || "[]");
    return stored.length ? stored : demoData;
  }, []);

  const materias = useMemo(
    () => [...new Set(materiales.map((m) => m.materia).filter(Boolean))],
    [materiales]
  );

<<<<<<< Updated upstream
  const filtrados = useMemo(() => {
    const query = q.trim().toLowerCase();
    return materiales.filter((m) => {
      const bySearch = !query || (m.titulo || "").toLowerCase().includes(query) || (m.tipo || "").toLowerCase().includes(query);
      const bySubject = !materia || m.materia === materia;
      return bySearch && bySubject;
=======
  useEffect(() => { debounced(q); }, [q, debounced]);

  const clasesBase = [
    { name: "Desarrollo de Web Profesional", teacher: "Ing. STEPHANY ANAHÍ LÓPEZ LIZÁRRAGA", cover: getImageForSubject("Desarrollo Web") },
    { name: "Administracion de Bases de Datos", teacher: "Ing. JUAN MANUEL TOVAR SÁNCHEZ", cover: getImageForSubject("Bases de Datos") },
    { name: "Seguridad en el Desarrollo de Aplicaciones", teacher: "Ing. OSCAR ARENAS GÓMEZ	", cover: getImageForSubject("seguridad") },
    { name: "Ingles VII", teacher: "JUAN MANUEL RAMIREZ", cover: getImageForSubject("INGLES") },
    { name: "Planeación y Organización del Trabajo", teacher: "Ing. LEONARDO DANIEL GUERRA ISIORDIA", cover: getImageForSubject("Planeacion") }
    
  ];
  const clases = clasesBase.map((clase) => ({
    ...clase,
    filesCount: materiales.filter((m) => m.materia === clase.name).length
  }));
  const claseSeleccionada = clases.find((c) => c.name === materiaSel) || null;

  const materialesFiltrados = useMemo(() => {
    const s = debQ.trim().toLowerCase();
    return materiales.filter(m => {
      if (!s) return true;
      return (m.titulo || "").toLowerCase().includes(s) || (m.materia || "").toLowerCase().includes(s);
>>>>>>> Stashed changes
    });
  }, [materiales, q, materia]);

  const downloadSim = (item) => {
    setStatus("success");
    toast.success(`Descarga iniciada: ${item.titulo}`);
  };

  const loading = false;
  const hasError = status === "error";

  return (
    <div className="min-h-screen bg-base-200">
      <Toaster position="top-right" />
      <DashboardShell
        role="alumno"
        description="Consulta y descarga material didáctico de tus materias asignadas."
      >

        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <div className="alert alert-success">
            <div>
              <h3 className="font-semibold">Permisos de alumno</h3>
              <p className="text-sm">Puedes consultar, buscar y descargar materiales.</p>
            </div>
          </div>
          <div className="alert alert-warning">
            <div>
              <h3 className="font-semibold">Acciones restringidas</h3>
              <p className="text-sm">No puedes subir, editar ni eliminar materiales.</p>
            </div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm border border-base-200 mb-4">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-3">
              <label className="input input-bordered w-full flex items-center gap-2">
                <FaSearch className="text-base-content/60" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título o tipo" />
              </label>
              <select className="select select-bordered w-full md:w-72" value={materia} onChange={(e) => setMateria(e.target.value)}>
                <option value="">Todas las materias</option>
                {materias.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? <div className="alert">Cargando materiales...</div> : null}
        {hasError ? <div className="alert alert-error">No fue posible cargar los materiales.</div> : null}
        {status === "success" ? <div className="alert alert-success mb-4">Acción realizada correctamente.</div> : null}

        {filtrados.length === 0 ? (
          <div className="alert alert-info">No hay materiales para el filtro seleccionado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrados.map((m) => (
              <article key={m.id} className="card bg-base-100 shadow border border-base-200">
                <figure className="h-32 overflow-hidden">
                  <img src={getImageForSubject(m.materia)} alt={m.materia} className="w-full h-full object-cover" loading="lazy" />
                </figure>
                <div className="card-body p-4">
                  <h2 className="card-title text-base">{m.titulo}</h2>
                  <p className="text-sm text-base-content/70">{m.tipo} · {m.materia}</p>
                  <p className="text-xs text-base-content/60">Publicado: {new Date(m.fecha).toLocaleDateString()}</p>
                  <div className="card-actions justify-end mt-2">
                    <button className="btn btn-sm btn-primary" onClick={() => downloadSim(m)}>
                      <FaDownload /> Descargar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DashboardShell>
    </div>
  );
}
