// utils/emailValidator.js

export default function esCorreoInstitucional(email) {

  if (!email) return false;

  const dominiosPermitidos = [
    "@utnay.edu.mx"
    
  ];

  return dominiosPermitidos.some(dominio =>
    email.toLowerCase().endsWith(dominio)
  );

}