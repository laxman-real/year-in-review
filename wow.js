// Year in Review: "wow" reveal for the big-achievement slides (03 volume, 05 biggest deal, 07 top 5%, 09 capped).
// Each poster type has its own moment, played when the slide comes into view (tap a slide to replay):
//   V4 Wrapped  · the number slams in, a lime starburst spins out behind it, speed lines and confetti
//   P1 Poster   · the number counts up, iridescent prism ripples spread out from it
//   G1 Glow     · the number counts up out of a blur, a soft colour aura blooms and glowing orbs drift up
//   Z1 Cobalt   · a cobalt marker bar sweeps across and uncovers the number, then pulls away; sparkles pop
// All of them end with a shimmer that runs through the letters themselves (again every 6 s), in the poster's colours.
// The effect finds the element bound to "<page>.value", so copy stays in content.js. Reduced motion gets the still slide.
(function () {
  const WOW = ['03', '05', '07', '09'];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const NS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2, R = (a, b) => a + Math.random() * (b - a);
  const STAR = 'M0-50C3-14 14-3 50 0 14 3 3 14 0 50-3 14-14 3-50 0-14-3-3-14 0-50Z';
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent && parent.appendChild(e); return e; };
  const box0 = e => { e.style.transformBox = 'fill-box'; e.style.transformOrigin = 'center'; return e; };
  const SHINE = {   // the light band that runs through the letters
    'c-w': 'linear-gradient(105deg, transparent 40%, #d9ff8a 47%, #a3e635 50%, #d9ff8a 53%, transparent 60%)',
    'c-p2': 'linear-gradient(105deg, transparent 34%, #ff9ad5 42%, #ffe27a 47%, #8be9ff 53%, #b69cff 58%, transparent 66%)',
    'c-g': 'linear-gradient(105deg, transparent 38%, #ff7ab6 45%, #ffd3a1 50%, #ff9a6b 55%, transparent 62%)',
    'c-z': 'linear-gradient(105deg, transparent 40%, #9fb5ff 46%, #ffffff 50%, #9fb5ff 54%, transparent 60%)',
  };
  let uid = 0;

  // Where the number's ink sits, in slide units (1080 x 1350)
  function inkBox(s, nums) {
    const sr = s.getBoundingClientRect(), k = sr.width / 1080 || 1;
    let box = null;
    nums.forEach(n => {
      const rg = document.createRange(); rg.selectNodeContents(n); const r = rg.getBoundingClientRect();
      if (!r.width) return;
      const b = { l: (r.left - sr.left) / k, t: (r.top - sr.top) / k, r: (r.right - sr.left) / k, b: (r.bottom - sr.top) / k };
      box = box ? { l: Math.min(box.l, b.l), t: Math.min(box.t, b.t), r: Math.max(box.r, b.r), b: Math.max(box.b, b.b) } : b;
    });
    box = box || { l: 340, t: 575, r: 740, b: 775 };
    return Object.assign(box, { cx: (box.l + box.r) / 2, cy: (box.t + box.b) / 2, w: box.r - box.l, h: box.b - box.t });
  }

  // ---- Number entrances (each returns how long it runs, in ms) ----
  const original = n => n.dataset.wowText || (n.dataset.wowText = n.textContent);
  function count(n, delay, { blur = 10 } = {}) {               // "$14.2M" runs 0 → 14.2; "Top 5%" runs down from 50 to 5
    const text = original(n), m = text.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/);
    if (!m) return letters(n, delay);
    const [, pre, num, post] = m, to = parseFloat(num), dec = (num.split('.')[1] || '').length, down = /top/i.test(pre);
    const from = down ? Math.max(to * 10, 50) : 0, dur = 1300;
    n.style.animation = 'none'; n.textContent = pre + from.toFixed(dec) + post;
    n.animate([{ opacity: 0, scale: .75, filter: `blur(${blur}px)` }, { opacity: 1, scale: 1.04, filter: 'blur(0)', offset: .6 }, { opacity: 1, scale: 1, filter: 'blur(0)' }],
      { duration: 700, delay, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' });
    const t0 = performance.now() + delay;
    const tick = now => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur)), e = 1 - Math.pow(1 - k, 4);
      n.textContent = pre + (from + (to - from) * e).toFixed(dec) + post;
      if (k < 1) requestAnimationFrame(tick); else n.textContent = text;
    };
    requestAnimationFrame(tick);
    return dur;
  }
  function letters(n, delay) {                                  // each letter rises in with a small overshoot
    const text = original(n);
    n.style.animation = 'none';
    n.innerHTML = [...text].map(c => `<span style="display:inline-block">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
    const spans = [...n.children];
    spans.forEach((sp, i) => sp.animate([{ opacity: 0, translate: '0 .55em' }, { opacity: 1, translate: '0 -.05em', offset: .7 }, { opacity: 1, translate: '0 0' }],
      { duration: 640, delay: delay + i * 75, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }));
    const total = 640 + spans.length * 75;
    setTimeout(() => { if (n.isConnected) n.textContent = text; }, delay + total + 50);
    return total;
  }
  function slam(n, delay) {                                     // drops in big and lands with a thump
    original(n); n.style.animation = 'none';
    n.animate([{ opacity: 0, scale: 2.4, filter: 'blur(12px)' }, { opacity: 1, scale: .9, filter: 'blur(0)', offset: .5 }, { scale: 1.05, offset: .75 }, { opacity: 1, scale: 1, filter: 'blur(0)' }],
      { duration: 640, delay, easing: 'cubic-bezier(.3,.9,.3,1)', fill: 'backwards' });
    return 640;
  }

  // ---- Shared pieces ----
  function layers(s, nums, id) {
    const back = el('svg', { class: 'wow wow-back', viewBox: '0 0 1080 1350', 'aria-hidden': 'true' });
    // under the number and any text near it (chips, labels), over the photo and background
    const par = nums[0].parentNode, sr = s.getBoundingClientRect(), k = sr.width / 1080 || 1, nb = inkBox(s, nums);
    const near = [...par.children].find(c => {
      if (c === nums[0]) return true;
      if (!c.textContent.trim() || c.classList.contains('wow')) return false;
      const r = c.getBoundingClientRect(), t = (r.top - sr.top) / k, bt = (r.bottom - sr.top) / k;
      return r.width > 0 && bt > nb.t - 320 && t < nb.b + 320;
    }) || nums[0];
    par.insertBefore(back, near);
    const front = el('svg', { class: 'wow', viewBox: '0 0 1080 1350', 'aria-hidden': 'true' });
    s.appendChild(front);
    return { back, front, defs: el('defs', {}, back), id };
  }
  function radial(defs, id, stops, attrs = {}) {
    const g = el('radialGradient', Object.assign({ id }, attrs), defs);
    stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g));
    return `url(#${id})`;
  }
  function confetti(layer, b, colors, at, n = 36, up = true) {
    const g = el('g', {}, layer);
    for (let i = 0; i < n; i++) {
      const a = up ? R(-Math.PI * .95, -Math.PI * .05) : R(0, TAU), d = R(240, 600), c = colors[i % colors.length], sz = R(10, 22);
      const sx = b.cx + R(-b.w * .4, b.w * .4), sy = b.cy;
      const p = box0(i % 3 ? el('rect', { x: sx - sz / 2, y: sy - sz / 4, width: sz, height: sz / 2, rx: 2, fill: c }, g)
        : el('path', { d: STAR, fill: c, transform: `translate(${sx.toFixed(0)} ${sy.toFixed(0)}) scale(${(sz / 70).toFixed(2)})` }, g));
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
      p.animate([
        { transform: 'translate(0,0) rotate(0deg) scale(.4)', opacity: 0 },
        { transform: 'translate(0,0) rotate(0deg) scale(1)', opacity: 1, offset: .04 },
        { transform: `translate(${dx.toFixed(0)}px,${dy.toFixed(0)}px) rotate(${R(-300, 300).toFixed(0)}deg) scale(1)`, opacity: 1, offset: .45 },
        { transform: `translate(${(dx * 1.15).toFixed(0)}px,${(dy + 520).toFixed(0)}px) rotate(${R(-600, 600).toFixed(0)}deg) scale(.8)`, opacity: 0 },
      ], { duration: R(1800, 2600), delay: at + R(0, 120), easing: 'cubic-bezier(.15,.65,.4,1)', fill: 'both' });
    }
    setTimeout(() => g.remove(), at + 2900);
  }
  function twinkles(layer, b, colors, at) {
    [[b.l - 36, b.t + 14, 26], [b.r + 26, b.t - 6, 20], [b.r - 24, b.b + 26, 22], [b.l + 30, b.b + 18, 14], [b.cx, b.t - 44, 16]].forEach(([x, y, k], i) => {
      const st = box0(el('path', { d: STAR, fill: colors[i % colors.length], transform: `translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${k / 50})` }, layer));
      st.animate([{ opacity: 0, scale: 0, rotate: '0deg' }, { opacity: 1, scale: 1, rotate: '45deg', offset: .5 }, { opacity: 0, scale: 0, rotate: '90deg' }],
        { duration: 2200, delay: at + i * 420, iterations: Infinity, easing: 'ease-in-out', fill: 'backwards' });
    });
  }
  // Shimmer through the letters: a copy of the number on top, its text filled with a moving colour band
  function shimmer(s, nums, grad, at) {
    const shines = nums.map(n => {
      const c = n.cloneNode(true);
      ['data-yir-page', 'data-yir'].forEach(a => c.removeAttribute(a));
      c.classList.add('wow-shine'); c.setAttribute('aria-hidden', 'true'); c.textContent = original(n);
      c.style.setProperty('--shine', grad);
      if (getComputedStyle(n).position === 'static')               // in-flow numbers: lay the copy exactly over it
        Object.assign(c.style, { position: 'absolute', left: n.offsetLeft + 'px', top: n.offsetTop + 'px', width: n.offsetWidth + 'px', margin: 0 });
      n.after(c); return c;
    });
    const sweep = dl => shines.forEach(c => c.animate([{ backgroundPosition: '130% 0' }, { backgroundPosition: '-30% 0' }], { duration: 1400, delay: dl, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'both' }));
    sweep(at);
    s._wowShine = setInterval(() => { if (!s.isConnected) return clearInterval(s._wowShine); sweep(0); }, 6000);
  }

  // ---- One moment per poster type ----
  const FX = {
    // V4 Wrapped: slam + spinning lime starburst + speed lines + confetti
    'c-w'(s, nums, b, L) {
      const at = 300, land = at + 320;
      const burst = el('g', {}, L.back), P = 22, r1 = Math.min(400, Math.max(260, b.w * .45)), r0 = r1 * .76;
      const pts = Array.from({ length: P * 2 }, (_, i) => { const a = i / (P * 2) * TAU, r = i % 2 ? r0 : r1; return `${(b.cx + Math.cos(a) * r).toFixed(0)},${(b.cy + Math.sin(a) * r * .62).toFixed(0)}`; }).join(' ');
      el('polygon', { points: pts, fill: '#a3e635' }, burst);
      burst.style.transformOrigin = `${b.cx}px ${b.cy}px`;
      burst.animate([{ transform: 'scale(0) rotate(-90deg)', opacity: 1 }, { transform: 'scale(1.08) rotate(8deg)', opacity: 1, offset: .25 }, { transform: 'scale(1) rotate(25deg)', opacity: .9, offset: .5 }, { transform: 'scale(1.02) rotate(45deg)', opacity: 0 }],
        { duration: 2600, delay: land - 80, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'both' });
      for (let i = 0; i < 16; i++) {                               // speed lines shooting out
        const a = i / 16 * TAU + R(-.1, .1), a0 = r1 * .9, a1 = a0 + R(140, 260);
        const ln = el('line', { x1: b.cx + Math.cos(a) * a0, y1: b.cy + Math.sin(a) * a0 * .62, x2: b.cx + Math.cos(a) * a1, y2: b.cy + Math.sin(a) * a1 * .62, stroke: i % 2 ? '#ffffff' : '#a3e635', 'stroke-width': R(6, 12), 'stroke-linecap': 'round', 'stroke-dasharray': 300, 'stroke-dashoffset': 300 }, L.back);
        ln.animate([{ strokeDashoffset: 300, opacity: 1 }, { strokeDashoffset: 0, opacity: 1, offset: .5 }, { strokeDashoffset: -300, opacity: 0 }], { duration: 700, delay: land + R(0, 120), easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
      }
      nums.forEach(n => slam(n, at));
      s.animate([0, -10, 8, -5, 3, 0].map((v, i) => ({ translate: `${v}px ${i % 2 ? v * .5 : -v * .5}px` })), { duration: 340, delay: land, easing: 'linear' });
      confetti(L.front, b, ['#a3e635', '#ffffff', '#4967fd', '#ddebff'], land, 40, false);
      twinkles(L.front, b, ['#ffffff', '#a3e635'], land + 900);
      return { shine: land + 900 };
    },
    // P1 Poster: count-up + iridescent prism ripples + rainbow sparkles
    'c-p2'(s, nums, b, L) {
      const at = 250;
      const g = el('linearGradient', { id: L.id + 'ir', x1: '0', y1: '0', x2: '1', y2: '1' }, L.defs);
      ['#ff9ad5', '#ffe27a', '#8be9ff', '#b69cff'].forEach((c, i) => el('stop', { offset: i / 3, 'stop-color': c }, g));
      const halo = box0(el('ellipse', { cx: b.cx, cy: b.cy, rx: b.w * .6, ry: b.h * 1.1, fill: radial(L.defs, L.id + 'h', [['0', '#b69cff', .55], ['.6', '#8be9ff', .18], ['1', '#8be9ff', 0]]) }, L.back));
      halo.animate([{ opacity: 0, transform: 'scale(.5)' }, { opacity: 1, transform: 'scale(1)', offset: .3 }, { opacity: 0, transform: 'scale(1.2)' }], { duration: 3200, delay: at, fill: 'both' });
      for (let k = 0; k < 4; k++) {                                // rounded prism frames rippling outward
        const rr = box0(el('rect', { x: b.l - 30, y: b.t - 30, width: b.w + 60, height: b.h + 60, rx: 40, fill: 'none', stroke: `url(#${L.id}ir)`, 'stroke-width': 5 }, L.back));
        rr.animate([{ transform: 'scale(.9)', opacity: 0 }, { transform: 'scale(1)', opacity: .95, offset: .12 }, { transform: 'scale(2.3)', opacity: 0, strokeWidth: 1 }],
          { duration: 1900, delay: at + 700 + k * 260, easing: 'cubic-bezier(.15,.7,.3,1)', fill: 'both' });
      }
      const dur = Math.max(...nums.map(n => count(n, at + 100)));
      const sp = el('g', {}, L.front);                             // prism sparkles that pop around the number
      for (let i = 0; i < 14; i++) {
        const a = R(0, TAU), d = R(.6, 1.1), x = b.cx + Math.cos(a) * b.w * .6 * d, y = b.cy + Math.sin(a) * (b.h * .9 + 90) * d;
        const st = box0(el('path', { d: STAR, fill: ['#ff9ad5', '#ffe27a', '#8be9ff', '#b69cff'][i % 4], transform: `translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${R(.2, .45).toFixed(2)})` }, sp));
        st.animate([{ opacity: 0, scale: 0, rotate: '0deg' }, { opacity: 1, scale: 1.2, rotate: '60deg', offset: .4 }, { opacity: 0, scale: 0, rotate: '120deg' }], { duration: 1100, delay: at + 800 + R(0, 900), fill: 'both' });
      }
      setTimeout(() => sp.remove(), at + 3000);
      twinkles(L.front, b, ['#8be9ff', '#ff9ad5', '#ffe27a'], at + dur + 300);
      return { shine: at + 100 + dur };
    },
    // G1 Glow: count-up out of a blur + colour aura bloom + glowing orbs drifting up
    'c-g'(s, nums, b, L) {
      const at = 250;
      [['#ff7ab6', -.25, 0], ['#ffb86b', .25, .1], ['#8c7bff', 0, -.15]].forEach(([c, ox, oy], i) => {
        const a = box0(el('ellipse', { cx: b.cx + b.w * ox, cy: b.cy + b.h * oy, rx: b.w * .55, ry: b.h * 1.3, fill: radial(L.defs, L.id + 'a' + i, [['0', c, .8], ['1', c, 0]]) }, L.back));
        a.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1.1)', offset: .3 }, { opacity: .8, transform: 'scale(.95)', offset: .6 }, { opacity: 0, transform: 'scale(1.2)' }],
          { duration: 3600, delay: at + i * 150, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'both' });
      });
      const orbs = el('g', {}, L.front);
      for (let i = 0; i < 16; i++) {                               // soft glowing orbs floating up past the number
        const c = ['#ffffff', '#ffd3e8', '#ffe3c4', '#d9d2ff'][i % 4], r = R(8, 26), x = b.l + R(-60, b.w + 60), y = b.b + R(0, 120);
        const o = el('circle', { cx: x, cy: y, r, fill: radial(L.defs, L.id + 'o' + i, [['0', c, 1], ['.5', c, .6], ['1', c, 0]]) }, orbs);
        o.animate([{ opacity: 0, transform: 'translate(0,0)' }, { opacity: .95, offset: .25 }, { opacity: 0, transform: `translate(${R(-40, 40).toFixed(0)}px,${-R(260, 520).toFixed(0)}px)` }],
          { duration: R(2200, 3200), delay: at + 600 + R(0, 900), easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' });
      }
      setTimeout(() => orbs.remove(), at + 4800);
      const dur = Math.max(...nums.map(n => count(n, at + 100, { blur: 22 })));
      twinkles(L.front, b, ['#ffffff', '#ff7ab6', '#ffb86b'], at + dur + 300);
      return { shine: at + 100 + dur };
    },
    // Z1 Cobalt: a cobalt marker bar sweeps across and uncovers the number, then pulls away; soft glow and sparkles
    'c-z'(s, nums, b, L) {
      const at = 250, pad = 18, T = 1150;
      const glow = box0(el('ellipse', { cx: b.cx, cy: b.cy, rx: b.w * .7, ry: b.h * 1.2, fill: radial(L.defs, L.id + 'g', [['0', '#9fb5ff', .6], ['1', '#9fb5ff', 0]]) }, L.back));
      glow.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)', offset: .4 }, { opacity: 0, transform: 'scale(1.1)' }], { duration: 3000, delay: at + 300, fill: 'both' });
      const bar = el('rect', { x: b.l - pad, y: b.t + b.h * .1, width: b.w + pad * 2, height: b.h * .82, fill: '#4967fd' }, L.front);   // the line box, trimmed to the letters
      bar.animate([
        { transform: 'scaleX(0)', transformOrigin: `${b.l - pad}px 0` },
        { transform: 'scaleX(1)', transformOrigin: `${b.l - pad}px 0`, offset: .45 },
        { transform: 'scaleX(1)', transformOrigin: `${b.r + pad}px 0`, offset: .55 },
        { transform: 'scaleX(0)', transformOrigin: `${b.r + pad}px 0` },
      ], { duration: T, delay: at, easing: 'cubic-bezier(.7,0,.25,1)', fill: 'both' });
      nums.forEach(n => {                                          // hidden until the bar covers it, then shown as the bar leaves
        original(n); n.style.animation = 'none';
        n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: at + T * .5, fill: 'backwards' });
        n.animate([{ translate: '-.06em 0' }, { translate: '0 0' }], { duration: 700, delay: at + T * .5, easing: 'cubic-bezier(.2,.9,.3,1)' });
      });
      [[b.r + 30, b.t - 10, 30], [b.r + 64, b.t + 34, 16], [b.l - 34, b.t + 6, 20]].forEach(([x, y, k], i) => {
        const st = box0(el('path', { d: STAR, fill: i === 1 ? '#9fb5ff' : '#4967fd', transform: `translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${k / 50})` }, L.front));
        st.animate([{ opacity: 0, scale: 0, rotate: '-60deg' }, { opacity: 1, scale: 1.3, rotate: '10deg', offset: .5 }, { opacity: 1, scale: 1, rotate: '0deg' }], { duration: 600, delay: at + T + i * 160, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
        st.animate([{ opacity: 1, scale: 1 }, { opacity: .3, scale: .6, offset: .5 }, { opacity: 1, scale: 1 }], { duration: 2400, delay: at + T + 900 + i * 400, iterations: Infinity, easing: 'ease-in-out' });
      });
      return { shine: at + T + 300 };
    },
  };

  function play(s) {
    s.querySelectorAll('.wow, .wow-shine').forEach(o => o.remove());
    clearInterval(s._wowShine);
    const all = [...s.querySelectorAll('[data-yir-page$=".value"]')], nums = all.filter(n => !n.classList.contains('echo'));
    if (!nums.length) return;
    all.filter(n => n.classList.contains('echo')).forEach(e => slam(e, 420));
    const type = Object.keys(FX).find(k => s.classList.contains(k)) || 'c-z';
    const b = inkBox(s, nums), L = layers(s, nums, 'w' + (++uid));
    const { shine } = FX[type](s, nums, b, L);
    shimmer(s, nums, SHINE[type], shine);
  }

  // Play each time a big-achievement slide is drawn and comes into view (re-renders and tap-to-replay make new slides)
  const seen = new WeakSet();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; io.unobserve(e.target); requestAnimationFrame(() => play(e.target));
  }), { threshold: .45 });
  function scan(root) {
    root.querySelectorAll('.slide[data-page]').forEach(s => {
      if (seen.has(s) || !WOW.includes(s.dataset.page)) return;
      seen.add(s); s.querySelectorAll('.wow, .wow-shine').forEach(o => o.remove()); io.observe(s);
    });
  }
  function start() {
    const row = document.getElementById('row'); if (!row) return;
    scan(row); new MutationObserver(() => scan(row)).observe(row, { childList: true, subtree: true });
  }
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', start) : start();
  window.YIRWow = { play };
})();
