// =============================================================================
// Ñaño 3D — lógica del juego (Three.js, sin build, módulo ES nativo).
// La librería Three.js vive en ../vendor/three.module.js y se importa abajo.
// Este archivo lo carga index.html como <script type="module" src="js/main.js">.
// =============================================================================
// --- carga de Three.js con mensaje de error claro si falta ---
let THREE;
try {
  THREE = await import('../vendor/three.module.js');
} catch (err) {
  const el = document.getElementById('loading');
  el.className = 'error';
  el.textContent = 'No se pudo cargar vendor/three.module.js — sube la carpeta vendor/ junto a este index.html.';
  throw err;
}

// =========================================================================
// colliders — mundo de colisión compartido (AABB + círculos)
// =========================================================================
class ColliderWorld {
  constructor() {
    this.static = [];
    this.dynamic = [];
  }
  addAABB(minX, minZ, maxX, maxZ, topY = Infinity) {
    this.static.push({ kind: 'aabb', minX, minZ, maxX, maxZ, topY });
  }
  addCircle(x, z, r, topY = Infinity) {
    this.static.push({ kind: 'circle', x, z, r, topY });
  }
  addDynamic(x, z, r, topY, owner) {
    this.dynamic.push({ kind: 'circle', x, z, r, topY, owner });
  }
  clearDynamic() {
    this.dynamic.length = 0;
  }
  // Empuja un círculo (pos = Vector3, mutado) fuera de cada colisión.
  resolveCircle(pos, radius, includeDynamic = true, skip = null) {
    let touched = false;
    const lists = includeDynamic ? [this.static, this.dynamic] : [this.static];
    for (const list of lists) {
      for (const c of list) {
        if (c.owner && c.owner === skip) continue;
        if (pos.y > c.topY + 0.05) continue;
        if (c.kind === 'aabb') {
          const cx = Math.max(c.minX, Math.min(pos.x, c.maxX));
          const cz = Math.max(c.minZ, Math.min(pos.z, c.maxZ));
          const dx = pos.x - cx, dz = pos.z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 < radius * radius) {
            const d = Math.sqrt(d2) || 0.0001;
            const push = (radius - d) / d;
            pos.x += dx * push; pos.z += dz * push;
            touched = true;
          }
        } else {
          const dx = pos.x - c.x, dz = pos.z - c.z;
          const rr = radius + c.r;
          const d2 = dx * dx + dz * dz;
          if (d2 < rr * rr) {
            const d = Math.sqrt(d2) || 0.0001;
            const push = (rr - d) / d;
            pos.x += dx * push; pos.z += dz * push;
            touched = true;
          }
        }
      }
    }
    return touched;
  }
}

// =========================================================================
// controls — teclado + arrastre de mouse
// =========================================================================
class Controls {
  constructor(canvas) {
    this.keys = new Set();
    this.yaw = 0;
    this.pitch = 0.45;
    this.distance = 7;
    this._dragging = false;
    this._sens = 0.0035;

    addEventListener('keydown', (e) => {
      this.keys.add(e.code);
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

// =========================================================================
// physics — gravedad, salto, ground-snap, step-up, colisión horizontal
// =========================================================================
class Physics {
  constructor(terrain, colliders) {
    this.terrain = terrain;
    this.colliders = colliders;
    this.gravity = -25;
    this.jumpV = 8.5;
    this.stepHeight = 0.55;
    this.radius = 0.45;
  }
  groundAt(x, z) { return this.terrain.getHeightAt(x, z); }
  update(state, dt, moveXZ, jumpPressed, skip = null) {
    const pos = state.position;
    if (moveXZ.lengthSq() > 0) {
      const nextX = pos.x + moveXZ.x * dt;
      const nextZ = pos.z + moveXZ.z * dt;
      const groundNext = this.groundAt(nextX, nextZ);
      const dy = groundNext - pos.y;
      if (dy <= this.stepHeight + 0.01 || !state.grounded) {
        pos.x = nextX;
        pos.z = nextZ;
        if (state.grounded && dy <= this.stepHeight + 0.01 && dy > 0) pos.y = groundNext;
      }
    }
    this.colliders.resolveCircle(pos, this.radius, true, skip);
    state.velocityY += this.gravity * dt;
    pos.y += state.velocityY * dt;
    const groundY = this.groundAt(pos.x, pos.z);
    if (pos.y <= groundY) {
      pos.y = groundY;
      state.velocityY = 0;
      state.grounded = true;
    } else {
      state.grounded = false;
    }
    if (jumpPressed && state.grounded) {
      state.velocityY = this.jumpV;
      state.grounded = false;
    }
  }
}

// =========================================================================
// terrain — heightmap value-noise + escaleras + zonas planas
// =========================================================================
const _hash = (x, y) => {
  let n = x * 374761393 + y * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  n = n ^ (n >> 16);
  return ((n >>> 0) / 4294967295) * 2 - 1;
};
const _smoothStep = (t) => t * t * (3 - 2 * t);
const valueNoise2D = (x, y) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = _smoothStep(xf), v = _smoothStep(yf);
  const a = _hash(xi, yi);
  const b = _hash(xi + 1, yi);
  const c = _hash(xi, yi + 1);
  const d = _hash(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
};
const fbm = (x, y) => {
  let f = 0, amp = 1, freq = 1, norm = 0;
  for (let i = 0; i < 4; i++) {
    f += amp * valueNoise2D(x * freq, y * freq);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return f / norm;
};

const TERRAIN_SIZE = 200;
const TERRAIN_SEG = 200;
const MAZE_REGION = { cx: 40, cz: 40, w: 60, h: 60, y: 0 };
const SOCCER_REGION = { cx: -48, cz: 30, w: 44, h: 30, y: 0.25 };
const TECH_REGION = { cx: 46, cz: -46, w: 34, h: 34, y: 0.35 };
// Plataforma de escalera más larga (más escalones) y mucho más baja
// (paso de 0.22 en lugar de 0.5) para que sea fácil de subir.
const STAIR_REGION = { cx: -30, cz: -42, w: 14, h: 30, baseY: 0, step: 0.22 };
// Lomas suaves: HEIGHT_SCALE bajado de 6 a 3.2 para un mundo más caminable.
const HEIGHT_SCALE = 3.2;
const inZone = (x, z, r) =>
  Math.abs(x - r.cx) < r.w / 2 && Math.abs(z - r.cz) < r.h / 2;

class Terrain {
  constructor() {
    const geo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, TERRAIN_SEG, TERRAIN_SEG);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cols = TERRAIN_SEG + 1;
    const rows = TERRAIN_SEG + 1;
    this.heights = new Float32Array(cols * rows);
    this.cols = cols;
    this.rows = rows;

    const c1 = new THREE.Color(0x3da35d); // grass
    const c2 = new THREE.Color(0x8c6a3a); // dirt
    const c3 = new THREE.Color(0xeaeaea); // stone
    const c4 = new THREE.Color(0xc7a574); // maze path
    const c5 = new THREE.Color(0x2f9e44); // soccer pitch
    const c6 = new THREE.Color(0x8a8f99); // tech plaza

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = fbm(x * 0.04, z * 0.04) * HEIGHT_SCALE;
      if (inZone(x, z, STAIR_REGION)) {
        // 14 escalones a lo largo de la zona (antes 10): cada uno más
        // pequeño, así la rampa total queda mucho más baja.
        const tz = (z - (STAIR_REGION.cz - STAIR_REGION.h / 2)) / STAIR_REGION.h;
        const steps = Math.floor(tz * 14);
        y = STAIR_REGION.baseY + steps * STAIR_REGION.step;
      }
      if (inZone(x, z, MAZE_REGION)) y = MAZE_REGION.y;
      else if (inZone(x, z, SOCCER_REGION)) y = SOCCER_REGION.y;
      else if (inZone(x, z, TECH_REGION)) y = TECH_REGION.y;
      pos.setY(i, y);
      const ix = i % cols;
      const iz = (i - ix) / cols;
      this.heights[iz * cols + ix] = y;
      let col;
      if (inZone(x, z, MAZE_REGION)) col = c4;
      else if (inZone(x, z, SOCCER_REGION)) col = c5;
      else if (inZone(x, z, TECH_REGION)) col = c6;
      else if (inZone(x, z, STAIR_REGION)) col = c3;
      else if (y > 3) col = c2;
      else col = c1;
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const tmat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.95, metalness: 0.0, flatShading: false,
    });
    this.mesh = new THREE.Mesh(geo, tmat);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'Terrain';
  }
  getHeightAt(x, z) {
    const half = TERRAIN_SIZE / 2;
    const fx = ((x + half) / TERRAIN_SIZE) * (this.cols - 1);
    const fz = ((z + half) / TERRAIN_SIZE) * (this.rows - 1);
    if (fx < 0 || fz < 0 || fx > this.cols - 1 || fz > this.rows - 1) return 0;
    const x0 = Math.floor(fx), z0 = Math.floor(fz);
    const x1 = Math.min(x0 + 1, this.cols - 1);
    const z1 = Math.min(z0 + 1, this.rows - 1);
    const tx = fx - x0, tz = fz - z0;
    const h00 = this.heights[z0 * this.cols + x0];
    const h10 = this.heights[z0 * this.cols + x1];
    const h01 = this.heights[z1 * this.cols + x0];
    const h11 = this.heights[z1 * this.cols + x1];
    return (h00 * (1 - tx) + h10 * tx) * (1 - tz) + (h01 * (1 - tx) + h11 * tx) * tz;
  }
}

// =========================================================================
// maze — laberinto recursive-backtracker
// =========================================================================
function generateMaze(cols, rows) {
  const cells = new Array(cols * rows);
  for (let i = 0; i < cells.length; i++) cells[i] = { visited: false, walls: [true, true, true, true] };
  const idx = (x, y) => y * cols + x;
  const stack = [];
  cells[idx(0, 0)].visited = true;
  stack.push([0, 0]);
  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors = [];
    if (cy > 0 && !cells[idx(cx, cy - 1)].visited) neighbors.push([cx, cy - 1, 0, 2]);
    if (cx < cols - 1 && !cells[idx(cx + 1, cy)].visited) neighbors.push([cx + 1, cy, 1, 3]);
    if (cy < rows - 1 && !cells[idx(cx, cy + 1)].visited) neighbors.push([cx, cy + 1, 2, 0]);
    if (cx > 0 && !cells[idx(cx - 1, cy)].visited) neighbors.push([cx - 1, cy, 3, 1]);
    if (!neighbors.length) { stack.pop(); continue; }
    const [nx, ny, wallA, wallB] = neighbors[Math.floor(Math.random() * neighbors.length)];
    cells[idx(cx, cy)].walls[wallA] = false;
    cells[idx(nx, ny)].walls[wallB] = false;
    cells[idx(nx, ny)].visited = true;
    stack.push([nx, ny]);
  }
  cells[idx(0, rows - 1)].walls[2] = false;       // entrada
  cells[idx(cols - 1, 0)].walls[0] = false;       // salida
  return { cells, cols, rows };
}
function makeWallSeg(x0, z0, x1, z1) { return { x0, z0, x1, z1 }; }

class Maze {
  constructor() {
    const cols = 12, rows = 12;
    const cellSize = MAZE_REGION.w / cols;
    const wallThickness = 0.3;
    const wallHeight = 2.6;
    const baseY = MAZE_REGION.y;
    const m = generateMaze(cols, rows);
    const segments = [];
    const ox = MAZE_REGION.cx - MAZE_REGION.w / 2;
    const oz = MAZE_REGION.cz - MAZE_REGION.h / 2;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = m.cells[y * cols + x];
        const x0 = ox + x * cellSize;
        const z0 = oz + y * cellSize;
        if (c.walls[0] && y === 0) segments.push(makeWallSeg(x0, z0, x0 + cellSize, z0));
        if (c.walls[3] && x === 0) segments.push(makeWallSeg(x0, z0, x0, z0 + cellSize));
        if (c.walls[1]) segments.push(makeWallSeg(x0 + cellSize, z0, x0 + cellSize, z0 + cellSize));
        if (c.walls[2]) segments.push(makeWallSeg(x0, z0 + cellSize, x0 + cellSize, z0 + cellSize));
      }
    }
    const geom = new THREE.BoxGeometry(1, wallHeight, 1);
    geom.translate(0, wallHeight / 2, 0);
    const wmat = new THREE.MeshStandardMaterial({ color: 0x6e5b3a, roughness: 0.85, metalness: 0.05 });
    const inst = new THREE.InstancedMesh(geom, wmat, segments.length);
    inst.castShadow = true;
    inst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    this.bounds = [];
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const cx = (s.x0 + s.x1) / 2;
      const cz = (s.z0 + s.z1) / 2;
      const dx = Math.abs(s.x1 - s.x0);
      const dz = Math.abs(s.z1 - s.z0);
      const sx = Math.max(dx, wallThickness);
      const sz = Math.max(dz, wallThickness);
      dummy.position.set(cx, baseY, cz);
      dummy.scale.set(sx, 1, sz);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      this.bounds.push({
        minX: cx - sx / 2, maxX: cx + sx / 2,
        minZ: cz - sz / 2, maxZ: cz + sz / 2,
        topY: baseY + wallHeight,
      });
    }
    inst.instanceMatrix.needsUpdate = true;
    this.mesh = inst;
    this.spawnPoint = new THREE.Vector3(ox + cellSize / 2, baseY, oz + rows * cellSize + 2.5);
  }
  registerColliders(colliders) {
    for (const b of this.bounds) colliders.addAABB(b.minX, b.minZ, b.maxX, b.maxZ, b.topY);
  }
}

