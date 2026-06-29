import { supabase } from '../services/supabase.service.js';
import { cacheGet, cacheSet, cacheOrFetch } from '../services/cache.service.js';

/**
 * Helper: obtener IDs de grupos del profesor autenticado (cacheado 3 min)
 */
const obtenerGruposDelProfesor = async (profesorId) => {
  return cacheOrFetch(`grupos:${profesorId}`, async () => {
    const { data } = await supabase
      .from('grupos')
      .select('id, nombre, materia_id, semestre, materias(nombre)')
      .eq('profesor_id', profesorId);
    return data || [];
  }, 3 * 60 * 1000);
};

/**
 * GET /api/profesor/resumen
 * Encabezado + KPIs generales de todos sus grupos — consultas en paralelo
 */
export const obtenerResumenProfesor = async (req, res) => {
  try {
    const profId = req.user.id;
    const profNombre = req.user.nombre || 'Profesor';

    // Cache fast path (TTL: 2 min)
    const cacheKey = `resumen:${profId}`;
    const cached = cacheGet(cacheKey);
    if (cached) return res.status(200).json({ ...cached, nombre: profNombre });

    const grupos = await obtenerGruposDelProfesor(profId);
    if (grupos.length === 0) {
      return res.status(200).json({
        nombre: profNombre,
        grupos_count: 0,
        total_alumnos: 0,
        periodo: 'Enero–Junio 2026',
        proxima_clase: null,
        kpis: { aprobacion: 0, reprobacion: 0, en_riesgo: 0, en_riesgo_pct: 0, asistencia: 0 }
      });
    }

    const grupoIds = grupos.map(g => g.id);

    // Todas las consultas en paralelo
    const [alumGruposRes, califsRes, asistenciasRes] = await Promise.all([
      supabase.from('alumno_grupo').select('alumno_id').in('grupo_id', grupoIds),
      supabase.from('calificaciones').select('calificacion').in('grupo_id', grupoIds),
      supabase.from('asistencias').select('presente').in('grupo_id', grupoIds),
    ]);

    const alumnosUnicos = new Set((alumGruposRes.data || []).map(ag => ag.alumno_id));
    const totalAlumnos = alumnosUnicos.size;

    // Calificaciones
    let aprobados = 0, reprobados = 0;
    (califsRes.data || []).forEach(c => {
      if (parseFloat(c.calificacion) >= 6.0) aprobados++;
      else reprobados++;
    });
    const total = aprobados + reprobados;
    const pctAprobacion = total > 0 ? parseFloat(((aprobados / total) * 100).toFixed(1)) : 0;
    const pctReprobacion = total > 0 ? parseFloat((100 - pctAprobacion).toFixed(1)) : 0;

    // Predicciones (necesita alumnosUnicos primero)
    const alumUnicosArr = [...alumnosUnicos];
    const { data: preds } = alumUnicosArr.length > 0
      ? await supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo')
          .in('alumno_id', alumUnicosArr).order('fecha_prediccion', { ascending: false }).limit(alumUnicosArr.length * 3)
      : { data: [] };

    const ultimoPred = {};
    (preds || []).forEach(p => { if (!ultimoPred[p.alumno_id]) ultimoPred[p.alumno_id] = p.nivel_riesgo; });
    const enRiesgo = Object.values(ultimoPred).filter(n => n === 'alto' || n === 'critico').length;

    const asistAll = asistenciasRes.data || [];
    const presentes = asistAll.filter(a => a.presente).length;
    const pctAsistencia = asistAll.length > 0 ? parseFloat(((presentes / asistAll.length) * 100).toFixed(1)) : 0;

    const proxima = grupos[0];

    const payload = {
      nombre: profNombre,
      grupos_count: grupos.length,
      total_alumnos: totalAlumnos,
      periodo: 'Enero–Junio 2026',
      proxima_clase: proxima ? { grupo: proxima.nombre, materia: proxima.materias?.nombre, hora: '10:00 AM', aula: 'Aula 204' } : null,
      kpis: {
        aprobacion: pctAprobacion,
        reprobacion: pctReprobacion,
        en_riesgo: enRiesgo,
        en_riesgo_pct: totalAlumnos > 0 ? parseFloat(((enRiesgo / totalAlumnos) * 100).toFixed(1)) : 0,
        asistencia: pctAsistencia
      }
    };

    // Guardar en cache (sin el nombre que viene de req.user)
    cacheSet(cacheKey, payload, 2 * 60 * 1000);

    return res.status(200).json(payload);
  } catch (err) {
    console.error('Error en obtenerResumenProfesor:', err);
    return res.status(500).json({ error: 'Error al obtener resumen del profesor.' });
  }
};

