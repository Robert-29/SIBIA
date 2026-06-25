import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

const COLORS = {
  bajo: '#34d399',
  medio: '#fbbf24',
  alto: '#f97316',
  critico: '#ef4444',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((sum, p) => sum + (p.value || 0), 0);
  return (
    <div style={{
      background: 'rgba(15,23,42,0.97)',
      border: '1px solid rgba(99,102,241,0.3)',
      borderRadius: '10px',
      padding: '12px 16px',
      fontSize: '13px',
      color: '#e2e8f0',
      minWidth: 190,
    }}>
      <p style={{ fontWeight: 700, marginBottom: 8, color: '#a5b4fc' }}>{label}</p>
      <p style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11 }}>Total: {total} alumnos</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.fill, margin: '3px 0' }}>
          <span style={{ textTransform: 'capitalize' }}>{entry.name}: </span>
          <strong>{entry.value}</strong>
          <span style={{ color: '#64748b', marginLeft: 4, fontSize: 11 }}>
            ({total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%)
          </span>
        </p>
      ))}
    </div>
  );
};

export default function StackedRiskBySemesterChart({ data = [] }) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-64 text-text-secondary text-sm">
      Sin datos por semestre
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#cbd5e1', textTransform: 'capitalize' }}>{value}</span>}
        />
        <Bar dataKey="bajo" name="bajo" stackId="a" fill={COLORS.bajo} radius={[0, 0, 0, 0]} />
        <Bar dataKey="medio" name="medio" stackId="a" fill={COLORS.medio} radius={[0, 0, 0, 0]} />
        <Bar dataKey="alto" name="alto" stackId="a" fill={COLORS.alto} radius={[0, 0, 0, 0]} />
        <Bar dataKey="critico" name="crítico" stackId="a" fill={COLORS.critico} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
