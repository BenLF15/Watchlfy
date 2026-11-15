import { test, expect } from '@playwright/test';
import { newUser, importFile, waitTmdb, shot, goPanel, watchErrors } from './helpers.js';

async function setup(page, ti) {
  const u = await newUser(page, ti);
  await importFile(page, 'netflix', 'netflix-data.zip', { profiles: ['Ben'] });
  await importFile(page, 'max', 'max.json');
  await waitTmdb(page);
  await page.reload();
  await page.waitForSelector('body.ready');
  return u;
}
const bal = async (page) => (await (await page.request.get('/api/collection')).json()).balance;

test('Videothek betreten, Stück anheben, zurücklegen, kaufen → im Regal', async ({ page }, ti) => {
  const errors = watchErrors(page);
  await setup(page, ti);
  await goPanel(page, 'collection');
  await expect(page.locator('.col-head .balance .coin')).toHaveCount(2);
  await expect(page.locator('.lounge .oled-screen')).toBeVisible();
  await expect(page.locator('.lounge .holo-slot')).toHaveCount(3);
  await page.click('[data-coltab="store"]');
  await expect(page.locator('.store-front .sf-sign')).toBeVisible();
  await shot(page, ti, 'store-front');
  await page.click('.sf-enter');
  await expect(page.locator('.store-room .st-shelf')).toHaveCount(3);
  // günstigstes bezahlbares Stück suchen (Bronze)
  const before = await bal(page);
  const item = page.locator('.st-item:has(.coin-meters)').first();
  await item.click();
  await expect(page.locator('#item-dialog')).toHaveAttribute('open', '');
  await expect(item).toHaveClass(/lifted/);
  await shot(page, ti, 'store-lift');
  await page.click('[data-putback]');
  await expect(item).not.toHaveClass(/lifted/);
  await item.click();
  await page.click('[data-buy]');
  await expect(page.locator('#toast')).toContainText('steht jetzt in deinem Regal');
  const after = await bal(page);
  expect(Number(after.meters)).toBeLessThan(Number(before.meters));
  await page.click('[data-coltab="shelf"]');
  await expect(page.locator('#col-body [data-own]')).toHaveCount(1);
  await shot(page, ti, 'shelf');
  // Fernseher: umschalten per Knopf, Bild öffnet die Detailansicht
  const ch0 = await page.locator('.oled-count').textContent();
  await page.click('[data-tv-zap="1"]');
  await expect(page.locator('.oled-count')).not.toHaveText(ch0);
  await page.click('.oled-screen');
  await expect(page.locator('#detail-dialog')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  // nochmal kaufen geht nicht
  const id = await page.locator('#col-body [data-own]').first().getAttribute('data-own');
  const r = await page.request.post('/api/collection/buy', { data: { id } });
  expect(r.status()).toBe(409);
  expect(errors).toEqual([]);
});

test('Kinokasse: Filmmeter gegen Goldticket und Verdienst-Liste', async ({ page }, ti) => {
  await setup(page, ti);
  await goPanel(page, 'collection');
  await page.click('[data-coltab="notes"]');
  await expect(page.locator('.earn-list li')).not.toHaveCount(0);
  await expect(page.locator('.earn-list li.done').first()).toBeVisible();
  const b0 = await bal(page);
  expect(Number(b0.meters)).toBeGreaterThanOrEqual(200);
  await expect(page.locator('.bo-wallet')).toBeVisible();
  await page.click('[data-exchange="1"]');
  await expect.poll(async () => Number((await bal(page)).tickets)).toBe(Number(b0.tickets) + 1);
  expect(Number((await bal(page)).meters)).toBe(Number(b0.meters) - 200);
  await shot(page, ti, 'notes');
});

test('Vorführraum: Standbild wird schärfer, Antworten, Belohnung', async ({ page }, ti) => {
  await setup(page, ti);
  await goPanel(page, 'collection');
  await page.click('[data-coltab="screening"]');
  await page.click('[data-scr-start]');
  await expect(page.locator('.screen.lvl-1 img')).toHaveAttribute('src', /l=1/);
  await expect(page.locator('.scr-opt')).toHaveCount(4);
  await page.click('[data-scr-reveal]');
  await expect(page.locator('.screen.lvl-2 img')).toHaveAttribute('src', /l=2/);
  await shot(page, ti, 'screening');
  // Höhere Stufe als freigeschaltet liefert der Server nicht
  const s = (await (await page.request.get('/api/screening')).json()).session;
  const total = s.rounds.length;
  for (let i = 0; i < total; i++) {
    await page.locator('.scr-opt').first().click();
    await expect(page.locator('.scr-opt.right')).toHaveCount(1);
    await page.waitForTimeout(1900);
  }
  await expect(page.locator('.screen-room.done')).toBeVisible();
  const done = (await (await page.request.get('/api/screening')).json()).session;
  expect(done.done).toBe(true);
  expect(done.rewarded).toBe(true);
  const again = await page.request.post('/api/screening/answer', { data: { round: 0, choice: 1 } });
  expect(again.status()).toBe(400);
});

test('Veredeln (Admin-Gratismodus) und verstecktes Geschenk', async ({ page }, ti) => {
  await setup(page, ti);
  const shop = (await (await page.request.get('/api/collection')).json()).shop.items;
  const it = [...shop.tv, ...shop.movie, ...shop.poster].find((x) => x.rarity === 'common' && x.price.cur === 'meters');
  expect(it).toBeTruthy();
  expect((await page.request.post('/api/collection/buy', { data: { id: it.id } })).ok()).toBeTruthy();
  await goPanel(page, 'collection');
  await page.click('[data-coltab="screening"]');
  // Veredeln zu „selten“ kostet 80 Filmmeter
  const b = await bal(page);
  test.skip(Number(b.meters) < 80, 'nicht genug Filmmeter zum Veredeln');
  await page.reload(); await page.waitForSelector('body.ready');
  await page.click('[data-coltab="screening"]');
  await page.click(`.refine-list [data-refine="${it.id}"]`);
  await expect(page.locator('#toast')).toContainText('selten');
  // Geschenk: ist irgendwo versteckt
  await goPanel(page, 'overview');
  const gift = page.locator('.hidden-gift');
  if (await gift.isVisible()) {
    await gift.evaluate((el) => el.click());
    await expect(page.locator('#gift-dialog')).toHaveAttribute('open', '');
    await shot(page, ti, 'gift');
  } else {
    expect((await page.request.post('/api/collection/gift')).ok()).toBeTruthy();
  }
  expect((await page.request.post('/api/collection/gift')).status()).toBe(409);
});

test('Festlich geschmückte Videothek (Weihnachten)', async ({ page }, ti) => {
  await setup(page, ti);
  await page.evaluate(() => { localStorage.setItem('seasonDate', `${new Date().getFullYear()}-12-24`); });
  await page.reload(); await page.waitForSelector('body.ready');
  await goPanel(page, 'collection');
  await page.click('[data-coltab="store"]');
  await expect(page.locator('.store-front .store-garland span').first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-fest', 'christmas');
  await shot(page, ti, 'store-christmas');
});