// =========================================================================
// character — Ñaño chibi por primitivas + ChibiRig (animación procedural)
// =========================================================================
const NANO_COLORS = {
  teal: 0x1a9b8a, tealDark: 0x158578, greenDark: 0x2e8b57,
  white: 0xffffff, yellow: 0xe8a020, black: 0x111111, mouthPink: 0xe89999,
};
const plasticMat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.12, ...extra });

// Textura para la cara frontal del torso-caja: fondo blanco, banda verde
// con filete amarillo, el texto "ÑAÑO" y un pequeño escudo arriba a la
// derecha (réplica del mascota de referencia).
function makeShirtTexture(text = 'ÑAÑO') {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 512;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#f5f5f5'; ctx.fillRect(0, 0, 512, 512);
  // escudo arriba a la derecha
  ctx.fillStyle = '#2e8b57'; ctx.fillRect(404, 40, 70, 86);
  ctx.fillStyle = '#e8a020'; ctx.fillRect(418, 54, 42, 58);
  ctx.fillStyle = '#2e8b57'; ctx.fillRect(427, 63, 24, 40);
  // banda central
  ctx.fillStyle = '#2e8b57'; ctx.fillRect(0, 250, 512, 120);
  ctx.fillStyle = '#e8a020'; ctx.fillRect(0, 358, 512, 20);
  // texto
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 116px Arial, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 304);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Mano robótica estilizada: palma en caja + tres dedos de dos falanges y
// un pulgar. `side` (-1/+1) coloca el pulgar hacia adentro.
function buildHand(handMat, side) {
  const h = new THREE.Group();
  const palm = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.2, 0.34), handMat);
  palm.position.y = -0.1;
  h.add(palm);
  for (let i = 0; i < 3; i++) {
    const fx = (i - 1) * 0.088;
    const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.15, 0.1), handMat);
    seg1.position.set(fx, -0.25, 0.08);
    const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.066, 0.13, 0.09), handMat);
    seg2.position.set(fx, -0.36, 0.13);
    seg2.rotation.x = 0.55;
    h.add(seg1, seg2);
  }
  const thumb1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.085), handMat);
  thumb1.position.set(side * 0.17, -0.13, 0.04);
  thumb1.rotation.z = side * 0.95;
  const thumb2 = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.11, 0.08), handMat);
  thumb2.position.set(side * 0.22, -0.04, 0.12);
  thumb2.rotation.set(0.5, 0, side * 0.95);
  h.add(thumb1, thumb2);
  h.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return h;
}

// Brazo robótico articulado: rótula del hombro → brazo → rótula del codo
// → antebrazo → muñeca → mano con dedos. Cada junta es una esfera real,
// así que el codo flexiona de forma natural.
// userData.forearm es el pivote del codo para la animación.
function buildArm(C, side) {
  const g = new THREE.Group();                 // pivote del hombro
  const arm = plasticMat(C.teal);
  const joint = plasticMat(C.tealDark);
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.23, 20, 16), joint);
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.34, 6, 14), arm);
  upper.position.y = -0.32;

  const forearm = new THREE.Group();           // pivote del codo
  forearm.position.y = -0.56;
  const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.165, 18, 14), joint);
  const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.3, 6, 14), arm);
  fore.position.y = -0.28;
  const wrist = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), joint);
  wrist.position.y = -0.52;
  const hand = buildHand(arm, side);
  hand.position.y = -0.6;
  forearm.add(elbow, fore, wrist, hand);
  forearm.rotation.x = 0.4;                    // flexión de codo en reposo

  g.add(shoulder, upper, forearm);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.forearm = forearm;
  return g;
}

// Zapatilla deportiva robusta (réplica de la referencia): suela verde
// oscura, mediasuela blanca, empeine verde con puntera blanca y un rayo
// amarillo en el costado externo. Cordones blancos visibles en el empeine.
function buildSneaker(C, side) {
  const s = new THREE.Group();
  const green = plasticMat(C.greenDark, { roughness: 0.45 });
  const greenLight = plasticMat(0x3da55c, { roughness: 0.45 });
  const white = plasticMat(C.white, { roughness: 0.5 });
  const sole = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.1, 0.72), green);
  sole.position.set(0, -0.12, 0.1);
  const midsole = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 0.74), white);
  midsole.position.set(0, -0.05, 0.1);
  const toe = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.26), white);
  toe.position.set(0, 0.08, 0.3);
  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.42), greenLight);
  upper.position.set(0, 0.13, 0.04);
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.18, 0.26), green);
  collar.position.set(0, 0.22, -0.08);
  // cordones blancos: 3 pequeñas franjas sobre el empeine
  for (let i = 0; i < 3; i++) {
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.05), white);
    lace.position.set(0, 0.22, 0.15 - i * 0.09);
    s.add(lace);
  }
  // rayo amarillo en el costado externo (lado `side`)
  const boltMat = new THREE.MeshStandardMaterial({
    color: C.yellow, emissive: C.yellow, emissiveIntensity: 0.15,
    roughness: 0.4, metalness: 0.05,
  });
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.18), boltMat);
  b1.position.set(side * 0.2, 0.07, 0.16); b1.rotation.x = 0.55;
  const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.11, 0.16), boltMat);
  b2.position.set(side * 0.2, 0.13, -0.02); b2.rotation.x = -0.55;
  const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.06, 0.1), boltMat);
  b3.position.set(side * 0.2, 0.05, -0.14); b3.rotation.x = 0.3;
  s.add(sole, midsole, toe, upper, collar, b1, b2, b3);
  s.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return s;
}

