'use strict';

/* ============================================================
   Regeln (siehe CONTEXT.md)
   ============================================================ */

const EXERCISES = {
  pushups:  'Push-Ups',
  jacks:    'Jumping Jacks',
  crunches: 'Crunches',
  squats:   'Air Squats',
  burpees:  'Burpees',
};

const SUITS = {
  herz:  { sym: '♥', red: true,  exercise: 'pushups'  },
  karo:  { sym: '♦', red: true,  exercise: 'jacks'    },
  pik:   { sym: '♠', red: false, exercise: 'crunches' },
  kreuz: { sym: '♣', red: false, exercise: 'squats'   },
};

const VALUES = [
  { key: '7',  reps: 7  },
  { key: '8',  reps: 8  },
  { key: '9',  reps: 9  },
  { key: '10', reps: 10 },
  { key: 'B',  reps: 15 },   // Bube sticht die Farbe: immer Burpees
  { key: 'D',  reps: 12 },
  { key: 'K',  reps: 13 },
  { key: 'A',  reps: 1  },
];

// Das Deck: 32 Karten, feste Indizes 0..31
const DECK = [];
for (const suitKey of Object.keys(SUITS)) {
  for (const value of VALUES) {
    DECK.push({ suit: suitKey, value: value.key, reps: value.reps });
  }
}

function taskFor(card) {
  if (card.value === 'B') return { exercise: 'burpees', reps: 15 };
  return { exercise: SUITS[card.suit].exercise, reps: card.reps };
}

/* ============================================================
   Konfiguration & Persistenz
   ============================================================ */

const urlParams = new URLSearchParams(location.search);
const DURATION_MS = (parseInt(urlParams.get('t'), 10) || 600) * 1000;

const KEY_WORKOUTS = 'myskat.workouts';
const KEY_CURRENT  = 'myskat.current';

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* voll/privat — Pech */ }
}

/* ============================================================
   Zustand
   ============================================================ */

let current = null;      // laufendes Workout: { order, startedAt, endsAt, cardsDone, reps }
let tickHandle = null;
let lastTapAt = 0;
let wakeLock = null;

function newWorkout() {
  const order = DECK.map((_, i) => i);
  // Fisher-Yates — genau einmal beim Start, danach bleibt die Reihenfolge fix (ADR 0001)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  const now = Date.now();
  const reps = {};
  for (const key of Object.keys(EXERCISES)) reps[key] = 0;
  return { order, startedAt: now, endsAt: now + DURATION_MS, cardsDone: 0, reps };
}

/* ============================================================
   Screens
   ============================================================ */

const screens = {
  home:      document.getElementById('screen-home'),
  countdown: document.getElementById('screen-countdown'),
  workout:   document.getElementById('screen-workout'),
  result:    document.getElementById('screen-result'),
};

function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle('active', key === name);
  }
}

/* ============================================================
   Audio & Vibration
   ============================================================ */

let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq, durationMs, when = 0) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.value = 0.15;
  osc.connect(gain).connect(audioCtx.destination);
  const t = audioCtx.currentTime + when;
  osc.start(t);
  gain.gain.setValueAtTime(0.15, t + durationMs / 1000 - 0.02);
  gain.gain.linearRampToValueAtTime(0, t + durationMs / 1000);
  osc.stop(t + durationMs / 1000);
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function signalRoundComplete() {
  beep(880, 120); beep(1175, 160, 0.15);
  vibrate([80, 40, 80]);
}

function signalTimeUp() {
  beep(660, 250); beep(660, 250, 0.35); beep(880, 500, 0.7);
  vibrate([200, 100, 200, 100, 400]);
}

/* ============================================================
   Wake Lock
   ============================================================ */

async function acquireWakeLock() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  } catch (e) { /* kein Wake Lock — nicht schlimm */ }
}

function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && current) acquireWakeLock();
});

/* ============================================================
   SVG-Karten: muskulöse Kartensoldaten (Alice im Wunderland)
   ============================================================ */

const LIMB = 'fill="none" stroke="#2b2b2b" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"';
const MUSCLE = 'fill="#2b2b2b"';

