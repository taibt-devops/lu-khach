'use strict';
/* Region map: one node per level along the path drawn over the region's map picture.
   Vùng 1 ends at the gate in the top-right corner, which leads to Vùng 2 once the boss is beaten. */
class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  init(data) {
    const cur = LK.currentLevel();
    const fallback = cur >= 0 ? LK.C.levels[cur].region : LK.C.regions.length - 1;
    this.region = data.region ?? LK.lastRegion ?? fallback;
    LK.lastRegion = this.region;
  }

  create() {
    const R = LK.C.regions[this.region];
    LK.debug = { scene: 'Map', region: this.region, act: () => this.openNext() };
    LK.cover(this, R.map);
    this.levels = LK.regionLevels(this.region);
    this.drawPath([R.start, ...R.spots]);

    const cur = LK.currentLevel();
    this.current = this.levels.findIndex(x => x.i === cur);          // index within this region, -1 if elsewhere
    const allDone = this.levels.every(x => LK.save.stars[x.lv.id]);
    const heroAt = this.current >= 0 ? R.spots[this.current] : allDone ? R.spots[R.spots.length - 1] : R.start;
    this.hero = this.add.image(heroAt.x - 52, heroAt.y + 8, 'hero').setOrigin(0.5, 0.95).setScale(0.17).setDepth(50);
    this.tweens.add({ targets: this.hero, y: this.hero.y - 6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.levels.forEach((x, k) => this.node(x.lv, x.i, k));

    const title = this.add.container(250, 52);
    title.add(LK.panel(this, 0, 0, 440, 74, LK.CREAM, 0.95));
    title.add(LK.text(this, 0, -12, `Vùng ${this.region + 1} · ${R.name}`, 26, { color: '#1d2b22' }));
    title.add(LK.text(this, 0, 18, 'Lữ Khách — hành trình Lời Chúa', 15, { color: '#6b5530', weight: '600' }));
    this.regionLinks(R, allDone);

    LK.button(this, 1140, 650, 'Kho gươm', () => this.armory(), { w: 200, h: 58, size: 24 });
    this.easyBtn = LK.button(this, 925, 650, '', () => this.toggleEasy(), { w: 200, h: 58, size: 22, color: 0xd9f0c8 });
    this.soundBtn = LK.roundButton(this, 770, 650, '', () => this.toggleSound(), 26);
    this.refreshToggles();

    if (!LK.save.seen[R.id]) this.time.delayedCall(300, () => this.intro(R));
  }

  /** Way to the next region (the gate on the map) and back to the previous one. */
  regionLinks(R, allDone) {
    const next = LK.C.regions[this.region + 1];
    if (next) {
      const firstNext = LK.regionLevels(this.region + 1)[0].i;
      const open = LK.unlocked(firstNext);
      const b = LK.button(this, 1080, 66, open ? `${next.name} ›` : `🔒 ${next.name}`, () => {
        if (open) { this.scene.start('Map', { region: this.region + 1 }); return; }
        LK.sfx.bad();
        LK.floatText(this, 1060, 130, 'Thắng boss để mở!', '#ffe08a', 24);
      }, { w: 230, h: 54, size: 22, color: open ? LK.GOLD : 0xc9c2b0 }).setDepth(60);
      if (open && !LK.save.stars[LK.C.levels[firstNext].id]) {
        this.tweens.add({ targets: b, scale: 1.07, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    } else if (R.gate) {
      // the last region so far: the gate opens when its levels are done
      const g = this.add.container(R.gate.x, R.gate.y - 72).setDepth(60);
      g.add(LK.panel(this, 0, 0, 230, 50, allDone ? 0xc8f0b0 : 0xe8dcc0, 0.95));
      g.add(LK.text(this, 0, -2, allDone ? 'Cửa đã mở · Vùng 3 sắp có' : 'Cửa Hẹp · đang đóng', 17, { color: '#1d2b22' }));
    }
    if (this.region > 0) {
      const prev = LK.C.regions[this.region - 1];
      LK.button(this, 130, 650, `‹ ${prev.name}`, () => this.scene.start('Map', { region: this.region - 1 }),
        { w: 230, h: 54, size: 20, color: 0xfff1c9 }).setDepth(60);
    }
  }

  drawPath(points) {
    const g = this.add.graphics();
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const n = Math.max(4, Math.round(Phaser.Math.Distance.Between(a.x, a.y, b.x, b.y) / 22));
      for (let k = 1; k < n; k++) {
        const x = a.x + ((b.x - a.x) * k) / n;
        const y = a.y + ((b.y - a.y) * k) / n;
        g.fillStyle(LK.INK, 0.55).fillCircle(x, y + 2, 6);
        g.fillStyle(0xfff8e7, 1).fillCircle(x, y, 5);
      }
    }
  }

  node(lv, i, k) {
    const p = LK.C.regions[this.region].spots[k];
    const open = LK.unlocked(i);
    const stars = LK.save.stars[lv.id] || 0;
    const boss = lv.type === 'Boss';
    const r = boss ? 52 : 40;
    const c = this.add.container(p.x, p.y).setDepth(40);
    const g = this.add.graphics();
    g.fillStyle(LK.INK, 1).fillCircle(0, 5, r);
    g.fillStyle(!open ? 0x9aa39a : boss ? 0xff7a5c : k === this.current ? LK.GOLD : 0xfff1c9, 1).fillCircle(0, 0, r);
    g.lineStyle(4, LK.INK, 1).strokeCircle(0, 0, r);
    c.add(g);
    if (boss) c.add(this.add.image(0, 6, 'boss').setScale(0.16).setAlpha(open ? 1 : 0.35));
    else c.add(LK.text(this, 0, -2, open ? String(LK.levelNo(i)) : '🔒', open ? 34 : 26, { color: '#1d2b22' }));
    c.add(LK.text(this, 0, r + 18, lv.title, 18, { color: '#fff8e7', stroke: '#1d2b22', strokeThickness: 5 }));
    if (stars) c.add(LK.text(this, 0, -r - 14, '★'.repeat(stars) + '☆'.repeat(3 - stars), 22, { color: '#ffc93c', stroke: '#1d2b22', strokeThickness: 5 }));
    if (k === this.current) this.tweens.add({ targets: c, scale: 1.08, duration: 650, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    c.setSize(r * 2, r * 2).setInteractive({ useHandCursor: open });
    c.on('pointerup', () => {
      if (!open) { LK.sfx.bad(); this.tweens.add({ targets: c, x: p.x + 8, duration: 60, yoyo: true, repeat: 2 }); return; }
      this.go(i, k);
    });
  }

  go(i, k) {
    LK.sfx.tap();
    const p = LK.C.regions[this.region].spots[k];
    this.tweens.add({
      targets: this.hero, x: p.x - 52, y: p.y + 8, duration: 450, ease: 'Sine.easeInOut',
      onComplete: () => this.scene.start('Learn', { level: i }),
    });
  }

  openNext() {
    const k = this.current >= 0 ? this.current : this.levels.length - 1;
    this.go(this.levels[k].i, k);
  }

  intro(R) {
    const shade = this.add.rectangle(0, 0, LK.W, LK.H, 0x000000, 0.45).setOrigin(0).setDepth(1400).setInteractive();
    const c = this.add.container(LK.W / 2, LK.H / 2).setDepth(1500);
    c.add(LK.panel(this, 0, 0, 760, 360));
    c.add(this.add.image(-260, 10, this.region === 0 ? 'hero' : 'hero-bow').setScale(0.42));
    c.add(LK.text(this, 90, -110, R.name, 38, { color: '#1d2b22' }));
    c.add(LK.text(this, 90, -10, R.story, 23, { color: '#3d2f18', wrap: 480, weight: '600' }));
    c.add(LK.button(this, 90, 115, 'Lên đường!', () => {
      LK.save.seen[R.id] = true;
      LK.persist();
      LK.stopVoice();
      shade.destroy();
      c.destroy();
    }, { w: 260 }));
    LK.say(R.intro);
  }

  /** Every verse is a sword: one column per region. */
  armory() {
    const shade = this.add.rectangle(0, 0, LK.W, LK.H, 0x000000, 0.5).setOrigin(0).setDepth(1400).setInteractive();
    const c = this.add.container(LK.W / 2, LK.H / 2).setDepth(1500);
    c.add(LK.panel(this, 0, 0, 1160, 640));
    c.add(LK.text(this, 0, -282, 'Kho gươm Lời Chúa', 36, { color: '#1d2b22' }));
    c.add(LK.text(this, 0, -246, 'Mỗi câu gốc bạn thuộc là một thanh gươm. Ôn càng nhiều, gươm càng sáng.', 18, { color: '#6b5530', weight: '600' }));
    LK.C.regions.forEach((R, r) => {
      const x0 = r === 0 ? -550 : 20;
      c.add(LK.text(this, x0 + 265, -206, R.name, 22, { color: '#a0731c' }));
      const ids = [...new Set(LK.regionLevels(r).flatMap(x => x.lv.verses || [x.lv.verse]))];
      ids.forEach((id, k) => {
        const v = LK.verse(id);
        const y = -150 + k * 132;
        const m = LK.save.mastery[id] || 0;
        const learned = m > 0;
        c.add(this.add.image(x0 + 30, y + 14, 'sword').setScale(0.15).setAlpha(learned ? 1 : 0.25).setAngle(-10));
        c.add(LK.text(this, x0 + 66, y - 22, learned ? v.ref : '???', 22, { color: '#1d2b22', ox: 0 }));
        c.add(LK.text(this, x0 + 520, y - 22, '★'.repeat(Math.min(5, m)) + '☆'.repeat(Math.max(0, 5 - m)), 19, { color: '#d99a00', ox: 1 }));
        c.add(LK.text(this, x0 + 66, y, learned ? v.text : 'Chưa học — vượt ải để nhận thanh gươm này.', 15,
          { color: '#4d3a1f', ox: 0, oy: 0, wrap: 450, weight: '500', lineSpacing: 0 }));
      });
    });
    if (LK.save.shield) {
      c.add(this.add.image(-520, 268, 'shield').setScale(0.11));
      c.add(LK.text(this, -480, 268, 'Khiên Đức Tin: đỡ 1 lần sai khi đánh boss', 19, { color: '#1d2b22', ox: 0 }));
    }
    c.add(LK.button(this, 440, 268, 'Đóng', () => { shade.destroy(); c.destroy(); }, { w: 160, h: 54 }));
  }

  toggleEasy() { LK.save.easy = !LK.save.easy; LK.persist(); this.refreshToggles(); }
  toggleSound() { LK.save.muted = !LK.save.muted; LK.persist(); if (LK.save.muted) LK.stopVoice(); this.refreshToggles(); }
  refreshToggles() {
    this.easyBtn.label.setText(LK.save.easy ? 'Mức: Dễ' : 'Mức: Thường');
    this.soundBtn.label.setText(LK.save.muted ? '🔇' : '🔊');
  }
}
