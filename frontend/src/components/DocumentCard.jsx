import React from "react";
import { motion } from "framer-motion";
import { getImageForSubject } from "../utils/subjectImages";

export default function DocumentCard({ doc, token, apiBase = "http://localhost:3000/api" }) {
  const archivoUrl = doc.archivo_url || doc.fileUrl || doc.file_url || null;
  const fileName = doc.file_name || doc.fileName || doc.fileName || null;
  const title = doc.titulo || doc.title || "Sin título";
  const author = doc.autor || doc.author || "Autor desconocido";
  const thumbnailSrc = doc.thumbnail || getImageForSubject(doc.materia || "") || "/images/default-thumb.png";
  const typeLabel = doc.type || doc.tipo || "Recurso";
  const materia = doc.materia || doc.subject || "";
  const tags = doc.tags || doc.etiquetas || [];

  let fechaTexto = "Sin publicar";
  const fechaRaw = doc.fecha_publicacion || doc.date || doc.created_at || null;
  if (fechaRaw) {
    const fecha = new Date(fechaRaw);
    if (!Number.isNaN(fecha.getTime())) {
      fechaTexto = fecha.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
    }
  }

  const downloadAvailable = Boolean(archivoUrl || fileName);

  // Genera signed URL en backend y abre en nueva pestaña (evita blobs bloqueados)
  async function openSignedDownload(filename) {
    try {
      const tokenLocal = token || localStorage.getItem("token");
      const res = await fetch(`${apiBase}/documents/sign-download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(tokenLocal ? { Authorization: `Bearer ${tokenLocal}` } : {}),
        },
        body: JSON.stringify({ filename, ttl: 60 }),
      });
      if (!res.ok) throw new Error("No se pudo generar URL de descarga");
      const { url } = await res.json();
      // Abrir la URL firmada en nueva pestaña (sin blob)
      window.open(url, "_blank", "noopener");
    } catch (err) {
      console.error("openSignedDownload error:", err);
      alert("No se pudo iniciar la descarga.");
    }
  }

  // Fallback: descarga por fetch->blob->a.download (si no quieres signed URL)
  async function downloadProtected(url, suggestedName) {
    try {
      const tokenLocal = token || localStorage.getItem("token");
      const headers = tokenLocal ? { Authorization: `Bearer ${tokenLocal}` } : {};
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = suggestedName || "";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("Download error:", err);
      alert("No se pudo descargar el archivo.");
    }
  }

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
          src={thumbnailSrc}
          alt={title}
          className="w-full h-56 object-cover transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 badge badge-neutral">
          {typeLabel}
        </div>
      </figure>

      <div className="card-body">
        <h3 className="card-title text-base-content line-clamp-2">{title}</h3>
        <p className="text-sm text-base-content/70">{author} • {fechaTexto}</p>

        <div className="mt-2 flex gap-2 flex-wrap">
          {tags?.slice(0, 3).map((t) => (
            <span key={t} className="badge badge-outline">{t}</span>
          ))}
        </div>

        <div className="card-actions justify-between items-center mt-3">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => window.alert(`Documento: ${title}\nMateria: ${materia || "General"}`)}
          >
            Ver detalle
          </button>

          {downloadAvailable ? (
            <div className="flex items-center gap-3">
              {archivoUrl ? (
                <a
                  href={archivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost btn-sm"
                >
                  Abrir
                </a>
              ) : null}

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  // Prefer signed URL flow (reliable). Si no quieres signed URL, usa downloadProtected.
                  const filename = fileName || (archivoUrl ? archivoUrl.split("/").pop() : null);
                  if (filename) {
                    openSignedDownload(filename);
                  } else {
                    const url = archivoUrl || `/uploads/${fileName}`;
                    downloadProtected(url, fileName || title);
                  }
                }}
              >
                Descargar
              </button>

              <span className="text-xs text-success">Archivo listo para descarga {fileName ? `(${fileName})` : ""}</span>
            </div>
          ) : (
            <span className="text-xs text-base-content/60">Vista de referencia (sin archivo adjunto)</span>
          )}
        </div>
      </div>
    </motion.article>
  );
}
