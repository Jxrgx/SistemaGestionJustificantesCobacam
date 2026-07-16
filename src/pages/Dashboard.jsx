import { useState, useEffect, useCallback } from 'react';
import { FileCheck2, HeartPulse, User, TrendingUp, Loader2, Download } from 'lucide-react';
import ModalNuevoJustificante from '../components/ModalNuevoJustificante';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../services/supabase';

const fmtFecha = (str) => {
  if (!str) return '—';
  return new Date(`${str}T00:00:00`).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const fmtHora = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
};

// ══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [justificantes,             setJustificantes]            = useState([]);
  const [isLoading,                 setIsLoading]                = useState(true);
  const [filtroSemestre,            setFiltroSemestre]           = useState('Todos');
  const [filtroGrupo,               setFiltroGrupo]              = useState('Todos');
  const [isModalJustificanteOpen,   setIsModalJustificanteOpen]  = useState(false);
  const [totalEsteMes,              setTotalEsteMes]             = useState(0);

  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const cargar = useCallback(async () => {
    setIsLoading(true);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const [{ data, error }, { count, error: errorMes }] = await Promise.all([
      supabase
        .from('justificantes')
        .select('*, alumnos(nombre_completo, matricula, semestre, grupo)')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('justificantes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString()),
    ]);

    if (error) {
      console.error('[Supabase] Dashboard:', error.message);
    } else {
      setJustificantes(data ?? []);
    }

    if (errorMes) {
      console.error('[Supabase] Dashboard (mes):', errorMes.message);
    } else {
      setTotalEsteMes(count ?? 0);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setFiltroGrupo('Todos');
  }, [filtroSemestre]);

  const total = justificantes.length;

  const totalSalud = justificantes.filter((j) =>
    /enfermedad|médica/i.test(j.motivo ?? '')
  ).length;
  const totalPersonales = total - totalSalud;

  const gruposDelSemestre = filtroSemestre === 'Todos'
    ? []
    : Array.from({ length: 7 }, (_, i) => `${filtroSemestre}0${i + 1}`);

  const justificantesFiltrados = justificantes.filter((j) => {
    if (filtroSemestre !== 'Todos') {
      const semDB = (j.alumnos?.semestre ?? '').replace('°', '').trim();
      if (semDB !== filtroSemestre) return false;
    }
    if (filtroGrupo !== 'Todos' && j.alumnos?.grupo !== filtroGrupo) return false;
    return true;
  });

  const hayFiltros = filtroSemestre !== 'Todos' || filtroGrupo !== 'Todos';

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

    const fechaLarga = new Date().toLocaleDateString('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const hora = new Date().toLocaleTimeString('es-MX', {
      hour: '2-digit', minute: '2-digit',
    });
    const fechaArchivo = new Date().toISOString().slice(0, 10);

    const contextoFiltro = [
      filtroSemestre !== 'Todos' && `Semestre ${filtroSemestre}`,
      filtroGrupo    !== 'Todos' && `Grupo ${filtroGrupo}`,
    ].filter(Boolean).join(' · ');

    const tituloPDF = contextoFiltro
      ? `Reporte Diario de Justificantes — ${contextoFiltro}`
      : 'Reporte Diario de Justificantes — Plantel 09';

    const totalFiltrado = justificantesFiltrados.length;
    const resumenTotal = contextoFiltro
      ? `Total: ${totalFiltrado} de ${total} registros   ·   Filtro: ${contextoFiltro}`
      : `Total de registros: ${totalFiltrado}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(30, 41, 59);           // #1e293b
    doc.text(tituloPDF, 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);        // #64748b
    doc.text(
      `Fecha: ${fechaLarga}   ·   Generado a las ${hora}   ·   ${resumenTotal}`,
      14, 25,
    );

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);        // #94a3b8
    doc.text(
      'DOCUMENTO CONFIDENCIAL — Las observaciones e información sensible han sido omitidas para proteger la privacidad de los menores.',
      14, 31,
    );

    doc.setDrawColor(226, 232, 240);        // #e2e8f0
    doc.setLineWidth(0.3);
    doc.line(14, 34, doc.internal.pageSize.getWidth() - 14, 34);

    const columnas = [
      { header: 'Matrícula',         dataKey: 'matricula'    },
      { header: 'Nombre del Alumno', dataKey: 'nombre'       },
      { header: 'Semestre',          dataKey: 'semestre'     },
      { header: 'Grupo',             dataKey: 'grupo'        },
      { header: 'Fecha Inicio',      dataKey: 'fechaInicio'  },
      { header: 'Fecha Fin',         dataKey: 'fechaFin'     },
    ];

    const filas = justificantesFiltrados.map((j) => ({
      matricula:   j.alumnos?.matricula       ?? '—',
      nombre:      j.alumnos?.nombre_completo ?? '—',
      semestre:    j.alumnos?.semestre        ?? '—',
      grupo:       j.alumnos?.grupo           ?? '—',
      fechaInicio: fmtFecha(j.fecha_inicio),
      fechaFin:    fmtFecha(j.fecha_fin),
    }));

    autoTable(doc, {
      startY: 38,
      columns: columnas,
      body: filas,
      styles: {
        fontSize: 9,
        cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
        valign: 'middle',
        textColor: [15, 23, 42],            // #0f172a
      },
      headStyles: {
        fillColor:  [30, 41, 59],           // #1e293b (azul institucional)
        textColor:  [255, 255, 255],
        fontStyle:  'bold',
        fontSize:   8.5,
        halign:     'left',
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],         // #f8fafc
      },
      columnStyles: {
        0: { cellWidth: 28 },              // Matrícula
        1: { cellWidth: 72, fontStyle: 'bold' }, // Nombre (más ancho)
        2: { cellWidth: 22, halign: 'center' },  // Semestre
        3: { cellWidth: 20, halign: 'center' },  // Grupo
        4: { cellWidth: 35 },              // Fecha inicio
        5: { cellWidth: 35 },              // Fecha fin
      },
      didDrawPage: ({ pageNumber }) => {
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const total = doc.internal.getNumberOfPages();

        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Página ${pageNumber} de ${total}   ·   Sistema de Gestión de Justificantes — COBACAM`,
          pageW / 2,
          pageH - 7,
          { align: 'center' },
        );
      },
    });

    doc.save(`justificantes_${fechaArchivo}.pdf`);
  };

  return (
    <div className="page">
      <ModalNuevoJustificante
        isOpen={isModalJustificanteOpen}
        onClose={() => setIsModalJustificanteOpen(false)}
        onSuccess={cargar}
      />

      {/* Encabezado */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Justificantes del Día</h1>
          <p className="page-subtitle">{today}</p>
        </div>

        <div className="page-header-actions">
          {/* Filtros */}
          <div className="filter-bar">
            <select
              className={`filter-select${filtroSemestre !== 'Todos' ? ' filter-select--active' : ''}`}
              value={filtroSemestre}
              onChange={(e) => setFiltroSemestre(e.target.value)}
              title="Filtrar por semestre"
            >
              <option value="Todos">Todos los semestres</option>
              {['1','2','3','4','5','6'].map((s) => (
                <option key={s} value={s}>Semestre {s}</option>
              ))}
            </select>

            <select
              className={`filter-select${filtroGrupo !== 'Todos' ? ' filter-select--active' : ''}`}
              value={filtroGrupo}
              onChange={(e) => setFiltroGrupo(e.target.value)}
              disabled={filtroSemestre === 'Todos'}
              title={filtroSemestre === 'Todos' ? 'Selecciona primero un semestre' : 'Filtrar por grupo'}
            >
              <option value="Todos">
                {filtroSemestre === 'Todos'
                  ? 'Todos los grupos'
                  : `Todos los grupos — Sem. ${filtroSemestre}`}
              </option>
              {gruposDelSemestre.map((g) => (
                <option key={g} value={g}>Grupo {g}</option>
              ))}
            </select>

            {hayFiltros && (
              <button
                className="filter-clear"
                onClick={() => { setFiltroSemestre('Todos'); setFiltroGrupo('Todos'); }}
                title="Limpiar filtros"
              >
                ✕ Limpiar
              </button>
            )}
          </div>

          <button
            className="btn btn-secondary"
            onClick={exportarPDF}
            disabled={isLoading || justificantesFiltrados.length === 0}
            title={justificantesFiltrados.length === 0 ? 'Sin registros para exportar' : 'Descargar reporte en PDF'}
          >
            <Download size={16} />
            Descargar Reporte (PDF)
          </button>

          <button
            className="btn btn-primary"
            onClick={() => setIsModalJustificanteOpen(true)}
          >
            + Nuevo Justificante
          </button>
        </div>
      </div>

      {/* ── Tarjetas de métricas ── */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ '--card-accent': 'var(--brand)' }}>
          <div className="metric-icon" style={{ backgroundColor: 'var(--brand-tint)', color: 'var(--brand)' }}>
            <FileCheck2 size={22} strokeWidth={1.75} />
          </div>
          <div>
            <p className="metric-value">
              {isLoading
                ? <Loader2 size={18} className="spin" style={{ color: '#94a3b8' }} />
                : total
              }
            </p>
            <p className="metric-label">Emitidos hoy</p>
          </div>
        </div>

        {[
          { label: 'Motivo de Salud',    color: '#0ea5e9', Icon: HeartPulse, value: totalSalud      },
          { label: 'Motivos Personales', color: '#8b5cf6', Icon: User,       value: totalPersonales  },
          { label: 'Este mes',           color: '#10b981', Icon: TrendingUp, value: totalEsteMes     },
        ].map(({ label, color, Icon, value }) => (
          <div key={label} className="metric-card" style={{ '--card-accent': color }}>
            <div className="metric-icon" style={{ backgroundColor: `${color}18`, color }}>
              <Icon size={22} strokeWidth={1.75} />
            </div>
            <div>
              <p className="metric-value">
                {isLoading
                  ? <Loader2 size={18} className="spin" style={{ color: '#94a3b8' }} />
                  : value
                }
              </p>
              <p className="metric-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabla de registros ── */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Registro de hoy
            {hayFiltros && (
              <span className="card-title-filter">
                {[
                  filtroSemestre !== 'Todos' && `Sem. ${filtroSemestre}`,
                  filtroGrupo    !== 'Todos' && `Gr. ${filtroGrupo}`,
                ].filter(Boolean).join(' · ')}
              </span>
            )}
          </h2>
          {!isLoading && (
            <span className="badge">
              {justificantesFiltrados.length}
              {hayFiltros && ` de ${total}`}
              {' '}{justificantesFiltrados.length === 1 ? 'justificante' : 'justificantes'}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="empty-state">
            <Loader2 size={32} className="spin empty-state-icon" style={{ color: '#94a3b8' }} />
            <p className="empty-state-text">Cargando registros…</p>
          </div>
        )}

        {!isLoading && total === 0 && (
          <div className="empty-state">
            <FileCheck2 size={40} strokeWidth={1.25} className="empty-state-icon" />
            <p className="empty-state-text">No hay justificantes registrados hoy.</p>
            <p className="empty-state-sub">Comienza creando el primero con el botón de arriba.</p>
          </div>
        )}

        {!isLoading && total > 0 && justificantesFiltrados.length === 0 && (
          <div className="empty-state">
            <FileCheck2 size={40} strokeWidth={1.25} className="empty-state-icon" />
            <p className="empty-state-text">Sin resultados para este filtro.</p>
            <p className="empty-state-sub">
              No hay justificantes de{' '}
              {[
                filtroSemestre !== 'Todos' && `Semestre ${filtroSemestre}`,
                filtroGrupo    !== 'Todos' && `Grupo ${filtroGrupo}`,
              ].filter(Boolean).join(', ')} registrados hoy.
            </p>
          </div>
        )}

        {!isLoading && justificantesFiltrados.length > 0 && (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alumno</th>
                  <th>Motivo / Observaciones</th>
                  <th>Fecha inicio</th>
                  <th>Fecha fin</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {justificantesFiltrados.map((j) => (
                  <tr key={j.id}>
                    <td>
                      <span className="table-name">
                        {j.alumnos?.nombre_completo ?? '—'}
                      </span>
                      {(j.alumnos?.semestre || j.alumnos?.grupo) && (
                        <span className="table-sub">
                          {[
                            j.alumnos.semestre && `Sem. ${j.alumnos.semestre}`,
                            j.alumnos.grupo    && `Gr. ${j.alumnos.grupo}`,
                          ].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="motivo-chip">{j.motivo}</span>
                      {j.observaciones && (
                        <p className="table-sub" style={{ marginTop: '.375rem', lineHeight: 1.45 }}>
                          {j.observaciones}
                        </p>
                      )}
                    </td>
                    <td>{fmtFecha(j.fecha_inicio)}</td>
                    <td>{fmtFecha(j.fecha_fin)}</td>
                    <td className="table-meta">{fmtHora(j.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
