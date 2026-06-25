import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useRol } from '../../hooks/useRol.js';

export default function AlertCard({ alert, onAcknowledge, onClose, showActions = true }) {
  const { esAlumno } = useRol();

  const getStatusStyle = () => {
    switch (alert?.estado) {
      case 'activa':
        return 'border-danger/30 bg-danger/5 text-danger';
      case 'atendida':
        return 'border-warning/30 bg-warning/5 text-warning';
      case 'cerrada':
      default:
        return 'border-success/30 bg-success/5 text-success';
    }
  };

  const getStatusLabel = () => {
    switch (alert?.estado) {
      case 'activa': return 'Activa';
      case 'atendida': return 'Atendiendo';
      case 'cerrada': return 'Cerrada';
      default: return alert?.estado;
    }
  };

  const formattedDate = alert?.created_at 
    ? new Date(alert.created_at).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-3 transition-all duration-200 bg-surface shadow-sm ${alert?.estado === 'activa' ? 'border-danger/35 hover:shadow-md' : 'border-border'}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className={alert?.estado === 'activa' ? 'text-danger' : 'text-text-secondary'} />
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Alerta {alert?.tipo || 'General'}
          </span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusStyle()}`}>
          {getStatusLabel()}
        </span>
      </div>

      <p className="text-sm text-text-primary font-medium leading-relaxed">
        {alert?.descripcion}
      </p>

      {alert?.alumno && (
        <div className="bg-primary-light/40 rounded-lg p-2.5 flex items-center justify-between text-xs border border-border">
          <div>
            <p className="font-semibold text-text-primary">{alert.alumno.usuario?.nombre || 'Estudiante'}</p>
            <p className="text-text-secondary">Matrícula: {alert.alumno.matricula} | {alert.alumno.carrera?.nombre || 'Carrera'}</p>
          </div>
          <span className="text-text-muted font-mono-data shrink-0">{formattedDate}</span>
        </div>
      )}

      {showActions && !esAlumno && alert?.estado !== 'cerrada' && (
        <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
          {alert.estado === 'activa' && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-warning/10 text-warning hover:bg-warning/20 border border-warning/20 cursor-pointer transition-all"
            >
              Atender
            </button>
          )}
          {onClose && (
            <button
              onClick={() => onClose(alert.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success hover:bg-success/20 border border-success/20 cursor-pointer transition-all"
            >
              Cerrar Alerta
            </button>
          )}
        </div>
      )}
    </div>
  );
}
