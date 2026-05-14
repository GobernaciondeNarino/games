import * as THREE from 'three';
import { MAZE_REGION } from './terrain.js';

// Recursive-backtracker maze generator. Each cell tracks four walls (N,E,S,W).
// Returns { cells, cols, rows } where cells[i].walls = [n,e,s,w] booleans.
export function generateMaze(cols, rows) {
  const cells = new Array(cols * rows);
  for (let i = 0; i < cells.length; i++) cells[i] = { visited: false, walls: [true, true, true, true] };

  const idx = (x, y) => y * cols + x;
  const stack = [];
  const startX = 0, startY = 0;
  cells[idx(startX, startY)].visited = true;
  stack.push([startX, startY]);

  while (stack.length) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors = [];
    if (cy > 0 && !cells[idx(cx, cy - 1)].visited) neighbors.push([cx, cy - 1, 0, 2]);   // N
    if (cx < cols - 1 && !cells[idx(cx + 1, cy)].visited) neighbors.push([cx + 1, cy, 1, 3]); // E
    if (cy < rows - 1 && !cells[idx(cx, cy + 1)].visited) neighbors.push([cx, cy + 1, 2, 0]); // S
    if (cx > 0 && !cells[idx(cx - 1, cy)].visited) neighbors.push([cx - 1, cy, 3, 1]);   // W
    if (!neighbors.length) { stack.pop(); continue; }
    const [nx, ny, wallA, wallB] = neighbors[Math.floor(Math.random() * neighbors.length)];
    cells[idx(cx, cy)].walls[wallA] = false;
    cells[idx(nx, ny)].walls[wallB] = false;
    cells[idx(nx, ny)].visited = true;
    stack.push([nx, ny]);
  }

  // Carve entry (south of (0,0)) and exit (north of (cols-1, rows-1))? Use entry south of (0,rows-1).
  cells[idx(0, rows - 1)].walls[2] = false;            // south wall of bottom-left → entry
  cells[idx(cols - 1, 0)].walls[0] = false;            // north wall of top-right → exit

  return { cells, cols, rows };
}

export class Maze {
  constructor() {
    const cols = 12, rows = 12;
    const cellSize = MAZE_REGION.w / cols;       // each cell ~5 units
    const wallThickness = 0.3;
    const wallHeight = 2.6;
    const baseY = MAZE_REGION.y;

    const m = generateMaze(cols, rows);
    const segments = [];
    const ox = MAZE_REGION.cx - MAZE_REGION.w / 2;
    const oz = MAZE_REGION.cz - MAZE_REGION.h / 2;

    // Outer perimeter borders (with carved entry/exit gaps already in cells).
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const c = m.cells[y * cols + x];
        const x0 = ox + x * cellSize;
        const z0 = oz + y * cellSize;
        // North wall
        if (c.walls[0] && y === 0) segments.push(makeWallSeg(x0, z0, x0 + cellSize, z0));
        // West wall
        if (c.walls[3] && x === 0) segments.push(makeWallSeg(x0, z0, x0, z0 + cellSize));
        // East wall (always emitted by this cell so we don't double-up)
        if (c.walls[1]) segments.push(makeWallSeg(x0 + cellSize, z0, x0 + cellSize, z0 + cellSize));
        // South wall
        if (c.walls[2]) segments.push(makeWallSeg(x0, z0 + cellSize, x0 + cellSize, z0 + cellSize));
      }
    }

    // Build instanced mesh from segments.
    const geom = new THREE.BoxGeometry(1, wallHeight, 1);
    geom.translate(0, wallHeight / 2, 0); // origin at base
    const mat = new THREE.MeshStandardMaterial({ color: 0x6e5b3a, roughness: 0.85, metalness: 0.05 });
    const inst = new THREE.InstancedMesh(geom, mat, segments.length);
    inst.castShadow = true;
    inst.receiveShadow = true;

    const dummy = new THREE.Object3D();
    this.bounds = []; // axis-aligned wall rectangles in XZ for collision

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
        minX: cx - sx / 2,
        maxX: cx + sx / 2,
        minZ: cz - sz / 2,
        maxZ: cz + sz / 2,
        topY: baseY + wallHeight,
      });
    }
    inst.instanceMatrix.needsUpdate = true;
    this.mesh = inst;

    // Spawn point: just outside south entry of cell (0, rows-1)
    this.spawnPoint = new THREE.Vector3(
      ox + cellSize / 2,
      baseY,
      oz + rows * cellSize + 2.5
    );
  }

  // Resolve XZ collision against axis-aligned walls. Mutates pos.
  // Returns true if any wall was contacted.
  collideCircle(pos, radius) {
    let touched = false;
    for (const b of this.bounds) {
      if (pos.y > b.topY + 0.05) continue;
      const closestX = Math.max(b.minX, Math.min(pos.x, b.maxX));
      const closestZ = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
      const dx = pos.x - closestX;
      const dz = pos.z - closestZ;
      const d2 = dx * dx + dz * dz;
      if (d2 < radius * radius) {
        const d = Math.sqrt(d2) || 0.0001;
        const push = (radius - d) / d;
        pos.x += dx * push;
        pos.z += dz * push;
        touched = true;
      }
    }
    return touched;
  }
}

function makeWallSeg(x0, z0, x1, z1) {
  return { x0, z0, x1, z1 };
}
