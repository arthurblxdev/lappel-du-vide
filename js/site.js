/* l’appel du vide — site vitrine
   Porté depuis la maquette Site.dc.html + Puzzle.dc.html (Claude Design) :
   pochette-puzzle, liste des titres, livret, lecteur plein écran, rivière de paroles en fond. */
(() => {
'use strict';

const N = 4; // la pochette est découpée sur une grille 4 × 4

const TRACKS = [
  { n: "01", title: "intro", file: "01-intro", dur: "2:08", accent: "#F2D9A0", meta: "2:08 · 120 BPM · RÉ",
    // quote : phrase-clé au dos de la pièce ; excerpt : paroles de secours du lecteur si paroles.md ne charge pas
    quote: "j’sais comment donner naissance et ôter la vie",
    excerpt: "enfant du divorce moi, j’aimais pas l’dimanche soir, grandi seul j’ai dû bâtir ma propre dimension",
    tile: [0, 0, 2, 1] },
  { n: "02", title: "vieux messages", file: "02-vieux-messages", dur: "1:43", accent: "#C8622A", meta: "1:43 · 132 BPM · FA",
    quote: "la seule vérité qui compte s’cache dans tes yeux dans les vieux messages",
    excerpt: "y’a beaucoup d’horreurs en ce monde, le seul qui peut t’sauver c’est toi",
    tile: [2, 0, 1, 1] },
  { n: "03", title: "sidehustle", file: "03-sidehustle", dur: "2:54", accent: "#F2E84D", meta: "2:54 · 75 BPM · FA♯",
    quote: "j’rêve de liasses, quitter le rivage",
    excerpt: "j’arrive en bout d’course, j’ai besoin d’respirer, moi j’aime espérer et voir où le vent nous pousse",
    tile: [3, 0, 1, 1] },
  { n: "04", title: "buisness model", file: "04-buisness-model", dur: "2:37", accent: "#7FE0A0", meta: "2:37 · 74 BPM · MI♭ MIN",
    quote: "le plus dur est pas passé, raison d’plus pour qu’on profite",
    excerpt: "c’est plus des barz’, c’est des business model, c’est plus un cerveau, c’est un système solaire",
    tile: [3, 1, 1, 1] },
  { n: "05", title: "l’appelduvide", file: "05-lappelduvide", dur: "1:36", accent: "#A9C8EA", meta: "1:36 · 120 BPM · FA♯ MIN",
    quote: "dérush un peu ma belle, le plus important c’est d’contempler",
    excerpt: "l’avenir est chatoyant, les couleurs du décor sont bien ternes, l’asile c’est dehors, ça fait bientôt 26 piges qu’on m’y interne",
    tile: [1, 1, 2, 2] },
  { n: "06", title: "imperméable", file: "06-impermeable", dur: "2:46", accent: "#B8652E", meta: "2:46 · 75 BPM · SI MIN",
    quote: "p’t’être que des sumériennes écrivaient déjà tes lèvres sur les miennes",
    excerpt: "l’temps passe j’m’habitue aux névroses à côtoyer mon côté sombre, le radeau sombrera pas, j’suis là pour assurer la flottaison",
    tile: [3, 2, 1, 2] },
  { n: "07", title: "long fleuve", file: "07-long-fleuve", dur: "2:14", accent: "#E0A33A", meta: "2:14 · 92 BPM · RÉ",
    quote: "et sur l’écran d’mes nuits blanches quand j’aurai quelques idées noires, j’ferai de toi ma vedette comme Nougaro dans le cinéma",
    excerpt: "mon ciel reprend des couleurs quand j’revois mes zins le soir",
    tile: [2, 3, 1, 1] },
  { n: "08", title: "sésame interlude", file: "08-sesame-interlude", dur: "1:50", accent: "#F2E9D8", meta: "1:50 · 74 BPM · SOL MIN",
    quote: "des heures devant la porte à crier sésame, et cette chienne s’est jamais ouverte",
    excerpt: "j’laisse mon reuf avec ses démons, j’rassemble les miens et j’décale",
    tile: [0, 3, 2, 1] },
  { n: "09", title: "dequoituparles!", file: "09-dequoituparles", dur: "1:30", accent: "#B8A0D0", meta: "1:30 · 126 BPM · MI MIN",
    quote: "j’essaie d’m’insérer dans une voie durable",
    excerpt: "avant j’étais maladroit maintenant l’aisance est maladive, j’rêve de ma femme fatale et d’nos vacances aux Maldives",
    tile: [0, 2, 1, 1] },
  { n: "10", title: "persephone", file: "10-persephone", dur: "3:15", accent: "#F0B8C8", meta: "3:15 · 110 BPM · LA♭ MIN",
    quote: "faut qu’j’l’enlève comme Hadès pour qu’elle fleurisse mon enfer comme Perséphone",
    excerpt: "j’suis dans un piège j’vois mes chances d’en sortir qui rétrécissent, mais j’peux m’en plaindre qu’à moi-même j’cueille que les roses aux plus belles épines",
    tile: [0, 1, 1, 1] },
];

// phrases de secours pour la rivière tant que paroles.md n’est pas chargé
const FALLBACK_RIVER = [
  "tout là-haut je ressens l’appel du vide, pour m’calmer je fabrique de la belle musique",
  "la vie c’est pas un long fleuve tranquille, on sait naviguer dans les trombes d’eau",
  "aujourd’hui tout va bien demain tu peux partir sans préavis",
  "des heures devant la porte à crier sésame et cette chienne s’est jamais ouverte",
];

const secs = d => { const [m, s] = d.split(':').map(Number); return m * 60 + s; };
TRACKS.forEach((t, i) => { t.i = i; t.seconds = secs(t.dur); t.img = `assets/singles/${t.file}.webp`; });

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const rgba = (hx, a) => `rgba(${parseInt(hx.slice(1, 3), 16)},${parseInt(hx.slice(3, 5), 16)},${parseInt(hx.slice(5, 7), 16)},${a})`;
const inView = r => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
// point de départ de l’envol : la vignette du livret si elle est visible, sinon l’élément cliqué
const rectOf = (n, fallbackEl) => {
  const th = document.querySelector(`[data-thumb="${n}"]`);
  const r = th && th.getBoundingClientRect();
  return r && inView(r) ? r : fallbackEl.getBoundingClientRect();
};

/* ---------- pochette en dix pièces ---------- */
const pct = (v, span) => N - span === 0 ? '0%' : (v / (N - span) * 100) + '%';

function renderPuzzle() {
  const grid = $('puzzle');
  TRACKS.forEach(t => {
    const [c, r, w, h] = t.tile;
    const tile = document.createElement('div');
    tile.className = 'tile' + (w * h > 1 ? ' tile-big' : ''); tile.dataset.n = t.n; tile.setAttribute('role', 'button'); tile.tabIndex = 0;
    tile.setAttribute('aria-label', `${t.n} ${t.title}`);
    tile.style.gridColumn = `${c + 1} / span ${w}`; tile.style.gridRow = `${r + 1} / span ${h}`;
    tile.innerHTML = `
      <div class="tile-in">
        <div class="tile-front" style="background-size:${N / w * 100}% ${N / h * 100}%;background-position:${pct(c, w)} ${pct(r, h)}">
          <span class="tile-title">${esc(t.title)}</span>
        </div>
        <div class="tile-back">
          <div class="tile-back-img" data-face="back-img" style="background-image:url(${t.img})"><span class="tile-hint">ÉCOUTER →</span></div>
          <div class="tile-back-txt">
            <span class="tile-quote">« ${esc(t.quote)} »</span>
          </div>
        </div>
      </div>`;
    const act = () => {
      // une pièce retournée s’ouvre dans le lecteur ; sinon elle se retourne
      if (tile.classList.contains('is-flipped')) { openPlayer(t.i, tile.querySelector('[data-face="back-img"]').getBoundingClientRect()); return; }
      tile.classList.add('is-flipped'); updateFlipAll();
    };
    tile.addEventListener('click', act);
    tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
    grid.appendChild(tile);
  });
}
const allTiles = () => [...document.querySelectorAll('.tile')];
const allFlipped = () => allTiles().every(t => t.classList.contains('is-flipped'));
function updateFlipAll() { $('flip-all').textContent = allFlipped() ? 'REMONTER LA POCHETTE' : 'TOUT RETOURNER'; }

/* ---------- titres et livret ---------- */
function renderTracklist() {
  const list = $('tracklist');
  TRACKS.forEach(t => {
    const a = document.createElement('a'); a.className = 'track'; a.href = '#pochette';
    a.innerHTML = `<span class="track-n">${t.n}</span><span class="track-title">${esc(t.title)}</span><span class="track-dur">${t.dur}</span>`;
    a.addEventListener('click', e => { e.preventDefault(); openPlayer(t.i, rectOf(t.n, a)); });
    list.appendChild(a);
  });
  const end = document.createElement('div'); end.className = 'track-end'; list.appendChild(end);
}
/* ---------- livret : dix cartes à foil (Site.dc.html) ----------
   La rangée se distribue quand elle entre à l’écran ; une carte se soulève au survol, un clic l’ouvre en grand. */
function renderCartes() {
  const row = $('cartes');
  TRACKS.forEach(t => {
    const c = document.createElement('div');
    c.className = 'carte'; c.dataset.thumb = t.n; c.setAttribute('role', 'button'); c.tabIndex = 0;
    c.setAttribute('aria-label', `carte ${t.title}`);
    c.style.backgroundImage = `url(${t.img})`;
    c.innerHTML = '<div class="carte-holo"></div><div class="carte-sheen"></div>';
    c.addEventListener('click', () => openCarte(t.i, c));
    c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCarte(t.i, c); } });
    row.appendChild(c);
  });
  const deal = () => TRACKS.forEach((t, i) => {
    const el = row.children[i];
    el.style.transitionDelay = (i * 70) + 'ms';
    el.classList.add('is-dealt');
    setTimeout(() => { el.style.transitionDelay = ''; }, 800 + i * 70);
  });
  if (!('IntersectionObserver' in window)) { deal(); return; }
  const obs = new IntersectionObserver(es => { if (es.some(x => x.isIntersecting)) { obs.disconnect(); deal(); } }, { threshold: .25 });
  obs.observe(row);
}

