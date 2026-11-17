// Year in Review: P1 Poster reel v3 (1080 x 1920), matching the reference reel (yir-reel-brand-v1.mp4):
// black stage, one big tall card at a time that drifts and tilts slowly while its content animates, the next card
// peeking in from the right edge (angled away in 3D) and the previous one from the left, and a fast slide swap
// (about 0.35 s) on every beat-aligned change. Cards are the P1 posters in story size; the break pages (03 05 07 09)
// hold a little longer so their story animation plays. An 11th P1-style end card closes it.
// Beat-synced to the music bed (117.9 BPM). Open index.html#reel to play; the renderer uses index.html#reel&render.
// Earlier versions: reel-v1.js (3D carousel), reel-v2.js (kinetic reel).
(function () {
  if (!/(^|[#&])reel\b/.test(location.hash)) return;
  const SET = (location.hash.match(/reel=(\w+)/) || [])[1] || 'P1';   // #reel=G1 for the Glow reel
  const W = 1080, H = 1920, BEAT = 60 / 117.88, CW = 860, CS = CW / 1080, CH = 1920 * CS, CX = 540, CY = 960;   // centred
  const SW = 0.7;                                     // swap length in beats (~0.36 s)
  const ease4 = k => k < .5 ? 8 * k ** 4 : 1 - Math.pow(-2 * k + 2, 4) / 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const IRID = 'linear-gradient(110deg, #3a7bff 0%, #8a4dff 28%, #ff4fb8 55%, #ff9a3d 78%, #3ddc97 100%)';

  const css = `
  html, body { overflow: hidden !important; }
  ${/render/.test(location.hash) ? '#kamui-bar { display: none !important; }' : ''}
  #reel { position: fixed; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 5000; overflow: hidden; background: #000; perspective: 2000px; perspective-origin: 50% ${CY}px; }
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
  #reel .endp .swp { position: absolute; left: 78px; bottom: 330px; font: 400 30px/1 var(--font-body); letter-spacing: .16em; text-transform: uppercase; color: #c9c2ff; }
  `;

  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const P1 = COVERS().find(c => c.id === SET), pages = YIR.pages, N = pages.length;
    const reel = document.createElement('div'); reel.id = 'reel'; document.body.appendChild(reel);
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
    end.innerHTML = SET === 'G1' ? `<div class="rin"><div class="endp endg"><span class="logo"></span><div class="pgg">${String(N + 1).padStart(2, '0')} / ${String(N + 1).padStart(2, '0')}</div>
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
      if (c.classList.contains('swap') && window.YIRFlip) YIRFlip.play(c);
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

    function seek(t) {
      const b = t / BEAT;
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
      });
    }

    let t0 = null, gen = 0;
    const run = g => { const loop = now => { if (g !== gen) return; if (t0 === null) t0 = now; let t = (now - t0) / 1000;
      if (t >= TOTAL && window.REEL.loop) { t0 = now; t = 0; fired.clear(); } seek(Math.min(t, TOTAL)); if (t < TOTAL || window.REEL.loop) requestAnimationFrame(loop); }; requestAnimationFrame(loop); };
    window.REEL = { seek, total: TOTAL, beat: BEAT, endBeat: at[N - 1], loop: !/render/.test(location.hash), restart() { gen++; t0 = null; fired.clear(); run(gen); } };
    run(gen);
  }
  document.readyState === 'complete' ? setTimeout(start, 50) : addEventListener('load', () => setTimeout(start, 50));
})();
