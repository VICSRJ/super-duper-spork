const STORAGE_KEY = 'botanic-wms-v2';
const QUEUE_KEY = 'botanic-wms-sync-queue-v1';
const state = { view: 'dashboard', query: '', filters: { material: 'ALL', status: 'ALL' } };

const seed = {
  meta: { schemaVersion: 2, nextPack: 8, nextMovement: 6 },
  materials: [
    { id: 'S-001', name: 'Ashwagandha KSM-66', unit: 'g', min: 5000 },
    { id: 'S-002', name: 'Boswellia serrata (Boswellin® HBD)', unit: 'g', min: 4000 },
    { id: 'S-003', name: 'Rozchodnice růžová (Rhodiola rosea)', unit: 'g', min: 3500 },
    { id: 'S-004', name: 'Kotvičník zemní (Tribulus terrestris)', unit: 'g', min: 2500 },
    { id: 'S-005', name: 'Maca', unit: 'g', min: 3000 }
  ],
  boxes: Array.from({ length: 20 }, (_, i) => ({ id: `B-${i + 1}` })),
  positions: Array.from({ length: 4 }, (_, r) => Array.from({ length: 10 }, (_, c) => ({ id: `${String.fromCharCode(65 + r)}${c + 1}` }))).flat(),
  packs: [
    { id: 'P-2026-001', material: 'S-001', lot: 'AK66-260801', received: '2026-08-01', expiry: '2027-08-01', qty: 2400, initialQty: 2400, box: 'B-1', position: 'A1', packState: 'original' },
    { id: 'P-2026-002', material: 'S-001', lot: 'AK66-260812', received: '2026-08-12', expiry: '2027-08-12', qty: 1800, initialQty: 2100, box: 'B-2', position: 'A2', packState: 'opened' },
    { id: 'P-2026-003', material: 'S-002', lot: 'BS-260802', received: '2026-08-02', expiry: '2027-08-02', qty: 4100, initialQty: 4100, box: 'B-3', position: 'A3', packState: 'original' },
    { id: 'P-2026-004', material: 'S-003', lot: 'RR-260805', received: '2026-08-05', expiry: '2027-08-05', qty: 3200, initialQty: 3200, box: 'B-4', position: 'B1', packState: 'original' },
    { id: 'P-2026-005', material: 'S-004', lot: 'KT-260808', received: '2026-08-08', expiry: '2027-08-08', qty: 2100, initialQty: 2100, box: 'B-5', position: 'B2', packState: 'opened' },
    { id: 'P-2026-006', material: 'S-005', lot: 'MA-260810', received: '2026-08-10', expiry: '2027-08-10', qty: 2900, initialQty: 2900, box: 'B-6', position: 'B3', packState: 'original' },
    { id: 'P-2026-007', material: 'S-002', lot: 'BS-260818', received: '2026-08-18', expiry: '2027-08-18', qty: 2200, initialQty: 2200, box: 'B-7', position: 'C1', packState: 'original' }
  ],
  movements: [
    { id: 'M-001', date: '2026-08-30T08:50:00', type: 'Příjem', pack: 'P-2026-007', qty: 2200, from: 'Příjem', to: 'C1', reason: 'Příjem zásoby', user: 'local' },
    { id: 'M-002', date: '2026-08-30T08:10:00', type: 'Výdej', pack: 'P-2026-002', qty: -300, from: 'A2', to: 'Výdej', reason: 'Výdej', user: 'local' },
    { id: 'M-003', date: '2026-08-29T16:31:00', type: 'Přesun', pack: 'P-2026-005', qty: 0, from: 'A4', to: 'B2', reason: 'Změna pozice', user: 'local' },
    { id: 'M-004', date: '2026-08-29T13:05:00', type: 'Výdej', pack: 'P-2026-001', qty: -400, from: 'A1', to: 'Výdej', reason: 'Výdej', user: 'local' },
    { id: 'M-005', date: '2026-08-28T11:40:00', type: 'Příjem', pack: 'P-2026-006', qty: 2900, from: 'Příjem', to: 'B3', reason: 'Příjem zásoby', user: 'local' }
  ]
};

let data = loadData();

