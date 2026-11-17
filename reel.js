// Year in Review: P1 Poster reel v3 (1080 x 1920), matching the reference reel (yir-reel-brand-v1.mp4):
// black stage, one big tall card at a time that drifts and tilts slowly while its content animates, the next card
// peeking in from the right edge (angled away in 3D) and the previous one from the left, and a fast slide swap
// (about 0.35 s) on every beat-aligned change. Cards are the P1 posters in story size; the break pages (03 05 07 09)
// hold a little longer so their story animation plays. An 11th P1-style end card closes it.
// Beat-synced to the music bed (117.9 BPM). Open index.html#reel to play; the renderer uses index.html#reel&render.
// Earlier versions: reel-v1.js (3D carousel), reel-v2.js (kinetic reel), reel-v3.js (this reel before icon motion).
// Version 2 of the reel (#reel=P1&v2): the same cut, plus motion on the icons. Each page's illustration has its own
// entrance that suits it (house and pin drop and bounce, chart and podium rise, calendar swings, diamond spins,
// coins tumble, check pops, team rises), then settles (no beat pulse). G1's photos push in.
(function () {
  // settings come from the query (?reel=P1&full&render) or the hash; the Kamui bar rewrites the hash on load, so renders use the query
  const Q = location.search.replace(/^\?/, '&') + '&' + location.hash.slice(1);
  if (!/(^|[#&])reel\b/.test(Q)) return;
  const SET = (Q.match(/reel=(\w+)/) || [])[1] || 'P1';   // #reel=G1 for the Glow reel
  const W = 1080, H = 1920, BEAT = 60 / 117.88, CW = 860, CS = CW / 1080, CH = 1920 * CS, CX = 540, CY = 960;   // centred
  const SW = 0.7;                                     // swap length in beats (~0.36 s)
  const ease4 = k => k < .5 ? 8 * k ** 4 : 1 - Math.pow(-2 * k + 2, 4) / 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
 // Version 3 (#reel=P1&full): no cards. Each page fills the screen; the logo, progress strip, grid and footer stay put
  // while the page content hands over: the old content lifts out, the new content rises in with a stagger, icons enter.
  const FULL = /(^|[#&])full\b/.test(Q);
  const V2 = FULL || /(^|[#&])v2\b/.test(Q);
  const TR = 1.3;
  // Version 3 uses the story pages exactly as designed, full screen (no Reels safe-area edits, Laxman 17 Nov).
  // what hands over between pages; everything else (logo, grid, progress strip, footer bars) stays where it is
  const CONTENT = '.headline, .val, .lbl, .sfacts, .info .c2, .who, .burst, .np-year, .tags, .nm, .sub, .note3, .gnext, .pgn3, .big-year, .swipe, .pg, .pgg, .tg, h2, .swp, .glo, .c-w .sticker, .c-w .num, .c-w .chip, .c-w .pgn, .endw .stk';   // .c-w: Wrapped (V4)
  const ICONS = '.ir, .irglow, .g-ill, .g-person, .person, .mg-ill, .c-w .photo';
  const easeBack = (k, o = 1.70158) => 1 + (o + 1) * Math.pow(k - 1, 3) + o * Math.pow(k - 1, 2);
  const easeOut = k => 1 - Math.pow(1 - k, 3);
  const bounce = k => { const n = 7.5625, d = 2.75; if (k < 1 / d) return n * k * k; if (k < 2 / d) return n * (k -= 1.5 / d) * k + .75; if (k < 2.5 / d) return n * (k -= 2.25 / d) * k + .9375; return n * (k -= 2.625 / d) * k + .984375; };
  const spring = (k, f = 9, damp = 4.5) => Math.exp(-damp * k) * Math.cos(f * k);   // 1 -> 0 with a wobble
  // icon motion per page: u = entrance progress 0..1, t = seconds since the card started coming in, p = beat pulse 0..1
  const ICON = {
    '02': (u, t, p) => ({ ty: -340 * (1 - bounce(u)), sc: 1 }),                                  // house drops in and bounces
    '03': (u, t, p) => ({ ty: 280 * (1 - easeBack(u)), sc: .7 + .3 * easeOut(u) }),                         // chart rises
    '04': (u, t, p) => ({ rot: -38 * spring(u) + 3 * Math.sin(t * 1.6), sc: .85 + .15 * easeOut(u), o: '50% 8%' }), // calendar swings from its rings
    '05': (u, t, p) => ({ ry: 360 * (1 - easeOut(u)) + 14 * Math.sin(t * 1.3), sc: .55 + .45 * easeBack(u) }),   // diamond spins in
    '06': (u, t, p) => ({ ty: -420 * (1 - bounce(u)), sc: 1 }),                                               // pin drops and bounces
    '07': (u, t, p) => ({ sc: easeBack(u, 2.4), o: '50% 90%' }),                                      // podium grows from the floor
    '08': (u, t, p) => ({ ty: -300 * (1 - bounce(u)), rot: 26 * spring(u, 7, 3) + 4 * Math.sin(t * 2.1), sc: 1 }), // coins tumble in
    '09': (u, t, p) => ({ rot: -24 * (1 - easeOut(u)), sc: easeBack(u, 3.2) }),                       // check pops
    '10': (u, t, p) => ({ ty: 220 * (1 - easeBack(u)), sc: .82 + .18 * easeOut(u), o: '50% 100%' }),       // team rises together
  };
  // Wrapped accents (small, on top of the print-in): u = entrance 0..1, t = seconds
  const WRAP = {
    '02': (u, t) => ({ ty: -8 * Math.sin(Math.PI * clamp(u * 1.4)) }),                           // houses lift and settle
    '04': (u, t) => ({ rot: -6 * spring(u, 8, 4), o: '50% 10%' }),                                // calendar swings from its rings
    '06': (u, t) => ({ ty: -40 * (1 - bounce(clamp(u * 1.1))) }),                                  // pin and town drop softly
    '08': (u, t) => ({ rot: 3 * spring(u, 7, 3.5), o: '60% 100%' }),                               // money bursts and settles
    '10': (u, t) => ({ ty: 6 * Math.sin(t * 2.2) * clamp(u * 2) }),                               // the team keeps a light bounce
  };
  const IRID = 'linear-gradient(110deg, #3a7bff 0%, #8a4dff 28%, #ff4fb8 55%, #ff9a3d 78%, #3ddc97 100%)';

  const css = `
  html, body { overflow: hidden !important; }
  ${/render/.test(Q) ? '#kamui-bar { display: none !important; }' : ''}
  #reel { position: fixed; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 5000; overflow: hidden; background: #000; perspective: 2000px; perspective-origin: 50% ${CY}px; }
  ${FULL ? `#reel.full { perspective: none; } #reel.full .rcard { left: 0; top: 0; width: ${W}px; height: ${H}px; box-shadow: none; transform: none !important; }
    #reel.full .rin { --scale: 1; width: ${W}px; height: ${H}px; position: relative; } #reel.full .endp { transform: none; }
    #reel.full .slide :is(${CONTENT}) { animation: none !important; }` : ''}
  ${V2 ? '#reel .ir, #reel .irglow, #reel .g-ill, #reel .g-person, #reel .person, #reel .mg-ill { animation: none !important; }' : ''}
  #reel .rcard { position: absolute; left: ${CX - CW / 2}px; top: ${CY - CH / 2}px; width: ${CW}px; height: ${CH}px; overflow: hidden; transform-origin: 50% 50%; backface-visibility: hidden; box-shadow: 0 0 0 2px rgba(255,255,255,.14); }
  #reel .rin { --scale: ${CS}; --slide-h: 1920px; width: ${CW}px; height: ${CH}px; overflow: hidden; position: relative; }
  /* the end card, in the P1 look */
  #reel .endp { position: relative; width: 1080px; height: 1920px; transform: scale(${CS}); transform-origin: 0 0; background: #17171d; color: #fff; overflow: hidden; }
  #reel .endp .g { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.035) 2px, transparent 2px); background-size: 90px 90px; }
  #reel .endp .glo { position: absolute; left: 140px; top: 520px; width: 800px; height: 800px; border-radius: 50%; filter: blur(120px); opacity: .55; background: conic-gradient(from 40deg, #3a7bff, #8a4dff, #ff4fb8, #ff9a3d, #3ddc97, #3a7bff); }
  #reel .endp .logo { position: absolute; left: 116px; top: 304px; width: 122px; height: 56px; color: #fff; }
  #reel .endp .pg { position: absolute; right: 96px; top: 296px; text-align: right; font: 400 62px/1.02 var(--font-display); letter-spacing: -.02em; }
  #reel .endp .pg span { display: block; background: ${IRID}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  #reel .endp h2 { position: absolute; left: 72px; right: 60px; top: 760px; margin: 0; font: 300 250px/.92 var(--font-display); letter-spacing: -.05em; }
  #reel .endp h2 span { background: ${IRID}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  #reel .endp .who { position: absolute; left: 78px; top: 1330px; }
  #reel .endp .who b { display: block; font: 400 56px/1.1 var(--font-display); }
  #reel .endp .who small { display: block; margin-top: 12px; font: 300 32px/1.2 var(--font-body); color: rgba(255,255,255,.72); }
  #reel .endg { background: radial-gradient(60% 45% at 8% 12%, #8f7dff 0%, rgba(143,125,255,0) 100%), radial-gradient(55% 40% at 92% 8%, #f4b8ff 0%, rgba(244,184,255,0) 100%),
    radial-gradient(60% 45% at 85% 50%, #ff9fb6 0%, rgba(255,159,182,0) 100%), radial-gradient(55% 45% at 12% 58%, #b9c4ff 0%, rgba(185,196,255,0) 100%),
    radial-gradient(70% 45% at 20% 98%, #ffd36e 0%, rgba(255,211,110,0) 100%), radial-gradient(60% 40% at 95% 100%, #ff8f73 0%, rgba(255,143,115,0) 100%), linear-gradient(160deg, #e9e2ff 0%, #ffe6f0 55%, #ffe9cf 100%); color: #0b0b12; }
  #reel .endg .logo { left: 80px; top: 300px; color: #0b0b12; }
  #reel .endg .pgg { position: absolute; right: 80px; top: 306px; font: 400 26px/1 var(--font-body); }
  #reel .endg .tg { position: absolute; left: 80px; top: 890px; display: flex; gap: 20px; }
  #reel .endg .tg span { height: 54px; padding: 0 26px; display: inline-flex; align-items: center; border: 2px solid #0b0b12; border-radius: 999px; font: 400 28px/1 var(--font-body); }
  #reel .endg .tg .solid { background: #0b0b12; color: #fff; }
  #reel .endg h2 { top: 980px; font: 800 150px/.9 var(--font-display); letter-spacing: -.02em; text-transform: uppercase; }
  #reel .endg .who { top: 1290px; } #reel .endg .who small { color: #0b0b12; opacity: .75; }
  #reel .endg .swp { color: #0b0b12; }
  /* the end card, in the Wrapped look (V4): cobalt, lime sticker, extruded white title */
  #reel .endw { background: radial-gradient(circle at 12% 92%, #8aa2ff 0%, rgba(138,162,255,0) 42%), radial-gradient(circle at 95% 0%, #6c84ff 0%, rgba(108,132,255,0) 40%), linear-gradient(165deg, #4f6cff 0%, #3b55ee 100%); }
  #reel .endw .logo { left: 80px; top: 80px; }
  #reel .endw .stk { position: absolute; left: 72px; top: 700px; padding: 20px 34px; background: linear-gradient(135deg, #d4f77f, #8fd420); color: #050e3d; font: 400 44px/1 var(--font-display); transform: rotate(-2deg); }
  #reel .endw h2 { top: 810px; left: 64px; font: 800 220px/.88 var(--font-display); letter-spacing: -.05em; color: #fff; text-shadow: 6px 6px 0 #a3e635, 12px 12px 0 #a3e635, 18px 18px 0 #a3e635; }
  #reel .endw .who { top: 1360px; left: 80px; } #reel .endw .who small { color: #ddebff; }
  #reel .endw .swp { left: 80px; bottom: 80px; color: #a3e635; }
  #reel .endp .swp { position: absolute; left: 78px; bottom: 330px; font: 400 30px/1 var(--font-body); letter-spacing: .16em; text-transform: uppercase; color: #c9c2ff; }
  `;

  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const P1 = COVERS().find(c => c.id === SET), pages = YIR.pages, N = pages.length;
    const reel = document.createElement('div'); reel.id = 'reel'; if (FULL) reel.className = 'full'; document.body.appendChild(reel);
    const slideHTML = (p, i) => {
      if (i === 0) return `<section class="slide ${P1.t.dataset.class} st9" data-page="01">${P1.t.innerHTML}</section>`;
      const g = YIR_SETS[SET](p, i, true);
      return `<section class="slide ${g.cls} st9${SWAP.includes(p.id) ? ' swap' : ''}" data-page="${p.id}" data-next="${(pages[i + 1] || {}).name || ''}">${g.html}</section>`;
    };
    const cards = pages.map((p, i) => {
      const c = document.createElement('div'); c.className = 'rcard';
      c.innerHTML = `<div class="rin">${slideHTML(p, i)}</div>`; reel.appendChild(c); return c;
    });
    const end = document.createElement('div'); end.className = 'rcard';
    end.innerHTML = SET === 'V4' ? `<div class="rin"><div class="endp endw"><span class="logo"></span>
      <div class="stk">That was</div><h2>My ${YIR.year}<br>at Real</h2>
      <div class="who"><b>${YIR.agent.name}</b><small>${YIR.agent.brokerage}</small></div><div class="swp">Thank you for a great year</div></div></div>` : SET === 'G1' ? `<div class="rin"><div class="endp endg"><span class="logo"></span><div class="pgg">${String(N + 1).padStart(2, '0')} / ${String(N + 1).padStart(2, '0')}</div>
      <div class="tg"><span class="solid">${YIR.year}</span><span>Year in review</span></div><h2>My year<br>at Real</h2>
      <div class="who"><b>${YIR.agent.name}</b><small>${YIR.agent.brokerage}</small></div><div class="swp">Thank you for a great year</div></div></div>` : `<div class="rin"><div class="endp"><i class="glo"></i><div class="g"></div><span class="logo"></span>
      <div class="pg">That was<span>${String(N + 1).padStart(2, '0')} / ${String(N + 1).padStart(2, '0')}</span></div>
      <h2>My <span>${YIR.year}</span><br>at Real</h2>
      <div class="who"><b>${YIR.agent.name}</b><small>${YIR.agent.brokerage}</small></div><div class="swp">Thank you for a great year</div></div></div>`;
    reel.appendChild(end); cards.push(end);
    bind(reel);
    if (window.Grain) Grain.renderAll(reel); if (window.Rings) Rings.renderAll(reel);
    return { reel, cards, pages };
  }

  function start() {
    const { cards, pages } = build();
    const N = cards.length;
    // beats each card stays in front: 4 (one bar, ~2 s like the reference), 6 for the break pages, 6 for the end card
    const hold = i => i === N - 1 ? 7 : SWAP.includes((pages[i] || {}).id) ? 6 : 4;
    const at = [0]; for (let i = 1; i < N; i++) at[i] = at[i - 1] + hold(i - 1);      // beat card i lands
    const ENDB = at[N - 1] + hold(N - 1), TOTAL = ENDB * BEAT;
    const fired = new Set();

    function refresh(i) {   // restart the card's entrance motion; break cards start their story as they come in
      const old = cards[i].querySelector('.slide'); if (!old) return;
      const c = old.cloneNode(true); c.querySelectorAll('.flip, .flip-fx').forEach(e => e.remove()); old.replaceWith(c);
      if (window.Grain) Grain.renderAll(cards[i]); if (window.Rings) Rings.renderAll(cards[i]);
      if (c.classList.contains('swap') && window.YIRFlip) {
        YIRFlip.play(c);
      }
    }

    // pose for a card at position d (0 = in front, 1 = peeking right, -1 = peeking left), with its own slow drift
    function pose(d, local, i) {
      const ad = Math.abs(d), side = Math.sign(d);
      const drift = clamp(local / 5);                                   // slow drift while in front
      const x = (d === 0 ? lerp(12, -12, drift) : 0) * (1 - clamp(ad)) + side * lerp(0, 760, clamp(ad)) + (ad > 1 ? side * (ad - 1) * 500 : 0);
      const ry = -side * lerp(0, 22, clamp(ad));
      const rz = lerp(i % 2 ? 1.6 : -1.4, i % 2 ? -.8 : .9, drift) * (1 - clamp(ad)) + side * clamp(ad) * 8;
      const y = lerp(0, 60, clamp(ad));
      const s = lerp(1, .9, clamp(ad));
      return `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${(-clamp(ad) * 120).toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${s.toFixed(4)})`;
    }

    // version 2: drive the icon on card i from the beat clock (deterministic, so the renderer gets the same frames)
    function icons(c, i, b, dy = 0, om = 1) {
      const id = (pages[i] || {}).id, t = (b - (FULL ? at[i] - TR * .8 : at[i] - SW)) * BEAT;   // seconds since the card (or its content) started coming in
      const u = clamp((t - .12) / 1.05), p = 0;   // no beat pulse (Laxman, 16 Nov): icons settle after their entrance
      const fade = clamp(t / .25) * om;
      const ir = c.querySelector('.ir'), gi = c.querySelector('.g-ill'), gp = c.querySelector('.g-person'), cp = c.querySelector('.slide:not(.ip1):not(.ip3) .person');
      const m = ICON[id];
      if (ir && m) {   // P1: live.js owns transform (idle bob), so use the individual properties
        const v = m(u, t, p); ir.style.transformOrigin = v.o || '50% 50%';
        ir.style.translate = `0 ${((v.ty || 0) + dy).toFixed(1)}px`; ir.style.scale = (v.sc ?? 1).toFixed(4);
        ir.style.rotate = v.ry ? `y ${v.ry.toFixed(1)}deg` : `${(v.rot || 0).toFixed(2)}deg`; ir.style.opacity = fade.toFixed(3);
        const gl = c.querySelector('.irglow'); if (gl) { gl.style.scale = (.6 + .4 * easeOut(u)).toFixed(3); gl.style.opacity = fade.toFixed(3); }
      }
      if (gi && m) {   // G1: live.js owns translate and the page owns rotate, so use transform
        const v = m(u, t, p); gi.style.transformOrigin = v.o || '50% 50%';
        gi.style.transform = `translateY(${((v.ty || 0) + dy).toFixed(1)}px) rotate(${(v.rot || 0).toFixed(2)}deg) rotateY(${(v.ry || 0).toFixed(1)}deg) scale(${(v.sc ?? 1).toFixed(4)})`;
        gi.style.opacity = fade.toFixed(3);
      }
      const mi = c.querySelector('.mg-ill'), wp = c.querySelector('.c-w .photo:not(.topic)');
      if (mi) {   // Wrapped: full-background poster-print art (17 Nov). It prints in from the bottom up (ink wipe) while it
        // rises a little into place, then keeps a slow drift behind the stat. One small accent per piece; no big bounces.
        const e = easeOut(u), w = clamp((t - .05) / .9), hold = clamp((t - 1) / 6);
        const acc = WRAP[id] ? WRAP[id](u, t) : {};
        mi.style.transformOrigin = acc.o || '50% 100%';
        mi.style.clipPath = `inset(${(100 * (1 - easeOut(w))).toFixed(2)}% -10% -10% -10%)`;
        mi.style.transform = `translateY(${(70 * (1 - e) - 18 * hold + (acc.ty || 0) + dy).toFixed(1)}px) rotate(${(acc.rot || 0).toFixed(2)}deg) scale(${(1.05 - .05 * e + .035 * hold).toFixed(4)})`;
        mi.style.opacity = fade.toFixed(3);
      }
      if (wp) { wp.style.transformOrigin = '50% 25%'; wp.style.transform = `translateY(${(50 * (1 - easeOut(u)) + dy).toFixed(1)}px) scale(${(1.12 - .12 * easeOut(clamp(t / 1.6))).toFixed(4)})`; if (FULL) wp.style.opacity = fade.toFixed(3); }
      if (gp) { gp.style.transformOrigin = '50% 30%'; gp.style.transform = `translateY(${(70 * (1 - easeOut(u)) + dy).toFixed(1)}px) scale(${(1.14 - .14 * easeOut(clamp(t / 1.6))).toFixed(4)})`; gp.style.opacity = fade.toFixed(3); }
      if (cp) { cp.style.transformOrigin = '50% 30%'; cp.style.transform = `translateY(${dy.toFixed(1)}px) scale(${(1.1 - .1 * easeOut(clamp(t / 1.8))).toFixed(4)})`; if (FULL) cp.style.opacity = fade.toFixed(3); }
    }

    // Version 3: one continuous upward flow. Content never stops: it drifts up slowly while its page holds, then keeps
    // going up and out as the next page's content rises in from below in the same direction (overlapping, staggered).
    // The background crossfades underneath; logo, grid and progress strip stay put.
    function seekFull(b) {
      const easeIn = k => k * k * k, eio = k => k < .5 ? 4 * k ** 3 : 1 - Math.pow(-2 * k + 2, 3) / 2;
      for (let i = 0; i < N; i++) if (b >= (i ? at[i] - TR : 0) && !fired.has(i)) { fired.add(i); refresh(i); }
      cards.forEach((c, i) => {
        const inS = i ? at[i] - TR : -1, nxt = i < N - 1 ? at[i + 1] : ENDB, end = i < N - 1 ? at[i + 1] : Infinity;
        if (b < inS || b >= end) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = 'visible'; c.style.zIndex = String(10 + i);
        c.style.opacity = i ? eio(clamp((b - inS) / (TR * .7))).toFixed(3) : '1';
        const life = clamp((b - (i ? inS : 0)) / (nxt - (i ? inS : 0)));          // 0 -> 1 across the page's whole time on screen
        const drift = -70 * life;                                                // the slow, constant rise
        const ui = i ? (b - (at[i] - TR * .85)) / (TR * .85) : b / (TR * .85);
        const uo = i < N - 1 ? (b - (at[i + 1] - TR)) / (TR * .85) : 0;
        c.querySelectorAll(CONTENT).forEach((e, j) => {
          const a = clamp(ui * 1.25 - j * .08), o = clamp(uo * 1.25 - j * .05);
          e.style.translate = `0 ${(drift + 260 * (1 - easeOut(a)) - 300 * easeIn(o)).toFixed(1)}px`;
          e.style.opacity = (clamp(a * 1.8) * (1 - clamp(o * 1.6))).toFixed(3);
        });
        const oo = clamp(uo);
        icons(c, i, b, drift - 320 * easeIn(oo), 1 - clamp(oo * 1.4));
      });
    }

    function seek(t) {
      const b = t / BEAT;
      if (FULL) return seekFull(b);
      // front position f: card index that is in front, fractional during a swap (the swap ends on the beat a card lands)
      let f = 0;
      for (let i = 1; i < N; i++) { if (b >= at[i]) f = i; else if (b >= at[i] - SW) { f = i - 1 + ease4((b - (at[i] - SW)) / SW); break; } else break; }
      for (let i = 0; i < N; i++) if (b >= (i ? at[i] - SW : 0) && !fired.has(i)) { fired.add(i); refresh(i); }
      cards.forEach((c, i) => {
        const d = i - f, ad = Math.abs(d);
        if (ad > 1.6) { c.style.visibility = 'hidden'; return; }
        c.style.visibility = 'visible';
        c.style.transform = pose(d, b - at[i], i);
        // the card coming in rides on top of the one leaving
        c.style.zIndex = String(100 - Math.round(ad * 10) + (d > 0 && d < 1 ? 20 : 0));
        c.style.filter = ad > .02 ? `brightness(${(1 - clamp(ad) * .22).toFixed(3)})` : 'none';
        if (V2) icons(c, i, b);
      });
    }

    let t0 = null, gen = 0;
    const run = g => { const loop = now => { if (g !== gen) return; if (t0 === null) t0 = now; let t = (now - t0) / 1000;
      if (t >= TOTAL && window.REEL.loop) { t0 = now; t = 0; fired.clear(); } seek(Math.min(t, TOTAL)); if (t < TOTAL || window.REEL.loop) requestAnimationFrame(loop); }; requestAnimationFrame(loop); };
    window.REEL = { seek, total: TOTAL, beat: BEAT, endBeat: at[N - 1], loop: !/render/.test(Q), restart() { gen++; t0 = null; fired.clear(); run(gen); } };
    run(gen);
  }
  document.readyState === 'complete' ? setTimeout(start, 50) : addEventListener('load', () => setTimeout(start, 50));
})();
