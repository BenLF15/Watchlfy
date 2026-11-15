// Sammlung & Kino-Kasse:
// - Währung: Filmmeter (m, Kleingeld – wächst mit jeder geschauten Stunde) und Goldtickets (t, für Seltenes).
//   Buchungen in note_ledger (Spalten meters/tickets), einmalige Belohnungen über eindeutigen Schlüssel.
// - Begehbare Retro-Videothek mit täglich neuem Angebot aus den eigenen Serien/Filmen (DVD, Blu-ray, Filmplakat).
// - Seltenheiten: gewöhnlich → selten (Steelbook) → episch (Collector’s Edition) → legendär (signiert) → mythisch (holografisch).
// - Vorführraum: tägliches Quiz (Standbild wird schärfer = weniger Punkte) und Veredeln von Sammlerstücken.
import crypto from 'node:crypto';
import { config } from './config.js';
import { query, withTransaction } from './db.js';
import { areFriends, wrappedYears } from './features.js';
import * as tmdb from './tmdb.js';
import * as stats from './stats.js';
import { UserError } from './users.js';

export const CURRENCIES = ['meters', 'tickets'];
export const RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'];
const EDITIONS = {
  dvd: ['standard', 'steelbook', 'collector', 'signed', 'holo'],
  bluray: ['standard', 'steelbook', 'collector', 'signed', 'holo'],
  poster: ['print', 'teaser', 'vintage', 'signed', 'holo'],
};
/** Betrag: Filmmeter und Goldtickets. */
const R = (meters = 0, tickets = 0) => ({ meters, tickets });

// ---------------------------------------------------------------- Belohnungen
const ONCE = {
  starter: R(150, 1),
  import: R(0, 1),
  trakt: R(80),
  'friend-1': R(40),
  'friend-5': R(0, 1),
  'birthday-set': R(40),
  'collect-1': R(20),
  'collect-10': R(40),
  'collect-25': R(0, 1),
  'collect-50': R(0, 3),
  'mythic-1': R(0, 4),
};
/** Je geschauter Stunde spult sich Film auf die Rolle. */
const METERS_PER_HOUR = 5;
const HOUR_STEPS = { 25: R(0, 1), 100: R(0, 1), 250: R(0, 2), 500: R(0, 3), 1000: R(0, 4) };
const STREAK_STEPS = { 3: R(20), 7: R(40), 14: R(80), 30: R(0, 1), 60: R(0, 4) };
const RECURRING = { visit: R(10), complete: R(40), wrapped: R(40), bday: R(0, 1), gift: R(30) };
/** Kinokasse: so viele Filmmeter kostet ein Goldticket. */
const TICKET_PRICE = 200;

// [Währung, min, max]
const PRICE = { common: ['meters', 20, 40], rare: ['meters', 40, 80], epic: ['tickets', 1, 2], legendary: ['tickets', 4, 4], mythic: ['tickets', 12, 12] };
const POSTER_PRICE = { common: ['meters', 10, 20], rare: ['meters', 40, 40], epic: ['tickets', 1, 1], legendary: ['tickets', 3, 3], mythic: ['tickets', 8, 8] };
const REFINE_COST = { rare: R(80), epic: R(0, 2), legendary: R(0, 4), mythic: R(0, 8) };
/** Stücke je Regal (etwa die Hälfte aus den eigenen Titeln, der Rest Neues zum Entdecken). */
const SHOP = { tv: 10, movie: 10, poster: 10 };

const hashInt = (s) => crypto.createHash('sha256').update(s).digest().readUInt32BE(0);
const localDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(d);

// ---------------------------------------------------------------- Konto
export async function balance(accountId, db = { query }) {
  const { rows } = await db.query(
    'SELECT COALESCE(sum(meters), 0)::int AS meters, COALESCE(sum(tickets), 0)::int AS tickets FROM note_ledger WHERE account_id = $1',
    [accountId],
  );
  return rows[0];
}

const book = (db, accountId, r, sign = 1) => db.query('INSERT INTO note_ledger (account_id, meters, tickets) VALUES ($1, $2, $3)', [accountId, sign * r.meters, sign * r.tickets]);

/** Einmalige Gutschrift (idempotent über key). Gibt true zurück, wenn neu. */
async function grant(accountId, key, r, db = { query }) {
  const res = await db.query(
    `INSERT INTO note_ledger (account_id, key, meters, tickets) VALUES ($1, $2, $3, $4)
     ON CONFLICT (account_id, key) WHERE key IS NOT NULL DO NOTHING`,
    [accountId, key, r.meters, r.tickets],
  );
  return res.rowCount > 0;
}

