// kol.js (2026-11-10) — หน้า KOL ย้ายออกจาก dashboard.html (โค้ดเดิมทั้งหมด + โครงหน้าก่อนข้อมูลมา + ป้ายเทียบช่วงก่อน)
// ตัวช่วยที่หน้าอื่นใช้ด้วย (kjDisplay / kjIcons / kjHandleFromLink / kjPlat / KJ_PRODUCT_WORD / KJ_ICON) ยังอยู่ใน dashboard.html
// โหลดครั้งแรกที่เปิดหน้า KOL (renderKolPage ใน dashboard.html) · ฟังก์ชันในไฟล์นี้เป็น global เพราะปุ่มในหน้าเรียกด้วย onclick
// ===== หน้า KOL — (2026-10-01) ตัวตั้ง = ไฟล์งานทีม KOL (แท็บ Conversion + PR, งบตามวันโพสต์) + จับคู่ Ads / ยอดขายของคลิป · ฟอร์มเบิกเงิน = สถานะเบิกจ่ายเท่านั้น (mv_kol_plan_jobs) =====
let _kjRows = null, _kjNames = {}, _kjView = 'job', _kjSortCol = 'amount', _kjSortDir = 'desc', _kjList = [], _kjOpen = new Map(), _kjFiltered = [], _kjCalMetric = 'amount';
// เซลล์ตัวเลขที่กดได้ → แจกแจงว่ามาจากไหน (ยอดรวมเท่าตัวเลขที่กด)
// ชื่อที่แสดง = ชื่อช่อง/บัญชี (TikTok @handle จากลิงก์ → ชื่อบัญชีในชีท) ถ้าไม่มีค่อยใช้ชื่อจริง
function kjCell(o, m) { const v = o[m]; if (!v) return '<td><span style="color:var(--text3);">—</span></td>'; const on = _kjOpen.get(o.key) === m;
  return `<td class="pl-amt${on ? ' on' : ''}" onclick="kjToggle('${String(o.key).replace(/'/g, "\\'")}','${m}')" title="กดเพื่อดูว่ามาจากไหน"><span>${fmt(Math.round(v))}</span></td>`; }
