import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertarBrandon() {
  try {
    // Obtener rol alumno
    const { data: roles } = await supabase.from('roles').select('id').eq('nombre', 'alumno').single();
    if (!roles) throw new Error('Rol alumno no encontrado');

    // Obtener carrera ISC
    const { data: carrera } = await supabase.from('carreras').select('id').eq('codigo', 'ISC').single();
    if (!carrera) throw new Error('Carrera ISC no encontrada');

    // Obtener tutor
    const { data: tutor } = await supabase.from('usuarios').select('id').eq('email', 'tutor@sibia.edu').single();
    if (!tutor) throw new Error('Tutor no encontrado');

    // Crear usuario en DB (sin auth para simplificar, como los alumnos semilla)
    const email = 'brandon@sibia.edu';
    let { data: userDb } = await supabase.from('usuarios').select('*').eq('email', email).maybeSingle();
    
    if (!userDb) {
        const { data: newUser } = await supabase.from('usuarios').insert([{
            nombre: 'Brandon López',
            email: email,
            rol_id: roles.id,
            activo: true
        }]).select().single();
        userDb = newUser;
    }

    // Crear Alumno
    let { data: alumnoDb } = await supabase.from('alumnos').select('*').eq('usuario_id', userDb.id).maybeSingle();
    
    if (!alumnoDb) {
        const { data: newAlum } = await supabase.from('alumnos').insert([{
            usuario_id: userDb.id,
            matricula: '20269999',
            carrera_id: carrera.id,
            semestre_actual: 4,
            promedio_general: 5.2, // Critico
            tutor_id: tutor.id
        }]).select().single();
        alumnoDb = newAlum;
    }

    // Buscar grupos de ISC
    const { data: materias } = await supabase.from('materias').select('id').eq('carrera_id', carrera.id);
    const materiaIds = materias.map(m => m.id);
    const { data: grupos } = await supabase.from('grupos').select('id').in('materia_id', materiaIds);

    for (const gp of grupos) {
        // Relacion
        await supabase.from('alumno_grupo').insert([{ alumno_id: alumnoDb.id, grupo_id: gp.id }]).select().maybeSingle();
        // Calificaciones parciales reprobatorias
        await supabase.from('calificaciones').insert([{ alumno_id: alumnoDb.id, grupo_id: gp.id, parcial: 1, calificacion: 4.5 }]).select().maybeSingle();
        await supabase.from('calificaciones').insert([{ alumno_id: alumnoDb.id, grupo_id: gp.id, parcial: 2, calificacion: 5.0 }]).select().maybeSingle();
        
        // Asistencias muy malas (60%)
        const hoy = new Date();
        for (let d = 1; d <= 15; d++) {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() - d);
            if (fecha.getDay() === 0 || fecha.getDay() === 6) continue;
            const fechaStr = fecha.toISOString().split('T')[0];
            
            const presente = Math.random() > 0.4; // 60% asistencia
            await supabase.from('asistencias').insert([{
                alumno_id: alumnoDb.id,
                grupo_id: gp.id,
                fecha: fechaStr,
                presente: presente,
                justificada: false
            }]).select().maybeSingle();
        }
    }

    // Formularios de Bienestar
    const fechaApp = new Date().toISOString();
    await supabase.from('formularios_bienestar').insert([{
        alumno_id: alumnoDb.id,
        fecha_aplicacion: fechaApp,
        nivel_estres: 9, // muy alto
        horas_sueno: 4.5, // muy bajo
        practica_deporte: false,
        frecuencia_deporte: '0x/semana',
        situacion_economica: 2, // baja
        apoyo_familiar: 1, // bajo
        motivacion_academica: 2, // baja
        observaciones: 'El alumno reporta estar sumamente estresado, con problemas económicos severos y considerando la deserción inminente.'
    }]);

    console.log('Brandon creado exitosamente con perfil de riesgo crítico.');
  } catch (err) {
    console.error('Error insertando a Brandon:', err);
  }
}

insertarBrandon();
