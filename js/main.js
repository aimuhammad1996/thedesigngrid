/* ==========================================================================
   MAREN VOSS — PORTFOLIO INTERACTION LAYER
   Theme persistence, nav behavior, scroll reveal, TOC tracking.
   No external dependencies. Respects prefers-reduced-motion throughout.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- Theme ---------- */
  var THEME_KEY = 'mv-theme';
  var toggle = document.querySelector('[data-theme-toggle]');

  function getStoredTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function setStoredTheme(t) {
    try { localStorage.setItem(THEME_KEY, t); } catch (e) {}
  }
  function applyTheme(t) {
    if (t === 'dark' || t === 'light') {
      root.setAttribute('data-theme', t);
    } else {
      root.removeAttribute('data-theme');
    }
    if (toggle) {
      var isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
      toggle.setAttribute('aria-pressed', String(isDark));
    }
  }

  applyTheme(getStoredTheme());

  if (toggle) {
    toggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      var isDark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
      var next = isDark ? 'light' : 'dark';
      applyTheme(next);
      setStoredTheme(next);
    });
  }

  /* ---------- Nav: scroll state, hide-on-scroll-down, progress ---------- */
  var nav = document.querySelector('.site-nav');
  var progressBar = document.querySelector('[data-nav-progress]');
  var lastY = window.scrollY;
  var ticking = false;

  function updateNavHeight() {
    if (nav) root.style.setProperty('--nav-h', nav.offsetHeight + 'px');
  }
  updateNavHeight();
  window.addEventListener('resize', updateNavHeight);

  function onScroll() {
    var y = window.scrollY;
    if (nav) {
      nav.classList.toggle('is-scrolled', y > 8);
      if (y > lastY && y > 160) {
        nav.classList.add('is-hidden');
      } else {
        nav.classList.remove('is-hidden');
      }
    }
    if (progressBar) {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docH > 0 ? Math.min(100, (y / docH) * 100) : 0;
      progressBar.style.width = pct + '%';
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var navToggle = document.querySelector('[data-nav-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  function closeMobile() {
    if (!mobilePanel) return;
    mobilePanel.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }
  function openMobile() {
    updateNavHeight();
    mobilePanel.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
  }
  if (navToggle && mobilePanel) {
    navToggle.addEventListener('click', function () {
      var expanded = navToggle.getAttribute('aria-expanded') === 'true';
      expanded ? closeMobile() : openMobile();
    });
    mobilePanel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMobile);
    });
    mobilePanel.addEventListener('click', function (e) {
      if (e.target === mobilePanel) closeMobile();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobile();
    });
  }

  /* ---------- Active nav link on scroll (index page) ---------- */
  var sections = document.querySelectorAll('main [id]');
  var navLinks = document.querySelectorAll('.nav-links a[href^="#"], .mobile-panel a[href^="#"]');
  if (sections.length && navLinks.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          navLinks.forEach(function (link) {
            var match = link.getAttribute('href') === '#' + id;
            link.toggleAttribute('aria-current', match);
            if (match) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- Scroll reveal ----------
     Only opt into the animated (opacity:0-until-visible) presentation once
     we've confirmed IntersectionObserver exists and motion isn't reduced.
     Content is fully visible by default otherwise — see .js-reveal gate in CSS. */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && 'IntersectionObserver' in window && !reduceMotion) {
    root.classList.add('js-reveal');
    var counters = new WeakMap();
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var group = el.closest('[data-reveal-group]');
          if (group) {
            var count = counters.get(group) || 0;
            el.style.setProperty('--i', count);
            counters.set(group, count + 1);
          }
          el.classList.add('is-visible');
          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Case study TOC scrollspy ---------- */
  var tocLinks = document.querySelectorAll('.cs-toc a');
  var csBlocks = document.querySelectorAll('.cs-block[id]');
  if (tocLinks.length && csBlocks.length && 'IntersectionObserver' in window) {
    var tocObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.getAttribute('id');
          tocLinks.forEach(function (l) {
            l.classList.toggle('is-active', l.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    csBlocks.forEach(function (b) { tocObserver.observe(b); });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Magnetic buttons (subtle, desktop only, motion-respecting) ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
      var strength = 10;
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x / rect.width) * strength + 'px,' + (y / rect.height) * strength + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ---------- Custom cursor: TRON-style light disc (desktop, motion-respecting) ----------
     A dot tracks the pointer exactly; a ring eases toward it a frame
     behind, giving the disc a sense of weight and glide. Both are
     transform-only and pointer-events:none. Grows and brightens over
     interactive elements, fires a brief expanding pulse on click. */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.body.classList.add('custom-cursor-active');

    var cursorDot = document.createElement('div');
    cursorDot.className = 'tron-cursor-dot';
    cursorDot.setAttribute('aria-hidden', 'true');
    var cursorRing = document.createElement('div');
    cursorRing.className = 'tron-cursor-ring';
    cursorRing.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorRing);

    var cursorX = window.innerWidth / 2;
    var cursorY = window.innerHeight / 2;
    var ringX = cursorX;
    var ringY = cursorY;
    var cursorShown = false;

    function setCursorVisible(visible) {
      if (visible === cursorShown) return;
      cursorShown = visible;
      cursorDot.style.opacity = visible ? '1' : '0';
      cursorRing.style.opacity = visible ? '1' : '0';
    }

    document.addEventListener('mousemove', function (e) {
      cursorX = e.clientX;
      cursorY = e.clientY;
      cursorDot.style.transform = 'translate3d(' + cursorX + 'px,' + cursorY + 'px,0)';
      setCursorVisible(true);
    });
    document.addEventListener('mouseleave', function () { setCursorVisible(false); });
    document.addEventListener('mouseenter', function () { setCursorVisible(true); });

    (function driftRing() {
      ringX += (cursorX - ringX) * 0.2;
      ringY += (cursorY - ringY) * 0.2;
      cursorRing.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0)';
      window.requestAnimationFrame(driftRing);
    })();

    var cursorHoverSelector = 'a, button, [data-magnetic], input, textarea, select, [role="button"]';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(cursorHoverSelector)) cursorRing.classList.add('is-hover');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(cursorHoverSelector)) cursorRing.classList.remove('is-hover');
    });
    document.addEventListener('mousedown', function () {
      cursorRing.classList.add('is-down');
      var pulse = document.createElement('div');
      pulse.className = 'tron-cursor-pulse';
      pulse.style.transform = 'translate3d(' + cursorX + 'px,' + cursorY + 'px,0)';
      document.body.appendChild(pulse);
      pulse.addEventListener('animationend', function () { pulse.remove(); });

      /* De-res burst: a dozen-plus tiny squares scatter outward from the
         click point and shrink away, like a TRON program derezzing. */
      var derezCount = 16;
      for (var i = 0; i < derezCount; i++) {
        var frag = document.createElement('div');
        frag.className = 'tron-derez-pixel';
        var angle = (Math.PI * 2 * i) / derezCount + (Math.random() * 0.5 - 0.25);
        var dist = 22 + Math.random() * 50;
        var dx = Math.cos(angle) * dist;
        var dy = Math.sin(angle) * dist;
        var size = 4 + Math.round(Math.random() * 4);
        frag.style.width = size + 'px';
        frag.style.height = size + 'px';
        frag.style.setProperty('--x', cursorX + 'px');
        frag.style.setProperty('--y', cursorY + 'px');
        frag.style.setProperty('--dx', dx.toFixed(1) + 'px');
        frag.style.setProperty('--dy', dy.toFixed(1) + 'px');
        document.body.appendChild(frag);
        frag.addEventListener('animationend', function () { this.remove(); });
      }
    });
    document.addEventListener('mouseup', function () { cursorRing.classList.remove('is-down'); });
  }

  /* ---------- Hero mosaic parallax (desktop, motion-respecting) ----------
     Tiles drift a few pixels toward the cursor, scaled per-tile by
     data-depth, on a single rAF-throttled listener over the whole group. */
  var heroMosaic = document.querySelector('[data-parallax-group]');
  if (heroMosaic && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var heroTiles = Array.prototype.slice.call(heroMosaic.querySelectorAll('.hero-tile'));
    var mosaicTicking = false;
    var mosaicClientX = 0;
    var mosaicClientY = 0;
    function applyMosaicParallax() {
      var rect = heroMosaic.getBoundingClientRect();
      var px = (mosaicClientX - rect.left) / rect.width - 0.5;
      var py = (mosaicClientY - rect.top) / rect.height - 0.5;
      heroTiles.forEach(function (tile) {
        var depth = parseFloat(tile.getAttribute('data-depth')) || 0.5;
        var tx = (px * depth * 18).toFixed(2);
        var ty = (py * depth * 14).toFixed(2);
        tile.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
      });
      mosaicTicking = false;
    }
    heroMosaic.addEventListener('mousemove', function (e) {
      mosaicClientX = e.clientX;
      mosaicClientY = e.clientY;
      if (!mosaicTicking) {
        window.requestAnimationFrame(applyMosaicParallax);
        mosaicTicking = true;
      }
    });
    heroMosaic.addEventListener('mouseleave', function () {
      heroTiles.forEach(function (tile) { tile.style.transform = ''; });
    });
  }

  /* ---------- Contact form (mailto handoff — static site, no backend) ---------- */
  var contactForm = document.querySelector('[data-contact-form]');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.querySelector('#cf-name').value.trim();
      var email = contactForm.querySelector('#cf-email').value.trim();
      var message = contactForm.querySelector('#cf-message').value.trim();
      var subject = 'Portfolio inquiry from ' + (name || 'website visitor');
      var body = message + (email ? '\n\n— ' + name + ' (' + email + ')' : '\n\n— ' + name);
      var href = 'mailto:muhammadshahid@moandco.org?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      window.location.href = href;
    });
  }

  /* ---------- Smooth-scroll with header offset for in-page anchors ---------- */
  document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      var navH = nav ? nav.offsetHeight : 0;
      var top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
      history.pushState(null, '', '#' + id);
    });
  });

  /* ---------- Decode-in text (opt-in via [data-decode-text]) ----------
     Scrambles a heading's characters and resolves them left-to-right on
     load, like a terminal decrypting a line of text. Off entirely under
     reduced motion — the final text is already in the DOM, so skipping
     the effect just leaves it as-is. */
  var decodeEls = document.querySelectorAll('[data-decode-text]');
  if (decodeEls.length && !reduceMotion) {
    var DECODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    decodeEls.forEach(function (el) {
      var finalText = el.textContent;
      var len = finalText.length;
      var totalFrames = 26;
      var frame = 0;
      function tick() {
        var revealCount = Math.floor((frame / totalFrames) * len);
        var out = '';
        for (var i = 0; i < len; i++) {
          out += (i < revealCount || finalText[i] === ' ') ? finalText[i] : DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)];
        }
        el.textContent = out;
        frame++;
        if (frame <= totalFrames) {
          setTimeout(tick, 26);
        } else {
          el.textContent = finalText;
        }
      }
      tick();
    });
  }
})();
