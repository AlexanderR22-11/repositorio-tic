import React from "react";
import { FaDownload, FaStar } from "react-icons/fa";
import { motion } from "framer-motion";

export default function MaterialCard({ m, onPreview, onFav, isFav }) {
  return (
    <motion.article whileHover={{ y: -6 }} className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold">{m.titulo}</h3>
            <p className="text-xs text-gray-500">{m.tipo} • {m.materia}</p>
          </div>
          <button onClick={() => onFav(m)} aria-label="Favorito" className={`${isFav ? "text-yellow-400" : "text-gray-300"}`}>
            <FaStar />
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-3 line-clamp-3">{m.descripcion}</p>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => onPreview(m)} className="btn btn-sm btn-ghost">Vista previa</button>
          <button onClick={() => alert("Descarga simulada")} className="btn btn-sm bg-[#006847] text-white">
            <FaDownload className="mr-2" /> Descargar
          </button>
        </div>
        <div className="text-xs text-gray-400">{m.size ? (m.size / 1024).toFixed(1) + " KB" : ""}</div>
      </div>
    </motion.article>
  );
}
