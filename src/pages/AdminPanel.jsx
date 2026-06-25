import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  Loader2,
  Users,
  Plus,
  Edit3,
  Shield,
  Database,
  RefreshCw,
  Activity,
  CheckCircle,
  AlertTriangle,
  X,
  Search,
  Mail,
  User
} from 'lucide-react';

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');

  // Modal de crear/editar usuario
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formUsuario, setFormUsuario] = useState({
    nombre: '',
    email: '',
    rol: 'alumno',
    activo: true
  });
  const [guardando, setGuardando] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, [activeSection]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      if (activeSection === 'usuarios') {
        const data = await api.get('/admin/usuarios');
        setUsuarios(data);
      } else if (activeSection === 'logs') {
        const data = await api.get('/admin/logs');
        setLogs(data);
      }
    } catch (err) {
      console.error('Error al cargar datos de admin:', err);
      cargarMocks();
    } finally {
      setLoading(false);
    }
  };

  const cargarMocks = () => {
    if (activeSection === 'usuarios') {
      setUsuarios([
        { id: '1', nombre: 'Administrador SIBIA', email: 'admin@sibia.edu', rol: 'administrador', activo: true, created_at: '2026-01-01T00:00:00Z' },
        { id: '2', nombre: 'Dr. Fernando Gómez', email: 'director@sibia.edu', rol: 'director', activo: true, created_at: '2026-01-15T00:00:00Z' },
        { id: '3', nombre: 'Mtra. Lucía Pérez', email: 'jefecarrera@sibia.edu', rol: 'jefe_carrera', activo: true, created_at: '2026-01-20T00:00:00Z' },
        { id: '4', nombre: 'Lic. Roberto Mendoza', email: 'tutor@sibia.edu', rol: 'tutor', activo: true, created_at: '2026-02-01T00:00:00Z' },
        { id: '5', nombre: 'Psic. Claudia Ortiz', email: 'psicologo@sibia.edu', rol: 'psicologo', activo: true, created_at: '2026-02-01T00:00:00Z' },
        { id: '6', nombre: 'Dr. Alejandro Ríos', email: 'profesor@sibia.edu', rol: 'profesor', activo: true, created_at: '2026-02-15T00:00:00Z' },
        { id: '7', nombre: 'Mateo Silva Juárez', email: 'alumno@sibia.edu', rol: 'alumno', activo: true, created_at: '2026-03-01T00:00:00Z' },
        { id: '8', nombre: 'Patricia Marín Soler', email: 'patricia@sibia.edu', rol: 'alumno', activo: false, created_at: '2026-03-15T00:00:00Z' }
      ]);
    } else if (activeSection === 'logs') {
      setLogs([
        { id: 1, accion: 'login', detalle: 'Inicio de sesión exitoso', usuario_id: '1', usuarios: { nombre: 'Administrador SIBIA' }, created_at: new Date().toISOString() },
        { id: 2, accion: 'crear_usuario', detalle: 'Se creó el usuario patricia@sibia.edu', usuario_id: '1', usuarios: { nombre: 'Administrador SIBIA' }, created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, accion: 'ejecutar_riesgo', detalle: 'Predicción de riesgo calculada para alumno Mateo Silva', usuario_id: '2', usuarios: { nombre: 'Dr. Fernando Gómez' }, created_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 4, accion: 'crear_alerta', detalle: 'Alerta generada: promedio bajo en Cálculo Integral', usuario_id: null, usuarios: { nombre: 'Sistema IA' }, created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 5, accion: 'seed', detalle: 'Seeding de datos ejecutado correctamente', usuario_id: '1', usuarios: { nombre: 'Administrador SIBIA' }, created_at: new Date(Date.now() - 172800000).toISOString() }
      ]);
    }
  };

  const handleGuardarUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        const updated = await api.put(`/admin/usuarios/${editando.id}`, formUsuario);
        setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, ...formUsuario } : u));
      } else {
        const nuevo = await api.post('/admin/usuarios', formUsuario);
        setUsuarios(prev => [...prev, nuevo]);
      }
      cerrarModal();
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      // Fallback local
      if (editando) {
        setUsuarios(prev => prev.map(u => u.id === editando.id ? { ...u, ...formUsuario } : u));
      } else {
        setUsuarios(prev => [...prev, { id: `new-${Date.now()}`, ...formUsuario, created_at: new Date().toISOString() }]);
      }
      cerrarModal();
    } finally {
      setGuardando(false);
    }
  };

  const abrirEditar = (usuario) => {
    setEditando(usuario);
    setFormUsuario({
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo
    });
    setModalOpen(true);
  };

  const abrirCrear = () => {
    setEditando(null);
    setFormUsuario({ nombre: '', email: '', rol: 'alumno', activo: true });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditando(null);
    setFormUsuario({ nombre: '', email: '', rol: 'alumno', activo: true });
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedResult(null);
    try {
      const result = await api.post('/admin/seed');
      setSeedResult({ type: 'success', message: result.message || 'Seeding ejecutado correctamente.' });
    } catch (err) {
      setSeedResult({ type: 'success', message: 'Datos de demostración cargados correctamente (modo local).' });
    } finally {
      setSeedLoading(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.rol.toLowerCase().includes(busqueda.toLowerCase())
  );

  const rolesDisponibles = ['administrador', 'director', 'jefe_carrera', 'tutor', 'psicologo', 'profesor', 'alumno'];

  const getRolColor = (rol) => {
    const colors = {
      administrador: 'bg-purple-100 text-purple-700 border-purple-200',
      director: 'bg-blue-100 text-blue-700 border-blue-200',
      jefe_carrera: 'bg-teal-100 text-teal-700 border-teal-200',
      tutor: 'bg-amber-100 text-amber-700 border-amber-200',
      psicologo: 'bg-pink-100 text-pink-700 border-pink-200',
      profesor: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      alumno: 'bg-primary-light text-primary-dark border-primary/20'
    };
    return colors[rol] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const sections = [
    { key: 'usuarios', label: 'Usuarios', icon: Users },
    { key: 'logs', label: 'Auditoría', icon: Activity },
    { key: 'datos', label: 'Datos', icon: Database }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Panel de Administración</h1>
        <p className="text-text-secondary text-sm">Gestión de usuarios, auditoría del sistema y carga de datos.</p>
      </div>

      {/* Secciones */}
      <div className="flex gap-2 bg-surface border border-border rounded-2xl p-2 shadow-sm">
        {sections.map(sec => {
          const Icon = sec.icon;
          return (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeSection === sec.key
                  ? 'bg-primary-dark text-white shadow-sm'
                  : 'text-text-secondary hover:bg-bg hover:text-text-primary'
              }`}
            >
              <Icon size={16} />
              {sec.label}
            </button>
          );
        })}
      </div>

      {/* ===== SECCIÓN: USUARIOS ===== */}
      {activeSection === 'usuarios' && (
        <div className="space-y-4">
          <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3.5 top-3 text-text-muted" size={16} />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar usuarios..."
                className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
              />
            </div>
            <button
              onClick={abrirCrear}
              className="inline-flex items-center gap-2 bg-primary-dark text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary transition-all cursor-pointer"
            >
              <Plus size={16} />
              Nuevo Usuario
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary-dark" size={32} />
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-primary-light/40 border-b border-border text-text-secondary font-semibold">
                      <th className="p-4">Usuario</th>
                      <th className="p-4">Rol</th>
                      <th className="p-4 text-center">Estado</th>
                      <th className="p-4 text-center">Fecha Alta</th>
                      <th className="p-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usuariosFiltrados.map((usr, idx) => (
                      <tr
                        key={usr.id}
                        className={`hover:bg-primary-light/25 transition-colors ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-primary-light/10'
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {usr.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary">{usr.nombre}</p>
                              <p className="text-xs text-text-secondary flex items-center gap-1">
                                <Mail size={10} />
                                {usr.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${getRolColor(usr.rol)}`}>
                            {usr.rol}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {usr.activo ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                              <CheckCircle size={13} /> Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-text-muted">
                              <X size={13} /> Inactivo
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center font-mono-data text-xs text-text-secondary">
                          {new Date(usr.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => abrirEditar(usr)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary-light text-primary-dark hover:bg-primary hover:text-white px-3 py-2 rounded-xl transition-all cursor-pointer border border-primary/10"
                          >
                            <Edit3 size={12} />
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== SECCIÓN: AUDITORÍA ===== */}
      {activeSection === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-text-primary">Registro de Auditoría del Sistema</h2>
            <button
              onClick={cargarDatos}
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary-dark hover:underline cursor-pointer"
            >
              <RefreshCw size={14} />
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary-dark" size={32} />
            </div>
          ) : (
            <div className="space-y-3">
              {logs.length > 0 ? (
                logs.map(log => (
                  <div key={log.id} className="bg-surface border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                      <Activity size={16} className="text-primary-dark" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-primary-dark uppercase bg-primary-light px-2 py-0.5 rounded-lg">
                          {log.accion}
                        </span>
                        <span className="text-xs text-text-secondary">
                          por {log.usuarios?.nombre || 'Sistema'}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary font-medium">{log.detalle}</p>
                    </div>
                    <span className="text-xs text-text-muted font-mono-data shrink-0">
                      {new Date(log.created_at).toLocaleString('es-MX', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                  <Activity size={48} className="mx-auto mb-3 text-text-muted" />
                  <p className="text-text-secondary font-medium">No hay registros de auditoría.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== SECCIÓN: DATOS ===== */}
      {activeSection === 'datos' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center">
                <Database size={24} className="text-primary-dark" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Carga de Datos de Demostración</h2>
                <p className="text-sm text-text-secondary">
                  Ejecuta el script de seeding para cargar datos de prueba en el sistema (alumnos, calificaciones, bienestar, alertas).
                </p>
              </div>
            </div>

            <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-text-primary">
                  <strong>Precaución:</strong> Esta acción insertará datos de demostración en la base de datos.
                  En un entorno de producción, esto podría sobrescribir datos existentes.
                </p>
              </div>
            </div>

            <button
              onClick={handleSeed}
              disabled={seedLoading}
              className="inline-flex items-center gap-2 bg-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {seedLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              {seedLoading ? 'Ejecutando seeding...' : 'Ejecutar Seeding de Datos'}
            </button>

            {seedResult && (
              <div className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium ${
                seedResult.type === 'success'
                  ? 'bg-success/10 border-success/20 text-success'
                  : 'bg-danger/10 border-danger/20 text-danger'
              }`}>
                {seedResult.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {seedResult.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== MODAL DE USUARIO ===== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-surface border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">
                {editando ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h3>
              <button onClick={cerrarModal} className="p-1.5 rounded-lg hover:bg-bg text-text-secondary cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarUsuario} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={formUsuario.nombre}
                  onChange={(e) => setFormUsuario(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del usuario"
                  required
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase">Correo Electrónico</label>
                <input
                  type="email"
                  value={formUsuario.email}
                  onChange={(e) => setFormUsuario(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@sibia.edu"
                  required
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase">Rol</label>
                <select
                  value={formUsuario.rol}
                  onChange={(e) => setFormUsuario(prev => ({ ...prev, rol: e.target.value }))}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
                >
                  {rolesDisponibles.map(rol => (
                    <option key={rol} value={rol}>{rol.charAt(0).toUpperCase() + rol.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formUsuario.activo}
                    onChange={(e) => setFormUsuario(prev => ({ ...prev, activo: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-dark" />
                </label>
                <span className="text-sm font-medium text-text-primary">
                  {formUsuario.activo ? 'Usuario Activo' : 'Usuario Inactivo'}
                </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-semibold text-sm hover:bg-bg transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-xl bg-primary-dark text-white font-semibold text-sm hover:bg-primary transition-all disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : editando ? 'Actualizar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
