// frontend/src/pages/HomePage.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { FaCalendarAlt, FaClock, FaFolderOpen } from "react-icons/fa";
import { motion } from "framer-motion";
import DocumentCard from "../components/DocumentCard";
import SubjectSidebar from "../components/SubjectSidebar";
import { getImageForSubject } from "../utils/subjectImages";

// Datos de ejemplo como fallback
const sampleSubjects = [
  { id: "dw", name: "Desarrollo Web Profesional", teacher: "ING. STEPHANY ANAHÍ LÓPEZ LIZÁRRAGA", group: "IDS-81", filesCount: 4 },
  { id: "sda", name: "Seguridad en el Desarrollo de Aplicaciones", teacher: "ING. OSCAR ARENAS GÓMEZ", group: "IDS-81", filesCount: 2 },
  { id: "bd", name: "Administración de Base de Datos", teacher: "ING. JUAN MANUEL TOVAR SÁNCHEZ", group: "IDS-81", filesCount: 3 },
  { id: "mat", name: "Matemáticas para Ingeniería II", teacher: "ING. MARCO FEDERICO ADAME OROPEZA", group: "IDS-81", filesCount: 2 },
  { id: "poo", name: "INGLES VII", teacher: "Mtro. JUAN MANUEL RAMIREZ", group: "IDS-81", filesCount: 3 },
  { id: "so", name: "Planeación y Organización del Trabajo", teacher: "Mto. LEONARDO DANIEL GUERRA ISIORDIA", group: "IDS-81", filesCount: 2 },
];

const sampleDocs = [
  { id: 1, subjectId: "dw", title: "Guía de Programación Avanzada", author: "Ing. Stephany A. López", date: "2026-03-02", thumbnail: "/assets/doc1.jpg", tags: ["Programación", "Algoritmos"], archivo_url: "#" },
  { id: 2, subjectId: "dw", title: "Arquitectura de Software Moderna", author: "Ing. Stephany A. López", date: "2026-02-25", thumbnail: "/assets/doc2.jpg", tags: ["Arquitectura", "Microservicios"], archivo_url: "#" },
  { id: 3, subjectId: "bd", title: "Bases de Datos NoSQL", author: "Mtra. Karina R. Ruiz", date: "2026-02-19", thumbnail: "/assets/doc3.jpg", tags: ["Bases de datos"], archivo_url: "#" },
  { id: 4, subjectId: "sda", title: "Checklist OWASP para proyectos escolares", author: "Mtro. Luis E. Castañeda", date: "2026-03-06", thumbnail: "/assets/doc2.jpg", tags: ["Seguridad", "OWASP"], archivo_url: "#" },
  { id: 5, subjectId: "mat", title: "Ejercicios de Cálculo Diferencial", author: "Mtro. Jorge M. Torres", date: "2026-02-28", thumbnail: "/assets/doc1.jpg", tags: ["Cálculo", "Álgebra"], archivo_url: "#" },
  { id: 6, subjectId: "poo", title: "Patrones de diseño para proyectos", author: "Mtro. Héctor I. Beltrán", date: "2026-03-08", thumbnail: "/assets/doc3.jpg", tags: ["POO", "Patrones"], archivo_url: "#" },
  { id: 7, subjectId: "so", title: "Práctica de procesos en Linux", author: "Mtra. Daniela V. Pérez", date: "2026-03-10", thumbnail: "/assets/doc1.jpg", tags: ["Linux", "Procesos"], archivo_url: "#" },
  { id: 8, subjectId: "red", title: "Topología y subneteo en laboratorio", author: "Ing. Ricardo M. Salas", date: "2026-03-12", thumbnail: "/assets/doc2.jpg", tags: ["Redes", "Subneteo"], archivo_url: "#" },
];

