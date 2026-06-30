import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import DirectorDashboard from './DirectorDashboard.jsx';
import {
  LayoutDashboard, Users, Plus, Search, Edit2, Trash2, CheckCircle, XCircle,
  Shield, User, Mail, Key, Loader2, X, AlertTriangle, RefreshCw,
  Lock, ToggleLeft, ToggleRight, ChevronDown
} from 'lucide-react';

const ROLES = [
  { id: 8,  nombre: 'administrador',  label: 'Administrador',  color: 'bg-purple-100 text-purple-800' },
  { id: 9,  nombre: 'director',       label: 'Director',       color: 'bg-blue-100 text-blue-800' },
  { id: 10, nombre: 'jefe_carrera',   label: 'Jefe de Carrera',color: 'bg-indigo-100 text-indigo-800' },
  { id: 11, nombre: 'tutor',          label: 'Tutor',          color: 'bg-cyan-100 text-cyan-800' },
  { id: 12, nombre: 'psicologo',      label: 'Psicólogo',      color: 'bg-emerald-100 text-emerald-800' },
  { id: 13, nombre: 'profesor',       label: 'Profesor',       color: 'bg-amber-100 text-amber-800' },
  { id: 14, nombre: 'alumno',         label: 'Alumno',         color: 'bg-gray-100 text-gray-700' },
];

const getRolInfo = (rol_id, roles_nombre) => {
  const found = ROLES.find(r => r.id === rol_id || r.nombre === roles_nombre);
  return found || { label: roles_nombre || 'Sin rol', color: 'bg-gray-100 text-gray-600' };
};

const USUARIO_VACIO = { nombre: '', email: '', contrasena: '', rol_id: 14, activo: true };

