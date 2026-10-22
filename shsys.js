// shsys.js (v20261022a) — หน้าภาพรวม Shopee › มุมมอง "ยอดตามระบบ Shopee" (ใช้ดู KPI / เทียบ Seller Centre › Business Insights)
// การ์ด · กราฟ · ตารางแยกร้าน (Mall / 24hr) พร้อมเป้า และค่า Ads — ที่มา RPC shopee_system_view(p_from, p_to)
//   ยอด = ออเดอร์ตามวันที่สั่ง รวมที่ยกเลิก / คืนทีหลัง (ไม่นับที่ระบบยกเลิกเพราะไม่จ่าย และ COD ที่ถูกยกเลิก) · อาจต่างจากหน้า Shopee ราว 0.3%
//   ตัดสินใจเรื่องเงินใช้มุมมอง "ยอดขายจริง" (แม่แบบ 1 · sales.js) เหมือนเดิม
(function () {
  'use strict';
  let _view = 'order', _seq = 0, _chart = null;
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => +v || 0;
  const n0 = v => Math.round(num(v)).toLocaleString('en-US');
  const pct = (a, b) => b > 0 ? (a / b * 100).toFixed(1) + '%' : '—';
  const tip = t => ` <span class="ui-i" data-tip="${esc(t)}">ⓘ</span>`;
  const dash = '<span style="color:var(--text3);">—</span>';
  const SHOP_C = { 'Shopee Mall': '#ee4d2d', 'Shopee 24hr': '#f59e0b' };
  const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const thDate = d => { const x = new Date(d + 'T00:00:00'); return x.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }); };

  function apply() {
    const ov = $('shhub-ov'); if (ov) ov.style.display = _view === 'system' ? 'none' : '';
    let g = $('shsys-ov');
    if (!g && ov) { g = document.createElement('div'); g.id = 'shsys-ov'; g.style.marginBottom = '20px'; ov.parentNode.insertBefore(g, ov); }
    if (g) g.style.display = _view === 'system' ? '' : 'none';
    if (typeof shViewMark === 'function') shViewMark(_view);
  }
  function setView(v, from, to) { _view = v === 'system' ? 'system' : 'order'; apply(); if (_view === 'system') render(from, to); }

  async function render(from, to) {
    apply(); if (_view !== 'system') return;
    const g = $('shsys-ov'); if (!g) return;
    const my = ++_seq;
    if (!g.innerHTML) g.innerHTML = '<div class="card"><div class="empty">กำลังโหลด...</div></div>'; else g.style.opacity = '.6';
    let D;
    try { D = await supaRpc('shopee_system_view', { p_from: from, p_to: to }, true); }
    catch (e) { if (my === _seq) { g.style.opacity = ''; g.innerHTML = `<div class="error-banner" style="display:block;">โหลดยอดตามระบบ Shopee ไม่สำเร็จ: ${esc(e.message)}</div>`; } return; }
    if (my !== _seq) return;
    g.style.opacity = '';
    const shops = D.shops || [], T = D.target || {}, TT = T.t || {};
    const tot = shops.reduce((a, s) => ({ gmv: a.gmv + num(s.gmv), orders: a.orders + num(s.orders), canc: a.canc + num(s.cancelled), ads: a.ads + num(s.ads), pc: a.pc + num(s.pads_cost), pg: a.pg + num(s.pads_gmv) }), { gmv: 0, orders: 0, canc: 0, ads: 0, pc: 0, pg: 0 });
    const capped = D.latest && D.to > D.latest;
    // เป้า: เดือนเดียว = เป้าจริงเดือนนั้น · % เทียบกับวันที่ผ่านไป (เลือกตั้งแต่วันที่ 1) · หลายเดือน = แผนของช่วง
    const monthMode = T.mode === 'month', mtd = monthMode && from.slice(8, 10) === '01';
    const dim = num(T.days_in_month) || 30, lt = T.latest;
    const pace = monthMode ? (lt && lt.slice(0, 7) === to.slice(0, 7) ? Math.min(+lt.slice(8, 10), dim) / dim : (lt && lt > to ? 1 : 0)) : 1;
    const colr = r => r >= pace ? 'var(--green, #16a34a)' : r >= pace * 0.9 ? '#c9851a' : 'var(--red, #dc2626)';
    const tgTot = Object.values(TT).reduce((a, v) => a + num(v), 0);
    const tCell = (tg, act, bold) => {
      if (!(tg > 0)) return `<td>${dash}</td>`;
      const p = (mtd || !monthMode) && pace > 0 ? `<div style="font-size:11px;font-weight:700;color:${colr(act / tg)};">${(act / tg * 100).toFixed(1)}%</div>` : '';
      return `<td>${bold ? '<b>' + n0(tg) + '</b>' : n0(tg)}${p}</td>`;
    };
    const tLabel = monthMode ? `เป้า ${MS[+String(T.month).slice(5, 7) - 1]}` : 'เป้า (ช่วงที่เลือก)';
    const tile = (l, v, d, t) => `<div class="ui-metric is-static"><span class="ui-metric-l">${l}${t ? tip(t) : ''}</span><span class="ui-metric-v" data-fit>${v}</span><span class="ui-metric-d">${d || '&nbsp;'}</span></div>`;
    let h = `<div class="ov"><section class="ui-metrics">`
      + tile('ยอดขาย (ระบบ Shopee)', n0(tot.gmv), capped ? `ข้อมูลถึง ${thDate(D.latest)}` : 'ตามระบบ Shopee', 'ยอดขายแบบหน้า Seller Centre › Business Insights: ออเดอร์ตามวันที่สั่ง รวมที่ยกเลิก / คืนทีหลัง\nไม่นับออเดอร์ที่ระบบยกเลิกเพราะไม่จ่าย และ COD ที่ถูกยกเลิก · อาจต่างจากหน้า Shopee ราว 0.3%\nนับถึงเมื่อวาน (วันที่ครบ)')
      + tile('คำสั่งซื้อ', n0(tot.orders), '', 'จำนวนคำสั่งซื้อแบบเดียวกับหน้า Business Insights')
      + tile('คำสั่งซื้อที่ยกเลิก', n0(tot.canc), tot.orders ? pct(tot.canc, tot.orders) + ' ของคำสั่งซื้อ' : '', 'คำสั่งซื้อที่นับในยอด แต่ถูกยกเลิกทีหลัง')
      + tile('ค่า Ads', tot.ads ? n0(tot.ads) : '—', tot.ads && tot.gmv ? pct(tot.ads, tot.gmv) + ' ของยอดขาย' : '', 'ค่า Ads Shopee ทั้งหมด (Product / Shop Ads · Meta ในแอป · CPAS · Brand · Live · เหรียญ) ถึงวันเดียวกับยอด')
      + tile('ROAS', tot.ads ? (tot.gmv / tot.ads).toFixed(2) + 'x' : '—', 'ยอดขาย ÷ ค่า Ads', 'ยอดขายตามระบบ ÷ ค่า Ads ทั้งหมด')
      + tile(tLabel, tgTot ? ((mtd || !monthMode) ? (tot.gmv / tgTot * 100).toFixed(1) + '%' : n0(tgTot)) : '—', tgTot ? ((mtd || !monthMode) ? 'ของเป้า ' + n0(tgTot) : '') : 'ยังไม่ได้ตั้งเป้า', 'เป้าจากหน้า Admin › ตั้งเป้ายอดขาย (ชุดเดียวกับหน้าเป้าหมาย KPI)\nเลือกเดือนเดียว = เป้าจริงเดือนนั้น (รวมส่วนที่ขาดยกมา) · หลายเดือน = แผนของช่วงนั้น')
      + `</section><div class="ov-card"><div class="ov-head"><div style="font-weight:700;font-size:15px;">แนวโน้มยอดขาย (ระบบ Shopee)</div><div style="margin-left:auto;font-size:11.5px;color:var(--text2);"><span style="display:inline-block;width:14px;height:3px;background:#b8862f;border-radius:2px;vertical-align:middle;margin-right:5px;"></span>ยอดขาย<span style="display:inline-block;width:14px;height:3px;background:#dc2626;border-radius:2px;vertical-align:middle;margin:0 5px 0 12px;"></span>ค่า Ads</div></div><div class="ov-chart"><canvas id="shsysChart"></canvas></div></div></div>`;
    // ตารางแยกร้าน
    const head = `<tr><th class="l">ร้าน</th><th>${tLabel}${tip('เป้าจากหน้า Admin › ตั้งเป้ายอดขาย · % ใต้ตัวเลข = ยอดขาย ÷ เป้า · สีเทียบกับจำนวนวันที่ผ่านไป: เขียว ทัน · ส้ม ช้าไม่เกิน 10% · แดง ช้ามาก')}</th><th>ยอดขาย${tip('ยอดขายตามระบบ Shopee (รวมยกเลิก / คืนทีหลัง)')}</th><th>คำสั่งซื้อ</th><th>ยกเลิก</th><th>สัดส่วน</th>`
      + `<th class="tt-gl tt-ad">ค่า Ads</th><th class="tt-ad">ROAS${tip('ยอดขายตามระบบ ÷ ค่า Ads ทั้งหมด')}</th><th class="tt-ad">%Ads</th><th class="tt-gl tt-ad">ยอดขายจาก Ads (Shopee)${tip('ยอดขายที่ Shopee นับว่ามาจาก Product / Shop Ads (แบบกว้าง) — ตัวเลขเดียวกับหน้า Shopee Ads')}</th><th class="tt-ad">ROI (Shopee)${tip('ยอดขายจาก Ads (Shopee) ÷ ค่า Product / Shop Ads')}</th></tr>`;
    const row = (name, color, tg, s, sum) => `<tr${sum ? ' class="ui-sum"' : ''}><td class="l">${color ? `<span class="tt-dot" style="background:${color}"></span>` : ''}${esc(name)}</td>${tCell(tg, num(s.gmv), sum)}<td><b>${n0(s.gmv)}</b></td><td>${n0(s.orders)}</td>`
      + `<td>${n0(s.canc)} <span style="color:var(--text3);font-size:11px;">(${pct(num(s.canc), num(s.orders))})</span></td><td>${sum ? '100%' : pct(num(s.gmv), tot.gmv)}</td>`
      + `<td class="tt-gl">${s.ads ? n0(s.ads) : dash}</td><td>${s.ads ? (num(s.gmv) / num(s.ads)).toFixed(2) + 'x' : dash}</td><td>${s.ads ? pct(num(s.ads), num(s.gmv)) : dash}</td>`
      + `<td class="tt-gl">${s.pg ? n0(s.pg) : dash}</td><td>${s.pc ? (num(s.pg) / num(s.pc)).toFixed(2) + 'x' : dash}</td></tr>`;
    let body = shops.map(s => row(s.sub_channel, SHOP_C[s.sub_channel] || '#94a3b8', num(TT[s.sub_channel]), { gmv: s.gmv, orders: s.orders, canc: s.cancelled, ads: s.ads, pg: s.pads_gmv, pc: s.pads_cost }, false)).join('');
    body += row('รวม', '', tgTot, { gmv: tot.gmv, orders: tot.orders, canc: tot.canc, ads: tot.ads, pg: tot.pg, pc: tot.pc }, true);
    h += `<div class="card" style="margin-top:16px;"><div class="section-header"><div class="section-title">ยอดขายตามระบบ Shopee แยกร้าน${tip('ใช้ดู KPI / เทียบกับ Seller Centre › Business Insights · ตัดสินใจเรื่องเงินใช้มุมมอง "ยอดขายจริง"')}</div></div>
      <div class="table-wrap"><table id="tblShSys" class="tt-oc" data-no-sort data-no-page><thead>${head}</thead><tbody>${shops.length ? body : '<tr><td colspan="11" class="empty">ไม่มีข้อมูล</td></tr>'}</tbody></table></div>
      <div style="font-size:11.5px;color:var(--text3);margin-top:10px;">ใช้ดู KPI / เทียบกับ Seller Centre (รวมออเดอร์ที่ยกเลิก / คืนทีหลัง) · อาจต่างจากหน้า Shopee ราว 0.3% · ตัดสินใจเรื่องเงินใช้มุมมอง "ยอดขายจริง"</div></div>`;
    g.innerHTML = h;
    if (window.UI && UI.fit) UI.fit();
    drawChart(D, from, to);
  }

  function drawChart(D, from, to) {
    const cv = $('shsysChart'); if (!cv || !window.Chart) return;
    const daily = (D.daily || []).map(x => ({ d: x.d, g: num(x.gmv), a: num(x.ads) }));
    const multi = from.slice(0, 7) !== to.slice(0, 7) && daily.length > 31;   // ช่วงเกิน 1 เดือน = รายเดือน
    const key = d => multi ? d.slice(0, 7) : d;
    const keys = [...new Set(daily.map(x => key(x.d)))], gm = {}, am = {};
    daily.forEach(x => { const k = key(x.d); gm[k] = (gm[k] || 0) + x.g; am[k] = (am[k] || 0) + x.a; });
    const lbl = k => multi ? `${MS[+k.slice(5, 7) - 1]} ${(+k.slice(0, 4) + 543) % 100}` : `${+k.slice(8, 10)} ${MS[+k.slice(5, 7) - 1]}`;
    if (_chart) { try { _chart.destroy(); } catch (e) {} }
    const tx = getComputedStyle(document.body).getPropertyValue('--text3') || '#9ca3af';
    _chart = new Chart(cv, { type: 'line', data: { labels: keys.map(lbl), datasets: [
        { label: 'ยอดขาย', data: keys.map(k => Math.round(gm[k] || 0)), borderColor: '#b8862f', backgroundColor: 'transparent', tension: .35, pointRadius: 0, borderWidth: 2.2, yAxisID: 'y' },
        { label: 'ค่า Ads', data: keys.map(k => Math.round(am[k] || 0)), borderColor: '#dc2626', backgroundColor: 'transparent', tension: .35, pointRadius: 0, borderWidth: 2.2, yAxisID: 'y1' }] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { itemSort: (a, b) => b.raw - a.raw, callbacks: { label: c => ` ${c.dataset.label}  ${n0(c.raw)}` } } },
        scales: { x: { grid: { display: false }, ticks: { color: tx, font: { family: 'Sarabun', size: 11 } } }, y: { display: false, beginAtZero: true }, y1: { display: false, beginAtZero: true, position: 'right' } } } });
  }

  window.shSys = { setView, render, apply, getView: () => _view };
})();
