// src/components/DocumentUpload.jsx
import React, { useState, useRef } from "react";
import "./document-upload.css"; // opcional

export default function DocumentUpload({ apiBase = "http://localhost:3000/api", onUploaded = () => {} }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedAt, setPublishedAt] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef();

  const token = localStorage.getItem("token"); // ajusta según dónde guardes el token

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAuthor("");
    setPublishedAt("");
    setFile(null);
    setProgress(0);
    fileInputRef.current && (fileInputRef.current.value = "");
  };

  const validate = () => {
    if (!file) {
      setError("Selecciona un archivo para subir.");
      return false;
    }
    // ejemplo: limitar tamaño a 50MB
    const maxBytes = 50 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError("El archivo excede el tamaño máximo de 50 MB.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title || file.name);
    formData.append("description", description);
    formData.append("author", author);
    if (publishedAt) formData.append("fecha_publicacion", publishedAt);

    try {
      // Usamos XMLHttpRequest para poder reportar progreso
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${apiBase}/documents`, true);
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText || "{}"));
          } else {
            let msg = `Error ${xhr.status}`;
            try {
              const body = JSON.parse(xhr.responseText);
              msg = body.message || JSON.stringify(body);
            } catch (e) {
              msg = xhr.responseText || msg;
            }
            reject(new Error(msg));
          }
        };

        xhr.onerror = () => reject(new Error("Error de red al subir el archivo."));
        xhr.send(formData);
      });

      resetForm();
      setUploading(false);
      setProgress(100);
      onUploaded(); // notificar al padre para refrescar lista
    } catch (err) {
      setError(err.message || "Error al subir documento.");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <form className="doc-upload" onSubmit={handleSubmit}>
      <h3>Subir documento</h3>

      <label className="field">
        <span className="label">Archivo</span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={uploading}
        />
      </label>

      <label className="field">
        <span className="label">Título</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} disabled={uploading} />
      </label>

      <label className="field">
        <span className="label">Autor</span>
        <input value={author} onChange={(e) => setAuthor(e.target.value)} disabled={uploading} />
      </label>

      <label className="field">
        <span className="label">Fecha publicación</span>
        <input type="date" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} disabled={uploading} />
      </label>

      <label className="field">
        <span className="label">Descripción</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={uploading} />
      </label>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <button type="submit" disabled={uploading}>
          {uploading ? `Subiendo ${progress}%` : "Subir"}
        </button>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setError(null);
          }}
          disabled={uploading}
        >
          Limpiar
        </button>
      </div>

      {uploading && (
        <div className="progress">
          <div className="bar" style={{ width: `${progress}%` }} />
        </div>
      )}
    </form>
  );
}
