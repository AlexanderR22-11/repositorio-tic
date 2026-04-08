import React from "react";
import { FaFolderOpen, FaUserTie } from "react-icons/fa";

export default function SubjectClassroomCard({ subject }) {
  if (!subject) return null;

  return (
    <article className="card bg-gradient-to-r from-[#006847] to-[#0b8f63] text-white shadow-md mb-6">
      <div className="card-body">
        <h3 className="card-title text-2xl">{subject.name}</h3>
        <p className="text-white/90 flex items-center gap-2">
          <FaUserTie />
          {subject.teacher}
        </p>
        <div className="flex flex-wrap gap-3 mt-3">
          <span className="badge badge-outline border-white text-white py-3 px-3">
            Grupo: {subject.group}
          </span>
          <span className="badge badge-outline border-white text-white py-3 px-3">
            <FaFolderOpen /> {subject.filesCount} archivos subidos
          </span>
        </div>
      </div>
    </article>
  );
}
