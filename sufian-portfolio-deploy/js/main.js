/* ==========================================================
   Shared page logic: header, footer, content from data.js,
   skills tree, services, projects, contact form.
   ========================================================== */
(function () {
  'use strict';

  var SITE = window.SITE || {};
  var PAGES = [
    ['index.html', 'Home', 'home'],
    ['about.html', 'About', 'about'],
    ['skills.html', 'Skills', 'skills'],
    ['projects.html', 'Projects', 'projects'],
    ['services.html', 'Services', 'services'],
    ['contact.html', 'Contact', 'contact']
  ];
  var SOCIAL_LABELS = {
    github: 'GitHub',
    linkedin: 'LinkedIn',
    facebook: 'Facebook',
    instagram: 'Instagram',
    whatsapp: 'WhatsApp'
  };
  var current = document.body.getAttribute('data-page');

  function h(tag, className, text) {
    var node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = text; }
    return node;
  }

  /* ---------- header and footer ---------- */
  function buildHeader() {
    var host = document.getElementById('site-header');
    if (!host) { return; }
    var nav = h('nav', 'nav glass');
    nav.setAttribute('aria-label', 'Main');

    var brand = h('a', 'brand', SITE.name || 'Portfolio');
    brand.href = 'index.html';

    var toggle = h('button', 'nav-toggle', 'Menu');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-controls', 'nav-links');

    var list = h('ul', 'nav-links');
    list.id = 'nav-links';
    PAGES.forEach(function (p) {
      var li = h('li');
      var a = h('a', 'nav-link', p[1]);
      a.href = p[0];
      if (p[2] === current) { a.setAttribute('aria-current', 'page'); }
      li.appendChild(a);
      list.appendChild(li);
    });

    toggle.addEventListener('click', function () {
      var open = list.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });

    nav.appendChild(brand);
    nav.appendChild(toggle);
    nav.appendChild(list);
    host.appendChild(nav);
  }

  function buildFooter() {
    var host = document.getElementById('site-footer');
    if (!host) { return; }
    var box = h('div', 'footer-box glass');
    box.appendChild(h('p', '', '\u00A9 ' + new Date().getFullYear() + ' ' + (SITE.name || '') + '. All rights reserved.'));
    host.appendChild(box);
  }

  /* ---------- Gmail compose link ---------- */
  function gmailUrl(subject, body) {
    var url = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(SITE.email || '');
    if (subject) { url += '&su=' + encodeURIComponent(subject); }
    if (body) { url += '&body=' + encodeURIComponent(body); }
    return url;
  }

  /* ---------- simple fields ---------- */
  function fillFields() {
    var fields = document.querySelectorAll('[data-field]');
    Array.prototype.forEach.call(fields, function (node) {
      var key = node.getAttribute('data-field');
      if (SITE[key]) { node.textContent = SITE[key]; }
    });

    var emailLinks = document.querySelectorAll('[data-link="email"]');
    Array.prototype.forEach.call(emailLinks, function (a) {
      if (!SITE.email) { return; }
      a.href = gmailUrl('Hello ' + (SITE.name || ''), '');
      a.target = '_blank';
      a.rel = 'noopener';
      a.title = 'Write an email in Gmail';
      a.textContent = SITE.email;
    });

    var phoneLinks = document.querySelectorAll('[data-link="phone"]');
    Array.prototype.forEach.call(phoneLinks, function (a) {
      if (!SITE.phone) { return; }
      a.href = 'tel:' + SITE.phone.replace(/[^\d+]/g, '');
      a.textContent = SITE.phone;
    });
  }

  /* ---------- social links ---------- */
  function renderSocial() {
    var boxes = document.querySelectorAll('[data-social]');
    Array.prototype.forEach.call(boxes, function (box) {
      var data = SITE.social || {};
      Object.keys(SOCIAL_LABELS).forEach(function (key) {
        var url = data[key];
        var node;
        if (url) {
          node = h('a', 'social-link', SOCIAL_LABELS[key]);
          node.href = url;
          node.target = '_blank';
          node.rel = 'noopener';
        } else {
          node = h('span', 'social-link is-empty', SOCIAL_LABELS[key]);
          node.title = 'Link coming soon';
        }
        box.appendChild(node);
      });
    });
  }

  /* ---------- photo ---------- */
  function setupPhoto() {
    var img = document.getElementById('photo');
    var initial = document.getElementById('photo-initial');
    if (!img) { return; }
    if (initial && SITE.name) { initial.textContent = SITE.name.charAt(0).toUpperCase(); }
    img.hidden = true;
    img.addEventListener('load', function () {
      img.hidden = false;
      if (initial) { initial.hidden = true; }
    });
    img.addEventListener('error', function () {
      img.hidden = true;
      if (initial) { initial.hidden = false; }
    });
    if (SITE.photo) { img.src = SITE.photo; }
  }

  /* ---------- resume (optional) ---------- */
  function setupResume() {
    var block = document.getElementById('resume-block');
    if (!block) { return; }
    if (!SITE.resume) { block.hidden = true; return; }
    var link = document.getElementById('resume-link');
    if (link) { link.href = SITE.resume; }
    block.hidden = false;
  }

  /* ---------- services ---------- */
  function renderServices() {
    var grid = document.getElementById('services-grid');
    if (!grid) { return; }
    (SITE.services || []).forEach(function (s) {
      var card = h('article', 'card glass');
      var top = h('div', 'card-top');
      top.appendChild(h('h3', 'card-title', s.name));
      if (s.free) { top.appendChild(h('span', 'badge-free', 'Free')); }
      card.appendChild(top);
      card.appendChild(h('p', 'card-text', s.description));
      grid.appendChild(card);
    });
  }

  /* ---------- projects ---------- */
  function renderProjects() {
    var grid = document.getElementById('projects-grid');
    if (!grid) { return; }
    (SITE.projects || []).forEach(function (p) {
      var card = h('article', 'card glass project-card');

      var media = h('div', 'project-media');
      if (p.image) {
        var img = document.createElement('img');
        img.src = p.image;
        img.alt = p.title + ' screenshot';
        img.loading = 'lazy';
        media.appendChild(img);
      } else {
        media.appendChild(h('span', 'project-media-text', 'Screenshot goes here'));
      }
      card.appendChild(media);

      card.appendChild(h('h3', 'card-title', p.title));
      card.appendChild(h('p', 'card-text', p.description));

      var review = h('blockquote', 'review');
      if (p.review) {
        review.appendChild(h('p', 'review-text', '\u201C' + p.review + '\u201D'));
        if (p.reviewer) { review.appendChild(h('footer', 'review-by', '\u2014 ' + p.reviewer)); }
      } else {
        review.className = 'review is-empty';
        review.appendChild(h('p', 'review-text', 'Client review will appear here.'));
      }
      card.appendChild(review);

      var actions = h('div', 'card-actions');
      if (p.link) {
        var a = h('a', 'btn btn-small', 'View project');
        a.href = p.link;
        a.target = '_blank';
        a.rel = 'noopener';
        actions.appendChild(a);
      } else {
        actions.appendChild(h('span', 'muted', 'Link coming soon'));
      }
      card.appendChild(actions);

      grid.appendChild(card);
    });
  }

  /* ---------- skills tree ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  var selectedSkill = -1;
  var lastMobile = null;

  function s(tag, attrs) {
    var node = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function seeded(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function leafPath(w, hgt) {
    var hw = w / 2;
    return 'M ' + (-hw) + ' 0 C ' + (-w / 4) + ' ' + (-hgt * 0.75) + ' ' + (w / 4) + ' ' + (-hgt * 0.75) + ' ' + hw + ' 0 ' +
      'C ' + (w / 4) + ' ' + (hgt * 0.75) + ' ' + (-w / 4) + ' ' + (hgt * 0.75) + ' ' + (-hw) + ' 0 Z';
  }

  function layoutTree(n, mobile) {
    var pts = [];
    var i;
    if (mobile) {
      for (i = 0; i < n; i++) {
        pts.push({ x: i % 2 === 0 ? 110 : 310, y: 140 + i * 105, rot: i % 2 === 0 ? -8 : 8 });
      }
      var mh = 140 + (n - 1) * 105 + 80 + 150;
      return {
        w: 420, h: mh, cx: 210, trunkTop: 40, pts: pts,
        canopy: { cx: 210, cy: 140 + (n - 1) * 105 / 2, rx: 210, ry: (n - 1) * 105 / 2 + 80 },
        leafW: 170, leafH: 74, font: 15
      };
    }
    var rows = Math.ceil(n / 3);
    for (i = 0; i < n; i++) {
      var r = Math.floor(i / 3);
      var idx = i % 3;
      var count = Math.min(3, n - r * 3);
      var xs = count === 3 ? [240, 450, 660] : (count === 2 ? [320, 580] : [450]);
      var rots = count === 3 ? [-10, 0, 10] : (count === 2 ? [-8, 8] : [0]);
      pts.push({ x: xs[idx], y: 150 + r * 135, rot: rots[idx] });
    }
    var dh = 150 + (rows - 1) * 135 + 80 + 150;
    return {
      w: 900, h: dh, cx: 450, trunkTop: 60, pts: pts,
      canopy: { cx: 450, cy: 150 + (rows - 1) * 135 / 2, rx: 410, ry: (rows - 1) * 135 / 2 + 95 },
      leafW: 190, leafH: 84, font: 16
    };
  }

  var treeLayout = null;
  var panelRef = null;

  function srUpdate(text) {
    var d = document.getElementById('skill-detail');
    if (d) { d.textContent = text; }
  }

  function closeSkill() {
    selectedSkill = -1;
    var leafEls = document.querySelectorAll('#tree .leaf');
    Array.prototype.forEach.call(leafEls, function (g) { g.classList.remove('is-open'); });
    if (panelRef) { panelRef.inner.classList.remove('show'); }
  }

  function openSkill(i) {
    var skill = (SITE.skills || [])[i];
    if (!skill || !treeLayout || !panelRef) { return; }
    var L = treeLayout;
    var mobile = L.w < 500;
    var hasLevel = typeof skill.level === 'number';
    var pw = mobile ? 340 : 330;
    var ph = (mobile ? 150 : 132) + (hasLevel ? 28 : 0);
    var p = L.pts[i];
    var x = Math.max(8, Math.min(L.w - pw - 8, p.x - pw / 2));
    var y = Math.max(8, Math.min(L.h - ph - 70, p.y - ph / 2));

    selectedSkill = i;
    var leafEls = document.querySelectorAll('#tree .leaf');
    Array.prototype.forEach.call(leafEls, function (g, k) {
      var open = k === i;
      g.classList.toggle('is-open', open);
      if (open) { g.style.setProperty('--d', (ph / 2 + 4) + 'px'); }
    });

    var box = panelRef.box;
    box.innerHTML = '';
    box.style.fontSize = mobile ? '16px' : '15px';
    box.appendChild(h('h3', 'skill-card-title', skill.name));
    box.appendChild(h('p', 'skill-card-text', skill.description));
    if (hasLevel) {
      var wrap = h('div', 'level');
      var fill = h('div', 'level-fill');
      fill.style.width = Math.max(0, Math.min(100, skill.level)) + '%';
      wrap.appendChild(fill);
      box.appendChild(wrap);
      box.appendChild(h('p', 'level-text', 'Level: ' + Math.round(skill.level) + '%'));
    }
    var close = h('button', 'skill-close', '\u00D7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', function (e) {
      e.stopPropagation();
      closeSkill();
    });
    box.appendChild(close);

    panelRef.outer.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
    panelRef.fo.setAttribute('width', pw);
    panelRef.fo.setAttribute('height', ph);
    panelRef.inner.classList.remove('show');
    void panelRef.inner.getBoundingClientRect();
    panelRef.inner.classList.add('show');
    srUpdate(skill.name + '. ' + skill.description);
  }

  function showSkill(i) {
    if (i < 0 || i === selectedSkill) {
      closeSkill();
      return;
    }
    openSkill(i);
  }

  function addStops(grad, stops) {
    stops.forEach(function (st) {
      grad.appendChild(s('stop', { offset: st[0], 'stop-color': st[1] }));
    });
  }

  function bezPoint(p0, p1, p2, p3, t) {
    var u = 1 - t;
    var x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    var y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    var dx = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    var dy = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: x, y: y, dx: dx / len, dy: dy / len };
  }

  /* a branch that gets thinner towards its tip */
  function taperedBranch(p0, p1, p2, p3, w0, w1) {
    var left = [];
    var right = [];
    var steps = 14;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var pt = bezPoint(p0, p1, p2, p3, t);
      var w = (w0 + (w1 - w0) * t) / 2;
      left.push((pt.x - pt.dy * w).toFixed(1) + ' ' + (pt.y + pt.dx * w).toFixed(1));
      right.push((pt.x + pt.dy * w).toFixed(1) + ' ' + (pt.y - pt.dx * w).toFixed(1));
    }
    return 'M ' + left.join(' L ') + ' L ' + right.reverse().join(' L ') + ' Z';
  }

  function buildTree() {
    var host = document.getElementById('tree');
    var skills = SITE.skills || [];
    if (!host || !skills.length) { return; }

    var mobile = window.innerWidth < 640;
    lastMobile = mobile;
    var L = layoutTree(skills.length, mobile);
    var rnd = seeded(7);
    var i;

    host.innerHTML = '';
    var svg = s('svg', { viewBox: '0 0 ' + L.w + ' ' + L.h, role: 'group', 'aria-label': 'A tree with my skills written on its leaves' });

    /* gradients */
    var defs = s('defs');
    var bark = s('linearGradient', { id: 'bark-grad', x1: '0', y1: '0', x2: '1', y2: '0' });
    addStops(bark, [['0', '#3d2815'], ['0.3', '#7a5533'], ['0.6', '#6b4a2f'], ['1', '#33200f']]);
    var gy = L.leafH * 0.45;
    var soilG = s('linearGradient', { id: 'soil-grad', x1: '0', y1: '0', x2: '0', y2: '1' });
    addStops(soilG, [['0', '#6b4a2f'], ['1', '#33200f']]);
    var grassG = s('linearGradient', { id: 'grass-grad', x1: '0', y1: '0', x2: '0', y2: '1' });
    addStops(grassG, [['0', '#86c050'], ['1', '#4a8338']]);
    var mossG = s('linearGradient', { id: 'moss-grad', x1: '0', y1: '0', x2: '0', y2: '1' });
    addStops(mossG, [['0', 'rgba(63,125,58,0)'], ['0.72', 'rgba(63,125,58,0)'], ['1', 'rgba(63,125,58,0.6)']]);
    var leafG = s('linearGradient', { id: 'leaf-grad', gradientUnits: 'userSpaceOnUse', x1: '0', y1: -gy, x2: '0', y2: gy });
    addStops(leafG, [['0', '#6fb24a'], ['1', '#2f6b2f']]);
    var leafH = s('linearGradient', { id: 'leaf-grad-hover', gradientUnits: 'userSpaceOnUse', x1: '0', y1: -gy, x2: '0', y2: gy });
    addStops(leafH, [['0', '#86c85c'], ['1', '#3a7f36']]);
    var leafS = s('linearGradient', { id: 'leaf-grad-sel', gradientUnits: 'userSpaceOnUse', x1: '0', y1: -gy, x2: '0', y2: gy });
    addStops(leafS, [['0', '#b4dc6a'], ['1', '#5a9a3a']]);
    var blobG = s('radialGradient', { id: 'blob-grad', cx: '0.4', cy: '0.35', r: '0.75' });
    addStops(blobG, [['0', '#7fb84f'], ['1', '#27572a']]);
    [bark, soilG, grassG, mossG, leafG, leafH, leafS, blobG].forEach(function (gr) { defs.appendChild(gr); });
    svg.appendChild(defs);

    /* depth: big soft clumps behind everything */
    var back = s('g', { 'aria-hidden': 'true' });
    var backCount = mobile ? 6 : 10;
    for (i = 0; i < backCount; i++) {
      var bx = L.canopy.cx + (rnd() * 2 - 1) * L.canopy.rx * 0.8;
      var by = L.canopy.cy + (rnd() * 2 - 1) * L.canopy.ry * 0.8;
      back.appendChild(s('circle', { cx: bx.toFixed(1), cy: by.toFixed(1), r: (30 + rnd() * 22).toFixed(1), fill: 'url(#blob-grad)', opacity: '0.22' }));
    }
    svg.appendChild(back);

    /* soil and grass: the tree grows out of the ground */
    var y0 = L.h - 46;
    function grassTop(x) { return y0 + Math.sin(x * 0.018) * 4 + Math.sin(x * 0.006 + 1.3) * 7; }
    function grassBottom(x) { return y0 + 18 + Math.sin(x * 0.03 + 2) * 5 + Math.sin(x * 0.011) * 4; }
    var ground = s('g', { 'aria-hidden': 'true' });
    ground.appendChild(s('rect', { x: 0, y: y0 - 6, width: L.w, height: L.h - y0 + 6, fill: 'url(#soil-grad)' }));
    for (i = 0; i < 80; i++) {
      ground.appendChild(s('circle', {
        cx: (rnd() * L.w).toFixed(1), cy: (y0 + 16 + rnd() * (L.h - y0 - 16)).toFixed(1),
        r: (0.8 + rnd() * 2.2).toFixed(1), fill: rnd() < 0.5 ? '#2e1c0d' : '#8a6340', opacity: '0.6'
      }));
    }
    for (i = 0; i < 5; i++) {
      var sx = rnd() * L.w;
      ground.appendChild(s('ellipse', { cx: sx.toFixed(1), cy: (y0 + 26 + rnd() * 10).toFixed(1), rx: (6 + rnd() * 8).toFixed(1), ry: (3 + rnd() * 3).toFixed(1), fill: '#8d8a80', opacity: '0.8' }));
    }
    var gTop = [];
    var gBot = [];
    var gx;
    for (gx = 0; gx <= L.w; gx += 20) {
      gTop.push(gx + ' ' + grassTop(gx).toFixed(1));
      gBot.push(gx + ' ' + grassBottom(gx).toFixed(1));
    }
    ground.appendChild(s('path', { d: 'M ' + gTop.join(' L ') + ' L ' + gBot.reverse().join(' L ') + ' Z', fill: 'url(#grass-grad)' }));
    ground.appendChild(s('path', { d: 'M ' + gTop.join(' L '), fill: 'none', stroke: '#a5d86a', 'stroke-width': '2' }));
    ground.appendChild(s('ellipse', { cx: L.cx, cy: y0 + 6, rx: 130, ry: 11, fill: 'rgba(15,45,20,0.3)' }));
    svg.appendChild(ground);

    var trunkH = L.h - L.trunkTop;
    function halfW(y) {
      var t = Math.max(0, Math.min(1, (y - L.trunkTop) / trunkH));
      return 9 + (34 - 9) * Math.pow(t, 1.7);
    }

    /* surface roots */
    var roots = s('g', { fill: '#4a301b', 'aria-hidden': 'true' });
    [-1, 1].forEach(function (d) {
      roots.appendChild(s('path', {
        d: 'M ' + (L.cx + d * 20) + ' ' + (y0 - 34) +
          ' C ' + (L.cx + d * 30) + ' ' + (y0 - 8) + ' ' + (L.cx + d * 64) + ' ' + (y0 - 4) + ' ' + (L.cx + d * 104) + ' ' + (y0 + 6) +
          ' L ' + (L.cx + d * 104) + ' ' + (y0 + 12) +
          ' C ' + (L.cx + d * 60) + ' ' + (y0 + 4) + ' ' + (L.cx + d * 34) + ' ' + (y0 + 6) + ' ' + (L.cx + d * 18) + ' ' + (y0 + 4) + ' Z'
      }));
    });
    svg.appendChild(roots);

    /* trunk with bark texture */
    var trunk = s('path', {
      d: 'M ' + (L.cx - 34) + ' ' + L.h +
        ' C ' + (L.cx - 24) + ' ' + (L.h - 60) + ' ' + (L.cx - 12) + ' ' + (L.h - 120) + ' ' + (L.cx - 9) + ' ' + L.trunkTop +
        ' L ' + (L.cx + 9) + ' ' + L.trunkTop +
        ' C ' + (L.cx + 12) + ' ' + (L.h - 120) + ' ' + (L.cx + 24) + ' ' + (L.h - 60) + ' ' + (L.cx + 34) + ' ' + L.h + ' Z',
      fill: 'url(#bark-grad)',
      'aria-hidden': 'true'
    });
    svg.appendChild(trunk);

    var texture = s('g', { fill: 'none', stroke: 'rgba(25,14,6,0.4)', 'stroke-width': '1.6', 'stroke-linecap': 'round', 'aria-hidden': 'true' });
    for (i = 0; i < 26; i++) {
      var ty = L.trunkTop + 40 + rnd() * (trunkH - 70);
      var hw = halfW(ty) * 0.8;
      var tx = L.cx + (rnd() * 2 - 1) * hw;
      var tl = 20 + rnd() * 44;
      texture.appendChild(s('path', {
        d: 'M ' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ' q ' + ((rnd() - 0.5) * 8).toFixed(1) + ' ' + (-tl / 2).toFixed(1) + ' ' + ((rnd() - 0.5) * 6).toFixed(1) + ' ' + (-tl).toFixed(1)
      }));
    }
    svg.appendChild(texture);

    var moss = trunk.cloneNode(false);
    moss.setAttribute('fill', 'url(#moss-grad)');
    svg.appendChild(moss);

    var front = s('g', { 'aria-hidden': 'true', fill: 'none', 'stroke-linecap': 'round' });
    var blade;
    for (i = 0; i < 70; i++) {
      var fx0 = L.cx + (rnd() * 2 - 1) * 120;
      var fh = 10 + rnd() * 22;
      front.appendChild(s('path', {
        d: 'M ' + fx0.toFixed(1) + ' ' + (y0 + 8 + rnd() * 10).toFixed(1) + ' q ' + ((rnd() - 0.5) * 10).toFixed(1) + ' ' + (-fh / 2).toFixed(1) + ' ' + ((rnd() - 0.5) * 14).toFixed(1) + ' ' + (-fh).toFixed(1),
        stroke: rnd() < 0.5 ? '#3f7d3a' : '#5f9e3f', 'stroke-width': '2.2'
      }));
    }
    for (blade = 0; blade < L.w; blade += 9) {
      var bh = 7 + rnd() * 12;
      front.appendChild(s('path', {
        d: 'M ' + blade + ' ' + (grassTop(blade) + 3).toFixed(1) + ' q ' + ((rnd() - 0.5) * 6).toFixed(1) + ' ' + (-bh / 2).toFixed(1) + ' ' + ((rnd() - 0.5) * 8).toFixed(1) + ' ' + (-bh).toFixed(1),
        stroke: rnd() < 0.5 ? '#4f8a3c' : '#79b648', 'stroke-width': '2'
      }));
    }
    var flowerColors = ['#ffe45c', '#ffffff', '#ff9ec4', '#ffb347'];
    for (i = 0; i < 14; i++) {
      var flx = rnd() * L.w;
      var fly = grassTop(flx) - 4 - rnd() * 8;
      front.appendChild(s('line', { x1: flx.toFixed(1), y1: (fly + 10).toFixed(1), x2: flx.toFixed(1), y2: fly.toFixed(1), stroke: '#3f7d3a', 'stroke-width': '1.6' }));
      front.appendChild(s('circle', { cx: flx.toFixed(1), cy: fly.toFixed(1), r: (2.6 + rnd() * 1.4).toFixed(1), fill: flowerColors[Math.floor(rnd() * flowerColors.length)], stroke: 'none' }));
    }
    svg.appendChild(front);

    /* branches, twigs, and leaf clusters at their ends */
    var woodG = s('g', { fill: '#5a3d26', stroke: '#3d2815', 'stroke-width': '0.8', 'aria-hidden': 'true' });
    var tipsList = [];
    L.pts.forEach(function (p) {
      var sy = Math.max(L.trunkTop + 24, Math.min(L.h - 70, p.y + 44));
      var dx = (p.x - L.cx) * 0.3;
      var P0 = [L.cx, sy];
      var P1 = [L.cx + dx, sy - 22];
      var P2 = [p.x - dx, p.y + 34];
      var P3 = [p.x, p.y];
      woodG.appendChild(s('path', { d: taperedBranch(P0, P1, P2, P3, 11, 4) }));
      tipsList.push([p.x, p.y]);
      [0.55, 0.8].forEach(function (tt, k) {
        var pt = bezPoint(P0, P1, P2, P3, tt);
        var side = (k === 0 ? 1 : -1) * (rnd() < 0.5 ? 1 : -1);
        var ang = Math.atan2(pt.dy, pt.dx) + side * (0.6 + rnd() * 0.5);
        var tl = 44 + rnd() * 30;
        var ex = pt.x + Math.cos(ang) * tl;
        var ey = pt.y + Math.sin(ang) * tl;
        var T0 = [pt.x, pt.y];
        var T1 = [pt.x + Math.cos(ang) * tl * 0.3, pt.y + Math.sin(ang) * tl * 0.3 - 5];
        var T2 = [pt.x + Math.cos(ang) * tl * 0.7, pt.y + Math.sin(ang) * tl * 0.7 - 3];
        var T3 = [ex, ey];
        woodG.appendChild(s('path', { d: taperedBranch(T0, T1, T2, T3, 4, 1.4) }));
        tipsList.push([ex, ey]);
      });
    });
    svg.appendChild(woodG);

    /* leaves: clusters at branch and twig ends, then scattered fill */
    var greens = ['#2f6b2f', '#3f7d3a', '#5f9e3f', '#7bb662', '#8cc152', '#a5c94e'];
    var leafLayer = s('g', { 'aria-hidden': 'true' });
    function smallLeaf(x, y, size) {
      var g = s('g', { transform: 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + Math.round(rnd() * 360) + ')' });
      var col = greens[Math.floor(rnd() * greens.length)];
      g.appendChild(s('path', { d: leafPath(size, size * 0.5), fill: col, stroke: 'rgba(20,50,20,0.35)', 'stroke-width': '0.7', opacity: '0.95' }));
      g.appendChild(s('line', { x1: -size / 2 + 2, y1: 0, x2: size / 2 - 2, y2: 0, stroke: 'rgba(255,255,255,0.28)', 'stroke-width': '0.8' }));
      leafLayer.appendChild(g);
    }
    tipsList.forEach(function (tp) {
      for (var n = 0; n < 10; n++) {
        smallLeaf(tp[0] + (rnd() - 0.5) * 70, tp[1] + (rnd() - 0.5) * 50, 24 + rnd() * 14);
      }
    });
    var fillCount = mobile ? 110 : 190;
    for (i = 0; i < fillCount; i++) {
      var tries = 0;
      var fx, fy;
      do {
        fx = L.canopy.cx + (rnd() * 2 - 1) * L.canopy.rx * 0.95;
        fy = L.canopy.cy + (rnd() * 2 - 1) * L.canopy.ry * 0.95;
        tries++;
      } while (tries < 20 && Math.pow((fx - L.canopy.cx) / L.canopy.rx, 2) + Math.pow((fy - L.canopy.cy) / L.canopy.ry, 2) > 1);
      smallLeaf(fx, fy, 26 + rnd() * 20);
    }
    svg.appendChild(leafLayer);

    /* skill leaves (clickable). Each leaf is two halves that split open. */
    function halfPath(w, hgt, dir) {
      var hw = w / 2;
      return 'M ' + (-hw) + ' 0 C ' + (-w / 4) + ' ' + (dir * hgt * 0.75) + ' ' + (w / 4) + ' ' + (dir * hgt * 0.75) + ' ' + hw + ' 0 Z';
    }
    skills.forEach(function (skill, idx) {
      var p = L.pts[idx];
      var g = s('g', {
        'class': 'leaf',
        transform: 'translate(' + p.x + ' ' + p.y + ') rotate(' + p.rot + ')',
        tabindex: '0',
        role: 'button',
        'aria-label': skill.name + '. Press to open.'
      });
      var inner = s('g', { 'class': 'leaf-inner' });
      [[-1, 'half half-top'], [1, 'half half-bottom']].forEach(function (cfg) {
        var dir = cfg[0];
        var half = s('g', { 'class': cfg[1] });
        half.appendChild(s('path', { 'class': 'blade', d: halfPath(L.leafW, L.leafH, dir) }));
        [-0.3, 0, 0.3].forEach(function (f) {
          var vx = f * L.leafW;
          half.appendChild(s('line', { x1: vx, y1: 0, x2: vx + L.leafW * 0.12, y2: dir * L.leafH * 0.3, stroke: 'rgba(255,255,255,0.18)', 'stroke-width': '1' }));
        });
        inner.appendChild(half);
      });
      var label = s('text', { 'class': 'leaf-text', x: 0, y: 0, dy: '0.35em', 'text-anchor': 'middle', 'font-size': L.font });
      label.textContent = skill.short || skill.name;
      inner.appendChild(label);
      g.appendChild(inner);

      g.addEventListener('click', function () { showSkill(idx); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showSkill(idx);
        }
      });
      svg.appendChild(g);
    });

    /* the popup that appears between the two halves */
    var panelOuter = s('g', { 'class': 'skill-panel', transform: 'translate(0 0)' });
    var panelInner = s('g', { 'class': 'panel-inner' });
    var fo = s('foreignObject', { x: 0, y: 0, width: 10, height: 10 });
    var box = document.createElement('div');
    box.className = 'skill-card';
    fo.appendChild(box);
    panelInner.appendChild(fo);
    panelOuter.appendChild(panelInner);
    svg.appendChild(panelOuter);
    panelRef = { outer: panelOuter, inner: panelInner, fo: fo, box: box };
    treeLayout = L;

    svg.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && (t.closest('.leaf') || t.closest('.skill-panel'))) { return; }
      if (selectedSkill >= 0) { closeSkill(); }
    });

    host.appendChild(svg);
    if (selectedSkill >= 0) { openSkill(selectedSkill); }
  }

  function setupTree() {
    if (!document.getElementById('tree')) { return; }
    buildTree();
    closeSkill();
    srUpdate('Click a leaf to open it and read about the skill.');
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && selectedSkill >= 0) { closeSkill(); }
    });
    window.addEventListener('resize', function () {
      var mobile = window.innerWidth < 640;
      if (mobile !== lastMobile) { buildTree(); }
    });
  }

  /* ---------- contact form ---------- */
  function setupForm() {
    var form = document.getElementById('contact-form');
    if (!form) { return; }
    var nameInput = document.getElementById('f-name');
    var msgInput = document.getElementById('f-message');
    var nameErr = document.getElementById('f-name-error');
    var msgErr = document.getElementById('f-message-error');
    var status = document.getElementById('form-status');
    var waBtn = document.getElementById('send-whatsapp');

    function validate() {
      var ok = true;
      if (!nameInput.value.trim()) {
        nameErr.textContent = 'Enter your name';
        ok = false;
      } else {
        nameErr.textContent = '';
      }
      if (!msgInput.value.trim()) {
        msgErr.textContent = 'Write a short message';
        ok = false;
      } else {
        msgErr.textContent = '';
      }
      return ok;
    }

    nameInput.addEventListener('input', function () { nameErr.textContent = ''; });
    msgInput.addEventListener('input', function () { msgErr.textContent = ''; });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate()) { return; }
      var name = nameInput.value.trim();
      var message = msgInput.value.trim();
      var subject = 'Message from ' + name + ' (portfolio)';
      var body = message + '\n\n' + name;
      status.textContent = 'Opening Gmail\u2026';
      var win = window.open(gmailUrl(subject, body), '_blank');
      if (win) {
        try { win.opener = null; } catch (err) { /* ignore */ }
      } else {
        window.location.href = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      }
    });

    waBtn.addEventListener('click', function () {
      if (!validate()) { return; }
      var name = nameInput.value.trim();
      var message = msgInput.value.trim();
      var text = 'Hi ' + (SITE.name || '') + ', I am ' + name + '. ' + message;
      var number = (SITE.phone || '').replace(/\D/g, '');
      status.textContent = 'Opening WhatsApp\u2026';
      window.open('https://wa.me/' + number + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
  }

  /* ---------- start ---------- */
  function init() {
    buildHeader();
    buildFooter();
    fillFields();
    renderSocial();
    setupPhoto();
    setupResume();
    renderServices();
    renderProjects();
    setupTree();
    setupForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
