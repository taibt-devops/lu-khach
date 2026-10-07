'use strict';
/* Ải 6 — Tháp Quạ: crows from the dark tower fly off with the Word (the parable of the sower). Tap to shoot an
   arrow: hit the crow carrying the next part of Thi Thiên 119:11 and it drops the scroll, which goes back into
   the traveller's heart. Hitting a crow with a wrong word costs a heart; a crow that gets away comes back.
   Round 1: short pieces, decoys are other pieces. Round 2: one word at a time, decoys are near-misses.
   Mức Dễ: slower crows, and the arrow curves toward the crow nearest the tap. */
class ArcheryScene extends Phaser.Scene {
  constructor() { super('Archery'); }
  init(data) { this.levelIndex = data.level; }

  create() {
    const lv = LK.C.levels[this.levelIndex];
    this.v = LK.verse(lv.verse);
    this.easy = LK.save.easy;
    this.time.timeScale = LK.SPEED;
    this.tweens.timeScale = LK.SPEED;
    this.arrowSpeed = this.easy ? 2100 : 1900;
    this.rounds = [
      { parts: this.v.pieces, decoys: i => this.v.pieces.filter((_, k) => k !== i) },
      { parts: this.v.words.map(w => w.t), decoys: i => this.v.words[i].near },
    ];

    LK.cover(this, 'bg-gate');
    this.hero = this.add.image(170, 660, 'hero-bow').setOrigin(0.5, 0.94).setScale(0.32).setDepth(30);
    this.bow = { x: 236, y: 548 };
    this.hearts = LK.hearts(this, 3);
    LK.backButton(this);

    this.pass = 0;
    this.idx = 0;
    this.over = false;
    this.busy = true;                                 // until the banner goes
    this.crows = [];
    this.arrows = [];
    this.cool = 0;
    this.newBar();

    this.input.on('pointerdown', p => {
      if (p.y < 170 || this.over) return;            // HUD and back button
      this.shoot(p.x, p.y);
    });

    LK.debug = {
      scene: 'Archery',
      state: () => ({ pass: this.pass, idx: this.idx, hearts: this.hearts.n, busy: this.busy, over: this.over,
        right: this.inSight().some(c => c.right), wrong: this.inSight().some(c => !c.right) }),
      // a guided arrow that only the chosen crow can stop
      act: ok => { const c = this.inSight().find(x => x.right === ok); if (c && this.cool <= 0) this.shoot(c.c.x, c.c.y, c, true); },
    };

    const b = LK.banner(this, 'Tháp Quạ', 'Bầy quạ đang cướp Lời Chúa! Chạm để bắn con quạ giữ chữ tiếp theo.');
    this.time.delayedCall(2100, () => { b.destroy(); this.busy = false; this.spawnWave(); });
  }

  parts() { return this.rounds[this.pass].parts; }

  newBar() {
    if (this.bar) this.bar.objects.forEach(o => o.destroy());
    this.bar = LK.verseBar(this, this.parts(), this.v.ref);
  }

  inSight() { return this.crows.filter(c => !c.done && c.t >= 0 && c.c.x < LK.W - 60 && c.c.x > 60); }

  crow(text, y, delay, speed, right) {
    const c = this.add.container(LK.W + 140, y).setDepth(40);
    const card = this.add.image(0, 92, 'scroll').setScale(0.42);           // hangs below the feet, words in clear view
    const label = LK.text(this, 0, 90, text, 22, { color: '#3a2508', wrap: 136, lineSpacing: -6 });
    const bird = this.add.sprite(0, 0, 'fly0').setScale(0.23).setFlipX(true);
    bird.play({ key: 'fly', startFrame: Phaser.Math.Between(0, 1) });
    c.add([card, label, bird]);
    return { c, card, label, bird, text, right, base: y, speed, t: -delay, phase: Math.random() * 6, amp: Phaser.Math.Between(14, 28), done: false };
  }

  /** The crow with the right word and its decoys come out of the tower one after another. */
  spawnWave() {
    if (this.over) return;
    const right = this.parts()[this.idx];
    const pool = LK.shuffle(this.rounds[this.pass].decoys(this.idx).filter(t => t !== right));
    const texts = LK.shuffle([right, ...pool.slice(0, this.easy ? 1 : 2)]);
    const lanes = LK.shuffle([235, 385, 535]);
    const [lo, hi] = this.easy ? [95, 115] : [135, 165];
    texts.forEach((t, k) => {
      const speed = Phaser.Math.Between(lo, hi) * (this.pass ? 1.12 : 1);
      this.crows.push(this.crow(t, lanes[k], k * (this.easy ? 1.2 : 1.0), speed, t === right));
    });
    LK.sfx.caw();
  }

  shoot(tx, ty, target = null, guided = false) {
    if (this.cool > 0 || this.busy) return;
    this.cool = 0.35;
    // Mức Dễ: the arrow curves toward the crow nearest the tap
    if (!target && this.easy) {
      let best = 150;
      for (const c of this.inSight()) {
        const d = Phaser.Math.Distance.Between(tx, ty, c.c.x, c.c.y + 40);
        if (d < best) { best = d; target = c; }
      }
    }
    const a = this.add.image(this.bow.x, this.bow.y, 'arrow').setScale(0.3).setDepth(45);
    const ang = Math.atan2(ty - this.bow.y, tx - this.bow.x);
    this.arrows.push({ img: a, vx: Math.cos(ang) * this.arrowSpeed, vy: Math.sin(ang) * this.arrowSpeed, target, guided });
    a.setRotation(ang);
    LK.sfx.shoot();
    this.tweens.add({ targets: this.hero, x: 164, duration: 60, yoyo: true });
  }

