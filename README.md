# Watchlfy

Deine persönliche **Film- & Serien-Statistik** – das Schwesterprojekt von Spotlfy. Watchlfy wertet aus, was du
bei **Netflix, Prime Video, Max (HBO), Disney+ und Apple TV+** geschaut hast, ergänzt Poster, Genres und Laufzeiten
von **TMDB** und hält sich auf Wunsch über **Trakt.tv** automatisch aktuell.

Keine Passwörter der Streamingdienste, kein Scraping, kein Auto-Login: Du lädst die Verlaufsdatei hoch, die dir der
Dienst selbst gibt.

## Funktionen

| Bereich | Was es gibt |
|---|---|
| **Import** | Ein Knopf pro Dienst mit Schritt-für-Schritt-Anleitung, Drag & Drop, Vorschau (Einträge, Zeitraum, Profile), Profil-Auswahl, Spalten-Zuordnungs-Dialog als Fallback, ZIP/CSV/JSON, idempotent (erneutes Hochladen erzeugt keine Duplikate), Import rückgängig machen |
| **Übersicht** | Schauzeit, Ø pro Tag, Folgen, Filme, Serien, längste Serie (Tage am Stück), Lieblingszeit, bester Tag, Dienst-Verteilung, Weiterschauen, Top-Serien/-Filme, Zeitraum 7 T / 30 T / 90 T / 1 J / Alles |
| **Top-Listen** | Serien, Filme, Genres, Schauspieler, Länder (Podium + Rangliste) |
| **Schauzeiten** | Heatmap Wochentag × Uhrzeit, nach Stunde/Wochentag, Binge-Erkennung („5 Folgen am Stück“) |
| **Fortschritt** | Pro Serie gesehene vs. alle Folgen (TMDB, ohne Specials), Staffel-Kacheln, „Weiterschauen“ mit nächster Folge |
| **Verlauf** | Nach Tagen, Suche, Detailansicht mit Poster, Backdrop, Staffel-Raster, Besetzung, Gesamtzeit |
| **TMDB** | Abgleich im Hintergrund mit Treffer-Sicherheit; unsichere Treffer im Profil (oder im Detail) korrigieren |
| **Trakt.tv** | OAuth, Sync alle 30 Min., „Läuft gerade“ über Trakt-Scrobble, Bewertungen; Doppelungen mit Importen werden übersprungen |
| **Rückblick** | „Dein Jahr in Serien“ als Vollbild-Story mit Übergängen, Wischen schließt, Teilen |
| **Freunde** | Anfrage per Benutzername, Match-Wert, gemeinsame Titel, Top-5-Vergleich, Sammlung ansehen |
| **Sammlung** | Noten (Bronze/Silber/Gold/Platin), DVD-/Blu-ray-Wand, Filmplakat-Galerie, Seltenheiten gewöhnlich → selten (Steelbook) → episch (Collector’s Edition) → legendär (signiert) → mythisch (holografisch), begehbare Retro-Videothek mit Tagesangebot, versteckte Geschenke |
| **Vorführraum** | Tägliches Quiz: Titel am unscharfen Standbild erraten (schärfer = weniger Punkte), Veredeln von Sammlerstücken |
| **Komfort** | Konten mit Admin-Rolle, Profilbild (Upload, Zuschneiden, Vorlagen), Hell/Dunkel/System/Jahreszeit, Liquid Glass, festliche Effekte (inkl. geschmückter Videothek), View Transitions, „Neu in Watchlfy“, Zoom-Sperre, PWA, 7 Sprachen (de, en, fr, es, it, sv, da), „Bewegung reduzieren“ wird respektiert, Datenschutz-Seite, Datenexport, Admin-Backup/Restore |

## So kommst du an deine Daten

