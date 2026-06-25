import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function TeachersPerformanceTable({ teachers }) {
  // teachers: [{ name: 'Dr. Ramírez', groups: 3, passRate: 91, riskAlums: 3, riskPct: 4, trend: 'up' }, ...]

  const renderTrendIcon = (trend) => {
    if (trend === 'up') return <ArrowUp size={16} className="text-success" />;
    if (trend === 'down') return <ArrowDown size={16} className="text-danger" />;
    return <Minus size={16} className="text-text-secondary" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary font-semibold">
            <th className="pb-3">Profesor</th>
            <th className="pb-3 text-center">Grupos</th>
            <th className="pb-3 text-center">% Aprobación</th>
            <th className="pb-3 text-center">Alumnos en riesgo</th>
            <th className="pb-3 text-center">Tendencia</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {teachers.map((teacher, idx) => (
            <tr key={idx} className="hover:bg-primary-light/20 transition-colors">
              <td className="py-3 font-medium text-text-primary">
                {teacher.name}
              </td>
              <td className="py-3 text-center font-mono-data text-text-secondary">
                {teacher.groups}
              </td>
              <td className="py-3 text-center font-mono-data">
                <span className={`font-semibold ${teacher.passRate < 70 ? 'text-danger' : teacher.passRate > 85 ? 'text-success' : 'text-text-primary'}`}>
                  {teacher.passRate}%
                </span>
              </td>
              <td className="py-3 text-center font-mono-data text-text-secondary">
                {teacher.riskAlums} ({teacher.riskPct}%)
              </td>
              <td className="py-3 flex justify-center">
                <div className="flex items-center gap-1">
                  {renderTrendIcon(teacher.trend)}
                  {teacher.trend === 'down' && <span className="text-xs text-danger ml-1">🔴</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
