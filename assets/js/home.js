/* Teh Desa Indonesia - homepage behaviour (index.html only).
   Replaces Bootstrap JS, AOS, GLightbox, Swiper, Isotope, imagesLoaded and PureCounter. */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var body = document.body;

  /* Footer year */
  var yr = $('#year');
  if (yr) yr.textContent = new Date().getFullYear();

  /* Header state + scroll-top button */
  var toTop = $('#scroll-top');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var y = window.scrollY;
    body.classList.toggle('scrolled', y > 40);
    if (toTop) toTop.classList.toggle('on', y > 500);
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Mobile navigation */
  var toggle = $('.nav-toggle');
  function setNav(open) {
    body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
    toggle.firstElementChild.firstElementChild.setAttribute('href', open ? '#i-x' : '#i-menu');
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setNav(!body.classList.contains('nav-open')); });
    $$('#navmenu a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  }

  /* Nav highlight for the section in view */
  var navLinks = $$('#navmenu a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('active'); });
        if (map[en.target.id]) map[en.target.id].classList.add('active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(function (el) { spy.observe(el); });
  }

  /* 3D: hero scene follows the pointer */
  var scene = $('#scene'), stage = $('#stage');
  if (scene && stage && finePointer && !reduce) {
    var hero = $('#hero'), raf = 0, nx = 0, ny = 0;
    var apply = function () {
      raf = 0;
      stage.style.setProperty('--rx', (6 - ny * 12).toFixed(2) + 'deg');
      stage.style.setProperty('--ry', (-16 + nx * 20).toFixed(2) + 'deg');
    };
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      nx = (e.clientX - r.left) / r.width - .5;
      ny = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    hero.addEventListener('pointerleave', function () {
      nx = 0; ny = 0;
      stage.style.removeProperty('--rx'); stage.style.removeProperty('--ry');
    });
  }

  /* 3D: tilt on photos and package cards */
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 6;
      var host = el.parentNode;
      host.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5;
        var y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--ty', (x * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--tx', (-y * max * 2).toFixed(2) + 'deg');
      });
      host.addEventListener('pointerleave', function () {
        el.style.setProperty('--ty', '0deg');
        el.style.setProperty('--tx', '0deg');
      });
    });
  }

  /* Counters */
  var nf = new Intl.NumberFormat('id-ID');
  var hoursEl = $('#hoursSupport');
  function hoursNow() {
    var start = new Date(hoursEl.getAttribute('data-hours-since'));
    return Math.max(0, Math.floor((Date.now() - start) / 3600000));
  }
  function run(el, end) {
    if (reduce) { el.textContent = nf.format(end); return; }
    var t0 = performance.now(), dur = 1400;
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = nf.format(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  var counters = $$('.stat-num');
  if (hoursEl) hoursEl.textContent = nf.format(hoursNow());
  if ('IntersectionObserver' in window && !reduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target;
        run(el, el === hoursEl ? hoursNow() : parseInt(el.getAttribute('data-count'), 10));
      });
    }, { threshold: .6 });
    counters.forEach(function (el) { el.textContent = '0'; cio.observe(el); });
  }
  if (hoursEl) setInterval(function () { hoursEl.textContent = nf.format(hoursNow()); }, 3600000);

  /* Testimonials rail */
  var rail = $('#rail');
  $$('[data-rail]').forEach(function (b) {
    b.addEventListener('click', function () {
      var card = rail.firstElementChild;
      var step = card ? card.getBoundingClientRect().width + 20 : 300;
      rail.scrollBy({ left: step * parseInt(b.getAttribute('data-rail'), 10), behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* Dialogs */
  function closeOnBackdrop(dlg) {
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('.dlg-close')) dlg.close();
    });
  }
  var lightbox = $('#lightbox'), videobox = $('#videobox');
  [lightbox, videobox].forEach(function (d) { if (d && d.showModal) closeOnBackdrop(d); });

  var ytFrame = $('#ytFrame');
  $$('[data-video]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (!videobox || !videobox.showModal) return; /* fall back to normal link */
      e.preventDefault();
      ytFrame.src = 'https://www.youtube-nocookie.com/embed/' + a.getAttribute('data-video') + '?autoplay=1&rel=0';
      videobox.showModal();
    });
  });
  if (videobox) videobox.addEventListener('close', function () { ytFrame.src = 'about:blank'; });

  /* Gallery: 3D coverflow with filters */
  var view = $('#cfView');
  if (view) {
    var all = $$('.cf-item', view);
    var list = all.slice(), idx = 0;
    var capT = $('#cfTitle'), capD = $('#cfDesc'), count = $('#cfCount');

    var layout = function () {
      var n = list.length, half = n / 2;
      list.forEach(function (el, i) {
        var o = i - idx;
        if (o > half) o -= n; else if (o < -half) o += n; /* loop around */
        var a = Math.abs(o);
        el.style.setProperty('--o', Math.max(-3, Math.min(3, o)));
        el.style.setProperty('--a', Math.min(3, a));
        el.classList.toggle('far', a > 2);
        el.classList.toggle('now', a === 0);
        el.setAttribute('aria-hidden', a === 0 ? 'false' : 'true');
      });
      var cur = list[idx];
      if (cur) {
        capT.textContent = cur.getAttribute('data-title');
        capD.textContent = cur.getAttribute('data-desc');
        count.textContent = (idx + 1) + ' / ' + list.length;
      }
    };
    var go = function (n) {
      if (!list.length) return;
      idx = (n + list.length) % list.length;
      layout();
    };

    $('#cfPrev').addEventListener('click', function () { go(idx - 1); });
    $('#cfNext').addEventListener('click', function () { go(idx + 1); });
    view.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
      if (e.key === 'Enter' && list[idx]) openLightbox(list[idx]);
    });

    /* swipe / drag; a click on a side photo brings it to the centre, on the centre photo opens it */
    var sx = 0, sy = 0, dragging = false, moved = false;
    view.addEventListener('pointerdown', function (e) { sx = e.clientX; sy = e.clientY; dragging = true; moved = false; });
    view.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (Math.abs(e.clientX - sx) > 8) { moved = true; view.classList.add('drag'); }
    });
    var endDrag = function (e) {
      if (!dragging) return;
      dragging = false; view.classList.remove('drag');
      var dx = e.clientX - sx;
      if (moved && Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    };
    view.addEventListener('pointerup', endDrag);
    view.addEventListener('pointercancel', function () { dragging = false; view.classList.remove('drag'); });
    view.addEventListener('click', function (e) {
      if (moved) return;
      var item = e.target.closest('.cf-item');
      if (!item) return;
      var i = list.indexOf(item);
      if (i === idx) openLightbox(item); else if (i > -1) go(i);
    });

    function openLightbox(item) {
      if (!lightbox || !lightbox.showModal) return;
      var img = item.querySelector('img');
      $('#lbImg').src = img.currentSrc || img.src;
      $('#lbImg').alt = img.alt;
      $('#lbCap').textContent = item.getAttribute('data-title') + ' - ' + item.getAttribute('data-desc');
      lightbox.showModal();
    }

    $$('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        $$('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var f = chip.getAttribute('data-filter');
        list = all.filter(function (el) {
          var show = f === '*' || el.getAttribute('data-cat') === f;
          el.setAttribute('data-hide', show ? '0' : '1');
          return show;
        });
        idx = 0;
        layout();
      });
    });
    layout();
  }

  /* Live chat: load Tawk.to only after the visitor interacts (or the browser is idle),
     so it never competes with the first paint. */
  var chatLoaded = false;
  function loadChat() {
    if (chatLoaded) return;
    chatLoaded = true;
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://embed.tawk.to/6906c8547f504c194e1a1943/1j917t36h';
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    document.head.appendChild(s);
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, loadChat, { once: true, passive: true });
  });
  window.addEventListener('scroll', loadChat, { once: true, passive: true });
  window.addEventListener('load', function () { setTimeout(loadChat, 6000); });
})();
