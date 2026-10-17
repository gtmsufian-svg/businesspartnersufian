/* ==========================================================
   Shared living sky: clouds, sun, rain, rainbow, birds,
   falling leaves, hills and trees. Used by every page.
   The weather state is kept in sessionStorage so the sky
   continues smoothly when you move from page to page.
   ========================================================== */
(function () {
  'use strict';

  var canvas = document.getElementById('sky');
  if (!canvas || !canvas.getContext) { return; }
  var ctx = canvas.getContext('2d');
  var reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- settings ---------- */
  var ORDER = ['sunny', 'cloudy', 'rain', 'clearing'];
  var DURATION = { sunny: 26, cloudy: 12, rain: 18, clearing: 14 };
  var TARGET = {
    sunny:    { dark: 0,    rain: 0, sun: 1,    rainbow: 0 },
    cloudy:   { dark: 0.92, rain: 0, sun: 0.05, rainbow: 0 },
    rain:     { dark: 1,    rain: 1, sun: 0,    rainbow: 0 },
    clearing: { dark: 0.15, rain: 0, sun: 1,    rainbow: 1 }
  };
  var TAU = { dark: 1.8, rain: 1.2, sun: 2.0, rainbow: 2.5 };
  var STORE_KEY = 'portfolio-weather';

  var TOP_CLEAR = [120, 198, 240];
  var BOT_CLEAR = [228, 245, 252];
  var TOP_DARK = [102, 118, 133];
  var BOT_DARK = [176, 188, 198];

  var HILLS = [
    { base: 0.80, amp: 0.035, f: 1.3, ph: 0.5, col: [156, 197, 138] },
    { base: 0.86, amp: 0.040, f: 0.9, ph: 2.2, col: [111, 166, 90] },
    { base: 0.93, amp: 0.030, f: 1.6, ph: 4.1, col: [63, 125, 58] }
  ];
  var TREES = [
    { x: 0.035, h: 1, s: 1.0,  seed: 3,  kind: 0 },
    { x: 0.10,  h: 2, s: 0.72, seed: 8,  kind: 1 },
    { x: 0.915, h: 2, s: 0.8,  seed: 15, kind: 1 },
    { x: 0.975, h: 1, s: 1.1,  seed: 21, kind: 0 }
  ];
  var PUFFS = [[0, 0, 34], [32, 7, 26], [-32, 9, 24], [60, 14, 18], [-58, 14, 18]];
  var LEAF_COLORS = ['#5f9e3f', '#8cc152', '#e8a33d', '#d9822b', '#7bb662'];
  var RAINBOW = [
    [255, 99, 99], [255, 169, 77], [255, 224, 102], [140, 231, 154],
    [116, 192, 252], [151, 117, 250], [229, 153, 247]
  ];

  /* ---------- state ---------- */
  var W = 0, H = 0, DPR = 1;
  var clock = 0;
  var state = 'sunny';
  var stateStart = Date.now();
  var amt = { dark: 0, rain: 0, sun: 1, rainbow: 0 };
  var clouds = [], leaves = [], flocks = [], drops = [];
  var birdTimer = 2;
  var bolts = [], lightningTimer = 2, thunderCbs = [], treeSprites = [];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function seeded(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function mix(a, b, t) {
    return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
  }
  function rgb(c, a) {
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')';
  }

  /* ---------- weather state (kept across pages) ---------- */
  function saveState() {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify({ s: state, t: stateStart })); } catch (e) { /* ignore */ }
  }

  function loadState() {
    if (reduce) {
      state = 'sunny';
      stateStart = Date.now();
    } else {
      var saved = null;
      try { saved = JSON.parse(sessionStorage.getItem(STORE_KEY)); } catch (e) { saved = null; }
      var now = Date.now();
      if (saved && DURATION[saved.s] && typeof saved.t === 'number') {
        state = saved.s;
        stateStart = saved.t;
      } else {
        state = 'sunny';
        stateStart = now - rand(0, 8000);
      }
      var guard = 0;
      while ((now - stateStart) / 1000 >= DURATION[state] && guard < 60) {
        stateStart += DURATION[state] * 1000;
        state = ORDER[(ORDER.indexOf(state) + 1) % ORDER.length];
        guard++;
      }
    }
    var t = TARGET[state];
    amt.dark = t.dark; amt.rain = t.rain; amt.sun = t.sun; amt.rainbow = t.rainbow;
    saveState();
  }

  function currentWind() {
    return 0.35 + 0.2 * Math.sin(clock * 0.35) + 0.25 * amt.rain;
  }

  /* ---------- actors ---------- */
  function makeClouds() {
    clouds = [];
    var n = W < 640 ? 5 : 8;
    for (var i = 0; i < n; i++) {
      clouds.push({ x: rand(-150, W + 150), y: H * rand(0.05, 0.37), s: rand(0.7, 1.6), v: rand(5, 14) });
    }
  }

  function newLeaf(anywhere) {
    return {
      x: rand(0, W),
      y: anywhere ? rand(0, H) : rand(-80, -20),
      s: rand(5, 9),
      vy: rand(24, 52),
      amp: rand(14, 48),
      fr: rand(0.5, 1.4),
      ph: rand(0, 6.28),
      rot: rand(0, 6.28),
      rs: rand(-1.1, 1.1),
      col: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)]
    };
  }

  function makeLeaves() {
    leaves = [];
    var n = W < 640 ? 14 : 22;
    for (var i = 0; i < n; i++) { leaves.push(newLeaf(true)); }
  }

  function makeDrops() {
    drops = [];
    var n = W < 640 ? 90 : 150;
    for (var i = 0; i < n; i++) {
      drops.push({ x: rand(-50, W + 50), y: rand(0, H), len: rand(10, 18), v: rand(520, 760) });
    }
  }

  function spawnFlock() {
    var dir = Math.random() < 0.5 ? 1 : -1;
    var count = 3 + Math.floor(Math.random() * 4);
    var birds = [];
    var span = 0;
    for (var i = 0; i < count; i++) {
      var side = i % 2 === 0 ? 1 : -1;
      var step = Math.ceil(i / 2);
      var ox = step * 28;
      birds.push({ ox: ox, oy: side * step * 11, size: rand(7, 10), phase: rand(0, 6.28) });
      if (ox > span) { span = ox; }
    }
    flocks.push({
      dir: dir,
      x: dir > 0 ? -30 : W + 30,
      y: H * rand(0.1, 0.38),
      v: rand(55, 95),
      span: span + 30,
      birds: birds
    });
  }

  function spawnBolt() {
    var x = rand(W * 0.12, W * 0.88);
    var y = H * rand(0.08, 0.2);
    var endY = H * rand(0.55, 0.75);
    var steps = 9;
    var pts = [[x, y]];
    var i;
    for (i = 1; i <= steps; i++) {
      pts.push([pts[i - 1][0] + rand(-38, 38), y + (endY - y) * i / steps]);
    }
    var bi = 3 + Math.floor(Math.random() * 3);
    var dir = Math.random() < 0.5 ? -1 : 1;
    var branch = [[pts[bi][0], pts[bi][1]]];
    for (i = 1; i <= 4; i++) {
      branch.push([branch[i - 1][0] + dir * rand(10, 30), branch[i - 1][1] + rand(25, 50)]);
    }
    bolts.push({ pts: pts, branch: branch, t: 0, dur: 0.5 });
    for (i = 0; i < thunderCbs.length; i++) {
      try { thunderCbs[i](); } catch (e) { /* ignore */ }
    }
  }

  function boltIntensity(t) {
    if (t < 0.07) { return 1; }
    if (t < 0.13) { return 0.15; }
    if (t < 0.22) { return 0.9; }
    return Math.max(0, 1 - (t - 0.22) / 0.28);
  }

  /* ---------- update ---------- */
  function ease(key, dt) {
    var target = TARGET[state][key];
    var k = 1 - Math.exp(-dt / TAU[key]);
    amt[key] += (target - amt[key]) * k;
  }

  function update(dt) {
    clock += dt;

    if (!reduce) {
      var elapsed = (Date.now() - stateStart) / 1000;
      if (elapsed >= DURATION[state]) {
        stateStart = Date.now();
        state = ORDER[(ORDER.indexOf(state) + 1) % ORDER.length];
        saveState();
      }
      ease('dark', dt); ease('rain', dt); ease('sun', dt); ease('rainbow', dt);
    }
    if (document.body) { document.body.classList.toggle('is-stormy', amt.dark > 0.55); }

    var wind = currentWind();
    var i;

    if (!reduce) {
      var sinceStart = (Date.now() - stateStart) / 1000;
      if (state === 'cloudy' || (state === 'rain' && sinceStart < 6)) {
        lightningTimer -= dt;
        if (lightningTimer <= 0) {
          spawnBolt();
          lightningTimer = rand(1.8, 4.2);
        }
      }
      for (i = bolts.length - 1; i >= 0; i--) {
        bolts[i].t += dt;
        if (bolts[i].t > bolts[i].dur) { bolts.splice(i, 1); }
      }
    }

    for (i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      c.x += c.v * dt * (1 + wind * 0.5);
      if (c.x > W + 170) { c.x = -170; c.y = H * rand(0.05, 0.37); }
    }

    for (i = 0; i < leaves.length; i++) {
      var l = leaves[i];
      l.y += l.vy * (1 - 0.3 * amt.rain) * dt;
      l.x += (10 + wind * 28) * dt;
      l.rot += l.rs * dt;
      if (l.y > H + 20 || l.x > W + 60) { leaves[i] = newLeaf(false); }
    }

    birdTimer -= dt;
    if (birdTimer <= 0) {
      if (amt.rain < 0.2 && amt.dark < 0.8) { spawnFlock(); }
      birdTimer = rand(9, 19);
    }
    for (i = flocks.length - 1; i >= 0; i--) {
      var f = flocks[i];
      f.x += f.dir * f.v * dt;
      if ((f.dir > 0 && f.x - f.span > W + 30) || (f.dir < 0 && f.x + f.span < -30)) {
        flocks.splice(i, 1);
      }
    }

    if (amt.rain > 0.02) {
      for (i = 0; i < drops.length; i++) {
        var d = drops[i];
        d.y += d.v * dt;
        d.x += d.v * 0.18 * dt;
        if (d.y > H) { d.y = -d.len; d.x = rand(-50, W + 50); }
      }
    }
  }

  /* ---------- drawing ---------- */
  function drawSky() {
    var top = mix(TOP_CLEAR, TOP_DARK, amt.dark);
    var bot = mix(BOT_CLEAR, BOT_DARK, amt.dark);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, rgb(top));
    g.addColorStop(1, rgb(bot));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  function drawSun() {
    if (amt.sun < 0.02) { return; }
    var R = Math.max(30, Math.min(W, H) * 0.05);
    var x = W * 0.84;
    var y = Math.max(70, H * 0.16);
    var g = ctx.createRadialGradient(x, y, R * 0.4, x, y, R * 5);
    g.addColorStop(0, 'rgba(255,238,160,' + (0.85 * amt.sun) + ')');
    g.addColorStop(1, 'rgba(255,238,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - R * 5, y - R * 5, R * 10, R * 10);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(clock * 0.08);
    ctx.strokeStyle = 'rgba(255,214,90,' + (0.45 * amt.sun) + ')';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (var i = 0; i < 14; i++) {
      ctx.rotate(Math.PI * 2 / 14);
      ctx.beginPath();
      ctx.moveTo(R * 1.35, 0);
      ctx.lineTo(R * (1.75 + 0.2 * Math.sin(clock * 1.5 + i)), 0);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(255,213,74,' + amt.sun + ')';
    ctx.beginPath();
    ctx.arc(x, y, R, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRainbow() {
    if (amt.rainbow < 0.02) { return; }
    var cx = W * 0.6;
    var cy = H * 0.95;
    var R0 = Math.min(W * 0.46, H * 0.82);
    var bw = Math.max(7, Math.min(14, W / 90));
    ctx.lineWidth = bw;
    ctx.lineCap = 'butt';
    for (var i = 0; i < RAINBOW.length; i++) {
      ctx.strokeStyle = rgb(RAINBOW[i], 0.5 * amt.rainbow);
      ctx.beginPath();
      ctx.arc(cx, cy, R0 - i * bw, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawClouds() {
    var col = mix([255, 255, 255], [128, 140, 152], amt.dark);
    var alpha = 0.94 - 0.1 * amt.dark;
    ctx.fillStyle = rgb(col, alpha);
    for (var i = 0; i < clouds.length; i++) {
      var c = clouds[i];
      ctx.beginPath();
      for (var j = 0; j < PUFFS.length; j++) {
        var p = PUFFS[j];
        var px = c.x + p[0] * c.s;
        var py = c.y + p[1] * c.s;
        var pr = p[2] * c.s;
        ctx.moveTo(px + pr, py);
        ctx.arc(px, py, pr, 0, Math.PI * 2);
      }
      ctx.fill();
    }
  }

  function drawBirds() {
    if (reduce) { return; }
    ctx.strokeStyle = 'rgba(40,55,48,' + (0.85 * (1 - amt.rain)) + ')';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (var i = 0; i < flocks.length; i++) {
      var f = flocks[i];
      for (var j = 0; j < f.birds.length; j++) {
        var b = f.birds[j];
        var bx = f.x - f.dir * b.ox;
        var by = f.y + b.oy + Math.sin(clock * 1.2 + b.phase) * 4;
        var s = b.size;
        var flap = Math.sin(clock * 9 + b.phase) * s * 0.8;
        ctx.beginPath();
        ctx.moveTo(bx - s * 1.4, by - flap * 0.6);
        ctx.quadraticCurveTo(bx - s * 0.5, by - s * 0.5 - flap, bx, by);
        ctx.quadraticCurveTo(bx + s * 0.5, by - s * 0.5 - flap, bx + s * 1.4, by - flap * 0.6);
        ctx.stroke();
      }
    }
  }

  function hillY(h, x) {
    return H * (h.base + h.amp * Math.sin(x / W * Math.PI * 2 * h.f + h.ph) +
      h.amp * 0.5 * Math.sin(x / W * Math.PI * 5 * h.f + h.ph * 2));
  }

  function drawHills() {
    for (var i = 0; i < HILLS.length; i++) {
      var h = HILLS[i];
      var darker = [(h.col[0] * 0.7) | 0, (h.col[1] * 0.78) | 0, (h.col[2] * 0.78) | 0];
      ctx.fillStyle = rgb(mix(h.col, darker, amt.dark));
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (var x = 0; x <= W; x += 12) { ctx.lineTo(x, hillY(h, x)); }
      ctx.lineTo(W, hillY(h, W));
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  /* ---------- realistic trees: drawn once to a sprite, then reused ---------- */
  function makeTreeSprite(t) {
    var rnd = seeded(t.seed * 977 + 13);
    var uw = 340, uh = 320;
    var k = Math.max(0.7, Math.min(1.3, W / 1100));
    var ts = t.s * k * 0.75;
    var px = ts * Math.min(DPR, 1.5);
    var c = document.createElement('canvas');
    c.width = Math.ceil(uw * px);
    c.height = Math.ceil(uh * px);
    var g = c.getContext('2d');
    g.scale(px, px);
    var bx = uw / 2;
    var by = uh - 6;
    var tips = [];

    /* ground shadow and root flare */
    g.fillStyle = 'rgba(20,40,20,0.22)';
    g.beginPath();
    g.ellipse(bx + 8, by + 2, 52, 7, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#4a3220';
    g.beginPath();
    g.moveTo(bx - 9, by - 22);
    g.quadraticCurveTo(bx - 12, by - 4, bx - 30, by + 2);
    g.lineTo(bx + 30, by + 2);
    g.quadraticCurveTo(bx + 12, by - 4, bx + 9, by - 22);
    g.closePath();
    g.fill();

    var ratio = t.kind === 0 ? 0.72 : 0.78;
    var spread = t.kind === 0 ? 0.55 : 0.34;

    function branch(x, y, ang, len, wid, depth) {
      var x2 = x + Math.cos(ang) * len;
      var y2 = y + Math.sin(ang) * len;
      var w2 = wid * 0.68;
      var nx = -Math.sin(ang);
      var ny = Math.cos(ang);
      g.fillStyle = depth > 2 ? '#58391f' : '#4a3220';
      g.beginPath();
      g.moveTo(x + nx * wid / 2, y + ny * wid / 2);
      g.lineTo(x2 + nx * w2 / 2, y2 + ny * w2 / 2);
      g.lineTo(x2 - nx * w2 / 2, y2 - ny * w2 / 2);
      g.lineTo(x - nx * wid / 2, y - ny * wid / 2);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(190,150,104,0.35)';
      g.lineWidth = Math.max(0.6, wid * 0.18);
      g.beginPath();
      g.moveTo(x - nx * wid * 0.22, y - ny * wid * 0.22);
      g.lineTo(x2 - nx * w2 * 0.22, y2 - ny * w2 * 0.22);
      g.stroke();
      if (depth <= 3) { tips.push([x2, y2]); }
      if (depth <= 0 || len < 9) { return; }
      var n = depth > 3 ? 2 : (rnd() < 0.5 ? 2 : 3);
      for (var i = 0; i < n; i++) {
        var side = n === 2 ? (i === 0 ? -1 : 1) : (i - 1);
        var off = side * (spread + rnd() * 0.25) + (rnd() - 0.5) * 0.15;
        branch(x2, y2, ang + off, len * (ratio + rnd() * 0.08), w2, depth - 1);
      }
    }

    var trunkLen = t.kind === 0 ? 62 : 60;
    branch(bx, by - 18, -Math.PI / 2 + (rnd() - 0.5) * 0.12, trunkLen, 20, 5);
    if (!tips.length) { tips.push([bx, by - 120]); }

    function clump(x, y, r, col) {
      g.fillStyle = col;
      for (var i = 0; i < 6; i++) {
        var a = rnd() * 6.283;
        var d = rnd() * r * 0.7;
        var rr = r * (0.45 + rnd() * 0.25);
        g.beginPath();
        g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, 6.283);
        g.fill();
      }
    }

    var passes = [
      { n: 60, r: [13, 21], col: 'rgb(38,86,40)',   dx: 0,  dy: 3 },
      { n: 70, r: [10, 17], col: 'rgb(64,120,50)',  dx: -2, dy: -1 },
      { n: 56, r: [7, 12],  col: 'rgb(104,160,66)', dx: -4, dy: -4 },
      { n: 30, r: [4, 8],   col: 'rgb(150,192,84)', dx: -6, dy: -6 }
    ];
    passes.forEach(function (p) {
      for (var i = 0; i < p.n; i++) {
        var tip = tips[Math.floor(rnd() * tips.length)];
        var r = p.r[0] + rnd() * (p.r[1] - p.r[0]);
        clump(tip[0] + (rnd() - 0.5) * 34 + p.dx, tip[1] + (rnd() - 0.5) * 30 + p.dy, r, p.col);
      }
    });

    /* darker copy used while it rains */
    var d = document.createElement('canvas');
    d.width = c.width;
    d.height = c.height;
    var dg = d.getContext('2d');
    dg.drawImage(c, 0, 0);
    dg.globalCompositeOperation = 'source-atop';
    dg.fillStyle = 'rgba(34,50,62,0.4)';
    dg.fillRect(0, 0, d.width, d.height);

    return { c: c, d: d, ts: ts, uw: uw, uh: uh };
  }

  function buildTreeSprites() {
    treeSprites = [];
    for (var i = 0; i < TREES.length; i++) {
      try { treeSprites.push(makeTreeSprite(TREES[i])); } catch (e) { treeSprites.push(null); }
    }
  }

  function drawTrees() {
    var wind = currentWind();
    for (var i = 0; i < TREES.length; i++) {
      var t = TREES[i];
      var sp = treeSprites[i];
      if (!sp) { continue; }
      var x = t.x * W;
      var y = hillY(HILLS[t.h], x) + 3;
      var sway = reduce ? 0 : Math.sin(clock * 0.8 + t.x * 10) * 0.012 * (1 + wind);
      var dw = sp.uw * sp.ts;
      var dh = sp.uh * sp.ts;
      var oy = -(sp.uh - 6) * sp.ts;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(sway);
      ctx.drawImage(sp.c, -dw / 2, oy, dw, dh);
      if (amt.dark > 0.02) {
        ctx.globalAlpha = amt.dark;
        ctx.drawImage(sp.d, -dw / 2, oy, dw, dh);
      }
      ctx.restore();
    }
  }

  function drawBolts() {
    for (var i = 0; i < bolts.length; i++) {
      var b = bolts[i];
      var k = boltIntensity(b.t);
      if (k <= 0.01) { continue; }
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,' + k + ')';
      ctx.shadowColor = 'rgba(190,215,255,' + k + ')';
      ctx.shadowBlur = 24;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.pts[0][0], b.pts[0][1]);
      for (var j = 1; j < b.pts.length; j++) { ctx.lineTo(b.pts[j][0], b.pts[j][1]); }
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.branch[0][0], b.branch[0][1]);
      for (var m = 1; m < b.branch.length; m++) { ctx.lineTo(b.branch[m][0], b.branch[m][1]); }
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFlash() {
    var level = 0;
    for (var i = 0; i < bolts.length; i++) {
      level = Math.max(level, boltIntensity(bolts[i].t));
    }
    if (level > 0.01) {
      ctx.fillStyle = 'rgba(225,235,255,' + (0.38 * level) + ')';
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawLeaves() {
    for (var i = 0; i < leaves.length; i++) {
      var l = leaves[i];
      var x = l.x + Math.sin(clock * l.fr + l.ph) * l.amp;
      ctx.save();
      ctx.translate(x, l.y);
      ctx.rotate(l.rot);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = l.col;
      ctx.beginPath();
      ctx.moveTo(-l.s, 0);
      ctx.quadraticCurveTo(0, -l.s * 0.8, l.s, 0);
      ctx.quadraticCurveTo(0, l.s * 0.8, -l.s, 0);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawRain() {
    if (amt.rain <= 0.02) { return; }
    var n = Math.floor(drops.length * amt.rain);
    ctx.strokeStyle = 'rgba(235,245,255,' + (0.1 + 0.55 * amt.rain) + ')';
    ctx.lineWidth = 1.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i < n; i++) {
      var d = drops[i];
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.len * 0.18, d.y + d.len);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(110,128,142,' + (0.12 * amt.rain) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  function draw() {
    drawSky();
    drawSun();
    drawRainbow();
    drawClouds();
    drawBolts();
    drawBirds();
    drawHills();
    drawTrees();
    drawLeaves();
    drawRain();
    drawFlash();
  }

  /* ---------- setup ---------- */
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildTreeSprites();
    if (reduce) { draw(); }
  }

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120);
  });
  window.addEventListener('pagehide', saveState);

  loadState();
  resize();
  makeClouds();
  makeLeaves();
  makeDrops();

  window.Weather = {
    onThunder: function (cb) { thunderCbs.push(cb); },
    getState: function () { return state; },
    getAmounts: function () {
      return { dark: amt.dark, rain: amt.rain, sun: amt.sun, rainbow: amt.rainbow, wind: currentWind() };
    }
  };

  if (reduce) {
    draw();
    return;
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
