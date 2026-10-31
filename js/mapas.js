'use strict';
/* Mapas visuales. Contenido verificado contra el Decreto Ley 262 de 2000 vigente (con las
   modificaciones del Decreto Ley 1851 de 2021) y la ficha de la Convocatoria 67-2026.
   Usa h(), pintar(), Voz y S definidos en app.js. */

const ORGANIGRAMA = {
  nota: 'Artículo 2 del Decreto Ley 262 de 2000, modificado por el Decreto Ley 1851 de 2021.',
  niveles: [
    { nombre: 'Nivel central', grupos: [
      { nombre: 'Despacho del Procurador General', hijos: [
        'Procuraduría Auxiliar para Asuntos Constitucionales', 'Procuraduría Auxiliar para Asuntos Disciplinarios',
        'Dirección Nacional de Investigaciones Especiales', 'Oficina de Tecnología, Innovación y Transformación Digital',
        'Oficina de Planeación', '★ Oficina de Selección y Carrera', 'Oficina de Control Interno', 'Oficina de Prensa', 'Oficina Jurídica'] },
      { nombre: 'Despacho del Viceprocurador General', hijos: [
        'Dirección de Apoyo Estratégico, Análisis de Datos e Información (con la División de Registro de Sanciones y Causas de Inhabilidad)',
        'División de Relacionamiento con el Ciudadano', 'División de Documentación', 'División de Seguridad'] },
      { nombre: 'Salas Disciplinarias', hijos: ['Sala Disciplinaria de Instrucción', 'Sala Disciplinaria Ordinaria de Juzgamiento',
        'Sala Disciplinaria de Juzgamiento de Servidores Públicos de Elección Popular'] },
      { nombre: 'Procuradurías Delegadas', hijos: ['Preventivas y de Control de Gestión', 'Disciplinarias de Instrucción',
        'Disciplinarias de Juzgamiento', 'Con funciones mixtas', 'De Intervención (con las Procuradurías Judiciales I y II)'] },
      { nombre: 'Instituto de Estudios del Ministerio Público', hijos: ['Transformado en Universidad del Ministerio Público por la Ley 2553 de 2025'] },
      { nombre: 'Secretaría General', hijos: ['División de Gestión Humana', 'División Administrativa', 'División Financiera'] },
      { nombre: 'Veeduría', hijos: [] },
    ] },
    { nombre: 'Nivel territorial', grupos: [
      { nombre: 'Procuradurías Regionales', hijos: ['de Instrucción', 'de Juzgamiento'] },
      { nombre: 'Procuradurías Distritales', hijos: ['de Instrucción', 'de Juzgamiento'] },
      { nombre: 'Procuradurías Provinciales', hijos: ['de Instrucción', 'de Juzgamiento'] },
    ] },
  ],
  claves: [
    'Tu oficina, Selección y Carrera, depende del Despacho del Procurador General, no del Viceprocurador ni de la Secretaría General.',
    'La División de Gestión Humana es de la Secretaría General; la División de Documentación, del Despacho del Viceprocurador.',
    'Las dependencias de un mismo despacho son pares: ninguna tiene autoridad jerárquica sobre las otras.',
    'En el nivel territorial, cada tipo de procuraduría se divide en instrucción y juzgamiento desde el Decreto Ley 1851 de 2021.',
  ],
};

