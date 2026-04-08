import React from "react";
import { motion } from "framer-motion";

export default function Hero({ stats = [] }) {
  return (
    <section className="pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#0f1f17] via-[#003d2b] to-[#006847] text-white p-8">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <motion.h1 initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-3xl md:text-4xl font-extrabold">
                Repositorio Académico UTN
              </motion.h1>
              <motion.p initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.08 }} className="mt-3 text-gray-100 max-w-xl">
                Recursos verificados por docentes de Ingeniería: guías, proyectos, cursos multimedia y material de apoyo para tus materias.
              </motion.p>

              <div className="mt-6 flex gap-3">
                <a href="#destacados" className="btn bg-white text-[#006847]">Explorar repositorio</a>
                <a href="#info" className="btn btn-ghost text-white">Qué es el repositorio</a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {stats.map((s, i) => (
                <motion.div key={i} initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.06 * i }} className="bg-white/10 p-4 rounded">
                  <div className="text-sm text-gray-200">{s.label}</div>
                  <div className="text-2xl font-bold">{s.value}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
