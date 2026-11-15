import { test, expect } from '@playwright/test';
import { newUser, shot, goPanel, loginAs, watchErrors } from './helpers.js';

test('Darstellung, Liquid Glass und Sprache werden gespeichert', async ({ page }, ti) => {
  await newUser(page, ti);
  await goPanel(page, 'profile');
  // Jede Einstellung erst speichern lassen, bevor die nächste kommt (der Sprachwechsel lädt die Seite neu)
  const saved = () => page.waitForResponse((r) => r.url().endsWith('/api/me/settings') && r.request().method() === 'POST');
  let wait = saved();
  await page.click('[data-theme-mode="light"]');
  await wait;
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  wait = saved();
  await page.click('#glass-switch');
  await wait;
  await expect(page.locator('html')).toHaveAttribute('data-glass', '1');
  await shot(page, ti, 'profile-light-glass');
  await Promise.all([page.waitForEvent('load'), page.click('#lang-picker [data-lang="en"]')]);
  await page.waitForSelector('body.ready');
  await expect(page.locator('#panel-tabs [data-panel="overview"] span')).toHaveText('Overview');
  const st = await (await page.request.get('/api/status')).json();
  expect(st.account.theme).toBe('light');
  expect(st.account.glass).toBe(true);
  expect(st.account.lang).toBe('en');
});

for (const lang of ['de', 'en', 'fr', 'es', 'it', 'sv', 'da']) {
  test(`Keine fehlenden Texte (${lang})`, async ({ page }, ti) => {
    const errors = watchErrors(page);
    await newUser(page, ti, { lang });
    for (const p of ['overview', 'profile']) {
      await goPanel(page, p);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/\b(nav|kpi|import|empty|settings|theme|account|btn|trakt|review|sources|tmdb|legal|avatar)\.[a-zA-Z.]+\b/);
    }
    expect(errors).toEqual([]);
  });
}

test('Admin sieht Admin-Bereich mit Konten', async ({ page }, ti) => {
  await loginAs(page, 'admin', 'adminpass1');
  await page.goto('/');
  await page.waitForSelector('body.ready');
  await goPanel(page, 'admin');
  await expect(page.locator('#admin-users .user-row').first()).toBeVisible();
  await expect(page.locator('#admin-system')).toContainText('TMDB');
  await shot(page, ti, 'admin');
});

test('Admin: Videothek kostenlos schalten (an und wieder aus)', async ({ page }, ti) => {
  // Der Admin ist für alle Tests derselbe – nur in einem Projekt schalten, damit sich nichts überschneidet
  test.skip(ti.project.name !== 'desktop', 'nur einmal');
  await loginAs(page, 'admin', 'adminpass1');
  await page.goto('/');
  await page.waitForSelector('body.ready');
  await goPanel(page, 'admin');
  const sw = page.locator('#free-shop-switch');
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('#toast')).toContainText('kostenlos');
  expect((await (await page.request.get('/api/status')).json()).account.free_shop).toBe(true);
  expect((await (await page.request.get('/api/collection')).json()).freeShop).toBe(true);
  // nach dem Neuladen steht der Schalter weiter auf „an“
  await page.reload(); await page.waitForSelector('body.ready');
  await goPanel(page, 'admin');
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  expect((await (await page.request.get('/api/status')).json()).account.free_shop).toBe(false);
});

test('Datenexport liefert JSON ohne Passwort-Hash', async ({ page }, ti) => {
  await newUser(page, ti);
  const r = await page.request.get('/api/me/export');
  const j = await r.json();
  expect(j.format).toBe('watchlfy-export');
  expect(JSON.stringify(j)).not.toContain('scrypt$');
});

test('Datenschutz-Seite ist öffentlich', async ({ page }) => {
  await page.goto('/datenschutz');
  await expect(page.locator('#legal h1')).toHaveText('Datenschutzerklärung');
  await expect(page.locator('#legal')).toContainText('TMDB');
});

test('Zuordnungen prüfen: Zusammenfassung, erst 3 Titel, Rest aufklappbar', async ({ page }, ti) => {
  await newUser(page, ti);
  const d = new Date(Date.now() - 3 * 864e5);
  const dmy = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
  const names = ['Gibtesnicht Eins', 'Gibtesnicht Zwei', 'Gibtesnicht Drei', 'Gibtesnicht Vier', 'Gibtesnicht Fünf'];
  const csv = `Title,Date\n${names.map((x) => `"${x}","${dmy}"`).join('\n')}\n`;
  const pv = await (await page.request.post('/api/import/preview?source=netflix', { headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': 'NetflixViewingHistory.csv' }, data: Buffer.from(csv) })).json();
  expect((await page.request.post('/api/import/commit', { data: { token: pv.token } })).ok()).toBeTruthy();
  for (let i = 0; i < 60; i++) { const s = await (await page.request.get('/api/status')).json(); if (!s.tmdb.pending && !s.tmdb.loading) break; await page.waitForTimeout(300); }
  await page.reload(); await page.waitForSelector('body.ready');
  await goPanel(page, 'profile');
  const list = page.locator('#review-body .review-list');
  await expect(page.locator('#review-body .review-chip.none')).toContainText('5');
  await expect(list.locator('li:visible:not(.fold-row)')).toHaveCount(3);
  await list.locator('[data-fold]').click();
  await expect(list.locator('li:visible:not(.fold-row)')).toHaveCount(5);
  await shot(page, ti, 'review-fold');
});
