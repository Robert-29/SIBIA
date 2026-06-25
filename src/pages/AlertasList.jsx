import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useRol } from '../hooks/useRol.js';
import AlertCard from '../components/ui/AlertCard.jsx';
import {
  Loader2,
  AlertTriangle,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  Bell
} from 'lucide-react';

export default function AlertasList() {
  const navigate = useNavigate();
  const { esRol } = useRol();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const puedeGestionar = esRol(['administrador', 'jefe_carrera', 'tutor', 'psicologo']);

  useEffect(() => {
    const cargarAlertas = async () => {
      setLoading(true);
      try {
        const data = await api.get('/alertas');
        setAlertas(data);
      } catch (err) {
        console.error('Error al cargar alertas:', err);
        // Mock para desarrollo
        setAlertas([
          {
            id: 1,
            tipo: 'academica',
            descripcion: 'Promedio parcial inferior a 7.0 en Cálculo Integral. Tendencia descendente confirmada por el sistema.',
            estado: 'activa',
            alumno_id: '1',
            alumnos: { usuarios: { nombre: 'Mateo Silva Juárez' }, matricula: '20261001' },
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            tipo: 'bienestar',
            descripcion: 'Nivel de estrés autoreportado superior a 8/10. El alumno reporta privación de sueño y baja motivación.',
            estado: 'activa',
            alumno_id: '1',
            alumnos: { usuarios: { nombre: 'Mateo Silva Juárez' }, matricula: '20261001' },
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 3,
            tipo: 'asistencia',
            descripcion: 'El alumno acumula más de 3 faltas consecutivas en Física II. Porcentaje de asistencia debajo del 80%.',
            estado: 'atendida',
            alumno_id: '1',
            alumnos: { usuarios: { nombre: 'Mateo Silva Juárez' }, matricula: '20261001' },
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 4,
            tipo: 'academica',
            descripcion: 'Calificación reprobatoria en segundo parcial de Anatomía. Se recomienda intervención tutorial inmediata.',
            estado: 'activa',
            alumno_id: '2',
            alumnos: { usuarios: { nombre: 'Patricia Marín Soler' }, matricula: '20261015' },
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 5,
            tipo: 'riesgo_ia',
            descripcion: 'El modelo de IA ha reclasificado a este alumno como riesgo ALTO (72%). Factores principales: estrés, inasistencia y promedio bajo.',
            estado: 'cerrada',
            alumno_id: '3',
            alumnos: { usuarios: { nombre: 'Carlos Gómez Ortiz' }, matricula: '20261003' },
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    cargarAlertas();
  }, []);

  const handleAtender = async (alertaId) => {
    try {
      await api.put(`/alertas/${alertaId}/atender`);
      setAlertas(prev => prev.map(a => a.id === alertaId ? { ...a, estado: 'atendida' } : a));
    } catch (err) {
      // Fallback local
      setAlertas(prev => prev.map(a => a.id === alertaId ? { ...a, estado: 'atendida' } : a));
    }
  };

  const handleCerrar = async (alertaId) => {
    try {
      await api.put(`/alertas/${alertaId}/cerrar`);
      setAlertas(prev => prev.map(a => a.id === alertaId ? { ...a, estado: 'cerrada' } : a));
    } catch (err) {
      setAlertas(prev => prev.map(a => a.id === alertaId ? { ...a, estado: 'cerrada' } : a));
    }
  };

  const alertasFiltradas = alertas.filter(a => {
    const matchEstado = filtroEstado === 'todas' || a.estado === filtroEstado;
    const matchTipo = filtroTipo === 'todos' || a.tipo === filtroTipo;
    return matchEstado && matchTipo;
  });

  const conteos = {
    activas: alertas.filter(a => a.estado === 'activa').length,
    atendidas: alertas.filter(a => a.estado === 'atendida').length,
    cerradas: alertas.filter(a => a.estado === 'cerrada').length
  };

  const tiposDisponibles = ['todos', ...new Set(alertas.map(a => a.tipo))];

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-dark" size={32} />
        <p className="text-text-secondary font-medium">Cargando centro de alertas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Centro de Alertas</h1>
        <p className="text-text-secondary text-sm">Monitorea y gestiona las alertas generadas por el sistema y la IA.</p>
      </div>

      {/* Resumen con contadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFiltroEstado(filtroEstado === 'activa' ? 'todas' : 'activa')}
          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroEstado === 'activa'
              ? 'bg-danger/5 border-danger/30 shadow-sm'
              : 'bg-surface border-border hover:border-danger/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
            <AlertTriangle size={20} className="text-danger" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold font-mono-data text-text-primary">{conteos.activas}</p>
            <p className="text-xs font-semibold text-text-secondary uppercase">Activas</p>
          </div>
        </button>

        <button
          onClick={() => setFiltroEstado(filtroEstado === 'atendida' ? 'todas' : 'atendida')}
          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroEstado === 'atendida'
              ? 'bg-warning/5 border-warning/30 shadow-sm'
              : 'bg-surface border-border hover:border-warning/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <Clock size={20} className="text-warning" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold font-mono-data text-text-primary">{conteos.atendidas}</p>
            <p className="text-xs font-semibold text-text-secondary uppercase">Atendidas</p>
          </div>
        </button>

        <button
          onClick={() => setFiltroEstado(filtroEstado === 'cerrada' ? 'todas' : 'cerrada')}
          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
            filtroEstado === 'cerrada'
              ? 'bg-success/5 border-success/30 shadow-sm'
              : 'bg-surface border-border hover:border-success/20'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
            <CheckCircle size={20} className="text-success" />
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold font-mono-data text-text-primary">{conteos.cerradas}</p>
            <p className="text-xs font-semibold text-text-secondary uppercase">Cerradas</p>
          </div>
        </button>
      </div>

      {/* Filtro de tipo */}
      <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
          <Filter size={16} />
          Filtrar por tipo:
        </div>
        <div className="flex flex-wrap gap-2">
          {tiposDisponibles.map(tipo => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                filtroTipo === tipo
                  ? 'bg-primary-dark text-white'
                  : 'bg-primary-light text-primary-dark hover:bg-accent'
              }`}
            >
              {tipo === 'todos' ? 'Todos los tipos' : tipo.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de alertas */}
      <div className="space-y-4">
        {alertasFiltradas.length > 0 ? (
          alertasFiltradas.map(alerta => (
            <div key={alerta.id} className="bg-surface border border-border rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    alerta.tipo === 'academica' ? 'bg-warning/10' :
                    alerta.tipo === 'bienestar' ? 'bg-danger/10' :
                    alerta.tipo === 'asistencia' ? 'bg-info/10' :
                    'bg-primary-light'
                  }`}>
                    {alerta.tipo === 'academica' && <AlertTriangle size={18} className="text-warning" />}
                    {alerta.tipo === 'bienestar' && <AlertTriangle size={18} className="text-danger" />}
                    {alerta.tipo === 'asistencia' && <Clock size={18} className="text-info" />}
                    {alerta.tipo === 'riesgo_ia' && <Bell size={18} className="text-primary-dark" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                        {alerta.tipo?.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        alerta.estado === 'activa' ? 'bg-danger/10 text-danger border-danger/20' :
                        alerta.estado === 'atendida' ? 'bg-warning/10 text-warning border-warning/20' :
                        'bg-success/10 text-success border-success/20'
                      }`}>
                        {alerta.estado}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary font-medium leading-relaxed">
                      {alerta.descripcion}
                    </p>
                    {alerta.alumnos && (
                      <button
                        onClick={() => navigate(`/alumnos/${alerta.alumno_id}`)}
                        className="mt-2 text-xs text-primary-dark font-semibold hover:underline cursor-pointer"
                      >
                        → {alerta.alumnos.usuarios?.nombre} ({alerta.alumnos.matricula})
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs text-text-muted font-mono-data block mb-2">
                    {new Date(alerta.created_at).toLocaleDateString('es-MX', {
                      day: 'numeric', month: 'short'
                    })}
                  </span>

                  {puedeGestionar && alerta.estado === 'activa' && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAtender(alerta.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 text-xs font-semibold transition-all cursor-pointer border border-warning/20"
                        title="Marcar como atendida"
                      >
                        <Clock size={13} />
                      </button>
                      <button
                        onClick={() => handleCerrar(alerta.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 text-xs font-semibold transition-all cursor-pointer border border-success/20"
                        title="Cerrar alerta"
                      >
                        <CheckCircle size={13} />
                      </button>
                    </div>
                  )}

                  {puedeGestionar && alerta.estado === 'atendida' && (
                    <button
                      onClick={() => handleCerrar(alerta.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 text-xs font-semibold transition-all cursor-pointer border border-success/20"
                      title="Cerrar alerta"
                    >
                      <CheckCircle size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center">
            <Bell size={48} className="mx-auto mb-3 text-text-muted" />
            <p className="text-text-secondary font-medium">No hay alertas que coincidan con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
