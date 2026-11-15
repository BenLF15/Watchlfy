import { test, expect } from '@playwright/test';
import { newUser, importFile, waitTmdb, shot, goPanel } from './helpers.js';
import pg from 'pg';

test('Mit Trakt verbinden (OAuth), Verlauf holen, „Läuft gerade“, keine Doppelzählung', async ({ page }, ti) => {
  await newUser(page, ti);
  await goPanel(page, 'profile');
  await expect(page.locator('#trakt-body a[href="/auth/trakt"]')).toBeVisible();
  await page.click('#trakt-body a[href="/auth/trakt"]');
  await page.waitForURL((u) => u.pathname === '/');
  await page.waitForSelector('body.ready');
  await expect(page.locator('#toast')).toContainText('Trakt verbunden');
  // Anmeldung lief per PKCE (Prüfwert statt Client Secret) – wie bei Trakt-Apps ohne Secret
  const grant = await (await page.request.get('http://127.0.0.1:4199/mock/last-grant')).json();
  expect(grant).toEqual({ pkce: true, secret: false });
  // Erster Sync läuft im Hintergrund
  await expect.poll(async () => (await (await page.request.get('/api/status')).json()).counts.views, { timeout: 20_000 }).toBe(4);
  await waitTmdb(page);
  await page.reload();
  await page.waitForSelector('body.ready');
  await expect(page.locator('#now-playing')).toBeVisible();
  await expect(page.locator('#now-playing .np-title')).toHaveText('Dark');
  await shot(page, ti, 'trakt-now-playing');
  await goPanel(page, 'profile');
  await expect(page.locator('#trakt-body')).toContainText('mockuser');
  // Erneuter Sync: nichts doppelt
  await page.click('[data-trakt-sync]');
  // Nichts Neues: die Meldung sagt, warum (schon über Trakt da)
  await expect(page.locator('#toast')).toContainText('Alles aktuell');
  await expect(page.locator('#toast')).toContainText('4 hat Watchlfy schon über Trakt');
  await expect(page.locator('#trakt-body')).toContainText('4 Einträge');
  // Trakt-Einträge mit TMDB-ID sind sofort sicher zugeordnet
  const prog = await (await page.request.get('/api/progress')).json();
  expect(prog.series.find((s) => s.name === 'Dark').seen).toBe(2);
  // Trennen
  page.once('dialog', (d) => d.accept());
  await page.click('[data-trakt-disconnect]');
  await expect(page.locator('#trakt-body a[href="/auth/trakt"]')).toBeVisible();
});

test('Trakt-Eintrag wird übersprungen, wenn dieselbe Folge schon aus Netflix kommt', async ({ page }, ti) => {
  await newUser(page, ti);
  // Netflix-Kurzexport enthält Dark S1 vor 40 Tagen; Trakt-Mock liefert Dark S1E10/S2E1 von heute → beides neu
  await importFile(page, 'netflix', 'NetflixViewingHistory.csv');
  await page.goto('/auth/trakt');
  await page.waitForSelector('body.ready');
  await expect.poll(async () => (await (await page.request.get('/api/status')).json()).counts.views, { timeout: 20_000 }).toBe(11);
  const st = await (await page.request.get('/api/status')).json();
  expect(st.counts.sources.sort()).toEqual(['netflix', 'trakt']);
});

test('Nachgetragene Trakt-Historie (Streaming Scrobbler) wird gefunden, Symbol dreht sich beim Abgleich', async ({ page }, ti) => {
  const user = await newUser(page, ti);
  await page.goto('/auth/trakt');
  await page.waitForURL(/\/(\?|$)/);
  await page.waitForSelector('body.ready');
  const before = (await (await page.request.get('/api/dashboard?range=all')).json()).overview.views;
  // Trakt trägt alte Einträge mit ihrem ursprünglichen Datum nach – älter als alles bisher Bekannte
  const db = new pg.Client({ connectionString: process.env.TEST_DATABASE_URL || 'postgres://postgres@127.0.0.1:5433/watchlfy_test' });
  await db.connect();
  const { rows } = await db.query('SELECT t.access_token FROM trakt_tokens t JOIN accounts a ON a.id = t.account_id WHERE a.username = $1', [user]);
  await db.end();
  expect((await page.request.get(`http://127.0.0.1:4199/mock/backfill?token=${encodeURIComponent(rows[0].access_token)}`)).ok()).toBeTruthy();
  await goPanel(page, 'profile');
  const btn = page.locator('[data-trakt-sync]');
  await btn.click();
  await expect(btn).toHaveClass(/is-syncing/);
  await expect(btn).toHaveAttribute('aria-busy', 'true');
  await shot(page, ti, 'trakt-syncing');
  await expect(page.locator('#toast')).toContainText('2 neue Einträge');
  await expect(page.locator('[data-trakt-sync]')).not.toHaveClass(/is-syncing/);
  const after = (await (await page.request.get('/api/dashboard?range=all')).json()).overview.views;
  expect(after).toBe(before + 2);
});

test('Videothek und Fernseher funktionieren auch nur mit Trakt (ohne Import)', async ({ page }, ti) => {
  await newUser(page, ti);
  await page.goto('/auth/trakt');
  await page.waitForURL(/\/(\?|$)/);
  await page.waitForSelector('body.ready');
  await waitTmdb(page);
  const st = await (await page.request.get('/api/status')).json();
  expect(st.counts.sources).toEqual(['trakt']);
  const c = await (await page.request.get('/api/collection')).json();
  const mine = Object.values(c.shop.items).flat().filter((x) => !x.discover);
  expect(mine.length).toBeGreaterThan(0);
  const traktTitles = ['Dark', 'Oppenheimer', 'The Last of Us'];
  expect(mine.every((x) => traktTitles.includes(x.name))).toBe(true);
  expect(c.channels.map((x) => x.name).sort()).toEqual([...traktTitles].sort());
  // „Erster Verlauf“ gibt es auch für den Trakt-Abgleich
  expect(c.earn.find((e) => e.id === 'import').done).toBe(true);
});

test('Abgleich ohne Neues erklärt, was schon aus Importen bekannt ist', async ({ page }, ti) => {
  await newUser(page, ti);
  // Oppenheimer kommt im Trakt-Mock vor 30 Std. – derselbe Film steht schon im Netflix-Export
  const d = new Date(Date.now() - 30 * 3600e3);
  const dmy = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
  const pv = await (await page.request.post('/api/import/preview?source=netflix', { headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': 'NetflixViewingHistory.csv' }, data: Buffer.from(`Title,Date\n"Oppenheimer","${dmy}"\n`) })).json();
  expect((await page.request.post('/api/import/commit', { data: { token: pv.token } })).ok()).toBeTruthy();
  await page.goto('/auth/trakt');
  await page.waitForURL(/\/(\?|$)/);
  await page.waitForSelector('body.ready');
  const r = await (await page.request.post('/api/trakt/sync', { data: {} })).json();
  expect(r).toMatchObject({ added: 0, fetched: 4, existing: 3, fromImports: 1 });
  await goPanel(page, 'profile');
  await page.click('[data-trakt-sync]');
  await expect(page.locator('#toast')).toContainText('1 kennt es bereits aus deinen Importen');
});
