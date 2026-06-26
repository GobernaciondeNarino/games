/**
 * App.jsx — HUD Hero/Banner
 * Secretaría TIC, Innovación y Gobierno Abierto · Gobernación de Nariño
 *
 * Componente React autocontenido. Stack: Tailwind CSS + lucide-react + three.js + anime.js.
 * Estética: interfaz HUD/data-room sobre gris claro, acento primario azul neón.
 *
 * Cumplimiento:
 *  - WCAG 2.1 AA / Resolución 1519 de 2020 (Anexo 1).
 *  - Ley 2345 de 2023 ("Chao Marcas") y Decreto 2106/2019 art. 14: un único logo oficial
 *    (Gobernación de Nariño) en sus colores aprobados; NUNCA se crea un logo "TIC".
 *  - El azul neón es para gráficos/bordes/estados, NUNCA para texto de cuerpo sobre fondo claro.
 *
 * Edición rápida: ver constantes COPY, MEDIA_BASE, ASSETS, GEOJSON_URL y NEON más abajo.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import anime from 'animejs/lib/anime.es.js';
import {
  Search,
  Phone,
  ChevronDown,
  Menu,
  X,
  Accessibility,
  ChevronsRight,
  Database,
  Building2,
} from 'lucide-react';

/* ════════════════════════════ COPY EDITABLE (ES) ════════════════════════════ */
const COPY = {
  brand: 'Secretaría TIC, Innovación y Gobierno Abierto',
  org: 'Gobernación de Nariño',
  h1: 'Innovación, datos e inteligencia artificial para Nariño',
  subhead:
    'Fortalecemos la gestión pública con tecnología, análisis de datos y gobierno abierto para los 64 municipios del departamento.',
  ctaPrimary: { label: 'Explora los datos abiertos', href: 'https://datos.narino.gov.co/' },
  ctaSecondary: { label: 'Conoce la Secretaría', href: 'https://tic.narino.gov.co/' },
  phone: '(602) 733 2133',
  phoneHref: 'tel:+576027332133',
  contacto: { label: 'Contáctenos', href: 'https://tic.narino.gov.co/contactenos/' },
  nav: [
    { label: 'Inicio', href: 'https://tic.narino.gov.co/' },
    { label: 'Trámites y Servicios', href: 'https://www.gov.co/', submenu: true },
    { label: 'Transparencia', href: 'https://tic.narino.gov.co/transparencia/', submenu: true },
    { label: 'Datos Abiertos', href: 'https://datos.narino.gov.co/' },
    { label: 'Innovación', href: 'https://tic.narino.gov.co/innovacion/' },
  ],
  globeTag: 'NARIÑO // 64 MUNICIPIOS',
  globeDesc:
    'Representación interactiva del departamento de Nariño y sus 64 municipios sobre un globo holográfico. El gráfico es decorativo; toda la información esencial está disponible como texto.',
};

/* ════════════════════════════ CONFIG DE MEDIOS ════════════════════════════ */
// Base de assets. Vacío = raíz del sitio (Vite sirve /assets en la raíz).
// En WordPress/Plesk, apunta a la carpeta donde subas los archivos (p. ej. '/wp-content/uploads/2026/06').
const MEDIA_BASE = '';
const ASSETS = {
  posterGlobe: `${MEDIA_BASE}/hero-plate-globe-narino.jpg`, // poster web (~96KB); el 4K PNG es *-4k.png
  hudFrame: `${MEDIA_BASE}/hero-plate-hud-frame.jpg`,
  loopMp4: `${MEDIA_BASE}/hero-loop.mp4`,
  loopWebm: `${MEDIA_BASE}/hero-loop.webm`,
};
// GeoJSON municipal de Nariño (FeatureCollection: 1 boundary + 64 points).
const GEOJSON_URL = `${MEDIA_BASE}/data/narino-municipios.geojson`; // TODO: ruta del GeoJSON municipal de Nariño (oficial)

// Intensidad del neón en el globo/HUD (0.6 suave → 1.4 intenso).
const NEON = 1.0;

// Logos oficiales (Ley 2345 — colores aprobados, sin alterar).
const LOGO_GOVCO = 'https://tic.narino.gov.co/wp-content/uploads/2026/06/logo-gov-co-1-1.svg';
const LOGO_GOBERNACION = 'https://tic.narino.gov.co/wp-content/uploads/2026/06/logo-1-1.png';
// TODO: replace with official SVG horizontal logo

/* Paleta JS (espejo de los tokens CSS) usada por three.js. */
const C = {
  neon: 0x00a8ff,
  neonBright: 0x21d4ff,
  neonDeep: 0x0066cc,
  grid: 0xcbd3da,
  sphere: 0xeaf1f6,
  ink: 0x0a2540,
};

/* Recorte de esquinas (cut corners). */
const CUT_BTN = 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)';
const CUT_PANEL = 'polygon(0 14px, 14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)';

/* ════════════════════════════ UTILIDADES GEO ════════════════════════════ */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// lon/lat (grados) → punto en esfera de radio r (convención three.js).
function llToVec3(lon, lat, r = 1) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}
// Inverso: dirección unitaria → {lon, lat}.
function vec3ToLL(v) {
  const n = v.clone().normalize();
  const lat = 90 - THREE.MathUtils.radToDeg(Math.acos(clamp(n.y, -1, 1)));
  let lon = THREE.MathUtils.radToDeg(Math.atan2(n.z, -n.x)) - 180;
  while (lon < -180) lon += 360;
  while (lon > 180) lon -= 360;
  return { lon, lat };
}
// Formato coordenadas tipo HUD: 01°12′N 077°16′W
function fmtDMS(lon, lat) {
  const f = (val, pos, neg, pad) => {
    const dir = val >= 0 ? pos : neg;
    const a = Math.abs(val);
    const d = Math.floor(a);
    const m = Math.floor((a - d) * 60);
    return `${String(d).padStart(pad, '0')}°${String(m).padStart(2, '0')}′${dir}`;
  };
  return `${f(lat, 'N', 'S', 2)} ${f(lon, 'E', 'W', 3)}`;
}

