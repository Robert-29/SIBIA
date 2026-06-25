import { supabase } from './supabase.service.js';

export const obtenerContextoAlumno = async (alumnoId) => {
  try {
    // 1. Obtener datos básicos del alumno y usuario
    const { data: alumno, error: alumnoError } = await supabase
      .from('alumnos')
      .select('*, usuarios(nombre, email), carreras(nombre)')
      .eq('id', alumnoId)
      .single();

    if (alumnoError || !alumno) {
      throw new Error(`Alumno no encontrado: ${alumnoError?.message || 'Error general'}`);
    }

    // 2. Obtener calificaciones por parcial
    const { data: calificaciones, error: calError } = await supabase
      .from('calificaciones')
      .select('*, grupos(materia_id, materias(nombre))')
      .eq('alumno_id', alumnoId);

    if (calError) {
      console.error('Error al obtener calificaciones:', calError);
    }

    // Calcular promedios por parcial y materias en riesgo (< 7.0)
    let materiasRiesgo = [];
    let historicoPromedios = { parcial1: null, parcial2: null, parcial3: null };
    
    if (calificaciones && calificaciones.length > 0) {
      const sumParciales = { 1: [], 2: [], 3: [] };
      
      calificaciones.forEach(c => {
        const val = parseFloat(c.calificacion);
        if (c.parcial && sumParciales[c.parcial]) {
          sumParciales[c.parcial].push(val);
        }
        
        if (val < 7.0) {
          const matNombre = c.grupos?.materias?.nombre || 'Materia';
          if (!materiasRiesgo.includes(matNombre)) {
            materiasRiesgo.push(matNombre);
          }
        }
      });
      
      const calcAverage = (arr) => arr.length > 0 ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null;
      historicoPromedios.parcial1 = calcAverage(sumParciales[1]);
      historicoPromedios.parcial2 = calcAverage(sumParciales[2]);
      historicoPromedios.parcial3 = calcAverage(sumParciales[3]);
    }

    // Determinar tendencia
    let tendencia = 'estable';
    if (historicoPromedios.parcial1 && historicoPromedios.parcial2) {
      if (historicoPromedios.parcial2 < historicoPromedios.parcial1 - 0.2) {
        tendencia = 'bajando';
      } else if (historicoPromedios.parcial2 > historicoPromedios.parcial1 + 0.2) {
        tendencia = 'subiendo';
      }
    }

    // 3. Obtener asistencias
    const { data: asistencias, error: asisError } = await supabase
      .from('asistencias')
      .select('*')
      .eq('alumno_id', alumnoId);

    if (asisError) {
      console.error('Error al obtener asistencias:', asisError);
    }

    let pctAsistencia = 100.0;
    if (asistencias && asistencias.length > 0) {
      const presentes = asistencias.filter(a => a.presente || a.justificada).length;
      pctAsistencia = parseFloat(((presentes / asistencias.length) * 100).toFixed(2));
    }

    // 4. Obtener último formulario de bienestar
    const { data: bienestar, error: bienError } = await supabase
      .from('formularios_bienestar')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('fecha_aplicacion', { ascending: false })
      .limit(1);

    if (bienError) {
      console.error('Error al obtener bienestar:', bienError);
    }

    const ultimoBienestar = bienestar && bienestar.length > 0 ? bienestar[0] : null;

    // 5. Retornar contexto consolidado
    return {
      id: alumno.id,
      nombre: alumno.usuarios?.nombre || 'Estudiante',
      email: alumno.usuarios?.email || '',
      matricula: alumno.matricula,
      carrera: alumno.carreras?.nombre || 'Sin Carrera',
      semestre: alumno.semestre_actual || 1,
      promedio_general: parseFloat(alumno.promedio_general) || 0.0,
      historico_promedios: historicoPromedios,
      tendencia_promedio: tendencia,
      pct_asistencia: pctAsistencia,
      calificaciones_raw: calificaciones || [],
      materias_riesgo: materiasRiesgo,
      bienestar: {
        nivel_estres: ultimoBienestar?.nivel_estres || 5,
        horas_sueno: ultimoBienestar?.horas_sueno || 7.0,
        practica_deporte: ultimoBienestar?.practica_deporte ?? true,
        situacion_economica: ultimoBienestar?.situacion_economica || 3,
        apoyo_familiar: ultimoBienestar?.apoyo_familiar || 3,
        motivacion_academica: ultimoBienestar?.motivacion_academica || 3,
        observaciones: ultimoBienestar?.observaciones || ''
      }
    };
  } catch (error) {
    console.error('Error al obtener contexto del alumno:', error);
    throw error;
  }
};