// Kopf mit Schweißband
function head(cx, cy, r = 10) {
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffe3c2" stroke="#2b2b2b" stroke-width="3"/>
    <path d="M ${cx - r} ${cy - r * 0.35} A ${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.35}
             L ${cx + r * 0.9} ${cy - r * 0.05} A ${r * 0.9} ${r * 0.9} 0 0 0 ${cx - r * 0.9} ${cy - r * 0.05} Z"
          fill="#d43a3a"/>`;
}

// Torso = Mini-Spielkarte mit Farbsymbol (der Kartensoldat trägt seine Farbe)
function torso(cx, cy, w, h, rotation, suitSym, suitColor) {
  return `
    <g transform="rotate(${rotation} ${cx} ${cy})">
      <rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="5"
            fill="#fffdf5" stroke="#2b2b2b" stroke-width="3"/>
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
            font-size="${Math.min(w, h) * 0.62}" fill="${suitColor}">${suitSym}</text>
    </g>`;
}

// Die 5 Posen (viewBox 0 0 140 120)
const FIGURES = {
  pushups: (sym, col) => `
    <line x1="14" y1="104" x2="126" y2="104" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <path d="M 20 96 L 48 78" ${LIMB}/>
    <path d="M 88 74 L 100 90 L 94 102" ${LIMB}/>
    <path d="M 78 76 L 88 92 L 82 102" ${LIMB}/>
    <circle cx="94" cy="83" r="6" ${MUSCLE}/>
    ${torso(66, 68, 48, 28, -8, sym, col)}
    ${head(104, 58)}
    <path d="M 118 44 l 0 -8 M 126 52 l 8 -4" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,

  jacks: (sym, col) => `
    <path d="M 58 52 L 44 34 L 40 20" ${LIMB}/>
    <path d="M 82 52 L 96 34 L 100 20" ${LIMB}/>
    <circle cx="46" cy="35" r="6" ${MUSCLE}/>
    <circle cx="94" cy="35" r="6" ${MUSCLE}/>
    <path d="M 62 82 L 50 96 L 44 112" ${LIMB}/>
    <path d="M 78 82 L 90 96 L 96 112" ${LIMB}/>
    ${torso(70, 64, 32, 40, 0, sym, col)}
    ${head(70, 32)}
    <path d="M 28 26 a 26 26 0 0 1 8 -12 M 112 26 a 26 26 0 0 0 -8 -12"
          stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,

  crunches: (sym, col) => `
    <line x1="14" y1="106" x2="126" y2="106" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <path d="M 80 98 L 98 74 L 110 102" ${LIMB}/>
    <path d="M 50 70 L 74 66 L 88 70" ${LIMB}/>
    <circle cx="66" cy="66" r="6" ${MUSCLE}/>
    ${torso(60, 84, 44, 28, -32, sym, col)}
    ${head(40, 60)}
    <path d="M 26 46 l -4 -7 M 34 42 l 0 -8" stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,

  squats: (sym, col) => `
    <line x1="14" y1="108" x2="126" y2="108" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <path d="M 80 84 L 52 86 L 58 108" ${LIMB}/>
    <path d="M 88 86 L 62 90 L 68 108" ${LIMB}/>
    <path d="M 84 56 L 56 52 L 34 54" ${LIMB}/>
    <circle cx="62" cy="52" r="6" ${MUSCLE}/>
    ${torso(86, 66, 32, 40, 10, sym, col)}
    ${head(92, 38)}`,

  burpees: (sym, col) => `
    <line x1="14" y1="112" x2="126" y2="112" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="70" cy="112" rx="22" ry="3.5" fill="#2b2b2b" opacity="0.25"/>
    <path d="M 60 46 L 48 28 L 44 14" ${LIMB}/>
    <path d="M 80 46 L 92 28 L 96 14" ${LIMB}/>
    <circle cx="50" cy="29" r="6" ${MUSCLE}/>
    <circle cx="90" cy="29" r="6" ${MUSCLE}/>
    <path d="M 64 76 L 58 90 L 64 98" ${LIMB}/>
    <path d="M 76 76 L 82 90 L 76 98" ${LIMB}/>
    ${torso(70, 58, 30, 38, 0, sym, col)}
    ${head(70, 26)}
    <path d="M 44 104 l -6 4 M 96 104 l 6 4 M 70 102 l 0 5"
          stroke="#2b2b2b" stroke-width="2.5" stroke-linecap="round" fill="none"/>`,
};

