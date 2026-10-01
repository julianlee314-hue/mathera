/* Mathera v0.3 beta · Eras I–III (engines E1/E2/E3 from the Question Lab, rules: MM mastery-lite) */
(function () {
'use strict';
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pick = a => a[Math.floor(Math.random() * a.length)];
const MINUS = '−';
const fixFr = el => el.querySelectorAll('.fr').forEach(f => [...f.childNodes].forEach(n => { if (n.nodeType === 3) n.remove(); }));
const clock = { now: () => Date.now() };   // tests can move time: window.__mathera.clock.now = …
const now = () => clock.now();

/* ================= content ================= */
const ERAS = {
  I: { E: E1, name: 'Count', units: [['I.1', 'Counting'], ['I.2', 'Comparing & ordering'], ['I.3', 'Place value'], ['I.4', 'Addition & subtraction'], ['I.5', 'Patterns & logic'], ['I.6', 'Shape & space'], ['I.7', 'Measure & data']] },
  II: { E: E2, name: 'Operate', units: [['II.1', 'Place value to millions'], ['II.2', 'Multiplication'], ['II.3', 'Division'], ['II.4', 'Factors & multiples'], ['II.5', 'Fractions I'], ['II.6', 'Fractions II'], ['II.7', 'Decimals'], ['II.8', 'Expressions'], ['II.9', 'Measurement & geometry'], ['II.10', 'Data']] },
  III: { E: E3, name: 'Relate', units: [['III.1', 'Integers & rationals'], ['III.2', 'Ratios & rates'], ['III.3', 'Percent'], ['III.4', 'Exponents & roots'], ['III.5', 'Expressions'], ['III.6', 'Equations & inequalities'], ['III.7', 'Lines & first functions'], ['III.8', 'Basic Non-Proof Geometry'], ['III.9', 'Statistics & probability']] },
};
// Eras IV and V: only units that already have questions appear; the rest arrive unit by unit
const UP_UNITS = { IV: [["IV.1", "Equations & inequalities"], ["IV.2", "Functions"], ["IV.3", "Linear functions"], ["IV.4", "Systems"], ["IV.5", "Exponents & radicals"], ["IV.6", "Polynomials"], ["IV.7", "Quadratics"], ["IV.8", "Complex numbers"], ["IV.9", "Function toolkit"], ["IV.10", "Polynomial functions"], ["IV.11", "Rational & radical functions"], ["IV.12", "Exponential & logarithmic"], ["IV.13", "Sequences & series"], ["IV.14", "Counting & probability"], ["IV.15", "Data & distributions"]], V: [["V.1", "Logic & proof"], ["V.2", "Lines & angles"], ["V.3", "Triangles"], ["V.4", "Polygons"], ["V.5", "Similarity"], ["V.6", "Right-triangle trig"], ["V.7", "General triangles"], ["V.8", "Circles"], ["V.9", "Trig functions"], ["V.10", "Identities & equations"], ["V.11", "Coordinate geometry"], ["V.12", "Conic sections"], ["V.13", "Transformations"], ["V.14", "Solids"], ["V.15", "Constructions"]] };
for (const [k, E, name] of [['IV', G_E4(), 'Solve'], ['V', G_E5(), 'Prove']]) if (E && E.skills.length) { const have = new Set(E.skills.map(s => MM.unitOf(s.id))); ERAS[k] = { E, name, units: UP_UNITS[k].filter(([u]) => have.has(u)), total: UP_UNITS[k].length }; }
function G_eng(name) { const g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {}); const E = g[name]; return E && Array.isArray(E.skills) ? E : null; }
function G_E4() { return G_eng('E4'); } function G_E5() { return G_eng('E5'); }
const ERA_KEYS = Object.keys(ERAS);
// Display roster for homepage + era tabs (VI–VII mapped, not practice yet)
const ALL_ERAS = [
  { k: 'I', name: 'Count' }, { k: 'II', name: 'Operate' }, { k: 'III', name: 'Relate' },
  { k: 'IV', name: 'Solve' }, { k: 'V', name: 'Prove' },
  { k: 'VI', name: 'Change', soon: true }, { k: 'VII', name: 'Space', soon: true },
];
const eraName = k => (ALL_ERAS.find(e => e.k === k) || {}).name || (ERAS[k] || {}).name || k;
const eraSoon = k => !ERAS[k];
const UPPER = k => k === 'IV' || k === 'V';
const eraOf = id => id.split('.')[0];
const ALL_UNITS = ERA_KEYS.flatMap(k => ERAS[k].units);
const UNAME = Object.fromEntries(ALL_UNITS);
const ALL_SKILLS = ERA_KEYS.flatMap(k => ERAS[k].E.skills);
const BY = Object.assign({}, ...ERA_KEYS.map(k => ERAS[k].E.byId));
const ENG = id => ERAS[eraOf(id)].E;
const CHECK = (id, f, v) => (ENG(id).check || E2.check)(f, v);
const SHOWV = (id, f) => (ENG(id).show || E2.show)(f);
let era = 'II', UNITS = ERAS.II.units, SKILLS = E2.skills, ORDER = SKILLS.map(s => s.id);
const unitSkills = u => ALL_SKILLS.filter(s => MM.unitOf(s.id) === u);
const eraLabel = k => `Era ${k} · ${eraName(k)}`;
const HEROES = [['nova', 'Nova, a space explorer'], ['kai', 'Kai, a street chef'], ['rio', 'Rio, a footballer'], ['mei', 'Mei, a martial artist'], ['juno', 'Juno, a detective'], ['ade', 'Ade, a musician'], ['sol', 'Sol, a deep-sea diver']];
const NEMESES = [['crumblewick', 'Baron Crumblewick', 'a cookie-stealing raccoon'], ['rex', 'Tiny-Arms Rex', 'a dinosaur with big plans'], ['bragg', 'Lord Braggington', 'who overestimates everything'], ['sterling', 'Sly Sterling', 'a terrible tycoon'], ['moriarty', 'Professor Moriarty', 'a mathematician gone bad'], ['tempus', 'Dr. Tempus', 'who meddles with time'], ['nullspace', 'Emperor Nullspace', 'ruler of the galaxy'], ['unit9', 'UNIT-9', 'an AI very sure of itself'], ['rumpel', 'Rumpelstiltskin', 'spinner of riddles']];
const DEFAULT_RULES = { hero: 'nova', nemesis: 'crumblewick', coins: 'US', units: 'metric', clock: '12h', stories: 'on', sfx: 'off', sound: 'off' };
const STORY = [
  (N, H) => `${N} bets ${H} can't get this one.`,
  (N, H) => `${N} scrambled the numbers. ${H} needs them back in order.`,
  (N) => `${N} hid the answer somewhere in here.`,
  (N, H) => `${H} is counting on you. ${N} is counting on you to slip.`,
  (N) => `${N} says this one is impossible. It isn't.`,
  (N, H) => `${H} left a note: "Check it twice. ${N} is watching."`,
];
const WHOA = [
  'Robert Recorde invented the = sign in 1557 because he was tired of writing "is equal to".',
  'The Rhind papyrus, about 3,600 years old, is full of fraction problems copied by an Egyptian scribe named Ahmes.',
  'Eratosthenes, who invented the prime sieve, also estimated the size of the Earth using shadows.',
  'Simon Stevin\'s little 1585 book "De Thiende" taught Europe how to use decimals.',
  'William Playfair drew the first bar chart in 1786.',
  'Napier\'s bones (1617) were carved rods that made long multiplication quick.',
  'The abacus is still used in schools today, and some people can "see" one in their head to calculate.',
];
const ICON = {
  abacus: '<path d="M6 7h28M6 33h28M8 7v26M32 7v26M8 14h24M8 21h24M8 28h24" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="13" cy="14" r="2.2"/><circle cx="18" cy="14" r="2.2"/><circle cx="26" cy="21" r="2.2"/><circle cx="14" cy="28" r="2.2"/><circle cx="20" cy="28" r="2.2"/><circle cx="26" cy="28" r="2.2"/>',
  bones: '<rect x="7" y="5" width="7" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="17" y="5" width="7" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><rect x="27" y="5" width="7" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 15l7-7M7 25l7-7M17 15l7-7M17 25l7-7M27 15l7-7M27 25l7-7" stroke="currentColor" stroke-width="1"/>',
  scales: '<path d="M20 6v26M10 34h20M8 12h24" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M8 12l-4 10h8zM32 12l-4 10h8z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M4 22a4 3 0 0 0 8 0M28 22a4 3 0 0 0 8 0" fill="currentColor"/>',
  sieve: '<circle cx="20" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="1.8"/><g fill="currentColor"><circle cx="14" cy="14" r="1.6"/><circle cx="20" cy="14" r="1.6"/><circle cx="26" cy="14" r="1.6"/><circle cx="14" cy="20" r="1.6"/><circle cx="26" cy="20" r="1.6"/><circle cx="14" cy="26" r="1.6"/><circle cx="20" cy="26" r="1.6"/><circle cx="26" cy="26" r="1.6"/></g><circle cx="20" cy="20" r="2.6" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  papyrus: '<path d="M9 8h20a3 3 0 0 1 0 6H11v18a3 3 0 0 1-6 0V11a3 3 0 0 1 4-3z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 19h10M15 24h8M15 29h10" stroke="currentColor" stroke-width="1.3"/>',
  gears: '<circle cx="15" cy="17" r="7" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="15" cy="17" r="2" fill="currentColor"/><circle cx="27" cy="27" r="5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M15 7v3M15 24v3M5 17h3M22 17h3M8 10l2 2M20 22l2 2M8 24l2-2M20 12l2-2M27 19v2M27 33v2M19 27h2M33 27h2" stroke="currentColor" stroke-width="1.8"/>',
  point: '<path d="M6 30h28" stroke="currentColor" stroke-width="1.5"/><text x="20" y="26" text-anchor="middle" font-family="Spline Sans Mono, monospace" font-size="13" fill="currentColor">3.14</text>',
  balance: '<path d="M20 8v24M12 34h16M6 14h28" stroke="currentColor" stroke-width="1.8"/><rect x="5" y="17" width="8" height="6" fill="currentColor"/><circle cx="31" cy="20" r="3" fill="currentColor"/><path d="M20 8l-3-3h6z" fill="currentColor"/>',
  protractor: '<path d="M5 30a15 15 0 0 1 30 0z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M20 30L30 20M9 30l2-2M31 30l-2-2M20 15v3M12 19l2 2M28 19l-2 2" stroke="currentColor" stroke-width="1.4"/>',
  chart: '<path d="M6 33h28M6 33V7" stroke="currentColor" stroke-width="1.6"/><rect x="10" y="20" width="5" height="13" fill="currentColor"/><rect x="18" y="12" width="5" height="21" fill="currentColor"/><rect x="26" y="24" width="5" height="9" fill="currentColor"/>',
  bone: '<path d="M9 30C6 30 5 26 8 25L25 8c1-3 5-2 5 1 3 0 4 4 1 5L14 31c0 3-4 3-5-1z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13 23l2 2M16 20l2 2M19 17l2 2M22 14l2 2" stroke="currentColor" stroke-width="1.4"/>',
  line: '<path d="M4 22h32M32 19l4 3-4 3M8 18v8M14 18v8M20 18v8M26 18v8" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="20" cy="14" r="2.4"/>',
  rods: '<path d="M8 8v24M12 8v24M16 8v24M20 8v24M24 8v24M28 8v24" stroke="currentColor" stroke-width="1.8"/><path d="M6 18h26M6 22h26" stroke="currentColor" stroke-width="2.4"/><path d="M33 12v20" stroke="currentColor" stroke-width="1.8"/>',
  board: '<rect x="5" y="8" width="30" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M15 8v24M25 8v24" stroke="currentColor" stroke-width="1.2"/><circle cx="10" cy="14" r="2"/><circle cx="10" cy="20" r="2"/><circle cx="20" cy="14" r="2"/><circle cx="30" cy="26" r="2"/><circle cx="30" cy="20" r="2"/>',
  loom: '<rect x="6" y="6" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 6v28M16 6v28M21 6v28M26 6v28M31 6v28" stroke="currentColor" stroke-width=".9"/><path d="M6 13h5v5h5v-5h5v5h5v-5h5M6 25h5v5h5v-5h5v5h5v-5h5" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  tangram: '<path d="M6 6h28v28H6z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6 6l28 28M34 6L20 20M13 27l14 0M20 34l7-7" stroke="currentColor" stroke-width="1.3"/><path d="M6 6h28L20 20z" fill="currentColor" opacity=".35"/>',
  sundial: '<circle cx="20" cy="22" r="13" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M20 22L20 8l8 14z" fill="currentColor"/><path d="M20 35v-2M7 22h2M31 22h2M11 13l1.5 1.5M29 13l-1.5 1.5" stroke="currentColor" stroke-width="1.4"/>',
  thermo: '<path d="M17 25V8a3 3 0 0 1 6 0v17a6 6 0 1 1-6 0z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="20" cy="29" r="3"/><path d="M20 27v-9M26 12h4M26 17h4M26 22h4" stroke="currentColor" stroke-width="1.8"/>',
  map: '<path d="M5 9l9-3 12 3 9-3v25l-9 3-12-3-9 3z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M14 6v25M26 9v25" stroke="currentColor" stroke-width="1"/><path d="M8 35h10" stroke="currentColor" stroke-width="2"/>',
  ledger: '<rect x="8" y="5" width="24" height="30" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12h16M12 18h16M12 24h16M20 9v24" stroke="currentColor" stroke-width="1"/><text x="26" y="33" text-anchor="middle" font-family="Spline Sans Mono, monospace" font-size="9" fill="currentColor">%</text>',
  slide: '<rect x="4" y="12" width="32" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M4 20h32" stroke="currentColor" stroke-width="1.2"/><path d="M8 12v3M12 12v2M16 12v3M22 12v2M30 12v3M10 28v-3M18 28v-2M26 28v-3" stroke="currentColor" stroke-width="1.2"/><rect x="17" y="9" width="6" height="22" fill="none" stroke="currentColor" stroke-width="1.6"/>',
  book: '<path d="M20 10c-4-3-10-3-14-1v23c4-2 10-2 14 1 4-3 10-3 14-1V9c-4-2-10-2-14 1zM20 10v23" fill="none" stroke="currentColor" stroke-width="1.6"/><text x="13" y="24" text-anchor="middle" font-family="STIX Two Text, serif" font-style="italic" font-size="10" fill="currentColor">x</text>',
  equals: '<path d="M6 15h28M6 25h28" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  grid: '<path d="M6 6h28v28H6zM6 13h28M6 20h28M6 27h28M13 6v28M20 6v28M27 6v28" stroke="currentColor" stroke-width=".8" fill="none"/><path d="M6 32L34 10" stroke="currentColor" stroke-width="2.2"/>',
  pyramid: '<path d="M4 33h32L20 7z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M20 7l4 26" stroke="currentColor" stroke-width="1.2"/><path d="M20 7l16 26h-12z" fill="currentColor" opacity=".3"/>',
  dice: '<rect x="7" y="7" width="26" height="26" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="14" cy="14" r="2.3"/><circle cx="26" cy="14" r="2.3"/><circle cx="20" cy="20" r="2.3"/><circle cx="14" cy="26" r="2.3"/><circle cx="26" cy="26" r="2.3"/>',
};
const INVENTIONS = [
  { u: 'I.1', id: 'bone', name: 'Tally bone', what: 'Notches that count' },
  { u: 'I.2', id: 'line', name: 'Number line', what: 'Every number has a place' },
  { u: 'I.3', id: 'rods', name: 'Counting rods', what: 'Ten in a bundle' },
  { u: 'I.4', id: 'board', name: 'Counting board', what: 'Pebbles that add' },
  { u: 'I.5', id: 'loom', name: 'Loom', what: 'Patterns that repeat' },
  { u: 'I.6', id: 'tangram', name: 'Tangram', what: 'Seven shapes, many pictures' },
  { u: 'I.7', id: 'sundial', name: 'Sundial', what: 'Time from a shadow' },
  { u: 'II.1', id: 'abacus', name: 'Abacus', what: 'Beads that carry' },
  { u: 'II.2', id: 'bones', name: 'Napier\'s bones', what: 'Rods that multiply' },
  { u: 'II.3', id: 'scales', name: 'Sharing scales', what: 'Fair shares' },
  { u: 'II.4', id: 'sieve', name: 'Prime sieve', what: 'Only primes fall through' },
  { u: 'II.5', id: 'papyrus', name: 'Rhind papyrus', what: 'Fractions in ink' },
  { u: 'II.6', id: 'gears', name: 'Gear train', what: 'Turns in ratio' },
  { u: 'II.7', id: 'point', name: 'Decimal point', what: 'Stevin\'s dot' },
  { u: 'II.8', id: 'balance', name: 'Pan balance', what: 'Both sides equal' },
  { u: 'II.9', id: 'protractor', name: 'Protractor', what: 'Measures a turn' },
  { u: 'II.10', id: 'chart', name: 'Bar chart', what: 'Playfair\'s picture' },
  { u: 'III.1', id: 'thermo', name: 'Thermometer', what: 'Numbers below zero' },
  { u: 'III.2', id: 'map', name: 'Map scale', what: 'The world, shrunk fairly' },
  { u: 'III.3', id: 'ledger', name: 'Ledger', what: 'Per hundred' },
  { u: 'III.4', id: 'slide', name: 'Slide rule', what: 'Powers made easy' },
  { u: 'III.5', id: 'book', name: 'Al-jabr', what: 'Letters for numbers' },
  { u: 'III.6', id: 'equals', name: 'Equals sign', what: 'Recorde\'s two lines' },
  { u: 'III.7', id: 'grid', name: 'Graph paper', what: 'Pictures of rules' },
  { u: 'III.8', id: 'pyramid', name: 'Pyramid', what: 'Triangles that stand' },
  { u: 'III.9', id: 'dice', name: 'Dice', what: 'Chance, counted' },
];
const eraInv = () => INVENTIONS.filter(i => eraOf(i.u) === era);
const icon = id => `<svg viewBox="0 0 40 40" aria-hidden="true" fill="currentColor">${ICON[id]}</svg>`;
// calculator policy: facts are for memory; elsewhere the calculator unlocks once the skill is proven by hand
// Era I never has a calculator: it's where number sense is built
const FACTS = new Set(['II.2.03', 'II.2.04', 'II.2.05', 'II.2.06', 'II.3.04', 'II.3.05', 'II.4.10', 'III.1.04', 'III.1.05', 'III.1.06', 'III.1.07', 'III.4.04', 'III.4.05', 'III.4.06']);
const CALC_UNITS = new Set(['II.9', 'II.10', 'III.8', 'III.9']);

/* ================= state ================= */
const SET = { pace: 'steady', dial: 5 };          // shared by all eras
const PS = Object.fromEntries(ERA_KEYS.map(k => { const x = MM.create(ERAS[k].E.skills.map(s => s.id)); x.settings = SET; return [k, x]; }));
ERA_KEYS.forEach(k => { PS[k].braveIds = new Set(ERAS[k].E.skills.filter(sk => sk.steps.e && sk.steps.f).map(sk => sk.id)); });
const BRAVE_NAME = { e: '★ Brave', f: '★★ Legend' };
const PLACEHOLDER = { set: 'a, b', interval: '(a, b]', point: '(x, y)', exact: 'e.g. 2√3', expr: 'e.g. 3x + 2', eqn: 'y = mx + b', complex: 'a + bi' };
const INPUT_HINT = { set: '2, −3', interval: '(−∞, 3]', point: '(2, −3)', exact: '2√3', expr: 'x² − 4x + 1', eqn: 'y = 2x + 3', complex: '3 − 2i' };
const kindOf = f => ['set', 'interval', 'point', 'exact', 'expr', 'eqn', 'complex'].find(k => f[k] !== undefined);
let P = PS.II;
let RULES = { ...DEFAULT_RULES };
let META = { pseudo: null, at: {}, placed: {}, start: {}, era: 'II' };
function setEra(k) {
  era = k; META.era = k; UNITS = ERAS[k].units; SKILLS = ERAS[k].E.skills; ORDER = SKILLS.map(s => s.id); P = PS[k];
  const ids = new Set(UNITS.map(([u]) => u));
  selUnit = ids.has(META.start[k]) ? META.start[k] : (UNITS[0] && UNITS[0][0]);
  if (META.start[k] && !ids.has(META.start[k])) delete META.start[k];
}
let S = MM.session();
const R = () => RULES;
const hero = () => (HEROES.find(x => x[0] === RULES.hero) || HEROES[0])[1];
const heroShort = () => hero().split(',')[0];
const nem = () => NEMESES.find(x => x[0] === RULES.nemesis) || NEMESES[0];
const OPTS = () => ({ coins: RULES.coins, units: RULES.units, clock: RULES.clock });
const TELE = {};              // telemetry counters by step key
function teleRec(key) { return TELE[key] || (TELE[key] = { t: 0, r: 0, s: 0, fun: 0, conf: 0 }); }

/* ================= storage ================= */
const LKEY = 'mathera-v02';
const enc = k => k.replace(/\./g, '_');           // db field names: no dots
const dec = k => k.replace(/_/g, '.');
let db = null, uid = null, remote = false, saveT = null, teleT = null, saving = false, again = false;
const dirty = new Set();
function snapshot() { return { v: 3, eras: Object.fromEntries(ERA_KEYS.map(k => [k, { skills: PS[k].skills, steps: PS[k].steps }])), settings: SET, rules: RULES, meta: META, tele: TELE }; }
// v0.2 kept one era (II) with meta.placed as a boolean and settings.start
function upgradeMeta(m, settings) {
  if (typeof m.placed === 'boolean') m.placed = m.placed ? { II: true } : {};
  m.placed = m.placed || {}; m.start = m.start || {};
  if (settings && settings.start && !m.start.II) m.start.II = settings.start;
  return m;
}
function loadLocal() {
  let o = null;
  try { o = JSON.parse(localStorage.getItem(LKEY) || 'null'); } catch (e) {}
  if (o && (o.v === 2 || o.v === 3)) {
    if (o.v === 2) { PS.II.skills = o.skills || {}; PS.II.steps = o.steps || {}; }
    else ERA_KEYS.forEach(k => { const e = (o.eras || {})[k] || {}; PS[k].skills = e.skills || {}; PS[k].steps = e.steps || {}; });
    SET.pace = (o.settings || {}).pace || SET.pace; SET.dial = (o.settings || {}).dial || SET.dial; SET.brave = !!(o.settings || {}).brave;
    RULES = Object.assign({ ...DEFAULT_RULES }, o.rules || {}); migrateSound(RULES); META = upgradeMeta(Object.assign(META, o.meta || {}), o.settings); Object.assign(TELE, o.tele || {});
    return true;
  }
  // migrate v0.1 House Rules (its progress was the Era IV demo, so only the rules carry over)
  try { const v1 = JSON.parse(localStorage.getItem('mathera-v01') || 'null'); if (v1 && v1.rules) migrateV1(v1.rules); } catch (e) {}
  return false;
}
function migrateV1(r) {
  ['hero', 'nemesis', 'units', 'stories', 'sound'].forEach(k => { if (r[k]) RULES[k] = r[k]; });
  if (r.pace && MM.PACE[r.pace]) SET.pace = r.pace;
}
function markDirty(unit) { dirty.add(unit); META.at[unit] = now(); save(); }
function save() {
  clearTimeout(saveT); saveT = setTimeout(flush, 700);
  try { localStorage.setItem(LKEY, JSON.stringify(snapshot())); } catch (e) {}
}
const packUnit = u => { const d = MM.unitDoc(PS[eraOf(u)], u), o = { at: META.at[u] || now(), skills: {}, steps: {} };
  for (const [k, v] of Object.entries(d.skills)) o.skills[enc(k)] = v; for (const [k, v] of Object.entries(d.steps)) o.steps[enc(k)] = v; return o; };
const unpackUnit = o => { const d = { skills: {}, steps: {} };
  for (const [k, v] of Object.entries(o.skills || {})) d.skills[dec(k)] = v; for (const [k, v] of Object.entries(o.steps || {})) d.steps[dec(k)] = v; return d; };
const unitDocId = u => 'unit-' + u.replace('.', '-');   // data/users/<uid>/unit-II-5 (a document: even path length)
async function flush() {
  if (!remote) { setSaved('Saved on this device'); return; }
  if (saving) { again = true; return; }
  saving = true;
  try {
    const units = [...dirty]; dirty.clear();
    for (const u of units) await db.doc(`data/users/${uid}/${unitDocId(u)}`).set(JSON.parse(JSON.stringify(packUnit(u))));
    await db.doc(`data/users/${uid}/settings`).set(JSON.parse(JSON.stringify({ v: 3, settings: SET, rules: RULES, meta: META })));
    setSaved('Saved to your account');
  } catch (e) {
    if (e && (e.code === 'invalid_argument' || e.code === 'not_granted')) { remote = false; setSaved('Saved on this device'); }
    else setSaved('Saved on this device; will sync when back online');
  }
  saving = false; if (again) { again = false; flush(); }
}
function setSaved(t) { ['savedHome', 'savedRules'].forEach(i => { const el = $(i); if (el) el.textContent = t; }); }
function teleSave() {
  clearTimeout(teleT);
  teleT = setTimeout(async () => {
    if (!db || !META.pseudo) return;
    const steps = {}; for (const [k, v] of Object.entries(TELE)) steps[enc(k)] = v;
    try { await db.doc(`telemetry/${META.pseudo}`).set({ v: 2, at: new Date().toISOString(), pace: SET.pace, dial: SET.dial, start: META.start, steps }); } catch (e) {}
  }, 4000);
}

/* ================= views ================= */
let view = 'land';
const VIEWS = ['loading', 'land', 'welcome', 'home', 'alarm', 'practice', 'id', 'rules'];
let toastT = 0;
function toast(msg) {
  const el = $('toast'); if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2200);
}
function show(v) {
  view = v; VIEWS.forEach(x => { const el = $('v-' + x); if (el) el.hidden = x !== v; });
  document.body.classList.toggle('land', v === 'land');
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-current', b.dataset.v === v || ((v === 'practice' || v === 'alarm') && b.dataset.v === 'home') ? 'page' : 'false'));
  if (v === 'land') renderLand();
  if (v === 'home') renderHome(); if (v === 'id') renderID(); if (v === 'rules') renderRules(); if (v === 'welcome') renderWelcome();
  window.scrollTo(0, 0);
}
$('tabs').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (view === 'practice') leavePractice(); show(!META.placed[era] && b.dataset.v === 'home' ? 'welcome' : b.dataset.v); });
$('brandBtn').addEventListener('click', () => { if (view === 'practice') leavePractice(); show('land'); });

