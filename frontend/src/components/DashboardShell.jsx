import { Link, useLocation, useNavigate } from "react-router-dom";
import { getDefaultRouteForRole, getStoredUser, normalizeRole } from "../utils/auth";

const roleConfig = {
  alumno: {
    badge: "Alumno",
    title: "Panel de Alumno",
    links: [
      { to: "/dashboard/alumno", label: "Mis materiales" },
      { to: "/explorar", label: "Explorar repositorio" },
    ],
  },
  maestro: {
    badge: "Maestro",
    title: "Panel de Maestro",
    links: [
      { to: "/dashboard/maestro", label: "Gestionar materiales" },
      { to: "/explorar", label: "Vista pública" },
    ],
  },
  admin: {
    badge: "Administrador",
    title: "Panel de Administración",
    links: [
      { to: "/dashboard/admin", label: "Resumen general" },
      { to: "/dashboard/maestro", label: "Materiales" },
    ],
  },
};

export default function DashboardShell({ role = "alumno", description, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const currentRole = normalizeRole(user) || role;
  const config = roleConfig[role === "superadmin" ? "admin" : role] || roleConfig.alumno;

  const forceDashboard = () => navigate(getDefaultRouteForRole(currentRole));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 lg:py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <aside className="lg:col-span-3 lg:sticky lg:top-4 h-fit">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4">
              <div className="badge badge-primary badge-outline">{config.badge}</div>
              <h1 className="card-title text-lg">{config.title}</h1>
              <p className="text-sm text-base-content/70">{description}</p>

              <ul className="menu menu-sm bg-base-200 rounded-box mt-3 md:menu-md">
                {config.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to} className={location.pathname === link.to ? "active" : ""}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <button type="button" onClick={forceDashboard} className="btn btn-primary btn-sm mt-3">
                Ir a mi dashboard
              </button>
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9">{children}</section>
      </div>
    </div>
  );
}
