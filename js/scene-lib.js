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

/* honed luxury marble — soft cloudy field with meandering veins + faint gold
   (Calacatta-ish). Pair with a low-roughness physical material for polish. */
function marbleTexture({ base = "#efe9da", vein = "#b3a78f", gold = "#caa978" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  // cloudy mottling
  for (let i = 0; i < 42; i++) {
    x.globalAlpha = 0.04 + Math.random() * 0.05;
    x.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#e2dac6";
    x.beginPath();
    x.ellipse(Math.random() * S, Math.random() * S, 40 + Math.random() * 120, 30 + Math.random() * 90, Math.random() * 6, 0, 6.28);
    x.fill();
  }
  x.globalAlpha = 1;
  const streak = (col, w, alpha) => {
    x.strokeStyle = col; x.lineWidth = w; x.globalAlpha = alpha;
    let px = Math.random() * S, py = -10;
    x.beginPath(); x.moveTo(px, py);
    while (py < S + 10) { px += (Math.random() - 0.5) * 72; py += 12 + Math.random() * 22; x.lineTo(px, py); }
    x.stroke(); x.globalAlpha = 1;
  };
  for (let i = 0; i < 7; i++) streak(vein, 0.6 + Math.random() * 1.6, 0.2 + Math.random() * 0.2);
  for (let i = 0; i < 3; i++) streak(gold, 0.5 + Math.random(), 0.15);
  for (let i = 0; i < 14; i++) streak(vein, 0.4, 0.09);
  grain(x, S, S, 300, "#ffffff", 0.01, 0.04, 1, 3);
  return asTexture(c);
}

/* plush fur / sheepskin — a dense field of fine, softly-flowing strands over a
   tonal underlayer. Use as map + bumpMap on a matte material for real pile. */
function furTexture({ base = "#ece4d2", light = "#f8f3e6", dark = "#cfc4ab" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 130; i++) {
    x.globalAlpha = 0.04 + Math.random() * 0.05; x.fillStyle = dark;
    x.beginPath(); x.ellipse(Math.random() * S, Math.random() * S, 8 + Math.random() * 22, 4 + Math.random() * 10, Math.random() * 6, 0, 6.28); x.fill();
  }
  x.globalAlpha = 1; x.lineCap = "round";
  for (let i = 0; i < 2800; i++) {
    const sx = Math.random() * S, sy = Math.random() * S;
    const len = 6 + Math.random() * 16, ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.1;
    const r = Math.random();
    x.strokeStyle = r > 0.55 ? light : r > 0.25 ? base : dark;
    x.globalAlpha = 0.22 + Math.random() * 0.5; x.lineWidth = 0.6 + Math.random() * 0.9;
    x.beginPath(); x.moveTo(sx, sy);
    x.quadraticCurveTo(sx + Math.cos(ang) * len * 0.5 + (Math.random() - 0.5) * 5, sy + Math.sin(ang) * len * 0.5, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len);
    x.stroke();
  }
  x.globalAlpha = 1;
  return asTexture(c);
}

/* high-end flat rug: a dark tonal field with a fine geometric lattice, gold
   nodes, and a refined double gold border (maps once across the rug) */
function luxRugTexture({ base = "#2f2b25", tone = "#3b362d", gold = "#b89653" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) {
    x.globalAlpha = 0.05 + Math.random() * 0.06; x.fillStyle = Math.random() > 0.5 ? tone : "#000000";
    x.beginPath(); x.ellipse(Math.random() * S, Math.random() * S, 40 + Math.random() * 120, 30 + Math.random() * 90, Math.random() * 6, 0, 6.28); x.fill();
  }
  x.globalAlpha = 1;
  const step = S / 8;
  x.strokeStyle = tone; x.lineWidth = 2; x.globalAlpha = 0.6;
  for (let i = -8; i <= 8; i++) {
    x.beginPath(); x.moveTo(i * step, 0); x.lineTo(i * step + S, S); x.stroke();
    x.beginPath(); x.moveTo(i * step, 0); x.lineTo(i * step - S, S); x.stroke();
  }
  x.globalAlpha = 1;
  x.fillStyle = gold; x.globalAlpha = 0.55;
  for (let gx = 0; gx <= S; gx += step) for (let gy = 0; gy <= S; gy += step) {
    x.save(); x.translate(gx, gy); x.rotate(Math.PI / 4); x.fillRect(-3.5, -3.5, 7, 7); x.restore();
  }
  x.globalAlpha = 1;
  x.strokeStyle = gold; x.globalAlpha = 0.9; x.lineWidth = 7; x.strokeRect(15, 15, S - 30, S - 30);
  x.globalAlpha = 0.5; x.lineWidth = 2; x.strokeRect(28, 28, S - 56, S - 56);
  x.globalAlpha = 1;
  grain(x, S, S, 600, "#000000", 0.01, 0.03, 1, 2);
  return asTexture(c);
}

/* refined plush rug: a soft tone-on-tone marbled field with sparse gold threads
   and a slim double gold border — elegant, not loud */
function modernRugTexture({ base = "#cabfa6", ink = "#b3a888", accent = "#a3863f" } = {}) {
  const S = 512, c = cnv(S), x = c.getContext("2d");
  x.fillStyle = base; x.fillRect(0, 0, S, S);
  // subtle cloudy mottling, tone-on-tone
  for (let i = 0; i < 60; i++) {
    x.globalAlpha = 0.05 + Math.random() * 0.06;
    x.fillStyle = Math.random() > 0.5 ? ink : "#ffffff";
    x.beginPath();
    x.ellipse(Math.random() * S, Math.random() * S, 30 + Math.random() * 110, 24 + Math.random() * 80, Math.random() * 6, 0, 6.28);
    x.fill();
  }
  x.globalAlpha = 1;
  // faint meandering gold threads
  x.strokeStyle = accent;
  for (let i = 0; i < 5; i++) {
    x.globalAlpha = 0.1 + Math.random() * 0.06; x.lineWidth = 0.8 + Math.random();
    let px = Math.random() * S, py = -10; x.beginPath(); x.moveTo(px, py);
    while (py < S + 10) { px += (Math.random() - 0.5) * 60; py += 14 + Math.random() * 22; x.lineTo(px, py); }
    x.stroke();
  }
  x.globalAlpha = 1;
  grain(x, S, S, 1200, "#000000", 0.006, 0.02, 1, 2);
  grain(x, S, S, 500, "#ffffff", 0.015, 0.04, 1, 3);
  // slim double gold border
  x.strokeStyle = accent; x.globalAlpha = 0.5; x.lineWidth = 4; x.strokeRect(16, 16, S - 32, S - 32);
  x.globalAlpha = 0.3; x.lineWidth = 1.5; x.strokeRect(26, 26, S - 52, S - 52);
  x.globalAlpha = 1;
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

/* =====================================================================
   FOLIAGE — faceted low-poly greenery (no textures)
   Flat-shaded, jittered icosahedra read as leafy masses far better than
   smooth spheres. A handful of shared clump geometries + reusable
   materials are scaled/rotated per instance, so a whole garden stays cheap.
   ===================================================================== */
let _clumpGeos = null;
function clumpGeos() {
  if (_clumpGeos) return _clumpGeos;
  _clumpGeos = [];
  for (let n = 0; n < 6; n++) {
    const g = new THREE.IcosahedronGeometry(1, 1);   // 80 facets → fine, leafy grain (not crystalline)
    const p = g.attributes.position, j = 0.18;
    for (let i = 0; i < p.count; i++) {
      p.setXYZ(i, p.getX(i) * (1 + (Math.random() - 0.5) * j),
                  p.getY(i) * (1 + (Math.random() - 0.5) * j),
                  p.getZ(i) * (1 + (Math.random() - 0.5) * j));
    }
    g.computeVertexNormals();
    _clumpGeos.push(g);
  }
  return _clumpGeos;
}
function clumpGeo() { const a = clumpGeos(); return a[(Math.random() * a.length) | 0]; }

/* build a small set of flat-shaded leaf materials from hex colours */
function foliagePalette(cols) {
  return cols.map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }));
}
// ordered dark (shadowed underside) → light (sunlit top), used as a gradient
let _greens = null, _bark = null;
function greenPalette() {
  return _greens || (_greens = foliagePalette([0x39431f, 0x47542c, 0x556335, 0x66753f, 0x7a8a4d, 0x90a05c]));
}
function barkMat() {
  return _bark || (_bark = new THREE.MeshStandardMaterial({ color: 0x6a5439, roughness: 1, flatShading: true }));
}
const _clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