/* ---- land homepage ---- */
function renderLand() {
  $('landPanels').innerHTML = ALL_ERAS.map(e => {
    const soon = !!e.soon || eraSoon(e.k);
    return `<button type="button" class="panel${soon ? ' locked' : ''}" data-era="${e.k}">
      <div class="panel-body">
        <div class="panel-num">${e.k}</div>
        <div class="panel-name">${e.name}</div>
        ${soon ? '<div class="panel-soon">Coming Soon</div>' : ''}
      </div>
    </button>`;
  }).join('');
}
$('landPanels').addEventListener('click', e => {
  const b = e.target.closest('button.panel[data-era]'); if (!b) return;
  enterEra(b.dataset.era);
});
function enterEra(k) {
  if (eraSoon(k)) { toast('Coming Soon — Era ' + k + ' arrives in Mathera 2.0'); return; }
  if (k !== era) { setEra(k); S = MM.session(); save(); }
  show(META.placed[k] ? 'home' : 'welcome');
}

/* ---- era switcher ---- */
function renderEraTabs(el) {
  $(el).innerHTML = ALL_ERAS.map(e => {
    const k = e.k;
    if (e.soon || eraSoon(k) || !PS[k]) return `<button type="button" class="soon" data-era="${k}"><b>Era ${k}</b> ${e.name}<small>Coming Soon</small></button>`;
    const c = MM.counts(PS[k], now());
    return `<button data-era="${k}" aria-pressed="${k === era}"><b>Era ${k}</b> ${ERAS[k].name}${META.placed[k] ? `<small>${c.proven + c.thirsty}/${PS[k].order.length}</small>` : ERAS[k].total ? `<small>${ERAS[k].units.length < ERAS[k].total ? `preview · ${ERAS[k].units.length}/${ERAS[k].total} units` : `new · ${PS[k].order.length} skills`}</small>` : ''}</button>`;
  }).join('');
}
function switchEra(k) {
  if (eraSoon(k)) { toast('Coming Soon — Era ' + k + ' arrives in Mathera 2.0'); return; }
  if (k === era) return;
  setEra(k); S = MM.session(); save(); show(META.placed[k] ? 'home' : 'welcome');
}
['eraTabs', 'welTabs'].forEach(id => $(id).addEventListener('click', e => { const b = e.target.closest('button[data-era]'); if (b) switchEra(b.dataset.era); }));

