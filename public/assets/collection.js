/* Watchlfy – Sammlung: Holo-Lounge mit schwebenden Postern, OLED-Fernseher und gläsernem Medienregal, begehbare Retro-Videothek, Vorführraum, Kinokasse (Filmmeter & Goldtickets), Geschenke. */
(() => {
  'use strict';
  const W = window.Watchlfy;
  if (!W) return;
  const { api, postJSON, t, tn, esc, fmt, toast, errMsg, $, $$, poster, tmdbImg, reduceMotion, confetti, CLOSE_BTN, store, session } = W;

  const CUR = ['meters', 'tickets'];
  const RAR = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const col = { data: null, tab: session.get('colTab') || 'shelf', entered: false, round: null, ch: Number(session.get('tvCh') || 0) };

  // ---------------------------------------------------------------- Bausteine
  /** Filmmeter (aufgespulte Rolle) oder Goldticket. */
  const coin = (cur, n, cls = '') => `<span class="coin coin-${cur} ${cls}" title="${esc(t(`cur.${cur}`))}"><i aria-hidden="true"></i><b>${fmt(n)}</b><small aria-hidden="true">${esc(t(`cur.${cur}Short`))}</small><span class="sr-only">${esc(t(`cur.${cur}`))}</span></span>`;
  const price = (p, free = false) => (free ? `<span class="price-tag free">${esc(t('shop.free'))}</span>` : `<span class="price-tag">${coin(p.cur, p.amount)}</span>`);
  const costHtml = (r) => CUR.filter((x) => r[x]).map((x) => coin(x, r[x])).join('') || '0';
  const balanceHtml = (b) => `<div class="balance" aria-label="${esc(t('notes.title'))}">${CUR.map((x) => coin(x, b[x])).join('')}</div>`;

  /** DVD-/Blu-ray-Hülle oder Filmplakat. */
  function caseHtml(it, { size = '', tag = 'div', attrs = '' } = {}) {
    const art = poster(it.poster_path, it.name, size === 'lg' ? 'w500' : 'w342');
    if (it.format === 'poster') {
      return `<${tag} class="frame r-${it.rarity} ed-${it.edition} ${size}" ${attrs} style="--hue:${it.hue}"><span class="frame-inner">${art}${it.edition === 'signed' ? `<span class="sig" aria-hidden="true">${esc(sigName(it.name))}</span>` : ''}${it.rarity === 'mythic' ? '<span class="holo" aria-hidden="true"></span>' : ''}</span></${tag}>`;
    }
    return `<${tag} class="case f-${it.format} r-${it.rarity} ed-${it.edition} ${size}" ${attrs} style="--hue:${it.hue}">
      <span class="case-band">${it.format === 'bluray' ? 'BLU-RAY' : 'DVD'}</span>
      <span class="case-art">${art}</span>
      ${it.edition === 'steelbook' ? '<span class="steel" aria-hidden="true"></span>' : ''}
      ${it.edition === 'collector' ? `<span class="collector" aria-hidden="true">${esc(t('ed.collectorShort'))}</span>` : ''}
      ${it.edition === 'signed' ? `<span class="sig" aria-hidden="true">${esc(sigName(it.name))}</span>` : ''}
      ${it.rarity === 'mythic' ? '<span class="holo" aria-hidden="true"></span>' : ''}
      <span class="case-shine" aria-hidden="true"></span>
    </${tag}>`;
  }
  const sigName = (name) => String(name).split(/[\s:]+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase() + w.slice(1, 6)).join(' ');
  /** Warum ist das Stück so selten? Bekanntheit, Bewertung, Einspielergebnis (aus TMDB). */
  const usd = new Intl.NumberFormat(W.LOCALE, { notation: 'compact', style: 'currency', currency: 'USD', maximumFractionDigits: 1 });
  const factorsHtml = (it) => {
    const f = it.factors;
    if (!f) return `<p class="rar-why muted small">${esc(t('rar.unknown'))}</p>`;
    const chip = (ico, label, val) => `<span class="rar-chip"><i aria-hidden="true">${ico}</i><b>${esc(val)}</b><small>${esc(label)}</small></span>`;
    return `<div class="rar-factors">
        ${chip('◎', t('rar.fame'), `${f.fame} %`)}
        ${f.rating ? chip('★', t('rar.rating', { n: fmt(f.votes) }), String(f.rating).replace('.', W.LOCALE.startsWith('en') ? '.' : ',')) : ''}
        ${f.revenue ? chip('$', t('rar.revenue'), usd.format(f.revenue)) : ''}
      </div>
      <div class="rar-meter" style="--s:${it.score ?? 0}" aria-label="${esc(t('rar.score', { n: it.score ?? 0 }))}"><i></i><span>${esc(t('rar.score', { n: it.score ?? 0 }))}</span></div>
      <p class="rar-why muted small">${esc(t('rar.why'))}</p>`;
  };
  const rarLabel = (r) => `<span class="rar rar-${r}">${esc(t(`rar.${r}`))}</span>`;
  const itemTitle = (it) => `${esc(it.name)}${it.year ? ` <small>(${it.year})</small>` : ''}`;
  const fmtLabel = (it) => t(`fmt.${it.format}`) + (it.format !== 'poster' ? ` · ${t(it.kind === 'movie' || (!it.kind && it.format !== 'poster') ? 'kind.movie' : 'kind.tv')}` : '');

  // ---------------------------------------------------------------- Laden & Rendern
  async function load() {
    col.data = await api('/api/collection');
    if (col.data.fresh?.length) noteToast(col.data.fresh);
    W.freeShop = col.data.freeShop;
    renderTeaser();
    placeGift();
  }

  function render() {
    const d = col.data;
    const el = $('#collection');
    if (!d) return;
    const tabs = ['shelf', 'store', 'screening', 'notes'];
    el.innerHTML = `
      <section class="card col-head">
        <div><h2 data-fest-title>${esc(t('col.title'))}</h2><p class="muted small">${esc(tn('col.sub', d.items.length, { n: d.items.length }))}</p></div>
        ${balanceHtml(d.balance)}
      </section>
      <div class="segmented col-tabs" id="col-tabs" role="tablist">${tabs.map((x) => `<button role="tab" data-coltab="${x}">${esc(t(`col.tab.${x}`))}</button>`).join('')}</div>
      <div id="col-body"></div>`;
    W.segmented($('#col-tabs'), 'coltab', col.tab, (x) => { col.tab = x; session.set('colTab', x); W.smoothSwap(renderBody, 'fade'); });
    renderBody();
  }

  function renderBody() {
    const body = $('#col-body');
    if (!body) return;
    if (col.tab === 'store') body.innerHTML = storeHtml();
    else if (col.tab === 'screening') body.innerHTML = screeningHtml();
    else if (col.tab === 'notes') body.innerHTML = notesHtml();
    else body.innerHTML = shelfHtml(col.data.items, { channels: col.data.channels || [] });
    if (col.tab === 'screening' && col.data.session && !col.data.session.done) bindScreeningImage();
  }

  // ---------------------------------------------------------------- Holo-Lounge: schwebende Hologramm-Poster, OLED-Fernseher, gläsernes Medienregal
  /** Hülle als 3D-Box im Regal (Cover vorn, Rücken seitlich). */
  const box3d = (it, k) => `<button type="button" class="box3d f-${it.format} r-${it.rarity}" data-own="${esc(it.id)}" style="--hue:${it.hue};--i:${k}" aria-label="${esc(`${it.name} – ${t(`fmt.${it.format}`)}`)}">
      <span class="box-front">${poster(it.poster_path, it.name, 'w185')}<span class="box-band">${it.format === 'bluray' ? 'BLU-RAY' : 'DVD'}</span>${it.rarity !== 'common' ? '<span class="box-gem" aria-hidden="true"></span>' : ''}</span>
      <span class="box-side" aria-hidden="true"><span>${esc(it.name)}</span></span>
      <span class="box-top" aria-hidden="true"></span>
    </button>`;

  /** Leerer Platz: Hologramm im Standby (Drahtgitter, Scan-Strahl). */
  const holoSlot = (k, label = '') => `<span class="holo-slot" style="--i:${k}" aria-hidden="true"><i class="slot-scan"></i><b>+</b>${label ? `<small>${esc(label)}</small>` : ''}</span>`;

  function tvHtml(channels) {
    if (!channels.length) {
      return `<div class="oled standby" data-tv>
        <div class="oled-panel"><div class="oled-screen"><span class="standby-ring" aria-hidden="true"></span><p class="oled-standby">${esc(t('tv.noSignal'))}</p></div></div>
        ${tvControls(0)}<span class="oled-stand" aria-hidden="true"></span></div>`;
    }
    const i = ((col.ch % channels.length) + channels.length) % channels.length;
    const c = channels[i];
    const img = tmdbImg(c.backdrop_path, 'w780') || tmdbImg(c.poster_path, 'w500');
    return `<div class="oled" data-tv>
      <div class="oled-ambi" aria-hidden="true">${img ? `<img src="${img}" alt="" decoding="async" />` : ''}</div>
      <div class="oled-panel">
        <div class="oled-screen" data-title-id="${c.id}" role="button" tabindex="0" aria-label="${esc(t('tv.open', { n: c.name }))}">
          ${img ? `<img class="poster-img oled-img" src="${img}" alt="" decoding="async" data-ph="${esc(c.name)}" />` : ''}
          <span class="oled-hud"><b>CH ${String(i + 1).padStart(2, '0')}</b><span>${esc(t(c.kind === 'movie' ? 'kind.movie' : 'kind.tv'))}</span></span>
          <span class="oled-title"><b>${esc(c.name)}</b>${c.year ? `<small>${c.year}</small>` : ''}</span>
          <span class="oled-progress" aria-hidden="true"><i style="width:${((i + 1) / channels.length) * 100}%"></i></span>
        </div>
      </div>
      ${tvControls(channels.length, i)}
      <span class="oled-stand" aria-hidden="true"></span>
    </div>`;
  }
  const tvControls = (n, i = 0) => `<div class="oled-ctrl">
      <button type="button" class="oled-btn" data-tv-zap="-1" ${n > 1 ? '' : 'disabled'} aria-label="${esc(t('nav.prev'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button>
      <span class="oled-count" aria-live="polite">${n ? `${String(i + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}` : '— / —'}</span>
      <button type="button" class="oled-btn" data-tv-zap="1" ${n > 1 ? '' : 'disabled'} aria-label="${esc(t('nav.next'))}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button>
    </div>`;

  function shelfHtml(items, { readonly = false, channels = [] } = {}) {
    const discs = items.filter((i) => i.format !== 'poster');
    const posters = items.filter((i) => i.format === 'poster');
    const n = posters.length;
    const wall = n
      ? `<div class="holo-wall">${posters.map((it, k) => {
          const pos = n > 1 ? (k / (n - 1)) * 2 - 1 : 0; // −1 … 1 von links nach rechts → gebogene Wand
          return `<div class="holo" style="--i:${k};--pos:${pos.toFixed(3)}"><span class="holo-beam" aria-hidden="true"></span>${caseHtml(it, { tag: 'button', attrs: `type="button" data-own="${esc(it.id)}" aria-label="${esc(it.name)}"` })}</div>`;
        }).join('')}</div>`
      : `<div class="holo-wall is-empty">${[0, 1, 2].map((k) => holoSlot(k, k === 1 ? t(readonly ? 'col.friendEmpty' : 'col.noPosters') : '')).join('')}</div>`;
    const rows = [];
    for (let i = 0; i < discs.length; i += 12) rows.push(discs.slice(i, i + 12));
    return `<section class="lounge${items.length ? '' : ' is-empty'}" data-lounge>
      <span class="lounge-sky" aria-hidden="true"></span>
      <span class="lounge-led" aria-hidden="true"></span>
      <span class="lounge-floor" aria-hidden="true"></span>
      <h3 class="sr-only">${esc(t('col.gallery'))}</h3>
      ${wall}
      <div class="media-unit">
        ${readonly ? '' : tvHtml(channels)}
        <div class="rack${discs.length ? '' : ' is-empty'}">
          <h3 class="sr-only">${esc(t('col.wall'))}</h3>
          ${discs.length ? rows.map((r, ri) => `<div class="rack-row">${r.map((it, k) => box3d(it, k + ri * 12)).join('')}</div>`).join('')
            : `<div class="rack-row">${[0, 1, 2, 3].map((k) => '<span class="box-ghost" style="--i:' + k + '" aria-hidden="true"></span>').join('')}<p class="rack-empty">${esc(t(readonly ? 'col.friendEmpty' : 'col.noDiscs'))}</p></div>`}
          <span class="rack-glass" aria-hidden="true"></span>
        </div>
      </div>
      <p class="lounge-sum">${esc(tn('col.wallSub', discs.length, { n: discs.length }))} · ${esc(tn('col.gallerySub', posters.length, { n: posters.length }))}</p>
      ${!readonly && !items.length ? `<div class="lounge-cta"><p class="muted">${esc(t('col.emptyText'))}</p><button type="button" class="btn btn-primary" data-coltab-go="store">${esc(t('col.toStore'))}</button></div>` : ''}
    </section>`;
  }

  function zapTv(dir) {
    const ch = col.data?.channels || [];
    if (ch.length < 2) return;
    col.ch = (col.ch + dir + ch.length) % ch.length;
    session.set('tvCh', String(col.ch));
    const tv = $('[data-tv]');
    if (!tv) return;
    tv.outerHTML = tvHtml(ch);
    const fresh = $('[data-tv]');
    if (fresh && !reduceMotion) { fresh.classList.add('zap'); fresh.style.setProperty('--dir', dir > 0 ? '1' : '-1'); }
  }

  // Zeiger bewegt die gebogene Hologramm-Wand leicht im Raum (Parallaxe)
  document.addEventListener('pointermove', (e) => {
    const l = e.target.closest?.('[data-lounge]');
    if (!l || reduceMotion || e.pointerType === 'touch') return;
    const r = l.getBoundingClientRect();
    l.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    l.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  }, { passive: true });

  function openOwned(id, list = col.data.items, readonly = false) {
    const it = list.find((x) => x.id === id);
    if (!it) return;
    const next = RAR[RAR.indexOf(it.rarity) + 1];
    const cost = next ? col.data?.refineCosts?.[next] : null;
    $('#item-body').innerHTML = `${CLOSE_BTN()}
      <div class="item-stage lift">${caseHtml(it, { size: 'lg' })}</div>
      <h2 id="item-title">${itemTitle(it)}</h2>
      <p class="item-meta">${rarLabel(it.rarity)} · ${esc(t(`ed.${it.edition}`))} · ${esc(t(`fmt.${it.format}`))}</p>
      <p class="muted small">${esc(t(`edd.${it.edition}`))}</p>
      ${factorsHtml(it)}
      <div class="item-actions">
        ${it.title_id ? `<button type="button" class="btn btn-ghost" data-title-id="${it.title_id}">ℹ️ ${esc(t('col.details'))}</button>` : ''}
        ${!readonly && next ? `<button type="button" class="btn btn-primary" data-refine="${esc(it.id)}">✨ ${esc(t('scr.refineTo', { r: t(`rar.${next}`) }))} · ${costHtml(cost)}</button>` : ''}
      </div>`;
    $('#item-dialog').showModal();
  }

  // ---------------------------------------------------------------- Videothek (begehbar)
  function decoHtml() {
    const ev = W.festiveKey();
    const D = { christmas: ['🎄', '⭐', '🎁', '❄️'], halloween: ['🎃', '🦇', '🕸️', '👻'], easter: ['🐣', '🌷', '🥚', '🐰'], newyear: ['🎆', '✨', '🥂', '🎇'], carnival: ['🎭', '🎈', '🎊', '🥳'], midsummer: ['🌼', '🌸', '🍓', '🌿'], birthday: ['🎈', '🎂', '🎁', '🥳'] }[ev];
    if (!D) return '';
    return `<div class="store-garland fest-deco" aria-hidden="true">${Array.from({ length: 14 }, (_, i) => `<span style="--i:${i}">${D[i % D.length]}</span>`).join('')}</div>`;
  }

  function storeHtml() {
    const d = col.data;
    const sh = d.shop;
    const free = d.freeShop;
    if (!sh.poolSize) return `<section class="card"><p class="empty">${esc(t('shop.noPool'))}</p></section>`;
    if (!col.entered) {
      return `<section class="store-front${W.festiveKey() ? ` fest-${W.festiveKey()}` : ''}">
        ${decoHtml()}
        <div class="sf-sign" aria-hidden="true"><span>VIDEO</span><b>THEK</b></div>
        <div class="sf-windows" aria-hidden="true">${Object.values(sh.items).flat().slice(0, 3).map((it) => `<div class="sf-window">${poster(it.poster_path, it.name, 'w185')}</div>`).join('')}</div>
        <button type="button" class="sf-door" data-store-enter aria-label="${esc(t('shop.enter'))}"><span class="door-l"></span><span class="door-r"></span><span class="door-sign">${esc(t('shop.open'))}</span></button>
        <p class="sf-hint">${esc(t('shop.daily'))} · ${esc(t('shop.restock', { t: countdown(d.nextDay) }))}</p>
        <button type="button" class="btn btn-primary sf-enter" data-store-enter>🚪 ${esc(t('shop.enter'))}</button>
      </section>`;
    }
    const shelf = (key, list) => `
      <div class="st-shelf">
        <h3>${esc(t(`shop.shelf.${key}`))}</h3>
        <div class="st-row">${list.map((it, i) => `<button type="button" class="st-item${it.owned ? ' owned' : ''}" data-shop="${esc(it.id)}" style="--i:${i}" aria-label="${esc(`${it.name} – ${t(`rar.${it.rarity}`)}`)}">
            ${caseHtml(it)}
            ${it.discover ? `<span class="new-tag">${esc(t('shop.discover'))}</span>` : ''}
            ${it.owned ? `<span class="owned-tag">✓</span>` : price(it.price, free)}
          </button>`).join('') || `<p class="muted small">${esc(t('shop.shelfEmpty'))}</p>`}</div>
        <div class="st-board" aria-hidden="true"></div>
      </div>`;
    return `<section class="store-room${W.festiveKey() ? ` fest-${W.festiveKey()}` : ''}">
      ${decoHtml()}
      <header class="room-head"><button type="button" class="link-btn" data-store-leave>‹ ${esc(t('shop.leave'))}</button><span class="muted small">${esc(t('shop.restock', { t: countdown(d.nextDay) }))}</span>${free ? `<span class="tag tag-warn">${esc(t('shop.freeOn'))}</span>` : ''}</header>
      ${shelf('tv', sh.items.tv)}${shelf('movie', sh.items.movie)}${shelf('poster', sh.items.poster)}
      <div class="counter" aria-hidden="true"><span>🍿</span><span>📼</span><span>🛎️</span></div>
    </section>`;
  }

  function countdown(iso) {
    const ms = Math.max(0, new Date(iso) - Date.now());
    const h = Math.floor(ms / 3600e3);
    const m = Math.floor((ms % 3600e3) / 60e3);
    return t('shop.countdown', { h, m });
  }

  /** Stück aus dem Regal nehmen → anheben, ansehen, kaufen oder zurücklegen. */
  function pickShop(id, btn) {
    const it = Object.values(col.data.shop.items).flat().find((x) => x.id === id);
    if (!it) return;
    btn?.classList.add('lifted');
    $('#item-dialog').dataset.lifted = id;
    const can = col.data.freeShop || (col.data.balance[it.price.cur] || 0) >= it.price.amount;
    $('#item-body').innerHTML = `${CLOSE_BTN()}
      <div class="item-stage lift">${caseHtml(it, { size: 'lg' })}</div>
      <h2 id="item-title">${itemTitle(it)}</h2>
      <p class="item-meta">${rarLabel(it.rarity)} · ${esc(t(`ed.${it.edition}`))} · ${esc(fmtLabel(it))}</p>
      ${it.discover ? `<p class="discover-note">✦ ${esc(t('shop.discoverNote'))}</p>` : ''}
      <p class="muted small">${esc(t(`edd.${it.edition}`))}</p>
      ${factorsHtml(it)}
      <div class="item-price">${it.owned ? `✓ ${esc(t('shop.inCollection'))}` : price(it.price, col.data.freeShop)}</div>
      <div class="item-actions">
        <button type="button" class="btn btn-ghost" data-putback>↩︎ ${esc(t('shop.putBack'))}</button>
        ${it.owned ? '' : `<button type="button" class="btn btn-primary" data-buy="${esc(it.id)}" ${can ? '' : 'disabled'}>🛒 ${esc(t('shop.buy'))}</button>`}
      </div>
      ${!it.owned && !can ? `<p class="muted small">${esc(t('shop.tooPoor'))}</p>` : ''}`;
    $('#item-dialog').showModal();
  }

  async function buy(id, btn) {
    btn.disabled = true;
    try {
      const r = await postJSON('/api/collection/buy', { id });
      col.data.balance = r.balance;
      for (const list of Object.values(col.data.shop.items)) for (const x of list) if (x.id === id) x.owned = true;
      col.data.items.unshift({ ...r.item });
      $('#item-dialog').close();
      celebrate(r.item);
      if (r.fresh?.length) setTimeout(() => noteToast(r.fresh), 1600);
      render();
    } catch (err) { toast(errMsg(err), true); btn.disabled = false; }
  }

  function celebrate(it) {
    const layer = $('#fx-layer');
    const n = { common: 12, rare: 22, epic: 34, legendary: 48, mythic: 64 }[it.rarity] || 12;
    confetti(layer, n);
    toast(t('shop.bought', { n: it.name }));
  }

  // ---------------------------------------------------------------- Vorführraum
  function screeningHtml() {
    const s = col.data.session;
    const refine = refineHtml();
    if (!s) {
      return `<section class="card screen-room"><div class="curtain l" aria-hidden="true"></div><div class="curtain r" aria-hidden="true"></div>
        <div class="screen-intro"><div class="projector" aria-hidden="true">📽️</div><h3>${esc(t('scr.title'))}</h3><p>${esc(t('scr.text'))}</p>
        <button type="button" class="btn btn-primary btn-lg" data-scr-start>🎬 ${esc(t('scr.start'))}</button></div></section>${refine}`;
    }
    if (s.done) {
      return `<section class="card screen-room done"><div class="screen-intro"><div class="projector" aria-hidden="true">🏆</div>
        <h3>${esc(t('scr.doneTitle', { s: s.score, m: s.max }))}</h3><p>${esc(t('scr.doneText'))}</p>
        <ol class="scr-results">${s.rounds.map((r, i) => `<li class="${r.correct ? 'ok' : 'bad'}"><span>${i + 1}</span><b>${esc(r.options.find((o) => o.id === r.solution)?.name || '–')}</b><em>${r.correct ? `+${r.points}` : '0'}</em></li>`).join('')}</ol></div></section>${refine}`;
    }
    const i = s.rounds.findIndex((r) => r.answer === null);
    const r = s.rounds[i];
    col.round = i;
    return `<section class="card screen-room">
      <header class="scr-head"><span>${esc(t('scr.round', { a: i + 1, b: s.rounds.length }))}</span><span>${esc(t('scr.score', { n: s.score }))}</span></header>
      <div class="screen lvl-${r.level}"><img id="scr-img" alt="${esc(t('scr.alt'))}" src="/api/screening/image?r=${i}&l=${r.level}&d=${encodeURIComponent(s.day)}" /><div class="screen-grain" aria-hidden="true"></div></div>
      <div class="scr-bar"><span>${esc(t('scr.points', { n: [3, 2, 1][r.level - 1] }))}</span>${r.level < 3 ? `<button type="button" class="btn btn-ghost btn-xs" data-scr-reveal>🔍 ${esc(t('scr.sharper'))}</button>` : ''}</div>
      <div class="scr-options">${r.options.map((o) => `<button type="button" class="btn btn-ghost scr-opt" data-scr-answer="${o.id}">${esc(o.name)}${o.year ? ` <small>${o.year}</small>` : ''}</button>`).join('')}</div>
    </section>${refine}`;
  }
  function bindScreeningImage() {
    const img = $('#scr-img');
    img?.addEventListener('error', () => { img.replaceWith(Object.assign(document.createElement('div'), { className: 'screen-missing', textContent: t('scr.noImage') })); }, { once: true });
  }
  async function scrAction(path, body) {
    try {
      const r = await postJSON(path, body);
      col.data.session = r.session;
      if (r.balance) col.data.balance = r.balance;
      return r;
    } catch (err) { toast(errMsg(err), true); return null; }
  }
  async function answer(choice, btn) {
    const i = col.round;
    $$('.scr-opt').forEach((b) => { b.disabled = true; });
    const r = await scrAction('/api/screening/answer', { round: i, choice: Number(choice) });
    if (!r) return;
    const round = r.session.rounds[i];
    // Auflösung zeigen: scharfes Bild + richtig/falsch
    $$('.scr-opt').forEach((b) => b.classList.add(Number(b.dataset.scrAnswer) === round.solution ? 'right' : b === btn ? 'wrong' : 'dim'));
    const img = $('#scr-img');
    if (img) img.src = `/api/screening/image?r=${i}&l=3&d=${encodeURIComponent(r.session.day)}&s=1`;
    $('.screen')?.classList.replace(`lvl-${round.level}`, 'lvl-3');
    if (round.correct) confetti($('#fx-layer'), 14);
    if (r.reward) setTimeout(() => noteToast([{ label: 'quiz', ...r.reward }]), 900);
    setTimeout(() => { render(); }, reduceMotion ? 300 : 1500);
  }

  function refineHtml() {
    const own = col.data.items.filter((x) => x.rarity !== 'mythic');
    if (!own.length) return '';
    return `<section class="card refine-card"><header class="card-head"><div><h3>✨ ${esc(t('scr.refineTitle'))}</h3><p class="muted small">${esc(t('scr.refineSub'))}</p></div></header>
      <ul class="refine-list">${own.slice(0, 30).map((it) => {
        const next = RAR[RAR.indexOf(it.rarity) + 1];
        return `<li>${caseHtml(it, { size: 'xs' })}<div><b>${esc(it.name)}</b><small>${rarLabel(it.rarity)} → ${rarLabel(next)}</small></div><button type="button" class="btn btn-ghost btn-xs" data-refine="${esc(it.id)}">${costHtml(col.data.refineCosts[next])}</button></li>`;
      }).join('')}</ul></section>`;
  }
  async function refine(id, btn) {
    btn.disabled = true;
    try {
      const r = await postJSON('/api/collection/refine', { id });
      col.data.balance = r.balance;
      const it = col.data.items.find((x) => x.id === id);
      Object.assign(it, { rarity: r.rarity, edition: r.edition });
      if ($('#item-dialog').open) $('#item-dialog').close();
      toast(t('scr.refined', { n: it.name, r: t(`rar.${r.rarity}`) }));
      confetti($('#fx-layer'), 30);
      if (r.fresh?.length) setTimeout(() => noteToast(r.fresh), 1400);
      render();
    } catch (err) { toast(errMsg(err), true); btn.disabled = false; }
  }

  // ---------------------------------------------------------------- Kinokasse
  function notesHtml() {
    const d = col.data;
    const rew = (r) => `<span class="earn-rew">+${costHtml(r)}</span>`;
    const tp = d.ticketPrice || 200;
    const can = Math.floor(Number(d.balance.meters) / tp);
    return `<section class="card box-office">
        <div class="bo-window">
          <p class="bo-sign">${esc(t('notes.title'))}</p>
          <div class="bo-wallet">
            <div class="bo-reel"><span class="reel-ico" aria-hidden="true"></span><b>${fmt(d.balance.meters)}</b><small>${esc(t('cur.meters'))}</small></div>
            <div class="bo-ticket"><span class="ticket-ico" aria-hidden="true"></span><b>${fmt(d.balance.tickets)}</b><small>${esc(t('cur.tickets'))}</small></div>
          </div>
          <p class="muted small">${esc(t('notes.sub', { n: tp }))}</p>
          <div class="exchange">
            <button type="button" class="btn btn-primary btn-xs" data-exchange="1" ${can >= 1 ? '' : 'disabled'}>${coin('meters', tp)} → ${coin('tickets', 1)}</button>
            ${can >= 5 ? `<button type="button" class="btn btn-ghost btn-xs" data-exchange="5">${coin('meters', tp * 5)} → ${coin('tickets', 5)}</button>` : ''}
          </div>
        </div>
      </section>
      <section class="card"><header class="card-head"><div><h3>${esc(t('earn.title'))}</h3><p class="muted small">${esc(t('earn.sub'))}</p></div></header>
        <ul class="earn-list">${d.earn.map((e) => `<li class="${e.done ? 'done' : ''}"><span class="earn-ico">${e.done ? '✓' : { reel: '🎞️', visit: '📅', import: '📥', trakt: '🔗', friend: '👥', birthday: '🎂', hours: '⏱️', streak: '🔥', complete: '🏁', quiz: '📽️', gift: '🎁', wrapped: '🎬' }[e.id] || '•'}</span>
          <div><b>${esc(t(`earn.${e.id}`, { n: e.n ?? '' }))}</b><small>${esc(t(`earn.${e.id}Sub`, { n: e.n ?? '', h: e.have ?? '' }))}${e.repeat ? ` · ${esc(t('earn.repeat'))}` : ''}</small></div>${rew(e.reward)}</li>`).join('')}</ul></section>`;
  }

  // ---------------------------------------------------------------- Noten-Einblendung
  function noteToast(fresh) {
    const el = $('#note-toast');
    const sum = { meters: 0, tickets: 0 };
    fresh.forEach((f) => CUR.forEach((x) => { sum[x] += f[x] || 0; }));
    if (!sum.meters && !sum.tickets) return;
    const label = fresh.map((f) => t(`earned.${f.label}`)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 2).join(' · ');
    el.innerHTML = `<span class="nt-coins">+${costHtml(sum)}</span><span>${esc(label)}</span>`;
    el.hidden = false;
    el.classList.remove('out');
    clearTimeout(noteToast.timer);
    noteToast.timer = setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.hidden = true; }, 400); }, 3600);
    if (col.data) renderTeaser();
  }
  W.noteToast = noteToast;

  // ---------------------------------------------------------------- Teaser in der Übersicht
  function renderTeaser() {
    const el = $('#collection-teaser');
    const d = col.data;
    if (!el || !d || !W.hasData()) { if (el) el.hidden = true; return; }
    el.innerHTML = `<header class="card-head"><div><h2>🎞️ ${esc(t('col.title'))}</h2><p class="muted small">${esc(t('col.teaser', { n: d.items.length }))}</p></div>${balanceHtml(d.balance)}</header>
      <div class="teaser-shelf">${d.items.slice(0, 8).map((it) => caseHtml(it, { size: 'sm' })).join('') || `<p class="muted small">${esc(t('col.emptyText'))}</p>`}</div>
      <div class="profile-actions"><button type="button" class="btn btn-primary" data-col-go="store">🏪 ${esc(t('col.toStore'))}</button><button type="button" class="btn btn-ghost" data-col-go="screening">📽️ ${esc(t('col.tab.screening'))}</button></div>`;
    el.hidden = false;
  }

  // ---------------------------------------------------------------- Verstecktes Geschenk (einmal am Tag irgendwo)
  function placeGift() {
    $$('.hidden-gift').forEach((g) => g.remove());
    if (!col.data?.gift || !W.hasData()) return;
    const day = new Date().toISOString().slice(0, 10);
    const spots = ['#insights', '#timeline-chart', '#overview-series', '#top-list', '#history', '#binge-list', '#progress-list', '#service-split'];
    const h = [...`${day}${W.state.account?.id}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 1);
    const target = $(spots[h % spots.length])?.closest('.card, .insights');
    if (!target) return;
    target.style.position ||= 'relative';
    target.insertAdjacentHTML('beforeend', `<button type="button" class="hidden-gift" data-gift style="--gx:${10 + (h % 70)}%;--gy:${15 + ((h >> 4) % 60)}%" aria-label="${esc(t('gift.found'))}">🎁</button>`);
  }
  async function openGift(btn) {
    btn.disabled = true;
    try {
      const r = await postJSON('/api/collection/gift', {});
      col.data.gift = false;
      col.data.balance = r.balance;
      btn.classList.add('opened');
      $('#gift-body').innerHTML = `${CLOSE_BTN()}<div class="gift-stage"><div class="gift-box" aria-hidden="true">🎁</div><h2 id="gift-title">${esc(t('gift.title'))}</h2><p class="gift-reward">+${costHtml(r.reward)}</p><p class="muted small">${esc(t('gift.text'))}</p></div>`;
      $('#gift-dialog').showModal();
      confetti($('#fx-layer'), 30);
      setTimeout(() => btn.remove(), 600);
      renderTeaser();
    } catch (err) { toast(errMsg(err), true); btn.remove(); }
  }

  // ---------------------------------------------------------------- Ereignisse
  document.addEventListener('click', async (e) => {
    const tab = e.target.closest('[data-coltab-go], [data-col-go]');
    if (tab) { col.tab = tab.dataset.coltabGo || tab.dataset.colGo; session.set('colTab', col.tab); if (W.state.panel === 'collection') render(); else W.showPanel('collection'); return; }
    if (e.target.closest('[data-store-enter]')) {
      const front = $('.store-front');
      front?.classList.add('opening');
      setTimeout(() => { col.entered = true; W.smoothSwap(renderBody, 'fwd'); }, reduceMotion ? 0 : 650);
      return;
    }
    if (e.target.closest('[data-store-leave]')) { col.entered = false; W.smoothSwap(renderBody, 'back'); return; }
    const sh = e.target.closest('[data-shop]');
    if (sh) { pickShop(sh.dataset.shop, sh); return; }
    const own = e.target.closest('[data-own]');
    if (own) { openOwned(own.dataset.own, col.friend?.items && own.closest('#item-body') ? col.friend.items : col.data.items, Boolean(own.closest('.friend-shelf'))); return; }
    if (e.target.closest('[data-putback]')) { $('#item-dialog').close(); return; }
    const b = e.target.closest('[data-buy]');
    if (b) { buy(b.dataset.buy, b); return; }
    const rf = e.target.closest('[data-refine]');
    if (rf) { refine(rf.dataset.refine, rf); return; }
    const ex = e.target.closest('[data-exchange]');
    if (ex) {
      try { const r = await postJSON('/api/collection/exchange', { count: Number(ex.dataset.exchange) }); col.data.balance = r.balance; toast(t('notes.exchanged', { n: ex.dataset.exchange })); render(); } catch (err) { toast(errMsg(err), true); }
      return;
    }
    if (e.target.closest('[data-scr-start]')) { if (await scrAction('/api/screening/start', {})) renderBody(); return; }
    if (e.target.closest('[data-scr-reveal]')) { if (await scrAction('/api/screening/reveal', { round: col.round })) renderBody(); return; }
    const an = e.target.closest('[data-scr-answer]');
    if (an) { answer(an.dataset.scrAnswer, an); return; }
    const z = e.target.closest('[data-tv-zap]');
    if (z) { zapTv(Number(z.dataset.tvZap)); return; }
    const g = e.target.closest('[data-gift]');
    if (g) { openGift(g); return; }
    const fc = e.target.closest('[data-friend-collection]');
    if (fc) {
      try {
        const r = await api(`/api/friends/${fc.dataset.friendCollection}/collection`);
        col.friend = r;
        $('#item-body').innerHTML = `${CLOSE_BTN()}<h2 id="item-title">${esc(t('col.friendTitle', { u: r.username }))}</h2><div class="friend-shelf">${shelfHtml(r.items, { readonly: true })}</div>`;
        $('#item-dialog').showModal();
      } catch (err) { toast(errMsg(err), true); }
    }
  });
  // Am Fernseher wischen oder scrollen schaltet um
  let tvX = null;
  let wheelAt = 0;
  document.addEventListener('touchstart', (e) => { tvX = e.target.closest?.('.oled-screen') ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (tvX === null) return;
    const dx = (e.changedTouches[0]?.clientX ?? tvX) - tvX;
    tvX = null;
    if (Math.abs(dx) > 40) zapTv(dx < 0 ? 1 : -1);
  }, { passive: true });
  document.addEventListener('wheel', (e) => {
    if (!e.target.closest?.('.oled-screen')) return;
    e.preventDefault();
    const now = Date.now();
    if (now - wheelAt < 350) return;
    wheelAt = now;
    zapTv((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) > 0 ? 1 : -1);
  }, { passive: false });
  document.addEventListener('keydown', (e) => {
    if (!e.target.closest?.('.oled-screen')) return;
    if (e.key === 'ArrowRight') zapTv(1);
    if (e.key === 'ArrowLeft') zapTv(-1);
  });
  $('#item-dialog').addEventListener('close', () => { $$('.st-item.lifted').forEach((x) => x.classList.remove('lifted')); });
  $('#free-shop-switch')?.addEventListener('click', async (e) => {
    const on = e.currentTarget.getAttribute('aria-checked') !== 'true';
    try { await postJSON('/api/admin/free-shop', { on }); e.currentTarget.setAttribute('aria-checked', String(on)); W.freeShop = on; col.data = null; } catch (err) { toast(errMsg(err), true); }
  });

  W.register('collection', async () => { await load(); render(); });
  window.addEventListener('watchlfy:status', () => { if (!col.data) load().catch(() => {}); });
  window.addEventListener('watchlfy:festive', () => { if (W.state.panel === 'collection' && col.data) renderBody(); });
  window.addEventListener('watchlfy:imported', () => { col.data = null; load().catch(() => {}); });
})();
