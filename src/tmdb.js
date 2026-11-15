// TMDB: Titel → TMDB-ID abgleichen, Details/Staffeln laden, Ergebnis cachen.
// Läuft im Hintergrund (wie die Cover in Spotlfy); unsichere Treffer lassen sich im UI korrigieren.
import { config } from './config.js';
import { query, withTransaction } from './db.js';
import { markSuperseded, markSupersededFor } from './dedupe.js';
import { normName, rawKey } from './parse/titles.js';
import { UserError } from './users.js';

export const enabled = () => Boolean(config.tmdb.apiKey);
const LANG = process.env.TMDB_LANGUAGE || 'de-DE';
const DAY = 864e5;

// ---------------------------------------------------------------- HTTP + Cache
let pausedUntil = 0;
export const tmdbPausedUntil = () => (pausedUntil > Date.now() ? pausedUntil : null);

async function tmdbFetch(path, params = {}) {
  if (!enabled()) throw new UserError('TMDB ist nicht eingerichtet (TMDB_API_KEY fehlt).', 503, 'tmdbMissing');
  if (pausedUntil > Date.now()) throw Object.assign(new Error('TMDB-Limit erreicht'), { code: 'TMDB_PAUSED' });
  const url = new URL(`${config.tmdb.base}${path}`);
  const key = config.tmdb.apiKey;
  const headers = { Accept: 'application/json' };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`;
  else url.searchParams.set('api_key', key);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
  if (res.status === 429) {
    pausedUntil = Date.now() + (Number(res.headers.get('retry-after')) || 10) * 1000;
    throw Object.assign(new Error('TMDB-Limit erreicht'), { code: 'TMDB_PAUSED' });
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`TMDB ${res.status} für ${path}`);
  return res.json();
}

/** GET mit Cache in tmdb_cache. maxAge in Tagen. */
export async function tmdbGet(path, params = {}, maxAgeDays = 30) {
  const key = `${path}?${new URLSearchParams(Object.entries(params).sort()).toString()}`;
  const { rows } = await query('SELECT data, ok, fetched_at FROM tmdb_cache WHERE key = $1', [key]);
  if (rows[0] && Date.now() - new Date(rows[0].fetched_at) < maxAgeDays * DAY) return rows[0].ok ? rows[0].data : null;
  const data = await tmdbFetch(path, params);
  await query(
    `INSERT INTO tmdb_cache (key, data, ok, fetched_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, ok = EXCLUDED.ok, fetched_at = now()`,
    [key, data ? JSON.stringify(data) : null, Boolean(data)],
  );
  return data;
}

// ---------------------------------------------------------------- Ähnlichkeit
function similarity(a, b) {
  const x = normName(a);
  const y = normName(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const strip = (s) => s.replace(/^(the|der|die|das|le|la|les|el|los|il|lo|den|det) /, '');
  if (strip(x) === strip(y)) return 0.97;
  const tx = new Set(x.split(' '));
  const ty = new Set(y.split(' '));
  const inter = [...tx].filter((w) => ty.has(w)).length;
  const jac = inter / new Set([...tx, ...ty]).size;
  const contains = x.includes(y) || y.includes(x) ? 0.15 : 0;
  return Math.min(0.95, jac * 0.85 + contains);
}

function scoreCandidates(name, results, kind) {
  return (results || [])
    .map((r) => {
      const names = [r.title, r.name, r.original_title, r.original_name].filter(Boolean);
      const sim = Math.max(...names.map((n) => similarity(name, n)), 0);
      const pop = Math.min(1, Math.log10((r.popularity || 0) + 1) / 2.5);
      const votes = Math.min(1, Math.log10((r.vote_count || 0) + 1) / 3.5);
      return { r, kind, sim, score: sim * 0.8 + pop * 0.1 + votes * 0.1 };
    })
    .sort((a, b) => b.score - a.score);
}

async function search(kind, name) {
  const data = await tmdbGet(`/search/${kind}`, { query: name, language: LANG, include_adult: 'false' }, 14);
  return scoreCandidates(name, data?.results, kind);
}

/** Bester Treffer für einen Roh-Titel inkl. Sicherheit. */
export async function findMatch(kindHint, name) {
  const primary = await search(kindHint, name);
  let best = primary[0];
  let reroute = null;
  // „Show: Folgentitel“ ohne Staffel-Angabe → als Serie mit dem Teil vor dem ersten Doppelpunkt versuchen
  if (kindHint === 'movie' && (!best || best.sim < 0.9) && name.includes(': ')) {
    const prefix = name.split(': ')[0];
    const tv = await search('tv', prefix);
    if (tv[0] && tv[0].sim >= 0.9 && (!best || tv[0].score > best.score)) {
      best = tv[0];
      reroute = { series: prefix, episodeName: name.slice(prefix.length + 2) };
    }
  }
  // Serie nicht gefunden → als Film versuchen und umgekehrt
  if (!best || best.sim < 0.75) {
    const other = await search(kindHint === 'tv' ? 'movie' : 'tv', name);
    if (other[0] && other[0].sim > (best?.sim ?? 0) + 0.1) best = other[0];
  }
  if (!best) return null;
  const second = (best === primary[0] ? primary[1] : primary[0]) || null;
  const margin = second ? best.score - second.score : 0.3;
  const confidence = Math.max(0, Math.min(1, best.sim - (margin < 0.05 && best.sim < 1 ? 0.15 : 0)));
  return { kind: best.kind, tmdbId: best.r.id, result: best.r, confidence, reroute };
}

// ---------------------------------------------------------------- Titel anlegen / Details
const yearOf = (d) => (d && /^\d{4}/.test(d) ? Number(d.slice(0, 4)) : null);

export async function upsertTitle(kind, tmdbId, r = {}) {
  const { rows } = await query(
    `INSERT INTO titles (kind, tmdb_id, name, original_name, year, overview, poster_path, backdrop_path, original_language)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (kind, tmdb_id) WHERE tmdb_id IS NOT NULL DO UPDATE SET updated_at = now()
     RETURNING id`,
    [kind, tmdbId, r.title || r.name || `#${tmdbId}`, r.original_title || r.original_name || null,
      yearOf(r.release_date || r.first_air_date), r.overview || null, r.poster_path || null, r.backdrop_path || null, r.original_language || null],
  );
  return rows[0].id;
}