/** Filmrolle: Meter aus der gesamten Schauzeit – wächst nur, schrumpft nie (auch wenn Importe gelöscht werden). */
async function growReel(accountId, secs) {
  const want = Math.floor((secs / 3600) * METERS_PER_HOUR);
  const { rows } = await query(`SELECT meters FROM note_ledger WHERE account_id = $1 AND key = 'reel'`, [accountId]);
  const have = rows[0]?.meters ?? 0;
  if (want <= have) return 0;
  await query(
    `INSERT INTO note_ledger (account_id, key, meters) VALUES ($1, 'reel', $2)
     ON CONFLICT (account_id, key) WHERE key IS NOT NULL DO UPDATE SET meters = GREATEST(note_ledger.meters, EXCLUDED.meters)`,
    [accountId, want],
  );
  return want - have;
}

/** Prüft alle Belohnungen und schreibt neue gut. Gibt die frischen Gutschriften zurück. */
export async function checkRewards(account) {
  const id = account.id;
  const fresh = [];
  const give = async (key, r, label) => { if (await grant(id, key, r)) fresh.push({ key, label: label || key.split(':')[0], ...r }); };
  const today = localDate();
  await give('starter', ONCE.starter, 'starter');
  await give(`visit:${today}`, RECURRING.visit, 'visit');
  const [{ rows: c }, ov, { rows: fr }, { rows: tr }, { rows: coll }, prog] = await Promise.all([
    query(`SELECT (SELECT count(*) FROM imports WHERE account_id = $1) + (SELECT count(*) FROM views WHERE account_id = $1 AND source = 'trakt') AS n`, [id]),
    stats.overview(id, null),
    query(`SELECT count(*) AS n FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`, [id]),
    query('SELECT 1 FROM trakt_tokens WHERE account_id = $1', [id]),
    query(`SELECT count(*) AS n, count(*) FILTER (WHERE rarity = 'mythic') AS mythic FROM collection WHERE account_id = $1`, [id]),
    stats.progress(id),
  ]);
  const grown = await growReel(id, ov.secs);
  if (grown > 0) fresh.push({ key: 'reel', label: 'reel', ...R(grown) });
  if (c[0].n > 0) await give('import', ONCE.import, 'import');
  if (tr.length) await give('trakt', ONCE.trakt, 'trakt');
  if (fr[0].n >= 1) await give('friend-1', ONCE['friend-1'], 'friend');
  if (fr[0].n >= 5) await give('friend-5', ONCE['friend-5'], 'friend');
  if (account.birthday) {
    await give('birthday-set', ONCE['birthday-set'], 'birthday');
    if (account.birthday.slice(5) === today.slice(5)) await give(`bday:${today.slice(0, 4)}`, RECURRING.bday, 'bday');
  }
  for (const [n, r] of Object.entries(HOUR_STEPS)) if (ov.secs / 3600 >= Number(n)) await give(`hours-${n}`, r, 'hours');
  for (const [n, r] of Object.entries(STREAK_STEPS)) if (ov.streak.days >= Number(n)) await give(`streak-${n}`, r, 'streak');
  for (const [n, k] of [[1, 'collect-1'], [10, 'collect-10'], [25, 'collect-25'], [50, 'collect-50']]) if (coll[0].n >= n) await give(k, ONCE[k], 'collect');
  if (coll[0].mythic >= 1) await give('mythic-1', ONCE['mythic-1'], 'mythic');
  for (const s of prog.series) if (s.pct === 1) await give(`complete:${s.title_id}`, RECURRING.complete, 'complete');
  return fresh;
}

