/* =====================================================================
   C&C ASSET ADVISORS — WebGL world engine
   One renderer, four scenes (hero + three division "rooms"), driven by
   scroll progress + pointer parallax. Built from primitives + procedural
   materials (see scene-lib.js) so it loads instantly and degrades
   gracefully. Uses the global THREE (UMD build).
   ===================================================================== */

/* Prefilterable environment: a 2:1 equirect canvas (sky → horizon → ground,
   with an optional soft sun) fed to the renderer's PMREM generator for
   image-based lighting. Approximates each room's surrounding luminance so
   reflective surfaces (metal, glass, water, polished stone) pick up on-palette
   reflections instead of rendering flat. */
function equirectEnv({ top, horizon, bottom, sun, sunX = 0.5, sunY = 0.32, sunSize = 0.16 } = {}) {
  const W = 512, H = 256;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top || "#888888");
  g.addColorStop(0.5, horizon || "#aaaaaa");
  g.addColorStop(1, bottom || "#333333");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (sun) {
    const sx = sunX * W, sy = sunY * H, r = sunSize * H;
    const rg = x.createRadialGradient(sx, sy, 0, sx, sy, r);
    rg.addColorStop(0, sun); rg.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = rg; x.beginPath(); x.arc(sx, sy, r, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* =====================================================================
   HERO — abstract architecture: a sweeping colonnade of slender fins,
   gold edge-light, drifting datum lines, reflected in a dark floor.
   ===================================================================== */
function buildHero() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14110c);
  scene.fog = new THREE.FogExp2(0x14110c, 0.034);

  scene.add(new THREE.HemisphereLight(0x3a3326, 0x0a0805, 0.6));
  const key = new THREE.DirectionalLight(0xc7b186, 0.5);
  key.position.set(6, 14, 6);
  scene.add(key);

  const FLOOR_Y = -3.2;

  // ---- sweeping colonnade of slender fins
  const fins = new THREE.Group();
  const finMat = new THREE.MeshStandardMaterial({ color: 0x221c13, roughness: 0.58, metalness: 0.3 });
  const stripMat = new THREE.MeshStandardMaterial({ color: 0x171208, emissive: 0xc7b186, emissiveIntensity: 0.9, roughness: 0.5 });
  const N = 34;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1);                       // 0..1 across the field
    const x = -36 + u * 72;
    const z = -8 - Math.sin(u * Math.PI) * 16 - (i % 3) * 1.4;
    const h = 7.5 + Math.sin(u * Math.PI) * 9.5 + ((i * 7) % 4) * 0.8;
    const ry = (u - 0.5) * 0.85;                 // fins follow the curve
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.24, h, 2.6), finMat);
    fin.position.set(x, FLOOR_Y + h / 2, z);
    fin.rotation.y = ry;
    fins.add(fin);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.06, h * 0.97, 0.07), stripMat.clone());
    strip.material.emissiveIntensity = 0.45 + Math.sin(u * Math.PI) * 0.55;
    strip.position.set(x + Math.cos(ry) * 0.16, FLOOR_Y + h / 2, z + Math.sin(-ry) * 0.16 + 1.32);
    strip.rotation.y = ry;
    strip.userData.base = strip.material.emissiveIntensity;
    strip.userData.ph = i * 0.45;
    fins.add(strip);
  }
  scene.add(fins);

  // ---- floating datum lines (drifting survey lines in space)
  const datums = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const len = 26 + i * 9;
    const d = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.045, 0.045),
      new THREE.MeshBasicMaterial({ color: 0xc7b186, transparent: true, opacity: 0.32 - i * 0.04, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    d.position.set((i - 2) * 6, 2.5 + i * 2.6, -14 - i * 6);
    d.userData.ph = i * 1.7;
    d.userData.x0 = d.position.x;
    datums.add(d);
  }
  scene.add(datums);

  // ---- mirrored fins beneath a semi-transparent polished floor (fake reflection)
  const mirror = fins.clone(true);
  mirror.traverse((o) => {
    if (o.isMesh) {
      o.material = o.material.clone();
      o.material.transparent = true;
      o.material.opacity = o.material.emissiveIntensity > 0 ? 0.28 : 0.1;
      o.material.depthWrite = false;
    }
  });
  mirror.scale.y = -1;
  mirror.position.y = FLOOR_Y * 2;
  mirror.renderOrder = 1;
  scene.add(mirror);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ color: 0x0d0b08, roughness: 0.32, metalness: 0.5, transparent: true, opacity: 0.86 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.renderOrder = 2;
  scene.add(floor);

  // ---- gold horizon glow beyond the colonnade
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 30),
    new THREE.MeshBasicMaterial({ map: radialSprite("rgba(214,184,128,1)"), transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })
  );
  glow.position.set(0, 5, -64);
  scene.add(glow);

  // ---- volumetric light shafts
  const shafts = new THREE.Group();
  const shaftMat = new THREE.MeshBasicMaterial({ color: 0xc7b186, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 10; i++) {
    const h = 18 + Math.random() * 18;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5 + Math.random() * 1.5, h), shaftMat.clone());
    m.position.set((Math.random() - 0.5) * 50, h / 2 - 3, -10 - Math.random() * 32);
    m.rotation.y = (Math.random() - 0.5) * 0.5;
    m.userData.base = 0.035 + Math.random() * 0.035;
    m.userData.ph = Math.random() * 6.28;
    shafts.add(m);
  }
  scene.add(shafts);

  const motes = makeMotes(420, { x: 70, y: 26, z: 74 }, 0xc7b186, 0.09);
  motes.position.z = -14; motes.position.y = -3;
  scene.add(motes);

  const strips = [];
  fins.traverse((o) => { if (o.isMesh && o.userData.base) strips.push(o); });

  return {
    scene,
    exposure: 1.05,
    env: { top: "#241d12", horizon: "#3a2c18", bottom: "#0a0805", sun: "rgba(220,186,128,0.85)", sunX: 0.5, sunY: 0.42, sunSize: 0.24, intensity: 0.85 },
    from: { pos: [0, 1.8, 22], tgt: [0, 4.2, -12] },
    to: { pos: [4, 3.4, 10], tgt: [-3, 6, -24] },
    update(dt, t) {
      shafts.children.forEach((m) => { m.material.opacity = m.userData.base * (0.6 + 0.4 * Math.sin(t * 0.8 + m.userData.ph)); });
      strips.forEach((s) => { s.material.emissiveIntensity = s.userData.base * (0.84 + 0.16 * Math.sin(t * 0.7 + s.userData.ph)); });
      datums.children.forEach((d) => { d.position.x = d.userData.x0 + Math.sin(t * 0.1 + d.userData.ph) * 3; });
      motes.rotation.y = t * 0.012;
      motes.position.y = -3 + Math.sin(t * 0.2) * 0.4;
    }
  };
}

/* =====================================================================
   RESIDENTIAL — bright mid-century living room opening through
   floor-to-ceiling glazing onto a sunlit courtyard with a pool.
   ===================================================================== */
