import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AsyncCreatableSelect from 'react-select/async-creatable';
import {
  ChevronLeft, BookOpen, AlignLeft, Calendar,
  CheckCircle2, XCircle, Loader2, UserPlus, X,
} from 'lucide-react';
import { supabase } from '../services/supabase';

// ─── Constantes ────────────────────────────────────────────────
const MOTIVOS = [
  'Enfermedad / Cita médica',
  'Asunto familiar',
  'Trámite escolar',
  'Evento deportivo',
  'Evento cultural',
  'Otro',
];

const SEMESTRES = ['1', '2', '3', '4', '5', '6'];

const FORM_VACIO = { motivo: '', fechaInicio: '', fechaFin: '', observaciones: '' };

// Suma N días a una cadena 'YYYY-MM-DD' y devuelve la nueva cadena
const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// ─── Estilos react-select con soporte de estado error ──────────
const getRsStyles = (hasError = false) => ({
  control: (base, { isFocused }) => ({
    ...base,
    borderColor: hasError ? '#ef4444' : isFocused ? '#3b82f6' : '#e2e8f0',
    boxShadow: hasError
      ? '0 0 0 3px rgba(239,68,68,.12)'
      : isFocused ? '0 0 0 3px rgba(59,130,246,.12)' : 'none',
    borderRadius: '.5rem',
    fontSize: '.875rem',
    minHeight: '2.375rem',
    cursor: 'text',
    '&:hover': { borderColor: hasError ? '#ef4444' : '#3b82f6' },
  }),
  valueContainer:   (base) => ({ ...base, padding: '2px 10px' }),
  placeholder:      (base) => ({ ...base, color: '#94a3b8', fontSize: '.875rem' }),
  singleValue:      (base) => ({ ...base, color: '#0f172a', fontSize: '.875rem' }),
  input:            (base) => ({ ...base, fontSize: '.875rem', color: '#0f172a' }),
  option: (base, { isSelected, isFocused }) => ({
    ...base,
    fontSize: '.875rem',
    padding: '.5rem .75rem',
    backgroundColor: isSelected ? '#3b82f6' : isFocused ? '#eff6ff' : 'white',
    color: isSelected ? 'white' : '#0f172a',
    cursor: 'pointer',
  }),
  menu: (base) => ({
    ...base,
    borderRadius: '.5rem',
    boxShadow: '0 4px 16px rgba(0,0,0,.10)',
    border: '1px solid #e2e8f0',
    zIndex: 20,
  }),
  menuList:          (base) => ({ ...base, padding: '.25rem' }),
  loadingMessage:    (base) => ({ ...base, fontSize: '.875rem', color: '#64748b' }),
  noOptionsMessage:  (base) => ({ ...base, fontSize: '.875rem', color: '#64748b' }),
  clearIndicator:    (base) => ({ ...base, cursor: 'pointer', padding: '0 6px' }),
});

