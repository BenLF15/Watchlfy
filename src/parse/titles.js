// Titel zerlegen: „Serie: Staffel 2: Folge 5“, „Show: Season 1: Chapter One: The Vanishing (Episode 1)“,
// „The Boys – Season 1“, „Show: Limited Series: Episode 3“ … → { kind, series, season, episode, episodeName }.

const N = '(\\d{1,3})';
const WORDNUM = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10,
};
const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10 };

// Staffel-Wörter (alle 7 App-Sprachen + Englisch/Niederländisch/Portugiesisch für Netflix-Exporte)
const SEASON_WORDS = ['staffel', 'season', 'series', 'saison', 'temporada', 'stagione', 'säsong', 'sæson', 'seizoen', 'sezon'];
// Schwache Wörter („Dune: Part Two“ ist ein Film) zählen nur, wenn danach noch ein Folgen-Teil kommt
const WEAK_WORDS = ['teil', 'part', 'partie', 'parte', 'del', 'volume', 'vol\\.', 'band', 'book', 'buch', 'livre', 'libro', 'collection'];
const LIMITED = [
  'limited series', 'limitierte serie', 'miniserie', 'mini-serie', 'mini-série', 'minisérie', 'mini series', 'miniseries',
  'série limitée', 'serie limitada', 'serie limitata', 'begränsad serie', 'begrænset serie', 'miniserien', 'docuseries',
];
const EPISODE_WORDS = [
  'folge', 'episode', 'épisode', 'episodio', 'episódio', 'capítulo', 'capitolo', 'avsnitt', 'afsnit', 'aflevering', 'ep\\.', 'teil',
];

const NUMWORD = `(${N.slice(1, -1)}|[ivx]{1,4}|${Object.keys(WORDNUM).join('|')})`;
const weakRe = new RegExp(`^(?:${WEAK_WORDS.join('|')})\\s+${NUMWORD}$`, 'iu');
const seasonRe = new RegExp(`^(?:${SEASON_WORDS.join('|')})\\s+(${N.slice(1, -1)}|[ivx]{1,4}|${Object.keys(WORDNUM).join('|')})$`, 'iu');
const seasonRe2 = new RegExp(`^${N}\\.?\\s*(?:${SEASON_WORDS.join('|')})$`, 'iu'); // „2. Staffel“
const limitedRe = new RegExp(`^(?:${LIMITED.join('|')})$`, 'iu');
const episodeOnlyRe = new RegExp(`^(?:${EPISODE_WORDS.join('|')})\\s*${N}$`, 'iu');
const episodeSuffixRe = new RegExp(`\\s*\\((?:${EPISODE_WORDS.join('|')})\\s*${N}\\)\\s*$`, 'iu');
const episodePrefixRe = new RegExp(`^(?:${EPISODE_WORDS.join('|')})\\s*${N}\\s*[:.–-]\\s*(.+)$`, 'iu');
const sxe = /^s(\d{1,2})\s*e(\d{1,3})$/i;

function seasonNumber(seg, hasRest = true) {
  const s = seg.trim();
  if (limitedRe.test(s)) return 1;
  let m = seasonRe.exec(s) || (hasRest ? weakRe.exec(s) : null);
  if (m) {
    const v = m[1].toLowerCase();
    return Number(v) || WORDNUM[v] || ROMAN[v] || null;
  }
  m = seasonRe2.exec(s);
  if (m) return Number(m[1]);
  return null;
}

/** Normalisierter Schlüssel für Vergleiche (klein, ohne Akzente/Satzzeichen). */
export function normName(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export const rawKey = (kind, name) => `${kind}|${normName(name)}`;

/**
 * Zerlegt einen Titel. Ohne erkennbare Staffel → Film (kann später durch TMDB zur Serie werden).
 * Gibt immer { kind, series, season, episode, episodeName } zurück; bei Filmen ist series der Filmtitel.
 */
export function splitTitle(raw) {
  let title = String(raw || '').replace(/\s+/g, ' ').trim();
  let episode = null;
  const suf = episodeSuffixRe.exec(title);
  if (suf) {
    episode = Number(suf[1]);
    title = title.slice(0, suf.index).trim();
  }
  // Trennzeichen „: “ (Netflix) – zusätzlich „ - “/„ – “, wenn danach ein Staffel-Teil kommt (Prime/Max)
  let parts = title.split(/:\s+/);
  if (parts.length === 1) {
    const dash = title.split(/\s+[-–—|]\s+/);
    if (dash.length > 1 && dash.slice(1).some((p) => seasonNumber(p, false) !== null || sxe.test(p.trim()))) parts = dash;
  }
  for (let i = 1; i < parts.length; i++) {
    const seg = parts[i].trim();
    const m = sxe.exec(seg);
    const season = m ? Number(m[1]) : seasonNumber(seg, i < parts.length - 1);
    if (season === null) continue;
    if (m) episode = episode ?? Number(m[2]);
    const series = parts.slice(0, i).join(': ').trim();
    let rest = parts.slice(i + 1).join(': ').trim();
    const only = episodeOnlyRe.exec(rest);
    if (only) { episode = episode ?? Number(only[1]); rest = ''; }
    const pre = episodePrefixRe.exec(rest);
    if (pre) { episode = episode ?? Number(pre[1]); rest = pre[2].trim(); }
    return { kind: 'tv', series, season, episode, episodeName: rest || null };
  }
  // „Show: Folge 3“ ohne Staffel
  if (parts.length > 1) {
    const last = parts[parts.length - 1].trim();
    const only = episodeOnlyRe.exec(last);
    if (only) return { kind: 'tv', series: parts.slice(0, -1).join(': '), season: 1, episode: Number(only[1]), episodeName: null };
  }
  if (episode !== null && parts.length > 1) {
    return { kind: 'tv', series: parts[0], season: null, episode, episodeName: parts.slice(1).join(': ') || null };
  }
  return { kind: 'movie', series: title, season: null, episode: null, episodeName: null };
}
