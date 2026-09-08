#!/usr/bin/env node
/* Rendu des posts et des reels Instagram de l’appel du vide — outil hors site.

   Pilote Google Chrome (puppeteer-core, sans Chromium à télécharger) sur le serveur de dev :
   - les posts (1080 × 1350) sont des captures de post.html ;
   - les reels (1080 × 1920, 30 i/s) sont rendus image par image par reel.html — la pochette WebGL
     et les paroles y sont mises au temps de chaque image — puis montés avec l’extrait audio par ffmpeg.

   node tools/insta/render.mjs                    tout (posts + reels)
     --posts | --reels | --apercu                 seulement les posts, les reels, ou une image témoin par reel
     --only 05,07,album,tracklist                 filtrer par numéro de titre ou par nom de post
     --secondes 3                                 raccourcir les reels (pour tester)
     --out DIR                                    dossier de sortie (défaut : ../l'appel du vide — insta, à côté du site)
     --port 8765  --parallele 3  --garder  --visible  --pied "texte en bas à droite du reel"
   Prérequis : python3 (tools/serve.py, lancé au besoin), ffmpeg, Google Chrome, npm install dans tools/insta. */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const argv = process.argv.slice(2);
const flag = k => argv.includes('--' + k);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] != null && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const PORT = +opt('port', 8765), SECS = +opt('secondes', 0) || null, PAR = +opt('parallele', 3);
const OUT = path.resolve(opt('out', path.join(ROOT, '..', "l'appel du vide — insta")));
const ONLY = opt('only', '') ? opt('only', '').split(',') : null;
const doApercu = flag('apercu'), doPosts = flag('posts') || (!flag('reels') && !doApercu), doReels = flag('reels') || (!flag('posts') && !doApercu);
const BASE = `http://localhost:${PORT}/tools/insta/`;
const plan = JSON.parse(fs.readFileSync(path.join(HERE, 'plan.json'), 'utf8'));
const fps = plan.fps;
const log = (...a) => console.error(new Date().toTimeString().slice(0, 8), ...a);
const veut = nom => !ONLY || ONLY.some(k => nom.includes(k));

// le serveur de dev, s’il ne tourne pas déjà sur le port
async function serveur() {
  // node:http plutôt que fetch : l’undici de Node 26 peut planter (assert(!this.paused)) sur un serveur qui démarre
  const vivant = () => new Promise(r => { const q = http.get(BASE + 'plan.json', res => { res.resume(); r(res.statusCode === 200); }); q.on('error', () => r(false)); q.setTimeout(2000, () => { q.destroy(); r(false); }); });
  if (await vivant()) return () => {};
  const p = spawn('python3', [path.join(ROOT, 'tools', 'serve.py'), String(PORT)], { stdio: 'ignore' });
  for (let i = 0; i < 50 && !(await vivant()); i++) await new Promise(r => setTimeout(r, 100));
  if (!(await vivant())) throw new Error(`serveur injoignable sur le port ${PORT}`);
  log(`serveur de dev lancé sur le port ${PORT}`);
  return () => p.kill();
}

const POSTS = [
  ['album-nuit', 'post.html?type=album&heure=nuit'], ['album-jour', 'post.html?type=album&heure=jour'],
  ['tracklist-nuit', 'post.html?type=tracklist&heure=nuit'], ['tracklist-jour', 'post.html?type=tracklist&heure=jour'],
  ['vinyle-noir', 'post.html?type=vinyle&pressage=noir'], ['vinyle-ambre', 'post.html?type=vinyle&pressage=ambre'],
  ...plan.titres.flatMap(t => [
    [`single-${t.file}`, `post.html?type=single&n=${t.n}`],
    [`carte-${t.file}`, `post.html?type=carte&n=${t.n}`],
    [`citation-${t.file}-nuit`, `post.html?type=citation&n=${t.n}&heure=nuit`],
    [`citation-${t.file}-jour`, `post.html?type=citation&n=${t.n}&heure=jour`],
  ]),
];

async function rendrePosts(browser) {
  const page = await browser.newPage(); await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 });
  const dir = path.join(OUT, 'posts'); fs.mkdirSync(dir, { recursive: true });
  for (const [nom, url] of POSTS) {
    if (!veut(nom)) continue;
    await page.goto(BASE + url, { waitUntil: 'load', timeout: 120000 });
    await page.evaluate(() => window.post.ready);
    await page.screenshot({ path: path.join(dir, nom + '.png'), type: 'png' });
    log('post', nom);
  }
  await page.close();
}

