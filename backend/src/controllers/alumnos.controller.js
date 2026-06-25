import { supabase } from '../services/supabase.service.js';

// Auxiliar para validar si el usuario logueado tiene acceso a un alumno específico
const verificarAccesoAlumno = async (req, alumnoId) => {
  const { id: userId, rol } = req.user;

  if (rol === 'administrador' || rol === 'director') return true;

  if (rol === 'alumno') {
    const { data } = await supabase.from('alumnos').select('id').eq('id', alumnoId).eq('usuario_id', userId).maybeSingle();
    return !!data;
  }

  if (rol === 'tutor') {
    const { data } = await supabase.from('alumnos').select('id').eq('id', alumnoId).eq('tutor_id', userId).maybeSingle();
    return !!data;
  }

  if (rol === 'jefe_carrera') {
    const { data: carreras } = await supabase.from('carreras').select('id').eq('coordinador_id', userId);
    if (!carreras || carreras.length === 0) return false;
    const { data } = await supabase.from('alumnos').select('id').eq('id', alumnoId).in('carrera_id', carreras.map(c => c.id)).maybeSingle();
    return !!data;
  }

  if (rol === 'profesor') {
    const { data: grupos } = await supabase.from('grupos').select('id').eq('profesor_id', userId);
    if (!grupos || grupos.length === 0) return false;
    const { data } = await supabase
      .from('alumno_grupo')
      .select('alumno_id')
      .eq('alumno_id', alumnoId)
      .in('grupo_id', grupos.map(g => g.id))
      .maybeSingle();
    return !!data;
  }

  if (rol === 'psicologo') {
    // Psicólogo tiene acceso a alumnos con alertas tipo bienestar o que ya tengan seguimientos registrados
    const { data: alerta } = await supabase.from('alertas').select('id').eq('alumno_id', alumnoId).maybeSingle();
    return !!alerta;
  }

  return false;
};

export const obtenerAlumnos = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;
    let query = supabase
      .from('alumnos')
      .select('*, usuarios!alumnos_usuario_id_fkey(nombre, email), carreras(nombre), tutor:usuarios!alumnos_tutor_id_fkey(nombre)');

    if (rol === 'alumno') {
      query = query.eq('usuario_id', userId);
    } else if (rol === 'tutor') {
      query = query.eq('tutor_id', userId);
    } else if (rol === 'jefe_carrera') {
      const { data: carreras } = await supabase.from('carreras').select('id').eq('coordinador_id', userId);
      if (carreras && carreras.length > 0) {
        query = query.in('carrera_id', carreras.map(c => c.id));
      } else {
        return res.status(200).json([]);
      }
    } else if (rol === 'profesor') {
      const { data: grupos } = await supabase.from('grupos').select('id').eq('profesor_id', userId);
      if (grupos && grupos.length > 0) {
        const { data: alumGrupos } = await supabase.from('alumno_grupo').select('alumno_id').in('grupo_id', grupos.map(g => g.id));
        if (alumGrupos && alumGrupos.length > 0) {
          query = query.in('id', [...new Set(alumGrupos.map(ag => ag.alumno_id))]);
        } else {
          return res.status(200).json([]);
        }
      } else {
        return res.status(200).json([]);
      }
    } else if (rol === 'psicologo') {
      const { data: alertas } = await supabase.from('alertas').select('alumno_id');
      if (alertas && alertas.length > 0) {
        query = query.in('id', [...new Set(alertas.map(a => a.alumno_id))]);
      } else {
        return res.status(200).json([]);
      }
    }

    const { data: alumnos, error } = await query;
    if (error) throw error;
    return res.status(200).json(alumnos);
  } catch (error) {
    console.error('Error en obtenerAlumnos:', error);
    return res.status(500).json({ error: 'Error al obtener alumnos.' });
  }
};

export const obtenerAlumnoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tieneAcceso = await verificarAccesoAlumno(req, id);
    if (!tieneAcceso) {
      return res.status(403).json({ error: 'Acceso denegado: No tienes permisos para ver el expediente de este alumno.' });
    }

    const { data: alumno, error } = await supabase
      .from('alumnos')
      .select('*, usuarios!alumnos_usuario_id_fkey(nombre, email), carreras(nombre), tutor:usuarios!alumnos_tutor_id_fkey(nombre, email)')
      .eq('id', id)
      .single();

    if (error || !alumno) {
      return res.status(404).json({ error: 'Alumno no encontrado.' });
    }

    return res.status(200).json(alumno);
  } catch (error) {
    console.error('Error en obtenerAlumnoPorId:', error);
    return res.status(500).json({ error: 'Error al obtener detalles del alumno.' });
  }
};

