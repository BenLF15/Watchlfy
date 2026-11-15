# Watchlfy – Plan, Datenmodell & Import-Formate

Schwesterprojekt von Spotlfy. Gleicher Stack: Node 22 (ESM) · Express · PostgreSQL (`pg`) · Vanilla-JS ·
Chart.js · Render. Übernommen aus Spotlfy: Konten/Login, Sessions, Themes (Hell/Dunkel/System/Jahreszeit,
Liquid Glass), i18n-Mechanik, Changelog-Pop-up, Profilbild, Datenschutz, Export, Backup/Restore, Kino-Kasse (Filmmeter & Goldtickets).

## Architektur

```
src/
  server.js      Start + Setup-Seite bei fehlender Konfiguration
  app.js         Express-Routen, CSP, Sessions
  config.js      alle Einstellungen aus Umgebungsvariablen
  db.js          Pool, Migration (schema.sql, idempotent)
  users.js       Konten, Passwörter (scrypt), Admin, Profilbild
  parse/         csv.js · tables.js (ZIP/JSON → Tabellen) · detect.js (Spalten-Erkennung) · titles.js (Titel zerlegen)
  imports.js     Vorschau → Commit, idempotent über dedupe_key
  tmdb.js        TMDB-Client + Cache (tmdb_cache), Matching, Hintergrund-Anreicherung
  trakt.js       OAuth, Verlauf-Sync (30 Min.), „Läuft gerade“, Bewertungen
  stats.js       Übersicht, Top-Listen, Schauzeiten, Binges, Fortschritt, Verlauf
  features.js    Rückblick, Freunde, Export
  soundtrack.js  Filmmusik für den Rückblick (iTunes-Suche, Audio-Proxy, Cache)
  collection.js  Filmmeter/Goldtickets, Videothek, Sammlung, Vorführraum-Quiz, Veredeln, Geschenke
  scheduler.js   Trakt-Sync, TMDB-Nachladen
public/          index.html, app.js, login, Datenschutz, assets (i18n, theme, changelog, styles)
tests/           Playwright (Handy + Desktop) + node:test-Unit-Tests für Parser; Mock-Server für TMDB/Trakt
```

## Datenmodell

| Tabelle | Zweck |
|---|---|
| `accounts` | Benutzername, scrypt-Hash, Admin, Theme/Sprache/Glas/Festlich, Geburtstag, Datenschutz-Zustimmung |
| `login_events`, `account_avatars`, `app_meta` | wie Spotlfy |
| `titles` | Serie oder Film (geteilt): `kind` movie/tv, `tmdb_id`, Name, Jahr, Poster/Backdrop, Genres, Länder, Cast, Laufzeit, Staffeln (jsonb), Folgenzahl |
| `episodes` | `title_id`, Staffel, Folge, Name, Laufzeit (aus TMDB) |
| `title_aliases` | pro Konto: normalisierter Roh-Titel → `title_id`, Treffer-Sicherheit, manuell korrigiert ja/nein |
| `views` | ein Seh-Ereignis: Konto, Quelle (netflix/prime/max/disney/apple/other/trakt), Profil, Roh-Titel, Serie/Staffel/Folge, `watched_at`, `time_known`, echte `duration_sec` (oder NULL → geschätzt), Gerät, Land, `import_id`, `dedupe_key` (unique pro Konto) |
| `imports` | Protokoll je Import: Quelle, Datei, Profil, Zeilen gesamt/neu/übersprungen, Zeitraum |
| `tmdb_cache` | rohe TMDB-Antworten (Suche, Details, Staffeln) mit Zeitstempel |
| `trakt_tokens` | OAuth-Tokens pro Konto, Trakt-Benutzername, letzter Sync, Fehler |
| `ratings` | Trakt-Bewertungen (optional) |
| `friendships` | Anfrage/angenommen (wie Spotlfy) |
| `note_ledger` | Buchungen in Filmmetern (`meters`) und Goldtickets (`tickets`; alte Bronze/Silber/Gold/Platin-Spalten werden einmalig umgerechnet), einmalige Belohnungen über eindeutigen `key` |
| `collection` | Sammlerstücke: Format (dvd/bluray/poster), Seltenheit, Edition (Steelbook, signiert, holografisch …), Titel |
| `screening_sessions` | tägliches Vorführraum-Quiz (Runden, Fortschritt, Punkte) |

