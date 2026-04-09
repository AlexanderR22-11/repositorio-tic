import React from "react";
import { FaBookOpen, FaChalkboardTeacher } from "react-icons/fa";
import { motion } from "framer-motion";

export default function SubjectSidebar({ subjects, selectedSubjectId, onSelect }) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -18 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.35 }}
      className="md:col-span-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 h-fit"
    >
      <div className="mb-3">
        <h4 className="font-bold text-[#006847]">Clases</h4>
      </div>

      <ul className="space-y-2">
        {subjects.map((subject, idx) => {
          const isActive = selectedSubjectId === subject.id;

          return (
            <motion.li
              key={subject.id}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
            >
              <motion.button
                type="button"
                onClick={() => onSelect(subject.id)}
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
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
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </motion.aside>
  );
}
