// src/pages/MaestroPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { HiPlus, HiTrash, HiSearch, HiDocumentText } from "react-icons/hi";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/zip": [".zip"],
  "image/*": [".png", ".jpg", ".jpeg", ".webp"],
};

export default function MaestroPanel() {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  const [materia, setMateria] = useState("");
  const [materiales, setMateriales] = useState([]);
  const [query, setQuery] = useState("");
  const [filterMateria, setFilterMateria] = useState("");
  const [uploading, setUploading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  useEffect(() => {
    const guardados = JSON.parse(localStorage.getItem("materiales")) || [];
    setMateriales(guardados);
  }, []);

  // Helper: get token from storage (adjust key if you store it differently)
  const getToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
  };

  // Dropzone para archivos (envía al backend)
  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Archivo demasiado grande. Máx 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file); // backend espera 'file'
      form.append("titulo", titulo || file.name);
      form.append("autor", "Fabian"); // ajustar según tu auth/usuario real
      form.append("created_by", "1"); // ajustar al id real del usuario si lo tienes

      const token = getToken();

      const res = await fetch("http://localhost:3000/api/documents", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          // NO establecer Content-Type; el navegador lo hará con boundary
        },
        body: form,
      });

      const text = await res.text();
      if (!res.ok) {
        let err;
        try {
          err = JSON.parse(text);
        } catch (e) {
          err = text || res.statusText;
        }
        throw new Error(typeof err === "string" ? err : JSON.stringify(err));
      }

      const data = JSON.parse(text);
      // data esperado: { id, titulo, archivo_url, created_by, ... }
      const nuevo = {
        titulo: data.titulo || titulo || file.name,
        tipo: tipo || file.type || "Archivo",
        materia: materia || "General",
        nombreArchivo: file.name,
        size: file.size,
        fecha: new Date().toISOString(),
        archivo_url: data.archivo_url,
        id: data.id,
        created_by: data.created_by,
      };

      const nuevosMateriales = [nuevo, ...materiales];
      setMateriales(nuevosMateriales);
      localStorage.setItem("materiales", JSON.stringify(nuevosMateriales));

      setTitulo("");
      setTipo("");
      setMateria("");
      toast.success("Material subido correctamente");
    } catch (err) {
      console.error("[UPLOAD ERROR]", err);
      toast.error("Error al subir archivo: " + (err.message || ""));
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

    const nuevo = {
      titulo: titulo.trim(),
      tipo: tipo.trim(),
      materia: materia.trim(),
      nombreArchivo: null,
      size: 0,
      fecha: new Date().toISOString(),
    };

    const nuevosMateriales = [nuevo, ...materiales];
    setMateriales(nuevosMateriales);
    localStorage.setItem("materiales", JSON.stringify(nuevosMateriales));

    setTitulo("");
    setTipo("");
    setMateria("");
    toast.success("Material guardado");
  };

  // Eliminar local + opcionalmente backend si existe id
  const eliminarMaterial = async (index) => {
    if (!confirm("¿Eliminar este material? Esta acción no se puede deshacer.")) return;
    const globalIndex = (page - 1) * PAGE_SIZE + index;
    const item = materiales[globalIndex];

    // Si el item tiene id (guardado en backend), intenta eliminar en backend
    if (item && item.id) {
      try {
        const token = getToken();
        const res = await fetch(`http://localhost:3000/api/documents/${item.id}`, {
          method: "DELETE",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        if (!res.ok) {
          const text = await res.text();
          console.warn("No se pudo eliminar en backend:", res.status, text);
          // continuar con eliminación local de todos modos si quieres
        } else {
          toast.success("Eliminado del servidor");
        }
      } catch (err) {
        console.error("Error al eliminar en backend:", err);
      }
    }

    const nuevos = materiales.filter((_, i) => i !== globalIndex);
    setMateriales(nuevos);
    localStorage.setItem("materiales", JSON.stringify(nuevos));
    toast.success("Material eliminado");
  };

  // Descargar archivo (si archivo_url está presente)
  const descargar = async (m) => {
    if (!m || !m.archivo_url) {
      toast("No hay archivo para descargar");
      return;
    }
    try {
      const url = `http://localhost:3000${m.archivo_url}`;
      // Usar fetch para obtener el blob y forzar descarga
      const res = await fetch(url, {
        headers: {
          Authorization: getToken() ? `Bearer ${getToken()}` : "",
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = m.nombreArchivo || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Error al descargar:", err);
      toast.error("Error al descargar archivo");
    }
  };

  // Filtrado y paginación
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

  const totalPages = Math.max(1, Math.ceil(materialesFiltrados.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const pageItems = materialesFiltrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Lista de materias para filtro
  const materiasUnicas = Array.from(new Set(materiales.map((m) => m.materia).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-6xl mx-auto">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl font-extrabold text-[#006847]">Panel Maestro</h1>
          <p className="text-sm text-gray-600">Administra y sube materiales al repositorio institucional</p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulario y Dropzone */}
          <motion.section initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="card bg-white p-6 shadow">
            <h2 className="text-lg font-semibold mb-3">Subir nuevo material</h2>

            <label className="block mb-2">
              <span className="text-sm text-gray-700">Título</span>
              <input value={titulo} onChange={(e) => setTitulo(e.target.value)} className="input input-bordered w-full mt-1" placeholder="Ej. Guía de prácticas" />
            </label>

            <label className="block mb-2">
              <span className="text-sm text-gray-700">Tipo</span>
              <input value={tipo} onChange={(e) => setTipo(e.target.value)} className="input input-bordered w-full mt-1" placeholder="PDF, DOCX, ZIP..." />
            </label>

            <label className="block mb-4">
              <span className="text-sm text-gray-700">Materia</span>
              <input value={materia} onChange={(e) => setMateria(e.target.value)} className="input input-bordered w-full mt-1" placeholder="Desarrollo Web" />
            </label>

            <div {...getRootProps()} className={`border-dashed border-2 rounded p-4 text-center cursor-pointer transition ${isDragActive ? "border-[#006847] bg-[#f0fff6]" : "border-gray-200 bg-white"}`}>
              <input {...getInputProps()} />
              <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                <HiPlus /> Arrastra o haz click para seleccionar un archivo
              </p>
              <p className="text-xs text-gray-400 mt-1">Tipos: PDF, DOCX, imágenes. Máx 10 MB.</p>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={guardarMaterial} className="btn bg-[#006847] text-white flex-1" disabled={uploading}>
                {uploading ? "Subiendo..." : "Guardar sin archivo"}
              </button>
              <button onClick={() => { setTitulo(""); setTipo(""); setMateria(""); }} className="btn btn-ghost flex-1">Limpiar</button>
            </div>
          </motion.section>

          {/* Panel de búsqueda y filtros */}
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

                <div className="text-sm text-gray-500">Resultados: <span className="font-medium">{materialesFiltrados.length}</span></div>
              </div>
            </div>

            {/* Lista de materiales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pageItems.length === 0 && <div className="p-6 bg-white rounded shadow text-gray-500">No hay materiales</div>}

              {pageItems.map((m, i) => (
                <motion.article key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-4 rounded shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded bg-[#f0fff6] text-[#006847]"><HiDocumentText size={20} /></div>
                      <div>
                        <h3 className="font-semibold">{m.titulo}</h3>
                        <p className="text-xs text-gray-500">{m.tipo} • {m.materia}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mt-3">Subido: {new Date(m.fecha).toLocaleString()}</p>
                    {m.nombreArchivo && <p className="text-xs text-gray-400">Archivo: {m.nombreArchivo} • {(m.size/1024).toFixed(1)} KB</p>}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button onClick={() => descargar(m)} className="btn btn-sm btn-outline">Descargar</button>
                    <button onClick={() => eliminarMaterial(i)} className="btn btn-sm btn-error text-white flex items-center gap-2"><HiTrash /> Eliminar</button>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Paginación simple */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">Página {page} de {totalPages}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p-1))} className="btn btn-sm" disabled={page === 1}>Anterior</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} className="btn btn-sm" disabled={page === totalPages}>Siguiente</button>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
