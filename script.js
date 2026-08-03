'use strict';

/* ============================================================================
   MULTIPLICATION ADVENTURE — SCRIPT.JS
   Daftar isi:
   1. Konstanta & State Global
   2. Utilitas Audio
   3. Utilitas Umum (acak, format waktu, dsb)
   4. Navigasi Antar Layar
   5. Pengaturan (Settings) — localStorage
   6. Mode Belajar (Learn Mode)
   7. Papan Skor (Leaderboard) — localStorage
   8. Alur Permainan (Gameplay Core)
   9. Timer Soal
   10. Efek Visual (FX: bintang, shake, confetti, skor berjalan)
   11. Layar Hasil Akhir & Level Complete
   12. Inisialisasi & Event Listener
   ============================================================================ */

/* ============================================================================
   1. KONSTANTA & STATE GLOBAL
   ============================================================================ */
const TOTAL_LEVELS = 10;
const QUESTIONS_PER_LEVEL = 8;
const QUESTION_TIME = 10; // detik
const TOTAL_HEARTS = 3;
const POINTS_CORRECT = 10;
const POINTS_SPEED_BONUS = 5;
const SPEED_BONUS_THRESHOLD = 5; // jika sisa waktu >= ini, dapat bonus cepat

const BADGES = [
  { min: 700, emoji: '👑', name: 'Master Perkalian' },
  { min: 500, emoji: '🥇', name: 'Gold' },
  { min: 250, emoji: '🥈', name: 'Silver' },
  { min: 100, emoji: '🥉', name: 'Bronze' },
  { min: 0,   emoji: '🌱', name: 'Pemula' },
];

const STORAGE_KEYS = {
  settings: 'multadv_settings',
  leaderboard: 'multadv_leaderboard',
};

// State permainan berjalan (direset setiap kali "Mulai Bermain")
const state = {
  playerName: 'Pemain',
  level: 1,
  score: 0,
  hearts: TOTAL_HEARTS,
  correctCount: 0,
  wrongCount: 0,
  questionIndex: 0,
  questions: [],       // daftar soal untuk level berjalan
  currentAnswer: null,
  timeLeft: QUESTION_TIME,
  timerInterval: null,
  startTime: null,      // Date.now() saat mulai main (untuk hitung waktu bermain)
  answered: false,
};

/* ============================================================================
   2. UTILITAS AUDIO
   ============================================================================ */
const audioEls = {
  click: document.getElementById('audio-click'),
  correct: document.getElementById('audio-correct'),
  wrong: document.getElementById('audio-wrong'),
  gameover: document.getElementById('audio-gameover'),
  victory: document.getElementById('audio-victory'),
  countdown: document.getElementById('audio-countdown'),
};

/**
 * Memutar efek suara berdasarkan nama, menghormati pengaturan on/off.
 * Dibungkus try/catch supaya tidak pernah menghentikan alur game walau
 * file audio gagal dimuat/diputar (mis. browser memblokir autoplay).
 */
function playSfx(name) {
  if (!settings.sfxOn) return;
  const el = audioEls[name];
  if (!el) return;
  try {
    el.currentTime = 0;
    el.volume = 0.7;
    const p = el.play();
    if (p && p.catch) p.catch(() => { /* diabaikan: interaksi user belum terjadi */ });
  } catch (e) { /* diamkan, audio bukan fitur kritikal */ }
}

/* ============================================================================
   3. UTILITAS UMUM
   ============================================================================ */
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatDuration(ms) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}d`;
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}m ${rest}d`;
}

function formatDate(d) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

function getBadge(score) {
  return BADGES.find(b => score >= b.min);
}

/* ============================================================================
   4. NAVIGASI ANTAR LAYAR
   ============================================================================ */
const screens = document.querySelectorAll('.screen');

