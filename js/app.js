'use strict';

/* ======================= Datos y estado ======================= */
const STORE = 'mc67-v1';
const INTERVALOS = [0, 1, 3, 7, 14, 30]; // días por caja (1..5)
const MIN_APROBAR = 65;
const SEG_POR_PREGUNTA = 90;
const PESOS_SIMULACRO = { carrera: 25, estructura: 15, cpaca: 15, constitucion: 10, gestion: 10, cst: 10, talento: 7.5, psicometria: 7.5 };

let DATA = null;          // {temas, unidades, preguntas}
let Q = {};               // id -> pregunta
let UNIDAD = {};          // id -> unidad
let ORDEN = [];           // orden de unidades del plan
let S = null;             // estado persistido
let sesion = null;        // sesión de práctica en memoria

function estadoInicial() {
  return {
    v: 1,
    inicio: hoyStr(),
    examen: '',
    ajustes: { semana: 7, fds: 20, rate: 1, voz: '', pausa: 8 },
    q: {},        // id -> {box, due, ok, fail, last}
    dias: {},     // fecha -> {n, ok, audio}
    sims: [],     // historial de simulacros
    hoy: null,    // {fecha, ids, idx, res}
    sim: null,    // simulacro en curso
  };
}

function cargarEstado() {
  try {
    const raw = localStorage.getItem(STORE);
    S = raw ? Object.assign(estadoInicial(), JSON.parse(raw)) : estadoInicial();
    S.ajustes = Object.assign(estadoInicial().ajustes, S.ajustes || {});
  } catch (e) {
    S = estadoInicial();
  }
}
function guardar() { localStorage.setItem(STORE, JSON.stringify(S)); }

/* ======================= Utilidades ======================= */
const $ = (sel, el = document) => el.querySelector(sel);

function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v; // solo para contenido propio, nunca datos
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

