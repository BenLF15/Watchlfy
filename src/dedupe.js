// Doppelte Zählung vermeiden – einmal beim Speichern statt bei jeder Abfrage.
//
// Gleiche Regel wie zuvor (es wird nichts gelöscht, nur markiert):
// - Ein Trakt-Eintrag zählt nicht, wenn dieselbe Folge bzw. derselbe Film innerhalb von 36 Std. aus einem Import vorliegt.
// - Ein Eintrag nur mit Datum (z. B. Netflix-Kurzexport) zählt nicht, wenn derselbe Dienst ihn auch mit Uhrzeit geliefert
//   hat (Netflix-Datenauskunft). Gleich ist, was zum selben Titel gehört (Roh-Titel oder TMDB-Zuordnung).
//
// Früher lief diese Prüfung in jeder Statistik-Abfrage für jeden Eintrag gegen alle anderen. Bei großen Verläufen und
// veralteten Tabellenstatistiken (direkt nach einem großen Import oder Trakt-Abgleich) dauerte die Übersicht dadurch
// über eine Minute. Jetzt wird das Ergebnis in views.superseded abgelegt und nur nach Änderungen neu berechnet.
import { query } from './db.js';

const SAME_EVENT = `
  o.watched_at BETWEEN v.watched_at - interval '36 hours' AND v.watched_at + interval '36 hours'
  AND ((v.source = 'trakt' AND o.source <> 'trakt') OR (NOT v.time_known AND o.time_known AND o.source = v.source))
  AND (COALESCE(t.kind, v.kind_hint) = 'movie'
       OR (o.season IS NOT DISTINCT FROM v.season
           AND (o.episode = v.episode OR lower(o.episode_name) = lower(v.episode_name)
                OR (o.episode IS NULL AND v.episode IS NULL AND o.episode_name IS NULL AND v.episode_name IS NULL))))`;

let analyzedAt = 0;

/**
 * Markiert die überholten Einträge eines Kontos neu (oder aller Konten, wenn accountId fehlt).
 * Zwei getrennte EXISTS (gleicher Roh-Titel bzw. gleiche TMDB-Zuordnung) lassen die Datenbank jeweils einen Index nutzen.
 */
export async function markSuperseded(accountId = null, { analyze = false } = {}) {
  // Nach großen Änderungen frische Tabellenstatistiken, sonst wählt PostgreSQL womöglich einen sehr langsamen Plan
  if (analyze && Date.now() - analyzedAt > 10_000) {
    analyzedAt = Date.now();
    await query('ANALYZE views, title_aliases').catch(() => {});
  }
  const { rowCount } = await query(
    `UPDATE views x SET superseded = s.flag
       FROM (
         SELECT v.id,
                (EXISTS (SELECT 1 FROM views o
                          WHERE o.account_id = v.account_id AND o.raw_key = v.raw_key AND o.id <> v.id AND ${SAME_EVENT})
                 OR (al.title_id IS NOT NULL AND EXISTS (
                         SELECT 1 FROM title_aliases oa
                           JOIN views o ON o.account_id = oa.account_id AND o.raw_key = oa.raw_key
                          WHERE oa.account_id = v.account_id AND oa.title_id = al.title_id AND oa.raw_key <> v.raw_key
                            AND o.id <> v.id AND ${SAME_EVENT}))) AS flag
           FROM views v
           LEFT JOIN title_aliases al ON al.account_id = v.account_id AND al.raw_key = v.raw_key
           LEFT JOIN titles t ON t.id = al.title_id
          WHERE ($1::bigint IS NULL OR v.account_id = $1::bigint)
       ) s
      WHERE x.id = s.id AND x.superseded IS DISTINCT FROM s.flag`,
    [accountId],
  );
  return rowCount;
}

/** Für mehrere Konten nacheinander (z. B. nach einem TMDB-Durchlauf, der Zuordnungen geändert hat). */
export async function markSupersededFor(accountIds) {
  for (const id of new Set(accountIds)) await markSuperseded(id).catch((err) => console.warn('[dedupe]', id, err.message));
}
