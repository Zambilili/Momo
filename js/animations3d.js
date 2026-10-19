/* =========================================================
   Momo Tech : scène 3D principale (hero)
   Ordinateur portable, carte mère, processeur, mémoire, SSD,
   circuits lumineux et particules. 100 % procédural.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/addons/RoomEnvironment.js';
import {
  PALETTE, detectTier, rbox, makeMaterials, addStudioLights, radialTexture, makeLaptop,
  easeOutCubic, easeInOutCubic, clamp01,
} from './scene-kit.js';

const QUALITY = [
  { dpr: 1, particles: 90, antialias: false, env: false, screenFps: 4, fps: 30 },
  { dpr: 1.5, particles: 220, antialias: true, env: true, screenFps: 10, fps: 60 },
  { dpr: 2, particles: 420, antialias: true, env: true, screenFps: 15, fps: 60 },
];

/* ---------- Écran de diagnostic (texture animée) ---------- */
class DiagScreen {
  constructor() {
    this.w = 1024; this.h = 576;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.w; this.canvas.height = this.h;
    this.ctx = this.canvas.getContext('2d');
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.anisotropy = 4;
    this.history = new Array(90).fill(0.4);
    this.checks = ['Analyse du matériel', 'Vérification du disque', 'Pilotes et mises à jour', 'Contrôle de sécurité', 'Optimisation du démarrage'];
  }
  metric(t, k) { return 0.5 + 0.22 * Math.sin(t * (0.6 + k * 0.17) + k * 2.1) + 0.12 * Math.sin(t * (1.7 + k * 0.31) + k); }
  draw(t, boot) {
    const g = this.ctx, W = this.w, H = this.h;
    const mono = '500 22px "IBM Plex Mono", ui-monospace, monospace';
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#040b18'); bg.addColorStop(1, '#0a1d3a');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);

    if (boot < 1) {
      // séquence de démarrage
      const a = clamp01(boot * 2);
      g.globalAlpha = a;
      g.fillStyle = '#ffffff';
      g.font = '700 64px "Work Sans", system-ui, sans-serif';
      g.textAlign = 'center';
      g.fillText('MOMO TECH', W / 2, H / 2 - 10);
      g.fillStyle = '#7cc4ff'; g.font = mono;
      g.fillText('Votre technologie, notre expertise.', W / 2, H / 2 + 36);
      g.fillStyle = 'rgba(124,196,255,.18)'; g.fillRect(W / 2 - 160, H / 2 + 76, 320, 6);
      g.fillStyle = '#2f86ff'; g.fillRect(W / 2 - 160, H / 2 + 76, 320 * clamp01(boot * 1.2), 6);
      g.globalAlpha = 1; g.textAlign = 'left';
      this.texture.needsUpdate = true;
      return;
    }

    // grille discrète
    g.strokeStyle = 'rgba(124,196,255,.06)'; g.lineWidth = 1;
    for (let x = 0; x < W; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    for (let y = 0; y < H; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }

    // barre de titre
    g.fillStyle = 'rgba(47,134,255,.12)'; g.fillRect(0, 0, W, 58);
    g.fillStyle = '#ffffff'; g.font = '700 26px "Work Sans", system-ui, sans-serif'; g.fillText('MOMO TECH', 32, 38);
    g.fillStyle = '#7cc4ff'; g.font = mono; g.fillText('DIAGNOSTIC SYSTÈME', W - 300, 37);
    g.fillStyle = Math.sin(t * 4) > 0 ? '#5dff9c' : 'rgba(93,255,156,.3)';
    g.beginPath(); g.arc(W - 322, 30, 6, 0, Math.PI * 2); g.fill();

    // jauges
    const labels = ['PROCESSEUR', 'MÉMOIRE', 'STOCKAGE', 'TEMPÉRATURE'];
    labels.forEach((lab, k) => {
      const y = 104 + k * 76, v = this.metric(t, k);
      g.fillStyle = '#a9b6cc'; g.font = '500 18px "IBM Plex Mono", monospace'; g.fillText(lab, 32, y);
      g.fillStyle = '#ffffff'; g.fillText(k === 3 ? Math.round(38 + v * 22) + ' °C' : Math.round(v * 100) + ' %', 330, y);
      g.fillStyle = 'rgba(124,196,255,.14)'; g.fillRect(32, y + 14, 370, 10);
      const grd = g.createLinearGradient(32, 0, 402, 0); grd.addColorStop(0, '#1664ee'); grd.addColorStop(1, '#7cc4ff');
      g.fillStyle = grd; g.fillRect(32, y + 14, 370 * v, 10);
    });

    // graphique d'activité
    const gx = 450, gy = 84, gw = 540, gh = 250;
    g.strokeStyle = 'rgba(124,196,255,.25)'; g.strokeRect(gx, gy, gw, gh);
    g.fillStyle = '#a9b6cc'; g.font = '500 18px "IBM Plex Mono", monospace'; g.fillText('ACTIVITÉ', gx + 16, gy + 30);
    const n = this.history.length;
    const pts = this.history.map((v, i) => [gx + (i / (n - 1)) * gw, gy + gh - 20 - v * (gh - 70)]);
    const area = g.createLinearGradient(0, gy, 0, gy + gh); area.addColorStop(0, 'rgba(47,134,255,.45)'); area.addColorStop(1, 'rgba(47,134,255,0)');
    g.beginPath(); g.moveTo(pts[0][0], gy + gh);
    pts.forEach(([x, y]) => g.lineTo(x, y));
    g.lineTo(gx + gw, gy + gh); g.closePath(); g.fillStyle = area; g.fill();
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.strokeStyle = '#7cc4ff'; g.lineWidth = 3; g.shadowColor = '#2f86ff'; g.shadowBlur = 12; g.stroke(); g.shadowBlur = 0; g.lineWidth = 1;

    // liste de vérifications
    const cycle = (t * 0.6) % (this.checks.length + 2);
    this.checks.forEach((c, i) => {
      const x = 32 + (i % 3) * 330, y = 410 + Math.floor(i / 3) * 52;
      const done = cycle > i + 1, active = cycle > i && !done;
      g.fillStyle = done ? '#5dff9c' : active ? '#7cc4ff' : 'rgba(169,182,204,.4)';
      g.font = '500 19px "IBM Plex Mono", monospace';
      g.fillText((done ? '✓ ' : active ? '› ' : '· ') + c, x, y);
    });
    g.fillStyle = 'rgba(47,134,255,.12)'; g.fillRect(0, H - 44, W, 44);
    g.fillStyle = '#a9b6cc'; g.font = '500 17px "IBM Plex Mono", monospace';
    g.fillText('État du système : analyse en cours' + '.'.repeat(1 + (Math.floor(t * 2) % 3)), 32, H - 16);

    this.texture.needsUpdate = true;
  }
  push(t) {
    this.history.shift();
    this.history.push(clamp01(0.45 + 0.25 * Math.sin(t * 1.3) + 0.15 * Math.sin(t * 3.7) + (Math.random() - 0.5) * 0.12));
  }
}

/* ---------- Texture de la carte mère ---------- */
function boardTexture() {
  const W = 1024, H = 683, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#071631'; g.fillRect(0, 0, W, H);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  g.lineCap = 'round';
  for (let i = 0; i < 140; i++) {
    let x = Math.floor(rnd() * 64) * 16, y = Math.floor(rnd() * 43) * 16;
    g.strokeStyle = rnd() > 0.85 ? 'rgba(124,196,255,.35)' : 'rgba(64,120,190,.28)';
    g.lineWidth = rnd() > 0.7 ? 3 : 1.6;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 3; s++) {
      const len = (2 + Math.floor(rnd() * 8)) * 16;
      const dir = Math.floor(rnd() * 4);
      if (dir === 0) x += len; else if (dir === 1) x -= len; else if (dir === 2) y += len; else y -= len;
      const diag = Math.floor(rnd() * 3) * 16;
      x += diag; y += (rnd() > 0.5 ? diag : -diag);
      g.lineTo(x, y);
    }
    g.stroke();
    g.fillStyle = 'rgba(210,168,90,.55)'; g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = 'rgba(124,196,255,.35)'; g.font = '500 18px "IBM Plex Mono", monospace';
  g.fillText('MOMO TECH  MB-01', 40, H - 36);
  g.strokeStyle = 'rgba(124,196,255,.25)'; g.lineWidth = 2; g.strokeRect(12, 12, W - 24, H - 24);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

/* ---------- Circuits lumineux : impulsions le long de pistes ---------- */
function makeTraces(y, count) {
  const positions = [], dist = [], seeds = [], lens = [], ends = [];
  let seed = 3; const rnd = () => ((seed = (seed * 48271) % 2147483647) / 2147483647);
  for (let p = 0; p < count; p++) {
    const side = p % 4;
    let x, z;
    if (side === 0) { x = -1.4 + rnd() * 2.8; z = 1.15; }
    else if (side === 1) { x = -1.4 + rnd() * 2.8; z = -1.15; }
    else if (side === 2) { x = 1.65; z = -0.9 + rnd() * 1.8; }
    else { x = -1.65; z = -0.9 + rnd() * 1.8; }
    const pts = [[x, z]];
    const out = side === 0 ? [0, 1] : side === 1 ? [0, -1] : side === 2 ? [1, 0] : [-1, 0];
    for (let s = 0; s < 3; s++) {
      const len = 0.3 + rnd() * 0.7;
      if (s % 2 === 0) { x += out[0] * len; z += out[1] * len; }
      else { const d = (rnd() - 0.5) * 0.9; x += out[0] * len * 0.6 + (out[1] ? d : 0); z += out[1] * len * 0.6 + (out[0] ? d : 0); }
      x = Math.max(-3.45, Math.min(3.45, x)); z = Math.max(-2.25, Math.min(2.25, z));
      pts.push([x, z]);
    }
    let acc = 0; const s0 = rnd();
    const total = pts.reduce((a, q, i) => (i ? a + Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) : 0), 0);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      positions.push(a[0], y, a[1], b[0], y, b[1]);
      dist.push(acc, acc + l); acc += l;
      seeds.push(s0, s0); lens.push(total, total);
    }
    ends.push(pts[pts.length - 1]);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
  geo.setAttribute('aLen', new THREE.Float32BufferAttribute(lens, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uIntro: { value: 0 }, uColor: { value: new THREE.Color(PALETTE.hi) } },
    vertexShader: `
      attribute float aDist; attribute float aSeed; attribute float aLen;
      varying float vDist; varying float vSeed; varying float vLen;
      void main(){ vDist=aDist; vSeed=aSeed; vLen=aLen; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      uniform float uTime; uniform float uIntro; uniform vec3 uColor;
      varying float vDist; varying float vSeed; varying float vLen;
      void main(){
        float span = vLen + 1.2;
        float head = mod(uTime*0.55 + vSeed*span*3.0, span);
        float d = head - vDist;
        float pulse = d > 0.0 ? exp(-d*5.0) : 0.0;
        float lit = step(vDist, uIntro * (vLen + 0.01) * 1.0 + uIntro*0.001);
        float a = (0.22 * lit + pulse * 1.4) * uIntro;
        gl_FragColor = vec4(uColor * (0.6 + pulse), a);
      }`,
  });
  return { lines: new THREE.LineSegments(geo, mat), ends };
}

