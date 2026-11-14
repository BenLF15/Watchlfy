import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import compression from 'compression';
import express from 'express';
import { config } from './config.js';
import { migrate } from './db.js';
import * as users from './users.js';
import * as stats from './stats.js';
import * as imports from './imports.js';
import * as tmdb from './tmdb.js';
import * as features from './features.js';
import { lastBackup, restoreBackup, streamBackup } from './backup.js';
import { registerJob, runAllJobs, startScheduler } from './scheduler.js';
import * as trakt from './trakt.js';
import * as collection from './collection.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(compression());

// ---------------------------------------------------------------- Sicherheit

app.use((req, res, next) => {
  res.set({
    'Content-Security-Policy': [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'none'",
      `form-action 'self' ${config.trakt.authBase}`,
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'DENY',
  });
  next();
});

const COOKIE = 'wl_session';
const sign = (value) => crypto.createHmac('sha256', config.sessionSecret).update(value).digest('base64url');

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || '')
      .split(';')
      .map((c) => c.trim().split('='))
      .filter(([k]) => k)
      .map(([k, ...v]) => [k, decodeURIComponent(v.join('='))]),
  );
}

function setCookie(res, name, value, maxAgeSec) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${maxAgeSec}`];
  if (config.isProduction) parts.push('Secure');
  res.append('Set-Cookie', parts.join('; '));
}

// Session-Cookie: "<kontoId>.<ablauf>.<hmac>" – signiert, HttpOnly, SameSite=Lax.
function sessionAccountId(req) {
  const token = parseCookies(req)[COOKIE];
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  if (!/^\d+$/.test(id) || Number(exp) < Date.now()) return null;
  const expected = sign(`session:${id}:${exp}`);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return Number(id);
}

function startSession(res, accountId) {
  const exp = Date.now() + config.sessionDays * 864e5;
  setCookie(res, COOKIE, `${accountId}.${exp}.${sign(`session:${accountId}:${exp}`)}`, config.sessionDays * 86400);
}

async function requireAuth(req, res, next) {
  try {
    const id = sessionAccountId(req);
    const account = id ? await users.getAccount(id) : null;
    if (account) {
      req.account = account;
      users.touchAccount(account.id);
      return next();
    }
    if (id) setCookie(res, COOKIE, '', 0); // Konto gelöscht → Session beenden
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      return req.path.startsWith('/api/') ? res.status(401).json({ error: 'unauthorized' }) : res.redirect('/login');
    }
    return res.redirect('/login');
  } catch (err) {
    next(err);
  }
}

function requireAdmin(req, res, next) {
  if (req.account?.is_admin) return next();
  return res.status(403).json({ error: 'Nur für Admins.', key: 'adminOnly' });
}

// Brute-Force-Bremse: max. 10 Fehlversuche pro IP bzw. Benutzername in 15 Minuten.
const attempts = new Map();
const WINDOW = 15 * 60_000;
function blocked(...keys) {
  const now = Date.now();
  return keys.some((k) => {
    const r = attempts.get(k);
    return r && now - r.since < WINDOW && r.count >= (k.startsWith('reg:') ? config.registerLimit : 10);
  });
}
function fail(...keys) {
  const now = Date.now();
  for (const k of keys) {
    const r = attempts.get(k);
    if (!r || now - r.since > WINDOW) attempts.set(k, { since: now, count: 1 });
    else r.count++;
  }
  if (attempts.size > 10_000) attempts.clear();
}

// ---------------------------------------------------------------- Öffentliche Routen

app.get('/healthz', (_req, res) => res.json({ ok: true }));
// Service Worker muss öffentlich und unter "/" liegen, damit er die ganze App steuert (Installierbarkeit).
app.get('/sw.js', (_req, res) => {
  res.set({ 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/' });
  res.sendFile(path.join(publicDir, 'sw.js'));
});
// Eigene JS/CSS-Dateien: Browser fragt bei jedem Laden per ETag nach, ob es eine neue Version gibt
// (verhindert, dass nach einem Update veraltete Skripte aus dem Cache laufen).
const revalidate = { maxAge: 0, setHeaders: (res) => res.set('Cache-Control', 'no-cache') };
app.use('/assets', express.static(path.join(publicDir, 'assets'), revalidate));
app.get('/vendor/chart.umd.min.js', (_req, res) =>
  res.sendFile(path.join(root, 'node_modules/chart.js/dist/chart.umd.min.js'), { maxAge: '7d' }),
);
app.use('/vendor/fonts', express.static(path.join(root, 'node_modules/@fontsource-variable/inter/files'), { maxAge: '30d' }));
// Optional: externer Trigger (z. B. cron-job.org), falls der interne Zeitplan nicht reicht.
// Aufruf: GET /cron/run?key=<CRON_SECRET>
app.get('/cron/run', async (req, res) => {
  const key = String(req.query.key || req.get('x-cron-key') || '');
  const ok =
    config.cronSecret &&
    key.length === config.cronSecret.length &&
    crypto.timingSafeEqual(Buffer.from(key), Buffer.from(config.cronSecret));
  if (!ok) return res.status(404).end();
  try {
    res.json(await runAllJobs());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Datenschutz: öffentlich erreichbar (auch ohne Login)
app.get('/datenschutz', (_req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.sendFile(path.join(publicDir, 'legal.html'));
});
app.get('/api/legal', (_req, res) => {
  const L = config.legal;
  const host = (() => { try { return new URL(config.databaseUrl).hostname; } catch { return ''; } })();
  const database = L.database
    || (/neon\.tech$/.test(host) ? 'Neon (Databricks, Inc.), USA'
      : /render\.com$/.test(host) ? 'Render Services, Inc., USA'
      : null);
  res.json({
    name: L.name || null,
    address: L.address ? L.address.split(/\s*(?:\||\\n|\n)\s*/).filter(Boolean) : [],
    email: L.email || null,
    phone: L.phone || null,
    hosting: L.hosting,
    database,
    configured: Boolean(L.name && L.address && L.email),
  });
});

app.get('/login', (req, res) => {
  if (sessionAccountId(req)) return res.redirect('/');
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(publicDir, 'login.html'));
});

app.get('/api/auth/config', (_req, res) => res.json({ allowRegistration: config.allowRegistration }));

app.post(
  '/api/auth/login',
  express.json({ limit: '5kb' }),
  async (req, res, next) => {
    try {
      const username = String(req.body?.username || '').trim();
      const keys = [`ip:${req.ip}`, `u:${username.toLowerCase()}`];
      if (blocked(...keys)) {
        return res.status(429).json({ error: 'Zu viele Fehlversuche – bitte in 15 Minuten erneut versuchen.', key: 'tooMany' });
      }
      const account = await users.authenticate(username, req.body?.password);
      if (!account) {
        fail(...keys);
        return res.status(401).json({ error: 'Benutzername oder Passwort ist falsch.', key: 'badCredentials' });
      }
      await users.recordLogin(account.id, req.get('user-agent'));
      startSession(res, account.id);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

app.post(
  '/api/auth/register',
  express.json({ limit: '5kb' }),
  async (req, res, next) => {
    try {
      if (blocked(`reg:${req.ip}`)) {
        return res.status(429).json({ error: 'Zu viele Registrierungen – bitte später erneut versuchen.', key: 'tooManyRegs' });
      }
      const account = await users.registerAccount(req.body?.username, req.body?.password, { privacy: req.body?.privacy === true });
      if (users.LANGS.includes(req.body?.lang)) await users.updateSettings(account.id, { lang: req.body.lang });
      fail(`reg:${req.ip}`); // zählt Registrierungen pro IP (max. 10 / 15 Min.)
      await users.recordLogin(account.id, req.get('user-agent'));
      startSession(res, account.id);
      res.status(201).json({ ok: true, isAdmin: account.is_admin });
    } catch (err) {
      if (err instanceof users.UserError) return res.status(err.status).json({ error: err.message, key: err.key });
      next(err);
    }
  },
);

app.post('/logout', (_req, res) => {
  setCookie(res, COOKIE, '', 0);
  res.redirect('/login');
});

// ---------------------------------------------------------------- Geschützter Bereich

app.use(requireAuth);

app.get('/', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(publicDir, 'index.html'));
});
app.use(express.static(publicDir, { index: false, ...revalidate }));

// Poster/Backdrops von TMDB über den eigenen Server (CSP erlaubt nur 'self')
app.get('/img/tmdb/:size/:file', (req, res) => tmdb.imageProxy(req, res));

// Eigene Profilbilder
app.get('/avatar/:id', async (req, res) => {
  try {
    const av = await users.getAvatar(Number(req.params.id) || 0);
    if (!av) return res.status(404).end();
    res.set({ 'Content-Type': av.mime, 'Cache-Control': 'private, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" });
    res.send(av.buf);
  } catch {
    res.status(500).end();
  }
});

// ---------------------------------------------------------------- Trakt verbinden (OAuth)
app.get('/auth/trakt', (_req, res) => {
  if (!trakt.available()) return res.redirect('/?trakt=not_configured');
  const state = crypto.randomBytes(16).toString('hex');
  setCookie(res, 'wl_oauth_state', state, 600);
  res.redirect(trakt.authorizeUrl(state));
});
app.get('/auth/trakt/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const expected = parseCookies(req).wl_oauth_state;
  setCookie(res, 'wl_oauth_state', '', 0);
  if (error) return res.redirect(`/?trakt=${encodeURIComponent(String(error))}`);
  if (!code || !state || state !== expected) return res.redirect('/?trakt=state_mismatch');
  try {
    await trakt.connect(req.account.id, String(code));
    trakt.syncAccount(req.account.id, { full: true }).catch((err) => console.error('[trakt]', err.message));
    res.redirect('/?trakt=connected');
  } catch (err) {
    console.error('[trakt] OAuth', err.message);
    res.redirect('/?trakt=token_failed');
  }
});

const api = express.Router();
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    if (err instanceof users.UserError) return res.status(err.status).json({ error: err.message, key: err.key });
    console.error('[api]', req.path, err);
    res.status(500).json({ error: err.message, code: err.code });
  });
const rangeDays = (req) => (req.query.range in stats.RANGE_DAYS ? stats.RANGE_DAYS[req.query.range] : 30);
const idParam = (req) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new users.UserError('Ungültige ID.', 400, 'notFound');
  return id;
};

api.get(
  '/status',
  wrap(async (req, res) => {
    const a = req.account;
    const [c, tm] = await Promise.all([stats.counts(a.id), tmdb.pendingFor(a.id)]);
    res.json({
      account: {
        id: a.id, username: a.username, is_admin: a.is_admin, created_at: a.created_at,
        theme: a.theme, lang: a.lang, festive: a.festive, glass: a.glass, birthday: a.birthday,
        avatar_url: a.avatar_url || null, custom_avatar: Boolean(a.custom_avatar),
        privacy_accepted: Boolean(a.privacy_accepted_at),
      },
      counts: c,
      tmdb: { enabled: tmdb.enabled(), loading: tmdb.isEnriching(), pausedUntil: tmdb.tmdbPausedUntil(), ...tm },
      trakt: {
        available: Boolean(config.trakt.clientId && config.trakt.clientSecret),
        connected: Boolean(a.trakt_connected), username: a.trakt_username || null,
        last_sync: a.trakt_last_sync || null, error: a.trakt_error || null,
      },
    });
  }),
);

// ---------------------------------------------------------------- Konto
api.post('/me/password', express.json({ limit: '5kb' }), wrap(async (req, res) => {
  await users.changePassword(req.account.id, req.body?.current, req.body?.next);
  res.json({ ok: true });
}));
api.post('/me/avatar', express.json({ limit: '700kb' }), wrap(async (req, res) => {
  await users.setAvatar(req.account.id, req.body?.image);
  const a = await users.getAccount(req.account.id);
  res.json({ ok: true, avatar_url: a.avatar_url });
}));
api.delete('/me/avatar', wrap(async (req, res) => {
  await users.removeAvatar(req.account.id);
  res.json({ ok: true, avatar_url: null });
}));
api.post('/me/settings', express.json({ limit: '2kb' }), wrap(async (req, res) => {
  const { theme, lang, festive, glass, birthday } = req.body || {};
  await users.updateSettings(req.account.id, { theme, lang, festive, glass, birthday });
  res.json({ ok: true });
}));
api.post('/me/privacy', wrap(async (req, res) => {
  await users.acceptPrivacy(req.account.id);
  res.json({ ok: true });
}));
api.get('/me/export', wrap(async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  res.set({
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="watchlfy-export-${date}.json"`,
    'Cache-Control': 'no-store',
  });
  res.send(JSON.stringify(await features.exportData(req.account.id), null, 1));
}));
api.delete('/me', wrap(async (req, res) => {
  await users.deleteAccount(req.account.id);
  setCookie(res, COOKIE, '', 0);
  res.json({ ok: true });
}));

