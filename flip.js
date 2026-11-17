// Year in Review: the pattern-break slides (03, 05, 07, 09 carry .swap) open in their poster's normal colours, then an
// animation that tells that page's story reveals the swapped colours:
//   03 Total volume  · the new colour fills up like a tank (wavy surface) while the number counts up
//   05 Biggest deal  · a SOLD stamp slams onto the number; the new colours burst out from the impact
//   07 Top 5%        · a leaderboard races; your row shoots to the top and opens up into the slide (50% → 5%)
//   09 Capped        · a cap progress bar fills Jan → Aug 14, a check pops, the full bar grows to fill the slide
// Same story in every version, in that poster's colours. Plays when the slide comes into view; tap a slide to replay.
(function () {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // the poster's normal background (the layer that gets cleared) and an accent that reads on it
  const LOOK = {
    'c-w': { bg: 'linear-gradient(165deg, #4f6cff 0%, #3b55ee 100%)', ac: '#a3e635', ink: '#ffffff', sw: '#050e3d', sac: '#4967fd' },
    'c-p2': { bg: '#17171d', ac: '#ff4fb8', ink: '#ffffff', sw: '#17171d', sac: '#8a4dff' },
    'c-g': { bg: 'radial-gradient(60% 45% at 8% 10%, #8f7dff 0%, rgba(143,125,255,0) 100%), radial-gradient(55% 40% at 92% 6%, #f4b8ff 0%, rgba(244,184,255,0) 100%), radial-gradient(60% 45% at 85% 48%, #ff9fb6 0%, rgba(255,159,182,0) 100%), radial-gradient(70% 45% at 20% 98%, #ffd36e 0%, rgba(255,211,110,0) 100%), linear-gradient(160deg, #e9e2ff 0%, #ffe6f0 55%, #ffe9cf 100%)', ac: '#0b0b12', ink: '#0b0b12', sw: '#ffffff', sac: '#ff9fb6' },
    'c-z': { bg: '#efefec', ac: '#1c34c8', ink: '#1c34c8', sw: '#ffffff', sac: '#a3c0ff' },
  };
  // REMAX slides (.rx, remax.css): same stories in REMAX Brand Colors
  const LOOK_RX = {
    'c-w': { bg: 'linear-gradient(165deg, #0043FF 0%, #0036d4 100%)', ac: '#FF1200', ink: '#ffffff', sw: '#000E35', sac: '#ffffff' },
    'c-p2': { bg: '#000E35', ac: '#FF1200', ink: '#ffffff', sw: '#000E35', sac: '#0043FF' },
    'c-g': { bg: 'radial-gradient(60% 45% at 8% 10%, rgba(0,67,255,.55) 0%, rgba(0,67,255,0) 100%), radial-gradient(55% 40% at 92% 6%, rgba(163,212,242,.9) 0%, rgba(163,212,242,0) 100%), radial-gradient(60% 45% at 85% 48%, rgba(255,18,0,.45) 0%, rgba(255,18,0,0) 100%), linear-gradient(160deg, #F7F5EE 0%, #ffffff 55%, #F7F5EE 100%)', ac: '#000000', ink: '#000000', sw: '#ffffff', sac: '#FF1200' },
  };
  const W = 1080, now = () => performance.now();
  let H = 1350;                                   // set per slide in play(): 1350 poster, 1920 story
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const out = k => 1 - Math.pow(1 - k, 3);

  const num = s => s.querySelector('[data-yir-page$=".value"]:not(.echo)');
  function box(s) {
    const n = num(s); if (!n) return { l: 300, t: 600, r: 780, b: 800, cx: 540, cy: 700 };
    const sr = s.getBoundingClientRect(), k = sr.width / W || 1, rg = document.createRange(); rg.selectNodeContents(n);
    const r = rg.getBoundingClientRect(), b = { l: (r.left - sr.left) / k, t: (r.top - sr.top) / k, r: (r.right - sr.left) / k, b: (r.bottom - sr.top) / k };
    return Object.assign(b, { cx: (b.l + b.r) / 2, cy: (b.t + b.b) / 2 });
  }
  // run fn(k) for k 0 → 1 over dur ms after delay
  const tween = (dur, delay, fn) => new Promise(res => {
    const t0 = now() + delay;
    const tick = () => { const k = Math.min(1, Math.max(0, (now() - t0) / dur)); fn(k); if (k < 1) requestAnimationFrame(tick); else res(); };
    requestAnimationFrame(tick);
  });
  // count the number between two values while fn-driven progress runs ("$14.2M", "Top 5%")
  function counter(n, fromVal) {
    const text = n.dataset.flipText || (n.dataset.flipText = n.textContent), m = text.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
    if (!m) return () => {};
    const [, pre, v, post] = m, to = parseFloat(v), dec = (v.split('.')[1] || '').length, from = fromVal ?? 0;
    return k => { n.textContent = k >= 1 ? text : pre + (from + (to - from) * k).toFixed(dec) + post; };
  }
  const thump = n => n && n.animate([{ scale: 1 }, { scale: 1.12, offset: .4 }, { scale: .96, offset: .7 }, { scale: 1 }], { duration: 560, easing: 'cubic-bezier(.3,1.4,.5,1)' });
  const el = (tag, css, parent, html = '') => { const e = document.createElement(tag); e.style.cssText = css; e.innerHTML = html; parent.appendChild(e); return e; };
  // a full-slide layer in the normal colours with a rectangular window cut out of it (four pieces around the window)
  function windowed(o, bg) {
    const P = [0, 1, 2, 3].map(() => el('i', `position:absolute;background:${bg};background-size:${W}px ${H}px`, o));
    return (x, y, w, h) => {
      const R = [[0, 0, W, y], [0, y + h, W, H - y - h], [0, y, x, h], [x + w, y, W - x - w, h]];
      P.forEach((p, i) => { const [a, b, c, d] = R[i]; Object.assign(p.style, { left: a + 'px', top: b + 'px', width: Math.max(0, c) + 'px', height: Math.max(0, d) + 'px', backgroundPosition: `${-a}px ${-b}px` }); });
    };
  }

  // small burst of chips (confetti / ink) from a point
  function burst(s, x, y, colors, n = 22, spread = 420, round = false) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = spread * (.4 + Math.random() * .6), sz = 10 + Math.random() * 16;
      const c = el('i', `position:absolute;left:${x - sz / 2}px;top:${y - sz / 2}px;width:${sz}px;height:${round ? sz : sz * .5}px;border-radius:${round ? '50%' : '2px'};background:${colors[i % colors.length]}`, s);
      c.className = 'flip-fx';
      c.animate([{ transform: 'translate(0,0) rotate(0deg) scale(.5)', opacity: 1 }, { transform: `translate(${(Math.cos(a) * d).toFixed(0)}px,${(Math.sin(a) * d + (round ? 0 : 160)).toFixed(0)}px) rotate(${(Math.random() * 720 - 360).toFixed(0)}deg) scale(1)`, opacity: 0 }],
        { duration: 900 + Math.random() * 700, easing: 'cubic-bezier(.15,.7,.4,1)', fill: 'forwards' });
    }
  }
  function ring(s, x, y, color, r0 = 60, r1 = 700, delay = 0) {
    const e = el('i', `position:absolute;left:${x - r0}px;top:${y - r0}px;width:${r0 * 2}px;height:${r0 * 2}px;border-radius:50%;border:8px solid ${color}`, s);
    e.className = 'flip-fx';
    e.animate([{ transform: 'scale(1)', opacity: .9 }, { transform: `scale(${r1 / r0})`, opacity: 0, borderWidth: '1px' }], { duration: 900, delay, easing: 'cubic-bezier(.1,.7,.3,1)', fill: 'both' });
  }
  const fx = (tag, css, parent, html) => { const e = el(tag, css, parent, html); e.className = 'flip-fx'; return e; };

  const STORY = {
    // 03 · the new colour fills the slide like a tank: wavy glowing surface, "$" bubbles, a measuring scale that lights up
    async '03'(s, o, L, n) {
      const set = counter(n);
      const line = fx('i', `position:absolute;left:0;width:${W}px;height:6px;background:${L.ac};box-shadow:0 0 30px 6px ${L.ac}`, s);
      // scale on the right: five marks from $0 to the total
      const text = n ? (n.dataset.flipText || n.textContent) : '$14.2M', m = text.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
      const marks = [0, .25, .5, .75, 1].map(f => {
        const v = m ? m[1] + (parseFloat(m[2]) * f).toFixed(f && f < 1 ? 1 : (m[2].split('.')[1] || '').length) + m[3] : '';
        const e = fx('div', `position:absolute;right:56px;top:${H * (1 - f) - (f === 1 ? -40 : f === 0 ? 60 : 18)}px;display:flex;align-items:center;gap:14px;font:400 26px/1 var(--font-body);color:${L.ink};opacity:.55;transition:color .2s,opacity .2s`, s, `<span>${f === 0 ? '$0' : v}</span><i style="display:block;width:46px;height:3px;background:currentColor"></i>`);
        return [f, e];
      });
      const bubbles = Array.from({ length: 16 }, (_, i) => fx('div', `position:absolute;left:${50 + i * 62}px;font:800 ${22 + (i % 3) * 10}px/1 var(--font-display);color:${L.sw};opacity:0`, s, '$'));
      await tween(1800, 200, k => {
        const e = ease(k), lvl = H * (1 - e), t = now() / 1000, pts = [];
        for (let x = 0; x <= W; x += 54) pts.push(`${x}px ${(lvl + 24 * Math.sin(x / 85 + t * 6) * (1 - e * .7)).toFixed(1)}px`);
        o.style.clipPath = `polygon(0 0, ${W}px 0, ${pts.reverse().join(', ')})`;
        line.style.top = (lvl - 3) + 'px'; line.style.opacity = k < 1 ? 1 : 0;
        bubbles.forEach((b, i) => { const y = lvl + 60 + ((t * 260 + i * 113) % 520); b.style.top = y + 'px'; b.style.opacity = k < .95 && y < H - 20 ? .45 : 0; });
        marks.forEach(([f, el2]) => { const on = e >= f - .001; el2.style.color = on ? L.sw : L.ink; el2.style.opacity = on ? 1 : .55; el2.style.fontWeight = on ? 800 : 400; });
        set(e);
      });
      line.remove(); bubbles.forEach(b => b.remove());
      ring(s, n ? box(s).cx : 540, 0, L.sac, 80, 900);
      thump(n);
      await tween(500, 500, k => marks.forEach(([, e2]) => e2.style.opacity = (1 - k).toFixed(2)));
    },
    // 05 · a rubber SOLD stamp (rough inky edge, double border) slams on the number; shockwave and ink splatter; colours burst out
    async '05'(s, o, L, n) {
      const b = box(s), set = counter(n); set(0);
      const fid = 'rough' + Math.random().toString(36).slice(2, 7);
      const st = fx('div', `position:absolute;left:${b.cx - 260}px;top:${b.cy - 140}px;width:520px;height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;
        border:16px solid ${L.ac};box-shadow:inset 0 0 0 10px transparent, inset 0 0 0 16px ${L.ac};color:${L.ac};z-index:62;filter:url(#${fid})`, s,
        `<svg width="0" height="0" style="position:absolute"><filter id="${fid}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="7"/></filter></svg>
         <div style="font:800 160px/.85 var(--font-display);letter-spacing:-.02em">SOLD</div><div style="font:400 26px/1 var(--font-body);letter-spacing:.24em;text-transform:uppercase">Biggest deal · ${YIR.year}</div>`);
      await st.animate([{ transform: 'rotate(-16deg) scale(3.4)', opacity: 0 }, { transform: 'rotate(-9deg) scale(.9)', opacity: 1, offset: .78 }, { transform: 'rotate(-9deg) scale(1)', opacity: 1 }], { duration: 540, delay: 250, easing: 'cubic-bezier(.55,0,.75,0)', fill: 'both' }).finished;
      s.animate([0, -18, 14, -9, 5, 0].map((v, i) => ({ translate: `${v}px ${i % 2 ? -v * .5 : v * .5}px` })), { duration: 380 });
      ring(s, b.cx, b.cy, L.ac, 120, 900); ring(s, b.cx, b.cy, L.sac, 120, 700, 120);
      burst(s, b.cx, b.cy, [L.ac, L.ac, L.sac], 26, 520, true);
      tween(1300, 0, k => set(out(k)));
      await tween(950, 150, k => { const r = 1500 * out(k); o.style.webkitMaskImage = o.style.maskImage = `radial-gradient(circle at ${b.cx}px ${b.cy}px, transparent ${r}px, #000 ${r + 1}px)`; });
      st.style.color = L.sw; st.style.borderColor = L.sw; st.style.boxShadow = `inset 0 0 0 10px transparent, inset 0 0 0 16px ${L.sw}`;
      await st.animate([{ opacity: 1, transform: 'rotate(-9deg) scale(1)' }, { opacity: 0, transform: 'rotate(-9deg) scale(1.25)' }], { duration: 450, delay: 350, fill: 'forwards' }).finished;
    },
    // 07 · leaderboard: ranked rows with avatars race in; your row climbs from the bottom to #1 (50% → 5%), a star pops, the row opens up
    async '07'(s, o, L, n) {
      const set = counter(n, 50); set(0);
      const rows = 11, rh = 70, gap = 16, top0 = (H - rows * (rh + gap)) / 2, slot = k => top0 + k * (rh + gap), others = [];
      const ink2 = L.ink === '#ffffff' ? '#050e3d' : '#ffffff';
      for (let k = 0; k < rows - 1; k++) {
        const w = 880 - k * 50 - Math.random() * 60;
        const r = el('div', `position:absolute;left:60px;top:${slot(k)}px;height:${rh}px;width:${w}px;display:flex;align-items:center;gap:18px;padding:0 22px;box-sizing:border-box;
          background:color-mix(in srgb, ${L.ink} 13%, transparent);color:${L.ink};font:400 28px/1 var(--font-body);transform-origin:0 50%`, o,
          `<b style="font:800 30px/1 var(--font-display);width:56px">#${k + 1}</b><i style="width:40px;height:40px;border-radius:50%;background:color-mix(in srgb, ${L.ink} 30%, transparent)"></i><span style="opacity:.7">Agent</span>`);
        r.animate([{ transform: 'scaleX(0)', opacity: 0 }, { transform: 'scaleX(1)', opacity: 1 }], { duration: 600, delay: 150 + k * 45, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
        others.push(r);
      }
      const me = el('div', `position:absolute;left:60px;top:${slot(rows - 1)}px;height:${rh}px;width:960px;display:flex;align-items:center;gap:18px;padding:0 22px;box-sizing:border-box;background:${L.ac};color:${ink2};
        font:800 30px/1 var(--font-display);z-index:3;transform-origin:0 50%;box-shadow:0 12px 40px rgba(0,0,0,.25)`, o,
        `<b class="rk" style="width:56px">#11</b><i style="width:40px;height:40px;border-radius:50%;background:${ink2};opacity:.85"></i><span>You</span><span class="pc" style="margin-left:auto">50%</span>`);
      me.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 600, delay: 150, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' });
      const rk = me.querySelector('.rk'), pc = me.querySelector('.pc');
      await tween(1400, 800, k => {
        const e = ease(k), pos = (rows - 1) * (1 - e);
        me.style.top = slot(pos) + 'px';
        others.forEach((r, i) => { const shift = pos < i + .5 ? 1 : 0, cur = parseFloat(r.dataset.y || i), tgt = i + shift, ny = cur + (tgt - cur) * .35;
          r.dataset.y = ny; r.style.top = slot(ny) + 'px'; r.querySelector('b').textContent = '#' + (tgt + 1); });
        rk.textContent = '#' + (Math.round(pos) + 1); pc.textContent = Math.round(50 - 45 * e) + '%'; set(e);
      });
      const star = fx('div', `position:absolute;left:1000px;top:${slot(0) - 30}px;width:80px;height:80px;z-index:62`, s,
        `<svg viewBox="-50 -50 100 100" width="80" height="80"><path d="M0-50C3-14 14-3 50 0 14 3 3 14 0 50-3 14-14 3-50 0-14-3-3-14 0-50Z" fill="${L.ac}"/></svg>`);
      star.animate([{ transform: 'scale(0) rotate(-90deg)' }, { transform: 'scale(1.3) rotate(10deg)', offset: .6 }, { transform: 'scale(1) rotate(0deg)' }], { duration: 500, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'both' });
      burst(s, 1040, slot(0) + 10, [L.ac, L.ink], 16, 260);
      await tween(1, 450, () => {});
      // your row opens into the whole slide
      o.style.background = 'none'; others.forEach(r => r.style.zIndex = 1); me.style.zIndex = 1;
      const win = windowed(o, L.bg);
      await tween(750, 0, k => {
        const e = ease(k), y = slot(0) * (1 - e), h = rh + (H - rh) * e, x = 60 * (1 - e), w = 960 + (W - 960) * e;
        win(x, y, w, h); [...others, me].forEach(r => r.style.opacity = (1 - e).toFixed(3)); star.style.opacity = (1 - e).toFixed(3);
      });
      thump(n);
    },
    // 09 · cap bar: month ticks light up as it fills Jan → Aug 14, a light sweep runs in the fill; at 100% a check, a flag, confetti; the bar grows into the slide
    async '09'(s, o, L, n) {
      const b = box(s), y = Math.min(Math.max(b.cy - 40, 320), 1000), x = 80, w = W - 160, h = 84;
      const part = [];
      const add = (tag, css, html) => { const e = el(tag, css, o, html); part.push(e); return e; };
      add('i', `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${L.ink};opacity:.14`);
      const fill = add('i', `position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:${L.ac};transform-origin:0 50%;transform:scaleX(0);overflow:hidden`);
      const sweep = el('i', `position:absolute;top:0;left:-200px;width:180px;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.65),transparent)`, fill);
      const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug 14'];
      const ticks = M.map((mm, i) => { const f = i / (M.length - 1);
        return [f, add('div', `position:absolute;left:${x + w * f - (i === M.length - 1 ? 120 : i ? 30 : 0)}px;top:${y + h + 22}px;font:400 26px/1 var(--font-body);color:${L.ink};opacity:.45;text-align:${i === M.length - 1 ? 'right' : 'left'};width:${i === M.length - 1 ? 120 : 60}px`, mm),
          add('i', `position:absolute;left:${x + w * f - 2}px;top:${y - 18}px;width:4px;height:14px;background:${L.ink};opacity:.35`)]; });
      const pct = add('div', `position:absolute;left:${x}px;top:${y - 120}px;font:800 84px/1 var(--font-display);letter-spacing:-.03em;color:${L.ink}`, '0%');
      add('div', `position:absolute;right:${x}px;top:${y - 96}px;font:400 26px/1 var(--font-body);letter-spacing:.18em;text-transform:uppercase;color:${L.ink};opacity:.7`, 'Cap progress');
      sweep.animate([{ left: '-200px' }, { left: '100%' }], { duration: 900, iterations: 3, delay: 300 });
      await tween(1600, 250, k => {
        const e = ease(k); fill.style.transform = `scaleX(${e})`; pct.textContent = Math.round(e * 100) + '%';
        ticks.forEach(([f, lab, tk]) => { const on = e >= f - .001; lab.style.opacity = on ? 1 : .45; lab.style.fontWeight = on ? 800 : 400; tk.style.opacity = on ? 1 : .35; });
      });
      const chk = add('div', `position:absolute;left:${x + w - 66}px;top:${y - 24}px;width:132px;height:132px;border-radius:50%;background:${L.ink};display:flex;align-items:center;justify-content:center`,
        `<svg viewBox="0 0 40 40" width="70" height="70"><path d="M10 21 L17 28 L31 13" fill="none" stroke="${L.ac}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
      const flag = add('div', `position:absolute;left:${x + w - 330}px;top:${y - 210}px;padding:16px 24px;background:${L.ac};color:${L.ink === '#ffffff' ? '#050e3d' : '#ffffff'};font:800 34px/1 var(--font-display);letter-spacing:-.01em`, 'Cap reached');
      chk.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.25)', offset: .6 }, { transform: 'scale(1)' }], { duration: 420, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'both' });
      flag.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 400, delay: 120, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'both' });
      burst(s, x + w, y + h / 2, [L.ac, L.ink, L.sac], 26, 380);
      await tween(1, 650, () => {});
      // the full bar becomes a window that grows to the whole slide
      o.style.background = 'none'; part.forEach(e => e.style.zIndex = 1);
      const win = windowed(o, L.bg);
      await tween(750, 0, k => { const e = ease(k); win(x * (1 - e), y * (1 - e), w + (W - w) * e, h + (H - h) * e); part.forEach(q => q.style.opacity = (1 - e).toFixed(3)); });
      thump(n);
    },
  };

  async function play(s) {
    H = s.offsetHeight || 1350;
    s.querySelectorAll('.flip, .flip-fx').forEach(o => o.remove());
    const type = Object.keys(LOOK).find(k => s.classList.contains(k)), story = STORY[s.dataset.page];
    if (!type || !story) return;
    const L = (s.classList.contains('rx') && LOOK_RX[type]) || LOOK[type], n = num(s);
    const o = document.createElement('div');
    o.className = 'flip'; o.setAttribute('aria-hidden', 'true'); o.style.background = L.bg; o.style.backgroundSize = `${W}px ${H}px`;
    s.appendChild(o);
    try { await story(s, o, L, n); } finally { o.remove(); s.querySelectorAll('.flip-fx').forEach(e => e.remove()); if (n && n.dataset.flipText) n.textContent = n.dataset.flipText; }
  }

  const seen = new WeakSet();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target); requestAnimationFrame(() => play(e.target));
  }), { threshold: .4 });
  function scan(root) {
    root.querySelectorAll('.slide.swap').forEach(s => {
      if (seen.has(s)) return; seen.add(s); s.querySelectorAll('.flip, .flip-fx').forEach(o => o.remove()); io.observe(s);
    });
  }
  function start() {
    const row = document.getElementById('row'); if (!row) return;
    scan(row); new MutationObserver(() => scan(row)).observe(row, { childList: true, subtree: true });
  }
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
  window.YIRFlip = { play };
})();
