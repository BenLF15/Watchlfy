// Mock für TMDB- und Trakt-API (nur für Tests). Start: node tests/mock-server.js [port]
// Liefert einen kleinen Katalog, Poster als SVG und einen Trakt-OAuth/Verlauf.
import crypto from 'node:crypto';
import http from 'node:http';

const port = Number(process.argv[2] || process.env.MOCK_PORT || 4100);
const hue = (s) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 360;

const TV = [
  { id: 70523, name: 'Dark', original_name: 'Dark', first_air_date: '2017-12-01', popularity: 80, vote_count: 6000, genres: ['Krimi', 'Drama', 'Sci-Fi & Fantasy'], country: ['DE'], cast: ['Louis Hofmann', 'Lisa Vicari', 'Oliver Masucci'], seasons: [10, 8, 8], runtime: 55 },
  { id: 1396, name: 'Breaking Bad', original_name: 'Breaking Bad', first_air_date: '2008-01-20', popularity: 300, vote_count: 14000, genres: ['Drama', 'Krimi'], country: ['US'], cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn'], seasons: [7, 13, 13, 13, 16], runtime: 47 },
  { id: 66732, name: 'Stranger Things', original_name: 'Stranger Things', first_air_date: '2016-07-15', popularity: 400, vote_count: 17000, genres: ['Sci-Fi & Fantasy', 'Mystery', 'Drama'], country: ['US'], cast: ['Millie Bobby Brown', 'Finn Wolfhard', 'Winona Ryder'], seasons: [8, 9, 8, 9], runtime: 50 },
  { id: 2316, name: 'Das Büro', original_name: 'The Office', first_air_date: '2005-03-24', popularity: 200, vote_count: 4000, genres: ['Komödie'], country: ['US'], cast: ['Steve Carell', 'Rainn Wilson', 'John Krasinski'], seasons: [6, 22, 25, 19, 28, 26, 26, 24, 25], runtime: 22, aka: ['The Office (U.S.)', 'The Office'] },
  { id: 76479, name: 'The Boys', original_name: 'The Boys', first_air_date: '2019-07-25', popularity: 350, vote_count: 10000, genres: ['Sci-Fi & Fantasy', 'Action & Adventure'], country: ['US'], cast: ['Karl Urban', 'Jack Quaid', 'Antony Starr'], seasons: [8, 8, 8, 8], runtime: 60 },
  { id: 93405, name: 'Squid Game', original_name: '오징어 게임', first_air_date: '2021-09-17', popularity: 250, vote_count: 15000, genres: ['Action & Adventure', 'Mystery', 'Drama'], country: ['KR'], cast: ['Lee Jung-jae', 'Park Hae-soo', 'Jung Ho-yeon'], seasons: [9, 7], runtime: 55 },
  { id: 94997, name: 'House of the Dragon', original_name: 'House of the Dragon', first_air_date: '2022-08-21', popularity: 300, vote_count: 5000, genres: ['Sci-Fi & Fantasy', 'Drama'], country: ['US'], cast: ['Matt Smith', 'Emma D’Arcy', 'Olivia Cooke'], seasons: [10, 8], runtime: 65 },
  { id: 100088, name: 'The Last of Us', original_name: 'The Last of Us', first_air_date: '2023-01-15', popularity: 300, vote_count: 5000, genres: ['Drama'], country: ['US'], cast: ['Pedro Pascal', 'Bella Ramsey'], seasons: [9, 7], runtime: 58 },
  { id: 63174, name: 'Lucifer', original_name: 'Lucifer', first_air_date: '2016-01-25', popularity: 100, vote_count: 14000, genres: ['Krimi', 'Sci-Fi & Fantasy'], country: ['US'], cast: ['Tom Ellis', 'Lauren German'], seasons: [13, 18, 26, 10, 16, 10], runtime: 45 },
  { id: 71446, name: 'Haus des Geldes', original_name: 'La casa de papel', first_air_date: '2017-05-02', popularity: 120, vote_count: 18000, genres: ['Krimi', 'Drama'], country: ['ES'], cast: ['Úrsula Corberó', 'Álvaro Morte'], seasons: [13, 9, 8, 8, 10], runtime: 50 },
];
const MOVIES = [
  { id: 27205, title: 'Inception', release_date: '2010-07-15', popularity: 120, vote_count: 35000, genres: ['Action', 'Science Fiction', 'Abenteuer'], country: ['US', 'GB'], cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'], runtime: 148 },
  { id: 693134, title: 'Dune: Part Two', release_date: '2024-02-27', popularity: 500, vote_count: 6000, genres: ['Science Fiction', 'Abenteuer'], country: ['US'], cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson'], runtime: 167 },
  { id: 872585, title: 'Oppenheimer', release_date: '2023-07-19', popularity: 300, vote_count: 9000, genres: ['Drama', 'Historie'], country: ['US', 'GB'], cast: ['Cillian Murphy', 'Emily Blunt', 'Matt Damon'], runtime: 181 },
  { id: 346698, title: 'Barbie', release_date: '2023-07-19', popularity: 250, vote_count: 8000, genres: ['Komödie', 'Abenteuer'], country: ['US'], cast: ['Margot Robbie', 'Ryan Gosling'], runtime: 114 },
  { id: 603, title: 'Matrix', original_title: 'The Matrix', release_date: '1999-03-30', popularity: 90, vote_count: 25000, genres: ['Action', 'Science Fiction'], country: ['US'], cast: ['Keanu Reeves', 'Laurence Fishburne', 'Carrie-Anne Moss'], runtime: 136 },
  { id: 120, title: 'Der Herr der Ringe: Die Gefährten', original_title: 'The Lord of the Rings: The Fellowship of the Ring', release_date: '2001-12-18', popularity: 110, vote_count: 25000, genres: ['Abenteuer', 'Fantasy'], country: ['NZ', 'US'], cast: ['Elijah Wood', 'Ian McKellen', 'Viggo Mortensen'], runtime: 179 },
  { id: 324857, title: 'Spider-Man: A New Universe', original_title: 'Spider-Man: Into the Spider-Verse', release_date: '2018-12-06', popularity: 100, vote_count: 15000, genres: ['Animation', 'Action'], country: ['US'], cast: ['Shameik Moore', 'Jake Johnson'], runtime: 117 },
];
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const norm = (s) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

function tvResult(t) {
  return { id: t.id, name: t.name, original_name: t.original_name, first_air_date: t.first_air_date, popularity: t.popularity, vote_count: t.vote_count, poster_path: `/p-${slug(t.original_name)}.svg`, backdrop_path: `/b-${slug(t.original_name)}.svg`, overview: `Überblick zu ${t.name}.`, original_language: 'en' };
}
function movieResult(m) {
  return { id: m.id, title: m.title, original_title: m.original_title || m.title, release_date: m.release_date, popularity: m.popularity, vote_count: m.vote_count, poster_path: `/p-${slug(m.original_title || m.title)}.svg`, backdrop_path: `/b-${slug(m.original_title || m.title)}.svg`, overview: `Überblick zu ${m.title}.`, original_language: 'en' };
}
function search(list, q, nameOf) {
  const n = norm(q);
  return list.filter((x) => nameOf(x).some((name) => { const k = norm(name); return k.includes(n) || n.includes(k) || k.split(' ').some((w) => w.length > 3 && n.includes(w)); }));
}

function svg(name, back) {
  const h = hue(name);
  const [w, hh] = back ? [780, 440] : [342, 513];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},70%,45%)"/><stop offset="1" stop-color="hsl(${(h + 60) % 360},60%,15%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${hh * 0.3}" r="${hh * 0.22}" fill="hsl(${(h + 180) % 360},80%,70%)" opacity=".5"/><text x="50%" y="${back ? 55 : 82}%" font-family="sans-serif" font-weight="800" font-size="${back ? 54 : 40}" fill="#fff" text-anchor="middle">${name.replace(/[<&]/g, '')}</text></svg>`;
}

// ---------------------------------------------------------------- Trakt
const trakt = { tokens: new Set(), watching: true };
function traktHistory() {
  const now = Date.now();
  const at = (h) => new Date(now - h * 3600e3).toISOString();
  return [
    { id: 9001, watched_at: at(2), action: 'watch', type: 'episode', episode: { season: 2, number: 1, title: 'Anfänge und Enden', runtime: 52, ids: { trakt: 1 } }, show: { title: 'Dark', year: 2017, ids: { trakt: 10, tmdb: 70523 } } },
    { id: 9002, watched_at: at(3), action: 'watch', type: 'episode', episode: { season: 1, number: 10, title: 'Alpha und Omega', runtime: 60, ids: { trakt: 2 } }, show: { title: 'Dark', year: 2017, ids: { trakt: 10, tmdb: 70523 } } },
    { id: 9003, watched_at: at(30), action: 'watch', type: 'movie', movie: { title: 'Oppenheimer', year: 2023, runtime: 181, ids: { trakt: 20, tmdb: 872585 } } },
    { id: 9004, watched_at: at(50), action: 'watch', type: 'episode', episode: { season: 1, number: 1, title: 'When You’re Lost in the Darkness', runtime: 81, ids: { trakt: 3 } }, show: { title: 'The Last of Us', year: 2023, ids: { trakt: 30, tmdb: 100088 } } },
  ];
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${port}`);
  const p = u.pathname;
  let m;
  // ---------------- TMDB
  if (p === '/3/search/tv') return send(res, 200, { results: search(TV, u.searchParams.get('query') || '', (t) => [t.name, t.original_name, ...(t.aka || [])]).map(tvResult) });
  if (p === '/3/search/movie') return send(res, 200, { results: search(MOVIES, u.searchParams.get('query') || '', (x) => [x.title, x.original_title || x.title]).map(movieResult) });
  if ((m = /^\/3\/tv\/(\d+)\/season\/(\d+)$/.exec(p))) {
    const t = TV.find((x) => x.id === Number(m[1]));
    const n = Number(m[2]);
    if (!t || !t.seasons[n - 1]) return send(res, 404, { status_code: 34 });
    return send(res, 200, { season_number: n, episodes: Array.from({ length: t.seasons[n - 1] }, (_, i) => ({ episode_number: i + 1, name: n === 1 && t.id === 70523 && i === 0 ? 'Geheimnisse' : `Folge ${i + 1}`, runtime: t.runtime + ((i * 7) % 9) - 4, air_date: t.first_air_date })) });
  }
  if ((m = /^\/3\/tv\/(\d+)$/.exec(p))) {
    const t = TV.find((x) => x.id === Number(m[1]));
    if (!t) return send(res, 404, { status_code: 34 });
    return send(res, 200, {
      ...tvResult(t), genres: t.genres.map((name, i) => ({ id: i, name })), origin_country: t.country, episode_run_time: [t.runtime],
      number_of_episodes: t.seasons.reduce((a, b) => a + b, 0), status: t.id === 1396 ? 'Ended' : 'Returning Series',
      seasons: [{ season_number: 0, episode_count: 2, name: 'Specials' }, ...t.seasons.map((c, i) => ({ season_number: i + 1, episode_count: c, name: `Staffel ${i + 1}` }))],
      credits: { cast: t.cast.map((name) => ({ name })) },
    });
  }
  if ((m = /^\/3\/movie\/(\d+)$/.exec(p))) {
    const x = MOVIES.find((y) => y.id === Number(m[1]));
    if (!x) return send(res, 404, { status_code: 34 });
    return send(res, 200, { ...movieResult(x), genres: x.genres.map((name, i) => ({ id: i, name })), production_countries: x.country.map((c) => ({ iso_3166_1: c })), runtime: x.runtime, credits: { cast: x.cast.map((name) => ({ name })) } });
  }
  if ((m = /^\/t\/p\/\w+\/([pb])-([a-z0-9-]+)\.svg$/.exec(p))) return send(res, 200, svg(m[2].replace(/-/g, ' '), m[1] === 'b'), 'image/svg+xml');

  // ---------------- Trakt
  const ua = String(req.headers['user-agent'] || '');
  if ((p === '/oauth/token' || p.startsWith('/users/') || p.startsWith('/sync/')) && (!ua || /^node$|undici/i.test(ua))) {
    return send(res, 403, '<!DOCTYPE html><html><head><title>Attention Required! | Cloudflare</title></head><body>blocked</body></html>', 'text/html');
  }
  if (p === '/oauth/authorize') {
    const redirect = u.searchParams.get('redirect_uri');
    const ch = u.searchParams.get('code_challenge') || '';
    if (ch && u.searchParams.get('code_challenge_method') !== 'S256') return send(res, 400, { error: 'invalid_request' });
    res.writeHead(302, { Location: `${redirect}?code=${encodeURIComponent(`mockcode.${ch}`)}&state=${encodeURIComponent(u.searchParams.get('state') || '')}` });
    return res.end();
  }
  if (p === '/oauth/token' && req.method === 'POST') {
    const body = await new Promise((r) => { let b = ''; req.on('data', (c) => { b += c; }); req.on('end', () => r(JSON.parse(b || '{}'))); });
    if (body.grant_type === 'authorization_code') {
      // Wie ein PKCE-Server: Challenge aus dem Code muss zum Prüfwert passen; ohne PKCE ist das Secret Pflicht
      const ch = String(body.code || '').split('.')[1] || '';
      const pkceOk = ch && body.code_verifier && crypto.createHash('sha256').update(body.code_verifier).digest('base64url') === ch;
      if (ch && !pkceOk) return send(res, 401, { error: 'invalid_grant', error_description: 'code_verifier passt nicht' });
      if (!ch && body.client_secret !== 'secret') return send(res, 401, { error: 'invalid_client' });
      trakt.lastGrant = { pkce: Boolean(ch), secret: Boolean(body.client_secret) };
    }
    const tok = `tok-${Date.now()}`;
    trakt.tokens.add(tok);
    return send(res, 200, { access_token: tok, refresh_token: `ref-${tok}`, expires_in: 7776000, created_at: Math.floor(Date.now() / 1000), token_type: 'bearer', scope: 'public' });
  }
  const authOk = () => /^Bearer tok-/.test(req.headers.authorization || '');
  if (p.startsWith('/users/') || p.startsWith('/sync/')) {
    if (!authOk()) return send(res, 401, { error: 'unauthorized' });
    if (p === '/users/settings') return send(res, 200, { user: { username: 'mockuser', ids: { slug: 'mockuser' } } });
    if (p === '/users/me/watching') {
      if (!trakt.watching) { res.writeHead(204); return res.end(); }
      const started = new Date(Date.now() - 20 * 60e3).toISOString();
      return send(res, 200, { expires_at: new Date(Date.now() + 35 * 60e3).toISOString(), started_at: started, action: 'scrobble', type: 'episode', episode: { season: 2, number: 2, title: 'Lügen', runtime: 55 }, show: { title: 'Dark', year: 2017, ids: { tmdb: 70523 } } });
    }
    if (p === '/sync/history') {
      const page = Number(u.searchParams.get('page') || 1);
      res.writeHead(200, { 'Content-Type': 'application/json', 'X-Pagination-Page-Count': '1' });
      return res.end(JSON.stringify(page === 1 ? traktHistory() : []));
    }
    if (p === '/sync/ratings') return send(res, 200, [{ rated_at: new Date().toISOString(), rating: 9, type: 'show', show: { title: 'Dark', ids: { tmdb: 70523 } } }, { rated_at: new Date().toISOString(), rating: 8, type: 'movie', movie: { title: 'Oppenheimer', ids: { tmdb: 872585 } } }]);
  }
  if (p === '/mock/last-grant') return send(res, 200, trakt.lastGrant || {});
  if (p === '/mock/watching') { trakt.watching = u.searchParams.get('on') !== '0'; return send(res, 200, { ok: true }); }
  send(res, 404, { status_code: 34, status_message: 'not found' });
}).listen(port, () => console.log(`[mock] TMDB/Trakt-Mock auf Port ${port}`));