// Anbieter-Namen von TMDB → eigene Dienst-Schlüssel
// Verteilt wird nur auf Netflix, Prime Video, Disney+ und HBO Max. HBO-Inhalte laufen in Deutschland auch bei
// WOW/Sky – die zählen deshalb zu HBO Max. Andere Dienste (Apple TV+, Paramount+ …) werden nicht zugeordnet.
const PROVIDER_KEYS = [
  [/netflix/i, 'netflix'], [/amazon|prime video/i, 'prime'], [/disney/i, 'disney'],
  [/hbo|^max\b|\bmax$|^wow\b|sky (go|ticket|x)|^sky$/i, 'max'],
];
/**
 * Wo läuft der Titel im Abo (Flatrate) in der eingestellten Region? Eindeutiger Dienst nur, wenn genau einer
 * der bekannten Dienste passt – sonst bleibt ein Trakt-Eintrag bei „Trakt“, statt falsch zugeordnet zu werden.
 */
export function providersOf(d) {
  const list = d?.['watch/providers']?.results?.[config.tmdb.region]?.flatrate || [];
  const names = [...new Set(list.map((p) => p.provider_name).filter(Boolean))];
  const keys = [...new Set(names.map((n) => PROVIDER_KEYS.find(([re]) => re.test(n))?.[1]).filter(Boolean))];
  return { names, service: keys.length === 1 ? keys[0] : null };
}

