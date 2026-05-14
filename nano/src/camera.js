import * as THREE from '../vendor/three.module.js';

// Third-person orbital camera rig.
//  - Orbits the character via controls yaw/pitch/distance.
//  - Occlusion cushion: smoothly pulls IN fast when something blocks the view
//    and eases back OUT slowly, so corridors don't cause a jittery "zoom".
//  - Hard floor: the camera is always kept above the terrain so it never
//    dips below ground (the bug seen near the maze).
export class CameraRig {
  constructor(camera, controls, terrain, obstacles) {
    this.camera = camera;
    this.controls = controls;
    this.terrain = terrain;
    this.obstacles = obstacles;        // meshes for occlusion raycasts
    this.target = new THREE.Vector3();
    this._dir = new THREE.Vector3();
    this._desired = new THREE.Vector3();
    this._cur = new THREE.Vector3(0, 6, 12);
    this._raycaster = new THREE.Raycaster();
    this._headOffset = 1.4;
    this._dist = controls.distance;    // smoothed effective distance
  }

  update(dt, characterPos) {
    this.target.copy(characterPos);
    this.target.y += this._headOffset;

    const { yaw, pitch, distance } = this.controls;
    const cosP = Math.cos(pitch);
    // direction from target outward toward the camera
    this._dir.set(Math.sin(yaw) * cosP, Math.sin(pitch), Math.cos(yaw) * cosP).normalize();

    // occlusion test: how far can the camera sit before hitting geometry?
    let allowed = distance;
    this._raycaster.set(this.target, this._dir);
    this._raycaster.far = distance + 0.5;
    const hits = this._raycaster.intersectObjects(this.obstacles, false);
    if (hits.length) allowed = Math.max(1.8, hits[0].distance - 0.35);

    // fast pull-in, slow ease-out → no popping in tight corridors
    const k = allowed < this._dist ? 18 : 4;
    this._dist += (allowed - this._dist) * Math.min(1, k * dt);

    this._desired.copy(this.target).addScaledVector(this._dir, this._dist);

    // never let the camera go below the ground
    const groundY = this.terrain.getHeightAt(this._desired.x, this._desired.z) + 0.6;
    if (this._desired.y < groundY) this._desired.y = groundY;

    // smooth follow
    const t = 1 - Math.exp(-14 * dt);
    this._cur.lerp(this._desired, t);
    // re-clamp after the lerp in case we eased into the floor
    const gy = this.terrain.getHeightAt(this._cur.x, this._cur.z) + 0.5;
    if (this._cur.y < gy) this._cur.y = gy;

    this.camera.position.copy(this._cur);
    this.camera.lookAt(this.target);
  }
}
