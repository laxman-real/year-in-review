// Bake Wrapped's masked layers (photo, art) to transparent full-slide PNGs for the Figma capture. node bake.mjs post|story
const FMT = process.argv[2] || 'post', STORY = FMT === 'story', H = STORY ? 1920 : 1350, GAP = 120;
const Y = decodeURIComponent(new URL('..', import.meta.url).pathname).replace(/\/$/, ''), OUT = `${Y}/export/figma-bake/${FMT}`;
const fs = await import('fs'); fs.mkdirSync(OUT, { recursive: true });
const B = 'http://127.0.0.1:9333', wait = ms => new Promise(r => setTimeout(r, ms));
const t = await (await fetch(B + '/json/new?about:blank%23kamui-render', { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const p = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (p[m.id]) { p[m.id](m); delete p[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; p[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise(r => ws.onopen = r); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.result?.value;
try {
  const W = GAP * 2 + 5 * 1080 + 4 * GAP, HH = GAP * 2 + 2 * H + GAP;
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: HH, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await send('Page.navigate', { url: `http://localhost:4100/?figma=V4&fmt=${FMT}&bake` }); await wait(5000);
  console.log('slides', await ev(`document.querySelectorAll('#figma-sheet .slide').length`));
  for (const [kind, sel] of [['photo', '.photo:not(.topic)'], ['art', '.mg-ill']]) {
    await ev(`(() => { document.getElementById('bk')?.remove(); const st = document.createElement('style'); st.id = 'bk'; st.textContent = \`
      html, body, #figma-sheet, #figma-sheet .fs-slide, #figma-sheet .slide { background: transparent !important; }
      #figma-sheet .slide * { visibility: hidden !important; }
      #figma-sheet .slide :is(${sel}), #figma-sheet .slide :is(${sel}) * { visibility: visible !important; }
      #figma-sheet .slide :is(${sel}) { mix-blend-mode: normal !important; opacity: 1 !important; translate: none !important; }\`; document.head.appendChild(st); return 1; })()`);
    await wait(1200);
    const has = await ev(`[...document.querySelectorAll('#figma-sheet .fs-slide')].map(f => !!f.querySelector('${sel}'))`);
    for (let i = 0; i < 10; i++) {
      if (!has[i]) continue;
      const x = GAP + (i % 5) * (1080 + GAP), y = GAP + Math.floor(i / 5) * (H + GAP);
      const r = await send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: 1080, height: H, scale: 1 }, captureBeyondViewport: true });
      fs.writeFileSync(`${OUT}/${kind}-${String(i + 1).padStart(2, '0')}.png`, Buffer.from(r.result.data, 'base64'));
    }
    console.log(kind, has.map((h, i) => h ? i + 1 : '').filter(Boolean).join(' '));
  }
} finally { ws.close(); await fetch(B + '/json/close/' + t.id); }
