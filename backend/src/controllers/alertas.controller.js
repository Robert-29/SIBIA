import { supabase } from '../services/supabase.service.js';

export const obtenerAlertas = async (req, res) => {
  try {
    const { id: userId, rol } = req.user;
    let query = supabase
      .from('alertas')
      .select('*, alumno:alumnos(id, matricula, usuario:usuarios!alumnos_usuario_id_fkey(nombre, email), carrera:carreras(nombre)), asignado:usuarios!alertas_asignada_a_fkey(nombre)')
      .order('created_at', { ascending: false });

    // Filtrar según el rol
    if (rol === 'alumno') {
      const { data: alum } = await supabase.from('alumnos').select('id').eq('usuario_id', userId).maybeSingle();
      if (alum) {
        query = query.eq('alumno_id', alum.id);
      } else {
        return res.status(200).json([]);
      }
    } else if (rol === 'tutor') {
      const { data: alums } = await supabase.from('alumnos').select('id').eq('tutor_id', userId);
      if (alums && alums.length > 0) {
        query = query.in('alumno_id', alums.map(a => a.id));
      } else {
        return res.status(200).json([]);
      }
    } else if (rol === 'jefe_carrera') {
      const { data: carrera } = await supabase.from('carreras').select('id').eq('coordinador_id', userId).maybeSingle();
      if (carrera) {
        const { data: alums } = await supabase.from('alumnos').select('id').eq('carrera_id', carrera.id);
        if (alums && alums.length > 0) {
          query = query.in('alumno_id', alums.map(a => a.id));
        } else {
          return res.status(200).json([]);
        }
      } else {
        return res.status(200).json([]);
      }
    } else if (rol === 'psicologo') {
      // El psicólogo solo puede ver alertas de tipo bienestar o asignadas a él
      query = query.or(`tipo.eq.bienestar,asignada_a.eq.${userId}`);
    }

    const { data: alertas, error } = await query;
    if (error) throw error;
    return res.status(200).json(alertas);
  } catch (error) {
    console.error('Error en obtenerAlertas:', error);
    return res.status(500).json({ error: 'Error al listar alertas.' });
  }
};

export const atenderAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const { data: alerta, error } = await supabase
      .from('alertas')
      .update({
        estado: 'atendida',
        atendida_at: new Date().toISOString(),
        asignada_a: userId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar en logs de auditoría
    await supabase.from('audit_logs').insert([
      {
        usuario_id: userId,
        accion: `Atendió la alerta ID ${id}`,
        tabla_afectada: 'alertas',
        registro_id: id.toString()
      }
    ]);

    return res.status(200).json(alerta);
  } catch (error) {
    console.error('Error en atenderAlerta:', error);
    return res.status(500).json({ error: 'Error al actualizar estado de la alerta.' });
  }
};

export const cerrarAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    const { data: alerta, error } = await supabase
      .from('alertas')
      .update({
        estado: 'cerrada',
        atendida_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar en logs de auditoría
    await supabase.from('audit_logs').insert([
      {
        usuario_id: userId,
        accion: `Cerró la alerta ID ${id}`,
        tabla_afectada: 'alertas',
        registro_id: id.toString()
      }
    ]);

    return res.status(200).json(alerta);
  } catch (error) {
    console.error('Error en cerrarAlerta:', error);
    return res.status(500).json({ error: 'Error al cerrar la alerta.' });
  }
};