/* one leafy clump of approx. radius r (optionally a specific material) */
function foliageClump(r, palette, mat) {
  const pal = palette || greenPalette();
  const m = new THREE.Mesh(clumpGeo(), mat || pal[(Math.random() * pal.length) | 0]);
  m.scale.set(r, r * (0.82 + Math.random() * 0.3), r);
  m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  m.castShadow = true;
  return m;
}

/* full-canopy shade tree: flared trunk, branches, and a layered crown that is
   darker/cooler underneath and lighter on top — fakes a sun direction so it
   reads as foliage rather than a faceted ball. */
function makeTree({ h = 7.5, trunkR = 0.42, crownR = 2.6, clumps = 18, palette } = {}) {
  const pal = palette || greenPalette();
  const g = new THREE.Group();
  const lean = (Math.random() - 0.5) * 0.06;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(trunkR * 0.46, trunkR, h, 9), barkMat());
  trunk.position.y = h * 0.5; trunk.rotation.z = lean; trunk.castShadow = true; g.add(trunk);
  const flare = new THREE.Mesh(new THREE.CylinderGeometry(trunkR, trunkR * 1.8, h * 0.18, 9), barkMat());
  flare.position.y = h * 0.09; flare.castShadow = true; g.add(flare);
  for (let b = 0; b < 4; b++) {
    const a = (b / 4) * Math.PI * 2 + Math.random();
    const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06, trunkR * 0.55, crownR * 1.1, 6), barkMat());
    br.position.set(Math.cos(a) * crownR * 0.34, h * 0.7, Math.sin(a) * crownR * 0.34);
    br.rotation.z = Math.cos(a) * -0.8; br.rotation.x = Math.sin(a) * 0.8;
    br.castShadow = true; g.add(br);
  }
  const baseY = h * 0.84, domeH = crownR * 1.55;
  for (let i = 0; i < clumps; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.sqrt(Math.random());
    const rad = crownR * (0.18 + 0.86 * rr);
    const cy = baseY + (1 - rr) * domeH * 0.62 + (Math.random() - 0.5) * crownR * 0.35;
    const hf = _clamp((cy - baseY) / domeH + 0.12, 0, 1);
    const idx = _clamp(Math.round(hf * (pal.length - 1) + (Math.random() - 0.5)), 0, pal.length - 1);
    const c = foliageClump(crownR * (0.34 + Math.random() * 0.4), pal, pal[idx]);
    c.position.set(Math.cos(a) * rad + lean * cy, cy, Math.sin(a) * rad * 0.92);
    g.add(c);
  }
  return g;
}