/** Lädt Details (Genres, Länder, Cast, Laufzeit, Staffeln) eines Titels. */
export async function loadDetails(titleId) {
  const { rows } = await query('SELECT id, kind, tmdb_id FROM titles WHERE id = $1', [titleId]);
  const t = rows[0];
  if (!t?.tmdb_id) return;
  const d = await tmdbGet(`/${t.kind}/${t.tmdb_id}`, { language: LANG, append_to_response: 'credits,watch/providers' }, 30);
  if (!d) {
    await query(`UPDATE titles SET details_at = now(), stats_at = now(), providers = COALESCE(providers, '{}') WHERE id = $1`, [titleId]);
    return;
  }
  const prov = providersOf(d);
  const cast = (d.credits?.cast || []).slice(0, 12).map((c) => c.name);
  const genres = (d.genres || []).map((g) => g.name);
  const countries = t.kind === 'movie' ? (d.production_countries || []).map((c) => c.iso_3166_1) : d.origin_country || [];
  const seasons = t.kind === 'tv'
    ? (d.seasons || []).filter((s) => s.season_number > 0).map((s) => ({ season: s.season_number, episodes: s.episode_count, name: s.name, air_date: s.air_date }))
    : null;
  const runtime = t.kind === 'movie' ? d.runtime || null : (d.episode_run_time || [])[0] || d.last_episode_to_air?.runtime || null;
  await query(
    `UPDATE titles SET name = $2, original_name = $3, year = $4, overview = $5, poster_path = COALESCE($6, poster_path),
            backdrop_path = COALESCE($7, backdrop_path), genres = $8, countries = $9, cast_names = $10, runtime = $11,
            seasons = $12, episode_count = $13, status = $14, original_language = $15,
            popularity = $16, vote_average = $17, vote_count = $18, revenue = $19, providers = $20, provider = $21,
            stats_at = now(), details_at = now(), updated_at = now()
      WHERE id = $1`,
    [titleId, d.title || d.name, d.original_title || d.original_name || null, yearOf(d.release_date || d.first_air_date), d.overview || null,
      d.poster_path || null, d.backdrop_path || null, genres, countries, cast, runtime,
      seasons ? JSON.stringify(seasons) : null, t.kind === 'tv' ? seasons.reduce((a, s) => a + (s.episodes || 0), 0) || d.number_of_episodes || null : null,
      d.status || null, d.original_language || null,
      Number.isFinite(d.popularity) ? d.popularity : null, Number.isFinite(d.vote_average) ? d.vote_average : null,
      Number.isFinite(d.vote_count) ? d.vote_count : 0, t.kind === 'movie' && d.revenue > 0 ? d.revenue : null,
      prov.names, prov.service],
  );
}

/** Lädt die Folgen einer Staffel (Namen + Laufzeiten). */
export async function loadSeason(titleId, season) {
  const { rows } = await query('SELECT tmdb_id FROM titles WHERE id = $1 AND kind = $2', [titleId, 'tv']);
  if (!rows[0]?.tmdb_id) return 0;
  const d = await tmdbGet(`/tv/${rows[0].tmdb_id}/season/${season}`, { language: LANG }, 30);
  const eps = (d?.episodes || []).map((e) => ({ title_id: titleId, season, episode: e.episode_number, name: e.name || null, runtime: e.runtime || null, air_date: e.air_date || null }));
  // Platzhalter, damit eine leere/fehlende Staffel nicht immer wieder abgefragt wird
  if (!eps.length) eps.push({ title_id: titleId, season, episode: 0, name: null, runtime: null, air_date: null });
  await query(
    `INSERT INTO episodes (title_id, season, episode, name, runtime, air_date)
     SELECT x.title_id, x.season, x.episode, x.name, x.runtime, x.air_date FROM json_populate_recordset(NULL::episodes, $1::json) x
     ON CONFLICT (title_id, season, episode) DO UPDATE SET name = EXCLUDED.name, runtime = EXCLUDED.runtime, air_date = EXCLUDED.air_date`,
    [JSON.stringify(eps)],
  );
  return eps.length;
}

// ---------------------------------------------------------------- Abgleich eines Alias
async function applyMatch(accountId, alias, m) {
  if (!m) {
    await query(`UPDATE title_aliases SET state = 'none', confidence = 0, checked_at = now() WHERE account_id = $1 AND raw_key = $2`, [accountId, alias.raw_key]);
    return;
  }
  const titleId = await upsertTitle(m.kind, m.tmdbId, m.result);
  const state = m.confidence >= 0.85 ? 'matched' : m.confidence >= 0.5 ? 'uncertain' : 'none';
  if (m.reroute && state !== 'none') {
    // Einträge „Show: Folgentitel“ werden zu Folgen der Serie
    const newKey = rawKey('tv', m.reroute.series);
    await withTransaction(async (db) => {
      await db.query(
        `UPDATE views SET raw_key = $3, kind_hint = 'tv',
                episode_name = COALESCE(episode_name, NULLIF(substr(raw_title, length($4) + 3), ''))
          WHERE account_id = $1 AND raw_key = $2`,
        [accountId, alias.raw_key, newKey, m.reroute.series],
      );
      await db.query('DELETE FROM title_aliases WHERE account_id = $1 AND raw_key = $2', [accountId, alias.raw_key]);
      await db.query(
        `INSERT INTO title_aliases (account_id, raw_key, raw_name, kind_hint, title_id, confidence, state, checked_at)
         VALUES ($1, $2, $3, 'tv', $4, $5, $6, now())
         ON CONFLICT (account_id, raw_key) DO UPDATE SET title_id = COALESCE(title_aliases.title_id, EXCLUDED.title_id),
           state = CASE WHEN title_aliases.state = 'manual' THEN 'manual' ELSE EXCLUDED.state END, checked_at = now()`,
        [accountId, newKey, m.reroute.series, titleId, m.confidence, state],
      );
    });
    return;
  }
  await query(
    `UPDATE title_aliases SET title_id = $3, confidence = $4, state = $5, checked_at = now() WHERE account_id = $1 AND raw_key = $2`,
    [accountId, alias.raw_key, state === 'none' ? null : titleId, m.confidence, state],
  );
}

