import { supabase } from '../services/supabase.service.js';

// Obtener carrera_id del usuario autenticado (es coordinador de la carrera)
const getCarreraIdFromUser = async (userId) => {
  const { data } = await supabase
    .from('carreras')
    .select('id, nombre, coordinador_id')
    .eq('coordinador_id', userId)
    .single();
  return data;
};

/**
 * GET /api/carrera/info
 * Info de encabezado de la carrera del coordinador
 */
export const obtenerInfoCarrera = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });

    const { data: coordinador } = await supabase
      .from('usuarios')
      .select('nombre')
      .eq('id', carrera.coordinador_id)
      .single();

    // Determinar el semestre más crítico (el de mayor riesgo)
    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('id, semestre_actual')
      .eq('carrera_id', carrera.id);

    const { data: predicciones } = await supabase
      .from('predicciones_riesgo')
      .select('alumno_id, nivel_riesgo')
      .order('fecha_prediccion', { ascending: false });

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    const porSemestre = {};
    (alumnos || []).forEach(a => {
      const sem = a.semestre_actual;
      if (!sem) return;
      if (!porSemestre[sem]) porSemestre[sem] = { total: 0, riesgo: 0 };
      porSemestre[sem].total++;
      const nivel = ultimaPrediccion[a.id];
      if (nivel === 'alto' || nivel === 'critico') porSemestre[sem].riesgo++;
    });

    let semestreCritico = null;
    let maxPct = 0;
    Object.entries(porSemestre).forEach(([sem, datos]) => {
      const pct = datos.total > 0 ? datos.riesgo / datos.total : 0;
      if (pct > maxPct) { maxPct = pct; semestreCritico = parseInt(sem); }
    });

    return res.status(200).json({
      carrera_id: carrera.id,
      nombre: carrera.nombre,
      coordinador: coordinador?.nombre || 'Coordinador',
      periodo: 'Enero–Junio 2025',
      semestre_critico: semestreCritico,
      pct_riesgo_critico: parseFloat((maxPct * 100).toFixed(1)),
    });
  } catch (error) {
    console.error('Error en obtenerInfoCarrera:', error);
    return res.status(500).json({ error: 'Error al obtener info de carrera.' });
  }
};

/**
 * GET /api/carrera/kpis
 * 5 KPIs de la carrera del coordinador
 */
export const obtenerCarreraKPIs = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });
    const cid = carrera.id;

    const [
      { data: alumnos },
      { data: predicciones },
      { data: asistencias },
      { count: alertasActivas },
    ] = await Promise.all([
      supabase.from('alumnos').select('id, promedio_general, semestre_actual').eq('carrera_id', cid),
      supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo').order('fecha_prediccion', { ascending: false }),
      supabase.from('asistencias').select('alumno_id, presente').in(
        'alumno_id',
        // subquery workaround: get all alumno ids for this carrera
        (await supabase.from('alumnos').select('id').eq('carrera_id', cid)).data?.map(a => a.id) || []
      ),
      supabase.from('alertas').select('*', { count: 'exact', head: true })
        .eq('estado', 'activa')
        .in('alumno_id', (await supabase.from('alumnos').select('id').eq('carrera_id', cid)).data?.map(a => a.id) || []),
    ]);

    const alumnoIds = new Set((alumnos || []).map(a => a.id));
    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (alumnoIds.has(p.alumno_id) && !ultimaPrediccion[p.alumno_id]) {
        ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
      }
    });

    const totalAlumnos = alumnos ? alumnos.length : 0;
    const enRiesgo = Object.values(ultimaPrediccion).filter(n => n === 'alto' || n === 'critico').length;
    const pctRiesgo = totalAlumnos > 0 ? ((enRiesgo / totalAlumnos) * 100).toFixed(1) : '0.0';

    const promediosList = (alumnos || []).map(a => parseFloat(a.promedio_general) || 0).filter(v => v > 0);
    const promedio = promediosList.length > 0
      ? parseFloat((promediosList.reduce((a, b) => a + b, 0) / promediosList.length).toFixed(2))
      : 0;

    const totalAsistencias = asistencias ? asistencias.length : 0;
    const presentes = asistencias ? asistencias.filter(a => a.presente).length : 0;
    const pctAsistencia = totalAsistencias > 0 ? parseFloat(((presentes / totalAsistencias) * 100).toFixed(1)) : 0;

    return res.status(200).json({
      total_alumnos: totalAlumnos,
      en_riesgo: enRiesgo,
      pct_riesgo: pctRiesgo,
      promedio_general: promedio,
      pct_asistencia: pctAsistencia,
      alertas_pendientes: alertasActivas || 0,
    });
  } catch (error) {
    console.error('Error en obtenerCarreraKPIs:', error);
    return res.status(500).json({ error: 'Error al calcular KPIs de la carrera.' });
  }
};

