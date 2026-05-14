import * as THREE from '../vendor/three.module.js';
import { Terrain, MAZE_REGION, SOCCER_REGION, TECH_REGION } from './terrain.js';
import { Maze } from './maze.js';
import { Controls } from './controls.js';
import { CameraRig } from './camera.js';
import { Physics } from './physics.js';
import { NanoCharacter } from './character.js';
import { ColliderWorld } from './colliders.js';
import { buildSoccer, buildTech } from './zones.js';
import { Collectibles } from './collectibles.js';
import { NPCManager } from './npc.js';

const canvas = document.getElementById('app');
const loadingEl = document.getElementById('loading');
const scoreEl = document.getElementById('score');
const gemsEl = document.getElementById('gems');

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

// --- lights ---
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

// --- world ---
const colliders = new ColliderWorld();

const terrain = new Terrain();
scene.add(terrain.mesh);

const maze = new Maze();
scene.add(maze.mesh);
maze.registerColliders(colliders);

// soccer field + technology plaza (both register their own colliders)
const soccer = buildSoccer(colliders);
scene.add(soccer.group);
const tech = buildTech(colliders);
scene.add(tech.group);

// scenery (registers tree/rock colliders too)
addScenery(scene, terrain, colliders);

// shiny collectibles
const collectibles = new Collectibles(terrain, 64);
scene.add(collectibles.group);
if (gemsEl) gemsEl.textContent = String(collectibles.remaining);

// wandering NPC robots
const npcs = new NPCManager(terrain, 9);
scene.add(npcs.group);

// --- camera ---
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 6, 12);

const controls = new Controls(canvas);
const cameraRig = new CameraRig(camera, controls, terrain, [terrain.mesh, maze.mesh]);

const physics = new Physics(terrain, colliders);

// --- character ---
const nano = new NanoCharacter();
const playerToken = {}; // identity for the player's dynamic collider
const characterState = {
  position: new THREE.Vector3(0, 0, 0),
  velocityY: 0,
  grounded: false,
};

(async () => {
  await nano.load();
  scene.add(nano.root);

  // Spawn just outside the maze entry on flat ground.
  characterState.position.copy(maze.spawnPoint);
  characterState.position.y = terrain.getHeightAt(characterState.position.x, characterState.position.z);
  nano.root.position.copy(characterState.position);
  controls.yaw = 0; // camera behind Ñaño, facing the maze entrance

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

function start() {
  let prevJump = false;
  let elapsed = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 1 / 30);
    elapsed += dt;

    // camera-relative move vector
    const yaw = controls.yaw;
    tmpForward.set(Math.sin(yaw), 0, Math.cos(yaw));
    tmpRight.set(Math.cos(yaw), 0, -Math.sin(yaw));
    moveDir.set(0, 0, 0);
    if (controls.forward) moveDir.sub(tmpForward);
    if (controls.back) moveDir.add(tmpForward);
    if (controls.left) moveDir.sub(tmpRight);
    if (controls.right) moveDir.add(tmpRight);
    const hasInput = moveDir.lengthSq() > 0;
    if (hasInput) moveDir.normalize();

    const running = controls.run;
    const maxSpeed = running ? RUN_SPEED : WALK_SPEED;

    // smooth accelerate / decelerate
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

    const moveXZ = tmpForward.set(horizVel.x, 0, horizVel.z); // scratch reuse
    const speed = Math.hypot(horizVel.x, horizVel.z);

    const jumpEdge = controls.jump && !prevJump;
    prevJump = controls.jump;

    // rebuild dynamic colliders for this frame (player + NPCs)
    colliders.clearDynamic();
    colliders.addDynamic(
      characterState.position.x, characterState.position.z,
      PLAYER_RADIUS, characterState.position.y + 1.7, playerToken
    );
    npcs.addColliders(colliders);

    physics.update(characterState, dt, moveXZ, jumpEdge, playerToken);
    nano.root.position.copy(characterState.position);

    if (speed > 0.05) faceDir.set(horizVel.x, 0, horizVel.z).normalize();
    nano.update(dt, {
      speed,
      grounded: characterState.grounded,
      moveDir: speed > 0.05 ? faceDir : null,
      running,
    });

    // NPCs wander + collide
    npcs.update(dt, colliders);

    // collectibles + zones
    const gained = collectibles.update(dt, elapsed, characterState.position);
    if (gained && scoreEl) {
      scoreEl.textContent = String(collectibles.score);
      gemsEl.textContent = String(collectibles.remaining);
    }
    soccer.update(dt, characterState.position, PLAYER_RADIUS);
    tech.update(dt, elapsed);

    cameraRig.update(dt, characterState.position);

    // keep the sun (and its shadow box) following the player
    sun.position.set(characterState.position.x + 40, 60, characterState.position.z + 25);
    sun.target.position.copy(characterState.position);

    renderer.render(scene, camera);
  });
}

// ---------- scenery ----------
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
    colliders.addCircle(x, z, 0.32 * s, y + 3); // trunk collision
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
