import { requireRole } from "./auth.js";

const checkRole = (rolesPermitidos) => requireRole(rolesPermitidos);

export default checkRole;
