// Statistik über den Schauverlauf eines Kontos.
// Schauzeit = echte Dauer, sonst Laufzeit aus TMDB (Folge → Serie → Standard); alles ohne echte Dauer gilt als „geschätzt“.
import { config } from './config.js';
import { query } from './db.js';

export const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '365d': 365, all: null };
export const DEFAULT_SECS = { tv: 45 * 60, movie: 105 * 60 };
const TZ = config.timezone;

// Doppelte Zählung vermeiden: views.superseded wird in dedupe.js beim Speichern berechnet (siehe dort).
const NOT_SUPERSEDED = 'AND NOT v.superseded';
/** Sichtbarer Zeitraum: ab „Verlauf ab“ des Kontos (Einstellung), sonst ab 1990 – $1 ist immer das Konto. */
export const FROM_SQL = `v.watched_at >= COALESCE((SELECT history_from FROM accounts WHERE id = $1)::timestamp AT TIME ZONE '${config.timezone}', TIMESTAMPTZ '1990-01-01')`;

/**
 * Basis-CTE „v“: ein Eintrag pro Seh-Ereignis mit aufgelöstem Titel und Sekunden.
 * $1 = Konto, $2 = Tage (NULL = alles), $3 = Zeitzone. Weitere Parameter ab $4.
 */
export const BASE_SQL = `
  v AS (
    SELECT v.id,
           -- Trakt meldet keinen Anbieter: eindeutigen Abo-Dienst aus TMDB übernehmen, sonst „trakt“
           CASE WHEN v.source = 'trakt' AND t.provider IS NOT NULL THEN t.provider ELSE v.source END AS source,
           v.source AS origin, v.profile, v.raw_title, v.raw_key, v.season, v.episode, v.episode_name, v.watched_at, v.time_known,
           v.device, v.duration_sec,
           COALESCE(t.kind, v.kind_hint) AS kind,
           COALESCE('t' || t.id, 'r' || md5(v.raw_key)) AS tkey,
           t.id AS title_id, t.tmdb_id, COALESCE(t.name, al.raw_name) AS name, t.year, t.poster_path, t.backdrop_path,
           t.genres, t.countries, t.cast_names, t.overview, al.state AS match_state,
           COALESCE(v.duration_sec, e.runtime * 60, t.runtime * 60,
                    CASE WHEN COALESCE(t.kind, v.kind_hint) = 'movie' THEN ${DEFAULT_SECS.movie} ELSE ${DEFAULT_SECS.tv} END) AS secs,
           v.duration_sec IS NULL AS estimated,
           (v.watched_at AT TIME ZONE $3) AS local_at,
           COALESCE(v.season::text, '?') || ':' || COALESCE(v.episode::text, lower(v.episode_name), lower(v.raw_title)) AS ep_key
      FROM views v
      LEFT JOIN title_aliases al ON al.account_id = v.account_id AND al.raw_key = v.raw_key
      LEFT JOIN titles t ON t.id = al.title_id
      LEFT JOIN episodes e ON e.title_id = t.id AND e.season = v.season AND e.episode = v.episode
     WHERE v.account_id = $1
       AND ($2::int IS NULL OR v.watched_at >= now() - make_interval(days => $2::int))
       AND ${FROM_SQL}
       ${NOT_SUPERSEDED}
  )`;

const run = (sql, accountId, days, extra = []) => query(`WITH ${BASE_SQL} ${sql}`, [accountId, days ?? null, TZ, ...extra]).then((r) => r.rows);

// ---------------------------------------------------------------- Status
export async function counts(accountId) {
  const { rows } = await query(
    `SELECT count(*) FILTER (WHERE ${FROM_SQL}) AS views, min(watched_at) FILTER (WHERE ${FROM_SQL}) AS first, max(watched_at) AS last,
            count(*) FILTER (WHERE NOT ${FROM_SQL}) AS hidden,
            COALESCE(array_agg(DISTINCT source) FILTER (WHERE source IS NOT NULL), '{}') AS sources
       FROM views v WHERE account_id = $1`,
    [accountId],
  );
  return rows[0];
}

