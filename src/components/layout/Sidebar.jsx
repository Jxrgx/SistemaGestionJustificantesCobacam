import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FilePlus2, Users, GraduationCap } from 'lucide-react';

const navItems = [
  { to: '/',                label: 'Inicio',            icon: LayoutDashboard },
  { to: '/nuevo-justificante', label: 'Nuevo Justificante', icon: FilePlus2 },
  { to: '/alumnos',         label: 'Alumnos',           icon: Users },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <GraduationCap size={28} strokeWidth={1.75} />
        <span>COBACAM</span>
      </div>

      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Menú principal</p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="sidebar-footer-text">Sistema de Gestión</p>
        <p className="sidebar-footer-sub">Recepción · v1.0</p>
      </div>
    </aside>
  );
}
