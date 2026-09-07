# l’appel du vide — site vitrine

Site one-page de l’album **L’appel du vide** (Lev × Simard), porté depuis la maquette
`Site.dc.html` du projet Claude Design
<https://claude.ai/design/p/9068db7f-8b05-4c56-b67b-182459188d01?file=Site.dc.html>.

Sections : titre, la pochette en dix pièces (puzzle qui se retourne, borné à la hauteur
d’écran ; au dos, la phrase-clé du titre, ou seulement un bouton écouter sur mobile), les dix
titres, le livret, et un lecteur plein écran : la pochette du single s’anime en WebGL pendant
la lecture, un clic dessus lance ou met en pause, la lueur de fond respire avec les basses du
morceau (analyseur Web Audio sur les MP3), et le passage d’un titre à l’autre se fait en fondu
(image, textes, couleur d’accent). En fond, les paroles courent sur les lignes de courant d’un vortex.

## Lancer

Site statique, sans build. Il faut un serveur HTTP (les paroles et le composant WebGL
sont chargés par `fetch`) :

```
cd "l'appel du vide"
python3 tools/serve.py
```

puis ouvrir <http://localhost:8000/>. `python3 -m http.server` marche aussi, mais il ignore les
requêtes Range : le navigateur ne peut alors pas se déplacer dans un MP3 et la lecture repart du
début à chaque clic sur la barre. Tout hébergeur statique sérieux (Netlify, nginx, Apache, GitHub
Pages…) gère les Range ; `tools/serve.py` ne sert qu’au développement.

## Arborescence

```
index.html            page
css/site.css          styles (importe tokens/colors.css et tokens/texture.css)
js/site.js            puzzle, liste des titres, livret, lecteur, rivière de paroles
js/cover-live.js      <cover-live track="05"> — pochette rendue en direct (WebGL), copié du projet
assets/brief/paroles.md   paroles des 10 titres (rivière de fond, texture des pochettes animées, lecteur)
assets/pochette.webp      la pochette (vertige, sans titre) découpée par le puzzle, 1200 × 1200
assets/pochette-titre.jpg la pochette titrée, 1200 × 1200, pour og:image
assets/singles/*.webp     les 10 pochettes de singles, 1000 × 1000
audio/*.mp3               les 10 titres, masters v3.2, mêmes noms que les singles
tokens/               tokens du design system
tools/serve.py            serveur de développement (requêtes Range, indispensables au seek audio)
tools/capture.html        port de Capture.dc.html : une pochette en direct, 1000 × 1000, ?track=01…10, S enregistre le PNG (hors site)
tools/render-covers.html  outil de rendu des pochettes de secours en série (hors site)
```

## Images

Les visuels validés viennent de l’export du projet Claude Design (`exports/`, zip
« Réponses avant conception », 7 septembre 2026) : singles 3000 × 3000 PNG, images mères 1200 × 1200,
pochettes titrées 3000 × 3000. Trop lourds pour le web (11 à 19 Mo par single), ils sont
réencodés pour le site :

- `exports/singles/*.png` → `assets/singles/*.webp`, 1000 × 1000, `cwebp -q 88 -m 6 -sharp_yuv`
- `exports/album/vertige.png` → `assets/pochette.webp`, 1200 × 1200, `cwebp -q 90`
- `exports/covers/vertige-titre.png` → `assets/pochette-titre.jpg`, 1200 × 1200, JPEG 88 (og:image, lisible par tous les aperçus de liens)

Pour refaire une image fixe d’un titre à la main : ouvrir
<http://localhost:8000/tools/capture.html?track=03> (port de `Capture.dc.html`), attendre
le moment voulu de l’animation, appuyer sur **S** : un PNG 1000 × 1000 est téléchargé sous le
nom du single, à convertir en WebP avant de le poser dans `assets/singles/`.

## Audio

`audio/01-intro.mp3` … `audio/10-persephone.mp3` sont les masters v3.2 (« Album dans l’ordre »),
renommés comme les singles. Le lecteur les joue et la barre suit le son ; si un fichier manque,
la lecture de ce titre est simulée comme dans la maquette (progression au temps, pochette animée,
enchaînement).

## Mise en ligne

Le site est servi par Cloudflare Pages : <https://lappelduvide.pages.dev/> (projet `lappelduvide`,
compte Cloudflare arthur.blxdev@gmail.com, connexion par `npx wrangler login`). Pour redéployer,
depuis le dossier du site :

```
git commit -am "…"                       # les fichiers versionnés sont ceux publiés
npx -y wrangler pages deploy . --project-name lappelduvide --branch main --commit-dirty=true
```

Le dépôt <https://github.com/arthurblxdev/lappel-du-vide> garde l’historique ; GitHub Pages y sert
encore une copie sur <https://arthurblxdev.github.io/lappel-du-vide/>. `og:url` et `og:image` dans
`index.html` pointent sur pages.dev ; les changer si le site passe sur un domaine propre.
