// Sammlung & Noten-Wirtschaft:
// - Noten (Bronze, Silber, Gold, Platin) verdienen – Buchungen in note_ledger, einmalige Belohnungen über eindeutigen Schlüssel.
// - Begehbare Retro-Videothek mit täglich neuem Angebot aus den eigenen Serien/Filmen (DVD, Blu-ray, Filmplakat).
// - Seltenheiten: gewöhnlich → selten (Steelbook) → episch (Collector’s Edition) → legendär (signiert) → mythisch (holografisch).
// - Vorführraum: tägliches Quiz (Standbild wird schärfer = weniger Punkte) und Veredeln von Sammlerstücken.
import crypto from 'node:crypto';
import { config } from './config.js';
import { query, withTransaction } from './db.js';
import { areFriends, wrappedYears } from './features.js';
import * as stats from './stats.js';
import { UserError } from './users.js';

export const TIERS = ['bronze', 'silver', 'gold', 'platinum'];
export const RARITIES = ['common', 'rare', 'epic', 'legendary', 'mythic'];
const EDITIONS = {
  dvd: ['standard', 'steelbook', 'collector', 'signed', 'holo'],
  bluray: ['standard', 'steelbook', 'collector', 'signed', 'holo'],
  poster: ['print', 'teaser', 'vintage', 'signed', 'holo'],
};
const R = (bronze = 0, silver = 0, gold = 0, platinum = 0) => ({ bronze, silver, gold, platinum });

// ---------------------------------------------------------------- Belohnungen
const ONCE = {
  starter: R(6, 2, 1),
  import: R(0, 0, 1),
  trakt: R(0, 2),
  'friend-1': R(0, 1),
  'friend-5': R(0, 0, 1),
  'birthday-set': R(0, 1),
  'collect-1': R(2),
  'collect-10': R(0, 1),
  'collect-25': R(0, 0, 1),
  'collect-50': R(0, 0, 0, 1),
  'mythic-1': R(0, 0, 0, 1),
};
const HOUR_STEPS = { 10: R(3), 25: R(0, 1), 50: R(0, 2), 100: R(0, 0, 1), 250: R(0, 0, 2), 500: R(0, 0, 0, 1), 1000: R(0, 0, 0, 2) };
const STREAK_STEPS = { 3: R(2), 7: R(0, 1), 14: R(0, 2), 30: R(0, 0, 1), 60: R(0, 0, 0, 1) };
const RECURRING = { visit: R(1), complete: R(0, 1), wrapped: R(0, 1), bday: R(0, 0, 1), gift: R(2) };
const EXCHANGE_RATE = 4;

const PRICE = { common: ['bronze', 2, 4], rare: ['silver', 1, 2], epic: ['gold', 1, 2], legendary: ['platinum', 1, 1], mythic: ['platinum', 3, 3] };
const POSTER_PRICE = { common: ['bronze', 1, 2], rare: ['silver', 1, 1], epic: ['gold', 1, 1], legendary: ['gold', 3, 3], mythic: ['platinum', 2, 2] };
const REFINE_COST = { rare: R(0, 2), epic: R(0, 0, 2), legendary: R(0, 0, 0, 1), mythic: R(0, 0, 0, 2) };
const ODDS = { common: 55, rare: 27, epic: 12, legendary: 5, mythic: 1 };
const SHOP = { tv: 8, movie: 8, poster: 8 };

const hashInt = (s) => crypto.createHash('sha256').update(s).digest().readUInt32BE(0);
const localDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(d);

// ---------------------------------------------------------------- Noten-Konto
export async function balance(accountId, db = { query }) {
  const { rows } = await db.query(
    `SELECT COALESCE(sum(bronze), 0) AS bronze, COALESCE(sum(silver), 0) AS silver, COALESCE(sum(gold), 0) AS gold, COALESCE(sum(platinum), 0) AS platinum
       FROM note_ledger WHERE account_id = $1`,
    [accountId],
  );
  return rows[0];
}

