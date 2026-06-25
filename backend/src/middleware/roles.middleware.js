export const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ error: 'Acceso no autorizado: Rol no identificado en la petición.' });
    }

    const tieneRol = rolesPermitidos.includes(req.user.rol);
    if (!tieneRol) {
      return res.status(403).json({ error: `Acceso denegado: Tu rol de '${req.user.rol}' no tiene permisos para realizar esta operación.` });
    }

    next();
  };
};
