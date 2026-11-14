/* Watchlfy – Datenschutzerklärung (Deutsch maßgeblich, Englisch als Übersetzung) */
(() => {
  const I = window.WatchlfyI18n;
  const de = I.lang === 'de';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const el = document.getElementById('legal');
  document.querySelectorAll('.legal-nav a').forEach((a) => a.classList.add('active'));

  const L = (deText, enText) => (de ? deText : enText);

  function operator(c) {
    if (!c.configured) {
      return `<div class="legal-warn">${L(
        '⚠️ Die Betreiberangaben sind noch nicht eingerichtet. Der Betreiber muss in Render die Umgebungsvariablen <code>OPERATOR_NAME</code>, <code>OPERATOR_ADDRESS</code> und <code>OPERATOR_EMAIL</code> setzen.',
        '⚠️ The operator details have not been set up yet. The operator has to set the environment variables <code>OPERATOR_NAME</code>, <code>OPERATOR_ADDRESS</code> and <code>OPERATOR_EMAIL</code> on Render.',
      )}</div>`;
    }
    return `<address>${esc(c.name)}<br>${c.address.map(esc).join('<br>')}<br>
      ${L('E-Mail', 'Email')}: <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>${c.phone ? `<br>${L('Telefon', 'Phone')}: ${esc(c.phone)}` : ''}</address>`;
  }

  function privacy(c) {
    const dbLine = c.database ? esc(c.database) : L('den vom Betreiber gewählten Postgres-Anbieter', 'the Postgres provider chosen by the operator');
    return `
      <h1>${L('Datenschutzerklärung', 'Privacy policy')}</h1>
      <p class="muted">${L('Stand: November 2026', 'Last updated: November 2026')}</p>

      <h2>1. ${L('Verantwortlicher', 'Controller')}</h2>
      ${operator(c)}

      <h2>2. ${L('Kurz zusammengefasst', 'In short')}</h2>
      <ul>
        <li>${L('Watchlfy ist ein privates Statistik-Dashboard für deinen eigenen Film- und Serienkonsum.', 'Watchlfy is a private statistics dashboard for your own movie and TV consumption.')}</li>
        <li>${L('Watchlfy fragt nie nach Passwörtern von Streamingdiensten und meldet sich nirgends automatisch an.', 'Watchlfy never asks for streaming service passwords and never signs in anywhere automatically.')}</li>
        <li>${L('Keine Werbung, kein Tracking, keine Analyse-Tools, kein Verkauf von Daten.', 'No ads, no tracking, no analytics tools, no selling of data.')}</li>
        <li>${L('Schriftarten und Skripte liegen auf unserem Server – es werden keine fremden CDNs geladen.', 'Fonts and scripts are served from our own server – no third-party CDNs are loaded.')}</li>
        <li>${L('Du kannst deine Daten jederzeit exportieren und dein Konto samt aller Daten löschen (Profil).', 'You can export your data at any time and delete your account including all data (profile).')}</li>
      </ul>

      <h2>3. ${L('Welche Daten wir verarbeiten', 'What data we process')}</h2>
      <h3>${L('Watchlfy-Konto', 'Watchlfy account')}</h3>
      <p>${L(
        'Benutzername, Passwort (nur als scrypt-Hash, nie im Klartext), Einstellungen (Sprache, Darstellung, festliche Effekte), freiwillig dein Geburtstag, Zeitpunkt der Registrierung und der Logins sowie die Browser-Kennung (User-Agent) bei Logins, gesehene Meilensteine.',
        'Username, password (only as a scrypt hash, never in plain text), settings (language, appearance, festive effects), optionally your birthday, time of registration and logins, the browser identifier (user agent) of logins, and milestones you have seen.',
      )}</p>
      <h3>${L('Schauverlauf (von dir hochgeladen)', 'Viewing history (uploaded by you)')}</h3>
      <p>${L(
        'Aus Dateien, die du selbst bei Netflix, Prime Video, Max, Disney+, Apple oder anderen Diensten anforderst und hochlädst: Titel, Staffel/Folge, Zeitpunkt, Dauer, Profilname, Gerätetyp und Land, sofern in der Datei enthalten. Gespeichert werden nur diese Verlaufszeilen und ein Import-Protokoll (Dateiname, Anzahl, Zeitraum) – die Datei selbst wird nach dem Import verworfen. Einzelne Importe oder alle Daten eines Dienstes kannst du im Profil löschen.',
        'From files you request from Netflix, Prime Video, Max, Disney+, Apple or other services yourself and upload: title, season/episode, time, duration, profile name, device type and country, if contained in the file. Only these history rows and an import log (file name, count, period) are stored – the file itself is discarded after import. You can delete single imports or all data of a service in your profile.',
      )}</p>
      <h3>${L('Trakt.tv (nur wenn du es verbindest)', 'Trakt.tv (only if you connect it)')}</h3>
      <p>${L(
        'Trakt-Benutzername, Zugriffs- und Aktualisierungs-Token, dein Trakt-Verlauf und deine Bewertungen. Was gerade läuft, wird nur angezeigt und nicht gespeichert. Den Zugriff kannst du im Profil trennen oder bei Trakt unter „Connected Apps“ widerrufen.',
        'Trakt username, access and refresh tokens, your Trakt history and ratings. What is playing right now is only displayed, not stored. You can disconnect in your profile or revoke access at Trakt under “Connected Apps”.',
      )}</p>
      <h3>${L('Sammlung & Noten', 'Collection & notes')}</h3>
      <p>${L('Verdiente und ausgegebene Noten, gekaufte Sammlerstücke und Ergebnisse im Vorführraum-Quiz.', 'Notes earned and spent, collectibles bought and results in the screening room quiz.')}</p>
      <h3>${L('Freunde', 'Friends')}</h3>
      <p>${L(
        'Wen du als Freund hinzufügst oder wer dich anfragt. Bestätigte Freunde sehen im Vergleich nur zusammengefasste Werte: Schauzeit, Anzahl Folgen/Filme, deine Top 5 Serien und Filme, gemeinsame Titel sowie deine Sammlung – keinen Verlauf, keine Zeitpunkte und keine Profilnamen. Eine Freundschaft kannst du jederzeit beenden.',
        'Who you add as a friend or who sends you a request. Confirmed friends only see aggregated values in the comparison: watch time, number of episodes/movies, your top 5 series and movies, shared titles and your collection – no history, no timestamps and no profile names. You can end a friendship at any time.',
      )}</p>

      <h2>4. ${L('Zwecke und Rechtsgrundlagen', 'Purposes and legal bases')}</h2>
      <ul>
        <li>${L('Bereitstellung des Dienstes und deiner Statistiken (Art. 6 Abs. 1 lit. b DSGVO).', 'Providing the service and your statistics (Art. 6(1)(b) GDPR).')}</li>
        <li>${L('Importe, Verbindung mit Trakt, Freunde-Vergleich und Geburtstag: deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO), jederzeit widerrufbar.', 'Imports, Trakt connection, friend comparison and birthday: your consent (Art. 6(1)(a) GDPR), revocable at any time.')}</li>
        <li>${L('Sicherheit und Missbrauchsschutz (Login-Protokoll, Sperre nach Fehlversuchen), Backups: berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO).', 'Security and abuse prevention (login log, lockout after failed attempts), backups: legitimate interest (Art. 6(1)(f) GDPR).')}</li>
      </ul>

      <h2>5. ${L('Empfänger und Dienstleister', 'Recipients and service providers')}</h2>
      <ul>
        <li><b>TMDB</b> (TMDB, Inc., USA): ${L('Zur Ermittlung von Postern, Genres und Laufzeiten fragt der Server nur Titelnamen ab, ohne Bezug zu deiner Person. Poster werden über diesen Server durchgereicht; dein Browser verbindet sich nicht mit TMDB.', 'To find posters, genres and runtimes, the server only queries title names, without any reference to you. Posters are relayed through this server; your browser does not connect to TMDB.')}</li>
        <li><b>Trakt</b> (Trakt, Inc., USA): ${L('nur wenn du Trakt verbindest – Abruf deines Verlaufs über die offizielle API.', 'only if you connect Trakt – your history is retrieved via the official API.')}</li>
        <li><b>Hosting</b>: ${esc(c.hosting)}.</li>
        <li><b>${L('Datenbank', 'Database')}</b>: ${dbLine}.</li>
      </ul>
      <p>${L(
        'Soweit Anbieter Daten in den USA verarbeiten, erfolgt die Übermittlung auf Grundlage des EU-US Data Privacy Framework (sofern der Anbieter zertifiziert ist) oder der EU-Standardvertragsklauseln (Art. 46 DSGVO).',
        'Where providers process data in the USA, transfers are based on the EU-US Data Privacy Framework (if the provider is certified) or the EU Standard Contractual Clauses (Art. 46 GDPR).',
      )}</p>
      <p>${L(
        'Administratoren dieser Installation sehen zum Betrieb: Benutzername, Login-Zeiten mit Browser, verbundene Quellen, Trakt-Benutzername und die Anzahl deiner Einträge.',
        'Administrators of this installation see, for operating the service: username, login times with browser, connected sources, Trakt username and your number of entries.',
      )}</p>

      <h2>6. ${L('Cookies und lokaler Speicher', 'Cookies and local storage')}</h2>
      <p>${L(
        'Wir verwenden nur technisch notwendige Cookies (§ 25 Abs. 2 TDDDG): <code>wl_session</code> hält dich angemeldet (signiert, max. 30 Tage) und <code>wl_oauth_state</code> schützt die Trakt-Anmeldung (10 Minuten). Im lokalen Speicher deines Browsers liegen nur Einstellungen wie Sprache, Darstellung und zuletzt geöffneter Tab. Es gibt keine Tracking- oder Werbe-Cookies.',
        'We only use technically necessary cookies (§ 25(2) TDDDG): <code>wl_session</code> keeps you signed in (signed, max. 30 days) and <code>wl_oauth_state</code> protects the Trakt sign-in (10 minutes). Your browser’s local storage only holds settings such as language, appearance and the last opened tab. There are no tracking or advertising cookies.',
      )}</p>

      <h2>7. ${L('Speicherdauer', 'Retention')}</h2>
      <p>${L(
        'Deine Daten bleiben gespeichert, solange dein Konto besteht. Löschst du dein Konto, werden Konto, Schauverlauf, Importe, Trakt-Tokens, Logins, Freundschaften und Sammlung sofort gelöscht. Trennst du nur Trakt, bleiben bereits geholte Einträge erhalten. Vom Administrator heruntergeladene Backups können Daten enthalten, bis sie gelöscht werden.',
        'Your data is kept as long as your account exists. If you delete your account, the account, viewing history, imports, Trakt tokens, logins, friendships and collection are deleted immediately. If you only disconnect Trakt, entries already fetched are kept. Backups downloaded by the administrator may contain data until they are deleted.',
      )}</p>

      <h2>8. ${L('Deine Rechte', 'Your rights')}</h2>
      <p>${L(
        'Du hast das Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21 DSGVO) sowie auf Widerruf erteilter Einwilligungen (Art. 7 Abs. 3). Den Export (JSON) und die Kontolöschung findest du direkt im Profil. Außerdem kannst du dich bei einer Datenschutz-Aufsichtsbehörde beschweren (Art. 77 DSGVO).',
        'You have the right of access (Art. 15), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20) and objection (Art. 21 GDPR), and to withdraw consent (Art. 7(3)). Data export (JSON) and account deletion are available directly in your profile. You may also lodge a complaint with a data protection supervisory authority (Art. 77 GDPR).',
      )}</p>

      <h2>9. ${L('Sicherheit', 'Security')}</h2>
      <p>${L(
        'Verbindungen sind per HTTPS verschlüsselt, Passwörter werden mit scrypt gehasht, Sitzungen sind signiert und Anmeldeversuche werden begrenzt.',
        'Connections are encrypted via HTTPS, passwords are hashed with scrypt, sessions are signed and sign-in attempts are rate-limited.',
      )}</p>`;
  }

  fetch('/api/legal')
    .then((r) => r.json())
    .then((c) => {
      const note = !de ? `<p class="legal-note">${esc(I.t('legal.enNote'))}</p>` : '';
      el.innerHTML = note + privacy(c);
      document.title = `${L('Datenschutz', 'Privacy')} · Watchlfy`;
    })
    .catch(() => { el.textContent = 'Error'; });
})();
