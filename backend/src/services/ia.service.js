import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
import { obtenerContextoAlumno } from './riesgo.service.js';
import { supabase } from './supabase.service.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const isApiKeyConfigured = apiKey && apiKey !== 'tu-llave' && apiKey !== '';

// Inicializar SDK de Google Gemini
const genAI = isApiKeyConfigured ? new GoogleGenerativeAI(apiKey) : null;

// Helper para obtener el modelo Gemini configurado
const getModel = (requireJson = false, systemInstruction = null) => {
  if (!genAI) throw new Error('La API de Google Gemini no está configurada. Por favor define GEMINI_API_KEY en tu .env');
  
  const config = {
    model: 'gemini-2.5-flash',
  };

  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  const model = genAI.getGenerativeModel(config);
  const generationConfig = { temperature: 0.2 };
  
  if (requireJson) {
    generationConfig.responseMimeType = "application/json";
  }

  return { model, generationConfig };
};


export const analizarRiesgoAlumno = async (alumnoId) => {
  try {
    const contexto = await obtenerContextoAlumno(alumnoId);

    if (!isApiKeyConfigured) {
      throw new Error('La API de Gemini no está configurada.');
    }

    const prompt = `Analiza los siguientes datos de un alumno y proporciona un análisis de riesgo detallado y explicable.

DATOS DEL ALUMNO:
- Nombre: ${contexto.nombre}
- Promedio actual: ${contexto.promedio_general} (Historial Parciales: P1=${contexto.historico_promedios.parcial1 || 'N/A'}, P2=${contexto.historico_promedios.parcial2 || 'N/A'}, P3=${contexto.historico_promedios.parcial3 || 'N/A'})
- Tendencia del promedio: ${contexto.tendencia_promedio}
- Porcentaje de asistencia: ${contexto.pct_asistencia}%
- Nivel de estrés (1-10): ${contexto.bienestar.nivel_estres}
- Horas de sueño promedio: ${contexto.bienestar.horas_sueno}
- Practica deporte: ${contexto.bienestar.practica_deporte ? 'Sí' : 'No'}
- Situación económica (1-5, donde 1 es baja y 5 es alta): ${contexto.bienestar.situacion_economica}
- Apoyo familiar (1-5, donde 1 es bajo y 5 es alto): ${contexto.bienestar.apoyo_familiar}
- Motivación académica (1-5, donde 1 es baja y 5 es alta): ${contexto.bienestar.motivacion_academica}
- Semestre actual: ${contexto.semestre}
- Materias con riesgo de reprobación (calificación < 7): ${contexto.materias_riesgo.join(', ') || 'Ninguna'}

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "nivel_riesgo": "bajo|medio|alto|critico",
  "porcentaje_riesgo": número entre 0 y 100,
  "resumen": "explicación breve en 1 oración",
  "factores": [
    { "nombre": "Nombre del factor", "contribucion": número, "descripcion": "explicación de la contribución del factor" }
  ],
  "recomendaciones": [
    { "tipo": "tutoria|psicologia|deporte|becas|seguimiento", "descripcion": "descripción de la acción recomendada", "prioridad": "alta|media|baja" }
  ]
}`;

    const { model, generationConfig } = getModel(true, "Eres un analista experto en analítica predictiva de deserción universitaria.");
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    const contentText = result.response.text();
    const parsedResult = JSON.parse(contentText);

    return {
      nivel_riesgo: parsedResult.nivel_riesgo || 'bajo',
      porcentaje_riesgo: parsedResult.porcentaje_riesgo || 10,
      resumen: parsedResult.resumen || 'Análisis completado de forma satisfactoria.',
      factores: parsedResult.factores || [],
      recomendaciones: parsedResult.recomendaciones || [],
      prompt_usado: prompt,
      respuesta_raw: contentText,
      modelo_usado: 'gemini-2.5-flash'
    };
  } catch (error) {
    console.error('Error en analizarRiesgoAlumno:', error);
    throw error;
  }
};

