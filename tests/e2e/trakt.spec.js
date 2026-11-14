import { test, expect } from '@playwright/test';
import { newUser, importFile, waitTmdb, shot, goPanel } from './helpers.js';

test('Mit Trakt verbinden (OAuth), Verlauf holen, „Läuft gerade“, keine Doppelzählung', async ({ page }, ti) => {
  await newUser(page, ti);
  await goPanel(page, 'profile');
  await expect(page.locator('#trakt-body a[href="/auth/trakt"]')).toBeVisible();
  await page.click('#trakt-body a[href="/auth/trakt"]');
  await page.waitForURL((u) => u.pathname === '/');
  await page.waitForSelector('body.ready');
  await expect(page.locator('#toast')).toContainText('Trakt verbunden');
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
  await expect(page.locator('#toast')).toContainText('0 neue Einträge');
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
