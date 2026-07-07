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
    { href: 'private-clients.html', label: 'Private Clients', sub: 'Quiet portfolio work' },
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

  /* ---------- videos: lazy load + in-view play/pause ---------- */
  var vids = document.querySelectorAll('video[data-src]');
  if ('IntersectionObserver' in window && vids.length) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src) { v.src = v.getAttribute('data-src'); v.load(); }
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
    vids.forEach(function (v) { v.src = v.getAttribute('data-src'); });
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
