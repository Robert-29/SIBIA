import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase.js';
import { api } from '../../lib/api.js';
import {
  X, Moon, Apple, Zap, Heart, Brain, Eye, Users, Wallet, Leaf, Target,
  ChevronRight, ChevronLeft, CheckCircle, AlertCircle, Loader2, Shield, Send
} from 'lucide-react';

/* =====================================================================
   FORMULARIO DE BIENESTAR EXTENDIDO — 10 DIMENSIONES
   Objetivo: Detectar señales tempranas de riesgo en salud física, mental,
   económica y social del alumno. NO es un diagnóstico clínico, es un
   detector temprano de patrones para que un profesional intervenga a tiempo.
   ===================================================================== */

const DIMENSIONES = [
  {
    id: 'sueno',
    titulo: 'Sueño y Descanso',
    descripcion: 'El sueño es el indicador más sensible del bienestar. Un cambio persistente en el sueño anticipa problemas académicos, emocionales y físicos.',
    icon: Moon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    preguntas: [
      { id: 'horas_sueno', tipo: 'slider', label: 'En promedio, ¿cuántas horas duermes por noche entre semana?', min: 2, max: 12, step: 0.5, unidad: 'hrs' },
      { id: 'calidad_sueno', tipo: 'escala', label: '¿Cómo calificarías la calidad de tu sueño?', opciones: ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'] },
      { id: 'dificultad_dormir', tipo: 'frecuencia', label: '¿Con qué frecuencia te cuesta trabajo conciliar el sueño?' },
      { id: 'despertar_nocturno', tipo: 'frecuencia', label: '¿Te despiertas durante la noche y no puedes volver a dormir?' },
      { id: 'somnolencia_diurna', tipo: 'frecuencia', label: '¿Sientes somnolencia excesiva durante el día que afecta tus clases?' }
    ]
  },
  {
    id: 'alimentacion',
    titulo: 'Alimentación y Nutrición',
    descripcion: 'La alimentación impacta directamente en la concentración, energía y estado de ánimo. Cambios en los hábitos alimentarios pueden señalar estrés o problemas emocionales.',
    icon: Apple,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    preguntas: [
      { id: 'comidas_dia', tipo: 'opcion', label: '¿Cuántas comidas completas haces al día normalmente?', opciones: ['1 o menos', '2 comidas', '3 comidas', '4 o más'] },
      { id: 'saltar_comidas', tipo: 'frecuencia', label: '¿Con qué frecuencia te saltas comidas por falta de tiempo o dinero?' },
      { id: 'comida_chatarra', tipo: 'frecuencia', label: '¿Con qué frecuencia recurres a comida rápida o procesada como alimentación principal?' },
      { id: 'apetito_cambio', tipo: 'opcion', label: '¿Has notado cambios importantes en tu apetito últimamente?', opciones: ['Como mucho menos que antes', 'Como un poco menos', 'Normal, sin cambios', 'Como un poco más', 'Como mucho más que antes'] },
      { id: 'hidratacion', tipo: 'opcion', label: '¿Cuántos vasos de agua tomas al día?', opciones: ['Menos de 3', '3 a 5 vasos', '6 a 8 vasos', 'Más de 8 vasos'] },
      { id: 'comer_emocional', tipo: 'frecuencia', label: '¿Comes por ansiedad, aburrimiento o tristeza aunque no tengas hambre?' }
    ]
  },
  {
    id: 'energia',
    titulo: 'Energía y Estado Físico',
    descripcion: 'La fatiga crónica, dolores frecuentes y la falta de actividad física son señales tempranas de que el cuerpo está bajo estrés excesivo.',
    icon: Zap,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    preguntas: [
      { id: 'nivel_energia', tipo: 'escala', label: '¿Cómo describirías tu nivel de energía general en las últimas 2 semanas?', opciones: ['Sin energía', 'Muy baja', 'Regular', 'Buena', 'Excelente'] },
      { id: 'ejercicio_semanal', tipo: 'opcion', label: '¿Cuántas veces por semana haces actividad física de al menos 30 minutos?', opciones: ['Nunca', '1-2 veces', '3-4 veces', '5 o más veces'] },
      { id: 'dolor_cabeza', tipo: 'frecuencia', label: '¿Experimentas dolores de cabeza recurrentes?' },
      { id: 'dolor_cuerpo', tipo: 'frecuencia', label: '¿Sientes dolores musculares, de espalda o tensión corporal frecuente?' },
      { id: 'enfermedad_frecuente', tipo: 'frecuencia', label: '¿Te enfermas con frecuencia (gripa, infecciones, malestar estomacal)?' },
      { id: 'temporada_dolor', tipo: 'opcion', label: '¿En qué épocas del semestre sueles sentirte peor físicamente?', opciones: ['Inicio del semestre', 'Época de exámenes parciales', 'Fin de semestre / finales', 'Todo el tiempo por igual', 'No noto diferencia'] }
    ]
  },
  {
    id: 'emocional',
    titulo: 'Estado Emocional',
    descripcion: 'Tus emociones son información valiosa. Identificar cómo te sientes ayuda a prevenir problemas mayores y a buscar apoyo a tiempo.',
    icon: Heart,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    preguntas: [
      { id: 'estado_animo', tipo: 'escala', label: '¿Cómo describirías tu estado de ánimo general en las últimas 2 semanas?', opciones: ['Muy bajo / triste', 'Bajo', 'Normal', 'Bien', 'Muy bien / motivado'] },
      { id: 'irritabilidad', tipo: 'frecuencia', label: '¿Te sientes irritable, impaciente o enojado sin motivo claro?' },
      { id: 'tristeza_persistente', tipo: 'frecuencia', label: '¿Experimentas tristeza prolongada o ganas de llorar sin razón aparente?' },
      { id: 'perdida_interes', tipo: 'frecuencia', label: '¿Has perdido interés en actividades que antes disfrutabas?' },
      { id: 'soledad', tipo: 'frecuencia', label: '¿Te sientes solo/a aunque estés rodeado/a de personas?' },
      { id: 'agobio_emocional', tipo: 'frecuencia', label: '¿Sientes que todo te rebasa emocionalmente y no puedes manejarlo?' },
      { id: 'llanto_facil', tipo: 'frecuencia', label: '¿Lloras con más facilidad que antes o sin razón aparente?' }
    ]
  },
  {
    id: 'ansiedad',
    titulo: 'Ansiedad y Estrés',
    descripcion: 'El estrés académico es normal en pequeñas dosis, pero cuando se vuelve crónico puede generar problemas serios de salud física y mental.',
    icon: Brain,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    preguntas: [
      { id: 'nivel_estres_general', tipo: 'slider', label: '¿Cuál es tu nivel de estrés general en este momento?', min: 1, max: 10, step: 1, unidad: '/10' },
      { id: 'preocupacion_excesiva', tipo: 'frecuencia', label: '¿Te preocupas de manera excesiva por cosas que no puedes controlar?' },
      { id: 'nerviosismo', tipo: 'frecuencia', label: '¿Sientes nerviosismo, inquietud o dificultad para quedarte quieto/a?' },
      { id: 'dificultad_concentracion', tipo: 'frecuencia', label: '¿Te cuesta concentrarte en clases o al estudiar por pensamientos intrusivos?' },
      { id: 'sintomas_fisicos_ansiedad', tipo: 'frecuencia', label: '¿Experimentas síntomas físicos de ansiedad (taquicardia, sudoración, tensión)?', },
      { id: 'ataques_panico', tipo: 'frecuencia', label: '¿Has tenido episodios de pánico o sensación intensa de miedo sin razón clara?' },
      { id: 'presion_academica', tipo: 'escala', label: '¿Qué tan presionado/a te sientes por las exigencias académicas?', opciones: ['Nada', 'Un poco', 'Moderadamente', 'Mucho', 'Extremadamente'] }
    ]
  },
  {
    id: 'pensamientos',
    titulo: 'Pensamientos y Percepción',
    descripcion: 'Esta sección es confidencial y muy importante. Tus respuestas ayudan a identificar si necesitas apoyo profesional inmediato. No hay respuestas correctas o incorrectas.',
    icon: Eye,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    esCritica: true,
    preguntas: [
      { id: 'sentido_vida', tipo: 'escala', label: '¿Sientes que tu vida tiene sentido y propósito?', opciones: ['Para nada', 'Casi nunca', 'A veces', 'Casi siempre', 'Siempre'], invertida: true },
      { id: 'pensamientos_negativos', tipo: 'frecuencia', label: '¿Tienes pensamientos negativos persistentes sobre ti mismo/a ("no sirvo", "soy un fracaso")?' },
      { id: 'autolesion', tipo: 'siNo', label: '¿Has pensado en hacerte daño de alguna forma?', alerta: true },
      { id: 'ideacion_suicida', tipo: 'siNo', label: '¿Has tenido pensamientos de que estarías mejor si no estuvieras aquí?', alerta: true },
      { id: 'buscar_ayuda', tipo: 'siNo', label: '¿Sientes que necesitas hablar con un profesional sobre cómo te sientes?', alertaSuave: true }
    ]
  },
  {
    id: 'relaciones',
    titulo: 'Relaciones y Entorno Social',
    descripcion: 'El aislamiento social es uno de los predictores más fuertes de problemas de salud mental. La calidad de tus relaciones impacta directamente tu bienestar.',
    icon: Users,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    preguntas: [
      { id: 'red_apoyo', tipo: 'escala', label: '¿Sientes que tienes personas a quienes acudir cuando necesitas ayuda?', opciones: ['A nadie', 'Muy pocas', 'Algunas', 'Varias', 'Muchas'] },
      { id: 'relacion_companeros', tipo: 'escala', label: '¿Cómo es tu relación con tus compañeros de clase?', opciones: ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'] },
      { id: 'conflictos_familiares', tipo: 'frecuencia', label: '¿Tienes conflictos familiares que afectan tu desempeño académico?' },
      { id: 'discriminacion', tipo: 'frecuencia', label: '¿Has experimentado discriminación, acoso o bullying en la escuela?' },
      { id: 'aislamiento', tipo: 'frecuencia', label: '¿Prefieres estar solo/a y evitas interacciones sociales?' },
      { id: 'relacion_profesores', tipo: 'escala', label: '¿Cómo calificarías tu relación con tus profesores?', opciones: ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'] }
    ]
  },
  {
    id: 'economia',
    titulo: 'Situación Económica',
    descripcion: 'La presión económica es una de las principales causas de deserción escolar. Identificar dificultades temprano permite conectarte con apoyos disponibles.',
    icon: Wallet,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    preguntas: [
      { id: 'estabilidad_economica', tipo: 'escala', label: '¿Cómo describirías tu situación económica actual?', opciones: ['Muy difícil', 'Difícil', 'Estable', 'Buena', 'Muy buena'] },
      { id: 'preocupacion_dinero', tipo: 'frecuencia', label: '¿La falta de dinero te causa preocupación constante?' },
      { id: 'trabajar_estudiar', tipo: 'opcion', label: '¿Necesitas trabajar para costear tus estudios?', opciones: ['No trabajo', 'Trabajo medio tiempo', 'Trabajo tiempo completo', 'Trabajo informal / por proyecto'] },
      { id: 'transporte', tipo: 'opcion', label: '¿Tienes dificultades de transporte para llegar a la escuela?', opciones: ['Nunca', 'A veces', 'Frecuentemente', 'Es un problema constante'] },
      { id: 'gastos_materiales', tipo: 'frecuencia', label: '¿Has dejado de comprar materiales, libros o equipo necesario por falta de dinero?' }
    ]
  },
  {
    id: 'habitos',
    titulo: 'Hábitos y Autocuidado',
    descripcion: 'Los hábitos diarios revelan mucho sobre tu bienestar general. Pequeños cambios sostenidos pueden generar grandes mejoras.',
    icon: Leaf,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    preguntas: [
      { id: 'consumo_sustancias', tipo: 'opcion', label: '¿Con qué frecuencia consumes alcohol?', opciones: ['Nunca', 'Ocasionalmente (fiestas)', 'Semanalmente', 'Varias veces por semana', 'Diario'] },
      { id: 'tabaco', tipo: 'opcion', label: '¿Fumas tabaco o usas vaporizador?', opciones: ['Nunca', 'Lo dejé', 'Ocasionalmente', 'Frecuentemente', 'Diario'] },
      { id: 'otras_sustancias', tipo: 'siNo', label: '¿Has consumido alguna sustancia psicoactiva distinta al alcohol o tabaco en las últimas semanas?' },
      { id: 'tiempo_pantalla', tipo: 'opcion', label: '¿Cuántas horas al día pasas en redes sociales (fuera de tareas)?', opciones: ['Menos de 1 hora', '1-2 horas', '3-4 horas', '5-6 horas', 'Más de 6 horas'] },
      { id: 'higiene_personal', tipo: 'frecuencia', label: '¿Has dejado de cuidar tu higiene personal o apariencia por falta de motivación?' },
      { id: 'actividades_recreativas', tipo: 'frecuencia', label: '¿Dedicas tiempo a actividades recreativas o hobbies que disfrutes?' }
    ]
  },
  {
    id: 'motivacion',
    titulo: 'Motivación y Proyecto de Vida',
    descripcion: 'La falta de dirección y propósito es un factor clave en la deserción. Entender qué te motiva ayuda a diseñar mejor tu camino.',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    preguntas: [
      { id: 'motivacion_carrera', tipo: 'escala', label: '¿Qué tan motivado/a te sientes con tu carrera actual?', opciones: ['Nada motivado', 'Poco', 'Moderadamente', 'Bastante', 'Muy motivado'] },
      { id: 'considerar_abandono', tipo: 'opcion', label: '¿Has considerado abandonar tus estudios?', opciones: ['Nunca', 'Lo he pensado vagamente', 'Lo considero seriamente', 'Ya tengo planes de dejarlo'] },
      { id: 'metas_claras', tipo: 'escala', label: '¿Tienes metas académicas y profesionales claras para los próximos 2 años?', opciones: ['Nada claras', 'Poco claras', 'Más o menos', 'Claras', 'Muy claras'] },
      { id: 'sentido_pertenencia', tipo: 'escala', label: '¿Sientes que perteneces a tu universidad y a tu carrera?', opciones: ['Para nada', 'Poco', 'Moderadamente', 'Bastante', 'Totalmente'] },
      { id: 'capacidad_logro', tipo: 'escala', label: '¿Confías en tu capacidad para terminar tu carrera exitosamente?', opciones: ['Nada', 'Poco', 'Regular', 'Bastante', 'Totalmente'] }
    ]
  }
];

const FRECUENCIA_OPCIONES = ['Nunca', 'Rara vez', 'A veces', 'Frecuentemente', 'Casi siempre'];

// ----- Componentes de pregunta -----

function PreguntaSlider({ pregunta, valor, onChange }) {
  const v = valor ?? pregunta.min;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-text-primary leading-snug">{pregunta.label}</label>
        <span className="text-sm font-bold text-primary-dark font-mono shrink-0 ml-2">{v}{pregunta.unidad}</span>
      </div>
      <input
        type="range" min={pregunta.min} max={pregunta.max} step={pregunta.step}
        value={v} onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary-dark h-2 rounded-full cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-text-muted">
        <span>{pregunta.min}{pregunta.unidad}</span>
        <span>{pregunta.max}{pregunta.unidad}</span>
      </div>
    </div>
  );
}

function PreguntaEscala({ pregunta, valor, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-primary leading-snug block">{pregunta.label}</label>
      <div className="flex flex-wrap gap-1.5">
        {pregunta.opciones.map((op, i) => (
          <button
            key={i} type="button"
            onClick={() => onChange(i + 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              valor === (i + 1)
                ? 'bg-primary-dark text-white border-primary-dark shadow-sm'
                : 'bg-bg border-border text-text-secondary hover:border-primary/40 hover:bg-primary-light/30'
            }`}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreguntaFrecuencia({ pregunta, valor, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-primary leading-snug block">{pregunta.label}</label>
      <div className="flex flex-wrap gap-1.5">
        {FRECUENCIA_OPCIONES.map((op, i) => (
          <button
            key={i} type="button"
            onClick={() => onChange(i + 1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              valor === (i + 1)
                ? 'bg-primary-dark text-white border-primary-dark shadow-sm'
                : 'bg-bg border-border text-text-secondary hover:border-primary/40 hover:bg-primary-light/30'
            }`}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreguntaOpcion({ pregunta, valor, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-primary leading-snug block">{pregunta.label}</label>
      <div className="flex flex-col gap-1.5">
        {pregunta.opciones.map((op, i) => (
          <button
            key={i} type="button"
            onClick={() => onChange(i + 1)}
            className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              valor === (i + 1)
                ? 'bg-primary-dark text-white border-primary-dark shadow-sm'
                : 'bg-bg border-border text-text-secondary hover:border-primary/40 hover:bg-primary-light/30'
            }`}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreguntaSiNo({ pregunta, valor, onChange }) {
  const esAlerta = pregunta.alerta;
  return (
    <div className="space-y-2">
      <label className={`text-sm font-medium leading-snug block ${esAlerta ? 'text-text-primary' : 'text-text-primary'}`}>
        {pregunta.label}
      </label>
      {esAlerta && (
        <p className="text-[10px] text-text-muted flex items-center gap-1">
          <Shield size={10} /> Tu respuesta es completamente confidencial y solo será revisada por un profesional de salud.
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button" onClick={() => onChange(true)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
            valor === true
              ? (esAlerta ? 'bg-red-600 text-white border-red-600 shadow-sm' : 'bg-primary-dark text-white border-primary-dark shadow-sm')
              : 'bg-bg border-border text-text-secondary hover:border-primary/40'
          }`}
        >
          Sí
        </button>
        <button
          type="button" onClick={() => onChange(false)}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
            valor === false
              ? 'bg-primary-dark text-white border-primary-dark shadow-sm'
              : 'bg-bg border-border text-text-secondary hover:border-primary/40'
          }`}
        >
          No
        </button>
      </div>
    </div>
  );
}

// ----- Componente principal -----

export default function FormularioBienestarExtendido({ alumnoId, onClose, onSuccess }) {
  const [pasoActual, setPasoActual] = useState(0); // 0 = intro, 1-10 = dimensiones, 11 = resumen
  const [respuestas, setRespuestas] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const contenedorRef = useRef(null);

  const totalPasos = DIMENSIONES.length + 2; // intro + 10 dims + resumen

  useEffect(() => {
    if (contenedorRef.current) {
      contenedorRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pasoActual]);

  const setRespuesta = (dimId, pregId, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [dimId]: { ...(prev[dimId] || {}), [pregId]: valor }
    }));
  };

  const dimensionActual = pasoActual >= 1 && pasoActual <= DIMENSIONES.length
    ? DIMENSIONES[pasoActual - 1] : null;

  const preguntasRespondidas = dimensionActual
    ? dimensionActual.preguntas.filter(p => respuestas[dimensionActual.id]?.[p.id] !== undefined).length
    : 0;
  const totalPreguntasDim = dimensionActual ? dimensionActual.preguntas.length : 0;
  const dimCompleta = preguntasRespondidas === totalPreguntasDim;

  const calcularAlertaCritica = () => {
    const pensamientos = respuestas['pensamientos'] || {};
    return pensamientos.autolesion === true || pensamientos.ideacion_suicida === true;
  };

  const calcularResumen = () => {
    const resumen = {};
    DIMENSIONES.forEach(dim => {
      const dimResp = respuestas[dim.id] || {};
      const pregsRespondidas = Object.keys(dimResp).length;
      const total = dim.preguntas.length;
      let puntaje = 0;
      let maxPuntaje = 0;

      dim.preguntas.forEach(p => {
        const val = dimResp[p.id];
        if (val === undefined) return;

        if (p.tipo === 'slider') {
          // Normalizar: para sueño, 7-8 hrs es ideal
          if (p.id === 'horas_sueno') {
            const ideal = 7.5;
            const diff = Math.abs(val - ideal);
            puntaje += Math.max(0, 100 - diff * 20);
          } else {
            // Para estrés, invertir (1 = bueno, 10 = malo)
            puntaje += Math.max(0, (10 - val) * 10);
          }
          maxPuntaje += 100;
        } else if (p.tipo === 'escala') {
          if (p.invertida) {
            puntaje += ((6 - val) / 5) * 100;
          } else {
            puntaje += (val / 5) * 100;
          }
          maxPuntaje += 100;
        } else if (p.tipo === 'frecuencia') {
          // "Nunca" es bueno para preguntas negativas (invertir)
          if (p.id === 'actividades_recreativas') {
            puntaje += (val / 5) * 100;
          } else {
            puntaje += ((6 - val) / 5) * 100;
          }
          maxPuntaje += 100;
        } else if (p.tipo === 'siNo') {
          if (p.alerta) {
            puntaje += val ? 0 : 100;
          } else {
            puntaje += val ? 0 : 80;
          }
          maxPuntaje += 100;
        } else if (p.tipo === 'opcion') {
          // Depende de la pregunta; simplificado
          puntaje += 50;
          maxPuntaje += 100;
        }
      });

      resumen[dim.id] = {
        titulo: dim.titulo,
        respondidas: pregsRespondidas,
        total,
        puntaje: maxPuntaje > 0 ? Math.round((puntaje / maxPuntaje) * 100) : 0
      };
    });
    return resumen;
  };

  const getNivelColor = (puntaje) => {
    if (puntaje >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (puntaje >= 60) return 'text-teal-700 bg-teal-50 border-teal-200';
    if (puntaje >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  const getNivelTexto = (puntaje) => {
    if (puntaje >= 80) return 'Bien';
    if (puntaje >= 60) return 'Regular';
    if (puntaje >= 40) return 'Atención';
    return 'Crítico';
  };

  const guardarFormulario = async () => {
    setGuardando(true);
    setError(null);
    try {
      // Extraer los valores originales del formulario básico de las respuestas extendidas
      const sueno = respuestas.sueno || {};
      const ansiedad = respuestas.ansiedad || {};
      const economia = respuestas.economia || {};
      const relaciones = respuestas.relaciones || {};
      const motivacion = respuestas.motivacion || {};
      const energia = respuestas.energia || {};

      const payload = {
        nivel_estres: ansiedad.nivel_estres_general || 5,
        horas_sueno: sueno.horas_sueno || 7,
        practica_deporte: (energia.ejercicio_semanal || 1) >= 2,
        frecuencia_deporte: energia.ejercicio_semanal ? ['nunca', '1-2', '3-4', '5+'][energia.ejercicio_semanal - 1] : 'nunca',
        situacion_economica: economia.estabilidad_economica || 3,
        apoyo_familiar: relaciones.red_apoyo || 3,
        motivacion_academica: motivacion.motivacion_carrera || 3,
        observaciones: '',
        respuestas_extendidas: respuestas,
        alerta_critica: calcularAlertaCritica(),
        dimension_completada: 'extendido'
      };

      await api.post(`/alumnos/${alumnoId}/bienestar`, payload);

      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (e) {
      console.error('Error al guardar formulario extendido:', e);
      setError('Hubo un error al guardar tu formulario. Por favor intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const renderPregunta = (pregunta, dimId) => {
    const valor = respuestas[dimId]?.[pregunta.id];
    const props = { pregunta, valor, onChange: (v) => setRespuesta(dimId, pregunta.id, v) };
    switch (pregunta.tipo) {
      case 'slider': return <PreguntaSlider key={pregunta.id} {...props} />;
      case 'escala': return <PreguntaEscala key={pregunta.id} {...props} />;
      case 'frecuencia': return <PreguntaFrecuencia key={pregunta.id} {...props} />;
      case 'opcion': return <PreguntaOpcion key={pregunta.id} {...props} />;
      case 'siNo': return <PreguntaSiNo key={pregunta.id} {...props} />;
      default: return null;
    }
  };

  // Calcular progreso global
  const totalPreguntas = DIMENSIONES.reduce((sum, d) => sum + d.preguntas.length, 0);
  const totalRespondidas = DIMENSIONES.reduce((sum, d) =>
    sum + d.preguntas.filter(p => respuestas[d.id]?.[p.id] !== undefined).length
  , 0);
  const progresoPct = Math.round((totalRespondidas / totalPreguntas) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" style={{ backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-bg/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-dark flex items-center justify-center">
              <Heart size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">Formulario de Bienestar Integral</h3>
              <p className="text-[10px] text-text-muted">Confidencial · Tus respuestas son privadas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-bg rounded-lg text-text-secondary"><X size={18} /></button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-2 bg-bg/30 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between text-[10px] text-text-muted mb-1">
            <span>Paso {pasoActual} de {totalPasos - 1}</span>
            <span>{progresoPct}% completado</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-primary-dark rounded-full transition-all duration-500"
              style={{ width: `${(pasoActual / (totalPasos - 1)) * 100}%` }}
            />
          </div>
          {/* Dimension indicators */}
          <div className="flex gap-1 mt-2">
            {DIMENSIONES.map((dim, i) => {
              const dimResp = respuestas[dim.id] || {};
              const respondidas = Object.keys(dimResp).length;
              const completa = respondidas === dim.preguntas.length;
              const activa = pasoActual === i + 1;
              return (
                <button
                  key={dim.id}
                  onClick={() => setPasoActual(i + 1)}
                  title={dim.titulo}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    activa ? 'bg-primary-dark scale-y-150'
                    : completa ? 'bg-emerald-500'
                    : respondidas > 0 ? 'bg-amber-400'
                    : 'bg-border'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div ref={contenedorRef} className="flex-1 overflow-y-auto p-6">
          {/* Paso 0: Introducción */}
          {pasoActual === 0 && (
            <div className="space-y-6 text-center max-w-md mx-auto py-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-light flex items-center justify-center">
                <Heart size={32} className="text-primary-dark" />
              </div>
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-text-primary">Tu bienestar importa</h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Este formulario evalúa 10 áreas de tu vida para detectar de forma temprana
                  cualquier situación que pueda afectar tu salud y tu desempeño académico.
                </p>
              </div>
              <div className="bg-bg border border-border rounded-xl p-4 text-left space-y-2">
                <p className="text-xs font-bold text-text-primary flex items-center gap-2">
                  <Shield size={14} className="text-primary-dark" /> Lo que debes saber:
                </p>
                <ul className="text-xs text-text-secondary space-y-1.5 ml-5 list-disc">
                  <li>Tus respuestas son <strong>completamente confidenciales</strong>.</li>
                  <li>No es un diagnóstico médico, sino un detector temprano de señales.</li>
                  <li>Tomará aproximadamente <strong>8-12 minutos</strong>.</li>
                  <li>Puedes saltarte preguntas si lo deseas.</li>
                  <li>Tus datos ayudan a que el sistema te dé mejores recomendaciones.</li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DIMENSIONES.slice(0, 6).map(dim => {
                  const DimIcon = dim.icon;
                  return (
                    <div key={dim.id} className={`flex items-center gap-2 text-left px-3 py-2 rounded-lg border ${dim.borderColor} ${dim.bgColor}`}>
                      <DimIcon size={14} className={dim.color} />
                      <span className="text-[11px] font-medium text-text-primary">{dim.titulo}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-text-muted">... y 4 dimensiones más</p>
            </div>
          )}

          {/* Pasos 1-10: Dimensiones */}
          {dimensionActual && (
            <div className="space-y-6">
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${dimensionActual.borderColor} ${dimensionActual.bgColor}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/80 border ${dimensionActual.borderColor}`}>
                  {React.createElement(dimensionActual.icon, { size: 20, className: dimensionActual.color })}
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-primary">{dimensionActual.titulo}</h2>
                  <p className="text-xs text-text-secondary leading-relaxed mt-1">{dimensionActual.descripcion}</p>
                </div>
              </div>

              {dimensionActual.esCritica && (
                <div className="flex items-start gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <AlertCircle size={16} className="text-purple-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-purple-800 leading-relaxed">
                    <strong>Esta sección es especialmente importante.</strong> Si respondes afirmativamente a alguna pregunta sensible,
                    un profesional de psicología será notificado confidencialmente para brindarte apoyo. Esto no es un castigo, es cuidado.
                  </p>
                </div>
              )}

              <div className="space-y-5">
                {dimensionActual.preguntas.map((p, i) => (
                  <div key={p.id} className="p-4 bg-bg/30 border border-border/50 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold text-text-muted bg-border/60 px-1.5 py-0.5 rounded">{i + 1}/{totalPreguntasDim}</span>
                      {respuestas[dimensionActual.id]?.[p.id] !== undefined && (
                        <CheckCircle size={12} className="text-emerald-500" />
                      )}
                    </div>
                    {renderPregunta(p, dimensionActual.id)}
                  </div>
                ))}
              </div>

              <div className="text-center text-[10px] text-text-muted pt-2">
                {preguntasRespondidas} de {totalPreguntasDim} preguntas respondidas
                {!dimCompleta && ' — puedes continuar aunque no las respondas todas'}
              </div>
            </div>
          )}

          {/* Paso final: Resumen */}
          {pasoActual === totalPasos - 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                  <CheckCircle size={28} className="text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-text-primary">Resumen de tu Bienestar</h2>
                <p className="text-xs text-text-secondary">Así se ven tus respuestas por dimensión. Puedes regresar a modificar cualquiera antes de enviar.</p>
              </div>

              {calcularAlertaCritica() && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Se detectó una señal que requiere atención profesional</p>
                    <p className="text-xs text-red-700 mt-1">Al enviar este formulario, un profesional de psicología será notificado de forma confidencial para contactarte y brindarte apoyo. Recuerda que pedir ayuda es un acto de fortaleza.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(calcularResumen()).map(([dimId, info]) => {
                  const dim = DIMENSIONES.find(d => d.id === dimId);
                  const DimIcon = dim.icon;
                  return (
                    <button
                      key={dimId}
                      onClick={() => setPasoActual(DIMENSIONES.findIndex(d => d.id === dimId) + 1)}
                      className={`text-left p-3 rounded-xl border transition-all hover:shadow-sm ${getNivelColor(info.puntaje)}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DimIcon size={14} className={dim.color} />
                          <span className="text-xs font-bold">{info.titulo}</span>
                        </div>
                        <span className="text-xs font-bold font-mono">{info.puntaje}%</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex-1 bg-white/50 rounded-full h-1.5 mr-2 overflow-hidden">
                          <div className="h-full bg-current rounded-full transition-all" style={{ width: `${info.puntaje}%` }} />
                        </div>
                        <span className="text-[10px] font-medium">{getNivelTexto(info.puntaje)}</span>
                      </div>
                      <p className="text-[10px] mt-1 opacity-70">{info.respondidas}/{info.total} preguntas respondidas</p>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-bg/50 shrink-0">
          <button
            onClick={() => setPasoActual(prev => Math.max(0, prev - 1))}
            disabled={pasoActual === 0}
            className="px-4 py-2 border border-border rounded-xl text-sm text-text-secondary hover:bg-bg transition-colors flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          <div className="flex items-center gap-2">
            {pasoActual > 0 && pasoActual < totalPasos - 1 && (
              <span className="text-[10px] text-text-muted hidden sm:block">
                {dimensionActual?.titulo}
              </span>
            )}
          </div>

          {pasoActual < totalPasos - 1 ? (
            <button
              onClick={() => setPasoActual(prev => Math.min(totalPasos - 1, prev + 1))}
              className="px-4 py-2 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors flex items-center gap-1.5"
            >
              {pasoActual === 0 ? 'Comenzar' : 'Siguiente'} <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={guardarFormulario}
              disabled={guardando}
              className="px-5 py-2 bg-primary-dark text-white rounded-xl text-sm font-semibold hover:bg-primary transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {guardando ? (
                <><Loader2 size={14} className="animate-spin" /> Enviando...</>
              ) : (
                <><Send size={14} /> Enviar formulario</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
