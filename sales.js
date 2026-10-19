// sales.js — (2026-10-18) แม่แบบ 1 "ภาพรวมยอดขาย" (รวมหน้าแยกตาม Channel เข้ามาแล้ว) · อ้างอิง Shopee Seller Centre + Facebook Ads Manager
// โหลดจาก dashboard.html (loadSalesJs) · ใช้ตัวช่วยกลางของ dashboard: ensureSalesSummary / salesRows / ensureSalesDone / cmpRange / cancelPending / noteSalesStatus
// ตัวเลขทุกตัวมาจากตารางสรุปยอดขาย (mv_sales_daily ผ่าน sales_summary) แหล่งเดียวกับหน้าแรกและทุกหน้า · ลูกค้านับเฉพาะ Facebook (fb_customers_series / unique_customers)
// (2026-10-18 b) ใช้กับหน้าภาพรวมรายช่องทางด้วย (Facebook / TikTok / Shopee / Lazada — o.hub = true):
//   แผงตัวเลขเพิ่ม ค่า Ads + ROAS · กราฟสลับ "แยกเพจ / ร้าน" · ตารางรายเพจ / ร้าน พร้อมค่า Ads + ROAS
//   ค่า Ads = mv_ad_spend_daily (adRawData ใน dashboard) แหล่งเดียวกับหน้า Ad Performance · แยกเพจ / ร้านตาม sub_channel ชื่อเดียวกับยอดขาย
(function () {
  'use strict';
  const M = {
    rev: { k: 'rev', name: 'ยอดขาย', c: '--accent', tip: 'ยอดขายทุกช่องทาง หักยกเลิก / คืน และ CN แล้ว · แหล่งเดียวกับทุกหน้า (ตารางสรุปยอดขาย)' },
    ord: { k: 'ord', name: 'ออเดอร์', c: '--blue', tip: 'จำนวนออเดอร์ ไม่นับที่ยกเลิก / คืน' },
    aov: { k: 'aov', name: 'AOV', c: '--purple', tip: '<b>AOV (Average Order Value)</b> ยอดขาย ÷ ออเดอร์<br>ไม่คิดของตัวแทน / Modern Trade เพราะสั่งลอตใหญ่' },
    cust: { k: 'cust', name: 'ลูกค้า Facebook', c: '--cyan', tip: 'เบอร์โทรไม่ซ้ำ นับเฉพาะ Facebook / Line<br>TikTok / Shopee ไม่ส่งเบอร์โทรจริงมา จึงนับไม่ได้' },
    ads: { k: 'ads', name: 'ค่า Ads', c: '--red', tip: '' },
    roas: { k: 'roas', name: 'ROAS', c: '--green', tip: '<b>ROAS (Return on Ad Spend)</b> ยอดขาย ÷ ค่า Ads<br>เส้นในกราฟหยุดที่วันล่าสุดที่ทั้งยอดขายและค่า Ads เข้าครบ' },
    canc: { k: 'canc', name: 'ยกเลิก / คืน', c: '--orange', tip: 'ยอดออเดอร์ที่ยกเลิก / คืน<br>% = ยอดยกเลิก ÷ (ยอดขาย + ยอดยกเลิก)<br>Shopee / Lazada: ยอดยกเลิกของเดือนที่ยังไม่ปิดมากับไฟล์ปิดเดือนจากบัญชี' }
  };
  const metList = o => o.hub ? [M.rev, M.ord, M.aov, ...(o.ch === 'Facebook' ? [M.cust] : []), M.ads, M.roas, M.canc] : [M.rev, M.ord, M.aov, M.cust, M.canc];
  const tipOf = (o, m) => !o.hub ? m.tip
    : m.k === 'rev' ? `ยอดขาย ${esc(o.ch)} หักยกเลิก / คืน และ CN แล้ว · แหล่งเดียวกับทุกหน้า (ตารางสรุปยอดขาย)`
    : m.k === 'ads' ? (o.adsTip || 'ค่า Ads ของช่องทางนี้').replace(/\n/g, '<br>') + '<br>% = ค่า Ads ÷ ยอดขาย'
    : m.k === 'aov' ? '<b>AOV (Average Order Value)</b> ยอดขาย ÷ ออเดอร์' : m.tip;
  const CH_ORDER = ['TikTok', 'Shopee', 'Facebook', 'ตัวแทน', 'Modern Trade', 'Lazada'];
  const CH_VAR = { TikTok: '--ch-tiktok', Shopee: '--ch-shopee', Facebook: '--ch-facebook', Lazada: '--ch-lazada', 'ตัวแทน': '--ch-dealer', 'Modern Trade': '--ch-mt' };
  const SUB_PAL = ['--accent', '--blue', '--purple', '--cyan', '--green', '--orange', '--pink'];   // สีเพจ / ร้าน (ตรงกันทั้งกราฟและตาราง) · เกิน 7 = รวมเป็น "อื่น ๆ"
  const NOSUB = '(ไม่ระบุ)';
  // สถานะของแต่ละหน้าแยกกัน (ตัวเลขที่เลือก / มุมมองกราฟ / แถวที่กาง)
  const ST = window._ovStates = window._ovStates || {};
  if (window._ovState && !ST.overview) ST.overview = window._ovState;
  const stateOf = o => ST[o.page] = ST[o.page] || { sel: o.hub ? { rev: true, ads: true } : { rev: true, ord: true }, mode: 'metric', cmp: true, open: {} };
  const css = v => getComputedStyle(document.body).getPropertyValue(v).trim() || '#999';
  const num = v => parseFloat(v) || 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct1 = v => (v * 100).toFixed(1) + '%';
  const roasTxt = (rev, ads) => ads > 0 ? (rev / ads).toFixed(2) + 'x' : '—';
  // id ของชิ้นส่วนในหน้า: หน้าภาพรวมยอดขายใช้ id เดิม · หน้าภาพรวมรายช่องทางเติมชื่อหน้าข้างหน้า (กัน id ซ้ำกันข้ามหน้า)
  const idOf = (o, s) => o.page === 'overview' ? s : o.page + '-' + s;
  const $ = (o, s) => document.getElementById(idOf(o, s));

  function injectCss() {
    if (document.getElementById('ov-css')) return;
    const st = document.createElement('style'); st.id = 'ov-css';
    st.textContent = `
.ov{display:flex;flex-direction:column;gap:16px}
.ov .ui-metrics{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.ov .ui-metric-d .badge-up,.ov .ui-metric-d .badge-down{font-size:12px;font-weight:600}
.ov-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-md,12px);padding:16px 18px}
.ov-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-bottom:10px}
.ov-head h2{margin:0;font-size:15px;font-weight:700}
.ov-seg{display:inline-flex;padding:3px;border-radius:9px;background:var(--bg3);border:1px solid var(--border)}
.ov-seg button{border:0;border-radius:7px;padding:6px 12px;font:inherit;font-size:12.5px;cursor:pointer;background:transparent;color:var(--text3)}
.ov-seg button[aria-pressed="true"]{background:var(--bg2);color:var(--text);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.ov-seg button[hidden]{display:none}
.ov-leg{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;font-size:12px;color:var(--text2)}
.ov-leg i{display:inline-block;width:16px;height:3px;border-radius:2px;margin-right:6px;vertical-align:middle}
.ov-chart{position:relative;height:280px}
.ov-tbl{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;min-width:860px}
.ov-tbl th{font-size:12px;font-weight:500;color:var(--text3);text-align:right;padding:8px 12px;border-bottom:1px solid var(--border);white-space:nowrap}
.ov-tbl th:first-child,.ov-tbl td:first-child{text-align:left}
.ov-tbl td{padding:10px 12px;text-align:right;border-bottom:1px solid var(--row-border,var(--border));white-space:nowrap}
.ov-tbl tr.ov-tot td{font-weight:700;background:var(--bg3);border-bottom:1px solid var(--border)}
.ov-tbl tr.ov-sub td{background:var(--accent-soft);font-size:13px;color:var(--text2)}
.ov-tbl tr.ov-sub td:first-child{padding-left:46px;max-width:360px;overflow:hidden;text-overflow:ellipsis}
.ov-ch{display:inline-flex;align-items:center;gap:8px;border:0;background:none;padding:0;color:var(--text);font:inherit;font-weight:600;cursor:pointer}
.ov-ch[disabled]{cursor:default;padding-left:20px}
.ov-ch .chev{display:inline-block;width:12px;color:var(--text3);transition:transform .15s}
.ov-ch[aria-expanded="true"] .chev{transform:rotate(90deg)}
.ov-nm{display:inline-flex;align-items:center;gap:8px;max-width:380px}
.ov-nm span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ov-dot{width:10px;height:10px;border-radius:3px;flex:none}
.ov-n{font-weight:400;color:var(--text3);font-size:12px}
.ov-bar{display:block;width:64px;height:4px;border-radius:2px;background:var(--bg3);overflow:hidden;margin:4px 0 0 auto}
.ov-bar i{display:block;height:100%;border-radius:2px}
.ov-pend{color:var(--warn,#FBBF24);font-size:12px}
.ov-mute{color:var(--text3)}
.ov-up{color:var(--green);font-weight:600}.ov-down{color:var(--red);font-weight:600}`;
    document.head.appendChild(st);
  }

  // ===== ช่วงเวลา / ถังข้อมูล (วัน หรือ เดือน) =====
  function buckets(from, to) {
    const days = Math.round((parseDateLocal(to) - parseDateLocal(from)) / 864e5) + 1;
    const monthly = days > 31;   // กฎ: ช่วงไม่เกิน 1 เดือน → รายวันเสมอ · หลายเดือน → รายเดือน
    const list = [];
    if (monthly) { let m = from.slice(0, 7); while (m <= to.slice(0, 7)) { list.push(m); const d = parseDateLocal(m + '-01'); d.setMonth(d.getMonth() + 1); m = fmtDateISO(d).slice(0, 7); } }
    else { let d = from; while (d <= to) { list.push(d); d = dayAdd(d, 1); } }
    return { monthly, list, key: r => monthly ? r.date.slice(0, 7) : r.date };
  }
  // adsRows / capC ใช้เฉพาะหน้าภาพรวมรายช่องทาง: capC = วันล่าสุดที่ทั้งยอดขายและค่า Ads เข้าครบ (ROAS คิดถึงวันนี้เท่านั้น)
  function series(rows, B, adsRows, capC) {
    const idx = Object.fromEntries(B.list.map((b, i) => [b, i]));
    const z = () => B.list.map(() => 0);
    const o = { rev: z(), ord: z(), rx: z(), ox: z(), canc: z(), ch: {}, sub: {} };
    const withAds = !!adsRows;
    if (withAds) { o.ads = z(); o.revC = z(); o.adsC = z(); }
    rows.forEach(r => { const i = idx[B.key(r)]; if (i == null) return;
      const rv = num(r.net_revenue), od = num(r.net_orders);
      o.rev[i] += rv; o.ord[i] += od; o.canc[i] += num(r.cancelled_revenue);
      if (!isBulkChannel(r.channel)) { o.rx[i] += rv; o.ox[i] += od; }
      (o.ch[r.channel] = o.ch[r.channel] || z())[i] += rv;
      (o.sub[r.sub_channel || NOSUB] = o.sub[r.sub_channel || NOSUB] || z())[i] += rv;
      if (withAds && capC && r.date <= capC) o.revC[i] += rv; });
    o.aov = o.rx.map((v, i) => o.ox[i] ? v / o.ox[i] : null);
    if (withAds) {
      adsRows.forEach(a => { const i = idx[B.key(a)]; if (i == null) return; o.ads[i] += a.ads; if (capC && a.date <= capC) o.adsC[i] += a.ads; });
      o.roas = o.revC.map((v, i) => o.adsC[i] > 0 ? v / o.adsC[i] : null);
    }
    return o;
  }
  const sumOf = (rows, f) => rows.reduce((s, r) => s + num(r[f]), 0);
  const sumAds = rows => rows.reduce((s, a) => s + a.ads, 0);
  const tot = rows => { const x = rows.filter(r => !isBulkChannel(r.channel));
    const rev = sumOf(rows, 'net_revenue'), ord = sumOf(rows, 'net_orders'), cr = sumOf(rows, 'cancelled_revenue'), co = sumOf(rows, 'cancelled_orders');
    const rx = sumOf(x, 'net_revenue'), ox = sumOf(x, 'net_orders');
    return { rev, ord, cr, co, aov: ox ? rx / ox : 0, cpct: rev + cr ? cr / (rev + cr) : 0 }; };
  // ค่า Ads ที่ยังเข้าไม่ครบ: วันล่าสุดของแต่ละแหล่ง (ไม่นับแหล่งที่เลิกใช้แล้ว = ไม่มีข้อมูลเกิน 30 วันก่อนวันสุดท้ายของช่วง)
  const SRC_LABEL = { meta: 'Meta', tiktok: 'TikTok Ads', shopee: 'Product / Shop Ads', shopee_manual: 'Brand / Live / Coins', shopee_sheet: 'ชีท Ads', lazada_sheet: 'ชีท Ads' };
  function adsCapOf(adsAll, to) {
    const last = {};
    adsAll.forEach(a => { if (!last[a.source] || a.date > last[a.source]) last[a.source] = a.date; });
    const lim = dayAdd(to, -30);
    const act = Object.entries(last).filter(([, d]) => d >= lim);
    const late = act.filter(([, d]) => d < to).sort((a, b) => a[1] < b[1] ? -1 : 1);
    return { cap: late.length ? late[0][1] : null, late };
  }

  // ===== แผงตัวเลข (กดเลือกเป็นเส้นในกราฟ — ไม่เปิดแผงรายละเอียด) =====
  function tilesHtml(I, c) {
    const { o, S } = I;
    return metList(o).map(m => {
      const on = !!S.sel[m.k], v = c.vals[m.k], d = c.deltas[m.k];
      return `<button type="button" class="ui-metric${on ? ' is-on' : ''}" style="--m:var(${m.c})" data-ovk="${m.k}" aria-pressed="${on}">
        <span class="ui-metric-l"><span class="ui-tick"></span>${m.name}${fbeInfoIcon(idOf(o, 'ov-i-' + m.k), tipOf(o, m))}</span>
        <span class="ui-metric-v" data-fit>${v}</span>
        <span class="ui-metric-d">${d}</span></button>`;
    }).join('') + (o.extraTiles || []).map((x, i) => `<div class="ui-metric is-static">
        <span class="ui-metric-l">${x.name}${x.tip ? fbeInfoIcon(idOf(o, 'ov-i-x' + i), x.tip) : ''}</span>
        <span class="ui-metric-v" data-fit>${x.value}</span><span class="ui-metric-d">${x.sub || ''}</span></div>`).join('');
  }

  // ===== กราฟ =====
  function drawChart(I) {
    const { o, S, ctx } = I;
    if (!ctx || !window.Chart) return;
    const { B, cur, prv, cust, prvCust, capIdx, showPrev, dashAt } = ctx;
    const cv = $(o, 'ovChart'); if (!cv) return;
    if (I.chart) { I.chart.destroy(); I.chart = null; }
    const lbl = B.list.map(b => B.monthly ? MONTHS_TH[parseInt(b.slice(5, 7)) - 1] + ' ' + String(parseInt(b.slice(0, 4)) + 543).slice(2) : dLbl(b));
    const dashFor = k => { const at = dashAt && dashAt[k] != null ? dashAt[k] : capIdx; return c => c.p1DataIndex > at ? [5, 5] : undefined; };
    const ds = [], scales = { x: { grid: { display: false }, ticks: { color: css('--text3'), maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } } };
    const legend = [];
    if (S.mode === 'metric') {
      const data = { rev: cur.rev, ord: cur.ord, aov: cur.aov, cust, canc: cur.canc, ads: cur.ads, roas: cur.roas };
      const pdata = prv ? { rev: prv.rev, ord: prv.ord, aov: prv.aov, cust: prvCust, canc: prv.canc, ads: prv.ads, roas: prv.roas } : {};
      metList(o).filter(m => S.sel[m.k]).forEach(m => {
        const col = css(m.c), ax = 'y_' + m.k;
        scales[ax] = { display: false, beginAtZero: true, grid: { color: css('--grid') || 'rgba(127,127,127,.12)' } };
        ds.push({ label: m.name, data: data[m.k] || [], yAxisID: ax, borderColor: col, backgroundColor: col, borderWidth: 2.2, pointRadius: 0, pointHoverRadius: 4, tension: .25, spanGaps: false, segment: { borderDash: dashFor(m.k) }, _k: m.k });
        if (showPrev && S.cmp && pdata[m.k]) ds.push({ label: 'ช่วงก่อน · ' + m.name, data: pdata[m.k], yAxisID: ax, borderColor: col, borderWidth: 1.3, borderDash: [3, 5], pointRadius: 0, pointHoverRadius: 3, tension: .25, _prev: true, _opacity: .55, _k: m.k });
        legend.push(`<span><i style="background:var(${m.c})"></i>${m.name}</span>`);
      });
      const first = Object.keys(scales).find(k => k.startsWith('y_')); if (first) scales[first].grid.display = true;
    } else {
      scales.y = { beginAtZero: true, grid: { color: css('--grid') || 'rgba(127,127,127,.12)' }, ticks: { color: css('--text3'), callback: v => fmt(v) } };
      const lines = o.hub ? ctx.subLines.map(s => [s.name, s.data, s.v]) : CH_ORDER.filter(c => cur.ch[c] && cur.ch[c].some(v => v)).map(c => [c, cur.ch[c], CH_VAR[c] || '--text2']);
      lines.forEach(([name, data, v]) => {
        const col = css(v);
        ds.push({ label: name, data, yAxisID: 'y', borderColor: col, backgroundColor: col, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: .25, segment: { borderDash: dashFor('rev') } });
        legend.push(`<span title="${esc(name)}"><i style="background:var(${v})"></i>${esc(name.length > 28 ? name.slice(0, 27) + '…' : name)}</span>`);
      });
    }
    ds.forEach(d => { if (d._opacity && /^#[0-9a-f]{6}$/i.test(d.borderColor)) d.borderColor += '8C'; });
    $(o, 'ovLegend').innerHTML = legend.join('') + (S.mode === 'metric' && showPrev ? `<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" data-ovcmp ${S.cmp ? 'checked' : ''} style="accent-color:var(--accent);">เส้นประ = ช่วงก่อน</label>` : '');
    const cb = $(o, 'ovLegend').querySelector('[data-ovcmp]'); if (cb) cb.onchange = () => { S.cmp = cb.checked; drawChart(I); };
    const vfmt = (k, v) => v == null ? '—' : k === 'roas' ? v.toFixed(2) + 'x' : fmt(v);
    I.chart = new Chart(cv, { type: 'line', data: { labels: lbl, datasets: ds }, options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, animation: false,
      plugins: { legend: { display: false }, tooltip: {
        itemSort: S.mode === 'channel' ? (a, b) => (b.raw || 0) - (a.raw || 0) : undefined,
        callbacks: {
          title: it => { const i = it[0].dataIndex; return lbl[i] + (i > capIdx ? ' · ยอดยังเข้าไม่ครบ' : ''); },
          label: it => { const d = it.dataset; let name = d.label;
            if (d._prev && ctx.prevLbl) name = 'ช่วงก่อน (' + ctx.prevLbl[it.dataIndex] + ') · ' + d.label.replace('ช่วงก่อน · ', '');
            return name + ': ' + vfmt(d._k, it.raw); } } } },
      scales } });
  }

  // ===== ตารางแยกช่องทาง (หน้าภาพรวมยอดขาย · กดชื่อช่องทาง → กางรายเพจ / ร้านในที่เดิม ไม่วาดตารางใหม่) =====
  function cmpOfFn(R) {
    return (ch, s) => { if (R.none) return { t: '—', cls: '' };
      const cu = sumOf(salesRows(R.cf, R.ct, ch, s), 'net_revenue'), pv = sumOf(salesRows(R.pf, R.pt, ch, s), 'net_revenue');
      if (!pv) return { t: '—', cls: '' }; const v = (cu - pv) / pv * 100;
      return { t: (v >= 0 ? '▲ ' : '▼ ') + Math.abs(v).toFixed(1) + '%', cls: v >= 0 ? 'ov-up' : 'ov-down' }; };
  }
  function cancCellFn(from, to, P) {
    const pendCh = ch => P && P.chs.includes(ch);
    return (ch, s, cr, co, rev) => {
      if (isBulkChannel(ch)) return '<span style="color:var(--text3);">—</span>';
      if (!co && pendCh(ch)) return `<span class="ov-pend">รอไฟล์ปิดเดือน</span>`;
      if (!co) return '0';
      return `<span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(s || '')}|cancel">${fmt(cr)}</span> · ${pct1(rev + cr ? cr / (rev + cr) : 0)}${pendCh(ch) ? ` <span class="ov-pend">ยังไม่รวม ${P.mon}</span>` : ''}`;
    };
  }
  function tableHtml(I, c) {
    const { S } = I;
    const { from, to, sub, R, P, rowsAll, total } = c;
    const cmpOf = cmpOfFn(R), cancCell = cancCellFn(from, to, P);
    const byCh = {};
    rowsAll.forEach(r => { const g = byCh[r.channel] = byCh[r.channel] || { rows: [], subs: {} }; g.rows.push(r);
      const k = r.sub_channel || NOSUB; (g.subs[k] = g.subs[k] || []).push(r); });
    const chs = Object.keys(byCh).sort((a, b) => sumOf(byCh[b].rows, 'net_revenue') - sumOf(byCh[a].rows, 'net_revenue'));
    let h = `<tr class="ov-tot"><td>รวม${c.ch ? ' ' + esc(c.ch) : 'ทุกช่องทาง'}</td><td>${fmt(total.rev)}</td><td>100%</td><td>${fmt(total.ord)}</td><td>${total.aov ? fmt(total.aov) : '—'}</td><td class="${c.totCmp.cls}">${c.totCmp.t}</td><td>${fmt(total.cr)} · ${pct1(total.cpct)}</td></tr>`;
    chs.forEach(ch => {
      const g = byCh[ch], t = tot(g.rows), subs = Object.keys(g.subs).sort((a, b) => sumOf(g.subs[b], 'net_revenue') - sumOf(g.subs[a], 'net_revenue'));
      const canOpen = subs.length > 1 || (subs.length === 1 && subs[0] !== NOSUB && subs[0] !== ch && !sub);
      const open = canOpen && (S.open[ch] != null ? S.open[ch] : !!c.ch);
      const share = total.rev ? t.rev / total.rev : 0, k = cmpOf(ch, sub), col = `var(${CH_VAR[ch] || '--text2'})`;
      const unit = ch === 'Facebook' ? 'เพจ' : 'ร้าน';
      h += `<tr data-ovch="${esc(ch)}"><td><button type="button" class="ov-ch" ${canOpen ? `aria-expanded="${open}"` : 'disabled'}>${canOpen ? '<span class="chev">›</span>' : ''}<span class="ov-dot" style="background:${col}"></span>${esc(ch)}${canOpen ? ` <span class="ov-n">${subs.length} ${unit}</span>` : ''}</button></td>
        <td><span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(sub || '')}">${fmt(t.rev)}</span></td>
        <td>${pct1(share)}<span class="ov-bar"><i style="width:${(share * 100).toFixed(1)}%;background:${col}"></i></span></td>
        <td><span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(sub || '')}|orders">${fmt(t.ord)}</span></td>
        <td>${isBulkChannel(ch) ? '<span style="color:var(--text3);" title="ตัวแทน / MT สั่งลอตใหญ่ ไม่คิด AOV">—</span>' : (t.ord ? fmt(t.rev / t.ord) : '—')}</td>
        <td class="${k.cls}">${k.t}</td><td>${cancCell(ch, sub, t.cr, t.co, t.rev)}</td></tr>`;
      if (canOpen) subs.forEach(s => { const sr = g.subs[s], st = tot(sr), sk = cmpOf(ch, s === NOSUB ? null : s), sh = total.rev ? st.rev / total.rev : 0, sname = s === NOSUB ? '' : s;
        h += `<tr class="ov-sub pg-child" data-ovp="${esc(ch)}" style="${open ? '' : 'display:none;'}"><td title="${esc(s)}">${esc(s)}</td>
          <td><span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(sname)}">${fmt(st.rev)}</span></td><td>${pct1(sh)}</td>
          <td>${fmt(st.ord)}</td><td>${isBulkChannel(ch) ? '—' : (st.ord ? fmt(st.rev / st.ord) : '—')}</td>
          <td class="${sk.cls}">${sk.t}</td><td>${cancCell(ch, sname, st.cr, st.co, st.rev)}</td></tr>`; });
    });
    return h;
  }

  // ===== ตารางรายเพจ / ร้าน (หน้าภาพรวมรายช่องทาง) — แถว = เพจ / ร้านที่มียอดขายหรือมีค่า Ads ในช่วงนี้ · ผลรวมทุกแถว = แถวรวม = แผงตัวเลข =====
  function subGroups(rowsAll, adsIn) {
    const g = {};
    rowsAll.forEach(r => { const k = r.sub_channel || NOSUB; (g[k] = g[k] || { rows: [], ads: 0 }).rows.push(r); });
    adsIn.forEach(a => { const k = a.subChannel || NOSUB; (g[k] = g[k] || { rows: [], ads: 0 }).ads += a.ads; });
    const keys = Object.keys(g).sort((a, b) => (sumOf(g[b].rows, 'net_revenue') - sumOf(g[a].rows, 'net_revenue')) || (g[b].ads - g[a].ads));
    return { g, keys };
  }
  const subVar = (keys, k) => { const i = keys.indexOf(k); return i >= 0 && i < SUB_PAL.length ? SUB_PAL[i] : '--text3'; };
  function hubTableHtml(I, c) {
    const { o } = I;
    const { from, to, sub, R, P, rowsAll, total, totCmp, adsIn, totAds, SG } = c;
    const cmpOf = cmpOfFn(R), cancCell = cancCellFn(from, to, P), ch = o.ch;
    let h = `<tr class="ov-tot"><td>รวม ${esc(ch)}</td><td>${fmt(total.rev)}</td><td>100%</td><td>${fmt(total.ord)}</td><td>${total.aov ? fmt(total.aov) : '—'}</td>
      <td>${fmt(totAds)}</td><td>${roasTxt(total.rev, totAds)}</td><td class="${totCmp.cls}">${totCmp.t}</td><td>${cancCell(ch, sub, total.cr, total.co, total.rev)}</td></tr>`;
    SG.keys.forEach(k => {
      // แถว "(ไม่ระบุ)" กดดูที่มา / เทียบช่วงก่อนไม่ได้ (ตัวกรองว่าง = ทั้งช่องทาง)
      const x = SG.g[k], t = tot(x.rows), named = k !== NOSUB && x.rows.length > 0, share = total.rev ? t.rev / total.rev : 0, cm = named ? cmpOf(ch, k) : { t: '—', cls: '' }, v = subVar(SG.keys, k);
      const tr = (val, kind) => named ? `<span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(k)}${kind || ''}">${fmt(val)}</span>` : (val ? fmt(val) : '<span class="ov-mute">0</span>');
      h += `<tr><td><span class="ov-nm"><span class="ov-dot" style="background:var(${v})"></span><span class="ui-trunc" title="${esc(k)}">${esc(k)}</span></span></td>
        <td>${tr(t.rev)}</td>
        <td>${pct1(share)}<span class="ov-bar"><i style="width:${(share * 100).toFixed(1)}%;background:var(${v})"></i></span></td>
        <td>${tr(t.ord, '|orders')}</td>
        <td>${t.ord ? fmt(t.rev / t.ord) : '—'}</td>
        <td>${x.ads ? fmt(x.ads) : '<span class="ov-mute">0</span>'}</td><td>${x.ads ? roasTxt(t.rev, x.ads) : '<span class="ov-mute">—</span>'}</td>
        <td class="${cm.cls}">${cm.t}</td><td>${named ? cancCell(ch, k, t.cr, t.co, t.rev) : (t.cr ? fmt(t.cr) : '<span class="ov-mute">—</span>')}</td></tr>`;
    });
    return h;
  }

  // ===== โครงหน้า =====
  function shell(o) {
    const unit = o.ch === 'Facebook' ? 'เพจ' : 'ร้าน';
    const segAlt = o.hub ? 'แยก' + unit : 'แยกช่องทาง';
    const go = o.hub && o.adsPage ? `<button class="btn btn-ghost" type="button" data-ovgo="${o.adsPage}">ดูหน้า ${esc(o.adsName || 'Ads')} →</button>` : '';
    const head = o.hub
      ? `<th>${unit}</th><th>ยอดขาย</th><th title="ยอดขายของแถว ÷ ยอดขายรวม ${esc(o.ch)}">สัดส่วน</th><th>ออเดอร์</th><th title="ยอดขาย ÷ ออเดอร์">AOV</th>
         <th title="ค่า Ads ที่ยิงให้${unit}นั้น · แหล่งเดียวกับหน้า Ad Performance">ค่า Ads</th><th title="ROAS = ยอดขาย ÷ ค่า Ads ของแถวเดียวกัน">ROAS</th><th id="${idOf(o, 'ovCmpTh')}">เทียบช่วงก่อน</th><th>ยกเลิก / คืน</th>`
      : `<th>ช่องทาง</th><th>ยอดขาย</th><th title="ยอดขายของแถว ÷ ยอดรวมทุกช่องทาง">สัดส่วน</th><th>ออเดอร์</th>
         <th title="ยอดขาย ÷ ออเดอร์ · ตัวแทน / MT ไม่คิด">AOV</th><th id="${idOf(o, 'ovCmpTh')}">เทียบช่วงก่อน</th><th>ยกเลิก / คืน</th>`;
    const cols = o.hub ? 9 : 7;
    return `<div class="ov">
      <section class="ui-metrics" id="${idOf(o, 'ovTiles')}" aria-label="ตัวเลขหลัก"><div class="empty" style="padding:22px;">กำลังโหลด...</div></section>
      <div class="ov-card"><div class="ov-head"><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;"><h2>แนวโน้ม<span id="${idOf(o, 'ovGrain')}">รายวัน</span></h2>
        <div class="ov-seg" role="group" aria-label="มุมมองกราฟ"><button type="button" data-ovmode="metric">ตัวเลขที่เลือก</button><button type="button" data-ovmode="channel">${segAlt}</button></div>${go}</div>
        <div class="ov-leg" id="${idOf(o, 'ovLegend')}"></div></div><div class="ov-chart"><canvas id="${idOf(o, 'ovChart')}"></canvas></div></div>
      <div class="ov-card" id="${idOf(o, 'ovTblCard')}" style="padding:16px 0 4px;"><div class="ov-head" style="padding:0 18px;"><h2>${o.hub ? 'แยกตาม' + unit : 'แยกตามช่องทาง'}</h2><button class="btn btn-ghost" type="button" onclick="exportTable('${idOf(o, 'ovTbl')}')">⬇ Export</button></div>
        <div style="overflow-x:auto;"><table class="ov-tbl" id="${idOf(o, 'ovTbl')}" data-no-page><thead><tr>${head}</tr></thead>
          <tbody id="${idOf(o, 'ovTbody')}"><tr><td colspan="${cols}" class="empty">กำลังโหลด...</td></tr></tbody></table></div></div></div>`;
  }

  // ===== หน้า =====
  // o = { root, from, to, ch, sub, page, hub?, skipEnsure?, ads? (แถวค่า Ads ของช่องทาง: date, subChannel, ads, source), adsTip?, adsPage?, adsName?, extraTiles? }
  window.renderSalesOverview = async function (o) {
    injectCss();
    const { root, from, to, ch, sub, page } = o;
    const I = root._ov = root._ov || { chart: null, ctx: null };
    I.o = o; I.S = stateOf(o);
    const S = I.S;
    const seq = (root._ovSeq = (root._ovSeq || 0) + 1);
    const alive = () => seq === root._ovSeq && currentPage === page;
    if (!root.querySelector('.ov')) root.innerHTML = shell(o);
    // ปุ่มต่าง ๆ ผูกครั้งเดียว (อ่านสถานะล่าสุดจาก root._ov ทุกครั้ง)
    if (!root._ovBound) {
      root._ovBound = true;
      root.addEventListener('click', e => {
        const J = root._ov, T = J.S;
        const t = e.target.closest('[data-ovk]');
        if (t && !e.target.closest('.ads-info-wrap')) { const k = t.dataset.ovk, sel = { ...T.sel, [k]: !T.sel[k] };
          if (Object.values(sel).some(Boolean)) { T.sel = sel; T.mode = 'metric'; t.classList.toggle('is-on', !!sel[k]); t.setAttribute('aria-pressed', !!sel[k]); syncSeg(J); drawChart(J); } return; }
        const m = e.target.closest('[data-ovmode]'); if (m) { T.mode = m.dataset.ovmode; syncSeg(J); drawChart(J); return; }
        const g = e.target.closest('[data-ovgo]'); if (g) { const p = g.dataset.ovgo; showPage(p, null, document.querySelector(`.nav-item[onclick*="'${p}'"]`)); return; }
        const b = e.target.closest('.ov-ch[aria-expanded]'); if (b) { const tr = b.closest('tr'), c2 = tr.dataset.ovch, open = b.getAttribute('aria-expanded') !== 'true';
          T.open[c2] = open; b.setAttribute('aria-expanded', open);
          root.querySelectorAll('tr.ov-sub').forEach(r => { if (r.dataset.ovp === c2) r.style.display = open ? '' : 'none'; }); }
      });
    }
    function syncSeg(J) { root.querySelectorAll('[data-ovmode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ovmode === J.S.mode)); }
    syncSeg(I);

    if (!o.skipEnsure) {
      try { await ensureSalesSummary(from, to, () => { if (alive()) window.renderSalesOverview(o); }); }
      catch (e) { if (window.showError) showError('โหลดยอดขายไม่สำเร็จ: ' + e.message); return; }
      if (!alive()) return;
      await ensureSalesDone();
      if (!alive()) return;
    }

    const rowsAll = salesRows(from, to, ch, sub), total = tot(rowsAll);
    const R = cmpRange(from, to, ch), P = cancelPending(to, ch);
    noteSalesStatus(page, R, P);
    const cC = R.none ? null : tot(salesRows(R.cf, R.ct, ch, sub)), cP = R.none ? null : tot(salesRows(R.pf, R.pt, ch, sub));
    const badgeW = (a, b, none, tip) => { if (none) return `<span title="${esc(tip)}">—</span>`; const x = cmpBadge(a, b, tip); return `<span class="${x.cls}" title="${esc(x.tip || '')}">${x.text}</span> vs ช่วงก่อน`; };
    const badge = (a, b) => badgeW(a, b, R.none, R.tip);
    const custOk = !ch || ch === 'Facebook';
    const vals = { rev: fmt(total.rev), ord: fmt(total.ord), aov: total.aov ? fmt(total.aov) : '—', cust: custOk ? '…' : '—', canc: fmt(total.cr) };
    const deltas = { rev: badge(cC && cC.rev, cP && cP.rev), ord: badge(cC && cC.ord, cP && cP.ord), aov: badge(cC && cC.aov, cP && cP.aov),
      cust: custOk ? '' : '<span title="ช่องทางนี้ไม่ส่งเบอร์โทรจริงมา">นับได้เฉพาะ Facebook</span>',
      canc: `${pct1(total.cpct)} ของยอดก่อนตัดออก${P ? ` · <span class="ov-pend">ยังไม่รวม ${P.chs.join(' / ')} ${P.mon}</span>` : ''}` };
    const totCmp = (() => { if (R.none || !cP || !cP.rev) return { t: '—', cls: '' }; const v = (cC.rev - cP.rev) / cP.rev * 100; return { t: (v >= 0 ? '▲ ' : '▼ ') + Math.abs(v).toFixed(1) + '%', cls: v >= 0 ? 'ov-up' : 'ov-down' }; })();

    // ===== ค่า Ads + ROAS (เฉพาะหน้าภาพรวมรายช่องทาง) =====
    let A = null;
    if (o.hub) {
      const adsAll = o.ads || [];
      const adsBy = (f, t) => adsAll.filter(a => a.date >= f && a.date <= t && (!sub || a.subChannel === sub));
      const adsIn = adsBy(from, to), totAds = sumAds(adsIn);
      const AC = adsCapOf(adsAll, to);
      const salesCap = R.none ? dayAdd(from, -1) : R.ct;   // วันล่าสุดที่ยอดขายเข้าครบ
      const capC = AC.cap && AC.cap < salesCap ? AC.cap : salesCap;   // วันล่าสุดที่ทั้งยอดขายและค่า Ads เข้าครบ
      const noneA = capC < from, pA = noneA ? null : getPrevPeriodRange(from, capC);
      const tipA = noneA ? 'ยอดขาย / ค่า Ads ของช่วงนี้ยังเข้าไม่ครบ จึงยังไม่เทียบกับช่วงก่อน'
        : `เทียบ ${dLbl(from)} – ${dLbl(capC)} กับ ${dLbl(pA.from)} – ${dLbl(pA.to)}` + (capC < to ? ` · ไม่นับตั้งแต่ ${dLbl(dayAdd(capC, 1))} เพราะยอดขาย / ค่า Ads ยังเข้าไม่ครบ` : '');
      const aCur = noneA ? 0 : sumAds(adsBy(from, capC)), aPrev = noneA ? 0 : sumAds(adsBy(pA.from, pA.to));
      const rCur = noneA ? 0 : sumOf(salesRows(from, capC, ch, sub), 'net_revenue'), rPrev = noneA ? 0 : sumOf(salesRows(pA.from, pA.to, ch, sub), 'net_revenue');
      vals.ads = fmt(totAds);
      deltas.ads = badgeW(aCur, aPrev, noneA, tipA) + (total.rev > 0 && totAds > 0 ? ` · ${pct1(totAds / total.rev)} ของยอดขาย` : '');
      vals.roas = roasTxt(total.rev, totAds);
      deltas.roas = badgeW(aCur > 0 ? rCur / aCur : 0, aPrev > 0 ? rPrev / aPrev : 0, noneA || !(aCur > 0 && aPrev > 0), aCur > 0 && aPrev > 0 ? tipA : 'ช่วงนี้หรือช่วงก่อนไม่มีค่า Ads ให้เทียบ');
      // ค่า Ads ที่เข้าช้ากว่ายอดขาย → แจ้งที่ปุ่มสถานะของหน้า (ที่เดียว ไม่ทำแถบในหน้า)
      const lateA = AC.cap && AC.cap < salesCap ? AC.late.filter(([, d]) => d < salesCap) : [];
      if (window.pageNote) window.pageNote(page, 'adsstale', lateA.length ? 'warn' : null, lateA.length ? `ค่า Ads ${lateA.map(([s]) => SRC_LABEL[s] || s).join(' / ')} มีถึง ${dLbl(lateA[0][1])}` : '',
        lateA.length ? 'ยอดรวมนับตามที่เข้าแล้ว · ROAS ในกราฟคิดถึงวันที่ค่า Ads เข้าครบ' : '');
      A = { adsAll, adsBy, adsIn, totAds, AC, capC, SG: subGroups(rowsAll, adsIn) };
    }

    $(o, 'ovTiles').innerHTML = tilesHtml(I, { vals, deltas });
    const th = $(o, 'ovCmpTh'); if (th) th.title = R.tip || '';
    const tbody = $(o, 'ovTbody');
    if (o.hub) {
      const show = A.SG.keys.length > 1;   // ร้านเดียว (เช่น TikTok) = ซ้ำกับแผงตัวเลข → ไม่แสดงตาราง
      $(o, 'ovTblCard').style.display = show ? '' : 'none';
      tbody.innerHTML = show ? hubTableHtml(I, { from, to, sub, R, P, rowsAll, total, totCmp, adsIn: A.adsIn, totAds: A.totAds, SG: A.SG }) : '';
      const alt = root.querySelector('[data-ovmode="channel"]'); if (alt) alt.hidden = !show;
      if (!show && S.mode === 'channel') { S.mode = 'metric'; syncSeg(I); }
    } else tbody.innerHTML = rowsAll.length ? tableHtml(I, { from, to, ch, sub, R, P, rowsAll, total, totCmp }) : '<tr><td colspan="7" class="empty">ไม่มียอดขายในช่วงนี้</td></tr>';

    // กราฟ: รายวัน (≤ 1 เดือน) / รายเดือน · เส้นประหลังวันที่ยอดเข้าครบล่าสุด · เส้นประจาง = ช่วงก่อนที่ยาวเท่ากัน (เฉพาะรายวัน)
    const B = buckets(from, to);
    $(o, 'ovGrain').textContent = B.monthly ? 'รายเดือน' : 'รายวัน';
    const cur = series(rowsAll, B, A && A.adsIn, A && A.capC);
    // ช่วงที่ยอดยังเข้าไม่ครบ = เส้นประ: รายวัน = หลังวันที่ครบล่าสุด · รายเดือน = เดือนสุดท้าย (ยังไม่จบเดือน)
    const capIdx = !R.cut ? B.list.length : R.none ? -1 : B.monthly ? B.list.length - 2 : B.list.indexOf(R.ct);
    let dashAt = null, subLines = [];
    if (A) {
      // ค่า Ads: รายวัน = ไม่วาดวันที่ยังไม่เข้า · รายเดือน = เดือนสุดท้ายเป็นเส้นประ · ROAS ไม่วาดหลังวันที่ทั้งสองฝั่งเข้าครบ
      if (A.AC.cap && !B.monthly) cur.ads = cur.ads.map((v, i) => B.list[i] > A.AC.cap ? null : v);
      const L = B.list.length;
      dashAt = { ads: B.monthly && A.AC.cap ? L - 2 : L, roas: B.monthly && A.capC < to ? L - 2 : L };
      const top = A.SG.keys.slice(0, SUB_PAL.length), rest = A.SG.keys.slice(SUB_PAL.length);
      subLines = top.map(k => ({ name: k, data: cur.sub[k] || B.list.map(() => 0), v: subVar(A.SG.keys, k) })).filter(s => s.data.some(v => v));
      if (rest.length) { const d = B.list.map((_, i) => rest.reduce((s, k) => s + ((cur.sub[k] || [])[i] || 0), 0)); if (d.some(v => v)) subLines.push({ name: `อื่น ๆ (${rest.length})`, data: d, v: '--text3' }); }
    }
    let prv = null, prevLbl = null;
    const showPrev = !B.monthly;
    if (showPrev) { const pr = getPrevPeriodRange(from, to);
      if (pr && pr.from) { const PB = { monthly: false, list: [], key: r => r.date }; let d = pr.from; while (d <= pr.to) { PB.list.push(d); d = dayAdd(d, 1); }
        prv = series(salesRows(pr.from, pr.to, ch, sub), PB, A && A.adsBy(pr.from, pr.to), A && pr.to); prevLbl = PB.list.map(dLbl); } }
    I.ctx = { B, cur, prv, cust: null, prvCust: null, capIdx, showPrev, prevLbl, dashAt, subLines };
    drawChart(I);
    if (window.UI && UI.fit) UI.fit();

    // ลูกค้า Facebook: ยอดรวม (ไม่ซ้ำทั้งช่วง) + เส้นรายวัน / รายเดือน — ขึ้นทีหลังไม่บล็อกส่วนอื่น
    if (custOk && metList(o).includes(M.cust)) {
      try {
        const [n, nc, np, ser, pser] = await Promise.all([
          fetchUniqueCustomers(from, to, 'Facebook', sub),
          R.none ? null : fetchUniqueCustomers(R.cf, R.ct, 'Facebook', sub), R.none ? null : fetchUniqueCustomers(R.pf, R.pt, 'Facebook', sub),
          supaRpc('fb_customers_series', { p_from: from, p_to: to, p_sub: sub || null, p_month: B.monthly }),
          showPrev && I.ctx.prevLbl ? supaRpc('fb_customers_series', { p_from: getPrevPeriodRange(from, to).from, p_to: getPrevPeriodRange(from, to).to, p_sub: sub || null, p_month: false }) : null]);
        if (!alive()) return;
        const tile = $(o, 'ovTiles').querySelector('[data-ovk="cust"]');
        if (tile) { tile.querySelector('.ui-metric-v').textContent = fmt(n); tile.querySelector('.ui-metric-d').innerHTML = badge(nc, np); }
        const m = Object.fromEntries((ser || []).map(x => [x[0], x[1]]));
        I.ctx.cust = B.list.map((b, i) => i > I.ctx.capIdx ? null : (m[b] || 0));
        if (pser) { const pm = Object.fromEntries(pser.map(x => [x[0], x[1]])); const pr = getPrevPeriodRange(from, to); const pl = []; let d = pr.from; while (d <= pr.to) { pl.push(pm[d] || 0); d = dayAdd(d, 1); } I.ctx.prvCust = pl; }
        if (S.sel.cust) drawChart(I);
        if (window.UI && UI.fit) UI.fit();
      } catch (e) { const tile = $(o, 'ovTiles').querySelector('[data-ovk="cust"] .ui-metric-v'); if (tile) tile.textContent = '—'; console.warn('customers', e.message); }
    }
  };
})();