// ---------------------------------------------------------------- Import
const rawUpload = express.raw({ type: () => true, limit: `${config.maxUploadMb}mb` });
api.post('/import/preview', rawUpload, wrap(async (req, res) => {
  let filename = '';
  try { filename = decodeURIComponent(String(req.get('x-filename') || '')); } catch { /* egal */ }
  res.json(imports.preview(req.account.id, String(req.query.source || ''), filename, req.body));
}));
api.post('/import/remap', express.json({ limit: '10kb' }), wrap(async (req, res) => {
  res.json(imports.remap(req.account.id, req.body?.token, { tableIndex: req.body?.tableIndex, mapping: req.body?.mapping }));
}));
api.post('/import/commit', express.json({ limit: '20kb' }), wrap(async (req, res) => {
  const r = await imports.commit(req.account.id, req.body?.token, { profiles: req.body?.profiles });
  tmdb.enrich().catch(() => {});
  features.onImported?.(req.account, r);
  res.json(r);
}));
api.get('/imports', wrap(async (req, res) => res.json({ items: await imports.listImports(req.account.id) })));
api.delete('/imports/:id', wrap(async (req, res) => res.json(await imports.deleteImport(req.account.id, idParam(req)))));
api.delete('/sources/:source', wrap(async (req, res) => res.json(await imports.deleteSource(req.account.id, String(req.params.source)))));

