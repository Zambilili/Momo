/* =========================================================
   Momo Tech : illustrations 3D des services
   Un seul contexte WebGL partagé dessine chaque petite scène,
   puis l'image est copiée dans le <canvas> 2D de chaque carte.
   Animation uniquement pour les cartes visibles, pause sinon.
   ========================================================= */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/addons/RoomEnvironment.js';
import {
  PALETTE, detectTier, rbox, makeMaterials, addStudioLights, makeLaptop, gearGeometry, shieldGeometry,
} from './scene-kit.js';

const SIZE = 220; // taille CSS max d'une illustration

function baseScene() {
  const scene = new THREE.Scene();
  addStudioLights(scene, 0.8);
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
  camera.position.set(0, 1.1, 5.2);
  camera.lookAt(0, 0, 0);
  const root = new THREE.Group();
  scene.add(root);
  return { scene, camera, root };
}

const BUILDERS = {
  repair(m) {
    const s = baseScene();
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x1b5fd6, toneMapped: false });
    const lap = makeLaptop(m, { W: 2, D: 1.4, H: 0.08, lidH: 1.3, keys: true, logo: false });
    lap.lid.rotation.x = -0.25;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), screenMat);
    scr.position.set(0, 0.66, 0.004); lap.lid.add(scr);
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.05), new THREE.MeshBasicMaterial({ color: 0xbfe4ff, toneMapped: false, transparent: true, opacity: 0.9 }));
    scan.position.z = 0.006; lap.lid.add(scan);
    lap.group.position.set(-0.2, -0.55, 0);
    s.root.add(lap.group);
    const tool = new THREE.Group();
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.6, 18), m.glow); handle.position.y = 0.3; tool.add(handle);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 10), m.steel); shaft.position.y = -0.35; tool.add(shaft);
    tool.position.set(1.15, 0.45, 0.6); tool.rotation.z = -0.7;
    s.root.add(tool);
    s.root.rotation.y = -0.45;
    s.tick = (t, h) => {
      scan.position.y = 0.16 + ((t * 0.5) % 1) * 1.0;
      tool.position.y = 0.45 + Math.sin(t * 1.6) * 0.08;
      tool.rotation.y = t * (1 + h * 2);
      s.root.rotation.y = -0.45 + Math.sin(t * 0.5) * 0.18;
    };
    return s;
  },

  install(m) {
    const s = baseScene();
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 0.05, 64, 1, false),
      new THREE.MeshPhysicalMaterial({ color: 0xcfd8e6, metalness: 1, roughness: 0.15, iridescence: 1, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 600] })
    );
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.07, 32), m.chip);
    const group = new THREE.Group(); group.add(disc, hub);
    group.rotation.set(1.15, 0, 0.25); group.position.set(-0.35, -0.2, 0);
    s.root.add(group);
    const win = new THREE.Group();
    const panel = new THREE.Mesh(rbox(1.3, 0.85, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x0a1d3d, metalness: 0.3, roughness: 0.3, transparent: true, opacity: 0.92 }));
    win.add(panel);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.12, 0.06), m.glow); bar.position.y = 0.36; win.add(bar);
    [0.12, -0.04].forEach((y, i) => { const l = new THREE.Mesh(new THREE.BoxGeometry(i ? 0.6 : 0.9, 0.05, 0.06), m.white); l.position.set(i ? -0.25 : -0.1, y, 0.01); win.add(l); });
    const track = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.06), m.chip); track.position.y = -0.25; win.add(track);
    const prog = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.07, 0.07), m.glow); prog.position.y = -0.25; win.add(prog);
    win.position.set(0.75, 0.55, 0.3); win.rotation.y = -0.35;
    s.root.add(win);
    s.tick = (t, h) => {
      disc.rotation.y = hub.rotation.y = t * (1.2 + h * 3);
      const p = (t * 0.25) % 1;
      prog.scale.x = Math.max(0.02, p); prog.position.x = -0.5 + p * 0.5;
      win.position.y = 0.55 + Math.sin(t * 1.1) * 0.06;
    };
    return s;
  },

  maintenance(m) {
    const s = baseScene();
    const big = new THREE.Mesh(gearGeometry(14, 0.95, 0.8, 0.28, 0.24), m.steel);
    const small = new THREE.Mesh(gearGeometry(9, 0.6, 0.47, 0.17, 0.24), m.glow);
    big.position.set(-0.45, 0.05, 0);
    small.position.set(0.98, -0.42, 0.05);
    s.root.add(big, small);
    s.root.rotation.set(-0.35, -0.4, 0);
    s.tick = (t, h) => {
      const sp = 0.5 + h * 1.5;
      big.rotation.z = t * sp;
      small.rotation.z = -t * sp * (14 / 9) + 0.18;
      s.root.rotation.y = -0.4 + Math.sin(t * 0.5) * 0.2;
    };
    return s;
  },

  software(m) {
    const s = baseScene();
    const layers = [0, 1, 2].map((i) => {
      const l = new THREE.Mesh(rbox(1.5, 0.1, 1.5, 0.05), i === 2 ? m.glow : m.pcbBlue);
      s.root.add(l); return l;
    });
    const arrow = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 14), m.white); stem.position.y = 0.3; arrow.add(stem);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 20), m.white); head.rotation.x = Math.PI; arrow.add(head);
    s.root.add(arrow);
    s.root.rotation.set(0.45, 0.7, 0);
    s.tick = (t, h) => {
      const gap = 0.24 + Math.sin(t * 1.2) * 0.06 + h * 0.1;
      layers.forEach((l, i) => { l.position.y = -0.55 + i * gap; });
      arrow.position.y = 0.9 + ((t * 0.6) % 1) * -0.35;
      s.root.rotation.y = 0.7 + t * 0.25;
    };
    return s;
  },

  security(m) {
    const s = baseScene();
    const shield = new THREE.Mesh(shieldGeometry(0.2), new THREE.MeshStandardMaterial({ color: 0x0f3270, emissive: PALETTE.electric, emissiveIntensity: 0.55, metalness: 0.7, roughness: 0.25 }));
    shield.scale.setScalar(0.95);
    s.root.add(shield);
    const check = new THREE.Group();
    const a = new THREE.Mesh(rbox(0.42, 0.12, 0.08, 0.04), m.white); a.position.set(-0.17, -0.08, 0); a.rotation.z = -0.8;
    const b = new THREE.Mesh(rbox(0.75, 0.12, 0.08, 0.04), m.white); b.position.set(0.14, 0.05, 0); b.rotation.z = 0.9;
    check.add(a, b); check.position.z = 0.2; s.root.add(check);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.02, 8, 90), m.glow);
    ring.rotation.x = 1.25; s.root.add(ring);
    s.tick = (t, h) => {
      s.root.rotation.y = Math.sin(t * 0.7) * 0.45;
      ring.rotation.z = t * (0.6 + h * 2);
      shield.material.emissiveIntensity = 0.45 + Math.sin(t * 2) * 0.15 + h * 0.5;
    };
    return s;
  },

  data(m) {
    const s = baseScene();
    const drive = new THREE.Group();
    drive.add(new THREE.Mesh(rbox(1.7, 0.22, 1.2, 0.06), m.aluDark));
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.03, 48), m.steel); platter.position.set(-0.3, 0.12, 0); drive.add(platter);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.03, 0.06), m.gold); arm.position.set(0.25, 0.14, 0.2); arm.rotation.y = 0.6; drive.add(arm);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.02), m.glow); led.position.set(0.6, 0, 0.61); drive.add(led);
    drive.position.y = -0.55; drive.rotation.x = 0.35;
    s.root.add(drive);
    const N = 40, pos = new Float32Array(N * 3), seeds = [];
    for (let i = 0; i < N; i++) seeds.push(Math.random());
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dots = new THREE.Points(geo, new THREE.PointsMaterial({ color: PALETTE.hi, size: 0.09, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
    s.root.add(dots);
    s.root.rotation.y = -0.4;
    s.tick = (t, h) => {
      platter.rotation.y = t * (3 + h * 6);
      for (let i = 0; i < N; i++) {
        const k = (t * (0.35 + seeds[i] * 0.3) + seeds[i]) % 1;
        const lane = (i % 4) - 1.5;
        pos[i * 3] = -0.3 + lane * 0.18 + Math.sin(k * 6 + i) * 0.05;
        pos[i * 3 + 1] = -0.35 + k * 1.7;
        pos[i * 3 + 2] = Math.cos(i) * 0.15;
      }
      geo.attributes.position.needsUpdate = true;
      s.root.rotation.y = -0.4 + Math.sin(t * 0.5) * 0.25;
    };
    return s;
  },

  assist(m) {
    const s = baseScene();
    const c = document.createElement('canvas'); c.width = 256; c.height = 160;
    const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const mon = new THREE.Group();
    mon.add(new THREE.Mesh(rbox(2.0, 1.25, 0.08, 0.05), m.alu));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.86, 1.11), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    scr.position.z = 0.042; mon.add(scr);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.06), m.aluDark); neck.position.set(0, -0.85, -0.05); mon.add(neck);
    const foot = new THREE.Mesh(rbox(0.8, 0.05, 0.45, 0.02), m.aluDark); foot.position.set(0, -1.1, 0); mon.add(foot);
    mon.position.y = 0.25; mon.scale.setScalar(0.95);
    s.root.add(mon);
    s.root.rotation.y = -0.35;
    let last = -1;
    s.tick = (t, h) => {
      if (t - last > 1 / 15) {
        last = t;
        g.fillStyle = '#061428'; g.fillRect(0, 0, 256, 160);
        g.strokeStyle = 'rgba(124,196,255,.12)';
        for (let x = 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 160); g.stroke(); }
        g.beginPath();
        for (let x = 0; x <= 256; x += 4) {
          const ph = x / 256 * Math.PI * 4 - t * 4;
          const beat = Math.exp(-Math.pow(((x / 256 + t * 0.35) % 1) - 0.5, 2) * 200) * 40;
          const y = 85 + Math.sin(ph) * 8 - beat;
          x ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = '#7cc4ff'; g.lineWidth = 3; g.shadowColor = '#2f86ff'; g.shadowBlur = 10; g.stroke(); g.shadowBlur = 0; g.lineWidth = 1;
        g.fillStyle = '#5dff9c'; g.font = '600 16px monospace'; g.fillText('OK', 220, 24);
        tex.needsUpdate = true;
      }
      s.root.rotation.y = -0.35 + Math.sin(t * 0.5) * 0.2 + h * 0.15;
    };
    return s;
  },
};

