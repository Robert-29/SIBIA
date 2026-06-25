import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function CarrerasTable({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: 'riesgo', direction: 'desc' });

  const sortedData = [...data].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronDown size={14} className="text-transparent group-hover:text-border" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-primary-dark" /> : <ChevronDown size={14} className="text-primary-dark" />;
  };

  const renderRiesgoBadge = (riesgo) => {
    if (riesgo >= 15) return <span className="font-semibold text-danger">{riesgo}% 🔴</span>;
    if (riesgo >= 8) return <span className="font-semibold text-warning-dark">{riesgo}% 🟡</span>;
    return <span className="font-semibold text-success">{riesgo}% 🟢</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-text-secondary font-semibold">
            <th className="pb-3 cursor-pointer group" onClick={() => requestSort('name')}>
              <div className="flex items-center gap-1">Carrera {getSortIcon('name')}</div>
            </th>
            <th className="pb-3 cursor-pointer group" onClick={() => requestSort('alumnos')}>
              <div className="flex items-center gap-1">Alumnos {getSortIcon('alumnos')}</div>
            </th>
            <th className="pb-3 cursor-pointer group" onClick={() => requestSort('riesgo')}>
              <div className="flex items-center gap-1">Riesgo Alto {getSortIcon('riesgo')}</div>
            </th>
            <th className="pb-3 cursor-pointer group" onClick={() => requestSort('promedio')}>
              <div className="flex items-center gap-1">Promedio {getSortIcon('promedio')}</div>
            </th>
            <th className="pb-3 cursor-pointer group" onClick={() => requestSort('desercion')}>
              <div className="flex items-center gap-1">Deserción {getSortIcon('desercion')}</div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sortedData.map((carrera, idx) => (
            <tr key={idx} className="hover:bg-primary-light/30 transition-colors cursor-pointer group">
              <td className="py-3.5 font-medium text-text-primary group-hover:text-primary-dark transition-colors">
                {carrera.name}
              </td>
              <td className="py-3.5 font-mono-data text-text-secondary">
                {carrera.alumnos}
              </td>
              <td className="py-3.5 font-mono-data">
                {renderRiesgoBadge(carrera.riesgo)}
              </td>
              <td className="py-3.5 font-mono-data font-medium text-text-primary">
                {carrera.promedio}
              </td>
              <td className="py-3.5 font-mono-data text-text-secondary">
                {carrera.desercion}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