/* ---------- Particules (fausse profondeur de champ) ---------- */
function makeParticles(count, pixelRatio) {
  const pos = new Float32Array(count * 3), size = new Float32Array(count), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 1] = -2 + Math.random() * 7;
    pos[i * 3 + 2] = -6 + Math.random() * 10;
    size[i] = 0.5 + Math.random() * 1.4;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPR: { value: pixelRatio }, uFocus: { value: 10 }, uIntro: { value: 0 }, uColor: { value: new THREE.Color(PALETTE.hi) } },
    vertexShader: `
      attribute float aSize; attribute float aSeed;
      uniform float uTime; uniform float uPR; uniform float uFocus;
      varying float vAlpha;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + 2.0 + uTime * (0.05 + aSeed*0.08), 7.0) - 2.0;
        p.x += sin(uTime*0.3 + aSeed*12.0) * 0.15;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;
        float blur = clamp(abs(depth - uFocus) / 6.0, 0.0, 1.0);
        gl_PointSize = aSize * uPR * (26.0 / depth) * (1.0 + blur * 2.2);
        float edge = smoothstep(-2.0, -1.2, p.y) * (1.0 - smoothstep(4.0, 5.0, p.y));
        vAlpha = edge * (0.95 - blur * 0.7) * (0.5 + 0.5*sin(uTime*1.5 + aSeed*30.0));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; uniform float uIntro; varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, a * a * vAlpha * uIntro);
      }`,
  });
  return new THREE.Points(geo, mat);
}

