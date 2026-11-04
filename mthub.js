// mthub.js — หน้า "ภาพรวม Modern Trade" (แยกออกจาก dashboard.html 2026-11-04 · โหลดครั้งแรกที่เปิดหน้า ผ่าน loadMtHubPage)
// ยอดขาย = ไฟล์รายงานยอดขายของห้าง (sell-out) ตาราง mt_sellout · ราคาที่ห้างจ่ายเรา รวม VAT · ห้างส่งเป็นรายเดือน ลงวันที่ 1
//   Supabase สรุปให้ที่ RPC mt_hub_page (ห้าง × เดือน × สินค้า + รายสาขา) — ไม่ส่งตารางดิบทั้งตารางมาคิดในเครื่องแล้ว
//   กดตัวเลขในตารางสินค้า → RPC mt_branch_detail (มาจากสาขาไหนบ้าง) · Business Insight ยังใช้ใบกำกับขายเข้า (ตรงงบ)
//   ใช้ของกลางจาก dashboard.html: _mtRetailer, MT_RETAILERS, supaRpc, fmt, PL_TH_M, makeChart, trOpenShell, pageNote, DG_SCHED
const MT_COLORS = { Eveandboy: '#D4537E', Konvy: '#1D9E75', Watsons: '#378ADD', CJ: '#BA7517' };   // ค่าเริ่มต้น — ทีมเปลี่ยนได้ที่ปุ่ม 🎨 สีห้าง (เก็บใน ui_settings.mt_colors)
const MT_PALETTE = ['#D4537E', '#E1306C', '#F43F5E', '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#BA7517', '#84CC16', '#22C55E',
  '#1D9E75', '#14B8A6', '#06B6D4', '#0EA5E9', '#378ADD', '#6366F1', '#8B5CF6', '#A855F7', '#EC4899', '#64748B'];
