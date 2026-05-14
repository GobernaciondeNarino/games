// Flujo del juego: preguntas, avance de nivel, victoria y derrota.

import { state, POINTS_PER_CORRECT_ANSWER } from './state.js';
import { LEVELS } from './levels.js';
import { buildLevel } from './world.js';
import { player, playerInner, jumpState } from './player.js';
import {
  updateHUD, showToast, showTransition, showQuestion,
  renderAnswerFeedback, hideQuestion, showWin, showLose, getElapsedMs
} from './hud.js';

// Baraja las opciones (Fisher-Yates) y recalcula el índice correcto.
function shuffleQuestion(original) {
  const correctText = original.options[original.answer];
  const shuffled = original.options.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    question: original.question,
    options: shuffled,
    answer: shuffled.indexOf(correctText),
    explain: original.explain
  };
}

export function triggerQuestion() {
  state.questionOpen = true;
  state.canMove = false;
  state.pausedAt = performance.now();

  const level = LEVELS[state.levelIndex];
  const original = level.questions[Math.floor(Math.random() * level.questions.length)];
  const q = shuffleQuestion(original);

  showQuestion(level, state.levelIndex, q, idx => answerQuestion(idx, q));
}

function answerQuestion(idx, q) {
  const correct = idx === q.answer;
  renderAnswerFeedback(idx, q, correct, POINTS_PER_CORRECT_ANSWER);

  if (correct) {
    state.score++;
    state.points += POINTS_PER_CORRECT_ANSWER;
  } else {
    state.lives--;
  }
  updateHUD();

  setTimeout(() => {
    hideQuestion();
    if (state.pausedAt > 0) {
      state.pauseAccum += performance.now() - state.pausedAt;
      state.pausedAt = 0;
    }
    if (state.lives <= 0) return loseGame();
    nextLevel();
  }, 2800);
}

function nextLevel() {
  state.levelIndex++;
  state.questionOpen = false;
  if (state.levelIndex >= LEVELS.length) return winGame();

  const level = LEVELS[state.levelIndex];

  // Transición visual entre mundos, luego se construye el nuevo nivel.
  showTransition(level, state.levelIndex + 1, () => {
    buildLevel(level, player, jumpState, playerInner);
    updateHUD();
    showToast(level.name, level.subtitle);
    setTimeout(() => { state.canMove = true; }, 600);
  });
}

function winGame() {
  state.playing = false;
  state.elapsedMs = getElapsedMs();
  showWin();
}

function loseGame() {
  state.playing = false;
  state.elapsedMs = getElapsedMs();
  showLose();
}
