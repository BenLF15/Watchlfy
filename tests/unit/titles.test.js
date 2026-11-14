import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitTitle, normName } from '../../src/parse/titles.js';

const cases = [
  ['Breaking Bad: Staffel 2: Folge 5', { kind: 'tv', series: 'Breaking Bad', season: 2, episode: 5, episodeName: null }],
  ['Stranger Things: Season 1: Chapter One: The Vanishing of Will Byers', { kind: 'tv', series: 'Stranger Things', season: 1, episode: null, episodeName: 'Chapter One: The Vanishing of Will Byers' }],
  ['The Office (U.S.): Season 2: The Dundies (Episode 1)', { kind: 'tv', series: 'The Office (U.S.)', season: 2, episode: 1, episodeName: 'The Dundies' }],
  ['Dark: Staffel 1: Geheimnisse', { kind: 'tv', series: 'Dark', season: 1, episode: null, episodeName: 'Geheimnisse' }],
  ['Unorthodox: Limitierte Serie: Folge 1', { kind: 'tv', series: 'Unorthodox', season: 1, episode: 1, episodeName: null }],
  ['Haus des Geldes: Teil 3: Folge 2', { kind: 'tv', series: 'Haus des Geldes', season: 3, episode: 2, episodeName: null }],
  ['Dune: Part Two', { kind: 'movie', series: 'Dune: Part Two', season: null, episode: null, episodeName: null }],
  ['John Wick: Chapter 2', { kind: 'movie', series: 'John Wick: Chapter 2', season: null, episode: null, episodeName: null }],
  ['The Boys - Season 1', { kind: 'tv', series: 'The Boys', season: 1, episode: null, episodeName: null }],
  ['Lupin: Saison 2: Épisode 3', { kind: 'tv', series: 'Lupin', season: 2, episode: 3, episodeName: null }],
  ['Bron/Broen: Säsong 4: Avsnitt 8', { kind: 'tv', series: 'Bron/Broen', season: 4, episode: 8, episodeName: null }],
  ['Inception', { kind: 'movie', series: 'Inception', season: null, episode: null, episodeName: null }],
  ['House of the Dragon: S2 E4', { kind: 'tv', series: 'House of the Dragon', season: 2, episode: 4, episodeName: null }],
];
for (const [raw, want] of cases) {
  test(`splitTitle: ${raw}`, () => assert.deepEqual(splitTitle(raw), want));
}
test('normName', () => {
  assert.equal(normName('Amélie – Die fabelhafte Welt'), 'amelie die fabelhafte welt');
  assert.equal(normName("Grey's Anatomy"), 'greys anatomy');
});