const CONCURSO = [
  { paso: 'Convocatoria', quien: 'Selección y Carrera elabora el proyecto · el Procurador la suscribe',
    puntos: ['La Oficina de Selección y Carrera diseña y elabora el proyecto; el Procurador General o su delegado la suscribe (art. 196; art. 7, núm. 40, lit. d).',
      'Copia a la Comisión de Carrera, que puede hacer observaciones (art. 12, núm. 4; art. 240, núm. 4).',
      'Se divulga con al menos 15 días hábiles de antelación al inicio de las inscripciones (art. 197).',
      'Es la norma reguladora del concurso: no se cambian sus bases una vez iniciadas las inscripciones, salvo sitio, fecha u hora (art. 195).'],
    conv: 'Convocatoria 67: Resolución 076 de 2026; inscripciones del 7 al 18 de septiembre de 2026.' },
  { paso: 'Inscripción', quien: 'Aspirantes · Selección y Carrera',
    puntos: ['Si en un concurso abierto se inscriben menos de 5 aspirantes, el plazo se amplía por un término igual (art. 201).',
      'Sin al menos 3 aspirantes admitidos no hay proceso de selección (art. 201).'] },
  { paso: 'Lista de admitidos y no admitidos', quien: 'Jefe de Selección y Carrera · apelación ante la Comisión de Carrera',
    puntos: ['La Oficina verifica los requisitos mínimos y su jefe firma la lista, con los motivos de no admisión (art. 200).',
      'Reclamación: dentro de los 2 días hábiles siguientes a la publicación, ante el jefe de la Oficina, que resuelve en 5 días hábiles (art. 202).',
      'Apelación ante la Comisión de Carrera, a más tardar el día hábil siguiente al fin de la publicación de la decisión (art. 202).',
      'No se tienen en cuenta documentos que no se aportaron en la inscripción (art. 202).'] },
  { paso: 'Pruebas', quien: 'Selección y Carrera o un tercero contratado · jurado',
    puntos: ['Conocimientos: eliminatoria, mínimo 65/100, pesa 70 %. Competencias comportamentales: clasificatoria, 20 %. Análisis de antecedentes: clasificatoria, 10 % (Convocatoria 67).',
      'Las pruebas pueden contratarse con terceros, pero la custodia de los bancos de preguntas es de la Oficina (art. 12, núms. 6 y 7; art. 206).',
      'Reclamaciones contra resultados: dentro de 2 días hábiles (art. 212). Errores aritméticos: jefe de la Oficina, única instancia, 5 días hábiles. Puntaje de preguntas abiertas: el jurado, única instancia. Estructura y contenido de las pruebas: el jurado en primera instancia y la Comisión de Carrera en segunda.',
      'Contra los resultados de la entrevista no proceden reclamaciones (art. 212).'] },
  { paso: 'Lista de elegibles', quien: 'Resolución del Procurador General',
    puntos: ['Entra quien obtenga al menos el 70 % del puntaje total máximo (art. 216).',
      'Orden estricto de mérito; vigencia de 2 años desde su publicación (art. 216).',
      'El nombramiento se hace dentro de los 20 días hábiles siguientes a su publicación (art. 217).'] },
  { paso: 'Nombramiento y posesión', quien: 'Gestión Humana verifica · Secretaría General posesiona',
    puntos: ['El nombramiento se comunica en 8 días y se acepta en 8 días (art. 84).',
      'Antes de la posesión, Gestión Humana verifica requisitos y emite concepto escrito (art. 84; art. 63, núm. 7).',
      'Posesión dentro de 15 días desde la aceptación, prorrogable una sola vez hasta 30 días por justa causa (art. 84).',
      'Al nivel Asesor lo posesiona la Secretaría General (art. 62, núm. 5).'] },
  { paso: 'Período de prueba', quien: 'Se evalúa el desempeño al terminar',
    puntos: ['Dura 4 meses; al final se evalúa el desempeño (art. 218).',
      'Si las funciones se interrumpen más de 10 días calendario continuos, se prorroga (art. 219).',
      'Durante el período no se cambian las funciones convocadas ni se concede licencia no remunerada, salvo fuerza mayor (art. 219).'] },
  { paso: 'Inscripción en carrera', quien: 'Selección y Carrera (Registro Único)',
    puntos: ['Si aprueba, se inscribe en el Registro Único de Inscripción en Carrera, que lleva la Oficina de Selección y Carrera (art. 218; art. 12, núm. 11).',
      'Si no aprueba, el Procurador declara la insubsistencia; solo procede reposición dentro de los 3 días siguientes (art. 218).'] },
];
const CONCURSO_EXTRA = 'En cualquier etapa, cualquier persona puede pedir a la Comisión de Carrera, dentro de los 3 días hábiles siguientes al hecho, que investigue una irregularidad; la Comisión investiga en máximo 10 días (art. 214). El concurso se declara desierto si hay menos de 5 aspirantes con requisitos (salvo necesidades del servicio) o si nadie supera la prueba eliminatoria (art. 215).';

