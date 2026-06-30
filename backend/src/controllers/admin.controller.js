import { supabase } from '../services/supabase.service.js';
import { sembrarBaseDatos } from '../seed.js';

export const obtenerUsuarios = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    return res.status(500).json({ error: 'Error al listar usuarios.' });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, rol_id, activo } = req.body;
    const { id: userId } = req.user;

    const { data, error } = await supabase
      .from('usuarios')
      .insert([{ nombre, email, rol_id, activo }])
      .select('*, roles(nombre)')
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert([
      {
        usuario_id: userId,
        accion: `Creó usuario ${email} con rol ID ${rol_id}`,
        tabla_afectada: 'usuarios',
        registro_id: data.id.toString()
      }
    ]);

    return res.status(201).json(data);
  } catch (error) {
    console.error('Error en crearUsuario:', error);
    return res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, rol_id, activo } = req.body;
    const { id: userId } = req.user;

    const { data, error } = await supabase
      .from('usuarios')
      .update({ nombre, email, rol_id, activo })
      .eq('id', id)
      .select('*, roles(nombre)')
      .single();

    if (error) throw error;

    await supabase.from('audit_logs').insert([
      {
        usuario_id: userId,
        accion: `Actualizó usuario ID ${id}`,
        tabla_afectada: 'usuarios',
        registro_id: id.toString()
      }
    ]);

    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    return res.status(500).json({ error: 'Error al actualizar el usuario.' });
  }
};

export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    // No permitir auto-eliminarse
    if (id === userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador.' });
    }

    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await supabase.from('audit_logs').insert([
      {
        usuario_id: userId,
        accion: `Eliminó usuario ID ${id}`,
        tabla_afectada: 'usuarios',
        registro_id: id.toString()
      }
    ]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    return res.status(500).json({ error: 'Error al eliminar el usuario.' });
  }
};

export const obtenerAuditLogs = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, usuario:usuarios(nombre)')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error en obtenerAuditLogs:', error);
    return res.status(500).json({ error: 'Error al listar logs de auditoría.' });
  }
};

export const ejecutarSeeding = async (req, res) => {
  try {
    const logs = await sembrarBaseDatos();
    return res.status(200).json({ message: 'Base de datos poblada exitosamente.', logs });
  } catch (error) {
    console.error('Error en ejecutarSeeding:', error);
    return res.status(500).json({ error: 'Error durante la siembra de la base de datos.', detalle: error.message });
  }
};
