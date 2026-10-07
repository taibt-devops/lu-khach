// Real pointer input (no debug act): tap-to-run in Catch, tap and drag-and-drop in Path, tap-to-shoot in Archery.
const { chromium } = require('playwright');
const { url, launch } = require('./common');
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch(launch);
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(url());
  await page.evaluate(() => localStorage.setItem('lukhach.v1', JSON.stringify({ seen: { r1: true, r2: true }, stars: { l1: 1, l2: 1, l3: 1, boss: 1, l4: 1, l5: 1 } })));
  await page.reload();
  await page.waitForFunction(() => window.LK && LK.debug && LK.debug.scene === 'Map', null, { timeout: 20000 });
  const start = async (type, level) => {
    await page.evaluate(([t, l]) => LK.game.scene.getScenes(true)[0].scene.start(t, { level: l }), [type, level]);
    await page.waitForFunction(t => LK.debug.scene === t, type);
  };

  // Catch: a tap low on the screen sends the traveller there
  await start('Catch', 4);
  await sleep(2300);
  await page.mouse.click(300, 560);
  await sleep(1200);
  const hx = await page.evaluate(() => Math.round(LK.game.scene.getScene('Catch').hero.x));
  console.log('Catch: tap at x=300 -> hero.x =', hx, Math.abs(hx - 300) <= 4 ? 'OK' : 'FAIL');   // stops within 4 px

  // Path: tap the right stone, then drag the next right stone into the gap
  await start('Path', 5);
  await sleep(2300);
  const findRight = () => page.evaluate(() => {
    const s = LK.game.scene.getScene('Path');
    const f = s.visible().find(x => x.text === s.parts[s.idx] && x.c.y < 620 && x.c.y > 260);
    return f ? { x: f.c.x, y: f.c.y, idx: s.idx } : null;
  });
  const idxOf = () => page.evaluate(() => LK.game.scene.getScene('Path').idx);
  let f = null;
  for (let i = 0; i < 80 && !(f = await findRight()); i++) await sleep(150);
  await page.mouse.click(f.x, f.y);
  await sleep(1300);
  console.log('Path: tap right stone ->', await idxOf() === f.idx + 1 ? 'OK' : 'FAIL');
  f = null;
  for (let i = 0; i < 80 && !(f = await findRight()); i++) await sleep(150);
  await page.mouse.move(f.x, f.y);
  await page.mouse.down();
  for (let k = 1; k <= 12; k++) { await page.mouse.move(f.x + (486 - f.x) * k / 12, f.y + (520 - f.y) * k / 12); await sleep(16); }
  await page.mouse.up();
  await sleep(1300);
  console.log('Path: drag right stone into the gap ->', await idxOf() === f.idx + 1 ? 'OK' : 'FAIL');

  // Archery: tap a little ahead of the crow with the right word
  await start('Archery', 6);
  await sleep(2400);
  const idxA = () => page.evaluate(() => LK.game.scene.getScene('Archery').idx);
  let hit = false;
  for (let shotN = 0; shotN < 12 && !hit; shotN++) {
    let c = null;
    for (let i = 0; i < 60; i++) {
      c = await page.evaluate(() => {
        const s = LK.game.scene.getScene('Archery');
        const x = s.inSight().find(o => o.right && o.c.x < 1000 && o.c.x > 450);
        return x ? { x: x.c.x, y: x.c.y, v: x.speed } : null;
      });
      if (c) break;
      await sleep(100);
    }
    if (!c) continue;
    const before = await idxA();
    const lead = c.v * Math.hypot(c.x - 236, c.y - 548) / 1900;
    await page.mouse.click(c.x - lead, c.y + 50);
    await sleep(900);
    hit = (await idxA()) > before;
  }
  const hearts = await page.evaluate(() => LK.game.scene.getScene('Archery').hearts.n);
  console.log('Archery: tap-shoot hits the right crow ->', hit ? 'OK' : 'FAIL', '(hearts', hearts + ')');
  console.log(errs.length ? 'ERRORS ' + errs.join(' | ') : 'NO ERRORS');
  await browser.close();
})();
