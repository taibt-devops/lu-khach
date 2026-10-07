'use strict';
/* Ải 3 — Đường Đêm: darkness everywhere; only the first letters of Ma-thi-ơ 11:28 glow at the bottom.
   Pick the lantern with the next word to light it — light pushes the dark back and the path goes on.
   The traveller's own lamp burns down; waiting too long costs a heart. */
class LanternScene extends Phaser.Scene {
  constructor() { super('Lantern'); }
  init(data) { this.levelIndex = data.level; }

  create() {
    const lv = LK.C.levels[this.levelIndex];
    this.v = LK.verse(lv.verse);
    this.words = this.v.words;
    this.easy = LK.save.easy;
    this.time.timeScale = LK.SPEED;
    this.tweens.timeScale = LK.SPEED;
    this.oilTime = this.easy ? 16 : 11;

    this.bg = this.add.tileSprite(0, 0, LK.W, LK.H, 'bg-night').setOrigin(0);
    const src = this.textures.get('bg-night').getSourceImage();
    this.bgScale = Math.max(LK.W / src.width, LK.H / src.height);
    this.bg.setTileScale(this.bgScale);

    this.hero = this.add.image(250, 630, 'hero').setOrigin(0.5, 0.94).setScale(0.3).setDepth(30);
    this.posts = [];                                   // lit lanterns left along the path
    this.idx = 0;
    this.over = false;
    this.busy = false;
    this.oil = 1;

    this.dark = this.add.renderTexture(0, 0, LK.W, LK.H).setOrigin(0).setDepth(500);
    this.glowImg = this.make.image({ key: 'glow' }, false);

    this.hearts = LK.hearts(this, 3);
    this.bar = LK.verseBar(this, this.words.map(w => w.t), this.v.ref);
    LK.backButton(this);
    this.cueRow();

    LK.debug = {
      scene: 'Lantern',
      state: () => ({ idx: this.idx, hearts: this.hearts.n, busy: this.busy, over: this.over }),
      act: ok => {
        if (this.busy || this.over || !this.options) return;
        const o = this.options.find(x => !x.dead && (x.text === this.words[this.idx].t) === ok);
        if (o) this.choose(o);
      },
    };
    const b = LK.banner(this, 'Đường Đêm', 'Chọn chiếc đèn có từ tiếp theo. Chữ cái đầu ở dưới sẽ giúp bạn!');
    this.time.delayedCall(1800, () => { b.destroy(); this.spawn(); });
  }

  /** First letters of every word along the bottom; the current one glows. */
  cueRow() {
    const g = this.add.graphics().setDepth(600);
    g.fillStyle(LK.INK, 0.8).fillRoundedRect(110, 668, LK.W - 220, 46, 23);
    const n = this.words.length;
    const span = LK.W - 300;
    this.cues = this.words.map((w, i) => LK.text(this, 150 + (span * i) / (n - 1), 690, LK.firstLetter(w.t), 26,
      { color: '#8fa3c7' }).setDepth(601));
    this.markCue();
  }

  markCue() {
    this.cues.forEach((c, i) => {
      c.setColor(i < this.idx ? '#ffe08a' : i === this.idx ? '#ffffff' : '#8fa3c7');
      c.setScale(i === this.idx ? 1.45 : 1);
    });
  }

