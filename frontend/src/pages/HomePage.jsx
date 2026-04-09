import React, { useMemo, useState } from "react";
import { FaCalendarAlt, FaClock, FaFolderOpen } from "react-icons/fa";
import { motion } from "framer-motion";
import DocumentCard from "../components/DocumentCard";
import SubjectSidebar from "../components/SubjectSidebar";
import { getImageForSubject } from "../utils/subjectImages";

const subjects = [
  { id: "dw", name: "Desarrollo Web Profesional", teacher: "Ing. Stephany A. López", group: "IDS-8A", filesCount: 4 },
  { id: "sda", name: "Seguridad en el Desarrollo de Aplicaciones", teacher: "Mtro. Luis E. Castañeda", group: "IDS-8A", filesCount: 2 },
  { id: "bd", name: "Administración de Base de Datos", teacher: "Mtra. Karina R. Ruiz", group: "IDS-8A", filesCount: 3 },
  { id: "mat", name: "Matemáticas para Ingeniería II", teacher: "Mtro. Jorge M. Torres", group: "IDS-8A", filesCount: 2 },
  { id: "poo", name: "Programación Orientada a Objetos", teacher: "Mtro. Héctor I. Beltrán", group: "IDS-8A", filesCount: 3 },
  { id: "so", name: "Sistemas Operativos", teacher: "Mtra. Daniela V. Pérez", group: "IDS-8A", filesCount: 2 },
  { id: "red", name: "Redes y Conectividad", teacher: "Ing. Ricardo M. Salas", group: "IDS-8A", filesCount: 2 },
];

const sampleDocs = [
  { id: 1, subjectId: "dw", title: "Guía de Programación Avanzada", author: "Ing. Stephany A. López", date: "2026-03-02", thumbnail: "/assets/doc1.jpg", tags: ["Programación", "Algoritmos"], url: "#", download: "#" },
  { id: 2, subjectId: "dw", title: "Arquitectura de Software Moderna", author: "Ing. Stephany A. López", date: "2026-02-25", thumbnail: "/assets/doc2.jpg", tags: ["Arquitectura", "Microservicios"], url: "#", download: "#" },
  { id: 3, subjectId: "bd", title: "Bases de Datos NoSQL", author: "Mtra. Karina R. Ruiz", date: "2026-02-19", thumbnail: "/assets/doc3.jpg", tags: ["Bases de datos"], url: "#", download: "#" },
  { id: 4, subjectId: "sda", title: "Checklist OWASP para proyectos escolares", author: "Mtro. Luis E. Castañeda", date: "2026-03-06", thumbnail: "/assets/doc2.jpg", tags: ["Seguridad", "OWASP"], url: "#", download: "#" },
  { id: 5, subjectId: "mat", title: "Ejercicios de Cálculo Diferencial", author: "Mtro. Jorge M. Torres", date: "2026-02-28", thumbnail: "/assets/doc1.jpg", tags: ["Cálculo", "Álgebra"], url: "#", download: "#" },
  { id: 6, subjectId: "poo", title: "Patrones de diseño para proyectos", author: "Mtro. Héctor I. Beltrán", date: "2026-03-08", thumbnail: "/assets/doc3.jpg", tags: ["POO", "Patrones"], url: "#", download: "#" },
  { id: 7, subjectId: "so", title: "Práctica de procesos en Linux", author: "Mtra. Daniela V. Pérez", date: "2026-03-10", thumbnail: "/assets/doc1.jpg", tags: ["Linux", "Procesos"], url: "#", download: "#" },
  { id: 8, subjectId: "red", title: "Topología y subneteo en laboratorio", author: "Ing. Ricardo M. Salas", date: "2026-03-12", thumbnail: "/assets/doc2.jpg", tags: ["Redes", "Subneteo"], url: "#", download: "#" },
];

function toSubjectId(subject = "") {
  const normalized = subject.toLowerCase();
  if (normalized.includes("web")) return "dw";
  if (normalized.includes("seguridad")) return "sda";
  if (normalized.includes("base de datos")) return "bd";
  if (normalized.includes("matem")) return "mat";
  if (normalized.includes("orientada a objetos") || normalized.includes("poo")) return "poo";
  if (normalized.includes("sistemas operativos")) return "so";
  if (normalized.includes("redes")) return "red";
  return "general";
}

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

    const normalizedSamples = sampleDocs.map((m) => {
      const subjectName = subjects.find((subject) => subject.id === m.subjectId)?.name || "General";
      return {
        id: m.id,
        subjectId: m.subjectId,
        title: m.title,
        author: m.author,
        date: m.date,
        thumbnail: getImageForSubject(subjectName),
        tags: m.tags || ["General"],
        fileName: null,
        materia: subjectName,
        type: "Demo",
      };
    });

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
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 pb-2"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-primary">Repositorio UTN</h1>
            <p className="text-sm text-base-content/70">Ingeniería en Desarrollo y Gestión de Software</p>
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
            className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <h2 className="text-xl font-bold">Archivos disponibles</h2>
            <span className="text-xs text-base-content/70">Mostrando máximo 8 archivos</span>
          </motion.div>

          {visibleDocs.length === 0 ? (
            <div className="bg-base-100 rounded-2xl border border-dashed border-base-300 p-8 text-center text-base-content/70">
              No hay archivos para esta materia con ese filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {visibleDocs.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