function showScreen(id) {
  screens.forEach(s => s.classList.remove('active-screen'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active-screen');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================================================
   5. PENGATURAN (SETTINGS) — localStorage
   ============================================================================ */
let settings = {
  musicOn: true,
  sfxOn: true,
  darkMode: false,
};

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (raw) settings = { ...settings, ...JSON.parse(raw) };
  } catch (e) { /* localStorage tidak tersedia, gunakan default */ }
  applySettingsToUI();
  applyDarkMode();
}

function saveSettings() {
  try { localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)); }
  catch (e) { /* diamkan */ }
}

function applySettingsToUI() {
  document.getElementById('toggle-music').checked = settings.musicOn;
  document.getElementById('toggle-sfx').checked = settings.sfxOn;
  document.getElementById('toggle-dark').checked = settings.darkMode;
}

function applyDarkMode() {
  document.body.classList.toggle('dark-mode', settings.darkMode);
}

function initSettingsEvents() {
  document.getElementById('toggle-music').addEventListener('change', (e) => {
    settings.musicOn = e.target.checked;
    saveSettings();
  });
  document.getElementById('toggle-sfx').addEventListener('change', (e) => {
    settings.sfxOn = e.target.checked;
    saveSettings();
  });
  document.getElementById('toggle-dark').addEventListener('change', (e) => {
    settings.darkMode = e.target.checked;
    applyDarkMode();
    saveSettings();
  });
}

/* ============================================================================
   6. MODE BELAJAR (LEARN MODE)
   ============================================================================ */
let learnSelectedNumber = 1;

function initLearnSelector() {
  const wrap = document.getElementById('learn-selector');
  wrap.innerHTML = '';
  for (let n = 1; n <= 10; n++) {
    const chip = document.createElement('button');
    chip.className = 'learn-chip';
    chip.textContent = n;
    chip.setAttribute('aria-label', `Tabel perkalian ${n}`);
    chip.addEventListener('click', () => {
      playSfx('click');
      learnSelectedNumber = n;
      renderLearnContent();
    });
    wrap.appendChild(chip);
  }
  renderLearnContent();
}

function renderLearnContent() {
  // Tandai chip aktif
  document.querySelectorAll('.learn-chip').forEach((chip, idx) => {
    chip.classList.toggle('active-chip', idx + 1 === learnSelectedNumber);
  });

  // Render tabel lengkap n × 1 s.d. n × 10
  const table = document.getElementById('learn-table');
  table.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const row = document.createElement('tr');
    row.innerHTML = `<td>${learnSelectedNumber} × ${i} = ${learnSelectedNumber * i}</td>`;
    table.appendChild(row);
  }

  // Render ilustrasi dot-array untuk contoh n × 3 (agar tidak terlalu besar)
  const sampleFactor = Math.min(learnSelectedNumber, 6) === learnSelectedNumber
    ? Math.min(4, 10)
    : 4;
  renderDotArray(learnSelectedNumber, 4);
}

function renderDotArray(rows, cols) {
  const dotWrap = document.getElementById('dot-array');
  dotWrap.innerHTML = '';
  dotWrap.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  const total = rows * cols;
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('span');
    dot.style.animationDelay = `${i * 0.02}s`;
    dotWrap.appendChild(dot);
  }
  document.getElementById('learn-equation').textContent =
    `${rows} × ${cols} = ${rows * cols}`;
}

/* ============================================================================
   7. PAPAN SKOR (LEADERBOARD) — localStorage
   ============================================================================ */
function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.leaderboard);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function saveLeaderboard(list) {
  try { localStorage.setItem(STORAGE_KEYS.leaderboard, JSON.stringify(list)); }
  catch (e) { /* diamkan */ }
}

function addToLeaderboard(name, score) {
  const list = loadLeaderboard();
  list.push({ name, score, date: Date.now() });
  list.sort((a, b) => b.score - a.score);
  saveLeaderboard(list.slice(0, 10));
}

