// Datei (CSV, TSV, JSON, ZIP) → Liste von Tabellen { name, headers, rows }.
// ZIP-Archive der Datenauskünfte werden rekursiv durchsucht; JSON-Arrays von Objekten werden abgeflacht.
import { unzipSync, strFromU8 } from 'fflate';
import { parseCsv } from './csv.js';

const MAX_FILES = 400;
const TEXT_EXT = /\.(csv|tsv|txt|json)$/i;

const isZip = (buf) => buf.length > 4 && buf[0] === 0x50 && buf[1] === 0x4b && (buf[2] === 3 || buf[2] === 5);

function decode(u8) {
  // UTF-8 bevorzugt; enthält der Text Ersatzzeichen, als Windows-1252 lesen (ältere Excel-Exporte)
  const s = strFromU8(u8);
  if (!s.includes('�')) return s;
  try { return new TextDecoder('windows-1252').decode(u8); } catch { return s; }
}

/** Flacht verschachtelte Objekte ab: { a: { b: 1 } } → { 'a.b': 1 } (Arrays von Primitiven werden verbunden). */
function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else if (Array.isArray(v)) {
      if (v.every((x) => x === null || typeof x !== 'object')) out[key] = v.join(', ');
    } else out[key] = v;
  }
  return out;
}

/** Sucht in einem JSON-Wert alle Arrays von Objekten (z. B. { "viewingHistory": [ … ] }). */
function jsonTables(value, name, path = '') {
  const found = [];
  const walk = (v, p, depth) => {
    if (depth > 6 || !v) return;
    if (Array.isArray(v)) {
      const objs = v.filter((x) => x && typeof x === 'object' && !Array.isArray(x));
      if (objs.length >= 1 && objs.length >= v.length * 0.8) {
        const flat = objs.map((o) => flatten(o));
        const headers = [...new Set(flat.slice(0, 500).flatMap((o) => Object.keys(o)))];
        found.push({
          name: p ? `${name} › ${p}` : name,
          headers,
          rows: flat.map((o) => headers.map((h) => (o[h] === undefined || o[h] === null ? '' : String(o[h])))),
        });
        // Verschachtelte Listen in den Objekten auch prüfen (z. B. Profile → Verlauf)
        objs.slice(0, 3).forEach((o) => Object.entries(o).forEach(([k, x]) => typeof x === 'object' && walk(x, p ? `${p}.${k}` : k, depth + 1)));
      }
      return;
    }
    if (typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, p ? `${p}.${k}` : k, depth + 1));
  };
  walk(value, path, 0);
  return found;
}

function textTables(text, name) {
  const trimmed = text.trimStart();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try { return jsonTables(JSON.parse(trimmed), name); } catch { /* doch CSV */ }
    // JSON Lines
    const lines = trimmed.split(/\r?\n/).filter(Boolean);
    try { return jsonTables(lines.map((l) => JSON.parse(l)), name); } catch { /* weiter */ }
  }
  const t = parseCsv(text, name.toLowerCase().endsWith('.tsv') ? { delimiter: '\t' } : {});
  return t.headers.length > 1 || t.rows.length ? [{ name, headers: t.headers, rows: t.rows }] : [];
}

/** Liest eine hochgeladene Datei und liefert alle darin gefundenen Tabellen. */
export function extractTables(buf, filename = 'datei') {
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (isZip(u8)) {
    let files;
    try { files = unzipSync(u8, { filter: (f) => TEXT_EXT.test(f.name) || /\.zip$/i.test(f.name) }); } catch (err) {
      throw Object.assign(new Error('ZIP konnte nicht gelesen werden.'), { key: 'zipInvalid', cause: err });
    }
    const tables = [];
    for (const [name, data] of Object.entries(files).slice(0, MAX_FILES)) {
      if (name.startsWith('__MACOSX/') || /(^|\/)\./.test(name)) continue;
      if (/\.zip$/i.test(name)) {
        try { tables.push(...extractTables(data, name).map((t) => ({ ...t, name: `${name} › ${t.name}` }))); } catch { /* ignorieren */ }
        continue;
      }
      tables.push(...textTables(decode(data), name));
    }
    return tables;
  }
  return textTables(decode(u8), filename);
}
