// Sky dome con gradiente vertical de 3 paradas, configurable por nivel.
// También expone luces ambientales/hemisféricas/direccional que se ajustan
// según la "hora del día" de cada escenario.

import * as THREE from 'three';

let skyDome = null;
let skyHemiLight = null;
let skyDirLight = null;
let skyAmbient = null;

export function buildSky(scene) {
  const skyGeo = new THREE.SphereGeometry(220, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor:    { value: new THREE.Color(0x0077A3) },
      midColor:    { value: new THREE.Color(0x00AEEF) },
      bottomColor: { value: new THREE.Color(0xB3E5FC) },
      offset:      { value: 33 },
      exponent:    { value: 0.7 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        vec3 color;
        if (h < 0.25) {
          float t = clamp((h + 0.1) / 0.35, 0.0, 1.0);
          color = mix(bottomColor, midColor, t);
        } else {
          float t = pow(clamp((h - 0.25) / 0.75, 0.0, 1.0), exponent);
          color = mix(midColor, topColor, t);
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });
  skyDome = new THREE.Mesh(skyGeo, skyMat);
  skyDome.renderOrder = -1;
  scene.add(skyDome);

  skyAmbient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(skyAmbient);

  skyHemiLight = new THREE.HemisphereLight(0x87eeff, 0x77a027, 0.55);
  scene.add(skyHemiLight);

  skyDirLight = new THREE.DirectionalLight(0xfff5e0, 1.05);
  skyDirLight.position.set(15, 25, 10);
  skyDirLight.castShadow = true;
  skyDirLight.shadow.mapSize.set(2048, 2048);
  skyDirLight.shadow.camera.left = -40;
  skyDirLight.shadow.camera.right = 40;
  skyDirLight.shadow.camera.top = 40;
  skyDirLight.shadow.camera.bottom = -40;
  skyDirLight.shadow.bias = -0.0005;
  scene.add(skyDirLight);

  return { skyDome, skyAmbient, skyHemiLight, skyDirLight };
}

export function applySkyConfig(scene, skyConfig) {
  if (!skyConfig || !skyDome) return;
  skyDome.material.uniforms.topColor.value.setHex(skyConfig.top);
  skyDome.material.uniforms.midColor.value.setHex(skyConfig.mid);
  skyDome.material.uniforms.bottomColor.value.setHex(skyConfig.bottom);
  if (skyHemiLight) skyHemiLight.intensity = skyConfig.hemi ?? 0.55;
  if (skyDirLight)  skyDirLight.intensity  = skyConfig.dir  ?? 1.05;
  if (skyAmbient)   skyAmbient.intensity   = skyConfig.amb  ?? 0.9;
  if (scene.fog) scene.fog.color.setHex(skyConfig.bottom);
}
