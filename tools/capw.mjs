// Open a Figma capture of the Year in Review sheet in its own tab, wait, then close it. node capw.mjs SET FMT CAPTURE_ID PROMPT_ID [extra]
const [SET, FMT, CID, PID, EXTRA = ''] = process.argv.slice(2);
const B = 'http://127.0.0.1:9333';
const ep = encodeURIComponent(`https://mcp.figma.com/mcp/capture/${CID}/submit?bindVariables=true&promptId=${PID}`);
const url = `http://localhost:4100/?figma=${SET}&fmt=${FMT}${EXTRA}#figmacapture=${CID}&figmaendpoint=${ep}&figmadelay=7000&figmaselector=%23figma-sheet`;
const t = await (await fetch(B + '/json/new?about:blank%23kamui-render', { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); let id = 0; const p = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (p[m.id]) { p[m.id](m); delete p[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; p[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise(r => ws.onopen = r);
await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true }); await send('Page.navigate', { url });
await new Promise(r => setTimeout(r, 5000));
const v = (await send('Runtime.evaluate', { expression: `location.hash.slice(0,20) + ' ' + document.querySelectorAll('#figma-sheet .slide').length + ' slides, baked ' + document.querySelectorAll('#figma-sheet img.baked').length + ', capture ' + !!window.figma`, returnByValue: true })).result.result.value;
console.log(FMT, v);
await new Promise(r => setTimeout(r, 45000));
ws.close(); await fetch(B + '/json/close/' + t.id); console.log(FMT, 'tab closed');