/* ---------- une carte ouverte en grand : un livret qu’on feuillette ----------
   Elle s’envole depuis sa place dans la rangée. Le foil (teinte, reflet, rayures) suit la souris ;
   un clic retourne la carte (au dos, les paroles et le bouton écouter) ; les chevrons, les flèches
   du clavier ou un glissé passent à la carte suivante. */
const vue = $('carte-vue'), scene = $('carte-scene'), flip = $('carte-flip');
const C = { open: null, el: null, rx: 0, ry: 0, slide: 0, busy: false, drag: null, closeT: null, stepT: null };
const clamp1 = v => Math.max(-1, Math.min(1, v));
const carteEl = i => $('cartes').children[i];
// la carte tient dans le cadre en gardant son format : bornée par la hauteur comme par la largeur
function carteBox() {
  const w = Math.min(Math.min(innerHeight * .78, 640) * 180 / 250, innerWidth * .84);
  const h = w * 250 / 180;
  return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2, width: w, height: h };
}
function setCarteBox(r) { scene.style.left = r.left + 'px'; scene.style.top = r.top + 'px'; scene.style.width = r.width + 'px'; scene.style.height = r.height + 'px'; }
function applyTilt() {
  scene.style.transform = `rotateX(${(-C.ry * 9).toFixed(2)}deg) rotateY(${(C.rx * 11).toFixed(2)}deg)` + (C.slide ? ` translateX(${C.slide}px)` : '');
}
function paintFoil() {
  const kx = C.rx, ky = C.ry;
  applyTilt();
  const holo = $('grande-holo');
  holo.style.background = `conic-gradient(from ${210 + kx * 90}deg at ${55 + kx * 30}% ${45 - ky * 30}%, #F0B8C8, #A9C8EA, #F2D9A0, #B8A0D0, #7FE0A0, #F0B8C8)`;
  holo.style.opacity = (.2 + Math.hypot(kx, ky) * .25).toFixed(3);
  $('grande-sheen').style.background = `linear-gradient(${105 + kx * 40}deg, rgba(255,255,255,0) ${28 + kx * 30}%, rgba(255,255,255,.34) ${46 + kx * 30}%, rgba(242,217,160,.3) ${50 + kx * 30}%, rgba(255,255,255,0) ${66 + kx * 30}%)`;
  $('grande-stripes').style.background = `repeating-linear-gradient(${60 + ky * 50}deg, rgba(255,255,255,0) 0 6px, rgba(255,255,255,.35) ${7 + kx * 3}px, rgba(255,255,255,0) 14px)`;
}
function fillCarte(t) {
  scene.querySelector('.carte-recto').style.backgroundImage = `url(${t.img})`;
  $('carte-titre').textContent = t.title; $('carte-quote').textContent = `« ${t.quote} »`;
  // au dos : les premiers vers du titre, un par ligne (à défaut, l’extrait de secours)
  $('verso-vers').textContent = P.lines && P.lines[t.i] ? P.lines[t.i].split('\n').slice(0, 5).join('\n') : t.excerpt;
}
function openCarte(i, el) {
  if (C.open != null) return;
  C.open = i; C.el = el; C.rx = 0; C.ry = 0; C.slide = 0;
  clearTimeout(C.closeT);
  flip.classList.remove('is-back');
  fillCarte(TRACKS[i]);
  vue.hidden = false; document.body.classList.add('no-scroll');
  scene.classList.remove('is-tilting', 'is-sliding'); scene.style.opacity = '1';
  paintFoil(); setCarteBox(el.getBoundingClientRect());
  void vue.offsetWidth;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (C.open !== i) return;
    vue.classList.add('is-open'); el.classList.add('is-open'); setCarteBox(carteBox());
  }));
  $('carte-close').focus({ preventScroll: true });
}
function closeCarte() {
  if (C.open == null) return;
  const el = C.el;
  C.open = null; C.rx = 0; C.ry = 0; C.slide = 0;
  clearTimeout(C.stepT); C.busy = false;
  scene.classList.remove('is-tilting', 'is-sliding', 'is-instant'); scene.style.opacity = '1';
  flip.classList.remove('is-back');
  paintFoil();
  vue.classList.remove('is-open'); setCarteBox(el.getBoundingClientRect());
  clearTimeout(C.closeT);
  C.closeT = setTimeout(() => { vue.hidden = true; document.body.classList.remove('no-scroll'); el.classList.remove('is-open'); }, 700);
  if (el.focus) el.focus({ preventScroll: true });
}
function flipCarte() { if (C.open != null && !C.busy) flip.classList.toggle('is-back'); }
// feuilleter : la carte sort d’un côté, la suivante entre de l’autre
function stepCarte(d) {
  if (C.open == null || C.busy) return;
  C.busy = true;
  const i = (C.open + d + TRACKS.length) % TRACKS.length;
  scene.classList.remove('is-tilting'); scene.classList.add('is-sliding');
  C.slide = -d * 44; applyTilt(); scene.style.opacity = '0';
  C.stepT = setTimeout(() => {
    C.el.classList.remove('is-open');
    C.open = i; C.el = carteEl(i); C.el.classList.add('is-open');
    flip.classList.remove('is-back');
    fillCarte(TRACKS[i]);
    scene.classList.add('is-instant');
    C.slide = d * 44; applyTilt();
    void scene.offsetWidth;
    scene.classList.remove('is-instant');
    C.slide = 0; applyTilt(); scene.style.opacity = '1';
    C.stepT = setTimeout(() => { scene.classList.remove('is-sliding'); C.busy = false; }, 300);
  }, 270);
}
// écouter depuis la carte : le lecteur s’ouvre en reprenant la carte grande ouverte
function ecouterCarte() {
  if (C.open == null) return;
  const i = C.open, r = scene.getBoundingClientRect(), el = C.el;
  clearTimeout(C.closeT); clearTimeout(C.stepT); C.busy = false;
  C.open = null; C.slide = 0;
  vue.classList.remove('is-open'); vue.hidden = true; el.classList.remove('is-open');
  flip.classList.remove('is-back');
  openPlayer(i, r);
}

