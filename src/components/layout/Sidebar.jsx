import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, GraduationCap, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabase';

const navItems = [
  { to: '/',        label: 'Inicio',  icon: LayoutDashboard },
  { to: '/alumnos', label: 'Alumnos', icon: Users           },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

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
        <button className="sidebar-logout" onClick={handleSignOut}>
          <LogOut size={15} strokeWidth={1.75} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