function cardSVG(card) {
  const suit = SUITS[card.suit];
  const task = taskFor(card);
  const color = suit.red ? '#c22f2f' : '#2b2b2b';
  const name = EXERCISES[task.exercise];
  const nameSize = name.length > 10 ? 21 : 26;   // lange Namen müssen die Eck-Indizes freihalten
  const twoDigit = card.value.length > 1;        // die „10" braucht eine kompaktere Ecke
  const vSize = twoDigit ? 24 : 30;
  const vX = twoDigit ? 29 : 26;
  return `
  <svg viewBox="0 0 240 336" xmlns="http://www.w3.org/2000/svg" role="img"
       aria-label="${task.reps} ${EXERCISES[task.exercise]}">
    <rect x="4" y="4" width="232" height="328" rx="18" fill="#fffdf5" stroke="#2b2b2b" stroke-width="4"/>
    <rect x="14" y="14" width="212" height="308" rx="10" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.35"/>
    <text x="${vX}" y="46" font-size="${vSize}" font-weight="bold" fill="${color}" text-anchor="middle">${card.value}</text>
    <text x="26" y="74" font-size="26" fill="${color}" text-anchor="middle">${suit.sym}</text>
    <g transform="rotate(180 120 168)">
      <text x="${vX}" y="46" font-size="${vSize}" font-weight="bold" fill="${color}" text-anchor="middle">${card.value}</text>
      <text x="26" y="74" font-size="26" fill="${color}" text-anchor="middle">${suit.sym}</text>
    </g>
    <g transform="translate(50 60)">${FIGURES[task.exercise](suit.sym, color)}</g>
    <text x="120" y="238" text-anchor="middle" font-size="52" font-weight="bold" fill="#2b2b2b">${task.reps}&#8202;&#215;</text>
    <text x="120" y="278" text-anchor="middle" font-size="${nameSize}" font-weight="600" fill="${color}">${name}</text>
  </svg>`;
}

/* ============================================================
   Rendering
   ============================================================ */

const el = {
  homeStats:     document.getElementById('home-stats'),
  timer:         document.getElementById('timer'),
  progress:      document.getElementById('progress'),
  cardArea:      document.getElementById('card-area'),
  resultStats:   document.getElementById('result-stats'),
  countdownText: document.getElementById('countdown-text'),
};

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function deckPhrase(cards) {
  const decks = Math.floor(cards / 32);
  const rest = cards % 32;
  if (decks === 0) return `${cards} Karten`;
  const deckWord = decks === 1 ? '1 Deck' : `${decks} Decks`;
  return rest === 0 ? deckWord : `${deckWord} + ${rest}`;
}

function repsList(reps) {
  return Object.keys(EXERCISES)
    .map(key => `<li><span>${EXERCISES[key]}</span><strong>${reps[key] || 0}</strong></li>`)
    .join('');
}

function renderHome() {
  const workouts = loadJSON(KEY_WORKOUTS, []);
  if (workouts.length === 0) {
    el.homeStats.innerHTML = `<p class="empty">Noch kein Workout — das Deck wartet auf dich.</p>`;
    return;
  }
  const totals = {};
  for (const key of Object.keys(EXERCISES)) totals[key] = 0;
  let best = 0;
  for (const w of workouts) {
    best = Math.max(best, w.cards);
    for (const key of Object.keys(EXERCISES)) totals[key] += w.reps[key] || 0;
  }
  const last = workouts[workouts.length - 1];
  el.homeStats.innerHTML = `
    <div class="stat-tiles">
      <div class="tile"><strong>${workouts.length}</strong><span>Workouts</span></div>
      <div class="tile"><strong>${best}</strong><span>Bestes (Karten)</span></div>
      <div class="tile"><strong>${formatDate(last.date)}</strong><span>Zuletzt</span></div>
    </div>
    <ul class="reps-list">${repsList(totals)}</ul>`;
}

function renderWorkout() {
  const pos = current.cardsDone;
  const inDeck = (pos % 32) + 1;
  const round = Math.floor(pos / 32) + 1;
  el.progress.textContent = `Karte ${inDeck}/32 · Runde ${round}`;
  el.cardArea.innerHTML = cardSVG(DECK[current.order[pos % 32]]);
}