// la scène du reel, prête au temps 0 ; on réessaie si le chargement traîne (les polices viennent de Google Fonts)
async function ouvrirReel(browser, n) {
  const pied = opt('pied', ''), url = BASE + 'reel.html' + (pied ? '?pied=' + encodeURIComponent(pied) : '');
  for (let essai = 1; ; essai++) {
    const page = await browser.newPage(); await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    page.on('pageerror', e => log(`[${n}] erreur page :`, e.message));
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 120000 });
      const info = await page.evaluate(n => window.reel.load(n), n);
      return { page, ...info };
    } catch (e) {
      await page.close().catch(() => {});
      if (essai >= 3) throw e;
      log(`[${n}] chargement raté (${e.message.split('\n')[0]}), nouvel essai ${essai + 1}/3`);
    }
  }
}
const nomReel = n => n === 'album' ? 'reel-00-album' : `reel-${plan.titres.find(t => t.n === n).file}`;

async function rendreApercu(browser, n) {
  const { page, dur } = await ouvrirReel(browser, n);
  const dir = path.join(OUT, 'apercus'); fs.mkdirSync(dir, { recursive: true });
  await page.evaluate(t => window.reel.frame(t), n === 'album' ? 4.2 : dur * .3);
  await page.screenshot({ path: path.join(dir, nomReel(n) + '.png'), type: 'png' });
  await page.close(); log('aperçu', nomReel(n));
}

async function rendreReel(browser, n) {
  const T = n === 'album' ? plan.teaser : plan.titres.find(t => t.n === n), nom = nomReel(n);
  const { page, frames } = await ouvrirReel(browser, n);
  const total = SECS ? Math.min(frames, Math.round(SECS * fps)) : frames;
  const dir = path.join(OUT, '.images', nom); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.reel.frame(t), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94, optimizeForSpeed: true });
    fs.writeFileSync(path.join(dir, String(i).padStart(5, '0') + '.jpg'), buf);
    if (i % (fps * 5) === 0) log(`${nom} ${i}/${total} images (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  }
  await page.close();
  // montage : les images + l’extrait du MP3 (fondu d’entrée .6 s, de sortie 1.4 s)
  const dur = total / fps, out = path.join(OUT, 'reels', nom + '.mp4'); fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', String(fps), '-i', path.join(dir, '%05d.jpg'),
    '-i', path.join(ROOT, 'audio', T.file + '.mp3'),
    // atrim plutôt que -ss : le MP3 est décodé entier puis coupé à l’échantillon près, comme le lecteur l’a horodaté
    '-af', `atrim=start=${T.debut}:duration=${dur.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.6,afade=t=out:st=${Math.max(0, dur - 1.4).toFixed(2)}:d=1.4`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-maxrate', '10M', '-bufsize', '20M', '-preset', 'medium', '-r', String(fps),
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (!flag('garder')) fs.rmSync(dir, { recursive: true, force: true });
  log(`→ ${path.relative(process.cwd(), out)} (${dur.toFixed(1)} s, ${(fs.statSync(out).size / 1e6).toFixed(1)} Mo)`);
}

async function chacun(items, n, fn) {
  const file = [...items];
  await Promise.all(Array.from({ length: Math.min(n, file.length) }, async () => { while (file.length) await fn(file.shift()); }));
}

const navigateur = () => puppeteer.launch({
  executablePath: CHROME, headless: !flag('visible'), defaultViewport: null, protocolTimeout: 600000,
  args: ['--hide-scrollbars', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', ...(process.env.CHROME_FLAGS || '').split(' ').filter(Boolean)],
});
// un Chrome par tâche : dans une même fenêtre, seul l’onglet visible reçoit ses requestAnimationFrame,
// les reels rendus en parallèle dans d’autres onglets attendraient leur tour
const avecChrome = async fn => { const b = await navigateur(); try { return await fn(b); } finally { await b.close(); } };

const stop = await serveur();
try {
  fs.mkdirSync(OUT, { recursive: true });
  if (doPosts) await avecChrome(rendrePosts);
  const reels = [...plan.titres.map(t => t.n), 'album'].filter(n => veut(nomReel(n)));
  if (doApercu) await chacun(reels, PAR, n => avecChrome(b => rendreApercu(b, n)));
  if (doReels) await chacun(reels, PAR, n => avecChrome(b => rendreReel(b, n)));
  try { fs.rmdirSync(path.join(OUT, '.images')); } catch {}
  log('terminé →', OUT);
} finally {
  stop();
}
