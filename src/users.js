// Watchlfy-Konten: Benutzername + Passwort (scrypt-Hash), Admin-Flag, Einstellungen, Profilbild.
// Alle Schaudaten hängen direkt am Konto (views.account_id).
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { config } from './config.js';
import { query, withTransaction } from './db.js';

const scrypt = promisify(crypto.scrypt);

export class UserError extends Error {
  // key = Übersetzungsschlüssel fürs Frontend (err.<key>)
  constructor(message, status = 400, key = null) {
    super(message);
    this.status = status;
    this.key = key;
  }
}

// ---------------------------------------------------------------- Passwörter

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(String(password).normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [algo, saltB64, hashB64] = String(stored || '').split('$');
  if (algo !== 'scrypt' || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, 'base64');
  const actual = await scrypt(String(password).normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: 16384,
    r: 8,
    p: 1,
  });
  return crypto.timingSafeEqual(actual, expected);
}

// Gleiche Rechenzeit für unbekannte Benutzernamen (verhindert Ausspähen per Timing).
let dummyHash;
const getDummyHash = async () => (dummyHash ||= await hashPassword('dummy-password-for-timing'));

const USERNAME_RE = /^[A-Za-z0-9_.-]{3,24}$/;

function validateCredentials(username, password) {
  const u = String(username || '').trim();
  if (!USERNAME_RE.test(u)) {
    throw new UserError('Der Benutzername muss 3–24 Zeichen lang sein (Buchstaben, Zahlen, _ . -).', 400, 'usernameInvalid');
  }
  if (String(password || '').length < 8) throw new UserError('Das Passwort muss mindestens 8 Zeichen lang sein.', 400, 'passwordShort');
  if (String(password).length > 200) throw new UserError('Das Passwort ist zu lang.', 400, 'passwordLong');
  return u;
}

// ---------------------------------------------------------------- Konten

/**
 * Registriert ein neues Konto. Gibt es noch keinen Admin (frische Installation oder nach dem
 * Admin-Reset), wird das neue Konto automatisch Admin mit allen Funktionen.
 */
export async function registerAccount(username, password, { privacy = false } = {}) {
  if (!config.allowRegistration) throw new UserError('Neue Registrierungen sind derzeit deaktiviert.', 403, 'registrationClosed');
  const u = validateCredentials(username, password);
  if (!privacy) throw new UserError('Bitte bestätige die Datenschutzerklärung.', 400, 'privacyRequired');
  const passwordHash = await hashPassword(password);
  try {
    return await withTransaction(async (db) => {
      // Sperre, damit bei gleichzeitigen Registrierungen nur einer Admin wird.
      await db.query('SELECT pg_advisory_xact_lock(424242)');
      const { rows: admins } = await db.query('SELECT 1 FROM accounts WHERE is_admin LIMIT 1');
      const { rows } = await db.query(
        'INSERT INTO accounts (username, password_hash, is_admin, privacy_accepted_at) VALUES ($1, $2, $3, now()) RETURNING id, username, is_admin',
        [u, passwordHash, admins.length === 0],
      );
      if (rows[0].is_admin) console.log(`[admin] „${rows[0].username}“ ist als erster Nutzer Admin geworden.`);
      return rows[0];
    });
  } catch (err) {
    if (err.code === '23505') throw new UserError('Dieser Benutzername ist bereits vergeben.', 409, 'usernameTaken');
    throw err;
  }
}

/** Prüft Benutzername + Passwort. Gibt das Konto zurück oder null. */
export async function authenticate(username, password) {
  const { rows } = await query('SELECT id, username, password_hash, is_admin FROM accounts WHERE lower(username) = lower($1)', [
    String(username || '').trim(),
  ]);
  const acc = rows[0];
  const ok = await verifyPassword(password, acc ? acc.password_hash : await getDummyHash());
  if (!acc || !ok) return null;
  return { id: acc.id, username: acc.username, is_admin: acc.is_admin };
}

