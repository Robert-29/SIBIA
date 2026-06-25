import {
  analizarRiesgoAlumno,
  generarRecomendacionProfesor,
  analizarTendenciaCarrera,
  generarResumenEjecutivo,
  chatAsistente
} from '../services/ia.service.js';
import { supabase } from '../services/supabase.service.js';

export const analizarAlumno = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId } = req.user;

    // Ejecutar análisis IA (obtiene factores XAI y recomendaciones)
    const resultado = await analizarRiesgoAlumno(id);

    // Guardar la predicción en base de datos
    const { data: prediccion, error: predError } = await supabase
      .from('predicciones_riesgo')
      .insert([
        {
          alumno_id: id,
          nivel_riesgo: resultado.nivel_riesgo,
          porcentaje_riesgo: resultado.porcentaje_riesgo,
          factores_json: resultado.factores,
          recomendaciones_json: resultado.recomendaciones,
          modelo_usado: resultado.modelo_usado,
          prompt_usado: resultado.prompt_usado,
          respuesta_raw: resultado.respuesta_raw
        }
      ])
      .select()
      .single();

    if (predError) throw predError;

    // Si el nivel de riesgo es alto o crítico, insertar alerta automáticamente si no hay ya una activa
    if (resultado.nivel_riesgo === 'alto' || resultado.nivel_riesgo === 'critico') {
      const { data: alertaExistente } = await supabase
        .from('alertas')
        .select('id')
        .eq('alumno_id', id)
        .eq('estado', 'activa')
        .maybeSingle();

      if (!alertaExistente) {
        const descripcion = `Alerta automática. Nivel: ${resultado.nivel_riesgo.toUpperCase()} (${resultado.porcentaje_riesgo}%). ${resultado.resumen}`;
        await supabase
          .from('alertas')
          .insert([
            {
              alumno_id: id,
              prediccion_id: prediccion.id,
              tipo: 'mixta',
              descripcion,
              estado: 'activa'
            }
          ]);
      }
    }

    // Registrar en auditoría
    await supabase.from('audit_logs').insert([
      {
        usuario_id: userId,
        accion: `Ejecutó análisis IA de riesgo para alumno ID ${id}. Nivel: ${resultado.nivel_riesgo}`,
        tabla_afectada: 'predicciones_riesgo',
        registro_id: prediccion.id.toString()
      }
    ]);

    return res.status(200).json(prediccion);
  } catch (error) {
    console.error('Error en analizarAlumno:', error);
    return res.status(500).json({ error: 'Error al procesar el análisis de riesgo.' });
  }
};

export const analizarGrupo = async (req, res) => {
  try {
    const { grupoId } = req.params;
    const resultado = await generarRecomendacionProfesor(grupoId);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en analizarGrupo:', error);
    return res.status(500).json({ error: 'Error al generar análisis grupal.' });
  }
};

export const analizarCarrera = async (req, res) => {
  try {
    const { carreraId } = req.params;
    const resultado = await analizarTendenciaCarrera(carreraId);
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en analizarCarrera:', error);
    return res.status(500).json({ error: 'Error al generar análisis estratégico de la carrera.' });
  }
};

export const obtenerResumenEjecutivoIA = async (req, res) => {
  try {
    const resultado = await generarResumenEjecutivo();
    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en obtenerResumenEjecutivoIA:', error);
    return res.status(500).json({ error: 'Error al generar resumen ejecutivo estratégico.' });
  }
};

export const ejecutarChat = async (req, res) => {
  try {
    const { pregunta, alumnoId } = req.body;
    
    // Obtener contexto dinámico de datos para el chat
    let contexto = {};
    if (alumnoId) {
      // Si la consulta es de un alumno específico
      const { data: alumno } = await supabase.from('alumnos').select('*, usuarios(nombre), carreras(nombre)').eq('id', alumnoId).maybeSingle();
      const { data: calificaciones } = await supabase.from('calificaciones').select('*, grupos(materias(nombre))').eq('alumno_id', alumnoId);
      const { data: bienestar } = await supabase.from('formularios_bienestar').select('*').eq('alumno_id', alumnoId).order('fecha_aplicacion', { ascending: false }).limit(1).maybeSingle();
      contexto = { alumno, calificaciones, bienestar };
    } else {
      // Contexto global simple
      const { data: alumnos } = await supabase.from('alumnos').select('id, carrera_id, promedio_general');
      const { data: alertas } = await supabase.from('alertas').select('id').eq('estado', 'activa');
      contexto = {
        total_alumnos: alumnos ? alumnos.length : 0,
        total_alertas_activas: alertas ? alertas.length : 0,
        alumnos_general: alumnos || []
      };
    }

    const respuesta = await chatAsistente(contexto, pregunta);
    return res.status(200).json({ respuesta });
  } catch (error) {
    console.error('Error en ejecutarChat:', error);
    return res.status(500).json({ error: 'Error en el chat del asistente.' });
  }
};
