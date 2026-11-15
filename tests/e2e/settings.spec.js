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