export const obtenerCalificacionesAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const tieneAcceso = await verificarAccesoAlumno(req, id);
    if (!tieneAcceso) return res.status(403).json({ error: 'Acceso denegado.' });

    const { data, error } = await supabase
      .from('calificaciones')
      .select('*, grupos(materia_id, nombre, materias(nombre, codigo))')
      .eq('alumno_id', id)
      .order('parcial', { ascending: true });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en obtenerCalificacionesAlumno:', error);
    return res.status(500).json({ error: 'Error al obtener calificaciones.' });
  }
};

export const obtenerAsistenciasAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const tieneAcceso = await verificarAccesoAlumno(req, id);
    if (!tieneAcceso) return res.status(403).json({ error: 'Acceso denegado.' });

    const { data, error } = await supabase
      .from('asistencias')
      .select('*, grupos(materias(nombre))')
      .eq('alumno_id', id)
      .order('fecha', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en obtenerAsistenciasAlumno:', error);
    return res.status(500).json({ error: 'Error al obtener asistencias.' });
  }
};

export const obtenerBienestarAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const tieneAcceso = await verificarAccesoAlumno(req, id);
    if (!tieneAcceso) return res.status(403).json({ error: 'Acceso denegado.' });

    const { data, error } = await supabase
      .from('formularios_bienestar')
      .select('*')
      .eq('alumno_id', id)
      .order('fecha_aplicacion', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en obtenerBienestarAlumno:', error);
    return res.status(500).json({ error: 'Error al obtener datos de bienestar.' });
  }
};

export const obtenerSeguimientosAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const tieneAcceso = await verificarAccesoAlumno(req, id);
    if (!tieneAcceso) return res.status(403).json({ error: 'Acceso denegado.' });

    const { data, error } = await supabase
      .from('seguimientos')
      .select('*, usuario:usuarios(nombre), alerta:alertas(tipo, descripcion)')
      .order('fecha', { ascending: false })
      .filter('alerta_id', 'in', `(select id from alertas where alumno_id = '${id}')`);

    // Si la subconsulta nativa falla por compatibilidad o permisos, lo obtenemos en dos pasos:
    const { data: alertas } = await supabase.from('alertas').select('id').eq('alumno_id', id);
    if (!alertas || alertas.length === 0) return res.status(200).json([]);

    const { data: seguimientos, error: segError } = await supabase
      .from('seguimientos')
      .select('*, usuario:usuarios(nombre), alerta:alertas(tipo, descripcion, id)')
      .in('alerta_id', alertas.map(a => a.id))
      .order('fecha', { ascending: false });

    if (segError) throw segError;
    return res.status(200).json(seguimientos);
  } catch (error) {
    console.error('Error en obtenerSeguimientosAlumno:', error);
    return res.status(500).json({ error: 'Error al obtener seguimientos.' });
  }
};

export const crearSeguimientoAlumno = async (req, res) => {
  try {
    const { id: alumnoId } = req.params;
    const { alerta_id, tipo, observaciones, resultado, cerrar_alerta } = req.body;
    const { id: usuarioId } = req.user;

    const tieneAcceso = await verificarAccesoAlumno(req, alumnoId);
    if (!tieneAcceso) return res.status(403).json({ error: 'Acceso denegado.' });

    // 1. Insertar el seguimiento
    const { data: seguimiento, error: segError } = await supabase
      .from('seguimientos')
      .insert([
        {
          alerta_id,
          usuario_id: usuarioId,
          tipo,
          observaciones,
          resultado
        }
      ])
      .select()
      .single();

    if (segError) throw segError;

    // 2. Si se solicitó cerrar la alerta, actualizar la tabla alertas
    if (cerrar_alerta) {
      await supabase
        .from('alertas')
        .update({
          estado: 'cerrada',
          atendida_at: new Date().toISOString()
        })
        .eq('id', alerta_id);
    } else {
      // Sino, marcar como 'atendida'
      await supabase
        .from('alertas')
        .update({
          estado: 'atendida',
          atendida_at: new Date().toISOString()
        })
        .eq('id', alerta_id);
    }

    // 3. Registrar en audit_logs
    await supabase.from('audit_logs').insert([
      {
        usuario_id: usuarioId,
        accion: `Registró seguimiento tipo ${tipo} con resultado ${resultado}`,
        tabla_afectada: 'seguimientos',
        registro_id: seguimiento.id.toString()
      }
    ]);

    return res.status(201).json(seguimiento);
  } catch (error) {
    console.error('Error en crearSeguimientoAlumno:', error);
    return res.status(500).json({ error: 'Error al registrar seguimiento.' });
  }
};

export const obtenerRiesgoAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const tieneAcceso = await verificarAccesoAlumno(req, id);
    if (!tieneAcceso) return res.status(403).json({ error: 'Acceso denegado.' });

    const { data, error } = await supabase
      .from('predicciones_riesgo')
      .select('*')
      .eq('alumno_id', id)
      .order('fecha_prediccion', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return res.status(200).json(data || null);
  } catch (error) {
    console.error('Error en obtenerRiesgoAlumno:', error);
    return res.status(500).json({ error: 'Error al obtener predicción de riesgo.' });
  }
};
