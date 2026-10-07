'use strict';
/* Ải 5 — Đường Mây: a path of stones over a chasm of clouds. Stones carrying words drift up on the wind;
   tap one (or drag it) into the glowing gap to pave the next part of Giăng 14:6, and the traveller walks on.
   A wrong stone cracks and drops into the clouds. The stone underfoot crumbles if you wait too long.
   Pass 1: decoys are other parts of the verse (order). Pass 2: stronger wind, decoys are near-misses. */
class PathScene extends Phaser.Scene {
  constructor() { super('Path'); }
  init(data) { this.levelIndex = data.level; }

  create() {
    const lv = LK.C.levels[this.levelIndex];
    this.v = LK.verse(lv.verse);
    this.tiles = this.v.tiles;
    this.parts = this.tiles.map(t => t.t);
    this.easy = LK.save.easy;
    this.time.timeScale = LK.SPEED;
    this.tweens.timeScale = LK.SPEED;
    this.limit = this.easy ? 18 : 12;               // seconds before the stone underfoot crumbles

    this.bg = this.add.tileSprite(0, 0, LK.W, LK.H, 'bg-cliff').setOrigin(0);
    const src = this.textures.get('bg-cliff').getSourceImage();
    this.bgScale = Math.max(LK.W / src.width, LK.H / src.height);
    this.bg.setTileScale(this.bgScale);

    this.slabY = 520;                                // centre of a path stone
    this.topY = this.slabY - 30;                     // where feet stand on it
    this.heroX = 250;
    this.dx = 236;                                   // one stone of path
    this.gapX = this.heroX + this.dx;
    this.lanes = [700, 910, 1120];
    this.path = [-2, -1, 0].map(k => this.slab(this.heroX + k * this.dx, this.slabY, null).setDepth(20));
    this.hero = this.add.sprite(this.heroX, this.topY, 'hero').setOrigin(0.5, 0.94).setScale(0.3).setDepth(30);
    this.gap = this.gapMarker();

    this.hearts = LK.hearts(this, 3);
    this.bar = LK.verseBar(this, this.parts, this.v.ref);
    LK.backButton(this);

    this.timerBg = this.add.graphics().setDepth(900);
    this.timerBg.fillStyle(LK.INK, 0.7).fillRoundedRect(LK.W / 2 - 260, 178, 520, 30, 15);
    this.timer = this.add.graphics().setDepth(901);
    this.timerLabel = LK.text(this, LK.W / 2, 193, 'Phiến đá dưới chân sắp vỡ…', 16, { color: '#fff8e7' }).setDepth(902);
    this.left = this.limit;

    this.pass = 0;
    this.idx = 0;
    this.over = false;
    this.busy = false;
    this.started = false;
    this.floaters = [];
    this.sinceRight = 0;
    this.spawnClock = 0;
    this.lastLane = -1;

    this.input.dragDistanceThreshold = 12;
    this.input.on('dragstart', (_p, obj) => { const f = obj.floater; if (f && !f.done) { f.held = true; f.dragging = true; obj.setDepth(70); } });
    this.input.on('drag', (_p, obj, x, y) => { if (obj.floater && !obj.floater.done) { obj.x = x; obj.y = y; } });
    this.input.on('dragend', (_p, obj) => {
      const f = obj.floater;
      if (!f || f.done) return;
      f.held = false;
      obj.setDepth(40);
      if (Phaser.Math.Distance.Between(obj.x, obj.y, this.gapX, this.slabY) < 150) this.place(f);
    });

    LK.debug = {
      scene: 'Path',
      state: () => ({ pass: this.pass, idx: this.idx, hearts: this.hearts.n, busy: this.busy, over: this.over,
        right: this.visible().some(f => f.text === this.parts[this.idx]), wrong: this.visible().some(f => f.text !== this.parts[this.idx]) }),
      act: ok => {
        if (this.busy || this.over) return;
        const f = this.visible().find(x => (x.text === this.parts[this.idx]) === ok);
        if (f) this.place(f);
      },
    };

    const b = LK.banner(this, 'Đường Mây', 'Chạm (hoặc kéo) phiến đá có cụm từ tiếp theo vào chỗ trống để lát đường!');
    this.time.delayedCall(2000, () => { b.destroy(); this.started = true; });
  }

