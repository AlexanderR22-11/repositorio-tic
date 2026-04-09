import React from "react";
import { motion } from "framer-motion";
import { getImageForSubject } from "../utils/subjectImages";

export default function DocumentCard({ doc }) {
  const downloadAvailable = Boolean(doc.fileName);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="card bg-base-100 shadow-md overflow-hidden hover:shadow-xl"
    >
      <figure className="relative">
        <img
          src={doc.thumbnail || getImageForSubject(doc.materia || "")}
          alt={doc.title}
          className="w-full h-56 object-cover transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 badge badge-neutral">
          {doc.type || "Recurso"}
        </div>
      </figure>

      <div className="card-body">
        <h3 className="card-title text-base-content line-clamp-2">{doc.title}</h3>
        <p className="text-sm text-base-content/70">{doc.author} • {new Date(doc.date).toLocaleDateString()}</p>

        <div className="mt-2 flex gap-2 flex-wrap">
          {doc.tags?.slice(0, 3).map((t) => (
            <span key={t} className="badge badge-outline">{t}</span>
          ))}
        </div>

        <div className="card-actions justify-between items-center mt-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => window.alert(`Documento: ${doc.title}\nMateria: ${doc.materia || "General"}`)}
          >
            Ver detalle
          </button>
          {downloadAvailable ? (
            <span className="text-xs text-success">Archivo listo para descarga ({doc.fileName})</span>
          ) : (
            <span className="text-xs text-base-content/60">Vista de referencia (sin archivo adjunto)</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
