import React, { useMemo, useState } from "react";
import DocumentCard from "../components/DocumentCard";
import SubjectSidebar from "../components/SubjectSidebar";
import SubjectClassroomCard from "../components/SubjectClassroomCard";

const subjects = [
  { id: "dw", name: "Desarrollo de Web Profesional", teacher: "Ing. Stephany A. López", group: "IDS-8A", filesCount: 4 },
  { id: "sda", name: "Seguridad en el Desarrollo de Aplicaciones", teacher: "Mtro. Luis E. Castañeda", group: "IDS-8A", filesCount: 2 },
  { id: "bd", name: "Administración de Base de Datos", teacher: "Mtra. Karina R. Ruiz", group: "IDS-8A", filesCount: 3 },
  { id: "mat", name: "Matemáticas para Ingeniería II", teacher: "Mtro. Jorge M. Torres", group: "IDS-8A", filesCount: 2 },
];

const sampleDocs = [
  { id: 1, subjectId: "dw", title: "Guía de Programación Avanzada", author: "Ing. Stephany A. López", date: "2026-03-02", thumbnail: "/assets/doc1.jpg", tags: ["Programación", "Algoritmos"], url: "#", download: "#" },
  { id: 2, subjectId: "dw", title: "Arquitectura de Software Moderna", author: "Ing. Stephany A. López", date: "2026-02-25", thumbnail: "/assets/doc2.jpg", tags: ["Arquitectura", "Microservicios"], url: "#", download: "#" },
  { id: 3, subjectId: "bd", title: "Bases de Datos NoSQL", author: "Mtra. Karina R. Ruiz", date: "2026-02-19", thumbnail: "/assets/doc3.jpg", tags: ["Bases de datos"], url: "#", download: "#" },
  { id: 4, subjectId: "sda", title: "Checklist OWASP para proyectos escolares", author: "Mtro. Luis E. Castañeda", date: "2026-03-06", thumbnail: "/assets/doc2.jpg", tags: ["Seguridad", "OWASP"], url: "#", download: "#" },
  { id: 5, subjectId: "mat", title: "Ejercicios de Cálculo Diferencial", author: "Mtro. Jorge M. Torres", date: "2026-02-28", thumbnail: "/assets/doc1.jpg", tags: ["Cálculo", "Álgebra"], url: "#", download: "#" },
];

export default function HomePage({ q = "" }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0].id);

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.id === selectedSubjectId),
    [selectedSubjectId]
  );

  const query = (q || "").toLowerCase();

  const filtered = useMemo(() => {
    return sampleDocs.filter((doc) => {
      const sameSubject = doc.subjectId === selectedSubjectId;
      const matchesQuery =
        doc.title.toLowerCase().includes(query) ||
        doc.author.toLowerCase().includes(query) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query));

      return sameSubject && matchesQuery;
    });
  }, [query, selectedSubjectId]);

  return (
    <main className="min-h-screen bg-[#F7F7F8]" id="inicio">
      <header className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#006847]">Repositorio UTN</h1>
            <p className="text-sm text-gray-600">Ingeniería en Desarrollo y Gestión de Software</p>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <a href="/login" className="text-sm text-gray-700">Iniciar sesión</a>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6" id="materiales">
        <SubjectSidebar
          subjects={subjects}
          selectedSubjectId={selectedSubjectId}
          onSelect={setSelectedSubjectId}
        />

        <div className="md:col-span-3">
          <SubjectClassroomCard subject={selectedSubject} />

          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111827]">Archivos subidos</h2>
            <a href="/explorar" className="text-sm text-[#006847]">Ver todos</a>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No hay archivos para esta materia con ese filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {filtered.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </div>
      </section>

      <footer className="mt-12 py-8 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-sm text-gray-600">
          © 2026 Universidad Tecnológica de Nayarit — Ingeniería en Desarrollo y Gestión de Software
        </div>
      </footer>
    </main>
  );
}