// Pierna robótica: rótula de cadera → muslo → rótula de rodilla → espinilla
// → zapatilla. userData.knee es el pivote de la rodilla para el ciclo de paso.
function buildLeg(C, side) {
  const g = new THREE.Group();                 // pivote de la cadera
  const teal = plasticMat(C.teal);
  const joint = plasticMat(C.tealDark);
  const hip = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), joint);
  hip.position.y = -0.04;
  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.16, 5, 14), teal);
  thigh.position.y = -0.26;

  const knee = new THREE.Group();              // pivote de la rodilla
  knee.position.y = -0.46;
  const kneeBall = new THREE.Mesh(new THREE.SphereGeometry(0.185, 18, 14), joint);
  const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.14, 5, 14), teal);
  shin.position.y = -0.22;
  const ankle = new THREE.Mesh(new THREE.SphereGeometry(0.135, 14, 12), joint);
  ankle.position.y = -0.4;
  const shoe = buildSneaker(C, side);
  shoe.position.y = -0.5;
  knee.add(kneeBall, shin, ankle, shoe);

  g.add(hip, thigh, knee);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  g.userData.knee = knee;
  return g;
}

// Cabeza: cráneo liso y redondeado, apenas más ancho que alto (centrado
// en el origen local del grupo). Ojos redondos y planos, boca sonriente
// abierta con lengua, audífonos a los lados y antena con punta esférica.
function buildHead(C, withFace = true) {
  const g = new THREE.Group();
  const teal = plasticMat(C.teal, { roughness: 0.32 });
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.95, 44, 36), teal);
  skull.scale.set(1.16, 1.0, 1.05);
  skull.castShadow = true;
  g.add(skull);
  const eyes = [];
  if (withFace) {
    const eyeMat = plasticMat(0x10242a, { roughness: 0.16, metalness: 0.15 });
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (const sx of [-1, 1]) {
      // ojo: disco redondo plano, ligeramente saliente de la cara.
      // Lo guardamos en `eyes` para poder parpadear desde el rig.
      const eyePivot = new THREE.Group();
      eyePivot.position.set(sx * 0.4, 0.08, 0.86);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.26, 30, 22), eyeMat);
      eye.scale.set(1, 1, 0.34);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), hlMat);
      hl.position.set(-sx * 0.08, 0.09, 0.09);
      eyePivot.add(eye, hl);
      g.add(eyePivot);
      eyes.push(eyePivot);
    }
    // boca abierta sonriente
    const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.24, 30, 22), plasticMat(0x180f0f, { roughness: 0.5 }));
    mouth.scale.set(1.5, 0.92, 0.42);
    mouth.position.set(0, -0.34, 0.78);
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), plasticMat(0xd9657a));
    tongue.scale.set(1.5, 0.62, 0.5);
    tongue.position.set(0, -0.42, 0.86);
    g.add(mouth, tongue);
  }
  // audífonos a los lados
  for (const sx of [-1, 1]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.26, 24), plasticMat(C.greenDark));
    cup.rotation.z = Math.PI / 2;
    cup.position.set(sx * 1.04, -0.02, 0);
    cup.castShadow = true;
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.28, 18), plasticMat(0x0c3a28));
    hole.rotation.z = Math.PI / 2;
    hole.position.set(sx * 1.12, -0.02, 0);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.05, 12, 26), plasticMat(C.teal));
    rim.rotation.y = Math.PI / 2;
    rim.position.set(sx * 1.15, -0.02, 0);
    g.add(cup, hole, rim);
  }
  // antena con LED emisivo en la punta (parpadea como un router).
  const antenna = new THREE.Group();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.66, 8), plasticMat(C.teal));
  rod.position.y = 0.33;
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xff5a5a, emissive: 0xff5a5a, emissiveIntensity: 1.3,
    roughness: 0.25, metalness: 0.1,
  });
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 14), tipMat);
  tip.position.y = 0.7;
  antenna.add(rod, tip);
  antenna.position.set(-0.52, 0.82, 0.08);
  antenna.rotation.z = 0.22;
  g.add(antenna);
  g.userData.antenna = antenna;
  g.userData.antennaLED = tipMat;
  g.userData.eyes = eyes;
  return g;
}

function buildChibi(palette = NANO_COLORS, opts = {}) {
  const C = palette;
  const { shirtText = null, withFace = true } = opts;
  const group = new THREE.Group();
  const hipY = 0.95;
  const legL = buildLeg(C, -1); legL.position.set(-0.34, hipY, 0);
  const legR = buildLeg(C, 1); legR.position.set(0.34, hipY, 0);
  group.add(legL, legR);

  // Torso: una caja blanca con "ÑAÑO" impreso en la cara frontal (+Z),
  // rematada por un cuello turquesa corto.
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, hipY, 0);
  const whiteMat = plasticMat(C.white, { roughness: 0.45 });
  const frontMat = shirtText
    ? new THREE.MeshStandardMaterial({ map: makeShirtTexture(shirtText), roughness: 0.5, metalness: 0.04 })
    : whiteMat;
  // orden de caras de BoxGeometry: [+x,-x,+y,-y,+z,-z] → frontal = índice 4
  const bodyMats = [whiteMat, whiteMat, whiteMat, whiteMat, frontMat, whiteMat];
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.24, 0.84), bodyMats);
  body.position.y = 0.62;
  body.castShadow = true;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.24, 18), plasticMat(C.teal));
  neck.position.y = 1.32;
  neck.castShadow = true;
  torsoGroup.add(body, neck);
  group.add(torsoGroup);

  const armL = buildArm(C, -1);
  armL.position.set(-0.72, hipY + 1.03, 0.04);
  armL.rotation.set(0.1, 0, -0.32);     // reposo relajado, separado del torso
  const armR = buildArm(C, 1);
  armR.position.set(0.72, hipY + 1.03, 0.04);
  armR.rotation.set(0.1, 0, 0.32);
  group.add(armL, armR);

  const headGroup = buildHead(C, withFace);
  headGroup.position.set(0, hipY + 2.1, 0);
  group.add(headGroup);

  const parts = {
    legL, legR, armL, armR, torsoGroup, headGroup,
    antenna: headGroup.userData.antenna,
    antennaLED: headGroup.userData.antennaLED,
    eyes: headGroup.userData.eyes,
    armLfore: armL.userData.forearm, armRfore: armR.userData.forearm,
    legLknee: legL.userData.knee, legRknee: legR.userData.knee,
  };
  return { group, parts };
}

class ChibiRig {
  constructor(palette = NANO_COLORS, opts = {}) {
    const { group, parts } = buildChibi(palette, opts);
    this.root = group;
    this.parts = parts;
    this._phase = 0;
    this._t = 0;
    this._facingY = 0;
    this._jumpBlend = 0;
  }
  update(dt, { speed = 0, grounded = true, moveDir = null, running = false, faceY = null }) {
    this._t += dt;
    const p = this.parts;
    const cadence = running ? 11 : 8;
    const moving = speed > 0.15;
    if (moving) this._phase += dt * cadence * Math.min(1.6, 0.5 + speed / 4);
    const targetJump = grounded ? 0 : 1;
    this._jumpBlend += (targetJump - this._jumpBlend) * Math.min(1, dt * 10);
    const j = this._jumpBlend;
    const swing = moving ? Math.sin(this._phase) : 0;
    const swing2 = moving ? Math.sin(this._phase + Math.PI) : 0;
    const amp = running ? 0.8 : 0.5;
    const SPLAY = 0.32;
    const idleSway = moving ? 0 : Math.sin(this._t * 1.3) * 0.05;

    // legs: swing at the hip, bend the knee on the back-swing, tuck airborne
    p.legL.rotation.x = swing * amp - j * 0.6;
    p.legR.rotation.x = swing2 * amp - j * 0.4;
    p.legLknee.rotation.x = Math.max(0, -swing) * (running ? 1.1 : 0.8) + j * 0.9;
    p.legRknee.rotation.x = Math.max(0, -swing2) * (running ? 1.1 : 0.8) + j * 0.7;

    // arms: shoulder splayed outward + swung fore/aft, elbow keeps a soft bend
    p.armL.rotation.z = -SPLAY - idleSway;
    p.armR.rotation.z = SPLAY + idleSway;
    p.armL.rotation.x = 0.1 + swing2 * amp * 0.85 - j * 0.7;
    p.armR.rotation.x = 0.1 + swing * amp * 0.85 - j * 0.7;
    p.armLfore.rotation.x = 0.4 + Math.max(0, swing2) * 0.4 + j * 0.5;
    p.armRfore.rotation.x = 0.4 + Math.max(0, swing) * 0.4 + j * 0.5;

    const bob = moving ? Math.abs(Math.sin(this._phase)) * (running ? 0.12 : 0.07) : 0;
    const breathe = moving ? 0 : Math.sin(this._t * 1.5) * 0.02;
    p.torsoGroup.position.y = 0.95 + bob;
    p.torsoGroup.scale.y = 1 + breathe;
    p.torsoGroup.rotation.x = (running && moving ? 0.2 : moving ? 0.09 : 0) + j * -0.13;
    p.armL.position.y = 1.98 + bob;
    p.armR.position.y = 1.98 + bob;
    p.headGroup.position.y = 3.05 + bob;
    p.headGroup.rotation.x = moving ? -bob * 0.6 : Math.sin(this._t * 0.8) * 0.05;
    if (p.antenna) p.antenna.rotation.z = Math.sin(this._t * 2.5 + this._phase * 0.5) * 0.15;
    if (p.antennaLED) p.antennaLED.emissiveIntensity = 1.05 + Math.sin(this._t * 4.5) * 0.55;

    // Parpadeo: cierra los ojos ~120 ms cada 3-5 s (mover la escala Y).
    if (p.eyes) {
      this._blinkTimer = (this._blinkTimer ?? 1.5) - dt;
      if (this._blinkTimer < 0) this._blinkTimer = 3 + Math.random() * 2;
      const blink = this._blinkTimer < 0.12 ? Math.sin((1 - this._blinkTimer / 0.12) * Math.PI) : 0;
      const sy = Math.max(0.06, 1 - blink);
      for (const eye of p.eyes) eye.scale.y = sy;
    }

    // Orientación: si recibimos faceY (modo cámara fija) lo respetamos;
    // si no, miramos hacia el vector de movimiento (modo libre).
    let targetY = null;
    if (faceY !== null && faceY !== undefined) targetY = faceY;
    else if (moveDir && (moveDir.x !== 0 || moveDir.z !== 0)) {
      targetY = Math.atan2(moveDir.x, moveDir.z);
    }
    if (targetY !== null) {
      let dy = targetY - this._facingY;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this._facingY += dy * Math.min(1, dt * 10);
      this.root.rotation.y = this._facingY;
    }
  }
}