const QUIEN = [
  { actor: 'Procurador General', norma: 'art. 7, núm. 40', items: [
    'Ejerce la suprema dirección y administración del sistema de carrera.',
    'Define las políticas de las pruebas y las condiciones de las convocatorias, y las suscribe.',
    'Declara desiertos los concursos (la Oficina proyecta el acto).',
    'A solicitud de la Comisión de Carrera, excluye de la lista de elegibles o revoca nombramientos irregulares.',
    'Expide la lista de elegibles (art. 216) y el manual de funciones (art. 7, núm. 36).'] },
  { actor: 'Oficina de Selección y Carrera (tu oficina)', norma: 'art. 12', destaca: true, items: [
    'Asesora al Procurador en las políticas de carrera (núm. 1).',
    'Ejecuta los procesos de selección y elabora los proyectos de convocatoria (núms. 2 y 3).',
    'Elabora y aplica las pruebas, salvo que se contraten, y custodia los bancos de preguntas (núms. 6 y 7).',
    'Resuelve reclamaciones: errores aritméticos en única instancia y no admitidos en primera instancia (núms. 9 y 10).',
    'Lleva el Registro Único de Inscripción en Carrera (núm. 11).',
    'Dirige la elección de representantes ante la Comisión de Carrera y actúa como su secretaria (núms. 12 y 16).',
    'Vela por la calificación de servicios y efectúa los promedios de la calificación definitiva (núms. 13 y 14).',
    'Colabora con Planeación en el manual de funciones (núm. 17).'] },
  { actor: 'Comisión de Carrera', norma: 'art. 240', items: [
    'Vigila el cumplimiento de las normas de carrera y asesora al Procurador.',
    'Recibe copia de las convocatorias y hace observaciones.',
    'Resuelve en segunda instancia las reclamaciones de los no admitidos (art. 202).',
    'Investiga irregularidades de los procesos de selección (art. 214).',
    'Solicita al Procurador modificar la lista de elegibles cuando se comprueban hechos como suplantación o documentos falsos.'] },
  { actor: 'División de Gestión Humana', norma: 'art. 63', items: [
    'Verifica los requisitos de los nombrados antes de la posesión (núm. 7; art. 84).',
    'Posesiona a los niveles profesional, técnico, administrativo y operativo del nivel central (núm. 8).',
    'Conserva las hojas de vida y expide certificaciones laborales (núm. 3).',
    'Desarrolla la elección del representante ante la Comisión de Personal (núm. 13) y apoya logísticamente a la Comisión de Carrera (núm. 12).'] },
  { actor: 'Secretaría General', norma: 'art. 62', items: [
    'Posesiona a los niveles directivo, asesor y ejecutivo, salvo a los altos funcionarios que posesiona el Procurador (núm. 5).',
    'Expide y autentica copias de documentos (núm. 2) y reconoce viáticos (núm. 7).'] },
  { actor: 'Comisión de Personal', norma: 'arts. 70 y 71', items: [
    'Emite concepto previo en los traslados definitivos de sede de servidores de carrera.',
    'Prepara los planes de estímulos para la firma del Procurador.'] },
  { actor: 'Oficina de Planeación', norma: 'art. 11, núm. 7', items: ['Elabora los manuales de funciones y requisitos, para la aprobación del Procurador.'] },
  { actor: 'Jurado', norma: 'art. 7, núm. 40, lit. c; art. 212', items: [
    'Designado por el Procurador: elabora y califica las pruebas de pregunta abierta y la entrevista.',
    'Resuelve las reclamaciones sobre esos puntajes.'] },
];

