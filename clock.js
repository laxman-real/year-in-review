// Render clock: only active when the URL hash has "render" (the reel renderer). It queues requestAnimationFrame
// callbacks so the renderer can run them once per captured frame (window.__tick), even if the tab is hidden.
// Time itself comes from Chrome's virtual time, so performance.now, timers and CSS animations stay in step.
(function () {
  if (!/render/.test(location.search + location.hash)) return;   // ?render (query) survives the Kamui bar's hash rewrite
  let q = [], idn = 0;
  window.requestAnimationFrame = cb => { q.push([++idn, cb]); return idn; };
  window.cancelAnimationFrame = id => { q = q.filter(([i]) => i !== id); };
  window.__tick = () => { const run = q; q = []; const now = performance.now(); run.forEach(([, cb]) => { try { cb(now); } catch (e) { console.error(e); } }); return run.length; };
})();
