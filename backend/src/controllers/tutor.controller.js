import { supabase } from '../services/supabase.service.js';

// Helper to get tutor's student IDs
const obtenerAlumnosIdsTutor = async (tutorId) => {
  const { data } = await supabase
    .from('alumnos')
    .select('id')
    .eq('tutor_id', tutorId);
  return (data || []).map(a => a.id);
};

/**
 * GET /api/tutor/resumen
 */
export const obtenerResumenTutor = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const tutorNombre = req.user.nombre || 'Tutor';

    // 1. Total alumnos asignados
    const { count: totalAlumnos, error: errCount } = await supabase
      .from('alumnos')
      .select('*', { count: 'exact', head: true })
      .eq('tutor_id', tutorId);

    if (errCount) throw errCount;

    // 2. Alertas pendientes de atención hoy
    const alumnoIds = await obtenerAlumnosIdsTutor(tutorId);
    let alertasPendientes = 0;

    if (alumnoIds.length > 0) {
      const { count, error: errAlerts } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'activa')
        .in('alumno_id', alumnoIds);
      if (errAlerts) throw errAlerts;
      alertasPendientes = count || 0;
    }

    // Formatear la fecha de hoy en español
    const opciones = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const hoyStr = new Date().toLocaleDateString('es-MX', opciones);
    // Capitalizar primera letra
    const hoyFormateado = hoyStr.charAt(0).toUpperCase() + hoyStr.slice(1);

    return res.status(200).json({
      nombre: tutorNombre,
      fecha: hoyFormateado,
      total_alumnos: totalAlumnos || 0,
      pendientes_hoy: alertasPendientes
    });
  } catch (error) {
    console.error('Error en obtenerResumenTutor:', error);
    return res.status(500).json({ error: 'Error al obtener resumen del tutor.' });
  }
};

/**
 * GET /api/tutor/kpis
 */
export const obtenerKPIsTutor = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const alumnoIds = await obtenerAlumnosIdsTutor(tutorId);

    if (alumnoIds.length === 0) {
      return res.status(200).json({
        total_alumnos: 0,
        riesgo_alto_critico: 0,
        riesgo_alto_pct: 0,
        mejoraron_mes: 0,
        sesiones_mes: 0
      });
    }

    // 1. Total alumnos
    const totalAlumnos = alumnoIds.length;

    // 2. Alumnos en riesgo alto/critico (última predicción de cada uno)
    const { data: predicciones, error: errPred } = await supabase
      .from('predicciones_riesgo')
      .select('alumno_id, nivel_riesgo')
      .in('alumno_id', alumnoIds)
      .order('fecha_prediccion', { ascending: false });

    if (errPred) throw errPred;

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) {
        ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
      }
    });

    let riesgoAltoCount = 0;
    alumnoIds.forEach(id => {
      const nivel = ultimaPrediccion[id];
      if (nivel === 'alto' || nivel === 'critico') {
        riesgoAltoCount++;
      }
    });

    const riesgoAltoPct = totalAlumnos > 0 ? parseFloat(((riesgoAltoCount / totalAlumnos) * 100).toFixed(1)) : 0;

    // 3. Sesiones de este mes (del tutor logueado)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const { count: sesionesMes, error: errSes } = await supabase
      .from('seguimientos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', tutorId)
      .gte('fecha', inicioMes.toISOString());

    if (errSes) throw errSes;

    // 4. Alumnos que mejoraron este mes (resultado = 'mejoro' en sus seguimientos este mes)
    const { data: mejoraronData, error: errMej } = await supabase
      .from('seguimientos')
      .select('alerta_id, resultado')
      .eq('resultado', 'mejoro')
      .gte('fecha', inicioMes.toISOString());

    if (errMej) throw errMej;

    let mejoraronCount = 0;
    if (mejoraronData && mejoraronData.length > 0) {
      const alertaIds = mejoraronData.map(m => m.alerta_id).filter(Boolean);
      if (alertaIds.length > 0) {
        const { data: alertasAlumnos } = await supabase
          .from('alertas')
          .select('alumno_id')
          .in('id', alertaIds)
          .in('alumno_id', alumnoIds);
        
        const alumnosUnicos = new Set((alertasAlumnos || []).map(a => a.alumno_id));
        mejoraronCount = alumnosUnicos.size;
      }
    }

    return res.status(200).json({
      total_alumnos: totalAlumnos,
      riesgo_alto_critico: riesgoAltoCount,
      riesgo_alto_pct: riesgoAltoPct,
      mejoraron_mes: mejoraronCount,
      sesiones_mes: sesionesMes || 0
    });
  } catch (error) {
    console.error('Error en obtenerKPIsTutor:', error);
    return res.status(500).json({ error: 'Error al obtener KPIs del tutor.' });
  }
};

