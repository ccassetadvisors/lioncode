/* =====================================================================
   C&C ASSET ADVISORS — scene library
   Shared helpers + procedural textures for the WebGL world.
   Classic script (global scope) — loaded before three-scenes.js.
   ===================================================================== */

/* ---------- math ---------- */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function cnv(size = 512) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return c;
}

function asTexture(c, { repeat = null } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (repeat) t.repeat.set(repeat[0], repeat[1]);
  return t;
}

/* value-ish grain: many soft translucent dabs */
function grain(ctx, w, h, n, color, aMin, aMax, rMin, rMax) {
  for (let i = 0; i < n; i++) {
    const a = aMin + Math.random() * (aMax - aMin);
    const r = rMin + Math.random() * (rMax - rMin);
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/* ---------- wood ---------- */
function woodTexture({ base = "#caa478", dark = "#8a6440", light = "#e3c79a", vertical = false, planks = 0 } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 130; i++) {
    const p = Math.random() * S;
    const wdt = 0.6 + Math.random() * 2.4;
    x.globalAlpha = 0.05 + Math.random() * 0.16;
    x.strokeStyle = Math.random() > 0.5 ? dark : light;
    x.lineWidth = wdt;
    x.beginPath();
    if (vertical) {
      x.moveTo(p, 0);
      x.bezierCurveTo(p + (Math.random() - 0.5) * 30, S * 0.33, p + (Math.random() - 0.5) * 30, S * 0.66, p + (Math.random() - 0.5) * 20, S);
    } else {
      x.moveTo(0, p);
      x.bezierCurveTo(S * 0.33, p + (Math.random() - 0.5) * 30, S * 0.66, p + (Math.random() - 0.5) * 30, S, p + (Math.random() - 0.5) * 20);
    }
    x.stroke();
  }
  x.globalAlpha = 1;
  if (planks) {
    x.strokeStyle = "rgba(0,0,0,0.28)"; x.lineWidth = 2;
    for (let i = 1; i < planks; i++) {
      const p = (S / planks) * i;
      x.beginPath();
      if (vertical) { x.moveTo(p, 0); x.lineTo(p, S); } else { x.moveTo(0, p); x.lineTo(S, p); }
      x.stroke();
    }
  }
  grain(x, S, S, 400, "#3a2a18", 0.01, 0.05, 1, 3);
  return asTexture(c);
}

/* ---------- stone / plaster / concrete ---------- */
function stoneTexture({ base = "#e9e2d4", spot = "#d8cdb8" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  grain(x, S, S, 80, spot, 0.04, 0.12, 30, 90);
  grain(x, S, S, 600, "#bcae93", 0.01, 0.05, 1, 4);
  grain(x, S, S, 200, "#ffffff", 0.02, 0.06, 2, 6);
  return asTexture(c);
}

function plasterTexture({ base = "#f2ede2", spot = "#e7e0d1" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  grain(x, S, S, 90, spot, 0.05, 0.12, 40, 110);
  grain(x, S, S, 700, "#d9d1bf", 0.012, 0.04, 1, 4);
  grain(x, S, S, 260, "#ffffff", 0.03, 0.07, 2, 7);
  return asTexture(c);
}

/* stacked ledgestone for the fireplace */
function ledgestoneTexture({ base = "#d9d0bd" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  const tones = ["#cfc5af", "#e2dac6", "#c4b9a1", "#d3c9b3", "#ddd4c0"];
  let y = 0;
  while (y < S) {
    const rh = 18 + Math.random() * 26;
    let xx = -Math.random() * 40;
    while (xx < S) {
      const rw = 50 + Math.random() * 90;
      x.fillStyle = tones[(Math.random() * tones.length) | 0];
      x.fillRect(xx + 1.5, y + 1.5, rw - 3, rh - 3);
      x.globalAlpha = 0.25; x.fillStyle = "#fff";
      x.fillRect(xx + 1.5, y + 1.5, rw - 3, 2);
      x.globalAlpha = 1;
      xx += rw;
    }
    y += rh;
  }
  grain(x, S, S, 500, "#8d8470", 0.01, 0.05, 1, 3);
  return asTexture(c);
}

function concreteTexture({ base = "#9aa0a2" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  grain(x, S, S, 120, "#7e8587", 0.05, 0.14, 20, 80);
  grain(x, S, S, 900, "#5f6668", 0.01, 0.05, 1, 3);
  grain(x, S, S, 300, "#c3c8ca", 0.02, 0.06, 2, 5);
  x.fillStyle = "rgba(60,66,68,0.5)";
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(64 + i * 128, 64 + j * 128, 3, 0, 6.28); x.fill(); }
  return asTexture(c);
}

/* large-format exterior pavers with seam lines */
function paverTexture({ base = "#cdc6b6", seam = "rgba(90,85,72,0.4)" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  grain(x, S, S, 160, "#bfb7a4", 0.04, 0.1, 20, 70);
  grain(x, S, S, 700, "#a89f8a", 0.01, 0.04, 1, 3);
  x.strokeStyle = seam; x.lineWidth = 3;
  for (let i = 0; i <= 4; i++) {
    x.beginPath(); x.moveTo((S / 4) * i, 0); x.lineTo((S / 4) * i, S); x.stroke();
    x.beginPath(); x.moveTo(0, (S / 4) * i); x.lineTo(S, (S / 4) * i); x.stroke();
  }
  return asTexture(c);
}

/* ---------- water (pool) ---------- */
function waterTexture({ base = "#7fb9c4", deep = "#5b9aa8", light = "#cfeef2" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, base); g.addColorStop(1, deep);
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  // caustic-ish webbing
  x.strokeStyle = light;
  for (let i = 0; i < 90; i++) {
    x.globalAlpha = 0.07 + Math.random() * 0.14;
    x.lineWidth = 1 + Math.random() * 2.2;
    const px = Math.random() * S, py = Math.random() * S, r = 14 + Math.random() * 40;
    x.beginPath();
    x.arc(px, py, r, Math.random() * 6.28, Math.random() * 2 + 0.8);
    x.stroke();
  }
  x.globalAlpha = 1;
  return asTexture(c);
}

/* ---------- flat-weave rug ---------- */
function rugTexture({ base = "#e6ddc8", band = "#d3c6aa", accent = "#b3a486" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  const bands = [30, 70, 90, 410, 432, 470];
  bands.forEach((by, i) => { x.fillStyle = i % 2 ? accent : band; x.fillRect(0, by, S, i % 2 ? 8 : 16); });
  grain(x, S, S, 1400, "#c9bda2", 0.02, 0.06, 0.6, 1.6);
  return asTexture(c);
}

/* ---------- drawings ---------- */
function planTexture({ bg = "#12223a", grid = "rgba(150,180,220,0.35)", accent = "rgba(199,177,134,0.9)" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = bg; x.fillRect(0, 0, S, S);
  x.strokeStyle = grid; x.lineWidth = 1;
  for (let i = 0; i <= S; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, S); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(S, i); x.stroke(); }
  x.strokeStyle = "rgba(200,220,255,0.8)"; x.lineWidth = 2;
  const rects = [[60, 70, 150, 110], [250, 90, 180, 140], [80, 240, 120, 180], [240, 300, 200, 130]];
  rects.forEach(([rx, ry, rw, rh]) => { x.strokeRect(rx, ry, rw, rh); });
  x.strokeStyle = accent; x.lineWidth = 3;
  x.strokeRect(250, 90, 180, 140);
  x.strokeStyle = "rgba(200,220,255,0.5)"; x.lineWidth = 1;
  x.beginPath(); x.moveTo(40, 460); x.lineTo(472, 460); x.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- night skyline (seen through boardroom glass) ---------- */
function skylineTexture() {
  const W = 1024, H = 512;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0a1018"); g.addColorStop(0.62, "#101a26"); g.addColorStop(1, "#0a0e13");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // haze glow at horizon
  const hz = x.createLinearGradient(0, H * 0.45, 0, H * 0.8);
  hz.addColorStop(0, "rgba(46,62,84,0)"); hz.addColorStop(1, "rgba(64,82,104,0.5)");
  x.fillStyle = hz; x.fillRect(0, H * 0.45, W, H * 0.35);
  // towers
  let bx = -20;
  while (bx < W) {
    const bw = 36 + Math.random() * 80;
    const bh = H * (0.22 + Math.random() * 0.42);
    const by = H * 0.86 - bh;
    x.fillStyle = `rgba(${10 + Math.random() * 8 | 0},${14 + Math.random() * 10 | 0},${22 + Math.random() * 12 | 0},1)`;
    x.fillRect(bx, by, bw, bh + H * 0.2);
    // lit windows
    const cols = Math.max(2, (bw / 11) | 0), rows = Math.max(3, (bh / 13) | 0);
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (Math.random() > 0.42) continue;
      const warm = Math.random() > 0.45;
      x.fillStyle = warm ? `rgba(255,214,150,${0.25 + Math.random() * 0.6})` : `rgba(170,200,230,${0.18 + Math.random() * 0.45})`;
      x.fillRect(bx + 4 + i * (bw - 8) / cols, by + 5 + j * bh / rows, 3.4, 4.6);
    }
    bx += bw + 4 + Math.random() * 18;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- sprites & particles ---------- */
function radialSprite(color = "rgba(255,225,170,1)") {
  const S = 128, c = cnv(S), x = c.getContext("2d");
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, color); g.addColorStop(1, "rgba(255,225,170,0)");
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function makeMotes(count, spread, color, size) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread.x;
    pos[i * 3 + 1] = Math.random() * spread.y;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
  }
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, map: radialSprite("rgba(255,255,255,1)"), sizeAttenuation: true });
  const pts = new THREE.Points(g, m);
  pts.userData.spin = 0.02 + Math.random() * 0.03;
  return pts;
}

/* ---------- small builders ---------- */
function shadowAll(obj) {
  obj.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return obj;
}

/* tapered mid-century leg (slightly splayed) */
function mcLeg(mat, h = 0.55, r1 = 0.055, r2 = 0.028, tilt = 0.1, dirX = 1, dirZ = 1) {
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, 10), mat);
  leg.rotation.z = tilt * dirX;
  leg.rotation.x = -tilt * dirZ;
  leg.castShadow = true;
  return leg;
}
