// Import-Ablauf: Datei hochladen → Vorschau (Tabelle finden, Spalten erkennen, Profile zählen)
// → optional Spalten-Zuordnung ändern → Import (idempotent über dedupe_key).
import crypto from 'node:crypto';
import { query, withTransaction } from './db.js';
import { markSuperseded } from './dedupe.js';
import { detectColumns, ROLES, tableScore, toEntries } from './parse/detect.js';
import { extractTables } from './parse/tables.js';
import { normName } from './parse/titles.js';
import { UserError } from './users.js';

export const SOURCES = ['netflix', 'prime', 'max', 'disney', 'apple', 'other'];

// Dienst-spezifische Vorgaben: bekannte Spaltennamen + Dateinamen im ZIP
const PRESETS = {
  netflix: {
    file: /viewingactivity|viewinghistory|netflixviewinghistory/i,
    columns: {
      profile: ['Profile Name'], start: ['Start Time'], duration: ['Duration'], title: ['Title'],
      type: ['Supplemental Video Type'], device: ['Device Type'], country: ['Country'], date: ['Date'],
    },
  },
  prime: { file: /primevideo.*(view|watch|histor)|(view|watch).*histor/i, columns: {} },
  max: { file: /(view|watch|play).*(histor|activit)|histor/i, columns: {} },
  disney: { file: /(view|watch).*(histor|activit)/i, columns: {} },
  apple: { file: /(play|view|watch).*(histor|activit)|tv app/i, columns: {} },
  other: { file: null, columns: {} },
};

// ---------------------------------------------------------------- Zwischenspeicher der Vorschau
const pending = new Map(); // token → { accountId, source, filename, tables, tableIndex, mapping, at }
const TTL = 30 * 60_000;
function sweep() {
  const now = Date.now();
  for (const [k, v] of pending) if (now - v.at > TTL) pending.delete(k);
}

function summary(p) {
  const table = p.tables[p.tableIndex];
  const { entries, skipped } = toEntries(table, p.mapping);
  const profiles = new Map();
  let first = null;
  let last = null;
  const series = new Set();
  let episodes = 0;
  let movies = 0;
  let withDuration = 0;
  let withTime = 0;
  for (const e of entries) {
    const pr = e.profile || '';
    profiles.set(pr, (profiles.get(pr) || 0) + 1);
    if (!first || e.watched_at < first) first = e.watched_at;
    if (!last || e.watched_at > last) last = e.watched_at;
    if (e.kind_hint === 'tv') { episodes++; series.add(e.raw_key); } else movies++;
    if (e.duration_sec !== null) withDuration++;
    if (e.time_known) withTime++;
  }
  const columns = table.headers.map((h, i) => ({
    index: i,
    name: h,
    samples: [...new Set(table.rows.slice(0, 60).map((r) => String(r[i] ?? '').trim()).filter(Boolean))].slice(0, 3),
  }));
  return {
    token: p.token,
    source: p.source,
    filename: p.filename,
    tables: p.tables.map((t, i) => ({ index: i, name: t.name, rows: t.rows.length })),
    tableIndex: p.tableIndex,
    columns,
    mapping: p.mapping,
    needsMapping: p.needsMapping,
    roles: ROLES,
    rows: table.rows.length,
    entries: entries.length,
    skipped,
    first,
    last,
    episodes,
    movies,
    series: series.size,
    withDuration,
    withTime,
    profiles: [...profiles].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    sample: entries.slice(0, 8).map((e) => ({ title: e.raw_title, series: e.series, kind: e.kind_hint, season: e.season, episode: e.episode, watched_at: e.watched_at, duration_sec: e.duration_sec, profile: e.profile })),
  };
}

