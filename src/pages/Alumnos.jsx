import { useState, useEffect, useCallback } from 'react';
import {
  Search, UserPlus, Users, Eye, X,
  Loader2, XCircle, ClipboardList,
} from 'lucide-react';
import { supabase } from '../services/supabase';

const SEMESTRES = ['1', '2', '3', '4', '5', '6'];
const ADD_FORM_VACIO = { matricula: '', nombre_completo: '', semestre: '', grupo: '' };

export default function Alumnos() {
  // ── Datos ────────────────────────────────────────────────────
  const [alumnos,    setAlumnos]    = useState([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // ── Modal: Agregar Alumno ────────────────────────────────────
  const [isAddModalOpen,  setIsAddModalOpen]  = useState(false);
  const [addForm,         setAddForm]         = useState(ADD_FORM_VACIO);
  const [addErrors,       setAddErrors]       = useState({});
  const [guardandoAlumno, setGuardandoAlumno] = useState(false);

  // ── Modal: Historial ─────────────────────────────────────────
  const [selectedAlumno,     setSelectedAlumno]     = useState(null);
  const [historial,          setHistorial]          = useState([]);
  const [isHistorialLoading, setIsHistorialLoading] = useState(false);

  // ── Fetch alumnos ────────────────────────────────────────────
  const fetchAlumnos = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .order('nombre_completo');
    if (!error) setAlumnos(data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchAlumnos(); }, [fetchAlumnos]);

  // ── Filtrado local ───────────────────────────────────────────
  const term = searchTerm.toLowerCase();
  const alumnosFiltrados = alumnos.filter((a) =>
    (a.nombre_completo ?? '').toLowerCase().includes(term) ||
    (a.matricula       ?? '').toLowerCase().includes(term) ||
    (a.grupo           ?? '').toLowerCase().includes(term)
  );

  // ── Modal Agregar: helpers ───────────────────────────────────
  const setAdd = (campo) => (e) => {
    setAddForm((p) => ({ ...p, [campo]: e.target.value }));
    if (addErrors[campo]) setAddErrors((p) => ({ ...p, [campo]: '' }));
  };

  const handleAbrirAddModal = () => {
    setAddForm(ADD_FORM_VACIO);
    setAddErrors({});
    setIsAddModalOpen(true);
  };

  const handleGuardarAlumno = async () => {
    const errs = {};
    if (!addForm.nombre_completo.trim()) errs.nombre_completo = 'El nombre es obligatorio.';
    if (!addForm.semestre)               errs.semestre        = 'Selecciona el semestre.';
    if (!addForm.grupo)                  errs.grupo           = 'Selecciona el grupo.';
    if (Object.keys(errs).length) { setAddErrors(errs); return; }

    setAddErrors({});
    setGuardandoAlumno(true);

    try {
      const { error } = await supabase.from('alumnos').insert({
        matricula:       addForm.matricula.trim() || null,
        nombre_completo: addForm.nombre_completo.trim(),
        semestre:        addForm.semestre,
        grupo:           addForm.grupo,
      });
      if (error) throw new Error(error.message);
      setIsAddModalOpen(false);
      await fetchAlumnos();
    } catch (err) {
      setAddErrors({ general: err.message || 'Error al guardar. Intenta de nuevo.' });
    } finally {
      setGuardandoAlumno(false);
    }
  };

  // ── Modal Historial ──────────────────────────────────────────
  const handleVerHistorial = async (alumno) => {
    setSelectedAlumno(alumno);
    setHistorial([]);
    setIsHistorialLoading(true);

    const { data, error } = await supabase
      .from('justificantes')
      .select('*')
      .eq('alumno_id', alumno.id)
      .order('created_at', { ascending: false });

    if (!error) setHistorial(data ?? []);
    setIsHistorialLoading(false);
  };

  // ── Formateadores ────────────────────────────────────────────
  const fmtFecha = (iso) => iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  const fmtRegistrado = (iso) => iso
    ? new Date(iso).toLocaleDateString('es-MX', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—';

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      {/* ══════════════════════════════════════════════════════
          MODAL: Agregar Alumno
          ══════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-modal-titulo"
          onClick={() => !guardandoAlumno && setIsAddModalOpen(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div className="modal-header-left">
                <UserPlus size={19} />
                <h2 className="modal-title" id="add-modal-titulo">Agregar Alumno</h2>
              </div>
              <button
                className="modal-close"
                onClick={() => setIsAddModalOpen(false)}
                disabled={guardandoAlumno}
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="modal-body">
              {addErrors.general && (
                <div className="alerta alerta--error" style={{ marginBottom: '1rem' }}>
                  <XCircle size={16} /><span>{addErrors.general}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="add-matricula">
                  Matrícula{' '}
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input
                  id="add-matricula"
                  type="text"
                  className="form-input"
                  placeholder="Ej. 20341"
                  value={addForm.matricula}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
                    setAddForm((p) => ({ ...p, matricula: v }));
                  }}
                />
              </div>

              <div className="form-group" style={{ marginTop: '.875rem' }}>
                <label className="form-label" htmlFor="add-nombre">
                  Nombre completo <span className="required">*</span>
                </label>
                <input
                  id="add-nombre"
                  type="text"
                  className={`form-input${addErrors.nombre_completo ? ' form-input--error' : ''}`}
                  placeholder="Ej. Ana López Martínez"
                  value={addForm.nombre_completo}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                    setAddForm((p) => ({ ...p, nombre_completo: v }));
                    if (addErrors.nombre_completo) setAddErrors((p) => ({ ...p, nombre_completo: '' }));
                  }}
                />
                {addErrors.nombre_completo && (
                  <p className="field-error">{addErrors.nombre_completo}</p>
                )}
              </div>

              <div className="form-grid" style={{ marginTop: '.875rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-semestre">
                    Semestre <span className="required">*</span>
                  </label>
                  <select
                    id="add-semestre"
                    className={`form-input form-select${addErrors.semestre ? ' form-input--error' : ''}`}
                    value={addForm.semestre}
                    onChange={(e) => {
                      setAddForm((p) => ({ ...p, semestre: e.target.value, grupo: '' }));
                      setAddErrors((p) => ({ ...p, semestre: '', grupo: '' }));
                    }}
                  >
                    <option value="" disabled>-- Selecciona Semestre --</option>
                    {SEMESTRES.map((s) => (
                      <option key={s} value={s}>Semestre {s}</option>
                    ))}
                  </select>
                  {addErrors.semestre && <p className="field-error">{addErrors.semestre}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="add-grupo">
                    Grupo <span className="required">*</span>
                  </label>
                  <select
                    id="add-grupo"
                    className={`form-input form-select${addErrors.grupo ? ' form-input--error' : ''}`}
                    value={addForm.grupo}
                    onChange={setAdd('grupo')}
                    disabled={!addForm.semestre}
                  >
                    <option value="" disabled>
                      {addForm.semestre ? '-- Selecciona Grupo --' : '-- Elige semestre primero --'}
                    </option>
                    {addForm.semestre && Array.from({ length: 7 }, (_, i) => {
                      const g = `${addForm.semestre}0${i + 1}`;
                      return <option key={g} value={g}>{g}</option>;
                    })}
                  </select>
                  {addErrors.grupo && <p className="field-error">{addErrors.grupo}</p>}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsAddModalOpen(false)}
                disabled={guardandoAlumno}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleGuardarAlumno}
                disabled={guardandoAlumno}
              >
                {guardandoAlumno
                  ? <><Loader2 size={15} className="spin" /> Guardando…</>
                  : <><UserPlus size={15} /> Guardar Alumno</>
                }
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL: Historial de Justificantes
          ══════════════════════════════════════════════════════ */}
      {selectedAlumno && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hist-modal-titulo"
          onClick={() => setSelectedAlumno(null)}
        >
          <div
            className="modal"
            style={{ maxWidth: 600 }}
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <div className="modal-header-left">
                <ClipboardList size={19} />
                <div>
                  <h2 className="modal-title" id="hist-modal-titulo">
                    Historial de Justificantes
                  </h2>
                  <p style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.125rem' }}>
                    {selectedAlumno.nombre_completo}
                    {selectedAlumno.matricula && ` · Mat. ${selectedAlumno.matricula}`}
                  </p>
                </div>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedAlumno(null)}
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div
              className="modal-body"
              style={{ padding: 0, maxHeight: '55vh', overflowY: 'auto' }}
            >
              {isHistorialLoading ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '.5rem', padding: '2.5rem', color: '#64748b',
                }}>
                  <Loader2 size={20} className="spin" />
                  <span style={{ fontSize: '.875rem' }}>Cargando historial…</span>
                </div>
              ) : historial.length === 0 ? (
                <div className="empty-state" style={{ padding: '2.5rem 1.5rem' }}>
                  <ClipboardList size={36} strokeWidth={1.25} className="empty-state-icon" />
                  <p className="empty-state-text">Sin justificantes registrados</p>
                  <p className="empty-state-sub">
                    Este alumno no tiene justificantes en el sistema.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Motivo y Observaciones</th>
                        <th>Fecha Inicio</th>
                        <th>Fecha Fin</th>
                        <th>Registrado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((j) => (
                        <tr key={j.id}>
                          <td>
                            <span className="motivo-chip">{j.motivo}</span>
                            {j.observaciones && (
                              <p style={{
                                fontSize: '.75rem',
                                color: '#64748b',
                                marginTop: '.375rem',
                                lineHeight: 1.45,
                                maxWidth: '22ch',
                              }}>
                                {j.observaciones}
                              </p>
                            )}
                          </td>
                          <td className="table-meta">{fmtFecha(j.fecha_inicio)}</td>
                          <td className="table-meta">{fmtFecha(j.fecha_fin)}</td>
                          <td className="table-meta">{fmtRegistrado(j.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.8125rem', color: '#64748b' }}>
                {historial.length > 0 && `${historial.length} justificante${historial.length !== 1 ? 's' : ''}`}
              </span>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setSelectedAlumno(null)}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          PÁGINA PRINCIPAL
          ══════════════════════════════════════════════════════ */}
      <div className="page">

        <div className="page-header">
          <div>
            <h1 className="page-title">Catálogo de Alumnos</h1>
            <p className="page-subtitle">Gestiona el padrón de alumnos registrados en el sistema.</p>
          </div>
          <button className="btn btn-primary" onClick={handleAbrirAddModal}>
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabla de alumnos */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Alumnos registrados</h2>
            <span className="badge">
              {isLoading
                ? '…'
                : `${alumnosFiltrados.length} alumno${alumnosFiltrados.length !== 1 ? 's' : ''}`
              }
            </span>
          </div>

          {isLoading ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '.5rem', padding: '3rem', color: '#64748b',
            }}>
              <Loader2 size={22} className="spin" />
              <span style={{ fontSize: '.875rem' }}>Cargando alumnos…</span>
            </div>
          ) : alumnosFiltrados.length === 0 ? (
            <div className="empty-state">
              <Users size={40} strokeWidth={1.25} className="empty-state-icon" />
              <p className="empty-state-text">
                {searchTerm ? 'Sin resultados para esta búsqueda.' : 'No hay alumnos en el catálogo.'}
              </p>
              <p className="empty-state-sub">
                {searchTerm
                  ? 'Intenta con otro nombre, matrícula o grupo.'
                  : 'Agrega el primer alumno para comenzar a gestionar justificantes.'}
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Matrícula</th>
                    <th>Nombre</th>
                    <th>Semestre</th>
                    <th>Grupo</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alumnosFiltrados.map((a) => (
                    <tr key={a.id}>
                      <td className="table-meta">{a.matricula ?? '—'}</td>
                      <td>
                        <span className="table-name">{a.nombre_completo}</span>
                      </td>
                      <td className="table-meta">{a.semestre ?? '—'}</td>
                      <td className="table-meta">{a.grupo ?? '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn-icon"
                          title="Ver historial de justificantes"
                          onClick={() => handleVerHistorial(a)}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
