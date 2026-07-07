/* C&C Asset Advisors — shared behavior (no dependencies) */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- mobile menu (built once, shared by every page) ---------- */
  var MENU = [
    { href: 'index.html', label: 'Home', sub: 'The cold open' },
    { href: 'sell.html', label: 'Sell', sub: 'Priced from experience' },
    { href: 'buy.html', label: 'Buy', sub: 'Your first home' },
    { href: 'commercial.html', label: 'Commercial', sub: 'The partnership model' },
    { href: 'private-clients.html', label: 'Private Clients', sub: 'Without the payroll' },
    { href: 'firm.html', label: 'The Firm', sub: 'Three partners' }
  ];
  var menuEl = document.querySelector('.mobile-menu');
  if (menuEl) {
    var here = location.pathname.split('/').pop() || 'index.html';
    menuEl.innerHTML = '';
    MENU.forEach(function (m, i) {
      var a = document.createElement('a');
      a.className = 'mm-row';
      a.href = m.href;
      if (m.href === here) a.setAttribute('aria-current', 'page');
      a.innerHTML = '<span class="mm-num">0' + (i + 1) + '</span>' +
        '<span class="mm-label">' + m.label + '</span>' +
        '<span class="mm-sub">' + m.sub + '</span>';
      menuEl.appendChild(a);
    });
    var foot = document.createElement('div');
    foot.className = 'mm-foot';
    foot.innerHTML = '<a class="mm-call" href="tel:+14694799656">Call (469) 479-9656</a>' +
      '<div class="mm-meta"><a href="mailto:dalton@ccassetadvisors.com">dalton@ccassetadvisors.com</a>' +
      '<span>Se habla español.</span></div>';
    menuEl.appendChild(foot);
  }

  var burger = document.querySelector('.hud-burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.documentElement.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () {
        document.documentElement.classList.remove('menu-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- scroll reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveal-fade, .reveal-line');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- sticky CTA ---------- */
  var sticky = document.querySelector('.sticky-cta');
  if (sticky) {
    var stickyTick = false;
    var updateSticky = function () {
      stickyTick = false;
      var vh = window.innerHeight;
      var nearEnd = window.scrollY + vh > document.documentElement.scrollHeight - vh * 1.2;
      sticky.classList.toggle('on', window.scrollY > vh * 0.85 && !nearEnd);
    };
    window.addEventListener('scroll', function () {
      if (!stickyTick) { stickyTick = true; requestAnimationFrame(updateSticky); }
    }, { passive: true });
    updateSticky();
  }

  /* ---------- FAQ accordions ---------- */
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item.open').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        o.querySelector('.ind').textContent = '+';
      });
      if (!wasOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
        q.querySelector('.ind').textContent = '–';
      }
    });
  });

  /* ---------- videos: lazy load + in-view play/pause ----------
     Every background video (lazy data-src AND eager autoplay heroes) pauses
     when off-screen — decoding an invisible video is pure jank. */
  var vids = document.querySelectorAll('video[data-src], video[autoplay]');
  if ('IntersectionObserver' in window && vids.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src && v.getAttribute('data-src')) { v.src = v.getAttribute('data-src'); v.load(); }
          if (v.autoplay || v.hasAttribute('data-autoplay')) {
            var p = v.play(); if (p && p.catch) p.catch(function () {});
          }
        } else if (!v.paused) {
          v.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    vids.forEach(function (v) { vio.observe(v); });
  } else {
    vids.forEach(function (v) { if (!v.src && v.getAttribute('data-src')) v.src = v.getAttribute('data-src'); });
  }

  /* one gentle autoplay nudge on first interaction (iOS low-power mode etc.) */
  var nudge = function () {
    document.querySelectorAll('video[autoplay], video[data-autoplay]').forEach(function (v) {
      if (v.src && v.paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    });
    window.removeEventListener('pointerdown', nudge);
  };
  window.addEventListener('pointerdown', nudge, { passive: true });

  /* ---------- inquiry form (FormSubmit, with mailto fallback) ---------- */
  window.CC = window.CC || {};
  window.CC.reduceMotion = reduceMotion;
  /* FormSubmit AJAX endpoint. NOTE: the first-ever submission emails an
     activation link to this inbox — click it once and delivery is live. */
  window.CC.ENDPOINT = 'https://formsubmit.co/ajax/dalton@ccassetadvisors.com';

  window.CC.mailtoFallback = function (subject, body) {
    window.location.href = 'mailto:dalton@ccassetadvisors.com?subject=' +
      encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  };

  window.CC.send = function (subject, fields) {
    fields._subject = subject;
    fields._template = 'table';
    if (fields.Email) fields._replyto = fields.Email;
    return fetch(window.CC.ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(fields)
    }).then(function (r) { if (!r.ok) throw new Error('formsubmit ' + r.status); });
  };

  window.CC.wireInquiry = function (opts) {
    var form = document.querySelector(opts.form);
    if (!form) return;
    var path = opts.defaultPath || 'Selling';
    form.querySelectorAll('.chip').forEach(function (c) {
      c.addEventListener('click', function () {
        form.querySelectorAll('.chip').forEach(function (x) { x.classList.remove('on'); });
        c.classList.add('on');
        path = c.getAttribute('data-path');
      });
    });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      var data = { name: get('name'), phone: get('phone'), email: get('email'), message: get('message') };
      if (!data.email || data.email.indexOf('@') < 0) {
        var em = form.querySelector('[name="email"]'); if (em) em.focus();
        return;
      }
      var subject = 'Website inquiry — ' + path + (data.name ? ' — ' + data.name : '');
      window.CC.send(subject, {
        Interest: path, Name: data.name, Phone: data.phone, Email: data.email,
        Message: data.message, Source: opts.source || location.pathname
      }).catch(function () {
        /* endpoint unreachable → open a prefilled email so the lead isn't lost */
        window.CC.mailtoFallback(subject,
          'Interest: ' + path + '\r\nName: ' + data.name + '\r\nPhone: ' + data.phone +
          '\r\nEmail: ' + data.email + '\r\n\r\n' + data.message);
      });
      var routed = (path === 'Selling' || path === 'Buying') ? 'Landon' : 'Dalton & Irma';
      var rn = document.querySelector(opts.routeName); if (rn) rn.textContent = routed;
      var fw = document.querySelector(opts.formWrap); if (fw) fw.style.display = 'none';
      var sent = document.querySelector(opts.sent); if (sent) sent.style.display = 'block';
    });
  };
})();

