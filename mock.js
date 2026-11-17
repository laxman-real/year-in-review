// Year in Review: iPhone 17 preview with Instagram UI (P1 Poster for now).
//   post  · the 4:5 slides as an Instagram feed carousel: swipe or use the arrows, dots, likes, caption
//   story · the 9:16 slides as Instagram stories: progress bars, tap left or right, auto-advance, reply bar
// index.html calls YIRMock.open({ slides, index, mode }) when a P1 page is clicked. The slides are cloned from the grid,
// so photo, Monocolor/Bicolor and live motion carry over. Esc, the close button or a click outside closes it.
(function () {
  const PW = 402, PH = 874;                         // iPhone 17 screen, in points
  const css = `
  .mk { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; gap: 36px;
    background: rgba(8,10,24,.72); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); animation: mk-in .25s ease both; }
  @keyframes mk-in { from { opacity: 0; } }
  .mk-x { position: absolute; top: 64px; right: 28px; width: 44px; height: 44px; border-radius: 50%; border: 0; background: rgba(255,255,255,.14); color: #fff; font: 400 22px/1 system-ui; cursor: pointer; }
  .mk-x:hover { background: rgba(255,255,255,.26); }
  .mk-nav { width: 48px; height: 48px; border-radius: 50%; border: 0; background: rgba(255,255,255,.14); color: #fff; font: 400 22px/1 system-ui; cursor: pointer; flex: none; }
  .mk-nav:hover { background: rgba(255,255,255,.26); }
  .mk-wrap { width: 450px; height: 920px; flex: none; transform-origin: center; }
  /* iPhone 17 Pro, Silver, Portrait bezel from the iOS 26 Figma kit (node 8411:12708): 450 x 920, screen at 24, 23 */
  .mk-phone { position: relative; width: 450px; height: 920px; filter: drop-shadow(0 40px 60px rgba(0,0,0,.45)); }
  .mk-bezel { position: absolute; inset: 0; width: 450px; height: 920px; pointer-events: none; z-index: 30; }
  .mk-screen { position: absolute; left: 24px; top: 23px; width: ${PW}px; height: ${PH}px; border-radius: 58px; overflow: hidden; background: #fff; color: #000;
    font: 400 13px/1.3 -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif; }
  .mk-island { position: absolute; left: 50%; top: 11px; width: 124px; height: 36px; margin-left: -62px; border-radius: 20px; background: #000; z-index: 20; }
  .mk-status { position: absolute; left: 0; right: 0; top: 0; height: 62px; z-index: 15; pointer-events: none; }
  .mk-status .mk-sb { display: block; }
  .mk-dark .mk-status { color: #fff; }
  .mk-dark .mk-screen { background: #000; color: #fff; }
  .mk-home { position: absolute; left: 50%; bottom: 8px; width: 134px; height: 5px; margin-left: -67px; border-radius: 3px; background: #000; z-index: 15; }
  .mk-dark .mk-home { background: #fff; }
  .mk-cap { color: rgba(255,255,255,.75); font: 400 13px/1.4 var(--font-body, system-ui); text-align: center; margin-top: 16px; }
  .mk-col { display: flex; flex-direction: column; align-items: center; }
  .mk svg { display: block; }
  /* feed post */
  .mk-ig { position: absolute; left: 0; right: 0; top: 62px; height: 44px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
  .mk-word { font: 400 30px/1 "Snell Roundhand", "Brush Script MT", cursive; letter-spacing: -.01em; }
  .mk-ig .r { display: flex; gap: 20px; }
  .mk-feed { position: absolute; left: 0; right: 0; top: 106px; bottom: 83px; overflow-y: auto; scrollbar-width: none; }
  .mk-feed::-webkit-scrollbar { display: none; }
  .mk-ph { display: flex; align-items: center; gap: 10px; height: 54px; padding: 0 12px; }
  .mk-av { width: 34px; height: 34px; border-radius: 50%; padding: 2px; background: conic-gradient(#feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75); flex: none; }
  .mk-av img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #fff; box-sizing: border-box; }
  .mk-dark .mk-av img { border-color: #000; }
  .mk-un { font-weight: 600; font-size: 13.5px; } .mk-sub { font-size: 11.5px; color: #737373; }
  .mk-dark .mk-sub { color: rgba(255,255,255,.75); }
  .mk-media { position: relative; width: ${PW}px; overflow-x: auto; overflow-y: hidden; display: flex; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
  .mk-media::-webkit-scrollbar { display: none; }
  .mk-cell { flex: none; width: ${PW}px; scroll-snap-align: start; overflow: hidden; position: relative; }
  .mk-cell .slide { pointer-events: none; }
  .mk-count { position: absolute; top: 12px; right: 12px; padding: 4px 9px; border-radius: 12px; background: rgba(0,0,0,.65); color: #fff; font: 500 12px/1 -apple-system, system-ui; z-index: 3; }
  .mk-act { display: flex; align-items: center; height: 46px; padding: 0 12px; gap: 16px; position: relative; }
  .mk-act .save { margin-left: auto; }
  .mk-dots { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; gap: 4px; }
  .mk-dots i { width: 6px; height: 6px; border-radius: 50%; background: #c7c7c7; transition: background .2s, transform .2s; }
  .mk-dots i.on { background: #0095f6; transform: scale(1.1); }
  .mk-txt { padding: 0 14px; font-size: 13.5px; line-height: 1.4; }
  .mk-txt b { font-weight: 600; } .mk-txt .m { color: #737373; margin-top: 4px; } .mk-txt .t { color: #737373; font-size: 11px; margin-top: 6px; text-transform: uppercase; letter-spacing: .02em; }
  .mk-tab { position: absolute; left: 0; right: 0; bottom: 0; height: 83px; display: flex; justify-content: space-around; padding-top: 12px; box-sizing: border-box; background: #fff; border-top: 1px solid #efefef; z-index: 5; }
  .mk-tab .me { width: 26px; height: 26px; border-radius: 50%; overflow: hidden; border: 2px solid #000; box-sizing: border-box; } .mk-tab .me img { width: 100%; height: 100%; object-fit: cover; }
  /* story */
  .mk-st { position: absolute; left: 0; top: 62px; width: ${PW}px; height: ${Math.round(PW * 1920 / 1080)}px; border-radius: 10px; overflow: hidden; background: #111; }
  .mk-st .slide { pointer-events: none; }
  .mk-bars { position: absolute; left: 8px; right: 8px; top: 8px; display: flex; gap: 3px; z-index: 4; }
  .mk-bars i { flex: 1; height: 2.5px; border-radius: 2px; background: rgba(255,255,255,.38); overflow: hidden; }
  .mk-bars i b { display: block; height: 100%; width: 0; background: #fff; }
  .mk-sh { position: absolute; left: 0; right: 0; top: 18px; height: 52px; display: flex; align-items: center; gap: 9px; padding: 0 12px; z-index: 4; color: #fff;
    text-shadow: 0 1px 2px rgba(0,0,0,.35); }
  .mk-sh .mk-av { width: 32px; height: 32px; padding: 0; background: none; } .mk-sh .mk-av img { border: 0; }
  .mk-sh .tm { opacity: .75; font-size: 13px; } .mk-sh .r { margin-left: auto; display: flex; gap: 18px; align-items: center; }
  .mk-st::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 110px; background: linear-gradient(rgba(0,0,0,.35), transparent); z-index: 3; pointer-events: none; }
  .mk-tapl, .mk-tapr { position: absolute; top: 70px; bottom: 0; z-index: 5; cursor: pointer; }
  .mk-tapl { left: 0; width: 35%; } .mk-tapr { right: 0; width: 65%; }
  /* Light | Dark switch for the post preview (Instagram's light and dark themes) */
  .mk-theme { display: inline-flex; gap: 2px; padding: 3px; margin-top: 12px; border-radius: 999px; background: rgba(255,255,255,.12); }
  .mk-theme button { height: 30px; padding: 0 16px; border: 0; border-radius: 999px; background: none; color: #fff; font: 400 13px/1 var(--font-body, system-ui); cursor: pointer; }
  .mk-theme button[aria-pressed="true"] { background: #fff; color: #0b0b12; }
  .mk-theme button:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
  .mk.mk-still { animation: none; }
  .mk-dark .mk-tab { background: #000; border-top-color: #262626; }
  .mk-dark .mk-tab .me { border-color: #fff; }
  .mk-dark .mk-sub, .mk-dark .mk-txt .m, .mk-dark .mk-txt .t { color: #a8a8a8; }
  .mk-dark .mk-dots i { background: #555; } .mk-dark .mk-dots i.on { background: #0095f6; }
  .mk-reply { position: absolute; left: 0; right: 0; top: ${62 + Math.round(PW * 1920 / 1080) + 10}px; display: flex; align-items: center; gap: 16px; padding: 0 14px; color: #fff; }
  .mk-reply .in { flex: 1; height: 44px; border: 1px solid rgba(255,255,255,.55); border-radius: 22px; display: flex; align-items: center; padding: 0 18px; font-size: 14px; color: rgba(255,255,255,.85); }
  `;
  let styleOn = false;
  const ICON = {
    heart: c => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9"><path d="M12 20.5s-7.5-4.6-9.2-9.1C1.6 8 3.6 4.5 7.1 4.5c2.1 0 3.6 1.2 4.9 3 1.3-1.8 2.8-3 4.9-3 3.5 0 5.5 3.5 4.3 6.9-1.7 4.5-9.2 9.1-9.2 9.1z"/></svg>`,
    comment: c => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linejoin="round"><path d="M20.5 12a8.5 8.5 0 1 1-3.4-6.8A8.4 8.4 0 0 1 20.5 12z"/><path d="M20.5 20.5l-2.3-3.6"/></svg>`,
    send: c => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linejoin="round"><path d="M21.5 3 10 13.5M21.5 3 15 21l-5-7.5L2.5 9z"/></svg>`,
    save: c => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V3.5h14z"/></svg>`,
    msg: c => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9"><path d="M12 2.5C6.6 2.5 2.5 6.4 2.5 11.6c0 2.8 1.2 5.2 3.2 6.8V22l3.2-1.8c1 .3 2 .4 3.1.4 5.4 0 9.5-3.9 9.5-9.1S17.4 2.5 12 2.5z"/><path d="M6.8 14.2l3.3-3.6 2.6 2 3.4-3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    home: c => `<svg width="26" height="26" viewBox="0 0 24 24" fill="${c}"><path d="M12 2.8 2.5 10v11.2h7v-6.5h5v6.5h7V10z"/></svg>`,
    search: c => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><circle cx="10.5" cy="10.5" r="7"/><path d="M15.8 15.8 21 21" stroke-linecap="round"/></svg>`,
    plus: c => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M12 8v8M8 12h8" stroke-linecap="round"/></svg>`,
    reels: c => `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><path d="M3 8.5h18M9 3l3 5.5M15 3l3 5.5"/><path d="M10 12v5l4.5-2.5z" fill="${c}" stroke="none"/></svg>`,
    dots: c => `<svg width="22" height="22" viewBox="0 0 24 24" fill="${c}"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>`,
    x: c => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.2" stroke-linecap="round"><path d="M5 5l14 14M19 5 5 19"/></svg>`,
  };
  // Status bar from the iOS 26 Figma kit (node 8447:12372), recoloured with currentColor
  const status = c => `<div class="mk-status" style="color:${c}"><svg class="mk-sb" width="402" height="62" viewBox="0 0 402 62" fill="none" xmlns="http://www.w3.org/2000/svg"> <g id="Status bar"> <g id="Time"> <path id="Time_2" d="M61.2666 26.4731C61.9085 26.4731 62.5173 26.5921 63.0928 26.8301C63.6683 27.0625 64.1774 27.4277 64.6201 27.9258C65.0684 28.4183 65.4198 29.0519 65.6743 29.8267C65.9289 30.5959 66.0562 31.5228 66.0562 32.6074V32.624C66.0562 33.9688 65.8625 35.1198 65.4751 36.0771C65.0877 37.0345 64.5316 37.7705 63.8066 38.2852C63.0872 38.7943 62.2267 39.0488 61.2251 39.0488C60.4891 39.0488 59.825 38.916 59.2329 38.6504C58.6463 38.3792 58.1593 38.0085 57.772 37.5381C57.3901 37.0622 57.1328 36.5199 57 35.9111L56.9834 35.8198H59.0835L59.1167 35.9028C59.2218 36.1795 59.3713 36.423 59.5649 36.6333C59.7642 36.8436 60.0021 37.0068 60.2788 37.123C60.561 37.2337 60.8765 37.2891 61.2251 37.2891C61.856 37.2891 62.3706 37.1037 62.769 36.7329C63.173 36.3566 63.4746 35.8558 63.6738 35.2305C63.8786 34.5996 63.9948 33.9023 64.0225 33.1387C64.028 33.0557 64.0308 32.9754 64.0308 32.8979C64.0308 32.8149 64.0308 32.7347 64.0308 32.6572L63.6572 30.6567C63.6572 30.203 63.5521 29.7907 63.3418 29.4199C63.1315 29.0492 62.8465 28.7559 62.4868 28.54C62.1326 28.3242 61.7314 28.2163 61.2832 28.2163C60.8516 28.2163 60.4559 28.3215 60.0962 28.5317C59.7365 28.742 59.4487 29.0298 59.2329 29.395C59.0171 29.7547 58.9092 30.1587 58.9092 30.6069V30.6235C58.9092 31.0884 59.0116 31.5007 59.2163 31.8604C59.4211 32.2145 59.7005 32.494 60.0547 32.6987C60.4089 32.9035 60.8128 33.0059 61.2666 33.0059C61.7204 33.0059 62.1271 32.9062 62.4868 32.707C62.8465 32.5078 63.1315 32.2311 63.3418 31.877C63.5521 31.5228 63.6572 31.1216 63.6572 30.6733V30.6567H64.1553V32.8647H63.8647C63.7209 33.1802 63.5078 33.4735 63.2256 33.7446C62.9434 34.0158 62.5947 34.2344 62.1797 34.4004C61.7702 34.5664 61.2887 34.6494 60.7354 34.6494C59.9717 34.6494 59.2965 34.4779 58.71 34.1348C58.1234 33.7917 57.6613 33.3213 57.3237 32.7236C56.9917 32.126 56.8257 31.4508 56.8257 30.6982V30.6816C56.8257 29.8682 57.0138 29.146 57.3901 28.5151C57.772 27.8787 58.2977 27.3807 58.9673 27.021C59.6424 26.6558 60.4089 26.4731 61.2666 26.4731ZM69.8247 37.1396C69.4484 37.1396 69.133 37.0151 68.8784 36.7661C68.6294 36.5116 68.5049 36.2017 68.5049 35.8364C68.5049 35.4657 68.6294 35.1558 68.8784 34.9067C69.133 34.6522 69.4484 34.5249 69.8247 34.5249C70.2065 34.5249 70.522 34.6522 70.771 34.9067C71.02 35.1558 71.1445 35.4657 71.1445 35.8364C71.1445 36.2017 71.02 36.5116 70.771 36.7661C70.522 37.0151 70.2065 37.1396 69.8247 37.1396ZM69.8247 30.9805C69.4484 30.9805 69.133 30.856 68.8784 30.6069C68.6294 30.3524 68.5049 30.0425 68.5049 29.6772C68.5049 29.3065 68.6294 28.9966 68.8784 28.7476C69.133 28.493 69.4484 28.3657 69.8247 28.3657C70.2065 28.3657 70.522 28.493 70.771 28.7476C71.02 28.9966 71.1445 29.3065 71.1445 29.6772C71.1445 30.0425 71.02 30.3524 70.771 30.6069C70.522 30.856 70.2065 30.9805 69.8247 30.9805ZM79.4038 38.75V36.4507H73.5435V34.6992C73.8589 34.1624 74.1743 33.6229 74.4897 33.0806C74.8107 32.5382 75.1344 31.9987 75.4609 31.4619C75.793 30.9196 76.1222 30.3856 76.4487 29.8599C76.7808 29.3286 77.11 28.8057 77.4365 28.291C77.7686 27.7708 78.1006 27.2645 78.4326 26.772H81.4458V34.6826H83.0645V36.4507H81.4458V38.75H79.4038ZM75.5356 34.7324H79.437V28.4819H79.3125C79.069 28.8582 78.8172 29.2456 78.5571 29.644C78.3026 30.0425 78.0452 30.4492 77.7852 30.8643C77.5251 31.2793 77.2677 31.6971 77.0132 32.1177C76.7586 32.5327 76.5068 32.9505 76.2578 33.3711C76.0088 33.7861 75.7681 34.1984 75.5356 34.6079V34.7324ZM88.02 38.75V28.8804H87.8706L84.8906 30.9805V28.9717L88.02 26.772H90.1533V38.75H88.02Z" fill="currentColor"/> </g> <g id="Levels"> <path id="Cellular Connection" fill-rule="evenodd" clip-rule="evenodd" d="M307.865 27.5331C307.865 26.9 307.388 26.3868 306.798 26.3868H305.732C305.143 26.3868 304.665 26.9 304.665 27.5331V37.467C304.665 38.1001 305.143 38.6133 305.732 38.6133H306.798C307.388 38.6133 307.865 38.1001 307.865 37.467V27.5331ZM300.431 28.8321H301.498C302.087 28.8321 302.564 29.3576 302.564 30.0059V37.4395C302.564 38.0878 302.087 38.6133 301.498 38.6133H300.431C299.842 38.6133 299.364 38.0878 299.364 37.4395V30.0059C299.364 29.3576 299.842 28.8321 300.431 28.8321ZM296.099 31.4812H295.033C294.444 31.4812 293.966 32.0134 293.966 32.6698V37.4246C293.966 38.0811 294.444 38.6132 295.033 38.6132H296.099C296.688 38.6132 297.166 38.0811 297.166 37.4246V32.6698C297.166 32.0134 296.688 31.4812 296.099 31.4812ZM290.798 33.9265H289.732C289.143 33.9265 288.665 34.4511 288.665 35.0982V37.4416C288.665 38.0887 289.143 38.6133 289.732 38.6133H290.798C291.388 38.6133 291.865 38.0887 291.865 37.4416V35.0982C291.865 34.4511 291.388 33.9265 290.798 33.9265Z" fill="currentColor"/> <path id="Wifi" fill-rule="evenodd" clip-rule="evenodd" d="M323.436 28.8021C325.924 28.8022 328.316 29.7243 330.118 31.3778C330.254 31.5054 330.471 31.5038 330.604 31.3742L331.902 30.1107C331.97 30.0449 332.007 29.9559 332.007 29.8632C332.006 29.7705 331.967 29.6818 331.899 29.6169C327.168 25.2421 319.704 25.2421 314.973 29.6169C314.905 29.6818 314.866 29.7704 314.865 29.8631C314.864 29.9558 314.902 30.0449 314.97 30.1107L316.268 31.3742C316.401 31.504 316.618 31.5056 316.754 31.3778C318.557 29.7242 320.949 28.8021 323.436 28.8021ZM323.433 33.0224C324.79 33.0223 326.099 33.534 327.105 34.4582C327.241 34.5893 327.456 34.5865 327.588 34.4517L328.876 33.1324C328.944 33.0632 328.981 32.9694 328.98 32.8718C328.979 32.7743 328.94 32.6812 328.871 32.6134C325.807 29.7225 321.062 29.7225 317.998 32.6134C317.929 32.6812 317.889 32.7743 317.889 32.8719C317.888 32.9695 317.925 33.0633 317.993 33.1324L319.28 34.4517C319.413 34.5865 319.627 34.5893 319.763 34.4582C320.769 33.5346 322.077 33.0229 323.433 33.0224ZM325.957 35.8159C325.959 35.9213 325.922 36.0228 325.855 36.0967L323.678 38.5514C323.615 38.6235 323.528 38.6641 323.437 38.6641C323.346 38.6641 323.259 38.6235 323.195 38.5514L321.018 36.0967C320.951 36.0228 320.914 35.9212 320.916 35.8158C320.918 35.7105 320.959 35.6107 321.029 35.5401C322.419 34.2262 324.455 34.2262 325.845 35.5401C325.915 35.6108 325.956 35.7106 325.957 35.8159Z" fill="currentColor"/> <g id="Frame"> <rect id="Border" opacity="0.35" x="339.507" y="26.5" width="24" height="12" rx="3.8" stroke="currentColor"/> <path id="Cap" opacity="0.4" d="M365.007 30.5V34.5755C365.812 34.2303 366.335 33.4273 366.335 32.5377C366.335 31.6481 365.812 30.8452 365.007 30.5Z" fill="currentColor"/> <rect id="Capacity" x="341.007" y="28" width="21" height="9" rx="2.5" fill="currentColor"/> </g> </g> </g> </svg> </div>`;

  // a slide clone scaled to the phone width; replays its entrance and break animation each time it is made
  function cloneSlide(src, w) {
    const c = src.cloneNode(true);
    c.querySelectorAll('.flip, .flip-fx, .wow, .wow-shine').forEach(e => e.remove());
    const box = document.createElement('div');
    box.style.cssText = `--scale:${(w / 1080).toFixed(4)};width:${w}px;height:${Math.round(w * (src.offsetHeight || 1350) / 1080)}px;position:relative;overflow:hidden`;
    box.appendChild(c);
    if (window.Grain) Grain.renderAll(box); if (window.Rings) Rings.renderAll(box);
    if (c.classList.contains('swap') && window.YIRFlip) requestAnimationFrame(() => YIRFlip.play(c));
    return box;
  }

  let theme = 'light';   // post preview theme; remembered for this viewer
  try { theme = localStorage.getItem('yirMockTheme') === 'dark' ? 'dark' : 'light'; } catch (e) {}
  function open({ slides, index = 0, mode = 'post', still = false }) {
    if (!styleOn) { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); styleOn = true; }
    close();
    const A = (window.YIR && YIR.agent) || {}, user = (A.name || 'agent').toLowerCase().replace(/[^a-z]+/g, '.'), photo = A.photo || '';
    const story = mode === 'story', dark = story || theme === 'dark', ink = dark ? '#fff' : '#000';
    const mk = document.createElement('div'); mk.className = 'mk' + (dark ? ' mk-dark' : '') + (still ? ' mk-still' : ''); mk.setAttribute('role', 'dialog'); mk.setAttribute('aria-label', 'iPhone preview');
    mk.innerHTML = `<button class="mk-x" aria-label="Close">✕</button><button class="mk-nav prev" aria-label="Previous">‹</button>
      <div class="mk-col"><div class="mk-wrap"><div class="mk-phone"><div class="mk-screen">${status(ink)}<i class="mk-island"></i><div class="mk-body"></div><i class="mk-home"></i></div><img class="mk-bezel" src="assets/iphone17-pro-bezel.png" alt=""></div></div>
      <div class="mk-cap">${story ? 'Instagram story · tap the right side for next, the left side for back' : 'Instagram post · swipe the carousel or use the arrows'}</div>
      ${story ? '' : `<div class="mk-theme" role="group" aria-label="App theme"><button type="button" data-t="light" aria-pressed="${!dark}">Light</button><button type="button" data-t="dark" aria-pressed="${dark}">Dark</button></div>`}</div>
      <button class="mk-nav next" aria-label="Next">›</button>`;
    document.body.appendChild(mk);
    const body = mk.querySelector('.mk-body'), wrap = mk.querySelector('.mk-wrap');
    const scale = () => { const k = Math.min(1, (innerHeight - 90) / 920, (innerWidth - 160) / 450); wrap.style.transform = `scale(${k.toFixed(3)})`; wrap.style.margin = `${(920 * (k - 1) / 2).toFixed(0)}px ${(450 * (k - 1) / 2).toFixed(0)}px`; };
    scale(); addEventListener('resize', scale); mk._off = () => removeEventListener('resize', scale);
    let i = Math.max(0, index), go;

    if (!story) {
      // feed post with a carousel of all slides
      body.innerHTML = `<div class="mk-ig"><span class="mk-word">Instagram</span><span class="r">${ICON.heart(ink)}${ICON.msg(ink)}</span></div>
        <div class="mk-feed"><div class="mk-ph"><span class="mk-av"><img src="${photo}" alt=""></span><div><div class="mk-un">${user}</div><div class="mk-sub">${A.brokerage || ''}</div></div><span style="margin-left:auto">${ICON.dots(ink)}</span></div>
          <div class="mk-media"></div>
          <div class="mk-act">${ICON.heart(ink)}${ICON.comment(ink)}${ICON.send(ink)}<span class="mk-dots">${slides.map(() => '<i></i>').join('')}</span><span class="save">${ICON.save(ink)}</span></div>
          <div class="mk-txt"><b>1,248 likes</b><div><b>${user}</b> My ${(window.YIR && YIR.year) || ''} at Real. Swipe to see my year 🏡✨</div><div class="m">View all 86 comments</div><div class="t">2 hours ago</div></div>
          <div style="height:24px"></div></div>
        <div class="mk-tab">${ICON.home(ink)}${ICON.search(ink)}${ICON.plus(ink)}${ICON.reels(ink)}<span class="me"><img src="${photo}" alt=""></span></div>`;
      const media = body.querySelector('.mk-media'), dots = [...body.querySelectorAll('.mk-dots i')];
      slides.forEach(s => { const cell = document.createElement('div'); cell.className = 'mk-cell'; cell.appendChild(cloneSlide(s, PW)); media.appendChild(cell); });
      const count = document.createElement('div'); count.className = 'mk-count'; body.querySelector('.mk-feed').insertBefore(count, media); count.style.cssText += `;position:absolute;top:${54 + 12}px`;
      const mark = k => { dots.forEach((d, j) => d.classList.toggle('on', j === k)); count.textContent = `${k + 1}/${slides.length}`; };
      let last = -1;
      media.addEventListener('scroll', () => {
        const k = Math.round(media.scrollLeft / PW); if (k === last) return; last = k; i = k; mark(k);
        const s = media.children[k] && media.children[k].querySelector('.slide.swap'); if (s && window.YIRFlip) YIRFlip.play(s);
      }, { passive: true });
      go = k => { i = Math.max(0, Math.min(slides.length - 1, k)); media.scrollTo({ left: i * PW, behavior: 'smooth' }); };
      requestAnimationFrame(() => { media.scrollLeft = i * PW; last = i; mark(i); });
    } else {
      // stories: one slide at a time, progress bars, tap zones, auto-advance
      body.innerHTML = `<div class="mk-st"><div class="mk-bars">${slides.map(() => '<i><b></b></i>').join('')}</div>
          <div class="mk-sh"><span class="mk-av"><img src="${photo}" alt=""></span><b class="mk-un" style="color:#fff">${user}</b><span class="tm">2h</span><span class="r">${ICON.dots('#fff')}${ICON.x('#fff')}</span></div>
          <div class="mk-stage"></div><i class="mk-tapl"></i><i class="mk-tapr"></i></div>
        <div class="mk-reply"><div class="in">Send message</div>${ICON.heart('#fff')}${ICON.send('#fff')}</div>`;
      const stage = body.querySelector('.mk-stage'), bars = [...body.querySelectorAll('.mk-bars b')];
      let anim = null;
      const show = k => {
        i = Math.max(0, Math.min(slides.length - 1, k));
        stage.innerHTML = ''; stage.appendChild(cloneSlide(slides[i], PW));
        bars.forEach((b, j) => { b.getAnimations().forEach(a => a.cancel()); b.style.width = j < i ? '100%' : '0'; });
        anim = bars[i].animate([{ width: '0%' }, { width: '100%' }], { duration: 6000, easing: 'linear', fill: 'forwards' });
        anim.onfinish = () => { if (i < slides.length - 1) show(i + 1); };
      };
      go = show;
      body.querySelector('.mk-tapl').onclick = () => show(i - 1);
      body.querySelector('.mk-tapr').onclick = () => show(i + 1);
      const st = body.querySelector('.mk-st');
      st.addEventListener('pointerdown', () => anim && anim.pause()); st.addEventListener('pointerup', () => anim && anim.play()); st.addEventListener('pointerleave', () => anim && anim.playState === 'paused' && anim.play());
      body.querySelector('.mk-sh .r svg:last-child').onclick = close;
      show(i);
    }
    // Light | Dark: rebuild the preview in the other theme at the same slide
    mk.querySelectorAll('.mk-theme button').forEach(b => b.onclick = () => {
      if (b.dataset.t === theme) return; theme = b.dataset.t; try { localStorage.setItem('yirMockTheme', theme); } catch (e) {}
      open({ slides, index: i, mode, still: true }); });
    mk.querySelector('.prev').onclick = () => go(i - 1);
    mk.querySelector('.next').onclick = () => go(i + 1);
    mk.querySelector('.mk-x').onclick = close;
    mk.addEventListener('click', e => { if (e.target === mk) close(); });
    mk._key = e => { if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); };
    addEventListener('keydown', mk._key);
  }
  function close() {
    document.querySelectorAll('.mk').forEach(m => { removeEventListener('keydown', m._key); m._off && m._off(); m.remove(); });
  }
  window.YIRMock = { open, close, ICON, status };   // ICON and status are reused by the reel viewer (index.html)
})();