// ---------------------------------------------------------------- Übersicht
export async function overview(accountId, days) {
  const [[tot], daily, hours, services, prev] = await Promise.all([
    run(
      `SELECT COALESCE(sum(secs), 0) AS secs, COALESCE(sum(secs) FILTER (WHERE estimated), 0) AS est_secs, count(*) AS views,
              count(DISTINCT tkey || '|' || ep_key) FILTER (WHERE kind = 'tv') AS episodes,
              count(DISTINCT tkey) FILTER (WHERE kind = 'movie') AS movies,
              count(DISTINCT tkey) FILTER (WHERE kind = 'tv') AS series,
              count(DISTINCT local_at::date) AS active_days,
              min(local_at::date) AS first_day
         FROM v`,
      accountId, days,
    ),
    run(`SELECT to_char(local_at::date, 'YYYY-MM-DD') AS day, sum(secs) AS secs, count(*) AS views FROM v GROUP BY 1 ORDER BY 1`, accountId, days),
    run(`SELECT extract(hour FROM local_at)::int AS hour, sum(secs) AS secs FROM v WHERE time_known GROUP BY 1`, accountId, days),
    run(`SELECT source, sum(secs) AS secs, count(*) AS views, count(DISTINCT tkey) AS titles FROM v GROUP BY 1 ORDER BY 2 DESC`, accountId, days),
    days
      ? query(
          `SELECT COALESCE(sum(COALESCE(v.duration_sec, e.runtime * 60, t.runtime * 60, CASE WHEN COALESCE(t.kind, v.kind_hint) = 'movie' THEN ${DEFAULT_SECS.movie} ELSE ${DEFAULT_SECS.tv} END)), 0) AS secs
             FROM views v
             LEFT JOIN title_aliases al ON al.account_id = v.account_id AND al.raw_key = v.raw_key
             LEFT JOIN titles t ON t.id = al.title_id
             LEFT JOIN episodes e ON e.title_id = t.id AND e.season = v.season AND e.episode = v.episode
            WHERE v.account_id = $1 AND v.watched_at >= now() - make_interval(days => $2::int * 2)
              AND v.watched_at < now() - make_interval(days => $2::int)
              ${NOT_SUPERSEDED} AND ${FROM_SQL}`,
          [accountId, days],
        ).then((r) => r.rows[0])
      : Promise.resolve(null),
  ]);
  // Längste Serie (Tage am Stück) und bester Tag
  let streak = { days: 0, from: null, to: null };
  let cur = 0;
  let curFrom = null;
  let prevDay = null;
  let best = null;
  for (const d of daily) {
    const dt = new Date(`${d.day}T12:00:00Z`);
    if (prevDay && (dt - prevDay) / 864e5 === 1) cur++;
    else { cur = 1; curFrom = d.day; }
    if (cur > streak.days) streak = { days: cur, from: curFrom, to: d.day };
    prevDay = dt;
    if (!best || d.secs > best.secs) best = d;
  }
  const spanDays = days || (tot.first_day ? Math.max(1, Math.round((Date.now() - new Date(`${tot.first_day}T00:00:00Z`)) / 864e5) + 1) : 1);
  const favHour = hours.reduce((a, h) => (!a || h.secs > a.secs ? h : a), null);
  return {
    secs: tot.secs,
    estimatedShare: tot.secs ? tot.est_secs / tot.secs : 0,
    views: tot.views,
    episodes: tot.episodes,
    movies: tot.movies,
    series: tot.series,
    activeDays: tot.active_days,
    avgSecsPerDay: tot.secs / spanDays,
    prevSecs: prev ? prev.secs : null,
    streak,
    bestDay: best,
    favHour: favHour ? favHour.hour : null,
    hours,
    services,
    daily,
  };
}

