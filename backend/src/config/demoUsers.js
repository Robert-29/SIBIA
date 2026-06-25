/** Cuentas demo del login — deben coincidir con Login.jsx */
export const DEMO_USERS = [
  { email: 'admin@sibia.edu', password: 'Admin2024!', rol: 'administrador', nombre: 'Administrador SIBIA' },
  { email: 'director@sibia.edu', password: 'Director2024!', rol: 'director', nombre: 'Dr. Fernando Gómez' },
  { email: 'jefecarrera@sibia.edu', password: 'Coord2024!', rol: 'jefe_carrera', nombre: 'Mtra. Lucía Pérez' },
  { email: 'tutor@sibia.edu', password: 'Tutor2024!', rol: 'tutor', nombre: 'Lic. Roberto Mendoza' },
  { email: 'psicologo@sibia.edu', password: 'Psico2024!', rol: 'psicologo', nombre: 'Psic. Claudia Ortiz' },
  { email: 'profesor@sibia.edu', password: 'Profe2024!', rol: 'profesor', nombre: 'Dr. Alejandro Ríos' },
  { email: 'alumno@sibia.edu', password: 'Alumno2024!', rol: 'alumno', nombre: 'Mateo Silva Juárez' },
];

export const inferRolDemo = (email) => {
  const demo = DEMO_USERS.find((u) => u.email === email?.toLowerCase());
  return demo?.rol ?? null;
};

export const inferNombreDemo = (email) => {
  const demo = DEMO_USERS.find((u) => u.email === email?.toLowerCase());
  return demo?.nombre ?? null;
};
