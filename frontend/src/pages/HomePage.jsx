// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import DocumentCard from "../components/DocumentCard";

const sampleDocs = [
  { id:1, title:"Guía de Programación Avanzada", author:"G. Pérez", date:"2026-03-02", thumbnail:"/assets/doc1.jpg", tags:["Programación","Algoritmos"], url:"#", download:"#"},
  { id:2, title:"Arquitectura de Software Moderna", author:"M. López", date:"2026-02-25", thumbnail:"/assets/doc2.jpg", tags:["Arquitectura","Microservicios"], url:"#", download:"#"},
  { id:3, title:"Bases de Datos NoSQL", author:"A. Ruiz", date:"2026-02-19", thumbnail:"/assets/doc3.jpg", tags:["Bases de datos"], url:"#", download:"#"},
  // más...
];

export default function HomePage({ q = "" }) {
  const [docs, setDocs] = useState(sampleDocs);

  useEffect(() => {
    // placeholder: aquí iría fetch a tu API
    setDocs(sampleDocs);
  }, []);

  const query = (q || "").toLowerCase();
  const filtered = docs.filter(
    d =>
      d.title.toLowerCase().includes(query) ||
      d.author.toLowerCase().includes(query)
  );

  return (
    <main className="min-h-screen bg-[#F7F7F8]">
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

      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1 bg-white rounded-2xl p-5 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3">Filtrar por</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Tema</label>
              <select className="mt-2 w-full border rounded-md px-3 py-2">
                <option>Todos</option>
                <option>Programación</option>
                <option>Arquitectura</option>
                <option>Bases de datos</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600">Autor</label>
              <input className="mt-2 w-full border rounded-md px-3 py-2" placeholder="Nombre del autor" />
            </div>
          </div>
        </aside>

        <div className="md:col-span-3">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#111827]">Depósitos recientes</h2>
            <a href="/explorar" className="text-sm text-[#006847]">Ver todos</a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
          </div>
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
