import React from 'react';

export default function CriticalSubjectsList({ subjects }) {
  // subjects: [{ id: 1, name: 'Cálculo Diferencial', reprobacion: 34, riesgo: 89 }, ...]

  return (
    <div className="space-y-4">
      {subjects.map((subj, index) => (
        <div 
          key={subj.id || index} 
          className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-danger/5 transition-all bg-surface"
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-danger/10 text-danger font-bold text-xs">
              {index + 1}
            </span>
            <div>
              <h4 className="text-sm font-semibold text-text-primary">{subj.name}</h4>
              <p className="text-xs text-text-secondary mt-0.5">
                <span className="text-danger font-medium">{subj.reprobacion}% reprobación</span>
                <span className="mx-1.5 opacity-50">|</span>
                {subj.riesgo} alumnos en riesgo
              </p>
            </div>
          </div>
          <div className="w-12 h-1 bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-danger rounded-full"
              style={{ width: `${Math.min(subj.reprobacion, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