/* ---------- Composants flottants ---------- */
function makeCPU(mats) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(rbox(0.95, 0.06, 0.95, 0.02), mats.pcbBlue));
  const ihs = new THREE.Mesh(rbox(0.64, 0.07, 0.64, 0.03), mats.steel);
  ihs.position.y = 0.06; g.add(ihs);
  const labelC = document.createElement('canvas'); labelC.width = labelC.height = 256;
  const lg = labelC.getContext('2d');
  lg.fillStyle = 'rgba(20,30,48,.55)'; lg.font = '700 46px "Work Sans", sans-serif'; lg.textAlign = 'center';
  lg.fillText('MOMO', 128, 120); lg.font = '500 26px "IBM Plex Mono", monospace'; lg.fillText('MT-X1  4.2GHz', 128, 162);
  const lt = new THREE.CanvasTexture(labelC); lt.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.58), new THREE.MeshBasicMaterial({ map: lt, transparent: true }));
  label.rotation.x = -Math.PI / 2; label.position.y = 0.0961; g.add(label);
  const pins = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.03, 0.035), mats.gold, 144);
  const m = new THREE.Matrix4(); let i = 0;
  for (let x = 0; x < 12; x++) for (let z = 0; z < 12; z++) { m.makeTranslation(-0.38 + x * 0.069, -0.045, -0.38 + z * 0.069); pins.setMatrixAt(i++, m); }
  g.add(pins);
  return g;
}
function makeRAM(mats) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(rbox(1.9, 0.48, 0.035, 0.012), mats.pcbBlue));
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Mesh(rbox(0.18, 0.24, 0.025, 0.006), mats.chip);
    c.position.set(-0.77 + i * 0.22, 0.04, 0.028); g.add(c);
  }
  const contacts = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.07, 0.04), mats.gold);
  contacts.position.y = -0.205; g.add(contacts);
  const led = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.025, 0.04), mats.glow);
  led.position.y = 0.245; g.add(led);
  return g;
}
function makeSSD(mats) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(rbox(1.25, 0.03, 0.3, 0.01), mats.pcbBlue));
  [-0.25, 0.18].forEach((x) => { const c = new THREE.Mesh(rbox(0.32, 0.03, 0.22, 0.006), mats.chip); c.position.set(x, 0.028, 0); g.add(c); });
  const k = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.032, 0.26), mats.gold); k.position.x = -0.6; g.add(k);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), mats.glow); dot.position.set(0.5, 0.03, 0.08); g.add(dot);
  return g;
}

