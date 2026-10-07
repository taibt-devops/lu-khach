'use strict';
/* Ải 1 — Lối Hẹp: an endless-runner. Wooden boards fly in on three lanes; steer onto the board that
   carries the next part of the verse. Pass 1: decoys are other parts of the verse (order).
   Pass 2: decoys are near-misses of the right part (exact wording). */
class RunnerScene extends Phaser.Scene {
  constructor() { super('Runner'); }
  init(data) { this.levelIndex = data.level; }

  create() {
    const lv = LK.C.levels[this.levelIndex];
    this.v = LK.verse(lv.verse);
    this.parts = this.v.chunks.map(c => c.t);
    this.easy = LK.save.easy;
    this.time.timeScale = LK.SPEED;
    this.tweens.timeScale = LK.SPEED;

    this.bg = this.add.tileSprite(0, 0, LK.W, LK.H, 'bg-run').setOrigin(0);
    this.bgScale = LK.H / this.textures.get('bg-run').getSourceImage().height;
    this.bg.setTileScale(this.bgScale);
    this.lanes = [445, 555, 665];
    this.lane = 1;
    this.hero = this.add.sprite(230, this.lanes[1], 'run0').setOrigin(0.5, 0.94).setScale(0.3).setDepth(20);
    this.hero.play('run');
    this.hearts = LK.hearts(this, 3);
    this.bar = LK.verseBar(this, this.parts, this.v.ref);
    LK.backButton(this);

    this.pass = 0;
    this.idx = 0;
    this.gates = [];                                          // every board row still on screen
    this.over = false;
    this.speed = this.easy ? 150 : 195;

    this.input.on('pointerdown', p => { this.downY = p.y; });
    this.input.on('pointerup', p => {
      if (p.y < 170) return;                                  // top HUD
      const dy = p.y - (this.downY ?? p.y);
      if (Math.abs(dy) > 45) this.setLane(this.lane + Math.sign(dy));
      else this.setLane(this.laneAt(p.y));
    });
    const kb = this.input.keyboard;
    kb.on('keydown-UP', () => this.setLane(this.lane - 1));
    kb.on('keydown-W', () => this.setLane(this.lane - 1));
    kb.on('keydown-DOWN', () => this.setLane(this.lane + 1));
    kb.on('keydown-S', () => this.setLane(this.lane + 1));

    LK.debug = {
      scene: 'Runner',
      state: () => ({ pass: this.pass, idx: this.idx, hearts: this.hearts.n, gate: !!this.pending(), over: this.over, onScreen: this.gates.length }),
      act: ok => { const g = this.pending(); if (g) this.setLane(ok ? g.correctLane : g.signs.find(s => !s.correct).lane); },
    };

    const b = LK.banner(this, 'Lượt 1', 'Chạm vào tấm biển có cụm từ tiếp theo!');
    this.time.delayedCall(1700, () => { b.destroy(); this.spawnGate(); });
  }

  pending() { return this.gates.find(g => !g.resolved); }

  laneAt(y) {
    let best = 0;
    this.lanes.forEach((ly, i) => { if (Math.abs(y - (ly - 70)) < Math.abs(y - (this.lanes[best] - 70))) best = i; });
    return best;
  }

  setLane(i) {
    if (this.over || i < 0 || i > 2 || i === this.lane) return;
    this.lane = i;
    LK.sfx.tap();
    this.tweens.add({ targets: this.hero, y: this.lanes[i], duration: 150, ease: 'Sine.easeOut' });
    this.hero.setDepth(20 + i);
  }