/* ---- welcome / placement ---- */
function renderWelcome() {
  $('welEra').textContent = `${eraLabel(era)} · ${SKILLS.length} skills`; renderEraTabs('welTabs');
  $('ulist').innerHTML = UNITS.map(([u, n], i) => `<button data-u="${u}"><b>${u}</b><span>${esc(n)}</span><small>${i === 0 ? 'The beginning: nothing inferred' : `${ORDER.findIndex(id => MM.unitOf(id) === u)} earlier skills start inferred`} · ${unitSkills(u).length} skills</small></button>`).join('');
  // Seed-tree preview (same SVG as home): upper eras used to look "empty" until placement
  if (!selUnit || !UNITS.some(([u]) => u === selUnit)) selUnit = UNITS[0] && UNITS[0][0];
  renderTree('welTreeSvg');
}
function placeAt(u) {
  // only leaves with no work yet are re-placed
  const cut = ORDER.findIndex(id => MM.unitOf(id) === u);
  ORDER.forEach((id, i) => { const s = MM.skillRec(P, id), worked = s.top || s.wilt || 'abcdef'.split('').some(k => (P.steps[id + '.' + k] || {}).n);
    if (worked) return; if (i < cut) s.inf = 1; else delete s.inf; });
  META.start[era] = u; META.placed[era] = true; selUnit = u;
  UNITS.forEach(([x]) => markDirty(x));
  show('home');
}
$('ulist').addEventListener('click', e => { const b = e.target.closest('button[data-u]'); if (b) placeAt(b.dataset.u); });
$('welTreeSvg').addEventListener('click', e => { const b = e.target.closest('.br'); if (b) placeAt(b.dataset.u); });
$('welTreeSvg').addEventListener('keydown', e => { const b = e.target.closest('.br'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); placeAt(b.dataset.u); } });

