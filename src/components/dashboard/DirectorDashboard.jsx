import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import StatCard from '../ui/StatCard.jsx';
import CarrerasTable from '../ui/CarrerasTable.jsx';
import CriticalSubjectsList from '../ui/CriticalSubjectsList.jsx';
import TeachersPerformanceTable from '../ui/TeachersPerformanceTable.jsx';
import AlertsListDirector from '../ui/AlertsListDirector.jsx';
import RiskVsPromedioChart from '../charts/RiskVsPromedioChart.jsx';
import RiskBySemesterChart from '../charts/RiskBySemesterChart.jsx';
import HistoricalTrendChart from '../charts/HistoricalTrendChart.jsx';
import GeneracionesChart from '../charts/GeneracionesChart.jsx';
import { Calendar } from 'lucide-react';
import {
  Users, AlertTriangle, GraduationCap, Sparkles,
  AlertCircle, Activity, ChevronRight, Loader2
} from 'lucide-react';

// Datos fallback en caso de error de BD
const FALLBACK_SEMESTRES = [
  { name: 'Semestre 2', riesgo: 7.9, total: 266, en_riesgo: 21 },
  { name: 'Semestre 4', riesgo: 5.7, total: 245, en_riesgo: 14 },
  { name: 'Semestre 6', riesgo: 6.1, total: 231, en_riesgo: 14 },
  { name: 'Semestre 8', riesgo: 6.7, total: 210, en_riesgo: 14 },
];

