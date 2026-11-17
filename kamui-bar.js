/*
 * kamui-bar.js — the Kamui bar: one top strip for local work and shared prototypes.
 *
 * Dev mode (localhost only, loaded on every page of the dev Chrome as a Playwright init script):
 *   context (ticket · branch from /kamui-context.json) · prototype controls · picker with notes.
 * Shared mode (a shared prototype page sets window.KAMUI_BAR_MODE = 'shared' before this script):
 *   prototype controls only.
 *
 * A page adds its prototype controls with:
 *   (window.KamuiBar ? window.KamuiBar.register(cfg) : ((window.KamuiBarQueue = window.KamuiBarQueue || []).push(cfg)));
 *   cfg = {
 *     id: 'rv2-74793', title: 'RV2-74793 · Schedule a new plan',
 *     options: [{ id, label, note }], defaultOption,       // one at a time
 *     toggles: [{ id, label, note }],                       // on/off states
 *     viewers: [{ id, label }], defaultViewer,              // who the prototype pretends you are
 *     target: () => element,                                // what Outline and Scroll to point at
 *     onSelect(id), onToggle(id, on), onViewer(id),
 *   }
 * State lives in the link (#opt=v2&tg=overridden&viewer=staff), so Copy link reopens the same view.
 * Picks (dev mode) live in sessionStorage 'kamuiPicked'; Claude reads them when asked.
 * The bar sits in a Shadow DOM, so the page's CSS can't change it. No dependencies.
 */