/**
 * GET /api/profesor/grupos
 * Lista de grupos del profesor
 */
export const obtenerGruposProfesor = async (req, res) => {
  try {
    const grupos = await obtenerGruposDelProfesor(req.user.id);
    return res.status(200).json(grupos.map(g => ({
      id: g.id,
      nombre: g.nombre,
      materia: g.materias?.nombre,
      semestre: g.semestre
    })));
  } catch (err) {
    console.error('Error en obtenerGruposProfesor:', err);
    return res.status(500).json({ error: 'Error al obtener grupos.' });
  }
};

/**
 * GET /api/profesor/grupo/:id/radiografia
 * Histograma, mapa de calor y insight IA del grupo
 */
export const obtenerRadiografiaGrupo = async (req, res) => {
  try {
    const { id: grupoId } = req.params;
    const profId = req.user.id;

    // Verificar acceso y obtener alumnos del grupo en paralelo
    const [grupoRes, alumGrupoRes] = await Promise.all([
      supabase.from('grupos').select('id, nombre, materias(nombre)').eq('id', grupoId).eq('profesor_id', profId).maybeSingle(),
      supabase.from('alumno_grupo').select('alumno_id').eq('grupo_id', grupoId),
    ]);

    const grupo = grupoRes.data;
    if (!grupo) return res.status(403).json({ error: 'No tienes acceso a este grupo.' });

    const alumIds = (alumGrupoRes.data || []).map(ag => ag.alumno_id);
    if (alumIds.length === 0) return res.status(200).json({ histograma: [], mapa_calor: [], insight: null });

    // Calificaciones y nombres en paralelo
    const [califsRes, alumDataRes] = await Promise.all([
      supabase.from('calificaciones').select('alumno_id, parcial, calificacion').eq('grupo_id', grupoId).order('parcial', { ascending: true }),
      supabase.from('alumnos').select('id, usuario:usuarios!alumnos_usuario_id_fkey(nombre)').in('id', alumIds.slice(0, 30)),
    ]);

    const califs = califsRes.data || [];
    const nombreMap = {};
    (alumDataRes.data || []).forEach(a => { nombreMap[a.id] = a.usuario?.nombre || 'Alumno'; });

    // Histograma por rango de calificaciones para parcial 1 y 2
    const rangos = [
      { label: '0–4.9', min: 0, max: 4.9 },
      { label: '5.0–5.9', min: 5.0, max: 5.9 },
      { label: '6.0–6.9', min: 6.0, max: 6.9 },
      { label: '7.0–7.9', min: 7.0, max: 7.9 },
      { label: '8.0–8.9', min: 8.0, max: 8.9 },
      { label: '9.0–10', min: 9.0, max: 10 },
    ];

    const califParcial1 = (califs || []).filter(c => c.parcial === 1).map(c => parseFloat(c.calificacion));
    const califParcial2 = (califs || []).filter(c => c.parcial === 2).map(c => parseFloat(c.calificacion));

    const histograma = rangos.map(r => ({
      rango: r.label,
      parcial1: califParcial1.filter(c => c >= r.min && c <= r.max).length,
      parcial2: califParcial2.filter(c => c >= r.min && c <= r.max).length,
    }));

    // Mapa de calor: alumno × parcial
    const califPorAlumno = {};
    (califs || []).forEach(c => {
      if (!califPorAlumno[c.alumno_id]) califPorAlumno[c.alumno_id] = {};
      califPorAlumno[c.alumno_id][`p${c.parcial}`] = parseFloat(c.calificacion);
    });

    const mapaCalor = alumIds.slice(0, 30).map(aid => {
      const datos = califPorAlumno[aid] || {};
      const p1 = datos.p1 ?? null;
      const p2 = datos.p2 ?? null;
      let tendencia = 'sin_datos';
      if (p1 !== null && p2 !== null) {
        if (p2 > p1 + 0.5) tendencia = 'mejora';
        else if (p2 < p1 - 0.5) tendencia = 'caida';
        else tendencia = 'estable';
      }
      return {
        alumno_id: aid,
        nombre: nombreMap[aid] || 'Alumno',
        parcial1: p1,
        parcial2: p2,
        tendencia
      };
    }).sort((a, b) => {
      const rp = { caida: 3, sin_datos: 2, estable: 1, mejora: 0 };
      return (rp[b.tendencia] || 0) - (rp[a.tendencia] || 0);
    });

    // Calcular métricas para insight IA
    const promP1 = califParcial1.length > 0 ? (califParcial1.reduce((s, c) => s + c, 0) / califParcial1.length) : 0;
    const promP2 = califParcial2.length > 0 ? (califParcial2.reduce((s, c) => s + c, 0) / califParcial2.length) : 0;
    const caidas = mapaCalor.filter(a => a.tendencia === 'caida').length;
    const mejoras = mapaCalor.filter(a => a.tendencia === 'mejora').length;
    const reprobadosP2 = califParcial2.filter(c => c < 6.0).length;

    const caida_pct = promP1 > 0 ? Math.abs(Math.round(((promP2 - promP1) / promP1) * 100)) : 0;
    const insight = {
      grupo: grupo.nombre,
      materia: grupo.materias?.nombre,
      promedio_p1: parseFloat(promP1.toFixed(2)),
      promedio_p2: parseFloat(promP2.toFixed(2)),
      variacion_pct: caida_pct,
      tendencia_general: promP2 >= promP1 ? 'mejora' : 'caida',
      alumnos_en_caida: caidas,
      alumnos_en_mejora: mejoras,
      reprobados_p2: reprobadosP2,
      texto: promP2 < promP1
        ? `El promedio del grupo cayó ${caida_pct}% del parcial 1 (${promP1.toFixed(1)}) al parcial 2 (${promP2.toFixed(1)}). ${caidas} alumnos presentan tendencia a la baja. Se recomienda revisar los temas del segundo parcial y reforzar los conceptos donde más alumnos fallaron.`
        : `El grupo mostró mejora del parcial 1 (${promP1.toFixed(1)}) al parcial 2 (${promP2.toFixed(1)}). ${mejoras} alumnos mejoraron su calificación. Mantener la metodología actual y dar seguimiento a los ${reprobadosP2} alumnos que aún reprueban.`,
      sugerencias: promP2 < promP1
        ? [
            'Dedicar una sesión de refuerzo a los temas del segundo parcial.',
            'Los alumnos marcados en rojo en el mapa de calor necesitan atención prioritaria.',
            'Considerar ejercicios de nivelación antes del tercer parcial.',
          ]
        : [
            'Mantener la estrategia pedagógica actual.',
            'Dar seguimiento personalizado a los alumnos que aún reprueban.',
            'Identificar las prácticas que generaron la mejora para replicarlas.',
          ]
    };

    return res.status(200).json({ histograma, mapa_calor: mapaCalor, insight });
  } catch (err) {
    console.error('Error en obtenerRadiografiaGrupo:', err);
    return res.status(500).json({ error: 'Error al obtener radiografía del grupo.' });
  }
};