let _mtColorsLoaded = false;
async function loadMtColors() {
  if (_mtColorsLoaded) return; _mtColorsLoaded = true;
  try { const h = { apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + authJwt() };
    const r = await fetch(`${window.SUPABASE_URL}/rest/v1/ui_settings?key=eq.mt_colors&select=value`, { headers: h });
    const d = r.ok ? await r.json() : []; if (d[0] && d[0].value) Object.assign(MT_COLORS, d[0].value); } catch (e) { console.warn('mt colors', e.message); }
}
async function mtSetColor(ret, col) {
  MT_COLORS[ret] = col; renderMtHub(); mtColorRender();
  try { await fetch(`${window.SUPABASE_URL}/rest/v1/ui_settings?on_conflict=key`, { method: 'POST',
      headers: { apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + authJwt(), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ key: 'mt_colors', value: MT_COLORS, updated_at: new Date().toISOString() }) }); }
  catch (e) { uiAlert('บันทึกสีไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
}
function mtColorRender() {
  const pop = document.getElementById('mtColorPop'); if (!pop) return;
  pop.innerHTML = '<div style="font-size:11px;color:var(--text3);margin-bottom:10px;">สีประจำห้าง ใช้ในกราฟและตารางทุกหน้าของ Modern Trade · เปลี่ยนแล้วทุกคนเห็นเหมือนกัน</div>'
    + MT_RETAILERS.map(r => `<div class="row"><div class="nm"><span class="mt-dot" style="background:${MT_COLORS[r]};margin:0;"></span>${r}</div><div class="sw">`
      + MT_PALETTE.map(c => `<i class="${c.toLowerCase() === String(MT_COLORS[r]).toLowerCase() ? 'on' : ''}" style="background:${c};" title="${c}" onclick="mtSetColor('${r}','${c}')"></i>`).join('')
      + `<input type="color" value="${MT_COLORS[r]}" title="เลือกสีเอง" onchange="mtSetColor('${r}',this.value)"></div></div>`).join('');
}
function mtColorToggle() { const pop = document.getElementById('mtColorPop'); if (!pop) return; const show = pop.style.display === 'none'; if (show) mtColorRender(); pop.style.display = show ? 'block' : 'none'; }
document.addEventListener('click', () => { const pop = document.getElementById('mtColorPop'); if (pop) pop.style.display = 'none'; });
let _mtProdMetric = 'sales', _mtCtx = null;
const mtTip = t => `<span class="ui-i" data-tip="${String(t).replace(/"/g, '&quot;')}">ⓘ</span>`;
function mtProdMetric(m) { _mtProdMetric = m === 'qty' ? 'qty' : 'sales'; renderMtHub(); }

// (2026-10-26) กดตัวเลขในตารางสินค้า → แผงด้านขวา: มาจากสาขาไหนบ้าง (ชิ้น · ยอดขาย · สัดส่วน) · รวมเท่าตัวเลขที่กด
// (2026-11-04) ดึงรายสาขาจาก Supabase เฉพาะตอนกด (mt_branch_detail) ช่วง / ห้าง / เดือน เดียวกับตัวเลขที่กด
async function mtBranchOpen(sku, kind, key) {
  const C = _mtCtx; if (!C) return;
  trOpenShell('ที่มาของตัวเลข');
  const body0 = document.getElementById('trBody'); if (body0) body0.innerHTML = '<div class="tr-ref" style="padding:14px 0;">กำลังโหลด...</div>';
  let L;
  try {
    L = await supaRpc('mt_branch_detail', { p_from: C.from, p_to: C.to, p_retailer: kind === 'ret' ? key : (C.R || null), p_sku: sku, p_month: kind === 'month' ? key : null });
    if (!Array.isArray(L)) throw new Error((L && L.message) || 'ไม่มีผลลัพธ์');
  } catch (e) { if (body0) body0.innerHTML = `<div style="color:var(--red);font-size:12px;">โหลดไม่สำเร็จ: ${ttcEsc(e.message)}</div>`; return; }
  L = L.map(([ret, nm, has, qty, sales]) => ({ nm, ret, noBr: !has, qty: +qty || 0, sales: +sales || 0 }));
  const tq = L.reduce((t, b) => t + b.qty, 0), ts = L.reduce((t, b) => t + b.sales, 0);
  const n0 = v => fmt(Math.round(v)), pc = v => ts ? (v / ts * 100).toFixed(1) + '%' : '—';
  const where = kind === 'month' ? PL_TH_M(key) : (C.from && C.to ? `${PL_TH_M(C.from)} – ${PL_TH_M(C.to)}` : '');
  const retTxt = kind === 'ret' ? key : (C.R || 'ทุกห้าง');
  const multiRet = !C.R && kind !== 'ret';
  const noBr = L.length && L.every(b => b.noBr);
  let h = `<div class="tr-card"><div class="tr-card-t">${ttcEsc(retTxt)} · ${_mtProdMetric === 'qty' ? 'จำนวนชิ้น' : 'ยอดขาย'}</div>
    <div class="tr-card-v">${_mtProdMetric === 'qty' ? n0(tq) + ' <span style="font-size:15px;font-weight:600;">ชิ้น</span>' : n0(ts)}</div>
    <div class="tr-card-m"><span>${ttcEsc(skuToName(sku))} <span class="tr-sku">${ttcEsc(sku)}</span></span><span>${where}</span><span>${_mtProdMetric === 'qty' ? 'ยอดขาย ' + n0(ts) : n0(tq) + ' ชิ้น'}</span></div></div>`;
  h += `<div class="tr-fg"><div class="tr-fg-h"><span>มาจากสาขาไหนบ้าง</span><span class="tr-ref">${L.length} ${noBr ? 'ห้าง' : 'สาขา'}</span></div>`
    + (noBr ? `<div class="tr-ref tr-why" style="margin:4px 0;">ห้างนี้ส่งยอดรวมทั้งห้างมา ไม่แยกสาขา</div>` : '')
    + `<div class="mtb-h"><span>#</span><span>สาขา</span><span>ชิ้น</span><span>ยอดขาย</span><span>สัดส่วน</span></div>`
    + L.map((b, i) => `<div class="mtb-r"><span class="mtb-i">${i + 1}</span><span class="mtb-n">${ttcEsc(b.nm)}${multiRet ? ` <span class="tr-tag"><span class="mt-dot" style="background:${MT_COLORS[b.ret]};"></span>${ttcEsc(b.ret)}</span>` : ''}</span><span>${n0(b.qty)}</span><span>${n0(b.sales)}</span><span class="mtb-p">${pc(b.sales)}</span></div>`).join('')
    + `<div class="tr-eq"><span>รวม ${L.length} ${noBr ? 'ห้าง' : 'สาขา'} · ${n0(tq)} ชิ้น</span><b>${n0(ts)}</b></div></div>`;
  h += `<div class="tr-src"><div class="tr-src-h">ไฟล์ต้นทาง</div><dl class="tr-dl"><dt>ยอดขาย</dt><dd>ไฟล์รายงานยอดขายของห้าง (sell-out) รายสาขา รายเดือน · ราคาที่ห้างจ่ายเรา รวม VAT · ดึงทุกวัน 09:30 / 17:30</dd></dl></div>`;
  const body = document.getElementById('trBody'); if (body) body.innerHTML = h;
}

// ข้อมูลทั้งหน้า: ถามครั้งเดียวต่อช่วง / ห้าง · ผลเดิมใช้ซ้ำ 10 นาที (ปุ่มรีเฟรชข้อมูล Dashboard ล้างให้)
const _mtCache = {};
async function loadMtHubData(from, to, R) {
  const k = `${from}|${to}|${R || ''}`, c = _mtCache[k];
  if (c && Date.now() - c.at < 10 * 60 * 1000) return c.data;
  const d = await supaRpc('mt_hub_page', { p_from: from, p_to: to, p_retailer: R || null });
  if (!d || !Array.isArray(d.cells)) throw new Error((d && (d.message || d.hint)) || 'ไม่มีผลลัพธ์');
  _mtCache[k] = { at: Date.now(), data: d }; return d;
}

// ปุ่มสถานะข้อมูล: ห้างที่ไฟล์ล่าสุดเก่ากว่าห้างอื่น → "CJ ล่าสุดถึง มิ.ย. 69" · เวลาดึงไฟล์ล่าสุดอยู่ในรอบอัปเดต (ไม่วางเป็นบรรทัดในหน้า)
function mtStatus(D, lastOf, latest) {
  MT_RETAILERS.forEach(r => { const l = lastOf(r);
    if (window.pageNote) window.pageNote('mthub', 'lag_' + r, l && latest && l < latest ? 'warn' : null, `${r} ล่าสุดถึง ${l ? PL_TH_M(l) : '—'}`, ''); });
  try {
    DG_SCHED.mthub = 'ไฟล์ห้าง 09:30 / 17:30' + (D.synced_at ? ' · ดึงล่าสุด ' + new Date(D.synced_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '');
    if (currentPage === 'mthub') dgShow('mthub');
  } catch (e) {}
}

// ช่วงที่ห้างยังไม่ส่งไฟล์: ทุกช่องเป็น "—" (ไม่ใช่ 0) + บอกว่าไฟล์ล่าสุดถึงเดือนไหน และปุ่มไปเดือนนั้น
function mtGoMonth(m) { setDatePresetMonth(m.slice(0, 7)); applyFilters(); }

function mtSet(id, html) { const el = document.getElementById(id); if (!el || el._mtHtml === html) return; el._mtHtml = html; el.innerHTML = html; }

async function renderMtHub() {
  { const sel = document.getElementById('filterSubChannel'); if (sel && sel.dataset.mt) _mtRetailer = sel.value || ''; }   // ห้างที่เลือกในช่องด้านบน (กดค้นหา)
  { const M = { 'MT-EVE': 'Eveandboy', 'MT-KONVY': 'Konvy', 'MT-WATSONS': 'Watsons', 'MT-CJ': 'CJ' }; if (M[_mtRetailer]) _mtRetailer = M[_mtRetailer]; }   // กันค่ารหัสเก่าค้าง
  const R = _mtRetailer;
  { const t = document.getElementById('pageTitle'); if (t) t.textContent = R ? `Modern Trade — ${R}` : pageTitles.mthub; }
  document.getElementById('mtAdsCard').style.display = R ? 'none' : '';
  const kpiEl = document.getElementById('mthub-kpis');
  const from = getDateValue('From') || '2000-01-01', to = getDateValue('To') || '2999-12-31';
  let D;
  try { await loadMtColors(); D = await loadMtHubData(from, to, R); }
  catch (e) { kpiEl.innerHTML = `<div class="card" style="grid-column:1/-1;"><div style="color:var(--red);font-size:12px;">โหลดยอด Modern Trade ไม่สำเร็จ: ${ttcEsc(e.message)}</div></div>`; return; }
  if (currentPage !== 'mthub' || R !== _mtRetailer) return;

  // cells = ห้าง × เดือน × สินค้า (รวมทุกสาขาแล้ว) · brs = รายสาขาในช่วงที่เลือก
  const rows = D.cells.map(([retailer, month, sku, qty, sales]) => ({ retailer, month: String(month).slice(0, 10), parent_sku: sku, qty: +qty || 0, sales: +sales || 0 }));
  const brs = D.branches.map(([retailer, branch, has, qty, sales, mon, last]) => ({ retailer, branch, has: !!has, qty: +qty || 0, sales: +sales || 0, mon: +mon || 0, last: +last || 0 }));
  const lastOf = ret => String((D.last || {})[ret] || '').slice(0, 10);
  const latestAll = MT_RETAILERS.map(lastOf).filter(Boolean).sort().pop() || '';
  mtStatus(D, lastOf, latestAll);
  const latest = R ? lastOf(R) : latestAll;
  const money = v => fmt(Math.round(v));
  const dash = '<span style="color:var(--text3);">—</span>';
  const sum = (arr, k) => arr.reduce((t, r) => t + r[k], 0);
  const tSales = sum(rows, 'sales'), tQty = sum(rows, 'qty');
  const months = [...new Set(rows.map(r => r.month))].sort();
  const empty = !rows.length;
  const waiting = empty && latest && from > latest;   // ช่วงที่เลือกอยู่หลังไฟล์ล่าสุด = ห้างยังไม่ส่งยอด
  const emptyTxt = waiting ? `ห้างยังไม่ส่งยอดของช่วงนี้ · ไฟล์ล่าสุดถึง ${PL_TH_M(latest)}` : 'ไม่มียอดในช่วงที่เลือก';
  const nBr = brs.filter(b => b.has).length;
  const src = mtTip('ยอดขายจากไฟล์รายงานของห้าง (Watsons / Eveandboy / Konvy / CJ) = ยอดที่ห้างขายออกจริง คิดราคาที่ห้างจ่ายเรา รวม VAT · ยอดเป็นรายเดือน ลงไว้วันที่ 1 เลือกช่วงให้ครอบวันที่ 1 ถึงจะเห็นยอดเดือนนั้น · ทุกหน้าใช้ชุดนี้ ยกเว้น Business Insight (ใช้ใบกำกับขายตามงบ)');

  // KPI
  let kpis;
  if (!R) {
    const byRet = {}; rows.forEach(r => { byRet[r.retailer] = (byRet[r.retailer] || 0) + r.sales; });
    const top = Object.entries(byRet).sort((a, b) => b[1] - a[1])[0];
    const brBy = ret => brs.filter(b => b.retailer === ret && b.has).length;
    kpis = [
      [`ยอดขาย ${src}`, empty ? '—' : `<span class="pl-trace" data-tsales="Modern Trade|${from}|${to}">${money(tSales)}</span>`, 'จากรายงานห้าง ทุกห้างรวมกัน'],
      [`จำนวนที่ขายออก ${mtTip('จำนวนชิ้นที่ห้างขายออกให้ลูกค้า (sell-out) ทุกห้างรวมกัน ในช่วงที่เลือก')}`, empty ? '—' : fmt(Math.round(tQty)) + ' ชิ้น', 'ทุกห้าง'],
      [`สาขาที่มียอด ${mtTip('จำนวนสาขาที่มียอดขายในช่วงที่เลือก · นับเฉพาะห้างที่ส่งยอดแยกสาขา')}`, empty ? '—' : fmt(nBr), MT_RETAILERS.filter(x => brBy(x)).map(x => `${x} ${fmt(brBy(x))}`).join(' · ') || '—'],
      [`ห้างที่ยอดสูงสุด ${mtTip('ห้างที่มียอดขายมากที่สุดในช่วงที่เลือก และสัดส่วนเทียบยอด Modern Trade ทั้งหมด')}`, top ? top[0] : '—', top && tSales ? `${(top[1] / tSales * 100).toFixed(0)}% ของยอด Modern Trade` : '']
    ];
  } else {
    kpis = [
      [`ยอดขาย ${src}`, empty ? '—' : money(tSales), months.length ? `เฉลี่ย ${money(tSales / months.length)} / เดือน` : ''],
      [`จำนวนที่ขายออก ${mtTip('จำนวนชิ้นที่ห้างขายออกให้ลูกค้า (sell-out) ในช่วงที่เลือก · เฉลี่ยต่อเดือน = รวม ÷ จำนวนเดือนที่มียอด')}`, empty ? '—' : fmt(Math.round(tQty)) + ' ชิ้น', months.length ? `เฉลี่ย ${fmt(Math.round(tQty / months.length))} ชิ้น / เดือน` : ''],
      [`สาขาที่มียอด ${mtTip('จำนวนสาขาที่มียอดขายในช่วงที่เลือก · ถ้าห้างส่งยอดรวมมาทั้งห้าง จะขึ้นว่าไม่แยกสาขา')}`, empty ? '—' : nBr ? fmt(nBr) : 'ไม่แยกสาขา', empty ? '' : nBr ? 'สาขาที่ขายได้ในช่วงที่เลือก' : 'ห้างส่งเป็นยอดรวม'],
      [`ข้อมูลล่าสุด ${mtTip('เดือนล่าสุดที่ห้างส่งไฟล์รายงานมา')}`, latest ? PL_TH_M(latest) : '—', 'เดือนล่าสุดที่ห้างส่งไฟล์']
    ];
  }
  kpiEl.innerHTML = kpis.map(([l, v, sub]) => `<div class="card"><div class="card-title">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub" style="display:block;">${sub || '&nbsp;'}</div></div>`).join('');

  // กราฟรายเดือน: 1 เส้นต่อห้าง · เดือนหลังไฟล์ล่าสุดของห้างนั้นเว้นว่าง (ไม่ใช่ 0)
  const rets = R ? [R] : MT_RETAILERS;
  const ds = rets.map(ret => ({ label: ret, data: months.map(m => lastOf(ret) && m > lastOf(ret) ? null : rows.filter(r => r.month === m && r.retailer === ret).reduce((t, r) => t + r.sales, 0)),
    borderColor: MT_COLORS[ret], backgroundColor: MT_COLORS[ret], borderWidth: 2, pointRadius: months.length > 18 ? 0 : 3, pointHoverRadius: 5, tension: 0.3, fill: false, spanGaps: false }));
  const tk = { color: chartTickColor(), font: { family: 'Sarabun', size: 10 } };
  makeChart('chartMtRevenue', 'line', months.map(PL_TH_M), ds, {
    scales: { x: { ticks: { ...tk, maxRotation: 0 }, grid: { display: false }, border: { display: false } },
      y: { beginAtZero: true, ticks: { ...tk, callback: v => fmt(Math.round(v)), maxTicksLimit: 6 }, grid: { color: chartGridColor() }, border: { display: false } } },   // ตัวเลขเต็ม ไม่ย่อ K
    legend: { display: !R },
    tooltip: { callbacks: { label: it => `${it.dataset.label}: ${fmt(Math.round(it.raw || 0))}` } } });
  const emp = document.getElementById('mtEmpty');
  if (emp) { emp.hidden = !empty;
    emp.innerHTML = empty ? `<div>${emptyTxt}</div>${waiting ? `<button class="btn btn-ghost" onclick="mtGoMonth('${latest}')">ดู ${PL_TH_M(latest)}</button>` : ''}` : ''; }

  // ตารางขวาบน: ทุกห้าง = แยกห้าง · ห้างเดียว = สาขาขายดี
  const byProd = {}; rows.forEach(r => { const p = (byProd[r.parent_sku] = byProd[r.parent_sku] || { sales: 0, qty: 0, ret: {}, mon: {}, retQ: {}, monQ: {} });
    p.sales += r.sales; p.qty += r.qty; p.ret[r.retailer] = (p.ret[r.retailer] || 0) + r.sales; p.mon[r.month] = (p.mon[r.month] || 0) + r.sales;
    p.retQ[r.retailer] = (p.retQ[r.retailer] || 0) + r.qty; p.monQ[r.month] = (p.monQ[r.month] || 0) + r.qty; });
  const prods = Object.entries(byProd).sort((a, b) => b[1].sales - a[1].sales);
  const pct = v => tSales ? (v / tSales * 100).toFixed(1) + '%' : '—';
  const rank = i => `<td class="rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">${i + 1}</td>`;
  const prodCell = sku => `<td>${ttcEsc(skuToName(sku))} <span style="font-family:'Sarabun',sans-serif;font-size:10.5px;color:var(--text3);">${ttcEsc(sku)}</span></td>`;
  document.getElementById('tblMtSide').classList.toggle('mt-fixed', !R);   // ตารางแยกห้าง: ความกว้างคอลัมน์คงที่ ตัวเลขเปลี่ยนแล้วหัวตารางไม่ขยับ
  if (!R) {
    document.getElementById('ttlMtSide').textContent = 'ยอดขายแยกห้าง';
    mtSet('theadMtSide', `<tr><th>ห้าง</th><th class="num">ยอดขาย</th><th class="num">ชิ้น ${mtTip('จำนวนชิ้นที่ห้างขายออก')}</th><th class="num">สาขา ${mtTip('จำนวนสาขาที่มียอด · — = ห้างส่งเป็นยอดรวม')}</th><th class="num">สัดส่วน ${mtTip('ยอดขายห้างนี้ ÷ ยอด Modern Trade ทั้งหมดในช่วงที่เลือก')}</th><th class="num">ข้อมูลถึง ${mtTip('เดือนล่าสุดที่ห้างส่งไฟล์รายงานมา')}</th></tr>`);
    mtSet('tbodyMtSide', MT_RETAILERS.map(ret => { const rr = rows.filter(r => r.retailer === ret), sv = sum(rr, 'sales'), last = lastOf(ret);
      const nb = brs.filter(b => b.retailer === ret && b.has).length;
      return `<tr style="cursor:pointer;" onclick="mtGo('${ret}')" title="ดูหน้า ${ret}"><td><span class="mt-dot" style="background:${MT_COLORS[ret]};"></span>${ret}</td><td class="num">${rr.length ? money(sv) : dash}</td><td class="num">${rr.length ? fmt(Math.round(sum(rr, 'qty'))) : dash}</td><td class="num">${nb ? fmt(nb) : dash}</td><td class="num">${rr.length ? pct(sv) : dash}</td><td class="num">${last ? PL_TH_M(last) : '—'}</td></tr>`; }).join(''));
  }

  // สาขาขายดี — ทุกห้าง: การ์ดล่างซ้าย · ห้างเดียว: ตารางขวาบน (10 แถว/หน้า)
  const brHead = `<tr><th>#</th><th>สาขา</th>${R ? '' : '<th>ห้าง</th>'}<th class="num">ยอดขาย</th><th class="num">ชิ้น ${mtTip('จำนวนชิ้นที่สาขานี้ขายออกในช่วงที่เลือก')}</th><th class="num">เดือนที่มียอด ${mtTip('จำนวนเดือนที่สาขานี้มียอดขายในช่วงที่เลือก')}</th>${R && months.length ? `<th class="num">${PL_TH_M(months[months.length - 1])} ${mtTip('ยอดขายของสาขาในเดือนล่าสุดของช่วงที่เลือก · — = เดือนนั้นไม่มียอด')}</th>` : ''}</tr>`;
  const brBody = brs.length ? brs.map((b, i) => `<tr>${rank(i)}<td>${ttcEsc(b.branch)}</td>${R ? '' : `<td><span class="mt-dot" style="background:${MT_COLORS[b.retailer]};"></span>${b.retailer}</td>`}<td class="num">${money(b.sales)}</td><td class="num">${fmt(Math.round(b.qty))}</td><td class="num">${b.mon}</td>${R && months.length ? `<td class="num">${b.last ? money(b.last) : dash}</td>` : ''}</tr>`).join('')
    : `<tr><td colspan="7" class="empty">${emptyTxt}</td></tr>`;
  if (R) {
    document.getElementById('ttlMtSide').textContent = `สาขาขายดี — ${R}`;
    mtSet('theadMtSide', brHead); mtSet('tbodyMtSide', brBody);
    document.getElementById('mtBranchCard').style.display = 'none';
    document.getElementById('mtProdCard').style.gridColumn = '1 / -1';
  } else {
    mtSet('theadMtBranch', brHead); mtSet('tbodyMtBranch', brBody);
    document.getElementById('mtBranchCard').style.display = '';
    document.getElementById('mtProdCard').style.gridColumn = '';
  }

  // สินค้า × ห้าง (ทุกห้าง) / สินค้า × เดือน (ห้างเดียว)
  const cols = R ? months : MT_RETAILERS, K = _mtProdMetric === 'qty' ? 'qty' : 'sales', U = v => K === 'qty' ? fmt(Math.round(v)) : money(v);
  _mtCtx = { R, from, to };
  mtSet('ttlMtProd', (R ? `สินค้า × เดือน — ${R}` : 'สินค้า × ห้าง') + ' ' + mtTip(`${K === 'qty' ? 'จำนวนชิ้นที่ห้างขายออก' : 'ยอดขายที่ห้างขายออก (รวม VAT)'} แยกสินค้า${R ? ' รายเดือน · ตัวเล็กใต้ตัวเลข = เพิ่ม / ลด เทียบเดือนก่อน' : ' รายห้าง'} · กดตัวเลขเพื่อดูว่ามาจากสาขาไหนบ้าง`));
  document.querySelectorAll('#mtProdSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === K));
  mtSet('theadMtProd', `<tr><th>สินค้า</th><th class="num">รวม</th>${cols.map(c => `<th class="num">${R ? PL_TH_M(c) : `<span class="mt-dot" style="background:${MT_COLORS[c]};"></span>${c}`}</th>`).join('')}</tr>`);
  // ห้างเดียว: ใต้ยอดแต่ละเดือนบอก % เทียบเดือนก่อน (▲ เพิ่ม / ▼ ลด)
  const chg = (cur, prev) => { if (!cur || !prev) return ''; const p = (cur - prev) / Math.abs(prev) * 100;
    return `<div style="font-size:10.5px;margin-top:2px;color:${p >= 0 ? 'var(--green)' : 'var(--red)'};">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}%</div>`; };
  const pick = (v, c) => K === 'qty' ? (R ? v.monQ[c] : v.retQ[c]) : (R ? v.mon[c] : v.ret[c]);
  const cellA = (sku, kind, key) => `class="num mt-cell" onclick="mtBranchOpen('${ttcEsc(sku)}','${kind}','${ttcEsc(key)}')" title="คลิกเพื่อดูว่ามาจากสาขาไหนบ้าง"`;
  mtSet('tbodyMtProd', prods.length ? prods.map(([sku, v]) => `<tr>${prodCell(sku)}<td ${cellA(sku, 'all', '')}><b class="mt-v">${U(K === 'qty' ? v.qty : v.sales)}</b></td>${cols.map((c, ci) => { const x = pick(v, c);
      return x ? `<td ${cellA(sku, R ? 'month' : 'ret', c)} style="vertical-align:top;"><span class="mt-v">${U(x)}</span>${R && ci > 0 ? chg(x, pick(v, cols[ci - 1])) : ''}</td>`
        : `<td class="num" style="vertical-align:top;">${dash}</td>`; }).join('')}</tr>`).join('')
    : `<tr><td colspan="${2 + cols.length}" class="empty">${emptyTxt}</td></tr>`);

  if (!R) { if (!mtAdsFetched) { fetchMTAdsData().then(renderMtAdsChart); } else { renderMtAdsChart(); } }
}

// ค่า Ads Modern Trade (Awareness — บัญชี Meta "Deesay Modern Trade" จาก v_ad_spend_daily) · ค่า Ads ใช้สีแดงเหมือนทุกหน้า
function renderMtAdsChart() {
  const from = getDateValue('From'), to = getDateValue('To');
  const adsInRange = mtAdsDaily.filter(r => (!from || r.date >= from) && (!to || r.date <= to));
  let labels, data;
  const mtV = effGrain(mtAdsView); syncGrainButtons();
  if (mtV === 'day') {
    labels = adsInRange.map(r => r.date);
    data = adsInRange.map(r => r.ads);
  } else if (mtV === 'year') {
    const byYear = {};
    adsInRange.forEach(r => { const y = r.date.substring(0,4); byYear[y] = (byYear[y]||0) + r.ads; });
    labels = Object.keys(byYear).sort();
    data = labels.map(y => byYear[y]);
  } else {
    const byM = {};
    adsInRange.forEach(r => { const m = r.date.substring(0,7); byM[m] = (byM[m]||0) + r.ads; });
    labels = Object.keys(byM).sort();
    data = labels.map(m => byM[m]);
  }
  // (2026-11-04) แกนล่างเป็นชื่อเดือน / วันแบบไทยเหมือนกราฟอื่น · แกนซ้ายตัวเลขเต็ม ไม่ย่อ K
  const lab = labels.map(k => mtV === 'day' ? grainDayLabel(k) : mtV === 'year' ? k : PL_TH_M(k + '-01'));
  const tk = { color: chartTickColor(), font: { family: 'Sarabun', size: 10 } };
  makeChart('chartMtAds', 'line', lab, [{ label: 'ค่าโฆษณา Awareness', data, borderColor: '#f87171', backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 2, pointRadius: mtV==='day' && labels.length>60 ? 0 : 3, fill: true, tension: 0.3 }], {
    scales: { x: { ticks: { ...tk, maxRotation: 0, autoSkip: true }, grid: { display: false }, border: { display: false } },
      y: { beginAtZero: true, ticks: { ...tk, callback: v => fmt(Math.round(v)), maxTicksLimit: 6 }, grid: { color: chartGridColor() }, border: { display: false } } },
    tooltip: { callbacks: { label: it => `ค่าโฆษณา Awareness: ${fmt(Math.round(it.raw || 0))}` } } });
}
