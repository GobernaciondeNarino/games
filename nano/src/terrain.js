import * as THREE from 'three';

// ---------- value-noise ----------
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

// ---------- terrain ----------
export const TERRAIN_SIZE = 200;
export const TERRAIN_SEG = 200;
export const MAZE_REGION = { cx: 40, cz: 40, w: 60, h: 60, y: 0 };
const STAIR_REGION = { cx: -30, cz: -10, w: 14, h: 30, baseY: 0, step: 0.5 };
const HEIGHT_SCALE = 6;

export class Terrain {
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
    const c4 = new THREE.Color(0xc7a574); // path

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = fbm(x * 0.04, z * 0.04) * HEIGHT_SCALE;

      // Author stair zone: snap height to discrete steps along Z.
      if (
        Math.abs(x - STAIR_REGION.cx) < STAIR_REGION.w / 2 &&
        Math.abs(z - STAIR_REGION.cz) < STAIR_REGION.h / 2
      ) {
        const tz = (z - (STAIR_REGION.cz - STAIR_REGION.h / 2)) / STAIR_REGION.h;
        const steps = Math.floor(tz * 10);
        y = STAIR_REGION.baseY + steps * STAIR_REGION.step;
      }

      // Flatten maze plot.
      if (
        Math.abs(x - MAZE_REGION.cx) < MAZE_REGION.w / 2 &&
        Math.abs(z - MAZE_REGION.cz) < MAZE_REGION.h / 2
      ) {
        y = MAZE_REGION.y;
      }

      pos.setY(i, y);

      const ix = i % cols;
      const iz = (i - ix) / cols;
      this.heights[iz * cols + ix] = y;

      // vertex color by zone / height
      let col;
      if (
        Math.abs(x - MAZE_REGION.cx) < MAZE_REGION.w / 2 &&
        Math.abs(z - MAZE_REGION.cz) < MAZE_REGION.h / 2
      ) {
        col = c4;
      } else if (
        Math.abs(x - STAIR_REGION.cx) < STAIR_REGION.w / 2 &&
        Math.abs(z - STAIR_REGION.cz) < STAIR_REGION.h / 2
      ) {
        col = c3;
      } else if (y > 3) {
        col = c2;
      } else {
        col = c1;
      }
      colors[i * 3 + 0] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.95,
      metalness: 0.0,
      flatShading: false,
    });
    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.name = 'Terrain';
  }

  // Bilinear sample of the heightmap at world (x,z).
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
