#!/usr/bin/env python3
"""Build the claude.ai artifact version of the Year in Review page.

Reads index.html (the local page) and writes artifact/index.html: the same page without the document
skeleton (the artifact adds its own), with theme-aware colours for the review UI around the slides and
full-height sizing for the artifact frame. Slides, fonts, images, and scripts are published next to it
as supporting files (see FILES). Run it, then publish artifact/index.html with FILES.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'index.html'), encoding='utf-8').read()

head = re.search(r'<head>(.*?)</head>', src, re.S).group(1)
body = re.search(r'<body>(.*?)</body>', src, re.S).group(1)
head = re.sub(r'<meta[^>]*>\s*', '', head)
head = re.sub(r'<title>.*?</title>\s*', '', head)

ui = """<style>
  /* Review UI around the slides: follows the viewer's light or dark theme. Slides keep their own colours. */
  :root { --ui-bg: #e9ecf2; --ui-fg: #050e3d; --ui-muted: #5b6478; --ui-line: #c9cfdb; --ui-field: #ffffff; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ui-bg: #0b1030; --ui-fg: #e6ecff; --ui-muted: #9aa3c0; --ui-line: #2b3358; --ui-field: #141a3d; color-scheme: dark; } }
  :root[data-theme="dark"] { --ui-bg: #0b1030; --ui-fg: #e6ecff; --ui-muted: #9aa3c0; --ui-line: #2b3358; --ui-field: #141a3d; color-scheme: dark; }
  html, body { height: 100%; background: var(--ui-bg); color: var(--ui-fg); }
  .stage { height: 100%; }
  .page-title, .version-label { color: var(--ui-muted); }
  .page-title b { color: var(--ui-fg); }
  .bar button, .bar select { background: var(--ui-field); color: var(--ui-fg); border-color: var(--ui-line); }
  .bar button:focus-visible, .bar select:focus-visible { outline: 2px solid #4967fd; outline-offset: 2px; }
  .bar .photo[aria-pressed="true"] { background: var(--ui-fg); color: var(--ui-bg); border-color: var(--ui-fg); }
  .dots i { background: var(--ui-line); }
  @media (max-width: 767px) {
    .stage { height: 100%; }
    .version-label { color: var(--ui-fg); }
    .bar, .row { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  }
</style>
"""

page = '<title>Year in Review</title>\n' + head.strip() + '\n' + ui + body.strip() + '\n'
# The artifact frame only keeps a plain #name in the address: make the hash writer a safe no-op there
page, n = re.subn(r"function saveHash\(\) \{.*?\n", "function saveHash() { try { if (!window.KamuiBar && /^(localhost|127)/.test(location.hostname)) history.replaceState(null, '', '#opt=' + view + (tgs() ? '&tg=' + tgs() : '')); } catch (e) {} }\n", page, count=1, flags=re.S)
assert n == 1, 'saveHash not found'

# Cache-bust: stamp every local css/js link so a republish always loads fresh files
import time
stamp = str(int(time.time()))
page = re.sub(r'(href|src)="((?:tokens|slides|motion)\.css|[a-z]+\.js)"', lambda m: f'{m.group(1)}="{m.group(2)}?v={stamp}"', page)

os.makedirs(os.path.join(HERE, 'artifact'), exist_ok=True)
open(os.path.join(HERE, 'artifact', 'index.html'), 'w', encoding='utf-8').write(page)

FILES = {f: f for f in ['tokens.css', 'slides.css', 'content.js', 'grain.js', 'rings.js', 'motion.css', 'live.js', 'pages.js', 'flip.js', 'mock.js',
                        'fonts/PPTelegraf-Light.otf', 'fonts/PPTelegraf-Regular.otf', 'fonts/PPTelegraf-Ultrabold.otf',
                        'assets/real-logo.svg', 'assets/iphone17-pro-bezel.png', 'media/yir-reel-P1.mp4', 'media/yir-reel-G1.mp4', 'media/yir-reel-P1-v2.mp4', 'media/yir-reel-G1-v2.mp4', 'media/yir-reel-V4.mp4', 'media/yir-reel-V4-v2.mp4', 'assets/agent.jpg', 'assets/agent-cutout.png',
                        'assets/pose-crossed-cutout.png', 'assets/pose-keys-cutout.png', 'assets/pose-point-cutout.png',
                        'assets/pose-laugh.jpg', 'assets/pose-crossed.jpg', 'assets/pose-keys.jpg', 'assets/ill-01.png', 'assets/ill-02.png', 'assets/ill-03.png', 'assets/ill-04.png', 'assets/ill-05.png', 'assets/ill-06.png', 'assets/ill-07.png', 'assets/ill-08.png', 'assets/ill-09.png', 'assets/ill-10.png', 'assets/bg-02.jpg', 'assets/bg-04.jpg', 'assets/bg-06.jpg', 'assets/bg-08.jpg', 'assets/bg-10.jpg', 'assets/gl-02.jpg', 'assets/gl-04.jpg', 'assets/gl-06.jpg', 'assets/gl-08.jpg', 'assets/gl-10.jpg', 'assets/ir-02.png', 'assets/ir-03.png', 'assets/ir-04.png', 'assets/ir-05.png', 'assets/ir-06.png', 'assets/ir-07.png', 'assets/ir-08.png', 'assets/ir-09.png', 'assets/ir-10.png', 'assets/hd-02.png', 'assets/hd-04.png', 'assets/hd-06.png', 'assets/hd-08.png', 'assets/hd-10.png', 'assets/hd-04.jpg', 'assets/ab-02.jpg', 'assets/ab-04.jpg', 'assets/ab-06.jpg', 'assets/ab-08.jpg', 'assets/ab-10.jpg']}
print(json.dumps(FILES))
