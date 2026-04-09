// src/pages/AlumnoInicio.jsx
import { useEffect, useMemo, useState, useRef } from "react";
import { getImageForSubject } from "../utils/subjectImages";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FaStar,
  FaBell,
  FaBook,
  FaChalkboardTeacher,
  FaSearch,
  FaDownload,
  FaRegFilePdf,
  FaRegFileAlt,
  FaUserCircle,
  FaMoon,
  FaSun
} from "react-icons/fa";

/* ---------- Hook pequeño para localStorage ---------- */
function useLocalStore(key, initial = []) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state)); } catch {}
  }, [key, state]);
  return [state, setState];
}

/* ---------- Utilitarios ---------- */
const fmtFecha = (iso) => {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};
const debounce = (fn, wait = 300) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
};

/* ---------- Componentes pequeños ---------- */
function Navbar({ q, setQ, theme, toggleTheme }) {
  return (
    <header className="w-full bg-[#006847] text-white px-6 py-3 shadow-md flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <img src="/logo-utn.png" alt="UTN" className="w-10 h-10" />
        <div>
          <h1 className="font-bold text-lg">Repositorio UTN</h1>
          <p className="text-xs text-white/80">Plataforma académica institucional</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-white px-3 py-1 rounded-full flex items-center gap-2 text-black shadow">
          <FaSearch />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar materia o material..."
            className="outline-none bg-transparent w-64"
            aria-label="Buscar materiales"
          />
        </div>

        <button onClick={toggleTheme} className="btn btn-ghost text-white" aria-label="Cambiar tema">
          {theme === "dark" ? <FaSun /> : <FaMoon />}
        </button>

        <button className="btn btn-ghost text-white" aria-label="Notificaciones">
          <FaBell />
        </button>

        <div className="flex items-center gap-2">
          <FaUserCircle className="text-white text-2xl" />
          <div className="text-sm text-white">
            <div className="font-medium">Alumno UTN</div>
            <div className="text-xs text-white/80">alumno@utn.com</div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ clases, onSelect, onGoHome, q, claseActiva }) {
  const filtradas = clases.filter(({ name, teacher }) => {
    const text = `${name} ${teacher}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });
  return (
    <aside className="w-72 bg-white p-4 shadow-lg h-[calc(100vh-72px)] overflow-auto">
      <h2 className="font-bold text-lg mb-4">📚 Clases</h2>
      <button
        onClick={onGoHome}
        className={`w-full text-left p-3 rounded-lg mb-3 transition border ${
          !claseActiva ? "bg-green-50 border-green-200" : "hover:bg-green-50 border-transparent"
        }`}
      >
        <div className="font-medium">Inicio</div>
        <div className="text-xs text-gray-400">Ver actividad reciente</div>
      </button>
      <div className="flex flex-col gap-2">
        {filtradas.map((clase, i) => (
          <motion.button
            key={clase.name}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onSelect(clase.name)}
            className={`text-left p-3 rounded-lg transition flex items-center gap-3 ${
              claseActiva === clase.name ? "bg-green-50" : "hover:bg-green-50"
            }`}
            aria-label={`Abrir clase ${clase.name}`}
          >
            <FaBook className="text-[#006847]" />
            <div>
              <div className="font-medium">{clase.name}</div>
              <div className="text-xs text-gray-400">{clase.teacher}</div>
            </div>
          </motion.button>
        ))}
      </div>
    </aside>
  );
}

function ClassroomHeader({ clase }) {
  if (!clase) return null;
  return (
    <article className="relative overflow-hidden rounded-2xl shadow-md mb-5 min-h-[180px]">
      <img
        src={clase.cover}
        alt={`Portada de ${clase.name}`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/30" />
      <div className="relative p-6 text-white">
        <h2 className="text-3xl font-bold">{clase.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-white/90">
          <FaChalkboardTeacher />
          {clase.teacher}
        </p>
      </div>
    </article>
  );
}

function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 bg-white rounded shadow animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-8 bg-gray-200 rounded w-full mt-4" />
        </div>
      ))}
    </div>
  );
}

/* ---------- MaterialCard enriquecida ---------- */
function MaterialCard({ m, onToggleFav, isFav, onPreview }) {
  const subjectImage = getImageForSubject(m.materia);

  return (
    <motion.article whileHover={{ y: -6 }} className="bg-white rounded-lg shadow overflow-hidden flex flex-col justify-between" layout>
      <img
        src={subjectImage}
        alt={`Imagen representativa de ${m.materia || "la materia"}`}
        className="w-full h-32 object-cover"
        loading="lazy"
      />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-md bg-[#f0fff6] text-[#006847] flex items-center justify-center">
              {m.tipo?.toLowerCase().includes("pdf") ? <FaRegFilePdf /> : <FaRegFileAlt />}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{m.titulo}</h3>
              <p className="text-xs text-gray-500">{m.tipo} • {m.materia}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <button onClick={() => onToggleFav(m)} aria-label="Favorito" className={`p-2 rounded ${isFav ? "text-yellow-400" : "text-gray-300"}`}>
              <FaStar />
            </button>
            <span className="text-xs text-gray-400">{fmtFecha(m.fecha)}</span>
          </div>
        </div>

        {m.descripcion && <p className="mt-3 text-sm text-gray-600 line-clamp-3">{m.descripcion}</p>}
      </div>

      <div className="px-4 pb-4 mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => onPreview(m)} className="btn btn-sm btn-ghost">Vista previa</button>
          <button onClick={() => toast("Descarga simulada")} className="btn btn-sm bg-[#006847] text-white hover:bg-[#005c3f]">
            <FaDownload className="mr-2" /> Descargar
          </button>
        </div>
        <div className="text-xs text-gray-400">{m.size ? (m.size / 1024).toFixed(1) + " KB" : ""}</div>
      </div>
    </motion.article>
  );
}

/* ---------- Modal de vista previa ---------- */
function PreviewModal({ open, material, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div initial={{ scale: 0.98, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 10 }} className="relative z-10 max-w-3xl w-full bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaRegFileAlt className="text-2xl text-[#006847]" />
                <div>
                  <h3 className="font-semibold">{material?.titulo}</h3>
                  <p className="text-xs text-gray-500">{material?.tipo} • {material?.materia}</p>
                </div>
              </div>
              <button onClick={onClose} className="btn btn-ghost">Cerrar</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">{material?.descripcion || "Vista previa no disponible para este archivo."}</p>
              <div className="bg-gray-50 p-4 rounded text-xs text-gray-500">
                <strong>Archivo:</strong> {material?.nombreArchivo || "—"} <br />
                <strong>Subido:</strong> {fmtFecha(material?.fecha)} <br />
                <strong>Tamaño:</strong> {material?.size ? (material.size / 1024).toFixed(1) + " KB" : "—"}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Página principal refactorizada ---------- */
export default function AlumnoInicio() {
  const [q, setQ] = useState("");
  const [debQ, setDebQ] = useState("");
  const debounced = useRef(debounce((v) => setDebQ(v), 300)).current;

  const [favoritos, setFavoritos] = useLocalStore("favoritos", []);
  const [notificaciones, setNotificaciones] = useLocalStore("notificaciones", [{ mensaje: "Bienvenido 🎉", ts: Date.now() }]);
  const [materiales, setMateriales] = useLocalStore("materiales", []);
  const [materiaSel, setMateriaSel] = useState(null);
  const [preview, setPreview] = useState({ open: false, material: null });
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useLocalStore("theme", "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => { debounced(q); }, [q, debounced]);

  const clasesBase = [
    { name: "Desarrollo Web", teacher: "Ing. Laura Méndez", cover: getImageForSubject("Desarrollo Web") },
    { name: "Bases de Datos", teacher: "Mtro. Daniel Rojas", cover: getImageForSubject("Bases de Datos") },
    { name: "POO", teacher: "Ing. Ana Sofía Ruiz", cover: getImageForSubject("POO") },
    { name: "Redes", teacher: "Mtro. Carlos Herrera", cover: getImageForSubject("Redes") },
    { name: "Sistemas Operativos", teacher: "Ing. José Luis Vega", cover: getImageForSubject("Sistemas Operativos") }
  ];
  const clases = clasesBase.map((clase) => ({
    ...clase,
    filesCount: materiales.filter((m) => m.materia === clase.name).length
  }));
  const claseSeleccionada = clases.find((c) => c.name === materiaSel) || null;

  const materialesFiltrados = useMemo(() => {
    const s = debQ.trim().toLowerCase();
    return materiales.filter(m => {
      if (!s) return true;
      return (m.titulo || "").toLowerCase().includes(s) || (m.materia || "").toLowerCase().includes(s);
    });
  }, [materiales, debQ]);

  const toggleFavorito = (mat) => {
    const exists = favoritos.some(f => f.titulo === mat.titulo && f.materia === mat.materia);
    const nuevos = exists ? favoritos.filter(f => !(f.titulo === mat.titulo && f.materia === mat.materia)) : [mat, ...favoritos];
    setFavoritos(nuevos);
    const mensaje = exists ? `❌ Eliminaste ${mat.titulo}` : `⭐ Guardaste ${mat.titulo}`;
    setNotificaciones([{ mensaje, ts: Date.now() }, ...notificaciones]);
    toast.success(mensaje);
  };

  const cargarDemo = () => {
    setLoading(true);
    setTimeout(() => {
      const demo = [
        { titulo: "Guía de prácticas", tipo: "PDF", materia: "Desarrollo Web", fecha: new Date().toISOString(), nombreArchivo: "guia.pdf", size: 120000, descripcion: "Guía con ejercicios y soluciones." },
        { titulo: "Ejercicios resueltos", tipo: "DOCX", materia: "POO", fecha: new Date().toISOString(), nombreArchivo: "ejercicios.docx", size: 80000 },
        { titulo: "Presentación clase 3", tipo: "PPTX", materia: "Redes", fecha: new Date().toISOString(), nombreArchivo: "clase3.pptx", size: 200000 }
      ];
      setMateriales([...demo, ...materiales]);
      toast.success("Demo cargada");
      setLoading(false);
    }, 700);
  };

  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      <Toaster position="top-right" />
      <Navbar q={q} setQ={setQ} theme={theme} toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")} />

      <div className="flex gap-6 p-6 max-w-7xl mx-auto">
        <Sidebar
          clases={clases}
          onSelect={(m) => setMateriaSel(m)}
          onGoHome={() => setMateriaSel(null)}
          q={q}
          claseActiva={materiaSel}
        />

        <main className="flex-1">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-[#006847] to-[#005c3f] text-white shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm">Materiales</h3>
                    <p className="text-2xl font-bold">{materiales.length}</p>
                  </div>
                  <FaBook className="text-3xl opacity-90" />
                </div>
                <p className="text-xs mt-3">Última actualización: {materiales[0] ? fmtFecha(materiales[0].fecha) : "—"}</p>
              </div>

              <div className="p-4 rounded-lg bg-white shadow flex items-center justify-between">
                <div>
                  <h3 className="text-sm">Favoritos</h3>
                  <p className="text-2xl font-bold">{favoritos.length}</p>
                </div>
                <FaStar className="text-3xl text-yellow-400" />
              </div>

              <div className="p-4 rounded-lg bg-white shadow flex items-center justify-between">
                <div>
                  <h3 className="text-sm">Notificaciones</h3>
                  <p className="text-2xl font-bold">{notificaciones.length}</p>
                </div>
                <FaBell className="text-3xl text-gray-500" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={cargarDemo} className="btn bg-[#006847] text-white" disabled={loading}>{loading ? "Cargando..." : "Cargar demo"}</button>
              <button onClick={() => { setMateriales([]); localStorage.removeItem("materiales"); toast.success("Materiales eliminados (demo)"); }} className="btn btn-ghost">Limpiar materiales</button>
              <div className="text-sm text-gray-500 ml-auto"><FaRegFileAlt className="inline mr-2" /> Últimas acciones</div>
            </div>

            <section>
              {!materiaSel ? (
                <>
                  <h2 className="text-xl font-bold mb-3">Explorar materiales</h2>
                  {materialesFiltrados.length === 0 ? <div className="col-span-full p-6 bg-white rounded shadow text-gray-500">No hay materiales. Carga demo o sube contenido.</div> : null}

                  {loading ? <SkeletonGrid /> : (
                    <div className="grid md:grid-cols-3 gap-4">
                      {materialesFiltrados.slice(0, 9).map((m, i) => (
                        <MaterialCard key={i} m={m} onToggleFav={toggleFavorito} isFav={favoritos.some(f => f.titulo === m.titulo && f.materia === m.materia)} onPreview={(mat) => setPreview({ open: true, material: mat })} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <ClassroomHeader clase={claseSeleccionada} />
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {materiales.filter(x => x.materia === materiaSel).length === 0 ? <div className="p-6 bg-white rounded shadow text-gray-500">No hay materiales en esta materia</div> : materiales.filter(x => x.materia === materiaSel).map((m, i) => (
                      <MaterialCard key={i} m={m} onToggleFav={toggleFavorito} isFav={favoritos.some(f => f.titulo === m.titulo && f.materia === m.materia)} onPreview={(mat) => setPreview({ open: true, material: mat })} />
                    ))}
                  </div>
                </div>
              )}
            </section>

            {!materiaSel && (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-white rounded-lg p-4 shadow">
                  <h3 className="font-semibold mb-3">Actividad reciente</h3>
                  <div className="space-y-2">
                    {notificaciones.slice(0, 6).map((n, i) => (
                      <div key={i} className="p-3 rounded border border-gray-100 flex items-start gap-3">
                        <FaRegFileAlt className="text-gray-400 mt-1" />
                        <div>
                          <div className="text-sm">{n.mensaje}</div>
                          <div className="text-xs text-gray-400">{i === 0 ? "Hace unos segundos" : `${i+1} días atrás`}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 shadow">
                  <h3 className="font-semibold mb-3">Favoritos</h3>
                  {favoritos.length === 0 ? <div className="text-gray-500">Aún no tienes favoritos</div> : favoritos.slice(0, 6).map((f, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="text-sm">{f.titulo}</div>
                      <div className="text-xs text-gray-400">{f.materia}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      <PreviewModal open={preview.open} material={preview.material} onClose={() => setPreview({ open: false, material: null })} />
    </div>
  );
}