/**
 * GET /api/profesor/grupo/:id/alumnos-riesgo
 * Solo alumnos en riesgo del grupo del profesor con patrones académicos
 */
export const obtenerAlumnosRiesgoGrupo = async (req, res) => {
  try {
    const { id: grupoId } = req.params;
    const profId = req.user.id;

    const { data: grupo } = await supabase
      .from('grupos')
      .select('id')
      .eq('id', grupoId)
      .eq('profesor_id', profId)
      .maybeSingle();

    if (!grupo) return res.status(403).json({ error: 'No tienes acceso a este grupo.' });

    const { data: alumGrupo } = await supabase
      .from('alumno_grupo')
      .select('alumno_id')
      .eq('grupo_id', grupoId);

    const alumIds = (alumGrupo || []).map(ag => ag.alumno_id);
    if (alumIds.length === 0) return res.status(200).json([]);

    // Predicciones de riesgo
    const { data: preds } = await supabase
      .from('predicciones_riesgo')
      .select('alumno_id, nivel_riesgo, porcentaje_riesgo, factores_json')
      .in('alumno_id', alumIds)
      .order('fecha_prediccion', { ascending: false });

    const ultimoPred = {};
    (preds || []).forEach(p => { if (!ultimoPred[p.alumno_id]) ultimoPred[p.alumno_id] = p; });

    // Solo alumnos en riesgo alto o crítico
    const alumnosEnRiesgo = alumIds.filter(id => {
      const pred = ultimoPred[id];
      return pred && (pred.nivel_riesgo === 'alto' || pred.nivel_riesgo === 'critico' || pred.nivel_riesgo === 'medio');
    });

    if (alumnosEnRiesgo.length === 0) return res.status(200).json([]);

    // Nombres y datos académicos
    const { data: alumData } = await supabase
      .from('alumnos')
      .select('id, promedio_general, usuario:usuarios!alumnos_usuario_id_fkey(nombre)')
      .in('id', alumnosEnRiesgo);

    const { data: califs } = await supabase
      .from('calificaciones')
      .select('alumno_id, parcial, calificacion')
      .eq('grupo_id', grupoId)
      .in('alumno_id', alumnosEnRiesgo);

    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('alumno_id, presente')
      .eq('grupo_id', grupoId)
      .in('alumno_id', alumnosEnRiesgo);

    // Calcular asistencia por alumno
    const asistMap = {};
    (asistencias || []).forEach(a => {
      if (!asistMap[a.alumno_id]) asistMap[a.alumno_id] = { total: 0, presentes: 0 };
      asistMap[a.alumno_id].total++;
      if (a.presente) asistMap[a.alumno_id].presentes++;
    });

    // Calificaciones por alumno
    const califMap = {};
    (califs || []).forEach(c => {
      if (!califMap[c.alumno_id]) califMap[c.alumno_id] = {};
      califMap[c.alumno_id][`p${c.parcial}`] = parseFloat(c.calificacion);
    });

    const resultados = (alumData || [])
      .filter(a => alumnosEnRiesgo.includes(a.id))
      .map(a => {
        const pred = ultimoPred[a.id];
        const cals = califMap[a.id] || {};
        const asist = asistMap[a.id];
        const asistPct = asist ? Math.round((asist.presentes / asist.total) * 100) : null;

        const p1 = cals.p1 ?? null;
        const p2 = cals.p2 ?? null;
        let patron = 'Sin datos suficientes';
        if (p1 !== null && p2 !== null) {
          if (p1 < 6 && p2 < 6) patron = 'Bajo rendimiento desde inicio';
          else if (p2 < p1 - 1.0) patron = 'Caída pronunciada en parcial 2';
          else if (p2 < p1 - 0.3) patron = 'Tendencia descendente';
          else if (p1 >= 6 && p2 >= 6) patron = 'Estancamiento en zona de aprobación';
          else patron = 'Rendimiento irregular';
        } else if (p1 !== null && p1 < 6) {
          patron = 'Reprobó desde el inicio';
        }

        if (asistPct !== null && asistPct < 75) {
          patron += ' + faltas críticas';
        }

        return {
          id: a.id,
          nombre: a.usuario?.nombre || 'Alumno',
          nivel_riesgo: pred?.nivel_riesgo || 'medio',
          porcentaje_riesgo: pred?.porcentaje_riesgo || 50,
          parcial1: p1,
          parcial2: p2,
          asistencia: asistPct,
          patron
        };
      });

    // Ordenar por riesgo
    const riskOrder = { critico: 4, alto: 3, medio: 2, bajo: 1 };
    resultados.sort((a, b) => (riskOrder[b.nivel_riesgo] || 0) - (riskOrder[a.nivel_riesgo] || 0));

    return res.status(200).json(resultados);
  } catch (err) {
    console.error('Error en obtenerAlumnosRiesgoGrupo:', err);
    return res.status(500).json({ error: 'Error al obtener alumnos en riesgo del grupo.' });
  }
};