class NanoCharacter {
  constructor() {
    this.rig = null;
    this.root = new THREE.Group();
    this.root.name = 'Nano';
  }
  async load() {
    this.rig = new ChibiRig(NANO_COLORS, { shirtText: 'ÑAÑO', withFace: true });
    this.rig.root.scale.setScalar(0.5);
    this.root.add(this.rig.root);
    return this;
  }
  update(dt, opts) { if (this.rig) this.rig.update(dt, opts); }
}

// =========================================================================
// npc — robots que deambulan al azar con colisión
// =========================================================================
// Los NPC son figuras encapuchadas estilo "guardián" con acentos
// luminosos turquesa (referencia: imagen 3). Cada paleta varía el color
// de la capa y del brillo.
const CLOAK_PALETTES = [
  { cloak: 0xf0f0f3, dark: 0x16181f, glow: 0x29e0ff },
  { cloak: 0x2a2d38, dark: 0x0d0e12, glow: 0xff4d6d },
  { cloak: 0xe9e2cf, dark: 0x1a160f, glow: 0xffc83f },
  { cloak: 0x21456b, dark: 0x0a1320, glow: 0x4dd0ff },
  { cloak: 0x3a2c4f, dark: 0x140d1c, glow: 0xb24dff },
  { cloak: 0xeef0f2, dark: 0x101418, glow: 0x39ff9e },
];
const WORLD_LIMIT = 92;

// Construye una figura encapuchada: capa acampanada, capucha con visor
// brillante, anillos de luz girando y cables luminosos que cuelgan al suelo.
function buildCloaked(P) {
  const group = new THREE.Group();
  const floatGroup = new THREE.Group();
  group.add(floatGroup);
  const cloakMat = new THREE.MeshStandardMaterial({ color: P.cloak, roughness: 0.6, metalness: 0.08 });
  const darkMat = new THREE.MeshStandardMaterial({ color: P.dark, roughness: 0.5, metalness: 0.2 });
  const glowMat = new THREE.MeshStandardMaterial({ color: P.glow, emissive: P.glow, emissiveIntensity: 1.7, roughness: 0.35 });

  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.5, 2.0, 14), darkMat);
  inner.position.y = 1.05;
  inner.castShadow = true;
  floatGroup.add(inner);

  const cloak = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 1.15, 2.5, 20, 1, true), cloakMat);
  cloak.position.y = 1.25;
  cloak.castShadow = true;
  floatGroup.add(cloak);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.45, 18), cloakMat);
  collar.position.y = 2.3;
  collar.castShadow = true;
  floatGroup.add(collar);

  const hood = new THREE.Mesh(new THREE.SphereGeometry(0.62, 22, 18), cloakMat);
  hood.scale.set(1.05, 1.15, 1.15);
  hood.position.y = 2.95;
  hood.castShadow = true;
  floatGroup.add(hood);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.46, 20, 16), darkMat);
  face.position.set(0, 2.88, 0.22);
  floatGroup.add(face);
  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.07, 0.06), glowMat);
  visor.position.set(0, 2.92, 0.6);
  floatGroup.add(visor);
  const trimL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.05), glowMat);
  trimL.position.set(-0.16, 3.2, 0.5); trimL.rotation.z = 0.5;
  const trimR = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.05), glowMat);
  trimR.position.set(0.16, 3.2, 0.5); trimR.rotation.z = -0.5;
  floatGroup.add(trimL, trimR);

  const antenna = new THREE.Group();
  const arod = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), cloakMat);
  arod.position.y = 0.25;
  const atip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), glowMat);
  atip.position.y = 0.52;
  antenna.add(arod, atip);
  antenna.position.set(0, 3.35, 0.05);
  floatGroup.add(antenna);

  const rings = [];
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85 - i * 0.2, 0.045, 10, 36), glowMat);
    ring.position.y = 1.7 - i * 0.55;
    ring.rotation.x = Math.PI / 2 + (i ? 0.25 : -0.15);
    floatGroup.add(ring);
    rings.push(ring);
  }
  for (const sx of [-1, 1]) {
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.4, 6), glowMat);
    cable.position.set(sx * 0.6, 1.0, 0.1);
    cable.rotation.z = sx * 0.18;
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glowMat);
    tip.position.set(sx * 0.95, -0.15, 0.1);
    floatGroup.add(cable, tip);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), darkMat);
    hand.position.set(sx * 0.28, 2.05, 0.42);
    floatGroup.add(hand);
  }
  return { group, floatGroup, parts: { rings, antenna } };
}

// Animación de la figura encapuchada: flota, se mece, gira sus anillos y
// mira hacia donde se desplaza (se desliza, no camina).
class CloakedRig {
  constructor(palette) {
    const { group, floatGroup, parts } = buildCloaked(palette);
    this.root = group;
    this.floatGroup = floatGroup;
    this.parts = parts;
    this._t = Math.random() * 10;
    this._facingY = 0;
  }
  update(dt, { speed = 0, moveDir = null } = {}) {
    this._t += dt;
    const moving = speed > 0.15;
    this.floatGroup.position.y = Math.sin(this._t * 1.8) * 0.07;
    this.floatGroup.rotation.z = Math.sin(this._t * 1.1) * 0.04;
    this.floatGroup.rotation.x = moving ? 0.12 : Math.sin(this._t * 0.9) * 0.02;
    for (let i = 0; i < this.parts.rings.length; i++) {
      this.parts.rings[i].rotation.z += dt * (i ? -1.1 : 0.8);
    }
    if (this.parts.antenna) this.parts.antenna.rotation.z = Math.sin(this._t * 2.2) * 0.13;
    if (moveDir && (moveDir.x !== 0 || moveDir.z !== 0)) {
      const targetY = Math.atan2(moveDir.x, moveDir.z);
      let dy = targetY - this._facingY;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      this._facingY += dy * Math.min(1, dt * 8);
      this.root.rotation.y = this._facingY;
    }
  }
}

class NPC {
  constructor(terrain, x, z, idx) {
    this.terrain = terrain;
    this.radius = 0.42;
    this.rig = new CloakedRig(CLOAK_PALETTES[idx % CLOAK_PALETTES.length]);
    this.rig.root.scale.setScalar(0.46);
    this.root = new THREE.Group();
    this.root.add(this.rig.root);
    this.pos = new THREE.Vector3(x, terrain.getHeightAt(x, z), z);
    this.root.position.copy(this.pos);
    this._moveDir = new THREE.Vector3();
    this.target = new THREE.Vector3(x, 0, z);
    this.pauseTimer = Math.random() * 2;
    this.running = false;
    this.retarget = 0;
    this._pickTarget();
  }
  _pickTarget() {
    const ang = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 22;
    let tx = this.pos.x + Math.cos(ang) * dist;
    let tz = this.pos.z + Math.sin(ang) * dist;
    tx = THREE.MathUtils.clamp(tx, -WORLD_LIMIT, WORLD_LIMIT);
    tz = THREE.MathUtils.clamp(tz, -WORLD_LIMIT, WORLD_LIMIT);
    this.target.set(tx, 0, tz);
    this.running = Math.random() < 0.25;
    this.retarget = 4 + Math.random() * 5;
  }
  update(dt, colliders) {
    let speed = 0;
    this._moveDir.set(0, 0, 0);
    if (this.pauseTimer > 0) {
      this.pauseTimer -= dt;
    } else {
      this.retarget -= dt;
      const dx = this.target.x - this.pos.x;
      const dz = this.target.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 1 || this.retarget <= 0) {
        this.pauseTimer = 0.4 + Math.random() * 1.8;
        this._pickTarget();
      } else {
        const maxSpeed = this.running ? 4.6 : 2.4;
        this._moveDir.set(dx / d, 0, dz / d);
        speed = maxSpeed;
        this.pos.x += this._moveDir.x * maxSpeed * dt;
        this.pos.z += this._moveDir.z * maxSpeed * dt;
      }
    }
    const before = this.pos.x + this.pos.z;
    colliders.resolveCircle(this.pos, this.radius, true, this);
    if (Math.abs(this.pos.x + this.pos.z - before) > 0.05 && Math.random() < 0.04) this._pickTarget();
    this.pos.y = this.terrain.getHeightAt(this.pos.x, this.pos.z);
    this.root.position.copy(this.pos);
    this.rig.update(dt, {
      speed, grounded: true,
      moveDir: speed > 0.1 ? this._moveDir : null,
      running: this.running,
    });
  }
}