| Dienst | Weg | Dauer |
|---|---|---|
| **Netflix** (schnell) | Konto → Profil → *Wiedergabeaktivität* → ganz unten „Alle herunterladen“ → `NetflixViewingHistory.csv` (nur Titel + Datum) | sofort |
| **Netflix** (genau) | [netflix.com/account/getmyinfo](https://www.netflix.com/account/getmyinfo) → ZIP mit `CONTENT_INTERACTION/ViewingActivity.csv` (Uhrzeit, Dauer, Gerät, alle Profile) – ZIP direkt hochladen | 1–30 Tage |
| **Prime Video** | Amazon → „Meine Daten anfordern“ → Kategorie Prime Video → ZIP hochladen (die Verlaufsdatei wird automatisch gefunden) | einige Tage |
| **Max (HBO)** | Datenschutz-Anfrage bei Warner Bros. Discovery → CSV oder JSON | einige Tage |
| **Disney+** | Datenschutzcenter von Disney → Datenauskunft | einige Tage |
| **Apple TV+** | privacy.apple.com → „Kopie deiner Daten“ → Apple Media Services | einige Tage |
| **Trakt.tv** | Profil → „Mit Trakt verbinden“ | automatisch |

## Einrichtung

```bash
npm install
cp .env.example .env   # DATABASE_URL eintragen, optional TMDB_API_KEY, TRAKT_CLIENT_ID/SECRET
npm run dev            # http://127.0.0.1:3000
```

Das erste registrierte Konto wird Admin. Das Datenbankschema wird bei jedem Start idempotent angelegt/migriert.

### Umgebungsvariablen

| Variable | Pflicht | Zweck |
|---|---|---|
| `DATABASE_URL` | ✓ | Postgres (Render: „Internal Database URL“) |
| `SESSION_SECRET` | empfohlen | Schlüssel für Sitzungs-Cookies (Render erzeugt ihn per Blueprint) |
| `TMDB_API_KEY` | empfohlen | v3-API-Key oder v4-Lesetoken von [themoviedb.org](https://www.themoviedb.org/settings/api) – ohne ihn gibt es keine Poster, Genres, Laufzeiten und keinen Fortschritt |
| `TRAKT_CLIENT_ID`, `TRAKT_CLIENT_SECRET` | optional | Trakt-App unter [trakt.tv/oauth/applications](https://trakt.tv/oauth/applications); Redirect URI: `<deine URL>/auth/trakt/callback` |
| `TIMEZONE` | optional | Standard `Europe/Berlin` (für Uhrzeiten, Tageswechsel der Videothek) |
| `OPERATOR_NAME`, `OPERATOR_ADDRESS`, `OPERATOR_EMAIL` | für öffentliche Instanzen | Angaben in der Datenschutzerklärung |
| `ALLOW_REGISTRATION`, `REGISTER_LIMIT`, `SYNC_INTERVAL_MINUTES`, `MAX_UPLOAD_MB`, `TMDB_LANGUAGE`, `KEEP_ALIVE`, `CRON_SECRET` | optional | siehe `.env.example` |

Secrets gehören nur in Umgebungsvariablen – niemals ins Repository.

### Deploy auf Render

**Schritt-für-Schritt-Anleitung mit allen Feldern: [`docs/RENDER.md`](docs/RENDER.md).**

`render.yaml` ist ein Blueprint (Web-Service + Postgres in Frankfurt). Nach dem ersten Deploy `TMDB_API_KEY` und ggf.
die Trakt-Zugangsdaten unter *Environment* eintragen. Fehlt `DATABASE_URL` oder ist die Datenbank nicht erreichbar,
zeigt die App statt eines Absturzes eine Setup-Seite mit dem genauen Problem. Trakt-Sync und TMDB-Nachladen laufen im
Prozess selbst (kein Cron-Job nötig); auf dem Free-Plan hält ein Selbst-Ping den Dienst wach.

## Tests

```bash
npm test             # Unit-Tests: Titel-Zerlegung, CSV/ZIP/JSON, Spalten-Erkennung, i18n-Vollständigkeit
npm run test:e2e     # Playwright, Handy (Pixel 7) + Desktop, gegen tests/mock-server.js (TMDB + Trakt)
```

Die E2E-Tests brauchen eine Wegwerf-Datenbank (`TEST_DATABASE_URL`, Standard
`postgres://postgres@127.0.0.1:5433/watchlfy_test` – sie wird bei jedem Lauf geleert). Screenshots landen in
`tests/.screens/`.

## Aufbau

```
src/         server.js (Start/Setup-Seite) · app.js (Routen, CSP, Sessions) · users.js · imports.js
             parse/ (csv, tables, detect, titles) · tmdb.js · trakt.js · stats.js · features.js (Rückblick, Freunde)
             collection.js (Noten, Videothek, Vorführraum) · scheduler.js · backup.js · schema.sql
public/      index.html · app.js · assets/ (watchlfy.css = Design-System, extras.js, collection.js, i18n.js, changelog.js, theme.js)
tests/       unit/ · e2e/ · fixtures.js · mock-server.js · start-test-server.js
docs/PLAN.md Datenmodell & Import-Formate
```

## Grenzen (ehrlich)

- **Kein Live-Status ohne Trakt.** Importe sind Momentaufnahmen; „Läuft gerade“ und automatische Aktualisierung gibt es nur mit Trakt.
- **Geschätzte Zeiten.** Netflix’ Kurzexport enthält nur Datum, keine Uhrzeit oder Dauer; Trakt kennt nur „gesehen“.
  Dann zählt die Laufzeit aus TMDB (bzw. 45/105 Min. ohne TMDB) – im UI als „geschätzt“ gekennzeichnet. Einträge ohne
  Uhrzeit fehlen in der Uhrzeit-Heatmap.
- **Formate können sich ändern.** Prime Video, Max, Disney+ und Apple dokumentieren ihre Datenauskunft nicht. Die
  Spalten-Erkennung ist heuristisch; wenn sie unsicher ist, fragt der Zuordnungs-Dialog nach. Die Links zu den
  Datenseiten können sich ebenfalls ändern.
- **Zeitzonen.** Zeitangaben ohne Zone (z. B. Netflix „Start Time“) werden als UTC gelesen.
- **TMDB-Treffer** für mehrdeutige oder lokalisierte Titel können falsch sein → im Profil unter „Zuordnungen prüfen“ korrigieren.
- **Doppelte Zählung** wird vermieden: Trakt-Einträge zählen nicht, wenn dieselbe Folge/derselbe Film innerhalb von 36 Std.
  auch per Import vorliegt, und Netflix-Kurzexport-Einträge (nur Datum) treten hinter die genaue Datenauskunft zurück.
  Zwischen zwei verschiedenen Streaming-Diensten (gleicher Titel bei Netflix und Prime) wird nicht zusammengeführt.
- **Vorführraum:** Das Standbild wird serverseitig in kleiner Auflösung geliefert (echte Unschärfe); wer die
  Netzwerk-Tools öffnet, kann trotzdem schummeln.
- Poster, Backdrops und Metadaten stammen von TMDB. *This product uses the TMDB API but is not endorsed or certified by TMDB.*