function renderLeaderboard() {
  const list = loadLeaderboard();
  const container = document.getElementById('leaderboard-list');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<li class="leaderboard-empty">Belum ada skor. Ayo main dulu! 🎮</li>';
    return;
  }

  list.forEach((entry, idx) => {
    const li = document.createElement('li');
    li.className = 'leaderboard-item';
    li.innerHTML = `
      <span class="leaderboard-rank">#${idx + 1}</span>
      <span class="leaderboard-name">${escapeHtml(entry.name)}</span>
      <span class="leaderboard-date">${formatDate(new Date(entry.date))}</span>
      <span class="leaderboard-score">${entry.score}</span>
    `;
    container.appendChild(li);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ============================================================================
   8. ALUR PERMAINAN (GAMEPLAY CORE)
   ============================================================================ */

/** Membuat soal untuk satu level: level × (8 angka acak berbeda dari 1-10) */
function buildQuestionsForLevel(level) {
  const factors = shuffle([1,2,3,4,5,6,7,8,9,10]).slice(0, QUESTIONS_PER_LEVEL);
  return factors.map(f => {
    const a = level, b = f;
    const correct = a * b;
    return { a, b, correct, options: buildOptions(correct) };
  });
}

/** Membuat 4 pilihan jawaban (1 benar + 3 pengecoh unik, lalu diacak) */
function buildOptions(correct) {
  const opts = new Set([correct]);
  while (opts.size < 4) {
    const offset = randInt(-10, 10);
    let candidate = correct + offset;
    if (candidate < 0) candidate = correct + Math.abs(offset) + 1;
    if (candidate !== correct) opts.add(candidate);
  }
  return shuffle([...opts]);
}

function startGame(name) {
  state.playerName = name || 'Pemain';
  state.level = 1;
  state.score = 0;
  state.hearts = TOTAL_HEARTS;
  state.correctCount = 0;
  state.wrongCount = 0;
  state.startTime = Date.now();
  startLevel(1);
  showScreen('screen-game');
}

function startLevel(level) {
  state.level = level;
  state.questionIndex = 0;
  state.questions = buildQuestionsForLevel(level);
  document.getElementById('hud-level').textContent = level;
  renderHearts();
  updateScoreHud();
  loadQuestion();
}

function renderHearts() {
  const hud = document.getElementById('hud-hearts');
  const icons = hud.querySelectorAll('.heart-icon');
  icons.forEach((icon, i) => {
    icon.classList.toggle('lost', i >= state.hearts);
  });
}

function updateScoreHud() {
  document.getElementById('hud-score').textContent = state.score;
}

function loadQuestion() {
  state.answered = false;
  const total = state.questions.length;
  const q = state.questions[state.questionIndex];
  state.currentAnswer = q.correct;

  document.getElementById('question-text').textContent = `${q.a} × ${q.b} = ?`;

  // Progress bar level
  const pct = (state.questionIndex / total) * 100;
  document.getElementById('level-progress-fill').style.width = `${pct}%`;
  document.getElementById('level-progress-text').textContent =
    `Soal ${state.questionIndex + 1} / ${total}`;

  // Render pilihan jawaban
  const grid = document.getElementById('answers-grid');
  grid.innerHTML = '';
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleAnswer(opt, btn));
    grid.appendChild(btn);
  });

  startTimer();
}

function handleAnswer(selected, btnEl) {
  if (state.answered) return;
  state.answered = true;
  stopTimer();
  playSfx('click');

  const isCorrect = selected === state.currentAnswer;
  const timeLeftAtAnswer = state.timeLeft;
  revealAnswer(isCorrect, btnEl, timeLeftAtAnswer);
}

/** Dipanggil juga oleh timer saat waktu habis (dianggap salah) */
function handleTimeout() {
  if (state.answered) return;
  state.answered = true;
  revealAnswer(false, null, 0);
}