function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');

  const [modal, setModal] = useState(null);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
  const [form, setForm] = useState(USUARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, tipo = 'ok') => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const data = await api.get('/admin/usuarios');
      setUsuarios(data || []);
    } catch (e) {
      showToast('Error al cargar usuarios', 'error');
    } finally {
      setCargando(false);
    }
  };

  const cerrarModal = () => { setModal(null); setUsuarioEditar(null); setForm(USUARIO_VACIO); };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (modal === 'crear') {
        await api.post('/admin/usuarios', { ...form, rol_id: parseInt(form.rol_id) });
        showToast(`Usuario ${form.email} creado exitosamente`);
      } else {
        const payload = { nombre: form.nombre, email: form.email, rol_id: parseInt(form.rol_id), activo: form.activo };
        if (form.contrasena) payload.contrasena = form.contrasena;
        await api.put(`/admin/usuarios/${usuarioEditar.id}`, payload);
        showToast(`Usuario actualizado correctamente`);
      }
      cerrarModal();
      await cargarUsuarios();
    } catch (e) {
      showToast(e?.message || 'Error al guardar', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarUsuario = async () => {
    setGuardando(true);
    try {
      await api.delete(`/admin/usuarios/${usuarioEditar.id}`);
      showToast('Usuario eliminado');
      cerrarModal();
      await cargarUsuarios();
    } catch (e) {
      showToast(e?.message || 'Error al eliminar', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const toggleActivo = async (u) => {
    try {
      await api.put(`/admin/usuarios/${u.id}`, { nombre: u.nombre, email: u.email, rol_id: u.rol_id, activo: !u.activo });
      showToast(`Usuario ${!u.activo ? 'activado' : 'desactivado'}`);
      await cargarUsuarios();
    } catch (e) {
      showToast('Error al cambiar estado', 'error');
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const ok1 = !busqueda || u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || u.email?.toLowerCase().includes(busqueda.toLowerCase());
    const ok2 = filtroRol === 'todos' || u.roles?.nombre === filtroRol;
    return ok1 && ok2;
  });

  const totalActivos   = usuarios.filter(u => u.activo).length;
  const totalInactivos = usuarios.filter(u => !u.activo).length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 font-semibold text-sm
          ${toast.tipo === 'error' ? 'bg-red-600 text-white' : 'bg-primary-dark text-white'}`}>
          {toast.tipo === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Header de sección */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
           style={{ background: 'linear-gradient(135deg, rgba(103,58,183,0.07) 0%, rgba(33,150,243,0.04) 100%)' }}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Gestión de Usuarios</h2>
          <p className="text-text-secondary text-sm mt-0.5 flex items-center gap-1.5">
            <Shield size={13} className="text-primary-dark" />
            Crear, editar, desactivar o eliminar usuarios y asignar roles del sistema
          </p>
        </div>
        <button
          onClick={() => { setForm(USUARIO_VACIO); setModal('crear'); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-dark text-white rounded-xl font-semibold text-sm hover:bg-primary transition-colors shadow-sm"
        >
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: usuarios.length, icon: Users, color: 'bg-primary-light text-primary-dark' },
          { label: 'Activos', value: totalActivos, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Inactivos', value: totalInactivos, icon: XCircle, color: 'bg-red-50 text-red-500' },
          { label: 'Roles', value: ROLES.length, icon: Key, color: 'bg-amber-50 text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase">{label}</p>
              <p className="text-2xl font-bold text-text-primary">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla con filtros */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar nombre o email..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-bg border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-primary-dark"
            />
          </div>
          <div className="relative">
            <select
              value={filtroRol}
              onChange={e => setFiltroRol(e.target.value)}
              className="pl-3 pr-8 py-2 bg-bg border border-border rounded-xl text-sm text-text-primary focus:outline-none appearance-none cursor-pointer"
            >
              <option value="todos">Todos los roles</option>
              {ROLES.map(r => <option key={r.id} value={r.nombre}>{r.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <button onClick={cargarUsuarios} className="p-2 border border-border rounded-xl hover:bg-bg transition-colors text-text-secondary" title="Recargar">
            <RefreshCw size={15} />
          </button>
        </div>

        {cargando ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-dark" size={32} /></div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="text-center py-16 text-text-secondary text-sm">No se encontraron usuarios con ese criterio.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg text-text-secondary text-xs font-bold uppercase border-b border-border">
                  <th className="px-5 py-3">Usuario</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Rol</th>
                  <th className="px-5 py-3 text-center">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usuariosFiltrados.map(u => {
                  const rolInfo = getRolInfo(u.rol_id, u.roles?.nombre);
                  return (
                    <tr key={u.id} className="hover:bg-bg/40 transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary-dark font-bold text-xs shrink-0">
                            {u.nombre?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-sm font-semibold text-text-primary">{u.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-text-secondary">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${rolInfo.color}`}>
                          {rolInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => toggleActivo(u)}
                          className="flex items-center gap-1.5 mx-auto text-xs font-semibold transition-colors"
                          title="Clic para cambiar estado"
                        >
                          {u.activo
                            ? <><ToggleRight size={20} className="text-emerald-500" /><span className="text-emerald-600">Activo</span></>
                            : <><ToggleLeft size={20} className="text-text-muted" /><span className="text-text-muted">Inactivo</span></>
                          }
                        </button>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setUsuarioEditar(u); setForm({ nombre: u.nombre, email: u.email, contrasena: '', rol_id: u.rol_id, activo: u.activo }); setModal('editar'); }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => { setUsuarioEditar(u); setModal('confirmarEliminar'); }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-5 py-3 text-xs text-text-muted border-t border-border">
              Mostrando {usuariosFiltrados.length} de {usuarios.length} usuarios
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {(modal === 'crear' || modal === 'editar') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={cerrarModal}>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-base font-bold text-text-primary">
                {modal === 'crear' ? 'Crear Nuevo Usuario' : `Editar: ${usuarioEditar?.nombre}`}
              </h3>
              <button onClick={cerrarModal} className="p-2 hover:bg-bg rounded-lg text-text-secondary"><X size={18} /></button>
            </div>
            <form onSubmit={guardarUsuario} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1"><User size={11} /> Nombre completo</label>
                <input required type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej. Juan Pérez López"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-dark" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1"><Mail size={11} /> Correo electrónico</label>
                <input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="correo@sibia.edu.mx"
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-dark" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1">
                  <Lock size={11} /> Contraseña {modal === 'editar' && <span className="text-text-muted font-normal normal-case">(vacío = no cambiar)</span>}
                </label>
                <input type="password" required={modal === 'crear'} value={form.contrasena}
                  onChange={e => setForm(f => ({ ...f, contrasena: e.target.value }))}
                  placeholder={modal === 'crear' ? 'Contraseña inicial' : '••••••••'}
                  className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-primary-dark" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase flex items-center gap-1"><Key size={11} /> Rol del sistema</label>
                <div className="relative">
                  <select value={form.rol_id} onChange={e => setForm(f => ({ ...f, rol_id: parseInt(e.target.value) }))}
                    className="w-full bg-bg border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none appearance-none cursor-pointer">
                    {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                </div>
                <span className={`inline-block mt-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${getRolInfo(form.rol_id, null).color}`}>
                  {getRolInfo(form.rol_id, null).label}
                </span>
              </div>
              <div className="flex items-center gap-3 bg-bg border border-border rounded-xl p-3">
                <input type="checkbox" id="chkActivo" checked={form.activo} onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))}
                  className="w-4 h-4 accent-primary-dark cursor-pointer" />
                <label htmlFor="chkActivo" className="text-xs font-bold text-text-primary cursor-pointer select-none">
                  Usuario activo (puede iniciar sesión)
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button type="button" onClick={cerrarModal} className="px-4 py-2 border border-border rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors">Cancelar</button>
                <button type="submit" disabled={guardando} className="px-5 py-2 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors flex items-center gap-2">
                  {guardando ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : modal === 'crear' ? 'Crear Usuario' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Eliminación */}
      {modal === 'confirmarEliminar' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={cerrarModal}>
          <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Eliminar usuario</h3>
              <p className="text-sm text-text-secondary mt-1">
                ¿Eliminar a <strong>{usuarioEditar?.nombre}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={cerrarModal} className="px-4 py-2 border border-border rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors">Cancelar</button>
              <button onClick={eliminarUsuario} disabled={guardando}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Wrapper principal: Panel institucional + CRUD
// ─────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState('panel');

  const tabs = [
    { id: 'panel',    label: 'Panel Institucional', icon: LayoutDashboard },
    { id: 'usuarios', label: 'Gestión de Usuarios',  icon: Users },
  ];

  return (
    <div className="space-y-4">
      {/* Tabs selector */}
      <div className="flex gap-2 border-b border-border pb-0">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-xl border-b-2 transition-all
              ${tab === id
                ? 'border-primary-dark text-primary-dark bg-primary-light/20'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-bg'
              }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      {tab === 'panel'    && <DirectorDashboard />}
      {tab === 'usuarios' && <GestionUsuarios />}
    </div>
  );
}