const COMISIONES = [
  { nombre: 'Comisión de Carrera', norma: 'arts. 239 y 240', filas: [
    ['Integrantes', 'El Procurador o su delegado (la preside), el Director del Instituto de Estudios*, 1 representante de los procuradores delegados y 2 representantes de los empleados inscritos en carrera.'],
    ['Secretario', 'El jefe de la Oficina de Selección y Carrera, con voz pero sin voto.'],
    ['Período', '2 años; los representantes pueden reelegirse una sola vez. Cada representante tiene suplente.'],
    ['Elección', 'La dirige, coordina y vigila la Oficina de Selección y Carrera (art. 12, núm. 12).'],
    ['Funciones clave', 'Vigilar la carrera, segunda instancia de reclamaciones de no admitidos, investigar irregularidades, pedir modificar la lista de elegibles.'],
  ] },
  { nombre: 'Comisión de Personal', norma: 'arts. 70 y 71', filas: [
    ['Integrantes', '2 representantes del Procurador General y 1 representante de los servidores.'],
    ['Secretario', 'El jefe de la División de Gestión Humana, con voz pero sin voto.'],
    ['Período', '2 años.'],
    ['Elección', 'La desarrolla, coordina y vigila la División de Gestión Humana (art. 63, núm. 13).'],
    ['Funciones clave', 'Concepto previo en traslados definitivos de sede, planes de estímulos, apoyo a la capacitación.'],
  ] },
];
const NOTA_COMISION = '* El artículo 239 conserva la mención al Director del Instituto de Estudios del Ministerio Público, transformado en Universidad del Ministerio Público por la Ley 2553 de 2025.';

const PRUEBA = [
  { nombre: 'Conocimientos', peso: 70, caracter: 'Eliminatoria · mínimo 65/100' },
  { nombre: 'Competencias comportamentales', peso: 20, caracter: 'Clasificatoria' },
  { nombre: 'Análisis de antecedentes', peso: 10, caracter: 'Clasificatoria' },
];

/* ---------- Ideas clave por tema (data/ideas.json) ---------- */
let IDEAS = null;
async function cargarIdeas() {
  if (!IDEAS) IDEAS = await (await fetch('data/ideas.json')).json();
  return IDEAS;
}
function audioIdeas(sec) {
  const n = sec.tema.split('.')[0];
  return [{ titulo: sec.tema, partes: [{ t: `Ideas clave. ${sec.tema}. ${sec.ideas.length} ideas.` }] }]
    .concat(sec.ideas.map((i, k) => ({ titulo: `Tema ${n} · idea ${k + 1} de ${sec.ideas.length}`, partes: [{ t: i.t + '.' }, { t: i.x }] })));
}
function listaIdeasAudio(contenedor) {
  cargarIdeas().then(secs => contenedor.replaceChildren(...secs.map(sec => h('button', { type: 'button', class: 'list-item', onclick: () => Voz.reproducir(audioIdeas(sec)) },
    h('span', {}, '▶'), h('div', { class: 'grow' }, h('div', { class: 't' }, sec.tema), h('div', { class: 's' }, `${sec.ideas.length} ideas · ${sec.parte.split('.')[0]}`))))))
    .catch(() => contenedor.replaceChildren(h('p', { class: 'muted small' }, 'No se pudieron cargar las ideas clave.')));
}
function mapaIdeas(volver) {
  pintar(volver, h('h1', {}, 'Ideas clave por tema'), h('p', { class: 'muted' }, 'Cargando…'));
  cargarIdeas().then(secs => {
    const nodos = [volver, h('h1', {}, 'Ideas clave por tema'),
      h('p', { class: 'muted small' }, 'Las reglas esenciales de cada eje de la Convocatoria 67, con su artículo. Toca un tema para abrirlo o escúchalo completo.')];
    let parte = '';
    for (const sec of secs) {
      if (sec.parte !== parte) { parte = sec.parte; nodos.push(h('h2', {}, parte)); }
      nodos.push(h('details', { class: 'card org' },
        h('summary', {}, sec.tema, h('span', { class: 'muted small' }, ` · ${sec.ideas.length}`)),
        h('button', { type: 'button', class: 'secondary full mt', onclick: () => Voz.reproducir(audioIdeas(sec)) }, '🔊 Escuchar este tema'),
        ...sec.ideas.map(i => h('p', { class: 'small' }, h('strong', {}, i.t + '. '), i.x))));
    }
    pintar(...nodos);
  }).catch(() => pintar(volver, h('p', {}, 'No se pudieron cargar las ideas clave. Revisa tu conexión.')));
}

