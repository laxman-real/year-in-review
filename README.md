# Year in Review (HTML)

Leo Pro "Year in Review" carousel (LEO-2698, PRD-A-2450), designed in HTML instead of Figma (decided 6 Nov 2026).

- **Run:** the `year-in-review` entry in `kamui/.claude/launch.json` serves this folder at http://localhost:4100. Open it in the Kamui dev Chrome (port 9333).
- **Pages and copy:** `content.js`, taken from the Figma v1 carousel (node 173:353, sample data). 10 pages at 1080 × 1350: 01 Cover, 02 Deals closed, 03 Total volume, 04 Best month, 05 Biggest deal, 06 Top city, 07 Leaderboard, 08 Revenue share, 09 Cap, 10 Agents recruited. The v1 end slide (proposed, not in the PRD) is left out. Designs read their text from `YIR` so copy changes in one place.
- **Assets:** `assets/agent.jpg` (sample agent portrait, made with Higgsfield on 6 Nov) and `assets/agent-cutout.png` (background removed) and `assets/real-logo.svg` (uses `currentColor`).
- **Page select:** choose the page in the Kamui bar panel (Option), or press ← → to move between pages.
- **Versions:** each page shows its versions side by side; scroll sideways for more. Add one with `<template data-page="01" data-version="A" data-name="Bold type">…</template>` in `index.html`. Order in the file = order on screen.
- **Tokens and type:** `tokens.css`. The five palette colours (navy, ReZen blue, light, white, onyx). Fonts follow the LEO-pro-templates text styles only: PP Telegraf Light and Regular (display, titles), PP Telegraf Ultrabold for the Wrapped style, Inter Regular and Light (body, uppercase labels at 14% tracking). Telegraf from `fonts/`, Inter from Google Fonts.
- **Poses:** `assets/pose-*.jpg` and `-cutout.png` (crossed, laugh, keys, point), the same sample agent made with Higgsfield. Mapped in `content.js` under `agent.poses`.
- **Kamui bar:** the dev Chrome injector adds it; if it doesn't, the page loads its local copy `kamui-bar.js` (from `Bolt brain/Tools/kamui-bar`). Re-copy when the bar changes.
- **Grain backgrounds:** `grain.js` draws spray-paint backgrounds (soft shapes dithered with noise, seeded so they look the same every time). Use `<canvas class="abs grain" data-grain="preset" width="1080" height="1350">` and add presets in the file. A preset with no base colour is a transparent overlay (drawn over the person on cover E).
- `assets/` for photos and logos, `export/` for PNG exports.
- **Phone view and artifact:** under 768 px wide the page shows one version per screen (swipe sideways, dots, toolbar with page select and No photo). Private artifact: https://claude.ai/artifact/KaYcmqzbN2uSHcXDxwom7Z. To update it, run `python3 build-artifact.py` and republish `artifact/index.html` with the files it prints (fonts, assets, css, js).

## Current state (17 Nov 2026)

- **Versions:** P1 Poster and G1 Glow in this repo. V4 Wrapped is kept local for now: it lives in `wrapped.js` plus its art and reels (see `.gitignore`), and the page works without it.
- **Shared by all versions:** Each has Poster 4:5 and Story 9:16 sizes, an iPhone preview, and reels (Version 1 and Version 2 · icon motion) in `media/`.
- **Header switches:** Monocolor / Bicolor, Photo / No photo, and **Real / REMAX**. REMAX restyles every slide through `remax.css` (REMAX Brand Colors, Montserrat, the official lockup) and uses recoloured art from `assets/remax/`. Brand rules: `assets/remax/BRAND.md`.
- **Run locally:** `python3 serve.py 4100`, then open http://localhost:4100.

## Tools (`tools/`)

They need the Kamui dev Chrome running with remote debugging on port 9333, Node 24, and ffmpeg.

- `reels-wrapped.sh`, `reels-all.sh`: render reels frame by frame (`render2.mjs`, Chrome virtual time) and encode them with the music bed (`export/yir-reel-music-v1.mp3`) into `media/`.
- `bake.mjs` and `capw.mjs`: bake masked photo and art layers to PNGs and capture the editable Figma sheets (`?figma=SET&fmt=post|story`).
- `cut.py` (cut out illustrations on white) and `recolor.py` (REMAX recolour, done in code, never with AI) need Pillow, NumPy, and SciPy.

## Not in the repo

`export/` (renders, Figma bakes; rebuild with the tools), `artifact/` (built by `build-artifact.py`), and the retired reel Version 3 files.

## Internal

Private repo. PP Telegraf (`fonts/`) is a licensed font, and the REMAX handbook marks its material (`assets/remax/`) as internal use only. Do not make this repo public.