class NPCManager {
  constructor(terrain, count = 8) {
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.npcs = [];
    let placed = 0, guard = 0;
    while (placed < count && guard++ < 400) {
      const x = (Math.random() - 0.5) * 150;
      const z = (Math.random() - 0.5) * 150;
      if (Math.abs(x - 40) < 34 && Math.abs(z - 40) < 34) continue;
      const npc = new NPC(terrain, x, z, placed);
      this.npcs.push(npc);
      this.group.add(npc.root);
      placed++;
    }
  }
  addColliders(colliders) {
    for (const n of this.npcs) colliders.addDynamic(n.pos.x, n.pos.z, n.radius, n.pos.y + 1.6, n);
  }
  update(dt, colliders) {
    for (const n of this.npcs) n.update(dt, colliders);
  }
}

// =========================================================================
// camera — rig orbital 3ª persona (anti-zoom + clamp de suelo)
// =========================================================================
class CameraRig {
  constructor(camera, controls, terrain, obstacles) {
    this.camera = camera;
    this.controls = controls;
    this.terrain = terrain;
    this.obstacles = obstacles;
    this.target = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._cur = new THREE.Vector3(0, 6, 12);
    this._raycaster = new THREE.Raycaster();
    this._headOffset = 1.4;
    this._dist = controls.distance;
  }
  update(dt, characterPos) {
    this.target.copy(characterPos);
    this.target.y += this._headOffset;
    const { yaw, pitch, distance } = this.controls;
    const cosP = Math.cos(pitch);
    this._dir.set(Math.sin(yaw) * cosP, Math.sin(pitch), Math.cos(yaw) * cosP).normalize();
    let allowed = distance;
    this._raycaster.set(this.target, this._dir);
    this._raycaster.far = distance + 0.5;
    const hits = this._raycaster.intersectObjects(this.obstacles, false);
    if (hits.length) allowed = Math.max(1.8, hits[0].distance - 0.35);
    const k = allowed < this._dist ? 18 : 4;
    this._dist += (allowed - this._dist) * Math.min(1, k * dt);
    this._desired.copy(this.target).addScaledVector(this._dir, this._dist);
    const groundY = this.terrain.getHeightAt(this._desired.x, this._desired.z) + 0.6;
    if (this._desired.y < groundY) this._desired.y = groundY;
    const t = 1 - Math.exp(-14 * dt);
    this._cur.lerp(this._desired, t);
    const gy = this.terrain.getHeightAt(this._cur.x, this._cur.z) + 0.5;
    if (this._cur.y < gy) this._cur.y = gy;
    this.camera.position.copy(this._cur);
    this.camera.lookAt(this.target);
  }
}

// =========================================================================
// collectibles — gemas brillantes que otorgan puntos
// =========================================================================
const GEM_COLORS = [0x39ff14, 0x18e0ff, 0xffd000, 0xff3df0, 0xff5a3c];

class Collectibles {
  constructor(terrain, count = 60) {
    this.terrain = terrain;
    this.group = new THREE.Group();
    this.gems = [];
    this.score = 0;
    this.pickupRadius = 1.2;
    const geo = new THREE.OctahedronGeometry(0.42, 0);
    for (let i = 0; i < count; i++) {
      let x, z;
      if (i % 2 === 0) {
        x = MAZE_REGION.cx + (Math.random() - 0.5) * (MAZE_REGION.w - 6);
        z = MAZE_REGION.cz + (Math.random() - 0.5) * (MAZE_REGION.h - 6);
      } else {
        x = (Math.random() - 0.5) * 170;
        z = (Math.random() - 0.5) * 170;
      }
      const color = GEM_COLORS[i % GEM_COLORS.length];
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color, emissive: color, emissiveIntensity: 1.3, metalness: 0.3, roughness: 0.15,
      }));
      const baseY = terrain.getHeightAt(x, z) + 0.9;
      m.position.set(x, baseY, z);
      m.castShadow = true;
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 12, 10),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16 })
      );
      m.add(halo);
      this.group.add(m);
      this.gems.push({ mesh: m, baseY, alive: true, spin: Math.random() * Math.PI * 2, value: 10 });
    }
  }
  update(dt, t, playerPos) {
    let gained = 0;
    for (const g of this.gems) {
      if (!g.alive) continue;
      g.mesh.rotation.y += dt * 1.8;
      g.mesh.position.y = g.baseY + Math.sin(t * 2.2 + g.spin) * 0.18;
      const dx = g.mesh.position.x - playerPos.x;
      const dz = g.mesh.position.z - playerPos.z;
      const dy = g.mesh.position.y - playerPos.y;
      if (dx * dx + dz * dz + dy * dy < this.pickupRadius * this.pickupRadius) {
        g.alive = false;
        g.mesh.visible = false;
        this.score += g.value;
        gained += g.value;
      }
    }
    return gained;
  }
  get remaining() {
    return this.gems.reduce((n, g) => n + (g.alive ? 1 : 0), 0);
  }
}

// =========================================================================
// zones — cancha de fútbol + plaza tecnológica
// =========================================================================
const mat = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1, ...extra });

function line(group, x, z, w, h, y) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, h), mat(0xffffff, { roughness: 0.9 }));
  m.position.set(x, y + 0.03, z);
  m.receiveShadow = true;
  group.add(m);
}

// Balón pateable. Descansa en el centro (altura de la rodilla de Ñaño);
// al acercarse el jugador lo patea; rueda con fricción y rebota en las
// bandas. Si entra en un arco devuelve 1 (gol) y vuelve al centro.
class Ball {
  constructor(x, y, z, bounds, goalZMin, goalZMax) {
    this.radius = 0.5;
    this.bounds = bounds;
    this.goalZMin = goalZMin;
    this.goalZMax = goalZMax;
    this.center = new THREE.Vector3(x, y + this.radius, z);
    this.pos = this.center.clone();
    this.vel = new THREE.Vector3();
    const m = new THREE.Mesh(new THREE.SphereGeometry(this.radius, 20, 16), mat(0xffffff, { roughness: 0.4 }));
    const patchMat = mat(0x222222, { roughness: 0.4 });
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.16, 5), patchMat);
      const a = i / 6 * Math.PI * 2;
      p.position.set(Math.cos(a) * this.radius * 0.9, Math.sin(i) * 0.2, Math.sin(a) * this.radius * 0.9);
      p.lookAt(0, p.position.y, 0);
      p.position.multiplyScalar(1.001);
      m.add(p);
    }
    m.castShadow = true;
    this.mesh = m;
    this.groundY = y;
    this.mesh.position.copy(this.pos);
  }
  reset() {
    this.pos.copy(this.center);
    this.vel.set(0, 0, 0);
  }
  update(dt, playerPos, playerRadius) {
    const dx = this.pos.x - playerPos.x;
    const dz = this.pos.z - playerPos.z;
    const d = Math.hypot(dx, dz);
    const minD = this.radius + playerRadius;
    if (d < minD && d > 0.0001) {
      const nx = dx / d, nz = dz / d;
      const push = (minD - d);
      this.pos.x += nx * push;
      this.pos.z += nz * push;
      const kick = 9.0;
      this.vel.x = nx * kick;
      this.vel.z = nz * kick;
    }
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    const fric = Math.pow(0.12, dt);
    this.vel.x *= fric;
    this.vel.z *= fric;
    if (this.vel.lengthSq() < 0.0004) this.vel.set(0, 0, 0);

    const b = this.bounds;
    const inGoalZ = this.pos.z > this.goalZMin && this.pos.z < this.goalZMax;
    let goal = false;
    // bandas en X: si el balón cruza la línea dentro del ancho del arco → gol
    if (this.pos.x < b.minX + this.radius) {
      if (inGoalZ) goal = true;
      else { this.pos.x = b.minX + this.radius; this.vel.x *= -0.6; }
    } else if (this.pos.x > b.maxX - this.radius) {
      if (inGoalZ) goal = true;
      else { this.pos.x = b.maxX - this.radius; this.vel.x *= -0.6; }
    }
    // bandas en Z: siempre rebotan
    if (this.pos.z < b.minZ + this.radius) { this.pos.z = b.minZ + this.radius; this.vel.z *= -0.6; }
    if (this.pos.z > b.maxZ - this.radius) { this.pos.z = b.maxZ - this.radius; this.vel.z *= -0.6; }

    if (goal) this.reset();
    this.mesh.position.set(this.pos.x, this.groundY + this.radius, this.pos.z);
    this.mesh.rotation.x += this.vel.z * dt / this.radius;
    this.mesh.rotation.z -= this.vel.x * dt / this.radius;
    return goal ? 1 : 0;
  }
}

