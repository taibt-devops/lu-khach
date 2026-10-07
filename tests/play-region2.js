// Play region 2 of Lữ Khách (region 1 already won) through the debug hooks; one deliberate mistake per level.
const { chromium } = require('playwright');
const path = require('path');
const { url, SHOTS, launch } = require('./common');
const URL = url('?speed=4');
const OUT = SHOTS;
const errors = [];
let page;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dbg = () => page.evaluate(() => (window.LK && LK.debug) ? { scene: LK.debug.scene, s: LK.debug.state ? LK.debug.state() : null, won: LK.debug.won, stars: LK.debug.stars, region: LK.debug.region } : {});
const act = ok => page.evaluate(o => LK.debug.act(o), ok);
const shot = name => page.screenshot({ path: path.join(OUT, name + '.png') });
async function waitScene(name, timeout = 30000) {
  await page.waitForFunction(n => window.LK && LK.debug && LK.debug.scene === n, name, { timeout });
  await sleep(400);
}

async function playLevel(scene, { mistakeAt, ready, shots, before }) {
  await waitScene(scene);
  if (before) await before();
  let mistakes = 0;
  const taken = new Set();
  for (let guard = 0; guard < 6000; guard++) {
    const d = await dbg();
    if (d.scene !== scene || (d.s && d.s.over)) break;
    if (shots) for (const [label, when] of Object.entries(shots)) if (!taken.has(label) && when(d.s)) { taken.add(label); await shot(label); }
    if (ready(d.s)) {
      const wrong = mistakes < mistakeAt.length && mistakeAt[mistakes](d.s);
      if (wrong) mistakes++;
      await act(!wrong);
      const mark = s => `${s.pass}|${s.idx}|${s.hearts}|${s.wave}`;   // wave: Catch drops a fresh row of scrolls
      for (let w = 0; w < 100; w++) {
        await sleep(50);
        const n = await dbg();
        if (n.scene !== scene || !n.s || n.s.over || mark(n.s) !== mark(d.s)) break;
      }
    } else await sleep(50);
  }
  await waitScene('Result', 20000);
  const r = await dbg();
  console.log(`  ${scene}: won=${r.won} stars=${r.stars} (mistakes made: ${mistakes})`);
  return r;
}

(async () => {
  const browser = await chromium.launch(launch);
  page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto(URL);
  // an old (region-1-only) save that has beaten the boss: must open region 2 and migrate seenIntro
  await page.evaluate(() => localStorage.setItem('lukhach.v1', JSON.stringify({
    stars: { l1: 3, l2: 2, l3: 3, boss: 3 }, mastery: { isa4031: 2, psa402: 2, mat1128: 2 }, shield: true, seenIntro: true })));
  await page.reload();
  await waitScene('Map', 20000);
  const problems = await page.evaluate(() => LK.checkContent());
  if (problems.length) errors.push('content: ' + problems.join(','));
  const m = await dbg();
  console.log('map opens on region', m.region);
  await shot('r2-01-intro');
  await page.mouse.click(730, 475);                 // "Lên đường!"
  await sleep(400);
  await shot('r2-02-map');

  const levels = [
    { scene: 'Catch', ready: s => s.ready, mistakeAt: [s => s.idx >= 3 && s.wrong],
      before: async () => { await page.evaluate(() => LK.debug.calm()); },
      shots: { 'r2-04-catch': s => s.idx === 5 && s.ready } },
    { scene: 'Path', ready: s => !s.busy && s.right, mistakeAt: [s => s.pass === 0 && s.idx >= 3 && s.wrong],
      shots: { 'r2-05-path': s => s.pass === 0 && s.idx === 2 && !s.busy, 'r2-06-path-pass2': s => s.pass === 1 && s.idx === 4 && !s.busy } },
    { scene: 'Archery', ready: s => !s.busy && s.right, mistakeAt: [s => s.pass === 1 && s.idx >= 2 && s.wrong],
      shots: { 'r2-07-archery': s => s.pass === 0 && s.idx === 1 && s.right, 'r2-08-archery-words': s => s.pass === 1 && s.idx === 6 && s.right } },
  ];
  for (const [i, lv] of levels.entries()) {
    await waitScene('Map');
    await act(true);
    await waitScene('Learn');
    await shot(`r2-1${i}-learn`);
    await act(true);
    const r = await playLevel(lv.scene, lv);
    if (!r.won) errors.push(`${lv.scene} was lost`);
    if (r.stars !== 2) errors.push(`${lv.scene}: expected 2 stars after one mistake, got ${r.stars}`);
    if (i === 2) { await sleep(900); await shot('r2-09-result-region'); }
    await act(true);
  }
  await waitScene('Map');
  await shot('r2-10-map-done');
  // armory with all six swords
  await page.mouse.click(1140, 650);
  await sleep(500);
  await shot('r2-11-armory');
  // back to region 1: the gate button now opens region 2
  await page.evaluate(() => LK.game.scene.getScenes(true)[0].scene.start('Map', { region: 0 }));
  await waitScene('Map');
  await shot('r2-12-region1-map');
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('lukhach.v1')));
  // fire rocks in action (separate run, so they do not change the stars above)
  await page.evaluate(() => LK.game.scene.getScenes(true)[0].scene.start('Catch', { level: 4 }));
  await waitScene('Catch');
  await sleep(1500);
  await shot('r2-03-catch-rocks');
  console.log('save:', JSON.stringify(save));
  await browser.close();
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO ERRORS');
})().catch(async e => { console.error('FAILED', e.message); try { await shot('zz-failure'); } catch {} console.log(errors.join('\n')); process.exit(1); });