Schauzeit = `COALESCE(views.duration_sec, episodes.runtime, titles.runtime, Standard)` – alles ohne echte Dauer wird als „geschätzt“ markiert.

## Import-Formate

| Dienst | Datei | Erkennung |
|---|---|---|
| Netflix (einfach) | `NetflixViewingHistory.csv`: `Title,Date` | Datum ohne Uhrzeit → `time_known=false` (zählt nicht in Uhrzeit-Heatmap) |
| Netflix (ausführlich) | `CONTENT_INTERACTION/ViewingActivity.csv`: Profile Name, Start Time (UTC), Duration (hh:mm:ss), Attributes, Title, Supplemental Video Type, Device Type, Bookmark, Latest Bookmark, Country | Profil-Auswahl; Zeilen mit Supplemental Video Type (TRAILER, TEASER_TRAILER, HOOK, …) werden ignoriert; ZIP der Datenauskunft wird durchsucht |
| Prime Video | ZIP/CSV aus „Meine Daten anfordern“ → Prime Video, z. B. `Digital.PrimeVideo.Viewinghistory.csv` | Spalten per Synonym-Liste (Titel, Serie, Staffel, Folge, Startzeit, Dauer, Gerät, Profil); unklar → Zuordnungs-Dialog |
| Max (HBO) | CSV oder JSON aus der WBD-Datenschutzanfrage | JSON-Arrays werden abgeflacht, dann gleiche Erkennung |
| Disney+, Apple TV+, andere | beliebige CSV/JSON/ZIP | generisch + Zuordnungs-Dialog |
| Trakt.tv | API (`/sync/history`, `/users/me/watching`, `/sync/ratings`) | liefert direkt TMDB-IDs |

Titel wie `Serie: Staffel 2: Folge 5` / `Show: Season 1: Chapter One` / `Show: Limited Series: Episode 3` werden zerlegt
(Staffel-Wörter in allen 7 Sprachen + Englisch). Ohne Staffel-Teil gilt der Eintrag zunächst als Film; findet TMDB
keinen Film, aber eine Serie mit dem Teil vor dem ersten Doppelpunkt, wird er als Folge eingeordnet.

Idempotenz: `dedupe_key = sha1(quelle | profil | roh-titel | zeitpunkt)` (Netflix-einfach: Tag + laufende Nummer
gleicher Titel/Tag). Trakt-Einträge werden übersprungen, wenn dieselbe Folge/derselbe Film am selben Tag schon aus
einer anderen Quelle vorliegt.

## Etappen

a) Konten + Netflix-Import + TMDB + Übersicht · b) Prime/Max/Generisch + Spalten-Zuordnung · c) Trakt ·
d) Statistiken/Rückblick · e) Freunde · f) Sammlung/Videothek/Vorführraum.

## Grenzen

- Ohne Trakt gibt es keinen Live-Status („Läuft gerade“) und keine automatische Aktualisierung – Exporte sind Momentaufnahmen.
- Netflix' einfache CSV hat nur Datum, keine Uhrzeit/Dauer → Zeiten sind geschätzt, Heatmap nutzt nur Einträge mit Uhrzeit.
- Prime-/Max-Datenauskünfte haben kein dokumentiertes, stabiles Format; die Erkennung ist heuristisch, der Zuordnungs-Dialog ist der Fallback.
- TMDB-Treffer für mehrdeutige Titel können falsch sein → im UI korrigierbar.
- Vorführraum-Standbilder werden in kleiner Auflösung ausgeliefert (echte Unschärfe), ein Rest an Schummel-Möglichkeit bleibt.