function buildGoal(group, colliders, x, z, faceX, y) {
  const postMat = mat(0xffffff, { roughness: 0.5 });
  const W = 7, H = 3, D = 2.2;
  const half = W / 2;
  const post = (px, pz) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, H, 0.22), postMat);
    m.position.set(px, y + H / 2, pz);
    m.castShadow = true;
    group.add(m);
    colliders.addAABB(px - 0.18, pz - 0.18, px + 0.18, pz + 0.18, y + H);
  };
  post(x, z - half);
  post(x, z + half);
  post(x - faceX * D, z - half);
  post(x - faceX * D, z + half);
  const bar = (bx, bz, len, axis) => {
    const geo = axis === 'z' ? new THREE.BoxGeometry(0.22, 0.22, len) : new THREE.BoxGeometry(len, 0.22, 0.22);
    const m = new THREE.Mesh(geo, postMat);
    m.position.set(bx, y + H, bz);
    m.castShadow = true;
    group.add(m);
  };
  bar(x, z, W, 'z');
  bar(x - faceX * D, z, W, 'z');
  bar(x - faceX * D / 2, z - half, D, 'x');
  bar(x - faceX * D / 2, z + half, D, 'x');
  const netMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), netMat);
  back.position.set(x - faceX * D, y + H / 2, z);
  back.rotation.y = Math.PI / 2;
  group.add(back);
}

function buildSoccer(colliders) {
  const group = new THREE.Group();
  const R = SOCCER_REGION;
  const y = R.y;
  const halfW = R.w / 2 - 2;
  const halfH = R.h / 2 - 2;
  const bounds = { minX: R.cx - halfW, maxX: R.cx + halfW, minZ: R.cz - halfH, maxZ: R.cz + halfH };
  // perímetro + línea media
  line(group, R.cx, bounds.minZ, halfW * 2, 0.18, y);
  line(group, R.cx, bounds.maxZ, halfW * 2, 0.18, y);
  line(group, bounds.minX, R.cz, 0.18, halfH * 2, y);
  line(group, bounds.maxX, R.cz, 0.18, halfH * 2, y);
  line(group, R.cx, R.cz, 0.18, halfH * 2, y);
  const circle = new THREE.Mesh(
    new THREE.RingGeometry(2.4, 2.6, 40),
    mat(0xffffff, { roughness: 0.9, side: THREE.DoubleSide })
  );
  circle.rotation.x = -Math.PI / 2;
  circle.position.set(R.cx, y + 0.03, R.cz);
  group.add(circle);
  // áreas penales (rectángulo abierto hacia la línea de gol) + punto penal
  const penalty = (lineX, dir) => {
    line(group, lineX, R.cz, 0.18, 14, y);
    line(group, lineX + dir * 3, R.cz - 7, 6, 0.18, y);
    line(group, lineX + dir * 3, R.cz + 7, 6, 0.18, y);
    const spot = new THREE.Mesh(new THREE.CircleGeometry(0.18, 16), mat(0xffffff, { roughness: 0.9 }));
    spot.rotation.x = -Math.PI / 2;
    spot.position.set(lineX + dir * 4.5, y + 0.04, R.cz);
    group.add(spot);
  };
  penalty(bounds.minX + 6, 1);
  penalty(bounds.maxX - 6, -1);

  buildGoal(group, colliders, bounds.minX + 0.5, R.cz, -1, y);
  buildGoal(group, colliders, bounds.maxX - 0.5, R.cz, 1, y);
  for (const cx of [bounds.minX, bounds.maxX]) {
    for (const cz of [bounds.minZ, bounds.maxZ]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.4, 6), mat(0xffe066));
      pole.position.set(cx, y + 0.7, cz);
      const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), mat(0xff5252, { side: THREE.DoubleSide }));
      flag.position.set(cx + 0.27, y + 1.25, cz);
      group.add(pole, flag);
      colliders.addCircle(cx, cz, 0.18, y + 1.4);
    }
  }
  // balón en el centro, a la altura de la rodilla; los arcos miden ~7 de ancho
  const ball = new Ball(R.cx, y, R.cz, bounds, R.cz - 3.4, R.cz + 3.4);
  group.add(ball.mesh);
  return {
    group,
    // devuelve los puntos ganados este frame (100 por gol)
    update(dt, playerPos, playerRadius) {
      return ball.update(dt, playerPos, playerRadius) * 100;
    },
  };
}

function buildTech(colliders) {
  const group = new THREE.Group();
  const R = TECH_REGION;
  const y = R.y;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(R.w - 2, 0.2, R.h - 2), mat(0x6b7280, { roughness: 0.9 }));
  slab.position.set(R.cx, y + 0.1, R.cz);
  slab.receiveShadow = true;
  group.add(slab);
  const emissives = [];
  const rack = (rx, rz, rot) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 1.0), mat(0x1f2430, { metalness: 0.5, roughness: 0.4 }));
    body.position.y = 1.3;
    body.castShadow = true;
    g.add(body);
    for (let i = 0; i < 5; i++) {
      const led = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.12, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x00e5a0, emissive: 0x00e5a0, emissiveIntensity: 1.4 })
      );
      led.position.set(0, 0.5 + i * 0.42, 0.53);
      g.add(led);
      emissives.push(led);
    }
    g.position.set(rx, y, rz);
    g.rotation.y = rot;
    group.add(g);
    colliders.addAABB(rx - 0.9, rz - 0.6, rx + 0.9, rz + 0.6, y + 2.6);
  };
  const hw = (R.w - 2) / 2, hh = (R.h - 2) / 2;
  rack(R.cx - hw + 1.5, R.cz - hh + 2, 0.2);
  rack(R.cx - hw + 1.5, R.cz + hh - 2, -0.2);
  rack(R.cx + hw - 1.5, R.cz - hh + 2, Math.PI - 0.2);
  rack(R.cx + hw - 1.5, R.cz + hh - 2, Math.PI + 0.2);
  const screenStand = new THREE.Mesh(new THREE.BoxGeometry(0.6, 2.4, 0.6), mat(0x2b3240));
  screenStand.position.set(R.cx, y + 1.2, R.cz - hh + 1.2);
  screenStand.castShadow = true;
  group.add(screenStand);
  const screen = new THREE.Mesh(
    new THREE.BoxGeometry(5, 3, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x0a2540, emissive: 0x2a7fff, emissiveIntensity: 0.8 })
  );
  screen.position.set(R.cx, y + 4, R.cz - hh + 1.2);
  screen.castShadow = true;
  group.add(screen);
  emissives.push(screen);
  colliders.addAABB(R.cx - 0.5, R.cz - hh + 0.9, R.cx + 0.5, R.cz - hh + 1.5, y + 2.4);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.16, 16, 48),
    new THREE.MeshStandardMaterial({ color: 0x16f0d0, emissive: 0x16f0d0, emissiveIntensity: 1.6 })
  );
  ring.position.set(R.cx, y + 2.2, R.cz + 1);
  group.add(ring);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 1.0, 16), mat(0x2b3240, { metalness: 0.6 }));
  pedestal.position.set(R.cx, y + 0.5, R.cz + 1);
  pedestal.castShadow = true;
  group.add(pedestal);
  colliders.addCircle(R.cx, R.cz + 1, 0.95, y + 1.0);
  return {
    group,
    update(dt, t) {
      ring.rotation.y += dt * 0.8;
      ring.rotation.x = Math.sin(t * 0.5) * 0.3;
      const pulse = 1.2 + Math.sin(t * 4) * 0.4;
      for (const e of emissives) e.material.emissiveIntensity = pulse;
    },
  };
}

// =========================================================================
// birds — bandada de pájaros que sobrevuela el mundo
// =========================================================================
// Pájaros estilizados: un cuerpo en forma de "almendra" + dos alas que
// baten. Cada uno orbita un punto del mundo, sube y baja suavemente y
// rota para apuntar a su tangente de vuelo. Pensados para ser ligeros
// (toda la bandada comparte materiales).
const BIRD_PALETTES = [
  { body: 0x1a1a1a, belly: 0xffffff, beak: 0xffb347 },   // golondrina
  { body: 0x4a3a26, belly: 0xf3e9d0, beak: 0xf6b042 },   // gorrión
  { body: 0xc23a3a, belly: 0xfff0e0, beak: 0x222222 },   // cardenal
  { body: 0x3070b0, belly: 0xffffff, beak: 0xffb347 },   // azulejo
  { body: 0xf2f2f2, belly: 0xffffff, beak: 0xff8a2a },   // paloma
];

function buildBird(palette) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: palette.body, roughness: 0.7 });
  const bellyMat = new THREE.MeshStandardMaterial({ color: palette.belly, roughness: 0.75 });
  const beakMat = new THREE.MeshStandardMaterial({ color: palette.beak, roughness: 0.5 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x101010 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), bodyMat);
  body.scale.set(1.6, 0.85, 1);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), bellyMat);
  belly.scale.set(1.4, 0.6, 0.9);
  belly.position.set(0, -0.06, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 10), bodyMat);
  head.position.set(0.26, 0.05, 0);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.13, 8), beakMat);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.42, 0.04, 0);
  for (const sz of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), eyeMat);
    eye.position.set(0.32, 0.09, sz * 0.07);
    g.add(eye);
  }
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 6), bodyMat);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.34, 0, 0);
  // Alas: cada una es un grupo con un pivote en el costado del cuerpo
  // para poder batirlas con una rotación sencilla.
  const wingGeo = new THREE.BoxGeometry(0.34, 0.04, 0.22);
  const wingL = new THREE.Group();
  const wlMesh = new THREE.Mesh(wingGeo, bodyMat);
  wlMesh.position.set(0, 0, -0.17);
  wingL.add(wlMesh);
  wingL.position.set(-0.02, 0.05, -0.1);
  const wingR = new THREE.Group();
  const wrMesh = new THREE.Mesh(wingGeo, bodyMat);
  wrMesh.position.set(0, 0, 0.17);
  wingR.add(wrMesh);
  wingR.position.set(-0.02, 0.05, 0.1);
  g.add(body, belly, head, beak, tail, wingL, wingR);
  return { group: g, wingL, wingR };
}

