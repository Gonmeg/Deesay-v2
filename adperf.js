// adperf.js (2026-11-10) — หน้า Ad Performance แบบ C (ย้ายออกจาก dashboard.html)
// ข้อมูล: RPC adperf_page — Supabase สรุปให้ทั้งหน้า (เดิมโหลดค่า Ads ทุกแถวตั้งแต่ 2025 + ยอดขายมาคิดในเครื่อง)
//   ช่องทางที่มี Ads ของตัวเอง: TikTok · Facebook (รวมบัญชี PR) · Shopee (รวม CPAS / Brand / Live / Meta in-app / Coins) · Lazada
//   ไม่นับตัวแทน / Modern Trade (ไม่มี Ads ของตัวเอง) — ยอดขาย = sales_summary · ค่า Ads = mv_ad_spend_daily (แหล่งเดียวกับทุกหน้า)
// หน้าตา: การ์ด 4 ใบ + ป้ายเทียบช่วงก่อนหน้าที่ยาวเท่ากัน → กราฟยอดขาย vs ค่า Ads (makeAdChart สไตล์เดียวกับหน้าอื่น) → ตารางรายช่องทาง
//   กดแถวช่องทาง = กราฟเปลี่ยนเป็นช่องทางนั้น (กดซ้ำ = ทุกช่องทาง) · ▸ = กางร้าน / เพจ / ประเภท Ads ในแถวนั้น
//   ช่วงไม่เกิน 1 เดือน = รายวัน · เกิน = รายเดือน · วันท้ายที่ยอดขายยังไม่เข้า → ปุ่มสถานะข้อมูล (ไม่ขึ้นคำเตือนในหน้า)
(function () {
  'use strict';
  const CHS = ['TikTok', 'Facebook', 'Shopee', 'Lazada'];
  const CV = { TikTok: '--ch-tiktok', Facebook: '--ch-facebook', Shopee: '--ch-shopee', Lazada: '--ch-lazada' };
  const $ = id => document.getElementById(id);
  const num = v => +v || 0;
  const n0 = v => fmt(Math.round(num(v)));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const info = (id, html) => typeof fbeInfoIcon === 'function' ? fbeInfoIcon(id, html) : '';
  const xx = (a, b) => b > 0 && a > 0 ? (a / b).toFixed(2) + 'x' : '—';
  const pc = (a, b) => b > 0 ? (a / b * 100).toFixed(1) + '%' : '—';
  const chip = (a, b, good) => { if (!(b > 0) || !isFinite(a)) return ''; const v = (a - b) / b * 100, cls = Math.abs(v) < 3 || !good ? '' : (good === 'up' ? v > 0 : v < 0) ? 'up' : 'dn';
    return `<span class="ui-chip ${cls}">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%</span>`; };
  const chipPt = (a, b) => { if (!isFinite(a) || !isFinite(b)) return ''; const v = a - b; return `<span class="ui-chip ${Math.abs(v) < 0.3 ? '' : v < 0 ? 'up' : 'dn'}">${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)} pt</span>`; };   // %Ads ลดลง = ดีขึ้น
  const subName = (ch, s) => !s ? 'ไม่ระบุ' : String(s).replace(/^\d+\.\s*(FB|Line)\s*-\s*[A-Z]\s*-\s*/i, '').replace(/^\d+\.\s*/, '');
  // (2026-11-10) ช่วงก่อน: เลือกเต็มเดือน → เดือนก่อนหน้าเต็มเดือน (แบบแนวโน้มสินค้า / MKT Tracking) · ช่วงอื่น → จำนวนวันเท่ากันถอยหลัง (getPrevPeriodRange)
  const prevRange = (from, to) => {
    const f = new Date(from + 'T00:00:00'), t = new Date(to + 'T00:00:00'), nx = new Date(t); nx.setDate(t.getDate() + 1);
    if (f.getDate() === 1 && nx.getDate() === 1) { const n = (t.getFullYear() - f.getFullYear()) * 12 + t.getMonth() - f.getMonth() + 1;
      return { from: fmtDateISO(new Date(f.getFullYear(), f.getMonth() - n, 1)), to: fmtDateISO(new Date(f.getFullYear(), f.getMonth(), 0)), label: n === 1 ? 'เดือนก่อน' : 'ช่วงก่อน' }; }
    const p = getPrevPeriodRange(from, to); return { from: p.from, to: p.to, label: 'ช่วงก่อน' };
  };
  let D = null, KEY = null, seq = 0, selCh = null;
  const open = new Set();

  function injectCss() {
    if ($('ap-css')) return;
    const s = document.createElement('style'); s.id = 'ap-css';
    s.textContent = `
.ap{display:flex;flex-direction:column;gap:16px}
.ap .ui-metrics{grid-template-columns:repeat(4,minmax(0,1fr));border:1.5px solid transparent;background:var(--hero,var(--bg2)) padding-box,var(--hero-line,var(--border)) border-box;box-shadow:var(--sh,none);border-radius:14px}
.ap .ui-metric{background:transparent;box-shadow:1px 0 0 var(--border);padding:14px 18px 15px}
body.light-theme .ap .ui-metric{box-shadow:1px 0 0 #EDF0F4}
.ap .ui-metric:last-child{box-shadow:none}
.ap .ui-metric-v{font-size:clamp(22px,2vw,30px)}
.ap .ui-metric-d{margin-top:6px;font-size:12.5px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:flex;align-items:center;gap:6px}
.ap-card{background:var(--bg2);border:1px solid var(--panel-line,var(--border));border-radius:var(--r-md,12px);padding:16px 18px;box-shadow:var(--sh,none);min-width:0}
.ap-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;margin-bottom:10px}
.ap-head h2{margin:0;font-size:15px;font-weight:700;display:flex;align-items:center;gap:6px}
.ap-sub{font-size:12.5px;color:var(--text3);font-weight:400}
.ap-clear{font-size:12.5px;color:var(--accent);cursor:pointer;background:none;border:0;font-family:inherit;padding:0}
.ap-tbl{width:100%;font-variant-numeric:tabular-nums}
.ap-tbl td,.ap-tbl th{white-space:nowrap}
.ap-tbl tr.ap-ch{cursor:pointer}
.ap-tbl tr.ap-ch.on td{background:var(--accent-soft,rgba(200,169,110,.12))}
.ap-tbl tr.ap-sub td{background:var(--bg3);font-size:12.5px;color:var(--text2)}
.ap-tbl tr.ap-sub td:first-child{padding-left:38px}
.ap-dot{display:inline-block;width:9px;height:9px;border-radius:3px;margin-right:8px;vertical-align:middle}
.ap-car{display:inline-block;width:18px;color:var(--text3);font-size:11px;cursor:pointer}
.ap-tbl .sm{display:block;font-size:12px;color:var(--text3);font-weight:400}
.ap-tbl td.num .ui-chip{margin-left:6px}
@media (max-width:1100px){.ap .ui-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}`;
    document.head.appendChild(s);
  }

  function shell(root) {
    const tile = (k, l, tip) => `<div class="ui-metric is-static" data-k="${k}"><span class="ui-metric-l">${l}${tip ? info('ap-i-' + k, tip) : ''}</span><span class="ui-metric-v" data-fit>—</span><span class="ui-metric-d">&nbsp;</span></div>`;
    root.innerHTML = `<div class="ap">
      <section class="ui-metrics" id="apTiles" aria-label="ตัวเลขหลัก">
        ${tile('gmv', 'ยอดขาย', 'ยอดขายของช่องทางที่ยิง Ads เอง: TikTok · Facebook (รวม Line) · Shopee · Lazada<br>ไม่นับตัวแทน / Modern Trade (ไม่มี Ads ของตัวเอง) · ยอดขายรวม VAT ไม่รวมยกเลิก / คืน (ชุดเดียวกับหน้าภาพรวมยอดขาย)<br>ป้าย = เทียบช่วงก่อนหน้าที่ยาวเท่ากัน')}
        ${tile('ads', 'ค่า Ads', 'ค่า Ads จริงของ 4 ช่องทาง ไม่รวม VAT (ชุดเดียวกับหน้าภาพรวม / MKT Tracking)<br>Facebook รวมบัญชี PR (KOL / boost) · Shopee รวม CPAS / Brand / Live / Meta in-app / Coins<br>ไม่รวมค่าจ้าง KOL (ดูที่หน้า KOL / MKT Tracking)')}
        ${tile('roas', 'ROAS', '<b>ROAS · Return on Ad Spend</b><br>ยอดขาย ÷ ค่า Ads · ลง Ads 1 บาท ได้ยอดขายกี่บาท')}
        ${tile('pct', '% ค่า Ads', 'ค่า Ads ÷ ยอดขาย · ยิ่งต่ำยิ่งดี<br>ป้าย = เปลี่ยนกี่ pt (จุด %) จากช่วงก่อน · ลดลง = สีเขียว')}
      </section>
      <div class="ap-card"><div class="ap-head"><h2 id="apChartTtl">ยอดขาย vs ค่า Ads</h2><span id="apChartR"></span></div>
        <div style="position:relative;height:280px;"><canvas id="apChart"></canvas></div></div>
      <div class="ap-card" style="padding:16px 0 6px;"><div class="ap-head" style="padding:0 18px;"><h2>แยกช่องทาง ${info('ap-i-tbl', 'กดแถว = กราฟด้านบนเปลี่ยนเป็นช่องทางนั้น (กดซ้ำ = ทุกช่องทาง)<br>▸ = ดูร้าน / เพจ / ประเภท Ads ในช่องทาง · แถวที่มีแต่ค่า Ads = Ads ที่ไม่ผูกร้าน / เพจ<br>ROAS = ยอดขาย ÷ ค่า Ads · % ค่า Ads = ค่า Ads ÷ ยอดขาย · ป้าย = เทียบช่วงก่อนหน้าที่ยาวเท่ากัน')} <span class="ap-sub" id="apRange"></span></h2></div>
        <table class="ui-table ap-tbl" data-no-sort data-no-page><thead><tr><th>ช่องทาง</th><th class="num">ยอดขาย</th><th class="num">ค่า Ads</th><th class="num">ROAS</th><th class="num">% ค่า Ads</th></tr></thead>
          <tbody id="apBody">${CHS.map(() => '<tr><td colspan="5">&nbsp;</td></tr>').join('')}</tbody><tfoot id="apFoot"><tr><td colspan="5">&nbsp;</td></tr></tfoot></table></div>
    </div>`;
    root.addEventListener('click', e => {
      if (e.target.closest('.ap-clear')) { selCh = null; drawAll(); return; }
      const car = e.target.closest('.ap-car'); if (car) { const c = car.dataset.ch; open.has(c) ? open.delete(c) : open.add(c); drawTable(); return; }
      const tr = e.target.closest('tr.ap-ch'); if (tr && !e.target.closest('.ads-info-wrap')) { selCh = selCh === tr.dataset.ch ? null : tr.dataset.ch; drawAll(); }
    });
  }

  // ยอดรวมรายช่องทาง (ช่วงนี้)
  function totals() {
    const t = {}; CHS.forEach(c => t[c] = { gmv: 0, ads: 0 });
    (D.daily || []).forEach(r => { if (t[r.ch]) { t[r.ch].gmv += num(r.gmv); t[r.ch].ads += num(r.ads); } });
    return t;
  }
  const sum = (o, k) => Object.values(o).reduce((s, x) => s + num(x[k]), 0);

  function drawTiles() {
    const T = totals(), P = D.prev || {}, g = sum(T, 'gmv'), a = sum(T, 'ads'), pg = sum(P, 'gmv'), pa = sum(P, 'ads');
    const lbl = D.prevLbl;
    const set = (k, v, d) => { const el = $('apTiles').querySelector(`[data-k="${k}"]`); el.querySelector('.ui-metric-v').textContent = v; el.querySelector('.ui-metric-d').innerHTML = d; };
    set('gmv', n0(g), `${chip(g, pg, 'up')}<span>${pg ? `${lbl} ${n0(pg)}` : ''}</span>`);
    set('ads', n0(a), `${chip(a, pa)}<span>${pa ? `${lbl} ${n0(pa)}` : ''}</span>`);
    set('roas', xx(g, a), `${a && pa ? chip(g / a, pg / pa, 'up') : ''}<span>${pa ? `ก่อน ${xx(pg, pa)}` : ''}</span>`);
    set('pct', pc(a, g), `${g && pg ? chipPt(a / g * 100, pa / pg * 100) : ''}<span>${pg ? `ก่อน ${pc(pa, pg)}` : ''}</span>`);
  }

  function drawChart() {
    const days = Math.round((new Date(D.to) - new Date(D.from)) / 864e5) + 1, monthly = days > 31;
    const m = {};
    (D.daily || []).forEach(r => { if (selCh && r.ch !== selCh) return; const k = monthly ? String(r.d).slice(0, 7) : String(r.d).slice(0, 10); const o = (m[k] = m[k] || { gmv: 0, ads: 0 }); o.gmv += num(r.gmv); o.ads += num(r.ads); });
    const keys = Object.keys(m).sort();
    const labels = keys.map(k => monthly ? PL_TH_M(k) : k.slice(8, 10) + '/' + k.slice(5, 7));
    const g = keys.map(k => m[k].gmv), a = keys.map(k => m[k].ads), p = keys.map(k => m[k].gmv > 0 ? m[k].ads / m[k].gmv * 100 : 0);
    $('apChartTtl').innerHTML = `ยอดขาย vs ค่า Ads ${monthly ? 'รายเดือน' : 'รายวัน'}${selCh ? ` · <span style="color:var(${CV[selCh]})">${esc(selCh)}</span>` : ' · ทุกช่องทาง'} ${info('ap-i-chart', 'แท่ง = ยอดขาย / ค่า Ads · เส้น = % ค่า Ads (แกนขวา)<br>ช่วงไม่เกิน 1 เดือน = รายวัน · เกิน 1 เดือน = รายเดือน<br>วันท้ายที่มีค่า Ads แต่ยอดขายยังไม่เข้า จะไม่แสดง (กัน % ค่า Ads พุ่งผิดปกติ)<br>กดแถวในตารางด้านล่างเพื่อดูทีละช่องทาง')}`;
    $('apChartR').innerHTML = selCh ? '<button type="button" class="ap-clear">ดูทุกช่องทาง</button>' : '';
    if (typeof makeAdChart === 'function') makeAdChart('apChart', labels, g, a, p, { daily: !monthly });
  }

  function drawTable() {
    const T = totals(), P = D.prev || {}, subs = D.subs || [];
    const rows = CHS.filter(c => T[c].gmv || T[c].ads).sort((x, y) => T[y].gmv - T[x].gmv);
    const roasCell = (g, a, pg, pa) => `${xx(g, a)}${a && pa && pg ? chip(g / a, pg / pa, 'up') : ''}${pa && pg ? `<span class="sm">ก่อน ${xx(pg, pa)}</span>` : ''}`;
    const pctCell = (g, a, pg, pa) => `${pc(a, g)}${g && pg ? chipPt(a / g * 100, pa / pg * 100) : ''}${pg ? `<span class="sm">ก่อน ${pc(pa, pg)}</span>` : ''}`;
    $('apBody').innerHTML = rows.map(c => {
      const t = T[c], p = P[c] || {}, ss = subs.filter(s => s.ch === c), isOpen = open.has(c);
      const main = `<tr class="ap-ch${selCh === c ? ' on' : ''}" data-ch="${esc(c)}"><td>${ss.length > 1 ? `<span class="ap-car" data-ch="${esc(c)}">${isOpen ? '▾' : '▸'}</span>` : '<span class="ap-car"></span>'}<span class="ap-dot" style="background:var(${CV[c]})"></span><b>${esc(c)}</b></td>
        <td class="num"><b>${n0(t.gmv)}</b>${chip(t.gmv, num(p.gmv), 'up')}</td><td class="num">${n0(t.ads)}</td>
        <td class="num">${roasCell(t.gmv, t.ads, num(p.gmv), num(p.ads))}</td><td class="num">${pctCell(t.gmv, t.ads, num(p.gmv), num(p.ads))}</td></tr>`;
      const sub = isOpen ? ss.map(s => `<tr class="ap-sub"><td>${esc(subName(c, s.sub))}</td><td class="num">${num(s.gmv) ? n0(s.gmv) : '—'}</td><td class="num">${num(s.ads) ? n0(s.ads) : '—'}</td><td class="num">${xx(num(s.gmv), num(s.ads))}</td><td class="num">${num(s.gmv) ? pc(num(s.ads), num(s.gmv)) : '—'}</td></tr>`).join('') : '';
      return main + sub;
    }).join('') || '<tr><td colspan="5" class="empty">ไม่มีข้อมูลในช่วงนี้</td></tr>';
    const g = sum(T, 'gmv'), a = sum(T, 'ads'), pg = sum(P, 'gmv'), pa = sum(P, 'ads');
    $('apFoot').innerHTML = rows.length ? `<tr><td><span class="ap-car"></span>รวม</td><td class="num">${n0(g)}${chip(g, pg, 'up')}</td><td class="num">${n0(a)}</td><td class="num">${roasCell(g, a, pg, pa)}</td><td class="num">${pctCell(g, a, pg, pa)}</td></tr>` : '';
  }

  function drawAll() {
    drawTiles(); drawChart(); drawTable();
    const r = D.from === D.to ? thShort(D.from) : `${thShort(D.from)} – ${thShort(D.to)}`;
    $('apRange').textContent = `${r} · เทียบ ${thShort(D.prev_from)} – ${thShort(D.prev_to)}`;
    // ยอดขายช่องทางไหนยังเข้าไม่ถึงวันสุดท้ายของช่วง → ปุ่มสถานะข้อมูล (บอกแค่ล่าสุดถึงวันไหน)
    if (window.pageNote) {
      const late = CHS.filter(c => D.last_sales && D.last_sales[c] && D.last_sales[c] < D.to && totals()[c].ads > 0).map(c => `${c} ล่าสุดถึง ${thShort(D.last_sales[c])}`);
      window.pageNote('adperf', 'apLate', late.length ? 'warn' : null, late.join(' · '), '');
    }
  }

  async function render() {
    injectCss();
    const root = $('adperf-root'); if (!root) return;
    if (!root.querySelector('.ap')) shell(root);
    const from = getDateValue('From'), to = getDateValue('To'), key = `${from}|${to}`;
    if (KEY === key && D) { drawAll(); return; }
    const my = ++seq;
    try {
      const pr = prevRange(from, to);
      const d = await supaRpc('adperf_page', { p_from: from, p_to: to, p_prev_from: pr.from, p_prev_to: pr.to });
      if (my !== seq) return;
      D = d; D.prevLbl = pr.label; KEY = key;
      drawAll();
    } catch (e) {
      if (my !== seq) return;
      $('apBody').innerHTML = `<tr><td colspan="5" class="empty">โหลดข้อมูลไม่สำเร็จ: ${esc(e.message)}</td></tr>`;
    }
  }

  window.adPerf = { render, reload: () => { KEY = null; return render(); } };
})();
