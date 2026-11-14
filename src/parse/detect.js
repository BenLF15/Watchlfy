// Spalten-Erkennung für Verlaufsdateien beliebiger Dienste + Umwandlung in einheitliche Einträge.
// Spaltennamen sind nie fest verdrahtet: Synonyme (mehrsprachig) + Inhaltsprüfung (Datum? Dauer? Zahl?).
import { normName, rawKey, splitTitle } from './titles.js';

export const ROLES = ['title', 'series', 'season', 'episode', 'episodeTitle', 'start', 'date', 'duration', 'device', 'profile', 'country', 'type', 'kind'];

const SYN = {
  title: ['title', 'titel', 'titre', 'titulo', 'titolo', 'name', 'content title', 'video title', 'program title', 'asset title', 'content name', 'show title', 'item title', 'catalog title', 'title name', 'movie title'],
  series: ['series', 'series title', 'show', 'show name', 'serie', 'serien', 'serientitel', 'series name', 'season title', 'parent title', 'franchise', 'title series', 'gti series'],
  season: ['season', 'staffel', 'saison', 'temporada', 'stagione', 'season number', 'season nr', 'säsong', 'sæson'],
  episode: ['episode', 'episode number', 'folge', 'folgennummer', 'episodio', 'épisode', 'episode nr', 'ep', 'avsnitt', 'afsnit'],
  episodeTitle: ['episode title', 'episode name', 'folgentitel', 'episodentitel', 'titre de l episode', 'episodio titolo'],
  start: ['start time', 'start', 'started', 'started at', 'start date time', 'playback start', 'playback start time', 'start datetime', 'watched at', 'watched', 'viewed at', 'view time', 'timestamp', 'event time', 'time', 'datetime', 'date time', 'startzeit', 'zeitpunkt', 'utc', 'start utc', 'session start', 'last watched', 'date watched', 'viewing date'],
  date: ['date', 'datum', 'fecha', 'data', 'day', 'tag', 'watch date', 'view date'],
  duration: ['duration', 'dauer', 'durée', 'duracion', 'durata', 'watch time', 'watched duration', 'viewing duration', 'playback duration', 'time watched', 'seconds viewed', 'minutes viewed', 'duration seconds', 'duration ms', 'ms played', 'play duration', 'length'],
  device: ['device', 'device type', 'gerät', 'geraet', 'appareil', 'dispositivo', 'platform', 'device name', 'device model', 'client', 'enhet', 'enhed'],
  profile: ['profile', 'profile name', 'profil', 'perfil', 'profilo', 'user profile', 'viewer', 'persona', 'profilnamn'],
  country: ['country', 'land', 'pays', 'pais', 'paese', 'region', 'country code', 'marketplace', 'territory'],
  type: ['supplemental video type', 'video type', 'content type supplemental', 'asset type', 'clip type'],
  kind: ['content type', 'type', 'media type', 'title type', 'program type', 'kind', 'category', 'typ'],
};

const norm = (h) => normName(String(h).replace(/([a-z])([A-Z])/g, '$1 $2')).replace(/\s+/g, ' ');