function renderTimer() {
  const remaining = Math.max(0, current.endsAt - Date.now());
  const totalSec = Math.ceil(remaining / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  el.timer.textContent = `${m}:${String(s).padStart(2, '0')}`;
  el.timer.classList.toggle('urgent', remaining < 60000);
}

function renderResult(record) {
  el.resultStats.innerHTML = `
    <div class="score">
      <strong>${record.cards}</strong>
      <span>Karten geschafft (${deckPhrase(record.cards)})</span>
    </div>
    <ul class="reps-list">${repsList(record.reps)}</ul>
    <p class="total-reps">${record.total} Reps insgesamt</p>`;
}

/* ============================================================
   Workout-Ablauf
   ============================================================ */

function startCountdown() {
  ensureAudio();
  showScreen('countdown');
  el.countdownText.textContent = 'Mischen…';
  const steps = [
    [1800, '3', () => beep(660, 150)],
    [2800, '2', () => beep(660, 150)],
    [3800, '1', () => beep(660, 150)],
    [4800, 'Los!', () => { beep(990, 400); vibrate(150); }],
  ];
  for (const [delay, text, sound] of steps) {
    setTimeout(() => { el.countdownText.textContent = text; sound(); }, delay);
  }
  setTimeout(beginWorkout, 5300);
}

function beginWorkout() {
  current = newWorkout();
  saveJSON(KEY_CURRENT, current);
  acquireWakeLock();
  showScreen('workout');
  renderWorkout();
  renderTimer();
  tickHandle = setInterval(tick, 250);
}

function resumeWorkout() {
  acquireWakeLock();
  showScreen('workout');
  renderWorkout();
  renderTimer();
  tickHandle = setInterval(tick, 250);
}

function tick() {
  renderTimer();
  if (Date.now() >= current.endsAt) finishWorkout(true);
}

function onCardTap() {
  if (!current || Date.now() >= current.endsAt) return;
  const now = Date.now();
  if (now - lastTapAt < 1000) return;   // Tap-Schutz gegen Doppel-Taps
  lastTapAt = now;

  const card = DECK[current.order[current.cardsDone % 32]];
  const task = taskFor(card);
  current.reps[task.exercise] += task.reps;
  current.cardsDone += 1;
  if (current.cardsDone % 32 === 0) signalRoundComplete();
  saveJSON(KEY_CURRENT, current);
  renderWorkout();
}

function finishWorkout(withSignal) {
  clearInterval(tickHandle);
  tickHandle = null;
  releaseWakeLock();
  if (withSignal) signalTimeUp();

  const total = Object.values(current.reps).reduce((a, b) => a + b, 0);
  const record = {
    date: new Date(current.startedAt).toISOString(),
    cards: current.cardsDone,
    rounds: Math.floor(current.cardsDone / 32),
    reps: current.reps,
    total,
  };
  const workouts = loadJSON(KEY_WORKOUTS, []);
  workouts.push(record);
  saveJSON(KEY_WORKOUTS, workouts);
  localStorage.removeItem(KEY_CURRENT);
  current = null;

  renderResult(record);
  showScreen('result');
}

function abortWorkout() {
  if (!confirm('Workout wirklich abbrechen? Es wird verworfen.')) return;
  clearInterval(tickHandle);
  tickHandle = null;
  releaseWakeLock();
  localStorage.removeItem(KEY_CURRENT);
  current = null;
  renderHome();
  showScreen('home');
}

/* ============================================================
   Init
   ============================================================ */

document.getElementById('btn-start').addEventListener('click', startCountdown);
document.getElementById('btn-reset').addEventListener('click', () => {
  if (!confirm('Wirklich alle Workouts und Statistiken löschen? Das kann nicht rückgängig gemacht werden.')) return;
  localStorage.removeItem(KEY_WORKOUTS);
  localStorage.removeItem(KEY_CURRENT);
  renderHome();
});
document.getElementById('btn-abort').addEventListener('click', abortWorkout);
document.getElementById('btn-home').addEventListener('click', () => { renderHome(); showScreen('home'); });
el.cardArea.addEventListener('click', onCardTap);

// Laufendes Workout nach Reload/Tab-Schließen wieder aufnehmen (feste Endzeit)
const saved = loadJSON(KEY_CURRENT, null);
if (saved && Date.now() < saved.endsAt) {
  current = saved;
  resumeWorkout();
} else if (saved) {
  current = saved;
  finishWorkout(false);   // Zeit lief ab, während die Seite zu war
} else {
  renderHome();
}

// Kein Service Worker beim lokalen Entwickeln — der Cache würde jede Änderung verschlucken
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
