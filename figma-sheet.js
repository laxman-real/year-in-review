// Year in Review: Figma capture sheet. Open index.html?figma=P1&fmt=post (or G1, and fmt=story) to lay out all ten
// slides of one version at full size (1080 wide) in a 5 x 2 grid with no app UI, for Figma's html-to-design capture,
// which turns them into editable layers. Bicolor and Photo are on; break pages (03 05 07 09) show their final swap.
// The capture script (mcp.figma.com) loads only on this view.
(function () {
  const q = new URLSearchParams(location.search), SET = q.get('figma');
  if (!SET) return;
  const STORY = q.get('fmt') === 'story', H = STORY ? 1920 : 1350, GAP = 120;
  function build() {
    const cover = COVERS().find(c => c.id === SET), pages = YIR.pages;
    const st = document.createElement('style');
    st.textContent = `body > *:not(#figma-sheet) { display: none !important; }
      html, body { background: #e9ebf1 !important; overflow: auto !important; }
      #figma-sheet { position: absolute; left: 0; top: 0; padding: ${GAP}px; display: grid; grid-template-columns: repeat(5, 1080px); gap: ${GAP}px; }
      #figma-sheet .fs-slide { --scale: 1; --slide-h: ${H}px; width: 1080px; height: ${H}px; overflow: hidden; position: relative; }
      #figma-sheet .slide { transform: none !important; }
      /* no animations at all: every element sits in its final, visible state even if the tab is in the background */
      #figma-sheet .slide *, #figma-sheet .slide, #figma-sheet .slide *::before, #figma-sheet .slide *::after { animation: none !important; transition: none !important; }`;
    document.head.appendChild(st);
    const sheet = document.createElement('div'); sheet.id = 'figma-sheet';
    sheet.innerHTML = pages.map((p, i) => {
      let cls, html;
      if (i === 0) { cls = cover.t.dataset.class; html = cover.t.innerHTML; }
      else { const g = YIR_SETS[SET](p, i, STORY); cls = g.cls + (SWAP.includes(p.id) ? ' swap' : ''); html = g.html; }
      const next = (pages[i + 1] || {}).name || '';
      return `<div class="fs-slide" data-name="${p.id} · ${p.name}${STORY ? ' · Story' : ''}"><section class="slide ${cls}${STORY ? ' st9' : ''}" data-page="${p.id}" data-next="${next}">${html}</section></div>`;
    }).join('');
    document.body.appendChild(sheet);
    bind(sheet);
    // the logo is a CSS mask on the page, which Figma can't import: swap in the SVG itself so it arrives as a vector
    fetch('assets/real-logo.svg').then(r => r.text()).then(svg => {
      const clean = svg.replace(/<\?xml[^>]*>/, '').replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"');
      sheet.querySelectorAll('.logo').forEach(l => { l.style.background = 'none'; l.style.webkitMask = l.style.mask = 'none'; l.innerHTML = clean;
        const v = l.querySelector('svg'); if (v) { v.setAttribute('width', '100%'); v.setAttribute('height', '100%'); v.style.display = 'block'; } });
    });
    // grain canvases serialise as one big noise image per slide and push the capture past Figma's 50 MB limit
    sheet.querySelectorAll('canvas.grain').forEach(c => c.remove());
    if (window.Rings) Rings.renderAll(sheet);
    // Wrapped (V4): Figma can't import CSS masks or image filters, so the faded photo and art layers are baked to PNGs
    // first (?figma=V4&fmt=post&bake, scratchpad bake.mjs) and swapped in here (&baked). Each baked PNG is full-slide size.
    if (q.has('baked')) {
      const dir = `export/figma-bake/${STORY ? 'story' : 'post'}`;
      sheet.querySelectorAll('.fs-slide').forEach((fs, i) => {
        const id = String(i + 1).padStart(2, '0'), sl = fs.querySelector('.slide');
        const swapIn = (sel, kind) => { const el = sl.querySelector(sel); if (!el) return;
          const blend = getComputedStyle(el).mixBlendMode, op = getComputedStyle(el).opacity;
          const img = document.createElement('img'); img.className = 'abs baked'; img.alt = kind; img.src = `${dir}/${kind}-${id}.png`;
          img.style.cssText = `left:0;top:0;width:1080px;height:${H}px;mix-blend-mode:${blend};opacity:${op};z-index:${getComputedStyle(el).zIndex === 'auto' ? 0 : getComputedStyle(el).zIndex}`;
          el.replaceWith(img); };
        swapIn('.photo:not(.topic)', 'photo'); swapIn('.mg-ill', 'art');
      });
    }
    if (q.has('bake')) return;   // bake mode: no Figma capture script
    // the capture script reads its settings from the hash (#figmacapture=…)
    const s = document.createElement('script'); s.src = 'https://mcp.figma.com/mcp/html-to-design/capture.js'; s.async = true; document.head.appendChild(s);
  }
  document.readyState === 'complete' ? setTimeout(build, 50) : addEventListener('load', () => setTimeout(build, 50));
})();
