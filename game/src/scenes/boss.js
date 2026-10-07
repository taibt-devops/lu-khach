'use strict';
/* Ải Boss — Bùn Buồn. Each round: the boss says a gloomy lie; pick the verse-sword that answers it
   (its weakness = double damage), then rebuild the verse fast — every right piece is a sword strike.
   Wrong pieces or a full charge bar = a mud ball (the Shield of Faith blocks one).
   Below half health the verse comes in smaller pieces. */
class BossScene extends Phaser.Scene {
  constructor() { super('Boss'); }
  init(data) { this.levelIndex = data.level; }

  create() {
    this.easy = LK.save.easy;
    this.time.timeScale = LK.SPEED;
    this.tweens.timeScale = LK.SPEED;
    this.chargeTime = this.easy ? 45 : 32;
    this.maxHp = this.hp = 450;
    this.over = false;
    this.mode = 'intro';
    this.charge = 0;
    this.shieldLeft = LK.save.shield ? 1 : 0;
    this.lies = LK.shuffle(LK.C.lies);
    this.round = 0;
    this.ui = [];

    LK.cover(this, 'bg-boss');
    this.boss = this.add.image(1010, 505, 'boss').setOrigin(0.5, 0.95).setScale(0.82).setDepth(20);
    this.bossIdle = this.tweens.add({ targets: this.boss, scaleY: 0.78, scaleX: 0.85, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.hero = this.add.image(250, 485, 'hero-sword').setOrigin(0.5, 0.94).setScale(0.34).setDepth(21);
    this.hearts = LK.hearts(this, 3, 290);
    LK.backButton(this);
    if (this.shieldLeft) {
      this.shieldIcon = this.add.image(250, 270, 'shield').setScale(0.1).setDepth(22);
      this.tweens.add({ targets: this.shieldIcon, y: 262, yoyo: true, repeat: -1, duration: 800 });
    }

    // boss health + charge bars
    LK.text(this, 610, 40, 'Bùn Buồn', 22, { color: '#fff8e7', stroke: '#1d2b22', strokeThickness: 5, ox: 1 }).setDepth(900);
    this.hpBar = this.add.graphics().setDepth(900);
    this.chargeBar = this.add.graphics().setDepth(900);
    this.chargeLabel = LK.text(this, 610, 76, 'sắp ném bùn', 15, { color: '#ffd2c2', stroke: '#1d2b22', strokeThickness: 4, ox: 1 }).setDepth(900);
    this.drawBars();

    this.bubble = this.add.container(860, 232).setDepth(800);
    this.bubbleText = LK.text(this, 0, -2, '', 24, { color: '#2b2b38', wrap: 470 });
    const bg = this.add.graphics();
    bg.fillStyle(LK.INK, 0.4).fillRoundedRect(-262, -52, 524, 112, 26);
    bg.fillStyle(0xeef0f5, 1).fillRoundedRect(-262, -58, 524, 112, 26);
    bg.fillTriangle(150, 50, 200, 50, 210, 92);
    bg.lineStyle(3, LK.INK, 1).strokeRoundedRect(-262, -58, 524, 112, 26);
    this.bubble.add([bg, this.bubbleText]);

    LK.debug = {
      scene: 'Boss',
      state: () => ({ mode: this.mode, hp: this.hp, hearts: this.hearts.n, over: this.over, next: this.next }),
      act: ok => this.debugAct(ok),
    };
    this.say('Hừm... Ta là Bùn Buồn. Ở lại đây với ta đi...', 'boss-intro');
    this.ui.push(LK.button(this, LK.W / 2, 620, 'Rút gươm Lời Chúa!', () => this.nextRound(), { w: 340, color: 0xffe08a }));
  }

  say(text, audio) {
    this.bubbleText.setText(text);
    this.bubble.setScale(0.7).setAlpha(0);
    this.tweens.add({ targets: this.bubble, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    if (audio) LK.say(audio);
  }

  clearUi() { this.ui.forEach(o => o.destroy()); this.ui = []; }

  drawBars() {
    const f = Math.max(0, this.hp / this.maxHp);
    this.hpBar.clear();
    this.hpBar.fillStyle(LK.INK, 0.8).fillRoundedRect(626, 26, 560, 30, 15);
    this.hpBar.fillStyle(0x8d6e4a, 1).fillRoundedRect(630, 30, 552 * f, 22, 11);
    const c = Math.min(1, this.charge);
    this.chargeBar.clear();
    this.chargeBar.fillStyle(LK.INK, 0.7).fillRoundedRect(626, 64, 560, 22, 11);
    this.chargeBar.fillStyle(c > 0.75 ? 0xe8543b : 0xf0a04b, 1).fillRoundedRect(629, 67, 554 * c, 16, 8);
  }

  // ---------------------------------------------------------------- round: choose a sword
  nextRound() {
    if (this.over) return;
    this.clearUi();
    if (this.verseBar) { this.verseBar.objects.forEach(o => o.destroy()); this.verseBar = null; }
    this.lie = this.lies[this.round % this.lies.length];
    this.round += 1;
    this.say(this.lie.text, this.lie.audio);
    this.mode = 'choose';
    this.charging = true;
    const panel = LK.panel(this, LK.W / 2, 622, 1220, 186, 0xfff8e7, 0.96).setDepth(700);
    const title = LK.text(this, LK.W / 2, 548, 'Chọn thanh gươm Lời Chúa đáp lại lời buồn này:', 22, { color: '#1d2b22' }).setDepth(701);
    this.ui.push(panel, title);
    this.cards = LK.C.levels[3].verses.map((id, k) => {
      const v = LK.verse(id);
      const x = 250 + k * 390;
      const c = this.add.container(x, 640).setDepth(702);
      const g = this.add.graphics();
      g.fillStyle(LK.INK, 1).fillRoundedRect(-180, -54, 360, 114, 18);
      g.fillStyle(0xffeec4, 1).fillRoundedRect(-180, -60, 360, 114, 18);
      g.lineStyle(3, LK.INK, 1).strokeRoundedRect(-180, -60, 360, 114, 18);
      c.add([g, this.add.image(-130, -4, 'sword').setScale(0.12).setAngle(-20),
        LK.text(this, 30, -26, v.ref, 26, { color: '#1d2b22' }),
        LK.text(this, 30, 12, v.theme, 18, { color: '#6b5530', weight: '600', wrap: 250 })]);
      c.setSize(360, 120).setInteractive({ useHandCursor: true });
      c.on('pointerup', () => this.pickSword(id));
      this.ui.push(c);
      return { id, c };
    });
  }

  pickSword(id) {
    if (this.mode !== 'choose' || this.over) return;
    LK.sfx.tap();
    this.match = id === this.lie.verse;
    this.clearUi();
    if (this.match) {
      LK.floatText(this, this.boss.x, 300, 'Trúng điểm yếu! Sát thương ×2', '#ffe08a', 30);
      LK.sfx.light();
    } else {
      const right = LK.verse(this.lie.verse);
      LK.floatText(this, LK.W / 2, 330, `Gươm vẫn chém được, nhưng ${right.ref} mới là điểm yếu!`, '#fff8e7', 22);
    }
    this.recite(id);
  }

  // ---------------------------------------------------------------- round: rebuild the verse
  recite(id) {
    const v = LK.verse(id);
    const fine = this.hp <= this.maxHp / 2;
    this.parts = fine ? (v.pieces || v.steps.map(s => s.t)) : v.chunks.map(c => c.t);
    this.next = 0;
    this.combo = 0;
    this.misses = 0;
    this.mode = 'recite';
    this.tweens.add({ targets: this.bubble, alpha: 0, duration: 200 });   // the lie has been heard; make room
    this.verseBar = LK.verseBar(this, this.parts, v.ref, 150);
    const panel = LK.panel(this, LK.W / 2, 622, 1220, 186, 0xfff8e7, 0.96).setDepth(700);
    this.ui.push(panel);
    const cols = this.parts.length <= 6 ? 3 : 4;
    const tw = cols === 3 ? 380 : 288;
    const rows = Math.ceil(this.parts.length / cols);
    const rowH = rows > 2 ? 54 : 66;
    const order = LK.shuffle(this.parts.map((t, i) => ({ t, i })));
    this.tiles = order.map((p, k) => {
      const col = k % cols;
      const row = Math.floor(k / cols);
      const inRow = Math.min(cols, this.parts.length - row * cols);
      const x = LK.W / 2 + (col - (inRow - 1) / 2) * (tw + 12);
      const y = 622 - ((rows - 1) * rowH) / 2 + row * rowH;
      const c = this.add.container(x, y).setDepth(702);
      const g = this.add.graphics();
      const draw = color => {
        g.clear();
        g.fillStyle(LK.INK, 1).fillRoundedRect(-tw / 2, -rowH / 2 + 7, tw, rowH - 6, 14);
        g.fillStyle(color, 1).fillRoundedRect(-tw / 2, -rowH / 2 + 3, tw, rowH - 6, 14);
        g.lineStyle(2.5, LK.INK, 1).strokeRoundedRect(-tw / 2, -rowH / 2 + 3, tw, rowH - 6, 14);
      };
      draw(0xffffff);
      c.add([g, LK.text(this, 0, 0, p.t, rows > 2 ? 19 : 21, { color: '#1d2b22', wrap: tw - 20, lineSpacing: -4 })]);
      c.setSize(tw, rowH).setInteractive({ useHandCursor: true });
      const tile = { c, t: p.t, i: p.i, draw, done: false };
      c.on('pointerup', () => this.tapTile(tile));
      this.ui.push(c);
      return tile;
    });
  }

  tapTile(tile) {
    if (this.mode !== 'recite' || this.over || tile.done) return;
    if (tile.t !== this.parts[this.next]) {
      tile.draw(0xffb3a0);
      this.time.delayedCall(260, () => { if (!tile.done) tile.draw(0xffffff); });
      this.tweens.add({ targets: tile.c, x: tile.c.x + 8, yoyo: true, repeat: 2, duration: 50 });
      this.combo = 0;
      this.misses += 1;
      if (this.misses >= 2) this.hint();
      this.bossAttack();
      return;
    }
    tile.done = true;
    this.misses = 0;
    this.combo += 1;
    this.next += 1;
    this.verseBar.advance();
    this.tweens.add({ targets: tile.c, alpha: 0, scale: 0.6, duration: 200 });
    this.strike(12 * (this.match ? 2 : 1) * (1 + Math.min(this.combo, 6) * 0.1));
    if (this.next >= this.parts.length) this.verseDone();
  }

  hint() {
    const t = this.tiles.find(x => !x.done && x.t === this.parts[this.next]);
    if (!t) return;
    t.draw(0xffe08a);
    this.tweens.add({ targets: t.c, scale: 1.08, yoyo: true, repeat: 3, duration: 160 });
  }

  strike(dmg) {
    dmg = Math.round(dmg);
    LK.sfx.slash();
    this.tweens.add({ targets: this.hero, x: this.hero.x + 70, yoyo: true, duration: 110, ease: 'Quad.easeOut' });
    const g = this.add.graphics().setDepth(40);
    const a0 = Phaser.Math.DegToRad(-140 + Math.random() * 40);
    g.lineStyle(14, 0xfff3b0, 0.95).beginPath().arc(this.boss.x - 20, this.boss.y - 170, 130, a0, a0 + 1.9).strokePath();
    g.lineStyle(5, 0xffffff, 1).beginPath().arc(this.boss.x - 20, this.boss.y - 170, 130, a0, a0 + 1.9).strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 260, onComplete: () => g.destroy() });
    this.boss.setTintFill(0xffffff);
    this.time.delayedCall(70, () => this.boss.clearTint());
    LK.burst(this, this.boss.x - 20, this.boss.y - 170, [0xffe08a, 0xffffff], 12);
    LK.floatText(this, this.boss.x + Phaser.Math.Between(-60, 60), this.boss.y - 260, `-${dmg}${this.combo > 2 ? `  combo ×${this.combo}` : ''}`, '#ffe08a', 30);
    this.hp = Math.max(0, this.hp - dmg);
    this.drawBars();
  }

  verseDone() {
    this.mode = 'busy';
    this.charging = false;
    this.charge = 0;
    const bonus = 30 * (this.match ? 2 : 1);
    LK.sfx.hit();
    this.cameras.main.flash(220, 255, 240, 180);
    this.cameras.main.shake(260, 0.01);
    this.boss.setTexture('boss-hit');
    LK.say('boss-ouch');
    LK.floatText(this, this.boss.x, this.boss.y - 320, `Lời Chúa! -${bonus}`, '#fff3b0', 40);
    this.hp = Math.max(0, this.hp - bonus);
    this.drawBars();
    this.time.delayedCall(1100, () => {
      if (this.hp <= 0) { this.victory(); return; }
      this.boss.setTexture('boss');
      this.nextRound();
    });
  }

  bossAttack() {
    if (this.over) return;
    this.charge = 0;
    this.drawBars();
    const ball = this.add.circle(this.boss.x - 60, this.boss.y - 160, 26, 0x6b4423).setStrokeStyle(4, 0x3b2410).setDepth(60);
    this.tweens.add({
      targets: ball, x: this.hero.x + 10, y: this.hero.y - 120, duration: 380, ease: 'Quad.easeIn',
      onComplete: () => {
        ball.destroy();
        if (this.shieldLeft > 0) {
          this.shieldLeft -= 1;
          LK.sfx.light();
          LK.floatText(this, this.hero.x, this.hero.y - 230, 'Khiên Đức Tin đỡ được!', '#ffe08a', 26);
          if (this.shieldIcon) this.tweens.add({ targets: this.shieldIcon, scale: 0.2, alpha: 0, duration: 500 });
          return;
        }
        LK.sfx.splash();
        LK.mud(this, this.hero.x, this.hero.y - 120);
        this.cameras.main.shake(240, 0.012);
        this.hero.setTint(0x9b7a55);
        this.time.delayedCall(300, () => this.hero.clearTint());
        if (this.hearts.lose() <= 0) this.defeat();
      },
    });
  }

  update(_t, delta) {
    if (this.over || !this.charging) return;
    this.charge += ((delta / 1000) * LK.SPEED) / this.chargeTime;
    if (this.charge >= 1) this.bossAttack();
    this.drawBars();
  }

  victory() {
    this.over = true;
    this.mode = 'won';
    this.clearUi();
    if (this.verseBar) this.verseBar.objects.forEach(o => o.destroy());
    this.bossIdle.stop();
    this.boss.setScale(0.82).setTexture('boss-defeated');
    this.bubble.setVisible(false);
    LK.sfx.win();
    this.time.delayedCall(500, () => LK.say('boss-defeat'));
    const ray = this.add.graphics().setDepth(10).setAlpha(0);
    ray.fillStyle(0xfff3c4, 0.35).fillTriangle(1000, -40, 860, 520, 1160, 520);
    this.tweens.add({ targets: ray, alpha: 1, duration: 900 });
    this.hero.setTexture('hero-cheer');
    LK.burst(this, this.boss.x, this.boss.y - 60, [0xffe08a, 0xffffff, 0xb6e388], 60);
    LK.banner(this, 'Chiến thắng!', 'Ngài đặt chân tôi trên hòn đá, Và làm cho bước tôi vững bền.');
    this.time.delayedCall(3600, () => this.scene.start('Result', { level: this.levelIndex, stars: this.hearts.n, won: true }));
  }

  defeat() {
    this.over = true;
    this.mode = 'lost';
    this.hero.setTexture('hero-hurt');
    this.say('Hừm... ở lại đây đi...', null);
    this.time.delayedCall(1600, () => this.scene.start('Result', { level: this.levelIndex, stars: 0, won: false }));
  }

  debugAct(ok) {
    if (this.mode === 'intro') { this.nextRound(); return; }
    if (this.mode === 'choose') {
      const ids = LK.C.levels[3].verses;
      this.pickSword(ok ? this.lie.verse : ids.find(id => id !== this.lie.verse));
      return;
    }
    if (this.mode === 'recite') {
      const t = this.tiles.find(x => !x.done && (x.t === this.parts[this.next]) === ok);
      if (t) this.tapTile(t);
    }
  }
}
