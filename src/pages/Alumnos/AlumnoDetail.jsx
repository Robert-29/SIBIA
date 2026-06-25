import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useRol } from '../../hooks/useRol.js';
import RiskBadge from '../../components/ui/RiskBadge.jsx';
import RiskBar from '../../components/ui/RiskBar.jsx';
import RecommendationCard from '../../components/ui/RecommendationCard.jsx';
import RiskTrendChart from '../../components/charts/RiskTrendChart.jsx';
import {
  ArrowLeft,
  Loader2,
  GraduationCap,
  Calendar,
  Clock,
  Heart,
  Brain,
  Sparkles,
  TrendingUp,
  BookOpen,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Activity,
  User,
  Mail,
  Hash
} from 'lucide-react';

export default function AlumnoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { esAlumno, esTutor, esPsicologo, esJefeCarrera, esAdmin, esRol } = useRol();

  const [loading, setLoading] = useState(true);
  const [alumno, setAlumno] = useState(null);
  const [riesgo, setRiesgo] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [asistencias, setAsistencias] = useState([]);
  const [bienestar, setBienestar] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [activeTab, setActiveTab] = useState('riesgo');

  // Estado del formulario de seguimiento
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState({
    tipo: 'tutoria',
    descripcion: '',
    acuerdos: ''
  });
  const [enviandoSeguimiento, setEnviandoSeguimiento] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      try {
        const alumnoData = await api.get(`/alumnos/${id}`);
        setAlumno(alumnoData);

        // Cargar en paralelo
        const [riesgoData, calData, asistData, bienestarData, segData] = await Promise.allSettled([
          api.get(`/alumnos/${id}/riesgo`),
          api.get(`/alumnos/${id}/calificaciones`),
          api.get(`/alumnos/${id}/asistencias`),
          api.get(`/alumnos/${id}/bienestar`),
          api.get(`/alumnos/${id}/seguimientos`)
        ]);

        if (riesgoData.status === 'fulfilled') setRiesgo(riesgoData.value);
        if (calData.status === 'fulfilled') setCalificaciones(calData.value);
        if (asistData.status === 'fulfilled') setAsistencias(asistData.value);
        if (bienestarData.status === 'fulfilled') setBienestar(bienestarData.value);
        if (segData.status === 'fulfilled') setSeguimientos(segData.value);
      } catch (err) {
        setError('Error al cargar expediente. Asegúrate de estar conectado.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [id]);



  const handleCrearSeguimiento = async (e) => {
    e.preventDefault();
    if (!nuevoSeguimiento.descripcion.trim()) return;

    setEnviandoSeguimiento(true);
    try {
      const nuevo = await api.post(`/alumnos/${id}/seguimientos`, nuevoSeguimiento);
      setSeguimientos(prev => [nuevo, ...prev]);
      setNuevoSeguimiento({ tipo: 'tutoria', descripcion: '', acuerdos: '' });
    } catch (err) {
      // Ya no insertaremos un mock
      console.error('Error al enviar el formulario.');
    } finally {
      setEnviandoSeguimiento(false);
    }
  };

  const puedeCrearSeguimiento = esRol(['administrador', 'jefe_carrera', 'tutor', 'psicologo']);

  const tabs = [
    { key: 'riesgo', label: 'Riesgo IA', icon: Brain },
    { key: 'calificaciones', label: 'Calificaciones', icon: BookOpen },
    { key: 'asistencias', label: 'Asistencias', icon: Calendar },
    { key: 'bienestar', label: 'Bienestar', icon: Heart },
    { key: 'seguimientos', label: 'Seguimientos', icon: FileText }
  ];

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-dark" size={32} />
        <p className="text-text-secondary font-medium">Cargando expediente del alumno...</p>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="text-warning" size={48} />
        <p className="text-text-secondary font-medium text-lg">Alumno no encontrado</p>
        <Link to="/alumnos" className="text-primary-dark font-semibold hover:underline text-sm">
          ← Volver al directorio
        </Link>
      </div>
    );
  }

  // Agrupar calificaciones por materia
  const calificacionesPorMateria = calificaciones.reduce((acc, cal) => {
    const materia = cal.materias?.nombre || 'Sin materia';
    if (!acc[materia]) {
      acc[materia] = { codigo: cal.materias?.codigo, calificaciones: [] };
    }
    acc[materia].calificaciones.push(cal);
    return acc;
  }, {});

  // Calcular % de asistencia
  const totalAsistencias = asistencias.length;
  const presentes = asistencias.filter(a => a.presente).length;
  const porcentajeAsistencia = totalAsistencias > 0 ? Math.round((presentes / totalAsistencias) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/alumnos')}
          className="p-2 rounded-xl hover:bg-primary-light text-text-secondary hover:text-primary-dark transition-all cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Expediente del Alumno
          </h1>
          <p className="text-text-secondary text-sm">
            Ficha integral de bienestar e inteligencia académica
          </p>
        </div>
      </div>

      {/* Card de identidad del alumno */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white text-2xl font-bold shadow-md">
              {(alumno.usuarios?.nombre || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                {alumno.usuarios?.nombre || 'Alumno'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-text-secondary">
                <span className="flex items-center gap-1">
                  <Mail size={13} />
                  {alumno.usuarios?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Hash size={13} />
                  {alumno.matricula}
                </span>
              </div>
              <p className="text-sm text-text-secondary mt-0.5">
                <GraduationCap size={13} className="inline mr-1" />
                {alumno.carreras?.nombre} — {alumno.semestre_actual}° Semestre
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center p-3 bg-bg rounded-xl border border-border">
              <p className="text-xs text-text-secondary font-semibold uppercase">Promedio</p>
              <p className="text-2xl font-bold font-mono-data text-text-primary">
                {alumno.promedio_general || 'N/A'}
              </p>
            </div>
            <div className="text-center p-3 bg-bg rounded-xl border border-border">
              <p className="text-xs text-text-secondary font-semibold uppercase">Asistencia</p>
              <p className={`text-2xl font-bold font-mono-data ${porcentajeAsistencia < 80 ? 'text-danger' : 'text-text-primary'}`}>
                {porcentajeAsistencia}%
              </p>
            </div>
            {riesgo && (
              <div className="text-center">
                <p className="text-xs text-text-secondary font-semibold uppercase mb-1">Nivel IA</p>
                <RiskBadge nivel={riesgo.nivel_riesgo} size="lg" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 ${
                  activeTab === tab.key
                    ? 'border-primary-dark text-primary-dark bg-primary-light/30'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* ===== TAB: RIESGO IA ===== */}
          {activeTab === 'riesgo' && (
            <div className="space-y-6">
              {riesgo ? (
                <>
                  {/* Resumen del riesgo */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-bg rounded-xl border border-border">
                    <div>
                      <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <Brain size={18} className="text-primary-dark" />
                        Predicción de Riesgo Académico
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Calculada mediante modelo de IA explicable (XAI). Última actualización automática.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-text-secondary font-semibold uppercase">Índice de Riesgo</p>
                        <p className="text-3xl font-bold font-mono-data text-text-primary">{riesgo.porcentaje_riesgo}%</p>
                      </div>
                      <RiskBadge nivel={riesgo.nivel_riesgo} size="lg" />
                    </div>
                  </div>

                  {/* Factores XAI */}
                  <div>
                    <h3 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary-dark" />
                      Factores Explicables (XAI)
                    </h3>
                    <p className="text-xs text-text-secondary mb-4">
                      Cada factor muestra su peso porcentual en la predicción total. A mayor peso, mayor influencia en el nivel de riesgo.
                    </p>
                    <div className="bg-bg rounded-xl border border-border p-4">
                      {riesgo.factores_json?.map((f, i) => (
                        <RiskBar
                          key={i}
                          nombre={f.nombre}
                          contribucion={f.contribucion}
                          valor={f.valor}
                          umbral={f.umbral}
                          tendencia={f.tendencia}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recomendaciones */}
                  <div>
                    <h3 className="text-base font-bold text-text-primary mb-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-primary-dark" />
                      Recomendaciones del Sistema
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {riesgo.recomendaciones_json?.map((r, i) => (
                        <RecommendationCard
                          key={i}
                          tipo={r.tipo}
                          descripcion={r.descripcion}
                          prioridad={r.prioridad}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <Brain size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="font-medium">No hay datos de riesgo disponibles para este alumno.</p>
                  <p className="text-sm">El sistema generará una predicción cuando haya suficientes datos académicos y de bienestar.</p>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: CALIFICACIONES ===== */}
          {activeTab === 'calificaciones' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <BookOpen size={16} className="text-primary-dark" />
                Historial de Calificaciones
              </h3>

              {Object.keys(calificacionesPorMateria).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(calificacionesPorMateria).map(([materia, data]) => {
                    const promMateria = data.calificaciones.reduce((sum, c) => sum + c.calificacion, 0) / data.calificaciones.length;
                    const enRiesgo = promMateria < 7.0;

                    return (
                      <div key={materia} className="bg-bg rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-text-primary">{materia}</h4>
                            <span className="text-xs font-mono-data text-text-secondary">{data.codigo}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-text-secondary font-semibold uppercase">Promedio</span>
                            <p className={`text-lg font-bold font-mono-data ${enRiesgo ? 'text-danger' : 'text-text-primary'}`}>
                              {promMateria.toFixed(1)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {data.calificaciones.map((cal) => (
                            <div
                              key={cal.id}
                              className={`flex-1 text-center py-2 px-3 rounded-lg border text-sm font-semibold ${
                                cal.calificacion < 7
                                  ? 'bg-danger/5 border-danger/20 text-danger'
                                  : 'bg-success/5 border-success/20 text-success'
                              }`}
                            >
                              <span className="text-[10px] block text-text-secondary font-medium uppercase">P{cal.parcial}</span>
                              <span className="font-mono-data font-bold">{cal.calificacion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <BookOpen size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="font-medium">No hay calificaciones registradas.</p>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: ASISTENCIAS ===== */}
          {activeTab === 'asistencias' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Calendar size={16} className="text-primary-dark" />
                  Registro de Asistencia
                </h3>
                <div className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${
                  porcentajeAsistencia >= 85
                    ? 'bg-success/10 text-success border-success/20'
                    : porcentajeAsistencia >= 75
                    ? 'bg-warning/10 text-warning border-warning/20'
                    : 'bg-danger/10 text-danger border-danger/20'
                }`}>
                  {porcentajeAsistencia}% Asistencia General
                </div>
              </div>

              {asistencias.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-primary-light/40 border-b border-border text-text-secondary font-semibold">
                        <th className="p-3">Materia</th>
                        <th className="p-3">Fecha</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {asistencias.map((asist) => (
                        <tr key={asist.id} className="hover:bg-primary-light/20 transition-colors">
                          <td className="p-3 font-medium text-text-primary">
                            {asist.materias?.nombre || 'Materia'}
                          </td>
                          <td className="p-3 font-mono-data text-xs text-text-secondary">
                            {new Date(asist.fecha).toLocaleDateString('es-MX', {
                              weekday: 'short', day: 'numeric', month: 'short'
                            })}
                          </td>
                          <td className="p-3 text-center">
                            {asist.presente ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-success/10 text-success border border-success/20 text-xs font-semibold">
                                <CheckCircle size={12} /> Presente
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-danger/10 text-danger border border-danger/20 text-xs font-semibold">
                                <AlertTriangle size={12} /> Falta
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <Calendar size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="font-medium">No hay registros de asistencia.</p>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: BIENESTAR ===== */}
          {activeTab === 'bienestar' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Heart size={16} className="text-primary-dark" />
                Formularios de Bienestar
              </h3>

              {bienestar.length > 0 ? (
                <div className="space-y-4">
                  {bienestar.map((form) => (
                    <div key={form.id} className="bg-bg rounded-xl border border-border p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-text-secondary tracking-wider flex items-center gap-1.5">
                          <Clock size={12} />
                          {new Date(form.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-surface rounded-lg p-3 border border-border text-center">
                          <p className="text-xs text-text-secondary font-semibold uppercase">Estrés</p>
                          <p className={`text-xl font-bold font-mono-data ${form.nivel_estres > 7 ? 'text-danger' : form.nivel_estres > 5 ? 'text-warning' : 'text-success'}`}>
                            {form.nivel_estres}/10
                          </p>
                        </div>
                        <div className="bg-surface rounded-lg p-3 border border-border text-center">
                          <p className="text-xs text-text-secondary font-semibold uppercase">Sueño</p>
                          <p className={`text-xl font-bold font-mono-data ${form.horas_sueno < 6 ? 'text-danger' : 'text-success'}`}>
                            {form.horas_sueno}h
                          </p>
                        </div>
                        <div className="bg-surface rounded-lg p-3 border border-border text-center">
                          <p className="text-xs text-text-secondary font-semibold uppercase">Motivación</p>
                          <p className={`text-xl font-bold font-mono-data ${form.nivel_motivacion < 5 ? 'text-danger' : 'text-success'}`}>
                            {form.nivel_motivacion}/10
                          </p>
                        </div>
                        <div className="bg-surface rounded-lg p-3 border border-border text-center">
                          <p className="text-xs text-text-secondary font-semibold uppercase">Deporte</p>
                          <p className={`text-xl font-bold ${form.actividad_fisica ? 'text-success' : 'text-danger'}`}>
                            {form.actividad_fisica ? '✓ Sí' : '✗ No'}
                          </p>
                        </div>
                      </div>

                      {form.notas && (
                        <div className="bg-primary-light/30 border border-primary/10 rounded-lg p-3">
                          <p className="text-xs font-semibold text-text-secondary uppercase mb-1">Notas del alumno</p>
                          <p className="text-sm text-text-primary font-medium leading-relaxed italic">
                            "{form.notas}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <Heart size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="font-medium">No hay formularios de bienestar registrados.</p>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: SEGUIMIENTOS ===== */}
          {activeTab === 'seguimientos' && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <FileText size={16} className="text-primary-dark" />
                Bitácora de Seguimiento
              </h3>

              {/* Formulario para crear nuevo seguimiento */}
              {puedeCrearSeguimiento && (
                <form onSubmit={handleCrearSeguimiento} className="bg-primary-light/20 border border-primary/10 rounded-xl p-5 space-y-4">
                  <h4 className="text-sm font-bold text-primary-dark uppercase tracking-wider">
                    Nuevo Registro de Seguimiento
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase">Tipo</label>
                      <select
                        value={nuevoSeguimiento.tipo}
                        onChange={(e) => setNuevoSeguimiento(prev => ({ ...prev, tipo: e.target.value }))}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
                      >
                        <option value="tutoria">Tutoría</option>
                        <option value="psicologia">Psicología</option>
                        <option value="coordinacion">Coordinación</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase">Descripción</label>
                      <textarea
                        value={nuevoSeguimiento.descripcion}
                        onChange={(e) => setNuevoSeguimiento(prev => ({ ...prev, descripcion: e.target.value }))}
                        placeholder="Describe el encuentro, observaciones y hallazgos..."
                        rows={2}
                        className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-dark text-text-primary resize-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase">Acuerdos y Compromisos</label>
                    <textarea
                      value={nuevoSeguimiento.acuerdos}
                      onChange={(e) => setNuevoSeguimiento(prev => ({ ...prev, acuerdos: e.target.value }))}
                      placeholder="Lista de acuerdos con el alumno..."
                      rows={2}
                      className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary-dark text-text-primary resize-none"
                    />
                  </div>

                  <div className="text-right">
                    <button
                      type="submit"
                      disabled={enviandoSeguimiento || !nuevoSeguimiento.descripcion.trim()}
                      className="inline-flex items-center gap-2 bg-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {enviandoSeguimiento ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Registrar Seguimiento
                    </button>
                  </div>
                </form>
              )}

              {/* Timeline de seguimientos */}
              {seguimientos.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {seguimientos.map((seg) => {
                      const tipoIcons = {
                        tutoria: BookOpen,
                        psicologia: Heart,
                        coordinacion: GraduationCap,
                        otro: FileText
                      };
                      const SegIcon = tipoIcons[seg.tipo] || FileText;

                      return (
                        <div key={seg.id} className="relative pl-12">
                          <div className="absolute left-3 top-1 w-5 h-5 rounded-full bg-primary-dark flex items-center justify-center z-10">
                            <SegIcon size={11} className="text-white" />
                          </div>
                          <div className="bg-bg rounded-xl border border-border p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary-dark bg-primary-light px-2 py-0.5 rounded-lg">
                                  {seg.tipo}
                                </span>
                                <span className="text-xs text-text-secondary flex items-center gap-1">
                                  <User size={11} />
                                  {seg.usuarios?.nombre || 'Sistema'}
                                </span>
                              </div>
                              <span className="text-xs text-text-muted font-mono-data">
                                {new Date(seg.created_at).toLocaleDateString('es-MX', {
                                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-text-primary font-medium leading-relaxed">
                              {seg.descripcion}
                            </p>
                            {seg.acuerdos && (
                              <div className="bg-primary-light/30 border border-primary/10 rounded-lg p-3">
                                <p className="text-xs font-bold text-primary-dark uppercase mb-1">Acuerdos</p>
                                <p className="text-sm text-text-primary">{seg.acuerdos}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-text-secondary">
                  <FileText size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="font-medium">No hay seguimientos registrados.</p>
                  {puedeCrearSeguimiento && (
                    <p className="text-sm">Usa el formulario de arriba para registrar el primer encuentro.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
