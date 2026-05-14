import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Chibi robot "ÑAÑO" — built entirely from Three.js primitives (no GLTF).
// buildChibi() returns the mesh + named part groups; ChibiRig wraps those
// with procedural idle / walk / run / jump animation. NPCs reuse both.
// ---------------------------------------------------------------------------

export const NANO_COLORS = {
  teal: 0x1a9b8a,
  tealDark: 0x158578,
  greenDark: 0x2e8b57,
  white: 0xffffff,
  yellow: 0xe8a020,
  black: 0x111111,
  mouthPink: 0xe89999,
};

const plasticMat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.12, ...extra });

// Generate the white "ÑAÑO" jersey texture on a canvas.
function makeShirtTexture(text = 'ÑAÑO') {
  const cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 512;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, cv.width, cv.height);
  // green stripe band
  ctx.fillStyle = '#2e8b57';
  ctx.fillRect(0, 200, cv.width, 130);
  // yellow line under the band
  ctx.fillStyle = '#e8a020';
  ctx.fillRect(0, 330, cv.width, 26);
  // crest (simplified) top-right
  ctx.fillStyle = '#2e8b57';
  ctx.fillRect(860, 70, 80, 90);
  ctx.fillStyle = '#e8a020';
  ctx.fillRect(876, 86, 48, 58);
  // text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 150px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cv.width / 2, 268);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function buildArm(C, side) {
  // side: -1 left, +1 right. Pivot at the shoulder (local origin).
  const g = new THREE.Group();
  const arm = plasticMat(C.teal);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), arm);
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.17, 0.5, 12), arm);
  upper.position.y = -0.35;
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), arm);
  elbow.position.y = -0.62;
  const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.16, 0.5, 12), arm);
  fore.position.y = -0.9;
  const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), arm);
  wrist.position.y = -1.15;
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), arm);
  hand.position.y = -1.35;
  hand.scale.y = 0.8;
  g.add(shoulder, upper, elbow, fore, wrist, hand);
  g.children.forEach((m) => (m.castShadow = true));
  g.rotation.z = side * 0.18; // splay outward ~10°
  return g;
}

function buildLeg(C) {
  // Pivot at the hip (local origin).
  const g = new THREE.Group();
  const teal = plasticMat(C.teal);
  const shorts = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.42, 14), teal);
  shorts.position.y = -0.18;
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.34, 12), teal);
  leg.position.y = -0.52;
  // shoe: green sole + white upper + yellow side flash
  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.62), plasticMat(C.greenDark));
  sole.position.set(0, -0.74, 0.08);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.46), plasticMat(C.white));
  upper.position.set(0, -0.6, 0.04);
  const flash = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.22), plasticMat(C.yellow));
  flash.position.set(0.2, -0.62, 0.06);
  g.add(shorts, leg, sole, upper, flash);
  g.children.forEach((m) => (m.castShadow = true));
  return g;
}

function buildHead(C, withFace = true) {
  const g = new THREE.Group(); // pivot at neck
  const teal = plasticMat(C.teal);
  // skull — slightly squashed
  const skull = new THREE.Mesh(new THREE.SphereGeometry(1.1, 28, 22), teal);
  skull.scale.y = 0.85;
  skull.position.y = 0.95;
  skull.castShadow = true;
  // "helmet-hair" front shell
  const hair = new THREE.Mesh(new THREE.SphereGeometry(1.16, 26, 20), plasticMat(C.tealDark));
  hair.scale.set(1, 0.78, 1);
  hair.position.set(0, 1.12, 0.08);
  hair.castShadow = true;
  g.add(skull, hair);

  if (withFace) {
    const eyeMat = plasticMat(C.black, { roughness: 0.12 });
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 14), eyeMat);
      eye.position.set(sx * 0.42, 0.95, 0.92);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), hlMat);
      hl.position.set(sx * 0.42 - 0.07, 1.03, 1.06);
      g.add(eye, hl);
    }
    // smiling mouth: squashed pink sphere + white teeth bar
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 12), plasticMat(C.mouthPink));
    mouth.scale.set(1.1, 0.55, 0.4);
    mouth.position.set(0, 0.5, 0.96);
    const teeth = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.05), plasticMat(C.white));
    teeth.position.set(0, 0.62, 1.06);
    g.add(mouth, teeth);
  }

  // headphones on the sides
  for (const sx of [-1, 1]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 18), plasticMat(C.greenDark));
    cup.rotation.z = Math.PI / 2;
    cup.position.set(sx * 1.04, 0.95, 0);
    cup.castShadow = true;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 14), plasticMat(0x0c3a28));
    hole.rotation.z = Math.PI / 2;
    hole.position.set(sx * 1.12, 0.95, 0);
    g.add(cup, hole);
  }

  // antenna — clearly on one side
  const antenna = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 8), plasticMat(C.teal));
  rod.position.y = 0.31;
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 12), plasticMat(C.teal));
  tip.position.y = 0.66;
  antenna.add(rod, tip);
  antenna.position.set(-0.5, 1.7, 0.1);
  g.add(antenna);
  g.userData.antenna = antenna;

  return g;
}