export async function recordLogin(accountId, userAgent) {
  await query(
    'UPDATE accounts SET login_count = login_count + 1, last_login_at = now(), last_seen_at = now() WHERE id = $1',
    [accountId],
  );
  await query('INSERT INTO login_events (account_id, user_agent) VALUES ($1, $2)', [
    accountId,
    userAgent ? String(userAgent).slice(0, 300) : null,
  ]);
}

const AVATAR_URL = `CASE WHEN av.updated_at IS NOT NULL THEN '/avatar/' || a.id || '?v=' || floor(extract(epoch FROM av.updated_at))::bigint END`;

/** Konto inkl. Einstellungen und Trakt-Status. */
export async function getAccount(id) {
  const { rows } = await query(
    `SELECT a.id, a.username, a.is_admin, a.created_at, a.theme, a.lang, a.festive, a.glass, a.free_shop, to_char(a.history_from, 'YYYY-MM-DD') AS history_from,
            to_char(a.birthday, 'YYYY-MM-DD') AS birthday, a.privacy_accepted_at,
            ${AVATAR_URL} AS avatar_url, av.updated_at IS NOT NULL AS custom_avatar,
            tt.username AS trakt_username, tt.last_sync_at AS trakt_last_sync, tt.last_error AS trakt_error,
            tt.account_id IS NOT NULL AS trakt_connected
       FROM accounts a
       LEFT JOIN account_avatars av ON av.account_id = a.id
       LEFT JOIN trakt_tokens tt ON tt.account_id = a.id
      WHERE a.id = $1`,
    [id],
  );
  return rows[0] || null;
}

export function touchAccount(id) {
  return query(
    `UPDATE accounts SET last_seen_at = now() WHERE id = $1 AND (last_seen_at IS NULL OR last_seen_at < now() - interval '5 minutes')`,
    [id],
  ).catch(() => {});
}

export async function changePassword(accountId, currentPassword, newPassword) {
  const { rows } = await query('SELECT username, password_hash FROM accounts WHERE id = $1', [accountId]);
  if (!rows.length) throw new UserError('Konto nicht gefunden.', 404, 'accountNotFound');
  if (!(await verifyPassword(currentPassword, rows[0].password_hash))) throw new UserError('Das aktuelle Passwort stimmt nicht.', 400, 'wrongPassword');
  validateCredentials(rows[0].username, newPassword);
  await query('UPDATE accounts SET password_hash = $2, updated_at = now() WHERE id = $1', [accountId, await hashPassword(newPassword)]);
}

export const THEMES = ['system', 'dark', 'light', 'season'];

export const LANGS = ['de', 'en', 'fr', 'es', 'it', 'sv', 'da'];

/** Speichert Einstellungen des Kontos (nur übergebene Felder). */
export async function updateSettings(accountId, { theme, lang, festive, glass, birthday, historyFrom } = {}) {
  const sets = [];
  const vals = [accountId];
  const add = (col, v) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
  const bad = () => new UserError('Ungültige Einstellung.', 400, 'invalidSetting');
  if (theme !== undefined) { if (!THEMES.includes(theme)) throw bad(); add('theme', theme); }
  if (lang !== undefined) { if (!LANGS.includes(lang)) throw bad(); add('lang', lang); }
  if (festive !== undefined) add('festive', Boolean(festive));
  if (glass !== undefined) add('glass', Boolean(glass));
  if (birthday !== undefined) {
    if (birthday === null || birthday === '') add('birthday', null);
    else {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(birthday));
      const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      if (!d || d.getUTCMonth() !== +m[2] - 1 || +m[1] < 1900 || d > new Date()) throw bad();
      add('birthday', birthday);
    }
  }
  if (historyFrom !== undefined) {
    if (historyFrom === null || historyFrom === '') add('history_from', null);
    else {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(historyFrom));
      const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      if (!d || d.getUTCMonth() !== +m[2] - 1 || +m[1] < 1990 || d > new Date()) throw bad();
      add('history_from', historyFrom);
    }
  }
  if (!sets.length) return;
  await query(`UPDATE accounts SET ${sets.join(', ')}, updated_at = now() WHERE id = $1`, vals);
}

// ---------------------------------------------------------------- Admin

