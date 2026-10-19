/* =========================================================
   Momo Tech : briques 3D partagées (Three.js)
   Tous les objets sont construits par code : aucun modèle externe,
   donc aucune licence tierce hormis celle de Three.js (MIT).
   ========================================================= */
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/addons/RoundedBoxGeometry.js';

export const PALETTE = {
  electric: 0x2f86ff,
  hi: 0x7cc4ff,
  night: 0x050c1a,
};

/* Niveau de qualité selon l'appareil : 0 = économe, 1 = moyen, 2 = élevé */
export function detectTier() {
  const cores = navigator.hardwareConcurrency || 4;
  const mem = navigator.deviceMemory || 4;
  const conn = navigator.connection || {};
  const small = Math.min(window.innerWidth, window.innerHeight) < 700;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (conn.saveData || (cores <= 2) || mem <= 2) return 0;
  if (small || coarse || cores <= 4 || mem <= 4) return 1;
  return 2;
}

export function rbox(w, h, d, r = 0.03, seg = 3) {
  const radius = Math.max(0.0005, Math.min(r, Math.min(w, h, d) / 2 - 0.0005));
  return new RoundedBoxGeometry(w, h, d, seg, radius);
}

export function makeMaterials() {
  return {
    alu: new THREE.MeshStandardMaterial({ color: 0x4a566b, metalness: 0.9, roughness: 0.3 }),
    aluDark: new THREE.MeshStandardMaterial({ color: 0x232c3c, metalness: 0.85, roughness: 0.38 }),
    key: new THREE.MeshStandardMaterial({ color: 0x0b1018, metalness: 0.25, roughness: 0.6 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x020409, metalness: 0.5, roughness: 0.06 }),
    glow: new THREE.MeshStandardMaterial({ color: 0x0a2550, emissive: PALETTE.electric, emissiveIntensity: 1.8, metalness: 0.2, roughness: 0.4 }),
    glowSoft: new THREE.MeshBasicMaterial({ color: PALETTE.electric, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd2a85a, metalness: 1, roughness: 0.32 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xa8b4c6, metalness: 1, roughness: 0.22 }),
    chip: new THREE.MeshStandardMaterial({ color: 0x0c0f16, metalness: 0.35, roughness: 0.45 }),
    pcbBlue: new THREE.MeshStandardMaterial({ color: 0x0d2a52, metalness: 0.35, roughness: 0.5 }),
    white: new THREE.MeshStandardMaterial({ color: 0xe8f0ff, metalness: 0.1, roughness: 0.4 }),
  };
}

export function addStudioLights(scene, strength = 1) {
  scene.add(new THREE.HemisphereLight(0xbcd8ff, 0x050a14, 0.9 * strength));
  const key = new THREE.DirectionalLight(0xffffff, 2.4 * strength);
  key.position.set(3, 6, 5);
  scene.add(key);
  const rim = new THREE.PointLight(PALETTE.electric, 30 * strength, 14, 2);
  rim.position.set(-3.5, 2.5, -3);
  scene.add(rim);
  const under = new THREE.PointLight(PALETTE.hi, 10 * strength, 8, 2);
  under.position.set(2.5, -1, 2.5);
  scene.add(under);
  return { key, rim, under };
}