/* ---- tree ---- */
const STATE_WORD = { proven: 'Proven', planted: 'Planted', thirsty: 'Thirsty', withered: 'Withered', growing: 'Growing', inferred: 'Inferred', seed: 'Seed' };
const STATE_COL = { proven: 'var(--acc)', planted: 'var(--acc)', growing: 'var(--acc)', thirsty: 'var(--thirst)', withered: 'var(--wilt)', inferred: 'var(--acc)', seed: 'var(--faint)' };
function rng(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return () => { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
const leafCache = {};
function leafPath(seed) {
  if (leafCache[seed]) return leafCache[seed];
  const R = rng(seed), W = .3 + R() * .28, p = .3 + R() * .3, a = Math.log(.5) / Math.log(p), q = .7 + R() * .7, lobes = R() < .35 ? [3, 5, 7][Math.floor(R() * 3)] : 0, D = lobes ? .22 + R() * .28 : 0, teeth = R() < .5 ? Math.floor(12 + R() * 18) : 0, td = .05 + R() * .06;
  const w = t => { let v = W * Math.pow(Math.max(Math.sin(Math.PI * Math.pow(t, a)), 0), q); if (lobes) v *= 1 - D + D * Math.abs(Math.sin(lobes * Math.PI * t)); if (teeth) v *= 1 + td * (Math.abs((t * teeth) % 1 - .5) * 2 - .5); return v * 30; };
  const y = t => 52 - t * 47, Rr = [], Ll = []; for (let i = 0; i <= 30; i++) { const t = i / 30; Rr.push(`${(20 + w(t)).toFixed(1)} ${y(t).toFixed(1)}`); Ll.unshift(`${(20 - w(t)).toFixed(1)} ${y(t).toFixed(1)}`); }
  return (leafCache[seed] = `M20 52 L${Rr.join(' L')} L${Ll.join(' L')} Z`);
}
function braveMark(id) { const b = MM.braveEarned(P, id); if (!b.e && !b.f) return '';
  return b.f ? `<circle cx="0" cy="-6" r="3.6" fill="oklch(0.8 0.15 85)" stroke="oklch(0.55 0.12 70)" stroke-width="0.8"/>` : `<g transform="translate(0,-6)">${[0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-2.2" rx="1.5" ry="2.3" fill="oklch(0.85 0.09 350)" transform="rotate(${a})"/>`).join('')}<circle r="1.2" fill="oklch(0.75 0.14 85)"/></g>`; }
function leafSVG(id, st, g, scale) {
  if (st === 'seed') return `<ellipse cx="0" cy="0" rx="3.2" ry="2.4" fill="var(--faint)" transform="rotate(-20)"/>`;
  const col = STATE_COL[st];
  const fillPct = { proven: 70, planted: 45, growing: 28, thirsty: 45, withered: 40, inferred: 0 }[st];
  const fill = st === 'inferred' ? 'none' : `color-mix(in oklch, ${col} ${fillPct}%, transparent)`;
  const dash = st === 'inferred' ? ' stroke-dasharray="2.4 2"' : '';
  const droop = st === 'thirsty' ? 35 : st === 'withered' ? 80 : 0, sy = st === 'withered' ? .72 : 1;
  const sc = scale * (st === 'inferred' ? .9 : st === 'withered' ? .85 : g);
  return `<g transform="rotate(${droop}) scale(${sc.toFixed(3)},${(sc * sy).toFixed(3)}) translate(-20,-52)"><path d="${leafPath('skill-' + id)}" fill="${fill}" stroke="${col}" stroke-width="${(1.3 / sc * .5).toFixed(2)}"${dash}/></g>${braveMark(id)}`;
}
function renderTree(svgId) {
  const svg = $(svgId || 'treeSvg'); if (!svg) return;
  const W = 360, CX = 180, t = now();
  let g = `<path d="M${CX} 462 C${CX - 3} 380 ${CX + 3} 300 ${CX} 220 C${CX - 2} 150 ${CX + 2} 90 ${CX} 44" stroke="var(--bark)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M110 464 H250" stroke="var(--rule)" stroke-width="2"/>`;
  const NU = UNITS.length, gap = NU > 1 ? Math.min(46, 340 / (NU - 1)) : 46;
  UNITS.forEach(([u, name], i) => {
    const side = i % 2 ? 1 : -1, y0 = 430 - i * gap, L = 128;
    const sks = unitSkills(u), n = sks.length;
    let path, pt;
    if (side) {
      const x1 = CX + side * L, y1 = y0 - 46, cx = CX + side * L * .45, cy = y0 + 4;
      path = `M${CX} ${y0} Q${cx} ${cy} ${x1} ${y1}`;
      pt = s => { const a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; return [a * CX + b * cx + c * x1, a * y0 + b * cy + c * y1, Math.atan2(2 * (1 - s) * (cy - y0) + 2 * s * (y1 - cy), 2 * (1 - s) * (cx - CX) + 2 * s * (x1 - cx))]; };
    } else {
      path = `M${CX} ${y0 + 20} L${CX} ${y0 - 34}`;
      pt = s => [CX, y0 + 20 - 54 * s, -Math.PI / 2];
    }
    const sel = u === selUnit;
    let leaves = '';
    sks.forEach((sk, j) => {
      const s = side ? .16 + .82 * (j + .5) / n : .1 + .9 * (j + .5) / n;
      const [x, y, ang] = pt(s), alt = j % 2 ? 1 : -1, off = side ? 7 : 9;
      const nx = -Math.sin(ang) * alt * off, ny = Math.cos(ang) * alt * off;
      const st = MM.state(P, sk.id, t), gr = MM.growth(P, sk.id);
      const rot = ang * 180 / Math.PI + 90 + alt * 55;
      leaves += `<g transform="translate(${(x + nx).toFixed(1)},${(y + ny).toFixed(1)}) rotate(${rot.toFixed(0)})">${leafSVG(sk.id, st, gr, .4)}</g>`;
    });
    const tip = side ? pt(1) : [CX, y0 - 40];
    const lx = side ? tip[0] + side * 4 : CX + 16, ly = side ? tip[1] - 4 : y0 - 30;
    g += `<g class="br ${sel ? 'sel' : ''}" data-u="${u}" tabindex="0" role="button" aria-label="${u} ${esc(name)}: ${MM.counts ? sks.filter(k => MM.proven(P, k.id)).length : 0} of ${n} proven. Show its skills.">
      <path class="hitz" d="${path}" stroke="transparent" stroke-width="34" fill="none"/>
      <path class="bline" d="${path}" stroke="var(--bark)" stroke-width="${side ? 3.5 : 0}" fill="none" stroke-linecap="round"/>${leaves}
      <text x="${lx.toFixed(0)}" y="${ly.toFixed(0)}" text-anchor="${side === 1 ? 'end' : side === -1 ? 'start' : 'start'}" font-family="Spline Sans Mono, monospace" font-size="10" fill="${sel ? 'var(--acc)' : 'var(--muted)'}" ${side ? `transform="translate(${side === 1 ? 12 : -12},-8)"` : ''}>${u.split('.')[1]}</text></g>`;
  });
  svg.innerHTML = g;
}
$('treeSvg').addEventListener('click', e => { const b = e.target.closest('.br'); if (b) selectUnit(b.dataset.u, true); });
$('treeSvg').addEventListener('keydown', e => { const b = e.target.closest('.br'); if (b && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectUnit(b.dataset.u, true); } });
let selUnit = 'II.1';
function selectUnit(u, scroll) { selUnit = u; renderTree(); renderUnitPanel(); if (scroll) $('upTitle').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function renderUnitPanel() {
  const t = now(), sks = unitSkills(selUnit);
  $('upTitle').textContent = `${selUnit} · ${UNAME[selUnit]}`;
  $('upCount').textContent = `${sks.filter(k => MM.proven(P, k.id)).length} of ${sks.length} proven`;
  $('upick').innerHTML = UNITS.map(([u]) => `<button data-u="${u}" aria-pressed="${u === selUnit}">${u}</button>`).join('');
  const sb = $('upick').querySelector('[aria-pressed="true"]'); if (sb) $('upick').scrollLeft = sb.offsetLeft - $('upick').offsetLeft - 40;
  $('upList').innerHTML = sks.map(sk => { const st = MM.state(P, sk.id, t);
    const dot = st === 'inferred' ? `border:1.5px dashed var(--acc)` : st === 'seed' ? 'background:var(--rule)' : `background:color-mix(in oklch, ${STATE_COL[st]} ${st === 'growing' ? 35 : 80}%, transparent)`;
    return `<button class="r" data-sk="${sk.id}"><i class="dot" style="${dot}"></i><span><span class="id">${sk.id.split('.').slice(1).join('.')}</span>${esc(sk.name)}</span><span class="chip st-${st}">${STATE_WORD[st]}${st === 'growing' || st === 'planted' ? ' · ' + MM.curStep(P, sk.id) : ''}${(b => b.f ? ' ★★' : b.e ? ' ★' : '')(MM.braveEarned(P, sk.id))}</span></button>`; }).join('');
}
$('upick').addEventListener('click', e => { const b = e.target.closest('button[data-u]'); if (b) selectUnit(b.dataset.u); });
$('upList').addEventListener('click', e => { const b = e.target.closest('.r[data-sk]'); if (b) startFocus(b.dataset.sk); });

const hasInv = inv => { const Px = PS[eraOf(inv.u)]; const sks = unitSkills(inv.u); return sks.filter(k => MM.proven(Px, k.id)).length >= Math.ceil(sks.length / 2); };
function shelfHTML() { return eraInv().map(inv => { const has = hasInv(inv); return `<div class="inv ${has ? '' : 'locked'}" title="${esc(inv.what)}">${icon(inv.id)}<b>${has ? esc(inv.name) : '???'}</b><small>${has ? esc(inv.what) : 'Prove half of ' + inv.u}</small></div>`; }).join(''); }
function fmtDur(ms) {
  const h = ms / 36e5, d = ms / 864e5;
  if (h < 1) return 'under an hour'; if (h < 20) return `${Math.round(h)} hour${Math.round(h) > 1 ? 's' : ''}`;
  if (d < 6.5) return `${Math.round(d)} day${Math.round(d) > 1 ? 's' : ''}`; if (d < 26) return `${Math.round(d / 7)} week${Math.round(d / 7) > 1 ? 's' : ''}`;
  if (d < 330) return `${Math.round(d / 30)} month${Math.round(d / 30) > 1 ? 's' : ''}`; return 'a year';
}
function renderHome() {
  const t = now(); MM.tick(P, t);
  $('whoLine').innerHTML = `<b>${esc(hero())}</b>`;
  const n = nem(); $('vsLine').textContent = `vs. ${n[1]}, ${n[2]}`;
  const c = MM.counts(P, t);
  $('homeCount').textContent = `${c.proven + c.thirsty} of ${ORDER.length} proven`;
  renderEraTabs('eraTabs');
  renderTree(); renderUnitPanel();
  $('legend').innerHTML = [['seed', 'var(--faint)'], ['growing', 'color-mix(in oklch,var(--acc) 35%,transparent)'], ['proven', 'var(--acc)'], ['thirsty', 'var(--thirst)'], ['withered', 'var(--wilt)']].map(([k, col]) => `<span><i style="background:${col}"></i>${k}${c[k] ? ' ' + c[k] : ''}</span>`).join('') + `<span><i style="border:1.5px dashed var(--acc)"></i>inferred${c.inferred ? ' ' + c.inferred : ''}</span>`;
  const w = MM.withered(P).length, th = c.thirsty;
  $('contBtn').classList.toggle('alarm', w > 0);
  $('contBtn').textContent = w ? 'Continue · garden alert' : 'Continue';
  let line;
  if (w) line = `${w > 1 ? w + ' leaves' : '1 leaf'} withered. Continue starts an Intervention.`;
  else if (th) line = `${th > 1 ? th + ' leaves are' : '1 leaf is'} thirsty and will come up for watering.`;
  else { const q = MM.next(P, MM.session(), t); const sk = q && BY[q.id]; line = sk ? `Next up: ${sk.name}, step ${q.step}` : 'Pick a branch to begin.';
    const dues = ORDER.map(id => (P.skills[id] || {}).due).filter(Boolean); if (sk && dues.length) line += ` · next watering in ${fmtDur(Math.min(...dues) - t)}`; }
  $('nextLine').textContent = line;
  $('shelf').innerHTML = shelfHTML();
  $('invCount').textContent = `${eraInv().filter(hasInv).length} of ${eraInv().length}`;
}

/* ---- ID card ---- */
function renderID() {
  const t = now(), c = MM.counts(P, t);
  $('idHero').textContent = hero();
  $('idDate').textContent = `${eraLabel(era)} · as of ${new Date(t).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
  const bc = MM.braveCounts(P), hasB = P.braveIds && P.braveIds.size;
  $('idCounts').innerHTML = [...(hasB ? [['★ Brave', bc.e], ['★★ Legend', bc.f]] : []), ['Proven', c.proven], ['Growing', c.planted + c.growing], ['Thirsty', c.thirsty], ['Withered', c.withered], ['Inferred', c.inferred], ['Seed', c.seed]].map(([l, n]) => `<div><b>${n}</b><span>${l}</span></div>`).join('');
  $('idUnits').innerHTML = UNITS.map(([u, name]) => { const sks = unitSkills(u), n = sks.length, st = sks.map(k => MM.state(P, k.id, t));
    const seg = (k, col) => { const x = st.filter(s => k.includes(s)).length; return x ? `<i style="width:${100 * x / n}%;background:${col}"></i>` : ''; };
    return `<div class="ubar"><span>${u} ${esc(name)}</span><span class="bar">${seg(['proven'], 'var(--acc)')}${seg(['thirsty'], 'var(--thirst)')}${seg(['planted', 'growing'], 'color-mix(in oklch,var(--acc) 35%,transparent)')}${seg(['withered'], 'var(--wilt)')}</span><span class="n">${st.filter(s => s === 'proven' || s === 'thirsty').length}/${n}</span></div>`; }).join('');
  $('idShelf').innerHTML = shelfHTML(); $('idInvN').textContent = `${eraInv().filter(hasInv).length} of ${eraInv().length}`;
}

/* ---- House Rules ---- */
function seg(el, opts, cur, onpick) { $(el).innerHTML = opts.map(([v, l]) => `<button data-v="${v}" aria-pressed="${v === cur}">${l}</button>`).join(''); $(el).onclick = e => { const b = e.target.closest('button'); if (!b) return; onpick(b.dataset.v); saveRules(); renderRules(); }; }
function saveRules() { save(); }
function dialDesc(d) { return `First watering after ${fmtDur(MM.interval(0, d))}, the longest gap ${fmtDur(MM.interval(6, d))}. 5 is the standard spacing; 10 is for people who love repetition.`; }
function renderRules() {
  $('rHero').innerHTML = HEROES.map(([v, l]) => `<option value="${v}" ${v === RULES.hero ? 'selected' : ''}>${esc(l)}</option>`).join('');
  $('rNem').innerHTML = NEMESES.map(([v, n, d]) => `<option value="${v}" ${v === RULES.nemesis ? 'selected' : ''}>${esc(n)}, ${esc(d)}</option>`).join('');
  seg('rPace', Object.entries(MM.PACE).map(([k, p]) => [k, p.name]), SET.pace, v => SET.pace = v); $('rPaceDesc').textContent = MM.PACE[SET.pace].desc;
  $('rDial').value = SET.dial; $('rDialV').textContent = SET.dial; $('rDialDesc').textContent = dialDesc(SET.dial);
  $('replaceBtn').textContent = `Choose a different starting unit for ${eraLabel(era)}`; $('resetBtn').textContent = armed ? $('resetBtn').textContent : `Reset my ${eraLabel(era)} progress`;
  seg('rCoins', [['US', 'US $'], ['THB', 'Thai ฿']], RULES.coins, v => RULES.coins = v);
  seg('rUnits', [['metric', 'Metric'], ['imperial', 'Imperial']], RULES.units, v => RULES.units = v);
  seg('rClock', [['12h', '12-hour'], ['24h', '24-hour']], RULES.clock, v => RULES.clock = v);
  seg('rStories', [['on', 'On'], ['off', 'Off']], RULES.stories, v => RULES.stories = v);
  seg('rSfx', [['on', 'On'], ['off', 'Off']], RULES.sfx, v => { RULES.sfx = v; if (v === 'on') { unlockAudio(); sfx('right'); syncFocus(); } else stopFocus(); });
  seg('rBrave', [['off', 'Off'], ['on', 'On']], SET.brave ? 'on' : 'off', v => { SET.brave = v === 'on'; });
  seg('rSound', [['off', 'Off'], ['white', 'White'], ['lofi-a', 'Lo-fi A'], ['lofi-b', 'Lo-fi B']], RULES.sound, v => { RULES.sound = v; unlockAudio(); syncFocus(); });
}
$('rDial').addEventListener('input', e => { SET.dial = +e.target.value; $('rDialV').textContent = SET.dial; $('rDialDesc').textContent = dialDesc(SET.dial); });
$('rDial').addEventListener('change', saveRules);
$('rHero').addEventListener('change', e => { RULES.hero = e.target.value; saveRules(); });
$('rNem').addEventListener('change', e => { RULES.nemesis = e.target.value; saveRules(); });
$('replaceBtn').addEventListener('click', () => show('welcome'));
let armed = false;
$('resetBtn').addEventListener('click', () => {
  if (!armed) { armed = true; $('resetBtn').classList.add('arm'); $('resetBtn').textContent = 'Tap again to erase your progress'; setTimeout(() => { armed = false; $('resetBtn').classList.remove('arm'); $('resetBtn').textContent = `Reset my ${eraLabel(era)} progress`; }, 4000); return; }
  P.skills = {}; P.steps = {}; delete META.start[era]; META.placed[era] = false; S = MM.session(); armed = false;
  UNITS.forEach(([u]) => markDirty(u));
  $('resetBtn').classList.remove('arm'); $('resetBtn').textContent = 'Progress reset';
  show('welcome');
});

/* ================= sound (experimental Web Audio; no MP3 deps) ================= */
let ac = null, masterGain = null, sfxBus = null, focusBus = null, focusNodes = [];
function migrateSound(r) {
  if (r.sound === 'pink') r.sound = 'lofi-a';
  else if (r.sound === 'brown') r.sound = 'lofi-b';
}
function preferQuiet() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function soundOn() { return RULES.sfx === 'on'; }
function actx() {
  if (!ac) {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ac.createGain(); masterGain.gain.value = 1; masterGain.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.gain.value = 0.14; sfxBus.connect(masterGain);
    focusBus = ac.createGain(); focusBus.gain.value = 0.04; focusBus.connect(masterGain);
  }
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  return ac;
}
function unlockAudio() { try { actx(); } catch (e) {} }
['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, unlockAudio, { passive: true }));

function stopFocus() {
  focusNodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
  focusNodes = [];
}
function noiseBuf(kind, secs) {
  const a = actx(), n = Math.floor(a.sampleRate * secs), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const w = Math.random() * 2 - 1;
    if (kind === 'white') d[i] = w * 0.55;
    else if (kind === 'pink') {
      b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
      b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926;
    } else { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
  }
  return buf;
}
function startLoop(buf, dest, filterHz) {
  const a = actx(), src = a.createBufferSource();
  src.buffer = buf; src.loop = true;
  let node = src;
  if (filterHz) {
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filterHz; f.Q.value = 0.7;
    src.connect(f); node = f;
  }
  const g = a.createGain(); g.gain.value = 1;
  node.connect(g); g.connect(dest); src.start();
  focusNodes.push(src);
  return src;
}
function startPad(freqs, dest, baseVol, lfoHz) {
  const a = actx();
  freqs.forEach((f, i) => {
    const o = a.createOscillator(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.value = baseVol;
    lfo.type = 'sine'; lfo.frequency.value = lfoHz + i * 0.015;
    lg.gain.value = baseVol * 0.55;
    lfo.connect(lg); lg.connect(g.gain);
    o.connect(g); g.connect(dest);
    o.start(); lfo.start();
    focusNodes.push(o, lfo);
  });
}
function syncFocus() {
  stopFocus();
  if (!soundOn() || view !== 'practice' || RULES.sound === 'off' || preferQuiet()) return;
  try {
    const a = actx(), kind = RULES.sound;
    if (kind === 'white') startLoop(noiseBuf('white', 3), focusBus, 0);
    else if (kind === 'lofi-a') {
      // soft dust + warm major pad (wordless)
      startLoop(noiseBuf('brown', 4), focusBus, 720);
      startPad([196.0, 246.94, 293.66, 392.0], focusBus, 0.028, 0.07);
      // sparse vinyl ticks via tiny noise blips scheduled into a looping buffer of mostly silence
      const n = Math.floor(a.sampleRate * 6), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (let k = 0; k < 14; k++) {
        const at = Math.floor(Math.random() * (n - 200));
        for (let j = 0; j < 40; j++) d[at + j] += (Math.random() * 2 - 1) * 0.08 * (1 - j / 40);
      }
      startLoop(buf, focusBus, 2400);
    } else if (kind === 'lofi-b') {
      // rainier pink bed + cooler minor-ish pad
      startLoop(noiseBuf('pink', 4), focusBus, 1400);
      startPad([174.61, 220.0, 261.63, 329.63], focusBus, 0.022, 0.05);
    }
  } catch (e) {}
}

function tone(f, t0, dur, type, vol) {
  const a = actx(), o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine'; o.frequency.value = f;
  const t = a.currentTime + t0;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.5), t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.04);
}
function noiseBurst(dur, vol, hp) {
  const a = actx(), buf = noiseBuf('white', Math.max(0.02, dur + 0.02));
  const src = a.createBufferSource(); src.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = hp || 1800; f.Q.value = 0.8;
  const g = a.createGain(); const t = a.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(sfxBus); src.start(t); src.stop(t + dur + 0.02);
}
function clack() {
  if (!soundOn() || preferQuiet()) return;
  try {
    const f = 1100 + Math.random() * 900;
    tone(f, 0, 0.016 + Math.random() * 0.01, 'square', 0.035 + Math.random() * 0.025);
    noiseBurst(0.012, 0.06, 2200 + Math.random() * 1800);
  } catch (e) {}
}
function crunch() {
  // 80s desk-calculator hard return / number-crunch
  try {
    tone(980, 0, 0.05, 'square', 0.2);
    tone(490, 0.045, 0.07, 'square', 0.14);
    noiseBurst(0.035, 0.16, 900);
    tone(740, 0.08, 0.04, 'square', 0.08);
  } catch (e) {}
}
function cash() {
  // ca-ching register
  try {
    noiseBurst(0.04, 0.22, 1600);
    tone(1318.5, 0.04, 0.28, 'triangle', 0.42);
    tone(2637, 0.04, 0.12, 'sine', 0.14);
    tone(1046.5, 0.12, 0.4, 'triangle', 0.28);
    tone(1568, 0.16, 0.28, 'sine', 0.12);
  } catch (e) {}
}
const MISS_FX = [
  () => { tone(247, 0, 0.22, 'sine', 0.22); tone(196, 0.12, 0.3, 'sine', 0.17); },
  () => { tone(294, 0, 0.14, 'triangle', 0.18); tone(233, 0.1, 0.26, 'sine', 0.16); },
  () => { tone(185, 0, 0.34, 'sine', 0.18); },
  () => { tone(311, 0, 0.08, 'triangle', 0.14); tone(247, 0.1, 0.22, 'sine', 0.16); },
];
function missSfx(ev) {
  const has = t => (ev || []).some(e => e.type === t);
  try {
    if (has('slid') || has('eased')) MISS_FX[0]();
    else if (has('dry') || has('resting')) MISS_FX[2]();
    else if (has('unconfirmed') || has('kept')) MISS_FX[1]();
    else pick(MISS_FX)();
  } catch (e) {}
}
function sfx(kind, ev) {
  if (!soundOn()) return;
  try {
    unlockAudio();
    if (kind === 'crunch') crunch();
    else if (kind === 'clack') clack();
    else if (kind === 'right' || kind === 'drop') cash();
    else if (kind === 'miss') missSfx(ev);
    else if (kind === 'plant') { cash(); [659, 784, 1047].forEach((f, i) => tone(f, 0.22 + i * 0.08, 0.35, 'triangle', 0.28)); }
    else if (kind === 'proven') { cash(); [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2 + i * 0.07, 0.5, 'triangle', 0.28)); }
    else if (kind === 'alarm') for (let i = 0; i < 4; i++) { tone(880, i * 0.28, 0.13, 'square', 0.12); tone(660, i * 0.28 + 0.14, 0.13, 'square', 0.12); }
    else if (kind === 'print') { tone(1800, 0, 0.03, 'square', 0.08); tone(1200, 0.035, 0.03, 'square', 0.06); }
  } catch (e) {}
}

