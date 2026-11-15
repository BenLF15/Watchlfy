// Filmmusik für den Rückblick: sucht zu einem Titel den Soundtrack über die öffentliche iTunes-Suche
// (kein Schlüssel nötig) und reicht die offizielle 30-Sekunden-Hörprobe über den eigenen Server durch
// (strenge CSP: Audio nur von 'self'). Ergebnisse werden 30 Tage zwischengespeichert.
import { config } from './config.js';
import { query } from './db.js';

const TTL_DAYS = 30;
const ALBUM_HINT = /soundtrack|original (motion picture|score|series|television|music)|music from|filmmusik|bande originale|banda sonora|colonna sonora|score/i;
const THEME_HINT = /main title|main theme|theme|titelmusik|opening|intro|suite/i;

export const available = () => config.music.enabled;

const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Bestes Stück aus den Suchergebnissen: Album muss den Titel tragen, Soundtrack/Score und Titelmusik zählen extra. */
export function pickTrack(results, title) {
  const want = norm(title);
  if (!want) return null;
  let best = null;
  for (const r of results || []) {
    if (!r.previewUrl || !r.trackId) continue;
    const album = norm(r.collectionName);
    if (!album.includes(want)) continue;
    let score = 3;
    if (ALBUM_HINT.test(r.collectionName || '')) score += 2;
    if (THEME_HINT.test(r.trackName || '')) score += 1;
    if (norm(r.trackName).includes(want)) score += 1;
    if (r.trackNumber === 1) score += 0.5;
    if (!best || score > best.score) best = { score, r };
  }
  if (!best) return null;
  const { r } = best;
  return { id: String(r.trackId), track: r.trackName, artist: r.artistName, album: r.collectionName, link: r.trackViewUrl || null, preview: r.previewUrl };
}

const publicTrack = (x) => (x ? { id: x.id, track: x.track, artist: x.artist, album: x.album, link: x.link, audio: `/api/soundtrack/audio/${encodeURIComponent(x.id)}` } : null);

/** Soundtrack zu einem Titel (oder null). */
export async function find(title, { kind = null, year = null } = {}) {
  if (!available() || !title) return null;
  const key = `${norm(title)}|${year || ''}`;
  const { rows } = await query(`SELECT data FROM soundtrack_cache WHERE key = $1 AND fetched_at > now() - make_interval(days => ${TTL_DAYS})`, [key]);
  if (rows[0]) return publicTrack(rows[0].data);
  let track = null;
  try {
    const terms = [`${title} soundtrack`, kind === 'tv' ? `${title} theme` : `${title} score`, String(title)];
    for (const term of terms) {
      const url = `${config.music.base}/search?${new URLSearchParams({ term, media: 'music', entity: 'song', limit: '25', country: config.music.country })}`;
      const r = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': config.music.userAgent }, signal: AbortSignal.timeout(8000) });
      if (!r.ok) break;
      track = pickTrack((await r.json()).results, title);
      if (track) break;
    }
  } catch (err) {
    console.warn('[musik] Suche fehlgeschlagen:', err.message);
    return null; // nicht zwischenspeichern – beim nächsten Mal erneut versuchen
  }
  await query(
    `INSERT INTO soundtrack_cache (key, track_id, data, fetched_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (key) DO UPDATE SET track_id = EXCLUDED.track_id, data = EXCLUDED.data, fetched_at = now()`,
    [key, track?.id || null, track ? JSON.stringify(track) : null],
  );
  return publicTrack(track);
}

/** Hörprobe durchreichen – nur Stücke, die vorher über find() gefunden wurden, und nur von erlaubten Hosts. */
export async function audioProxy(req, res) {
  const id = String(req.params.id || '');
  if (!/^\d{1,20}$/.test(id)) return res.status(404).end();
  const { rows } = await query('SELECT data FROM soundtrack_cache WHERE track_id = $1 LIMIT 1', [id]);
  const src = rows[0]?.data?.preview;
  let u;
  try { u = new URL(src); } catch { return res.status(404).end(); }
  const ownHost = new URL(config.music.base).host;
  const okHost = u.host === ownHost || /(^|\.)(apple\.com|mzstatic\.com)$/.test(u.hostname);
  if (!okHost || !/^https?:$/.test(u.protocol) || (u.protocol === 'http:' && u.host !== ownHost)) return res.status(404).end();
  try {
    const r = await fetch(u, { headers: { 'User-Agent': config.music.userAgent }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return res.status(502).end();
    const type = r.headers.get('content-type') || 'audio/mp4';
    if (!/^audio\/|^video\/mp4/.test(type)) return res.status(502).end();
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 5 * 1024 * 1024) return res.status(502).end();
    res.set({ 'Content-Type': type, 'Cache-Control': 'private, max-age=86400', 'Content-Security-Policy': "default-src 'none'", 'X-Content-Type-Options': 'nosniff' });
    res.send(buf);
  } catch {
    if (!res.headersSent) res.status(504).end();
  }
}
