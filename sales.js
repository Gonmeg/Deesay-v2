// sales.js — (2026-10-18) แม่แบบ 1 "ภาพรวมยอดขาย" (รวมหน้าแยกตาม Channel เข้ามาแล้ว) · อ้างอิง Shopee Seller Centre + Facebook Ads Manager
// โหลดจาก dashboard.html (renderOverview) · ใช้ตัวช่วยกลางของ dashboard: ensureSalesSummary / salesRows / ensureSalesDone / cmpRange / cancelPending / noteSalesStatus
// ตัวเลขทุกตัวมาจากตารางสรุปยอดขาย (mv_sales_daily ผ่าน sales_summary) แหล่งเดียวกับหน้าแรกและทุกหน้า · ลูกค้านับเฉพาะ Facebook (fb_customers_series / unique_customers)
(function () {
  'use strict';
  const MET = [
    { k: 'rev', name: 'ยอดขาย', c: '--accent', tip: 'ยอดขายทุกช่องทาง หักยกเลิก / คืน และ CN แล้ว · แหล่งเดียวกับทุกหน้า (ตารางสรุปยอดขาย)' },
    { k: 'ord', name: 'ออเดอร์', c: '--blue', tip: 'จำนวนออเดอร์ ไม่นับที่ยกเลิก / คืน' },
    { k: 'aov', name: 'AOV', c: '--purple', tip: '<b>AOV (Average Order Value)</b> ยอดขาย ÷ ออเดอร์<br>ไม่คิดของตัวแทน / Modern Trade เพราะสั่งลอตใหญ่' },
    { k: 'cust', name: 'ลูกค้า Facebook', c: '--cyan', tip: 'เบอร์โทรไม่ซ้ำ นับเฉพาะ Facebook / Line<br>TikTok / Shopee ไม่ส่งเบอร์โทรจริงมา จึงนับไม่ได้' },
    { k: 'canc', name: 'ยกเลิก / คืน', c: '--red', tip: 'ยอดออเดอร์ที่ยกเลิก / คืน<br>% = ยอดยกเลิก ÷ (ยอดขาย + ยอดยกเลิก)<br>Shopee / Lazada: ยอดยกเลิกของเดือนที่ยังไม่ปิดมากับไฟล์ปิดเดือนจากบัญชี' }
  ];
  const CH_ORDER = ['TikTok', 'Shopee', 'Facebook', 'ตัวแทน', 'Modern Trade', 'Lazada'];
  const CH_VAR = { TikTok: '--ch-tiktok', Shopee: '--ch-shopee', Facebook: '--ch-facebook', Lazada: '--ch-lazada', 'ตัวแทน': '--ch-dealer', 'Modern Trade': '--ch-mt' };
  const S = window._ovState = window._ovState || { sel: { rev: true, ord: true }, mode: 'metric', cmp: true, open: {} };
  const css = v => getComputedStyle(document.body).getPropertyValue(v).trim() || '#999';
  const num = v => parseFloat(v) || 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pct1 = v => (v * 100).toFixed(1) + '%';
  let chart = null, ctx = null;

  function injectCss() {
    if (document.getElementById('ov-css')) return;
    const st = document.createElement('style'); st.id = 'ov-css';
    st.textContent = `
.ov{display:flex;flex-direction:column;gap:16px}
.ov .ui-metrics{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
.ov .ui-metric-d .badge-up,.ov .ui-metric-d .badge-down{font-size:12px;font-weight:600}
.ov-card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-md,12px);padding:16px 18px}
.ov-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px 16px;margin-bottom:10px}
.ov-head h2{margin:0;font-size:15px;font-weight:700}
.ov-seg{display:inline-flex;padding:3px;border-radius:9px;background:var(--bg3);border:1px solid var(--border)}
.ov-seg button{border:0;border-radius:7px;padding:6px 12px;font:inherit;font-size:12.5px;cursor:pointer;background:transparent;color:var(--text3)}
.ov-seg button[aria-pressed="true"]{background:var(--bg2);color:var(--text);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.2)}
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
.ov-dot{width:10px;height:10px;border-radius:3px;flex:none}
.ov-n{font-weight:400;color:var(--text3);font-size:12px}
.ov-bar{display:block;width:64px;height:4px;border-radius:2px;background:var(--bg3);overflow:hidden;margin:4px 0 0 auto}
.ov-bar i{display:block;height:100%;border-radius:2px}
.ov-pend{color:var(--warn,#FBBF24);font-size:12px}
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
  function series(rows, B) {
    const idx = Object.fromEntries(B.list.map((b, i) => [b, i]));
    const z = () => B.list.map(() => 0);
    const o = { rev: z(), ord: z(), rx: z(), ox: z(), canc: z(), ch: {} };
    rows.forEach(r => { const i = idx[B.key(r)]; if (i == null) return;
      const rv = num(r.net_revenue), od = num(r.net_orders);
      o.rev[i] += rv; o.ord[i] += od; o.canc[i] += num(r.cancelled_revenue);
      if (!isBulkChannel(r.channel)) { o.rx[i] += rv; o.ox[i] += od; }
      (o.ch[r.channel] = o.ch[r.channel] || z())[i] += rv; });
    o.aov = o.rx.map((v, i) => o.ox[i] ? v / o.ox[i] : null);
    return o;
  }
  const sumOf = (rows, f) => rows.reduce((s, r) => s + num(r[f]), 0);
  const tot = rows => { const x = rows.filter(r => !isBulkChannel(r.channel));
    const rev = sumOf(rows, 'net_revenue'), ord = sumOf(rows, 'net_orders'), cr = sumOf(rows, 'cancelled_revenue'), co = sumOf(rows, 'cancelled_orders');
    const rx = sumOf(x, 'net_revenue'), ox = sumOf(x, 'net_orders');
    return { rev, ord, cr, co, aov: ox ? rx / ox : 0, cpct: rev + cr ? cr / (rev + cr) : 0 }; };

  // ===== แผงตัวเลข 5 ช่อง (กดเลือกเป็นเส้นในกราฟ — ไม่เปิดแผงรายละเอียด) =====
  function tilesHtml(c) {
    return MET.map(m => {
      const on = !!S.sel[m.k], v = c.vals[m.k], d = c.deltas[m.k];
      return `<button type="button" class="ui-metric${on ? ' is-on' : ''}" style="--m:var(${m.c})" data-ovk="${m.k}" aria-pressed="${on}">
        <span class="ui-metric-l"><span class="ui-tick"></span>${m.name}${fbeInfoIcon('ov-i-' + m.k, m.tip)}</span>
        <span class="ui-metric-v" data-fit>${v}</span>
        <span class="ui-metric-d">${d}</span></button>`;
    }).join('');
  }

  // ===== กราฟ =====
  function drawChart() {
    if (!ctx || !window.Chart) return;
    const { B, cur, prv, cust, prvCust, capIdx, showPrev } = ctx;
    const cv = document.getElementById('ovChart'); if (!cv) return;
    if (chart) { chart.destroy(); chart = null; }
    const lbl = B.list.map(b => B.monthly ? MONTHS_TH[parseInt(b.slice(5, 7)) - 1] + ' ' + String(parseInt(b.slice(0, 4)) + 543).slice(2) : dLbl(b));
    const dash = c => c.p1DataIndex > capIdx ? [5, 5] : undefined;
    const ds = [], scales = { x: { grid: { display: false }, ticks: { color: css('--text3'), maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } } };
    const legend = [];
    if (S.mode === 'metric') {
      const data = { rev: cur.rev, ord: cur.ord, aov: cur.aov, cust, canc: cur.canc };
      const pdata = { rev: prv && prv.rev, ord: prv && prv.ord, aov: prv && prv.aov, cust: prvCust, canc: prv && prv.canc };
      MET.filter(m => S.sel[m.k]).forEach(m => {
        const col = css(m.c), ax = 'y_' + m.k;
        scales[ax] = { display: false, beginAtZero: true, grid: { color: css('--grid') || 'rgba(127,127,127,.12)' } };
        ds.push({ label: m.name, data: data[m.k] || [], yAxisID: ax, borderColor: col, backgroundColor: col, borderWidth: 2.2, pointRadius: 0, pointHoverRadius: 4, tension: .25, spanGaps: false, segment: { borderDash: dash } });
        if (showPrev && S.cmp && pdata[m.k]) ds.push({ label: 'ช่วงก่อน · ' + m.name, data: pdata[m.k], yAxisID: ax, borderColor: col, borderWidth: 1.3, borderDash: [3, 5], pointRadius: 0, pointHoverRadius: 3, tension: .25, _prev: true, _opacity: .55 });
        legend.push(`<span><i style="background:var(${m.c})"></i>${m.name}</span>`);
      });
      const first = Object.keys(scales).find(k => k.startsWith('y_')); if (first) scales[first].grid.display = true;
    } else {
      scales.y = { beginAtZero: true, grid: { color: css('--grid') || 'rgba(127,127,127,.12)' }, ticks: { color: css('--text3'), callback: v => fmt(v) } };
      CH_ORDER.filter(c => cur.ch[c] && cur.ch[c].some(v => v)).forEach(c => {
        const col = css(CH_VAR[c] || '--text2');
        ds.push({ label: c, data: cur.ch[c], yAxisID: 'y', borderColor: col, backgroundColor: col, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: .25, segment: { borderDash: dash } });
        legend.push(`<span><i style="background:var(${CH_VAR[c] || '--text2'})"></i>${c}</span>`);
      });
    }
    ds.forEach(d => { if (d._opacity && /^#[0-9a-f]{6}$/i.test(d.borderColor)) d.borderColor += '8C'; });
    document.getElementById('ovLegend').innerHTML = legend.join('') + (S.mode === 'metric' && showPrev ? `<label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;"><input type="checkbox" id="ovCmp" ${S.cmp ? 'checked' : ''} style="accent-color:var(--accent);">เส้นประ = ช่วงก่อน</label>` : '');
    const cb = document.getElementById('ovCmp'); if (cb) cb.onchange = () => { S.cmp = cb.checked; drawChart(); };
    chart = new Chart(cv, { type: 'line', data: { labels: lbl, datasets: ds }, options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, animation: false,
      plugins: { legend: { display: false }, tooltip: {
        itemSort: S.mode === 'channel' ? (a, b) => (b.raw || 0) - (a.raw || 0) : undefined,
        callbacks: {
          title: it => { const i = it[0].dataIndex; return lbl[i] + (i > capIdx ? ' · ยอดยังเข้าไม่ครบ' : ''); },
          label: it => { const d = it.dataset; let name = d.label;
            if (d._prev && ctx.prevLbl) name = 'ช่วงก่อน (' + ctx.prevLbl[it.dataIndex] + ') · ' + d.label.replace('ช่วงก่อน · ', '');
            return name + ': ' + (it.raw == null ? '—' : fmt(it.raw)); } } } },
      scales } });
  }

  // ===== ตารางแยกช่องทาง (กดชื่อช่องทาง → กางรายเพจ / ร้านในที่เดิม ไม่วาดตารางใหม่) =====
  function tableHtml(c) {
    const { from, to, sub, R, P, rowsAll, total } = c;
    const cmpOf = (ch, s) => { if (R.none) return { t: '—', cls: '' };
      const cu = sumOf(salesRows(R.cf, R.ct, ch, s), 'net_revenue'), pv = sumOf(salesRows(R.pf, R.pt, ch, s), 'net_revenue');
      if (!pv) return { t: '—', cls: '' }; const v = (cu - pv) / pv * 100;
      return { t: (v >= 0 ? '▲ ' : '▼ ') + Math.abs(v).toFixed(1) + '%', cls: v >= 0 ? 'ov-up' : 'ov-down' }; };
    const pendCh = ch => P && P.chs.includes(ch);
    const cancCell = (ch, s, cr, co, rev) => {
      if (isBulkChannel(ch)) return '<span style="color:var(--text3);">—</span>';
      if (!co && pendCh(ch)) return `<span class="ov-pend">รอไฟล์ปิดเดือน</span>`;
      if (!co) return '0';
      return `<span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(s || '')}|cancel">${fmt(cr)}</span> · ${pct1(rev + cr ? cr / (rev + cr) : 0)}${pendCh(ch) ? ` <span class="ov-pend">ยังไม่รวม ${P.mon}</span>` : ''}`;
    };
    const byCh = {};
    rowsAll.forEach(r => { const g = byCh[r.channel] = byCh[r.channel] || { rows: [], subs: {} }; g.rows.push(r);
      const k = r.sub_channel || '(ไม่ระบุ)'; (g.subs[k] = g.subs[k] || []).push(r); });
    const chs = Object.keys(byCh).sort((a, b) => sumOf(byCh[b].rows, 'net_revenue') - sumOf(byCh[a].rows, 'net_revenue'));
    let h = `<tr class="ov-tot"><td>รวม${c.ch ? ' ' + esc(c.ch) : 'ทุกช่องทาง'}</td><td>${fmt(total.rev)}</td><td>100%</td><td>${fmt(total.ord)}</td><td>${total.aov ? fmt(total.aov) : '—'}</td><td class="${c.totCmp.cls}">${c.totCmp.t}</td><td>${fmt(total.cr)} · ${pct1(total.cpct)}</td></tr>`;
    chs.forEach(ch => {
      const g = byCh[ch], t = tot(g.rows), subs = Object.keys(g.subs).sort((a, b) => sumOf(g.subs[b], 'net_revenue') - sumOf(g.subs[a], 'net_revenue'));
      const canOpen = subs.length > 1 || (subs.length === 1 && subs[0] !== '(ไม่ระบุ)' && subs[0] !== ch && !sub);
      const open = canOpen && (S.open[ch] != null ? S.open[ch] : !!c.ch);
      const share = total.rev ? t.rev / total.rev : 0, k = cmpOf(ch, sub), col = `var(${CH_VAR[ch] || '--text2'})`;
      const unit = ch === 'Facebook' ? 'เพจ' : 'ร้าน';
      h += `<tr data-ovch="${esc(ch)}"><td><button type="button" class="ov-ch" ${canOpen ? `aria-expanded="${open}"` : 'disabled'}>${canOpen ? '<span class="chev">›</span>' : ''}<span class="ov-dot" style="background:${col}"></span>${esc(ch)}${canOpen ? ` <span class="ov-n">${subs.length} ${unit}</span>` : ''}</button></td>
        <td><span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(sub || '')}">${fmt(t.rev)}</span></td>
        <td>${pct1(share)}<span class="ov-bar"><i style="width:${(share * 100).toFixed(1)}%;background:${col}"></i></span></td>
        <td><span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(sub || '')}|orders">${fmt(t.ord)}</span></td>
        <td>${isBulkChannel(ch) ? '<span style="color:var(--text3);" title="ตัวแทน / MT สั่งลอตใหญ่ ไม่คิด AOV">—</span>' : (t.ord ? fmt(t.rev / t.ord) : '—')}</td>
        <td class="${k.cls}">${k.t}</td><td>${cancCell(ch, sub, t.cr, t.co, t.rev)}</td></tr>`;
      if (canOpen) subs.forEach(s => { const sr = g.subs[s], st = tot(sr), sk = cmpOf(ch, s === '(ไม่ระบุ)' ? null : s), sh = total.rev ? st.rev / total.rev : 0, sname = s === '(ไม่ระบุ)' ? '' : s;
        h += `<tr class="ov-sub pg-child" data-ovp="${esc(ch)}" style="${open ? '' : 'display:none;'}"><td title="${esc(s)}">${esc(s)}</td>
          <td><span class="pl-trace" data-tsales="${esc(ch)}|${from}|${to}||${esc(sname)}">${fmt(st.rev)}</span></td><td>${pct1(sh)}</td>
          <td>${fmt(st.ord)}</td><td>${isBulkChannel(ch) ? '—' : (st.ord ? fmt(st.rev / st.ord) : '—')}</td>
          <td class="${sk.cls}">${sk.t}</td><td>${cancCell(ch, sname, st.cr, st.co, st.rev)}</td></tr>`; });
    });
    return h;
  }

  // ===== หน้า =====
  window.renderSalesOverview = async function (o) {
    injectCss();
    const { root, from, to, ch, sub, page } = o;
    const seq = (window.renderSalesOverview._seq = (window.renderSalesOverview._seq || 0) + 1);
    const alive = () => seq === window.renderSalesOverview._seq && currentPage === page;
    if (!root.querySelector('.ov')) root.innerHTML = `<div class="ov">
      <section class="ui-metrics" id="ovTiles" aria-label="ตัวเลขหลัก"><div class="empty" style="padding:22px;">กำลังโหลด...</div></section>
      <div class="ov-card"><div class="ov-head"><div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;"><h2>แนวโน้ม<span id="ovGrain">รายวัน</span></h2>
        <div class="ov-seg" role="group" aria-label="มุมมองกราฟ"><button type="button" data-ovmode="metric">ตัวเลขที่เลือก</button><button type="button" data-ovmode="channel">แยกช่องทาง</button></div></div>
        <div class="ov-leg" id="ovLegend"></div></div><div class="ov-chart"><canvas id="ovChart"></canvas></div></div>
      <div class="ov-card" style="padding:16px 0 4px;"><div class="ov-head" style="padding:0 18px;"><h2>แยกตามช่องทาง</h2><button class="btn btn-ghost" type="button" onclick="exportTable('ovTbl')">⬇ Export</button></div>
        <div style="overflow-x:auto;"><table class="ov-tbl" id="ovTbl" data-no-page><thead><tr>
          <th>ช่องทาง</th><th>ยอดขาย</th><th title="ยอดขายของแถว ÷ ยอดรวมทุกช่องทาง">สัดส่วน</th><th>ออเดอร์</th>
          <th title="ยอดขาย ÷ ออเดอร์ · ตัวแทน / MT ไม่คิด">AOV</th><th id="ovCmpTh">เทียบช่วงก่อน</th><th>ยกเลิก / คืน</th></tr></thead>
          <tbody id="ovTbody"><tr><td colspan="7" class="empty">กำลังโหลด...</td></tr></tbody></table></div></div></div>`;
    // ปุ่มต่าง ๆ ผูกครั้งเดียว
    if (!root._ovBound) {
      root._ovBound = true;
      root.addEventListener('click', e => {
        const t = e.target.closest('[data-ovk]');
        if (t && !e.target.closest('.ads-info-wrap')) { const k = t.dataset.ovk, sel = { ...S.sel, [k]: !S.sel[k] };
          if (Object.values(sel).some(Boolean)) { S.sel = sel; S.mode = 'metric'; t.classList.toggle('is-on', !!sel[k]); t.setAttribute('aria-pressed', !!sel[k]); syncSeg(); drawChart(); } return; }
        const m = e.target.closest('[data-ovmode]'); if (m) { S.mode = m.dataset.ovmode; syncSeg(); drawChart(); return; }
        const b = e.target.closest('.ov-ch[aria-expanded]'); if (b) { const tr = b.closest('tr'), ch = tr.dataset.ovch, open = b.getAttribute('aria-expanded') !== 'true';
          S.open[ch] = open; b.setAttribute('aria-expanded', open);
          root.querySelectorAll('tr.ov-sub').forEach(r => { if (r.dataset.ovp === ch) r.style.display = open ? '' : 'none'; }); }
      });
    }
    function syncSeg() { root.querySelectorAll('[data-ovmode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.ovmode === S.mode)); }
    syncSeg();

    try { await ensureSalesSummary(from, to, () => { if (alive()) window.renderSalesOverview(o); }); }
    catch (e) { if (window.showError) showError('โหลดยอดขายไม่สำเร็จ: ' + e.message); return; }
    if (!alive()) return;
    await ensureSalesDone();
    if (!alive()) return;

    const rowsAll = salesRows(from, to, ch, sub), total = tot(rowsAll);
    const R = cmpRange(from, to, ch), P = cancelPending(to, ch);
    noteSalesStatus(page, R, P);
    const cC = R.none ? null : tot(salesRows(R.cf, R.ct, ch, sub)), cP = R.none ? null : tot(salesRows(R.pf, R.pt, ch, sub));
    const badge = (a, b) => { if (R.none) return `<span title="${esc(R.tip)}">—</span>`; const x = cmpBadge(a, b, R.tip); return `<span class="${x.cls}" title="${esc(x.tip || '')}">${x.text}</span> vs ช่วงก่อน`; };
    const custOk = !ch || ch === 'Facebook';
    const vals = { rev: fmt(total.rev), ord: fmt(total.ord), aov: total.aov ? fmt(total.aov) : '—', cust: custOk ? '…' : '—', canc: fmt(total.cr) };
    const deltas = { rev: badge(cC && cC.rev, cP && cP.rev), ord: badge(cC && cC.ord, cP && cP.ord), aov: badge(cC && cC.aov, cP && cP.aov),
      cust: custOk ? '' : '<span title="ช่องทางนี้ไม่ส่งเบอร์โทรจริงมา">นับได้เฉพาะ Facebook</span>',
      canc: `${pct1(total.cpct)} ของยอดก่อนตัดออก${P ? ` · <span class="ov-pend">ยังไม่รวม ${P.chs.join(' / ')} ${P.mon}</span>` : ''}` };
    const totCmp = (() => { if (R.none || !cP || !cP.rev) return { t: '—', cls: '' }; const v = (cC.rev - cP.rev) / cP.rev * 100; return { t: (v >= 0 ? '▲ ' : '▼ ') + Math.abs(v).toFixed(1) + '%', cls: v >= 0 ? 'ov-up' : 'ov-down' }; })();
    document.getElementById('ovTiles').innerHTML = tilesHtml({ vals, deltas });
    const th = document.getElementById('ovCmpTh'); if (th) th.title = R.tip || '';
    document.getElementById('ovTbody').innerHTML = rowsAll.length ? tableHtml({ from, to, ch, sub, R, P, rowsAll, total, totCmp }) : '<tr><td colspan="7" class="empty">ไม่มียอดขายในช่วงนี้</td></tr>';

    // กราฟ: รายวัน (≤ 1 เดือน) / รายเดือน · เส้นประหลังวันที่ยอดเข้าครบล่าสุด · เส้นประจาง = ช่วงก่อนที่ยาวเท่ากัน (เฉพาะรายวัน)
    const B = buckets(from, to);
    document.getElementById('ovGrain').textContent = B.monthly ? 'รายเดือน' : 'รายวัน';
    const cur = series(rowsAll, B);
    // ช่วงที่ยอดยังเข้าไม่ครบ = เส้นประ: รายวัน = หลังวันที่ครบล่าสุด · รายเดือน = เดือนสุดท้าย (ยังไม่จบเดือน)
    const capIdx = !R.cut ? B.list.length : R.none ? -1 : B.monthly ? B.list.length - 2 : B.list.indexOf(R.ct);
    let prv = null, prevLbl = null;
    const showPrev = !B.monthly;
    if (showPrev) { const pr = getPrevPeriodRange(from, to);
      if (pr && pr.from) { const PB = { monthly: false, list: [], key: r => r.date }; let d = pr.from; while (d <= pr.to) { PB.list.push(d); d = dayAdd(d, 1); }
        prv = series(salesRows(pr.from, pr.to, ch, sub), PB); prevLbl = PB.list.map(dLbl); } }
    ctx = { B, cur, prv, cust: null, prvCust: null, capIdx, showPrev, prevLbl };
    drawChart();
    if (window.UI && UI.fit) UI.fit();

    // ลูกค้า Facebook: ยอดรวม (ไม่ซ้ำทั้งช่วง) + เส้นรายวัน / รายเดือน — ขึ้นทีหลังไม่บล็อกส่วนอื่น
    if (custOk) {
      try {
        const [n, nc, np, ser, pser] = await Promise.all([
          fetchUniqueCustomers(from, to, 'Facebook', sub),
          R.none ? null : fetchUniqueCustomers(R.cf, R.ct, 'Facebook', sub), R.none ? null : fetchUniqueCustomers(R.pf, R.pt, 'Facebook', sub),
          supaRpc('fb_customers_series', { p_from: from, p_to: to, p_sub: sub || null, p_month: B.monthly }),
          showPrev && ctx.prevLbl ? supaRpc('fb_customers_series', { p_from: getPrevPeriodRange(from, to).from, p_to: getPrevPeriodRange(from, to).to, p_sub: sub || null, p_month: false }) : null]);
        if (!alive()) return;
        const tile = document.querySelector('#ovTiles [data-ovk="cust"]');
        if (tile) { tile.querySelector('.ui-metric-v').textContent = fmt(n); tile.querySelector('.ui-metric-d').innerHTML = badge(nc, np); }
        const m = Object.fromEntries((ser || []).map(x => [x[0], x[1]]));
        ctx.cust = B.list.map((b, i) => i > ctx.capIdx ? null : (m[b] || 0));
        if (pser) { const pm = Object.fromEntries(pser.map(x => [x[0], x[1]])); const pr = getPrevPeriodRange(from, to); const pl = []; let d = pr.from; while (d <= pr.to) { pl.push(pm[d] || 0); d = dayAdd(d, 1); } ctx.prvCust = pl; }
        if (S.sel.cust) drawChart();
        if (window.UI && UI.fit) UI.fit();
      } catch (e) { const tile = document.querySelector('#ovTiles [data-ovk="cust"] .ui-metric-v'); if (tile) tile.textContent = '—'; console.warn('customers', e.message); }
    }
  };
})();