/* =========================================================
   Initialisation
   ========================================================= */
export function initHeroScene(container, { reduceMotion = false } = {}) {
  const canvas = container.querySelector('canvas');
  let tier = detectTier();
  let Q = QUALITY[tier];

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.antialias, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    console.warn('[Momo Tech] WebGL non disponible', e);
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.dpr));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PALETTE.night, 16, 32);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const target = new THREE.Vector3(0, 0.55, 0);

  if (Q.env) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    pmrem.dispose();
  }
  addStudioLights(scene, 1);

  const mats = makeMaterials();
  const rig = new THREE.Group();
  scene.add(rig);

  // Carte mère
  const boardY = -0.62;
  const bTex = boardTexture();
  const board = new THREE.Mesh(rbox(7.0, 0.1, 4.6, 0.08, 3), new THREE.MeshStandardMaterial({
    map: bTex, emissiveMap: bTex, emissive: 0xffffff, emissiveIntensity: 0.18, metalness: 0.5, roughness: 0.5,
  }));
  board.position.y = boardY;
  rig.add(board);
  const boardTop = boardY + 0.051;

  // Ombre de contact + halo sous l'ordinateur
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(5, 3.8), new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,.85)'), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = boardTop + 0.004; rig.add(shadow);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.6), new THREE.MeshBasicMaterial({ map: radialTexture('rgba(47,134,255,.55)', 'rgba(47,134,255,0)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = boardTop + 0.006; rig.add(halo);

  // Circuits
  const traces = makeTraces(boardTop + 0.008, tier === 0 ? 14 : 26);
  rig.add(traces.lines);
  const padGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 14);
  const pads = new THREE.InstancedMesh(padGeo, mats.glow, traces.ends.length);
  const pm = new THREE.Matrix4();
  traces.ends.forEach(([x, z], i) => { pm.makeTranslation(x, boardTop + 0.01, z); pads.setMatrixAt(i, pm); });
  rig.add(pads);

  // Condensateurs et puces posés sur la carte
  const capGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.28, 20);
  [[-2.9, -1.7], [-2.6, -1.75], [-2.3, -1.7], [2.9, 1.8], [2.6, 1.85], [3.1, -1.2]].forEach(([x, z]) => {
    const c = new THREE.Mesh(capGeo, mats.steel); c.position.set(x, boardTop + 0.14, z); rig.add(c);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.01, 20), mats.glow); top.position.set(x, boardTop + 0.285, z); rig.add(top);
  });
  [[-2.75, 1.55, 0.7, 0.5], [2.8, -1.85, 0.55, 0.4], [-3.0, 0.2, 0.4, 0.6]].forEach(([x, z, w, d]) => {
    const c = new THREE.Mesh(rbox(w, 0.06, d, 0.01), mats.chip); c.position.set(x, boardTop + 0.03, z); rig.add(c);
  });

  // Ordinateur portable
  const screen = new DiagScreen();
  const laptop = makeLaptop(mats, { screenMap: screen.texture });
  laptop.group.position.y = 0.0;
  rig.add(laptop.group);
  const LID_OPEN = -0.27, LID_CLOSED = Math.PI / 2 - 0.035;

  // Composants flottants
  const floaters = [
    { obj: makeCPU(mats), pos: new THREE.Vector3(-2.55, 0.75, 1.05), rot: new THREE.Euler(0.35, 0.5, -0.15), amp: 0.12, speed: 0.7, phase: 0, spin: 0.12, delay: 0.5 },
    { obj: makeRAM(mats), pos: new THREE.Vector3(2.45, 1.55, -0.55), rot: new THREE.Euler(0.1, -0.75, 0.12), amp: 0.1, speed: 0.55, phase: 1.7, spin: 0.08, delay: 0.75 },
    { obj: makeSSD(mats), pos: new THREE.Vector3(-2.2, 1.75, -1.05), rot: new THREE.Euler(0.25, 0.4, 0.1), amp: 0.09, speed: 0.85, phase: 3.1, spin: 0.15, delay: 0.95 },
  ];
  floaters.forEach((f) => { f.obj.position.copy(f.pos); f.obj.rotation.copy(f.rot); f.dir = f.pos.clone().setY(0).normalize(); rig.add(f.obj); });

  // Particules
  const particles = makeParticles(Q.particles, renderer.getPixelRatio());
  scene.add(particles);

  /* ---------- Interaction ---------- */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const drag = { active: false, lastX: 0, yaw: 0, target: 0, lastInput: 0 };
  let scrollP = 0, scrollSmooth = 0;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  if (!reduceMotion && finePointer) {
    window.addEventListener('pointermove', (e) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }
  canvas.addEventListener('pointerdown', (e) => {
    drag.active = true; drag.lastX = e.clientX; drag.lastInput = performance.now();
    if (e.pointerType === 'mouse') canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag.active) return;
    const dx = e.clientX - drag.lastX; drag.lastX = e.clientX;
    drag.target = Math.max(-Math.PI, Math.min(Math.PI, drag.target + dx * 0.008));
    drag.lastInput = performance.now();
    invalidate();
  });
  const endDrag = () => { drag.active = false; drag.lastInput = performance.now(); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', endDrag);

  const hero = container.closest('.hero') || container;
  const onScroll = () => {
    const r = hero.getBoundingClientRect();
    scrollP = clamp01(-r.top / Math.max(1, r.height));
    invalidate();
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Dimensionnement ---------- */
  function resize() {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // recule la caméra pour que la scène tienne dans le cadre
    const dist = Math.min(19, Math.max(11, 11.5 / Math.min(camera.aspect, 1.4) + 2.2));
    camera.userData.dist = w < 600 ? dist * 1.12 : dist;
    camera.updateProjectionMatrix();
    particles.material.uniforms.uPR.value = renderer.getPixelRatio();
    particles.material.uniforms.uFocus.value = dist;
    invalidate();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  /* ---------- Boucle de rendu ---------- */
  let visible = true, raf = 0, needsRender = true, lastFrame = 0, lastScreen = -1, started = performance.now();
  let elapsed = 0, perfFrames = 0, perfTime = 0, perfChecked = false;
  const clock = { prev: performance.now(), getDelta() { const n = performance.now(), d = (n - this.prev) / 1000; this.prev = n; return d; } };

  function invalidate() { needsRender = true; if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }

  function update(t, introT) {
    // intro : ouverture de l'écran, apparition des composants
    const lidK = easeInOutCubic(clamp01((introT - 0.25) / 1.4));
    laptop.lid.rotation.x = LID_CLOSED + (LID_OPEN - LID_CLOSED) * lidK;
    const boot = clamp01((introT - 1.1) / 1.0);
    const intro = clamp01((introT - 0.9) / 1.6);
    traces.lines.material.uniforms.uIntro.value = easeOutCubic(intro);
    particles.material.uniforms.uIntro.value = easeOutCubic(clamp01(introT / 1.5));
    const rigIn = easeOutCubic(clamp01(introT / 1.4));
    rig.scale.setScalar(0.9 + 0.1 * rigIn);

    // écran
    const sInterval = 1 / Q.screenFps;
    if (boot < 1 || t - lastScreen > sInterval) {
      if (boot >= 1) screen.push(t);
      screen.draw(t, boot < 1 ? boot : 1);
      lastScreen = t;
    }

    // souris + glisser + défilement
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    if (!drag.active && performance.now() - drag.lastInput > 2500) drag.target *= 0.97;
    drag.yaw += (drag.target - drag.yaw) * 0.12;
    scrollSmooth += (scrollP - scrollSmooth) * 0.08;

    const sway = reduceMotion ? 0 : Math.sin(t * 0.25) * 0.06;
    rig.rotation.y = -0.52 + mouse.x * 0.2 + drag.yaw + sway + scrollSmooth * 0.5;
    rig.rotation.x = mouse.y * 0.05;
    rig.position.y = reduceMotion ? 0 : Math.sin(t * 0.6) * 0.04;
    laptop.group.position.y = reduceMotion ? 0 : 0.06 + Math.sin(t * 0.9) * 0.035;

    floaters.forEach((f) => {
      const k = easeOutCubic(clamp01((introT - f.delay) / 1.1));
      const bob = reduceMotion ? 0 : Math.sin(t * f.speed + f.phase) * f.amp;
      const spread = (1 - k) * 1.4 + scrollSmooth * 1.6;
      f.obj.position.set(f.pos.x + f.dir.x * spread, f.pos.y + bob - (1 - k) * 0.6, f.pos.z + f.dir.z * spread);
      f.obj.rotation.set(f.rot.x + (reduceMotion ? 0 : Math.sin(t * 0.4 + f.phase) * 0.1), f.rot.y + (reduceMotion ? 0 : t * f.spin), f.rot.z);
      f.obj.scale.setScalar(0.001 + k * 0.999);
    });

    traces.lines.material.uniforms.uTime.value = t;
    particles.material.uniforms.uTime.value = t;

    const dist = camera.userData.dist || 10;
    camera.position.set(mouse.x * 0.35, 3.2 + scrollSmooth * 1.4 - mouse.y * 0.2, dist + scrollSmooth * 1.5);
    camera.lookAt(target);
  }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const minDelta = 1000 / Q.fps - 1;
    if (!reduceMotion && now - lastFrame < minDelta) { raf = requestAnimationFrame(frame); return; }
    const dt = Math.min(0.1, clock.getDelta());
    lastFrame = now;
    elapsed += dt;

    const introT = reduceMotion ? 10 : (now - started) / 1000;
    const t = reduceMotion ? 2 : elapsed;
    update(t, introT);
    renderer.render(scene, camera);
    needsRender = false;
    if (!container.classList.contains('is-3d')) container.classList.add('is-3d');

    // adaptation automatique si l'appareil peine
    if (!perfChecked && introT > 2.5) {
      perfFrames++; perfTime += dt;
      if (perfFrames >= 90) {
        perfChecked = true;
        const fps = perfFrames / perfTime;
        if (fps < 34 && tier > 0) {
          tier = 0; Q = QUALITY[0];
          renderer.setPixelRatio(1); resize();
          particles.geometry.setDrawRange(0, Math.min(QUALITY[0].particles, particles.geometry.attributes.position.count));
        }
      }
    }

    const animating = !reduceMotion || drag.active || Math.abs(drag.target - drag.yaw) > 0.001 || Math.abs(scrollP - scrollSmooth) > 0.001;
    if (animating || needsRender) raf = requestAnimationFrame(frame);
  }

  // pause hors écran / onglet caché
  const io = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    if (visible) { clock.getDelta(); invalidate(); }
  }, { threshold: 0 });
  io.observe(container);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { clock.getDelta(); invalidate(); } });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); container.classList.remove('is-3d'); cancelAnimationFrame(raf); raf = 0; visible = false;
  });

  const startNow = () => { started = performance.now(); clock.getDelta(); resize(); invalidate(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(startNow); else startNow();

  return { renderer, scene, camera };
}