// Respaldo si el GeoJSON no carga (resiliencia; el texto sigue diciendo 64).
const FALLBACK_MUNICIPIOS = [
  { name: 'Pasto', lon: -77.2811, lat: 1.2136, capital: true },
  { name: 'Ipiales', lon: -77.642, lat: 0.828 },
  { name: 'Túquerres', lon: -77.618, lat: 1.087 },
  { name: 'Tumaco', lon: -78.814, lat: 1.797 },
  { name: 'La Unión', lon: -77.13, lat: 1.6 },
  { name: 'Samaniego', lon: -77.595, lat: 1.336 },
];

/* ════════════════════════════ ESTILOS / TOKENS ════════════════════════════ */
function HudStyles() {
  return (
    <style>{`
:root{
  --bg-base:#E7EBEE; --bg-panel:#F3F6F8; --bg-panel-2:#DCE2E7; --grid-line:#CBD3DA;
  --neon:#00A8FF; --neon-bright:#21D4FF; --neon-deep:#0066CC; --neon-text:#0059B3;
  --ink:#0A2540; --ink-2:#2A2F36;
  --gn-green:#10A13B; --gn-yellow:#FFD500; --gn-navy:#003366;
}
.tic-root{background:var(--bg-base); color:var(--ink-2); font-family:"Hind Madurai",system-ui,sans-serif;}
.tic-root *{box-sizing:border-box;}
.font-ui{font-family:"Nunito Sans",system-ui,sans-serif;}
.font-mono-hud{font-family:"Share Tech Mono",ui-monospace,monospace;}
.tic-grid-bg{
  background-image:
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size:48px 48px; opacity:.5;
}
.tic-link{position:relative; color:var(--ink); transition:color .2s, text-shadow .2s;}
.tic-link:hover{color:var(--neon-text); text-shadow:0 0 10px rgba(0,168,255,.45);}
.tic-focus:focus-visible{outline:3px solid var(--neon); outline-offset:3px; border-radius:2px;}
@keyframes ticFadeUp{from{opacity:0; transform:translateY(16px);} to{opacity:1; transform:none;}}
@keyframes ticFadeIn{from{opacity:0;} to{opacity:1;}}
@keyframes ticScan{0%{transform:translateY(0);} 100%{transform:translateY(100%);}}
@keyframes ticPulse{0%,100%{opacity:.35;} 50%{opacity:1;}}
@keyframes ticSpin{to{transform:rotate(360deg);}}
.tic-scanline{animation:ticScan 7s linear infinite;}
.tic-pulse{animation:ticPulse 2.4s ease-in-out infinite;}
.tic-reticle{animation:ticSpin 32s linear infinite;}
.tic-fade-in{animation:ticFadeIn .8s ease forwards;}
.tic-cta-primary{
  background:var(--neon-deep); color:#fff;
  box-shadow:0 0 0 1px rgba(0,168,255,.7), 0 0 22px rgba(0,168,255,.45);
  transition:transform .15s ease, box-shadow .2s ease, background .2s ease;
}
.tic-cta-primary:hover{transform:scale(1.03); background:#0a6fd6; box-shadow:0 0 0 1px rgba(33,212,255,.9), 0 0 30px rgba(0,168,255,.6);}
.tic-cta-primary:active{transform:scale(.99);}
.tic-cta-ghost{
  color:var(--ink); border:1px solid rgba(0,168,255,.55); background:rgba(243,246,248,.5);
  transition:transform .15s ease, box-shadow .2s ease, border-color .2s ease;
}
.tic-cta-ghost:hover{transform:scale(1.03); border-color:var(--neon); box-shadow:0 0 18px rgba(0,168,255,.35);}
.tic-chip{font-family:"Share Tech Mono",monospace; letter-spacing:.06em;}
.tic-h1{font-family:"Hind Madurai"; color:var(--ink); font-size:clamp(34px,6vw,62px); line-height:1.05;}
.tic-subhead{color:var(--ink-2); font-size:clamp(15px,1.4vw,17px); line-height:1.5;}
@media (prefers-reduced-motion: reduce){
  .tic-scanline,.tic-pulse,.tic-reticle{animation:none !important;}
  .tic-fade-in{animation:none !important;}
}
    `}</style>
  );
}

/* ════════════════════════════ STAGGER PALABRA A PALABRA ════════════════════════════ */
function WordStagger({ text, as = 'span', className = '', delay = 0, perWord = 55, duration = 600, reducedMotion }) {
  const ref = useRef(null);
  const Tag = as;
  useEffect(() => {
    if (reducedMotion || !ref.current) return;
    const words = ref.current.querySelectorAll('[data-w]');
    anime({
      targets: words,
      opacity: [0, 1],
      translateY: ['0.55em', '0em'],
      easing: 'easeOutQuad',
      duration,
      delay: anime.stagger(perWord, { start: delay }),
    });
  }, [reducedMotion, text, delay, perWord, duration]);
  const words = text.split(' ');
  return (
    <Tag ref={ref} className={className}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span data-w className="inline-block" style={{ opacity: reducedMotion ? 1 : 0, willChange: 'opacity, transform' }}>
            {w}
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </Tag>
  );
}