function hoyStr(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fecha(str) { const [y, m, d] = str.split('-').map(Number); return new Date(y, m - 1, d); }
function sumarDias(str, n) { const d = fecha(str); d.setDate(d.getDate() + n); return hoyStr(d); }
function diasEntre(a, b) { return Math.round((fecha(b) - fecha(a)) / 86400000); }
function esFinDeSemana(str) { const d = fecha(str).getDay(); return d === 0 || d === 6; }
function esDomingo(str) { return fecha(str).getDay() === 0; }
function barajar(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fechaLarga(str) { const d = fecha(str); return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`; }
function primerasFrases(t, n = 2) { const m = (t || '').match(/[^.!?]+[.!?]+/g); return m ? m.slice(0, n).join(' ').trim() : (t || ''); }
function temaNombre(t) { return (DATA.temas && DATA.temas[t]) || (t === 'mixto' ? 'Simulacro' : t); }
function bar(p, cls = '') { return h('div', { class: 'progressbar ' + cls }, h('span', { style: `width:${Math.max(0, Math.min(100, p))}%` })); }

/* ======================= Repaso espaciado ======================= */
function registrar(id, correcta) {
  const hoy = hoyStr();
  const r = S.q[id] || { box: 0, ok: 0, fail: 0 };
  if (correcta) { r.ok++; r.box = r.box === 0 ? 2 : Math.min(5, r.box + 1); }
  else { r.fail++; r.box = 1; }
  r.due = sumarDias(hoy, correcta ? INTERVALOS[r.box] : 1);
  r.last = hoy;
  r.lastOk = correcta;
  S.q[id] = r;
  const d = S.dias[hoy] || { n: 0, ok: 0, audio: false };
  d.n++; if (correcta) d.ok++;
  S.dias[hoy] = d;
  guardar();
}
function pendientesRepaso() {
  const hoy = hoyStr();
  return Object.entries(S.q).filter(([id, r]) => Q[id] && r.due && r.due <= hoy)
    .sort((a, b) => a[1].due.localeCompare(b[1].due) || a[1].box - b[1].box).map(([id]) => id);
}

/* ======================= Plan ======================= */
function construirOrden() {
  const dias = DATA.unidades.filter(u => u.id.startsWith('D')).map(u => u.id);
  const gp = DATA.unidades.filter(u => u.id.startsWith('GP')).map(u => u.id);
  const orden = [];
  dias.forEach((d, i) => { orden.push(d); if (i % 2 === 1 && gp.length) orden.push(gp.shift()); });
  return orden.concat(gp);
}
function preguntasDeUnidad(uid) { return DATA.preguntas.filter(q => q.unidad === uid); }
function nuevasSiguientes(n, excluir = new Set()) {
  const out = [];
  for (const uid of ORDEN) {
    for (const q of preguntasDeUnidad(uid)) {
      if (!S.q[q.id] && !excluir.has(q.id)) { out.push(q.id); if (out.length >= n) return out; }
    }
  }
  return out;
}
function unidadActual() {
  for (const uid of ORDEN) if (preguntasDeUnidad(uid).some(q => !S.q[q.id])) return uid;
  return ORDEN[ORDEN.length - 1];
}
function cuotaDelDia(str = hoyStr()) { return esFinDeSemana(str) ? S.ajustes.fds : S.ajustes.semana; }

function setDeHoy() {
  const hoy = hoyStr();
  if (S.hoy && S.hoy.fecha === hoy) return S.hoy;
  const cuota = cuotaDelDia(hoy);
  const rep = pendientesRepaso().slice(0, Math.ceil(cuota / 2));
  let ids = rep.concat(nuevasSiguientes(cuota - rep.length, new Set(rep)));
  if (ids.length < cuota) ids = ids.concat(pendientesRepaso().filter(i => !ids.includes(i)).slice(0, cuota - ids.length));
  S.hoy = { fecha: hoy, ids, idx: 0, res: {}, rep: rep.length };
  guardar();
  return S.hoy;
}
function bancoPlan() { return DATA.preguntas.filter(q => q.unidad !== 'SIM01'); }
function estimacionFin() {
  const restantes = bancoPlan().filter(q => !S.q[q.id]).length;
  const porSemana = (5 * S.ajustes.semana + 2 * S.ajustes.fds) * 0.6; // ~40 % de la cuota se va en repasos
  const semanas = Math.ceil(restantes / Math.max(1, porSemana));
  return { restantes, semanas, fecha: sumarDias(hoyStr(), semanas * 7) };
}
function racha() {
  let n = 0, d = hoyStr();
  const activo = x => S.dias[x] && (S.dias[x].n > 0 || S.dias[x].audio);
  if (!activo(d)) d = sumarDias(d, -1);
  while (activo(d)) { n++; d = sumarDias(d, -1); }
  return n;
}

/* ======================= Voz (lectura en voz alta) ======================= */
const Voz = {
  items: [], i: 0, j: 0, token: 0, pausado: false, timer: null, onFin: null, wake: null,
  disponible: 'speechSynthesis' in window,
  voces() { return this.disponible ? speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang)) : []; },
  voz() {
    const vs = this.voces();
    return vs.find(v => v.name === S.ajustes.voz) || vs.find(v => /es-CO/i.test(v.lang)) || vs.find(v => /es-(US|MX|419)/i.test(v.lang)) || vs[0] || null;
  },
  trozos(texto) {
    const frases = (texto || '').replace(/\s+/g, ' ').match(/[^.!?;:]+[.!?;:]*/g) || [];
    const out = []; let cur = '';
    for (const f of frases) {
      if ((cur + f).length > 220 && cur) { out.push(cur.trim()); cur = ''; }
      cur += f;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  },
  // items: [{titulo, partes: [{t:'texto'} | {pausa: ms}]}]
  reproducir(items, onFin) {
    if (!this.disponible) { alert('Este navegador no permite lectura en voz alta. Prueba con Chrome.'); return; }
    this.detener(true);
    this.items = items.map(it => ({ titulo: it.titulo, segs: it.partes.flatMap(p => p.pausa ? [p] : this.trozos(p.t).map(t => ({ t }))) }));
    this.i = 0; this.j = 0; this.pausado = false; this.onFin = onFin || null;
    $('#player').hidden = false; document.body.classList.add('has-player');
    this.pedirWake();
    this.paso();
  },
  paso() {
    const tok = ++this.token;
    clearTimeout(this.timer);
    if (this.pausado) return;
    const it = this.items[this.i];
    if (!it) { const f = this.onFin; this.detener(); if (f) f(); return; }
    const seg = it.segs[this.j];
    if (!seg) { this.i++; this.j = 0; return this.paso(); }
    $('#player-text').textContent = (it.titulo ? it.titulo + ' · ' : '') + (seg.t || '…pausa para pensar…');
    $('#pl-toggle').textContent = '⏸';
    const sig = () => { if (tok !== this.token) return; this.j++; this.paso(); };
    if (seg.pausa) { this.timer = setTimeout(sig, seg.pausa); return; }
    const u = new SpeechSynthesisUtterance(seg.t);
    const v = this.voz(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'es-CO';
    u.rate = S.ajustes.rate;
    u.onend = sig; u.onerror = sig;
    speechSynthesis.speak(u);
  },
  alternar() {
    if (this.pausado) { this.pausado = false; this.paso(); }
    else { this.pausado = true; this.token++; speechSynthesis.cancel(); clearTimeout(this.timer); $('#pl-toggle').textContent = '▶'; }
  },
  saltar(d) { this.token++; speechSynthesis.cancel(); this.i = Math.max(0, this.i + d); this.j = 0; this.pausado = false; this.paso(); },
  detener(silencioso) {
    this.token++; clearTimeout(this.timer);
    if (this.disponible) speechSynthesis.cancel();
    this.items = []; this.onFin = null;
    if (!silencioso) { $('#player').hidden = true; document.body.classList.remove('has-player'); }
    if (this.wake) { this.wake.release().catch(() => {}); this.wake = null; }
  },
  async pedirWake() { try { if ('wakeLock' in navigator) this.wake = await navigator.wakeLock.request('screen'); } catch (e) { /* opcional */ } },
};

function textoOpciones(q) { return 'ABCD'.split('').map(l => ({ t: `Opción ${l}: ${q.opciones[l]}` })); }
function itemNarrado(q, n, total) {
  return {
    titulo: `Pregunta ${n} de ${total}`,
    partes: [{ t: `Pregunta ${n}. ${q.enunciado}` }, ...textoOpciones(q), { pausa: S.ajustes.pausa * 1000 },
      { t: `La respuesta correcta es la ${q.correcta}: ${q.opciones[q.correcta]}` },
      { t: q.idea ? `Idea clave: ${q.idea}` : primerasFrases(q.justificacion, 3) }],
  };
}
function resumenUnidad(uid) {
  const u = UNIDAD[uid];
  const qs = preguntasDeUnidad(uid);
  const items = [{ titulo: u.titulo, partes: [{ t: `Resumen de ${u.titulo}. ${qs.length} ideas clave. Tema: ${temaNombre(u.tema)}.` }] }];
  qs.forEach((q, k) => items.push({
    titulo: `Idea ${k + 1} de ${qs.length}`,
    partes: [{ t: `${k + 1}. ${q.eje}.` }, { t: q.idea || primerasFrases(q.justificacion, 2) }],
  }));
  return items;
}
function minutosResumen(uid) {
  const palabras = preguntasDeUnidad(uid).reduce((s, q) => s + ((q.eje + ' ' + (q.idea || primerasFrases(q.justificacion, 2))).split(/\s+/).length), 0);
  return Math.max(1, Math.round(palabras / (150 * S.ajustes.rate)));
}
function explicacionAudio(q, elegida) {
  const partes = [{ t: `La respuesta correcta es la ${q.correcta}: ${q.opciones[q.correcta]}` }, { t: q.justificacion }];
  if (elegida && elegida !== q.correcta && q.distractores[elegida]) partes.push({ t: `Tu opción, la ${elegida}: ${q.distractores[elegida]}` });
  if (q.fuente) partes.push({ t: `Fuente: ${q.fuente}` });
  return [{ titulo: 'Explicación', partes }];
}

/* ======================= Tarjeta de pregunta ======================= */
function tarjetaPregunta(q, { n, total, onRespuesta, onSiguiente, etiquetaSiguiente = 'Siguiente', yaRespondida = null }) {
  const u = UNIDAD[q.unidad];
  const card = h('div', { class: 'card' });
  card.append(
    h('div', { class: 'q-meta' }, h('span', { class: 'pill' }, `${n} / ${total}`), h('span', { class: 'pill' }, temaNombre(q.tema)), h('span', { class: 'pill' }, u ? u.titulo.split(':')[0] : q.unidad)),
    h('div', { class: 'q-stem' }, q.enunciado),
  );
  const opts = h('div', { class: 'opts' });
  const botones = {};
  for (const l of 'ABCD') {
    botones[l] = h('button', { type: 'button', class: 'opt', onclick: () => responder(l) }, h('span', { class: 'letter' }, l + '.'), h('span', {}, q.opciones[l]));
    opts.append(botones[l]);
  }
  card.append(opts);
  const fb = h('div', { class: 'feedback' });
  card.append(fb);

  function responder(l) {
    if (card.dataset.done) return;
    card.dataset.done = '1';
    const ok = l === q.correcta;
    for (const k of 'ABCD') botones[k].disabled = true;
    botones[q.correcta].classList.add('right');
    if (!ok) botones[l].classList.add('wrong');
    if (onRespuesta) onRespuesta(l, ok);
    fb.append(...[
      h('div', { class: 'verdict ' + (ok ? 'ok' : 'bad') }, ok ? '✓ ¡Correcto!' : `✗ Incorrecto. La correcta es la ${q.correcta}.`),
      q.idea ? h('p', { class: 'idea mt' }, h('strong', {}, 'Idea clave: '), q.idea) : null,
      h('h3', {}, 'Por qué'),
      h('p', {}, q.justificacion),
      q.fuente ? h('div', { class: 'norma' }, h('strong', {}, '📖 Norma: '), q.fuente) : null,
      !ok && q.distractores[l] ? h('p', { class: 'mt' }, h('strong', {}, `Tu opción (${l}): `), q.distractores[l]) : null,
      q.tecnica ? h('details', {}, h('summary', {}, 'Técnica para identificarla sin saberla'), h('p', {}, q.tecnica)) : null,
      h('details', {}, h('summary', {}, 'Por qué fallan las otras opciones'),
        ...Object.entries(q.distractores).map(([k, v]) => h('p', { class: 'small' }, h('strong', {}, k + '. '), v))),
      h('div', { class: 'row mt' },
        h('button', { type: 'button', class: 'secondary grow', onclick: () => Voz.reproducir(explicacionAudio(q, l)) }, '🔊 Escuchar explicación'),
        h('button', { type: 'button', class: 'grow', onclick: () => { Voz.detener(); onSiguiente(); } }, etiquetaSiguiente)),
    ].filter(Boolean));
    fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (yaRespondida) responder(yaRespondida);
  return card;
}

/* ======================= Vistas ======================= */
const view = () => $('#view');
function pintar(...nodos) { const v = view(); v.replaceChildren(...nodos.filter(Boolean)); v.focus({ preventScroll: true }); window.scrollTo(0, 0); }

function vistaHoy() {
  const hoy = hoyStr();
  const set = setDeHoy();
  const uid = unidadActual();
  const u = UNIDAD[uid];
  const dia = S.dias[hoy] || {};
  const hechas = set.idx;
  const total = set.ids.length;
  const nodos = [h('h1', {}, `Hoy, ${fechaLarga(hoy)}`)];

  if (S.examen) {
    const faltan = diasEntre(hoy, S.examen);
    if (faltan >= 0) nodos.push(h('p', { class: 'muted' }, `Faltan ${faltan} días para la prueba.`));
  }

  nodos.push(h('div', { class: 'card accent' + (dia.audio ? ' done' : '') },
    h('h2', {}, `1. Escucha · ≈${minutosResumen(uid)} min`),
    h('p', {}, u.titulo),
    h('p', { class: 'muted small' }, 'Resumen en voz alta de las ideas clave de la unidad que estás estudiando.'),
    h('div', { class: 'row mt' },
      h('button', { type: 'button', class: 'gold grow', onclick: () => Voz.reproducir(resumenUnidad(uid), () => marcarAudio()) }, '▶ Escuchar resumen'),
      dia.audio ? h('span', { class: 'pill ok' }, '✓ Escuchado') : h('button', { type: 'button', class: 'ghost', onclick: () => { marcarAudio(); vistaHoy(); } }, 'Ya lo escuché')),
  ));

  const terminado = hechas >= total;
  const aciertos = Object.values(set.res).filter(Boolean).length;
  nodos.push(h('div', { class: 'card accent' + (terminado ? ' done' : '') },
    h('h2', {}, `2. Preguntas · ${total} hoy`),
    h('p', { class: 'muted small' }, `${set.rep ? `Incluye ${set.rep} repaso(s) de preguntas anteriores. ` : ''}${esFinDeSemana(hoy) ? 'Fin de semana: sesión ampliada.' : 'Entre semana: sesión corta.'}`),
    bar(pct(hechas, total)),
    h('p', { class: 'small mt' }, terminado ? `Terminaste: ${aciertos} de ${total} correctas.` : `${hechas} de ${total} respondidas.`),
    terminado
      ? h('a', { class: 'btn secondary full mt', href: '#practicar' }, 'Practicar más')
      : h('button', { type: 'button', class: 'full mt', onclick: () => jugarHoy() }, hechas ? 'Continuar' : 'Empezar'),
  ));

  if (esDomingo(hoy)) {
    nodos.push(h('div', { class: 'card accent' },
      h('h2', {}, '3. Simulacro del domingo'),
      h('p', { class: 'muted small' }, '20 preguntas mezcladas de todos los temas, con tiempo, como en la prueba real.'),
      h('a', { class: 'btn full mt', href: '#simulacro' }, 'Ir al simulacro')));
  }

  const vistas = bancoPlan().filter(q => S.q[q.id]).length;
  const est = estimacionFin();
  const enUnidad = preguntasDeUnidad(uid);
  nodos.push(h('div', { class: 'card' },
    h('h3', {}, 'Tu avance en el plan'),
    h('p', { class: 'small' }, `Vas en ${u.titulo} (${enUnidad.filter(q => S.q[q.id]).length} de ${enUnidad.length}).`),
    bar(pct(vistas, bancoPlan().length), 'gold'),
    h('p', { class: 'small mt' }, `${vistas} de ${bancoPlan().length} preguntas vistas. ${est.restantes ? `A este ritmo terminas la primera vuelta en unas ${est.semanas} semanas (≈ ${fechaLarga(est.fecha)}).` : '¡Primera vuelta completa! Ahora todo es repaso y simulacros.'}`),
    h('p', { class: 'small' }, `Racha: ${racha()} día(s) seguidos · Repasos pendientes: ${pendientesRepaso().length}`),
  ));
  pintar(...nodos);
}
function marcarAudio() {
  const hoy = hoyStr();
  S.dias[hoy] = Object.assign({ n: 0, ok: 0 }, S.dias[hoy], { audio: true });
  guardar();
  if ((location.hash || '#hoy') === '#hoy') vistaHoy();
}

function jugarHoy() {
  const set = setDeHoy();
  if (set.idx >= set.ids.length) { vistaHoy(); return; }
  const q = Q[set.ids[set.idx]];
  pintar(
    h('div', { class: 'row' }, h('a', { href: '#hoy', class: 'btn ghost' }, '← Hoy'), h('div', { class: 'grow' }), h('span', { class: 'muted small' }, 'Sesión de hoy')),
    tarjetaPregunta(q, {
      n: set.idx + 1, total: set.ids.length,
      onRespuesta: (l, ok) => { registrar(q.id, ok); set.res[q.id] = ok; set.idx++; guardar(); },
      onSiguiente: () => (set.idx >= set.ids.length ? finHoy() : jugarHoy()),
      etiquetaSiguiente: set.idx + 1 >= set.ids.length ? 'Terminar' : 'Siguiente',
    }),
  );
}
function finHoy() {
  const set = S.hoy;
  const ok = Object.values(set.res).filter(Boolean).length;
  const malas = set.ids.filter(i => set.res[i] === false);
  pintar(
    h('h1', {}, '¡Sesión terminada!'),
    h('div', { class: 'card center' }, h('div', { class: 'stat' }, h('div', { class: 'num' }, `${ok}/${set.ids.length}`), h('div', { class: 'lbl' }, 'correctas hoy'))),
    malas.length ? h('div', { class: 'card' }, h('h3', {}, 'Volverán a salir para repaso'),
      ...malas.map(i => h('p', { class: 'small' }, '• ', Q[i].eje))) : h('p', { class: 'center' }, 'Sin errores hoy. 👏'),
    h('a', { class: 'btn full', href: '#hoy' }, 'Volver a Hoy'),
  );
}

/* ---------- Practicar ---------- */
function vistaPracticar() {
  const pend = pendientesRepaso();
  const falladas = Object.entries(S.q).filter(([id, r]) => Q[id] && r.lastOk === false).map(([id]) => id);
  const nodos = [h('h1', {}, 'Practicar')];
  nodos.push(h('div', { class: 'list' },
    h('button', { type: 'button', class: 'list-item', onclick: () => iniciarSesion('Repasos pendientes', pend.slice(0, 15)), disabled: !pend.length },
      h('span', {}, '🔁'), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Repasos pendientes'), h('div', { class: 's' }, `${pend.length} preguntas para hoy`))),
    h('button', { type: 'button', class: 'list-item', onclick: () => iniciarSesion('Mis errores', barajar(falladas).slice(0, 15)), disabled: !falladas.length },
      h('span', {}, '❌'), h('div', { class: 'grow' }, h('div', { class: 't' }, 'Mis errores'), h('div', { class: 's' }, `${falladas.length} preguntas falladas la última vez`))),
    h('button', { type: 'button', class: 'list-item', onclick: () => iniciarSesion('Al azar', barajar(bancoPlan().map(q => q.id)).slice(0, 10)) },
      h('span', {}, '🎲'), h('div', { class: 'grow' }, h('div', { class: 't' }, '10 al azar'), h('div', { class: 's' }, 'De todo el banco'))),
  ));
  nodos.push(h('h2', {}, 'Por tema'));
  const porTema = h('div', { class: 'list' });
  for (const [t, nombre] of Object.entries(DATA.temas)) {
    const qs = bancoPlan().filter(q => q.tema === t);
    const vistas = qs.filter(q => S.q[q.id]);
    const ok = vistas.filter(q => S.q[q.id].lastOk).length;
    porTema.append(h('button', { type: 'button', class: 'list-item', onclick: () => {
      const nuevas = qs.filter(q => !S.q[q.id]).map(q => q.id);
      iniciarSesion(nombre, (nuevas.length ? nuevas.slice(0, 10) : barajar(qs.map(q => q.id)).slice(0, 10)));
    } }, h('div', { class: 'grow' }, h('div', { class: 't' }, nombre), h('div', { class: 's' }, `${vistas.length}/${qs.length} vistas · ${vistas.length ? pct(ok, vistas.length) + ' % de acierto' : 'sin empezar'}`))));
  }
  nodos.push(porTema);
  nodos.push(h('h2', {}, 'Por unidad'));
  const porUnidad = h('div', { class: 'list' });
  for (const uid of ORDEN.concat(['SIM01'])) {
    const u = UNIDAD[uid]; if (!u) continue;
    const qs = preguntasDeUnidad(uid);
    porUnidad.append(h('button', { type: 'button', class: 'list-item', onclick: () => iniciarSesion(u.titulo, qs.map(q => q.id)) },
      h('div', { class: 'grow' }, h('div', { class: 't' }, u.titulo), h('div', { class: 's' }, `${qs.filter(q => S.q[q.id]).length}/${qs.length} vistas · ${temaNombre(u.tema)}`))));
  }
  nodos.push(porUnidad);
  pintar(...nodos);
}
function iniciarSesion(titulo, ids) {
  if (!ids.length) return;
  sesion = { titulo, ids, idx: 0, res: {} };
  jugarSesion();
}
function jugarSesion() {
  if (!sesion) return vistaPracticar();
  if (sesion.idx >= sesion.ids.length) {
    const ok = Object.values(sesion.res).filter(Boolean).length;
    pintar(h('h1', {}, sesion.titulo), h('div', { class: 'card center' }, h('div', { class: 'stat' }, h('div', { class: 'num' }, `${ok}/${sesion.ids.length}`), h('div', { class: 'lbl' }, 'correctas'))),
      h('button', { type: 'button', class: 'full', onclick: () => { sesion = null; vistaPracticar(); } }, 'Volver'));
    return;
  }
  const q = Q[sesion.ids[sesion.idx]];
  pintar(
    h('div', { class: 'row' }, h('button', { type: 'button', class: 'ghost', onclick: () => { sesion = null; Voz.detener(); vistaPracticar(); } }, '← Salir'), h('div', { class: 'grow' }), h('span', { class: 'muted small' }, sesion.titulo)),
    tarjetaPregunta(q, {
      n: sesion.idx + 1, total: sesion.ids.length,
      onRespuesta: (l, ok) => { registrar(q.id, ok); sesion.res[q.id] = ok; },
      onSiguiente: () => { sesion.idx++; jugarSesion(); },
    }),
  );
}

/* ---------- Escuchar ---------- */
function vistaEscuchar() {
  const uid = unidadActual();
  const nodos = [h('h1', {}, 'Escuchar')];
  if (!Voz.disponible) nodos.push(h('div', { class: 'card' }, 'Este navegador no permite lectura en voz alta. Abre la página en Chrome.'));
  nodos.push(h('p', { class: 'muted small' }, 'Consejo: mantén la pantalla encendida mientras escuchas; algunos celulares detienen la voz al bloquearse.'));

  nodos.push(h('div', { class: 'card accent' },
    h('h2', {}, 'Preguntas narradas'),
    h('p', { class: 'small' }, `Escuchas la pregunta y las opciones, tienes ${S.ajustes.pausa} segundos para pensar y luego oyes la respuesta con su idea clave.`),
    h('div', { class: 'list mt' },
      botonNarrar('De la unidad actual', preguntasDeUnidad(uid).map(q => q.id)),
      botonNarrar('Mis errores', Object.entries(S.q).filter(([id, r]) => Q[id] && r.lastOk === false).map(([id]) => id)),
      botonNarrar('10 al azar', barajar(bancoPlan().map(q => q.id)).slice(0, 10)),
    )));

  nodos.push(h('h2', {}, 'Resúmenes por unidad'));
  const porTema = {};
  for (const id of ORDEN) (porTema[UNIDAD[id].tema] = porTema[UNIDAD[id].tema] || []).push(id);
  for (const [t, ids] of Object.entries(porTema)) {
    nodos.push(h('h3', {}, temaNombre(t)));
    nodos.push(h('div', { class: 'list' }, ...ids.map(id => h('button', { type: 'button', class: 'list-item', onclick: () => Voz.reproducir(resumenUnidad(id), id === uid ? () => marcarAudio() : null) },
      h('span', {}, '▶'), h('div', { class: 'grow' }, h('div', { class: 't' }, UNIDAD[id].titulo), h('div', { class: 's' }, `≈${minutosResumen(id)} min${id === uid ? ' · unidad actual' : ''}`))))));
  }

  const sel = h('select', { onchange: e => { S.ajustes.voz = e.target.value; guardar(); } }, h('option', { value: '' }, 'Automática (español)'));
  const llenar = () => { for (const v of Voz.voces()) if (![...sel.options].some(o => o.value === v.name)) sel.append(h('option', { value: v.name, selected: v.name === S.ajustes.voz }, `${v.name} (${v.lang})`)); };
  llenar(); if (Voz.disponible) speechSynthesis.addEventListener('voiceschanged', llenar);
  nodos.push(h('div', { class: 'card' },
    h('h3', {}, 'Ajustes de voz'),
    h('label', { class: 'field' }, 'Voz', sel),
    h('label', { class: 'field' }, `Velocidad: ${S.ajustes.rate.toFixed(1)}×`, h('input', { type: 'range', min: '0.7', max: '1.6', step: '0.1', value: S.ajustes.rate, onchange: e => { S.ajustes.rate = Number(e.target.value); guardar(); vistaEscuchar(); } })),
    h('label', { class: 'field' }, `Pausa para pensar: ${S.ajustes.pausa} s`, h('input', { type: 'range', min: '3', max: '20', step: '1', value: S.ajustes.pausa, onchange: e => { S.ajustes.pausa = Number(e.target.value); guardar(); vistaEscuchar(); } })),
    h('button', { type: 'button', class: 'secondary full', onclick: () => Voz.reproducir([{ titulo: 'Prueba', partes: [{ t: 'Hola. Así sonará la voz durante tus repasos de la Convocatoria sesenta y siete.' }] }]) }, '🔊 Probar voz'),
  ));
  pintar(...nodos);
}
function botonNarrar(titulo, ids) {
  return h('button', { type: 'button', class: 'list-item', disabled: !ids.length, onclick: () => Voz.reproducir(ids.map((id, k) => itemNarrado(Q[id], k + 1, ids.length))) },
    h('span', {}, '🎧'), h('div', { class: 'grow' }, h('div', { class: 't' }, titulo), h('div', { class: 's' }, `${ids.length} preguntas`)));
}

/* ---------- Simulacro ---------- */
function armarSimulacro(n) {
  const total = Object.values(PESOS_SIMULACRO).reduce((a, b) => a + b, 0);
  const recientes = new Set(S.sims.slice(-3).flatMap(s => s.ids || []));
  let ids = [];
  for (const [t, w] of Object.entries(PESOS_SIMULACRO)) {
    const k = Math.round(n * w / total);
    const pool = DATA.preguntas.filter(q => q.tema === t);
    const fresco = barajar(pool.filter(q => !recientes.has(q.id)));
    ids = ids.concat(fresco.concat(barajar(pool.filter(q => recientes.has(q.id)))).slice(0, k).map(q => q.id));
  }
  if (ids.length > n) ids = barajar(ids).slice(0, n);
  while (ids.length < n) { const q = DATA.preguntas[Math.floor(Math.random() * DATA.preguntas.length)]; if (!ids.includes(q.id)) ids.push(q.id); }
  return barajar(ids);
}
let relojSim = null;
function vistaSimulacro() {
  clearInterval(relojSim);
  if (S.sim && !S.sim.fin) return jugarSimulacro();
  const nodos = [h('h1', {}, 'Simulacro'),
    h('p', { class: 'muted' }, `Preguntas mezcladas de todos los ejes, sin ver respuestas hasta el final, con ${SEG_POR_PREGUNTA / 60} minutos por pregunta. Se aprueba con ${MIN_APROBAR}/100, como la prueba eliminatoria real.`),
    h('div', { class: 'list' },
      ...[[20, 'Corto'], [40, 'Completo']].map(([n, nom]) => h('button', { type: 'button', class: 'list-item', onclick: () => nuevoSimulacro(n) },
        h('span', {}, '⏱️'), h('div', { class: 'grow' }, h('div', { class: 't' }, `${nom}: ${n} preguntas`), h('div', { class: 's' }, `${n * SEG_POR_PREGUNTA / 60} minutos`))))),
  ];
  if (S.sims.length) {
    nodos.push(h('h2', {}, 'Tus simulacros'));
    nodos.push(h('div', { class: 'list' }, ...S.sims.slice().reverse().map(s => h('div', { class: 'list-item' },
      h('span', { class: 'pill ' + (s.puntaje >= MIN_APROBAR ? 'ok' : 'bad') }, s.puntaje),
      h('div', { class: 'grow' }, h('div', { class: 't' }, fechaLarga(s.fecha)), h('div', { class: 's' }, `${s.ok}/${s.n} correctas`))))));
  }
  pintar(...nodos);
}
function nuevoSimulacro(n) {
  S.sim = { ids: armarSimulacro(n), resp: {}, idx: 0, finEn: Date.now() + n * SEG_POR_PREGUNTA * 1000 };
  guardar();
  jugarSimulacro();
}
function jugarSimulacro() {
  const sim = S.sim;
  const q = Q[sim.ids[sim.idx]];
  const reloj = h('span', { class: 'timer' });
  const tic = () => {
    const s = Math.max(0, Math.round((sim.finEn - Date.now()) / 1000));
    reloj.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    reloj.classList.toggle('low', s < 120);
    if (s <= 0) { clearInterval(relojSim); terminarSimulacro(); }
  };
  clearInterval(relojSim); relojSim = setInterval(tic, 1000); tic();
  const opts = h('div', { class: 'opts' });
  for (const l of 'ABCD') opts.append(h('button', { type: 'button', class: 'opt' + (sim.resp[q.id] === l ? ' selected' : ''), onclick: () => { sim.resp[q.id] = l; guardar(); jugarSimulacro(); } },
    h('span', { class: 'letter' }, l + '.'), h('span', {}, q.opciones[l])));
  const respondidas = Object.keys(sim.resp).length;
  pintar(
    h('div', { class: 'row' }, h('strong', {}, `Pregunta ${sim.idx + 1} de ${sim.ids.length}`), h('div', { class: 'grow' }), reloj),
    bar(pct(respondidas, sim.ids.length)),
    h('div', { class: 'card' }, h('div', { class: 'q-meta' }, h('span', { class: 'pill' }, temaNombre(q.tema))), h('div', { class: 'q-stem' }, q.enunciado), opts),
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'secondary grow', disabled: sim.idx === 0, onclick: () => { sim.idx--; guardar(); jugarSimulacro(); } }, '← Anterior'),
      sim.idx + 1 < sim.ids.length
        ? h('button', { type: 'button', class: 'grow', onclick: () => { sim.idx++; guardar(); jugarSimulacro(); } }, 'Siguiente →')
        : h('button', { type: 'button', class: 'gold grow', onclick: () => confirmarFin() }, 'Entregar')),
    h('p', { class: 'center small mt' }, `${respondidas} de ${sim.ids.length} respondidas · `,
      h('a', { href: '#', onclick: e => { e.preventDefault(); confirmarFin(); } }, 'Entregar ahora')),
  );
}
function confirmarFin() {
  const faltan = S.sim.ids.length - Object.keys(S.sim.resp).length;
  if (confirm(faltan ? `Te faltan ${faltan} preguntas. ¿Entregar de todas formas?` : '¿Entregar el simulacro?')) terminarSimulacro();
}
function terminarSimulacro() {
  clearInterval(relojSim);
  const sim = S.sim;
  let ok = 0; const temas = {};
  for (const id of sim.ids) {
    const q = Q[id]; const r = sim.resp[id]; const bien = r === q.correcta;
    if (bien) ok++;
    temas[q.tema] = temas[q.tema] || [0, 0]; temas[q.tema][1]++; if (bien) temas[q.tema][0]++;
    registrar(id, bien);
  }
  const puntaje = pct(ok, sim.ids.length);
  S.sims.push({ fecha: hoyStr(), n: sim.ids.length, ok, puntaje, temas, ids: sim.ids });
  const res = { ids: sim.ids, resp: sim.resp };
  S.sim = null;
  guardar();
  const nodos = [h('h1', {}, 'Resultado del simulacro'),
    h('div', { class: 'card center' },
      h('div', { class: 'stat' }, h('div', { class: 'num' }, `${puntaje}/100`), h('div', { class: 'lbl' }, `${ok} de ${res.ids.length} correctas`)),
      h('p', { class: 'mt' }, h('span', { class: 'pill ' + (puntaje >= MIN_APROBAR ? 'ok' : 'bad') }, puntaje >= MIN_APROBAR ? 'Aprobarías la prueba eliminatoria' : `Te faltan ${MIN_APROBAR - puntaje} puntos para el mínimo de ${MIN_APROBAR}`))),
    h('h2', {}, 'Por eje'),
    ...Object.entries(temas).map(([t, [a, n]]) => h('div', { class: 'bar-row' }, h('div', { class: 'lbl' }, h('span', {}, temaNombre(t)), h('span', {}, `${a}/${n}`)), bar(pct(a, n)))),
    h('h2', {}, 'Revisión'),
  ];
  res.ids.forEach((id, k) => {
    const q = Q[id]; const r = res.resp[id]; const bien = r === q.correcta;
    nodos.push(h('details', { class: 'card' },
      h('summary', {}, h('span', { class: 'pill ' + (bien ? 'ok' : 'bad') }, bien ? '✓' : '✗'), ` ${k + 1}. ${q.eje}`),
      h('p', { class: 'small' }, q.enunciado),
      h('p', { class: 'small' }, h('strong', {}, `Tu respuesta: ${r || '—'} · Correcta: ${q.correcta}. `), q.opciones[q.correcta]),
      h('p', { class: 'small' }, q.justificacion),
      q.fuente ? h('div', { class: 'norma' }, '📖 ', q.fuente) : null));
  });
  nodos.push(h('a', { class: 'btn full', href: '#hoy' }, 'Volver a Hoy'));
  pintar(...nodos);
}

/* ---------- Progreso ---------- */
function vistaProgreso() {
  const banco = bancoPlan();
  const vistas = banco.filter(q => S.q[q.id]);
  const okUlt = vistas.filter(q => S.q[q.id].lastOk).length;
  const dominadas = vistas.filter(q => S.q[q.id].box >= 4).length;
  const nodos = [h('h1', {}, 'Tu progreso'),
    h('div', { class: 'stat-grid' },
      stat(`${vistas.length}/${banco.length}`, 'preguntas vistas'),
      stat(`${pct(okUlt, vistas.length)} %`, 'acierto (último intento)'),
      stat(dominadas, 'dominadas'),
      stat(racha(), 'días seguidos'),
      stat(pendientesRepaso().length, 'repasos pendientes'),
      stat(S.sims.length ? S.sims[S.sims.length - 1].puntaje : '—', 'último simulacro')),
    h('h2', {}, 'Por eje temático'),
  ];
  for (const [t, nombre] of Object.entries(DATA.temas)) {
    const qs = banco.filter(q => q.tema === t); const v = qs.filter(q => S.q[q.id]); const a = v.filter(q => S.q[q.id].lastOk).length;
    nodos.push(h('div', { class: 'bar-row' },
      h('div', { class: 'lbl' }, h('span', {}, nombre), h('span', {}, v.length ? `${pct(a, v.length)} % acierto` : 'sin empezar')),
      bar(pct(v.length, qs.length), 'gold'), h('div', { class: 'small muted' }, `${v.length} de ${qs.length} vistas`)));
  }
  const ult = []; for (let k = 13; k >= 0; k--) ult.push(sumarDias(hoyStr(), -k));
  nodos.push(h('h2', {}, 'Últimos 14 días'),
    h('div', { class: 'row' }, ...ult.map(d => { const x = S.dias[d]; return h('div', { class: 'center small', style: 'width:38px' },
      h('div', { style: `height:30px;border-radius:8px;background:${x && (x.n || x.audio) ? (x.n ? 'var(--navy-2)' : 'var(--gold)') : '#e7ebf1'}`, title: d }), fecha(d).getDate()); })),
    h('p', { class: 'small muted' }, 'Azul: respondiste preguntas · Dorado: solo audio.'));

  const ex = h('input', { type: 'date', value: S.examen || '', onchange: e => { S.examen = e.target.value; guardar(); } });
  const sem = h('input', { type: 'number', min: '3', max: '30', value: S.ajustes.semana, onchange: e => { S.ajustes.semana = Math.max(3, Number(e.target.value) || 7); S.hoy = null; guardar(); } });
  const fds = h('input', { type: 'number', min: '5', max: '50', value: S.ajustes.fds, onchange: e => { S.ajustes.fds = Math.max(5, Number(e.target.value) || 20); S.hoy = null; guardar(); } });
  nodos.push(h('div', { class: 'card' }, h('h3', {}, 'Ajustes del plan'),
    h('label', { class: 'field' }, 'Fecha de la prueba escrita (opcional)', ex),
    h('label', { class: 'field' }, 'Preguntas por día entre semana', sem),
    h('label', { class: 'field' }, 'Preguntas por día el fin de semana', fds),
    h('p', { class: 'small muted' }, 'Los cambios en la cantidad se aplican desde la próxima sesión del día.')));

  nodos.push(h('div', { class: 'card' }, h('h3', {}, 'Respaldo'),
    h('p', { class: 'small muted' }, 'Tu progreso se guarda solo en este celular. Descarga una copia de vez en cuando; sirve también para pasarlo a otro dispositivo.'),
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'secondary grow', onclick: exportar }, '⬇ Descargar copia'),
      h('label', { class: 'btn secondary grow' }, '⬆ Restaurar', h('input', { type: 'file', accept: 'application/json', hidden: true, onchange: importar }))),
    h('button', { type: 'button', class: 'ghost full mt', onclick: () => { if (confirm('¿Borrar todo tu progreso? No se puede deshacer.')) { S = estadoInicial(); guardar(); vistaProgreso(); } } }, 'Reiniciar progreso')));
  nodos.push(h('p', { class: 'small muted center' }, `${DATA.preguntas.length} preguntas · Material adaptado a la Convocatoria 67-2026`));
  pintar(...nodos);
}
function stat(num, lbl) { return h('div', { class: 'stat' }, h('div', { class: 'num' }, num), h('div', { class: 'lbl' }, lbl)); }
function exportar() {
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `mi-concurso-67-progreso-${hoyStr()}.json` });
  document.body.append(a); a.click(); a.remove();
}
function importar(e) {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(t => {
    const d = JSON.parse(t);
    if (!d || d.v !== 1 || typeof d.q !== 'object') throw new Error('formato');
    S = Object.assign(estadoInicial(), d); guardar(); alert('Progreso restaurado.'); vistaProgreso();
  }).catch(() => alert('El archivo no es una copia válida de Mi Concurso 67.'));
}

/* ======================= Navegación ======================= */
function ruta() {
  const [tab = 'hoy', sub] = (location.hash || '#hoy').slice(1).split('/');
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
  if (tab !== 'simulacro') clearInterval(relojSim);
  if (tab !== 'practicar') sesion = null;
  if (tab === 'mapas') return vistaMapas(sub);
  ({ hoy: vistaHoy, practicar: vistaPracticar, escuchar: vistaEscuchar, simulacro: vistaSimulacro, progreso: vistaProgreso }[tab] || vistaHoy)();
}

async function iniciar() {
  cargarEstado();
  $('#pl-toggle').onclick = () => Voz.alternar();
  $('#pl-next').onclick = () => Voz.saltar(1);
  $('#pl-prev').onclick = () => Voz.saltar(-1);
  $('#pl-stop').onclick = () => Voz.detener();
  try {
    const r = await fetch('data/preguntas.json');
    DATA = await r.json();
  } catch (e) {
    pintar(h('div', { class: 'card' }, 'No se pudieron cargar las preguntas. Revisa tu conexión y vuelve a abrir la página.'));
    return;
  }
  for (const q of DATA.preguntas) Q[q.id] = q;
  for (const u of DATA.unidades) UNIDAD[u.id] = u;
  ORDEN = construirOrden();
  window.addEventListener('hashchange', ruta);
  ruta();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
}
iniciar();
