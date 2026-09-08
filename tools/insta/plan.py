#!/usr/bin/env python3
"""Plan des reels et des posts Instagram — outil hors site.

Lit les données du site (js/site.js pour les titres, phrases-clés, accents et métadonnées ;
assets/brief/paroles.md pour les vers ; assets/brief/horodatage.json pour leur calage) et écrit
tools/insta/plan.json, que reel.html, post.html et render.mjs consomment :

- pour chaque titre, la fenêtre de l’extrait du reel : elle s’ouvre un vers avant la phrase-clé
  (celle du dos de la pièce du puzzle) et se referme sur une fin de vers, ~22 s plus loin ;
- l’enveloppe des basses du morceau sur cette fenêtre, à la cadence du reel (la lueur du lecteur
  respire avec les basses ; sans Web Audio hors ligne, on la calcule ici avec ffmpeg + numpy) ;
- les vers horodatés de la fenêtre.

Usage : python3 tools/insta/plan.py            (réécrit plan.json en gardant les fenêtres déjà
        retouchées à la main : un titre dont « fenetre » vaut "manuelle" n’est pas recalculé)
"""
import json
import os
import re
import subprocess
import sys
import unicodedata

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.dirname(os.path.abspath(__file__))
PLAN = os.path.join(HERE, 'plan.json')
FPS = 30
DUREE_CIBLE = 22.0        # longueur visée d’un extrait, en secondes
DUREE_MIN, DUREE_MAX = 18.0, 27.0


def lire(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def tracks_du_site():
    """Les dix entrées de TRACKS dans js/site.js, sans exécuter le script."""
    js = lire('js/site.js')
    bloc = js[js.index('const TRACKS = ['):js.index('];', js.index('const TRACKS = ['))]
    out = []
    for m in re.finditer(r'\{\s*n:\s*"(\d\d)"[\s\S]*?tile:\s*\[[^\]]*\]\s*\}', bloc):
        e = m.group(0)
        champ = lambda k: re.search(k + r':\s*"([^"]*)"', e).group(1)
        out.append({'n': champ('n'), 'title': champ('title'), 'file': champ('file'), 'dur': champ('dur'),
                    'accent': champ('accent'), 'meta': champ('meta'), 'quote': champ('quote')})
    assert len(out) == 10, f'{len(out)} titres trouvés dans site.js'
    return out


def paroles():
    """{ "01": (émotion, [vers…]) } depuis paroles.md — même découpe que le lecteur."""
    out = {}
    for s in lire('assets/brief/paroles.md').split('\n## ')[1:]:
        m = re.match(r'^(\d\d)\.[^\n]*\n\n\*([^\n]*)\*\n\n([\s\S]*)', s)
        if m:
            out[m.group(1)] = (m.group(2), m.group(3).strip().split('\n'))
    return out


def duree_audio(rel):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0',
                        os.path.join(ROOT, rel)], capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def normalise(s):
    s = s.replace('’', "'").replace('‘', "'").lower()
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return set(re.findall(r"[a-z0-9]+", s))


def vers_de_la_phrase(vers, quote):
    """L’indice du vers où commence la phrase-clé : meilleur recouvrement de mots sur un ou deux vers."""
    q = normalise(quote)
    best, score = 0, -1.0
    for i in range(len(vers)):
        for span in (1, 2):
            mots = set().union(*(normalise(v) for v in vers[i:i + span]))
            sc = len(q & mots) / max(1, len(q)) - 0.02 * span   # à recouvrement égal, le vers seul gagne
            if sc > score:
                best, score = i, sc
    return best


def fenetre(times, i_cle, duree):
    """[début, fin] de l’extrait : un vers avant la phrase-clé, une fin de vers ~22 s plus loin."""
    t_cle = times[i_cle]
    debut = times[i_cle - 1] if i_cle > 0 and t_cle - times[i_cle - 1] < 7 else t_cle - 2.5
    debut = max(0.0, debut - 0.6)                                # un souffle avant le premier vers
    cible = debut + DUREE_CIBLE
    # la fin se cale sur le début d’un vers (le précédent s’achève juste avant), dans la marge admise
    candidats = [t for t in times if debut + DUREE_MIN <= t - 0.25 <= debut + DUREE_MAX]
    fin = min(candidats, key=lambda t: abs(t - cible)) - 0.25 if candidats else cible
    fin = min(fin, duree)
    if fin - debut < DUREE_MIN:                                  # fin de morceau : on recule le début sur un vers
        avant = [t for t in times if t <= fin - DUREE_CIBLE + 2]
        debut = max(0.0, (avant[-1] if avant else fin - DUREE_CIBLE) - 0.6)
    return round(debut, 2), round(fin, 2)


