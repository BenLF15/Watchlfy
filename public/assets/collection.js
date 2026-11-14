/* Watchlfy – Sammlung: DVD-/Blu-ray-Wand, Filmplakat-Galerie, begehbare Retro-Videothek, Vorführraum, Noten, Geschenke. */
(() => {
  'use strict';
  const W = window.Watchlfy;
  if (!W) return;
  const { api, postJSON, t, esc, fmt, toast, errMsg, $, $$, poster, tmdbImg, reduceMotion, confetti, CLOSE_BTN, store, session } = W;

  const TIERS = ['bronze', 'silver', 'gold', 'platinum'];
  const RAR = ['common', 'rare', 'epic', 'legendary', 'mythic'];
  const col = { data: null, tab: session.get('colTab') || 'shelf', entered: false, round: null };

  // ---------------------------------------------------------------- Bausteine
  const coin = (tier, n, cls = '') => `<span class="coin coin-${tier} ${cls}" title="${esc(t(`notes.${tier}`))}"><i aria-hidden="true"></i><b>${fmt(n)}</b><span class="sr-only">${esc(t(`notes.${tier}`))}</span></span>`;
  const price = (p, free = false) => (free ? `<span class="price-tag free">${esc(t('shop.free'))}</span>` : `<span class="price-tag">${coin(p.tier, p.amount)}</span>`);
  const costHtml = (r) => TIERS.filter((x) => r[x]).map((x) => coin(x, r[x])).join('') || '0';
  const balanceHtml = (b) => `<div class="balance" aria-label="${esc(t('notes.title'))}">${TIERS.map((x) => coin(x, b[x])).join('')}</div>`;

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
        <div><h2 data-fest-title>${esc(t('col.title'))}</h2><p class="muted small">${esc(t('col.sub', { n: d.items.length }))}</p></div>
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
    else body.innerHTML = shelfHtml(col.data.items);
    if (col.tab === 'screening' && col.data.session && !col.data.session.done) bindScreeningImage();
  }

  // ---------------------------------------------------------------- Regal: DVD-/Blu-ray-Wand + Plakat-Galerie
  function shelfHtml(items, { readonly = false } = {}) {
    const discs = items.filter((i) => i.format !== 'poster');
    const posters = items.filter((i) => i.format === 'poster');
    if (!items.length) {
      return `<section class="card empty-shelf"><div class="es-art" aria-hidden="true">📼</div><h3>${esc(t(readonly ? 'col.friendEmpty' : 'col.empty'))}</h3>${readonly ? '' : `<p class="muted">${esc(t('col.emptyText'))}</p><button type="button" class="btn btn-primary" data-coltab-go="store">🏪 ${esc(t('col.toStore'))}</button>`}</section>`;
    }
    const rows = [];
    for (let i = 0; i < discs.length; i += 8) rows.push(discs.slice(i, i + 8));
    return `
      <section class="card wall-card">
        <header class="card-head"><div><h3>${esc(t('col.wall'))}</h3><p class="muted small">${esc(t('col.wallSub', { n: discs.length }))}</p></div></header>
        <div class="disc-wall">${rows.map((r) => `<div class="shelf-row">${r.map((it, k) => caseHtml(it, { tag: 'button', attrs: `type="button" data-own="${esc(it.id)}" style="--i:${k}" aria-label="${esc(it.name)}"` })).join('')}</div>`).join('') || `<p class="muted small">${esc(t('col.noDiscs'))}</p>`}</div>
      </section>
      <section class="card gallery-card">
        <header class="card-head"><div><h3>${esc(t('col.gallery'))}</h3><p class="muted small">${esc(t('col.gallerySub', { n: posters.length }))}</p></div></header>
        <div class="poster-wall">${posters.map((it, k) => caseHtml(it, { tag: 'button', attrs: `type="button" data-own="${esc(it.id)}" style="--i:${k};--tilt:${((it.hue % 7) - 3) * 0.6}deg" aria-label="${esc(it.name)}"` })).join('') || `<p class="muted small">${esc(t('col.noPosters'))}</p>`}</div>
      </section>`;
  }

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
    const can = col.data.freeShop || (col.data.balance[it.price.tier] || 0) >= it.price.amount;
    $('#item-body').innerHTML = `${CLOSE_BTN()}
      <div class="item-stage lift">${caseHtml(it, { size: 'lg' })}</div>
      <h2 id="item-title">${itemTitle(it)}</h2>
      <p class="item-meta">${rarLabel(it.rarity)} · ${esc(t(`ed.${it.edition}`))} · ${esc(fmtLabel(it))}</p>
      <p class="muted small">${esc(t(`edd.${it.edition}`))}</p>
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
    setTimeout(() => { renderBody(); }, reduceMotion ? 300 : 1500);
    render();
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

  // ---------------------------------------------------------------- Noten
  function notesHtml() {
    const d = col.data;
    const rew = (r) => `<span class="earn-rew">+${costHtml(r)}</span>`;
    return `<section class="card notes-card"><header class="card-head"><div><h3>${esc(t('notes.title'))}</h3><p class="muted small">${esc(t('notes.sub'))}</p></div></header>
        ${balanceHtml(d.balance)}
        <div class="exchange">${TIERS.slice(0, 3).map((tier, i) => `<button type="button" class="btn btn-ghost btn-xs" data-exchange="${tier}" ${d.balance[tier] >= d.exchangeRate ? '' : 'disabled'}>${coin(tier, d.exchangeRate)} → ${coin(TIERS[i + 1], 1)}</button>`).join('')}</div>
      </section>
      <section class="card"><header class="card-head"><div><h3>${esc(t('earn.title'))}</h3><p class="muted small">${esc(t('earn.sub'))}</p></div></header>
        <ul class="earn-list">${d.earn.map((e) => `<li class="${e.done ? 'done' : ''}"><span class="earn-ico">${e.done ? '✓' : { visit: '📅', import: '📥', trakt: '🔗', friend: '👥', birthday: '🎂', hours: '⏱️', streak: '🔥', complete: '🏁', quiz: '📽️', gift: '🎁', wrapped: '🎬' }[e.id] || '•'}</span>
          <div><b>${esc(t(`earn.${e.id}`, { n: e.n ?? '' }))}</b><small>${esc(t(`earn.${e.id}Sub`, { n: e.n ?? '', h: e.have ?? '' }))}${e.repeat ? ` · ${esc(t('earn.repeat'))}` : ''}</small></div>${rew(e.reward)}</li>`).join('')}</ul></section>`;
  }

  // ---------------------------------------------------------------- Noten-Einblendung
  function noteToast(fresh) {
    const el = $('#note-toast');
    const sum = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
    fresh.forEach((f) => TIERS.forEach((x) => { sum[x] += f[x] || 0; }));
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
      try { const r = await postJSON('/api/collection/exchange', { from: ex.dataset.exchange }); col.data.balance = r.balance; render(); } catch (err) { toast(errMsg(err), true); }
      return;
    }
    if (e.target.closest('[data-scr-start]')) { if (await scrAction('/api/screening/start', {})) renderBody(); return; }
    if (e.target.closest('[data-scr-reveal]')) { if (await scrAction('/api/screening/reveal', { round: col.round })) renderBody(); return; }
    const an = e.target.closest('[data-scr-answer]');
    if (an) { answer(an.dataset.scrAnswer, an); return; }
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
