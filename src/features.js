// Konto-übergreifende Funktionen: Datenexport (DSGVO), später Rückblick & Freunde.
import { query } from './db.js';

/** Alle eigenen Daten als JSON (ohne Passwort-Hash und Tokens). */
export async function exportData(accountId) {
  const one = (sql) => query(sql, [accountId]).then((r) => r.rows);
  const [account, views, imports, aliases, ratings, friends, notes, collection] = await Promise.all([
    one(`SELECT id, username, is_admin, theme, lang, festive, glass, birthday, created_at, last_login_at, privacy_accepted_at FROM accounts WHERE id = $1`),
    one(`SELECT source, profile, raw_title, season, episode, episode_name, watched_at, time_known, duration_sec, device, country, created_at FROM views WHERE account_id = $1 ORDER BY watched_at`),
    one(`SELECT source, filename, profile, rows_total, rows_added, first_at, last_at, created_at FROM imports WHERE account_id = $1 ORDER BY created_at`),
    one(`SELECT al.raw_name, al.kind_hint, al.state, t.kind, t.tmdb_id, t.name FROM title_aliases al LEFT JOIN titles t ON t.id = al.title_id WHERE al.account_id = $1`),
    one(`SELECT kind, tmdb_id, rating, rated_at FROM ratings WHERE account_id = $1`),
    one(`SELECT a.username, f.status, f.created_at FROM friendships f JOIN accounts a ON a.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END WHERE $1 IN (f.requester_id, f.addressee_id)`),
    one(`SELECT key, bronze, silver, gold, platinum, created_at FROM note_ledger WHERE account_id = $1 ORDER BY created_at`),
    one(`SELECT item_id, format, rarity, edition, name, year, acquired_at FROM collection WHERE account_id = $1 ORDER BY acquired_at`),
  ]);
  return { format: 'watchlfy-export', version: 1, exported_at: new Date().toISOString(), account: account[0], views, imports, titles: aliases, ratings, friends, notes, collection };
}

// ================================================================ Jahresrückblick
import { config } from './config.js';
import { withTransaction } from './db.js';
import * as stats from './stats.js';
import { UserError } from './users.js';

export async function wrappedYears(accountId) {
  const { rows } = await query(
    `SELECT DISTINCT extract(year FROM watched_at AT TIME ZONE $2)::int AS y FROM views WHERE account_id = $1 ORDER BY y DESC`,
    [accountId, config.timezone],
  );
  return rows.map((r) => r.y);
}