/* ================= practice ================= */
let FORCE = null, cur = null, q = null, picked = null, oseq = [], checked = false, flashT = null, t0 = 0, focusId = null, calcOpen = false, hintOpen = false, target = 0, lastEv = [];
function startContinue() {
  focusId = null; S = MM.session(); MM.tick(P, now());
  if (MM.alarmDue(P, S, true)) return openAlarm();
  enterPractice();
}
function startFocus(id) {
  focusId = id; S = MM.session(); MM.tick(P, now());
  if ((P.skills[id] || {}).wilt) { MM.startIntervention(P, S, now(), id); sfx('alarm'); }
  enterPractice();
}
function openAlarm() {
  const w = MM.withered(P), take = w.slice(0, MM.IV_CAP);
  $('alarmText').textContent = `${w.length > 1 ? w.length + ' leaves have' : 'A leaf has'} dried out. We'll water ${take.length === w.length ? (take.length > 1 ? 'them' : 'it') : 'the first ' + take.length} now: three right answers each, starting easy.`;
  $('alarmLeaves').innerHTML = take.map(id => `<span class="chip st-withered">${esc(BY[id].name)}</span>`).join('');
  show('alarm'); const c = $('alarmCard'); c.classList.remove('go-shake'); void c.offsetWidth; c.classList.add('go-shake'); sfx('alarm');
}
$('alarmGo').addEventListener('click', () => { MM.startIntervention(P, S, now()); enterPractice(); });
$('alarmLater').addEventListener('click', () => show('home'));
$('contBtn').addEventListener('click', startContinue);
function enterPractice() { show('practice'); $('savedCard').hidden = true; syncFocus(); newQ(); }
function leavePractice() { closeCalc(); clearTimeout(flashT); stopFocus(); }
$('backBtn').addEventListener('click', () => { leavePractice(); show('home'); });

