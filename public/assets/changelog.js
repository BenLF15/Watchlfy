/* Watchlfy – Neuigkeiten („Neu in Watchlfy“).
   Bei JEDER sichtbaren Änderung hier oben einen neuen Eintrag ergänzen (neueste zuerst):
   - id: eindeutig und aufsteigend (Datum + Buchstabe), date: 'YYYY-MM-DD'
   - items: höchstens 4–5 kurze Punkte, je Icon, Titel (t) und ein knapper Satz (d) in allen 7 Sprachen
     [de, en, fr, es, it, sv, da]; optional go: Bereich zum Ausprobieren
     ('overview', 'top', 'times', 'progress', 'history', 'wrapped', 'friends', 'collection', 'profile', 'import').
   Danach den Cache-Parameter ?v=… in public/*.html hochzählen. */
window.WatchlfyNews = [
  {
    id: '2026-11-14a',
    date: '2026-11-14',
    items: [
      {
        icon: '🍿', go: 'import',
        t: ['Watchlfy ist da', 'Watchlfy is here', 'Watchlfy est là', 'Llega Watchlfy', 'Ecco Watchlfy', 'Watchlfy är här', 'Watchlfy er her'],
        d: ['Netflix-Verlauf importieren und sofort Schauzeit, Top-Serien und Lieblingszeiten sehen.', 'Import your Netflix history and instantly see watch time, top series and favourite times.', 'Importe ton historique Netflix et vois aussitôt ton temps, tes séries et tes horaires préférés.', 'Importa tu historial de Netflix y ve al instante tu tiempo, tus series y horarios favoritos.', 'Importa la cronologia Netflix e vedi subito tempo, serie top e orari preferiti.', 'Importera din Netflix-historik och se direkt tittartid, toppserier och favorittider.', 'Importér din Netflix-historik og se straks seertid, topserier og yndlingstider.'],
      },
      {
        icon: '🎞️', go: 'top',
        t: ['Poster & Laufzeiten von TMDB', 'Posters & runtimes from TMDB', 'Affiches et durées TMDB', 'Pósteres y duraciones de TMDB', 'Locandine e durate da TMDB', 'Affischer & speltider från TMDB', 'Plakater & spilletider fra TMDB'],
        d: ['Titel werden automatisch erkannt; unsichere Treffer korrigierst du mit einem Tipp.', 'Titles are matched automatically; fix uncertain matches with one tap.', 'Les titres sont reconnus automatiquement ; corrige les doutes d’un geste.', 'Los títulos se reconocen solos; corrige los dudosos con un toque.', 'I titoli vengono riconosciuti da soli; correggi quelli incerti con un tocco.', 'Titlar känns igen automatiskt; rätta osäkra träffar med ett tryck.', 'Titler genkendes automatisk; ret usikre match med ét tryk.'],
      },
    ],
  },
];
