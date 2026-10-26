const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1366, height: 860 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file:///home/claude/work/demo2/TRIBE_live_demo_offline.html'); await p.waitForTimeout(3000);
  await p.addStyleTag({ content: '.chatbox,.hovertip,.rail{display:none!important}' });
  const shot = async (sel, name, pre) => { await p.evaluate(s => document.querySelector(s).scrollIntoView({block:'center'}), sel); if (pre) await pre(); await p.waitForTimeout(2500); await p.locator(sel).screenshot({ path: `assets/${name}.png`, omitBackground: true }); console.log('ok', name); };
  await shot('#heroBrain', 'hero_brain');
  await shot('#pipeSvg', 'pipe');
  await shot('#roiBrain', 'roi_brain', async () => { await p.evaluate(() => [...document.querySelectorAll('#netList button')].find(b => /Visual/.test(b.textContent))?.click()); });
  await p.evaluate(() => document.getElementById('fmri').scrollIntoView()); await p.waitForTimeout(5000);
  await shot('#ranks', 'ranks');
  await shot('#eegBrain', 'eeg_brain');
  await b.close();
})();