const STEP_IDX = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };
function modeLabel(m) { return { learn: 'new', review: 'watering', confirm: 'quick check', iv: 'intervention', practice: 'practice', brave: 'master quest' }[m]; }
function renderIvBar() {
  if (!S.iv) { $('ivbar').hidden = true; return; }
  const L = S.iv.leaves, saved = L.filter(l => l.done === 'saved').length;
  $('ivbar').innerHTML = `<b>Intervention</b><span>${saved} of ${L.length} saved</span><span class="drops" aria-hidden="true">${L.map(l => [0, 1, 2].map(i => `<i class="${l.done === 'saved' || i < l.k ? 'on' : ''}"></i>`).join('')).join('<i class="sep"></i>')}</span>`;
  $('ivbar').hidden = false;
}
function speak() {
  if (!window.speechSynthesis) { setMsg('Read aloud is not available in this browser.', true); return; }
  speechSynthesis.cancel(); const div = document.createElement('div'); div.innerHTML = q.prompt;
  div.querySelectorAll('.fr').forEach(f => { const n = f.querySelector('sup'), d = f.querySelector('sub'); if (n && d) f.textContent = ` ${n.textContent} over ${d.textContent} `; });
  let text = div.textContent.replace(/−/g, ' minus ').replace(/\+/g, ' plus ').replace(/=/g, ' equals ').replace(/×/g, ' times ').replace(/÷/g, ' divided by ');
  if (q.kind === 'choice' && q.choices.every(c => !c.trim().startsWith('<svg'))) { const d = document.createElement('div'); text += ' ' + q.choices.map(c => { d.innerHTML = c; return d.textContent; }).join(', or ') + '.'; }
  const u = new SpeechSynthesisUtterance(text); u.rate = .9; speechSynthesis.speak(u);
}
function newQ() {
  clearTimeout(flashT); if (window.speechSynthesis) speechSynthesis.cancel();
  if (S.iv && !MM.ivActive(S) && !focusId) S.iv = null;
  if (!focusId && !MM.ivActive(S) && MM.alarmDue(P, S, false)) return openAlarm();
  cur = MM.next(P, S, now(), MM.ivActive(S) ? null : focusId);
  if (FORCE) { cur = FORCE; FORCE = null; }                 // test hook: render one exact step
  if (focusId && !MM.ivActive(S) && S.iv) { S.iv = null; }
  const sk = BY[cur.id], seed = 1 + Math.floor(Math.random() * 99999);
  cur.seed = seed;
  const E = ENG(cur.id);
  try { q = sk.steps[cur.step].g(E.rng(seed), OPTS()); E.validate && E.validate(q, cur.id + '.' + cur.step); }
  catch (err) { q = { prompt: 'This question failed to build. Please report it with the code below.', kind: 'choice', choices: ['OK'], ans: 0, explain: esc(err.message) }; }
  picked = null; oseq = []; checked = false; hintOpen = false; target = 0;
  const s = P.skills[cur.id] || {}, u = MM.unitOf(cur.id);
  $('pSkill').innerHTML = `${esc(sk.name)}<small>${u} ${esc(UNAME[u])} · ${focusId ? 'focused' : 'continue'}</small>`;
  renderIvBar();
  const k = cur.step, stepRec = P.steps[cur.id + '.' + k] || {};
  const need = cur.mode === 'brave' ? MM.BRAVE_RUN : 3;
  const streak = cur.mode === 'learn' || cur.mode === 'brave' ? `<span class="streak" title="${stepRec.k || 0} of ${need} in a row">${Array.from({ length: need }, (_, i) => `<i class="${i < (stepRec.k || 0) ? 'on' : ''}"></i>`).join('')}</span>` : '';
  const brave = k === 'e' || k === 'f';
  $('qStep').innerHTML = brave ? `<span class="bravetag">${BRAVE_NAME[k]}</span>${esc(sk.steps[k].t)}` : `<span class="pips">${[1, 2, 3, 4].map(i => `<b class="${i <= STEP_IDX[k] ? 'on' : ''}"></b>`).join('')}</span>Step ${k} · ${esc(sk.steps[k].t)}`;
  $('qMode').innerHTML = `<span class="mode ${cur.mode === 'review' ? 'review' : cur.mode === 'iv' ? 'iv' : cur.mode === 'brave' ? 'brave' : ''}">${modeLabel(cur.mode)}</span>${streak}`;
  $('qcard').classList.toggle('bravecard', brave);
  if (R().stories === 'on' && cur.mode === 'learn' && Math.random() < .3) { $('story').textContent = pick(STORY)(nem()[1], heroShort()); $('story').hidden = false; } else $('story').hidden = true;
  $('prompt').innerHTML = q.prompt;
  const v = $('visual'); v.hidden = !q.visual; v.innerHTML = q.visual || '';
  if (q.visual && q.flash) flashT = setTimeout(() => { if (!checked) v.innerHTML = '<span class="gone">The picture is hidden. Make your best guess.</span>'; }, q.flash);
  const a = $('answers');
  if (q.kind === 'order') { oseq = [...Array(q.fixed || 0).keys()]; a.className = 'orderq'; renderOrder(); }
  else if (q.kind === 'choice') { a.className = 'answers'; a.innerHTML = q.choices.map((c, i) => `<button class="choice" type="button" data-i="${i}">${c.trim().startsWith('<svg') || eraOf(cur.id) !== 'I' ? c : esc(c)}</button>`).join(''); }
  else {
    a.className = 'fields';
    const up = UPPER(eraOf(cur.id));
    a.innerHTML = q.fields.map((f, i) => { const kd = kindOf(f), wide = kd ? Math.max(9, String(SHOWV(cur.id, f)).length + 3) : null;
      return `<label class="field${up ? ' upf' : ''}">${f.label ? `<span>${esc(f.label)}</span>` : ''}<span class="inbox"><input id="f${i}" inputmode="${(kd || f.frac || f.expr !== undefined || f.ans < 0 || f.dp !== undefined) ? 'text' : (Number.isInteger(f.ans) ? 'numeric' : 'decimal')}" style="${kd ? `width:${Math.min(22, wide)}ch` : f.expr !== undefined ? 'width:11ch' : f.frac ? 'width:6.5ch' : `width:${Math.max(5.4, String(SHOWV(cur.id, f)).length + 2)}ch`}" ${kd ? `placeholder="${esc(PLACEHOLDER[kd])}"` : f.expr !== undefined ? 'placeholder="e.g. 3x + 2"' : ''} autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${esc((f.label || 'Answer').replace(/<[^>]+>/g, ''))}">${up ? `<span class="pv" id="pv${i}" aria-hidden="true"></span>` : ''}</span></label>`; }).join('');
    if (up) a.insertAdjacentHTML('beforeend', `<div class="mkeys" id="mkeys">${['√', 'π', '^', '(', ')', '∞', '≤', '≥', '∪', '±', 'i', '/'].map(k => `<button type="button" data-mk="${k}" tabindex="-1">${k}</button>`).join('')}</div>`);
  }
  fixFr($('prompt')); fixFr(a);
  $('msg').textContent = ''; $('msg').className = 'msg';
  $('fb').hidden = true; $('fb').innerHTML = ''; $('react').hidden = true;
  $('react').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
  $('go').textContent = 'Check'; $('go').className = 'go' + (cur.mode === 'iv' ? ' iv' : '');
  $('hintBox').hidden = true; $('rbox').hidden = true; $('reportBtn').hidden = false; $('reportBtn').textContent = 'Report a mistake';
  $('qCode').textContent = `${cur.id}.${cur.step}.${seed}`;
  renderTools();
  if (calcOpen && !calcAllowed()) closeCalc();
  paintTarget();
  t0 = now();
  if (q.kind === 'num') { const f = $('f0'); if (f && window.matchMedia('(hover:hover)').matches) f.focus({ preventScroll: true }); }
}
function calcAllowed() { const u = MM.unitOf(cur.id); if (FACTS.has(cur.id) || eraOf(cur.id) === 'I') return false; return CALC_UNITS.has(u) || MM.proven(P, cur.id); }
function renderTools() {
  const t = [];
  if (q.kind === 'num') t.push(calcAllowed() ? `<button class="tool" id="calcBtn" aria-pressed="${calcOpen}">Calculator</button>` : `<button class="tool locked" id="calcBtn" aria-disabled="true">Calculator locked</button>`);
  t.push(`<button class="tool" id="speakBtn">Read aloud</button>`);
  if (MM.PACE[SET.pace].hint && STONES[cur.id] && cur.mode !== 'iv') t.push(`<button class="tool" id="hintBtn" aria-pressed="${hintOpen}">Hint</button>`);
  $('tools').innerHTML = t.join(''); $('tools').hidden = !t.length;
}
$('tools').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.id === 'calcBtn') {
    if (!calcAllowed()) { setMsg(eraOf(cur.id) === 'I' ? 'Era I is for counting in your head and on your fingers, so no calculator here.' : FACTS.has(cur.id) ? 'Facts live in your memory, so no calculator here.' : 'The calculator unlocks for this skill once you prove it by hand.', true); return; }
    calcOpen ? closeCalc() : openCalc();
  }
  if (b.id === 'speakBtn') { speak(); return; }
  if (b.id === 'hintBtn') { hintOpen = !hintOpen; $('hintBox').innerHTML = STONES[cur.id]; $('hintBox').hidden = !hintOpen; b.setAttribute('aria-pressed', hintOpen); }
});
function setMsg(t, info) { $('msg').innerHTML = t; $('msg').className = 'msg' + (info ? ' info' : ''); }
function renderOrder(marks) {
  const a = $('answers'), fx = q.fixed || 0;
  const seq = oseq.map((i, j) => `<li class="oit${j < fx ? ' fixed' : ''}${marks ? (marks[j] ? ' right' : ' wrong') : ''}"><button type="button" data-o="${j}" ${j < fx || checked ? 'disabled' : ''}><span class="on">${j + 1}</span><span>${q.items[i]}</span></button></li>`).join('');
  const pool = q.items.map((c, i) => oseq.includes(i) ? '' : `<button type="button" class="opick" data-p="${i}">${c}</button>`).join('');
  a.innerHTML = `<p class="ohint">${checked ? '' : oseq.length === q.items.length ? 'All placed. Tap a step to take it back, or Check.' : oseq.length > fx ? 'Tap the next step.' : 'Tap the steps in order.'}</p><ol class="oseq">${seq || '<li class="oempty">Your order appears here</li>'}</ol>${pool ? `<div class="opool">${pool}</div>` : ''}`;
  fixFr(a);
}
$('answers').addEventListener('click', e => {
  if (!q || q.kind !== 'order' || checked) return;
  const p = e.target.closest('.opick'), o = e.target.closest('[data-o]');
  if (p) { oseq.push(+p.dataset.p); renderOrder(); setMsg(''); }
  else if (o && +o.dataset.o >= (q.fixed || 0)) { oseq.splice(+o.dataset.o, 1); renderOrder(); }
});
$('answers').addEventListener('click', e => { const b = e.target.closest('.choice'); if (!b || checked) return; picked = +b.dataset.i; document.querySelectorAll('.choice').forEach(x => x.classList.toggle('sel', x === b)); setMsg(''); });
$('answers').addEventListener('focusin', e => { const m = /^f(\d+)$/.exec(e.target.id || ''); if (m) { target = +m[1]; paintTarget(); } });
$('answers').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); return; } if (e.target.tagName === 'INPUT' && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) clack(); });
let lastInput = 0;
$('answers').addEventListener('mousedown', e => { if (e.target.closest('.mkeys button')) e.preventDefault(); });
$('answers').addEventListener('click', e => { const b = e.target.closest('.mkeys button'); if (!b || checked) return;
  const inp = $('f' + lastInput) || $('f0'); if (!inp) return; const k = b.dataset.mk, ins = k === '√' ? '√(' : k;
  const s0 = inp.selectionStart ?? inp.value.length, s1 = inp.selectionEnd ?? s0; inp.value = inp.value.slice(0, s0) + ins + inp.value.slice(s1); inp.focus(); inp.setSelectionRange(s0 + ins.length, s0 + ins.length); preview(inp); clack(); });
