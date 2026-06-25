import { supabase } from '../services/supabase.service.js';

// ─── KPIs BASE ──────────────────────────────────────────────────────────────

export const obtenerUniversidadKPIs = async (req, res) => {
  try {
    const { data: alumnos } = await supabase.from('alumnos').select('id, promedio_general');
    const { data: alertas } = await supabase.from('alertas').select('id, estado');
    const { data: predicciones } = await supabase
      .from('predicciones_riesgo')
      .select('nivel_riesgo, alumno_id')
      .order('fecha_prediccion', { ascending: false });

    const totalAlumnos = alumnos ? alumnos.length : 0;
    const promedios = alumnos ? alumnos.map(a => parseFloat(a.promedio_general) || 0) : [];
    const promedioGeneral = promedios.length > 0
      ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2) : 0;
    const alertasActivas = alertas ? alertas.filter(a => a.estado === 'activa').length : 0;

    const ultimasPredicciones = {};
    if (predicciones) {
      predicciones.forEach(p => {
        if (!ultimasPredicciones[p.alumno_id]) ultimasPredicciones[p.alumno_id] = p.nivel_riesgo;
      });
    }

    const riesgoCounts = { bajo: 0, medio: 0, alto: 0, critico: 0 };
    Object.values(ultimasPredicciones).forEach(nivel => {
      if (riesgoCounts[nivel] !== undefined) riesgoCounts[nivel]++;
    });
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
    const promedioGeneral = promedios.length > 0
      ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2) : 0;

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
    const { data: predicciones } = await supabase
      .from('predicciones_riesgo')
      .select('nivel_riesgo, alumno_id')
      .order('fecha_prediccion', { ascending: false });

    const totalAlumnos = alumnos ? alumnos.length : 0;
    const ultimasPredicciones = {};
    if (predicciones) {
      predicciones.forEach(p => {
        if (!ultimasPredicciones[p.alumno_id]) ultimasPredicciones[p.alumno_id] = p.nivel_riesgo;
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
      else if (nivel === 'medio') distribucion[1].value++;
      else if (nivel === 'alto') distribucion[2].value++;
      else if (nivel === 'critico') distribucion[3].value++;
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
      const promedio = promedios.length > 0
        ? parseFloat((promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2)) : 0.0;

      return { carrera: c.codigo || c.nombre, nombre: c.nombre, alumnos: total, promedio };
    });

    return res.status(200).json(comparativa);
  } catch (error) {
    console.error('Error en obtenerComparativaCarreras:', error);
    return res.status(500).json({ error: 'Error al generar comparativa de carreras.' });
  }
};

// ─── ENDPOINTS DIRECTOR DASHBOARD ────────────────────────────────────────────

/**
 * GET /api/reportes/director-kpis
 * 4 KPIs con tendencias respecto al snapshot anterior
 */
export const obtenerDirectorKPIs = async (req, res) => {
  try {
    const [
      { count: totalAlumnos },
      { data: predicciones },
      { data: alumnos },
      { count: alertasActivas },
      { data: snapshots }
    ] = await Promise.all([
      supabase.from('alumnos').select('*', { count: 'exact', head: true }),
      supabase.from('predicciones_riesgo').select('nivel_riesgo, alumno_id').order('fecha_prediccion', { ascending: false }),
      supabase.from('alumnos').select('promedio_general'),
      supabase.from('alertas').select('*', { count: 'exact', head: true }).eq('estado', 'activa'),
      supabase.from('snapshots_mensuales').select('*').order('anio', { ascending: false }).order('mes', { ascending: false }).limit(2)
    ]);

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    const enRiesgoAlto = Object.values(ultimaPrediccion).filter(n => n === 'alto' || n === 'critico').length;
    const pctRiesgo = totalAlumnos > 0 ? ((enRiesgoAlto / totalAlumnos) * 100).toFixed(1) : '0.0';

    const promediosList = (alumnos || []).map(a => parseFloat(a.promedio_general) || 0).filter(v => v > 0);
    const promedioGeneral = promediosList.length > 0
      ? (promediosList.reduce((a, b) => a + b, 0) / promediosList.length).toFixed(1) : '0.0';

    const prevSnap = snapshots && snapshots.length >= 2 ? snapshots[1] : null;

    const calcTrend = (actual, prev, label = '') => {
      if (!prev) return null;
      const diff = actual - prev;
      return diff > 0 ? `↑ +${Math.abs(diff.toFixed(0))} ${label}` : diff < 0 ? `↓ -${Math.abs(diff.toFixed(0))} ${label}` : '→ igual';
    };

    return res.status(200).json({
      total_alumnos: totalAlumnos,
      total_alumnos_trend: prevSnap ? calcTrend(totalAlumnos, prevSnap.total_alumnos, 'este mes') : null,
      en_riesgo_alto: enRiesgoAlto,
      en_riesgo_pct: pctRiesgo,
      en_riesgo_trend: prevSnap
        ? calcTrend(enRiesgoAlto, Math.round(prevSnap.total_alumnos * prevSnap.pct_riesgo / 100), 'vs mes ant')
        : null,
      promedio_general: parseFloat(promedioGeneral),
      promedio_trend: prevSnap ? calcTrend(parseFloat(promedioGeneral), parseFloat(prevSnap.promedio_general)) : '→ estable',
      alertas_activas: alertasActivas,
      alertas_trend: prevSnap ? calcTrend(alertasActivas, prevSnap.total_alertas_activas, 'vs mes ant') : null,
    });
  } catch (error) {
    console.error('Error en obtenerDirectorKPIs:', error);
    return res.status(500).json({ error: 'Error al calcular KPIs del director.' });
  }
};

