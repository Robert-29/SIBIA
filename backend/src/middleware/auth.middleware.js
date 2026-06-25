import { supabase } from '../services/supabase.service.js';

export const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado.' });
    }

    const token = authHeader.split(' ')[1];
    

    
    // Validar token con Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Acceso no autorizado: Token inválido o expirado.' });
    }

    // Buscar perfil y rol en la tabla usuarios en base de datos
    const { data: usuarioPerfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('auth_id', user.id)
      .single();

    if (perfilError || !usuarioPerfil) {
      return res.status(403).json({ error: 'Acceso denegado: Perfil de usuario no encontrado en la base de datos.' });
    }

    // Adjuntar datos del usuario y rol a la petición
    req.user = {
      id: usuarioPerfil.id,
      auth_id: usuarioPerfil.auth_id,
      nombre: usuarioPerfil.nombre,
      email: usuarioPerfil.email,
      rol: usuarioPerfil.roles.nombre,
      rol_id: usuarioPerfil.rol_id
    };

    next();
  } catch (error) {
    console.error('Error en verificarToken:', error);
    return res.status(500).json({ error: 'Error interno de autenticación.' });
  }
};