def enveloppe_basses(rel, debut, fin, fps=FPS):
    """Niveau des basses (40–220 Hz) par image, lissé comme dans js/site.js (pulseFrame), sur [0, 1]."""
    sr = 22050
    n = int(round((fin - debut) * sr))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{debut:.3f}', '-t', f'{fin - debut:.3f}', '-i', os.path.join(ROOT, rel),
                          '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)[:n]
    frames = int(round((fin - debut) * fps))
    win = 2048
    base, level, out, env = -1.0, 0.0, 0.0, []
    freqs = np.fft.rfftfreq(win, 1 / sr)
    band = (freqs >= 40) & (freqs <= 220)
    hann = np.hanning(win)
    for k in range(frames):
        c = int(k / fps * sr)
        seg = x[max(0, c - win // 2):c + win // 2]
        if len(seg) < win:
            seg = np.pad(seg, (0, win - len(seg)))
        spec = np.abs(np.fft.rfft(seg * hann))[band] / (win / 2)
        # comme getByteFrequencyData : dB entre -100 et -30 ramenés sur [0, 1], puis moyenne de la bande
        db = 20 * np.log10(spec + 1e-9)
        bass = float(np.clip((db + 100) / 70, 0, 1).mean())
        base = bass if base < 0 else base + (bass - base) * .04
        hit = max(0.0, bass - base) * 4
        level = max(level * .86, min(1.0, hit))
        out += (level - out) * .45
        env.append(round(out, 3))
    return env


def main():
    ancien = {}
    if os.path.exists(PLAN):
        with open(PLAN, encoding='utf-8') as f:
            ancien = {t['n']: t for t in json.load(f).get('titres', [])}
    stamps = json.loads(lire('assets/brief/horodatage.json'))
    par = paroles()
    titres = []
    for t in tracks_du_site():
        n = t['n']
        emotion, vers = par[n]
        times = [float(x) for x in stamps[n]]
        assert len(times) == len(vers), f'{n} : {len(vers)} vers, {len(times)} temps'
        rel = f"audio/{t['file']}.mp3"
        duree = duree_audio(rel)
        i_cle = vers_de_la_phrase(vers, t['quote'])
        prev = ancien.get(n, {})
        if prev.get('fenetre') == 'manuelle':
            debut, fin = prev['debut'], prev['fin']
        else:
            debut, fin = fenetre(times, i_cle, duree)
        # les vers de la fenêtre, avec un de contexte de chaque côté (ils s’effacent aux bords)
        idx = [i for i, x in enumerate(times) if debut - 6 <= x <= fin + 2]
        titres.append({
            **t, 'emotion': emotion, 'duree': round(duree, 2), 'nb_vers': len(vers),
            'vers_cle': i_cle, 'fenetre': prev.get('fenetre', 'auto'), 'debut': debut, 'fin': fin,
            'vers': [{'i': i, 't': times[i], 'texte': vers[i]} for i in idx],
            'premiers_vers': vers[:4],
            'basses': enveloppe_basses(rel, debut, fin),
        })
        print(f"{n} {t['title']:18s} phrase-clé au vers {i_cle + 1:2d} ({times[i_cle]:6.2f} s) → extrait {debut:6.2f} – {fin:6.2f} s ({fin - debut:4.1f} s)", file=sys.stderr)
    # le teaser de l’album : les dix pochettes à la suite, 3 s chacune, sur le titre éponyme
    t05 = next(t for t in titres if t['n'] == '05')
    fin = min(t05['duree'], round(float(stamps['05'][t05['vers_cle']]) - 12 + 30, 2))
    debut = round(max(0.0, fin - 30), 2)
    teaser = {'n': 'album', 'file': t05['file'], 'debut': debut, 'fin': fin, 'segments': [t['n'] for t in titres],
              'basses': enveloppe_basses(f"audio/{t05['file']}.mp3", debut, fin)}
    print(f"album (teaser)        {t05['title']} {debut:6.2f} – {fin:6.2f} s", file=sys.stderr)
    with open(PLAN, 'w', encoding='utf-8') as f:
        json.dump({'fps': FPS, 'titres': titres, 'teaser': teaser}, f, ensure_ascii=False, indent=1)
    print(f'→ {os.path.relpath(PLAN, ROOT)}', file=sys.stderr)


if __name__ == '__main__':
    main()