/** Admin: alle Konten mit Kennzahlen + letzte Logins. */
export async function adminOverview() {
  const [accounts, logins] = await Promise.all([
    query(
      `SELECT a.id, a.username, a.is_admin, a.login_count, a.created_at, a.last_login_at, a.last_seen_at,
              ${AVATAR_URL} AS avatar_url, tt.username AS trakt_username, tt.last_sync_at, tt.last_error AS trakt_error,
              COALESCE(v.views, 0) AS views, v.last_view, COALESCE(v.sources, '{}') AS sources
         FROM accounts a
         LEFT JOIN account_avatars av ON av.account_id = a.id
         LEFT JOIN trakt_tokens tt ON tt.account_id = a.id
         LEFT JOIN LATERAL (
           SELECT count(*) AS views, max(watched_at) AS last_view, array_agg(DISTINCT source) AS sources
             FROM views WHERE account_id = a.id
         ) v ON true
        ORDER BY a.last_login_at DESC NULLS LAST, a.created_at DESC`,
    ),
    query(
      `SELECT l.at, l.user_agent, a.id AS account_id, a.username, ${AVATAR_URL} AS avatar_url
         FROM login_events l
         JOIN accounts a ON a.id = l.account_id
         LEFT JOIN account_avatars av ON av.account_id = a.id
        ORDER BY l.at DESC LIMIT 50`,
    ),
  ]);
  return { accounts: accounts.rows, logins: logins.rows };
}

/** Admin-Rechte setzen/entziehen. Der letzte Admin bleibt geschützt. */
export async function setAdmin(accountId, isAdmin) {
  return withTransaction(async (db) => {
    const { rows } = await db.query('SELECT username FROM accounts WHERE id = $1', [accountId]);
    if (!rows.length) throw new UserError('Konto nicht gefunden.', 404, 'accountNotFound');
    if (!isAdmin) {
      const { rows: others } = await db.query('SELECT count(*) AS n FROM accounts WHERE is_admin AND id <> $1', [accountId]);
      if (others[0].n === 0) throw new UserError('Der letzte Admin kann nicht entfernt werden.', 400, 'lastAdmin');
    }
    await db.query('UPDATE accounts SET is_admin = $2, updated_at = now() WHERE id = $1', [accountId, isAdmin]);
  });
}

/** Admin: setzt ein zufälliges neues Passwort und gibt es einmalig zurück. */
export async function resetPassword(accountId) {
  const { rows } = await query('SELECT username FROM accounts WHERE id = $1', [accountId]);
  if (!rows.length) throw new UserError('Konto nicht gefunden.', 404, 'accountNotFound');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const password = Array.from(crypto.randomBytes(12), (b) => alphabet[b % alphabet.length]).join('');
  await query('UPDATE accounts SET password_hash = $2, updated_at = now() WHERE id = $1', [accountId, await hashPassword(password)]);
  return { username: rows[0].username, password };
}

/** Löscht ein Konto samt aller Schaudaten (CASCADE). */
export async function deleteAccount(accountId) {
  await withTransaction(async (db) => {
    const { rows } = await db.query('SELECT is_admin FROM accounts WHERE id = $1', [accountId]);
    if (!rows.length) return;
    if (rows[0].is_admin) {
      const { rows: others } = await db.query('SELECT count(*) AS n FROM accounts WHERE is_admin AND id <> $1', [accountId]);
      if (others[0].n === 0) throw new UserError('Der letzte Admin kann nicht gelöscht werden. Ernenne vorher einen anderen Admin.', 400, 'lastAdminDelete');
    }
    await db.query('DELETE FROM accounts WHERE id = $1', [accountId]);
  });
}

