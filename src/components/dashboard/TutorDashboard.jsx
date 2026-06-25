import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import StatCard from '../ui/StatCard.jsx';
import {
  Users, AlertTriangle, GraduationCap, Clock, Award,
  Calendar, CheckCircle, ArrowRight, Eye, Edit3, X,
  TrendingUp, TrendingDown, Minus, Info, CalendarClock,
  Sparkles, CheckSquare, Loader2, RefreshCw, Send, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Area, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

// Configuration for risk levels styling (no plain circles/squares, using professional badges)
const RIESGO_ESTILOS = {
  critico: {
    label: 'Riesgo Crítico',
    text: 'text-red-400 border-red-500/30 bg-red-950/40',
    barBg: 'bg-red-950',
    barFill: 'bg-gradient-to-r from-red-600 to-red-500',
    border: 'border-red-500/50'
  },
  alto: {
    label: 'Riesgo Alto',
    text: 'text-orange-400 border-orange-500/30 bg-orange-950/40',
    barBg: 'bg-orange-950',
    barFill: 'bg-gradient-to-r from-orange-500 to-amber-500',
    border: 'border-orange-500/50'
  },
  medio: {
    label: 'Riesgo Medio',
    text: 'text-amber-400 border-amber-500/30 bg-amber-950/40',
    barBg: 'bg-amber-950',
    barFill: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    border: 'border-amber-500/50'
  },
  bajo: {
    label: 'Riesgo Bajo',
    text: 'text-emerald-400 border-emerald-500/30 bg-emerald-950/40',
    barBg: 'bg-emerald-950',
    barFill: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    border: 'border-emerald-500/50'
  }
};

const RESULTADO_ESTILOS = {
  'mejoro': { label: 'Mejoró', style: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40', icon: <TrendingUp size={12} /> },
  'igual': { label: 'Igual', style: 'text-slate-400 bg-slate-950/30 border-slate-800/40', icon: <Minus size={12} /> },
  'empeoro': { label: 'Empeoró', style: 'text-red-400 bg-red-950/30 border-red-800/40', icon: <TrendingDown size={12} /> },
  '—': { label: '—', style: 'text-text-secondary bg-surface-alt border-border', icon: null }
};

export default function TutorDashboard() {
  // Loading & State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [resumen, setResumen] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [alertasUrgentes, setAlertasUrgentes] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  
  // Drawer (Quick profile)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAlumnoId, setSelectedAlumnoId] = useState(null);
  const [alumnoDetalle, setAlumnoDetalle] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  
  // Seguimiento Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [selectedAlertStudent, setSelectedAlertStudent] = useState(null);
  const [submittingSeguimiento, setSubmittingSeguimiento] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    tipo: 'tutoria',
    fecha: new Date().toISOString().substring(0, 10),
    hora: '10:30',
    observaciones: '',
    resultado: 'igual',
    cerrarAlerta: false,
    canalizarPsico: false,
    canalizarAcademico: false,
    programarSesion: false,
    diasProgramacion: '14'
  });

  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resResumen, resKpis, resAlerts, resAlumnos, resStats] = await Promise.allSettled([
        api.get('/tutor/resumen'),
        api.get('/tutor/kpis'),
        api.get('/tutor/alertas-urgentes'),
        api.get('/tutor/alumnos'),
        api.get('/tutor/estadisticas')
      ]);

      if (resResumen.status === 'fulfilled') setResumen(resResumen.value);
      if (resKpis.status === 'fulfilled') setKpis(resKpis.value);
      if (resAlerts.status === 'fulfilled') setAlertasUrgentes(resAlerts.value);
      if (resAlumnos.status === 'fulfilled') setAlumnos(resAlumnos.value);
      if (resStats.status === 'fulfilled') setEstadisticas(resStats.value);

      // Check if any critical API failed
      if (resAlumnos.status === 'rejected') {
        throw new Error('No se pudieron cargar los alumnos asignados.');
      }
    } catch (err) {
      console.error('Error loading tutor dashboard data:', err);
      setError('Ocurrió un error al cargar la información. Revisa tu conexión con la base de datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Load detailed student data for the drawer
  const loadStudentDetails = async (alumnoId) => {
    setLoadingDetalle(true);
    setDrawerOpen(true);
    setSelectedAlumnoId(alumnoId);
    try {
      const data = await api.get(`/tutor/alumno/${alumnoId}`);
      setAlumnoDetalle(data);
    } catch (err) {
      console.error('Error fetching student details:', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  // Open the seguimiento registration modal
  const openSeguimientoModal = (studentId, alertId = null, studentName = '') => {
    setSelectedAlertStudent({ id: studentId, nombre: studentName });
    setSelectedAlertId(alertId);
    setFormData({
      tipo: 'tutoria',
      fecha: new Date().toISOString().substring(0, 10),
      hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }),
      observaciones: '',
      resultado: 'igual',
      cerrarAlerta: !!alertId, // Default to true if opening from an alert card
      canalizarPsico: false,
      canalizarAcademico: false,
      programarSesion: false,
      diasProgramacion: '14'
    });
    setModalOpen(true);
  };

  // Handle seguimiento submission
  const handleSaveSeguimiento = async (e) => {
    e.preventDefault();
    setSubmittingSeguimiento(true);
    try {
      const payload = {
        alumno_id: selectedAlertStudent.id,
        alerta_id: selectedAlertId,
        tipo: formData.tipo,
        observaciones: formData.observaciones,
        resultado: formData.resultado,
        cerrar_alerta: formData.cerrarAlerta,
        fecha: `${formData.fecha}T${formData.hora}:00.000Z`
      };

      await api.post('/tutor/seguimiento', payload);
      
      // Close modal and drawer
      setModalOpen(false);
      setDrawerOpen(false);
      
      // Reload everything
      await loadDashboardData();
    } catch (err) {
      console.error('Error saving tracking session:', err);
      alert('Error al guardar el seguimiento. Por favor, intente de nuevo.');
    } finally {
      setSubmittingSeguimiento(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-12rem)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-dark" size={36} />
        <p className="text-text-secondary font-medium">Cargando contexto del tutor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/20 border border-red-700/30 p-6 rounded-2xl text-center space-y-4 max-w-lg mx-auto mt-10">
        <AlertCircle className="mx-auto text-red-500" size={40} />
        <h3 className="font-bold text-text-primary text-lg">Error de Conexión</h3>
        <p className="text-sm text-text-secondary">{error}</p>
        <button
          onClick={loadDashboardData}
          className="bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 mx-auto hover:bg-primary transition-all"
        >
          <RefreshCw size={14} /> Intentar de nuevo
        </button>
      </div>
    );
  }

  // Filter students based on search query
  const filteredAlumnos = alumnos.filter(al =>
    al.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    al.matricula.includes(searchTerm)
  );

  return (
    <div className="space-y-6 relative pb-10">
      
      {/* 1. Encabezado Personal — Contexto de hoy */}
      <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Buen día, {resumen?.nombre || 'Tutor'}
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-1">
            {resumen?.fecha || 'Hoy'} · {resumen?.total_alumnos || 0} alumnos asignados
          </p>
        </div>
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <CalendarClock className="text-primary-dark" size={20} />
          <div>
            <div className="text-xs text-text-secondary font-semibold uppercase leading-none">Pendientes hoy</div>
            <div className="text-lg font-bold text-text-primary mt-1">
              {resumen?.pendientes_hoy || 0} de atención
            </div>
          </div>
        </div>
      </div>

      {/* 2. Alertas Urgentes — Lo primero que ve */}
      {alertasUrgentes.length > 0 && (
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <AlertTriangle className="text-red-500 animate-pulse" size={18} />
            Requieren atención hoy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alertasUrgentes.map(al => {
              const cfg = RIESGO_ESTILOS[al.nivel_riesgo] || RIESGO_ESTILOS.medio;
              return (
                <div key={al.id} className="bg-surface-alt border border-border/80 rounded-xl p-4 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="font-bold text-text-primary text-sm line-clamp-1">{al.nombre}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    
                    <p className="text-xs text-text-secondary mb-3 flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono">{al.matricula}</span>
                      <span>·</span>
                      <span>Promedio: <strong className="text-text-primary">{al.promedio || '—'}</strong></span>
                      <span>·</span>
                      <span className="text-red-400 font-semibold">{al.tipo_alerta}</span>
                    </p>

                    <div className="text-xs text-text-secondary bg-surface p-2.5 rounded-lg border border-border/50 mb-4 line-clamp-2">
                      {al.descripcion}
                    </div>

                    <p className="text-[11px] text-text-secondary flex items-center gap-1.5 mb-3">
                      <Clock size={12} />
                      Última sesión: <span className="text-text-primary font-medium">{al.ultima_sesion}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50">
                    <button
                      onClick={() => loadStudentDetails(al.alumno_id)}
                      className="text-xs font-semibold text-text-primary hover:text-primary-dark flex items-center justify-center gap-1.5 py-1.5 bg-surface rounded-lg border border-border hover:border-primary/30 transition-all"
                    >
                      <Eye size={12} /> Ver
                    </button>
                    <button
                      onClick={() => openSeguimientoModal(al.alumno_id, al.id, al.nombre)}
                      className="text-xs font-semibold text-white bg-primary-dark hover:bg-primary flex items-center justify-center gap-1.5 py-1.5 rounded-lg shadow-sm transition-all"
                    >
                      <Edit3 size={12} /> Registrar sesión
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. KPIs de su grupo — Fila rápida */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Mis Alumnos"
          value={kpis?.total_alumnos || 0}
          icon={<Users className="text-indigo-400" />}
        />
        <StatCard
          title="Riesgo Alto / Crítico"
          value={`${kpis?.riesgo_alto_critico || 0} (${kpis?.riesgo_alto_pct || 0}%)`}
          icon={<AlertTriangle className="text-red-400" />}
          trend="Pacientes críticos"
          trendType="down"
        />
        <StatCard
          title="Mejoraron este mes"
          value={`${kpis?.mejoraron_mes || 0} alumnos`}
          icon={<Award className="text-emerald-400" />}
          trend="Intervenciones efectivas"
        />
        <StatCard
          title="Sesiones este mes"
          value={kpis?.sesiones_mes || 0}
          icon={<CheckCircle className="text-primary-light" />}
          trend="Total acumulado"
        />
      </div>

      {/* 4. Mis Alumnos — Lista principal */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-base font-bold text-text-primary">Mis Alumnos Asignados</h2>
            <p className="text-xs text-text-secondary">Expedientes académicos ordenados por prioridad de riesgo.</p>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o matrícula..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="text-xs bg-surface-alt border border-border rounded-xl px-4 py-2 w-full sm:max-w-xs text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-text-secondary font-semibold text-xs uppercase tracking-wider">
                <th className="pb-3">Alumno</th>
                <th className="pb-3">Semestre</th>
                <th className="pb-3">Riesgo IA</th>
                <th className="pb-3">Última sesión</th>
                <th className="pb-3">Resultado</th>
                <th className="pb-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAlumnos.length > 0 ? (
                filteredAlumnos.map(al => {
                  const cfg = RIESGO_ESTILOS[al.riesgo] || RIESGO_ESTILOS.medio;
                  const res = RESULTADO_ESTILOS[al.resultado] || RESULTADO_ESTILOS['—'];
                  return (
                    <tr key={al.id} className="hover:bg-primary-light/10 transition-colors group">
                      <td className="py-3.5">
                        <div className="font-semibold text-text-primary text-sm group-hover:text-primary-light transition-colors">
                          {al.nombre}
                        </div>
                        <div className="text-[11px] font-mono text-text-secondary">{al.matricula}</div>
                      </td>
                      <td className="py-3.5 text-text-secondary text-sm">
                        {al.semestre}° Semestre
                      </td>
                      <td className="py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${cfg.text}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {al.never_attended ? (
                          <span className="text-red-400 font-semibold flex items-center gap-1.5 text-xs">
                            <AlertCircle size={14} className="shrink-0" /> Nunca atendido
                          </span>
                        ) : (
                          <span className="text-text-primary text-sm">{al.ultima_sesion}</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs border font-medium ${res.style}`}>
                          {res.icon} {res.label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => loadStudentDetails(al.id)}
                          className="bg-primary-light/20 text-primary-dark group-hover:bg-primary-dark group-hover:text-white px-3 py-1.5 rounded-xl font-semibold transition-all text-xs flex items-center gap-1.5 ml-auto border border-primary-dark/10"
                        >
                          <Eye size={12} /> Ver Ficha
                        </button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-text-secondary text-sm">
                    No se encontraron alumnos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Perfil Rápido del Alumno — Panel Lateral (Drawer) */}
      <div className={`fixed inset-y-0 right-0 w-full sm:max-w-md bg-surface border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {loadingDetalle ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Loader2 className="animate-spin text-primary-dark" size={32} />
            <p className="text-text-secondary text-sm font-medium">Cargando expediente...</p>
          </div>
        ) : alumnoDetalle ? (
          <>
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex justify-between items-start bg-surface-alt">
              <div>
                <h3 className="font-bold text-text-primary text-base line-clamp-1">{alumnoDetalle.perfil.nombre}</h3>
                <p className="text-xs text-text-secondary font-mono mt-0.5">
                  {alumnoDetalle.perfil.matricula} · {alumnoDetalle.perfil.semestre}° Semestre
                </p>
                <p className="text-[10px] text-text-secondary mt-1 font-medium bg-primary-light/10 border border-primary/20 px-2 py-0.5 rounded-md inline-block">
                  {alumnoDetalle.perfil.carrera}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-all border border-border/40"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Nivel de Riesgo Gauge */}
              <div className={`border rounded-xl p-4 ${RIESGO_ESTILOS[alumnoDetalle.riesgo.nivel]?.border || 'border-border'} bg-surface-alt`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-text-secondary font-semibold uppercase">Riesgo IA</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border ${(RIESGO_ESTILOS[alumnoDetalle.riesgo.nivel] || RIESGO_ESTILOS.bajo).text}`}>
                    {(RIESGO_ESTILOS[alumnoDetalle.riesgo.nivel] || RIESGO_ESTILOS.bajo).label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 bg-surface rounded-full overflow-hidden border border-border/50">
                    <div 
                      className={`h-full ${(RIESGO_ESTILOS[alumnoDetalle.riesgo.nivel] || RIESGO_ESTILOS.bajo).barFill}`}
                      style={{ width: `${alumnoDetalle.riesgo.porcentaje}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-text-primary">{alumnoDetalle.riesgo.porcentaje}%</span>
                </div>
              </div>

              {/* Factores detectados por IA (XAI) */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Sparkles size={14} className="text-primary-dark" />
                  Factores de riesgo (XAI)
                </h4>
                <div className="space-y-2.5">
                  {alumnoDetalle.riesgo.factores && alumnoDetalle.riesgo.factores.length > 0 ? (
                    alumnoDetalle.riesgo.factores.map((f, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-text-primary">{f.nombre}</span>
                          <span className="text-red-400 font-semibold">+{Math.round(f.contribucion * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500/80 rounded-full" 
                            style={{ width: `${Math.min(100, f.contribucion * 200)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-text-secondary bg-surface-alt p-3 rounded-lg border border-border text-center">
                      No se detectaron factores de riesgo críticos.
                    </div>
                  )}
                </div>
              </div>

              {/* Recomendaciones IA */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <CheckSquare size={14} className="text-primary-dark" />
                  Recomendaciones recomendadas
                </h4>
                <ul className="space-y-2">
                  {alumnoDetalle.riesgo.recomendaciones && alumnoDetalle.riesgo.recomendaciones.length > 0 ? (
                    alumnoDetalle.riesgo.recomendaciones.map((r, i) => (
                      <li key={i} className="text-xs text-text-primary bg-primary-light/5 border border-primary/10 rounded-lg p-2.5 flex items-start gap-2 shadow-sm">
                        <ArrowRight size={12} className="text-primary-dark shrink-0 mt-0.5" />
                        <span>{r.descripcion || r}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-text-secondary bg-surface-alt p-3 rounded-lg border border-border text-center">
                      No hay recomendaciones pendientes.
                    </li>
                  )}
                </ul>
              </div>

              {/* Calificaciones actuales */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-primary-dark" />
                  Calificaciones actuales
                </h4>
                <div className="space-y-2">
                  {alumnoDetalle.calificaciones && alumnoDetalle.calificaciones.length > 0 ? (
                    alumnoDetalle.calificaciones.map((m, i) => (
                      <div key={i} className="flex justify-between items-center text-xs bg-surface-alt border border-border/80 p-2.5 rounded-lg">
                        <span className="font-semibold text-text-primary line-clamp-1 flex-1 pr-2">{m.nombre}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${m.promedio < 6.0 ? 'text-red-400' : m.promedio >= 8.5 ? 'text-emerald-400' : 'text-text-primary'}`}>
                            {m.promedio}
                          </span>
                          {m.promedio < 6.0 ? (
                            <TrendingDown size={14} className="text-red-400" />
                          ) : m.promedio >= 8.5 ? (
                            <TrendingUp size={14} className="text-emerald-400" />
                          ) : (
                            <Minus size={14} className="text-slate-400" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-text-secondary bg-surface-alt p-3 rounded-lg border border-border text-center">
                      No hay calificaciones registradas este periodo.
                    </div>
                  )}
                </div>
              </div>

              {/* Asistencia */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-text-secondary uppercase">Asistencia</span>
                  <span className={alumnoDetalle.perfil.asistencia_pct < 80 ? 'text-red-400 font-bold flex items-center gap-1' : 'text-text-primary font-bold'}>
                    {alumnoDetalle.perfil.asistencia_pct}% {alumnoDetalle.perfil.asistencia_pct < 80 && <AlertTriangle size={14} className="text-red-400 shrink-0" />}
                  </span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${alumnoDetalle.perfil.asistencia_pct < 80 ? 'bg-red-500' : 'bg-emerald-500'}`}
                    style={{ width: `${alumnoDetalle.perfil.asistencia_pct}%` }}
                  />
                </div>
                {alumnoDetalle.perfil.asistencia_pct < 80 && (
                  <p className="text-[10px] text-red-400 leading-tight">
                    Por debajo del 80% mínimo reglamentario. Requiere atención inmediata.
                  </p>
                )}
              </div>

              {/* Timeline de intervenciones */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 border-b border-border pb-2">
                  <Clock size={14} className="text-primary-dark" />
                  Historial de intervenciones
                </h4>
                
                {alumnoDetalle.timeline && alumnoDetalle.timeline.length > 0 ? (
                  <div className="relative border-l border-border pl-4 space-y-5 ml-1.5 py-1">
                    {alumnoDetalle.timeline.map((item, idx) => {
                      const isAlert = item.tipo === 'alerta';
                      return (
                        <div key={item.id} className="relative">
                          {/* Dot indicator */}
                          <span className={`absolute -left-[21px] mt-1 w-2.5 h-2.5 rounded-full border-2 border-surface ${isAlert ? 'bg-red-500 animate-pulse' : 'bg-primary-dark'}`} />
                          
                          <div>
                            <span className="text-[10px] text-text-secondary font-medium">
                              {new Date(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <h5 className="text-xs font-bold text-text-primary mt-0.5">{item.titulo}</h5>
                            <p className="text-[11px] text-primary-light font-semibold">{item.subtitulo}</p>
                            <p className="text-xs text-text-secondary mt-1.5 bg-surface-alt p-2 rounded border border-border/50">
                              {item.descripcion}
                            </p>
                            {item.resultado && (
                              <span className="inline-block text-[9px] font-bold text-emerald-400 border border-emerald-800/30 bg-emerald-950/20 px-1.5 py-0.5 rounded mt-1.5">
                                Resultado: {item.resultado.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-text-secondary bg-surface-alt p-3 rounded-lg border border-border text-center">
                    No se han registrado seguimientos o alertas previas.
                  </div>
                )}
              </div>

            </div>

            {/* Drawer Footer Action */}
            <div className="p-4 border-t border-border bg-surface-alt">
              <button
                onClick={() => openSeguimientoModal(alumnoDetalle.perfil.id, null, alumnoDetalle.perfil.nombre)}
                className="w-full bg-primary-dark hover:bg-primary text-white py-2.5 rounded-xl text-xs font-semibold shadow flex items-center justify-center gap-2 transition-all"
              >
                <Edit3 size={14} /> Registrar nuevo seguimiento
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* 6. Formulario de Registro de Seguimiento — Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex justify-between items-center bg-surface-alt">
              <div>
                <h3 className="font-bold text-text-primary text-base">Nueva sesión de tutoría</h3>
                <p className="text-xs text-primary-light font-semibold mt-0.5">
                  Alumno: {selectedAlertStudent?.nombre}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg border border-border/50 hover:bg-surface"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSeguimiento} className="p-5 space-y-4">
              
              {/* Intervencion type buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Tipo de intervención
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: 'tutoria', lbl: 'Tutoría académica' },
                    { val: 'orientacion', lbl: 'Orientación' },
                    { val: 'seguimiento', lbl: 'Seguimiento' },
                    { val: 'observacion', lbl: 'Cierre de alerta' }
                  ].map(t => (
                    <button
                      key={t.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, tipo: t.val })}
                      className={`text-xs font-semibold py-2 rounded-lg border transition-all ${formData.tipo === t.val ? 'bg-primary-dark text-white border-primary-dark shadow-sm' : 'bg-surface-alt text-text-secondary border-border hover:bg-surface hover:text-text-primary'}`}
                    >
                      {t.lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                    required
                    className="w-full text-xs bg-surface-alt border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Hora</label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={e => setFormData({ ...formData, hora: e.target.value })}
                    required
                    className="w-full text-xs bg-surface-alt border border-border rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Observations textarea */}
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Observaciones</label>
                <textarea
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Escriba las notas de la sesión. Acuerdos y compromisos con el alumno..."
                  required
                  rows="4"
                  className="w-full text-xs bg-surface-alt border border-border rounded-lg px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>

              {/* Resultado Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Resultado de la intervención
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'mejoro', lbl: 'Mejoró' },
                    { val: 'igual', lbl: 'Igual' },
                    { val: 'empeoro', lbl: 'Empeoró' }
                  ].map(r => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, resultado: r.val })}
                      className={`text-xs font-semibold py-2 rounded-lg border transition-all ${formData.resultado === r.val ? 'bg-primary-dark text-white border-primary-dark shadow' : 'bg-surface-alt text-text-secondary border-border hover:bg-surface hover:text-text-primary'}`}
                    >
                      {r.lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action checkboxes */}
              <div className="space-y-2.5 pt-2 border-t border-border">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">Próximas acciones</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-surface-alt border border-border rounded-lg cursor-pointer hover:bg-surface">
                    <input
                      type="checkbox"
                      checked={formData.canalizarPsico}
                      onChange={e => setFormData({ ...formData, canalizarPsico: e.target.checked })}
                      className="rounded border-border bg-surface-alt text-primary-dark focus:ring-0"
                    />
                    <span className="text-text-primary">Canalizar a psicología</span>
                  </label>
                  
                  <label className="flex items-center gap-2 p-2 bg-surface-alt border border-border rounded-lg cursor-pointer hover:bg-surface">
                    <input
                      type="checkbox"
                      checked={formData.canalizarAcademico}
                      onChange={e => setFormData({ ...formData, canalizarAcademico: e.target.checked })}
                      className="rounded border-border bg-surface-alt text-primary-dark focus:ring-0"
                    />
                    <span className="text-text-primary">Canalizar a servicios académicos</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-surface-alt border border-border rounded-lg cursor-pointer hover:bg-surface">
                    <input
                      type="checkbox"
                      checked={formData.programarSesion}
                      onChange={e => setFormData({ ...formData, programarSesion: e.target.checked })}
                      className="rounded border-border bg-surface-alt text-primary-dark focus:ring-0"
                    />
                    <span className="text-text-primary">Agendar cita de seguimiento</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-surface-alt border border-border rounded-lg cursor-pointer hover:bg-surface">
                    <input
                      type="checkbox"
                      checked={formData.cerrarAlerta}
                      onChange={e => setFormData({ ...formData, cerrarAlerta: e.target.checked })}
                      className="rounded border-border bg-surface-alt text-primary-dark focus:ring-0"
                    />
                    <span className="text-red-400 font-semibold">Cerrar alerta de riesgo</span>
                  </label>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-border bg-surface text-text-primary rounded-xl text-xs font-semibold hover:bg-surface-alt transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingSeguimiento}
                  className="px-5 py-2 bg-primary-dark text-white rounded-xl text-xs font-semibold hover:bg-primary transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submittingSeguimiento ? (
                    <>
                      <Loader2 className="animate-spin" size={14} /> Guardando...
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Guardar seguimiento
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Mis Estadísticas Personales — Parte Inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Estadísticas cards */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-text-primary text-base">Efectividad este semestre</h3>
            <p className="text-xs text-text-secondary">Indicadores sobre la tutoría y atención a alertas.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-alt p-3.5 rounded-xl border border-border/80 text-center">
              <div className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Sesiones</div>
              <div className="text-2xl font-black text-text-primary mt-1">{estadisticas?.sesiones_totales || 0}</div>
            </div>
            <div className="bg-surface-alt p-3.5 rounded-xl border border-border/80 text-center">
              <div className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Mejorados</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{estadisticas?.alumnos_mejoraron || 0}</div>
            </div>
            <div className="bg-surface-alt p-3.5 rounded-xl border border-border/80 text-center">
              <div className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Alertas Atendidas</div>
              <div className="text-2xl font-black text-primary-light mt-1">{estadisticas?.alertas_atendidas || 0}</div>
            </div>
            <div className="bg-surface-alt p-3.5 rounded-xl border border-border/80 text-center">
              <div className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Tiempo Resp.</div>
              <div className="text-lg font-black text-text-primary mt-1.5">
                {estadisticas?.promedio_respuesta_dias || 0} días
              </div>
            </div>
          </div>

          <div className="bg-surface-alt p-3 rounded-xl border border-border flex items-center justify-between text-xs">
            <span className="text-text-secondary font-semibold">Canalizaciones registradas:</span>
            <span className="font-mono font-bold text-primary-light">{estadisticas?.canalizaciones || 0} alumnos</span>
          </div>
        </div>

        {/* Historial sesiones chart (profesional) */}
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 space-y-4">
          <div>
            <h3 className="font-bold text-text-primary text-base">Evolución e impacto mensual</h3>
            <p className="text-xs text-text-secondary">Comparación entre volumen de sesiones y tasa de efectividad (%).</p>
          </div>

          <div className="h-56">
            {estadisticas?.historico_sesiones && estadisticas.historico_sesiones.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={estadisticas.historico_sesiones}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3d" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} unit="%" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1f2e', borderColor: '#2e374d', borderRadius: '10px' }}
                    labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar yAxisId="left" dataKey="sesiones" fill="url(#colorSessions)" name="Sesiones Realizadas" barSize={32} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="efectividad" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, stroke: '#10b981', strokeWidth: 1.5, fill: '#1a1f2e' }} name="Efectividad (%)" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-text-secondary text-xs bg-surface-alt rounded-xl border border-border">
                No hay datos históricos suficientes.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