/* ════════════════════════════ GLOBO 3D DE NARIÑO ════════════════════════════ */
function NarinoGlobe({ progressRef, reducedMotion }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [hover, setHover] = useState(null); // {name,x,y}
  const [coord, setCoord] = useState('01°12′N 077°16′W');

  useEffect(() => {
    if (reducedMotion) return; // ruta estática (poster) gestionada en el render
    const mount = mountRef.current;
    if (!mount) return;

    let renderer, scene, camera, raf, ro;
    let disposed = false;
    const disposables = [];
    const track = (o) => { disposables.push(o); return o; };

    try {
      const W = mount.clientWidth || 480;
      const H = mount.clientHeight || 480;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8)); // cap DPR
      renderer.setSize(W, H);
      mount.appendChild(renderer.domElement);
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.style.display = 'block';

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
      camera.position.set(0, 0, 3.25);

      scene.add(new THREE.AmbientLight(0xffffff, 0.55));
      scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x14202e, 0.28));
      const sun = new THREE.DirectionalLight(0xffffff, 1.15);
      sun.position.set(3, 1.6, 2.6);
      scene.add(sun);

      const globe = new THREE.Group();
      scene.add(globe);

      // 1) TIERRA REAL (Blue Marble) — Phong + cascada de textura local→CDN + fallback procedimental.
      //    Técnica portada de GobernaciondeNarino/suite-oni (assets/js/globo.js).
      const earthMat = track(new THREE.MeshPhongMaterial({ color: 0x12324a, specular: 0x2a3a52, shininess: 16 }));
      globe.add(new THREE.Mesh(track(new THREE.SphereGeometry(0.997, 64, 64)), earthMat));

      const TEX_URLS = [
        `${MEDIA_BASE}/textures/earth-blue-marble.jpg`, // bundle local (offline-safe)
        'https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
        'https://cdn.jsdelivr.net/npm/three-globe@2.31.1/example/img/earth-blue-marble.jpg',
      ];
      let texDone = false;
      const texLoader = new THREE.TextureLoader();
      texLoader.crossOrigin = 'anonymous';
      const applyTex = (tex) => {
        if (texDone || disposed) return;
        if ('SRGBColorSpace' in THREE) tex.colorSpace = THREE.SRGBColorSpace;
        earthMat.map = tex; earthMat.color = new THREE.Color(0xffffff); earthMat.needsUpdate = true;
        texDone = true; track(tex);
      };
      const proceduralEarth = () => {
        if (texDone || disposed) return;
        const cv = document.createElement('canvas'); cv.width = 2048; cv.height = 1024;
        const cx = cv.getContext('2d');
        cx.fillStyle = '#123a57'; cx.fillRect(0, 0, cv.width, cv.height);
        cx.fillStyle = '#2f6f57';
        [[380, 150, 320, 380], [560, 470, 210, 360], [900, 180, 280, 220], [950, 380, 360, 400], [1180, 180, 560, 380], [1600, 560, 200, 150]]
          .forEach((r) => { cx.beginPath(); cx.ellipse(r[0] + r[2] / 2, r[1] + r[3] / 2, r[2] / 2, r[3] / 2, 0, 0, Math.PI * 2); cx.fill(); });
        const t = new THREE.CanvasTexture(cv);
        if ('SRGBColorSpace' in THREE) t.colorSpace = THREE.SRGBColorSpace;
        applyTex(t);
      };
      const tryTex = (i) => {
        if (texDone || disposed) return;
        if (i >= TEX_URLS.length) { proceduralEarth(); return; }
        texLoader.load(TEX_URLS[i], applyTex, undefined, () => tryTex(i + 1));
      };
      tryTex(0);
      setTimeout(() => proceduralEarth(), 6000); // si nada cargó

      // Capas de realismo (CORS, fallan en silencio): brillo especular del océano + relieve.
      const extra = new THREE.TextureLoader();
      extra.crossOrigin = 'anonymous';
      extra.load('https://unpkg.com/three-globe/example/img/earth-water.png',
        (t) => { if (disposed) return; earthMat.specularMap = t; earthMat.specular = new THREE.Color(0x6b7a90); earthMat.shininess = 22; earthMat.needsUpdate = true; track(t); }, undefined, () => {});
      extra.load('https://unpkg.com/three-globe/example/img/earth-topology.png',
        (t) => { if (disposed) return; earthMat.bumpMap = t; earthMat.bumpScale = 0.02; earthMat.needsUpdate = true; track(t); }, undefined, () => {});

      // 2) Retícula (graticule) lat/long.
      const grat = [];
      for (let lat = -60; lat <= 60; lat += 30) {
        for (let lon = -180; lon < 180; lon += 6) {
          grat.push(llToVec3(lon, lat, 1.0), llToVec3(lon + 6, lat, 1.0));
        }
      }
      for (let lon = -180; lon < 180; lon += 30) {
        for (let lat = -80; lat < 80; lat += 6) {
          grat.push(llToVec3(lon, lat, 1.0), llToVec3(lon, lat + 6, 1.0));
        }
      }
      const gratGeo = track(new THREE.BufferGeometry().setFromPoints(grat));
      const gratMat = track(new THREE.LineBasicMaterial({ color: C.grid, transparent: true, opacity: 0.1 }));
      globe.add(new THREE.LineSegments(gratGeo, gratMat));

      // Material de la atmósfera fresnel (BackSide).
      const atmoMat = track(
        new THREE.ShaderMaterial({
          transparent: true,
          blending: THREE.NormalBlending,
          side: THREE.BackSide,
          depthWrite: false,
          uniforms: {
            uIntensity: { value: 0.5 * NEON },
            uNeon: { value: new THREE.Color(C.neon) },
            uBright: { value: new THREE.Color(C.neonBright) },
          },
          vertexShader: `
            varying vec3 vN; varying vec3 vV;
            void main(){
              vN = normalize(normalMatrix * normal);
              vec4 mv = modelViewMatrix * vec4(position,1.0);
              vV = normalize(-mv.xyz);
              gl_Position = projectionMatrix * mv;
            }`,
          fragmentShader: `
            varying vec3 vN; varying vec3 vV; uniform float uIntensity;
            uniform vec3 uNeon; uniform vec3 uBright;
            void main(){
              float f = pow(1.0 - clamp(dot(vN,vV),0.0,1.0), 3.0);
              vec3 col = mix(uNeon, uBright, f);
              gl_FragColor = vec4(col, f * uIntensity);
            }`,
        })
      );
      const atmoGeo = track(new THREE.SphereGeometry(1.16, 48, 32));
      globe.add(new THREE.Mesh(atmoGeo, atmoMat));

      // Material de puntos (municipios) con encendido progresivo.
      const ptsMat = track(
        new THREE.ShaderMaterial({
          transparent: true,
          depthTest: true,
          depthWrite: false,
          uniforms: {
            uProgress: { value: 0 },
            uPR: { value: renderer.getPixelRatio() },
            uSize: { value: 220.0 },
            uNeon: { value: new THREE.Color(C.neon) },
            uBright: { value: new THREE.Color(C.neonBright) },
          },
          vertexShader: `
            attribute float aThresh; varying float vT;
            uniform float uPR; uniform float uSize;
            void main(){
              vT = aThresh;
              vec4 mv = modelViewMatrix * vec4(position,1.0);
              gl_PointSize = uSize * uPR / max(0.001, -mv.z);
              gl_Position = projectionMatrix * mv;
            }`,
          fragmentShader: `
            precision mediump float;
            varying float vT; uniform float uProgress;
            uniform vec3 uNeon; uniform vec3 uBright;
            void main(){
              vec2 uv = gl_PointCoord - 0.5;
              float d = length(uv);
              if(d > 0.5) discard;
              float glow = smoothstep(0.5, 0.0, d);
              float lit = smoothstep(vT - 0.06, vT + 0.06, uProgress);
              vec3 col = mix(uNeon, uBright, lit);
              float a = glow * (0.16 + 0.84 * lit);
              gl_FragColor = vec4(col, a);
            }`,
        })
      );

      const state = {
        names: [],
        pointsObj: null,
        narinoLine: null,
        marker: null,
        narinoCentroid: new THREE.Vector3(0, 0, 1),
        haveCentroid: false,
        targetQuat: new THREE.Quaternion(),
        ready: false,
      };

      // LineSegments fusionado a partir de polilíneas [[lon,lat],...] (geografía real).
      const addLines = (polylines, color, opacity, radius, renderOrder = 0) => {
        const pts = [];
        for (const line of polylines) {
          for (let i = 0; i < line.length - 1; i++) {
            pts.push(llToVec3(line[i][0], line[i][1], radius), llToVec3(line[i + 1][0], line[i + 1][1], radius));
          }
        }
        if (!pts.length) return null;
        const g = track(new THREE.BufferGeometry().setFromPoints(pts));
        const m = track(new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
        const seg = new THREE.LineSegments(g, m);
        seg.renderOrder = renderOrder;
        globe.add(seg);
        return seg;
      };

      const setCentroidFromRings = (rings) => {
        const cen = new THREE.Vector3(); let n = 0;
        rings.forEach((r) => r.forEach(([lon, lat]) => { cen.add(llToVec3(lon, lat, 1)); n++; }));
        if (n) { cen.multiplyScalar(1 / n).normalize(); state.narinoCentroid.copy(cen); state.haveCentroid = true; }
      };

      const buildPoints = (munis) => {
        if (!state.haveCentroid) {
          const cen = new THREE.Vector3();
          munis.forEach((m) => cen.add(llToVec3(m.lon, m.lat, 1)));
          cen.multiplyScalar(1 / munis.length).normalize();
          state.narinoCentroid.copy(cen); state.haveCentroid = true;
        }
        let maxD = 0.0001;
        const dists = munis.map((m) => {
          const d = llToVec3(m.lon, m.lat, 1).normalize().distanceTo(state.narinoCentroid);
          maxD = Math.max(maxD, d); return d;
        });
        const pos = new Float32Array(munis.length * 3);
        const thr = new Float32Array(munis.length);
        munis.forEach((m, i) => {
          const v = llToVec3(m.lon, m.lat, 1.012);
          pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
          thr[i] = 0.16 + 0.62 * (dists[i] / maxD); // los más cercanos al centro encienden antes
          state.names.push(m.name);
        });
        const g = track(new THREE.BufferGeometry());
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        g.setAttribute('aThresh', new THREE.BufferAttribute(thr, 1));
        const points = new THREE.Points(g, ptsMat);
        points.renderOrder = 3;
        globe.add(points);
        state.pointsObj = points;
      };

      const loadJSON = (url) =>
        fetch(url).then((r) => { if (!r.ok) throw new Error(url + ' ' + r.status); return r.json(); }).catch(() => null);

      // Carga en paralelo: municipios oficiales + contorno real del departamento.
      Promise.all([
        loadJSON(GEOJSON_URL),
        loadJSON(`${MEDIA_BASE}/data/narino-outline.json`),
      ]).then(([gj, narinoRings]) => {
        if (disposed) return;

        // Municipios (puntos) + contorno de respaldo del GeoJSON.
        let munis = FALLBACK_MUNICIPIOS;
        let fallbackRing = null;
        if (gj && gj.features) {
          const ms = gj.features
            .filter((f) => f.properties && f.properties.kind === 'municipio' && f.geometry && f.geometry.type === 'Point')
            .map((f) => ({ name: f.properties.name, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1] }));
          if (ms.length) munis = ms;
          const bf = gj.features.find((f) => f.properties && f.properties.kind === 'boundary');
          if (bf && bf.geometry) fallbackRing = bf.geometry.coordinates[0];
        }

        // Contorno REAL del departamento (líneas oficiales) — se enciende con el scroll.
        const rings = Array.isArray(narinoRings) && narinoRings.length ? narinoRings : (fallbackRing ? [fallbackRing] : null);
        if (rings) {
          setCentroidFromRings(rings);
          state.narinoLine = addLines(rings, C.neon, 0.0, 1.004, 2);
        }

        buildPoints(munis);

        // Marcador de Nariño (núcleo + onda expansiva) — estilo suite-oni, sobre la capital.
        const cap = munis.find((m) => /pasto/i.test(m.name)) || munis[0];
        const mDir = llToVec3(cap.lon, cap.lat, 1).normalize();
        const mPos = mDir.clone().multiplyScalar(1.02);
        const core = new THREE.Mesh(track(new THREE.SphereGeometry(0.014, 16, 16)), track(new THREE.MeshBasicMaterial({ color: C.neonBright })));
        core.position.copy(mPos); core.renderOrder = 4; globe.add(core);
        const ringM = new THREE.Mesh(
          track(new THREE.RingGeometry(0.022, 0.03, 40)),
          track(new THREE.MeshBasicMaterial({ color: C.neon, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }))
        );
        ringM.position.copy(mPos); ringM.lookAt(mDir.clone().multiplyScalar(2)); ringM.renderOrder = 4; globe.add(ringM);
        state.marker = { core, ring: ringM };

        state.targetQuat.setFromUnitVectors(state.narinoCentroid.clone().normalize(), new THREE.Vector3(0, 0, 1));
        state.ready = true;
      });

      // Interacción: parallax/drag.
      const drag = { active: false, x: 0, y: 0 };
      const nudge = { x: 0, y: 0 }; // desplazamiento manual acumulado (clamped)
      const onDown = (e) => { drag.active = true; drag.x = e.clientX; drag.y = e.clientY; };
      const onUp = () => { drag.active = false; };
      const onMove = (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        parallax.tx = clamp(px, -0.5, 0.5) * 0.5;
        parallax.ty = clamp(py, -0.5, 0.5) * 0.35;
        if (drag.active) {
          nudge.x = clamp(nudge.x + (e.clientX - drag.x) * 0.005, -1.2, 1.2);
          nudge.y = clamp(nudge.y + (e.clientY - drag.y) * 0.005, -0.6, 0.6);
          drag.x = e.clientX; drag.y = e.clientY;
        }
        raycastHover(e, rect);
      };
      const parallax = { tx: 0, ty: 0, x: 0, y: 0 };

      // Raycast hover sobre municipios.
      const raycaster = new THREE.Raycaster();
      raycaster.params.Points.threshold = 0.022;
      const ndc = new THREE.Vector2();
      let lastRay = 0;
      const raycastHover = (e, rect) => {
        const now = performance.now();
        if (now - lastRay < 33 || !state.pointsObj) return; // ~30fps
        lastRay = now;
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObject(state.pointsObj);
        // Solo cuenta si el punto mira hacia la cámara (cara frontal).
        let found = null;
        for (const h of hits) {
          const world = state.pointsObj.localToWorld(
            new THREE.Vector3().fromBufferAttribute(state.pointsObj.geometry.attributes.position, h.index)
          );
          if (world.z > 0.2) { found = { name: state.names[h.index], x: e.clientX - rect.left, y: e.clientY - rect.top }; break; }
        }
        setHover(found);
      };
      const onLeave = () => setHover(null);

      const el = renderer.domElement;
      el.addEventListener('pointerdown', onDown);
      window.addEventListener('pointerup', onUp);
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      el.style.touchAction = 'pan-y'; // no secuestrar el scroll vertical

      // Bucle de render.
      const spinQuat = new THREE.Quaternion();
      const eul = new THREE.Euler();
      let spin = 0;
      let lastCoord = 0;
      const tmpQ = new THREE.Quaternion();
      const camZ = { from: 3.25, to: 1.75 };

      const renderLoop = () => {
        if (disposed) return;
        raf = requestAnimationFrame(renderLoop);
        const p = clamp(progressRef.current || 0, 0, 1);
        const e = easeInOut(p);

        // Giro idle (se atenúa al hacer zoom).
        spin += 0.0016 * (1 - e * 0.92);
        eul.set(parallax.y * 0.25 + nudge.y, spin + nudge.x, 0, 'YXZ');
        spinQuat.setFromEuler(eul);

        // Mezcla giro idle → orientación a Nariño.
        globe.quaternion.copy(spinQuat).slerp(state.targetQuat, e);

        // Parallax suave.
        parallax.x += (parallax.tx - parallax.x) * 0.06;
        parallax.y += (parallax.ty - parallax.y) * 0.06;
        globe.position.x = parallax.x * 0.12 * (1 - e);

        // Dolly de cámara (zoom al departamento).
        camera.position.z = camZ.from + (camZ.to - camZ.from) * e;
        camera.position.y = -0.06 * e;
        camera.lookAt(0, 0, 0);

        // Uniforms dependientes del progreso.
        ptsMat.uniforms.uProgress.value = p;
        atmoMat.uniforms.uIntensity.value = (0.5 + 0.85 * e) * NEON;
        if (state.narinoLine) state.narinoLine.material.opacity = 0.12 + e * 0.85;
        if (state.marker) {
          const tw = (performance.now() % 2200) / 2200;        // onda expansiva
          state.marker.ring.scale.setScalar(1 + tw * 2.4);
          state.marker.ring.material.opacity = (1 - tw) * 0.7 * (0.45 + 0.55 * e);
        }

        // Lectura de coordenadas (throttle ~6/s).
        const now = performance.now();
        if (now - lastCoord > 150) {
          lastCoord = now;
          tmpQ.copy(globe.quaternion).invert();
          const facing = new THREE.Vector3(0, 0, 1).applyQuaternion(tmpQ);
          const ll = vec3ToLL(facing);
          setCoord(fmtDMS(ll.lon, ll.lat));
        }

        renderer.render(scene, camera);
      };
      renderLoop();

      // Resize.
      ro = new ResizeObserver(() => {
        const w = mount.clientWidth, h = mount.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h; camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        ptsMat.uniforms.uPR.value = renderer.getPixelRatio();
      });
      ro.observe(mount);

      // Limpieza.
      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        if (ro) ro.disconnect();
        el.removeEventListener('pointerdown', onDown);
        window.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', onLeave);
        disposables.forEach((o) => o && o.dispose && o.dispose());
        renderer.dispose();
        if (el.parentNode) el.parentNode.removeChild(el);
      };
    } catch (err) {
      // WebGL no disponible → poster estático.
      console.warn('[NarinoGlobe] WebGL no disponible, usando poster:', err);
      setFailed(true);
    }
  }, [reducedMotion, progressRef]);

  // Ruta estática: reduced-motion o fallo de WebGL → still 4K.
  if (reducedMotion || failed) {
    return (
      <div className="relative w-full h-full grid place-items-center" aria-hidden="true">
        <img
          src={ASSETS.posterGlobe}
          alt=""
          className="w-full h-full object-contain select-none pointer-events-none"
          loading="eager"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />
      {/* Anillo HUD del globo (decorativo). */}
      <GlobeRing coord={coord} />
      {/* Tooltip de municipio. */}
      {hover && (
        <div
          className="pointer-events-none absolute z-20 font-ui text-[12px] font-bold px-2 py-1 rounded-sm tic-chip"
          style={{
            left: hover.x + 12,
            top: hover.y - 8,
            color: 'var(--ink)',
            background: 'rgba(243,246,248,.95)',
            border: '1px solid var(--neon)',
            boxShadow: '0 0 14px rgba(0,168,255,.35)',
            clipPath: CUT_BTN,
          }}
        >
          <span aria-hidden="true">◢ </span>
          {hover.name}
        </div>
      )}
    </div>
  );
}

