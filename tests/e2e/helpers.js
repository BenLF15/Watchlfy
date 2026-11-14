import fs from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import * as fx from '../fixtures.js';

let n = 0;
/** Neues Konto anlegen (per API) und angemeldet die App öffnen. */
export async function newUser(page, testInfo, { lang = 'de', open = true } = {}) {
  const username = `u${testInfo.project.name[0]}${Date.now() % 1e7}${n++}`;
  const r = await page.request.post('/api/auth/register', { data: { username, password: 'passwort123', privacy: true, lang } });
  expect(r.ok()).toBeTruthy();
  if (open) { await page.goto('/'); await page.waitForSelector('body.ready'); }
  return username;
}

export async function loginAs(page, username, password) {
  const r = await page.request.post('/api/auth/login', { data: { username, password } });
  expect(r.ok()).toBeTruthy();
}

const dir = path.join('test-results', 'fixtures');
/** Testdatei schreiben und Pfad liefern. */
export function fixture(name) {
  fs.mkdirSync(dir, { recursive: true });
  const map = {
    'NetflixViewingHistory.csv': fx.netflixSimple, 'netflix-data.zip': fx.netflixZip, 'prime.csv': fx.primeCsv,
    'max.json': fx.maxJson, 'weird.csv': fx.weirdCsv,
  };
  const file = path.join(dir, name);
  fs.writeFileSync(file, map[name]());
  return file;
}

/** Import über den Assistenten: Dienst wählen, Datei, (Profile), importieren. */
export async function importFile(page, service, name, { profiles = null } = {}) {
  if (!(await page.locator('#import-dialog').evaluate((d) => d.open))) await openImport(page);
  await page.click(`#import-dialog [data-import="${service}"]`);
  await page.setInputFiles('#import-file', fixture(name));
  await page.waitForSelector('[data-import-commit]');
  if (profiles) {
    for (const cb of await page.locator('input[name="imp-profile"]').all()) {
      const want = profiles.includes(await cb.getAttribute('value'));
      if ((await cb.isChecked()) !== want) await cb.click();
    }
  }
  await page.click('[data-import-commit]');
  await page.waitForSelector('.imp-done');
  const text = await page.locator('.imp-done p').first().innerText();
  await page.click('.imp-done [data-close-dialog]');
  await expect(page.locator('#import-dialog')).not.toHaveAttribute('open', '');
  return text;
}

/** Wartet, bis TMDB alles abgeglichen hat. */
export async function waitTmdb(page) {
  await expect.poll(async () => (await (await page.request.get('/api/status')).json()).tmdb.pending, { timeout: 30_000 }).toBe(0);
  await expect.poll(async () => (await (await page.request.get('/api/status')).json()).tmdb.loading, { timeout: 30_000 }).toBe(false);
}

export async function shot(page, testInfo, name) {
  fs.mkdirSync('tests/.screens', { recursive: true });
  await page.screenshot({ path: `tests/.screens/${testInfo.project.name}-${name}.png`, fullPage: false });
}

/** Sammelt Konsolenfehler (CSP, JS) – am Testende prüfen. */
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404 \(Not Found\)/.test(m.text())) errors.push(m.text()); });
  return errors;
}

export async function goPanel(page, panel) {
  const mobile = (page.viewportSize()?.width || 1000) < 700;
  if (panel === 'profile') { if (await page.locator('#view-profile:not([hidden])').count()) return; await page.click('#profile-btn'); await page.waitForSelector('#view-profile:not([hidden])'); return; }
  if (!mobile) { await page.click(`#panel-tabs [data-panel="${panel}"]`); return; }
  if (await page.locator(`#bottom-nav [data-bn="${panel}"]`).count()) { await page.click(`#bottom-nav [data-bn="${panel}"]`); return; }
  if (panel === 'profile') { if (await page.locator('#view-profile:not([hidden])').count()) return; await page.click('#profile-btn'); return; }
  await page.click('#bottom-nav [data-bn="more"]');
  await page.click(`#more-sheet [data-ms="${panel}"]`);
  await expect(page.locator('#more-sheet')).not.toHaveAttribute('open', '');
}

/** Option eines <select> per Teiltext wählen. */
export async function selectByText(page, selector, text) {
  const value = await page.locator(selector).evaluate((s, t) => [...s.options].find((o) => o.textContent.includes(t))?.value, text);
  await page.selectOption(selector, value);
}

/** Import-Assistent öffnen: Desktop über die Seitenleiste, Handy über den Knopf im Dock. */
export async function openImport(page) {
  if (await page.locator('#import-open').isVisible()) await page.click('#import-open');
  else await page.click('#bottom-nav [data-bn="import"]');
  await expect(page.locator('#import-dialog')).toHaveAttribute('open', '');
}