/**
 * GET /api/tutor/alertas-urgentes
 */
export const obtenerAlertasUrgentesTutor = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const alumnoIds = await obtenerAlumnosIdsTutor(tutorId);

    if (alumnoIds.length === 0) {
      return res.status(200).json([]);
    }

    // Obtener alertas activas
    const { data: alertas, error: errAlerts } = await supabase
      .from('alertas')
      .select('*, alumno:alumnos(*, usuario:usuarios!alumnos_usuario_id_fkey(nombre))')
      .eq('estado', 'activa')
      .in('alumno_id', alumnoIds)
      .order('created_at', { ascending: false });

    if (errAlerts) throw errAlerts;

    // Para cada alerta, obtener última predicción e historial de sesiones
    const alertasCompletas = await Promise.all((alertas || []).map(async (alerta) => {
      // Nivel de riesgo actual
      const { data: prediccion } = await supabase
        .from('predicciones_riesgo')
        .select('nivel_riesgo, porcentaje_riesgo, factores_json')
        .eq('alumno_id', alerta.alumno_id)
        .order('fecha_prediccion', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Última sesión
      const { data: ultimaSesion } = await supabase
        .from('seguimientos')
        .select('fecha')
        .in('alerta_id', (
          await supabase.from('alertas').select('id').eq('alumno_id', alerta.alumno_id)
        ).data?.map(a => a.id) || [])
        .order('fecha', { ascending: false })
        .limit(1)
        .maybeSingle();

      let ultimaSesionStr = 'Nunca ha tenido tutoría';
      if (ultimaSesion) {
        const diffMs = new Date() - new Date(ultimaSesion.fecha);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        ultimaSesionStr = diffDays === 0 ? 'hoy' : `hace ${diffDays} días`;
      }

      return {
        id: alerta.id,
        alumno_id: alerta.alumno_id,
        nombre: alerta.alumno?.usuario?.nombre || 'Alumno',
        matricula: alerta.alumno?.matricula,
        promedio: alerta.alumno?.promedio_general,
        nivel_riesgo: prediccion?.nivel_riesgo || 'medio',
        porcentaje_riesgo: prediccion?.porcentaje_riesgo || 50.0,
        descripcion: alerta.descripcion,
        tipo_alerta: alerta.tipo,
        ultima_sesion: ultimaSesionStr,
        factores: prediccion?.factores_json || null
      };
    }));

    return res.status(200).json(alertasCompletas);
  } catch (error) {
    console.error('Error en obtenerAlertasUrgentesTutor:', error);
    return res.status(500).json({ error: 'Error al obtener alertas urgentes.' });
  }
};

/**
 * GET /api/tutor/alumnos
 */
export const obtenerAlumnosTutor = async (req, res) => {
  try {
    const tutorId = req.user.id;

    // Obtener todos los alumnos
    const { data: alumnos, error: errAlum } = await supabase
      .from('alumnos')
      .select('*, usuario:usuarios!alumnos_usuario_id_fkey(nombre)')
      .eq('tutor_id', tutorId);

    if (errAlum) throw errAlum;

    if (!alumnos || alumnos.length === 0) {
      return res.status(200).json([]);
    }

    const alumnoIds = alumnos.map(a => a.id);

    // Obtener predicciones
    const { data: predicciones } = await supabase
      .from('predicciones_riesgo')
      .select('alumno_id, nivel_riesgo')
      .in('alumno_id', alumnoIds)
      .order('fecha_prediccion', { ascending: false });

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) {
        ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
      }
    });

    // Obtener seguimientos para calcular la última sesión
    const { data: alertas } = await supabase
      .from('alertas')
      .select('id, alumno_id')
      .in('alumno_id', alumnoIds);

    const alertaIds = (alertas || []).map(a => a.id);
    const alumnoMapAlertas = {};
    (alertas || []).forEach(a => {
      if (!alumnoMapAlertas[a.alumno_id]) alumnoMapAlertas[a.alumno_id] = [];
      alumnoMapAlertas[a.alumno_id].push(a.id);
    });

    let seguimientos = [];
    if (alertaIds.length > 0) {
      const { data: segs } = await supabase
        .from('seguimientos')
        .select('alerta_id, fecha, resultado')
        .in('alerta_id', alertaIds)
        .order('fecha', { ascending: false });
      seguimientos = segs || [];
    }

    const ultimoSeguimientoPorAlumno = {};
    seguimientos.forEach(s => {
      // Encontrar a qué alumno pertenece esta alerta
      const alertObj = (alertas || []).find(a => a.id === s.alerta_id);
      if (alertObj && !ultimoSeguimientoPorAlumno[alertObj.alumno_id]) {
        ultimoSeguimientoPorAlumno[alertObj.alumno_id] = s;
      }
    });

    const listaAlumnos = alumnos.map(a => {
      const nivelRiesgo = ultimaPrediccion[a.id] || 'bajo';
      const ultSeg = ultimoSeguimientoPorAlumno[a.id];

      let ultimaSesionText = 'Nunca';
      let resultadoText = '—';

      if (ultSeg) {
        const diffMs = new Date() - new Date(ultSeg.fecha);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        ultimaSesionText = diffDays === 0 ? 'Hoy' : `hace ${diffDays} días`;
        resultadoText = ultSeg.resultado || '—';
      }

      return {
        id: a.id,
        nombre: a.usuario?.nombre || 'Alumno',
        matricula: a.matricula,
        semestre: a.semestre_actual,
        riesgo: nivelRiesgo,
        ultima_sesion: ultimaSesionText,
        resultado: resultadoText,
        promedio: a.promedio_general,
        never_attended: !ultSeg
      };
    });

    // Ordenar por riesgo descendente
    const riskPriority = { 'critico': 4, 'alto': 3, 'medio': 2, 'bajo': 1 };
    listaAlumnos.sort((a, b) => (riskPriority[b.riesgo] || 0) - (riskPriority[a.riesgo] || 0));

    return res.status(200).json(listaAlumnos);
  } catch (error) {
    console.error('Error en obtenerAlumnosTutor:', error);
    return res.status(500).json({ error: 'Error al obtener lista de alumnos.' });
  }
};