/* Anillo/retícula HUD alrededor del globo. */
function GlobeRing({ coord }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Retícula que rota lentamente. */}
        <g className="tic-reticle" style={{ transformOrigin: '50% 50%', transformBox: 'fill-box' }}>
          <circle cx="50" cy="50" r="46" fill="none" stroke="var(--neon)" strokeOpacity="0.35" strokeWidth="0.3" strokeDasharray="1 3" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="var(--neon)" strokeOpacity="0.5" strokeWidth="0.2" strokeDasharray="0.5 6" />
          {[0, 90, 180, 270].map((a) => (
            <line key={a} x1="50" y1="3" x2="50" y2="7" stroke="var(--neon)" strokeWidth="0.4" transform={`rotate(${a} 50 50)`} />
          ))}
        </g>
        {/* Corchetes de esquina del globo. */}
        {[
          'M6 16 L6 6 L16 6', 'M84 6 L94 6 L94 16', 'M94 84 L94 94 L84 94', 'M16 94 L6 94 L6 84',
        ].map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--neon)" strokeOpacity="0.6" strokeWidth="0.5" />
        ))}
        <circle cx="50" cy="50" r="46" fill="none" stroke="var(--neon-bright)" strokeOpacity="0.12" strokeWidth="0.6" />
      </svg>
      {/* Lectura de coordenadas (decorativa; el texto-equivalente real está aparte). */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-2 font-mono-hud text-[10px] tracking-widest" style={{ color: 'var(--neon-text)' }}>
        {coord}
      </div>
    </div>
  );
}

