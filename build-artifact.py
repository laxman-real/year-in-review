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
  /* Same UI as the local page (Laxman, 17 Nov): no separate artifact theme. Only what the artifact frame needs:
     full-height sizing, and phone-width side gutters. */
  html, body { height: 100%; }
  .stage { height: 100%; }
  @media (max-width: 767px) {
    .bar, .row { padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
  }
</style>
"""

page = '<title>Year in Review</title>\n' + head.strip() + '\n' + ui + body.strip() + '\n'
# The artifact frame only keeps a plain #name in the address: make the hash writer a safe no-op there
page, n = re.subn(r"function saveHash\(\) \{.*?\n", "function saveHash() { try { if (!window.KamuiBar && /^(localhost|127)/.test(location.hostname)) history.replaceState(null, '', '#opt=' + view + (tgs() ? '&tg=' + tgs() : '')); } catch (e) {} }\n", page, count=1, flags=re.S)
assert n == 1, 'saveHash not found'

# Shared link shows Poster and Glow only (17 Nov): no Wrapped (wrapped.js is local). REMAX is included at Laxman's
# request (the handbook marks REMAX material internal: keep this link's sharing limited).
page = page.replace('<script src="wrapped.js"></script>', '')
# render, reel-render and Figma-capture helpers only run locally; leave them off the link (they 404 there)
for tag in ('<script src="clock.js"></script>', '<script src="reel.js" defer></script>', '<script src="figma-sheet.js" defer></script>', '<script src="publish-ui.js" defer></script>'):
    assert tag in page, tag
    page = page.replace(tag, '')

# Cache-bust: stamp every local css/js link so a republish always loads fresh files
import time
stamp = str(int(time.time()))
page = re.sub(r'(href|src)="((?:tokens|slides|motion|remax)\.css|[a-z]+\.js)"', lambda m: f'{m.group(1)}="{m.group(2)}?v={stamp}"', page)

os.makedirs(os.path.join(HERE, 'artifact'), exist_ok=True)
open(os.path.join(HERE, 'artifact', 'index.html'), 'w', encoding='utf-8').write(page)

FILES = {f: f for f in ['tokens.css', 'slides.css', 'content.js', 'grain.js', 'rings.js', 'motion.css', 'live.js', 'pages.js', 'flip.js', 'mock.js',
                        'fonts/PPTelegraf-Light.otf', 'fonts/PPTelegraf-Regular.otf', 'fonts/PPTelegraf-Ultrabold.otf',
                        'assets/real-logo.svg', 'remax.css', 'assets/remax/lockup-black.png', 'assets/remax/lockup-cream.png', 'assets/remax/ir-02.png', 'assets/remax/ir-03.png', 'assets/remax/ir-04.png', 'assets/remax/ir-05.png', 'assets/remax/ir-06.png', 'assets/remax/ir-07.png', 'assets/remax/ir-08.png', 'assets/remax/ir-09.png', 'assets/remax/ir-10.png', 'assets/remax/gl-02.jpg', 'assets/remax/gl-04.jpg', 'assets/remax/gl-06.jpg', 'assets/remax/gl-08.jpg', 'assets/remax/gl-10.jpg', 'assets/iphone17-pro-bezel.png', 'media/yir-reel-P1.mp4', 'media/yir-reel-G1.mp4', 'media/yir-reel-P1-v2.mp4', 'media/yir-reel-G1-v2.mp4', 'assets/agent.jpg', 'assets/agent-cutout.png',
                        'assets/pose-crossed-cutout.png', 'assets/pose-keys-cutout.png', 'assets/pose-point-cutout.png',
                        'assets/pose-laugh.jpg', 'assets/pose-crossed.jpg', 'assets/pose-keys.jpg', 'assets/gl-02.jpg', 'assets/gl-04.jpg', 'assets/gl-06.jpg', 'assets/gl-08.jpg', 'assets/gl-10.jpg', 'assets/ir-02.png', 'assets/ir-03.png', 'assets/ir-04.png', 'assets/ir-05.png', 'assets/ir-06.png', 'assets/ir-07.png', 'assets/ir-08.png', 'assets/ir-09.png', 'assets/ir-10.png', 'assets/hd-02.png', 'assets/hd-04.png', 'assets/hd-06.png', 'assets/hd-08.png', 'assets/hd-10.png', 'assets/hd-04.jpg', 'assets/ab-02.jpg', 'assets/ab-04.jpg', 'assets/ab-06.jpg', 'assets/ab-08.jpg', 'assets/ab-10.jpg']}
print(json.dumps(FILES))
