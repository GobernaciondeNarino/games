// HUD y overlays: marcadores, toasts, pantalla de pregunta, transiciones
// entre mundos y pantallas de victoria/derrota.

import { state } from './state.js';
import { LEVELS } from './levels.js';

export function getElapsedMs() {
  if (!state.startTime) return 0;
  return performance.now() - state.startTime - state.pauseAccum;
}

export function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function updateHUD() {
  document.getElementById('hud-hearts').textContent =
    '❤️'.repeat(Math.max(state.lives, 0)) + '🤍'.repeat(Math.max(0, 3 - state.lives));
  const lvl = LEVELS[state.levelIndex] || LEVELS[LEVELS.length - 1];
  document.getElementById('hud-place').textContent = lvl.name;
  document.getElementById('hud-score').textContent = `${state.score} / ${LEVELS.length}`;
  document.getElementById('hud-time').textContent = formatTime(getElapsedMs());
  const totalLvl = state.hintsAvailableInLevel || 3;
  document.getElementById('hud-hints').textContent = `💎 ${state.hintsInLevel} / ${totalLvl}`;
  document.getElementById('hud-points').textContent = state.points;

  const list = document.getElementById('minimap-list');
  list.innerHTML = '';
  LEVELS.forEach((l, i) => {
    const li = document.createElement('li');
    li.textContent = l.name;
    if (i < state.levelIndex) li.classList.add('done');
    else if (i === state.levelIndex) li.classList.add('current');
    list.appendChild(li);
  });
}

export function updateTimeOnly() {
  const tEl = document.getElementById('hud-time');
  if (tEl) tEl.textContent = formatTime(getElapsedMs());
}

export function showToast(title, text) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-text').textContent = text;
  toast.classList.add('visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('visible'), 2400);
}

export function showHintToast(text) {
  let hintBox = document.getElementById('hint-toast');
  if (!hintBox) {
    hintBox = document.createElement('div');
    hintBox.id = 'hint-toast';
    hintBox.innerHTML = `
      <div class="hint-icon">💎</div>
      <div class="hint-text"></div>
      <div class="hint-points">+2 pts</div>
    `;
    document.body.appendChild(hintBox);
  }
  hintBox.querySelector('.hint-text').textContent = text;
  hintBox.classList.add('visible');
  clearTimeout(showHintToast._timer);
  showHintToast._timer = setTimeout(() => hintBox.classList.remove('visible'), 4500);
}

export function showCameraHint() {
  const hint = document.getElementById('camera-hint');
  if (!hint) return;
  hint.classList.remove('hidden');
  // La animación CSS dura ~2.2s; ocultamos después
  setTimeout(() => hint.classList.add('hidden'), 2400);
}

// Pantalla de transición entre mundos. Llama a `onDone` cuando termina.
export function showTransition(level, levelNumber, onDone) {
  const screen = document.getElementById('screen-transition');
  document.getElementById('trans-badge').textContent = `Nivel ${levelNumber} de ${LEVELS.length}`;
  document.getElementById('trans-title').textContent = level.name;
  document.getElementById('trans-subtitle').textContent = level.subtitle;
  document.getElementById('trans-tip').textContent = level.tip || '';
  screen.classList.remove('hidden');
  setTimeout(() => {
    screen.classList.add('hidden');
    if (onDone) onDone();
  }, 1900);
}

// Renderiza una pregunta. `onAnswer(idx)` se invoca al pulsar una opción.
export function showQuestion(level, levelIndex, q, onAnswer) {
  document.getElementById('q-level').textContent = `Nivel ${levelIndex + 1} · ${level.name}`;
  document.getElementById('q-title').textContent = q.question;
  const optsBox = document.getElementById('q-options');
  optsBox.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.onclick = () => onAnswer(idx);
    optsBox.appendChild(btn);
  });
  const fb = document.getElementById('feedback');
  fb.className = '';
  fb.textContent = '';
  document.getElementById('screen-question').classList.remove('hidden');
}

export function renderAnswerFeedback(idx, q, correct, pointsPerCorrect) {
  const buttons = document.querySelectorAll('#q-options .option');
  buttons.forEach(b => (b.disabled = true));
  buttons[q.answer].classList.add('correct');
  if (!correct) buttons[idx].classList.add('wrong');

  const fb = document.getElementById('feedback');
  fb.classList.add('show');
  if (correct) {
    fb.classList.add('correct');
    fb.innerHTML = `<strong>¡Correcto!</strong> +${pointsPerCorrect} puntos · ${q.explain}`;
  } else {
    fb.classList.add('wrong');
    fb.innerHTML = `<strong>No es correcto.</strong> ${q.explain}`;
  }
}

export function hideQuestion() {
  document.getElementById('screen-question').classList.add('hidden');
}

function hideGameUI() {
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('hud-tip').classList.add('hidden');
  document.getElementById('minimap').classList.add('hidden');
  document.getElementById('compass').classList.add('hidden');
  document.getElementById('mobile-controls').classList.remove('visible');
}

export function showWin() {
  hideGameUI();
  const maxHints = LEVELS.length * 3;
  document.getElementById('win-stats').innerHTML =
    `<strong style="color: var(--yellow-vibrant); font-size: 28px;">${state.points} puntos</strong><br>` +
    `Aciertos: <strong>${state.score} de ${LEVELS.length}</strong><br>` +
    `Pistas: <strong>💎 ${state.hintsCollected} de ${maxHints}</strong><br>` +
    `Vidas restantes: <strong>${state.lives}</strong><br>` +
    `Tiempo total: <strong>${formatTime(state.elapsedMs)}</strong>`;
  document.getElementById('screen-win').classList.remove('hidden');
}

export function showLose() {
  hideGameUI();
  const maxHints = LEVELS.length * 3;
  document.getElementById('lose-stats').innerHTML =
    `<strong style="color: var(--yellow-vibrant); font-size: 28px;">${state.points} puntos</strong><br>` +
    `Llegaste hasta: <strong>${LEVELS[state.levelIndex]?.name || '—'}</strong><br>` +
    `Aciertos: <strong>${state.score}</strong><br>` +
    `Pistas: <strong>💎 ${state.hintsCollected} de ${maxHints}</strong><br>` +
    `Tiempo jugado: <strong>${formatTime(state.elapsedMs)}</strong>`;
  document.getElementById('screen-lose').classList.remove('hidden');
}