/* ---------- Render ---------- */
function botonOir(items) {
  return h('button', { type: 'button', class: 'secondary full', onclick: () => Voz.reproducir(items) }, '🔊 Escuchar este mapa');
}

function vistaMapas(sub) {
  const menu = [
    ['ideas', '💡', 'Ideas clave por tema', '164 reglas esenciales por eje, para leer o escuchar'],
    ['organigrama', '🏛️', 'Estructura de la PGN', 'Dónde está tu oficina'],
    ['concurso', '🪜', 'El concurso paso a paso', 'De la convocatoria a la carrera'],
    ['quien', '🧩', '¿Quién hace qué?', 'Procurador, tu oficina, comisiones y divisiones'],
    ['comisiones', '⚖️', 'Las dos comisiones', 'Carrera frente a Personal'],
    ['prueba', '🎯', 'Tu prueba', 'Pesos y calculadora de puntaje'],
  ];
  if (!sub) {
    pintar(h('h1', {}, 'Mapas'),
      h('p', { class: 'muted' }, 'Esquemas para ver de un vistazo lo que más preguntan. Cada uno trae su versión en audio.'),
      h('div', { class: 'list' }, ...menu.map(([id, ico, t, s]) => h('a', { class: 'list-item', href: '#mapas/' + id },
        h('span', { style: 'font-size:22px' }, ico), h('div', { class: 'grow' }, h('div', { class: 't' }, t), h('div', { class: 's' }, s))))));
    return;
  }
  const volver = h('a', { class: 'btn ghost', href: '#mapas' }, '← Mapas');
  ({ ideas: mapaIdeas, organigrama: mapaOrganigrama, concurso: mapaConcurso, quien: mapaQuien, comisiones: mapaComisiones, prueba: mapaPrueba }[sub] || (() => vistaMapas()))(volver);
}

function mapaOrganigrama(volver) {
  const nodos = [volver, h('h1', {}, 'Estructura de la PGN'), h('p', { class: 'muted small' }, ORGANIGRAMA.nota)];
  for (const nivel of ORGANIGRAMA.niveles) {
    nodos.push(h('h2', {}, nivel.nombre));
    for (const g of nivel.grupos) {
      const tuyo = g.hijos.some(x => x.startsWith('★'));
      nodos.push(h('details', { class: 'card org' + (tuyo ? ' accent' : ''), open: tuyo },
        h('summary', {}, g.nombre, g.hijos.length ? h('span', { class: 'muted small' }, ` · ${g.hijos.length}`) : null),
        g.hijos.length ? h('ul', { class: 'org-list' }, ...g.hijos.map(x => x.startsWith('★')
          ? h('li', { class: 'yo' }, x.slice(2), h('span', { class: 'pill ok' }, 'Tu oficina'))
          : h('li', {}, x))) : null));
    }
  }
  nodos.push(h('div', { class: 'card' }, h('h3', {}, 'Para recordar'), ...ORGANIGRAMA.claves.map(c => h('p', { class: 'small' }, '• ', c))));
  nodos.push(botonOir([{ titulo: 'Estructura de la PGN', partes: [
    { t: 'Estructura de la Procuraduría, según el artículo 2 del Decreto Ley 262, modificado por el Decreto Ley 1851 de 2021.' },
    ...ORGANIGRAMA.niveles.flatMap(n => [{ t: n.nombre + '.' }, ...n.grupos.map(g => ({ t: `${g.nombre}${g.hijos.length ? ': ' + g.hijos.map(x => x.replace('★ ', '')).join('; ') : ''}.` }))]),
    { t: 'Para recordar.' }, ...ORGANIGRAMA.claves.map(t => ({ t }))] }]));
  pintar(...nodos);
}

