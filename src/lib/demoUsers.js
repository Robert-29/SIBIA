/** Cuentas demo del login — debe coincidir con backend/src/config/demoUsers.js */
const DEMO_ROLES = {
  'admin@sibia.edu': 'administrador',
  'director@sibia.edu': 'director',
  'jefecarrera@sibia.edu': 'jefe_carrera',
  'tutor@sibia.edu': 'tutor',
  'psicologo@sibia.edu': 'psicologo',
  'profesor@sibia.edu': 'profesor',
  'alumno@sibia.edu': 'alumno',
};

const DEMO_NOMBRES = {
  'admin@sibia.edu': 'Administrador SIBIA',
  'director@sibia.edu': 'Dr. Fernando Gómez',
  'jefecarrera@sibia.edu': 'Mtra. Lucía Pérez',
  'tutor@sibia.edu': 'Lic. Roberto Mendoza',
  'psicologo@sibia.edu': 'Psic. Claudia Ortiz',
  'profesor@sibia.edu': 'Dr. Alejandro Ríos',
  'alumno@sibia.edu': 'Mateo Silva Juárez',
};

export const inferRolDemo = (email) => DEMO_ROLES[email?.toLowerCase()] ?? null;
export const inferNombreDemo = (email) => DEMO_NOMBRES[email?.toLowerCase()] ?? null;
