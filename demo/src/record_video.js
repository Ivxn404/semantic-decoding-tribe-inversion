// Records a captioned 90-second walkthrough of the live demo page.
const { chromium } = require('playwright');
const PAGE = 'file:///home/claude/work/demo2/TRIBE_live_demo_offline.html';
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: '/home/claude/work/video/raw', size: { width: 1280, height: 720 } } });
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  const t0 = Date.now(); const log = [];
  await p.goto(PAGE);
  await p.addStyleTag({ content: `
    .chatbox, .hovertip { display: none !important }
    #capbar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 99; padding: 14px 40px 18px; background: rgba(12,22,40,.9); color: #fff;
      font: 600 23px/1.35 system-ui, sans-serif; text-align: center; transition: opacity .25s }
    #capbar small { display: block; font: 500 14px/1.3 system-ui, sans-serif; opacity: .75; margin-top: 4px; letter-spacing: .04em }
    #card { position: fixed; inset: 0; z-index: 100; background: #0c1628; color: #fff; display: grid; place-content: center; text-align: center; gap: 18px; padding: 60px; font-family: system-ui, sans-serif }
    #card h1 { font: 800 38px/1.2 system-ui, sans-serif; margin: 0; max-width: 1050px }
    #card p { margin: 0; font-size: 21px; opacity: .9 } #card .id { font-size: 26px; font-weight: 700; color: #ffc9a8 }` });
  const cap = (t, s = '') => p.evaluate(([t, s]) => { let c = document.getElementById('capbar'); if (!c) { c = document.createElement('div'); c.id = 'capbar'; document.body.append(c); }
    c.innerHTML = t + (s ? `<small>${s}</small>` : ''); }, [t, s]).then(() => log.push([(Date.now() - t0) / 1000, t]));
  const go = id => p.evaluate(i => document.getElementById(i).scrollIntoView({ behavior: 'instant', block: 'start' }), id);
  const wait = ms => p.waitForTimeout(ms);
  const click = sel => p.click(sel).catch(e => console.log('click fail', sel));

  // title card
  await p.evaluate(() => { const d = document.createElement('div'); d.id = 'card'; d.innerHTML = `<p class="id">Project ID SBT_SW15 · BECE497J Project-I</p>
    <h1>Conditioning and Non-Convexity of Semantic Decoding by Inversion of Deep Brain Encoding Models</h1>
    <p>Abhranil Sarkar (23BML0077) · Tanisha Choudhuri (23BML0081)</p><p>Guide: Dr. Sharmila Nageswaran, SENSE, VIT Vellore</p>`; document.body.append(d); });
  await wait(1500); const tStart = Date.now();
  await wait(5000);
  await p.evaluate(() => document.getElementById('card').remove());

  await go('open'); await cap('Brain encoders such as Meta’s TRIBE v2 predict fMRI responses very accurately.', 'Question: can such an encoder simply be inverted to read meaning back out of brain activity?');
  await wait(8000);
  await go('pipe'); await cap('Method: the frozen 177 M-parameter TRIBE v2 is re-entered after feature aggregation,', 'and the stimulus representation x is recovered by gradient descent (re-entry reproduces the release, r = 1.0000).');
  await wait(7500);
  await go('truth'); await cap('A known x in the model’s own input space makes the recovery error exact.', 'Real story representations are just as low-dimensional, and a real stimulus as ground truth gives the same picture.');
  await wait(7500);
  await go('lab'); await wait(300); await cap('Live inversion in the browser: prediction error falls about a million-fold…', 'Recovery of the true x stalls, and equally good fits from different starts disagree.');
  await click('#labRun'); await wait(16000);
  await cap('The leftover error hides where the encoder barely responds.', 'Sensitivity along the disagreement is far below random directions (2.15× on TRIBE v2).');
  await p.evaluate(() => document.querySelector('#chSens').scrollIntoView({ block: 'center' })); await wait(4500);
  await go('replay'); await click('#rpPlay'); await cap('The same experiment logged on the real model: median vertex fit R² reaches 0.995,', 'yet recovery stops near 0.5 and the three starts agree only 0.37–0.54.');
  await wait(9000);
  await go('findings'); await cap('Findings: error falls 28.4× while recovery saturates at 0.944; equal fits disagree (0.817).', 'Forward-only tests show barriers between solutions (median 4.8×): the inverse is non-convex, not a null space.');
  await wait(3500); await p.evaluate(() => [...document.querySelectorAll('#fTabs button')].find(b => /Barrier/.test(b.textContent))?.click()); await wait(4500);
  await go('regions'); await p.evaluate(() => [...document.querySelectorAll('#netList button')].find(b => /Visual/.test(b.textContent))?.click());
  await cap('Predictable is not recoverable: the most responsive network (visual) is the worst to decode from,', 'while the least responsive (somatomotor) is the best, about ten times the control spread.');
  await wait(4000); await p.evaluate(() => [...document.querySelectorAll('#netList button')].find(b => /Somatomotor/.test(b.textContent))?.click()); await wait(3500);
  await go('fmri'); await cap('Real fMRI, a story TRIBE v2 never saw: 4 of 5 segments identified among 45 (chance 2.2%),', 'yet the recovered representation has cosine only 0.02 with the truth: identification works, reconstruction does not.');
  await wait(8500);
  await go('close'); await cap('Encoding accuracy does not certify decoding: recoverability has to be measured.', 'Project ID SBT_SW15 · code, data pointers and notebooks: github.com/Ivxn404/semantic-decoding-tribe-inversion');
  await wait(6000);
  console.log('content seconds', ((Date.now() - tStart) / 1000).toFixed(1), 'title offset', ((tStart - t0) / 1000).toFixed(1));
  console.log(JSON.stringify(log));
  await ctx.close(); await b.close();
})();
