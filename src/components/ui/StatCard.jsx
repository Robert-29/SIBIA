import React from 'react';

export default function StatCard({ title, value, icon, trend, trendColor = 'neutral' }) {
  const getTrendColor = () => {
    if (trendColor === 'good') return 'text-success bg-success/10 border-success/15';
    if (trendColor === 'bad') return 'text-danger bg-danger/10 border-danger/15';
    return 'text-text-secondary bg-primary-light border-border';
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm space-y-4 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </span>
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center border border-primary/10 text-primary-dark">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="font-mono-data text-3xl font-bold text-text-primary tracking-tight">
          {value}
        </h3>
        {trend && (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getTrendColor()}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
