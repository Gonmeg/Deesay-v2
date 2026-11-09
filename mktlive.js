// mktlive.js — หน้า "MKT Tracking" (2026-11-05 ย้ายโค้ดออกจาก dashboard.html · หน้าตาแบบ C)
// ข้อมูลทั้งหน้า = RPC mkt_tracking_page ครั้งเดียว (Supabase สรุปให้ แทนการดึง mv_mkt_live_monthly + v_mkt_channel_monthly + v_kol_plan_alloc_detail ทั้งตาราง)
//   ยอดขายถอด VAT 7% · ค่า KOL = งบในไฟล์ทีม KOL ตามเดือนที่โพสต์ (ตรงกับหน้า KOL) · ค่า Ads ยอดจริง (Product / Shared) · CM1 = ยอดขาย − KOL − Ads
//   ช่วงเดือน = ตัวเลือกเดือนบนแถบบน (ค่าเริ่ม = ทุกเดือนที่มีข้อมูล) · ข้อมูลรายเดือน (ข้อยกเว้นของกฎกราฟรายวัน)
// กดตัวเลขในตาราง = แผง "ที่มาของตัวเลข" ด้านขวา (เดิมกางแถวในตาราง — ไม่ตรงกับหน้าอื่น และระบบตรวจนับว่าแผงไม่เปิด)
// ตารางแสดงครบทุกสินค้า + ล็อคหัวคอลัมน์ (แบบหน้าแนวโน้มสินค้า) · วางโครงทั้งหน้าก่อนข้อมูลมา กันหน้าเด้ง
// (2026-11-06) ค่าเริ่ม = เดือนล่าสุด · เทียบช่วงก่อนหน้าที่ยาวเท่ากัน (ยอดขาย / CM1 / MER / ROAS) — เดือนที่ยังไม่จบ: ยอดเงินไม่ขึ้นป้าย % (ยังไม่ครบเดือน) แต่ CM1 % / MER / ROAS ยังเทียบได้เพราะเป็นอัตราส่วน
// (2026-11-06 b) ตัวเลือก "นับ" บนแถบบน (ใช้ร่วมกับหน้าแนวโน้มสินค้า): ออนไลน์ (ค่าเริ่ม) = ยอดขาย + ค่า Ads เฉพาะ TikTok / Shopee / Facebook / Lazada · ค่า KOL นับทั้งหมด
//   ยอดลอตตัวแทนไม่ได้มาจากงบการตลาด นับรวมแล้ว CM1 / MER ดูดีเกินจริง
//   ROAS ไม่แสดงตัวแทน / Modern Trade (ไม่มี Ads ของตัวเอง ได้แค่ Ads PR ที่ปันตามยอดขาย) · กราฟ: เดือนที่ยังไม่จบเป็นเส้นประ
(function () {
  'use strict';
  const CH_VAR = { TikTok: '--ch-tiktok', Shopee: '--ch-shopee', Facebook: '--ch-facebook', Lazada: '--ch-lazada', 'ตัวแทน': '--ch-dealer', 'Modern Trade': '--ch-mt' };
  const PLAT = ['TikTok', 'Facebook', 'Instagram', 'Lemon8', 'Twitter', 'Youtube'];
  let D = null, KEY = null, seq = 0, sortK = 'rev', sortD = 'desc', view = [], PV = {};
  const NO_ROAS = ['ตัวแทน', 'Modern Trade'];
  const $ = id => document.getElementById(id);
  const num = v => +v || 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const info = (id, html) => typeof fbeInfoIcon === 'function' ? fbeInfoIcon(id, html) : '';
  const pc = (v, b) => b > 0 ? (v / b * 100).toFixed(1) + '%' : '—';
  const xx = v => v > 0 ? v.toFixed(2) + 'x' : '—';
  const css = v => getComputedStyle(document.body).getPropertyValue(v).trim() || '#999';
  const rangeTxt = () => D.from === D.to ? PL_TH_M(D.from) : `${PL_TH_M(D.from)} – ${PL_TH_M(D.to)}`;
  const prevTxt = () => D.prev_from === D.prev_to ? PL_TH_M(D.prev_from) : `${PL_TH_M(D.prev_from)} – ${PL_TH_M(D.prev_to)}`;
  const prevLbl = () => D.from === D.to ? 'เดือนก่อน' : 'ช่วงก่อน';
  const chipP = (a, b) => !(b > 0) || !isFinite(a) ? '' : (v => `<span class="ui-chip ${Math.abs(v) < 3 ? '' : v > 0 ? 'up' : 'dn'}">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%</span>`)((a - b) / b * 100);
  const chipPt = (a, b) => !isFinite(a) || !isFinite(b) ? '' : (v => `<span class="ui-chip ${Math.abs(v) < 0.5 ? '' : v > 0 ? 'up' : 'dn'}">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)} pt</span>`)(a - b);

  function injectCss() {
    if ($('mk-css')) return;
    const s = document.createElement('style'); s.id = 'mk-css';
    s.textContent = `
.mk{display:flex;flex-direction:column;gap:16px}
.mk .ui-metrics{grid-template-columns:repeat(5,minmax(0,1fr));border:1.5px solid transparent;background:var(--hero,var(--bg2)) padding-box,var(--hero-line,var(--border)) border-box;box-shadow:var(--sh,none);border-radius:14px}
.mk .ui-metric{background:transparent;box-shadow:1px 0 0 var(--border);padding:14px 18px 15px}
body.light-theme .mk .ui-metric{box-shadow:1px 0 0 #EDF0F4}
.mk .ui-metric:last-child{box-shadow:none}
.mk .ui-metric-v{font-size:clamp(22px,2vw,30px)}
.mk .ui-metric-d{margin-top:6px;font-size:12.5px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mk-note{margin:-6px 2px 0;font-size:12.5px;color:var(--text3)}
.mk-card{background:var(--bg2);border:1px solid var(--panel-line,var(--border));border-radius:var(--r-md,12px);padding:16px 18px;box-shadow:var(--sh,none);min-width:0}
.mk-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;margin-bottom:10px}
.mk-head h2{margin:0;font-size:15px;font-weight:700;display:flex;align-items:center;gap:6px}
.mk-sub{font-size:12.5px;color:var(--text3);font-weight:400}
.mk-leg{display:flex;gap:14px;font-size:12.5px;color:var(--text2)}.mk-leg i{display:inline-block;width:14px;height:3px;border-radius:2px;vertical-align:middle;margin-right:6px}
.mk-chs{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}
.mk-ch{background:var(--bg3);border-radius:10px;padding:10px 12px;min-width:0;min-height:74px}
.mk-ch .l{font-size:12.5px;color:var(--text2);display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mk-ch .v{font-size:19px;font-weight:700;font-variant-numeric:tabular-nums;margin:3px 0 1px;display:flex;align-items:center;gap:8px}
.mk-ch .s{font-size:12px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mk-dot{width:9px;height:9px;border-radius:3px;flex:none;display:inline-block}
.mk-tw{overflow-x:clip}
.mk-tw.box{overflow:auto;max-height:calc(100vh - 140px)}
.mk-tbl{min-width:900px;font-variant-numeric:tabular-nums}
.mk-tbl thead th{position:sticky;top:var(--mk-top,0px);z-index:3;background:var(--bg2);box-shadow:inset 0 -1px 0 var(--border)}
.mk-tw.box .mk-tbl thead th{top:0}
.mk-tbl td{vertical-align:middle}
.mk-tbl .pn{max-width:300px}
.mk-tbl .pn small{display:block;color:var(--text3);font-size:12px}
.mk-tbl .sm{display:block;color:var(--text3);font-size:12px;font-weight:400}
.mk-n{cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px;text-decoration-color:var(--text3)}
.mk-n:hover{text-decoration-color:var(--text)}
.mk-nm{cursor:pointer}.mk-nm:hover b{color:var(--accent-text)}
.mk-tbl tfoot td{vertical-align:middle}
.mk-neg{color:var(--bad)}
.mk-pt{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}
.mk-pt th{font-size:12px;color:var(--text3);font-weight:500;text-align:right;padding:6px 8px;border-bottom:1px solid var(--border);white-space:nowrap}
.mk-pt th:first-child,.mk-pt td:first-child{text-align:left}
.mk-pt td{padding:8px;text-align:right;border-bottom:1px solid var(--row-border,var(--border))}
.mk-pt tfoot td{font-weight:700;border-top:1px solid var(--border);border-bottom:0}
.mk-chnote{margin-top:10px;font-size:12.5px;color:var(--text3)}`;
    document.head.appendChild(s);
  }

  // ===== โครงหน้า (วางครั้งเดียว ก่อนข้อมูลมา) =====
  function shell(root) {
    const tile = (k, l, tip) => `<div class="ui-metric is-static" data-k="${k}"><span class="ui-metric-l">${l}${tip ? info('mk-i-' + k, tip) : ''}</span><span class="ui-metric-v" data-fit>—</span><span class="ui-metric-d">&nbsp;</span></div>`;
    root.innerHTML = `<div class="mk">
      <section class="ui-metrics" id="mkTiles" aria-label="ตัวเลขหลัก">
        ${tile('rev', 'ยอดขาย (ถอด VAT)', '<b>นับ: ออนไลน์</b> = TikTok / Shopee / Facebook (รวม Line) / Lazada · <b>ทุกช่องทาง</b> = รวมตัวแทน / Modern Trade<br>' + (typeof ML_REV_TIP === 'string' ? ML_REV_TIP : 'ยอดขาย ÷ 1.07'))}
        ${tile('kol', 'ค่า KOL', 'งบในไฟล์ทีม KOL (Conversion + PR) ตามเดือนที่โพสต์ — ตรงกับหน้า KOL<br>รวมงานที่ไฟล์ทีม KOL ยังไม่ระบุสินค้า<br>Business Insight ใช้ยอดบัญชี จึงอาจต่างกัน')}
        ${tile('ads', 'ค่า Ads', 'ยอดใช้จ่ายจริง ไม่รวม VAT<br><b>Product Ads</b> = ยิงสินค้านี้ตรง ๆ<br><b>Shared Ads</b> = Ads ที่ไม่ผูกสินค้า ปันตามยอดขายในช่องทาง · Ads PR ปันตามยอดขายทุกช่องทาง<br>นับแบบออนไลน์ ไม่รวมส่วนแบ่ง Ads PR ที่ปันให้ตัวแทน / Modern Trade (ประมาณ 0.5% ของค่า Ads)')}
        ${tile('cm1', 'CM1', '<b>CM1 · Contribution Margin 1</b><br>ยอดขาย − ค่า KOL − ค่า Ads<br>เงินที่เหลือหลังจ่ายค่าการตลาด (ตัวเลขใหญ่ = % ของยอดขาย · ชี้เมาส์ดูเป็นบาท)<br>ป้าย = เปลี่ยนกี่ pt (จุด %) จากช่วงก่อนหน้าที่ยาวเท่ากัน')}
        ${tile('mer', 'MER', '<b>MER · Marketing Efficiency Ratio</b><br>ยอดขาย ÷ (ค่า KOL + ค่า Ads)<br>ลงการตลาด 1 บาท ได้ยอดขายกี่บาท<br>ป้าย = เปลี่ยนกี่ % จากช่วงก่อนหน้าที่ยาวเท่ากัน')}
      </section>
      <div class="mk-note" id="mkNote">&nbsp;</div>
      <div class="mk-card"><div class="mk-head"><h2>แนวโน้มรายเดือน ${info('mk-i-tr', 'ทุกเดือนที่มีข้อมูล (ไม่ขึ้นกับช่วงที่เลือก)<br>ยอดขายถอด VAT · ค่าการตลาด = ค่า KOL + ค่า Ads · MER = ยอดขาย ÷ ค่าการตลาด (แกนขวา)<br>เส้นประ = เดือนที่ยังไม่จบ ยอดยังไม่ครบเดือน')}</h2>
        <div class="mk-leg"><span><i style="background:var(--accent)"></i>ยอดขาย</span><span><i style="background:var(--bad)"></i>ค่า KOL + Ads</span><span><i style="background:var(--good)"></i>MER</span></div></div>
        <div style="position:relative;height:240px;"><canvas id="chartMkTrend"></canvas></div></div>
      <div class="mk-card"><div class="mk-head"><h2>ROAS ตามช่องทาง ${info('mk-i-roas', '<b>ROAS · Return on Ad Spend</b><br>ยอดขายช่องทาง (ถอด VAT) ÷ ค่า Ads ช่องทาง ในช่วงที่เลือก · ไม่รวมค่า KOL<br>ป้าย = เปลี่ยนกี่ % จากช่วงก่อนหน้าที่ยาวเท่ากัน<br>ไม่แสดงตัวแทน / Modern Trade เพราะไม่มี Ads ของตัวเอง')}</h2></div>
        <div class="mk-chs" id="mkChs">${Array.from({ length: 4 }, () => '<div class="mk-ch"></div>').join('')}</div>
        <div class="mk-chnote" id="mkChNote">ไม่แสดงตัวแทน / Modern Trade · ไม่มี Ads ของตัวเอง</div></div>
      <div class="mk-card" style="padding:16px 0 6px;">
        <div class="mk-head" style="padding:0 18px;"><h2>การตลาดต่อสินค้า (CM1) <span class="mk-sub" id="mkCount"></span></h2>
          <button class="btn btn-ghost" type="button" id="mkExport">⬇ Export</button></div>
        <div class="mk-tw"><table class="ui-table mk-tbl" id="mkTbl" data-no-sort data-no-page><thead id="mkHead"></thead>
          <tbody id="mkBody"><tr><td colspan="6" class="empty">กำลังโหลด...</td></tr></tbody><tfoot id="mkFoot"></tfoot></table></div></div>
    </div>`;
    root.addEventListener('click', e => {
      const th = e.target.closest('th[data-sort]'); if (th && !e.target.closest('.ads-info-wrap')) { const k = th.dataset.sort; if (sortK === k) sortD = sortD === 'desc' ? 'asc' : 'desc'; else { sortK = k; sortD = k === 'name' ? 'asc' : 'desc'; } drawTable(); return; }
      if (e.target.closest('#mkExport')) { exportXlsx(); return; }
      const n = e.target.closest('[data-mk]'); if (n) { const [sku, k] = n.dataset.mk.split('|'); openPanel(sku, k); }
    });
  }

  // ===== วาด =====
  function build() {
    PV = {}; (D.prev || []).forEach(r => { PV[r.sku] = { rev: num(r.rev), cost: num(r.kol) + num(r.ads) }; });
    view = (D.skus || []).map(r => {
      const o = { sku: r.sku, name: r.sku === 'NOSKU' ? 'งาน KOL ที่ยังไม่ระบุสินค้า' : (r.name || skuToName(r.sku) || r.sku), rev: num(r.rev), kc: num(r.kc), kp: num(r.kp), ko: num(r.ko), ad: num(r.ad), aa: num(r.aa) };
      o.kol = o.kc + o.kp + o.ko; o.ads = o.ad + o.aa; o.cost = o.kol + o.ads; o.cm1 = o.rev - o.cost;
      o.cm1p = o.rev > 0 ? o.cm1 / o.rev * 100 : -Infinity; o.mer = o.cost > 0 ? o.rev / o.cost : 0;
      const p = PV[r.sku]; o.pRev = p ? p.rev : 0; o.pCm1p = p && p.rev > 0 ? (p.rev - p.cost) / p.rev * 100 : NaN; o.pMer = p && p.cost > 0 ? p.rev / p.cost : 0; return o;
    });
  }
  const tot = () => view.reduce((t, o) => { ['rev', 'kc', 'kp', 'ko', 'ad', 'aa', 'kol', 'ads', 'cost', 'cm1'].forEach(k => { t[k] += o[k]; }); return t; }, { rev: 0, kc: 0, kp: 0, ko: 0, ad: 0, aa: 0, kol: 0, ads: 0, cost: 0, cm1: 0 });
  function drawTiles() {
    const T = tot(), set = (k, v, d, tip) => { const el = $('mkTiles').querySelector(`[data-k="${k}"]`), ve = el.querySelector('.ui-metric-v'); ve.textContent = v; if (tip) ve.setAttribute('data-tip', tip); else ve.removeAttribute('data-tip'); el.querySelector('.ui-metric-d').innerHTML = d; };
    const P = Object.values(PV).reduce((t, p) => { t.rev += p.rev; t.cost += p.cost; return t; }, { rev: 0, cost: 0 }), has = D.prev_has && P.rev > 0;
    const cm1p = T.rev > 0 ? T.cm1 / T.rev * 100 : NaN, pCm1p = P.rev > 0 ? (P.rev - P.cost) / P.rev * 100 : NaN, mer = T.cost > 0 ? T.rev / T.cost : 0, pMer = P.cost > 0 ? P.rev / P.cost : 0;
    set('rev', fmt(Math.round(T.rev)), !has ? esc(rangeTxt()) : D.open ? `<span>ยังไม่จบเดือน · ${prevLbl()} ${fmt(Math.round(P.rev))}</span>` : `${chipP(T.rev, P.rev)}<span>${prevLbl()} ${fmt(Math.round(P.rev))}</span>`);
    set('kol', fmt(Math.round(T.kol)), `Conversion ${fmt(Math.round(T.kc))} · PR ${fmt(Math.round(T.kp))}${T.ko >= 0.5 ? ` · อื่น ๆ ${fmt(Math.round(T.ko))}` : ''}`);
    set('ads', fmt(Math.round(T.ads)), `Product ${fmt(Math.round(T.ad))} · Shared ${fmt(Math.round(T.aa))}`);
    set('cm1', isFinite(cm1p) ? cm1p.toFixed(1) + '%' : '—', has ? `${chipPt(cm1p, pCm1p)}<span>ก่อน ${pCm1p.toFixed(1)}%</span>` : `<span${T.cm1 < 0 ? ' class="mk-neg"' : ''}>${fmt(Math.round(T.cm1))}</span>`, `CM1 ${fmt(Math.round(T.cm1))} บาท`);
    set('mer', xx(mer), has ? `${chipP(mer, pMer)}<span>ก่อน ${xx(pMer)}</span>` : `ค่าการตลาด ${pc(T.cost, T.rev)} ของยอดขาย`, `ค่าการตลาด ${pc(T.cost, T.rev)} ของยอดขาย`);
    $('mkNote').textContent = `${D.scope === 'online' ? 'นับเฉพาะช่องทางออนไลน์ (ไม่รวมตัวแทน / Modern Trade) · ' : 'นับทุกช่องทาง · '}${rangeTxt()}${has ? ` เทียบกับ ${prevTxt()}` : ''}${D.open ? ' · เดือนนี้ยังไม่จบ ยอดเงินจึงไม่ขึ้นป้าย % (CM1 / MER ยังเทียบได้)' : ''}`;   // รายละเอียดแหล่งข้อมูลอยู่ใน ⓘ
  }
  function drawTrend() {
    const tr = D.trend || [], ms = tr.map(x => x.m);
    if (!ms.length || typeof makeChart !== 'function') return;
    const acc = css('--accent'), bad = css('--bad'), good = css('--good'), last = ms.length - 1;
    const openM = D.open && ms[last] >= D.to ? last : -1;   // เดือนสุดท้ายยังไม่จบ → ช่วงเส้นที่เข้าเดือนนั้นเป็นเส้นประ
    const seg = { borderDash: c => c.p1DataIndex === openM ? [5, 4] : undefined };
    makeChart('chartMkTrend', 'line', ms.map(PL_TH_M), [
      { label: 'ยอดขาย', data: tr.map(x => num(x.rev)), borderColor: acc, backgroundColor: acc, borderWidth: 2.2, pointRadius: 3, tension: 0.35, yAxisID: 'y', segment: seg },
      { label: 'ค่า KOL + Ads', data: tr.map(x => num(x.cost)), borderColor: bad, backgroundColor: bad, borderWidth: 2.2, pointRadius: 3, tension: 0.35, yAxisID: 'y', segment: seg },
      { label: 'MER', data: tr.map(x => num(x.cost) > 0 ? +(num(x.rev) / num(x.cost)).toFixed(2) : null), borderColor: good, backgroundColor: good, borderWidth: 1.6, pointRadius: 2.5, tension: 0.35, yAxisID: 'y2', segment: seg }],
      { legend: { display: false }, tooltip: { callbacks: { label: c => c.dataset.yAxisID === 'y2' ? `MER: ${c.raw}x` : `${c.dataset.label}: ${fmt(Math.round(+c.raw || 0))}` } },
        scales: { y: { ticks: { callback: v => fmt(v), maxTicksLimit: 6 } }, y2: { position: 'right', ticks: { color: good, callback: v => v + 'x', maxTicksLimit: 6 }, grid: { display: false }, border: { display: false } } } });   // แกนซ้ายเต็มจำนวน (ไม่ย่อ M)
  }
  function drawChannels() {
    const t = {}; (D.channels || []).forEach(r => { const x = (t[r.ch] = t[r.ch] || { rev: 0, ads: 0 }); x.rev += num(r.rev); x.ads += num(r.ad) + num(r.aa); });
    const p = {}; (D.ch_prev || []).forEach(r => { p[r.ch] = { rev: num(r.rev), ads: num(r.ads) }; });
    const L = PL_CH_ORDER.filter(c => !NO_ROAS.includes(c) && t[c] && t[c].ads >= 0.5);
    $('mkChs').innerHTML = L.map(c => { const r = t[c].rev / t[c].ads, pr = p[c] && p[c].ads >= 0.5 ? p[c].rev / p[c].ads : 0;
      return `<div class="mk-ch"><div class="l"><span class="mk-dot" style="background:var(${CH_VAR[c] || '--text3'})"></span>${esc(c)}</div>
      <div class="v">${xx(r)}${D.prev_has && pr > 0 ? chipP(r, pr) : ''}</div><div class="s" title="ยอดขาย ${fmt(Math.round(t[c].rev))} · ค่า Ads ${fmt(Math.round(t[c].ads))}${pr > 0 ? ` · ${prevLbl()} ${xx(pr)}` : ''}">ขาย ${fmt(Math.round(t[c].rev))} · Ads ${fmt(Math.round(t[c].ads))}${D.prev_has && pr > 0 ? ` · ก่อน ${xx(pr)}` : ''}</div></div>`; }).join('') || '<div class="empty">ไม่มีค่า Ads ในช่วงนี้</div>';
  }
  function drawTable() {
    const th = (k, l, c) => `<th class="${c || 'num'}" data-sort="${k}" aria-sort="${sortK === k ? (sortD === 'asc' ? 'ascending' : 'descending') : 'none'}">${l}</th>`;
    $('mkHead').innerHTML = `<tr>${th('name', 'สินค้า', 'l')}${th('rev', `ยอดขาย ${info('mk-i-hrev', 'ยอดขายถอด VAT 7% (÷ 1.07) เทียบกับค่า KOL / Ads ที่ไม่รวม VAT<br>กดตัวเลข = ดูว่ามาจากช่องทาง / ร้าน / เพจไหน')}`)}${th('kol', `ค่า KOL ${info('mk-i-hkol', 'งบในไฟล์ทีม KOL ตามเดือนที่โพสต์ (งานที่รีวิวหลายสินค้าแบ่งเท่า ๆ กัน)<br>ตัวเลขเล็ก = % ของยอดขาย · กดตัวเลข = แยก Conversion / PR และช่องทางที่ลงงาน')}`)}${th('ads', `ค่า Ads ${info('mk-i-hads', 'Product Ads + Shared Ads ของสินค้านี้<br>ตัวเลขเล็ก = % ของยอดขาย · กดตัวเลข = แยกช่องทาง')}`)}${th('cm1p', `CM1 ${info('mk-i-hcm1', 'ยอดขาย − ค่า KOL − ค่า Ads เป็น % ของยอดขาย<br>ตัวเลขเล็ก = CM1 เป็นบาท · ก่อน = CM1 % ของช่วงก่อนหน้าที่ยาวเท่ากัน')}`)}${th('mer', `MER ${info('mk-i-hmer', 'ยอดขาย ÷ (ค่า KOL + ค่า Ads)<br>ป้าย = เปลี่ยนกี่ % จากช่วงก่อนหน้าที่ยาวเท่ากัน')}`)}</tr>`;
    const R = view.slice().sort((a, b) => { const av = a[sortK], bv = b[sortK]; const c = typeof av === 'string' ? av.localeCompare(bv, 'th') : av - bv; return sortD === 'asc' ? c : -c; });
    $('mkCount').textContent = `${fmt(R.filter(o => o.sku !== 'NOSKU').length)} สินค้า · ${rangeTxt()}`;
    const n = (o, k, v) => v >= 0.5 ? `<span class="mk-n" data-mk="${esc(o.sku)}|${k}">${fmt(Math.round(v))}</span><span class="sm">${pc(v, o.rev)}</span>` : '<span class="ui-muted">—</span>';
    $('mkBody').innerHTML = R.map(o => `<tr>
      <td class="pn">${o.sku === 'NOSKU' ? `<b>${esc(o.name)}</b><small>แก้สินค้าในไฟล์ทีม KOL แล้วแถวนี้หายเอง</small>` : `<span class="mk-nm" data-mk="${esc(o.sku)}|chan" title="กดเพื่อดูผลแยกตามช่องทาง"><b>${esc(o.name)}</b><small>${esc(o.sku)}</small></span>`}</td>
      <td class="num">${o.rev ? `<span class="mk-n" data-mk="${esc(o.sku)}|rev">${fmt(Math.round(o.rev))}</span>` : '<span class="ui-muted">—</span>'}</td>
      <td class="num">${n(o, 'kol', o.kol)}</td><td class="num">${n(o, 'ads', o.ads)}</td>
      <td class="num"><b${o.cm1 < 0 ? ' class="mk-neg"' : ''}>${isFinite(o.cm1p) ? o.cm1p.toFixed(1) + '%' : '—'}</b><span class="sm">${fmt(Math.round(o.cm1))}${D.prev_has && isFinite(o.pCm1p) ? ` · ก่อน ${o.pCm1p.toFixed(1)}%` : ''}</span></td>
      <td class="num"><b>${xx(o.mer)}</b>${D.prev_has && o.pMer > 0 && o.mer > 0 ? ` ${chipP(o.mer, o.pMer)}<span class="sm">ก่อน ${xx(o.pMer)}</span>` : ''}</td></tr>`).join('') || '<tr><td colspan="6" class="empty">ไม่มีข้อมูลในช่วงนี้</td></tr>';
    const T = tot(), P = Object.values(PV).reduce((t, p) => { t.rev += p.rev; t.cost += p.cost; return t; }, { rev: 0, cost: 0 }), has = D.prev_has && P.rev > 0;
    const fMer = T.cost > 0 ? T.rev / T.cost : 0, pMer = P.cost > 0 ? P.rev / P.cost : 0, pCm = P.rev > 0 ? (P.rev - P.cost) / P.rev * 100 : NaN;
    $('mkFoot').innerHTML = view.length ? `<tr class="ui-sum"><td>รวม</td><td class="num">${fmt(Math.round(T.rev))}</td><td class="num">${fmt(Math.round(T.kol))}<span class="sm">${pc(T.kol, T.rev)}</span></td>
      <td class="num">${fmt(Math.round(T.ads))}<span class="sm">${pc(T.ads, T.rev)}</span></td><td class="num"><b>${pc(T.cm1, T.rev)}</b><span class="sm">${fmt(Math.round(T.cm1))}${has ? ` · ก่อน ${pCm.toFixed(1)}%` : ''}</span></td><td class="num"><b>${xx(fMer)}</b>${has && pMer > 0 ? ` ${chipP(fMer, pMer)}<span class="sm">ก่อน ${xx(pMer)}</span>` : ''}</td></tr>` : '';
    lockHead();
  }
  function lockHead() {
    const tw = $('mkTbl').parentElement, tb = document.querySelector('.topbar'), p = tb ? getComputedStyle(tb).position : '';
    tw.classList.remove('box'); tw.style.setProperty('--mk-top', (p === 'sticky' || p === 'fixed' ? tb.offsetHeight : 0) + 'px');
    if ($('mkTbl').offsetWidth > tw.clientWidth + 2) tw.classList.add('box');
  }

  // ===== แผงที่มาของตัวเลข (ด้านขวา) =====
  const subCache = {};
  async function loadSub(sku) {
    const key = `${sku}|${D.from}|${D.to}`; if (subCache[key]) return subCache[key];
    const [y, m] = D.to.split('-').map(Number), end = `${D.to}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
    const h = { apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + authJwt() };
    const rows = await fetchAllRows(`${window.SUPABASE_URL}/rest/v1/mv_sku_daily?select=channel,sub_channel,revenue&parent_sku=eq.${encodeURIComponent(sku)}&date=gte.${D.from}-01&date=lte.${end}`, h);
    const o = {}; rows.forEach(r => { const c = /^Modern/i.test(r.channel) ? 'Modern Trade' : r.channel; const x = (o[c] = o[c] || {}); const sc = r.sub_channel || ''; x[sc] = (x[sc] || 0) + num(r.revenue) / VAT_DIV; });
    subCache[key] = o; return o;
  }
  const subName = (ch, sc) => !sc ? (ch === 'ตัวแทน' ? 'ตัวแทนทั้งหมด' : 'ไม่ระบุ') : ch === 'Modern Trade' && typeof mtStoreName === 'function' ? mtStoreName(sc) : String(sc).replace(/^\d+\.\s*(FB|Line)\s*-\s*[A-Z]\s*-\s*/i, '').replace(/^\d+\.\s*/, '');
  const plats = p => { const out = String(p || '').split(',').map(x => x.trim()).map(x => PLAT.find(k => k.toLowerCase() === x.toLowerCase()) || (x ? 'อื่นๆ' : null)).filter(Boolean); return out.length ? [...new Set(out)] : ['ไม่ระบุ']; };
  async function openPanel(sku, k) {
    const o = view.find(x => x.sku === sku); if (!o) return;
    const title = { rev: 'ยอดขาย', kol: 'ค่า KOL', ads: 'ค่า Ads', chan: 'ผลแยกตามช่องทาง' }[k] || '';
    trOpenShell(`ที่มาของตัวเลข · ${title}`);
    const body = () => $('trBody'), put = h => { const b = body(); if (b) b.innerHTML = `<div class="mk-sub" style="margin-bottom:10px;">${esc(o.name)}${sku === 'NOSKU' ? '' : ` · ${esc(sku)}`} · ${esc(rangeTxt())}</div>` + h; };
    const chRows = (D.channels || []).filter(r => r.sku === sku);
    try {
      if (k === 'kol') {
        const g = {}; (D.kol || []).filter(r => r.sku === sku).forEach(r => { const ps = plats(r.plat), share = num(r.amt) / ps.length;
          const x = (g[r.typ] = g[r.typ] || { amount: 0, n: 0, ch: {} }); x.amount += num(r.amt); x.n += num(r.n); ps.forEach(p => { x.ch[p] = (x.ch[p] || 0) + share; }); });
        put(bdRender({ title: 'ค่า KOL', total: o.kol, rev: o.rev, groups: Object.entries(g).map(([t, x]) => ({ label: `${t} (${fmt(x.n)} งาน)`, amount: x.amount, children: bdFrom(Object.entries(x.ch)) })), tipId: 'tip-mkp-kol',
          tip: 'งบจากไฟล์ทีม KOL ตามเดือนที่โพสต์ (งานที่รีวิวหลายสินค้าแบ่งเท่า ๆ กัน)<br>บรรทัดย่อย = ช่องทางที่ KOL ลงงาน · งานที่ลงหลายช่องทางแบ่งยอดเท่า ๆ กัน' }));
      } else if (k === 'ads') {
        put(bdRender({ title: 'ค่า Ads แยกตามช่องทาง', total: o.ads, rev: o.rev, groups: chRows.filter(r => num(r.ad) + num(r.aa) >= 0.5).map(r => ({ label: r.ch, amount: num(r.ad) + num(r.aa), fixed: true,
          children: [{ label: 'Product Ads', amount: num(r.ad) }, { label: 'Shared Ads (ปันตามยอดขาย)', amount: num(r.aa) }] })), tipId: 'tip-mkp-ads',
          tip: 'ยอดใช้จ่ายจริง<br><b>Product Ads</b> = Ads ที่ยิงสินค้านี้ตรง ๆ<br><b>Shared Ads</b> = Ads ที่ไม่ผูกสินค้า (awareness, เพจ, Live, Promotion, Shop Ads) ของช่องทางนั้น ปันตามยอดขายของสินค้าในช่องทาง<br><b>Ads PR</b> ปันให้ทุกช่องทางตามยอดขาย รวมอยู่ใน Shared Ads' }));
      } else if (k === 'rev') {
        const draw = subs => put(bdRender({ title: 'ยอดขายแยกตามช่องทาง', total: o.rev, rev: 0, tipId: 'tip-mkp-rev',
          tip: 'ยอดขายถอด VAT ชุดเดียวกับคอลัมน์ยอดขาย<br>บรรทัดย่อย = ร้าน / เพจ / ห้าง ในช่องทางนั้น<br>Facebook หักออเดอร์ตีกลับแล้ว (บรรทัด "หักออเดอร์ตีกลับ")<br>Modern Trade = ยอดที่ห้างขายออก (ไฟล์รายงานห้าง)',
          note: subs ? '' : 'กำลังโหลดรายร้าน / เพจ...',
          groups: chRows.filter(r => Math.abs(num(r.rev)) >= 0.5).map(r => { const v = num(r.rev), c = r.ch;
            if (!(subs && subs[c])) return { label: c, amount: v, children: [] };
            const ent = Object.entries(subs[c]).map(([sc, a]) => [subName(c, sc), a]);
            if (c === 'Facebook') { const s = ent.reduce((t, x) => t + x[1], 0); if (Math.abs(v - s) > 1) ent.push(['หักออเดอร์ตีกลับ', v - s]); }
            return { label: c, amount: v, children: bdTop(bdFrom(ent), 8) }; }) }));
        draw(null); draw(await loadSub(sku));
      } else {   // ชื่อสินค้า: เทียบผลแต่ละช่องทาง · ค่า KOL ไม่ผูกช่องทาง → แบ่งตามสัดส่วนยอดขาย
        const L = chRows.map(r => { const x = { ch: r.ch, rev: num(r.rev), ads: num(r.ad) + num(r.aa) }; x.kol = o.rev > 0 ? o.kol * Math.max(x.rev, 0) / o.rev : 0; x.cm1 = x.rev - x.ads - x.kol; x.mer = x.ads + x.kol > 0 ? x.rev / (x.ads + x.kol) : 0; return x; }).sort((a, b) => b.rev - a.rev);
        const T = L.reduce((t, x) => { ['rev', 'ads', 'kol', 'cm1'].forEach(q => { t[q] += x[q]; }); return t; }, { rev: 0, ads: 0, kol: 0, cm1: 0 });
        const row = (x, b) => `<td>${b ? '<b>รวม</b>' : `<span class="mk-dot" style="background:var(${CH_VAR[x.ch] || '--text3'});margin-right:7px;"></span>${esc(x.ch)}`}</td><td>${fmt(Math.round(x.rev))}<span class="sm">${pc(x.rev, o.rev)}</span></td>
          <td>${fmt(Math.round(x.ads))}<span class="sm">${pc(x.ads, x.rev)}</span></td><td>${fmt(Math.round(x.kol))}<span class="sm">${pc(x.kol, x.rev)}</span></td>
          <td><b${x.cm1 < 0 ? ' class="mk-neg"' : ''}>${pc(x.cm1, x.rev)}</b><span class="sm">${fmt(Math.round(x.cm1))}</span></td><td><b>${xx(x.ads + x.kol > 0 ? x.rev / (x.ads + x.kol) : 0)}</b></td>`;
        put(`<table class="mk-pt"><thead><tr><th>ช่องทาง</th><th>ยอดขาย</th><th>ค่า Ads</th><th>ค่า KOL ${info('mk-i-pkol', 'ค่า KOL ไม่ได้ผูกช่องทางขาย จึงแบ่งตามสัดส่วนยอดขายของสินค้าในแต่ละช่องทาง')}</th><th>CM1</th><th>MER</th></tr></thead>
          <tbody>${L.map(x => `<tr>${row(x)}</tr>`).join('') || '<tr><td colspan="6" class="ui-muted">ไม่มีข้อมูลรายช่องทาง</td></tr>'}</tbody><tfoot><tr>${row(T, true)}</tr></tfoot></table>`);
      }
    } catch (e) { const b = body(); if (b) b.innerHTML = `<div class="tr-warn">แสดงผลไม่สำเร็จ: ${esc(e.message)}</div>`; }
  }

  // ===== Export =====
  function exportXlsx() {
    if (!D) return;
    const head = ['SKU', 'สินค้า', 'ยอดขาย (ถอด VAT)', 'KOL Conversion', 'KOL PR', 'KOL อื่นๆ', 'Product Ads', 'Shared Ads', 'CM1', 'CM1 %', 'MER'];
    const body = view.map(o => [o.sku, o.name, +o.rev.toFixed(2), +o.kc.toFixed(2), +o.kp.toFixed(2), +o.ko.toFixed(2), +o.ad.toFixed(2), +o.aa.toFixed(2), +o.cm1.toFixed(2), isFinite(o.cm1p) ? +o.cm1p.toFixed(1) : '', o.mer ? +o.mer.toFixed(2) : '']);
    const name = `MKT_Tracking_${D.from}_${D.to}`;
    if (window.XLSX) { try { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([head, ...body]), 'MKT Tracking'); XLSX.writeFile(wb, name + '.xlsx'); return; } catch (e) { console.warn('xlsx', e); } }
    downloadCSV([head, ...body], name + '.csv');
  }

  // ===== โหลด =====
  async function render() {
    injectCss();
    const root = $('mktlive-root'); if (!root) return;
    if (!root.querySelector('.mk')) shell(root);
    const f = $('filterMonthFrom'), t = $('filterMonthTo');
    const pageSet = f && f.dataset.page === 'mktlive';
    const thisM = new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 7);   // เดือนปัจจุบัน (เวลาไทย)
    let from = pageSet ? f.value : thisM, to = pageSet ? t.value : thisM;   // ครั้งแรก = เดือนล่าสุด
    if (from && to && from > to) [from, to] = [to, from];
    const scope = ($('skuScope') || {}).value === 'all' ? 'all' : 'online';   // ตัวเลือก "นับ" บนแถบบน (ค่า retail = ออนไลน์)
    const key = `${from}|${to}|${scope}`;
    if (KEY === key && D) { drawAll(); return; }
    const my = ++seq;
    try {
      let d = await supaRpc('mkt_tracking_page', { p_from: from + '-01', p_to: to + '-01', p_scope: scope });
      const ms = d.months || [];
      if (!pageSet && ms.length && !ms.includes(thisM)) { const lm = ms[ms.length - 1]; d = await supaRpc('mkt_tracking_page', { p_from: lm + '-01', p_to: lm + '-01', p_scope: scope }); }   // เดือนนี้ยังไม่มีข้อมูล → เดือนล่าสุดที่มี
      if (my !== seq) return;
      D = d; KEY = `${D.from}|${D.to}|${scope}`;
      if (!pageSet && typeof topMonthsFor === 'function') { topMonthsFor('mktlive', D.months || []); if (f && t) { f.value = D.from; t.value = D.to; } }   // ตัวเลือกเดือนบนแถบ = เดือนที่แสดง
      drawAll();
    } catch (e) {
      if (my !== seq) return;
      $('mkBody').innerHTML = `<tr><td colspan="6" class="empty">โหลดข้อมูลไม่สำเร็จ: ${esc(e.message)}</td></tr>`;
    }
  }
  function drawAll() { build(); drawTiles(); drawTrend(); drawChannels(); drawTable(); if (window.UI && UI.fit) UI.fit(); }
  window.mktLive = { render, reload: () => { KEY = null; render(); } };
  window.addEventListener('resize', () => { if (D && $('mkTbl')) lockHead(); });
})();