/** Admin: Systemübersicht (Datenbankgröße, Katalog, Sync-Fehler). */
export async function adminSystem() {
  const [db, catalog, errors] = await Promise.all([
    query(`SELECT pg_size_pretty(pg_database_size(current_database())) AS size, version() AS version`),
    query(
      `SELECT (SELECT count(*) FROM titles) AS titles, (SELECT count(*) FROM titles t WHERE (t.details_at IS NULL OR (t.tmdb_id IS NOT NULL AND t.stats_at IS NULL)) AND EXISTS (SELECT 1 FROM title_aliases a WHERE a.title_id = t.id)) AS titles_pending,
              (SELECT count(*) FROM title_aliases WHERE state = 'pending') AS aliases_pending,
              (SELECT count(*) FROM title_aliases WHERE state IN ('uncertain', 'none')) AS aliases_unsure,
              (SELECT count(*) FROM episodes) AS episodes, (SELECT count(*) FROM views) AS views,
              (SELECT count(*) FROM tmdb_cache) AS tmdb_cache`,
    ),
    query(
      `SELECT l.id, l.job, l.started_at, l.message, a.username
         FROM sync_log l LEFT JOIN accounts a ON a.id = l.account_id
        WHERE l.ok = false ORDER BY l.id DESC LIMIT 20`,
    ),
  ]);
  return {
    database: { size: db.rows[0].size, version: db.rows[0].version.split(' ').slice(0, 2).join(' ') },
    catalog: catalog.rows[0],
    errors: errors.rows,
    config: {
      timezone: config.timezone,
      syncIntervalMinutes: config.syncIntervalMinutes,
      internalScheduler: config.internalScheduler,
      keepAlive: Boolean(config.keepAliveUrl),
      allowRegistration: config.allowRegistration,
      tmdb: Boolean(config.tmdb.apiKey),
      trakt: Boolean(config.trakt.clientId),
    },
  };
}

/** CSV-Export aller Konten (für Excel: Semikolon + BOM). */
export async function accountsCsv() {
  const { accounts } = await adminOverview();
  const cols = [
    ['username', 'Benutzername'], ['is_admin', 'Admin'], ['created_at', 'Registriert'], ['last_login_at', 'Letzter Login'],
    ['login_count', 'Logins'], ['views', 'Einträge'], ['sources', 'Quellen'], ['trakt_username', 'Trakt'], ['last_view', 'Zuletzt gesehen'],
  ];
  const cell = (v) => {
    if (v === null || v === undefined) return '';
    const str = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join(', ') : String(v);
    return /[";\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [cols.map((c) => c[1]).join(';'), ...accounts.map((u) => cols.map(([k]) => cell(u[k])).join(';'))];
  return '\ufeff' + lines.join('\r\n');
}

/** Datenschutzerklärung bestätigt (bestehende Konten). */
export async function acceptPrivacy(accountId) {
  await query('UPDATE accounts SET privacy_accepted_at = now() WHERE id = $1 AND privacy_accepted_at IS NULL', [accountId]);
}

// ================================================================ Profilbild
const AVATAR_MAX = 400 * 1024; // nach dem Verkleinern im Browser sind es meist 20–60 KB
function sniffImage(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.length > 12 && buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'image/webp';
  return null;
}

/** Speichert ein Profilbild (Data-URL). Der Typ wird am Inhalt erkannt, nicht an der Angabe des Browsers. */
export async function setAvatar(accountId, dataUrl) {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) throw new UserError('Ungültiges Bild.', 400, 'avatarInvalid');
  const buf = Buffer.from(m[2], 'base64');
  const mime = sniffImage(buf);
  if (!mime) throw new UserError('Ungültiges Bild.', 400, 'avatarInvalid');
  if (buf.length > AVATAR_MAX) throw new UserError('Das Bild ist zu groß.', 413, 'avatarTooBig');
  await query(
    `INSERT INTO account_avatars (account_id, mime, data, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (account_id) DO UPDATE SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()`,
    [accountId, mime, buf.toString('base64')],
  );
}

export async function removeAvatar(accountId) {
  await query('DELETE FROM account_avatars WHERE account_id = $1', [accountId]);
}

export async function getAvatar(accountId) {
  const { rows } = await query('SELECT mime, data, updated_at FROM account_avatars WHERE account_id = $1', [accountId]);
  return rows[0] ? { mime: rows[0].mime, buf: Buffer.from(rows[0].data, 'base64'), updated: rows[0].updated_at } : null;
}