/** „Dein Jahr in Serien“: alle Werte für die Story-Folien. */
export async function wrapped(accountId, year) {
  const yr = Number(year);
  const where = `extract(year FROM local_at) = ${Number.isInteger(yr) ? yr : 0}`;
  const run = (sql) => query(`WITH ${stats.BASE_SQL}, y AS (SELECT * FROM v WHERE ${where}) ${sql}`, [accountId, null, config.timezone]).then((r) => r.rows);
  const [[tot], series, movies, genres, actors, months, hours, days, services, firsts, newSeries, binges] = await Promise.all([
    run(`SELECT COALESCE(sum(secs), 0) AS secs, count(*) AS views, count(DISTINCT tkey || '|' || ep_key) FILTER (WHERE kind = 'tv') AS episodes,
                count(DISTINCT tkey) FILTER (WHERE kind = 'movie') AS movies, count(DISTINCT tkey) FILTER (WHERE kind = 'tv') AS series,
                count(DISTINCT local_at::date) AS active_days, COALESCE(sum(secs) FILTER (WHERE estimated), 0) AS est_secs FROM y`),
    run(`SELECT tkey, title_id, max(name) AS name, max(poster_path) AS poster_path, max(backdrop_path) AS backdrop_path, sum(secs) AS secs, count(DISTINCT ep_key) AS episodes
           FROM y WHERE kind = 'tv' GROUP BY tkey, title_id ORDER BY secs DESC LIMIT 5`),
    run(`SELECT tkey, title_id, max(name) AS name, max(poster_path) AS poster_path, max(year) AS year, sum(secs) AS secs, count(*) AS views
           FROM y WHERE kind = 'movie' GROUP BY tkey, title_id ORDER BY views DESC, secs DESC LIMIT 5`),
    run(`SELECT g AS name, sum(secs) AS secs FROM y, unnest(genres) g GROUP BY g ORDER BY secs DESC LIMIT 5`),
    run(`SELECT c AS name, sum(secs) AS secs, count(DISTINCT tkey) AS titles FROM y, unnest(cast_names[1:6]) c GROUP BY c ORDER BY secs DESC LIMIT 3`),
    run(`SELECT extract(month FROM local_at)::int AS m, sum(secs) AS secs FROM y GROUP BY 1 ORDER BY 1`),
    run(`SELECT extract(hour FROM local_at)::int AS h, sum(secs) AS secs FROM y WHERE time_known GROUP BY 1`),
    run(`SELECT to_char(local_at::date, 'YYYY-MM-DD') AS day, sum(secs) AS secs FROM y GROUP BY 1 ORDER BY 1`),
    run(`SELECT source, sum(secs) AS secs FROM y GROUP BY 1 ORDER BY 2 DESC`),
    run(`(SELECT 'first' AS k, name, poster_path, kind, watched_at FROM y ORDER BY watched_at LIMIT 1)
         UNION ALL (SELECT 'last', name, poster_path, kind, watched_at FROM y ORDER BY watched_at DESC LIMIT 1)`),
    run(`SELECT count(*) AS n FROM (SELECT tkey FROM v WHERE kind = 'tv' GROUP BY tkey HAVING extract(year FROM min(local_at)) = ${Number.isInteger(yr) ? yr : 0}) s`),
    run(`SELECT tkey, name, poster_path, kind, ep_key, watched_at, time_known, secs, local_at::date AS day FROM y WHERE kind = 'tv' ORDER BY watched_at`),
  ]);
  // Längste Serie (Tage am Stück)
  let streak = 0;
  let cur = 0;
  let prev = null;
  for (const d of days) {
    const t = new Date(`${d.day}T12:00:00Z`).getTime();
    cur = prev && t - prev === 864e5 ? cur + 1 : 1;
    streak = Math.max(streak, cur);
    prev = t;
  }
  const best = days.reduce((a, d) => (!a || d.secs > a.secs ? d : a), null);
  const favHour = hours.reduce((a, h) => (!a || h.secs > a.secs ? h : a), null);
  const monthArr = Array.from({ length: 12 }, (_, i) => months.find((m) => m.m === i + 1)?.secs || 0);
  const bigBinge = stats.findBinges(binges)[0] || null;
  return {
    year: yr, ...tot, estimatedShare: tot.secs ? tot.est_secs / tot.secs : 0,
    topSeries: series, topMovies: movies, genres, actors, months: monthArr, favHour: favHour?.h ?? null,
    bestDay: best, streak, services, first: firsts.find((f) => f.k === 'first') || null, last: firsts.find((f) => f.k === 'last') || null,
    newSeries: newSeries[0]?.n || 0, binge: bigBinge,
  };
}

// ================================================================ Freunde
const other = (p) => `CASE WHEN f.requester_id = ${p} THEN f.addressee_id ELSE f.requester_id END`;
const AV = `CASE WHEN av.updated_at IS NOT NULL THEN '/avatar/' || a.id || '?v=' || floor(extract(epoch FROM av.updated_at))::bigint END`;

export async function listFriends(accountId) {
  const { rows } = await query(
    `SELECT f.status, f.requester_id = $1 AS outgoing, f.created_at, f.accepted_at, a.id, a.username, ${AV} AS avatar_url
       FROM friendships f JOIN accounts a ON a.id = ${other('$1')}
       LEFT JOIN account_avatars av ON av.account_id = a.id
      WHERE f.requester_id = $1 OR f.addressee_id = $1
      ORDER BY f.accepted_at DESC NULLS LAST, f.created_at DESC`,
    [accountId],
  );
  const pick = ({ id, username, avatar_url, created_at, accepted_at }) => ({ id, username, avatar_url, created_at, accepted_at });
  return {
    friends: rows.filter((r) => r.status === 'accepted').map(pick),
    incoming: rows.filter((r) => r.status === 'pending' && !r.outgoing).map(pick),
    outgoing: rows.filter((r) => r.status === 'pending' && r.outgoing).map(pick),
  };
}

export async function requestFriend(accountId, username) {
  const name = String(username || '').trim();
  return withTransaction(async (db) => {
    const { rows } = await db.query('SELECT id, username FROM accounts WHERE lower(username) = lower($1)', [name]);
    const target = rows[0];
    if (!target) throw new UserError('Benutzer nicht gefunden.', 404, 'friendNotFound');
    if (target.id === accountId) throw new UserError('Das bist du selbst.', 400, 'friendSelf');
    const { rows: ex } = await db.query(
      `SELECT requester_id, status FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`,
      [accountId, target.id],
    );
    if (ex[0]?.status === 'accepted') throw new UserError('Ihr seid schon befreundet.', 409, 'friendAlready');
    if (ex[0] && ex[0].requester_id === accountId) throw new UserError('Anfrage wurde schon gesendet.', 409, 'friendPending');
    if (ex[0]) {
      await db.query(`UPDATE friendships SET status = 'accepted', accepted_at = now() WHERE requester_id = $1 AND addressee_id = $2`, [target.id, accountId]);
      return { status: 'accepted', username: target.username };
    }
    const { rows: cnt } = await db.query('SELECT count(*) AS n FROM friendships WHERE requester_id = $1 OR addressee_id = $1', [accountId]);
    if (cnt[0].n >= 100) throw new UserError('Zu viele Freunde.', 400, 'friendLimit');
    await db.query('INSERT INTO friendships (requester_id, addressee_id) VALUES ($1, $2)', [accountId, target.id]);
    return { status: 'pending', username: target.username };
  });
}

