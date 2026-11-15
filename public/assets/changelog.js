/* Watchlfy – Neuigkeiten („Neu in Watchlfy“).
   Bei JEDER sichtbaren Änderung hier oben einen neuen Eintrag ergänzen (neueste zuerst):
   - id: eindeutig und aufsteigend (Datum + Buchstabe), date: 'YYYY-MM-DD'
   - items: höchstens 4–5 kurze Punkte, je Icon, Titel (t) und ein knapper Satz (d) in allen 7 Sprachen
     [de, en, fr, es, it, sv, da]; optional go: Bereich zum Ausprobieren
     ('overview', 'top', 'times', 'progress', 'history', 'wrapped', 'friends', 'collection', 'profile', 'import').
   Danach den Cache-Parameter ?v=… in public/*.html hochzählen. */
window.WatchlfyNews = [
  {
    id: '2026-11-15f',
    date: '2026-11-15',
    items: [
      {
        icon: '💎', go: 'collection',
        t: ['Seltenheit nach Ruhm, Umsatz und Bewertung', 'Rarity by fame, box office and rating', 'Rareté selon notoriété, recettes et note', 'Rareza según fama, taquilla y valoración', 'Rarità per notorietà, incassi e voto', 'Sällsynthet efter kändhet, intäkter och betyg', 'Sjældenhed efter kendthed, indtægter og bedømmelse'],
        d: ['Je bekannter, erfolgreicher und besser bewertet ein Titel, desto seltener die Ausgabe – mit Sammlerwert im Stück.', 'The more famous, successful and highly rated a title, the rarer its edition – with a collector value on each piece.', 'Plus un titre est connu, rentable et bien noté, plus l’édition est rare – avec une valeur de collection.', 'Cuanto más famoso, taquillero y valorado, más rara la edición, con valor de colección en cada pieza.', 'Più un titolo è noto, redditizio e votato, più rara è l’edizione – con valore da collezione.', 'Ju mer känd, lönsam och högt betygsatt en titel är, desto ovanligare utgåva – med samlarvärde.', 'Jo mere kendt, indbringende og velbedømt en titel er, desto sjældnere udgave – med samlerværdi.'],
      },
      {
        icon: '🔁', go: 'collection',
        t: ['Videothek mit Gedächtnis', 'A video store that remembers', 'Un vidéoclub qui se souvient', 'Un videoclub con memoria', 'Una videoteca che ricorda', 'En videobutik som minns', 'En videobutik der husker'],
        d: ['Gekauftes kommt nie wieder ins Regal, Liegengelassenes erst nach einer Pause.', 'Bought items never return to the shelf, skipped ones only after a break.', 'Ce qui est acheté ne revient jamais, le reste seulement après une pause.', 'Lo comprado nunca vuelve; lo demás, solo tras una pausa.', 'Ciò che compri non torna più, il resto solo dopo una pausa.', 'Köpt kommer aldrig tillbaka, resten först efter en paus.', 'Det købte kommer aldrig igen, resten først efter en pause.'],
      },
    ],
  },
  {
    id: '2026-11-15e',
    date: '2026-11-15',
    items: [
      {
        icon: '🔄', go: 'profile',
        t: ['Trakt findet nachgetragene Historie', 'Trakt finds back-filled history', 'Trakt trouve l’historique ajouté après coup', 'Trakt encuentra el historial añadido después', 'Trakt trova la cronologia aggiunta dopo', 'Trakt hittar efterregistrerad historik', 'Trakt finder eftertilføjet historik'],
        d: ['Was der Trakt Streaming Scrobbler nachträglich einträgt, kommt jetzt an. Beim Abgleichen dreht sich das Symbol.', 'Whatever Trakt’s Streaming Scrobbler adds later now arrives. The icon spins while syncing.', 'Ce que le Streaming Scrobbler de Trakt ajoute après coup arrive désormais. L’icône tourne pendant la synchro.', 'Lo que el Streaming Scrobbler de Trakt añade después ahora llega. El icono gira al sincronizar.', 'Ciò che lo Streaming Scrobbler di Trakt aggiunge dopo ora arriva. L’icona gira durante la sincronizzazione.', 'Det som Trakts Streaming Scrobbler lägger till i efterhand kommer nu fram. Ikonen snurrar vid synk.', 'Det, Trakts Streaming Scrobbler tilføjer bagefter, kommer nu frem. Ikonet drejer under synk.'],
      },
    ],
  },
  {
    id: '2026-11-15d',
    date: '2026-11-15',
    items: [
      {
        icon: '🗂️', go: 'history',
        t: ['Kompaktere Verläufe', 'More compact histories', 'Historiques plus compacts', 'Historiales más compactos', 'Cronologie più compatte', 'Kompaktare historik', 'Mere kompakte historik'],
        d: ['Tage im Monat, Staffeln im Titel, Importe und Anmeldungen klappen jetzt auf – erst das Wichtigste, der Rest auf Tipp.', 'Days in a month, seasons of a title, imports and sign-ins now fold out – the essentials first, the rest on tap.', 'Jours du mois, saisons d’un titre, imports et connexions se déplient : l’essentiel d’abord, le reste d’un geste.', 'Días del mes, temporadas de un título, importaciones e inicios de sesión se despliegan: primero lo esencial, el resto con un toque.', 'Giorni del mese, stagioni di un titolo, importazioni e accessi ora si espandono: prima l’essenziale, il resto con un tocco.', 'Dagar i månaden, säsonger, importer och inloggningar fälls nu ut – det viktigaste först, resten med ett tryck.', 'Dage i måneden, sæsoner, importer og logins foldes nu ud – det vigtigste først, resten med et tryk.'],
      },
    ],
  },
  {
    id: '2026-11-15c',
    date: '2026-11-15',
    items: [
      {
        icon: '🪐', go: 'overview',
        t: ['Orbit: futuristisches Design', 'Orbit: a futuristic look', 'Orbit : un look futuriste', 'Orbit: diseño futurista', 'Orbit: design futuristico', 'Orbit: futuristisk design', 'Orbit: futuristisk design'],
        d: ['Glas, Neonlicht, Raster am Horizont und ein animiertes 3D-Logo mit Orbit-Ring.', 'Glass, neon light, a horizon grid and an animated 3D logo with an orbit ring.', 'Verre, néons, grille à l’horizon et logo 3D animé avec anneau orbital.', 'Cristal, neón, cuadrícula en el horizonte y un logo 3D animado con anillo orbital.', 'Vetro, neon, griglia all’orizzonte e un logo 3D animato con anello orbitale.', 'Glas, neonljus, rutnät mot horisonten och en animerad 3D-logga med omloppsring.', 'Glas, neonlys, gitter mod horisonten og et animeret 3D-logo med kredsløbsring.'],
      },
      {
        icon: '🛸', go: 'collection',
        t: ['Holo-Lounge für deine Sammlung', 'Holo lounge for your collection', 'Holo-salon pour ta collection', 'Holo-salón para tu colección', 'Holo-lounge per la tua collezione', 'Holo-lounge för din samling', 'Holo-lounge til din samling'],
        d: ['Poster materialisieren als Hologramme, Hüllen stehen in 3D im Glasregal, der OLED-Fernseher leuchtet mit Ambilight.', 'Posters materialise as holograms, cases stand in 3D on a glass rack, the OLED TV glows with ambient light.', 'Les affiches apparaissent en hologrammes, les boîtiers en 3D sur une étagère en verre, la TV OLED rayonne.', 'Los pósters se materializan como hologramas, las cajas en 3D en una estantería de cristal y la tele OLED brilla.', 'I poster si materializzano come ologrammi, le custodie in 3D su uno scaffale di vetro, la TV OLED si illumina.', 'Affischer blir hologram, fodral står i 3D på en glashylla och OLED-tv:n lyser.', 'Plakater bliver til hologrammer, covers står i 3D på en glashylde, og OLED-tv’et lyser.'],
      },
    ],
  },
  {
    id: '2026-11-15b',
    date: '2026-11-15',
    items: [
      {
        icon: '📺', go: 'overview',
        t: ['Umschalten wie am Fernseher', 'Switch like on a TV', 'Zapper comme à la télé', 'Cambia como en la tele', 'Cambia come in TV', 'Byt som på tv:n', 'Skift som på tv’et'],
        d: ['Kanaltasten (auch 1–9 auf der Tastatur) und am Handy ein Zapper mit Programmführer.', 'Channel keys (also 1–9 on the keyboard) and a zapper with TV guide on your phone.', 'Touches de chaîne (aussi 1–9 au clavier) et un zappeur avec programme sur mobile.', 'Teclas de canal (también 1–9 en el teclado) y un zapeador con guía en el móvil.', 'Tasti canale (anche 1–9 da tastiera) e uno zapper con guida sul telefono.', 'Kanalknappar (även 1–9 på tangentbordet) och en zapper med tablå på mobilen.', 'Kanaltaster (også 1–9 på tastaturet) og en zapper med programoversigt på mobilen.'],
      },
      {
        icon: '🎞️', go: 'collection',
        t: ['Neue Währung', 'New currency', 'Nouvelle monnaie', 'Nueva moneda', 'Nuova valuta', 'Ny valuta', 'Ny valuta'],
        d: ['Bezahlt wird jetzt mit Filmmetern (wachsen mit jeder geschauten Stunde) und Goldtickets.', 'You now pay with film metres (they grow with every hour watched) and golden tickets.', 'On paie désormais en mètres de pellicule (ils augmentent à chaque heure regardée) et en tickets dorés.', 'Ahora se paga con metros de película (crecen con cada hora vista) y entradas doradas.', 'Ora si paga con metri di pellicola (crescono a ogni ora guardata) e biglietti d’oro.', 'Nu betalar du med filmmeter (växer med varje sedd timme) och guldbiljetter.', 'Nu betaler du med filmmeter (vokser med hver set time) og guldbilletter.'],
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
