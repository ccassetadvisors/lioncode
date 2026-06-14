/* =====================================================================
   C&C ASSET ADVISORS — deep-page router
   The one-page scroll stays the front door; #/<id> opens a dedicated,
   deeper page (SEO + room for depth). Hash routing so it works as static
   files anywhere and keeps the single-file preview intact.
   ===================================================================== */
(function () {
  const CC = window.CC; if (!CC) return;
  const esc = (s) => (s == null ? "" : String(s)).replace(/&/g, "&amp;");
  const initials = (full) => full.split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
  const portraitPH = (p) => `
        <div class="portrait-ph" aria-hidden="true">
          <span class="portrait-ph-kicker">C<i>&amp;</i>C Asset Advisors</span>
          <span class="portrait-ph-mono">${initials(p.fullName)}</span>
          <span class="portrait-ph-name">${esc(p.fullName)}</span>
        </div>`;
  const deepBack = `<a class="deep-back" href="#/"><span class="arrow">←</span> C<i>&amp;</i>C Asset Advisors</a>`;

  const mount = document.createElement("main");
  mount.className = "deep"; mount.id = "deep";
  document.body.appendChild(mount);

  /* ---- a data-driven practice page (Residential / Investment / Commercial) ---- */
  function practicePage(d) {
    const pts = d.points.map((p, i) => `
      <div class="std-item reveal d${i + 1}"><span class="std-num">${String(i + 1).padStart(2, "0")}</span><h3 class="h3">${esc(p.h)}</h3><p class="body">${esc(p.p)}</p></div>`).join("");
    const serves = d.services.map((s) => `<li>${esc(s)}</li>`).join("");
    return `
      <section class="deep-hero ink-section on-dark section-pad">
        <span class="deep-ghost serif" aria-hidden="true">${esc(d.rn)}</span>
        <div class="wrap">
          <a class="deep-back" href="#/"><span class="arrow">←</span> C<i>&amp;</i>C Asset Advisors</a>
          <div class="eyebrow-row" style="margin-bottom:18px"><span class="dot"></span><span class="label" style="color:var(--gold-soft)">Practice ${esc(d.rn)} — ${esc(d.name)}</span></div>
          <h1 class="display" style="color:var(--on-ink)">${esc(d.name)}.</h1>
          <span class="div-tag" style="position:relative">${esc(d.tag)}</span>
          <p class="lede measure-lg" style="color:var(--on-ink-soft);margin-top:26px">${esc(d.statement)}</p>
          <div class="hero-actions">
            <a href="#contact" class="btn btn-solid">${esc(d.cta)} <span class="arrow">→</span></a>
            <a href="#/" class="btn btn-outline">Back to overview</a>
          </div>
        </div>
      </section>
      <section class="section-pad paper-section paper-arch">
        <div class="wrap">
          <div class="sec-head reveal"><span class="kicker-dot"></span><span class="kicker">How we work</span><span class="sec-rule"></span><span class="sec-num serif italic">${esc(d.rn)}</span></div>
          <div class="std-grid">${pts}</div>
          <div class="std-close reveal" style="margin-top:clamp(44px,6vw,80px)">
            <span class="label" style="color:var(--taupe)">What we handle</span>
            <ul class="dp-serve">${serves}</ul>
          </div>
          <div class="reveal" style="margin-top:clamp(44px,6vw,80px)">
            <a href="#contact" class="btn btn-solid">${esc(d.cta)} <span class="arrow">→</span></a>
          </div>
        </div>
      </section>`;
  }

  /* ---- the full team page ---- */
  function teamPage() {
    const cards = CC.TEAM.map((p, i) => `
      <article class="dp-member reveal d${i + 1}">
        <div class="dp-member-portrait">${portraitPH(p)}<image-slot class="portrait-slot" id="deep-portrait-${p.id}" shape="rect" src="assets/img/portrait-${p.id}.jpg" placeholder="Drop ${esc(p.name)}'s portrait"></image-slot></div>
        <div class="dp-member-body">
          <span class="kicker" style="color:var(--gold-deep)">${esc(p.focus)}</span>
          <h2 class="h2" style="margin:10px 0 6px">${esc(p.fullName)}</h2>
          <p class="lede" style="color:var(--ink-3)">${esc(p.title)}</p>
          <div class="pfc-creds" style="margin-top:18px">${p.credentials.map((c) => `<span class="cred" style="color:var(--taupe);border-color:var(--line-2)">${esc(c)}</span>`).join("")}</div>
          ${p.bio.map((b) => `<p class="body-lg" style="margin-top:16px">${esc(b)}</p>`).join("")}
          <a class="link-u" style="margin-top:20px" href="mailto:${p.email}">${esc(p.email)} <span class="arrow">→</span></a>
        </div>
      </article>`).join("");
    return `
      <section class="deep-hero ink-section on-dark section-pad">
        <span class="deep-ghost serif" aria-hidden="true">II</span>
        <div class="wrap">
          ${deepBack}
          <div class="eyebrow-row" style="margin-bottom:18px"><span class="dot"></span><span class="label" style="color:var(--gold-soft)">The team</span></div>
          <h1 class="display" style="color:var(--on-ink)">The whole firm,<br>at one <span class="serif italic" style="color:var(--gold-soft)">table.</span></h1>
          <p class="lede measure-lg" style="color:var(--on-ink-soft);margin-top:26px">${esc(CC.TEAM_INTRO)}</p>
        </div>
      </section>
      <section class="section-pad paper-section paper-arch">
        <div class="wrap">
          <div class="dp-members">${cards}</div>
          <div class="std-close reveal" style="margin-top:clamp(44px,6vw,80px)"><span class="label" style="color:var(--taupe)">And a wider bench</span><p class="lede measure-lg" style="margin-top:12px">${esc(CC.TEAM_NOTE)}</p></div>
          <div class="reveal" style="margin-top:clamp(36px,5vw,64px)"><a href="#contact" class="btn btn-solid">Begin the conversation <span class="arrow">→</span></a></div>
        </div>
      </section>`;
  }

  /* ---- the full approach page ---- */
  function approachPage() {
    const items = CC.STANDARD.map((t, i) => `
      <div class="std-item reveal d${i + 1}"><span class="std-num">${t.k}</span><h3 class="h3">${esc(t.t)}</h3><p class="body">${esc(t.d)}</p></div>`).join("");
    return `
      <section class="deep-hero ink-section on-dark section-pad">
        <span class="deep-ghost serif" aria-hidden="true">III</span>
        <div class="wrap">
          ${deepBack}
          <div class="eyebrow-row" style="margin-bottom:18px"><span class="dot"></span><span class="label" style="color:var(--gold-soft)">How we operate</span></div>
          <h1 class="display" style="color:var(--on-ink)">A firm built to <span class="serif italic" style="color:var(--gold-soft)">last.</span></h1>
          <p class="lede measure-lg" style="color:var(--on-ink-soft);margin-top:26px">${esc(CC.STANDARD_STATEMENT)}</p>
        </div>
      </section>
      <section class="section-pad paper-section paper-arch">
        <div class="wrap">
          <div class="std-grid">${items}</div>
          <div class="std-close reveal" style="margin-top:clamp(48px,6vw,88px)"><p class="lede pull" style="max-width:40rem">${esc(CC.STANDARD_CLOSE)
            .replace("telos", '<span class="serif italic gold-text">telos</span>')
            .replace("aligned flourishing.", '<span class="serif italic gold-text" style="border-bottom:1.5px solid var(--line-gold);padding-bottom:2px">aligned flourishing.</span>')}</p></div>
          <div class="reveal" style="margin-top:clamp(36px,5vw,64px)"><a href="#contact" class="btn btn-solid">Begin the conversation <span class="arrow">→</span></a></div>
        </div>
      </section>`;
  }

  /* ---- the full perspective page ---- */
  function perspectivePage() {
    const lanes = [
      { aud: "Residential", line: "The work, in pictures — homes worth pausing on.", to: "Instagram", href: "#contact" },
      { aud: "Investment & Commercial", line: "Notes and observations for investors and operators.", to: "LinkedIn", href: "https://www.linkedin.com/company/ccassetadvisors/" }
    ].map((c, i) => `
      <a class="ins-lane reveal d${i + 1}" href="${c.href}"${c.href.indexOf("http") === 0 ? ' target="_blank" rel="noopener"' : ""}>
        <span class="ins-lane-aud label" style="color:var(--taupe)">${esc(c.aud)}</span>
        <span class="ins-lane-line">${esc(c.line)}</span>
        <span class="ins-lane-to link-u">${esc(c.to)} <span class="arrow">→</span></span>
      </a>`).join("");
    return `
      <section class="deep-hero ink-section on-dark section-pad">
        <span class="deep-ghost serif" aria-hidden="true">IV</span>
        <div class="wrap">
          ${deepBack}
          <div class="eyebrow-row" style="margin-bottom:18px"><span class="dot"></span><span class="label" style="color:var(--gold-soft)">Perspective</span></div>
          <h1 class="display" style="color:var(--on-ink)">The DFW market,<br><span class="serif italic" style="color:var(--gold-soft)">read closely.</span></h1>
          <p class="lede measure-lg" style="color:var(--on-ink-soft);margin-top:26px">C&amp;C Market Notes — an in-depth read across Dallas–Fort Worth and every asset class: where capital is moving, what it costs to build, and where value is forming. From operators active in the market, not commentators watching it.</p>
        </div>
      </section>
      <section class="section-pad paper-cool paper-arch">
        <div class="wrap">
          <div class="ins-feature">
            <div class="reveal">
              <span class="label label-sm" style="color:var(--gold-deep)">Sample edition — June 2026</span>
              <h2 class="h2" style="margin-top:12px">DFW Real Estate Intelligence Brief.</h2>
              <p class="lede measure" style="margin-top:18px">Residential, commercial &amp; investment — a closely-read snapshot of where the metroplex is moving.</p>
              <a href="reports/dfw-intelligence-brief-june-2026.pdf" target="_blank" rel="noopener" class="link-u" style="margin-top:20px">Read the sample brief <span class="arrow">→</span></a>
              <div style="margin-top:clamp(32px,4vw,52px)"><a href="#contact" class="btn btn-solid">Request a tailored brief <span class="arrow">→</span></a></div>
            </div>
            <figure class="ins-feature-img ins-feature-video reveal d2">
              <div class="media-ph" aria-hidden="true"><span class="media-ph-kicker">C<i>&amp;</i>C — Field photography</span><span class="media-ph-title">Reunion Tower</span><span class="media-ph-sub">Downtown Dallas</span></div>
              <video class="ins-video" autoplay muted loop playsinline preload="auto" aria-label="Reunion Tower, Downtown Dallas"><source src="assets/video/reunion-tower.mp4" type="video/mp4"></video>
              <figcaption class="label label-sm ins-feature-cap">Reunion Tower — Downtown Dallas</figcaption>
            </figure>
          </div>
          <div class="ins-lanes">${lanes}</div>
        </div>
      </section>`;
  }

  const ROUTES = {};
  CC.DIVISIONS.forEach((d) => {
    ROUTES["/" + d.id] = () => ({ html: practicePage(d), title: d.name + " — C&C Asset Advisors", world: d.world });
  });
  ROUTES["/team"] = () => ({ html: teamPage(), title: "The team — C&C Asset Advisors", world: "investment" });
  ROUTES["/approach"] = () => ({ html: approachPage(), title: "Approach — C&C Asset Advisors", world: "hero" });
  ROUTES["/perspective"] = () => ({ html: perspectivePage(), title: "Perspective — C&C Asset Advisors", world: "commercial" });

  function applyWorld(world) {
    const w = window.CCWorld && window.CCWorld.instance;
    if (w && world) { w.setScene(world); w.setActive(true); w.setProgress(0.32); return true; }
    return false;
  }

  const HOME_TITLE = "C&C Asset Advisors — Real estate advisory for clients who think long-term";

  function route() {
    const key = location.hash.replace(/^#/, "");
    const r = ROUTES[key];
    const nav = document.getElementById("nav");
    if (r) {
      const page = r();
      mount.innerHTML = page.html;
      document.body.classList.add("deep-open");
      document.title = page.title;
      if (nav) nav.classList.remove("on-light");
      window.scrollTo(0, 0);
      mount.querySelectorAll(".reveal").forEach((el) => el.classList.add("in"));
      if (!applyWorld(page.world)) setTimeout(() => applyWorld(page.world), 500);
    } else {
      if (document.body.classList.contains("deep-open")) {
        document.body.classList.remove("deep-open");
        mount.innerHTML = "";
        document.title = HOME_TITLE;
        window.dispatchEvent(new Event("resize"));
        // honor an anchor target (e.g. #contact) once the main page is back
        if (key) requestAnimationFrame(() => { const el = document.getElementById(key); if (el) el.scrollIntoView({ block: "start" }); });
      }
    }
  }

  window.addEventListener("hashchange", route);
  if (document.readyState !== "loading") route();
  else document.addEventListener("DOMContentLoaded", route);
})();
