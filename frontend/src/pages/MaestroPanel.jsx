import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { HiPlus, HiTrash, HiSearch, HiDocumentText } from "react-icons/hi";
import { canTeacherManageSubject, getStoredUser, normalizeRole } from "../utils/auth";
import { getImageForSubject } from "../utils/subjectImages";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/zip": [".zip"],
  "image/*": [".png", ".jpg", ".jpeg", ".webp"],
};

export default function MaestroPanel() {
  const usuario = getStoredUser();
  const role = normalizeRole(usuario);
  const materiasPermitidas = useMemo(() => (Array.isArray(usuario?.materias) ? usuario.materias : []), [usuario]);

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [materia, setMateria] = useState(materiasPermitidas[0] || "");
  const [materiales, setMateriales] = useState([]);
  const [query, setQuery] = useState("");
  const [filterMateria, setFilterMateria] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem("materiales") || "[]");
    const visibles = guardados.filter((m) => {
      if (role === "admin") return true;
      return canTeacherManageSubject(usuario, m.materia);
    });
    setMateriales(visibles);
  }, [role, usuario]);

  const persistMateriales = (updater) => {
    const all = JSON.parse(localStorage.getItem("materiales") || "[]");
    const updatedLocal = updater(all);
    localStorage.setItem("materiales", JSON.stringify(updatedLocal));

    const visibles = updatedLocal.filter((m) => {
      if (role === "admin") return true;
      return canTeacherManageSubject(usuario, m.materia);
    });
    setMateriales(visibles);
  };

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles?.length) return;
    const file = acceptedFiles[0];

    if (!materia || !canTeacherManageSubject(usuario, materia)) {
      toast.error("Solo puedes subir material de tus materias asignadas");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Archivo demasiado grande. Máx 10 MB.");
      return;
    }

    setUploading(true);
    try {
      // En flujo MVP se guarda localmente con metadatos del autor.
      const nuevo = {
        id: crypto.randomUUID(),
        titulo: titulo.trim() || file.name,
        tipo: tipo.trim() || file.type || "Archivo",
        materia,
        nombreArchivo: file.name,
        size: file.size,
        fecha: new Date().toISOString(),
        ownerEmail: usuario?.correo,
      };

      persistMateriales((all) => [nuevo, ...all]);
      setTitulo("");
      setTipo("");
      toast.success("Material subido correctamente");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
  });

  const guardarMaterial = () => {
    if (!titulo.trim() || !tipo.trim() || !materia.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    if (!canTeacherManageSubject(usuario, materia)) {
      toast.error("No tienes permiso para gestionar esa materia");
      return;
    }

    const nuevo = {
      id: crypto.randomUUID(),
      titulo: titulo.trim(),
      tipo: tipo.trim(),
      materia: materia.trim(),
      nombreArchivo: null,
      size: 0,
      fecha: new Date().toISOString(),
      ownerEmail: usuario?.correo,
    };

    persistMateriales((all) => [nuevo, ...all]);
    setTitulo("");
    setTipo("");
    toast.success("Material guardado");
  };

  const eliminarMaterial = (item) => {
    if (!confirm("¿Eliminar este material?")) return;

    const puedeEliminar = role === "admin" || canTeacherManageSubject(usuario, item.materia);
    if (!puedeEliminar) {
      toast.error("No tienes permiso para eliminar este material");
      return;
    }

    persistMateriales((all) => all.filter((m) => m.id !== item.id));
    toast.success("Material eliminado");
  };

  const materialesFiltrados = useMemo(() => {
    return materiales.filter((m) => {
      const matchesQuery =
        !query ||
        m.titulo.toLowerCase().includes(query.toLowerCase()) ||
        (m.materia || "").toLowerCase().includes(query.toLowerCase());
      const matchesMateria = !filterMateria || (m.materia || "") === filterMateria;
      return matchesQuery && matchesMateria;
    });
  }, [materiales, query, filterMateria]);

  const materiasUnicas = Array.from(new Set(materiales.map((m) => m.materia).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#006847]">Panel Maestro</h1>
          <p className="text-sm text-gray-600">
            Gestiona únicamente materiales de tus materias asignadas.
          </p>
        </motion.header>

        <div className="mb-4 p-3 rounded-lg bg-white border text-sm text-gray-700">
          Materias permitidas: <strong>{materiasPermitidas.join(", ") || "Sin materias asignadas"}</strong>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.section initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="card bg-white p-6 shadow">
            <h2 className="text-lg font-semibold mb-3">Subir nuevo material</h2>

            <label className="block mb-2">
              <span className="text-sm text-gray-700">Título</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input input-bordered w-full mt-1" />
            </label>

            <label className="block mb-2">
              <span className="text-sm text-gray-700">Tipo</span>
              <input value={tipo} onChange={(e) => setTipo(e.target.value)} className="input input-bordered w-full mt-1" placeholder="PDF, DOCX..." />
            </label>

            <label className="block mb-4">
              <span className="text-sm text-gray-700">Materia</span>
              <select value={materia} onChange={(e) => setMateria(e.target.value)} className="select select-bordered w-full mt-1">
                {materiasPermitidas.length === 0 ? <option value="">Sin materias</option> : null}
                {materiasPermitidas.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>

            <div {...getRootProps()} className={`border-dashed border-2 rounded p-4 text-center cursor-pointer transition ${isDragActive ? "border-[#006847] bg-[#f0fff6]" : "border-gray-200 bg-white"}`}>
              <input {...getInputProps()} />
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <HiPlus /> Arrastra o haz click para seleccionar un archivo
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={guardarMaterial} className="btn bg-[#006847] text-white flex-1" disabled={uploading || !materiasPermitidas.length}>
                {uploading ? "Subiendo..." : "Guardar"}
              </button>
              <button onClick={() => { setTitulo(""); setTipo(""); }} className="btn btn-ghost flex-1">Limpiar</button>
            </div>
          </motion.section>

          <motion.aside initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 w-full md:w-1/2">
                <HiSearch className="text-gray-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por título o materia" className="input input-bordered w-full" />
              </div>

              <div className="flex items-center gap-2">
                <select value={filterMateria} onChange={(e) => setFilterMateria(e.target.value)} className="select select-bordered">
                  <option value="">Todas las materias</option>
                  {materiasUnicas.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materialesFiltrados.length === 0 && <div className="p-6 bg-white rounded shadow text-gray-500">No hay materiales</div>}

              {materialesFiltrados.map((m) => (
                <motion.article key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded shadow overflow-hidden flex flex-col justify-between">
                  <img
                    src={getImageForSubject(m.materia)}
                    alt={`Imagen representativa de ${m.materia || "la materia"}`}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                  />

                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-[#f0fff6] text-[#006847]"><HiDocumentText size={20} /></div>
                      <div>
                        <h3 className="font-semibold">{m.titulo}</h3>
                        <p className="text-xs text-gray-500">{m.tipo} • {m.materia}</p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 pb-4 mt-1 flex items-center justify-end gap-2">
                    <button onClick={() => eliminarMaterial(m)} className="btn btn-sm btn-error text-white flex items-center gap-2"><HiTrash /> Eliminar</button>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
