-- Migración 003: Extender formularios_bienestar con 10 dimensiones de detección temprana
-- Las respuestas extendidas se almacenan en JSONB para flexibilidad sin romper la tabla existente.

ALTER TABLE formularios_bienestar
ADD COLUMN IF NOT EXISTS respuestas_extendidas JSONB DEFAULT '{}'::jsonb;

-- Flag de alerta crítica: si el alumno responde afirmativamente a preguntas de la dimensión 6 (pensamientos y percepción),
-- se marca como alerta_critica = true para notificar inmediatamente al departamento de psicología.
ALTER TABLE formularios_bienestar
ADD COLUMN IF NOT EXISTS alerta_critica BOOLEAN DEFAULT false;

-- Frecuencia de deporte (puede que ya exista pero con tipo limitado)
ALTER TABLE formularios_bienestar
ADD COLUMN IF NOT EXISTS dimension_completada VARCHAR(50) DEFAULT 'basico';
-- 'basico' = solo las 7 preguntas originales
-- 'extendido' = incluye las 10 dimensiones

COMMENT ON COLUMN formularios_bienestar.respuestas_extendidas IS 
'JSON con estructura: { "sueno": {...}, "alimentacion": {...}, "energia": {...}, "emocional": {...}, "ansiedad": {...}, "pensamientos": {...}, "relaciones": {...}, "economia": {...}, "habitos": {...}, "motivacion": {...} }';