  spawn() {
    if (this.over) return;
    const w = this.words[this.idx];
    const n = this.easy ? 2 : 3;
    const options = LK.shuffle([w.t, ...LK.shuffle(w.near).slice(0, n - 1)]);
    const xs = n === 3 ? [700, 900, 1100] : [800, 1020];
    this.options = options.map((text, k) => {
      const x = xs[k];
      const lamp = this.add.image(x, 330, 'lantern-off').setScale(0.36).setDepth(40);
      const label = LK.text(this, x, 445, text, 30, { color: '#fff8e7', stroke: '#0b1020', strokeThickness: 6 }).setDepth(610);
      lamp.setAlpha(0);
      label.setAlpha(0);
      this.tweens.add({ targets: [lamp, label], alpha: 1, duration: 260, delay: k * 80 });
      this.tweens.add({ targets: lamp, angle: { from: -5, to: 5 }, duration: 900 + k * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const o = { lamp, label, text, dead: false };
      const hit = this.add.zone(x, 380, 190, 260).setInteractive({ useHandCursor: true }).setDepth(620);
      hit.on('pointerup', () => this.choose(o));
      o.hit = hit;
      return o;
    });
    this.oil = 1;
  }

  choose(o) {
    if (this.busy || this.over || o.dead) return;
    if (o.text !== this.words[this.idx].t) {
      o.dead = true;
      LK.sfx.bad();
      o.lamp.setTint(0x555566);
      o.label.setColor('#77809a');
      this.tweens.add({ targets: o.lamp, angle: 25, yoyo: true, duration: 120, repeat: 1 });
      if (this.hearts.lose() <= 0) this.fail();
      return;
    }
    this.busy = true;
    LK.sfx.light();
    o.lamp.setTexture('lantern-on');
    LK.burst(this, o.lamp.x, o.lamp.y, [0xffe08a, 0xfff3c4], 22);
    this.bar.advance();
    for (const other of this.options) {
      other.hit.destroy();
      if (other !== o) this.tweens.add({ targets: [other.lamp, other.label], alpha: 0, duration: 250, onComplete: () => { other.lamp.destroy(); other.label.destroy(); } });
    }
    this.tweens.add({ targets: o.label, alpha: 0, duration: 250, onComplete: () => o.label.destroy() });
    // the lit lantern floats to a post beside the path, then the world walks on
    const postX = this.hero.x + 120;
    this.tweens.add({
      targets: o.lamp, x: postX, y: 470, scale: 0.26, angle: 0, duration: 450, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.tweens.killTweensOf(o.lamp);
        o.lamp.setAngle(0);
        this.posts.push(o.lamp);
        this.walk();
      },
    });
  }

  walk() {
    const dx = 150;
    this.tweens.add({ targets: this.posts, x: `-=${dx}`, duration: 500, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.hero, y: this.hero.y - 6, yoyo: true, duration: 125, repeat: 1 });
    this.tweens.add({
      targets: this.bg, tilePositionX: this.bg.tilePositionX + dx / this.bgScale, duration: 500, ease: 'Sine.easeInOut',
      onComplete: () => {
        this.posts = this.posts.filter(p => { if (p.x < -60) { p.destroy(); return false; } return true; });
        this.idx += 1;
        this.markCue();
        this.busy = false;
        if (this.idx >= this.words.length) this.win();
        else this.spawn();
      },
    });
  }

  update(_t, delta) {
    const dt = (delta / 1000) * LK.SPEED;
    if (!this.over && !this.busy && this.options) {
      this.oil -= dt / this.oilTime;
      if (this.oil <= 0) {
        this.oil = 1;
        LK.sfx.bad();
        this.cameras.main.shake(180, 0.006);
        LK.floatText(this, this.hero.x, this.hero.y - 180, 'Đèn sắp tắt!', '#ffb3a0', 26);
        if (this.hearts.lose() <= 0) this.fail();
      }
    }
    // darkness with holes of light: the traveller's lamp (shrinks as oil burns), lit posts, faint candidates
    this.dark.clear();
    this.dark.fill(0x050915, this.over ? 0.25 : 0.84);
    const glow = (x, y, r) => { this.glowImg.setScale((r * 2) / 256); this.dark.erase(this.glowImg, x, y); };
    glow(this.hero.x, this.hero.y - 70, 130 + 120 * Math.max(0, this.oil));
    for (const p of this.posts) glow(p.x, p.y, 170);
    if (this.options) for (const o of this.options) if (o.lamp.active && !o.dead) glow(o.lamp.x, o.lamp.y + 40, 120);
  }

  win() {
    this.over = true;
    this.hero.setTexture('hero-cheer');
    LK.burst(this, this.hero.x, this.hero.y - 80, [0xffe08a, 0xffffff], 40);
    LK.floatText(this, LK.W / 2, 320, 'Ta sẽ cho các ngươi được yên nghỉ!', '#ffe08a', 34);
    this.time.delayedCall(1700, () => this.scene.start('Result', { level: this.levelIndex, stars: this.hearts.n, won: true }));
  }

  fail() {
    this.over = true;
    this.hero.setTexture('hero-hurt');
    this.time.delayedCall(1200, () => this.scene.start('Result', { level: this.levelIndex, stars: 0, won: false }));
  }
}
