import { supabase } from './services/supabase.service.js';

// =====================================================================
//  SEED COMPLETO - SIBIA
//  7 Carreras · 56 Profesores · ~910 Alumnos · Historial completo
//  Distribución de riesgo: 80% nulo, 13% probable, 7% riesgo
// =====================================================================

// ── Utilidades ──────────────────────────────────────────────────────
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Nombres mexicanos realistas ─────────────────────────────────────
const NOMBRES_M = ['Alejandro','Andrés','Antonio','Arturo','Brandon','Bruno','Carlos','César','Christian','Daniel','David','Diego','Eduardo','Emilio','Enrique','Ernesto','Esteban','Felipe','Fernando','Francisco','Gabriel','Gerardo','Gonzalo','Guillermo','Gustavo','Héctor','Hugo','Iván','Javier','Jesús','Jorge','José','Juan','Kevin','Leonardo','Luis','Manuel','Marco','Mario','Martín','Mateo','Mauricio','Miguel','Nicolás','Omar','Óscar','Pablo','Pedro','Rafael','Ramón','Raúl','Ricardo','Roberto','Rodrigo','Salvador','Samuel','Santiago','Sebastián','Sergio','Tomás','Valentín','Víctor'];
const NOMBRES_F = ['Alejandra','Alicia','Ana','Andrea','Ángela','Beatriz','Camila','Carolina','Claudia','Cristina','Daniela','Diana','Elena','Elizabeth','Estefanía','Eva','Fernanda','Gabriela','Guadalupe','Helena','Irene','Isabel','Jessica','Jimena','Josefina','Juana','Karen','Laura','Leticia','Liliana','Lorena','Lucía','Luisa','Marcela','Margarita','María','Mariana','Marina','Martha','Melissa','Mónica','Natalia','Nicole','Noemí','Olga','Paola','Patricia','Paula','Paulina','Pilar','Regina','Renata','Rosa','Sandra','Sara','Silvia','Sofía','Teresa','Valentina','Valeria','Vanessa','Verónica','Victoria','Ximena','Yolanda'];
const APELLIDOS = ['García','Hernández','López','Martínez','González','Rodríguez','Pérez','Sánchez','Ramírez','Cruz','Flores','Gómez','Morales','Reyes','Ruiz','Torres','Díaz','Álvarez','Gutiérrez','Mendoza','Vargas','Castillo','Romero','Herrera','Medina','Castro','Ortiz','Jiménez','Delgado','Vega','Ríos','Contreras','Rivera','Ramos','Santos','Navarro','Aguilar','Salazar','Campos','Rojas','Molina','Silva','Domínguez','Moreno','Cervantes','Espinoza','Córdoba','Ibarra','Guerrero','Bautista','Acosta','Luna','Fuentes','Vera','Cabrera','Valenzuela','León','Estrada','Mejía','Solís','Duarte','Carrillo','Lara','Ochoa','Ávila','Ponce','Camacho','Bravo','Gallegos','Zamora','Orozco','Miranda','Montes','Nava','Trejo','Figueroa','Padilla','Peña','Blanco','Villanueva','Cisneros','Rangel','Rosales','Barrera'];

const generarNombre = () => {
  const esMujer = Math.random() > 0.5;
  const nombre = esMujer ? pick(NOMBRES_F) : pick(NOMBRES_M);
  const ap1 = pick(APELLIDOS);
  const ap2 = pick(APELLIDOS);
  return `${nombre} ${ap1} ${ap2}`;
};

const emailsUsados = new Set();
const generarEmail = (nombre) => {
  const partes = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().split(' ');
  const dominio = Math.random() > 0.5 ? '@gmail.com' : '@hotmail.com';
  let base = `${partes[0]}.${partes[1]}`;
  let email = `${base}${dominio}`;
  let i = 1;
  while (emailsUsados.has(email)) {
    email = `${base}${i}${dominio}`;
    i++;
  }
  emailsUsados.add(email);
  return email;
};