/* ---------- l’objet : le livret et le vinyle ----------
   Porté de Prolongements.dc.html (1f vinyle 12 pouces, deux pressages). */
const PRESSAGES = [
  { key: 'noir', cover: 'assets/covers/vertige.webp', coverAlt: 'pochette vertige',
    label: 'VINYLE NOIR · 180 G · POCHETTE MATE + LIVRET 12×12', prix: '28 €', labelImg: 'assets/singles/05-lappelduvide.webp' }, // prix gardés mais pas affichés : pas de boutique
  { key: 'ambre', cover: 'assets/covers/horizon-solarise.webp', coverAlt: 'pochette horizon solarisé',
    label: 'VINYLE AMBRE TRANSLUCIDE · 300 EX NUMÉROTÉS · FOIL OR', prix: '38 €', labelTitre: 'l’appel du vide' },
];
function renderObjet() {
  $('pressages').innerHTML = PRESSAGES.map(p => `
    <article class="pressage pressage-${p.key}">
      <div class="pressage-vue">
        <div class="disque" aria-hidden="true">
          <div class="disque-plateau">
            <div class="disque-sillons"></div>
            <div class="disque-label">
              ${p.labelImg ? `<img src="${p.labelImg}" alt="" loading="lazy" decoding="async">` : ''}
              <span class="disque-face">LEV × SIMARD · FACE A</span>
              ${p.labelTitre ? `<span class="disque-titre">${esc(p.labelTitre)}</span>` : ''}
              <span class="disque-trou"></span>
            </div>
          </div>
          <div class="disque-reflet"></div>
        </div>
        <img class="pressage-pochette" src="${p.cover}" alt="${esc(p.coverAlt)}" loading="lazy" decoding="async">
      </div>
      <div class="pressage-ligne"><span>${esc(p.label)}</span></div>
    </article>`).join('');
}

