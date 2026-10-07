'use strict';
/* Ải 4 — Núi Sấm Sét: scrolls tumble down the mountain. Run left and right to catch the one carrying the next
   part of Châm Ngôn 3:5-6; catching a wrong one costs a heart, and a missed right one simply falls again.
   Fire rocks fall too — a shadow and a "!" show where — and a hit costs a heart. */
class CatchScene extends Phaser.Scene {
  constructor() { super('Catch'); }
  init(data) { this.levelIndex = data.level; }

  create() {
    const lv = LK.C.levels[this.levelIndex];
    this.v = LK.verse(lv.verse);
    this.drops = this.v.drops;
    this.easy = LK.save.easy;
    this.time.timeScale = LK.SPEED;
    this.tweens.timeScale = LK.SPEED;
    this.fallSpeed = this.easy ? 95 : 125;          // scrolls, px/s
    this.rockSpeed = this.easy ? 260 : 340;
    this.rockEvery = this.easy ? 4.5 : 3.0;         // seconds between fire rocks
    this.runSpeed = 640;

    LK.cover(this, 'bg-sinai');
    this.flash = this.add.rectangle(0, 0, LK.W, LK.H, 0xffffff, 0).setOrigin(0).setDepth(800);
    this.groundY = 652;
    this.hero = this.add.sprite(640, this.groundY, 'hero').setOrigin(0.5, 0.94).setScale(0.3).setDepth(30);
    this.targetX = 640;
    this.hearts = LK.hearts(this, 3);
    this.bar = LK.verseBar(this, this.drops.map(d => d.t), this.v.ref);
    LK.backButton(this);

    this.idx = 0;
    this.over = false;
    this.wave = [];
    this.waveNo = 0;                                 // counts drops, so a test driver sees a fresh wave
    this.rocks = [];
    this.now = 0;                                    // scene clock in seconds (scaled like the game)
    this.poseUntil = 0;                              // reach / hurt pose holds the hero still
    this.safeUntil = 0;                              // blink after a rock hit
    this.rockClock = 3;
    this.thunderClock = 5;
    this.started = false;

    // touch or drag anywhere below the HUD; arrow keys on a keyboard
    const aim = p => { if (p.y > 170) this.targetX = Phaser.Math.Clamp(p.x, 90, LK.W - 90); };
    this.input.on('pointerdown', aim);
    this.input.on('pointermove', p => { if (p.isDown) aim(p); });
    this.keys = this.input.keyboard.createCursorKeys();

    LK.debug = {
      scene: 'Catch',
      state: () => ({ idx: this.idx, hearts: this.hearts.n, over: this.over, wave: this.waveNo,
        ready: this.wave.some(s => !s.done && s.right), wrong: this.wave.some(s => !s.done && !s.right) }),
      // stand under a scroll (the right one, or a wrong one) and let it fall into the hands
      act: ok => { const s = this.wave.find(x => !x.done && x.right === ok); if (s) { this.hero.x = s.x0; this.targetX = s.x0; } },
      calm: () => {                                   // tests only: no fire rocks, so hearts count answers alone
        this.rockEvery = 1e9;
        this.rockClock = 1e9;
        this.rocks.forEach(r => { r.gone = true; [r.img, r.shadow, r.warn].forEach(o => o.destroy()); });
        this.rocks = [];
      },
    };

    const b = LK.banner(this, 'Núi Sấm Sét', 'Chạm hoặc kéo để chạy. Hứng cuộn chữ có cụm từ tiếp theo, né đá lửa!');
    this.time.delayedCall(2000, () => { b.destroy(); this.started = true; this.spawnWave(); });
  }

  scroll(text, x, y) {
    const c = this.add.container(x, y).setDepth(20);
    c.add(this.add.image(0, 0, 'scroll').setScale(0.62));
    c.add(LK.text(this, 0, -2, text, 21, { color: '#3a2508', wrap: 175, lineSpacing: -4 }));
    return c;
  }

