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
    // Schauspieler mit Foto (TMDB-Porträt über den eigenen Server), ohne Foto weiter mit Initialen
    await page.click('#top-kind [data-kind="actors"]');
    await expect(page.locator('#podium .podium-item.is-face img.poster-img').first()).toBeVisible();
    await expect(page.locator('#podium .podium-item.is-face img.poster-img').first()).toHaveAttribute('src', /\/img\/tmdb\/w185\/a-/);
    await expect(page.locator('#top-list .cover.face img').first()).toBeVisible();
    await shot(page, ti, 'top-actors');
    await page.click('#top-kind [data-kind="countries"]');
    await shot(page, ti, 'top-countries');
    expect(errors).toEqual([]);
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

  test('Fortschritt: erst 5 Serien, Rest aufklappbar', async ({ page }, ti) => {
    // ein paar weitere Serien, damit es mehr als 5 sind
    const d = new Date(Date.now() - 3 * 864e5);
    const dmy = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
    const csv = `Title,Date\n${['Squid Game: Staffel 1: Folge 1', 'Lucifer: Staffel 1: Folge 1', 'Haus des Geldes: Teil 1: Folge 1', 'Dark: Staffel 1: Geheimnisse'].map((x) => `"${x}","${dmy}"`).join('\n')}\n`;
    const pv = await (await page.request.post('/api/import/preview?source=netflix', { headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': 'NetflixViewingHistory.csv' }, data: Buffer.from(csv) })).json();
    expect((await page.request.post('/api/import/commit', { data: { token: pv.token } })).ok()).toBeTruthy();
    await waitTmdb(page);
    await page.reload();
    await page.waitForSelector('body.ready');
    await goPanel(page, 'progress');
    await page.click('#progress-filter [data-filter="all"]');
    const total = (await (await page.request.get('/api/progress')).json()).series.length;
    expect(total).toBeGreaterThan(5);
    await expect(page.locator('#progress-list .prog')).toHaveCount(5);
    await expect(page.locator('#progress-toggle')).toContainText(String(total - 5));
    await page.click('#progress-toggle');
    await expect(page.locator('#progress-list .prog')).toHaveCount(total);
    await expect(page.locator('#progress-toggle')).toHaveAttribute('aria-expanded', 'true');
    await shot(page, ti, 'progress-open');
    await page.click('#progress-toggle');
    await expect(page.locator('#progress-list .prog')).toHaveCount(5);
  });

  test('Verlauf: letzte Woche offen, Monate zugeklappt und aufklappbar', async ({ page }, ti) => {
    await goPanel(page, 'history');
    const groups = (await (await page.request.get('/api/history/groups')).json()).groups;
    expect(groups.length).toBeGreaterThan(1);
    expect(groups.every((g, i) => i === 0 || /^\d{4}-\d{2}$/.test(g.grp))).toBe(true);
    const first = page.locator('#history .hist-group').first();
    await expect(first).toHaveClass(/open/);
    await expect(first.locator('.hist').first()).toBeVisible();
    const month = page.locator('#history .hist-group').nth(1);
    await expect(month).not.toHaveClass(/open/);
    await expect(month.locator('.hg-title')).not.toHaveText('');
    await month.locator('.hg-head').click();
    await expect(month).toHaveClass(/open/);
    // Tage im Monat sind kompakt zusammengefasst und klappen einzeln auf
    const day = month.locator('details.day-card').first();
    await expect(day).not.toHaveAttribute('open', '');
    await expect(day.locator('.day-names')).not.toHaveText('');
    await expect(month.locator('.hist').first()).toBeHidden();
    await day.locator('summary').click();
    await expect(day.locator('.hist').first()).toBeVisible();
    expect(await month.locator('.hist').count()).toBe(groups[1].n);
    await shot(page, ti, 'history-groups');
    await month.locator('.hg-head').click();
    await expect(month).not.toHaveClass(/open/);
  });

  test('Detail: Verlauf je Staffel einklappbar, lange Listen gekürzt', async ({ page }, ti) => {
    const day = (n) => { const d = new Date(Date.now() - n * 864e5); return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`; };
    const rows = [...Array.from({ length: 10 }, (_, i) => [`Dark: Staffel 1: Folge ${i + 1}`, day(40 - i)]), ['Dark: Staffel 2: Folge 1', day(2)]];
    const csv = `Title,Date\n${rows.map(([a, b]) => `"${a}","${b}"`).join('\n')}\n`;
    const pv = await (await page.request.post('/api/import/preview?source=netflix', { headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': 'NetflixViewingHistory.csv' }, data: Buffer.from(csv) })).json();
    expect((await page.request.post('/api/import/commit', { data: { token: pv.token } })).ok()).toBeTruthy();
    await waitTmdb(page);
    const id = (await (await page.request.get('/api/history?q=dark')).json()).items[0].title_id;
    await page.evaluate((x) => window.Watchlfy.openDetail({ id: x }), id);
    const seasons = page.locator('#detail-dialog .dv-season');
    await expect(seasons).toHaveCount(2);
    await expect(seasons.first()).toHaveAttribute('open', '');
    await expect(seasons.nth(1)).not.toHaveAttribute('open', '');
    await seasons.nth(1).locator('summary').click();
    const s1 = seasons.nth(1).locator('.detail-views');
    await expect(s1.locator('li:visible:not(.fold-row)')).toHaveCount(8);
    await s1.locator('[data-fold]').click();
    await expect(s1.locator('li:visible:not(.fold-row)')).toHaveCount(10);
    await shot(page, ti, 'detail-seasons');
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
  // Kanal wechseln: Desktop per Zifferntaste, Handy per Zapper
  if ((page.viewportSize()?.width || 1000) >= 700) {
    await page.keyboard.press('3');
    await expect(page.locator('#page-title')).toHaveText('Fortschritt');
    await expect(page.locator('#panel-tabs [data-panel="progress"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#panel-tabs [data-panel="times"]')).toHaveCount(0);
  } else {
    await page.click('#zapper [data-zap="1"]');
    await expect(page.locator('#page-title')).toHaveText('Rückblick');
    await expect(page.locator('#zap-ch')).toHaveText('05');
  }
});