/* ---------- lecteur ---------- */
const player = $('player'), pImg = $('p-img'), pLive = $('p-live'), pText = $('p-text');
const P = { open: 0, phase: 'closed', playing: false, elapsed: 0, liveOn: false, from: null, lines: null, tick: null, liveOff: null, closeT: null, switchT: null, liveSwitchT: null, glyphT: null,
  verses: null, times: null, now: -2, live: false, manual: 0, centerRaf: 0, stamps: null }; // verses… : paroles vivantes
let coverLive = null; // une seule instance <cover-live>, remontée/démontée pour ne pas multiplier les contextes WebGL

function layout() {
  const vw = innerWidth, vh = innerHeight, wide = vw > 820;
  const size = wide ? Math.min(vh * .72, vw * .42) : Math.min(vw * .7, vh * .42);
  const box = wide ? { left: vw * .07, top: (vh - size) / 2, width: size, height: size }
                   : { left: (vw - size) / 2, top: vh * .1, width: size, height: size };
  const text = wide ? { left: vw * .07 + size + 24, width: vw - (vw * .07 + size + 24) - vw * .04, top: null }
                    : { left: 0, width: vw, top: vh * .1 + size + 24 };
  return { box, text };
}
function setBox(r) { pImg.style.left = r.left + 'px'; pImg.style.top = r.top + 'px'; pImg.style.width = r.width + 'px'; pImg.style.height = r.height + 'px'; }
function placeText() {
  const { text } = layout();
  pText.style.left = text.left + 'px'; pText.style.width = text.width + 'px'; pText.style.top = text.top == null ? '' : text.top + 'px';
}

// smooth : changement de morceau lecteur ouvert → la pochette s’enchaîne en fondu, les textes sortent puis rentrent,
// la couleur d’accent et la lueur glissent (transition CSS sur --accent)
function applyTrack(smooth) {
  const t = TRACKS[P.open];
  $('p-index').textContent = `${t.n} / 10`;
  const st = $('p-static'), prev = $('p-static-prev');
  if (smooth && st.dataset.img && st.dataset.img !== t.img) {
    prev.style.backgroundImage = st.style.backgroundImage;                 // l’ancienne image reste dessous
    st.style.transition = 'none'; st.style.opacity = '0'; st.style.backgroundImage = `url(${t.img})`;
    void st.offsetWidth; st.style.transition = ''; st.style.opacity = '1'; // la nouvelle apparaît par-dessus
  } else st.style.backgroundImage = `url(${t.img})`;
  st.dataset.img = t.img;
  const meta = $('p-meta'); meta.style.color = t.accent;
  $('p-fill').style.background = t.accent; $('p-knob').style.background = t.accent;
  player.style.setProperty('--accent', t.accent);
  switchLive(t.n, smooth);
  const setText = () => {
    $('p-title').textContent = t.title; meta.textContent = t.meta; $('p-dur').textContent = t.dur;
    renderLyrics(); renderProgress(); if (P.playing) liveLyrics(true);
  };
  clearTimeout(P.switchT);
  if (smooth) { pText.classList.add('is-switching'); P.switchT = setTimeout(() => { setText(); pText.classList.remove('is-switching'); }, 330); }
  else { pText.classList.remove('is-switching'); setText(); }
}
// la pochette animée s’éteint le temps de changer de titre, puis revient sur le nouveau
function switchLive(n, smooth) {
  clearTimeout(P.liveSwitchT);
  if (!coverLive) return;
  if (!smooth || !P.liveOn) { coverLive.setAttribute('track', n); return; }
  pLive.style.transition = 'opacity .35s ease'; pLive.classList.remove('is-on');
  P.liveSwitchT = setTimeout(() => { coverLive.setAttribute('track', n); pLive.style.transition = ''; if (P.playing) pLive.classList.add('is-on'); }, 380);
}
function renderLyrics() {
  const t = TRACKS[P.open];
  const txt = (P.lines && P.lines[t.i]) || t.excerpt;
  const box = $('p-lyrics'); box.innerHTML = ''; box.scrollTop = 0;
  // un vers par ligne, tels qu’écrits dans paroles.md (pas de découpe sur la ponctuation)
  const vers = txt.split('\n').map(s => s.trim()).filter(Boolean);
  P.verses = vers.map((l, i) => {
    const s = document.createElement('span'); s.textContent = l;
    s.addEventListener('click', () => seekToVerse(i));
    box.appendChild(s); return s;
  });
  P.times = verseTimes(vers, t.seconds, stampsOf(t)); P.now = -2;
  liveLyrics(false);
}

/* ---------- paroles vivantes (Prolongements 1c) ----------
   Deux sources de calage. Les vers horodatés à la main (tools/horodatage.html → assets/brief/horodatage.json)
   servent d’ancres ; entre deux ancres — et sans horodatage du tout — chaque vers reçoit une part de la durée
   proportionnelle à sa longueur, entre une intro et une chute laissées à l’instrumental. Un clic sur un vers
   y déplace la lecture. */
