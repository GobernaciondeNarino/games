// Generador de laberinto: cuadrícula + DFS recursive-backtracker.
// Dos entradas (una verdadera ancha que lleva al portal, una falsa = callejón),
// bifurcaciones para confundir, verificación BFS de ruta válida, postes y muros.

import * as THREE from 'three';

const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

export function buildMaze(level, levelGroup, obstacles, placeEmeraldHints) {
  const { color } = level.maze || { color: 0x8D6E63 };
  const isCumbal = level.theme === 'snow_volcano';

  const wallMat = isCumbal
    ? new THREE.MeshLambertMaterial({
        color: 0xB3E5FC, transparent: true, opacity: 0.55,
        emissive: 0x87eeff, emissiveIntensity: 0.15, side: THREE.DoubleSide
      })
    : new THREE.MeshLambertMaterial({ color });
  const postMat = isCumbal
    ? new THREE.MeshLambertMaterial({
        color: 0xB3E5FC, transparent: true, opacity: 0.75,
        emissive: 0x87eeff, emissiveIntensity: 0.18
      })
    : new THREE.MeshLambertMaterial({ color });

  const cols = 11;
  const rows = 10;
  const cellSize = 3.4;
  const wallThickness = 0.55;
  const postSize = 0.7;
  const wallHeight = 3.15;
  const startX = -(cols * cellSize) / 2;
  const startZ = -24;

  const grid = [];
  for (let r = 0; r < rows; r++) {
    grid.push([]);
    for (let c = 0; c < cols; c++) {
      grid[r].push({ visited: false, walls: { N: true, S: true, E: true, W: true } });
    }
  }

  // DFS backtracker
  const stack = [];
  const startCell = { r: rows - 1, c: Math.floor(cols / 2) };
  grid[startCell.r][startCell.c].visited = true;
  stack.push(startCell);
  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const { r, c } = current;
    const neighbors = [];
    if (r > 0 && !grid[r - 1][c].visited)        neighbors.push({ r: r - 1, c, dir: 'N' });
    if (r < rows - 1 && !grid[r + 1][c].visited) neighbors.push({ r: r + 1, c, dir: 'S' });
    if (c < cols - 1 && !grid[r][c + 1].visited) neighbors.push({ r, c: c + 1, dir: 'E' });
    if (c > 0 && !grid[r][c - 1].visited)        neighbors.push({ r, c: c - 1, dir: 'W' });
    if (neighbors.length === 0) { stack.pop(); continue; }
    const next = neighbors[Math.floor(Math.random() * neighbors.length)];
    grid[r][c].walls[next.dir] = false;
    grid[next.r][next.c].walls[OPP[next.dir]] = false;
    grid[next.r][next.c].visited = true;
    stack.push({ r: next.r, c: next.c });
  }

  // Entrada verdadera ancha (3 celdas)
  const trueEntryCol = Math.floor(cols / 2);
  let fakeEntryCol = Math.floor(Math.random() * cols);
  while (Math.abs(fakeEntryCol - trueEntryCol) < 4) {
    fakeEntryCol = Math.floor(Math.random() * cols);
  }
  grid[rows - 1][trueEntryCol].walls.S = false;
  if (trueEntryCol > 0)        grid[rows - 1][trueEntryCol - 1].walls.S = false;
  if (trueEntryCol < cols - 1) grid[rows - 1][trueEntryCol + 1].walls.S = false;
  if (grid[rows - 1][trueEntryCol].walls.N && rows > 1) {
    grid[rows - 1][trueEntryCol].walls.N = false;
    grid[rows - 2][trueEntryCol].walls.S = false;
  }

  // Entrada falsa (callejón sin salida)
  grid[rows - 1][fakeEntryCol].walls.S = false;
  const fakeCell = grid[rows - 1][fakeEntryCol];
  const fakeDirs = ['N', 'E', 'W'];
  const keepDir = fakeDirs[Math.floor(Math.random() * fakeDirs.length)];
  fakeDirs.forEach(d => {
    const dr = d === 'N' ? -1 : 0;
    const dc = d === 'E' ? 1 : d === 'W' ? -1 : 0;
    const nr = rows - 1 + dr, nc = fakeEntryCol + dc;
    if (d === keepDir) {
      fakeCell.walls[d] = false;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) grid[nr][nc].walls[OPP[d]] = false;
    } else {
      fakeCell.walls[d] = true;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) grid[nr][nc].walls[OPP[d]] = true;
    }
  });

  // Salida norte conecta con el portal
  grid[0][trueEntryCol].walls.N = false;
  if (grid[0][trueEntryCol].walls.S && rows > 1) {
    grid[0][trueEntryCol].walls.S = false;
    grid[1][trueEntryCol].walls.N = false;
  }

  // BFS: verificar ruta entrada -> salida
  function pathExists(srcR, srcC, dstR, dstC) {
    const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
    const queue = [[srcR, srcC]];
    visited[srcR][srcC] = true;
    while (queue.length > 0) {
      const [r, c] = queue.shift();
      if (r === dstR && c === dstC) return true;
      const cell = grid[r][c];
      if (!cell.walls.N && r > 0 && !visited[r - 1][c]) { visited[r - 1][c] = true; queue.push([r - 1, c]); }
      if (!cell.walls.S && r < rows - 1 && !visited[r + 1][c]) { visited[r + 1][c] = true; queue.push([r + 1, c]); }
      if (!cell.walls.E && c < cols - 1 && !visited[r][c + 1]) { visited[r][c + 1] = true; queue.push([r, c + 1]); }
      if (!cell.walls.W && c > 0 && !visited[r][c - 1]) { visited[r][c - 1] = true; queue.push([r, c - 1]); }
    }
    return false;
  }

  let attempts = 0;
  while (!pathExists(rows - 1, trueEntryCol, 0, trueEntryCol) && attempts < 30) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const dirs = ['N', 'S', 'E', 'W'];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    if ((dir === 'N' && r === 0) || (dir === 'S' && r === rows - 1) ||
        (dir === 'E' && c === cols - 1) || (dir === 'W' && c === 0)) { attempts++; continue; }
    const dr = dir === 'N' ? -1 : dir === 'S' ? 1 : 0;
    const dc = dir === 'E' ? 1 : dir === 'W' ? -1 : 0;
    grid[r][c].walls[dir] = false;
    grid[r + dr][c + dc].walls[OPP[dir]] = false;
    attempts++;
  }
  if (!pathExists(rows - 1, trueEntryCol, 0, trueEntryCol)) {
    for (let r = 0; r < rows - 1; r++) {
      grid[r][trueEntryCol].walls.S = false;
      grid[r + 1][trueEntryCol].walls.N = false;
    }
  }

  // Bifurcaciones extra
  const extraOpenings = Math.floor(rows * cols * 0.10);
  for (let i = 0; i < extraOpenings; i++) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const dirs = ['N', 'S', 'E', 'W'].filter(d => grid[r][c].walls[d]);
    if (dirs.length === 0) continue;
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    if ((dir === 'N' && r === 0) || (dir === 'S' && r === rows - 1) ||
        (dir === 'E' && c === cols - 1) || (dir === 'W' && c === 0)) continue;
    const dr = dir === 'N' ? -1 : dir === 'S' ? 1 : 0;
    const dc = dir === 'E' ? 1 : dir === 'W' ? -1 : 0;
    grid[r][c].walls[dir] = false;
    grid[r + dr][c + dc].walls[OPP[dir]] = false;
  }

  // Zona protegida del portal
  const portalPos = { x: 0, z: -18 };
  const clearRadius = 2.5;
  function nearPortal(wx, wz, w, d) {
    const cx = THREE.MathUtils.clamp(portalPos.x, wx - w / 2, wx + w / 2);
    const cz = THREE.MathUtils.clamp(portalPos.z, wz - d / 2, wz + d / 2);
    return Math.hypot(portalPos.x - cx, portalPos.z - cz) < clearRadius;
  }

  // Postes (sin postes dentro de las entradas)
  function isPostInEntrance(r, c) {
    if (r !== rows) return false;
    if (c >= trueEntryCol - 1 && c <= trueEntryCol + 2) return true;
    if (c >= fakeEntryCol && c <= fakeEntryCol + 1) return true;
    return false;
  }
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const px = startX + c * cellSize;
      const pz = startZ + r * cellSize;
      if (isPostInEntrance(r, c)) continue;
      const hasAdjacentWall =
        (r > 0    && c < cols && grid[r - 1][c].walls.W) ||
        (r > 0    && c > 0    && grid[r - 1][c - 1].walls.E) ||
        (r > 0    && c > 0    && grid[r - 1][c - 1].walls.S) ||
        (r > 0    && c < cols && grid[r - 1][c].walls.S) ||
        (r < rows && c < cols && grid[r][c].walls.N) ||
        (r < rows && c < cols && grid[r][c].walls.W) ||
        (r < rows && c > 0    && grid[r][c - 1].walls.N) ||
        (r < rows && c > 0    && grid[r][c - 1].walls.E);
      if (!hasAdjacentWall) continue;
      if (Math.hypot(portalPos.x - px, portalPos.z - pz) < clearRadius) continue;
      const post = new THREE.Mesh(new THREE.BoxGeometry(postSize, wallHeight, postSize), postMat);
      post.position.set(px, wallHeight / 2, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      levelGroup.add(post);
      obstacles.push({
        type: 'box',
        minX: px - postSize / 2, maxX: px + postSize / 2,
        minZ: pz - postSize / 2, maxZ: pz + postSize / 2,
        topY: wallHeight, _maze: true
      });
    }
  }

  // Muros
  const wallSpan = cellSize - postSize;
  const placedWalls = new Set();
  function placeWall(x, z, w, d, h) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    wall.position.set(x, h / 2, z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    levelGroup.add(wall);
    obstacles.push({
      type: 'box',
      minX: x - w / 2, maxX: x + w / 2,
      minZ: z - d / 2, maxZ: z + d / 2,
      topY: h, _maze: true
    });
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      const cx = startX + c * cellSize + cellSize / 2;
      const cz = startZ + r * cellSize + cellSize / 2;
      if (cell.walls.N) {
        const key = `H_${r}_${c}`;
        if (!placedWalls.has(key)) {
          placedWalls.add(key);
          const wx = cx, wz = cz - cellSize / 2;
          if (!nearPortal(wx, wz, wallSpan, wallThickness)) placeWall(wx, wz, wallSpan, wallThickness, wallHeight);
        }
      }
      if (cell.walls.S && r === rows - 1) {
        const key = `H_${r + 1}_${c}`;
        if (!placedWalls.has(key)) {
          placedWalls.add(key);
          const wx = cx, wz = cz + cellSize / 2;
          if (!nearPortal(wx, wz, wallSpan, wallThickness)) placeWall(wx, wz, wallSpan, wallThickness, wallHeight);
        }
      }
      if (cell.walls.W) {
        const key = `V_${r}_${c}`;
        if (!placedWalls.has(key)) {
          placedWalls.add(key);
          const wx = cx - cellSize / 2, wz = cz;
          if (!nearPortal(wx, wz, wallThickness, wallSpan)) placeWall(wx, wz, wallThickness, wallSpan, wallHeight);
        }
      }
      if (cell.walls.E && c === cols - 1) {
        const key = `V_${r}_${c + 1}`;
        if (!placedWalls.has(key)) {
          placedWalls.add(key);
          const wx = cx + cellSize / 2, wz = cz;
          if (!nearPortal(wx, wz, wallThickness, wallSpan)) placeWall(wx, wz, wallThickness, wallSpan, wallHeight);
        }
      }
    }
  }

  // Esmeraldas con pistas en las esquinas
  placeEmeraldHints(level, grid, startX, startZ, cellSize, cols, rows);
}
