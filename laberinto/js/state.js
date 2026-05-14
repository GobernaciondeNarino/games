// Estado global compartido entre módulos.

export const state = {
  selectedChar: null,
  levelIndex: 0,
  lives: 3,
  score: 0,
  hintsCollected: 0,
  hintsInLevel: 0,
  hintsAvailableInLevel: 0,
  points: 0,
  playing: false,
  canMove: true,
  questionOpen: false,
  startTime: 0,
  elapsedMs: 0,
  pausedAt: 0,
  pauseAccum: 0
};

export const PLAYER_RADIUS = 0.55;
export const GRAVITY = 38;
export const JUMP_VELOCITY = 11;

export const POINTS_PER_HINT = 2;
export const POINTS_PER_CORRECT_ANSWER = 10;
