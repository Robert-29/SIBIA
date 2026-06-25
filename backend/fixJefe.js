import { supabase } from './src/services/supabase.service.js';

async function fixData() {
  // 1. Obtener la carrera ADM
  const { data: adm } = await supabase.from('carreras').select('*').eq('codigo', 'ADM').single();
  
  if (adm) {
    // 2. Establecer el coordinador_id en nulo temporalmente o crear uno nuevo
    await supabase.from('carreras').update({ coordinador_id: null }).eq('id', adm.id);
    console.log('Carrera ADM desligada de la Mtra. Lucía Pérez.');
  }

  // 3. Crear un nuevo jefe_carrera para ADM en la base local (y auth si es necesario)
  const newJefe = {
    email: 'jefeadm@sibia.edu',
    password: 'Coord2024!',
    nombre: 'Mtro. Carlos Slim',
  };

  const { data: rolData } = await supabase.from('roles').select('id').eq('nombre', 'jefe_carrera').single();

  let authId = null;
  const { data: authUser } = await supabase.auth.admin.createUser({
    email: newJefe.email,
    password: newJefe.password,
    email_confirm: true
  });

  if (authUser?.user) {
    authId = authUser.user.id;
  }

  const { data: dbUser } = await supabase.from('usuarios').insert([{
    nombre: newJefe.nombre,
    email: newJefe.email,
    rol_id: rolData.id,
    auth_id: authId,
    activo: true
  }]).select().single();

  if (dbUser && adm) {
    await supabase.from('carreras').update({ coordinador_id: dbUser.id }).eq('id', adm.id);
    console.log(`Carrera ADM asignada al nuevo jefe: ${dbUser.nombre}`);
  }

  console.log('Arreglo de base de datos finalizado.');
}

fixData();