function buildResidential() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3eee4);
  scene.fog = new THREE.Fog(0xf3eee4, 38, 130);

  // ---- materials  (oxblood-&-gold luxury: marble, cedar, walnut, leather, gold)
  const marbleTex = marbleTexture({ base: "#e8e0d0", vein: "#736a5c", gold: "#bd8b46" }); marbleTex.repeat.set(2.2, 2.2);
  const marbleMat = new THREE.MeshPhysicalMaterial({ map: marbleTex, roughness: 0.13, metalness: 0, clearcoat: 0.92, clearcoatRoughness: 0.1, envMapIntensity: 1.2 });
  const plasterTex = plasterTexture({ base: "#cdbfa6", spot: "#bbac8f" }); plasterTex.repeat.set(2, 1);
  const wallMat = new THREE.MeshStandardMaterial({ map: plasterTex, roughness: 0.96 });
  const walnutTex = woodTexture({ base: "#4f3621", dark: "#281708", light: "#744d2d" });
  const walnutMat = new THREE.MeshStandardMaterial({ map: walnutTex, roughness: 0.34, metalness: 0.06 });
  // rich cedar for the ceiling raft + statement niche; lighter oak for the flutes
  // fluted feature wall — walnut, to match the case goods (one wood story)
  const fluteMat = new THREE.MeshStandardMaterial({ map: woodTexture({ base: "#5a3f27", dark: "#311e0f", light: "#7c5532", vertical: true }), roughness: 0.4, metalness: 0.04 });
  // soft goods — ONE upholstery tone shared by the sofa + chairs (greige bouclé)
  const upholstery = new THREE.MeshStandardMaterial({ color: 0xb4a98f, roughness: 1 });
  const upholsteryDeep = new THREE.MeshStandardMaterial({ color: 0x9b9078, roughness: 1 });
  const creamSoft = new THREE.MeshStandardMaterial({ color: 0xdacfb8, roughness: 1 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.26, metalness: 0.95 });
  const brass = gold;   // alias for existing references
  const darkStoneTex = marbleTexture({ base: "#2b2926", vein: "#6f685c", gold: "#b3895a" }); darkStoneTex.repeat.set(1.4, 2.2);
  const darkStoneMat = new THREE.MeshStandardMaterial({ map: darkStoneTex, roughness: 0.4, metalness: 0.08 });
  const blackMetal = new THREE.MeshStandardMaterial({ color: 0x23201b, roughness: 0.45, metalness: 0.7 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xe9e1cd, roughness: 1 });
  const bouclé = new THREE.MeshStandardMaterial({ color: 0xddd3ba, roughness: 1 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xf2faf8, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.07, side: THREE.DoubleSide });

  // ---- light: high clear midday sun streaming in through the glazing
  // (hemisphere eased back — the environment map now supplies sky ambience)
  scene.add(new THREE.HemisphereLight(0xfdfaf1, 0xc9bb9f, 0.45));
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.85);
  sun.position.set(-10, 19, -24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 95;
  sun.shadow.camera.left = -36; sun.shadow.camera.right = 36; sun.shadow.camera.top = 42; sun.shadow.camera.bottom = -16;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  sun.target.position.set(4, 0, 6);
  const bounce = new THREE.PointLight(0xfff3df, 0.2, 50); bounce.position.set(6, 5, 9); scene.add(bounce);

  // ---- interior shell  (x −16..16 · glazing at z −12 · ceiling 10.5)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(32, 30), marbleMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 3); floor.receiveShadow = true; scene.add(floor);

  // modern plaster ceiling: a smooth floating tray with recessed, gold-rimmed
  // linear light channels (replaces the old wood-slat raft)
  const ceilMat = new THREE.MeshStandardMaterial({ map: plasterTex.clone(), roughness: 1 });
  ceilMat.map.repeat.set(3, 3);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(34, 31), ceilMat);
  ceiling.rotation.x = Math.PI / 2; ceiling.position.set(0, 10.75, 3); ceiling.receiveShadow = true; scene.add(ceiling);
  const tray = new THREE.Mesh(new THREE.BoxGeometry(27, 0.3, 23), new THREE.MeshStandardMaterial({ map: plasterTex.clone(), roughness: 1 }));
  tray.position.set(0, 10.42, 3); tray.receiveShadow = true; scene.add(tray);
  const ledMat = new THREE.MeshBasicMaterial({ color: 0xffe7c2, fog: false });
  [-6.4, 0, 6.4].forEach((x) => {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 21), new THREE.MeshStandardMaterial({ color: 0x241f19, roughness: 1 }));
    slot.position.set(x, 10.3, 1.5); scene.add(slot);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 20.4), ledMat); led.position.set(x, 10.24, 1.5); scene.add(led);
    [-0.3, 0.3].forEach((dz) => { const e = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.18, 21), gold); e.position.set(x + dz, 10.32, 1.5); scene.add(e); });
  });
  // warm reveal glow along the tray's front & back edges + soft uplight
  const coveMat = new THREE.MeshBasicMaterial({ color: 0xffe9c6, fog: false });
  [-8.0, 14.2].forEach((cz) => { const st = new THREE.Mesh(new THREE.BoxGeometry(27, 0.08, 0.1), coveMat); st.position.set(0, 10.3, cz); scene.add(st); });
  [-6, 6].forEach((z) => { const gl = new THREE.PointLight(0xffe2b0, 4.5, 13, 2); gl.position.set(0, 10.0, z + 3); scene.add(gl); });

  // recessed perimeter cove — a warm concealed-LED glow along the wall/ceiling line
  [-15.55, 15.55].forEach((wx) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 27), new THREE.MeshBasicMaterial({ color: 0xffe9c6, fog: false }));
    strip.position.set(wx, 9.95, 3); scene.add(strip);
    [-2, 9].forEach((z) => { const gl = new THREE.PointLight(0xffe1b0, 5, 12, 2); gl.position.set(wx * 0.9, 9.5, z); scene.add(gl); });
  });

  // left wall + modern linear fireplace in a full-height dark-stone surround
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10.5), wallMat);
  leftWall.position.set(-16, 5.25, 3); leftWall.rotation.y = Math.PI / 2; leftWall.receiveShadow = true; scene.add(leftWall);
  // floor-to-ceiling honed dark-marble feature slab (book-matched look)
  const surround = new THREE.Mesh(new THREE.BoxGeometry(1.0, 10.5, 7.4), darkStoneMat);
  surround.position.set(-15.45, 5.25, -3); surround.castShadow = true; surround.receiveShadow = true; scene.add(surround);
  // crisp brass reveal framing a long, low linear opening
  const fbW = 5.0, fbH = 1.15, fbY = 2.35, fbX = -14.93;
  [[fbH / 2 + 0.07, fbW + 0.34, 0.1], [-fbH / 2 - 0.07, fbW + 0.34, 0.1]].forEach(([dy, w]) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, w), brass); t.position.set(fbX, fbY + dy, -3); scene.add(t);
  });
  [-1, 1].forEach((s) => { const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, fbH + 0.34, 0.1), brass); v.position.set(fbX, fbY, -3 + s * (fbW / 2 + 0.12)); scene.add(v); });
  // recessed black firebox cavity
  const firebox = new THREE.Mesh(new THREE.BoxGeometry(0.55, fbH, fbW), new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 1 }));
  firebox.position.set(-15.0, fbY, -3); scene.add(firebox);
  const backReflect = new THREE.Mesh(new THREE.PlaneGeometry(fbW, fbH), new THREE.MeshStandardMaterial({ color: 0x161210, roughness: 0.25, metalness: 0.8 }));
  backReflect.rotation.y = Math.PI / 2; backReflect.position.set(-15.18, fbY, -3); scene.add(backReflect);
  // glass-media burner bed (a row of dark reflective pebbles)
  for (let i = 0; i < 16; i++) {
    const peb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07 + Math.random() * 0.04, 0), new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.2, metalness: 0.6 }));
    peb.position.set(-14.95 + (Math.random() - 0.5) * 0.18, fbY - fbH / 2 + 0.07, -3 + (i / 15 - 0.5) * (fbW - 0.4)); scene.add(peb);
  }
  // ribbon flame — emissive plane (flickers in update via `ember`) + tongues
  const ember = new THREE.Mesh(new THREE.PlaneGeometry(fbW - 0.3, 0.7), new THREE.MeshBasicMaterial({ color: 0xff9a44, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  ember.rotation.y = Math.PI / 2; ember.position.set(-14.86, fbY - 0.2, -3); scene.add(ember);
  const flames = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const fl = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.5 + Math.random() * 0.35, 6), new THREE.MeshBasicMaterial({ color: 0xffb255, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    fl.position.set(-14.9, fbY - 0.18, -3 + (i / 8 - 0.5) * (fbW - 0.5)); flames.add(fl);
  }
  scene.add(flames);
  // floating cantilevered hearth bench (light marble, contrasts the dark slab)
  const hearth = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.34, 5.6), marbleMat);
  hearth.position.set(-14.55, 0.62, -3); hearth.castShadow = true; hearth.receiveShadow = true; scene.add(hearth);
  const hearthShadowGap = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.34, 5.6), new THREE.MeshStandardMaterial({ color: 0x161310, roughness: 1 }));
  hearthShadowGap.position.set(-15.2, 0.3, -3); scene.add(hearthShadowGap);

  // ---- elk shoulder mount above the fireplace (stylized, commanding)
  const deer = new THREE.Group();
  // dark, rich bronzed-walnut antlers — high contrast against the cream wall
  const boneMat = new THREE.MeshStandardMaterial({ color: 0x271a0f, roughness: 0.38, metalness: 0.32 });
  const furMat = new THREE.MeshStandardMaterial({ color: 0x7a5234, roughness: 0.95 });
  const maneMat = new THREE.MeshStandardMaterial({ color: 0x4f3a28, roughness: 1 });
  const furLight = new THREE.MeshStandardMaterial({ color: 0xa3784f, roughness: 0.95 });
  const plaque = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 0.14, 22), walnutMat);
  plaque.rotation.z = Math.PI / 2; deer.add(plaque);
  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), maneMat);
  chest.scale.set(0.75, 1.2, 0.9); chest.position.set(0.2, 0.12, 0); deer.add(chest);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.3, 12), maneMat);
  neck.position.set(0.46, 0.62, 0); neck.rotation.z = -0.5; deer.add(neck);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.55, 0.42), furMat);
  head.position.set(0.86, 1.22, 0); head.rotation.z = -0.1; deer.add(head);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.7, 10), furLight);
  snout.position.set(1.28, 1.28, 0); snout.rotation.z = -(Math.PI / 2) + 0.15; deer.add(snout);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshStandardMaterial({ color: 0x2a211a, roughness: 0.6 }));
  nose.position.set(1.61, 1.33, 0); deer.add(nose);
  [-1, 1].forEach((s) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), furLight);
    ear.scale.set(0.5, 1, 0.3); ear.position.set(0.58, 1.46, s * 0.34); ear.rotation.x = s * 0.7; deer.add(ear);
    // elk antlers: thick, wide 6-point rack sweeping up & back — the focal mount
    const bone = (a, b, r1, r2) => {
      const va = new THREE.Vector3(a[0], a[1], a[2] * s), vb = new THREE.Vector3(b[0], b[1], b[2] * s);
      const dir = vb.clone().sub(va), len = dir.length();
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, 12), boneMat);
      m.position.copy(va.clone().add(vb).multiplyScalar(0.5));
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      m.castShadow = true; deer.add(m);
      const joint = new THREE.Mesh(new THREE.SphereGeometry(r1 * 1.04, 8, 6), boneMat);
      joint.position.copy(va); joint.castShadow = true; deer.add(joint);
    };
    // main beam waypoints (x fwd, y up, z out) — biased up & out so the rack
    // clears the wall behind the mount (no back-poke through the plaster)
    const P = [
      [0.72, 1.5, 0.26], [0.82, 2.12, 0.66], [0.78, 2.78, 1.06],
      [0.62, 3.35, 1.36], [0.4, 3.75, 1.5], [0.18, 3.95, 1.56]
    ];
    for (let k = 0; k < P.length - 1; k++) bone(P[k], P[k + 1], 0.125 - k * 0.013, 0.108 - k * 0.013);
    bone([0.72, 1.62, 0.32], [1.5, 2.2, 0.5], 0.058, 0.022);   // brow tine
    bone(P[1], [1.45, 2.78, 0.96], 0.052, 0.02);               // bez tine
    bone(P[2], [1.3, 3.45, 1.28], 0.05, 0.02);                 // trez tine
    bone(P[3], [1.0, 3.9, 1.48], 0.048, 0.018);                // royal point
    bone(P[4], [0.55, 4.1, 1.56], 0.044, 0.016);               // sword point
    bone(P[4], [0.12, 3.98, 1.6], 0.04, 0.015);                // extra fork
  });
  deer.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  // statement niche behind the elk: a warm, backlit cedar inset framed in gold,
  // so the dark bronze rack reads as the focal piece against the dark stone slab
  const niche = new THREE.Mesh(new THREE.BoxGeometry(0.16, 4.7, 2.9), marbleMat);
  niche.position.set(-14.9, 6.05, -3); niche.receiveShadow = true; scene.add(niche);
  const nfH = (y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 3.04), gold); m.position.set(-14.85, y, -3); scene.add(m); };
  const nfV = (z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.12, 4.78, 0.09), gold); m.position.set(-14.85, 6.05, z); scene.add(m); };
  nfH(6.05 + 2.39); nfH(6.05 - 2.39); nfV(-3 - 1.52); nfV(-3 + 1.52);
  deer.position.set(-14.76, 5.45, -3); scene.add(deer);
  // rim the rack + wash the cedar niche so the silhouette separates cleanly
  const mountLight = new THREE.SpotLight(0xfff1d6, 30, 15, 0.45, 0.6, 1.5);
  mountLight.position.set(-10.5, 8.6, -1.4);
  mountLight.target.position.set(-14.9, 6.6, -3);
  scene.add(mountLight, mountLight.target);
  const nicheWash = new THREE.SpotLight(0xffd9a0, 26, 12, 0.8, 0.6, 1.3);
  nicheWash.position.set(-13.3, 4.2, -3); nicheWash.target.position.set(-14.9, 6.6, -3);
  scene.add(nicheWash, nicheWash.target);

  // ---- built-in cabinetry flanking the fireplace (walnut carcass, floating
  // base cabinets with marble tops + gold pulls, backlit open shelving, styling)
  function builtin(zc) {
    const g = new THREE.Group();
    const W = 3.8;
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.1, 9.4, W), walnutMat); back.position.set(-15.55, 5.0, zc); g.add(back);
    [-W / 2, W / 2].forEach((s) => { const sd = new THREE.Mesh(new THREE.BoxGeometry(0.95, 9.4, 0.1), walnutMat); sd.position.set(-15.05, 5.0, zc + s); g.add(sd); });
    // floating lower cabinet + honed-marble counter
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.7, W - 0.12), walnutMat); cab.position.set(-15.06, 1.7, zc); g.add(cab);
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.14, W), marbleMat); top.position.set(-15.0, 2.62, zc); top.castShadow = true; g.add(top);
    [-0.9, 0.9].forEach((pz) => { const pull = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.5), gold); pull.position.set(-14.58, 1.95, zc + pz); g.add(pull); });
    // open floating shelves
    [3.7, 5.4, 7.1].forEach((y) => { const sh = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, W - 0.14), walnutMat); sh.position.set(-15.07, y, zc); sh.castShadow = true; g.add(sh); });
    // concealed warm backlight + a slim reveal
    const bl = new THREE.PointLight(0xffd49a, 5, 7, 2); bl.position.set(-15.0, 5.4, zc); g.add(bl);
    const reveal = new THREE.Mesh(new THREE.BoxGeometry(0.04, 5.8, 0.05), gold); reveal.position.set(-15.49, 5.4, zc); g.add(reveal);
    // styling: oxblood vase, stone vessel, stacked books, gold object
    const vase = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.62, 18), darkStoneMat); vase.position.set(-15.0, 4.05, zc - 1.0); g.add(vase);
    const vessel = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 0.82, 18), darkStoneMat); vessel.position.set(-15.0, 5.85, zc - 0.95); g.add(vessel);
    const bk = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.26, 0.44), cream); bk.position.set(-15.0, 3.86, zc + 0.95); g.add(bk);
    const bk2 = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.12, 0.4), creamSoft); bk2.position.set(-15.0, 4.05, zc + 0.92); bk2.rotation.y = 0.12; g.add(bk2);
    const so = new THREE.Mesh(new THREE.IcosahedronGeometry(0.19, 0), gold); so.position.set(-15.0, 5.55, zc + 0.8); g.add(so);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
  }
  builtin(-9.3);   // street-side of the hearth
  builtin(3.4);    // inner side of the hearth

  // right wall — a full-height fluted (reeded) white-oak feature wall
  const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 10.5), wallMat.clone());
  rightWall.position.set(16, 5.25, 3); rightWall.rotation.y = -Math.PI / 2; rightWall.receiveShadow = true; scene.add(rightWall);
  const reeds = new THREE.Group();
  const reedGeo = new THREE.CylinderGeometry(0.12, 0.12, 10.3, 10);
  for (let z = -9; z <= 13; z += 0.42) {
    const r = new THREE.Mesh(reedGeo, fluteMat);
    r.position.set(15.82, 5.25, z); reeds.add(r);
  }
  // slim trim caps top & bottom of the reeding for a finished reveal
  [0.18, 10.32].forEach((y) => {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 22.5), walnutMat);
    t.position.set(15.78, y, 2); reeds.add(t);
  });
  scene.add(reeds);
  const credenza = new THREE.Group();
  const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.35, 6.5), walnutMat); cBody.position.y = 1.05;
  credenza.add(cBody);
  [[-2.9, 1], [2.9, 1], [-2.9, -1], [2.9, -1]].forEach(([lz, s]) => {
    const leg = mcLeg(blackMetal, 0.75, 0.05, 0.025, 0.08, s, 0);
    leg.position.set(s * 0.42, 0.38, lz);
    credenza.add(leg);
  });
  // ceramics
  [[-1.8, 0.5, 0.34], [0.2, 0.36, 0.22], [1.6, 0.62, 0.27]].forEach(([z, h, r]) => {
    const v = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.7, r, h, 14), cream);
    v.position.set(0, 1.73 + h / 2, z); v.castShadow = true; credenza.add(v);
  });
  shadowAll(credenza); credenza.position.set(15.1, 0, 1); scene.add(credenza);
  // framed art mounted proud of the reeding
  const artFrame = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 5.1), blackMetal); artFrame.position.set(15.6, 6.2, 1); artFrame.castShadow = true; scene.add(artFrame);
  const artCanvas = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.9), new THREE.MeshStandardMaterial({ map: marbleTexture({ base: "#2a2c33", vein: "#6b7280", gold: "#c7a86f" }), roughness: 0.6, metalness: 0.1 }));
  artCanvas.rotation.y = -Math.PI / 2; artCanvas.position.set(15.52, 6.2, 1); scene.add(artCanvas);

  // ---- glazing wall (z = −12): fixed flanking panes + big sliding glass doors
  const glazing = new THREE.Group();
  [0.18, 10.42].forEach((y) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(32, 0.16, 0.16), blackMetal);
    h.position.set(0, y, -12); glazing.add(h);
  });
  const track = new THREE.Mesh(new THREE.BoxGeometry(32, 0.34, 0.55), blackMetal);
  track.position.set(0, 10.32, -11.82); glazing.add(track);
  [-16, -12, -8, 8, 12, 16].forEach((x) => {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.16, 10.5, 0.16), blackMetal);
    v.position.set(x, 5.25, -12); glazing.add(v);
  });
  [[-12, 8], [12, 8]].forEach(([cx, w]) => {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, 10.1), glassMat);
    g.position.set(cx, 5.25, -12); glazing.add(g);
  });
  scene.add(glazing);
  // sliding panels — closed across the 16'-wide opening, glide apart on scroll
  function sliderPanel(hs) {
    const g = new THREE.Group();
    const mk = (w, h, x, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.13), blackMetal); m.position.set(x, y, 0); g.add(m); };
    mk(8.2, 0.2, 0, 10.0); mk(8.2, 0.26, 0, 0.32); mk(0.2, 9.9, -4.0, 5.16); mk(0.2, 9.9, 4.0, 5.16);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(7.7, 9.5), glassMat);
    gl.position.set(0, 5.16, 0); g.add(gl);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.3, 0.09), blackMetal);
    handle.position.set(hs * 3.55, 4.7, 0.12); g.add(handle);
    return g;
  }
  const doorL = sliderPanel(1); doorL.position.set(-4, 0, -11.8); scene.add(doorL);
  const doorR = sliderPanel(-1); doorR.position.set(4, 0, -11.76); scene.add(doorR);

  // ---- courtyard (z −12 … −38)
  const paverTex = paverTexture({}); paverTex.repeat.set(6, 4);
  const patio = new THREE.Mesh(new THREE.PlaneGeometry(46, 27), new THREE.MeshStandardMaterial({ map: paverTex, roughness: 0.95 }));
  patio.rotation.x = -Math.PI / 2; patio.position.set(0, -0.01, -25.5); patio.receiveShadow = true; scene.add(patio);

  // ---- luxury pool with tanning ledge + raised spa
  const waterTex = waterTexture({});
  const waterMat = new THREE.MeshPhysicalMaterial({ map: waterTex, roughness: 0.07, metalness: 0.0, emissive: 0x5fb6c4, emissiveMap: waterTex, emissiveIntensity: 0.13, clearcoat: 0.7, clearcoatRoughness: 0.12 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(13, 8), waterMat);
  water.rotation.x = -Math.PI / 2; water.position.set(5.5, 0.05, -23); scene.add(water);
  const ledge = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 7.6), new THREE.MeshStandardMaterial({ color: 0xa9dde2, roughness: 0.2, emissive: 0x8fd2d8, emissiveIntensity: 0.18 }));
  ledge.rotation.x = -Math.PI / 2; ledge.position.set(10.6, 0.07, -23); scene.add(ledge);
  const copingMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.85 });
  [[5.5, -18.75, 14.4, 0.7], [5.5, -27.25, 14.4, 0.7]].forEach(([px, pz, w, d]) => {
    const cp = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), copingMat); cp.position.set(px, 0.08, pz); cp.receiveShadow = true; scene.add(cp);
  });
  [[-1.35, -23], [12.35, -23]].forEach(([px, pz]) => {
    const cp = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 9.2), copingMat); cp.position.set(px, 0.08, pz); cp.receiveShadow = true; scene.add(cp);
  });
  // raised spa
  const spaShell = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.55, 4.2), new THREE.MeshStandardMaterial({ map: ledgestoneTexture({}), roughness: 0.9 }));
  spaShell.position.set(-3.8, 0.27, -20.2); spaShell.castShadow = true; spaShell.receiveShadow = true; scene.add(spaShell);
  const spaWater = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 3.1), waterMat.clone());
  spaWater.rotation.x = -Math.PI / 2; spaWater.position.set(-3.8, 0.57, -20.2); scene.add(spaWater);

  // ---- entertaining: chaise loungers, umbrella, side table
  const chaiseFrameMat = new THREE.MeshStandardMaterial({ color: 0x6d6356, roughness: 0.7 });
  function chaise(x, z, ry) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.2, 2.3), cream); base.position.set(0, 0.52, 0.15); g.add(base);
    const backR = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.18, 1.05), cream);
    backR.position.set(0, 0.89, -1.4); backR.rotation.x = 0.55; g.add(backR);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.08, 2.4), chaiseFrameMat); rail.position.set(0, 0.4, 0.1); g.add(rail);
    [[-0.42, -0.9], [0.42, -0.9], [-0.42, 1.05], [0.42, 1.05]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.4, 0.07), chaiseFrameMat); leg.position.set(lx, 0.2, lz); g.add(leg);
    });
    shadowAll(g); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  }
  chaise(2.6, -29.6, 0.12);
  chaise(5.4, -29.6, -0.08);
  const sideT = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.36, 0.5, 14), chaiseFrameMat);
  sideT.position.set(4.05, 0.25, -29.4); sideT.castShadow = true; scene.add(sideT);
  const upole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.5, 8), blackMetal);
  upole.position.set(4.1, 1.75, -30.9); scene.add(upole);
  const ucanopy = new THREE.Mesh(new THREE.ConeGeometry(2.0, 0.75, 10), new THREE.MeshStandardMaterial({ color: 0xefe7d4, roughness: 0.95 }));
  ucanopy.position.set(4.1, 3.55, -30.9); ucanopy.castShadow = true; scene.add(ucanopy);

  // ---- landscape: lawn panel, planters, step pads, fire bowl
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), new THREE.MeshStandardMaterial({ color: 0x97a878, roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.set(-13.5, 0.012, -29); lawn.receiveShadow = true; scene.add(lawn);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x5f7048, roughness: 1 });
  [[-2, -36.4], [4, -36.4], [10, -36.4]].forEach(([px, pz]) => {
    const planter = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.85, 1.9), cream);
    planter.position.set(px, 0.42, pz); planter.castShadow = true; planter.receiveShadow = true; scene.add(planter);
    for (let k = 0; k < 6; k++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.1, 1.1 + (k % 3) * 0.3, 5), grassMat);
      blade.position.set(px - 0.5 + (k % 3) * 0.5, 1.3, pz - 0.4 + ((k / 3) | 0) * 0.7);
      blade.rotation.z = ((k % 5) - 2) * 0.12; blade.castShadow = true; scene.add(blade);
    }
  });
  [[1.2, -13.8], [2.2, -15.6], [1.4, -17.4]].forEach(([px, pz]) => {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 1.1), copingMat);
    pad.position.set(px, 0.035, pz); pad.receiveShadow = true; scene.add(pad);
  });
  const fireBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.6, 0.55, 16), new THREE.MeshStandardMaterial({ color: 0x35302a, roughness: 0.8 }));
  fireBowl.position.set(-16.5, 0.28, -33); fireBowl.castShadow = true; scene.add(fireBowl);

  // ---- planting: low-poly greenery kept to the lawn + a new mulch bed
  //      (lawn panel is x[-20.5,-6.5] z[-23,-35]; everything else is pavers)
  const folMat = new THREE.MeshStandardMaterial({ color: 0x7d8a59, roughness: 1 });   // kept for the indoor potted plant
  const greens = greenPalette();
  const greensDeep = foliagePalette([0x2f3a1a, 0x3e4a26, 0x4d5b33, 0x5e6e40]);          // ordered dark→light (cypress/hedge)
  const noShadow = (o) => o.traverse((m) => { m.castShadow = false; });

  // a dark mulch bed along the lawn's back edge, so the hedge + cypress stand
  // in soil rather than on the pavers
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(13.4, 2.4), new THREE.MeshStandardMaterial({ color: 0x33291f, roughness: 1 }));
  bed.rotation.x = -Math.PI / 2; bed.position.set(-13.5, 0.02, -35.7); bed.receiveShadow = true; scene.add(bed);

  // principal shade tree (uplit by treeUp) + a smaller companion — both on the lawn
  const tree = makeTree({ h: 7.8, trunkR: 0.46, crownR: 2.9, clumps: 20, palette: greens });
  tree.position.set(-9.8, 0, -26); scene.add(tree);
  const tree2 = makeTree({ h: 5.3, trunkR: 0.3, crownR: 1.9, clumps: 13, palette: greens });
  tree2.position.set(-17.6, 0, -31.5); scene.add(tree2);

  // trio of Italian cypress standing in the mulch bed
  [[-19, -35.6], [-17.2, -36.1], [-15.4, -35.6]].forEach(([cx, cz], i) => {
    const cyp = makeCypress({ h: 5.8 + (i % 2) * 1.0, r: 0.82, palette: greensDeep });
    cyp.position.set(cx, 0, cz); scene.add(cyp);
  });

  // clipped low hedge running through the bed
  for (let x = -12.6; x <= -6.8; x += 1.55) {
    const s = makeShrub({ r: 0.9, palette: greensDeep });
    s.position.set(x, 0, -35.7); s.scale.y = 0.8; scene.add(s);
  }

  // boxwood shrubs on the lawn (never on the pavers)
  [[-12.8, -24.6], [-16.2, -27.5], [-11.4, -32.8], [-18.6, -24.4]].forEach(([sx, sz]) => {
    const s = makeShrub({ r: 0.72 + Math.random() * 0.4, palette: greens });
    s.position.set(sx, 0, sz); scene.add(s);
  });

  // ornamental grasses (no shadow) + faceted boulders, all on the lawn
  [[-19, -29], [-14.5, -24], [-8.4, -29.5], [-15.5, -33.5], [-11, -24.2]].forEach(([gx, gz]) => {
    const t = makeGrassTuft({ h: 1.2 + Math.random() * 0.6, color: 0x8f9a55 });
    t.position.set(gx, 0, gz); noShadow(t); scene.add(t);
  });
  [[-13.2, -25.5, 0.7], [-16.8, -30.5, 0.5], [-8.6, -32, 0.55]].forEach(([bx, bz, br]) => {
    const b = makeBoulder({ r: br, color: 0x938f86 });
    b.position.set(bx, br * 0.3, bz); scene.add(b);
  });

  // low flowering groundcover dabs — confined to the lawn (no shadow)
  const blooms = foliagePalette([0xc98aa0, 0xd6b25e, 0xb98fbf]);
  for (let i = 0; i < 12; i++) {
    const fr = 0.15 + Math.random() * 0.12;
    const fm = new THREE.Mesh(clumpGeo(), blooms[(Math.random() * blooms.length) | 0]);
    fm.scale.set(fr, fr * 0.7, fr);
    fm.position.set(-13.5 + (Math.random() - 0.5) * 11.5, fr * 0.6, -29 + (Math.random() - 0.5) * 9.5);
    noShadow(fm); scene.add(fm);
  }

  // breeze-block screen (mid-century lattice) spanning glazing to garden wall
  const lattice = new THREE.Group();
  const latMat = new THREE.MeshStandardMaterial({ color: 0xebe4d2, roughness: 0.92 });
  for (let y = 0.2; y <= 5.2; y += 0.98) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 25), latMat);
    h.position.set(0, y, 0); lattice.add(h);
  }
  for (let z = -12.25; z <= 12.25; z += 0.98) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.16, 5.2, 0.16), latMat);
    v.position.set(0, 2.6, z); lattice.add(v);
  }
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.22, 25.4), latMat);
  cap.position.set(0, 5.3, 0); lattice.add(cap);
  shadowAll(lattice); lattice.position.set(14.8, 0, -25.2); scene.add(lattice);

  // perimeter garden walls
  const gWallMat = new THREE.MeshStandardMaterial({ map: plasterTex.clone(), roughness: 0.95 });
  const farWall = new THREE.Mesh(new THREE.BoxGeometry(46, 2.5, 0.5), gWallMat);
  farWall.position.set(0, 1.25, -38); farWall.castShadow = true; farWall.receiveShadow = true; scene.add(farWall);
  const leftWallExt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.5, 26), gWallMat);
  leftWallExt.position.set(-22.5, 1.25, -25); leftWallExt.castShadow = true; scene.add(leftWallExt);

  // landscape + sky (bright, unfogged so they read as clear daylight)
  const hills = new THREE.Mesh(new THREE.PlaneGeometry(220, 18), new THREE.MeshBasicMaterial({ color: 0xb9c2a2, fog: false }));
  hills.position.set(0, 4.5, -64); scene.add(hills);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(320, 110), new THREE.MeshBasicMaterial({ color: 0xdde9ee, fog: false }));
  sky.position.set(0, 38, -90); scene.add(sky);
  const sunGlow = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshBasicMaterial({ map: radialSprite("rgba(255,244,214,1)"), transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  sunGlow.position.set(-26, 30, -86); scene.add(sunGlow);

  // ---- furniture
  // flat luxury rug — dark field, fine geometric lattice + gold border
  const rugTex = luxRugTexture({});
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(13.5, 9.5), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.02, -2.6); rug.receiveShadow = true; scene.add(rug);

  // low-slung sofa facing the courtyard
  const sofa = new THREE.Group();
  const sFrame = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.35, 3.2), upholsteryDeep); sFrame.position.y = 0.62; sofa.add(sFrame);
  const sBack = new THREE.Mesh(new THREE.BoxGeometry(8.2, 1.15, 0.42), upholsteryDeep); sBack.position.set(0, 1.5, 1.42); sofa.add(sBack);
  [-2.72, 0, 2.72].forEach((cx) => {
    const cu = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.5, 2.7), upholstery); cu.position.set(cx, 1.05, -0.1); sofa.add(cu);
    const bp = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.05, 0.42), upholstery); bp.position.set(cx, 1.62, 1.05); bp.rotation.x = -0.12; sofa.add(bp);
  });
  // tonal throw pillows (cream + deeper greige) — calm and in-sync
  [[-2.5, creamSoft], [0.0, upholsteryDeep], [2.5, creamSoft]].forEach(([px, mat]) => {
    const pil = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.95, 0.34), mat);
    pil.position.set(px, 1.46, 0.74); pil.rotation.set(-0.14, px * 0.05, 0.12); pil.castShadow = true; sofa.add(pil);
  });
  [[-3.8, -1.35, 1, 1], [3.8, -1.35, -1, 1], [-3.8, 1.35, 1, -1], [3.8, 1.35, -1, -1]].forEach(([lx, lz, dx, dz]) => {
    const leg = mcLeg(blackMetal, 0.62, 0.06, 0.03, 0.1, dx, dz);
    leg.position.set(lx, 0.31, lz); sofa.add(leg);
  });
  shadowAll(sofa); sofa.position.set(0, 0, 1.5); scene.add(sofa);

  // high-end sculptural coffee table — honed marble slab on a ribbed walnut drum
  const ct = new THREE.Group();
  const ctTop = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.2, 48), marbleMat); ctTop.position.y = 0.96; ctTop.castShadow = true; ct.add(ctTop);
  const ctReveal = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.08, 40), new THREE.MeshStandardMaterial({ color: 0x161310, roughness: 1 })); ctReveal.position.y = 0.83; ct.add(ctReveal);
  const drumGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.76, 8);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const stave = new THREE.Mesh(drumGeo, walnutMat);
    stave.position.set(Math.cos(a) * 0.62, 0.43, Math.sin(a) * 0.62); ct.add(stave);
  }
  const drumCore = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.76, 24), walnutMat); drumCore.position.y = 0.43; ct.add(drumCore);
  const brassRing = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.06, 36), brass); brassRing.position.y = 0.05; ct.add(brassRing);
  // styling: stacked design books, a sculptural object, a brass bowl
  const book1 = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.1, 0.72), upholsteryDeep); book1.position.set(-0.45, 1.11, 0.26); book1.rotation.y = 0.32; ct.add(book1);
  const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.09, 0.66), new THREE.MeshStandardMaterial({ color: 0x32302b, roughness: 0.9 })); book2.position.set(-0.4, 1.2, 0.22); book2.rotation.y = 0.18; ct.add(book2);
  const obj = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), brass); obj.position.set(-0.4, 1.37, 0.2); ct.add(obj);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.2, 0.16, 22), brass); bowl.position.set(0.66, 1.14, -0.32); ct.add(bowl);
  shadowAll(ct); ct.position.set(0, 0, -3.2); scene.add(ct);

  // two modern lounge chairs — upholstered shell on a slim black-metal sled
  function lounge(x, z, ry) {
    const g = new THREE.Group();
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.32, 1.8), upholstery); seat.position.y = 0.74; g.add(seat);
    const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.0, 16), upholstery); nose.rotation.z = Math.PI / 2; nose.position.set(0, 0.74, -0.9); g.add(nose);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.5, 0.34), upholstery); back.position.set(0, 1.52, 0.82); back.rotation.x = 0.18; g.add(back);
    [-1, 1].forEach((s) => { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.6, 1.85), upholstery); arm.position.set(s * 0.97, 1.0, 0.02); g.add(arm); });
    const bolster = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 1.5, 16), creamSoft); bolster.rotation.z = Math.PI / 2; bolster.position.set(0, 1.04, 0.5); g.add(bolster);
    [-0.78, 0.78].forEach((s) => {
      const runner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.9), blackMetal); runner.position.set(s, 0.09, 0); g.add(runner);
      [-0.8, 0.8].forEach((rz) => { const up = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.64, 0.06), blackMetal); up.position.set(s, 0.41, rz); g.add(up); });
    });
    shadowAll(g); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
  }
  lounge(-6.2, -4.5, -0.5);
  lounge(6.4, -4.2, 0.5);

  // modern antler chandelier over the coffee table — gold, sculptural, radial
  const chand = new THREE.Group();
  const ceilY = 10.4, hubY = 7.5, hubZ = -3.2;
  const drop = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, ceilY - hubY, 8), blackMetal);
  drop.position.set(0, (ceilY + hubY) / 2, hubZ); chand.add(drop);
  const ccanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.06, 18), gold); ccanopy.position.set(0, ceilY - 0.03, hubZ); chand.add(ccanopy);
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.27, 18, 14), gold); hub.position.set(0, hubY, hubZ); chand.add(hub);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.04, 10, 30), gold); ring.position.set(0, hubY - 0.06, hubZ); ring.rotation.x = Math.PI / 2; chand.add(ring);
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xfff3da, roughness: 0.25, emissive: 0xffe2ad, emissiveIntensity: 1.15 });
  const tine = (a, b, r1, r2) => {
    const va = new THREE.Vector3(a[0], a[1], a[2]), vb = new THREE.Vector3(b[0], b[1], b[2]);
    const dir = vb.clone().sub(va), len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, len, 7), gold);
    m.position.copy(va.clone().add(vb).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    chand.add(m);
  };
  const N = 6;
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2, ax = Math.cos(ang), az = Math.sin(ang);
    const p0 = [ax * 0.32, hubY - 0.05, hubZ + az * 0.32];
    const p1 = [ax * 0.95, hubY + 0.28, hubZ + az * 0.95];
    const p2 = [ax * 1.4, hubY + 0.85, hubZ + az * 1.4];
    const pf = [ax * 1.18, hubY + 1.0, hubZ + az * 1.18];
    tine(p0, p1, 0.06, 0.045); tine(p1, p2, 0.045, 0.03); tine(p1, pf, 0.035, 0.02);
    [p2, pf].forEach((pt) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.078, 16, 12), bulbMat.clone()); b.position.set(pt[0], pt[1] + 0.05, pt[2]); chand.add(b); });
  }
  chand.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  scene.add(chand);
  const pendantLight = new THREE.PointLight(0xffe6bc, 17, 18, 2); pendantLight.position.set(0, 7.1, -3.2); scene.add(pendantLight);

  // plant by the glazing
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 1.2, 16), cream);
  pot.position.set(11.5, 0.6, -9.5); pot.castShadow = true; scene.add(pot);
  for (let i = 0; i < 7; i++) {
    const lf = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 6), folMat);
    lf.scale.set(0.34, 1.5, 0.16);
    lf.position.set(11.5 + Math.cos(i * 0.9) * 0.5, 2.2 + (i % 3) * 0.45, -9.5 + Math.sin(i * 0.9) * 0.5);
    lf.rotation.z = (i - 3) * 0.26; lf.castShadow = true; scene.add(lf);
  }

  // ---- soft daylight rays through the glazing
  const rayMat = new THREE.MeshBasicMaterial({ color: 0xfff0d2, transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const rays = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(22, 2.4), rayMat.clone());
    p.position.set(-2 + i * 2.2, 6.4 - i * 1.2, -5 - i * 1.4);
    p.rotation.z = -0.3; p.rotation.y = 0.3;
    p.userData.base = 0.035; p.userData.ph = i;
    rays.add(p);
  }
  scene.add(rays);

  const motes = makeMotes(110, { x: 26, y: 11, z: 24 }, 0xfff0d2, 0.06);
  motes.position.set(-2, 3, -2); scene.add(motes);

  // =================== layered lighting — interior + exterior accents ==========
  // warm interior downlights — pools over the seating (no shadow casting, for perf)
  function downlight(x, z, intensity, dist) {
    const sp = new THREE.SpotLight(0xfff0d6, intensity, dist, 0.6, 0.7, 1.5);
    sp.position.set(x, 10.2, z); sp.target.position.set(x, 0, z);
    scene.add(sp, sp.target);
  }
  downlight(0, 1.5, 130, 17);      // over the sofa
  downlight(-6.2, -4.5, 90, 16);   // lounge left
  downlight(6.4, -4.2, 90, 16);    // lounge right
  downlight(0, -3.2, 70, 15);      // coffee table (with the pendant)
  // credenza + art wall wash
  const artWash = new THREE.SpotLight(0xffe9c8, 58, 16, 0.5, 0.7, 1.4);
  artWash.position.set(12.5, 9, 1); artWash.target.position.set(15.7, 4, 1);
  scene.add(artWash, artWash.target);
  // warm grazing across the plaster (architectural wall light)
  const wallGraze = new THREE.PointLight(0xffe9cf, 42, 24, 1.6); wallGraze.position.set(9, 7.6, -8); scene.add(wallGraze);
  // fireplace firelight (flickers in update)
  const fireLight = new THREE.PointLight(0xff7e36, 20, 11, 2); fireLight.position.set(-14.3, 2.35, -3); scene.add(fireLight);

  // exterior accents — subtle in daylight, add depth & realism
  const spaLight = new THREE.PointLight(0xa9dde2, 13, 8, 2); spaLight.position.set(-3.8, 0.7, -20.2); scene.add(spaLight);
  const fireBowlLight = new THREE.PointLight(0xff7a30, 18, 10, 2); fireBowlLight.position.set(-16.5, 0.7, -33); scene.add(fireBowlLight);
  const treeUp = new THREE.SpotLight(0xcfe0a8, 40, 17, 0.6, 0.7, 1.4); treeUp.position.set(-9.5, 0.3, -24); treeUp.target.position.set(-9.5, 7.5, -25); scene.add(treeUp, treeUp.target);
  [[-2, -36.4], [4, -36.4], [10, -36.4]].forEach(([px, pz]) => { const pl = new THREE.PointLight(0xffd9a0, 7, 6, 2); pl.position.set(px, 0.95, pz + 1.1); scene.add(pl); });

  return {
    scene, exposure: 0.82,
    env: { top: "#9fbad6", horizon: "#e0e4dc", bottom: "#cdc7b6", sun: "rgba(255,244,214,0.9)", sunX: 0.2, sunY: 0.22, sunSize: 0.22, intensity: 0.5 },
    from: { pos: [11.5, 5.8, 12.5], tgt: [-4, 4.2, -6] },
    to: { pos: [-2, 4.7, 2.5], tgt: [5, 3.0, -24] },
    update(dt, t, p = 0) {
      rays.children.forEach((p2) => { p2.material.opacity = p2.userData.base * (0.7 + 0.5 * Math.sin(t * 0.5 + p2.userData.ph)); });
      motes.rotation.y = t * 0.02;
      waterTex.offset.x = t * 0.006; waterTex.offset.y = t * 0.004;
      ember.material.opacity = 0.38 + Math.sin(t * 2.4) * 0.1 + Math.sin(t * 7.3) * 0.04;
      flames.children.forEach((f, i) => { f.scale.y = 0.8 + Math.sin(t * 9 + i * 1.7) * 0.25; f.material.opacity = 0.42 + Math.sin(t * 11 + i * 1.3) * 0.12; });
      fireLight.intensity = 20 + Math.sin(t * 7.3) * 5 + Math.sin(t * 13.1) * 2.5;
      fireBowlLight.intensity = 18 + Math.sin(t * 6.1) * 4;
      pendantLight.intensity = 16 + Math.sin(t * 0.9) * 0.7;
      // sliding doors glide open as the section scrolls
      const o = clamp((p - 0.04) / 0.62, 0, 1);
      const s = o * o * (3 - 2 * o);
      doorL.position.x = -4 - 7.7 * s;
      doorR.position.x = 4 + 7.7 * s;
    }
  };
}

