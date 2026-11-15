/* Watchlfy – Übersetzungen (de, en, fr, es, it, sv, da).
   Jeder Eintrag: [de, en, fr, es, it, sv, da]. Platzhalter: {name}. Neue Texte immer in allen 7 Sprachen anlegen. */
(() => {
  'use strict';
  const LANGS = ['de', 'en', 'fr', 'es', 'it', 'sv', 'da'];
  const NAMES = { de: 'Deutsch', en: 'English', fr: 'Français', es: 'Español', it: 'Italiano', sv: 'Svenska', da: 'Dansk' };
  const LOCALES = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR', es: 'es-ES', it: 'it-IT', sv: 'sv-SE', da: 'da-DK' };

  const D = {
    // ------------------------------------------------------------ account
    'account.birthday': ['Geburtstag', 'Birthday', 'Anniversaire', 'Cumpleaños', 'Compleanno', 'Födelsedag', 'Fødselsdag'],
    'account.birthdaySaved': ['Geburtstag gespeichert.', 'Birthday saved.', 'Anniversaire enregistré.', 'Cumpleaños guardado.', 'Compleanno salvato.', 'Födelsedag sparad.', 'Fødselsdag gemt.'],
    'account.deleteConfirm': ['Konto mit allen Daten unwiderruflich löschen?', 'Permanently delete your account and all data?', 'Supprimer définitivement le compte et toutes les données ?', '¿Borrar para siempre la cuenta y todos los datos?', 'Eliminare definitivamente account e dati?', 'Radera kontot och alla data permanent?', 'Slet kontoen og alle data permanent?'],
    'account.since': ['Mitglied seit', 'Member since', 'Membre depuis', 'Miembro desde', 'Membro dal', 'Medlem sedan', 'Medlem siden'],
    'account.sub': ['Dein Watchlfy-Konto', 'Your Watchlfy account', 'Ton compte Watchlfy', 'Tu cuenta de Watchlfy', 'Il tuo account Watchlfy', 'Ditt Watchlfy-konto', 'Din Watchlfy-konto'],
    'account.title': ['Konto', 'Account', 'Compte', 'Cuenta', 'Account', 'Konto', 'Konto'],
    'account.username': ['Benutzername', 'Username', 'Nom d’utilisateur', 'Usuario', 'Nome utente', 'Användarnamn', 'Brugernavn'],

    // ------------------------------------------------------------ admin
    'admin.accounts': ['Konten', 'Accounts', 'Comptes', 'Cuentas', 'Account', 'Konton', 'Konti'],
    'admin.accountsSub': ['Alle registrierten Konten mit Quellen und Einträgen', 'All registered accounts with sources and entries', 'Tous les comptes avec sources et entrées', 'Todas las cuentas con fuentes y entradas', 'Tutti gli account con fonti e voci', 'Alla konton med källor och poster', 'Alle konti med kilder og poster'],
    'admin.active': ['Aktiv (7 Tage)', 'Active (7 days)', 'Actifs (7 jours)', 'Activos (7 días)', 'Attivi (7 giorni)', 'Aktiva (7 dagar)', 'Aktive (7 dage)'],
    'admin.catalog': ['Katalog', 'Catalogue', 'Catalogue', 'Catálogo', 'Catalogo', 'Katalog', 'Katalog'],
    'admin.catalogLine': ['{t} Titel · {e} Folgen · {p} offen · {u} unsicher', '{t} titles · {e} episodes · {p} pending · {u} uncertain', '{t} titres · {e} épisodes · {p} en attente · {u} incertains', '{t} títulos · {e} episodios · {p} pendientes · {u} dudosos', '{t} titoli · {e} episodi · {p} in attesa · {u} incerti', '{t} titlar · {e} avsnitt · {p} väntar · {u} osäkra', '{t} titler · {e} afsnit · {p} venter · {u} usikre'],
    'admin.csv': ['CSV-Export', 'CSV export', 'Export CSV', 'Exportar CSV', 'Esporta CSV', 'CSV-export', 'CSV-eksport'],
    'admin.date': ['Datum', 'Date', 'Date', 'Fecha', 'Data', 'Datum', 'Dato'],
    'admin.db': ['Datenbank', 'Database', 'Base de données', 'Base de datos', 'Database', 'Databas', 'Database'],
    'admin.deleteConfirm': ['Konto „{u}“ mit allen Daten löschen?', 'Delete account “{u}” with all data?', 'Supprimer le compte « {u} » et ses données ?', '¿Borrar la cuenta «{u}» con sus datos?', 'Eliminare l’account «{u}» con tutti i dati?', 'Radera kontot ”{u}” med alla data?', 'Slet kontoen ”{u}” med alle data?'],
    'admin.festiveShows': ['Festliches Event: {e}', 'Festive event: {e}', 'Événement festif : {e}', 'Evento festivo: {e}', 'Evento festivo: {e}', 'Högtid: {e}', 'Højtid: {e}'],
    'admin.lastLogins': ['Letzte Logins', 'Recent logins', 'Dernières connexions', 'Últimos inicios de sesión', 'Ultimi accessi', 'Senaste inloggningar', 'Seneste logins'],
    'admin.make': ['Zum Admin machen', 'Make admin', 'Nommer admin', 'Hacer admin', 'Rendi admin', 'Gör till admin', 'Gør til admin'],
    'admin.missing': ['fehlt ({v})', 'missing ({v})', 'manquant ({v})', 'falta ({v})', 'mancante ({v})', 'saknas ({v})', 'mangler ({v})'],
    'admin.newPassword': ['Neues Passwort für {u} (nur jetzt sichtbar):', 'New password for {u} (shown only now):', 'Nouveau mot de passe pour {u} (affiché une fois) :', 'Nueva contraseña para {u} (solo ahora):', 'Nuova password per {u} (visibile solo ora):', 'Nytt lösenord för {u} (visas bara nu):', 'Ny adgangskode til {u} (vises kun nu):'],
    'admin.noBirthday': ['Trag zuerst deinen Geburtstag im Profil ein.', 'Enter your birthday in your profile first.', 'Indique d’abord ton anniversaire dans ton profil.', 'Primero añade tu cumpleaños en el perfil.', 'Inserisci prima il tuo compleanno nel profilo.', 'Ange din födelsedag i profilen först.', 'Angiv først din fødselsdag i profilen.'],
    'admin.noErrors': ['Keine Fehler – alles läuft.', 'No errors – all good.', 'Aucune erreur – tout va bien.', 'Sin errores: todo funciona.', 'Nessun errore – tutto ok.', 'Inga fel – allt fungerar.', 'Ingen fejl – alt kører.'],
    'admin.noEvent': ['keines', 'none', 'aucun', 'ninguno', 'nessuno', 'ingen', 'ingen'],
    'admin.resetConfirm': ['Neues Zufallspasswort setzen?', 'Set a new random password?', 'Définir un nouveau mot de passe aléatoire ?', '¿Poner una contraseña aleatoria nueva?', 'Impostare una nuova password casuale?', 'Sätta ett nytt slumpat lösenord?', 'Sæt en ny tilfældig adgangskode?'],
    'admin.resetPw': ['Passwort zurücksetzen', 'Reset password', 'Réinitialiser le mot de passe', 'Restablecer contraseña', 'Reimposta password', 'Återställ lösenord', 'Nulstil adgangskode'],
    'admin.revoke': ['Admin entziehen', 'Revoke admin', 'Retirer admin', 'Quitar admin', 'Revoca admin', 'Ta bort admin', 'Fjern admin'],
    'admin.seasonShows': ['Jahreszeiten-Modus zeigt: {s}', 'Seasons mode shows: {s}', 'Le mode saisons affiche : {s}', 'El modo estaciones muestra: {s}', 'La modalità stagioni mostra: {s}', 'Årstidsläget visar: {s}', 'Årstidstilstand viser: {s}'],
    'admin.sync': ['Zeitplan', 'Schedule', 'Planification', 'Programación', 'Pianificazione', 'Schema', 'Tidsplan'],
    'admin.syncErrors': ['Sync-Fehler', 'Sync errors', 'Erreurs de synchro', 'Errores de sincronización', 'Errori di sincronizzazione', 'Synkfel', 'Synkfejl'],
    'admin.syncLine': ['alle {n} Min. (Trakt + TMDB)', 'every {n} min (Trakt + TMDB)', 'toutes les {n} min (Trakt + TMDB)', 'cada {n} min (Trakt + TMDB)', 'ogni {n} min (Trakt + TMDB)', 'var {n}:e min (Trakt + TMDB)', 'hvert {n}. min. (Trakt + TMDB)'],
    'admin.system': ['System', 'System', 'Système', 'Sistema', 'Sistema', 'System', 'System'],
    'admin.testActive': ['Testdatum aktiv (nur in diesem Browser).', 'Test date active (this browser only).', 'Date de test active (ce navigateur).', 'Fecha de prueba activa (solo este navegador).', 'Data di prova attiva (solo questo browser).', 'Testdatum aktivt (bara i den här webbläsaren).', 'Testdato aktiv (kun i denne browser).'],
    'admin.tester': ['Farbschemas & Events testen', 'Test colour schemes & events', 'Tester thèmes & événements', 'Probar temas y eventos', 'Prova temi ed eventi', 'Testa teman & högtider', 'Test temaer & begivenheder'],
    'admin.testerSub': ['Datum vorgeben, um Jahreszeiten und festliche Events zu prüfen (nur in diesem Browser)', 'Set a date to preview seasons and festive events (this browser only)', 'Choisis une date pour tester saisons et fêtes (ce navigateur uniquement)', 'Elige una fecha para probar estaciones y fiestas (solo este navegador)', 'Imposta una data per provare stagioni e feste (solo questo browser)', 'Ange ett datum för att testa årstider och högtider (endast denna webbläsare)', 'Angiv en dato for at teste årstider og højtider (kun denne browser)'],
    'admin.titles': ['Titel im Katalog', 'Titles in catalogue', 'Titres au catalogue', 'Títulos en catálogo', 'Titoli in catalogo', 'Titlar i katalogen', 'Titler i kataloget'],
    'admin.today': ['Heutiges Datum verwenden', 'Use today’s date', 'Utiliser la date du jour', 'Usar la fecha de hoy', 'Usa la data di oggi', 'Använd dagens datum', 'Brug dagens dato'],
    'admin.todayApplies': ['Es gilt das heutige Datum.', 'Today’s date applies.', 'La date du jour s’applique.', 'Se usa la fecha de hoy.', 'Vale la data di oggi.', 'Dagens datum gäller.', 'Dagens dato gælder.'],
    'admin.tz': ['Zeitzone', 'Time zone', 'Fuseau horaire', 'Zona horaria', 'Fuso orario', 'Tidszon', 'Tidszone'],
    'admin.userLine': ['{v} Einträge · {s} · Login {l}', '{v} entries · {s} · login {l}', '{v} entrées · {s} · connexion {l}', '{v} entradas · {s} · acceso {l}', '{v} voci · {s} · accesso {l}', '{v} poster · {s} · inloggning {l}', '{v} poster · {s} · login {l}'],
    'admin.views': ['Einträge', 'Entries', 'Entrées', 'Entradas', 'Voci', 'Poster', 'Poster'],

    // ------------------------------------------------------------ aria
    'aria.openProfile': ['Profil öffnen', 'Open profile', 'Ouvrir le profil', 'Abrir perfil', 'Apri profilo', 'Öppna profil', 'Åbn profil'],
    'aria.range': ['Zeitraum', 'Time range', 'Période', 'Periodo', 'Periodo', 'Period', 'Periode'],
    'aria.skip': ['Zum Inhalt springen', 'Skip to content', 'Aller au contenu', 'Saltar al contenido', 'Vai al contenuto', 'Hoppa till innehållet', 'Spring til indhold'],
    'aria.toOverview': ['Zur Übersicht', 'Go to overview', 'Vers l’aperçu', 'Ir al resumen', 'Vai alla panoramica', 'Till översikten', 'Til oversigten'],

    // ------------------------------------------------------------ avatar
    'avatar.change': ['Profilbild ändern', 'Change profile picture', 'Changer la photo de profil', 'Cambiar foto de perfil', 'Cambia immagine del profilo', 'Byt profilbild', 'Skift profilbillede'],
    'avatar.fromGallery': ['Foto auswählen', 'Choose a photo', 'Choisir une photo', 'Elegir una foto', 'Scegli una foto', 'Välj ett foto', 'Vælg et foto'],
    'avatar.hint': ['Ziehen zum Verschieben, Regler oder zwei Finger zum Zoomen.', 'Drag to move, use the slider or two fingers to zoom.', 'Glisse pour déplacer, curseur ou deux doigts pour zoomer.', 'Arrastra para mover; usa el control o dos dedos para hacer zoom.', 'Trascina per spostare, cursore o due dita per lo zoom.', 'Dra för att flytta, reglage eller två fingrar för att zooma.', 'Træk for at flytte, skyder eller to fingre for at zoome.'],
    'avatar.invalid': ['Dieses Bild kann nicht geöffnet werden.', 'This picture can’t be opened.', 'Impossible d’ouvrir cette image.', 'No se puede abrir esta imagen.', 'Impossibile aprire questa immagine.', 'Bilden kan inte öppnas.', 'Billedet kan ikke åbnes.'],
    'avatar.menuTitle': ['Profilbild ändern', 'Change profile picture', 'Changer la photo de profil', 'Cambiar foto de perfil', 'Cambia immagine del profilo', 'Byt profilbild', 'Skift profilbillede'],
    'avatar.other': ['Anderes Bild', 'Other picture', 'Autre image', 'Otra imagen', 'Altra immagine', 'Annan bild', 'Andet billede'],
    'avatar.preset': ['Vorlage', 'Preset', 'Modèle', 'Plantilla', 'Modello', 'Mall', 'Skabelon'],
    'avatar.presets': ['Oder eine Vorlage', 'Or pick a preset', 'Ou un modèle', 'O una plantilla', 'Oppure un modello', 'Eller en mall', 'Eller en skabelon'],
    'avatar.remove': ['Entfernen', 'Remove', 'Supprimer', 'Quitar', 'Rimuovi', 'Ta bort', 'Fjern'],
    'avatar.removeConfirm': ['Eigenes Profilbild entfernen?', 'Remove your profile picture?', 'Supprimer ta photo de profil ?', '¿Quitar tu foto de perfil?', 'Rimuovere la foto profilo?', 'Ta bort profilbilden?', 'Fjern dit profilbillede?'],
    'avatar.removed': ['Eigenes Profilbild entfernt.', 'Custom profile picture removed.', 'Photo personnalisée supprimée.', 'Foto personalizada eliminada.', 'Immagine personalizzata rimossa.', 'Egen profilbild borttagen.', 'Eget profilbillede fjernet.'],
    'avatar.save': ['Speichern', 'Save', 'Enregistrer', 'Guardar', 'Salva', 'Spara', 'Gem'],
    'avatar.saved': ['Profilbild gespeichert.', 'Profile picture saved.', 'Photo de profil enregistrée.', 'Foto de perfil guardada.', 'Immagine del profilo salvata.', 'Profilbild sparad.', 'Profilbillede gemt.'],
    'avatar.takePhoto': ['Selfie aufnehmen', 'Take a selfie', 'Prendre un selfie', 'Hacer un selfie', 'Scatta un selfie', 'Ta en selfie', 'Tag en selfie'],
    'avatar.title': ['Profilbild zuschneiden', 'Crop profile picture', 'Recadrer la photo', 'Recortar foto de perfil', 'Ritaglia immagine', 'Beskär profilbild', 'Beskær profilbillede'],
    'avatar.tooBig': ['Das Bild ist zu groß.', 'The picture is too large.', 'L’image est trop grande.', 'La imagen es demasiado grande.', 'L’immagine è troppo grande.', 'Bilden är för stor.', 'Billedet er for stort.'],
    'avatar.useInitial': ['Bild entfernen', 'Remove picture', 'Supprimer la photo', 'Quitar la foto', 'Rimuovi immagine', 'Ta bort bilden', 'Fjern billedet'],
    'avatar.zoom': ['Zoom', 'Zoom', 'Zoom', 'Zoom', 'Zoom', 'Zoom', 'Zoom'],

    // ------------------------------------------------------------ backup
    'backup.download': ['Backup herunterladen', 'Download backup', 'Télécharger la sauvegarde', 'Descargar copia', 'Scarica backup', 'Ladda ner säkerhetskopia', 'Download backup'],
    'backup.last': ['Letztes Backup: {d}', 'Last backup: {d}', 'Dernière sauvegarde : {d}', 'Última copia: {d}', 'Ultimo backup: {d}', 'Senaste backup: {d}', 'Seneste backup: {d}'],
    'backup.never': ['Noch nie ein Backup heruntergeladen', 'No backup downloaded yet', 'Aucune sauvegarde téléchargée', 'Aún no se ha descargado ninguna copia', 'Nessun backup ancora scaricato', 'Ingen säkerhetskopia nedladdad än', 'Ingen backup downloadet endnu'],
    'backup.nothing': ['Nichts Neues gefunden.', 'Nothing new found.', 'Rien de nouveau.', 'Nada nuevo.', 'Niente di nuovo.', 'Inget nytt hittades.', 'Intet nyt fundet.'],
    'backup.restore': ['Backup wiederherstellen', 'Restore backup', 'Restaurer une sauvegarde', 'Restaurar copia', 'Ripristina backup', 'Återställ säkerhetskopia', 'Gendan backup'],
    'backup.restoreConfirm': ['Backup einspielen? Vorhandene Daten bleiben erhalten, fehlende werden ergänzt.', 'Restore this backup? Existing data is kept, missing rows are added.', 'Restaurer cette sauvegarde ? Les données existantes sont conservées.', '¿Restaurar esta copia? Se conservan los datos existentes y se añade lo que falta.', 'Ripristinare il backup? I dati esistenti restano, quelli mancanti vengono aggiunti.', 'Återställa backupen? Befintliga data behålls, saknade läggs till.', 'Gendan backup? Eksisterende data bevares, manglende tilføjes.'],
    'backup.restoring': ['Wird wiederhergestellt …', 'Restoring …', 'Restauration …', 'Restaurando …', 'Ripristino …', 'Återställer …', 'Gendanner …'],
    'backup.sub': ['Komplette Datenbank sichern und wiederherstellen', 'Back up and restore the complete database', 'Sauvegarder et restaurer toute la base de données', 'Guardar y restaurar toda la base de datos', 'Salva e ripristina l’intero database', 'Säkerhetskopiera och återställ hela databasen', 'Tag backup af og gendan hele databasen'],
    'backup.title': ['Backup', 'Backup', 'Sauvegarde', 'Copia de seguridad', 'Backup', 'Säkerhetskopia', 'Backup'],
    'backup.warning': ['Die Datei enthält alle Konten inkl. Passwort-Hashes und Trakt-Tokens – sicher und privat aufbewahren. Wiederherstellen ergänzt nur fehlende Einträge.', 'The file contains all accounts incl. password hashes and Trakt tokens – keep it safe and private. Restoring only adds missing rows.', 'Le fichier contient tous les comptes, hachages de mots de passe et jetons Trakt compris – à garder en sécurité. La restauration n’ajoute que les lignes manquantes.', 'El archivo contiene todas las cuentas, con hashes de contraseñas y tokens de Trakt: guárdalo en privado. Restaurar solo añade lo que falta.', 'Il file contiene tutti gli account con hash delle password e token Trakt: conservalo al sicuro. Il ripristino aggiunge solo le righe mancanti.', 'Filen innehåller alla konton inkl. lösenordshashar och Trakt-tokens – förvara den säkert. Återställning lägger bara till saknade rader.', 'Filen indeholder alle konti inkl. adgangskode-hashes og Trakt-tokens – opbevar den sikkert. Gendannelse tilføjer kun manglende rækker.'],

    // ------------------------------------------------------------ binge
    'binge.inARow': ['Folgen am Stück', 'in a row', 'd’affilée', 'seguidos', 'di fila', 'i rad', 'i træk'],
    'binge.none': ['Noch keine Binge-Session in diesem Zeitraum.', 'No binge session in this period yet.', 'Pas encore de binge sur cette période.', 'Aún no hay maratones en este periodo.', 'Ancora nessuna maratona nel periodo.', 'Ingen maratontittning under perioden ännu.', 'Ingen binge-session i perioden endnu.'],
    'binge.sub': ['Mindestens 3 Folgen einer Serie am Stück (Pause unter 30 Min.)', 'At least 3 episodes of one series in a row (breaks under 30 min)', 'Au moins 3 épisodes d’affilée (pause < 30 min)', 'Al menos 3 episodios seguidos (pausa < 30 min)', 'Almeno 3 episodi di fila (pausa < 30 min)', 'Minst 3 avsnitt i rad (paus under 30 min)', 'Mindst 3 afsnit i træk (pause under 30 min.)'],
    'binge.title': ['Binge-Sessions', 'Binge sessions', 'Sessions binge', 'Maratones', 'Maratone', 'Maratontittningar', 'Binge-sessioner'],

    // ------------------------------------------------------------ btn
    'btn.close': ['Schließen', 'Close', 'Fermer', 'Cerrar', 'Chiudi', 'Stäng', 'Luk'],
    'btn.delete': ['Löschen', 'Delete', 'Supprimer', 'Eliminar', 'Elimina', 'Radera', 'Slet'],
    'btn.deleteAccount': ['Konto & Daten löschen', 'Delete account & data', 'Supprimer compte & données', 'Eliminar cuenta y datos', 'Elimina account e dati', 'Radera konto & data', 'Slet konto & data'],
    'btn.export': ['Meine Daten exportieren', 'Export my data', 'Exporter mes données', 'Exportar mis datos', 'Esporta i miei dati', 'Exportera mina data', 'Eksportér mine data'],
    'btn.import': ['Importieren', 'Import', 'Importer', 'Importar', 'Importa', 'Importera', 'Importér'],
    'btn.later': ['Später', 'Later', 'Plus tard', 'Más tarde', 'Più tardi', 'Senare', 'Senere'],
    'btn.logout': ['Abmelden', 'Log out', 'Se déconnecter', 'Cerrar sesión', 'Esci', 'Logga ut', 'Log ud'],
    'btn.password': ['Passwort ändern', 'Change password', 'Changer le mot de passe', 'Cambiar contraseña', 'Cambia password', 'Byt lösenord', 'Skift adgangskode'],
    'btn.remove': ['Entfernen', 'Remove', 'Retirer', 'Quitar', 'Rimuovi', 'Ta bort', 'Fjern'],
    'btn.save': ['Speichern', 'Save', 'Enregistrer', 'Guardar', 'Salva', 'Spara', 'Gem'],

    // ------------------------------------------------------------ continue
    'continue.next': ['Weiter mit S{s} F{e}', 'Next: S{s} E{e}', 'Suite : S{s} É{e}', 'Sigue: T{s} E{e}', 'Prossimo: S{s} E{e}', 'Nästa: S{s} A{e}', 'Næste: S{s} A{e}'],
    'continue.none': ['Gerade keine offenen Serien.', 'No series in progress right now.', 'Aucune série en cours.', 'Ninguna serie a medias.', 'Nessuna serie in corso.', 'Inga påbörjade serier just nu.', 'Ingen igangværende serier lige nu.'],
    'continue.sub': ['Die nächste Folge deiner angefangenen Serien', 'The next episode of the series you started', 'Le prochain épisode de tes séries en cours', 'El siguiente episodio de tus series empezadas', 'Il prossimo episodio delle serie iniziate', 'Nästa avsnitt i serierna du påbörjat', 'Næste afsnit af de serier, du er i gang med'],
    'continue.title': ['Weiterschauen', 'Continue watching', 'Reprendre', 'Seguir viendo', 'Continua a guardare', 'Fortsätt titta', 'Fortsæt med at se'],

    // ------------------------------------------------------------ detail
    'detail.cast': ['Besetzung', 'Cast', 'Distribution', 'Reparto', 'Cast', 'Rollista', 'Medvirkende'],
    'detail.epRuntime': ['{n} Min. je Folge', '{n} min per episode', '{n} min par épisode', '{n} min por episodio', '{n} min a episodio', '{n} min per avsnitt', '{n} min. pr. afsnit'],
    'detail.episodeViews': ['Folgen-Einträge', 'Episode entries', 'Entrées d’épisodes', 'Entradas de episodios', 'Voci episodi', 'Avsnittsposter', 'Afsnitsposter'],
    'detail.first': ['Zum ersten Mal', 'First time', 'Première fois', 'Primera vez', 'Prima volta', 'Första gången', 'Første gang'],
    'detail.history': ['Dein Verlauf', 'Your history', 'Ton historique', 'Tu historial', 'La tua cronologia', 'Din historik', 'Din historik'],
    'detail.last': ['Zuletzt', 'Last time', 'Dernière fois', 'Última vez', 'Ultima volta', 'Senast', 'Senest'],
    'detail.runtime': ['{n} Min.', '{n} min', '{n} min', '{n} min', '{n} min', '{n} min', '{n} min.'],
    'detail.seasons': ['Staffeln & Folgen', 'Seasons & episodes', 'Saisons & épisodes', 'Temporadas y episodios', 'Stagioni ed episodi', 'Säsonger & avsnitt', 'Sæsoner & afsnit'],
    'detail.total': ['Gesamtzeit', 'Total time', 'Temps total', 'Tiempo total', 'Tempo totale', 'Total tid', 'Samlet tid'],
    'detail.views': ['Mal gesehen', 'Times watched', 'Visionnages', 'Veces vista', 'Visioni', 'Gånger sedd', 'Gange set'],

    // ------------------------------------------------------------ dur
    'dur.dh': ['{d} T {h} Std.', '{d} d {h} h', '{d} j {h} h', '{d} d {h} h', '{d} g {h} h', '{d} d {h} tim', '{d} d {h} t'],
    'dur.h': ['{h} Std.', '{h} h', '{h} h', '{h} h', '{h} h', '{h} tim', '{h} t'],
    'dur.hm': ['{h} Std. {m} Min.', '{h} h {m} min', '{h} h {m} min', '{h} h {m} min', '{h} h {m} min', '{h} tim {m} min', '{h} t {m} min.'],
    'dur.m': ['{m} Min.', '{m} min', '{m} min', '{m} min', '{m} min', '{m} min', '{m} min.'],

    // ------------------------------------------------------------ empty
    'empty.hint': ['Tipp: Mit Trakt.tv (im Profil) aktualisiert sich alles automatisch.', 'Tip: with Trakt.tv (in your profile) everything updates automatically.', 'Astuce : avec Trakt.tv (profil), tout se met à jour automatiquement.', 'Consejo: con Trakt.tv (en el perfil) todo se actualiza solo.', 'Suggerimento: con Trakt.tv (nel profilo) tutto si aggiorna da solo.', 'Tips: med Trakt.tv (i profilen) uppdateras allt automatiskt.', 'Tip: Med Trakt.tv (i profilen) opdateres alt automatisk.'],
    'empty.range': ['Noch keine Daten in diesem Zeitraum.', 'No data in this period yet.', 'Pas encore de données sur cette période.', 'Aún no hay datos en este periodo.', 'Ancora nessun dato in questo periodo.', 'Inga data för perioden ännu.', 'Ingen data i perioden endnu.'],
    'empty.text': ['Lade deinen Verlauf von einem Streamingdienst hoch – Watchlfy macht daraus deine Statistik. Du brauchst nie dein Passwort einzugeben.', 'Upload your history from a streaming service – Watchlfy turns it into your stats. You never have to enter your password.', 'Importe ton historique d’un service de streaming – Watchlfy en fait tes statistiques. Jamais besoin de ton mot de passe.', 'Sube tu historial de un servicio de streaming y Watchlfy lo convierte en estadísticas. Nunca necesitas tu contraseña.', 'Carica la cronologia di un servizio di streaming: Watchlfy la trasforma in statistiche. Non serve mai la password.', 'Ladda upp din historik från en streamingtjänst – Watchlfy gör statistik av den. Du behöver aldrig ange ditt lösenord.', 'Upload din historik fra en streamingtjeneste – Watchlfy laver statistik ud af den. Du skal aldrig indtaste din adgangskode.'],
    'empty.title': ['Willkommen bei Watchlfy!', 'Welcome to Watchlfy!', 'Bienvenue sur Watchlfy !', '¡Bienvenido a Watchlfy!', 'Benvenuto su Watchlfy!', 'Välkommen till Watchlfy!', 'Velkommen til Watchlfy!'],

    // ------------------------------------------------------------ ep
    'ep.e': ['F{n}', 'E{n}', 'É{n}', 'E{n}', 'E{n}', 'A{n}', 'A{n}'],
    'ep.s': ['S{n}', 'S{n}', 'S{n}', 'T{n}', 'S{n}', 'S{n}', 'S{n}'],

    // ------------------------------------------------------------ err
    'err.accountNotFound': ['Konto nicht gefunden.', 'Account not found.', 'Compte introuvable.', 'Cuenta no encontrada.', 'Account non trovato.', 'Kontot hittades inte.', 'Kontoen blev ikke fundet.'],
    'err.adminOnly': ['Nur für Admins.', 'Admins only.', 'Réservé aux admins.', 'Solo para admins.', 'Solo per admin.', 'Endast för admins.', 'Kun for admins.'],
    'err.avatarInvalid': ['Ungültiges Bild.', 'Invalid picture.', 'Image non valide.', 'Imagen no válida.', 'Immagine non valida.', 'Ogiltig bild.', 'Ugyldigt billede.'],
    'err.avatarTooBig': ['Das Bild ist zu groß.', 'The picture is too large.', 'L’image est trop grande.', 'La imagen es demasiado grande.', 'L’immagine è troppo grande.', 'Bilden är för stor.', 'Billedet er for stort.'],
    'err.backupInvalid': ['Das ist keine gültige Watchlfy-Backup-Datei.', 'This is not a valid Watchlfy backup file.', 'Ce n’est pas une sauvegarde Watchlfy valide.', 'No es una copia de seguridad válida de Watchlfy.', 'Non è un backup Watchlfy valido.', 'Det här är ingen giltig Watchlfy-backup.', 'Det er ikke en gyldig Watchlfy-backup.'],
    'err.badCredentials': ['Benutzername oder Passwort ist falsch.', 'Wrong username or password.', 'Nom d’utilisateur ou mot de passe incorrect.', 'Usuario o contraseña incorrectos.', 'Nome utente o password errati.', 'Fel användarnamn eller lösenord.', 'Forkert brugernavn eller adgangskode.'],
    'err.traktNotConnected': ['Trakt ist nicht verbunden.', 'Trakt is not connected.', 'Trakt n’est pas connecté.', 'Trakt no está conectado.', 'Trakt non è collegato.', 'Trakt är inte anslutet.', 'Trakt er ikke forbundet.'],
    'err.importEmpty': ['Die Datei ist leer.', 'The file is empty.', 'Le fichier est vide.', 'El archivo está vacío.', 'Il file è vuoto.', 'Filen är tom.', 'Filen er tom.'],
    'err.importExpired': ['Die Vorschau ist abgelaufen – bitte die Datei erneut wählen.', 'The preview expired – please choose the file again.', 'L’aperçu a expiré – choisis à nouveau le fichier.', 'La vista previa caducó: vuelve a elegir el archivo.', 'Anteprima scaduta – scegli di nuovo il file.', 'Förhandsvisningen har gått ut – välj filen igen.', 'Forhåndsvisningen er udløbet – vælg filen igen.'],
    'err.importMapping': ['Ungültige Spalten-Zuordnung.', 'Invalid column mapping.', 'Association de colonnes invalide.', 'Asignación de columnas no válida.', 'Associazione colonne non valida.', 'Ogiltig kolumnkoppling.', 'Ugyldig kolonnetilknytning.'],
    'err.importNeedTime': ['Bitte eine Zeit- oder Datumsspalte wählen.', 'Please choose a time or date column.', 'Choisis une colonne heure ou date.', 'Elige una columna de hora o fecha.', 'Scegli una colonna ora o data.', 'Välj en tids- eller datumkolumn.', 'Vælg en tids- eller datokolonne.'],
    'err.importNeedTitle': ['Bitte eine Titel- oder Serien-Spalte wählen.', 'Please choose a title or series column.', 'Choisis une colonne titre ou série.', 'Elige una columna de título o serie.', 'Scegli una colonna titolo o serie.', 'Välj en titel- eller seriekolumn.', 'Vælg en titel- eller seriekolonne.'],
    'err.importNoTable': ['In der Datei wurde keine Tabelle gefunden.', 'No table was found in the file.', 'Aucun tableau trouvé dans le fichier.', 'No se encontró ninguna tabla.', 'Nessuna tabella trovata nel file.', 'Ingen tabell hittades i filen.', 'Ingen tabel fundet i filen.'],
    'err.importNothing': ['Keine Einträge zum Importieren.', 'No entries to import.', 'Aucune entrée à importer.', 'No hay entradas para importar.', 'Nessuna voce da importare.', 'Inga poster att importera.', 'Ingen poster at importere.'],
    'err.importSource': ['Unbekannter Dienst.', 'Unknown service.', 'Service inconnu.', 'Servicio desconocido.', 'Servizio sconosciuto.', 'Okänd tjänst.', 'Ukendt tjeneste.'],
    'err.importTooBig': ['Die Datei ist größer als 60 MB.', 'The file is larger than 60 MB.', 'Le fichier dépasse 60 Mo.', 'El archivo supera 60 MB.', 'Il file supera 60 MB.', 'Filen är större än 60 MB.', 'Filen er større end 60 MB.'],
    'err.importUnreadable': ['Die Datei konnte nicht gelesen werden.', 'The file could not be read.', 'Impossible de lire le fichier.', 'No se pudo leer el archivo.', 'Impossibile leggere il file.', 'Filen kunde inte läsas.', 'Filen kunne ikke læses.'],
    'err.invalidSetting': ['Ungültige Einstellung.', 'Invalid setting.', 'Réglage invalide.', 'Ajuste no válido.', 'Impostazione non valida.', 'Ogiltig inställning.', 'Ugyldig indstilling.'],
    'err.lastAdmin': ['Der letzte Admin kann nicht entfernt werden.', 'The last admin can’t be removed.', 'Le dernier admin ne peut pas être retiré.', 'No se puede quitar al último admin.', 'L’ultimo admin non può essere rimosso.', 'Den sista admin kan inte tas bort.', 'Den sidste admin kan ikke fjernes.'],
    'err.lastAdminDelete': ['Der letzte Admin kann nicht gelöscht werden. Ernenne vorher einen anderen Admin.', 'The last admin can’t be deleted. Appoint another admin first.', 'Le dernier admin ne peut pas être supprimé. Nomme d’abord un autre admin.', 'No se puede eliminar al último admin. Nombra antes a otro.', 'L’ultimo admin non può essere eliminato. Nominane prima un altro.', 'Den sista admin kan inte raderas. Utse en annan först.', 'Den sidste admin kan ikke slettes. Udnævn først en anden.'],
    'err.notFound': ['Nicht gefunden.', 'Not found.', 'Introuvable.', 'No encontrado.', 'Non trovato.', 'Hittades inte.', 'Ikke fundet.'],
    'err.ownAccount': ['Dein eigenes Konto löschst du im Profil.', 'Delete your own account in your profile.', 'Supprime ton propre compte dans ton profil.', 'Elimina tu propia cuenta en tu perfil.', 'Elimina il tuo account nel profilo.', 'Radera ditt eget konto i profilen.', 'Slet din egen konto i profilen.'],
    'err.passwordLong': ['Das Passwort ist zu lang.', 'The password is too long.', 'Le mot de passe est trop long.', 'La contraseña es demasiado larga.', 'La password è troppo lunga.', 'Lösenordet är för långt.', 'Adgangskoden er for lang.'],
    'err.passwordShort': ['Das Passwort muss mindestens 8 Zeichen lang sein.', 'The password must be at least 8 characters long.', 'Le mot de passe doit contenir au moins 8 caractères.', 'La contraseña debe tener al menos 8 caracteres.', 'La password deve avere almeno 8 caratteri.', 'Lösenordet måste ha minst 8 tecken.', 'Adgangskoden skal være mindst 8 tegn.'],
    'err.privacyRequired': ['Bitte bestätige die Datenschutzerklärung.', 'Please accept the privacy policy.', 'Merci d’accepter la politique de confidentialité.', 'Acepta la política de privacidad.', 'Accetta l’informativa sulla privacy.', 'Godkänn integritetspolicyn.', 'Acceptér privatlivspolitikken.'],
    'err.registrationClosed': ['Neue Registrierungen sind derzeit deaktiviert.', 'New sign-ups are currently disabled.', 'Les inscriptions sont désactivées.', 'Los registros están desactivados.', 'Le registrazioni sono disattivate.', 'Nya registreringar är avstängda.', 'Nye registreringer er slået fra.'],
    'err.tmdbMissing': ['TMDB ist nicht eingerichtet.', 'TMDB is not set up.', 'TMDB n’est pas configuré.', 'TMDB no está configurado.', 'TMDB non è configurato.', 'TMDB är inte konfigurerat.', 'TMDB er ikke sat op.'],
    'err.tooMany': ['Zu viele Fehlversuche – bitte in 15 Minuten erneut versuchen.', 'Too many attempts – please try again in 15 minutes.', 'Trop de tentatives – réessaie dans 15 minutes.', 'Demasiados intentos: inténtalo en 15 minutos.', 'Troppi tentativi – riprova tra 15 minuti.', 'För många försök – försök igen om 15 minuter.', 'For mange forsøg – prøv igen om 15 minutter.'],
    'err.tooManyRegs': ['Zu viele Registrierungen – bitte später erneut versuchen.', 'Too many sign-ups – please try again later.', 'Trop d’inscriptions – réessaie plus tard.', 'Demasiados registros: inténtalo más tarde.', 'Troppe registrazioni – riprova più tardi.', 'För många registreringar – försök senare.', 'For mange registreringer – prøv igen senere.'],
    'err.usernameInvalid': ['Der Benutzername muss 3–24 Zeichen lang sein (Buchstaben, Zahlen, _ . -).', 'The username must be 3–24 characters (letters, numbers, _ . -).', 'Le nom d’utilisateur doit faire 3 à 24 caractères (lettres, chiffres, _ . -).', 'El usuario debe tener 3–24 caracteres (letras, números, _ . -).', 'Il nome utente deve avere 3–24 caratteri (lettere, numeri, _ . -).', 'Användarnamnet måste vara 3–24 tecken (bokstäver, siffror, _ . -).', 'Brugernavnet skal være 3–24 tegn (bogstaver, tal, _ . -).'],
    'err.usernameTaken': ['Dieser Benutzername ist bereits vergeben.', 'This username is already taken.', 'Ce nom d’utilisateur est déjà pris.', 'Este nombre de usuario ya está en uso.', 'Questo nome utente è già in uso.', 'Användarnamnet är redan upptaget.', 'Brugernavnet er allerede taget.'],
    'err.wrongPassword': ['Das aktuelle Passwort stimmt nicht.', 'The current password is incorrect.', 'Le mot de passe actuel est incorrect.', 'La contraseña actual no es correcta.', 'La password attuale non è corretta.', 'Nuvarande lösenord stämmer inte.', 'Den nuværende adgangskode er forkert.'],
    'err.zipInvalid': ['Das ZIP-Archiv ist beschädigt oder verschlüsselt.', 'The ZIP archive is damaged or encrypted.', 'L’archive ZIP est endommagée ou chiffrée.', 'El ZIP está dañado o cifrado.', 'L’archivio ZIP è danneggiato o cifrato.', 'ZIP-arkivet är skadat eller krypterat.', 'ZIP-arkivet er beskadiget eller krypteret.'],

    // ------------------------------------------------------------ est
    'est.label': ['{p} % geschätzt', '{p} % estimated', '{p} % estimé', '{p} % estimado', '{p} % stimato', '{p} % uppskattat', '{p} % anslået'],
    'est.short': ['geschätzt', 'est.', 'estimé', 'estim.', 'stima', 'uppsk.', 'anslået'],
    'est.tooltip': ['Geschätzt: Für diese Einträge liefert der Dienst keine Dauer – Watchlfy nimmt die Laufzeit von TMDB.', 'Estimated: the service provides no duration for these entries – Watchlfy uses the runtime from TMDB.', 'Estimé : le service ne fournit pas de durée – Watchlfy utilise la durée TMDB.', 'Estimado: el servicio no da duración y Watchlfy usa la de TMDB.', 'Stimato: il servizio non fornisce la durata, Watchlfy usa quella di TMDB.', 'Uppskattat: tjänsten anger ingen längd – Watchlfy använder speltiden från TMDB.', 'Anslået: Tjenesten oplyser ingen varighed – Watchlfy bruger spilletiden fra TMDB.'],

    // ------------------------------------------------------------ fest
    'fest.birthday': ['Geburtstag', 'Birthday', 'Anniversaire', 'Cumpleaños', 'Compleanno', 'Födelsedag', 'Fødselsdag'],
    'fest.carnival': ['Fasching', 'Carnival', 'Carnaval', 'Carnaval', 'Carnevale', 'Karneval', 'Fastelavn'],
    'fest.christmas': ['Weihnachten', 'Christmas', 'Noël', 'Navidad', 'Natale', 'Jul', 'Jul'],
    'fest.easter': ['Ostern', 'Easter', 'Pâques', 'Pascua', 'Pasqua', 'Påsk', 'Påske'],
    'fest.halloween': ['Halloween', 'Halloween', 'Halloween', 'Halloween', 'Halloween', 'Halloween', 'Halloween'],
    'fest.midsummer': ['Midsommar', 'Midsummer', 'Saint-Jean', 'San Juan', 'Mezza estate', 'Midsommar', 'Sankthans'],
    'fest.newyear': ['Neujahr', 'New Year', 'Nouvel An', 'Año Nuevo', 'Capodanno', 'Nyår', 'Nytår'],

    // ------------------------------------------------------------ friends
    'friends.add': ['Anfrage senden', 'Send request', 'Envoyer', 'Enviar solicitud', 'Invia richiesta', 'Skicka förfrågan', 'Send anmodning'],
    'friends.placeholder': ['Benutzername deines Freundes', 'Your friend’s username', 'Nom d’utilisateur de ton ami', 'Nombre de usuario de tu amigo', 'Nome utente del tuo amico', 'Din väns användarnamn', 'Din vens brugernavn'],
    'friends.sub': ['Vergleicht euren Geschmack und schaut euch gegenseitig die Sammlung an. Freunde sehen Top-Listen, Summen und Sammlung – nie deinen Verlauf im Detail.', 'Compare your taste and browse each other’s collection. Friends see top lists, totals and your collection – never your detailed history.', 'Comparez vos goûts et vos collections. Tes amis voient tops, totaux et collection – jamais ton historique détaillé.', 'Comparad gustos y colecciones. Tus amigos ven tops, totales y colección, nunca tu historial detallado.', 'Confrontate i gusti e le collezioni. Gli amici vedono classifiche, totali e collezione – mai la cronologia dettagliata.', 'Jämför er smak och titta på varandras samlingar. Vänner ser topplistor, summor och samling – aldrig din detaljerade historik.', 'Sammenlign jeres smag og se hinandens samlinger. Venner ser toplister, totaler og samling – aldrig din detaljerede historik.'],
    'friends.title': ['Freunde', 'Friends', 'Amis', 'Amigos', 'Amici', 'Vänner', 'Venner'],

    // ------------------------------------------------------------ greet
    'greet.birthday': ['Alles Gute zum Geburtstag, {name}!', 'Happy birthday, {name}!', 'Joyeux anniversaire, {name} !', '¡Feliz cumpleaños, {name}!', 'Buon compleanno, {name}!', 'Grattis på födelsedagen, {name}!', 'Tillykke med fødselsdagen, {name}!'],
    'greet.carnival': ['Helau & Alaaf, {name}! Viel Spaß beim Feiern', 'Happy carnival, {name}! Have fun celebrating', 'Joyeux carnaval, {name} ! Amuse-toi bien', '¡Feliz carnaval, {name}! Diviértete', 'Buon Carnevale, {name}! Divertiti', 'Glad karneval, {name}! Ha kul', 'God fastelavn, {name}! God fornøjelse'],
    'greet.christmas': ['Frohe Weihnachten, {name}!', 'Merry Christmas, {name}!', 'Joyeux Noël, {name} !', '¡Feliz Navidad, {name}!', 'Buon Natale, {name}!', 'God jul, {name}!', 'Glædelig jul, {name}!'],
    'greet.easter': ['Frohe Ostern, {name}!', 'Happy Easter, {name}!', 'Joyeuses Pâques, {name} !', '¡Felices Pascuas, {name}!', 'Buona Pasqua, {name}!', 'Glad påsk, {name}!', 'God påske, {name}!'],
    'greet.halloween': ['Happy Halloween, {name}! 🎃', 'Happy Halloween, {name}! 🎃', 'Joyeux Halloween, {name} ! 🎃', '¡Feliz Halloween, {name}! 🎃', 'Buon Halloween, {name}! 🎃', 'Glad halloween, {name}! 🎃', 'Glædelig halloween, {name}! 🎃'],
    'greet.midsummer': ['Glad midsommar, {name}!', 'Happy Midsummer, {name}!', 'Belle Saint-Jean, {name} !', '¡Feliz San Juan, {name}!', 'Buona mezza estate, {name}!', 'Glad midsommar, {name}!', 'God sankthans, {name}!'],
    'greet.newyear': ['Frohes neues Jahr, {name}!', 'Happy New Year, {name}!', 'Bonne année, {name} !', '¡Feliz Año Nuevo, {name}!', 'Buon anno, {name}!', 'Gott nytt år, {name}!', 'Godt nytår, {name}!'],

    // ------------------------------------------------------------ greetTip
    'greetTip.birthday': ['Heute gibt es ein Geschenk in der Videothek.', 'There’s a present for you in the video store today.', 'Un cadeau t’attend au vidéoclub.', 'Hoy hay un regalo en el videoclub.', 'Oggi c’è un regalo in videoteca.', 'I dag finns en present i videobutiken.', 'I dag er der en gave i videobutikken.'],
    'greetTip.carnival': ['Heute passt eine Komödie.', 'A comedy fits today.', 'Une comédie s’impose aujourd’hui.', 'Hoy toca comedia.', 'Oggi ci sta una commedia.', 'I dag passar en komedi.', 'I dag passer en komedie.'],
    'greetTip.christmas': ['Die Videothek ist festlich geschmückt.', 'The video store is all decorated.', 'Le vidéoclub est décoré pour les fêtes.', 'El videoclub está decorado.', 'La videoteca è addobbata a festa.', 'Videobutiken är julpyntad.', 'Videobutikken er julepyntet.'],
    'greetTip.easter': ['Schon im Laden nach versteckten Eiern gesucht?', 'Already looked for hidden eggs in the store?', 'Tu as cherché les œufs cachés au vidéoclub ?', '¿Ya buscaste huevos escondidos en la tienda?', 'Hai già cercato le uova nascoste in negozio?', 'Har du letat efter gömda ägg i butiken?', 'Har du ledt efter skjulte æg i butikken?'],
    'greetTip.halloween': ['Zeit für einen Gruselfilm.', 'Time for a horror movie.', 'L’heure d’un film d’horreur.', 'Es hora de una de miedo.', 'È ora di un horror.', 'Dags för en skräckfilm.', 'Tid til en gyserfilm.'],
    'greetTip.midsummer': ['Lange Nächte, lange Serien.', 'Long nights, long series.', 'Longues nuits, longues séries.', 'Noches largas, series largas.', 'Notti lunghe, serie lunghe.', 'Långa nätter, långa serier.', 'Lange nætter, lange serier.'],
    'greetTip.newyear': ['Dein Jahresrückblick wartet.', 'Your year in review is waiting.', 'Ta rétrospective t’attend.', 'Tu resumen del año te espera.', 'Il tuo riepilogo dell’anno ti aspetta.', 'Din årsåterblick väntar.', 'Dit årstilbageblik venter.'],

    // ------------------------------------------------------------ history
    'history.more': ['Weitere Einträge laden', 'Load more entries', 'Charger plus d’entrées', 'Cargar más entradas', 'Carica altre voci', 'Ladda fler poster', 'Indlæs flere poster'],

    // ------------------------------------------------------------ import
    'import.allServices': ['Alle Dienste', 'All services', 'Tous les services', 'Todos los servicios', 'Tutti i servizi', 'Alla tjänster', 'Alle tjenester'],
    'import.another': ['Weitere Datei', 'Another file', 'Autre fichier', 'Otro archivo', 'Altro file', 'En fil till', 'En fil mere'],
    'import.apple.s1': ['Auf <b>privacy.apple.com</b> „Kopie deiner Daten anfordern“ wählen und <b>Apple Media Services</b> ankreuzen.', 'On <b>privacy.apple.com</b> choose “Request a copy of your data” and tick <b>Apple Media Services</b>.', 'Sur <b>privacy.apple.com</b>, choisis « Obtenir une copie de vos données » et coche <b>Apple Media Services</b>.', 'En <b>privacy.apple.com</b> elige «Solicitar una copia de tus datos» y marca <b>Apple Media Services</b>.', 'Su <b>privacy.apple.com</b> scegli «Richiedi una copia dei tuoi dati» e seleziona <b>Apple Media Services</b>.', 'På <b>privacy.apple.com</b> väljer du ”Begär en kopia av dina data” och kryssar i <b>Apple Media Services</b>.', 'På <b>privacy.apple.com</b> vælger du ”Anmod om en kopi af dine data” og markerer <b>Apple Media Services</b>.'],
    'import.apple.s2': ['Im ZIP liegt der TV-App-Verlauf als CSV – das ganze ZIP hier ablegen.', 'The ZIP contains the TV app history as CSV – drop the whole ZIP here.', 'Le ZIP contient l’historique de l’app TV en CSV – dépose tout le ZIP.', 'El ZIP contiene el historial de la app TV en CSV: suelta el ZIP entero.', 'Lo ZIP contiene la cronologia dell’app TV in CSV: rilascia tutto lo ZIP.', 'ZIP-filen innehåller TV-appens historik som CSV – släpp hela ZIP-filen här.', 'ZIP-filen indeholder TV-appens historik som CSV – slip hele ZIP-filen her.'],
    'import.applyMapping': ['Zuordnung übernehmen', 'Apply mapping', 'Appliquer', 'Aplicar', 'Applica', 'Använd', 'Anvend'],
    'import.btn.apple': ['Apple TV+ importieren', 'Import Apple TV+', 'Importer Apple TV+', 'Importar Apple TV+', 'Importa Apple TV+', 'Importera Apple TV+', 'Importér Apple TV+'],
    'import.btn.disney': ['Disney+ importieren', 'Import Disney+', 'Importer Disney+', 'Importar Disney+', 'Importa Disney+', 'Importera Disney+', 'Importér Disney+'],
    'import.btn.max': ['Max importieren', 'Import Max', 'Importer Max', 'Importar Max', 'Importa Max', 'Importera Max', 'Importér Max'],
    'import.btn.netflix': ['Netflix importieren', 'Import Netflix', 'Importer Netflix', 'Importar Netflix', 'Importa Netflix', 'Importera Netflix', 'Importér Netflix'],
    'import.btn.other': ['Andere Datei importieren', 'Import another file', 'Importer un autre fichier', 'Importar otro archivo', 'Importa un altro file', 'Importera annan fil', 'Importér anden fil'],
    'import.btn.prime': ['Prime Video importieren', 'Import Prime Video', 'Importer Prime Video', 'Importar Prime Video', 'Importa Prime Video', 'Importera Prime Video', 'Importér Prime Video'],
    'import.choose': ['Von welchem Dienst stammt deine Datei? Du kannst mehrere Dienste importieren.', 'Which service is your file from? You can import several services.', 'De quel service vient ton fichier ? Plusieurs services possibles.', '¿De qué servicio es tu archivo? Puedes importar varios.', 'Da quale servizio proviene il file? Puoi importarne diversi.', 'Vilken tjänst kommer filen från? Du kan importera flera.', 'Hvilken tjeneste er filen fra? Du kan importere flere.'],
    'import.disney.s1': ['Im Datenschutzcenter von Disney eine <b>Datenauskunft</b> anfordern (Link unten).', 'Request a <b>copy of your data</b> in Disney’s privacy center (link below).', 'Demande une <b>copie de tes données</b> dans le centre de confidentialité Disney (lien ci-dessous).', 'Solicita una <b>copia de tus datos</b> en el centro de privacidad de Disney (enlace abajo).', 'Richiedi una <b>copia dei tuoi dati</b> nel centro privacy Disney (link sotto).', 'Begär en <b>kopia av dina data</b> i Disneys integritetscenter (länk nedan).', 'Anmod om en <b>kopi af dine data</b> i Disneys privatlivscenter (link nedenfor).'],
    'import.disney.s2': ['Die Datei (meist CSV/JSON) hier ablegen und bei Bedarf die Spalten zuordnen.', 'Drop the file (usually CSV/JSON) here and map the columns if needed.', 'Dépose le fichier (CSV/JSON) ici et associe les colonnes si besoin.', 'Suelta el archivo (CSV/JSON) aquí y asigna columnas si hace falta.', 'Rilascia il file (CSV/JSON) e associa le colonne se serve.', 'Släpp filen (oftast CSV/JSON) här och koppla kolumner vid behov.', 'Slip filen (oftest CSV/JSON) her og tilknyt kolonner efter behov.'],
    'import.doneText': ['{n} neue Einträge, {d} waren schon vorhanden.', '{n} new entries, {d} were already there.', '{n} nouvelles entrées, {d} existaient déjà.', '{n} entradas nuevas, {d} ya existían.', '{n} nuove voci, {d} erano già presenti.', '{n} nya poster, {d} fanns redan.', '{n} nye poster, {d} fandtes allerede.'],
    'import.doneTitle': ['Import fertig!', 'Import done!', 'Import terminé !', '¡Importación lista!', 'Importazione completata!', 'Importen är klar!', 'Import færdig!'],
    'import.drop': ['Datei hierher ziehen oder <u>auswählen</u>', 'Drop a file here or <u>choose one</u>', 'Dépose un fichier ici ou <u>choisis-le</u>', 'Arrastra un archivo aquí o <u>elígelo</u>', 'Trascina qui un file o <u>sceglilo</u>', 'Släpp en fil här eller <u>välj</u>', 'Træk en fil hertil eller <u>vælg</u>'],
    'import.entries': ['Einträge', 'Entries', 'Entrées', 'Entradas', 'Voci', 'Poster', 'Poster'],
    'import.formats': ['CSV, JSON oder ZIP · bis 60 MB', 'CSV, JSON or ZIP · up to 60 MB', 'CSV, JSON ou ZIP · 60 Mo max.', 'CSV, JSON o ZIP · hasta 60 MB', 'CSV, JSON o ZIP · fino a 60 MB', 'CSV, JSON eller ZIP · upp till 60 MB', 'CSV, JSON eller ZIP · op til 60 MB'],
    'import.go': ['{n} Einträge importieren', 'Import {n} entries', 'Importer {n} entrées', 'Importar {n} entradas', 'Importa {n} voci', 'Importera {n} poster', 'Importér {n} poster'],
    'import.hasData': ['importiert', 'imported', 'importé', 'importado', 'importato', 'importerat', 'importeret'],
    'import.hint.apple': ['Datei von privacy.apple.com', 'File from privacy.apple.com', 'Fichier de privacy.apple.com', 'Archivo de privacy.apple.com', 'File da privacy.apple.com', 'Fil från privacy.apple.com', 'Fil fra privacy.apple.com'],
    'import.hint.disney': ['Datei aus der Datenauskunft', 'File from the data request', 'Fichier de la demande de données', 'Archivo de la solicitud de datos', 'File dalla richiesta dati', 'Fil från dataförfrågan', 'Fil fra dataanmodningen'],
    'import.hint.max': ['CSV/JSON aus der Datenschutz-Anfrage', 'CSV/JSON from the privacy request', 'CSV/JSON de la demande RGPD', 'CSV/JSON de la solicitud de privacidad', 'CSV/JSON dalla richiesta privacy', 'CSV/JSON från integritetsförfrågan', 'CSV/JSON fra privatlivsanmodningen'],
    'import.hint.netflix': ['CSV aus der Wiedergabeaktivität', 'CSV from Viewing activity', 'CSV de l’activité de visionnage', 'CSV de la actividad', 'CSV dall’attività di visione', 'CSV från tittaraktivitet', 'CSV fra seeraktivitet'],
    'import.hint.other': ['Beliebige CSV, JSON oder ZIP', 'Any CSV, JSON or ZIP', 'Tout CSV, JSON ou ZIP', 'Cualquier CSV, JSON o ZIP', 'Qualsiasi CSV, JSON o ZIP', 'Valfri CSV, JSON eller ZIP', 'Vilkårlig CSV, JSON eller ZIP'],
    'import.hint.prime': ['ZIP aus der Amazon-Datenauskunft', 'ZIP from Amazon’s data request', 'ZIP de la demande de données Amazon', 'ZIP de la solicitud de datos de Amazon', 'ZIP dalla richiesta dati Amazon', 'ZIP från Amazons dataförfrågan', 'ZIP fra Amazons dataanmodning'],
    'import.importing': ['Wird importiert …', 'Importing …', 'Import en cours …', 'Importando …', 'Importazione …', 'Importerar …', 'Importerer …'],
    'import.mapping': ['Spalten zuordnen', 'Map columns', 'Associer les colonnes', 'Asignar columnas', 'Associa colonne', 'Koppla kolumner', 'Tilknyt kolonner'],
    'import.mappingHint': ['Pflicht: Titel (oder Serie) und Startzeit (oder Datum). Alles andere ist optional.', 'Required: title (or series) and start time (or date). Everything else is optional.', 'Obligatoire : titre (ou série) et heure de début (ou date). Le reste est facultatif.', 'Obligatorio: título (o serie) y hora de inicio (o fecha). Lo demás es opcional.', 'Obbligatori: titolo (o serie) e inizio (o data). Il resto è facoltativo.', 'Krävs: titel (eller serie) och starttid (eller datum). Resten är valfritt.', 'Påkrævet: titel (eller serie) og starttid (eller dato). Resten er valgfrit.'],
    'import.max.s1': ['Beim Datenschutzportal von Warner Bros. Discovery eine <b>Auskunft über deine Daten</b> stellen (Link unten).', 'File a <b>request for your data</b> at the Warner Bros. Discovery privacy portal (link below).', 'Fais une <b>demande d’accès à tes données</b> sur le portail de Warner Bros. Discovery (lien ci-dessous).', 'Solicita <b>acceso a tus datos</b> en el portal de privacidad de Warner Bros. Discovery (enlace abajo).', 'Invia una <b>richiesta di accesso ai dati</b> sul portale privacy di Warner Bros. Discovery (link sotto).', 'Gör en <b>begäran om dina data</b> på Warner Bros. Discoverys integritetsportal (länk nedan).', 'Indsend en <b>anmodning om dine data</b> på Warner Bros. Discoverys privatlivsportal (link nedenfor).'],
    'import.max.s2': ['Du bekommst eine Datei (CSV oder JSON, oft im ZIP). Das Format kann sich ändern.', 'You’ll receive a file (CSV or JSON, often zipped). The format may change.', 'Tu recevras un fichier (CSV ou JSON, souvent zippé). Le format peut varier.', 'Recibirás un archivo (CSV o JSON, a menudo en ZIP). El formato puede cambiar.', 'Riceverai un file (CSV o JSON, spesso in ZIP). Il formato può cambiare.', 'Du får en fil (CSV eller JSON, ofta zippad). Formatet kan ändras.', 'Du får en fil (CSV eller JSON, ofte zippet). Formatet kan ændre sig.'],
    'import.max.s3': ['Datei hier ablegen – Watchlfy erkennt Titel, Zeit und Dauer; sonst ordnest du die Spalten selbst zu.', 'Drop the file here – Watchlfy detects title, time and duration; otherwise you map the columns yourself.', 'Dépose le fichier ici – Watchlfy détecte titre, heure et durée ; sinon associe les colonnes toi-même.', 'Suelta el archivo aquí: Watchlfy detecta título, hora y duración; si no, asignas tú las columnas.', 'Rilascia il file: Watchlfy riconosce titolo, ora e durata; altrimenti associ tu le colonne.', 'Släpp filen här – Watchlfy känner igen titel, tid och längd; annars kopplar du kolumnerna själv.', 'Slip filen her – Watchlfy genkender titel, tid og varighed; ellers tilknytter du selv kolonnerne.'],
    'import.needsMapping': ['Die Spalten waren nicht eindeutig. Bitte unten zuordnen, welche Spalte was enthält.', 'The columns were ambiguous. Please map below which column contains what.', 'Colonnes ambiguës. Indique ci-dessous le contenu de chaque colonne.', 'Las columnas no estaban claras. Indica abajo qué contiene cada una.', 'Colonne ambigue. Indica sotto cosa contiene ogni colonna.', 'Kolumnerna var otydliga. Ange nedan vad varje kolumn innehåller.', 'Kolonnerne var tvetydige. Angiv nedenfor, hvad hver kolonne indeholder.'],
    'import.netflix.full': ['Ausführliche Daten anfordern', 'Request detailed data', 'Demander les données détaillées', 'Pedir datos detallados', 'Richiedi dati dettagliati', 'Begär detaljerade data', 'Anmod om detaljerede data'],
    'import.netflix.s1': ['Öffne <b>Konto → Profil → Wiedergabeaktivität</b> (Link unten) und wähle das richtige Profil.', 'Open <b>Account → Profile → Viewing activity</b> (link below) and pick the right profile.', 'Ouvre <b>Compte → Profil → Activité de visionnage</b> (lien ci-dessous) et choisis le bon profil.', 'Abre <b>Cuenta → Perfil → Actividad de visualización</b> (enlace abajo) y elige el perfil.', 'Apri <b>Account → Profilo → Attività di visione</b> (link sotto) e scegli il profilo giusto.', 'Öppna <b>Konto → Profil → Tittaraktivitet</b> (länk nedan) och välj rätt profil.', 'Åbn <b>Konto → Profil → Seeraktivitet</b> (link nedenfor) og vælg den rigtige profil.'],
    'import.netflix.s2': ['Ganz unten auf <b>„Alle herunterladen“</b> tippen – du bekommst <code>NetflixViewingHistory.csv</code> (Titel + Datum).', 'At the very bottom tap <b>“Download all”</b> – you get <code>NetflixViewingHistory.csv</code> (title + date).', 'Tout en bas, touche <b>« Tout télécharger »</b> – tu obtiens <code>NetflixViewingHistory.csv</code>.', 'Abajo del todo, toca <b>«Descargar todo»</b>: obtienes <code>NetflixViewingHistory.csv</code>.', 'In fondo tocca <b>«Scarica tutto»</b>: ottieni <code>NetflixViewingHistory.csv</code>.', 'Längst ned trycker du på <b>”Ladda ned alla”</b> – du får <code>NetflixViewingHistory.csv</code>.', 'Helt nederst trykker du på <b>”Download alle”</b> – du får <code>NetflixViewingHistory.csv</code>.'],
    'import.netflix.s3': ['Genauer (mit Uhrzeit, Dauer, Gerät, allen Profilen): <b>„Ausführliche Daten anfordern“</b> – im ZIP steckt <code>ViewingActivity.csv</code>. Das ZIP kannst du direkt hochladen.', 'More precise (with time, duration, device, all profiles): <b>“Request detailed data”</b> – the ZIP contains <code>ViewingActivity.csv</code>. Upload the ZIP as is.', 'Plus précis (heure, durée, appareil, tous les profils) : <b>« Demander les données détaillées »</b> – le ZIP contient <code>ViewingActivity.csv</code>. Importe le ZIP tel quel.', 'Más preciso (hora, duración, dispositivo, todos los perfiles): <b>«Pedir datos detallados»</b>; el ZIP incluye <code>ViewingActivity.csv</code>. Sube el ZIP tal cual.', 'Più preciso (orario, durata, dispositivo, tutti i profili): <b>«Richiedi dati dettagliati»</b> – lo ZIP contiene <code>ViewingActivity.csv</code>. Caricalo così com’è.', 'Mer exakt (klockslag, längd, enhet, alla profiler): <b>”Begär detaljerade data”</b> – ZIP-filen innehåller <code>ViewingActivity.csv</code>. Ladda upp ZIP-filen direkt.', 'Mere præcist (klokkeslæt, varighed, enhed, alle profiler): <b>”Anmod om detaljerede data”</b> – ZIP-filen indeholder <code>ViewingActivity.csv</code>. Upload ZIP-filen direkte.'],
    'import.netflix.s4': ['Datei hier ablegen. Trailer und Teaser werden automatisch übersprungen.', 'Drop the file here. Trailers and teasers are skipped automatically.', 'Dépose le fichier ici. Bandes-annonces et teasers sont ignorés.', 'Suelta el archivo aquí. Tráileres y teasers se omiten.', 'Rilascia qui il file. Trailer e teaser vengono saltati.', 'Släpp filen här. Trailers och teasers hoppas över automatiskt.', 'Slip filen her. Trailere og teasere springes automatisk over.'],
    'import.openPage': ['Datenseite öffnen', 'Open data page', 'Ouvrir la page', 'Abrir la página', 'Apri la pagina', 'Öppna sidan', 'Åbn siden'],
    'import.other.s1': ['Jede Tabelle mit Titel und Datum funktioniert – CSV, JSON oder ZIP.', 'Any table with title and date works – CSV, JSON or ZIP.', 'Tout tableau avec titre et date convient – CSV, JSON ou ZIP.', 'Sirve cualquier tabla con título y fecha: CSV, JSON o ZIP.', 'Va bene qualsiasi tabella con titolo e data: CSV, JSON o ZIP.', 'Alla tabeller med titel och datum fungerar – CSV, JSON eller ZIP.', 'Enhver tabel med titel og dato virker – CSV, JSON eller ZIP.'],
    'import.other.s2': ['Watchlfy schlägt die Spalten vor, du kannst sie anpassen.', 'Watchlfy suggests the columns; you can adjust them.', 'Watchlfy propose les colonnes, tu peux les ajuster.', 'Watchlfy propone las columnas y puedes ajustarlas.', 'Watchlfy propone le colonne e puoi modificarle.', 'Watchlfy föreslår kolumnerna, du kan ändra dem.', 'Watchlfy foreslår kolonnerne, du kan tilpasse dem.'],
    'import.otherFile': ['Andere Datei', 'Another file', 'Autre fichier', 'Otro archivo', 'Altro file', 'Annan fil', 'Anden fil'],
    'import.pickProfile': ['Bitte mindestens ein Profil wählen.', 'Please choose at least one profile.', 'Choisis au moins un profil.', 'Elige al menos un perfil.', 'Scegli almeno un profilo.', 'Välj minst en profil.', 'Vælg mindst én profil.'],
    'import.previewTitle': ['Vorschau', 'Preview', 'Aperçu', 'Vista previa', 'Anteprima', 'Förhandsvisning', 'Forhåndsvisning'],
    'import.prime.s1': ['Bei Amazon <b>„Meine Daten anfordern“</b> öffnen (Link unten).', 'Open <b>“Request my data”</b> on Amazon (link below).', 'Ouvre <b>« Demander mes données »</b> chez Amazon (lien ci-dessous).', 'Abre <b>«Solicitar mis datos»</b> en Amazon (enlace abajo).', 'Apri <b>«Richiedi i miei dati»</b> su Amazon (link sotto).', 'Öppna <b>”Begär mina data”</b> hos Amazon (länk nedan).', 'Åbn <b>”Anmod om mine data”</b> hos Amazon (link nedenfor).'],
    'import.prime.s2': ['Kategorie <b>Prime Video</b> wählen und die Anfrage per E-Mail bestätigen.', 'Choose the <b>Prime Video</b> category and confirm the request by email.', 'Choisis la catégorie <b>Prime Video</b> et confirme par e-mail.', 'Elige la categoría <b>Prime Video</b> y confirma por correo.', 'Scegli la categoria <b>Prime Video</b> e conferma via e-mail.', 'Välj kategorin <b>Prime Video</b> och bekräfta via mejl.', 'Vælg kategorien <b>Prime Video</b> og bekræft via e-mail.'],
    'import.prime.s3': ['Sobald die Daten bereitstehen, das ZIP herunterladen – Watchlfy findet die Verlaufsdatei darin selbst.', 'When the data is ready, download the ZIP – Watchlfy finds the history file inside by itself.', 'Une fois prêtes, télécharge le ZIP – Watchlfy y trouve lui-même l’historique.', 'Cuando estén listos, descarga el ZIP: Watchlfy encuentra el historial dentro.', 'Quando i dati sono pronti, scarica lo ZIP: Watchlfy trova da solo la cronologia.', 'När datan är klar laddar du ned ZIP-filen – Watchlfy hittar historiken själv.', 'Når data er klar, downloader du ZIP-filen – Watchlfy finder selv historikken.'],
    'import.prime.s4': ['ZIP oder einzelne CSV hier ablegen. Sind die Spalten unklar, fragt Watchlfy nach.', 'Drop the ZIP or a single CSV here. If the columns are unclear, Watchlfy asks.', 'Dépose le ZIP ou un CSV ici. Si les colonnes sont floues, Watchlfy te demande.', 'Suelta el ZIP o un CSV aquí. Si las columnas no están claras, Watchlfy pregunta.', 'Rilascia qui lo ZIP o un CSV. Se le colonne non sono chiare, Watchlfy chiede.', 'Släpp ZIP-filen eller en CSV här. Är kolumnerna otydliga frågar Watchlfy.', 'Slip ZIP-filen eller en CSV her. Er kolonnerne uklare, spørger Watchlfy.'],
    'import.privacy': ['Watchlfy liest nur den Verlauf aus der Datei. Kein Passwort, kein Login beim Dienst.', 'Watchlfy only reads the history from the file. No password, no login to the service.', 'Watchlfy ne lit que l’historique du fichier. Ni mot de passe, ni connexion au service.', 'Watchlfy solo lee el historial del archivo. Sin contraseña ni inicio de sesión.', 'Watchlfy legge solo la cronologia dal file. Nessuna password, nessun login.', 'Watchlfy läser bara historiken i filen. Inget lösenord, ingen inloggning.', 'Watchlfy læser kun historikken i filen. Ingen adgangskode, intet login.'],
    'import.profiles': ['Welche Profile gehören dir?', 'Which profiles are yours?', 'Quels profils sont à toi ?', '¿Qué perfiles son tuyos?', 'Quali profili sono tuoi?', 'Vilka profiler är dina?', 'Hvilke profiler er dine?'],
    'import.quality': ['{t} % mit Uhrzeit · {d} % mit echter Dauer', '{t} % with time · {d} % with real duration', '{t} % avec heure · {d} % avec durée réelle', '{t} % con hora · {d} % con duración real', '{t} % con orario · {d} % con durata reale', '{t} % med klockslag · {d} % med verklig längd', '{t} % med klokkeslæt · {d} % med reel varighed'],
    'import.reading': ['„{f}“ wird gelesen …', 'Reading “{f}” …', 'Lecture de « {f} » …', 'Leyendo «{f}» …', 'Lettura di «{f}» …', 'Läser ”{f}” …', 'Læser ”{f}” …'],
    'import.skipped': ['{n} übersprungen ({tr} Trailer, {sh} unter 1 Min.)', '{n} skipped ({tr} trailers, {sh} under 1 min)', '{n} ignorées ({tr} bandes-annonces, {sh} < 1 min)', '{n} omitidas ({tr} tráileres, {sh} < 1 min)', '{n} saltate ({tr} trailer, {sh} < 1 min)', '{n} hoppades över ({tr} trailers, {sh} under 1 min)', '{n} sprunget over ({tr} trailere, {sh} under 1 min.)'],
    'import.slow': ['Die Datenauskunft kann einige Tage dauern – du bekommst eine E-Mail, sobald sie bereitsteht.', 'The data request can take a few days – you’ll get an email when it’s ready.', 'La demande peut prendre quelques jours – tu recevras un e-mail.', 'La solicitud puede tardar unos días; recibirás un correo.', 'La richiesta può richiedere alcuni giorni – riceverai un’e-mail.', 'Förfrågan kan ta några dagar – du får ett mejl när den är klar.', 'Anmodningen kan tage et par dage – du får en e-mail, når den er klar.'],
    'import.table': ['Tabelle', 'Table', 'Tableau', 'Tabla', 'Tabella', 'Tabell', 'Tabel'],
    'import.tableFound': ['{n} Tabellen gefunden', '{n} tables found', '{n} tableaux trouvés', '{n} tablas encontradas', '{n} tabelle trovate', '{n} tabeller hittades', '{n} tabeller fundet'],
    'import.title': ['Verlauf importieren', 'Import history', 'Importer l’historique', 'Importar historial', 'Importa cronologia', 'Importera historik', 'Importér historik'],
    'import.tmdbNote': ['Poster und Laufzeiten werden jetzt im Hintergrund von TMDB geladen.', 'Posters and runtimes are now loaded from TMDB in the background.', 'Affiches et durées sont chargées depuis TMDB en arrière-plan.', 'Pósteres y duraciones se cargan ahora desde TMDB.', 'Locandine e durate vengono caricate da TMDB in background.', 'Affischer och speltider hämtas nu från TMDB i bakgrunden.', 'Plakater og spilletider hentes nu fra TMDB i baggrunden.'],
    'import.toStats': ['Zur Statistik', 'Go to stats', 'Voir les stats', 'Ver estadísticas', 'Vai alle statistiche', 'Till statistiken', 'Til statistikken'],
    'import.when': ['Wann', 'When', 'Quand', 'Cuándo', 'Quando', 'När', 'Hvornår'],

    // ------------------------------------------------------------ imports
    'imports.deleteSource': ['{s}-Daten löschen', 'Delete {s} data', 'Supprimer les données {s}', 'Borrar datos de {s}', 'Elimina dati {s}', 'Radera {s}-data', 'Slet {s}-data'],
    'imports.deleteSourceConfirm': ['Alle Einträge von {s} löschen?', 'Delete all entries from {s}?', 'Supprimer toutes les entrées de {s} ?', '¿Borrar todas las entradas de {s}?', 'Eliminare tutte le voci di {s}?', 'Radera alla poster från {s}?', 'Slet alle poster fra {s}?'],
    'imports.removed': ['{n} Einträge entfernt.', '{n} entries removed.', '{n} entrées supprimées.', '{n} entradas eliminadas.', '{n} voci rimosse.', '{n} poster borttagna.', '{n} poster fjernet.'],
    'imports.row': ['{a} neu von {t}', '{a} new of {t}', '{a} nouvelles sur {t}', '{a} nuevas de {t}', '{a} nuove su {t}', '{a} nya av {t}', '{a} nye af {t}'],
    'imports.title': ['Bisherige Importe', 'Previous imports', 'Imports précédents', 'Importaciones anteriores', 'Importazioni precedenti', 'Tidigare importer', 'Tidligere importer'],
    'imports.undo': ['Rückgängig', 'Undo', 'Annuler', 'Deshacer', 'Annulla', 'Ångra', 'Fortryd'],
    'imports.undoConfirm': ['Diesen Import rückgängig machen? Die Einträge daraus werden gelöscht.', 'Undo this import? Its entries will be deleted.', 'Annuler cet import ? Ses entrées seront supprimées.', '¿Deshacer esta importación? Se borrarán sus entradas.', 'Annullare l’importazione? Le sue voci saranno eliminate.', 'Ångra importen? Dess poster raderas.', 'Fortryd importen? Dens poster slettes.'],

    // ------------------------------------------------------------ insight
    'insight.avg': ['im Schnitt', 'on average', 'en moyenne', 'de media', 'in media', 'i snitt', 'i snit'],
    'insight.bestDay': ['Bester Tag', 'Best day', 'Meilleur jour', 'Mejor día', 'Giorno migliore', 'Bästa dag', 'Bedste dag'],
    'insight.favDay': ['Lieblingstag', 'Favourite day', 'Jour préféré', 'Día favorito', 'Giorno preferito', 'Favoritdag', 'Yndlingsdag'],
    'insight.favTime': ['Lieblingszeit', 'Favourite time', 'Moment préféré', 'Hora favorita', 'Momento preferito', 'Favorittid', 'Yndlingstid'],
    'insight.inARow': ['am Stück', 'in a row', 'd’affilée', 'seguidos', 'di fila', 'i rad', 'i træk'],
    'insight.nightOwl': ['Nachteule', 'Night owl', 'Oiseau de nuit', 'Noctámbulo', 'Nottambulo', 'Nattuggla', 'Natteravn'],
    'insight.ofTime': ['deiner Schauzeit', 'of your watch time', 'de ton temps de visionnage', 'de tu tiempo', 'del tuo tempo', 'av din tittartid', 'af din seertid'],
    'insight.peakTime': ['Lieblingszeit', 'Favourite time', 'Moment préféré', 'Hora favorita', 'Ora preferita', 'Favorittid', 'Yndlingstid'],
    'insight.perDay': ['Pro Tag', 'Per day', 'Par jour', 'Al día', 'Al giorno', 'Per dag', 'Pr. dag'],
    'insight.primetime': ['Primetime', 'Prime time', 'Prime time', 'Prime time', 'Prima serata', 'Bästa sändningstid', 'Primetime'],
    'insight.streak': ['Längste Serie', 'Longest streak', 'Plus longue série', 'Racha más larga', 'Serie più lunga', 'Längsta svit', 'Længste stribe'],
    'insight.weekend': ['Wochenende', 'Weekend', 'Week-end', 'Fin de semana', 'Weekend', 'Helg', 'Weekend'],

    // ------------------------------------------------------------ kind
    'kind.movie': ['Film', 'Movie', 'Film', 'Película', 'Film', 'Film', 'Film'],
    'kind.tv': ['Serie', 'Series', 'Série', 'Serie', 'Serie', 'Serie', 'Serie'],

    // ------------------------------------------------------------ kpi
    'kpi.avg': ['Ø pro Tag', 'Avg. per day', 'Moy. par jour', 'Media al día', 'Media al giorno', 'Snitt per dag', 'Gns. pr. dag'],
    'kpi.days': ['≈ {n} Tage', '≈ {n} days', '≈ {n} jours', '≈ {n} días', '≈ {n} giorni', '≈ {n} dagar', '≈ {n} dage'],
    'kpi.different': ['verschiedene', 'different', 'différents', 'distintos', 'diversi', 'olika', 'forskellige'],
    'kpi.episodes': ['Folgen', 'Episodes', 'Épisodes', 'Episodios', 'Episodi', 'Avsnitt', 'Afsnit'],
    'kpi.hoursUnit': ['Stunden', 'hours', 'heures', 'horas', 'ore', 'timmar', 'timer'],
    'kpi.inSeries': ['aus {n} Serien', 'from {n} series', 'de {n} séries', 'de {n} series', 'da {n} serie', 'från {n} serier', 'fra {n} serier'],
    'kpi.minPerDay': ['Minuten pro Tag', 'minutes per day', 'minutes par jour', 'minutos al día', 'minuti al giorno', 'minuter per dag', 'minutter pr. dag'],
    'kpi.movies': ['Filme', 'Movies', 'Films', 'Películas', 'Film', 'Filmer', 'Film'],
    'kpi.onDays': ['an {n} Tagen', 'on {n} days', 'sur {n} jours', 'en {n} días', 'in {n} giorni', 'på {n} dagar', 'på {n} dage'],
    'kpi.series': ['Serien', 'Series', 'Séries', 'Series', 'Serie', 'Serier', 'Serier'],
    'kpi.watchtime': ['Schauzeit', 'Watch time', 'Temps de visionnage', 'Tiempo visto', 'Tempo di visione', 'Tittartid', 'Seertid'],

    // ------------------------------------------------------------ legal
    'legal.privacy': ['Datenschutz', 'Privacy', 'Confidentialité', 'Privacidad', 'Privacy', 'Integritet', 'Privatliv'],
    'legal.tmdb': ['Film- und Seriendaten von TMDB. Dieses Produkt nutzt die TMDB-API, ist aber nicht von TMDB unterstützt oder zertifiziert.', 'Movie and TV data from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.', 'Données films et séries : TMDB. Ce produit utilise l’API TMDB sans être approuvé ni certifié par TMDB.', 'Datos de cine y series de TMDB. Este producto usa la API de TMDB, pero no está avalado ni certificado por TMDB.', 'Dati di film e serie da TMDB. Questo prodotto usa l’API TMDB ma non è approvato né certificato da TMDB.', 'Film- och seriedata från TMDB. Produkten använder TMDB:s API men är inte godkänd eller certifierad av TMDB.', 'Film- og seriedata fra TMDB. Produktet bruger TMDB’s API, men er ikke godkendt eller certificeret af TMDB.'],

    // ------------------------------------------------------------ link
    'link.showAll': ['Alle anzeigen →', 'See all →', 'Tout voir →', 'Ver todo →', 'Vedi tutti →', 'Visa alla →', 'Vis alle →'],

    // ------------------------------------------------------------ login
    'login.back': ['Zurück', 'Back', 'Retour', 'Atrás', 'Indietro', 'Tillbaka', 'Tilbage'],
    'login.consent': ['Ich habe die <a href="/datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und bin einverstanden.', 'I have read and agree to the <a href="/datenschutz" target="_blank" rel="noopener">privacy policy</a>.', 'J’ai lu et j’accepte la <a href="/datenschutz" target="_blank" rel="noopener">politique de confidentialité</a>.', 'He leído y acepto la <a href="/datenschutz" target="_blank" rel="noopener">política de privacidad</a>.', 'Ho letto e accetto l’<a href="/datenschutz" target="_blank" rel="noopener">informativa sulla privacy</a>.', 'Jag har läst och godkänner <a href="/datenschutz" target="_blank" rel="noopener">integritetspolicyn</a>.', 'Jeg har læst og accepterer <a href="/datenschutz" target="_blank" rel="noopener">privatlivspolitikken</a>.'],
    'login.createAccount': ['Konto erstellen', 'Create account', 'Créer un compte', 'Crear cuenta', 'Crea account', 'Skapa konto', 'Opret konto'],
    'login.fillIn': ['Bitte Benutzername und Passwort eingeben.', 'Please enter username and password.', 'Saisis ton nom d’utilisateur et ton mot de passe.', 'Introduce usuario y contraseña.', 'Inserisci nome utente e password.', 'Ange användarnamn och lösenord.', 'Indtast brugernavn og adgangskode.'],
    'login.haveAccount': ['Schon ein Konto?', 'Already have an account?', 'Déjà un compte ?', '¿Ya tienes cuenta?', 'Hai già un account?', 'Har du redan ett konto?', 'Har du allerede en konto?'],
    'login.hint': ['3–24 Zeichen (Buchstaben, Zahlen, _ . -) · Passwort mindestens 8 Zeichen', '3–24 characters (letters, numbers, _ . -) · password at least 8 characters', '3–24 caractères (lettres, chiffres, _ . -) · mot de passe 8 caractères min.', '3–24 caracteres (letras, números, _ . -) · contraseña mínimo 8', '3–24 caratteri (lettere, numeri, _ . -) · password almeno 8', '3–24 tecken (bokstäver, siffror, _ . -) · lösenord minst 8 tecken', '3–24 tegn (bogstaver, tal, _ . -) · adgangskode mindst 8 tegn'],
    'login.login': ['Anmelden', 'Log in', 'Se connecter', 'Iniciar sesión', 'Accedi', 'Logga in', 'Log ind'],
    'login.noAccount': ['Noch kein Konto?', 'No account yet?', 'Pas encore de compte ?', '¿Aún no tienes cuenta?', 'Non hai un account?', 'Inget konto ännu?', 'Ingen konto endnu?'],
    'login.password': ['Passwort', 'Password', 'Mot de passe', 'Contraseña', 'Password', 'Lösenord', 'Adgangskode'],
    'login.password2': ['Passwort wiederholen', 'Repeat password', 'Répéter le mot de passe', 'Repetir contraseña', 'Ripeti password', 'Upprepa lösenord', 'Gentag adgangskode'],
    'login.register': ['Registrieren', 'Sign up', 'S’inscrire', 'Registrarse', 'Registrati', 'Registrera dig', 'Opret konto'],
    'login.tagline': ['Deine persönliche Film- & Serien-Statistik', 'Your personal movie & TV stats', 'Tes statistiques films & séries', 'Tus estadísticas de cine y series', 'Le tue statistiche di film e serie', 'Din personliga film- & seriestatistik', 'Din personlige film- og seriestatistik'],

    // ------------------------------------------------------------ match
    'match.any': ['Film oder Serie', 'Movie or series', 'Film ou série', 'Película o serie', 'Film o serie', 'Film eller serie', 'Film eller serie'],
    'match.correct': ['Treffer korrigieren', 'Fix match', 'Corriger', 'Corregir', 'Correggi', 'Rätta träff', 'Ret match'],
    'match.correctSub': ['Suche bei TMDB und tippe auf den passenden Film bzw. die Serie.', 'Search TMDB and tap the matching movie or series.', 'Cherche sur TMDB et touche le bon film ou la bonne série.', 'Busca en TMDB y toca la película o serie correcta.', 'Cerca su TMDB e tocca il film o la serie giusta.', 'Sök på TMDB och tryck på rätt film eller serie.', 'Søg på TMDB og tryk på den rigtige film eller serie.'],
    'match.correctTitle': ['Richtigen Titel wählen', 'Choose the right title', 'Choisir le bon titre', 'Elige el título correcto', 'Scegli il titolo giusto', 'Välj rätt titel', 'Vælg den rigtige titel'],
    'match.kind': ['Art', 'Type', 'Type', 'Tipo', 'Tipo', 'Typ', 'Type'],
    'match.none': ['nicht bei TMDB gefunden', 'not found on TMDB', 'introuvable sur TMDB', 'no encontrado en TMDB', 'non trovato su TMDB', 'hittades inte på TMDB', 'ikke fundet på TMDB'],
    'match.noneBtn': ['Gibt es bei TMDB nicht – ohne Treffer lassen', 'Not on TMDB – leave unmatched', 'Absent de TMDB – laisser sans correspondance', 'No está en TMDB: dejar sin asignar', 'Non è su TMDB – lascia senza abbinamento', 'Finns inte på TMDB – lämna utan träff', 'Findes ikke på TMDB – lad være uden match'],
    'match.saved': ['Gespeichert – Daten werden aktualisiert.', 'Saved – data is being updated.', 'Enregistré – mise à jour en cours.', 'Guardado; actualizando datos.', 'Salvato – aggiornamento in corso.', 'Sparat – data uppdateras.', 'Gemt – data opdateres.'],
    'match.search': ['Suchen', 'Search', 'Chercher', 'Buscar', 'Cerca', 'Sök', 'Søg'],
    'match.uncertain': ['unsicherer Treffer', 'uncertain match', 'correspondance incertaine', 'coincidencia dudosa', 'corrispondenza incerta', 'osäker träff', 'usikkert match'],

    // ------------------------------------------------------------ nav
    'nav.admin': ['Admin', 'Admin', 'Admin', 'Admin', 'Admin', 'Admin', 'Admin'],
    'nav.collection': ['Sammlung', 'Collection', 'Collection', 'Colección', 'Collezione', 'Samling', 'Samling'],
    'nav.friends': ['Freunde', 'Friends', 'Amis', 'Amigos', 'Amici', 'Vänner', 'Venner'],
    'nav.history': ['Verlauf', 'History', 'Historique', 'Historial', 'Cronologia', 'Historik', 'Historik'],
    'nav.main': ['Hauptnavigation', 'Main navigation', 'Navigation principale', 'Navegación principal', 'Navigazione principale', 'Huvudnavigering', 'Hovednavigation'],
    'nav.more': ['Mehr', 'More', 'Plus', 'Más', 'Altro', 'Mer', 'Mere'],
    'nav.overview': ['Übersicht', 'Overview', 'Aperçu', 'Resumen', 'Panoramica', 'Översikt', 'Oversigt'],
    'nav.profile': ['Profil', 'Profile', 'Profil', 'Perfil', 'Profilo', 'Profil', 'Profil'],
    'nav.progress': ['Fortschritt', 'Progress', 'Progression', 'Progreso', 'Avanzamento', 'Framsteg', 'Fremskridt'],
    'nav.times': ['Schauzeiten', 'Watch times', 'Horaires', 'Horarios', 'Orari', 'Tittartider', 'Seertider'],
    'nav.top': ['Top-Listen', 'Top lists', 'Classements', 'Listas top', 'Classifiche', 'Topplistor', 'Toplister'],
    'nav.wrapped': ['Rückblick', 'Wrapped', 'Rétrospective', 'Resumen', 'Riepilogo', 'Årskrönika', 'Årets musik'],

    // ------------------------------------------------------------ news
    'np.watching': ['Läuft gerade', 'Watching now', 'En cours', 'Viendo ahora', 'In visione', 'Tittar nu', 'Ser nu'],
    'news.kicker': ['Update', 'Update', 'Mise à jour', 'Actualización', 'Aggiornamento', 'Uppdatering', 'Opdatering'],
    'news.more': ['… und {n} weitere Verbesserungen', '… and {n} more improvements', '… et {n} autres améliorations', '… y {n} mejoras más', '… e altri {n} miglioramenti', '… och {n} förbättringar till', '… og {n} forbedringer mere'],
    'news.ok': ['Alles klar', 'Got it', 'Compris', 'Entendido', 'Ho capito', 'Uppfattat', 'Forstået'],
    'news.open': ['Neuigkeiten', 'What’s new', 'Nouveautés', 'Novedades', 'Novità', 'Nyheter', 'Nyheder'],
    'news.title': ['Neu in Watchlfy', 'New in Watchlfy', 'Nouveau dans Watchlfy', 'Novedades en Watchlfy', 'Novità in Watchlfy', 'Nytt i Watchlfy', 'Nyt i Watchlfy'],
    'news.try': ['Ansehen', 'Show me', 'Voir', 'Ver', 'Vedi', 'Visa', 'Vis'],

    // ------------------------------------------------------------ overview
    'overview.topMovies': ['Top-Filme', 'Top movies', 'Films préférés', 'Películas top', 'Film top', 'Toppfilmer', 'Topfilm'],
    'overview.topSeries': ['Top-Serien', 'Top series', 'Séries préférées', 'Series top', 'Serie top', 'Toppserier', 'Topserier'],

    // ------------------------------------------------------------ privacy
    'privacy.accept': ['Gelesen & einverstanden', 'Read & agree', 'Lu et accepté', 'Leído y acepto', 'Letto e accetto', 'Läst & godkänd', 'Læst & accepteret'],
    'privacy.bannerText': ['Hier steht, welche Daten Watchlfy speichert und welche Rechte du hast. Bitte lies sie kurz und bestätige.', 'This explains what data Watchlfy stores and what your rights are. Please read and confirm.', 'Voici quelles données Watchlfy enregistre et quels sont tes droits. Merci de lire et confirmer.', 'Aquí se explica qué datos guarda Watchlfy y qué derechos tienes. Léelo y confirma.', 'Qui trovi quali dati salva Watchlfy e quali diritti hai. Leggi e conferma.', 'Här står vilka data Watchlfy sparar och vilka rättigheter du har. Läs och bekräfta.', 'Her står, hvilke data Watchlfy gemmer, og hvilke rettigheder du har. Læs og bekræft.'],
    'privacy.bannerTitle': ['Neu: Datenschutzerklärung', 'New: privacy policy', 'Nouveau : politique de confidentialité', 'Nuevo: política de privacidad', 'Novità: informativa sulla privacy', 'Nytt: integritetspolicy', 'Nyt: privatlivspolitik'],
    'privacy.read': ['Lesen', 'Read', 'Lire', 'Leer', 'Leggi', 'Läs', 'Læs'],

    // ------------------------------------------------------------ profile
    'profile.sub': ['{n} Einträge seit {d}', '{n} entries since {d}', '{n} entrées depuis {d}', '{n} entradas desde {d}', '{n} voci dal {d}', '{n} poster sedan {d}', '{n} poster siden {d}'],
    'profile.subEmpty': ['Noch nichts importiert', 'Nothing imported yet', 'Rien d’importé', 'Nada importado aún', 'Ancora nulla importato', 'Inget importerat ännu', 'Intet importeret endnu'],

    // ------------------------------------------------------------ progress
    'progress.all': ['Alle', 'All', 'Toutes', 'Todas', 'Tutte', 'Alla', 'Alle'],
    'progress.complete': ['Komplett gesehen 🎉', 'Fully watched 🎉', 'Vue en entier 🎉', 'Vista entera 🎉', 'Vista tutta 🎉', 'Helt sedd 🎉', 'Set helt 🎉'],
    'progress.done': ['Fertig', 'Finished', 'Terminées', 'Terminadas', 'Finite', 'Klara', 'Færdige'],
    'progress.ended': ['abgeschlossen', 'ended', 'terminée', 'finalizada', 'conclusa', 'avslutad', 'afsluttet'],
    'progress.none': ['Noch keine Serien mit TMDB-Daten.', 'No series with TMDB data yet.', 'Pas encore de séries avec données TMDB.', 'Aún no hay series con datos de TMDB.', 'Ancora nessuna serie con dati TMDB.', 'Inga serier med TMDB-data ännu.', 'Ingen serier med TMDB-data endnu.'],
    'progress.open': ['Offen', 'In progress', 'En cours', 'A medias', 'In corso', 'Pågående', 'I gang'],
    'progress.season': ['Staffel {s}: {a} von {b}', 'Season {s}: {a} of {b}', 'Saison {s} : {a} sur {b}', 'Temporada {s}: {a} de {b}', 'Stagione {s}: {a} di {b}', 'Säsong {s}: {a} av {b}', 'Sæson {s}: {a} af {b}'],
    'progress.sub': ['Gesehene Folgen im Vergleich zu allen Folgen (TMDB, ohne Specials)', 'Episodes watched vs. all episodes (TMDB, without specials)', 'Épisodes vus sur le total (TMDB, hors spéciaux)', 'Episodios vistos frente al total (TMDB, sin especiales)', 'Episodi visti sul totale (TMDB, senza speciali)', 'Sedda avsnitt mot alla avsnitt (TMDB, utan specialavsnitt)', 'Sete afsnit mod alle afsnit (TMDB, uden specials)'],
    'progress.title': ['Serien-Fortschritt', 'Series progress', 'Progression des séries', 'Progreso de series', 'Avanzamento serie', 'Seriers framsteg', 'Seriefremskridt'],
    'progress.unnumbered': ['{n} ohne Folgennummer', '{n} without episode number', '{n} sans numéro', '{n} sin número', '{n} senza numero', '{n} utan avsnittsnummer', '{n} uden afsnitsnummer'],

    // ------------------------------------------------------------ pw
    'pw.changed': ['Passwort geändert.', 'Password changed.', 'Mot de passe modifié.', 'Contraseña cambiada.', 'Password modificata.', 'Lösenordet har ändrats.', 'Adgangskoden er ændret.'],
    'pw.current': ['Aktuelles Passwort:', 'Current password:', 'Mot de passe actuel :', 'Contraseña actual:', 'Password attuale:', 'Nuvarande lösenord:', 'Nuværende adgangskode:'],
    'pw.mismatch': ['Die Passwörter stimmen nicht überein.', 'The passwords don’t match.', 'Les mots de passe ne correspondent pas.', 'Las contraseñas no coinciden.', 'Le password non coincidono.', 'Lösenorden matchar inte.', 'Adgangskoderne stemmer ikke overens.'],
    'pw.new': ['Neues Passwort (mindestens 8 Zeichen):', 'New password (at least 8 characters):', 'Nouveau mot de passe (8 caractères min.) :', 'Nueva contraseña (mínimo 8 caracteres):', 'Nuova password (almeno 8 caratteri):', 'Nytt lösenord (minst 8 tecken):', 'Ny adgangskode (mindst 8 tegn):'],
    'pw.repeat': ['Neues Passwort wiederholen:', 'Repeat new password:', 'Répète le nouveau mot de passe :', 'Repite la nueva contraseña:', 'Ripeti la nuova password:', 'Upprepa nytt lösenord:', 'Gentag ny adgangskode:'],

    // ------------------------------------------------------------ range
    'range.30d': ['30 T', '30 d', '30 j', '30 d', '30 g', '30 d', '30 d'],
    'range.365d': ['1 J', '1 y', '1 an', '1 a', '1 a', '1 år', '1 år'],
    'range.7d': ['7 T', '7 d', '7 j', '7 d', '7 g', '7 d', '7 d'],
    'range.90d': ['90 T', '90 d', '90 j', '90 d', '90 g', '90 d', '90 d'],
    'range.all': ['Alles', 'All', 'Tout', 'Todo', 'Tutto', 'Allt', 'Alt'],

    // ------------------------------------------------------------ rb
    'rb.views': ['{n}× gesehen', 'watched {n}×', 'vu {n}×', 'visto {n}×', 'visto {n}×', 'sedd {n}×', 'set {n}×'],

    // ------------------------------------------------------------ rel
    'rel.now': ['gerade eben', 'just now', 'à l’instant', 'ahora mismo', 'proprio ora', 'just nu', 'lige nu'],

    // ------------------------------------------------------------ review
    'review.allGood': ['Alles zugeordnet.', 'Everything is matched.', 'Tout est associé.', 'Todo asignado.', 'Tutto abbinato.', 'Allt är matchat.', 'Alt er matchet.'],
    'review.sub': ['Unsichere oder fehlende TMDB-Treffer korrigieren', 'Fix uncertain or missing TMDB matches', 'Corriger les correspondances TMDB douteuses', 'Corrige coincidencias de TMDB dudosas o ausentes', 'Correggi abbinamenti TMDB incerti o mancanti', 'Rätta osäkra eller saknade TMDB-träffar', 'Ret usikre eller manglende TMDB-match'],
    'review.title': ['Zuordnungen prüfen', 'Review matches', 'Vérifier les correspondances', 'Revisar coincidencias', 'Controlla abbinamenti', 'Granska träffar', 'Tjek matches'],

    // ------------------------------------------------------------ role
    'role.admin': ['Admin', 'Admin', 'Admin', 'Admin', 'Admin', 'Admin', 'Admin'],
    'role.country': ['Land', 'Country', 'Pays', 'País', 'Paese', 'Land', 'Land'],
    'role.date': ['Datum', 'Date', 'Date', 'Fecha', 'Data', 'Datum', 'Dato'],
    'role.device': ['Gerät', 'Device', 'Appareil', 'Dispositivo', 'Dispositivo', 'Enhet', 'Enhed'],
    'role.duration': ['Dauer', 'Duration', 'Durée', 'Duración', 'Durata', 'Längd', 'Varighed'],
    'role.episode': ['Folgennummer', 'Episode number', 'N° d’épisode', 'Nº de episodio', 'N. episodio', 'Avsnittsnummer', 'Afsnitsnummer'],
    'role.episodeTitle': ['Folgentitel', 'Episode title', 'Titre de l’épisode', 'Título del episodio', 'Titolo episodio', 'Avsnittstitel', 'Afsnitstitel'],
    'role.kind': ['Art (Film/Serie)', 'Type (movie/series)', 'Type (film/série)', 'Tipo (película/serie)', 'Tipo (film/serie)', 'Typ (film/serie)', 'Type (film/serie)'],
    'role.profile': ['Profil', 'Profile', 'Profil', 'Perfil', 'Profilo', 'Profil', 'Profil'],
    'role.season': ['Staffel', 'Season', 'Saison', 'Temporada', 'Stagione', 'Säsong', 'Sæson'],
    'role.series': ['Serie', 'Series', 'Série', 'Serie', 'Serie', 'Serie', 'Serie'],
    'role.start': ['Startzeit', 'Start time', 'Heure de début', 'Hora de inicio', 'Ora di inizio', 'Starttid', 'Starttid'],
    'role.title': ['Titel', 'Title', 'Titre', 'Título', 'Titolo', 'Titel', 'Titel'],
    'role.type': ['Trailer-Kennzeichen', 'Trailer marker', 'Marqueur bande-annonce', 'Marca de tráiler', 'Indicatore trailer', 'Trailermarkering', 'Trailermarkering'],

    // ------------------------------------------------------------ search
    'search.none': ['Nichts gefunden.', 'Nothing found.', 'Aucun résultat.', 'Sin resultados.', 'Nessun risultato.', 'Inget hittades.', 'Intet fundet.'],
    'search.placeholder': ['Serie, Film oder Folge suchen …', 'Search series, movie or episode …', 'Chercher une série, un film, un épisode …', 'Buscar serie, película o episodio …', 'Cerca serie, film o episodio …', 'Sök serie, film eller avsnitt …', 'Søg serie, film eller afsnit …'],

    // ------------------------------------------------------------ season
    'season.autumn': ['Herbst', 'Autumn', 'Automne', 'Otoño', 'Autunno', 'Höst', 'Efterår'],
    'season.spring': ['Frühling', 'Spring', 'Printemps', 'Primavera', 'Primavera', 'Vår', 'Forår'],
    'season.summer': ['Sommer', 'Summer', 'Été', 'Verano', 'Estate', 'Sommar', 'Sommer'],
    'season.text': ['<b>{name} {icon}</b> – ab {date} wechselt die Farbwelt zu {next} {nicon}', '<b>{name} {icon}</b> – switches to {next} {nicon} on {date}', '<b>{name} {icon}</b> – passe à {next} {nicon} le {date}', '<b>{name} {icon}</b> – cambia a {next} {nicon} el {date}', '<b>{name} {icon}</b> – passa a {next} {nicon} il {date}', '<b>{name} {icon}</b> – byter till {next} {nicon} den {date}', '<b>{name} {icon}</b> – skifter til {next} {nicon} den {date}'],
    'season.winter': ['Winter', 'Winter', 'Hiver', 'Invierno', 'Inverno', 'Vinter', 'Vinter'],

    // ------------------------------------------------------------ service
    'service.other': ['Andere', 'Other', 'Autre', 'Otro', 'Altro', 'Annan', 'Anden'],
    'service.trakt': ['Trakt', 'Trakt', 'Trakt', 'Trakt', 'Trakt', 'Trakt', 'Trakt'],

    // ------------------------------------------------------------ services
    'services.sub': ['Wo du am meisten schaust', 'Where you watch the most', 'Où tu regardes le plus', 'Dónde ves más', 'Dove guardi di più', 'Var du tittar mest', 'Hvor du ser mest'],
    'services.title': ['Dienste', 'Services', 'Services', 'Servicios', 'Servizi', 'Tjänster', 'Tjenester'],

    // ------------------------------------------------------------ settings
    'settings.appearance': ['Darstellung', 'Appearance', 'Apparence', 'Apariencia', 'Aspetto', 'Utseende', 'Udseende'],
    'settings.festive': ['Festliche Effekte', 'Festive effects', 'Effets festifs', 'Efectos festivos', 'Effetti festivi', 'Festliga effekter', 'Festlige effekter'],
    'settings.festiveActive': ['Gerade aktiv: {e}', 'Active now: {e}', 'Actif : {e}', 'Activo ahora: {e}', 'Attivo ora: {e}', 'Aktivt nu: {e}', 'Aktiv nu: {e}'],
    'settings.festiveHint': ['Kleine Animationen zu Fasching, Ostern, Midsommar, Halloween, Weihnachten, Neujahr und deinem Geburtstag – inklusive geschmückter Videothek.', 'Little animations for carnival, Easter, midsummer, Halloween, Christmas, New Year and your birthday – including a decorated video store.', 'Petites animations pour carnaval, Pâques, la Saint-Jean, Halloween, Noël, le Nouvel An et ton anniversaire – vidéoclub décoré compris.', 'Pequeñas animaciones en carnaval, Pascua, San Juan, Halloween, Navidad, Año Nuevo y tu cumpleaños, con videoclub decorado.', 'Piccole animazioni per carnevale, Pasqua, mezza estate, Halloween, Natale, Capodanno e il tuo compleanno – videoteca addobbata inclusa.', 'Små animationer till karneval, påsk, midsommar, halloween, jul, nyår och din födelsedag – med pyntad videobutik.', 'Små animationer til fastelavn, påske, sankthans, halloween, jul, nytår og din fødselsdag – med pyntet videobutik.'],
    'settings.festiveNext': ['Nächstes Event: {e} am {d}', 'Next event: {e} on {d}', 'Prochain événement : {e} le {d}', 'Próximo evento: {e} el {d}', 'Prossimo evento: {e} il {d}', 'Nästa: {e} den {d}', 'Næste: {e} den {d}'],
    'settings.glass': ['Liquid Glass', 'Liquid Glass', 'Liquid Glass', 'Liquid Glass', 'Liquid Glass', 'Liquid Glass', 'Liquid Glass'],
    'settings.glassHint': ['Durchscheinende Glas-Oberflächen mit Lichtkanten – passt zu jedem Farbschema.', 'Translucent glass surfaces with light edges – works with every colour scheme.', 'Surfaces en verre translucide aux reflets lumineux – compatible avec chaque thème.', 'Superficies de cristal translúcido con bordes de luz – con cualquier tema.', 'Superfici in vetro traslucido con riflessi – con ogni tema.', 'Genomskinliga glasytor med ljuskanter – passar alla färgteman.', 'Gennemsigtige glasflader med lyskanter – passer til alle farvetemaer.'],
    'settings.language': ['Sprache', 'Language', 'Langue', 'Idioma', 'Lingua', 'Språk', 'Sprog'],
    'settings.sub': ['Gilt auf allen deinen Geräten', 'Applies on all your devices', 'S’applique à tous tes appareils', 'Se aplica en todos tus dispositivos', 'Vale su tutti i tuoi dispositivi', 'Gäller på alla dina enheter', 'Gælder på alle dine enheder'],
    'settings.title': ['Einstellungen', 'Settings', 'Paramètres', 'Ajustes', 'Impostazioni', 'Inställningar', 'Indstillinger'],

    // ------------------------------------------------------------ shop
    'shop.freeText': ['Zum Testen: Alles in der Videothek ist kostenlos.', 'For testing: everything in the video store is free.', 'Pour tester : tout est gratuit au vidéoclub.', 'Para probar: todo en el videoclub es gratis.', 'Per test: in videoteca tutto è gratis.', 'För test: allt i videobutiken är gratis.', 'Til test: alt i videobutikken er gratis.'],
    'shop.freeTitle': ['Videothek gratis (nur dein Admin-Konto)', 'Free video store (your admin account only)', 'Vidéoclub gratuit (ton compte admin)', 'Videoclub gratis (solo tu cuenta admin)', 'Videoteca gratis (solo il tuo account admin)', 'Gratis videobutik (bara ditt adminkonto)', 'Gratis videobutik (kun din admin-konto)'],

    // ------------------------------------------------------------ sources
    'sources.sub': ['Importe je Dienst – erneut hochladen ergänzt nur Neues', 'Imports per service – uploading again only adds new entries', 'Imports par service – réimporter n’ajoute que les nouveautés', 'Importaciones por servicio: volver a subir solo añade lo nuevo', 'Importazioni per servizio: ricaricare aggiunge solo le novità', 'Importer per tjänst – ny uppladdning lägger bara till nytt', 'Importer pr. tjeneste – ny upload tilføjer kun nyt'],
    'sources.title': ['Quellen', 'Sources', 'Sources', 'Fuentes', 'Fonti', 'Källor', 'Kilder'],

    // ------------------------------------------------------------ theme
    'theme.dark': ['Dunkel', 'Dark', 'Sombre', 'Oscuro', 'Scuro', 'Mörkt', 'Mørkt'],
    'theme.hint.dark': ['Dunkle Farbwelt.', 'Dark colour scheme.', 'Thème sombre.', 'Tema oscuro.', 'Tema scuro.', 'Mörkt färgtema.', 'Mørkt farvetema.'],
    'theme.hint.light': ['Helle Farbwelt.', 'Light colour scheme.', 'Thème clair.', 'Tema claro.', 'Tema chiaro.', 'Ljust färgtema.', 'Lyst farvetema.'],
    'theme.hint.season': ['Passend zur Jahreszeit: {s}', 'Matching the season: {s}', 'Selon la saison : {s}', 'Según la estación: {s}', 'In base alla stagione: {s}', 'Efter årstid: {s}', 'Efter årstid: {s}'],
    'theme.hint.system': ['Folgt der Einstellung deines Geräts – gerade {x}.', 'Follows your device setting – currently {x}.', 'Suit le réglage de ton appareil – actuellement {x}.', 'Sigue el ajuste de tu dispositivo: ahora {x}.', 'Segue l’impostazione del dispositivo – ora {x}.', 'Följer enhetens inställning – just nu {x}.', 'Følger din enheds indstilling – lige nu {x}.'],
    'theme.light': ['Hell', 'Light', 'Clair', 'Claro', 'Chiaro', 'Ljust', 'Lyst'],
    'theme.season': ['Jahreszeit', 'Seasons', 'Saisons', 'Estaciones', 'Stagioni', 'Årstider', 'Årstider'],
    'theme.system': ['System', 'System', 'Système', 'Sistema', 'Sistema', 'System', 'System'],
    'theme.word.dark': ['dunkel', 'dark', 'sombre', 'oscuro', 'scuro', 'mörkt', 'mørkt'],
    'theme.word.light': ['hell', 'light', 'clair', 'claro', 'chiaro', 'ljust', 'lyst'],

    // ------------------------------------------------------------ time
    'time.hour': ['{h} Uhr', '{h}:00', '{h} h', '{h}:00', 'ore {h}', 'kl. {h}', 'kl. {h}'],
    'time.range': ['{a}–{b} Uhr', '{a}:00–{b}:00', '{a} h–{b} h', '{a}:00–{b}:00', '{a}–{b}', 'kl. {a}–{b}', 'kl. {a}–{b}'],

    // ------------------------------------------------------------ timeline
    'timeline.capDay': ['Ø {avg} pro Tag · Spitze {max}', 'avg {avg} per day · peak {max}', 'moy. {avg} par jour · pic {max}', 'media {avg} al día · máx. {max}', 'media {avg} al giorno · picco {max}', 'snitt {avg} per dag · topp {max}', 'gns. {avg} pr. dag · top {max}'],
    'timeline.capWeek': ['Ø {avg} pro Woche · Spitze {max}', 'avg {avg} per week · peak {max}', 'moy. {avg} par semaine · pic {max}', 'media {avg} por semana · máx. {max}', 'media {avg} a settimana · picco {max}', 'snitt {avg} per vecka · topp {max}', 'gns. {avg} pr. uge · top {max}'],
    'timeline.weekOf': ['Woche ab {d}', 'Week of {d}', 'Semaine du {d}', 'Semana del {d}', 'Settimana dal {d}', 'Vecka från {d}', 'Uge fra {d}'],

    // ------------------------------------------------------------ times
    'times.byDay': ['Nach Wochentag', 'By weekday', 'Par jour', 'Por día', 'Per giorno', 'Per veckodag', 'Pr. ugedag'],
    'times.byDaySub': ['Schauzeit je Wochentag', 'Watch time per weekday', 'Temps par jour', 'Tiempo por día', 'Tempo per giorno', 'Tittartid per veckodag', 'Seertid pr. ugedag'],
    'times.byHour': ['Nach Uhrzeit', 'By hour', 'Par heure', 'Por hora', 'Per ora', 'Per timme', 'Pr. time'],
    'times.byHourSub': ['Schauzeit je Stunde', 'Watch time per hour', 'Temps par heure', 'Tiempo por hora', 'Tempo per ora', 'Tittartid per timme', 'Seertid pr. time'],
    'times.less': ['weniger', 'less', 'moins', 'menos', 'meno', 'mindre', 'mindre'],
    'times.more': ['mehr', 'more', 'plus', 'más', 'più', 'mer', 'mere'],
    'times.sub': ['Schauzeit nach Wochentag und Uhrzeit', 'Watch time by weekday and hour', 'Temps par jour et par heure', 'Tiempo por día y hora', 'Tempo per giorno e ora', 'Tittartid per veckodag och timme', 'Seertid efter ugedag og time'],
    'times.subUntimed': ['Schauzeit nach Wochentag und Uhrzeit · {n} Einträge ohne Uhrzeit sind nicht enthalten', 'Watch time by weekday and hour · {n} entries without a time are not included', 'Par jour et heure · {n} entrées sans heure non comprises', 'Por día y hora · no se incluyen {n} entradas sin hora', 'Per giorno e ora · {n} voci senza orario escluse', 'Per veckodag och timme · {n} poster utan klockslag ingår inte', 'Efter ugedag og time · {n} poster uden klokkeslæt er ikke med'],
    'times.title': ['Wann du schaust', 'When you watch', 'Quand tu regardes', 'Cuándo ves', 'Quando guardi', 'När du tittar', 'Hvornår du ser'],

    // ------------------------------------------------------------ tmdb
    'tmdb.loadingText': ['Noch {n} Titel offen – das läuft im Hintergrund weiter.', '{n} titles left – this keeps running in the background.', 'Encore {n} titres – cela continue en arrière-plan.', 'Quedan {n} títulos; sigue en segundo plano.', 'Ancora {n} titoli – prosegue in background.', '{n} titlar kvar – fortsätter i bakgrunden.', '{n} titler tilbage – fortsætter i baggrunden.'],
    'tmdb.loadingTitle': ['Poster & Infos werden geladen', 'Loading posters & info', 'Chargement des affiches', 'Cargando pósteres e info', 'Caricamento locandine', 'Laddar affischer & info', 'Indlæser plakater & info'],
    'tmdb.offText': ['Der Betreiber hat noch keinen TMDB-Schlüssel hinterlegt (TMDB_API_KEY). Zeiten werden geschätzt, Genres und Fortschritt fehlen.', 'The operator hasn’t set a TMDB key yet (TMDB_API_KEY). Times are estimated; genres and progress are missing.', 'L’administrateur n’a pas encore configuré de clé TMDB (TMDB_API_KEY). Durées estimées, genres et progression absents.', 'El operador aún no ha configurado la clave de TMDB (TMDB_API_KEY). Tiempos estimados; faltan géneros y progreso.', 'Il gestore non ha ancora impostato la chiave TMDB (TMDB_API_KEY). Tempi stimati, mancano generi e avanzamento.', 'Operatören har inte lagt in någon TMDB-nyckel ännu (TMDB_API_KEY). Tider uppskattas; genrer och framsteg saknas.', 'Operatøren har endnu ikke angivet en TMDB-nøgle (TMDB_API_KEY). Tider anslås; genrer og fremskridt mangler.'],
    'tmdb.offTitle': ['Ohne Poster & Metadaten', 'No posters & metadata', 'Sans affiches ni métadonnées', 'Sin pósteres ni metadatos', 'Senza locandine e metadati', 'Utan affischer & metadata', 'Uden plakater & metadata'],
    'tmdb.reviewBtn': ['Prüfen', 'Review', 'Vérifier', 'Revisar', 'Controlla', 'Granska', 'Tjek'],
    'tmdb.reviewText.one': ['Bei {n} Titel war die Zuordnung unsicher.', 'The match was uncertain for {n} title.', 'Correspondance incertaine pour {n} titre.', 'La coincidencia fue dudosa en {n} título.', 'Abbinamento incerto per {n} titolo.', 'Träffen var osäker för {n} titel.', 'Matchet var usikkert for {n} titel.'],
    'tmdb.reviewText.other': ['Bei {n} Titeln war die Zuordnung unsicher.', 'The match was uncertain for {n} titles.', 'Correspondance incertaine pour {n} titres.', 'La coincidencia fue dudosa en {n} títulos.', 'Abbinamento incerto per {n} titoli.', 'Träffen var osäker för {n} titlar.', 'Matchet var usikkert for {n} titler.'],
    'tmdb.reviewTitle': ['Ein paar Titel prüfen?', 'Check a few titles?', 'Vérifier quelques titres ?', '¿Revisar algunos títulos?', 'Controllare alcuni titoli?', 'Kolla några titlar?', 'Tjek et par titler?'],

    // ------------------------------------------------------------ toast
    'toast.settingsFailed': ['Einstellung nicht gespeichert: {e}', 'Setting not saved: {e}', 'Réglage non enregistré : {e}', 'Ajuste no guardado: {e}', 'Impostazione non salvata: {e}', 'Inställningen sparades inte: {e}', 'Indstillingen blev ikke gemt: {e}'],

    // ------------------------------------------------------------ top
    'top.actors': ['Schauspieler', 'Actors', 'Acteurs', 'Actores', 'Attori', 'Skådespelare', 'Skuespillere'],
    'top.actorsSub': ['Wen du am häufigsten siehst (Hauptbesetzung)', 'Who you see most (main cast)', 'Qui tu vois le plus (distribution principale)', 'A quién ves más (reparto principal)', 'Chi vedi di più (cast principale)', 'Vem du ser mest (huvudroller)', 'Hvem du ser mest (hovedroller)'],
    'top.countries': ['Länder', 'Countries', 'Pays', 'Países', 'Paesi', 'Länder', 'Lande'],
    'top.countriesSub': ['Herkunftsland der Produktionen', 'Country of origin of the productions', 'Pays d’origine des productions', 'País de origen de las producciones', 'Paese d’origine delle produzioni', 'Produktionernas ursprungsland', 'Produktionernes oprindelsesland'],
    'top.genres': ['Genres', 'Genres', 'Genres', 'Géneros', 'Generi', 'Genrer', 'Genrer'],
    'top.genresSub': ['Schauzeit je Genre (TMDB)', 'Watch time per genre (TMDB)', 'Temps par genre (TMDB)', 'Tiempo por género (TMDB)', 'Tempo per genere (TMDB)', 'Tittartid per genre (TMDB)', 'Seertid pr. genre (TMDB)'],
    'top.movies': ['Filme', 'Movies', 'Films', 'Películas', 'Film', 'Filmer', 'Film'],
    'top.moviesSub': ['Nach Schauzeit – mehrfach gesehene zählen mehrfach', 'By watch time – rewatches count again', 'Par temps – les revisionnages comptent', 'Por tiempo; las repeticiones cuentan', 'Per tempo – le revisioni contano', 'Efter tittartid – omtittningar räknas', 'Efter seertid – genseninger tæller'],
    'top.needsTmdb': ['Dafür braucht Watchlfy Daten von TMDB (TMDB_API_KEY).', 'This needs data from TMDB (TMDB_API_KEY).', 'Nécessite les données TMDB (TMDB_API_KEY).', 'Requiere datos de TMDB (TMDB_API_KEY).', 'Servono i dati TMDB (TMDB_API_KEY).', 'Kräver data från TMDB (TMDB_API_KEY).', 'Kræver data fra TMDB (TMDB_API_KEY).'],
    'top.series': ['Serien', 'Series', 'Séries', 'Series', 'Serie', 'Serier', 'Serier'],
    'top.seriesSub': ['Nach Schauzeit im Zeitraum', 'By watch time in this period', 'Par temps de visionnage', 'Por tiempo visto', 'Per tempo di visione', 'Efter tittartid', 'Efter seertid'],

    // ------------------------------------------------------------ trakt
    'trakt.connect': ['Mit Trakt verbinden', 'Connect with Trakt', 'Connecter Trakt', 'Conectar con Trakt', 'Collega Trakt', 'Anslut Trakt', 'Forbind med Trakt'],
    'trakt.connected': ['Trakt verbunden – dein Verlauf wird geholt.', 'Trakt connected – fetching your history.', 'Trakt connecté – récupération de l’historique.', 'Trakt conectado; obteniendo tu historial.', 'Trakt collegato – scarico la cronologia.', 'Trakt anslutet – hämtar din historik.', 'Trakt forbundet – henter din historik.'],
    'trakt.disconnect': ['Trennen', 'Disconnect', 'Déconnecter', 'Desconectar', 'Scollega', 'Koppla från', 'Afbryd'],
    'trakt.disconnectConfirm': ['Trakt trennen? Bereits geholte Einträge bleiben erhalten.', 'Disconnect Trakt? Entries already fetched are kept.', 'Déconnecter Trakt ? Les entrées déjà récupérées restent.', '¿Desconectar Trakt? Se conservan las entradas ya obtenidas.', 'Scollegare Trakt? Le voci già scaricate restano.', 'Koppla från Trakt? Redan hämtade poster finns kvar.', 'Afbryd Trakt? Allerede hentede poster bevares.'],
    'trakt.error': ['Fehler', 'Error', 'Erreur', 'Error', 'Errore', 'Fel', 'Fejl'],
    'trakt.failed': ['Trakt-Verbindung fehlgeschlagen ({e}).', 'Trakt connection failed ({e}).', 'Échec de la connexion Trakt ({e}).', 'Falló la conexión con Trakt ({e}).', 'Connessione Trakt non riuscita ({e}).', 'Trakt-anslutningen misslyckades ({e}).', 'Trakt-forbindelsen mislykkedes ({e}).'],
    'trakt.hint': ['Du meldest dich bei Trakt an, nicht bei Watchlfy – dein Trakt-Passwort sieht Watchlfy nie.', 'You sign in at Trakt, not at Watchlfy – Watchlfy never sees your Trakt password.', 'Tu te connectes chez Trakt – Watchlfy ne voit jamais ton mot de passe.', 'Inicias sesión en Trakt; Watchlfy nunca ve tu contraseña.', 'Accedi su Trakt: Watchlfy non vede mai la tua password.', 'Du loggar in hos Trakt – Watchlfy ser aldrig ditt lösenord.', 'Du logger ind hos Trakt – Watchlfy ser aldrig din adgangskode.'],
    'trakt.lastSync': ['Letzter Abgleich', 'Last sync', 'Dernière synchro', 'Última sincronización', 'Ultima sincronizzazione', 'Senaste synk', 'Seneste synk'],
    'trakt.notConfigured': ['Trakt ist auf diesem Server nicht eingerichtet (TRAKT_CLIENT_ID fehlt).', 'Trakt is not set up on this server (TRAKT_CLIENT_ID is missing).', 'Trakt n’est pas configuré sur ce serveur (TRAKT_CLIENT_ID manquant).', 'Trakt no está configurado en este servidor (falta TRAKT_CLIENT_ID).', 'Trakt non è configurato su questo server (manca TRAKT_CLIENT_ID).', 'Trakt är inte konfigurerat på servern (TRAKT_CLIENT_ID saknas).', 'Trakt er ikke sat op på serveren (TRAKT_CLIENT_ID mangler).'],
    'trakt.sub': ['Automatisch synchronisieren – alle 30 Min.', 'Sync automatically – every 30 min', 'Synchronisation automatique – toutes les 30 min', 'Sincronización automática cada 30 min', 'Sincronizzazione automatica ogni 30 min', 'Synka automatiskt – var 30:e minut', 'Synkroniser automatisk – hvert 30. minut'],
    'trakt.syncNow': ['Jetzt abgleichen', 'Sync now', 'Synchroniser', 'Sincronizar ahora', 'Sincronizza ora', 'Synka nu', 'Synk nu'],
    'trakt.synced': ['{n} neue Einträge von Trakt.', '{n} new entries from Trakt.', '{n} nouvelles entrées de Trakt.', '{n} entradas nuevas de Trakt.', '{n} nuove voci da Trakt.', '{n} nya poster från Trakt.', '{n} nye poster fra Trakt.'],
    'trakt.text': ['Trakt merkt sich, was du schaust (Apps und Plugins für fast jeden Dienst). Watchlfy holt den Verlauf regelmäßig ab und zeigt an, was gerade läuft.', 'Trakt tracks what you watch (apps and plugins for almost any service). Watchlfy fetches your history regularly and shows what’s playing now.', 'Trakt enregistre ce que tu regardes (apps et plugins pour presque tous les services). Watchlfy récupère l’historique et montre ce qui passe.', 'Trakt registra lo que ves (apps y plugins para casi cualquier servicio). Watchlfy recoge el historial y muestra lo que se reproduce.', 'Trakt registra ciò che guardi (app e plugin per quasi ogni servizio). Watchlfy scarica la cronologia e mostra cosa stai guardando.', 'Trakt håller koll på vad du tittar på (appar och tillägg för nästan alla tjänster). Watchlfy hämtar historiken och visar vad som spelas.', 'Trakt holder styr på, hvad du ser (apps og plugins til næsten alle tjenester). Watchlfy henter historikken og viser, hvad der spiller nu.'],
    'trakt.user': ['Trakt-Konto', 'Trakt account', 'Compte Trakt', 'Cuenta de Trakt', 'Account Trakt', 'Trakt-konto', 'Trakt-konto'],

    // ------------------------------------------------------------ unit
    'unit.day.one': ['{n} Tag', '{n} day', '{n} jour', '{n} día', '{n} giorno', '{n} dag', '{n} dag'],
    'unit.day.other': ['{n} Tage', '{n} days', '{n} jours', '{n} días', '{n} giorni', '{n} dagar', '{n} dage'],
    'unit.entry.one': ['{n} Eintrag', '{n} entry', '{n} entrée', '{n} entrada', '{n} voce', '{n} post', '{n} post'],
    'unit.entry.other': ['{n} Einträge', '{n} entries', '{n} entrées', '{n} entradas', '{n} voci', '{n} poster', '{n} poster'],
    'unit.episode.one': ['{n} Folge', '{n} episode', '{n} épisode', '{n} episodio', '{n} episodio', '{n} avsnitt', '{n} afsnit'],
    'unit.episode.other': ['{n} Folgen', '{n} episodes', '{n} épisodes', '{n} episodios', '{n} episodi', '{n} avsnitt', '{n} afsnit'],
    'unit.title.one': ['{n} Titel', '{n} title', '{n} titre', '{n} título', '{n} titolo', '{n} titel', '{n} titel'],
    'unit.title.other': ['{n} Titel', '{n} titles', '{n} titres', '{n} títulos', '{n} titoli', '{n} titlar', '{n} titler'],
    // ------------------------------------------------------------ Rückblick & Story
    'wrapped.title': ['Dein Jahr in Serien {year}', 'Your year in series {year}', 'Ton année en séries {year}', 'Tu año en series {year}', 'Il tuo anno in serie {year}', 'Ditt år i serier {year}', 'Dit år i serier {year}'],
    'wrapped.empty': ['Für dieses Jahr gibt es noch keine Einträge.', 'No entries for this year yet.', 'Pas encore d’entrées pour cette année.', 'Aún no hay entradas este año.', 'Ancora nessuna voce per quest’anno.', 'Inga poster för året ännu.', 'Ingen poster for året endnu.'],
    'wrapped.lead': ['{h} Stunden, {e} Folgen und {m} Filme – Zeit für deinen Rückblick.', '{h} hours, {e} episodes and {m} movies – time for your review.', '{h} heures, {e} épisodes et {m} films – place à ta rétrospective.', '{h} horas, {e} episodios y {m} películas: hora de tu resumen.', '{h} ore, {e} episodi e {m} film – ecco il tuo riepilogo.', '{h} timmar, {e} avsnitt och {m} filmer – dags för din återblick.', '{h} timer, {e} afsnit og {m} film – tid til dit tilbageblik.'],
    'wrapped.start': ['Story abspielen', 'Play story', 'Lancer la story', 'Ver la historia', 'Avvia la storia', 'Spela storyn', 'Afspil storyen'],
    'wrapped.newSeries': ['Neue Serien', 'New series', 'Nouvelles séries', 'Series nuevas', 'Nuove serie', 'Nya serier', 'Nye serier'],
    'wrapped.months': ['Schauzeit je Monat', 'Watch time per month', 'Temps par mois', 'Tiempo por mes', 'Tempo per mese', 'Tittartid per månad', 'Seertid pr. måned'],
    'wrapped.topMonth': ['Stärkster Monat: {m}', 'Biggest month: {m}', 'Meilleur mois : {m}', 'Mes más fuerte: {m}', 'Mese più intenso: {m}', 'Största månad: {m}', 'Største måned: {m}'],
    'wrapped.topMonthShort': ['Top-Monat', 'Top month', 'Mois phare', 'Mes top', 'Mese top', 'Toppmånad', 'Topmåned'],
    'wrapped.promoTitle': ['Dein Jahr in Serien {year} ist da!', 'Your year in series {year} is here!', 'Ton année en séries {year} est là !', '¡Ya está tu año en series {year}!', 'Il tuo anno in serie {year} è pronto!', 'Ditt år i serier {year} är här!', 'Dit år i serier {year} er her!'],
    'wrapped.promoText': ['Deine Lieblingsserien, Binges und Rekorde als Story.', 'Your favourite series, binges and records as a story.', 'Tes séries, binges et records en story.', 'Tus series, maratones y récords en una historia.', 'Serie preferite, maratone e record in una storia.', 'Dina favoritserier, maratoner och rekord som story.', 'Dine yndlingsserier, binges og rekorder som story.'],
    'wrapped.open': ['Ansehen', 'Watch', 'Voir', 'Ver', 'Guarda', 'Visa', 'Se'],
    'story.intro': ['Dein Jahr in Serien {year}', 'Your {year} in series', 'Ton année {year} en séries', 'Tu {year} en series', 'Il tuo {year} in serie', 'Ditt {year} i serier', 'Dit {year} i serier'],
    'story.introText': ['Popcorn bereit? Hier ist, was du geschaut hast.', 'Popcorn ready? Here’s what you watched.', 'Pop-corn prêt ? Voici ce que tu as regardé.', '¿Palomitas listas? Esto es lo que viste.', 'Popcorn pronti? Ecco cosa hai guardato.', 'Popcornen redo? Här är vad du tittade på.', 'Popcorn klar? Her er, hvad du så.'],
    'story.timeKicker': ['So viel Zeit vor dem Bildschirm', 'Time in front of the screen', 'Temps devant l’écran', 'Tiempo frente a la pantalla', 'Tempo davanti allo schermo', 'Tid framför skärmen', 'Tid foran skærmen'],
    'story.timeText': ['Das sind {d} Tage am Stück – mit {e} Folgen und {m} Filmen.', 'That’s {d} days non-stop – with {e} episodes and {m} movies.', 'Soit {d} jours d’affilée – {e} épisodes et {m} films.', 'Son {d} días seguidos: {e} episodios y {m} películas.', 'Sono {d} giorni di fila – {e} episodi e {m} film.', 'Det är {d} dygn i sträck – {e} avsnitt och {m} filmer.', 'Det er {d} døgn i træk – {e} afsnit og {m} film.'],
    'story.seriesKicker': ['Deine Serie des Jahres', 'Your series of the year', 'Ta série de l’année', 'Tu serie del año', 'La tua serie dell’anno', 'Årets serie', 'Årets serie'],
    'story.seriesText': ['{e} Folgen · {h}', '{e} episodes · {h}', '{e} épisodes · {h}', '{e} episodios · {h}', '{e} episodi · {h}', '{e} avsnitt · {h}', '{e} afsnit · {h}'],
    'story.movieKicker': ['Dein Film des Jahres', 'Your movie of the year', 'Ton film de l’année', 'Tu película del año', 'Il tuo film dell’anno', 'Årets film', 'Årets film'],
    'story.movieText': ['Einer von {n} Filmen in diesem Jahr.', 'One of {n} movies this year.', 'Un de tes {n} films cette année.', 'Una de {n} películas este año.', 'Uno dei {n} film di quest’anno.', 'En av {n} filmer i år.', 'En af {n} film i år.'],
    'story.movieTextRe': ['So gut, dass du ihn {n}× gesehen hast.', 'So good you watched it {n}×.', 'Si bien que tu l’as vu {n}×.', 'Tan buena que la viste {n}×.', 'Così bello che l’hai visto {n}×.', 'Så bra att du såg den {n}×.', 'Så god, at du så den {n}×.'],
    'story.genreKicker': ['Dein Genre-Mix', 'Your genre mix', 'Ton mix de genres', 'Tu mezcla de géneros', 'Il tuo mix di generi', 'Din genremix', 'Dit genremix'],
    'story.actor': ['Am häufigsten auf deinem Bildschirm: {a}', 'Most often on your screen: {a}', 'Le plus souvent à l’écran : {a}', 'Quien más viste: {a}', 'Più spesso sul tuo schermo: {a}', 'Oftast på din skärm: {a}', 'Oftest på din skærm: {a}'],
    'story.bingeKicker': ['Dein größter Binge', 'Your biggest binge', 'Ton plus gros binge', 'Tu mayor maratón', 'La tua maratona più grande', 'Din största maraton', 'Dit største binge'],
    'story.rhythmKicker': ['Dein Rhythmus', 'Your rhythm', 'Ton rythme', 'Tu ritmo', 'Il tuo ritmo', 'Din rytm', 'Din rytme'],
    'story.firstKicker': ['Damit fing {year} an', 'This is how {year} began', 'C’est ainsi que {year} a commencé', 'Así empezó {year}', 'Così è iniziato il {year}', 'Så började {year}', 'Sådan startede {year}'],
    'story.outro': ['Abspann – bis nächstes Jahr!', 'Roll credits – see you next year!', 'Générique – à l’an prochain !', 'Créditos: ¡hasta el año que viene!', 'Titoli di coda – al prossimo anno!', 'Eftertexter – vi ses nästa år!', 'Rulletekster – vi ses næste år!'],
    'story.share': ['Teilen', 'Share', 'Partager', 'Compartir', 'Condividi', 'Dela', 'Del'],
    'story.restart': ['Nochmal', 'Again', 'Revoir', 'Otra vez', 'Ancora', 'Igen', 'Igen'],
    'story.back': ['Zurück', 'Back', 'Retour', 'Atrás', 'Indietro', 'Tillbaka', 'Tilbage'],
    'story.next': ['Weiter', 'Next', 'Suivant', 'Siguiente', 'Avanti', 'Nästa', 'Næste'],
    'story.shareText': ['Mein Jahr in Serien {year} mit Watchlfy: {h} Stunden, Lieblingsserie {s}, Film des Jahres {m} 🍿', 'My year in series {year} with Watchlfy: {h} hours, favourite series {s}, movie of the year {m} 🍿', 'Mon année en séries {year} avec Watchlfy : {h} heures, série préférée {s}, film de l’année {m} 🍿', 'Mi año en series {year} con Watchlfy: {h} horas, serie favorita {s}, película del año {m} 🍿', 'Il mio anno in serie {year} con Watchlfy: {h} ore, serie preferita {s}, film dell’anno {m} 🍿', 'Mitt år i serier {year} med Watchlfy: {h} timmar, favoritserie {s}, årets film {m} 🍿', 'Mit år i serier {year} med Watchlfy: {h} timer, yndlingsserie {s}, årets film {m} 🍿'],
    'story.copied': ['In die Zwischenablage kopiert.', 'Copied to clipboard.', 'Copié dans le presse-papiers.', 'Copiado al portapapeles.', 'Copiato negli appunti.', 'Kopierat till urklipp.', 'Kopieret til udklipsholder.'],

    // ------------------------------------------------------------ Freunde
    'friends.requests': ['Anfragen', 'Requests', 'Demandes', 'Solicitudes', 'Richieste', 'Förfrågningar', 'Anmodninger'],
    'friends.accept': ['Annehmen', 'Accept', 'Accepter', 'Aceptar', 'Accetta', 'Acceptera', 'Acceptér'],
    'friends.decline': ['Ablehnen', 'Decline', 'Refuser', 'Rechazar', 'Rifiuta', 'Avböj', 'Afvis'],
    'friends.compare': ['Vergleichen', 'Compare', 'Comparer', 'Comparar', 'Confronta', 'Jämför', 'Sammenlign'],
    'friends.pending': ['wartet', 'pending', 'en attente', 'pendiente', 'in attesa', 'väntar', 'afventer'],
    'friends.cancel': ['Zurückziehen', 'Withdraw', 'Retirer', 'Retirar', 'Ritira', 'Dra tillbaka', 'Træk tilbage'],
    'friends.none': ['Noch keine Freunde – lade jemanden per Benutzername ein.', 'No friends yet – invite someone by username.', 'Pas encore d’amis – invite quelqu’un par son nom.', 'Aún no tienes amigos: invita por nombre de usuario.', 'Ancora nessun amico – invita qualcuno con il nome utente.', 'Inga vänner ännu – bjud in någon via användarnamn.', 'Ingen venner endnu – inviter nogen via brugernavn.'],
    'friends.sum': ['{h} Std. · {e} Folgen · {m} Filme', '{h} h · {e} episodes · {m} movies', '{h} h · {e} épisodes · {m} films', '{h} h · {e} episodios · {m} películas', '{h} h · {e} episodi · {m} film', '{h} tim · {e} avsnitt · {m} filmer', '{h} t · {e} afsnit · {m} film'],
    'friends.vs': ['Du & {u}', 'You & {u}', 'Toi & {u}', 'Tú y {u}', 'Tu & {u}', 'Du & {u}', 'Dig & {u}'],
    'friends.rangeNote': ['Gilt für den oben gewählten Zeitraum', 'For the time range selected above', 'Pour la période choisie', 'Para el periodo elegido', 'Per il periodo scelto', 'För vald period', 'For den valgte periode'],
    'friends.collection': ['Sammlung ansehen', 'View collection', 'Voir la collection', 'Ver colección', 'Vedi collezione', 'Visa samling', 'Se samling'],
    'friends.remove': ['Entfernen', 'Remove', 'Retirer', 'Quitar', 'Rimuovi', 'Ta bort', 'Fjern'],
    'friends.removeConfirm': ['Freundschaft wirklich beenden?', 'Really end this friendship?', 'Vraiment mettre fin à cette amitié ?', '¿Seguro que quieres terminar la amistad?', 'Terminare davvero l’amicizia?', 'Avsluta vänskapen?', 'Afslut venskabet?'],
    'friends.matchHigh': ['Seelenverwandte vor dem Fernseher!', 'Couch soulmates!', 'Âmes sœurs du canapé !', '¡Almas gemelas del sofá!', 'Anime gemelle da divano!', 'Soffsjälsfränder!', 'Sofa-sjælevenner!'],
    'friends.matchMid': ['Ihr habt einiges gemeinsam.', 'You have quite a bit in common.', 'Vous avez pas mal en commun.', 'Tenéis bastante en común.', 'Avete parecchio in comune.', 'Ni har en hel del gemensamt.', 'I har en del til fælles.'],
    'friends.matchLow': ['Ganz unterschiedlicher Geschmack – perfekt für Tipps!', 'Very different taste – perfect for tips!', 'Goûts très différents – idéal pour s’échanger des conseils !', 'Gustos muy distintos: ¡ideal para recomendarse!', 'Gusti molto diversi – perfetto per consigli!', 'Helt olika smak – perfekt för tips!', 'Helt forskellig smag – perfekt til tips!'],
    'friends.shared.one': ['{n} gemeinsamer Titel', '{n} shared title', '{n} titre en commun', '{n} título en común', '{n} titolo in comune', '{n} gemensam titel', '{n} fælles titel'],
    'friends.shared.other': ['{n} gemeinsame Titel', '{n} shared titles', '{n} titres en commun', '{n} títulos en común', '{n} titoli in comune', '{n} gemensamma titlar', '{n} fælles titler'],
    'friends.sharedTitle': ['Das schaut ihr beide', 'You both watch', 'Vous regardez tous les deux', 'Lo veis los dos', 'Lo guardate entrambi', 'Det tittar ni båda på', 'Det ser I begge'],
    'friends.youThem': ['du {a} · {b}', 'you {a} · {b}', 'toi {a} · {b}', 'tú {a} · {b}', 'tu {a} · {b}', 'du {a} · {b}', 'dig {a} · {b}'],
    'friends.you': ['Du', 'You', 'Toi', 'Tú', 'Tu', 'Du', 'Dig'],
    'friends.nowFriends': ['Ihr seid jetzt befreundet mit {u}!', 'You’re now friends with {u}!', 'Tu es maintenant ami avec {u} !', '¡Ahora eres amigo de {u}!', 'Ora sei amico di {u}!', 'Du och {u} är nu vänner!', 'Du og {u} er nu venner!'],
    'friends.sent': ['Anfrage an {u} gesendet.', 'Request sent to {u}.', 'Demande envoyée à {u}.', 'Solicitud enviada a {u}.', 'Richiesta inviata a {u}.', 'Förfrågan skickad till {u}.', 'Anmodning sendt til {u}.'],
    'err.friendNotFound': ['Benutzer nicht gefunden.', 'User not found.', 'Utilisateur introuvable.', 'Usuario no encontrado.', 'Utente non trovato.', 'Användaren hittades inte.', 'Bruger ikke fundet.'],
    'err.friendSelf': ['Das bist du selbst. 🙂', 'That’s you. 🙂', 'C’est toi. 🙂', 'Eres tú. 🙂', 'Sei tu. 🙂', 'Det är du. 🙂', 'Det er dig. 🙂'],
    'err.friendAlready': ['Ihr seid schon befreundet.', 'You’re already friends.', 'Vous êtes déjà amis.', 'Ya sois amigos.', 'Siete già amici.', 'Ni är redan vänner.', 'I er allerede venner.'],
    'err.friendPending': ['Anfrage wurde schon gesendet.', 'Request already sent.', 'Demande déjà envoyée.', 'Solicitud ya enviada.', 'Richiesta già inviata.', 'Förfrågan redan skickad.', 'Anmodning allerede sendt.'],
    'err.friendLimit': ['Zu viele Freunde.', 'Too many friends.', 'Trop d’amis.', 'Demasiados amigos.', 'Troppi amici.', 'För många vänner.', 'For mange venner.'],
    'err.notFriends': ['Ihr seid nicht befreundet.', 'You’re not friends.', 'Vous n’êtes pas amis.', 'No sois amigos.', 'Non siete amici.', 'Ni är inte vänner.', 'I er ikke venner.'],

    // ------------------------------------------------------------ Sammlung
    'col.title': ['Deine Sammlung', 'Your collection', 'Ta collection', 'Tu colección', 'La tua collezione', 'Din samling', 'Din samling'],
    'col.sub.one': ['{n} Sammlerstück', '{n} collectible', '{n} pièce de collection', '{n} pieza de colección', '{n} pezzo da collezione', '{n} samlarobjekt', '{n} samlerobjekt'],
    'col.sub.other': ['{n} Sammlerstücke', '{n} collectibles', '{n} pièces de collection', '{n} piezas de colección', '{n} pezzi da collezione', '{n} samlarobjekt', '{n} samlerobjekter'],
    'col.teaser': ['{n} Stücke in Regal und Galerie', '{n} pieces on shelf and wall', '{n} pièces en rayon et au mur', '{n} piezas en estante y pared', '{n} pezzi su scaffale e parete', '{n} objekt i hylla och galleri', '{n} stykker på hylde og væg'],
    'col.tab.shelf': ['Regal', 'Shelf', 'Étagère', 'Estante', 'Scaffale', 'Hylla', 'Hylde'],
    'col.tab.store': ['Videothek', 'Video store', 'Vidéoclub', 'Videoclub', 'Videoteca', 'Videobutik', 'Videobutik'],
    'col.tab.screening': ['Vorführraum', 'Screening room', 'Salle de projection', 'Sala de proyección', 'Sala di proiezione', 'Visningsrum', 'Biografsal'],
    'col.tab.notes': ['Kasse', 'Box office', 'Caisse', 'Taquilla', 'Botteghino', 'Kassa', 'Billetluge'],
    'col.empty': ['Dein Regal ist noch leer', 'Your shelf is still empty', 'Ton étagère est encore vide', 'Tu estante aún está vacío', 'Il tuo scaffale è ancora vuoto', 'Din hylla är fortfarande tom', 'Din hylde er stadig tom'],
    'col.emptyText': ['In der Videothek gibt es jeden Tag DVDs, Blu-rays und Plakate deiner eigenen Serien und Filme.', 'Every day the video store has DVDs, Blu-rays and posters of your own series and movies.', 'Chaque jour, le vidéoclub propose DVD, Blu-ray et affiches de tes séries et films.', 'Cada día el videoclub tiene DVD, Blu-ray y pósteres de tus series y películas.', 'Ogni giorno la videoteca ha DVD, Blu-ray e locandine delle tue serie e film.', 'Varje dag har videobutiken dvd, Blu-ray och affischer från dina egna serier och filmer.', 'Hver dag har videobutikken dvd’er, Blu-rays og plakater fra dine egne serier og film.'],
    'col.toStore': ['Zur Videothek', 'To the video store', 'Au vidéoclub', 'Al videoclub', 'Alla videoteca', 'Till videobutiken', 'Til videobutikken'],
    'col.wall': ['DVD- & Blu-ray-Wand', 'DVD & Blu-ray wall', 'Mur de DVD & Blu-ray', 'Pared de DVD y Blu-ray', 'Parete DVD e Blu-ray', 'Dvd- & Blu-ray-vägg', 'Dvd- & Blu-ray-væg'],
    'col.wallSub.one': ['{n} Hülle', '{n} case', '{n} boîtier', '{n} estuche', '{n} custodia', '{n} fodral', '{n} etui'],
    'col.wallSub.other': ['{n} Hüllen', '{n} cases', '{n} boîtiers', '{n} estuches', '{n} custodie', '{n} fodral', '{n} etuier'],
    'col.noDiscs': ['Noch keine DVDs oder Blu-rays.', 'No DVDs or Blu-rays yet.', 'Pas encore de DVD ni de Blu-ray.', 'Aún no hay DVD ni Blu-ray.', 'Ancora nessun DVD o Blu-ray.', 'Inga dvd- eller Blu-ray-skivor ännu.', 'Ingen dvd’er eller Blu-rays endnu.'],
    'col.gallery': ['Filmplakat-Galerie', 'Movie poster gallery', 'Galerie d’affiches', 'Galería de pósteres', 'Galleria di locandine', 'Affischgalleri', 'Plakatgalleri'],
    'col.gallerySub.one': ['{n} Plakat an der Wand', '{n} poster on the wall', '{n} affiche au mur', '{n} póster en la pared', '{n} locandina alla parete', '{n} affisch på väggen', '{n} plakat på væggen'],
    'col.gallerySub.other': ['{n} Plakate an der Wand', '{n} posters on the wall', '{n} affiches au mur', '{n} pósteres en la pared', '{n} locandine alla parete', '{n} affischer på väggen', '{n} plakater på væggen'],
    'col.noPosters': ['Noch keine Plakate.', 'No posters yet.', 'Pas encore d’affiches.', 'Aún no hay pósteres.', 'Ancora nessuna locandina.', 'Inga affischer ännu.', 'Ingen plakater endnu.'],
    'col.details': ['Details', 'Details', 'Détails', 'Detalles', 'Dettagli', 'Detaljer', 'Detaljer'],
    'col.friendTitle': ['Sammlung von {u}', '{u}’s collection', 'Collection de {u}', 'Colección de {u}', 'Collezione di {u}', '{u}s samling', '{u}s samling'],
    'col.friendEmpty': ['Noch nichts gesammelt.', 'Nothing collected yet.', 'Rien de collectionné.', 'Aún no ha coleccionado nada.', 'Ancora niente in collezione.', 'Inget samlat ännu.', 'Intet samlet endnu.'],
    'fmt.dvd': ['DVD', 'DVD', 'DVD', 'DVD', 'DVD', 'Dvd', 'Dvd'],
    'fmt.bluray': ['Blu-ray', 'Blu-ray', 'Blu-ray', 'Blu-ray', 'Blu-ray', 'Blu-ray', 'Blu-ray'],
    'fmt.poster': ['Filmplakat', 'Movie poster', 'Affiche', 'Póster', 'Locandina', 'Filmaffisch', 'Filmplakat'],
    'rar.common': ['gewöhnlich', 'common', 'commun', 'común', 'comune', 'vanlig', 'almindelig'],
    'rar.rare': ['selten', 'rare', 'rare', 'rara', 'rara', 'sällsynt', 'sjælden'],
    'rar.epic': ['episch', 'epic', 'épique', 'épica', 'epica', 'episk', 'episk'],
    'rar.legendary': ['legendär', 'legendary', 'légendaire', 'legendaria', 'leggendaria', 'legendarisk', 'legendarisk'],
    'rar.mythic': ['mythisch', 'mythic', 'mythique', 'mítica', 'mitica', 'mytisk', 'mytisk'],
    'ed.standard': ['Standard-Edition', 'Standard edition', 'Édition standard', 'Edición estándar', 'Edizione standard', 'Standardutgåva', 'Standardudgave'],
    'ed.steelbook': ['Steelbook', 'Steelbook', 'Steelbook', 'Steelbook', 'Steelbook', 'Steelbook', 'Steelbook'],
    'ed.collector': ['Collector’s Edition', 'Collector’s Edition', 'Édition collector', 'Edición coleccionista', 'Edizione da collezione', 'Samlarutgåva', 'Samlerudgave'],
    'ed.collectorShort': ['Collector’s', 'Collector’s', 'Collector', 'Coleccionista', 'Collector', 'Samlar', 'Samler'],
    'ed.signed': ['Signiert', 'Signed', 'Signé', 'Firmado', 'Autografato', 'Signerad', 'Signeret'],
    'ed.holo': ['Holografisch', 'Holographic', 'Holographique', 'Holográfico', 'Olografico', 'Holografisk', 'Holografisk'],
    'ed.print': ['Kinodruck', 'Cinema print', 'Tirage ciné', 'Impresión de cine', 'Stampa da cinema', 'Biotryck', 'Biograftryk'],
    'ed.teaser': ['Teaser-Plakat', 'Teaser poster', 'Affiche teaser', 'Póster teaser', 'Locandina teaser', 'Teaseraffisch', 'Teaserplakat'],
    'ed.vintage': ['Vintage-Plakat', 'Vintage poster', 'Affiche vintage', 'Póster vintage', 'Locandina vintage', 'Vintageaffisch', 'Vintageplakat'],
    'edd.standard': ['Die klassische Hülle – der Anfang jeder Sammlung.', 'The classic case – where every collection starts.', 'Le boîtier classique – le début de toute collection.', 'El estuche clásico: así empieza toda colección.', 'La custodia classica – l’inizio di ogni collezione.', 'Det klassiska fodralet – början på varje samling.', 'Det klassiske etui – begyndelsen på enhver samling.'],
    'edd.steelbook': ['Metallhülle mit edlem Glanz.', 'Metal case with a fine sheen.', 'Boîtier métal au bel éclat.', 'Estuche metálico con brillo elegante.', 'Custodia in metallo lucida.', 'Metallfodral med fin glans.', 'Metaletui med flot glans.'],
    'edd.collector': ['Limitierte Box mit goldener Banderole.', 'Limited box with a golden band.', 'Coffret limité à bandeau doré.', 'Caja limitada con banda dorada.', 'Cofanetto limitato con fascia dorata.', 'Begränsad box med guldband.', 'Begrænset boks med guldbånd.'],
    'edd.signed': ['Mit Unterschrift – ein echtes Liebhaberstück.', 'Signed – a true collector’s piece.', 'Signé – une vraie pièce de collection.', 'Firmado: una auténtica joya.', 'Autografato – un vero pezzo da collezione.', 'Signerad – ett riktigt samlarobjekt.', 'Signeret – et ægte samlerobjekt.'],
    'edd.holo': ['Holografisch schimmernd – extrem selten.', 'Holographic shimmer – extremely rare.', 'Reflets holographiques – extrêmement rare.', 'Brillo holográfico: rarísimo.', 'Riflessi olografici – rarissimo.', 'Holografiskt skimmer – extremt sällsynt.', 'Holografisk skær – ekstremt sjælden.'],
    'edd.print': ['Originalgröße aus dem Kinofoyer.', 'Original size from the cinema lobby.', 'Format original du hall du cinéma.', 'Tamaño original del vestíbulo del cine.', 'Formato originale dal foyer del cinema.', 'Originalstorlek från biofoajén.', 'Originalstørrelse fra biograffoyeren.'],
    'edd.teaser': ['Das geheimnisvolle Vorab-Plakat.', 'The mysterious early teaser.', 'L’affiche teaser mystérieuse.', 'El misterioso póster previo.', 'La misteriosa locandina teaser.', 'Den mystiska teaseraffischen.', 'Den mystiske teaserplakat.'],
    'edd.vintage': ['Gealtert und mit Patina – wie aus den 80ern.', 'Aged with patina – straight from the 80s.', 'Vieillie, patinée – tout droit des années 80.', 'Envejecido con pátina, como de los 80.', 'Invecchiata con patina – come dagli anni 80.', 'Åldrad med patina – som från 80-talet.', 'Ældet med patina – som fra 80’erne.'],
    'shop.enter': ['Eintreten', 'Step inside', 'Entrer', 'Entrar', 'Entra', 'Gå in', 'Gå ind'],
    'shop.open': ['Geöffnet', 'Open', 'Ouvert', 'Abierto', 'Aperto', 'Öppet', 'Åben'],
    'shop.leave': ['Rausgehen', 'Leave', 'Sortir', 'Salir', 'Esci', 'Gå ut', 'Gå ud'],
    'shop.daily': ['Jeden Tag neues Angebot aus deinen Serien & Filmen', 'New offers every day from your series & movies', 'Nouvelles offres chaque jour', 'Ofertas nuevas cada día', 'Nuove offerte ogni giorno', 'Nya erbjudanden varje dag', 'Nye tilbud hver dag'],
    'shop.restock': ['Neue Ware in {t}', 'Restock in {t}', 'Réassort dans {t}', 'Reposición en {t}', 'Rifornimento tra {t}', 'Påfyllning om {t}', 'Nye varer om {t}'],
    'shop.countdown': ['{h} Std. {m} Min.', '{h} h {m} min', '{h} h {m} min', '{h} h {m} min', '{h} h {m} min', '{h} tim {m} min', '{h} t {m} min.'],
    'shop.shelf.tv': ['Serien-Boxen', 'Series box sets', 'Coffrets séries', 'Cajas de series', 'Cofanetti serie', 'Serieboxar', 'Seriebokse'],
    'shop.shelf.movie': ['Filme', 'Movies', 'Films', 'Películas', 'Film', 'Filmer', 'Film'],
    'shop.shelf.poster': ['Plakate', 'Posters', 'Affiches', 'Pósteres', 'Locandine', 'Affischer', 'Plakater'],
    'shop.shelfEmpty': ['Heute leer.', 'Empty today.', 'Vide aujourd’hui.', 'Hoy vacío.', 'Vuoto oggi.', 'Tomt i dag.', 'Tom i dag.'],
    'shop.noPool': ['Die Videothek füllt sich mit deinen Titeln, sobald Poster von TMDB geladen sind.', 'The video store fills up with your titles once posters have loaded from TMDB.', 'Le vidéoclub se remplit dès que les affiches TMDB sont chargées.', 'El videoclub se llena cuando se cargan los pósteres de TMDB.', 'La videoteca si riempie appena le locandine TMDB sono caricate.', 'Videobutiken fylls när affischerna från TMDB har laddats.', 'Videobutikken fyldes, når plakaterne fra TMDB er hentet.'],
    'shop.putBack': ['Zurücklegen', 'Put back', 'Reposer', 'Devolver', 'Rimetti a posto', 'Lägg tillbaka', 'Læg tilbage'],
    'shop.buy': ['Kaufen', 'Buy', 'Acheter', 'Comprar', 'Compra', 'Köp', 'Køb'],
    'shop.tooPoor': ['Dafür fehlen dir noch Filmmeter oder Tickets – schau weiter oder löse Tickets an der Kasse.', 'You need more metres or tickets – keep watching or buy tickets at the box office.', 'Il te manque des mètres ou des tickets – continue à regarder ou passe à la caisse.', 'Te faltan metros o entradas: sigue viendo o pasa por la taquilla.', 'Ti mancano metri o biglietti – continua a guardare o passa al botteghino.', 'Du behöver fler meter eller biljetter – titta vidare eller köp i kassan.', 'Du mangler meter eller billetter – se videre eller køb i billetlugen.'],
    'shop.inCollection': ['In deiner Sammlung', 'In your collection', 'Dans ta collection', 'En tu colección', 'Nella tua collezione', 'I din samling', 'I din samling'],
    'shop.bought': ['„{n}“ steht jetzt in deinem Regal!', '“{n}” is now on your shelf!', '« {n} » est sur ton étagère !', '¡«{n}» ya está en tu estante!', '«{n}» è sul tuo scaffale!', '”{n}” står nu i din hylla!', '”{n}” står nu på din hylde!'],
    'shop.free': ['gratis', 'free', 'gratuit', 'gratis', 'gratis', 'gratis', 'gratis'],
    'shop.freeOn': ['Gratis-Modus', 'Free mode', 'Mode gratuit', 'Modo gratis', 'Modalità gratis', 'Gratisläge', 'Gratistilstand'],
    'scr.title': ['Vorführraum', 'Screening room', 'Salle de projection', 'Sala de proyección', 'Sala di proiezione', 'Visningsrum', 'Biografsal'],
    'scr.text': ['Erkenne deine Serien und Filme am unscharfen Standbild. Je früher du rätst, desto mehr Punkte – 5 Runden pro Tag.', 'Recognise your series and movies from a blurry still. The earlier you guess, the more points – 5 rounds a day.', 'Reconnais tes séries et films sur une image floue. Plus tôt tu devines, plus tu marques – 5 manches par jour.', 'Reconoce tus series y películas en una imagen borrosa. Cuanto antes aciertes, más puntos: 5 rondas al día.', 'Riconosci serie e film da un fotogramma sfocato. Prima indovini, più punti – 5 round al giorno.', 'Känn igen dina serier och filmer på en suddig stillbild. Ju tidigare du gissar, desto fler poäng – 5 rundor per dag.', 'Genkend dine serier og film på et sløret stillbillede. Jo før du gætter, jo flere point – 5 runder om dagen.'],
    'scr.start': ['Vorstellung starten', 'Start the show', 'Lancer la séance', 'Empezar la función', 'Inizia lo spettacolo', 'Starta föreställningen', 'Start forestillingen'],
    'scr.round': ['Runde {a} von {b}', 'Round {a} of {b}', 'Manche {a} sur {b}', 'Ronda {a} de {b}', 'Round {a} di {b}', 'Runda {a} av {b}', 'Runde {a} af {b}'],
    'scr.score': ['{n} Punkte', '{n} points', '{n} points', '{n} puntos', '{n} punti', '{n} poäng', '{n} point'],
    'scr.points': ['Jetzt raten: {n} Punkte', 'Guess now: {n} points', 'Devine maintenant : {n} points', 'Acierta ya: {n} puntos', 'Indovina ora: {n} punti', 'Gissa nu: {n} poäng', 'Gæt nu: {n} point'],
    'scr.sharper': ['Schärfer stellen', 'Sharpen', 'Plus net', 'Enfocar', 'Metti a fuoco', 'Skärpa', 'Skarpere'],
    'scr.alt': ['Unscharfes Standbild', 'Blurred still', 'Image floue', 'Imagen borrosa', 'Fotogramma sfocato', 'Suddig stillbild', 'Sløret stillbillede'],
    'scr.noImage': ['Standbild nicht verfügbar', 'Still not available', 'Image indisponible', 'Imagen no disponible', 'Fotogramma non disponibile', 'Stillbild saknas', 'Stillbillede ikke tilgængeligt'],
    'scr.doneTitle': ['{s} von {m} Punkten!', '{s} of {m} points!', '{s} sur {m} points !', '¡{s} de {m} puntos!', '{s} su {m} punti!', '{s} av {m} poäng!', '{s} af {m} point!'],
    'scr.doneText': ['Morgen läuft eine neue Vorstellung.', 'A new show starts tomorrow.', 'Nouvelle séance demain.', 'Mañana hay nueva función.', 'Domani c’è un nuovo spettacolo.', 'I morgon visas en ny föreställning.', 'I morgen er der en ny forestilling.'],
    'scr.refineTitle': ['Veredeln', 'Refine', 'Améliorer', 'Mejorar', 'Migliora', 'Förädla', 'Forædl'],
    'scr.refineSub': ['Werte Sammlerstücke eine Seltenheit höher auf – bis zur holografischen Ausgabe.', 'Upgrade collectibles one rarity – all the way to holographic.', 'Monte une pièce d’un cran de rareté – jusqu’à l’holographique.', 'Sube una pieza un nivel de rareza, hasta holográfica.', 'Alza di un livello la rarità – fino all’olografica.', 'Uppgradera samlarobjekt ett steg – ända till holografiskt.', 'Opgrader samlerobjekter et trin – helt til holografisk.'],
    'scr.refineTo': ['Zu „{r}“ veredeln', 'Refine to “{r}”', 'Passer en « {r} »', 'Mejorar a «{r}»', 'Porta a «{r}»', 'Förädla till ”{r}”', 'Forædl til ”{r}”'],
    'scr.refined': ['„{n}“ ist jetzt {r}!', '“{n}” is now {r}!', '« {n} » est maintenant {r} !', '¡«{n}» ahora es {r}!', '«{n}» ora è {r}!', '”{n}” är nu {r}!', '”{n}” er nu {r}!'],
    'notes.title': ['Kinokasse', 'Box office', 'Caisse du cinéma', 'Taquilla', 'Botteghino', 'Biljettkassa', 'Billetluge'],
    'notes.sub': ['Mit jeder geschauten Stunde spulst du Filmmeter auf deine Rolle. {n} m ergeben 1 Goldticket für seltene Stücke.', 'Every hour you watch winds film metres onto your reel. {n} m buy 1 golden ticket for rare pieces.', 'Chaque heure regardée enroule des mètres de pellicule. {n} m = 1 ticket doré pour les pièces rares.', 'Cada hora vista enrolla metros de película en tu bobina. {n} m = 1 entrada dorada para piezas raras.', 'Ogni ora guardata avvolge metri di pellicola sulla bobina. {n} m = 1 biglietto d’oro per pezzi rari.', 'Varje timme du tittar spolar filmmeter på din rulle. {n} m blir 1 guldbiljett för sällsynta saker.', 'Hver time du ser, spoler filmmeter på din rulle. {n} m giver 1 guldbillet til sjældne ting.'],
    'earn.title': ['Filmmeter & Tickets verdienen', 'Earn metres & tickets', 'Gagner mètres et tickets', 'Ganar metros y entradas', 'Guadagna metri e biglietti', 'Tjäna meter och biljetter', 'Tjen meter og billetter'],
    'earn.sub': ['Schauen, importieren, rätseln und entdecken', 'Watch, import, guess and discover', 'Regarde, importe, devine et découvre', 'Mira, importa, adivina y descubre', 'Guarda, importa, indovina e scopri', 'Titta, importera, gissa och upptäck', 'Se, importér, gæt og opdag'],
    'earn.repeat': ['wiederholbar', 'repeatable', 'répétable', 'repetible', 'ripetibile', 'upprepas', 'gentages'],
    'earn.visit': ['Täglicher Besuch', 'Daily visit', 'Visite quotidienne', 'Visita diaria', 'Visita giornaliera', 'Dagligt besök', 'Dagligt besøg'],
    'earn.visitSub': ['Einfach Watchlfy öffnen', 'Just open Watchlfy', 'Ouvre simplement Watchlfy', 'Solo abre Watchlfy', 'Basta aprire Watchlfy', 'Öppna bara Watchlfy', 'Bare åbn Watchlfy'],
    'earn.import': ['Ersten Verlauf importieren', 'Import your first history', 'Importer un premier historique', 'Importar tu primer historial', 'Importa la prima cronologia', 'Importera första historiken', 'Importér første historik'],
    'earn.importSub': ['Netflix, Prime, Max …', 'Netflix, Prime, Max …', 'Netflix, Prime, Max …', 'Netflix, Prime, Max …', 'Netflix, Prime, Max …', 'Netflix, Prime, Max …', 'Netflix, Prime, Max …'],
    'earn.trakt': ['Trakt verbinden', 'Connect Trakt', 'Connecter Trakt', 'Conectar Trakt', 'Collega Trakt', 'Anslut Trakt', 'Forbind Trakt'],
    'earn.traktSub': ['Im Profil', 'In your profile', 'Dans le profil', 'En el perfil', 'Nel profilo', 'I profilen', 'I profilen'],
    'earn.friend': ['Ersten Freund hinzufügen', 'Add your first friend', 'Ajouter un premier ami', 'Añadir tu primer amigo', 'Aggiungi il primo amico', 'Lägg till första vännen', 'Tilføj første ven'],
    'earn.friendSub': ['Per Benutzername', 'By username', 'Par nom d’utilisateur', 'Por nombre de usuario', 'Con il nome utente', 'Via användarnamn', 'Via brugernavn'],
    'earn.birthday': ['Geburtstag eintragen', 'Add your birthday', 'Indiquer ton anniversaire', 'Añadir tu cumpleaños', 'Inserisci il compleanno', 'Lägg in födelsedag', 'Angiv fødselsdag'],
    'earn.birthdaySub': ['Am Geburtstag gibt es Gold', 'Gold on your birthday', 'De l’or le jour J', 'Oro en tu cumpleaños', 'Oro al compleanno', 'Guld på födelsedagen', 'Guld på fødselsdagen'],
    'earn.hours': ['{n} Stunden geschaut', '{n} hours watched', '{n} heures regardées', '{n} horas vistas', '{n} ore guardate', '{n} timmar sedda', '{n} timer set'],
    'earn.hoursSub': ['Bisher {h} Std.', 'So far {h} h', 'Jusqu’ici {h} h', 'Hasta ahora {h} h', 'Finora {h} h', 'Hittills {h} tim', 'Indtil nu {h} t'],
    'earn.streak': ['{n} Tage am Stück', '{n} days in a row', '{n} jours d’affilée', '{n} días seguidos', '{n} giorni di fila', '{n} dagar i rad', '{n} dage i træk'],
    'earn.streakSub': ['Bisher {h} Tage', 'So far {h} days', 'Jusqu’ici {h} jours', 'Hasta ahora {h} días', 'Finora {h} giorni', 'Hittills {h} dagar', 'Indtil nu {h} dage'],
    'earn.complete': ['Serie komplett geschaut', 'Finish a series', 'Terminer une série', 'Terminar una serie', 'Finire una serie', 'Se klart en serie', 'Se en serie færdig'],
    'earn.completeSub': ['Je Serie einmal', 'Once per series', 'Une fois par série', 'Una vez por serie', 'Una volta per serie', 'En gång per serie', 'Én gang pr. serie'],
    'earn.quiz': ['Vorführraum-Quiz', 'Screening room quiz', 'Quiz de la salle', 'Quiz de la sala', 'Quiz della sala', 'Visningsrummets quiz', 'Biografsalens quiz'],
    'earn.quizSub': ['Täglich, je nach Punkten', 'Daily, depending on points', 'Chaque jour, selon les points', 'Diario, según puntos', 'Ogni giorno, in base ai punti', 'Dagligen, efter poäng', 'Dagligt, efter point'],
    'earn.gift': ['Verstecktes Geschenk finden', 'Find the hidden gift', 'Trouver le cadeau caché', 'Encontrar el regalo oculto', 'Trova il regalo nascosto', 'Hitta den gömda presenten', 'Find den skjulte gave'],
    'earn.giftSub': ['Irgendwo in der App, einmal am Tag', 'Somewhere in the app, once a day', 'Quelque part dans l’app, une fois par jour', 'En algún lugar de la app, una vez al día', 'Da qualche parte nell’app, una volta al giorno', 'Någonstans i appen, en gång per dag', 'Et sted i appen, én gang om dagen'],
    'earn.wrapped': ['Rückblick bis zum Abspann', 'Watch your review to the credits', 'Rétrospective jusqu’au générique', 'Resumen hasta los créditos', 'Riepilogo fino ai titoli', 'Återblicken till eftertexterna', 'Tilbageblikket til rulleteksterne'],
    'earn.wrappedSub': ['Einmal pro Jahr', 'Once per year', 'Une fois par an', 'Una vez al año', 'Una volta l’anno', 'En gång per år', 'Én gang om året'],
    'earned.starter': ['Startguthaben', 'Starter bonus', 'Bonus de départ', 'Saldo inicial', 'Bonus iniziale', 'Startbonus', 'Startbonus'],
    'earned.visit': ['Täglicher Besuch', 'Daily visit', 'Visite quotidienne', 'Visita diaria', 'Visita giornaliera', 'Dagligt besök', 'Dagligt besøg'],
    'earned.import': ['Erster Import', 'First import', 'Premier import', 'Primera importación', 'Prima importazione', 'Första import', 'Første import'],
    'earned.trakt': ['Trakt verbunden', 'Trakt connected', 'Trakt connecté', 'Trakt conectado', 'Trakt collegato', 'Trakt anslutet', 'Trakt forbundet'],
    'earned.friend': ['Neue Freundschaft', 'New friendship', 'Nouvelle amitié', 'Nueva amistad', 'Nuova amicizia', 'Ny vänskap', 'Nyt venskab'],
    'earned.birthday': ['Geburtstag eingetragen', 'Birthday added', 'Anniversaire ajouté', 'Cumpleaños añadido', 'Compleanno aggiunto', 'Födelsedag tillagd', 'Fødselsdag tilføjet'],
    'earned.bday': ['Alles Gute zum Geburtstag!', 'Happy birthday!', 'Joyeux anniversaire !', '¡Feliz cumpleaños!', 'Buon compleanno!', 'Grattis på födelsedagen!', 'Tillykke med fødselsdagen!'],
    'earned.hours': ['Stunden-Meilenstein', 'Hours milestone', 'Palier d’heures', 'Hito de horas', 'Traguardo di ore', 'Timmilstolpe', 'Timemilepæl'],
    'earned.streak': ['Serie am Stück', 'Streak', 'Série de jours', 'Racha', 'Serie di giorni', 'Svit', 'Stribe'],
    'earned.collect': ['Sammler-Meilenstein', 'Collector milestone', 'Palier de collection', 'Hito de colección', 'Traguardo collezione', 'Samlarmilstolpe', 'Samlermilepæl'],
    'earned.mythic': ['Erstes mythisches Stück', 'First mythic piece', 'Première pièce mythique', 'Primera pieza mítica', 'Primo pezzo mitico', 'Första mytiska objektet', 'Første mytiske objekt'],
    'earned.complete': ['Serie komplett', 'Series finished', 'Série terminée', 'Serie terminada', 'Serie finita', 'Serie klar', 'Serie færdig'],
    'earned.quiz': ['Vorführraum', 'Screening room', 'Salle de projection', 'Sala de proyección', 'Sala di proiezione', 'Visningsrum', 'Biografsal'],
    'earned.wrapped': ['Rückblick angesehen', 'Review watched', 'Rétrospective vue', 'Resumen visto', 'Riepilogo visto', 'Återblick sedd', 'Tilbageblik set'],
    'earned.gift': ['Geschenk gefunden', 'Gift found', 'Cadeau trouvé', 'Regalo encontrado', 'Regalo trovato', 'Present hittad', 'Gave fundet'],
    'gift.found': ['Verstecktes Geschenk öffnen', 'Open the hidden gift', 'Ouvrir le cadeau caché', 'Abrir el regalo oculto', 'Apri il regalo nascosto', 'Öppna den gömda presenten', 'Åbn den skjulte gave'],
    'gift.title': ['Gefunden!', 'Found it!', 'Trouvé !', '¡Encontrado!', 'Trovato!', 'Hittad!', 'Fundet!'],
    'gift.text': ['Morgen versteckt sich das nächste Geschenk woanders.', 'Tomorrow the next gift hides somewhere else.', 'Demain, le prochain cadeau se cache ailleurs.', 'Mañana el próximo regalo estará en otro sitio.', 'Domani il prossimo regalo sarà altrove.', 'I morgon gömmer sig nästa present någon annanstans.', 'I morgen gemmer den næste gave sig et andet sted.'],
    'err.shopGone': ['Dieses Stück gibt es heute nicht mehr.', 'This piece isn’t available today.', 'Cette pièce n’est plus disponible.', 'Esta pieza ya no está disponible hoy.', 'Questo pezzo oggi non c’è più.', 'Objektet finns inte i dag.', 'Objektet findes ikke i dag.'],
    'err.shopOwned': ['Das hast du schon.', 'You already own this.', 'Tu l’as déjà.', 'Ya lo tienes.', 'Ce l’hai già.', 'Den har du redan.', 'Den har du allerede.'],
    'err.shopTooPoor': ['Nicht genug Filmmeter oder Tickets.', 'Not enough metres or tickets.', 'Pas assez de mètres ou de tickets.', 'No tienes suficientes metros o entradas.', 'Metri o biglietti insufficienti.', 'Inte tillräckligt med meter eller biljetter.', 'Ikke nok meter eller billetter.'],
    'err.refineMax': ['Schon mythisch – höher geht es nicht.', 'Already mythic – that’s the top.', 'Déjà mythique – c’est le maximum.', 'Ya es mítica: es el máximo.', 'Già mitico – di più non si può.', 'Redan mytisk – högre går inte.', 'Allerede mytisk – højere kan det ikke blive.'],
    'err.giftTaken': ['Das heutige Geschenk hast du schon geöffnet.', 'You already opened today’s gift.', 'Tu as déjà ouvert le cadeau du jour.', 'Ya abriste el regalo de hoy.', 'Hai già aperto il regalo di oggi.', 'Du har redan öppnat dagens present.', 'Du har allerede åbnet dagens gave.'],
    'err.quizTooFew': ['Für das Quiz brauchst du mindestens 4 Titel mit Standbild.', 'You need at least 4 titles with a still for the quiz.', 'Il faut au moins 4 titres avec image pour le quiz.', 'Necesitas al menos 4 títulos con imagen.', 'Servono almeno 4 titoli con fotogramma.', 'Du behöver minst 4 titlar med stillbild.', 'Du skal bruge mindst 4 titler med stillbillede.'],
    'err.quizRound': ['Diese Runde ist schon vorbei.', 'This round is already over.', 'Cette manche est terminée.', 'Esta ronda ya terminó.', 'Questo round è già finito.', 'Rundan är redan över.', 'Runden er allerede slut.'],

    // ------------------------------------------------------------ Hero
    'hero.label': ['Highlights', 'Highlights', 'À la une', 'Destacados', 'In evidenza', 'Höjdpunkter', 'Højdepunkter'],
    'hero.top': ['Nr. 1 · {r}', 'No. 1 · {r}', 'N° 1 · {r}', 'N.º 1 · {r}', 'N. 1 · {r}', 'Nr 1 · {r}', 'Nr. 1 · {r}'],
    'hero.series': ['Top-Serie · {r}', 'Top series · {r}', 'Série phare · {r}', 'Serie top · {r}', 'Serie top · {r}', 'Toppserie · {r}', 'Topserie · {r}'],
    'hero.movie': ['Top-Film · {r}', 'Top movie · {r}', 'Film phare · {r}', 'Película top · {r}', 'Film top · {r}', 'Toppfilm · {r}', 'Topfilm · {r}'],
    'hero.watched': ['geschaut', 'watched', 'regardé', 'vistos', 'guardati', 'tittat', 'set'],
    'hero.details': ['Details', 'Details', 'Détails', 'Detalles', 'Dettagli', 'Detaljer', 'Detaljer'],
    'range.long.7d': ['letzte 7 Tage', 'last 7 days', '7 derniers jours', 'últimos 7 días', 'ultimi 7 giorni', 'senaste 7 dagarna', 'seneste 7 dage'],
    'range.long.30d': ['letzte 30 Tage', 'last 30 days', '30 derniers jours', 'últimos 30 días', 'ultimi 30 giorni', 'senaste 30 dagarna', 'seneste 30 dage'],
    'range.long.90d': ['letzte 90 Tage', 'last 90 days', '90 derniers jours', 'últimos 90 días', 'ultimi 90 giorni', 'senaste 90 dagarna', 'seneste 90 dage'],
    'range.long.365d': ['letztes Jahr', 'last year', 'dernière année', 'último año', 'ultimo anno', 'senaste året', 'seneste år'],
    'range.long.all': ['aller Zeiten', 'all time', 'de tous les temps', 'de todos los tiempos', 'di sempre', 'genom tiderna', 'nogensinde'],

    // ------------------------------------------------------------ Kanal-Design, Verlauf, Musik, Wohnzimmer
    'shop.discover': ['Neu für dich', 'New to you', 'Nouveau pour toi', 'Nuevo para ti', 'Nuovo per te', 'Nytt för dig', 'Nyt for dig'],
    'shop.discoverNote': ['Hast du noch nie gesehen – gerade angesagt oder hoch bewertet.', 'You’ve never watched this – trending right now or highly rated.', 'Jamais vu – tendance ou très bien noté.', 'Nunca lo has visto: en tendencia o muy valorado.', 'Mai visto – di tendenza o molto votato.', 'Aldrig sett – trendar just nu eller högt betygsatt.', 'Aldrig set – populær lige nu eller højt bedømt.'],
    'rar.fame': ['Bekanntheit', 'Fame', 'Notoriété', 'Fama', 'Notorietà', 'Kändhet', 'Kendthed'],
    'rar.rating': ['{n} Bewertungen', '{n} ratings', '{n} notes', '{n} valoraciones', '{n} voti', '{n} betyg', '{n} bedømmelser'],
    'rar.revenue': ['Einspielergebnis', 'Box office', 'Recettes', 'Taquilla', 'Incassi', 'Biointäkter', 'Billetindtægter'],
    'rar.score': ['Sammlerwert {n} / 100', 'Collector value {n} / 100', 'Valeur de collection {n} / 100', 'Valor de colección {n} / 100', 'Valore da collezione {n} / 100', 'Samlarvärde {n} / 100', 'Samlerværdi {n} / 100'],
    'rar.why': ['Die Seltenheit ergibt sich aus Bekanntheit, Einspielergebnis und Bewertung (TMDB) – je größer der Titel, desto seltener die Ausgabe.', 'Rarity comes from fame, box office and rating (TMDB) – the bigger the title, the rarer the edition.', 'La rareté dépend de la notoriété, des recettes et de la note (TMDB) : plus le titre est grand, plus l’édition est rare.', 'La rareza depende de la fama, la taquilla y la valoración (TMDB): cuanto más grande el título, más rara la edición.', 'La rarità dipende da notorietà, incassi e voto (TMDB): più grande il titolo, più rara l’edizione.', 'Sällsyntheten beror på kändhet, biointäkter och betyg (TMDB) – ju större titel, desto ovanligare utgåva.', 'Sjældenheden afhænger af kendthed, billetindtægter og bedømmelse (TMDB) – jo større titel, desto sjældnere udgave.'],
    'rar.unknown': ['Noch keine TMDB-Kennzahlen – zählt vorerst als gewöhnlich.', 'No TMDB figures yet – counts as common for now.', 'Pas encore de chiffres TMDB – compte comme commun pour l’instant.', 'Aún sin datos de TMDB: cuenta como común por ahora.', 'Ancora nessun dato TMDB – per ora conta come comune.', 'Inga TMDB-siffror ännu – räknas som vanlig tills vidare.', 'Ingen TMDB-tal endnu – tæller som almindelig indtil videre.'],
    'trakt.syncing': ['Gleiche ab …', 'Syncing …', 'Synchronisation …', 'Sincronizando…', 'Sincronizzazione…', 'Synkar …', 'Synkroniserer …'],
    'trakt.checked': ['({t} bei Trakt geprüft, der Rest war schon da)', '({t} checked on Trakt, the rest was already here)', '({t} vérifiées sur Trakt, le reste y était déjà)', '({t} revisadas en Trakt, el resto ya estaba)', '({t} controllate su Trakt, il resto c’era già)', '({t} kontrollerade på Trakt, resten fanns redan)', '({t} tjekket på Trakt, resten var her allerede)'],
    'fold.more.one': ['1 weiteren anzeigen', 'Show 1 more', 'Afficher 1 de plus', 'Mostrar 1 más', 'Mostra 1 altro', 'Visa 1 till', 'Vis 1 mere'],
    'fold.more.other': ['{n} weitere anzeigen', 'Show {n} more', 'Afficher {n} de plus', 'Mostrar {n} más', 'Mostra altri {n}', 'Visa {n} till', 'Vis {n} mere'],
    'progress.seasonShort': ['Staffel {s}', 'Season {s}', 'Saison {s}', 'Temporada {s}', 'Stagione {s}', 'Säsong {s}', 'Sæson {s}'],
    'detail.other': ['Ohne Staffel', 'No season', 'Sans saison', 'Sin temporada', 'Senza stagione', 'Utan säsong', 'Uden sæson'],
    'nav.prev': ['Kanal zurück', 'Previous channel', 'Chaîne précédente', 'Canal anterior', 'Canale precedente', 'Föregående kanal', 'Forrige kanal'],
    'nav.next': ['Kanal weiter', 'Next channel', 'Chaîne suivante', 'Canal siguiente', 'Canale successivo', 'Nästa kanal', 'Næste kanal'],
    'nav.guide': ['Programm', 'Guide', 'Programme', 'Guía', 'Guida', 'Programguide', 'Programoversigt'],
    'nav.onAir': ['läuft', 'on air', 'à l’antenne', 'en emisión', 'in onda', 'sänds', 'sendes'],
    'progress.more.one': ['{n} weitere Serie anzeigen', 'Show {n} more series', 'Afficher {n} série de plus', 'Mostrar {n} serie más', 'Mostra {n} altra serie', 'Visa {n} serie till', 'Vis {n} serie mere'],
    'progress.more.other': ['{n} weitere Serien anzeigen', 'Show {n} more series', 'Afficher {n} séries de plus', 'Mostrar {n} series más', 'Mostra altre {n} serie', 'Visa {n} serier till', 'Vis {n} serier mere'],
    'progress.less': ['Weniger anzeigen', 'Show less', 'Afficher moins', 'Mostrar menos', 'Mostra meno', 'Visa färre', 'Vis færre'],
    'history.week': ['Letzte 7 Tage', 'Last 7 days', '7 derniers jours', 'Últimos 7 días', 'Ultimi 7 giorni', 'Senaste 7 dagarna', 'Sidste 7 dage'],
    'history.titles.one': ['{n} Titel', '{n} title', '{n} titre', '{n} título', '{n} titolo', '{n} titel', '{n} titel'],
    'history.titles.other': ['{n} Titel', '{n} titles', '{n} titres', '{n} títulos', '{n} titoli', '{n} titlar', '{n} titler'],
    'story.mute': ['Musik stummschalten', 'Mute music', 'Couper la musique', 'Silenciar música', 'Disattiva musica', 'Stäng av musiken', 'Slå musikken fra'],
    'story.unmute': ['Musik einschalten', 'Unmute music', 'Remettre la musique', 'Activar música', 'Attiva musica', 'Slå på musiken', 'Slå musikken til'],
    'story.preview': ['Hörprobe · Apple Music', 'Preview · Apple Music', 'Extrait · Apple Music', 'Avance · Apple Music', 'Anteprima · Apple Music', 'Provlyssning · Apple Music', 'Smagsprøve · Apple Music'],
    'tv.noSignal': ['Kein Signal', 'No signal', 'Pas de signal', 'Sin señal', 'Nessun segnale', 'Ingen signal', 'Intet signal'],
    'tv.open': ['{n} öffnen', 'Open {n}', 'Ouvrir {n}', 'Abrir {n}', 'Apri {n}', 'Öppna {n}', 'Åbn {n}'],
    'cur.meters': ['Filmmeter', 'Film metres', 'Mètres de pellicule', 'Metros de película', 'Metri di pellicola', 'Filmmeter', 'Filmmeter'],
    'cur.metersShort': ['m', 'm', 'm', 'm', 'm', 'm', 'm'],
    'cur.tickets': ['Goldtickets', 'Golden tickets', 'Tickets dorés', 'Entradas doradas', 'Biglietti d’oro', 'Guldbiljetter', 'Guldbilletter'],
    'cur.ticketsShort': ['Ticket', 'ticket', 'ticket', 'entrada', 'biglietto', 'biljett', 'billet'],
    'notes.exchanged': ['{n} Goldticket(s) gelöst', '{n} golden ticket(s) bought', '{n} ticket(s) doré(s) acheté(s)', '{n} entrada(s) dorada(s) comprada(s)', '{n} biglietto/i d’oro acquistato/i', '{n} guldbiljett(er) köpt', '{n} guldbillet(ter) købt'],
    'earn.reel': ['Schauen', 'Watch', 'Regarder', 'Ver', 'Guardare', 'Titta', 'Se'],
    'earn.reelSub': ['5 m pro geschauter Stunde – automatisch', '5 m per hour watched – automatically', '5 m par heure regardée – automatiquement', '5 m por hora vista, automáticamente', '5 m per ora guardata – in automatico', '5 m per sedd timme – automatiskt', '5 m pr. set time – automatisk'],
    'earned.reel': ['Film aufgespult', 'Film wound on', 'Pellicule enroulée', 'Película enrollada', 'Pellicola avvolta', 'Film upprullad', 'Film spolet op'],
    'greet.morning': ['Guten Morgen, {name}', 'Good morning, {name}', 'Bonjour, {name}', 'Buenos días, {name}', 'Buongiorno, {name}', 'God morgon, {name}', 'Godmorgen, {name}'],
    'greet.day': ['Matinee für {name}', 'Matinee for {name}', 'Matinée pour {name}', 'Matiné para {name}', 'Matinée per {name}', 'Matiné för {name}', 'Matiné for {name}'],
    'greet.evening': ['Guten Abend, {name}', 'Good evening, {name}', 'Bonsoir, {name}', 'Buenas tardes, {name}', 'Buonasera, {name}', 'God kväll, {name}', 'Godaften, {name}'],
    'greet.night': ['Spätvorstellung, {name}', 'Late show, {name}', 'Séance de minuit, {name}', 'Sesión golfa, {name}', 'Ultimo spettacolo, {name}', 'Sen kvällsvisning, {name}', 'Sen forestilling, {name}'],
  };

  // ---------------------------------------------------------------- Sprache bestimmen
  const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* egal */ } };
  function detect() {
    const saved = get('lang');
    if (LANGS.includes(saved)) return saved;
    for (const l of navigator.languages || [navigator.language || 'de']) {
      const p = String(l).slice(0, 2).toLowerCase();
      if (LANGS.includes(p)) return p;
    }
    return 'de';
  }
  let lang = detect();
  const idx = () => LANGS.indexOf(lang);

  function t(key, vars) {
    const e = D[key];
    let s = e ? (e[idx()] ?? e[0]) : key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return s;
  }
  // Einzahl/Mehrzahl: key.one / key.other
  const tn = (key, n, vars = {}) => t(`${key}.${n === 1 ? 'one' : 'other'}`, { n, ...vars });

  /** Übersetzt statische Texte: data-i18n (Text), data-i18n-html (HTML), data-i18n-attr="attr:key;attr:key" */
  function apply(root = document) {
    document.documentElement.lang = lang;
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => {
        const [attr, key] = pair.split(':');
        if (attr && key) el.setAttribute(attr.trim(), t(key.trim()));
      });
    });
  }

  function setLang(l) {
    if (!LANGS.includes(l)) return;
    lang = l;
    set('lang', l);
    apply();
  }

  window.WatchlfyI18n = {
    LANGS, NAMES, D, t, tn, apply, setLang,
    get lang() { return lang; },
    get locale() { return LOCALES[lang]; },
  };
  document.documentElement.lang = lang;
  document.addEventListener('DOMContentLoaded', () => apply());
})();