function mapaConcurso(volver) {
  const nodos = [volver, h('h1', {}, 'El concurso paso a paso'), h('p', { class: 'muted small' }, 'Etapas del artículo 194 del Decreto Ley 262 de 2000, con quién decide y en qué plazo.')];
  const tl = h('ol', { class: 'timeline' });
  CONCURSO.forEach((e, k) => tl.append(h('li', {},
    h('div', { class: 'tl-num' }, k + 1),
    h('div', { class: 'tl-body' },
      h('div', { class: 't' }, e.paso), h('div', { class: 'quien' }, '👤 ', e.quien),
      h('ul', {}, ...e.puntos.map(p => h('li', { class: 'small' }, p))),
      e.conv ? h('p', { class: 'idea small' }, e.conv) : null))));
  nodos.push(tl, h('div', { class: 'card accent' }, h('h3', {}, 'En cualquier momento'), h('p', { class: 'small' }, CONCURSO_EXTRA)));
  nodos.push(botonOir(CONCURSO.map((e, k) => ({ titulo: `Paso ${k + 1}: ${e.paso}`, partes: [{ t: `Paso ${k + 1}: ${e.paso}. Quién: ${e.quien}.` }, ...e.puntos.map(t => ({ t })), ...(e.conv ? [{ t: e.conv }] : [])] }))
    .concat([{ titulo: 'En cualquier momento', partes: [{ t: CONCURSO_EXTRA }] }])));
  pintar(...nodos);
}

function mapaQuien(volver) {
  const nodos = [volver, h('h1', {}, '¿Quién hace qué?'), h('p', { class: 'muted small' }, 'Las competencias que más se confunden en las preguntas sobre carrera.')];
  for (const a of QUIEN) nodos.push(h('div', { class: 'card' + (a.destaca ? ' accent' : '') },
    h('h3', {}, a.actor), h('p', { class: 'muted small' }, a.norma),
    h('ul', { class: 'org-list' }, ...a.items.map(x => h('li', {}, x)))));
  nodos.push(botonOir(QUIEN.map(a => ({ titulo: a.actor, partes: [{ t: `${a.actor}, ${a.norma}.` }, ...a.items.map(t => ({ t }))] }))));
  pintar(...nodos);
}

function mapaComisiones(volver) {
  const nodos = [volver, h('h1', {}, 'Las dos comisiones'), h('p', { class: 'muted small' }, 'Se parecen en el nombre, no en sus funciones. Fíjate sobre todo en quién es el secretario de cada una.')];
  const tabla = h('table', { class: 'cmp' },
    h('thead', {}, h('tr', {}, h('th', {}, ''), ...COMISIONES.map(c => h('th', {}, c.nombre, h('div', { class: 'muted small' }, c.norma))))),
    h('tbody', {}, ...COMISIONES[0].filas.map((f, i) => h('tr', {}, h('th', {}, f[0]), ...COMISIONES.map(c => h('td', {}, c.filas[i][1]))))));
  nodos.push(h('div', { class: 'card scroll-x' }, tabla), h('p', { class: 'small muted' }, NOTA_COMISION));
  nodos.push(botonOir(COMISIONES.map(c => ({ titulo: c.nombre, partes: [{ t: `${c.nombre}, ${c.norma}.` }, ...c.filas.map(f => ({ t: `${f[0]}: ${f[1].replace('*', '')}` }))] }))));
  pintar(...nodos);
}

