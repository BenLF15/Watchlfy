# Hinweise für Claude

- **Bei jeder sichtbaren Änderung an der App** einen neuen Eintrag oben in `public/assets/changelog.js` ergänzen
  (neue, aufsteigende `id`, heutiges `date`, 1–4 kurze Punkte mit Icon, Titel `t` und einem knappen Satz `d`
  in allen 7 Sprachen [de, en, fr, es, it, sv, da], optional `go` zum Ausprobieren). Nutzer sehen das beim
  nächsten Öffnen einmalig als Pop-up „Neu in Watchlfy“. Reine Bugfixes/Interna ohne sichtbare Wirkung brauchen keinen Eintrag.
- Danach den Cache-Parameter `?v=…` in `public/*.html` hochzählen (alle Vorkommen), damit Browser die neuen Dateien laden.
- Neue UI-Texte immer in `public/assets/i18n.js` in allen 7 Sprachen anlegen. `npm test` prüft, dass jeder im
  Frontend verwendete Schlüssel existiert.
- Secrets nur über Umgebungsvariablen (`DATABASE_URL`, `TMDB_API_KEY`, `TRAKT_CLIENT_ID`, `TRAKT_CLIENT_SECRET`,
  `SESSION_SECRET`). Niemals Passwörter, Hashes, Tokens oder echte Exportdateien committen.
- CSP ist streng (`script-src 'self'`, keine Inline-Handler, `img-src 'self' data: blob:`). Externe Bilder (TMDB)
  laufen über `/img/tmdb/:size/:file`.
- Tests: `npm test` (Parser, i18n) und `npm run test:e2e` (Playwright, Handy + Desktop, gegen `tests/mock-server.js`
  statt echter TMDB/Trakt-API). Neue Funktionen bekommen einen E2E-Test; Screenshots in `tests/.screens/` ansehen.
- Import-Formate der Dienste können sich ändern: Spaltennamen nie fest verdrahten, sondern über `src/parse/detect.js`
  (Synonyme + Inhaltsprüfung) erkennen; der Spalten-Zuordnungs-Dialog ist der Fallback.