function earnList(ledgerKeys, ov) {
  const has = (k) => ledgerKeys.has(k);
  const nextHours = Object.keys(HOUR_STEPS).map(Number).find((n) => !has(`hours-${n}`));
  const nextStreak = Object.keys(STREAK_STEPS).map(Number).find((n) => !has(`streak-${n}`));
  const today = localDate();
  return [
    { id: 'reel', reward: R(METERS_PER_HOUR), repeat: true },
    { id: 'visit', reward: RECURRING.visit, done: has(`visit:${today}`), repeat: true },
    { id: 'import', reward: ONCE.import, done: has('import') },
    { id: 'trakt', reward: ONCE.trakt, done: has('trakt') },
    { id: 'friend', reward: ONCE['friend-1'], done: has('friend-1') },
    { id: 'birthday', reward: ONCE['birthday-set'], done: has('birthday-set') },
    nextHours ? { id: 'hours', n: nextHours, have: Math.floor(ov.secs / 3600), reward: HOUR_STEPS[nextHours], done: false } : null,
    nextStreak ? { id: 'streak', n: nextStreak, have: ov.streak.days, reward: STREAK_STEPS[nextStreak], done: false } : null,
    { id: 'complete', reward: RECURRING.complete, repeat: true },
    { id: 'quiz', reward: R(0, 1), repeat: true, done: has(`screening:${today}`) },
    { id: 'gift', reward: RECURRING.gift, repeat: true, done: has(`gift:${today}`) },
    { id: 'wrapped', reward: RECURRING.wrapped, repeat: true },
  ].filter(Boolean);
}

// ---------------------------------------------------------------- Pool & Angebot
/**
 * Alle eigenen Titel mit Poster (Grundlage für Videothek, Fernseher und Quiz) – aus jeder Quelle:
 * Datei-Importe genauso wie der Trakt-Abgleich. Samt TMDB-Kennzahlen für die Seltenheit.
 */
