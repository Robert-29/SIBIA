import { supabase } from '../services/supabase.service.js';
import { inferRolDemo, inferNombreDemo } from '../config/demoUsers.js';

const resolverRol = (email, rol_nombre) => inferRolDemo(email) || rol_nombre || 'alumno';
const resolverNombre = (email, nombre) => inferNombreDemo(email) || nombre || email.split('@')[0];

export const loginUsuario = async (req, res) => {
  try {
    const { email, auth_id, nombre, rol_nombre } = req.body;
    const rolEsperado = resolverRol(email, rol_nombre);
    const nombreFinal = resolverNombre(email, nombre);
    
    // Buscar si el usuario ya existe en la base de datos
    let { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;

    if (!usuario) {
      const { data: rolData } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre', rolEsperado)
        .single();

      const rolId = rolData?.id;
      if (!rolId) {
        return res.status(400).json({ error: `Rol "${rolEsperado}" no existe en la base de datos.` });
      }

      const { data: nuevoUsuario, error: insertError } = await supabase
        .from('usuarios')
        .insert([
          {
            auth_id,
            nombre: nombreFinal,
            email,
            rol_id: rolId
          }
        ])
        .select('*, roles(nombre)')
        .single();

      if (insertError) throw insertError;
      usuario = nuevoUsuario;
    } else {
      const updates = {};
      if (!usuario.auth_id && auth_id) updates.auth_id = auth_id;

      // Corregir rol/nombre de cuentas demo si quedaron mal registradas
      if (inferRolDemo(email) && usuario.roles?.nombre !== rolEsperado) {
        const { data: rolData } = await supabase.from('roles').select('id').eq('nombre', rolEsperado).single();
        if (rolData) updates.rol_id = rolData.id;
      }
      if (inferNombreDemo(email) && usuario.nombre !== nombreFinal) {
        updates.nombre = nombreFinal;
      }

      if (Object.keys(updates).length > 0) {
        const { data: usuarioAct, error: actError } = await supabase
          .from('usuarios')
          .update(updates)
          .eq('id', usuario.id)
          .select('*, roles(nombre)')
          .single();

        if (actError) throw actError;
        usuario = usuarioAct;
      }
    }

    // Si es jefe_carrera, obtener sus carreras asignadas
    let carreras_asignadas = [];
    if (usuario.roles.nombre === 'jefe_carrera') {
      const { data: carreras } = await supabase
        .from('carreras')
        .select('id, nombre, codigo')
        .eq('coordinador_id', usuario.id);
      carreras_asignadas = carreras || [];
    }

    return res.status(200).json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.roles.nombre,
      activo: usuario.activo,
      carreras_asignadas
    });
  } catch (error) {
    console.error('Error en loginUsuario:', error);
    return res.status(500).json({ error: 'Error al sincronizar sesión con el backend.' });
  }
};

export const logoutUsuario = async (req, res) => {
  return res.status(200).json({ message: 'Sesión cerrada con éxito.' });
};