/**
 * GET /api/tutor/alumno/:id
 */
export const obtenerDetalleAlumnoTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const tutorId = req.user.id;

    // Verificar que sea alumno de este tutor
    const { data: alumno, error: errAlum } = await supabase
      .from('alumnos')
      .select('*, usuario:usuarios!alumnos_usuario_id_fkey(nombre, email), carrera:carreras(nombre)')
      .eq('id', id)
      .eq('tutor_id', tutorId)
      .maybeSingle();

    if (errAlum || !alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado o no está asignado a usted.' });
    }

    // 1. Predicción e IA (XAI y Recomendaciones)
    const { data: prediccion } = await supabase
      .from('predicciones_riesgo')
      .select('nivel_riesgo, porcentaje_riesgo, factores_json, recomendaciones_json')
      .eq('alumno_id', id)
      .order('fecha_prediccion', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Calificaciones actuales
    const { data: calificaciones } = await supabase
      .from('calificaciones')
      .select('*, grupos(nombre, materias(nombre, codigo))')
      .eq('alumno_id', id)
      .order('parcial', { ascending: true });

    // Agrupar calificaciones por materia
    const materiasMap = {};
    (calificaciones || []).forEach(c => {
      const matNombre = c.grupos?.materias?.nombre || 'Materia';
      if (!materiasMap[matNombre]) {
        materiasMap[matNombre] = { nombre: matNombre, parciales: [] };
      }
      materiasMap[matNombre].parciales.push({ parcial: c.parcial, calificacion: parseFloat(c.calificacion) });
    });

    const materiasList = Object.values(materiasMap).map(m => {
      const avg = m.parciales.reduce((acc, curr) => acc + curr.calificacion, 0) / m.parciales.length;
      return {
        nombre: m.nombre,
        promedio: parseFloat(avg.toFixed(1)),
        parciales: m.parciales
      };
    });

    // 3. Asistencias y porcentaje
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('presente')
      .eq('alumno_id', id);

    let asistenciaPct = 100;
    if (asistencias && asistencias.length > 0) {
      const presentes = asistencias.filter(a => a.presente).length;
      asistenciaPct = Math.round((presentes / asistencias.length) * 100);
    }

    // 4. Timeline de intervenciones (unificado de alertas y seguimientos)
    const { data: alertas } = await supabase
      .from('alertas')
      .select('*')
      .eq('alumno_id', id)
      .order('created_at', { ascending: false });

    const timeline = [];

    if (alertas && alertas.length > 0) {
      const alertaIds = alertas.map(a => a.id);
      
      const { data: seguimientos } = await supabase
        .from('seguimientos')
        .select('*, usuario:usuarios(nombre)')
        .in('alerta_id', alertaIds)
        .order('fecha', { ascending: false });

      // Añadir alertas al timeline
      alertas.forEach(a => {
        timeline.push({
          id: `alerta-${a.id}`,
          tipo: 'alerta',
          fecha: a.created_at,
          titulo: 'Alerta de Sistema',
          subtitulo: a.tipo || 'Riesgo',
          descripcion: a.descripcion,
          estado: a.estado
        });
      });

      // Añadir seguimientos al timeline
      (seguimientos || []).forEach(s => {
        // Encontrar tipo legible
        const tipoMap = {
          'tutoria': 'Tutoría académica',
          'psicologia': 'Canalización psicológica',
          'academico': 'Orientación académica',
          'observacion': 'Seguimiento'
        };
        timeline.push({
          id: `seguimiento-${s.id}`,
          tipo: 'seguimiento',
          fecha: s.fecha,
          titulo: tipoMap[s.tipo] || s.tipo || 'Sesión de seguimiento',
          subtitulo: `Registrado por: ${s.usuario?.nombre || 'Tutor'}`,
          descripcion: s.observaciones,
          resultado: s.resultado
        });
      });
    }

    // Ordenar timeline desc por fecha
    timeline.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    return res.status(200).json({
      perfil: {
        id: alumno.id,
        nombre: alumno.usuario?.nombre,
        email: alumno.usuario?.email,
        matricula: alumno.matricula,
        carrera: alumno.carrera?.nombre,
        semestre: alumno.semestre_actual,
        promedio: alumno.promedio_general,
        asistencia_pct: asistenciaPct
      },
      riesgo: {
        nivel: prediccion?.nivel_riesgo || 'bajo',
        porcentaje: prediccion?.porcentaje_riesgo || 0,
        factores: prediccion?.factores_json || [],
        recomendaciones: prediccion?.recomendaciones_json || []
      },
      calificaciones: materiasList,
      timeline
    });
  } catch (error) {
    console.error('Error en obtenerDetalleAlumnoTutor:', error);
    return res.status(500).json({ error: 'Error al obtener detalle del alumno.' });
  }
};