/**
 * GET /api/profesor/grupo/:id/asistencia
 * Control de asistencia del grupo: resumen semanal y alumnos críticos
 */
export const obtenerAsistenciaGrupo = async (req, res) => {
  try {
    const { id: grupoId } = req.params;
    const profId = req.user.id;

    const { data: grupo } = await supabase
      .from('grupos')
      .select('id, nombre')
      .eq('id', grupoId)
      .eq('profesor_id', profId)
      .maybeSingle();

    if (!grupo) return res.status(403).json({ error: 'No tienes acceso a este grupo.' });

    const { data: alumGrupo } = await supabase
      .from('alumno_grupo')
      .select('alumno_id')
      .eq('grupo_id', grupoId);

    const alumIds = (alumGrupo || []).map(ag => ag.alumno_id);

    // Todas las asistencias del grupo
    const { data: asistencias } = await supabase
      .from('asistencias')
      .select('alumno_id, fecha, presente')
      .eq('grupo_id', grupoId)
      .order('fecha', { ascending: false });

    const totalRegistros = (asistencias || []).length;
    const presentes = (asistencias || []).filter(a => a.presente).length;
    const pctGeneral = totalRegistros > 0 ? parseFloat(((presentes / totalRegistros) * 100).toFixed(1)) : 0;

    // Agrupar por semanas usando las fechas reales de los datos
    // Ordenar todas las fechas para determinar el rango
    const fechasUnicas = [...new Set((asistencias || []).map(a => a.fecha))].sort();
    
    let semanas = [];
    if (fechasUnicas.length > 0) {
      // Agrupar fechas por semanas del año (de lunes a domingo)
      const semanaMap = {};
      (asistencias || []).forEach(a => {
        const d = new Date(a.fecha);
        // Obtener el lunes de esa semana
        const dayOfWeek = d.getUTCDay() || 7; // 1=Mon..7=Sun
        const lunnes = new Date(d);
        lunnes.setUTCDate(d.getUTCDate() - dayOfWeek + 1);
        const key = lunnes.toISOString().split('T')[0];
        if (!semanaMap[key]) semanaMap[key] = { key, total: 0, presentes: 0, fecha: lunnes };
        semanaMap[key].total++;
        if (a.presente) semanaMap[key].presentes++;
      });

      // Ordenar y tomar las últimas 4 semanas con datos
      const semanasConDatos = Object.values(semanaMap)
        .sort((a, b) => a.fecha - b.fecha);
      
      const ultimas4 = semanasConDatos.slice(-4);
      semanas = ultimas4.map((s, i) => ({
        semana: `Semana ${i + 1}`,
        porcentaje: s.total > 0 ? parseFloat(((s.presentes / s.total) * 100).toFixed(1)) : 0,
        clases: Math.ceil(s.total / (alumIds.length || 1))
      }));
    } else {
      semanas = [
        { semana: 'Semana 1', porcentaje: 0, clases: 0 },
        { semana: 'Semana 2', porcentaje: 0, clases: 0 },
        { semana: 'Semana 3', porcentaje: 0, clases: 0 },
        { semana: 'Semana 4', porcentaje: 0, clases: 0 },
      ];
    }

    // Alumnos con más de 3 faltas
    const faltasPorAlumno = {};
    (asistencias || []).forEach(a => {
      if (!faltasPorAlumno[a.alumno_id]) faltasPorAlumno[a.alumno_id] = { faltas: 0, ultimaAsistencia: null };
      if (!a.presente) faltasPorAlumno[a.alumno_id].faltas++;
      else if (!faltasPorAlumno[a.alumno_id].ultimaAsistencia || new Date(a.fecha) > new Date(faltasPorAlumno[a.alumno_id].ultimaAsistencia)) {
        faltasPorAlumno[a.alumno_id].ultimaAsistencia = a.fecha;
      }
    });

    const criticos = Object.entries(faltasPorAlumno)
      .filter(([_, d]) => d.faltas >= 3)
      .map(([alumno_id, d]) => ({ alumno_id, faltas: d.faltas, ultima_asistencia: d.ultimaAsistencia }));

    // Nombres para los críticos
    if (criticos.length > 0) {
      const { data: alums } = await supabase
        .from('alumnos')
        .select('id, usuario:usuarios!alumnos_usuario_id_fkey(nombre)')
        .in('id', criticos.map(c => c.alumno_id));

      const namesMap = {};
      (alums || []).forEach(a => { namesMap[a.id] = a.usuario?.nombre || 'Alumno'; });
      criticos.forEach(c => { c.nombre = namesMap[c.alumno_id] || 'Alumno'; });
    }

    criticos.sort((a, b) => b.faltas - a.faltas);

    return res.status(200).json({
      grupo: grupo.nombre,
      total_alumnos: alumIds.length,
      porcentaje_general: pctGeneral,
      semanas,
      alumnos_criticos: criticos.slice(0, 10),
      bajo_80: criticos.filter(c => {
        const faltasMap = faltasPorAlumno[c.alumno_id];
        const totalClases = totalRegistros / (alumIds.length || 1);
        const pct = totalClases > 0 ? ((totalClases - faltasMap.faltas) / totalClases) * 100 : 100;
        return pct < 80;
      }).length
    });
  } catch (err) {
    console.error('Error en obtenerAsistenciaGrupo:', err);
    return res.status(500).json({ error: 'Error al obtener control de asistencia.' });
  }
};

