'use strict';
/* Shared helpers for every scene: text/buttons, HUD pieces, sound, voice, save data, verse utils. */

const LK = window.LK = {
  W: 1280,
  H: 720,
  FONT: '"Baloo 2", "Segoe UI", sans-serif',
  INK: 0x1d2b22,
  GOLD: 0xffc93c,
  CREAM: 0xfff8e7,
  C: window.LK_CONTENT,
  A: window.LK_ASSETS,
};

// ---------------------------------------------------------------- save data
LK.SAVE_KEY = 'lukhach.v1';
LK.save = (() => {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(LK.SAVE_KEY)); } catch { /* blocked storage: play without saving */ }
  const save = Object.assign({ stars: {}, mastery: {}, shield: false, easy: false, muted: false, seen: {} }, s || {});
  if (save.seenIntro) { save.seen.r1 = true; delete save.seenIntro; }      // saves from the region-1-only build
  return save;
})();
LK.persist = () => { try { localStorage.setItem(LK.SAVE_KEY, JSON.stringify(LK.save)); } catch { /* ignore */ } };
LK.unlocked = i => i === 0 || (LK.save.stars[LK.C.levels[i - 1].id] || 0) > 0;
LK.addMastery = verseId => { LK.save.mastery[verseId] = (LK.save.mastery[verseId] || 0) + 1; LK.persist(); };
/** "Ải N" counts regular levels across regions; the boss has no number. */
LK.levelNo = i => LK.C.levels.slice(0, i + 1).filter(lv => lv.type !== 'Boss').length;
LK.regionLevels = r => LK.C.levels.map((lv, i) => ({ lv, i })).filter(x => x.lv.region === r);
/** First unlocked level without stars, or -1 when everything is done. */
LK.currentLevel = () => LK.C.levels.findIndex((lv, i) => LK.unlocked(i) && !LK.save.stars[lv.id]);

// ---------------------------------------------------------------- small utils
LK.shuffle = arr => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
LK.pick = arr => arr[Math.floor(Math.random() * arr.length)];
LK.firstLetter = w => (w.match(/[\p{L}]/u) || [''])[0];
LK.verse = id => LK.C.verses[id];

/** Every split of a verse must rebuild its text exactly — a typo here would teach the wrong words. */
LK.checkContent = () => {
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const problems = [];
  for (const [id, v] of Object.entries(LK.C.verses)) {
    for (const [name, list] of Object.entries(v)) {
      if (!Array.isArray(list)) continue;
      const parts = list.map(x => (typeof x === 'string' ? x : x.t));
      if (norm(parts.join(' ')) !== norm(v.text)) problems.push(`${id}.${name}`);
    }
  }
  if (problems.length) console.error('verse splits do not match the text:', problems.join(', '));
  return problems;
};

// ---------------------------------------------------------------- text + buttons
LK.text = (scene, x, y, str, size = 28, o = {}) => scene.add.text(x, y, str, {
  fontFamily: LK.FONT,
  fontSize: `${size}px`,
  fontStyle: o.weight || '700',
  color: o.color || '#fff8e7',
  stroke: o.stroke || '#1d2b22',
  strokeThickness: o.strokeThickness ?? 0,
  align: o.align || 'center',
  wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
  lineSpacing: o.lineSpacing ?? 2,
  testString: '|ÉẤỆỨỸĐqgy',          // room for Vietnamese stacked diacritics
  padding: { x: 2, y: 6 },
}).setOrigin(o.ox ?? 0.5, o.oy ?? 0.5);

LK.button = (scene, x, y, label, onClick, o = {}) => {
  const w = o.w || 230;
  const h = o.h || 64;
  const color = o.color ?? LK.GOLD;
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = down => {
    g.clear();
    g.fillStyle(LK.INK, 1).fillRoundedRect(-w / 2, -h / 2 + 6, w, h, 18);
    g.fillStyle(color, 1).fillRoundedRect(-w / 2, -h / 2 + (down ? 4 : 0), w, h, 18);
    g.lineStyle(3, LK.INK, 1).strokeRoundedRect(-w / 2, -h / 2 + (down ? 4 : 0), w, h, 18);
  };
  draw(false);
  const t = LK.text(scene, 0, -2, label, o.size || 26, { color: o.textColor || '#1d2b22' });
  c.add([g, t]);
  c.setSize(w, h + 6).setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => { draw(true); t.y = 2; });
  c.on('pointerout', () => { draw(false); t.y = -2; });
  c.on('pointerup', () => { draw(false); t.y = -2; LK.sfx.tap(); onClick(); });
  c.label = t;
  return c;
};

