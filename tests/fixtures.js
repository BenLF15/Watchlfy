// Testdateien mit Datumsangaben relativ zu heute (damit 7-/30-Tage-Ansichten Daten haben).
import { zipSync, strToU8 } from 'fflate';

const pad = (n) => String(n).padStart(2, '0');
const dayAgo = (d, h = 20, m = 0) => { const x = new Date(Date.now() - d * 864e5); x.setUTCHours(h, m, 0, 0); return x; };
const iso = (x) => `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())} ${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}:00`;
const dmy = (x) => `${pad(x.getUTCDate())}.${pad(x.getUTCMonth() + 1)}.${String(x.getUTCFullYear()).slice(2)}`;

/** Netflix „Alle herunterladen“ (deutsch): Title,Date */
export function netflixSimple() {
  const rows = [
    ['Dark: Staffel 1: Geheimnisse', dayAgo(40)],
    ['Dark: Staffel 1: Lügen', dayAgo(40)],
    ['Dark: Staffel 1: Gestern und heute', dayAgo(40)],
    ['Dark: Staffel 1: Doppelleben', dayAgo(39)],
    ['Inception', dayAgo(35)],
    ['Haus des Geldes: Teil 1: Folge 1', dayAgo(20)],
    ['Haus des Geldes: Teil 1: Folge 2', dayAgo(20)],
  ];
  return `Title,Date\n${rows.map(([t, d]) => `"${t}","${dmy(d)}"`).join('\n')}\n`;
}

/** Netflix-Datenauskunft: ZIP mit CONTENT_INTERACTION/ViewingActivity.csv (zwei Profile, Trailer). */
export function netflixZip() {
  const head = 'Profile Name,Start Time,Duration,Attributes,Title,Supplemental Video Type,Device Type,Bookmark,Latest Bookmark,Country';
  const rows = [];
  // Binge: 5 Folgen Stranger Things am Stück vor 2 Tagen
  for (let i = 0; i < 5; i++) rows.push(['Ben', iso(dayAgo(2, 15, i * 52)), '00:50:00', '', `Stranger Things: Season 1: Chapter ${['One', 'Two', 'Three', 'Four', 'Five'][i]} (Episode ${i + 1})`, '', 'Samsung TV', '00:50:00', '00:50:00', 'DE (Germany)']);
  rows.push(['Ben', iso(dayAgo(2, 14, 40)), '00:01:30', '', 'Stranger Things: Season 1 (Trailer)', 'TRAILER', 'Samsung TV', '', '', 'DE (Germany)']);
  for (let d = 1; d <= 6; d++) rows.push(['Ben', iso(dayAgo(d, 21, 10)), '00:46:00', '', `Breaking Bad: Season 1: Folge (Episode ${d})`, '', 'iPhone', '00:46:00', '00:46:00', 'DE (Germany)']);
  rows.push(['Ben', iso(dayAgo(3, 23, 30)), '02:40:00', '', 'Dune: Part Two', '', 'Samsung TV', '02:40:00', '02:40:00', 'DE (Germany)']);
  rows.push(['Ben', iso(dayAgo(5, 8, 0)), '00:22:00', '', 'The Office (U.S.): Season 2: The Dundies (Episode 1)', '', 'iPad', '', '', 'DE (Germany)']);
  rows.push(['Kids', iso(dayAgo(1, 9, 0)), '00:10:00', '', 'Peppa Wutz: Staffel 1: Folge 3', '', 'iPad', '', '', 'DE (Germany)']);
  const csv = `${head}\n${rows.map((r) => r.map((c) => (/[",]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(',')).join('\n')}\n`;
  return Buffer.from(zipSync({
    'CONTENT_INTERACTION/ViewingActivity.csv': strToU8(csv),
    'CONTENT_INTERACTION/SearchHistory.csv': strToU8('Profile Name,Device,Search Query,Utc Timestamp\nBen,TV,dark,2024-01-01 10:00:00\n'),
    'PROFILES/Profiles.csv': strToU8('Profile Name,Email Address\nBen,x\nKids,y\n'),
  }));
}

/** Prime Video: unbekanntes Format mit getrennten Spalten (wie es in Datenauskünften vorkommt). */
export function primeCsv() {
  const rows = [
    [iso(dayAgo(4, 20, 0)), 'The Boys', 'Das Spiel', '1', '1', '3600', 'Fire TV'],
    [iso(dayAgo(4, 21, 5)), 'The Boys', 'Cherry', '1', '2', '3500', 'Fire TV'],
    [iso(dayAgo(10, 20, 0)), '', 'Oppenheimer', '', '', '10800', 'Fire TV'],
  ];
  return `Playback Start (UTC),Series Title,Episode Title,Season,Episode Number,Playback Duration (sec),Device\n${rows.map((r) => r.join(',')).join('\n')}\n`;
}

/** Datei mit unklaren Spalten → Zuordnungs-Dialog. */
export function weirdCsv() {
  const rows = [
    ['x1', 'Barbie', '2', `${pad(dayAgo(6).getUTCDate())}/${pad(dayAgo(6).getUTCMonth() + 1)}/${dayAgo(6).getUTCFullYear()}`],
    ['x2', 'Matrix', '1', `${pad(dayAgo(7).getUTCDate())}/${pad(dayAgo(7).getUTCMonth() + 1)}/${dayAgo(7).getUTCFullYear()}`],
  ];
  return `col_a;col_b;col_c;col_d\n${rows.map((r) => r.join(';')).join('\n')}\n`;
}

/** Max: JSON-Datenauskunft. */
export function maxJson() {
  return JSON.stringify({
    exportVersion: 2,
    viewingHistory: [
      { contentTitle: 'House of the Dragon', episodeTitle: 'Ein Sohn für einen Sohn', seasonNumber: 2, episodeNumber: 1, viewedAt: dayAgo(8, 20).toISOString(), watchTimeSeconds: 3600, device: { type: 'Web' } },
      { contentTitle: 'House of the Dragon', episodeTitle: 'Rhaenyra die Grausame', seasonNumber: 2, episodeNumber: 2, viewedAt: dayAgo(8, 21, 5).toISOString(), watchTimeSeconds: 3500, device: { type: 'Web' } },
      { contentTitle: 'Der Herr der Ringe: Die Gefährten', viewedAt: dayAgo(12, 19).toISOString(), watchTimeSeconds: 10500, device: { type: 'TV' } },
    ],
  });
}