/**
 * GET /api/carrera/alumnos-riesgo
 * Lista de alumnos con riesgo, filtrable por semestre/nivel
 */
export const obtenerAlumnosRiesgo = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });

    const { semestre, nivel } = req.query;

    let alumnosQuery = supabase
      .from('alumnos')
      .select('id, semestre_actual, promedio_general, tutor_id, usuario_id')
      .eq('carrera_id', carrera.id);

    if (semestre) alumnosQuery = alumnosQuery.eq('semestre_actual', parseInt(semestre));

    const { data: alumnos } = await alumnosQuery;
    if (!alumnos || alumnos.length === 0) return res.status(200).json([]);

    const alumnoIds = alumnos.map(a => a.id);
    const usuarioIds = alumnos.map(a => a.usuario_id).filter(Boolean);
    const tutorIds = alumnos.map(a => a.tutor_id).filter(Boolean);
    const uniqueTutorIds = [...new Set(tutorIds)];

    const [
      { data: predicciones },
      { data: usuarios },
      { data: tutores },
      { data: asistencias },
    ] = await Promise.all([
      supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo, porcentaje_riesgo').order('fecha_prediccion', { ascending: false }).in('alumno_id', alumnoIds),
      supabase.from('usuarios').select('id, nombre').in('id', usuarioIds),
      uniqueTutorIds.length > 0
        ? supabase.from('usuarios').select('id, nombre').in('id', uniqueTutorIds)
        : Promise.resolve({ data: [] }),
      supabase.from('asistencias').select('alumno_id, presente').in('alumno_id', alumnoIds),
    ]);

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = { nivel: p.nivel_riesgo, pct: p.porcentaje_riesgo };
    });

    const nombreAlumno = {};
    (usuarios || []).forEach(u => { nombreAlumno[u.id] = u.nombre; });

    const nombreTutor = {};
    (tutores || []).forEach(t => { nombreTutor[t.id] = t.nombre; });

    // Calcular asistencia por alumno
    const asistPorAlumno = {};
    (asistencias || []).forEach(a => {
      if (!asistPorAlumno[a.alumno_id]) asistPorAlumno[a.alumno_id] = { total: 0, presente: 0 };
      asistPorAlumno[a.alumno_id].total++;
      if (a.presente) asistPorAlumno[a.alumno_id].presente++;
    });

    let result = alumnos.map(a => {
      const pred = ultimaPrediccion[a.id];
      const asist = asistPorAlumno[a.id];
      return {
        id: a.id,
        nombre: nombreAlumno[a.usuario_id] || 'Alumno',
        semestre: a.semestre_actual,
        nivel_riesgo: pred?.nivel || 'bajo',
        pct_riesgo: parseFloat(pred?.pct || 0),
        promedio: parseFloat(a.promedio_general) || 0,
        pct_asistencia: asist ? parseFloat(((asist.presente / asist.total) * 100).toFixed(1)) : 0,
        tutor_id: a.tutor_id,
        tutor_nombre: a.tutor_id ? (nombreTutor[a.tutor_id] || 'Tutor') : null,
      };
    });

    // Filtrar por nivel si se especificó
    if (nivel) {
      result = result.filter(a => a.nivel_riesgo === nivel);
    }

    // Ordenar: crítico > alto > medio > bajo, luego por promedio asc
    const nivelOrden = { critico: 4, alto: 3, medio: 2, bajo: 1 };
    result.sort((a, b) => (nivelOrden[b.nivel_riesgo] || 0) - (nivelOrden[a.nivel_riesgo] || 0) || a.promedio - b.promedio);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerAlumnosRiesgo:', error);
    return res.status(500).json({ error: 'Error al obtener alumnos en riesgo.' });
  }
};

