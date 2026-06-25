import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area
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
      minWidth: 200,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: '#a5b4fc' }}>{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color, margin: '3px 0' }}>
          <span>{entry.name}: </span>
          <strong>
            {entry.name === 'Alumnos' ? entry.value : `${entry.value}${entry.name === 'Promedio' ? '' : '%'}`}
          </strong>
        </p>
      ))}
    </div>
  );
};

export default function GeneracionesChart({ data = [] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
      Sin datos de generaciones
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="gradTitulacion" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
        <XAxis
          dataKey="generacion"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => `${v}%`}
          domain={[0, 100]}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[7, 9]}
          tickFormatter={v => v.toFixed(1)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#94a3b8', paddingTop: 12 }}
          formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
        />
        <Bar yAxisId="left" dataKey="titulacion" name="% Titulación" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.85} />
        <Bar yAxisId="left" dataKey="desercion" name="% Deserción" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.75} />
        <Bar yAxisId="left" dataKey="riesgo" name="% Riesgo Alto" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.75} />
        <Area
          yAxisId="right"
          type="monotone"
          dataKey="promedio"
          name="Promedio"
          stroke="#34d399"
          strokeWidth={2.5}
          fill="url(#gradTitulacion)"
          dot={{ fill: '#34d399', r: 4, strokeWidth: 0 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
