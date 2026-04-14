// frontend/src/pages/DashboardAdmin.jsx
import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import DashboardShell from "../components/DashboardShell";

const USERS_KEY = "admin_usuarios";
const SUBJECTS_KEY = "admin_materias";
const MATERIALS_KEY = "materiales";

const initialUsers = [
  { id: 1, nombre: "Alumno Demo", correo: "alumno@utn.com", role: "alumno" },
  { id: 2, nombre: "Maestro Demo", correo: "maestro@utn.com", role: "maestro" },
  { id: 3, nombre: "Admin Demo", correo: "admin@utn.com", role: "admin" },
];

const initialSubjects = ["Desarrollo Web", "Bases de Datos", "POO", "Redes"];

const safeRead = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export default function DashboardAdmin() {
  // tokenState used only to trigger UI updates when token changes
  const [tokenState, setTokenState] = useState(() => {
    return sessionStorage.getItem("token") || localStorage.getItem("token") || "";
  });

  // Data state
  const [usuarios, setUsuarios] = useState(() => safeRead(USERS_KEY, initialUsers));
  const [materias, setMaterias] = useState(() => safeRead(SUBJECTS_KEY, initialSubjects));
  const [materiales, setMateriales] = useState(() => safeRead(MATERIALS_KEY, []));
  const [nuevaMateria, setNuevaMateria] = useState("");
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: "", correo: "", role: "alumno", password: "" });
  const [filtroRol, setFiltroRol] = useState("");
  const [cronExpresion, setCronExpresion] = useState("");
  const [lastSchedule, setLastSchedule] = useState(null);
  const [isLoadingBackup, setIsLoadingBackup] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);
  const [isLoadingExport, setIsLoadingExport] = useState(false);

  // Indicates whether users were loaded from server (so we don't overwrite them with localStorage)
  const [usuariosLoadedFromServer, setUsuariosLoadedFromServer] = useState(false);

  // Persist local caches only when not using server as source of truth
  useEffect(() => {
    if (!usuariosLoadedFromServer) {
      localStorage.setItem(USERS_KEY, JSON.stringify(usuarios));
    }
  }, [usuarios, usuariosLoadedFromServer]);

  useEffect(() => {
    localStorage.setItem(SUBJECTS_KEY, JSON.stringify(materias));
  }, [materias]);

  useEffect(() => {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify(materiales));
  }, [materiales]);

  // Keep tokenState in sync with storage and listen to storage events (other tabs)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setTokenState(sessionStorage.getItem("token") || localStorage.getItem("token") || "");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Check token on load and remove invalid/expired tokens
  useEffect(() => {
    const checkTokenOnLoad = () => {
      const t = sessionStorage.getItem("token") || localStorage.getItem("token") || "";
      if (!t) {
        setTokenState("");
        return;
      }
      try {
        const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          sessionStorage.removeItem("token");
          localStorage.removeItem("token");
          setTokenState("");
          toast.error("Sesión expirada. Inicia sesión nuevamente.");
        } else {
          setTokenState(t);
        }
      } catch {
        // token malformed: remove it
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        setTokenState("");
      }
    };
    checkTokenOnLoad();
  }, []);

  // getToken reads sessionStorage first, then localStorage, then tokenState
  const getToken = () => {
    const s = sessionStorage.getItem("token");
    if (s && s.trim()) return s;
    const l = localStorage.getItem("token");
    if (l && l.trim()) return l;
    return tokenState || "";
  };

  // handleUnauthorized clears both storages and redirects to login
  const handleUnauthorized = async (res) => {
    if (res && res.status === 401) {
      sessionStorage.removeItem("token");
      localStorage.removeItem("token");
      setTokenState("");
      toast.error("Sesión expirada o inválida. Inicia sesión nuevamente.");
      setTimeout(() => { window.location.href = "/login"; }, 1200);
      return true;
    }
    return false;
  };

  // Memoized filtered users
  const usuariosFiltrados = useMemo(() => {
    if (!filtroRol) return usuarios;
    return usuarios.filter((u) => u.role === filtroRol);
  }, [usuarios, filtroRol]);

  // Helper para descargar blobs con Authorization header
  const downloadBlob = async (response, filename = "download.bin") => {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Extrae filename desde Content-Disposition si existe
  const extractFilename = (res, fallback) => {
    const cd = res.headers.get("content-disposition") || "";
    const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^;"']+)["']?/i);
    if (match && match[1]) return decodeURIComponent(match[1]);
    return fallback;
  };

  // === Cargar usuarios desde backend al montar ===
  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (await handleUnauthorized(res)) return;

        if (!res.ok) {
          console.warn("No se pudieron cargar usuarios", res.status);
          return;
        }

        const data = await res.json().catch(() => null);
        if (data && data.users && mounted) {
          setUsuarios(data.users);
          setUsuariosLoadedFromServer(true);
        }
      } catch (err) {
        console.error("loadUsers error", err);
      }
    };

    loadUsers();
    return () => { mounted = false; };
  }, [tokenState]);

  // === Funciones conectadas al backend ===

  const generarRespaldo = async () => {
    const token = getToken();
    if (!token) return toast.error("Token no disponible. Inicia sesión.");
    setIsLoadingBackup(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/backup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        let parsed = null;
        try { parsed = JSON.parse(txt); } catch {}
        const msg = (parsed && (parsed.message || parsed.error)) || txt || `Error ${res.status}`;
        toast.error(msg);
        return;
      }

      const ct = (res.headers.get("content-type") || "").toLowerCase();

      if (ct.includes("application/json")) {
        const data = await res.json().catch(() => null);
        if (!data) {
          toast.error("Respuesta inválida del servidor");
          return;
        }
        if (data.ok === false) {
          toast.error(data.error || data.message || "Error al generar respaldo");
          return;
        }
        if (data.file) {
          const dl = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/backup/download`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (await handleUnauthorized(dl)) return;

          if (!dl.ok) {
            const txt = await dl.text().catch(() => null);
            let parsed = null;
            try { parsed = JSON.parse(txt); } catch {}
            const msg = (parsed && (parsed.message || parsed.error)) || txt || `Error ${dl.status}`;
            toast.error(msg);
            return;
          }
          const filename = extractFilename(dl, data.file || "backup.sql");
          await downloadBlob(dl, filename);
          toast.success("Respaldo generado y descarga iniciada");
          return;
        } else {
          toast.success(data.message || "Respaldo generado");
          return;
        }
      }

      const filename = extractFilename(res, "backup.sql");
      await downloadBlob(res, filename);
      toast.success("Descarga iniciada");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar respaldo");
    } finally {
      setIsLoadingBackup(false);
    }
  };

  const programarRespaldo = async () => {
    if (!cronExpresion) return toast.error("Ingresa una expresión CRON válida");
    const token = getToken();
    if (!token) return toast.error("Token no disponible. Inicia sesión.");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/backup/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ cronExpresion }),
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        let parsed = null;
        try { parsed = JSON.parse(txt); } catch {}
        const msg = (parsed && (parsed.message || parsed.error)) || txt || `Error ${res.status}`;
        toast.error(msg);
        return;
      }

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (data && data.ok) {
        setLastSchedule(cronExpresion);
        toast.success(data.message || "Respaldo programado");
      } else if (data && data.ok === false) {
        toast.error(data.error || data.message || "Error al programar respaldo");
      } else {
        toast.success("Respaldo programado");
        setLastSchedule(cronExpresion);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al programar respaldo");
    }
  };

  const restaurarRespaldo = async (file) => {
    if (!file) return toast.error("Selecciona un archivo SQL");
    const token = getToken();
    if (!token) return toast.error("Token no disponible. Inicia sesión.");
    setIsLoadingRestore(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // browser sets Content-Type for FormData
        body: formData,
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        let parsed = null;
        try { parsed = JSON.parse(txt); } catch {}
        const msg = (parsed && (parsed.message || parsed.error)) || txt || `Error ${res.status}`;
        toast.error(msg);
        return;
      }

      const ct = (res.headers.get("content-type") || "").toLowerCase();
      const data = ct.includes("application/json") ? await res.json().catch(() => null) : null;

      if (data && data.ok) {
        toast.success("Base restaurada correctamente");
      } else if (data && data.ok === false) {
        toast.error(data.error || data.message || "Error al restaurar respaldo");
      } else {
        toast.success("Restauración completada");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al restaurar respaldo");
    } finally {
      setIsLoadingRestore(false);
    }
  };

  const descargarRespaldo = async () => {
    const token = getToken();
    if (!token) return toast.error("Token no disponible. Inicia sesión.");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/backup/download`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        let parsed = null;
        try { parsed = JSON.parse(txt); } catch {}
        const msg = (parsed && (parsed.message || parsed.error)) || txt || `Error ${res.status}`;
        toast.error(msg);
        return;
      }

      const filename = extractFilename(res, "backup.sql");
      await downloadBlob(res, filename);
      toast.success("Descarga iniciada");
    } catch (err) {
      console.error(err);
      toast.error("Error al descargar respaldo");
    }
  };

  const exportarCSV = async () => {
    setIsLoadingExport(true);
    const token = getToken();
    if (!token) {
      setIsLoadingExport(false);
      return toast.error("Token no disponible. Inicia sesión.");
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/export/csv`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error((json && (json.message || json.error)) || `Error ${res.status}`);
        return;
      }
      const filename = extractFilename(res, "documentos.csv");
      await downloadBlob(res, filename);
      toast.success("CSV descargado");
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar CSV");
    } finally {
      setIsLoadingExport(false);
    }
  };

  const exportarJSON = async () => {
    setIsLoadingExport(true);
    const token = getToken();
    if (token === "") {
      setIsLoadingExport(false);
      return toast.error("Token no disponible. Inicia sesión.");
    }
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/export/json`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error((json && (json.message || json.error)) || `Error ${res.status}`);
        return;
      }
      const filename = extractFilename(res, "documentos.json");
      await downloadBlob(res, filename);
      toast.success("JSON descargado");
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar JSON");
    } finally {
      setIsLoadingExport(false);
    }
  };

  const generarReportePDF = async () => {
    const token = getToken();
    if (!token) return toast.error("Token no disponible. Inicia sesión.");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/report/pdf`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        toast.error((json && (json.message || json.error)) || `Error ${res.status}`);
        return;
      }
      const filename = extractFilename(res, "reporte.pdf");
      await downloadBlob(res, filename);
      toast.success("Reporte PDF descargado");
    } catch (err) {
      console.error(err);
      toast.error("Error al generar reporte PDF");
    }
  };

  // Presets CRON comunes
  const cronPresets = [
    { label: "Diario (00:00)", expr: "0 0 * * *" },
    { label: "Semanal (Dom 00:00)", expr: "0 0 * * 0" },
    { label: "Cada 6 horas", expr: "0 */6 * * *" },
    { label: "Cada hora", expr: "0 * * * *" },
  ];

  // Crear usuario en backend
  const crearUsuario = async () => {
    try {
      const nombre = (nuevoUsuario.nombre || "").trim();
      const correo = (nuevoUsuario.correo || "").trim().toLowerCase();
      const password = nuevoUsuario.password || "";

      if (!nombre || !correo || password.length < 8) {
        return toast.error("Completa nombre, correo y contraseña (mín 8 caracteres)");
      }

      // quick local duplicate check
      if (usuarios.some((u) => u.correo.toLowerCase() === correo)) {
        return toast.error("Ya existe un usuario con ese correo");
      }

      const token = getToken();
      if (!token) {
        toast.error("Token no disponible. Inicia sesión.");
        return;
      }

      const payload = { nombre, correo, password, role: nuevoUsuario.role || "alumno" };

      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (await handleUnauthorized(res)) return;

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.message || data?.error || (data?.errors ? data.errors.map(e => e.msg).join(", ") : `Error ${res.status}`);
        return toast.error(msg);
      }

      if (data && data.user) {
        setUsuarios(prev => [data.user, ...prev]);
        setUsuariosLoadedFromServer(true);
        setNuevoUsuario({ nombre: "", correo: "", role: "alumno", password: "" });
        toast.success("Usuario creado en la base de datos");
      } else {
        toast.success("Usuario creado (verifica en la base de datos)");
      }
    } catch (err) {
      console.error("crearUsuario error", err);
      toast.error("Error al crear usuario");
    }
  };

  // Eliminar usuario en backend
  const eliminarUsuario = async (id) => {
    const token = getToken();
    if (!token) return toast.error("Token no disponible. Inicia sesión.");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || ""}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (await handleUnauthorized(res)) return;

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        return toast.error((json && (json.message || json.error)) || `Error ${res.status}`);
      }

      setUsuarios(prev => prev.filter(u => Number(u.id) !== Number(id)));
      toast.success("Usuario eliminado");
    } catch (err) {
      console.error("eliminarUsuario error", err);
      toast.error("Error al eliminar usuario");
    }
  };

  // UI: mostrar aviso si no hay token
  const hasToken = Boolean(getToken());

  return (
    <div className="min-h-screen bg-base-200">
      <Toaster position="top-right" />
      <DashboardShell role="admin" description="Supervisa usuarios, materiales, respaldos, exportaciones y reportes del sistema.">
        <div className="space-y-4">
          {!hasToken && (
            <div className="alert alert-warning">
              <div>
                <span className="badge badge-warning">Sesión</span>
                <p className="text-sm mt-1">No has iniciado sesión. Algunas acciones requieren autenticación.</p>
              </div>
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
              <div className="stat-title">Usuarios</div>
              <div className="stat-value text-primary">{usuarios.length}</div>
            </div>
            <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
              <div className="stat-title">Materias</div>
              <div className="stat-value text-primary">{materias.length}</div>
            </div>
            <div className="stat bg-base-100 rounded-box shadow-sm border border-base-200">
              <div className="stat-title">Materiales</div>
              <div className="stat-value text-primary">{materiales.length}</div>
            </div>
          </div>

          {/* Paneles informativos */}
          <div className="grid lg:grid-cols-3 gap-3">
            <div className="alert alert-info">
              <div>
                <span className="badge badge-info badge-outline">Usuarios</span>
                <p className="text-sm mt-1">Crear, filtrar y eliminar cuentas por rol.</p>
              </div>
            </div>
            <div className="alert alert-info">
              <div>
                <span className="badge badge-info badge-outline">Respaldo</span>
                <p className="text-sm mt-1">Generar, restaurar y programar respaldos automáticos.</p>
              </div>
            </div>
            <div className="alert alert-info">
              <div>
                <span className="badge badge-info badge-outline">Reportes</span>
                <p className="text-sm mt-1">Exportaciones y reportes PDF para evidencias.</p>
              </div>
            </div>
          </div>

          {/* Gestión de usuarios y acciones administrativas */}
          <div className="grid lg:grid-cols-2 gap-4">
            <section className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h2 className="card-title">Gestión de usuarios</h2>
                <div className="grid md:grid-cols-3 gap-2">
                  <input className="input input-bordered" placeholder="Nombre" value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario((s) => ({ ...s, nombre: e.target.value }))} />
                  <input className="input input-bordered" placeholder="Correo" value={nuevoUsuario.correo} onChange={(e) => setNuevoUsuario((s) => ({ ...s, correo: e.target.value }))} />
                  <select className="select select-bordered" value={nuevoUsuario.role} onChange={(e) => setNuevoUsuario((s) => ({ ...s, role: e.target.value }))}>
                    <option value="alumno">Alumno</option>
                    <option value="maestro">Maestro</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="grid md:grid-cols-1 gap-2 mt-2">
                  <input className="input input-bordered" placeholder="Contraseña (mín 8 caracteres)" type="password" value={nuevoUsuario.password} onChange={(e) => setNuevoUsuario((s) => ({ ...s, password: e.target.value }))} />
                </div>

                <div className="mt-2 flex gap-2">
                  <button className="btn btn-primary" onClick={crearUsuario}>Crear usuario</button>
                  <select className="select select-bordered select-sm w-48" value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                    <option value="">Todos los roles</option>
                    <option value="alumno">Alumno</option>
                    <option value="maestro">Maestro</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="overflow-x-auto mt-4">
                  <table className="table table-zebra table-sm">
                    <thead>
                      <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th></th></tr>
                    </thead>
                    <tbody>
                      {usuariosFiltrados.map((u) => (
                        <tr key={u.id}>
                          <td>{u.nombre}</td>
                          <td>{u.correo}</td>
                          <td><span className="badge badge-outline">{u.role}</span></td>
                          <td>
                            <button className="btn btn-xs btn-error text-white" onClick={() => eliminarUsuario(u.id)}>Eliminar</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h2 className="card-title">Materias, reportes y exportaciones</h2>

                <div className="join join-vertical sm:join-horizontal w-full">
                  <input className="input input-bordered join-item flex-1" placeholder="Nueva materia" value={nuevaMateria} onChange={(e) => setNuevaMateria(e.target.value)} />
                  <button className="btn btn-primary join-item sm:w-auto w-full" onClick={() => {
                    const value = nuevaMateria.trim();
                    if (!value) return toast.error("Escribe una materia");
                    if (materias.some((m) => m.toLowerCase() === value.toLowerCase())) return toast.error("La materia ya existe");
                    setMaterias((prev) => [...prev, value]);
                    setNuevaMateria("");
                    toast.success("Materia agregada");
                  }}>Agregar</button>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {materias.map((m) => <span key={m} className="badge badge-neutral badge-lg">{m}</span>)}
                </div>

                <div className="alert alert-info text-sm mt-3">Exportaciones y reportes están integrados en backend (rutas /api/admin/*).</div>

                <div className="flex flex-wrap gap-2 mt-3">
                  <button className="btn btn-outline" onClick={exportarCSV} disabled={isLoadingExport}>{isLoadingExport ? "Exportando CSV..." : "Exportar CSV"}</button>
                  <button className="btn btn-outline" onClick={exportarJSON} disabled={isLoadingExport}>{isLoadingExport ? "Exportando JSON..." : "Exportar JSON"}</button>
                  <button className="btn btn-outline" onClick={generarReportePDF}>Generar reporte PDF</button>
                </div>
              </div>
            </section>
          </div>

          {/* Respaldo y restauración */}
          <section className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <h2 className="card-title">Respaldo de base de datos</h2>

              <div className="flex flex-wrap gap-3 items-center">
                <button className="btn btn-success" onClick={generarRespaldo} disabled={isLoadingBackup || !hasToken}>
                  {isLoadingBackup ? "Generando..." : "Generar respaldo ahora"}
                </button>

                <button className="btn btn-primary" onClick={descargarRespaldo} disabled={!hasToken}>Descargar respaldo</button>

                <label className="btn btn-ghost">
                  <input type="file" accept=".sql" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (!f.name.endsWith(".sql")) return toast.error("Selecciona un archivo .sql");
                      restaurarRespaldo(f);
                    }
                  }} />
                  Restaurar desde archivo
                </label>
              </div>

              <div className="divider" />

              <h3 className="text-lg font-medium">Respaldo automático (programar)</h3>
              <p className="text-sm text-gray-600 mb-2">Ingresa una expresión CRON o usa un preset. Ejemplo diario: <code>0 0 * * *</code></p>

              <div className="flex gap-2 items-center">
                <input className="input input-bordered flex-1" placeholder="Expresión CRON (ej: 0 0 * * *)" value={cronExpresion} onChange={(e) => setCronExpresion(e.target.value)} />
                <button className="btn btn-primary" onClick={programarRespaldo} disabled={!hasToken}>Programar respaldo</button>
              </div>

              <div className="flex gap-2 mt-3 flex-wrap">
                {cronPresets.map((p) => (
                  <button key={p.expr} className="btn btn-sm btn-outline" onClick={() => setCronExpresion(p.expr)}>{p.label}</button>
                ))}
              </div>

              <div className="mt-3">
                <strong>Última programación:</strong> {lastSchedule || "No programado desde esta sesión"}
              </div>
            </div>
          </section>
        </div>
      </DashboardShell>
    </div>
  );
}