async function titlePool(accountId) {
  const { rows } = await query(
    `SELECT t.id, t.kind, t.name, t.year, t.poster_path, t.backdrop_path, t.popularity, t.vote_average, t.vote_count, t.revenue, count(*) AS views,
            max(v.watched_at) AS last_at, bool_or(v.source = 'trakt') AS via_trakt
       FROM views v
       JOIN title_aliases al ON al.account_id = v.account_id AND al.raw_key = v.raw_key
       JOIN titles t ON t.id = al.title_id
      WHERE v.account_id = $1 AND t.poster_path IS NOT NULL AND ${stats.FROM_SQL}
      GROUP BY t.id ORDER BY views DESC`,
    [accountId],
  );
  return rows;
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
/**
 * Seltenheit eines Titels – fest, nicht ausgewürfelt:
 * - Bekanntheit: Anzahl TMDB-Bewertungen (30 → 0, 30 000 → 1) und TMDB-Popularität
 * - Umsatz: weltweites Einspielergebnis (Filme; 10 Mio. $ → 0, 2 Mrd. $ → 1). Ohne bekanntes Einspielergebnis (Serien,
 *   viele kleine Filme) zählen Bekanntheit und Bewertung je zur Hälfte.
 * - Bewertung: TMDB-Durchschnitt (5,5 → 0, 8,8 → 1), erst ab 50 Stimmen voll gewertet
 * Je bekannter, erfolgreicher und besser bewertet, desto seltener (und wertvoller) die Ausgabe.
 */
export function rarityOf(t) {
  const votes = Number(t.vote_count) || 0;
  const pop = Number(t.popularity) || 0;
  const avg = Number(t.vote_average) || 0;
  const rev = Number(t.revenue) || 0;
  if (!votes && !pop) return { rarity: 'common', score: null, factors: null };
  const fame = clamp01((Math.log10(votes + 1) - 1.5) / 3) * 0.7 + clamp01(Math.log10(pop + 1) / 2.7) * 0.3;
  const trust = clamp01(votes / 50);
  const rating = clamp01((avg - 5.5) / 3.3) * trust + 0.3 * (1 - trust);
  const revenue = rev > 0 ? clamp01((Math.log10(rev) - 7) / 2.3) : 0;
  // Umsatz nur werten, wenn TMDB ihn kennt (Serien und viele kleine Filme haben keinen)
  const score = t.kind === 'movie' && rev > 0 ? 0.35 * fame + 0.3 * revenue + 0.35 * rating : 0.5 * fame + 0.5 * rating;
  const rarity = score >= 0.86 ? 'mythic' : score >= 0.74 ? 'legendary' : score >= 0.6 ? 'epic' : score >= 0.45 ? 'rare' : 'common';
  return {
    rarity,
    score: Math.round(score * 100),
    factors: { fame: Math.round(fame * 100), votes, rating: avg ? Math.round(avg * 10) / 10 : null, revenue: rev || null },
  };
}

function makeItem(title, format, seedExtra = '') {
  const { rarity, factors, score } = rarityOf(title);
  const table = format === 'poster' ? POSTER_PRICE : PRICE;
  const [cur, lo, hi] = table[rarity];
  const key = `${title.id}|${format}|${rarity}`;
  return {
    id: `${format}-${title.id}-${rarity}`,
    format,
    rarity,
    edition: EDITIONS[format][RARITIES.indexOf(rarity)],
    title_id: title.id,
    kind: title.kind,
    name: title.name,
    year: title.year,
    poster_path: title.poster_path,
    hue: hashInt(`${key}#hue${seedExtra}`) % 360,
    price: { cur, amount: lo + (hashInt(`${key}#price`) % (hi - lo + 1)) },
    score,
    factors,
    discover: Boolean(title.discover),
  };
}

/** Wie lange ein nicht gekauftes Stück höchstens aus dem Regal verschwindet, bevor es wiederkommen darf. */
const COOLDOWN_DAYS = 14;
const shelfOf = (format, kind) => (format === 'poster' ? 'poster' : kind === 'movie' ? 'movie' : 'tv');

/**
 * Tagesangebot aus den eigenen Titeln. Wird einmal pro Tag erzeugt und gespeichert:
 * - Gekauftes (gleicher Titel im gleichen Format) kommt nie wieder ins Regal.
 * - Was angeboten, aber nicht gekauft wurde, pausiert (bei großer Auswahl 14 Tage, bei kleiner kürzer, mind. 3)
 *   und kann danach irgendwann wiederkommen – dann zufällig, nicht der Reihe nach.
 */
export async function shopFor(accountId, day = localDate()) {
  const { rows: owned } = await query('SELECT item_id, title_id, format FROM collection WHERE account_id = $1', [accountId]);
  const ownIds = new Set(owned.map((o) => o.item_id));
  const ownKeys = new Set(owned.map((o) => `${o.title_id}|${o.format === 'poster' ? 'poster' : 'disc'}`));
  const mark = (items) => {
    for (const list of Object.values(items)) for (const it of list) it.owned = ownIds.has(it.id) || ownKeys.has(`${it.title_id}|${it.format === 'poster' ? 'poster' : 'disc'}`);
    return items;
  };
  const own = await titlePool(accountId);
  const ownIdsSet = new Set(own.map((x) => Number(x.id)));
  let extra = [];
  try { extra = (await tmdb.discoverPool()).filter((x) => !ownIdsSet.has(Number(x.id))); } catch (err) { console.warn('[videothek] Entdecken:', err.message); }
  const pool = [...own, ...extra];
  const byId = new Map(pool.map((x) => [Number(x.id), x]));
  // Gespeichert wird nur die Auswahl (Titel + Format); Seltenheit und Preis kommen immer aus den aktuellen TMDB-Daten
  const build = async (sel) => {
    // Titel, die inzwischen aus den Entdecken-Listen gefallen sind, direkt nachladen – das Tagesangebot bleibt stabil
    const missing = Object.values(sel).filter(Array.isArray).flat().map((x) => Number(x.title_id)).filter((id) => !byId.has(id));
    if (missing.length) {
      const { rows } = await query('SELECT id, kind, name, year, poster_path, backdrop_path, popularity, vote_average, vote_count, revenue, details_at FROM titles WHERE id = ANY($1)', [missing]);
      for (const r of rows) byId.set(Number(r.id), { ...r, views: 0, discover: true });
    }
    const items = { tv: [], movie: [], poster: [] };
    for (const [shelf, list] of Object.entries(sel)) for (const x of Array.isArray(list) ? list : []) {
      const tt = byId.get(Number(x.title_id));
      if (tt && items[shelf]) items[shelf].push(makeItem(tt, x.format));
    }
    return mark(items);
  };
  const { rows: today } = await query('SELECT items FROM shop_days WHERE account_id = $1 AND day = $2', [accountId, day]);
  // Gespeichertes Angebot gilt, solange seitdem keine neuen Titel dazugekommen sind (z. B. erster Import am selben Tag)
  if (today[0] && Number(today[0].items.pool ?? 0) >= own.length) return { day, items: await build(today[0].items), poolSize: pool.length };
  // Ohne eigene Titel (noch nichts importiert) gibt es kein Angebot – die Videothek baut auf deinem Verlauf auf
  if (!own.length) return { day, items: { tv: [], movie: [], poster: [] }, poolSize: 0 };

  // Zuletzt gezeigt: Titel je Regal → letzter Tag
  const { rows: past } = await query(
    `SELECT day::text AS day, items FROM shop_days WHERE account_id = $1 AND day < $2 AND day >= $2::date - 120 ORDER BY day DESC`,
    [accountId, day],
  );
  const lastShown = new Map();
  for (const p of past) for (const [shelf, list] of Object.entries(p.items)) for (const it of Array.isArray(list) ? list : []) {
    const k = `${shelf}|${it.title_id}`;
    if (!lastShown.has(k)) lastShown.set(k, p.day);
  }
  const minus = (n) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
  // Pause je Regal: genug Auswahl → 14 Tage, wenig Auswahl → kürzer (mind. 3 Tage), damit das Regal nicht leer bleibt
  const pickFrom = (list, n, shelf) => {
    if (!list.length || n <= 0) return [];
    const rest = Math.min(COOLDOWN_DAYS, Math.max(3, Math.ceil((2 * list.length) / n)));
    const cut = minus(rest);
    // eigene Titel: oft gesehen = öfter im Regal; Neues: beliebt = öfter im Regal
    // frisch Geschautes (z. B. gerade über Trakt gekommen) zählt doppelt
    const recent = (tt) => (tt.last_at && Date.now() - new Date(tt.last_at) < 30 * 864e5 ? 2 : 1);
    const weight = (tt) => (tt.discover ? 1 + Math.log10(1 + (Number(tt.popularity) || 0)) : Math.sqrt(1 + Number(tt.views)) * recent(tt));
    return list
      .map((tt) => ({ tt, last: lastShown.get(`${shelf}|${tt.id}`) || null, k: hashInt(`${accountId}|${day}|${shelf}|${tt.id}`) / 2 ** 32 / weight(tt) }))
      .filter((x) => !x.last || x.last <= cut)
      .sort((a, b) => a.k - b.k)
      // gleichmäßig verteilen: bei wenig Auswahl täglich weniger Stücke, dafür jeden Tag welche
      .slice(0, Math.min(n, Math.max(1, Math.floor(list.length / (rest + 1)))))
      .map(({ tt }) => tt);
  };
  /** Etwa die Hälfte aus den eigenen Titeln, der Rest zum Entdecken; fehlt eins, füllt das andere auf. */
  const pick = (list, n, shelf) => {
    const mine = pickFrom(list.filter((x) => !x.discover), Math.ceil(n / 2), shelf);
    const fresh = pickFrom(list.filter((x) => x.discover), n - mine.length, shelf);
    const more = mine.length + fresh.length < n ? pickFrom(list.filter((x) => !x.discover && !mine.includes(x)), n - mine.length - fresh.length, shelf) : [];
    return [...mine, ...more, ...fresh];
  };
  const notOwned = (fmtKey) => (tt) => !ownKeys.has(`${tt.id}|${fmtKey}`);
  const sel = {
    tv: pick(pool.filter((x) => x.kind === 'tv' && notOwned('disc')(x)), SHOP.tv, 'tv').map((tt) => ({ title_id: tt.id, format: hashInt(`${day}|fmt|${tt.id}`) % 3 === 0 ? 'bluray' : 'dvd' })),
    movie: pick(pool.filter((x) => x.kind === 'movie' && notOwned('disc')(x)), SHOP.movie, 'movie').map((tt) => ({ title_id: tt.id, format: hashInt(`${day}|fmt|${tt.id}`) % 2 === 0 ? 'bluray' : 'dvd' })),
    poster: pick(pool.filter(notOwned('poster')), SHOP.poster, 'poster').map((tt) => ({ title_id: tt.id, format: 'poster' })),
  };
  const needDetails = [...sel.movie, ...sel.poster].map((x) => byId.get(Number(x.title_id))).filter((tt) => tt?.discover && tt.kind === 'movie' && !tt.details_at);
  for (const tt of needDetails) {
    try {
      await tmdb.loadDetails(tt.id);
      const { rows: r } = await query('SELECT revenue, vote_count, vote_average, popularity FROM titles WHERE id = $1', [tt.id]);
      Object.assign(tt, r[0] || {}, { details_at: new Date() });
    } catch { /* ohne Umsatz geht es auch */ }
  }
  sel.pool = own.length;
  await query(
    `INSERT INTO shop_days (account_id, day, items) VALUES ($1, $2, $3)
     ON CONFLICT (account_id, day) DO UPDATE SET items = EXCLUDED.items WHERE (shop_days.items->>'pool')::int < $4`,
    [accountId, day, JSON.stringify(sel), own.length],
  );
  query(`DELETE FROM shop_days WHERE account_id = $1 AND day < $2::date - 150`, [accountId, day]).catch(() => {});
  const { rows: saved } = await query('SELECT items FROM shop_days WHERE account_id = $1 AND day = $2', [accountId, day]);
  return { day, items: await build(saved[0]?.items || sel), poolSize: pool.length };
}

async function findShopItem(accountId, itemId) {
  const { items } = await shopFor(accountId);
  return Object.values(items).flat().find((x) => x.id === itemId) || null;
}

const canPay = (bal, cost) => CURRENCIES.every((c) => Number(bal[c]) >= (cost[c] || 0));
const priceToR = (p) => ({ ...R(), [p.cur]: p.amount });

/** Sammlerstück kaufen. */
export async function buy(account, itemId) {
  const it = await findShopItem(account.id, String(itemId || ''));
  if (!it) throw new UserError('Dieses Stück gibt es heute nicht.', 404, 'shopGone');
  if (it.owned) throw new UserError('Das hast du schon.', 409, 'shopOwned');
  const free = Boolean(account.free_shop && account.is_admin);
  const cost = free ? R() : priceToR(it.price);
  await withTransaction(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock($1)', [account.id]);
    if (!canPay(await balance(account.id, db), cost)) throw new UserError('Nicht genug Filmmeter oder Tickets.', 402, 'shopTooPoor');
    await book(db, account.id, cost, -1);
    await db.query(
      `INSERT INTO collection (account_id, item_id, format, rarity, edition, title_id, name, year, poster_path, hue, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [account.id, it.id, it.format, it.rarity, it.edition, it.title_id, it.name, it.year, it.poster_path, it.hue, JSON.stringify(it.price)],
    );
  });
  const fresh = await checkRewards(account);
  return { ok: true, item: { ...it, owned: true }, balance: await balance(account.id), fresh };
}

/** Kinokasse: Filmmeter gegen Goldtickets tauschen. */
export async function exchange(account, count = 1) {
  const n = Math.max(1, Math.min(20, Number.parseInt(count, 10) || 1));
  await withTransaction(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock($1)', [account.id]);
    const bal = await balance(account.id, db);
    if (Number(bal.meters) < TICKET_PRICE * n) throw new UserError('Nicht genug Filmmeter.', 402, 'shopTooPoor');
    await book(db, account.id, R(-TICKET_PRICE * n, n));
  });
  return { ok: true, balance: await balance(account.id) };
}

/** Veredeln: ein eigenes Stück um eine Seltenheit aufwerten. */
export async function refine(account, itemId) {
  const { rows } = await query('SELECT * FROM collection WHERE account_id = $1 AND item_id = $2', [account.id, String(itemId || '')]);
  const it = rows[0];
  if (!it) throw new UserError('Nicht in deiner Sammlung.', 404, 'notFound');
  const next = RARITIES[RARITIES.indexOf(it.rarity) + 1];
  if (!next) throw new UserError('Schon mythisch.', 400, 'refineMax');
  const cost = account.free_shop && account.is_admin ? R() : REFINE_COST[next];
  await withTransaction(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock($1)', [account.id]);
    if (!canPay(await balance(account.id, db), cost)) throw new UserError('Nicht genug Filmmeter oder Tickets.', 402, 'shopTooPoor');
    await book(db, account.id, cost, -1);
    await db.query('UPDATE collection SET rarity = $3, edition = $4 WHERE account_id = $1 AND item_id = $2', [account.id, it.item_id, next, EDITIONS[it.format][RARITIES.indexOf(next)]]);
  });
  const fresh = await checkRewards(account);
  return { ok: true, rarity: next, edition: EDITIONS[it.format][RARITIES.indexOf(next)], balance: await balance(account.id), fresh };
}

export const refineCosts = () => REFINE_COST;

// ---------------------------------------------------------------- Versteckte Geschenke (eins pro Tag)
export async function openGift(account) {
  const day = localDate();
  const roll = hashInt(`${account.id}|gift|${day}`) % 100;
  const reward = roll < 50 ? R(30) : roll < 80 ? R(60) : roll < 95 ? R(0, 1) : R(0, 3);
  if (!(await grant(account.id, `gift:${day}`, reward))) throw new UserError('Das heutige Geschenk hast du schon geöffnet.', 409, 'giftTaken');
  return { ok: true, reward, balance: await balance(account.id) };
}

// ---------------------------------------------------------------- Vorführraum (Quiz)
const QUIZ_ROUNDS = 5;
const LEVEL_SIZE = ['w92', 'w300', 'w780'];
const POINTS = [3, 2, 1];

async function buildRounds(accountId, day) {
  const pool = (await titlePool(accountId)).filter((x) => x.backdrop_path);
  if (pool.length < 4) return null;
  const order = pool.map((p) => ({ p, k: hashInt(`${accountId}|${day}|q|${p.id}`) })).sort((a, b) => a.k - b.k).map((x) => x.p);
  const rounds = [];
  for (let r = 0; r < Math.min(QUIZ_ROUNDS, order.length); r++) {
    const right = order[r];
    const others = pool.filter((p) => p.id !== right.id).map((p) => ({ p, k: hashInt(`${day}|${r}|${p.id}`) })).sort((a, b) => a.k - b.k).slice(0, 3).map((x) => x.p);
    const options = [right, ...others].map((p) => ({ id: p.id, name: p.name, year: p.year })).sort((a, b) => hashInt(`${day}|o|${a.id}`) - hashInt(`${day}|o|${b.id}`));
    rounds.push({ title_id: right.id, backdrop: right.backdrop_path, options });
  }
  return rounds;
}

async function sessionRow(accountId, create = false) {
  const day = localDate();
  let { rows } = await query('SELECT * FROM screening_sessions WHERE account_id = $1 AND day = $2', [accountId, day]);
  if (!rows[0] && create) {
    const rounds = await buildRounds(accountId, day);
    if (!rounds) throw new UserError('Für das Quiz brauchst du mindestens 4 Titel mit Standbild.', 409, 'quizTooFew');
    ({ rows } = await query(
      `INSERT INTO screening_sessions (account_id, day, rounds, progress) VALUES ($1, $2, $3, $4)
       ON CONFLICT (account_id, day) DO UPDATE SET day = EXCLUDED.day RETURNING *`,
      [accountId, day, JSON.stringify(rounds), JSON.stringify(rounds.map(() => ({ level: 1, answer: null, correct: null, points: 0 })))],
    ));
  }
  return rows[0] || null;
}

/** Öffentlicher Zustand – verrät die richtige Antwort erst nach dem Antworten. */
function publicSession(s) {
  if (!s) return null;
  const done = s.progress.every((p) => p.answer !== null);
  return {
    day: s.day, score: s.score, done, rewarded: s.rewarded, max: s.rounds.length * POINTS[0],
    rounds: s.rounds.map((r, i) => {
      const p = s.progress[i];
      return { options: r.options, level: p.level, answer: p.answer, correct: p.correct, points: p.points, solution: p.answer !== null ? r.title_id : null };
    }),
  };
}

export async function sessionState(account) {
  return publicSession(await sessionRow(account.id));
}
export async function sessionStart(account) {
  return publicSession(await sessionRow(account.id, true));
}

/** Nächste Schärfestufe aufdecken (nur vorwärts). */
export async function sessionReveal(account, round) {
  const s = await sessionRow(account.id);
  const p = s?.progress?.[round];
  if (!p || p.answer !== null) throw new UserError('Ungültige Runde.', 400, 'quizRound');
  if (p.level < 3) p.level++;
  await query('UPDATE screening_sessions SET progress = $3 WHERE account_id = $1 AND day = $2', [account.id, s.day, JSON.stringify(s.progress)]);
  return publicSession(s);
}

export async function sessionAnswer(account, round, choice) {
  const s = await sessionRow(account.id);
  const p = s?.progress?.[round];
  if (!p || p.answer !== null) throw new UserError('Ungültige Runde.', 400, 'quizRound');
  p.answer = Number(choice);
  p.correct = p.answer === s.rounds[round].title_id;
  p.points = p.correct ? POINTS[p.level - 1] : 0;
  s.score = s.progress.reduce((a, x) => a + x.points, 0);
  const done = s.progress.every((x) => x.answer !== null);
  let reward = null;
  if (done && !s.rewarded) {
    const max = s.rounds.length * POINTS[0];
    reward = s.score >= max * 0.7 ? R(0, 1) : s.score >= max * 0.4 ? R(40) : R(20);
    await grant(account.id, `screening:${s.day}`, reward);
    s.rewarded = true;
  }
  await query('UPDATE screening_sessions SET progress = $3, score = $4, rewarded = $5 WHERE account_id = $1 AND day = $2', [account.id, s.day, JSON.stringify(s.progress), s.score, s.rewarded]);
  return { ...publicSession(s), reward, balance: reward ? await balance(account.id) : undefined };
}

/** Standbild der Runde in der freigeschalteten Auflösung (kleiner = unschärfer). */
export async function sessionImage(account, round, level) {
  const s = await sessionRow(account.id);
  const r = s?.rounds?.[round];
  const p = s?.progress?.[round];
  if (!r || !p) throw new UserError('Ungültige Runde.', 400, 'quizRound');
  // Nach dem Antworten darf das scharfe Bild gezeigt werden, vorher höchstens die aufgedeckte Stufe
  const allowed = p.answer !== null ? 3 : p.level;
  const l = Math.max(1, Math.min(allowed, Number(level) || 1));
  return { size: LEVEL_SIZE[l - 1], file: r.backdrop.slice(1) };
}

// ---------------------------------------------------------------- Übersicht & Ereignisse
export async function overviewFor(account) {
  const fresh = await checkRewards(account);
  const [bal, { rows: items }, { rows: ledger }, shop, ov, session] = await Promise.all([
    balance(account.id),
    query(`SELECT c.item_id AS id, c.format, c.rarity, c.edition, c.title_id, c.name, c.year, c.poster_path, c.hue, c.acquired_at,
                  t.kind, t.popularity, t.vote_average, t.vote_count, t.revenue
             FROM collection c LEFT JOIN titles t ON t.id = c.title_id WHERE c.account_id = $1 ORDER BY c.acquired_at DESC`, [account.id]),
    query('SELECT key FROM note_ledger WHERE account_id = $1 AND key IS NOT NULL', [account.id]),
    shopFor(account.id),
    stats.overview(account.id, null),
    sessionRow(account.id),
  ]);
  for (const it of items) {
    const r = rarityOf(it);
    it.factors = r.factors; it.score = r.score;
    for (const k of ['popularity', 'vote_average', 'vote_count', 'revenue']) delete it[k];
  }
  const keys = new Set(ledger.map((l) => l.key));
  return {
    balance: bal, fresh, items, shop, earn: earnList(keys, ov), refineCosts: REFINE_COST, ticketPrice: TICKET_PRICE,
    gift: !keys.has(`gift:${localDate()}`), freeShop: Boolean(account.free_shop && account.is_admin),
    session: publicSession(session), nextDay: nextLocalMidnight(),
    channels: (await titlePool(account.id)).slice(0, 40).map((x) => ({ id: x.id, kind: x.kind, name: x.name, year: x.year, poster_path: x.poster_path, backdrop_path: x.backdrop_path, views: Number(x.views) })),
  };
}

function nextLocalMidnight() {
  const now = new Date();
  const [y, m, d] = localDate(new Date(now.getTime() + 864e5)).split('-').map(Number);
  // Mitternacht in der konfigurierten Zeitzone als ISO (über Offset-Schätzung)
  const guess = new Date(Date.UTC(y, m - 1, d));
  const off = new Date(guess.toLocaleString('en-US', { timeZone: config.timezone })) - new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }));
  return new Date(guess.getTime() - off).toISOString();
}

export async function event(account, { type, year } = {}) {
  if (type === 'wrapped') {
    const years = await wrappedYears(account.id);
    if (!years.includes(Number(year))) throw new UserError('Ungültiges Jahr.', 400, 'invalidSetting');
    const fresh = (await grant(account.id, `wrapped:${Number(year)}`, RECURRING.wrapped)) ? [{ key: `wrapped:${year}`, label: 'wrapped', ...RECURRING.wrapped }] : [];
    return { fresh, balance: await balance(account.id) };
  }
  throw new UserError('Unbekanntes Ereignis.', 400, 'invalidSetting');
}

export async function setFreeShop(accountId, on) {
  const { rows } = await query('UPDATE accounts SET free_shop = $2 WHERE id = $1 AND is_admin RETURNING free_shop', [accountId, Boolean(on)]);
  if (!rows[0]) throw new UserError('Nur für Admins.', 403, 'forbidden');
  return rows[0].free_shop;
}

/** Sammlung eines Freundes (nur ansehen). */
export async function friendCollection(account, friendId) {
  if (!(await areFriends(account.id, friendId))) throw new UserError('Ihr seid nicht befreundet.', 403, 'notFriends');
  const [{ rows: acc }, { rows: items }] = await Promise.all([
    query('SELECT username FROM accounts WHERE id = $1', [friendId]),
    query('SELECT item_id AS id, format, rarity, edition, title_id, name, year, poster_path, hue, acquired_at FROM collection WHERE account_id = $1 ORDER BY acquired_at DESC', [friendId]),
  ]);
  return { username: acc[0]?.username, items };
}