/* slender Italian-cypress column (fat middle, tapered ends) */
function makeCypress({ h = 6, r = 0.8, palette } = {}) {
  const pal = palette || greenPalette();
  const g = new THREE.Group();
  const segs = Math.max(6, Math.round(h / 0.6));
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const cr = Math.max(0.16, r * (1 - Math.pow(Math.abs(t - 0.4) / 0.6, 1.7) * 0.85));
    const idx = _clamp(Math.round(t * (pal.length - 1)), 0, pal.length - 1);
    const c = foliageClump(cr, pal, pal[idx]);
    c.position.set((Math.random() - 0.5) * 0.16, 0.4 + t * h, (Math.random() - 0.5) * 0.16);
    c.scale.x *= 0.78; c.scale.z *= 0.78;
    g.add(c);
  }
  return g;
}

/* mounded shrub / boxwood — darker at the base, lighter on top */
function makeShrub({ r = 0.9, palette } = {}) {
  const pal = palette || greenPalette();
  const g = new THREE.Group();
  const n = 5 + (Math.random() * 4 | 0);
  for (let i = 0; i < n; i++) {
    const cr = r * (0.45 + Math.random() * 0.45);
    const y = cr * 0.55 + Math.random() * r * 0.5;
    const hf = _clamp(y / (r * 1.1), 0, 1);
    const idx = _clamp(Math.round(hf * (pal.length - 1) + (Math.random() - 0.5)), 0, pal.length - 1);
    const c = foliageClump(cr, pal, pal[idx]);
    c.position.set((Math.random() - 0.5) * r * 1.25, y, (Math.random() - 0.5) * r * 1.25);
    c.scale.y *= 0.82;
    g.add(c);
  }
  return g;
}

/* ornamental grass tuft — thin blades fanning from a point */
function makeGrassTuft({ h = 1.2, blades = 8, color = 0x8a9356 } = {}) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true });
  for (let i = 0; i < blades; i++) {
    const bh = h * (0.6 + Math.random() * 0.6);
    const bl = new THREE.Mesh(new THREE.ConeGeometry(0.055, bh, 4), mat);
    const a = Math.random() * Math.PI * 2, rr = Math.random() * 0.22;
    bl.position.set(Math.cos(a) * rr, bh * 0.5, Math.sin(a) * rr);
    bl.rotation.z = (Math.random() - 0.5) * 0.5; bl.rotation.x = (Math.random() - 0.5) * 0.5;
    bl.castShadow = true; g.add(bl);
  }
  return g;
}

/* faceted boulder */
function makeBoulder({ r = 0.7, color = 0x8d8a82 } = {}) {
  const m = new THREE.Mesh(clumpGeo(), new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true }));
  m.scale.set(r, r * (0.6 + Math.random() * 0.3), r * (0.8 + Math.random() * 0.3));
  m.rotation.y = Math.random() * Math.PI;
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