/**
 * GET /api/carrera/riesgo-por-semestre
 * Barras apiladas: distribución de riesgo por semestre de la carrera
 */
export const obtenerRiesgoPorSemestreCarrera = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });

    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('id, semestre_actual')
      .eq('carrera_id', carrera.id);

    const { data: predicciones } = await supabase
      .from('predicciones_riesgo')
      .select('alumno_id, nivel_riesgo')
      .order('fecha_prediccion', { ascending: false });

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    const porSemestre = {};
    (alumnos || []).forEach(a => {
      const sem = a.semestre_actual;
      if (!sem) return;
      if (!porSemestre[sem]) porSemestre[sem] = { bajo: 0, medio: 0, alto: 0, critico: 0, total: 0 };
      const nivel = ultimaPrediccion[a.id] || 'bajo';
      porSemestre[sem][nivel]++;
      porSemestre[sem].total++;
    });

    const result = Object.entries(porSemestre)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([sem, datos]) => ({
        name: `Sem ${sem}`,
        semestre: parseInt(sem),
        bajo: datos.bajo,
        medio: datos.medio,
        alto: datos.alto,
        critico: datos.critico,
        total: datos.total,
        pct_riesgo: datos.total > 0
          ? parseFloat((((datos.alto + datos.critico) / datos.total) * 100).toFixed(1))
          : 0,
      }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerRiesgoPorSemestreCarrera:', error);
    return res.status(500).json({ error: 'Error al calcular riesgo por semestre.' });
  }
};

/**
 * GET /api/carrera/profesores
 * Profesores que imparten en la carrera con métricas
 */
export const obtenerProfesoresCarrera = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });

    const { data: materias } = await supabase
      .from('materias')
      .select('id, nombre')
      .eq('carrera_id', carrera.id);

    if (!materias || materias.length === 0) return res.status(200).json([]);

    const materiaIds = materias.map(m => m.id);
    const materiaNombre = {};
    materias.forEach(m => { materiaNombre[m.id] = m.nombre; });

    const { data: grupos } = await supabase
      .from('grupos')
      .select('id, profesor_id, materia_id, nombre')
      .in('materia_id', materiaIds);

    if (!grupos || grupos.length === 0) return res.status(200).json([]);

    const grupoIds = grupos.map(g => g.id);
    const profesorIds = [...new Set(grupos.map(g => g.profesor_id).filter(Boolean))];

    const [
      { data: profesores },
      { data: calificaciones },
      { data: alumnoGrupo },
      { data: predicciones },
    ] = await Promise.all([
      supabase.from('usuarios').select('id, nombre').in('id', profesorIds),
      supabase.from('calificaciones').select('calificacion, grupo_id').in('grupo_id', grupoIds),
      supabase.from('alumno_grupo').select('alumno_id, grupo_id').in('grupo_id', grupoIds),
      supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo').order('fecha_prediccion', { ascending: false }),
    ]);

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    // Mapa grupo -> profesor y materia
    const grupoInfo = {};
    grupos.forEach(g => { grupoInfo[g.id] = { profesor_id: g.profesor_id, materia_id: g.materia_id, nombre: g.nombre }; });

    // Agregar por profesor
    const profStats = {};
    (profesores || []).forEach(p => {
      profStats[p.id] = { nombre: p.nombre, grupos: [], califs: [], alumnos: new Set() };
    });

    grupos.forEach(g => {
      if (profStats[g.profesor_id]) {
        profStats[g.profesor_id].grupos.push({ grupo_id: g.id, materia: materiaNombre[g.materia_id], nombre: g.nombre });
      }
    });

    (calificaciones || []).forEach(c => {
      const info = grupoInfo[c.grupo_id];
      if (info && profStats[info.profesor_id]) {
        profStats[info.profesor_id].califs.push(parseFloat(c.calificacion));
      }
    });

    (alumnoGrupo || []).forEach(ag => {
      const info = grupoInfo[ag.grupo_id];
      if (info && profStats[info.profesor_id]) {
        profStats[info.profesor_id].alumnos.add(ag.alumno_id);
      }
    });

    const result = Object.values(profStats).map(s => {
      const total = s.califs.length;
      const aprobadas = s.califs.filter(c => c >= 6).length;
      const passRate = total > 0 ? parseFloat(((aprobadas / total) * 100).toFixed(1)) : 0;
      const alumnosArr = Array.from(s.alumnos);
      const riskAlums = alumnosArr.filter(id => {
        const nivel = ultimaPrediccion[id];
        return nivel === 'alto' || nivel === 'critico';
      }).length;
      const riskPct = alumnosArr.length > 0 ? parseFloat(((riskAlums / alumnosArr.length) * 100).toFixed(0)) : 0;
      const materiasPrincipal = s.grupos.length > 0 ? s.grupos[0].materia : '—';
      const grupoPrincipal = s.grupos.length > 0 ? s.grupos[0].nombre : '—';

      return {
        nombre: s.nombre,
        materia: materiasPrincipal,
        grupo: grupoPrincipal,
        num_grupos: s.grupos.length,
        total_alumnos: alumnosArr.length,
        pass_rate: passRate,
        risk_alums: riskAlums,
        risk_pct: riskPct,
        trend: passRate >= 85 ? 'up' : passRate < 70 ? 'down' : 'neutral',
      };
    }).sort((a, b) => a.pass_rate - b.pass_rate);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerProfesoresCarrera:', error);
    return res.status(500).json({ error: 'Error al obtener profesores de la carrera.' });
  }
};