export function initServiceIcons(cards, { reduceMotion = false } = {}) {
  if (!cards.length) return;
  const tier = detectTier();
  const dpr = Math.min(window.devicePixelRatio || 1, tier === 2 ? 2 : 1.5);
  const px = Math.round(SIZE * dpr);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (e) { return; }
  renderer.setPixelRatio(1);
  renderer.setSize(px, px, false);
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // reflets d'environnement : indispensables pour que le métal ne paraisse pas noir
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const mats = makeMaterials();
  const items = cards.map((card) => {
    const type = card.getAttribute('data-icon3d');
    const build = BUILDERS[type];
    const wrap = card.querySelector('.service-icon');
    const canvas = card.querySelector('.service-canvas');
    if (!build || !canvas) return null;
    const s = build(mats);
    s.scene.environment = envMap;
    s.scene.environmentIntensity = 0.8;
    const item = { card, wrap, canvas, ctx: canvas.getContext('2d'), s, visible: false, hover: 0, hoverT: 0, t: Math.random() * 10 };
    card.addEventListener('pointerenter', () => { item.hoverT = 1; kick(); });
    card.addEventListener('pointerleave', () => { item.hoverT = 0; kick(); });
    card.addEventListener('focusin', () => { item.hoverT = 1; kick(); });
    card.addEventListener('focusout', () => { item.hoverT = 0; kick(); });
    return item;
  }).filter(Boolean);

  function draw(item) {
    const r = item.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (item.canvas.width !== w || item.canvas.height !== h) { item.canvas.width = w; item.canvas.height = h; }
    const size = Math.min(px, Math.max(w, h));
    renderer.setSize(size, size, false);
    item.s.camera.aspect = 1; item.s.camera.updateProjectionMatrix();
    item.s.tick(item.t, item.hover);
    renderer.render(item.s.scene, item.s.camera);
    item.ctx.clearRect(0, 0, w, h);
    const side = Math.min(w, h);
    item.ctx.drawImage(renderer.domElement, (w - side) / 2, (h - side) / 2, side, side);
    if (!item.wrap.classList.contains('is-3d')) item.wrap.classList.add('is-3d');
  }

  // Économie : en mouvement réduit ou sur appareil modeste, image fixe (animée seulement au survol hors mouvement réduit)
  const staticMode = reduceMotion || tier === 0;
  let raf = 0, last = 0;
  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    const dt = Math.min(0.1, (now - (last || now)) / 1000);
    if (now - last < 32) { raf = requestAnimationFrame(loop); return; } // ~30 i/s suffisent
    last = now;
    let any = false;
    items.forEach((it) => {
      if (!it.visible) return;
      it.hover += (it.hoverT - it.hover) * 0.1;
      const moving = !reduceMotion && (!staticMode || it.hover > 0.01);
      if (moving) { it.t += dt; draw(it); any = true; }
    });
    if (any) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && !reduceMotion) { last = 0; raf = requestAnimationFrame(loop); } }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      const it = items.find((i) => i.card === en.target);
      if (!it) return;
      it.visible = en.isIntersecting;
      if (it.visible && !it.wrap.classList.contains('is-3d')) draw(it); // première image
    });
    kick();
  }, { rootMargin: '100px 0px' });
  items.forEach((it) => io.observe(it.card));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) kick(); });
  window.addEventListener('resize', () => items.forEach((it) => it.visible && draw(it)), { passive: true });
}