function revealAnswer(isCorrect, btnEl, timeLeftAtAnswer) {
  const grid = document.getElementById('answers-grid');
  const buttons = [...grid.querySelectorAll('.answer-btn')];
  buttons.forEach(b => { b.disabled = true; });

  const correctBtn = buttons.find(b => Number(b.textContent) === state.currentAnswer);
  if (correctBtn) correctBtn.classList.add('correct-answer');

  if (isCorrect) {
    let points = POINTS_CORRECT;
    if (timeLeftAtAnswer >= SPEED_BONUS_THRESHOLD) points += POINTS_SPEED_BONUS;
    animateScoreIncrease(points);
    state.correctCount++;
    playSfx('correct');
    spawnStarFx();
  } else {
    if (btnEl) btnEl.classList.add('wrong-answer');
    state.wrongCount++;
    state.hearts--;
    renderHearts();
    playSfx('wrong');
    shakeGameCard();
  }

  setTimeout(() => {
    if (state.hearts <= 0) {
      endGame(false);
      return;
    }
    advanceQuestion();
  }, 1100);
}

function advanceQuestion() {
  state.questionIndex++;
  if (state.questionIndex >= state.questions.length) {
    // Level selesai
    if (state.level >= TOTAL_LEVELS) {
      endGame(true); // menang total!
    } else {
      showLevelComplete();
    }
  } else {
    loadQuestion();
  }
}

function quitGame() {
  stopTimer();
  showScreen('screen-home');
}

/* ============================================================================
   9. TIMER SOAL
   ============================================================================ */
const RING_CIRCUMFERENCE = 283; // 2 * π * 45, dibulatkan

