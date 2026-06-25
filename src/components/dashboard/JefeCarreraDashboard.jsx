import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import StatCard from '../ui/StatCard.jsx';
import StackedRiskBySemesterChart from '../charts/StackedRiskBySemesterChart.jsx';
import CarreraTrendChart from '../charts/CarreraTrendChart.jsx';
import GeneracionesChart from '../charts/GeneracionesChart.jsx';
import {
  Users, AlertTriangle, GraduationCap, Activity, Bell,
  TrendingUp, TrendingDown, Minus, ChevronRight, Loader2,
  UserCheck, BookOpen, ClipboardList, BarChart2, Calendar,
  AlertCircle, CheckCircle, Shield, List, Grid
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const RIESGO_CONFIG = {
  critico: { label: 'Crítico', bg: 'bg-red-950/60', border: 'border-red-700/40', text: 'text-red-400', bar: 'bg-red-500', dot: 'bg-red-500' },
  alto:    { label: 'Alto',    bg: 'bg-orange-950/50', border: 'border-orange-700/40', text: 'text-orange-400', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  medio:   { label: 'Medio',   bg: 'bg-amber-950/40', border: 'border-amber-700/30', text: 'text-amber-400', bar: 'bg-amber-400', dot: 'bg-amber-400' },
  bajo:    { label: 'Bajo',    bg: 'bg-emerald-950/30', border: 'border-emerald-700/30', text: 'text-emerald-400', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
};

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp size={14} className="text-emerald-400" />;
  if (trend === 'down') return <TrendingDown size={14} className="text-red-400" />;
  return <Minus size={14} className="text-slate-400" />;
};

const RiesgoChip = ({ nivel }) => {
  const cfg = RIESGO_CONFIG[nivel] || RIESGO_CONFIG.bajo;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function AlumnosRiesgoTable({ alumnos = [], loading }) {
  const [semFilter, setSemFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'heatmap'

  const filtered = alumnos.filter(a => {
    if (semFilter && String(a.semestre) !== semFilter) return false;
    if (nivelFilter && a.nivel_riesgo !== nivelFilter) return false;
    return true;
  });

  const semesters = [...new Set(alumnos.map(a => a.semestre))].sort();

  // Heatmap: agrupado por semestre
  const heatmapData = semesters.map(sem => ({
    sem,
    alumnos: filtered.filter(a => a.semestre === sem),
  }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={semFilter}
            onChange={e => setSemFilter(e.target.value)}
            className="text-xs bg-surface-alt border border-border rounded-lg px-3 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Todos los semestres</option>
            {semesters.map(s => <option key={s} value={s}>Semestre {s}</option>)}
          </select>
          <select
            value={nivelFilter}
            onChange={e => setNivelFilter(e.target.value)}
            className="text-xs bg-surface-alt border border-border rounded-lg px-3 py-1.5 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">Todos los niveles</option>
            <option value="critico">Crítico</option>
            <option value="alto">Alto</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
          </select>
          <span className="text-xs text-text-secondary">{filtered.length} alumnos</span>
        </div>
        <div className="flex rounded-lg overflow-hidden border border-border">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:text-text-primary'}`}
          >
            <List size={12} /> Lista
          </button>
          <button
            onClick={() => setView('heatmap')}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${view === 'heatmap' ? 'bg-primary text-white' : 'bg-surface-alt text-text-secondary hover:text-text-primary'}`}
          >
            <Grid size={12} /> Mapa
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-dark" /></div>
      ) : view === 'list' ? (
        /* Lista */
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Alumno</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Sem.</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Riesgo</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Promedio</th>
                <th className="text-center py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Asistencia</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">Tutor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((a) => (
                <tr key={a.id} className="border-b border-border/50 hover:bg-surface-alt/50 transition-colors group">
                  <td className="py-2.5 px-3 font-medium text-text-primary">{a.nombre}</td>
                  <td className="py-2.5 px-3 text-center text-text-secondary">{a.semestre}</td>
                  <td className="py-2.5 px-3 text-center"><RiesgoChip nivel={a.nivel_riesgo} /></td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-mono font-bold ${parseFloat(a.promedio) < 6 ? 'text-red-400' : parseFloat(a.promedio) < 7.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {parseFloat(a.promedio).toFixed(1)}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${a.pct_asistencia >= 85 ? 'bg-emerald-500' : a.pct_asistencia >= 70 ? 'bg-amber-400' : 'bg-red-500'}`}
                          style={{ width: `${Math.min(a.pct_asistencia, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-text-secondary">{a.pct_asistencia}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    {a.tutor_nombre
                      ? <span className="text-text-secondary text-xs">{a.tutor_nombre}</span>
                      : <span className="text-xs font-semibold text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> Sin tutor</span>
                    }
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-text-secondary text-sm">No hay alumnos con esos filtros</td></tr>
              )}
            </tbody>
          </table>
          {filtered.length > 20 && (
            <p className="text-xs text-text-secondary text-center mt-3">Mostrando 20 de {filtered.length} alumnos</p>
          )}
        </div>
      ) : (
        /* Heatmap */
        <div className="space-y-3">
          {heatmapData.map(({ sem, alumnos: semAlumnos }) => (
            <div key={sem} className="flex items-start gap-3">
              <span className="text-xs font-bold text-text-secondary w-16 pt-1 shrink-0">Sem {sem}</span>
              <div className="flex flex-wrap gap-1.5">
                {semAlumnos.map(a => {
                  const cfg = RIESGO_CONFIG[a.nivel_riesgo] || RIESGO_CONFIG.bajo;
                  return (
                    <div
                      key={a.id}
                      title={`${a.nombre}\nRiesgo: ${cfg.label}\nPromedio: ${a.promedio}\nAsistencia: ${a.pct_asistencia}%`}
                      className={`w-5 h-5 rounded-sm cursor-pointer transition-transform hover:scale-125 border ${cfg.border} ${cfg.bg.replace('/60', '/80')}`}
                    >
                      <span className={`block w-full h-full rounded-sm ${cfg.dot} opacity-70`} />
                    </div>
                  );
                })}
                {semAlumnos.length === 0 && <span className="text-xs text-text-secondary italic">Sin alumnos con este filtro</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfesoresTable({ profesores = [] }) {
  if (!profesores.length) return <p className="text-sm text-text-secondary text-center py-8">Sin datos de profesores</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Profesor', 'Materia Principal', 'Grupos', '% Aprobación', 'Alumnos en Riesgo', 'Tendencia'].map(h => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {profesores.map((p, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-surface-alt/50 transition-colors">
              <td className="py-2.5 px-3 font-medium text-text-primary whitespace-nowrap">{p.nombre}</td>
              <td className="py-2.5 px-3 text-text-secondary text-xs max-w-[180px] truncate" title={p.materia}>{p.materia}</td>
              <td className="py-2.5 px-3 text-center text-text-secondary">{p.num_grupos}</td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden max-w-[80px]">
                    <div
                      className={`h-full rounded-full ${p.pass_rate >= 85 ? 'bg-emerald-500' : p.pass_rate >= 70 ? 'bg-amber-400' : 'bg-red-500'}`}
                      style={{ width: `${p.pass_rate}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold ${p.pass_rate >= 85 ? 'text-emerald-400' : p.pass_rate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                    {p.pass_rate}%
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-center">
                {p.risk_alums > 0 ? (
                  <span className="text-xs font-semibold text-orange-400 bg-orange-950/40 border border-orange-700/30 px-2 py-0.5 rounded-md">
                    {p.risk_alums} ({p.risk_pct}%)
                  </span>
                ) : <span className="text-xs text-emerald-400">Ninguno</span>}
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <TrendIcon trend={p.trend} />
                  <span className="text-xs text-text-secondary capitalize">{p.trend === 'up' ? 'Mejorando' : p.trend === 'down' ? 'Atención' : 'Estable'}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MateriasPanel({ materias = [] }) {
  if (!materias.length) return <p className="text-sm text-text-secondary text-center py-4">Sin datos</p>;
  const max = Math.max(...materias.map(m => m.reprobacion), 1);
  return (
    <div className="space-y-2.5">
      {materias.map((m, i) => {
        const pct = m.reprobacion;
        const nivel = pct >= 25 ? 'critico' : pct >= 15 ? 'alto' : pct >= 8 ? 'medio' : 'bajo';
        const cfg = RIESGO_CONFIG[nivel];
        return (
          <div key={i} className={`rounded-lg border p-3 ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-text-primary leading-tight">{m.nombre}</p>
              <span className={`text-xs font-bold shrink-0 ${cfg.text}`}>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden mb-1.5">
              <div
                className={`h-full rounded-full ${cfg.bar}`}
                style={{ width: `${(pct / max) * 100}%`, transition: 'width 0.8s ease' }}
              />
            </div>
            <p className="text-xs text-text-secondary">{m.reprobados} reprobados de {m.alumnos} alumnos</p>
          </div>
        );
      })}
    </div>
  );
}

function AlertasPanel({ alertas }) {
  if (!alertas) return <div className="flex items-center justify-center h-40"><Loader2 className="animate-spin text-primary-dark" size={20} /></div>;

  return (
    <div className="space-y-3">
      {/* Críticas */}
      {alertas.criticas?.length > 0 && (
        <div className="rounded-xl border border-red-700/30 bg-red-950/30 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-red-700/20 flex items-center gap-2">
            <AlertCircle size={14} className="text-red-400" />
            <span className="text-sm font-bold text-red-400">Críticas ({alertas.criticas.length})</span>
          </div>
          <div className="divide-y divide-red-900/30">
            {alertas.criticas.slice(0, 3).map(al => (
              <div key={al.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{al.nombre}</p>
                    <p className="text-xs text-text-secondary">Semestre {al.semestre} · {al.tipo || 'mixta'}</p>
                    {!al.tutor_id && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-amber-400">
                        <AlertCircle size={10} /> Sin tutor asignado
                      </span>
                    )}
                  </div>
                  <RiesgoChip nivel={al.nivel_riesgo} />
                </div>
                <div className="flex gap-2 mt-2.5">
                  <button className="text-xs bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary-dark px-2.5 py-1 rounded-lg transition-colors font-medium">
                    Asignar tutor
                  </button>
                  <button className="text-xs bg-surface-alt hover:bg-border border border-border text-text-secondary px-2.5 py-1 rounded-lg transition-colors">
                    Ver expediente
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medias */}
      {alertas.medias?.length > 0 && (
        <div className="rounded-xl border border-amber-700/30 bg-amber-950/20 overflow-hidden">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-sm font-bold text-amber-400">Medias ({alertas.medias.length})</span>
            </div>
            <button className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 transition-colors">
              Ver todas <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Resueltas */}
      <div className="rounded-xl border border-emerald-700/30 bg-emerald-950/20 px-4 py-3 flex items-center gap-3">
        <CheckCircle size={18} className="text-emerald-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-400">
            {alertas.resueltas_semana} resueltas esta semana
          </p>
          <p className="text-xs text-text-secondary">Total activas: {alertas.total_activas}</p>
        </div>
      </div>
    </div>
  );
}

function TutoresTable({ tutores = [] }) {
  if (!tutores.length) return <p className="text-sm text-text-secondary text-center py-4">Sin datos de tutores</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {['Tutor', 'Alumnos asignados', 'Con riesgo alto', 'Disponibilidad'].map(h => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tutores.map((t, i) => (
            <tr key={i} className={`border-b border-border/50 hover:bg-surface-alt/50 transition-colors ${t.sin_tutor ? 'bg-amber-950/10' : ''}`}>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  {t.sin_tutor && <AlertCircle size={13} className="text-amber-400 shrink-0" />}
                  <span className={`font-medium ${t.sin_tutor ? 'text-amber-400' : 'text-text-primary'}`}>{t.nombre}</span>
                </div>
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary/70 rounded-full" style={{ width: `${Math.min((t.total_alumnos / 30) * 100, 100)}%` }} />
                  </div>
                  <span className="text-text-secondary text-xs">{t.total_alumnos}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 text-center">
                {t.en_riesgo > 0
                  ? <span className="text-xs font-semibold text-orange-400">{t.en_riesgo}</span>
                  : <span className="text-xs text-emerald-400">—</span>
                }
              </td>
              <td className="py-2.5 px-3">
                {t.disponibilidad ? (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                    t.disponibilidad === 'Alta' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-700/30' :
                    t.disponibilidad === 'Media' ? 'text-amber-400 bg-amber-950/40 border-amber-700/30' :
                    'text-red-400 bg-red-950/40 border-red-700/30'
                  }`}>{t.disponibilidad}</span>
                ) : <span className="text-xs text-text-secondary">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

export default function JefeCarreraDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [loadingAlumnos, setLoadingAlumnos] = useState(false);
  const [semestres, setSemestres] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [alertas, setAlertas] = useState(null);
  const [tutores, setTutores] = useState([]);
  const [tendencia, setTendencia] = useState([]);
  const [generaciones, setGeneraciones] = useState([]);
  const [activeTab, setActiveTab] = useState('riesgo');

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [infoR, kpisR, semR, profR, matR, altR, tutR, tendR, genR] = await Promise.allSettled([
        api.get('/carrera/info'),
        api.get('/carrera/kpis'),
        api.get('/carrera/riesgo-por-semestre'),
        api.get('/carrera/profesores'),
        api.get('/carrera/materias-criticas'),
        api.get('/carrera/alertas'),
        api.get('/carrera/tutores'),
        api.get('/carrera/tendencia'),
        api.get('/reportes/generaciones'),
      ]);

      if (infoR.status === 'fulfilled') setInfo(infoR.value);
      if (kpisR.status === 'fulfilled') setKpis(kpisR.value);
      if (semR.status === 'fulfilled') setSemestres(semR.value);
      if (profR.status === 'fulfilled') setProfesores(profR.value);
      if (matR.status === 'fulfilled') setMaterias(matR.value);
      if (altR.status === 'fulfilled') setAlertas(altR.value);
      if (tutR.status === 'fulfilled') setTutores(tutR.value);
      if (tendR.status === 'fulfilled') setTendencia(tendR.value);
      if (genR.status === 'fulfilled') setGeneraciones(genR.value);

      // Cargar alumnos en riesgo
      setLoadingAlumnos(true);
      const alumnosData = await api.get('/carrera/alumnos-riesgo').catch(() => []);
      setAlumnos(alumnosData);
    } catch (err) {
      setError('No se pudieron cargar algunos datos. Verifica la conexión.');
    } finally {
      setLoading(false);
      setLoadingAlumnos(false);
    }
  }, []);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-dark" size={36} />
        <p className="text-text-secondary font-medium">Cargando panel de carrera...</p>
        <p className="text-text-secondary text-xs">Consultando base de datos...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'riesgo', label: 'Alumnos en Riesgo', icon: <Users size={14} /> },
    { id: 'profesores', label: 'Profesores', icon: <GraduationCap size={14} /> },
    { id: 'materias', label: 'Materias Críticas', icon: <BookOpen size={14} /> },
    { id: 'alertas', label: 'Alertas', icon: <Bell size={14} /> },
    { id: 'tutores', label: 'Tutores', icon: <UserCheck size={14} /> },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Encabezado de carrera */}
      <div className="bg-gradient-to-r from-primary/10 to-surface border border-primary/20 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              {info?.nombre ?? 'Mi Carrera'}
            </h1>
            <p className="text-text-secondary text-sm mt-0.5">
              Coordinador: <span className="font-semibold text-text-primary">{info?.coordinador ?? '—'}</span>
              <span className="mx-2 text-border">·</span>
              Periodo: <span className="font-medium">{info?.periodo ?? 'Enero–Junio 2025'}</span>
            </p>
          </div>
          {info?.semestre_critico && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-700/30 rounded-xl px-4 py-2.5">
              <AlertTriangle size={16} className="text-red-400 shrink-0" />
              <div>
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Semestre más crítico</p>
                <p className="text-sm font-semibold text-text-primary">
                  Semestre {info.semestre_critico}
                  <span className="text-red-400 ml-2 text-xs">({info.pct_riesgo_critico}% en riesgo)</span>
                </p>
              </div>
            </div>
          )}
        </div>
        {error && <p className="mt-3 text-xs text-amber-400">⚠️ {error}</p>}
      </div>

      {/* 2. KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Alumnos"
          value={kpis?.total_alumnos?.toLocaleString() ?? '—'}
          icon={<Users size={18} />}
          trendColor="neutral"
        />
        <StatCard
          title="En Riesgo Alto"
          value={kpis ? `${kpis.en_riesgo} (${kpis.pct_riesgo}%)` : '—'}
          icon={<AlertTriangle size={18} />}
          trendColor="bad"
        />
        <StatCard
          title="Promedio Carrera"
          value={kpis?.promedio_general ?? '—'}
          icon={<GraduationCap size={18} />}
          trendColor="neutral"
        />
        <StatCard
          title="% Asistencia"
          value={kpis ? `${kpis.pct_asistencia}%` : '—'}
          icon={<Activity size={18} />}
          trendColor={kpis?.pct_asistencia >= 85 ? 'good' : 'bad'}
        />
        <StatCard
          title="Alertas Pendientes"
          value={kpis?.alertas_pendientes?.toLocaleString() ?? '—'}
          icon={<Bell size={18} />}
          trendColor={kpis?.alertas_pendientes > 20 ? 'bad' : 'neutral'}
        />
      </div>

      {/* 3. Gráfica de Distribución por Semestre */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-1 flex items-center gap-2">
            <BarChart2 size={18} className="text-primary-dark" />
            Distribución de Riesgo por Semestre
          </h2>
          <p className="text-xs text-text-secondary mb-4">¿En qué semestre debo enfocar recursos?</p>
          <StackedRiskBySemesterChart data={semestres} />
          {semestres.length > 0 && (() => {
            const critico = semestres.reduce((max, s) => s.pct_riesgo > max.pct_riesgo ? s : max, semestres[0]);
            return (
              <p className="text-xs text-center text-text-secondary mt-2">
                Mayor concentración de riesgo:{' '}
                <span className="font-bold text-red-400">{critico.name} ({critico.pct_riesgo}%)</span>
              </p>
            );
          })()}
        </div>

        {/* Tendencia 6 meses */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-text-primary mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-dark" />
            Tendencia (6 meses)
          </h2>
          <p className="text-xs text-text-secondary mb-4">Evolución de indicadores clave</p>
          <div className="flex-1">
            <CarreraTrendChart data={tendencia} />
          </div>
        </div>
      </div>

      {/* 4. Panel con tabs: Alumnos / Profesores / Materias / Alertas / Tutores */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs header */}
        <div className="border-b border-border overflow-x-auto">
          <div className="flex min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary-dark bg-primary/5'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-alt'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'alertas' && alertas?.total_activas > 0 && (
                  <span className="ml-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {alertas.total_activas > 9 ? '9+' : alertas.total_activas}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'riesgo' && (
            <AlumnosRiesgoTable alumnos={alumnos} loading={loadingAlumnos} />
          )}
          {activeTab === 'profesores' && <ProfesoresTable profesores={profesores} />}
          {activeTab === 'materias' && <MateriasPanel materias={materias} />}
          {activeTab === 'alertas' && <AlertasPanel alertas={alertas} />}
          {activeTab === 'tutores' && <TutoresTable tutores={tutores} />}
        </div>
      </div>

      {/* 5. Histórico de las últimas 10 generaciones */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Calendar size={18} className="text-primary-dark" />
              Histórico de Generaciones (Últimas 10)
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Evolución institucional por generación: titulación, deserción, riesgo y promedio de egreso.
            </p>
          </div>
        </div>
        <GeneracionesChart data={generaciones} />
        {/* Mini-tabla de generaciones */}
        {generaciones.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['Generación', 'Alumnos', 'Promedio', '% Titulación', '% Deserción', '% Riesgo Alto'].map(h => (
                    <th key={h} className="text-center py-2 px-3 font-semibold text-text-secondary uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {generaciones.map(g => (
                  <tr key={g.anio} className="border-b border-border/40 hover:bg-surface-alt/40 transition-colors">
                    <td className="py-2 px-3 text-center font-bold text-primary-dark">{g.generacion}</td>
                    <td className="py-2 px-3 text-center text-text-secondary">{g.total_alumnos}</td>
                    <td className="py-2 px-3 text-center font-mono font-semibold text-emerald-400">{g.promedio.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center">
                      {g.titulacion != null
                        ? <span className="text-primary-dark font-semibold">{g.titulacion}%</span>
                        : <span className="text-text-secondary italic">En curso</span>
                      }
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-semibold ${g.desercion > 12 ? 'text-red-400' : g.desercion > 8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {g.desercion}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className={`font-semibold ${g.riesgo > 12 ? 'text-red-400' : g.riesgo > 8 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {g.riesgo}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
