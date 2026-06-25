import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';
import { useRol } from '../hooks/useRol.js';
import { api } from '../lib/api.js';
import StatCard from '../components/ui/StatCard.jsx';
import RiskBadge from '../components/ui/RiskBadge.jsx';
import RiskBar from '../components/ui/RiskBar.jsx';
import RecommendationCard from '../components/ui/RecommendationCard.jsx';
import AlertCard from '../components/ui/AlertCard.jsx';
import RiskTrendChart from '../components/charts/RiskTrendChart.jsx';
import CarreraCompareChart from '../components/charts/CarreraCompareChart.jsx';

import { 
  Users, 
  GraduationCap, 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Award,
  Calendar,
  Loader2
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { esAlumno, esTutor, esJefeCarrera, esDirector, esAdmin } = useRol();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de datos
  const [alumnos, setAlumnos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [comparativa, setComparativa] = useState([]);
  const [distribucion, setDistribucion] = useState([]);
  const [alumnoDetalle, setAlumnoDetalle] = useState(null);
  const [alumnoRiesgo, setAlumnoRiesgo] = useState(null);
  const [iaResumen, setIaResumen] = useState(null);
  const [bienestarForm, setBienestarForm] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError(null);
      try {
        if (esAlumno) {
          // Cargar datos propios del alumno
          const alums = await api.get('/alumnos');
          if (alums && alums.length > 0) {
            const alum = alums[0];
            setAlumnoDetalle(alum);
            
            // Cargar predicción de riesgo y calificaciones
            const riesgo = await api.get(`/alumnos/${alum.id}/riesgo`);
            setAlumnoRiesgo(riesgo);
            
            const bienestar = await api.get(`/alumnos/${alum.id}/bienestar`);
            if (bienestar && bienestar.length > 0) {
              setBienestarForm(bienestar[0]);
            }
          }
        } 
        
        else if (esTutor) {
          // Alumnos asignados y alertas activas
          const alums = await api.get('/alumnos');
          setAlumnos(alums);
          const alerts = await api.get('/alertas');
          setAlertas(alerts.filter(a => a.estado === 'activa'));
        } 
        
        else if (esJefeCarrera) {
          // KPIs de carrera y alumnos de la carrera
          const alums = await api.get('/alumnos');
          setAlumnos(alums);
          const alerts = await api.get('/alertas');
          setAlertas(alerts.filter(a => a.estado === 'activa'));
          const dist = await api.get('/reportes/riesgo-distribucion');
          setDistribucion(dist);
        } 
        
        else if (esDirector || esAdmin) {
          // Vista institucional global
          const kpiData = await api.get('/reportes/universidad');
          setKpis(kpiData);
          const compData = await api.get('/reportes/comparativa-carreras');
          setComparativa(compData);
          const distData = await api.get('/reportes/riesgo-distribucion');
          setDistribucion(distData);
          
          // Generar resumen ejecutivo IA opcional
          try {
            const resIA = await api.post('/ia/resumen-ejecutivo');
            setIaResumen(resIA);
          } catch (iaErr) {
            console.warn('Resumen ejecutivo IA no disponible:', iaErr.message);
          }
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
        setError('Error al cargar los datos del tablero. Asegúrate de estar conectado a la base de datos.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user]);


  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-dark" size={32} />
        <p className="text-text-secondary font-medium">Cargando tablero institucional...</p>
      </div>
    );
  }

  // --- RENDERIZACIÓN POR ROL ---

  // 1. Vista Alumno
  if (esAlumno) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-surface border border-border p-6 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">Hola, {user?.nombre}</h1>
            <p className="text-text-secondary text-sm">
              Expediente de Bienestar e Inteligencia Académica | Matrícula: {alumnoDetalle?.matricula}
            </p>
          </div>
          {alumnoRiesgo && (
            <div className="text-right">
              <p className="text-xs text-text-secondary font-semibold uppercase mb-1">Nivel de Riesgo IA</p>
              <RiskBadge nivel={alumnoRiesgo.nivel_riesgo} size="lg" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Promedio General" 
            value={alumnoDetalle?.promedio_general || 'N/A'} 
            icon={<GraduationCap />} 
            trend="Estable" 
          />
          <StatCard 
            title="Semestre Actual" 
            value={alumnoDetalle?.semestre_actual || '1'} 
            icon={<Calendar />} 
          />
          <StatCard 
            title="Horas de Sueño" 
            value={bienestarForm?.horas_sueno ? `${bienestarForm.horas_sueno}h` : '7.0h'} 
            icon={<Clock />} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Factores XAI */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-primary-dark" />
              Factores de Riesgo Explicables (IA)
            </h2>
            <div className="space-y-1">
              {alumnoRiesgo?.factores_json && alumnoRiesgo.factores_json.length > 0 ? (
                alumnoRiesgo.factores_json.map((f, i) => (
                  <RiskBar 
                    key={i} 
                    nombre={f.nombre} 
                    contribucion={f.contribucion} 
                    valor={f.valor} 
                    umbral={f.umbral} 
                    tendencia={f.tendencia}
                  />
                ))
              ) : (
                <p className="text-sm text-text-secondary">No hay factores de riesgo activos.</p>
              )}
            </div>
          </div>

          {/* Recomendaciones */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-primary-dark" />
              Recomendaciones del Sistema
            </h2>
            <div className="space-y-3">
              {alumnoRiesgo?.recomendaciones_json && alumnoRiesgo.recomendaciones_json.length > 0 ? (
                alumnoRiesgo.recomendaciones_json.map((r, i) => (
                  <RecommendationCard 
                    key={i} 
                    tipo={r.tipo} 
                    descripcion={r.descripcion} 
                    prioridad={r.prioridad} 
                  />
                ))
              ) : (
                <p className="text-sm text-text-secondary">Felicidades, no tienes recomendaciones pendientes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Vista Tutor
  if (esTutor) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Panel de Tutorías</h1>
          <p className="text-text-secondary text-sm">Alumnos bajo tu tutoría y alertas de atención pendientes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Alumnos Asignados" value={alumnos.length} icon={<Users />} />
          <StatCard title="Alertas Activas" value={alertas.length} icon={<AlertTriangle />} trendType={alertas.length > 0 ? 'down' : 'up'} trend={alertas.length > 0 ? 'Atención' : 'Estable'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Listado de alumnos */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
            <h2 className="text-base font-bold text-text-primary mb-4">Mis Alumnos Asignados</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-semibold">
                    <th className="pb-3">Nombre</th>
                    <th className="pb-3">Matrícula</th>
                    <th className="pb-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {alumnos.map(al => (
                    <tr key={al.id} className="hover:bg-primary-light/30 transition-colors">
                      <td className="py-3.5 font-medium text-text-primary">
                        {al.usuarios?.nombre || 'Alumno'}
                      </td>
                      <td className="py-3.5 font-mono-data text-xs text-text-secondary">
                        {al.matricula}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link 
                          to={`/alumnos/${al.id}`} 
                          className="bg-primary-light text-primary-dark px-3 py-1.5 rounded-xl font-semibold hover:bg-primary hover:text-white transition-all text-xs"
                        >
                          Ver Ficha
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-text-primary">Alertas Recientes</h2>
            {alertas.length > 0 ? (
              alertas.map(al => (
                <AlertCard 
                  key={al.id} 
                  alert={al} 
                  onAcknowledge={() => navigate(`/alumnos/${al.alumno_id}`)}
                  showActions={false}
                />
              ))
            ) : (
              <div className="bg-surface border border-border rounded-xl p-4 text-center text-text-secondary text-sm">
                No hay alertas activas.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Vista Jefe de Carrera
  if (esJefeCarrera) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Panel de Coordinación</h1>
          <p className="text-text-secondary text-sm">Monitoreo académico estratégico de la carrera.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Alumnos Inscritos" value={alumnos.length} icon={<Users />} />
          <StatCard title="Alertas Activas" value={alertas.length} icon={<AlertTriangle />} />
          <StatCard title="Índice de Riesgo" value={`${Math.round((alertas.length / (alumnos.length || 1)) * 100)}%`} icon={<TrendingUp />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Distribución Gráfico */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-text-primary mb-4">Riesgo por Categoría (IA)</h2>
            <RiskTrendChart data={distribucion} />
          </div>

          {/* Alumnos en Riesgo */}
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-bold text-text-primary">Estudiantes con Alerta Activa</h2>
              <Link to="/alumnos" className="text-primary-dark font-semibold text-xs hover:underline">Ver todos</Link>
            </div>
            <div className="space-y-3">
              {alumnos.slice(0, 4).map(al => (
                <div key={al.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-primary-light/20 transition-all">
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary">{al.usuarios?.nombre}</h4>
                    <p className="text-xs text-text-secondary">Matrícula: {al.matricula} | Promedio: {al.promedio_general}</p>
                  </div>
                  <Link 
                    to={`/alumnos/${al.id}`} 
                    className="text-xs font-semibold bg-primary-light text-primary-dark hover:bg-primary hover:text-white px-3 py-1.5 rounded-xl transition-all"
                  >
                    Ver Expediente
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Vista Director/Admin
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Panel de Inteligencia Institucional</h1>
        <p className="text-text-secondary text-sm">Resumen global estratégico de la institución educativa.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Matrícula Total" value={kpis?.total_alumnos || 0} icon={<Users />} />
        <StatCard title="Promedio General" value={kpis?.promedio_general || 0} icon={<GraduationCap />} />
        <StatCard title="Alertas Activas" value={kpis?.alertas_activas || 0} icon={<AlertTriangle />} />
      </div>

      {/* Resumen Ejecutivo IA */}
      {iaResumen && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Sparkles className="text-primary-dark animate-pulse" size={20} />
            <h2 className="text-base font-bold text-text-primary">Resumen Estratégico AI (XAI)</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-secondary uppercase">KPI de Riesgo</span>
              <p className="text-sm text-text-primary font-medium">{iaResumen.kpi_riesgo_general}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-secondary uppercase">Carrera Crítica</span>
              <p className="text-sm text-text-primary font-medium">{iaResumen.carreras_criticas}</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-text-secondary uppercase">Tendencias Generales</span>
              <p className="text-sm text-text-primary font-medium">{iaResumen.tendencias_semestre}</p>
            </div>
          </div>
          <div className="bg-primary-light/40 border border-primary/20 p-4 rounded-xl space-y-2">
            <span className="text-xs font-bold text-primary-dark uppercase">Recomendaciones del Sistema</span>
            <ul className="list-disc pl-4 space-y-1 text-sm text-text-primary font-medium">
              {iaResumen.recomendaciones_estrategicas?.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Comparativa */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <GraduationCap size={18} className="text-primary-dark" />
            Promedio General por Carrera
          </h2>
          <CarreraCompareChart data={comparativa} />
        </div>

        {/* Distribución General */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary-dark" />
            Distribución de Alumnos por Riesgo
          </h2>
          <RiskTrendChart data={distribucion} />
        </div>
      </div>
    </div>
  );
}
