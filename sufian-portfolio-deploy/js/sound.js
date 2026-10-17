/* ==========================================================
   Nature sound, generated live in the browser (no audio files).
   - wind: always soft, a little stronger in rain
   - rain: follows the rain in the sky
   - birds: chirp only when the sky is clear
   Browsers block sound until the visitor interacts with the page,
   so there is a Sound on/off button. The choice is remembered.
   ========================================================== */
(function () {
  'use strict';

  var KEY = 'portfolio-sound';
  var AC = window.AudioContext || window.webkitAudioContext;

  var enabled = false;
  var ctx = null;
  var master = null;
  var windGain = null;
  var rainGain = null;
  var birdGain = null;
  var noiseBuf = null;
  var birdTimer = null;
  var btn = null;

  var ICON_ON =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 9v6h4l5 4V5L7 9H3z"/><path d="M16 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12"/></svg>';
  var ICON_OFF =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M3 9v6h4l5 4V5L7 9H3z"/><path d="M16 9l5 6"/><path d="M21 9l-5 6"/></svg>';

  function readPref() {
    try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; }
  }
  function writePref(on) {
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* ignore */ }
  }

  function amounts() {
    if (window.Weather && window.Weather.getAmounts) { return window.Weather.getAmounts(); }
    return { rain: 0, sun: 1, wind: 0.3 };
  }

  /* ---------- button ---------- */
  function setUi() {
    if (!btn) { return; }
    btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    btn.setAttribute('aria-label', enabled ? 'Turn nature sound off' : 'Turn nature sound on');
    btn.innerHTML = (enabled ? ICON_ON : ICON_OFF) + '<span>Sound ' + (enabled ? 'on' : 'off') + '</span>';
  }

  function createButton() {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sound-btn glass';
    btn.addEventListener('click', function () {
      if (enabled) { disable(); } else { enable(true); }
    });
    document.body.appendChild(btn);
    setUi();
  }

  /* ---------- audio graph ---------- */
  function makeNoise() {
    var len = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) { data[i] = Math.random() * 2 - 1; }
    return buf;
  }

  function buildAudio() {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    var noise = makeNoise();
    noiseBuf = noise;

    /* wind */
    var wsrc = ctx.createBufferSource();
    wsrc.buffer = noise;
    wsrc.loop = true;
    var wlp = ctx.createBiquadFilter();
    wlp.type = 'lowpass';
    wlp.frequency.value = 420;
    wlp.Q.value = 0.8;
    windGain = ctx.createGain();
    windGain.gain.value = 0.05;
    wsrc.connect(wlp);
    wlp.connect(windGain);
    windGain.connect(master);

    var lfo1 = ctx.createOscillator();
    lfo1.frequency.value = 0.11;
    var lfo1Depth = ctx.createGain();
    lfo1Depth.gain.value = 180;
    lfo1.connect(lfo1Depth);
    lfo1Depth.connect(wlp.frequency);

    var lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.07;
    var lfo2Depth = ctx.createGain();
    lfo2Depth.gain.value = 0.025;
    lfo2.connect(lfo2Depth);
    lfo2Depth.connect(windGain.gain);

    /* rain */
    var rsrc = ctx.createBufferSource();
    rsrc.buffer = noise;
    rsrc.loop = true;
    var rhp = ctx.createBiquadFilter();
    rhp.type = 'highpass';
    rhp.frequency.value = 800;
    var rlp = ctx.createBiquadFilter();
    rlp.type = 'lowpass';
    rlp.frequency.value = 8000;
    rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rsrc.connect(rhp);
    rhp.connect(rlp);
    rlp.connect(rainGain);
    rainGain.connect(master);

    /* birds bus */
    birdGain = ctx.createGain();
    birdGain.gain.value = 0.6;
    birdGain.connect(master);

    wsrc.start();
    rsrc.start();
    lfo1.start();
    lfo2.start();

    setInterval(updateMix, 250);
  }

  function updateMix() {
    if (!ctx || !enabled) { return; }
    var a = amounts();
    var now = ctx.currentTime;
    windGain.gain.setTargetAtTime(0.04 + 0.09 * a.wind, now, 0.6);
    rainGain.gain.setTargetAtTime(0.22 * a.rain, now, 0.6);
  }

  /* ---------- birds ---------- */
  function chirpPhrase(t) {
    var base = 2300 + Math.random() * 1700;
    var notes = 2 + Math.floor(Math.random() * 4);
    for (var k = 0; k < notes; k++) {
      var t0 = t + k * 0.12;
      var osc = ctx.createOscillator();
      var env = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base * (0.92 + Math.random() * 0.2), t0);
      osc.frequency.exponentialRampToValueAtTime(base * (1.15 + Math.random() * 0.4), t0 + 0.07);
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(0.16, t0 + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      osc.connect(env);
      env.connect(birdGain);
      osc.start(t0);
      osc.stop(t0 + 0.11);
    }
  }

  function scheduleBird() {
    clearTimeout(birdTimer);
    if (!enabled || !ctx) { return; }
    var a = amounts();
    if (a.rain < 0.15 && a.sun > 0.2 && ctx.state === 'running') {
      var phrases = 1 + Math.floor(Math.random() * 3);
      for (var i = 0; i < phrases; i++) {
        chirpPhrase(ctx.currentTime + 0.05 + i * 0.55);
      }
    }
    birdTimer = setTimeout(scheduleBird, 2200 + Math.random() * 5000);
  }

  /* ---------- thunder (after each lightning flash) ---------- */
  function thunder() {
    if (!enabled || !ctx || ctx.state !== 'running' || !noiseBuf) { return; }
    var t0 = ctx.currentTime + 0.4 + Math.random() * 1.0;
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.loop = true;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(420, t0);
    lp.frequency.exponentialRampToValueAtTime(70, t0 + 2.8);
    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.linearRampToValueAtTime(1.1, t0 + 0.08);
    env.gain.exponentialRampToValueAtTime(0.35, t0 + 0.6);
    env.gain.linearRampToValueAtTime(0.5, t0 + 0.9);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.2);
    src.connect(lp);
    lp.connect(env);
    env.connect(master);
    src.start(t0);
    src.stop(t0 + 3.3);
  }

  /* ---------- on / off ---------- */
  function enable(persist) {
    if (!AC) { return; }
    if (!ctx) { buildAudio(); }
    enabled = true;
    if (persist) { writePref(true); }
    if (ctx.resume) { ctx.resume(); }
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
    setUi();
    scheduleBird();
  }

  function disable() {
    enabled = false;
    writePref(false);
    clearTimeout(birdTimer);
    if (ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      setTimeout(function () {
        if (!enabled && ctx && ctx.state === 'running') { ctx.suspend(); }
      }, 800);
    }
    setUi();
  }

  /* If sound was on during the last page, start again after the first touch/click/key */
  function armResume() {
    var events = ['pointerdown', 'keydown', 'touchstart'];
    function handler(e) {
      if (btn && e.target && btn.contains(e.target)) { return; }
      if (enabled && ctx && ctx.state !== 'running') { ctx.resume(); }
      for (var i = 0; i < events.length; i++) { document.removeEventListener(events[i], handler, true); }
    }
    for (var i = 0; i < events.length; i++) { document.addEventListener(events[i], handler, true); }
  }

  function init() {
    createButton();
    if (window.Weather && window.Weather.onThunder) { window.Weather.onThunder(thunder); }
    if (!AC) {
      btn.disabled = true;
      btn.innerHTML = '<span>Sound not supported</span>';
      return;
    }
    if (readPref()) {
      enable(false);
      armResume();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
