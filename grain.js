// Grain spray backgrounds: soft shapes turned into speckled "spray paint" by dithering their blur with noise.
// Use in a design: <canvas class="abs grain" data-grain="cover-e" width="1080" height="1350"></canvas>
// A preset is a base colour (or none for a transparent overlay) plus layers of shapes in one colour each.
(function () {
  const C = { navy: '#050e3d', rezen: '#4967fd', light: '#ddebff', white: '#ffffff', onyx: '#1d1d1d' };

  function rng(seed) { // mulberry32: same speckle every render
    return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  function drawShape(ctx, s) {
    ctx.save(); ctx.translate(s.x, s.y); ctx.rotate((s.rot || 0) * Math.PI / 180); ctx.fillStyle = '#fff';
    if (s.type === 'blob') { ctx.beginPath(); ctx.ellipse(0, 0, s.rx, s.ry, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (s.type === 'rect') { ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h); }
    else { // 'plus' (4 arms) or 'star' (n arms, like the asterisk): arms are square-ended bars from the centre
      const arms = s.type === 'plus' ? 4 : (s.arms || 5);
      for (let i = 0; i < arms; i++) { ctx.save(); ctx.rotate(i * 2 * Math.PI / arms); ctx.fillRect(-s.t / 2, -s.len, s.t, s.len); ctx.restore(); }
      if (s.type === 'plus') ctx.fillRect(-s.t / 2, -s.t / 2, s.t, s.t);
    }
    ctx.restore();
  }

  function render(canvas, preset) {
    const W = canvas.width, H = canvas.height, out = canvas.getContext('2d');
    if (preset.base) { out.fillStyle = C[preset.base] || preset.base; out.fillRect(0, 0, W, H); } else out.clearRect(0, 0, W, H);
    const img = out.getImageData(0, 0, W, H), px = img.data;
    const off = document.createElement('canvas'); off.width = W; off.height = H; const ctx = off.getContext('2d');
    const rand = rng(preset.seed || 7);
    for (const layer of preset.layers) {
      ctx.clearRect(0, 0, W, H); ctx.filter = `blur(${layer.blur || 0}px)`;
      layer.shapes.forEach(s => drawShape(ctx, s));
      const a = ctx.getImageData(0, 0, W, H).data;
      const hex = (C[layer.color] || layer.color).slice(1);
      const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
      const k = layer.strength || 1;
      for (let i = 0; i < px.length; i += 4) {
        const d = (a[i + 3] / 255) * k;               // spray density from the blurred shape
        if (d > 0.002 && rand() < d) { px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255; }
      }
    }
    out.putImageData(img, 0, 0);
  }

  // ---------- presets ----------
  const P = {
    // 01 · E · Grain: ReZen field, soft navy plus behind the title, pale sprays top right, crisp white asterisk
    'cover-e': { base: 'rezen', seed: 11, layers: [
      { color: 'navy',  blur: 120, strength: .9, shapes: [{ type: 'blob', x: 1180, y: 820, rx: 260, ry: 520, rot: 10 }] },
      { color: 'navy',  blur: 34,  shapes: [{ type: 'plus', x: 300, y: 470, len: 250, t: 130, rot: 4 }] },
      { color: 'light', blur: 90,  shapes: [{ type: 'blob', x: 930, y: 90, rx: 400, ry: 210, rot: -18 }] },
      { color: 'white', blur: 70,  strength: .8, shapes: [{ type: 'blob', x: 1010, y: 40, rx: 170, ry: 90, rot: -18 }] },
      { color: 'white', blur: 5,   shapes: [{ type: 'star', arms: 5, x: 930, y: 420, len: 82, t: 40, rot: 12 }] },
    ] },
    // Overlay for the same cover: white spray across the bottom, drawn over the person
    'cover-e-front': { base: null, seed: 23, layers: [
      { color: 'light', blur: 80, shapes: [{ type: 'blob', x: 520, y: 1460, rx: 760, ry: 270 }] },
      { color: 'white', blur: 70, shapes: [{ type: 'blob', x: 360, y: 1470, rx: 620, ry: 230 }] },
      { color: 'white', blur: 60, shapes: [{ type: 'blob', x: 120, y: 1360, rx: 470, ry: 280, rot: -8 }] },
    ] },
    // 01 · B · Duotone, no photo: navy block with a ReZen spray plus and pale corner, behind the year
    'cover-b-np': { base: 'navy', seed: 31, layers: [
      { color: 'rezen', blur: 90,  shapes: [{ type: 'blob', x: 820, y: 240, rx: 420, ry: 260, rot: -14 }] },
      { color: 'rezen', blur: 34,  shapes: [{ type: 'plus', x: 300, y: 250, len: 210, t: 110, rot: -6 }] },
      { color: 'light', blur: 70,  strength: .7, shapes: [{ type: 'blob', x: 1050, y: 40, rx: 220, ry: 120, rot: -18 }] },
      { color: 'white', blur: 5,   shapes: [{ type: 'star', arms: 5, x: 860, y: 300, len: 70, t: 34, rot: 18 }] },
    ] },
    // Fine film grain over a light cover (G1): faint navy speckle everywhere
    'fine-noise': { base: null, seed: 41, layers: [
      { color: 'navy', blur: 0, strength: .016, shapes: [{ type: 'rect', x: 540, y: 675, w: 1080, h: 1350 }] },
    ] },
    // Light speckle on a dark cover (V8)
    'dark-noise': { base: null, seed: 57, layers: [
      { color: 'white', blur: 0, strength: .05, shapes: [{ type: 'rect', x: 540, y: 675, w: 1080, h: 1350 }] },
    ] },
  };

  window.Grain = { presets: P, colors: C,
    renderAll(root) { root.querySelectorAll('canvas[data-grain]').forEach(c => P[c.dataset.grain] && render(c, P[c.dataset.grain])); } };
})();
