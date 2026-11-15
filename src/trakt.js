// Trakt.tv: OAuth, Verlauf-Sync (alle 30 Min. über den internen Zeitplan), „Läuft gerade“, Bewertungen.
// Trakt liefert TMDB-IDs direkt mit – kein unscharfer Titelabgleich nötig.
import crypto from 'node:crypto';
import { config } from './config.js';
import { query, withTransaction } from './db.js';
import { rawKey } from './parse/titles.js';
import * as tmdb from './tmdb.js';
import { UserError } from './users.js';

// Nur die Client ID ist Pflicht. Ohne Client Secret läuft die Anmeldung über PKCE (Trakt-Apps mit
// „PKCE“ geben kein Secret aus); mit Secret wird PKCE zusätzlich mitgeschickt.
export const available = () => Boolean(config.trakt.clientId);

/** PKCE: zufälliger Prüfwert (bleibt beim Nutzer im Cookie) und dessen SHA-256-Hash (geht an Trakt). */
export function pkcePair() {
  const verifier = crypto.randomBytes(48).toString('base64url'); // 64 Zeichen, erlaubt sind 43–128
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

/** Kopfzeilen für jede Trakt-Anfrage: eigener User-Agent (sonst 403 vom Trakt-Schutz) + API-Version/Schlüssel. */
function traktHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': config.trakt.userAgent,
    'trakt-api-version': '2',
    'trakt-api-key': config.trakt.clientId,
    ...extra,
  };
}

/** Fehlertext: HTML-Antwort heißt meist „vom Schutz vor Bots geblockt“, nicht „Zugangsdaten falsch“. */
async function describeError(res) {
  const text = await res.text().catch(() => '');
  if (/^\s*</.test(text)) return `HTML-Seite statt JSON (vermutlich Trakt-Bot-Schutz/Cloudflare)${/cloudflare|cf-ray|attention required/i.test(text) ? ', Cloudflare erkannt' : ''}`;
  return text.slice(0, 300);
}

export function authorizeUrl(state, challenge) {
  const u = new URL(`${config.trakt.authBase}/oauth/authorize`);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', config.trakt.clientId);
  u.searchParams.set('redirect_uri', config.trakt.redirectUri);
  u.searchParams.set('state', state);
  if (challenge) {
    u.searchParams.set('code_challenge', challenge);
    u.searchParams.set('code_challenge_method', 'S256');
  }
  return u.toString();
}

