import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function RiskTrendChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-text-secondary text-sm font-medium">
        Calculando distribución de riesgos...
      </div>
    );
  }

  // Mapear nombres a formato legible en español
  const labelsMap = {
    bajo: 'Riesgo Bajo',
    medio: 'Riesgo Medio',
    alto: 'Riesgo Alto',
    critico: 'Riesgo Crítico'
  };

  const chartData = data.map(item => ({
    ...item,
    name: labelsMap[item.name] || item.name
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={4}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#FFFFFF', 
              borderColor: '#E0EAE0', 
              borderRadius: '12px', 
              fontSize: '12px',
              fontFamily: 'Inter'
            }} 
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-xs text-text-secondary font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
