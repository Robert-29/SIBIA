import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Importar Rutas
import authRoutes from './routes/auth.routes.js';
import alumnosRoutes from './routes/alumnos.routes.js';
import bienestarRoutes from './routes/bienestar.routes.js';
import alertasRoutes from './routes/alertas.routes.js';
import iaRoutes from './routes/ia.routes.js';
import reportesRoutes from './routes/reportes.routes.js';
import adminRoutes from './routes/admin.routes.js';
import carreraRoutes from './routes/carrera.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares globales
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Ruta de estado base
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Backend SIBIA activo y funcionando correctamente.',
    timestamp: new Date()
  });
});

// Enrutamiento API
app.use('/api/auth', authRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/bienestar', bienestarRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/ia', iaRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/carrera', carreraRoutes);

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Error global del servidor:', err);
  res.status(err.status || 500).json({
    error: 'Error interno del servidor.',
    detalle: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Servidor SIBIA ejecutándose en: http://localhost:${PORT}`);
  console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