/** Einmalige Gutschrift (idempotent über key). Gibt true zurück, wenn neu. */
async function grant(accountId, key, r, db = { query }) {
  const res = await db.query(
    `INSERT INTO note_ledger (account_id, key, bronze, silver, gold, platinum) VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (account_id, key) WHERE key IS NOT NULL DO NOTHING`,
    [accountId, key, r.bronze, r.silver, r.gold, r.platinum],
  );
  return res.rowCount > 0;
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
    query('SELECT count(*) AS n FROM imports WHERE account_id = $1', [id]),
    stats.overview(id, null),
    query(`SELECT count(*) AS n FROM friendships WHERE status = 'accepted' AND (requester_id = $1 OR addressee_id = $1)`, [id]),
    query('SELECT 1 FROM trakt_tokens WHERE account_id = $1', [id]),
    query(`SELECT count(*) AS n, count(*) FILTER (WHERE rarity = 'mythic') AS mythic FROM collection WHERE account_id = $1`, [id]),
    stats.progress(id),
  ]);
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
    { id: 'visit', reward: RECURRING.visit, done: has(`visit:${today}`), repeat: true },
    { id: 'import', reward: ONCE.import, done: has('import') },
    { id: 'trakt', reward: ONCE.trakt, done: has('trakt') },
    { id: 'friend', reward: ONCE['friend-1'], done: has('friend-1') },
    { id: 'birthday', reward: ONCE['birthday-set'], done: has('birthday-set') },
    nextHours ? { id: 'hours', n: nextHours, have: Math.floor(ov.secs / 3600), reward: HOUR_STEPS[nextHours], done: false } : null,
    nextStreak ? { id: 'streak', n: nextStreak, have: ov.streak.days, reward: STREAK_STEPS[nextStreak], done: false } : null,
    { id: 'complete', reward: RECURRING.complete, repeat: true },
    { id: 'quiz', reward: R(0, 0, 1), repeat: true, done: has(`screening:${today}`) },
    { id: 'gift', reward: RECURRING.gift, repeat: true, done: has(`gift:${today}`) },
    { id: 'wrapped', reward: RECURRING.wrapped, repeat: true },
  ].filter(Boolean);
}

// ---------------------------------------------------------------- Pool & Angebot
/** Alle eigenen Titel mit Poster (Grundlage für Videothek und Quiz). */
async function titlePool(accountId) {
  const { rows } = await query(
    `SELECT t.id, t.kind, t.name, t.year, t.poster_path, t.backdrop_path, count(*) AS views
       FROM views v
       JOIN title_aliases al ON al.account_id = v.account_id AND al.raw_key = v.raw_key
       JOIN titles t ON t.id = al.title_id
      WHERE v.account_id = $1 AND t.poster_path IS NOT NULL
      GROUP BY t.id ORDER BY views DESC`,
    [accountId],
  );
  return rows;
}

function rollRarity(seed) {
  const x = hashInt(seed) % 100;
  let acc = 0;
  for (const r of RARITIES) { acc += ODDS[r]; if (x < acc) return r; }
  return 'common';
}

function makeItem(title, format, rarity, seedExtra = '') {
  const table = format === 'poster' ? POSTER_PRICE : PRICE;
  const [tier, lo, hi] = table[rarity];
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
    price: { tier, amount: lo + (hashInt(`${key}#price`) % (hi - lo + 1)) },
  };
}