/** Folgen ohne Nummer anhand des Folgentitels zuordnen (Netflix-Kurzexport). */
async function resolveEpisodeNumbers(accountId = null) {
  await query(
    `UPDATE views v SET episode = e.episode
       FROM title_aliases al, episodes e
      WHERE al.account_id = v.account_id AND al.raw_key = v.raw_key AND al.title_id = e.title_id
        AND v.episode IS NULL AND v.season IS NOT NULL AND v.episode_name IS NOT NULL
        AND e.season = v.season AND e.episode > 0
        AND regexp_replace(lower(e.name), '[^[:alnum:]]+', '', 'g') = regexp_replace(lower(v.episode_name), '[^[:alnum:]]+', '', 'g')
        AND ($1::bigint IS NULL OR v.account_id = $1)`,
    [accountId],
  );
}

// ---------------------------------------------------------------- Hintergrund-Lauf
let running = null;
let again = false;
export const isEnriching = () => Boolean(running);

/** Gleicht offene Titel ab, lädt Details und benötigte Staffeln. Läuft nie doppelt –
 *  wird es währenddessen erneut angestoßen (z. B. neuer Import), folgt direkt ein weiterer Lauf. */
export function enrich({ limit = config.tmdb.batch } = {}) {
  if (!enabled()) return Promise.resolve({ skipped: 'disabled' });
  if (running) { again = true; return running; }
  again = false;
  running = (async () => {
    const stats = { matched: 0, details: 0, seasons: 0, errors: 0 };
    const touched = new Set();
    const deadline = Date.now() + 4 * 60_000;
    try {
      for (let round = 0; round < 50 && Date.now() < deadline; round++) {
        const { rows: aliases } = await query(
          `SELECT account_id, raw_key, raw_name, kind_hint FROM title_aliases WHERE state = 'pending' ORDER BY account_id, raw_key LIMIT $1`,
          [limit],
        );
        for (const a of aliases) {
          touched.add(a.account_id);
          try { await applyMatch(a.account_id, a, await findMatch(a.kind_hint, a.raw_name)); stats.matched++; } catch (err) {
            if (err.code === 'TMDB_PAUSED') throw err;
            stats.errors++;
            console.warn('[tmdb] Abgleich', a.raw_name, err.message);
            await query(`UPDATE title_aliases SET state = 'none', checked_at = now() WHERE account_id = $1 AND raw_key = $2`, [a.account_id, a.raw_key]);
          }
        }
        const { rows: titles } = await query(
          `SELECT DISTINCT t.id FROM titles t JOIN title_aliases al ON al.title_id = t.id
            WHERE (t.details_at IS NULL OR t.stats_at IS NULL OR t.providers IS NULL) AND t.tmdb_id IS NOT NULL LIMIT $1`,
          [limit],
        );
        for (const t of titles) {
          try { await loadDetails(t.id); stats.details++; } catch (err) {
            if (err.code === 'TMDB_PAUSED') throw err;
            stats.errors++;
            await query(`UPDATE titles SET details_at = now(), stats_at = now(), providers = COALESCE(providers, '{}') WHERE id = $1`, [t.id]);
          }
        }
        // Staffeln, aus denen etwas gesehen wurde, aber deren Folgen noch fehlen
        const { rows: seasons } = await query(
          `SELECT DISTINCT al.title_id, v.season FROM views v
             JOIN title_aliases al ON al.account_id = v.account_id AND al.raw_key = v.raw_key
             JOIN titles t ON t.id = al.title_id AND t.kind = 'tv'
            WHERE v.season IS NOT NULL AND v.season > 0
              AND NOT EXISTS (SELECT 1 FROM episodes e WHERE e.title_id = al.title_id AND e.season = v.season)
            LIMIT $1`,
          [limit],
        );
        for (const s of seasons) {
          try { await loadSeason(s.title_id, s.season); stats.seasons++; } catch (err) {
            if (err.code === 'TMDB_PAUSED') throw err;
            stats.errors++;
            await query('INSERT INTO episodes (title_id, season, episode) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING', [s.title_id, s.season]);
          }
        }
        if (seasons.length || aliases.length) await resolveEpisodeNumbers();
        // Neue Zuordnungen/Folgennummern können Doppelte sichtbar machen – betroffene Konten neu markieren
        if (seasons.length) await markSuperseded(null); // Folgennummern betreffen alle Konten mit diesen Serien
        else if (touched.size) await markSupersededFor([...touched]);
        touched.clear();
        if (!aliases.length && !titles.length && !seasons.length) break;
      }
    } catch (err) {
      if (err.code !== 'TMDB_PAUSED') console.error('[tmdb]', err.message);
    } finally {
      running = null;
    }
    if (stats.matched || stats.details || stats.seasons) console.log('[tmdb]', JSON.stringify(stats));
    if (again && !tmdbPausedUntil()) setImmediate(() => enrich({ limit }).catch(() => {}));
    return stats;
  })();
  return running;
}