const stampsOf = t => (P.stamps && P.stamps[t.n]) || null;
function verseTimes(vers, dur, stamps) {
  const w = vers.map(l => 14 + l.length);                 // 14 : le temps qu’un vers court prend quand même
  const cum = []; let acc = 0;
  for (const x of w) { cum.push(acc); acc += x; }
  const total = acc || 1;
  const lead = dur * .06, span = dur * .88;
  // points connus : (poids cumulé, temps). Les ancres viennent de l’horodatage, le reste est estimé.
  const pts = [];
  if (stamps) vers.forEach((_, i) => { const t = +stamps[i]; if (isFinite(t) && t >= 0) pts.push([cum[i], t]); });
  pts.sort((a, b) => a[0] - b[0]);
  if (!pts.length || pts[0][0] > 0) pts.unshift([0, pts.length ? Math.min(lead, pts[0][1]) : lead]);
  if (pts[pts.length - 1][0] < total) pts.push([total, Math.max(lead + span, pts[pts.length - 1][1] + 2)]);
  return cum.map(c => {
    let k = 0; while (k + 2 < pts.length && pts[k + 1][0] <= c) k++;
    const [c0, t0] = pts[k], [c1, t1] = pts[k + 1];
    return c1 === c0 ? t0 : t0 + (t1 - t0) * (c - c0) / (c1 - c0);
  });
}
// les vers horodatés à la main, s’il y en a
function loadStamps() {
  fetch('assets/brief/horodatage.json').then(r => r.ok ? r.json() : null).then(j => {
    if (!j || typeof j !== 'object') return;
    P.stamps = j;
    if (P.verses && P.verses.length) {
      const t = TRACKS[P.open];
      P.times = verseTimes(P.verses.map(el => el.textContent), t.seconds, stampsOf(t)); P.now = -2;
      if (P.live) focusVerse(true);
    }
  }).catch(() => {});
}
function verseAt(s) { const T = P.times; if (!T) return -1; let i = -1; while (i + 1 < T.length && T[i + 1] <= s) i++; return i; }
function liveLyrics(on) {
  P.live = !!on; $('p-lyrics').classList.toggle('is-live', P.live);
  if (P.live) focusVerse(true); else { cancelAnimationFrame(P.centerRaf); P.manual = 0; }
}
// le vers en cours s’allume ; avant le premier, c’est lui qui attend (cur = -1)
function focusVerse(force) {
  if (!P.verses || !P.verses.length) return;
  const cur = verseAt(P.elapsed);
  if (cur === P.now && !force) return;
  P.now = cur;
  P.verses.forEach((el, i) => {
    const d = i - cur;
    el.className = d === 0 ? 'is-now' : d === -1 ? 'is-p1' : d === -2 ? 'is-p2' : d < 0 ? 'is-past'
                 : d === 1 ? 'is-n1' : d === 2 ? 'is-n2' : 'is-next';
  });
  centerVerse(P.verses[Math.max(0, cur)]);
}
// La liste se recentre sur le vers en cours, sauf si on vient de la faire défiler à la main.
// Le vers grandit pendant sa transition, donc la cible bouge : on la suit image par image plutôt
// que de sauter deux fois (c’était le petit soubresaut d’une demi-seconde).
function centerVerse(el) {
  const box = $('p-lyrics');
  cancelAnimationFrame(P.centerRaf);
  if (!el || !P.live || Date.now() - P.manual < 6000) return;
  const doux = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fin = performance.now() + 900;
  const suivre = () => {
    if (!P.live || !el.isConnected || Date.now() - P.manual < 6000) return;
    const cible = el.offsetTop - box.offsetTop - box.clientHeight / 2 + el.offsetHeight / 2;
    const but = Math.max(0, Math.min(box.scrollHeight - box.clientHeight, cible));
    box.scrollTop += (but - box.scrollTop) * (doux ? .2 : 1);
    if (performance.now() < fin) P.centerRaf = requestAnimationFrame(suivre);
  };
  P.centerRaf = requestAnimationFrame(suivre);
}
function retimeVerses(dur) {
  if (!P.verses || !P.verses.length || audio.src !== `audio/${TRACKS[P.open].file}.mp3`) return;
  P.times = verseTimes(P.verses.map(el => el.textContent), dur, stampsOf(TRACKS[P.open])); P.now = -2;
  if (P.live) focusVerse(true);
}
function seekToVerse(i) {
  if (!P.times || P.times[i] == null) return;
  P.manual = 0;
  const dur = audio.el && isFinite(audio.el.duration) && audio.el.duration > 1 ? audio.el.duration : TRACKS[P.open].seconds;
  P.elapsed = Math.min(P.times[i], Math.max(0, dur - .5));
  audioSeek(P.elapsed); renderProgress(); liveLyrics(true); focusVerse(true);
}
function renderProgress() {
  const t = TRACKS[P.open]; const p = (100 * Math.min(1, P.elapsed / t.seconds)) + '%';
  $('p-fill').style.width = p; $('p-knob').style.left = p; $('p-elapsed').textContent = fmt(P.elapsed);
}

function openPlayer(i, rect) {
  if (P.phase !== 'closed') { setTrack(i); return; }
  P.open = i; P.elapsed = 0; P.playing = false; audioReset();
  P.from = rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : layout().box;
  clearTimeout(P.closeT);
  player.hidden = false; document.body.classList.add('no-scroll');
  applyTrack(); placeText(); setBox(P.from);
  P.phase = 'from';
  void player.offsetWidth; // pose l’état de départ avant de lancer les transitions
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (P.phase !== 'from') return;
    P.phase = 'open'; player.classList.add('is-open'); setBox(layout().box);
  }));
  if (!P.tick) P.tick = setInterval(onTick, 250);
  flashGlyph();
  $('p-play').focus({ preventScroll: true });
}
function closePlayer() {
  if (P.phase === 'closed') return;
  setPlaying(false);
  P.phase = 'from'; player.classList.remove('is-open'); setBox(P.from);
  clearTimeout(P.closeT);
  P.closeT = setTimeout(() => { P.phase = 'closed'; player.hidden = true; document.body.classList.remove('no-scroll'); }, 650);
}
function setTrack(i) {
  P.open = (i + TRACKS.length) % TRACKS.length; P.elapsed = 0;
  audioReset(); audioLoad(); applyTrack(P.phase === 'open');
  if (P.playing) audioPlay();
}
// le symbole play/pause se montre 2 s puis s’efface
function flashGlyph() { pImg.classList.add('glyph-on'); clearTimeout(P.glyphT); P.glyphT = setTimeout(() => pImg.classList.remove('glyph-on'), 2000); }
function setPlaying(on) {
  clearTimeout(P.liveOff); flashGlyph();
  const btn = $('p-play');
  player.classList.toggle('is-playing', on);
  if (on) {
    // la pochette animée est montée à opacité nulle, puis fondue pendant que la lecture démarre
    P.liveOn = true; mountLive();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!P.liveOn) return;
      P.playing = true; pLive.classList.add('is-on'); btn.textContent = 'PAUSE'; audioPlay(); liveLyrics(true);
    }));
  } else {
    P.playing = false; pLive.classList.remove('is-on'); btn.textContent = 'LECTURE'; audioPause(); pulseStop();
    P.liveOff = setTimeout(() => { P.liveOn = false; unmountLive(); }, 1500);
  }
}
function mountLive() {
  if (!coverLive) coverLive = document.createElement('cover-live');
  coverLive.setAttribute('track', TRACKS[P.open].n);
  if (!coverLive.isConnected) pLive.appendChild(coverLive);
}
function unmountLive() { if (coverLive && coverLive.isConnected) coverLive.remove(); }
function onTick() {
  if (!P.playing || P.phase !== 'open') return;
  const t = TRACKS[P.open];
  if (audio.state === 'ok') P.elapsed = audio.el.currentTime;
  else if (audio.state !== 'loading') { P.elapsed += .25; if (P.elapsed >= t.seconds) { setTrack(P.open + 1); return; } }
  renderProgress(); if (P.live) focusVerse();
}