$('answers').addEventListener('input', e => { if (e.target.tagName === 'INPUT') preview(e.target); });
$('answers').addEventListener('focusin', e => { const m = /^f(\d+)$/.exec(e.target.id || ''); if (m) lastInput = +m[1]; });
function preview(inp) {
  const i = inp.id.slice(1), pv = $('pv' + i); if (!pv || !q || q.kind !== 'num') return;
  const v = inp.value.trim(); if (!v || !/[√π^∞≤≥∪±*\/()a-zA-Z]/.test(v)) { pv.innerHTML = ''; return; }
  try { const f = q.fields[+i], kd = kindOf(f); const txt = kd === 'interval' ? v.replace(/<=/g, '≤').replace(/>=/g, '≥') : v; const m = kd === 'interval' ? esc(ENG(cur.id).pt(txt)) : ENG(cur.id).mx(txt, { complex: kd === 'complex' || kd === 'set' }); pv.innerHTML = /<mtext>/.test(m) ? '' : m; } catch (err) { pv.innerHTML = ''; }
}
function paintTarget() { document.querySelectorAll('#answers input').forEach((inp, i) => inp.classList.toggle('target', calcOpen && i === target && !checked)); }

const PRAISE = ['Correct', 'Yes!', 'Nailed it', 'Exactly', 'Spot on', 'That\'s it', 'Right'];
function showF(f) {
  const lab = (f.label || '').trim(), money = /[$฿]/.test(lab) && !f.frac && f.expr === undefined && typeof f.ans === 'number';
  if (money) { const v = Math.abs(f.ans).toFixed(2), sg = f.ans < 0 ? MINUS : ''; return /^[$฿]$/.test(lab) ? sg + lab + v : esc(lab) + ' ' + sg + v; }
  const E = ENG(cur.id); return (lab ? esc(lab) + ' ' : '') + (E.showHTML ? E.showHTML(f) : esc(SHOWV(cur.id, f)));
}
function check() {
  let ok, typed = '';
  if (q.kind === 'order') {
    if (oseq.length !== q.items.length) { setMsg('Place every step first.'); return; }
    ok = ENG(cur.id).checkOrder(q, oseq); typed = oseq.join(',');
    checked = true; const best = [q.ans, ...(q.alts || [])].map(a => a.filter((x, i) => x === oseq[i]).length), A = [q.ans, ...(q.alts || [])][best.indexOf(Math.max(...best))];
    renderOrder(oseq.map((x, i) => x === A[i]));
  } else if (q.kind === 'choice') {
    if (picked == null) { setMsg('Pick an answer first.'); return; }
    ok = picked === q.ans; typed = String(picked);
    document.querySelectorAll('.choice').forEach((b, i) => { b.classList.remove('sel'); if (i === q.ans) b.classList.add('right'); else if (i === picked) b.classList.add('wrong'); });
  } else {
    const vals = q.fields.map((f, i) => $('f' + i).value.trim());
    if (vals.some(v => v === '')) { setMsg('Fill every box first.'); return; }
    const res = q.fields.map((f, i) => CHECK(cur.id, f, vals[i]));
    if (res.some(r => r === null)) { const bad = q.fields.find((f, i) => res[i] === null), kd = kindOf(bad);
      setMsg(kd ? `I can't read that. Type it like ${INPUT_HINT[kd]}${kd === 'set' ? ' (or "no solution")' : ''}.` : q.fields.some(f => f.expr !== undefined) ? 'Type an expression like 3x + 2 or 2(x − 1).' : 'Use a number like 7, −3, 2.5, 3/4 or 1 3/4.'); return; }
    ok = res.every(Boolean); typed = vals.join(' ; ');
    res.forEach((r, i) => { const inp = $('f' + i); inp.classList.remove('target'); inp.classList.add(r ? 'right' : 'wrong'); inp.readOnly = true; });
  }
  checked = true; clearTimeout(flashT); if (q.visual && q.flash) $('visual').innerHTML = q.visual;
  const secs = (now() - t0) / 1000;
  const key = cur.id + '.' + cur.step, tr = teleRec(key); tr.t++; if (ok) tr.r++; tr.s = Math.round((tr.s + Math.min(300, secs)) * 10) / 10;
  const ev = MM.answer(P, S, cur, ok, secs, now()); lastEv = ev;
  markDirty(MM.unitOf(cur.id)); teleSave();
  // sound: crunch on submit, then biggest outcome cue
  const has = t => ev.some(e => e.type === t);
  sfx('crunch');
  sfx(has('proven') || has('ivDone') || has('brave') ? 'proven' : has('planted') || has('saved') || has('confirmed') ? 'plant' : ok ? (cur.mode === 'iv' || cur.mode === 'review' ? 'drop' : 'right') : 'miss', ev);
  if (cur.mode === 'iv' && ok) sfx('right');
  // feedback
  const sk = BY[cur.id];
  const evHTML = ev.map(e => {
    switch (e.type) {
      case 'planted': return `<p class="ev">Step ${e.step} planted${e.step !== 'a' ? `, and ${'abcd'.slice(0, 'abcd'.indexOf(e.step)).split('').join(', ')} with it` : ''}. ${e.step === 'd' ? '' : `Next: step ${MM.curStep(P, cur.id)}.`}</p>`;
      case 'proven': return `<p class="ev">${esc(sk.name)}: proven! A full leaf on your tree. First watering in ${fmtDur(MM.interval(0, SET.dial))}.</p>`;
      case 'slid': return `<p class="ev warn">Let's build it up from step ${e.step} for a bit.</p>`;
      case 'brave': return `<p class="ev bravev">${e.step === 'e' ? `★ Brave! ${esc(sk.name)} blossoms.${MM.braveEarned(P, cur.id).f ? '' : ' The ★★ Legend quest is open.'}` : `★★ Legend! ${esc(sk.name)} bears golden fruit.`}</p>`;
      case 'braveAgain': return `<p class="ev bravev">${e.step === 'e' ? '★' : '★★'} Still brave.</p>`;
      case 'watered': return `<p class="ev">Watered. See you again in ${fmtDur(e.next - now())}.</p>`;
      case 'dry': return `<p class="ev warn">Still thirsty. This one comes back soon.</p>`;
      case 'confirmed': return `<p class="ev">Checked: ${esc(sk.name)} is proven.</p>`;
      case 'unconfirmed': return `<p class="ev warn">${esc(sk.name)} goes on your path to grow properly.</p>`;
      case 'saved': return `<p class="ev">Leaf saved! ${esc(sk.name)} is replanted.</p>`;
      case 'eased': return `<p class="ev warn">Easier one next. Your drops are kept.</p>`;
      case 'kept': return `<p class="ev warn">Your drops are kept. Try another.</p>`;
      case 'resting': return `<p class="ev warn">${esc(sk.name)} is resting. It will grow back in normal practice.</p>`;
      default: return '';
    }
  }).join('');
  const ansLine = !ok && q.kind === 'num' ? `<p class="ans">Answer: ${q.fields.map(showF).join(' · ')}</p>` : !ok && q.kind === 'order' ? `<div class="ans">A correct order:<ol class="oans">${q.ans.map(i => `<li>${q.items[i]}</li>`).join('')}</ol></div>` : '';
  const whoa = ok && R().stories === 'on' && cur.mode === 'learn' && Math.random() < .12 ? `<p class="whoa">${esc(pick(WHOA))}</p>` : '';
  const pts = { a: 1, b: 2, c: 4, d: 8, e: 16, f: 32 }[cur.step];
  $('fb').className = ok ? 'fb win' : 'fb';
  $('fb').innerHTML = `<div class="res ${ok ? 'ok' : 'no'}"><span>${ok ? pick(PRAISE) : 'Not yet'}</span><span class="p">${ok ? '+' + pts : ''}</span></div>${evHTML}${ansLine}<p class="ex">${q.explain}</p>${STONES[cur.id] ? `<div class="stone"><b>In stone</b>${STONES[cur.id]}</div>` : ''}${whoa}`;
  fixFr($('fb')); $('fb').hidden = false; $('react').hidden = false; setMsg('');
  $('go').textContent = ev.some(e => e.type === 'ivDone') ? 'Back to normal' : 'Next';
  renderIvBar();
  if (ev.some(e => e.type === 'ivDone')) {
    const d = ev.find(e => e.type === 'ivDone'), left = MM.withered(P).length;
    $('savedCard').innerHTML = `<h1>Garden saved</h1><p>${d.saved} of ${d.total} leaves replanted.${left ? ` ${left > 1 ? left + ' more withered leaves wait' : '1 more withered leaf waits'} for the next Intervention.` : ' Back to the usual.'}</p>`;
    $('savedCard').hidden = false;
  }
  const nq = $('pSkill').querySelector('small');
  if (nq && focusId && MM.proven(P, focusId) && !S.iv) nq.textContent += ' · proven';
  $('go').focus({ preventScroll: true });
}
function go() { if (!q) return; if (checked) { $('savedCard').hidden = true; newQ(); } else check(); }
$('go').addEventListener('click', go);
$('react').addEventListener('click', e => { const b = e.target.closest('button[data-r]'); if (!b || !cur) return; const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on);
  const tr = teleRec(cur.id + '.' + cur.step); tr[b.dataset.r] = Math.max(0, tr[b.dataset.r] + (on ? 1 : -1)); save(); teleSave(); });

