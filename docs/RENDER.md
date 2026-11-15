# Watchlfy auf Render einrichten

Diese Anleitung bringt Watchlfy mit Datenbank, TMDB (Poster/Metadaten) und Trakt (automatischer Sync) online.
Dauer: ca. 15 Minuten. Alle Geheimnisse trägst du nur in Render ein, nie ins Repository.

## 0. Vorher: Code auf den Hauptzweig bringen

Render baut standardmäßig den Standard-Branch (`main`). Der aktuelle Stand liegt auf
`claude/watchlfy-streaming-stats-5ylvlb`. Entweder

- den Branch auf GitHub per Pull Request in `main` mergen (empfohlen), **oder**
- in Schritt 1 bzw. später unter *Settings → Build & Deploy → Branch* diesen Branch auswählen.

## 1. Blueprint anlegen (Datenbank + Web-Service in einem Schritt)

1. [dashboard.render.com](https://dashboard.render.com) → oben rechts **New** → **Blueprint**.
2. GitHub verbinden (falls noch nicht geschehen) und das Repository **BenLF15/Watchlfy** wählen.
3. **Blueprint Name**: z. B. `watchlfy`. Branch: `main` (oder den Claude-Branch, siehe Schritt 0).
4. Render liest `render.yaml` und zeigt zwei Ressourcen an:
   - **watchlfy-db** – PostgreSQL 16, Region Frankfurt
   - **watchlfy** – Node-Web-Service, Region Frankfurt
5. Render fragt jetzt nach den Variablen, die im Blueprint mit `sync: false` markiert sind. Trage ein:

| Feld | Wert | Pflicht? |
|---|---|---|
| `TMDB_API_KEY` | dein TMDB-Schlüssel (siehe Abschnitt 2) | empfohlen – ohne ihn keine Poster, Genres, Laufzeiten, kein Fortschritt |
| `TRAKT_CLIENT_ID` | Client ID deiner Trakt-App (siehe Abschnitt 3) | optional – nur für automatischen Sync |
| `TRAKT_CLIENT_SECRET` | Client Secret deiner Trakt-App – **leer lassen**, wenn Trakt keins anzeigt (PKCE) | optional |
| `OPERATOR_NAME` | dein Name (für die Datenschutzerklärung) | Pflicht, wenn andere die App nutzen |
| `OPERATOR_ADDRESS` | Anschrift, Zeilen mit `|` trennen, z. B. `Musterstraße 1|12345 Musterstadt` | wie oben |
| `OPERATOR_EMAIL` | Kontakt-E-Mail | wie oben |

   Felder, die du noch nicht hast (z. B. Trakt), kannst du leer lassen und später nachtragen.
6. **Apply** klicken. Render legt die Datenbank an, installiert die Pakete (`npm install --omit=dev`) und startet
   `npm start`. Der erste Deploy dauert 2–4 Minuten.

Automatisch gesetzt (nichts zu tun):

| Variable | Woher |
|---|---|
| `DATABASE_URL` | Blueprint verknüpft die „Internal Database URL“ der Datenbank |
| `SESSION_SECRET` | Blueprint erzeugt einen zufälligen Wert (`generateValue`) |
| `NODE_VERSION` | `22` |
| `TIMEZONE` | `Europe/Berlin` |
| `RENDER_EXTERNAL_URL` | setzt Render selbst, z. B. `https://watchlfy.onrender.com` |

## 2. TMDB-Schlüssel holen

1. Konto auf [themoviedb.org](https://www.themoviedb.org/signup) anlegen und bestätigen.
2. Profilbild → **Einstellungen** → **API** → **Erstelle** → Typ **Developer**, Zweck „persönliche Statistik-App“.
3. Danach zeigt die Seite zwei Werte. Nimm **einen** davon:
   - **API-Lesezugriffstoken** (langer Text, beginnt mit `eyJ…`) – empfohlen, oder
   - **API-Schlüssel** (32 Zeichen).
4. In Render: Service **watchlfy** → **Environment** → `TMDB_API_KEY` → Wert einfügen → **Save Changes**.
   Render startet den Service dann automatisch neu.

Optional: `TMDB_LANGUAGE` (Standard `de-DE`) für die Sprache von Titeln und Beschreibungen.

## 3. Trakt-App anlegen (optional, für automatischen Sync und „Läuft gerade“)

1. Auf [trakt.tv](https://trakt.tv) anmelden → [trakt.tv/oauth/applications](https://trakt.tv/oauth/applications) → **New Application**.
2. Ausfüllen:
   - **Name**: `Watchlfy`
   - **Redirect uri**: `https://<dein-service>.onrender.com/auth/trakt/callback`
     (die genaue Adresse steht in Render oben auf der Service-Seite; für den Blueprint-Namen meist
     `https://watchlfy.onrender.com/auth/trakt/callback`)
   - **Javascript (cors) origins**: leer lassen
   - **Permissions**: nichts ankreuzen (Watchlfy liest nur)
3. **Save App** → die Seite zeigt **Client ID** und **Client Secret**.
4. In Render: **Environment** → `TRAKT_CLIENT_ID` eintragen → **Save Changes**. Zeigt Trakt **kein Client Secret** an
   (Anmeldung per **PKCE**), bleibt `TRAKT_CLIENT_SECRET` leer – Watchlfy meldet sich dann per PKCE an. Gibt Trakt ein
   Secret aus, trägst du es zusätzlich in `TRAKT_CLIENT_SECRET` ein.

Eigene Domain? Dann zusätzlich `TRAKT_REDIRECT_URI` = `https://deine-domain.de/auth/trakt/callback` setzen
und dieselbe Adresse in der Trakt-App eintragen.

## 4. Erste Anmeldung

1. Die Service-Adresse öffnen (`https://watchlfy.onrender.com`).
2. **Registrieren** – das **erste Konto wird automatisch Admin**.
3. Profil → **Quellen** → Netflix/Prime/Max importieren, oder Profil → **Trakt.tv** → „Mit Trakt verbinden“.
4. Wenn nur du die App nutzen sollst: danach in Render `ALLOW_REGISTRATION` = `false` setzen.

Kontrolle: `https://<dein-service>.onrender.com/healthz` muss `{"ok":true}` liefern. Fehlt `DATABASE_URL` oder ist
die Datenbank nicht erreichbar, zeigt die App statt eines Absturzes eine Setup-Seite mit dem genauen Problem.
Ob TMDB und Trakt erkannt wurden, siehst du als Admin unter **Admin → System**.

## 5. Wichtig für den Dauerbetrieb

- **Datenbank-Plan**: Die kostenlose Render-Postgres wird nach **30 Tagen gelöscht**. Für dauerhafte Daten unter
  **watchlfy-db → Settings → Instance Type** auf **Basic-256mb** (oder größer) wechseln. Vorher als Admin unter
  **Admin → Backup** eine Sicherung herunterladen.
- **Web-Service-Plan „Free“** schläft nach 15 Minuten ohne Aufruf ein. Watchlfy pingt sich selbst alle 10 Minuten
  an (`KEEP_ALIVE`, automatisch an), Render begrenzt Free-Instanzen aber auf 750 Stunden pro Monat. Für Trakt-Sync
  rund um die Uhr ist **Starter** zuverlässiger.
- **Region**: Datenbank und Web-Service müssen in derselben Region liegen (Blueprint: Frankfurt), sonst funktioniert
  die interne Datenbank-URL nicht.

## Optionale Variablen

| Variable | Standard | Wirkung |
|---|---|---|
| `ALLOW_REGISTRATION` | `true` | `false` sperrt neue Registrierungen |
| `REGISTER_LIMIT` | `10` | neue Konten pro IP in 15 Minuten |
| `SYNC_INTERVAL_MINUTES` | `30` | Takt für Trakt-Sync und TMDB-Nachladen (min. 5) |
| `MAX_UPLOAD_MB` | `60` | größte Import-Datei |
| `TMDB_LANGUAGE` | `de-DE` | Sprache der TMDB-Daten |
| `TMDB_REGION` | `DE` | Land für „Wo läuft das?“ – ordnet Trakt-Einträge dem Abo-Dienst zu (Netflix, Prime, Disney+, Max, WOW, Apple) |
| `TRAKT_REDIRECT_URI` | aus `RENDER_EXTERNAL_URL` | nur bei eigener Domain nötig |
| `TRAKT_USER_AGENT` | `Watchlfy/1.0 (self-hosted watch statistics)` | Kennung gegenüber Trakt; ohne eigenen User-Agent blockt Trakt mit 403 |
| `MUSIC_PREVIEWS` | `true` | Filmmusik im Rückblick (Hörproben über die iTunes-Suche); `false` schaltet sie ab |
| `MUSIC_COUNTRY` | `DE` | Store-Land für die Musiksuche |
| `KEEP_ALIVE` | an (auf Render) | Selbst-Ping gegen Einschlafen |
| `CRON_SECRET` | – | erlaubt externen Anstoß über `/cron/run?key=…` |
| `INTERNAL_SCHEDULER` | `true` | interner Zeitplan an/aus |
| `OPERATOR_PHONE`, `HOSTING_PROVIDER`, `DATABASE_PROVIDER` | – | Zusatzangaben in der Datenschutzerklärung |

## Ohne Blueprint (manuell)

1. **New → PostgreSQL**: Name `watchlfy-db`, Region **Frankfurt**, Version 16 → *Create*. Danach die
   **Internal Database URL** kopieren.
2. **New → Web Service** → Repository wählen:
   - Runtime **Node**, Region **Frankfurt**, Branch `main`
   - Build Command `npm install --omit=dev`
   - Start Command `npm start`
   - Health Check Path `/healthz` (unter *Advanced*)
3. **Environment**: `NODE_VERSION=22`, `DATABASE_URL=<Internal Database URL>`, `SESSION_SECRET=<langer Zufallswert>`,
   `TIMEZONE=Europe/Berlin` sowie TMDB/Trakt/Betreiber wie oben.
