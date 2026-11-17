# Recolour Year in Review art into the REMAX palette in code (no AI): warm and green hues -> Primary Red,
# cool hues -> Primary Blue; lightness and texture kept. Neutral (low saturation) pixels are left alone.
import sys, numpy as np
from PIL import Image
RED, BLUE = 4/360, 224/360           # #FF1200, #0043FF
def remap(h, mode):
    deg = h * 360
    if mode == 'wrapped':             # lime/green -> red; blue/navy stays blue
        warm = (deg < 170) | (deg > 300)
    else:                             # iridescent / glow: pink, orange, yellow -> red; blue, violet, cyan, green -> blue
        warm = (deg < 70) | (deg > 300)
    return np.where(warm, RED, BLUE)
def run(src, dst, mode):
    im = Image.open(src); has_a = im.mode in ('RGBA', 'LA')
    rgba = im.convert('RGBA'); a = np.asarray(rgba)[:, :, 3]
    hsv = np.asarray(rgba.convert('RGB').convert('HSV')).astype(np.float32) / 255
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    nh = remap(h, mode)
    k = np.clip((s - .12) / .18, 0, 1)        # blend in only where there is real colour
    dh = ((nh - h + .5) % 1) - .5
    h2 = (h + dh * k) % 1
    s2 = np.clip(s * (1 + .15 * k), 0, 1)
    out = Image.fromarray((np.dstack([h2, s2, v]) * 255).astype(np.uint8), 'HSV').convert('RGB')
    if has_a: out.putalpha(Image.fromarray(a))
    out.save(dst, quality=92) if dst.endswith('.jpg') else out.save(dst)
if __name__ == '__main__':
    run(sys.argv[1], sys.argv[2], sys.argv[3])
