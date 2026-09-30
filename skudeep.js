// skudeep.js — หน้า "เจาะสินค้า" (v20260930e: เปิดหน้าใหม่ไม่เลือกสินค้าค้างไว้ · คลิป TikTok เฉพาะคลิปของสินค้านี้ (คลิปสินค้าอื่นสรุปแยก) · KOL แสดงชื่อช่องก่อนชื่อจริง + ลิงก์โพสต์)
// (v20260930d: เลือกสินค้าที่แถบตัวกรองด้านบน (กดค้นหา) · ตัดเส้นค่าแอดในกราฟ · โปรไม่นับตัวแทน/MT + บอกช่องทาง · ตัดราคาต่อชิ้น / กำไรขั้นบันได · โหลดแบบ skeleton เหมือนหน้าอื่น)
// (v20260930c: กราฟสลับ ยอดขาย / จำนวนชิ้น · tooltip แยกค่าแอดออกจากรายการช่องทาง · ตัวแทน / MT ไม่คิดราคาเฉลี่ย) (v20260930b: ยอดรวมใน tooltip กราฟ · สี/เบอร์รวมเท่ายอดขาย · บอกเดือนที่นับค่าแอด/KOL · ยอดถอด VAT ให้เทียบ MKT Tracking) · เลือกสินค้า 1 ตัว แล้วเห็นทุกอย่างของสินค้านั้นในหน้าเดียว
// ข้อมูล: RPC sku_deep(p_sku, p_from, p_to) ครั้งเดียว (ยอดขาย ช่องทาง ร้าน/เพจ โปร ค่าแอด KOL สี/เบอร์ สต็อก กำไร แอด Facebook คลิป TikTok ลูกค้า)
// ใช้ helper ของ dashboard.html: supaRpc, makeChart, fmt, fmtB, ttcEsc, ttcEscAttr, getDateValue, effGrain, PL_TH_M, VAT_DIV, mtStoreName, fbeInfoIcon, exportTable, thShort, showPage, chartTickColor, chartGridColor
(function () {
  const CH_COL = { TikTok: '#fe2c55', Facebook: '#1877f2', Shopee: '#f97316', Lazada: '#8b5cf6', 'Modern Trade': '#f59e0b', 'ตัวแทน': '#64748b' };
  const CH_ORDER = ['TikTok', 'Facebook', 'Shopee', 'Lazada', 'Modern Trade', 'ตัวแทน'];
  const ST = { late: '🔴 Order now', stockout: '⚫ Stockout risk', reorder: '🟡 Next review', ok: '🟢 OK', no_need: 'No reorder', inactive: 'Inactive' };
  let _prods = null, _data = null, _seq = 0, _top = [], _mode = 'rev';
  const BULK = ['ตัวแทน', 'Modern Trade'];   // สั่งเป็นก้อน — ไม่คิดราคาเฉลี่ย / AOV (กฎเดียวกับทุกหน้า)
  const _open = new Set();
  const esc = s => ttcEsc(s == null ? '' : String(s)), escA = s => ttcEscAttr(s == null ? '' : String(s));
  const money = v => '฿' + fmt(Math.round(+v || 0));
  const dash = '<span style="color:var(--text3);">—</span>';
  const m0 = v => Math.round(+v || 0) ? money(v) : dash;
  const n0 = v => Math.round(+v || 0) ? fmt(Math.round(+v)) : dash;
  const roas = (a, b) => +b > 0 && +a > 0 ? (a / b).toFixed(2) + 'x' : '—';
  const pct = (a, b) => +b ? (a / b * 100).toFixed(1) + '%' : '—';
  const subName = (ch, sc) => !sc ? (ch === 'ตัวแทน' ? 'ตัวแทนทั้งหมด' : 'ไม่ระบุ') : ch === 'Modern Trade' ? mtStoreName(sc) : String(sc).replace(/^\d+\.\s*(FB|Line)\s*-\s*[A-Z]\s*-\s*/i, '').replace(/^\d+\.\s*/, '');
  const card = (title, body, extra) => `<div class="card skd-card"${extra || ''}><div class="section-header"><div class="section-title">${title}</div></div>${body}</div>`;

  function css() {
    if (document.getElementById('skd-css')) return;
    const st = document.createElement('style'); st.id = 'skd-css';
    st.textContent = `
      #page-skuanalysis .skd-kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
      #page-skuanalysis .skd-kpis .card { margin:0; }
      #page-skuanalysis .skd-card { margin-bottom:20px; min-width:0; }
      #page-skuanalysis .skd-2 { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:20px; }
      #page-skuanalysis .skd-2 > .skd-card { margin-bottom:20px; }
      #page-skuanalysis .skd-badge { display:inline-block; font-size:11px; padding:3px 9px; border-radius:99px; background:var(--bg3); color:var(--text2); margin-left:6px; }
      #page-skuanalysis .skd-badge.g { background:rgba(34,197,94,.14); color:var(--green); }
      #page-skuanalysis .skd-badge.r { background:rgba(239,68,68,.14); color:var(--red); }
      #page-skuanalysis .skd-badge.o { background:rgba(245,158,11,.16); color:var(--orange); }
      #page-skuanalysis .skd-note { font-size:10.5px; color:var(--text3); margin-top:8px; }
      #page-skuanalysis .skd-thumb { width:40px; height:40px; border-radius:6px; overflow:hidden; background:var(--bg3); flex:0 0 auto; display:block; text-align:center; line-height:40px; }
      #page-skuanalysis td.num, #page-skuanalysis th.num { text-align:right; }
      #page-skuanalysis tr.skd-ch { cursor:pointer; }
      #page-skuanalysis tr.skd-sub td { background:var(--bg2); font-size:12px; }
      #page-skuanalysis tr.skd-sub td:first-child { padding-left:34px; }
      #page-skuanalysis .skd-pick { position:relative; flex:1; min-width:240px; max-width:420px; }
      #page-skuanalysis .skd-list { position:absolute; top:100%; left:0; right:0; margin-top:4px; background:var(--bg2); border:1px solid var(--border); border-radius:10px; max-height:320px; overflow-y:auto; z-index:60; box-shadow:0 12px 32px rgba(0,0,0,.25); }
      #page-skuanalysis .skd-list div { padding:7px 12px; font-size:12.5px; cursor:pointer; }
      #page-skuanalysis .skd-list div:hover { background:var(--bg3); }
      #page-skuanalysis .skd-chip { font-family:inherit; font-size:12px; padding:5px 11px; border-radius:99px; border:1px solid var(--border); background:var(--bg2); color:var(--text2); cursor:pointer; }
      #page-skuanalysis .skd-chip.on { border-color:var(--accent); color:var(--accent); font-weight:600; }
      #page-skuanalysis .skd-pl { display:grid; grid-template-columns:150px 1fr 120px 60px; gap:10px; align-items:center; font-size:12.5px; padding:6px 0; border-bottom:1px solid var(--border); }
      #page-skuanalysis .skd-pl .bar { height:8px; border-radius:4px; background:var(--bg3); overflow:hidden; }
      #page-skuanalysis .skd-pl .bar div { height:100%; border-radius:4px; }
      #page-skuanalysis .skd-minis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-bottom:12px; }
      #page-skuanalysis .skd-mini, #page-skuanalysis .skd-tile { background:var(--bg3); border-radius:8px; padding:9px 12px; }
      #page-skuanalysis .skd-mini .l, #page-skuanalysis .skd-tile .l { font-size:11px; color:var(--text3); }
      #page-skuanalysis .skd-mini .v { font-size:15px; font-weight:700; margin-top:2px; }
      #page-skuanalysis .skd-cust { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.3fr); gap:28px; align-items:start; }
      #page-skuanalysis .skd-tiles { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
      #page-skuanalysis .skd-tile .v { font-size:22px; font-weight:700; margin-top:4px; }
      #page-skuanalysis .skd-tile .s { font-size:10.5px; color:var(--text3); margin-top:2px; }
      #page-skuanalysis .skd-prov { display:grid; grid-template-columns:150px 1fr 70px; gap:10px; align-items:center; font-size:12.5px; padding:5px 0; }
      #page-skuanalysis .skd-prov .b { height:8px; border-radius:4px; background:var(--bg3); overflow:hidden; }
      #page-skuanalysis .skd-prov .b div { height:100%; border-radius:4px; background:#1877f2; }
      #page-skuanalysis .skd-prov .c { text-align:right; font-weight:600; }
      @media (max-width:1100px) { #page-skuanalysis .skd-cust { grid-template-columns:1fr; } }
      @media (max-width:1100px) { #page-skuanalysis .skd-kpis { grid-template-columns:repeat(2,minmax(0,1fr)); } #page-skuanalysis .skd-2 { grid-template-columns:1fr; } }`;
    document.head.appendChild(st);
  }

  async function loadProducts() {
    if (_prods) return _prods;
    const h = { apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + window.SUPABASE_ANON_KEY };
    const rows = await fetchAllRows(`${window.SUPABASE_URL}/rest/v1/products?select=parent_sku,product_name&parent_sku=not.is.null&order=parent_sku.asc`, h);
    const by = {}; rows.forEach(r => { const k = String(r.parent_sku).trim(); if (k && !by[k]) by[k] = r.product_name || k; });
    _prods = Object.entries(by).map(([sku, name]) => ({ sku, name }));
    return _prods;
  }
  const nameOf = sku => ((_prods || []).find(p => p.sku === sku) || {}).name || (typeof skuToName === 'function' ? skuToName(sku) : sku);

  // ตัวเลือกสินค้าอยู่ที่แถบตัวกรองด้านบน (select#filterSkd) — กดค้นหาแล้วใช้ทั้งหน้า เหมือนตัวกรองอื่น
  function fillSelect() {
    const sel = document.getElementById('filterSkd'); if (!sel || !_prods) return;
    const cur = window._skdSku || sel.value;
    const opt = p => `<option value="${escA(p.sku)}">${esc(p.sku)} · ${esc(p.name)}</option>`;
    const topSet = new Set(_top.map(r => r.parent_sku));
    const top = _top.map(r => _prods.find(p => p.sku === r.parent_sku) || { sku: r.parent_sku, name: nameOf(r.parent_sku) });
    sel.innerHTML = '<option value="">— เลือกสินค้า —</option>' + (top.length ? `<optgroup label="ขายดีในช่วงนี้">${top.map(opt).join('')}</optgroup>` : '')
      + `<optgroup label="สินค้าทั้งหมด">${_prods.filter(p => !topSet.has(p.sku)).map(opt).join('')}</optgroup>`;
    sel.value = cur && [...sel.options].some(o => o.value === cur) ? cur : '';
  }
  function shell() {
    const el = document.getElementById('page-skuanalysis');
    if (!el.dataset.skd) { el.dataset.skd = '1'; el.innerHTML = '<div id="skdBody"></div>'; }
    return el;
  }

  window.skdPick = sku => { window._skdSku = sku; try { localStorage.setItem('skdSku', sku); } catch (e) {} _open.clear(); const sel = document.getElementById('filterSkd'); if (sel) sel.value = sku; render(); };
  window.skdMode = m => { _mode = m; document.querySelectorAll('#skdModeSeg button').forEach(b => b.classList.toggle('active', b.dataset.m === m)); renderChart(); };
  window.skdToggle = ch => { if (_open.has(ch)) _open.delete(ch); else _open.add(ch); renderChannels(); };

  window.renderSkuDeepPage = async function () {
    css(); shell(); skeleton();
    const sel = document.getElementById('filterSkd');
    if (sel && sel.value) window._skdSku = sel.value;   // ค่าที่เลือกในแถบด้านบน (กดค้นหา)
    const from = getDateValue('From'), to = getDateValue('To');
    const [, top] = await Promise.all([loadProducts().catch(() => []), supaRpc('sku_top', { p_from: from, p_to: to, p_channel: null, p_sub: null }, true).catch(() => [])]);
    _top = (Array.isArray(top) ? top : []).filter(r => r.parent_sku).sort((a, b) => (+b.revenue || 0) - (+a.revenue || 0)).slice(0, 8);
    // (v20260930e) ไม่เลือกสินค้าให้เอง — เปิดหน้ามาว่าง รอเลือกที่ช่อง "สินค้า" ด้านบน (ยกเว้นกดมาจากสินค้าในหน้าอื่น)
    fillSelect(); render();
  };
  // โหลดแบบเดียวกับหน้าอื่น: การ์ด skeleton ก่อนข้อมูลมา
  function skeleton() {
    const body = document.getElementById('skdBody'); if (!body) return;
    const sk = w => `<span class="skeleton" style="display:inline-block;width:${w};height:22px;border-radius:4px;"></span>`;
    body.innerHTML = `<div style="margin:0 0 16px;">${sk('260px')}</div><div class="skd-kpis">${Array.from({ length: 8 }, () => `<div class="card"><div class="card-title">&nbsp;</div><div class="kpi-value">${sk('70%')}</div></div>`).join('')}</div>
      <div class="card skd-card"><div class="chart-wrap chart-wrap-lg" style="display:flex;align-items:center;justify-content:center;">${sk('60%')}</div></div>`;
  }

  async function render() {
    const sku = window._skdSku, body = document.getElementById('skdBody'); if (!body) return;
    if (!sku) { body.innerHTML = '<div class="card"><div class="empty">เลือกสินค้าที่ช่อง "สินค้า" ด้านบน แล้วกดค้นหา</div></div>'; return; }
    const from = getDateValue('From'), to = getDateValue('To'), seq = ++_seq;
    skeleton();
    let d;
    try { d = await supaRpc('sku_deep', { p_sku: sku, p_from: from, p_to: to }); }
    catch (e) { body.innerHTML = `<div class="card"><div style="color:var(--red);font-size:12px;">โหลดไม่สำเร็จ: ${esc(e.message)}</div></div>`; return; }
    if (seq !== _seq || currentPage !== 'skuanalysis') return;
    if (!d || d.message) { body.innerHTML = `<div class="card"><div style="color:var(--red);font-size:12px;">โหลดไม่สำเร็จ: ${esc(d && d.message)}</div></div>`; return; }
    _data = d; draw();
  }

  function draw() {
    const d = _data, body = document.getElementById('skdBody');
    const daily = d.daily || [], kids = d.children || [], pl = d.pl || [];
    const rev = daily.reduce((t, r) => t + (+r.rev || 0), 0), qty = daily.reduce((t, r) => t + (+r.qty || 0), 0);
    const adsBy = {}; (d.ads_month || []).forEach(r => { adsBy[r.channel] = (adsBy[r.channel] || 0) + (+r.ad || 0) + (+r.aa || 0); });
    const ads = Object.values(adsBy).reduce((t, v) => t + v, 0);
    const kol = (d.kol || []).reduce((t, r) => t + (+r.amount || 0), 0);
    const onHand = kids.reduce((t, r) => t + (+r.on_hand || 0), 0), avgDay = kids.reduce((t, r) => t + (+r.avg_day || 0), 0);
    const cover = avgDay > 0 ? Math.floor(Math.max(onHand, 0) / avgDay) : null;
    const minLt = Math.min(...kids.map(r => +r.lt || 999));
    const abc = ['A', 'B', 'C'].find(x => kids.some(r => r.abc === x));
    // เทรนด์: เดือนล่าสุดที่ครบเดือน เทียบเฉลี่ย 3 เดือนก่อนหน้า
    const byMon = {}; daily.forEach(r => { const m = String(r.d).slice(0, 7); byMon[m] = (byMon[m] || 0) + (+r.rev || 0); });
    const ms = Object.keys(byMon).sort(); const today = new Date().toISOString().slice(0, 7);
    const full = ms.filter(m => m < today); let trend = null;
    if (full.length >= 4) { const last = byMon[full[full.length - 1]], prev = full.slice(-4, -1).reduce((t, m) => t + byMon[m], 0) / 3; if (prev > 0) trend = (last - prev) / prev * 100; }
    const badges = (abc ? `<span class="skd-badge${abc === 'A' ? ' g' : ''}">สินค้ากลุ่ม ${abc}</span>` : '')
      + (trend != null ? `<span class="skd-badge ${trend <= -15 ? 'r' : trend >= 15 ? 'g' : ''}">${PL_TH_M(full[full.length - 1])} ${trend >= 0 ? '▲' : '▼'} ${Math.abs(trend).toFixed(0)}% เทียบเฉลี่ย 3 เดือนก่อน</span>` : '')
      + (cover != null ? `<span class="skd-badge ${cover < minLt ? 'r' : cover > 180 ? 'o' : 'g'}">สต็อกพอขาย ~${fmt(cover)} วัน</span>` : '');
    const info = fbeInfoIcon('skd-info-kpi', 'ยอดขาย / ชิ้น = ยอดจริงทุกช่องทาง (รวม VAT) ชุดเดียวกับหน้าภาพรวม / แนวโน้มสินค้า · Modern Trade = ยอดที่ห้างขายออก<br>หน้า MKT Tracking / Business Insight แสดงยอดถอด VAT (÷ 1.07) — ดูตัวเลขถอด VAT ใต้การ์ดนี้<br>ค่าแอด / ค่า KOL = เก็บเป็นรายเดือน จึงนับทั้งเดือนที่อยู่ในช่วงที่เลือก<br>ROAS แอด = ยอดขาย ÷ ค่าแอด · MER = ยอดขาย ÷ (ค่าแอด + ค่า KOL)<br>สต็อก = ของในคลังทุกสี/เบอร์ ณ วันนี้ (จาก Supply Chain)');
    const kpi = (t, v, sub) => `<div class="card"><div class="card-title">${t}</div><div class="kpi-value">${v}</div>${sub ? `<div class="kpi-sub" style="display:block;">${sub}</div>` : ''}</div>`;
    // ค่าแอด / KOL เก็บเป็นรายเดือน → นับทั้งเดือนที่อยู่ในช่วง (แบบเดียวกับหน้า KOL / MKT Tracking)
    const dFrom = String(d.from).slice(0, 10), dTo = String(d.to).slice(0, 10);
    const mFrom = dFrom.slice(0, 7), mTo = dTo.slice(0, 7), mLbl = mFrom === mTo ? PL_TH_M(mFrom) : `${PL_TH_M(mFrom)} – ${PL_TH_M(mTo)}`;
    const lastDay = m => { const [y, mm] = m.split('-').map(Number); return `${m}-${String(new Date(y, mm, 0).getDate()).padStart(2, '0')}`; };
    const partial = dFrom !== `${mFrom}-01` || dTo !== lastDay(mTo);
    const warn = partial && (ads || kol) ? `<div style="font-size:11.5px;color:var(--orange);margin:-6px 0 14px;">⚠ ช่วงวันที่ไม่ครบเดือน — ค่าแอด / ค่า KOL นับทั้งเดือน ${mLbl} แต่ยอดขายนับตามวันที่ ROAS / MER จึงอาจเพี้ยน · เลือกวันที่ 1 ถึงสิ้นเดือนเพื่อให้ตรงกับหน้า MKT Tracking</div>` : '';
    body.innerHTML = `
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin:0 0 14px;"><div style="font-size:18px;font-weight:700;">${esc(d.name || nameOf(d.sku))}</div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text3);margin-left:4px;">${esc(d.sku)}</span>${badges}</div>${warn}
      <div class="skd-kpis">
        ${kpi('ยอดขาย ' + info, money(rev), `${fmt(daily.reduce((t, r) => t + (+r.ord || 0), 0))} ออเดอร์ · ถอด VAT ${money(rev / VAT_DIV)}`)}
        ${kpi('จำนวนขาย', fmt(Math.round(qty)) + ' ชิ้น', (() => { const r = daily.filter(x => !BULK.includes(x.channel)); const q = r.reduce((t, x) => t + (+x.qty || 0), 0), v = r.reduce((t, x) => t + (+x.rev || 0), 0); return q ? `ราคาเฉลี่ย ฿${fmt(Math.round(v / q))} / ชิ้น (ไม่รวมตัวแทน / MT)` : ''; })())}
        ${kpi('ค่าแอด', m0(ads), `${pct(ads, rev)} ของยอดขาย · นับ ${mLbl}`)}
        ${kpi('ค่า KOL', m0(kol), `${fmt((d.kol || []).length)} งาน · จ่าย ${mLbl}`)}
        ${kpi('ROAS แอด', roas(rev, ads), 'ยอดขาย ÷ ค่าแอด')}
        ${kpi('MER', roas(rev, ads + kol), 'ยอดขาย ÷ (แอด + KOL)')}
        ${kpi('สต็อกคงเหลือ', fmt(Math.round(onHand)) + ' ชิ้น', kids.some(r => +r.on_order) ? `ของเข้า ${fmt(Math.round(kids.reduce((t, r) => t + (+r.on_order || 0), 0)))} ชิ้น` : 'ไม่มี PO ค้าง')}
        ${kpi('ขายเฉลี่ย / วัน', avgDay ? fmt(Math.round(avgDay)) + ' ชิ้น' : '—', cover != null ? `พอขาย ~${fmt(cover)} วัน` : '')}
      </div>
      <div class="card skd-card"><div class="section-header"><div class="section-title" id="skdChartTtl">ยอดขาย</div>
        <div class="toggle-group" id="skdModeSeg"><button class="toggle-btn${_mode === 'rev' ? ' active' : ''}" data-m="rev" onclick="skdMode('rev')">ยอดขาย</button><button class="toggle-btn${_mode === 'qty' ? ' active' : ''}" data-m="qty" onclick="skdMode('qty')">จำนวนชิ้น</button></div></div>
        <div class="chart-wrap chart-wrap-lg"><canvas id="chartSkd"></canvas></div><div class="skd-note" id="skdChartNote"></div></div>
      ${card('ยอดขายตามช่องทาง', `<div class="table-wrap"><table id="tblSkdCh" data-no-sort data-no-page><thead><tr><th>ช่องทาง</th><th class="num">ยอดขาย</th><th class="num">สัดส่วน</th><th class="num">ชิ้น</th><th class="num">ออเดอร์</th><th class="num">ราคา / ชิ้น</th><th class="num">ค่าแอด</th><th class="num">ROAS</th></tr></thead><tbody id="tbodySkdCh"></tbody></table></div><div class="skd-note">กดแถวช่องทางเพื่อดูร้าน / เพจ / ห้าง · ตัวแทน / Modern Trade ไม่คิดราคาต่อชิ้น (สั่งเป็นก้อน) · ค่าแอดรายช่องทาง = ยิงสินค้านี้ตรงๆ + ส่วนแบ่งแอดทั่วไปของช่องทาง (ชุดเดียวกับ MKT Tracking)</div>`)}
      <div class="skd-2">${fbAdsCard(d)}${ttCard(d)}</div>
      <div class="skd-2">${kolCard(d)}${promoCard(d)}</div>
      ${kidsCard(d)}
      ${custCard(d)}`;
    renderChart(); renderChannels();
  }

  function renderChart() {
    const d = _data, daily = d.daily || [], qm = _mode === 'qty', fld = qm ? 'qty' : 'rev';
    const g = effGrain('month'), key = r => g === 'day' ? String(r.d).slice(0, 10) : String(r.d).slice(0, 7);
    const keys = [...new Set(daily.map(key))].sort();
    const chs = CH_ORDER.filter(c => daily.some(r => r.channel === c)).concat([...new Set(daily.map(r => r.channel))].filter(c => !CH_ORDER.includes(c)));
    const ds = chs.map(c => ({ label: c, data: keys.map(k => daily.filter(r => r.channel === c && key(r) === k).reduce((t, r) => t + (+r[fld] || 0), 0)), backgroundColor: CH_COL[c] || '#94a3b8', stack: 's', borderRadius: 2, maxBarThickness: 44, yAxisID: 'y' }));
    const tk = { color: chartTickColor(), font: { family: 'Sarabun', size: 10 } };
    const scales = { x: { stacked: true, ticks: { ...tk, maxRotation: 0, autoSkip: true }, grid: { display: false }, border: { display: false } },
      y: { stacked: true, ticks: { ...tk, callback: v => fmtB(v), maxTicksLimit: 6 }, grid: { color: chartGridColor() }, border: { display: false } } };
    const withAds = false;   // (v20260930d) ไม่แสดงค่าแอดในกราฟ — ดูค่าแอด / ROAS ที่การ์ดด้านบนและตารางช่องทาง
    if (withAds) {
      const adsM = {}; (d.ads_month || []).forEach(r => { adsM[r.m] = (adsM[r.m] || 0) + (+r.ad || 0) + (+r.aa || 0); });
      ds.push({ type: 'line', label: 'ค่าแอด', data: keys.map(k => adsM[k] || 0), borderColor: '#c8a96e', backgroundColor: '#c8a96e', borderWidth: 2, pointRadius: 3, tension: 0.3, yAxisID: 'y1', order: -1 });
      scales.y1 = { position: 'right', beginAtZero: true, ticks: { ...tk, callback: v => fmtB(v), maxTicksLimit: 6 }, grid: { display: false }, border: { display: false } };
    }
    const unit = v => qm ? `${fmt(Math.round(v))} ชิ้น` : `฿${fmt(Math.round(v))}`;
    document.getElementById('skdChartTtl').textContent = (qm ? 'จำนวนชิ้น' : 'ยอดขาย') + (g === 'day' ? 'รายวันแยกช่องทาง' : 'รายเดือนแยกช่องทาง') + (withAds ? ' + ค่าแอด' : '');
    document.getElementById('skdChartNote').textContent = g === 'day'
      ? 'ช่วงไม่เกิน 1 เดือนแสดงรายวัน · Modern Trade ลงวันที่ 1 ของเดือน'
      : qm ? 'จำนวนชิ้นที่ขายได้ แยกช่องทาง · Modern Trade ลงวันที่ 1 ของเดือน' : 'ยอดขายแยกช่องทาง (รวม VAT) · Modern Trade ลงวันที่ 1 ของเดือน';
    makeChart('chartSkd', 'bar', keys.map(k => g === 'day' ? k.slice(8, 10) + '/' + k.slice(5, 7) : PL_TH_M(k)), ds, { scales,
      tooltip: {
        filter: it => it.dataset.yAxisID === 'y',   // รายการในกล่อง = ช่องทางเท่านั้น (ค่าแอดแยกไปบรรทัดล่าง)
        callbacks: { label: it => `${it.dataset.label}: ${unit(it.raw || 0)}`,
          footer: items => { if (!items.length) return '';
            const t = items.reduce((a, i) => a + (+i.raw || 0), 0), lines = [`${qm ? 'จำนวนรวม' : 'ยอดขายรวม'} ${unit(t)}`];
            const adsDs = items[0].chart.data.datasets.find(x => x.yAxisID === 'y1');
            if (adsDs) { const a = +adsDs.data[items[0].dataIndex] || 0; lines.push(`ค่าแอดเดือนนี้ ฿${fmt(Math.round(a))}${a > 0 ? ` · ROAS ${(t / a).toFixed(2)}x` : ''} (แยกจากยอดขาย)`); }
            return lines; } } } });
  }

  function renderChannels() {
    const d = _data; if (!d) return; const tb = document.getElementById('tbodySkdCh'); if (!tb) return;
    const subs = d.subs || [], adsBy = {}; (d.ads_month || []).forEach(r => { adsBy[r.channel] = (adsBy[r.channel] || 0) + (+r.ad || 0) + (+r.aa || 0); });
    const by = {}; subs.forEach(r => { const o = (by[r.channel] = by[r.channel] || { rev: 0, qty: 0, ord: 0, subs: [] }); o.rev += +r.rev || 0; o.qty += +r.qty || 0; o.ord += +r.ord || 0; o.subs.push(r); });
    const tot = Object.values(by).reduce((t, o) => t + o.rev, 0);
    const rows = Object.entries(by).sort((a, b) => b[1].rev - a[1].rev);
    tb.innerHTML = rows.map(([c, o]) => {
      const a = adsBy[c] || 0, open = _open.has(c);
      const main = `<tr class="skd-ch" onclick="skdToggle('${escA(c)}')"><td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${CH_COL[c] || '#94a3b8'};margin-right:7px;"></span><b>${esc(c)}</b> <span style="color:var(--text3);font-size:10px;">${open ? '▾' : '▸'}</span></td>
        <td class="num"><b>${money(o.rev)}</b></td><td class="num">${pct(o.rev, tot)}</td><td class="num">${n0(o.qty)}</td><td class="num">${c === 'Modern Trade' ? dash : n0(o.ord)}</td>
        <td class="num">${o.qty && !BULK.includes(c) ? money(o.rev / o.qty) : dash}</td><td class="num">${m0(a)}</td><td class="num">${a ? roas(o.rev, a) : dash}</td></tr>`;
      const sub = open ? o.subs.sort((x, y) => (+y.rev || 0) - (+x.rev || 0)).map(s => `<tr class="skd-sub"><td>${esc(subName(c, s.sub))}</td><td class="num">${money(s.rev)}</td><td class="num">${pct(+s.rev, o.rev)}</td><td class="num">${n0(s.qty)}</td><td class="num">${c === 'Modern Trade' ? dash : n0(s.ord)}</td><td class="num">${+s.qty && !BULK.includes(c) ? money(s.rev / s.qty) : dash}</td><td></td><td></td></tr>`).join('') : '';
      return main + sub;
    }).join('') + (rows.length ? `<tr><td><b>รวม</b></td><td class="num"><b>${money(tot)}</b></td><td class="num">100%</td><td class="num"><b>${n0(rows.reduce((t, [, o]) => t + o.qty, 0))}</b></td><td></td><td></td><td class="num"><b>${m0(Object.values(adsBy).reduce((t, v) => t + v, 0))}</b></td><td></td></tr>` : '<tr><td colspan="8" class="empty">ไม่มียอดขายในช่วงนี้</td></tr>');
  }

  function fbAdsCard(d) {
    const a = d.fb_ads || [];
    const rows = a.map(x => { const url = x.post_id ? `https://www.facebook.com/${x.post_id}` : '';
      const img = x.thumbnail_url ? `<img src="${escA(x.thumbnail_url)}" class="zoom-thumb" style="width:100%;height:100%;object-fit:cover;" onerror="this.outerHTML='📘'">` : '📘';
      return `<tr><td><div style="display:flex;gap:8px;align-items:center;min-width:200px;"><a class="skd-thumb" ${url ? `href="${escA(url)}" target="_blank" rel="noopener"` : ''}>${img}</a><div style="min-width:0;"><div style="font-size:11.5px;font-weight:600;max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escA(x.name)}">${esc(x.name || x.ad_id)}</div><div style="font-size:10.5px;color:var(--text3);">${esc(x.bucket || '')} · ${thShort(x.first_date)}${x.last_date !== x.first_date ? ' – ' + thShort(x.last_date) : ''}</div></div></div></td>
        <td class="num"><b>${money(x.spend)}</b></td><td class="num">${n0(x.msg_started)}</td><td class="num">${n0(x.purchases)}</td><td class="num">${+x.spend && +x.purchase_value ? (x.purchase_value / x.spend).toFixed(2) + 'x' : dash}</td></tr>`; }).join('');
    return card('แอด Facebook ที่ยิงสินค้านี้', `<div class="table-wrap"><table id="tblSkdFb"><thead><tr><th>แอด</th><th class="num">ค่าแอด</th><th class="num">ทักแชท</th><th class="num">ซื้อ (Meta)</th><th class="num">ROAS (Meta)</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty">ไม่พบแอดที่ชื่อแคมเปญผูกกับสินค้านี้</td></tr>'}</tbody></table></div><div class="skd-note">15 อันดับตามค่าแอด · จับสินค้าจากชื่อแคมเปญ (ตั้งกฎเพิ่มได้ใน Admin) · ซื้อ / ROAS เป็นตัวเลขที่ Meta นับ</div>`);
  }

  function ttCard(d) {
    const p = d.tt_product || {}, c = d.tt_clips || [];
    const box = (l, v) => `<div class="skd-mini"><div class="l">${l}</div><div class="v">${v}</div></div>`;
    const head = +p.cost ? `<div class="skd-minis">${box('ค่าแอด GMV Max', money(p.cost))}${box('ยอดขายจากแอด', money(p.rev))}${box('ออเดอร์', fmt(Math.round(+p.orders || 0)))}${box('ROI', roas(p.rev, p.cost))}</div>` : '';
    const rows = c.map(x => { const img = x.cover_url ? `<img src="${escA(x.cover_url)}" class="zoom-thumb" style="width:100%;height:100%;object-fit:cover;" onerror="this.outerHTML='🎵'">` : '🎵';
      const url = x.item_id ? `https://www.tiktok.com/@${encodeURIComponent(x.tt_account_name || 'tiktok')}/video/${x.item_id}` : '';
      return `<tr><td><div style="display:flex;gap:8px;align-items:center;min-width:200px;"><a class="skd-thumb" ${url ? `href="${escA(url)}" target="_blank" rel="noopener"` : ''}>${img}</a><div style="min-width:0;"><div style="font-size:11.5px;font-weight:600;max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escA(x.title)}">${esc(x.title || x.item_id)}</div><div style="font-size:10.5px;color:var(--text3);">@${esc(x.tt_account_name || '—')}</div></div></div></td>
        <td class="num"><b>${money(x.cost)}</b></td><td class="num">${m0(x.rev)}</td><td class="num">${n0(x.orders)}</td><td class="num">${roas(x.rev, x.cost)}</td></tr>`; }).join('');
    const o = d.tt_other || {};
    const other = +o.clips ? `<div class="skd-note" style="font-size:11.5px;color:var(--text2);background:var(--bg3);border-radius:8px;padding:8px 12px;margin-top:10px;">อีก <b>${fmt(o.clips)} คลิป</b> เป็นคลิปของสินค้าอื่น${(o.top || []).length ? ` (${(o.top || []).map(t => esc(t.name || t.main_sku)).join(', ')} ฯลฯ)` : ''} ที่ TikTok GMV Max เอามาขายสินค้านี้ด้วย — ค่าแอด ${money(o.cost)} · ยอดขาย ${money(o.rev)} · ${fmt(Math.round(+o.orders || 0))} ออเดอร์ (รวมอยู่ในตัวเลขด้านบนแล้ว ไม่แสดงในตาราง)</div>` : '';
    return card('แอด TikTok (GMV Max) ของสินค้านี้', head + `<div class="table-wrap"><table id="tblSkdTt"><thead><tr><th>คลิปของสินค้านี้</th><th class="num">ค่าแอด</th><th class="num">ยอดขาย</th><th class="num">ออเดอร์</th><th class="num">ROI</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty">ไม่มีคลิปของสินค้านี้ที่ยิง GMV Max</td></tr>'}</tbody></table></div>${other}<div class="skd-note">คลิป 15 อันดับตามค่าแอด · นับเป็นคลิปของสินค้าที่คลิปนั้นใช้ค่าแอดมากที่สุด · ตัวเลขจาก TikTok Ads (GMV Max)</div>`);
  }

  function kolCard(d) {
    const k = d.kol || [];
    const disp = x => { try { return typeof kjDisplay === 'function' ? kjDisplay(x) : (x.kol_name || '—'); } catch (e) { return x.kol_name || '—'; } };
    const rows = k.map(x => { const ch = disp(x), real = x.kol_name && x.kol_name !== ch ? x.kol_name : '';
      const chCell = x.channel_link ? `<a href="${escA(x.channel_link)}" target="_blank" rel="noopener" style="font-weight:600;">${esc(ch)}</a>` : `<b>${esc(ch)}</b>`;
      return `<tr><td>${esc(PL_TH_M(String(x.cost_month).slice(0, 7)))}</td><td>${chCell}${real ? `<div style="font-size:10.5px;color:var(--text3);">${esc(real)}</div>` : ''}</td><td>${esc(x.plat || x.platform || '')}</td><td>${esc(x.kol_type || '')}</td>
        <td class="num"><b>${money(x.amount)}</b></td><td class="num">${m0(x.ads_spend)}</td><td class="num">${m0(x.sales)}</td>
        <td>${x.post_link ? `<a href="${escA(x.post_link)}" target="_blank" rel="noopener" style="white-space:nowrap;">ดูโพสต์ ↗</a>` : dash}</td></tr>`; }).join('');
    return card('งาน KOL ของสินค้านี้', `<div class="table-wrap"><table id="tblSkdKol"><thead><tr><th>เดือนที่จ่าย</th><th>ช่อง / KOL</th><th>ช่องทาง</th><th>ประเภท</th><th class="num">ค่าจ้าง</th><th class="num">ค่าแอดที่ยิงงาน</th><th class="num">ยอดขายที่ผูกได้</th><th>โพสต์</th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty">ไม่มีงาน KOL ในช่วงนี้</td></tr>'}</tbody></table></div><div class="skd-note">จากชีทเบิกเงิน KOL (นับตามเดือนที่จ่าย) ชุดเดียวกับหน้า KOL · ชื่อช่อง = ชื่อบัญชีในลิงก์ช่องของ KOL (ไม่มีจึงใช้ชื่อจริง) · กดชื่อช่องเปิดหน้าช่อง</div>`);
  }

  function promoCard(d) {
    const p = d.promos || [];
    const chips = ch => Object.entries(ch || {}).sort((a, b) => b[1] - a[1]).map(([c, v]) => `<span title="${escA(c)} ฿${fmt(v)}" style="display:inline-flex;align-items:center;gap:4px;font-size:10.5px;padding:1px 7px;border-radius:99px;background:var(--bg3);color:var(--text2);white-space:nowrap;"><i style="width:7px;height:7px;border-radius:50%;background:${CH_COL[c] || '#94a3b8'};display:inline-block;"></i>${esc(c)}</span>`).join(' ');
    const rows = p.map((x, i) => `<tr><td class="rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : ''}">${i + 1}</td>
      <td><div style="font-family:'IBM Plex Mono',monospace;font-size:11px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escA(x.promo)}">${esc(x.promo)}</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">${chips(x.ch)}</div></td>
      <td class="num">${n0(x.ord)}</td><td class="num">${n0(x.qty)}</td><td class="num"><b>${money(x.rev)}</b></td></tr>`).join('');
    return card('ขายในโปร / เซ็ตไหน', `<div class="table-wrap"><table id="tblSkdPromo"><thead><tr><th>#</th><th>เซ็ต / โปร · ขายที่ช่องทาง</th><th class="num">ออเดอร์</th><th class="num">ชิ้น</th><th class="num">ยอดขาย</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty">ไม่มีข้อมูลโปร</td></tr>'}</tbody></table></div><div class="skd-note">25 อันดับ · ยอดขายของสินค้านี้ในแต่ละเซ็ต (แกะจากโปรแล้ว) · ไม่นับตัวแทน / Modern Trade · ป้ายสี = ช่องทางที่ขายเซ็ตนั้น เรียงจากยอดมากไปน้อย (วางเมาส์ดูยอด)</div>`);
  }

  function kidsCard(d) {
    // ยอดราย สี/เบอร์ ใช้สัดส่วนจากของที่ขายจริงราย สี/เบอร์ แล้วปรับให้รวมเท่ากับยอดขาย / ชิ้นของสินค้า (ตัวเลขชุดเดียวกับการ์ดด้านบน)
    const daily = d.daily || [], R = daily.reduce((t, r) => t + (+r.rev || 0), 0), Q = daily.reduce((t, r) => t + (+r.qty || 0), 0);
    const k0 = d.children || [], sr = k0.reduce((t, r) => t + (+r.rev || 0), 0), sq = k0.reduce((t, r) => t + (+r.qty || 0), 0);
    const k = k0.map(r => ({ ...r, rev: sr > 0 ? (+r.rev || 0) / sr * R : 0, qty: sq > 0 ? (+r.qty || 0) / sq * Q : 0 }));
    const rows = k.map(x => `<tr><td><span style="font-family:'IBM Plex Mono',monospace;font-weight:600;">${esc(x.sku)}</span><div style="font-size:10.5px;color:var(--text3);">${esc(x.name || '')}</div></td>
      <td class="num">${n0(x.qty)}</td><td class="num">${m0(x.rev)}</td><td class="num"><b>${n0(x.on_hand)}</b></td><td class="num">${+x.avg_day ? (+x.avg_day).toFixed(1) : dash}</td>
      <td class="num">${+x.avg_day > 0 ? fmt(Math.floor(Math.max(+x.on_hand || 0, 0) / x.avg_day)) + ' วัน' : dash}</td>
      <td class="num">${x.next_eta ? `${thShort(x.next_eta)}<div style="font-size:10.5px;color:var(--text3);">${n0(x.next_eta_qty)} ชิ้น</div>` : dash}</td>
      <td>${esc(ST[x.order_status] || x.order_status || '—')}</td></tr>`).join('');
    const sumOH = k.reduce((t, r) => t + (+r.on_hand || 0), 0);
    return card(`สี / เบอร์ และสต็อก <a onclick="showPage('supply')" style="font-size:11px;font-weight:400;margin-left:8px;cursor:pointer;color:var(--accent);">ดูแผนสั่งของใน Supply Chain →</a>`,
      `<div class="table-wrap"><table id="tblSkdKids"><thead><tr><th>SKU</th><th class="num">ขาย (ชิ้น)</th><th class="num">ยอดขาย</th><th class="num">คงเหลือ</th><th class="num">ขาย / วัน</th><th class="num">พอขาย</th><th class="num">ของเข้า</th><th>สถานะ</th></tr></thead><tbody>${rows || '<tr><td colspan="8" class="empty">ไม่มีข้อมูล</td></tr>'}</tbody>${k.length > 1 ? `<tfoot><tr><td><b>รวม</b></td><td class="num"><b>${n0(k.reduce((t, r) => t + (+r.qty || 0), 0))}</b></td><td class="num"><b>${m0(k.reduce((t, r) => t + (+r.rev || 0), 0))}</b></td><td class="num"><b>${n0(sumOH)}</b></td><td></td><td></td><td></td><td></td></tr></tfoot>` : ''}</table></div>
      <div class="skd-note">ขาย / ยอดขายราย สี/เบอร์ = แบ่งยอดของสินค้าตามสัดส่วนที่ขายจริงของแต่ละสี/เบอร์ รวมกันเท่ากับการ์ดยอดขาย / จำนวนขายด้านบนเสมอ · คงเหลือ / สถานะ ณ วันนี้ จาก Supply Chain</div>`);
  }

  function plCard(d) {
    const p = d.pl || []; if (!p.length) return card('กำไรขั้นบันได', '<div class="empty">ยังไม่มีข้อมูลบัญชีของช่วงนี้</div>');
    const S = k => p.reduce((t, r) => t + (+r[k] || 0), 0);
    const rev = S('revenue') / VAT_DIV, dir = S('kol_conversion') + S('kol_pr') + S('other_direct') + S('presenter_direct'), ad = S('ads_direct') + S('ads_allocated');
    const cm1 = rev - dir - ad, cm2 = cm1 - S('channel_cost'), cm3 = cm2 - S('brand_cost'), net = cm3 - S('overhead_cost');
    const line = (lbl, v, col) => `<div class="skd-pl"><div>${lbl}</div><div class="bar"><div style="width:${rev > 0 ? Math.max(0, Math.min(100, v / rev * 100)) : 0}%;background:${col};"></div></div><div style="text-align:right;font-weight:600;${v < 0 ? 'color:var(--red);' : ''}">฿${fmt(Math.round(v))}</div><div style="text-align:right;color:var(--text3);">${pct(v, rev)}</div></div>`;
    const tip = fbeInfoIcon('skd-info-pl', 'ชุดเดียวกับหน้า Business Insight (ยอดขายถอด VAT · ค่าใช้จ่ายจากไฟล์บัญชี)<br><b>CM1</b> = ยอดขาย − ค่าการตลาดตรง − ค่าแอด<br><b>CM2</b> = CM1 − ค่า Platform/ช่องทาง<br>❗ ค่าไลฟ์ TikTok ปันเฉพาะสินค้าที่ขายในไลฟ์<br><b>CM3</b> = CM2 − ค่าการตลาดที่ปันส่วน<br><b>สุทธิ</b> = CM3 − ค่าบริหาร (ยังไม่หักทุนสินค้า)');
    return card('กำไรขั้นบันได ' + tip, line('ยอดขาย (ถอด VAT)', rev, '#60a5fa') + line('CM1', cm1, '#22c55e') + line('CM2 ❗', cm2, '#16a34a') + line('CM3', cm3, '#15803d') + line('สุทธิ (ก่อนทุนสินค้า)', net, '#c8a96e')
      + `<div class="skd-note">เดือนที่บัญชียังไม่ปิดจะมีแต่ค่าแอด / KOL ยังไม่มีค่าช่องทาง · <a onclick="showPage('cost')" style="cursor:pointer;color:var(--accent);">ดูใน Business Insight →</a></div>`);
  }

  function custCard(d) {
    const c = d.customers || {}; const b = +c.buyers || 0, r = +c.repeat || 0, prov = c.provinces || [], mx = Math.max(1, ...prov.map(x => +x.n || 0));
    if (!b) return card('ลูกค้า Facebook ที่ซื้อสินค้านี้', '<div class="empty">ไม่มีออเดอร์ Facebook ของสินค้านี้ในช่วงนี้</div>');
    const tile = (l, v, sub) => `<div class="skd-tile"><div class="l">${l}</div><div class="v">${v}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
    const bars = prov.map(x => `<div class="skd-prov"><div class="n">${esc(x.province)}</div><div class="b"><div style="width:${(+x.n || 0) / mx * 100}%;"></div></div><div class="c">${fmt(x.n)} คน</div></div>`).join('');
    return card('ลูกค้า Facebook ที่ซื้อสินค้านี้', `<div class="skd-cust">
      <div class="skd-tiles">${tile('ลูกค้า', fmt(b), 'เบอร์โทรไม่ซ้ำ')}${tile('ออเดอร์', fmt(+c.orders || 0), `เฉลี่ย ${(((+c.orders || 0) / b) || 0).toFixed(2)} ออเดอร์ / คน`)}${tile('ซื้อซ้ำในช่วงนี้', fmt(r), `${pct(r, b)} ของลูกค้า`)}</div>
      <div><div style="font-size:11.5px;color:var(--text3);margin-bottom:8px;">จังหวัดที่มีลูกค้ามากสุด</div>${bars}</div></div>
      <div class="skd-note">นับจากออเดอร์ Facebook ในระบบ (ไม่รวมยกเลิก / ตีกลับ) · ซื้อซ้ำ = คนเดียวกันซื้อสินค้านี้ 2 ออเดอร์ขึ้นไปในช่วงที่เลือก</div>`);
  }

  function priceCard(d) {
    const daily = d.daily || [];
    const ms = [...new Set(daily.map(r => String(r.d).slice(0, 7)))].sort();
    if (ms.length < 2) return '';
    const chs = CH_ORDER.filter(c => !BULK.includes(c) && daily.some(r => r.channel === c && +r.qty > 0));   // ตัวแทน / MT สั่งเป็นก้อน ไม่คิดราคาเฉลี่ย
    const cell = (c, m) => { const rr = daily.filter(r => r.channel === c && String(r.d).slice(0, 7) === m); const q = rr.reduce((t, r) => t + (+r.qty || 0), 0), v = rr.reduce((t, r) => t + (+r.rev || 0), 0); return q > 0 ? money(v / q) : dash; };
    return card('ราคาขายจริงต่อชิ้น', `<div class="table-wrap" style="overflow-x:auto;"><table id="tblSkdPrice" data-no-sort><thead><tr><th>ช่องทาง</th>${ms.map(m => `<th class="num">${PL_TH_M(m)}</th>`).join('')}</tr></thead><tbody>${chs.map(c => `<tr><td><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${CH_COL[c]};margin-right:7px;"></span>${esc(c)}</td>${ms.map(m => `<td class="num">${cell(c, m)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="skd-note">ยอดขาย ÷ จำนวนชิ้น ต่อเดือน (หลังแกะจากโปร) — ใช้ดูว่าราคาจริงลดลงเพราะโปรหรือไม่ · ไม่รวมตัวแทน / Modern Trade (สั่งเป็นก้อน)</div>`);
  }
})();
