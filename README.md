# l’appel du vide — site vitrine

Site one-page de l’album **L’appel du vide** (Lev × Simard), porté depuis la maquette
`Site.dc.html` du projet Claude Design
<https://claude.ai/design/p/9068db7f-8b05-4c56-b67b-182459188d01?file=Site.dc.html>.

Sections : titre, la pochette en dix pièces (puzzle qui se retourne, borné à la hauteur
d’écran ; au dos, la phrase-clé du titre, ou seulement un bouton écouter sur mobile), les dix
titres en zigzag avec le livret empilé à leur gauche, le vinyle en deux pressages, et un
lecteur plein écran : la pochette du single s’anime en WebGL pendant
la lecture, un clic dessus lance ou met en pause, la lueur de fond respire avec les basses du
morceau (analyseur Web Audio sur les MP3), et le passage d’un titre à l’autre se fait en fondu
(image, textes, couleur d’accent). En fond, les paroles courent sur les lignes de courant d’un vortex.

**Pas de label de section.** Les sections n’ont ni titre ni légende : la page ne montre que les
images, les titres des morceaux et la liste (numéro · titre · durée). Le reste des métadonnées —
tonalité, BPM, numéro sur les visuels — ne vit que dans le lecteur (`10 / 10`,
`3:15 · 110 BPM · LA♭ MIN`) : sur les pièces du puzzle et les cartes du livret, il ne reste que le
titre et la phrase-clé.

**La lumière suit l’heure locale du visiteur** (`Site.dc.html`, `Heure.dc.html`) : jour entre 10 h
et 18 h, nuit le reste du temps, et le switch `jour · nuit` de l’en-tête tranche. Le fond, l’encre
et les filets changent avec elle — de jour le site est inversé, encre nuit sur or. Le voile sombre du
centre, lui, ne bouge pas : à midi c’est lui qui creuse le vide au milieu de l’or, et les paroles de
la rivière y passent en clair. **La liste des titres se retourne en blanc quand elle
traverse cette ombre** : le dégradé qui la colore est posé sur la liste entière et découpé dans le
texte (`background-clip: text`), et `js/site.js` recale son centre à chaque défilement pour qu’il
reste calé sur le voile, qui lui est fixe à l’écran — les lignes basculent donc l’une après l’autre
quand on descend. Elle seule le fait, le reste de la page garde son encre nuit. L’en-tête permet de forcer une lumière (`heure locale · nuit · aube ·
jour · crépuscule`) ; les couleurs sont des variables CSS posées par `data-heure` sur `<html>`, la
transition dure 1,6 s.

Prolongements en place :

- **Le livret · dix cartes à foil** (`Site.dc.html`) — à gauche des titres, à la place de
  l’ancienne pochette : les dix cartes empilées en éventail, chacune ne laissant voir que son bord
  haut (la marge négative est en %, donc la pile suit la largeur de la colonne). Elles se
  distribuent quand la pile entre à l’écran et sortent de la pile au survol. Un clic ouvre une
  carte en grand : le foil (teinte holographique, reflet, rayures) suit la souris et la carte
  s’incline avec elle ; **un clic la retourne** (au dos, les premiers vers du titre et un bouton
  écouter qui ouvre le lecteur depuis la carte), **les chevrons, les flèches ← → et le glissé
  feuillettent** le livret sans le refermer. Clic à côté ou Échap pour refermer. Sur mobile la pile
  redevient une rangée qui se fait défiler à l’horizontale.
- **1c · paroles vivantes** (`Prolongements.dc.html`) — dans le lecteur, le vers en cours s’allume
  et grandit, les vers déjà passés s’étirent vers le haut en s’effaçant, ceux qui viennent restent
  en attente ; la liste se recentre seule, un clic sur un vers y déplace la lecture, la souris posée
  sur les paroles les rallume pour lire le texte entier. `paroles.md` n’ayant pas d’horodatage,
  les 545 vers de l’album ont été horodatés à la main avec `tools/horodatage.html` (ci-dessous) →
  `assets/brief/horodatage.json`, que le lecteur utilise comme ancres. Si un vers n’a pas de temps
  (paroles modifiées, titre pas encore fait), il se répartit entre les ancres voisines à la longueur,
  et sans fichier du tout le calage entier retombe sur cette estimation.
- **1f · le vinyle 12 pouces** (`Prolongements.dc.html`) — deux pressages (noir 180 g, ambre
  translucide 300 ex). Au survol, le disque sort de la pochette et se met à tourner, étiquette
  visible. Le livret 12 × 12 en trois finitions (1e) a été remplacé par les cartes à foil.

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
js/site.js            puzzle, liste des titres, cartes du livret, lecteur, rivière de paroles
js/cover-live.js      <cover-live track="05"> — pochette rendue en direct (WebGL), copié du projet
assets/brief/paroles.md   paroles des 10 titres (rivière de fond, texture des pochettes animées, lecteur)
assets/pochette.webp      la pochette (vertige, sans titre) découpée par le puzzle, 1200 × 1200
assets/pochette-titre.jpg la pochette titrée, 1200 × 1200, pour og:image
assets/singles/*.webp     les 10 pochettes de singles, 1000 × 1000
assets/covers/*.webp      les pochettes du vinyle sans titre (vertige, horizon solarisé), 1000 × 1000
audio/*.mp3               les 10 titres, masters v3.2, mêmes noms que les singles
tokens/               tokens du design system
functions/audio/[[file]].js  fonction Cloudflare Pages : sert les MP3 avec les requêtes Range (Pages les ignore sinon, le seek repart à zéro)
tools/serve.py            serveur de développement (requêtes Range, indispensables au seek audio)
tools/capture.html        port de Capture.dc.html : une pochette en direct, 1000 × 1000, ?track=01…10, S enregistre le PNG (hors site)
tools/horodatage.html     horodater les paroles en tapant sur ⏎ pendant la lecture, export JSON (hors site)
assets/brief/horodatage.json  temps de chaque vers des 10 titres (passe complète du 7 septembre 2026)
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
- `exports/album/{vertige,horizon-solarise}.png` → `assets/covers/*.webp`, 1000 × 1000, `cwebp -q 86 -m 6 -sharp_yuv` (pochettes des deux pressages vinyle, images mères sans titre)

Pour refaire une image fixe d’un titre à la main : ouvrir
<http://localhost:8000/tools/capture.html?track=03> (port de `Capture.dc.html`), attendre
le moment voulu de l’animation, appuyer sur **S** : un PNG 1000 × 1000 est téléchargé sous le
nom du single, à convertir en WebP avant de le poser dans `assets/singles/`.

## Horodater les paroles

Les dix titres sont horodatés (`assets/brief/horodatage.json`). Pour reprendre un titre — paroles
corrigées, calage à revoir — ouvrir
<http://localhost:8000/tools/horodatage.html> : choisir un titre, lancer la lecture (espace) et
appuyer sur **entrée** au début de chaque vers ; le vers suivant devient courant. `← →` déplacent le
curseur, `↑ ↓` recalent le vers de ± 0,1 s, `⌫` efface, un clic sur un vers s’y place. La frappe est
compensée de 0,10 s, le travail est gardé dans le navigateur, et **télécharger** produit le
`horodatage.json` à copier dans `assets/brief/`. Un titre à moitié fait suffit : les vers horodatés
servent d’ancres, les autres se répartissent entre elles.

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
