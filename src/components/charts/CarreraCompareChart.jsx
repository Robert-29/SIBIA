import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function CarreraCompareChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-text-secondary text-sm font-medium">
        Calculando comparativa de rendimiento...
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E0EAE0" vertical={false} />
          <XAxis 
            dataKey="carrera" 
            tick={{ fill: '#5A7260', fontSize: 11 }} 
            axisLine={{ stroke: '#E0EAE0' }} 
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#5A7260', fontSize: 11 }} 
            axisLine={{ stroke: '#E0EAE0' }} 
            tickLine={false}
            domain={[0, 10]}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#FFFFFF', 
              borderColor: '#E0EAE0', 
              borderRadius: '12px', 
              fontSize: '12px',
              fontFamily: 'Inter'
            }} 
          />
          <Bar 
            name="Promedio" 
            dataKey="promedio" 
            fill="#7BC67E" 
            radius={[6, 6, 0, 0]} 
            maxBarSize={50}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
