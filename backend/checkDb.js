import { supabase } from './src/services/supabase.service.js';

async function check() {
  // Check jefe_carrera user
  const { data: user } = await supabase.from('usuarios').select('*, roles(nombre)').eq('email', 'jefecarrera@sibia.edu').single();
  console.log('=== Usuario Jefe de Carrera ===');
  console.log('ID:', user?.id);
  console.log('Nombre:', user?.nombre);
  console.log('Rol:', user?.roles?.nombre);
  console.log('Auth ID:', user?.auth_id);

  // Check carreras and their coordinador_id
  const { data: carreras } = await supabase.from('carreras').select('*');
  console.log('\n=== Carreras ===');
  carreras?.forEach(c => {
    console.log(`${c.nombre} (${c.codigo}) -> coordinador_id: ${c.coordinador_id}`);
  });

  // Check if coordinador_id matches user id
  const { data: carrerasJefe } = await supabase.from('carreras').select('*').eq('coordinador_id', user?.id);
  console.log('\n=== Carreras asignadas al Jefe ===');
  console.log(carrerasJefe?.length ? carrerasJefe.map(c => c.nombre) : 'NINGUNA - Este es el problema!');

  // Check alumnos count
  const { count } = await supabase.from('alumnos').select('*', { count: 'exact', head: true });
  console.log('\n=== Total alumnos en BD ===', count);

  // Check Brandon
  const { data: brandon } = await supabase.from('usuarios').select('*').eq('email', 'brandon@sibia.edu').maybeSingle();
  console.log('\n=== Brandon ===');
  console.log(brandon ? `Encontrado: ${brandon.nombre}` : 'No encontrado');
}

check();
