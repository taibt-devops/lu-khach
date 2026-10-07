'use strict';
/* Boot the game once the Vietnamese font is ready (canvas text would otherwise render in a fallback). */
LK.SPEED = Number(new URLSearchParams(location.search).get('speed')) || 1;   // >1 only for automated tests

Promise.race([
  Promise.all([document.fonts.load('700 28px "Baloo 2"', 'Lữ Khách Đ'), document.fonts.load('600 20px "Baloo 2"', 'ạ')]),
  new Promise(r => setTimeout(r, 2500)),
]).then(() => {
  LK.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: LK.W,
    height: LK.H,
    backgroundColor: '#1d2b22',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2 },
    scene: [BootScene, MapScene, LearnScene, RunnerScene, RiverScene, LanternScene, BossScene,
      CatchScene, PathScene, ArcheryScene, ResultScene],
  });
});