function necesario(v) {
  const x = (70 - v[1] * 0.2 - v[2] * 0.1) / 0.7;
  return x > 100 ? 'Con esos puntajes en las pruebas clasificatorias, ni con 100 en conocimientos llegarías al 70 %.' : `Con tus otros puntajes, necesitarías al menos ${x.toFixed(1)} en conocimientos.`;
}

function mapaPrueba(volver) {
  const nodos = [volver, h('h1', {}, 'Tu prueba'), h('p', { class: 'muted small' }, 'Convocatoria 67-2026, numeral 8, y artículo 216 del Decreto Ley 262 de 2000.')];
  nodos.push(h('div', { class: 'card' }, h('div', { class: 'stack' }, ...PRUEBA.map(p => h('div', { class: 'stack-seg', style: `flex:${p.peso}` }, `${p.peso} %`))),
    ...PRUEBA.map(p => h('p', { class: 'small' }, h('strong', {}, `${p.nombre} (${p.peso} %): `), p.caracter)),
    h('p', { class: 'idea small mt' }, 'Dos umbrales distintos: 65 en conocimientos para seguir en el concurso, y 70 % del puntaje total ponderado para entrar a la lista de elegibles.')));
  const campos = PRUEBA.map(p => h('input', { type: 'number', min: '0', max: '100', step: '0.1', inputmode: 'decimal', placeholder: '0 a 100', 'aria-label': p.nombre }));
  const salida = h('div', { class: 'mt' });
  const calcular = () => {
    const v = campos.map(c => Math.max(0, Math.min(100, Number(c.value) || 0)));
    const total = PRUEBA.reduce((s, p, i) => s + v[i] * p.peso / 100, 0);
    const pasa = v[0] >= 65;
    salida.replaceChildren(
      h('div', { class: 'stat' }, h('div', { class: 'num' }, total.toFixed(1)), h('div', { class: 'lbl' }, 'puntaje total ponderado')),
      h('p', { class: 'mt' }, h('span', { class: 'pill ' + (pasa ? 'ok' : 'bad') }, pasa ? 'Superas la eliminatoria' : 'No superas la eliminatoria (mínimo 65)')),
      pasa ? h('p', {}, h('span', { class: 'pill ' + (total >= 70 ? 'ok' : 'bad') }, total >= 70 ? 'Entras a la lista de elegibles' : `Te faltan ${(70 - total).toFixed(1)} puntos para la lista de elegibles`)) : null,
      pasa && total < 70 ? h('p', { class: 'small muted' }, necesario(v)) : null);
  };
  campos.forEach(c => c.addEventListener('input', calcular));
  nodos.push(h('div', { class: 'card accent' }, h('h3', {}, 'Calculadora'),
    ...PRUEBA.map((p, i) => h('label', { class: 'field' }, `${p.nombre} (${p.peso} %)`, campos[i])), salida));
  nodos.push(botonOir([{ titulo: 'Tu prueba', partes: [
    { t: 'La prueba de conocimientos es eliminatoria, con mínimo de 65 sobre 100, y pesa el 70 por ciento.' },
    { t: 'La prueba de competencias comportamentales es clasificatoria y pesa el 20 por ciento. El análisis de antecedentes, también clasificatorio, pesa el 10 por ciento.' },
    { t: 'Para entrar a la lista de elegibles necesitas al menos el 70 por ciento del puntaje total ponderado. La lista sigue el orden de mérito y dura dos años.' }] }]));
  pintar(...nodos);
  calcular();
}
