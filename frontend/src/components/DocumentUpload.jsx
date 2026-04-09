import React, { useRef, useState } from "react";

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

  const token = localStorage.getItem("token");

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setAuthor("");
    setPublishedAt("");
    setFile(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    if (!file) {
      setError("Selecciona un archivo para subir.");
      return false;
    }

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
            return;
          }

          let msg = `Error ${xhr.status}`;
          try {
            const body = JSON.parse(xhr.responseText);
            msg = body.message || JSON.stringify(body);
          } catch {
            msg = xhr.responseText || msg;
          }
          reject(new Error(msg));
        };

        xhr.onerror = () => reject(new Error("Error de red al subir el archivo."));
        xhr.send(formData);
      });

      resetForm();
      setProgress(100);
      onUploaded();
    } catch (err) {
      setError(err.message || "Error al subir documento.");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="card bg-base-100 shadow-md border border-base-200" onSubmit={handleSubmit}>
      <div className="card-body gap-4">
        <h3 className="card-title">Subir documento</h3>

        <label className="form-control w-full">
          <span className="label-text mb-1">Archivo</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="file-input file-input-bordered w-full"
            disabled={uploading}
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-1">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input input-bordered"
            disabled={uploading}
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="form-control w-full">
            <span className="label-text mb-1">Autor</span>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="input input-bordered"
              disabled={uploading}
            />
          </label>

          <label className="form-control w-full">
            <span className="label-text mb-1">Fecha publicación</span>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="input input-bordered"
              disabled={uploading}
            />
          </label>
        </div>

        <label className="form-control w-full">
          <span className="label-text mb-1">Descripción</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea textarea-bordered min-h-24"
            disabled={uploading}
          />
        </label>

        {error ? <div className="alert alert-error py-2 text-sm">{error}</div> : null}

        {uploading ? (
          <progress className="progress progress-primary w-full" value={progress} max="100" />
        ) : null}

        <div className="card-actions justify-end">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setError(null);
            }}
            className="btn btn-ghost"
            disabled={uploading}
          >
            Limpiar
          </button>
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? `Subiendo ${progress}%` : "Subir"}
          </button>
        </div>
      </div>
    </form>
  );
}
