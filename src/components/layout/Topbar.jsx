import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext.jsx';
import { User, ShieldAlert } from 'lucide-react';

export default function Topbar() {
  const { user, isDemo } = useContext(AuthContext);

  return (
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <h2 className="text-text-primary font-display font-semibold text-lg">
          Panel Institucional SIBIA
        </h2>

      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold text-text-primary">{user?.nombre || 'Usuario'}</p>
          <p className="text-xs text-text-secondary">{user?.email}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary-dark border border-primary/20">
          <User size={18} />
        </div>
      </div>
    </header>
  );
}