// ---------------------------------------------------------------- TMDB-Abgleich
api.post('/tmdb/load', wrap(async (_req, res) => {
  tmdb.enrich().catch(() => {});
  res.json({ ok: true });
}));
api.get('/tmdb/review', wrap(async (req, res) => res.json({ items: await tmdb.reviewList(req.account.id) })));
api.get('/tmdb/search', wrap(async (req, res) => res.json({ items: await tmdb.searchCandidates(req.query.kind, req.query.q) })));
api.post('/tmdb/correct', express.json({ limit: '2kb' }), wrap(async (req, res) => {
  res.json(await tmdb.correctAlias(req.account.id, String(req.body?.raw_key || ''), { kind: req.body?.kind, tmdbId: req.body?.tmdb_id }));
}));

// ---------------------------------------------------------------- Statistik
api.get('/dashboard', wrap(async (req, res) => {
  const days = rangeDays(req);
  const [overview, series, movies, progress] = await Promise.all([
    stats.overview(req.account.id, days),
    stats.top(req.account.id, days, 'series', 5),
    stats.top(req.account.id, days, 'movies', 5),
    stats.progress(req.account.id),
  ]);
  res.json({ range: req.query.range || '30d', overview, series, movies, continue: progress.continue.slice(0, 10) });
}));
api.get('/top', wrap(async (req, res) => {
  const kind = ['series', 'movies', 'genres', 'actors', 'countries'].includes(req.query.kind) ? req.query.kind : 'series';
  res.json({ kind, items: await stats.top(req.account.id, rangeDays(req), kind, 50) });
}));
api.get('/times', wrap(async (req, res) => res.json(await stats.times(req.account.id, rangeDays(req)))));
api.get('/progress', wrap(async (req, res) => res.json(await stats.progress(req.account.id))));
api.get('/history', wrap(async (req, res) => {
  const before = req.query.before && !Number.isNaN(Date.parse(req.query.before)) ? new Date(req.query.before).toISOString() : null;
  res.json({ items: await stats.history(req.account.id, { before, q: req.query.q, limit: req.query.limit }) });
}));
api.get('/title', wrap(async (req, res) => {
  const d = await stats.titleDetail(req.account.id, { titleId: req.query.id || null, tkey: req.query.key || null });
  if (!d) throw new users.UserError('Nicht gefunden.', 404, 'notFound');
  res.json(d);
}));

