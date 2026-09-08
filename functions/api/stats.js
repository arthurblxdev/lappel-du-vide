// Fonction Cloudflare Pages : les compteurs du site, dans la base D1 du projet (binding DB, wrangler.toml).
//   GET  /api/stats                        → { ecoutes: { "01": n, …, total }, interet: { noir: n, ambre: n } }
//   POST /api/stats { type, cle, delta }   → même réponse après l’incrément (type « ecoute » + numéro de titre,
//                                            ou « interet » + pressage ; delta 1 par défaut, -1 pour retirer)
// La table est créée au premier appel s’il le faut ; le site (js/site.js) appelle l’API en même origine.
const CLES = { ecoute: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'], interet: ['noir', 'ambre'] };
let prete = false;

async function preparer(db) {
  if (prete) return;
  await db.prepare('CREATE TABLE IF NOT EXISTS compteurs (type TEXT NOT NULL, cle TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (type, cle))').run();
  prete = true;
}
async function lire(db) {
  const { results } = await db.prepare('SELECT type, cle, n FROM compteurs').all();
  const out = { ecoutes: { total: 0 }, interet: { noir: 0, ambre: 0 } };
  for (const r of results) {
    if (r.type === 'ecoute') { out.ecoutes[r.cle] = r.n; out.ecoutes.total += r.n; }
    else if (r.type === 'interet') out.interet[r.cle] = r.n;
  }
  return out;
}
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ erreur: 'base absente' }, 503);
  await preparer(env.DB);
  return json(await lire(env.DB));
}
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ erreur: 'base absente' }, 503);
  let corps;
  try { corps = await request.json(); } catch { return json({ erreur: 'JSON attendu' }, 400); }
  const type = corps && corps.type, cle = corps && corps.cle, delta = corps && corps.delta === -1 ? -1 : 1;
  if (!CLES[type] || !CLES[type].includes(cle)) return json({ erreur: 'compteur inconnu' }, 400);
  await preparer(env.DB);
  await env.DB.prepare('INSERT INTO compteurs (type, cle, n) VALUES (?1, ?2, MAX(0, ?3)) ON CONFLICT(type, cle) DO UPDATE SET n = MAX(0, n + ?3)')
    .bind(type, cle, delta).run();
  return json(await lire(env.DB));
}
