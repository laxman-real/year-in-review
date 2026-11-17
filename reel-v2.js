// Year in Review: P1 Poster reel v2 (1080 x 1920), beat-synced to the music bed (117.9 BPM, 0.509 s per beat).
// Open index.html#reel to play it; the render script captures it frame by frame (index.html#reel&render).
//   intro    · iridescent petals (the P1 cover flower) bloom while "My / 2026 / at Real" lands on the beats
//   posters  · one big card at a time, floating in 3D with a slow push-in; the glow behind it pulses on every kick
//   moves    · brand transitions on the downbeat: petal bloom, grid-tile flip, push-through, whip
//   big wins · before 03, 05, 07 and 09 the stat fills the screen in huge iridescent type, counting on the beat,
//              then the poster grows out of it and plays its story (tank, SOLD stamp, leaderboard, cap bar)
//   outro    · all ten posters snap into a mosaic, then the end card lands on the track's final hit
// The v1 carousel is kept in reel-v1.js.
(function () {
  if (!/(^|[#&])reel\b/.test(location.hash)) return;
  const W = 1080, H = 1920, BEAT = 60 / 117.88, CS = 0.92, CW = 1080 * CS, CH = 1350 * CS, CY = 1010;
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const out = k => 1 - Math.pow(1 - k, 3);
  const out5 = k => 1 - Math.pow(1 - k, 5);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const IRID = 'linear-gradient(110deg, #3a7bff 0%, #8a4dff 28%, #ff4fb8 55%, #ff9a3d 78%, #3ddc97 100%)';

  const css = `
  html, body { overflow: hidden !important; }
  ${/render/.test(location.hash) ? '#kamui-bar { display: none !important; }' : ''}
  #reel { position: fixed; left: 0; top: 0; width: ${W}px; height: ${H}px; z-index: 5000; overflow: hidden; background: #0d0d12; perspective: 2200px; perspective-origin: 50% ${CY}px; }
  #reel .rgrid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.04) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.04) 2px, transparent 2px); background-size: 90px 90px; }
  #reel .rstreak { position: absolute; left: 0; top: 0; width: 360px; height: 2px; background: linear-gradient(90deg, transparent, #8a4dff, #ff4fb8, #ff9a3d, transparent); opacity: 0; }
  #reel .rstreak.v { width: 2px; height: 360px; background: linear-gradient(180deg, transparent, #3a7bff, #8a4dff, #ff4fb8, transparent); }
  #reel .rglow { position: absolute; left: ${W / 2 - 520}px; top: ${CY - 520}px; width: 1040px; height: 1040px; border-radius: 50%; filter: blur(150px); opacity: .5;
    background: conic-gradient(from 40deg, #3a7bff, #8a4dff, #ff4fb8, #ff9a3d, #3ddc97, #3a7bff); }
  #reel .rhead { position: absolute; left: 80px; right: 80px; top: 104px; display: flex; justify-content: space-between; align-items: center; color: #fff; z-index: 40; }
  #reel .rhead .logo { width: 116px; height: 54px; position: static; color: #fff; }
  #reel .rhead span { font: 400 26px/1 var(--font-body); letter-spacing: .16em; text-transform: uppercase; color: rgba(255,255,255,.75); }
  #reel .rbars { position: absolute; left: 80px; right: 80px; top: 200px; display: flex; gap: 8px; z-index: 40; }
  #reel .rbars i { flex: 1; height: 5px; border-radius: 3px; background: rgba(255,255,255,.16); overflow: hidden; }
  #reel .rbars b { display: block; height: 100%; width: 0; background: ${IRID}; }
  #reel .sc { position: absolute; inset: 0; visibility: hidden; transform-style: preserve-3d; }
  #reel .rcard { position: absolute; left: ${(W - CW) / 2}px; top: ${CY - CH / 2}px; width: ${CW}px; height: ${CH}px; transform-style: preserve-3d; }
  #reel .rin { --scale: ${CS}; --slide-h: 1350px; width: ${CW}px; height: ${CH}px; overflow: hidden; position: relative; }
  #reel .kin { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; }
  #reel .kin .rows { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; gap: 30px; overflow: hidden; }
  #reel .kin .row { white-space: nowrap; font: 300 230px/1 var(--font-display); letter-spacing: -.04em; color: transparent; -webkit-text-stroke: 2px rgba(255,255,255,.12); }
  #reel .kin .lab { position: relative; font: 400 34px/1 var(--font-body); letter-spacing: .3em; text-transform: uppercase; color: rgba(255,255,255,.85); margin-bottom: 34px; }
  #reel .kin .num { position: relative; font: 300 300px/.95 var(--font-display); letter-spacing: -.05em; white-space: nowrap; background: ${IRID}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  #reel .kin .sub { position: relative; margin-top: 30px; font: 400 48px/1.1 var(--font-display); color: #fff; }
  #reel .intro { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; }
  #reel .intro { gap: 70px; }
  #reel .intro .w { position: relative; font: 300 200px/1 var(--font-display); letter-spacing: -.05em; }
  #reel .intro .w.y { font-size: 300px; line-height: .95; background: ${IRID}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  #reel .petals { position: absolute; left: ${W / 2}px; top: ${CY}px; width: 0; height: 0; }
  #reel .petals i { position: absolute; left: -110px; top: -620px; width: 220px; height: 620px; border-radius: 110px; transform-origin: 110px 620px; background: ${IRID}; opacity: .95; }
  #reel .ov { position: absolute; inset: 0; pointer-events: none; z-index: 30; }
  #reel .ov .tile { position: absolute; width: 91px; height: 91px; backface-visibility: hidden; background: conic-gradient(from 40deg at 50% 45%, #3a7bff, #8a4dff, #ff4fb8, #ff9a3d, #3ddc97, #3a7bff); background-size: 1080px 1920px; }
  #reel .mos .m { position: absolute; width: 300px; height: 375px; overflow: hidden; }
  #reel .mos .m .rin { --scale: ${300 / 1080}; width: 300px; height: 375px; }
  #reel .endc { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #fff; }
  #reel .endc h2 { margin: 0; font: 300 170px/.92 var(--font-display); letter-spacing: -.05em; }
  #reel .endc h2 span { background: ${IRID}; -webkit-background-clip: text; background-clip: text; color: transparent; }
  #reel .endc p { margin: 50px 0 0; font: 400 46px/1.2 var(--font-display); }
  #reel .endc small { display: block; margin-top: 12px; font: 300 30px/1.2 var(--font-body); color: rgba(255,255,255,.7); }
  #reel .endc .logo { position: static; display: inline-block; margin-top: 80px; width: 180px; height: 84px; color: #fff; }
  #reel .flash { position: absolute; inset: 0; background: #fff; opacity: 0; z-index: 35; pointer-events: none; }
  `;
  const petalsHTML = n => `<div class="petals">${Array.from({ length: n }, (_, i) => `<i style="transform:rotate(${i * 360 / n}deg)"></i>`).join('')}</div>`;
  // fit a number into a width (Telegraf Light ~0.52 em per character)
  const fitNum = (text, width, max) => Math.min(max, Math.floor(width / (String(text).length * 0.52)));

  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const P1 = COVERS().find(c => c.id === 'P1'), pages = YIR.pages;
    const reel = document.createElement('div'); reel.id = 'reel';
    reel.innerHTML = `<i class="rglow"></i><div class="rgrid"></div>${Array.from({ length: 6 }, (_, i) => `<i class="rstreak${i % 2 ? ' v' : ''}"></i>`).join('')}
      <div class="scenes"></div><div class="ov"></div><i class="flash"></i>
      <div class="rhead"><span class="logo"></span><span>${YIR.year} · Year in review</span></div>
      <div class="rbars">${pages.map(() => '<i><b></b></i>').join('')}</div>`;
    document.body.appendChild(reel);
    const holder = reel.querySelector('.scenes');
    const slideHTML = (p, i) => {
      if (i === 0) return `<section class="slide ${P1.t.dataset.class}" data-page="01">${P1.t.innerHTML}</section>`;
      const g = YIR_SETS.P1(p, i);
      return `<section class="slide ${g.cls}${SWAP.includes(p.id) ? ' swap' : ''}" data-page="${p.id}">${g.html}</section>`;
    };
    const add = (cls, html) => { const e = document.createElement('div'); e.className = 'sc ' + cls; e.innerHTML = html; holder.appendChild(e); return e; };

    const scenes = [];
    // timeline in beats; the end card lands on beat 74 (the track's final hit)
    scenes.push({ kind: 'intro', at: 0, page: 0, el: add('intro', `${petalsHTML(8)}<div class="w a">My</div><div class="w y b">${YIR.year}</div><div class="w c">at Real</div>`) });
    const plan = [['01', 6, 'petal'], ['02', 10, 'tiles'], ['03', 14], ['04', 24, 'whip'], ['05', 28], ['06', 38, 'petal'], ['07', 42], ['08', 52, 'push'], ['09', 56], ['10', 66, 'tiles']];
    plan.forEach(([id, at, tr]) => {
      const i = pages.findIndex(p => p.id === id), p = pages[i];
      if (SWAP.includes(id)) {   // big win: kinetic stat card for 2 beats, then the poster for 8
        const rows = Array.from({ length: 3 }, () => `<div class="row">${(p.name + ' · ').repeat(4)}</div>`).join('');
        scenes.push({ kind: 'kin', at, tr: 'cut', page: i, el: add('kin', `<div class="rows">${rows}</div><div class="lab">${p.name}</div><div class="num" style="font-size:${fitNum(p.value, 980, 330)}px" data-v="${p.value}">${p.value}</div><div class="sub">${p.label}</div>`) });
        scenes.push({ kind: 'card', at: at + 2, tr: 'grow', page: i, el: add('cardsc', `<div class="rcard"><div class="rin">${slideHTML(p, i)}</div></div>`) });
      } else {
        scenes.push({ kind: 'card', at, tr, page: i, el: add('cardsc', `<div class="rcard"><div class="rin">${slideHTML(p, i)}</div></div>`) });
      }
    });
    const mos = pages.map((p, i) => `<div class="m" data-i="${i}"><div class="rin">${slideHTML(p, i)}</div></div>`).join('');
    scenes.push({ kind: 'mosaic', at: 70, tr: 'push', page: 9, el: add('mos', mos) });
    scenes.push({ kind: 'end', at: 74, tr: 'petal', page: 9, el: add('endc', `${petalsHTML(10)}<h2>My <span>${YIR.year}</span><br>at Real</h2><p>${YIR.agent.name}</p><small>${YIR.agent.brokerage}</small><span class="logo"></span>`) });
    bind(reel);
    if (window.Grain) Grain.renderAll(reel); if (window.Rings) Rings.renderAll(reel);
    return { reel, scenes, pages, END: 80 };
  }

  function start() {
    const { reel, scenes, END } = build();
    const TOTAL = END * BEAT, TB = { petal: 1, tiles: 1, whip: .5, push: .75, grow: .75, cut: 0 };
    const ov = reel.querySelector('.ov'), flash = reel.querySelector('.flash'), glow = reel.querySelector('.rglow');
    const bars = [...reel.querySelectorAll('.rbars b')], streaks = [...reel.querySelectorAll('.rstreak')];
    const fired = new Set();
    // overlay pieces for the transitions
    ov.innerHTML = petalsHTML(8).replace('class="petals"', 'class="petals tp"');
    const tp = ov.querySelector('.tp');
    const tiles = []; for (let r = 0; r < 22; r++) for (let c = 0; c < 12; c++) { const e = document.createElement('i'); e.className = 'tile'; e.style.left = c * 90 + 'px'; e.style.top = r * 90 + 'px'; ov.appendChild(e); tiles.push([e, r, c]); }
    const hideOv = () => { tp.style.display = 'none'; tiles.forEach(([e]) => e.style.display = 'none'); };

    // a fresh copy restarts a poster's entrance motion; break posters start their story as they come in
    function refresh(sc) {
      sc.el.querySelectorAll('.slide').forEach(old => { const c = old.cloneNode(true); c.querySelectorAll('.flip, .flip-fx').forEach(e => e.remove()); old.replaceWith(c); });
      if (window.Grain) Grain.renderAll(sc.el); if (window.Rings) Rings.renderAll(sc.el);
      const s = sc.el.querySelector('.slide.swap'); if (s && sc.kind === 'card' && window.YIRFlip) YIRFlip.play(s);
    }
    const show = (sc, on) => { sc.el.style.visibility = on ? 'visible' : 'hidden'; };
    const T = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = 1) => `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${s.toFixed(4)})`;

    // each scene's own motion while it is on screen (lb = beats since it landed, negative during its entrance)
    function local(sc, lb, b) {
      const el = sc.el;
      if (sc.kind === 'card') {
        const c = el.querySelector('.rcard'), t = b * BEAT;
        c.style.transform = T(0, 8 * Math.sin(t * 1.3), 0, 3 * Math.sin(t * .9), 4 * Math.sin(t * .7 + 1), 0, 1 + clamp(lb / 8) * .035);
      }
      if (sc.kind === 'intro') {
        const P = el.querySelector('.petals');
        P.style.transform = `rotate(${(b * 12).toFixed(1)}deg) scale(${(out(clamp(b / 3)) * (.55 + .05 * Math.sin(b * Math.PI))).toFixed(3)})`;
        P.style.opacity = (.55 - .3 * clamp((b - 1.5) / 1.5)).toFixed(3);   // dims once the words land so 2026 reads
        ['.a', '.b', '.c'].forEach((q, i) => { const w = el.querySelector(q), k = clamp((b - (1 + i)) * 2.2);
          w.style.opacity = k; w.style.transform = `translateY(${((1 - out5(k)) * 120).toFixed(1)}px) scale(${(1 + (1 - out5(k)) * .25).toFixed(3)})`; });
      }
      if (sc.kind === 'kin') {
        const num = el.querySelector('.num'), v = num.dataset.v, m = v.match(/^(\D*?)(\d+(?:\.\d+)?)(.*)$/), k = clamp(lb / 1.6);
        if (m) { const to = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, top = /top/i.test(m[1]); const f = top ? lerp(50, to, out(k)) : to * out(k); num.textContent = m[1] + f.toFixed(dec) + m[3]; }
        else num.textContent = v.slice(0, Math.max(1, Math.round(v.length * out(clamp(lb / 1.2)))));
        const pulse = Math.exp(-(((lb % 1) + 1) % 1) * 6);
        num.style.transform = `scale(${(1 + .06 * pulse + (1 - out(clamp(lb * 2))) * .4).toFixed(3)})`;
        el.querySelectorAll('.row').forEach((r, i) => { r.style.transform = `translateX(${((i % 2 ? -1 : 1) * (lb * 180) - (i % 2 ? 0 : 900)).toFixed(1)}px)`; });
        el.querySelector('.lab').style.opacity = clamp(lb * 3); el.querySelector('.sub').style.opacity = clamp(lb * 2 - .4);
      }
      if (sc.kind === 'mosaic') {
        el.querySelectorAll('.m').forEach(m => { const i = +m.dataset.i, col = i % 3, row = Math.floor(i / 3), x = i === 9 ? 395 : 75 + col * 320, y = 330 + row * 395;
          const k = out5(clamp((lb - i * .18) * 2.2));
          m.style.left = x + 'px'; m.style.top = y + 'px';
          m.style.transform = `translateY(${((1 - k) * 260).toFixed(1)}px) rotate(${((1 - k) * (i % 2 ? 8 : -8)).toFixed(2)}deg) scale(${lerp(.5, 1, k).toFixed(3)})`; m.style.opacity = clamp(k * 1.5); });
      }
      if (sc.kind === 'end') {
        const P = el.querySelector('.petals'), k = out5(clamp(lb / 1.2));
        P.style.transform = `rotate(${(b * 10).toFixed(1)}deg) scale(${lerp(.2, 1.15, k).toFixed(3)})`; P.style.opacity = (.35 * (1 - clamp((lb - 1.5) / 3) * .5)).toFixed(3);
        [...el.children].filter(e => !e.classList.contains('petals')).forEach((e, i) => { const kk = out5(clamp((lb - i * .25) * 1.6)); e.style.opacity = kk; e.style.transform = `translateY(${((1 - kk) * 70).toFixed(1)}px)`; });
      }
    }

    // transition into scene `inc` from `og` at progress k (0 → 1, landing on the beat)
    function trans(type, og, inc, k) {
      hideOv();
      const ogC = og && (og.el.querySelector('.rcard') || og.el), incC = inc.el.querySelector('.rcard') || inc.el;
      if (type === 'petal') {   // the P1 flower blooms over the screen, then opens onto the next scene
        tp.style.display = 'block';
        const s = k < .5 ? out(k * 2) * 3.2 : 3.2 + out((k - .5) * 2) * 2.5, rot = k * 140;
        tp.style.transform = `rotate(${rot.toFixed(1)}deg) scale(${s.toFixed(3)})`; tp.style.opacity = k < .5 ? 1 : (1 - out((k - .5) * 2)).toFixed(3);
        show(inc, k >= .5); if (og) show(og, k < .5);
        if (k >= .5) incC.style.transform = T(0, 0, 0, 0, 0, (1 - out((k - .5) * 2)) * -6, lerp(.85, 1, out((k - .5) * 2)));
      }
      if (type === 'tiles') {   // the P1 grid tiles flip in as a diagonal wave, then flip away onto the next scene
        tiles.forEach(([e, r, c]) => { const d = (r + c) / 33, kk = k < .5 ? clamp((k * 2 - d * .6) / .4) : 1 - clamp(((k - .5) * 2 - d * .6) / .4);
          e.style.display = 'block'; e.style.transform = `perspective(500px) rotateY(${((1 - kk) * 90).toFixed(1)}deg)`; e.style.backgroundPosition = `${-c * 90}px ${-r * 90}px`; });
        show(inc, k >= .5); if (og) show(og, k < .5);
      }
      if (type === 'whip') {   // fast horizontal whip with motion blur
        const e = ease(k); show(inc, true); if (og) show(og, true);
        if (og) { ogC.style.transform = T(-1300 * e, 0, 0, 0, 0, -4 * e, 1); ogC.style.filter = `blur(${(Math.sin(k * Math.PI) * 26).toFixed(1)}px)`; }
        incC.style.transform = T(1300 * (1 - e), 0, 0, 0, 0, 4 * (1 - e), 1); incC.style.filter = `blur(${(Math.sin(k * Math.PI) * 26).toFixed(1)}px)`;
      }
      if (type === 'push' || type === 'grow') {   // push through the old scene into the new one
        const e = out(k); show(inc, true); if (og) show(og, k < .9);
        if (og) { ogC.style.transform = T(0, 0, 0, 0, 0, 0, lerp(1, 2.4, ease(k))); ogC.style.opacity = (1 - out(k)).toFixed(3); ogC.style.filter = `blur(${(k * 14).toFixed(1)}px)`; }
        incC.style.transform = T(0, type === 'grow' ? 260 * (1 - e) : 0, 0, 0, 0, 0, lerp(type === 'grow' ? .35 : .6, 1, e)); incC.style.opacity = clamp(k * 2.5).toFixed(3); incC.style.filter = `blur(${((1 - e) * 12).toFixed(1)}px)`;
      }
    }

    function seek(t) {
      const b = t / BEAT;
      // background: the glow pulses on every beat, streaks run along the grid lines
      const ph = b % 1, pulse = Math.exp(-ph * 5);
      glow.style.transform = `translate(${(60 * Math.sin(t * .4)).toFixed(1)}px, ${(50 * Math.cos(t * .33)).toFixed(1)}px) scale(${(1 + .1 * pulse).toFixed(3)})`;
      glow.style.opacity = (.42 + .16 * pulse).toFixed(3);
      streaks.forEach((s, i) => { const per = 2.6 + i * .4, u = ((t + i * 1.1) % per) / per, v = s.classList.contains('v'), line = 90 * (2 + ((i * 5 + Math.floor((t + i * 1.1) / per) * 3) % (v ? 10 : 19)));
        s.style.opacity = Math.sin(u * Math.PI).toFixed(2); s.style.transform = v ? `translate(${line}px, ${(u * 2300 - 360).toFixed(0)}px)` : `translate(${(u * 1500 - 360).toFixed(0)}px, ${line}px)`; });

      // which scene is on screen, and the transition into it
      let i = 0; for (let n = 0; n < scenes.length; n++) { const tb = TB[scenes[n].tr] ?? 0; if (b >= scenes[n].at - tb) i = n; }
      const sc = scenes[i], tb = TB[sc.tr] ?? 0, inTr = b < sc.at && tb > 0, k = inTr ? clamp((b - (sc.at - tb)) / tb) : 1;
      scenes.forEach((s, n) => { if (n !== i && !(inTr && n === i - 1)) show(s, false); });
      // reset what transitions touch, then apply each scene's own motion
      [sc, scenes[i - 1]].forEach(s => { if (!s) return; const c = s.el.querySelector('.rcard') || s.el; c.style.filter = ''; c.style.opacity = ''; if (s.kind !== 'card') c.style.transform = ''; });
      if (!fired.has(i)) { fired.add(i); refresh(sc); }
      if (inTr) { if (scenes[i - 1]) local(scenes[i - 1], b - scenes[i - 1].at, b); local(sc, b - sc.at, b); trans(sc.tr, scenes[i - 1], sc, k); }
      else { hideOv(); show(sc, true); local(sc, b - sc.at, b); }
      // a white flash on the hard cuts into the big-win stats
      const cut = sc.tr === 'cut' ? b - sc.at : 9;
      flash.style.opacity = (cut >= 0 && cut < .3 ? .22 * (1 - cut / .3) : 0).toFixed(3);
      // progress
      bars.forEach((bb, n) => { bb.style.width = (n < sc.page ? 100 : n === sc.page ? 100 * clamp((b - sc.at + tb) / 4) : 0).toFixed(1) + '%'; });
      reel.querySelector('.rbars').style.opacity = sc.kind === 'intro' || sc.kind === 'end' ? 0 : 1;
    }

    let t0 = null, gen = 0;
    const run = g => { const loop = now => { if (g !== gen) return; if (t0 === null) t0 = now; let t = (now - t0) / 1000;
      if (t >= TOTAL && window.REEL.loop) { t0 = now; t = 0; fired.clear(); } seek(Math.min(t, TOTAL)); if (t < TOTAL || window.REEL.loop) requestAnimationFrame(loop); }; requestAnimationFrame(loop); };
    window.REEL = { seek, total: TOTAL, beat: BEAT, loop: !/render/.test(location.hash), restart() { gen++; t0 = null; fired.clear(); run(gen); } };
    run(gen);
  }
  document.readyState === 'complete' ? setTimeout(start, 50) : addEventListener('load', () => setTimeout(start, 50));
})();