/** Wie viele Titel des Kontos noch auf TMDB warten. */
export async function pendingFor(accountId) {
  const { rows } = await query(
    `SELECT count(*) FILTER (WHERE state = 'pending') AS pending,
            count(*) FILTER (WHERE state = 'uncertain') AS uncertain,
            count(*) FILTER (WHERE state = 'none') AS unmatched,
            count(*) AS total
       FROM title_aliases WHERE account_id = $1`,
    [accountId],
  );
  return rows[0];
}

// ---------------------------------------------------------------- Korrektur im UI
export async function searchCandidates(kind, q) {
  const name = String(q || '').trim().slice(0, 120);
  if (!name) return [];
  const kinds = kind === 'movie' || kind === 'tv' ? [kind] : ['tv', 'movie'];
  const out = [];
  for (const k of kinds) out.push(...(await search(k, name)).slice(0, 8));
  return out
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ r, kind: k }) => ({ kind: k, tmdb_id: r.id, name: r.title || r.name, year: yearOf(r.release_date || r.first_air_date), poster_path: r.poster_path || null, overview: (r.overview || '').slice(0, 220) }));
}

/** Nutzer wählt den richtigen Titel (oder „kein Treffer“). */
export async function correctAlias(accountId, rawKeyValue, { kind, tmdbId } = {}) {
  const { rows } = await query('SELECT raw_key FROM title_aliases WHERE account_id = $1 AND raw_key = $2', [accountId, rawKeyValue]);
  if (!rows.length) throw new UserError('Titel nicht gefunden.', 404, 'notFound');
  if (!tmdbId) {
    await query(`UPDATE title_aliases SET title_id = NULL, state = 'manual', confidence = 1, checked_at = now() WHERE account_id = $1 AND raw_key = $2`, [accountId, rawKeyValue]);
    await markSuperseded(accountId);
    return { ok: true };
  }
  if (!['movie', 'tv'].includes(kind) || !Number.isInteger(Number(tmdbId))) throw new UserError('Ungültige Auswahl.', 400, 'invalidSetting');
  const d = await tmdbGet(`/${kind}/${Number(tmdbId)}`, { language: LANG, append_to_response: 'credits' }, 30);
  if (!d) throw new UserError('Titel bei TMDB nicht gefunden.', 404, 'notFound');
  const titleId = await upsertTitle(kind, Number(tmdbId), d);
  await query(
    `UPDATE title_aliases SET title_id = $3, state = 'manual', confidence = 1, checked_at = now() WHERE account_id = $1 AND raw_key = $2`,
    [accountId, rawKeyValue, titleId],
  );
  // Film ↔ Serie: Einträge passend umstellen
  await query('UPDATE views SET kind_hint = $3 WHERE account_id = $1 AND raw_key = $2', [accountId, rawKeyValue, kind]);
  enrich().catch(() => {});
  await markSuperseded(accountId);
  return { ok: true, title_id: titleId };
}

/** Unsichere/fehlende Treffer des Kontos (für die Korrektur-Liste). */
export async function reviewList(accountId) {
  const { rows } = await query(
    `SELECT al.raw_key, al.raw_name, al.kind_hint, al.state, al.confidence, t.id AS title_id, t.kind, t.name, t.year, t.poster_path,
            (SELECT count(*) FROM views v WHERE v.account_id = al.account_id AND v.raw_key = al.raw_key) AS views
       FROM title_aliases al LEFT JOIN titles t ON t.id = al.title_id
      WHERE al.account_id = $1 AND al.state IN ('uncertain', 'none')
      ORDER BY views DESC, al.raw_name LIMIT 200`,
    [accountId],
  );
  return rows;
}