/* =====================================================================
   PRIVATE INVESTMENT — walnut boardroom at dusk: pendant-lit table,
   massing model, drawings, and a city skyline beyond the glass.
   ===================================================================== */
function buildInvestment() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x100d0a);
  scene.fog = new THREE.FogExp2(0x100d0a, 0.03);

  // ---- materials
  const walnut = woodTexture({ base: "#5a3c26", dark: "#2c1b0f", light: "#7c5634" }); walnut.repeat.set(3, 1);
  const tableMat = new THREE.MeshStandardMaterial({ map: walnut, roughness: 0.18, metalness: 0.08 });
  const panel = woodTexture({ base: "#3c2a1b", dark: "#22160d", light: "#523a26", vertical: true }); panel.repeat.set(4, 2);
  const panelMat = new THREE.MeshStandardMaterial({ map: panel, roughness: 0.6 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0x9a9ea2, roughness: 0.25, metalness: 1 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb08d57, roughness: 0.3, metalness: 1 });
  const leather = new THREE.MeshStandardMaterial({ color: 0x3d352b, roughness: 0.55, metalness: 0.1 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x2c2f31, roughness: 0.35, metalness: 0.85 });
  const glassObj = new THREE.MeshPhysicalMaterial({ color: 0xd8cfb8, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32 });

  // ---- lights
  scene.add(new THREE.HemisphereLight(0x453b28, 0x0e0b08, 0.95));
  // three warm pools along the linear fixture
  const pendLights = [];
  [-5.5, 0, 5.5].forEach((px) => {
    const sp = new THREE.SpotLight(0xffd79a, 120, 32, 0.82, 0.6, 1.15);
    sp.position.set(px, 7.6, 0); sp.target.position.set(px, 1.4, 0);
    if (px === 0) { sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); sp.shadow.bias = -0.0005; }
    scene.add(sp, sp.target);
    pendLights.push(sp);
  });
  const pend = pendLights[1];
  const modelLight = new THREE.SpotLight(0xffe6bc, 70, 22, 0.65, 0.6, 1.3);
  modelLight.position.set(6.5, 6.5, 2); modelLight.target.position.set(6.5, 1.7, 0); scene.add(modelLight, modelLight.target);
  const coolRim = new THREE.PointLight(0x6f86a8, 1.6, 60, 1.4); coolRim.position.set(-12, 7, 10); scene.add(coolRim);
  const wallWash = new THREE.PointLight(0xffe2b8, 1.4, 34, 1.4); wallWash.position.set(-4, 6, -6); scene.add(wallWash);
  const camFill = new THREE.PointLight(0xfff0d8, 1.0, 40, 1.5); camFill.position.set(9, 6, 12); scene.add(camFill);

  // ---- shell
  const sfloor = stoneTexture({ base: "#2e2a23", spot: "#241f19" }); sfloor.repeat.set(6, 6);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ map: sfloor, roughness: 0.4, metalness: 0.25 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), panelMat);
  backWall.position.set(0, 7, -11); backWall.receiveShadow = true; scene.add(backWall);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), new THREE.MeshStandardMaterial({ color: 0x14110d, roughness: 1 }));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = 13; scene.add(ceil);

  // ceiling cove glow around the room
  const coveMat = new THREE.MeshBasicMaterial({ color: 0xffe2b0, transparent: true, opacity: 0.5, fog: false });
  [[0, -10.6, 38, 0.07, 0.07], [0, 10.6, 38, 0.07, 0.07]].forEach(([cx, cz, len]) => {
    const cv = new THREE.Mesh(new THREE.BoxGeometry(len, 0.07, 0.07), coveMat); cv.position.set(cx, 12.8, cz); scene.add(cv);
  });
  const coveGlow = new THREE.PointLight(0xffd9a0, 0.35, 30); coveGlow.position.set(0, 12, -8); scene.add(coveGlow);

  // brass sconces on the panel wall
  [-13, 0, 13].forEach((sx) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.7, 0.12), new THREE.MeshStandardMaterial({ color: 0x1a140d, emissive: 0xffdca6, emissiveIntensity: 1.1, roughness: 0.5 }));
    bar.position.set(sx, 7.3, -10.85); scene.add(bar);
    const gl = new THREE.PointLight(0xffd9a0, 0.4, 12); gl.position.set(sx, 7.3, -10.2); scene.add(gl);
  });

  // dark rug under the table
  const rTex = rugTexture({ base: "#241f19", band: "#2e2820", accent: "#3a3226" });
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(28, 13), new THREE.MeshStandardMaterial({ map: rTex, roughness: 1 }));
  rug.rotation.x = -Math.PI / 2; rug.position.y = 0.015; rug.receiveShadow = true; scene.add(rug);

  // ---- long walnut conference table
  const table = new THREE.Mesh(new THREE.BoxGeometry(18, 0.45, 5), tableMat);
  table.position.set(0, 1.4, 0); table.castShadow = true; table.receiveShadow = true; scene.add(table);
  [-7, 7].forEach((bx) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 3.4), chrome); b.position.set(bx, 0.7, 0); b.castShadow = true; scene.add(b); });

  // ---- executive chairs (realistic proportions: seat below the table, tilted
  //      ergonomic back, chrome gas column + 5-star caster base)
  function chair(x, z, faceLeft) {
    const g = new THREE.Group();
    const dir = faceLeft ? 1 : -1; // back sits away from the table
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 1.45), leather); seat.position.set(0, 0.95, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.5, 0.2), leather);
    back.position.set(0, 1.78, dir * 0.6); back.rotation.x = dir * 0.14;
    const head = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.4, 0.22), leather);
    head.position.set(0, 2.5, dir * 0.74); head.rotation.x = dir * 0.14;
    [-0.78, 0.78].forEach((sx) => {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 1.2), leather); arm.position.set(sx, 1.18, 0);
      const sup = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.34, 0.08), steel); sup.position.set(sx, 1.0, -0.1);
      g.add(arm, sup);
    });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.74, 14), chrome); stem.position.y = 0.45;
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 14), chrome); hub.position.y = 0.1;
    g.add(seat, back, head, stem, hub);
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.07, 0.13), chrome);
      leg.position.set(Math.cos(a) * 0.33, 0.07, Math.sin(a) * 0.33); leg.rotation.y = -a; g.add(leg);
      const caster = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.09, 10), steel);
      caster.rotation.x = Math.PI / 2; caster.position.set(Math.cos(a) * 0.62, 0.06, Math.sin(a) * 0.62); g.add(caster);
    }
    shadowAll(g);
    g.position.set(x, 0, z); scene.add(g);
  }
  [-5.2, -1.8, 1.8, 5.2].forEach((x) => { chair(x, 3.4, true); chair(x, -3.4, false); });

  // ---- architectural massing model
  const model = new THREE.Group();
  const baseSlab = new THREE.Mesh(new THREE.BoxGeometry(6, 0.25, 4), new THREE.MeshStandardMaterial({ color: 0xb6a079, roughness: 0.5 }));
  baseSlab.position.y = 0.12; model.add(baseSlab);
  const blockMat = new THREE.MeshStandardMaterial({ color: 0xcdba8c, roughness: 0.35, metalness: 0.1 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xc7b186, roughness: 0.2, metalness: 0.4, emissive: 0x4a3c1e, emissiveIntensity: 0.5 });
  let bi = 0;
  for (let gx = -2; gx <= 2; gx += 1) for (let gz = -1; gz <= 1; gz += 1) {
    const h = 0.5 + ((bi * 7) % 5) * 0.45;
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, h, 0.7), bi === 6 ? accentMat : blockMat.clone());
    m.position.set(gx, 0.25 + h / 2, gz); model.add(m); bi++;
  }
  const tower = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.4, 0.8), accentMat); tower.position.set(0, 0.25 + 1.7, 0); model.add(tower);
  shadowAll(model); model.position.set(6.2, 1.63, 0); scene.add(model);

  // ---- documents, drawings, devices, decanter
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xe6dccb, roughness: 0.9 });
  [[-5, 1.2, 0.2], [-2, -1.4, -0.3], [1.5, 1.0, 0.15]].forEach(([px, pz, rot]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.04, 2.1), paperMat); p.position.set(px, 1.65, pz); p.rotation.y = rot; p.receiveShadow = true; scene.add(p);
  });
  const plan = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.4), new THREE.MeshBasicMaterial({ map: planTexture({}), transparent: true, opacity: 0.95, fog: false }));
  plan.rotation.x = -Math.PI / 2; plan.rotation.z = 0.1; plan.position.set(-3.5, 1.64, 0.4); scene.add(plan);
  [[-5.0, 2.6], [4.0, -2.6]].forEach(([lx, lz]) => {
    const lap = new THREE.Group();
    const baseL = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 1.0), new THREE.MeshStandardMaterial({ color: 0x222428, roughness: 0.4, metalness: 0.7 }));
    const scr = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.0, 0.06), new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.3, metalness: 0.6, emissive: 0x1b2733, emissiveIntensity: 0.6 })); scr.position.set(0, 0.5, -0.5);
    lap.add(baseL, scr); lap.position.set(lx, 1.66, lz); lap.rotation.y = lz > 0 ? Math.PI : 0; shadowAll(lap); scene.add(lap);
  });
  // brass tray + decanter + glasses
  const trayG = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.045, 24), brass); trayG.add(tray);
  const dBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.27, 0.5, 14), glassObj); dBody.position.set(-0.25, 0.28, 0); trayG.add(dBody);
  const dNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 10), glassObj); dNeck.position.set(-0.25, 0.64, 0); trayG.add(dNeck);
  const dTop = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), glassObj); dTop.position.set(-0.25, 0.8, 0); trayG.add(dTop);
  [[0.22, 0.18], [0.42, -0.12], [0.1, -0.34]].forEach(([gx, gz]) => {
    const gl = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.095, 0.21, 12), glassObj); gl.position.set(gx, 0.13, gz); trayG.add(gl);
  });
  trayG.position.set(0.8, 1.65, 0.6); scene.add(trayG);

  // ---- credenza + books along the back wall
  const credenza = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 1.5), new THREE.MeshStandardMaterial({ map: walnut, roughness: 0.4 }));
  credenza.position.set(-6, 0.9, -10.1); credenza.castShadow = true; credenza.receiveShadow = true; scene.add(credenza);
  const bookTones = [0x4a3f33, 0x5d5345, 0x37424a, 0x6b5a40, 0x44382c];
  for (let i = 0; i < 14; i++) {
    const bh = 0.5 + Math.random() * 0.35;
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.16 + Math.random() * 0.1, bh, 0.85), new THREE.MeshStandardMaterial({ color: bookTones[i % bookTones.length], roughness: 0.9 }));
    b.position.set(-9.4 + i * 0.32, 1.8 + bh / 2, -10.1); b.castShadow = true; scene.add(b);
  }
  // framed site map above
  const mapFrame = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 0.2), steel); mapFrame.position.set(-6, 7, -10.85); scene.add(mapFrame);
  const mapImg = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 5.2), new THREE.MeshBasicMaterial({ map: planTexture({ bg: "#0d1828" }), transparent: true, opacity: 0.85, fog: false }));
  mapImg.position.set(-6, 7, -10.72); scene.add(mapImg);

  // ---- linear pendant fixture
  const housing = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 0.5), new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.6, metalness: 0.4 }));
  housing.position.set(0, 7.2, 0); scene.add(housing);
  const glowBar = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.08, 0.42), new THREE.MeshBasicMaterial({ color: 0xffe7bd, fog: false })); glowBar.position.set(0, 7.04, 0); scene.add(glowBar);
  [-5.6, 5.6].forEach((cx) => { const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 5.6, 6), new THREE.MeshStandardMaterial({ color: 0x14110d })); cord.position.set(cx, 10, 0); scene.add(cord); });

  // ---- glass partition + city skyline beyond
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(24, 13), new THREE.MeshPhysicalMaterial({ color: 0x1c2a30, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.16, side: THREE.DoubleSide }));
  glass.position.set(13.5, 7, 0); glass.rotation.y = -Math.PI / 2; scene.add(glass);
  const gframe = new THREE.Group();
  for (let i = -2; i <= 2; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.18, 13, 0.18), steel); v.position.set(13.5, 7, i * 5); gframe.add(v); }
  [0.5, 7, 13.5].forEach((y) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 24), steel); h.position.set(13.5, y, 0); gframe.add(h); });
  scene.add(gframe);
  const skyline = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), new THREE.MeshBasicMaterial({ map: skylineTexture(), fog: false }));
  skyline.position.set(34, 10, 0); skyline.rotation.y = -Math.PI / 2; scene.add(skyline);

  const motes = makeMotes(130, { x: 22, y: 9, z: 12 }, 0xffd79a, 0.05);
  motes.position.set(0, 3.5, 0); scene.add(motes);

  return {
    scene, exposure: 1.14,
    env: { top: "#14110d", horizon: "#4a3823", bottom: "#0e0b08", sun: "rgba(255,214,154,0.9)", sunX: 0.5, sunY: 0.5, sunSize: 0.32, intensity: 1.0 },
    from: { pos: [14, 5.0, 13], tgt: [1, 2.6, 0] },
    to: { pos: [-3, 3.2, 9], tgt: [6, 2.4, -1] },
    update(dt, t) {
      pend.intensity = 120 + Math.sin(t * 1.6) * 6;
      motes.rotation.y = t * 0.02;
      accentMat.emissiveIntensity = 0.5 + Math.sin(t * 1.2) * 0.14;
    }
  };
}