function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(seed);
    const parsed = JSON.parse(raw);
    return normalize(parsed);
  } catch {
    return deepClone(seed);
  }
}
function normalize(input) {
  const d = input && typeof input === 'object' ? input : deepClone(seed);
  d.meta ??= { schemaVersion: 2, nextPack: 1, nextMovement: 1 };
  d.materials ??= [];
  d.boxes ??= [];
  d.positions ??= [];
  d.packs ??= [];
  d.movements ??= [];
  for (const p of d.packs) {
    p.initialQty = Number.isFinite(p.initialQty) ? p.initialQty : Math.max(0, Number(p.qty) || 0);
    p.qty = Math.max(0, Number(p.qty) || 0);
  }
  return d;
}
function queueLoad() { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; } }
function queueSave(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); render(); }
function money(n) { return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Number(n) || 0); }
function dateTime(v) { return new Intl.DateTimeFormat('cs-CZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(v)); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function material(id) { return data.materials.find(m => m.id === id); }
function materialName(id) { return material(id)?.name || id; }
function activePacks() { return data.packs.filter(p => p.qty > 0); }
function stock() { return activePacks().reduce((s, p) => s + p.qty, 0); }
function stockByMaterial(id) { return activePacks().filter(p => p.material === id).reduce((s, p) => s + p.qty, 0); }
function daysToExpiry(p) { return p.expiry ? Math.ceil((new Date(`${p.expiry}T23:59:59`) - Date.now()) / 86400000) : Infinity; }
function statusForPack(p) {
  if (p.qty <= 0) return ['VYČERPÁNO', 'danger'];
  if (daysToExpiry(p) < 0) return ['EXPIRACE', 'danger'];
  if (daysToExpiry(p) <= 30) return ['BRZY EXPIRUJE', 'warn'];
  const min = Math.max(500, Number(material(p.material)?.min || 0) * 0.1);
  if (p.qty < min) return ['NÍZKÁ', 'warn'];
  return ['OK', 'ok'];
}
function esc(s) { return String(s ?? '').replace(/[&<>\'\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '\"': '&quot;' }[c])); }
function toast(msg, error = false) {
  const el = document.createElement('div'); el.className = `toast${error ? ' error' : ''}`; el.textContent = msg;
  document.getElementById('toastStack').appendChild(el); setTimeout(() => el.remove(), 2600);
}
function invariantCheck() {
  const errors = [];
  const packIds = new Set();
  for (const p of data.packs) {
    if (packIds.has(p.id)) errors.push(`Duplicitní ID pytle: ${p.id}`);
    packIds.add(p.id);
    if (!material(p.material)) errors.push(`Pytel ${p.id} odkazuje na neexistující surovinu.`);
    if (p.qty < 0 || p.initialQty < 0 || p.qty > p.initialQty) errors.push(`Neplatné množství pytle ${p.id}.`);
    if (!data.boxes.some(b => b.id === p.box)) errors.push(`Neplatný box ${p.box} u ${p.id}.`);
    if (!data.positions.some(x => x.id === p.position)) errors.push(`Neplatná pozice ${p.position} u ${p.id}.`);
  }
  return errors;
}
function ensureValid() { const errors = invariantCheck(); if (errors.length) throw new Error(errors[0]); }
function nextId(prefix, counterKey, width = 3) { const n = Number(data.meta[counterKey] || 1); data.meta[counterKey] = n + 1; return `${prefix}-${String(n).padStart(width, '0')}`; }
function recordMovement({ type, pack, qty = 0, from, to, reason }) {
  data.movements.push({ id: nextId('M', 'nextMovement'), date: new Date().toISOString(), type, pack, qty, from, to, reason, user: 'local' });
}
function saveMutation(description) {
  try {
    ensureValid();
    persist();
    const q = queueLoad(); q.push({ id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, at: new Date().toISOString(), description, entityVersion: data.meta.schemaVersion }); queueSave(q);
  } catch (e) { toast(e.message || 'Operace selhala.', true); }
}
function setView(view) { state.view = view; render(); document.getElementById('sidebar')?.classList.remove('open'); }
window.setView = setView;
function render() {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const active = document.getElementById(`view-${state.view}`); if (active) active.classList.add('active');
  document.querySelectorAll('.nav-item[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === state.view));
  ({ dashboard: renderDashboard, inventory: renderInventory, materials: renderMaterials, warehouse: renderWarehouse, movements: renderMovements }[state.view] || renderDashboard)();
}
function recentMovements(limit = 8) { return [...data.movements].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit); }
function renderDashboard() {
  const low = activePacks().filter(p => ['NÍZKÁ', 'BRZY EXPIRUJE', 'EXPIRACE'].includes(statusForPack(p)[0])).length;
  const queued = queueLoad().length;
  document.getElementById('view-dashboard').innerHTML = `<div class="page-head"><div><div class="eyebrow">Botanic WMS / Přehled</div><h1>Sklad pod kontrolou.</h1><div class="sub">Pytle jsou primární jednotka. Všechna množství jsou vedena v gramech.</div></div><div class="head-actions"><button class="ghost-btn" onclick="setView('warehouse')">Mapa skladu</button><button class="primary-btn" onclick="openReceive()">＋ Příjem materiálu</button></div></div>
  <div class="kpis"><div class="kpi"><div class="kpi-label">Aktuální zásoba</div><div class="kpi-value mono">${money(stock())} g</div><div class="kpi-foot">${money(stock() / 1000)} kg celkem</div></div><div class="kpi"><div class="kpi-label">Aktivní pytle</div><div class="kpi-value">${activePacks().length}</div><div class="kpi-foot">${low} vyžaduje pozornost</div></div><div class="kpi"><div class="kpi-label">Suroviny</div><div class="kpi-value">${data.materials.length}</div><div class="kpi-foot">${data.positions.length} pozic skladu</div></div><div class="kpi"><div class="kpi-label">Dnešní pohyby</div><div class="kpi-value">${data.movements.filter(m => m.date.slice(0, 10) === todayISO()).length}</div><div class="kpi-foot">${queued ? `${queued} čeká na synchronizaci` : 'fronta synchronizace prázdná'}</div></div></div>
  <div class="grid-2"><div class="card"><div class="card-head"><strong>Zásoba podle suroviny</strong><small>${money(stock())} g</small></div>${data.materials.map(m => { const q = stockByMaterial(m.id), max = Math.max(m.min * 2, 1), pct = Math.min(100, q / max * 100); return `<div style="margin:0 0 15px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:7px"><span>${esc(m.name)}</span><span class="mono">${money(q)} g</span></div><div class="progress"><span style="width:${pct}%"></span></div><div style="display:flex;justify-content:space-between;color:#68736c;font-size:10px;margin-top:4px"><span>minimum ${money(m.min)} g</span><span>${q < m.min ? 'doplnit' : ''}</span></div></div>`; }).join('')}</div>
  <div class="card"><div class="card-head"><strong>Poslední pohyby</strong><button class="ghost-btn" onclick="setView('movements')">Vše</button></div><div class="timeline">${recentMovements(7).map(movementRow).join('')}</div></div></div>`;
}
function movementRow(m) { const plus = m.qty > 0; return `<div class="event"><time>${dateTime(m.date)}</time><div class="event-title"><strong>${esc(m.type)}</strong> · <span class="mono">${esc(m.pack)}</span><small>${esc(m.from)} → ${esc(m.to)}</small></div><div class="qty ${plus ? 'plus' : m.qty < 0 ? 'minus' : ''}">${m.qty === 0 ? '—' : (plus ? '+' : '') + money(m.qty) + ' g'}</div></div>`; }
function renderInventory() {
  const q = (state.query || '').toLowerCase();
  const packs = data.packs.filter(p => { const hay = [p.id, p.lot, p.box, p.position, materialName(p.material)].join(' ').toLowerCase(); const status = statusForPack(p)[0]; return (!q || hay.includes(q)) && (state.filters.material === 'ALL' || p.material === state.filters.material) && (state.filters.status === 'ALL' || status === state.filters.status); }).sort((a, b) => a.received.localeCompare(b.received) || a.id.localeCompare(b.id));
  document.getElementById('view-inventory').innerHTML = `<div class="page-head"><div><div class="eyebrow">Sklad / Pytle</div><h1>Zásoby</h1><div class="sub">FIFO + FEFO: při výdeji se preferuje nejbližší expirace, při shodě starší příjem.</div></div><div class="head-actions"><button class="primary-btn" onclick="openReceive()">＋ Příjem</button></div></div><div class="table-card"><div class="table-toolbar"><input class="filter-input" placeholder="Hledat v zásobách…" value="${esc(state.query)}" oninput="state.query=this.value;renderInventory()"><select class="filter-select" onchange="state.filters.material=this.value;renderInventory()"><option value="ALL">Všechny suroviny</option>${data.materials.map(m => `<option value="${m.id}" ${state.filters.material === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select><select class="filter-select" onchange="state.filters.status=this.value;renderInventory()"><option value="ALL">Všechny stavy</option>${['OK', 'NÍZKÁ', 'BRZY EXPIRUJE', 'EXPIRACE', 'VYČERPÁNO'].map(s => `<option value="${s}" ${state.filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div><div class="table-wrap"><table class="table"><thead><tr><th>Pytel</th><th>Surovina</th><th>Šarže</th><th>Pozice</th><th>Balení</th><th>Expirace</th><th>Množství</th><th>Stav</th><th></th></tr></thead><tbody>${packs.length ? packs.map(inventoryRow).join('') : `<tr><td colspan="9"><div class="empty">Nic nenalezeno.</div></td></tr>`}</tbody></table></div></div>`;
}
function inventoryRow(p) { const [st, cl] = statusForPack(p); return `<tr><td class="mono"><strong>${esc(p.id)}</strong></td><td>${esc(materialName(p.material))}</td><td class="mono">${esc(p.lot)}</td><td><span class="badge accent">${esc(p.position)}</span> <span style="color:#6f7a72;font-size:11px">${esc(p.box)}</span></td><td>${p.packState === 'original' ? 'Originál' : 'Otevřený'}</td><td>${esc(p.expiry || '—')}</td><td class="mono"><strong>${money(p.qty)} g</strong></td><td><span class="badge ${cl}">${st}</span></td><td><div class="actions"><button class="mini-btn" onclick="openIssue('${p.id}')">Výdej</button><button class="mini-btn" onclick="openMove('${p.id}')">Přesun</button></div></td></tr>`; }
function renderMaterials() {
  const rows = data.materials.map(m => { const q = stockByMaterial(m.id), count = activePacks().filter(p => p.material === m.id).length; return `<tr><td class="mono"><strong>${esc(m.id)}</strong></td><td><strong>${esc(m.name)}</strong></td><td>${count}</td><td class="mono">${money(q)} g</td><td class="mono">${money(m.min)} g</td><td>${q < m.min ? '<span class="badge danger">NÍZKÁ ZÁSOBA</span>' : '<span class="badge ok">OK</span>'}</td><td><div class="progress" style="min-width:130px"><span style="width:${Math.min(100, q / Math.max(m.min, 1) * 100)}%"></span></div></td></tr>`; }).join('');
  document.getElementById('view-materials').innerHTML = `<div class="page-head"><div><div class="eyebrow">Katalog</div><h1>Suroviny</h1><div class="sub">Centrální katalog surovin a minimálních zásob.</div></div><div class="head-actions"><button class="primary-btn" onclick="openMaterial()">＋ Surovina</button></div></div><div class="table-card"><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Název</th><th>Aktivní pytle</th><th>Zásoba</th><th>Minimum</th><th>Stav</th><th>Naplnění</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function renderWarehouse() {
  const slots = data.positions.map(pos => { const packs = activePacks().filter(p => p.position === pos.id), q = packs.reduce((s, p) => s + p.qty, 0); return `<button class="slot ${q ? 'has-stock' : 'empty-slot'}" onclick="${packs.length ? `openSlot('${pos.id}')` : `toast('Pozice ${pos.id} je volná.')`}"><span class="slot-id">${pos.id}</span>${q ? `<i class="dot"></i><strong>${money(q)} g</strong><small>${packs.length} pytle</small>` : `<small>volná pozice</small>`}</button>`; }).join('');
  document.getElementById('view-warehouse').innerHTML = `<div class="page-head"><div><div class="eyebrow">Sklad / Mapa</div><h1>Pozice</h1><div class="sub">A1–D10 · kliknutím otevřete detail obsazené pozice.</div></div><div class="head-actions"><button class="ghost-btn" onclick="openReceive()">＋ Přidat pytel</button></div></div><div class="card"><div class="card-head"><strong>Mapa skladu</strong><small>${activePacks().length} aktivních pytlů</small></div><div class="map-grid">${slots}</div></div>`;
}
function renderMovements() {
  const q = state.query.toLowerCase();
  const rows = [...data.movements].sort((a, b) => new Date(b.date) - new Date(a.date)).filter(m => !q || [m.id, m.type, m.pack, m.from, m.to, m.reason].join(' ').toLowerCase().includes(q)).map(m => `<tr><td class="mono">${esc(m.id)}</td><td>${dateTime(m.date)}</td><td><span class="badge ${m.type === 'Výdej' ? 'danger' : m.type === 'Příjem' ? 'ok' : 'accent'}">${esc(m.type)}</span></td><td class="mono">${esc(m.pack)}</td><td>${esc(m.from)} → ${esc(m.to)}</td><td class="mono">${m.qty === 0 ? '—' : (m.qty > 0 ? '+' : '') + money(m.qty) + ' g'}</td><td>${esc(m.reason || '')}</td></tr>`).join('');
  document.getElementById('view-movements').innerHTML = `<div class="page-head"><div><div class="eyebrow">Audit / Ledger</div><h1>Pohyby</h1><div class="sub">Append-only historie příjmů, výdejů a přesunů.</div></div></div><div class="table-card"><div class="table-toolbar"><input class="filter-input" placeholder="Hledat v pohybech…" value="${esc(state.query)}" oninput="state.query=this.value;renderMovements()"></div><div class="table-wrap"><table class="table"><thead><tr><th>ID</th><th>Čas</th><th>Typ</th><th>Pytel</th><th>Trasa</th><th>Množství</th><th>Důvod</th></tr></thead><tbody>${rows || '<tr><td colspan="7"><div class="empty">Žádné pohyby.</div></td></tr>'}</tbody></table></div></div>`;
}
function dialog(content) { const d = document.getElementById('actionDialog'); d.innerHTML = content; d.showModal(); }
function closeDialog() { document.getElementById('actionDialog').close(); }
function openReceive() {
  dialog(`<form class="modal-form" onsubmit="submitReceive(event)"><div class="modal-head"><div><div class="eyebrow">Sklad / Příjem</div><h2>Nový pytel</h2></div><button type="button" class="icon-btn" onclick="closeDialog()">×</button></div><label>Surovina<select name="material" required>${data.materials.map(m => `<option value="${m.id}">${esc(m.name)}</option>`).join('')}</select></label><div class="form-grid"><label>Hmotnost (g)<input name="qty" type="number" min="1" step="1" required></label><label>Šarže<input name="lot" required maxlength="40"></label></div><div class="form-grid"><label>Datum příjmu<input name="received" type="date" value="${todayISO()}" required></label><label>Expirace<input name="expiry" type="date" required></label></div><div class="form-grid"><label>Box<select name="box" required>${data.boxes.map(b => `<option value="${b.id}">${b.id}</option>`).join('')}</select></label><label>Pozice<select name="position" required>${data.positions.map(p => `<option value="${p.id}">${p.id}</option>`).join('')}</select></label></div><label>Stav balení<select name="packState"><option value="original">Originál</option><option value="opened">Otevřený</option></select></label><div class="modal-actions"><button type="button" class="ghost-btn" onclick="closeDialog()">Zrušit</button><button class="primary-btn">Přijmout do skladu</button></div></form>`);
}
function submitReceive(e) {
  e.preventDefault(); const f = new FormData(e.currentTarget); const qty = Number(f.get('qty')); const expiry = String(f.get('expiry')); const received = String(f.get('received'));
  if (!qty || qty <= 0) return toast('Hmotnost musí být větší než 0 g.', true);
  if (expiry < received) return toast('Expirace nesmí být před datem příjmu.', true);
  const position = String(f.get('position')); if (activePacks().some(p => p.position === position && p.box === String(f.get('box')) && p.qty > 0)) return toast('Na této pozici je v tomto boxu již aktivní pytel.', true);
  const id = nextId('P-2026', 'nextPack'); const pack = { id, material: String(f.get('material')), lot: String(f.get('lot')).trim(), received, expiry, qty, initialQty: qty, box: String(f.get('box')), position, packState: String(f.get('packState')) };
  data.packs.push(pack); recordMovement({ type: 'Příjem', pack: id, qty, from: 'Příjem', to: position, reason: 'Příjem zásoby' }); closeDialog(); saveMutation('Příjem ' + id); toast(`Příjem ${id} zapsán.`);
}
window.openReceive = openReceive; window.submitReceive = submitReceive;
function fifoCandidates(materialId) { return activePacks().filter(p => p.material === materialId).sort((a, b) => { const ea = a.expiry || '9999-12-31', eb = b.expiry || '9999-12-31'; return ea.localeCompare(eb) || a.received.localeCompare(b.received) || a.id.localeCompare(b.id); }); }
function openIssue(packId) {
  const p = data.packs.find(x => x.id === packId); if (!p) return;
  const candidates = fifoCandidates(p.material); const rank = candidates.findIndex(x => x.id === p.id) + 1;
  dialog(`<form class="modal-form" onsubmit="submitIssue(event)"><div class="modal-head"><div><div class="eyebrow">Výdej / FIFO + FEFO</div><h2>Výdej ze skladu</h2></div><button type="button" class="icon-btn" onclick="closeDialog()">×</button></div><div class="notice">${esc(materialName(p.material))} · doporučené pořadí <strong>#${rank}</strong> · ${esc(p.id)} · ${money(p.qty)} g dostupných</div><div class="form-grid"><label>Pytel<select name="pack" required>${candidates.map(x => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>#${candidates.indexOf(x)+1} · ${x.id} · ${money(x.qty)} g · exp. ${x.expiry}</option>`).join('')}</select></label><label>Množství (g)<input name="qty" type="number" min="1" max="${p.qty}" step="1" required></label></div><label>Důvod<input name="reason" value="Výdej" maxlength="100"></label><div class="modal-actions"><button type="button" class="ghost-btn" onclick="closeDialog()">Zrušit</button><button class="primary-btn">Potvrdit výdej</button></div></form>`);
}
function submitIssue(e) {
  e.preventDefault(); const f = new FormData(e.currentTarget); const id = String(f.get('pack')); const p = data.packs.find(x => x.id === id); const qty = Number(f.get('qty'));
  if (!p || !Number.isInteger(qty) || qty <= 0 || qty > p.qty) return toast('Neplatné množství výdeje.', true);
  const from = p.position; p.qty -= qty; if (p.qty === 0) p.packState = 'opened'; else p.packState = 'opened'; recordMovement({ type: 'Výdej', pack: id, qty: -qty, from, to: 'Výdej', reason: String(f.get('reason') || 'Výdej') }); closeDialog(); saveMutation('Výdej ' + id); toast(`Výdej ${money(qty)} g z ${id}.`);
}
window.openIssue = openIssue; window.submitIssue = submitIssue;
function openMove(packId) {
  const p = data.packs.find(x => x.id === packId); if (!p) return;
  dialog(`<form class="modal-form" onsubmit="submitMove(event)"><div class="modal-head"><div><div class="eyebrow">Sklad / Přesun</div><h2>${esc(p.id)}</h2></div><button type="button" class="icon-btn" onclick="closeDialog()">×</button></div><div class="notice">Aktuálně: <strong>${esc(p.position)}</strong> · ${esc(p.box)} · ${money(p.qty)} g</div><div class="form-grid"><label>Box<select name="box" required>${data.boxes.map(b => `<option value="${b.id}" ${b.id === p.box ? 'selected' : ''}>${b.id}</option>`).join('')}</select></label><label>Pozice<select name="position" required>${data.positions.map(x => `<option value="${x.id}" ${x.id === p.position ? 'selected' : ''}>${x.id}</option>`).join('')}</select></label></div><label>Důvod<input name="reason" value="Změna pozice" maxlength="100"></label><div class="modal-actions"><button type="button" class="ghost-btn" onclick="closeDialog()">Zrušit</button><button class="primary-btn">Přesunout</button></div></form>`);
}
function submitMove(e) {
  e.preventDefault(); const f = new FormData(e.currentTarget); const id = String(e.currentTarget.querySelector('[name="box"]').closest('form')?.dataset?.pack || '');
  const title = e.currentTarget.querySelector('h2')?.textContent?.trim(); const p = data.packs.find(x => x.id === title); if (!p) return toast('Pytel nebyl nalezen.', true);
  const box = String(f.get('box')); const position = String(f.get('position')); if (activePacks().some(x => x.id !== p.id && x.box === box && x.position === position)) return toast('Cílová pozice je obsazená jiným aktivním pytlem.', true);
  const from = p.position; p.box = box; p.position = position; recordMovement({ type: 'Přesun', pack: p.id, qty: 0, from, to: position, reason: String(f.get('reason') || 'Přesun') }); closeDialog(); saveMutation('Přesun ' + p.id); toast(`Přesun ${p.id} → ${position}.`);
}
window.openMove = openMove; window.submitMove = submitMove;
function openMaterial() { dialog(`<form class="modal-form" onsubmit="submitMaterial(event)"><div class="modal-head"><div><div class="eyebrow">Katalog</div><h2>Nová surovina</h2></div><button type="button" class="icon-btn" onclick="closeDialog()">×</button></div><div class="form-grid"><label>ID<input name="id" placeholder="S-006" maxlength="20" required></label><label>Minimum (g)<input name="min" type="number" min="0" step="1" value="0" required></label></div><label>Název<input name="name" maxlength="120" required></label><div class="modal-actions"><button type="button" class="ghost-btn" onclick="closeDialog()">Zrušit</button><button class="primary-btn">Přidat surovinu</button></div></form>`); }
function submitMaterial(e) { e.preventDefault(); const f = new FormData(e.currentTarget); const id = String(f.get('id')).trim(); const name = String(f.get('name')).trim(); const min = Number(f.get('min')); if (!id || !name || min < 0) return toast('Vyplňte platná data.', true); if (data.materials.some(m => m.id === id)) return toast('ID suroviny již existuje.', true); data.materials.push({ id, name, min, unit: 'g' }); closeDialog(); saveMutation('Nová surovina ' + id); toast(`Surovina ${id} přidána.`); }
window.openMaterial = openMaterial; window.submitMaterial = submitMaterial;
function openSlot(position) { const packs = activePacks().filter(p => p.position === position); dialog(`<div class="modal-form"><div class="modal-head"><div><div class="eyebrow">Sklad / Pozice</div><h2>${esc(position)}</h2></div><button class="icon-btn" onclick="closeDialog()">×</button></div>${packs.map(p => `<div class="notice"><strong>${esc(p.id)}</strong> · ${esc(materialName(p.material))}<br><span>${money(p.qty)} g · ${esc(p.box)} · šarže ${esc(p.lot)} · exp. ${esc(p.expiry)}</span><div class="actions" style="margin-top:9px"><button class="mini-btn" onclick="closeDialog();openIssue('${p.id}')">Výdej</button><button class="mini-btn" onclick="closeDialog();openMove('${p.id}')">Přesun</button></div></div>`).join('')}</div>`); }
window.openSlot = openSlot;
function exportXlsx() { const wb = XLSX.utils.book_new(); const maps = [['suroviny', data.materials.map(m => ({ idSur: m.id, Surovina: m.name, minimum_g: m.min }))], ['pytle', data.packs.map(p => ({ idPack:p.id, Surovina:materialName(p.material), 'obsah surovina/mix':materialName(p.material), 'hmotnost g':p.qty, 'původní g':p.initialQty, 'šarže':p.lot, expirace:p.expiry, box:p.box, pozice:p.position, stav:p.packState }))], ['box', data.boxes], ['pozice', data.positions], ['pohyby', data.movements]]; for (const [name, rows] of maps) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), name); XLSX.writeFile(wb, `botanic-wms-${todayISO()}.xlsx`); }
window.exportXlsx = exportXlsx;
function parseExcel(workbook) { const rows = name => workbook.Sheets[name] ? XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '' }) : []; const suroviny = rows('suroviny').length ? rows('suroviny') : rows('nob'); const pytle = rows('pytle'); const boxy = rows('box'); const pozice = rows('pozice'); if (suroviny.length) data.materials = suroviny.map((r, i) => ({ id: String(r.Column_2 || r.idSur || r['idSur'] || r.Column2 || `S-${String(i + 1).padStart(3, '0')}`), name: String(r.Surovina || r.surovina || '').trim(), unit: 'g', min: Number(r.minimum_g || 0) })).filter(x => x.name && x.id); if (boxy.length) data.boxes = boxy.map((r, i) => ({ id: String(r.idBox || `B-${i + 1}`) })); if (pozice.length) data.positions = pozice.map((r, i) => ({ id: String(r.idPozice || r.pozice || `A${i + 1}`) })).filter(x => x.id); if (!data.positions.length) data.positions = deepClone(seed.positions); if (!data.boxes.length) data.boxes = deepClone(seed.boxes); if (pytle.length) data.packs = pytle.map((r, i) => { const rawId = String(r.idPack || `P-IMPORT-${String(i + 1).padStart(3, '0')}`); const matName = String(r['obsah surovina/mix'] || r.Surovina || '').trim(); const mat = data.materials.find(m => m.name === matName) || data.materials[0]; const qty = Number(r['hmotnost g'] || r.gramy || 0); return { id: rawId, material: mat?.id, lot: String(r.šarže || r.lot || 'IMPORT'), received: todayISO(), expiry: String(r.expirace || `${new Date().getFullYear() + 1}-12-31`), qty, initialQty: Number(r['původní g'] || r['hmotnost g'] || r.gramy || 0), box: String(r.box || data.boxes[i % data.boxes.length].id), position: String(r.pozice || data.positions[i % data.positions.length].id), packState: String(r.stav || 'original') === 'opened' ? 'opened' : 'original' }; }).filter(p => p.material && p.qty >= 0); data.meta.nextPack = Math.max(data.meta.nextPack || 1, data.packs.length + 1); saveMutation('Import XLSX'); }
function importXlsx(file) { const reader = new FileReader(); reader.onload = e => { try { const wb = XLSX.read(e.target.result, { type: 'array' }); parseExcel(wb); toast('XLSX import dokončen.'); } catch (err) { toast('Import se nepodařil: ' + err.message, true); } }; reader.readAsArrayBuffer(file); }
function resetData() { if (!confirm('Resetovat lokální data na demo stav? Tato operace smaže místní změny.')) return; data = deepClone(seed); localStorage.removeItem(QUEUE_KEY); persist(); toast('Demo data obnovena.'); }
function wire() { document.querySelectorAll('.nav-item[data-view]').forEach(b => b.addEventListener('click', () => setView(b.dataset.view))); document.getElementById('quickReceive').addEventListener('click', openReceive); document.getElementById('refreshBtn').addEventListener('click', () => { try { ensureValid(); render(); toast('Kontrola konzistence OK.'); } catch (e) { toast(e.message, true); } }); document.getElementById('globalSearch').addEventListener('input', e => { state.query = e.target.value; if (state.view !== 'inventory' && state.view !== 'movements') state.view = 'inventory'; render(); }); document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open')); document.getElementById('btnImport').addEventListener('click', () => document.getElementById('fileInput').click()); document.getElementById('btnExport').addEventListener('click', exportXlsx); document.getElementById('btnReset').addEventListener('click', resetData); document.getElementById('fileInput').addEventListener('change', e => { const file = e.target.files?.[0]; if (file) importXlsx(file); e.target.value = ''; }); window.addEventListener('online', () => { const q = queueLoad(); if (q.length) toast(`${q.length} lokálních změn je připraveno k synchronizaci.`); }); }
wire();
Object.defineProperty(window, 'data', { configurable: true, get: () => data });
render();
