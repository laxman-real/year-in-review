# Local server for Year in Review on localhost:4100 with HTTP Range support, so videos (media/*.mp4) stream and seek
# in Chrome. Python's plain http.server answers every request with the whole file, which stalls video loading.
# Run from this folder: python3 serve.py
import json, os, re, sys
import publish   # poster upload (Publish button): render, commit and push the posters repo
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class RangeHandler(SimpleHTTPRequestHandler):
    # ---- poster upload API (localhost only; the page must come from this server) ----
    def _json(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code); self.send_header('Content-Type', 'application/json'); self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

    def _same_origin(self):
        o = self.headers.get('Origin') or self.headers.get('Referer') or ''
        return re.match(r'^https?://(localhost|127\.0\.0\.1):%d(/|$)' % self.server.server_address[1], o) is not None

    def do_GET(self):
        if self.path.startswith('/api/publish/'):
            if self.path.startswith('/api/publish/info'): return self._json(200, publish.info())
            if self.path.startswith('/api/publish/status'): return self._json(200, publish.status())
            return self._json(404, {'error': 'unknown'})
        return super().do_GET()

    def do_POST(self):
        if self.path != '/api/publish/start': return self._json(404, {'error': 'unknown'})
        if not self._same_origin(): return self._json(403, {'error': 'Uploads only from the local Year in Review page.'})
        try:
            n = int(self.headers.get('Content-Length') or 0)
            payload = json.loads(self.rfile.read(n) or b'{}')
        except Exception:
            return self._json(400, {'error': 'Bad request'})
        r = publish.start(payload)
        return self._json(200 if r.get('ok') else 409, r)

    def send_head(self):
        rng = self.headers.get('Range')
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r'bytes=(\d*)-(\d*)', rng)
        size = os.path.getsize(path)
        start = int(m.group(1)) if m and m.group(1) else 0
        end = int(m.group(2)) if m and m.group(2) else size - 1
        end = min(end, size - 1)
        if start >= size:
            self.send_error(416); return None
        f = open(path, 'rb'); f.seek(start)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Accept-Ranges', 'bytes')
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        left = getattr(self, '_remaining', None)
        if left is None:
            return super().copyfile(source, outputfile)
        while left > 0:
            chunk = source.read(min(65536, left))
            if not chunk: break
            try: outputfile.write(chunk)
            except (BrokenPipeError, ConnectionResetError): break
            left -= len(chunk)

    def end_headers(self):
        if not self.headers.get('Range'):
            self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def log_message(self, *a): pass

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4100
    ThreadingHTTPServer(('127.0.0.1', port), RangeHandler).serve_forever()
