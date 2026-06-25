const fs = require('fs');
const path = require('path');
const root = 'c:/Users/BlackPavilionDos/Desktop/SIBIA';

const files = [
  'backend/src/controllers/alertas.controller.js',
  'backend/src/controllers/alumnos.controller.js',
  'backend/src/middleware/auth.middleware.js',
  'backend/src/routes/alertas.routes.js',
  'backend/src/routes/alumnos.routes.js',
  'backend/src/routes/bienestar.routes.js',
  'backend/src/routes/ia.routes.js',
  'backend/src/routes/reportes.routes.js',
  'backend/src/services/ia.service.js',
  'backend/src/seed.js',
  'src/components/layout/Sidebar.jsx',
  'src/context/AuthContext.jsx',
  'src/hooks/useRol.js',
  'src/pages/Alumnos/AlumnoDetail.jsx',
  'src/pages/AdminPanel.jsx',
  'src/pages/AlertasList.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Login.jsx',
  'src/App.jsx'
];

files.forEach(file => {
  const filePath = path.join(root, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace role name string
    content = content.replace(/'coordinador'/g, "'jefe_carrera'");
    
    // Replace demo email
    content = content.replace(/coordinador@sibia\.edu/g, 'jefecarrera@sibia.edu');
    
    // Replace boolean flags and variables
    content = content.replace(/esCoordinador/g, 'esJefeCarrera');
    
    // Replace specific regex for auth.middleware
    content = content.replace(/email\.includes\('coordinador'\)/g, "email.includes('jefecarrera')");
    content = content.replace(/rolName = 'coordinador'/g, "rolName = 'jefe_carrera'");

    // Admin panel specific keys
    content = content.replace(/coordinador: /g, 'jefe_carrera: ');

    // Replace display text (preserving case for the first letter if needed, but doing simple replace for now)
    content = content.replace(/Coordinador/g, 'Jefe de Carrera');
    
    // Specifically for useRol.js where the object property is 'coordinador'
    content = content.replace(/esJefeCarrera: rol === 'jefe_carrera',/g, "esJefeCarrera: rol === 'jefe_carrera',"); // already covered by the strings replace mostly.

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  } else {
    console.log('Not found:', file);
  }
});