// ---------------------------------------------------------------- Admin
const admin = express.Router();
admin.use(requireAdmin);
admin.get('/accounts', wrap(async (_req, res) => res.json(await users.adminOverview())));
admin.get('/system', wrap(async (_req, res) => res.json(await users.adminSystem())));
admin.get('/accounts.csv', wrap(async (_req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="watchlfy-konten-${date}.csv"`, 'Cache-Control': 'no-store' });
  res.send(await users.accountsCsv());
}));
admin.post('/accounts/:id/admin', express.json({ limit: '1kb' }), wrap(async (req, res) => {
  await users.setAdmin(idParam(req), Boolean(req.body?.admin));
  res.json({ ok: true });
}));
admin.post('/accounts/:id/reset-password', wrap(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await users.resetPassword(idParam(req)));
}));
admin.delete('/accounts/:id', wrap(async (req, res) => {
  const id = idParam(req);
  if (id === req.account.id) throw new users.UserError('Dein eigenes Konto löschst du im Profil.', 400, 'ownAccount');
  await users.deleteAccount(id);
  res.json({ ok: true });
}));
admin.get('/backup', async (req, res) => {
  const date = new Date().toISOString().slice(0, 10);
  res.set({ 'Content-Type': 'application/gzip', 'Content-Disposition': `attachment; filename="watchlfy-backup-${date}.json.gz"`, 'Cache-Control': 'no-store' });
  try {
    await streamBackup(res);
    console.log(`[backup] von ${req.account.username} heruntergeladen`);
  } catch (err) {
    console.error('[backup]', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
    else res.destroy(err);
  }
});
admin.post('/free-shop', express.json({ limit: '1kb' }), wrap(async (req, res) => {
  await collection.setFreeShop(req.account.id, req.body?.on === true);
  res.json({ ok: true, on: req.body?.on === true });
}));
admin.get('/backup/info', wrap(async (_req, res) => res.json({ last: await lastBackup() })));
admin.post('/restore', express.raw({ type: () => true, limit: '300mb' }), wrap(async (req, res) => {
  if (!Buffer.isBuffer(req.body) || !req.body.length) throw new users.UserError('Leere Datei.', 400, 'backupInvalid');
  const r = await restoreBackup(req.body);
  console.log(`[backup] Wiederherstellung durch ${req.account.username}:`, JSON.stringify(r.tables));
  res.json(r);
}));
api.use('/admin', admin);

// ---------------------------------------------------------------- Trakt
api.post('/trakt/sync', wrap(async (req, res) => res.json(await trakt.syncAccount(req.account.id))));
api.post('/trakt/disconnect', wrap(async (req, res) => {
  await trakt.disconnect(req.account.id);
  res.json({ ok: true });
}));
api.get('/now-playing', wrap(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!req.account.trakt_connected) return res.json({ playing: null, trakt: false });
  res.json({ playing: await trakt.watching(req.account.id).catch(() => null), trakt: true });
}));

// ---------------------------------------------------------------- Rückblick
const yearParam = (v) => { const y = Number(v); return Number.isInteger(y) && y >= 1990 && y <= 2100 ? y : null; };
api.get('/wrapped', wrap(async (req, res) => {
  const years = await features.wrappedYears(req.account.id);
  const year = yearParam(req.query.year) || years[0] || new Date().getFullYear();
  res.json({ years, ...(await features.wrapped(req.account.id, year)) });
}));

// ---------------------------------------------------------------- Freunde
api.get('/friends', wrap(async (req, res) => res.json(await features.listFriends(req.account.id))));
api.post('/friends', express.json({ limit: '1kb' }), wrap(async (req, res) => res.json(await features.requestFriend(req.account.id, req.body?.username))));
api.post('/friends/:id/accept', wrap(async (req, res) => { await features.acceptFriend(req.account.id, idParam(req)); res.json({ ok: true }); }));
api.delete('/friends/:id', wrap(async (req, res) => { await features.removeFriend(req.account.id, idParam(req)); res.json({ ok: true }); }));
api.get('/friends/:id/compare', wrap(async (req, res) => res.json(await features.compare(req.account, idParam(req), rangeDays(req)))));

// ---------------------------------------------------------------- Sammlung, Videothek, Vorführraum
const intParam = (v) => { const n = Number(v); if (!Number.isInteger(n) || n < 0 || n > 50) throw new users.UserError('Ungültig.', 400, 'quizRound'); return n; };
api.get('/collection', wrap(async (req, res) => res.json(await collection.overviewFor(req.account))));
api.post('/collection/buy', express.json({ limit: '1kb' }), wrap(async (req, res) => res.json(await collection.buy(req.account, req.body?.id))));
api.post('/collection/exchange', express.json({ limit: '1kb' }), wrap(async (req, res) => res.json(await collection.exchange(req.account, req.body?.from))));
api.post('/collection/refine', express.json({ limit: '1kb' }), wrap(async (req, res) => res.json(await collection.refine(req.account, req.body?.id))));
api.post('/collection/gift', wrap(async (req, res) => res.json(await collection.openGift(req.account))));
api.post('/collection/event', express.json({ limit: '1kb' }), wrap(async (req, res) => res.json(await collection.event(req.account, req.body || {}))));
api.get('/friends/:id/collection', wrap(async (req, res) => res.json(await collection.friendCollection(req.account, idParam(req)))));
api.get('/screening', wrap(async (req, res) => res.json({ session: await collection.sessionState(req.account) })));
api.post('/screening/start', wrap(async (req, res) => res.json({ session: await collection.sessionStart(req.account) })));
api.post('/screening/reveal', express.json({ limit: '1kb' }), wrap(async (req, res) => res.json({ session: await collection.sessionReveal(req.account, intParam(req.body?.round)) })));
api.post('/screening/answer', express.json({ limit: '1kb' }), wrap(async (req, res) => {
  const r = await collection.sessionAnswer(req.account, intParam(req.body?.round), req.body?.choice);
  res.json({ session: r, reward: r.reward, balance: r.balance });
}));
// Standbild in der freigeschalteten Auflösung (über den TMDB-Proxy, nie die Original-URL)
api.get('/screening/image', wrap(async (req, res) => {
  const { size, file } = await collection.sessionImage(req.account, intParam(req.query.r), Number(req.query.l));
  req.params = { size, file };
  await tmdb.imageProxy(req, res, { cache: false });
}));

//@@MORE_ROUTES@@

app.use('/api', api);

// ---------------------------------------------------------------- Start
registerJob('trakt', trakt.syncAll);

await migrate();
app.listen(config.port, () => {
  console.log(`Watchlfy läuft auf Port ${config.port}`);
  startScheduler();
});