LK.roundButton = (scene, x, y, glyph, onClick, size = 30) => LK.button(scene, x, y, glyph, onClick, { w: 64, h: 60, size });

LK.panel = (scene, x, y, w, h, color = LK.CREAM, alpha = 1) => {
  const g = scene.add.graphics({ x, y });
  g.fillStyle(LK.INK, 0.35).fillRoundedRect(-w / 2 + 6, -h / 2 + 10, w, h, 26);
  g.fillStyle(color, alpha).fillRoundedRect(-w / 2, -h / 2, w, h, 26);
  g.lineStyle(4, LK.INK, 1).strokeRoundedRect(-w / 2, -h / 2, w, h, 26);
  return g;
};

/** Background image scaled to cover the screen. */
LK.cover = (scene, key, tint) => {
  const img = scene.add.image(LK.W / 2, LK.H / 2, key);
  img.setScale(Math.max(LK.W / img.width, LK.H / img.height));
  if (tint != null) img.setTint(tint);
  return img;
};

LK.backButton = (scene, to = 'Map') => LK.roundButton(scene, 52, 46, '‹', () => { LK.stopVoice(); scene.scene.start(to); }, 40)
  .setDepth(1000);

// ---------------------------------------------------------------- HUD
LK.hearts = (scene, n, x = LK.W - 40, y = 46) => {
  const icons = [0, 1, 2].map(i => scene.add.image(x - i * 52, y, 'heart').setScale(0.13).setDepth(1000));
  const hud = {
    n,
    set(v) {
      this.n = v;
      icons.forEach((ic, i) => {
        const on = i < v;
        ic.setAlpha(on ? 1 : 0.25).setTint(on ? 0xffffff : 0x777777);
      });
    },
    lose() {
      this.set(this.n - 1);
      const ic = icons[this.n];
      if (ic) scene.tweens.add({ targets: ic, scale: 0.2, yoyo: true, duration: 120 });
      return this.n;
    },
  };
  hud.set(n);
  return hud;
};

/** The verse being built, shown at the top: finished parts bright, the rest as dots. */
LK.verseBar = (scene, parts, ref, y = 110) => {
  const bg = scene.add.graphics().setDepth(900);
  bg.fillStyle(LK.INK, 0.72).fillRoundedRect(110, y - 46, LK.W - 220, 92, 22);
  const t = LK.text(scene, LK.W / 2, y - 4, '', 24, { wrap: LK.W - 280, lineSpacing: 0 }).setDepth(901);
  const r = LK.text(scene, LK.W - 128, y + 30, ref, 16, { color: '#ffc93c', ox: 1 }).setDepth(901);
  const bar = {
    done: 0,
    render() {
      const shown = parts.slice(0, this.done).join(' ');
      const rest = parts.slice(this.done).map(p => '·'.repeat(Math.min(6, Math.max(2, Math.round(p.length / 4))))).join(' ');
      t.setText(this.done ? `${shown} ${rest}`.trim() : rest);
    },
    advance() { this.done += 1; this.render(); scene.tweens.add({ targets: t, scale: 1.06, yoyo: true, duration: 120 }); },
    reset() { this.done = 0; this.render(); },
    objects: [bg, t, r],
  };
  bar.render();
  return bar;
};

