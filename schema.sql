-- Roles y usuarios
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,  -- referencia a Supabase Auth
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  rol_id INTEGER REFERENCES roles(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Estructura académica
CREATE TABLE IF NOT EXISTS carreras (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20) UNIQUE,
  coordinador_id UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS materias (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(20),
  carrera_id INTEGER REFERENCES carreras(id),
  creditos INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS grupos (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  materia_id INTEGER REFERENCES materias(id),
  profesor_id UUID REFERENCES usuarios(id),
  semestre VARCHAR(20),
  periodo VARCHAR(20)
);

-- Alumnos
CREATE TABLE IF NOT EXISTS alumnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id),
  matricula VARCHAR(20) UNIQUE NOT NULL,
  carrera_id INTEGER REFERENCES carreras(id),
  semestre_actual INTEGER,
  promedio_general DECIMAL(4,2),
  tutor_id UUID REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS alumno_grupo (
  alumno_id UUID REFERENCES alumnos(id),
  grupo_id INTEGER REFERENCES grupos(id),
  PRIMARY KEY (alumno_id, grupo_id)
);

-- Datos académicos
CREATE TABLE IF NOT EXISTS calificaciones (
  id SERIAL PRIMARY KEY,
  alumno_id UUID REFERENCES alumnos(id),
  grupo_id INTEGER REFERENCES grupos(id),
  parcial INTEGER CHECK (parcial IN (1, 2, 3)),
  calificacion DECIMAL(4,2),
  fecha_registro TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS asistencias (
  id SERIAL PRIMARY KEY,
  alumno_id UUID REFERENCES alumnos(id),
  grupo_id INTEGER REFERENCES grupos(id),
  fecha DATE NOT NULL,
  presente BOOLEAN DEFAULT true,
  justificada BOOLEAN DEFAULT false
);

-- Bienestar
CREATE TABLE IF NOT EXISTS formularios_bienestar (
  id SERIAL PRIMARY KEY,
  alumno_id UUID REFERENCES alumnos(id),
  fecha_aplicacion TIMESTAMP DEFAULT NOW(),
  nivel_estres INTEGER CHECK (nivel_estres BETWEEN 1 AND 10),
  horas_sueno DECIMAL(3,1),
  practica_deporte BOOLEAN,
  frecuencia_deporte VARCHAR(20),
  situacion_economica INTEGER CHECK (situacion_economica BETWEEN 1 AND 5),
  apoyo_familiar INTEGER CHECK (apoyo_familiar BETWEEN 1 AND 5),
  motivacion_academica INTEGER CHECK (motivacion_academica BETWEEN 1 AND 5),
  observaciones TEXT
);

-- Riesgo e IA
CREATE TABLE IF NOT EXISTS predicciones_riesgo (
  id SERIAL PRIMARY KEY,
  alumno_id UUID REFERENCES alumnos(id),
  fecha_prediccion TIMESTAMP DEFAULT NOW(),
  nivel_riesgo VARCHAR(10) CHECK (nivel_riesgo IN ('bajo', 'medio', 'alto', 'critico')),
  porcentaje_riesgo DECIMAL(5,2),
  factores_json JSONB,       -- factores con sus pesos explicados (XAI)
  recomendaciones_json JSONB, -- recomendaciones generadas por IA
  modelo_usado VARCHAR(50) DEFAULT 'claude-sonnet-4-6',
  prompt_usado TEXT,
  respuesta_raw TEXT
);

-- Alertas y seguimiento
CREATE TABLE IF NOT EXISTS alertas (
  id SERIAL PRIMARY KEY,
  alumno_id UUID REFERENCES alumnos(id),
  prediccion_id INTEGER REFERENCES predicciones_riesgo(id),
  tipo VARCHAR(50),           -- 'academica', 'bienestar', 'asistencia', 'mixta'
  descripcion TEXT,
  estado VARCHAR(20) DEFAULT 'activa',  -- 'activa', 'atendida', 'cerrada'
  asignada_a UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  atendida_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seguimientos (
  id SERIAL PRIMARY KEY,
  alerta_id INTEGER REFERENCES alertas(id),
  usuario_id UUID REFERENCES usuarios(id),
  fecha TIMESTAMP DEFAULT NOW(),
  tipo VARCHAR(50),           -- 'tutoria', 'psicologia', 'academico', 'observacion'
  observaciones TEXT,
  resultado VARCHAR(20)       -- 'mejoro', 'igual', 'empeoro'
);

-- Logs de auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  usuario_id UUID REFERENCES usuarios(id),
  accion VARCHAR(100),
  tabla_afectada VARCHAR(50),
  registro_id VARCHAR(50),
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Inserción de Roles por Defecto
INSERT INTO roles (nombre) VALUES
('administrador'),
('director'),
('coordinador'),
('tutor'),
('psicologo'),
('profesor'),
('alumno')
ON CONFLICT (nombre) DO NOTHING;