/* =====================================================================
   COMMERCIAL — an active mid-rise under construction: steel frame,
   curtain wall going in, working crane, full jobsite.
   ===================================================================== */
function buildCommercial() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xccd3d5);
  scene.fog = new THREE.Fog(0xccd3d5, 26, 110);

  // (hemisphere eased back — the overcast environment map now adds sky fill)
  scene.add(new THREE.HemisphereLight(0xe6edef, 0x7d8287, 0.7));
  const sun = new THREE.DirectionalLight(0xf3eee2, 1.7);
  sun.position.set(16, 26, 12); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 120;
  sun.shadow.camera.left = -45; sun.shadow.camera.right = 45; sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -12;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target); sun.target.position.set(0, 10, 0);

  // ---- materials
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a4, roughness: 0.46, metalness: 0.35 });
  const darkSteel = new THREE.MeshStandardMaterial({ color: 0x565b5e, roughness: 0.52, metalness: 0.35 });
  const safety = new THREE.MeshStandardMaterial({ color: 0xc2622a, roughness: 0.6 });
  const concreteMat = new THREE.MeshStandardMaterial({ map: concreteTexture({ base: "#b7bcbe" }), roughness: 0.95 });
  const coreMat = new THREE.MeshStandardMaterial({ map: concreteTexture({ base: "#a7adb0" }), roughness: 1 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xb9d2dc, roughness: 0.06, metalness: 0.05, transparent: true, opacity: 0.2, side: THREE.DoubleSide });
  const mullion = new THREE.MeshStandardMaterial({ color: 0x4d5358, roughness: 0.45, metalness: 0.35 });

  // ---- ground
  const gtex = concreteTexture({ base: "#aab0b2" }); gtex.repeat.set(10, 10);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ map: gtex, roughness: 0.97 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  const struct = new THREE.Group();
  const BX = 4, BZ = 3, LEVELS = 5, SPAN = 7, FH = 4.6;
  const W = BX * SPAN, D = BZ * SPAN, H = LEVELS * FH;
  const ibeam = (h, mat) => { const g = new THREE.Group(); const web = new THREE.Mesh(new THREE.BoxGeometry(0.18, h, 0.78), mat); const f1 = new THREE.Mesh(new THREE.BoxGeometry(0.78, h, 0.18), mat); f1.position.z = 0.38; const f2 = f1.clone(); f2.position.z = -0.38; g.add(web, f1, f2); g.traverse((o) => { if (o.isMesh) o.castShadow = true; }); return g; };

  // I-beam columns
  for (let i = 0; i <= BX; i++) for (let j = 0; j <= BZ; j++) {
    const c = ibeam(H, steel);
    c.position.set((i - BX / 2) * SPAN, H / 2, (j - BZ / 2) * SPAN);
    struct.add(c);
  }
  // beams + slabs
  for (let lv = 1; lv <= LEVELS; lv++) {
    const y = lv * FH;
    for (let j = 0; j <= BZ; j++) { const b = new THREE.Mesh(new THREE.BoxGeometry(W, 0.55, 0.42), steel); b.position.set(0, y, (j - BZ / 2) * SPAN); b.castShadow = true; struct.add(b); }
    for (let i = 0; i <= BX; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, D), steel); b.position.set((i - BX / 2) * SPAN, y, 0); b.castShadow = true; struct.add(b); }
    if (lv <= LEVELS - 1) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(W, 0.34, D), concreteMat);
      slab.position.set(0, y - 0.45, 0); slab.castShadow = true; slab.receiveShadow = true; struct.add(slab);
    } else {
      for (let k = -W / 2 + 1; k < W / 2; k += 1.1) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, D * 0.5), darkSteel);
        rib.position.set(k, y - 0.5, -D / 4); rib.castShadow = true; struct.add(rib);
      }
    }
  }

  // ---- perimeter guardrails on the open upper levels (orange safety rail)
  function railsAt(y, edges) {
    edges.forEach(([x1, z1, x2, z2]) => {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const cx = (x1 + x2) / 2, czz = (z1 + z2) / 2;
      const rotY = Math.atan2(z2 - z1, x2 - x1);
      [0.55, 1.05].forEach((ry) => {
        const r = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.06), safety);
        r.position.set(cx, y + ry, czz); r.rotation.y = -rotY; struct.add(r);
      });
      const n = Math.max(2, Math.round(len / 3.2));
      for (let k = 0; k <= n; k++) {
        const px = x1 + (x2 - x1) * (k / n), pz = z1 + (z2 - z1) * (k / n);
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.1, 0.07), safety);
        post.position.set(px, y + 0.55, pz); struct.add(post);
      }
    });
  }
  const hw = W / 2, hd = D / 2;
  [3, 4].forEach((lv) => {
    railsAt(lv * FH, [
      [-hw, hd, hw, hd], [-hw, -hd, hw, -hd], [-hw, -hd, -hw, hd], [hw, -hd, hw, hd]
    ]);
  });

  // continuous orange debris screening across the open upper floors' street face
  const netMat = new THREE.MeshBasicMaterial({ color: 0xc46a30, transparent: true, opacity: 0.26, side: THREE.DoubleSide, depthWrite: false });
  [3, 4].forEach((lv) => {
    const net = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.3, FH * 0.94), netMat);
    net.position.set(0, lv * FH + FH * 0.47, hd + 0.13); struct.add(net);
  });

  // rebar cluster + column starter bars on the top deck
  const rebarMat = new THREE.MeshStandardMaterial({ color: 0x6b4f3a, roughness: 0.8, metalness: 0.4 });
  for (let i = 0; i < 26; i++) {
    const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 5), rebarMat);
    rb.position.set(-hw + 3 + (i % 7) * 0.45, LEVELS * FH + 0.35, -hd + 2.5 + ((i / 7) | 0) * 0.45);
    struct.add(rb);
  }

  // concrete core
  const core = new THREE.Mesh(new THREE.BoxGeometry(SPAN, H + FH * 0.4, SPAN), coreMat);
  core.position.set(-SPAN, (H + FH * 0.4) / 2, -SPAN); core.castShadow = true; core.receiveShadow = true; struct.add(core);
  for (let i = 0; i < 8; i++) {
    const rb = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.6, 5), rebarMat);
    rb.position.set(-SPAN - 3 + (i % 4) * 2, H + FH * 0.4 + 0.7, -SPAN - 1.5 + ((i / 4) | 0) * 3);
    struct.add(rb);
  }

  // scaffolding on the core's street face
  const scaf = new THREE.Group();
  const scafMat = new THREE.MeshStandardMaterial({ color: 0x8e9499, roughness: 0.5, metalness: 0.35 });
  const SC_H = H * 0.66;
  for (let lx = 0; lx <= 2; lx++) for (let dz = 0; dz <= 1; dz++) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, SC_H, 6), scafMat);
    p.position.set(lx * 3 - 3, SC_H / 2, dz * 1.4);
    scaf.add(p);
  }
  for (let lv = 1; lv <= 4; lv++) {
    const y = lv * (SC_H / 4);
    const h1 = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.07, 0.07), scafMat); h1.position.set(0, y, 0); scaf.add(h1);
    const h2 = h1.clone(); h2.position.z = 1.4; scaf.add(h2);
    const plank = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.08, 1.3), new THREE.MeshStandardMaterial({ color: 0x9a8566, roughness: 0.9 }));
    plank.position.set(0, y + 0.06, 0.7); scaf.add(plank);
  }
  shadowAll(scaf); scaf.position.set(-SPAN, 0, -SPAN + SPAN / 2 + 0.8); struct.add(scaf);

  // ---- curtain wall (construction progression)
  function glazeBay(cx, y, w, h, glazed) {
    const fr = new THREE.Group();
    fr.add(new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.12), mullion));
    const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.12), mullion); top.position.y = h; fr.add(top);
    fr.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.12), mullion).translateX(-w / 2));
    fr.add(new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.12), mullion).translateX(w / 2));
    const mid = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, 0.1), mullion); mid.position.y = h / 2; fr.add(mid);
    if (glazed) { const g = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.2), glass); g.position.y = h / 2; fr.add(g); }
    fr.position.set(cx, y, 0);
    return fr;
  }
  const front = new THREE.Group();
  for (let lv = 0; lv < LEVELS; lv++) for (let i = 0; i < BX; i++) {
    const glazed = lv < LEVELS - 2;
    front.add(glazeBay((i - BX / 2) * SPAN + SPAN / 2, lv * FH, SPAN, FH, glazed));
  }
  front.position.z = hd; struct.add(front);
  const right = new THREE.Group();
  for (let lv = 0; lv < 2; lv++) for (let j = 0; j < BZ; j++) {
    const b = glazeBay((j - BZ / 2) * SPAN + SPAN / 2, lv * FH, SPAN, FH, true);
    b.rotation.y = Math.PI / 2; b.position.z = (j - BZ / 2) * SPAN + SPAN / 2; b.position.x = 0;
    right.add(b);
  }
  right.position.x = hw; struct.add(right);

  // ---- ground-floor entrance: steel canopy + storefront surround
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(8, 0.28, 4.4), darkSteel);
  canopy.position.set(SPAN / 2, 3.7, hd + 2.2); canopy.castShadow = true; struct.add(canopy);
  [SPAN / 2 - 3.5, SPAN / 2 + 3.5].forEach((cx) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.0, 6), steel);
    rod.position.set(cx, 5.15, hd + 2.15); rod.rotation.x = -1.01; rod.castShadow = true; struct.add(rod);
  });
  const surround = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.5, 0.6), darkSteel);
  surround.position.set(SPAN / 2, 4.1, hd + 0.2); struct.add(surround);
  scene.add(struct);

  // ---- tower crane with lattice mast + slewing jib
  const crane = new THREE.Group();
  const latMat = new THREE.MeshStandardMaterial({ color: 0xc9a23a, roughness: 0.5, metalness: 0.25 });
  const MAST_H = 44;
  // corner chords
  [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].forEach(([mx, mz]) => {
    const ch = new THREE.Mesh(new THREE.BoxGeometry(0.14, MAST_H, 0.14), latMat);
    ch.position.set(mx, MAST_H / 2, mz); ch.castShadow = true; crane.add(ch);
  });
  // lattice braces
  for (let y = 1.2; y < MAST_H; y += 2.4) {
    [[0, -0.45, 0], [0, 0.45, 0], [-0.45, 0, Math.PI / 2], [0.45, 0, Math.PI / 2]].forEach(([bx, bz, ry]) => {
      const hb = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.09, 0.09), latMat);
      hb.position.set(bx, y, bz); hb.rotation.y = ry; crane.add(hb);
      const db = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.07), latMat);
      db.position.set(bx, y + 1.2, bz); db.rotation.y = ry; db.rotation.z = 0.9; crane.add(db);
    });
  }
  // slewing upper works
  const slew = new THREE.Group();
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: 0xd8d4c8, roughness: 0.5 }));
  cab.position.set(0.9, 0.75, 0); slew.add(cab);
  const jib = new THREE.Mesh(new THREE.BoxGeometry(34, 0.5, 0.5), latMat); jib.position.set(12, 1.6, 0); slew.add(jib);
  for (let jx = -2; jx < 28; jx += 3) {
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.3, 0.08), latMat);
    tie.position.set(jx, 0.95, 0); slew.add(tie);
  }
  const apex = new THREE.Mesh(new THREE.BoxGeometry(0.16, 5, 0.16), latMat); apex.position.set(0, 4, 0); slew.add(apex);
  const tie1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 16, 5), darkSteel);
  tie1.position.set(8, 4.2, 0); tie1.rotation.z = 1.24; slew.add(tie1);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, 0.9), darkSteel); counter.position.set(-6.5, 1.4, 0); slew.add(counter);
  const cwt = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 1.4), concreteMat); cwt.position.set(-9.5, 0.9, 0); slew.add(cwt);
  const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 15, 5), darkSteel); cable.position.set(17, -6, 0); slew.add(cable);
  const hook = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.5), darkSteel); hook.position.set(17, -13.7, 0); slew.add(hook);
  // hanging steel bundle
  const load = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const lb = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 0.4), steel);
    lb.position.set(0, -i * 0.32, (i - 1) * 0.45); load.add(lb);
  }
  load.position.set(17, -14.4, 0); slew.add(load);
  shadowAll(slew); slew.position.y = MAST_H; crane.add(slew);
  crane.position.set(-27, 0, -17); scene.add(crane);

  // ---- jobsite: trailer, fence, cones, dumpster, stock
  const trailer = new THREE.Group();
  const tBody = new THREE.Mesh(new THREE.BoxGeometry(7, 2.9, 3), new THREE.MeshStandardMaterial({ color: 0xdcd9d0, roughness: 0.7 }));
  tBody.position.y = 1.95; trailer.add(tBody);
  const tStripe = new THREE.Mesh(new THREE.BoxGeometry(7.02, 0.5, 3.02), new THREE.MeshStandardMaterial({ color: 0x4a5258, roughness: 0.7 }));
  tStripe.position.y = 3.1; trailer.add(tStripe);
  const tDoor = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.9), new THREE.MeshStandardMaterial({ color: 0x3a4147, roughness: 0.8 }));
  tDoor.position.set(-1.6, 1.55, 1.52); trailer.add(tDoor);
  [[0.6], [2.2]].forEach(([wx]) => {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x6f8893, roughness: 0.2, metalness: 0.4 }));
    win.position.set(wx, 2.2, 1.52); trailer.add(win);
  });
  const ac = new THREE.Mesh(new THREE.BoxGeometry(1, 0.6, 1), new THREE.MeshStandardMaterial({ color: 0xb9bcb6, roughness: 0.6 }));
  ac.position.set(2.4, 3.65, 0); trailer.add(ac);
  const steps = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.9), darkSteel); steps.position.set(-1.6, 0.25, 2.1); trailer.add(steps);
  shadowAll(trailer); trailer.position.set(24, 0, 20); trailer.rotation.y = -0.35; scene.add(trailer);

  // perimeter fence (two visible runs)
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a3, transparent: true, opacity: 0.22, side: THREE.DoubleSide, roughness: 0.8 });
  const postMatF = new THREE.MeshStandardMaterial({ color: 0x7d8388, roughness: 0.5, metalness: 0.7 });
  function fenceRun(x1, z1, x2, z2) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const segs = Math.round(len / 3.2);
    for (let s = 0; s <= segs; s++) {
      const px = x1 + (x2 - x1) * (s / segs), pz = z1 + (z2 - z1) * (s / segs);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.1, 6), postMatF);
      post.position.set(px, 1.05, pz); scene.add(post);
    }
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, 1.9), fenceMat);
    panel.position.set((x1 + x2) / 2, 1.05, (z1 + z2) / 2);
    panel.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    scene.add(panel);
  }
  fenceRun(-38, 26, 38, 26);
  fenceRun(38, 26, 38, -20);

  // cones near the gate
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xd1622a, roughness: 0.6 });
  [[8, 23], [10.5, 24], [13, 22.6], [5.5, 24.4], [16, 23.8]].forEach(([cx, cz]) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.85, 12), coneMat);
    cone.position.set(cx, 0.42, cz); cone.castShadow = true; scene.add(cone);
    const cBase = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.7), coneMat);
    cBase.position.set(cx, 0.03, cz); scene.add(cBase);
  });

  // dumpster
  const dump = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.8, 2.2), new THREE.MeshStandardMaterial({ color: 0x47543f, roughness: 0.8 }));
  dump.position.set(27, 0.9, 6); dump.castShadow = true; dump.receiveShadow = true; scene.add(dump);

  // material stock
  const stock = new THREE.Group();
  for (let i = 0; i < 4; i++) { const beam = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 0.6), steel); beam.position.set(0, 0.3 + (i % 2) * 0.55, -0.8 - i * 0.7); beam.castShadow = true; beam.receiveShadow = true; stock.add(beam); }
  stock.position.set(20, 0, 14); stock.rotation.y = 0.4; scene.add(stock);
  for (let p = 0; p < 3; p++) { const pal = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 2.4), new THREE.MeshStandardMaterial({ color: 0x8a8378, roughness: 0.9 })); pal.position.set(13 + p * 3, 0.8, 18); pal.castShadow = true; pal.receiveShadow = true; scene.add(pal); }

  // distant city massing fading into the overcast haze
  const cityMat = new THREE.MeshStandardMaterial({ color: 0xaeb6b9, roughness: 1 });
  [[-58, 26, 10, -70], [-30, 38, 14, -84], [4, 30, 12, -78], [34, 44, 16, -90], [62, 24, 11, -72], [88, 34, 13, -82]].forEach(([bx, bh, bw, bz]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bw), cityMat);
    b.position.set(bx, bh / 2, bz); scene.add(b);
  });

  const motes = makeMotes(80, { x: 60, y: 28, z: 50 }, 0xdfe7ea, 0.06);
  motes.position.y = 8; scene.add(motes);

  return {
    scene, exposure: 0.9,
    env: { top: "#aab4ba", horizon: "#c8ccd0", bottom: "#8f9598", sun: null, intensity: 0.5 },
    from: { pos: [32, 6, 36], tgt: [0, 11, 0] },
    to: { pos: [16, 26, 27], tgt: [-4, 13, -5] },
    update(dt, t) {
      motes.rotation.y = t * 0.01;
      slew.rotation.y = Math.sin(t * 0.05) * 0.4;
      load.position.y = -14.4 + Math.sin(t * 0.5) * 0.15;
      hook.position.y = -13.7 + Math.sin(t * 0.5) * 0.15;
    }
  };
}