LK.floatText = (scene, x, y, str, color = '#ffc93c', size = 34) => {
  const t = LK.text(scene, x, y, str, size, { color, stroke: '#1d2b22', strokeThickness: 6 }).setDepth(1200);
  scene.tweens.add({ targets: t, y: y - 70, alpha: 0, duration: 1100, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  return t;
};

LK.burst = (scene, x, y, tint = 0xffd66e, count = 18) => {
  const p = scene.add.particles(0, 0, 'dot', {
    speed: { min: 90, max: 280 }, lifespan: 650, scale: { start: 0.55, end: 0 }, tint, emitting: false,
  }).setDepth(1100);
  p.explode(count, x, y);
  scene.time.delayedCall(800, () => p.destroy());
};

LK.mud = (scene, x, y) => LK.burst(scene, x, y, [0x5b3a1e, 0x7a5230, 0x3f2a16], 22);

LK.banner = (scene, str, sub) => {
  const c = scene.add.container(LK.W / 2, LK.H / 2).setDepth(1500);
  const p = LK.panel(scene, 0, 0, 640, sub ? 170 : 120);
  c.add([p, LK.text(scene, 0, sub ? -26 : 0, str, 40, { color: '#1d2b22' })]);
  if (sub) c.add(LK.text(scene, 0, 32, sub, 22, { color: '#4d3a1f', wrap: 580, weight: '600' }));
  c.setScale(0.6).setAlpha(0);
  scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
  return c;
};

// ---------------------------------------------------------------- sound effects (synthesised)
let actx = null;
function tone(f, start, dur, type = 'triangle', gain = 0.14) {
  if (LK.save.muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = actx.currentTime + start;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(actx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  } catch { /* no audio device */ }
}
function noise(dur = 0.25, gain = 0.2, freq = 600) {
  if (LK.save.muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const len = Math.floor(actx.sampleRate * dur);
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = actx.createBufferSource();
    const f = actx.createBiquadFilter();
    const g = actx.createGain();
    f.type = 'lowpass';
    f.frequency.value = freq;
    g.gain.value = gain;
    src.buffer = buf;
    src.connect(f).connect(g).connect(actx.destination);
    src.start();
  } catch { /* no audio device */ }
}
LK.sfx = {
  tap: () => tone(720, 0, 0.06, 'sine', 0.07),
  good: () => [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.07, 0.18)),
  bad: () => { tone(220, 0, 0.16, 'square', 0.05); tone(165, 0.12, 0.24, 'square', 0.05); },
  splash: () => noise(0.35, 0.25, 500),
  slash: () => { noise(0.12, 0.18, 3000); tone(880, 0, 0.12, 'sawtooth', 0.04); },
  hit: () => { noise(0.18, 0.3, 900); tone(140, 0, 0.2, 'sine', 0.2); },
  jump: () => tone(440, 0, 0.12, 'sine', 0.08),
  light: () => [659.25, 987.77].forEach((f, i) => tone(f, i * 0.08, 0.3, 'sine', 0.09)),
  shoot: () => { noise(0.14, 0.16, 2400); tone(520, 0, 0.08, 'sine', 0.05); },
  caw: () => { tone(330, 0, 0.09, 'sawtooth', 0.05); tone(280, 0.1, 0.12, 'sawtooth', 0.05); },
  crack: () => { noise(0.3, 0.3, 700); tone(110, 0, 0.25, 'sine', 0.15); },
  rumble: () => noise(0.6, 0.22, 160),
  win: () => [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.26, 'triangle', 0.12)),
};

// ---------------------------------------------------------------- voice clips (embedded mp3)
let voice = null;
LK.say = key => {
  if (LK.save.muted || !LK.A.audio[key]) return;
  if (voice) voice.pause();
  voice = new Audio(LK.A.audio[key]);
  voice.play().catch(() => {});
};
LK.stopVoice = () => { if (voice) voice.pause(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) LK.stopVoice(); });

// Android wrapper hooks (same contract as Word Island): system Back = on-screen back button.
window.wordIslandBack = () => {
  const game = LK.game;
  const active = game && game.scene.getScenes(true)[0];
  if (!active || active.scene.key === 'Map' || active.scene.key === 'Boot') return false;
  LK.stopVoice();
  active.scene.start('Map');                      // the map opens on LK.lastRegion
  return true;
};
window.wordIslandPause = () => LK.stopVoice();