(function () {
  try { if (window.top !== window) return; } catch (e) { return; }
  if (window.KamuiBar && window.KamuiBar.__ready) return;

  // Kamui's own look: graphite and amber, so the bar never reads as part of the product UI
  const ACCENT = '#F5B544', OK = '#4ADE80';
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    eye: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    option: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    state: svg('<rect x="2" y="7" width="20" height="10" rx="5"/><circle cx="8" cy="12" r="3"/>'),
    viewer: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    panel: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M15 4v16"/>'),
    pick: svg('<circle cx="12" cy="12" r="7"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>'),
    chev: svg('<path d="M6 9l6 6 6-6"/>'),
    up: svg('<path d="M6 15l6-6 6 6"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  };
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const PICKS_KEY = 'kamuiPicked';
  // Ticket icon (outline), drawn in the bar's text colour
  const TICKET_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9a3 3 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a3 3 0 0 0 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z"/><path d="M14 5v2M14 11v2M14 17v2"/></svg>';

  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } },
  };
  const local = {
    get(k) { try { return localStorage.getItem('kamui-bar:' + k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem('kamui-bar:' + k, v); } catch (e) { /* storage blocked */ } },
  };
  const readPicks = () => { try { return JSON.parse(session.get(PICKS_KEY) || '[]'); } catch (e) { return []; } };
  const writePicks = (list) => session.set(PICKS_KEY, JSON.stringify(list.slice(-30)));
  const fromHash = () => Object.fromEntries(location.hash.slice(1).split('&').filter((p) => p.includes('=')).map((p) => p.split('=').map(decodeURIComponent)));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let mode = null;
  let proto = null;
  let menus = {};
  let openMenu = null;

  // Typing in the bar's own fields: the page's keyboard shortcuts can't see inside the bar, so they
  // would grab letters (Bolt ate "h"). This runs before the page's scripts and keeps those keys for us;
  // the browser still types the character because nothing calls preventDefault.
  window.addEventListener('keydown', (e) => {
    if (!openMenu) return;
    const items = [...sh.querySelectorAll('.menu [role="option"]')];
    const i = items.indexOf(sh.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) choose(items[i].dataset.val); }
    else if (e.key === 'Escape') hideMenu();
    else return;
    e.stopImmediatePropagation();
  }, true);
  ['keydown', 'keypress', 'keyup'].forEach((type) =>
    window.addEventListener(type, (e) => {
      if (!host || !e.composedPath().includes(host)) return;
      const t = e.composedPath()[0];
      if (!t || !t.matches || !t.matches('textarea, input, select')) return;
      e.stopImmediatePropagation();
      if (type !== 'keydown' || t.id !== 'kb-note') return;
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { cancelNote(); hidePops(); }
    }, true));
  const state = { opt: null, on: new Set(), viewer: null, highlight: local.get('hl') !== '0', collapsed: local.get('collapsed') === '1', picking: false };
  let sh, host, bar;
  const $ = (s) => sh.querySelector(s);

  // ---------- page styles (outside the shadow root) ----------
  function addPageCss() {
    const css = document.createElement('style');
    css.id = 'kamui-bar-page-css';
    css.textContent = `
      body.kb-on { padding-top: var(--kb-h, 40px) !important; }
      body.kb-on .mantine-Drawer-inner, body.kb-on .mantine-Drawer-overlay { top: var(--kb-h, 40px) !important; height: calc(100% - var(--kb-h, 40px)) !important; }
      html.kb-panel-open { --kb-pw: 300px; }
      html.kb-panel-open body { margin-right: var(--kb-pw) !important; }
      html.kb-panel-open .mantine-Drawer-inner, html.kb-panel-open .mantine-Drawer-overlay { right: var(--kb-pw) !important; width: auto !important; }
      .kb-hl { outline: 1.5px dashed ${ACCENT} !important; outline-offset: 6px; border-radius: 8px; }
      .kb-flash { outline: 3px solid rgba(245,181,68,.55) !important; outline-offset: 6px; transition: outline-color .3s; }
      @media (prefers-reduced-motion: reduce) { .kb-flash { transition: none; } }`;
    document.head.appendChild(css);
  }

  // ---------- the bar ----------
  function build() {
    host = document.createElement('div');
    host.id = 'kamui-bar';
    host.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483000;';
    document.documentElement.appendChild(host);
    sh = host.attachShadow({ mode: 'open' });
    sh.innerHTML = `
      <style>
        :host { all: initial;
          --bg: rgba(20,20,22,.94); --panel: #1C1C1F; --field: #141416; --line: rgba(255,255,255,.08); --line-2: rgba(255,255,255,.14);
          --fg: #EDEDEF; --muted: #9B9BA4; --accent: ${ACCENT}; --ink: #1A1206; --ok: ${OK}; }
        * { box-sizing: border-box; }
        [hidden] { display: none !important; }
        .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; min-height: 40px;
          padding: 6px max(12px, env(safe-area-inset-right, 0px)) 6px max(12px, env(safe-area-inset-left, 0px)); padding-top: calc(6px + env(safe-area-inset-top, 0px));
          background: var(--bg); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); color: var(--fg);
          border-bottom: 1px solid var(--line); box-shadow: 0 1px 0 rgba(0,0,0,.25), 0 6px 18px rgba(0,0,0,.12);
          font: 500 12px/16px Inter, system-ui, -apple-system, 'Segoe UI', sans-serif; }
        button { font: inherit; color: inherit; background: transparent; border: 0; cursor: pointer; white-space: nowrap; }
        button:focus-visible, textarea:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
        svg { width: 16px; height: 16px; display: block; flex: none; }
        .ib { width: 28px; height: 28px; border-radius: 7px; display: inline-flex; align-items: center; justify-content: center; color: var(--muted); transition: background .12s, color .12s; }
        .ib:hover, .ib[aria-expanded="true"] { background: rgba(255,255,255,.07); color: var(--fg); }
        .tb { height: 28px; padding: 0 10px; border-radius: 8px; color: var(--muted); transition: background .12s, color .12s; }
        .tb:hover { background: rgba(255,255,255,.07); color: var(--fg); }
        .tb.primary { background: var(--accent); color: var(--ink); font-weight: 600; }
        .tb.primary:hover { background: var(--accent); color: var(--ink); filter: brightness(1.06); }
        .ib[aria-pressed="false"].hl { color: rgba(155,155,164,.55); }
        .div { width: 1px; height: 16px; background: var(--line-2); margin: 0 2px; }
        .grp { display: inline-flex; align-items: center; gap: 6px; }
        .lab { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
        .title { color: var(--fg); max-width: 32ch; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .seg { display: inline-flex; gap: 2px; padding: 2px; border-radius: 8px; background: rgba(255,255,255,.04); border: 1px solid var(--line); }
        .seg button { height: 24px; padding: 0 10px; border-radius: 6px; color: var(--muted); transition: background .12s, color .12s; }
        .seg button:hover { color: var(--fg); background: rgba(255,255,255,.06); }
        .seg button[aria-pressed="true"] { background: #F4F4F5; color: #141416; }
        .tgl { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px; border-radius: 8px; border: 1px solid var(--line); color: var(--muted); transition: all .12s; }
        .tgl .dot { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid currentColor; }
        .tgl:hover { color: var(--fg); border-color: var(--line-2); }
        .tgl[aria-pressed="true"] { color: var(--fg); border-color: rgba(245,181,68,.45); background: rgba(245,181,68,.10); }
        .tgl[aria-pressed="true"] .dot { background: var(--accent); border-color: var(--accent); }
        .spacer { flex: 1; }
        .split { display: inline-flex; align-items: stretch; height: 28px; border-radius: 8px; border: 1px solid var(--line-2); overflow: hidden; }
        .split button { display: inline-flex; align-items: center; gap: 6px; transition: background .12s, color .12s; }
        .pick { padding: 0 10px 0 8px; color: var(--fg); }
        .pick:hover { background: rgba(255,255,255,.06); }
        .pick[aria-pressed="true"] { background: var(--accent); color: var(--ink); }
        .picks { padding: 0 6px 0 8px; border-left: 1px solid var(--line-2); color: var(--muted); }
        .picks svg { width: 12px; height: 12px; }
        .picks:hover, .picks[aria-expanded="true"] { background: rgba(255,255,255,.07); color: var(--fg); }
        .count { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 9px; background: rgba(255,255,255,.10); color: var(--fg); font-size: 11px; line-height: 18px; text-align: center; }
        .count.has { background: var(--accent); color: var(--ink); }
        .pill { position: fixed; top: calc(8px + env(safe-area-inset-top, 0px)); right: calc(12px + env(safe-area-inset-right, 0px)); }
        .pill button { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px 0 10px; border-radius: 999px; background: var(--bg); color: var(--fg); border: 1px solid var(--line-2); box-shadow: 0 6px 18px rgba(0,0,0,.3); font: 500 12px/16px Inter, system-ui, sans-serif; -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
        .pop { position: fixed; right: calc(12px + env(safe-area-inset-right, 0px)); top: calc(var(--kb-h, 40px) + 8px); width: min(360px, calc(100vw - 24px));
          background: var(--panel); color: var(--fg); border: 1px solid var(--line-2); border-radius: 12px; box-shadow: 0 16px 40px rgba(0,0,0,.45);
          font: 400 13px/18px Inter, system-ui, sans-serif; overflow: hidden; }
        .pop header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 10px 10px 14px; border-bottom: 1px solid var(--line); font-weight: 600; }
        .pop .body { padding: 12px 14px; display: grid; gap: 10px; }
        .pop .el { font: 500 12px/16px ui-monospace, 'SF Mono', Menlo, monospace; color: var(--muted); word-break: break-all; }
        .pop label { color: var(--muted); font-size: 12px; }
        .pop textarea { width: 100%; min-height: 72px; resize: vertical; background: var(--field); color: var(--fg); border: 1px solid var(--line-2); border-radius: 8px; padding: 8px 10px; font: inherit; }
        .pop textarea::placeholder { color: #6B6B74; }
        .pop textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(245,181,68,.18); }
        .pop .row { display: flex; justify-content: flex-end; gap: 6px; }
        .btn { height: 30px; padding: 0 12px; border-radius: 8px; color: var(--fg); border: 1px solid var(--line-2); }
        .btn:hover { background: rgba(255,255,255,.06); }
        .btn.primary { background: var(--accent); border-color: var(--accent); color: var(--ink); font-weight: 600; }
        .btn.primary:hover { filter: brightness(1.05); }
        .btn.quiet { border-color: transparent; color: var(--muted); }
        .list { max-height: min(60vh, 420px); overflow: auto; }
        .item { display: grid; grid-template-columns: 22px 1fr auto; gap: 10px; align-items: start; padding: 10px 14px; border-bottom: 1px solid var(--line); }
        .item:last-child { border-bottom: 0; }
        .item .n { width: 22px; height: 22px; border-radius: 6px; background: rgba(245,181,68,.14); color: var(--accent); font-weight: 600; font-size: 12px; display: grid; place-items: center; }
        .item .note { color: var(--fg); } .muted { color: var(--muted); font-size: 12px; }
        .item .acts { display: inline-flex; gap: 2px; }
        .item .acts button { height: 24px; padding: 0 6px; border-radius: 6px; color: var(--muted); }
        .item .acts button:hover { background: rgba(255,255,255,.07); color: var(--fg); }
        .empty { padding: 18px 14px; color: var(--muted); }
        .dd { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 6px 0 8px; border-radius: 8px; border: 1px solid var(--line); color: var(--muted); transition: border-color .12s, background .12s; }
        .dd .dd-val { color: var(--fg); }
        .dd > svg:last-child { width: 12px; height: 12px; }
        .dd:hover, .dd[aria-expanded="true"] { border-color: var(--line-2); background: rgba(255,255,255,.04); }
        .dd.on { border-color: rgba(245,181,68,.45); background: rgba(245,181,68,.10); color: var(--accent); }
        .dd.on .dd-val { color: var(--accent); }
        .panel { position: fixed; top: var(--kb-h, 40px); right: 0; bottom: 0; width: var(--kb-pw, 300px); overflow: auto; background: var(--panel); border-left: 1px solid var(--line-2); box-shadow: -8px 0 24px rgba(0,0,0,.18); color: var(--fg); font: 400 13px/18px Inter, system-ui, sans-serif; }
        .panel-head { display: flex; align-items: center; justify-content: space-between; padding: 10px 10px 10px 16px; border-bottom: 1px solid var(--line); font-weight: 600; }
        .psec { padding: 14px 16px; border-bottom: 1px solid var(--line); display: grid; gap: 10px; }
        .psec-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
        .ptitle { text-transform: none; letter-spacing: 0; font-size: 12px; font-weight: 500; color: var(--muted); max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .panel .rows, .panel .comp-rows { display: grid; gap: 8px; }
        .panel { overflow-x: hidden; }
        .prow { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; }
        .prow > span { color: var(--muted); }
        .prow .dd { min-width: 150px; justify-content: space-between; }
        .prow .dd .dd-val { flex: 1; text-align: left; }
        .comp-dd { width: 100%; justify-content: space-between; height: 32px; }
        .comp-dd .dd-val { flex: 1; text-align: left; }
        .comp-note { margin-top: -2px; }
        .comp-name { font-weight: 600; color: var(--fg); display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .comp-name button { font-size: 12px; color: var(--muted); padding: 2px 6px; border-radius: 6px; } .comp-name button:hover { background: rgba(255,255,255,.07); color: var(--fg); }
        .ib[aria-pressed="true"].panel-btn { color: var(--fg); background: rgba(255,255,255,.10); }
        .comp-box { position: fixed; pointer-events: none; border: 2px solid var(--accent); border-radius: 6px; box-shadow: 0 0 0 4px rgba(245,181,68,.18); display: none; }
        .comp-box span { position: absolute; top: -22px; left: -2px; background: var(--accent); color: var(--ink); font: 600 11px/18px Inter, system-ui, sans-serif; padding: 0 6px; border-radius: 5px 5px 5px 0; white-space: nowrap; }
        .menu { position: fixed; min-width: 220px; max-width: 300px; padding: 6px; background: var(--panel); border: 1px solid var(--line-2); border-radius: 10px; box-shadow: 0 16px 40px rgba(0,0,0,.45); font: 400 13px/18px Inter, system-ui, sans-serif; color: var(--fg); }
        .menu-head { padding: 6px 8px 8px; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
        .menu-items { display: grid; gap: 2px; }
        .menu [role="option"] { display: grid; grid-template-columns: 18px 1fr; gap: 8px; align-items: start; width: 100%; padding: 7px 8px; border-radius: 7px; text-align: left; white-space: normal; }
        .menu [role="option"]:hover, .menu [role="option"]:focus-visible { background: rgba(255,255,255,.07); outline: none; }
        .menu .check { color: var(--accent); padding-top: 1px; }
        .menu .check svg { width: 16px; height: 16px; }
        .menu .txt { display: grid; gap: 1px; }
        .menu .lbl { color: var(--fg); font-weight: 500; }
        .menu [aria-selected="true"] .lbl { color: var(--accent); }
        .menu .note { color: var(--muted); font-size: 12px; line-height: 16px; }
        .ib[aria-pressed="true"].hl { color: var(--fg); }
        .rows { display: inline-flex; align-items: center; gap: 6px; }
        .info-pop { left: calc(12px + env(safe-area-inset-left, 0px)); right: auto; width: min(340px, calc(100vw - 24px)); }
        .info-body dl { margin: 0; display: grid; grid-template-columns: auto 1fr; gap: 6px 14px; }
        .info-body dt { color: var(--muted); } .info-body dd { margin: 0; word-break: break-word; }
        .chip { font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 999px; background: rgba(245,181,68,.14); color: var(--accent); margin-left: 6px; }
        .toast { position: fixed; top: calc(var(--kb-h, 40px) + 10px); left: 50%; transform: translateX(-50%); background: var(--panel); color: var(--fg); border: 1px solid var(--line-2); padding: 8px 12px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.35); font: 500 12px/16px Inter, system-ui, sans-serif; opacity: 0; transition: opacity .15s; pointer-events: none; }
        .toast.show { opacity: 1; }
        .tip { position: fixed; background: var(--panel); color: var(--fg); border: 1px solid var(--line-2); padding: 6px 10px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,.35); font: 400 12px/16px Inter, system-ui, sans-serif; max-width: 260px; pointer-events: none; opacity: 0; transition: opacity .1s; }
        .tip.show { opacity: 1; }
        .hover-box { position: fixed; pointer-events: none; border: 1.5px solid var(--accent); background: rgba(245,181,68,.08); border-radius: 4px; display: none; z-index: 1; }
        .hover-tag { position: fixed; pointer-events: none; background: var(--panel); color: var(--fg); border: 1px solid var(--line-2); font: 500 11px/16px ui-monospace, 'SF Mono', Menlo, monospace; padding: 3px 8px; border-radius: 6px; display: none; max-width: 420px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; z-index: 1; }
                .sel-layer { position: fixed; inset: 0; pointer-events: none; }
        .sel-box { position: fixed; border: 2px solid var(--accent); background: rgba(245,181,68,.10); border-radius: 4px; }
        .sel-box span { position: absolute; top: -10px; left: -10px; width: 20px; height: 20px; border-radius: 50%; background: var(--accent); color: var(--ink); font: 700 11px/20px Inter, system-ui, sans-serif; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,.3); }
        .note-el { white-space: pre-line; max-height: 96px; overflow: auto; }
        @media (prefers-reduced-motion: reduce) { .toast, .tip, .ib, .seg button, .tgl, .split button { transition: none; } }
      </style>
      <div class="bar" role="toolbar" aria-label="Kamui bar">
        <button type="button" class="ib dev info" hidden aria-label="Ticket info" aria-expanded="false" title="Ticket info">${TICKET_ICON}</button>
        <span class="spacer"></span>
        <span class="proto-tools grp" hidden>
          <button type="button" class="ib hl" aria-pressed="true" title="Outline the part that changes (H)">${ICON.eye}</button>
          <button type="button" class="ib jump" title="Scroll to the part that changes (J)">${ICON.down}</button>
        </span>
        <button type="button" class="ib panel-btn" aria-pressed="false" title="Properties panel">${ICON.panel}</button>
        <span class="dev grp" hidden>
          <span class="split" role="group" aria-label="Picker">
            <button type="button" class="pick" aria-pressed="false" title="Pick an element (P). Shift+click to pick several">${ICON.pick}<span class="pick-label">Pick</span></button>
            <button type="button" class="picks" aria-expanded="false" title="Your picks and notes"><span class="count">0</span>${ICON.chev}</button>
          </span>
        </span>
        <button type="button" class="tb primary link" title="Copy a link to this view">Copy link</button>
        <button type="button" class="ib hide" title="Hide the bar (.)">${ICON.up}</button>
      </div>
      <div class="pill" hidden><button type="button" class="show" aria-label="Show the bar" title="Show the bar (.)">${TICKET_ICON}<span>Show</span></button></div>
      <aside class="panel" hidden aria-label="Properties">
        <header class="panel-head"><span>Properties</span><button type="button" class="ib panel-close" aria-label="Close the panel">${ICON.x}</button></header>
        <section class="psec page-sec" hidden>
          <div class="psec-head"><span>Page</span><span class="ptitle"></span></div>
          <div class="rows"></div>
        </section>
        <section class="psec comp-sec">
          <div class="psec-head"><span>Component</span></div>
          <div class="comp-body"></div>
        </section>
      </aside>
      <div class="menu" hidden role="listbox"><div class="menu-head"></div><div class="menu-items"></div></div>
      <div class="pop info-pop" hidden role="dialog" aria-label="Ticket info">
        <header><span class="info-ticket">Local page</span><button type="button" class="ib info-close" aria-label="Close">${ICON.x}</button></header>
        <div class="body info-body"></div>
      </div>
      <div class="pop note-pop" hidden role="dialog" aria-label="Note for this pick">
        <header><span class="note-title">Picked</span><button type="button" class="ib note-close" aria-label="Cancel this pick" title="Cancel">${ICON.x}</button></header>
        <div class="body">
          <div class="el note-el"></div>
          <div class="muted note-hint">Shift+click to add or remove elements</div>
          <label for="kb-note">Note for Claude (optional)</label>
          <textarea id="kb-note" placeholder="For example: make this grey"></textarea>
          <div class="row"><button type="button" class="btn quiet note-skip">Skip</button><button type="button" class="btn primary note-save">Save note</button></div>
        </div>
      </div>
      <div class="pop list-pop" hidden role="dialog" aria-label="Picks">
        <header><span>Picks</span><span class="grp"><button type="button" class="btn quiet clear">Clear all</button><button type="button" class="ib list-close" aria-label="Close">${ICON.x}</button></span></header>
        <div class="list"></div>
      </div>
      <div class="comp-box"><span></span></div><div class="sel-layer"></div><div class="hover-box"></div><div class="hover-tag"></div>
      <div class="tip" role="tooltip"></div>
      <div class="toast" role="status" aria-live="polite"></div>`;
    bar = $('.bar');
    document.body.classList.add('kb-on');
    if (mode === 'dev') {
      sh.querySelectorAll('.dev').forEach((e) => (e.hidden = false));
      setCount(readPicks().length);
      loadContext();
    } else {
      $('.link').hidden = true; // a shared page runs in a frame whose address viewers can't use
    }
    wire();
    setCollapsed(state.collapsed);
    if (window.ResizeObserver) new ResizeObserver(setBarHeight).observe(bar);
    requestAnimationFrame(setBarHeight);
    setTimeout(setBarHeight, 300);
  }

  function setBarHeight() { document.documentElement.style.setProperty('--kb-h', (state.collapsed ? 0 : bar.offsetHeight) + 'px'); }
  function setCount(n) { const c = $('.count'); c.textContent = n; c.classList.toggle('has', n > 0); }
  function toast(t) { const el = $('.toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1600); }
  function setCollapsed(c) { state.collapsed = c; local.set('collapsed', c ? '1' : '0'); bar.hidden = c; $('.pill').hidden = !c; setBarHeight(); }

  async function loadContext() {
    const body = $('.info-body');
    body.innerHTML = `<dl><dt>Page</dt><dd>${esc(location.host)}</dd></dl>`;
    try {
      const r = await fetch('/kamui-context.json', { cache: 'no-store' });
      if (!r.ok) return;
      const c = await r.json();
      $('.info-ticket').innerHTML = `${esc(c.ticket)}<span class="chip">${esc(c.note || 'local only')}</span>`;
      $('.info').title = c.ticket ? `${c.ticket} · ${c.title || ''}` : 'Ticket info';
      const rows = [['Ticket', c.title], ['Branch', c.branch], ['Folder', c.folder], ['Page', location.host]].filter((x) => x[1]);
      body.innerHTML = `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
    } catch (e) { /* no context file: show the host only */ }
  }

  // ---------- prototype controls ----------
  function writeHash() {
    if (!proto) return;
    const p = [];
    if (state.opt) p.push('opt=' + state.opt);
    if (state.on.size) p.push('tg=' + [...state.on].join(','));
    if (state.viewer) p.push('viewer=' + state.viewer);
    history.replaceState(history.state, '', location.pathname + location.search + (p.length ? '#' + p.join('&') : ''));
  }
  const target = () => (proto && typeof proto.target === 'function' ? proto.target() : null);
  function applyHighlight() {
    const t = target();
    document.querySelectorAll('.kb-hl').forEach((e) => e !== t && e.classList.remove('kb-hl'));
    if (t) t.classList.toggle('kb-hl', state.highlight);
    $('.hl').title = state.highlight ? 'Hide the outline (H)' : 'Outline the part that changes (H)';
    $('.hl').setAttribute('aria-pressed', String(state.highlight));
  }
  function jump() {
    const t = target();
    if (!t) return;
    t.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    t.classList.add('kb-flash');
    setTimeout(() => t.classList.remove('kb-flash'), 1400);
  }
  const current = (key) => {
    if (key === 'comp') return manual() ? String(chosenItem) : selected ? String(live.indexOf(selected)) : '';
    if (key.startsWith('c:')) { const v = selected && comps.get(selected) && comps.get(selected).values(); return v ? String(v[key.slice(2)]) : ''; }
    return key === 'opt' ? state.opt : key === 'vw' ? state.viewer : state.on.has(key.slice(3)) ? key.slice(3) : '';
  };
  function setPill(key, value) {
    const b = $(`.dd[data-menu="${key}"]`);
    if (!b || !menus[key]) return;
    const item = menus[key].items.find((x) => x.id === value) || {};
    b.querySelector('.dd-val').textContent = item.label || '';
    b.classList.toggle('on', key.startsWith('tg:') && !!value);
  }
  function showMenu(key) {
    const b = $(`.dd[data-menu="${key}"]`);
    const m = menus[key];
    if (!b || !m) return;
    hidePops();
    openMenu = key;
    const cur = current(key);
    $('.menu-head').textContent = m.title;
    $('.menu-items').innerHTML = m.items.map((x) => `<button type="button" role="option" data-val="${esc(x.id)}" aria-selected="${x.id === cur}"><span class="check">${x.id === cur ? ICON.check : ''}</span><span class="txt"><span class="lbl">${esc(x.label)}</span>${x.note ? `<span class="note">${esc(x.note)}</span>` : ''}</span></button>`).join('');
    const r = b.getBoundingClientRect();
    const menu = $('.menu');
    menu.style.left = Math.max(8, Math.min(r.left, innerWidth - 300)) + 'px';
    menu.style.top = r.bottom + 6 + 'px';
    menu.hidden = false;
    b.setAttribute('aria-expanded', 'true');
    (menu.querySelector('[aria-selected="true"]') || menu.querySelector('[role="option"]')).focus();
  }
  function hideMenu() {
    if (!openMenu) return;
    const b = $(`.dd[data-menu="${openMenu}"]`);
    if (b) b.setAttribute('aria-expanded', 'false');
    $('.menu').hidden = true;
    openMenu = null;
  }
  function choose(value) {
    const key = openMenu;
    hideMenu();
    if (key === 'opt') select(value);
    else if (key === 'vw') setViewer(value);
    else if (key && key.startsWith('tg:')) setToggle(key.slice(3), value === key.slice(3));
    else if (key === 'comp' && manual()) {
      showChange(Number(value));
    }
    else if (key === 'comp') {
      selected = live[Number(value)] || null;
      if (selected) selected.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      renderComp();
      setTimeout(drawCompBox, 400);
    }
    else if (key && key.startsWith('c:') && selected && comps.get(selected)) {
      comps.get(selected).onChange(key.slice(2), value);
      setTimeout(renderComp, 60); // let the page re-render, then show its new values
    }
  }

  async function showChange(i) {
    const it = manual()[i];
    if (!it) return;
    chosenItem = i;
    selected = null;
    focusEl = null;
    renderComp();
    try { if (it.show) await it.show(); } catch (e) { /* the page changed under us: show what we can */ }
    await new Promise((r) => setTimeout(r, 250));
    const el = it.target ? it.target() : null;
    if (el) {
      // A registered component gets its properties in the panel
      selected = comps.has(el) ? el : null; // properties only when the change is the component itself
      focusEl = el;
      el.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    renderComp();
    setTimeout(drawCompBox, 450);
  }

  // ---------- components: pages register what they are and which properties they have ----------
  // KamuiBar.component(el, { name, props: [{ id, label, options: [{ id, label, note }] }], values: () => ({...}), onChange(id, value) })
  const comps = new Map();
  let selected = null;
  function addComponent(el, spec) {
    comps.set(el, spec);
    if (sh && !$('.panel').hidden) renderComp();
    return {
      refresh() { if (selected === el && sh && !$('.panel').hidden) renderComp(); },
      remove() { comps.delete(el); if (selected === el) { selected = null; drawCompBox(); } if (sh && !$('.panel').hidden) renderComp(); },
    };
  }
  function drawCompBox(el, text) {
    const box = $('.comp-box');
    const target = el || selected || (focusEl && focusEl.isConnected ? focusEl : null);
    if (!target || !target.isConnected) { box.style.display = 'none'; return; }
    const r = target.getBoundingClientRect();
    Object.assign(box.style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const it = manual() && chosenItem >= 0 ? manual()[chosenItem] : null;
    box.querySelector('span').textContent = text || (comps.get(target) || {}).name || (it ? it.label : '');
  }
  function propRows(spec) {
    if (!spec) return '';
    const values = spec.values() || {};
    return `<div class="comp-rows">${(spec.props || []).map((p) => {
      menus['c:' + p.id] = { title: p.label, items: p.options };
      const item = p.options.find((o) => String(o.id) === String(values[p.id])) || {};
      return `<div class="prow"><span>${esc(p.label)}</span><button type="button" class="dd" data-menu="c:${esc(p.id)}" aria-haspopup="listbox" aria-expanded="false"><span class="dd-val">${esc(item.label || '')}</span>${ICON.chev}</button></div>`;
    }).join('')}</div>`;
  }
  let live = []; // registered components on the page, in page order
  // A prototype can list its changes by hand (cfg.items): choosing one sets the page up to show it
  let chosenItem = -1;
  let focusEl = null; // what the chosen change points at, when it isn't a registered component
  const manual = () => (proto && proto.items && proto.items.length ? proto.items : null);
  function renderComp() {
    Object.keys(menus).filter((k) => k.startsWith('c:') || k === 'comp').forEach((k) => delete menus[k]);
    const body = $('.comp-body');
    const items = manual();
    $('.comp-sec .psec-head span').textContent = items ? 'Changes' : 'Component';
    if (items) {
      menus.comp = { title: 'Changes on this ticket', items: items.map((it, i) => ({ id: String(i), label: it.label, note: it.note })) };
      const it = chosenItem >= 0 ? items[chosenItem] : null;
      let html = `<button type="button" class="dd comp-dd" data-menu="comp" aria-haspopup="listbox" aria-expanded="false"><span class="dd-val">${esc(it ? it.label : `Choose a change (${items.length})`)}</span>${ICON.chev}</button>`;
      if (it && it.note) html += `<div class="muted comp-note">${esc(it.note)}</div>`;
      html += propRows(selected && selected.isConnected ? comps.get(selected) : null);
      body.innerHTML = html;
      drawCompBox();
      return;
    }
    live = [...comps.keys()].filter((el) => el.isConnected).sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (selected && !live.includes(selected)) selected = null;
    if (!live.length) { body.innerHTML = '<div class="muted">No components on this page yet.</div>'; drawCompBox(); return; }
    const seen = {};
    menus.comp = {
      title: 'Component',
      items: live.map((el, i) => {
        const sp = comps.get(el);
        seen[sp.name] = (seen[sp.name] || 0) + 1;
        return { id: String(i), label: `${sp.name} ${seen[sp.name]}`, note: sp.label ? sp.label() : '' };
      }),
    };
    const pickedItem = selected ? menus.comp.items[live.indexOf(selected)] : null;
    let html = `<button type="button" class="dd comp-dd" data-menu="comp" aria-haspopup="listbox" aria-expanded="false"><span class="dd-val">${esc(pickedItem ? pickedItem.label : `Choose a component (${live.length})`)}</span>${ICON.chev}</button>`;
    const spec = selected && comps.get(selected);
    if (spec && pickedItem && pickedItem.note) html += `<div class="muted comp-note">${esc(pickedItem.note)}</div>`;
    html += propRows(spec);
    body.innerHTML = html;
    drawCompBox();
  }
  function setPanel(open) {
    $('.panel').hidden = !open;
    $('.panel-btn').setAttribute('aria-pressed', String(open));
    document.documentElement.classList.toggle('kb-panel-open', open);
    local.set('panel', open ? '1' : '0');
    if (open) renderComp(); else { selected = null; drawCompBox(); }
  }
  const redrawComp = () => { if (selected) drawCompBox(); };
  window.addEventListener('scroll', redrawComp, true);
  window.addEventListener('resize', redrawComp);

  // Hovering the controls icon shows the current setup, e.g. "2 · Inline form · Overridden · Onboarding"
  function summarize() {
    if (!proto) return;
    const name = (list, id) => ((list || []).find((x) => x.id === id) || {}).label;
    const parts = [name(proto.options, state.opt), ...(proto.toggles || []).filter((t) => state.on.has(t.id)).map((t) => t.label), name(proto.viewers, state.viewer)].filter(Boolean);
    $('.panel-btn').title = ['Properties panel', proto.title, parts.join(' · ')].filter(Boolean).join('\n');
  }
  function select(id) {
    if (!proto || !(proto.options || []).some((o) => o.id === id)) return;
    state.opt = id; local.set(proto.id + ':opt', id);
    setPill('opt', id);
    if (proto.onSelect) proto.onSelect(id);
    applyHighlight(); writeHash(); summarize();
  }
  function setToggle(id, on) {
    if (on) state.on.add(id); else state.on.delete(id);
    local.set(proto.id + ':tg', [...state.on].join(','));
    setPill('tg:' + id, on ? id : '');
    if (proto.onToggle) proto.onToggle(id, on);
    writeHash(); summarize();
  }
  function setViewer(id) {
    if (!(proto.viewers || []).some((v) => v.id === id)) return;
    state.viewer = id; local.set(proto.id + ':viewer', id);
    setPill('vw', id);
    if (proto.onViewer) proto.onViewer(id);
    writeHash(); summarize();
  }

  function register(cfg) {
    proto = cfg;
    if (!sh) return api;
    const h = fromHash();
    const opts = cfg.options || [], toggles = cfg.toggles || [], viewers = cfg.viewers || [];
    $('.proto-tools').hidden = false;
    $('.page-sec').hidden = false;
    $('.ptitle').textContent = cfg.title || '';
    $('.ptitle').title = cfg.title || '';
    // On the strip: an icon and the selected text, opening a dropdown
    // On the strip: icon + current choice; clicking opens the bar's own menu (title, choices, notes, check)
    Object.keys(menus).filter((k) => !k.startsWith('c:')).forEach((k) => delete menus[k]);
    const dd = (key, title, icon, items) => {
      menus[key] = { title, items };
      return `<div class="prow"><span>${esc(title)}</span><button type="button" class="dd" data-menu="${esc(key)}" aria-haspopup="listbox" aria-expanded="false" title="${esc(title)}">${icon}<span class="dd-val"></span>${ICON.chev}</button></div>`;
    };
    $('.rows').innerHTML = [
      opts.length ? dd('opt', 'Option', ICON.option, opts) : '',
      // One state reads as "Default / Overridden"; several states get an Off / On menu each
      ...toggles.map((t) => toggles.length === 1
        ? dd('tg:' + t.id, 'State', ICON.state, [{ id: '', label: 'Default', note: 'The normal case' }, { id: t.id, label: t.label, note: t.note }])
        : dd('tg:' + t.id, t.label, ICON.state, [{ id: '', label: 'Off' }, { id: t.id, label: 'On', note: t.note }])),
      viewers.length ? dd('vw', 'Viewer', ICON.viewer, viewers) : '',
    ].join('');
    const valid = (list, id) => list.some((x) => x.id === id);
    const opt = valid(opts, h.opt) ? h.opt : valid(opts, local.get(cfg.id + ':opt')) ? local.get(cfg.id + ':opt') : cfg.defaultOption || (opts[0] && opts[0].id);
    const tg = (h.tg !== undefined ? h.tg : local.get(cfg.id + ':tg') || '').split(',').filter((id) => valid(toggles, id));
    const viewer = valid(viewers, h.viewer) ? h.viewer : valid(viewers, local.get(cfg.id + ':viewer')) ? local.get(cfg.id + ':viewer') : cfg.defaultViewer || (viewers[0] && viewers[0].id);
    if (opt) select(opt);
    toggles.forEach((t) => setToggle(t.id, tg.includes(t.id)));
    if (viewer) setViewer(viewer);
    applyHighlight();
    setBarHeight();
    chosenItem = -1;
    if (!$('.panel').hidden) renderComp();
    return api;
  }

  // ---------- picker (dev mode) ----------
  const label = (el) => {
    const t = el.tagName.toLowerCase();
    const id = el.getAttribute('data-testid');
    const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
    return t + (id ? `[${id}]` : '') + cls;
  };
  const cssPath = (el) => {
    const parts = [];
    while (el && el.nodeType === 1 && el !== document.body) {
      const id = el.getAttribute('data-testid');
      if (id) { parts.unshift(`${el.tagName.toLowerCase()}[data-testid="${id}"]`); break; }
      let s = el.tagName.toLowerCase();
      const p = el.parentElement;
      if (p) { const same = [...p.children].filter((c) => c.tagName === el.tagName); if (same.length > 1) s += `:nth-of-type(${same.indexOf(el) + 1})`; }
      parts.unshift(s);
      el = p;
    }
    return parts.join(' > ');
  };
  const reactInfo = (el) => {
    const k = Object.keys(el).find((x) => x.startsWith('__reactFiber'));
    let f = k && el[k];
    const names = [];
    let source = null;
    while (f && names.length < 6) {
      const ty = f.type;
      if (typeof ty === 'function' || (ty && typeof ty === 'object')) {
        const n = ty.displayName || ty.name || (ty.render && (ty.render.displayName || ty.render.name));
        if (n && !names.includes(n)) names.push(n);
      }
      if (!source && f._debugSource) source = f._debugSource.fileName.replace(/^.*?\/(packages|apps)\//, '$1/') + ':' + f._debugSource.lineNumber;
      f = f.return;
    }
    return { components: names, source };
  };
  const fromBar = (e) => e.composedPath().includes(host);
  // Some elements have no box of their own (an empty label inside a button): use the nearest one that does
  const sized = (el) => {
    while (el && el !== document.body) { const r = el.getBoundingClientRect(); if (r.width >= 1 && r.height >= 1) return el; el = el.parentElement; }
    return el;
  };
  // Elements picked for the note that's open: one, or several with Shift+click
  let chosen = [];
  const onMove = (e) => {
    if (fromBar(e)) { $('.hover-box').style.display = $('.hover-tag').style.display = 'none'; return; }
    const el = sized(e.target);
    if (!el || el === document.documentElement || el === document.body) return;
    const r = el.getBoundingClientRect();
    Object.assign($('.hover-box').style, { display: 'block', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    const tag = $('.hover-tag');
    tag.textContent = label(el) + ` · ${Math.round(r.width)}×${Math.round(r.height)}`;
    Object.assign(tag.style, { display: 'block', left: Math.max(4, r.left) + 'px', top: Math.max(4, r.top - 28) + 'px' });
  };
  const block = (e) => { if (fromBar(e)) return; e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
  const nextN = () => { const l = readPicks(); return (l.length ? l[l.length - 1].n : 0) + 1; };
  const describe = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      element: label(el), path: cssPath(el), text: (el.innerText || '').trim().slice(0, 160),
      size: `${Math.round(r.width)}×${Math.round(r.height)} at ${Math.round(r.left)},${Math.round(r.top)}`,
      classes: typeof el.className === 'string' ? el.className : '',
      styles: { padding: cs.padding, margin: cs.margin, color: cs.color, background: cs.backgroundColor, font: `${cs.fontSize}/${cs.lineHeight} ${cs.fontWeight}`, border: cs.border, radius: cs.borderRadius, gap: cs.gap },
      ...reactInfo(el),
    };
  };
  function drawChosen() {
    $('.sel-layer').innerHTML = chosen
      .map((el, i) => { const r = el.getBoundingClientRect(); return `<div class="sel-box" style="left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px"><span>${i + 1}</span></div>`; })
      .join('');
  }
  const redraw = () => { if (chosen.length) drawChosen(); };
  window.addEventListener('scroll', redraw, true);
  window.addEventListener('resize', redraw);
  function openNote(fresh) {
    const one = chosen.length === 1;
    $('.note-title').textContent = one ? `Pick ${nextN()}` : `Pick ${nextN()} · ${chosen.length} elements`;
    $('.note-el').textContent = chosen.map((el, i) => (one ? '' : `${i + 1}. `) + label(el)).join('\n');
    if (fresh) $('#kb-note').value = '';
    if ($('.note-pop').hidden) showPop('.note-pop');
  }
  function commit() {
    const items = chosen.filter((el) => el.isConnected).map(describe);
    if (!items.length) return cancelNote();
    const note = $('#kb-note').value.trim();
    const list = readPicks();
    const base = { n: nextN(), at: new Date().toLocaleTimeString(), url: location.pathname + location.hash };
    const rec = items.length === 1
      ? { ...base, ...items[0], note }
      : { ...base, group: true, count: items.length, element: `${items.length} elements`, path: items[0].path, text: items.map((x) => x.text).join(' | ').slice(0, 160), elements: items, note };
    writePicks(list.concat(rec));
    setCount(list.length + 1);
    chosen = [];
    drawChosen();
    $('#kb-note').blur();
    $('.note-pop').hidden = true;
    if (note) toast('Saved. Tell Claude to read your picks.');
  }
  function cancelNote() { chosen = []; drawChosen(); $('#kb-note').blur(); $('.note-pop').hidden = true; }
  const onClick = (e) => {
    if (fromBar(e)) return;
    block(e);
    const el = sized(e.target);
    if (!el || el === document.body) return;
    $('.hover-box').style.borderColor = OK;
    setTimeout(() => ($('.hover-box').style.borderColor = ''), 300);
    if (e.shiftKey) {
      // Shift+click: add or remove this element; one note covers all of them
      const fresh = !chosen.length;
      const i = chosen.indexOf(el);
      if (i >= 0) chosen.splice(i, 1); else chosen.push(el);
      if (!chosen.length) return cancelNote();
      drawChosen();
      openNote(fresh);
      return;
    }
    // Plain click: a single pick. An earlier single pick still open is kept as it is.
    if (chosen.length === 1 && chosen[0] !== el) commit();
    const fresh = !chosen.length;
    if (!chosen.includes(el)) chosen.push(el);
    drawChosen();
    openNote(fresh);
    $('#kb-note').focus();
  };
  const downs = ['mousedown', 'mouseup', 'pointerdown', 'pointerup'];
  function setPicking(on) {
    state.picking = on;
    $('.pick').setAttribute('aria-pressed', String(on));
    $('.pick-label').textContent = on ? 'Picking · Esc' : 'Pick';
    const fn = on ? 'addEventListener' : 'removeEventListener';
    document[fn]('mousemove', onMove, true);
    document[fn]('click', onClick, true);
    downs.forEach((t) => document[fn](t, block, true));
    if (!on) $('.hover-box').style.display = $('.hover-tag').style.display = 'none';
    session.set('kamuiPickOn', on ? '1' : '0');
  }
  function renderList() {
    const list = readPicks();
    $('.list').innerHTML = list.length
      ? list.slice().reverse().map((p) => `<div class="item"><span class="n">${p.n}</span><div><div class="note">${p.note ? esc(p.note) : '<span class="muted">No note</span>'}</div><div class="muted">${p.group ? esc(p.count + ' elements: ' + p.elements.map((x) => x.element.split('.')[0]).join(', ')) : esc(p.element)}${p.text && !p.group ? ' · “' + esc(p.text.slice(0, 50)) + '”' : ''}</div></div><span class="acts"><button type="button" data-show="${p.n}" title="Scroll to it">Show</button><button type="button" data-del="${p.n}" aria-label="Remove pick ${p.n}" title="Remove">✕</button></span></div>`).join('')
      : '<div class="empty">No picks yet. Press Pick, then click an element. Shift+click picks several.</div>';
  }
  function showPop(sel) { if (sel !== '.note-pop' && chosen.length) cancelNote(); hidePops(); $(sel).hidden = false; }
  function hidePops() { hideMenu(); sh.querySelectorAll('.pop').forEach((p) => (p.hidden = true)); sh.querySelectorAll('[aria-expanded]').forEach((b) => b.setAttribute('aria-expanded', 'false')); }

  // ---------- wiring ----------
  function wire() {
    const tip = $('.tip');
    $('.panel').addEventListener('click', (e) => {
      const b = e.target.closest('.dd');
      if (b) { if (openMenu === b.dataset.menu) hideMenu(); else showMenu(b.dataset.menu); return; }
    });
    $('.panel-btn').onclick = () => setPanel($('.panel').hidden);
    $('.panel-close').onclick = () => setPanel(false);
    $('.menu-items').addEventListener('click', (e) => { const o = e.target.closest('[role="option"]'); if (o) choose(o.dataset.val); });
    document.addEventListener('mousedown', (e) => { if (openMenu && !e.composedPath().some((n) => n.classList && (n.classList.contains('menu') || n.classList.contains('dd')))) hideMenu(); }, true);
    const noteFor = (b) => { if (!proto || !b) return null; const id = b.dataset.id || b.dataset.tg; return ([...(proto.options || []), ...(proto.toggles || [])].find((o) => o.id === id) || {}).note; };
    sh.addEventListener('mouseover', (e) => { const b = e.target.closest('button'); const n = noteFor(b); if (!n) return; tip.textContent = n; const r = b.getBoundingClientRect(); tip.style.left = Math.min(r.left, innerWidth - 280) + 'px'; tip.style.top = r.bottom + 6 + 'px'; tip.classList.add('show'); });
    sh.addEventListener('mouseout', () => tip.classList.remove('show'));

    $('.hl').onclick = () => { state.highlight = !state.highlight; local.set('hl', state.highlight ? '1' : '0'); applyHighlight(); };
    $('.jump').onclick = jump;
    $('.link').onclick = async () => {
      writeHash();
      try { await navigator.clipboard.writeText(location.href); toast('Link copied'); } catch (e) { toast('Copy failed: select the address bar'); }
    };
    $('.info').onclick = () => { const open = $('.info-pop').hidden; if (open) showPop('.info-pop'); else hidePops(); $('.info').setAttribute('aria-expanded', String(open)); };
    $('.info-close').onclick = () => { hidePops(); $('.info').setAttribute('aria-expanded', 'false'); };
    $('.hide').onclick = () => setCollapsed(true);
    $('.show').onclick = () => setCollapsed(false);
    if (mode === 'dev') {
      $('.pick').onclick = () => setPicking(!state.picking);
      $('.picks').onclick = () => { if ($('.list-pop').hidden) { renderList(); showPop('.list-pop'); $('.picks').setAttribute('aria-expanded', 'true'); } else hidePops(); };
      $('.note-save').onclick = commit;
      $('.note-skip').onclick = () => { $('#kb-note').value = ''; commit(); };
      $('.note-close').onclick = cancelNote;
      $('.list-close').onclick = hidePops;
      $('.clear').onclick = () => { writePicks([]); setCount(0); renderList(); toast('Picks cleared'); };
      $('.list').addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.del) {
          const list = readPicks().filter((p) => String(p.n) !== b.dataset.del);
          writePicks(list); setCount(list.length); renderList();
        } else if (b.dataset.show) {
          const p = readPicks().find((x) => String(x.n) === b.dataset.show);
          let el = null; try { el = p && document.querySelector(p.path); } catch (err) { el = null; }
          if (!el) return toast('That element is not on this page now');
          el.scrollIntoView({ block: 'center' }); el.classList.add('kb-flash'); setTimeout(() => el.classList.remove('kb-flash'), 1400);
        }
      });
      if (session.get('kamuiPickOn') === '1') setPicking(true);
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (chosen.length || state.picking || sh.querySelector('.pop:not([hidden])'))) {
        if (chosen.length) cancelNote(); else if (state.picking) setPicking(false);
        hidePops();
        return;
      }
      const t = e.composedPath()[0];
      if (t && t.closest && t.closest('input, textarea, select, [contenteditable]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') { if (chosen.length) cancelNote(); else if (state.picking) setPicking(false); hidePops(); return; }
      if ((e.key === 'p' || e.key === 'P') && mode === 'dev') { setPicking(!state.picking); return; }
      if (e.key === '.') { setCollapsed(!state.collapsed); return; }
      if (!proto) return;
      const opts = proto.options || [];
      const i = opts.findIndex((o) => o.id === state.opt);
      if (e.key === 'ArrowRight' && opts.length) select((opts[i + 1] || opts[0]).id);
      else if (e.key === 'ArrowLeft' && opts.length) select((opts[i - 1] || opts[opts.length - 1]).id);
      else if (e.key === 'h' || e.key === 'H') $('.hl').click();
      else if (e.key === 'j' || e.key === 'J') jump();
    });
  }

  // ---------- start ----------
  function boot(opts) {
    if (mode) return api;
    const m = (opts && opts.mode) || 'dev';
    if (m === 'dev' && !LOCAL) return api;
    mode = m;
    addPageCss();
    build();
    const queued = window.KamuiBarQueue || [];
    if (proto) register(proto);
    else if (queued.length) register(queued[queued.length - 1]);
    window.KamuiBarQueue = { push: (cfg) => register(cfg) };
    if (local.get('panel') === '1') setPanel(true);
    window.dispatchEvent(new Event('kamuibar:ready'));
    return api;
  }

  const api = {
    __ready: true,
    boot,
    register: (cfg) => (sh ? register(cfg) : ((proto = cfg), api)),
    component: (el, spec) => addComponent(el, spec),
    set: (o) => { if (!proto) return; if (o.opt) select(o.opt); if (o.viewer) setViewer(o.viewer); if (o.on) Object.keys(o.on).forEach((id) => setToggle(id, !!o.on[id])); },
    picks: readPicks,
    clearPicks: () => writePicks([]),
    get state() { return { mode, opt: state.opt, on: [...state.on], viewer: state.viewer, picking: state.picking }; },
  };
  window.KamuiBar = api;

  const auto = () => boot({ mode: window.KAMUI_BAR_MODE === 'shared' ? 'shared' : 'dev' });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
  else auto();
})();
