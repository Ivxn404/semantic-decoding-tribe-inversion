const { chromium } = require('playwright'); const fs = require('fs');
const P = JSON.parse(fs.readFileSync('/home/claude/work/vid2/plan.json')); const ids = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file:///home/claude/work/vid2/scenes.html'); await p.waitForTimeout(1000);
  for (const id of ids) {
    const sc = P.scenes.find(s => s.id === id), N = Math.ceil(sc.D * 25), dir = `/home/claude/work/vid2/frames/${id}`;
    fs.mkdirSync(dir, { recursive: true }); const t0 = Date.now();
    for (let k = 0; k < N; k++) { await p.evaluate(([id, t, D]) => render(id, t, D), [id, k / 25, sc.D]); await p.screenshot({ path: `${dir}/${String(k).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93 }); }
    console.log(id, N, 'frames', ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  await b.close(); })();