/* ---------- audio, optionnel ----------
   Si audio/<fichier>.mp3 existe pour le titre, il est joué et pilote la barre ; sinon la lecture est simulée
   (progression au temps, pochette animée), comme dans la maquette. */
const audio = { el: null, state: 'none', src: '', pending: null }; // pending : position demandée avant que l’audio soit prêt
function audioEl() {
  if (audio.el) return audio.el;
  const a = new Audio(); a.preload = 'none';
  a.addEventListener('ended', () => { if (P.phase === 'open') setTrack(P.open + 1); });
  // durée réelle du fichier : on recale le minutage des paroles dessus
  a.addEventListener('loadedmetadata', () => { if (isFinite(a.duration) && a.duration > 1) retimeVerses(a.duration); });
  a.addEventListener('error', () => { audio.state = 'error'; });
  audio.el = a; return a;
}
function audioLoad() {
  const a = audioEl(); const src = `audio/${TRACKS[P.open].file}.mp3`;
  if (audio.src !== src) { audio.src = src; a.src = src; audio.state = 'none'; }
}
// nouveau titre ou réouverture : on repart du début et on oublie une position demandée pour l’ancien titre
function audioReset() { audio.pending = null; if (audio.el && audio.state === 'ok') audio.el.currentTime = 0; }
function audioPlay() {
  audioLoad(); if (audio.state === 'error') return;
  const a = audio.el; audio.state = 'loading';
  a.play().then(() => { audio.state = 'ok'; if (audio.pending != null) { a.currentTime = audio.pending; audio.pending = null; } pulseStart(); })
    .catch(e => { audio.state = e && e.name === 'AbortError' ? 'none' : 'error'; });
}
function audioPause() { if (audio.el && audio.state === 'ok') audio.el.pause(); }
function audioSeek(s) {
  // avant la première lecture (ou pendant que play() démarre), la position est gardée et posée dès que l’audio joue
  if (audio.el && audio.state === 'ok' && audio.el.readyState >= 1) { audio.el.currentTime = s; audio.pending = null; }
  else audio.pending = s;
}

/* ---------- pulsation ----------
   Pendant la lecture, la lueur du lecteur respire avec les drums : un analyseur Web Audio écoute les basses
   (40–220 Hz, grosse caisse et corps de la caisse claire), on isole ce qui dépasse du niveau moyen (les coups)
   et on en fait une enveloppe à attaque immédiate et retombée rapide, appliquée en échelle et opacité au halo. */
const glow = $('p-glow');
const pulse = { ctx: null, an: null, data: null, raf: null, base: -1, level: 0, out: 0 };
function pulseStart() {
  if (!audio.el || !glow) return;
  try {
    if (!pulse.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      pulse.ctx = new AC(); pulse.an = pulse.ctx.createAnalyser(); pulse.an.fftSize = 2048; pulse.an.smoothingTimeConstant = .35;
      pulse.ctx.createMediaElementSource(audio.el).connect(pulse.an); pulse.an.connect(pulse.ctx.destination);
      pulse.data = new Uint8Array(pulse.an.frequencyBinCount);
    }
    if (pulse.ctx.state === 'suspended') pulse.ctx.resume();
  } catch (e) { pulse.ctx = null; return; }
  glow.style.transition = '';
  if (!pulse.raf) pulse.raf = requestAnimationFrame(pulseFrame);
}
function pulseStop() {
  if (pulse.raf) cancelAnimationFrame(pulse.raf); pulse.raf = null; pulse.level = 0; pulse.out = 0;
  if (!glow) return;
  glow.style.transition = 'transform .6s ease, opacity .6s ease'; glow.style.transform = ''; glow.style.opacity = '';
}
function pulseFrame() {
  pulse.raf = null;
  if (!P.playing || audio.state !== 'ok' || P.phase !== 'open') { pulseStop(); return; }
  pulse.raf = requestAnimationFrame(pulseFrame);
  pulse.an.getByteFrequencyData(pulse.data);
  const hz = pulse.ctx.sampleRate / pulse.an.fftSize, lo = Math.max(1, Math.round(40 / hz)), hi = Math.round(220 / hz);
  let sum = 0; for (let i = lo; i <= hi; i++) sum += pulse.data[i];
  const bass = sum / ((hi - lo + 1) * 255);
  if (pulse.base < 0) pulse.base = bass;
  pulse.base += (bass - pulse.base) * .04;                      // niveau moyen des basses, lent
  const hit = Math.max(0, bass - pulse.base) * 4;                // ce qui dépasse : les coups
  pulse.level = Math.max(pulse.level * .86, Math.min(1, hit));   // enveloppe
  pulse.out += (pulse.level - pulse.out) * .45;
  const cs = getComputedStyle(glow), base = parseFloat(cs.getPropertyValue('--glow-base')) || .24, amp = parseFloat(cs.getPropertyValue('--glow-pulse')) || .14;
  glow.style.transform = `scale(${(1 + pulse.out * .1).toFixed(4)})`;
  glow.style.opacity = (base + pulse.out * amp).toFixed(3);
}