/**
 * GET /api/profesor/comparativa
 * Comparativa entre todos los grupos del profesor
 */
export const obtenerComparativaGrupos = async (req, res) => {
  try {
    const profId = req.user.id;
    const grupos = await obtenerGruposDelProfesor(profId);

    if (grupos.length === 0) return res.status(200).json({ grupos: [], insight: '' });

    const grupoIds = grupos.map(g => g.id);

    // Obtener todos los datos en paralelo (una query por tabla, no una por grupo)
    const [alumGruposRes, califsRes, asistenciasRes] = await Promise.all([
      supabase.from('alumno_grupo').select('alumno_id, grupo_id').in('grupo_id', grupoIds),
      supabase.from('calificaciones').select('grupo_id, alumno_id, parcial, calificacion').in('grupo_id', grupoIds),
      supabase.from('asistencias').select('grupo_id, presente').in('grupo_id', grupoIds),
    ]);

    // Agrupar por grupo_id
    const alumPorGrupo = {};
    (alumGruposRes.data || []).forEach(ag => {
      if (!alumPorGrupo[ag.grupo_id]) alumPorGrupo[ag.grupo_id] = [];
      alumPorGrupo[ag.grupo_id].push(ag.alumno_id);
    });

    // Obtener predicciones para todos los alumnos (todos los grupos)
    const todosAlumIds = [...new Set((alumGruposRes.data || []).map(ag => ag.alumno_id))];
    const { data: predsAll } = todosAlumIds.length > 0
      ? await supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo')
          .in('alumno_id', todosAlumIds).order('fecha_prediccion', { ascending: false }).limit(todosAlumIds.length * 3)
      : { data: [] };
    const ultimoPredMap = {};
    (predsAll || []).forEach(p => { if (!ultimoPredMap[p.alumno_id]) ultimoPredMap[p.alumno_id] = p.nivel_riesgo; });

    const comparativa = grupos.map(g => {
      const alumIds = alumPorGrupo[g.id] || [];
      const califs = (califsRes.data || []).filter(c => c.grupo_id === g.id);
      const asist = (asistenciasRes.data || []).filter(a => a.grupo_id === g.id);

      if (alumIds.length === 0) return {
        id: g.id, nombre: g.nombre, materia: g.materias?.nombre,
        alumnos: 0, promedio: 0, aprobacion: 0, asistencia: 0, en_riesgo: 0, en_riesgo_pct: 0, tendencia: 'sin_datos'
      };

      const enRiesgo = alumIds.filter(id => ultimoPredMap[id] === 'alto' || ultimoPredMap[id] === 'critico').length;

      const allCals = califs.map(c => parseFloat(c.calificacion));
      const p1Cals = califs.filter(c => c.parcial === 1).map(c => parseFloat(c.calificacion));
      const p2Cals = califs.filter(c => c.parcial === 2).map(c => parseFloat(c.calificacion));
      const promedio = allCals.length > 0 ? parseFloat((allCals.reduce((s, c) => s + c, 0) / allCals.length).toFixed(2)) : 0;
      const aprobados = allCals.filter(c => c >= 6).length;
      const aprobacion = allCals.length > 0 ? parseFloat(((aprobados / allCals.length) * 100).toFixed(1)) : 0;
      const presentes = asist.filter(a => a.presente).length;
      const asistPct = asist.length > 0 ? parseFloat(((presentes / asist.length) * 100).toFixed(1)) : 0;
      const avgP1 = p1Cals.length > 0 ? p1Cals.reduce((s, c) => s + c, 0) / p1Cals.length : 0;
      const avgP2 = p2Cals.length > 0 ? p2Cals.reduce((s, c) => s + c, 0) / p2Cals.length : 0;
      const tendencia = avgP2 > avgP1 + 0.2 ? 'mejora' : avgP2 < avgP1 - 0.2 ? 'caida' : 'estable';

      return {
        id: g.id, nombre: g.nombre, materia: g.materias?.nombre,
        alumnos: alumIds.length, promedio, aprobacion,
        asistencia: asistPct, en_riesgo: enRiesgo,
        en_riesgo_pct: alumIds.length > 0 ? parseFloat(((enRiesgo / alumIds.length) * 100).toFixed(1)) : 0,
        tendencia
      };
    });

    // Insight comparativo
    const sorted = [...comparativa].sort((a, b) => b.aprobacion - a.aprobacion);
    const mejor = sorted[0];
    const peor = sorted[sorted.length - 1];

    let insight = '';
    if (mejor && peor && mejor.nombre !== peor.nombre) {
      const diff = parseFloat((mejor.aprobacion - peor.aprobacion).toFixed(1));
      const diffAsist = parseFloat((mejor.asistencia - peor.asistencia).toFixed(1));
      insight = `El grupo "${mejor.nombre}" tiene ${diff}% más aprobación que "${peor.nombre}". La diferencia en asistencia es de ${diffAsist}%. Revise los factores de entrada del grupo con menor rendimiento para identificar si el perfil de los alumnos influye en los resultados.`;
    }

    return res.status(200).json({ grupos: comparativa, insight });
  } catch (err) {
    console.error('Error en obtenerComparativaGrupos:', err);
    return res.status(500).json({ error: 'Error al obtener comparativa de grupos.' });
  }
};

