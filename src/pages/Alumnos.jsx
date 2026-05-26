import { Search, UserPlus, Users } from 'lucide-react';

export default function Alumnos() {
  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Catálogo de Alumnos</h1>
          <p className="page-subtitle">Gestiona el padrón de alumnos registrados en el sistema.</p>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={16} />
          <span>Agregar Alumno</span>
        </button>
      </div>

      {/* Barra de búsqueda */}
      <div className="card" style={{ padding: '1rem 1.25rem' }}>
        <div className="search-bar">
          <Search size={17} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, matrícula o grupo..."
          />
        </div>
      </div>

      {/* Lista placeholder */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Alumnos registrados</h2>
          <span className="badge">0 alumnos</span>
        </div>
        <div className="empty-state">
          <Users size={40} strokeWidth={1.25} className="empty-state-icon" />
          <p className="empty-state-text">No hay alumnos en el catálogo.</p>
          <p className="empty-state-sub">Agrega el primer alumno para comenzar a gestionar justificantes.</p>
        </div>
      </div>
    </div>
  );
}