  /** The right scroll and its decoys appear in a row, then drop one after another. */
  spawnWave() {
    if (this.over) return;
    this.waveNo += 1;
    const d = this.drops[this.idx];
    const others = this.drops.filter((_, i) => i !== this.idx).map(x => x.t);
    const decoys = this.easy ? [LK.pick(Math.random() < 0.5 ? d.near : others)] : [LK.pick(d.near), LK.pick(others)];
    const texts = LK.shuffle([d.t, ...decoys]);
    const cols = LK.shuffle([190, 410, 640, 870, 1090]).slice(0, texts.length);
    this.wave = texts.map((t, k) => {
      const x0 = cols[k] + Phaser.Math.Between(-25, 25);
      const c = this.scroll(t, x0, 238);
      c.setAlpha(0).setScale(0.5);
      this.tweens.add({ targets: c, alpha: 1, scale: 1, duration: 260, delay: k * 90, ease: 'Back.easeOut' });
      return { c, x0, text: t, right: t === d.t, wait: 0.9 + k * (this.easy ? 1.2 : 0.85), sway: Math.random() * 6, done: false };
    });
  }

  update(_t, delta) {
    if (this.over) return;
    const dt = (delta / 1000) * LK.SPEED;
    this.now += dt;
    this.moveHero(dt);
    if (!this.started) return;
    this.fallScrolls(dt);
    this.fallRocks(dt);
    this.thunder(dt);
  }

  moveHero(dt) {
    if (this.keys.left.isDown) this.targetX = Math.max(90, this.hero.x - 60);
    if (this.keys.right.isDown) this.targetX = Math.min(LK.W - 90, this.hero.x + 60);
    if (this.now < this.poseUntil) return;
    const dx = this.targetX - this.hero.x;
    if (Math.abs(dx) > 4) {
      this.hero.x += Math.sign(dx) * Math.min(Math.abs(dx), this.runSpeed * dt);
      this.hero.setFlipX(dx < 0);
      if (!this.hero.anims.isPlaying) this.hero.play('run');
    } else if (this.hero.anims.isPlaying || this.hero.texture.key !== 'hero') {
      this.hero.stop().setTexture('hero');
    }
  }

  fallScrolls(dt) {
    for (const s of this.wave) {
      if (s.done) continue;
      if (s.wait > 0) { s.wait -= dt; continue; }
      s.sway += dt * 2.4;
      s.c.y += this.fallSpeed * dt;
      s.c.x = s.x0 + Math.sin(s.sway) * 12;
      const handsY = this.groundY - 150;
      if (s.c.y > handsY - 30 && s.c.y < handsY + 80 && Math.abs(s.c.x - this.hero.x) < 100 && this.hero.texture.key !== 'hero-hurt') {
        this.caught(s);
      } else if (s.c.y > this.groundY - 20) {
        this.landed(s);
      }
    }
  }

  caught(s) {
    s.done = true;
    this.hero.stop().setTexture('hero-reach');
    this.poseUntil = this.now + 0.35;
    if (!s.right) {
      LK.sfx.bad();
      LK.burst(this, s.c.x, s.c.y, [0xcdb68a, 0x8a6b3c], 16);
      this.tweens.add({ targets: s.c, scale: 0, angle: 90, alpha: 0, duration: 300, onComplete: () => s.c.destroy() });
      LK.floatText(this, s.c.x, s.c.y - 60, 'Không phải cụm này!', '#ffb3a0', 26);
      if (this.hearts.lose() <= 0) this.fail();
      return;
    }
    LK.sfx.good();
    LK.burst(this, s.c.x, s.c.y, [0xffe08a, 0xffffff], 24);
    this.tweens.add({ targets: s.c, x: this.hero.x, y: this.hero.y - 120, scale: 0.2, alpha: 0, duration: 280, onComplete: () => s.c.destroy() });
    this.bar.advance();
    this.clearWave(s);
    this.idx += 1;
    if (this.idx >= this.drops.length) this.time.delayedCall(500, () => this.win());
    else this.time.delayedCall(550, () => this.spawnWave());
  }

  landed(s) {
    s.done = true;
    this.tweens.add({ targets: s.c, alpha: 0, y: s.c.y + 20, duration: 260, onComplete: () => s.c.destroy() });
    if (!s.right) return;                                  // a wrong scroll left alone: well dodged
    LK.floatText(this, s.c.x, s.c.y - 70, 'Hụt rồi! Cuộn chữ sẽ rơi lại.', '#fff3b0', 24);
    this.clearWave(s);
    this.time.delayedCall(700, () => this.spawnWave());
  }

