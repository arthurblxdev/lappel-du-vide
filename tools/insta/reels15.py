#!/usr/bin/env python3
"""Extraits de 15 s et paroles saccadées pour monter des reels — outil hors site.

Pour chaque titre :
- un extrait de 15 s qui s’ouvre un vers avant la phrase-clé (celle du dos de la pièce du puzzle,
  comme plan.py), calé sur un temps de la mesure ;
- les paroles découpées en fragments d’un à trois mots, chacun avec son début et sa fin. Les débuts
  de vers viennent de l’horodatage fait à la main (assets/brief/horodatage.json) ; à l’intérieur d’un
  vers, les fragments se partagent le temps au prorata de leurs syllabes, au débit propre au morceau ;
- les temps de la mesure dans l’extrait (pour caler les coupes du montage).

Sorties, dans le dossier donné (par défaut ~/Desktop/lappelduvide-reels-15s) :
  reels-15s.json        tout, en temps absolus et relatifs à l’extrait
  NN-titre.wav          l’extrait audio, 15 s, sans perte (décodé du MP3 master)
  NN-titre.srt          les fragments en sous-titres, temps relatifs à l’extrait
Le JSON est aussi copié dans tools/insta/reels-15s.json.

Usage : python3 tools/insta/reels15.py [dossier]
"""
import json
import os
import re
import subprocess
import sys
import unicodedata

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import plan  # noqa: E402  (titres du site, paroles, phrase-clé)

DUREE = 15.0
VOYELLES = 'aeiouyàâäéèêëîïôöùûüœæ'
COUPURE = re.compile(r'[,;:?!.…]$')


def syllabes(mot):
    """Syllabes chantées d’un mot, à la louche : groupes de voyelles, sans le e muet final."""
    m = unicodedata.normalize('NFC', mot.lower())
    m = re.sub(r"^(?:[a-z]['’])+", '', m)             # j’, d’, m’, qu’… ne comptent pas
    m = re.sub(r'[^a-zàâäéèêëîïôöùûüœæç]', '', m)
    if len(m) > 2:
        m = re.sub(r'(?<=[^aeiouyàâäéèêëîïôöùûüœæ])es?$', '', m)
    n = len(re.findall(f'[{VOYELLES}]+', m))
    return max(1, n) if re.search('[a-z0-9]', mot.lower()) else 0


def fragments(vers):
    """Découpe un vers en fragments d’un à trois mots : coupure aux virgules, aux mots longs,
    et dès qu’un fragment a deux mots ou trois syllabes."""
    mots = vers.split()
    out, cur = [], []
    for k, w in enumerate(mots):
        s = syllabes(w)
        if cur and s >= 3:                                # un mot long reste seul
            out.append(cur); cur = []
        cur.append(w)
        n_syl = sum(syllabes(x) for x in cur)
        if COUPURE.search(w) or s >= 3 or len(cur) >= 3 or (len(cur) >= 2 and n_syl >= 3):
            out.append(cur); cur = []
    if cur:
        out.append(cur)
    # pas de petit mot orphelin (« la », « pas ») : il rejoint le fragment suivant, ou le précédent en fin
    # de vers. Un vers d'un seul mot (la répétition « J'laisse, ») n'est pas touché
    k = 0
    while len(out) > 1 and k < len(out):
        f = out[k]
        if len(f) == 1 and syllabes(f[0]) <= 1:
            if k + 1 < len(out):
                out[k + 1] = f + out[k + 1]
            else:
                out[k - 1] = out[k - 1] + f
            del out[k]
            continue
        k += 1
    return [' '.join(f) for f in out]


def debit(times, vers, duree):
    """Secondes par syllabe, médiane sur les vers chantés d’un trait (écart au suivant < 4 s)."""
    r = []
    for i, v in enumerate(vers):
        fin = times[i + 1] if i + 1 < len(times) else duree
        s = sum(syllabes(w) for w in v.split())
        if s and fin - times[i] < 4:
            r.append((fin - times[i]) / s)
    return float(np.median(r)) if r else .2


def temps_mesure(rel, bpm):
    """Temps de la mesure du morceau, suivis par librosa autour du BPM annoncé."""
    import librosa
    y, sr = librosa.load(os.path.join(plan.ROOT, rel), sr=22050, mono=True)
    _, beats = librosa.beat.beat_track(y=y, sr=sr, start_bpm=bpm, units='time')
    return [float(b) for b in beats]


