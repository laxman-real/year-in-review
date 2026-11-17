// Render index.html#reel frame by frame with Chrome virtual time, in the Kamui Chrome tab, then restore the tab.
// node render.mjs OUTDIR FPS [maxSeconds]
const [OUT, FPS = 30, MAX, SET = 'P1', EXTRA = ''] = process.argv.slice(2);
// render2: renders in its own background tab (Laxman OK'd a 2nd tab, 17 Nov) and closes it after, so the main tab is never touched
const B = 'http://127.0.0.1:9333';
const t = await (await fetch(B + '/json/new?about:blank%23kamui-render', { method: 'PUT' })).json();
const main = (await (await fetch(B + '/json/list')).json()).find(x => x.type === 'page' && x.id !== t.id && /4100|claude\.ai/.test(x.url));
if (main) await fetch(B + '/json/activate/' + main.id);   // Chrome now runs with --disable-backgrounding-occluded-windows etc., so the render tab can stay behind
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const p = {}, ev = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (p[m.id]) { p[m.id](m); delete p[m.id]; } if (m.method && ev[m.method]) { ev[m.method](m); delete ev[m.method]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; p[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const once = name => new Promise(r => { ev[name] = r; });
await new Promise(r => ws.onopen = r);
const fs = await import('fs'); const wait = ms => new Promise(r => setTimeout(r, ms));
const errs = []; await send('Runtime.enable'); await send('Emulation.setFocusEmulationEnabled', { enabled: true }); ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
const evalv = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.result.value;
try {
  await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:4100/?reel=' + SET + EXTRA + '&render' }); await wait(300); await send('Page.reload', { ignoreCache: true }); await wait(3500);
  const total = await evalv('REEL.total');
  await send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
  await evalv('REEL.restart(), 1');
  const dt = 1000 / FPS, n = Math.ceil((MAX ? Math.min(+MAX, total) : total) * FPS) + 1;
  fs.mkdirSync(OUT, { recursive: true });
  for (let f = 0; f < n; f++) {
    const done = once('Emulation.virtualTimeBudgetExpired');
    await send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: f === 0 ? 1 : dt });
    await done;
    await evalv('window.__tick ? __tick() : 0');
    await evalv('window.__tick ? __tick() : 0');
    // a screenshot can wait forever for a compositor frame; if it takes over 5 s, nudge virtual time 1 ms and retry
    let r = null;
    for (let k = 0; k < 6 && !r; k++) {
      let h; const opt = [{}, { fromSurface: false }, { captureBeyondViewport: true }, { optimizeForSpeed: true }, {}, {}][k]; r = await Promise.race([send('Page.captureScreenshot', { format: 'jpeg', quality: 94, clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 }, ...opt }), new Promise(z => { h = setTimeout(() => z(null), 5000); })]); clearTimeout(h);
      if (!r) { console.log('retry screenshot at frame', f, 'after', JSON.stringify([{}, { fromSurface: false }, { captureBeyondViewport: true }, { optimizeForSpeed: true }, {}, {}][k]), 'live:', await Promise.race([evalv('document.querySelectorAll("#reel .rcard").length + " vis:" + [...document.querySelectorAll("#reel .rcard")].map((c,i)=>c.style.visibility==="visible"?i:"").join("")'), wait(2000).then(()=>'eval hang')])); const d2 = once('Emulation.virtualTimeBudgetExpired'); await send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: 1 }); await Promise.race([d2, wait(3000)]); }
    }
    if (!r) throw new Error('screenshot failed at frame ' + f);
    fs.writeFileSync(`${OUT}/f${String(f).padStart(4, '0')}.jpg`, Buffer.from(r.result.data, 'base64'));
    if (f % 60 === 0) console.log('frame', f, '/', n);
  }
  console.log('total', total.toFixed(2), 's frames', n, 'errors', JSON.stringify(errs));
} finally {
  ws.close();
  await fetch(B + '/json/close/' + t.id);
  if (main) await fetch(B + '/json/activate/' + main.id);   // back to Laxman's tab
}
