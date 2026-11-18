"""Poster upload (Publish) for the Year in Review page. Used by serve.py; local only (localhost).

The page sends a list of posters to publish. This module renders them to JPGs with tools/shoot.mjs (Kamui dev Chrome),
copies the chosen reels, rebuilds the README gallery, and commits and pushes the posters repo
(laxman-real/year-in-review-posters, cloned next to this folder as "Year in Review Posters").

Folder layout in the posters repo:
  real/poster/post/01-cover.jpg   real/poster/story/...   real/glow/...   remax/poster/...   remax/glow/...
  reels/real-poster-v1.mp4 ...
  README.md (gallery, rebuilt on every upload)
"""
import json, os, shutil, subprocess, threading, time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_DIR = os.path.join(os.path.dirname(HERE), 'Year in Review Posters')
REPO_URL = 'https://github.com/laxman-real/year-in-review-posters'
NODE = os.path.expanduser('~/.nvm/versions/node/v24.16.0/bin/node')
START_CHROME = os.path.expanduser('~/Desktop/kamui/Tools/dev-chrome/start-chrome.sh')

# Only these sets are shared for now (Wrapped stays local until it's ready)
SETS = {'P1': 'poster', 'G1': 'glow'}
SET_TITLES = {'poster': 'Poster', 'glow': 'Glow'}
FMTS = {'post': 'Post 4:5', 'story': 'Story 9:16'}
BRANDS = {'real': 'Real', 'remax': 'REMAX'}
REELS = {  # repo name -> local file
    f'real-{name}-{ver}.mp4': f'media/yir-reel-{sid}{"" if ver == "v1" else "-v2"}.mp4'
    for sid, name in SETS.items() for ver in ('v1', 'v2')
}

STATE = {'running': False, 'step': '', 'done': 0, 'total': 0, 'log': [], 'commit': None, 'url': None, 'error': None, 'finished': None}
_lock = threading.Lock()


def info():
    reels = [{'name': n, 'label': f'{SET_TITLES[n.split("-")[1]]} · Version {n[-6:-4][1]}', 'ok': os.path.isfile(os.path.join(HERE, f))}
             for n, f in REELS.items()]
    return {'repo': REPO_URL, 'repoReady': os.path.isdir(os.path.join(REPO_DIR, '.git')),
            'sets': [{'id': k, 'name': v, 'title': SET_TITLES[v]} for k, v in SETS.items()],
            'fmts': FMTS, 'brands': BRANDS, 'reels': reels}


def status():
    with _lock:
        return dict(STATE, log=STATE['log'][-40:])


def _log(msg):
    with _lock:
        STATE['log'].append(time.strftime('%H:%M:%S ') + msg)
        STATE['step'] = msg


def _run(cmd, cwd=None, timeout=600):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise RuntimeError(f'{" ".join(cmd[:3])} failed: {(r.stderr or r.stdout).strip()[-400:]}')
    return r.stdout


def _chrome_up():
    import urllib.request
    try:
        urllib.request.urlopen('http://127.0.0.1:9333/json/version', timeout=2); return True
    except Exception:
        return False


def start(payload):
    """payload: {"items": [{"set": "P1", "fmt": "post", "brand": "real", "pages": ["01", ...] | "all"}],
                 "reels": ["real-poster-v1.mp4", ...], "message": "..."}"""
    with _lock:
        if STATE['running']:
            return {'ok': False, 'error': 'An upload is already running.'}
        items = [i for i in payload.get('items', []) if i.get('set') in SETS and i.get('fmt') in FMTS and i.get('brand') in BRANDS]
        reels = [r for r in payload.get('reels', []) if r in REELS]
        if not items and not reels:
            return {'ok': False, 'error': 'Nothing selected.'}
        msg = (payload.get('message') or '').strip() or 'Update posters'
        pages = sum(10 if i.get('pages') in (None, 'all') else len(i['pages']) for i in items)
        STATE.update(running=True, step='Starting', done=0, total=pages + len(reels), log=[], commit=None, url=None, error=None, finished=None)
    threading.Thread(target=_job, args=(items, reels, msg), daemon=True).start()
    return {'ok': True}