/* ---------- paroles ---------- */
function loadLyrics() {
  fetch('assets/brief/paroles.md').then(r => r.ok ? r.text() : Promise.reject(r.status)).then(md => {
    const lines = [], flat = [];
    for (const s of md.split(/\n## /).slice(1)) {
      const m = s.match(/^(\d\d)\.[^\n]*\n\n\*[^\n]*\*\n\n([\s\S]*)/);
      if (!m) continue;
      lines.push(m[2].trim());                          // un vers par ligne, pour le lecteur
      flat.push(m[2].replace(/\s+/g, ' ').trim());      // en un seul fil, pour la rivière
    }
    if (!lines.length) return;
    P.lines = lines;
    if (P.phase !== 'closed') renderLyrics();
    river.repaint(flat);
  }).catch(() => {});
}

/* ---------- rivière de paroles ----------
   Lignes de courant équidistantes d’un vortex perturbé ; les paroles courent dessus, mot à mot, sans se croiser.
   Peinte une fois sur un canvas 2048², posée en fond et mise en rotation par CSS. */
const river = (() => {
  const layer = $('river-tex');
  let src = FALLBACK_RIVER, ready = false;
  const density = 1;
  function paint() {
    const S = 2048, cv = document.createElement('canvas'); cv.width = S; cv.height = S; const ctx = cv.getContext('2d');
    const rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
    const field = (x, y) => {
      const dx = x - S / 2, dy = y - S / 2, r = Math.hypot(dx, dy) + 1;
      const s = Math.min(1.6, 420 / r) + 0.25;
      let vx = -dy / r * s, vy = dx / r * s;
      vx += 0.35 * Math.sin(y * 0.003) + 0.2 * Math.sin((x + y) * 0.0018);
      vy += 0.35 * Math.cos(x * 0.0026) + 0.2 * Math.sin(x * 0.0045);
      vx -= dx / r * 0.1; vy -= dy / r * 0.1;
      const n = Math.hypot(vx, vy) + 1e-6; return [vx / n, vy / n];
    };
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, S, S);
    const dsep = 46 / Math.max(.5, density), dtest = dsep * .55, step = 4, G = Math.ceil(S / dsep);
    const cells = Array.from({ length: G * G }, () => []);
    const near = (x, y, d, id) => {
      const gx = (x / dsep) | 0, gy = (y / dsep) | 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const cx = gx + ox, cy = gy + oy; if (cx < 0 || cy < 0 || cx >= G || cy >= G) continue;
        for (const p of cells[cy * G + cx]) if (p[2] !== id && Math.hypot(p[0] - x, p[1] - y) < d) return true;
      }
      return false;
    };
    const put = (x, y, id) => { const gx = (x / dsep) | 0, gy = (y / dsep) | 0; if (gx >= 0 && gy >= 0 && gx < G && gy < G) cells[gy * G + gx].push([x, y, id]); };
    const inside = (x, y) => x > 0 && y > 0 && x < S && y < S && Math.hypot(x - S / 2, y - S / 2) > 110;
    const lines = []; const queue = [[S * .3, S * .3]]; let id = 0;
    const trace = (x0, y0, dir, lid) => {
      const pts = []; let x = x0, y = y0;
      for (let k = 0; k < 1200; k++) {
        const [ux, uy] = field(x, y); x += ux * step * dir; y += uy * step * dir;
        if (!inside(x, y) || near(x, y, dtest, lid)) break;
        pts.push([x, y]); if (k % 3 === 0) put(x, y, lid);
      }
      return pts;
    };
    while (queue.length && lines.length < 900) {
      const [sx, sy] = queue.shift(); if (!inside(sx, sy) || near(sx, sy, dsep * .9, -1)) continue;
      const lid = id++; const fwd = trace(sx, sy, 1, lid), bwd = trace(sx, sy, -1, lid);
      const pts = bwd.reverse().concat([[sx, sy]], fwd); if (pts.length < 12) continue; put(sx, sy, lid);
      lines.push(pts);
      for (let k = 0; k < pts.length; k += Math.round(dsep / step)) {
        const p = pts[k], q = pts[Math.min(pts.length - 1, k + 1)]; const tx = q[0] - p[0], ty = q[1] - p[1], n = Math.hypot(tx, ty) || 1;
        queue.push([p[0] - ty / n * dsep, p[1] + tx / n * dsep]); queue.push([p[0] + ty / n * dsep, p[1] - tx / n * dsep]);
      }
    }
    // paroles posées mot à mot le long de chaque ligne
    let li = 0;
    for (const pts of lines) {
      const size = dsep * .58 + rnd(li) * dsep * .12; const gold = li % 9 === 4; li++;
      ctx.font = `italic 300 ${size}px 'Cormorant Garamond', Georgia, serif`;
      ctx.fillStyle = gold ? 'rgba(224,163,58,.30)' : 'rgba(243,235,221,.17)';
      const txt = src[li % src.length]; const words = txt.split(' '); let wi = Math.floor(rnd(li * 7) * words.length);
      const total = (pts.length - 1) * step; let pos = 6;
      const at = s => { const i = Math.min(pts.length - 2, Math.max(0, Math.floor(s / step))); const f = s / step - i; const p = pts[i], q = pts[i + 1]; return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f, q[0] - p[0], q[1] - p[1]]; };
      while (pos < total - 20) {
        const w = words[wi++ % words.length]; const ww = ctx.measureText(w).width; if (pos + ww > total - 6) break;
        for (const ch of w) {
          const cw = ctx.measureText(ch).width; const [x, y, tx, ty] = at(pos + cw / 2); const n = Math.hypot(tx, ty) || 1;
          ctx.setTransform(tx / n, ty / n, -ty / n, tx / n, x, y); ctx.fillText(ch, -cw / 2, size * .3); pos += cw;
        }
        pos += size * .28;
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    layer.style.backgroundImage = `url(${cv.toDataURL('image/png')})`;
  }
  const go = () => { ready = true; paint(); };
  return {
    start() { (document.fonts && document.fonts.load ? document.fonts.load("italic 300 24px 'Cormorant Garamond'").then(go, go) : go()); },
    repaint(lines) { src = lines; if (ready) paint(); },
  };
})();

