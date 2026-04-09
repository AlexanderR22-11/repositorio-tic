export function getStoredUser() {
  const stored = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function normalizeRole(user) {
  return (user?.role || user?.rol || "").toString().toLowerCase();
}

export function getDefaultRouteForRole(role) {
  if (role === "maestro") return "/dashboard/maestro";
  if (role === "admin" || role === "superadmin") return "/dashboard/admin";
  return "/dashboard/alumno";
}

export function canTeacherManageSubject(user, subject) {
  const role = normalizeRole(user);
  if (role === "admin" || role === "superadmin") return true;
  if (role !== "maestro") return false;
  const materias = Array.isArray(user?.materias) ? user.materias : [];
  return materias.includes(subject);
}


export function getStoredToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
}

export function clearStoredAuth() {
  localStorage.removeItem("usuario");
  localStorage.removeItem("token");
  sessionStorage.removeItem("usuario");
  sessionStorage.removeItem("token");
}
