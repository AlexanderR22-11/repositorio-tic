import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-12">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <h4 className="font-bold">Repositorio UTN</h4>
          <p className="text-sm text-gray-600 mt-2">Material didáctico y recursos para Ingeniería. Uso académico y con atribución.</p>
        </div>

        <div>
          <h4 className="font-bold">Contacto</h4>
          <p className="text-sm text-gray-600 mt-2">Correo: soporte@utn.edu.mx</p>
          <p className="text-sm text-gray-600">Tel: (33) 1234 5678</p>
        </div>

        <div>
          <h4 className="font-bold">Enlaces</h4>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>Política de uso</li>
            <li>Colaboradores</li>
            <li>Ayuda</li>
          </ul>
        </div>
      </div>

      <div className="border-t py-4 text-center text-xs text-gray-500">© Derechos reservados Repositorio UTN</div>
    </footer>
  );
}
