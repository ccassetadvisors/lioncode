/* =====================================================================
   C&C ASSET ADVISORS — site build + behavior (vanilla)
   ===================================================================== */
(function () {
  const CC = window.CC;
  const page = document.getElementById("page");
  const esc = (s) => s.replace(/&/g, "&amp;");
  const pad = (i) => String(i + 1).padStart(2, "0");
  const initials = (full) => full.split(/\s+/).map((w) => w[0] || "").join("").slice(0, 2).toUpperCase();
  // Branded portrait placeholder shown until a real photo is dropped in.
  const portraitPH = (p) => `
        <div class="portrait-ph" aria-hidden="true">
          <span class="portrait-ph-kicker">C<i>&amp;</i>C Asset Advisors</span>
          <span class="portrait-ph-mono">${initials(p.fullName)}</span>
          <span class="portrait-ph-name">${esc(p.fullName)}</span>
        </div>`;

  /* ---------------- HERO ---------------- */
  function heroHTML() {
    const index = CC.DIVISIONS.map((d) => `
      <button class="pidx" data-open="${d.id}" aria-label="Go to ${esc(d.name)}">
        <span class="pidx-num">${d.rn}</span>
        <span class="pidx-body">
          <span class="pidx-name">${esc(d.name)}</span>
          <span class="pidx-tag label label-sm">${esc(d.tag)}</span>
        </span>
        <span class="pidx-arrow" aria-hidden="true">→</span>
      </button>`).join("");
    return `
    <section id="hero" class="hero" data-world="hero" data-screen-label="Hero">
      <div class="wrap hero-inner">
        <div class="hero-grid">
          <div class="hero-copy">
            <div class="eyebrow-row hero-eyebrow">
              <span class="dot"></span>
              <span class="label" style="color:var(--gold-soft)">C&amp;C Asset Advisors</span>
              <span class="label" style="color:var(--on-ink-faint)">— Dallas·Fort Worth</span>
            </div>
            <h1 class="display">
              <span class="hero-line">Real estate,</span>
              <span class="hero-line">advised with</span>
              <span class="hero-line"><span class="serif italic" style="color:var(--gold-soft)">clarity,</span></span>
              <span class="hero-line">anchored in <span class="serif italic" style="color:var(--gold-soft)">purpose.</span></span>
            </h1>
            <p class="lede measure hero-lede">A Dallas–Fort Worth real estate advisory firm. One ecosystem, three disciplines — residential, private investment, and commercial.</p>
            <div class="hero-actions">
              <a href="#practice" class="btn btn-solid">Enter the practice <span class="arrow">→</span></a>
              <a href="#contact" class="btn btn-outline">Start a conversation</a>
            </div>
          </div>
          <nav class="practice-index" aria-label="The practice">
            <span class="label label-sm pidx-head">The practice</span>
            ${index}
          </nav>
        </div>
      </div>
      <div class="wrap hero-foot">
        <div class="hero-foot-row">
          <span class="label">Scroll — one firm, three disciplines</span>
          <span class="label" style="color:var(--on-ink-faint)">Est. DFW · ccassetadvisors.com</span>
        </div>
      </div>
    </section>`;
  }

  /* section heading with roman ghost numeral — architectural drawing-sheet rhythm */
  function secHead(kicker, num) {
    return `<div class="sec-wrap"><span class="ghost-num serif" aria-hidden="true">${num}</span><div class="sec-head reveal"><span class="kicker-dot"></span><span class="kicker">${kicker}</span><span class="sec-rule"></span><span class="sec-num serif italic">${num}</span></div></div>`;
  }

  /* ---------------- THESIS ---------------- */
  function thesisHTML() {
    const nodes = CC.ARC.map((s, i) => `
      <button class="anode${i === 0 ? " active passed" : ""}" data-arc="${i}">
        <span class="adot"></span>
        <span class="ak label">${pad(i)}</span>
        <span class="at">${esc(s.t)}</span>
        <span class="ad body-sm">${esc(s.d)}</span>
      </button>`).join("");
    return `
    <section id="thesis" class="section-pad paper-section paper-arch" data-screen-label="Our conviction">
      <div class="wrap">
        ${secHead("Our conviction", "I")}
        <div class="thesis-top">
          <h2 class="h1 measure-lg reveal">One firm for the whole arc of <span class="serif italic gold-text">ownership.</span></h2>
          <div class="reveal d2">
            <p class="body-lg dropcap">${esc(CC.ARC_INTRO)}</p>
            <p class="body-lg" style="margin-top:16px">The home you live in and the assets you build are rarely separate decisions. We advise on both — and stay through all of it.</p>
          </div>
        </div>
        <div class="arc reveal">
          <div class="arc-rail"><div class="arc-rail-fill"></div></div>
          <div class="arc-nodes">${nodes}</div>
        </div>
        <div class="thesis-foot reveal"><p class="lede pull" style="max-width:34rem"><span class="serif italic gold-text">${esc(CC.ARC_CLOSE)}</span></p></div>
      </div>
    </section>`;
  }

  /* ---------------- DIVISION (immersive) ---------------- */
  const THEME = { warm: "div-light theme-warm", dark: "div-dark theme-gold", cool: "div-cool theme-cool" };

  /* hub-and-spoke — C&C Brokerage at the center; asset markets above, disciplines below */
  function networkArt(net) {
    const cx = 260, cy = 206, rx = 188, ry = 138;
    const place = (arr, a0, a1) => arr.map((n, i) => {
      const t = arr.length === 1 ? 0.5 : i / (arr.length - 1);
      const a = (a0 + (a1 - a0) * t) * Math.PI / 180;
      return { n, x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, a };
    });
    // center the emphasized discipline
    const disc = [...net.disciplines].sort((m, n) => (m === net.big ? 0 : 1) - (n === net.big ? 0 : 1));
    const ordered = [disc[1], disc[0], disc[2]].filter(Boolean);
    const pts = [...place(net.markets, -158, -22), ...place(ordered, 158, 22)];
    const spokes = pts.map((p) => {
      const big = p.n === net.big;
      const ex = cx + (p.x - cx) * 0.265, ey = cy + (p.y - cy) * 0.31; // start at hub edge
      return `<line x1="${ex.toFixed(1)}" y1="${ey.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" class="net-line${big ? " big" : ""}"></line>
        <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${big ? 5.5 : 4}" class="net-dot${big ? " big" : ""}"></circle>`;
    }).join("");
    const labels = pts.map((p) => {
      const big = p.n === net.big;
      const up = p.y < cy;
      const lx = cx + (p.x - cx) * 1.08, ly = p.y + (up ? -16 : 26);
      const anchor = Math.abs(p.x - cx) < 30 ? "middle" : p.x > cx ? "start" : "end";
      return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" class="net-label${big ? " big" : ""}">${esc(p.n)}</text>`;
    }).join("");
    return `
      <div class="net" aria-label="C&C Brokerage at the hub of a specialist network">
        <svg viewBox="0 0 520 412" class="net-svg">
          <text x="${cx}" y="26" text-anchor="middle" class="net-group">Asset markets</text>
          <text x="${cx}" y="402" text-anchor="middle" class="net-group">Disciplines</text>
          ${spokes}
          <circle cx="${cx}" cy="${cy}" r="56" class="net-core"></circle>
          <text x="${cx}" y="${cy - 2}" text-anchor="middle" class="net-cc">C&amp;C</text>
          <text x="${cx}" y="${cy + 22}" text-anchor="middle" class="net-sub">Brokerage</text>
          ${labels}
        </svg>
        <span class="label label-sm net-cap">${esc(net.caption)}</span>
      </div>`;
  }

  function divisionHTML(d) {
    const RN = ["I", "II", "III", "IV", "V"];
    const points = d.points.map((p, i) => `
      <div class="div-point reveal d${i + 1}">
        <span class="pnum serif italic">${RN[i]}</span>
        <h3 class="h3">${esc(p.h)}</h3>
        <p>${esc(p.p)}</p>
      </div>`).join("");
    const serves = d.services.map((s, i) => `<li><span class="sn serif italic">${RN[i]}</span>${esc(s)}</li>`).join("");
    const net = d.network ? networkArt(d.network) : "";
    // No CTA heading (it duplicated the button). A short, division-specific
    // invitation for the non-network cards; the hub caption leads on commercial.
    const INVITE = { residential: "Let’s find the right one.", investment: "Let’s look at the numbers." };
    const ctaLead = net ? "" : `<p class="div-cta-lead">${esc(INVITE[d.id] || "")}</p>`;
    return `
    <section class="division ${THEME[d.theme]}" data-world="${d.world}" id="div-${d.id}" data-screen-label="${esc(d.name)}">
      <div class="pin">
        <div class="veil"></div>

        <div class="div-stage s-title on">
          <div class="wrap stage">
            <div class="div-meta"><span class="div-index">${d.rn}</span><span class="div-rule"></span><span class="label div-label">${esc(d.lead)}</span></div>
            <h2 class="div-name">${esc(d.name)}</h2>
            <span class="div-tag">${esc(d.tag)}</span>
            <p class="div-statement">${esc(d.statement)}</p>
          </div>
        </div>

        <div class="div-stage s-points">
          <div class="wrap stage">
            <div class="div-meta"><span class="div-index">${d.rn}</span><span class="div-rule"></span><span class="label div-label">${esc(d.name)} — how we work</span></div>
            <div class="div-points">${points}</div>
          </div>
        </div>

        <div class="div-stage s-serve">
          <div class="wrap stage">
            <div class="div-serve-grid">
              <div>
                <div class="div-meta"><span class="div-index">${d.rn}</span><span class="div-rule"></span><span class="label div-label">What we handle</span></div>
                <ul class="div-serve-list">${serves}</ul>
              </div>
              <div class="div-cta-card">
                ${net}
                ${ctaLead}
                <a href="#contact" class="btn btn-solid" data-prefill="${d.id}">${esc(d.cta)} <span class="arrow">→</span></a>
              </div>
            </div>
          </div>
        </div>

        <div class="wrap div-scroll-hint"><span class="div-part serif italic">Part ${d.rn} of III</span><span class="label label-sm">${esc(d.name)}</span></div>
      </div>
    </section>`;
  }

  /* ---------------- INTERSTITIAL ---------------- */
  function interHTML(text, accent) {
    return `<section class="interstitial" data-screen-label="Interstitial"><div class="inter-grid"></div>
      <div class="wrap"><p class="q reveal">${text.replace("{a}", `<span class="accent">${accent}</span>`)}</p></div></section>`;
  }

  /* ---------------- TEAM ---------------- */
  function teamHTML() {
    const cards = CC.TEAM.map((p, i) => `
      <article class="pcard reveal d${i + 1}" data-person="${p.id}" tabindex="0" role="button" aria-label="Open ${esc(p.fullName)} profile">
        <div class="pcard-photo">${portraitPH(p)}<image-slot class="portrait-slot" id="portrait-${p.id}" shape="rect" src="assets/img/portrait-${p.id}.jpg" placeholder="Drop ${esc(p.name)}'s portrait"></image-slot></div>
        <div class="pcard-body">
          <span class="pcard-name">${esc(p.name)}</span>
          <span class="pcard-title label">${esc(p.title)}</span>
          <span class="pcard-focus">${esc(p.focus)}</span>
          <p class="pcard-sum body">${esc(p.summary)}</p>
          <span class="pcard-cta link-u">Full profile <span class="arrow">→</span></span>
        </div>
      </article>`).join("");
    return `
    <section id="team" class="section-pad paper-arch paper-team" data-screen-label="The team">
      <div class="wrap">
        ${secHead("The team", "II")}
        <div class="team-top">
          <h2 class="h1 measure-lg reveal">One table.<br>The whole <span class="serif italic gold-text">firm</span> behind it.</h2>
          <div class="reveal d2"><p class="body-lg dropcap">${esc(CC.TEAM_INTRO)}</p>
            <a href="#/team" class="link-u" style="margin-top:18px">Read the full team page <span class="arrow">→</span></a></div>
        </div>
        <div class="team-grid">${cards}</div>
        <div class="team-note reveal"><span class="label" style="color:var(--taupe)">And a wider bench</span><p class="lede measure-lg" style="margin-top:14px">${esc(CC.TEAM_NOTE)}</p></div>
      </div>
    </section>`;
  }

  /* ---------------- PHILOSOPHY ---------------- */
  function philosophyHTML() {
    return `
    <section id="philosophy" class="section-pad paper-section paper-arch" data-screen-label="How we operate">
      <div class="wrap">
        ${secHead("How we operate", "III")}
        <div class="std-statement reveal" style="max-width:64rem"><p class="display" style="font-size:clamp(32px,4.8vw,72px);line-height:1.05">${esc(CC.STANDARD_STATEMENT).replace("built to last", '<span class="serif italic gold-text">built to last</span>')}</p></div>
        <div class="reveal" style="margin-top:clamp(40px,5vw,72px)"><a href="#/approach" class="link-u">The four standards we operate by <span class="arrow">→</span></a></div>
      </div>
    </section>`;
  }

  /* ---------------- PERSPECTIVE ---------------- */
  function perspectiveHTML() {
    const CLASSES = ["Residential", "Multifamily", "Industrial", "Office", "Retail", "Land & Development", "Mixed-use / Other"];
    const AREAS = [
      ["Metro-wide", ["All of DFW"]],
      ["Counties", ["Dallas County", "Tarrant County", "Collin County", "Denton County", "Rockwall County", "Ellis County", "Kaufman County", "Johnson County", "Parker County", "Hunt County"]],
      ["Dallas & east", ["Dallas (city)", "East Dallas", "Oak Cliff / South Dallas", "Richardson", "Garland", "Mesquite", "Rockwall", "Rowlett", "Wylie", "Forney", "Royse City", "Terrell", "Greenville"]],
      ["North", ["Plano", "Frisco", "McKinney", "Allen", "Prosper", "Celina", "Anna / Melissa", "The Colony", "Little Elm", "Carrollton", "Lewisville", "Flower Mound", "Denton"]],
      ["West & south", ["Fort Worth", "Arlington", "Grand Prairie", "Irving", "Grapevine", "Southlake", "Keller", "North Richland Hills", "Mansfield", "Burleson", "Weatherford", "Cleburne", "Midlothian", "Waxahachie"]],
      ["Beyond", ["Other / multiple areas (specify in your note)"]]
    ];
    const classOpts = CLASSES.map((c) => `<option${c === "Residential" ? " selected" : ""}>${esc(c)}</option>`).join("");
    const areaOpts = AREAS.map(([g, list]) => `<optgroup label="${esc(g)}">${list.map((a) => `<option>${esc(a)}</option>`).join("")}</optgroup>`).join("");
    const lanes = [
      { audience: "Residential", line: "The work, in pictures — homes worth pausing on.", to: "Instagram", href: "#contact" },
      { audience: "Investment & Commercial", line: "Notes and observations for investors and operators.", to: "LinkedIn", href: "https://www.linkedin.com/company/ccassetadvisors/" }
    ].map((c, i) => `
      <a class="ins-lane reveal d${i + 1}" href="${c.href}"${c.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>
        <span class="ins-lane-aud label" style="color:var(--taupe)">${esc(c.audience)}</span>
        <span class="ins-lane-line">${esc(c.line)}</span>
        <span class="ins-lane-to link-u">${c.to} <span class="arrow">→</span></span>
      </a>`).join("");
    return `
    <section id="insights" class="section-pad paper-cool paper-arch" data-screen-label="Perspective">
      <div class="wrap">
        ${secHead("Perspective", "IV")}
        <div class="ins-feature">
          <div class="reveal">
            <h2 class="h1">The DFW market, <span class="serif italic gold-text">read closely.</span></h2>
            <p class="lede measure" style="margin-top:24px">C&amp;C Market Notes — an in-depth read across Dallas–Fort Worth and every asset class: where capital is moving, what it costs to build, and where value is forming. From operators active in the market, not commentators watching it.</p>
            <div class="ins-sample" style="margin-top:30px">
              <span class="label label-sm" style="color:var(--gold-deep)">Sample edition — June 2026</span>
              <a href="reports/dfw-intelligence-brief-june-2026.pdf" target="_blank" rel="noopener" class="link-u" style="margin-top:8px">DFW Real Estate Intelligence Brief — residential, commercial &amp; investment <span class="arrow">→</span></a>
            </div>
          </div>
          <figure class="ins-feature-img ins-feature-video reveal d2">
            <div class="media-ph" aria-hidden="true">
              <span class="media-ph-kicker">C<i>&amp;</i>C — Field photography</span>
              <span class="media-ph-title">Reunion Tower</span>
              <span class="media-ph-sub">Downtown Dallas</span>
            </div>
            <video class="ins-video" autoplay muted loop playsinline preload="auto" aria-label="Reunion Tower, Downtown Dallas">
              <source src="assets/video/reunion-tower.mp4" type="video/mp4">
            </video>
            <figcaption class="label label-sm ins-feature-cap">Reunion Tower — Downtown Dallas</figcaption>
          </figure>
        </div>
        <div class="ins-request reveal" id="request-brief">
          <div class="ins-req-head">
            <span class="label" style="color:var(--gold-deep)">Tailored editions</span>
            <p class="h3" style="margin-top:10px">Request the brief for your asset class and area.</p>
          </div>
          <div class="ins-req-row">
            <label class="ins-req-field"><span class="ins-req-label label label-sm">Asset class</span><select data-req-class>${classOpts}</select></label>
            <label class="ins-req-field"><span class="ins-req-label label label-sm">Area</span><select data-req-area>${areaOpts}</select></label>
            <a href="#contact" class="btn btn-solid ins-req-btn" data-request-brief>Request the brief <span class="arrow">→</span></a>
          </div>
          <p class="body-sm" style="margin-top:14px">Prepared personally for your situation and delivered by email — no list, no spam.</p>
        </div>
        <div class="ins-lanes">${lanes}</div>
      </div>
    </section>`;
  }

  /* ---------------- CONTACT ---------------- */
  function contactHTML() {
    const F = CC.FIRM;
    const paths = CC.CONTACT.map((p, i) => `
      <button class="ct-path${i === 0 ? " on" : ""}" data-path="${p.id}">
        <span class="ct-path-label">${esc(p.label)}</span>
        <span class="ct-path-q body-sm">${esc(p.q)}</span>
      </button>`).join("");
    return `
    <section id="contact" class="ink-section on-dark section-pad" data-screen-label="Contact">
      <div class="wrap">
        ${secHead("Contact", "V")}
        <div class="ct-grid">
          <div class="ct-left">
            <h2 class="h1 reveal" style="color:var(--on-ink)">Begin the <span class="serif italic" style="color:var(--gold-soft)">conversation.</span></h2>
            <p class="lede measure reveal d1" style="color:var(--on-ink-soft);margin-top:22px">Tell us what you're working on. The right partner will reply personally — discreetly, and without a sales call.</p>
            <div class="ct-paths reveal d2">${paths}</div>
            <div class="ct-office reveal d3">
              <div class="ct-office-col">
                <span class="label label-sm" style="color:var(--on-ink-faint)">Office</span>
                <p class="ct-office-line">519 E. Interstate 30 #323<br>Rockwall, TX 75085</p>
              </div>
              <div class="ct-office-col">
                <span class="label label-sm" style="color:var(--on-ink-faint)">Phone</span>
                <a class="ct-office-line ct-tel" href="${F.phoneHref}">${esc(F.phone)}</a>
              </div>
            </div>
          </div>
          <div class="ct-form-wrap reveal d2">
            <form class="ct-form" novalidate>
              <span class="label" style="color:var(--gold-soft)" data-form-kicker>Residential inquiry</span>
              <p class="h3" style="color:var(--on-ink);margin:12px 0 26px" data-form-q>Buying or selling a home.</p>
              <label class="ct-field"><span class="ct-flabel">Name</span><input type="text" name="name" placeholder="Your name"></label>
              <label class="ct-field"><span class="ct-flabel">Email</span><input type="email" name="email" placeholder="you@example.com"></label>
              <label class="ct-field"><span class="ct-flabel">What are you trying to accomplish?</span><textarea rows="3" name="note" placeholder="A short note about your situation."></textarea></label>
              <button type="submit" class="btn btn-solid" style="margin-top:8px">Send inquiry <span class="arrow">→</span></button>
              <p class="body-sm" style="color:var(--on-ink-faint);margin-top:16px">We advise — we don't chase. Expect a considered reply, not a sales call.</p>
            </form>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ---------------- FOOTER ---------------- */
  function footerHTML() {
    const F = CC.FIRM;
    const cols = [
      { h: "Practice", links: [["Residential", "#div-residential"], ["Private Investment", "#div-investment"], ["Commercial", "#div-commercial"]] },
      { h: "Firm", links: [["Our conviction", "#thesis"], ["The team", "#team"], ["Approach", "#philosophy"], ["Perspective", "#insights"]] },
      { h: "Connect", links: [["Start a conversation", "#contact"], [F.phone, F.phoneHref], ["LinkedIn", "https://www.linkedin.com/company/ccassetadvisors/"], ["Instagram", "#contact"]] }
    ].map((c) => `<div class="ft-col"><span class="label" style="color:var(--on-ink-faint)">${c.h}</span><ul>${c.links.map(([t, h]) => `<li><a href="${h}"${h.startsWith("http") ? ' target="_blank" rel="noopener"' : ""} class="body-sm" style="color:var(--on-ink-soft)">${t}</a></li>`).join("")}</ul></div>`).join("");
    const legal = F.legal.map((l) => `<a href="${l.href}" target="_blank" rel="noopener" class="ft-legal-link">${esc(l.t)}</a>`).join("");
    return `
    <footer class="footer" data-screen-label="Footer">
      <div class="wrap">
        <div class="ft-top">
          <div class="ft-brand">
            <div class="brand-mark">C<i>&amp;</i>C</div>
            <p class="serif" style="font-size:23px;color:var(--on-ink-soft);margin-top:16px;max-width:20rem;line-height:1.3">Real estate advisory for clients who think <span class="italic" style="color:var(--gold-soft)">long-term.</span></p>
            <p class="label" style="margin-top:22px;color:var(--on-ink-faint)">C&amp;C Asset Advisors, LLC · Dallas–Fort Worth</p>
            <p class="body-sm" style="margin-top:14px;color:var(--on-ink-faint)">519 E. Interstate 30 #323, Rockwall, TX 75085<br><a href="${F.phoneHref}" style="color:var(--on-ink-soft)">${esc(F.phone)}</a></p>
          </div>
          <div class="ft-cols">${cols}</div>
        </div>
        <div class="ft-legal">
          <span class="label label-sm" style="color:var(--on-ink-faint)">TREC · Texas Real Estate Commission</span>
          <div class="ft-legal-links">${legal}</div>
        </div>
        <div class="ft-bottom">
          <span class="label label-sm" style="color:var(--on-ink-faint)">© <span data-year></span> C&amp;C Asset Advisors · ccassetadvisors.com</span>
          <span class="label label-sm" style="color:var(--on-ink-faint)">Residential · Private Investment · Commercial</span>
        </div>
      </div>
    </footer>`;
  }

  /* ---------------- ASSEMBLE ---------------- */
  page.innerHTML =
    heroHTML() +
    thesisHTML() +
    `<div id="practice"></div>` +
    divisionHTML(CC.DIVISIONS[0]) +
    interHTML("From the home you live in to the assets you build — the same {a} hand.", "trusted") +
    divisionHTML(CC.DIVISIONS[1]) +
    interHTML("Where buildings are {a} before they are built.", "understood") +
    divisionHTML(CC.DIVISIONS[2]) +
    teamHTML() +
    philosophyHTML() +
    perspectiveHTML() +
    contactHTML() +
    footerHTML();

  document.querySelector("[data-year]").textContent = new Date().getFullYear();

  window.dispatchEvent(new Event("cc:built"));
})();