def srt(frags):
    def ts(s):
        ms = int(round(s * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); se, ms = divmod(ms, 1000)
        return f'{h:02d}:{m:02d}:{se:02d},{ms:03d}'
    return '\n'.join(f"{k}\n{ts(f['rel_debut'])} --> {ts(f['rel_fin'])}\n{f['texte']}\n" for k, f in enumerate(frags, 1))


def main():
    sortie = sys.argv[1] if len(sys.argv) > 1 else os.path.expanduser('~/Desktop/lappelduvide-reels-15s')
    os.makedirs(sortie, exist_ok=True)
    stamps = json.loads(plan.lire('assets/brief/horodatage.json'))
    par = plan.paroles()
    titres = []
    for t in plan.tracks_du_site():
        n = t['n']
        vers = [v.strip() for v in par[n][1] if v.strip()]
        times = [float(x) for x in stamps[n]]
        assert len(times) == len(vers) and all(b > a for a, b in zip(times, times[1:])), f'{n} : horodatage incomplet ou désordonné'
        rel = f"audio/{t['file']}.mp3"
        duree = plan.duree_audio(rel)
        bpm = int(re.search(r'(\d+) BPM', t['meta']).group(1))
        beats = temps_mesure(rel, bpm)

        # tous les fragments du morceau, au débit du morceau
        sps = debit(times, vers, duree)
        tous = []
        for i, v in enumerate(vers):
            suivant = times[i + 1] if i + 1 < len(times) else duree
            parts = fragments(v)
            syl = [max(1, sum(syllabes(w) for w in p.split())) for p in parts]
            chant = min(suivant - times[i] - .04, sum(syl) * sps * 1.1)   # le vers s’arrête avant le suivant
            cum = np.concatenate([[0], np.cumsum(syl)]) / sum(syl) * chant + times[i]
            tous += [{'vers': i, 'texte': p.rstrip(',;:'), 'debut': float(cum[k]), 'fin': float(cum[k + 1])} for k, p in enumerate(parts)]

        # la fenêtre : un temps de mesure avant le vers qui précède la phrase-clé. Elle ne coupe aucun
        # fragment : si le vers d’avant déborde, on recule d’un vers (jusqu’au début du refrain, par
        # exemple), tant que la phrase-clé reste dans les 8 premières secondes
        i_cle = plan.vers_de_la_phrase(vers, t['quote'])
        def ouverture(j):
            avant = [b for b in beats if b <= times[j] - .08]
            return avant[-1] if avant and times[j] - avant[-1] < 1.2 else max(0.0, times[j] - .25)
        j = max(0, i_cle - 1)
        debut = ouverture(j)
        coupe = lambda d: any(f['debut'] < d < f['fin'] - .05 for f in tous)
        while j > 0 and coupe(debut) and times[i_cle] - ouverture(j - 1) <= 8:
            j -= 1; debut = ouverture(j)
        if coupe(debut):                                  # pas de temps libre avant ce vers : on ouvre sur le vers même
            debut = max(0.0, times[j] - .03)
        debut = min(debut, duree - DUREE)
        fin = debut + DUREE
        frags = [{**f, 'debut': round(f['debut'], 3), 'fin': round(f['fin'], 3),
                  'rel_debut': round(max(0, f['debut'] - debut), 3), 'rel_fin': round(min(DUREE, f['fin'] - debut), 3)}
                 for f in tous if f['fin'] > debut + .05 and f['debut'] < fin - .15]

        nom = f"{n}-{t['file'][3:]}"
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{debut:.3f}', '-t', f'{DUREE:.3f}', '-i', os.path.join(plan.ROOT, rel),
                        '-map_metadata', '-1', '-c:a', 'pcm_s16le', '-ar', '44100', os.path.join(sortie, nom + '.wav')], check=True)
        with open(os.path.join(sortie, nom + '.srt'), 'w', encoding='utf-8') as fsrt:
            fsrt.write(srt(frags))
        titres.append({'n': n, 'titre': t['title'], 'bpm': bpm, 'audio': nom + '.wav', 'sous_titres': nom + '.srt',
                       'source': rel, 'debut': round(debut, 3), 'fin': round(fin, 3), 'duree': DUREE,
                       'phrase_cle': t['quote'], 'secondes_par_syllabe': round(sps, 3),
                       'temps_mesure': [round(b - debut, 3) for b in beats if debut <= b < fin],
                       'fragments': frags})
        print(f"{n} {t['title']:18s} {debut:6.2f} – {fin:6.2f} s · {len(frags):2d} fragments · {sps:.3f} s/syllabe", file=sys.stderr)

    doc = {'album': 'l’appel du vide', 'artiste': 'Lev × Simard',
           'note': 'extraits de 15 s ; debut/fin en secondes dans le morceau, rel_debut/rel_fin dans l’extrait. '
                   'Les débuts de vers sont horodatés à la main ; les fragments à l’intérieur d’un vers sont '
                   'répartis au prorata des syllabes (estimation, à retoucher à l’oreille au besoin). '
                   'temps_mesure : les temps de la mesure dans l’extrait, pour caler les coupes.',
           'titres': titres}
    for chemin in (os.path.join(sortie, 'reels-15s.json'), os.path.join(plan.HERE, 'reels-15s.json')):
        with open(chemin, 'w', encoding='utf-8') as f:
            json.dump(doc, f, ensure_ascii=False, indent=1)
    print(f'→ {sortie}', file=sys.stderr)


if __name__ == '__main__':
    main()
