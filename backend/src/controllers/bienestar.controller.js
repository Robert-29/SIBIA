import { supabase } from '../services/supabase.service.js';

export const registrarFormularioBienestar = async (req, res) => {
  try {
    const {
      alumno_id,
      nivel_estres,
      horas_sueno,
      practica_deporte,
      frecuencia_deporte,
      situacion_economica,
      apoyo_familiar,
      motivacion_academica,
      observaciones
    } = req.body;
    
    const { id: userId, rol } = req.user;

    // Un alumno solo puede registrar su propio formulario de bienestar
    if (rol === 'alumno') {
      const { data: alum } = await supabase.from('alumnos').select('id').eq('usuario_id', userId).single();
      if (!alum || alum.id !== alumno_id) {
        return res.status(403).json({ error: 'Acceso denegado: Solo puedes registrar tu propio cuestionario.' });
      }
    }

    const { data, error } = await supabase
      .from('formularios_bienestar')
      .insert([
        {
          alumno_id,
          nivel_estres,
          horas_sueno,
          practica_deporte,
          frecuencia_deporte,
          situacion_economica,
          apoyo_familiar,
          motivacion_academica,
          observaciones
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Logs de auditoría
    await supabase.from('audit_logs').insert([
      {
        usuario_id: userId,
        accion: `Registró cuestionario de bienestar para alumno ${alumno_id}`,
        tabla_afectada: 'formularios_bienestar',
        registro_id: data.id.toString()
      }
    ]);

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error en registrarFormularioBienestar:', error);
    return res.status(500).json({ error: 'Error al guardar el cuestionario de bienestar.' });
  }
};

export const obtenerFormularios = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('formularios_bienestar')
      .select('*, alumnos(usuarios(nombre), matricula)')
      .order('fecha_aplicacion', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en obtenerFormularios:', error);
    return res.status(500).json({ error: 'Error al listar cuestionarios.' });
  }
};

export const obtenerFormulariosPorAlumno = async (req, res) => {
  try {
    const { alumnoId } = req.params;
    const { id: userId, rol } = req.user;

    // Validación de acceso
    if (rol === 'alumno') {
      const { data: alum } = await supabase.from('alumnos').select('id').eq('usuario_id', userId).single();
      if (!alum || alum.id !== alumnoId) {
        return res.status(403).json({ error: 'Acceso denegado.' });
      }
    }

    const { data, error } = await supabase
      .from('formularios_bienestar')
      .select('*')
      .eq('alumno_id', alumnoId)
      .order('fecha_aplicacion', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en obtenerFormulariosPorAlumno:', error);
    return res.status(500).json({ error: 'Error al obtener cuestionarios del alumno.' });
  }
};
