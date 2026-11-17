// Year in Review: P1 Poster reel (1080 x 1920). Open index.html#reel to play it; the render script captures it frame by frame.
// A 3D carousel of the ten P1 posters on the full-bleed P1 grid (no black void, square corners), with:
//   intro   · the cards fly up as a fanned deck and settle with the cover in front
//   cards   · normal pages swipe in; the break pages (03 05 07 09) arrive with their own move (flip, punch, drop, spin)
//             and hold longer so their story animation (tank, SOLD stamp, leaderboard, cap bar) plays out
//   outro   · the deck gathers into a fan, then the end card: My 2026 at Real, her name, the Real logo
// Everything is driven by one clock (seek), so the capture is frame-exact.
(function () {
  if (!/(^|[#&])reel\b/.test(location.hash)) return;
  const W = 1080, H = 1920, CARD = 0.8, CW = 1080 * CARD, CH = 1350 * CARD, CY = 1000;
  const STYLE = { '03': 'flip', '05': 'punch', '07': 'drop', '09': 'spin' };
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const out = k => 1 - Math.pow(1 - k, 3);
  const back = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;

  const css = `
  html, body { overflow: hidden !important; }
  ${/render/.test(location.hash) ? '#kamui-bar { display: none !important; }' : ''}
  #reel { position: fixed; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 5000; overflow: hidden; background: #0d0d12; perspective: 2600px; perspective-origin: 50% ${CY}px; }
  #reel .rgrid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.035) 2px, transparent 2px); background-size: 90px 90px; }
  #reel .rglow { position: absolute; width: 1000px; height: 1000px; border-radius: 50%; filter: blur(140px); opacity: .42;
    background: conic-gradient(from 40deg, #3a7bff, #8a4dff, #ff4fb8, #ff9a3d, #3ddc97, #3a7bff); }
  #reel .rbig { position: absolute; top: ${CY - 430}px; left: 0; white-space: nowrap; font: 300 860px/1 var(--font-display); letter-spacing: -.06em; color: transparent; -webkit-text-stroke: 3px rgba(255,255,255,.07); }
  #reel .rhead { position: absolute; left: 80px; right: 80px; top: 112px; display: flex; justify-content: space-between; align-items: center; color: #fff; }
  #reel .rhead .logo { width: 122px; height: 56px; position: static; color: #fff; }
  #reel .rhead span { font: 400 26px/1 var(--font-body); letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.75); }
  #reel .rbars { position: absolute; left: 80px; right: 80px; top: 214px; display: flex; gap: 8px; }
  #reel .rbars i { flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,.18); overflow: hidden; }
  #reel .rbars b { display: block; height: 100%; width: 0; background: linear-gradient(90deg, #3a7bff, #8a4dff, #ff4fb8, #ff9a3d); }
  #reel .rcard { position: absolute; left: ${(W - CW) / 2}px; top: ${CY - CH / 2}px; width: ${CW}px; height: ${CH}px; transform-style: preserve-3d; backface-visibility: hidden; will-change: transform; }
  #reel .rcard .rin { --scale: ${CARD}; --slide-h: 1350px; width: ${CW}px; height: ${CH}px; overflow: hidden; position: relative; }
  #reel .rcap { position: absolute; left: 0; right: 0; top: ${CY + CH / 2 + 56}px; text-align: center; color: #fff; font: 400 46px/1.1 var(--font-display); letter-spacing: -.01em; }
  #reel .rcap em { font-style: normal; font: 400 26px/1 var(--font-body); letter-spacing: .16em; color: rgba(255,255,255,.6); margin-right: 18px; vertical-align: middle; }
  #reel .rend { position: absolute; left: 0; right: 0; top: 1180px; text-align: center; color: #fff; opacity: 0; }
  #reel .rend h2 { margin: 0; font: 300 128px/.95 var(--font-display); letter-spacing: -.045em; }
  #reel .rend h2 span { background: linear-gradient(110deg, #3a7bff, #8a4dff 30%, #ff4fb8 58%, #ff9a3d 80%, #3ddc97); -webkit-background-clip: text; background-clip: text; color: transparent; }
  #reel .rend p { margin: 36px 0 0; font: 400 40px/1.2 var(--font-display); }
  #reel .rend small { display: block; margin-top: 10px; font: 300 28px/1.2 var(--font-body); color: rgba(255,255,255,.7); }
  #reel .rend .logo { position: static; display: inline-block; margin-top: 70px; width: 170px; height: 78px; color: #fff; }
  `;

  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const P1 = COVERS().find(c => c.id === 'P1'), pages = YIR.pages;
    const reel = document.createElement('div'); reel.id = 'reel';
    reel.innerHTML = `<i class="rglow g1"></i><i class="rglow g2"></i><div class="rgrid"></div><div class="rbig">2026 · 2026 · 2026</div>
      <div class="rhead"><span class="logo"></span><span>${YIR.year} · Year in review</span></div>
      <div class="rbars">${pages.map(() => '<i><b></b></i>').join('')}</div>
      <div class="rcards"></div><div class="rcap"></div>
      <div class="rend"><h2>My <span>${YIR.year}</span><br>at Real</h2><p>${YIR.agent.name}</p><small>${YIR.agent.brokerage}</small><span class="logo"></span></div>`;
    document.body.appendChild(reel);
    const holder = reel.querySelector('.rcards');
    const cards = pages.map((p, i) => {
      let cls, html;
      if (i === 0) { cls = P1.t.dataset.class; html = P1.t.innerHTML; }
      else { const g = YIR_SETS.P1(p, i); cls = g.cls + (SWAP.includes(p.id) ? ' swap' : ''); html = g.html; }
      const c = document.createElement('div'); c.className = 'rcard';
      c.innerHTML = `<div class="rin"><section class="slide ${cls}" data-page="${p.id}">${html}</section></div>`;
      holder.appendChild(c);
      return c;
    });
    bind(reel);
    if (window.Grain) Grain.renderAll(reel); if (window.Rings) Rings.renderAll(reel);
    return { reel, cards, pages };
  }

  function start() {
    const { reel, cards, pages } = build();
    const N = cards.length, TR = .6, INTRO = 1.3, GATHER = 1.1, END = 2.2;
    const hold = i => SWAP.includes(pages[i].id) ? 2.9 : 1.7;
    const s = [INTRO]; for (let i = 1; i < N; i++) s[i] = s[i - 1] + hold(i - 1) + TR;     // time card i is fully in front
    const O = s[N - 1] + hold(N - 1), TOTAL = O + GATHER + END;
    const bars = [...reel.querySelectorAll('.rbars b')], cap = reel.querySelector('.rcap'), end = reel.querySelector('.rend');
    const g1 = reel.querySelector('.g1'), g2 = reel.querySelector('.g2'), big = reel.querySelector('.rbig');
    const fired = new Set();

    // a fresh copy of a card's slide restarts its entrance motion; break cards also get their story animation
    function refresh(i) {
      const old = cards[i].querySelector('.slide'), c = old.cloneNode(true);
      c.querySelectorAll('.flip, .flip-fx').forEach(e => e.remove());
      old.replaceWith(c);
      if (window.Grain) Grain.renderAll(cards[i]); if (window.Rings) Rings.renderAll(cards[i]);
      return c;
    }
    const pose = (d, sideFade = true) => {
      const ad = Math.abs(d);
      return { x: d * 690, y: 0, z: -Math.min(ad, 2.5) * 320, ry: -d * 34, rz: d * 2.2, sc: 1 - Math.min(ad, 1) * .1,
        op: sideFade ? clamp(1 - (ad - 1.25) * 1.2) : 1, br: 1 - Math.min(ad, 1) * .38 };
    };
    const apply = (c, p) => {
      c.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, ${p.z.toFixed(1)}px) rotateY(${p.ry.toFixed(2)}deg) rotateZ(${p.rz.toFixed(2)}deg) scale(${p.sc.toFixed(4)})`;
      c.style.opacity = p.op.toFixed(3); c.style.filter = p.br < .999 ? `brightness(${p.br.toFixed(3)})` : 'none';
      c.style.zIndex = Math.round(100 - Math.abs(p.z) / 10 + (p.front ? 50 : 0));
    };
    const mix = (a, b, k) => Object.fromEntries(Object.keys(a).map(key => [key, lerp(a[key], b[key], k)]));

    function seek(t) {
      // background drift
      g1.style.transform = `translate(${(-160 + 140 * Math.sin(t * .45)).toFixed(1)}px, ${(260 + 120 * Math.cos(t * .38)).toFixed(1)}px)`;
      g2.style.transform = `translate(${(380 + 150 * Math.cos(t * .41)).toFixed(1)}px, ${(1060 + 140 * Math.sin(t * .33)).toFixed(1)}px)`;
      big.style.transform = `translateX(${(-60 - t * 55).toFixed(1)}px)`;

      // which card is in front (a is fractional during a transition), and the transition into card j
      let a = 0, j = -1, k = 0;
      for (let i = 1; i < N; i++) {
        if (t >= s[i] - TR && t < s[i]) { j = i; k = (t - (s[i] - TR)) / TR; a = i - 1 + ease(k); break; }
        if (t >= s[i]) a = i;
      }
      // side effects at the right moments (time only moves forward while rendering)
      for (let i = 0; i < N; i++) {
        const tin = i ? s[i] - TR : 0;
        if (t >= tin && !fired.has('in' + i)) { fired.add('in' + i); const c = refresh(i); cards[i]._s = c; }
        if (t >= (i ? s[i] - TR : 0) + .02 && !fired.has('st' + i)) {   // break story starts as the card comes in, so it arrives in normal colours
          fired.add('st' + i); const c = cards[i].querySelector('.slide'); if (c.classList.contains('swap') && window.YIRFlip) YIRFlip.play(c); }
      }

      const intro = t < INTRO + .2, outro = t >= O;
      cards.forEach((c, i) => {
        let p = pose(i - a);
        if (intro) {   // fanned deck flying up
          const kc = out(clamp((t - i * .045) / (INTRO - .25)));
          const from = { x: (i - 4.5) * 46, y: 1500, z: -200, ry: 0, rz: (i - 4.5) * 7, sc: .62, op: 1, br: .8 };
          p = mix(from, p, kc);
        }
        if (j === i) {   // the incoming card's own entrance
          const sty = STYLE[pages[i].id] || 'swipe';
          if (sty === 'flip') { p = k < .5 ? { ...pose(0), op: 0 } : { ...pose(0), ry: 90 * (1 - ease((k - .5) * 2)) }; }
          if (sty === 'punch') { const e = out(k); p = { ...pose(0), sc: lerp(1.75, 1, e), op: clamp(k * 3), z: lerp(400, 0, e) }; }
          if (sty === 'drop') { const e = back(k); p = { ...pose(0), y: lerp(-1700, 0, clamp(e, 0, 1.2)), rz: lerp(-9, 0, out(k)) }; }
          if (sty === 'spin') { const e = out(k); p = { ...pose(0), rz: lerp(-200, 0, e), sc: lerp(.25, 1, e), op: clamp(k * 2.5) }; }
          p.front = true;
        }
        if (j > 0 && i === j - 1 && STYLE[pages[j].id] === 'flip') {   // flip: the outgoing card turns away first
          p = k < .5 ? { ...pose(0), ry: -90 * ease(k * 2) } : { ...pose(0), op: 0 };
        }
        if (outro) {   // gather into a small fan above the end card
          const kc = ease(clamp((t - O - i * .03) / (GATHER - .3)));
          const to = { x: (i - 4.5) * 64, y: -330, z: -120 + i * 4, ry: 0, rz: (i - 4.5) * 5.5, sc: .4, op: 1, br: 1 };
          p = mix(p, to, kc);
        }
        apply(c, p);
      });

      // progress bars and the caption under the card
      bars.forEach((b, i) => { b.style.width = (clamp(a - i + 1) * 100).toFixed(1) + '%'; });
      const ci = Math.round(a), pg = pages[ci];
      const capTxt = `<em>${pg.id} / ${String(N).padStart(2, '0')}</em>${pg.name}`;
      if (cap._t !== capTxt) { cap._t = capTxt; cap.innerHTML = capTxt; }
      const near = Math.abs(a - ci);
      cap.style.opacity = (outro ? clamp(1 - (t - O) * 3) : clamp(1 - near * 3)).toFixed(3);
      cap.style.transform = `translateY(${(near * 30).toFixed(1)}px)`;
      // end card
      const ke = out(clamp((t - O - .55) / .7));
      end.style.opacity = ke.toFixed(3); end.style.transform = `translateY(${((1 - ke) * 60).toFixed(1)}px)`;
    }

    let t0 = null, gen = 0;
    const run = g => { const loop = now => { if (g !== gen) return; if (t0 === null) t0 = now; let t = (now - t0) / 1000;
      if (t >= TOTAL && window.REEL.loop) { t0 = now; t = 0; fired.clear(); } seek(Math.min(t, TOTAL)); if (t < TOTAL || window.REEL.loop) requestAnimationFrame(loop); }; requestAnimationFrame(loop); };
    window.REEL = { seek, total: TOTAL, starts: s, loop: !/render/.test(location.hash), restart() { gen++; t0 = null; fired.clear(); run(gen); } };
    run(gen);
  }
  document.readyState === 'complete' ? setTimeout(start, 50) : addEventListener('load', () => setTimeout(start, 50));
})();