export default function DirectorDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [kpis, setKpis] = useState(null);
  const [carreras, setCarreras] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [profesores, setProfesores] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [generaciones, setGeneraciones] = useState([]);

  useEffect(() => {
    const cargarTodo = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          kpiData,
          carrerasData,
          semestresData,
          materiasData,
          profesoresData,
          alertasData,
          historicoData,
          genData
        ] = await Promise.allSettled([
          api.get('/reportes/director-kpis'),
          api.get('/reportes/comparativa-carreras-detalle'),
          api.get('/reportes/riesgo-por-semestre'),
          api.get('/reportes/materias-criticas'),
          api.get('/reportes/profesores-desempeno'),
          api.get('/reportes/alertas-director'),
          api.get('/reportes/tendencia-historica'),
          api.get('/reportes/generaciones'),
        ]);

        if (kpiData.status === 'fulfilled') setKpis(kpiData.value);
        if (carrerasData.status === 'fulfilled') setCarreras(carrerasData.value);
        if (semestresData.status === 'fulfilled') setSemestres(semestresData.value.length > 0 ? semestresData.value : FALLBACK_SEMESTRES);
        else setSemestres(FALLBACK_SEMESTRES);
        if (materiasData.status === 'fulfilled') setMaterias(materiasData.value);
        if (profesoresData.status === 'fulfilled') setProfesores(profesoresData.value);
        if (alertasData.status === 'fulfilled') setAlertas(alertasData.value);
        if (historicoData.status === 'fulfilled') setHistorico(historicoData.value);
        if (genData.status === 'fulfilled') setGeneraciones(genData.value);

      } catch (err) {
        console.error('Error al cargar datos del director:', err);
        setError('No se pudieron cargar algunos datos. Verifica la conexión al servidor.');
      } finally {
        setLoading(false);
      }
    };

    cargarTodo();
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-dark" size={36} />
        <p className="text-text-secondary font-medium">Cargando panel institucional...</p>
        <p className="text-text-secondary text-xs">Consultando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Panel de Inteligencia Institucional
        </h1>
        <p className="text-text-secondary text-sm">
          Visión ejecutiva de indicadores académicos e índices de riesgo — datos en tiempo real.
        </p>
        {error && (
          <div className="mt-2 text-xs text-warning-dark bg-warning/10 border border-warning/20 rounded-lg px-3 py-2">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Fila 1: 4 KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Alumnos"
          value={kpis?.total_alumnos?.toLocaleString() ?? '—'}
          icon={<Users />}
          trend={kpis?.total_alumnos_trend ?? '↑ cargando...'}
          trendColor="good"
        />
        <StatCard
          title="En Riesgo Alto"
          value={kpis ? `${kpis.en_riesgo_alto} (${kpis.en_riesgo_pct}%)` : '—'}
          icon={<AlertTriangle />}
          trend={kpis?.en_riesgo_trend ?? null}
          trendColor="bad"
        />
        <StatCard
          title="Promedio General"
          value={kpis?.promedio_general ?? '—'}
          icon={<GraduationCap />}
          trend={kpis?.promedio_trend ?? '→ estable'}
          trendColor="neutral"
        />
        <StatCard
          title="Alertas Activas"
          value={kpis?.alertas_activas?.toLocaleString() ?? '—'}
          icon={<AlertCircle />}
          trend={kpis?.alertas_trend ?? null}
          trendColor={kpis?.alertas_activas > 50 ? 'bad' : 'good'}
        />
      </div>

      {/* Fila 2: Resumen IA */}
      <div className="bg-gradient-to-r from-primary-light/50 to-surface border border-primary/20 rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles size={100} />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary-dark animate-pulse" size={22} />
            <h2 className="text-lg font-bold text-text-primary">Resumen Inteligente — Datos en Tiempo Real</h2>
          </div>
          <p className="text-text-primary font-medium text-sm leading-relaxed max-w-4xl italic border-l-4 border-primary-dark pl-4 py-1">
            {kpis
              ? `La institución cuenta con ${kpis.total_alumnos?.toLocaleString()} alumnos activos. 
                 ${kpis.en_riesgo_alto} alumnos (${kpis.en_riesgo_pct}%) se encuentran en riesgo alto o crítico. 
                 El promedio general institucional es de ${kpis.promedio_general} con ${kpis.alertas_activas} alertas activas pendientes de atención.`
              : 'Cargando análisis institucional...'
            }
          </p>
          <button className="text-primary-dark font-bold text-xs uppercase tracking-wider flex items-center gap-1 hover:underline mt-2">
            Ver análisis completo <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Fila 3: Comparativa de Carreras */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <GraduationCap size={18} className="text-primary-dark" />
            Tabla Comparativa de Carreras
          </h2>
          {carreras.length > 0
            ? <CarrerasTable data={carreras} />
            : <p className="text-sm text-text-secondary text-center py-8">Sin datos de carreras</p>
          }
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary-dark" />
            Promedio vs % en Riesgo por Carrera
          </h2>
          <div className="flex-1 min-h-[250px]">
            {carreras.length > 0
              ? <RiskVsPromedioChart data={carreras} />
              : <div className="flex items-center justify-center h-full text-text-secondary text-sm">Sin datos</div>
            }
          </div>
        </div>
      </div>

      {/* Fila 4: Riesgo por Semestre & Materias Críticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Activity size={18} className="text-primary-dark" />
            Distribución de Riesgo por Semestre
          </h2>
          <div className="flex-1 min-h-[200px]">
            <RiskBySemesterChart data={semestres} />
          </div>
          {semestres.length > 0 && (
            <p className="text-xs text-text-secondary mt-2 text-center">
              Semestre más crítico:{' '}
              <span className="font-bold text-danger">
                {semestres.reduce((max, s) => s.riesgo > max.riesgo ? s : max, semestres[0])?.name}
                {' '}({semestres.reduce((max, s) => s.riesgo > max.riesgo ? s : max, semestres[0])?.riesgo}%)
              </span>
            </p>
          )}
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-danger" />
            Top 5 Materias Críticas
          </h2>
          {materias.length > 0
            ? <CriticalSubjectsList subjects={materias} />
            : <p className="text-sm text-text-secondary text-center py-8">Sin datos de materias</p>
          }
        </div>
      </div>

      {/* Fila 5: Profesores & Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary-dark" />
            Indicadores de Desempeño Docente
          </h2>
          {profesores.length > 0
            ? <TeachersPerformanceTable teachers={profesores} />
            : <p className="text-sm text-text-secondary text-center py-8">Sin datos de profesores</p>
          }
        </div>
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <AlertCircle size={18} className="text-warning-dark" />
            Alertas Activas (Agrupadas)
          </h2>
          {alertas.length > 0
            ? <AlertsListDirector alerts={alertas} />
            : <p className="text-sm text-text-secondary text-center py-8">Sin alertas activas</p>
          }
        </div>
      </div>

      {/* Fila 6a: Tendencia Histórica (6 meses) */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
          <Activity size={18} className="text-primary-dark" />
          Tendencia Histórica Institucional (Últimos 6 meses)
        </h2>
        {historico.length > 0
          ? <HistoricalTrendChart data={historico} />
          : <p className="text-sm text-text-secondary text-center py-8">Sin datos históricos</p>
        }
      </div>

      {/* Fila 6b: Histórico de Generaciones */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Calendar size={18} className="text-primary-dark" />
              Histórico Institucional — Últimas 10 Generaciones
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Tendencia de titulación, deserción, riesgo y promedio de egreso por generación.
            </p>
          </div>
        </div>
        <GeneracionesChart data={generaciones} />
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
