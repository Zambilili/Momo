/* =========================================================
   Momo Tech : interactions générales (script classique, sans dépendance)
   - navigation compacte + menu mobile
   - apparitions au défilement
   - formulaire -> message WhatsApp prérempli
   - chargement différé des scènes 3D (Three.js)
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Configuration WhatsApp ---------- */
  // Numéro international sans "+" ni espaces (Bénin : 229 + 01 97 65 07 41)
  var WA_NUMBER = '2290197650741';
  function waLink(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
  }
  window.MomoTech = { WA_NUMBER: WA_NUMBER, waLink: waLink };

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Année automatique ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- En-tête compact + bouton flottant ---------- */
  var header = $('.site-header');
  var waFloat = $('.wa-float');
  var hero = $('.hero');
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-compact', y > 24);
    if (waFloat) {
      var limit = hero ? hero.offsetHeight * 0.6 : 300;
      waFloat.classList.toggle('is-visible', y > limit);
    }
    updateSteps();
  }

  /* ---------- Menu mobile ---------- */
  var burger = $('.burger');
  var menu = $('#menu');
  function setMenu(open) {
    if (!burger || !menu) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    if (open) { var first = $('a', menu); if (first) first.focus(); }
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    window.addEventListener('resize', function () { if (window.innerWidth > 980) setMenu(false); });
  }

  /* ---------- Lien actif dans la navigation ---------- */
  var navLinks = $$('.main-nav a[href^="#"]');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Apparitions progressives ---------- */
  var reveals = $$('.reveal');
  // petit décalage en cascade dans une même grille
  $$('.service-grid, .why-list, .steps').forEach(function (grid) {
    $$('.reveal', grid).forEach(function (el, i) { el.style.setProperty('--d', (i % 4) * 0.08 + 's'); });
  });
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Étapes de la méthode : progression au défilement ---------- */
  var stepsEl = $('#steps');
  var stepsFill = $('#steps-fill');
  var stepItems = $$('.step');
  function updateSteps() {
    if (!stepsEl || !stepsFill) return;
    var r = stepsEl.getBoundingClientRect();
    var vh = window.innerHeight;
    var p = (vh * 0.85 - r.top) / (r.height + vh * 0.35);
    p = Math.max(0, Math.min(1, p));
    stepsFill.style.setProperty('--p', p.toFixed(3));
    stepItems.forEach(function (s, i) { s.classList.toggle('is-lit', p >= (i + 0.5) / stepItems.length - 0.05); });
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; onScroll(); });
  }, { passive: true });
  onScroll();

  /* ---------- Lumière qui suit le pointeur sur les cartes ---------- */
  $$('.service-card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Formulaire -> WhatsApp ---------- */
  var form = $('#contact-form');
  if (form) {
    var status = $('#form-status');
    var clean = function (v, max) {
      return String(v || '').replace(/[-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').trim().slice(0, max);
    };
    var fields = [
      { el: $('#f-name'), err: $('#e-name'), max: 60, msg: 'Indiquez votre nom (2 caractères minimum).', min: 2 },
      { el: $('#f-device'), err: $('#e-device'), max: 60, msg: 'Choisissez le type d\'appareil.', min: 1 },
      { el: $('#f-service'), err: $('#e-service'), max: 80, msg: 'Choisissez le service souhaité.', min: 1 },
      { el: $('#f-desc'), err: $('#e-desc'), max: 1000, msg: 'Décrivez le problème en quelques mots (10 caractères minimum).', min: 10 }
    ];
    var validate = function (f) {
      var v = clean(f.el.value, f.max);
      var ok = v.length >= f.min;
      f.el.closest('.field').classList.toggle('has-error', !ok);
      f.el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (f.err) { f.err.textContent = ok ? '' : f.msg; f.el.setAttribute('aria-describedby', f.err.id); }
      return ok;
    };
    fields.forEach(function (f) {
      f.el.addEventListener('blur', function () { if (f.el.value) validate(f); });
      f.el.addEventListener('input', function () { if (f.el.closest('.field').classList.contains('has-error')) validate(f); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) { if (!validate(f) && !firstBad) firstBad = f.el; });
      if (firstBad) { status.textContent = ''; firstBad.focus(); return; }

      var message =
        'Bonjour Momo Tech,\n' +
        'Nom : ' + clean(fields[0].el.value, 60) + '\n' +
        'Appareil : ' + clean(fields[1].el.value, 60) + '\n' +
        'Service souhaité : ' + clean(fields[2].el.value, 80) + '\n' +
        'Description du problème : ' + clean(fields[3].el.value, 1000);
      var url = waLink(message);
      var win = window.open(url, '_blank', 'noopener');
      if (!win) window.location.href = url; // si l'ouverture d'onglet est bloquée
      status.textContent = 'WhatsApp s\'ouvre avec votre message prérempli. Vérifiez-le puis appuyez sur « Envoyer ».';
    });
  }

  /* ---------- Chargement des scènes 3D ---------- */
  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (err) { return false; }
  }
  var has3D = webglOK();
  var supportsImportMap = window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('importmap');
  if (!has3D || !supportsImportMap) {
    document.documentElement.classList.add('no-webgl');
    return; // l'illustration SVG de secours reste affichée
  }

  // Scène principale : dès que la page est prête
  var heroVisual = $('#hero-visual');
  if (heroVisual) {
    import('./animations3d.js')
      .then(function (m) { m.initHeroScene(heroVisual, { reduceMotion: reduceMotion }); })
      .catch(function (err) { console.warn('[Momo Tech] 3D indisponible, illustration de secours affichée.', err); });
  }

  // Illustrations 3D des services : chargées seulement à l'approche de la section
  var servicesSection = $('#services');
  if (servicesSection && 'IntersectionObserver' in window) {
    var loaded = false;
    var lazy = new IntersectionObserver(function (entries) {
      if (loaded || !entries.some(function (en) { return en.isIntersecting; })) return;
      loaded = true; lazy.disconnect();
      import('./services3d.js')
        .then(function (m) { m.initServiceIcons($$('[data-icon3d]'), { reduceMotion: reduceMotion }); })
        .catch(function (err) { console.warn('[Momo Tech] icônes 3D indisponibles.', err); });
    }, { rootMargin: '400px 0px' });
    lazy.observe(servicesSection);
  }
})();