// ══════════════════════════════════════════════════════════════
export default function NuevoJustificante() {
  const navigate = useNavigate();

  // ── Estado: formulario principal ─────────────────────────────
  const [alumno,    setAlumno]    = useState(null);
  const [form,      setForm]      = useState(FORM_VACIO);
  const [errors,    setErrors]    = useState({});   // errores por campo
  const [guardando, setGuardando] = useState(false);
  const [alerta,    setAlerta]    = useState(null);

  // ── Estado: modal ────────────────────────────────────────────
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [modalNombre,        setModalNombre]        = useState('');
  const [modalMatricula,     setModalMatricula]     = useState('');
  const [modalSemestre,      setModalSemestre]      = useState('');
  const [modalGrupo,         setModalGrupo]         = useState('');
  const [modalErrors,        setModalErrors]        = useState({});
  const [guardandoAlumno,    setGuardandoAlumno]    = useState(false);

  // Helper: actualiza campo + limpia su error
  const set = (campo) => (e) => {
    setForm((p) => ({ ...p, [campo]: e.target.value }));
    if (errors[campo]) setErrors((p) => ({ ...p, [campo]: '' }));
  };

  // Al cambiar fechaInicio, limpia fechaFin si ya no es válida (debe ser > inicio)
  const handleFechaInicioChange = (e) => {
    const nuevo = e.target.value;
    setForm((p) => ({
      ...p,
      fechaInicio: nuevo,
      fechaFin: p.fechaFin && p.fechaFin <= nuevo ? '' : p.fechaFin,
    }));
    setErrors((p) => ({ ...p, fechaInicio: '', fechaFin: '' }));
  };

  // ── Búsqueda asíncrona ───────────────────────────────────────
  const buscarAlumnos = async (inputValue) => {
    if (!inputValue || inputValue.trim().length < 2) return [];

    const { data, error } = await supabase
      .from('alumnos')
      .select('id, nombre_completo, matricula, semestre, grupo')
      .or(`nombre_completo.ilike.%${inputValue}%,matricula.ilike.%${inputValue}%`)
      .order('nombre_completo')
      .limit(10);

    if (error) { console.error('[Supabase] buscarAlumnos:', error.message); return []; }

    return (data ?? []).map((a) => ({
      value: a.id,
      label: `${a.nombre_completo} - Matrícula: ${a.matricula ?? 'S/N'}${a.semestre ? ` - Semestre: ${a.semestre}` : ''}${a.grupo ? ` | Grupo: ${a.grupo}` : ''}`,
    }));
  };

  const handleAlumnoChange = (opcion) => {
    setAlumno(opcion ?? null);
    if (errors.alumno) setErrors((p) => ({ ...p, alumno: '' }));
  };

  // ── Modal: abrir ─────────────────────────────────────────────
  const handleAbrirModal = (inputValue) => {
    setModalNombre(inputValue.trim());
    setModalMatricula('');
    setModalSemestre('');
    setModalGrupo('');
    setModalErrors({});
    setIsStudentModalOpen(true);
  };

  const handleCerrarModal = () => {
    if (guardandoAlumno) return;
    setIsStudentModalOpen(false);
  };

  // ── Modal: guardar alumno ─────────────────────────────────────
  const handleGuardarAlumno = async () => {
    const errs = {};
    if (!modalMatricula.trim()) errs.matricula = 'La matrícula es obligatoria.';
    if (!modalNombre.trim())   errs.nombre    = 'El nombre es obligatorio.';
    if (!modalSemestre)        errs.semestre  = 'Selecciona el semestre.';
    if (!modalGrupo)           errs.grupo     = 'Selecciona el grupo.';
    if (Object.keys(errs).length) { setModalErrors(errs); return; }

    setModalErrors({});
    setGuardandoAlumno(true);

    try {
      const { data: creado, error } = await supabase
        .from('alumnos')
        .insert({
          nombre_completo: modalNombre,
          matricula:       modalMatricula.trim(),
          semestre:        modalSemestre,
          grupo:           modalGrupo.trim(),
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      const semestreGrupo = [modalSemestre, modalGrupo.trim()].filter(Boolean).join('');
      setAlumno({
        value: creado.id,
        label: `${modalNombre} - Matrícula: ${modalMatricula.trim()}${semestreGrupo ? ` - Semestre/Grupo: ${semestreGrupo}` : ''}`,
      });
      if (errors.alumno) setErrors((p) => ({ ...p, alumno: '' }));
      setIsStudentModalOpen(false);

    } catch (err) {
      console.error('[Supabase] guardarAlumno:', err);
      setModalErrors({ general: err.message || 'Error al guardar. Intenta de nuevo.' });
    } finally {
      setGuardandoAlumno(false);
    }
  };

  // ── Formulario: validar y guardar justificante ────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones de campo
    const errs = {};
    if (!alumno)           errs.alumno      = 'Selecciona o registra al alumno.';
    if (!form.motivo)      errs.motivo      = 'Selecciona un motivo.';
    if (!form.fechaInicio) errs.fechaInicio = 'Ingresa la fecha de inicio.';
    if (!form.fechaFin)    errs.fechaFin    = 'Ingresa la fecha de fin.';

    // Validación estricta: fecha fin debe ser POSTERIOR (no igual) a fecha inicio
    if (form.fechaInicio && form.fechaFin && form.fechaFin <= form.fechaInicio) {
      errs.fechaFin = 'La fecha fin debe ser posterior a la fecha de inicio (mínimo un día después).';
    }

    if (Object.keys(errs).length) { setErrors(errs); return; }

    setErrors({});
    setGuardando(true);
    setAlerta(null);

    try {
      const { error } = await supabase
        .from('justificantes')
        .insert({
          alumno_id:     alumno.value,
          motivo:        form.motivo,
          fecha_inicio:  form.fechaInicio,
          fecha_fin:     form.fechaFin,
          observaciones: form.observaciones || null,
        });

      if (error) throw new Error(error.message);

      navigate('/');  // redirige al Dashboard

    } catch (err) {
      console.error('[Supabase]', err);
      setAlerta({ tipo: 'error', texto: err.message || 'Error inesperado. Intenta de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <>
      {/* ══════════════════════════════════════════════════════
          MODAL: Registrar Nuevo Alumno
          ══════════════════════════════════════════════════════ */}
      {isStudentModalOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
          onClick={handleCerrarModal}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div className="modal-header-left">
                <UserPlus size={19} />
                <h2 className="modal-title" id="modal-titulo">Registrar Nuevo Alumno</h2>
              </div>
              <button
                className="modal-close"
                onClick={handleCerrarModal}
                disabled={guardandoAlumno}
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="modal-body">
              {/* Error general (Supabase) */}
              {modalErrors.general && (
                <div className="alerta alerta--error" style={{ marginBottom: '1rem' }}>
                  <XCircle size={16} /><span>{modalErrors.general}</span>
                </div>
              )}

              {/* Nombre completo — editable para corregir errores tipográficos */}
              <div className="form-group">
                <label className="form-label" htmlFor="modal-nombre">
                  Nombre completo <span className="required">*</span>
                </label>
                <input
                  id="modal-nombre"
                  type="text"
                  className={`form-input${modalErrors.nombre ? ' form-input--error' : ''}`}
                  placeholder="Nombre completo del alumno"
                  value={modalNombre}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                    setModalNombre(v);
                    setModalErrors((p) => ({ ...p, nombre: '' }));
                  }}
                />
                {modalErrors.nombre && <p className="field-error">{modalErrors.nombre}</p>}
              </div>

              {/* Matrícula */}
              <div className="form-group" style={{ marginTop: '.875rem' }}>
                <label className="form-label" htmlFor="modal-matricula">
                  Matrícula <span className="required">*</span>
                </label>
                <input
                  id="modal-matricula"
                  type="text"
                  className={`form-input${modalErrors.matricula ? ' form-input--error' : ''}`}
                  placeholder="Ej. 20341"
                  value={modalMatricula}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
                    setModalMatricula(v);
                    setModalErrors((p) => ({ ...p, matricula: '' }));
                  }}
                />
                {modalErrors.matricula && <p className="field-error">{modalErrors.matricula}</p>}
              </div>

              {/* Semestre y Grupo */}
              <div className="form-grid" style={{ marginTop: '.875rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="modal-semestre">
                    Semestre <span className="required">*</span>
                  </label>
                  <select
                    id="modal-semestre"
                    className={`form-input form-select${modalErrors.semestre ? ' form-input--error' : ''}`}
                    value={modalSemestre}
                    onChange={(e) => {
                      setModalSemestre(e.target.value);
                      setModalGrupo('');
                      setModalErrors((p) => ({ ...p, semestre: '', grupo: '' }));
                    }}
                  >
                    <option value="" disabled>-- Selecciona Semestre --</option>
                    {SEMESTRES.map((s) => (
                      <option key={s} value={s}>Semestre {s}</option>
                    ))}
                  </select>
                  {modalErrors.semestre && <p className="field-error">{modalErrors.semestre}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="modal-grupo">
                    Grupo <span className="required">*</span>
                  </label>
                  <select
                    id="modal-grupo"
                    className={`form-input form-select${modalErrors.grupo ? ' form-input--error' : ''}`}
                    value={modalGrupo}
                    onChange={(e) => { setModalGrupo(e.target.value); setModalErrors((p) => ({ ...p, grupo: '' })); }}
                    disabled={!modalSemestre}
                  >
                    <option value="" disabled>
                      {modalSemestre ? '-- Selecciona Grupo --' : '-- Elige semestre primero --'}
                    </option>
                    {modalSemestre && Array.from({ length: 7 }, (_, i) => {
                      const g = `${modalSemestre}0${i + 1}`;
                      return <option key={g} value={g}>{g}</option>;
                    })}
                  </select>
                  {modalErrors.grupo && <p className="field-error">{modalErrors.grupo}</p>}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={handleCerrarModal} disabled={guardandoAlumno}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleGuardarAlumno} disabled={guardandoAlumno}>
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
          PÁGINA PRINCIPAL
          ══════════════════════════════════════════════════════ */}
      <div className="page">

        <div className="page-header">
          <div>
            <Link to="/" className="back-link">
              <ChevronLeft size={16} /> Volver al inicio
            </Link>
            <h1 className="page-title">Nuevo Justificante</h1>
            <p className="page-subtitle">
              Busca al alumno por nombre o matrícula. Si no existe, escríbelo para registrarlo.
            </p>
          </div>
        </div>

        {/* Alerta de error de red */}
        {alerta && (
          <div className={`alerta alerta--${alerta.tipo}`}>
            {alerta.tipo === 'exito' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span>{alerta.texto}</span>
            <button className="alerta-cerrar" onClick={() => setAlerta(null)} aria-label="Cerrar">×</button>
          </div>
        )}

        <div className="card form-card">
          <form className="form" onSubmit={handleSubmit} noValidate>

            {/* ── Sección: Alumno ── */}
            <fieldset className="form-section">
              <legend className="form-section-title">
                <BookOpen size={16} /> Alumno
              </legend>

              <div className="form-group">
                <label className="form-label">
                  Nombre o Matrícula <span className="required">*</span>
                </label>
                <AsyncCreatableSelect
                  isClearable
                  value={alumno}
                  loadOptions={buscarAlumnos}
                  onChange={handleAlumnoChange}
                  onCreateOption={handleAbrirModal}
                  placeholder="Escribe el nombre o matrícula…"
                  loadingMessage={() => 'Buscando…'}
                  noOptionsMessage={({ inputValue }) =>
                    inputValue.length < 2
                      ? 'Escribe al menos 2 caracteres para buscar'
                      : 'No encontrado — escribe para registrarlo como nuevo'
                  }
                  formatCreateLabel={(v) => `✚  Registrar nuevo alumno: "${v}"`}
                  formatOptionLabel={(opt) => (
                    <div className="rs-option">
                      <span className="rs-option-label">{opt.label}</span>
                    </div>
                  )}
                  styles={getRsStyles(!!errors.alumno)}
                />
                {errors.alumno && <p className="field-error">{errors.alumno}</p>}
              </div>
            </fieldset>

            {/* ── Sección: Motivo e inasistencias ── */}
            <fieldset className="form-section">
              <legend className="form-section-title">
                <AlignLeft size={16} /> Motivo e inasistencias
              </legend>

              <div className="form-grid">
                {/* Motivo */}
                <div className="form-group">
                  <label className="form-label" htmlFor="motivo">
                    Motivo <span className="required">*</span>
                  </label>
                  <select
                    id="motivo"
                    className={`form-input form-select${errors.motivo ? ' form-input--error' : ''}`}
                    value={form.motivo}
                    onChange={set('motivo')}
                  >
                    <option value="">-- Selecciona un motivo --</option>
                    {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  {errors.motivo && <p className="field-error">{errors.motivo}</p>}
                </div>

                {/* Fecha inicio */}
                <div className="form-group">
                  <label className="form-label" htmlFor="fecha-inicio">
                    <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Fecha inicio <span className="required">*</span>
                  </label>
                  <input
                    id="fecha-inicio"
                    type="date"
                    className={`form-input${errors.fechaInicio ? ' form-input--error' : ''}`}
                    value={form.fechaInicio}
                    onChange={handleFechaInicioChange}
                  />
                  {errors.fechaInicio && <p className="field-error">{errors.fechaInicio}</p>}
                </div>

                {/* Fecha fin — ahora obligatoria */}
                <div className="form-group">
                  <label className="form-label" htmlFor="fecha-fin">
                    <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Fecha fin <span className="required">*</span>
                  </label>
                  <input
                    id="fecha-fin"
                    type="date"
                    className={`form-input${errors.fechaFin ? ' form-input--error' : ''}`}
                    value={form.fechaFin}
                    onChange={set('fechaFin')}
                    min={form.fechaInicio ? addDays(form.fechaInicio, 1) : undefined}
                  />
                  {errors.fechaFin && <p className="field-error">{errors.fechaFin}</p>}
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label" htmlFor="observaciones">Observaciones</label>
                <textarea
                  id="observaciones"
                  className="form-input form-textarea"
                  rows={4}
                  placeholder="Información adicional relevante para el justificante…"
                  value={form.observaciones}
                  onChange={set('observaciones')}
                />
              </div>
            </fieldset>

            {/* ── Acciones ── */}
            <div className="form-actions">
              <Link to="/" className="btn btn-ghost">Cancelar</Link>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando
                  ? <><Loader2 size={15} className="spin" /> Guardando…</>
                  : 'Guardar Justificante'
                }
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