/* ---------- la lumière : jour ou nuit (Site.dc.html) ----------
   Jour entre 10 h et 18 h chez le visiteur, nuit le reste du temps ; le switch de l’en-tête tranche.
   Les couleurs sont dans css/site.css, posées par data-heure sur <html>. */
const LUMIERES = ['jour', 'nuit'];
const heureDe = h => h >= 10 && h < 18 ? 'jour' : 'nuit';
let heurePick = null;                       // null : on suit l’heure locale
function renderHeures() {
  const nav = $('heures');
  LUMIERES.forEach(k => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'heure'; b.dataset.mode = k; b.textContent = k;
    b.addEventListener('click', () => { heurePick = k; applyHeure(); });
    nav.appendChild(b);
  });
}
// le voile du centre est fixe à l’écran : on recale le dégradé de la liste dessus à chaque défilement
let ombreRaf = null;
function majOmbre() {
  ombreRaf = null;
  const liste = $('tracklist');
  if (!liste || document.documentElement.dataset.heure !== 'jour') return;
  const r = liste.getBoundingClientRect();
  liste.style.setProperty('--ombre-x', (innerWidth * .5 - r.left) + 'px');
  liste.style.setProperty('--ombre-y', (innerHeight * .45 - r.top) + 'px');
}
function planOmbre() { if (!ombreRaf) ombreRaf = requestAnimationFrame(majOmbre); }
function applyHeure() {
  const key = heurePick || heureDe(new Date().getHours());
  document.documentElement.dataset.heure = key;
  [...$('heures').children].forEach(b => b.classList.toggle('is-on', b.dataset.mode === key));
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute('content', key === 'jour' ? '#F2D9A0' : '#07060C');
  planOmbre();
}

/* ---------- init ---------- */
renderHeures(); applyHeure(); setInterval(applyHeure, 30000);
renderPuzzle(); renderTracklist(); renderCartes(); renderObjet();
$('flip-all').addEventListener('click', () => { const all = allFlipped(); allTiles().forEach(t => t.classList.toggle('is-flipped', !all)); updateFlipAll(); });
$('carte-close').addEventListener('click', closeCarte);
vue.addEventListener('click', closeCarte);                       // hors de la carte : on referme
// le foil suit la souris (ou le doigt) sur toute la surface
vue.addEventListener('pointermove', e => {
  if (C.open == null || C.busy) return;
  C.rx = clamp1((e.clientX / innerWidth - .5) * 2); C.ry = clamp1((e.clientY / innerHeight - .5) * 2);
  scene.classList.add('is-tilting'); paintFoil();
});
// sur la carte : un clic la retourne, un glissé la fait tourner la page
scene.addEventListener('pointerdown', e => { C.drag = { x: e.clientX }; });
scene.addEventListener('click', e => {
  e.stopPropagation();
  const dx = C.drag ? e.clientX - C.drag.x : 0; C.drag = null;
  if (Math.abs(dx) > 60) stepCarte(dx < 0 ? 1 : -1); else flipCarte();
});
$('carte-prev').addEventListener('click', e => { e.stopPropagation(); stepCarte(-1); });
$('carte-next').addEventListener('click', e => { e.stopPropagation(); stepCarte(1); });
$('verso-play').addEventListener('click', e => { e.stopPropagation(); ecouterCarte(); });
$('p-close').addEventListener('click', closePlayer);
$('p-play').addEventListener('click', () => setPlaying(!P.playing));
// la pochette du lecteur lance et met en pause aussi
pImg.addEventListener('click', () => { if (P.phase === 'open') setPlaying(!P.playing); });
pImg.addEventListener('mousemove', () => { if (P.phase === 'open') flashGlyph(); });
pImg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (P.phase === 'open') setPlaying(!P.playing); } });
// faire défiler les paroles à la main suspend le recentrage automatique quelques secondes
['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach(ev => $('p-lyrics').addEventListener(ev, () => { P.manual = Date.now(); }, { passive: true }));
$('p-prev').addEventListener('click', () => setTrack(P.open - 1));
$('p-next').addEventListener('click', () => setTrack(P.open + 1));
$('p-seek').addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  P.elapsed = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * TRACKS[P.open].seconds;
  audioSeek(P.elapsed); renderProgress(); if (P.live) focusVerse(true);
});
document.addEventListener('keydown', e => {
  if (C.open != null) {
    if (e.key === 'Escape') closeCarte();
    else if (e.key === 'ArrowRight') stepCarte(1);
    else if (e.key === 'ArrowLeft') stepCarte(-1);
    return;
  }
  if (P.phase === 'closed') return;
  if (e.key === 'Escape') closePlayer();
  else if (e.key === 'ArrowRight') setTrack(P.open + 1);
  else if (e.key === 'ArrowLeft') setTrack(P.open - 1);
});
window.addEventListener('resize', () => {
  if (P.phase === 'open') { setBox(layout().box); placeText(); }
  if (C.open != null) setCarteBox(carteBox());
  planOmbre();
});
window.addEventListener('scroll', planOmbre, { passive: true });
loadLyrics(); loadStamps();
if ('requestIdleCallback' in window) requestIdleCallback(() => river.start(), { timeout: 1500 }); else setTimeout(() => river.start(), 200);
})();
