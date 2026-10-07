'use strict';
/* Ải 2 — Qua Đầm Lầy: stepping stones. Each step offers stones carrying look-alike pieces of
   Thi Thiên 40:2; jump on the right one before the mud rises. A wrong stone sinks. */
class RiverScene extends Phaser.Scene {
  constructor() { super('River'); }
  init(data) { this.levelIndex = data.level; }

  create() {
    const lv = LK.C.levels[this.levelIndex];
    this.v = LK.verse(lv.verse);
    this.steps = this.v.steps;
    this.easy = LK.save.easy;
    this.time.timeScale = LK.SPEED;
    this.tweens.timeScale = LK.SPEED;
    this.limit = this.easy ? 15 : 10;

    this.bg = this.add.tileSprite(0, 0, LK.W, LK.H, 'bg-river').setOrigin(0);
    this.bgScale = Math.max(LK.W / this.textures.get('bg-river').getSourceImage().width, LK.H / this.textures.get('bg-river').getSourceImage().height);
    this.bg.setTileScale(this.bgScale);
    this.rows = [470, 572, 674];
    this.heroX = 230;
    this.stepDx = 300;
    this.idx = 0;
    this.over = false;
    this.busy = false;
    this.choices = [];

    this.under = this.stone(this.heroX, this.rows[1], null);
    this.hero = this.add.sprite(this.heroX, this.rows[1] - 18, 'hero').setOrigin(0.5, 0.94).setScale(0.3).setDepth(30);
    this.hearts = LK.hearts(this, 3);
    this.bar = LK.verseBar(this, this.steps.map(s => s.t), this.v.ref);
    LK.backButton(this);

    // rising-mud timer
    this.timerBg = this.add.graphics().setDepth(900);
    this.timerBg.fillStyle(LK.INK, 0.7).fillRoundedRect(LK.W / 2 - 260, 178, 520, 30, 15);
    this.timer = this.add.graphics().setDepth(901);
    this.timerLabel = LK.text(this, LK.W / 2, 193, 'Bùn đang dâng…', 16, { color: '#fff8e7' }).setDepth(902);
    this.left = this.limit;

    LK.debug = {
      scene: 'River',
      state: () => ({ idx: this.idx, hearts: this.hearts.n, busy: this.busy, over: this.over, choices: this.choices.length }),
      act: ok => {
        if (this.busy || this.over) return;
        const ch = this.choices.find(x => (x.text === this.steps[this.idx].t) === ok);
        if (ch) this.choose(ch);
      },
    };
    const b = LK.banner(this, 'Qua Đầm Lầy', 'Chạm vào hòn đá có cụm từ tiếp theo để nhảy qua!');
    this.time.delayedCall(1700, () => { b.destroy(); this.spawn(); });
  }

  stone(x, y, label) {
    const c = this.add.container(x, y).setDepth(20 + y / 100);
    c.add(this.add.image(0, 0, 'stone').setScale(0.66));
    if (label) c.add(LK.text(this, 0, -8, label, 23, { color: '#1b1b14', stroke: '#f3efe2', strokeThickness: 4 }));
    return c;
  }

  spawn() {
    if (this.over) return;
    const s = this.steps[this.idx];
    const n = this.easy ? 2 : 3;
    const options = LK.shuffle([s.t, ...LK.shuffle(s.near).slice(0, n - 1)]);
    const rows = n === 3 ? [0, 1, 2] : LK.shuffle([0, 1, 2]).slice(0, 2).sort();
    this.choices = options.map((text, k) => {
      const y = this.rows[rows[k]];
      const c = this.stone(this.heroX + this.stepDx, y, text);
      c.setAlpha(0).y = y + 30;
      this.tweens.add({ targets: c, alpha: 1, y, duration: 280, delay: k * 70, ease: 'Back.easeOut' });
      c.setSize(250, 120).setInteractive({ useHandCursor: true });
      const ch = { c, text, row: rows[k] };
      c.on('pointerup', () => this.choose(ch));
      return ch;
    });
    this.left = this.limit;
  }