/** Schritt 1: Datei lesen und Vorschau erzeugen. */
export function preview(accountId, source, filename, buf) {
  if (!SOURCES.includes(source)) throw new UserError('Unbekannter Dienst.', 400, 'importSource');
  if (!buf?.length) throw new UserError('Leere Datei.', 400, 'importEmpty');
  let tables;
  try {
    tables = extractTables(buf, filename || 'datei');
  } catch (err) {
    throw new UserError(err.message, 400, err.key || 'importUnreadable');
  }
  tables = tables.filter((t) => t.rows.length && t.headers.length >= 2);
  if (!tables.length) throw new UserError('In der Datei wurde keine Tabelle gefunden.', 400, 'importNoTable');
  const preset = PRESETS[source];
  const scored = tables.map((t, i) => ({ i, s: tableScore(t, preset.columns, preset.file) })).sort((a, b) => b.s - a.s);
  // Höchstens 40 Tabellen zur Auswahl anbieten (beste zuerst)
  const keep = scored.slice(0, 40).map((x) => tables[x.i]);
  sweep();
  const token = crypto.randomBytes(12).toString('hex');
  const p = { token, accountId, source, filename: String(filename || '').slice(0, 200), tables: keep, tableIndex: 0, at: Date.now() };
  const det = detectColumns(keep[0].headers, keep[0].rows.slice(0, 1000), preset.columns);
  p.mapping = det.mapping;
  p.needsMapping = det.needsMapping;
  pending.set(token, p);
  return summary(p);
}

function getPending(accountId, token) {
  const p = pending.get(String(token || ''));
  if (!p || p.accountId !== accountId) throw new UserError('Die Vorschau ist abgelaufen – bitte die Datei erneut auswählen.', 410, 'importExpired');
  p.at = Date.now();
  return p;
}

/** Schritt 2 (optional): andere Tabelle oder eigene Spalten-Zuordnung. */
export function remap(accountId, token, { tableIndex, mapping } = {}) {
  const p = getPending(accountId, token);
  if (tableIndex !== undefined && tableIndex !== p.tableIndex) {
    const i = Number(tableIndex);
    if (!Number.isInteger(i) || !p.tables[i]) throw new UserError('Ungültige Tabelle.', 400, 'importMapping');
    p.tableIndex = i;
    const det = detectColumns(p.tables[i].headers, p.tables[i].rows.slice(0, 1000), PRESETS[p.source].columns);
    p.mapping = det.mapping;
    p.needsMapping = det.needsMapping;
  }
  if (mapping && typeof mapping === 'object') {
    const cols = p.tables[p.tableIndex].headers.length;
    const next = {};
    for (const role of ROLES) {
      const v = mapping[role];
      if (v === null || v === undefined || v === '') continue;
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n >= cols) throw new UserError('Ungültige Spalten-Zuordnung.', 400, 'importMapping');
      next[role] = n;
    }
    if (next.title === undefined && next.series === undefined) throw new UserError('Bitte eine Titel-Spalte wählen.', 400, 'importNeedTitle');
    if (next.start === undefined && next.date === undefined) throw new UserError('Bitte eine Zeit- oder Datumsspalte wählen.', 400, 'importNeedTime');
    p.mapping = next;
    p.needsMapping = false;
  }
  return summary(p);
}

const sha = (s) => crypto.createHash('sha1').update(s).digest('base64url');