export const generarRecomendacionProfesor = async (grupoId) => {
  try {
    const { data: alumnos, error: alumError } = await supabase
      .from('alumno_grupo')
      .select('alumnos(*, usuarios(nombre))')
      .eq('grupo_id', grupoId);

    const { data: grupo, error: grupoError } = await supabase
      .from('grupos')
      .select('*, materias(nombre)')
      .eq('id', grupoId)
      .single();

    if (grupoError) throw grupoError;

    const materiasNombre = grupo.materias?.nombre || 'la materia';
    const totalAlumnos = alumnos ? alumnos.length : 0;

    if (!isApiKeyConfigured) {
      throw new Error('La API de Gemini no está configurada.');
    }

    const prompt = `Analiza el grupo de materia "${materiasNombre}" con ${totalAlumnos} alumnos inscritos. Genera recomendaciones pedagógicas en español. Responde en formato JSON estructurado:
{
  "resumen": "resumen general del estado",
  "alertas_alumnos": "resumen de alumnos con alertas",
  "sugerencias": ["sugerencia 1", "sugerencia 2", "sugerencia 3"]
}`;

    const { model, generationConfig } = getModel(true);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    return JSON.parse(result.response.text());
  } catch (error) {
    throw error;
  }
};

export const analizarTendenciaCarrera = async (carreraId) => {
  try {
    const { data: carrera } = await supabase.from('carreras').select('*').eq('id', carreraId).single();
    const { data: alumnos } = await supabase.from('alumnos').select('*').eq('carrera_id', carreraId);
    
    const totalAlumnos = alumnos ? alumnos.length : 0;

    if (!isApiKeyConfigured) {
      throw new Error('La API de Gemini no está configurada.');
    }

    const prompt = `Analiza la carrera de ${carrera?.nombre || 'la institución'} con ${totalAlumnos} alumnos. Determina materias críticas, patrones de riesgo y recomendaciones. Responde únicamente en JSON:
{
  "deserción": "estimación",
  "materias_criticas": ["materia 1", "materia 2"],
  "patrones_riesgo": "descripción breve",
  "recomendaciones": ["sugerencia 1", "sugerencia 2"]
}`;

    const { model, generationConfig } = getModel(true);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    return JSON.parse(result.response.text());
  } catch (error) {
    throw error;
  }
};

export const generarResumenEjecutivo = async () => {
  try {
    const { count: totalAlumnos } = await supabase.from('alumnos').select('*', { count: 'exact', head: true });
    const { data: alertas } = await supabase.from('alertas').select('*').eq('estado', 'activa');
    const alertasActivas = alertas ? alertas.length : 0;

    if (!isApiKeyConfigured) {
      throw new Error('La API de Gemini no está configurada.');
    }

    const prompt = `Genera un resumen ejecutivo de inteligencia institucional para una universidad con ${totalAlumnos} alumnos y ${alertasActivas} alertas activas. Responde únicamente en JSON:
{
  "kpi_riesgo_general": "resumen porcentual",
  "carreras_criticas": "nombre de carreras",
  "tendencias_semestre": "tendencia",
  "recomendaciones_estrategicas": ["estrategia 1", "estrategia 2"]
}`;

    const { model, generationConfig } = getModel(true);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    });

    return JSON.parse(result.response.text());
  } catch (error) {
    throw error;
  }
};

export const chatAsistente = async (contexto, pregunta) => {
  try {
    if (!isApiKeyConfigured) {
      throw new Error('La API de Gemini no está configurada.');
    }

    const prompt = `Eres el Asistente de Inteligencia Institucional SIBIA.
Tienes acceso al siguiente contexto actual de datos agregados o específicos del sistema:
${JSON.stringify(contexto)}

El usuario te pregunta:
"${pregunta}"

Responde en español, de forma clara, ejecutiva y amigable. Ayuda al usuario (que es un directivo, coordinador o profesor) a tomar decisiones y entender la información.`;

    const { model } = getModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.5 }
    });

    return result.response.text();
  } catch (error) {
    throw error;
  }
};
