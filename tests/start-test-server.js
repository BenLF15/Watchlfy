// Startet für die E2E-Tests: frische Test-Datenbank, TMDB/Trakt-Mock und die App.
// TEST_DATABASE_URL zeigt auf eine Wegwerf-Datenbank (wird bei jedem Start geleert!).
import { spawn } from 'node:child_process';
import pg from 'pg';

const url = process.env.TEST_DATABASE_URL || 'postgres://postgres@127.0.0.1:5433/watchlfy_test';
const mockPort = 4199;
const appPort = Number(process.env.TEST_PORT || 3199);

const client = new pg.Client({ connectionString: url });
await client.connect();
await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
await client.end();

const env = {
  ...process.env,
  DATABASE_URL: url, PORT: String(appPort), PGSSL: 'false', INTERNAL_SCHEDULER: 'false', SESSION_SECRET: 'test-secret', REGISTER_LIMIT: '1000',
  TMDB_API_KEY: 'test', TMDB_API_BASE: `http://127.0.0.1:${mockPort}/3`, TMDB_IMAGE_BASE: `http://127.0.0.1:${mockPort}/t/p`,
  TRAKT_CLIENT_ID: 'cid', TRAKT_API_BASE: `http://127.0.0.1:${mockPort}`, TRAKT_AUTH_BASE: `http://127.0.0.1:${mockPort}`,
  TRAKT_REDIRECT_URI: `http://127.0.0.1:${appPort}/auth/trakt/callback`,
};
const kids = [
  spawn(process.execPath, ['tests/mock-server.js', String(mockPort)], { env, stdio: 'inherit' }),
  spawn(process.execPath, ['src/server.js'], { env, stdio: 'inherit' }),
];
const stop = () => { kids.forEach((k) => k.kill()); process.exit(0); };
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
