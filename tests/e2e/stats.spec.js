import { test, expect } from '@playwright/test';
import { newUser, importFile, waitTmdb, shot, watchErrors, goPanel } from './helpers.js';

test.describe('Statistik', () => {
  test.beforeEach(async ({ page }, ti) => {
    await newUser(page, ti);
    await importFile(page, 'netflix', 'netflix-data.zip', { profiles: ['Ben'] });
    await importFile(page, 'prime', 'prime.csv');
    await waitTmdb(page);
    await page.reload();
    await page.waitForSelector('body.ready');
  });

  test('Top-Listen: Serien, Filme, Genres, Schauspieler, Länder', async ({ page }, ti) => {
    const errors = watchErrors(page);
    await goPanel(page, 'top');
    await expect(page.locator('#podium .rank-card')).not.toHaveCount(0);
    await expect(page.locator('#podium .rank-card').first()).toContainText('Breaking Bad');
    for (const [kind, text] of [['movies', 'Dune'], ['genres', 'Drama'], ['actors', 'Bryan Cranston'], ['countries', 'Vereinigte Staaten']]) {
      await page.click(`#top-kind [data-kind="${kind}"]`);
      await expect(page.locator('#top-title')).not.toBeEmpty();
      await expect(page.locator('main')).toContainText(text);
    }
    await shot(page, ti, 'top-countries');
    expect(errors).toEqual([]);
  });

  test('Schauzeiten: Heatmap und Binge-Erkennung', async ({ page }, ti) => {
    await goPanel(page, 'times');
    await expect(page.locator('#heatmap .heat-cell')).toHaveCount(168);
    await expect(page.locator('#heatmap .heat-cell.peak')).toHaveCount(1);
    const binge = page.locator('#binge-list .binge').first();
    await expect(binge).toContainText('Stranger Things');
    await expect(binge.locator('.binge-count b')).toHaveText('5');
    await shot(page, ti, 'times');
  });

  test('Fortschritt, Weiterschauen und Detailansicht', async ({ page }, ti) => {
    await goPanel(page, 'progress');
    const bb = page.locator('#progress-list .prog', { hasText: 'Breaking Bad' });
    await expect(bb).toContainText('6 / 62');
    await page.click('#progress-filter [data-filter="all"]');
    await expect(page.locator('#progress-continue .poster-card').first()).toBeVisible();
    await bb.click();
    await expect(page.locator('#detail-dialog')).toHaveAttribute('open', '');
    await expect(page.locator('#detail-title')).toHaveText('Breaking Bad');
    await expect(page.locator('.season-grid .sg-row')).toHaveCount(5);
    await expect(page.locator('.sg-eps i.on')).toHaveCount(6);
    await expect(page.locator('.detail-views li')).toHaveCount(6);
    await shot(page, ti, 'detail');
  });

  test('Verlauf mit Suche', async ({ page }, ti) => {
    await goPanel(page, 'history');
    await expect(page.locator('#history .day-card').first()).toBeVisible();
    await page.fill('#search-input', 'boys');
    await expect(page.locator('#history .hist')).toHaveCount(2);
    await expect(page.locator('#history .hist').first()).toContainText('The Boys');
    await shot(page, ti, 'history');
    await page.fill('#search-input', 'gibtesnicht');
    await expect(page.locator('#history')).toContainText('Nichts gefunden');
  });

  test('Unsicheren Treffer korrigieren', async ({ page }, ti) => {
    // „The Office (U.S.)“ → wird als „Das Büro“ gefunden; manuell auf Stranger Things umstellen und zurück
    await goPanel(page, 'profile');
    await page.locator('#review-card').scrollIntoViewIfNeeded();
    const det = await (await page.request.get('/api/history?q=office')).json();
    expect(det.items.length).toBe(1);
    await page.evaluate((id) => window.Watchlfy.openDetail({ id }), det.items[0].title_id);
    await page.click('#detail-dialog [data-correct]');
    await page.fill('#correct-q', 'Lucifer');
    await page.click('#correct-form button[type="submit"]');
    await page.click('.correct-item >> nth=0');
    await expect(page.locator('#toast')).toContainText('Gespeichert');
    const after = await (await page.request.get('/api/history?q=office')).json();
    expect(after.items[0].name).toBe('Lucifer');
  });
});

test('Kino-Ansicht: Hero-Karussell, gläserne Leiste, Poster gleitet ins Detail', async ({ page }, ti) => {
  await newUser(page, ti);
  await importFile(page, 'netflix', 'netflix-data.zip', { profiles: ['Ben'] });
  await importFile(page, 'prime', 'prime.csv');
  await waitTmdb(page);
  await page.reload();
  await page.waitForSelector('body.ready');
  await expect(page.locator('body')).toHaveClass(/on-hero/);
  await expect(page.locator('#hero .hero-slide')).not.toHaveCount(0);
  // Zeitraum-Wahl steht in der Programm-Kopfzeile
  await expect(page.locator('#page-head #range-bar')).toBeVisible();
  await expect(page.locator('#page-title')).toHaveText('Übersicht');
  await page.click('#hero .hero-dots [data-hero="1"]');
  await expect(page.locator('#hero .hero-slide[data-i="1"]')).toHaveClass(/on/);
  // Bilder blenden ein
  await expect(page.locator('#overview-series img.poster-img.is-loaded').first()).toBeVisible();
  // Kopfzeile (Handy) wird beim Scrollen gläsern
  await page.mouse.wheel(0, 600);
  await expect(page.locator('#appbar')).toHaveClass(/scrolled/);
  // Detail öffnet aus dem Poster
  await page.locator('#overview-series .rank-card').first().click();
  await expect(page.locator('#detail-dialog')).toHaveAttribute('open', '');
  await expect(page.locator('#detail-title')).toHaveText('Breaking Bad');
  await expect(page.locator('#detail-dialog .vt-poster')).toBeVisible();
  // In anderen Bereichen kein Hero
  await page.keyboard.press('Escape');
  await goPanel(page, 'history');
  await expect(page.locator('#hero')).toBeHidden();
  await expect(page.locator('#page-title')).toHaveText('Verlauf');
});
