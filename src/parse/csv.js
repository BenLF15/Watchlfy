// Kleiner, robuster CSV-Parser (RFC 4180): Anführungszeichen, Zeilenumbrüche in Feldern, BOM,
// Trennzeichen-Erkennung (Komma, Semikolon, Tab, Pipe).

const DELIMS = [',', ';', '\t', '|'];

/** Errät das Trennzeichen anhand der ersten Zeilen (außerhalb von Anführungszeichen). */
export function detectDelimiter(text) {
  const sample = text.slice(0, 20000);
  let best = ',';
  let bestScore = -1;
  for (const d of DELIMS) {
    const counts = [];
    let inQ = false;
    let n = 0;
    for (let i = 0; i < sample.length && counts.length < 20; i++) {
      const c = sample[i];
      if (c === '"') inQ = !inQ;
      else if (!inQ && c === d) n++;
      else if (!inQ && c === '\n') { counts.push(n); n = 0; }
    }
    if (n) counts.push(n);
    if (!counts.length || !counts[0]) continue;
    // gleichmäßige Anzahl pro Zeile ist ein gutes Zeichen
    const same = counts.filter((x) => x === counts[0]).length / counts.length;
    const score = counts[0] * same;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

/** Parst CSV-Text → { headers, rows } (rows = Arrays von Strings). Leere Zeilen werden übersprungen. */
export function parseCsv(input, { delimiter } = {}) {
  let text = String(input);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const d = delimiter || detectDelimiter(text);
  const out = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += c;
      continue;
    }
    if (c === '"' && field === '') { inQ = true; continue; }
    if (c === d) { row.push(field); field = ''; continue; }
    if (c === '\r') continue;
    if (c === '\n') {
      row.push(field);
      if (row.some((f) => f.trim() !== '')) out.push(row);
      row = [];
      field = '';
      continue;
    }
    field += c;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) out.push(row);
  if (!out.length) return { headers: [], rows: [], delimiter: d };
  const headers = out[0].map((h, i) => h.trim() || `Spalte ${i + 1}`);
  return { headers, rows: out.slice(1), delimiter: d };
}
