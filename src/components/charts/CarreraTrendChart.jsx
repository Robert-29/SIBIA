import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.97)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#e2e8f0',
      minWidth: 180,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: '#a5b4fc' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.stroke, margin: '3px 0' }}>
          {entry.name}: <strong>
            {entry.name === 'Promedio' ? entry.value.toFixed(2) : `${entry.value.toFixed(1)}%`}
          </strong>
        </p>
      ))}
    </div>
  );
};

export default function CarreraTrendChart({ data = [] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-52 text-text-secondary text-sm">
      Sin datos históricos
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[7, 9.5]}
          tickFormatter={v => v.toFixed(1)}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="promedio"
          name="Promedio"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="riesgo"
          name="% Riesgo"
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="5 3"
          dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="asistencia"
          name="% Asistencia"
          stroke="#34d399"
          strokeWidth={2}
          dot={{ fill: '#34d399', r: 3, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
