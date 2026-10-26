// Records the two working-model scenes from the live demo page at 1920x1080, with a clean header.
const { chromium } = require('playwright');
const PAGE = 'file:///home/claude/work/demo2/TRIBE_live_demo_offline.html';
const which = process.argv[2];               // "lab" or "real"
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: `/home/claude/work/vid2/raw_${which}`, size: { width: 1920, height: 1080 } } });
  const p = await ctx.newPage(); const T0 = Date.now(); const mark = {};
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto(PAGE); await p.waitForTimeout(4000);
  const tag = which === 'lab' ? '03 · Working model' : '03 · Working model on the real TRIBE v2';
  const head = which === 'lab' ? 'Live inversion: the fit improves, the answer does not' : 'Logged run of the 177 M-parameter model';
  await p.addStyleTag({ content: `
    html { zoom: ${which === 'lab' ? 1.24 : 1.45} } .rail, .chatbox, .hovertip, .notes, .shead { display: none !important }
    .scene { min-height: 0 !important; padding-top: 118px !important; border: 0 !important }
    body { background: #f4f6fa !important }
    #vhead { position: fixed; left: 0; right: 0; top: 0; z-index: 60; padding: 40px 0 0 83px; height: 112px; background: linear-gradient(#f4f6fa 78%, rgba(244,246,250,0)); font-family: Inter }
    #vhead .t { font: 600 15px/1 Inter; letter-spacing: .14em; text-transform: uppercase; color: #d9501f }
    #vhead .h { font: 800 32px/1.15 'Inter Display', Inter; color: #13213c; margin-top: 8px; letter-spacing: -.01em }` });
  await p.evaluate(([tag, head]) => { const d = document.createElement('div'); d.id = 'vhead'; d.innerHTML = `<div class="t">${tag}</div><div class="h">${head}</div>`; document.body.append(d); }, [tag, head]);
  const smooth = (y, ms) => p.evaluate(([y, ms]) => new Promise(r => { const y0 = scrollY, t0 = performance.now();
    const f = t => { const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; scrollTo(0, y0 + (y - y0) * e); k < 1 ? requestAnimationFrame(f) : r(); }; requestAnimationFrame(f); }), [y, ms]);
  const top = id => p.evaluate(i => document.getElementById(i).getBoundingClientRect().top + scrollY, id);
  if (which === 'lab') {
    await p.evaluate(() => { document.getElementById('cK').value = 4; document.getElementById('cK').dispatchEvent(new Event('input')); });
    await p.evaluate(y => scrollTo(0, y), await top('lab')); await p.waitForTimeout(1500);
    mark.start = (Date.now() - T0) / 1000;
    await p.waitForTimeout(800); await p.click('#labRun');
    // wait for the run to finish, then glide down to agreement and sensitivity panels
    await p.waitForFunction(() => /2,400 \/ 2,400/.test(document.getElementById('labStatus').textContent), null, { timeout: 120000, polling: 200 });
    mark.done = (Date.now() - T0) / 1000;
    await p.waitForTimeout(700);
    await p.waitForTimeout(4000);
    mark.end = (Date.now() - T0) / 1000;
  } else {
    await p.evaluate(y => scrollTo(0, y), await top('replay')); await p.waitForTimeout(2500);
    mark.start = (Date.now() - T0) / 1000;
    await p.waitForTimeout(600); await p.click('#rpPlay');
    await p.waitForFunction(() => /Replay/.test(document.getElementById('rpPlay').textContent), null, { timeout: 120000, polling: 200 });
    mark.done = (Date.now() - T0) / 1000; await p.waitForTimeout(1500);
    mark.end = (Date.now() - T0) / 1000;
  }
  console.log(JSON.stringify(mark));
  require('fs').writeFileSync(`/home/claude/work/vid2/mark_${which}.json`, JSON.stringify(mark));
  await ctx.close(); await b.close();
})();
