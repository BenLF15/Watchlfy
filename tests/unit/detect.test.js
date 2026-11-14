import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../../src/parse/csv.js';
import { detectColumns, parseDuration, parseWhen, toEntries, dateOrder } from '../../src/parse/detect.js';
import { extractTables } from '../../src/parse/tables.js';
import { zipSync, strToU8 } from 'fflate';

test('CSV mit Anführungszeichen, BOM, Semikolon', () => {
  const t = parseCsv('﻿Titel;Datum\n"Dark: Staffel 1: ""Geheimnisse""";14.11.26\n');
  assert.deepEqual(t.headers, ['Titel', 'Datum']);
  assert.deepEqual(t.rows[0], ['Dark: Staffel 1: "Geheimnisse"', '14.11.26']);
});

test('Dauer- und Datumsformate', () => {
  assert.equal(parseDuration('0:45:12'), 2712);
  assert.equal(parseDuration('PT1H2M'), 3720);
  assert.equal(parseDuration('45 min'), 2700);
  assert.equal(parseDuration('2712000', 'Duration (ms)'), 2712);
  assert.equal(parseWhen('2024-03-01 21:15:00').date.toISOString(), '2024-03-01T21:15:00.000Z');
  assert.equal(parseWhen('2024-03-01T21:15:00+01:00').date.toISOString(), '2024-03-01T20:15:00.000Z');
  assert.equal(parseWhen('14.11.26').timeKnown, false);
  assert.equal(parseWhen('11/14/26', 'mdy').date.toISOString().slice(0, 10), '2026-11-14');
  assert.equal(dateOrder(['11/14/26', '1/2/26']), 'mdy');
});

test('Netflix-Detail-CSV wird erkannt, Trailer übersprungen', () => {
  const csv = `Profile Name,Start Time,Duration,Attributes,Title,Supplemental Video Type,Device Type,Bookmark,Latest Bookmark,Country
Ben,2024-05-01 20:00:00,00:47:10,,Dark: Season 1: Secrets (Episode 1),,Samsung TV,00:47:10,00:47:10,DE (Germany)
Ben,2024-05-01 20:50:00,00:01:10,,Dark: Season 1 (Trailer),TRAILER,Samsung TV,00:01:10,00:01:10,DE (Germany)
Kids,2024-05-02 08:00:00,00:00:20,,Peppa Pig: Season 1: Episode 3,,iPad,,,DE (Germany)`;
  const t = parseCsv(csv);
  const { mapping, needsMapping } = detectColumns(t.headers, t.rows);
  assert.equal(needsMapping, false);
  assert.equal(t.headers[mapping.title], 'Title');
  assert.equal(t.headers[mapping.start], 'Start Time');
  assert.equal(t.headers[mapping.profile], 'Profile Name');
  const { entries, skipped } = toEntries({ headers: t.headers, rows: t.rows }, mapping);
  assert.equal(entries.length, 1);
  assert.equal(skipped.trailer, 1);
  assert.equal(skipped.short, 1);
  assert.equal(entries[0].series, 'Dark');
  assert.equal(entries[0].episode, 1);
  assert.equal(entries[0].duration_sec, 2830);
});

test('Unbekanntes Prime-Format mit getrennter Serie/Folge', () => {
  const csv = `Playback Start (UTC),Series Title,Episode Title,Season,Episode Number,Playback Duration (sec),Device
2024-01-02T19:00:00Z,The Boys,The Name of the Game,1,1,3600,FireTV
2024-01-03T19:00:00Z,,Reacher,,,6000,FireTV`;
  const t = parseCsv(csv);
  const { mapping, needsMapping } = detectColumns(t.headers, t.rows);
  assert.equal(needsMapping, false, JSON.stringify(mapping));
  const { entries } = toEntries({ headers: t.headers, rows: t.rows }, mapping);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].kind_hint, 'tv');
  assert.equal(entries[0].series, 'The Boys');
  assert.equal(entries[0].season, 1);
  assert.equal(entries[0].episode, 1);
  assert.equal(entries[0].duration_sec, 3600);
});

test('ZIP + JSON werden gefunden und abgeflacht', () => {
  const json = JSON.stringify({ profiles: [{ name: 'A' }], history: [{ title: 'Succession: Season 1: Celebration', watchedAt: '2024-02-02T20:00:00Z', meta: { device: 'TV' } }] });
  const zip = zipSync({ 'Max/ViewingHistory.json': strToU8(json), 'Max/readme.txt': strToU8('hallo') });
  const tables = extractTables(Buffer.from(zip), 'max.zip');
  const hist = tables.find((t) => t.name.includes('history'));
  assert.ok(hist);
  assert.ok(hist.headers.includes('meta.device'));
});
