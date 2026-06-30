import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import { supabase } from '../../lib/supabase.js';
import {
  User, Mail, Phone, Calendar, Shield, Heart, Sparkles, AlertTriangle, CheckCircle,
  HelpCircle, ChevronRight, BookOpen, Clock, Activity, MessageSquare, ExternalLink,
  Award, TrendingUp, RefreshCw, X, FileText, BarChart2, Loader2, BookMarked, LayoutGrid,
  AlertCircle, Dumbbell, Smile, Moon, Users, GraduationCap
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceLine
} from 'recharts';
import FormularioBienestarExtendido from './FormularioBienestarExtendido.jsx';

export default function AlumnoDashboard({ user, alumnoDetalle, alumnoRiesgo, bienestarForm }) {
  const [activeMateria, setActiveMateria] = useState(null);
  const [materiasDetalle, setMateriasDetalle] = useState([]);
  const [asistenciasDetalle, setAsistenciasDetalle] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(true);
  const [mostrarModalBienestar, setMostrarModalBienestar] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  
  // El formulario de bienestar extendido se maneja en su propio componente

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // bienestarForm se usa solo para leer la información del formulario más reciente

  useEffect(() => {
    if (!alumnoDetalle?.id) return;
    setCargandoDetalles(true);
    Promise.all([
      api.get(`/alumnos/${alumnoDetalle.id}/calificaciones`),
      api.get(`/alumnos/${alumnoDetalle.id}/asistencias`),
      api.get(`/alumnos/${alumnoDetalle.id}/seguimientos`)
    ])
      .then(([califs, asists, segs]) => {
        const materiasMap = {};
        (califs || []).forEach(c => {
          const matId = c.grupo_id || c.grupos?.id || 0;
          const matNombre = c.grupos?.materias?.nombre || 'Materia';
          const profNombre = c.grupos?.profesor?.nombre || 'Profesor Asignado';
          
          if (!materiasMap[matId]) {
            materiasMap[matId] = {
              id: matId,
              nombre: matNombre,
              profesor: profNombre,
              parciales: {},
              totalClases: 0,
              asistencias: 0
            };
          }
          materiasMap[matId].parciales[c.parcial] = parseFloat(c.calificacion);
        });

        (asists || []).forEach(a => {
          const matId = a.grupo_id || a.grupos?.id || 0;
          if (materiasMap[matId]) {
            materiasMap[matId].totalClases++;
            if (a.presente) {
              materiasMap[matId].asistencias++;
            }
          }
        });

        setMateriasDetalle(Object.values(materiasMap));
        setAsistenciasDetalle(asists || []);
        setSeguimientos(segs || []);
      })
      .catch(err => {
        console.error('Error al cargar detalles del alumno:', err);
      })
      .finally(() => {
        setCargandoDetalles(false);
      });
  }, [alumnoDetalle]);

  // guardarBienestar se maneja dentro de FormularioBienestarExtendido

  const getSituacion = (nivel) => {
    switch (nivel) {
      case 'critico':
        return { label: 'Necesitas apoyo', colorClass: 'text-red-700 bg-red-50 border-red-200', dotClass: 'bg-red-500', desc: 'Tu rendimiento ha bajado en las últimas semanas. No estás solo, tu tutor ya fue notificado y hay recursos disponibles para ti.' };
      case 'alto':
        return { label: 'Pon atención', colorClass: 'text-orange-700 bg-orange-50 border-orange-200', dotClass: 'bg-orange-500', desc: 'Se han detectado variaciones importantes en tu desempeño y/o bienestar. Es buen momento para coordinar con tu tutor.' };
      case 'medio':
        return { label: 'Mantente al tanto', colorClass: 'text-amber-700 bg-amber-50 border-amber-200', dotClass: 'bg-amber-500', desc: 'Estás manteniendo un paso regular, pero hay pequeños detalles en los que podemos trabajar juntos.' };
      default:
        return { label: 'Vas muy bien', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200', dotClass: 'bg-emerald-500', desc: '¡Felicidades! Estás manteniendo un excelente nivel. Sigue con el mismo ritmo y enfoque.' };
    }
  };

  const situacion = getSituacion(alumnoRiesgo?.nivel_riesgo);

  const getImpactoText = (contrib) => {
    const val = Math.abs(contrib || 0);
    if (val > 0.25) return 'impacto alto';
    if (val > 0.12) return 'impacto medio';
    return 'impacto bajo';
  };

  const getFactorIcon = (nombre) => {
    const n = (nombre || '').toLowerCase();
    if (n.includes('promedio') || n.includes('calificacion')) return <BarChart2 size={16} className="text-primary-dark" />;
    if (n.includes('estres') || n.includes('ansiedad')) return <Smile size={16} className="text-orange-500" />;
    if (n.includes('asistencia') || n.includes('falta')) return <Calendar size={16} className="text-indigo-500" />;
    if (n.includes('deporte') || n.includes('ejercicio') || n.includes('fisica')) return <Dumbbell size={16} className="text-emerald-500" />;
    if (n.includes('sueño') || n.includes('dormir')) return <Moon size={16} className="text-blue-500" />;
    if (n.includes('familiar') || n.includes('apoyo')) return <Users size={16} className="text-pink-500" />;
    return <Sparkles size={16} className="text-warning" />;
  };

  const factoresLimpios = alumnoRiesgo?.factores_json || [
    { nombre: 'Tu promedio general', contribucion: -0.3, descripcion: 'Tu promedio bajó en este parcial.' },
    { nombre: 'Nivel de estrés reportado', contribucion: -0.26, descripcion: 'Reportaste niveles elevados de estrés.' },
    { nombre: 'Asistencia a clases', contribucion: -0.15, descripcion: 'Tu asistencia está ligeramente por debajo del 80%.' }
  ];

  const recomendacionesUrgentes = (alumnoRiesgo?.recomendaciones_json || []).filter(r => r.prioridad === 'alta' || r.prioridad === 'critica');
  const recomendacionesSemanales = (alumnoRiesgo?.recomendaciones_json || []).filter(r => r.prioridad !== 'alta' && r.prioridad !== 'critica');

  const histData = [
    { name: 'Parcial 1', Promedio: alumnoDetalle?.promedio_general ? Math.min(alumnoDetalle.promedio_general + 0.8, 10) : 7.4 },
    { name: 'Parcial 2', Promedio: alumnoDetalle?.promedio_general || 5.8 },
    { name: 'Parcial 3', Promedio: null }
  ];

  const radarData = [
    { subject: 'Estrés', A: (10 - (bienestarForm?.nivel_estres ?? 5)) * 10, fullMark: 100 },
    { subject: 'Sueño', A: Math.min(((bienestarForm?.horas_sueno ?? 7) / 8) * 100, 100), fullMark: 100 },
    { subject: 'Deporte', A: (bienestarForm?.practica_deporte ? 100 : 20), fullMark: 100 },
    { subject: 'Economía', A: (bienestarForm?.situacion_economica ?? 3) * 20, fullMark: 100 },
    { subject: 'Apoyo', A: (bienestarForm?.apoyo_familiar ?? 4) * 20, fullMark: 100 },
    { subject: 'Motivación', A: (bienestarForm?.motivacion_academica ?? 4) * 20, fullMark: 100 }
  ];

  const promedioActual = alumnoDetalle?.promedio_general || 5.8;
  const metaSugerida = promedioActual < 7.0 ? 7.0 : Math.min(promedioActual + 0.5, 10);

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

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-dark text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} /> {toastMsg}
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm"
           style={{ background: 'linear-gradient(135deg, rgba(123,198,126,0.1) 0%, rgba(76,175,80,0.05) 100%)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
              Hola, {user?.nombre || 'Estudiante'}
            </h1>
            <p className="text-text-secondary text-sm">
              {alumnoDetalle?.carreras?.nombre || 'Ingeniería en Sistemas'} · Semestre {alumnoDetalle?.semestre_actual || '3'} · Matrícula: {alumnoDetalle?.matricula || '202201834'}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/80 border border-border rounded-xl p-3 shadow-xs">
            <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary-dark font-bold text-sm">
              {alumnoDetalle?.tutor?.nombre?.charAt(0) || 'T'}
            </div>
            <div className="text-left">
              <p className="text-xs text-text-secondary font-semibold">Tutor Académico:</p>
              <p className="text-sm font-bold text-text-primary">{alumnoDetalle?.tutor?.nombre || 'Mtra. Soto'}</p>
            </div>
            <a
              href={`mailto:${alumnoDetalle?.tutor?.email || 'tutor@sibia.edu'}`}
              className="ml-2 px-3 py-1.5 bg-primary-dark text-white rounded-lg hover:bg-primary font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <MessageSquare size={12} /> Contactar tutor
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Tu situación académica</h2>
            <div className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center gap-4 ${situacion.colorClass}`}>
              <div className="shrink-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center ${situacion.dotClass} text-white font-bold`}>!</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold uppercase tracking-wide">{situacion.label}</p>
                {alumnoRiesgo?.porcentaje_riesgo && (
                  <p className="text-xs font-medium opacity-80">{alumnoRiesgo.porcentaje_riesgo}% de probabilidad de requerir soporte adicional</p>
                )}
                <p className="text-sm leading-relaxed mt-1 text-text-primary">{situacion.desc}</p>
              </div>
            </div>
            <p className="text-[10px] text-text-muted mt-3 text-right">Última actualización: hace 2 días</p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Detalles del Sistema</h2>
            <div className="space-y-4">
              {factoresLimpios.map((f, i) => {
                const impacto = getImpactoText(f.contribucion);
                const absVal = Math.abs(f.contribucion || 0.1);
                const barWidth = `${Math.min(absVal * 300, 100)}%`;
                const isPositive = f.contribucion > 0;
                
                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-bg/50 border border-border/50 rounded-xl">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="shrink-0 mt-0.5">{getFactorIcon(f.nombre)}</span>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{f.nombre}</p>
                        <p className="text-xs text-text-secondary">{f.descripcion || 'Sin detalles'}</p>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0 min-w-[120px]">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className={`text-[10px] font-bold uppercase ${isPositive ? 'text-emerald-700 bg-emerald-100' : 'text-amber-700 bg-amber-100'} px-1.5 py-0.5 rounded`}>
                          {impacto}
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1.5 mt-2 overflow-hidden max-w-[100px] ml-auto">
                        <div className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-warning'}`} style={{ width: barWidth }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Mis materias · Semestre {alumnoDetalle?.semestre_actual || 'Actual'}</h2>
            <div className="space-y-4">
              {cargandoDetalles ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary-dark" /></div>
              ) : materiasDetalle.length === 0 ? (
                <p className="text-text-secondary text-sm text-center">No se encontraron materias registradas.</p>
              ) : (
                materiasDetalle.map(m => {
                  const p1 = m.parciales[1];
                  const p2 = m.parciales[2];
                  
                  const asistPct = m.totalClases > 0 ? Math.round((m.asistencias / m.totalClases) * 100) : 100;
                  const AsistIcon = asistPct >= 80 ? CheckCircle : asistPct >= 70 ? AlertTriangle : AlertCircle;
                  
                  let estadoMateria = 'Vas bien, mantén el ritmo';
                  let estadoCls = 'text-emerald-700 bg-emerald-50';
                  if (asistPct < 70 || (p2 !== undefined && p2 < 6.0)) {
                    estadoMateria = 'En riesgo de reprobar';
                    estadoCls = 'text-red-700 bg-red-50';
                  } else if (asistPct < 80 || (p2 !== undefined && p2 < 7.0)) {
                    estadoMateria = 'Pon atención, está bajando';
                    estadoCls = 'text-amber-700 bg-amber-50';
                  }
                  
                  return (
                    <div key={m.id} className="border border-border rounded-xl p-4 hover:bg-bg/20 transition-all space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-base font-bold text-text-primary">{m.nombre}</h3>
                          <p className="text-xs text-text-secondary">{m.profesor}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="bg-bg border border-border rounded-lg px-2.5 py-1 text-center">
                            <p className="text-[10px] text-text-secondary">P1</p>
                            <p className={`text-sm font-bold font-mono ${calColor(p1)}`}>{p1 !== undefined ? p1.toFixed(1) : '—'}</p>
                          </div>
                          <ChevronRight className="text-text-muted" size={14} />
                          <div className="bg-bg border border-border rounded-lg px-2.5 py-1 text-center">
                            <p className="text-[10px] text-text-secondary">P2</p>
                            <p className={`text-sm font-bold font-mono ${calColor(p2)}`}>{p2 !== undefined ? p2.toFixed(1) : '—'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-secondary flex items-center gap-1.5">
                            Asistencia: <span className="font-semibold text-text-primary">{asistPct}%</span> 
                            <AsistIcon size={14} className={asistPct >= 80 ? 'text-emerald-500' : asistPct >= 70 ? 'text-amber-500' : 'text-red-500'} />
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${estadoCls}`}>
                            {estadoMateria}
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveMateria(m)}
                          className="text-xs text-primary-dark font-bold hover:underline self-end flex items-center gap-1"
                        >
                          <BarChart2 size={12} /> Ver detalle
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Lo que te recomendamos</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest flex items-center gap-1">
                  <AlertCircle size={12} /> URGENTE
                </p>
                {recomendacionesUrgentes.length > 0 ? (
                  recomendacionesUrgentes.map((r, i) => (
                    <div key={i} className="bg-red-50/50 border border-red-200/60 rounded-xl p-3.5 space-y-2">
                      <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        {r.tipo === 'academica' ? <BookOpen size={14} className="text-primary-dark" /> : <Smile size={14} className="text-orange-500" />} 
                        {r.descripcion}
                      </p>
                      <button
                        onClick={() => showToast(`Se ha solicitado soporte para: ${r.descripcion}`)}
                        className="text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all w-full flex items-center justify-center gap-1.5"
                      >
                        Solicitar sesión
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-xl p-3.5 text-center">
                     <p className="text-xs text-emerald-700 font-medium flex items-center gap-1"><CheckCircle size={12} /> No tienes recomendaciones urgentes pendientes.</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={12} /> ESTA SEMANA
                </p>
                {recomendacionesSemanales.length > 0 ? (
                  recomendacionesSemanales.map((r, i) => (
                    <div key={i} className="bg-amber-50/30 border border-amber-200/50 rounded-xl p-3.5 space-y-1.5">
                      <p className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                        {r.tipo === 'deporte' ? <Dumbbell size={14} className="text-emerald-500" /> : <Calendar size={14} className="text-indigo-500" />} 
                        {r.descripcion}
                      </p>
                      <p className="text-[11px] text-text-secondary leading-relaxed">
                        {r.tipo === 'deporte' 
                          ? 'El ejercicio reduce el estrés y mejora la concentración.' 
                          : 'Mejorar la constancia en clases impactará directamente tus promedios.'}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-bg border border-border rounded-xl p-3 text-center">
                    <p className="text-xs text-text-secondary">Sin recomendaciones semanales adicionales.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Mi bienestar</h2>
              <span className="text-[10px] text-text-muted">Último: hace {bienestarForm ? '12 días' : 'un mes'}</span>
            </div>
            
            <div className="flex justify-center h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#E0EAE0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#5A7260', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9DB5A0', fontSize: 8 }} />
                  <Radar name="Mi Bienestar" dataKey="A" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs border-b border-border/50 pb-1.5">
                <span className="text-text-secondary flex items-center gap-1"><Smile size={12} /> Estrés</span>
                <span className="font-bold text-text-primary">{bienestarForm?.nivel_estres ?? 5}/10</span>
              </div>
              <div className="flex justify-between text-xs border-b border-border/50 pb-1.5">
                <span className="text-text-secondary flex items-center gap-1"><Moon size={12} /> Sueño</span>
                <span className="font-bold text-text-primary">{bienestarForm?.horas_sueno ?? 7.0} hrs</span>
              </div>
              <div className="flex justify-between text-xs border-b border-border/50 pb-1.5">
                <span className="text-text-secondary flex items-center gap-1"><Dumbbell size={12} /> Actividad física</span>
                <span className="font-bold text-text-primary">{bienestarForm?.practica_deporte ? 'Sí' : 'No'}</span>
              </div>
              <div className="flex justify-between text-xs border-b border-border/50 pb-1.5">
                <span className="text-text-secondary flex items-center gap-1"><Users size={12} /> Apoyo familiar</span>
                <span className="font-bold text-text-primary">{bienestarForm?.apoyo_familiar ?? 4}/5</span>
              </div>
              <div className="flex justify-between text-xs pb-1.5">
                <span className="text-text-secondary flex items-center gap-1"><Sparkles size={12} /> Motivación</span>
                <span className="font-bold text-text-primary">{bienestarForm?.motivacion_academica ?? 4}/5</span>
              </div>
            </div>

            <button
              onClick={() => setMostrarModalBienestar(true)}
              className="mt-4 w-full py-2 bg-primary-light hover:bg-accent text-primary-dark border border-primary/20 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              Actualizar formulario
            </button>
            <p className="text-[10px] text-text-muted italic mt-2 text-center">
              "Actualizar tu formulario ayuda al sistema a darte recomendaciones más precisas."
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Promedio por parcial · Este semestre</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={histData} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPromedio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4CAF50" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0EAE0" />
                <XAxis dataKey="name" tick={{ fill: '#5A7260', fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#5A7260', fontSize: 11 }} />
                <Tooltip {...BAR_TOOLTIP_STYLE} />
                <ReferenceLine y={6.0} label={{ value: 'Aprobatoria', fill: '#EF5350', fontSize: 9 }} stroke="#EF5350" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="Promedio" stroke="#4CAF50" strokeWidth={2} fillOpacity={1} fill="url(#colorPromedio)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-4 bg-bg rounded-2xl p-6 border border-border">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-xs text-text-secondary font-medium">Este semestre</span>
              <span className="text-xl font-mono font-bold text-text-primary">{promedioActual.toFixed(1)}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-xs text-text-secondary font-medium">Semestre pasado</span>
              <span className="text-base font-mono font-bold text-text-secondary">7.4</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-secondary font-medium font-bold">Meta sugerida</span>
              <span className="text-lg font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {metaSugerida.toFixed(1)}
              </span>
            </div>
            <p className="text-[10px] text-text-muted mt-2">
              Te sugerimos alcanzar un {metaSugerida.toFixed(1)} en el siguiente parcial para recuperar tu regularidad académica sin sobrecargarte.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Apoyo recibido</h2>
        {cargandoDetalles ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary-dark" /></div>
        ) : seguimientos.length === 0 ? (
          <div className="bg-bg border border-border rounded-xl p-4 text-center">
            <p className="text-xs text-text-secondary">No se han registrado seguimientos o tutorías especiales aún.</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-border ml-2 pl-6 space-y-6">
            {seguimientos.map((s, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[31px] top-0 w-4.5 h-4.5 bg-emerald-500 rounded-full border-4 border-white shadow-xs flex items-center justify-center" />
                <div className="bg-bg/50 border border-border/60 rounded-xl p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-text-primary">{s.tipo?.toUpperCase()} · {s.usuario?.nombre}</span>
                    <span className="text-[10px] text-text-muted">{new Date(s.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <p className="text-sm text-text-secondary italic">"{s.observaciones}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Recursos disponibles para ti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-bg border border-border rounded-xl p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5"><GraduationCap size={16} className="text-primary-dark" /> Tu tutor: {alumnoDetalle?.tutor?.nombre || 'Mtra. Soto'}</p>
              <p className="text-xs text-text-secondary">Apoyo en tu ruta académica</p>
            </div>
            <a href={`mailto:${alumnoDetalle?.tutor?.email || 'tutor@sibia.edu'}`} className="p-2 bg-white border border-border hover:bg-primary-light rounded-lg text-primary-dark transition-all">
              <ExternalLink size={14} />
            </a>
          </div>

          <div className="bg-bg border border-border rounded-xl p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5"><Smile size={16} className="text-orange-500" /> Psicología y orientación</p>
              <p className="text-xs text-text-secondary">Atención al estrés y bienestar</p>
            </div>
            <button onClick={() => showToast('¡Redirigiendo a reserva de citas de Psicología!')} className="p-2 bg-white border border-border hover:bg-primary-light rounded-lg text-primary-dark transition-all">
              <ExternalLink size={14} />
            </button>
          </div>

          <div className="bg-bg border border-border rounded-xl p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5"><BookOpen size={16} className="text-indigo-500" /> Centro de tutoría académica</p>
              <p className="text-xs text-text-secondary">Asesorías de Cálculo y Física</p>
            </div>
            <button onClick={() => showToast('¡Redirigiendo a reserva de Asesorías Académicas!')} className="p-2 bg-white border border-border hover:bg-primary-light rounded-lg text-primary-dark transition-all">
              <ExternalLink size={14} />
            </button>
          </div>

          <div className="bg-bg border border-border rounded-xl p-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5"><Dumbbell size={16} className="text-emerald-500" /> Actividades deportivas campus</p>
              <p className="text-xs text-text-secondary">Talleres deportivos de la semana</p>
            </div>
            <button onClick={() => showToast('¡Redirigiendo a catálogo de deportes en campus!')} className="p-2 bg-white border border-border hover:bg-primary-light rounded-lg text-primary-dark transition-all">
              <ExternalLink size={14} />
            </button>
          </div>

          <div className="bg-bg border border-border rounded-xl p-4 flex items-center justify-between gap-2 lg:col-span-2">
            <div>
              <p className="text-sm font-semibold text-text-primary flex items-center gap-1.5"><Phone size={16} className="text-primary-dark" /> Línea de apoyo estudiantil</p>
              <p className="text-xs text-text-secondary">Llamada sin costo las 24 horas del día</p>
            </div>
            <a href="tel:8001234567" className="text-sm font-bold text-primary-dark hover:underline">
              800-123-4567
            </a>
          </div>
        </div>
      </div>

      {activeMateria && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} onClick={() => setActiveMateria(null)}>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg/50">
              <div>
                <h3 className="text-base font-bold text-text-primary">{activeMateria.nombre}</h3>
                <p className="text-xs text-text-secondary">{activeMateria.profesor}</p>
              </div>
              <button onClick={() => setActiveMateria(null)} className="p-2 hover:bg-bg rounded-lg text-text-secondary"><X size={18} /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex gap-3 justify-center">
                <div className="bg-bg border border-border rounded-xl p-3 text-center flex-1">
                  <p className="text-xs text-text-secondary">Parcial 1</p>
                  <p className={`text-lg font-bold font-mono ${calColor(activeMateria.parciales[1])}`}>
                    {activeMateria.parciales[1] !== undefined ? activeMateria.parciales[1].toFixed(1) : '—'}
                  </p>
                </div>
                <div className="bg-bg border border-border rounded-xl p-3 text-center flex-1">
                  <p className="text-xs text-text-secondary">Parcial 2</p>
                  <p className={`text-lg font-bold font-mono ${calColor(activeMateria.parciales[2])}`}>
                    {activeMateria.parciales[2] !== undefined ? activeMateria.parciales[2].toFixed(1) : '—'}
                  </p>
                </div>
                <div className="bg-bg border border-border rounded-xl p-3 text-center flex-1 bg-primary-light border-primary/20">
                  <p className="text-xs text-primary-dark font-semibold">Parcial 3</p>
                  <p className="text-lg font-bold text-text-muted">Pendiente</p>
                </div>
              </div>

              {(() => {
                const p1 = activeMateria.parciales[1] || 0;
                const p2 = activeMateria.parciales[2] || 0;
                const necesario = 18 - p1 - p2;
                
                if (necesario > 10) {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-red-600 font-semibold mb-1">Estrategia Académica</p>
                      <p className="text-sm font-bold text-red-700">Necesitas apoyo extraordinario</p>
                      <p className="text-xs text-text-secondary mt-1">El acumulado de tus parciales requiere asesorías urgentes y posible examen de recuperación para consolidar la materia.</p>
                    </div>
                  );
                } else if (necesario > 0) {
                  return (
                    <div className="bg-primary-light border border-primary/20 rounded-xl p-4 text-center">
                      <p className="text-xs text-primary-dark font-semibold mb-1">Estrategia Académica</p>
                      <p className="text-sm text-text-primary">
                        Para aprobar necesitas obtener: <span className="font-bold text-primary-dark text-lg font-mono">{necesario.toFixed(1)}</span> en el parcial 3.
                      </p>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-emerald-700 font-semibold mb-1">Estrategia Académica</p>
                      <p className="text-sm text-emerald-800">¡Materia prácticamente aprobada!</p>
                      <p className="text-xs text-text-secondary mt-1">Solo necesitas presentarte a realizar tu parcial 3.</p>
                    </div>
                  );
                }
              })()}

              <div className="bg-bg border border-border rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Asistencia acumulada:</span>
                  <span className="font-bold text-text-primary">
                    {activeMateria.totalClases > 0 ? Math.round((activeMateria.asistencias / activeMateria.totalClases) * 100) : 100}% 
                    ({activeMateria.asistencias} de {activeMateria.totalClases} clases)
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-text-secondary">Faltas totales:</span>
                  <span className="font-bold text-text-primary">
                    {activeMateria.totalClases - activeMateria.asistencias} clases
                  </span>
                </div>
              </div>

              <div className="bg-bg border border-border rounded-xl p-4 text-center">
                <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-1">Posición relativa en tu grupo</p>
                <p className="text-sm font-bold text-text-primary">Percentil 28</p>
                <p className="text-[10px] text-text-muted mt-1">
                  Tu posición se calcula de forma segura y anónima comparando promedios acumulados en tu grupo sin mostrar nombres.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalBienestar && (
        <FormularioBienestarExtendido
          alumnoId={alumnoDetalle?.id}
          onClose={() => setMostrarModalBienestar(false)}
          onSuccess={() => showToast('Formulario de bienestar enviado correctamente')}
        />
      )}
    </div>
  );
}
