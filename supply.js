// supply.js — หน้า Supply Chain ของ dashboard.html (โหลดตอนกดเมนูครั้งแรกเท่านั้น)
// ใช้ของกลางจาก dashboard.html: supaRpc, fmt, fmtB, chartTickColor/chartGridColor, Chart.js, productsMap, CSS (.card/.section-header/.table-wrap/.btn/.ls-input)
// RPC: supply_chain_page() + supply_sku_series(p_sku, p_days) จาก 48_supply_rpc.sql
(function () {
  const fmtN = (n, d = 0) => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toLocaleString('th-TH', { maximumFractionDigits: d, minimumFractionDigits: d });
  const baht = n => (n === null || n === undefined || isNaN(n)) ? '—' : '฿' + fmtN(n);
  const dTH = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—';
  const daysFrom = d => d ? Math.round((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000) : null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const STATUS = {
    stockout: ['var(--red)', 'ขาดสต็อก'], stockout_before_po: ['var(--red)', 'จะขาดก่อนของเข้า'], reorder: ['var(--orange)', 'ถึงจุดสั่ง'],
    ok: ['var(--green)', 'ปกติ'], overstock: ['var(--blue)', 'เกินสต็อก'], dead: ['var(--text3)', 'ไม่เคลื่อนไหว'], inactive: ['var(--text3)', 'เลิกขาย'],
  };
  const ABC_TXT = { A: 'ยอดขายหลัก (80%)', B: 'ยอดขายรอง (15%)', C: 'ยอดขายน้อย (5%)' };
  const XYZ_TXT = { X: 'ขายสม่ำเสมอ', Y: 'แกว่งปานกลาง', Z: 'แกว่งมาก' };
  const pill = (color, text) => `<span style="display:inline-block;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid ${color};color:${color};white-space:nowrap;">${text}</span>`;

  let DATA = null, rows = [], filt = { status: '', abc: '', xyz: '', q: '' }, sort = { key: null, dir: 1 }, selSku = null, chart = null, lastSeries = null, seq = 0;

  function root() { return document.getElementById('page-supply'); }

  async function load() {
    const el = root(); if (!el) return;
    const mySeq = ++seq;
    if (!DATA) el.innerHTML = '<div class="card"><div class="empty">กำลังโหลดแผนสต็อก...</div></div>';
    let data;
    try { data = await supaRpc('supply_chain_page', {}); }
    catch (e) { el.innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)} — ถ้าขึ้น "function not found" แปลว่ายังไม่ได้รัน 48_supply_rpc.sql</div>`; return; }
    if (mySeq !== seq) return;
    if (data && data.message && !data.rows) { el.innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(data.message)}</div>`; return; }
    DATA = data; rows = data.rows || [];
    renderAll();
    if (selSku) loadSku(selSku);
  }

  function matchStatus(r) {
    if (!filt.status) return true;
    if (filt.status === 'need') return ['stockout', 'stockout_before_po', 'reorder'].includes(r.status);
    if (filt.status === 'suggest') return r.suggested_qty > 0;
    return r.status === filt.status;
  }
  function filtered() {
    const q = filt.q.trim().toLowerCase();
    let out = rows.filter(r => matchStatus(r) && (!filt.abc || r.abc === filt.abc) && (!filt.xyz || r.xyz === filt.xyz) && (!q || r.sku.toLowerCase().includes(q) || (r.product_name || '').toLowerCase().includes(q)));
    if (sort.key) { const k = sort.key; out = [...out].sort((a, b) => { const x = a[k], y = b[k]; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir; }); }
    return out;
  }

  function renderAll() {
    const d = DATA, k = d.kpi || {}, m = d.matrix || [];
    const ledgerAge = d.ledger_last ? -daysFrom(d.ledger_last) : null, salesAge = d.sales_last ? -daysFrom(d.sales_last) : null;
    const banners = [];
    if (ledgerAge > 2) banners.push(['var(--orange)', `⚠️ log ทีมแพ็คล่าสุดคือ ${dTH(d.ledger_last)} (${ledgerAge} วันก่อน) — สต็อกที่เห็นอาจไม่ใช่ปัจจุบัน เช็ค cron sync-inventory-log ในหน้าสถานะระบบ`]);
    if (salesAge > 3) banners.push(['var(--orange)', `⚠️ ยอดขายล่าสุดคือ ${dTH(d.sales_last)} (${salesAge} วันก่อน) — ค่าเฉลี่ยขาย/วันจะต่ำกว่าจริงจนกว่าจะอัปโหลดออเดอร์`]);
    const urgent = rows.filter(r => r.status === 'stockout' || r.status === 'stockout_before_po');
    if (urgent.length) banners.push(['var(--red)', `⛔ ${urgent.length} SKU ขาดแล้วหรือจะขาดก่อนของเข้า: ${urgent.slice(0, 8).map(r => `<b>${esc(r.sku)}</b>${r.days_of_cover != null ? ` (${r.days_of_cover} วัน)` : ''}`).join(', ')}${urgent.length > 8 ? ` และอีก ${urgent.length - 8}` : ''}`]);
    if (k.no_params > 0) banners.push(['var(--accent)', `🛠 ${k.no_params} SKU ยังไม่ได้ตั้ง lead time / MOQ / ต้นทุน — ใช้ค่ากลาง 60 วันไปก่อน (ตั้งค่าได้ในหน้า Admin เมื่อฟอร์มพร้อม)`]);

    const need = (k.stockout || 0) + (k.stockout_before_po || 0) + (k.reorder || 0);
    const kpis = [
      ['ต้องสั่งตอนนี้', `<span style="color:${need ? 'var(--red)' : 'var(--green)'};">${fmtN(need)} SKU</span>`, `ขาดแล้ว ${fmtN(k.stockout)} · จะขาดก่อนของเข้า ${fmtN(k.stockout_before_po)} · ถึงจุดสั่ง ${fmtN(k.reorder)}`, 'need'],
      ['เงินที่ควรสั่งรอบนี้', baht(k.suggested_cost), `${fmtN(k.suggested_units)} ชิ้น / ${fmtN(k.suggested_skus)} SKU${k.no_cost ? ` · <span style="color:var(--orange);">${fmtN(k.no_cost)} SKU ไม่มีต้นทุน</span>` : ''}`, 'suggest'],
      ['สต็อกขายได้รวม', `${fmtN(k.on_hand_total)} ชิ้น`, `PO ค้างรับ ${fmtN(k.on_order_total)} ชิ้น`, ''],
      ['วันคงเหลือ (กลาง)', k.median_cover != null ? `${fmtN(k.median_cover)} วัน` : '—', 'ครึ่งหนึ่งของ SKU มีของพอเกินนี้', ''],
      ['เกินสต็อก', `<span style="color:var(--blue);">${fmtN(k.overstock)} SKU</span>`, 'ของพอเกิน lead time + รอบสั่ง + 60 วัน', 'overstock'],
      ['ไม่เคลื่อนไหว', `<span style="color:var(--text3);">${fmtN(k.dead)} SKU</span>`, 'มีของแต่ 90 วันไม่มียอดขาย', 'dead'],
    ];
    const cell = (a, x) => m.find(c => c.abc === a && c.xyz === x) || { n: 0, rev: 0 };

    root().innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <div style="font-size:11.5px;color:var(--text3);">สต็อกจาก log ทีมแพ็ค · ความต้องการจากยอดขายจริง · คำนวณใหม่ทุกคืน 04:00 · แผน ณ <b>${dTH(d.as_of)}</b> · log ล่าสุด ${dTH(d.ledger_last)} · ยอดขายล่าสุด ${dTH(d.sales_last)}</div>
        <button class="btn btn-ghost" id="supRefresh">↻ รีเฟรช</button>
      </div>
      ${banners.map(([c, t]) => `<div style="padding:10px 14px;border-radius:8px;margin-bottom:10px;font-size:12px;color:${c};background:color-mix(in srgb, ${c} 10%, transparent);border:1px solid color-mix(in srgb, ${c} 30%, transparent);">${t}</div>`).join('')}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px;" id="supKpis">
        ${kpis.map(([l, v, s, f]) => `<div class="card" data-f="${f}" style="cursor:${f ? 'pointer' : 'default'};${f && filt.status === f ? 'border-color:var(--accent);' : ''}"><div class="card-title">${l}</div><div class="kpi-value" style="font-size:22px;">${v}</div><div class="kpi-sub" style="display:block;">${s}</div></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:16px;margin-bottom:20px;" class="sup-grid2">
        <div class="card">
          <div class="section-header">
            <div class="section-title">แผนเติมสต็อก</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
              <input type="text" class="ls-input" id="supQ" placeholder="🔎 SKU หรือชื่อสินค้า" value="${esc(filt.q)}" style="width:200px;padding:6px 10px;font-size:12px;">
              <select class="ls-input" id="supStatus" style="width:170px;flex:0 0 auto;padding:6px 10px;font-size:12px;"><option value="">ทุกสถานะ</option><option value="need">ต้องสั่งตอนนี้</option>${Object.entries(STATUS).map(([k2, v]) => `<option value="${k2}">${v[1]}</option>`).join('')}</select>
              <button class="btn btn-ghost" id="supClear">✕ ล้าง</button>
              <button class="btn btn-ghost" id="supExport">⬇ Export CSV</button>
            </div>
          </div>
          <div class="table-wrap" id="supTbl" style="max-height:560px;overflow-y:auto;"></div>
          <div id="supFoot" style="font-size:10.5px;color:var(--text3);margin-top:8px;"></div>
        </div>
        <div class="card">
          <div class="section-header"><div class="section-title">ABC × XYZ</div><span style="font-size:10.5px;color:var(--text3);">กดช่องเพื่อกรอง</span></div>
          <div style="display:grid;grid-template-columns:auto repeat(3,1fr);gap:6px;font-size:12px;">
            <div></div>${['X', 'Y', 'Z'].map(x => `<div style="font-size:10px;color:var(--text3);text-align:center;">${x}<br>${XYZ_TXT[x]}</div>`).join('')}
            ${['A', 'B', 'C'].map(a => `<div style="font-size:10px;color:var(--text3);">${a}<br>${ABC_TXT[a]}</div>` + ['X', 'Y', 'Z'].map(x => { const c = cell(a, x); const on = filt.abc === a && filt.xyz === x; return `<div class="sup-cell" data-a="${a}" data-x="${x}" style="background:var(--bg3);border:1px solid ${on ? 'var(--accent)' : 'var(--border)'};border-radius:8px;padding:8px 6px;text-align:center;cursor:pointer;"><b style="display:block;font-size:15px;">${fmtN(c.n)}</b><span style="font-size:10px;color:var(--text3);">${c.rev ? baht(c.rev) : '—'}</span></div>`; }).join('')).join('')}
          </div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:12px;line-height:1.5;">A/B/C = สัดส่วนยอดขาย 90 วัน · X/Y/Z = ความสม่ำเสมอของยอดขายรายสัปดาห์ · AX ควรมีของตลอด · CZ สั่งน้อยตามออเดอร์</div>
        </div>
      </div>
      <div class="card" id="supSkuCard">
        <div class="section-header"><div class="section-title" id="supSkuTitle">กราฟ SKU</div><span style="font-size:10.5px;color:var(--text3);">กดแถวในตารางเพื่อดู ยอดขาย · ของออก · สต็อก · จุดสั่ง · คาดการณ์ 60 วัน</span></div>
        <div id="supSkuBody"><div class="empty">เลือก SKU จากตารางด้านบน</div></div>
      </div>
      <style>
        /* หัวการ์ด KPI ของหน้านี้ใช้แบบเดียวกับหน้า Shopee Ads: ภาษาไทย Sarabun ไม่ใช่ตัวพิมพ์ใหญ่/monospace */
        #page-supply .card-title { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:12px; font-weight:600; color:var(--text2); margin-bottom:8px; }
        #page-supply #supKpis .card { display:flex; flex-direction:column; justify-content:space-between; min-width:0; }
        #page-supply #supKpis .kpi-sub { font-size:11px; color:var(--text3); margin-top:8px; line-height:1.4; }
        @media (max-width:1000px){ .sup-grid2 { grid-template-columns:1fr !important; } }
      </style>`;

    renderTable();
    document.getElementById('supRefresh').onclick = () => { DATA = null; load(); };
    document.getElementById('supQ').oninput = e => { filt.q = e.target.value; renderTable(); };
    const st = document.getElementById('supStatus'); st.value = filt.status; st.onchange = e => { filt.status = e.target.value; renderAll(); };
    document.getElementById('supClear').onclick = () => { filt = { status: '', abc: '', xyz: '', q: '' }; renderAll(); };
    document.getElementById('supExport').onclick = exportCsv;
    document.querySelectorAll('#supKpis .card[data-f]').forEach(el => { const f = el.dataset.f; if (!f) return; el.onclick = () => { filt.status = filt.status === f ? '' : f; renderAll(); }; });
    document.querySelectorAll('.sup-cell').forEach(el => el.onclick = () => { const a = el.dataset.a, x = el.dataset.x; if (filt.abc === a && filt.xyz === x) { filt.abc = ''; filt.xyz = ''; } else { filt.abc = a; filt.xyz = x; } renderAll(); });
    if (selSku && lastSeries) renderSku(lastSeries);
  }

  const COLS = [
    ['sku', 'SKU'], ['abc', 'ABC'], ['xyz', 'XYZ'], ['on_hand', 'สต็อก'], ['on_order', 'PO ค้าง'], ['avg_day', 'ขาย/วัน'], ['trend_7_vs_30', '7 vs 30 วัน'],
    ['days_of_cover', 'พอใช้ (วัน)'], ['stockout_date', 'วันหมด'], ['reorder_point', 'จุดสั่ง'], ['suggested_qty', 'แนะสั่ง'], ['suggested_cost', 'มูลค่า'], ['lt', 'LT'], ['status', 'สถานะ'],
  ];
  function renderTable() {
    const list = filtered();
    const head = COLS.map(([k, l]) => `<th class="sortable-th" data-k="${k}">${l}${sort.key === k ? `<span class="sort-arrow">${sort.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('');
    const body = list.length ? list.map(r => {
      const [c, t] = STATUS[r.status] || ['var(--text3)', r.status];
      const cov = r.days_of_cover, covCol = cov == null ? 'var(--text3)' : cov < r.lt ? 'var(--red)' : cov < r.lt + r.review ? 'var(--orange)' : 'var(--text)';
      const tr = r.trend_7_vs_30;
      return `<tr class="sup-row" data-sku="${esc(r.sku)}" style="cursor:pointer;${selSku === r.sku ? 'background:var(--bg3);' : ''}">
        <td><b style="font-family:'IBM Plex Mono',monospace;font-size:11px;">${esc(r.sku)}</b><div style="font-size:10px;color:var(--text3);">${esc(r.product_name)}</div></td>
        <td>${r.abc}</td><td>${r.xyz}</td>
        <td>${fmtN(r.on_hand)}</td><td>${r.on_order ? fmtN(r.on_order) + (r.next_eta ? `<div style="font-size:9.5px;color:var(--text3);">เข้า ${dTH(r.next_eta)}</div>` : '') : '<span style="color:var(--text3);">—</span>'}</td>
        <td>${fmtN(r.avg_day, 1)}</td>
        <td style="color:${tr == null ? 'var(--text3)' : tr > 0.2 ? 'var(--green)' : tr < -0.2 ? 'var(--red)' : 'var(--text2)'};">${tr == null ? '—' : (tr > 0 ? '+' : '') + fmtN(tr * 100) + '%'}</td>
        <td style="color:${covCol};font-weight:600;">${cov == null ? '—' : fmtN(cov)}</td>
        <td>${r.stockout_date ? dTH(r.stockout_date) : '—'}</td>
        <td>${fmtN(r.reorder_point)}</td>
        <td><b>${r.suggested_qty ? fmtN(r.suggested_qty) : '—'}</b></td>
        <td>${r.suggested_qty ? (r.unit_cost != null ? baht(r.suggested_cost) : '<span style="color:var(--orange);">ไม่มีต้นทุน</span>') : '—'}</td>
        <td>${r.lt}${r.has_params ? '' : '<span style="color:var(--text3);" title="ค่ากลาง ยังไม่ได้ตั้ง">*</span>'}</td>
        <td>${pill(c, t)}</td></tr>`;
    }).join('') : `<tr><td colspan="${COLS.length}" class="empty">ไม่มี SKU ตรงตัวกรอง</td></tr>`;
    document.getElementById('supTbl').innerHTML = `<table class="sticky-head-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    document.getElementById('supFoot').textContent = `${fmtN(list.length)} SKU · ขาย/วัน = ยอดขายจริงถ่วงน้ำหนัก 7/30/90 วัน (ตัดวันโปร) · จุดสั่ง = ยอดขายช่วง lead time + safety stock · LT* = ยังใช้ค่ากลาง 60 วัน · คลิกหัวคอลัมน์เพื่อเรียง`;
    document.querySelectorAll('#supTbl th[data-k]').forEach(th => th.onclick = () => { const k = th.dataset.k; if (sort.key === k) sort.dir = -sort.dir; else { sort.key = k; sort.dir = ['sku', 'abc', 'xyz', 'status'].includes(k) ? 1 : -1; } renderTable(); });
    document.querySelectorAll('.sup-row').forEach(tr => tr.onclick = () => { selSku = tr.dataset.sku; document.querySelectorAll('.sup-row').forEach(x => x.style.background = x.dataset.sku === selSku ? 'var(--bg3)' : ''); loadSku(selSku); document.getElementById('supSkuCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  function exportCsv() {
    const list = filtered();
    const cols = ['sku', 'product_name', 'abc', 'xyz', 'on_hand', 'on_order', 'next_eta', 'avg7', 'avg30', 'avg90', 'avg_day', 'days_of_cover', 'stockout_date', 'stockout_date_with_po', 'safety_stock', 'reorder_point', 'target_stock', 'suggested_qty', 'unit_cost', 'suggested_cost', 'lt', 'moq', 'pack', 'supplier', 'status', 'as_of'];
    const csv = [cols.join(','), ...list.map(r => cols.map(c => { const v = r[c]; return v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v; }).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })); a.download = `supply_plan_${DATA.as_of}.csv`; a.click();
  }

  async function loadSku(sku) {
    document.getElementById('supSkuTitle').textContent = `กราฟ ${sku}`;
    document.getElementById('supSkuBody').innerHTML = '<div class="empty">กำลังโหลด...</div>';
    let data;
    try { data = await supaRpc('supply_sku_series', { p_sku: sku, p_days: 90 }); }
    catch (e) { document.getElementById('supSkuBody').innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (selSku !== sku) return;
    lastSeries = data; renderSku(data);
  }

  function renderSku(d) {
    const p = d.plan || {}, r = rows.find(x => x.sku === d.sku) || {};
    const [c, t] = STATUS[p.status] || ['var(--text3)', p.status || '—'];
    const facts = [
      ['สถานะ', pill(c, t)], ['สต็อกขายได้', fmtN(p.on_hand) + ' ชิ้น'], ['ขาย/วัน', fmtN(p.avg_day, 1)], ['พอใช้', p.days_of_cover != null ? fmtN(p.days_of_cover) + ' วัน' : '—'],
      ['คาดว่าหมด', p.stockout_date ? dTH(p.stockout_date) : '—'], ['จุดสั่ง', fmtN(p.reorder_point)], ['safety stock', fmtN(p.safety_stock)], ['แนะสั่ง', p.suggested_qty ? fmtN(p.suggested_qty) + ' ชิ้น' : '—'],
      ['lead time', `${p.lt ?? '—'} วัน`], ['PO ค้าง', p.on_order ? `${fmtN(p.on_order)} ชิ้น` : '—'],
    ];
    const locs = (d.by_location || []).map(l => pill('var(--text3)', `${esc(l.location)} ${fmtN(l.on_hand)}`)).join(' ');
    const po = (d.po || []).length ? `<div style="font-size:11px;margin-top:8px;">PO ค้าง: ${d.po.map(x => pill('var(--blue)', `${esc(x.po_no || '(ไม่มีเลข)')} ${fmtN(x.qty)} ชิ้น${x.eta ? ' เข้า ' + dTH(x.eta) : ' ไม่มี ETA'}`)).join(' ')}</div>` : '';
    document.getElementById('supSkuBody').innerHTML = `
      <div style="font-size:13px;margin-bottom:10px;"><b>${esc(r.product_name || d.sku)}</b> <span style="color:var(--text3);font-family:'IBM Plex Mono',monospace;font-size:11px;">${d.sku}</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px;">${facts.map(([l, v]) => `<div style="background:var(--bg3);border-radius:8px;padding:8px 10px;"><div style="font-size:10px;color:var(--text3);">${l}</div><div style="font-size:14px;font-weight:600;">${v}</div></div>`).join('')}</div>
      <div style="font-size:11px;color:var(--text3);">สต็อกตามคลัง: ${locs || '—'}</div>${po}
      <div class="chart-wrap" style="height:320px;margin-top:14px;"><canvas id="supChart"></canvas></div>
      <div style="font-size:10.5px;color:var(--text3);display:flex;gap:14px;flex-wrap:wrap;margin-top:8px;">
        <span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#c8a96e;margin-right:5px;vertical-align:middle;"></i>ยอดขายจริง/วัน</span>
        <span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#fb923c;margin-right:5px;vertical-align:middle;"></i>ของออกจากคลัง/วัน</span>
        <span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#4ade80;margin-right:5px;vertical-align:middle;"></i>สต็อกคงเหลือ</span>
        <span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#4ade80;opacity:.5;margin-right:5px;vertical-align:middle;"></i>คาดการณ์สต็อก 60 วัน (รวม PO ที่รู้ ETA)</span>
        <span><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#f87171;margin-right:5px;vertical-align:middle;"></i>จุดสั่ง</span>
      </div>`;
    drawChart(d);
  }

  function drawChart(d) {
    const p = d.plan || {}, s = d.series || [];
    const tick = chartTickColor(), grid = chartGridColor();
    const labels = s.map(x => x.d), lastStock = s.length ? Number(s[s.length - 1].stock) : 0;
    const fut = [], futLabels = []; let st = lastStock;
    const base = s.length ? new Date(s[s.length - 1].d + 'T00:00:00') : new Date();
    for (let i = 1; i <= 60; i++) {
      const dt = new Date(base.getTime() + i * 86400000), iso = fmtDateISO(dt);
      st -= Number(p.avg_day || 0); (d.po || []).forEach(x => { if (x.eta === iso) st += Number(x.qty || 0); });
      futLabels.push(iso); fut.push(Math.max(0, Math.round(st)));
    }
    const allLabels = [...labels, ...futLabels], n = labels.length;
    const pad = (arr, before, after) => [...Array(before).fill(null), ...arr, ...Array(after).fill(null)];
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('supChart'), {
      type: 'bar',
      data: { labels: allLabels, datasets: [
        { type: 'bar', label: 'ยอดขาย/วัน', data: pad(s.map(x => Number(x.sales)), 0, 60), backgroundColor: 'rgba(200,169,110,.75)', yAxisID: 'y', order: 3 },
        { type: 'bar', label: 'ของออก/วัน', data: pad(s.map(x => Number(x.outflow)), 0, 60), backgroundColor: 'rgba(251,146,60,.5)', yAxisID: 'y', order: 4 },
        { type: 'line', label: 'สต็อก', data: pad(s.map(x => Number(x.stock)), 0, 60), borderColor: '#4ade80', borderWidth: 2, pointRadius: 0, tension: .2, yAxisID: 'y2', order: 1 },
        { type: 'line', label: 'คาดการณ์', data: pad([lastStock, ...fut], n - 1, 0), borderColor: 'rgba(74,222,128,.6)', borderDash: [5, 4], borderWidth: 2, pointRadius: 0, yAxisID: 'y2', order: 1 },
        { type: 'line', label: 'จุดสั่ง', data: allLabels.map(() => Number(p.reorder_point || 0)), borderColor: '#f87171', borderDash: [3, 3], borderWidth: 1, pointRadius: 0, yAxisID: 'y2', order: 2 },
      ] },
      options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { titleFont: { family: 'Sarabun' }, bodyFont: { family: 'Sarabun' }, callbacks: { title: it => dTH(it[0].label), label: it => `${it.dataset.label}: ${fmtN(it.raw, it.dataset.label === 'ยอดขาย/วัน' ? 1 : 0)}` } } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tick, font: { family: 'Sarabun', size: 10 }, maxTicksLimit: 12, callback: (v, i) => dTH(allLabels[i]) } },
          y: { position: 'left', beginAtZero: true, grid: { color: grid }, ticks: { color: tick, font: { family: 'Sarabun', size: 10 } }, title: { display: true, text: 'ชิ้น/วัน', color: tick, font: { family: 'Sarabun', size: 10 } } },
          y2: { position: 'right', beginAtZero: true, grid: { display: false }, ticks: { color: tick, font: { family: 'Sarabun', size: 10 } }, title: { display: true, text: 'สต็อก (ชิ้น)', color: tick, font: { family: 'Sarabun', size: 10 } } },
        } }
    });
  }

  // เรียกจาก dashboard.html ตอนกดเมนู / สลับธีม
  window.renderSupplyPage = function () { if (DATA) { renderAll(); if (selSku && lastSeries) renderSku(lastSeries); } else load(); };
})();
