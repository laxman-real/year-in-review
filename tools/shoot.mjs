// Render Year in Review posters to full-size JPGs for the posters repo (poster upload, 17 Nov).
//   node tools/shoot.mjs OUTDIR SET FMT BRAND PAGES
//   SET P1|G1, FMT post|story, BRAND real|remax, PAGES "01,02,..." (or "all")
// Uses the Kamui dev Chrome (port 9333) in its own background tab (#kamui-render, which the Kamui injector skips)
// and closes it after. The sheet view (?figma=SET&fmt=FMT&shoot) lays every page out at full size with no app UI.
// Prints one JSON line per saved file: {"file": "...", "page": "01"}
const [OUT, SET, FMT = 'post', BRAND = 'real', PAGES = 'all'] = process.argv.slice(2);
const fs = await import('fs'), path = await import('path');
const STORY = FMT === 'story', H = STORY ? 1920 : 1350;
const B = 'http://127.0.0.1:9333', wait = ms => new Promise(r => setTimeout(r, ms));
fs.mkdirSync(OUT, { recursive: true });
const t = await (await fetch(B + '/json/new?about:blank%23kamui-render', { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const p = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (p[m.id]) { p[m.id](m); delete p[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; p[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise(r => ws.onopen = r);
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.result?.value;
try {
  await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://localhost:4100/?figma=${SET}&fmt=${FMT}&brand=${BRAND}&shoot` });
  // wait for the sheet, the fonts, and every image
  for (let k = 0; k < 60 && !(await ev('!!window.__sheetReady')); k++) await wait(250);
  await ev(`(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))); return 1; })()`);
  // one column, no gaps, so a normal 1080 px viewport is enough (a 6120 px wide page was too heavy for Chrome)
  await ev(`(() => { const st = document.createElement('style'); st.textContent = '#figma-sheet { grid-template-columns: 1080px !important; gap: 0 !important; padding: 0 !important; }'; document.head.appendChild(st); return 1; })()`);
  await wait(1500);   // let the grain canvases and live colour settle
  const info = await ev(`[...document.querySelectorAll('#figma-sheet .fs-slide')].map(f => f.dataset.name)`);
  const want = PAGES === 'all' ? null : new Set(PAGES.split(','));
  for (let i = 0; i < info.length; i++) {
    const pid = String(i + 1).padStart(2, '0');
    if (want && !want.has(pid)) continue;
    const name = info[i].split(' · ')[1] || 'page';
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { x, y } = await ev(`(() => { const r = document.querySelectorAll('#figma-sheet .fs-slide')[${i}].getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY }; })()`);
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x, y, width: 1080, height: H, scale: 1 }, captureBeyondViewport: true });
    const file = path.join(OUT, `${pid}-${slug}.jpg`);
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    console.log(JSON.stringify({ file, page: pid }));
  }
} finally { ws.close(); await fetch(B + '/json/close/' + t.id); }
