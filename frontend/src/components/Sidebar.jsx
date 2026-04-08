import { useState } from "react";

function Sidebar({ onSelectMateria }) {
  const data = [
    {
      cuatri: "1er Cuatrimestre",
      materias: ["Programación", "Matemáticas"]
    },
    {
      cuatri: "2do Cuatrimestre",
      materias: ["Bases de Datos", "POO"]
    },
    {
      cuatri: "3er Cuatrimestre",
      materias: ["Desarrollo Web", "Redes"]
    }
  ];

  return (
    <div className="w-64 bg-white p-4 shadow-lg">

      <h2 className="font-bold mb-4">Cuatrimestres</h2>

      {data.map((c, index) => (
        <div key={index} className="mb-3">

          <h3 className="font-semibold">{c.cuatri}</h3>

          <ul className="ml-3">
            {c.materias.map((m, i) => (
              <li
                key={i}
                className="cursor-pointer hover:text-green-700"
                onClick={() => onSelectMateria(m)}
              >
                {m}
              </li>
            ))}
          </ul>

        </div>
      ))}

    </div>
  );
}

export default Sidebar;