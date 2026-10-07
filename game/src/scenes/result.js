'use strict';
/* After a level: stars, the verse once more, and the next step (the next level, or the next region's map). */
class ResultScene extends Phaser.Scene {
  constructor() { super('Result'); }
  init(data) { this.d = data; }

  create() {
    const { level, won } = this.d;
    const stars = won ? Math.max(1, this.d.stars) : 0;
    const lv = LK.C.levels[level];
    const boss = lv.type === 'Boss';
    const nextLv = LK.C.levels[level + 1];
    const regionDone = won && (!nextLv || nextLv.region !== lv.region);
    LK.cover(this, lv.bg, 0x7a7a7a);
    LK.debug = { scene: 'Result', won, stars, act: () => this.scene.start('Map') };

    let gotShield = false;
    if (won) {
      const before = LK.save.stars[lv.id] || 0;
      LK.save.stars[lv.id] = Math.max(before, stars);
      (lv.verses || [lv.verse]).forEach(LK.addMastery);
      if (lv.id === 'l3' && !LK.save.shield) { LK.save.shield = true; gotShield = true; }
      LK.persist();
    }

    const c = this.add.container(LK.W / 2, LK.H / 2 + 10);
    c.add(LK.panel(this, 0, 0, 900, 560));
    c.add(this.add.image(-330, 40, won ? 'hero-cheer' : 'hero-hurt').setScale(0.42));
    const title = !won ? 'Chưa qua — thử lại nhé!' : boss ? 'Đánh bại Bùn Buồn!' : regionDone ? 'Qua Cửa Hẹp rồi!' : 'Qua ải rồi!';
    c.add(LK.text(this, 90, -210, title, 40, { color: '#1d2b22' }));
    const starRow = LK.text(this, 90, -150, '★★★'.slice(0, stars) + '☆☆☆'.slice(0, 3 - stars), 64, { color: '#ffb400', stroke: '#1d2b22', strokeThickness: 6 });
    c.add(starRow);
    if (won) { starRow.setScale(0); this.tweens.add({ targets: starRow, scale: 1, duration: 500, ease: 'Back.easeOut' }); }

    const verseIds = lv.verses || [lv.verse];
    const body = boss
      ? 'Ngài đặt chân tôi trên hòn đá, Và làm cho bước tôi vững bền. (Thi Thiên 40:2)'
      : `${LK.verse(verseIds[0]).text} (${LK.verse(verseIds[0]).ref})`;
    c.add(LK.text(this, 90, -40, body, 24, { color: '#3d2f18', wrap: 560, weight: '600' }));
    if (gotShield) {
      c.add(this.add.image(-60, 110, 'shield').setScale(0.14));
      c.add(LK.text(this, 130, 110, 'Nhận Khiên Đức Tin!\nĐỡ được 1 lần sai khi đánh boss.', 20, { color: '#1d2b22', wrap: 320 }));
    } else if (regionDone) {
      const msg = nextLv ? `Cửa Hẹp đã mở! Vùng ${nextLv.region + 1} đang chờ bạn.` : '"Hãy gõ cửa, sẽ mở cho." Vùng 3 sắp ra mắt!';
      c.add(LK.text(this, 90, 110, msg, 24, { color: '#2e7d32', wrap: 560 }));
    }

    // next step: the next level in this region, or the next region's map
    const next = won && nextLv;
    const nextLabel = next && nextLv.region !== lv.region ? `Vùng ${nextLv.region + 1} ›` : 'Ải tiếp ›';
    c.add(LK.button(this, next ? -130 : -110, 222, 'Chơi lại', () => this.scene.start('Learn', { level }), { w: 200, color: 0xd9f0c8 }));
    c.add(LK.button(this, next ? 90 : 120, 222, 'Bản đồ', () => this.scene.start('Map', { region: lv.region }), { w: 200, color: 0xfff1c9 }));
    if (next) {
      c.add(LK.button(this, 310, 222, nextLabel, () => {
        if (nextLv.region !== lv.region) this.scene.start('Map', { region: nextLv.region });
        else this.scene.start('Learn', { level: level + 1 });
      }, { w: 200 }));
    }

    if (won) {
      LK.sfx.win();
      const clip = gotShield ? 'shield' : boss ? 'region-done' : regionDone ? `region${lv.region + 1}-done` : 'level-done';
      this.time.delayedCall(600, () => LK.say(clip));
    } else {
      this.time.delayedCall(400, () => LK.say('try-again'));
    }
  }
}
