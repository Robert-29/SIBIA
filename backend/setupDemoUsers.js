import { supabase } from './src/services/supabase.service.js';
import { DEMO_USERS } from './src/config/demoUsers.js';

async function getRolId(nombre) {
  const { data } = await supabase.from('roles').select('id').eq('nombre', nombre).single();
  return data?.id ?? null;
}

async function ensureAuthUser({ email, password, nombre, rol }) {
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { nombre, rol },
    });
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nombre, rol },
  });

  if (error) throw new Error(`Auth ${email}: ${error.message}`);
  return data.user.id;
}

async function upsertUsuario({ email, nombre, rol, authId, rolId }) {
  const { data: existing } = await supabase
    .from('usuarios')
    .select('id, rol_id, auth_id, roles(nombre)')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('usuarios')
      .update({ nombre, rol_id: rolId, auth_id: authId, activo: true })
      .eq('id', existing.id)
      .select('*, roles(nombre)')
      .single();
    if (error) throw error;
    console.log(`  ✓ Actualizado: ${email} → ${data.roles.nombre}`);
    return data;
  }

  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ email, nombre, rol_id: rolId, auth_id: authId, activo: true }])
    .select('*, roles(nombre)')
    .single();
  if (error) throw error;
  console.log(`  ✓ Creado: ${email} → ${data.roles.nombre}`);
  return data;
}

async function assignJefeCarrera(usuarioId) {
  const { data: carrera } = await supabase.from('carreras').select('id, nombre').eq('codigo', 'ISC').maybeSingle();
  if (carrera) {
    await supabase.from('carreras').update({ coordinador_id: usuarioId }).eq('id', carrera.id);
    console.log(`  ✓ Jefe asignado a carrera: ${carrera.nombre}`);
  }
}

async function ensureAlumnoRecord(usuarioId) {
  const { data: existing } = await supabase.from('alumnos').select('id').eq('usuario_id', usuarioId).maybeSingle();
  if (existing) return;

  const { data: carrera } = await supabase.from('carreras').select('id').eq('codigo', 'ISC').single();
  const { data: tutor } = await supabase.from('usuarios').select('id').eq('email', 'tutor@sibia.edu').maybeSingle();

  await supabase.from('alumnos').insert([{
    usuario_id: usuarioId,
    matricula: '20260001',
    carrera_id: carrera?.id,
    semestre_actual: 4,
    promedio_general: 8.5,
    tutor_id: tutor?.id ?? null,
  }]);
  console.log('  ✓ Registro de alumno demo creado');
}

async function main() {
  console.log('Configurando cuentas demo @sibia.edu...\n');

  for (const demo of DEMO_USERS) {
    console.log(`→ ${demo.email} (${demo.rol})`);
    const rolId = await getRolId(demo.rol);
    if (!rolId) {
      console.error(`  ✗ Rol "${demo.rol}" no encontrado en la tabla roles`);
      continue;
    }

    const authId = await ensureAuthUser(demo);
    const usuario = await upsertUsuario({ ...demo, authId, rolId });

    if (demo.rol === 'jefe_carrera') {
      await assignJefeCarrera(usuario.id);
    }
    if (demo.rol === 'alumno') {
      await ensureAlumnoRecord(usuario.id);
    }
  }

  console.log('\n✅ Cuentas demo listas. Cierra sesión y vuelve a entrar.');
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
