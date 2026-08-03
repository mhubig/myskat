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
  if (wakeLock && !wakeLock.released) return;
  try {
    if ('wakeLock' in navigator) {
      const lock = await navigator.wakeLock.request('screen');
      wakeLock = lock;
      // iOS gibt den Lock auch ohne Sichtbarkeitswechsel frei (Dimmen,
      // Systementscheidung) — dann sofort neu holen, solange das Workout läuft.
      // Bei manueller Freigabe ist wakeLock schon null → kein Re-Acquire.
      lock.addEventListener('release', () => {
        if (wakeLock !== lock) return;
        wakeLock = null;
        if (current && Date.now() < current.endsAt && document.visibilityState === 'visible') {
          acquireWakeLock();
        }
      });
    }
  } catch (e) { console.warn('Wake Lock:', e); }
}

function releaseWakeLock() {
  if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; }
}

function reacquireWakeLock() {
  if (document.visibilityState === 'visible' && current && Date.now() < current.endsAt) {
    acquireWakeLock();
  }
}

document.addEventListener('visibilitychange', reacquireWakeLock);
window.addEventListener('pageshow', reacquireWakeLock);
window.addEventListener('focus', reacquireWakeLock);

/* ============================================================
   SVG-Karten: Tim-Burton-Kartensoldaten (Gemini-generiert,
   Prompts in docs/gemini-image-prompt.md, Originale in img/*.png)
   ============================================================ */

const IMAGES = {
  pushups:  'img/pushups.jpg',
  jacks:    'img/jacks.jpg',
  crunches: 'img/crunches.jpg',
  squats:   'img/squats.jpg',
  burpees:  'img/burpees.jpg',
};

const INK = '#26201c';
const RED = '#9e2b33';

function cardSVG(card) {
  const suit = SUITS[card.suit];
  const task = taskFor(card);
  const color = suit.red ? RED : INK;
  const name = EXERCISES[task.exercise];
  const nameSize = name.length > 10 ? 21 : 26;   // lange Namen müssen die Eck-Indizes freihalten
  const twoDigit = card.value.length > 1;        // die „10" braucht eine kompaktere Ecke
  const vSize = twoDigit ? 26 : 32;
  const vX = twoDigit ? 29 : 26;
  const GOTHIC = `font-family="'Pirata One', Georgia, serif"`;
  return `
  <svg viewBox="0 0 240 336" xmlns="http://www.w3.org/2000/svg" role="img"
       aria-label="${task.reps} ${name}">
    <defs>
      <clipPath id="portrait"><rect x="42" y="52" width="156" height="156" rx="10"/></clipPath>
    </defs>
    <rect x="4" y="4" width="232" height="328" rx="18" fill="#f2ead8" stroke="${INK}" stroke-width="4"/>
    <rect x="14" y="14" width="212" height="308" rx="10" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4"/>
    <text x="${vX}" y="46" font-size="${vSize}" ${GOTHIC} fill="${color}" text-anchor="middle">${card.value}</text>
    <text x="26" y="74" font-size="26" fill="${color}" text-anchor="middle">${suit.sym}</text>
    <g transform="rotate(180 120 168)">
      <text x="${vX}" y="46" font-size="${vSize}" ${GOTHIC} fill="${color}" text-anchor="middle">${card.value}</text>
      <text x="26" y="74" font-size="26" fill="${color}" text-anchor="middle">${suit.sym}</text>
    </g>
    <image href="${IMAGES[task.exercise]}" x="42" y="52" width="156" height="156"
           clip-path="url(#portrait)" preserveAspectRatio="xMidYMid slice"/>
    <rect x="42" y="52" width="156" height="156" rx="10" fill="none" stroke="${INK}" stroke-width="2.5"/>
    <text x="120" y="262" text-anchor="middle" font-size="54" ${GOTHIC} fill="${INK}">${task.reps}&#8202;&#215;</text>
    <text x="120" y="298" text-anchor="middle" font-size="${nameSize + 2}" ${GOTHIC} fill="${color}">${name}</text>
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
  acquireWakeLock();   // innerhalb der User-Geste anfordern — am zuverlässigsten
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