/* Texture radiale (halo, ombre de contact) */
export function radialTexture(inner = 'rgba(0,0,0,0.75)', outer = 'rgba(0,0,0,0)', size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grd.addColorStop(0, inner);
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Ordinateur portable paramétrable */
export function makeLaptop(mats, { W = 3.2, D = 2.2, H = 0.12, lidH = 2.1, screenMap = null, keys = true, logo = true } = {}) {
  const group = new THREE.Group();

  const base = new THREE.Mesh(rbox(W, H, D, 0.06, 4), mats.alu);
  base.position.y = H / 2;
  group.add(base);

  if (keys) {
    // rétroéclairage visible entre les touches
    const back = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.84, D * 0.47), mats.glowSoft.clone());
    back.material.opacity = 0.22;
    back.rotation.x = -Math.PI / 2;
    back.position.set(0, H + 0.002, -D * 0.2);
    group.add(back);

    const cols = 13, rows = 5, pitch = (W * 0.82) / cols, kw = pitch * 0.82;
    const keyGeo = rbox(kw, 0.035, kw, 0.02, 2);
    const count = cols * (rows - 1) + 8 + 1;
    const inst = new THREE.InstancedMesh(keyGeo, mats.key, count);
    const m = new THREE.Matrix4();
    let i = 0;
    const z0 = -D * 0.42;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === rows - 1 && c >= 4 && c <= 8) continue;
        m.makeTranslation((c - (cols - 1) / 2) * pitch, H + 0.018, z0 + r * pitch);
        inst.setMatrixAt(i++, m);
      }
    }
    // barre d'espace
    m.makeScale(pitch * 4.8 / kw, 1, 1).premultiply(new THREE.Matrix4().makeTranslation(0, H + 0.018, z0 + (rows - 1) * pitch));
    inst.setMatrixAt(i++, m);
    inst.count = i;
    group.add(inst);

    const pad = new THREE.Mesh(rbox(W * 0.34, 0.01, D * 0.28, 0.02), mats.aluDark);
    pad.position.set(0, H + 0.002, D * 0.27);
    group.add(pad);
  }

  const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, W * 0.86, 16), mats.aluDark);
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, H + 0.01, -D / 2 + 0.05);
  group.add(hinge);

  const lid = new THREE.Group();
  lid.position.set(0, H, -D / 2 + 0.05);
  group.add(lid);

  const shell = new THREE.Mesh(rbox(W, lidH, 0.07, 0.05, 4), mats.alu);
  shell.position.set(0, lidH / 2, -0.035);
  lid.add(shell);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.08, lidH - 0.08), mats.glass);
  glass.position.set(0, lidH / 2, 0.0015);
  lid.add(glass);

  let screen = null;
  if (screenMap) {
    screen = new THREE.Mesh(
      new THREE.PlaneGeometry(W - 0.26, (W - 0.26) * 9 / 16),
      new THREE.MeshBasicMaterial({ map: screenMap, toneMapped: false })
    );
    screen.position.set(0, lidH / 2 + 0.03, 0.003);
    lid.add(screen);
  }

  if (logo) {
    const emblem = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: logoTexture(), transparent: true, toneMapped: false }));
    emblem.position.set(0, lidH / 2, -0.0715);
    emblem.rotation.y = Math.PI;
    lid.add(emblem);
  }

  return { group, lid, screen };
}

/* Emblème Momo Tech (dos de l'écran) */
export function logoTexture() {
  const s = 256, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  g.shadowColor = '#2f86ff'; g.shadowBlur = 28;
  g.fillStyle = '#9fd4ff';
  const bar = (x, y, w, h) => { g.fillRect(x, y, w, h); };
  bar(58, 64, 22, 128); bar(176, 64, 22, 128);
  g.fillStyle = '#ffffff'; bar(117, 64, 22, 78);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* Engrenage extrudé */
export function gearGeometry(teeth = 12, rOuter = 1, rRoot = 0.82, rHole = 0.3, depth = 0.25) {
  const shape = new THREE.Shape();
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [rRoot, a], [rOuter, a + step * 0.18], [rOuter, a + step * 0.48], [rRoot, a + step * 0.66],
    ];
    pts.forEach(([r, ang], k) => {
      const x = Math.cos(ang) * r, y = Math.sin(ang) * r;
      if (i === 0 && k === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    });
    const a2 = a + step;
    shape.lineTo(Math.cos(a2) * rRoot, Math.sin(a2) * rRoot);
  }
  const hole = new THREE.Path();
  hole.absarc(0, 0, rHole, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 2, curveSegments: 18 });
  geo.center();
  return geo;
}

/* Bouclier extrudé */
export function shieldGeometry(depth = 0.22) {
  const s = new THREE.Shape();
  s.moveTo(0, 1.05);
  s.bezierCurveTo(0.35, 0.86, 0.62, 0.8, 0.82, 0.8);
  s.bezierCurveTo(0.84, 0.1, 0.62, -0.62, 0, -1.05);
  s.bezierCurveTo(-0.62, -0.62, -0.84, 0.1, -0.82, 0.8);
  s.bezierCurveTo(-0.62, 0.8, -0.35, 0.86, 0, 1.05);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 4, curveSegments: 24 });
  geo.center();
  return geo;
}

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const clamp01 = (t) => Math.min(1, Math.max(0, t));