/* =====================================================================
   WORLD — single renderer + scene switching + scroll/pointer camera
   ===================================================================== */
class World {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    // cap device pixel ratio lower on phones — a fixed fullscreen WebGL canvas at
    // 3x DPR is the main source of mobile jank/battery drain
    const _maxDPR = (window.matchMedia && window.matchMedia("(max-width: 860px)").matches) ? 1.5 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, _maxDPR));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Prefiltered image-based lighting — gives metals, glass, water and polished
    // floors real reflections + soft ambient instead of flat shading.
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.pmrem.compileEquirectangularShader();

    // crossfade infra — freeze the outgoing scene to a render target and dissolve
    // into the incoming one (smooths the section-to-section transitions)
    const dpr0 = this.renderer.getPixelRatio();
    this.fadeRT = new THREE.WebGLRenderTarget(
      Math.max(1, Math.floor(window.innerWidth * dpr0)),
      Math.max(1, Math.floor(window.innerHeight * dpr0)),
      { depthBuffer: true }
    );
    this.fadeRT.texture.colorSpace = THREE.SRGBColorSpace;
    this.fadeScene = new THREE.Scene();
    this.fadeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.fadeQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: this.fadeRT.texture, transparent: true, depthTest: false, depthWrite: false })
    );
    this.fadeQuad.material.toneMapped = false;
    this.fadeScene.add(this.fadeQuad);
    this.fadeAlpha = 0; this.fadeDur = 0.55;

    this.camera = new THREE.PerspectiveCamera(46, 1, 0.1, 300);
    this.builders = { hero: buildHero, residential: buildResidential, investment: buildInvestment, commercial: buildCommercial };
    this.scenes = {};
    this.current = null;
    this.progress = 0;
    this.targetProgress = 0;
    this.pointer = { x: 0, y: 0 };
    this.pointerT = { x: 0, y: 0 };
    this.active = true;
    this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.clock = new THREE.Clock();
    this._tmpPos = new THREE.Vector3();
    this._tmpTgt = new THREE.Vector3();

    this.resize();
    window.addEventListener("resize", () => this.resize());
    if (!this.reduce) {
      window.addEventListener("pointermove", (e) => {
        this.pointerT.x = (e.clientX / window.innerWidth - 0.5);
        this.pointerT.y = (e.clientY / window.innerHeight - 0.5);
      }, { passive: true });
    }
    this.setScene("hero");
    this._loop = this._loop.bind(this);
    this._render(0);
    requestAnimationFrame(this._loop);
    this._prewarm();
  }

  // Build + compile the other scenes during idle time so the first time the user
  // scrolls into one there's no build/compile hitch (a common cause of hard cuts).
  _prewarm() {
    const keys = Object.keys(this.builders).filter((k) => k !== this.currentKey);
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 250));
    let i = 0;
    const step = () => {
      if (i >= keys.length) return;
      try {
        const s = this.ensure(keys[i]);
        this.renderer.compile(s.scene, this.camera);
      } catch (e) { /* prewarm is best-effort */ }
      i++;
      idle(step);
    };
    idle(step);
  }

  ensure(key) {
    if (!this.scenes[key]) {
      this.scenes[key] = this.builders[key]();
      this._applyEnv(this.scenes[key]);
    }
    return this.scenes[key];
  }

  // Build a prefiltered environment from the scene's tonal spec and apply it as
  // image-based lighting + a per-scene reflection intensity. Purely additive —
  // a failure here must never stop the scene from rendering.
  _applyEnv(s) {
    if (!s || s._envApplied) return;
    s._envApplied = true;
    if (!s.env || !this.pmrem) return;
    try {
      const eq = equirectEnv(s.env);
      const rt = this.pmrem.fromEquirectangular(eq);
      s.scene.environment = rt.texture;
      eq.dispose();
      const ei = s.env.intensity == null ? 1 : s.env.intensity;
      s.scene.traverse((o) => {
        if (!o.isMesh || !o.material) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((m) => { if ("envMapIntensity" in m) m.envMapIntensity = ei; });
      });
    } catch (e) { /* env is an enhancement; ignore */ }
  }

  setScene(key) {
    if (this.currentKey === key) return;
    // freeze the outgoing scene into the fade target, then dissolve to the new one
    if (this.current && this.fadeRT) {
      try {
        this.renderer.setRenderTarget(this.fadeRT);
        this.renderer.clear();
        this.renderer.render(this.current.scene, this.camera);
        this.renderer.setRenderTarget(null);
        this.fadeQuad.material.map = this.fadeRT.texture;
        this.fadeAlpha = 1;
      } catch (e) { this.fadeAlpha = 0; this.renderer.setRenderTarget(null); }
    }
    this.currentKey = key;
    this.current = this.ensure(key);
    this.renderer.toneMappingExposure = this.current.exposure || 1;
    this.progress = this.targetProgress; // snap on scene change — the dissolve covers it
    this._needsRender = true;
  }

  setProgress(p) { this.targetProgress = clamp(p, 0, 1); }
  setActive(b) {
    if (b && !this.active) this.progress = this.targetProgress;
    this.active = b;
    if (b) this._needsRender = true;
  }

  renderNow() {
    this.progress = this.targetProgress;
    this.pointer.x = this.pointerT.x; this.pointer.y = this.pointerT.y;
    this._render(0);
  }

  _render(dt) {
    if (!this.current) return;
    const t = this.clock.elapsedTime;
    try {
      if (this.current.update && !this.reduce) this.current.update(dt, t, ease(this.progress));
      this._applyCamera();
      this.renderer.render(this.current.scene, this.camera);
      // dissolve the frozen previous scene out over the top
      if (this.fadeAlpha > 0) {
        const ac = this.renderer.autoClear;
        this.renderer.autoClear = false;
        this.fadeQuad.material.opacity = this.fadeAlpha;
        this.renderer.render(this.fadeScene, this.fadeCam);
        this.renderer.autoClear = ac;
        this.fadeAlpha = Math.max(0, this.fadeAlpha - (dt || 0.016) / this.fadeDur);
      }
      this.frames = (this.frames || 0) + 1;
    } catch (e) { this.lastError = e.message + " | " + (e.stack || "").split("\n")[1]; }
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.fadeRT) {
      const dpr = this.renderer.getPixelRatio();
      this.fadeRT.setSize(Math.max(1, Math.floor(w * dpr)), Math.max(1, Math.floor(h * dpr)));
    }
    this._needsRender = true;
  }

  _applyCamera() {
    const s = this.current; if (!s) return;
    const p = ease(this.progress);
    const f = s.from, t = s.to;
    this._tmpPos.set(lerp(f.pos[0], t.pos[0], p), lerp(f.pos[1], t.pos[1], p), lerp(f.pos[2], t.pos[2], p));
    this._tmpTgt.set(lerp(f.tgt[0], t.tgt[0], p), lerp(f.tgt[1], t.tgt[1], p), lerp(f.tgt[2], t.tgt[2], p));
    const px = this.pointer.x, py = this.pointer.y;
    this._tmpPos.x += px * 1.6;
    this._tmpPos.y += -py * 1.0;
    this.camera.position.copy(this._tmpPos);
    this.camera.lookAt(this._tmpTgt);
  }

  _loop() {
    requestAnimationFrame(this._loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (!this.active) return;
    this.progress += (this.targetProgress - this.progress) * 0.12;
    this.pointer.x += (this.pointerT.x - this.pointer.x) * 0.06;
    this.pointer.y += (this.pointerT.y - this.pointer.y) * 0.06;
    this._render(dt);
  }
}

/* public API */
window.CCWorld = {
  instance: null,
  init(canvas) {
    try {
      this.instance = new World(canvas);
      return this.instance;
    } catch (e) {
      console.warn("[CCWorld] WebGL init failed:", e);
      document.documentElement.classList.add("no-webgl");
      return null;
    }
  }
};