// ── Datos de carreras y materias ────────────────────────────────────
const CARRERAS_DATA = [
  {
    nombre: 'Ingeniería en Sistemas Computacionales', codigo: 'ISC',
    materias: {
      1: ['Cálculo Diferencial','Fundamentos de Programación','Álgebra Lineal','Física I','Química General','Taller de Ética'],
      2: ['Cálculo Integral','Programación Orientada a Objetos','Probabilidad y Estadística','Física II','Contabilidad Financiera','Desarrollo Sustentable'],
      3: ['Cálculo Vectorial','Estructura de Datos','Álgebra Discreta','Investigación de Operaciones','Cultura Empresarial','Electricidad y Magnetismo'],
      4: ['Ecuaciones Diferenciales','Métodos Numéricos','Bases de Datos','Sistemas Operativos','Arquitectura de Computadoras','Ingeniería de Software I'],
      5: ['Redes de Computadoras','Desarrollo Web','Ingeniería de Software II','Graficación','Simulación','Fundamentos de Telecomunicaciones'],
      6: ['Programación Web Avanzada','Inteligencia Artificial','Administración de BD','Sistemas Distribuidos','Gestión de Proyectos de TI','Taller de Investigación I'],
      7: ['Minería de Datos','Seguridad Informática','Arquitectura de Software','IoT y Sistemas Embebidos','Taller de Investigación II','Administración de Redes'],
      8: ['Cómputo en la Nube','DevOps y CI/CD','Big Data','Desarrollo Móvil','Emprendimiento Tecnológico','Residencia Profesional I'],
    }
  },
  {
    nombre: 'Ingeniería Mecatrónica', codigo: 'IMT',
    materias: {
      1: ['Cálculo Diferencial','Álgebra Lineal','Física I','Química General','Dibujo Asistido por Computadora','Taller de Ética'],
      2: ['Cálculo Integral','Física II','Programación Básica','Estática','Probabilidad y Estadística','Desarrollo Sustentable'],
      3: ['Cálculo Vectorial','Dinámica','Circuitos Eléctricos I','Mecánica de Materiales','Electrónica Analógica','Termodinámica'],
      4: ['Ecuaciones Diferenciales','Circuitos Eléctricos II','Electrónica Digital','Mecanismos','Instrumentación','Control I'],
      5: ['Máquinas Eléctricas','Microcontroladores','Control II','Diseño Mecánico','Neumática y Hidráulica','Sensores y Actuadores'],
      6: ['Robótica Industrial','PLC y Automatización','Sistemas de Manufactura','Visión Artificial','Control Digital','Gestión de Proyectos'],
      7: ['Diseño Mecatrónico','Manufactura Avanzada','Redes Industriales','IA para Ingeniería','Taller de Investigación I','Administración'],
      8: ['Integración de Sistemas Mecatrónicos','Robótica Avanzada','Sistemas SCADA','Emprendimiento','Taller de Investigación II','Residencia Profesional I'],
    }
  },
  {
    nombre: 'Ingeniería Civil', codigo: 'IC',
    materias: {
      1: ['Cálculo Diferencial','Álgebra Lineal','Física I','Química General','Dibujo Técnico','Taller de Ética'],
      2: ['Cálculo Integral','Física II','Topografía I','Geología','Probabilidad y Estadística','Desarrollo Sustentable'],
      3: ['Cálculo Vectorial','Topografía II','Mecánica de Materiales','Hidráulica Básica','Materiales de Construcción','Estática'],
      4: ['Ecuaciones Diferenciales','Análisis Estructural I','Mecánica de Suelos I','Hidrología','Tecnología del Concreto','Dinámica'],
      5: ['Análisis Estructural II','Mecánica de Suelos II','Hidráulica de Canales','Diseño de Estructuras de Acero','Costos y Presupuestos','Vías Terrestres I'],
      6: ['Diseño de Estructuras de Concreto','Ingeniería Sanitaria','Vías Terrestres II','Geotecnia','Instalaciones en Edificios','Gestión de Proyectos'],
      7: ['Pavimentos','Puentes','Ingeniería Ambiental','Administración de Obra','Taller de Investigación I','Legislación en Construcción'],
      8: ['Supervisión de Obra','Planeación Urbana','Sistemas de Agua Potable','Emprendimiento','Taller de Investigación II','Residencia Profesional I'],
    }
  },
  {
    nombre: 'Ingeniería Industrial', codigo: 'II',
    materias: {
      1: ['Cálculo Diferencial','Álgebra Lineal','Física I','Química General','Fundamentos de Ingeniería Industrial','Taller de Ética'],
      2: ['Cálculo Integral','Física II','Probabilidad y Estadística','Contabilidad Financiera','Procesos de Fabricación','Desarrollo Sustentable'],
      3: ['Cálculo Vectorial','Estadística Inferencial','Metrología y Normalización','Investigación de Operaciones I','Electricidad Industrial','Estudio del Trabajo I'],
      4: ['Ecuaciones Diferenciales','Investigación de Operaciones II','Estudio del Trabajo II','Administración de Operaciones I','Ergonomía','Análisis de Costos'],
      5: ['Administración de Operaciones II','Control Estadístico de Calidad','Logística y Cadena de Suministro','Higiene y Seguridad Industrial','Simulación','Gestión de la Calidad'],
      6: ['Planeación y Diseño de Instalaciones','Manufactura Esbelta','Sistemas de Manufactura','Administración de Proyectos','Mercadotecnia','Gestión Ambiental'],
      7: ['Ingeniería de Sistemas','Toma de Decisiones','Planeación Financiera','Emprendimiento','Taller de Investigación I','Relaciones Industriales'],
      8: ['Gestión de la Tecnología','Seminario de Calidad','Evaluación de Proyectos','Habilidades Directivas','Taller de Investigación II','Residencia Profesional I'],
    }
  },
  {
    nombre: 'Gastronomía', codigo: 'GAS',
    materias: {
      1: ['Introducción a la Gastronomía','Técnicas Culinarias I','Higiene y Sanidad Alimentaria','Química de Alimentos','Nutrición Básica','Taller de Ética'],
      2: ['Técnicas Culinarias II','Panadería y Repostería I','Cocina Mexicana I','Administración de A&B','Microbiología de Alimentos','Desarrollo Sustentable'],
      3: ['Cocina Internacional I','Panadería y Repostería II','Cocina Mexicana II','Costos y Presupuestos en A&B','Enología y Maridaje','Servicio al Cliente'],
      4: ['Cocina Internacional II','Garde Manger','Cocina de Vanguardia','Compras y Almacén','Gestión de Eventos','Contabilidad para Restaurantes'],
      5: ['Cocina Asiática','Chocolatería y Confitería','Planificación de Menús','Diseño de Restaurantes','Mercadotecnia Gastronómica','Legislación Alimentaria'],
      6: ['Cocina de Autor','Catering y Banquetes','Sommelier','Emprendimiento Gastronómico','Fotografía Gastronómica','Gestión de Proyectos'],
      7: ['Cocina Sustentable','Investigación Gastronómica','Tendencias Culinarias','Administración de Restaurantes','Taller de Investigación I','Innovación Alimentaria'],
      8: ['Proyecto Gastronómico Final','Consultoría Gastronómica','Cocina Molecular','Franquicias y Negocios','Taller de Investigación II','Residencia Profesional I'],
    }
  },
  {
    nombre: 'Biología', codigo: 'BIO',
    materias: {
      1: ['Biología General','Química General','Matemáticas I','Física I','Bioética','Taller de Ética'],
      2: ['Biología Celular','Química Orgánica','Matemáticas II','Física II','Bioestadística','Desarrollo Sustentable'],
      3: ['Bioquímica','Microbiología General','Botánica I','Zoología I','Ecología General','Genética'],
      4: ['Fisiología Vegetal','Fisiología Animal','Botánica II','Zoología II','Biología Molecular','Evolución'],
      5: ['Microbiología Ambiental','Ecología de Poblaciones','Biotecnología I','Inmunología','Biogeografía','Taxonomía'],
      6: ['Ecología de Comunidades','Biotecnología II','Biología Marina','Parasitología','Manejo de Recursos Naturales','Gestión de Proyectos'],
      7: ['Bioinformática','Conservación Biológica','Toxicología Ambiental','Educación Ambiental','Taller de Investigación I','Impacto Ambiental'],
      8: ['Proyecto de Investigación','Restauración Ecológica','Biología de la Conservación','Desarrollo Comunitario','Taller de Investigación II','Residencia Profesional I'],
    }
  },
  {
    nombre: 'Administración', codigo: 'ADM',
    materias: {
      1: ['Fundamentos de Administración','Contabilidad Básica','Matemáticas Administrativas I','Derecho Empresarial','Informática Empresarial','Taller de Ética'],
      2: ['Proceso Administrativo','Contabilidad de Costos','Matemáticas Administrativas II','Derecho Laboral','Estadística Administrativa I','Desarrollo Sustentable'],
      3: ['Administración de RRHH I','Finanzas I','Estadística Administrativa II','Economía Empresarial','Mercadotecnia I','Comportamiento Organizacional'],
      4: ['Administración de RRHH II','Finanzas II','Investigación de Mercados','Economía Internacional','Mercadotecnia II','Administración de la Producción'],
      5: ['Administración Financiera','Administración de Ventas','Plan de Negocios','Comercio Internacional','Sistemas de Información','Liderazgo Empresarial'],
      6: ['Administración Estratégica','Gestión de la Calidad','Auditoría Administrativa','Logística Empresarial','Consultoría Empresarial','Gestión de Proyectos'],
      7: ['Dirección Empresarial','Negocios Electrónicos','Desarrollo Organizacional','Ética Profesional','Taller de Investigación I','Gestión del Cambio'],
      8: ['Seminario de Administración','Emprendimiento','Gobierno Corporativo','Responsabilidad Social','Taller de Investigación II','Residencia Profesional I'],
    }
  }
];