// ---------------------------------------------------------------- Top-Listen
export async function top(accountId, days, kind = 'series', limit = 50) {
  const lim = Math.min(100, Math.max(5, Number(limit) || 50));
  switch (kind) {
    case 'movies':
      return run(
        `SELECT tkey, title_id, max(name) AS name, max(year) AS year, max(poster_path) AS poster_path, max(backdrop_path) AS backdrop_path,
                max(genres) AS genres, max(overview) AS overview, sum(secs) AS secs, count(*) AS views,
                bool_or(estimated) AS estimated, max(watched_at) AS last
           FROM v WHERE kind = 'movie' GROUP BY tkey, title_id ORDER BY secs DESC, views DESC LIMIT $4`,
        accountId, days, [lim],
      );
    case 'genres':
      return run(
        `SELECT g AS name, sum(secs) AS secs, count(DISTINCT tkey) AS titles FROM v, unnest(genres) g
          GROUP BY g ORDER BY secs DESC LIMIT $4`,
        accountId, days, [lim],
      );
    case 'actors':
      return run(
        `SELECT c AS name, sum(secs) AS secs, count(DISTINCT tkey) AS titles,
                (array_agg(DISTINCT name))[1:3] AS examples,
                (SELECT p.profile_path FROM people p WHERE p.name = c) AS profile_path
           FROM v, unnest(cast_names[1:6]) c GROUP BY c ORDER BY secs DESC LIMIT $4`,
        accountId, days, [lim],
      );
    case 'countries':
      return run(
        `SELECT c AS name, sum(secs) AS secs, count(DISTINCT tkey) AS titles FROM v, unnest(countries) c
          GROUP BY c ORDER BY secs DESC LIMIT $4`,
        accountId, days, [lim],
      );
    default:
      return run(
        `SELECT tkey, title_id, max(name) AS name, max(year) AS year, max(poster_path) AS poster_path, max(backdrop_path) AS backdrop_path,
                max(genres) AS genres, max(overview) AS overview, sum(secs) AS secs,
                count(DISTINCT ep_key) AS episodes, bool_or(estimated) AS estimated, max(watched_at) AS last
           FROM v WHERE kind = 'tv' GROUP BY tkey, title_id ORDER BY secs DESC LIMIT $4`,
        accountId, days, [lim],
      );
  }
}

// ---------------------------------------------------------------- Schauzeiten & Binges
export async function times(accountId, days) {
  const [grid, untimed, rows] = await Promise.all([
    run(
      `SELECT (extract(isodow FROM local_at)::int - 1) AS dow, extract(hour FROM local_at)::int AS hour, sum(secs) AS secs, count(*) AS views
         FROM v WHERE time_known GROUP BY 1, 2`,
      accountId, days,
    ),
    run(`SELECT count(*) AS n FROM v WHERE NOT time_known`, accountId, days),
    run(
      `SELECT tkey, name, poster_path, kind, ep_key, watched_at, time_known, secs, local_at::date AS day
         FROM v WHERE kind = 'tv' ORDER BY watched_at`,
      accountId, days,
    ),
  ]);
  return { grid, untimed: untimed[0].n, binges: findBinges(rows) };
}

/** Binge = ≥ 3 verschiedene Folgen derselben Serie am Stück (Pause < 30 Min.) bzw. am selben Tag ohne Uhrzeit. */
export function findBinges(rows, min = 3) {
  const out = [];
  let cur = null;
  const flush = () => {
    if (cur && cur.eps.size >= min) {
      out.push({ tkey: cur.tkey, name: cur.name, poster_path: cur.poster_path, episodes: cur.eps.size, secs: cur.secs, start: cur.start, end: cur.end, timed: cur.timed });
    }
  };
  for (const r of rows) {
    const t = new Date(r.watched_at).getTime();
    const cont = cur && cur.tkey === r.tkey && (r.time_known && cur.timed
      ? t - cur.endMs < 30 * 60_000
      : !r.time_known && !cur.timed && String(r.day) === String(cur.day));
    if (!cont) { flush(); cur = { tkey: r.tkey, name: r.name, poster_path: r.poster_path, eps: new Set(), secs: 0, start: r.watched_at, endMs: t, day: r.day, timed: r.time_known }; }
    cur.eps.add(r.ep_key);
    cur.secs += r.secs;
    cur.endMs = Math.max(cur.endMs, t + r.secs * 1000);
    cur.end = new Date(cur.endMs).toISOString();
  }
  flush();
  return out.sort((a, b) => b.episodes - a.episodes || b.secs - a.secs);
}

