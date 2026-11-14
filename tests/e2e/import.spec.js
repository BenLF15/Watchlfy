import { test, expect } from '@playwright/test';
import { newUser, importFile, waitTmdb, shot, watchErrors, goPanel, fixture, selectByText } from './helpers.js';

test('Registrierung über das Formular, leerer Zustand mit Import-Knöpfen', async ({ page }, ti) => {
  const errors = watchErrors(page);
  await page.goto('/login#register');
  await page.fill('#username', `reg${ti.project.name[0]}${Date.now() % 1e6}`);
  await page.fill('#password', 'passwort123');
  await page.fill('#password2', 'passwort123');
  await page.check('#privacy-consent');
  await page.click('#submit-btn');
  await page.waitForSelector('body.ready');
  // Neue Konten bekommen direkt den Import-Assistenten
  await expect(page.locator('#import-dialog')).toHaveAttribute('open', '');
  await expect(page.locator('#import-dialog .svc-btn')).toHaveCount(6);
  await shot(page, ti, 'import-choose');
  await page.click('#import-dialog [data-close-dialog]');
  await expect(page.locator('#view-empty')).toBeVisible();
  await expect(page.locator('#empty-services .svc-btn')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('Netflix-ZIP: Anleitung, Vorschau mit Profilen, Import, Übersicht mit Postern', async ({ page }, ti) => {
  const errors = watchErrors(page);
  await newUser(page, ti);
  await page.click('#import-open');
  await page.click('#import-dialog [data-import="netflix"]');
  await expect(page.locator('.imp-steps li')).toHaveCount(4);
  await expect(page.locator('.imp-links a').first()).toHaveAttribute('href', /netflix\.com/);
  await shot(page, ti, 'import-netflix-guide');
  await page.setInputFiles('#import-file', fixture('netflix-data.zip'));
  await page.waitForSelector('[data-import-commit]');
  await expect(page.locator('.imp-profiles label')).toHaveCount(2);
  await expect(page.locator('.imp-stats b').first()).toHaveText('14');
  await expect(page.locator('#import-body')).toContainText('1 Trailer');
  await shot(page, ti, 'import-netflix-preview');
  await page.click('[data-import-commit]');
  await expect(page.locator('.imp-done p').first()).toContainText('13 neue Einträge');
  await page.click('.imp-done [data-close-dialog]');
  await waitTmdb(page);
  await page.reload();
  await page.waitForSelector('body.ready');
  await expect(page.locator('[data-kpi="episodes"]')).toHaveText('12');
  await expect(page.locator('[data-kpi="movies"]')).toHaveText('1');
  await expect(page.locator('#overview-series .rank-card')).toHaveCount(3);
  await expect(page.locator('#overview-series .rank-card').first()).toContainText('Breaking Bad');
  await expect(page.locator('#hero .hero-slide.on .hero-title')).toHaveText('Breaking Bad');
  await expect(page.locator('#continue-row .wide-card').first()).toBeVisible();
  // Poster kommen über den eigenen Server
  await expect(page.locator('#overview-movies img.poster-img').first()).toHaveAttribute('src', /^\/img\/tmdb\/w185\//);
  await expect.poll(() => page.locator('#overview-movies img.poster-img').first().evaluate((i) => i.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('#service-split')).toContainText('Netflix');
  await shot(page, ti, 'overview');
  expect(errors).toEqual([]);
});

test('Erneuter Upload erzeugt keine Duplikate (Netflix-Kurzexport)', async ({ page }, ti) => {
  await newUser(page, ti);
  const first = await importFile(page, 'netflix', 'NetflixViewingHistory.csv');
  expect(first).toContain('7 neue Einträge');
  const again = await importFile(page, 'netflix', 'NetflixViewingHistory.csv');
  expect(again).toContain('0 neue Einträge, 7 waren schon vorhanden');
  await waitTmdb(page);
  // „Dark: Staffel 1: Geheimnisse“ → Folgennummer über den TMDB-Folgentitel ermittelt
  const prog = await (await page.request.get('/api/progress')).json();
  const dark = prog.series.find((s) => s.name === 'Dark');
  expect(dark.seen).toBeGreaterThanOrEqual(1);
  expect(dark.total).toBe(26);
});

test('Prime-CSV und Max-JSON werden erkannt; mehrere Dienste gleichzeitig', async ({ page }, ti) => {
  await newUser(page, ti);
  expect(await importFile(page, 'prime', 'prime.csv')).toContain('3 neue Einträge');
  expect(await importFile(page, 'max', 'max.json')).toContain('3 neue Einträge');
  await waitTmdb(page);
  await page.reload();
  await page.waitForSelector('body.ready');
  await page.locator('#range-control [data-range="all"]').click();
  await expect(page.locator('#service-split .svc-list li')).toHaveCount(2);
  await expect(page.locator('#service-split')).toContainText('Prime Video');
  await expect(page.locator('#service-split')).toContainText('Max');
});

test('Unklare Spalten → Zuordnungs-Dialog', async ({ page }, ti) => {
  await newUser(page, ti);
  await page.click('#import-open');
  await page.click('#import-dialog [data-import="other"]');
  await page.setInputFiles('#import-file', fixture('weird.csv'));
  await page.waitForSelector('.imp-map[open]');
  await expect(page.locator('#import-body .notice-inline.warn')).toBeVisible();
  await shot(page, ti, 'import-mapping');
  await selectByText(page, '.map-grid select[data-role="title"]', 'col_b');
  await selectByText(page, '.map-grid select[data-role="date"]', 'col_d');
  await page.click('[data-apply-map]');
  await expect(page.locator('#import-body .notice-inline.warn')).toHaveCount(0);
  await expect(page.locator('.imp-stats b').first()).toHaveText('2');
  await page.click('[data-import-commit]');
  await expect(page.locator('.imp-done')).toContainText('2 neue Einträge');
});

test('Import rückgängig machen und Dienst-Daten löschen', async ({ page }, ti) => {
  await newUser(page, ti);
  await importFile(page, 'prime', 'prime.csv');
  await goPanel(page, 'profile');
  await expect(page.locator('#import-history [data-undo-import]')).toHaveCount(1);
  page.once('dialog', (d) => d.accept());
  await page.click('#import-history [data-undo-import]');
  await expect(page.locator('#toast')).toContainText('3 Einträge entfernt');
  const st = await (await page.request.get('/api/status')).json();
  expect(st.counts.views).toBe(0);
});
