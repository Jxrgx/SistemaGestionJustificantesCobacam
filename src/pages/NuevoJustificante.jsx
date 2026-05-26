import { User, Hash, BookOpen, Calendar, AlignLeft, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const motivos = [
  'Enfermedad / Cita médica',
  'Asunto familiar',
  'Trámite escolar',
  'Evento deportivo',
  'Evento cultural',
  'Otro',
];

export default function NuevoJustificante() {
  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <Link to="/" className="back-link">
            <ChevronLeft size={16} /> Volver al inicio
          </Link>
          <h1 className="page-title">Nuevo Justificante</h1>
          <p className="page-subtitle">Completa los datos del alumno y el motivo de la inasistencia.</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="card form-card">
        <form className="form" onSubmit={(e) => e.preventDefault()}>

          {/* Sección: Datos del alumno */}
          <fieldset className="form-section">
            <legend className="form-section-title">
              <User size={16} /> Datos del alumno
            </legend>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="nombre">
                  Nombre completo <span className="required">*</span>
                </label>
                <input
                  id="nombre"
                  type="text"
                  className="form-input"
                  placeholder="Ej. García López, Juan Pablo"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="matricula">
                  Matrícula <span className="required">*</span>
                </label>
                <div className="input-icon-wrapper">
                  <Hash size={16} className="input-icon" />
                  <input
                    id="matricula"
                    type="text"
                    className="form-input input-with-icon"
                    placeholder="Ej. 2024001"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="grupo">
                  Grupo
                </label>
                <div className="input-icon-wrapper">
                  <BookOpen size={16} className="input-icon" />
                  <input
                    id="grupo"
                    type="text"
                    className="form-input input-with-icon"
                    placeholder="Ej. 3°A"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          {/* Sección: Motivo y fechas */}
          <fieldset className="form-section">
            <legend className="form-section-title">
              <AlignLeft size={16} /> Motivo e inasistencias
            </legend>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="motivo">
                  Motivo <span className="required">*</span>
                </label>
                <select id="motivo" className="form-input form-select">
                  <option value="">-- Selecciona un motivo --</option>
                  {motivos.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fecha-inicio">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Fecha inicio <span className="required">*</span>
                </label>
                <input id="fecha-inicio" type="date" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="fecha-fin">
                  <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Fecha fin
                </label>
                <input id="fecha-fin" type="date" className="form-input" />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label" htmlFor="observaciones">
                Observaciones
              </label>
              <textarea
                id="observaciones"
                className="form-input form-textarea"
                rows={4}
                placeholder="Información adicional relevante para el justificante..."
              />
            </div>
          </fieldset>

          {/* Acciones */}
          <div className="form-actions">
            <Link to="/" className="btn btn-ghost">Cancelar</Link>
            <button type="submit" className="btn btn-primary">
              Guardar Justificante
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