export async function acceptFriend(accountId, otherId) {
  const r = await query(`UPDATE friendships SET status = 'accepted', accepted_at = now() WHERE requester_id = $2 AND addressee_id = $1 AND status = 'pending'`, [accountId, otherId]);
  if (!r.rowCount) throw new UserError('Anfrage nicht gefunden.', 404, 'notFound');
}

export async function removeFriend(accountId, otherId) {
  await query(`DELETE FROM friendships WHERE (requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1)`, [accountId, otherId]);
}

export async function areFriends(a, b) {
  const { rows } = await query(
    `SELECT 1 FROM friendships WHERE status = 'accepted' AND ((requester_id = $1 AND addressee_id = $2) OR (requester_id = $2 AND addressee_id = $1))`,
    [a, b],
  );
  return rows.length > 0;
}

function cosine(a, b) {
  let dot = 0; let na = 0; let nb = 0;
  for (const k of new Set([...a.keys(), ...b.keys()])) {
    const x = a.get(k) || 0; const y = b.get(k) || 0;
    dot += x * y; na += x * x; nb += y * y;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

async function tasteOf(accountId, days) {
  const [ov, series, movies, genres] = await Promise.all([
    stats.overview(accountId, days), stats.top(accountId, days, 'series', 100), stats.top(accountId, days, 'movies', 100), stats.top(accountId, days, 'genres', 30),
  ]);
  return { ov, series, movies, genres };
}

/** Vergleich mit einem Freund: Match-Wert, gemeinsame Titel, Top 5 beider. Nur zusammengefasste Werte. */
export async function compare(account, friendId, days) {
  if (!(await areFriends(account.id, friendId))) throw new UserError('Ihr seid nicht befreundet.', 403, 'notFriends');
  const { rows } = await query('SELECT username FROM accounts WHERE id = $1', [friendId]);
  const [me, fr] = await Promise.all([tasteOf(account.id, days), tasteOf(friendId, days)]);
  const keyOf = (x) => (x.title_id ? `t${x.title_id}` : `n${String(x.name).toLowerCase()}`);
  const vec = (list) => new Map(list.map((x) => [keyOf(x), Math.sqrt(x.secs)]));
  const titleScore = cosine(vec([...me.series, ...me.movies]), vec([...fr.series, ...fr.movies]));
  const genreScore = cosine(new Map(me.genres.map((g) => [g.name, g.secs])), new Map(fr.genres.map((g) => [g.name, g.secs])));
  const match = Math.round(Math.min(1, titleScore * 0.65 + genreScore * 0.35) * 100);
  const frBy = new Map([...fr.series, ...fr.movies].map((x) => [keyOf(x), x]));
  const shared = [...me.series, ...me.movies]
    .filter((x) => frBy.has(keyOf(x)))
    .map((x) => ({ name: x.name, poster_path: x.poster_path, title_id: x.title_id, kind: me.series.includes(x) ? 'tv' : 'movie', mine: x.secs, theirs: frBy.get(keyOf(x)).secs }))
    .sort((a, b) => Math.min(b.mine, b.theirs) - Math.min(a.mine, a.theirs))
    .slice(0, 12);
  const top5 = (t) => ({
    series: t.series.slice(0, 5).map(({ name, poster_path, secs, title_id }) => ({ name, poster_path, secs, title_id })),
    movies: t.movies.slice(0, 5).map(({ name, poster_path, secs, title_id }) => ({ name, poster_path, secs, title_id })),
    genres: t.genres.slice(0, 5).map(({ name, secs }) => ({ name, secs })),
  });
  const sum = (o) => ({ secs: o.secs, episodes: o.episodes, movies: o.movies, series: o.series, favHour: o.favHour, streak: o.streak.days });
  return {
    friend: { id: friendId, username: rows[0]?.username }, match, sharedCount: shared.length, shared,
    me: { ...sum(me.ov), top: top5(me) }, them: { ...sum(fr.ov), top: top5(fr) },
  };
}