/** Tagesangebot: aus den eigenen Titeln, deterministisch pro Tag und Konto. */
export async function shopFor(accountId, day = localDate()) {
  const pool = await titlePool(accountId);
  const { rows: owned } = await query('SELECT item_id FROM collection WHERE account_id = $1', [accountId]);
  const own = new Set(owned.map((o) => o.item_id));
  const pick = (list, n, salt) => list
    .map((tt) => ({ tt, k: hashInt(`${accountId}|${day}|${salt}|${tt.id}`) / 2 ** 32 / Math.sqrt(1 + Number(tt.views)) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, n)
    .map(({ tt }) => tt);
  const out = { tv: [], movie: [], poster: [] };
  for (const tt of pick(pool.filter((x) => x.kind === 'tv'), SHOP.tv, 'tv')) {
    const format = hashInt(`${day}|fmt|${tt.id}`) % 3 === 0 ? 'bluray' : 'dvd';
    out.tv.push(makeItem(tt, format, rollRarity(`${accountId}|${day}|${tt.id}|tv`)));
  }
  for (const tt of pick(pool.filter((x) => x.kind === 'movie'), SHOP.movie, 'movie')) {
    const format = hashInt(`${day}|fmt|${tt.id}`) % 2 === 0 ? 'bluray' : 'dvd';
    out.movie.push(makeItem(tt, format, rollRarity(`${accountId}|${day}|${tt.id}|movie`)));
  }
  for (const tt of pick(pool, SHOP.poster, 'poster')) out.poster.push(makeItem(tt, 'poster', rollRarity(`${accountId}|${day}|${tt.id}|poster`)));
  for (const list of Object.values(out)) for (const it of list) it.owned = own.has(it.id);
  return { day, items: out, poolSize: pool.length };
}

async function findShopItem(accountId, itemId) {
  const { items } = await shopFor(accountId);
  return Object.values(items).flat().find((x) => x.id === itemId) || null;
}

const canPay = (bal, cost) => TIERS.every((t) => Number(bal[t]) >= (cost[t] || 0));
const priceToR = (p) => ({ ...R(), [p.tier]: p.amount });

/** Sammlerstück kaufen. */
export async function buy(account, itemId) {
  const it = await findShopItem(account.id, String(itemId || ''));
  if (!it) throw new UserError('Dieses Stück gibt es heute nicht.', 404, 'shopGone');
  if (it.owned) throw new UserError('Das hast du schon.', 409, 'shopOwned');
  const free = Boolean(account.free_shop && account.is_admin);
  const cost = free ? R() : priceToR(it.price);
  await withTransaction(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock($1)', [account.id]);
    if (!canPay(await balance(account.id, db), cost)) throw new UserError('Nicht genug Noten.', 402, 'shopTooPoor');
    await db.query('INSERT INTO note_ledger (account_id, bronze, silver, gold, platinum) VALUES ($1, $2, $3, $4, $5)', [account.id, -cost.bronze, -cost.silver, -cost.gold, -cost.platinum]);
    await db.query(
      `INSERT INTO collection (account_id, item_id, format, rarity, edition, title_id, name, year, poster_path, hue, price) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [account.id, it.id, it.format, it.rarity, it.edition, it.title_id, it.name, it.year, it.poster_path, it.hue, JSON.stringify(it.price)],
    );
  });
  const fresh = await checkRewards(account);
  return { ok: true, item: { ...it, owned: true }, balance: await balance(account.id), fresh };
}

/** 4 Noten einer Stufe → 1 Note der nächsten Stufe. */
export async function exchange(account, from) {
  const i = TIERS.indexOf(from);
  if (i < 0 || i >= TIERS.length - 1) throw new UserError('Ungültiger Tausch.', 400, 'invalidSetting');
  await withTransaction(async (db) => {
    await db.query('SELECT pg_advisory_xact_lock($1)', [account.id]);
    const bal = await balance(account.id, db);
    if (Number(bal[from]) < EXCHANGE_RATE) throw new UserError('Nicht genug Noten.', 402, 'shopTooPoor');
    const row = { ...R(), [from]: -EXCHANGE_RATE, [TIERS[i + 1]]: 1 };
    await db.query('INSERT INTO note_ledger (account_id, bronze, silver, gold, platinum) VALUES ($1, $2, $3, $4, $5)', [account.id, row.bronze, row.silver, row.gold, row.platinum]);
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
    if (!canPay(await balance(account.id, db), cost)) throw new UserError('Nicht genug Noten.', 402, 'shopTooPoor');
    await db.query('INSERT INTO note_ledger (account_id, bronze, silver, gold, platinum) VALUES ($1, $2, $3, $4, $5)', [account.id, -cost.bronze, -cost.silver, -cost.gold, -cost.platinum]);
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
  const reward = roll < 50 ? R(3) : roll < 80 ? R(0, 1) : roll < 95 ? R(0, 0, 1) : R(0, 0, 0, 1);
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
    reward = s.score >= max * 0.7 ? R(0, 0, 1) : s.score >= max * 0.4 ? R(0, 1) : R(2);
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
    query('SELECT item_id AS id, format, rarity, edition, title_id, name, year, poster_path, hue, acquired_at FROM collection WHERE account_id = $1 ORDER BY acquired_at DESC', [account.id]),
    query('SELECT key FROM note_ledger WHERE account_id = $1 AND key IS NOT NULL', [account.id]),
    shopFor(account.id),
    stats.overview(account.id, null),
    sessionRow(account.id),
  ]);
  const keys = new Set(ledger.map((l) => l.key));
  return {
    balance: bal, fresh, items, shop, earn: earnList(keys, ov), refineCosts: REFINE_COST, exchangeRate: EXCHANGE_RATE,
    gift: !keys.has(`gift:${localDate()}`), freeShop: Boolean(account.free_shop && account.is_admin),
    session: publicSession(session), nextDay: nextLocalMidnight(),
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
  await query('UPDATE accounts SET free_shop = $2 WHERE id = $1 AND is_admin', [accountId, Boolean(on)]);
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