/**
 * GET /api/carrera/materias-criticas
 * Materias de la carrera con % reprobación
 */
export const obtenerMateriasCriticasCarrera = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });

    const { data: materias } = await supabase
      .from('materias')
      .select('id, nombre')
      .eq('carrera_id', carrera.id);

    if (!materias || materias.length === 0) return res.status(200).json([]);

    const materiaIds = materias.map(m => m.id);
    const { data: grupos } = await supabase
      .from('grupos')
      .select('id, materia_id')
      .in('materia_id', materiaIds);

    const grupoIds = (grupos || []).map(g => g.id);
    const grupoMateria = {};
    (grupos || []).forEach(g => { grupoMateria[g.id] = g.materia_id; });

    const { data: calificaciones } = await supabase
      .from('calificaciones')
      .select('calificacion, grupo_id')
      .in('grupo_id', grupoIds);

    const { data: alumnoGrupo } = await supabase
      .from('alumno_grupo')
      .select('alumno_id, grupo_id')
      .in('grupo_id', grupoIds);

    const materiaNombre = {};
    materias.forEach(m => { materiaNombre[m.id] = m.nombre; });

    const stats = {};
    materias.forEach(m => { stats[m.id] = { nombre: m.nombre, total: 0, reprobadas: 0, alumnos: new Set() }; });

    (calificaciones || []).forEach(c => {
      const mid = grupoMateria[c.grupo_id];
      if (!mid || !stats[mid]) return;
      stats[mid].total++;
      if (parseFloat(c.calificacion) < 6) stats[mid].reprobadas++;
    });

    (alumnoGrupo || []).forEach(ag => {
      const mid = grupoMateria[ag.grupo_id];
      if (mid && stats[mid]) stats[mid].alumnos.add(ag.alumno_id);
    });

    const result = Object.entries(stats)
      .map(([id, s]) => ({
        id: parseInt(id),
        nombre: s.nombre,
        reprobacion: s.total > 0 ? parseFloat(((s.reprobadas / s.total) * 100).toFixed(1)) : 0,
        alumnos: s.alumnos.size,
        reprobados: s.reprobadas,
      }))
      .sort((a, b) => b.reprobacion - a.reprobacion)
      .slice(0, 8);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerMateriasCriticasCarrera:', error);
    return res.status(500).json({ error: 'Error al obtener materias críticas de la carrera.' });
  }
};

