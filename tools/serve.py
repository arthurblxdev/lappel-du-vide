#!/usr/bin/env python3
"""Serveur de développement du site.

Équivalent de `python3 -m http.server`, avec en plus les requêtes Range (206 Partial Content) :
sans elles, Chrome et Safari refusent de se déplacer dans un MP3 et le lecteur repart du début
à chaque clic sur la barre. Usage : python3 tools/serve.py [port]   (8000 par défaut)
"""
import os
import re
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.md': 'text/markdown; charset=utf-8'}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def send_head(self):
        self.range = None
        header = self.headers.get('Range')
        path = self.translate_path(self.path)
        m = header and re.match(r'bytes=(\d*)-(\d*)$', header.strip())
        if not m or os.path.isdir(path) or not os.path.isfile(path):
            return super().send_head()
        size = os.path.getsize(path)
        first, last = m.group(1), m.group(2)
        if first == '':  # suffixe : les N derniers octets
            start, end = max(0, size - int(last or 0)), size - 1
        else:
            start = int(first)
            end = min(size - 1, int(last)) if last else size - 1
        if start > end or start >= size:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return None
        f = open(path, 'rb')
        f.seek(start)
        self.range = (start, end)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Last-Modified', self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        if not self.range:
            return super().copyfile(source, outputfile)
        remaining = self.range[1] - self.range[0] + 1
        while remaining > 0:
            chunk = source.read(min(65536, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)

    def log_message(self, fmt, *args):  # journal compact : méthode, chemin, statut
        sys.stderr.write('%s %s\n' % (self.log_date_time_string(), fmt % args))


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with ThreadingHTTPServer(('', port), Handler) as httpd:
        print(f'l’appel du vide → http://localhost:{port}/   (racine : {ROOT}, Ctrl-C pour arrêter)', flush=True)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
