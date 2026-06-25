import React from 'react';
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';

export default function RiskBar({ nombre, contribucion, valor, umbral, tendencia }) {
  // Determinar color de la barra según la contribución al riesgo
  const getProgressColor = () => {
    if (contribucion >= 25) return 'bg-danger';
    if (contribucion >= 15) return 'bg-warning';
    return 'bg-primary-dark';
  };

  const getTrendIcon = () => {
    if (tendencia === 'subiendo') {
      return <ArrowUp size={14} className="text-danger inline ml-1" />;
    }
    if (tendencia === 'bajando') {
      return <ArrowDown size={14} className="text-success inline ml-1" />;
    }
    if (tendencia === 'estable') {
      return <ArrowRight size={14} className="text-text-muted inline ml-1" />;
    }
    return null;
  };

  const formatValor = (val) => {
    if (typeof val === 'boolean') {
      return val ? 'Sí' : 'No';
    }
    if (val === null || val === undefined) {
      return 'N/A';
    }
    return val;
  };

  return (
    <div className="space-y-1.5 py-3 border-b border-border last:border-b-0">
      <div className="flex justify-between items-center text-sm">
        <span className="font-semibold text-text-primary flex items-center">
          {nombre}
          {getTrendIcon()}
        </span>
        <span className="font-mono-data text-xs text-text-secondary">
          Peso: <strong className="text-text-primary font-bold">{contribucion}%</strong>
        </span>
      </div>

      <div className="w-full bg-primary-light rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${getProgressColor()}`}
          style={{ width: `${Math.min(100, Math.max(0, contribucion))}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-xs text-text-secondary">
        <span>
          Valor actual: <strong className="text-text-primary">{formatValor(valor)}</strong>
        </span>
        {umbral !== undefined && (
          <span>
            Límite sugerido: <strong className="text-text-primary">{formatValor(umbral)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