/**
 * POST /api/profesor/grupo/:id/asistencia
 * Registrar asistencia del día
 */
export const registrarAsistenciaGrupo = async (req, res) => {
  try {
    const { id: grupoId } = req.params;
    const profId = req.user.id;
    const { registros, fecha } = req.body;
    // registros: [{ alumno_id, presente, justificada }]

    const { data: grupo } = await supabase
      .from('grupos')
      .select('id')
      .eq('id', grupoId)
      .eq('profesor_id', profId)
      .maybeSingle();

    if (!grupo) return res.status(403).json({ error: 'No tienes acceso a este grupo.' });
    if (!registros || registros.length === 0) return res.status(400).json({ error: 'No se enviaron registros.' });

    const fechaUso = fecha || new Date().toISOString().split('T')[0];

    const inserts = registros.map(r => ({
      alumno_id: r.alumno_id,
      grupo_id: parseInt(grupoId),
      fecha: fechaUso,
      presente: !!r.presente,
      justificada: !!r.justificada
    }));

    const { data: inserted, error } = await supabase
      .from('asistencias')
      .insert(inserts)
      .select();

    if (error) throw error;

    return res.status(201).json({ insertados: inserted.length });
  } catch (err) {
    console.error('Error en registrarAsistenciaGrupo:', err);
    return res.status(500).json({ error: 'Error al registrar asistencia.' });
  }
};

