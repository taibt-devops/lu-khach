'use strict';
/* Before every level: read and hear the memory verse (the boss card reviews all three swords). */
class LearnScene extends Phaser.Scene {
  constructor() { super('Learn'); }
  init(data) { this.levelIndex = data.level; }

  create() {
    const lv = LK.C.levels[this.levelIndex];
    LK.lastRegion = lv.region;                        // Back / "Bản đồ" return to this level's map
    LK.cover(this, lv.bg, 0x8a8a8a);
    LK.backButton(this);
    LK.debug = { scene: 'Learn', act: () => this.start() };
    const c = this.add.container(LK.W / 2, LK.H / 2 + 14);
    c.add(LK.panel(this, 0, 0, 980, 560));
    const label = lv.type === 'Boss' ? 'Ải Boss' : `Ải ${LK.levelNo(this.levelIndex)}`;
    c.add(LK.text(this, 0, -236, `${label} · ${lv.title}`, 38, { color: '#1d2b22' }));
    c.add(LK.text(this, 0, -196, lv.hint, 20, { color: '#6b5530', weight: '600' }));

    if (lv.type === 'Boss') {
      c.add(LK.text(this, 0, -150, 'Ôn lại 3 thanh gươm trước khi đấu. Mỗi lời buồn của Bùn Buồn sợ một câu gốc riêng!', 19,
        { color: '#3d2f18', wrap: 860, weight: '600' }));
      lv.verses.forEach((id, k) => {
        const v = LK.verse(id);
        const y = -70 + k * 104;
        c.add(this.add.image(-420, y, 'sword').setScale(0.16).setAngle(-12));
        c.add(LK.text(this, -370, y - 30, `${v.ref} — ${v.theme}`, 20, { color: '#1d2b22', ox: 0, oy: 0 }));
        c.add(LK.text(this, -370, y - 2, v.text, 17, { color: '#4d3a1f', ox: 0, oy: 0, wrap: 700, weight: '500' }));
        c.add(LK.roundButton(this, 420, y, '🔊', () => LK.say(v.audio), 24));
      });
      c.add(LK.button(this, 0, 232, 'Đấu boss!', () => this.start(), { w: 280, color: 0xff8a6a }));
      return;
    }

    const v = LK.verse(lv.verse);
    c.add(LK.text(this, 0, -132, 'Câu gốc', 22, { color: '#a0731c' }));
    c.add(LK.text(this, 0, -30, v.text, 34, { color: '#1d2b22', wrap: 860, lineSpacing: 6 }));
    c.add(LK.text(this, 0, 86, v.ref, 28, { color: '#a0731c' }));
    c.add(LK.text(this, 0, 128, `Gươm này dùng ${v.theme.toLowerCase()}`, 19, { color: '#6b5530', weight: '600' }));
    c.add(LK.button(this, -150, 222, '🔊 Nghe lại', () => LK.say(v.audio), { w: 230, color: 0xd9f0c8 }));
    c.add(LK.button(this, 150, 222, 'Vào ải!', () => this.start(), { w: 230 }));
    this.time.delayedCall(350, () => LK.say(v.audio));
  }

  start() {
    LK.stopVoice();
    this.scene.start(LK.C.levels[this.levelIndex].type, { level: this.levelIndex });
  }
}
