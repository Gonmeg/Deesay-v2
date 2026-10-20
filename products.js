// products.js (v20261020b) — หน้า "สินค้า & ราคา" (page id: products)
// (2026-10-20) รวมข้อมูลสินค้า · Mock / RSP · Rank ราคา · ช่องทางที่ขาย · การวางแผน / Lead time ไว้หน้าเดียว
//   แทนแท็บสินค้าใน admin.html และชีท Google "Price Rank" (ย้ายข้อมูลมาแล้ว · เลิกดึงชีท)
//   ใครเปิดหน้านี้ได้ก็ดูได้ · แก้ได้เฉพาะผู้ดูแลระบบ หรือคนที่มีสิทธิ์ "จัดการสินค้า" (RPC product_page.can_edit)
//   Rank: ราคากลาง (ทุกช่องทาง) + ราคาต่างรายช่องทาง (เก็บเฉพาะช่องที่ต่าง) + ช่องทางที่ไม่ขาย → v_price_rank ใช้เช็ค Rank ตอนขอโปร
//   RSP = ราคาขายจริง · ของแถม (สถานะ) ไม่ถูกแบ่งยอดขาย — ฐานข้อมูลคิดให้เอง (trigger products_rsp_sync)
//   (2026-10-20 b) การวางแผน = ซ่อน: คนทั่วไปไม่เห็น (RPC ไม่ส่งมา) · คนแก้ได้เห็นในแท็บ "ซ่อน" แยก ไม่ปนแท็บอื่น
//                  ราคา Rank ช่องไหนมีบางช่องทางตั้งราคาต่าง → ขีดเส้นประ กดดูว่าช่องทางไหนราคาเท่าไร
(function () {
  'use strict';
  const CATS = [['สินค้าเดี่ยว', 'เดี่ยว'], ['สินค้าเซ็ต', 'เซ็ต']];
  const ST = { Existing: ['ขายอยู่', 'ok'], NPD: ['NPD', 'npd'], GWP: ['ของแถม', 'gwp'], Discontinued: ['เลิกขาย', 'off'] };
  const PLAN = { plan: ['วางแผนปกติ', 'p1'], watch: ['ดูเฉย ๆ', 'p2'], hidden: ['ซ่อน', 'p3'] };
  const S = { data: null, chip: 'all', plan: '', q: '' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = v => v == null || v === '' || isNaN(+v) ? null : +v;
  const n0 = v => v == null ? '' : (+v).toLocaleString('th-TH', { maximumFractionDigits: 2 });
  const dash = '<span class="pp-mu">—</span>';
  const tip = t => ` <span class="pp-i" data-tip="${esc(t)}">i</span>`;
  const toastMsg = m => (window.toast ? window.toast(m) : null);
  const rpc = (fn, args) => window.Auth.rpc(fn, args || {});

  function style() {
    if (document.getElementById('ppStyle')) return;
    const st = document.createElement('style'); st.id = 'ppStyle';
    st.textContent = `
      #page-products { padding-bottom:40px; }
      .pp-chips { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 12px; }
      .pp-chip { border:1px solid var(--border); background:var(--bg2); border-radius:99px; padding:5px 13px; font:inherit; font-size:13px; color:var(--text2); font-weight:500; cursor:pointer; }
      .pp-chip b { color:var(--text); margin-left:5px; font-weight:700; }
      .pp-chip.w { border-color:#f3c37e; background:#fff7ea; color:#b45309; } .pp-chip.w b { color:#b45309; }
      body:not(.light-theme) .pp-chip.w { background:rgba(245,158,11,.12); border-color:rgba(245,158,11,.4); color:#fbbf24; } body:not(.light-theme) .pp-chip.w b { color:#fbbf24; }
      .pp-chip.h { margin-left:auto; border-style:dashed; }
      .pp-chip[aria-pressed="true"] { background:var(--accent); border-color:var(--accent); color:#111; } .pp-chip[aria-pressed="true"] b { color:#111; }
      .pp-bar { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
      .pp-in { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:9px 13px; font:inherit; font-size:13.5px; color:var(--text); outline:none; }
      .pp-in:focus { border-color:var(--accent); }
      .pp-btn { border:0; border-radius:10px; padding:9px 16px; font:inherit; font-weight:700; font-size:13.5px; background:var(--accent); color:#111; cursor:pointer; white-space:nowrap; }
      .pp-btn.ghost { background:none; border:1px solid var(--border); color:var(--text2); } .pp-btn:disabled { opacity:.5; cursor:default; }
      .pp-card { background:var(--bg2); border:1px solid var(--border); border-radius:14px; overflow-x:auto; }
      table.pp-t { width:100%; border-collapse:collapse; font-size:13.5px; min-width:1000px; }
      .pp-t th { font-size:12px; color:var(--text3); font-weight:600; padding:11px 12px; border-bottom:1px solid var(--border); white-space:nowrap; text-align:center; }
      .pp-t th.grp { border-bottom:0; padding-bottom:2px; color:var(--text2); } .pp-t th.sub { padding-top:2px; }
      .pp-t td { padding:10px 12px; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; text-align:center; font-variant-numeric:tabular-nums; }
      .pp-t th:first-child, .pp-t td:first-child { text-align:left; padding-left:18px; }
      .pp-t tbody tr { cursor:pointer; } .pp-t tbody tr:hover td { background:var(--bg3); } .pp-t tbody tr:last-child td { border-bottom:0; }
      .pp-t .gl { border-left:1px solid var(--border); } .pp-t td.rk { font-weight:500; min-width:50px; }
      .pp-sku { font-weight:700; font-size:13.5px; } .pp-nm { font-size:12.5px; color:var(--text2); margin-top:1px; } .pp-mu { color:var(--text3); }
      .pp-st, .pp-pl, .pp-wb { display:inline-block; font-size:11.5px; font-weight:600; padding:2px 10px; border-radius:99px; white-space:nowrap; }
      .pp-st.ok, .pp-pl.p1 { background:rgba(34,197,94,.13); color:#15803d; } .pp-st.npd { background:rgba(59,130,246,.12); color:#1d4ed8; }
      .pp-st.gwp { background:rgba(168,85,247,.12); color:#7e22ce; } .pp-st.off, .pp-pl.p3 { background:var(--bg3); color:var(--text3); }
      .pp-pl.p2 { background:rgba(245,158,11,.15); color:#b45309; } .pp-wb { background:#fff1e3; color:#c2410c; margin-left:6px; font-size:11px; }
      body:not(.light-theme) .pp-st.ok, body:not(.light-theme) .pp-pl.p1 { color:#4ade80; } body:not(.light-theme) .pp-st.npd { color:#93c5fd; }
      body:not(.light-theme) .pp-st.gwp { color:#d8b4fe; } body:not(.light-theme) .pp-pl.p2 { color:#fbbf24; } body:not(.light-theme) .pp-wb { background:rgba(234,88,12,.15); color:#fdba74; }
      .pp-i { display:inline-flex; width:15px; height:15px; border-radius:50%; border:1px solid var(--text3); color:var(--text3); font-size:9.5px; font-weight:700; align-items:center; justify-content:center; font-style:normal; cursor:default; vertical-align:1px; }
      .pp-empty { padding:40px; text-align:center; color:var(--text3); }
      .pp-dv { border:0; background:none; font:inherit; color:inherit; padding:0 1px; cursor:pointer; border-bottom:1.5px dashed #d97706; line-height:1.25; }
      .pp-dv:hover { color:#b45309; } body:not(.light-theme) .pp-dv:hover { color:#fbbf24; }
      .pp-dpop { position:absolute; z-index:9000; min-width:220px; max-width:320px; background:var(--bg2); border:1px solid var(--border); border-radius:12px; box-shadow:0 14px 40px rgba(0,0,0,.18); padding:10px 12px; font-size:12.5px; color:var(--text); }
      .pp-dpop .t { font-weight:700; font-size:13px; margin-bottom:6px; }
      .pp-dpop .r { display:flex; justify-content:space-between; gap:14px; padding:4px 0; border-top:1px solid var(--border); color:var(--text2); }
      .pp-dpop .r b { color:var(--text); font-variant-numeric:tabular-nums; } .pp-dpop .r.d b { color:#b45309; } body:not(.light-theme) .pp-dpop .r.d b { color:#fbbf24; }
      /* แผงแก้สินค้า */
      .pp-dh { display:flex; align-items:center; gap:10px; } .pp-dh h3 { font-size:18px; margin:0; font-weight:700; color:var(--text); }
      .pp-dm { font-size:12px; color:var(--text3); margin:2px 0 14px; }
      .pp-sec { border:1px solid var(--border); border-radius:12px; padding:14px 16px; margin-bottom:12px; background:var(--bg2); }
      .pp-sh { font-size:13.5px; font-weight:700; margin:0 0 12px; display:flex; align-items:center; gap:6px; color:var(--text); }
      .pp-g2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .pp-lb { display:flex; align-items:center; gap:5px; font-size:12px; color:var(--text2); font-weight:600; margin-bottom:5px; }
      .pp-f { width:100%; box-sizing:border-box; background:var(--bg); border:1px solid var(--border); border-radius:9px; padding:8px 11px; font:inherit; font-size:13.5px; color:var(--text); outline:none; font-variant-numeric:tabular-nums; }
      .pp-f:focus { border-color:var(--accent); } .pp-f:disabled { opacity:.75; }
      .pp-seg { display:inline-flex; border:1px solid var(--border); border-radius:9px; overflow:hidden; }
      .pp-seg button { border:0; background:none; padding:7px 12px; font:inherit; font-size:12.5px; color:var(--text2); font-weight:500; cursor:pointer; }
      .pp-seg button + button { border-left:1px solid var(--border); } .pp-seg button[aria-pressed="true"] { background:var(--accent); color:#111; font-weight:700; }
      .pp-seg button:disabled { cursor:default; }
      .pp-tags { display:flex; flex-wrap:wrap; gap:6px; align-items:center; border:1px solid var(--border); border-radius:9px; background:var(--bg); padding:6px; }
      .pp-tag { display:inline-flex; align-items:center; gap:6px; background:var(--bg2); border:1px solid var(--border); border-radius:7px; padding:3px 6px 3px 9px; font-size:12.5px; font-weight:600; color:var(--text); }
      .pp-tag button { border:0; background:none; color:var(--text3); font-size:11px; cursor:pointer; padding:0 2px; }
      .pp-tadd { flex:1; min-width:140px; border:0; background:none; font:inherit; font-size:12.5px; color:var(--text); outline:none; padding:3px 6px; }
      .pp-rg { display:grid; grid-template-columns:70px repeat(3, 1fr); gap:8px; align-items:center; }
      .pp-rg .h { font-size:11.5px; color:var(--text3); font-weight:600; text-align:center; } .pp-rg .l { font-size:12.5px; font-weight:600; color:var(--text2); }
      .pp-rg .pp-f { text-align:right; }
      .pp-chs { display:grid; grid-template-columns:1fr 1fr; gap:10px 18px; position:relative; }
      .pp-cgt { font-size:11.5px; color:var(--text3); font-weight:600; margin:0 0 4px; }
      .pp-cr { display:flex; align-items:center; gap:9px; padding:5px 6px; margin:0 -6px; border-radius:7px; font-size:13px; color:var(--text); }
      .pp-cr:hover { background:var(--bg3); } .pp-cr .cn { flex:1; font-weight:500; }
      .pp-cr input { width:16px; height:16px; accent-color:var(--accent); margin:0; cursor:pointer; }
      .pp-dt { font-size:10.5px; font-weight:700; color:#b45309; background:#fff4e2; border-radius:99px; padding:1px 8px; }
      body:not(.light-theme) .pp-dt { background:rgba(245,158,11,.15); color:#fbbf24; }
      .pp-off { font-size:11px; color:var(--text3); }
      .pp-pen { border:0; background:none; color:var(--text3); font-size:13px; cursor:pointer; opacity:0; padding:0 2px; } .pp-cr:hover .pp-pen, .pp-pen:focus { opacity:1; }
      .pp-pop { position:absolute; right:-6px; width:300px; background:var(--bg2); border:1px solid var(--border); border-radius:12px; box-shadow:0 14px 40px rgba(0,0,0,.18); padding:12px 14px; z-index:30; }
      .pp-pop .ph { display:flex; justify-content:space-between; align-items:center; font-size:14px; font-weight:700; color:var(--text); }
      .pp-pop .ph button { border:0; background:none; color:var(--text3); cursor:pointer; font-size:12px; }
      .pp-pop .ps { font-size:11.5px; color:var(--text3); margin:2px 0 10px; }
      .pp-mg { display:grid; grid-template-columns:40px repeat(3, 1fr); gap:6px; align-items:center; padding:8px; border:1px solid var(--border); border-radius:9px; background:var(--bg); }
      .pp-mg .h { font-size:10.5px; color:var(--text3); text-align:center; font-weight:600; } .pp-mg .l { font-size:11.5px; color:var(--text2); font-weight:600; }
      .pp-mg .pp-f { padding:5px 7px; text-align:right; font-size:12.5px; background:var(--bg2); }
      .pp-mg .pp-f.dv { background:#fff4e2; border-color:#f3c37e; color:#9a3412; font-weight:700; }
      body:not(.light-theme) .pp-mg .pp-f.dv { background:rgba(245,158,11,.14); border-color:rgba(245,158,11,.45); color:#fbbf24; }
      .pp-pf { display:flex; justify-content:space-between; align-items:center; margin-top:10px; }
      .pp-lk { border:0; background:none; font:inherit; font-size:11.5px; color:var(--text2); text-decoration:underline; cursor:pointer; padding:0; }
      .pp-ft { display:flex; justify-content:flex-end; gap:8px; margin-top:6px; position:sticky; bottom:0; padding:10px 0 4px; background:linear-gradient(to bottom, transparent, var(--bg2) 30%); }
      .pp-ro { font-size:12px; color:var(--text3); margin:0 0 12px; }
    `;
    document.head.appendChild(st);
  }

  // ---------- ข้อมูล ----------
  function index(d) {
    const base = {}, ovr = {}, off = {};
    (d.base || []).forEach(([sku, cat, rk, pr]) => { ((base[sku] = base[sku] || {})[cat] = base[sku][cat] || {})[rk] = num(pr); });
    (d.ovr || []).forEach(([sku, ch, cat, rk, pr]) => { (((ovr[sku] = ovr[sku] || {})[ch] = ovr[sku][ch] || {})[cat] = ovr[sku][ch][cat] || {})[rk] = num(pr); });
    (d.off || []).forEach(([sku, ch]) => { (off[sku] = off[sku] || new Set()).add(ch); });
    d._base = base; d._ovr = ovr; d._off = off;
    d.products.forEach(p => { p.hasRank = !!base[p.sku]; p.noPrice = !(+p.rsp > 0) || !(+p.mock > 0); });
    return d;
  }
  async function load() {
    S.data = index(await rpc('product_page'));
  }

  // ---------- หน้ารายการ ----------
  const isHidden = p => (p.plan || 'plan') === 'hidden';
  function visible() {
    const q = S.q.trim().toLowerCase();
    return S.data.products.filter(p => {
      if ((S.chip === 'hidden') !== isHidden(p)) return false;
      if (S.chip === 'noprice' && !p.noPrice) return false;
      if (S.chip === 'norank' && p.hasRank) return false;
      if (ST[S.chip] && p.status !== S.chip) return false;
      if (S.plan && (p.plan || 'plan') !== S.plan) return false;
      if (q && !(p.sku.toLowerCase().includes(q) || (p.name || '').toLowerCase().includes(q) || (p.kids || []).some(k => k.toLowerCase().includes(q)))) return false;
      return true;
    });
  }
  // ช่องราคา Rank ที่บางช่องทางตั้งราคาต่าง (ไม่นับช่องทางที่ไม่ขาย) → { 'สินค้าเซ็ต|3': [[label, price], …] }
  function diffs(sku) {
    const o = S.data._ovr[sku] || {}, off = S.data._off[sku] || new Set(), out = {};
    S.data.channels.forEach(([ch, g, l]) => { const lb = g === 'TikTok' ? 'TikTok ' + l : l; if (off.has(ch) || !o[ch]) return;
      Object.entries(o[ch]).forEach(([cat, rs]) => Object.entries(rs).forEach(([r, v]) => { if (v == null) return; (out[cat + '|' + r] = out[cat + '|' + r] || []).push([lb, v]); })); });
    return out;
  }
  function showDiff(btn) {
    closeDiff();
    const [sku, cat, r] = btn.dataset.dv.split('|'), p = S.data.products.find(x => x.sku === sku) || {};
    const base = ((S.data._base[sku] || {})[cat] || {})[r], list = diffs(sku)[cat + '|' + r] || [];
    const by = {}; list.forEach(([lb, v]) => { (by[v] = by[v] || []).push(lb); });
    const pop = document.createElement('div'); pop.className = 'pp-dpop'; pop.id = 'ppDiffPop';
    pop.innerHTML = `<div class="t">${esc(p.name || sku)} · ${cat === 'สินค้าเซ็ต' ? 'เซ็ต' : 'เดี่ยว'} R${r}</div>
      <div class="r"><span>ราคากลาง</span><b>${n0(base)}</b></div>
      ${Object.entries(by).map(([v, lbs]) => `<div class="r d"><span>${lbs.map(esc).join(' · ')}</span><b>${+v === 0 ? 'ไม่ขาย' : n0(v)}</b></div>`).join('')}`;
    document.body.appendChild(pop);
    const rc = btn.getBoundingClientRect(), pw = pop.offsetWidth;
    pop.style.top = (window.scrollY + rc.bottom + 6) + 'px';
    pop.style.left = Math.max(8, Math.min(window.scrollX + rc.left + rc.width / 2 - pw / 2, window.scrollX + document.documentElement.clientWidth - pw - 8)) + 'px';
  }
  function closeDiff() { const x = document.getElementById('ppDiffPop'); if (x) x.remove(); }
  document.addEventListener('mousedown', e => { if (!e.target.closest('#ppDiffPop') && !e.target.closest('.pp-dv')) closeDiff(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDiff(); });
  window.addEventListener('scroll', closeDiff, true);
  function rowHtml(p) {
    const b = S.data._base[p.sku] || {};
    const dif = diffs(p.sku);
    const rk = (cat, i) => { const v = (b[cat] || {})[i], d = dif[cat + '|' + i];
      return `<td class="rk${i === 1 ? ' gl' : ''}">${!v ? dash : d ? `<button type="button" class="pp-dv" data-dv="${esc(p.sku)}|${cat}|${i}">${n0(v)}</button>` : n0(v)}</td>`; };
    const st = ST[p.status] || [p.status || '—', 'off'], pl = PLAN[p.plan || 'plan'] || PLAN.plan;
    return `<tr data-sku="${esc(p.sku)}"><td><div class="pp-sku">${esc(p.sku)}${p.hasRank ? '' : '<span class="pp-wb">ยังไม่มีราคา Rank</span>'}</div><div class="pp-nm">${esc(p.name || '')}</div></td>
      <td><span class="pp-st ${st[1]}">${st[0]}</span></td><td>${+p.mock > 0 ? n0(p.mock) : dash}</td><td>${+p.rsp > 0 ? n0(p.rsp) : dash}</td>
      ${[1, 2, 3].map(i => rk('สินค้าเดี่ยว', i)).join('')}${[1, 2, 3].map(i => rk('สินค้าเซ็ต', i)).join('')}
      <td><span class="pp-pl ${pl[1]}">${pl[0]}</span></td><td>${p.lead == null ? dash : p.lead}</td></tr>`;
  }
  function renderList() {
    const box = document.getElementById('ppList'); if (!box) return;
    const L = visible();
    box.innerHTML = L.length ? `<table class="pp-t" data-no-sort data-no-page>
      <thead><tr><th rowspan="2">สินค้า</th><th rowspan="2">สถานะ</th><th rowspan="2">Mock</th><th rowspan="2">RSP</th><th colspan="3" class="grp gl">Rank เดี่ยว</th><th colspan="3" class="grp gl">Rank เซ็ต</th><th rowspan="2">การวางแผน</th><th rowspan="2">Lead time</th></tr>
      <tr><th class="sub gl">R1</th><th class="sub">R2</th><th class="sub">R3</th><th class="sub gl">R1</th><th class="sub">R2</th><th class="sub">R3</th></tr></thead>
      <tbody>${L.map(rowHtml).join('')}</tbody></table>` : '<div class="pp-empty">ไม่มีสินค้าที่ตรงกับตัวกรอง</div>';
    box.querySelectorAll('tr[data-sku]').forEach(tr => tr.onclick = e => { const dv = e.target.closest('.pp-dv'); if (dv) { e.stopPropagation(); showDiff(dv); return; } closeDiff(); openEdit(tr.dataset.sku); });
  }
  function renderPage() {
    const el = document.getElementById('page-products'); if (!el) return;
    const P = S.data.products.filter(p => !isHidden(p)), nHid = S.data.products.length - P.length, cnt = f => P.filter(f).length;
    const chips = [['all', 'ทั้งหมด', P.length], ['Existing', 'ขายอยู่', cnt(p => p.status === 'Existing')], ['NPD', 'NPD', cnt(p => p.status === 'NPD')],
      ['Discontinued', 'เลิกขาย', cnt(p => p.status === 'Discontinued')], ['GWP', 'ของแถม', cnt(p => p.status === 'GWP')],
      ['noprice', 'ยังไม่มี RSP / Mock', cnt(p => p.noPrice), 'w'], ['norank', 'ยังไม่มีราคา Rank', cnt(p => !p.hasRank), 'w']];
    if (S.data.can_edit) chips.push(['hidden', 'ซ่อน', nHid, 'h']);
    el.innerHTML = `<div class="pp-chips" id="ppChips">${chips.map(([k, t, n, w]) => `<button type="button" class="pp-chip ${w || ''}" data-c="${k}" aria-pressed="${S.chip === k}">${t}<b>${n}</b></button>`).join('')}</div>
      <div class="pp-bar"><input class="pp-in" id="ppQ" style="flex:1;min-width:220px;" placeholder="ค้นหา SKU รหัสลูก หรือชื่อสินค้า…" value="${esc(S.q)}">
        <select class="pp-in" id="ppPlan"><option value="">การวางแผน: ทั้งหมด</option>${Object.entries(PLAN).filter(([k]) => k !== 'hidden').map(([k, v]) => `<option value="${k}" ${S.plan === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select>
        ${S.data.can_edit ? '<button type="button" class="pp-btn" id="ppAdd">+ เพิ่มสินค้า</button>' : ''}</div>
      <div class="pp-card" id="ppList"></div>`;
    el.querySelector('#ppChips').onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; S.chip = b.dataset.c; el.querySelectorAll('#ppChips [data-c]').forEach(x => x.setAttribute('aria-pressed', x === b)); renderList(); };
    el.querySelector('#ppQ').oninput = e => { S.q = e.target.value; renderList(); };
    el.querySelector('#ppPlan').onchange = e => { S.plan = e.target.value; renderList(); };
    const add = el.querySelector('#ppAdd'); if (add) add.onclick = () => openEdit(null);
    renderList();
  }

  // ---------- แผงแก้สินค้า ----------
  function openEdit(sku) {
    const D = S.data, can = !!D.can_edit, isNew = !sku;
    const p = isNew ? { sku: '', name: '', status: 'NPD', mock: null, rsp: null, kids: [], plan: 'plan', lead: 60 } : D.products.find(x => x.sku === sku);
    if (!p) return;
    const b0 = JSON.parse(JSON.stringify(D._base[p.sku] || {})), o0 = JSON.parse(JSON.stringify(D._ovr[p.sku] || {}));
    const E = { sku: p.sku, name: p.name || '', status: p.status || 'Existing', mock: p.mock, rsp: p.rsp, kids: [...(p.kids || [])], plan: p.plan || 'plan', lead: p.lead == null ? 60 : p.lead,
      base: b0, ovr: o0, off: new Set(D._off[p.sku] || []), pop: null };
    window.trOpenShell(isNew ? 'สินค้า · เพิ่มใหม่' : 'สินค้า · รายละเอียด');
    const body = () => document.getElementById('trBody');
    const dis = can ? '' : 'disabled';
    const bv = (cat, rk) => { const v = ((E.base[cat] || {})[rk]); return v == null ? '' : v; };
    const ov = (ch, cat, rk) => { const v = (((E.ovr[ch] || {})[cat] || {})[rk]); return v == null ? null : v; };
    const hasOvr = ch => { const o = E.ovr[ch]; if (!o) return false; return CATS.some(([c]) => [1, 2, 3].some(r => o[c] && o[c][r] != null && o[c][r] !== (E.base[c] || {})[r])); };
    const draw = () => {
      const st = ST[E.status] || ST.Existing;
      const groups = []; D.channels.forEach(([ch, g, lb]) => { let x = groups.find(y => y[0] === g); if (!x) groups.push(x = [g, []]); x[1].push([ch, lb]); });
      body().innerHTML = `
        <div class="pp-dh"><h3>${isNew ? 'เพิ่มสินค้าใหม่' : esc(E.sku) + ' · ' + esc(E.name)}</h3>${isNew ? '' : `<span class="pp-st ${st[1]}">${st[0]}</span>`}</div>
        <div class="pp-dm">${p.updated ? 'แก้ล่าสุด ' + new Date(p.updated).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '&nbsp;'}</div>
        ${can ? '' : '<div class="pp-ro">ดูได้อย่างเดียว · แก้ได้เฉพาะผู้ดูแลระบบหรือคนที่มีสิทธิ์จัดการสินค้า</div>'}
        <div class="pp-sec"><div class="pp-sh">ข้อมูลสินค้า</div>
          ${isNew ? `<div style="margin-bottom:12px;"><div class="pp-lb">รหัสสินค้า (SKU)</div><input class="pp-f" id="ppSku" placeholder="เช่น DSP" style="text-transform:uppercase;"></div>` : ''}
          <div class="pp-g2"><div><div class="pp-lb">ชื่อสินค้า</div><input class="pp-f" id="ppName" value="${esc(E.name)}" ${dis}></div>
            <div><div class="pp-lb">สถานะ${tip('ของแถม = ไม่ถูกแบ่งยอดขายเมื่ออยู่ในออเดอร์เดียวกับสินค้าอื่น (ถ้าขายเดี่ยว ๆ ได้ยอดเต็ม)')}</div>
              <div class="pp-seg" id="ppSt">${Object.entries(ST).map(([k, v]) => `<button type="button" data-v="${k}" aria-pressed="${E.status === k}" ${dis}>${v[0]}</button>`).join('')}</div></div></div>
          <div class="pp-lb" style="margin-top:12px;">รหัสลูก (สี / เบอร์)${tip('รหัสที่อยู่ในไฟล์ออเดอร์ของแต่ละสี / เบอร์ · ลบแล้วยอดขายเก่าไม่หาย แต่ไฟล์ออเดอร์ใหม่ที่ใช้รหัสนั้นจะจับคู่ไม่เจอ')}</div>
          <div class="pp-tags" id="ppKids">${E.kids.map((k, i) => `<span class="pp-tag">${esc(k)}${can ? `<button type="button" data-rmk="${i}" aria-label="ลบ">✕</button>` : ''}</span>`).join('')}
            ${can ? '<input class="pp-tadd" id="ppKidIn" placeholder="พิมพ์รหัสแล้วกด Enter…">' : (E.kids.length ? '' : '<span class="pp-mu" style="font-size:12.5px;padding:3px 6px;">ไม่มี</span>')}</div></div>
        <div class="pp-sec"><div class="pp-sh">ราคา</div><div class="pp-g2">
          <div><div class="pp-lb">Mock (หน้ากล่อง)</div><input class="pp-f" type="number" step="0.01" id="ppMock" value="${E.mock == null ? '' : E.mock}" ${dis}></div>
          <div><div class="pp-lb">RSP (ราคาขายปกติ)</div><input class="pp-f" type="number" step="0.01" id="ppRsp" value="${E.rsp == null ? '' : E.rsp}" ${dis}></div></div></div>
        <div class="pp-sec"><div class="pp-sh">Rank ราคา${tip('ราคาต่ำสุดต่อชิ้นที่ยอมให้ขายในแต่ละ Rank · ใช้กับทุกช่องทางที่ติ๊กไว้ ยกเว้นช่องทางที่ตั้งราคาต่าง\nใช้เช็คคำขอโปรโมชั่น (มากกว่า 1 ชิ้น = ราคาเซ็ต)')}</div>
          <div class="pp-rg"><span></span><span class="h">Rank 1</span><span class="h">Rank 2</span><span class="h">Rank 3</span>
            ${CATS.map(([c, lb]) => `<span class="l">${lb}</span>${[1, 2, 3].map(r => `<input class="pp-f" type="number" step="0.01" data-bc="${c}" data-br="${r}" value="${bv(c, r)}" ${dis}>`).join('')}`).join('')}</div></div>
        <div class="pp-sec"><div class="pp-sh">ช่องทางที่ขาย${tip('ติ๊ก = ขาย · เอาติ๊กออก = ไม่ขายในช่องทางนั้น\nช่องทางที่ราคาไม่เท่าราคากลาง กด ✎ ท้ายแถวเพื่อตั้งราคาเฉพาะช่องทาง')}</div>
          <div class="pp-chs" id="ppChs">${groups.map(([g, list]) => `<div><div class="pp-cgt">${esc(g)}</div>${list.map(([ch, lb]) => {
            const on = !E.off.has(ch);
            return `<label class="pp-cr" data-ch="${esc(ch)}"><input type="checkbox" data-on="${esc(ch)}" ${on ? 'checked' : ''} ${dis}><span class="cn">${esc(lb)}</span>${!on ? '<span class="pp-off">ไม่ขาย</span>' : hasOvr(ch) ? '<span class="pp-dt">ราคาต่าง</span>' : ''}${on ? `<button type="button" class="pp-pen" data-pen="${esc(ch)}" title="ตั้งราคาเฉพาะช่องทาง" aria-label="ตั้งราคาเฉพาะช่องทาง">✎</button>` : ''}</label>`; }).join('')}</div>`).join('')}</div></div>
        <div class="pp-sec"><div class="pp-sh">Supply Chain</div><div class="pp-g2">
          <div><div class="pp-lb">การวางแผน${tip('วางแผนปกติ = อยู่ในแผนสั่งของ · ดูเฉย ๆ = ไม่สั่งซ้ำ ดูการขายอย่างเดียว · ซ่อน = ไม่แสดงในหน้า Supply Chain')}</div>
            <div class="pp-seg" id="ppPlanSeg">${Object.entries(PLAN).map(([k, v]) => `<button type="button" data-v="${k}" aria-pressed="${E.plan === k}" ${dis}>${v[0]}</button>`).join('')}</div></div>
          <div><div class="pp-lb">Lead time (วัน)${tip('จำนวนวันตั้งแต่สั่งจนของเข้าคลัง')}</div><input class="pp-f" type="number" step="1" min="0" id="ppLead" value="${E.lead}" style="max-width:110px;" ${dis}></div></div></div>
        ${can ? `<div class="pp-ft"><button type="button" class="pp-btn ghost" id="ppCancel">ยกเลิก</button><button type="button" class="pp-btn" id="ppSave">บันทึก</button></div>` : ''}`;
      wire();
    };
    const keep = () => {   // เก็บค่าที่พิมพ์ไว้ก่อนวาดใหม่
      const g = id => document.getElementById(id);
      if (g('ppSku')) E.sku = g('ppSku').value.trim().toUpperCase();
      if (g('ppName')) E.name = g('ppName').value;
      if (g('ppMock')) E.mock = num(g('ppMock').value); if (g('ppRsp')) E.rsp = num(g('ppRsp').value); if (g('ppLead')) E.lead = num(g('ppLead').value);
      body().querySelectorAll('[data-bc]').forEach(x => { const c = x.dataset.bc, r = +x.dataset.br, v = num(x.value); (E.base[c] = E.base[c] || {}); if (v == null) delete E.base[c][r]; else E.base[c][r] = v; });
    };
    const closePop = () => { const pp = document.getElementById('ppPop'); if (pp) pp.remove(); E.pop = null; };
    const openPop = ch => {
      closePop(); keep(); E.pop = ch;
      const lb = (D.channels.find(x => x[0] === ch) || [ch, '', ch])[2];
      const row = body().querySelector(`.pp-cr[data-ch="${CSS.escape(ch)}"]`), wrap = document.getElementById('ppChs');
      const pop = document.createElement('div'); pop.className = 'pp-pop'; pop.id = 'ppPop';
      const cell = (c, r) => { const o = ov(ch, c, r), b = (E.base[c] || {})[r], v = o == null ? b : o; return `<input class="pp-f${o != null && o !== b ? ' dv' : ''}" type="number" step="0.01" data-oc="${c}" data-or="${r}" value="${v == null ? '' : v}">`; };
      pop.innerHTML = `<div class="ph"><span>${esc(lb)}</span><button type="button" data-x aria-label="ปิด">✕</button></div><div class="ps">ราคาเฉพาะช่องทางนี้ · ช่องสีส้ม = ต่างจากราคากลาง</div>
        <div class="pp-mg"><span></span><span class="h">R1</span><span class="h">R2</span><span class="h">R3</span>${CATS.map(([c, l]) => `<span class="l">${l}</span>${[1, 2, 3].map(r => cell(c, r)).join('')}`).join('')}</div>
        <div class="pp-pf"><button type="button" class="pp-lk" data-reset>ใช้ราคากลาง</button><button type="button" class="pp-btn" data-ok style="padding:6px 14px;font-size:12.5px;">ตกลง</button></div>`;
      wrap.appendChild(pop);
      const rr = row.getBoundingClientRect(), wr = wrap.getBoundingClientRect(); pop.style.top = (rr.bottom - wr.top + 6) + 'px';
      pop.querySelectorAll('[data-oc]').forEach(x => x.addEventListener('input', () => { const b = (E.base[x.dataset.oc] || {})[+x.dataset.or]; x.classList.toggle('dv', num(x.value) != null && num(x.value) !== b); }));
      const apply = () => {
        const o = {}; pop.querySelectorAll('[data-oc]').forEach(x => { const c = x.dataset.oc, r = +x.dataset.or, v = num(x.value), b = (E.base[c] || {})[r]; if (v != null && v !== b) (o[c] = o[c] || {})[r] = v; });
        if (Object.keys(o).length) E.ovr[ch] = o; else delete E.ovr[ch];
        closePop(); draw();
      };
      pop.querySelector('[data-ok]').onclick = apply;
      pop.querySelector('[data-x]').onclick = closePop;
      pop.querySelector('[data-reset]').onclick = () => { delete E.ovr[ch]; closePop(); draw(); };
      pop.querySelectorAll('input').forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closePop(); } }));
      setTimeout(() => { const f = pop.querySelector('input'); if (f) f.focus(); }, 0);
    };
    const wire = () => {
      const B = body();
      B.querySelectorAll('#ppSt [data-v]').forEach(x => x.onclick = () => { keep(); E.status = x.dataset.v; draw(); });
      B.querySelectorAll('#ppPlanSeg [data-v]').forEach(x => x.onclick = () => { keep(); E.plan = x.dataset.v; draw(); });
      B.querySelectorAll('[data-rmk]').forEach(x => x.onclick = () => { keep(); E.kids.splice(+x.dataset.rmk, 1); draw(); });
      const ki = document.getElementById('ppKidIn');
      if (ki) ki.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); const v = ki.value.trim().toUpperCase().replace(/\s+/g, ''); if (!v) return;
          if (E.kids.includes(v)) { ki.value = ''; return; } keep(); E.kids.push(v); draw(); setTimeout(() => { const n = document.getElementById('ppKidIn'); if (n) n.focus(); }, 0); }
        else if (e.key === 'Backspace' && !ki.value && E.kids.length) { keep(); E.kids.pop(); draw(); setTimeout(() => { const n = document.getElementById('ppKidIn'); if (n) n.focus(); }, 0); }
      });
      B.querySelectorAll('[data-on]').forEach(x => x.onchange = () => { keep(); if (x.checked) E.off.delete(x.dataset.on); else E.off.add(x.dataset.on); draw(); });
      B.querySelectorAll('[data-pen]').forEach(x => x.onclick = e => { e.preventDefault(); e.stopPropagation(); if (!can) return; openPop(x.dataset.pen); });
      // ราคากลางเปลี่ยน → ช่องทางที่ราคาต่าง ถ้าเท่าราคากลางใหม่ก็ไม่นับเป็นราคาต่าง (ตอนบันทึก)
      const cc = document.getElementById('ppCancel'); if (cc) cc.onclick = () => window.trClose();
      const sv = document.getElementById('ppSave'); if (sv) sv.onclick = () => save(sv);
    };
    const save = async btn => {
      keep();
      if (isNew && !E.sku) return uiAlert('ใส่รหัสสินค้า');
      if (!E.name.trim()) return uiAlert('ใส่ชื่อสินค้า');
      const base = [], ovr = [];
      CATS.forEach(([c]) => [1, 2, 3].forEach(r => { const v = (E.base[c] || {})[r]; if (v != null) base.push([c, r, v]); }));
      Object.entries(E.ovr).forEach(([ch, o]) => { if (E.off.has(ch)) return; CATS.forEach(([c]) => [1, 2, 3].forEach(r => { const v = (o[c] || {})[r]; if (v != null && v !== (E.base[c] || {})[r]) ovr.push([ch, c, r, v]); })); });
      if (base.length && base.length < 6) { const ok = await uiConfirm('ราคา Rank ยังกรอกไม่ครบ', { text: 'ช่องที่ว่างจะถือว่ายังไม่มีราคา Rank นั้น', ok: 'บันทึกต่อ' }); if (!ok) return; }
      btn.disabled = true; btn.textContent = 'กำลังบันทึก…';
      try {
        await rpc('product_save', { p: { sku: E.sku, is_new: isNew, name: E.name.trim(), status: E.status, mock: E.mock, rsp: E.rsp, kids: E.kids, plan: E.plan, lead: E.lead,
          base, ovr, off: [...E.off] } });
        toastMsg('บันทึกแล้ว'); window.trClose(); await load(); renderPage();
      } catch (e) { btn.disabled = false; btn.textContent = 'บันทึก'; uiAlert('บันทึกไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
    };
    // ปิดกล่องราคาเฉพาะช่องทางเมื่อคลิกที่อื่น
    body().addEventListener('mousedown', e => { if (E.pop && !e.target.closest('#ppPop') && !e.target.closest('[data-pen]')) closePop(); });
    draw();
    if (isNew) setTimeout(() => { const f = document.getElementById('ppSku'); if (f) f.focus(); }, 50);
  }

  async function render() {
    style();
    const el = document.getElementById('page-products'); if (!el) return;
    if (!S.data) el.innerHTML = '<div class="pp-empty">กำลังโหลด…</div>';
    try { await load(); } catch (e) { el.innerHTML = `<div class="pp-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    renderPage();
  }
  window.ProductsUI = { render };
})();
