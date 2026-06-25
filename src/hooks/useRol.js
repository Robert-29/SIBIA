import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export const useRol = () => {
  const { user } = useContext(AuthContext);

  const esRol = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.rol);
    }
    return user.rol === roles;
  };

  return {
    rol: user?.rol || null,
    esAdmin: user?.rol === 'administrador',
    esDirector: user?.rol === 'director',
    esJefeCarrera: user?.rol === 'jefe_carrera',
    esTutor: user?.rol === 'tutor',
    esPsicologo: user?.rol === 'psicologo',
    esProfesor: user?.rol === 'profesor',
    esAlumno: user?.rol === 'alumno',
    esRol
  };
};
