import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useRol } from '../../hooks/useRol.js';
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Database, 
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const { esAdmin, esDirector, esJefeCarrera, esAlumno, rol } = useRol();

  const getSubtitulo = () => {
    if (esJefeCarrera && user?.carreras_asignadas?.length > 0) {
      return user.carreras_asignadas.map(c => c.nombre).join(' & ');
    }
    return rol;
  };

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, show: true },
    { 
      name: 'Alumnos', 
      path: '/alumnos', 
      icon: Users, 
      show: !esAlumno 
    },
    { 
      name: 'Alertas', 
      path: '/alertas', 
      icon: AlertTriangle, 
      show: !esAlumno 
    },
    { 
      name: 'Administración', 
      path: '/admin', 
      icon: Database, 
      show: esAdmin 
    }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen sticky top-0 flex flex-col justify-between p-4 transition-all duration-200">
      <div>
        <div className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-surface font-semibold text-xl shadow-sm">
            S
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight tracking-tight text-text-primary">SIBIA</h1>
            <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{getSubtitulo()}</span>
          </div>
        </div>

        <nav className="space-y-1">
          {links.filter(link => link.show).map(link => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active 
                    ? 'bg-primary-light text-primary-dark font-semibold' 
                    : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                }`}
              >
                <Icon size={18} className={active ? 'text-primary-dark' : 'text-text-secondary'} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-border">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-red-50 hover:text-red-700 transition-all duration-200 cursor-pointer"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