  spawnGate() {
    if (this.over) return;
    const right = this.parts[this.idx];
    const pool = this.pass === 0 ? this.parts.filter((_, i) => i !== this.idx) : this.v.chunks[this.idx].near;
    const n = this.easy ? 2 : 3;
    const options = LK.shuffle([right, ...LK.shuffle(pool).slice(0, n - 1)]);
    const lanes = n === 3 ? [0, 1, 2] : LK.shuffle([0, 1, 2]).slice(0, 2).sort();
    const gate = { x: LK.W + 220, signs: [], resolved: false, correctLane: -1 };
    this.gates.push(gate);
    options.forEach((t, k) => {
      const lane = lanes[k];
      const c = this.add.container(gate.x, this.lanes[lane] - 78).setDepth(10 + lane);
      const g = this.add.graphics();
      g.fillStyle(0x5a3a1c, 1).fillRect(-6, 30, 12, 50);
      g.fillStyle(LK.INK, 1).fillRoundedRect(-185, -38, 370, 80, 14);
      g.fillStyle(0xc68a4e, 1).fillRoundedRect(-185, -42, 370, 80, 14);
      g.lineStyle(3, LK.INK, 1).strokeRoundedRect(-185, -42, 370, 80, 14);
      g.fillStyle(0x7a4f27, 1).fillCircle(-168, -26, 4).fillCircle(168, -26, 4);
      const txt = LK.text(this, 0, -2, t, 22, { color: '#2a1a08', wrap: 340, lineSpacing: -4 });
      c.add([g, txt]);
      gate.signs.push({ c, lane, text: t, correct: t === right });
      if (t === right) gate.correctLane = lane;
    });
  }

  update(_t, delta) {
    if (this.over) return;
    const dt = (delta / 1000) * LK.SPEED;
    const speed = this.speed * (1 + this.pass * 0.15);
    this.bg.tilePositionX += (speed * dt) / this.bgScale;
    for (const gate of this.gates) {
      gate.x -= speed * dt;
      gate.signs.forEach(s => { s.c.x = gate.x; });
      if (!gate.resolved && gate.x <= this.hero.x + 30) this.resolve(gate);
    }
    this.gates = this.gates.filter(gate => {
      if (gate.x > -260) return true;
      gate.signs.forEach(s => s.c.destroy());
      return false;
    });
  }

  resolve(gate) {
    gate.resolved = true;
    const hit = gate.signs.find(s => s.lane === this.lane);
    const right = gate.signs.find(s => s.correct);
    // boards already passed fade out, so only the boards ahead are ever readable
    const fade = (s, delay = 0) => this.tweens.add({ targets: s.c, alpha: 0, duration: 260, delay });
    if (hit && hit.correct) {
      LK.sfx.good();
      LK.burst(this, hit.c.x, hit.c.y, 0xffe08a, 24);
      this.tweens.add({ targets: hit.c, scale: 1.25, alpha: 0, duration: 260 });
      gate.signs.filter(s => s !== hit).forEach(s => fade(s));
      this.bar.advance();
    } else {
      gate.signs.filter(s => s !== right).forEach(s => fade(s));
      fade(right, 700);
      LK.sfx.bad();
      LK.sfx.splash();
      LK.mud(this, this.hero.x + 20, this.hero.y - 20);
      this.cameras.main.shake(220, 0.008);
      this.hero.stop().setTexture('hero-hurt');
      this.time.delayedCall(650, () => { if (!this.over) this.hero.play('run'); });
      this.tweens.add({ targets: right.c, scale: 1.12, yoyo: true, repeat: 2, duration: 140 });
      LK.floatText(this, LK.W / 2, 220, `Đúng là: ${right.text}`, '#ffe08a', 26);
      this.bar.advance();
      if (this.hearts.lose() <= 0) { this.fail(); return; }
    }
    this.idx += 1;
    if (this.idx >= this.parts.length) this.time.delayedCall(900, () => this.endPass());
    else this.time.delayedCall(this.easy ? 700 : 450, () => this.spawnGate());
  }

  endPass() {
    if (this.over) return;
    if (this.pass === 0) {
      this.pass = 1;
      this.idx = 0;
      this.bar.reset();
      LK.say('praise-1');
      const b = LK.banner(this, 'Lượt 2: nhớ thật chính xác!', 'Các tấm biển giờ chỉ khác nhau một chữ. Cẩn thận nhé!');
      this.time.delayedCall(2200, () => { b.destroy(); this.spawnGate(); });
    } else {
      this.win();
    }
  }

  win() {
    this.over = true;
    this.hero.stop().setTexture('hero-cheer');
    LK.burst(this, this.hero.x, this.hero.y - 80, [0xffe08a, 0xffffff], 40);
    this.time.delayedCall(1400, () => this.scene.start('Result', { level: this.levelIndex, stars: this.hearts.n, won: true }));
  }

  fail() {
    this.over = true;
    this.time.delayedCall(1200, () => this.scene.start('Result', { level: this.levelIndex, stars: 0, won: false }));
  }
}
