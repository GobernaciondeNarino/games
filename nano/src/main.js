import * as THREE from 'three';
import { Terrain, MAZE_REGION } from './terrain.js';
import { Maze } from './maze.js';
import { Controls } from './controls.js';
import { CameraRig } from './camera.js';
import { Physics } from './physics.js';
import { NanoCharacter } from './character.js';

const canvas = document.getElementById('app');
const loadingEl = document.getElementById('loading');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88c7ff);
scene.fog = new THREE.Fog(0x88c7ff, 60, 220);

// --- lights ---
const hemi = new THREE.HemisphereLight(0xffffff, 0x445533, 0.55);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xffffff, 1.1);
sun.position.set(40, 60, 25);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sd = sun.shadow.camera;
sd.left = -60; sd.right = 60; sd.top = 60; sd.bottom = -60;
sd.near = 1; sd.far = 200;
scene.add(sun);
scene.add(sun.target);

// --- world ---
const terrain = new Terrain();
scene.add(terrain.mesh);

const maze = new Maze();
scene.add(maze.mesh);

// Some scattered decoration boxes/rocks so the world reads as 3D.
addScenery(scene, terrain);

// --- camera ---
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 6, 12);

const controls = new Controls(canvas);
const cameraRig = new CameraRig(camera, controls, [terrain.mesh, maze.mesh]);

const physics = new Physics(terrain, maze);

// --- character ---
const nano = new NanoCharacter();
const characterState = {
  position: new THREE.Vector3(0, 0, 0),
  velocityY: 0,
  grounded: false,
};

(async () => {
  try {
    await nano.load();
  } catch (err) {
    console.error('Failed to load Ñaño model:', err);
    loadingEl.textContent = 'No se pudo cargar el modelo (revisa models/RobotExpressive.glb)';
    return;
  }
  scene.add(nano.root);

  // Spawn just outside the maze entry on flat ground.
  characterState.position.copy(maze.spawnPoint);
  characterState.position.y = terrain.getHeightAt(characterState.position.x, characterState.position.z);
  nano.root.position.copy(characterState.position);

  // Spawn is south of the maze; yaw=0 puts the camera behind Ñaño looking
  // north toward the maze entrance.
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
const moveDir = new THREE.Vector3();      // desired direction (normalized)
const tmpForward = new THREE.Vector3();
const tmpRight = new THREE.Vector3();
const horizVel = new THREE.Vector3();     // smoothed horizontal velocity
const targetVel = new THREE.Vector3();
const faceDir = new THREE.Vector3();      // direction the model should face

// Movement feel constants.
const WALK_SPEED = 3.4;
const RUN_SPEED = 7.6;
const ACCEL = 28;   // units/s^2 ramp-up
const DECEL = 22;   // units/s^2 ramp-down

function start() {
  let prevJump = false;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 1 / 30);

    // Build camera-relative move vector.
    const yaw = controls.yaw;
    tmpForward.set(Math.sin(yaw), 0, Math.cos(yaw));    // away from camera
    tmpRight.set(Math.cos(yaw), 0, -Math.sin(yaw));
    moveDir.set(0, 0, 0);
    if (controls.forward) moveDir.sub(tmpForward);       // W → toward target (camera looks at target)
    if (controls.back) moveDir.add(tmpForward);
    if (controls.left) moveDir.sub(tmpRight);
    if (controls.right) moveDir.add(tmpRight);
    const hasInput = moveDir.lengthSq() > 0;
    if (hasInput) moveDir.normalize();

    const running = controls.run;
    const maxSpeed = running ? RUN_SPEED : WALK_SPEED;

    // Smoothly accelerate / decelerate the horizontal velocity so starts and
    // stops are fluid instead of snapping.
    targetVel.copy(moveDir).multiplyScalar(hasInput ? maxSpeed : 0);
    const rate = hasInput ? ACCEL : DECEL;
    const maxStep = rate * dt;
    const dvx = targetVel.x - horizVel.x;
    const dvz = targetVel.z - horizVel.z;
    const dvLen = Math.hypot(dvx, dvz);
    if (dvLen <= maxStep || dvLen === 0) {
      horizVel.x = targetVel.x;
      horizVel.z = targetVel.z;
    } else {
      horizVel.x += (dvx / dvLen) * maxStep;
      horizVel.z += (dvz / dvLen) * maxStep;
    }

    const moveXZ = tmpForward.set(horizVel.x, 0, horizVel.z); // reuse tmpForward as scratch
    const speed = Math.hypot(horizVel.x, horizVel.z);

    const jumpEdge = controls.jump && !prevJump;
    prevJump = controls.jump;

    physics.update(characterState, dt, moveXZ, jumpEdge);

    nano.root.position.copy(characterState.position);

    // Face the actual velocity while moving; keep last facing when stopping.
    if (speed > 0.05) faceDir.set(horizVel.x, 0, horizVel.z).normalize();
    nano.update(dt, {
      speed,
      grounded: characterState.grounded,
      moveDir: speed > 0.05 ? faceDir : null,
      running,
    });

    cameraRig.update(dt, characterState.position);

    // Keep sun anchored on the player so shadows stay tight.
    sun.position.set(characterState.position.x + 40, 60, characterState.position.z + 25);
    sun.target.position.copy(characterState.position);

    renderer.render(scene, camera);
  });
}

// ---------- scenery ----------
function addScenery(scene, terrain) {
  // A few simple "trees" (cone + cylinder) and rocks scattered around.
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.22, 1.0, 6);
  const leavesGeo = new THREE.ConeGeometry(0.9, 1.8, 7);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b3f1e, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7d32, roughness: 0.9 });
  const rockGeo = new THREE.DodecahedronGeometry(0.6, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x6f6f6f, roughness: 1 });

  const treeGroup = new THREE.Group();
  for (let i = 0; i < 70; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    // skip maze plot
    if (Math.abs(x - MAZE_REGION.cx) < MAZE_REGION.w / 2 + 2 &&
        Math.abs(z - MAZE_REGION.cz) < MAZE_REGION.h / 2 + 2) continue;
    const y = terrain.getHeightAt(x, z);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    const leaves = new THREE.Mesh(leavesGeo, leafMat);
    leaves.position.y = 1.4;
    trunk.position.y = 0.5;
    const tree = new THREE.Group();
    tree.add(trunk); tree.add(leaves);
    tree.position.set(x, y, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    const s = 0.8 + Math.random() * 0.6;
    tree.scale.setScalar(s);
    trunk.castShadow = true;
    leaves.castShadow = true;
    treeGroup.add(tree);
  }
  for (let i = 0; i < 40; i++) {
    const x = (Math.random() - 0.5) * 180;
    const z = (Math.random() - 0.5) * 180;
    if (Math.abs(x - MAZE_REGION.cx) < MAZE_REGION.w / 2 + 2 &&
        Math.abs(z - MAZE_REGION.cz) < MAZE_REGION.h / 2 + 2) continue;
    const y = terrain.getHeightAt(x, z);
    const r = new THREE.Mesh(rockGeo, rockMat);
    r.position.set(x, y, z);
    r.rotation.set(Math.random(), Math.random(), Math.random());
    r.castShadow = true;
    r.receiveShadow = true;
    treeGroup.add(r);
  }
  scene.add(treeGroup);
}
