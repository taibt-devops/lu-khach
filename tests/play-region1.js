// Play region 1 (Vũng Lầy Chán Nản) through the LK.debug hooks: one deliberate mistake per level must cost
// exactly one heart (2 stars); in the boss fight the Shield of Faith absorbs the wrong tile (3 stars).
const { chromium } = require('playwright');
const path = require('path');
const { url, SHOTS, launch } = require('./common');
const URL = url('?speed=4');
const OUT = SHOTS;
const errors = [];
let page;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const dbg = () => page.evaluate(() => (window.LK && LK.debug) ? { scene: LK.debug.scene, s: LK.debug.state ? LK.debug.state() : null, won: LK.debug.won, stars: LK.debug.stars } : {});
const act = ok => page.evaluate(o => LK.debug.act(o), ok);
const shot = name => page.screenshot({ path: path.join(OUT, name + '.png') });
async function waitScene(name, timeout = 30000) {
  await page.waitForFunction(n => window.LK && LK.debug && LK.debug.scene === n, name, { timeout });
  await sleep(500);
}

async function playLevel(scene, { mistakeAt, shots, ready }) {
  await waitScene(scene);
  let mistakes = 0;
  const taken = new Set();
  for (let guard = 0; guard < 4000; guard++) {
    const d = await dbg();
    if (d.scene !== scene || (d.s && d.s.over)) break;
    const key = JSON.stringify(d.s);
    if (shots) for (const [label, when] of Object.entries(shots)) if (!taken.has(label) && when(d.s)) { taken.add(label); await shot(label); }
    if (ready(d.s)) {
      const wrong = mistakes < mistakeAt.length && mistakeAt[mistakes](d.s);
      if (wrong) mistakes++;
      await act(!wrong);
      // wait until that answer has been scored (progress or a lost heart) before acting again
      const mark = s => `${s.pass}|${s.idx}|${s.hearts}|${s.wave}`;   // wave: Catch drops a fresh row of scrolls
      for (let w = 0; w < 80; w++) {
        await sleep(50);
        const n = await dbg();
        if (n.scene !== scene || !n.s || n.s.over || mark(n.s) !== mark(d.s)) break;
      }
    } else await sleep(60);
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
  await waitScene('Map', 20000);
  await page.mouse.click(730, 475);              // "Lên đường!"
  await sleep(400);
  await shot('02-map');

  const levels = [
    { scene: 'Runner', mistakeAt: [s => s.pass === 0 && s.idx === 2 && s.gate], ready: s => s.gate,
      shots: { '03-runner': s => s.gate && s.idx === 1, '04-runner-pass2': s => s.pass === 1 && s.gate } },
    { scene: 'River', mistakeAt: [s => s.idx === 3 && s.choices === 3], ready: s => !s.busy && s.choices > 0,
      shots: { '05-river': s => s.idx === 2 && s.choices > 0 } },
    { scene: 'Lantern', mistakeAt: [s => s.idx === 4 && !s.busy], ready: s => !s.busy,
      shots: { '06-lantern': s => s.idx === 6 && !s.busy } },
  ];
  for (const [i, lv] of levels.entries()) {
    await waitScene('Map');
    await act(true);
    await waitScene('Learn');
    if (i === 0) await shot('02b-learn');
    await act(true);
    const r = await playLevel(lv.scene, lv);
    if (!r.won) errors.push(`${lv.scene} was lost`);
    if (i === 2) await shot('07-result-shield');
    await act(true);
  }

  // boss: one wrong sword (no weakness), one wrong tile (eaten by the Shield of Faith)
  await waitScene('Map');
  await shot('08-map-progress');
  await act(true);
  await waitScene('Learn');
  await shot('09-boss-learn');
  await act(true);
  await waitScene('Boss');
  await shot('10-boss-intro');
  let wrongSword = false;
  let wrongTile = false;
  for (let guard = 0; guard < 3000; guard++) {
    const d = await dbg();
    if (d.scene !== 'Boss' || d.s.over) break;
    const { mode, next } = d.s;
    if (mode === 'choose' && !wrongSword) { await shot('11-boss-choose'); wrongSword = true; await act(false); }
    else if (mode === 'recite' && !wrongTile && next === 1) { await shot('12-boss-recite'); wrongTile = true; await act(false); }
    else if (mode === 'intro' || mode === 'choose' || mode === 'recite') await act(true);
    await sleep(mode === 'recite' ? 90 : 300);
  }
  await sleep(1200);
  await shot('13-boss-victory');
  await waitScene('Result', 20000);
  const r = await dbg();
  console.log(`  Boss: won=${r.won} stars=${r.stars}`);
  if (!r.won) errors.push('boss was lost');
  await shot('14-result-boss');
  await act(true);
  await waitScene('Map');
  await shot('15-map-done');
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('lukhach.v1')));
  console.log('save:', JSON.stringify(save));
  await browser.close();
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO ERRORS');
})().catch(async e => { console.error('FAILED', e.message); try { await shot('zz-failure'); } catch {} console.log(errors.join('\n')); process.exit(1); });
