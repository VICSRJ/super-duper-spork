(() => {
  'use strict';
  const KEY = 'botanic-wms-inventory-v1';

  const loadChecks = () => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  };
  const saveChecks = (checks) => localStorage.setItem(KEY, JSON.stringify(checks));
  const number = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
  const fmt = (v) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(number(v));
  const esc2 = (s) => String(s ?? '').replace(/[&<>\'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

  function expected(materialId) {
    return (window.data?.packs || []).filter(p => p.material === materialId && Number(p.qty) > 0).reduce((sum, p) => sum + number(p.qty), 0);
  }

  function injectNav() {
    const nav = document.querySelector('.nav');
    if (!nav || nav.querySelector('[data-view="count"]')) return;
    const b = document.createElement('button');
    b.className = 'nav-item';
    b.dataset.view = 'count';
    b.innerHTML = '<span>✓</span> Inventura';
    b.addEventListener('click', () => window.setViewCount());
    nav.insertBefore(b, nav.querySelector('[data-view="materials"]')?.nextSibling || null);
  }

  function injectView() {
    const content = document.querySelector('.content');
    if (!content || document.getElementById('view-count')) return;
    const s = document.createElement('section');
    s.id = 'view-count';
    s.className = 'view';
    content.appendChild(s);
  }

  function setActiveNav() {
    document.querySelectorAll('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === 'count'));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-count'));
  }

  function render() {
    injectNav(); injectView(); setActiveNav();
    const checks = loadChecks();
    const materials = window.data?.materials || [];
    const active = checks.length ? checks[checks.length - 1] : null;
    const counts = active?.rows || {};
    document.getElementById('view-count').innerHTML = `
      <div class="page-head">
        <div><div class="eyebrow">Sklad / Inventura</div><h1>Fyzická inventura</h1><div class="sub">Porovnání systémové zásoby se skutečně přepočítaným množstvím. Inventura nemění sklad automaticky.</div></div>
        <div class="head-actions"><button class="ghost-btn" type="button" id="finishCount">Uložit inventuru</button><button class="primary-btn" type="button" id="newCount">＋ Nová inventura</button></div>
      </div>
      ${active ? `<div class="wms-attention"><div class="wms-attention-icon">#</div><div><strong>Inventura ${esc2(active.id)}</strong><span> Zahájena ${new Date(active.startedAt).toLocaleString('cs-CZ')} · stav ${active.status === 'open' ? 'rozpracovaná' : 'uzavřená'}</span></div><button class="ghost-btn" type="button" id="discardCount">Zahodit rozpracovanou</button></div>` : '<div class="wms-attention"><div class="wms-attention-icon">!</div><div><strong>Inventura není spuštěná</strong><span> Vytvořte inventurní list před fyzickým přepočtem.</span></div><button class="primary-btn" type="button" id="startCount">Spustit</button></div>'}
      <div class="table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Surovina</th><th>Systém</th><th>Skutečnost (g)</th><th>Rozdíl (g)</th><th>Stav</th></tr></thead><tbody>
      ${materials.map(m => {
        const e = expected(m.id);
        const c = counts[m.id] == null ? '' : counts[m.id];
        const diff = c === '' ? null : number(c) - e;
        const cls = diff === null ? '' : diff === 0 ? 'ok' : diff < 0 ? 'danger' : 'warn';
        return `<tr><td><strong>${esc2(m.name)}</strong><div class="mono" style="color:#78837c;font-size:10px">${esc2(m.id)}</div></td><td class="mono"><strong>${fmt(e)}</strong> g</td><td><input class="count-input" data-material="${esc2(m.id)}" type="number" min="0" step="1" value="${c}" placeholder="0"></td><td class="mono">${diff === null ? '—' : (diff > 0 ? '+' : '') + fmt(diff) + ' g'}</td><td>${diff === null ? '<span class="badge">NEZADÁNO</span>' : diff === 0 ? '<span class="badge ok">SHODA</span>' : `<span class="badge ${cls}">${diff < 0 ? 'MÉNĚ' : 'VÍCE'}</span>`}</td></tr>`;
      }).join('')}</tbody></table></div></div>`;

    document.querySelectorAll('.count-input').forEach(input => input.addEventListener('input', () => {
      if (!active || active.status !== 'open') return;
      active.rows[input.dataset.material] = input.value === '' ? null : number(input.value);
      saveChecks(checks);
      render();
    }));

    document.getElementById('newCount')?.addEventListener('click', start);
    document.getElementById('startCount')?.addEventListener('click', start);
    document.getElementById('finishCount')?.addEventListener('click', finish);
    document.getElementById('discardCount')?.addEventListener('click', discard);
  }

  function start() {
    const checks = loadChecks();
    const open = checks.find(x => x.status === 'open');
    if (open) { window.toast?.('Rozpracovaná inventura již existuje.', true); return; }
    const id = `I-${new Date().getFullYear()}-${String(checks.length + 1).padStart(3, '0')}`;
    checks.push({ id, startedAt: new Date().toISOString(), finishedAt: null, status: 'open', rows: {} });
    saveChecks(checks); render(); window.toast?.(`Inventura ${id} spuštěna.`);
  }

  function finish() {
    const checks = loadChecks(); const active = checks.find(x => x.status === 'open');
    if (!active) return;
    const incomplete = (window.data?.materials || []).filter(m => active.rows[m.id] == null);
    if (incomplete.length && !confirm(`Chybí přepočet u ${incomplete.length} surovin. Přesto inventuru uzavřít?`)) return;
    active.status = 'closed'; active.finishedAt = new Date().toISOString(); saveChecks(checks); render(); window.toast?.(`Inventura ${active.id} uzavřena.`);
  }

  function discard() {
    const checks = loadChecks(); const idx = checks.findIndex(x => x.status === 'open');
    if (idx < 0) return;
    if (!confirm('Zahodit rozpracovanou inventuru?')) return;
    checks.splice(idx, 1); saveChecks(checks); render(); window.toast?.('Rozpracovaná inventura zahozena.');
  }

  window.setViewCount = () => { render(); };
  window.__renderCount = render;

  const observer = new MutationObserver(() => injectNav());
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(() => { injectNav(); injectView(); }, 0);
})();
