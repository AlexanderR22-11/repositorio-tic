import React, { useMemo, useState } from "react";
import { FaCalendarAlt, FaClock, FaFolderOpen } from "react-icons/fa";
import { motion } from "framer-motion";
import DocumentCard from "../components/DocumentCard";
import SubjectSidebar from "../components/SubjectSidebar";
import { getImageForSubject } from "../utils/subjectImages";

const subjects = [
  { id: "dw", name: "Desarrollo Web", teacher: "Ing. Stephany A. López", group: "IDS-8A" },
  { id: "sda", name: "Seguridad en Aplicaciones", teacher: "Mtro. Luis E. Castañeda", group: "IDS-8A" },
  { id: "bd", name: "Bases de Datos", teacher: "Mtra. Karina R. Ruiz", group: "IDS-8A" },
  { id: "mat", name: "Matemáticas", teacher: "Mtro. Jorge M. Torres", group: "IDS-8A" },
  { id: "poo", name: "POO", teacher: "Mtro. Héctor I. Beltrán", group: "IDS-8A" },
  { id: "so", name: "Sistemas Operativos", teacher: "Mtra. Daniela V. Pérez", group: "IDS-8A" },
  { id: "red", name: "Redes", teacher: "Ing. Ricardo M. Salas", group: "IDS-8A" },
];

const sampleDocs = [
  { id: "seed-1", materia: "Desarrollo Web", titulo: "Guía de Programación Avanzada", autor: "Ing. Stephany A. López", fecha: "2026-03-02T10:00:00.000Z", tipo: "PDF", tags: ["Programación", "Algoritmos"] },
  { id: "seed-2", materia: "Bases de Datos", titulo: "Bases de Datos NoSQL", autor: "Mtra. Karina R. Ruiz", fecha: "2026-02-19T09:00:00.000Z", tipo: "PDF", tags: ["Bases de datos"] },
  { id: "seed-3", materia: "POO", titulo: "Patrones de diseño para proyectos", autor: "Mtro. Héctor I. Beltrán", fecha: "2026-03-08T14:00:00.000Z", tipo: "PDF", tags: ["POO", "Patrones"] },
  { id: "seed-4", materia: "Redes", titulo: "Topología y subneteo en laboratorio", autor: "Ing. Ricardo M. Salas", fecha: "2026-03-12T16:00:00.000Z", tipo: "PDF", tags: ["Redes", "Subneteo"] },
];

const toSubjectId = (materia = "") => {
  const m = materia.toLowerCase();
  if (m.includes("desarrollo")) return "dw";
  if (m.includes("seguridad")) return "sda";
  if (m.includes("base")) return "bd";
  if (m.includes("mat")) return "mat";
  if (m.includes("poo") || m.includes("orientada")) return "poo";
  if (m.includes("sistemas")) return "so";
  if (m.includes("red")) return "red";
  return "other";
};

export default function HomePage({ q = "" }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const docs = useMemo(() => {
    const stored = JSON.parse(localStorage.getItem("materiales") || "[]");
    const normalizedStored = stored.map((m) => ({
      id: m.id,
      subjectId: toSubjectId(m.materia),
      title: m.titulo,
      author: m.ownerEmail || m.autor || "Docente UTN",
      date: m.fecha || new Date().toISOString(),
      thumbnail: getImageForSubject(m.materia),
      tags: [m.tipo || "Material", m.materia || "General"],
      fileName: m.nombreArchivo,
      materia: m.materia,
      type: m.tipo || "Recurso",
    }));

    const normalizedSamples = sampleDocs.map((m) => ({
      id: m.id,
      subjectId: toSubjectId(m.materia),
      title: m.titulo,
      author: m.autor,
      date: m.fecha,
      thumbnail: getImageForSubject(m.materia),
      tags: m.tags,
      fileName: null,
      materia: m.materia,
      type: m.tipo,
    }));

    return [...normalizedStored, ...normalizedSamples];
  }, []);

  const subjectsWithCount = useMemo(() => {
    return subjects.map((subject) => ({
      ...subject,
      filesCount: docs.filter((doc) => doc.subjectId === subject.id).length,
    }));
  }, [docs]);

  const subjectById = useMemo(
    () => Object.fromEntries(subjectsWithCount.map((subject) => [subject.id, subject])),
    [subjectsWithCount]
  );

  const recentMatches = useMemo(() => {
    return [...docs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 4);
  }, [docs]);

  const query = (q || "").toLowerCase();

  const filtered = useMemo(() => {
    return docs.filter((doc) => {
      const sameSubject = !selectedSubjectId || doc.subjectId === selectedSubjectId;
      const matchesQuery =
        doc.title.toLowerCase().includes(query) ||
        doc.author.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query));

      return sameSubject && matchesQuery;
    });
  }, [docs, query, selectedSubjectId]);

  const visibleDocs = filtered.slice(0, 8);

  return (
    <main className="min-h-screen bg-base-200" id="inicio">
      <motion.header
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.35 }}
        className="max-w-7xl mx-auto px-6 pt-3 pb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-primary">Repositorio UTN</h1>
            <p className="text-sm text-base-content/70">Ingeniería en Desarrollo y Gestión de Software</p>
          </div>
        </div>
      </motion.header>

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6 mt-1" id="materiales">
        <SubjectSidebar
          subjects={subjectsWithCount}
          selectedSubjectId={selectedSubjectId}
          onSelect={setSelectedSubjectId}
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
                        <span className="inline-flex items-center gap-1"><FaCalendarAlt /> {new Date(doc.date).toLocaleDateString()}</span>
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
            className="mb-6 flex items-center justify-between"
          >
            <h2 className="text-xl font-bold">Archivos disponibles</h2>
            <span className="text-xs text-base-content/70">Mostrando máximo 8 archivos</span>
          </motion.div>

          {visibleDocs.length === 0 ? (
            <div className="bg-base-100 rounded-2xl border border-dashed border-base-300 p-8 text-center text-base-content/70">
              No hay archivos para esta materia con ese filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {visibleDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
