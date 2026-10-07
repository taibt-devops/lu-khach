'use strict';
/* Turns the embedded data URIs into textures (no loader, no network: works from file:// and in the APK),
   builds the procedural textures and the hero's frame animations. */
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    const entries = Object.entries(LK.A.images);
    let left = entries.length;
    for (const [key, uri] of entries) {
      const img = new Image();
      img.onload = () => {
        this.textures.addImage(key, img);
        if (--left === 0) this.ready();
      };
      img.src = uri;
    }
  }

  ready() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1).fillCircle(8, 8, 8);
    g.generateTexture('dot', 16, 16);
    g.destroy();

    const size = 256;
    const glow = this.textures.createCanvas('glow', size, size);
    const ctx = glow.getContext();
    const grd = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.55, 'rgba(255,255,255,0.8)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    glow.refresh();

    for (const [key, frames] of Object.entries(LK.A.frames)) {
      const loop = key === 'run' || key === 'fly';
      this.anims.create({ key, frames: frames.map(f => ({ key: f })), frameRate: key === 'run' ? 9 : 8, repeat: loop ? -1 : 0 });
    }
    LK.checkContent();
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
    this.scene.start('Map');
  }
}