  choose(ch) {
    if (this.busy || this.over) return;
    const right = this.steps[this.idx].t;
    if (ch.text !== right) {
      LK.sfx.bad();
      LK.sfx.splash();
      ch.c.disableInteractive();
      this.choices = this.choices.filter(x => x !== ch);
      this.tweens.add({ targets: ch.c, y: ch.c.y + 60, alpha: 0, duration: 420, onComplete: () => ch.c.destroy() });
      LK.burst(this, ch.c.x, ch.c.y, [0x6b8f8a, 0x4d6b5e], 16);
      if (this.hearts.lose() <= 0) this.fail();
      return;
    }
    this.busy = true;
    LK.sfx.jump();
    const y0 = this.hero.y;
    const y1 = ch.c.y - 18;
    this.hero.play('jump');
    const o = { t: 0 };
    this.tweens.add({
      targets: o, t: 1, duration: 520, ease: 'Sine.easeInOut',
      onUpdate: () => {
        this.hero.x = this.heroX + this.stepDx * o.t;
        this.hero.y = y0 + (y1 - y0) * o.t - Math.sin(Math.PI * o.t) * 120;
      },
      onComplete: () => this.landed(ch),
    });
  }

  landed(ch) {
    LK.sfx.good();
    LK.burst(this, ch.c.x, ch.c.y - 30, 0xffe08a, 14);
    this.bar.advance();
    this.hero.setTexture('hero');
    for (const other of this.choices) {
      if (other === ch) continue;
      this.tweens.add({ targets: other.c, y: other.c.y + 50, alpha: 0, duration: 380, onComplete: () => other.c.destroy() });
    }
    this.choices = [];
    const old = this.under;
    this.under = ch.c;
    ch.c.list.filter(o => o.type === 'Text').forEach(t => t.destroy());   // the stone is just ground now
    // scroll the world back so the hero stands at heroX again
    const bgTo = this.bg.tilePositionX + this.stepDx / this.bgScale;
    this.tweens.add({ targets: [this.hero, ch.c, old], x: `-=${this.stepDx}`, duration: 420, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.bg, tilePositionX: bgTo, duration: 420, ease: 'Sine.easeInOut',
      onComplete: () => {
        old.destroy();
        this.idx += 1;
        this.busy = false;
        if (this.idx >= this.steps.length) this.win();
        else this.spawn();
      } });
  }

  update(_t, delta) {
    if (this.over || this.busy || !this.choices.length) return;
    this.left -= (delta / 1000) * LK.SPEED;
    const f = Math.max(0, this.left / this.limit);
    this.timer.clear().fillStyle(f > 0.35 ? 0x8bc34a : 0xe8743b, 1).fillRoundedRect(LK.W / 2 - 254, 182, 508 * f, 22, 11);
    if (this.left <= 0) {
      LK.sfx.splash();
      LK.mud(this, this.hero.x, this.hero.y - 10);
      this.cameras.main.shake(200, 0.007);
      this.left = this.limit;
      if (this.hearts.lose() <= 0) this.fail();
    }
  }

  win() {
    this.over = true;
    this.timer.clear();
    this.hero.setTexture('hero-cheer');
    LK.burst(this, this.hero.x, this.hero.y - 80, [0xffe08a, 0xffffff], 40);
    LK.floatText(this, LK.W / 2, 300, 'Ngài đặt chân tôi trên hòn đá!', '#ffe08a', 34);
    this.time.delayedCall(1600, () => this.scene.start('Result', { level: this.levelIndex, stars: this.hearts.n, won: true }));
  }

  fail() {
    this.over = true;
    this.hero.setTexture('hero-hurt');
    this.time.delayedCall(1200, () => this.scene.start('Result', { level: this.levelIndex, stars: 0, won: false }));
  }
}
