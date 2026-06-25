import { supabase } from './services/supabase.service.js';

const tablesToTruncate = [
  { name: 'audit_logs', filter: 'id' },
  { name: 'alertas', filter: 'id' },
  { name: 'predicciones_riesgo', filter: 'id' },
  { name: 'formularios_bienestar', filter: 'id' },
  { name: 'asistencias', filter: 'id' },
  { name: 'calificaciones', filter: 'id' },
  { name: 'alumno_grupo', filter: 'alumno_id' },
  { name: 'alumnos', filter: 'id' },
  { name: 'grupos', filter: 'id' },
  { name: 'materias', filter: 'id' },
  { name: 'carreras', filter: 'id' },
  { name: 'usuarios', filter: 'id' },
  { name: 'roles', filter: 'id' }
];

export const truncateDatabase = async () => {
  console.log('Iniciando borrado de todos los datos...');
  for (const table of tablesToTruncate) {
    try {
      console.log(`Borrando datos de la tabla: ${table.name}...`);
      // Supabase requiere un filtro para borrar, así que usamos uno que coincida con todos
      const { error } = await supabase.from(table.name).delete().not(table.filter, 'is', null);
      if (error) {
        console.error(`Error borrando ${table.name}:`, error.message);
      } else {
        console.log(`- ${table.name} vaciada correctamente.`);
      }
    } catch (err) {
      console.error(`Excepción borrando ${table.name}:`, err.message);
    }
  }
  console.log('¡Borrado de base de datos finalizado!');
};

truncateDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