/* ============================================================
   V2 — interaction layer (progress, magnetic, tilt, embers,
   count-up, inline lead forms)
   ============================================================ */
(function () {
  'use strict';
  var rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------- scroll progress hairline ---------- */
  var prog = document.createElement('div');
  prog.className = 'scroll-progress';
  prog.setAttribute('aria-hidden', 'true');
  document.body.appendChild(prog);
  var pQueued = false;
  function paintProg() {
    pQueued = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
  }
  window.addEventListener('scroll', function () {
    if (!pQueued) { pQueued = true; requestAnimationFrame(paintProg); }
  }, { passive: true });
  paintProg();

  /* ---------- magnetic buttons ---------- */
  if (fine && !rm) {
    document.querySelectorAll('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) / r.width;
        var y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = 'translate(' + (x * 6).toFixed(1) + 'px,' + (y * 5 - 2).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ---------- tilt cards ---------- */
  if (fine && !rm) {
    document.querySelectorAll('[data-tilt]').forEach(function (c) {
      var raf = null;
      c.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = c.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = 'perspective(900px) rotateX(' + (-y * 4).toFixed(2) + 'deg) rotateY(' + (x * 5).toFixed(2) + 'deg) translateY(-4px)';
        });
      });
      c.addEventListener('pointerleave', function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        c.style.transform = '';
      });
    });
  }

  /* ---------- ember particles ---------- */
  if (fine && !rm && !window.matchMedia('(max-width:920px)').matches) {
    document.querySelectorAll('.embers').forEach(function (cv) {
      var ctx = cv.getContext('2d');
      var W, H, parts = [], running = false, rafId = null;
      function size() {
        var r = cv.parentElement.getBoundingClientRect();
        W = cv.width = Math.floor(r.width / 2);
        H = cv.height = Math.floor(r.height / 2);
        cv.style.width = '100%'; cv.style.height = '100%';
      }
      function spawn(init) {
        return {
          x: Math.random() * W,
          y: init ? Math.random() * H : H + 6,
          r: 0.6 + Math.random() * 1.3,
          vy: 0.12 + Math.random() * 0.3,
          vx: (Math.random() - 0.5) * 0.14,
          a: 0.15 + Math.random() * 0.5,
          tw: Math.random() * Math.PI * 2
        };
      }
      function tick() {
        rafId = null;
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y -= p.vy; p.x += p.vx; p.tw += 0.04;
          if (p.y < -8) parts[i] = p = spawn(false);
          var glow = p.a * (0.65 + 0.35 * Math.sin(p.tw));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(222,178,110,' + glow.toFixed(3) + ')';
          ctx.shadowColor = 'rgba(214,150,72,.8)';
          ctx.shadowBlur = 5;
          ctx.fill();
        }
        rafId = requestAnimationFrame(tick);
      }
      size();
      for (var i = 0; i < 26; i++) parts.push(spawn(true));
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          running = e.isIntersecting;
          if (running && !rafId) rafId = requestAnimationFrame(tick);
        });
      });
      io.observe(cv);
      window.addEventListener('resize', size);
    });
  }

  /* ---------- count-up stats ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length && !rm) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var el = e.target, target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var t0 = performance.now(), dur = 1600;
        (function step(t) {
          var k = Math.min(1, (t - t0) / dur);
          var eased = 1 - Math.pow(1 - k, 3);
          el.firstChild.nodeValue = Math.round(target * eased);
          if (k < 1) requestAnimationFrame(step);
          else el.firstChild.nodeValue = target;
        })(t0);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- inline lead form (drop <div class="lead-mini" data-source="x"> anywhere) ---------- */
  document.querySelectorAll('.lead-mini').forEach(function (box) {
    var src = box.getAttribute('data-source') || location.pathname;
    box.innerHTML =
      '<form novalidate>' +
      '<div class="lm-row"><input name="name" placeholder="Name" autocomplete="name">' +
      '<input name="phone" placeholder="Phone" autocomplete="tel"></div>' +
      '<input name="email" type="email" placeholder="Email" autocomplete="email" required style="margin-top:12px">' +
      '<textarea name="message" rows="2" placeholder="What are you working on?" style="margin-top:12px;resize:vertical"></textarea>' +
      '<button type="submit" class="btn btn-gold" style="margin-top:16px;width:100%">Request a callback&nbsp;&nbsp;→</button>' +
      '<div style="margin-top:10px;font-family:var(--mono);font-size:9.5px;letter-spacing:.14em;color:rgba(237,230,215,.4);text-align:center">A REAL PERSON REPLIES WITHIN ONE BUSINESS DAY</div>' +
      '</form>' +
      '<div class="sent-note"><span style="font-family:var(--serif);font-size:22px;display:block;margin-bottom:6px">Received.</span>We’ll call you within one business day. Need us sooner? <a href="tel:+14694799656" style="color:var(--gold);text-decoration:none">(469)&nbsp;479-9656</a></div>';
    var form = box.querySelector('form');
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      var email = get('email');
      if (!email || email.indexOf('@') < 0) { form.querySelector('[name="email"]').focus(); return; }
      window.CC.send('Callback request — ' + src, {
        Type: 'Callback request', Name: get('name'), Phone: get('phone'),
        Email: email, Message: get('message'), Source: src
      }).catch(function () {
        window.CC.mailtoFallback('Callback request — ' + src,
          'Name: ' + get('name') + '\r\nPhone: ' + get('phone') + '\r\nEmail: ' + email + '\r\n\r\n' + get('message'));
      });
      form.style.display = 'none';
      box.querySelector('.sent-note').style.display = 'block';
    });
  });
})();
