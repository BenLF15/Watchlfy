/* Watchlfy – Rückblick-Story, Freunde & Sammlung (nutzt die Helfer aus app.js über window.Watchlfy). */
(() => {
  'use strict';
  const W = window.Watchlfy;
  if (!W) return;
  const { api, postJSON, t, tn, esc, fmt, dur, toast, errMsg, $, $$, poster, tmdbImg, LOCALE, reduceMotion, store, confetti, CLOSE_BTN, hourRange, DAYS_LONG, parseDay, dateFmt, dateFmtYear, serviceName, serviceDot, SERVICES } = W;
  const monthName = (m, style = 'long') => new Intl.DateTimeFormat(LOCALE, { month: style }).format(new Date(2024, m - 1, 15));
  const hoursOf = (s) => Math.round((s || 0) / 3600);

  // ================================================================ Rückblick
  const wr = { data: null, year: null };
  const defaultYear = () => { const d = new Date(); return d.getMonth() === 0 ? d.getFullYear() - 1 : d.getFullYear(); };

  async function loadWrapped(year = wr.year || defaultYear()) {
    const el = $('#wrapped');
    if (!wr.data) el.innerHTML = '<section class="card"><div class="skeleton-block"></div></section>';
    let d = await api(`/api/wrapped?year=${year}`);
    if (!d.views && d.years.length && !d.years.includes(year)) d = await api(`/api/wrapped?year=${d.years[0]}`);
    wr.data = d;
    wr.year = d.year;
    renderWrapped();
  }

  function renderWrapped() {
    const d = wr.data;
    const el = $('#wrapped');
    const chips = d.years.length > 1 ? `<div class="chips year-chips">${d.years.map((y) => `<button type="button" class="chip-btn" data-wrapped-year="${y}" aria-pressed="${y === d.year}">${y}</button>`).join('')}</div>` : '';
    if (!d.views) {
      el.innerHTML = `<section class="card wrapped-hero"><div class="wh-content"><span class="wh-kicker">Watchlfy · ${d.year}</span><h2>${esc(t('wrapped.title', { year: d.year }))}</h2><p>${esc(t('wrapped.empty'))}</p></div>${chips}</section>`;
      return;
    }
    const top = d.topSeries[0];
    const back = tmdbImg(top?.backdrop_path, 'w780');
    el.innerHTML = `
      <section class="card wrapped-hero wl-hero" ${back ? `style="--back:url('${back}')"` : ''}>
        <div class="wh-content">
          <span class="wh-kicker">Watchlfy · ${d.year}</span>
          <h2>${esc(t('wrapped.title', { year: d.year }))}</h2>
          <p>${esc(t('wrapped.lead', { h: fmt(hoursOf(d.secs)), e: fmt(d.episodes), m: fmt(d.movies) }))}</p>
          <button type="button" class="btn btn-primary btn-lg" data-story-start><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg><span>${esc(t('wrapped.start'))}</span></button>
        </div>
        ${chips}
      </section>
      <div class="kpis">
        <article class="card kpi kpi-hero"><span class="kpi-label">${esc(t('kpi.watchtime'))}</span><strong class="kpi-value">${fmt(hoursOf(d.secs))}</strong><span class="kpi-sub">${esc(t('kpi.hoursUnit'))}</span></article>
        <article class="card kpi"><span class="kpi-label">${esc(t('kpi.episodes'))}</span><strong class="kpi-value">${fmt(d.episodes)}</strong><span class="kpi-sub">${esc(t('kpi.inSeries', { n: fmt(d.series) }))}</span></article>
        <article class="card kpi"><span class="kpi-label">${esc(t('kpi.movies'))}</span><strong class="kpi-value">${fmt(d.movies)}</strong></article>
        <article class="card kpi"><span class="kpi-label">${esc(t('wrapped.newSeries'))}</span><strong class="kpi-value">${fmt(d.newSeries)}</strong></article>
        <article class="card kpi"><span class="kpi-label">${esc(t('insight.streak'))}</span><strong class="kpi-value">${fmt(d.streak)}</strong><span class="kpi-sub">${esc(t('insight.inARow'))}</span></article>
      </div>
      <div class="grid-2">
        <section class="card"><header class="card-head"><h2>${esc(t('overview.topSeries'))}</h2></header><div class="poster-row">${d.topSeries.map((s) => posterMini(s)).join('')}</div></section>
        <section class="card"><header class="card-head"><h2>${esc(t('overview.topMovies'))}</h2></header><div class="poster-row">${d.topMovies.map((s) => posterMini(s)).join('') || `<p class="empty">–</p>`}</div></section>
      </div>
      <section class="card"><header class="card-head"><div><h2>${esc(t('wrapped.months'))}</h2><p class="muted small">${esc(t('wrapped.topMonth', { m: monthName(d.months.indexOf(Math.max(...d.months)) + 1) }))}</p></div></header>
        <div class="chart-wrap short"><canvas id="wrapped-chart" role="img" aria-label="${esc(t('wrapped.months'))}"></canvas></div></section>`;
    const max = Math.max(1, ...d.months);
    W.upsertChart('wrapped', $('#wrapped-chart'), {
      type: 'bar',
      data: { labels: d.months.map((_, i) => monthName(i + 1, 'short')), datasets: [{ data: d.months.map((s) => Math.round(s / 3600)), backgroundColor: d.months.map((v) => (v === max ? W.COLORS.accent : W.accentA(0.25 + 0.6 * (v / max)))), borderRadius: 4 }] },
      options: { scales: W.baseScales({ y: { display: false, beginAtZero: true } }), plugins: { tooltip: { callbacks: { label: (i) => `${i.raw} h` } } } },
    });
  }
  const posterMini = (s) => `<button type="button" class="poster-card" ${s.title_id ? `data-title-id="${s.title_id}"` : `data-title-key="${esc(s.tkey)}"`}><div class="poster">${poster(s.poster_path, s.name)}</div><b>${esc(s.name)}</b><small>${esc(dur(s.secs, { short: true }))}</small></button>`;

  // ---------------------------------------------------------------- Story (Vollbild, Folien, wischen zum Schließen)
  const story = { i: 0, slides: [], raf: 0, start: 0, elapsed: 0, paused: false, prev: null };
  const STORY_MS = 6500;

  // ---------------------------------------------------------------- Filmmusik: offizielle 30-s-Hörproben, weich überblendet, stummschaltbar
  const music = {
    muted: store.get('storyMuted') === '1',
    cache: new Map(),
    cur: null, // { key, audio }
    key: (x) => (x?.name ? `${x.name}|${x.kind || (x.episodes ? 'tv' : '')}` : null),
    async lookup(x) {
      const k = music.key(x);
      if (!k) return null;
      if (!music.cache.has(k)) {
        const kind = x.kind || (x.episodes ? 'tv' : 'movie');
        music.cache.set(k, api(`/api/soundtrack?title=${encodeURIComponent(x.name)}&kind=${kind}${x.year ? `&year=${x.year}` : ''}`).then((r) => r.track).catch(() => null));
      }
      return music.cache.get(k);
    },
    prefetch(slides) { slides.forEach((sl) => { if (sl.music) music.lookup(sl.music); }); },
    fade(audio, to, ms = 700, done) {
      const from = audio.volume;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        audio.volume = Math.max(0, Math.min(1, from + (to - from) * p));
        if (p < 1) requestAnimationFrame(step); else done?.();
      };
      requestAnimationFrame(step);
    },
    async forSlide(slide) {
      const want = slide?.music;
      const k = music.key(want);
      if (!k || music.cur?.key === k) return; // ohne passenden Titel läuft die bisherige Musik weiter
      const track = await music.lookup(want);
      if (!track || !$('#story').open || story.slides[story.i] !== slide) return;
      if (music.cur?.track?.id === track.id) { music.cur.key = k; return; }
      const old = music.cur;
      const audio = new Audio(track.audio);
      audio.loop = true;
      audio.volume = 0;
      audio.muted = music.muted;
      music.cur = { key: k, audio, track };
      if (old) music.fade(old.audio, 0, 600, () => { old.audio.pause(); old.audio.src = ''; });
      audio.play().then(() => music.fade(audio, 0.8, 900)).catch(() => {});
      music.paint();
    },
    paint() {
      const b = $('#story .st-mute');
      const c = $('#st-credit');
      if (!b || !c) return;
      const tr = music.cur?.track;
      b.hidden = !tr;
      b.setAttribute('aria-pressed', String(music.muted));
      b.setAttribute('aria-label', t(music.muted ? 'story.unmute' : 'story.mute'));
      b.innerHTML = music.muted
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m17 9 5 6M22 9l-5 6"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
      c.hidden = !tr;
      if (tr) {
        c.innerHTML = `<span class="st-eq${music.muted ? ' off' : ''}" aria-hidden="true"><i></i><i></i><i></i></span><span>${esc(tr.track)} · ${esc(tr.artist)}</span><small>${esc(t('story.preview'))}</small>`;
        if (tr.link) c.href = tr.link; else c.removeAttribute('href');
      }
    },
    toggle() {
      music.muted = !music.muted;
      store.set('storyMuted', music.muted ? '1' : '0');
      if (music.cur) music.cur.audio.muted = music.muted;
      music.paint();
    },
    stop() {
      const c = music.cur;
      music.cur = null;
      if (c) music.fade(c.audio, 0, 400, () => { c.audio.pause(); c.audio.src = ''; });
    },
  };
  const num = (n, unit) => `<div class="st-num" data-count="${n}">0</div>${unit ? `<p class="st-unit">${esc(unit)}</p>` : ''}`;
  const stPoster = (x, cls = '') => `<div class="st-poster ${cls}">${poster(x?.poster_path, x?.name || '', 'w342')}</div>`;

  function buildSlides(d) {
    const s1 = d.topSeries[0];
    const m1 = d.topMovies[0];
    const g = d.genres;
    const gTotal = g.reduce((a, x) => a + x.secs, 0) || 1;
    const bestM = d.months.indexOf(Math.max(...d.months)) + 1;
    const slides = [
      { cls: 'st-intro', tr: 'zoom', music: s1 || m1, html: `<div class="st-logo"><img src="/assets/logo-animated.svg" alt="" width="110" height="110" /></div><p class="st-kicker">Watchlfy · ${d.year}</p><h2 id="story-title">${esc(t('story.intro', { year: d.year }))}</h2><p class="st-text">${esc(t('story.introText'))}</p>` },
      { cls: 'st-minutes', tr: 'rise', music: s1 || m1, html: `<p class="st-kicker">${esc(t('story.timeKicker'))}</p>${num(hoursOf(d.secs), t('kpi.hoursUnit'))}<p class="st-text">${esc(t('story.timeText', { d: W.nf1.format(d.secs / 86400), e: fmt(d.episodes), m: fmt(d.movies) }))}</p>${d.estimatedShare > 0.2 ? `<p class="st-pill">${esc(t('est.label', { p: Math.round(d.estimatedShare * 100) }))}</p>` : ''}` },
    ];
    if (s1) slides.push({ cls: 'st-artist', tr: 'iris', music: s1, bg: tmdbImg(s1.backdrop_path, 'w780'), html: `<p class="st-kicker">${esc(t('story.seriesKicker'))}</p>${stPoster(s1, 'big')}<h2>${esc(s1.name)}</h2><p class="st-text">${esc(t('story.seriesText', { e: fmt(s1.episodes), h: dur(s1.secs, { short: true }) }))}</p>${d.topSeries.length > 1 ? `<ol class="st-mini">${d.topSeries.slice(1, 5).map((x, i) => `<li style="--i:${i}"><span>${i + 2}</span>${poster(x.poster_path, x.name, 'w92')}<b>${esc(x.name)}</b><small>${esc(dur(x.secs, { short: true }))}</small></li>`).join('')}</ol>` : ''}` });
    if (m1) slides.push({ cls: 'st-song', tr: 'wipe', music: m1, html: `<p class="st-kicker">${esc(t('story.movieKicker'))}</p>${stPoster(m1, 'big tilt')}<h2>${esc(m1.name)}</h2><p class="st-text">${esc(m1.views > 1 ? t('story.movieTextRe', { n: m1.views }) : t('story.movieText', { n: fmt(d.movies) }))}</p>` });
    if (g.length) slides.push({ cls: 'st-genres', tr: 'drop', music: d.topSeries[1] || d.topMovies[1] || null, html: `<p class="st-kicker">${esc(t('story.genreKicker'))}</p><h2>${esc(g[0].name)}</h2><ul class="st-bars">${g.map((x, i) => `<li style="--i:${i}"><span>${esc(x.name)}</span><i><b style="width:${Math.max(4, (x.secs / gTotal) * 100)}%;background:hsl(${(i * 47 + 10) % 360} 85% 62%)"></b></i><em>${Math.round((x.secs / gTotal) * 100)} %</em></li>`).join('')}</ul>${d.actors[0] ? `<p class="st-pill">⭐ ${esc(t('story.actor', { a: d.actors[0].name }))}</p>` : ''}` });
    if (d.binge) slides.push({ cls: 'st-rhythm', tr: 'burst', music: d.binge ? { name: d.binge.name, kind: 'tv' } : null, html: `<p class="st-kicker">${esc(t('story.bingeKicker'))}</p>${num(d.binge.episodes, t('binge.inARow'))}<h2>${esc(d.binge.name)}</h2><p class="st-text">${esc(dateFmtYear.format(new Date(d.binge.start)))}${d.binge.timed ? ` · ${esc(dur(d.binge.secs))}` : ''}</p>` });
    slides.push({ cls: 'st-streak', tr: 'spin', html: `<p class="st-kicker">${esc(t('story.rhythmKicker'))}</p><div class="st-tiles">
        <div style="--i:0"><span>${esc(t('insight.favTime'))}</span><b>${d.favHour !== null ? esc(hourRange(d.favHour)) : '–'}</b></div>
        <div style="--i:1"><span>${esc(t('insight.streak'))}</span><b>${esc(tn('unit.day', d.streak, { n: d.streak }))}</b></div>
        <div style="--i:2"><span>${esc(t('wrapped.topMonthShort'))}</span><b>${esc(monthName(bestM))}</b></div>
        <div style="--i:3"><span>${esc(t('insight.bestDay'))}</span><b>${d.bestDay ? esc(dateFmt.format(parseDay(d.bestDay.day))) : '–'}</b><small>${d.bestDay ? esc(dur(d.bestDay.secs, { short: true })) : ''}</small></div></div>` });
    if (d.services.length > 1) {
      const tot = d.services.reduce((a, s) => a + s.secs, 0) || 1;
      slides.push({ cls: 'st-first', tr: 'ripple', html: `<p class="st-kicker">${esc(t('services.title'))}</p><h2>${esc(serviceName(d.services[0].source))}</h2><ul class="st-bars">${d.services.map((s, i) => `<li style="--i:${i}"><span>${esc(serviceName(s.source))}</span><i><b style="width:${Math.max(4, (s.secs / tot) * 100)}%;background:${SERVICES[s.source]?.color}"></b></i><em>${Math.round((s.secs / tot) * 100)} %</em></li>`).join('')}</ul>` });
    }
    if (d.first) slides.push({ cls: 'st-first', tr: 'rise', music: d.first, html: `<p class="st-kicker">${esc(t('story.firstKicker', { year: d.year }))}</p>${stPoster(d.first)}<h2>${esc(d.first.name)}</h2><p class="st-text">${esc(dateFmtYear.format(new Date(d.first.watched_at)))}</p>` });
    slides.push({ cls: 'st-outro', tr: 'zoom', outro: true, music: s1 || m1, html: `<div class="st-fx"></div><p class="st-kicker">Watchlfy · ${d.year}</p><h2>${esc(t('story.outro'))}</h2>
      <div class="st-summary"><div><span>${esc(t('kpi.watchtime'))}</span><b>${fmt(hoursOf(d.secs))} h</b></div><div><span>${esc(t('kpi.episodes'))}</span><b>${fmt(d.episodes)}</b></div>
        <div class="wide"><span>${esc(t('overview.topSeries'))}</span><b>${esc(s1?.name || '–')}</b></div><div class="wide"><span>${esc(t('story.movieKicker'))}</span><b>${esc(m1?.name || '–')}</b></div></div>
      <div class="st-actions"><button type="button" class="btn btn-primary" data-story="share">${esc(t('story.share'))}</button><button type="button" class="btn btn-ghost st-ghost" data-story="restart">${esc(t('story.restart'))}</button></div>` });
    return slides;
  }

  function openStory() {
    const d = wr.data;
    if (!d?.views) return;
    story.slides = buildSlides(d);
    $('#story-body').innerHTML = `
      <div class="st-bars-top">${story.slides.map(() => '<span><i></i></span>').join('')}</div>
      <button type="button" class="st-close" data-close-dialog aria-label="${esc(t('btn.close'))}">✕</button>
      <button type="button" class="st-mute" data-story="mute" aria-pressed="${music.muted}" hidden></button>
      <a class="st-credit" id="st-credit" target="_blank" rel="noopener" hidden></a>
      <div class="st-stage">${story.slides.map((s, i) => `<section class="st-slide ${s.cls}" data-i="${i}" aria-hidden="true"><div class="st-blobs" aria-hidden="true"><i></i><i></i><i></i></div>${s.bg ? `<div class="st-backdrop" style="background-image:url('${s.bg}')"></div>` : ''}<div class="st-content">${s.html}</div></section>`).join('')}</div>
      <button type="button" class="st-nav prev" data-story="prev" aria-label="${esc(t('story.back'))}"></button>
      <button type="button" class="st-nav next" data-story="next" aria-label="${esc(t('story.next'))}"></button>`;
    $('#story').showModal();
    story.prev = null;
    music.prefetch(story.slides);
    storyGo(0);
  }

  function countUp(el) {
    const to = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fmt(to); return; }
    const start = performance.now();
    const step = (now) => { const p = Math.min(1, (now - start) / 1100); el.textContent = fmt(to * (1 - Math.pow(1 - p, 4))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  function storyGo(i) {
    if (i >= story.slides.length) { closeStory(); return; }
    const from = story.prev;
    story.i = Math.max(0, i);
    const back = from != null && story.i < from;
    story.prev = story.i;
    story.elapsed = 0;
    story.start = performance.now();
    const cur = story.slides[story.i];
    $$('#story .st-slide').forEach((s, k) => {
      const on = k === story.i;
      s.className = s.className.replace(/\b(tr-\w+|leaving|back|out-\w+)\b/g, '').trim();
      if (on) { void s.offsetWidth; s.classList.add(back ? 'back' : `tr-${cur.tr || 'zoom'}`); }
      if (k === from && !on) { s.classList.add('leaving'); setTimeout(() => s.classList.remove('leaving'), 760); }
      s.classList.toggle('active', on);
      s.setAttribute('aria-hidden', String(!on));
    });
    $$('#story .st-bars-top i').forEach((b, k) => { b.style.width = k < story.i ? '100%' : '0%'; });
    const slide = $(`#story .st-slide[data-i="${story.i}"]`);
    music.forSlide(cur);
    $$('.st-num', slide).forEach(countUp);
    if (cur.outro) {
      setTimeout(() => confetti($('.st-fx', slide), 50), 300);
      postJSON('/api/collection/event', { type: 'wrapped', year: wr.data.year }).then((r) => r.fresh?.length && W.noteToast?.(r.fresh)).catch(() => {});
    }
    cancelAnimationFrame(story.raf);
    story.raf = requestAnimationFrame(storyTick);
  }
  function storyTick(now) {
    if (!$('#story').open) return;
    const outro = story.slides[story.i]?.outro;
    if (!story.paused && !outro) story.elapsed += now - story.start;
    story.start = now;
    const bar = $$('#story .st-bars-top i')[story.i];
    if (bar) bar.style.width = `${outro ? 100 : Math.min(100, (story.elapsed / STORY_MS) * 100)}%`;
    if (!outro && story.elapsed >= STORY_MS) { storyGo(story.i + 1); return; }
    story.raf = requestAnimationFrame(storyTick);
  }
  function closeStory() { cancelAnimationFrame(story.raf); const dlg = $('#story'); if (dlg.open) dlg.close(); }
  async function shareWrapped() {
    const d = wr.data;
    const text = t('story.shareText', { year: d.year, h: fmt(hoursOf(d.secs)), s: d.topSeries[0]?.name || '–', m: d.topMovies[0]?.name || '–' });
    try {
      if (navigator.share) await navigator.share({ title: `Watchlfy ${d.year}`, text });
      else { await navigator.clipboard.writeText(text); toast(t('story.copied')); }
    } catch { /* abgebrochen */ }
  }

  function bindStory() {
    const dlg = $('#story');
    const inner = $('#story-body');
    // Hoch-/Runterwischen schließt die Story
    let g = null;
    let swallow = false;
    const reset = (snap) => { inner.classList.toggle('st-snap', snap); inner.style.setProperty('--dy', '0px'); inner.style.setProperty('--ds', '1'); dlg.style.removeProperty('--dim'); };
    dlg.addEventListener('pointerdown', (e) => {
      if (!e.isPrimary || e.target.closest('.st-actions, .st-close, .st-mute, .st-credit')) return;
      g = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, drag: false };
      if (e.target.closest('.st-nav')) story.paused = true;
    });
    dlg.addEventListener('pointermove', (e) => {
      if (!g || e.pointerId !== g.id) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (!g.drag) {
        if (Math.abs(dy) < 12 || Math.abs(dy) < Math.abs(dx) * 1.2) return;
        g.drag = true; story.paused = true; inner.classList.remove('st-snap');
        try { dlg.setPointerCapture(e.pointerId); } catch { /* egal */ }
      }
      const k = Math.min(1, Math.abs(dy) / (innerHeight * 0.6));
      inner.style.setProperty('--dy', `${dy}px`);
      inner.style.setProperty('--ds', String(1 - k * 0.12));
      dlg.style.setProperty('--dim', String(1 - k * 0.7));
    });
    const end = (e) => {
      story.paused = false;
      if (!g || e.pointerId !== g.id) return;
      const was = g; g = null;
      if (!was.drag) return;
      swallow = true; setTimeout(() => { swallow = false; }, 60);
      const dy = e.clientY - was.y;
      const v = dy / Math.max(1, performance.now() - was.t);
      if (Math.abs(dy) > innerHeight * 0.16 || Math.abs(v) > 0.6) {
        inner.classList.add('st-snap', 'st-fly');
        inner.style.setProperty('--dy', `${Math.sign(dy) * innerHeight}px`);
        dlg.style.setProperty('--dim', '0');
        setTimeout(() => { closeStory(); inner.classList.remove('st-fly'); reset(false); }, 280);
      } else reset(true);
    };
    dlg.addEventListener('pointerup', end);
    dlg.addEventListener('pointercancel', end);
    dlg.addEventListener('click', (e) => {
      if (swallow) { e.stopPropagation(); e.preventDefault(); return; }
      const b = e.target.closest('[data-story]');
      if (!b) return;
      const act = b.dataset.story;
      if (act === 'next') storyGo(story.i + 1);
      else if (act === 'prev') storyGo(story.i - 1);
      else if (act === 'share') shareWrapped();
      else if (act === 'restart') storyGo(0);
      else if (act === 'mute') music.toggle();
    }, true);
    dlg.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); storyGo(story.i + 1); }
      if (e.key === 'ArrowLeft') storyGo(story.i - 1);
      if (e.key === 'm' || e.key === 'M') music.toggle();
    });
    dlg.addEventListener('close', () => { cancelAnimationFrame(story.raf); reset(false); music.stop(); });
  }

  // Hinweis im Dezember/Januar: „Dein Jahr in Serien ist da“
  function renderPromo() {
    const el = $('#wrapped-promo');
    const now = window.WatchlfyTheme.effectiveDate();
    const m = now.getMonth();
    const year = m === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const key = `wrapped-promo-${year}`;
    if (!(m === 11 || m === 0) || !W.hasData() || store.get(key)) { el.hidden = true; return; }
    el.innerHTML = `<span class="wp-ico" aria-hidden="true">🎬</span><div><strong>${esc(t('wrapped.promoTitle', { year }))}</strong><span>${esc(t('wrapped.promoText'))}</span></div>
      <button type="button" class="btn btn-primary btn-xs" data-goto="wrapped">${esc(t('wrapped.open'))}</button><button type="button" class="fest-close" data-promo-dismiss="${key}" aria-label="${esc(t('btn.close'))}">✕</button>`;
    el.hidden = false;
  }

  // ================================================================ Freunde
  const fr = { data: null, compare: null, sel: null };
  async function loadFriends() {
    fr.data = await api('/api/friends');
    renderFriends();
    if (fr.sel && fr.data.friends.some((f) => f.id === fr.sel)) loadCompare(fr.sel);
  }
  const avatar = (u) => `<span class="friend-av">${u.avatar_url ? `<img src="${esc(u.avatar_url)}" alt="" />` : esc((u.username[0] || '?').toUpperCase())}</span>`;
  function renderFriends() {
    const d = fr.data;
    $('#friend-requests').innerHTML = d.incoming.length ? `<h3 class="settings-label">${esc(t('friends.requests'))}</h3><ul class="friend-list">${d.incoming.map((u) => `<li class="friend-row">${avatar(u)}<b>${esc(u.username)}</b><span class="friend-actions"><button type="button" class="btn btn-primary btn-xs" data-friend-accept="${u.id}">${esc(t('friends.accept'))}</button><button type="button" class="btn btn-ghost btn-xs" data-friend-remove="${u.id}">${esc(t('friends.decline'))}</button></span></li>`).join('')}</ul>` : '';
    $('#friend-list').innerHTML = [
      ...d.friends.map((u) => `<li class="friend-row${fr.sel === u.id ? ' on' : ''}" data-friend="${u.id}" tabindex="0">${avatar(u)}<b>${esc(u.username)}</b><span class="friend-actions"><button type="button" class="btn btn-ghost btn-xs" data-friend-compare="${u.id}">${esc(t('friends.compare'))}</button></span></li>`),
      ...d.outgoing.map((u) => `<li class="friend-row muted">${avatar(u)}<b>${esc(u.username)}</b><span class="friend-actions"><small>${esc(t('friends.pending'))}</small><button type="button" class="link-btn" data-friend-remove="${u.id}">${esc(t('friends.cancel'))}</button></span></li>`),
    ].join('') || `<li class="empty">${esc(t('friends.none'))}</li>`;
    const badge = d.incoming.length ? String(d.incoming.length) : '';
    const tab = $('#panel-tabs [data-panel="friends"]');
    if (tab) tab.dataset.badge = badge;
  }
  async function loadCompare(id) {
    fr.sel = id;
    $('#compare').innerHTML = '<section class="card"><div class="skeleton-block"></div></section>';
    try {
      fr.compare = await api(`/api/friends/${id}/compare?range=${W.state.range}`);
      renderCompare();
      renderFriends();
    } catch (err) { $('#compare').innerHTML = `<section class="card"><p class="empty">${esc(errMsg(err))}</p></section>`; }
  }
  function renderCompare() {
    const c = fr.compare;
    const ring = `<svg class="match-ring" viewBox="0 0 120 120" aria-hidden="true"><circle class="mr-bg" cx="60" cy="60" r="52"/><circle class="mr-fg" cx="60" cy="60" r="52" stroke-dasharray="${(c.match / 100) * 326.7} 326.7"/></svg>`;
    const col = (who, name) => `<div class="cmp-col"><h3>${esc(name)}</h3>
      <p class="muted small">${esc(t('friends.sum', { h: fmt(hoursOf(who.secs)), e: fmt(who.episodes), m: fmt(who.movies) }))}</p>
      <ol class="cmp-top">${who.top.series.map((x, i) => `<li>${poster(x.poster_path, x.name, 'w92')}<span>${i + 1}. ${esc(x.name)}</span></li>`).join('') || '<li class="empty">–</li>'}</ol>
      <p class="muted small"><b>${esc(t('top.movies'))}:</b> ${esc(who.top.movies.map((x) => x.name).join(', ') || '–')}</p>
      <p class="muted small"><b>${esc(t('top.genres'))}:</b> ${esc(who.top.genres.map((x) => x.name).join(', ') || '–')}</p></div>`;
    $('#compare').innerHTML = `<section class="card compare-card">
        <header class="card-head"><div><h2>${esc(t('friends.vs', { u: c.friend.username }))}</h2><p class="muted small">${esc(t('friends.rangeNote'))}</p></div>
          <div class="head-controls"><button type="button" class="btn btn-ghost btn-xs" data-friend-collection="${c.friend.id}">🎞️ ${esc(t('friends.collection'))}</button><button type="button" class="link-btn danger" data-friend-remove="${c.friend.id}">${esc(t('friends.remove'))}</button></div></header>
        <div class="cmp-match"><div class="cmp-ring">${ring}<b>${c.match} %</b></div><div><strong>${esc(t(c.match >= 70 ? 'friends.matchHigh' : c.match >= 40 ? 'friends.matchMid' : 'friends.matchLow'))}</strong><p class="muted small">${esc(tn('friends.shared', c.sharedCount, { n: c.sharedCount }))}</p></div></div>
        ${c.shared.length ? `<h3 class="settings-label">${esc(t('friends.sharedTitle'))}</h3><div class="poster-row">${c.shared.map((s) => `<div class="poster-card shared"><div class="poster">${poster(s.poster_path, s.name)}</div><b>${esc(s.name)}</b><small>${esc(t('friends.youThem', { a: dur(s.mine, { short: true }), b: dur(s.theirs, { short: true }) }))}</small></div>`).join('')}</div>` : ''}
        <div class="cmp-cols">${col(c.me, t('friends.you'))}${col(c.them, c.friend.username)}</div>
      </section>`;
  }
  async function friendAction(fn) { try { await fn(); await loadFriends(); } catch (err) { toast(errMsg(err), true); } }

  function bindFriends() {
    $('#friend-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('#friend-input').value.trim();
      if (!name) return;
      friendAction(async () => {
        const r = await postJSON('/api/friends', { username: name });
        toast(t(r.status === 'accepted' ? 'friends.nowFriends' : 'friends.sent', { u: r.username }));
        $('#friend-input').value = '';
      });
    });
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-friend-accept]');
      if (a) { friendAction(() => postJSON(`/api/friends/${a.dataset.friendAccept}/accept`, {})); return; }
      const r = e.target.closest('[data-friend-remove]');
      if (r) { if (confirm(t('friends.removeConfirm'))) friendAction(async () => { await api(`/api/friends/${r.dataset.friendRemove}`, { method: 'DELETE' }); if (fr.sel === Number(r.dataset.friendRemove)) { fr.sel = null; $('#compare').innerHTML = ''; } }); return; }
      const c = e.target.closest('[data-friend-compare], [data-friend]');
      if (c && !e.target.closest('[data-friend-remove]')) { loadCompare(Number(c.dataset.friendCompare || c.dataset.friend)); return; }
      const y = e.target.closest('[data-wrapped-year]');
      if (y) { loadWrapped(Number(y.dataset.wrappedYear)).catch((err) => toast(errMsg(err), true)); return; }
      if (e.target.closest('[data-story-start]')) { openStory(); return; }
      const pd = e.target.closest('[data-promo-dismiss]');
      if (pd) { store.set(pd.dataset.promoDismiss, '1'); $('#wrapped-promo').hidden = true; }
    });
  }

  // ================================================================ Anmelden bei app.js
  bindStory();
  bindFriends();
  W.register('wrapped', () => loadWrapped());
  W.register('friends', () => loadFriends());
  window.addEventListener('watchlfy:status', () => {
    renderPromo();
    api('/api/friends').then((d) => { fr.data = d; renderFriends(); }).catch(() => {});
  });
  window.addEventListener('watchlfy:imported', () => { wr.data = null; });
  W.wrappedState = wr;
})();
