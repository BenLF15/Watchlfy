import { test, expect } from '@playwright/test';
const ctxOpts = (ti) => { const u = ti.project.use; return { baseURL: u.baseURL, viewport: u.viewport, userAgent: u.userAgent, deviceScaleFactor: u.deviceScaleFactor, isMobile: u.isMobile, hasTouch: u.hasTouch, locale: u.locale, timezoneId: u.timezoneId }; };
import { newUser, importFile, waitTmdb, shot, goPanel, watchErrors } from './helpers.js';

test('Rückblick: Jahresübersicht und Story mit Folien, Wischen schließt', async ({ page }, ti) => {
  const errors = watchErrors(page);
  await newUser(page, ti);
  await importFile(page, 'netflix', 'netflix-data.zip', { profiles: ['Ben'] });
  await importFile(page, 'prime', 'prime.csv');
  await waitTmdb(page);
  await goPanel(page, 'wrapped');
  await expect(page.locator('#wrapped .wrapped-hero h2')).toContainText('Dein Jahr in Serien');
  await expect(page.locator('#wrapped .poster-row').first().locator('.poster-card')).not.toHaveCount(0);
  await shot(page, ti, 'wrapped');
  await page.click('[data-story-start]');
  await expect(page.locator('#story')).toHaveAttribute('open', '');
  await expect(page.locator('#story .st-slide.active')).toHaveClass(/st-intro/);
  await page.click('#story .st-nav.next');
  await expect(page.locator('#story .st-slide.active .st-num')).toBeVisible();
  await page.click('#story .st-nav.next');
  await expect(page.locator('#story .st-slide.active h2')).toHaveText('Breaking Bad');
  await shot(page, ti, 'story-series');
  // bis zum Abspann
  for (let i = 0; i < 10 && !(await page.locator('#story .st-slide.active.st-outro').count()); i++) await page.click('#story .st-nav.next');
  await expect(page.locator('#story .st-slide.active')).toHaveClass(/st-outro/);
  // Wischen nach unten schließt
  const box = await page.locator('#story-body').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + 200);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 420, { steps: 8 });
  await page.mouse.up();
  await expect(page.locator('#story')).not.toHaveAttribute('open', '');
  expect(errors).toEqual([]);
});

test('Freunde: Anfrage per Benutzername, annehmen, Match-Wert und gemeinsame Serien', async ({ browser }, ti) => {
  test.setTimeout(120_000);
  const ctxA = await browser.newContext(ctxOpts(ti));
  const a = await ctxA.newPage();
  const ua = await newUser(a, ti);
  const ctxB = await browser.newContext(ctxOpts(ti));
  const pb = await ctxB.newPage();
  const ub = await newUser(pb, ti);
  await importFile(a, 'netflix', 'netflix-data.zip', { profiles: ['Ben'] });
  await importFile(pb, 'netflix', 'netflix-data.zip', { profiles: ['Kids', 'Ben'] });
  await waitTmdb(a);
  await goPanel(a, 'friends');
  await a.fill('#friend-input', ub);
  await a.click('#friend-form button[type="submit"]');
  await expect(a.locator('#toast')).toContainText(`Anfrage an ${ub} gesendet`);
  await pb.reload();
  await pb.waitForSelector('body.ready');
  await goPanel(pb, 'friends');
  await expect(pb.locator('#friend-requests')).toContainText(ua);
  await pb.click('[data-friend-accept]');
  await expect(pb.locator('#friend-list')).toContainText(ua);
  await pb.click('[data-friend-compare]');
  await expect(pb.locator('.cmp-ring b')).toHaveText(/\d+ %/);
  await expect(pb.locator('.compare-card')).toContainText('Breaking Bad');
  const match = Number((await pb.locator('.cmp-ring b').innerText()).replace(/\D/g, ''));
  expect(match).toBeGreaterThan(50);
  await shot(pb, ti, 'friends-compare');
  await ctxA.close();
  await ctxB.close();
});
