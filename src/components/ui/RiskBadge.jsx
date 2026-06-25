import React from 'react';

export default function RiskBadge({ nivel = 'bajo', size = 'md' }) {
  const getStyles = () => {
    const key = nivel?.toLowerCase() || 'bajo';
    switch (key) {
      case 'bajo':
        return {
          bg: 'bg-success/10 text-success border-success/20',
          dot: 'bg-success',
          label: 'Riesgo Bajo'
        };
      case 'medio':
        return {
          bg: 'bg-warning/10 text-warning border-warning/20',
          dot: 'bg-warning',
          label: 'Riesgo Medio'
        };
      case 'alto':
        return {
          bg: 'bg-danger/10 text-danger border-danger/20',
          dot: 'bg-danger',
          label: 'Riesgo Alto'
        };
      case 'critico':
        return {
          bg: 'bg-red-950/20 text-red-500 border-danger/30 animate-pulse',
          dot: 'bg-danger shadow-[0_0_8px_rgba(239,83,80,0.5)]',
          label: 'Riesgo Crítico'
        };
      default:
        return {
          bg: 'bg-primary-light text-text-secondary border-border',
          dot: 'bg-primary',
          label: nivel
        };
    }
  };

  const styles = getStyles();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded-lg gap-1 border',
    md: 'px-3 py-1 text-sm rounded-xl gap-1.5 border',
    lg: 'px-4 py-2 text-base rounded-2xl gap-2 border font-semibold'
  };

  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <span className={`inline-flex items-center font-medium ${sizeClasses[size]} ${styles.bg}`}>
      <span className={`rounded-full ${dotSize[size]} ${styles.dot}`} />
      {styles.label}
    </span>
  );
}