async function tokenRequest(body) {
  const res = await fetch(`${config.trakt.base}/oauth/token`, {
    method: 'POST',
    headers: traktHeaders(),
    body: JSON.stringify({
      client_id: config.trakt.clientId,
      // Secret nur senden, wenn es eins gibt (PKCE-Apps haben keins)
      ...(config.trakt.clientSecret ? { client_secret: config.trakt.clientSecret } : {}),
      redirect_uri: config.trakt.redirectUri,
      ...body,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    console.error('[trakt] Token-Anfrage abgelehnt', res.status, await describeError(res));
    throw Object.assign(new Error(`Trakt-Token ${res.status}`), { code: 'TRAKT_TOKEN' });
  }
  const j = await res.json();
  return { access: j.access_token, refresh: j.refresh_token, expiresAt: new Date(((j.created_at || Date.now() / 1000) + (j.expires_in || 7776000)) * 1000) };
}

async function traktFetch(token, path, { params = {}, allow204 = false } = {}) {
  const u = new URL(`${config.trakt.base}${path}`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) u.searchParams.set(k, String(v));
  const res = await fetch(u, {
    headers: traktHeaders({ Authorization: `Bearer ${token}` }),
    signal: AbortSignal.timeout(15000),
  });
  if (res.status === 204 && allow204) return { data: null, res };
  if (res.status === 401) throw Object.assign(new Error('Trakt-Zugriff abgelaufen'), { code: 'TRAKT_AUTH' });
  if (res.status === 429) throw Object.assign(new Error('Trakt-Limit erreicht'), { code: 'TRAKT_LIMIT' });
  if (!res.ok) {
    const why = await describeError(res);
    console.error('[trakt] Anfrage abgelehnt', res.status, path, why);
    throw new Error(`Trakt ${res.status} für ${path}`);
  }
  return { data: res.status === 204 ? null : await res.json(), res };
}

/** OAuth-Code einlösen und Konto verknüpfen. */
export async function connect(accountId, code, verifier = null) {
  const tok = await tokenRequest({ code, grant_type: 'authorization_code', ...(verifier ? { code_verifier: verifier } : {}) });
  let username = null;
  try { username = (await traktFetch(tok.access, '/users/settings')).data?.user?.username || null; } catch { /* egal */ }
  await query(
    `INSERT INTO trakt_tokens (account_id, access_token, refresh_token, expires_at, username, last_error)
     VALUES ($1, $2, $3, $4, $5, NULL)
     ON CONFLICT (account_id) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token,
       expires_at = EXCLUDED.expires_at, username = EXCLUDED.username, last_error = NULL, updated_at = now()`,
    [accountId, tok.access, tok.refresh, tok.expiresAt, username],
  );
  return { username };
}

export async function disconnect(accountId) {
  await query('DELETE FROM trakt_tokens WHERE account_id = $1', [accountId]);
}

/** Gültiges Access-Token (erneuert es bei Bedarf). */
async function accessToken(accountId) {
  const { rows } = await query('SELECT access_token, refresh_token, expires_at FROM trakt_tokens WHERE account_id = $1', [accountId]);
  const r = rows[0];
  if (!r) throw new UserError('Trakt ist nicht verbunden.', 409, 'traktNotConnected');
  if (new Date(r.expires_at) - Date.now() > 24 * 3600e3) return r.access_token;
  try {
    const tok = await tokenRequest({ refresh_token: r.refresh_token, grant_type: 'refresh_token' });
    await query('UPDATE trakt_tokens SET access_token = $2, refresh_token = $3, expires_at = $4, updated_at = now() WHERE account_id = $1', [accountId, tok.access, tok.refresh, tok.expiresAt]);
    return tok.access;
  } catch (err) {
    await query('UPDATE trakt_tokens SET last_error = $2 WHERE account_id = $1', [accountId, 'Zugriff abgelaufen – bitte neu verbinden']);
    throw err;
  }
}

// ---------------------------------------------------------------- Verlauf
const sha = (s) => crypto.createHash('sha1').update(s).digest('base64url');

/** Wandelt einen Trakt-History-Eintrag in eine Verlaufszeile um. */
function toView(item) {
  const isEp = item.type === 'episode';
  const show = isEp ? item.show : item.movie;
  if (!show?.title) return null;
  const ep = item.episode || {};
  const kind = isEp ? 'tv' : 'movie';
  return {
    source: 'trakt',
    raw_title: isEp ? `${show.title}: S${ep.season}E${ep.number}${ep.title ? `: ${ep.title}` : ''}` : show.title,
    raw_key: rawKey(kind, show.title),
    raw_name: show.title,
    kind_hint: kind,
    season: isEp ? ep.season ?? null : null,
    episode: isEp ? ep.number ?? null : null,
    episode_name: isEp ? ep.title || null : null,
    watched_at: item.watched_at,
    duration_sec: null, // Trakt kennt nur „gesehen“, keine echte Dauer → Laufzeit gilt als geschätzt
    external_id: String(item.id),
    tmdb_hint: show.ids?.tmdb || null,
    dedupe_key: sha(`trakt|${item.id}`),
  };
}

/** Zeitpunkt der letzten Verlaufsänderung bei Trakt (Folgen oder Filme). */
async function lastActivity(token) {
  try {
    const { data } = await traktFetch(token, '/sync/last_activities');
    return [data?.episodes?.watched_at, data?.movies?.watched_at].filter(Boolean).sort().pop() || data?.all || null;
  } catch {
    return null;
  }
}

/**
 * Holt den Verlauf und speichert Neues.
 * Trakt filtert /sync/history nur nach dem Schauzeitpunkt. Nachgetragene Historie (z. B. vom Trakt Streaming Scrobbler,
 * der alte Netflix-/Prime-/Max-/Disney+-Einträge mit ihrem ursprünglichen Datum einträgt) würde ein „ab dem letzten
 * Eintrag“-Abgleich nie sehen. Deshalb: Hat sich laut /sync/last_activities etwas geändert (oder wird von Hand
 * abgeglichen), wird der ganze Verlauf geholt – Doppeltes fällt über dedupe_key bzw. den Abgleich mit Importen raus.
 */
export async function syncAccount(accountId, { full = false } = {}) {
  const log = await query(`INSERT INTO sync_log (account_id, job) VALUES ($1, 'trakt') RETURNING id`, [accountId]);
  try {
    const token = await accessToken(accountId);
    const { rows } = await query('SELECT last_history_at, last_activity FROM trakt_tokens WHERE account_id = $1', [accountId]);
    const activity = await lastActivity(token);
    const changed = full || !rows[0]?.last_activity || !activity || activity !== rows[0].last_activity;
    if (!changed) {
      await query('UPDATE trakt_tokens SET last_sync_at = now(), last_error = NULL WHERE account_id = $1', [accountId]);
      await query('UPDATE sync_log SET finished_at = now(), ok = true, message = $2 WHERE id = $1', [log.rows[0].id, 'keine Änderung bei Trakt']);
      return { added: 0, fetched: 0, unchanged: true };
    }
    const items = [];
    for (let page = 1; page <= 200; page++) {
      const { data, res } = await traktFetch(token, '/sync/history', { params: { page, limit: 100, extended: 'full' } });
      items.push(...(data || []));
      const pages = Number(res.headers.get('x-pagination-page-count') || 1);
      if (!data?.length || page >= pages) break;
    }
    const views = items.map(toView).filter(Boolean);
    const added = await saveViews(accountId, views);
    // Bewertungen (optional)
    try {
      const { data } = await traktFetch(token, '/sync/ratings');
      const ratings = (data || []).map((r) => ({
        kind: r.type === 'movie' ? 'movie' : 'tv', tmdb_id: (r.movie || r.show)?.ids?.tmdb, rating: r.rating, rated_at: r.rated_at,
      })).filter((r) => r.tmdb_id && (r.kind === 'movie' || ['show'].includes(data.find((x) => (x.show || x.movie)?.ids?.tmdb === r.tmdb_id)?.type)));
      if (ratings.length) {
        await query(
          `INSERT INTO ratings (account_id, kind, tmdb_id, rating, rated_at)
           SELECT $1, x.kind, x.tmdb_id, x.rating, x.rated_at FROM json_populate_recordset(NULL::ratings, $2::json) x
           ON CONFLICT (account_id, kind, tmdb_id) DO UPDATE SET rating = EXCLUDED.rating, rated_at = EXCLUDED.rated_at`,
          [accountId, JSON.stringify(ratings)],
        );
      }
    } catch { /* Bewertungen sind optional */ }
    const newest = items.reduce((a, i) => (!a || i.watched_at > a ? i.watched_at : a), null);
    await query(
      `UPDATE trakt_tokens SET last_sync_at = now(), last_error = NULL, last_activity = $3,
              last_history_at = GREATEST(COALESCE(last_history_at, $2::timestamptz), COALESCE($2::timestamptz, last_history_at)) WHERE account_id = $1`,
      [accountId, newest, activity],
    );
    await query('UPDATE sync_log SET finished_at = now(), ok = true, message = $2 WHERE id = $1', [log.rows[0].id, `${added} neu`]);
    if (added) tmdb.enrich().catch(() => {});
    return { added, fetched: items.length };
  } catch (err) {
    await query('UPDATE sync_log SET finished_at = now(), ok = false, message = $2 WHERE id = $1', [log.rows[0].id, err.message]);
    await query('UPDATE trakt_tokens SET last_error = $2 WHERE account_id = $1', [accountId, err.message]).catch(() => {});
    throw err;
  }
}

/**
 * Speichert Trakt-Einträge. Übersprungen wird, was am selben Tag schon aus einer anderen Quelle
 * (z. B. Netflix-Import) für dieselbe Folge bzw. denselben Film vorliegt.
 */
async function saveViews(accountId, views) {
  if (!views.length) return 0;
  return withTransaction(async (db) => {
    const r = await db.query(
      `INSERT INTO views (account_id, source, raw_title, raw_key, kind_hint, season, episode, episode_name, watched_at, time_known,
                          duration_sec, external_id, tmdb_hint, dedupe_key)
       SELECT $1, x.source, x.raw_title, x.raw_key, x.kind_hint, x.season, x.episode, x.episode_name, x.watched_at, true,
              x.duration_sec, x.external_id, x.tmdb_hint, x.dedupe_key
         FROM json_populate_recordset(NULL::views, $2::json) x
        WHERE NOT EXISTS (
          SELECT 1 FROM views o
           WHERE o.account_id = $1 AND o.source <> 'trakt' AND o.raw_key = x.raw_key
             AND o.watched_at BETWEEN x.watched_at - interval '1 day' AND x.watched_at + interval '1 day'
             AND (x.kind_hint = 'movie' OR (o.season IS NOT DISTINCT FROM x.season AND o.episode IS NOT DISTINCT FROM x.episode)))
       ON CONFLICT (account_id, dedupe_key) DO NOTHING`,
      [accountId, JSON.stringify(views)],
    );
    // Aliase mit bekannter TMDB-ID direkt zuordnen (kein Suchabgleich nötig)
    const seen = new Map();
    for (const v of views) if (!seen.has(v.raw_key)) seen.set(v.raw_key, v);
    for (const v of seen.values()) {
      let titleId = null;
      if (v.tmdb_hint && tmdb.enabled()) {
        const t = await db.query(
          `INSERT INTO titles (kind, tmdb_id, name) VALUES ($1, $2, $3)
           ON CONFLICT (kind, tmdb_id) WHERE tmdb_id IS NOT NULL DO UPDATE SET updated_at = now() RETURNING id`,
          [v.kind_hint, v.tmdb_hint, v.raw_name],
        );
        titleId = t.rows[0].id;
      }
      await db.query(
        `INSERT INTO title_aliases (account_id, raw_key, raw_name, kind_hint, title_id, confidence, state, checked_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $5::bigint IS NULL THEN NULL ELSE now() END)
         ON CONFLICT (account_id, raw_key) DO UPDATE SET
           title_id = CASE WHEN title_aliases.state = 'manual' THEN title_aliases.title_id ELSE COALESCE(EXCLUDED.title_id, title_aliases.title_id) END,
           state = CASE WHEN title_aliases.state = 'manual' THEN 'manual' WHEN EXCLUDED.title_id IS NOT NULL THEN 'matched' ELSE title_aliases.state END,
           confidence = CASE WHEN EXCLUDED.title_id IS NOT NULL AND title_aliases.state <> 'manual' THEN 1 ELSE title_aliases.confidence END`,
        [accountId, v.raw_key, v.raw_name, v.kind_hint, titleId, titleId ? 1 : null, titleId ? 'matched' : 'pending'],
      );
    }
    return r.rowCount;
  });
}

/** Alle verbundenen Konten abgleichen (Zeitplan). */
export async function syncAll() {
  if (!available()) return { skipped: 'disabled' };
  const { rows } = await query(`SELECT account_id FROM trakt_tokens WHERE last_error IS NULL OR last_error NOT LIKE 'Zugriff abgelaufen%'`);
  const out = { accounts: rows.length, added: 0, errors: 0 };
  for (const r of rows) {
    try { out.added += (await syncAccount(r.account_id)).added; } catch { out.errors++; }
  }
  return out;
}

// ---------------------------------------------------------------- Läuft gerade (30 s Cache)
const nowCache = new Map();
export async function watching(accountId) {
  const c = nowCache.get(accountId);
  if (c && Date.now() - c.at < 30_000) return c.data;
  let data = null;
  try {
    const token = await accessToken(accountId);
    const { data: w } = await traktFetch(token, '/users/me/watching', { allow204: true, params: { extended: 'full' } });
    if (w) {
      const isEp = w.type === 'episode';
      const show = isEp ? w.show : w.movie;
      let poster = null;
      const tmdbId = show?.ids?.tmdb;
      if (tmdbId && tmdb.enabled()) {
        const { rows } = await query('SELECT poster_path, backdrop_path FROM titles WHERE kind = $1 AND tmdb_id = $2', [isEp ? 'tv' : 'movie', tmdbId]);
        poster = rows[0]?.poster_path || null;
      }
      data = {
        kind: isEp ? 'tv' : 'movie', name: show?.title, year: show?.year || null, season: w.episode?.season ?? null, episode: w.episode?.number ?? null,
        episode_name: w.episode?.title || null, started_at: w.started_at, expires_at: w.expires_at, poster_path: poster,
      };
    }
  } catch (err) {
    if (err instanceof UserError) data = null; else throw err;
  }
  nowCache.set(accountId, { at: Date.now(), data });
  return data;
}

export async function ratingsFor(accountId) {
  const { rows } = await query('SELECT kind, tmdb_id, rating FROM ratings WHERE account_id = $1', [accountId]);
  return rows;
}