/**
 * GET /api/profesor/grupo/:id/alumnos
 * Lista completa de alumnos del grupo para pase de lista
 */
export const obtenerAlumnosGrupo = async (req, res) => {
  try {
    const { id: grupoId } = req.params;
    const profId = req.user.id;

    const { data: grupo } = await supabase
      .from('grupos')
      .select('id')
      .eq('id', grupoId)
      .eq('profesor_id', profId)
      .maybeSingle();

    if (!grupo) return res.status(403).json({ error: 'No tienes acceso a este grupo.' });

    const { data: alumGrupo } = await supabase
      .from('alumno_grupo')
      .select('alumno_id')
      .eq('grupo_id', grupoId);

    const alumIds = (alumGrupo || []).map(ag => ag.alumno_id);

    const { data: alums } = await supabase
      .from('alumnos')
      .select('id, matricula, usuario:usuarios!alumnos_usuario_id_fkey(nombre)')
      .in('id', alumIds);

    const lista = (alums || []).map(a => ({
      id: a.id,
      nombre: a.usuario?.nombre || 'Alumno',
      matricula: a.matricula
    }));

    lista.sort((a, b) => a.nombre.localeCompare(b.nombre));

    return res.status(200).json(lista);
  } catch (err) {
    console.error('Error en obtenerAlumnosGrupo:', err);
    return res.status(500).json({ error: 'Error al obtener alumnos del grupo.' });
  }
};

/**
 * POST /api/profesor/grupo/:id/calificaciones
 * Guardar calificaciones de un parcial específico
 */