// ---------------------------------------------------------------- Serien-Fortschritt & Weiterschauen
export async function progress(accountId) {
  const rows = await run(
    `SELECT title_id, max(name) AS name, max(poster_path) AS poster_path, max(backdrop_path) AS backdrop_path, max(watched_at) AS last, sum(secs) AS secs,
            array_agg(DISTINCT season || ':' || episode) FILTER (WHERE season > 0 AND episode > 0) AS seen,
            count(DISTINCT ep_key) AS ep_views
       FROM v WHERE kind = 'tv' AND title_id IS NOT NULL GROUP BY title_id`,
    accountId, null,
  );
  if (!rows.length) return { series: [], continue: [] };
  const ids = rows.map((r) => r.title_id);
  const [{ rows: meta }, { rows: eps }] = await Promise.all([
    query('SELECT id, seasons, episode_count, status FROM titles WHERE id = ANY($1)', [ids]),
    query('SELECT title_id, season, episode, name FROM episodes WHERE title_id = ANY($1) AND episode > 0', [ids]),
  ]);
  const metaBy = new Map(meta.map((m) => [m.id, m]));
  const epName = new Map(eps.map((e) => [`${e.title_id}|${e.season}:${e.episode}`, e.name]));
  const series = rows.map((r) => {
    const m = metaBy.get(r.title_id) || {};
    const seen = new Set(r.seen || []);
    const seasons = (m.seasons || []).map((s) => ({
      season: s.season,
      total: s.episodes || 0,
      seen: [...seen].filter((k) => Number(k.split(':')[0]) === s.season && Number(k.split(':')[1]) <= (s.episodes || 0)).length,
    }));
    const seenCount = seasons.length ? seasons.reduce((a, s) => a + s.seen, 0) : seen.size;
    const total = m.episode_count || null;
    // Nächste Folge = nach der höchsten gesehenen
    let next = null;
    if (seen.size && seasons.length) {
      const [ls, le] = [...seen].map((k) => k.split(':').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]).pop();
      const s = seasons.find((x) => x.season === ls);
      if (s && le < s.total) next = { season: ls, episode: le + 1 };
      else {
        const ns = seasons.find((x) => x.season > ls && x.total > 0);
        if (ns) next = { season: ns.season, episode: 1 };
      }
      if (next) next.name = epName.get(`${r.title_id}|${next.season}:${next.episode}`) || null;
    }
    return {
      title_id: r.title_id, name: r.name, poster_path: r.poster_path, backdrop_path: r.backdrop_path, last: r.last, secs: r.secs,
      seen: seenCount, total, pct: total ? Math.min(1, seenCount / total) : null, seasons, next, status: m.status || null,
      unnumbered: Math.max(0, r.ep_views - seen.size),
    };
  });
  series.sort((a, b) => new Date(b.last) - new Date(a.last));
  const yearAgo = Date.now() - 365 * 864e5;
  const cont = series.filter((s) => s.next && new Date(s.last).getTime() > yearAgo && (s.pct === null || s.pct < 1)).slice(0, 20);
  return { series, continue: cont };
}

// ---------------------------------------------------------------- Verlauf
/** Gruppe eines Eintrags: die letzten 7 Tage als „Woche“, davor Kalendermonate (JJJJ-MM). */
const GROUP_SQL = `CASE WHEN local_at::date > (now() AT TIME ZONE $3)::date - 7 THEN 'week' ELSE to_char(local_at, 'YYYY-MM') END`;
const SEARCH_SQL = (n) => `($${n} = '' OR name ILIKE '%' || $${n} || '%' OR raw_title ILIKE '%' || $${n} || '%' OR episode_name ILIKE '%' || $${n} || '%')`;
const cleanTerm = (q) => String(q || '').trim().slice(0, 100);

export async function history(accountId, { before = null, q = '', limit = 60, group = null } = {}) {
  const lim = Math.min(200, Math.max(10, Number(limit) || 60));
  const g = /^(week|\d{4}-\d{2})$/.test(String(group || '')) ? String(group) : null;
  return run(
    `SELECT id, tkey, title_id, kind, name, raw_title, season, episode, episode_name, poster_path, source, origin, profile, device,
            watched_at, time_known, secs, estimated, match_state
       FROM v
      WHERE ($4::timestamptz IS NULL OR watched_at < $4::timestamptz)
        AND ${SEARCH_SQL(5)}
        AND ($7::text IS NULL OR ${GROUP_SQL} = $7::text)
      ORDER BY watched_at DESC, id DESC LIMIT $6`,
    accountId, null, [before, cleanTerm(q), lim, g],
  );
}

