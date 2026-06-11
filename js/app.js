/* =====================================================================
   C&C ASSET ADVISORS — behavior & 3D scroll controller
   ===================================================================== */
(function () {
  const CC = window.CC;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  let inited = false;
  /* If a CSS transition never advances (throttled/embedded contexts can freeze
     the animation timeline), force the revealed end state so nothing stays hidden. */
  function settleVisible(el, delay = 1500) {
    setTimeout(() => {
      if (getComputedStyle(el).opacity === "0") {
        el.style.transition = "none";
        el.style.opacity = "1";
        el.style.transform = "none";
      }
    }, delay);
  }

  function init() {
    if (inited) return; inited = true;
    buildNav();
    initReveals();
    initArc();
    initContact();
    initTeamOverlay();
    initDoors();
    initPdfLinks();
    initWorldController();
    // entrance
    requestAnimationFrame(() => {
      document.querySelectorAll(".hero-line").forEach((l, i) => setTimeout(() => { l.classList.add("in"); settleVisible(l); }, 180 + i * 110));
    });
  }

  /* ---------------- NAV ---------------- */
  function buildNav() {
    const nav = document.getElementById("nav");
    nav.innerHTML = `
      <a href="#hero" class="brand" aria-label="C&C Asset Advisors — home">
        <span class="brand-mark">C<i>&amp;</i>C</span>
        <span class="brand-sub">Asset<br>Advisors</span>
      </a>
      <div class="nav-links" id="navLinks">
        <a href="#practice" class="nav-link">Practice</a>
        <a href="#team" class="nav-link">Team</a>
        <a href="#philosophy" class="nav-link">Approach</a>
        <a href="#insights" class="nav-link">Perspective</a>
        <a href="#contact" class="nav-cta">Contact</a>
      </div>
      <button class="nav-burger" id="burger" aria-label="Menu"><span></span><span></span><span></span></button>`;
    const burger = document.getElementById("burger");
    const links = document.getElementById("navLinks");
    burger.addEventListener("click", () => { burger.classList.toggle("open"); links.classList.toggle("open"); });
    links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => { burger.classList.remove("open"); links.classList.remove("open"); }));
  }

  /* ---------------- REVEAL ---------------- */
  function initReveals() {
    document.documentElement.classList.add("anim-ok");
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); settleVisible(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    // Backstop: never let near-viewport content stay hidden if IO/rAF misbehaves.
    const revealNear = () => document.querySelectorAll(".reveal:not(.in)").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.95 && r.bottom > 0) { el.classList.add("in"); settleVisible(el); }
    });
    window.addEventListener("scroll", revealNear, { passive: true });
    setTimeout(revealNear, 1600);
  }

  /* ---------------- ARC autoplay ---------------- */
  function initArc() {
    const nodes = [...document.querySelectorAll(".anode")];
    const fill = document.querySelector(".arc-rail-fill");
    if (!nodes.length) return;
    let active = 0, paused = false, vis = false, timer = null;
    const set = (i) => {
      active = i;
      nodes.forEach((n, k) => { n.classList.toggle("active", k === i); n.classList.toggle("passed", k <= i); });
      if (fill) fill.style.width = (i / (nodes.length - 1)) * 100 + "%";
    };
    const tick = () => { if (!paused && vis) set((active + 1) % nodes.length); };
    nodes.forEach((n, i) => { n.addEventListener("mouseenter", () => { paused = true; set(i); }); n.addEventListener("focus", () => { paused = true; set(i); }); });
    const arc = document.querySelector(".arc");
    arc.addEventListener("mouseleave", () => { paused = false; });
    new IntersectionObserver((es) => es.forEach((e) => { vis = e.isIntersecting; if (vis) set(active); }), { threshold: 0.3 }).observe(arc);
    timer = setInterval(tick, 2800);
    set(0);
  }

  /* ---------------- CONTACT ---------------- */
  function initContact() {
    const form = document.querySelector(".ct-form");
    if (!form) return;
    const paths = [...document.querySelectorAll(".ct-path")];
    const kicker = document.querySelector("[data-form-kicker]");
    const q = document.querySelector("[data-form-q]");
    const setPath = (id) => {
      const p = CC.CONTACT.find((x) => x.id === id) || CC.CONTACT[0];
      paths.forEach((b) => b.classList.toggle("on", b.dataset.path === id));
      kicker.textContent = p.label + " inquiry";
      q.textContent = p.q;
    };
    paths.forEach((b) => b.addEventListener("click", () => setPath(b.dataset.path)));
    document.querySelectorAll("[data-prefill]").forEach((a) => a.addEventListener("click", () => setPath(a.dataset.prefill)));
    // Tailored brief composer → contact form, prefilled with asset class + area
    document.querySelectorAll("[data-request-brief]").forEach((a) => a.addEventListener("click", () => {
      const cls = (document.querySelector("[data-req-class]") || {}).value || "Residential";
      const area = (document.querySelector("[data-req-area]") || {}).value || "All of DFW";
      const pathMap = { "Residential": "residential", "Multifamily": "investment", "Land & Development": "investment", "Industrial": "commercial", "Office": "commercial", "Retail": "commercial", "Mixed-use / Other": "commercial" };
      setPath(pathMap[cls] || "residential");
      if (form.note) form.note.value = "Requesting a tailored C&C Market Notes brief — Asset class: " + cls + " · Area: " + area + ".";
    }));

    const INBOX = "dalton@ccassetadvisors.com";
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name, email = form.email;
      let ok = true;
      name.classList.remove("bad"); email.classList.remove("bad");
      if (!name.value.trim()) { name.classList.add("bad"); ok = false; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) { email.classList.add("bad"); ok = false; }
      if (!ok) return;
      const wrap = form.closest(".ct-form-wrap");
      const first = name.value.trim().split(" ")[0] || "—";
      const label = (CC.CONTACT.find((x) => paths.find((b) => b.classList.contains("on") && b.dataset.path === x.id)) || CC.CONTACT[0]).label;
      const btn = form.querySelector('button[type="submit"]');
      const btnHTML = btn.innerHTML;
      btn.disabled = true; btn.textContent = "Sending…";
      const sent = () => {
        wrap.innerHTML = `<div class="ct-sent"><span class="serif italic" style="font-size:26px;color:var(--gold-soft)">✓</span>
          <h3 class="h2" style="color:var(--on-ink);margin:16px 0 12px">Thank you, ${first}.</h3>
          <p class="lede" style="color:var(--on-ink-soft)">Your ${label.toLowerCase()} note is in. The right person at C&amp;C will reach out personally.</p></div>`;
      };
      try {
        const r = await fetch("https://formsubmit.co/ajax/" + INBOX, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({
            name: name.value.trim(),
            email: email.value.trim(),
            inquiry: label,
            message: form.note.value.trim() || "(no note)",
            _subject: "C&C website inquiry — " + label,
            _template: "table",
            _captcha: "false"
          })
        });
        if (!r.ok) throw new Error("send failed");
        sent();
      } catch (err) {
        // Fallback: hand off to the visitor's own mail app, pre-addressed.
        btn.disabled = false; btn.innerHTML = btnHTML;
        let note = form.querySelector(".ct-send-fail");
        if (!note) {
          note = document.createElement("p");
          note.className = "body-sm ct-send-fail";
          note.style.cssText = "color:var(--gold-soft);margin-top:14px";
          btn.insertAdjacentElement("afterend", note);
        }
        const mailto = "mailto:" + INBOX +
          "?subject=" + encodeURIComponent("C&C website inquiry — " + label) +
          "&body=" + encodeURIComponent(form.note.value.trim() + "\n\n— " + name.value.trim() + " (" + email.value.trim() + ")");
        note.innerHTML = `We couldn't send that automatically — <a href="${mailto}" style="color:var(--gold-soft);text-decoration:underline">email us directly</a> instead.`;
      }
    });
  }

  /* ---------------- PDF links — new tab, with sandboxed-preview fallback ---------------- */
  function initPdfLinks() {
    document.querySelectorAll('a[href$=".pdf"][target="_blank"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const w = window.open(a.href, "_blank", "noopener");
        if (w) return;
        // Pop-out blocked (e.g. embedded preview) — hand the file over as a download instead.
        fetch(a.href).then((r) => r.blob()).then((b) => {
          const url = URL.createObjectURL(b);
          const t = document.createElement("a");
          t.href = url; t.download = decodeURIComponent(a.href.split("/").pop());
          document.body.appendChild(t); t.click(); t.remove();
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        }).catch(() => { location.href = a.href; });
      });
    });
  }

  /* ---------------- PRACTICE INDEX → jump to division ---------------- */
  function initDoors() {
    document.querySelectorAll("[data-open]").forEach((d) => {
      d.addEventListener("click", () => {
        const t = document.getElementById("div-" + d.dataset.open);
        if (t) window.scrollTo({ top: t.offsetTop + window.innerHeight * 0.05, behavior: "smooth" });
      });
    });
  }

  /* ---------------- TEAM profile overlay ---------------- */
  function initTeamOverlay() {
    const ov = document.getElementById("overlay");
    const team = CC.TEAM;
    let openIdx = -1;
    const render = (i) => {
      const p = team[i];
      ov.querySelector(".ov-body").innerHTML = `
        <div class="wrap pfc">
          <div class="pfc-head">
            <div class="pfc-portrait"><image-slot id="portrait-${p.id}" shape="rect" src="assets/img/portrait-${p.id}.jpg" placeholder="Drop ${p.name}'s portrait"></image-slot></div>
            <div class="pfc-intro">
              <span class="kicker" style="color:var(--gold-soft)">${p.focus}</span>
              <h2 class="h1" style="color:var(--on-ink);margin:14px 0 6px">${p.fullName}</h2>
              <p class="lede" style="color:var(--on-ink-soft)">${p.title}</p>
              <a class="pfc-mail" href="mailto:${p.email}">${p.email}</a>
              <div class="pfc-creds">${p.credentials.map((c) => `<span class="cred">${c}</span>`).join("")}</div>
            </div>
          </div>
          <div class="pfc-bio">${p.bio.map((b) => `<p class="body-lg" style="color:var(--on-ink-soft);margin-bottom:18px">${b}</p>`).join("")}</div>
        </div>`;
      ov.querySelectorAll("[data-pdot]").forEach((b, k) => b.classList.toggle("on", k === i));
    };
    const open = (i) => { openIdx = i; render(i); ov.classList.add("open"); document.body.style.overflow = "hidden"; ov.querySelector(".ov-scroll").scrollTop = 0; };
    const close = () => { openIdx = -1; ov.classList.remove("open"); document.body.style.overflow = ""; };
    const nav = (dir) => { if (openIdx < 0) return; open((openIdx + dir + team.length) % team.length); };

    ov.innerHTML = `
      <div class="ov-backdrop"></div>
      <div class="ov-panel" role="dialog" aria-modal="true">
        <div class="ov-bar">
          <span class="kicker" style="color:var(--gold-soft)">C&amp;C · Senior Team</span>
          <div class="ov-nav">
            ${team.map((t) => `<button class="ov-dot" data-pdot aria-label="${t.fullName}"><span class="label">${t.name}</span></button>`).join("")}
            <button class="ov-close" aria-label="Close"><span>Close</span><span class="ov-x">✕</span></button>
          </div>
        </div>
        <div class="ov-scroll"><div class="ov-body"></div></div>
      </div>`;
    ov.querySelector(".ov-backdrop").addEventListener("click", close);
    ov.querySelector(".ov-close").addEventListener("click", close);
    ov.querySelectorAll("[data-pdot]").forEach((b, k) => b.addEventListener("click", () => open(k)));
    document.querySelectorAll(".pcard[data-person]").forEach((c) => {
      const i = team.findIndex((t) => t.id === c.dataset.person);
      c.addEventListener("click", (e) => {
        // A plain click on the portrait opens the profile, but let the
        // slot's own controls (Replace/Remove, browse, reframe) win.
        const path = e.composedPath ? e.composedPath() : [];
        for (const n of path) {
          if (!n || n.nodeType !== 1) continue;
          if (n.tagName === "BUTTON" || n.tagName === "INPUT") return;
          if (n.classList && (n.classList.contains("empty") || n.classList.contains("ctl") || n.classList.contains("spill"))) return;
          if (n.tagName === "IMAGE-SLOT" && n.hasAttribute("data-reframe")) return;
        }
        open(i);
      });
      c.addEventListener("keydown", (e) => { if (e.key === "Enter") open(i); });
    });
    window.addEventListener("keydown", (e) => {
      if (!ov.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") nav(1);
      if (e.key === "ArrowLeft") nav(-1);
    });
  }

  /* ---------------- 3D WORLD + scroll controller ---------------- */
  function initWorldController() {
    const canvas = document.getElementById("world");
    const nav = document.getElementById("nav");
    let world = null;

    function ensureWorld() {
      if (!world && window.CCWorld) world = window.CCWorld.init(canvas);
      return world;
    }
    if (!window.CCWorld) {
      let n = 0;
      const t = setInterval(() => { if (window.CCWorld || n++ > 150) { clearInterval(t); ensureWorld(); update(); } }, 20);
    } else ensureWorld();

    // immersive zones (have a scene)
    const zones = [...document.querySelectorAll("[data-world]")].map((el) => ({ el, scene: el.getAttribute("data-world") }));

    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        update();
      });
    };

    function update() {
      const vh = window.innerHeight;
      const mid = window.scrollY + vh * 0.5;

      // choose active zone = last zone whose top has passed mid-viewport
      let active = zones[0], activeIdx = 0;
      zones.forEach((z, i) => { if (z.el.offsetTop <= mid) { active = z; activeIdx = i; } });

      // active zone always drives the (always-visible) canvas; opaque sections cover it

      // progress within the active zone
      const top = active.el.offsetTop;
      const h = active.el.offsetHeight;
      const denom = Math.max(h - vh, vh * 0.5);
      const p = clamp((window.scrollY - top) / denom, 0, 1);

      if (world) { world.setProgress(p); world.setScene(active.scene); }

      // pause the render loop while no immersive section is on-screen (perf)
      const ar = active.el.getBoundingClientRect();
      if (world) world.setActive(ar.bottom > 0 && ar.top < vh);

      // division stage cross-dissolve
      if (active.el.classList.contains("division")) setStages(active.el, p);

      // nav appearance: solid after scroll; light text over paper sections
      nav.classList.toggle("solid", window.scrollY > 80);
      // determine if nav overlaps a light (paper) section
      const navOverPaper = isPaperAtTop();
      nav.classList.toggle("on-light", navOverPaper);
    }

    function setStages(section, p) {
      const stages = section.querySelectorAll(".div-stage"); // [title, points, serve]
      // mobile stacks all stages — keep them all visible
      if (!window.matchMedia("(min-width:861px)").matches) {
        stages.forEach((s) => { s.style.opacity = ""; s.style.pointerEvents = ""; });
        return;
      }
      const ss = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
      const aP = ss(p, 0.30, 0.42);   // title -> points
      const aS = ss(p, 0.64, 0.76);   // points -> serve
      const o = [1 - aP, aP * (1 - aS), aS];
      stages.forEach((s, i) => { s.style.opacity = o[i].toFixed(3); s.style.pointerEvents = o[i] > 0.5 ? "auto" : "none"; });
    }

    function isPaperAtTop() {
      // sample element under the nav center
      const x = window.innerWidth / 2, y = 28;
      const els = document.elementsFromPoint(x, y);
      for (const el of els) {
        const sec = el.closest("section,footer");
        if (!sec) continue;
        if (sec.classList.contains("div-light")) return true;
        if (sec.classList.contains("paper-section") || sec.classList.contains("paper-cool") || sec.classList.contains("paper-warm") || sec.id === "team") return true;
        if (sec.classList.contains("ink-section") || sec.classList.contains("division") || sec.classList.contains("interstitial") || sec.classList.contains("footer") || sec.id === "hero") return false;
      }
      return false;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("cc:built", init, { once: true });
})();