// ---------------------------------------------------------------- Werte erkennen
const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*(Z|UTC|[+-]\d{2}:?\d{2})?)?$/i;
const DMY = /^(\d{1,2})([./-])(\d{1,2})\2(\d{2}|\d{4})(?:[,\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i;

/** Datumsformat einer ganzen Spalte bestimmen (T.M.J vs. M/T/J), damit 03/04/25 eindeutig wird. */
export function dateOrder(values) {
  let dmy = 0;
  let mdy = 0;
  for (const v of values.slice(0, 3000)) {
    const m = DMY.exec(String(v).trim());
    if (!m) continue;
    if (Number(m[1]) > 12) dmy++;
    if (Number(m[3]) > 12) mdy++;
    if (m[2] === '.') dmy++;
  }
  return mdy > dmy ? 'mdy' : 'dmy';
}

/** Zeitpunkt parsen → { date: Date, timeKnown } oder null. Zeiten ohne Zone gelten als UTC. */
export function parseWhen(value, order = 'dmy') {
  const s = String(value ?? '').trim();
  if (!s) return null;
  if (/^\d{10,13}$/.test(s)) {
    const n = Number(s);
    const d = new Date(s.length === 13 ? n : n * 1000);
    return Number.isNaN(d.getTime()) ? null : { date: d, timeKnown: true };
  }
  let m = ISO.exec(s);
  if (m) {
    const [, y, mo, d, h, mi, se, z] = m;
    if (h === undefined) return { date: new Date(Date.UTC(+y, +mo - 1, +d, 12)), timeKnown: false };
    let ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +(se || 0));
    if (z && !/^(z|utc)$/i.test(z)) {
      const sign = z[0] === '-' ? -1 : 1;
      const [zh, zm] = [z.slice(1, 3), z.replace(':', '').slice(3, 5)];
      ms -= sign * ((+zh * 60 + +zm) * 60000);
    }
    return { date: new Date(ms), timeKnown: true };
  }
  m = DMY.exec(s);
  if (m) {
    let [, a, , b, y, h, mi, se, ap] = m;
    let day = +a;
    let mon = +b;
    if (order === 'mdy') [day, mon] = [mon, day];
    let year = +y;
    if (y.length === 2) year += year > 69 ? 1900 : 2000;
    if (mon < 1 || mon > 12 || day < 1 || day > 31) return null;
    if (h === undefined) return { date: new Date(Date.UTC(year, mon - 1, day, 12)), timeKnown: false };
    let hour = +h;
    if (ap) hour = (hour % 12) + (/pm/i.test(ap) ? 12 : 0);
    return { date: new Date(Date.UTC(year, mon - 1, day, hour, +mi, +(se || 0))), timeKnown: true };
  }
  if (/^[\d.,\s]+$/.test(s)) return null; // reine Zahlen sind keine Daten
  const d = new Date(s);
  if (!Number.isNaN(d.getTime()) && /\d{4}/.test(s)) return { date: d, timeKnown: /\d:\d/.test(s) };
  return null;
}

/** Dauer parsen → Sekunden oder null. „0:45:12“, „45:12“, „PT45M“, „2712“ (s), „45 min“, Millisekunden-Spalten. */
export function parseDuration(value, header = '') {
  const s = String(value ?? '').trim();
  if (!s) return null;
  let m = /^(\d{1,3}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(s);
  if (m) return +m[1] * 3600 + +m[2] * 60 + +m[3];
  m = /^(\d{1,3}):(\d{2})$/.exec(s);
  if (m) return +m[1] * 60 + +m[2];
  m = /^P(?:T)?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?$/i.exec(s);
  if (m && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + Math.round(+m[3] || 0);
  m = /^(\d+(?:[.,]\d+)?)\s*(ms|s|sec|sek|seconds|sekunden|m|min|minutes|minuten|h|std|hours|stunden)?$/i.exec(s);
  if (m) {
    const n = Number(m[1].replace(',', '.'));
    const unit = (m[2] || '').toLowerCase();
    const h = norm(header);
    if (unit === 'ms' || /\bms\b|millis/.test(h)) return Math.round(n / 1000);
    if (/^(m|min|minutes|minuten)$/.test(unit) || /minute/.test(h)) return Math.round(n * 60);
    if (/^(h|std|hours|stunden)$/.test(unit) || /hour|stunde/.test(h)) return Math.round(n * 3600);
    return Math.round(n);
  }
  return null;
}

// ---------------------------------------------------------------- Spalten-Rollen
function headerScore(role, h) {
  const n = norm(h);
  const list = SYN[role];
  if (list.includes(n)) return 1;
  if (list.some((s) => n.endsWith(` ${s}`) || n.startsWith(`${s} `))) return 0.7;
  if (list.some((s) => s.length > 3 && n.includes(s))) return 0.45;
  return 0;
}

function contentScore(role, values, header) {
  const vals = values.filter((v) => String(v).trim() !== '').slice(0, 300);
  if (!vals.length) return 0;
  const share = (fn) => vals.filter(fn).length / vals.length;
  switch (role) {
    case 'start': return share((v) => parseWhen(v)?.timeKnown);
    case 'date': return share((v) => parseWhen(v));
    case 'duration': return share((v) => parseDuration(v, header) !== null && !parseWhen(v));
    case 'season': case 'episode': return share((v) => /^\d{1,3}$/.test(String(v).trim()));
    case 'title': case 'series': case 'episodeTitle': {
      const textual = share((v) => /\p{L}{2}/u.test(v) && !parseWhen(v));
      const distinct = new Set(vals).size / vals.length;
      return textual * (role === 'title' ? 0.6 + 0.4 * distinct : 1);
    }
    default: return share((v) => /\p{L}/u.test(v));
  }
}

/**
 * Erkennt die Rollen der Spalten. Gibt { mapping: { role: index }, confidence, needsMapping } zurück.
 * `preset` (Dienst-spezifische Spaltennamen) hat Vorrang.
 */
export function detectColumns(headers, rows, preset = {}) {
  const cols = headers.map((h, i) => ({ h, i, values: rows.map((r) => r[i] ?? '') }));
  const mapping = {};
  const used = new Set();
  // 1) Preset per exaktem Namen
  for (const [role, names] of Object.entries(preset)) {
    const c = cols.find((col) => names.some((n) => norm(n) === norm(col.h)));
    if (c) { mapping[role] = c.i; used.add(c.i); }
  }
  // 2) Exakte Spaltennamen zuerst (z. B. „Series Title“ = Serie, nicht Titel)
  for (const role of ROLES) {
    if (mapping[role] !== undefined) continue;
    const c = cols.find((col) => !used.has(col.i) && headerScore(role, col.h) === 1 && contentScore(role, col.values, col.h) >= 0.5);
    if (c) { mapping[role] = c.i; used.add(c.i); }
  }
  // 3) Rest per Name + Inhalt, wichtigste Rollen zuerst
  const order = ['title', 'start', 'duration', 'date', 'series', 'season', 'episode', 'episodeTitle', 'profile', 'device', 'country', 'type', 'kind'];
  const scores = {};
  for (const role of order) {
    if (mapping[role] !== undefined) continue;
    let best = null;
    for (const c of cols) {
      if (used.has(c.i)) continue;
      const hs = headerScore(role, c.h);
      if (!hs && !['title', 'start', 'date', 'duration'].includes(role)) continue;
      const cs = contentScore(role, c.values, c.h);
      const score = hs ? hs * 0.6 + cs * 0.4 : cs * 0.35;
      if (cs < 0.5) continue;
      if (!best || score > best.score) best = { i: c.i, score };
    }
    if (best && best.score >= (['title', 'start', 'date'].includes(role) ? 0.3 : 0.4)) {
      mapping[role] = best.i;
      used.add(best.i);
      scores[role] = best.score;
    }
  }
  // „Date“ ohne Uhrzeit, aber keine Startzeit → Datum reicht
  if (mapping.start === undefined && mapping.date !== undefined) {
    const c = cols[mapping.date];
    if (contentScore('start', c.values, c.h) > 0.6) { mapping.start = mapping.date; delete mapping.date; }
  }
  const hasTime = mapping.start !== undefined || mapping.date !== undefined;
  const hasTitle = mapping.title !== undefined || mapping.series !== undefined;
  const conf = Math.min(1, ((scores.title ?? (hasTitle ? 1 : 0)) + (scores.start ?? scores.date ?? (hasTime ? 1 : 0))) / 1.6);
  return { mapping, confidence: hasTitle && hasTime ? conf : 0, needsMapping: !hasTitle || !hasTime || conf < 0.55 };
}

/** Wie gut passt eine Tabelle als Verlauf? (für die Auswahl in ZIP-Archiven) */
export function tableScore(table, preset = {}, fileHint = null) {
  if (!table.rows.length || table.headers.length < 2) return 0;
  const { mapping, confidence } = detectColumns(table.headers, table.rows.slice(0, 400), preset);
  let s = confidence;
  if (mapping.duration !== undefined) s += 0.15;
  if (mapping.start !== undefined) s += 0.1;
  const n = table.name.toLowerCase();
  if (/view|watch|histor|playback|verlauf|activity|stream/.test(n)) s += 0.35;
  if (fileHint && fileHint.test(n)) s += 0.6;
  if (/search|rating|bewert|wishlist|watchlist|billing|payment|profile|device|address|ip/.test(n.split('/').pop())) s -= 0.4;
  return s + Math.min(0.1, table.rows.length / 50000);
}

// ---------------------------------------------------------------- Einträge erzeugen
const SKIP_TYPES = /trailer|teaser|hook|preview|promo|recap|bumper|clip|vorschau/i;
const MIN_SECONDS = 60;

/**
 * Wandelt Tabellenzeilen mit Zuordnung in Einträge um.
 * Gibt { entries, skipped: { trailer, short, invalid } } zurück.
 */
export function toEntries(table, mapping) {
  const get = (row, role) => (mapping[role] === undefined || mapping[role] === null || mapping[role] === '' ? '' : String(row[mapping[role]] ?? '').trim());
  const timeCol = mapping.start ?? mapping.date;
  const order = timeCol !== undefined ? dateOrder(table.rows.map((r) => r[timeCol])) : 'dmy';
  const entries = [];
  const skipped = { trailer: 0, short: 0, invalid: 0 };
  for (const row of table.rows) {
    const type = get(row, 'type');
    if (type && SKIP_TYPES.test(type)) { skipped.trailer++; continue; }
    const when = parseWhen(get(row, 'start') || get(row, 'date'), order);
    const seriesVal = get(row, 'series');
    // Ohne eigene Titel-Spalte: Folgentitel ist bei leerer Serie der Filmtitel
    const titleVal = get(row, 'title') || (mapping.title === undefined && !seriesVal ? get(row, 'episodeTitle') : '');
    if (!when || (!titleVal && !seriesVal)) { skipped.invalid++; continue; }
    const dur = mapping.duration !== undefined ? parseDuration(get(row, 'duration'), table.headers[mapping.duration]) : null;
    if (dur !== null && dur < MIN_SECONDS) { skipped.short++; continue; }

    let parsed;
    const kindVal = get(row, 'kind').toLowerCase();
    const seasonVal = get(row, 'season');
    const episodeVal = get(row, 'episode');
    const epTitle = mapping.title === undefined && !seriesVal ? '' : get(row, 'episodeTitle');
    if (seriesVal && seriesVal !== titleVal) {
      const inner = splitTitle(seriesVal);
      parsed = {
        kind: 'tv',
        series: inner.series,
        season: Number(seasonVal) || inner.season || null,
        episode: Number(episodeVal) || null,
        episodeName: epTitle || (titleVal && normName(titleVal) !== normName(inner.series) ? titleVal : null),
      };
    } else {
      parsed = splitTitle(titleVal || seriesVal);
      if (seasonVal || episodeVal || epTitle || /episode|series|show|serie|tv/.test(kindVal)) {
        if (parsed.kind === 'movie') parsed = { kind: 'tv', series: parsed.series, season: null, episode: null, episodeName: null };
        parsed.season = Number(seasonVal) || parsed.season;
        parsed.episode = Number(episodeVal) || parsed.episode;
        parsed.episodeName = epTitle || parsed.episodeName;
      }
      if (/movie|film|feature/.test(kindVal) && !seasonVal && !episodeVal) parsed = { kind: 'movie', series: titleVal || seriesVal, season: null, episode: null, episodeName: null };
    }
    if (!parsed.series) { skipped.invalid++; continue; }
    entries.push({
      raw_title: titleVal && seriesVal && seriesVal !== titleVal ? `${seriesVal}: ${titleVal}` : titleVal || seriesVal,
      series: parsed.series,
      raw_key: rawKey(parsed.kind, parsed.series),
      kind_hint: parsed.kind,
      season: parsed.season ?? null,
      episode: parsed.episode ?? null,
      episode_name: parsed.episodeName ?? null,
      watched_at: when.date,
      time_known: when.timeKnown,
      duration_sec: dur,
      device: get(row, 'device') || null,
      country: get(row, 'country') || null,
      profile: get(row, 'profile') || null,
    });
  }
  return { entries, skipped };
}