function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function HomePage({ q = "", token = null }) {
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState(q || "");
  const debouncedQuery = useDebounced(query, 400);

  // Cargar categorías reales
  useEffect(() => {
    let mounted = true;
    setSubjectsLoading(true);
    setSubjectsError(null);

    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (data && data.ok && Array.isArray(data.categories)) {
          // mapear a la estructura que espera SubjectSidebar
          const mapped = data.categories.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug, filesCount: c.count || 0 }));
          setSubjects(mapped);
        } else {
          // fallback a sampleSubjects
          setSubjects(sampleSubjects);
        }
      })
      .catch((err) => {
        console.error("Error cargando categorías:", err);
        setSubjects(sampleSubjects);
        setSubjectsError("No se pudieron cargar las materias");
      })
      .finally(() => mounted && setSubjectsLoading(false));

    return () => { mounted = false; };
  }, []);

  // Cargar documentos por categoría, página y búsqueda
  const fetchDocuments = useCallback(() => {
    setDocsLoading(true);
    setDocsError(null);

    const params = new URLSearchParams();
    if (selectedSubjectId) params.append("category_id", selectedSubjectId);
    if (debouncedQuery) params.append("q", debouncedQuery);
    params.append("page", String(page));
    params.append("limit", String(limit));

    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    fetch(`/api/documents?${params.toString()}`, { headers })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) {
          setDocs(data.documents || []);
          setTotal(Number(data.total || (data.documents ? data.documents.length : 0)));
        } else {
          // fallback a sampleDocs filtered por subject
          const fallback = sampleDocs.filter((d) => !selectedSubjectId || d.subjectId === selectedSubjectId);
          setDocs(fallback);
          setTotal(fallback.length);
          setDocsError(data?.error || "No se pudieron obtener documentos");
        }
      })
      .catch((err) => {
        console.error("Error cargando documentos:", err);
        const fallback = sampleDocs.filter((d) => !selectedSubjectId || d.subjectId === selectedSubjectId);
        setDocs(fallback);
        setTotal(fallback.length);
        setDocsError("Error de red al obtener documentos");
      })
      .finally(() => setDocsLoading(false));
  }, [selectedSubjectId, debouncedQuery, page, limit, token]);

  useEffect(() => {
    // resetear página al cambiar categoría o búsqueda
    setPage(1);
  }, [selectedSubjectId, debouncedQuery]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, page]);

  // Derived values
  const subjectsWithCount = useMemo(() => {
    // si tenemos counts desde API, usarlos; si no, calcular desde docs + sample
    if (subjects && subjects.length && subjects[0].filesCount !== undefined) return subjects;
    return subjects.map((s) => ({ ...s, filesCount: docs.filter((d) => d.subjectId === s.id).length }));
  }, [subjects, docs]);

  const subjectById = useMemo(() => Object.fromEntries(subjectsWithCount.map((s) => [s.id, s])), [subjectsWithCount]);

  const recentMatches = useMemo(() => {
    return [...docs]
      .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
      .slice(0, 4);
  }, [docs]);

  const visibleDocs = useMemo(() => docs.slice(0, 8), [docs]);

  // Acciones
  const handleSelectSubject = (id) => {
    setSelectedSubjectId(id);
    setPage(1);
  };

  const handleView = (doc) => {
    if (doc.archivo_url) window.open(doc.archivo_url, "_blank", "noopener");
    else alert("Archivo no disponible");
  };

  const handleDownload = (doc) => {
    // si tu backend expone /api/documents/:id/download, usarlo; si archivo público, usar archivo_url
    if (doc.id) {
      const url = `/api/documents/${doc.id}/download`;
      window.open(url, "_blank", "noopener");
    } else if (doc.archivo_url) {
      window.open(doc.archivo_url, "_blank", "noopener");
    } else {
      alert("Archivo no disponible para descargar");
    }
  };

  return (
    <main className="min-h-screen bg-base-200" id="inicio">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.35 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#006847]">Repositorio UTN</h1>
            <p className="text-sm text-base-content/70">Ingeniería en Desarrollo y Gestión de Software</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título, autor o etiqueta"
              className="input input-sm input-bordered"
              aria-label="Buscar materiales"
            />
          </div>
        </div>
      </motion.header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-2 grid md:grid-cols-3 gap-3">
        <article className="card bg-base-100 border border-base-200 shadow-sm"><div className="card-body p-4"><h3 className="card-title text-base">Problemática</h3><p className="text-sm text-base-content/70">El material didáctico estaba disperso y sin control por rol, dificultando consultas y seguimiento académico.</p></div></article>
        <article className="card bg-base-100 border border-base-200 shadow-sm"><div className="card-body p-4"><h3 className="card-title text-base">Objetivo</h3><p className="text-sm text-base-content/70">Centralizar documentos por materia para alumnos, maestros y administradores con flujo seguro y trazable.</p></div></article>
        <article className="card bg-base-100 border border-base-200 shadow-sm"><div className="card-body p-4"><h3 className="card-title text-base">¿Cómo funciona?</h3><p className="text-sm text-base-content/70">1) Inicia sesión por rol. 2) Accede a tu panel. 3) Consulta o gestiona materiales según permisos.</p></div></article>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 mt-4" id="materiales">
        <SubjectSidebar
          subjects={subjectsWithCount}
          selectedSubjectId={selectedSubjectId}
          onSelect={handleSelectSubject}
          loading={subjectsLoading}
        />

        <div className="md:col-span-3">
          {!selectedSubjectId && (
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35 }}
              className="card bg-primary text-primary-content shadow-md mb-6"
            >
              <div className="card-body">
                <h3 className="card-title text-2xl flex items-center gap-2">
                  <FaFolderOpen />
                  Archivos recientes subidos
                </h3>
                <p className="opacity-90">Últimos 4 archivos registrados en el repositorio.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  {recentMatches.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ delay: idx * 0.06, duration: 0.2 }}
                      whileHover={{ y: -4 }}
                      className="rounded-xl bg-white/10 border border-white/20 px-3 py-2"
                    >
                      <p className="font-semibold text-sm">{doc.title}</p>
                      <p className="text-xs mt-1">{subjectById[doc.subjectId]?.name || doc.materia}</p>
                      <p className="text-xs mt-1 flex items-center gap-3">
                        <span className="inline-flex items-center gap-1"><FaCalendarAlt /> {new Date(doc.date || doc.created_at).toLocaleDateString()}</span>
                        <span className="inline-flex items-center gap-1"><FaClock /> Reciente</span>
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.article>
          )}

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <h2 className="text-xl font-bold">Archivos disponibles</h2>
            <span className="text-xs text-base-content/70">Mostrando máximo 8 archivos</span>
          </motion.div>

          {docsLoading ? (
            <div className="p-6 text-center">Cargando materiales...</div>
          ) : docsError ? (
            <div className="bg-base-100 rounded-2xl border border-dashed border-base-300 p-8 text-center text-base-content/70">
              {docsError}
            </div>
          ) : visibleDocs.length === 0 ? (
            <div className="bg-base-100 rounded-2xl border border-dashed border-base-300 p-8 text-center text-base-content/70">
              No hay archivos para esta materia con ese filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {visibleDocs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  doc={{
                    ...doc,
                    thumbnail: doc.thumbnail || getImageForSubject(subjectById[doc.subjectId]?.name || doc.materia),
                    onView: () => handleView(doc),
                    onDownload: () => handleDownload(doc),
                  }}
                />
              ))}
            </div>
          )}

          {/* Paginación simple */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-base-content/70">Total {total} materiales</div>
            <div className="flex items-center gap-2">
              <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</button>
              <span className="text-sm">{page} / {Math.max(1, Math.ceil(total / limit))}</span>
              <button className="btn btn-sm" disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}>Siguiente</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
