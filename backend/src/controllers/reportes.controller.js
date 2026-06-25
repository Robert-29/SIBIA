import { supabase } from '../services/supabase.service.js';

export const obtenerUniversidadKPIs = async (req, res) => {
  try {
    const { data: alumnos } = await supabase.from('alumnos').select('id, promedio_general');
    const { data: alertas } = await supabase.from('alertas').select('id, estado');
    const { data: predicciones } = await supabase.from('predicciones_riesgo').select('nivel_riesgo, alumno_id').order('fecha_prediccion', { ascending: false });

    // Calcular KPIs
    const totalAlumnos = alumnos ? alumnos.length : 0;
    const promedios = alumnos ? alumnos.map(a => parseFloat(a.promedio_general) || 0) : [];
    const promedioGeneral = promedios.length > 0 ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2) : 0;
    
    const alertasActivas = alertas ? alertas.filter(a => a.estado === 'activa').length : 0;

    // Obtener la última predicción de cada alumno
    const ultimasPredicciones = {};
    if (predicciones) {
      predicciones.forEach(p => {
        if (!ultimasPredicciones[p.alumno_id]) {
          ultimasPredicciones[p.alumno_id] = p.nivel_riesgo;
        }
      });
    }

    const riesgoCounts = { bajo: 0, medio: 0, alto: 0, critico: 0 };
    Object.values(ultimasPredicciones).forEach(nivel => {
      if (riesgoCounts[nivel] !== undefined) {
        riesgoCounts[nivel]++;
      }
    });

    // Rellenar los alumnos que no tengan predicción como 'bajo'
    const alumnosConPred = Object.keys(ultimasPredicciones).length;
    riesgoCounts.bajo += Math.max(0, totalAlumnos - alumnosConPred);

    return res.status(200).json({
      total_alumnos: totalAlumnos,
      promedio_general: parseFloat(promedioGeneral),
      alertas_activas: alertasActivas,
      distribucion_riesgo: riesgoCounts
    });
  } catch (error) {
    console.error('Error en obtenerUniversidadKPIs:', error);
    return res.status(500).json({ error: 'Error al calcular KPIs globales de la universidad.' });
  }
};

export const obtenerCarreraKPIs = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: alumnos } = await supabase.from('alumnos').select('id, promedio_general').eq('carrera_id', id);
    const { data: carrera } = await supabase.from('carreras').select('nombre').eq('id', id).single();

    const totalAlumnos = alumnos ? alumnos.length : 0;
    const promedios = alumnos ? alumnos.map(a => parseFloat(a.promedio_general) || 0) : [];
    const promedioGeneral = promedios.length > 0 ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2) : 0;

    return res.status(200).json({
      carrera: carrera?.nombre || 'Carrera',
      total_alumnos: totalAlumnos,
      promedio_general: parseFloat(promedioGeneral)
    });
  } catch (error) {
    console.error('Error en obtenerCarreraKPIs:', error);
    return res.status(500).json({ error: 'Error al obtener KPIs de la carrera.' });
  }
};

export const obtenerDistribucionRiesgo = async (req, res) => {
  try {
    const { data: alumnos } = await supabase.from('alumnos').select('id');
    const { data: predicciones } = await supabase.from('predicciones_riesgo').select('nivel_riesgo, alumno_id').order('fecha_prediccion', { ascending: false });

    const totalAlumnos = alumnos ? alumnos.length : 0;
    const ultimasPredicciones = {};
    if (predicciones) {
      predicciones.forEach(p => {
        if (!ultimasPredicciones[p.alumno_id]) {
          ultimasPredicciones[p.alumno_id] = p.nivel_riesgo;
        }
      });
    }

    const distribucion = [
      { name: 'bajo', value: 0, color: '#66BB6A' },
      { name: 'medio', value: 0, color: '#FFB74D' },
      { name: 'alto', value: 0, color: '#EF5350' },
      { name: 'critico', value: 0, color: '#B71C1C' }
    ];

    Object.values(ultimasPredicciones).forEach(nivel => {
      if (nivel === 'bajo') distribucion[0].value++;
      if (nivel === 'medio') distribucion[1].value++;
      if (nivel === 'alto') distribucion[2].value++;
      if (nivel === 'critico') distribucion[3].value++;
    });

    const alumnosConPred = Object.keys(ultimasPredicciones).length;
    distribucion[0].value += Math.max(0, totalAlumnos - alumnosConPred);

    return res.status(200).json(distribucion);
  } catch (error) {
    console.error('Error en obtenerDistribucionRiesgo:', error);
    return res.status(500).json({ error: 'Error al procesar distribución de riesgo.' });
  }
};

export const obtenerComparativaCarreras = async (req, res) => {
  try {
    const { data: carreras } = await supabase.from('carreras').select('id, nombre, codigo');
    const { data: alumnos } = await supabase.from('alumnos').select('id, promedio_general, carrera_id');

    if (!carreras) return res.status(200).json([]);

    const comparativa = carreras.map(c => {
      const alumnosCarrera = alumnos ? alumnos.filter(a => a.carrera_id === c.id) : [];
      const total = alumnosCarrera.length;
      const promedios = alumnosCarrera.map(a => parseFloat(a.promedio_general) || 0);
      const promedio = promedios.length > 0 ? parseFloat((promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2)) : 0.0;

      return {
        carrera: c.codigo || c.nombre,
        nombre: c.nombre,
        alumnos: total,
        promedio: promedio
      };
    });

    return res.status(200).json(comparativa);
  } catch (error) {
    console.error('Error en obtenerComparativaCarreras:', error);
    return res.status(500).json({ error: 'Error al generar comparativa de carreras.' });
  }
};