def _job(items, reels, msg):
    try:
        if not os.path.isdir(os.path.join(REPO_DIR, '.git')):
            _log('Cloning the posters repo')
            _run(['gh', 'repo', 'clone', REPO_URL, REPO_DIR])
        _log('Getting the latest from GitHub')
        _run(['git', 'pull', '--rebase', '--quiet'], cwd=REPO_DIR)
        if items and not _chrome_up():
            _log('Starting the Kamui dev Chrome')
            subprocess.run([START_CHROME], timeout=60)
        for it in items:
            name = SETS[it['set']]
            pages = 'all' if it.get('pages') in (None, 'all') else ','.join(it['pages'])
            out = os.path.join(REPO_DIR, it['brand'], name, it['fmt'])
            _log(f'Rendering {BRANDS[it["brand"]]} · {SET_TITLES[name]} · {FMTS[it["fmt"]]}')
            p = subprocess.Popen([NODE, os.path.join(HERE, 'tools', 'shoot.mjs'), out, it['set'], it['fmt'], it['brand'], pages],
                                 cwd=HERE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            for line in p.stdout:
                try:
                    f = json.loads(line)['file']
                    with _lock: STATE['done'] += 1
                    _log('Saved ' + os.path.relpath(f, REPO_DIR))
                except Exception:
                    pass
            if p.wait(timeout=300) != 0:
                raise RuntimeError('Rendering failed: ' + p.stderr.read().strip()[-400:])
        for r in reels:
            os.makedirs(os.path.join(REPO_DIR, 'reels'), exist_ok=True)
            shutil.copyfile(os.path.join(HERE, REELS[r]), os.path.join(REPO_DIR, 'reels', r))
            with _lock: STATE['done'] += 1
            _log('Copied reels/' + r)
        _log('Updating the gallery')
        _write_readme()
        _run(['git', 'add', '-A'], cwd=REPO_DIR)
        if not _run(['git', 'status', '--porcelain'], cwd=REPO_DIR).strip():
            _log('No changes: these posters are already up to date on GitHub')
        else:
            _log('Uploading to GitHub')
            _run(['git', 'commit', '-q', '-m', msg], cwd=REPO_DIR)
            _run(['git', 'push', '-q'], cwd=REPO_DIR, timeout=900)
            sha = _run(['git', 'rev-parse', '--short', 'HEAD'], cwd=REPO_DIR).strip()
            with _lock:
                STATE['commit'] = sha; STATE['url'] = f'{REPO_URL}/commit/{sha}'
            _log(f'Done: commit {sha}')
    except Exception as e:
        with _lock: STATE['error'] = str(e)
        _log('Error: ' + str(e))
    finally:
        with _lock:
            STATE['running'] = False; STATE['finished'] = time.time()


def _write_readme():
    """Rebuild README.md as a thumbnail gallery of everything in the repo."""
    L = ['# Year in Review posters', '',
         'Posters for the Leo Pro Year in Review, uploaded from the Year in Review page (Publish). '
         'Click any image to open it full size. Sample data. Internal: the REMAX versions use internal brand material.', '',
         f'Last update: {time.strftime("%d %b %Y, %H:%M")}', '']
    for brand, btitle in BRANDS.items():
        blocks = []
        for name, stitle in SET_TITLES.items():
            for fmt, ftitle in FMTS.items():
                d = os.path.join(REPO_DIR, brand, name, fmt)
                files = sorted(f for f in os.listdir(d) if f.endswith('.jpg')) if os.path.isdir(d) else []
                if not files: continue
                w = 150 if fmt == 'post' else 120
                cells = [f'<a href="{brand}/{name}/{fmt}/{f}"><img src="{brand}/{name}/{fmt}/{f}" width="{w}" alt="{f[:-4]}"></a>' for f in files]
                rows = [' '.join(cells[i:i + 5]) for i in range(0, len(cells), 5)]
                blocks += [f'### {stitle} · {ftitle}', ''] + [r + '<br>' for r in rows] + ['']
        if blocks:
            L += [f'## {btitle}', ''] + blocks
    rd = os.path.join(REPO_DIR, 'reels')
    reels = sorted(f for f in os.listdir(rd) if f.endswith('.mp4')) if os.path.isdir(rd) else []
    if reels:
        L += ['## Reels', ''] + [f'- [{f}](reels/{f})' for f in reels] + ['']
    open(os.path.join(REPO_DIR, 'README.md'), 'w').write('\n'.join(L))
