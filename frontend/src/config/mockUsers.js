// Usuarios de demostración para simular autenticación y permisos por rol.
// Se usan cuando el backend no responde o no tiene todos los roles disponibles.
export const MOCK_USERS = [
  {
    nombre: "Alumno Demo",
    correo: "alumno@utn.com",
    password: "123",
    role: "alumno",
    materias: [],
  },
  {
    nombre: "Maestro Demo",
    correo: "maestro@utn.com",
    password: "123",
    role: "maestro",
    materias: ["Desarrollo Web", "Bases de Datos"],
  },
  {
    nombre: "Admin Demo",
    correo: "admin@utn.com",
    password: "123",
    role: "admin",
    materias: ["*"],
  },
];

export function findMockUser(correo, password) {
  const email = (correo || "").trim().toLowerCase();
  return MOCK_USERS.find((u) => u.correo === email && u.password === password) || null;
}
