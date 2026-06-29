import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import StatCard from '../ui/StatCard.jsx';
import {
  BookOpen, Users, TrendingUp, TrendingDown, Minus,
  AlertTriangle, BarChart2, Eye, X, Loader2, RefreshCw,
  GraduationCap, Clock, CheckCircle, Activity, Target, Zap,
  ArrowRight, Info, Pencil, Save, UserCheck, ChevronRight,
  BookMarked, LayoutGrid, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line,
} from 'recharts';

const RISK_STYLES = {
  critico: { label: 'Crítico', cls: 'text-red-700 bg-red-100 border-red-300', bar: 'bg-gradient-to-r from-red-500 to-red-400' },
  alto:    { label: 'Alto',    cls: 'text-orange-700 bg-orange-100 border-orange-300', bar: 'bg-gradient-to-r from-orange-500 to-amber-400' },
  medio:   { label: 'Medio',   cls: 'text-amber-700 bg-amber-100 border-amber-300', bar: 'bg-gradient-to-r from-amber-500 to-yellow-400' },
  bajo:    { label: 'Bajo',    cls: 'text-emerald-700 bg-emerald-100 border-emerald-300', bar: 'bg-gradient-to-r from-emerald-500 to-teal-400' },
};

const TREND_ICONS = {
  mejora:    <TrendingUp size={13} className="text-emerald-600" />,
  caida:     <TrendingDown size={13} className="text-red-500" />,
  estable:   <Minus size={13} className="text-gray-400" />,
  sin_datos: <Minus size={13} className="text-gray-300" />,
};

const TREND_CLS = {
  mejora:    'text-emerald-700 bg-emerald-50 border-emerald-200',
  caida:     'text-red-600 bg-red-50 border-red-200',
  estable:   'text-gray-600 bg-gray-100 border-gray-200',
  sin_datos: 'text-gray-400 bg-gray-50 border-gray-200',
};

const calColor = (v) => {
  if (v === null || v === undefined) return 'text-gray-400';
  if (v >= 9) return 'text-emerald-600';
  if (v >= 7) return 'text-teal-600';
  if (v >= 6) return 'text-amber-600';
  return 'text-red-600';
};

const BAR_TOOLTIP_STYLE = {
  contentStyle: { background: '#fff', border: '1px solid #E0EAE0', borderRadius: '8px', fontSize: '12px', color: '#1C2B1E' },
  labelStyle: { color: '#5A7260' },
  itemStyle: { color: '#1C2B1E' },
};

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Loader2 size={40} className="text-primary-dark animate-spin" />
      <p className="text-text-secondary text-sm">Cargando datos del dashboard...</p>
    </div>
  );
}

function ErrorState({ msg, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <AlertTriangle size={36} className="text-danger" />
      <p className="text-danger text-sm">{msg}</p>
      <button onClick={onRetry} className="px-4 py-2 bg-primary-dark hover:bg-primary text-white rounded-lg text-sm flex items-center gap-2">
        <RefreshCw size={14} /> Reintentar
      </button>
    </div>
  );
}

