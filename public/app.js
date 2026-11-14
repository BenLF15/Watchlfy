/* Watchlfy – Frontend (Vanilla JS + Chart.js). Weitere Bereiche (Rückblick, Freunde, Sammlung) in assets/extras.js. */
(() => {
  'use strict';

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }

  // ================================================================ Helpers & Sprache
  const I = window.WatchlfyI18n;
  const t = I.t;
  const tn = I.tn;
  const LOCALE = I.locale;
  const T = window.WatchlfyTheme;

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const nf = new Intl.NumberFormat(LOCALE);
  const nf1 = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
  const fmt = (n) => nf.format(Math.round(n || 0));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* egal */ } },
  };
  const store = {
    get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* egal */ } },
  };

  const PANELS = ['overview', 'top', 'times', 'progress', 'history', 'wrapped', 'friends', 'collection', 'admin', 'profile'];
  const RANGE_PANELS = new Set(['overview', 'top', 'times']);
  const DATA_PANELS = new Set(['overview', 'top', 'times', 'progress', 'history', 'wrapped']);

  const state = {
    range: store.get('range', '30d'),
    topKind: store.get('topKind', 'series'),
    progressFilter: 'open',
    panel: (() => { const v = session.get('panel'); return PANELS.includes(v) ? v : 'overview'; })(),
    dashboard: null,
    top: null,
    times: null,
    progress: null,
    account: null,
    status: null,
  };

  async function api(path, opts = {}) {
    const res = await fetch(path, { credentials: 'same-origin', ...opts });
    if (res.status === 401) { location.href = '/login'; throw new Error('unauthorized'); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status, code: data.code, key: data.key });
    return data;
  }
  const errMsg = (err) => (err?.key && I.D[`err.${err.key}`] ? t(`err.${err.key}`) : err?.message || String(err));
  const postJSON = (path, body) => api(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  let toastTimer;
  function toast(msg, isError = false) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('error', isError);
    el.hidden = false;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    clearTimeout(toastTimer);
    el.classList.remove('out');
    toastTimer = setTimeout(() => { el.classList.add('out'); toastTimer = setTimeout(() => { el.hidden = true; el.classList.remove('out'); }, 320); }, 4500);
  }

  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  function relTime(date) {
    if (!date) return '';
    const diff = (Date.now() - new Date(date)) / 1000;
    if (diff < 60) return t('rel.now');
    if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute');
    if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
    if (diff < 86400 * 60) return rtf.format(-Math.floor(diff / 86400), 'day');
    return rtf.format(-Math.floor(diff / (86400 * 30)), 'month');
  }
  const dateFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
  const dateFmtYear = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' });
  const dayMonthFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' });
  const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: '2-digit' });
  const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });
  const longDayFmt = new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const longDate = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' });
  const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
  const parseDay = (s) => new Date(`${String(s).slice(0, 10)}T12:00:00`);
  const DAYS = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(LOCALE, { weekday: 'short' }).format(new Date(2024, 0, 1 + i)));
  const DAYS_LONG = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(LOCALE, { weekday: 'long' }).format(new Date(2024, 0, 1 + i)));
  const hh = (h) => String(h).padStart(2, '0');
  const hourRange = (h) => t('time.range', { a: hh(h), b: hh((h + 1) % 24) });
  const RANGE_DAYS = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
  const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const regionName = (() => { try { const dn = new Intl.DisplayNames([LOCALE], { type: 'region' }); return (c) => { try { return dn.of(c) || c; } catch { return c; } }; } catch { return (c) => c; } })();

  /** Dauer menschenlesbar: „3 Std. 20 Min.“ / „45 Min.“ / „2 T 4 Std.“ */
  function dur(secs, { short = false } = {}) {
    const m = Math.round((secs || 0) / 60);
    if (m < 60) return t('dur.m', { m });
    const h = Math.floor(m / 60);
    if (h >= 48 && !short) return t('dur.dh', { d: Math.floor(h / 24), h: h % 24 });
    return short ? t('dur.h', { h: nf1.format(m / 60) }) : t('dur.hm', { h, m: m % 60 });
  }
  const hours = (secs) => (secs || 0) / 3600;

  // ---------------------------------------------------------------- Dienste
  const SERVICES = {
    netflix: { name: 'Netflix', color: '#e50914', icon: 'N' },
    prime: { name: 'Prime Video', color: '#1a98ff', icon: 'P' },
    max: { name: 'Max', color: '#2c4cff', icon: 'M' },
    disney: { name: 'Disney+', color: '#0f6ad8', icon: 'D' },
    apple: { name: 'Apple TV+', color: '#6e7378', icon: 'A' },
    other: { name: null, color: '#8a7f8f', icon: '…' },
    trakt: { name: 'Trakt', color: '#ed2224', icon: 'T' },
  };
  const serviceName = (s) => SERVICES[s]?.name || t(`service.${s}`);
  const serviceDot = (s) => `<span class="svc-dot" style="--svc:${SERVICES[s]?.color || '#888'}" aria-hidden="true">${esc(SERVICES[s]?.icon ?? '')}</span>`;

  // ---------------------------------------------------------------- Poster (über den eigenen Server)
  const hashHue = (s) => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 360; };
  function initials(name) {
    return esc((name || '?').replace(/[^\p{L}\p{N} ]/gu, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '▶');
  }
  function placeholderPoster(name, cls = '') {
    return `<div class="poster-ph ${cls}" style="--h:${hashHue(name)}" aria-hidden="true"><span>${initials(name)}</span><small>${esc(String(name || '').slice(0, 40))}</small></div>`;
  }
  const tmdbImg = (path, size = 'w185') => (path && /^\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|svg)$/.test(path) ? `/img/tmdb/${size}${path}` : null);
  function poster(path, name, size = 'w185') {
    const src = tmdbImg(path, size);
    return src
      ? `<img class="poster-img" src="${src}" alt="" loading="lazy" decoding="async" data-ph="${esc(name)}" />`
      : placeholderPoster(name);
  }
  // Bilder blenden weich ein, sobald sie geladen sind (statt aufzuploppen)
  document.addEventListener('load', (e) => { if (e.target instanceof HTMLImageElement && e.target.classList.contains('poster-img')) e.target.classList.add('is-loaded'); }, true);
  new MutationObserver(() => {
    requestAnimationFrame(() => $$('img.poster-img:not(.is-loaded)').forEach((i) => { if (i.complete && i.naturalWidth) i.classList.add('is-loaded'); }));
  }).observe(document.documentElement, { childList: true, subtree: true });
  // Fehlgeschlagene Poster → Platzhalter (Inline-Handler verbietet die CSP)
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.classList.contains('poster-img')) img.outerHTML = placeholderPoster(img.dataset.ph || '');
  }, true);

  function countUp(el, to, format = fmt) {
    if (!el) return;
    const from = Number(el.dataset.value || 0);
    el.dataset.value = to;
    if (reduceMotion || from === to) { el.textContent = format(to); return; }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / 900);
      el.textContent = format(from + (to - from) * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function growBars(root, sel) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$(sel, root).forEach((b, i) => { b.style.transitionDelay = `${Math.min(i, 12) * 40}ms`; b.style.width = `${b.dataset.w}%`; });
    }));
  }
  function segmented(root, attr, current, onChange) {
    const buttons = $$('button', root);
    let pill = $('.seg-pill', root);
    if (!pill) { pill = document.createElement('span'); pill.className = 'seg-pill'; root.prepend(pill); }
    const select = (btn, animate = true) => {
      buttons.forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      pill.style.transition = animate ? '' : 'none';
      pill.style.width = `${btn.offsetWidth}px`;
      pill.style.transform = `translateX(${btn.offsetLeft}px)`;
    };
    const initial = buttons.find((b) => b.dataset[attr] === current) || buttons[0];
    requestAnimationFrame(() => select(initial, false));
    buttons.forEach((b) => b.addEventListener('click', () => {
      if (b.getAttribute('aria-selected') === 'true') return;
      select(b);
      onChange(b.dataset[attr]);
    }));
    const realign = () => { const sel = buttons.find((b) => b.getAttribute('aria-selected') === 'true'); if (sel) select(sel, false); };
    window.addEventListener('resize', realign);
    root.realign = realign;
  }
  const CLOSE_BTN = (extra = '') => `<button type="button" class="tour-close ${extra}" data-close-dialog aria-label="${esc(t('btn.close'))}">✕</button>`;
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close-dialog]');
    if (c) c.closest('dialog')?.close();
  });
  // Klick auf den Hintergrund schließt Dialoge
  document.addEventListener('click', (e) => {
    if (e.target instanceof HTMLDialogElement && e.target.classList.contains('dialog')) e.target.close();
  });

  // ================================================================ Chart.js
  const COLORS = { other: '#4a454c' };
  function readThemeColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n) => cs.getPropertyValue(n).trim();
    const ink = v('--ink-rgb') || '255, 255, 255';
    Object.assign(COLORS, {
      accent: v('--accent') || '#ff5a5f',
      accentRgb: (v('--accent-rgb') || '255, 90, 95').replace(/\s+/g, ''),
      accentHover: v('--accent-hover') || '#ff7579',
      grid: `rgba(${ink}, 0.08)`, tick: v('--text-3'), text: v('--text'), text2: v('--text-2'),
      surface: v('--surface'), tooltipBg: v('--tooltip-bg'), border: `rgba(${ink}, 0.16)`,
    });
  }
  readThemeColors();
  const accentA = (a) => `rgba(${COLORS.accentRgb},${a})`;
  const charts = {};
  function setupChartDefaults() {
    const C = window.Chart;
    if (!C) return;
    C.defaults.font.family = "'Programm', system-ui, sans-serif";
    C.defaults.font.size = 11;
    C.defaults.locale = LOCALE;
    C.defaults.color = COLORS.tick;
    C.defaults.animation.duration = reduceMotion ? 0 : 800;
    C.defaults.animation.easing = 'easeOutQuart';
    C.defaults.maintainAspectRatio = false;
    C.defaults.plugins.legend.display = false;
    Object.assign(C.defaults.plugins.tooltip, {
      backgroundColor: COLORS.tooltipBg, borderColor: COLORS.border, borderWidth: 1,
      titleColor: COLORS.text, bodyColor: COLORS.text2, padding: 10, cornerRadius: 10,
      displayColors: false, titleFont: { weight: '650' }, caretSize: 0,
    });
  }
  const baseScales = (extra = {}) => ({
    x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 16 } },
    y: { grid: { color: COLORS.grid }, border: { display: false }, beginAtZero: true, ticks: { precision: 0, maxTicksLimit: 5, padding: 8 } },
    ...extra,
  });
  function upsertChart(key, canvas, config) {
    if (!window.Chart || !canvas) return;
    if (charts[key] && charts[key].canvas === canvas) {
      charts[key].data = config.data;
      charts[key].options = config.options;
      charts[key].update();
    } else {
      charts[key]?.destroy();
      charts[key] = new window.Chart(canvas, config);
    }
  }
  window.addEventListener('watchlfy:theme', () => {
    if (!window.Chart) return;
    readThemeColors();
    setupChartDefaults();
    Object.keys(charts).forEach((k) => { charts[k].destroy(); delete charts[k]; });
    if (state.panel) renderPanel(state.panel);
    renderThemeSettings();
    updateFestive();
  });

  // ================================================================ Status
  const hasData = () => Boolean(state.status?.counts?.views) || Boolean(state.status?.trakt?.connected);
  async function loadStatus() {
    const s = await api('/api/status');
    state.account = s.account;
    state.status = s;
    if (T && s.account.theme && s.account.theme !== T.mode()) T.setMode(s.account.theme);
    if (T && typeof s.account.glass === 'boolean' && s.account.glass !== T.glass()) T.setGlass(s.account.glass);
    if (s.account.lang && s.account.lang !== I.lang) { I.setLang(s.account.lang); location.reload(); return s; }
    if (!s.account.lang) postJSON('/api/me/settings', { lang: I.lang }).catch(() => {});
    $('#user-line').textContent = s.account.username;
    $('#admin-tab').hidden = !s.account.is_admin;
    paintAvatars();
    renderNotices();
    updateFestive();
    maybeShowNews();
    startNowPlaying();
    window.dispatchEvent(new CustomEvent('watchlfy:status', { detail: s }));
    return s;
  }

  function renderNotices() {
    $('#privacy-banner').hidden = Boolean(state.account?.privacy_accepted);
    const tm = state.status?.tmdb;
    const el = $('#tmdb-banner');
    if (!tm || !state.status.counts.views) { el.hidden = true; return; }
    let html = '';
    if (!tm.enabled) html = `<span class="notice-icon" aria-hidden="true">🎞️</span><div class="notice-text"><strong>${esc(t('tmdb.offTitle'))}</strong><p class="muted small">${esc(t('tmdb.offText'))}</p></div>`;
    else if (tm.pending > 0) html = `<span class="notice-icon spin-slow" aria-hidden="true">⏳</span><div class="notice-text"><strong>${esc(t('tmdb.loadingTitle'))}</strong><p class="muted small">${esc(t('tmdb.loadingText', { n: fmt(tm.pending) }))}</p></div>`;
    else if (tm.uncertain > 0 && !session.get('tmdb-review-dismiss')) {
      html = `<span class="notice-icon" aria-hidden="true">🔎</span><div class="notice-text"><strong>${esc(t('tmdb.reviewTitle'))}</strong><p class="muted small">${esc(tn('tmdb.reviewText', tm.uncertain, { n: fmt(tm.uncertain) }))}</p></div>
        <div class="notice-actions"><button class="btn btn-primary btn-xs" type="button" data-open-review>${esc(t('tmdb.reviewBtn'))}</button><button class="btn btn-ghost btn-xs" type="button" data-dismiss-review>${esc(t('btn.later'))}</button></div>`;
    }
    el.innerHTML = html;
    el.hidden = !html;
    placeHeroChrome();
  }

  // Während TMDB noch lädt: alle 15 s Status + aktuellen Bereich neu holen (Poster erscheinen nach und nach)
  let tmdbPoll = null;
  function watchTmdb() {
    clearTimeout(tmdbPoll);
    if (!state.status?.tmdb?.enabled || !(state.status.tmdb.pending > 0 || state.status.tmdb.loading)) return;
    tmdbPoll = setTimeout(async () => {
      try {
        const before = state.status.tmdb.pending;
        await loadStatus();
        if (state.status.tmdb.pending !== before) { invalidate(); renderPanel(state.panel); }
      } catch { /* später nochmal */ }
      watchTmdb();
    }, 15000);
  }
  function invalidate() { state.dashboard = null; state.top = null; state.times = null; state.progress = null; hist.items = null; }

  // ================================================================ Darstellung & Sprache
  function seasonText() {
    const date = T.effectiveDate();
    const key = T.seasonOf(date);
    const info = T.SEASONS[key];
    const next = T.SEASONS[info.next];
    const end = T.seasonEnd(key, date);
    end.setDate(end.getDate() + 1);
    return t('season.text', { name: t(`season.${key}`), icon: info.icon, next: t(`season.${info.next}`), nicon: next.icon, date: longDate.format(end) });
  }
  function renderThemeSettings() {
    if (!T) return;
    const mode = T.mode();
    $$('#theme-picker [data-theme-mode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeMode === mode)));
    const hints = {
      system: esc(t('theme.hint.system', { x: t(T.resolve('system') === 'light' ? 'theme.word.light' : 'theme.word.dark') })),
      light: esc(t('theme.hint.light')), dark: esc(t('theme.hint.dark')), season: t('theme.hint.season', { s: seasonText() }),
    };
    $('#theme-hint').innerHTML = hints[mode] || '';
    $('#glass-switch')?.setAttribute('aria-checked', String(T.glass()));
    $('#festive-switch')?.setAttribute('aria-checked', String(state.account?.festive !== false));
    const input = $('#season-date');
    if (input) {
      const override = T.seasonDate();
      if (document.activeElement !== input) input.value = override || '';
      const ev = activeEvent(T.effectiveDate());
      $('#season-status').innerHTML = [
        esc(t(override ? 'admin.testActive' : 'admin.todayApplies')),
        t('admin.seasonShows', { s: seasonText() }),
        esc(t('admin.festiveShows', { e: ev ? `${FEST[ev].deco} ${t(`fest.${ev}`)}` : t('admin.noEvent') })),
      ].join(' · ');
    }
  }
  async function saveSettings(body) {
    try { await postJSON('/api/me/settings', body); return true; } catch (err) { toast(t('toast.settingsFailed', { e: errMsg(err) }), true); return false; }
  }
  async function chooseTheme(mode) { smoothSwap(() => T.setMode(mode), 'fade'); await saveSettings({ theme: mode }); }
  function renderLangPicker() {
    $('#lang-picker').innerHTML = I.LANGS.map((l) => `<button type="button" role="radio" aria-checked="${l === I.lang}" data-lang="${l}"><b>${l.toUpperCase()}</b> ${esc(I.NAMES[l])}</button>`).join('');
  }
  async function chooseLang(l) { if (l === I.lang) return; I.setLang(l); await saveSettings({ lang: l }); location.reload(); }

  // ================================================================ Sanfte Übergänge (View Transitions)
  const canVT = typeof document.startViewTransition === 'function';
  function smoothSwap(update, dir) {
    if (!canVT || reduceMotion || document.hidden) { update(); return; }
    document.documentElement.dataset.vtDir = dir || 'none';
    try {
      const vt = document.startViewTransition(update);
      // Abgebrochene Übergänge (z. B. Zeitüberschreitung) sind harmlos – nicht als Fehler melden
      vt.ready.catch(() => {});
      vt.updateCallbackDone.catch(() => {});
      vt.finished.catch(() => {}).finally(() => { delete document.documentElement.dataset.vtDir; });
    } catch { update(); }
  }
  (function smoothDialogs() {
    const P = HTMLDialogElement.prototype;
    const close = P.close;
    const showModal = P.showModal;
    P.close = function (v) {
      if (!this.open || reduceMotion || this.id === 'story' || this.classList.contains('dlg-closing')) return close.call(this, v);
      this.classList.add('dlg-closing');
      clearTimeout(this._dlgT);
      this._dlgT = setTimeout(() => { this.classList.remove('dlg-closing'); if (this.open) close.call(this, v); }, 210);
    };
    P.showModal = function () {
      if (this.classList.contains('dlg-closing')) { clearTimeout(this._dlgT); this.classList.remove('dlg-closing'); if (this.open) close.call(this); }
      return showModal.call(this);
    };
    document.addEventListener('cancel', (e) => {
      const d = e.target;
      if (d instanceof HTMLDialogElement && d.id !== 'story' && !reduceMotion) { e.preventDefault(); d.close(); }
    }, true);
  })();

  // ================================================================ Übersicht
  const ICONS = {
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
    flame: '<svg viewBox="0 0 24 24"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.5 1.5-4 2.5-5 .3 2 1.5 3 2.5 3-1-3 0-6 0-8z"/></svg>',
    tv: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>',
    calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    popcorn: '<svg viewBox="0 0 24 24"><path d="M6 9h12l-1.5 12h-9z"/><path d="M8 9a2.5 2.5 0 0 1 4-3 2.5 2.5 0 0 1 4 3"/></svg>',
  };
  const insight = (icon, labelKey, value, sub = '') =>
    `<div class="insight"><div class="insight-icon">${ICONS[icon]}</div>
      <div class="insight-label">${esc(t(labelKey))}</div>
      <div class="insight-value" title="${esc(value)}">${esc(value)}${sub ? ` <small>${esc(sub)}</small>` : ''}</div></div>`;

  async function loadDashboard() {
    state.dashboard = await api(`/api/dashboard?range=${state.range}`);
    return state.dashboard;
  }

  function renderOverview() {
    const d = state.dashboard;
    if (!d) return;
    const o = d.overview;
    countUp($('[data-kpi="hours"]'), hours(o.secs), (v) => nf.format(Math.round(v)));
    countUp($('[data-kpi="avg"]'), o.avgSecsPerDay / 60);
    countUp($('[data-kpi="episodes"]'), o.episodes);
    countUp($('[data-kpi="movies"]'), o.movies);
    countUp($('[data-kpi="series"]'), o.series);
    const sub = $('[data-kpi-sub="hours"]');
    const est = o.estimatedShare > 0.05 ? ` <span class="est-badge" title="${esc(t('est.tooltip'))}">${esc(t('est.label', { p: Math.round(o.estimatedShare * 100) }))}</span>` : '';
    if (o.prevSecs) {
      const pct = ((o.secs - o.prevSecs) / o.prevSecs) * 100;
      sub.innerHTML = `${esc(t('kpi.hoursUnit'))} · <span class="delta ${pct >= 0 ? 'up' : 'down'}">${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(0)} %</span>${est}`;
    } else sub.innerHTML = `${esc(t('kpi.hoursUnit'))}${o.secs > 86400 ? ` · ${esc(t('kpi.days', { n: nf1.format(o.secs / 86400) }))}` : ''}${est}`;
    $('[data-kpi-sub="series"]').textContent = t('kpi.inSeries', { n: fmt(o.series) });
    $('[data-kpi-sub="activeDays"]').textContent = t('kpi.onDays', { n: fmt(o.activeDays) });
    renderSparkline(o.daily);
    $('#insights').innerHTML = [
      insight('clock', 'insight.favTime', o.favHour !== null ? hourRange(o.favHour) : '–'),
      o.bestDay ? insight('star', 'insight.bestDay', dateFmt.format(parseDay(o.bestDay.day)), dur(o.bestDay.secs, { short: true })) : insight('star', 'insight.bestDay', '–'),
      insight('flame', 'insight.streak', tn('unit.day', o.streak.days, { n: fmt(o.streak.days) }), t('insight.inARow')),
      insight('popcorn', 'insight.perDay', dur(o.avgSecsPerDay), t('insight.avg')),
    ].join('');
    renderTimeline(o.daily);
    renderServiceSplit(o.services);
    renderHero(d);
    $('#overview-series').innerHTML = d.series.length ? d.series.map(rankCard).join('') : `<p class="empty">${esc(t('empty.range'))}</p>`;
    $('#overview-movies').innerHTML = d.movies.length ? d.movies.map(posterCard).join('') : `<p class="empty">${esc(t('empty.range'))}</p>`;
    const cont = d.continue || [];
    $('#continue-card').hidden = !cont.length;
    $('#continue-row').innerHTML = cont.map(wideCard).join('');
    decoratePanel('overview');
  }

  function renderSparkline(daily) {
    const svg = $('#sparkline');
    let vals = daily.map((r) => r.secs);
    if (vals.length > 60) { const w = []; for (let i = 0; i < vals.length; i += 7) w.push(vals.slice(i, i + 7).reduce((a, b) => a + b, 0)); vals = w; }
    if (vals.length < 2) { svg.innerHTML = ''; return; }
    const max = Math.max(1, ...vals);
    const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 120, 30 - (v / max) * 26]);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');
    svg.innerHTML = `<defs><linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COLORS.accent}" stop-opacity="0.35"/><stop offset="1" stop-color="${COLORS.accent}" stop-opacity="0"/></linearGradient></defs><path class="area" d="${line}L120,32L0,32Z"/><path class="line" d="${line}"/>`;
  }

  /** Lückenlose Tagesreihe (fehlende Tage = 0) für den gewählten Zeitraum. */
  function fillDays(daily) {
    if (!daily.length) return [];
    const by = new Map(daily.map((d) => [d.day, d]));
    const days = RANGE_DAYS[state.range];
    const end = new Date();
    const start = days ? new Date(Date.now() - (days - 1) * 864e5) : parseDay(daily[0].day);
    const out = [];
    for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
      const k = isoDay(d);
      out.push({ day: k, secs: by.get(k)?.secs || 0 });
    }
    return out;
  }

  function renderTimeline(daily) {
    let rows = fillDays(daily);
    let weekly = false;
    if (rows.length > 120) { // auf Wochen verdichten
      weekly = true;
      const w = [];
      for (let i = 0; i < rows.length; i += 7) w.push({ day: rows[i].day, secs: rows.slice(i, i + 7).reduce((a, b) => a + b.secs, 0) });
      rows = w;
    }
    const values = rows.map((r) => Math.round(r.secs / 60));
    const total = values.reduce((a, b) => a + b, 0);
    const avg = rows.length ? total / rows.length : 0;
    const max = Math.max(0, ...values);
    $('#timeline-caption').textContent = rows.length ? t(weekly ? 'timeline.capWeek' : 'timeline.capDay', { avg: dur(avg * 60), max: dur(max * 60) }) : '';
    upsertChart('timeline', $('#timeline-chart'), {
      type: 'bar',
      data: {
        labels: rows.map((r) => r.day),
        datasets: [{
          data: values,
          backgroundColor: (ctx) => (ctx.raw === max && max > 0 ? COLORS.accent : ctx.raw >= avg ? accentA(0.7) : accentA(0.38)),
          hoverBackgroundColor: COLORS.accentHover, borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom',
          barPercentage: 0.86, categoryPercentage: rows.length > 120 ? 1 : 0.9, maxBarThickness: 26,
        }],
      },
      options: {
        interaction: { mode: 'index', intersect: false },
        scales: baseScales({
          x: { grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkip: true, autoSkipPadding: 18, callback(v) { const day = parseDay(this.getLabelForValue(v)); return rows.length > 60 ? monthFmt.format(day) : dayMonthFmt.format(day); } } },
          y: { grid: { color: COLORS.grid }, border: { display: false }, beginAtZero: true, ticks: { maxTicksLimit: 5, padding: 8, callback: (v) => (v >= 60 ? `${Math.round(v / 60)} h` : `${v}′`) } },
        }),
        plugins: {
          tooltip: { callbacks: {
            title: (items) => (weekly ? t('timeline.weekOf', { d: dateFmtYear.format(parseDay(items[0].label)) }) : dateFmt.format(parseDay(items[0].label))),
            label: (item) => dur(item.raw * 60),
          } },
        },
      },
    });
  }

  function renderServiceSplit(services) {
    const el = $('#service-split');
    const total = services.reduce((a, s) => a + s.secs, 0);
    if (!total) { el.innerHTML = `<p class="empty">${esc(t('empty.range'))}</p>`; return; }
    el.innerHTML = `<div class="svc-bar" role="img" aria-label="${esc(t('services.title'))}">${services.map((s) => `<span style="--svc:${SERVICES[s.source]?.color};width:${(s.secs / total) * 100}%" title="${esc(serviceName(s.source))}"></span>`).join('')}</div>
      <ul class="svc-list">${services.map((s) => `<li>${serviceDot(s.source)}<b>${esc(serviceName(s.source))}</b><span>${Math.round((s.secs / total) * 100)} %</span><small>${esc(dur(s.secs, { short: true }))} · ${esc(tn('unit.title', s.titles, { n: fmt(s.titles) }))}</small></li>`).join('')}</ul>`;
  }

  function posterCard(x) {
    const key = x.title_id ? `data-title-id="${x.title_id}"` : `data-title-key="${esc(x.tkey)}"`;
    return `<button type="button" class="poster-card" ${key}>
      <div class="poster">${poster(x.poster_path, x.name)}</div>
      <b title="${esc(x.name)}">${esc(x.name)}</b>
      <small>${x.year ? `${x.year} · ` : ''}${esc(dur(x.secs, { short: true }))}${x.views > 1 ? ` · ${x.views}×` : ''}</small>
    </button>`;
  }
  function continueCard(s) {
    const label = s.next ? t('continue.next', { s: s.next.season, e: s.next.episode }) : '';
    return `<button type="button" class="poster-card continue" data-title-id="${s.title_id}">
      <div class="poster">${poster(s.poster_path, s.name)}${s.pct !== null ? `<span class="pc-progress"><i style="width:${Math.round(s.pct * 100)}%"></i></span>` : ''}</div>
      <b title="${esc(s.name)}">${esc(s.name)}</b>
      <small>${esc(label)}${s.next?.name ? ` · ${esc(s.next.name)}` : ''}</small>
    </button>`;
  }

  /** Top-10-Kachel mit großer Rangzahl (wie in Streaming-Apps). */
  function rankCard(x, i) {
    const key = x.title_id ? `data-title-id="${x.title_id}"` : `data-title-key="${esc(x.tkey)}"`;
    return `<button type="button" class="rank-card" ${key} style="--i:${i}" aria-label="${esc(`${i + 1}. ${x.name}`)}">
      <span class="rank-num" aria-hidden="true">${i + 1}</span>
      <span class="poster">${poster(x.poster_path, x.name, 'w342')}</span>
      <span class="rank-meta"><b>${esc(x.name)}</b><small>${esc(x.episodes ? tn('unit.episode', x.episodes, { n: fmt(x.episodes) }) : x.year || '')} · ${esc(dur(x.secs, { short: true }))}</small></span>
    </button>`;
  }
  /** Breitbild-Kachel mit Backdrop und Fortschritt (Weiterschauen). */
  function wideCard(s, i) {
    const back = tmdbImg(s.backdrop_path, 'w780');
    const label = s.next ? t('continue.next', { s: s.next.season, e: s.next.episode }) : '';
    return `<button type="button" class="wide-card" data-title-id="${s.title_id}" style="--i:${i}">
      <span class="wide-art">${back ? `<img class="poster-img" src="${back}" alt="" loading="lazy" decoding="async" data-ph="${esc(s.name)}" />` : placeholderPoster(s.name)}
        <span class="wide-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        ${s.pct !== null ? `<span class="pc-progress"><i style="width:${Math.max(3, Math.round(s.pct * 100))}%"></i></span>` : ''}</span>
      <span class="wide-meta"><b>${esc(s.name)}</b><small>${esc(label)}${s.next?.name ? ` · ${esc(s.next.name)}` : ''}</small></span>
    </button>`;
  }

  // ================================================================ Hero (wechselnde Titel mit Backdrop)
  /** Hero nur in der Übersicht; die Zeitraum-Wahl schwebt dort im Hero, sonst steht sie über dem Bereich. */
  function placeHeroChrome() {
    const el = $('#hero');
    const on = state.panel === 'overview' && hasData() && hero.items.length > 0;
    el.hidden = !on;
    document.body.classList.toggle('on-hero', on);
    const notices = $$('#privacy-banner, #tmdb-banner, #now-playing').some((n) => !n.hidden);
    document.body.classList.toggle('hero-flush', on && !notices);
  }
  const hero = { items: [], i: 0, timer: null };
  function renderHero(d) {
    const el = $('#hero');
    const pool = [...d.series.slice(0, 3), ...d.movies.slice(0, 2)].filter((x) => x.backdrop_path || x.poster_path);
    hero.items = pool;
    clearInterval(hero.timer);
    if (!pool.length) { el.innerHTML = ''; placeHeroChrome(); return; }
    el.innerHTML = `<div class="hero-slides">${pool.map((x, i) => {
      const back = tmdbImg(x.backdrop_path, 'w1280') || tmdbImg(x.poster_path, 'w780');
      const isTv = Boolean(x.episodes);
      const meta = [x.year, (x.genres || []).slice(0, 2).join(' · '), isTv ? tn('unit.episode', x.episodes, { n: fmt(x.episodes) }) : t('kind.movie')].filter(Boolean).join('  •  ');
      return `<article class="hero-slide${i === 0 ? ' on' : ''}" data-i="${i}" aria-hidden="${i !== 0}">
        <div class="hero-bg">${back ? `<img class="poster-img" src="${back}" alt="" decoding="async" data-ph="${esc(x.name)}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'} />` : ''}</div>
        <div class="hero-shade" aria-hidden="true"></div>
        <div class="hero-body">
          <p class="hero-kicker">${esc(t(i === 0 ? 'hero.top' : isTv ? 'hero.series' : 'hero.movie', { r: t(`range.long.${state.range}`) }))}</p>
          <h2 class="hero-title">${esc(x.name)}</h2>
          <p class="hero-meta">${esc(meta)}</p>
          ${x.overview ? `<p class="hero-text">${esc(x.overview)}</p>` : ''}
          <p class="hero-stat"><b>${esc(dur(x.secs))}</b> ${esc(t('hero.watched'))}</p>
          <div class="hero-actions">
            <button type="button" class="btn btn-hero" ${x.title_id ? `data-title-id="${x.title_id}"` : `data-title-key="${esc(x.tkey)}"`}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>${esc(t('hero.details'))}</button>
            ${isTv ? `<button type="button" class="btn btn-glass" data-goto="progress">${esc(t('nav.progress'))}</button>` : `<button type="button" class="btn btn-glass" data-goto="top" data-top-kind="movies">${esc(t('top.movies'))}</button>`}
          </div>
        </div>
      </article>`;
    }).join('')}</div>
    ${pool.length > 1 ? `<div class="hero-dots" role="tablist">${pool.map((x, i) => `<button type="button" role="tab" class="${i === 0 ? 'on' : ''}" data-hero="${i}" aria-label="${esc(x.name)}"><i></i></button>`).join('')}</div>` : ''}`;
    hero.i = 0;
    placeHeroChrome();
    startHero();
  }
  function heroGo(i) {
    const el = $('#hero');
    if (!el || !hero.items.length) return;
    hero.i = (i + hero.items.length) % hero.items.length;
    $$('.hero-slide', el).forEach((sl, k) => { sl.classList.toggle('on', k === hero.i); sl.setAttribute('aria-hidden', String(k !== hero.i)); });
    $$('.hero-dots button', el).forEach((b, k) => { b.classList.toggle('on', k === hero.i); });
  }
  function startHero() {
    clearInterval(hero.timer);
    if (reduceMotion || hero.items.length < 2) return;
    hero.timer = setInterval(() => { if (!document.hidden && state.panel === 'overview' && !hero.paused) heroGo(hero.i + 1); }, 7000);
  }
  function bindHero() {
    const el = $('#hero');
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-hero]'); if (b) { heroGo(Number(b.dataset.hero)); startHero(); } });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
    el.addEventListener('pointerenter', () => { hero.paused = true; });
    el.addEventListener('pointerleave', () => { hero.paused = false; });
    let x0 = null;
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = (e.changedTouches[0]?.clientX ?? x0) - x0;
      x0 = null;
      if (Math.abs(dx) > 50) { heroGo(hero.i + (dx < 0 ? 1 : -1)); startHero(); }
    });
  }

  function renderRankBars(el, list, kind, offset = 0) {
    if (!list.length) { el.innerHTML = offset ? '' : `<li class="empty">${esc(t('empty.range'))}</li>`; return; }
    const max = list[0].secs || 1;
    const meta = (x) => {
      if (kind === 'series') return tn('unit.episode', x.episodes, { n: fmt(x.episodes) });
      if (kind === 'movies') return `${x.year || ''}${x.views > 1 ? ` · ${t('rb.views', { n: x.views })}` : ''}`;
      if (kind === 'actors') return (x.examples || []).join(', ');
      return tn('unit.title', x.titles, { n: fmt(x.titles) });
    };
    const label = (x) => (kind === 'countries' ? regionName(x.name) : x.name);
    const visual = (x) => {
      if (kind === 'series' || kind === 'movies') return `<div class="cover poster-mini">${poster(x.poster_path, x.name, 'w92')}</div>`;
      if (kind === 'countries') return `<div class="cover round flag">${esc(flag(x.name))}</div>`;
      return `<div class="cover round"><div class="placeholder" aria-hidden="true">${initials(x.name)}</div></div>`;
    };
    const attrs = (x) => (x.title_id ? `data-title-id="${x.title_id}"` : x.tkey ? `data-title-key="${esc(x.tkey)}"` : '');
    el.innerHTML = list.map((x, i) => `
      <li class="rb" ${attrs(x)}>
        <span class="num">${offset + i + 1}</span>
        ${visual(x)}
        <div class="rb-main">
          <div class="rb-title">${esc(label(x))}</div>
          <div class="rb-sub">${esc(meta(x))}</div>
          <div class="rb-bar"><span data-w="${Math.max(2, (x.secs / max) * 100)}"></span></div>
        </div>
        <div class="rb-val">${esc(dur(x.secs, { short: true }))}${x.estimated ? `<small>${esc(t('est.short'))}</small>` : ''}</div>
      </li>`).join('');
    growBars(el, '.rb-bar span');
  }
  const flag = (cc) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🌍');

  // ================================================================ Top-Listen
  async function loadTop() {
    state.top = await api(`/api/top?range=${state.range}&kind=${state.topKind}`);
  }
  function renderTop() {
    const d = state.top;
    if (!d) return;
    const kind = d.kind;
    $('#top-title').textContent = t(`top.${kind}`);
    $('#top-sub').textContent = t(`top.${kind}Sub`);
    const items = d.items;
    const top3 = items.slice(0, 3);
    const el = $('#podium');
    const posterKind = kind === 'series' || kind === 'movies';
    el.classList.toggle('top-grid', posterKind);
    if (!top3.length) el.innerHTML = `<p class="empty">${esc(t('empty.range'))}</p>`;
    else if (posterKind) {
      el.innerHTML = items.slice(0, 10).map(rankCard).join('');
      renderRankBars($('#top-list'), items.slice(10), kind, 10);
      $('#top-list').start = 11;
      decoratePanel('top');
      return;
    } else {
      const order = [top3[1], top3[0], top3[2]].map((a, i) => (a ? { a, place: [2, 1, 3][i] } : null)).filter(Boolean);
      const img = (a) => (kind === 'series' || kind === 'movies' ? poster(a.poster_path, a.name, 'w342')
        : kind === 'countries' ? `<div class="placeholder flag-big">${esc(flag(a.name))}</div>` : `<div class="placeholder" aria-hidden="true">${initials(a.name)}</div>`);
      el.innerHTML = order.map(({ a, place }) => `
        <div class="podium-item p${place}${kind === 'series' || kind === 'movies' ? ' is-poster' : ''}" ${a.title_id ? `data-title-id="${a.title_id}"` : a.tkey ? `data-title-key="${esc(a.tkey)}"` : ''}>
          <div class="pimg-wrap"><div class="pimg">${img(a)}</div></div>
          <div class="podium-name" title="${esc(a.name)}">${esc(kind === 'countries' ? regionName(a.name) : a.name)}</div>
          <div class="podium-meta">${esc(dur(a.secs, { short: true }))}</div>
          <div class="podium-step">${place}</div>
        </div>`).join('');
    }
    $('#top-list').start = 4;
    renderRankBars($('#top-list'), items.slice(3), kind, 3);
    if (['genres', 'actors', 'countries'].includes(kind) && !items.length && state.status?.tmdb && !state.status.tmdb.enabled) {
      $('#top-list').innerHTML = `<li class="empty">${esc(t('top.needsTmdb'))}</li>`;
    }
    decoratePanel('top');
  }

  // ================================================================ Schauzeiten
  async function loadTimes() { state.times = await api(`/api/times?range=${state.range}`); }
  function gridOf(rows) {
    const g = Array.from({ length: 7 }, () => Array(24).fill(0));
    rows.forEach((r) => { g[r.dow][r.hour] += Math.round(r.secs / 60); });
    return g;
  }
  function renderTimes() {
    const d = state.times;
    if (!d) return;
    const grid = gridOf(d.grid);
    const hrs = Array(24).fill(0);
    const days = Array(7).fill(0);
    grid.forEach((row, di) => row.forEach((v, h) => { hrs[h] += v; days[di] += v; }));
    const total = hrs.reduce((a, b) => a + b, 0);
    $('#times-sub').textContent = d.untimed ? t('times.subUntimed', { n: fmt(d.untimed) }) : t('times.sub');
    if (total) {
      const peakH = hrs.indexOf(Math.max(...hrs));
      const peakD = days.indexOf(Math.max(...days));
      const night = [22, 23, 0, 1, 2, 3, 4].reduce((a, h) => a + hrs[h], 0) / total;
      const prime = [20, 21, 22].reduce((a, h) => a + hrs[h], 0) / total;
      const weekend = (days[5] + days[6]) / total;
      $('#time-insights').innerHTML = [
        insight('clock', 'insight.peakTime', hourRange(peakH)),
        insight('calendar', 'insight.favDay', DAYS_LONG[peakD]),
        night > 0.2 ? insight('moon', 'insight.nightOwl', `${Math.round(night * 100)} %`, t('time.range', { a: '22', b: '5' })) : insight('tv', 'insight.primetime', `${Math.round(prime * 100)} %`, t('time.range', { a: '20', b: '23' })),
        insight('sun', 'insight.weekend', `${Math.round(weekend * 100)} %`, t('insight.ofTime')),
      ].join('');
    } else $('#time-insights').innerHTML = '';
    renderHeatmap(grid);
    intensityBars('hours', $('#hours-chart'), hrs.map((_, h) => (h % 3 === 0 ? `${h}` : '')), hrs, (i) => hourRange(i));
    intensityBars('weekdays', $('#weekday-chart'), DAYS, days, (i) => DAYS_LONG[i]);
    const b = d.binges.slice(0, 12);
    $('#binge-list').innerHTML = b.length ? b.map((x, i) => `
      <li class="binge" ${x.tkey?.startsWith('t') ? `data-title-id="${x.tkey.slice(1)}"` : `data-title-key="${esc(x.tkey)}"`} style="--i:${i}">
        <div class="cover poster-mini">${poster(x.poster_path, x.name, 'w92')}</div>
        <div class="binge-main"><b>${esc(x.name)}</b><small>${esc(x.timed ? `${dateFmtYear.format(new Date(x.start))} · ${timeFmt.format(new Date(x.start))}–${timeFmt.format(new Date(x.end))}` : dateFmtYear.format(parseDay(x.start)))}</small></div>
        <div class="binge-count"><b>${x.episodes}</b><small>${esc(t('binge.inARow'))}</small></div>
      </li>`).join('') : `<li class="empty">${esc(t('binge.none'))}</li>`;
    decoratePanel('times');
  }
  function renderHeatmap(grid) {
    const el = $('#heatmap');
    el.classList.remove('is-ready');
    const max = Math.max(1, ...grid.flat());
    let peak = { d: 0, h: 0, v: -1 };
    grid.forEach((row, d) => row.forEach((v, h) => { if (v > peak.v) peak = { d, h, v }; }));
    const wide = window.innerWidth >= 700;
    let html = '<span></span>';
    for (let h = 0; h < 24; h++) html += `<span class="heat-col-label">${h % (wide ? 3 : 6) === 0 ? h : ''}</span>`;
    grid.forEach((row, d) => {
      html += `<span class="heat-row-label">${esc(DAYS[d])}</span>`;
      row.forEach((v, h) => {
        const alpha = v === 0 ? 0.04 : 0.1 + 0.9 * Math.pow(v / max, 0.75);
        html += `<span class="heat-cell${d === peak.d && h === peak.h && v > 0 ? ' peak' : ''}" role="gridcell" tabindex="-1" data-d="${d}" data-h="${h}" data-v="${v}" data-a="${alpha.toFixed(3)}" aria-label="${esc(`${DAYS_LONG[d]} ${t('time.hour', { h })}: ${dur(v * 60)}`)}"></span>`;
      });
    });
    el.innerHTML = html;
    $$('.heat-cell', el).forEach((c) => {
      c.style.background = accentA(c.dataset.a);
      c.style.transitionDelay = reduceMotion ? '0ms' : `${(Number(c.dataset.h) + Number(c.dataset.d) * 2) * 10}ms`;
    });
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-ready')));
  }
  function bindHeatTooltip() {
    const el = $('#heatmap');
    const tip = $('#heat-tip');
    const show = (cell) => {
      tip.innerHTML = `${esc(DAYS_LONG[Number(cell.dataset.d)])}, ${esc(hourRange(Number(cell.dataset.h)))}<br><strong>${esc(dur(Number(cell.dataset.v) * 60))}</strong>`;
      const r = cell.getBoundingClientRect();
      tip.style.left = `${Math.min(Math.max(r.left + r.width / 2, 90), window.innerWidth - 90)}px`;
      tip.style.top = `${r.top}px`;
      tip.hidden = false;
    };
    el.addEventListener('pointerover', (e) => { const c = e.target.closest('.heat-cell'); if (c) show(c); });
    el.addEventListener('pointerleave', () => { tip.hidden = true; });
    el.addEventListener('click', (e) => { const c = e.target.closest('.heat-cell'); if (c) show(c); });
    window.addEventListener('scroll', () => { tip.hidden = true; }, { passive: true });
  }
  function intensityBars(key, canvas, labels, values, tooltipTitle) {
    const max = Math.max(1, ...values);
    upsertChart(key, canvas, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: values.map((v) => (v === max ? COLORS.accent : accentA(0.2 + 0.6 * (v / max)))), hoverBackgroundColor: COLORS.accentHover, borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: 'bottom', barPercentage: 0.82, categoryPercentage: 0.92 }] },
      options: { scales: baseScales({ y: { display: false, beginAtZero: true } }), plugins: { tooltip: { callbacks: { title: (items) => tooltipTitle(items[0].dataIndex), label: (item) => dur(item.raw * 60) } } } },
    });
  }

  // ================================================================ Serien-Fortschritt
  async function loadProgress() { state.progress = await api('/api/progress'); }
  function renderProgress() {
    const d = state.progress;
    if (!d) return;
    $('#progress-continue').innerHTML = d.continue.length ? d.continue.map(continueCard).join('') : `<p class="empty">${esc(t('continue.none'))}</p>`;
    const f = state.progressFilter;
    const list = d.series.filter((s) => f === 'all' || (f === 'done' ? s.pct === 1 : s.pct !== 1));
    $('#progress-list').innerHTML = list.length ? list.map((s, i) => `
      <li class="prog" data-title-id="${s.title_id}" style="--i:${Math.min(i, 20)}">
        <div class="cover poster-mini">${poster(s.poster_path, s.name, 'w92')}</div>
        <div class="prog-main">
          <div class="prog-head"><b>${esc(s.name)}</b><span>${s.total ? `${fmt(s.seen)} / ${fmt(s.total)}` : esc(tn('unit.episode', s.seen, { n: fmt(s.seen) }))}</span></div>
          <div class="prog-bar"><span data-w="${s.pct !== null ? Math.max(2, s.pct * 100) : 0}"></span></div>
          <div class="prog-seasons">${s.seasons.map((x) => `<span class="ps${x.total && x.seen >= x.total ? ' full' : x.seen ? ' part' : ''}" title="${esc(t('progress.season', { s: x.season, a: x.seen, b: x.total }))}">${x.season}</span>`).join('')}</div>
          <small class="muted">${esc(s.pct === 1 ? t('progress.complete') : s.next ? t('continue.next', { s: s.next.season, e: s.next.episode }) : '')}${s.status === 'Ended' || s.status === 'Canceled' ? ` · ${esc(t('progress.ended'))}` : ''} · ${esc(relTime(s.last))}${s.unnumbered ? ` · ${esc(t('progress.unnumbered', { n: s.unnumbered }))}` : ''}</small>
        </div>
      </li>`).join('') : `<li class="empty">${esc(state.status?.tmdb?.enabled ? t('progress.none') : t('top.needsTmdb'))}</li>`;
    growBars($('#progress-list'), '.prog-bar span');
  }

  // ================================================================ Verlauf
  const hist = { items: null, done: false, q: '' };
  async function loadHistory(reset = false) {
    if (reset) { hist.items = null; hist.done = false; }
    const before = hist.items?.length ? hist.items[hist.items.length - 1].watched_at : '';
    const r = await api(`/api/history?limit=60${before ? `&before=${encodeURIComponent(before)}` : ''}${hist.q ? `&q=${encodeURIComponent(hist.q)}` : ''}`);
    hist.items = [...(hist.items || []), ...r.items];
    hist.done = r.items.length < 60;
  }
  const epLabel = (v) => (v.kind === 'tv' ? [v.season ? t('ep.s', { n: v.season }) : '', v.episode ? t('ep.e', { n: v.episode }) : '', v.episode_name || ''].filter(Boolean).join(' · ') : '');
  function renderHistory() {
    const el = $('#history');
    if (!hist.items) return;
    if (!hist.items.length) { el.innerHTML = `<p class="empty card">${esc(hist.q ? t('search.none') : t('empty.range'))}</p>`; $('#history-more').hidden = true; return; }
    const byDay = new Map();
    for (const v of hist.items) {
      const k = isoDay(new Date(v.watched_at));
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(v);
    }
    el.innerHTML = [...byDay].map(([day, items]) => {
      const secs = items.reduce((a, v) => a + v.secs, 0);
      return `<section class="card day-card" data-day="${day}">
        <header class="day-head"><h3 class="day-title">${esc(longDayFmt.format(parseDay(day)))}</h3><span class="muted small">${esc(dur(secs))} · ${esc(tn('unit.entry', items.length, { n: items.length }))}</span></header>
        <ul class="hist-list">${items.map((v) => `
          <li class="hist" ${v.title_id ? `data-title-id="${v.title_id}"` : `data-title-key="${esc(v.tkey)}"`}>
            <div class="cover poster-mini">${poster(v.poster_path, v.name, 'w92')}</div>
            <div class="hist-main"><b>${esc(v.name)}</b><small>${esc(epLabel(v) || (v.kind === 'movie' ? t('kind.movie') : ''))}</small></div>
            <div class="hist-meta">${serviceDot(v.source)}<small>${v.time_known ? esc(timeFmt.format(new Date(v.watched_at))) : ''}<br>${esc(dur(v.secs))}${v.estimated ? '*' : ''}</small></div>
          </li>`).join('')}</ul>
      </section>`;
    }).join('') + (hist.items.some((v) => v.estimated) ? `<p class="muted small est-note">* ${esc(t('est.tooltip'))}</p>` : '');
    $('#history-more').hidden = hist.done;
    decoratePanel('history');
  }
  function bindHistory() {
    let timer;
    $('#search-input').addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        hist.q = e.target.value.trim();
        await loadHistory(true).catch((err) => toast(errMsg(err), true));
        renderHistory();
      }, 280);
    });
    $('#history-more').addEventListener('click', async (e) => {
      e.target.disabled = true;
      try { await loadHistory(); renderHistory(); } catch (err) { toast(errMsg(err), true); }
      e.target.disabled = false;
    });
  }

  // ================================================================ Detailansicht
  async function openDetail({ id = null, key = null }, src = null) {
    const dlg = $('#detail-dialog');
    const srcImg = src?.querySelector('img.poster-img');
    const name = src?.querySelector('b, .podium-name, .rb-title, .hero-title')?.textContent || '';
    const skeleton = () => {
      $('#detail-body').innerHTML = `${CLOSE_BTN('on-image')}<div class="detail-hero no-back"><div class="detail-poster vt-poster">${srcImg ? `<img class="poster-img is-loaded" src="${srcImg.getAttribute('src')}" alt="" />` : placeholderPoster(name)}</div>
        <div class="detail-head"><h2 id="detail-title">${esc(name)}</h2><div class="sk-lines"><span class="sk sk-line"></span><span class="sk sk-line short"></span></div></div></div>
        <div class="detail-loading"><span class="spinner"></span></div>`;
      if (!dlg.open) dlg.showModal();
    };
    // Geteiltes Element: das angetippte Poster gleitet in die Detailansicht
    if (srcImg && canVT && !reduceMotion && !dlg.open) {
      srcImg.style.viewTransitionName = 'vt-poster';
      document.documentElement.dataset.vtDir = 'detail';
      try {
        const vt = document.startViewTransition(() => { srcImg.style.viewTransitionName = ''; skeleton(); });
        vt.ready.catch(() => {}); vt.updateCallbackDone.catch(() => {});
        vt.finished.catch(() => {}).finally(() => { delete document.documentElement.dataset.vtDir; srcImg.style.viewTransitionName = ''; });
      } catch { srcImg.style.viewTransitionName = ''; skeleton(); }
    } else skeleton();
    try {
      const d = await api(`/api/title?${id ? `id=${encodeURIComponent(id)}` : `key=${encodeURIComponent(key)}`}`);
      renderDetail(d);
      $('#detail-body')?.classList.remove('fresh'); void $('#detail-body')?.offsetWidth; $('#detail-body')?.classList.add('fresh');
    } catch (err) {
      $('#detail-body').innerHTML = `${CLOSE_BTN()}<p class="empty">${esc(errMsg(err))}</p>`;
    }
  }
  function renderDetail(d) {
    const tt = d.title;
    const back = tmdbImg(tt?.backdrop_path, 'w780');
    const seenEps = new Set(d.views.filter((v) => v.season && v.episode).map((v) => `${v.season}:${v.episode}`));
    let seasonsHtml = '';
    if (d.kind === 'tv' && tt?.seasons?.length) {
      seasonsHtml = `<h3 class="detail-h">${esc(t('detail.seasons'))}</h3><div class="season-grid">${tt.seasons.map((s) => {
        const eps = Array.from({ length: s.episodes || 0 }, (_, i) => i + 1);
        const seen = eps.filter((e) => seenEps.has(`${s.season}:${e}`)).length;
        return `<div class="sg-row"><span class="sg-label">${esc(t('ep.s', { n: s.season }))}</span><div class="sg-eps">${eps.map((e) => {
          const name = d.episodes.find((x) => x.season === s.season && x.episode === e)?.name || '';
          return `<i class="${seenEps.has(`${s.season}:${e}`) ? 'on' : ''}" title="${esc(`${t('ep.e', { n: e })}${name ? ` · ${name}` : ''}`)}"></i>`;
        }).join('')}</div><span class="sg-count">${seen}/${s.episodes || 0}</span></div>`;
      }).join('')}</div>`;
    }
    const facts = [
      tt?.year, tt?.genres?.slice(0, 3).join(', '), tt?.countries?.slice(0, 2).map(regionName).join(', '),
      tt?.runtime ? t(d.kind === 'tv' ? 'detail.epRuntime' : 'detail.runtime', { n: tt.runtime }) : null,
    ].filter(Boolean);
    $('#detail-body').innerHTML = `${CLOSE_BTN('on-image')}
      <div class="detail-hero${back ? '' : ' no-back'}" ${back ? `style="--back:url('${back}')"` : ''}>
        <div class="detail-poster vt-poster">${poster(tt?.poster_path, d.name, 'w342')}</div>
        <div class="detail-head">
          <p class="detail-kicker">${esc(t(d.kind === 'tv' ? 'kind.tv' : 'kind.movie'))}${d.match_state === 'uncertain' ? ` · <span class="tag tag-warn">${esc(t('match.uncertain'))}</span>` : ''}${d.match_state === 'none' || !tt ? ` · <span class="tag tag-warn">${esc(t('match.none'))}</span>` : ''}</p>
          <h2 id="detail-title">${esc(d.name)}</h2>
          <p class="muted small">${esc(facts.join(' · '))}</p>
        </div>
      </div>
      <div class="detail-stats">
        <div><b>${esc(dur(d.secs))}</b><small>${esc(t('detail.total'))}${d.estimated ? '*' : ''}</small></div>
        <div><b>${fmt(d.count)}</b><small>${esc(t(d.kind === 'tv' ? 'detail.episodeViews' : 'detail.views'))}</small></div>
        <div><b>${esc(dateFmtYear.format(new Date(d.first)))}</b><small>${esc(t('detail.first'))}</small></div>
        <div><b>${esc(relTime(d.last))}</b><small>${esc(t('detail.last'))}</small></div>
      </div>
      <p class="detail-sources">${d.sources.map((s) => `<span class="svc-chip">${serviceDot(s)}${esc(serviceName(s))}</span>`).join('')}</p>
      ${tt?.overview ? `<p class="detail-overview">${esc(tt.overview)}</p>` : ''}
      ${tt?.cast?.length ? `<p class="muted small"><b>${esc(t('detail.cast'))}:</b> ${esc(tt.cast.slice(0, 8).join(', '))}</p>` : ''}
      ${seasonsHtml}
      <h3 class="detail-h">${esc(t('detail.history'))}</h3>
      <ul class="detail-views">${d.views.slice(0, 80).map((v) => `<li><span>${esc(v.time_known ? dateTimeFmt.format(new Date(v.watched_at)) : dateFmtYear.format(new Date(v.watched_at)))}</span><b>${esc(epLabel(v) || d.name)}</b><small>${serviceDot(v.source)} ${esc(dur(v.secs))}${v.estimated ? '*' : ''}</small></li>`).join('')}</ul>
      ${d.estimated ? `<p class="muted small">* ${esc(t('est.tooltip'))}</p>` : ''}
      ${state.status?.tmdb?.enabled ? `<div class="detail-actions"><button type="button" class="btn btn-ghost btn-xs" data-correct="${esc(d.raw_keys[0])}" data-correct-name="${esc(d.name)}" data-correct-kind="${d.kind}">✎ ${esc(t('match.correct'))}</button></div>` : ''}`;
  }

  // ---------------------------------------------------------------- Treffer korrigieren
  async function openCorrect(rawKey, name, kind) {
    const dlg = $('#correct-dialog');
    $('#correct-body').innerHTML = `${CLOSE_BTN()}<h2 id="correct-title">${esc(t('match.correctTitle'))}</h2>
      <p class="muted small">${esc(t('match.correctSub'))}</p>
      <form class="correct-form" id="correct-form"><input type="search" id="correct-q" value="${esc(name)}" maxlength="120" aria-label="${esc(t('search.placeholder'))}" />
        <select id="correct-kind" aria-label="${esc(t('match.kind'))}"><option value="">${esc(t('match.any'))}</option><option value="tv" ${kind === 'tv' ? 'selected' : ''}>${esc(t('kind.tv'))}</option><option value="movie" ${kind === 'movie' ? 'selected' : ''}>${esc(t('kind.movie'))}</option></select>
        <button class="btn btn-primary" type="submit">${esc(t('match.search'))}</button></form>
      <ul class="correct-list" id="correct-list"></ul>
      <button type="button" class="link-btn" data-correct-none>${esc(t('match.noneBtn'))}</button>`;
    dlg.dataset.rawKey = rawKey;
    if (!dlg.open) dlg.showModal();
    const search = async () => {
      const list = $('#correct-list');
      list.innerHTML = '<li class="detail-loading"><span class="spinner"></span></li>';
      try {
        const r = await api(`/api/tmdb/search?q=${encodeURIComponent($('#correct-q').value)}&kind=${$('#correct-kind').value}`);
        list.innerHTML = r.items.length ? r.items.map((c) => `<li><button type="button" class="correct-item" data-pick-kind="${c.kind}" data-pick-id="${c.tmdb_id}">
          <div class="cover poster-mini">${poster(c.poster_path, c.name, 'w92')}</div>
          <div><b>${esc(c.name)}</b><small>${esc(t(c.kind === 'tv' ? 'kind.tv' : 'kind.movie'))}${c.year ? ` · ${c.year}` : ''}</small><p class="muted small">${esc(c.overview)}</p></div></button></li>`).join('')
          : `<li class="empty">${esc(t('search.none'))}</li>`;
      } catch (err) { list.innerHTML = `<li class="empty">${esc(errMsg(err))}</li>`; }
    };
    $('#correct-form').addEventListener('submit', (e) => { e.preventDefault(); search(); });
    search();
  }
  async function pickCorrect(kind, tmdbId) {
    const dlg = $('#correct-dialog');
    try {
      await postJSON('/api/tmdb/correct', { raw_key: dlg.dataset.rawKey, kind, tmdb_id: tmdbId });
      dlg.close();
      $('#detail-dialog').open && $('#detail-dialog').close();
      toast(t('match.saved'));
      invalidate();
      await loadStatus();
      renderPanel(state.panel);
      if (state.panel === 'profile') loadReview();
    } catch (err) { toast(errMsg(err), true); }
  }

  // ================================================================ Import-Assistent
  const DATA_LINKS = {
    netflix: 'https://www.netflix.com/viewingactivity',
    netflixFull: 'https://www.netflix.com/account/getmyinfo',
    prime: 'https://www.amazon.de/hz/privacy-central/data-requests/preview.html',
    max: 'https://www.wbdprivacy.com/',
    disney: 'https://privacy.thewaltdisneycompany.com/',
    apple: 'https://privacy.apple.com/',
  };
  const SLOW = new Set(['prime', 'max', 'disney', 'apple']);
  const imp = { source: null, preview: null, busy: false };

  function servicesGrid(withCounts = false) {
    const counts = new Map((state.dashboard?.overview?.services || []).map((s) => [s.source, s.views]));
    const has = new Set(state.status?.counts?.sources || []);
    return ['netflix', 'prime', 'max', 'disney', 'apple', 'other'].map((s) => `
      <button type="button" class="svc-btn" data-import="${s}" style="--svc:${SERVICES[s].color}">
        ${serviceDot(s)}<b>${esc(t(`import.btn.${s}`))}</b>
        ${withCounts && has.has(s) ? `<small>✓ ${esc(t('import.hasData'))}${counts.get(s) ? ` · ${fmt(counts.get(s))}` : ''}</small>` : `<small>${esc(t(`import.hint.${s}`))}</small>`}
      </button>`).join('');
  }

  function openImport(source) {
    imp.source = source;
    imp.preview = null;
    renderImportGuide();
    const dlg = $('#import-dialog');
    if (!dlg.open) dlg.showModal();
  }

  function renderImportGuide() {
    const s = imp.source;
    if (!s) {
      $('#import-body').innerHTML = `${CLOSE_BTN()}<h2 id="import-title">${esc(t('import.title'))}</h2><p class="muted small">${esc(t('import.choose'))}</p><div class="service-grid">${servicesGrid(true)}</div>`;
      return;
    }
    const steps = [1, 2, 3, 4].map((n) => I.D[`import.${s}.s${n}`] ? t(`import.${s}.s${n}`) : null).filter(Boolean);
    const link = DATA_LINKS[s];
    $('#import-body').innerHTML = `${CLOSE_BTN()}
      <button type="button" class="link-btn imp-back" data-import-back>‹ ${esc(t('import.allServices'))}</button>
      <h2 id="import-title">${serviceDot(s)} ${esc(t(`import.btn.${s}`))}</h2>
      ${SLOW.has(s) ? `<p class="notice-inline">⏳ ${esc(t('import.slow'))}</p>` : ''}
      <ol class="imp-steps">${steps.map((x, i) => `<li style="--i:${i}">${x}</li>`).join('')}</ol>
      ${link ? `<p class="imp-links"><a class="btn btn-ghost btn-xs" href="${link}" target="_blank" rel="noopener noreferrer">↗ ${esc(t('import.openPage'))}</a>${s === 'netflix' ? ` <a class="btn btn-ghost btn-xs" href="${DATA_LINKS.netflixFull}" target="_blank" rel="noopener noreferrer">↗ ${esc(t('import.netflix.full'))}</a>` : ''}</p>` : ''}
      <label class="dropzone" id="dropzone">
        <input type="file" id="import-file" accept=".csv,.tsv,.txt,.json,.zip,text/csv,application/json,application/zip" />
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 20h14" /></svg>
        <span>${t('import.drop')}</span>
        <small class="muted">${esc(t('import.formats'))}</small>
      </label>
      <p class="muted small">🔒 ${esc(t('import.privacy'))}</p>`;
    const dz = $('#dropzone');
    ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
    ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
    dz.addEventListener('drop', (e) => { const f = e.dataTransfer?.files?.[0]; if (f) uploadPreview(f); });
    $('#import-file').addEventListener('change', (e) => { const f = e.target.files?.[0]; if (f) uploadPreview(f); });
  }

  async function uploadPreview(file) {
    if (imp.busy) return;
    if (file.size > 60 * 1024 * 1024) { toast(t('err.importTooBig'), true); return; }
    imp.busy = true;
    $('#dropzone')?.classList.add('busy');
    $('#dropzone span').textContent = t('import.reading', { f: file.name });
    try {
      const res = await fetch(`/api/import/preview?source=${imp.source}`, {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': encodeURIComponent(file.name) }, body: file,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { key: data.key });
      imp.preview = data;
      renderImportPreview();
    } catch (err) {
      toast(errMsg(err), true);
      renderImportGuide();
    } finally { imp.busy = false; }
  }

  const ROLE_LABEL = (r) => t(`role.${r}`);
  function renderImportPreview() {
    const p = imp.preview;
    const period = p.first ? `${dateFmtYear.format(new Date(p.first))} – ${dateFmtYear.format(new Date(p.last))}` : '–';
    const profiles = p.profiles.filter((x) => x.name);
    const skipped = p.skipped.trailer + p.skipped.short + p.skipped.invalid;
    const showMap = p.needsMapping || imp.showMap;
    $('#import-body').innerHTML = `${CLOSE_BTN()}
      <button type="button" class="link-btn imp-back" data-import-restart>‹ ${esc(t('import.otherFile'))}</button>
      <h2 id="import-title">${serviceDot(p.source)} ${esc(t('import.previewTitle'))}</h2>
      <p class="muted small">📄 ${esc(p.filename)}${p.tables.length > 1 ? ` · ${esc(t('import.tableFound', { n: p.tables.length }))}` : ''}</p>
      ${p.tables.length > 1 ? `<label class="imp-table">${esc(t('import.table'))}<select id="imp-table">${p.tables.map((x) => `<option value="${x.index}" ${x.index === p.tableIndex ? 'selected' : ''}>${esc(x.name)} (${fmt(x.rows)})</option>`).join('')}</select></label>` : ''}
      ${p.needsMapping ? `<p class="notice-inline warn">🧩 ${esc(t('import.needsMapping'))}</p>` : ''}
      <div class="imp-stats">
        <div><b>${fmt(p.entries)}</b><small>${esc(t('import.entries'))}</small></div>
        <div><b>${fmt(p.episodes)}</b><small>${esc(t('kpi.episodes'))}</small></div>
        <div><b>${fmt(p.movies)}</b><small>${esc(t('kpi.movies'))}</small></div>
        <div><b>${fmt(p.series)}</b><small>${esc(t('kpi.series'))}</small></div>
      </div>
      <p class="imp-period">📅 ${esc(period)}</p>
      <p class="muted small">${esc(t('import.quality', { t: p.entries ? Math.round((p.withTime / p.entries) * 100) : 0, d: p.entries ? Math.round((p.withDuration / p.entries) * 100) : 0 }))}${skipped ? ` · ${esc(t('import.skipped', { n: fmt(skipped), tr: fmt(p.skipped.trailer), sh: fmt(p.skipped.short) }))}` : ''}</p>
      ${profiles.length ? `<fieldset class="imp-profiles"><legend>${esc(t('import.profiles'))}</legend>${profiles.map((x, i) => `<label><input type="checkbox" name="imp-profile" value="${esc(x.name)}" ${i === 0 || profiles.length === 1 ? 'checked' : ''} /> ${esc(x.name)} <small>${fmt(x.count)}</small></label>`).join('')}</fieldset>` : ''}
      ${p.sample.length ? `<div class="imp-sample"><table><thead><tr><th>${esc(t('role.title'))}</th><th>${esc(t('import.when'))}</th><th>${esc(t('role.duration'))}</th></tr></thead><tbody>${p.sample.map((x) => `<tr><td><b>${esc(x.series)}</b>${x.kind === 'tv' ? `<small>${esc([x.season ? t('ep.s', { n: x.season }) : '', x.episode ? t('ep.e', { n: x.episode }) : ''].filter(Boolean).join(' · ') || t('kind.tv'))}</small>` : `<small>${esc(t('kind.movie'))}</small>`}</td><td>${esc(dateFmtYear.format(new Date(x.watched_at)))}</td><td>${x.duration_sec ? esc(dur(x.duration_sec)) : '–'}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <details class="imp-map" ${showMap ? 'open' : ''}><summary>${esc(t('import.mapping'))}</summary>
        <p class="muted small">${esc(t('import.mappingHint'))}</p>
        <div class="map-grid">${p.roles.map((r) => `<label><span>${esc(ROLE_LABEL(r))}${r === 'title' || r === 'start' ? ' *' : ''}</span><select data-role="${r}"><option value="">—</option>${p.columns.map((c) => `<option value="${c.index}" ${p.mapping[r] === c.index ? 'selected' : ''}>${esc(c.name)}${c.samples[0] ? ` – ${esc(c.samples[0].slice(0, 28))}` : ''}</option>`).join('')}</select></label>`).join('')}</div>
        <button type="button" class="btn btn-ghost btn-xs" data-apply-map>${esc(t('import.applyMapping'))}</button>
      </details>
      <div class="imp-foot"><button type="button" class="btn btn-primary" data-import-commit ${p.entries ? '' : 'disabled'}>${esc(t('import.go', { n: fmt(p.entries) }))}</button></div>`;
    $('#imp-table')?.addEventListener('change', (e) => remapImport({ tableIndex: Number(e.target.value) }));
  }

  async function remapImport(body) {
    try {
      imp.preview = await postJSON('/api/import/remap', { token: imp.preview.token, ...body });
      renderImportPreview();
    } catch (err) { toast(errMsg(err), true); }
  }

  async function commitImport(btn) {
    const profiles = $$('input[name="imp-profile"]:checked').map((i) => i.value);
    if ($$('input[name="imp-profile"]').length && !profiles.length) { toast(t('import.pickProfile'), true); return; }
    btn.disabled = true;
    btn.textContent = t('import.importing');
    try {
      const r = await postJSON('/api/import/commit', { token: imp.preview.token, profiles });
      $('#import-body').innerHTML = `${CLOSE_BTN()}
        <div class="imp-done"><div class="imp-done-icon" aria-hidden="true">🎬</div>
        <h2 id="import-title">${esc(t('import.doneTitle'))}</h2>
        <p>${esc(t('import.doneText', { n: fmt(r.added), d: fmt(r.duplicates) }))}</p>
        ${state.status?.tmdb?.enabled ? `<p class="muted small">⏳ ${esc(t('import.tmdbNote'))}</p>` : `<p class="muted small">${esc(t('tmdb.offText'))}</p>`}
        <div class="imp-foot"><button type="button" class="btn btn-ghost" data-import-back>${esc(t('import.another'))}</button><button type="button" class="btn btn-primary" data-close-dialog>${esc(t('import.toStats'))}</button></div></div>`;
      confetti($('#fx-layer'), 30);
      invalidate();
      await loadStatus();
      applyView();
      renderPanel(state.panel);
      watchTmdb();
      if (state.panel === 'profile') renderProfile();
      window.dispatchEvent(new CustomEvent('watchlfy:imported', { detail: r }));
    } catch (err) {
      toast(errMsg(err), true);
      btn.disabled = false;
      btn.textContent = t('import.go', { n: fmt(imp.preview.entries) });
    }
  }

  function bindImport() {
    $('#import-open').addEventListener('click', () => openImport(null));
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-import]');
      if (b) { openImport(b.dataset.import); return; }
      if (e.target.closest('[data-import-back]')) { imp.source = imp.source && e.target.closest('.imp-done') ? imp.source : null; imp.preview = null; renderImportGuide(); return; }
      if (e.target.closest('[data-import-restart]')) { imp.preview = null; renderImportGuide(); return; }
      if (e.target.closest('[data-apply-map]')) {
        const mapping = {};
        $$('.map-grid select').forEach((s) => { if (s.value !== '') mapping[s.dataset.role] = Number(s.value); });
        imp.showMap = true;
        remapImport({ mapping });
        return;
      }
      const c = e.target.closest('[data-import-commit]');
      if (c) commitImport(c);
    });
  }

  // ================================================================ Läuft gerade (über Trakt-Scrobble)
  const np = { data: null, timer: null, tick: null };
  async function pollNowPlaying() {
    if (!state.status?.trakt?.connected || document.visibilityState !== 'visible') return;
    try { np.data = (await api('/api/now-playing')).playing; } catch { np.data = null; }
    renderNowPlaying();
  }
  function renderNowPlaying() {
    const el = $('#now-playing');
    const d = np.data;
    if (!d) { el.hidden = true; el.innerHTML = ''; return; }
    const key = `${d.name}|${d.season}|${d.episode}`;
    if (el.dataset.key !== key) {
      el.dataset.key = key;
      el.innerHTML = `<div class="np-main">
          <span class="np-cover">${poster(d.poster_path, d.name, 'w92')}</span>
          <span class="np-text">
            <span class="np-label"><span class="np-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span>${esc(t('np.watching'))} · Trakt</span></span>
            <span class="np-title">${esc(d.name)}</span>
            <span class="np-sub">${esc(d.kind === 'tv' ? [d.season ? t('ep.s', { n: d.season }) : '', d.episode ? t('ep.e', { n: d.episode }) : '', d.episode_name || ''].filter(Boolean).join(' · ') : `${t('kind.movie')}${d.year ? ` · ${d.year}` : ''}`)}</span>
          </span></div>
        <span class="np-progress" aria-hidden="true"><span></span></span>`;
      el.classList.remove('np-in'); void el.offsetWidth; el.classList.add('np-in');
    }
    el.hidden = false;
    placeHeroChrome();
    updateNpProgress();
  }
  function updateNpProgress() {
    const d = np.data;
    const bar = $('#now-playing .np-progress span');
    if (!d || !bar || !d.started_at || !d.expires_at) return;
    const a = new Date(d.started_at).getTime();
    const b = new Date(d.expires_at).getTime();
    bar.style.width = `${Math.max(0, Math.min(100, ((Date.now() - a) / (b - a)) * 100))}%`;
    if (Date.now() > b) pollNowPlaying();
  }
  function startNowPlaying() {
    if (np.timer || !state.status?.trakt?.connected) return;
    pollNowPlaying();
    np.timer = setInterval(pollNowPlaying, 60_000);
    np.tick = setInterval(updateNpProgress, 5000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pollNowPlaying(); });
  }

  // ================================================================ Profil
  async function renderProfile() {
    const s = state.status;
    if (!s) return;
    const acc = s.account;
    renderThemeSettings();
    renderLangPicker();
    paintAvatars();
    $('#profile-name').innerHTML = `${esc(acc.username)}${acc.is_admin ? ` <span class="tag tag-admin">${esc(t('role.admin'))}</span>` : ''}`;
    $('#profile-sub').textContent = s.counts.views
      ? t('profile.sub', { n: fmt(s.counts.views), d: s.counts.first ? dateFmtYear.format(new Date(s.counts.first)) : '–' })
      : t('profile.subEmpty');
    $('#profile-services').innerHTML = servicesGrid(true);
    $('#profile-account').innerHTML = `<dt>${esc(t('account.username'))}</dt><dd>${esc(acc.username)}</dd>
      <dt>${esc(t('account.since'))}</dt><dd>${esc(dateFmtYear.format(new Date(acc.created_at)))}</dd>`;
    $('#birthday-input').value = acc.birthday || '';
    renderTrakt();
    loadImportHistory();
    loadReview();
  }

  async function loadImportHistory() {
    try {
      const r = await api('/api/imports');
      const sources = state.status?.counts?.sources || [];
      $('#import-history').innerHTML = r.items.length || sources.length ? `
        <li class="ih-head">${esc(t('imports.title'))}</li>
        ${r.items.map((x) => `<li><span>${serviceDot(x.source)}</span><div><b>${esc(x.filename || serviceName(x.source))}</b>
          <small>${esc(dateTimeFmt.format(new Date(x.created_at)))} · ${esc(t('imports.row', { a: fmt(x.rows_added), t: fmt(x.rows_total) }))}${x.profile ? ` · ${esc(x.profile)}` : ''}</small></div>
          <button type="button" class="link-btn danger" data-undo-import="${x.id}">${esc(t('imports.undo'))}</button></li>`).join('')}
        ${sources.length ? `<li class="ih-sources">${sources.map((src) => `<button type="button" class="btn btn-ghost btn-xs" data-delete-source="${src}">🗑️ ${esc(t('imports.deleteSource', { s: serviceName(src) }))}</button>`).join('')}</li>` : ''}` : '';
    } catch { /* egal */ }
  }

  function renderTrakt() {
    const tr = state.status?.trakt;
    const el = $('#trakt-body');
    if (!tr) return;
    if (!tr.available) { el.innerHTML = `<p class="muted small">${esc(t('trakt.notConfigured'))}</p>`; return; }
    if (!tr.connected) {
      el.innerHTML = `<p>${esc(t('trakt.text'))}</p><div class="profile-actions"><a class="btn btn-primary" href="/auth/trakt">${serviceDot('trakt')} ${esc(t('trakt.connect'))}</a></div><p class="muted small">${esc(t('trakt.hint'))}</p>`;
      return;
    }
    el.innerHTML = `<dl class="sys-list"><dt>${esc(t('trakt.user'))}</dt><dd>${esc(tr.username || '–')}</dd>
      <dt>${esc(t('trakt.lastSync'))}</dt><dd>${tr.last_sync ? esc(relTime(tr.last_sync)) : '–'}</dd>
      ${tr.error ? `<dt>${esc(t('trakt.error'))}</dt><dd class="danger">${esc(tr.error)}</dd>` : ''}</dl>
      <div class="profile-actions"><button type="button" class="btn btn-ghost" data-trakt-sync>↻ ${esc(t('trakt.syncNow'))}</button>
      <button type="button" class="btn btn-ghost btn-danger" data-trakt-disconnect>${esc(t('trakt.disconnect'))}</button></div>`;
  }

  async function loadReview() {
    const el = $('#review-body');
    if (!state.status?.tmdb?.enabled) { el.innerHTML = `<p class="muted small">${esc(t('tmdb.offText'))}</p>`; return; }
    try {
      const r = await api('/api/tmdb/review');
      el.innerHTML = r.items.length ? `<ul class="review-list">${r.items.map((x) => `<li>
          <div class="cover poster-mini">${poster(x.poster_path, x.name || x.raw_name, 'w92')}</div>
          <div><b>${esc(x.raw_name)}</b><small>${x.name ? `→ ${esc(x.name)}${x.year ? ` (${x.year})` : ''} · ${esc(t('match.uncertain'))}` : esc(t('match.none'))} · ${esc(tn('unit.entry', x.views, { n: x.views }))}</small></div>
          <button type="button" class="btn btn-ghost btn-xs" data-correct="${esc(x.raw_key)}" data-correct-name="${esc(x.raw_name)}" data-correct-kind="${x.kind || x.kind_hint}">✎ ${esc(t('match.correct'))}</button></li>`).join('')}</ul>`
        : `<p class="muted small">✓ ${esc(t('review.allGood'))}</p>`;
    } catch (err) { el.innerHTML = `<p class="muted small">${esc(errMsg(err))}</p>`; }
  }

  async function changePassword() {
    const current = prompt(t('pw.current'));
    if (current === null) return;
    const next = prompt(t('pw.new'));
    if (next === null) return;
    if (next !== prompt(t('pw.repeat'))) { toast(t('pw.mismatch'), true); return; }
    try { await postJSON('/api/me/password', { current, next }); toast(t('pw.changed')); } catch (err) { toast(errMsg(err), true); }
  }
  async function deleteAccount() {
    if (!confirm(t('account.deleteConfirm'))) return;
    try { await api('/api/me', { method: 'DELETE' }); location.href = '/login'; } catch (err) { toast(errMsg(err), true); }
  }

  // ================================================================ Profilbild: hochladen, zuschneiden, entfernen
  // Das Bild wird im Browser auf 320×320 zugeschnitten und verkleinert – hochgeladen werden nur wenige KB.
  const avEdit = { img: null, url: null, zoom: 1, x: 0, y: 0, drag: null };
  const myAvatar = () => state.account?.avatar_url || null;

  function paintAvatars() {
    const url = myAvatar();
    const name = state.account?.username || '?';
    const avatar = $('#avatar');
    const initialsEl = $('#avatar-initials');
    if (url) {
      if (avatar.getAttribute('src') !== url) {
        avatar.classList.add('av-fade');
        avatar.onload = () => avatar.classList.remove('av-fade');
        avatar.src = url;
      }
      avatar.hidden = false;
      initialsEl.textContent = '';
    } else {
      avatar.hidden = true;
      avatar.removeAttribute('src');
      initialsEl.textContent = (name[0] || '?').toUpperCase();
    }
    const av = $('#profile-avatar');
    if (av) {
      av.innerHTML = `${url ? `<img src="${esc(url)}" alt="" />` : `<span>${esc((name[0] || '?').toUpperCase())}</span>`}
        <span class="av-edit" aria-hidden="true">📷</span>`;
      av.setAttribute('aria-label', t('avatar.change'));
      av.title = t('avatar.change');
    }
    const rm = $('#avatar-remove');
    if (rm) rm.hidden = !state.account?.custom_avatar;
  }

  function openAvatarPicker(camera = false) {
    const inp = $(camera ? '#avatar-camera' : '#avatar-file');
    inp.value = '';
    inp.click();
  }

  // Vorlagen: Emoji auf Farbverlauf, im Browser gezeichnet und wie ein Foto gespeichert
  const AV_PRESETS = [
    ['🎧', '#1db954', '#0b3d2a'], ['🎸', '#ff7a59', '#b3223a'], ['🎹', '#7b2ff7', '#2a0e5c'], ['🎤', '#ff4fa3', '#6b1446'],
    ['🦸', '#f5c542', '#a35a00'], ['🚀', '#35d7ff', '#0b4a7a'], ['👽', '#7ae582', '#1d5a2a'], ['🦊', '#ff9a3c', '#7a2e0b'],
    ['🐼', '#9aa4b2', '#2b313b'], ['🌙', '#4b6cff', '#10163d'], ['🔥', '#ff5a36', '#5c0f06'], ['🌸', '#ff9ac9', '#b8336a'],
  ];
  function presetDataUrl([emoji, c1, c2], size = 320) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    const r = ctx.createRadialGradient(size * 0.3, size * 0.2, 0, size * 0.3, size * 0.2, size * 0.8);
    r.addColorStop(0, 'rgba(255,255,255,0.35)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, size, size);
    ctx.font = `${Math.round(size * 0.5)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = size * 0.06; ctx.shadowOffsetY = size * 0.02;
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.03);
    let data = c.toDataURL('image/webp', 0.9);
    if (!data.startsWith('data:image/webp')) data = c.toDataURL('image/jpeg', 0.9);
    return data;
  }

  function openAvatarMenu() {
    const dlg = $('#avatar-menu');
    const url = myAvatar();
    const name = state.account?.username || '?';
    const touch = matchMedia('(pointer: coarse)').matches;
    $('#avatar-menu-body').innerHTML = `${CLOSE_BTN()}
      <div class="am-head">
        <div class="am-current">${url ? `<img src="${esc(url)}" alt="" />` : `<span>${esc((name[0] || '?').toUpperCase())}</span>`}</div>
        <h2 id="avatar-menu-title">${esc(t('avatar.menuTitle'))}</h2>
      </div>
      <div class="am-actions">
        <button type="button" class="am-btn" data-am="gallery"><span>🖼️</span><b>${esc(t('avatar.fromGallery'))}</b></button>
        ${touch ? `<button type="button" class="am-btn" data-am="camera"><span>📷</span><b>${esc(t('avatar.takePhoto'))}</b></button>` : ''}
        ${state.account?.custom_avatar ? `<button type="button" class="am-btn danger" data-am="remove"><span>🗑️</span><b>${esc(t('avatar.useInitial'))}</b></button>` : ''}
      </div>
      <p class="am-sub">${esc(t('avatar.presets'))}</p>
      <div class="am-presets">${AV_PRESETS.map((pr, i) => `<button type="button" class="am-preset" data-am-preset="${i}" style="--c1:${pr[1]};--c2:${pr[2]};--i:${i}" aria-label="${esc(t('avatar.preset'))} ${pr[0]}"><span>${pr[0]}</span></button>`).join('')}</div>`;
    if (!dlg.open) dlg.showModal();
  }

  async function savePreset(i, btn) {
    const data = presetDataUrl(AV_PRESETS[i]);
    btn?.classList.add('busy');
    try {
      const r = await postJSON('/api/me/avatar', { image: data });
      state.account.avatar_url = r.avatar_url;
      state.account.custom_avatar = true;
      $('#avatar-menu').close();
      paintAvatars();
      $('#profile-avatar')?.classList.add('av-pop');
      setTimeout(() => $('#profile-avatar')?.classList.remove('av-pop'), 700);
      toast(t('avatar.saved'));

    } catch (err) { toast(errMsg(err), true); btn?.classList.remove('busy'); }
  }

  async function loadAvatarFile(file) {
    if (!file) return;
    if (!/^image\//.test(file.type) && !/\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name)) { toast(t('avatar.invalid'), true); return; }
    if (file.size > 25 * 1024 * 1024) { toast(t('avatar.tooBig'), true); return; }
    // als data:-URL lesen (die Sicherheitsregeln der Seite erlauben keine blob:-Bilder)
    const dataUrl = await new Promise((res, rej) => { const fr2 = new FileReader(); fr2.onload = () => res(fr2.result); fr2.onerror = rej; fr2.readAsDataURL(file); }).catch(() => null);
    if (!dataUrl) { toast(t('avatar.invalid'), true); return; }
    avEdit.url = null;
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      Object.assign(avEdit, { img, zoom: 1, x: 0, y: 0 });
      const dlg = $('#avatar-dialog');
      $('#avatar-zoom').value = '1';
      if (!dlg.open) dlg.showModal();
      drawAvatarPreview();
    };
    img.onerror = () => toast(t('avatar.invalid'), true);
    img.src = dataUrl;
  }

  // Ausschnitt berechnen: Bild füllt den Kreis immer ganz aus (cover), Zoom und Verschieben darin
  function avatarCrop(size) {
    const { img, zoom } = avEdit;
    const base = size / Math.min(img.naturalWidth, img.naturalHeight);
    const s = base * zoom;
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    const maxX = (w - size) / 2;
    const maxY = (h - size) / 2;
    avEdit.x = Math.max(-maxX, Math.min(maxX, avEdit.x));
    avEdit.y = Math.max(-maxY, Math.min(maxY, avEdit.y));
    return { s, w, h, dx: (size - w) / 2 + avEdit.x, dy: (size - h) / 2 + avEdit.y };
  }

  function drawAvatarPreview() {
    const c = $('#avatar-canvas');
    if (!c || !avEdit.img) return;
    const size = c.width;
    const ctx = c.getContext('2d');
    const { w, h, dx, dy } = avatarCrop(size);
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(avEdit.img, dx, dy, w, h);
  }

  async function saveAvatar() {
    const btn = $('#avatar-save');
    const out = document.createElement('canvas');
    out.width = out.height = 320;
    const prev = $('#avatar-canvas');
    // gleiche Bildaufteilung wie in der Vorschau, nur in 320 px
    const k = 320 / prev.width;
    const save = { x: avEdit.x, y: avEdit.y };
    avEdit.x *= k; avEdit.y *= k;
    const { w, h, dx, dy } = avatarCrop(320);
    Object.assign(avEdit, save);
    const ctx = out.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(avEdit.img, dx, dy, w, h);
    let data = out.toDataURL('image/webp', 0.86);
    if (!data.startsWith('data:image/webp')) data = out.toDataURL('image/jpeg', 0.88); // Safari kann kein WebP erzeugen
    btn.disabled = true;
    try {
      const r = await postJSON('/api/me/avatar', { image: data });
      state.account.avatar_url = r.avatar_url;
      state.account.custom_avatar = true;
      $('#avatar-dialog').close();
      paintAvatars();
      toast(t('avatar.saved'));

    } catch (err) {
      toast(errMsg(err), true);
    } finally {
      btn.disabled = false;
    }
  }

  async function removeAvatar() {
    try {
      const r = await api('/api/me/avatar', { method: 'DELETE' });
      state.account.avatar_url = r.avatar_url;
      state.account.custom_avatar = false;
      paintAvatars();
      toast(t('avatar.removed'));
    } catch (err) { toast(errMsg(err), true); }
  }

  function bindAvatar() {
    $('#profile-avatar')?.addEventListener('click', openAvatarMenu);
    $('#avatar-change')?.addEventListener('click', openAvatarMenu);
    $('#avatar-camera')?.addEventListener('change', (e) => loadAvatarFile(e.target.files?.[0]));
    $('#avatar-menu')?.addEventListener('click', (e) => {
      const a = e.target.closest('[data-am]');
      if (a) {
        const what = a.dataset.am;
        $('#avatar-menu').close();
        if (what === 'gallery') openAvatarPicker();
        else if (what === 'camera') openAvatarPicker(true);
        else if (what === 'remove') removeAvatar();
        return;
      }
      const pr = e.target.closest('[data-am-preset]');
      if (pr) { savePreset(Number(pr.dataset.amPreset), pr); return; }
      if (e.target === e.currentTarget) e.currentTarget.close();
    });
    $('#avatar-remove')?.addEventListener('click', () => { if (confirm(t('avatar.removeConfirm'))) removeAvatar(); });
    $('#avatar-file')?.addEventListener('change', (e) => loadAvatarFile(e.target.files?.[0]));
    $('#avatar-zoom')?.addEventListener('input', (e) => { avEdit.zoom = Number(e.target.value); drawAvatarPreview(); });
    $('#avatar-save')?.addEventListener('click', saveAvatar);
    $('#avatar-other')?.addEventListener('click', () => openAvatarPicker());
    const c = $('#avatar-canvas');
    if (!c) return;
    // Verschieben mit Finger/Maus, Zoomen mit Mausrad oder zwei Fingern
    const pts = new Map();
    c.addEventListener('pointerdown', (e) => { c.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); avEdit.drag = { x: e.clientX, y: e.clientY, ox: avEdit.x, oy: avEdit.y, pinch: null }; });
    c.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId) || !avEdit.drag) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const scale = c.width / c.getBoundingClientRect().width;
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (!avEdit.drag.pinch) avEdit.drag.pinch = { dist, zoom: avEdit.zoom };
        avEdit.zoom = Math.max(1, Math.min(4, avEdit.drag.pinch.zoom * (dist / avEdit.drag.pinch.dist)));
        $('#avatar-zoom').value = String(avEdit.zoom);
      } else {
        avEdit.x = avEdit.drag.ox + (e.clientX - avEdit.drag.x) * scale;
        avEdit.y = avEdit.drag.oy + (e.clientY - avEdit.drag.y) * scale;
      }
      drawAvatarPreview();
    });
    const end = (e) => { pts.delete(e.pointerId); if (!pts.size) avEdit.drag = null; };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      avEdit.zoom = Math.max(1, Math.min(4, avEdit.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
      $('#avatar-zoom').value = String(avEdit.zoom);
      drawAvatarPreview();
    }, { passive: false });
    $('#avatar-dialog').addEventListener('close', () => { avEdit.img = null; });
  }

  // ================================================================ Festliche Effekte
  const FEST = {
    carnival: { deco: '🎭', hat: '🎭', emojis: ['🎭', '🎉', '🎊', '🥳', '🎈'], motion: 'burst', confetti: true },
    easter: { deco: '🐣', hat: '🐰', emojis: ['🥚', '🐣', '🐰', '🌷', '🥚'], motion: 'fall' },
    midsummer: { deco: '🌼', hat: '🌸', emojis: ['🌼', '🌸', '🍓', '🌿', '🌼'], motion: 'sway' },
    halloween: { deco: '🎃', hat: '🦇', emojis: ['🎃', '👻', '🦇', '🕸️', '🍬'], motion: 'fall' },
    christmas: { deco: '🎄', hat: '⭐', emojis: ['❄️', '🎄', '⭐', '🎁', '❄️'], motion: 'snow' },
    newyear: { deco: '🎆', hat: '🎩', emojis: ['🎆', '✨', '🥂', '🎇', '✨'], motion: 'burst', confetti: true },
    birthday: { deco: '🎂', hat: '🥳', emojis: ['🎈', '🎂', '🎉', '🎁', '🎈'], motion: 'rise', confetti: true },
  };
  function easterSunday(y) {
    const a = y % 19; const b = Math.floor(y / 100); const c = y % 100;
    const d = Math.floor(b / 4); const e = b % 4; const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    return new Date(y, month - 1, ((h + l - 7 * m + 114) % 31) + 1);
  }
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const dayNum = (d) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  function eventsForYear(y) {
    const E = easterSunday(y);
    let fri = new Date(y, 5, 19);
    while (fri.getDay() !== 5) fri = addDays(fri, 1);
    const list = [
      { key: 'carnival', start: addDays(E, -52), end: addDays(E, -47) },
      { key: 'easter', start: addDays(E, -2), end: addDays(E, 1) },
      { key: 'midsummer', start: fri, end: addDays(fri, 2) },
      { key: 'halloween', start: new Date(y, 9, 30), end: new Date(y, 9, 31) },
      { key: 'christmas', start: new Date(y, 11, 24), end: new Date(y, 11, 26) },
      { key: 'newyear', start: new Date(y, 11, 31), end: new Date(y + 1, 0, 1) },
    ];
    const b = state.account?.birthday;
    if (b) {
      const [, mm, dd] = b.split('-').map(Number);
      let day = dd;
      if (mm === 2 && dd === 29 && !(y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) day = 28;
      const bd = new Date(y, mm - 1, day);
      list.unshift({ key: 'birthday', start: bd, end: bd });
    }
    return list;
  }
  function activeEvent(date) {
    const n = dayNum(date);
    const hits = [...eventsForYear(date.getFullYear() - 1), ...eventsForYear(date.getFullYear())].filter((e) => n >= dayNum(e.start) && n <= dayNum(e.end));
    return (hits.find((e) => e.key === 'birthday') || hits[0])?.key || null;
  }
  function nextEvent(date) {
    const n = dayNum(date);
    return [...eventsForYear(date.getFullYear()), ...eventsForYear(date.getFullYear() + 1)].filter((e) => dayNum(e.start) > n).sort((a, b) => a.start - b.start)[0] || null;
  }
  const festive = { key: null };
  const festOn = () => Boolean(state.account) && state.account.festive !== false;
  function renderFestiveHint() {
    const el = $('#festive-hint');
    if (!el) return;
    if (!festOn()) { el.textContent = ''; return; }
    const date = T.effectiveDate();
    const ev = activeEvent(date);
    const nx = nextEvent(date);
    el.textContent = ev ? t('settings.festiveActive', { e: `${FEST[ev].deco} ${t(`fest.${ev}`)}` })
      : nx ? t('settings.festiveNext', { e: `${FEST[nx.key].deco} ${t(`fest.${nx.key}`)}`, d: longDate.format(nx.start) }) : '';
  }
  function clearFestive() { $$('.fest-deco').forEach((n) => n.remove()); $('#fest-ribbon').hidden = true; document.documentElement.dataset.fest = ''; }
  function decorateStatic() {
    const ev = festive.key;
    if (!ev) return;
    const f = FEST[ev];
    const wrap = $('.brand-logo-wrap');
    if (wrap && !$('.fest-deco', wrap)) wrap.insertAdjacentHTML('beforeend', `<span class="fest-deco fest-badge" aria-hidden="true">${f.deco}</span>`);
    $$('[data-fest-title]').forEach((h, i) => { if (!$('.fest-deco', h)) h.insertAdjacentHTML('beforeend', ` <span class="fest-deco fest-title" aria-hidden="true">${f.emojis[(i + 1) % f.emojis.length]}</span>`); });
    const av = $('#profile-avatar');
    if (av && !$('.fest-deco', av.parentElement)) av.insertAdjacentHTML('afterend', `<span class="fest-deco fest-hat" aria-hidden="true">${f.hat}</span>`);
    const el = $('#fest-ribbon');
    const dismissKey = `fest-dismiss-${ev}-${T.effectiveDate().getFullYear()}`;
    if (store.get(dismissKey)) { el.hidden = true; return; }
    el.className = `fest-ribbon fest-${ev}`;
    el.innerHTML = `<span class="fest-ribbon-icon" aria-hidden="true">${f.deco}</span><div><strong>${esc(t(`greet.${ev}`, { name: state.account?.username || '' }))}</strong><span>${esc(t(`greetTip.${ev}`))}</span></div>
      <button type="button" class="fest-close" data-fest-dismiss="${dismissKey}" aria-label="${esc(t('btn.close'))}">✕</button>`;
    el.hidden = false;
  }
  function decoratePanel(panel) {
    const ev = festive.key;
    if (!ev) return;
    const f = FEST[ev];
    if (panel === 'top') {
      const p1 = $('#podium .p1 .pimg-wrap');
      if (p1 && !$('.fest-deco', p1)) p1.insertAdjacentHTML('beforeend', `<span class="fest-deco fest-crown" aria-hidden="true">${f.hat}</span>`);
    } else if (panel === 'times') {
      const cell = $('#heatmap .heat-cell.peak');
      if (cell && !$('.fest-deco', cell)) cell.insertAdjacentHTML('beforeend', `<span class="fest-deco fest-cell" aria-hidden="true">${f.emojis[1]}</span>`);
    } else if (panel === 'history') {
      $$('.day-card').forEach((card) => {
        const evDay = activeEvent(parseDay(card.dataset.day));
        const title = $('.day-title', card);
        if (evDay && title && !$('.fest-deco', title)) title.insertAdjacentHTML('beforeend', ` <span class="fest-deco fest-title" aria-hidden="true">${FEST[evDay].deco}</span>`);
      });
    }
  }
  let lastBurst = 0;
  function burst(panel, force = false) {
    const ev = festive.key;
    if (!ev || reduceMotion) return;
    if (Date.now() - lastBurst < 1200) return;
    const key = `fest-burst-${ev}-${panel}`;
    if (!force && session.get(key)) return;
    session.set(key, '1');
    lastBurst = Date.now();
    const f = FEST[ev];
    const layer = $('#fx-layer');
    const count = window.innerWidth < 600 ? 14 : 22;
    const confettiColors = ['#ff5d8f', '#ffd23f', '#3ec5ff', '#7ae582', '#b892ff', '#ff8c42'];
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      const isConf = f.confetti && i % 3 === 0;
      p.className = `fx-p fx-${f.motion}${isConf ? ' fx-conf' : ''}`;
      if (isConf) p.style.background = confettiColors[i % confettiColors.length]; else p.textContent = f.emojis[i % f.emojis.length];
      p.style.setProperty('--x', `${rnd(4, 96)}vw`); p.style.setProperty('--dx', `${rnd(-18, 18)}vw`); p.style.setProperty('--dy', `${rnd(-45, -15)}vh`);
      p.style.setProperty('--rot', `${rnd(-260, 260)}deg`); p.style.setProperty('--dur', `${rnd(2.2, 3.6)}s`); p.style.setProperty('--delay', `${rnd(0, 0.7)}s`); p.style.setProperty('--size', `${rnd(18, 32)}px`);
      p.addEventListener('animationend', () => p.remove());
      setTimeout(() => p.remove(), 5500);
      layer.appendChild(p);
    }
  }
  function updateFestive({ burst: doBurst = false } = {}) {
    const ev = festOn() ? activeEvent(T.effectiveDate()) : null;
    if (ev !== festive.key) {
      clearFestive();
      festive.key = ev;
      document.documentElement.dataset.fest = ev || '';
      if (ev) { decorateStatic(); decoratePanel(state.panel); burst(state.panel, doBurst); }
      window.dispatchEvent(new CustomEvent('watchlfy:festive', { detail: ev }));
    } else if (ev) { decorateStatic(); if (doBurst) burst(state.panel, true); }
    renderFestiveHint();
  }
  function confetti(container = $('#fx-layer'), n = 36) {
    if (reduceMotion || !container) return;
    const bits = ['🍿', '🎟️', '⭐', '🍿', '🎬', '✨'];
    const rnd = (a, b) => a + Math.random() * (b - a);
    for (let i = 0; i < n; i++) {
      const p = document.createElement('span');
      p.className = 'fx-p fx-burst fx-pop';
      p.textContent = bits[i % bits.length];
      p.style.setProperty('--size', `${rnd(16, 28)}px`);
      p.style.setProperty('--x', `${rnd(4, 96)}%`); p.style.setProperty('--dx', `${rnd(-15, 15)}vw`); p.style.setProperty('--dy', `${rnd(-50, -20)}vh`);
      p.style.setProperty('--rot', `${rnd(-300, 300)}deg`); p.style.setProperty('--dur', `${rnd(1.8, 3)}s`); p.style.setProperty('--delay', `${rnd(0, 0.4)}s`);
      p.addEventListener('animationend', () => p.remove());
      setTimeout(() => p.remove(), 4500);
      container.appendChild(p);
    }
  }

  // ================================================================ „Neu in Watchlfy“
  const NEWS = Array.isArray(window.WatchlfyNews) ? window.WatchlfyNews : [];
  const newsKey = () => `news-seen-${state.account?.id}`;
  const L = (arr) => (Array.isArray(arr) ? arr[Math.max(0, I.LANGS.indexOf(I.lang))] || arr[1] || arr[0] : String(arr || ''));
  function unseenNews() {
    if (!NEWS.length || !state.account) return [];
    const seen = store.get(newsKey());
    if (!seen) {
      const fresh = state.account.created_at && Date.now() - new Date(state.account.created_at).getTime() < 2 * 864e5;
      if (fresh) { store.set(newsKey(), NEWS[0].id); return []; }
      return NEWS.slice(0, 3);
    }
    const i = NEWS.findIndex((n) => n.id === seen);
    return i < 0 ? NEWS.slice(0, 3) : NEWS.slice(0, i);
  }
  function maybeShowNews(delay = 1200) {
    setTimeout(() => {
      const list = unseenNews();
      if (!list.length) return;
      if ($$('dialog[open]').length) { setTimeout(() => maybeShowNews(0), 4000); return; }
      openNews(list);
    }, delay);
  }
  function openNews(list) {
    const all = list.flatMap((n) => n.items);
    const items = all.slice(0, 6);
    const date = list[0].date ? dateFmtYear.format(parseDay(list[0].date)) : '';
    $('#news-body').innerHTML = `${CLOSE_BTN()}
      <div class="news-hero" aria-hidden="true"><span class="news-spark s1">✦</span><span class="news-spark s2">✦</span><span class="news-spark s3">✧</span><span class="news-badge">🍿</span></div>
      <div class="news-head"><p class="news-kicker">${esc(t('news.kicker'))}${date ? ` · ${esc(date)}` : ''}</p><h2 id="news-title">${esc(t('news.title'))}</h2></div>
      <ul class="news-list">${items.map((it, k) => `<li style="--i:${k}"><span class="news-ico">${esc(it.icon || '✨')}</span><div><b>${esc(L(it.t))}</b><span>${esc(L(it.d))}</span></div>
        ${it.go ? `<button type="button" class="news-go" data-news-go="${esc(it.go)}" aria-label="${esc(t('news.try'))}: ${esc(L(it.t))}" title="${esc(t('news.try'))}">›</button>` : ''}</li>`).join('')}</ul>
      ${all.length > items.length ? `<p class="news-more">${esc(t('news.more', { n: all.length - items.length }))}</p>` : ''}
      <div class="news-foot"><button type="button" class="btn btn-primary" data-news-ok>${esc(t('news.ok'))}</button></div>`;
    const dlg = $('#news-dialog');
    if (!dlg.open) dlg.showModal();
  }
  function bindNews() {
    const dlg = $('#news-dialog');
    dlg.addEventListener('close', () => { if (NEWS[0]) store.set(newsKey(), NEWS[0].id); });
    dlg.addEventListener('click', (e) => {
      if (e.target.closest('[data-news-ok]')) { dlg.close(); return; }
      const go = e.target.closest('[data-news-go]');
      if (!go) return;
      dlg.close();
      const where = go.dataset.newsGo;
      if (where === 'import') openImport(null);
      else if (PANELS.includes(where)) showPanel(where);
    });
    $('#news-open').addEventListener('click', () => openNews(NEWS.slice(0, 4)));
  }

  // ================================================================ Navigation
  const BN_MAIN = ['overview', 'top', 'collection'];
  const BN_MORE = [
    ['history', '🕰️', 'nav.history'], ['times', '⏰', 'nav.times'], ['progress', '🎞️', 'nav.progress'], ['wrapped', '🎁', 'nav.wrapped'],
    ['friends', '👥', 'nav.friends'], ['profile', '👤', 'nav.profile'], ['admin', '🛠️', 'nav.admin'],
  ];
  function paintBottomNav() {
    const nav = $('#bottom-nav');
    const inMore = !BN_MAIN.includes(state.panel);
    $$('[data-bn]', nav).forEach((b) => {
      const on = b.dataset.bn === state.panel || (b.dataset.bn === 'more' && inMore);
      b.classList.toggle('on', on);
      b.setAttribute('aria-current', on ? 'page' : 'false');
    });
    const more = BN_MORE.find(([k]) => k === state.panel);
    $('.bn-more-label', nav).textContent = inMore && more ? t(more[2]) : t('nav.more');
  }
  function bindBottomNav() {
    const nav = $('#bottom-nav');
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('[data-bn]');
      if (!b) return;
      if (b.dataset.bn === 'import') { openImport(null); return; }
      if (b.dataset.bn === 'more') {
        const items = BN_MORE.filter(([k]) => k !== 'admin' || state.account?.is_admin);
        $('#more-grid').innerHTML = items.map(([k, ico, key], i) => `<button type="button" class="ms-item${k === state.panel ? ' on' : ''}" data-ms="${k}" style="--i:${i}"><span>${ico}</span><b>${esc(t(key))}</b></button>`).join('');
        $('#more-sheet').showModal();
        return;
      }
      if (b.dataset.bn === state.panel) { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
      showPanel(b.dataset.bn);
    });
    const sheet = $('#more-sheet');
    sheet.addEventListener('click', (e) => {
      const it = e.target.closest('[data-ms]');
      if (it) { sheet.close(); showPanel(it.dataset.ms); return; }
      if (e.target === sheet) sheet.close();
    });
    let y0 = null;
    sheet.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchmove', (e) => { if (y0 != null) { const dy = Math.max(0, e.touches[0].clientY - y0); sheet.style.transform = dy ? `translateY(${dy}px)` : ''; } }, { passive: true });
    sheet.addEventListener('touchend', (e) => { const dy = (e.changedTouches[0]?.clientY ?? y0) - (y0 ?? 0); sheet.style.transform = ''; y0 = null; if (dy > 80) sheet.close(); });
    document.addEventListener('focusin', (e) => { if (e.target.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=file]), textarea, select')) document.body.classList.add('kb-open'); });
    document.addEventListener('focusout', () => setTimeout(() => { if (!document.activeElement?.matches?.('input, textarea, select')) document.body.classList.remove('kb-open'); }, 50));
  }
  function setupTabs() {
    const tabs = $('#panel-tabs');
    const ink = document.createElement('span');
    ink.className = 'tab-ink';
    tabs.prepend(ink);
    const place = (animate) => {
      const btn = $(`button[data-panel="${state.panel}"]`, tabs);
      $$('button', tabs).forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
      if (!btn || btn.hidden) { ink.style.width = '0'; return; }
      ink.style.transition = animate ? '' : 'none';
      ink.style.height = `${btn.offsetHeight}px`;
      ink.style.transform = `translateY(${btn.offsetTop}px)`;
    };
    tabs.addEventListener('click', (e) => { const b = e.target.closest('button[data-panel]'); if (b) showPanel(b.dataset.panel); });
    window.addEventListener('resize', () => place(false));
    tabs.place = place;
  }
  const PANEL_TITLE = { overview: 'nav.overview', top: 'nav.top', times: 'nav.times', progress: 'nav.progress', history: 'nav.history', wrapped: 'nav.wrapped', friends: 'nav.friends', collection: 'nav.collection', admin: 'nav.admin', profile: 'nav.profile' };
  function greeting() {
    const h = new Date().getHours();
    const k = h < 5 ? 'night' : h < 11 ? 'morning' : h < 17 ? 'day' : h < 22 ? 'evening' : 'night';
    return t(`greet.${k}`, { name: state.account?.username || '' });
  }
  function paintPageHead() {
    $('#page-title').textContent = t(PANEL_TITLE[state.panel] || 'nav.overview');
    $('#page-kicker').textContent = state.panel === 'overview' ? greeting() : new Intl.DateTimeFormat(LOCALE, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  }

  function applyView() {
    if (state.panel === 'admin' && state.account && !state.account.is_admin) state.panel = 'overview';
    const isAdmin = state.panel === 'admin';
    const isProfile = state.panel === 'profile';
    const special = isAdmin || isProfile;
    const empty = !hasData() && DATA_PANELS.has(state.panel);
    $('#view-admin').hidden = !isAdmin;
    $('#view-profile').hidden = !isProfile;
    $('#profile-btn').classList.toggle('is-active', isProfile);
    $('#view-empty').hidden = special || !empty;
    $('#view-stats').hidden = special || empty;
    $$('#view-stats .panel').forEach((p) => { p.hidden = p.dataset.panel !== state.panel; });
    $('#range-bar').hidden = !RANGE_PANELS.has(state.panel) || empty;
    paintPageHead();
    placeHeroChrome();
    $('#panel-tabs').place?.(true);
    paintBottomNav();
    if (empty) $('#empty-services').innerHTML = servicesGrid(false);
    requestAnimationFrame(() => $$('.segmented').forEach((s) => s.realign?.()));
  }
  function showPanel(panel) {
    if (!PANELS.includes(panel)) return;
    const changed = panel !== state.panel;
    if (changed && !showPanel.inVT) {
      const order = [...$$('#panel-tabs [data-panel]')].map((b) => b.dataset.panel).concat(['profile']);
      const a = order.indexOf(state.panel); const b = order.indexOf(panel);
      smoothSwap(() => { showPanel.inVT = true; try { showPanel(panel); } finally { showPanel.inVT = false; } }, a < 0 || b < 0 ? 'fade' : b > a ? 'fwd' : 'back');
      return;
    }
    if (changed) window.dispatchEvent(new CustomEvent('watchlfy:leave', { detail: state.panel }));
    state.panel = panel;
    session.set('panel', panel);
    applyView();
    if (changed) window.scrollTo({ top: 0, behavior: 'auto' });
    renderPanel(panel);
    burst(panel);
  }

  // Externe Bereiche (extras.js) melden sich hier an
  const external = {};
  const showSkeleton = (sel) => { const el = $(sel); if (el && !el.innerHTML.trim()) el.innerHTML = '<div class="skeleton-block"></div>'; };
  async function renderPanel(panel) {
    try {
      if (panel === 'profile') return renderProfile();
      if (panel === 'admin') return loadAdmin();
      if (external[panel]) return await external[panel]();
      if (!hasData()) return;
      if (panel === 'overview') { if (!state.dashboard) await loadDashboard(); return renderOverview(); }
      if (panel === 'top') { if (!state.top || state.top.kind !== state.topKind) await loadTop(); return renderTop(); }
      if (panel === 'times') { if (!state.times) await loadTimes(); return renderTimes(); }
      if (panel === 'progress') { showSkeleton('#progress-list'); if (!state.progress) await loadProgress(); return renderProgress(); }
      if (panel === 'history') { if (!hist.items) await loadHistory(true); return renderHistory(); }
    } catch (err) {
      console.error(err);
      toast(errMsg(err), true);
    }
  }

  // ================================================================ Admin
  async function loadAdmin() {
    if (!state.account?.is_admin) return;
    renderThemeSettings();
    $('#event-quick').innerHTML = Object.entries(FEST).map(([key, f]) => `<button type="button" class="btn btn-ghost btn-xs" data-event-test="${key}">${f.deco} ${esc(t(`fest.${key}`))}</button>`).join('');
    try {
      const [acc, sys, backup] = await Promise.all([api('/api/admin/accounts'), api('/api/admin/system'), api('/api/admin/backup/info')]);
      const active = acc.accounts.filter((a) => a.last_seen_at && Date.now() - new Date(a.last_seen_at) < 7 * 864e5).length;
      const views = acc.accounts.reduce((a, u) => a + (u.views || 0), 0);
      $('#admin-stats').innerHTML = [
        ['admin.accounts', acc.accounts.length], ['admin.active', active], ['admin.views', views], ['admin.titles', sys.catalog.titles],
      ].map(([k, v]) => `<article class="card kpi"><span class="kpi-label">${esc(t(k))}</span><strong class="kpi-value">${fmt(v)}</strong></article>`).join('');
      $('#admin-users').innerHTML = acc.accounts.map((u) => `<li class="user-row">
        <div class="user-av">${u.avatar_url ? `<img src="${esc(u.avatar_url)}" alt="" />` : `<span>${esc((u.username[0] || '?').toUpperCase())}</span>`}</div>
        <div class="user-main"><b>${esc(u.username)}</b>${u.is_admin ? ` <span class="tag tag-admin">${esc(t('role.admin'))}</span>` : ''}
          <small>${esc(t('admin.userLine', { v: fmt(u.views), s: (u.sources || []).map(serviceName).join(', ') || '–', l: u.last_login_at ? relTime(u.last_login_at) : '–' }))}${u.trakt_username ? ` · Trakt: ${esc(u.trakt_username)}` : ''}</small></div>
        <div class="user-actions">${u.id === state.account.id ? '' : `
          <button type="button" class="btn btn-ghost btn-xs" data-admin-act="admin" data-id="${u.id}" data-on="${u.is_admin ? 0 : 1}">${esc(t(u.is_admin ? 'admin.revoke' : 'admin.make'))}</button>
          <button type="button" class="btn btn-ghost btn-xs" data-admin-act="reset" data-id="${u.id}">${esc(t('admin.resetPw'))}</button>
          <button type="button" class="btn btn-ghost btn-xs btn-danger" data-admin-act="delete" data-id="${u.id}" data-name="${esc(u.username)}">${esc(t('btn.delete'))}</button>`}</div></li>`).join('');
      $('#admin-logins').innerHTML = acc.logins.slice(0, 20).map((l) => `<li><b>${esc(l.username)}</b><span>${esc(dateTimeFmt.format(new Date(l.at)))}</span><small class="muted">${esc((l.user_agent || '').slice(0, 60))}</small></li>`).join('') || `<li class="empty">–</li>`;
      const c = sys.catalog;
      $('#admin-system').innerHTML = [
        ['admin.db', `${sys.database.size} · ${sys.database.version}`], ['admin.catalog', t('admin.catalogLine', { t: fmt(c.titles), e: fmt(c.episodes), p: fmt(c.aliases_pending), u: fmt(c.aliases_unsure) })],
        ['TMDB', sys.config.tmdb ? '✓' : t('admin.missing', { v: 'TMDB_API_KEY' })], ['Trakt', sys.config.trakt ? '✓' : t('admin.missing', { v: 'TRAKT_CLIENT_ID/SECRET' })],
        ['admin.sync', t('admin.syncLine', { n: sys.config.syncIntervalMinutes })], ['admin.tz', sys.config.timezone],
      ].map(([k, v]) => `<dt>${esc(I.D[k] ? t(k) : k)}</dt><dd>${esc(v)}</dd>`).join('');
      $('#admin-errors').innerHTML = sys.errors.map((e) => `<li><b>${esc(e.username || '–')}</b><span>${esc(e.job)} · ${esc(dateTimeFmt.format(new Date(e.started_at)))}</span><small class="muted">${esc(e.message || '')}</small></li>`).join('') || `<li class="empty">✓ ${esc(t('admin.noErrors'))}</li>`;
      $('#backup-status').textContent = backup.last ? t('backup.last', { d: dateTimeFmt.format(new Date(backup.last)) }) : t('backup.never');
      $('#free-shop-switch').setAttribute('aria-checked', String(Boolean(state.status?.account?.free_shop || window.Watchlfy?.freeShop)));
    } catch (err) { toast(errMsg(err), true); }
  }
  async function adminAction(b) {
    const id = b.dataset.id;
    try {
      if (b.dataset.adminAct === 'admin') await postJSON(`/api/admin/accounts/${id}/admin`, { admin: b.dataset.on === '1' });
      else if (b.dataset.adminAct === 'reset') {
        if (!confirm(t('admin.resetConfirm'))) return;
        const r = await postJSON(`/api/admin/accounts/${id}/reset-password`, {});
        prompt(t('admin.newPassword', { u: r.username }), r.password);
      } else if (b.dataset.adminAct === 'delete') {
        if (!confirm(t('admin.deleteConfirm', { u: b.dataset.name }))) return;
        await api(`/api/admin/accounts/${id}`, { method: 'DELETE' });
      }
      loadAdmin();
    } catch (err) { toast(errMsg(err), true); }
  }
  async function restoreFromFile(file) {
    if (!file || !confirm(t('backup.restoreConfirm'))) return;
    const log = $('#restore-log');
    log.innerHTML = `<li>${esc(t('backup.restoring'))}</li>`;
    try {
      const r = await api('/api/admin/restore', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file });
      log.innerHTML = Object.entries(r.tables).map(([k, v]) => `<li><b>${esc(k)}</b> ${fmt(v.inserted)} / ${fmt(v.rows)}</li>`).join('') || `<li>${esc(t('backup.nothing'))}</li>`;
    } catch (err) { log.innerHTML = `<li class="error">${esc(errMsg(err))}</li>`; }
  }

  // ================================================================ Start & Ereignisse
  function bindGlobal() {
    document.addEventListener('click', async (e) => {
      const go = e.target.closest('[data-goto]');
      if (go) {
        e.preventDefault();
        if (go.dataset.topKind) { state.topKind = go.dataset.topKind; store.set('topKind', state.topKind); }
        showPanel(go.dataset.goto);
        return;
      }
      const corr = e.target.closest('[data-correct]');
      if (corr) { openCorrect(corr.dataset.correct, corr.dataset.correctName, corr.dataset.correctKind); return; }
      const pick = e.target.closest('[data-pick-id]');
      if (pick) { pickCorrect(pick.dataset.pickKind, Number(pick.dataset.pickId)); return; }
      if (e.target.closest('[data-correct-none]')) { pickCorrect(null, null); return; }
      const tid = e.target.closest('[data-title-id]');
      if (tid && !e.target.closest('dialog#detail-dialog .detail-views')) { openDetail({ id: tid.dataset.titleId }, tid.closest('#detail-dialog') ? null : tid); return; }
      const tkey = e.target.closest('[data-title-key]');
      if (tkey) { openDetail({ key: tkey.dataset.titleKey }, tkey); return; }
      const fd = e.target.closest('[data-fest-dismiss]');
      if (fd) { store.set(fd.dataset.festDismiss, '1'); $('#fest-ribbon').hidden = true; return; }
      if (e.target.closest('[data-open-review]')) { showPanel('profile'); setTimeout(() => $('#review-card').scrollIntoView({ behavior: 'smooth' }), 300); return; }
      if (e.target.closest('[data-dismiss-review]')) { session.set('tmdb-review-dismiss', '1'); renderNotices(); return; }
      const ui = e.target.closest('[data-undo-import]');
      if (ui) {
        if (!confirm(t('imports.undoConfirm'))) return;
        try { const r = await api(`/api/imports/${ui.dataset.undoImport}`, { method: 'DELETE' }); toast(t('imports.removed', { n: fmt(r.removed) })); invalidate(); await loadStatus(); renderProfile(); } catch (err) { toast(errMsg(err), true); }
        return;
      }
      const ds = e.target.closest('[data-delete-source]');
      if (ds) {
        if (!confirm(t('imports.deleteSourceConfirm', { s: serviceName(ds.dataset.deleteSource) }))) return;
        try { const r = await api(`/api/sources/${ds.dataset.deleteSource}`, { method: 'DELETE' }); toast(t('imports.removed', { n: fmt(r.removed) })); invalidate(); await loadStatus(); renderProfile(); } catch (err) { toast(errMsg(err), true); }
        return;
      }
      if (e.target.closest('[data-trakt-sync]')) {
        try { const r = await postJSON('/api/trakt/sync', {}); toast(t('trakt.synced', { n: fmt(r.added || 0) })); invalidate(); await loadStatus(); renderProfile(); } catch (err) { toast(errMsg(err), true); }
        return;
      }
      if (e.target.closest('[data-trakt-disconnect]')) {
        if (!confirm(t('trakt.disconnectConfirm'))) return;
        try { await postJSON('/api/trakt/disconnect', {}); await loadStatus(); renderProfile(); } catch (err) { toast(errMsg(err), true); }
        return;
      }
      const tm = e.target.closest('[data-theme-mode]');
      if (tm) { chooseTheme(tm.dataset.themeMode); return; }
      const lb = e.target.closest('#lang-picker [data-lang]');
      if (lb) { chooseLang(lb.dataset.lang); return; }
      const aa = e.target.closest('[data-admin-act]');
      if (aa) { adminAction(aa); return; }
      const et = e.target.closest('[data-event-test]');
      if (et) {
        const key = et.dataset.eventTest;
        if (key === 'birthday' && !state.account?.birthday) { toast(t('admin.noBirthday'), true); return; }
        const ev = eventsForYear(new Date().getFullYear()).find((x) => x.key === key);
        if (ev) { T.setSeasonDate(isoDay(ev.start)); renderThemeSettings(); updateFestive({ burst: true }); }
      }
    });
    $('#profile-btn').addEventListener('click', () => showPanel(state.panel === 'profile' ? 'overview' : 'profile'));
    $('#privacy-accept').addEventListener('click', async () => { try { await postJSON('/api/me/privacy', {}); state.account.privacy_accepted = true; renderNotices(); } catch (err) { toast(errMsg(err), true); } });
    $('#glass-switch').addEventListener('click', async () => { const on = !T.glass(); smoothSwap(() => T.setGlass(on), 'fade'); renderThemeSettings(); await saveSettings({ glass: on }); });
    $('#festive-switch').addEventListener('click', async () => { state.account.festive = !festOn(); renderThemeSettings(); updateFestive({ burst: true }); await saveSettings({ festive: state.account.festive }); });
    $('#birthday-save').addEventListener('click', async () => { const v = $('#birthday-input').value; if (await saveSettings({ birthday: v || null })) { state.account.birthday = v || null; toast(t('account.birthdaySaved')); updateFestive({ burst: true }); } });
    $('#birthday-clear').addEventListener('click', async () => { if (await saveSettings({ birthday: null })) { state.account.birthday = null; $('#birthday-input').value = ''; updateFestive(); } });
    $('[data-action="password"]').addEventListener('click', changePassword);
    $('[data-action="delete"]').addEventListener('click', deleteAccount);
    $('#season-date').addEventListener('change', (e) => { T.setSeasonDate(e.target.value || null); renderThemeSettings(); updateFestive({ burst: true }); });
    $('#season-reset').addEventListener('click', () => { T.setSeasonDate(null); renderThemeSettings(); updateFestive(); });
    $('#restore-file').addEventListener('change', (e) => restoreFromFile(e.target.files?.[0]));
    segmented($('#range-control'), 'range', state.range, (r) => {
      state.range = r; store.set('range', r);
      state.dashboard = null; state.top = null; state.times = null;
      renderPanel(state.panel);
    });
    segmented($('#top-kind'), 'kind', state.topKind, (k) => { state.topKind = k; store.set('topKind', k); renderPanel('top'); });
    segmented($('#progress-filter'), 'filter', state.progressFilter, (f) => { state.progressFilter = f; renderProgress(); });
    // Nach Trakt-OAuth zurück
    const q = new URLSearchParams(location.search);
    if (q.get('trakt')) {
      toast(q.get('trakt') === 'connected' ? t('trakt.connected') : t('trakt.failed', { e: q.get('trakt') }), q.get('trakt') !== 'connected');
      history.replaceState(null, '', '/');
      if (q.get('trakt') === 'connected') { state.panel = 'profile'; }
    }
    if (q.get('welcome')) { history.replaceState(null, '', '/'); setTimeout(() => { if (!hasData()) openImport(null); }, 900); }
  }

  // Für extras.js
  window.Watchlfy = {
    api, postJSON, t, tn, esc, fmt, nf1, dur, toast, errMsg, state, $, $$, poster, tmdbImg, placeholderPoster, initials, hashHue,
    showPanel, renderPanel, openDetail, confetti, CLOSE_BTN, L, I, LOCALE, reduceMotion, store, session, segmented, upsertChart,
    COLORS, accentA, baseScales, serviceName, serviceDot, SERVICES, dateFmtYear, dateFmt, monthFmt, timeFmt, longDate, parseDay, isoDay,
    relTime, hourRange, DAYS, DAYS_LONG, regionName, smoothSwap, festiveKey: () => festive.key, FEST, invalidate, hasData, loadStatus,
    register(panel, fn) { external[panel] = fn; if (state.panel === panel && state.account) renderPanel(panel); },
  };

  function bindAppbar() {
    const bar = $('#appbar');
    const setH = () => document.documentElement.style.setProperty('--appbar-h', `${bar.offsetHeight}px`);
    new ResizeObserver(setH).observe(bar);
    setH();
    const upd = () => bar.classList.toggle('scrolled', window.scrollY > 12);
    window.addEventListener('scroll', upd, { passive: true });
    upd();
  }

  function playLeader() {
    const el = $('#leader');
    if (!el || reduceMotion || navigator.webdriver || session.get('leader')) return;
    session.set('leader', '1');
    el.hidden = false;
    const num = $('.leader-num', el);
    let n = 3;
    const tick = setInterval(() => {
      n -= 1;
      if (n > 0) { num.textContent = String(n); num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop'); return; }
      clearInterval(tick);
      el.classList.add('done');
      setTimeout(() => { el.hidden = true; }, 600);
    }, 420);
  }

  async function init() {
    playLeader();
    I.apply();
    bindAppbar();
    bindHero();
    setupTabs();
    bindBottomNav();
    bindGlobal();
    bindImport();
    bindHistory();
    bindHeatTooltip();
    bindAvatar();
    bindNews();
    try { await loadStatus(); } catch (err) { toast(errMsg(err), true); return; }
    if (window.Chart) setupChartDefaults(); else window.addEventListener('load', setupChartDefaults);
    applyView();
    await renderPanel(state.panel);
    watchTmdb();
    document.body.classList.add('ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