/* ---- tape calculator (v0.1) ---- */
let cexpr = '', justEval = false, tape = [];
function openCalc() { calcOpen = true; $('calc').hidden = false; renderTape(); renderTools(); paintTarget(); }
function closeCalc() { calcOpen = false; $('calc').hidden = true; if (q) renderTools(); paintTarget(); }
const fmtNum = v => { if (!isFinite(v)) return null; let s = String(+v.toPrecision(12)); if (/e/.test(s)) s = (+v).toPrecision(8); return s.replace('-', MINUS); };
function pasteValue(v) { const r = +v.toFixed(10), s = String(r); if (!/e/.test(s) && (s.split('.')[1] || '').length <= 6) return s; for (let d = 2; d <= 64; d++) { const n = Math.round(v * d); if (Math.abs(n - v * d) < 1e-9) return n + '/' + d; } return String(+v.toFixed(6)); }
function evalExpr(e) { const s = e.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'); let i = 0;
  const num = () => { const mt = s.slice(i).match(/^\d*\.?\d+|^\d+\.?/); if (!mt) throw 0; i += mt[0].length; return parseFloat(mt[0]); };
  const factor = () => { if (s[i] === '-') { i++; return -factor(); } if (s[i] === '(') { i++; const v = expr(); if (s[i] !== ')') throw 0; i++; return v; } return num(); };
  const term = () => { let v = factor(); while (s[i] === '*' || s[i] === '/') { const o = s[i++], r = factor(); v = o === '*' ? v * r : v / r; } return v; };
  const expr = () => { let v = term(); while (s[i] === '+' || s[i] === '-') { const o = s[i++], r = term(); v = o === '+' ? v + r : v - r; } return v; };
  try { const v = expr(); return i === s.length ? v : NaN; } catch (err) { return NaN; } }
function cKey(k) { const ops = '+−×÷';
  if (k === 'close') { closeCalc(); return; }
  if (k === 'C') { cexpr = ''; justEval = false; }
  else if (k === 'del') { cexpr = cexpr.slice(0, -1); justEval = false; }
  else if (k === 'enter') { if (!cexpr) return; let e = cexpr; const open = (e.match(/\(/g) || []).length - (e.match(/\)/g) || []).length; if (open > 0) e += ')'.repeat(open); if (ops.includes(e.slice(-1))) e = e.slice(0, -1);
    const v = evalExpr(e); if (isNaN(v) || !isFinite(v)) tape.push({ ex: e, err: isNaN(v) ? 'Check the expression' : 'Can’t divide by 0' }); else { tape.push({ ex: e, v }); cexpr = fmtNum(v); justEval = true; sfx('print'); }
    renderTape(); $('display').textContent = cexpr; return; }
  else if (k === '(') { const open = (cexpr.match(/\(/g) || []).length - (cexpr.match(/\)/g) || []).length; if (justEval) { cexpr = ''; justEval = false; } cexpr += (open > 0 && /[\d)]/.test(cexpr.slice(-1))) ? ')' : '('; }
  else if (ops.includes(k)) { justEval = false; const last = cexpr.slice(-1);
    if (k === '−' && (cexpr === '' || last === '(' || '+×÷'.includes(last))) cexpr += '−'; else if (cexpr === '' || last === '(') return; else if (ops.includes(last)) cexpr = cexpr.slice(0, -1) + k; else cexpr += k; }
  else { if (justEval) { cexpr = ''; justEval = false; } if (k === '.') { const sg = cexpr.split(/[+−×÷()]/).pop(); if (sg.includes('.')) return; if (sg === '') cexpr += '0'; } if (cexpr.length < 40) cexpr += k; }
  $('display').textContent = cexpr; }
function renderTape() { const t = $('tape'); if (!tape.length) { t.innerHTML = '<div class="empty">Each Enter prints a line. Tap a line to put it in the green box.</div>'; return; }
  t.innerHTML = tape.map((l, i) => l.err ? `<div class="line err"><span class="ex">${esc(l.ex)}</span><span class="rs">${esc(l.err)}</span></div>` : `<button class="line" data-t="${i}"><span class="ex">${esc(l.ex)}</span><span class="rs">${fmtNum(l.v)}</span></button>`).join(''); t.scrollTop = t.scrollHeight; }
$('cpad').addEventListener('click', e => { const b = e.target.closest('button'); if (b) cKey(b.dataset.c); });
$('clearTape').addEventListener('click', () => { tape = []; renderTape(); });
$('tape').addEventListener('click', e => { const b = e.target.closest('.line[data-t]'); if (!b || !q) return; const l = tape[+b.dataset.t];
  if (checked) { setMsg('Tap Next for a new question first.', true); return; }
  if (q.kind !== 'num') return;
  const inp = $('f' + target); if (!inp) return; inp.value = pasteValue(l.v).replace('-', MINUS);
  setMsg(`Put ${fmtNum(l.v)} in the box.`, true); if (target < q.fields.length - 1) target++; paintTarget(); });

/* ---- report a mistake ---- */
$('reportBtn').addEventListener('click', () => { $('rbox').hidden = false; $('reportBtn').hidden = true; $('rText').focus(); });
$('rCancel').addEventListener('click', () => { $('rbox').hidden = true; $('reportBtn').hidden = false; });
$('rSend').addEventListener('click', async () => {
  const tmp = document.createElement('div'); tmp.innerHTML = q.prompt; const text = tmp.textContent.slice(0, 600);
  const answer = q.kind === 'num' ? q.fields.map(f => SHOWV(cur.id, f)).join(' ; ') : q.kind === 'order' ? q.ans.join(',') : (() => { const d = document.createElement('div'); d.innerHTML = q.choices[q.ans]; return d.textContent || '(picture)'; })();
  const typed = q.kind === 'num' ? q.fields.map((f, i) => ($('f' + i) || {}).value || '').join(' ; ') : q.kind === 'order' ? oseq.join(',') : (picked == null ? '' : String(picked + 1));
  const rep = { code: $('qCode').textContent, skill: cur.id, step: cur.step, mode: cur.mode, question: text, answer, typed, note: $('rText').value.trim().slice(0, 500), rules: OPTS(), at: new Date().toISOString(), pseudo: META.pseudo || null };
  let sent = false; if (db) { try { await db.collection('bugs').add(rep); sent = true; } catch (e) {} }
  $('rbox').hidden = true; $('rText').value = ''; $('reportBtn').hidden = false;
  $('reportBtn').textContent = sent ? 'Thanks. Your report reached the team.' : 'Thanks. This copy can’t send reports, so please tell whoever shared it (code above).';
});

/* ---- keyboard ---- */
document.addEventListener('keydown', e => {
  if (view === 'alarm' && e.key === 'Enter') { e.preventDefault(); $('alarmGo').click(); return; }
  if (view !== 'practice' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (['TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.target.tagName === 'INPUT') return;           // Enter in a box is handled by #answers
  if (e.target.closest && e.target.closest('.back,.report,.line,.tool,#clearTape,.rbox,.react,#reportBtn') && (e.key === 'Enter' || e.key === ' ')) return;
  const k = e.key;
  if (calcOpen) { let c = null; if (/^\d$/.test(k) || k === '.') c = k; else if (k === '+') c = '+'; else if (k === '-') c = '−'; else if (k === '*' || k === 'x') c = '×'; else if (k === '/') c = '÷'; else if (k === '(' || k === ')') c = '('; else if (k === 'Backspace') c = 'del'; else if (k === 'Escape') c = 'C'; else if (k === '=') c = 'enter'; else if (k === 'Enter') c = checked ? null : 'enter'; if (c) { e.preventDefault(); cKey(c); return; } }
  if (k === 'Enter') { e.preventDefault(); go(); return; }
  if (q && q.kind === 'choice' && !checked && /^[1-9]$/.test(k) && +k <= q.choices.length) { const b = document.querySelector(`.choice[data-i="${+k - 1}"]`); if (b) b.click(); }
});

/* ================= boot ================= */
const hadLocal = loadLocal();
if (!META.pseudo) META.pseudo = 't' + Math.random().toString(36).slice(2, 10);
setEra(ERAS[META.era] ? META.era : 'II');
const firstView = () => show('land');
if (hadLocal) firstView(); else show('loading');
setSaved('Saved on this device');
(async () => {
  try { await boot(); } finally { if (view === 'loading') firstView(); }
})();
async function boot() {
  const use = (window.claude && typeof window.claude.use === 'function') ? n => window.claude.use(n) : () => Promise.resolve(null);
  const [d, u] = await Promise.all([use('db'), use('user')]);
  db = d; if (!db || !u) return;
  try { uid = await u.id(); } catch (e) { uid = null; }
  if (!uid) return;
  try {
    const base = `data/users/${uid}`;
    const st = await db.doc(`${base}/settings`).get();
    remote = true;
    if (st.exists) {
      const o = st.data() || {};
      const rMeta = o.meta || {};
      // settings: whichever side placed first / is the account copy wins unless this device has newer unit work
      upgradeMeta(rMeta, o.settings);
      if (!hadLocal || Object.keys(rMeta.placed).length) {
        SET.pace = (o.settings || {}).pace || SET.pace; SET.dial = (o.settings || {}).dial || SET.dial; SET.brave = !!(o.settings || {}).brave;
        RULES = Object.assign({ ...DEFAULT_RULES }, o.rules || {}); migrateSound(RULES);
        for (const k of ERA_KEYS) { if (rMeta.placed[k]) META.placed[k] = true; if (rMeta.start[k] && !META.start[k]) META.start[k] = rMeta.start[k]; }
        if (rMeta.pseudo) META.pseudo = rMeta.pseudo;
        if (!hadLocal && ERAS[rMeta.era]) setEra(rMeta.era);
      }
      const snaps = await Promise.all(ALL_UNITS.map(([x]) => db.doc(`${base}/${unitDocId(x)}`).get()));
      for (const [ui, [x]] of ALL_UNITS.entries()) {
        const Px = PS[eraOf(x)], ORDx = Px.order;
        const snap = snaps[ui];
        if (snap.exists) { const doc = snap.data() || {}; if (!META.at[x] || (doc.at || 0) >= META.at[x]) { for (const id of ORDx) if (MM.unitOf(id) === x) { delete Px.skills[id]; 'abcdef'.split('').forEach(k => delete Px.steps[id + '.' + k]); } MM.mergeUnit(Px, unpackUnit(doc)); META.at[x] = doc.at || 0; } else dirty.add(x); }
        else if (META.at[x]) dirty.add(x);
      }
    } else {
      // first time on this account: migrate v0.1 rules if they exist there, then push whatever this device has
      try { const v1 = await db.doc(`${base}/progress`).get(); if (v1.exists && !hadLocal) { const o = v1.data() || {}; if (o.rules) migrateV1(o.rules); } } catch (e) {}
      ALL_UNITS.forEach(([x]) => dirty.add(x));
    }
    save(); flush();
    selUnit = META.start[era] || selUnit;
    if (view === 'land') { /* stay on homepage */ }
    else if (view === 'welcome' && META.placed[era]) show('home'); else if (view === 'home') renderHome(); else if (view === 'id') renderID(); else if (view === 'rules') renderRules();
  } catch (e) { remote = false; console.warn('mathera sync', e); }
}
window.__mathera = { force: (id, step) => { FORCE = { id, step, mode: 'practice' }; newQ(); }, P: () => P, PS, setEra: k => { enterEra(k); }, enterEra, era: () => era, S: () => S, MM, clock, cur: () => cur, q: () => q, show, renderHome, renderLand };
})();
