import { useEffect } from 'react';
import { FileCheck2, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../services/supabase';

const metrics = [
  { label: 'Emitidos hoy',    value: 0, icon: FileCheck2,  color: '#3b82f6' },
  { label: 'Pendientes',      value: 0, icon: Clock,        color: '#f59e0b' },
  { label: 'Con incidencia',  value: 0, icon: AlertCircle,  color: '#ef4444' },
  { label: 'Este mes',        value: 0, icon: TrendingUp,   color: '#10b981' },
];

export default function Dashboard() {
  const today = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // ── Verificación de conexión con Supabase ──────────────────
  useEffect(() => {
    async function verificarConexion() {
      console.log('[Supabase] Cliente inicializado:', supabase);

      const { data, error } = await supabase
        .from('justificantes')
        .select('id')
        .limit(1);

      if (error) {
        // Antes de tener credenciales reales el error esperado es
        // "Invalid API key" o similar — es normal en esta etapa.
        console.warn('[Supabase] ⚠️  Error en consulta de prueba:', error.message);
      } else {
        console.log('[Supabase] ✅ Conexión exitosa. Datos de prueba:', data);
      }
    }

    verificarConexion();
  }, []);

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Justificantes del Día</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <a href="/nuevo-justificante" className="btn btn-primary">
          <span>+ Nuevo Justificante</span>
        </a>
      </div>

      {/* Métricas */}
      <div className="metrics-grid">
        {metrics.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: `${color}18`, color }}>
              <Icon size={22} strokeWidth={1.75} />
            </div>
            <div>
              <p className="metric-value">{value}</p>
              <p className="metric-label">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla placeholder */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Registro de hoy</h2>
        </div>
        <div className="empty-state">
          <FileCheck2 size={40} strokeWidth={1.25} className="empty-state-icon" />
          <p className="empty-state-text">No hay justificantes registrados hoy.</p>
          <p className="empty-state-sub">Comienza creando el primero con el botón de arriba.</p>
        </div>
      </div>
    </div>
  );
}