/* ════════════════════════════ MARCO HUD (decorativo) ════════════════════════════ */
function HudFrame({ hudPct, barRef, reducedMotion }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden" aria-hidden="true">
      {/* Patrón hexagonal muy tenue. */}
      <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.06 }}>
        <defs>
          <pattern id="ticHex" width="56" height="48" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path d="M14 0 L42 0 L56 24 L42 48 L14 48 L0 24 Z" fill="none" stroke="var(--neon)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ticHex)" />
      </svg>

      {/* Línea de barrido (scanline). */}
      {!reducedMotion && (
        <div className="absolute left-0 right-0 h-24 tic-scanline" style={{
          background: 'linear-gradient(to bottom, transparent, rgba(0,168,255,.08), transparent)',
        }} />
      )}

      {/* Marco exterior con esquinas recortadas. */}
      <div className="absolute inset-3 sm:inset-4" style={{
        border: '1px solid rgba(0,168,255,.45)',
        clipPath: 'polygon(0 22px, 22px 0, calc(100% - 22px) 0, 100% 22px, 100% calc(100% - 22px), calc(100% - 22px) 100%, 22px 100%, 0 calc(100% - 22px))',
      }} />

      {/* L-brackets en las cuatro esquinas. */}
      {[
        { c: 'top-2 left-2 sm:top-3 sm:left-3', d: 'M0 26 L0 0 L26 0' },
        { c: 'top-2 right-2 sm:top-3 sm:right-3', d: 'M28 26 L28 0 L2 0', vb: true },
        { c: 'bottom-2 left-2 sm:bottom-3 sm:left-3', d: 'M0 2 L0 28 L26 28', vb: true },
        { c: 'bottom-2 right-2 sm:bottom-3 sm:right-3', d: 'M28 2 L28 28 L2 28', vb: true },
      ].map((b, i) => (
        <svg key={i} className={`absolute ${b.c}`} width="28" height="28" viewBox="0 0 28 28">
          <path d={b.d} fill="none" stroke="var(--neon)" strokeWidth="1.5" />
        </svg>
      ))}
      {/* Crosshairs en las intersecciones superiores. */}
      {['left-1/4', 'left-3/4'].map((pos, i) => (
        <svg key={i} className={`absolute top-3 sm:top-4 ${pos} -translate-x-1/2`} width="14" height="14" viewBox="0 0 14 14">
          <path d="M7 0 L7 14 M0 7 L14 7" stroke="var(--neon)" strokeOpacity="0.5" strokeWidth="0.8" />
        </svg>
      ))}

      {/* Riel izquierdo con micro-tags (mono, decorativo). */}
      <div className="hidden md:flex absolute left-5 top-1/2 -translate-y-1/2 -rotate-90 origin-center gap-3 items-center font-mono-hud text-[10px] tracking-[0.25em]" style={{ color: 'var(--neon-text)', opacity: 0.7 }}>
        <span>SEC.TIC // GOB. NARIÑO</span>
        <span style={{ color: 'var(--grid-line)' }}>—</span>
        <span>DATA_FLOW</span>
      </div>

      {/* Conector con nodos (decorativo). */}
      <svg className="hidden lg:block absolute left-10 bottom-24 w-40 h-20" viewBox="0 0 160 80" fill="none">
        <path d="M2 70 L40 70 L60 40 L120 40" stroke="var(--neon)" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx="2" cy="70" r="3" fill="var(--neon)" />
        <circle cx="60" cy="40" r="2.5" fill="var(--neon-bright)" />
        <circle cx="120" cy="40" r="3" fill="none" stroke="var(--neon)" strokeWidth="1" />
      </svg>

      {/* Barcode decorativo. */}
      <svg className="hidden sm:block absolute top-16 right-6 w-28 h-7" viewBox="0 0 112 28" preserveAspectRatio="none">
        {Array.from({ length: 34 }).map((_, i) => (
          <rect key={i} x={i * 3.3} y="0" width={(i % 4 === 0 ? 1.8 : i % 3 === 0 ? 1.0 : 0.6)} height="28" fill="var(--ink-2)" opacity={0.55} />
        ))}
      </svg>

      {/* Chevrons como pista de scroll. */}
      {!reducedMotion && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-5 flex flex-col items-center" style={{ color: 'var(--neon)' }}>
          <ChevronsRight className="rotate-90 tic-pulse" size={22} aria-hidden="true" />
        </div>
      )}

      {/* Barra de progreso HUD (ligada al scroll / zoom del globo). */}
      <div className="absolute bottom-6 sm:bottom-7 left-1/2 -translate-x-1/2 w-[min(420px,70%)]">
        <div className="flex items-center justify-between font-mono-hud text-[10px] tracking-widest mb-1" style={{ color: 'var(--neon-text)' }}>
          <span>EXPLORANDO // NARIÑO</span>
          <span>{String(hudPct).padStart(3, '0')}%</span>
        </div>
        <div className="h-[3px] w-full" style={{ background: 'var(--bg-panel-2)' }}>
          <div ref={barRef} className="h-full" style={{ width: hudPct + '%', background: 'linear-gradient(90deg,var(--neon),var(--neon-bright))', boxShadow: '0 0 8px rgba(0,168,255,.6)' }} />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ TOP DATA STRIP ════════════════════════════ */
