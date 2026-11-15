/* Watchlfy – Neuigkeiten („Neu in Watchlfy“).
   Bei JEDER sichtbaren Änderung hier oben einen neuen Eintrag ergänzen (neueste zuerst):
   - id: eindeutig und aufsteigend (Datum + Buchstabe), date: 'YYYY-MM-DD'
   - items: höchstens 4–5 kurze Punkte, je Icon, Titel (t) und ein knapper Satz (d) in allen 7 Sprachen
     [de, en, fr, es, it, sv, da]; optional go: Bereich zum Ausprobieren
     ('overview', 'top', 'times', 'progress', 'history', 'wrapped', 'friends', 'collection', 'profile', 'import').
   Danach den Cache-Parameter ?v=… in public/*.html hochzählen. */
window.WatchlfyNews = [
  {
    id: '2026-11-15b',
    date: '2026-11-15',
    items: [
      {
        icon: '📺', go: 'overview',
        t: ['Neues Gesicht: Kanal-Design', 'New look: channel design', 'Nouveau look : design chaînes', 'Nuevo aspecto: diseño de canales', 'Nuovo look: design a canali', 'Ny look: kanaldesign', 'Nyt look: kanaldesign'],
        d: ['Neues Logo, Röhrenfernseher, Fernbedienung zum Umschalten (Tasten 1–9) und am Handy ein Zapper mit Programmführer.', 'New logo, a tube TV, a remote to switch channels (keys 1–9) and a zapper with TV guide on your phone.', 'Nouveau logo, téléviseur cathodique, télécommande (touches 1–9) et zappeur avec programme sur mobile.', 'Nuevo logo, televisor de tubo, mando para cambiar de canal (teclas 1–9) y zapeador con guía en el móvil.', 'Nuovo logo, TV a tubo, telecomando per cambiare canale (tasti 1–9) e zapper con guida sul telefono.', 'Ny logga, tjock-tv, fjärrkontroll för att byta kanal (tangent 1–9) och zapper med tablå på mobilen.', 'Nyt logo, billedrørs-tv, fjernbetjening til at skifte kanal (tast 1–9) og zapper med programoversigt på mobilen.'],
      },
      {
        icon: '🎞️', go: 'collection',
        t: ['Wohnzimmer & neue Währung', 'Living room & new currency', 'Salon & nouvelle monnaie', 'Salón y nueva moneda', 'Soggiorno e nuova valuta', 'Vardagsrum & ny valuta', 'Stue & ny valuta'],
        d: ['Poster an der Wand, Hüllen im Fernsehschrank, zappen am Fernseher. Bezahlt wird mit Filmmetern und Goldtickets.', 'Posters on the wall, cases in the TV cabinet, zap through the TV. You pay with film metres and golden tickets.', 'Affiches au mur, boîtiers dans le meuble TV, zapping sur le téléviseur. On paie en mètres de pellicule et tickets dorés.', 'Pósters en la pared, cajas en el mueble de la tele y zapeo en el televisor. Se paga con metros de película y entradas doradas.', 'Poster al muro, custodie nel mobile TV, zapping sulla TV. Si paga con metri di pellicola e biglietti d’oro.', 'Affischer på väggen, fodral i tv-bänken, zappa på tv:n. Du betalar med filmmeter och guldbiljetter.', 'Plakater på væggen, covers i tv-skabet, zap på tv’et. Du betaler med filmmeter og guldbilletter.'],
      },
      {
        icon: '🎵', go: 'wrapped',
        t: ['Rückblick mit Filmmusik', 'Review with film music', 'Rétrospective en musique', 'Resumen con música de cine', 'Riepilogo con colonna sonora', 'Återblick med filmmusik', 'Tilbageblik med filmmusik'],
        d: ['Zu jeder passenden Folie läuft der Soundtrack – mit einem Tipp stumm.', 'Each matching slide plays its soundtrack – mute it with one tap.', 'Chaque diapo adaptée joue sa bande originale – coupe-la d’un geste.', 'Cada diapositiva adecuada suena con su banda sonora; se silencia con un toque.', 'Ogni slide adatta ha la sua colonna sonora – disattivala con un tocco.', 'Varje passande bild spelar sitt soundtrack – stäng av med ett tryck.', 'Hvert passende dias spiller sit soundtrack – slå det fra med et tryk.'],
      },
      {
        icon: '🗂️', go: 'history',
        t: ['Aufgeräumter Verlauf', 'Tidier history', 'Historique plus clair', 'Historial más ordenado', 'Cronologia più ordinata', 'Snyggare historik', 'Mere overskuelig historik'],
        d: ['Letzte Woche, danach Monate zum Aufklappen. Im Fortschritt zuerst nur die Top 5.', 'Last week, then months to expand. Progress shows the top 5 first.', 'La semaine passée, puis les mois à déplier. La progression montre d’abord le top 5.', 'La última semana y luego meses desplegables. El progreso muestra primero el top 5.', 'L’ultima settimana, poi i mesi da espandere. Il progresso mostra prima la top 5.', 'Senaste veckan, sedan månader att fälla ut. Framsteg visar först topp 5.', 'Sidste uge, derefter måneder at folde ud. Fremskridt viser først top 5.'],
      },
    ],
  },
  {
    id: '2026-11-15a',
    date: '2026-11-15',
    items: [
      {
        icon: '🎞️', go: 'overview',
        t: ['Willkommen im Lichtspielhaus', 'Welcome to the picture house', 'Bienvenue au cinéma', 'Bienvenido al cine', 'Benvenuto al cinema', 'Välkommen till biografen', 'Velkommen i biografen'],
        d: ['Komplett neues Design: Leinwand mit Projektorlicht, Kennzahlen als Eintrittskarten, Reihen auf dem Filmstreifen.', 'A brand-new design: a screen with projector light, stats as tickets, rows on a film strip.', 'Design entièrement nouveau : écran et lumière de projecteur, chiffres en tickets, rangées sur pellicule.', 'Diseño totalmente nuevo: pantalla con luz de proyector, cifras como entradas y filas en película.', 'Design tutto nuovo: schermo con luce del proiettore, numeri come biglietti, file su pellicola.', 'Helt ny design: duk med projektorljus, siffror som biljetter, rader på filmremsa.', 'Helt nyt design: lærred med projektorlys, tal som billetter, rækker på filmstrimmel.'],
      },
      {
        icon: '💺', go: 'times',
        t: ['Sitzplan & Kinocharts', 'Seating chart & box office', 'Plan de salle & box-office', 'Plano de butacas y taquilla', 'Mappa dei posti e classifica', 'Platskarta & topplista', 'Pladsoversigt & hitliste'],
        d: ['Deine Schauzeiten als Kinosaal, deine Top 10 mit leuchtenden Rangschildern.', 'Your watch times as a cinema hall, your top 10 with glowing rank signs.', 'Tes horaires en salle de cinéma, ton top 10 avec des numéros lumineux.', 'Tus horarios como sala de cine y tu top 10 con números luminosos.', 'I tuoi orari come una sala, la top 10 con numeri luminosi.', 'Dina tittartider som en biosalong, topp 10 med lysande skyltar.', 'Dine seertider som en biografsal, top 10 med lysende skilte.'],
      },
      {
        icon: '➕', go: 'import',
        t: ['Import immer griffbereit', 'Import always at hand', 'Import toujours à portée', 'Importar siempre a mano', 'Importa sempre a portata', 'Import alltid nära', 'Import altid lige ved hånden'],
        d: ['In der Seitenleiste oder mitten im Dock auf dem Handy.', 'In the sidebar, or right in the middle of the dock on your phone.', 'Dans la barre latérale ou au centre du dock sur mobile.', 'En la barra lateral o en el centro del dock en el móvil.', 'Nella barra laterale o al centro del dock sul telefono.', 'I sidofältet eller mitt i dockan på mobilen.', 'I sidebjælken eller midt i docken på mobilen.'],
      },
    ],
  },
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