  clearWave(keep) {
    for (const o of this.wave) {
      if (o === keep || o.done) continue;
      o.done = true;
      this.tweens.add({ targets: o.c, alpha: 0, duration: 220, onComplete: () => o.c.destroy() });
    }
  }

  fallRocks(dt) {
    this.rockClock -= dt;
    if (this.rockClock <= 0) {
      this.rockClock = this.rockEvery * Phaser.Math.FloatBetween(0.8, 1.25);
      this.spawnRock();
    }
    for (const r of this.rocks) {
      r.img.y += this.rockSpeed * dt;
      r.img.angle += 120 * dt;
      const f = Phaser.Math.Clamp((r.img.y - 170) / (this.groundY - 190), 0, 1);
      r.shadow.setSize(40 + 70 * f, 12 + 8 * f).setAlpha(0.2 + 0.3 * f);
      const nearHero = Math.abs(r.img.x - this.hero.x) < 58 && r.img.y > this.groundY - 150 && r.img.y < this.groundY - 10;
      if (nearHero && this.now > this.safeUntil) this.rockHit(r);
      else if (r.img.y > this.groundY - 20) this.rockLand(r);
    }
    this.rocks = this.rocks.filter(r => !r.gone);
  }

  spawnRock() {
    const aimAtHero = Math.random() < (this.easy ? 0.3 : 0.45);
    const x = Phaser.Math.Clamp(aimAtHero ? this.hero.x + Phaser.Math.Between(-110, 110) : Phaser.Math.Between(110, LK.W - 110), 80, LK.W - 80);
    const img = this.add.image(x, 170, 'rock').setScale(0.24).setDepth(25);
    const shadow = this.add.ellipse(x, this.groundY + 2, 40, 12, 0x000000, 0.2).setDepth(15);
    const warn = LK.text(this, x, this.groundY - 40, '!', 44, { color: '#ff6a3d', stroke: '#1d2b22', strokeThickness: 7 }).setDepth(16);
    this.tweens.add({ targets: warn, scale: 1.3, yoyo: true, repeat: -1, duration: 160 });
    this.rocks.push({ img, shadow, warn, gone: false });
  }

  rockLand(r) {
    r.gone = true;
    LK.burst(this, r.img.x, this.groundY - 10, [0xff8a3d, 0xffd166, 0x5a3a2a], 18);
    LK.sfx.hit();
    this.cameras.main.shake(120, 0.004);
    [r.img, r.shadow, r.warn].forEach(o => o.destroy());
  }

  rockHit(r) {
    this.rockLand(r);
    this.safeUntil = this.now + 1.6;
    this.poseUntil = this.now + 0.6;
    this.hero.stop().setTexture('hero-hurt');
    this.tweens.add({ targets: this.hero, alpha: 0.35, yoyo: true, repeat: 4, duration: 140, onComplete: () => this.hero.setAlpha(1) });
    LK.sfx.bad();
    LK.floatText(this, this.hero.x, this.hero.y - 190, 'Ui! Đá lửa!', '#ffb3a0', 28);
    if (this.hearts.lose() <= 0) this.fail();
  }

  /** Now and then the mountain flashes and rumbles (a soft flash, never a full-screen strobe). */
  thunder(dt) {
    this.thunderClock -= dt;
    if (this.thunderClock > 0) return;
    this.thunderClock = Phaser.Math.FloatBetween(6, 10);
    LK.sfx.rumble();
    this.tweens.add({ targets: this.flash, fillAlpha: 0.18, duration: 90, yoyo: true });
  }

  win() {
    this.over = true;
    this.rocks.forEach(r => [r.img, r.shadow, r.warn].forEach(o => o.destroy()));
    this.hero.stop().setTexture('hero-cheer').setFlipX(false);
    LK.burst(this, this.hero.x, this.hero.y - 80, [0xffe08a, 0xffffff], 40);
    LK.floatText(this, LK.W / 2, 320, 'Thì Ngài sẽ chỉ dẫn các nẻo của con!', '#ffe08a', 34);
    this.time.delayedCall(1700, () => this.scene.start('Result', { level: this.levelIndex, stars: this.hearts.n, won: true }));
  }

  fail() {
    this.over = true;
    this.hero.stop().setTexture('hero-hurt');
    this.time.delayedCall(1200, () => this.scene.start('Result', { level: this.levelIndex, stars: 0, won: false }));
  }
}
