// Year in Review: live motion. Every frame, each cover on screen updates its shapes: petals stretch,
// blobs morph, scallops ripple, notches breathe. CSS (motion.css) only does the opening entrance.
// Skips everything for reduced-motion viewers; pauses by itself when the tab is hidden (requestAnimationFrame).
(function () {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = Math.sin, C = Math.cos, TAU = Math.PI * 2;

  // Smooth closed path through points (Catmull-Rom to cubic Bezier)
  function smooth(pts) {
    const n = pts.length; let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d + 'Z';
  }
  // Soft blob shape for a div: border-radius that keeps changing
  const blobRadius = (t, k) => {
    const v = i => (50 + 18 * S(t * (0.5 + i * 0.13) + k * 1.7 + i * 2.1)).toFixed(1) + '%';
    return `${v(0)} ${v(1)} ${v(2)} ${v(3)} / ${v(4)} ${v(5)} ${v(6)} ${v(7)}`;
  };
  const drift = (el, t, k, ax, ay) => {
    el.style.transform = `translate(${(ax * S(t * 0.31 + k)).toFixed(1)}px, ${(ay * C(t * 0.27 + k * 1.3)).toFixed(1)}px) scale(${(1 + 0.12 * S(t * 0.4 + k)).toFixed(3)})`;
    el.style.borderRadius = blobRadius(t, k);
  };

  const A = {
    // N1: one soft accent shape that keeps reshaping behind the number
    'c-n1'(s, t) {
      const p = s.querySelector('.nb'); if (!p) return;
      const cov = s.classList.contains('nc'), photo = s.classList.contains('np');
      const cx = cov ? 540 : photo ? 780 : 800, cy = cov ? 880 : photo ? 800 : 900, R = cov ? 360 : photo ? 340 : 250, n = 8, pts = [];
      for (let k = 0; k < n; k++) { const a = k / n * TAU, r = R * (1 + .12 * S(t * .55 + k * 1.9) + .05 * S(t * 1.1 + k * .7));
        pts.push([cx + C(a) * r * 1.08, cy + S(a) * r]); }
      p.setAttribute('d', smooth(pts));
    },
    // Z1: the orb breathes and drifts, the light ring turns, blobs wander, glass pills float, the blurred figure sways
    'c-z'(s, t) {
      // cobalt mesh: soft colour points that keep drifting; light paper shows through the gaps
      const m = s.querySelector('.zmesh');
      if (m) {
        const cov = s.classList.contains('zc'), sw = s.classList.contains('swap'), P = (x, y, ax, ay, sp, ph) => `${(x + ax * S(t * sp + ph)).toFixed(1)}% ${(y + ay * C(t * sp * .8 + ph)).toFixed(1)}%`;
        m.style.background = [
          `radial-gradient(48% 38% at ${P(28, cov ? 62 : 30, 14, 10, .16, 0)}, #1c34c8 0%, rgba(28,52,200,0) 100%)`,
          `radial-gradient(42% 34% at ${P(78, cov ? 48 : 22, 12, 12, .19, 1.7)}, #3a5cf0 0%, rgba(58,92,240,0) 100%)`,
          `radial-gradient(40% 30% at ${P(60, cov ? 88 : 46, 16, 8, .14, 3.1)}, #0e1f9e 0%, rgba(14,31,158,0) 100%)`,
          `radial-gradient(36% 28% at ${P(18, cov ? 92 : 12, 10, 10, .21, 4.4)}, #8ea4ff 0%, rgba(142,164,255,0) 100%)`,
          `radial-gradient(34% 26% at ${P(88, cov ? 18 : 8, 10, 8, .18, 5.2)}, #c9d4ff 0%, rgba(201,212,255,0) 100%)`,
          sw ? `linear-gradient(180deg, #0a1a8a 0%, #1c34c8 100%)` : `linear-gradient(180deg, #efefec 0%, #e4e8f6 100%)`].join(',');
      }
      const o = s.querySelector('.zorb'); if (o) o.style.transform = `translate(${(24 * S(t * .4)).toFixed(1)}px, ${(18 * C(t * .35)).toFixed(1)}px) scale(${(1 + .07 * S(t * .6)).toFixed(3)})`;
      const r = s.querySelector('.zring'); if (r) r.style.transform = `rotate(${(t * 8) % 360}deg) scale(${(1 + .05 * S(t * .5 + 1)).toFixed(3)}, ${(1 - .05 * S(t * .5 + 1)).toFixed(3)})`;
      s.querySelectorAll('.zb').forEach((b, k) => { b.style.transform = `translate(${(40 * S(t * .3 + k * 2)).toFixed(1)}px, ${(26 * C(t * .4 + k)).toFixed(1)}px)`; });
      s.querySelectorAll('.zglass').forEach((g, k) => { g.style.transform = `translateY(${(8 * S(t * 1.1 + k * 1.3)).toFixed(1)}px)`; });
      const b = s.querySelector('.zblob'); if (b) b.style.transform = `translate(${(30 * S(t * .35)).toFixed(1)}px, ${(20 * C(t * .3)).toFixed(1)}px) scale(${(1 + .08 * S(t * .5)).toFixed(3)})`;
      const f = s.querySelector('.zfig'); if (f) f.style.translate = `${(10 * S(t * .5)).toFixed(1)}px 0`;
      const fi = s.querySelector('.zfull img'); if (fi) fi.style.transform = `translate(${(14 * S(t * .4)).toFixed(1)}px, ${(10 * C(t * .35)).toFixed(1)}px)`;
      const art = s.querySelector('.zart, .zhand'); if (art) art.style.translate = `0 ${(10 * S(t * .9)).toFixed(1)}px`;
      const gl = s.querySelector('.zglow'); if (gl) gl.style.scale = (1 + .08 * S(t * .6)).toFixed(3);
    },
    // P1: eight petals, each stretching and swelling on its own rhythm; the flower turns slowly
    'c-p2'(s, t) {
      // shimmer: a few streaks of the iridescent gradient run along random single grid lines, then pick a new line
      const grid = s.querySelector('.grid');
      if (grid && !still) {
        if (!grid._streaks) grid._streaks = Array.from({ length: 5 }, (_, k) => { const e = document.createElement('i'); grid.appendChild(e); return { e, end: 0 }; });
        grid._streaks.forEach((st, k) => {
          if (t > st.end) {                        // start a new run on a random line
            st.dir = Math.random() < .5 ? 'h' : 'v';
            st.line = 90 * (1 + Math.floor(Math.random() * (st.dir === 'h' ? Math.floor((s.offsetHeight || 1350) / 90) - 1 : 11)));
            st.dur = 2.2 + Math.random() * 2.2; st.t0 = t + Math.random() * 1.5; st.end = st.t0 + st.dur;
            st.rev = Math.random() < .5; st.e.className = 'streak ' + st.dir; st.e.style.opacity = 0;
          }
          const u = (t - st.t0) / st.dur; if (u < 0) return;
          const len = st.dir === 'h' ? 1080 : (s.offsetHeight || 1350), p = (st.rev ? 1 - u : u) * (len + 360) - 360;
          st.e.style.opacity = Math.sin(Math.min(1, u) * Math.PI).toFixed(2);
          st.e.style.transform = st.dir === 'h' ? `translate(${p.toFixed(0)}px, ${st.line}px)` : `translate(${st.line}px, ${p.toFixed(0)}px)`;
        });
      }
      const ir = s.querySelector('.ir'); if (ir) ir.style.transform = `translateY(${(14 * S(t * 1.0)).toFixed(1)}px) rotate(${(2 * S(t * 0.6)).toFixed(2)}deg)`;
      const g = s.querySelector('.petals'); if (!g) return;
      const c = (g.dataset.c || '560 760'); g.setAttribute('transform', `translate(${c}) rotate(${(8 + t * 2.5) % 360})`);
      g.querySelectorAll('.petal').forEach((p, i) => {
        const inner = !!s.closest('.ip1') || s.classList.contains('ip1'); const L0 = inner ? 430 : 610, W0 = inner ? 200 : 230;
        const len = L0 + 28 * S(t * 0.6 + i * 0.8), w = W0 + 14 * S(t * 0.8 + i * 1.9);   // gentle, so the type stays calm
        p.setAttribute('x', (-w / 2).toFixed(1)); p.setAttribute('y', (-len).toFixed(1));
        p.setAttribute('width', w.toFixed(1)); p.setAttribute('height', len.toFixed(1)); p.setAttribute('rx', (w / 2).toFixed(1));
      });
      s.querySelectorAll('.sq').forEach((q, i) => { q.style.transform = `rotate(${(t * 30 + i * 40) % 360}deg)`; });
    },
    // G1: the colour glows wander and change shape
    'c-g'(s, t) {
      // living mesh: each colour point drifts on its own slow orbit
      const P = (x, y, ax, ay, sp, ph) => `${(x + ax * S(t * sp + ph)).toFixed(1)}% ${(y + ay * C(t * sp * 0.8 + ph)).toFixed(1)}%`;
      // REMAX slides (.rx): the same drift in REMAX Brand Colors (Primary Blue, Sky Blue, Primary Red) on Cream
      if (s.classList.contains('rx')) {
        s.style.background = s.classList.contains('swap') ? '#000E35' : `radial-gradient(60% 45% at ${P(8, 10, 10, 8, .21, 0)}, rgba(0,67,255,.55) 0%, rgba(0,67,255,0) 100%),
          radial-gradient(55% 40% at ${P(92, 6, 8, 10, .17, 1.3)}, rgba(163,212,242,.9) 0%, rgba(163,212,242,0) 100%),
          radial-gradient(60% 45% at ${P(85, 48, 10, 12, .19, 2.1)}, rgba(255,18,0,.45) 0%, rgba(255,18,0,0) 100%),
          radial-gradient(55% 45% at ${P(12, 55, 12, 10, .15, 3.4)}, rgba(163,212,242,.8) 0%, rgba(163,212,242,0) 100%),
          radial-gradient(70% 45% at ${P(20, 98, 14, 6, .18, 4.2)}, rgba(255,18,0,.35) 0%, rgba(255,18,0,0) 100%),
          radial-gradient(60% 40% at ${P(95, 100, 10, 6, .2, 5.1)}, rgba(0,67,255,.4) 0%, rgba(0,67,255,0) 100%),
          linear-gradient(${(160 + 20 * S(t * .1)).toFixed(1)}deg, #F7F5EE 0%, #ffffff 55%, #F7F5EE 100%)`;
        s.querySelectorAll('.glow').forEach((el, i) => drift(el, t, i * 1.4, 120, 90));
        const gi = s.querySelector('.g-ill'); if (gi) gi.style.translate = `0 ${(14 * S(t * 1.0)).toFixed(1)}px`;
        return;
      }
      s.style.background = `radial-gradient(60% 45% at ${P(8, 10, 10, 8, .21, 0)}, #8f7dff 0%, rgba(143,125,255,0) 100%),
        radial-gradient(55% 40% at ${P(92, 6, 8, 10, .17, 1.3)}, #f4b8ff 0%, rgba(244,184,255,0) 100%),
        radial-gradient(60% 45% at ${P(85, 48, 10, 12, .19, 2.1)}, #ff9fb6 0%, rgba(255,159,182,0) 100%),
        radial-gradient(55% 45% at ${P(12, 55, 12, 10, .15, 3.4)}, #b9c4ff 0%, rgba(185,196,255,0) 100%),
        radial-gradient(70% 45% at ${P(20, 98, 14, 6, .18, 4.2)}, #ffd36e 0%, rgba(255,211,110,0) 100%),
        radial-gradient(60% 40% at ${P(95, 100, 10, 6, .2, 5.1)}, #ff8f73 0%, rgba(255,143,115,0) 100%),
        ${s.classList.contains('swap') ? `linear-gradient(${(160 + 20 * S(t * .1)).toFixed(1)}deg, #120c33 0%, #1d0f2e 55%, #26120f 100%)` : `linear-gradient(${(160 + 20 * S(t * .1)).toFixed(1)}deg, #e9e2ff 0%, #ffe6f0 55%, #ffe9cf 100%)`}`;
      // pattern-break pages: the colours swap. Black ground; the glow colours move into the big number and the pill (slides.css)
      if (s.classList.contains('swap')) {
        s.style.background = '#0b0b12';
      }
      s.querySelectorAll('.glow').forEach((el, i) => drift(el, t, i * 1.4, 120, 90));
      const gi = s.querySelector('.g-ill'); if (gi) gi.style.translate = `0 ${(14 * S(t * 1.0)).toFixed(1)}px`;
    },
    // V4: lime extrusion deepens and eases back, sparkle spins and pulses (scalloped edge stays still)
    'c-w'(s, t) {
      // circle bites stay still: moving them separately opened gaps in the scalloped edge (Laxman, 6 Nov)
      s.querySelectorAll('.ring').forEach((r, i) => { r.style.transform = `scale(${(1 + 0.05 * S(t * 0.5 + i)).toFixed(3)})`; });
      const sp = s.querySelector('.spark'); if (sp) sp.style.transform = `rotate(${(t * 40) % 360}deg) scale(${(1 + 0.25 * S(t * 2.2)).toFixed(3)})`;
      const num = s.querySelector('.num:not(.echo)');
      if (num) { const d = 14 + 10 * (0.5 + 0.5 * S(t * 1.3)), sh = []; for (let k = 2; k <= d; k += 2) sh.push(`${k}px ${k}px 0 var(--lime)`); num.style.textShadow = sh.join(','); }
      const echo = s.querySelector('.num.echo'); if (echo) echo.style.transform = `translate(${(8 * S(t * 0.9)).toFixed(1)}px, ${(10 * C(t * 0.9)).toFixed(1)}px)`;
      const st = s.querySelector('.sticker'); if (st) st.style.rotate = `${(2 * S(t * 1.1)).toFixed(2)}deg`;
      // illustrations float gently; their glow breathes
      s.querySelectorAll('.ill').forEach((e, k) => { e.style.translate = `0 ${(14 * S(t * 1.0 + k)).toFixed(1)}px`; });
      s.querySelectorAll('.illglow').forEach(e => { e.style.scale = (1 + 0.06 * S(t * 0.8)).toFixed(3); });
      // scenes: bob, key swing, pin bounce with ripples, calendar days pulse, coins and bills settle, agents bob
      const g = s.querySelector('.scene');
      if (g) {
        g.querySelectorAll('.bob').forEach(b => b.setAttribute('transform', `translate(0 ${(12 * S(t * 1.1)).toFixed(1)})`));
        const key = g.querySelector('.swing'); if (key) key.setAttribute('transform', `rotate(${(14 * S(t * 1.5)).toFixed(1)} 120 120)`);
        const sun = g.querySelector('.sun'); if (sun) sun.setAttribute('r', (70 + 8 * S(t * 0.9)).toFixed(1));
        const pin = g.querySelector('.pin'); if (pin) pin.setAttribute('transform', `translate(0 ${(-34 * Math.abs(S(t * 2))).toFixed(1)})`);
        g.querySelectorAll('.rip').forEach((r, k) => { const ph = ((t * 0.6 + k * 0.5) % 1); r.setAttribute('r', (40 + ph * 200).toFixed(1)); r.setAttribute('opacity', (1 - ph).toFixed(2)); });
        g.querySelectorAll('.day').forEach((d, k) => d.setAttribute('opacity', (0.5 + 0.5 * (0.5 + 0.5 * S(t * 2 - k * 0.7))).toFixed(2)));
        g.querySelectorAll('.bill').forEach((b, k) => { b.style.translate = `0 ${(10 * S(t * 1.2 + k)).toFixed(1)}px`; });
        g.querySelectorAll('.coin').forEach((c, k) => { c.style.translate = `0 ${(-6 * Math.max(0, S(t * 2.4 - k * 0.35))).toFixed(1)}px`; });
        g.querySelectorAll('.agent').forEach((a, k) => { a.style.translate = `0 ${(10 * S(t * 1.3 + k * 0.9)).toFixed(1)}px`; });
        const bd = g.querySelector('.badge'); if (bd) { bd.style.transformOrigin = '140px 110px'; bd.style.scale = (1 + 0.12 * S(t * 2.4)).toFixed(3); }
      }
    },
    // V6: a true morphing blob behind her, glows drifting, the vertical year floating
    'c-f'(s, t) {
      const p = s.querySelector('.bp');
      if (p) {
        const n = 9, pts = [];
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU, r = 1 + 0.16 * S(t * 0.7 + i * 1.9) + 0.08 * S(t * 1.3 + i * 0.7);
          pts.push([690 + C(a) * 470 * r, 690 + S(a) * 720 * r]);
        }
        p.setAttribute('d', smooth(pts));
      }
      s.querySelectorAll('.glow').forEach((el, i) => drift(el, t, i * 2.1, 140, 110));
      const v = s.querySelector('.vword'); if (v) v.style.translate = `0 ${(30 * S(t * 0.6)).toFixed(1)}px`;
    },
    // V7: notches and corners breathe; the type moves with them
    'c-n'(s, t) {
      const pn = s.querySelector('.panel'); if (!pn) return;
      const nx = 400 + 26 * S(t * 0.8), ny = 260 + 22 * S(t * 0.8 + 1.2), cw = 170 + 16 * S(t * 0.9 + 2), r = 36 + 22 * S(t * 1.1);
      const top = 650 + 20 * S(t * 0.7 + .5), mid = 1050 + 16 * S(t * 0.75 + 2.4), W = 1000, H = 1270;
      const q = (x1, y1, x2, y2, x3, y3) => `L${x1},${y1} Q${x2},${y2} ${x3},${y3} `;
      const d = `M${r},0 ` + q(nx - r, 0, nx, 0, nx, r) + q(nx, ny - r, nx, ny, nx + r, ny) + q(W - r, ny, W, ny, W, ny + r)
        + q(W, H - r, W, H, W - r, H) + q(nx + r, H, nx, H, nx, H - r) + q(nx, mid + r, nx, mid, nx - r, mid)
        + q(cw + r, mid, cw, mid, cw, mid - r) + q(cw, top + r, cw, top, cw - r, top) + q(r, top, 0, top, 0, top - r) + q(0, r, 0, 0, r, 0) + 'Z';
      pn.style.clipPath = `path('${d}')`;
      const tr = s.querySelector('.tr'); if (tr) tr.style.translate = `${((nx - 400) * 0.6).toFixed(1)}px ${((ny - 260) * 0.5).toFixed(1)}px`;
      s.querySelectorAll('.st').forEach((e, i) => { e.style.translate = `${((cw - 170) * 0.5).toFixed(1)}px ${((i === 2 ? mid - 1050 : top - 650) * 0.6).toFixed(1)}px`; });
    },

    // V8: a lavender cloud and a thick diagonal ribbon keep flowing and reshaping behind the tall 2026; sparkles spin
    x8(s, t) {
      const cl = s.querySelector('.cloud8');
      if (cl) { const n = 12, pts = [];
        for (let i = 0; i < n; i++) { const a = i / n * TAU, r = 1 + 0.16 * S(t * 0.5 + i * 2.3) + 0.07 * S(t * 1.1 + i * 1.3);
          pts.push([250 + C(a) * 470 * r, 130 + S(a) * 270 * r]); }
        cl.setAttribute('d', smooth(pts)); }
      const rb = s.querySelector('.ribbon8');
      if (rb) { const n = 7, top = [], bot = [], x0 = -160, y0 = 840, x1 = 1240, y1 = 230, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
        for (let i = 0; i < n; i++) { const u = i / (n - 1), w = 40 * S(t * 0.8 + i * 1.1), th = 150 + 40 * S(t * 0.6 + i * 0.9);
          const cx = x0 + dx * u + nx * w, cy = y0 + dy * u + ny * w;
          top.push([cx + nx * th, cy + ny * th]); bot.unshift([cx - nx * th, cy - ny * th]); }
        rb.setAttribute('d', smooth(top.concat(bot))); }
      const d2 = s.querySelector('.d2'); if (d2) d2.style.transform = `scale(.72, ${(1.55 + 0.08 * S(t * 0.9)).toFixed(3)})`;
      const d4 = s.querySelector('.d4'); if (d4) d4.style.transform = `scale(.72, ${(1.25 + 0.06 * S(t * 0.9 + 2)).toFixed(3)})`;
      s.querySelectorAll('.spark').forEach((e, i) => { e.style.transform = `rotate(${(t * 35 + i * 60) % 360}deg) scale(${(1 + 0.25 * S(t * 2 + i)).toFixed(3)})`; });
    },
    // V9: the gradient 0 twists, stretches and shifts colour
    x9(s, t) {
      const ring = s.querySelector('.ring9'), r = s.querySelector('.r9');
      if (ring) ring.style.transform = `rotate(${(-38 + 14 * S(t * 0.7)).toFixed(2)}deg)`;
      if (r) { const h = 560 + 70 * S(t * 1.1), w = 330 + 40 * S(t * 0.8 + 1);
        r.setAttribute('height', h.toFixed(1)); r.setAttribute('y', (-h / 2).toFixed(1)); r.setAttribute('width', w.toFixed(1)); r.setAttribute('x', (-w / 2).toFixed(1)); r.setAttribute('rx', (w / 2).toFixed(1)); }
      const a = s.querySelector('.g9a'), b = s.querySelector('.g9b'), hue = 250 + 30 * S(t * 0.5);
      if (a) a.setAttribute('stop-color', `hsl(${hue.toFixed(0)} 65% 54%)`); if (b) b.setAttribute('stop-color', `hsl(${(hue + 60).toFixed(0)} 100% 84%)`);
    },
    // V10: the circle breathes and drifts; the green 26 slides against it
    x10(s, t) {
      const c = s.querySelector('.circ'); if (c) c.style.transform = `translate(${(18 * S(t * 0.6)).toFixed(1)}px, ${(12 * C(t * 0.5)).toFixed(1)}px) scale(${(1 + 0.06 * S(t * 0.9)).toFixed(3)})`;
      const d = s.querySelector('.d34'); if (d) d.style.transform = `translateX(${(26 * S(t * 0.7 + 1)).toFixed(1)}px)`;
      const one = s.querySelector('.d1'); if (one) one.style.transform = `translateY(${(10 * S(t * 0.8)).toFixed(1)}px)`;
    },
    // V11: the isometric 2026 sways in 3D and the extrusion rises and settles
    x11(s, t) {
      const pl = s.querySelector('.plane'); if (pl) pl.style.transform = `rotateX(${(56 + 5 * S(t * 0.5)).toFixed(2)}deg) rotateZ(${(-45 + 10 * S(t * 0.35)).toFixed(2)}deg)`;
      const depth = 6 + 2 * S(t * 0.9);
      s.querySelectorAll('.lay').forEach((l, i) => { l.style.transform = `translateZ(${(i * depth).toFixed(1)}px)`; });
    },
    // V12: the box flaps open and close, the agent (or 2026) rises and bobs, paper planes drift
    x12(s, t) {
      const flap = (sel, h1, h2, out, ph) => { const p = s.querySelector(sel); if (!p) return; const L = 250, k = 0.75 + 0.25 * S(t * 1.6 + ph), u = 0.3 + 0.22 * S(t * 1.6 + ph);
        const ox = out[0] * L * k, oy = out[1] * L * k - L * u;
        p.setAttribute('points', `${h1[0]},${h1[1]} ${h2[0]},${h2[1]} ${(h2[0] + ox).toFixed(1)},${(h2[1] + oy).toFixed(1)} ${(h1[0] + ox).toFixed(1)},${(h1[1] + oy).toFixed(1)}`); };
      flap('.fl-bl', [60, 1060], [540, 920], [-0.28, -0.7], 0); flap('.fl-br', [540, 920], [1020, 1060], [0.28, -0.7], 1.3);
      flap('.fl-fl', [60, 1060], [540, 1200], [-0.95, 0.05], 2.1); flap('.fl-fr', [540, 1200], [1020, 1060], [0.95, 0.05], 3.0);
      const r = s.querySelector('.riser'); if (r) r.style.transform = `translateY(${(24 * S(t * 1.2)).toFixed(1)}px)`;
      const ry = s.querySelector('.riser-y'); if (ry) ry.style.transform = `translateY(${(24 * S(t * 1.2)).toFixed(1)}px)`;
      const p1 = s.querySelector('.pl1'), p2 = s.querySelector('.pl2');
      if (p1) p1.style.translate = `${(30 * S(t * 0.8)).toFixed(1)}px ${(20 * C(t * 1.1)).toFixed(1)}px`;
      if (p2) p2.style.translate = `${(26 * C(t * 0.7)).toFixed(1)}px ${(18 * S(t * 1.3)).toFixed(1)}px`;
      const sp = s.querySelector('.spark'); if (sp) sp.style.transform = `rotate(${(t * 50) % 360}deg)`;
    },
  };

  function frame(ms) {
    const t = ms / 1000;
    document.querySelectorAll('.slide').forEach(s => { for (const k in A) if (s.classList.contains(k)) A[k](s, t); });
    if (!still) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  // Covers re-render when the page changes: draw a still frame at once so new slides never show empty shapes
  if (still) new MutationObserver(() => frame(0)).observe(document.body, { childList: true, subtree: true });
})();
