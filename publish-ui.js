// Year in Review: Publish (poster upload). Local only: shows on localhost, never on the shared artifact.
// Pick sets, brands, sizes, pages and reels, add a note, review the file list, upload. serve.py + publish.py render
// the posters to JPGs and push them to the posters repo (LaxmanKshirsagar/year-in-review-posters).
(function () {
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname) || /[?&](figma|reel)=/.test(location.search)) return;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const slug = n => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const css = document.createElement('style');
  css.textContent = `
  .pub-btn { height: 34px; padding: 0 16px; margin-left: 10px; border: 0; border-radius: 999px; background: #0b1030; color: #fff; font: 500 13px/1 var(--font-body, Inter, sans-serif); cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
  .pub-btn:hover { background: #1c2557; }
  .pub { position: fixed; inset: 0; z-index: 2000; background: rgba(8,10,24,.55); display: flex; align-items: center; justify-content: center; font: 400 14px/1.4 Inter, system-ui, sans-serif; color: #0b1030; }
  .pub-card { width: min(720px, calc(100vw - 32px)); max-height: calc(100vh - 48px); overflow: auto; background: #fff; border-radius: 16px; box-shadow: 0 30px 80px rgba(0,0,0,.35); padding: 28px; }
  .pub h2 { margin: 0 0 4px; font: 500 22px/1.2 Inter, sans-serif; }
  .pub .sub { margin: 0 0 22px; color: #646b85; font-size: 13px; }
  .pub .sub a { color: #2a40d8; }
  .pub .pub-row { display: grid; grid-template-columns: 96px 1fr; gap: 12px; align-items: start; margin-bottom: 16px; }
  .pub .lab { padding-top: 7px; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: #646b85; }
  .pub .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .pub .chip { height: 32px; padding: 0 14px; border-radius: 999px; border: 1px solid #d9dce6; background: #fff; color: #0b1030; font: 400 13px/1 Inter, sans-serif; cursor: pointer; }
  .pub .chip[aria-pressed="true"] { background: #0b1030; border-color: #0b1030; color: #fff; }
  .pub .chip:disabled { opacity: .4; cursor: not-allowed; }
  .pub .chip.pg { min-width: 40px; padding: 0 10px; }
  .pub textarea { width: 100%; box-sizing: border-box; min-height: 64px; padding: 10px 12px; border: 1px solid #d9dce6; border-radius: 10px; font: 400 14px/1.4 Inter, sans-serif; resize: vertical; }
  .pub .sum { margin: 18px 0 0; padding: 12px 14px; background: #f3f4f8; border-radius: 10px; font-size: 13px; }
  .pub .acts { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  .pub .b { height: 38px; padding: 0 18px; border-radius: 999px; border: 1px solid #d9dce6; background: #fff; font: 500 14px/1 Inter, sans-serif; cursor: pointer; color: #0b1030; }
  .pub .b.main { background: #2a40d8; border-color: #2a40d8; color: #fff; }
  .pub .b:disabled { opacity: .45; cursor: not-allowed; }
  .pub .files { max-height: 260px; overflow: auto; margin: 0; padding: 10px 14px; background: #f3f4f8; border-radius: 10px; font: 400 12px/1.7 ui-monospace, Menlo, monospace; list-style: none; }
  .pub .pub-bar { height: 8px; background: #eceef4; border-radius: 99px; overflow: hidden; margin: 6px 0 12px; }
  .pub .pub-bar i { display: block; height: 100%; width: 0; background: #2a40d8; transition: width .3s; }
  .pub .log { max-height: 200px; overflow: auto; margin: 0; padding: 10px 14px; background: #0b1030; color: #cfd6ff; border-radius: 10px; font: 400 12px/1.6 ui-monospace, Menlo, monospace; white-space: pre-wrap; }
  .pub .ok { color: #137a3a; font-weight: 500; } .pub .err { color: #c21d1d; font-weight: 500; }
  `;
  document.head.appendChild(css);

  let INFO = null;
  const sel = { sets: new Set(), brands: new Set(), fmts: new Set(), pages: new Set(), reels: new Set(), all: true };

  function addButton() {
    const segs = $('.hdr .segs'); if (!segs || $('.pub-btn')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pub-btn'; b.title = 'Upload posters to GitHub for the team';
    b.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></svg>Publish';
    b.onclick = open; segs.after(b);
  }

  async function open() {
    try { INFO = await (await fetch('/api/publish/info', { cache: 'no-store' })).json(); }
    catch (e) { alert('The local server has no upload API. Restart it with: python3 serve.py 4100'); return; }
    const st = window.YIR_STATE || {};
    // start from what's on screen: the open set, the current brand and size
    sel.sets = new Set(INFO.sets.some(s => s.id === st.view) ? [st.view] : INFO.sets.map(s => s.id));
    sel.brands = new Set([st.brand || 'real']); sel.fmts = new Set([st.story ? 'story' : 'post']);
    sel.all = true; sel.pages = new Set(); sel.reels = new Set();
    const st0 = await (await fetch('/api/publish/status', { cache: 'no-store' })).json();
    const m = document.createElement('div'); m.className = 'pub'; m.innerHTML = '<div class="pub-card"></div>';
    m.addEventListener('click', e => { if (e.target === m && !busy()) m.remove(); });
    document.body.appendChild(m);
    st0.running ? progress(m) : pick(m);
  }
  const busy = () => !!$('.pub [data-busy]');

  function chip(label, on, attrs = '') { return `<button type="button" class="chip" aria-pressed="${on}" ${attrs}>${label}</button>`; }

  function pick(m) {
    const card = $('.pub-card', m), pages = YIR.pages;
    card.innerHTML = `<h2>Publish posters</h2>
      <p class="sub">Renders the chosen posters at full size and uploads them to <a href="${INFO.repo}" target="_blank" rel="noopener">${INFO.repo.replace('https://github.com/', '')}</a> (private) for the team.</p>
      <div class="pub-row"><div class="lab">Sets</div><div class="chips" data-k="sets">${INFO.sets.map(s => chip(s.title, sel.sets.has(s.id), `data-v="${s.id}"`)).join('')}${chip('Wrapped · later', false, 'disabled title="Wrapped stays local for now"')}</div></div>
      <div class="pub-row"><div class="lab">Brand</div><div class="chips" data-k="brands">${Object.entries(INFO.brands).map(([k, v]) => chip(v, sel.brands.has(k), `data-v="${k}"`)).join('')}</div></div>
      <div class="pub-row"><div class="lab">Size</div><div class="chips" data-k="fmts">${Object.entries(INFO.fmts).map(([k, v]) => chip(v, sel.fmts.has(k), `data-v="${k}"`)).join('')}</div></div>
      <div class="pub-row"><div class="lab">Pages</div><div class="chips" data-k="pages">${chip('All 10', sel.all, 'data-v="all"')}${pages.map(p => chip(p.id, !sel.all && sel.pages.has(p.id), `data-v="${p.id}" title="${p.name}"`)).join('')}</div></div>
      <div class="pub-row"><div class="lab">Reels</div><div class="chips" data-k="reels">${INFO.reels.map(r => chip(r.label, sel.reels.has(r.name), `data-v="${r.name}" ${r.ok ? '' : 'disabled'}`)).join('')}</div></div>
      <div class="pub-row"><div class="lab">Note</div><textarea placeholder="What changed? For example: Glow REMAX, new colours on the break pages"></textarea></div>
      <div class="sum"></div>
      <div class="acts"><button type="button" class="b" data-a="cancel">Cancel</button><button type="button" class="b main" data-a="review">Review files</button></div>`;
    const ta = $('textarea', card); ta.value = sel.note || '';
    $$('.chips', card).forEach(g => g.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b || b.disabled) return;
      const k = g.dataset.k, v = b.dataset.v;
      if (k === 'pages') {
        if (v === 'all') { sel.all = true; sel.pages.clear(); }
        else { sel.all = false; sel.pages.has(v) ? sel.pages.delete(v) : sel.pages.add(v); if (!sel.pages.size) sel.all = true; }
      } else { sel[k].has(v) ? sel[k].delete(v) : sel[k].add(v); }
      sel.note = ta.value; pick(m);
    }));
    $('[data-a="cancel"]', card).onclick = () => m.remove();
    $('[data-a="review"]', card).onclick = () => { sel.note = ta.value; review(m); };
    const n = files().length;
    $('.sum', card).innerHTML = n ? `<b>${n}</b> file${n === 1 ? '' : 's'} will be uploaded${sel.reels.size ? ` (${n - sel.reels.size} posters, ${sel.reels.size} reels)` : ''}.` : 'Nothing selected yet.';
    $('[data-a="review"]', card).disabled = !n;
  }

  function items() {
    const out = [];
    for (const s of sel.sets) for (const b of sel.brands) for (const f of sel.fmts)
      out.push({ set: s, brand: b, fmt: f, pages: sel.all ? 'all' : [...sel.pages].sort() });
    return out;
  }
  function files() {
    const name = id => INFO.sets.find(s => s.id === id).name, list = [];
    for (const it of items()) for (const p of YIR.pages)
      if (it.pages === 'all' || it.pages.includes(p.id)) list.push(`${it.brand}/${name(it.set)}/${it.fmt}/${p.id}-${slug(p.name)}.jpg`);
    for (const r of sel.reels) list.push('reels/' + r);
    return list;
  }

  function review(m) {
    const card = $('.pub-card', m), list = files(), note = sel.note.trim() || 'Update posters';
    card.innerHTML = `<h2>Review and upload</h2>
      <p class="sub">${list.length} file${list.length === 1 ? '' : 's'} go${list.length === 1 ? 'es' : ''} to <a href="${INFO.repo}" target="_blank" rel="noopener">${INFO.repo.replace('https://github.com/', '')}</a>. Files with the same name are replaced; GitHub keeps the old versions in its history.</p>
      <ul class="files">${list.map(f => `<li>${f}</li>`).join('')}</ul>
      <p class="sum">Note: <b>${note.replace(/</g, '&lt;')}</b>${sel.brands.has('remax') ? '<br>Includes REMAX versions (internal brand material): the posters repo is private.' : ''}</p>
      <div class="acts"><button type="button" class="b" data-a="back">Back</button><button type="button" class="b main" data-a="go">Upload ${list.length} file${list.length === 1 ? '' : 's'}</button></div>`;
    $('[data-a="back"]', card).onclick = () => pick(m);
    $('[data-a="go"]', card).onclick = async () => {
      const r = await fetch('/api/publish/start', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items(), reels: [...sel.reels], message: note }) });
      const j = await r.json();
      if (!j.ok) { alert(j.error || 'Upload could not start.'); return; }
      progress(m);
    };
  }

  function progress(m) {
    const card = $('.pub-card', m);
    card.innerHTML = `<h2 data-busy>Uploading…</h2><p class="sub step">Starting</p><div class="pub-bar"><i></i></div><pre class="log"></pre>
      <div class="acts"><button type="button" class="b" data-a="hide">Hide (keeps running)</button></div>`;
    $('[data-a="hide"]', card).onclick = () => m.remove();
    const tick = async () => {
      if (!document.body.contains(m)) return;
      const s = await (await fetch('/api/publish/status', { cache: 'no-store' })).json();
      $('.step', card).textContent = s.step || '';
      $('.pub-bar i', card).style.width = s.total ? `${Math.round(100 * s.done / s.total)}%` : '0';
      const log = $('.log', card); log.textContent = s.log.join('\n'); log.scrollTop = log.scrollHeight;
      if (s.running) return setTimeout(tick, 700);
      const h = $('h2', card); h.removeAttribute('data-busy');
      if (s.error) { h.innerHTML = '<span class="err">Upload failed</span>'; }
      else if (s.url) { h.innerHTML = '<span class="ok">Uploaded</span>'; $('.step', card).innerHTML = `${s.done} file${s.done === 1 ? ' is' : 's are'} on GitHub. <a href="${s.url}" target="_blank" rel="noopener">Open the commit</a> · <a href="${INFO.repo}" target="_blank" rel="noopener">Open the gallery</a>`; }
      else { h.innerHTML = '<span class="ok">Up to date</span>'; }
      $('.acts', card).innerHTML = '<button type="button" class="b main" data-a="close">Done</button>';
      $('[data-a="close"]', card).onclick = () => m.remove();
    };
    tick();
  }

  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', addButton) : addButton();
})();