// Build a chibi character. palette defaults to ÑAÑO colors.
// opts: { shirtText: string|null, withFace: bool }
export function buildChibi(palette = NANO_COLORS, opts = {}) {
  const C = palette;
  const { shirtText = null, withFace = true } = opts;
  const group = new THREE.Group();

  // legs (pivot at hip, y ≈ 0.9 so feet land at y = 0)
  const hipY = 0.9;
  const legL = buildLeg(C); legL.position.set(-0.3, hipY, 0);
  const legR = buildLeg(C); legR.position.set(0.3, hipY, 0);
  group.add(legL, legR);

  // torso (pivot at waist for breathing scale)
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, hipY, 0);
  const bodyMat = plasticMat(C.teal);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.95, 16), bodyMat);
  body.position.y = 0.5;
  body.castShadow = true;
  torsoGroup.add(body);
  // jersey
  const shirtMat = shirtText
    ? new THREE.MeshStandardMaterial({ map: makeShirtTexture(shirtText), roughness: 0.5, metalness: 0.05 })
    : plasticMat(C.white);
  const shirt = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.78, 20, 1, true), shirtMat);
  shirt.position.y = 0.52;
  shirt.castShadow = true;
  torsoGroup.add(shirt);
  group.add(torsoGroup);

  // arms (attach near the shoulders)
  const armL = buildArm(C, -1); armL.position.set(-0.56, hipY + 0.86, 0);
  const armR = buildArm(C, 1); armR.position.set(0.56, hipY + 0.86, 0);
  group.add(armL, armR);

  // head (pivot at neck)
  const headGroup = buildHead(C, withFace);
  headGroup.position.set(0, hipY + 0.95, 0);
  group.add(headGroup);

  const parts = {
    legL, legR, armL, armR, torsoGroup, headGroup,
    antenna: headGroup.userData.antenna,
    body,
  };
  return { group, parts };
}

// Procedural animation rig shared by Ñaño and NPCs.
export class ChibiRig {
  constructor(palette = NANO_COLORS, opts = {}) {
    const { group, parts } = buildChibi(palette, opts);
    this.root = group;
    this.parts = parts;
    this._phase = 0;     // gait cycle phase
    this._t = 0;         // global time for idle motion
    this._facingY = 0;
    this._jumpBlend = 0; // 0 grounded .. 1 airborne
  }

  // opts: { speed, grounded, moveDir(Vector3|null), running }
  update(dt, { speed = 0, grounded = true, moveDir = null, running = false }) {
    this._t += dt;
    const p = this.parts;

    // gait cadence scales with speed
    const cadence = running ? 11 : 8;
    const moving = speed > 0.15;
    if (moving) this._phase += dt * cadence * Math.min(1.6, 0.5 + speed / 4);

    // jump blend
    const targetJump = grounded ? 0 : 1;
    this._jumpBlend += (targetJump - this._jumpBlend) * Math.min(1, dt * 10);
    const j = this._jumpBlend;

    const swing = moving ? Math.sin(this._phase) : 0;
    const swing2 = moving ? Math.sin(this._phase + Math.PI) : 0;
    const amp = running ? 0.85 : 0.55;

    // legs: swing opposite; tuck up while airborne
    p.legL.rotation.x = swing * amp - j * 0.7;
    p.legR.rotation.x = swing2 * amp - j * 0.5;
    // arms: swing opposite to legs; raise slightly when airborne
    p.armL.rotation.x = swing2 * amp * 0.9 - j * 0.6;
    p.armR.rotation.x = swing * amp * 0.9 - j * 0.6;
    p.armL.rotation.z = 0.18 + (moving ? 0 : Math.sin(this._t * 1.2) * 0.04);
    p.armR.rotation.z = -0.18 - (moving ? 0 : Math.sin(this._t * 1.2) * 0.04);

    // body bob + breathing + forward lean when running
    const bob = moving ? Math.abs(Math.sin(this._phase)) * (running ? 0.12 : 0.07) : 0;
    const breathe = moving ? 0 : Math.sin(this._t * 1.5) * 0.02;
    p.torsoGroup.position.y = 0.9 + bob;
    p.torsoGroup.scale.y = 1 + breathe;
    p.torsoGroup.rotation.x = (running && moving ? 0.22 : moving ? 0.1 : 0) + j * -0.15;

    // head: subtle nod when idle, counter-bob when moving
    p.headGroup.position.y = 1.85 + bob;
    p.headGroup.rotation.x = moving ? -bob * 0.6 : Math.sin(this._t * 0.8) * 0.05;

    // antenna sway
    if (p.antenna) p.antenna.rotation.z = Math.sin(this._t * 2.5 + this._phase * 0.5) * 0.15;

    // facing
    if (moveDir && (moveDir.x !== 0 || moveDir.z !== 0)) {
      const targetY = Math.atan2(moveDir.x, moveDir.z);
      let dy = targetY - this._facingY;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this._facingY += dy * Math.min(1, dt * 10);
      this.root.rotation.y = this._facingY;
    }
  }
}

// Player wrapper — keeps the async load() interface main.js already uses.
export class NanoCharacter {
  constructor() {
    this.rig = null;
    this.root = new THREE.Group();
    this.root.name = 'Nano';
  }

  async load() {
    this.rig = new ChibiRig(NANO_COLORS, { shirtText: 'ÑAÑO', withFace: true });
    this.rig.root.scale.setScalar(0.5); // ~1.75 game units tall
    this.root.add(this.rig.root);
    return this;
  }

  update(dt, opts) {
    if (this.rig) this.rig.update(dt, opts);
  }
}
