import { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";

function DarkModeToggle() {

  const [dark, setDark] = useState(false);

  // CARGAR TEMA AL INICIAR
  useEffect(() => {
    const tema = localStorage.getItem("theme");
    if (tema === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // CAMBIAR TEMA
  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="btn btn-sm"
    >
      {dark ? <FaSun /> : <FaMoon />}
    </button>
  );
}

export default DarkModeToggle;