function startTimer() {
  state.timeLeft = QUESTION_TIME;
  updateTimerUI();
  stopTimer();
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerUI();
    if (state.timeLeft <= 3 && state.timeLeft > 0) playSfx('countdown');
    if (state.timeLeft <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerUI() {
  const ring = document.getElementById('timer-ring-fg');
  const number = document.getElementById('timer-number');
  const ratio = Math.max(state.timeLeft, 0) / QUESTION_TIME;
  ring.style.strokeDashoffset = `${RING_CIRCUMFERENCE * (1 - ratio)}`;
  ring.classList.toggle('urgent', state.timeLeft <= 3);
  number.textContent = Math.max(state.timeLeft, 0);
}

/* ============================================================================
   10. EFEK VISUAL (FX)
   ============================================================================ */
function spawnStarFx() {
  const layer = document.getElementById('fx-layer');
  for (let i = 0; i < 5; i++) {
    const star = document.createElement('img');
    star.src = 'image/star.png';
    star.className = 'fx-star';
    star.style.left = `${20 + randInt(0, 60)}%`;
    star.style.top = `${30 + randInt(0, 20)}%`;
    star.style.animationDelay = `${i * 0.05}s`;
    layer.appendChild(star);
    star.addEventListener('animationend', () => star.remove());
  }
}

function shakeGameCard() {
  const card = document.getElementById('game-card');
  card.classList.remove('shake-anim');
  // reflow paksa agar animasi bisa diulang
  void card.offsetWidth;
  card.classList.add('shake-anim');
}

/** Menganimasikan angka skor bertambah secara halus (count-up) */
function animateScoreIncrease(points) {
  const el = document.getElementById('hud-score');
  const start = state.score;
  const end = state.score + points;
  const duration = 500;
  const startTime = performance.now();

  function tick(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const value = Math.round(start + (end - start) * progress);
    el.textContent = value;
    if (progress < 1) requestAnimationFrame(tick);
    else state.score = end;
  }
  requestAnimationFrame(tick);
}

function spawnConfetti() {
  const layer = document.getElementById('confetti-layer');
  layer.innerHTML = '';
  const colors = ['#FFC93C', '#FF6B9D', '#2EC4B6', '#4A90E2', '#35C97E'];
  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = randInt(6, 12);
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 1.4}px`;
    piece.style.left = `${randInt(0, 100)}%`;
    piece.style.background = colors[randInt(0, colors.length - 1)];
    piece.style.animationDuration = `${randInt(25, 45) / 10}s`;
    piece.style.animationDelay = `${randInt(0, 15) / 10}s`;
    layer.appendChild(piece);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 5000);
}

/* ============================================================================
   11. LAYAR HASIL AKHIR & LEVEL COMPLETE
   ============================================================================ */
function showLevelComplete() {
  document.getElementById('levelcomplete-text').textContent =
    `Kamu menguasai perkalian ${state.level}! Lanjut ke level ${state.level + 1}.`;
  showScreen('screen-levelcomplete');
}

function goToNextLevel() {
  playSfx('click');
  startLevel(state.level + 1);
  showScreen('screen-game');
}

function endGame(won) {
  stopTimer();
  const elapsed = Date.now() - state.startTime;

  document.getElementById('result-title').textContent =
    won ? '🎉 Selamat, Kamu Menang!' : 'Game Over';
  document.getElementById('result-score').textContent = state.score;
  document.getElementById('result-correct').textContent = state.correctCount;
  document.getElementById('result-wrong').textContent = state.wrongCount;
  document.getElementById('result-time').textContent = formatDuration(elapsed);

  const badge = getBadge(state.score);
  document.getElementById('result-badge').innerHTML =
    `<span class="badge-emoji">${badge.emoji}</span><span class="badge-name">${badge.name}</span>`;

  document.getElementById('result-icon').src = won ? 'image/trophy.png' : 'image/heart.png';

  addToLeaderboard(state.playerName, state.score);

  showScreen('screen-result');

  if (won) {
    playSfx('victory');
    spawnConfetti();
  } else {
    playSfx('gameover');
  }
}

/* ============================================================================
   12. INISIALISASI & EVENT LISTENER
   ============================================================================ */
function handleAction(action) {
  switch (action) {
    case 'go-home':
      stopTimer();
      showScreen('screen-home');
      break;
    case 'go-learn':
      showScreen('screen-learn');
      initLearnSelector();
      break;
    case 'go-leaderboard':
      renderLeaderboard();
      showScreen('screen-leaderboard');
      break;
    case 'go-settings':
      showScreen('screen-settings');
      break;
    case 'go-play':
      document.getElementById('player-name-input').value = state.playerName === 'Pemain' ? '' : state.playerName;
      showScreen('screen-nameinput');
      break;
    case 'confirm-name': {
      const input = document.getElementById('player-name-input');
      const name = input.value.trim() || 'Pemain';
      startGame(name);
      break;
    }
    case 'quit-game':
      quitGame();
      break;
    case 'next-level':
      goToNextLevel();
      break;
    case 'clear-leaderboard':
      if (confirm('Hapus semua data papan skor?')) {
        saveLeaderboard([]);
        renderLeaderboard();
      }
      break;
    case 'reset-score':
      if (confirm('Reset skor tertinggi dan papan skor? Tindakan ini tidak bisa dibatalkan.')) {
        saveLeaderboard([]);
        alert('Papan skor telah direset!');
      }
      break;
    default:
      break;
  }
}

function initGlobalClickSound() {
  document.body.addEventListener('click', (e) => {
    if (e.target.closest('.btn, .btn-back, .learn-chip')) {
      playSfx('click');
    }
  });
}

function initActionButtons() {
  document.body.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    handleAction(el.getAttribute('data-action'));
  });
}

function initEnterKeyForNameInput() {
  document.getElementById('player-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAction('confirm-name');
  });
}

function hideSplashScreen() {
  const splash = document.getElementById('splash-screen');
  const app = document.getElementById('app');
  setTimeout(() => {
    splash.classList.add('fade-out');
    app.classList.remove('hidden');
    setTimeout(() => splash.remove(), 700);
  }, 1200);
}

function init() {
  loadSettings();
  initSettingsEvents();
  initActionButtons();
  initEnterKeyForNameInput();
  hideSplashScreen();
  showScreen('screen-home');
}

document.addEventListener('DOMContentLoaded', init);