  update(_t, delta) {
    if (this.over) return;
    const dt = (delta / 1000) * LK.SPEED;
    this.cool -= dt;

    for (const c of this.crows) {
      if (c.done) continue;
      c.t += dt;
      if (c.t < 0) continue;
      c.c.x -= c.speed * dt;
      c.c.y = c.base + Math.sin(c.phase + c.t * 2.2) * c.amp;
      if (c.c.x < -160) this.escaped(c);
    }
    this.crows = this.crows.filter(c => !c.done || c.c.active);

    for (const a of this.arrows) {
      if (a.target && !a.target.done) {                 // steer toward a target crow
        const ang = Math.atan2(a.target.c.y + 40 - a.img.y, a.target.c.x - a.img.x);
        a.vx = Math.cos(ang) * this.arrowSpeed;
        a.vy = Math.sin(ang) * this.arrowSpeed;
        a.img.setRotation(ang);
      }
      a.img.x += a.vx * dt;
      a.img.y += a.vy * dt;
      const hits = a.guided ? [a.target] : this.inSight();
      const hit = hits.find(c => c && !c.done && Math.abs(a.img.x - c.c.x) < 78 && a.img.y > c.c.y - 55 && a.img.y < c.c.y + 140);
      if (hit) { a.gone = true; a.img.destroy(); this.hitCrow(hit); continue; }
      if (a.img.x > LK.W + 80 || a.img.x < -80 || a.img.y < -80 || a.img.y > LK.H + 80) { a.gone = true; a.img.destroy(); }
    }
    this.arrows = this.arrows.filter(a => !a.gone);
  }

  hitCrow(c) {
    if (this.over || c.done) return;
    c.done = true;
    LK.sfx.caw();
    // startled, the crow flies off; never hurt
    this.tweens.add({ targets: c.c, x: c.c.x + 160, y: c.c.y - 320, alpha: 0, duration: 650, ease: 'Quad.easeIn', onComplete: () => c.c.destroy() });
    if (!c.right) {
      LK.sfx.bad();
      c.card.setTint(0xb07a6a);
      LK.floatText(this, c.c.x, c.c.y - 70, 'Không phải chữ này!', '#ffb3a0', 26);
      if (this.hearts.lose() <= 0) this.fail();
      return;
    }
    // the dropped scroll goes back into the traveller's heart
    c.card.setVisible(false);
    c.label.setVisible(false);
    const s = this.add.container(c.c.x, c.c.y + 92).setDepth(50);
    s.add([this.add.image(0, 0, 'scroll').setScale(0.44), LK.text(this, 0, -2, c.text, 22, { color: '#3a2508', wrap: 136, lineSpacing: -6 })]);
    this.tweens.add({ targets: s, x: this.hero.x + 10, y: this.hero.y - 110, scale: 0.15, duration: 520, ease: 'Sine.easeIn',
      onComplete: () => { s.destroy(); LK.burst(this, this.hero.x + 10, this.hero.y - 110, [0xffe08a, 0xff8fa3], 16); } });
    LK.sfx.good();
    this.bar.advance();
    for (const o of this.crows) {
      if (o === c || o.done) continue;                   // the rest of the flock gives up
      o.done = true;
      this.tweens.add({ targets: o.c, y: o.c.y - 360, alpha: 0, duration: 600, onComplete: () => o.c.destroy() });
    }
    this.idx += 1;
    if (this.idx >= this.parts().length) this.time.delayedCall(700, () => this.endPass());
    else this.time.delayedCall(650, () => this.spawnWave());
  }

  escaped(c) {
    c.done = true;
    c.c.destroy();
    if (!c.right) return;
    LK.floatText(this, 260, 300, 'Quạ mang chữ đi mất! Nó sẽ quay lại…', '#fff3b0', 24);
    this.time.delayedCall(500, () => this.spawnWave());
  }

  endPass() {
    if (this.over) return;
    if (this.pass === 0) {
      this.pass = 1;
      this.idx = 0;
      this.busy = true;
      this.newBar();
      LK.say('praise-1');
      const b = LK.banner(this, 'Lượt 2: từng chữ một!', 'Giờ mỗi con quạ chỉ giữ một chữ. Nhớ thật chính xác nhé!');
      this.time.delayedCall(2300, () => { b.destroy(); this.busy = false; this.spawnWave(); });
    } else {
      this.win();
    }
  }

  win() {
    this.over = true;
    this.hero.setTexture('hero-cheer');
    LK.burst(this, this.hero.x, this.hero.y - 80, [0xffe08a, 0xffffff], 40);
    LK.floatText(this, LK.W / 2, 320, 'Tôi đã giấu lời Chúa trong lòng tôi!', '#ffe08a', 34);
    this.time.delayedCall(1800, () => this.scene.start('Result', { level: this.levelIndex, stars: this.hearts.n, won: true }));
  }

  fail() {
    this.over = true;
    this.hero.setTexture('hero-hurt');
    this.time.delayedCall(1200, () => this.scene.start('Result', { level: this.levelIndex, stars: 0, won: false }));
  }
}
