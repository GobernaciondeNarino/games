// Keyboard + mouse-drag input. Yaw/pitch only update while a button is held
// (so the user can still interact with HUD / DevTools without grabbing mouse).
export class Controls {
  constructor(canvas) {
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = 0.45;
    this.distance = 7;

    this._dragging = false;
    this._sens = 0.0035;

    addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      // prevent page scroll
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointerdown', (e) => {
      this._dragging = true;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointerup', (e) => {
      this._dragging = false;
      try { canvas.releasePointerCapture(e.pointerId); } catch {}
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!this._dragging) return;
      this.yaw += e.movementX * this._sens;
      this.pitch -= e.movementY * this._sens;
      const lim = Math.PI / 2 - 0.05;
      if (this.pitch > lim) this.pitch = lim;
      if (this.pitch < -0.6) this.pitch = -0.6;
    });
    canvas.addEventListener('wheel', (e) => {
      this.distance += e.deltaY * 0.01;
      if (this.distance < 3) this.distance = 3;
      if (this.distance > 18) this.distance = 18;
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  get forward() { return this.keys.has('KeyW') || this.keys.has('ArrowUp'); }
  get back()    { return this.keys.has('KeyS') || this.keys.has('ArrowDown'); }
  get left()    { return this.keys.has('KeyA') || this.keys.has('ArrowLeft'); }
  get right()   { return this.keys.has('KeyD') || this.keys.has('ArrowRight'); }
  get jump()    { return this.keys.has('Space'); }
  get run()     { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); }
}
