// Controles: teclado (WASD/flechas, salto, recentrar cámara) y
// joystick virtual + botón de salto para dispositivos táctiles.

import { setKey, doJump, joystick, player } from './player.js';
import { recenterCamera } from './camera.js';

export const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

export function initControls() {
  if (isTouchDevice) document.body.classList.add('touch-device');

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    setKey(k, true);
    if (e.code === 'Space') {
      e.preventDefault();
      doJump();
    }
    if (k === 'c') {
      recenterCamera(player);
    }
  });
  document.addEventListener('keyup', e => {
    setKey(e.key.toLowerCase(), false);
  });

  initJoystick();
}

function initJoystick() {
  const joystickBase = document.getElementById('joystick-base');
  const joystickKnob = document.getElementById('joystick-knob');
  const jumpBtn = document.getElementById('jump-btn');

  const js = {
    pointerId: null,
    centerX: 0,
    centerY: 0,
    maxRadius: 50
  };

  function updateKnob(clientX, clientY) {
    let dx = clientX - js.centerX;
    let dy = clientY - js.centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > js.maxRadius) {
      const factor = js.maxRadius / dist;
      dx *= factor;
      dy *= factor;
    }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    joystick.dx = dx / js.maxRadius;
    joystick.dy = dy / js.maxRadius;
  }

  function endJoystick(e) {
    if (js.pointerId === null || e.pointerId === js.pointerId) {
      joystick.active = false;
      js.pointerId = null;
      joystick.dx = 0;
      joystick.dy = 0;
      joystickKnob.style.transform = 'translate(0, 0)';
    }
  }

  joystickBase.addEventListener('pointerdown', e => {
    e.preventDefault();
    joystick.active = true;
    js.pointerId = e.pointerId;
    try { joystickBase.setPointerCapture(e.pointerId); } catch (_) {}
    const rect = joystickBase.getBoundingClientRect();
    js.centerX = rect.left + rect.width / 2;
    js.centerY = rect.top + rect.height / 2;
    updateKnob(e.clientX, e.clientY);
  });
  joystickBase.addEventListener('pointermove', e => {
    if (joystick.active && e.pointerId === js.pointerId) updateKnob(e.clientX, e.clientY);
  });
  joystickBase.addEventListener('pointerup', endJoystick);
  joystickBase.addEventListener('pointercancel', endJoystick);
  joystickBase.addEventListener('pointerleave', endJoystick);

  jumpBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    doJump();
  });
}