  slab(x, y, text) {
    const c = this.add.container(x, y);
    c.add(this.add.image(0, 0, 'slab').setScale(0.64));
    if (text) c.add(LK.text(this, 0, 2, text, 22, { color: '#fff8e7', stroke: '#2b1d10', strokeThickness: 5, wrap: 210, lineSpacing: -4 }));
    return c;
  }

  gapMarker() {
    const g = this.add.graphics({ x: this.gapX, y: this.slabY }).setDepth(18);
    g.fillStyle(LK.GOLD, 0.16).fillRoundedRect(-112, -34, 224, 76, 18);
    g.lineStyle(4, LK.GOLD, 1);
    for (let x = -112; x < 112; x += 22) g.lineBetween(x, -34, Math.min(x + 12, 112), -34).lineBetween(x, 42, Math.min(x + 12, 112), 42);
    for (let y = -34; y < 42; y += 22) g.lineBetween(-112, y, -112, Math.min(y + 12, 42)).lineBetween(112, y, 112, Math.min(y + 12, 42));
    this.tweens.add({ targets: g, alpha: 0.45, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return g;
  }

  visible() { return this.floaters.filter(f => !f.done && !f.held && f.c.y < LK.H - 40 && f.c.y > 230); }

  riseSpeed() { return (this.easy ? 48 : 62) * (this.pass ? 1.3 : 1); }

  /** Keep stones coming; the right one turns up at least every few stones. */
  spawn() {
    const right = this.parts[this.idx];
    const live = this.floaters.filter(f => !f.done);
    const haveRight = live.some(f => f.text === right);
    let text;
    if (!haveRight && (this.sinceRight >= (this.easy ? 1 : 2) || Math.random() < 0.45)) {
      text = right;
      this.sinceRight = 0;
    } else {
      const near = this.tiles[this.idx].near;
      const others = this.parts.filter(p => p !== right);
      const pool = this.pass === 0 ? others : (Math.random() < 0.7 ? near : others);
      const fresh = pool.filter(p => !live.some(f => f.text === p));
      text = LK.pick(fresh.length ? fresh : pool);
      this.sinceRight += 1;
    }
    const lanes = [0, 1, 2].filter(l => l !== this.lastLane);
    const lane = LK.pick(lanes);
    this.lastLane = lane;
    const c = this.slab(this.lanes[lane] + Phaser.Math.Between(-30, 30), LK.H + 60, text).setDepth(40);
    c.setSize(230, 96).setInteractive({ draggable: true, useHandCursor: true });
    const f = { c, text, x0: c.x, phase: Math.random() * 6, done: false, held: false, dragging: false };
    c.floater = f;
    c.on('pointerdown', () => { f.dragging = false; });
    c.on('pointerup', () => { if (!f.dragging) this.place(f); });
    this.floaters.push(f);
  }

  update(_t, delta) {
    if (this.over || !this.started) return;
    const dt = (delta / 1000) * LK.SPEED;
    this.spawnClock -= dt;
    if (this.spawnClock <= 0) {
      this.spawnClock = (this.easy ? 2.1 : 1.6) / (this.pass ? 1.2 : 1);
      this.spawn();
    }
    for (const f of this.floaters) {
      if (f.done || f.held) continue;
      f.phase += dt * 1.6;
      f.c.y -= this.riseSpeed() * dt;
      f.c.x += Math.cos(f.phase) * 10 * dt;
      f.c.angle = Math.sin(f.phase) * 3;
      if (f.c.y < 150) {
        f.done = true;
        this.tweens.add({ targets: f.c, alpha: 0, duration: 300, onComplete: () => f.c.destroy() });
      }
    }
    this.floaters = this.floaters.filter(f => !f.done || f.c.active);

    if (this.busy) return;
    this.left -= dt;
    const k = Math.max(0, this.left / this.limit);
    this.timer.clear().fillStyle(k > 0.35 ? 0x8bc34a : 0xe8743b, 1).fillRoundedRect(LK.W / 2 - 254, 182, 508 * k, 22, 11);
    if (this.left <= 0) {
      this.left = this.limit;
      LK.sfx.crack();
      this.cameras.main.shake(200, 0.007);
      const under = this.path[this.path.length - 1];
      this.tweens.add({ targets: under, y: under.y + 8, yoyo: true, duration: 90, repeat: 2 });
      LK.floatText(this, this.heroX, this.topY - 190, 'Đá sắp vỡ!', '#ffb3a0', 26);
      if (this.hearts.lose() <= 0) this.fail();
    }
  }

  place(f) {
    if (this.busy || this.over || f.done) return;
    f.c.disableInteractive();
    f.done = true;
    if (f.text !== this.parts[this.idx]) {
      LK.sfx.crack();
      LK.sfx.bad();
      f.c.list[0].setTint(0x8a7f74);
      LK.floatText(this, f.c.x, f.c.y - 70, 'Chưa đúng!', '#ffb3a0', 26);
      this.tweens.add({ targets: f.c, y: LK.H + 140, angle: 35, alpha: 0.4, duration: 700, ease: 'Quad.easeIn', onComplete: () => f.c.destroy() });
      if (this.hearts.lose() <= 0) this.fail();
      return;
    }
    this.busy = true;
    this.tweens.add({
      targets: f.c, x: this.gapX, y: this.slabY, angle: 0, duration: 300, ease: 'Back.easeOut',
      onComplete: () => {
        f.c.setDepth(20);
        LK.sfx.good();
        LK.burst(this, this.gapX, this.slabY - 20, 0xffe08a, 18);
        this.bar.advance();
        this.path.push(f.c);
        this.walk();
      },
    });
  }

  /** The traveller runs one stone forward; the world scrolls so he stays at heroX. */
  walk() {
    this.hero.play('run');
    this.gap.setVisible(false);
    this.tweens.add({ targets: this.path, x: `-=${this.dx}`, duration: 560, ease: 'Sine.easeInOut' });
    this.tweens.add({
      targets: this.bg, tilePositionX: this.bg.tilePositionX + this.dx / this.bgScale, duration: 560, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.hero.stop().setTexture('hero');
        this.path = this.path.filter(s => { if (s.x < -200) { s.destroy(); return false; } return true; });
        this.idx += 1;
        this.left = this.limit;
        this.busy = false;
        this.gap.setVisible(true);
        if (this.idx >= this.parts.length) this.endPass();
      },
    });
  }

  endPass() {
    if (this.pass === 0) {
      this.pass = 1;
      this.idx = 0;
      this.busy = true;
      this.bar.reset();
      this.sinceRight = 0;
      LK.say('praise-2');
      for (const f of this.floaters) if (!f.done) { f.done = true; this.tweens.add({ targets: f.c, alpha: 0, duration: 250, onComplete: () => f.c.destroy() }); }
      const b = LK.banner(this, 'Lượt 2: gió mạnh lên!', 'Lát đường lần nữa. Các phiến đá giờ chỉ khác nhau một chữ!');
      this.time.delayedCall(2300, () => { b.destroy(); this.busy = false; this.left = this.limit; });
    } else {
      this.win();
    }
  }

  win() {
    this.over = true;
    this.timer.clear();
    this.hero.setTexture('hero-cheer');
    LK.burst(this, this.hero.x, this.hero.y - 80, [0xffe08a, 0xffffff], 40);
    LK.floatText(this, LK.W / 2, 320, 'Ta là đường đi, lẽ thật, và sự sống!', '#ffe08a', 34);
    this.time.delayedCall(1700, () => this.scene.start('Result', { level: this.levelIndex, stars: this.hearts.n, won: true }));
  }

  fail() {
    this.over = true;
    this.hero.stop().setTexture('hero-hurt');
    this.time.delayedCall(1200, () => this.scene.start('Result', { level: this.levelIndex, stars: 0, won: false }));
  }
}