// Semestres activos y sus tamaños de grupo
const SEMESTRES_ACTIVOS = [
  { semestre: 2, alumnos: 38 },
  { semestre: 4, alumnos: 35 },
  { semestre: 6, alumnos: 33 },
  { semestre: 8, alumnos: 30 },
];

// Contraseña estándar para usuarios del sistema
const SYSTEM_PASSWORD = 'Sibia2026!';

// Nombres de profesores con títulos académicos
const TITULOS_PROF = ['Dr.','Dra.','Mtro.','Mtra.','Ing.','Lic.','M.C.','Ph.D.'];

// Perfil de estrés por carrera (para diferenciar estadísticas)
// stress_bias: cuanto más alto, más estrés en esa carrera
// sleep_bias: cuanto más bajo, menos horas de sueño
// fail_bias: cuanto más alto, más reprobación
const CARRERA_PERFILES = {
  'GAS': { stress_bias: 1.8, sleep_bias: -0.8, fail_bias: 0.3, dropout_bias: 0.2 },   // Mayor estrés
  'IC':  { stress_bias: 1.2, sleep_bias: -1.2, fail_bias: 0.5, dropout_bias: 0.3 },   // Menor sueño
  'IMT': { stress_bias: 1.0, sleep_bias: -0.5, fail_bias: 1.0, dropout_bias: 0.4 },   // Mayor reprobación
  'BIO': { stress_bias: 0.5, sleep_bias: -0.3, fail_bias: 0.3, dropout_bias: 1.0 },   // Mayor deserción
  'ISC': { stress_bias: 0.8, sleep_bias: -0.4, fail_bias: 0.4, dropout_bias: 0.3 },
  'II':  { stress_bias: 0.6, sleep_bias: -0.3, fail_bias: 0.3, dropout_bias: 0.2 },
  'ADM': { stress_bias: 0.3, sleep_bias: -0.1, fail_bias: 0.1, dropout_bias: 0.1 },   // Más estable
};

// ── Inserción por lotes ──────────────────────────────────────────────
async function insertBatch(tabla, registros, batchSize = 500) {
  const results = [];
  for (let i = 0; i < registros.length; i += batchSize) {
    const batch = registros.slice(i, i + batchSize);
    const { data, error } = await supabase.from(tabla).insert(batch).select();
    if (error) {
      console.error(`Error insertando en ${tabla} (batch ${i / batchSize + 1}):`, error.message);
      // Intentar uno por uno si falla el lote
      for (const reg of batch) {
        const { data: single, error: singleErr } = await supabase.from(tabla).insert([reg]).select();
        if (singleErr) console.error(`  Error individual:`, singleErr.message);
        else if (single) results.push(...single);
      }
    } else if (data) {
      results.push(...data);
    }
    if (registros.length > batchSize) await sleep(200);
  }
  return results;
}

