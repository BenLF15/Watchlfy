// Prüft, dass jeder im Frontend verwendete Text-Schlüssel in allen 7 Sprachen existiert.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function loadD() {
  const src = fs.readFileSync('public/assets/i18n.js', 'utf8');
  const window = {};
  const document = { documentElement: {}, addEventListener() {}, querySelectorAll: () => [] };
  new Function('window', 'document', 'localStorage', 'navigator', src)(window, document, { getItem: () => null, setItem() {} }, { languages: ['de'] });
  return window.WatchlfyI18n.D;
}
const D = loadD();
const prefixes = new Set(Object.keys(D).map((k) => k.split('.')[0]));
const files = ['public/app.js', 'public/assets/extras.js', 'public/assets/collection.js', 'public/index.html', 'public/login.html', 'public/assets/login.js'];

test('alle Einträge haben 7 Sprachen', () => {
  for (const [k, v] of Object.entries(D)) assert.equal(v.length, 7, k);
});

test('alle verwendeten Schlüssel existieren', () => {
  const missing = new Set();
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/['"`:]([a-z][a-zA-Z]+\.[a-zA-Z0-9.]+)['"`;]/g)) {
      const k = m[1];
      if (!prefixes.has(k.split('.')[0]) || /\.(js|css|html|svg|png|json|com|tv|org|de)$/.test(k)) continue;
      if (D[k]) continue;
      if (D[`${k}.one`] && D[`${k}.other`]) continue;
      missing.add(`${k} (${f})`);
    }
  }
  assert.deepEqual([...missing], []);
});