/**
 * GET /api/carrera/alertas
 * Alertas activas de alumnos de la carrera con datos individuales
 */
export const obtenerAlertasCarrera = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });

    const { data: alumnosCarrera } = await supabase
      .from('alumnos')
      .select('id, semestre_actual, tutor_id, usuario_id')
      .eq('carrera_id', carrera.id);

    if (!alumnosCarrera || alumnosCarrera.length === 0) return res.status(200).json({ criticas: [], medias: [], resueltas_semana: 0 });

    const alumnoIds = alumnosCarrera.map(a => a.id);

    const [
      { data: alertas },
      { data: usuarios },
      { data: predicciones },
    ] = await Promise.all([
      supabase.from('alertas').select('id, alumno_id, tipo, estado, descripcion, created_at, asignada_a').in('alumno_id', alumnoIds).order('created_at', { ascending: false }),
      supabase.from('usuarios').select('id, nombre').in('id', alumnosCarrera.map(a => a.usuario_id).filter(Boolean)),
      supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo').order('fecha_prediccion', { ascending: false }),
    ]);

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    const nombreAlumno = {};
    (usuarios || []).forEach(u => { nombreAlumno[u.id] = u.nombre; });

    const alumnoInfo = {};
    alumnosCarrera.forEach(a => {
      alumnoInfo[a.id] = {
        semestre: a.semestre_actual,
        tutor_id: a.tutor_id,
        nombre: nombreAlumno[a.usuario_id] || 'Alumno',
        nivel_riesgo: ultimaPrediccion[a.id] || 'bajo',
      };
    });

    const activas = (alertas || []).filter(al => al.estado === 'activa');
    const criticas = activas.filter(al => {
      const info = alumnoInfo[al.alumno_id];
      return info?.nivel_riesgo === 'critico' || info?.nivel_riesgo === 'alto';
    });
    const medias = activas.filter(al => {
      const info = alumnoInfo[al.alumno_id];
      return info?.nivel_riesgo !== 'critico' && info?.nivel_riesgo !== 'alto';
    });

    // Resueltas esta semana
    const haceUna = new Date();
    haceUna.setDate(haceUna.getDate() - 7);
    const resueltasSemana = (alertas || []).filter(al => al.estado === 'atendida' && new Date(al.created_at) >= haceUna).length;

    const mapAlert = al => ({
      id: al.id,
      alumno_id: al.alumno_id,
      nombre: alumnoInfo[al.alumno_id]?.nombre || 'Alumno',
      semestre: alumnoInfo[al.alumno_id]?.semestre,
      nivel_riesgo: alumnoInfo[al.alumno_id]?.nivel_riesgo,
      tutor_id: alumnoInfo[al.alumno_id]?.tutor_id,
      tipo: al.tipo,
      descripcion: al.descripcion,
      estado: al.estado,
      created_at: al.created_at,
      asignada_a: al.asignada_a,
    });

    return res.status(200).json({
      criticas: criticas.slice(0, 10).map(mapAlert),
      medias: medias.slice(0, 20).map(mapAlert),
      resueltas_semana: resueltasSemana,
      total_activas: activas.length,
    });
  } catch (error) {
    console.error('Error en obtenerAlertasCarrera:', error);
    return res.status(500).json({ error: 'Error al obtener alertas de la carrera.' });
  }
};

/**
 * GET /api/carrera/tutores
 * Cobertura de tutores en la carrera
 */
