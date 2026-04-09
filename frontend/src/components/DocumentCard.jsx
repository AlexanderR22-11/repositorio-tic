import React from "react";
import { motion } from "framer-motion";

export default function DocumentCard({ doc }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl"
    >
      <div className="relative">
        <img
          src={doc.thumbnail || "/assets/placeholder-doc.jpg"}
          alt={doc.title}
          className="w-full h-56 object-cover transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-white/90 rounded-full px-3 py-1 text-xs font-semibold text-[#006847]">
          {doc.type || "Recurso"}
        </div>
        <div className="absolute top-3 right-3 bg-yellow-400/95 rounded-full p-2">
          <img src="/assets/jaguar-badge.svg" alt="Jaguar" className="w-6 h-6" />
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-[#111827] line-clamp-2">{doc.title}</h3>
        <p className="text-sm text-gray-500 mt-2">{doc.author} • {doc.date}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {doc.tags?.slice(0,3).map((t) => (
              <span key={t} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">{t}</span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={doc.url}
              className="inline-flex items-center gap-2 text-sm font-medium text-white bg-[#006847] hover:bg-[#005c3f] px-3 py-2 rounded-lg transition-transform duration-200 hover:-translate-y-0.5"
              aria-label={`Ver ${doc.title}`}
            >
              Ver
            </a>
            <a
              href={doc.download}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={`Descargar ${doc.title}`}
            >
              Descargar
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
