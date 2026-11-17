# Items 3D — un objet en volume par titre

Dix objets, un par titre de l’album, pour les carrousels du puzzle Instagram. Chaque objet est une petite scène en lancer de rayons (WebGL 1, GLSL ES 1.00), rendue en direct par `../item-3d.js` dans `<item-3d track="NN">`.

- `../item-3d.js` : le socle commun (palettes, texture des paroles, boucle, développement). On n’y touche pas pour régler un objet.
- `NN.js` : la scène du titre NN. **Un fichier par titre, c’est le seul fichier à modifier pour cet objet.**
- `../Item 3D.dc.html?track=NN&time=T` : un objet seul, plein cadre 3:4. `time` fige l’image à T secondes.
- `../Items 3D.dc.html` : la planche des dix.

## La référence de qualité : `03.js`, la lampe à lave

C’est l’objet validé. Ce qui le rend juste, et qui manque à un objet « bâclé » :

1. **On reconnaît l’objet tout de suite.** Proportions vraies, silhouette lisible en vignette. Pas une primitive (sphère, tore, plan) qui « représente » l’objet.
2. **Plusieurs matières, chacune avec sa réponse.** Le verre (liseré, reflet en strie, réfraction de ce qu’il y a dedans), le métal sombre (reflet court, il prend la lumière là où il touche le verre), la lave (éclairée par en dessous, plus chaude en bas).
3. **Une logique de lumière.** Une source identifiable (l’ampoule dans le socle), ce qu’elle éclaire, ce qu’elle laisse dans la nuit, la flaque de lumière au sol.
4. **L’objet est posé quelque part.** Un sol, un halo, de l’air autour. Rien ne flotte dans le vide sans raison.
5. **Les paroles sont dans la matière**, lisibles, à l’endroit, à une taille où on lit des mots : dans la lave, pas plaquées sur une surface.
6. **Pas d’artefact.** Pas de treillis visible, pas de facettes, pas de bandes, pas de moiré, pas de trou.

## Règles de DA (voir `../readme.md`)

- **Une seule valeur de lumière** par pixel (`v`, de 0 à 1), mappée sur la palette du single : `pal(v)` passe par 6 teintes, de la nuit (0) à la plus claire (1). Aucune couleur écrite en dur. Un seul accent possible (`gacc`, de 0 à 1, mélange vers `uAcc`), seulement pour 06.
- **Fond toujours nuit** (v ≈ 0,02). L’image vit par contraste : beaucoup de nuit, peu de lumière.
- **Aucun texte posé sur l’image** : pas de titre, pas de numéro, pas de légende. Les seuls mots sont les paroles, dans la matière.
- Solarisation possible (`#define FOLD` : au-dessus de 1, la valeur se replie, « le soleil devient un trou »). Grain et vignette sont ajoutés par le socle.
- Rien d’élastique, rien de « motion design » : mouvements lents, continus.
- **Format 3:4** (1080×1440 à l’export). L’objet tient dans le cadre avec de l’air autour, à tous les instants de la boucle et aux deux bouts du balancement de la caméra.
- **Boucle exacte de 16 s** : tout mouvement est fonction de `uPh` (0 → 1 sur la boucle) avec un nombre entier de cycles (`sin(W*uPh*n)`, `fract(uPh*n+…)`). L’image à `uPh = 0` et à `uPh = 1` est la même. `uTime` ne sert qu’au grain.

## Le contrat d’une scène

```js
(window.ITEM3D = window.ITEM3D || {})["NN"] = {
  glsl: `…`,                       // obligatoire : le GLSL de la scène (voir ci-dessous)
  txt: { font: "italic 44px Georgia, 'Times New Roman', serif", lh: 50, gap: 14 }, // optionnel : style des paroles dans la texture
  uniforms: (ph, t) => ({ uNom: ['1f', 0.5], uTab: ['4fv', new Float32Array(32)] }), // optionnel : uniformes calculés en JS à chaque image ('1f', '2fv', '3fv', '4fv', '1i'), à déclarer dans le GLSL
  main: true,                      // optionnel : la scène fournit son propre main() au lieu du main par défaut
};
```

### Ce que le socle déclare avant le GLSL de la scène

- Uniformes : `uText` (les paroles du titre, blanc sur noir, 2048×2048, se répète), `uTime`, `uPh`, `uPal[6]`, `uAcc`, `uRes`.
- Constante `W` = 2π. Globales : `gmin` (plus petite distance rencontrée par le rayon, pour les halos), `gacc` (accent), `gm` (matière, à écrire dans `map`).
- Fonctions : `hash(vec2)`, `hash3(vec3)`, `noise(vec2)`, `fbm(vec2)`, `pal(float)`, `T(vec2 uv)` (lit les paroles, 0 → 1), `rot(vec2,float)`, `smin(a,b,k)`, `box(p,b)`, `roundCone(p,r1,r2,h)`, `cone(p,h,r1,r2)`, `vue0(q,angle,distance,hauteur,cible,focale,out ro,out rd)` (caméra en orbite), `axe(c,ro,rd)` (distance du rayon à un point), `developpe(v,q,fold)` (vignette, grain, palette : la couleur finale).

### Ce que la scène doit définir (avec le main par défaut)

```glsl
#define PAS .9      // fraction de la distance parcourue à chaque pas (1. si map est une vraie distance, moins sinon)
#define FAR 9.      // au-delà, le rayon n'a rien touché
#define NST 100     // nombre de pas maximum
// #define FOLD     // optionnel : solarisation
void vue(vec2 q,out vec3 ro,out vec3 rd){ vue0(q,.42*sin(W*uPh),4.2,.5,vec3(0.),2.8,ro,rd); } // q : y de -1 à 1, x de -.75 à .75
float map(vec3 p){ … }                                  // distance signée à la scène ; écrire gm = matière
float surf(vec3 ro,vec3 rd,vec3 p,vec3 n){ … }          // valeur là où le rayon touche (n = normale) ; rappeler map(p) pour relire gm
float fond(vec3 ro,vec3 rd){ … }                        // valeur là où il ne touche rien (nuit, halo, sol analytique…)
```

`surf` peut relancer ses propres rayons (réfraction, reflet, ombre) : voir `03.js`. Avec `main: true`, la scène écrit son `void main()` et termine par `gl_FragColor=developpe(v,q,false);`.

Texte à l’endroit : `T(vec2(x,-y)*échelle+.5)` (le haut de la texture est le haut du texte). À l’échelle ×0,5 et une caméra à ~4 unités, une ligne de texte fait ~25 px sur 1080.

## Les outils de travail (hors projet)

Dans le dossier `scratchpad` de la session qui les a créés : `shot.sh NN TEMPS SORTIE.png` (une image, sans fenêtre, ~8 s, affiche les erreurs de shader), `planche.sh NN SORTIE.png` (quatre instants de la boucle côte à côte), `node perf.mjs NN` (temps de rendu d’une image sur le GPU). Budget : **12 ms par image au plus** à 745×993 (la lampe : 3,4 ms).
