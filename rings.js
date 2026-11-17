// Ring vortex backgrounds: concentric rings of different widths, each lit by a sweep of gradient that is
// turned a little more on every ring, so the highlights spiral. Same idea as the Brandstar-style reference.
// Use in a design: <canvas class="abs rings" data-rings="vortex" width="1080" height="1350"></canvas>
(function () {
  const C = { navy: '#050e3d', rezen: '#4967fd', light: '#ddebff', white: '#ffffff', onyx: '#1d1d1d' };
  const col = c => C[c] || c;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rgba = (hex, a) => { const h = col(hex).slice(1); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; };

  function render(canvas, p) {
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d'), rand = rng(p.seed || 3);
    ctx.fillStyle = col(p.base); ctx.fillRect(0, 0, W, H);
    // soft glow behind the rings
    if (p.glow) { const g = ctx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, p.glow.r);
      g.addColorStop(0, rgba(p.glow.color, p.glow.a)); g.addColorStop(1, rgba(p.glow.color, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    let r = p.r0;
    ctx.filter = `blur(${p.blur ?? 1.5}px)`;
    for (let i = 0; i < p.count; i++) {
      const t = p.wMin + rand() * (p.wMax - p.wMin);
      const cx = p.cx + i * (p.dx || 0), cy = p.cy + i * (p.dy || 0);
      const start = ((p.start || 0) + i * (p.twist || 0) + (rand() - .5) * (p.jitter || 0)) * Math.PI / 180;
      const g = ctx.createConicGradient(start, cx, cy);
      const set = p.sweeps[i % p.sweeps.length];       // e.g. ['rezen','light','white'] lit band
      const w = p.width ?? .4, fade = p.fade ?? .5;     // share of the turn that is lit, and how soft it fades
      g.addColorStop(0, rgba(p.base, 0));
      g.addColorStop(w * fade, rgba(set[0], .9));
      g.addColorStop(w * .75, rgba(set[1], 1));
      g.addColorStop(w, rgba(set[2] || set[1], 1));
      g.addColorStop(Math.min(.999, w + .02), rgba(p.base, 0));
      g.addColorStop(1, rgba(p.base, 0));
      ctx.strokeStyle = g; ctx.lineWidth = t;
      ctx.beginPath(); ctx.arc(cx, cy, r + t / 2, 0, Math.PI * 2); ctx.stroke();
      // a faint full ring underneath so the rings read as rings even where unlit
      if (p.ghost) { ctx.strokeStyle = rgba(p.ghost, p.ghostA ?? .12); ctx.beginPath(); ctx.arc(cx, cy, r + t / 2, 0, Math.PI * 2); ctx.stroke(); }
      r += t + (p.gap || 0);
    }
    ctx.filter = 'none';
  }

  // Smooth bands (rebuilt R1): every ring carries one wide gradient band that fades in and out softly;
  // the band turns a little on each ring so the light spirals inward.
  function renderBands(canvas, p) {
    const W = canvas.width, H = canvas.height, ctx = canvas.getContext('2d'), rand = rng(p.seed || 3);
    ctx.fillStyle = col(p.base); ctx.fillRect(0, 0, W, H);
    let r = p.r0;
    for (let i = 0; i < p.count; i++) {
      const t = p.widths ? p.widths[i % p.widths.length] : p.wMin + rand() * (p.wMax - p.wMin);
      const cx = p.cx + i * (p.dx || 0), cy = p.cy + i * (p.dy || 0);
      const span = p.span[i % p.span.length], set = p.sweeps[i % p.sweeps.length];
      const mid = ((p.start || 0) + i * (p.twist || 0)) * Math.PI / 180;
      const g = ctx.createConicGradient(mid - span * Math.PI, cx, cy);
      g.addColorStop(0, rgba(p.base, 0));
      g.addColorStop(span * .28, rgba(set[0], .9));
      g.addColorStop(span * .55, rgba(set[1], 1));
      g.addColorStop(span * .78, rgba(set[2], 1));
      g.addColorStop(span, rgba(p.base, 0));
      g.addColorStop(1, rgba(p.base, 0));
      ctx.filter = `blur(${p.blur ?? 2}px)`;
      if (p.under) { ctx.strokeStyle = rgba(p.under, (i % 2 ? .10 : .05)); ctx.lineWidth = t; ctx.beginPath(); ctx.arc(cx, cy, r + t / 2, 0, Math.PI * 2); ctx.stroke(); }
      ctx.strokeStyle = g; ctx.lineWidth = t; ctx.beginPath(); ctx.arc(cx, cy, r + t / 2, 0, Math.PI * 2); ctx.stroke();
      r += t + (p.gap || 0);
    }
    ctx.filter = 'none';
  }

  const P = {
    // R1 rebuilt: ReZen field, 10 wide rings, light-to-white bands spiralling, plain eye for the title or photo
    'vortex2': { mode: 'bands', base: 'rezen', cx: 560, cy: 690, r0: 300, count: 10, gap: 10, twist: 18, start: -115, dx: 5, dy: -4, blur: 2.5, under: 'navy',
                 widths: [40, 56, 34, 74, 46, 82, 52, 66, 90, 60],
                 span: [.34, .42, .30, .46, .38, .5, .36, .44, .52, .40],
                 sweeps: [['rezen', 'light', 'white'], ['light', 'white', 'light'], ['rezen', 'light', 'light'], ['navy', 'rezen', 'light'], ['rezen', 'white', 'light']] },
    // R1 · Vortex: ReZen field, rings lit light-to-white, centred hole for the title or the photo
    'vortex':  { base: 'rezen', seed: 5, cx: 540, cy: 640, r0: 230, count: 12, wMin: 16, wMax: 42, gap: 4, twist: 26, start: 150, jitter: 70,
                 width: .58, fade: .3, dx: 3, dy: -2, ghost: 'navy', ghostA: .10, glow: { color: 'navy', a: .25, r: 520 },
                 sweeps: [['rezen', 'light', 'white'], ['rezen', 'white', 'light'], ['navy', 'rezen', 'light']] },
    // R2 · Navy deep: navy field, vortex pushed off to the lower right
    'deep':    { base: 'navy', seed: 9, cx: 800, cy: 1020, r0: 150, count: 13, wMin: 14, wMax: 40, gap: 5, twist: 24, start: 200, jitter: 60,
                 width: .55, fade: .3, dx: -4, dy: -3, ghost: 'rezen', ghostA: .14,
                 sweeps: [['navy', 'rezen', 'light'], ['rezen', 'light', 'white'], ['navy', 'rezen', 'rezen']] },
    // R3 · Light: pale field, rings in ReZen and navy
    'daylight': { base: 'light', seed: 13, cx: 540, cy: 660, r0: 210, count: 11, wMin: 14, wMax: 40, gap: 4, twist: -28, start: 30, jitter: 70,
                 width: .55, fade: .3, dx: -3, dy: 2, ghost: 'rezen', ghostA: .10,
                 sweeps: [['light', 'rezen', 'navy'], ['light', 'white', 'rezen'], ['rezen', 'navy', 'navy']] },
    // R4 · Rise: vortex centred below the bottom edge, rings rising like a sunrise
    'rise':    { base: 'rezen', seed: 21, cx: 540, cy: 1460, r0: 230, count: 15, wMin: 18, wMax: 44, gap: 4, twist: 30, start: 200, jitter: 80,
                 width: .62, fade: .25, ghost: 'navy', ghostA: .12, glow: { color: 'light', a: .25, r: 700 },
                 sweeps: [['rezen', 'light', 'white'], ['navy', 'rezen', 'light'], ['rezen', 'white', 'white']] },
  };

  window.Rings = { presets: P,
    renderAll(root) { root.querySelectorAll('canvas[data-rings]').forEach(c => { const p = P[c.dataset.rings]; if (p) (p.mode === 'bands' ? renderBands : render)(c, p); }); } };
})();
