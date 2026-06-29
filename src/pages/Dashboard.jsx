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
import DirectorDashboard from '../components/dashboard/DirectorDashboard.jsx';
import JefeCarreraDashboard from '../components/dashboard/JefeCarreraDashboard.jsx';
import TutorDashboard from '../components/dashboard/TutorDashboard.jsx';
import ProfesorDashboard from '../components/dashboard/ProfesorDashboard.jsx';

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
  const { esAlumno, esTutor, esJefeCarrera, esDirector, esAdmin, esProfesor } = useRol();
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
          // El TutorDashboard carga sus propios datos
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
    return <TutorDashboard />;
  }

  // 2b. Vista Profesor
  if (esProfesor) {
    return <ProfesorDashboard />;
  }

  // 3. Vista Jefe de Carrera — Dashboard completo
  if (esJefeCarrera) {
    return <JefeCarreraDashboard />;
  }

  // 4. Vista Director/Admin
  if (esDirector || esAdmin) {
    return <DirectorDashboard kpis={kpis} iaResumen={iaResumen} />;
  }

  return (
    <div className="h-full flex items-center justify-center text-text-secondary">
      No tienes un rol asignado válido.
    </div>
  );
}