function RadiografiSection({ grupoId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!grupoId) return;
    setLoading(true);
    api.get(`/profesor/grupo/${grupoId}/radiografia`)
      .then(r => setData(r.data || r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [grupoId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-dark" /></div>;
  if (!data) return <p className="text-text-secondary text-sm text-center py-4">Sin datos para este grupo.</p>;

  const { histograma, mapa_calor, insight } = data;

  return (
    <div className="space-y-5">
      {insight && (
        <div className="bg-primary-light border border-primary/30 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <Zap size={16} className="text-primary-dark mt-0.5 shrink-0" />
            <div>
              <p className="text-primary-dark text-sm font-semibold mb-1">Análisis del Grupo — {insight.materia}</p>
              <p className="text-text-secondary text-sm leading-relaxed">{insight.texto}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white/70 rounded-lg p-3 text-center border border-border">
              <p className="text-xs text-text-secondary mb-1">Prom. Parcial 1</p>
              <p className={`text-xl font-bold ${calColor(insight.promedio_p1)}`}>{insight.promedio_p1?.toFixed(1)}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center border border-border">
              <p className="text-xs text-text-secondary mb-1">Prom. Parcial 2</p>
              <p className={`text-xl font-bold ${calColor(insight.promedio_p2)}`}>{insight.promedio_p2?.toFixed(1)}</p>
            </div>
            <div className="bg-white/70 rounded-lg p-3 text-center border border-border">
              <p className="text-xs text-text-secondary mb-1">Variación</p>
              <p className={`text-xl font-bold flex items-center justify-center gap-1 ${insight.tendencia_general === 'caida' ? 'text-red-600' : 'text-emerald-600'}`}>
                {insight.tendencia_general === 'caida' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                {insight.variacion_pct}%
              </p>
            </div>
          </div>
          {insight.sugerencias?.length > 0 && (
            <div className="mt-3 space-y-1.5 pt-3 border-t border-primary/20">
              {insight.sugerencias.map((s, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                  <ArrowRight size={12} className="text-primary-dark mt-0.5 shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {histograma?.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h4 className="text-sm font-semibold text-text-primary mb-4">Distribución de Calificaciones por Parcial</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={histograma} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0EAE0" />
              <XAxis dataKey="rango" tick={{ fill: '#5A7260', fontSize: 11 }} />
              <YAxis tick={{ fill: '#5A7260', fontSize: 11 }} />
              <Tooltip {...BAR_TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#5A7260' }} />
              <Bar dataKey="parcial1" name="Parcial 1" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="parcial2" name="Parcial 2" fill="#42A5F5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {mapa_calor?.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-bg/50">
            <h4 className="text-sm font-semibold text-text-primary">Mapa de Tendencias</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg border-b border-border">
                  <th className="text-left py-2.5 px-4 text-text-secondary font-semibold text-xs uppercase tracking-wide">Alumno</th>
                  <th className="text-center py-2.5 px-3 text-text-secondary font-semibold text-xs">P1</th>
                  <th className="text-center py-2.5 px-3 text-text-secondary font-semibold text-xs">P2</th>
                  <th className="text-center py-2.5 px-3 text-text-secondary font-semibold text-xs">Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {mapa_calor.map((a, i) => (
                  <tr key={a.alumno_id} className={`border-b border-border/60 ${i % 2 === 0 ? 'bg-surface' : 'bg-bg/50'} hover:bg-primary-light/30 transition-colors`}>
                    <td className="py-2.5 px-4 text-text-primary font-medium truncate max-w-[180px]">{a.nombre}</td>
                    <td className={`py-2.5 px-3 text-center font-mono font-semibold ${calColor(a.parcial1)}`}>{a.parcial1 !== null ? a.parcial1.toFixed(1) : '—'}</td>
                    <td className={`py-2.5 px-3 text-center font-mono font-semibold ${calColor(a.parcial2)}`}>{a.parcial2 !== null ? a.parcial2.toFixed(1) : '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${TREND_CLS[a.tendencia]}`}>
                        {TREND_ICONS[a.tendencia]}
                        {a.tendencia === 'mejora' ? 'Mejora' : a.tendencia === 'caida' ? 'Caída' : a.tendencia === 'estable' ? 'Estable' : 'Sin datos'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function AlumnosRiesgoSection({ grupoId, onVerDetalle }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!grupoId) return;
    setLoading(true);
    api.get(`/profesor/grupo/${grupoId}/alumnos-riesgo`)
      .then(r => setData(r.data || r || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [grupoId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-dark" /></div>;
  if (data.length === 0) return (
    <div className="flex flex-col items-center py-10 gap-2">
      <CheckCircle size={32} className="text-success" />
      <p className="text-success text-sm font-medium">Sin alumnos en riesgo en este grupo</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {data.map(a => {
        const rs = RISK_STYLES[a.nivel_riesgo] || RISK_STYLES.bajo;
        return (
          <div key={a.id} className="bg-surface border border-border rounded-xl p-4 hover:border-primary-dark/40 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-text-primary font-semibold text-sm">{a.nombre}</span>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-semibold ${rs.cls}`}>{rs.label}</span>
                  {a.porcentaje_riesgo > 0 && <span className="text-xs text-text-secondary">{a.porcentaje_riesgo}% riesgo</span>}
                </div>
                <div className="w-full bg-bg rounded-full h-1.5 mb-3 border border-border">
                  <div className={`h-1.5 rounded-full ${rs.bar}`} style={{ width: `${Math.min(a.porcentaje_riesgo || 0, 100)}%` }} />
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                  {a.parcial1 !== null && <span>P1: <span className={`font-semibold ${calColor(a.parcial1)}`}>{a.parcial1?.toFixed(1)}</span></span>}
                  {a.parcial2 !== null && <span>P2: <span className={`font-semibold ${calColor(a.parcial2)}`}>{a.parcial2?.toFixed(1)}</span></span>}
                  {a.asistencia !== null && <span>Asist: <span className={`font-semibold ${a.asistencia < 75 ? 'text-red-600' : 'text-emerald-600'}`}>{a.asistencia}%</span></span>}
                  <span className="italic text-text-muted">{a.patron}</span>
                </div>
              </div>
              <button onClick={() => onVerDetalle(a.id)} className="shrink-0 px-3 py-1.5 bg-primary-light hover:bg-primary/20 text-primary-dark border border-primary/30 rounded-lg text-xs flex items-center gap-1.5 transition-all">
                <Eye size={12} /> Ver
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ModalAsistencia({ grupoId, grupoNombre, onClose, onSuccess }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [asistencias, setAsistencias] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/profesor/grupo/${grupoId}/alumnos`)
      .then(r => {
        const lista = r.data || r || [];
        setAlumnos(lista);
        const inicial = {};
        lista.forEach(a => { inicial[a.id] = { presente: true, justificada: false }; });
        setAsistencias(inicial);
      })
      .catch(() => setError('No se pudo cargar la lista de alumnos.'))
      .finally(() => setLoading(false));
  }, [grupoId]);

  const togglePresente = (id) => {
    setAsistencias(prev => ({ ...prev, [id]: { ...prev[id], presente: !prev[id].presente, justificada: false } }));
  };
  const toggleJustificada = (id) => {
    setAsistencias(prev => ({ ...prev, [id]: { ...prev[id], justificada: !prev[id].justificada } }));
  };
  const marcarTodos = (presente) => {
    const nuevo = {};
    alumnos.forEach(a => { nuevo[a.id] = { presente, justificada: false }; });
    setAsistencias(nuevo);
  };

  const guardar = async () => {
    setSaving(true);
    setError(null);
    try {
      const registros = alumnos.map(a => ({
        alumno_id: a.id,
        presente: asistencias[a.id]?.presente ?? true,
        justificada: asistencias[a.id]?.justificada ?? false,
      }));
      await api.post(`/profesor/grupo/${grupoId}/asistencia`, { registros, fecha });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.message || 'Error al guardar asistencia.');
    } finally {
      setSaving(false);
    }
  };

  const presentes = Object.values(asistencias).filter(a => a.presente).length;
  const ausentes = alumnos.length - presentes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2"><UserCheck size={18} className="text-primary-dark" /> Pase de Lista</h3>
            <p className="text-xs text-text-secondary mt-0.5">{grupoNombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-lg transition-colors text-text-secondary"><X size={18} /></button>
        </div>
        <div className="px-6 py-3 border-b border-border bg-bg/50">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-semibold text-text-secondary">Fecha:</label>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="border border-border rounded-lg px-3 py-1.5 text-sm bg-surface text-text-primary focus:outline-none focus:border-primary-dark" />
            <span className="ml-auto flex gap-2 text-xs">
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">{presentes} presentes</span>
              <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">{ausentes} ausentes</span>
            </span>
          </div>
        </div>
        <div className="px-6 py-2 border-b border-border flex gap-2">
          <button onClick={() => marcarTodos(true)} className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium">✓ Todos presentes</button>
          <button onClick={() => marcarTodos(false)} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium">✗ Todos ausentes</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-dark" /></div>
          ) : error ? (
            <p className="text-danger text-sm text-center py-4">{error}</p>
          ) : (
            <div className="space-y-1.5">
              {alumnos.map((a, i) => {
                const est = asistencias[a.id] || { presente: true, justificada: false };
                return (
                  <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${est.presente ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <span className="text-xs text-text-muted w-6 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{a.nombre}</p>
                      <p className="text-xs text-text-muted">{a.matricula}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!est.presente && (
                        <button onClick={() => toggleJustificada(a.id)} className={`text-xs px-2 py-1 rounded-lg border font-medium transition-all ${est.justificada ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-amber-50'}`}>
                          {est.justificada ? 'Justificada' : 'Justificar'}
                        </button>
                      )}
                      <button onClick={() => togglePresente(a.id)} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all ${est.presente ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-red-300 text-red-500 hover:bg-red-50'}`}>
                        {est.presente ? '✓' : '✗'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {error && !loading && (
          <div className="mx-6 mb-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors">Cancelar</button>
          <button onClick={guardar} disabled={saving || loading} className="px-5 py-2 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar Asistencia
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCalificaciones({ grupoId, grupoNombre, onClose, onSuccess }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parcial, setParcial] = useState(1);
  const [califs, setCalifs] = useState({});
  const [error, setError] = useState(null);
  const [erroresValidacion, setErroresValidacion] = useState({});

  useEffect(() => {
    api.get(`/profesor/grupo/${grupoId}/alumnos`)
      .then(r => {
        const lista = r.data || r || [];
        setAlumnos(lista);
        const inicial = {};
        lista.forEach(a => { inicial[a.id] = ''; });
        setCalifs(inicial);
      })
      .catch(() => setError('No se pudo cargar la lista.'))
      .finally(() => setLoading(false));
  }, [grupoId]);

  const setCalif = (id, val) => {
    setCalifs(prev => ({ ...prev, [id]: val }));
    if (erroresValidacion[id]) setErroresValidacion(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const guardar = async () => {
    const errs = {};
    alumnos.forEach(a => {
      const v = califs[a.id];
      if (v === '' || v === undefined) return;
      const n = parseFloat(v);
      if (isNaN(n) || n < 0 || n > 10) errs[a.id] = 'Debe ser 0–10';
    });
    setErroresValidacion(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setError(null);
    try {
      const calificaciones = alumnos
        .filter(a => califs[a.id] !== '' && califs[a.id] !== undefined)
        .map(a => ({ alumno_id: a.id, calificacion: parseFloat(califs[a.id]) }));
      if (calificaciones.length === 0) { setError('Ingresa al menos una calificación.'); setSaving(false); return; }
      await api.post(`/profesor/grupo/${grupoId}/calificaciones`, { parcial, calificaciones });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e.message || 'Error al guardar calificaciones.');
    } finally {
      setSaving(false);
    }
  };

  const llenados = Object.values(califs).filter(v => v !== '').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2"><Pencil size={18} className="text-primary-dark" /> Registrar Calificaciones</h3>
            <p className="text-xs text-text-secondary mt-0.5">{grupoNombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-lg transition-colors text-text-secondary"><X size={18} /></button>
        </div>
        <div className="px-6 py-3 border-b border-border bg-bg/50">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-semibold text-text-secondary">Parcial:</label>
            {[1, 2, 3].map(p => (
              <button key={p} onClick={() => setParcial(p)} className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all ${parcial === p ? 'bg-primary-dark text-white border-primary-dark' : 'bg-surface text-text-secondary border-border hover:border-primary-dark'}`}>
                Parcial {p}
              </button>
            ))}
            <span className="ml-auto text-xs text-text-secondary">{llenados}/{alumnos.length} ingresados</span>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-dark" /></div>
          ) : (
            <div className="space-y-2">
              {alumnos.map((a, i) => {
                const val = califs[a.id] ?? '';
                const num = parseFloat(val);
                const color = val !== '' && !isNaN(num) ? calColor(num) : 'text-text-primary';
                const err = erroresValidacion[a.id];
                return (
                  <div key={a.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${err ? 'border-red-300 bg-red-50' : 'border-border bg-surface hover:border-primary/30 hover:bg-bg'}`}>
                    <span className="text-xs text-text-muted w-6 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{a.nombre}</p>
                      <p className="text-xs text-text-muted">{a.matricula}</p>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      {err && <span className="text-xs text-red-600">{err}</span>}
                      <input
                        type="number" min="0" max="10" step="0.1" placeholder="—"
                        value={val} onChange={e => setCalif(a.id, e.target.value)}
                        className={`w-20 border rounded-xl px-3 py-2 text-center text-sm font-bold font-mono focus:outline-none focus:border-primary-dark transition-colors ${err ? 'border-red-300 bg-red-50' : 'border-border bg-bg'} ${color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {error && (
          <div className="mx-6 mb-3 px-4 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-border rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors">Cancelar</button>
          <button onClick={guardar} disabled={saving || loading} className="px-5 py-2 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar Calificaciones
          </button>
        </div>
      </div>
    </div>
  );
}

function AsistenciaSection({ grupoId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!grupoId) return;
    setLoading(true);
    api.get(`/profesor/grupo/${grupoId}/asistencia`)
      .then(r => setData(r.data || r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [grupoId]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-dark" /></div>;
  if (!data) return <p className="text-text-secondary text-sm text-center py-4">Sin datos de asistencia.</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary mb-1 font-medium">Asistencia General</p>
          <p className={`text-2xl font-bold ${data.porcentaje_general >= 80 ? 'text-emerald-600' : data.porcentaje_general >= 65 ? 'text-amber-600' : 'text-red-600'}`}>{data.porcentaje_general}%</p>
        </div>
        <div className="bg-bg border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary mb-1 font-medium">Total Alumnos</p>
          <p className="text-2xl font-bold text-text-primary">{data.total_alumnos}</p>
        </div>
        <div className="bg-bg border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-text-secondary mb-1 font-medium">Bajo 80%</p>
          <p className={`text-2xl font-bold ${data.bajo_80 > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{data.bajo_80}</p>
        </div>
      </div>
      {data.semanas?.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h4 className="text-sm font-semibold text-text-primary mb-4">Tendencia de Asistencia Semanal</h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={data.semanas} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0EAE0" />
              <XAxis dataKey="semana" tick={{ fill: '#5A7260', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5A7260', fontSize: 11 }} />
              <Tooltip {...BAR_TOOLTIP_STYLE} formatter={(v) => [`${v}%`, 'Asistencia']} />
              <Line type="monotone" dataKey="porcentaje" stroke="#4CAF50" strokeWidth={2.5} dot={{ fill: '#4CAF50', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {data.alumnos_criticos?.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-bg/50">
            <h4 className="text-sm font-semibold text-text-primary">Alumnos con Más Faltas</h4>
          </div>
          <div className="divide-y divide-border">
            {data.alumnos_criticos.map(a => (
              <div key={a.alumno_id} className="flex items-center gap-3 px-4 py-3 hover:bg-bg transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary text-sm font-medium">{a.nombre}</p>
                  <p className="text-text-muted text-xs">{a.ultima_asistencia ? `Última: ${new Date(a.ultima_asistencia).toLocaleDateString('es-MX')}` : 'Sin asistencias'}</p>
                </div>
                <span className="px-3 py-1 bg-red-100 border border-red-200 text-red-700 rounded-full text-xs font-bold">{a.faltas} faltas</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AlumnoDetalleDrawer({ alumnoId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!alumnoId) return;
    setLoading(true);
    api.get(`/profesor/alumno/${alumnoId}/detalle`)
      .then(r => setData(r.data || r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [alumnoId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="relative w-full max-w-md h-full bg-surface border-l border-border shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()} style={{ animation: 'slideInRight 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-base font-semibold text-text-primary">Expediente Académico</h3>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-lg transition-colors text-text-secondary"><X size={18} /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={36} className="animate-spin text-primary-dark" /></div>
        ) : !data ? (
          <p className="text-text-secondary text-sm text-center py-10">No se pudo cargar la información.</p>
        ) : (
          <div className="p-6 space-y-5">
            <div className="bg-bg border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-bold text-text-primary">{data.perfil.nombre}</p>
                  <p className="text-sm text-text-secondary">{data.perfil.matricula} — {data.perfil.carrera}</p>
                </div>
                {data.riesgo?.nivel && (
                  <span className={`px-2 py-1 rounded-full border text-xs font-semibold ${RISK_STYLES[data.riesgo.nivel]?.cls || RISK_STYLES.bajo.cls}`}>
                    {RISK_STYLES[data.riesgo.nivel]?.label || 'Bajo'}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface rounded-lg p-2 border border-border">
                  <p className="text-xs text-text-secondary">Semestre</p>
                  <p className="text-sm font-bold text-text-primary">{data.perfil.semestre || '—'}</p>
                </div>
                <div className="bg-surface rounded-lg p-2 border border-border">
                  <p className="text-xs text-text-secondary">Promedio</p>
                  <p className={`text-sm font-bold ${calColor(data.perfil.promedio_general)}`}>{data.perfil.promedio_general?.toFixed(1) || '—'}</p>
                </div>
                <div className="bg-surface rounded-lg p-2 border border-border">
                  <p className="text-xs text-text-secondary">Asistencia</p>
                  <p className={`text-sm font-bold ${data.perfil.asistencia_pct < 75 ? 'text-red-600' : 'text-emerald-600'}`}>{data.perfil.asistencia_pct}%</p>
                </div>
              </div>
            </div>
            {data.riesgo?.porcentaje > 0 && (
              <div className="bg-bg border border-border rounded-xl p-4">
                <p className="text-xs text-text-secondary font-semibold mb-2 uppercase tracking-wide">Nivel de Riesgo Predictivo</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-border rounded-full h-2">
                    <div className={`h-2 rounded-full ${RISK_STYLES[data.riesgo.nivel]?.bar || RISK_STYLES.bajo.bar}`} style={{ width: `${Math.min(data.riesgo.porcentaje, 100)}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-text-primary shrink-0">{data.riesgo.porcentaje}%</span>
                </div>
                {data.riesgo.factores?.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs text-text-muted mb-1.5">Factores detectados:</p>
                    {data.riesgo.factores.slice(0, 4).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-text-secondary">
                        <ArrowRight size={10} className="text-warning shrink-0" />
                        {typeof f === 'string' ? f : (f.nombre || JSON.stringify(f))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {data.materias?.length > 0 && (
              <div className="bg-bg border border-border rounded-xl p-4">
                <p className="text-xs text-text-secondary font-semibold mb-3 uppercase tracking-wide">Calificaciones por Materia</p>
                <div className="space-y-4">
                  {data.materias.map((m, i) => (
                    <div key={i}>
                      <p className="text-sm font-semibold text-text-primary mb-2">{m.nombre}</p>
                      <div className="flex flex-wrap gap-2">
                        {m.parciales.sort((a, b) => a.parcial - b.parcial).map(p => (
                          <div key={p.parcial} className="bg-surface border border-border rounded-xl px-3 py-2 text-center min-w-[64px]">
                            <p className="text-xs text-text-secondary">P{p.parcial}</p>
                            <p className={`text-base font-bold font-mono ${calColor(p.calificacion)}`}>{p.calificacion.toFixed(1)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MisMateriasPanel({ grupos, activeGrupoId, onSelectGrupo, onAbrirAsistencia, onAbrirCalificaciones }) {
  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-bg/50">
        <div className="flex items-center gap-2">
          <BookMarked size={16} className="text-primary-dark" />
          <h3 className="text-sm font-bold text-text-primary">Mis Materias y Grupos</h3>
        </div>
      </div>
      <div className="divide-y divide-border">
        {grupos.map(g => {
          const activo = g.id === activeGrupoId;
          return (
            <div key={g.id} className={`transition-colors ${activo ? 'bg-primary-light/50' : 'hover:bg-bg'}`}>
              <button onClick={() => onSelectGrupo(g.id)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activo ? 'bg-primary-dark text-white' : 'bg-bg border border-border text-text-secondary'}`}>
                  <BookOpen size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${activo ? 'text-primary-dark' : 'text-text-primary'}`}>{g.materia}</p>
                  <p className="text-xs text-text-secondary">{g.nombre} · Sem. {g.semestre}</p>
                </div>
                <ChevronRight size={14} className={`shrink-0 transition-transform ${activo ? 'rotate-90 text-primary-dark' : 'text-text-muted'}`} />
              </button>
              {activo && (
                <div className="px-5 pb-3 flex gap-2">
                  <button onClick={() => onAbrirAsistencia(g)} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary hover:bg-primary-light hover:border-primary/30 transition-all">
                    <UserCheck size={13} className="text-primary-dark" /> Pasar Lista
                  </button>
                  <button onClick={() => onAbrirCalificaciones(g)} className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary hover:bg-primary-light hover:border-primary/30 transition-all">
                    <Pencil size={13} className="text-primary-dark" /> Calificaciones
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ComparativaSection({ comparativa }) {
  if (!comparativa || comparativa.grupos?.length === 0) return (
    <div className="flex flex-col items-center py-8 gap-2 text-text-muted">
      <LayoutGrid size={24} />
      <p className="text-sm">Cargando comparativa...</p>
    </div>
  );

  const chartData = comparativa.grupos.map(g => ({
    name: g.nombre.length > 10 ? g.nombre.substring(0, 10) + '…' : g.nombre,
    'Aprob.': g.aprobacion,
    'Asist.': g.asistencia,
  }));

  return (
    <div className="space-y-4">
      {comparativa.insight && (
        <div className="bg-bg border border-border rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-info mt-0.5 shrink-0" />
            <p className="text-text-secondary text-xs leading-relaxed">{comparativa.insight}</p>
          </div>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg border-b border-border">
              <th className="text-left py-2.5 px-3 text-text-secondary font-semibold text-xs">Grupo</th>
              <th className="text-center py-2.5 px-2 text-text-secondary font-semibold text-xs">Alum.</th>
              <th className="text-center py-2.5 px-2 text-text-secondary font-semibold text-xs">Prom.</th>
              <th className="text-center py-2.5 px-2 text-text-secondary font-semibold text-xs">Aprob.</th>
              <th className="text-center py-2.5 px-2 text-text-secondary font-semibold text-xs">Asist.</th>
              <th className="text-center py-2.5 px-2 text-text-secondary font-semibold text-xs">Tend.</th>
            </tr>
          </thead>
          <tbody>
            {comparativa.grupos.map((g, i) => (
              <tr key={g.id} className={`border-b border-border/60 ${i % 2 === 0 ? 'bg-surface' : 'bg-bg/40'} hover:bg-primary-light/30 transition-colors`}>
                <td className="py-2.5 px-3">
                  <p className="text-text-primary font-semibold text-xs">{g.nombre}</p>
                  <p className="text-text-muted text-xs truncate max-w-[90px]">{g.materia}</p>
                </td>
                <td className="py-2.5 px-2 text-center text-text-secondary text-sm">{g.alumnos}</td>
                <td className={`py-2.5 px-2 text-center font-bold font-mono text-sm ${calColor(g.promedio)}`}>{g.promedio?.toFixed(1)}</td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-semibold text-sm ${g.aprobacion >= 70 ? 'text-emerald-600' : g.aprobacion >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{g.aprobacion}%</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`font-semibold text-sm ${g.asistencia >= 80 ? 'text-emerald-600' : g.asistencia >= 65 ? 'text-amber-600' : 'text-red-600'}`}>{g.asistencia}%</span>
                </td>
                <td className="py-2.5 px-2 text-center">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs ${TREND_CLS[g.tendencia]}`}>{TREND_ICONS[g.tendencia]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {chartData.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wide">Comparativa Visual</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0EAE0" />
              <XAxis dataKey="name" tick={{ fill: '#5A7260', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#5A7260', fontSize: 10 }} />
              <Tooltip {...BAR_TOOLTIP_STYLE} formatter={(v) => [`${v}%`]} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#5A7260' }} />
              <Bar dataKey="Aprob." fill="#4CAF50" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Asist." fill="#42A5F5" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function ProfesorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [comparativa, setComparativa] = useState(null);
  const [activeGrupoId, setActiveGrupoId] = useState(null);
  const [activeSection, setActiveSection] = useState('radiografia');
  const [drawerAlumnoId, setDrawerAlumnoId] = useState(null);
  const [modalAsistencia, setModalAsistencia] = useState(null);
  const [modalCalificaciones, setModalCalificaciones] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const gruposRes = await api.get('/profesor/grupos');
      const g = gruposRes.data || gruposRes || [];
      setGrupos(g);
      if (g.length > 0) setActiveGrupoId(prev => prev || g[0].id);
      setLoading(false);
      const [resumenRes, comparativaRes] = await Promise.all([
        api.get('/profesor/resumen').catch(() => null),
        api.get('/profesor/comparativa').catch(() => null),
      ]);
      if (resumenRes) setResumen(resumenRes.data ?? resumenRes);
      if (comparativaRes) setComparativa(comparativaRes.data ?? comparativaRes);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la información. Verifica tu conexión.');
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState msg={error} onRetry={cargarDatos} />;

  const grupoActivo = grupos.find(g => g.id === activeGrupoId);

  const SECTION_TABS = [
    { id: 'radiografia', label: 'Análisis', icon: <BarChart2 size={14} /> },
    { id: 'riesgo',      label: 'En Riesgo',  icon: <AlertTriangle size={14} /> },
    { id: 'asistencia',  label: 'Asistencia', icon: <Activity size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-dark text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2" style={{ animation: 'fadeIn 0.3s ease' }}>
          <CheckCircle size={16} /> {toastMsg}
        </div>
      )}

      {/* Encabezado */}
      <div className="bg-surface border border-border rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(123,198,126,0.1) 0%, rgba(76,175,80,0.05) 100%)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Bienvenido, <span className="text-primary-dark">{resumen?.nombre || 'Profesor'}</span></h2>
            <p className="text-text-secondary text-sm mt-1">
              {resumen?.periodo} — {resumen?.grupos_count || grupos.length} grupo{(resumen?.grupos_count || grupos.length) !== 1 ? 's' : ''} activo{(resumen?.grupos_count || grupos.length) !== 1 ? 's' : ''}, {resumen?.total_alumnos || 0} alumnos en total
            </p>
            {resumen?.proxima_clase && (
              <p className="text-sm text-primary-dark mt-2 flex items-center gap-1.5">
                <Clock size={13} /> Próxima: <strong>{resumen.proxima_clase.materia}</strong> — {resumen.proxima_clase.hora} · {resumen.proxima_clase.aula}
              </p>
            )}
          </div>
          <button onClick={cargarDatos} className="flex items-center gap-2 px-4 py-2 bg-primary-light border border-primary/30 hover:bg-primary/20 text-primary-dark rounded-xl text-sm transition-all self-start">
            <RefreshCw size={13} /> Actualizar
          </button>
        </div>
      </div>

      {/* KPIs */}
      {resumen?.kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Aprobación General" value={`${resumen.kpis.aprobacion}%`} icon={<GraduationCap size={20} />} trend={`${resumen.kpis.aprobacion}% de todos los grupos`} trendColor={resumen.kpis.aprobacion >= 70 ? 'good' : 'bad'} />
          <StatCard title="Asistencia Promedio" value={`${resumen.kpis.asistencia}%`} icon={<CheckCircle size={20} />} trend={`${resumen.kpis.asistencia}% en registros`} trendColor={resumen.kpis.asistencia >= 80 ? 'good' : 'bad'} />
          <StatCard title="Alumnos en Riesgo" value={resumen.kpis.en_riesgo} icon={<AlertTriangle size={20} />} trend={`${resumen.kpis.en_riesgo_pct}% del total`} trendColor={resumen.kpis.en_riesgo === 0 ? 'good' : 'bad'} />
          <StatCard title="Reprobación" value={`${resumen.kpis.reprobacion}%`} icon={<Target size={20} />} trend={`${resumen.kpis.reprobacion}% de calificaciones`} trendColor={resumen.kpis.reprobacion <= 20 ? 'good' : 'bad'} />
        </div>
      )}

      {/* Layout 4 cols */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">

        {/* Col 1: Mis Materias */}
        <div className="xl:col-span-1">
          {grupos.length > 0 ? (
            <MisMateriasPanel
              grupos={grupos}
              activeGrupoId={activeGrupoId}
              onSelectGrupo={setActiveGrupoId}
              onAbrirAsistencia={(g) => setModalAsistencia(g)}
              onAbrirCalificaciones={(g) => setModalCalificaciones(g)}
            />
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 text-center">
              <BookOpen size={28} className="text-text-muted mx-auto mb-2" />
              <p className="text-text-secondary text-sm">No tienes grupos asignados.</p>
            </div>
          )}
        </div>

        {/* Col 2-3: Análisis del grupo */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-surface border border-border rounded-xl p-1 flex gap-1">
            {SECTION_TABS.map(t => (
              <button key={t.id} onClick={() => setActiveSection(t.id)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${activeSection === t.id ? 'bg-primary-dark text-white shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-bg'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {grupoActivo && (
            <div className="flex gap-3">
              <button onClick={() => setModalAsistencia(grupoActivo)} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-primary-light border border-primary/30 text-primary-dark rounded-xl text-sm font-semibold hover:bg-primary/20 transition-all">
                <UserCheck size={15} /> Pasar Lista — {grupoActivo.nombre}
              </button>
              <button onClick={() => setModalCalificaciones(grupoActivo)} className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-bg border border-border text-text-primary rounded-xl text-sm font-semibold hover:bg-primary-light hover:border-primary/30 transition-all">
                <Pencil size={15} /> Calificaciones — {grupoActivo.nombre}
              </button>
            </div>
          )}

          <div className="bg-surface border border-border rounded-xl p-5">
            {activeGrupoId ? (
              <>
                {activeSection === 'radiografia' && <RadiografiSection grupoId={activeGrupoId} />}
                {activeSection === 'riesgo' && <AlumnosRiesgoSection grupoId={activeGrupoId} onVerDetalle={setDrawerAlumnoId} />}
                {activeSection === 'asistencia' && <AsistenciaSection grupoId={activeGrupoId} />}
              </>
            ) : (
              <p className="text-text-secondary text-sm text-center py-10">Selecciona un grupo para ver el análisis.</p>
            )}
          </div>
        </div>

        {/* Col 4: Comparativa */}
        <div className="xl:col-span-1">
          <div className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid size={16} className="text-primary-dark" />
              <h3 className="text-sm font-bold text-text-primary">Mis Grupos — Comparativa</h3>
            </div>
            <ComparativaSection comparativa={comparativa} />
          </div>
        </div>
      </div>

      {modalAsistencia && (
        <ModalAsistencia
          grupoId={modalAsistencia.id}
          grupoNombre={`${modalAsistencia.materia} — ${modalAsistencia.nombre}`}
          onClose={() => setModalAsistencia(null)}
          onSuccess={() => showToast('✓ Asistencia guardada correctamente')}
        />
      )}

      {modalCalificaciones && (
        <ModalCalificaciones
          grupoId={modalCalificaciones.id}
          grupoNombre={`${modalCalificaciones.materia} — ${modalCalificaciones.nombre}`}
          onClose={() => setModalCalificaciones(null)}
          onSuccess={() => showToast('✓ Calificaciones guardadas correctamente')}
        />
      )}

      {drawerAlumnoId && (
        <AlumnoDetalleDrawer alumnoId={drawerAlumnoId} onClose={() => setDrawerAlumnoId(null)} />
      )}
    </div>
  );
}