/** Verlauf zusammengefasst: letzte Woche, danach monatsweise – mit Summe und den meistgesehenen Titeln. */
export async function historyGroups(accountId, { q = '' } = {}) {
  const rows = await run(
    `, g AS (SELECT ${GROUP_SQL} AS grp, * FROM v WHERE ${SEARCH_SQL(4)}),
       tops AS (
         SELECT grp, tkey, max(name) AS name, max(poster_path) AS poster_path, sum(secs) AS secs,
                row_number() OVER (PARTITION BY grp ORDER BY sum(secs) DESC, max(name)) AS rn
           FROM g GROUP BY grp, tkey)
     SELECT g.grp, count(*)::int AS n, sum(g.secs)::bigint AS secs, count(DISTINCT g.tkey)::int AS titles,
            count(*) FILTER (WHERE g.kind = 'tv')::int AS episodes, count(*) FILTER (WHERE g.kind = 'movie')::int AS movies,
            min(g.local_at::date) AS first_day, max(g.local_at::date) AS last_day,
            (SELECT json_agg(json_build_object('name', t.name, 'poster_path', t.poster_path) ORDER BY t.rn) FROM tops t WHERE t.grp = g.grp AND t.rn <= 4) AS top
       FROM g GROUP BY g.grp
      ORDER BY (g.grp = 'week') DESC, g.grp DESC`,
    accountId, null, [cleanTerm(q)],
  );
  return rows.map((r) => ({ ...r, secs: Number(r.secs) }));
}

/** Detailansicht eines Titels (über title_id oder Roh-Schlüssel). */
export async function titleDetail(accountId, { titleId = null, tkey = null } = {}) {
  const key = titleId ? `t${Number(titleId)}` : String(tkey || '');
  const views = await run(
    `SELECT id, kind, name, raw_title, raw_key, season, episode, episode_name, source, origin, profile, device, watched_at, time_known, secs, estimated,
            match_state, title_id
       FROM v WHERE tkey = $4 ORDER BY watched_at`,
    accountId, null, [key],
  );
  if (!views.length) return null;
  const tid = views[0].title_id;
  const [{ rows: trows }, { rows: eps }] = await Promise.all([
    tid ? query('SELECT * FROM titles WHERE id = $1', [tid]) : Promise.resolve({ rows: [] }),
    tid ? query('SELECT season, episode, name, runtime FROM episodes WHERE title_id = $1 AND episode > 0 ORDER BY season, episode', [tid]) : Promise.resolve({ rows: [] }),
  ]);
  const t = trows[0] || null;
  const secs = views.reduce((a, v) => a + v.secs, 0);
  const sources = [...new Set(views.map((v) => v.source))];
  return {
    tkey: key,
    raw_keys: [...new Set(views.map((v) => v.raw_key))],
    kind: views[0].kind,
    name: t?.name || views[0].name,
    title: t && {
      id: t.id, tmdb_id: t.tmdb_id, year: t.year, overview: t.overview, poster_path: t.poster_path, backdrop_path: t.backdrop_path,
      genres: t.genres, countries: t.countries, cast: t.cast_names, runtime: t.runtime, seasons: t.seasons, episode_count: t.episode_count, status: t.status,
    },
    match_state: views[0].match_state,
    secs,
    estimated: views.some((v) => v.estimated),
    count: views.length,
    first: views[0].watched_at,
    last: views[views.length - 1].watched_at,
    sources,
    views: views.slice(-500).reverse(),
    episodes: eps,
  };
}

/** Einträge pro Jahr und Quelle (alle, auch ausgeblendete) – hilft beim Festlegen von „Verlauf ab“. */
export async function yearsOverview(accountId) {
  const { rows } = await query(
    `SELECT extract(year FROM watched_at AT TIME ZONE $2)::int AS year, count(*)::int AS n,
            count(*) FILTER (WHERE source = 'trakt')::int AS trakt
       FROM views WHERE account_id = $1 AND NOT superseded GROUP BY 1 ORDER BY 1`,
    [accountId, TZ],
  );
  return rows;
}