/**
 * POST /api/tutor/seguimiento
 */
export const registrarSeguimientoTutor = async (req, res) => {
  try {
    const { alumno_id, alerta_id, tipo, observaciones, resultado, cerrar_alerta } = req.body;
    const tutorId = req.user.id;

    // Validar acceso
    const { data: alumno } = await supabase
      .from('alumnos')
      .select('id')
      .eq('id', alumno_id)
      .eq('tutor_id', tutorId)
      .maybeSingle();

    if (!alumno) {
      return res.status(403).json({ error: 'No tienes acceso a este alumno o no existe.' });
    }

    let finalAlertaId = alerta_id;

    // Si no hay alerta_id, crear una alerta "virtual" para poder asociar el seguimiento
    if (!finalAlertaId) {
      const { data: nuevaAlerta, error: errAl } = await supabase
        .from('alertas')
        .insert([{
          alumno_id,
          tipo: 'tutoria',
          descripcion: `Sesión de tutoría preventiva tipo: ${tipo}`,
          estado: cerrar_alerta ? 'cerrada' : 'atendida',
          asignada_a: tutorId,
          atendida_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (errAl) throw errAl;
      finalAlertaId = nuevaAlerta.id;
    }

    // 1. Registrar seguimiento
    const { data: seguimiento, error: errSeg } = await supabase
      .from('seguimientos')
      .insert([{
        alerta_id: finalAlertaId,
        usuario_id: tutorId,
        tipo,
        observaciones,
        resultado
      }])
      .select()
      .single();

    if (errSeg) throw errSeg;

    // 2. Si se solicitó cerrar la alerta, actualizar la tabla alertas
    if (cerrar_alerta) {
      await supabase
        .from('alertas')
        .update({
          estado: 'cerrada',
          atendida_at: new Date().toISOString()
        })
        .eq('id', finalAlertaId);
    } else {
      await supabase
        .from('alertas')
        .update({
          estado: 'atendida',
          atendida_at: new Date().toISOString()
        })
        .eq('id', finalAlertaId);
    }

    // 3. Registrar en audit_logs
    await supabase.from('audit_logs').insert([
      {
        usuario_id: tutorId,
        accion: `Registró tutoría para alumno ${alumno_id} (resultado: ${resultado})`,
        tabla_afectada: 'seguimientos',
        registro_id: seguimiento.id.toString()
      }
    ]);

    return res.status(201).json(seguimiento);
  } catch (error) {
    console.error('Error en registrarSeguimientoTutor:', error);
    return res.status(500).json({ error: 'Error al registrar el seguimiento.' });
  }
};

/**
 * GET /api/tutor/estadisticas
 */
export const obtenerEstadisticasTutor = async (req, res) => {
  try {
    const tutorId = req.user.id;
    const alumnoIds = await obtenerAlumnosIdsTutor(tutorId);

    if (alumnoIds.length === 0) {
      return res.status(200).json({
        sesiones_totales: 0,
        alertas_atendidas: 0,
        alumnos_mejoraron: 0,
        canalizaciones: 0,
        promedio_respuesta_dias: 0,
        historico_sesiones: []
      });
    }

    // 1. Sesiones realizadas totales
    const { count: sesionesTotales } = await supabase
      .from('seguimientos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', tutorId);

    // 2. Alertas atendidas o cerradas de sus alumnos
    const { data: alertasResueltas } = await supabase
      .from('alertas')
      .select('created_at, atendida_at')
      .in('alumno_id', alumnoIds)
      .in('estado', ['atendida', 'cerrada']);

    const alertasAtendidas = alertasResueltas?.length || 0;

    // Calcular promedio de respuesta en días
    let promRespuestaDias = 0;
    if (alertasResueltas && alertasResueltas.length > 0) {
      let totalMs = 0;
      let countValido = 0;
      alertasResueltas.forEach(a => {
        if (a.atendida_at) {
          const diff = new Date(a.atendida_at) - new Date(a.created_at);
          totalMs += diff;
          countValido++;
        }
      });
      if (countValido > 0) {
        promRespuestaDias = parseFloat(((totalMs / countValido) / (1000 * 60 * 60 * 24)).toFixed(1));
      }
    }

    // 3. Alumnos que mejoraron (último seguimiento de cada uno es 'mejoro')
    // Obtener todas las alertas y sus seguimientos
    const { data: alertas } = await supabase
      .from('alertas')
      .select('id, alumno_id')
      .in('alumno_id', alumnoIds);

    let alumnosMejoraron = 0;
    if (alertas && alertas.length > 0) {
      const { data: segs } = await supabase
        .from('seguimientos')
        .select('alerta_id, resultado, fecha')
        .in('alerta_id', alertas.map(a => a.id))
        .order('fecha', { ascending: false });

      const ultimoSeg = {};
      (segs || []).forEach(s => {
        const al = alertas.find(a => a.id === s.alerta_id);
        if (al && !ultimoSeg[al.alumno_id]) {
          ultimoSeg[al.alumno_id] = s.resultado;
        }
      });

      Object.values(ultimoSeg).forEach(res => {
        if (res === 'mejoro') alumnosMejoraron++;
      });
    }

    // 4. Canalizaciones (seguimientos de tipo 'psicologia' o academicos)
    const { count: canalizaciones } = await supabase
      .from('seguimientos')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', tutorId)
      .in('tipo', ['psicologia', 'academico']);

    // 5. Historial de sesiones últimos 6 meses (para gráfica)
    const { data: ultimasSesiones } = await supabase
      .from('seguimientos')
      .select('fecha, resultado')
      .eq('usuario_id', tutorId)
      .order('fecha', { ascending: true });

    // Agrupar por mes en los últimos meses
    const mesesNombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const ultimosMesesMap = {};

    // Inicializar últimos 6 meses
    const hoy = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const clave = `${mesesNombres[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      ultimosMesesMap[clave] = { mes: clave, sesiones: 0, efectividad: 0, total_mejoraron: 0 };
    }

    (ultimasSesiones || []).forEach(s => {
      const d = new Date(s.fecha);
      const clave = `${mesesNombres[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      if (ultimosMesesMap[clave]) {
        ultimosMesesMap[clave].sesiones++;
        if (s.resultado === 'mejoro') {
          ultimosMesesMap[clave].total_mejoraron++;
        }
      }
    });

    // Calcular efectividad como porcentaje de alumnos que mejoraron en sus sesiones
    const historicoList = Object.values(ultimosMesesMap).map(item => {
      const pct = item.sesiones > 0 ? Math.round((item.total_mejoraron / item.sesiones) * 100) : 0;
      return {
        mes: item.mes,
        sesiones: item.sesiones,
        efectividad: pct
      };
    });

    return res.status(200).json({
      sesiones_totales: sesionesTotales || 0,
      alertas_atendidas: alertasAtendidas,
      alumnos_mejoraron: alumnosMejoraron,
      canalizaciones: canalizaciones || 0,
      promedio_respuesta_dias: promRespuestaDias,
      historico_sesiones: historicoList
    });
  } catch (error) {
    console.error('Error en obtenerEstadisticasTutor:', error);
    return res.status(500).json({ error: 'Error al obtener estadísticas del tutor.' });
  }
};
