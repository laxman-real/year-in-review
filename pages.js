// Year in Review: pages 02 to 10 for each cover version. One design per version, filled from content.js.
// Each function returns { cls, html } for a 1080 x 1350 slide. Text still binds through data-yir attributes,
// so copy changes stay in content.js. Live motion (live.js) and entrances (motion.css) pick up the same classes.
(function () {
  const SP = (c, extra = '') => `<svg class="abs spark ${c}" viewBox="-50 -50 100 100" aria-hidden="true" ${extra}><path d="M0-50C3-14 14-3 50 0 14 3 3 14 0 50-3 14-14 3-50 0-14-3-3-14 0-50Z"/></svg>`;
  const total = () => String(YIR.pages.length).padStart(2, '0');
  // Font size that fits a word or number into a width (Telegraf Ultrabold is about 0.62 em per character)
  const fit = (text, width, max, k = 0.62) => Math.min(max, Math.floor(width / (String(text).length * k)));
  const poses = ['agent.poses.crossedPhoto', 'agent.poses.keysPhoto', 'agent.poses.laughPhoto', 'agent.photo'];
  const last = p => p.id === total();
  // Story size only (9:16): a row of three supporting facts (content.js facts). No progress strip on the slides:
  // Instagram stories draw their own bars at the top (Laxman, 17 Nov).
  const sfacts = p => (p.facts || []).length ? `<div class="abs sfacts st-only">${p.facts.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>` : '';


  // Wrapped (V4) lives in wrapped.js (kept out of the shared repo for now); it reads these helpers.
  window.YIR_HELP = { SP, total, fit, poses, last, sfacts };

  // ---------- P1 · Poster: charcoal grid, violet petals moving corner to corner, light stat, info bar ----------
  function P1(p, i, story) {
    const corners = [[980, 140], [100, 120], [1000, 260], [80, 240], [960, 60]];
    const [cx, cy] = corners[i % corners.length];
    const size = fit(p.value, 940, story ? 300 : 260, 0.56), vt = story ? 1010 : 720;   // story: stat sits below the bigger illustration
    // iridescent isometric illustration per page (replaces the single petal shape), alternating sides
    const ill = `assets/ir-${p.id}.png`, side = i % 2 ? [90, 230] : [520, 230];   // a safe band between the title row (ends ~250) and the stat (starts 720)
    const petals = Array.from({ length: 8 }, (_, k) => `<rect class="petal" transform="rotate(${k * 45})" x="-100" y="-430" width="200" height="430" rx="100"/>`).join('');
    return { cls: 'c-p2 ip1', html: `
      <div class="abs grid"></div>
      <i class="abs sq" style="left:${(cx + 300) % 1000}px;top:180px"></i><i class="abs sq" style="left:120px;top:${(cy + 400) % 900 + 200}px"></i>
      <i class="abs irglow" style="left:${side[0] + 30}px;top:${side[1] + 40}px"></i>
      <img class="abs ir" src="${ill}" alt="" style="left:${side[0]}px;top:${side[1]}px">
      <div class="abs shade2"></div>
      <span class="abs logo"></span>
      <div class="abs headline"><span class="l">${p.name}</span><span class="r">${p.id} / ${total()}</span></div>
      <div class="abs val" style="top:${vt}px;font-size:${size}px" data-yir-page="${p.id}.value"></div>
      <div class="abs lbl" style="top:${vt + size * 0.95}px" data-yir-page="${p.id}.label"></div>
      ${sfacts(p)}
      <div class="abs info">
        <div class="cell c1 who1"><div class="lb"><span data-yir="year"></span> · Year in review</div><div class="nm1" data-yir="agent.name"></div><div class="br1" data-yir="agent.brokerage"></div></div>
        <div class="cell c2"><div class="lb">${p.name}</div><div class="st" data-yir-page="${p.id}.note"></div></div>
        <div class="cell c3"><div class="lb">${last(p) ? 'That was' : 'Next'}</div><div class="big sm">${last(p) ? 'My year' : 'Swipe'}</div></div>
      </div>` };
  }

  // ---------- G1 · Glow: white, colour glows shifting page to page, pills, huge black capitals ----------
  function G1(p, i, story) {
    // Same structure as V4: photo pages (03, 05, 07, 09) show her portrait fading into the glow;
    // the others show the 3D illustration big at the top. Huge black stat and pills below.
    const photo = i % 2 === 0;
    // illustration pages keep the strong blue glow low, so the illustration sits on light, clean colour
    const shift = photo ? [[0, 0], [380, 260], [-120, 520], [300, -120], [120, 340]][i % 5] : [[-120, 560], [380, 600], [100, 620]][i % 3];
    const size = fit(String(p.value).toUpperCase(), 940, 300, 0.72);
    const cut = ['agent.cutout', 'agent.poses.keys', 'agent.poses.crossed', 'agent.poses.point'][(i / 2) % 4];
    // Three content zones (Laxman's wireframe, 6 Nov): top band at y 188, middle band centred on y 675,
    // bottom band ending at the footer rule (y 1170). Photo pages use the bottom zone; illustrations fill the free space.
    const GL = {
      '02': { zone: 'top', img: [280, 470, 820, 0] },     // house below the content
      '04': { zone: 'mid', img: [470, -70, 620, 10] },    // calendar tilted in the top right
      '06': { zone: 'bot', img: [160, -40, 780, 0] },     // pin centred in the top half
      '08': { zone: 'top', img: [420, 560, 600, -12] },   // coins tumbling into the bottom right
      '10': { zone: 'top', img: [-40, 400, 1140, 0] },    // the team across the lower half
    };
    const gl = !photo && GL[p.id];
    const zone = gl ? gl.zone : 'bot';
    const blockH = 90 + size * 0.88 + 124;
    const start = story ? 1010 : zone === 'top' ? 188 : zone === 'mid' ? 675 - blockH / 2 : 1150 - blockH;   // story: one fixed stat block under the visual
    const top = start + 90;
    return { cls: `c-g ip3${photo ? ' ph' : ''}`, html: `
      <div class="abs glow g1" style="left:${-300 + shift[0]}px;top:${60 + shift[1]}px"></div><div class="abs glow g2" style="left:${40 + shift[1] / 2}px;top:${-200 + shift[0] / 3}px"></div>
      <div class="abs glow g3" style="right:${-260 + shift[0] / 2}px;bottom:${-40 + shift[1] / 2}px"></div><div class="abs glow g4"></div>
      <canvas class="abs grain" data-grain="fine-noise" width="1080" height="1350"></canvas>
      ${photo ? `<img class="abs person g-person photo-only" data-yir-src="${cut}" alt="">` : `<img class="abs g-ill" src="assets/gl-${p.id}.jpg" alt="" style="left:${gl.img[0]}px;top:${gl.img[1]}px;width:${gl.img[2]}px;height:${gl.img[2]}px;rotate:${gl.img[3]}deg">`}
      <span class="abs logo"></span>
      <div class="abs pgn3">${p.id} / ${total()}</div>
      <div class="abs tags" style="top:${top - 90}px"><span class="tag solid">${p.name}</span></div>
      <div class="abs nm big" style="top:${top}px;font-size:${size}px" data-yir-page="${p.id}.value"></div>
      <div class="abs sub" style="top:${top + size * 0.88 + 34}px"><span data-yir-page="${p.id}.label"></span></div>
      <div class="abs note3" style="top:${top + size * 0.88 + 84}px" data-yir-page="${p.id}.note"></div>
      ${sfacts(p)}
      <div class="abs gnext">${YIR.pages[i + 1] ? `<b>Up next</b>${YIR.pages[i + 1].name}<span>→</span>` : 'That was my year at Real'}</div>
      <i class="abs g-rule"></i>
      <div class="abs g-foot"><div><div class="fn" data-yir="agent.name"></div><div class="fb" data-yir="agent.brokerage"></div></div><div class="fy" data-yir="year"></div></div>` };
  }

  // Simple line art for Z1 (one clean stroke weight, drawn in SVG)
  const LINE = {
    '02': '<path d="M28 96 L100 36 L172 96"/><path d="M46 88 V168 H154 V88"/><path d="M88 168 V126 H112 V168"/><rect x="60" y="104" width="20" height="18"/><path d="M178 112 V172"/><rect x="150" y="118" width="44" height="22"/><path d="M14 168 H190"/>',
    '04': '<rect x="36" y="48" width="128" height="122" rx="12"/><path d="M36 82 H164"/><path d="M72 34 V62 M128 34 V62"/>' + [0,1,2,3,4].flatMap(c => [0,1,2].map(r => `<circle cx="${58 + c * 21}" cy="${102 + r * 22}" r="2.5"/>`)).join('') + '<circle cx="121" cy="124" r="11"/>',
    '06': '<path d="M100 166 C74 132 56 110 56 84 A44 44 0 1 1 144 84 C144 110 126 132 100 166 Z"/><circle cx="100" cy="84" r="15"/><ellipse cx="100" cy="170" rx="54" ry="10"/><path d="M20 150 L56 136 M180 150 L144 136"/>',
    '08': '<ellipse cx="74" cy="150" rx="40" ry="12"/><path d="M34 150 V128 M114 150 V128"/><ellipse cx="74" cy="128" rx="40" ry="12"/><path d="M34 128 V106 M114 128 V106"/><ellipse cx="74" cy="106" rx="40" ry="12"/><rect x="104" y="52" width="80" height="48" rx="6" transform="rotate(-12 144 76)"/><circle cx="144" cy="76" r="11" transform="rotate(-12 144 76)"/>',
    '10': [[56, 0], [100, -10], [144, 0]].map(([x, d]) => `<circle cx="${x}" cy="${86 + d}" r="17"/><path d="M${x - 30} ${160 + d} C${x - 30} ${126 + d} ${x + 30} ${126 + d} ${x + 30} ${160 + d}"/>`).join('') + '<path d="M150 46 V70 M138 58 H162"/>',
  };
  const lineArt = id => `<div class="abs zfull ${['04','08'].includes(id) ? 'dia' : 'sq'} zp-${id}"><img src="assets/ab-${id}.jpg" alt=""></div>`;
  const lineArtSvg = id => `<svg class="abs zart" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${LINE[id] || ''}</g></svg>`;

  // ---------- Z1 · Cobalt: off-white and cobalt grain, glass pills, blurred figures (Zeronode reference) ----------
  function Z1(p, i) {
    const L = { '02': 'orb', '03': 'split', '04': 'pills', '05': 'split', '06': 'orb', '07': 'split', '08': 'pills', '09': 'split', '10': 'orb' }[p.id] || 'orb';
    const pose = { '03': 'agent.poses.keys', '05': 'agent.cutout', '07': 'agent.poses.point', '09': 'agent.poses.crossed' }[p.id];
    const head = `<span class="abs logo zlogo"></span><div class="abs zpg">${p.id} / ${total()}</div>`;
    if (L !== 'split') return { cls: 'c-z za', html: `
      <i class="abs zmesh"></i><i class="abs zglow"></i><i class="abs zchip l"></i><i class="abs zchip r"></i>${head}
      ${lineArt(p.id)}
      <div class="abs zkick2">${p.name}</div>
      <div class="abs zbig" style="font-size:${fit(p.value, 960, 260, 0.6)}px" data-yir-page="${p.id}.value"></div>
      <div class="abs zlbl2" data-yir-page="${p.id}.label"></div>
      <div class="abs zrule"></div>
      <div class="abs znote2" data-yir-page="${p.id}.note"></div>
      <div class="abs zwho"><b data-yir="agent.name"></b><span data-yir="agent.brokerage"></span></div>` };
    return { cls: 'c-z zs', html: `
      <div class="abs ztop"><i class="zmesh"></i><i class="zblob"></i>${pose ? `<img class="zfig photo-only" data-yir-src="${pose}" alt="">` : ''}</div>
      ${head}
      <div class="abs zpanel">
        <div class="zh" style="font-size:${fit(String(p.value).toUpperCase(), 940, 200, 0.62)}px" data-yir-page="${p.id}.value"></div><div class="zh2" data-yir-page="${p.id}.label"></div>
        <div class="zsub">${p.name}</div>
        <div class="zfoot"><div><p data-yir-page="${p.id}.note"></p><div class="zwho2"><b data-yir="agent.name"></b> · <span data-yir="agent.brokerage"></span></div></div><span class="logo"></span></div>
      </div>` };
  }

  // ---------- N1 · Numbers: paper, ink type, one accent colour per page, morphing shape, progress bar ----------
  const N1C = { '02': '#ff6b4a', '03': '#7a5cff', '04': '#19c37d', '05': '#ff5fa2', '06': '#2747ff', '07': '#ffb020', '08': '#12b5c9', '09': '#ff4d4d', '10': '#7a5cff' };
  function N1(p, i) {
    const c = N1C[p.id] || '#2747ff', photo = i % 2 === 0;
    const pose = { '03': 'agent.poses.keys', '05': 'agent.cutout', '07': 'agent.poses.point', '09': 'agent.poses.crossed' }[p.id];
    const w = photo ? 560 : 960, size = fit(p.value, w, photo ? 260 : 420, 0.56);
    const bar = Array.from({ length: 10 }, (_, k) => `<i class="${k <= i ? 'on' : ''}"></i>`).join('');
    return { cls: `c-n1 ${photo ? 'np' : 'nn'}`, html: `
      <svg class="abs nblob" viewBox="0 0 1080 1350" aria-hidden="true" style="--c:${c}"><path class="nb" fill="${c}"/></svg>
      ${photo ? `<img class="abs nfig photo-only" data-yir-src="${pose}" alt="">` : ''}
      <div class="abs ntop"><span class="logo"></span><span>${p.name}</span><span>${p.id} / ${total()}</span></div>
      <div class="abs nstat" style="font-size:${size}px" data-yir-page="${p.id}.value"></div>
      <div class="abs nlbl" style="--c:${c}" data-yir-page="${p.id}.label"></div>
      <div class="abs nnote" data-yir-page="${p.id}.note"></div>
      <div class="abs nfoot"><div><b data-yir="agent.name"></b><br><span data-yir="agent.brokerage"></span></div><div class="nbar" style="--c:${c}">${bar}</div></div>` };
  }

  window.YIR_SETS = Object.assign(window.YIR_SETS || {}, { P1, G1, Z1, N1 });
})();