function kjToggle(key, m) { if (_kjOpen.get(key) === m) _kjOpen.delete(key); else _kjOpen.set(key, m); renderKolTable(); }
function kjAfterRows(cols) {
  // แทรกแถวรายละเอียดใต้แถวที่เปิดอยู่
  const tb = document.getElementById('tbodyKj'); const trs = [...tb.children];
  _kjList.forEach((o, i) => { const m = _kjOpen.get(o.key); if (!m || !trs[i]) return;
    const tr = document.createElement('tr'); tr.className = 'pl-detail'; tr.innerHTML = `<td colspan="${cols}" style="padding:0;"><div style="padding:12px 20px;background:var(--bg2);">${kjBreakdown(o, m)}</div></td>`; trs[i].after(tr); });
}
function kjBreakdown(o, m) {
  const jobs = o.jobs || [], childKey = _kjView === 'kol' ? 'sku' : _kjView === 'sku' ? 'kol' : null;
  const childName = r => childKey === 'sku' ? (_kjNames[r.parent_sku] || r.parent_sku || r.product_code || '—') : kjDisplay(r);
  const add = (map, k, v) => { if (v) map[k] = (map[k] || 0) + v; };
  const G = {};   // กลุ่ม → { amount, kids{} }
  const put = (g, r, v) => { if (!v) return; const x = (G[g] = G[g] || { amount: 0, kids: {} }); x.amount += v; if (childKey) add(x.kids, childName(r), v); };
  jobs.forEach(r => {
    if (m === 'ads') { put('Facebook Ads', r, +r.fb_ads_spend || 0); put('TikTok GMV Max', r, +r.tt_gmvmax_cost || 0); put('TikTok Ads ปกติ / Spark', r, +r.tt_ads_spend || 0); }
    else if (m === 'sales') { put('Facebook Ads · ยอดซื้อที่ Meta นับ', r, +r.fb_ads_value || 0); put('TikTok GMV Max · ยอดขายของคลิป', r, +r.tt_gmvmax_rev || 0); }
    else { const pl = kjPlat(r.platform) === 'other' ? 'ช่องทางอื่น' : kjPlat(r.platform); const t = /^conv/i.test(r.kol_type || '') ? 'Conversion' : /^pr/i.test(r.kol_type || '') ? 'PR' : 'อื่นๆ';
      const x = (G[pl] = G[pl] || { amount: 0, kids: {} }); x.amount += +r.amount || 0; add(x.kids, t, +r.amount || 0); }
  });
  const groups = Object.entries(G).map(([label, x]) => ({ label, amount: x.amount, children: bdTop(bdFrom(Object.entries(x.kids)), 8) }));
  const title = { amount: 'ค่าจ้าง KOL', ads: 'ค่า Ads งาน KOL', sales: 'ยอดขายที่ผูกได้ (ถอด VAT)' }[m] + ' · ' + (o.name || o.kol || '');
  const sub = childKey ? '<br>บรรทัดย่อย = ' + (childKey === 'sku' ? 'สินค้า' : 'KOL') : '';
  const tip = { amount: 'แยกตามช่องทางที่ลงงาน → Conversion / PR', ads: '• Facebook = Ads ที่ ad name หรือชื่อ KOL ตรงกับงาน<br>• TikTok = GMV Max + Ads ปกติ/Spark ของคลิป<br>นับตามวันที่ใช้เงิน' + sub, sales: '• Facebook = ยอดซื้อที่ Meta นับ<br>• TikTok = ยอดขาย GMV Max ของคลิป<br>ถอด VAT แล้ว' + sub }[m];
  return bdRender({ title, total: o[m], groups, tipId: 'tip-kjbd-' + String(o.key).replace(/[^a-zA-Z0-9]/g, '') + m, tip });
}
function kjSetCal(m) { _kjCalMetric = m; document.querySelectorAll('#kjCalSeg button').forEach(b => b.classList.toggle('on', b.dataset.m === m)); renderKolCal(); }
// 📅 ปฏิทินงบ: สินค้า × เดือน (ทั้งปี) — ใช้ตัวกรองช่องทาง / ประเภท / ค้นหาชื่อ แต่ไม่ใช้ช่วงเดือน
function renderKolCal() {
  const el = document.getElementById('kjCal'); if (!el) return;
  const plat = document.getElementById('kjPlat').value, typ = document.getElementById('kjType').value, q = (document.getElementById('kjSearch').value || '').trim().toLowerCase();
  const prod = (document.getElementById('kjProduct') || {}).value || '';
  const rows = _kjRows.filter(r => r.month && (!plat || kjPlat(r.platform) === plat) && (!typ || new RegExp('^' + typ, 'i').test(r.kol_type || '')) && (!prod || (r.parent_sku || r.product_code) === prod) && (!q || `${r.kol_name || ''} ${r.kol_handle || ''}`.toLowerCase().includes(q)));
  const year = (getDateValue('To') || fmtDateISO(new Date())).slice(0, 4);   // ปีของวันที่สิ้นสุดด้านบน
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`), nowM = fmtDateISO(new Date()).slice(0, 7);
  const cell = {}, skuT = {}, mT = {};
  const blank = () => ({ amount: 0, ads: 0, sales: 0, n: 0, jobs: [] });
  const get = (o, k) => (o[k] = o[k] || blank());
  // (2026-10-01) ค่าจ้าง → เดือนที่โพสต์ · ค่า Ads / ยอดขาย → เดือนที่ใช้เงินจริง (ตรงกับหน้า Ads / MKT Tracking)
  const Y = _kjAds[`${year}-01-01|${year}-12-31`];
  if (!Y) { el.innerHTML = '<div class="empty">กำลังโหลด…</div>'; kjLoadAds(`${year}-01-01`, `${year}-12-31`).then(() => { if (_kjView === 'cal') renderKolCal(); }).catch(e => { el.innerHTML = `<div class="empty">โหลดไม่สำเร็จ: ${e.message}</div>`; }); return; }
  rows.forEach(r => { const k = r.parent_sku || r.product_code || '—';
    if (r.month.startsWith(year)) [get(cell, k + '|' + r.month), get(skuT, k), get(mT, r.month)].forEach(o => { o.amount += +r.amount || 0; o.n++; o.jobs.push(r); });
    const a = Y[r.k]; if (a) Object.entries(a.m || {}).forEach(([m, v]) => { const ads = (+v[0] || 0) + (+v[2] || 0) + (+v[4] || 0), sales = ((+v[1] || 0) + (+v[3] || 0)) / VAT_DIV;
      [get(cell, k + '|' + m), get(skuT, k), get(mT, m)].forEach(o => { o.ads += ads; o.sales += sales; }); }); });
  const val = o => !o ? 0 : _kjCalMetric === 'spend' ? o.amount + o.ads : _kjCalMetric === 'mer' ? ((o.amount + o.ads) > 0 && o.sales > 0 ? o.sales / (o.amount + o.ads) : 0) : o[_kjCalMetric];
  const maxV = Math.max(1, ...Object.values(cell).map(val));
  // (2026-11-10) สีอ่อนลงให้ตัวเลขอ่านง่ายทุกช่อง · ช่องว่างเป็นสีจาง ๆ ให้เห็นตาราง
  const shade = v => { if (!v) return 'rgba(148,163,184,0.06)'; if (_kjCalMetric === 'mer') return v >= 3 ? 'rgba(34,197,94,0.26)' : v >= 1.5 ? 'rgba(34,197,94,0.14)' : v >= 1 ? 'rgba(234,179,8,0.16)' : 'rgba(239,68,68,0.18)'; return `rgba(201,161,74,${(0.08 + 0.40 * Math.min(1, v / maxV)).toFixed(2)})`; };
  const show = v => !v ? '' : _kjCalMetric === 'mer' ? v.toFixed(2) + 'x' : fmt(Math.round(v));
  const skus = Object.keys(skuT).sort((a, b) => val(skuT[b]) - val(skuT[a]) || skuT[b].amount - skuT[a].amount);
  const td = (o, key, m) => { const v = val(o), fut = m > nowM, has = !!o && (v > 0 || o.n > 0);   // (2026-10-02) ช่องว่าง = เดือนนั้นไม่มีค่าของตัวที่เลือก
    return `<td class="${has ? 'has' : ''}${fut && !(has) ? ' future' : ''}" style="--h:${shade(v)};" ${has ? `onclick="kjCalPick('${key}')"` : ''} title="${has ? `${o.n} งาน · ค่าจ้าง ${fmt(Math.round(o.amount))} · Ads ${fmt(Math.round(o.ads))} · ยอดขาย ${fmt(Math.round(o.sales))}` : fut ? 'เดือนที่ยังมาไม่ถึง — ยังไม่มีงานที่วางวันโพสต์ไว้' : ''}">${has ? `<div class="v">${show(v)}</div><div class="n">${o.n ? o.n + ' งาน' : 'งานเดือนก่อน'}</div>` : ''}</td>`; };
  _kjCalCells = cell;
  el.innerHTML = `<div style="font-size:12.5px;color:var(--text2);margin:0 0 8px;"><b style="color:var(--text);">ปี ${+year + 543}</b> · ${({ amount: 'ค่าจ้าง KOL', spend: 'ค่าจ้าง + ค่า Ads', sales: 'ยอดขายที่ผูกได้', mer: 'MER' })[_kjCalMetric]} รายเดือน แยกสินค้า
      ${plTip('tip-kjcal', 'ดูว่าแต่ละเดือนลงงบ KOL กับสินค้าไหนเท่าไร ใช้วางแผนเดือนถัดไป<br>สีเข้ม = มาก · ลายเส้น = เดือนที่ยังไม่ถึง · กดช่องเพื่อดูงานในช่องนั้น<br>ค่าจ้าง = เดือนที่โพสต์ · ค่า Ads / ยอดขาย = เดือนที่ใช้เงิน<br>แสดงทั้งปี (ปีของวันที่สิ้นสุดด้านบน) · ตัวกรองอื่นใช้ได้ ยกเว้นช่วงวันที่')}</div>
    <table class="kj-cal"><thead><tr><th style="text-align:left;">สินค้า</th>${months.map(m => `<th>${MONTHS_TH[+m.slice(5) - 1]}</th>`).join('')}<th>รวมทั้งปี</th></tr></thead><tbody>
      ${skus.map(k => `<tr><td class="nm"><b>${_kjNames[k] || k}</b> <span style="font-family:'Sarabun',sans-serif;font-size:10px;color:var(--text3);">${k}</span></td>${months.map(m => td(cell[k + '|' + m], k + '|' + m, m)).join('')}<td style="--h:transparent;"><div class="v">${show(val(skuT[k]))}</div><div class="n">${skuT[k].n} งาน</div></td></tr>`).join('')}
      <tr class="tot ui-sum"><td class="nm">รวมทุกสินค้า</td>${months.map(m => `<td style="--h:transparent;">${mT[m] && (val(mT[m]) > 0 || mT[m].n > 0) ? `<div class="v">${show(val(mT[m]))}</div>${mT[m].n ? `<div class="n">${mT[m].n} งาน</div>` : ''}` : (m > nowM ? '<div class="n">ยังไม่ถึง</div>' : '')}</td>`).join('')}<td style="--h:transparent;"><div class="v">${show(val(Object.values(mT).reduce((t, o) => { t.amount += o.amount; t.ads += o.ads; t.sales += o.sales; t.n += o.n; return t; }, blank())))}</div></td></tr>
    </tbody></table><div id="kjCalPick" style="margin-top:12px;"></div>`;
}
let _kjCalCells = {};
function kjCalPick(key) {
  const o = _kjCalCells[key], box = document.getElementById('kjCalPick'); if (!o || !box) return;
  const [sku, m] = key.split('|');
  const g = {}; o.jobs.forEach(r => { const k = kjDisplay(r); const x = (g[k] = g[k] || { label: k, amount: 0, children: [] }); x.amount += +r.amount || 0; x.children.push({ label: `${/^conv/i.test(r.kol_type || '') ? 'Conversion' : 'PR'} · ${r.platform || '—'}${r.post_date ? ' · โพสต์ ' + new Date(r.post_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : ''}`, amount: +r.amount || 0 }); });
  box.innerHTML = bdRender({ title: `งาน KOL · ${_kjNames[sku] || sku} · ${PL_TH_M(m)}`, total: o.amount, groups: Object.values(g), note: `ค่า Ads ที่ยิงงานเหล่านี้ ${fmt(Math.round(o.ads))} · ยอดขายที่ผูกได้ ${fmt(Math.round(o.sales))}` });
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
// (2026-10-01) ค่า Ads / ยอดขายของงาน KOL ตามวันที่ใช้เงินจริง (RPC kol_ads_range → { k: { m: { 'YYYY-MM': [fb, fbValue, gmvMax, gmvMaxRev, adsปกติ/Spark] } } }) — ตรงกับหน้า TikTok / Facebook Ads ที่นับตามวันที่
let _kjAds = {};
// (2026-10-06) ยอดขายแบบ Commission ของ KOL ที่จ้าง (ครีเอเตอร์ในไฟล์ทีม KOL รวม Presenter) — ชุดเดียวกับการ์ดยอดขายของ Creator Performance (⚡ API, กรอง KOL)
//   แสดงแยก ไม่บวกเข้ายอดที่ผูกได้ / MER (บางออเดอร์ซ้ำกับยอดจาก Ads ของคลิปงาน) · มีข้อมูลตั้งแต่ CP_API_START
let _kjCom = {};
// (2026-11-06) การ์ด "บัญชีลงค่าใช้จ่าย" = ยอดที่บัญชีลงเป็นค่าใช้จ่ายในเดือนนั้น (ชีทเบิกเงิน KOL: คอลัมน์ AB เดือนที่ลง × AR จำนวนตั้งหนี้ EX.VAT) — เท่ากับชีทบัญชี · RPC kol_acct_expense
const _kjAcctE = {};
function kjLoadAcct(from, to) { const k = from + '|' + to; return supaRpc('kol_acct_expense', { p_from: from, p_to: to }).then(d => { _kjAcctE[k] = d || {}; return _kjAcctE[k]; }); }
// (2026-11-10) ช่วงก่อน: เลือกเต็มเดือน → เดือนก่อนหน้าเต็มเดือน · ช่วงอื่น → จำนวนวันเท่ากันถอยหลัง (กฎเดียวกับเจาะสินค้า / Ad Performance)
function kjPrevRange(from, to) {
  const f = new Date(from + 'T00:00:00'), t = new Date(to + 'T00:00:00'), nx = new Date(t); nx.setDate(t.getDate() + 1);
  if (f.getDate() === 1 && nx.getDate() === 1) { const n = (t.getFullYear() - f.getFullYear()) * 12 + t.getMonth() - f.getMonth() + 1;
    return { from: fmtDateISO(new Date(f.getFullYear(), f.getMonth() - n, 1)), to: fmtDateISO(new Date(f.getFullYear(), f.getMonth(), 0)), label: n === 1 ? 'เดือนก่อน' : 'ช่วงก่อน' }; }
  const p = getPrevPeriodRange(from, to); return { from: p.from, to: p.to, label: 'ช่วงก่อน' };
}
// ป้าย % เทียบช่วงก่อน (ค่าใช้จ่าย = ไม่ใส่สี · ยอดขาย / MER ขึ้น = เขียว)
function kjChip(a, b, good, lbl) { if (!(b > 0) || !isFinite(a)) return ''; const v = (a - b) / b * 100, cls = !good || Math.abs(v) < 3 ? '' : v > 0 ? 'up' : 'dn';
  return `<span class="ui-chip ${cls}" style="margin-left:6px;font-size:10.5px;" title="${lbl || 'ช่วงก่อน'} ${fmt(Math.round(b * 100) / 100)}">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%</span>`; }
async function kjLoadCom(from, to) {
  const key = from + '|' + to; if (_kjCom[key]) return _kjCom[key];
  if (to < CP_API_START) return (_kjCom[key] = { none: true, m: {} });
  const f = from < CP_API_START ? CP_API_START : from;
  const rows = await supaRpc('creator_summary_api', { p_from: f, p_to: to }, true);
  const m = {};
  rows.forEach(r => { const h = cpNormHandle(r.creator_handle); if (!h) return; const o = (m[h] = m[h] || { rev: 0, live: 0, video: 0, other: 0 }); const v = +r.revenue || 0;
    o.rev += v; if (r.order_channel === 'LIVE') o.live += v; else if (r.order_channel === 'Videos') o.video += v; else o.other += v; });
  return (_kjCom[key] = { m, partial: from < CP_API_START });
}
async function kjLoadAds(from, to) {
  const key = from + '|' + to; if (_kjAds[key]) return _kjAds[key];
  const h = { apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + authJwt(), 'Content-Type': 'application/json' };
  const res = await fetch(`${window.SUPABASE_URL}/rest/v1/rpc/kol_ads_range`, { method: 'POST', headers: h, body: JSON.stringify({ p_from: from, p_to: to }) });
  if (!res.ok) throw new Error('kol_ads_range ' + res.status);
  return (_kjAds[key] = (await res.json()) || {});
}
// แถวงาน + ค่า Ads / ยอดขายในช่วง · ค่าจ้างนับเฉพาะงานที่โพสต์ในช่วง · ยอดขายถอด VAT
function kjWithAds(r, a, inRange) {
  const s = [0, 0, 0, 0, 0]; if (a) Object.values(a.m || {}).forEach(v => v.forEach((x, i) => { s[i] += +x || 0; }));
  return { ...r, inRange, amount: inRange ? r.amount : 0, fb_ads_spend: s[0], fb_ads_value: s[1] / VAT_DIV, tt_gmvmax_cost: s[2], tt_gmvmax_rev: s[3] / VAT_DIV, tt_ads_spend: s[4], tt_ads_value: 0,
    ads_spend: s[0] + s[2] + s[4], sales: (s[1] + s[3]) / VAT_DIV };
}
async function kolRenderPage() {   // (2026-11-10) เรียกผ่าน renderKolPage() ใน dashboard.html (โหลดไฟล์นี้ก่อน)
  const tb = document.getElementById('tbodyKj'); if (!tb) return;
  try {
    if (!_kjRows) {
      const h = { apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + authJwt() };
      // (2026-10-01) เลือกเฉพาะคอลัมน์ที่หน้าใช้ (ค่า Ads / ยอดขายมาจาก kol_ads_range ตามช่วงวันที่) · โหลดค่า Ads ของช่วงปัจจุบันไปพร้อมกัน
      const KJ_COLS = 'k,job_id,content_code,kol_type,post_date,cost_month,platform,kol_name,kol_handle,tt_handle,channel_link,product_code,parent_sku,product_group,progress,post_link,video_id,budget_total,amount,match_status,match_note,pay_status,claim_amount,acct_amount,acct_months,claim_match,claim_over_budget';
      const [a, b] = await Promise.all([fetchAllRows(`${window.SUPABASE_URL}/rest/v1/mv_kol_plan_jobs?select=${KJ_COLS}&order=k.asc`, h),
        fetchAllRows(`${window.SUPABASE_URL}/rest/v1/products?select=parent_sku,product_name`, h),
        kjLoadAds(getDateValue('From') || '2000-01-01', getDateValue('To') || '2999-12-31').catch(() => null)]);
      _kjRows = a.map(r => ({ ...r, month: String(r.cost_month || '').slice(0, 7) }));   // month = เดือนที่โพสต์
      b.forEach(p => { if (p.parent_sku && p.product_name && !_kjNames[p.parent_sku]) _kjNames[p.parent_sku] = p.product_name; });
    }
  } catch (e) { tb.innerHTML = `<tr><td class="empty">โหลดไม่สำเร็จ: ${e.message}</td></tr>`; return; }
  renderKolTable();
}
function kjSetView(v) { _kjView = v; _kjSortCol = 'amount'; _kjSortDir = 'desc'; _kjOpen = new Map(); document.getElementById('kjCalSeg').style.display = v === 'cal' ? '' : 'none'; document.querySelectorAll('#kjViewSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); renderKolTable(); }
function kjSort(c) { if (_kjSortCol === c) _kjSortDir = _kjSortDir === 'asc' ? 'desc' : 'asc'; else { _kjSortCol = c; _kjSortDir = ['name', 'kol', 'sku', 'plat', 'type', 'date'].includes(c) ? 'asc' : 'desc'; } renderKolTable(); }
function kjFillProducts() {
  const sel = document.getElementById('kjProduct'); if (!sel || !_kjRows || sel.dataset.n == _kjRows.length) return;
  const by = {}; _kjRows.forEach(r => { const k = r.parent_sku || r.product_code; if (k) by[k] = (by[k] || 0) + (+r.amount || 0); });
  const cur = sel.value; sel.dataset.n = _kjRows.length;
  sel.innerHTML = '<option value="">ทุกสินค้า</option>' + Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k]) => `<option value="${k}">${_kjNames[k] || k} · ${k}</option>`).join('');
  sel.value = cur;
}
function kjPickProduct(sku) {   // กดชื่อสินค้าในมุมมอง "ตามสินค้า" → เลือกสินค้านั้น แล้วดูว่าจ้าง KOL คนไหนบ้าง
  kjFillProducts(); const sel = document.getElementById('kjProduct'); if (sel) sel.value = sku;
  kjSetView('kol');
}
// (2026-10-01) สถานะเบิกจ่าย — จากฟอร์มเบิกเงิน KOL วางข้างงานเท่านั้น (ไม่บวกเข้าค่าจ้าง) · บัญชีลงแล้ว = มีเดือนที่เกิดค่าใช้จ่าย บันทึกบัญชี (คอลัมน์ AB)
const KJ_PAY = { none: 'ยังไม่กรอกเบิก', claimed: 'กรอกเบิกแล้ว · รอบัญชี', partial: 'บัญชีลงบางงวด', acct: 'บัญชีลงแล้ว' };
const KJ_PAY_RANK = { none: 0, claimed: 1, partial: 2, acct: 3 };
const KJ_PAY_TIP = '<b>จากฟอร์มเบิกเงิน KOL</b> · ดูอย่างเดียว ไม่บวกเข้ายอด<br>• ยังไม่กรอกเบิก = ยังไม่มีใบเบิกของงานนี้<br>• รอบัญชี = มีใบเบิก แต่บัญชียังไม่ลงเดือน<br>• บัญชีลงแล้ว = บัญชีลงเดือนที่เกิดค่าใช้จ่ายแล้ว<br>• เกินงบ = บัญชีลงมากกว่างบเกิน 3% (ต่างไม่เกิน 3% = หัก ณ ที่จ่าย)<br>จับคู่ด้วย รหัส content → เลขคลิป → ชื่อ KOL + วันโพสต์';
// ข้อความสั้นใต้ป้ายสถานะ Ads (ข้อความเต็มอยู่ใน tooltip ของช่อง)
function kjShortNote(n) {
  n = String(n || '');
  if (/ทั้ง TikTok และ Facebook/.test(n)) return 'TikTok + Facebook';
  if (/\(Facebook\)/.test(n)) return 'Facebook';
  if (/มีข้อมูล Ads ของคลิป/.test(n)) return 'TikTok';
  if (/ไม่ใช่ลิงก์ TikTok/.test(n)) return 'ลิงก์ไม่ใช่ TikTok';
  if (/ยังไม่มีลิงก์/.test(n)) return 'ไม่มีลิงก์ในไฟล์';
  if (/เปิดลิงก์/.test(n)) return 'เปิดลิงก์ไม่ได้';
  if (/ไม่เจอ Ads ที่ชื่อตรง/.test(n)) return 'ชื่อไม่ตรงกับ Ads';
  if (/^ยังไม่โพสต์ · /.test(n)) return n.replace(/^ยังไม่โพสต์ · /, '');
  return '';
}
function kjPayCell(o, acct, claim) {
  const s = o.pay_status || 'none', b = +o.budget_total || 0;
  if (s === 'none') return b > 0 ? '<span class="kj-tag kj-nf">ยังไม่กรอกเบิก</span>' : '<span class="kj-tag">ไม่มีงบ</span>';
  const ms = String(o.acct_months || '').split(',').filter(Boolean).sort();
  const mTxt = !ms.length ? '' : ms.length === 1 ? 'ลง ' + PL_TH_M(ms[0]) : `${ms.length} งวด · ถึง ${PL_TH_M(ms[ms.length - 1])}`;
  const how = +o.claim_match === 2 ? 'จับคู่ใบเบิกจากเลขคลิป' : +o.claim_match === 3 ? 'จับคู่ใบเบิกจากชื่อ KOL + วันโพสต์ (รหัสในใบเบิกไม่ตรง)' : 'จับคู่ใบเบิกจากรหัส content';
  const paid = +acct || +claim || 0, over = paid > b * 1.031 + 1;   // ต่างไม่เกิน ~3% = หัก ณ ที่จ่าย (บัญชีลงยอดก่อนหัก) ไม่นับเป็นเกินงบ
  const label = { claimed: 'รอบัญชี', partial: 'ลงบางงวด', acct: 'บัญชีลงแล้ว' }[s] || s;
  return `<span class="kj-tag ${s === 'acct' ? 'kj-ok' : 'kj-no'}" title="${how}">${label}</span>`
    + (mTxt ? `<div style="font-size:10.5px;color:var(--text3);white-space:nowrap;">${mTxt}</div>` : '')
    + (over ? `<div style="font-size:10.5px;color:var(--red);font-weight:700;white-space:nowrap;" title="บัญชีลง ${fmt(Math.round(paid))} มากกว่างบในไฟล์ทีม KOL ${fmt(Math.round(b))} เกินส่วนต่างหัก ณ ที่จ่าย 3% — เช็คว่าจ่ายเกิน หรือไฟล์ทีม KOL ใส่งบไม่ครบ">เกินงบ ${fmt(Math.round(paid - b))}</div>` : '');
}
function renderKolTable() {
  if (!_kjRows) return;
  // (2026-10-01) ช่วงวันที่ด้านบน = วันโพสต์ (งบในไฟล์ทีม KOL ลงตามวันโพสต์ — ชุดเดียวกับ MKT Tracking ที่นับตามเดือนที่โพสต์)
  const dFrom = getDateValue('From') || '2000-01-01', dTo = getDateValue('To') || '2999-12-31';
  const plat = document.getElementById('kjPlat').value, typ = document.getElementById('kjType').value, q = (document.getElementById('kjSearch').value || '').trim().toLowerCase();
  const st = (document.getElementById('kjStatus') || {}).value || '';
  const stOk = r => !st || (st.startsWith('pay:') ? r.pay_status === st.slice(4) : r.match_status === st);
  kjFillProducts(); const prod = (document.getElementById('kjProduct') || {}).value || '';
  // (2026-10-01) ค่าจ้าง = งานที่โพสต์ในช่วงนี้ · ค่า Ads / ยอดขาย = ที่ใช้เงิน/เกิดในช่วงนี้ (รวมงานที่โพสต์ก่อนช่วงแต่ยังยิง Ads อยู่)
  const A = _kjAds[dFrom + '|' + dTo];
  if (!A) { const tb = document.getElementById('tbodyKj'); if (tb && !tb.querySelector('.kj-skr')) { tb.innerHTML = ''; if (typeof kolSkeleton === 'function') kolSkeleton(); }   // (2026-11-10) คงโครงตารางไว้ระหว่างโหลด (กันหน้าเด้ง)
    kjLoadAds(dFrom, dTo).then(() => { if (currentPage === 'kol') renderKolTable(); }).catch(e => { const t2 = document.getElementById('tbodyKj'); if (t2) t2.innerHTML = `<tr><td class="empty">โหลดไม่สำเร็จ: ${e.message}</td></tr>`; }); return; }
  const inR = r => !!(r.post_date && r.post_date >= dFrom && r.post_date <= dTo);
  // (2026-10-15) เลือกสถานะ (เบิกจ่าย / Ads ของงาน) = ดูเฉพาะงานที่โพสต์ในช่วงนี้ ให้ตรงกับตัวเลขในการ์ด · ไม่เลือกสถานะ = รวมงานเก่าที่ยังยิง Ads ในช่วงนี้
  const keep = r => stOk(r) && (!plat || kjPlat(r.platform) === plat) && (!typ || new RegExp('^' + typ, 'i').test(r.kol_type || '')) && (!prod || (r.parent_sku || r.product_code) === prod)
    && (!q || `${r.kol_name || ''} ${r.content_code || ''} ${r.tt_handle || ''}`.toLowerCase().includes(q));
  const rows = _kjRows.filter(r => (inR(r) || (!st && A[r.k])) && keep(r)).map(r => kjWithAds(r, A[r.k], inR(r)));
  // (2026-11-10) ช่วงก่อน (ตัวกรองเดียวกัน) → ป้าย % บนการ์ด · ค่า Ads ช่วงก่อนโหลดตามหลัง ไม่รอ
  const PR = getDateValue('From') ? kjPrevRange(dFrom, dTo) : null, AP = PR ? _kjAds[PR.from + '|' + PR.to] : null;
  if (PR && !AP) kjLoadAds(PR.from, PR.to).then(() => { if (currentPage === 'kol') renderKolTable(); }).catch(() => { _kjAds[PR.from + '|' + PR.to] = {}; });
  const TP = AP ? (() => { const inP = r => !!(r.post_date && r.post_date >= PR.from && r.post_date <= PR.to);
    return _kjRows.filter(r => (inP(r) || (!st && AP[r.k])) && keep(r)).map(r => kjWithAds(r, AP[r.k], inP(r)))
      .reduce((t, r) => { t.amount += +r.amount || 0; t.ads += +r.ads_spend || 0; t.sales += +r.sales || 0; return t; }, { amount: 0, ads: 0, sales: 0 }); })() : null;
  const pl = PR ? PR.label : 'ช่วงก่อน';
  // (2026-10-06) ยอด Commission: ไม่ได้กรองอะไรนอกจากวันที่ = KOL ทุกคนในไฟล์ทีม KOL (ตรงกับ Creator Performance กรอง KOL) · มีตัวกรองอื่น = เฉพาะ KOL ในแถวที่เห็น
  const C = _kjCom[dFrom + '|' + dTo];
  if (!C) kjLoadCom(dFrom, dTo).then(() => { if (currentPage === 'kol') renderKolTable(); }).catch(e => { _kjCom[dFrom + '|' + dTo] = { err: e.message, m: {} }; if (currentPage === 'kol') renderKolTable(); });
  const AE = _kjAcctE[dFrom + '|' + dTo];
  if (!AE) kjLoadAcct(dFrom, dTo).then(() => { if (currentPage === 'kol') renderKolTable(); }).catch(e => { _kjAcctE[dFrom + '|' + dTo] = { err: e.message }; if (currentPage === 'kol') renderKolTable(); });
  const comNA = !!plat && plat !== 'TikTok', comAll = !prod && !q && !st && !typ && !comNA;
  const hOf = r => cpNormHandle(r.tt_handle || '');
  const comOf = hs => { const t = { rev: 0, live: 0, video: 0, other: 0, n: 0 }; if (C && C.m) hs.forEach(h => { const x = C.m[h]; if (x && x.rev) { t.rev += x.rev / VAT_DIV; t.live += x.live / VAT_DIV; t.video += x.video / VAT_DIV; t.other += x.other / VAT_DIV; t.n++; } }); return t; };
  const CT = comNA ? comOf([]) : comOf(new Set((comAll ? _kjRows : rows).map(hOf).filter(Boolean)));
  const val = r => ({ amount: +r.amount || 0, ads: +r.ads_spend || 0, sales: +r.sales || 0 });
  _kjFiltered = rows;
  if (_kjView === 'cal') { document.getElementById('kjTableWrap').style.display = 'none'; document.getElementById('kjCal').style.display = ''; }
  else { document.getElementById('kjTableWrap').style.display = ''; document.getElementById('kjCal').style.display = 'none'; }
  // ยอดเงินรวมจากทุกแถว · จำนวนงานนับครั้งเดียวต่องาน (งานที่แบ่งหลายสินค้ามีหลายแถว)
  const T = rows.reduce((t, r) => { const v = val(r); t.amount += v.amount; t.ads += v.ads; t.sales += v.sales; t.acct += r.inRange ? (+r.acct_amount || 0) : 0; if (/^conv/i.test(r.kol_type || '')) t.conv += v.amount; else t.pr += v.amount;
    t.aTT += (+r.tt_gmvmax_cost || 0) + (+r.tt_ads_spend || 0); t.aFB += +r.fb_ads_spend || 0; t.sTT += (+r.tt_gmvmax_rev || 0) + (+r.tt_ads_value || 0); t.sFB += +r.fb_ads_value || 0; return t; }, { amount: 0, ads: 0, sales: 0, acct: 0, conv: 0, pr: 0, aTT: 0, aFB: 0, sTT: 0, sFB: 0 });
  const J = [...new Map(rows.filter(r => r.inRange).map(r => [r.content_code, r])).values()], cnt = f => J.filter(f).length;
  const adsPrev = rows.filter(r => !r.inRange).reduce((t, r) => t + (+r.ads_spend || 0), 0);
  // (2026-10-02) boost บัญชี/เพจ KOL ที่หางานในไฟล์ไม่เจอ — แสดงแยก ไม่บวกเข้ายอด (โชว์เมื่อไม่ได้กรองอื่นนอกจากวันที่ / Facebook)
  const boostFree = (!prod && !q && !st && !typ && (!plat || plat === 'Facebook')) ? Object.values(((A._boost || {}).m) || {}).reduce((t, v) => t + (+v[0] || 0), 0) : 0;
  T.n = J.length; T.m = cnt(r => r.match_status === 'matched'); T.na = cnt(r => r.match_status === 'no_ads'); T.nf = cnt(r => r.match_status === 'not_found'); T.np = cnt(r => r.match_status === 'not_posted');
  const P = { acct: cnt(r => r.pay_status === 'acct' || r.pay_status === 'partial'), claimed: cnt(r => r.pay_status === 'claimed'), none: cnt(r => r.pay_status === 'none' && +r.budget_total > 0) };
  const fd = d => new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  document.getElementById('kjNote').textContent = `${fd(dFrom)} – ${fd(dTo)} · ค่าจ้างนับตามวันโพสต์ · ค่า Ads / ยอดขายนับตามวันที่เกิดจริง · บัญชีลงค่าใช้จ่ายนับตามเดือนที่บัญชีลง`;
  { const box = document.getElementById('kjProdSum'); if (box) {   // (2026-10-01) เลือกสินค้า → สรุปว่าจ้างใคร กี่งาน ช่องทาง / ประเภทไหน
    if (!prod) box.style.display = 'none';
    else { const kols = new Set(J.map(r => kjDisplay(r))), cntBy = (f) => { const o = {}; J.forEach(r => { const k = f(r); o[k] = (o[k] || 0) + 1; }); return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${fmt(v)}`).join(' · '); };
      box.style.display = ''; box.innerHTML = `<b style="font-size:14px;">${_kjNames[prod] || prod}</b> <span style="font-family:'Sarabun',sans-serif;font-size:11px;color:var(--text3);">${prod}</span>
        <span style="margin-left:10px;">จ้าง <b>${fmt(kols.size)} KOL</b> · <b>${fmt(J.length)} งาน</b></span>
        <span style="margin-left:10px;color:var(--text2);">ช่องทาง: ${cntBy(r => { const p = kjPlat(r.platform); return p === 'other' ? 'อื่นๆ' : p; })}</span>
        <span style="margin-left:10px;color:var(--text2);">ประเภท: ${cntBy(r => /^conv/i.test(r.kol_type || '') ? 'Conversion' : /^pr/i.test(r.kol_type || '') ? 'PR' : 'อื่นๆ')}</span>
        <span style="margin-left:10px;color:var(--text3);font-size:11px;">ดู "ตาม KOL" = ใครได้ไปเท่าไหร่ · "ตามงาน" = ทุกงานพร้อมลิงก์โพสต์</span>`; } } }
  const all = T.amount + T.ads;
  const allP = TP ? TP.amount + TP.ads : 0;
  const kPrev = (cur, prev, good, txt) => TP && prev > 0 ? `<div style="display:flex;align-items:center;gap:2px;white-space:nowrap;overflow:hidden;">${kjChip(cur, prev, good, pl).replace('margin-left:6px;', 'margin:0 6px 0 0;')}<span title="${pl} ${txt}">ก่อน ${txt}</span></div>` : '';   // (2026-11-10) บรรทัดเทียบช่วงก่อน
  // (2026-10-02) การ์ดอ่านง่าย: ตัวเลขใหญ่ + บรรทัดย่อยสั้นๆ · รายละเอียดอยู่ใน ⓘ · สถานะเป็นแถบสี
  const merV = all > 0 ? T.sales / all : 0, merC = v => v >= 2 ? 'var(--green)' : v >= 1 ? 'var(--accent)' : 'var(--red)';
  const kSub = h => h ? `<div style="font-size:11px;color:var(--text3);line-height:1.6;">${h}</div>` : '';
  const kBar = (parts, money) => `<div style="display:flex;height:6px;border-radius:3px;overflow:hidden;background:rgba(148,163,184,.18);margin:8px 0 6px;">${parts.filter(p => p[0] > 0).map(p => `<div title="${p[2]} ${money ? '' : ''}${fmt(Math.round(p[0]))}${money ? '' : ' งาน'}" style="flex:${p[0]};background:${p[1]};"></div>`).join('')}</div>`;
  const kDot = (c, t) => `<span style="white-space:nowrap;margin-right:8px;"><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${c};margin-right:4px;vertical-align:middle;"></span>${t}</span>`;
  const kUnit = t => `<span style="font-size:12.5px;color:var(--text3);font-weight:500;margin-left:4px;">${t}</span>`;
  const C_CONV = 'var(--accent)', C_PR = '#a78bfa', C_TT = '#14b8a6', C_FB = '#60a5fa';
  const nOther = Math.max(0, T.n - T.m - T.na - T.nf - T.np);
  const cpStartTxt = new Date(CP_API_START).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const comCard = (() => {
    const head = `<div class="card-title">ยอดขาย Commission ${plTip('tip-kj-com', 'ยอดขายทุกออเดอร์ที่ TikTok จ่าย Commission ให้ KOL ที่จ้าง ในช่วงนี้ — ทั้ง Live คลิปอื่นนอกจากคลิปงาน และโชว์เคส<br>• KOL = ครีเอเตอร์ที่มีงานในไฟล์งานทีม KOL (รวม Presenter) · ไม่ได้กรองอะไรนอกจากวันที่ = KOL ทุกคนในไฟล์ (ตรงกับ Creator Performance กรอง KOL ก่อนถอด VAT) · มีตัวกรองอื่น = เฉพาะ KOL ในตาราง<br>• นับตามวันที่สั่งซื้อ · ไม่รวมยกเลิก / คืน · ถอด VAT แล้ว<br>• แสดงแยก ไม่บวกเข้ายอดขายที่ผูกได้ และไม่คิดใน MER เพราะบางออเดอร์ซ้ำกับยอดจาก Ads ของคลิปงาน<br>• มีข้อมูลตั้งแต่ ' + cpStartTxt, 'right')}</div>`;
    const dash = sub => `<div class="card">${head}<div class="kpi-value" style="color:var(--text3);">—</div>${kSub(sub)}</div>`;
    if (comNA) return dash('มีเฉพาะ TikTok');
    if (!C) return `<div class="card">${head}<div class="kpi-value"><span class="skeleton" style="display:inline-block;width:70%;height:22px;border-radius:4px;"></span></div></div>`;
    if (C.err) return dash('โหลดไม่สำเร็จ');
    if (C.none) return dash('มีข้อมูลตั้งแต่ ' + cpStartTxt);
    return `<div class="card">${head}<div class="kpi-value">${fmt(Math.round(CT.rev))}${kUnit(fmt(CT.n) + ' คน')}</div>${kBar([[CT.live, '#f472b6', 'Live'], [CT.video, '#60a5fa', 'คลิป'], [CT.other, '#c8a96e', 'โชว์เคส / อื่นๆ']], 1)}${kSub(kDot('#f472b6', 'Live ' + fmt(Math.round(CT.live))) + kDot('#60a5fa', 'คลิป ' + fmt(Math.round(CT.video))) + (CT.other >= 1 ? kDot('#c8a96e', 'อื่นๆ ' + fmt(Math.round(CT.other))) : '') + (C.partial ? '<br>นับตั้งแต่ ' + cpStartTxt : ''))}</div>`;
  })();
  { const ks = document.getElementById('kjStat');   // (2026-11-10) สถานะการจับคู่ Ads ของงาน → บรรทัดสรุปที่หัวตาราง (เดิมเป็นการ์ดใบที่ 5)
    if (ks) ks.innerHTML = T.n ? `เจอ Ads <b>${fmt(T.m)}</b> / ${fmt(T.n)} งาน`
      + [[T.na, 'var(--text3)', 'ไม่ได้ยิง Ads'], [T.nf, 'var(--red)', 'หาไม่เจอ'], [T.np, '#60a5fa', 'ยังไม่โพสต์'], [nOther, 'var(--text3)', 'ช่องทางอื่น']].filter(x => x[0] > 0).map(x => ` · <span style="color:${x[1]}">● </span>${x[2]} ${fmt(x[0])}`).join('')
      + ` ${plTip('tip-kj-match', '• เจอ Ads = เจอ Ads ของคลิป/โพสต์<br>• ไม่ได้ยิง Ads = เจอคลิป แต่ไม่มี Ads<br>• หาไม่เจอ = ลิงก์ผิด / ไม่ใช่ TikTok หรือชื่อไม่ตรงกับ Ads → ควรแก้ไฟล์<br>• ยังไม่โพสต์ = ยังไม่มีลิงก์ / ยังไม่ถึงวันโพสต์<br>• ช่องทางอื่น = IG / Lemon8 / FB group (ไม่มีข้อมูล Ads)<br>เลือกดูทีละสถานะได้ที่ตัวกรอง "สถานะ" ด้านบน')}` : ''; }
  { const kk = document.getElementById('kjKpis'); if (kk && kk.offsetHeight) kk.style.minHeight = Math.max(parseFloat(kk.style.minHeight) || 0, kk.offsetHeight) + 'px'; }   // (2026-11-10) การ์ดวาดใหม่ระหว่างโหลดส่วนย่อย → ไม่ให้แถวการ์ดหดแล้วขยาย (กันหน้าเด้ง)
  document.getElementById('kjKpis').innerHTML = `
    <div class="card"><div class="card-title">ค่าจ้าง KOL ${plTip('tip-kj-amt', 'งบในไฟล์งานทีม KOL (ก่อน VAT) ของงานที่โพสต์ในช่วงนี้<br>ตรงกับ MKT Tracking · เจาะสินค้า · Creator Performance (งาน TikTok)<br>Business Insight ใช้ยอดที่บัญชีลง จึงอาจต่างกัน')}</div><div class="kpi-value">${fmt(Math.round(T.amount))}${kUnit(fmt(T.n) + ' งาน')}</div>${kBar([[T.conv, C_CONV, 'Conversion'], [T.pr, C_PR, 'PR']], 1)}${kSub(kPrev(T.amount, TP && TP.amount, false, fmt(Math.round(TP ? TP.amount : 0))) + kDot(C_CONV, 'Conversion ' + fmt(Math.round(T.conv))) + kDot(C_PR, 'PR ' + fmt(Math.round(T.pr))))}</div>
    <div class="card"><div class="card-title">ค่า Ads งาน KOL ${plTip('tip-kj-ads', 'ค่า Ads ที่ยิงคลิป/โพสต์ของงาน KOL นับตามวันที่ใช้เงิน<br>• TikTok = GMV Max + Ads ปกติ/Spark (ตรงกับ Creator Performance)<br>• Facebook = Ads ที่ ad name หรือชื่อ KOL ตรงกับงาน (ตรงกับหน้า Facebook Ads)' + (adsPrev ? `<br>รวมงานที่โพสต์ก่อนช่วง ${fmt(Math.round(adsPrev))}` : '') + (boostFree >= 1 ? `<br>ไม่รวม boost ที่ยังไม่ผูกงาน ${fmt(Math.round(boostFree))}` : ''))}</div><div class="kpi-value">${fmt(Math.round(T.ads))}${T.amount > 0 ? kUnit((T.ads / T.amount * 100).toFixed(0) + '% ของค่าจ้าง') : ''}</div>${kBar([[T.aTT, C_TT, 'TikTok'], [T.aFB, C_FB, 'Facebook']], 1)}${kSub(kPrev(T.ads, TP && TP.ads, false, fmt(Math.round(TP ? TP.ads : 0))) + kDot(C_TT, 'TikTok ' + fmt(Math.round(T.aTT))) + kDot(C_FB, 'Facebook ' + fmt(Math.round(T.aFB))))}</div>
    <div class="card"><div class="card-title">ยอดขายที่ผูกได้ ${plTip('tip-kj-vat', 'ยอดขายที่ Ads ของคลิป/โพสต์งาน KOL นับได้<br>• TikTok = ยอดขาย GMV Max ของคลิป<br>• Facebook = ยอดซื้อที่ Meta นับ<br>ถอด VAT 7% แล้ว ให้เทียบกับค่าจ้าง / ค่า Ads')}</div><div class="kpi-value">${fmt(Math.round(T.sales))}${kUnit('ถอด VAT')}</div>${kBar([[T.sTT, C_TT, 'TikTok'], [T.sFB, C_FB, 'Facebook']], 1)}${kSub(kPrev(T.sales, TP && TP.sales, true, fmt(Math.round(TP ? TP.sales : 0))) + kDot(C_TT, 'TikTok ' + fmt(Math.round(T.sTT))) + kDot(C_FB, 'Facebook ' + fmt(Math.round(T.sFB))))}</div>
    <div class="card"><div class="card-title">MER ${plTip('tip-kj-mer', 'ยอดขายที่ผูกได้ ÷ (ค่าจ้าง + ค่า Ads)<br>เขียว ≥ 2x · ทอง 1–2x · แดง &lt; 1x (แถบเต็ม = 2x)')}</div><div class="kpi-value" style="${all > 0 ? 'color:' + merC(merV) + ';' : ''}">${all > 0 ? merV.toFixed(2) + 'x' : '—'}</div><div style="height:6px;border-radius:3px;overflow:hidden;background:rgba(148,163,184,.18);margin:8px 0 6px;"><div style="height:100%;width:${Math.min(100, merV / 2 * 100).toFixed(0)}%;background:${merC(merV)};"></div></div>${kSub((all > 0 && allP > 0 ? kPrev(merV, TP.sales / allP, true, (TP.sales / allP).toFixed(2) + 'x') : '') + (all > 0 ? `ลง 1 ได้ยอดขาย ${merV.toFixed(2)}` : ''))}</div>

    <div class="card"><div class="card-title">บัญชีลงค่าใช้จ่าย ${plTip('tip-kj-pay', `ยอดที่บัญชีลงเป็นค่าใช้จ่าย KOL ${AE && AE.from ? (AE.from === AE.to ? 'เดือน ' + PL_TH_M(AE.from) : PL_TH_M(AE.from) + ' – ' + PL_TH_M(AE.to)) : ''} — <b>เท่ากับชีทเบิกเงิน KOL</b><br>คอลัมน์ AB = เดือนที่บัญชีลง · คอลัมน์ AR = จำนวนตั้งหนี้ EX.VAT บัญชีลง<br>นับตามเดือนที่บัญชีลง ไม่ใช่วันโพสต์ จึงต่างจากค่าจ้าง KOL ได้ (งานที่จ่ายก่อน / หลังเดือนที่โพสต์)<br>เลือกช่วงไม่เต็มเดือน = นับทั้งเดือนของวันแรกถึงวันสุดท้าย · ไม่ขึ้นกับตัวกรองอื่น<br>บรรทัดส้ม = งานที่โพสต์ในช่วงนี้แต่ยังไม่กรอกเบิก`, 'right')}</div>
      <div class="kpi-value">${!AE ? '…' : AE.err ? '—' : fmt(Math.round(+AE.total || 0))}${AE && !AE.err ? kUnit(fmt(+AE.n || 0) + ' ใบ') : ''}</div>${AE && !AE.err ? kBar([[+AE.conv || 0, C_CONV, 'Conversion'], [+AE.pr || 0, C_PR, 'PR'], [+AE.other || 0, '#94a3b8', 'อื่น ๆ']], 1) : kBar([])}${kSub((AE && !AE.err ? kDot(C_CONV, 'Conversion ' + fmt(Math.round(+AE.conv || 0))) + kDot(C_PR, 'PR ' + fmt(Math.round(+AE.pr || 0))) : AE && AE.err ? 'โหลดไม่สำเร็จ' : '') + (P.none ? kDot('var(--orange)', 'ยังไม่กรอกเบิก ' + fmt(P.none) + ' งาน') : ''))}</div>${comCard}`;
  // รวมตามมุมมอง
  let list;
  if (_kjView === 'cal') { renderKolCal(); return; }
  if (_kjView === 'job') {
    // 1 งาน = 1 Content Name · งานที่แบ่งหลายสินค้า (หลายแถว) รวมกลับเป็นแถวเดียว
    const g = {}; rows.forEach(r => { (g[r.content_code] = g[r.content_code] || []).push(r); });
    // คลิปเดียวกันอยู่หลายงานในไฟล์ทีม KOL → เตือน (ค่า Ads / ยอดขายของคลิปถูกแบ่งเท่าๆ กันระหว่างงานเหล่านั้น ไม่นับซ้ำ)
    const codeBase = c => String(c || '').toLowerCase().replace(/_[a-z]{3}\d{0,2}$/, '');
    const vidJobs = {}; (_kjRows || []).forEach(x => { if (x.video_id) (vidJobs[x.video_id] = vidJobs[x.video_id] || new Set()).add(x.content_code); });
    const dupKind = r => { const others = [...(vidJobs[r.video_id] || [])].filter(c => c !== r.content_code); if (!others.length) return ''; return others.some(c => codeBase(c) !== codeBase(r.content_code)) ? 'link' : 'extra'; };
    list = Object.entries(g).map(([k, js]) => {
      const r = js[0], t = js.reduce((a, x) => { const v = val(x); a.amount += v.amount; a.ads += v.ads; a.sales += v.sales; a.acct += +x.acct_amount || 0; a.claim += +x.claim_amount || 0; return a; }, { amount: 0, ads: 0, sales: 0, acct: 0, claim: 0 });
      const skus = [...new Set(js.map(x => _kjNames[x.parent_sku] || x.parent_sku || x.product_group || x.product_code || '—'))];
      return { ...r, ...t, key: 'j' + r.job_id, jobs: js, n: js.length, kol: kjDisplay(r), sku: skus.join(', '),
        plat: r.platform || '—', type: r.kol_type || '—', date: r.post_date || '', shared: r.video_id && vidJobs[r.video_id] ? vidJobs[r.video_id].size - 1 : 0, dupKind: dupKind(r), payRank: KJ_PAY_RANK[r.pay_status] || 0 };
    });
  }
  else {
    const by = {};
    rows.forEach(r => { const k = _kjView === 'kol' ? kjDisplay(r) : (r.parent_sku || r.product_code || '—');
      const o = (by[k] = by[k] || { key: k, name: _kjView === 'kol' ? k : (_kjNames[k] || k), n: 0, codes: new Set(), amount: 0, ads: 0, sales: 0, plats: new Set(), jobs: [] });
      const v = val(r); if (r.inRange) o.codes.add(r.content_code); o.n = o.codes.size; o.jobs.push(r); o.amount += v.amount; o.ads += v.ads; o.sales += v.sales; o.plats.add(kjPlat(r.platform)); });
    if (_kjView === 'kol' && comAll && C && C.m) {   // (2026-10-06) KOL ที่เคยจ้าง ไม่มีงาน / Ads ในช่วงนี้ แต่ยังมียอด Commission → ใส่แถวด้วย ให้ผลรวมคอลัมน์ = การ์ด
      const seen = new Set(rows.map(hOf).filter(Boolean)), latest = {};
      _kjRows.forEach(r => { const h = hOf(r); if (h && !seen.has(h) && C.m[h] && C.m[h].rev && (!latest[h] || String(r.post_date || '') > String(latest[h].post_date || ''))) latest[h] = r; });
      Object.values(latest).forEach(r => { const k = kjDisplay(r);
        const o = (by[k] = by[k] || { key: k, name: k, n: 0, codes: new Set(), amount: 0, ads: 0, sales: 0, plats: new Set(), jobs: [] });
        o.jobs.push({ ...r, inRange: false, amount: 0, ads_spend: 0, sales: 0, fb_ads_spend: 0, fb_ads_value: 0, tt_gmvmax_cost: 0, tt_gmvmax_rev: 0, tt_ads_spend: 0, tt_ads_value: 0 });
        o.plats.add(kjPlat(r.platform)); o.comOnly = !o.codes.size && !o.amount && !o.ads && !o.sales; });
    }
    list = Object.values(by).map(o => ({ ...o, plat: [...new Set(o.jobs.map(j => j.platform || ''))].join(','), chLink: (o.jobs.find(j => j.channel_link) || {}).channel_link || '' }));
  }
  list.forEach(o => { o.mer = (o.amount + o.ads) > 0 ? o.sales / (o.amount + o.ads) : 0; if (_kjView === 'kol') { o.comD = comNA ? comOf([]) : comOf(new Set((o.jobs || []).map(hOf).filter(Boolean))); o.com = o.comD.rev; } });
  list.sort((a, b) => { const av = a[_kjSortCol], bv = b[_kjSortCol]; const c = typeof av === 'string' ? String(av).localeCompare(String(bv), 'th') : (av || 0) - (bv || 0); return _kjSortDir === 'asc' ? c : -c; });
  _kjList = list;
  const th = (k, label, left, w) => `<th class="sortable-th${left ? ' c-left' : ''}" style="white-space:nowrap;${w ? 'width:' + w + ';' : ''}" onclick="kjSort('${k}')">${label} <span class="sort-ind">${_kjSortCol === k ? (_kjSortDir === 'asc' ? '▲' : '▼') : ''}</span></th>`;
  const money = v => v ? `${fmt(Math.round(v))}` : '<span style="color:var(--text3);">—</span>';
  const mer = o => o.sales > 0 ? `<b>${o.mer.toFixed(2)}x</b>` : '<span style="color:var(--text3);">—</span>';
  const comCell = o => !C ? '<td><span style="color:var(--text3);">…</span></td>' : o.com >= 1 ? `<td title="Live ${fmt(Math.round(o.comD.live))} · คลิป ${fmt(Math.round(o.comD.video))} · โชว์เคส / อื่นๆ ${fmt(Math.round(o.comD.other))} (ถอด VAT)">${fmt(Math.round(o.com))}</td>` : '<td><span style="color:var(--text3);">—</span></td>';
  if (_kjView === 'job') {
    { const tbl = document.getElementById('theadKj').closest('table'); if (tbl) tbl.style.tableLayout = 'fixed'; }   // (2026-10-02) คุมความกว้างคอลัมน์
    document.getElementById('theadKj').innerHTML = `<tr>${th('kol', 'KOL', 1, '17%')}${th('plat', 'ช่องทาง', 1, '6%')}${th('sku', 'สินค้า', 1, '13%')}${th('type', 'ประเภท', 0, '7%')}${th('date', 'วันโพสต์', 0, '8%')}${th('amount', 'ค่าจ้าง', 0, '8%')}${th('ads', 'ค่า Ads', 0, '7%')}${th('sales', 'ยอดขาย ' + plTip('tip-kjh-vat' + _kjView, 'ยอดขายจาก Ads ของคลิป/โพสต์ · ถอด VAT แล้ว', 'right'), 0, '8%')}${th('mer', 'MER ' + plTip('tip-kjh-mer', 'ยอดขาย ÷ (ค่าจ้าง + ค่า Ads)', 'right'), 0, '6%')}<th style="white-space:nowrap;width:9%;">Ads ของงาน</th>${th('payRank', 'เบิกจ่าย ' + plTip('tip-kjh-pay', KJ_PAY_TIP, 'right'), 0, '11%')}</tr>`;
    document.getElementById('tbodyKj').innerHTML = list.map(o => `<tr>
      <td class="c-left">${o.channel_link ? `<a href="${o.channel_link}" target="_blank" rel="noopener" title="เปิดช่อง KOL" class="kj-name">${o.kol}</a>` : `<b>${o.kol}</b>`}${o.post_link ? `<a href="${o.post_link}" target="_blank" rel="noopener" title="เปิดโพสต์" class="kj-post">↗</a>` : ''}<div style="color:var(--text3);font-size:10px;font-family:'Sarabun',sans-serif;word-break:break-all;">${o.content_code || ''}</div></td>
      <td class="c-left kj-icons">${kjIcons(o.plat)}</td><td class="c-left" style="font-size:11.5px;white-space:normal;">${o.sku}${o.n > 1 ? `<div style="font-size:10px;color:var(--accent);" title="งานนี้รีวิวหลายสินค้า — ค่าจ้าง ค่า Ads และยอดขายถูกแบ่งเท่าๆ กันให้แต่ละสินค้า (กติกาเดียวกับ MKT Tracking)">แบ่ง ${o.n} สินค้า</div>` : ''}</td><td>${o.type}</td>
      <td>${o.date ? new Date(o.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}${o.progress && o.match_status === 'not_posted' ? `<div style="font-size:10.5px;color:var(--text3);">${o.progress}</div>` : ''}${o.inRange ? '' : '<div style="font-size:10.5px;color:var(--orange);" title="ค่าจ้างนับในเดือนที่โพสต์ — แถวนี้ขึ้นเพราะยังมีค่า Ads / ยอดขายในช่วงนี้">โพสต์ก่อนช่วงนี้</div>'}</td>
      <td>${money(o.amount)}</td><td>${o.ads >= 1 ? `<span class="pl-trace" onclick="openKolTrace(${trReg({ ks: o.jobs.map(x => x.k), kol: o.kol_handle || o.kol_name || '', ads: o.ads, sales: o.sales })},'ads')" title="คลิกเพื่อดูที่มาของตัวเลข">${fmt(Math.round(o.ads))}</span>` : money(o.ads)}</td><td>${o.sales >= 1 ? `<span class="pl-trace" onclick="openKolTrace(${trReg({ ks: o.jobs.map(x => x.k), kol: o.kol_handle || o.kol_name || '', ads: o.ads, sales: o.sales })},'sales')" title="คลิกเพื่อดูที่มาของตัวเลข">${fmt(Math.round(o.sales))}</span>` : money(o.sales)}</td><td>${mer(o)}</td>
      <td title="${o.match_note || ''}">${o.match_status === 'matched' ? '<span class="kj-tag kj-ok">เจอ Ads</span>' : o.match_status === 'no_ads' ? '<span class="kj-tag kj-no">ไม่ได้ยิง Ads</span>' : o.match_status === 'not_found' ? '<span class="kj-tag kj-no" style="color:var(--red);">หาไม่เจอ</span>' : o.match_status === 'not_posted' ? '<span class="kj-tag kj-no">ยังไม่โพสต์</span>' : '<span class="kj-tag kj-no">ไม่มีข้อมูล Ads</span>'}${kjShortNote(o.match_note) ? `<div style="font-size:10.5px;color:var(--text3);">${kjShortNote(o.match_note)}</div>` : ''}${o.shared ? (() => { const K = { link: ['⚠️ ลิงก์อาจผิด', 'var(--orange)', 'รหัสงานต่างกัน แต่ลิงก์เปิดแล้วเป็นคลิปเดียวกับงานอื่น — ถ้าเป็นคลิปใหม่ ให้แก้ลิงก์ในไฟล์ทีม KOL'], extra: ['⚠️ คลิปเดิมหลายงาน?', 'var(--orange)', 'KOL คนเดิมใช้คลิปเดียวกันในงานคนละเดือน — ถ้าเป็นการจ่ายเพิ่มสำหรับคลิปเดิม ไม่ต้องแก้'] }[o.dupKind] || ['⚠️ คลิปเดียวกับอีก ' + o.shared + ' งาน', 'var(--orange)', ''];
        return `<div style="font-size:10px;color:${K[1]};font-weight:700;" title="${K[2]} · ค่า Ads และยอดขายของคลิปถูกแบ่งเท่าๆ กันระหว่างงาน (ไม่นับซ้ำ)">${K[0]}</div>`; })() : ''}</td>
      <td>${kjPayCell(o, o.acct, o.claim)}</td></tr>`).join('')
      || '<tr><td colspan="11" class="empty">ไม่มีงานที่โพสต์ในช่วงนี้</td></tr>';

  } else {
    { const tbl = document.getElementById('theadKj').closest('table'); if (tbl) tbl.style.tableLayout = ''; }
    const lbl = _kjView === 'kol' ? 'KOL' : 'สินค้า', showPlat = _kjView === 'kol';
    document.getElementById('theadKj').innerHTML = `<tr>${th('name', lbl, 1)}${showPlat ? th('plat', 'ช่องทาง', 1) : ''}${th('n', 'งาน')}${th('amount', 'ค่าจ้าง')}${th('ads', 'ค่า Ads')}${th('sales', 'ยอดขายที่ผูกได้ ' + plTip('tip-kjh-vat' + _kjView, 'ยอดขายจาก Ads ของคลิป/โพสต์ · ถอด VAT แล้ว', 'right'))}${th('mer', 'MER ' + plTip('tip-kjh-mer2', 'ยอดขาย ÷ (ค่าจ้าง + ค่า Ads)', 'right'))}${showPlat ? th('com', 'ยอด Commission ' + plTip('tip-kjh-com', 'ยอดขายที่ TikTok จ่าย Commission ให้ KOL คนนี้ในช่วงนี้ (Live / คลิปอื่น / โชว์เคส) · ถอด VAT · ชี้ที่ตัวเลขเพื่อดูแยก<br>แสดงแยก ไม่บวกเข้ายอดขายที่ผูกได้ และไม่คิดใน MER<br>ไม่ได้กรองอะไรนอกจากวันที่ = มี KOL ที่ไม่มีงานในช่วงนี้แต่ยังมียอด Commission ด้วย', 'right')) : ''}</tr>`;
    document.getElementById('tbodyKj').innerHTML = list.map(o => `<tr><td class="c-left">${_kjView === 'sku' ? `<a onclick="kjPickProduct('${String(o.key).replace(/'/g, '')}')" style="cursor:pointer;font-weight:700;color:var(--text);" title="กดเพื่อดูว่าจ้าง KOL คนไหนบ้าง">${o.name}</a> <a onclick="kjPickProduct('${String(o.key).replace(/'/g, '')}')" style="cursor:pointer;font-size:10.5px;color:var(--accent);margin-left:4px;">ดู KOL →</a>` : `<b>${o.name}</b>${o.comOnly ? '<div style="font-size:10.5px;color:var(--text3);font-weight:400;">ไม่มีงานในช่วงนี้ · มีแต่ยอด Commission</div>' : ''}`}${showPlat && o.chLink ? ` <a href="${o.chLink}" target="_blank" rel="noopener" title="เปิดช่อง KOL" style="text-decoration:none;">🔗</a>` : ''}</td>${showPlat ? `<td class="c-left kj-icons">${kjIcons(o.plat)}</td>` : ''}<td>${fmt(o.n)}</td>${kjCell(o, 'amount')}${kjCell(o, 'ads')}${kjCell(o, 'sales')}<td>${mer(o)}</td>${showPlat ? comCell(o) : ''}</tr>`).join('')
      || `<tr><td colspan="${showPlat ? 8 : 6}" class="empty">ไม่มีงานในช่วงนี้</td></tr>`;
    kjAfterRows(showPlat ? 8 : 6);
  }
}
function exportKol() {
  const job = _kjView === 'job';
  const head = job ? ['KOL', 'Content Name', 'ช่องทาง', 'สินค้า', 'ประเภท', 'วันโพสต์', 'ค่าจ้าง (งบ)', 'ค่า Ads', 'ยอดขายที่ผูกได้', 'MER', 'Ads ของงาน', 'เบิกจ่าย', 'เดือนที่บัญชีลง', 'ยอดบัญชีลง', 'ลิงก์โพสต์']
    : [_kjView === 'kol' ? 'KOL' : 'สินค้า', 'ช่องทาง', 'งาน', 'ค่าจ้าง', 'ค่า Ads', 'ยอดขายที่ผูกได้', 'MER'].concat(_kjView === 'kol' ? ['ยอด Commission (ถอด VAT)'] : []);
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [head.join(',')].concat(_kjList.map(o => (job ? [o.kol, o.content_code, o.plat, o.sku, o.type, o.date, o.amount, o.ads, o.sales, o.mer.toFixed(2), o.match_status, KJ_PAY[o.pay_status] || '', o.acct_months || '', o.acct || '', o.post_link]
    : [o.name, o.plat, o.n, o.amount, o.ads, o.sales, o.mer.toFixed(2)].concat(_kjView === 'kol' ? [Math.round(o.com || 0)] : [])).map(q).join(',')));
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `KOL_${_kjView}.csv`; a.click();
}


// (2026-10-08) Business Insight ใหม่: ใช้ไฟล์ต้นฉบับบัญชีโดยตรง (ดึงอัตโนมัติ) · โค้ดอยู่ใน bizinsight.js — โหลดครั้งแรกที่กดเมนู
// ตาราง/ฟังก์ชันเดิมของหน้านี้ (renderPl, mv_product_pl_monthly) ไม่ถูกเรียกแล้ว
