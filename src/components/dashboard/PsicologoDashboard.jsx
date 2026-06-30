import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import {
  User, Mail, Phone, Calendar, Heart, Brain, Smile, Activity, AlertTriangle, CheckCircle,
  ChevronRight, MessageSquare, Shield, FileText, Lock, PlusCircle, Sparkles, Loader2,
  Users, BarChart2, TrendingUp, Info, X
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

export default function PsicologoDashboard() {
  const [alertas, setAlertas] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [bienestares, setBienestares] = useState([]);
  const [seguimientos, setSeguimientos] = useState([]);
  const [cargandoExpediente, setCargandoExpediente] = useState(false);

  // Estados para registrar sesión
  const [mostrarModalSesion, setMostrarModalSesion] = useState(false);
  const [alertaParaSesion, setAlertaParaSesion] = useState(null);
  const [notaSesion, setNotaSesion] = useState('');
  const [estadoResultado, setEstadoResultado] = useState('igual');
  const [cerrarAlerta, setCerrarAlerta] = useState(false);
  const [guardandoSesion, setGuardandoSesion] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    try {
      const [dataAlertas, dataAlumnos] = await Promise.all([
        api.get('/alertas'),
        api.get('/alumnos')
      ]);
      setAlertas(dataAlertas || []);
      setAlumnos(dataAlumnos || []);
    } catch (e) {
      console.error('Error al cargar datos iniciales de psicología:', e);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarAlumno = async (alumno) => {
    setAlumnoSeleccionado(alumno);
    setCargandoExpediente(true);
    try {
      const [dataBienestar, dataSeguimientos] = await Promise.all([
        api.get(`/alumnos/${alumno.id}/bienestar`),
        api.get(`/alumnos/${alumno.id}/seguimientos`)
      ]);
      setBienestares(dataBienestar || []);
      setSeguimientos(dataSeguimientos || []);
    } catch (e) {
      console.error('Error al cargar expediente de bienestar:', e);
    } finally {
      setCargandoExpediente(false);
    }
  };

  const registrarSesion = async (e) => {
    e.preventDefault();
    if (!alertaParaSesion || !notaSesion.trim()) return;

    setGuardandoSesion(true);
    try {
      await api.post(`/alumnos/${alumnoSeleccionado.id}/seguimientos`, {
        alerta_id: alertaParaSesion.id,
        tipo: 'psicologia',
        observaciones: notaSesion,
        resultado: estadoResultado,
        cerrar_alerta: cerrarAlerta
      });

      showToast('Sesión registrada exitosamente');
      setMostrarModalSesion(false);
      setNotaSesion('');
      setEstadoResultado('igual');
      setCerrarAlerta(false);

      // Recargar datos
      await cargarDatosIniciales();
      if (alumnoSeleccionado) {
        await seleccionarAlumno(alumnoSeleccionado);
      }
    } catch (e) {
      console.error('Error al registrar la sesión:', e);
      showToast('Error al registrar la sesión');
    } finally {
      setGuardandoSesion(false);
    }
  };

  // KPIs
  const casosActivos = alertas.filter(a => a.estado === 'activa');
  const casosCriticos = alertas.filter(a => a.estado === 'activa' && a.alumno?.predicciones_riesgo?.[0]?.nivel_riesgo === 'critico').length;
  const canalizacionesNuevas = alertas.filter(a => a.estado === 'activa' && !a.asignada_a).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-primary-dark text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} /> {toastMsg}
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm"
           style={{ background: 'linear-gradient(135deg, rgba(76,175,80,0.08) 0%, rgba(33,150,243,0.05) 100%)' }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-2">
              Departamento de Orientación & Psicología
            </h1>
            <p className="text-text-secondary text-sm flex items-center gap-1.5">
              <Shield size={14} className="text-primary-dark" />
              SIBIA · Expedientes de bienestar completamente confidenciales
            </p>
          </div>
          <div className="bg-white/80 border border-border rounded-xl p-3 shadow-xs text-xs font-semibold text-text-secondary flex items-center gap-2">
            <Lock size={14} className="text-amber-500" />
            Acceso restringido · Solo Psicología
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-light text-primary-dark flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase">Casos Activos</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{casosActivos.length}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase">Críticos / Urgentes</p>
            <p className="text-2xl font-bold text-red-600 mt-0.5">{casosCriticos}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase">Canalizaciones Nuevas</p>
            <p className="text-2xl font-bold text-blue-600 mt-0.5">{canalizacionesNuevas}</p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Smile size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-text-secondary uppercase">Total Alumnos Monitorizados</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{alumnos.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Casos Activos y Canalizaciones */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Bandeja de Canalizaciones</h2>
            {cargando ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary-dark" /></div>
            ) : alertas.length === 0 ? (
              <div className="text-center py-8 text-text-secondary text-sm">No tienes canalizaciones de bienestar asignadas en este momento.</div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {alertas.map(a => {
                  const seleccionado = alumnoSeleccionado?.id === a.alumno_id;
                  const esAlertaCritica = a.alumno?.predicciones_riesgo?.[0]?.nivel_riesgo === 'critico' || a.tipo === 'bienestar';
                  
                  return (
                    <button
                      key={a.id}
                      onClick={() => seleccionarAlumno(a.alumno)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all space-y-2 hover:shadow-xs ${
                        seleccionado
                          ? 'border-primary-dark bg-primary-light/10 shadow-xs'
                          : esAlertaCritica
                            ? 'border-red-200 bg-red-50/30'
                            : 'border-border bg-bg/40'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-bold text-text-primary">{a.alumno?.usuario?.nombre || 'Alumno'}</p>
                          <p className="text-xs text-text-secondary">{a.alumno?.matricula} · {a.alumno?.carrera?.nombre}</p>
                        </div>
                        {esAlertaCritica && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase shrink-0">
                            <AlertTriangle size={10} /> Crítico
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary line-clamp-2 leading-relaxed">
                        {a.descripcion}
                      </p>
                      <div className="flex justify-between items-center text-[10px] text-text-muted pt-1 border-t border-border/40">
                        <span>Creado: {new Date(a.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                        <span className={`font-semibold ${a.estado === 'activa' ? 'text-blue-600' : 'text-emerald-600'}`}>
                          {a.estado === 'activa' ? 'Pendiente' : 'Atendida'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detalle de Expediente Académico y de Bienestar */}
        <div className="lg:col-span-2">
          {!alumnoSeleccionado ? (
            <div className="bg-surface border border-border border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <Heart size={48} className="text-text-muted mb-3 animate-pulse" />
              <h3 className="text-base font-bold text-text-primary">Expediente de Bienestar Alumno</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm">
                Selecciona a un alumno de la bandeja lateral para visualizar su comparativa de bienestar, historial de encuestas y registrar notas clínicas confidenciales.
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-6">
              {/* Encabezado Alumno */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                    {alumnoSeleccionado.usuario?.nombre}
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Carrera: {alumnoSeleccionado.carreras?.nombre} · Matrícula: {alumnoSeleccionado.matricula}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const alertaActiva = alertas.find(a => a.alumno_id === alumnoSeleccionado.id && a.estado === 'activa');
                      if (alertaActiva) {
                        setAlertaParaSesion(alertaActiva);
                        setMostrarModalSesion(true);
                      } else {
                        showToast('Este alumno no tiene alertas activas por canalizar.');
                      }
                    }}
                    className="px-4 py-2 bg-primary-dark text-white rounded-xl text-xs font-bold hover:bg-primary transition-colors flex items-center gap-1.5"
                  >
                    <PlusCircle size={14} /> Registrar Sesión
                  </button>
                </div>
              </div>

              {cargandoExpediente ? (
                <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary-dark" /></div>
              ) : (
                <div className="space-y-6">
                  {/* Historial de bienestar (Últimos 3 formularios) */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Historial y Tendencias de Bienestar</h3>
                    {bienestares.length === 0 ? (
                      <div className="bg-bg border border-border rounded-xl p-4 text-center text-xs text-text-secondary">
                        No se han registrado encuestas de bienestar para este alumno.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tabla Comparativa de Tendencias */}
                        <div className="border border-border rounded-xl overflow-hidden bg-bg/25">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-bg border-b border-border text-text-secondary font-bold">
                                <th className="p-3">Dimensión</th>
                                {bienestares.slice(0, 3).map((b, idx) => (
                                  <th key={idx} className="p-3 text-right">
                                    {new Date(b.fecha_aplicacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-border/50">
                                <td className="p-3 font-semibold text-text-primary">Estrés (1-10)</td>
                                {bienestares.slice(0, 3).map((b, idx) => (
                                  <td key={idx} className="p-3 text-right font-mono font-bold text-text-primary">{b.nivel_estres}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-border/50">
                                <td className="p-3 font-semibold text-text-primary">Sueño (hrs/día)</td>
                                {bienestares.slice(0, 3).map((b, idx) => (
                                  <td key={idx} className="p-3 text-right font-mono text-text-primary">{b.horas_sueno} hrs</td>
                                ))}
                              </tr>
                              <tr className="border-b border-border/50">
                                <td className="p-3 font-semibold text-text-primary">Situación Económica (1-5)</td>
                                {bienestares.slice(0, 3).map((b, idx) => (
                                  <td key={idx} className="p-3 text-right font-mono text-text-primary">{b.situacion_economica}</td>
                                ))}
                              </tr>
                              <tr className="border-b border-border/50">
                                <td className="p-3 font-semibold text-text-primary">Apoyo Familiar (1-5)</td>
                                {bienestares.slice(0, 3).map((b, idx) => (
                                  <td key={idx} className="p-3 text-right font-mono text-text-primary">{b.apoyo_familiar}</td>
                                ))}
                              </tr>
                              <tr>
                                <td className="p-3 font-semibold text-text-primary">Motivación Académica (1-5)</td>
                                {bienestares.slice(0, 3).map((b, idx) => (
                                  <td key={idx} className="p-3 text-right font-mono text-text-primary">{b.motivacion_academica}</td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Radar Chart Bienestar Reciente */}
                        <div className="border border-border rounded-xl p-4 flex flex-col items-center justify-center bg-bg/25">
                          <p className="text-[11px] font-bold text-text-secondary uppercase mb-2">Radar de Bienestar Reciente</p>
                          <div className="w-full h-44">
                            {(() => {
                              const b = bienestares[0];
                              const radarData = [
                                { subject: 'Estrés', A: (10 - (b?.nivel_estres ?? 5)) * 10 },
                                { subject: 'Sueño', A: Math.min(((b?.horas_sueno ?? 7) / 8) * 100, 100) },
                                { subject: 'Economía', A: (b?.situacion_economica ?? 3) * 20 },
                                { subject: 'Apoyo', A: (b?.apoyo_familiar ?? 3) * 20 },
                                { subject: 'Motivación', A: (b?.motivacion_academica ?? 3) * 20 },
                              ];
                              return (
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                    <PolarGrid stroke="#E0EAE0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#5A7260', fontSize: 9 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9DB5A0', fontSize: 7 }} />
                                    <Radar name="Bienestar" dataKey="A" stroke="#2196F3" fill="#2196F3" fillOpacity={0.3} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notas de Sesiones Privadas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                        <Lock size={12} className="text-amber-500" /> Notas Clínicas Confidenciales
                      </h3>
                      <span className="text-[10px] text-text-muted">Solo visible para el departamento de Psicología</span>
                    </div>

                    {seguimientos.filter(s => s.tipo === 'psicologia').length === 0 ? (
                      <div className="bg-bg border border-border rounded-xl p-6 text-center text-xs text-text-secondary">
                        No hay notas clínicas registradas en el expediente de este alumno.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {seguimientos.filter(s => s.tipo === 'psicologia').map((s, idx) => (
                          <div key={idx} className="bg-bg/40 border border-border rounded-xl p-4 space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-text-muted">
                              <span className="font-bold text-text-primary">Registrado por: {s.usuario?.nombre}</span>
                              <span>{new Date(s.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed">
                              {s.observaciones}
                            </p>
                            <div className="flex justify-between items-center text-[10px] pt-1.5 border-t border-border/50">
                              <span className="text-text-secondary">Resultado: <span className="font-semibold uppercase text-text-primary">{s.resultado}</span></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Registrar Sesión */}
      {mostrarModalSesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={() => setMostrarModalSesion(false)}>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg/50">
              <div>
                <h3 className="text-base font-bold text-text-primary">Registrar Sesión y Seguimiento de Psicología</h3>
                <p className="text-[10px] text-text-muted">Registrando caso de: {alumnoSeleccionado?.usuario?.nombre}</p>
              </div>
              <button onClick={() => setMostrarModalSesion(false)} className="p-2 hover:bg-bg rounded-lg text-text-secondary"><X size={18} /></button>
            </div>
            
            <form onSubmit={registrarSesion} className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2.5">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Las notas clínicas detalladas que registres en este formulario son confidenciales y no son visibles para tutores, profesores o jefes de carrera.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Notas Clínicas Privadas (Detalles de la sesión)</label>
                <textarea
                  required
                  value={notaSesion}
                  onChange={e => setNotaSesion(e.target.value)}
                  placeholder="Detalles confidenciales de la sesión de orientación, estado emocional del estudiante y plan terapéutico..."
                  rows="4"
                  className="w-full bg-bg border border-border rounded-xl p-3 text-sm text-text-primary focus:outline-none focus:border-primary-dark"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Estado / Diagnóstico de evolución</label>
                <select
                  value={estadoResultado}
                  onChange={e => setEstadoResultado(e.target.value)}
                  className="w-full bg-bg border border-border rounded-xl p-2.5 text-sm text-text-primary focus:outline-none"
                >
                  <option value="mejoro">Mejoró (Estabilidad lograda)</option>
                  <option value="igual">Igual (Requiere seguimiento continuo)</option>
                  <option value="empeoro">Empeoró (Crisis o caso urgente a derivar)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-bg border border-border rounded-xl p-3">
                <input
                  type="checkbox"
                  id="chkCerrarAlerta"
                  checked={cerrarAlerta}
                  onChange={e => setCerrarAlerta(e.target.checked)}
                  className="w-4 h-4 accent-primary-dark cursor-pointer"
                />
                <label htmlFor="chkCerrarAlerta" className="text-xs font-bold text-text-primary cursor-pointer select-none">
                  Marcar alerta/canalización como CERRADA (Caso resuelto)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={() => setMostrarModalSesion(false)} className="px-4 py-2 border border-border rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors">Cancelar</button>
                <button
                  type="submit"
                  disabled={guardandoSesion}
                  className="px-5 py-2 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors flex items-center gap-2"
                >
                  {guardandoSesion ? 'Enviando...' : 'Registrar Sesión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
