import sys, numpy as np
from PIL import Image
from scipy import ndimage
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(np.int16)
# near-white = background candidates; keep only the region connected to the image border
white = (a.min(axis=2) > 232) & ((a.max(axis=2) - a.min(axis=2)) < 18)
lab, n = ndimage.label(white)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = np.isin(lab, list(border))
# soften the edge: 1px feather
alpha = np.where(bg, 0, 255).astype(np.uint8)
edge = ndimage.binary_dilation(bg) & ~bg
alpha[edge] = 160
# trim to content
ys, xs = np.where(alpha > 0); pad = 20
y0, y1, x0, x1 = max(ys.min()-pad,0), min(ys.max()+pad, a.shape[0]), max(xs.min()-pad,0), min(xs.max()+pad, a.shape[1])
out = Image.fromarray(np.dstack([np.asarray(im), alpha])[y0:y1, x0:x1], 'RGBA')
side = int(max(out.size) / 0.94); sq = Image.new('RGBA', (side, side), (0,0,0,0)); sq.paste(out, ((side-out.size[0])//2, (side-out.size[1])//2))
sq.resize((900, 900), Image.LANCZOS).save(dst)
