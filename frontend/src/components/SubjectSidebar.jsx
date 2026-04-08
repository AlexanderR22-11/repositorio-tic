import React from "react";
import { FaBookOpen, FaChalkboardTeacher } from "react-icons/fa";

export default function SubjectSidebar({ subjects, selectedSubjectId, onSelect }) {
  return (
    <aside className="md:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-fit">
      <div className="mb-3">
        <h4 className="font-bold text-[#006847]">Aulas</h4>
        <p className="text-xs text-gray-500">Estilo Classroom</p>
      </div>

      <ul className="space-y-2">
        {subjects.map((subject) => {
          const isActive = selectedSubjectId === subject.id;

          return (
            <li key={subject.id}>
              <button
                type="button"
                onClick={() => onSelect(subject.id)}
                className={`w-full text-left rounded-xl p-3 border transition ${
                  isActive
                    ? "bg-green-50 border-green-300"
                    : "bg-white border-gray-200 hover:border-green-200 hover:bg-green-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 text-[#006847]">
                    <FaBookOpen />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{subject.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <FaChalkboardTeacher />
                      {subject.teacher}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{subject.filesCount} archivos</p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