// =====================================================================
//  FUNCIÓN PRINCIPAL DE SIEMBRA
// =====================================================================
export const sembrarBaseDatos = async () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  SIBIA - Siembra completa de base de datos  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const t0 = Date.now();

  // ─────────────────────────────────────────────────────
  // 1. ROLES
  // ─────────────────────────────────────────────────────
  console.log('1️⃣  Insertando roles...');
  const rolesNombres = ['administrador','director','jefe_carrera','tutor','psicologo','profesor','alumno'];
  const rolesInserted = await insertBatch('roles', rolesNombres.map(n => ({ nombre: n })));
  const getRolId = (nombre) => rolesInserted.find(r => r.nombre === nombre)?.id;
  console.log(`   ✅ ${rolesInserted.length} roles creados.\n`);

  // ─────────────────────────────────────────────────────
  // 2. USUARIOS DEL SISTEMA (admin, director, psicólogo)
  // ─────────────────────────────────────────────────────
  console.log('2️⃣  Creando usuarios del sistema...');
  
  const systemUsers = [
    { nombre: 'Ing. Ricardo Valdés Monroy', email: 'ricardo.valdes@gmail.com', rol: 'administrador' },
    { nombre: 'Dr. Fernando Gutiérrez Lara', email: 'fernando.gutierrez@gmail.com', rol: 'director' },
    { nombre: 'Psic. Claudia Ortiz Méndez', email: 'claudia.ortiz@hotmail.com', rol: 'psicologo' },
  ];

  const usersDb = {};
  
  for (const su of systemUsers) {
    // Crear en Supabase Auth
    let authId = null;
    try {
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: su.email, password: SYSTEM_PASSWORD, email_confirm: true
      });
      if (authUser?.user) authId = authUser.user.id;
      else if (authErr) console.log(`   ⚠️  Auth ${su.email}: ${authErr.message}`);
    } catch (e) { console.log(`   ⚠️  Auth excepción: ${e.message}`); }

    const { data: newUser } = await supabase.from('usuarios').insert([{
      nombre: su.nombre, email: su.email, rol_id: getRolId(su.rol), auth_id: authId, activo: true
    }]).select().single();
    
    if (newUser) {
      usersDb[su.rol] = newUser;
      console.log(`   ✅ ${su.rol}: ${su.email}`);
    }
  }

  // ─────────────────────────────────────────────────────
  // 3. JEFES DE CARRERA (1 por carrera)
  // ─────────────────────────────────────────────────────
  console.log('\n3️⃣  Creando jefes de carrera...');
  const jefesData = [
    { nombre: 'Mtra. Lucía Pérez Domínguez', email: 'lucia.perez@gmail.com' },
    { nombre: 'Dr. Héctor Solís Rivera', email: 'hector.solis@hotmail.com' },
    { nombre: 'Ing. Patricia Moreno Campos', email: 'patricia.moreno@gmail.com' },
    { nombre: 'Mtro. Raúl Estrada Navarro', email: 'raul.estrada@hotmail.com' },
    { nombre: 'Chef Alejandra Vega Ibarra', email: 'alejandra.vega@gmail.com' },
    { nombre: 'Dra. Marina Fuentes Castillo', email: 'marina.fuentes@hotmail.com' },
    { nombre: 'Mtro. Carlos Blanco Mejía', email: 'carlos.blanco@gmail.com' },
  ];
  
  const jefesDb = [];
  for (const jf of jefesData) {
    let authId = null;
    try {
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: jf.email, password: SYSTEM_PASSWORD, email_confirm: true
      });
      if (authUser?.user) authId = authUser.user.id;
    } catch (e) { /* ignore */ }

    const { data: newJefe } = await supabase.from('usuarios').insert([{
      nombre: jf.nombre, email: jf.email, rol_id: getRolId('jefe_carrera'), auth_id: authId, activo: true
    }]).select().single();
    
    if (newJefe) {
      jefesDb.push(newJefe);
      console.log(`   ✅ Jefe: ${jf.nombre} → ${jf.email}`);
    }
  }

  // ─────────────────────────────────────────────────────
  // 4. CARRERAS
  // ─────────────────────────────────────────────────────
  console.log('\n4️⃣  Creando carreras...');
  const carrerasDb = [];
  for (let i = 0; i < CARRERAS_DATA.length; i++) {
    const c = CARRERAS_DATA[i];
    const { data: newCarrera } = await supabase.from('carreras').insert([{
      nombre: c.nombre, codigo: c.codigo, coordinador_id: jefesDb[i]?.id
    }]).select().single();
    
    if (newCarrera) {
      carrerasDb.push(newCarrera);
      console.log(`   ✅ ${c.nombre} (${c.codigo})`);
    }
  }

  // ─────────────────────────────────────────────────────
  // 5. MATERIAS (6 por semestre × 8 semestres × 7 carreras)
  // ─────────────────────────────────────────────────────
  console.log('\n5️⃣  Creando materias...');
  const materiasDb = {}; // { 'ISC': { 1: [materia1,...], 2: [...], ... } }
  let totalMaterias = 0;

  for (const carreraData of CARRERAS_DATA) {
    const carreraDb = carrerasDb.find(c => c.codigo === carreraData.codigo);
    if (!carreraDb) continue;
    materiasDb[carreraData.codigo] = {};

    for (let sem = 1; sem <= 8; sem++) {
      const nombres = carreraData.materias[sem];
      const materiasToInsert = nombres.map((nombre, idx) => ({
        nombre,
        codigo: `${carreraData.codigo}-${sem}0${idx + 1}`,
        carrera_id: carreraDb.id,
        creditos: randInt(4, 8)
      }));

      const inserted = await insertBatch('materias', materiasToInsert);
      materiasDb[carreraData.codigo][sem] = inserted;
      totalMaterias += inserted.length;
    }
  }
  console.log(`   ✅ ${totalMaterias} materias creadas.\n`);

  // ─────────────────────────────────────────────────────
  // 6. PROFESORES (8 por carrera = 56 total)
  // ─────────────────────────────────────────────────────
  console.log('6️⃣  Creando profesores...');
  const profesoresDb = {}; // { 'ISC': [prof1, prof2, ...8], ... }
  let totalProfes = 0;

  for (const carreraData of CARRERAS_DATA) {
    profesoresDb[carreraData.codigo] = [];
    for (let p = 0; p < 8; p++) {
      const nombre = `${pick(TITULOS_PROF)} ${generarNombre()}`;
      const email = generarEmail(nombre);

      let authId = null;
      // Solo crear auth para los primeros 2 profesores de cada carrera (para demo)
      if (p < 2) {
        try {
          const { data: authUser } = await supabase.auth.admin.createUser({
            email, password: SYSTEM_PASSWORD, email_confirm: true
          });
          if (authUser?.user) authId = authUser.user.id;
        } catch (e) { /* ignore */ }
      }

      const { data: newProf } = await supabase.from('usuarios').insert([{
        nombre, email, rol_id: getRolId('profesor'), auth_id: authId, activo: true
      }]).select().single();

      if (newProf) {
        profesoresDb[carreraData.codigo].push(newProf);
        totalProfes++;
      }
    }
  }
  console.log(`   ✅ ${totalProfes} profesores creados.\n`);

  // ─────────────────────────────────────────────────────
  // 7. TUTORES (2 por carrera = 14 total)
  // ─────────────────────────────────────────────────────
  console.log('7️⃣  Creando tutores...');
  const tutoresDb = {}; // { 'ISC': [tutor1, tutor2], ... }
  let totalTutores = 0;

  for (const carreraData of CARRERAS_DATA) {
    tutoresDb[carreraData.codigo] = [];
    for (let t = 0; t < 2; t++) {
      const nombre = `${pick(['Lic.','Mtro.','Mtra.','Psic.','Dr.','Dra.'])} ${generarNombre()}`;
      const email = generarEmail(nombre);

      let authId = null;
      try {
        const { data: authUser } = await supabase.auth.admin.createUser({
          email, password: SYSTEM_PASSWORD, email_confirm: true
        });
        if (authUser?.user) authId = authUser.user.id;
      } catch (e) { /* ignore */ }

      const { data: newTutor } = await supabase.from('usuarios').insert([{
        nombre, email, rol_id: getRolId('tutor'), auth_id: authId, activo: true
      }]).select().single();

      if (newTutor) {
        tutoresDb[carreraData.codigo].push(newTutor);
        totalTutores++;
      }
    }
  }
  console.log(`   ✅ ${totalTutores} tutores creados.\n`);

  // ─────────────────────────────────────────────────────
  // 8. GRUPOS (para TODOS los semestres 1-8, activos e históricos)
  // ─────────────────────────────────────────────────────
  console.log('8️⃣  Creando grupos...');
  const gruposDb = {}; // { 'ISC': { 1: [grupo1,...6], 2: [...], ... } }
  let totalGrupos = 0;

  for (const carreraData of CARRERAS_DATA) {
    const profesCarrera = profesoresDb[carreraData.codigo];
    gruposDb[carreraData.codigo] = {};
    let profIndex = 0;

    for (let sem = 1; sem <= 8; sem++) {
      const materiasSem = materiasDb[carreraData.codigo][sem];
      if (!materiasSem) continue;

      const gruposToInsert = materiasSem.map(mat => {
        const prof = profesCarrera[profIndex % profesCarrera.length];
        profIndex++;
        return {
          nombre: `${carreraData.codigo}-S${sem}-${mat.codigo.split('-').pop()}`,
          materia_id: mat.id,
          profesor_id: prof.id,
          semestre: sem.toString(),
          periodo: sem <= 1 ? '2025-2' : sem <= 3 ? '2026-1' : sem <= 5 ? '2026-1' : sem <= 7 ? '2026-1' : '2026-2'
        };
      });

      const inserted = await insertBatch('grupos', gruposToInsert);
      gruposDb[carreraData.codigo][sem] = inserted;
      totalGrupos += inserted.length;
    }
  }
  console.log(`   ✅ ${totalGrupos} grupos creados.\n`);

  // ─────────────────────────────────────────────────────
  // 9. ALUMNOS + ASIGNACIONES + CALIFICACIONES + BIENESTAR
  // ─────────────────────────────────────────────────────
  console.log('9️⃣  Creando alumnos con datos completos...');
  console.log('   (Esto puede tardar unos minutos...)\n');

  let totalAlumnos = 0;
  let totalCalifs = 0;
  let totalAsist = 0;
  let totalBienestar = 0;
  let totalAlertas = 0;
  let totalPredicciones = 0;
  let matriculaCounter = 20260001;

  // Calcular distribución de riesgo global
  const totalEstudiantes = CARRERAS_DATA.length * SEMESTRES_ACTIVOS.reduce((s, sa) => s + sa.alumnos, 0);
  // Distribución: 80% nulo, 13% probable, 7% riesgo
  
  const psicologoId = usersDb['psicologo']?.id;

  for (const carreraData of CARRERAS_DATA) {
    const carreraDb = carrerasDb.find(c => c.codigo === carreraData.codigo);
    if (!carreraDb) continue;
    const perfil = CARRERA_PERFILES[carreraData.codigo];
    const tutoresCarrera = tutoresDb[carreraData.codigo];

    console.log(`   📚 Carrera: ${carreraData.nombre}`);

    for (const semActivo of SEMESTRES_ACTIVOS) {
      const { semestre: semAct, alumnos: cantAlumnos } = semActivo;
      const gruposActuales = gruposDb[carreraData.codigo][semAct];
      if (!gruposActuales) continue;

      // Determinar cuántos de cada perfil de riesgo en este grupo
      const cantRiesgo = Math.round(cantAlumnos * 0.07);
      const cantProbable = Math.round(cantAlumnos * 0.13);
      const cantNulo = cantAlumnos - cantRiesgo - cantProbable;

      // Crear array de perfiles
      const perfiles = [
        ...Array(cantNulo).fill('nulo'),
        ...Array(cantProbable).fill('probable'),
        ...Array(cantRiesgo).fill('riesgo'),
      ];
      // Shuffle
      for (let i = perfiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [perfiles[i], perfiles[j]] = [perfiles[j], perfiles[i]];
      }

      console.log(`      Semestre ${semAct}: ${cantAlumnos} alumnos (${cantNulo} nulo, ${cantProbable} probable, ${cantRiesgo} riesgo)`);

      const alumnoGrupoInserts = [];
      const calificacionesInserts = [];
      const asistenciasInserts = [];
      const bienestarInserts = [];
      const prediccionesInserts = [];
      const alertasInserts = [];

      for (let a = 0; a < cantAlumnos; a++) {
        const perfilRiesgo = perfiles[a];
        const nombre = generarNombre();
        const email = generarEmail(nombre);
        const matricula = (matriculaCounter++).toString();
        const tutor = tutoresCarrera[a % tutoresCarrera.length];

        // ── Generar promedio coherente con perfil ──
        let promedioGeneral;
        if (perfilRiesgo === 'nulo') promedioGeneral = parseFloat(rand(8.0, 10.0).toFixed(2));
        else if (perfilRiesgo === 'probable') promedioGeneral = parseFloat(rand(7.0, 8.5).toFixed(2));
        else promedioGeneral = parseFloat(rand(5.0, 7.2).toFixed(2));

        // Crear usuario
        const { data: newUser } = await supabase.from('usuarios').insert([{
          nombre, email, rol_id: getRolId('alumno'), activo: true
        }]).select().single();

        if (!newUser) continue;

        // Crear alumno
        const { data: newAlumno } = await supabase.from('alumnos').insert([{
          usuario_id: newUser.id,
          matricula,
          carrera_id: carreraDb.id,
          semestre_actual: semAct,
          promedio_general: promedioGeneral,
          tutor_id: tutor.id
        }]).select().single();

        if (!newAlumno) continue;
        totalAlumnos++;

        // ── Asignar a grupos del semestre ACTUAL ──
        for (const grupo of gruposActuales) {
          alumnoGrupoInserts.push({ alumno_id: newAlumno.id, grupo_id: grupo.id });
        }

        // ── Calificaciones del semestre actual (parciales 1 y 2) ──
        for (const grupo of gruposActuales) {
          for (let parcial = 1; parcial <= 2; parcial++) {
            let calif;
            if (perfilRiesgo === 'nulo') calif = clamp(rand(7.5, 10.0), 5.0, 10.0);
            else if (perfilRiesgo === 'probable') calif = clamp(rand(6.0, 9.0), 5.0, 10.0);
            else calif = clamp(rand(3.5, 7.5), 3.0, 10.0);
            
            calificacionesInserts.push({
              alumno_id: newAlumno.id,
              grupo_id: grupo.id,
              parcial,
              calificacion: parseFloat(calif.toFixed(2))
            });
          }
        }

        // ── Calificaciones HISTÓRICAS (semestres anteriores) ──
        for (let semPasado = 1; semPasado < semAct; semPasado++) {
          const gruposPasados = gruposDb[carreraData.codigo][semPasado];
          if (!gruposPasados) continue;

          // Asignar a grupos históricos
          for (const grupo of gruposPasados) {
            alumnoGrupoInserts.push({ alumno_id: newAlumno.id, grupo_id: grupo.id });
          }

          // 3 parciales por materia histórica
          for (const grupo of gruposPasados) {
            for (let parcial = 1; parcial <= 3; parcial++) {
              let calif;
              if (perfilRiesgo === 'nulo') calif = clamp(rand(7.0, 10.0), 6.0, 10.0);
              else if (perfilRiesgo === 'probable') {
                calif = clamp(rand(6.0, 9.0), 5.0, 10.0);
                // Ocasionalmente reprobar
                if (Math.random() < 0.15) calif = clamp(rand(4.0, 6.9), 3.0, 6.9);
              } else {
                calif = clamp(rand(4.0, 8.0), 3.0, 10.0);
                // Mayor probabilidad de reprobar
                if (Math.random() < 0.35) calif = clamp(rand(3.0, 6.9), 3.0, 6.9);
              }

              calificacionesInserts.push({
                alumno_id: newAlumno.id,
                grupo_id: grupo.id,
                parcial,
                calificacion: parseFloat(calif.toFixed(2))
              });
            }
          }
        }

        // ── Asistencias del semestre actual (últimos 20 días hábiles) ──
        const hoy = new Date();
        for (const grupo of gruposActuales) {
          for (let d = 1; d <= 25; d++) {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() - d);
            if (fecha.getDay() === 0 || fecha.getDay() === 6) continue;
            const fechaStr = fecha.toISOString().split('T')[0];

            let presente;
            if (perfilRiesgo === 'nulo') presente = Math.random() > 0.05; // 95%
            else if (perfilRiesgo === 'probable') presente = Math.random() > 0.18; // 82%
            else presente = Math.random() > 0.35; // 65%

            const justificada = !presente && Math.random() > 0.6;

            asistenciasInserts.push({
              alumno_id: newAlumno.id,
              grupo_id: grupo.id,
              fecha: fechaStr,
              presente,
              justificada
            });
          }
        }

        // ── Formularios de bienestar (2 por alumno) ──
        for (let f = 0; f < 2; f++) {
          const fechaApp = new Date();
          fechaApp.setDate(fechaApp.getDate() - (f * 35 + randInt(1, 10)));

          let nivel_estres, horas_sueno, situacion_economica, apoyo_familiar, motivacion_academica, practica_deporte, observaciones;

          if (perfilRiesgo === 'nulo') {
            nivel_estres = clamp(randInt(1, 5) + Math.round(perfil.stress_bias * 0.3), 1, 10);
            horas_sueno = parseFloat(clamp(rand(6.5, 9.0) + perfil.sleep_bias * 0.2, 4.0, 10.0).toFixed(1));
            situacion_economica = randInt(3, 5);
            apoyo_familiar = randInt(4, 5);
            motivacion_academica = randInt(4, 5);
            practica_deporte = Math.random() > 0.3;
            observaciones = pick([
              'Rendimiento estable, sin problemas reportados.',
              'Buen desempeño general, participa activamente.',
              'Alumno comprometido con sus estudios.',
              'Sin observaciones relevantes.',
              'Muestra interés y disciplina constante.'
            ]);
          } else if (perfilRiesgo === 'probable') {
            nivel_estres = clamp(randInt(5, 8) + Math.round(perfil.stress_bias * 0.5), 1, 10);
            horas_sueno = parseFloat(clamp(rand(5.0, 7.0) + perfil.sleep_bias * 0.5, 3.5, 9.0).toFixed(1));
            situacion_economica = randInt(2, 4);
            apoyo_familiar = randInt(2, 4);
            motivacion_academica = randInt(2, 4);
            practica_deporte = Math.random() > 0.55;
            observaciones = pick([
              'Presenta cierto nivel de cansancio en clases.',
              'Reporta dificultades económicas moderadas.',
              'Ha mostrado desmotivación en las últimas semanas.',
              'Falta de concentración en algunas materias.',
              'Situación familiar inestable, requiere seguimiento.'
            ]);
          } else {
            nivel_estres = clamp(randInt(7, 10) + Math.round(perfil.stress_bias), 1, 10);
            horas_sueno = parseFloat(clamp(rand(3.5, 5.5) + perfil.sleep_bias, 2.5, 7.0).toFixed(1));
            situacion_economica = randInt(1, 2);
            apoyo_familiar = randInt(1, 3);
            motivacion_academica = randInt(1, 3);
            practica_deporte = Math.random() > 0.8;
            observaciones = pick([
              'Presenta cansancio severo y dificultad económica familiar. Riesgo de abandono.',
              'Ansiedad elevada, problemas para dormir. Ha faltado frecuentemente.',
              'Conflictos familiares graves. Bajo rendimiento generalizado.',
              'Desmotivación total, ha considerado abandonar la carrera.',
              'Problemas de salud mental detectados. Se recomienda intervención urgente.',
              'Situación económica crítica. Trabaja de noche y no rinde en clases.',
              'Aislamiento social, no participa en actividades. Posible depresión.'
            ]);
          }

          bienestarInserts.push({
            alumno_id: newAlumno.id,
            fecha_aplicacion: fechaApp.toISOString(),
            nivel_estres,
            horas_sueno,
            practica_deporte,
            frecuencia_deporte: practica_deporte ? pick(['1x/semana','2x/semana','3x/semana','diario']) : 'nunca',
            situacion_economica,
            apoyo_familiar,
            motivacion_academica,
            observaciones
          });
        }

        // ── Predicciones de riesgo y alertas (solo para probable y riesgo) ──
        if (perfilRiesgo === 'probable' || perfilRiesgo === 'riesgo') {
          const nivel = perfilRiesgo === 'riesgo' ? pick(['alto', 'critico']) : 'medio';
          const porcentaje = perfilRiesgo === 'riesgo' 
            ? parseFloat(rand(65, 95).toFixed(2))
            : parseFloat(rand(35, 64).toFixed(2));

          const factores = perfilRiesgo === 'riesgo' ? {
            promedio_bajo: { peso: 0.3, valor: promedioGeneral, descripcion: `Promedio general de ${promedioGeneral}` },
            estres_alto: { peso: 0.25, valor: 'alto', descripcion: 'Nivel de estrés elevado detectado en cuestionario' },
            inasistencias: { peso: 0.2, valor: 'frecuentes', descripcion: 'Patrón de inasistencias frecuentes' },
            situacion_economica: { peso: 0.15, valor: 'precaria', descripcion: 'Situación económica reportada como difícil' },
            motivacion: { peso: 0.1, valor: 'baja', descripcion: 'Baja motivación académica' }
          } : {
            promedio_moderado: { peso: 0.35, valor: promedioGeneral, descripcion: `Promedio general de ${promedioGeneral}` },
            estres_moderado: { peso: 0.3, valor: 'moderado', descripcion: 'Estrés moderado en cuestionario' },
            asistencia_irregular: { peso: 0.2, valor: 'irregular', descripcion: 'Algunas inasistencias sin justificar' },
            apoyo_limitado: { peso: 0.15, valor: 'limitado', descripcion: 'Apoyo familiar limitado' }
          };

          const recomendaciones = perfilRiesgo === 'riesgo' ? [
            'Canalización inmediata con el área de psicología.',
            'Asignar tutoría intensiva con seguimiento semanal.',
            'Evaluar opciones de apoyo económico institucional (becas).',
            'Realizar entrevista con el tutor para plan de acción personalizado.',
            'Considerar carga académica reducida para el próximo semestre.'
          ] : [
            'Programar sesión de seguimiento con el tutor asignado.',
            'Recomendar técnicas de manejo de estrés.',
            'Monitorear asistencia durante las próximas 3 semanas.',
            'Evaluar disponibilidad para actividades extracurriculares.'
          ];

          prediccionesInserts.push({
            alumno_id: newAlumno.id,
            nivel_riesgo: nivel,
            porcentaje_riesgo: porcentaje,
            factores_json: factores,
            recomendaciones_json: recomendaciones,
            modelo_usado: 'gemini-2.5-pro',
            prompt_usado: 'Análisis automático de riesgo basado en datos académicos y de bienestar.',
            respuesta_raw: JSON.stringify({ nivel, porcentaje, factores, recomendaciones })
          });

          // Alerta activa
          const tipoAlerta = perfilRiesgo === 'riesgo' ? 'mixta' : pick(['academica', 'bienestar', 'asistencia']);
          const descripcionAlerta = perfilRiesgo === 'riesgo'
            ? `⚠️ ALERTA CRÍTICA: ${nombre} presenta riesgo ${nivel.toUpperCase()} (${porcentaje}%). Promedio: ${promedioGeneral}. Factores: bajo rendimiento, estrés elevado, inasistencias frecuentes. Se requiere intervención inmediata.`
            : `Alerta preventiva: ${nombre} muestra indicadores de probable riesgo (${porcentaje}%). Se recomienda seguimiento.`;

          alertasInserts.push({
            alumno_id: newAlumno.id,
            tipo: tipoAlerta,
            descripcion: descripcionAlerta,
            estado: perfilRiesgo === 'riesgo' ? 'activa' : pick(['activa', 'atendida']),
            asignada_a: perfilRiesgo === 'riesgo' ? psicologoId : tutor.id,
            atendida_at: perfilRiesgo !== 'riesgo' && Math.random() > 0.5 ? new Date().toISOString() : null
          });
        }
      }

      // ── INSERTAR TODO EN LOTES ──
      console.log(`         Insertando datos de semestre ${semAct}...`);
      
      // alumno_grupo
      if (alumnoGrupoInserts.length > 0) {
        await insertBatch('alumno_grupo', alumnoGrupoInserts, 300);
      }

      // calificaciones
      if (calificacionesInserts.length > 0) {
        await insertBatch('calificaciones', calificacionesInserts, 300);
        totalCalifs += calificacionesInserts.length;
      }

      // asistencias
      if (asistenciasInserts.length > 0) {
        await insertBatch('asistencias', asistenciasInserts, 300);
        totalAsist += asistenciasInserts.length;
      }

      // bienestar
      if (bienestarInserts.length > 0) {
        await insertBatch('formularios_bienestar', bienestarInserts, 300);
        totalBienestar += bienestarInserts.length;
      }

      // predicciones
      if (prediccionesInserts.length > 0) {
        const predsInserted = await insertBatch('predicciones_riesgo', prediccionesInserts, 200);
        totalPredicciones += predsInserted.length;

        // Asociar predicciones a alertas
        for (let i = 0; i < alertasInserts.length; i++) {
          if (predsInserted[i]) {
            alertasInserts[i].prediccion_id = predsInserted[i].id;
          }
        }
      }

      // alertas
      if (alertasInserts.length > 0) {
        await insertBatch('alertas', alertasInserts, 200);
        totalAlertas += alertasInserts.length;
      }

      console.log(`         ✅ Semestre ${semAct} completo.`);
    }

    console.log(`   ✅ ${carreraData.nombre} lista.\n`);
  }

  // ─────────────────────────────────────────────────────
  // 10. CREAR USUARIO DEMO ALUMNO CON AUTH
  // ─────────────────────────────────────────────────────
  console.log('🔟 Creando usuario alumno demo con autenticación...');
  
  // Buscar un alumno existente para darle auth
  const { data: primerAlumno } = await supabase
    .from('alumnos')
    .select('*, usuarios(id, email, nombre)')
    .limit(1)
    .single();

  if (primerAlumno) {
    try {
      const { data: authAlum } = await supabase.auth.admin.createUser({
        email: primerAlumno.usuarios.email, password: SYSTEM_PASSWORD, email_confirm: true
      });
      if (authAlum?.user) {
        await supabase.from('usuarios').update({ auth_id: authAlum.user.id }).eq('id', primerAlumno.usuarios.id);
        console.log(`   ✅ Alumno demo: ${primerAlumno.usuarios.email}`);
      }
    } catch (e) { console.log(`   ⚠️  ${e.message}`); }
  }

  // ─────────────────────────────────────────────────────
  // RESUMEN FINAL
  // ─────────────────────────────────────────────────────
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║           SIEMBRA COMPLETADA                ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║  Roles:          ${rolesInserted.length.toString().padStart(6)}`);
  console.log(`║  Carreras:       ${carrerasDb.length.toString().padStart(6)}`);
  console.log(`║  Materias:       ${totalMaterias.toString().padStart(6)}`);
  console.log(`║  Profesores:     ${totalProfes.toString().padStart(6)}`);
  console.log(`║  Tutores:        ${totalTutores.toString().padStart(6)}`);
  console.log(`║  Grupos:         ${totalGrupos.toString().padStart(6)}`);
  console.log(`║  Alumnos:        ${totalAlumnos.toString().padStart(6)}`);
  console.log(`║  Calificaciones: ${totalCalifs.toString().padStart(6)}`);
  console.log(`║  Asistencias:    ${totalAsist.toString().padStart(6)}`);
  console.log(`║  Bienestar:      ${totalBienestar.toString().padStart(6)}`);
  console.log(`║  Predicciones:   ${totalPredicciones.toString().padStart(6)}`);
  console.log(`║  Alertas:        ${totalAlertas.toString().padStart(6)}`);
  console.log(`║  Tiempo:         ${elapsed.padStart(5)}s`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\n🔑 Credenciales de acceso (contraseña para todos: Sibia2026!):');
  console.log('   Admin:      ricardo.valdes@gmail.com');
  console.log('   Director:   fernando.gutierrez@gmail.com');
  console.log('   Psicólogo:  claudia.ortiz@hotmail.com');
  console.log('   Jefes de carrera: lucia.perez@gmail.com, hector.solis@hotmail.com, etc.');
  console.log('   (Tutores y profesores tienen auth también)');
};

// Ejecutar automáticamente si el archivo se llama directamente (npm run seed)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  sembrarBaseDatos()
    .then(() => {
      console.log('\n✅ Siembra terminada correctamente.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error fatal:', err);
      process.exit(1);
    });
}