/** Schritt 3: Import. `profiles` = gewählte Profile (leer = alle). */
export async function commit(accountId, token, { profiles } = {}) {
  const p = getPending(accountId, token);
  const table = p.tables[p.tableIndex];
  const { entries } = toEntries(table, p.mapping);
  const want = Array.isArray(profiles) && profiles.length ? new Set(profiles.map(String)) : null;
  const chosen = want ? entries.filter((e) => want.has(e.profile || '')) : entries;
  if (!chosen.length) throw new UserError('Keine Einträge zum Importieren.', 400, 'importNothing');

  // Eindeutiger Schlüssel: gleiche Datei erneut hochladen → keine Duplikate.
  // Ohne Uhrzeit (Netflix-Kurzexport): Tag + laufende Nummer gleicher Titel am selben Tag.
  const perDay = new Map();
  for (const e of chosen) {
    const base = `${p.source}|${normName(e.profile || '')}|${normName(e.raw_title)}`;
    if (e.time_known) {
      e.dedupe_key = sha(`${base}|${e.watched_at.toISOString().slice(0, 16)}`);
    } else {
      const day = e.watched_at.toISOString().slice(0, 10);
      const k = `${base}|${day}`;
      const n = (perDay.get(k) || 0) + 1;
      perDay.set(k, n);
      e.dedupe_key = sha(`${k}|#${n}`);
    }
  }

  const result = await withTransaction(async (db) => {
    const first = chosen.reduce((a, e) => (!a || e.watched_at < a ? e.watched_at : a), null);
    const last = chosen.reduce((a, e) => (!a || e.watched_at > a ? e.watched_at : a), null);
    const { rows: imp } = await db.query(
      `INSERT INTO imports (account_id, source, filename, profile, rows_total, first_at, last_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [accountId, p.source, p.filename, want ? [...want].join(', ') : null, chosen.length, first, last],
    );
    const importId = imp[0].id;
    let added = 0;
    for (let i = 0; i < chosen.length; i += 1000) {
      const batch = chosen.slice(i, i + 1000).map((e) => ({
        source: p.source, profile: e.profile, raw_title: e.raw_title.slice(0, 500), raw_key: e.raw_key.slice(0, 300), kind_hint: e.kind_hint,
        season: e.season, episode: e.episode, episode_name: e.episode_name?.slice(0, 300) ?? null,
        watched_at: e.watched_at.toISOString(), time_known: e.time_known, duration_sec: e.duration_sec,
        device: e.device?.slice(0, 120) ?? null, country: e.country?.slice(0, 80) ?? null, dedupe_key: e.dedupe_key,
      }));
      const r = await db.query(
        `INSERT INTO views (account_id, import_id, source, profile, raw_title, raw_key, kind_hint, season, episode, episode_name,
                            watched_at, time_known, duration_sec, device, country, dedupe_key)
         SELECT $1, $2, x.source, x.profile, x.raw_title, x.raw_key, x.kind_hint, x.season, x.episode, x.episode_name,
                x.watched_at, x.time_known, x.duration_sec, x.device, x.country, x.dedupe_key
           FROM json_populate_recordset(NULL::views, $3::json) x
         ON CONFLICT (account_id, dedupe_key) DO NOTHING`,
        [accountId, importId, JSON.stringify(batch)],
      );
      added += r.rowCount;
    }
    // Neue Roh-Titel für den TMDB-Abgleich vormerken
    const names = new Map();
    for (const e of chosen) if (!names.has(e.raw_key)) names.set(e.raw_key, { raw_key: e.raw_key.slice(0, 300), raw_name: e.series.slice(0, 300), kind_hint: e.kind_hint });
    await db.query(
      `INSERT INTO title_aliases (account_id, raw_key, raw_name, kind_hint)
       SELECT $1, x.raw_key, x.raw_name, x.kind_hint FROM json_populate_recordset(NULL::title_aliases, $2::json) x
       ON CONFLICT (account_id, raw_key) DO NOTHING`,
      [accountId, JSON.stringify([...names.values()])],
    );
    await db.query('UPDATE imports SET rows_added = $2, rows_skipped = rows_total - $2 WHERE id = $1', [importId, added]);
    pending.delete(p.token);
    return { importId, added, duplicates: chosen.length - added, total: chosen.length, titles: names.size, first, last };
  });
  await markSuperseded(accountId, { analyze: result.added > 200 });
  return result;
}

export async function listImports(accountId) {
  const { rows } = await query(
    `SELECT id, source, filename, profile, rows_total, rows_added, rows_skipped, first_at, last_at, created_at
       FROM imports WHERE account_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [accountId],
  );
  return rows;
}

/** Import rückgängig machen: löscht alle Einträge, die genau dieser Import hinzugefügt hat. */
export async function deleteImport(accountId, importId) {
  const r = await withTransaction(async (db) => {
    const { rowCount } = await db.query('DELETE FROM views WHERE account_id = $1 AND import_id = $2', [accountId, importId]);
    await db.query('DELETE FROM imports WHERE account_id = $1 AND id = $2', [accountId, importId]);
    return { removed: rowCount };
  });
  await markSuperseded(accountId, { analyze: r.removed > 200 });
  return r;
}

/** Alle Einträge einer Quelle löschen (z. B. „Netflix-Daten entfernen“). */
export async function deleteSource(accountId, source) {
  if (![...SOURCES, 'trakt'].includes(source)) throw new UserError('Unbekannter Dienst.', 400, 'importSource');
  const { rowCount } = await query('DELETE FROM views WHERE account_id = $1 AND source = $2', [accountId, source]);
  await query('DELETE FROM imports WHERE account_id = $1 AND source = $2', [accountId, source]);
  await markSuperseded(accountId, { analyze: rowCount > 200 });
  return { removed: rowCount };
}
