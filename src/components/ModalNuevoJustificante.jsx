import { useState, useEffect } from 'react';
import AsyncCreatableSelect from 'react-select/async-creatable';
import {
  FilePlus2, BookOpen, AlignLeft, Calendar,
  XCircle, Loader2, UserPlus, X,
} from 'lucide-react';
import { supabase } from '../services/supabase';

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

const addDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

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
export default function ModalNuevoJustificante({ isOpen, onClose, onSuccess }) {
  const [alumno,    setAlumno]    = useState(null);
  const [form,      setForm]      = useState(FORM_VACIO);
  const [errors,    setErrors]    = useState({});
  const [guardando, setGuardando] = useState(false);
  const [alerta,    setAlerta]    = useState(null);

  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [modalNombre,        setModalNombre]        = useState('');
  const [modalMatricula,     setModalMatricula]     = useState('');
  const [modalSemestre,      setModalSemestre]      = useState('');
  const [modalGrupo,         setModalGrupo]         = useState('');
  const [modalErrors,        setModalErrors]        = useState({});
  const [guardandoAlumno,    setGuardandoAlumno]    = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAlumno(null);
      setForm(FORM_VACIO);
      setErrors({});
      setAlerta(null);
      setIsStudentModalOpen(false);
      setModalNombre('');
      setModalMatricula('');
      setModalSemestre('');
      setModalGrupo('');
      setModalErrors({});
    }
  }, [isOpen]);

  const set = (campo) => (e) => {
    setForm((p) => ({ ...p, [campo]: e.target.value }));
    if (errors[campo]) setErrors((p) => ({ ...p, [campo]: '' }));
  };

  const handleFechaInicioChange = (e) => {
    const nuevo = e.target.value;
    setForm((p) => ({
      ...p,
      fechaInicio: nuevo,
      fechaFin: p.fechaFin && p.fechaFin <= nuevo ? '' : p.fechaFin,
    }));
    setErrors((p) => ({ ...p, fechaInicio: '', fechaFin: '' }));
  };

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

  const handleAbrirModalAlumno = (inputValue) => {
    setModalNombre(inputValue.trim());
    setModalMatricula('');
    setModalSemestre('');
    setModalGrupo('');
    setModalErrors({});
    setIsStudentModalOpen(true);
  };

  const handleCerrarModalAlumno = () => {
    if (guardandoAlumno) return;
    setIsStudentModalOpen(false);
  };

  const handleGuardarAlumno = async () => {
    const errs = {};
    if (!modalNombre.trim())    errs.nombre    = 'El nombre es obligatorio.';
    if (!modalMatricula.trim()) errs.matricula = 'La matrícula es obligatoria.';
    if (!modalSemestre)         errs.semestre  = 'Selecciona el semestre.';
    if (!modalGrupo)            errs.grupo     = 'Selecciona el grupo.';
    if (Object.keys(errs).length) { setModalErrors(errs); return; }

    setModalErrors({});
    setGuardandoAlumno(true);

    try {
      const { data: creado, error } = await supabase
        .from('alumnos')
        .insert({
          nombre_completo: modalNombre.trim(),
          matricula:       modalMatricula.trim(),
          semestre:        modalSemestre,
          grupo:           modalGrupo,
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      setAlumno({
        value: creado.id,
        label: `${modalNombre.trim()} - Matrícula: ${modalMatricula.trim()} - Semestre: ${modalSemestre} | Grupo: ${modalGrupo}`,
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = {};
    if (!alumno)           errs.alumno      = 'Selecciona o registra al alumno.';
    if (!form.motivo)      errs.motivo      = 'Selecciona un motivo.';
    if (!form.fechaInicio) errs.fechaInicio = 'Ingresa la fecha de inicio.';
    if (!form.fechaFin)    errs.fechaFin    = 'Ingresa la fecha de fin.';

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

      onSuccess(); 
      onClose();  

    } catch (err) {
      console.error('[Supabase]', err);
      setAlerta({ texto: err.message || 'Error inesperado. Intenta de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ══════════════════════════════════════════════════════
          MODAL ANIDADO: Registrar Nuevo Alumno
          z-index superior al modal principal
          ══════════════════════════════════════════════════════ */}
      {isStudentModalOpen && (
        <div
          className="modal-overlay"
          style={{ zIndex: 200 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-modal-titulo"
          onClick={handleCerrarModalAlumno}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <div className="modal-header-left">
                <UserPlus size={19} />
                <h2 className="modal-title" id="student-modal-titulo">Registrar Nuevo Alumno</h2>
              </div>
              <button
                className="modal-close"
                onClick={handleCerrarModalAlumno}
                disabled={guardandoAlumno}
                aria-label="Cerrar"
              >
                <X size={17} />
              </button>
            </div>

            <div className="modal-body">
              {modalErrors.general && (
                <div className="alerta alerta--error" style={{ marginBottom: '1rem' }}>
                  <XCircle size={16} /><span>{modalErrors.general}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="smod-nombre">
                  Nombre completo <span className="required">*</span>
                </label>
                <input
                  id="smod-nombre"
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

              <div className="form-group" style={{ marginTop: '.875rem' }}>
                <label className="form-label" htmlFor="smod-matricula">
                  Matrícula <span className="required">*</span>
                </label>
                <input
                  id="smod-matricula"
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

              <div className="form-grid" style={{ marginTop: '.875rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="smod-semestre">
                    Semestre <span className="required">*</span>
                  </label>
                  <select
                    id="smod-semestre"
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
                  <label className="form-label" htmlFor="smod-grupo">
                    Grupo <span className="required">*</span>
                  </label>
                  <select
                    id="smod-grupo"
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
              <button type="button" className="btn btn-ghost" onClick={handleCerrarModalAlumno} disabled={guardandoAlumno}>
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
          MODAL PRINCIPAL: Nuevo Justificante
          ══════════════════════════════════════════════════════ */}
      <div
        className="modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="just-modal-titulo"
        onClick={() => { if (!guardando) onClose(); }}
      >
        <div
          className="modal"
          style={{ maxWidth: 640 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Encabezado */}
          <div className="modal-header">
            <div className="modal-header-left">
              <FilePlus2 size={19} />
              <div>
                <h2 className="modal-title" id="just-modal-titulo">Nuevo Justificante</h2>
                <p style={{ fontSize: '.75rem', color: '#64748b', marginTop: '.125rem' }}>
                  Busca al alumno por nombre o matrícula. Si no existe, escríbelo para registrarlo.
                </p>
              </div>
            </div>
            <button
              className="modal-close"
              onClick={onClose}
              disabled={guardando}
              aria-label="Cerrar"
            >
              <X size={17} />
            </button>
          </div>

          {/* Cuerpo — scrollable */}
          <div
            className="modal-body"
            style={{ overflowY: 'auto', maxHeight: '65vh' }}
          >
            {alerta && (
              <div className="alerta alerta--error" style={{ marginBottom: '1rem' }}>
                <XCircle size={18} />
                <span>{alerta.texto}</span>
                <button className="alerta-cerrar" onClick={() => setAlerta(null)} aria-label="Cerrar">×</button>
              </div>
            )}

            <form id="form-justificante" onSubmit={handleSubmit} noValidate>

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
                    onCreateOption={handleAbrirModalAlumno}
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
                  <div className="form-group">
                    <label className="form-label" htmlFor="just-motivo">
                      Motivo <span className="required">*</span>
                    </label>
                    <select
                      id="just-motivo"
                      className={`form-input form-select${errors.motivo ? ' form-input--error' : ''}`}
                      value={form.motivo}
                      onChange={set('motivo')}
                    >
                      <option value="">-- Selecciona un motivo --</option>
                      {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    {errors.motivo && <p className="field-error">{errors.motivo}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="just-fecha-inicio">
                      <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                      Fecha inicio <span className="required">*</span>
                    </label>
                    <input
                      id="just-fecha-inicio"
                      type="date"
                      className={`form-input${errors.fechaInicio ? ' form-input--error' : ''}`}
                      value={form.fechaInicio}
                      onChange={handleFechaInicioChange}
                    />
                    {errors.fechaInicio && <p className="field-error">{errors.fechaInicio}</p>}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="just-fecha-fin">
                      <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                      Fecha fin <span className="required">*</span>
                    </label>
                    <input
                      id="just-fecha-fin"
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
                  <label className="form-label" htmlFor="just-observaciones">Observaciones</label>
                  <textarea
                    id="just-observaciones"
                    className="form-input form-textarea"
                    rows={3}
                    placeholder="Información adicional relevante para el justificante…"
                    value={form.observaciones}
                    onChange={set('observaciones')}
                  />
                </div>
              </fieldset>

            </form>
          </div>

          {/* Pie — siempre visible, fuera del scroll */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-justificante"
              className="btn btn-primary"
              disabled={guardando}
            >
              {guardando
                ? <><Loader2 size={15} className="spin" /> Guardando…</>
                : 'Guardar Justificante'
              }
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
