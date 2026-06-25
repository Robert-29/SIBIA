import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import RiskBadge from '../../components/ui/RiskBadge.jsx';
import { Search, Loader2, GraduationCap, ArrowRight } from 'lucide-react';

export default function AlumnosList() {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCarrera, setFiltroCarrera] = useState('todos');

  useEffect(() => {
    const cargarAlumnos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get('/alumnos');
        setAlumnos(data);
      } catch (err) {
        console.error('Error al cargar alumnos:', err);
        setError('Error al cargar los alumnos.');
      } finally {
        setLoading(false);
      }
    };

    cargarAlumnos();
  }, []);

  const alumnosFiltrados = alumnos.filter(al => {
    const coincideBusqueda = 
      (al.usuarios?.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (al.matricula || '').toLowerCase().includes(busqueda.toLowerCase());

    const coincideCarrera = 
      filtroCarrera === 'todos' || 
      (al.carreras?.nombre || '').toLowerCase().includes(filtroCarrera.toLowerCase());

    return coincideBusqueda && coincideCarrera;
  });

  const carrerasDisponibles = ['todos', ...new Set(alumnos.map(al => al.carreras?.nombre).filter(Boolean))];

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary-dark" size={32} />
        <p className="text-text-secondary font-medium">Cargando directorio de estudiantes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">Directorio de Alumnos</h1>
        <p className="text-text-secondary text-sm">Gestiona y consulta el estatus general de los estudiantes del sistema.</p>
      </div>

      {/* Buscador y Filtros */}
      <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 text-text-muted" size={16} />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o matrícula..."
            className="w-full bg-bg border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-dark text-text-primary"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {carrerasDisponibles.map(carrera => (
            <button
              key={carrera}
              onClick={() => setFiltroCarrera(carrera)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                filtroCarrera === carrera
                  ? 'bg-primary-dark text-white'
                  : 'bg-primary-light text-primary-dark hover:bg-accent'
              }`}
            >
              {carrera === 'todos' ? 'Todas las Carreras' : carrera.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Listado en Tarjeta */}
      <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-primary-light/40 border-b border-border text-text-secondary font-semibold">
                <th className="p-4">Estudiante</th>
                <th className="p-4">Matrícula</th>
                <th className="p-4">Carrera</th>
                <th className="p-4 text-center">Semestre</th>
                <th className="p-4 text-center">Promedio</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alumnosFiltrados.length > 0 ? (
                alumnosFiltrados.map((al, idx) => (
                  <tr 
                    key={al.id} 
                    className={`hover:bg-primary-light/25 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-primary-light/10'
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark border border-primary/10">
                          <GraduationCap size={16} />
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{al.usuarios?.nombre || 'Alumno'}</p>
                          <p className="text-xs text-text-secondary">{al.usuarios?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono-data text-xs text-text-secondary">
                      {al.matricula}
                    </td>
                    <td className="p-4 text-text-secondary font-medium">
                      {al.carreras?.nombre || 'Carrera'}
                    </td>
                    <td className="p-4 text-center text-text-primary font-semibold">
                      {al.semestre_actual}°
                    </td>
                    <td className="p-4 text-center font-mono-data text-sm font-bold text-text-primary">
                      {al.promedio_general}
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/alumnos/${al.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-primary-light text-primary-dark hover:bg-primary hover:text-white px-3 py-2 rounded-xl transition-all cursor-pointer border border-primary/10"
                      >
                        Ver Ficha
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-secondary font-medium">
                    No se encontraron alumnos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
