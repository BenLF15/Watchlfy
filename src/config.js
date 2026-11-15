import crypto from 'node:crypto';

// Zentrale Konfiguration – alle Secrets kommen ausschließlich aus Umgebungsvariablen.

function env(name, fallback = undefined) {
  const v = process.env[name];
  return v === undefined || v === '' ? fallback : v;
}

function int(name, fallback) {
  const n = Number.parseInt(env(name, ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

const bool = (name, fallback) => {
  const v = env(name);
  return v === undefined ? fallback : !['false', '0', 'no', 'off'].includes(v.toLowerCase());
};

const externalUrl = env('RENDER_EXTERNAL_URL', env('PUBLIC_URL', '')).replace(/\/$/, '');
const port = int('PORT', 3000);

// Ohne SESSION_SECRET wird ein Schlüssel aus der Datenbank-URL abgeleitet (stabil über Neustarts).
const derivedSecret = () => crypto.createHash('sha256').update(`watchlfy-session:${env('DATABASE_URL', '')}`).digest('hex');

export const config = {
  port,
  databaseUrl: env('DATABASE_URL'),
  publicUrl: externalUrl || `http://127.0.0.1:${port}`,
  tmdb: {
    apiKey: env('TMDB_API_KEY'), // v3-API-Key oder v4-Lesetoken (beginnt mit "eyJ")
    base: env('TMDB_API_BASE', 'https://api.themoviedb.org/3').replace(/\/$/, ''),
    imageBase: env('TMDB_IMAGE_BASE', 'https://image.tmdb.org/t/p').replace(/\/$/, ''),
    // Land für „Wo läuft das?“ (Anbieter für Trakt-Einträge)
    region: env('TMDB_REGION', 'DE').toUpperCase(),
    // Wie viele Titel pro Lauf im Hintergrund nachgeladen werden
    batch: int('TMDB_BATCH', 40),
  },
  trakt: {
    clientId: env('TRAKT_CLIENT_ID'),
    clientSecret: env('TRAKT_CLIENT_SECRET'),
    base: env('TRAKT_API_BASE', 'https://api.trakt.tv').replace(/\/$/, ''),
    authBase: env('TRAKT_AUTH_BASE', 'https://trakt.tv').replace(/\/$/, ''),
    // Trakt (Cloudflare) blockt Anfragen ohne aussagekräftigen User-Agent mit 403
    userAgent: env('TRAKT_USER_AGENT', 'Watchlfy/1.0 (self-hosted watch statistics)'),
    redirectUri: env('TRAKT_REDIRECT_URI', `${externalUrl || `http://127.0.0.1:${port}`}/auth/trakt/callback`),
  },
  // Filmmusik im Rückblick: Hörproben über die öffentliche iTunes-Suche (kein Schlüssel)
  music: {
    enabled: bool('MUSIC_PREVIEWS', true),
    base: env('ITUNES_API_BASE', 'https://itunes.apple.com').replace(/\/$/, ''),
    country: env('MUSIC_COUNTRY', 'DE'),
    userAgent: env('TRAKT_USER_AGENT', 'Watchlfy/1.0 (self-hosted watch statistics)'),
  },
  allowRegistration: bool('ALLOW_REGISTRATION', true),
  // Neue Konten pro IP in 15 Minuten
  registerLimit: Math.max(1, int('REGISTER_LIMIT', 10)),
  sessionSecret: env('SESSION_SECRET') || derivedSecret(),
  sessionDays: int('SESSION_DAYS', 30),
  timezone: env('TIMEZONE', 'Europe/Berlin'),
  internalScheduler: bool('INTERNAL_SCHEDULER', true),
  syncIntervalMinutes: Math.max(5, int('SYNC_INTERVAL_MINUTES', 30)),
  keepAliveUrl: bool('KEEP_ALIVE', Boolean(externalUrl)) && externalUrl ? `${externalUrl}/healthz` : null,
  cronSecret: env('CRON_SECRET'),
  // Größte Import-Datei in MB
  maxUploadMb: int('MAX_UPLOAD_MB', 60),
  legal: {
    name: env('OPERATOR_NAME'),
    address: env('OPERATOR_ADDRESS'),
    email: env('OPERATOR_EMAIL'),
    phone: env('OPERATOR_PHONE'),
    hosting: env('HOSTING_PROVIDER', 'Render Services, Inc., 525 Brannan Street, San Francisco, CA 94107, USA'),
    database: env('DATABASE_PROVIDER'),
  },
  isProduction: env('NODE_ENV') === 'production' || Boolean(env('RENDER_EXTERNAL_URL')),
};

// Pflicht ist nur die Datenbank – TMDB und Trakt sind optional (die App sagt dann, was fehlt).
export const REQUIRED_ENV = ['DATABASE_URL'];
export const missingEnv = () => REQUIRED_ENV.filter((n) => !env(n));

export function requireEnv(...names) {
  const missing = names.filter((n) => !env(n));
  if (missing.length) throw new Error(`Fehlende Umgebungsvariable(n): ${missing.join(', ')}`);
}
