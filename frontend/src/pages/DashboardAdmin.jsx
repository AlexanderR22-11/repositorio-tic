function DashboardAdmin() {
  return (
    <div className="min-h-screen bg-base-200">

      <div className="navbar bg-primary text-white px-6">
        <h1 className="font-bold">Admin - UTN</h1>
      </div>

      <div className="p-6">

        <h2 className="text-2xl font-bold mb-4">
          Panel de Administración
        </h2>

        <div className="grid md:grid-cols-3 gap-4">

          <div className="card bg-base-100 shadow p-4">
            📁 Gestionar Material
          </div>

          <div className="card bg-base-100 shadow p-4">
            👨‍🏫 Gestionar Maestros
          </div>

          <div className="card bg-base-100 shadow p-4">
            👨‍🎓 Gestionar Alumnos
          </div>

        </div>

      </div>
    </div>
  );
}

export default DashboardAdmin;