/**
 * GET /api/reportes/comparativa-carreras-detalle
 * Tabla de carreras con alumnos, % riesgo alto, promedio y deserción estimada
 */
export const obtenerComparativaCarrerasDetalle = async (req, res) => {
  try {
    const [
      { data: carreras },
      { data: alumnos },
      { data: predicciones }
    ] = await Promise.all([
      supabase.from('carreras').select('id, nombre'),
      supabase.from('alumnos').select('id, carrera_id, promedio_general'),
      supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo').order('fecha_prediccion', { ascending: false })
    ]);

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    const result = (carreras || []).map(c => {
      const alumnosCarrera = (alumnos || []).filter(a => a.carrera_id === c.id);
      const total = alumnosCarrera.length;
      const enRiesgo = alumnosCarrera.filter(a => {
        const nivel = ultimaPrediccion[a.id];
        return nivel === 'alto' || nivel === 'critico';
      }).length;
      const promedios = alumnosCarrera.map(a => parseFloat(a.promedio_general) || 0).filter(v => v > 0);
      const promedio = promedios.length > 0
        ? parseFloat((promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2)) : 0;
      const pctRiesgo = total > 0 ? parseFloat(((enRiesgo / total) * 100).toFixed(1)) : 0;
      const desercion = parseFloat((pctRiesgo * 0.18 + 0.5).toFixed(1));

      return { name: c.nombre, alumnos: total, riesgo: pctRiesgo, promedio, desercion };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerComparativaCarrerasDetalle:', error);
    return res.status(500).json({ error: 'Error al generar comparativa detallada de carreras.' });
  }
};

/**
 * GET /api/reportes/riesgo-por-semestre
 * Distribución del % de alumnos en riesgo por semestre
 */
export const obtenerRiesgoPorSemestre = async (req, res) => {
  try {
    const [
      { data: alumnos },
      { data: predicciones }
    ] = await Promise.all([
      supabase.from('alumnos').select('id, semestre_actual'),
      supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo').order('fecha_prediccion', { ascending: false })
    ]);

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    const porSemestre = {};
    (alumnos || []).forEach(a => {
      const sem = a.semestre_actual;
      if (!sem) return;
      if (!porSemestre[sem]) porSemestre[sem] = { total: 0, enRiesgo: 0 };
      porSemestre[sem].total++;
      const nivel = ultimaPrediccion[a.id];
      if (nivel === 'alto' || nivel === 'critico') porSemestre[sem].enRiesgo++;
    });

    const result = Object.entries(porSemestre)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([sem, datos]) => ({
        name: `Semestre ${sem}`,
        riesgo: datos.total > 0 ? parseFloat(((datos.enRiesgo / datos.total) * 100).toFixed(1)) : 0,
        total: datos.total,
        en_riesgo: datos.enRiesgo
      }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerRiesgoPorSemestre:', error);
    return res.status(500).json({ error: 'Error al calcular riesgo por semestre.' });
  }
};

/**
 * GET /api/reportes/materias-criticas
 * Top 5 materias con mayor % de reprobación
 */
export const obtenerMateriasCriticas = async (req, res) => {
  try {
    const [
      { data: calificaciones },
      { data: grupos },
      { data: materias }
    ] = await Promise.all([
      supabase.from('calificaciones').select('calificacion, grupo_id'),
      supabase.from('grupos').select('id, materia_id'),
      supabase.from('materias').select('id, nombre')
    ]);

    const grupoMateria = {};
    (grupos || []).forEach(g => { grupoMateria[g.id] = g.materia_id; });

    const materiaNombre = {};
    (materias || []).forEach(m => { materiaNombre[m.id] = m.nombre; });

    const porMateria = {};
    (calificaciones || []).forEach(c => {
      const materiaId = grupoMateria[c.grupo_id];
      if (!materiaId) return;
      if (!porMateria[materiaId]) porMateria[materiaId] = { total: 0, reprobadas: 0 };
      porMateria[materiaId].total++;
      if (parseFloat(c.calificacion) < 6) porMateria[materiaId].reprobadas++;
    });

    const result = Object.entries(porMateria)
      .map(([id, datos]) => ({
        id: parseInt(id),
        name: materiaNombre[id] || `Materia ${id}`,
        reprobacion: datos.total > 0 ? parseFloat(((datos.reprobadas / datos.total) * 100).toFixed(1)) : 0,
        riesgo: datos.reprobadas
      }))
      .sort((a, b) => b.reprobacion - a.reprobacion)
      .slice(0, 5);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerMateriasCriticas:', error);
    return res.status(500).json({ error: 'Error al obtener materias críticas.' });
  }
};

/**
 * GET /api/reportes/profesores-desempeno
 * Top/bottom 10 profesores con métricas de aprobación y alumnos en riesgo
 */
export const obtenerProfesoresDesempeno = async (req, res) => {
  try {
    const [
      { data: grupos },
      { data: alumnoGrupo },
      { data: calificaciones },
      { data: predicciones }
    ] = await Promise.all([
      supabase.from('grupos').select('id, profesor_id'),
      supabase.from('alumno_grupo').select('alumno_id, grupo_id'),
      supabase.from('calificaciones').select('calificacion, grupo_id'),
      supabase.from('predicciones_riesgo').select('alumno_id, nivel_riesgo').order('fecha_prediccion', { ascending: false })
    ]);

    const profesorIds = [...new Set((grupos || []).map(g => g.profesor_id).filter(Boolean))];

    const { data: usuarios } = await supabase
      .from('usuarios')
      .select('id, nombre')
      .in('id', profesorIds);

    const ultimaPrediccion = {};
    (predicciones || []).forEach(p => {
      if (!ultimaPrediccion[p.alumno_id]) ultimaPrediccion[p.alumno_id] = p.nivel_riesgo;
    });

    const grupoProfesor = {};
    (grupos || []).forEach(g => { grupoProfesor[g.id] = g.profesor_id; });

    const profesorStats = {};
    (usuarios || []).forEach(u => {
      profesorStats[u.id] = { nombre: u.nombre, grupos: new Set(), alumnos: new Set(), califs: [] };
    });

    (grupos || []).forEach(g => {
      if (profesorStats[g.profesor_id]) profesorStats[g.profesor_id].grupos.add(g.id);
    });

    (calificaciones || []).forEach(c => {
      const profId = grupoProfesor[c.grupo_id];
      if (profId && profesorStats[profId]) profesorStats[profId].califs.push(parseFloat(c.calificacion));
    });

    (alumnoGrupo || []).forEach(ag => {
      const profId = grupoProfesor[ag.grupo_id];
      if (profId && profesorStats[profId]) profesorStats[profId].alumnos.add(ag.alumno_id);
    });

    const result = Object.values(profesorStats).map(s => {
      const total = s.califs.length;
      const aprobadas = s.califs.filter(c => c >= 6).length;
      const passRate = total > 0 ? parseFloat(((aprobadas / total) * 100).toFixed(1)) : 0;
      const alumnosArr = Array.from(s.alumnos);
      const riskAlums = alumnosArr.filter(aId => {
        const nivel = ultimaPrediccion[aId];
        return nivel === 'alto' || nivel === 'critico';
      }).length;
      const riskPct = alumnosArr.length > 0 ? parseFloat(((riskAlums / alumnosArr.length) * 100).toFixed(0)) : 0;

      return {
        name: s.nombre,
        groups: s.grupos.size,
        passRate,
        riskAlums,
        riskPct,
        trend: passRate >= 85 ? 'up' : passRate < 70 ? 'down' : 'neutral'
      };
    });

    const sorted = result.sort((a, b) => a.passRate - b.passRate);
    const bottom5 = sorted.slice(0, 5);
    const top5 = sorted.slice(-5).reverse();
    const combined = [...bottom5, ...top5].filter((v, i, arr) =>
      arr.findIndex(x => x.name === v.name) === i
    );

    return res.status(200).json(combined);
  } catch (error) {
    console.error('Error en obtenerProfesoresDesempeno:', error);
    return res.status(500).json({ error: 'Error al calcular desempeño de profesores.' });
  }
};

/**
 * GET /api/reportes/alertas-director
 * Alertas agrupadas por tipo (sin datos individuales de alumnos)
 */
export const obtenerAlertasDirector = async (req, res) => {
  try {
    const [
      { data: alertas },
      { data: alumnos },
      { data: carreras }
    ] = await Promise.all([
      supabase.from('alertas').select('estado, tipo, alumno_id'),
      supabase.from('alumnos').select('id, carrera_id'),
      supabase.from('carreras').select('id, nombre')
    ]);

    const alumnoCarrera = {};
    (alumnos || []).forEach(a => { alumnoCarrera[a.id] = a.carrera_id; });

    const carreraNombre = {};
    (carreras || []).forEach(c => { carreraNombre[c.id] = c.nombre; });

    const activas = (alertas || []).filter(a => a.estado === 'activa');
    const academicas = activas.filter(a => a.tipo === 'academica');

    // Carrera con más alertas activas
    const carreraCount = {};
    activas.forEach(a => {
      const cid = alumnoCarrera[a.alumno_id];
      if (cid) carreraCount[cid] = (carreraCount[cid] || 0) + 1;
    });
    const topCarreraId = Object.entries(carreraCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    const topCarreraNombre = topCarreraId ? (carreraNombre[topCarreraId] || 'Institución') : 'Institución';

    const result = [
      {
        type: 'critical',
        count: activas.length,
        text: 'alertas activas sin atender',
        context: topCarreraNombre
      },
      {
        type: 'warning',
        count: academicas.length,
        text: 'alertas de tipo académico',
        context: 'Todas las carreras'
      },
      {
        type: 'success',
        count: (alertas || []).filter(a => a.estado === 'atendida').length,
        text: 'alertas atendidas en total',
        context: null
      }
    ];

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerAlertasDirector:', error);
    return res.status(500).json({ error: 'Error al obtener alertas del director.' });
  }
};

/**
 * GET /api/reportes/tendencia-historica
 * Evolución mensual de los últimos 6 meses
 */
export const obtenerTendenciaHistorica = async (req, res) => {
  try {
    const { data: snapshots, error } = await supabase
      .from('snapshots_mensuales')
      .select('*')
      .order('anio', { ascending: true })
      .order('mes', { ascending: true })
      .limit(6);

    if (error) throw error;

    const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const result = (snapshots || []).map(s => ({
      month: MESES[s.mes] || s.periodo,
      promedio: parseFloat(s.promedio_general) || 0,
      riesgo: parseFloat(s.pct_riesgo) || 0,
      desercion: parseFloat(s.tasa_desercion) || 0
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerTendenciaHistorica:', error);
    return res.status(500).json({ error: 'Error al obtener tendencia histórica.' });
  }
};

/**
 * GET /api/reportes/generaciones
 * Historico de las ultimas 10 generaciones de la institucion
 */
export const obtenerGeneracionesInstitucional = async (req, res) => {
  try {
    const { data: generaciones, error } = await supabase
      .from('generaciones')
      .select('*')
      .order('anio_ingreso', { ascending: true })
      .limit(10);

    if (error) throw error;

    const result = (generaciones || []).map(g => ({
      generacion: 'Gen ' + g.anio_ingreso,
      anio: g.anio_ingreso,
      total_alumnos: g.total_alumnos,
      promedio: parseFloat(g.promedio_egreso) || 0,
      desercion: parseFloat(g.tasa_desercion) || 0,
      titulacion: parseFloat(g.tasa_titulacion) || null,
      riesgo: parseFloat(g.pct_riesgo_alto) || 0,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en obtenerGeneracionesInstitucional:', error);
    return res.status(500).json({ error: 'Error al obtener historico de generaciones.' });
  }
};
