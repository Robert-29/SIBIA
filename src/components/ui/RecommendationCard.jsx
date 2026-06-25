import React from 'react';
import { BookOpen, Activity, Heart, ShieldAlert, BadgeInfo } from 'lucide-react';

export default function RecommendationCard({ tipo, descripcion, prioridad }) {
  const getIcon = () => {
    switch (tipo?.toLowerCase()) {
      case 'tutoria':
      case 'academico':
        return <BookOpen size={18} className="text-text-primary" />;
      case 'deporte':
        return <Activity size={18} className="text-text-primary" />;
      case 'psicologia':
        return <Heart size={18} className="text-text-primary" />;
      case 'becas':
        return <BadgeInfo size={18} className="text-text-primary" />;
      default:
        return <ShieldAlert size={18} className="text-text-primary" />;
    }
  };

  const getPriorityBadge = () => {
    const key = prioridad?.toLowerCase() || 'baja';
    switch (key) {
      case 'alta':
        return 'bg-danger/10 text-danger border-danger/20';
      case 'media':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'baja':
      default:
        return 'bg-success/10 text-success border-success/20';
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex gap-3 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0 border border-primary/10">
        {getIcon()}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            {tipo || 'Intervención'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getPriorityBadge()}`}>
            Prioridad {prioridad}
          </span>
        </div>
        <p className="text-sm text-text-primary font-medium leading-relaxed">
          {descripcion}
        </p>
      </div>
    </div>
  );
}