export const registrarCalificacionesGrupo = async (req, res) => {
  try {
    const { id: grupoId } = req.params;
    const profId = req.user.id;
    const { parcial, calificaciones } = req.body;
    // calificaciones: [{ alumno_id, calificacion }]

    const { data: grupo } = await supabase
      .from('grupos')
      .select('id')
      .eq('id', grupoId)
      .eq('profesor_id', profId)
      .maybeSingle();

    if (!grupo) return res.status(403).json({ error: 'No tienes acceso a este grupo.' });
    if (!parcial || !calificaciones || calificaciones.length === 0) {
      return res.status(400).json({ error: 'Datos incompletos.' });
    }

    const inserts = calificaciones.map(c => ({
      alumno_id: c.alumno_id,
      grupo_id: parseInt(grupoId),
      parcial: parseInt(parcial),
      calificacion: parseFloat(c.calificacion)
    }));

    const { data: inserted, error } = await supabase
      .from('calificaciones')
      .insert(inserts)
      .select();

    if (error) throw error;

    // Actualizar promedios_general de los alumnos afectados
    const alumIds = calificaciones.map(c => c.alumno_id);
    for (const alumId of alumIds) {
      const { data: allCals } = await supabase
        .from('calificaciones')
        .select('calificacion')
        .eq('alumno_id', alumId);

      if (allCals && allCals.length > 0) {
        const avg = allCals.reduce((s, c) => s + parseFloat(c.calificacion), 0) / allCals.length;
        await supabase
          .from('alumnos')
          .update({ promedio_general: parseFloat(avg.toFixed(2)) })
          .eq('id', alumId);
      }
    }

    await supabase.from('audit_logs').insert([{
      usuario_id: profId,
      accion: `Registró calificaciones parcial ${parcial} en grupo ${grupoId}`,
      tabla_afectada: 'calificaciones',
      registro_id: grupoId.toString()
    }]);

    return res.status(201).json({ insertados: inserted.length });
  } catch (err) {
    console.error('Error en registrarCalificacionesGrupo:', err);
    return res.status(500).json({ error: 'Error al guardar calificaciones.' });
  }
};

/**
 * GET /api/profesor/alumno/:id/detalle
 * Expediente académico de un alumno (sin datos psicológicos)
 */
export const obtenerDetalleAlumnoProfesor = async (req, res) => {
  try {
    const { id: alumnoId } = req.params;
    const profId = req.user.id;

    // Verificar que el alumno está en algún grupo del profesor
    const grupos = await obtenerGruposDelProfesor(profId);
    const grupoIds = grupos.map(g => g.id);

    const { data: alumGrupo } = await supabase
      .from('alumno_grupo')
      .select('grupo_id')
      .eq('alumno_id', alumnoId)
      .in('grupo_id', grupoIds)
      .maybeSingle();

    if (!alumGrupo) return res.status(403).json({ error: 'Este alumno no está en ninguno de tus grupos.' });

    const { data: alumno } = await supabase
      .from('alumnos')
      .select('id, matricula, semestre_actual, promedio_general, usuario:usuarios!alumnos_usuario_id_fkey(nombre, email), carrera:carreras(nombre)')
      .eq('id', alumnoId)
      .single();

    const { data: califs } = await supabase
      .from('calificaciones')
      .select('grupo_id, parcial, calificacion, grupos(nombre, materias(nombre))')
      .eq('alumno_id', alumnoId)
      .order('parcial', { ascending: true });

    const { data: asist } = await supabase
      .from('asistencias')
      .select('presente')
      .eq('alumno_id', alumnoId);

    const asistPct = asist?.length > 0
      ? Math.round((asist.filter(a => a.presente).length / asist.length) * 100)
      : 100;

    // Solo predicciones académicas (sin datos psicológicos)
    const { data: pred } = await supabase
      .from('predicciones_riesgo')
      .select('nivel_riesgo, porcentaje_riesgo, factores_json')
      .eq('alumno_id', alumnoId)
      .order('fecha_prediccion', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Agrupar calificaciones por materia
    const materiaMap = {};
    (califs || []).forEach(c => {
      const mat = c.grupos?.materias?.nombre || 'Materia';
      if (!materiaMap[mat]) materiaMap[mat] = { nombre: mat, parciales: [] };
      materiaMap[mat].parciales.push({ parcial: c.parcial, calificacion: parseFloat(c.calificacion) });
    });

    return res.status(200).json({
      perfil: {
        id: alumno.id,
        nombre: alumno.usuario?.nombre,
        matricula: alumno.matricula,
        carrera: alumno.carrera?.nombre,
        semestre: alumno.semestre_actual,
        promedio_general: alumno.promedio_general,
        asistencia_pct: asistPct
      },
      riesgo: {
        nivel: pred?.nivel_riesgo || 'bajo',
        porcentaje: pred?.porcentaje_riesgo || 0,
        factores: pred?.factores_json || []
      },
      materias: Object.values(materiaMap)
    });
  } catch (err) {
    console.error('Error en obtenerDetalleAlumnoProfesor:', err);
    return res.status(500).json({ error: 'Error al obtener detalle del alumno.' });
  }
};