class Birds {
  constructor(count = 14) {
    this.group = new THREE.Group();
    this.birds = [];
    for (let i = 0; i < count; i++) {
      const palette = BIRD_PALETTES[i % BIRD_PALETTES.length];
      const { group, wingL, wingR } = buildBird(palette);
      const cx = (Math.random() - 0.5) * 140;
      const cz = (Math.random() - 0.5) * 140;
      const radius = 14 + Math.random() * 28;
      const baseY = 16 + Math.random() * 12;
      const speed = 0.35 + Math.random() * 0.4;
      const phase = Math.random() * Math.PI * 2;
      const dir = Math.random() < 0.5 ? -1 : 1;
      const flap = 8 + Math.random() * 5;
      this.birds.push({ group, wingL, wingR, cx, cz, radius, baseY, speed, phase, dir, flap });
      this.group.add(group);
    }
  }
  update(dt, t) {
    for (const b of this.birds) {
      b.phase += dt * b.speed * b.dir;
      const x = b.cx + Math.cos(b.phase) * b.radius;
      const z = b.cz + Math.sin(b.phase) * b.radius;
      const y = b.baseY + Math.sin(t * 0.4 + b.phase) * 1.5;
      // Mirar hacia la tangente de la órbita (a 90° del radio).
      const tx = -Math.sin(b.phase) * b.dir;
      const tz =  Math.cos(b.phase) * b.dir;
      b.group.position.set(x, y, z);
      b.group.rotation.y = Math.atan2(tx, tz) - Math.PI / 2;
      const flap = Math.sin(t * b.flap + b.phase * 2) * 0.9;
      b.wingL.rotation.x = flap;
      b.wingR.rotation.x = -flap;
    }
  }
}

// =========================================================================
// zone-details — pequeños props decorativos para que cada espacio tenga vida
// =========================================================================
function addMazeDetails(scene, colliders) {
  // Faroles en las cuatro esquinas exteriores del laberinto: poste oscuro
  // con una linterna emisiva arriba para marcar el contorno.
  const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
  const lampGlassMat = new THREE.MeshStandardMaterial({
    color: 0xffe28a, emissive: 0xffd06b, emissiveIntensity: 1.6, roughness: 0.4,
  });
  const r = MAZE_REGION;
  const corners = [
    [r.cx - r.w / 2 - 1.4, r.cz - r.h / 2 - 1.4],
    [r.cx + r.w / 2 + 1.4, r.cz - r.h / 2 - 1.4],
    [r.cx - r.w / 2 - 1.4, r.cz + r.h / 2 + 1.4],
    [r.cx + r.w / 2 + 1.4, r.cz + r.h / 2 + 1.4],
  ];
  for (const [x, z] of corners) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.6, 8), lampPostMat);
    post.position.y = 1.3;
    post.castShadow = true;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.08), lampPostMat);
    arm.position.set(0.25, 2.55, 0);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), lampGlassMat);
    lamp.position.set(0.5, 2.55, 0);
    g.add(post, arm, lamp);
    g.position.set(x, r.y, z);
    scene.add(g);
    colliders.addCircle(x, z, 0.18, r.y + 2.7);
  }
  // "Cartel" del laberinto: una losa de piedra a un costado del corredor
  // de entrada (sin bloquearlo) con una gema flotante encima como hito visual.
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8278, roughness: 0.85 });
  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.0, 1.4), stoneMat);
  const px = r.cx - r.w / 2 + 9;     // ~9 unidades a la derecha del spawn
  const pz = r.cz + r.h / 2 + 3.5;
  pedestal.position.set(px, r.y + 0.5, pz);
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  scene.add(pedestal);
  colliders.addAABB(px - 0.7, pz - 0.7, px + 0.7, pz + 0.7, r.y + 1.0);
  const beacon = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35, 0),
    new THREE.MeshStandardMaterial({
      color: 0x18e0ff, emissive: 0x18e0ff, emissiveIntensity: 1.5,
      roughness: 0.2, metalness: 0.3,
    }),
  );
  beacon.position.set(px, r.y + 1.7, pz);
  beacon.userData.spin = Math.random();
  scene.add(beacon);
}

function addSoccerDetails(scene, colliders) {
  const R = SOCCER_REGION;
  const y = R.y;
  // Dos bancas largas (frente y reverso del campo) y dos arbustos a los costados.
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a32, roughness: 0.8 });
  const legMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.7 });
  for (const sz of [-1, 1]) {
    const bench = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.18, 0.6), woodMat);
    seat.position.y = 0.5;
    seat.castShadow = true; seat.receiveShadow = true;
    const back = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.5, 0.12), woodMat);
    back.position.set(0, 0.9, -0.25 * sz);
    back.castShadow = true;
    for (const lx of [-2.4, 0, 2.4]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.5, 0.5), legMat);
      leg.position.set(lx, 0.25, 0);
      leg.castShadow = true;
      bench.add(leg);
    }
    bench.add(seat, back);
    bench.position.set(R.cx, y, R.cz + sz * (R.h / 2 + 1.4));
    bench.rotation.y = sz < 0 ? Math.PI : 0;
    scene.add(bench);
    colliders.addAABB(R.cx - 2.8, R.cz + sz * (R.h / 2 + 1.4) - 0.4,
                      R.cx + 2.8, R.cz + sz * (R.h / 2 + 1.4) + 0.4, y + 1.0);
  }
  // Pequeño marcador electrónico al lado de la cancha.
  const board = new THREE.Group();
  const boardPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x333, roughness: 0.6 }));
  boardPost.position.y = 1.3;
  const boardPanel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.1, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x0a141f, emissive: 0x16a0ff, emissiveIntensity: 0.7 }));
  boardPanel.position.y = 2.85;
  board.add(boardPost, boardPanel);
  board.position.set(R.cx + R.w / 2 + 3, y, R.cz);
  scene.add(board);
  colliders.addCircle(R.cx + R.w / 2 + 3, R.cz, 0.18, y + 2.6);
}

function addTechDetails(scene, t0Holder) {
  const R = TECH_REGION;
  const y = R.y;
  // Cubos holográficos que flotan sobre la plaza y giran lentamente.
  const cubes = [];
  const cubeMat = new THREE.MeshStandardMaterial({
    color: 0x18e0ff, emissive: 0x18e0ff, emissiveIntensity: 1.2,
    transparent: true, opacity: 0.55, roughness: 0.2, metalness: 0.4,
  });
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), cubeMat);
    const ang = (i / 6) * Math.PI * 2;
    const cx = R.cx + Math.cos(ang) * 4;
    const cz = R.cz + Math.sin(ang) * 4;
    c.position.set(cx, y + 3 + Math.random() * 1.2, cz);
    c.userData.baseY = c.position.y;
    c.userData.phase = ang;
    scene.add(c);
    cubes.push(c);
  }
  // "Panel" piso emisivo con líneas (referencia tipo metaverso semi-realista).
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x163040, emissive: 0x163040, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0.3,
  });
  for (let i = -1; i <= 1; i++) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(R.w - 4, 0.02, 0.18), panelMat);
    strip.position.set(R.cx, y + 0.22, R.cz + i * 3);
    scene.add(strip);
  }
  // Devuelve una función de update para animar los cubos.
  return (dt, t) => {
    for (const c of cubes) {
      c.rotation.x += dt * 0.6;
      c.rotation.y += dt * 0.4;
      c.position.y = c.userData.baseY + Math.sin(t * 1.2 + c.userData.phase) * 0.35;
    }
  };
}

function addClouds(scene) {
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 1, emissive: 0xffffff, emissiveIntensity: 0.04,
  });
  const group = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const cloud = new THREE.Group();
    const puffs = 3 + Math.floor(Math.random() * 3);
    for (let p = 0; p < puffs; p++) {
      const s = 1.2 + Math.random() * 1.6;
      const puff = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 8), cloudMat);
      puff.position.set((p - puffs / 2) * (s * 0.85), Math.random() * 0.5, Math.random() * 0.5);
      cloud.add(puff);
    }
    cloud.position.set((Math.random() - 0.5) * 220, 28 + Math.random() * 10, (Math.random() - 0.5) * 220);
    cloud.scale.setScalar(0.9 + Math.random() * 0.8);
    group.add(cloud);
  }
  scene.add(group);
}

