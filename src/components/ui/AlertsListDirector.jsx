import React from 'react';

export default function AlertsListDirector({ alerts }) {
  // alerts: [{ type: 'critical', count: 28, text: 'alertas críticas sin atender', context: 'Ingeniería' }, ...]

  const getAlertStyles = (type) => {
    switch (type) {
      case 'critical': return 'text-danger bg-danger/10 border-danger/20';
      case 'warning': return 'text-warning-dark bg-warning/10 border-warning/20';
      case 'success': return 'text-success bg-success/10 border-success/20';
      default: return 'text-text-secondary bg-surface border-border';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'success': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`p-4 rounded-xl border flex items-center gap-3 shadow-sm ${getAlertStyles(alert.type)}`}>
          <div className="text-lg">{getAlertIcon(alert.type)}</div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {alert.count} {alert.text}
            </span>
            {alert.context && (
              <span className="text-xs opacity-80 font-medium">
                — {alert.context}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