export const obtenerTutoresCarrera = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });

    const { data: alumnos } = await supabase
      .from('alumnos')
      .select('id, tutor_id')
      .eq('carrera_id', carrera.id);

    if (!alumnos || alumnos.length === 0) return res.status(200).json([]);

    const { data: predicciones } = await supabase
      .from('predicciones_riesgo')
      .select('alumno_id, nivel_riesgo')
      .order('fecha_prediccion', { ascending: false });

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    const tutorStats = { null: { nombre: 'Sin tutor asignado', alumnos: [], enRiesgo: 0, sin_tutor: true } };
    const tutorIds = [];

    alumnos.forEach(a => {
      if (!a.tutor_id) {
        tutorStats['null'].alumnos.push(a.id);
        const nivel = ultimaPrediccion[a.id];
        if (nivel === 'alto' || nivel === 'critico') tutorStats['null'].enRiesgo++;
      } else {
        if (!tutorStats[a.tutor_id]) {
          tutorStats[a.tutor_id] = { nombre: '', alumnos: [], enRiesgo: 0, sin_tutor: false };
          tutorIds.push(a.tutor_id);
        }
        tutorStats[a.tutor_id].alumnos.push(a.id);
        const nivel = ultimaPrediccion[a.id];
        if (nivel === 'alto' || nivel === 'critico') tutorStats[a.tutor_id].enRiesgo++;
      }
    });

    if (tutorIds.length > 0) {
      const { data: tutores } = await supabase.from('usuarios').select('id, nombre').in('id', tutorIds);
      (tutores || []).forEach(t => {
        if (tutorStats[t.id]) tutorStats[t.id].nombre = t.nombre;
      });
    }

    const result = Object.entries(tutorStats).map(([id, s]) => ({
      tutor_id: id === 'null' ? null : id,
      nombre: s.nombre,
      total_alumnos: s.alumnos.length,
      en_riesgo: s.enRiesgo,
      sin_tutor: s.sin_tutor,
      disponibilidad: s.sin_tutor ? null : s.alumnos.length <= 15 ? 'Alta' : s.alumnos.length <= 25 ? 'Media' : 'Baja',
    })).filter(t => t.total_alumnos > 0 || t.sin_tutor)
      .sort((a, b) => {
        if (a.sin_tutor) return 1;
        if (b.sin_tutor) return -1;
        return b.en_riesgo - a.en_riesgo;
      });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerTutoresCarrera:', error);
    return res.status(500).json({ error: 'Error al obtener cobertura de tutores.' });
  }
};

/**
 * GET /api/carrera/tendencia
 * Evolución mensual de los últimos 6 meses de la carrera
 */
export const obtenerTendenciaCarrera = async (req, res) => {
  try {
    const carrera = await getCarreraIdFromUser(req.user.id);
    if (!carrera) return res.status(404).json({ error: 'No tienes una carrera asignada.' });

    const { data: snapshots } = await supabase
      .from('snapshots_carrera')
      .select('*')
      .eq('carrera_id', carrera.id)
      .order('anio', { ascending: true })
      .order('mes', { ascending: true })
      .limit(6);

    const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const result = (snapshots || []).map(s => ({
      month: MESES[s.mes] || s.periodo,
      promedio: parseFloat(s.promedio_general) || 0,
      riesgo: parseFloat(s.pct_riesgo) || 0,
      asistencia: parseFloat(s.pct_asistencia) || 0,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerTendenciaCarrera:', error);
    return res.status(500).json({ error: 'Error al obtener tendencia de la carrera.' });
  }
};

/**
 * GET /api/carrera/generaciones
 * Histórico de las últimas 10 generaciones para el director y coordinador
 */
export const obtenerGeneraciones = async (req, res) => {
  try {
    const { data: generaciones, error } = await supabase
      .from('generaciones')
      .select('*')
      .order('anio_ingreso', { ascending: true })
      .limit(10);

    if (error) throw error;

    const result = (generaciones || []).map(g => ({
      generacion: `Gen ${g.anio_ingreso}`,
      anio: g.anio_ingreso,
      total_alumnos: g.total_alumnos,
      promedio: parseFloat(g.promedio_egreso) || 0,
      desercion: parseFloat(g.tasa_desercion) || 0,
      titulacion: parseFloat(g.tasa_titulacion) || 0,
      riesgo: parseFloat(g.pct_riesgo_alto) || 0,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerGeneraciones:', error);
    return res.status(500).json({ error: 'Error al obtener histórico de generaciones.' });
  }
};
