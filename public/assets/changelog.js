/* Watchlfy – Neuigkeiten („Neu in Watchlfy“).
   Bei JEDER sichtbaren Änderung hier oben einen neuen Eintrag ergänzen (neueste zuerst):
   - id: eindeutig und aufsteigend (Datum + Buchstabe), date: 'YYYY-MM-DD'
   - items: höchstens 4–5 kurze Punkte, je Icon, Titel (t) und ein knapper Satz (d) in allen 7 Sprachen
     [de, en, fr, es, it, sv, da]; optional go: Bereich zum Ausprobieren
     ('overview', 'top', 'times', 'progress', 'history', 'wrapped', 'friends', 'collection', 'profile', 'import').
   Danach den Cache-Parameter ?v=… in public/*.html hochzählen. */
window.WatchlfyNews = [
  {
    id: '2026-11-14c',
    date: '2026-11-14',
    items: [
      {
        icon: '🎬', go: 'overview',
        t: ['Neuer Kino-Look', 'New cinema look', 'Nouveau look cinéma', 'Nuevo aspecto de cine', 'Nuovo look da cinema', 'Ny biolook', 'Nyt biograflook'],
        d: ['Großes Titelbild mit wechselnden Highlights, Top-10-Reihen und Breitbild-Kacheln zum Weiterschauen.', 'A big hero with rotating highlights, top 10 rows and widescreen tiles to continue watching.', 'Grande affiche avec temps forts, top 10 et vignettes larges pour reprendre.', 'Gran portada con destacados, filas top 10 y miniaturas panorámicas para seguir viendo.', 'Grande copertina con highlight, top 10 e riquadri panoramici per continuare.', 'Stor toppbild med höjdpunkter, topp 10-rader och breda rutor för att fortsätta titta.', 'Stort topbillede med højdepunkter, top 10-rækker og brede felter til at fortsætte.'],
      },
      {
        icon: '✨', go: 'top',
        t: ['Weichere Übergänge', 'Smoother transitions', 'Transitions plus douces', 'Transiciones más suaves', 'Transizioni più morbide', 'Mjukare övergångar', 'Blødere overgange'],
        d: ['Poster gleiten in die Detailansicht, Bilder blenden sanft ein, die Leiste wird beim Scrollen zu Glas.', 'Posters glide into the detail view, images fade in and the bar turns to glass as you scroll.', 'Les affiches glissent vers le détail, les images apparaissent en fondu, la barre devient verre au défilement.', 'Los pósteres se deslizan al detalle, las imágenes aparecen suavemente y la barra se vuelve de cristal.', 'Le locandine scivolano nel dettaglio, le immagini appaiono dolcemente e la barra diventa vetro.', 'Affischer glider in i detaljvyn, bilder tonas in och fältet blir glas när du scrollar.', 'Plakater glider ind i detaljevisningen, billeder toner ind, og bjælken bliver til glas, når du scroller.'],
      },
    ],
  },
  {
    id: '2026-11-14b',
    date: '2026-11-14',
    items: [
      {
        icon: '📼', go: 'collection',
        t: ['Begehbare Videothek', 'Walk-in video store', 'Vidéoclub à visiter', 'Videoclub para recorrer', 'Videoteca da visitare', 'Videobutik att gå in i', 'Videobutik du kan gå ind i'],
        d: ['Sammle DVDs, Blu-rays und Filmplakate deiner Serien – vom Steelbook bis zur holografischen Ausgabe.', 'Collect DVDs, Blu-rays and posters of your series – from steelbooks to holographic editions.', 'Collectionne DVD, Blu-ray et affiches – du steelbook à l’édition holographique.', 'Colecciona DVD, Blu-ray y pósteres, del steelbook a la edición holográfica.', 'Colleziona DVD, Blu-ray e locandine – dallo steelbook all’edizione olografica.', 'Samla dvd, Blu-ray och affischer – från steelbook till holografisk utgåva.', 'Saml dvd’er, Blu-rays og plakater – fra steelbook til holografisk udgave.'],
      },
      {
        icon: '📽️', go: 'collection',
        t: ['Vorführraum-Quiz', 'Screening room quiz', 'Quiz de projection', 'Quiz de proyección', 'Quiz in sala', 'Visningsquiz', 'Biografquiz'],
        d: ['Erkenne Titel am unscharfen Standbild – je früher, desto mehr Noten.', 'Guess titles from a blurry still – the earlier, the more notes.', 'Devine les titres sur une image floue – plus tôt, plus de notes.', 'Adivina títulos en una imagen borrosa: cuanto antes, más notas.', 'Indovina i titoli da un fotogramma sfocato – prima indovini, più note.', 'Gissa titlar från en suddig stillbild – ju tidigare, desto fler noter.', 'Gæt titler fra et sløret stillbillede – jo før, jo flere noder.'],
      },
      {
        icon: '🎬', go: 'wrapped',
        t: ['Dein Jahr in Serien', 'Your year in series', 'Ton année en séries', 'Tu año en series', 'Il tuo anno in serie', 'Ditt år i serier', 'Dit år i serier'],
        d: ['Rückblick als Story im Vollbild – wischen zum Schließen.', 'Year in review as a full-screen story – swipe to close.', 'Rétrospective en story plein écran – balaie pour fermer.', 'Resumen en historia a pantalla completa; desliza para cerrar.', 'Riepilogo come storia a schermo intero – scorri per chiudere.', 'Återblick som helskärmsstory – svep för att stänga.', 'Tilbageblik som fuldskærmsstory – swipe for at lukke.'],
      },
      {
        icon: '🔗', go: 'profile',
        t: ['Trakt & Freunde', 'Trakt & friends', 'Trakt & amis', 'Trakt y amigos', 'Trakt e amici', 'Trakt & vänner', 'Trakt & venner'],
        d: ['Automatisch synchronisieren, „Läuft gerade“ sehen und Geschmack mit Freunden vergleichen.', 'Sync automatically, see what’s playing and compare taste with friends.', 'Synchro automatique, « en cours » et comparaison avec tes amis.', 'Sincroniza solo, ve qué se reproduce y compara gustos con amigos.', 'Sincronizza da solo, vedi cosa guardi e confronta i gusti con gli amici.', 'Synka automatiskt, se vad som spelas och jämför smak med vänner.', 'Synkroniser automatisk, se hvad der spiller, og sammenlign smag med venner.'],
      },
    ],
  },
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
