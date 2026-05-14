// Punto de entrada: arranque, selección de personaje, bucle de animación
// y orquestación de todos los módulos.

import { state } from './state.js?v=4';
import { CHARACTERS, LEVELS } from './levels.js?v=4';
import {
  initWorld, scene, renderer, clock, levelGroup,
  buildLevel, animateDecoration, onResize, portal
} from './world.js?v=4';
import {
  initCamera, camera, updateCamera, updateCompass,
  setOrbitEnabled, isOrbitEnabled
} from './camera.js?v=4';
import {
  preloadCharacters, loadCharacterGLB, buildPlayerGLB,
  player, playerInner, jumpState, updatePlayer
} from './player.js?v=4';
import { initControls } from './controls.js?v=4';
import { checkEmeraldPickup, animateEmeralds, activeEmeralds } from './emeralds.js?v=4';
import { triggerQuestion } from './game.js?v=4';
import {
  updateHUD, updateTimeOnly, showToast, showCameraHint
} from './hud.js?v=4';

let bobTime = 0;

// Ajusta el texto de ayuda del HUD según el estado de la cámara orbital.
function updateTipText() {
  const kb = document.getElementById('kb-tip-text');
  const touch = document.getElementById('touch-tip-text');
  if (kb) {
    kb.innerHTML = isOrbitEnabled()
      ? '<kbd>WASD</kbd> mover · <kbd>Espacio</kbd> saltar · <kbd>Mouse</kbd> orbitar · <kbd>Rueda</kbd> zoom · <kbd>C</kbd> centrar'
      : '<kbd>WASD</kbd> mover · <kbd>Espacio</kbd> saltar · <kbd>C</kbd>ámara orbital: desactivada';
  }
  if (touch) {
    touch.textContent = isOrbitEnabled()
      ? 'Joystick para moverte · Arrastra un dedo para orbitar · Pellizca para zoom'
      : 'Joystick para moverte · Botón ▲ para saltar';
  }
}

function init() {
  // Señala al detector de fallo de index.html que los módulos sí cargaron.
  window.__juegoArranco = true;

  const canvas = initWorld();
  initCamera(canvas);
  initControls();
  window.addEventListener('resize', () => onResize(camera));

  // Selección de personaje
  document.querySelectorAll('.char-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.char-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.selectedChar = card.dataset.char;
      document.getElementById('btn-start').disabled = false;
    });
  });

  document.getElementById('btn-start').addEventListener('click', onStart);

  // Interruptor de cámara orbital (arranca DESHABILITADO).
  const orbitToggle = document.getElementById('toggle-orbit');
  if (orbitToggle) {
    orbitToggle.checked = false;
    setOrbitEnabled(false);
    orbitToggle.addEventListener('change', () => {
      setOrbitEnabled(orbitToggle.checked);
      updateTipText();
    });
  }

  preloadCharacters();
  animate();

  // Ocultar pantalla de carga inicial
  setTimeout(() => {
    document.getElementById('loading').classList.add('hidden');
    setTimeout(() => document.getElementById('loading').remove(), 600);
  }, 800);
}

async function onStart() {
  if (!state.selectedChar) return;
  const btn = document.getElementById('btn-start');
  const charGrid = document.querySelector('.char-grid');
  const loadingPanel = document.getElementById('loading-panel');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const progressPercent = document.getElementById('progress-percent');
  const progressHint = document.getElementById('progress-hint');
  const loadingCharImg = document.getElementById('loading-char-img');
  const loadingCharName = document.getElementById('loading-char-name');

  btn.style.display = 'none';
  charGrid.style.display = 'none';
  loadingCharImg.src = CHARACTERS[state.selectedChar].preview;
  loadingCharName.textContent = CHARACTERS[state.selectedChar].name;
  loadingPanel.classList.add('active');

  let simulated = 0;
  let realProgress = 0;
  let isDeterminate = false;
  const startTime = performance.now();

  const simInterval = setInterval(() => {
    const elapsed = (performance.now() - startTime) / 1000;
    simulated = Math.min(90, 100 * (1 - Math.exp(-elapsed * 0.45)));
    const display = Math.max(simulated, realProgress);
    if (!isDeterminate) {
      progressFill.style.width = display + '%';
      progressPercent.textContent = Math.floor(display);
    }
  }, 80);

  const updateHint = p => {
    if (p < 30) progressHint.textContent = 'Descargando modelo 3D...';
    else if (p < 70) progressHint.textContent = 'Recibiendo geometría y texturas...';
    else if (p < 95) progressHint.textContent = 'Casi listo...';
    else progressHint.textContent = 'Preparando la escena...';
  };
  updateHint(0);

  try {
    const gltf = await loadCharacterGLB(state.selectedChar, xhr => {
      if (xhr.lengthComputable && xhr.total > 0) {
        isDeterminate = true;
        progressBar.classList.remove('indeterminate');
        realProgress = (xhr.loaded / xhr.total) * 100;
        const display = Math.max(realProgress, simulated);
        progressFill.style.width = display + '%';
        progressPercent.textContent = Math.floor(display);
        updateHint(display);
      }
    });

    clearInterval(simInterval);
    progressFill.style.width = '100%';
    progressPercent.textContent = '100';
    progressHint.textContent = '¡Listo!';
    await new Promise(r => setTimeout(r, 350));

    const builtPlayer = buildPlayerGLB(gltf);
    scene.add(builtPlayer);
    buildLevel(LEVELS[0], builtPlayer, jumpState, playerInner);

    state.startTime = performance.now();
    state.pauseAccum = 0;
    state.pausedAt = 0;

    document.getElementById('screen-start').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('hud-tip').classList.remove('hidden');
    document.getElementById('minimap').classList.remove('hidden');
    document.getElementById('compass').classList.remove('hidden');
    document.getElementById('mobile-controls').classList.add('visible');

    state.playing = true;
    state.canMove = true;
    updateHUD();
    updateTipText();
    showToast(LEVELS[0].name, LEVELS[0].subtitle);
    // La pista de cámara solo tiene sentido si la cámara orbital está activa.
    if (isOrbitEnabled()) showCameraHint();

    setTimeout(() => {
      const tip = document.getElementById('hud-tip');
      tip.style.transition = 'opacity 1s';
      tip.style.opacity = '0';
    }, 7500);
  } catch (err) {
    clearInterval(simInterval);
    console.error('Error cargando modelo GLB:', err);
    progressHint.style.color = 'var(--accent-red)';
    progressHint.textContent = 'No se pudo cargar el modelo 3D. Verifica tu conexión.';
    setTimeout(() => {
      loadingPanel.classList.remove('active');
      charGrid.style.display = 'flex';
      btn.style.display = '';
      btn.disabled = false;
      progressHint.style.color = '';
    }, 3000);
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  bobTime += dt;

  // El portal vive dentro de world.js; lo leemos vía import dinámico de binding.
  const reachedPortal = updatePlayer(dt, bobTime, portal);
  if (reachedPortal) triggerQuestion();

  if (player) {
    updateCamera(player);
    updateCompass();
  }

  animateDecoration(dt, bobTime);

  if (state.playing && state.canMove && activeEmeralds.length > 0) {
    checkEmeraldPickup(player);
  }
  animateEmeralds(dt, bobTime, levelGroup);

  if (state.playing && !state.questionOpen) updateTimeOnly();

  renderer.render(scene, camera);
}

init();