// ---------------------------------------------------------------- Bild-Proxy (CSP: nur eigene Quelle)
const SIZES = new Set(['w92', 'w154', 'w185', 'w300', 'w342', 'w500', 'w780', 'w1280', 'original']);
export async function imageProxy(req, res, { cache = true } = {}) {
  const { size, file } = req.params;
  if (!SIZES.has(size) || !/^[A-Za-z0-9_-]{5,64}\.(jpg|jpeg|png|webp|svg)$/.test(file)) return res.status(404).end();
  try {
    const r = await fetch(`${config.tmdb.imageBase}/${size}/${file}`, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) return res.status(r.status === 404 ? 404 : 502).end();
    const type = r.headers.get('content-type') || 'image/jpeg';
    if (!/^image\//.test(type)) return res.status(502).end();
    res.set({ 'Content-Type': type, 'Cache-Control': cache ? 'public, max-age=2592000, immutable' : 'private, no-store', 'Content-Security-Policy': "default-src 'none'" });
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch {
    if (!res.headersSent) res.status(504).end();
  }
}

// ---------------------------------------------------------------- Entdecken: Titel, die man noch nicht gesehen hat (für die Videothek)
const DISCOVER_LISTS = [
  ['movie', '/trending/movie/week'], ['tv', '/trending/tv/week'],
  ['movie', '/movie/popular'], ['tv', '/tv/popular'],
  ['movie', '/movie/top_rated'], ['tv', '/tv/top_rated'],
];
let discoverMemo = { at: 0, rows: [] };

/**
 * Beliebte, angesagte und bestbewertete Filme/Serien aus TMDB (je 2 Seiten, einen Tag zwischengespeichert).
 * Werden als Titel angelegt (ohne Details); Kennzahlen für die Seltenheit kommen direkt aus den Listen.
 */
export async function discoverPool() {
  if (!enabled()) return [];
  if (Date.now() - discoverMemo.at < 3600e3 && discoverMemo.rows.length) return discoverMemo.rows;
  const seen = new Map();
  for (const [kind, path] of DISCOVER_LISTS) {
    for (const page of [1, 2]) {
      let data = null;
      try { data = await tmdbGet(path, { language: LANG, page }, 1); } catch (err) { if (err.code === 'TMDB_PAUSED') break; continue; }
      for (const r of data?.results || []) {
        if (!r?.id || !r.poster_path || r.adult || seen.has(`${kind}|${r.id}`)) continue;
        seen.set(`${kind}|${r.id}`, { kind, r });
      }
    }
  }
  const rows = [];
  for (const { kind, r } of seen.values()) {
    const { rows: t } = await query(
      `INSERT INTO titles (kind, tmdb_id, name, original_name, year, overview, poster_path, backdrop_path, original_language, popularity, vote_average, vote_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (kind, tmdb_id) WHERE tmdb_id IS NOT NULL DO UPDATE SET
         poster_path = COALESCE(titles.poster_path, EXCLUDED.poster_path), backdrop_path = COALESCE(titles.backdrop_path, EXCLUDED.backdrop_path),
         popularity = COALESCE(EXCLUDED.popularity, titles.popularity), vote_average = COALESCE(EXCLUDED.vote_average, titles.vote_average),
         vote_count = GREATEST(COALESCE(titles.vote_count, 0), COALESCE(EXCLUDED.vote_count, 0))
       RETURNING id, kind, name, year, poster_path, backdrop_path, popularity, vote_average, vote_count, revenue, details_at`,
      [kind, r.id, r.title || r.name || `#${r.id}`, r.original_title || r.original_name || null, yearOf(r.release_date || r.first_air_date),
        r.overview || null, r.poster_path, r.backdrop_path || null, r.original_language || null,
        Number.isFinite(r.popularity) ? r.popularity : null, Number.isFinite(r.vote_average) ? r.vote_average : null, Number.isFinite(r.vote_count) ? r.vote_count : null],
    );
    if (t[0]) rows.push({ ...t[0], views: 0, discover: true });
  }
  discoverMemo = { at: Date.now(), rows };
  return rows;
}