function addBushesAndFlowers(scene, terrain) {
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x3a8d3a, roughness: 0.95 });
  const bushDark = new THREE.MeshStandardMaterial({ color: 0x2e6b2a, roughness: 1 });
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4a7a30, roughness: 1 });
  const petalMats = [
    new THREE.MeshStandardMaterial({ color: 0xff5a8a, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: 0xff8a3a, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: 0xb56cff, roughness: 0.6 }),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
  ];
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xffe066, emissive: 0xffe066, emissiveIntensity: 0.25, roughness: 0.6,
  });
  const group = new THREE.Group();
  // Arbustos (esfera + esferita pegada)
  for (let i = 0; i < 90; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (inAuthoredZone(x, z)) continue;
    const y = terrain.getHeightAt(x, z);
    const bush = new THREE.Group();
    const s = 0.5 + Math.random() * 0.6;
    const a = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 8), bushMat);
    a.position.y = 0.45;
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 8), bushDark);
    b.position.set(0.35, 0.55, 0.1);
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 8), bushMat);
    c.position.set(-0.25, 0.5, 0.2);
    a.castShadow = b.castShadow = c.castShadow = true;
    bush.add(a, b, c);
    bush.position.set(x, y, z);
    bush.scale.setScalar(s);
    bush.rotation.y = Math.random() * Math.PI * 2;
    group.add(bush);
  }
  // Flores (tallo + corola + centro emisivo)
  for (let i = 0; i < 130; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (inAuthoredZone(x, z)) continue;
    const y = terrain.getHeightAt(x, z);
    const flower = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.45, 6), stemMat);
    stem.position.y = 0.22;
    const petal = new THREE.Mesh(
      new THREE.TorusGeometry(0.1, 0.05, 8, 12),
      petalMats[Math.floor(Math.random() * petalMats.length)],
    );
    petal.rotation.x = Math.PI / 2;
    petal.position.y = 0.48;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), coreMat);
    core.position.y = 0.48;
    flower.add(stem, petal, core);
    flower.position.set(x, y, z);
    group.add(flower);
  }
  scene.add(group);
}

// =========================================================================
// main — escena, luces, loop
// =========================================================================
const canvas = document.getElementById('app');
const loadingEl = document.getElementById('loading');
const scoreEl = document.getElementById('score');
const gemsEl = document.getElementById('gems');
const goalsEl = document.getElementById('goals');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88c7ff);
scene.fog = new THREE.Fog(0x88c7ff, 70, 230);

scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 0.55));
const fill = new THREE.DirectionalLight(0x9bb8ff, 0.3);
fill.position.set(-30, 20, -20);
scene.add(fill);
const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(40, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sd = sun.shadow.camera;
sd.left = -60; sd.right = 60; sd.top = 60; sd.bottom = -60;
sd.near = 1; sd.far = 200;
scene.add(sun);
scene.add(sun.target);

const colliders = new ColliderWorld();
const terrain = new Terrain();
scene.add(terrain.mesh);
const maze = new Maze();
scene.add(maze.mesh);
maze.registerColliders(colliders);
const soccer = buildSoccer(colliders);
scene.add(soccer.group);
const tech = buildTech(colliders);
scene.add(tech.group);
addScenery(scene, terrain, colliders);
addBushesAndFlowers(scene, terrain);
addMazeDetails(scene, colliders);
addSoccerDetails(scene, colliders);
const techDetailsUpdate = addTechDetails(scene);
addClouds(scene);
const birds = new Birds(14);
scene.add(birds.group);
const collectibles = new Collectibles(terrain, 64);
scene.add(collectibles.group);
if (gemsEl) gemsEl.textContent = String(collectibles.remaining);
const npcs = new NPCManager(terrain, 9);
scene.add(npcs.group);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 6, 12);
const controls = new Controls(canvas);
const cameraRig = new CameraRig(camera, controls, terrain, [terrain.mesh, maze.mesh]);
const physics = new Physics(terrain, colliders);

const nano = new NanoCharacter();
const playerToken = {};
const characterState = {
  position: new THREE.Vector3(0, 0, 0),
  velocityY: 0,
  grounded: false,
};

(async () => {
  await nano.load();
  scene.add(nano.root);
  characterState.position.copy(maze.spawnPoint);
  characterState.position.y = terrain.getHeightAt(characterState.position.x, characterState.position.z);
  nano.root.position.copy(characterState.position);
  controls.yaw = 0;
  loadingEl.classList.add('hidden');
  start();
})();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight, false);
});

const clock = new THREE.Clock();
const moveDir = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const horizVel = new THREE.Vector3();
const targetVel = new THREE.Vector3();
const faceDir = new THREE.Vector3();

const WALK_SPEED = 3.4;
const RUN_SPEED = 7.6;
const ACCEL = 28;
const DECEL = 22;
const PLAYER_RADIUS = 0.45;
// Velocidad angular (rad/s) al girar la cámara con la tecla "abajo".
const CAM_TURN_SPEED = 1.9;

function start() {
  let prevJump = false;
  let elapsed = 0;
  let goalPoints = 0;   // puntos acumulados por goles
  let goalCount = 0;    // número de goles
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    elapsed += dt;

    // "Abajo" (S/↓) ya no retrocede: hace girar la cámara en su lugar.
    // El personaje siempre mira al frente (hacia donde apunta la cámara),
    // así que al girar la cámara también gira él.
    if (controls.back) controls.yaw += CAM_TURN_SPEED * dt;
    const yaw = controls.yaw;
    tmpForward.set(Math.sin(yaw), 0, Math.cos(yaw));
    tmpRight.set(Math.cos(yaw), 0, -Math.sin(yaw));
    moveDir.set(0, 0, 0);
    if (controls.forward) moveDir.sub(tmpForward);
    if (controls.left) moveDir.sub(tmpRight);
    if (controls.right) moveDir.add(tmpRight);
    const hasInput = moveDir.lengthSq() > 0;
    if (hasInput) moveDir.normalize();

    const running = controls.run;
    const maxSpeed = running ? RUN_SPEED : WALK_SPEED;

    targetVel.copy(moveDir).multiplyScalar(hasInput ? maxSpeed : 0);
    const maxStep = (hasInput ? ACCEL : DECEL) * dt;
    const dvx = targetVel.x - horizVel.x;
    const dvz = targetVel.z - horizVel.z;
    const dvLen = Math.hypot(dvx, dvz);
    if (dvLen <= maxStep || dvLen === 0) {
      horizVel.x = targetVel.x; horizVel.z = targetVel.z;
    } else {
      horizVel.x += (dvx / dvLen) * maxStep;
      horizVel.z += (dvz / dvLen) * maxStep;
    }

    const moveXZ = tmpForward.set(horizVel.x, 0, horizVel.z);
    const speed = Math.hypot(horizVel.x, horizVel.z);

    const jumpEdge = controls.jump && !prevJump;
    prevJump = controls.jump;

    colliders.clearDynamic();
    colliders.addDynamic(
      characterState.position.x, characterState.position.z,
      PLAYER_RADIUS, characterState.position.y + 1.7, playerToken
    );
    npcs.addColliders(colliders);

    physics.update(characterState, dt, moveXZ, jumpEdge, playerToken);
    nano.root.position.copy(characterState.position);

    if (speed > 0.05) faceDir.set(horizVel.x, 0, horizVel.z).normalize();
    // Ñaño siempre mira hacia donde apunta la cámara: el "forward" del
    // jugador es `-tmpForward = (-sin(yaw), 0, -cos(yaw))`, cuyo atan2 es
    // `yaw + π`. El rig lerpea suavemente hasta ese ángulo.
    const playerFaceY = yaw + Math.PI;
    nano.update(dt, {
      speed,
      grounded: characterState.grounded,
      moveDir: speed > 0.05 ? faceDir : null,
      running,
      faceY: playerFaceY,
    });

    npcs.update(dt, colliders);

    const gained = collectibles.update(dt, elapsed, characterState.position);
    const goalPts = soccer.update(dt, characterState.position, PLAYER_RADIUS);
    if (goalPts > 0) {
      goalPoints += goalPts;
      goalCount += 1;
      if (goalsEl) goalsEl.textContent = String(goalCount);
    }
    if ((gained || goalPts) && scoreEl) {
      scoreEl.textContent = String(collectibles.score + goalPoints);
      gemsEl.textContent = String(collectibles.remaining);
    }
    tech.update(dt, elapsed);
    techDetailsUpdate(dt, elapsed);
    birds.update(dt, elapsed);

    cameraRig.update(dt, characterState.position);

    sun.position.set(characterState.position.x + 40, 60, characterState.position.z + 25);
    sun.target.position.copy(characterState.position);

    renderer.render(scene, camera);
  });
}

function inAuthoredZone(x, z) {
  const near = (r, pad) =>
    Math.abs(x - r.cx) < r.w / 2 + pad && Math.abs(z - r.cz) < r.h / 2 + pad;
  return near(MAZE_REGION, 2) || near(SOCCER_REGION, 3) || near(TECH_REGION, 3);
}

function addScenery(scene, terrain, colliders) {
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.0, 6);
  const leavesGeo = new THREE.ConeGeometry(0.9, 1.8, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3f1e, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.9 });
  const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6f6f6f, roughness: 1 });
  const group = new THREE.Group();
  for (let i = 0; i < 70; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (inAuthoredZone(x, z)) continue;
    const y = terrain.getHeightAt(x, z);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    const leaves = new THREE.Mesh(leavesGeo, leafMat);
    leaves.position.y = 1.4;
    trunk.position.y = 0.5;
    const tree = new THREE.Group();
    tree.add(trunk, leaves);
    tree.position.set(x, y, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.8 + Math.random() * 0.6;
    tree.scale.setScalar(s);
    trunk.castShadow = true;
    leaves.castShadow = true;
    group.add(tree);
    colliders.addCircle(x, z, 0.32 * s, y + 3);
  }
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (inAuthoredZone(x, z)) continue;
    const y = terrain.getHeightAt(x, z);
    const s = 0.7 + Math.random() * 0.8;
    const r = new THREE.Mesh(rockGeo, rockMat);
    r.position.set(x, y + 0.2, z);
    r.rotation.set(Math.random(), Math.random(), Math.random());
    r.scale.setScalar(s);
    r.castShadow = true;
    r.receiveShadow = true;
    group.add(r);
    colliders.addCircle(x, z, 0.55 * s, y + 1.2);
  }
  scene.add(group);
}
