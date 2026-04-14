// frontend/src/pages/MaestroPanel.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { HiPlus, HiTrash, HiSearch, HiDocumentText } from "react-icons/hi";
import { getStoredUser, normalizeRole } from "../utils/auth";
import { getImageForSubject } from "../utils/subjectImages";
import DashboardShell from "../components/DashboardShell";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/zip": [".zip"],
  "image/*": [".png", ".jpg", ".jpeg", ".webp"],
};

export default function MaestroPanel() {
  // Usuario (memoizado para evitar recreaciones)
  const usuario = useMemo(() => getStoredUser(), []);
  const role = normalizeRole(usuario);

  // UI state
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("");
  // materia guarda el category id seleccionado (string)
  const [materia, setMateria] = useState("");
  const [materiales, setMateriales] = useState([]);
  const [query, setQuery] = useState("");
  const [filterMateria, setFilterMateria] = useState("");
  const [uploading, setUploading] = useState(false);

  // categories from backend { id, name }
  const [categories, setCategories] = useState([]);

  // Helpers: token and unauthorized handler
  const getToken = useCallback(() => {
    const s = sessionStorage.getItem("token");
    if (s && s.trim()) return s;
    const l = localStorage.getItem("token");
    if (l && l.trim()) return l;
    return "";
  }, []);

  const handleUnauthorized = useCallback(async (res) => {
    if (res && res.status === 401) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      toast.error("Sesión expirada. Inicia sesión nuevamente.");
      setTimeout(() => (window.location.href = "/login"), 900);
      return true;
    }
    return false;
  }, []);

  // Cargar categorías una sola vez al montar (AbortController + protección)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const loadCategories = async () => {
      try {
        const token = getToken();
        const base = import.meta.env.VITE_API_BASE || "";
        const url = `${base}/api/categories`;

        const res = await fetch(url, {
          method: "GET",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        if (await handleUnauthorized(res)) return;

        if (!res.ok) {
          if (mounted) setCategories([]);
          return;
        }

        const data = await res.json().catch(() => null);
        if (!mounted) return;

        const next = Array.isArray(data?.categories)
          ? data.categories.map((c) => ({ id: String(c.id), name: c.name }))
          : [];

        setCategories((prev) => {
          const same =
            prev.length === next.length &&
            (next.length === 0 || (prev[0]?.id === next[0]?.id && prev[0]?.name === next[0]?.name));
          return same ? prev : next;
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("loadCategories error:", err);
          if (mounted) setCategories([]);
        }
      }
    };

    loadCategories();
    return () => {
      mounted = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ejecutar solo al montar

  // Inicializar materia cuando categories cambien (usar el primer category si existe)
  useEffect(() => {
    if (categories.length > 0) {
      setMateria((prev) => (prev ? prev : categories[0].id));
    } else {
      setMateria("");
    }
  }, [categories.length, categories[0]?.id]);

  // Persist local materials (drafts) - merge-aware
  const persistMateriales = (updater) => {
    const all = JSON.parse(localStorage.getItem("materiales") || "[]");
    const updatedLocal = updater(all);

    // Separate server docs (numeric id) and local drafts (non-numeric id)
    const serverDocs = updatedLocal.filter((item) => Number(item.id));
    const localDrafts = updatedLocal.filter((item) => !Number(item.id));

    const merged = [...serverDocs, ...localDrafts];
    localStorage.setItem("materiales", JSON.stringify(merged));
    setMateriales(merged);
  };

  // Helper: fetch documents from server for a category (or all)
  const fetchDocuments = useCallback(
    async (categoryId = materia) => {
      try {
        const token = getToken();
        const base = import.meta.env.VITE_API_BASE || "";
        if (!token) {
          // fallback local
          const guardados = JSON.parse(localStorage.getItem("materiales") || "[]");
          setMateriales(guardados);
          return [];
        }

        const url = categoryId ? `${base}/api/documents?category_id=${encodeURIComponent(categoryId)}` : `${base}/api/documents`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (await handleUnauthorized(res)) return [];
        if (!res.ok) return [];

        const data = await res.json().catch(() => null);
        const docs = Array.isArray(data?.documents)
          ? data.documents.map((d) => {
              const cat = categories.find((c) => c.id === String(d.category_id));
              return {
                id: d.id,
                titulo: d.titulo,
                tipo: d.mime_type || (d.file_name ? d.file_name.split(".").pop() : "Archivo"),
                materia: cat ? cat.name : String(d.category_id || ""),
                nombreArchivo: d.file_name,
                size: d.size,
                created_at: d.created_at,
                created_by: d.created_by,
              };
            })
          : [];

        setMateriales((prev) => {
          const same = prev.length === docs.length && (docs.length === 0 || prev[0]?.id === docs[0]?.id);
          return same ? prev : docs;
        });

        // merge server docs with local drafts
        const localDrafts = JSON.parse(localStorage.getItem("materiales") || "[]").filter((m) => !Number(m.id));
        const merged = [...docs, ...localDrafts];
        localStorage.setItem("materiales", JSON.stringify(merged));

        return docs;
      } catch (err) {
        console.error("fetchDocuments error", err);
        return [];
      }
    },
    [categories, getToken, handleUnauthorized, materia]
  );

  // Cargar materiales inicialmente (cuando categories o materia cambien)
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        await fetchDocuments(materia);
      } catch (err) {
        if (err.name !== "AbortError") console.error("initial loadMaterials error", err);
      }
    };

    if (mounted) load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [categories, materia, fetchDocuments]);

  // Upload to server helper (now refreshes from server after success)
  const uploadToServer = useCallback(
    async (file, tituloValue, descripcionValue, categoryId) => {
      const token = getToken();
      if (!token) {
        toast.error("Inicia sesión para subir archivos");
        return null;
      }

      if (!categoryId) {
        toast.error("Selecciona una categoría válida");
        return null;
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("titulo", tituloValue || file.name);
      fd.append("descripcion", descripcionValue || "");
      fd.append("category_id", String(categoryId));

      try {
        const base = import.meta.env.VITE_API_BASE || "";
        const res = await fetch(`${base}/api/documents`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        if (await handleUnauthorized(res)) return null;

        const data = await res.json().catch(() => null);
        if (!res.ok) {
          toast.error((data && (data.message || data.error)) || `Error ${res.status}`);
          return null;
        }

        // Refresh list from server for the category
        await fetchDocuments(String(categoryId));
        return data.document;
      } catch (err) {
        console.error("uploadToServer error", err);
        toast.error("Error al subir archivo");
        return null;
      }
    },
    [fetchDocuments, getToken, handleUnauthorized]
  );

  // Dropzone handler
  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles?.length) return;
    const file = acceptedFiles[0];

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Archivo demasiado grande. Máx 10 MB.");
      return;
    }

    if (!materia) {
      toast.error("Selecciona una materia antes de subir");
      return;
    }

    setUploading(true);
    try {
      await uploadToServer(file, titulo.trim() || file.name, tipo.trim() || "", materia);
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

  // Guardar metadata local (draft)
  const guardarMaterial = () => {
    if (!titulo.trim() || !tipo.trim() || !materia.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    const nuevo = {
      id: crypto.randomUUID(),
      titulo: titulo.trim(),
      tipo: tipo.trim(),
      materia: categories.find((c) => c.id === materia)?.name || materia,
      nombreArchivo: null,
      size: 0,
      fecha: new Date().toISOString(),
      ownerEmail: usuario?.correo,
    };

    persistMateriales((all) => [nuevo, ...all]);
    setTitulo("");
    setTipo("");
    toast.success("Material guardado (borrador local)");
  };

  // Delete document (server + local) and refresh
  const eliminarMaterial = async (item) => {
    if (!confirm("¿Eliminar este material?")) return;

    if (item.id && Number(item.id)) {
      const token = getToken();
      if (!token) return toast.error("Inicia sesión");
      try {
        const base = import.meta.env.VITE_API_BASE || "";
        const res = await fetch(`${base}/api/documents/${item.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (await handleUnauthorized(res)) return;
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          toast.error((json && (json.message || json.error)) || `Error ${res.status}`);
          return;
        }
        // refresh from server
        await fetchDocuments(materia);
      } catch (err) {
        console.error("delete error", err);
        toast.error("Error al eliminar en servidor");
        return;
      }
    } else {
      // local draft
      persistMateriales((all) => all.filter((m) => m.id !== item.id));
      setMateriales((prev) => prev.filter((m) => m.id !== item.id));
    }

    toast.success("Material eliminado");
  };

  // Download document (server)
  const descargarDocumento = async (item) => {
    if (!item.id || !Number(item.id)) {
      toast.error("Este material no tiene archivo para descargar");
      return;
    }
    const token = getToken();
    if (!token) return toast.error("Inicia sesión");
    try {
      const base = import.meta.env.VITE_API_BASE || "";
      const res = await fetch(`${base}/api/documents/${item.id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (await handleUnauthorized(res)) return;
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        toast.error(txt || `Error ${res.status}`);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.nombreArchivo || item.titulo || "download";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("descargar error", err);
      toast.error("Error al descargar archivo");
    }
  };

  const materialesFiltrados = useMemo(() => {
    return materiales.filter((m) => {
      const matchesQuery =
        !query ||
        (m.titulo || "").toLowerCase().includes(query.toLowerCase()) ||
        ((m.materia || "").toLowerCase().includes(query.toLowerCase()));
      const matchesMateria = !filterMateria || (m.materia || "") === filterMateria;
      return matchesQuery && matchesMateria;
    });
  }, [materiales, query, filterMateria]);

  const materiasUnicas = Array.from(new Set(materiales.map((m) => m.materia).filter(Boolean)));

  return (
    <div className="min-h-screen bg-base-200">
      <Toaster position="top-right" />
      <DashboardShell role="maestro" description="Sube, edita y elimina materiales.">
        <div className="max-w-6xl">
          <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-3xl font-extrabold text-[#006847]">Panel Maestro</h1>
            <p className="text-sm text-gray-600">Sube materiales y gestiona los recursos de las materias.</p>
          </motion.header>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <div className="alert alert-success">
              <div>
                <h3 className="font-semibold">Permisos activos ({role === "admin" ? "Administrador" : "Maestro"})</h3>
                <p className="text-sm">Todos los maestros pueden subir archivos a cualquier categoría.</p>
                <p className="text-xs mt-1">Categorías disponibles: <strong>{categories.map((c) => c.name).join(", ") || "Sin categorías cargadas"}</strong></p>
              </div>
            </div>
            <div className="alert alert-info">
              <div>
                <h3 className="font-semibold">Regla de control</h3>
                <p className="text-sm">Selecciona la categoría donde quieres publicar el material.</p>
              </div>
            </div>
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
                  {categories.length === 0 ? <option value="">Sin categorías</option> : null}
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>

              <div {...getRootProps()} className={`border-dashed border-2 rounded p-4 text-center cursor-pointer transition ${isDragActive ? "border-[#006847] bg-[#f0fff6]" : "border-gray-200 bg-white"}`}>
                <input {...getInputProps()} />
                <p className="text-sm text-gray-600 flex items-center justify-center gap-2">
                  <HiPlus /> Arrastra o haz click para seleccionar un archivo
                </p>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <button onClick={guardarMaterial} className="btn bg-[#006847] text-white flex-1 w-full" disabled={uploading}>
                  {uploading ? "Subiendo..." : "Guardar"}
                </button>
                <button onClick={() => { setTitulo(""); setTipo(""); }} className="btn btn-ghost flex-1 w-full">Limpiar</button>
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
                      <button onClick={() => descargarDocumento(m)} className="btn btn-sm btn-outline flex items-center gap-2">Descargar</button>
                      <button onClick={() => eliminarMaterial(m)} className="btn btn-sm btn-error text-white flex items-center gap-2"><HiTrash /> Eliminar</button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.aside>
          </div>
        </div>
      </DashboardShell>
    </div>
  );
}