function DataStrip({ coord }) {
  return (
    <div className="relative z-20 w-full border-b" style={{ borderColor: 'var(--grid-line)', background: 'var(--bg-panel)' }}>
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3 font-mono-hud text-[10px] sm:text-[11px] tracking-widest" style={{ color: 'var(--ink-2)' }}>
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm tic-chip" style={{ color: '#0a6b27', background: 'rgba(16,161,59,.12)', border: '1px solid rgba(16,161,59,.45)' }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full tic-pulse" style={{ background: 'var(--gn-green)' }} /> ACTIVE
          </span>
          <span className="hidden sm:inline">SYS: ONLINE</span>
        </div>
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="hidden md:inline" style={{ color: 'var(--neon-text)' }}>{coord}</span>
          <span className="hidden sm:inline px-2 py-0.5 rounded-sm tic-chip" style={{ color: '#7a6400', background: 'rgba(255,213,0,.16)', border: '1px solid rgba(255,213,0,.55)' }}>GOV.CO</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ NAV BAR ════════════════════════════ */
function NavBar({ onOpenMenu, menuOpen, menuBtnRef }) {
  return (
    <nav aria-label="Principal" className="relative z-30 w-full" style={{ background: 'var(--bg-panel)', borderBottom: '1px solid var(--grid-line)' }}>
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logos oficiales + nombre de dependencia. */}
        <a href="https://www.gov.co/" className="tic-focus shrink-0" aria-label="Portal del Estado Colombiano GOV.CO">
          <img src={LOGO_GOVCO} alt="GOV.CO" className="h-6 w-auto" />
        </a>
        <span className="h-7 w-px" style={{ background: 'var(--grid-line)' }} aria-hidden="true" />
        <a href="https://narino.gov.co/" className="tic-focus flex items-center gap-2.5 shrink-0" aria-label={`${COPY.org} — ${COPY.brand}`}>
          {/* TODO: replace with official SVG horizontal logo */}
          <img src={LOGO_GOBERNACION} alt={COPY.org} className="h-9 w-auto" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <span className="hidden lg:block leading-tight" style={{ color: '#4D4D4D' }}>
            <span className="block font-medium text-[16px]" style={{ fontFamily: '"Hind Madurai"' }}>{COPY.brand}</span>
          </span>
        </a>

        {/* Links centrales (desktop). */}
        <ul className="hidden xl:flex items-center gap-6 ml-auto font-ui text-[14px] font-normal">
          {COPY.nav.map((item) => (
            <li key={item.label}>
              <a href={item.href} className="tic-link tic-focus inline-flex items-center gap-1 py-1">
                {item.label}
                {item.submenu && <ChevronDown size={14} aria-hidden="true" />}
              </a>
            </li>
          ))}
        </ul>

        {/* Acciones derecha (desktop). */}
        <div className="hidden xl:flex items-center gap-3 font-ui text-[14px]">
          <button className="tic-link tic-focus p-2" aria-label="Buscar en el sitio">
            <Search size={18} aria-hidden="true" />
          </button>
          <a href={COPY.phoneHref} className="tic-link tic-focus inline-flex items-center gap-1.5">
            <Phone size={15} aria-hidden="true" /> <span className="hidden 2xl:inline">{COPY.phone}</span>
          </a>
          <a href={COPY.contacto.href} className="tic-link tic-focus">{COPY.contacto.label}</a>
          <button className="tic-focus grid place-items-center rounded-full w-10 h-10 text-white" style={{ background: 'var(--gn-navy)' }} aria-label="Opciones de accesibilidad" title="Accesibilidad">
            {/* TODO: integrar widget de accesibilidad */}
            <Accessibility size={22} aria-hidden="true" />
          </button>
        </div>

        {/* Móvil: hamburguesa + accesibilidad. */}
        <div className="flex xl:hidden items-center gap-2 ml-auto">
          <button className="tic-focus grid place-items-center rounded-full w-10 h-10 text-white" style={{ background: 'var(--gn-navy)' }} aria-label="Opciones de accesibilidad">
            <Accessibility size={20} aria-hidden="true" />
          </button>
          <button ref={menuBtnRef} onClick={onOpenMenu} className="tic-focus p-2" style={{ color: 'var(--ink)' }} aria-label="Abrir menú" aria-expanded={menuOpen} aria-controls="tic-mobile-menu">
            <Menu size={26} aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ════════════════════════════ MENÚ MÓVIL (focus-trap) ════════════════════════════ */
function MobileMenu({ open, onClose, triggerRef }) {
  const panelRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusables = () => panel.querySelectorAll('a[href], button:not([disabled])');
    const first = focusables()[0];
    first && first.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      const a = f[0], b = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
      else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      triggerRef && triggerRef.current && triggerRef.current.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;
  return (
    <div id="tic-mobile-menu" role="dialog" aria-modal="true" aria-label="Menú principal" className="fixed inset-0 z-50 xl:hidden" ref={panelRef}>
      <div className="absolute inset-0" style={{ background: 'rgba(231,235,238,.97)', backdropFilter: 'blur(4px)' }} />
      <div className="relative h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-8">
          <span className="font-ui font-bold" style={{ color: 'var(--ink)' }}>{COPY.brand}</span>
          <button onClick={onClose} className="tic-focus p-2" style={{ color: 'var(--ink)' }} aria-label="Cerrar menú">
            <X size={28} aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-1 font-sans text-2xl">
          {COPY.nav.map((item) => (
            <li key={item.label}>
              <a href={item.href} onClick={onClose} className="tic-link tic-focus block py-3 border-b" style={{ borderColor: 'var(--grid-line)', fontFamily: '"Hind Madurai"', color: 'var(--ink)' }}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-col gap-3 font-ui text-[15px]">
          <a href={COPY.phoneHref} onClick={onClose} className="tic-link tic-focus inline-flex items-center gap-2"><Phone size={16} aria-hidden="true" /> {COPY.phone}</a>
          <a href={COPY.contacto.href} onClick={onClose} className="tic-link tic-focus">{COPY.contacto.label}</a>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════ APP ════════════════════════════ */
export default function App() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hudPct, setHudPct] = useState(0);
  const coord = '01°12′N 077°16′W'; // lectura decorativa del header (Pasto); el globo tiene su propia lectura viva
  const progressRef = useRef(0);
  const heroRef = useRef(null);
  const barRef = useRef(null);
  const menuBtnRef = useRef(null);

  // prefers-reduced-motion.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', apply) : mq.removeListener(apply); };
  }, []);

  // Progreso de scroll (rAF-throttled) → globo + barra HUD.
  useEffect(() => {
    if (reducedMotion) { progressRef.current = 0.78; setHudPct(78); return; }
    let ticking = false, raf = 0, lastPct = -1;
    const compute = () => {
      ticking = false;
      const el = heroRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = Math.max(1, rect.height);
      const p = clamp(-rect.top / total, 0, 1);
      progressRef.current = p;
      if (barRef.current) barRef.current.style.width = (p * 100).toFixed(1) + '%';
      const pct = Math.round(p * 100);
      if (pct !== lastPct) { lastPct = pct; setHudPct(pct); }
    };
    const onScroll = () => { if (!ticking) { ticking = true; raf = requestAnimationFrame(compute); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    compute();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [reducedMotion]);

  return (
    <div className="tic-root min-h-screen w-full overflow-x-hidden">
      <HudStyles />

      {/* Skip link. */}
      <a href="#contenido" className="tic-focus sr-only focus:not-sr-only focus:absolute focus:z-[60] focus:top-3 focus:left-3 focus:px-4 focus:py-2 focus:rounded font-ui font-bold" style={{ background: 'var(--gn-navy)', color: '#fff' }}>
        Ir al contenido
      </a>

      <header>
        <DataStrip coord={coord} />
        <NavBar onOpenMenu={() => setMenuOpen(true)} menuOpen={menuOpen} menuBtnRef={menuBtnRef} />
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} triggerRef={menuBtnRef} />

      {/* ════════ HERO ════════ */}
      <main id="contenido">
        <section ref={heroRef} className="relative w-full min-h-[88vh] overflow-hidden" aria-label="Presentación de la Secretaría TIC">
          {/* Superficie con grid técnico. */}
          <div className="absolute inset-0 tic-grid-bg" aria-hidden="true" />
          {/* Video ambiente opcional (detrás, muy sutil). */}
          {!reducedMotion && (
            <video
              className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-luminosity"
              autoPlay muted loop playsInline preload="none"
              poster={ASSETS.posterGlobe}
              aria-hidden="true"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            >
              <source src={ASSETS.loopWebm} type="video/webm" />
              <source src={ASSETS.loopMp4} type="video/mp4" />
            </video>
          )}

          <HudFrame hudPct={hudPct} barRef={barRef} reducedMotion={reducedMotion} />

          {/* Composición de dos zonas. */}
          <div className="relative z-20 max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 items-center min-h-[88vh]">
            {/* Globo (arriba en móvil, derecha en desktop). */}
            <div className="order-1 lg:order-2 w-full">
              <figure className="relative mx-auto w-full max-w-[520px] aspect-square">
                <NarinoGlobe progressRef={progressRef} reducedMotion={reducedMotion} />
                <figcaption className="mt-3 text-center">
                  <span className="font-mono-hud text-[12px] tracking-widest" style={{ color: 'var(--neon-text)' }}>{COPY.globeTag}</span>
                </figcaption>
              </figure>
            </div>

            {/* Contenido. */}
            <div className="order-2 lg:order-1 w-full">
              <p className="font-mono-hud text-[12px] tracking-[0.25em] mb-4 inline-flex items-center gap-2" style={{ color: 'var(--neon-text)' }}>
                <Database size={14} aria-hidden="true" /> GOBIERNO ABIERTO · DATOS · IA
              </p>
              <WordStagger
                as="h1"
                text={COPY.h1}
                reducedMotion={reducedMotion}
                delay={150}
                perWord={55}
                className="tic-h1 font-bold mb-5"
              />

              <WordStagger
                as="p"
                text={COPY.subhead}
                reducedMotion={reducedMotion}
                delay={650}
                perWord={18}
                duration={500}
                className="tic-subhead max-w-[60ch] mb-8"
              />

              <div className="flex flex-col sm:flex-row gap-4" style={{ animation: reducedMotion ? 'none' : 'ticFadeIn .8s ease 1.2s both' }}>
                <a
                  href={COPY.ctaPrimary.href}
                  className="tic-cta-primary tic-focus font-ui font-bold text-[15px] px-7 py-3.5 inline-flex items-center justify-center gap-2"
                  style={{ clipPath: CUT_BTN }}
                >
                  {COPY.ctaPrimary.label}
                  <ChevronsRight size={18} aria-hidden="true" />
                </a>
                <a
                  href={COPY.ctaSecondary.href}
                  className="tic-cta-ghost tic-focus font-ui font-bold text-[15px] px-7 py-3.5 inline-flex items-center justify-center gap-2"
                  style={{ clipPath: CUT_BTN }}
                >
                  <Building2 size={17} aria-hidden="true" />
                  {COPY.ctaSecondary.label}
                </a>
              </div>

              {/* Texto-equivalente del globo (accesible). */}
              <p className="sr-only">{COPY.globeDesc}</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
