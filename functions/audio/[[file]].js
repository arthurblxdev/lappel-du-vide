// Fonction Cloudflare Pages : sert audio/*.mp3 avec les requêtes Range (206 Partial Content).
// Les fichiers statiques de Pages ignorent l’en-tête Range, ce qui empêche le navigateur de se
// déplacer dans un MP3 (la lecture repart du début). Ici on relit le fichier via le binding ASSETS
// et on découpe la plage demandée nous-mêmes.
export async function onRequest({ request, env }) {
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: 'GET' }));
  if (!asset.ok) return asset;
  const headers = new Headers(asset.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Type', 'audio/mpeg');
  headers.delete('Content-Encoding');
  const range = request.headers.get('Range');
  if (request.method === 'HEAD' || !range) {
    return new Response(request.method === 'HEAD' ? null : asset.body, { status: 200, headers });
  }
  const buf = await asset.arrayBuffer();
  const size = buf.byteLength;
  const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start, end;
  if (m && m[1] === '' && m[2] !== '') { start = Math.max(0, size - Number(m[2])); end = size - 1; }
  else if (m && m[1] !== '') { start = Number(m[1]); end = m[2] !== '' ? Math.min(size - 1, Number(m[2])) : size - 1; }
  if (!m || start > end || start >= size) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}`, 'Accept-Ranges': 'bytes' } });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  headers.set('Content-Length', String(end - start + 1));
  return new Response(buf.slice(start, end + 1), { status: 206, headers });
}
