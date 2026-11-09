// supply.js v20261110a — หน้าตาชุดเดียวกับหน้าที่ปรับแล้ว: การ์ดสถานะเป็นแถบเดียว (ตัวเลขสีเดียว) · ⓘ ชี้แล้วขึ้น · บรรทัดเวลาอัปเดตไปอยู่ปุ่มสถานะข้อมูล
//   ตาราง: รหัสสีปกติ + ชื่อสินค้าอ่านง่าย · ABC-XYZ เป็นป้ายเล็ก · Days of cover ไม่มีแถบเล็ก · แนวโน้ม Avg/day สีเทา · ช่อง Forecast โปร่งจนกว่าจะชี้ / พิมพ์ · ลำดับเดิม (ตามรหัสแม่)
// supply.js v20261002a — ⓘ ABC × XYZ สั้นลง (ตัดส่วนอธิบายเหตุผลการออกแบบตาราง)
// supply.js — หน้า Supply Chain ของ dashboard.html (โหลดตอนกดเมนูครั้งแรกเท่านั้น)
// ใช้ของกลางจาก dashboard.html: supaRpc, fmtDateISO, chartTickColor/chartGridColor, Chart.js, CSS (.card/.section-header/.table-wrap/.btn/.ls-input)
// RPC: supply_chain_page() จาก 55_supply_rpc_v2.sql + supply_sku_series(p_sku, p_days) จาก 48_supply_rpc.sql
// v2 (2026-09-09): เพิ่มคอลัมน์รหัสแม่ + เรียงตามรหัสแม่ · สต็อกแยกรายคลัง (ปุ่มสลับ) · ตัดเรื่องเงิน/ต้นทุนออกทั้งหมด · เพิ่ม ⓘ อธิบายศัพท์ · หัวตารางเป็น Sarabun
(function () {
  const fmtN = (n, d = 0) => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toLocaleString('th-TH', { maximumFractionDigits: d, minimumFractionDigits: d });
  const dTH = d => {
    if (!d) return '—';
    const x = new Date(d + 'T00:00:00'); if (isNaN(x)) return '—';
    const sameYear = x.getFullYear() === new Date().getFullYear();
    return x.toLocaleDateString('en-GB', sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
  };
  // จำนวนวันยาวๆ อ่านยาก → บอกเป็นปี/เดือนเพิ่ม (เช่น 5,175 วัน ≈ 14 ปี)
  const daysHuman = n => n >= 730 ? `≈ ${Math.round(n / 365)} yr` : n >= 120 ? `≈ ${Math.round(n / 30)} mo` : '';
  const daysFrom = d => d ? Math.round((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000) : null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // การสั่งซื้อ — ต้องเปิด PO หรือยัง
  const ORDER = {
    stockout: ['var(--red)',    'ของหมด'],
    late:     ['var(--red)',    'สายแล้ว'],
    reorder:  ['var(--orange)', 'สั่งรอบนี้'],
    soon:     ['#fbbf24',       'สั่งเดือนนี้'],
    ok:       ['var(--green)',  'ยังไม่ต้องสั่ง'],
    no_need:  ['var(--text3)',  'ไม่มียอดขาย'],
    inactive: ['var(--text3)',  'เลิกผลิต / หยุดขาย'],
  };
  const STATUS = ORDER;
  const ABC_TXT = { A: 'ยอดขายหลัก (80%)', B: 'ยอดขายรอง (15%)', C: 'ยอดขายน้อย (5%)' };
  const XYZ_TXT = { X: 'ขายสม่ำเสมอ', Y: 'แกว่งปานกลาง', Z: 'แกว่งมาก' };
  const pill = (color, text) => `<span style="display:inline-block;font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:99px;background:color-mix(in srgb, ${color} 16%, transparent);border:1px solid color-mix(in srgb, ${color} 35%, transparent);color:${color};white-space:nowrap;">${text}</span>`;

  // ---------- กล่องอธิบายศัพท์ (ⓘ) ----------
  // วางไว้ที่หัวข้อการ์ดเท่านั้น ไม่วางในหัวตาราง เพราะกรอบเลื่อนของตารางจะบังกล่องจนอ่านไม่ได้
  window._supInfo = function (id) {
    document.querySelectorAll('.sup-info').forEach(e => { if (e.id !== id) e.style.display = 'none'; });
    const el = document.getElementById(id); if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
  };
  function infoIcon(id, html, align) {
    if (typeof fbeInfoIcon === 'function') return fbeInfoIcon(id, html);   // (2026-11-10) ⓘ แบบเดียวกับทั้งเว็บ (ชี้แล้วขึ้น)
    return `<span style="position:relative;display:inline-block;vertical-align:middle;">`
      + `<span onclick="window._supInfo('${id}')" style="cursor:pointer;color:var(--text3);font-size:13px;font-weight:400;font-family:'Sarabun',sans-serif;padding:0 4px;">&#9432;</span>`
      + `<div id="${id}" class="sup-info" style="display:none;position:absolute;top:24px;${align === 'right' ? 'right:0;' : 'left:0;'}background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-size:12.5px;line-height:1.8;width:380px;max-width:min(380px,82vw);z-index:200;box-shadow:0 6px 22px rgba(0,0,0,.45);color:var(--text2);font-weight:400;text-align:left;white-space:normal;font-family:'Sarabun',sans-serif;text-transform:none;letter-spacing:normal;">${html}</div></span>`;
  }
  const T = (a, b) => `<div style="margin-bottom:9px;"><b style="color:var(--text);">${a}</b><br>${b}</div>`;
  // (2026-09-29) เขียนใหม่ให้สั้นและตรงกับตารางปัจจุบัน (ของเดิมยังพูดถึง เผื่อ / เส้นตาย / แนะสั่ง / ROP ซึ่งไม่ได้ใช้แล้ว)
  const glossary = () => ''
    + T('Days of cover', '= ของที่มีตอนนี้ (ทุกคลัง + Hold โรงงาน) ÷ Avg/day · ยังไม่นับของที่กำลังผลิต<br>'
      + `<span style="color:var(--red);">แดง</span> = น้อยกว่า LT + ${REVIEW_DAYS} วัน (ถ้ารอประชุมรอบหน้าค่อยสั่ง ของใหม่มาไม่ทัน)<br>`
      + '<span style="color:var(--green);">เขียว</span> = ปกติ · <span style="color:#60a5fa;">ฟ้า</span> = เกิน 180 วัน (Overstock)')
    + T('LT · Order by', '<b>LT</b> (Lead time) = สั่งผลิตแล้วกี่วันของถึง ตั้งในหน้า สินค้า & ราคา<br><b>Order by</b> = วันที่ของหมด − LT = วันสุดท้ายที่สั่งแล้วของยังมาทัน (วันที่ของหมดนับ PO ตามวันที่ของถึงจริง)')
    + T(`Status · ประชุมทุก ${REVIEW_DAYS} วัน`, '🔴 <b>Order now</b> = Order by มาถึงก่อนประชุมรอบหน้า → เปิด PO รอบนี้<br>⚫ <b>Stockout risk</b> = ของหมดก่อน PO ล็อตถัดไปจะถึง<br>'
      + '🟡 <b>Next review</b> = ถึงคิวประชุมรอบหน้า<br>✅ <b>Planned</b> = กรอก Forecast แล้ว · Until = ขายได้ถึงวันไหน<br>🟢 <b>OK</b> = ยังไม่ต้องทำอะไร<br>'
      + '<b>No reorder</b> = การวางแผน "ดูเฉย ๆ" ในหน้า สินค้า & ราคา · <b>No sales</b> = 90 วันขายไม่ได้เลย')
    + T('Avg/day', 'ขายต่อวัน (จากยอดขาย)<br>วันปกติ: เฉลี่ย 7 วัน 50% · 30 วัน 30% · 90 วัน 20%<br>+ ออเดอร์ก้อนใหญ่ (ตัวแทน / ห้าง) เฉลี่ย 90 วัน นับครึ่งเดียว<br>ไม่นับวันก่อนเริ่มขาย และวันที่ของหมด<br>ตัวอักษรท้ายชื่อสินค้า เช่น AX = ABC-XYZ (ดู &#9432; ที่การ์ด ABC × XYZ)');
  const ABC_INFO = ''
    + T('ABC — ตัวนี้ทำเงินให้ร้านแค่ไหน', 'วิธีคิด: เอายอดขาย 90 วันของทุกตัวมาเรียงจากมากไปน้อย แล้วไล่บวกสะสม<br>• ตัวที่บวกกันได้ <b>80% แรก</b> ของยอดทั้งร้าน = <b>A</b><br>• ถัดมาจนถึง 95% = <b>B</b><br>• 5% สุดท้าย = <b>C</b><br><br>ตัวอย่าง ร้านขายได้ 100 บาท: ตัวที่ 1 ได้ 45 (สะสม 45%) → A · ตัวที่ 2 ได้ 25 (สะสม 70%) → A · ตัวที่ 3 ได้ 10 (สะสม 80%) → A · ตัวที่ 4 ได้ 8 (สะสม 88%) → B<br><br>อ่านว่า <b>A</b> = ตัวทำเงินหลัก ขาดไม่ได้ · <b>B</b> = ตัวรอง ขาดแล้วเจ็บบ้าง · <b>C</b> = ตัวหางยาว ขาดก็แทบไม่รู้สึก<br><br>⚠️ วัดจาก<b>เงิน</b> ไม่ใช่จำนวนชิ้น — ของแพงขายน้อยชิ้นอาจเป็น A ส่วนของถูกขายเยอะชิ้นอาจเป็น C')
    + T('XYZ — สั่งของยากแค่ไหน', 'วิธีคิด: เอายอดขายรายสัปดาห์ 12 สัปดาห์ล่าสุด ดูว่าแต่ละสัปดาห์ห่างจากค่าเฉลี่ยแค่ไหน แล้วเทียบเป็น %<br>• แกว่งน้อยกว่า 50% ของค่าเฉลี่ย = <b>X</b><br>• แกว่ง 50–100% = <b>Y</b><br>• แกว่งเกิน 100% = <b>Z</b><br><br>ตัวอย่าง ทั้งคู่ขายเฉลี่ยสัปดาห์ละ 100 ชิ้นเท่ากัน<br>ตัวแรก 95, 105, 98, 102 → <b>X</b> ทำนายง่าย<br>ตัวที่สอง 10, 300, 50, 240 → <b>Z</b> เดายาก (มักเป็นตัวที่ขายตัวแทนเป็นก้อน)<br><br>Z ต้องเผื่อของกันเหนียวมากกว่า X เพราะไม่รู้สัปดาห์หน้าจะขาย 10 หรือ 300')
    + T('อ่านคู่กัน — ส่วนที่ใช้จริง', '<b>AX</b> = ตัวทำเงินหลัก ขายนิ่ง → ของต้องมีตลอด แต่ไม่ต้องเผื่อเยอะ เพราะเดาถูก<br><b>AZ</b> = ตัวทำเงินหลักแต่เดายาก → <b>ตัวที่ต้องระวังที่สุด</b> ขาดแล้วเจ็บหนัก ต้องเผื่อมากสุด<br><b>CX</b> = ตัวเล็ก ขายนิ่ง → สั่งน้อย ๆ สม่ำเสมอ ไม่ต้องคิดมาก<br><b>CZ</b> = ตัวเล็ก เดายาก → <b>อย่าตุน</b> สั่งตามออเดอร์ เพราะขาดก็ไม่เจ็บ แต่ตุนแล้วจมแน่');

  let DATA = null, rows = [], filt = { status: '', abc: '', xyz: '', q: '' },
      sort = { key: 'parent_sku', dir: 1 }, showLoc = false, showHidden = false, collapseAll = false, collapsed = new Set(),
      selSku = null, chart = null, lastSeries = null, seq = 0;

  function root() { return document.getElementById('page-supply'); }
  function locList() { return (DATA && DATA.locations) ? DATA.locations : []; }

  async function load() {
    const el = root(); if (!el) return;
    const mySeq = ++seq;
    if (!DATA) el.innerHTML = '<div class="card"><div class="empty">กำลังโหลดแผนสต็อก...</div></div>';
    let data;
    try { data = await supaRpc('supply_chain_page', {}); await loadPlans(); }
    catch (e) { el.innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)} — ถ้าขึ้น "function not found" แปลว่ายังไม่ได้รัน 55_supply_rpc_v2.sql</div>`; return; }
    if (mySeq !== seq) return;
    if (data && data.message && !data.rows) { el.innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(data.message)}</div>`; return; }
    DATA = data; rows = data.rows || [];
    renderAll();
    if (selSku) loadSku(selSku);
  }

  // สถานะชุดเดียวกับคอลัมน์ Status (คำนวณในหน้า: สต็อกรวม Hold → WIP → forecast · รอบประชุม)
  const MEET_KEY = { 'Order now': 'order_now', 'Next review': 'next_review', 'Planned': 'planned', 'OK': 'ok' };
  function meetKey(r) {
    if (r.plan_mode !== 'plan') return null;
    const m = planCalc(r).meet[1];
    return m.indexOf('Stockout risk') === 0 ? 'risk' : (MEET_KEY[m] || null);
  }
  const coverAll = r => { const av = +r.avg_day || 0; return av > 0 ? Math.floor(stockAll(r) / av) : null; };
  function matchStatus(r) {
    if (!filt.status) return true;
    if (filt.status === 'act') return ['risk', 'order_now'].includes(statusKey(r));
    if (filt.status === 'noreorder') return statusKey(r) === 'watch';   // นับแบบเดียวกับการ์ด No reorder
    if (filt.status === 'nextrev') return statusKey(r) === 'next_review';
    if (filt.status === 'plannedx') return statusKey(r) === 'planned';
    if (filt.status === 'okx') return statusKey(r) === 'ok';
    if (['order_now', 'next_review', 'planned', 'risk', 'ok'].includes(filt.status)) return statusKey(r) === filt.status;   // ชุดเดียวกับการ์ดด้านบน + ปุ่มกรอง
    if (filt.status === 'need') return ['stockout', 'late', 'reorder'].includes(r.order_status);
    if (filt.status === 'hot') return r.plan_mode === 'plan' && r.trend_7_vs_30 > 0.3 && ['stockout', 'late', 'reorder'].includes(r.order_status);
    if (filt.status === 'stuck') { const c = coverAll(r); return c != null && c > 180; }
    if (filt.status === 'nosale') return (r.avg_day || 0) === 0 && stockAll(r) > 0;
    return r.order_status === filt.status;
  }
  function filtered() {
    const q = filt.q.trim().toLowerCase();
    let out = rows.filter(r => (showHidden || r.plan_mode !== 'hidden') && matchStatus(r) && (!filt.abc || r.abc === filt.abc) && (!filt.xyz || r.xyz === filt.xyz)
      && (!q || r.sku.toLowerCase().includes(q) || String(r.parent_sku || '').toLowerCase().includes(q) || String(r.product_name || '').toLowerCase().includes(q)));
    const k = sort.key;
    const sv = (r) => {
      switch (k) {
        case 'on_hand': return stockAll(r);
        case 'on_order': return wipQty(r.sku) || null;
        case 'cover_days': { const av = +r.avg_day || 0; return av > 0 ? Math.floor(stockAll(r) / av) : null; }
        case 'po_due_date': { if (r.plan_mode !== 'plan') return null; const c = planCalc(r); return c.orderBy ? iso(c.orderBy) : null; }
        case 'plan_qty': return (PLANS[r.sku] || {}).plan_qty || null;
        case 'plan_date': return (PLANS[r.sku] || {}).arrive_date || null;
        case 'plan_end': return URG[statusKey(r)] ?? 9;
        default: return r[k];
      }
    };
    out = [...out].sort((a, b) => {
      let x = sv(a), y = sv(b);
      if (k && k.indexOf('loc:') === 0) { const L = k.slice(4); x = (a.by_loc || {})[L] || 0; y = (b.by_loc || {})[L] || 0; }
      let c;
      if (x == null && y == null) c = 0;
      else if (x == null) c = 1;
      else if (y == null) c = -1;
      else c = (typeof x === 'number' ? x - y : String(x).localeCompare(String(y))) * sort.dir;
      return c !== 0 ? c : String(a.sku).localeCompare(String(b.sku));
    });
    return out;
  }

  function renderAll() {
    const d = DATA, k = d.kpi || {}, m = d.matrix || [];
    const ledgerAge = d.ledger_last ? -daysFrom(d.ledger_last) : null, salesAge = d.sales_last ? -daysFrom(d.sales_last) : null;
    const banners = [];
    // (2026-10-19) log ทีมแพ็ค / ยอดขายมีถึงวันไหน → Data Guard ที่ปุ่มสถานะ (Log สต็อกทีมแพ็ค · ออเดอร์ <ช่องทาง>) ที่เดียว ไม่ซ้ำที่นี่
    const urgent = rows.filter(r => meetKey(r) === 'risk' || (meetKey(r) === 'order_now' && planCalc(r).orderBy && planCalc(r).orderBy < toD(iso(new Date()))));
    if (urgent.length) banners.push(['var(--red)', `⛔ ${urgent.length} SKU ต้องรีบจัดการ (ของจะขาดก่อน WIP เข้า หรือเลยวันต้องเปิด PO แล้ว): ${urgent.slice(0, 10).map(r => `<b>${esc(r.sku)}</b>`).join(', ')}${urgent.length > 10 ? ' และอีก ' + (urgent.length - 10) : ''}`]);
    if (k.no_params > 0) banners.push(['var(--accent)', `🛠 ${k.no_params} SKU ยังไม่ได้ตั้ง lead time`]);

    // (2026-10-18) เตือนต่าง ๆ ย้ายไปปุ่มสถานะข้อมูลข้างชื่อหน้า (ที่เดียว) แทนแถบในหน้า
    if (window.pageNote) { for (let i = 0; i < 4; i++) window.pageNote('supply', 'b' + i, null); banners.forEach(([c, txt], i) => window.pageNote('supply', 'b' + i, c === 'var(--red)' ? 'bad' : 'warn', txt.replace(/^(⚠️|⛔|🛠)\s*/u, ''), '')); }
    // (2026-09-29) การ์ด + dropdown ใช้ตัวเลขชุดเดียวกัน (ครบทุกสถานะ) — ปุ่มกรองแถวนอกตารางเอาออกแล้ว
    const vis = rows.filter(r => showHidden || r.plan_mode !== 'hidden');
    const sc = {}; vis.forEach(r => { const k2 = statusKey(r); sc[k2] = (sc[k2] || 0) + 1; });
    const stuck = vis.filter(r => { const c = coverAll(r); return c != null && c > 180; });
    const noSale = vis.filter(r => (r.avg_day || 0) === 0 && stockAll(r) > 0);
    const sumQ = arr => arr.reduce((s2, r) => s2 + stockAll(r), 0);
    // [key, icon, ชื่อ, จำนวน, สี, คำอธิบายใต้การ์ด]
    const STATS = [
      ['order_now', '🔴', 'Order now', sc.order_now || 0, 'var(--red)', `ต้องเปิด PO ในประชุมรอบนี้ (${REVIEW_DAYS} วัน)`],
      ['risk', '⚫', 'Stockout risk', sc.risk || 0, 'var(--text)', 'ของหมดก่อนล็อตที่กำลังผลิตจะเข้า'],
      ['next_review', '🟡', 'Next review', sc.next_review || 0, '#d4a017', 'ถึงคิวตัดสินใจประชุมรอบหน้า'],
      ['planned', '✅', 'Planned', sc.planned || 0, 'var(--green)', 'กรอก Forecast ไว้แล้ว'],
      ['ok', '🟢', 'OK', sc.ok || 0, 'var(--text)', 'ยังไม่ต้องทำอะไร'],
      ['noreorder', '', 'No reorder', sc.watch || 0, 'var(--text2)', `ไม่สั่งผลิตอีก · ${fmtN(sumQ(vis.filter(r => statusKey(r) === 'watch')))} ชิ้น`],
      ['stuck', '🔵', 'Overstock', stuck.length, '#60a5fa', `พอขายเกิน 180 วัน · ${fmtN(sumQ(stuck))} ชิ้น`],
      ['nosale', '', 'No sales', noSale.length, 'var(--text2)', `90 วันขายไม่ได้เลย · ${fmtN(sumQ(noSale))} ชิ้น`],
    ];
    const kpis = STATS.map(([f, ic, l, n, c, sub]) => [(ic ? ic + ' ' : '') + l,
      `<span style="color:${n ? 'var(--text)' : 'var(--text3)'};">${fmtN(n)}</span><span class="sup-kunit">SKU</span>`, sub, f]);
    const cellOf = (a, x) => m.find(c => c.abc === a && c.xyz === x) || { n: 0 };
    const cur = STATS.find(x => x[0] === filt.status);
    const ddIcon = ic => ic ? `<span class="ic">${ic}</span>` : '<span class="ic"><i class="dot"></i></span>';
    const ddItem = ([f, ic, l, n]) => `<div class="sup-dd-it${filt.status === f ? ' on' : ''}${n ? '' : ' zero'}" data-f="${f}">${ddIcon(ic)}<span>${l}</span><b>${fmtN(n)}</b></div>`;
    const ddHtml = `<div class="sup-dd" id="supStatusDD">
        <button type="button" class="sup-dd-btn">${cur ? ddIcon(cur[1]) + `<span>${cur[2]}</span>` : '<span>All status</span>'}<b class="sup-dd-n">${fmtN(cur ? cur[3] : vis.length)}</b><span class="sup-dd-caret">▾</span></button>
        <div class="sup-dd-menu">
          <div class="sup-dd-it${filt.status ? '' : ' on'}" data-f=""><span class="ic">☰</span><span>All status</span><b>${fmtN(vis.length)}</b></div>
          <div class="sup-dd-sep"></div><div class="sup-dd-grp">Status</div>
          ${STATS.slice(0, 6).map(ddItem).join('')}
          <div class="sup-dd-sep"></div><div class="sup-dd-grp">Stock</div>
          ${STATS.slice(6).map(ddItem).join('')}
        </div>
      </div>`;
    const locs = locList();
    root().innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <div></div>
        <button class="btn btn-ghost" id="supRefresh" title="ดึง log ทีมแพ็ค + ไฟล์ PO ของจัดซื้อใหม่ทันที แล้วคำนวณใหม่ทั้งหน้า (ราว 10–60 วินาที) · แผน ณ ${dTH(d.as_of)} · log ล่าสุด ${dTH(d.ledger_last)} · ยอดขายล่าสุด ${dTH(d.sales_last)} · ไฟล์ PO ดึงล่าสุด ${PO_SYNCED ? new Date(PO_SYNCED).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}">↻ รีเฟรช (ดึงข้อมูลล่าสุด)</button>
      </div>
      

      <div class="sup-top">
        <div class="sup-kpis" id="supKpis">
          ${kpis.map(([l, v, s, f]) => `<div class="card sup-kpi${f && filt.status === f ? ' on' : ''}" data-f="${f}" style="cursor:${f ? 'pointer' : 'default'};"><div class="card-title">${l}</div><div class="kpi-value" style="font-size:19px;">${v}</div><div class="kpi-sub" style="display:block;">${s}</div></div>`).join('')}
        </div>
        <div class="card sup-abc">
          <div class="section-header"><div class="section-title">ABC × XYZ ${infoIcon('supAbc', ABC_INFO, 'right')}</div><span style="font-size:10.5px;color:var(--text3);">กดช่องเพื่อกรอง</span></div>
          <div class="sup-abc-grid" style="display:grid;grid-template-columns:92px repeat(3,1fr);gap:7px;font-size:12px;margin-top:2px;">
            <div></div>${['X', 'Y', 'Z'].map(x => `<div style="font-size:10px;color:var(--text3);text-align:center;line-height:1.4;">${x}<br>${XYZ_TXT[x]}</div>`).join('')}
            ${['A', 'B', 'C'].map(a => `<div style="font-size:10px;color:var(--text3);line-height:1.4;align-self:center;">${a}<br>${ABC_TXT[a]}</div>` + ['X', 'Y', 'Z'].map(x => { const c = cellOf(a, x); const on = filt.abc === a && filt.xyz === x; return `<div class="sup-cell" data-a="${a}" data-x="${x}" style="background:var(--bg3);border:1px solid ${on ? 'var(--accent)' : 'var(--border)'};border-radius:9px;padding:8px 8px;text-align:center;cursor:pointer;transition:border-color .15s;"><b style="display:block;font-size:19px;line-height:1.15;">${fmtN(c.n)}</b><span style="font-size:10px;color:var(--text3);">SKU</span></div>`; }).join('')).join('')}
          </div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:8px;line-height:1.6;">AX ควรมีของตลอด · AZ ต้องเผื่อมากที่สุด · CZ อย่าตุน — กด &#9432; ข้างหัวข้อเพื่อดูคำอธิบายเต็ม</div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div class="section-title">สต็อกสินค้า ${infoIcon('supGloss', glossary())}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <input type="text" class="ls-input" id="supQ" placeholder="🔎 Parent SKU / SKU / ชื่อสินค้า" value="${esc(filt.q)}" style="width:210px;padding:6px 10px;font-size:12px;">
            ${ddHtml}
            <button class="btn btn-ghost" id="supGroupToggle" style="${collapseAll ? 'background:var(--accent);color:#0a0a0f;border-color:var(--accent);' : ''}" title="ย่อแถวสี/เบอร์ เหลือแถวสรุปของ Parent (กดที่แถวสรุปเพื่อขยายทีละกลุ่ม)">▤ ย่อเหลือ Parent</button>
            <button class="btn btn-ghost" id="supHiddenToggle" style="${showHidden ? 'background:var(--accent);color:#0a0a0f;border-color:var(--accent);' : ''}" title="สินค้าที่ตั้งเป็น ซ่อน ในหน้า Admin">👁 ที่ซ่อนไว้${d.hidden_count ? ' (' + fmtN(d.hidden_count) + ')' : ''}</button>
            <button class="btn btn-ghost" id="supClear">✕ ล้าง</button>
            <button class="btn btn-ghost" id="supExport">⬇ Export CSV</button>
          </div>
        </div>
        <div class="table-wrap" id="supTbl" style="max-height:calc(100vh - 160px);overflow:auto;"></div>
        <div id="supFoot" style="font-size:10.5px;color:var(--text3);margin-top:10px;"></div>
      </div>

      <div class="card" id="supLocCard">
        <div class="section-header">
          <div class="section-title">สต็อกแยกคลัง ${infoIcon('supLocInfo', T('ใช้ทำอะไร', 'ให้เจ้าของแต่ละช่องทางดูว่าคลังย่อยของตัวเองเหลือเท่าไร และพอขายอีกกี่วัน จะได้โยกของระหว่างคลังได้ถูก') + T('ตัวเลข · ป้ายเล็ก', 'ตัวเลข = ของในคลังย่อยนั้น · สีหัวคอลัมน์ = สีประจำช่องทาง<br>ป้ายเล็ก = พอขายอีกกี่วัน = ของ ÷ ของที่ขายออกจากคลังนั้นต่อวัน (เฉลี่ย 30 วันล่าสุด จาก log ทีมแพ็ค)<br><span style="color:var(--red);">ป้ายแดง</span> = ไม่ถึง 14 วัน · ช่องที่เป็นขีด = ไม่มีของ') + T('Storage · Factory Hold', 'Storage = คลังเก็บของ ไม่ได้ขายออกโดยตรง ใช้เป็นแหล่งเรียกของมาเติม<br>Factory Hold = ผลิตเสร็จแล้ว ฝากไว้ที่โรงงาน'))}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <input type="text" class="ls-input" id="supLocQ" placeholder="🔎 Parent SKU / SKU / ชื่อสินค้า" value="${esc(locQ)}" style="width:210px;padding:6px 10px;font-size:12px;">
            <button class="btn btn-ghost" id="supLocLow" style="${locOnlyLow ? 'background:var(--accent);color:#0a0a0f;border-color:var(--accent);' : ''}">เฉพาะคลังย่อยที่พอขายไม่ถึง 14 วัน</button>
          </div>
        </div>
        <div class="table-wrap" id="supLocTbl" style="max-height:calc(100vh - 160px);overflow:auto;"></div>
      </div>

      <div class="card" id="supSkuCard">
        <div class="section-header"><div class="section-title" id="supSkuTitle">กราฟ SKU</div><span style="font-size:11.5px;color:var(--text3);">กดแถวในตารางด้านบนเพื่อดูสต็อกที่ผ่านมา + คาดการณ์ของสินค้านั้น</span></div>
        <div id="supSkuBody"><div class="empty">เลือก SKU จากตารางด้านบน</div></div>
      </div>
      <style>
        /* หน้านี้ใช้ Sarabun ทั้งหมด (2026-11-04 ทั้งเว็บใช้ฟอนต์เดียว รวมรหัสสินค้า) */
        #page-supply .card-title { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:12px; font-weight:600; color:var(--text2); margin-bottom:8px; }
        #page-supply .section-title { font-family:'Sarabun',sans-serif; }
        #page-supply .sup-top { display:grid; grid-template-columns:minmax(0,1fr) minmax(400px,38%); gap:16px; align-items:stretch; margin-bottom:20px; }
        #page-supply .sup-kpis { display:grid; grid-template-columns:repeat(4,1fr); grid-template-rows:1fr 1fr; gap:10px; }
        #page-supply > .card { margin-bottom:20px; }   /* เว้นระยะการ์ดเท่าหน้าอื่น */

        #page-supply .sup-kpi { min-width:0; padding:14px 16px; border-radius:10px; display:flex; flex-direction:column; justify-content:space-between; gap:6px; }
        #page-supply .sup-kpi .card-title { margin-bottom:3px; font-size:11px; }
        #page-supply .sup-kpi .kpi-value { font-size:24px !important; line-height:1.1; }
        #page-supply .sup-kpi .kpi-sub { font-size:10px; color:var(--text3); margin-top:4px; line-height:1.35; }
        #page-supply .sup-abc { align-self:stretch; display:flex; flex-direction:column; }
        #page-supply .sup-abc .sup-abc-grid { flex:1; align-content:center; }

        #page-supply table { width:100%; border-collapse:collapse; }
        #page-supply th { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:11.5px; font-weight:600;
          color:var(--text2); padding:11px 14px; white-space:nowrap; text-align:right; position:sticky; top:0; background:var(--bg2); z-index:3; border-bottom:1px solid var(--border2); }
        #page-supply th:nth-child(1), #page-supply th:nth-child(2) { text-align:left; }
        #page-supply th[data-k="abc"], #page-supply th[data-k="status"] { text-align:center; }
        #page-supply td { padding:12px 14px; font-size:12.5px; text-align:right; vertical-align:middle;
          font-variant-numeric:tabular-nums; white-space:nowrap; border-top:1px solid var(--border); }
        #page-supply td:first-child, #page-supply th:first-child { padding-left:16px; }
        #page-supply td:last-child, #page-supply th:last-child { padding-right:16px; }
        #page-supply table { table-layout:auto; }
        /* 2 คอลัมน์แรกเป็นข้อความ ให้กว้างคงที่ · คอลัมน์ตัวเลขที่เหลือกว้างเท่ากันหมด */
        #page-supply th:nth-child(1) { width:158px; }
        #page-supply th:nth-child(2) { width:210px; }
        #page-supply th:nth-child(n+3) { width:104px; }
        #page-supply th:last-child { width:120px; }
        #page-supply tbody tr { transition:background .12s; }
        #page-supply td.t-left { text-align:left; }
        #page-supply td.t-center { text-align:center; }
        #page-supply tbody tr:hover td { background:var(--bg3); }
        #page-supply .sup-parent { font-family:'Sarabun',sans-serif; font-size:11.5px; font-weight:700; color:var(--accent); }
        #page-supply .sup-skucode { font-family:'Sarabun',sans-serif; font-size:11.5px; font-weight:600; }
        #page-supply .sup-sub { font-size:10px; color:var(--text3); line-height:1.45; margin-top:3px; font-variant-numeric:normal; }
        #page-supply .sup-chip { display:inline-block; font-family:'Sarabun',sans-serif; font-size:10.5px; font-weight:600;
          padding:3px 8px; border-radius:6px; background:var(--bg3); border:1px solid var(--border); color:var(--text2); }
        #page-supply .sup-bar { height:3px; border-radius:2px; background:var(--bg3); margin:5px 0 0 auto; width:60px; overflow:hidden; }
        #page-supply .sup-bar i { display:block; height:100%; border-radius:2px; }
        #page-supply .sup-dash { color:var(--text3); }
        #page-supply .sup-lt { font-size:12.5px; } #page-supply .sup-lt.def { color:var(--text3); }
        #page-supply tr.sup-group td { background:color-mix(in srgb, var(--accent) 7%, var(--bg2)); border-top:2px solid var(--border2); font-weight:600; cursor:pointer; }
        #page-supply tr.sup-group:hover td { background:color-mix(in srgb, var(--accent) 13%, var(--bg2)); }
        #page-supply tr.sup-group .sup-parent { font-size:12.5px; }
        #page-supply tr.sup-group .sup-sub { font-weight:400; }
        #page-supply .sup-caret { display:inline-block; width:12px; color:var(--accent); font-size:10px; margin-right:4px; }
        #page-supply .sup-group-pill { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px; border-radius:99px; background:color-mix(in srgb, var(--accent) 18%, transparent); color:var(--accent); }
        /* (2026-09-29) ตัวกรองสถานะ = dropdown อันเดียว */
        #page-supply .sup-dd { position:relative; }
        #page-supply .sup-dd-btn { display:inline-flex; align-items:center; gap:8px; min-width:200px; padding:6px 10px 6px 12px; font-family:inherit; font-size:12px; color:var(--text);
          background:var(--bg2); border:1px solid var(--border); border-radius:8px; cursor:pointer; transition:border-color .15s; }
        #page-supply .sup-dd-btn:hover, #page-supply .sup-dd.open .sup-dd-btn { border-color:var(--accent); }
        #page-supply .sup-dd-btn .sup-dd-n { margin-left:auto; font-size:11px; font-weight:700; padding:1px 8px; border-radius:99px; background:var(--bg3); color:var(--text2); }
        #page-supply .sup-dd-caret { color:var(--text3); font-size:10px; transition:transform .15s; }
        #page-supply .sup-dd.open .sup-dd-caret { transform:rotate(180deg); }
        #page-supply .sup-dd-menu { display:none; position:absolute; left:0; top:calc(100% + 6px); width:250px; padding:6px; background:var(--bg2);
          border:1px solid var(--border); border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,.35); z-index:50; }
        #page-supply .sup-dd.open .sup-dd-menu { display:block; }
        #page-supply .sup-dd-grp { font-size:10.5px; font-weight:600; color:var(--text3); padding:6px 10px 3px; }
        #page-supply .sup-dd-sep { height:1px; background:var(--border); margin:5px 4px; }
        #page-supply .sup-dd-it { display:flex; align-items:center; gap:9px; padding:7px 10px; border-radius:8px; font-size:12.5px; color:var(--text); cursor:pointer; }
        #page-supply .sup-dd-it:hover { background:var(--bg3); }
        #page-supply .sup-dd-it.on { background:color-mix(in srgb, var(--accent) 14%, transparent); color:var(--accent); font-weight:600; }
        #page-supply .sup-dd-it b { margin-left:auto; font-size:11.5px; font-weight:600; color:var(--text2); font-variant-numeric:tabular-nums; }
        #page-supply .sup-dd-it.zero { opacity:.55; }
        #page-supply .sup-dd .ic { width:16px; text-align:center; font-size:12px; flex:0 0 16px; }
        #page-supply .sup-dd .ic .dot { display:inline-block; width:9px; height:9px; border-radius:50%; background:var(--text3); vertical-align:1px; }
        #page-supply table.sup-main { table-layout:fixed; min-width:1140px; }
        #page-supply table.sup-main th:first-child { text-align:left; }
        #page-supply table.sup-main th:not(:first-child), #page-supply table.sup-main td:not(:first-child) { text-align:center; }
        #page-supply table.sup-main td { vertical-align:top; white-space:normal; }
        #page-supply table.sup-main .sup-bar { margin:5px auto 0; }
        #page-supply tr.sup-child td:first-child { padding-left:40px; position:relative; }
        #page-supply tr.sup-child td:first-child::before { content:''; position:absolute; left:24px; top:0; bottom:0; border-left:2px solid color-mix(in srgb, var(--accent) 35%, transparent); }
        #page-supply .sup-st { font-size:12.5px; font-weight:600; white-space:nowrap; }
        #page-supply .sup-pname { font-size:12px; font-weight:600; color:var(--text); font-family:'Sarabun',sans-serif; }
        #page-supply tr.sup-noplan td { color:var(--text3); }
        #page-supply tr.sup-noplan td b { color:var(--text2) !important; }
        /* (2026-09-29) ตารางสต็อกแยกคลัง: หัว 2 ชั้น · ตัวเลขอยู่กลางคอลัมน์ · เส้นคั่นระหว่างกลุ่ม */
        #page-supply table.sup-loc { table-layout:fixed; min-width:1120px; --sl-line:color-mix(in srgb, var(--text3) 45%, transparent); }
        #page-supply table.sup-loc th { padding:8px 10px; font-size:11.5px; color:var(--text2); }
        #page-supply table.sup-loc th.sl-prod { width:20%; text-align:left; vertical-align:bottom; }
        #page-supply table.sup-loc th.sl-c, #page-supply table.sup-loc td.sl-c { text-align:center; }
        #page-supply table.sup-loc tr.sl-grp th { height:34px; }
        #page-supply table.sup-loc tr.sl-grp th[rowspan] { vertical-align:bottom; }
        #page-supply table.sup-loc tr.sl-names th { top:34px; }
        #page-supply table.sup-loc th.sl-g { text-align:center; font-size:12px; font-weight:700; color:var(--text); letter-spacing:.2px; }
        #page-supply table.sup-loc th.sl-g-ch { background:color-mix(in srgb, var(--accent) 12%, var(--bg2)); box-shadow:inset 1px 0 0 var(--sl-line), inset 0 -2px 0 var(--accent); }
        #page-supply table.sup-loc th.sl-g-st { background:var(--row-sum); box-shadow:inset 1px 0 0 var(--sl-line), inset 0 -2px 0 var(--text3); }
        #page-supply table.sup-loc th.sl-sep:not(.sl-g) { box-shadow:inset 1px 0 0 var(--sl-line); }
        #page-supply table.sup-loc tr.sl-names th { box-shadow:inset 0 -1px 0 var(--sl-line); }
        #page-supply table.sup-loc tr.sl-names th.sl-sep { box-shadow:inset 1px 0 0 var(--sl-line), inset 0 -1px 0 var(--sl-line); }
        #page-supply table.sup-loc tr.sl-grp th[rowspan] { box-shadow:inset 0 -1px 0 var(--sl-line); }
        #page-supply table.sup-loc tr.sl-grp th[rowspan].sl-sep { box-shadow:inset 1px 0 0 var(--sl-line), inset 0 -1px 0 var(--sl-line); }
        #page-supply table.sup-loc td.sl-sep { border-left:1px solid var(--sl-line); }
        #page-supply .sl-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; vertical-align:1px; }
        #page-supply table.sup-loc td { padding:10px 10px; vertical-align:top; }
        #page-supply .sl-q { font-size:13px; font-weight:600; line-height:1.3; }
        #page-supply .sl-q.sl-tot { font-weight:700; }
        #page-supply table.sup-loc td.sl-totc { background:color-mix(in srgb, var(--accent) 6%, transparent); }
        #page-supply table.sup-loc tr.sl-par td { font-weight:600; }
        #page-supply .sl-empty { color:var(--text3); opacity:.45; }
        #page-supply .sl-d { display:inline-block; margin-top:4px; font-size:10.5px; line-height:1.6; padding:0 7px; border-radius:99px; background:var(--bg3); color:var(--text2); white-space:nowrap; }
        #page-supply .sl-d.red { background:color-mix(in srgb, var(--red) 15%, transparent); color:var(--red); font-weight:700; }
        #page-supply table.sup-loc tr.sl-par td { background:var(--row-sum); padding:7px 16px; border-top:1px solid var(--sl-line); }
        @media (max-width:1200px){ #page-supply .sup-top { grid-template-columns:1fr; } #page-supply .sup-kpis { grid-template-columns:repeat(4,1fr); } }
        @media (max-width:800px){ #page-supply .sup-kpis { grid-template-columns:repeat(2,1fr); } }
      </style>`;

    renderTable();
    renderLocTable();
    const dd = document.getElementById('supStatusDD');
    dd.querySelector('.sup-dd-btn').onclick = e => { e.stopPropagation(); dd.classList.toggle('open'); };
    dd.querySelectorAll('.sup-dd-it').forEach(el => el.onclick = () => { filt.status = el.dataset.f; renderAll(); });
    if (!window._supDDDoc) {   // ปิดเมนูเมื่อกดที่อื่น / กด Esc
      window._supDDDoc = true;
      const close = () => { const d = document.getElementById('supStatusDD'); if (d) d.classList.remove('open'); };
      document.addEventListener('click', e => { if (!e.target.closest('#supStatusDD')) close(); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }
    document.getElementById('supLocQ').oninput = e => { locQ = e.target.value; renderLocTable(); };
    document.getElementById('supLocLow').onclick = () => { locOnlyLow = !locOnlyLow; renderAll(); };
    document.getElementById('supRefresh').onclick = async () => {
      const btn = document.getElementById('supRefresh');
      const t0 = Date.now();
      btn.disabled = true;
      const tick = () => { btn.textContent = `⏳ กำลังดึงไฟล์ PO + log ทีมแพ็ค… ${Math.round((Date.now() - t0) / 1000)} วิ`; };
      tick(); const iv = setInterval(tick, 1000);
      let done = false;
      try {
        const r = await supaRpc('supply_sync_now', {});
        // (2026-09-30) รอจนแถว PO จากชีทถูกเขียนใหม่จริง (ปกติ 10–60 วิ แล้วแต่คิวของระบบ) สูงสุด 3 นาที
        const since = new Date((r && r.skipped && r.last_run ? new Date(r.last_run).getTime() : t0) - 5000);
        for (let i = 0; i < 60 && !done; i++) {
          await new Promise(res => setTimeout(res, 3000));
          const x = await fetch(`${window.SUPABASE_URL}/rest/v1/purchase_orders?note=like.sheet:*&select=created_at&order=created_at.desc&limit=1`, { headers: H() })
            .then(q => q.ok ? q.json() : []).catch(() => []);
          if (x[0] && new Date(x[0].created_at) >= since) done = true;
        }
        if (done) await new Promise(res => setTimeout(res, 2500));   // รอคำนวณตัวเลขใหม่ต่อจาก sync
      } catch (e) { console.warn('supply_sync_now', e.message); }
      clearInterval(iv);
      DATA = null; LOC_USE = null; await load();
      if (!done) uiAlert('ดึงไฟล์ PO ยังไม่เสร็จ', { text: 'ลองกดรีเฟรชอีกครั้งภายหลัง · ระบบดึงให้เองทุกวัน 03:40 และ 13:40' });
    };
    document.getElementById('supQ').oninput = e => { filt.q = e.target.value; renderTable(); };
    document.getElementById('supClear').onclick = () => { filt = { status: '', abc: '', xyz: '', q: '' }; renderAll(); };
    document.getElementById('supExport').onclick = exportCsv;
    document.getElementById('supGroupToggle').onclick = () => { collapseAll = !collapseAll; collapsed = new Set(); if (sort.key !== 'parent_sku') { sort.key = 'parent_sku'; sort.dir = 1; } renderAll(); };
    document.getElementById('supHiddenToggle').onclick = () => { showHidden = !showHidden; renderAll(); };
    document.querySelectorAll('#supKpis .card[data-f]').forEach(el => { const f = el.dataset.f; if (!f) return; el.onclick = () => { filt.status = filt.status === f ? '' : f; renderAll(); }; });
    document.querySelectorAll('.sup-cell').forEach(el => el.onclick = () => { const a = el.dataset.a, x = el.dataset.x; if (filt.abc === a && filt.xyz === x) { filt.abc = ''; filt.xyz = ''; } else { filt.abc = a; filt.xyz = x; } renderAll(); });
    if (selSku && lastSeries) renderSku(lastSeries);
  }

  // ===== (2026-09-21) แผนสั่งของที่กรอกเอง: จะสั่งกี่ชิ้น + ของพร้อมส่งวันที่ → ขายได้ถึงวันไหน =====
  // ไม่กรอกวันที่ของถึง = นับต่อจากวันที่ของเดิมหมด · กรอกวันที่ = นับจากวันที่ของถึง บวกของที่ยังเหลือตอนนั้น
  let PLANS = {}, REVIEW_DAYS = 14, OPEN_PO = {}, HOLD = {}, PO_SYNCED = null;
  // สต็อกที่มีจริง = ในคลังทุกที่ + Hold ที่โรงงาน (ผลิตเสร็จแล้ว เรียกเข้าได้ใน 2–3 วัน)
  const stockAll = r => Math.max(0, +r.on_hand || 0) + (HOLD[r.sku] || 0);
  const wipQty = sku => (OPEN_PO[sku] || []).reduce((t, x) => t + x.q, 0);
  const H = () => ({ apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + authJwt(), 'Content-Type': 'application/json' });
  async function loadPlans() {
    try {
      const [p, st, po] = await Promise.all([
        fetch(`${window.SUPABASE_URL}/rest/v1/supply_order_plans?select=*`, { headers: H() }).then(r => r.ok ? r.json() : []),
        fetch(`${window.SUPABASE_URL}/rest/v1/supply_settings?key=eq.review_days&select=value`, { headers: H() }).then(r => r.ok ? r.json() : []),
        fetch(`${window.SUPABASE_URL}/rest/v1/purchase_orders?status=neq.closed&select=sku,po_no,qty_ordered,qty_received,qty_wip,qty_hold_factory,eta,note,created_at,ordered_at&order=eta.asc`, { headers: H() }).then(r => r.ok ? r.json() : [])
      ]);
      OPEN_PO = {}; HOLD = {}; PO_SYNCED = null; PO_ALL = {};
      (po || []).forEach(x => {
        if (x.sku && +x.qty_ordered > 0) (PO_ALL[x.sku] = PO_ALL[x.sku] || []).push({ po: x.po_no || '', ordered: x.ordered_at ? String(x.ordered_at).slice(0, 10) : null, qty: +x.qty_ordered });   // (2026-11-10) ไว้หัก Forecast
        if (String(x.note || '').indexOf('sheet:') === 0 && x.created_at && (!PO_SYNCED || x.created_at > PO_SYNCED)) PO_SYNCED = x.created_at;
        const q = (+x.qty_ordered || 0) - (+x.qty_received || 0); if (q <= 0) return;
        if (+x.qty_hold_factory > 0 && !(+x.qty_wip > 0)) { HOLD[x.sku] = (HOLD[x.sku] || 0) + q; return; }   // ผลิตเสร็จแล้ว ฝากโรงงาน
        // WIP: มีวันผลิตเสร็จจริงจากจัดซื้อ = dated · ไม่มี (ระบบเดาจากวันเปิด PO + LT หรือ CALL-OFF) = nodate → นับต่อจากวันที่ของหมด
        const dated = String(x.note || '').includes('กำลังผลิต · วันที่คาดว่าจะผลิตเสร็จในชีท');
        if (x.eta) (OPEN_PO[x.sku] = OPEN_PO[x.sku] || []).push({ ...x, q, nodate: !dated });
      });
      PLANS = Object.fromEntries((p || []).map(x => [x.sku, x]));
      if (st && st[0]) REVIEW_DAYS = +st[0].value || 14;
    } catch (e) { console.warn('loadPlans', e.message); }
  }
  // (2026-11-10) Forecast ที่สั่งจริงแล้ว ไม่นับซ้ำ: PO ที่สั่ง (วันที่ในไฟล์ PO) ตั้งแต่วันที่กรอก Forecast = ล็อตจาก Forecast → หักออก เหลือเท่าไหร่ค่อยนับ
  //   PO ที่สั่งก่อนวันกรอกไม่เกิน 14 วัน = อาจเป็นล็อตเดียวกัน → ขึ้นป้ายเตือนให้กดยืนยันลบเอง (ไม่หักให้อัตโนมัติ)
  let PO_ALL = {};
  function fcUse(sku) {
    const pl = PLANS[sku]; if (!pl || !(+pl.plan_qty > 0)) return null;
    const pd = pl.updated_at ? iso(new Date(pl.updated_at)) : null, L = PO_ALL[sku] || [];
    const after = pd ? L.filter(x => x.ordered && x.ordered >= pd) : [];
    const near = pd && pl.note !== 'extra' ? L.filter(x => x.ordered && x.ordered < pd && x.ordered >= iso(new Date(toD(pd).getTime() - 14 * DAY))) : [];   // กด "ไม่ใช่ สั่งเพิ่ม" แล้ว (note = extra) ไม่ถามอีก
    const used = after.reduce((t, x) => t + x.qty, 0);
    return { qty: +pl.plan_qty, used, left: Math.max(0, +pl.plan_qty - used), after, near, pd };
  }
  window._supFcClear = async sku => {
    if (typeof uiConfirm === 'function' && !(await uiConfirm('ลบ Forecast', { text: `${sku} · ล็อตเดียวกับ PO ที่เปิดแล้ว ลบตัวเลข Forecast ออก`, ok: 'ลบ' }))) return;
    try { await savePlan(sku, 0); renderAll(); } catch (e) { if (typeof uiAlert === 'function') uiAlert('ลบไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
  };
  window._supFcExtra = async sku => {   // Forecast นี้ตั้งใจสั่งเพิ่มจาก PO ที่มีแล้ว → ไม่ถามซ้ำ นับต่อท้ายตามปกติ
    try { const r = await fetch(`${window.SUPABASE_URL}/rest/v1/supply_order_plans?sku=eq.${encodeURIComponent(sku)}`, { method: 'PATCH', headers: { ...H(), Prefer: 'return=representation' }, body: JSON.stringify({ note: 'extra' }) });
      if (!r.ok) throw new Error('บันทึกไม่สำเร็จ ' + r.status); const row = (await r.json())[0]; if (row) PLANS[sku] = row; renderAll(); }
    catch (e) { if (typeof uiAlert === 'function') uiAlert('บันทึกไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
  };
  async function savePlan(sku, qty, arrive) {
    const url = `${window.SUPABASE_URL}/rest/v1/supply_order_plans`;
    if (!qty) {   // ลบตัวเลขออก = ยกเลิกแผน
      await fetch(`${url}?sku=eq.${encodeURIComponent(sku)}`, { method: 'DELETE', headers: H() });
      delete PLANS[sku]; return;
    }
    const res = await fetch(`${url}?on_conflict=sku`, { method: 'POST', headers: { ...H(), Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ sku, plan_qty: qty, arrive_date: arrive || null }) });
    if (!res.ok) throw new Error('บันทึกไม่สำเร็จ ' + res.status);
    const row = (await res.json())[0]; if (row) PLANS[sku] = row;
  }
  const DAY = 864e5;
  const toD = s => new Date(s + 'T00:00:00');
  const iso = d => (d instanceof Date && !isNaN(d)) ? new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10) : null;
  // ไล่ตามเวลา: ขายลดลงทุกวัน · ของเข้าตามวันที่ → คืนวันที่ของหมด และวันขาดของระหว่างทาง
  function runOut(stock, avg, today, events) {
    let s = stock, t = today, gap = 0;
    for (const ev of events) {
      const days = Math.max(0, Math.round((ev.d - t) / DAY));
      const need = avg * days;
      if (need > s) gap += Math.round((need - s) / avg);   // ของหมดก่อนก้อนนี้จะเข้า
      s = Math.max(0, s - need) + ev.q; if (ev.d > t) t = ev.d;
    }
    return { end: new Date(t.getTime() + Math.floor(s / avg) * DAY), gap };
  }
  function planCalc(r) {
    const pl = PLANS[r.sku]; const avg = +r.avg_day || 0; const today = toD(iso(new Date()));
    const stock = stockAll(r);
    const lt = +r.lt || 60;
    const allPo = OPEN_PO[r.sku] || [];
    const pos = allPo.filter(x => !x.nodate).map(x => ({ d: toD(x.eta), q: x.q, po: x })).sort((a, b) => a.d - b.d);
    const nodateQty = allPo.filter(x => x.nodate).reduce((t, x) => t + x.q, 0);
    const out = { pl, pos, poQty: pos.reduce((s, x) => s + x.q, 0) + nodateQty, nodateQty, needBy: null, oldEnd: null, withPoEnd: null, orderBy: null, newEnd: null, gapDays: 0 };
    if (avg <= 0) { out.meet = ['🟢', 'OK', 'var(--text3)']; return out; }
    out.oldEnd = new Date(today.getTime() + Math.floor(stock / avg) * DAY);
    const base0 = runOut(stock, avg, today, pos);           // สต็อก + WIP ที่มีวันเสร็จจริง
    out.needBy = nodateQty > 0 ? base0.end : null;          // WIP ที่ไม่มีวันจริง ต้องได้ของก่อนวันนี้
    // WIP ที่ไม่มีวันจริง → ถือว่าเข้าพอดีตอนของหมด แล้วขายต่อ
    const base = { end: new Date(Math.max(base0.end, today) + Math.floor(nodateQty / avg) * DAY), gap: base0.gap };
    out.withPoEnd = base.end; out.gapDays = base.gap;
    out.orderBy = new Date(base.end.getTime() - lt * DAY);  // ก้อนถัดไปต้องสั่งภายใน (นับหลัง PO ที่มีแล้ว)
    const fc = fcUse(r.sku); out.fc = fc;
    if (fc && fc.left > 0) {
      if (false && pl.arrive_date) {                         // (ปิดแล้ว 2026-09-22) ไม่ใช้วันที่ของ forecast — นับต่อท้ายเสมอ
        const r2 = runOut(stock, avg, today, [...pos, { d: toD(pl.arrive_date), q: +pl.plan_qty }].sort((a, b) => a.d - b.d));
        out.newEnd = new Date(Math.max(r2.end, today) + Math.floor(nodateQty / avg) * DAY); out.gapDays = r2.gap;
      } else {                                               // ไม่กรอก → ต่อท้ายหลังของเดิม + PO หมด
        const b0 = base.end > today ? base.end : today;
        out.newEnd = new Date(b0.getTime() + Math.floor(fc.left / avg) * DAY);   // นับเฉพาะส่วนที่ยังไม่ได้เปิด PO
      }
    }
    const meetNext = new Date(today.getTime() + REVIEW_DAYS * DAY);
    if (out.gapDays > 0) out.meet = ['⚫', 'Stockout risk ~' + out.gapDays + ' d', 'var(--text)'];
    else if (fc && fc.left > 0) out.meet = ['✅', 'Planned', 'var(--green)'];
    else if (out.orderBy < meetNext) out.meet = ['🔴', 'Order now', 'var(--red)'];
    else if (out.orderBy < new Date(meetNext.getTime() + REVIEW_DAYS * DAY)) out.meet = ['🟡', 'Next review', 'var(--orange)'];
    else out.meet = ['🟢', 'OK', 'var(--text3)'];
    return out;
  }
  function planCells(r) {
    if (r.plan_mode !== 'plan') return '<td class="t-center"><span class="sup-dash">—</span></td>'.repeat(2);
    const c = planCalc(r), pl = c.pl || {};
    const stamp = pl.updated_at ? new Date(pl.updated_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    return `<td class="t-center sup-plan" onclick="event.stopPropagation()">
        <input type="text" inputmode="numeric" class="sup-in sup-plan-qty${pl.plan_qty ? ' on' : ''}${c.fc && c.fc.used > 0 && !c.fc.left ? ' done' : ''}" data-sku="${esc(r.sku)}"
          value="${pl.plan_qty ? Number(pl.plan_qty).toLocaleString() : ''}" placeholder="">
        ${(() => { const fc = c.fc; if (!fc) return stamp ? `<div class="sup-sub">Saved ${stamp}</div>` : '';
          if (fc.used > 0) return fc.left > 0
            ? `<div class="sup-sub" style="color:var(--green);">PO แล้ว ${fmtN(fc.used)} · นับต่อ ${fmtN(fc.left)}</div>`
            : `<div class="sup-sub" style="color:var(--green);">✓ Ordered · ${esc(fc.after.map(x => x.po).filter(Boolean).join(', ') || 'PO')}</div>`;
          if (fc.near.length) return `<div class="sup-sub" style="color:var(--orange);">PO ${fmtN(fc.near.reduce((t, x) => t + x.qty, 0))} สั่ง ${dTH(fc.near[0].ordered)} · ล็อตเดียวกัน?</div><div class="sup-fcb"><button type="button" class="sup-fcx" onclick="event.stopPropagation();window._supFcClear('${esc(r.sku)}')">ใช่ ลบ</button><button type="button" class="sup-fcx alt" onclick="event.stopPropagation();window._supFcExtra('${esc(r.sku)}')">ไม่ใช่ สั่งเพิ่ม</button></div>`;
          return stamp ? `<div class="sup-sub">Saved ${stamp}</div>` : ''; })()}
      </td>
      <td class="t-center">
        <div class="sup-meet" style="color:${c.meet[2]};">${c.meet[0]} ${c.meet[1]}</div>
        ${c.newEnd ? `<div class="sup-sub" style="font-size:11.5px;">Until <b style="color:var(--accent2);">${dTH(iso(c.newEnd))}</b></div>`
          : (c.poQty && c.withPoEnd ? `<div class="sup-sub" style="font-size:11px;">With WIP: until ${dTH(iso(c.withPoEnd))}</div>` : '')}
      </td>`;
  }
  (function () {
    const old = document.getElementById('supPlanCss'); if (old) old.remove();
    const st = document.createElement('style'); st.id = 'supPlanCss';
    st.textContent = `
      #supTbl th[data-k="plan_qty"], #supTbl th[data-k="plan_date"], #supTbl th[data-k="plan_end"],
      #supTbl th[data-k="po_due_date"], #supTbl th[data-k="cover_days"] { text-align:center; }
      .sup-in { font-family:inherit; border:1px solid var(--border); border-radius:8px; background:var(--bg2); color:var(--text);
        outline:none; transition:border-color .15s, background .15s; }
      .sup-in:hover { border-color: var(--border2, var(--text3)); }
      .sup-in:focus { border-color: var(--accent); background: var(--bg); }
      .sup-in.on { border-color: rgba(212,160,23,.55); background: rgba(212,160,23,.07); }
      .sup-plan-qty { width:96px; padding:6px 10px; text-align:center; font-size:13px; font-weight:600; font-variant-numeric:tabular-nums; }
      .sup-plan-qty::placeholder { color:var(--text3); font-weight:400; }
      .sup-plan-date { width:132px; padding:5px 8px; font-size:12px; text-align:center; color:var(--text2); }
      .sup-meet { font-size:12px; font-weight:600; white-space:nowrap; }
      td.sup-plan .sup-sub { margin-top:3px; }
      .sup-noplan-pill { display:inline-block; vertical-align:1px; margin-left:6px; font-size:9.5px; font-weight:700; letter-spacing:.4px;
        padding:2px 7px; border-radius:4px; background:#475569; color:#fff; white-space:nowrap; }
      body:not(.light-theme) .sup-noplan-pill { background:#cbd5e1; color:#0f172a; }
      .sup-calloff { display:inline-block; font-size:9.5px; font-weight:700; letter-spacing:.3px; padding:1px 6px; border-radius:4px;
        color:#b45309; background:rgba(245,158,11,.14); border:1px solid rgba(245,158,11,.35); white-space:nowrap; }
      /* หัวตารางค้างไว้ด้านบนเวลาเลื่อน (แบบ Google Sheets / Excel) */
      #supTbl thead th { position:sticky; top:0; z-index:3; background:var(--bg2); box-shadow:0 1px 0 var(--border); }
      /* (2026-11-10) หน้าตาใหม่ — การ์ดสถานะเป็นแถบเดียว · ตารางอ่านง่ายขึ้น */
      #page-supply .sup-kpis { gap:0 !important; border:1.5px solid transparent; background:var(--hero,var(--bg2)) padding-box,var(--hero-line,var(--border)) border-box; box-shadow:var(--sh,none); border-radius:14px; overflow:hidden; }
      #page-supply .sup-kpi { background:transparent !important; border:0 !important; border-radius:0 !important; box-shadow:inset -1px 0 0 var(--border), inset 0 -1px 0 var(--border) !important; }
      #page-supply .sup-kpi:nth-child(4n) { box-shadow:inset 0 -1px 0 var(--border) !important; }
      #page-supply .sup-kpi:nth-child(n+5) { box-shadow:inset -1px 0 0 var(--border) !important; } #page-supply .sup-kpi:nth-child(8) { box-shadow:none !important; }
      #page-supply .sup-kpi.on { background:color-mix(in srgb, var(--accent) 12%, transparent) !important; }
      #page-supply .sup-kpi:hover { background:color-mix(in srgb, var(--accent) 6%, transparent) !important; }
      #page-supply .sup-kpi .kpi-value { font-size:24px !important; } #page-supply .sup-kunit { font-size:12px; font-weight:500; color:var(--text3); margin-left:5px; }
      #page-supply .sup-kpi .kpi-sub { font-size:11px !important; }
      #page-supply table.sup-main td { padding-top:10px; padding-bottom:10px; vertical-align:middle; }
      #page-supply .sup-code { font-family:'Sarabun',sans-serif; font-size:12.5px; font-weight:700; color:var(--text); }
      #page-supply .sup-abc { display:inline-block !important; width:auto !important; max-width:none !important; margin-left:6px; font-size:10px; font-weight:600; padding:0 5px; border-radius:4px; background:var(--bg3); color:var(--text3); vertical-align:1px; }
      #page-supply .sup-nm { font-size:12px; color:var(--text2); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #page-supply .sup-sub { font-size:11px !important; }
      #page-supply tr.sup-group td { background:var(--bg3) !important; border-top:1px solid var(--border) !important; }
      #page-supply tr.sup-group:hover td { background:color-mix(in srgb, var(--accent) 8%, var(--bg3)) !important; }
      #page-supply .sup-parent { color:var(--text) !important; }   /* รหัสสินค้าสีปกติทั้งหน้า (ตารางหลัก + สต็อกแยกคลัง) */
      .sup-plan-qty:not(.on):not(:focus) { background:transparent; border-color:transparent; }
      #page-supply td.sup-runc { min-width:150px; }
      #page-supply .sup-runt { display:flex; align-items:baseline; justify-content:center; gap:6px; white-space:nowrap; } #page-supply .sup-runt span { font-size:11px; color:var(--text3); }
      #page-supply .sup-run { position:relative; height:6px; border-radius:3px; background:var(--bg3); margin:6px auto 0; width:100%; max-width:170px; overflow:hidden; }
      #page-supply .sup-run i { position:absolute; top:0; bottom:0; left:0; display:block; }
      #page-supply .sup-run i.z { background:color-mix(in srgb, var(--red) 22%, transparent); }
      #page-supply .sup-run i.f { border-radius:3px; }
      #page-supply .sup-run i.w { background:repeating-linear-gradient(45deg, color-mix(in srgb, var(--green) 55%, transparent) 0 3px, transparent 3px 6px); }
      #page-supply .sup-run i.more { left:auto; right:2px; font-style:normal; font-size:9px; line-height:6px; color:#fff; }
      #page-supply .sup-pill { display:inline-block; font-size:11.5px; font-weight:600; padding:3px 10px; border-radius:99px; white-space:nowrap; color:var(--c); background:color-mix(in srgb, var(--c) 14%, transparent); }
      #page-supply .sup-pill.mute { background:transparent; padding-left:0; padding-right:0; font-weight:500; }
      #page-supply table.sup-loc td { padding-top:8px; padding-bottom:8px; }
      #page-supply .sl-pn { display:flex; align-items:baseline; gap:8px; min-width:0; } #page-supply .sl-nm { font-size:12px; color:var(--text2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #page-supply .sup-loc .sl-q { display:inline; font-weight:600; } #page-supply .sl-dd { margin-left:6px; font-size:10.5px; color:var(--text3); }
      #page-supply .sup-loc td.sl-low { background:color-mix(in srgb, var(--red) 12%, transparent); } #page-supply .sup-loc td.sl-low .sl-q, #page-supply .sup-loc td.sl-low .sl-dd { color:var(--red); }
      #page-supply .sup-loc tr.sl-par td { background:var(--bg3) !important; }
      #page-supply .sup-loc .sl-d { display:none; }
      #page-supply .sup-facts { display:flex; flex-wrap:wrap; border:1px solid var(--border); border-radius:10px; margin-bottom:10px; }
      #page-supply .sup-facts > div { flex:1 1 0; min-width:120px; padding:10px 14px; } #page-supply .sup-facts > div + div { border-left:1px solid var(--border); }
      #page-supply .sup-facts > div > span:first-child { display:block; font-size:11px; color:var(--text3); } #page-supply .sup-facts b { display:block; font-size:16px; margin-top:3px; font-variant-numeric:tabular-nums; }
      #page-supply .sup-facts i { display:block; font-style:normal; font-size:11px; color:var(--text3); margin-top:2px; } #page-supply .sup-facts .sup-pill { font-size:12px; display:inline-block; }
      #page-supply .sup-locline { font-size:12px; color:var(--text3); margin:0 2px 14px; } #page-supply .sup-locline b { color:var(--text2); font-weight:600; }
      #page-supply .sup-ch-h { display:flex; align-items:baseline; gap:8px; margin:4px 2px 6px; } #page-supply .sup-ch-h b { font-size:13px; } #page-supply .sup-ch-h span { font-size:11.5px; color:var(--text3); }
      #page-supply .sup-leg { display:flex; gap:16px; flex-wrap:wrap; font-size:11px; color:var(--text3); margin-top:8px; } #page-supply .sup-leg span { display:inline-flex; align-items:center; gap:6px; } #page-supply .sup-leg i { display:inline-block; }
      tr.sup-row:hover .sup-plan-qty:not(.on):not(:focus) { border-color:var(--border); border-style:dashed; }
      .sup-plan-qty.done { text-decoration:line-through; opacity:.55; }
      .sup-fcb { display:flex; flex-wrap:wrap; gap:4px; justify-content:center; margin-top:4px; } .sup-fcb .sup-fcx { white-space:nowrap; padding:2px 7px !important; } .sup-fcx.alt { border-color:var(--border); background:transparent; color:var(--text2); }
      .sup-fcx { font:inherit; font-size:11px; padding:2px 8px; border-radius:6px; border:1px solid color-mix(in srgb, var(--orange) 45%, transparent); background:color-mix(in srgb, var(--orange) 10%, transparent); color:var(--orange); cursor:pointer; }`;
    document.head.appendChild(st);
  })();
  function bindPlanInputs() {
    const save = async el => {
      const tr = el.closest('tr'); const sku = el.dataset.sku;
      const qEl = tr.querySelector('.sup-plan-qty');
      const qty = parseInt(String(qEl.value).replace(/[^\d]/g, '')) || 0;
      const arr = null;
      el.style.borderColor = '#fbbf24';
      try {
        await savePlan(sku, qty, arr);
        const y = window.scrollY, tb = document.getElementById('supTbl'), ty = tb ? tb.scrollTop : 0;
        renderAll();
        window.scrollTo(0, y); const tb2 = document.getElementById('supTbl'); if (tb2) tb2.scrollTop = ty;
      }
      catch (e) { el.style.borderColor = 'var(--red)'; uiAlert('บันทึกไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
    };
    document.querySelectorAll('.sup-plan-qty').forEach(el => {
      el.onclick = ev => ev.stopPropagation();
      el.onfocus = () => { el.value = String(el.value).replace(/[^\d]/g, ''); el.select(); };   // แก้เลขสะดวก ไม่มีคอมม่า
      el.oninput = () => { el.value = el.value.replace(/[^\d]/g, ''); };
      el.onkeydown = ev => { if (ev.key === 'Enter') el.blur(); };
      el.onchange = () => save(el);
    });
    document.querySelectorAll('.sup-plan-date').forEach(el => { el.onclick = ev => ev.stopPropagation(); el.onchange = () => save(el); });
  }


  // ===== ⓘ คำอธิบายหัวคอลัมน์ (กดดู · ใช้กล่องแบบเดียวกับทั้งเว็บ) =====
  const COL_TIPS = {
    parent_sku: 'รหัสสินค้า · แถวหัวกลุ่ม = รหัสหลัก (Lead time และสต็อกรวมทุกสี/เบอร์) · ตัวอักษรท้ายชื่อ เช่น AX = ABC-XYZ',
    plan_end: '<b>🔴 Order now</b> = ต้องตัดสินใจเปิด PO ในประชุมรอบนี้<br><b>⚫ Stockout risk</b> = ของหมดก่อน PO ล็อตถัดไปจะถึง (ขาดกี่วัน)<br><b>🟡 Next review</b> = ถึงคิวตัดสินใจประชุมรอบหน้า<br><b>✅ Planned</b> = กรอก Forecast แล้ว · Until = ขายได้ถึงวันไหน<br><b>🟢 OK</b> = ยังไม่ต้องทำอะไร<br><b>No reorder</b> = การวางแผนตั้งเป็น "ดูเฉย ๆ" (หน้า สินค้า & ราคา)',
    cover_days: () => `ของที่มีตอนนี้ (คลังทุกที่ + Hold โรงงาน) พอขายได้อีกกี่วัน · ยังไม่นับของที่กำลังผลิต<br>Out = วันที่คาดว่าของจะหมด<br><span style="color:var(--red);">แดง</span> = น้อยกว่า LT + ${REVIEW_DAYS} วัน · <span style="color:var(--green);">เขียว</span> = ปกติ · <span style="color:#60a5fa;">ฟ้า</span> = เกิน 180 วัน`,
    on_hand: 'ของที่มีจริงตอนนี้ = คลังทุกที่ + Hold ที่โรงงาน (ผลิตเสร็จแล้ว เรียกเข้าได้ใน 2–3 วัน)',
    on_order: 'ของที่กำลังผลิต (เปิด PO แล้ว)<br>ETA = วันผลิตเสร็จที่จัดซื้อลงไว้<br>No ETA yet = จัดซื้อยังไม่ลงวันเสร็จในไฟล์ PO<br>Need by = ต้องได้ของก่อนวันนี้ถึงจะไม่ขาด<br>Call-off = ยอดคงเหลือ PO รอเรียกผลิต',
    avg_day: 'ขายต่อวัน (จากยอดขาย)<br>วันปกติ: เฉลี่ย 7 วัน 50% · 30 วัน 30% · 90 วัน 20%<br>+ ออเดอร์ก้อนใหญ่ (ตัวแทน / ห้าง) เฉลี่ย 90 วัน นับครึ่งเดียว<br>ไม่นับวันก่อนเริ่มขาย และวันที่ของหมด<br>▲▼ ตัวเล็ก = 7 วันล่าสุดเทียบ 30 วัน',
    po_due_date: 'วันสุดท้ายที่สั่งล็อตถัดไปแล้วของยังมาทัน<br>= วันที่ของหมด − Lead time<br>วันที่ของหมดนับ PO ที่สั่งไว้ตามวันที่ของถึงจริง',
    lt: 'Lead time = สั่งผลิตแล้วกี่วันของถึง (ตั้งในหน้า สินค้า & ราคา) · ใช้คิด Order by และสีของ Days of cover · ตัวจาง = ยังไม่ได้ตั้ง ใช้ 60 วัน',
    plan_qty: 'Forecast = จำลองยอดที่จะสั่งในอนาคต · เปิด PO หลังวันที่กรอกแล้ว ระบบหักออกให้เอง (ไม่นับซ้ำ) · PO ที่สั่งก่อนวันกรอกไม่เกิน 14 วัน ขึ้นป้ายให้กดยืนยันลบ — กรอกแล้วบันทึกทันที · ช่อง Status จะเปลี่ยนเป็น Planned และบอกว่าขายได้ถึงวันไหน (Until)'
  };
  function colTip(k) {
    let t = COL_TIPS[k]; if (!t) return ''; if (typeof t === 'function') t = t();
    const id = 'suptip-' + k;
    if (typeof fbeInfoIcon === 'function') return ' ' + fbeInfoIcon(id, t);   // (2026-11-10) ชี้แล้วขึ้น
    return ` <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()">`
      + `<span onclick="event.stopPropagation();toggleTip('${id}')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span>`
      + `<div id="${id}" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;position:absolute;top:18px;${['plan_qty','po_due_date','avg_day','plan_end'].includes(k) ? 'right:0;' : 'left:0;'}background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11px;line-height:1.6;white-space:normal;width:260px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);font-weight:400;text-align:left;">${t}</div></span>`;
  }

  // ===== (2026-09-29) ตารางแบบใหม่: 8 คอลัมน์ อ่านง่ายขึ้น — Status เป็นคำทำงาน · วันที่มีปี · แถวหัวกลุ่มมีแค่ Lead time + On hand =====
  const dY = d => { if (!d) return '—'; const x = new Date(d + 'T00:00:00'); return isNaN(x) ? '—' : x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };
  // ระยะเวลา: ≤ 60 วันบอกเป็นวัน · 61–365 วันบอกเป็นเดือน · เกิน 12 เดือนบอกเป็นปี
  const covTxt = n => n == null ? '—' : n <= 60 ? fmtN(n) + ' d' : n <= 365 ? Math.max(3, Math.round(n / 30.4)) + ' mo' : (n >= 730 ? Math.round(n / 365) : Math.round(n / 36.5) / 10).toLocaleString('en-US') + ' yr';
  // ชื่อสถานะชุดเดียวกับการ์ดด้านบน (Order now / Stockout risk / Next review / Planned) และปุ่มกรอง
  const SPILL = {
    risk:        ['#a855f7',       '⚫ Stockout risk'],
    order_now:   ['var(--red)',    '🔴 Order now'],
    next_review: ['#d4a017',       '🟡 Next review'],
    planned:     ['var(--green)',  '✅ Planned'],
    ok:          ['var(--text2)',  '🟢 OK'],
    watch:       ['var(--text3)',  'No reorder'],
    nosale:      ['var(--text3)',  'No sales'],
  };
  const URG = { risk: 0, order_now: 1, next_review: 2, planned: 3, ok: 4, nosale: 5, watch: 6 };
  function statusKey(r) {
    if (r.plan_mode !== 'plan') return 'watch';
    if (!(+r.avg_day > 0)) return stockAll(r) > 0 ? 'nosale' : 'ok';
    return meetKey(r) || 'ok';
  }
  function statusCell(r) {
    const k = statusKey(r), [c, t] = SPILL[k];
    let sub = '';
    if (k === 'risk' || k === 'planned' || k === 'ok') {
      const pc = planCalc(r);
      if (k === 'risk') return `<span class="sup-pill" style="--c:${c};">Stockout risk ~${fmtN(pc.gapDays)} d</span><div class="sup-sub">Runs out before WIP arrives</div>`;
      if (k === 'planned' && pc.newEnd) sub = `Until <b style="color:var(--accent2,var(--accent));">${dY(iso(pc.newEnd))}</b>`;
      if (k === 'ok' && pc.poQty && pc.withPoEnd) sub = `With WIP: until ${dY(iso(pc.withPoEnd))}`;
    }
    const tt = t.replace(/^[^A-Za-z]+\s/, '');   // (2026-11-10) ป้ายสี แทนอีโมจิ + ตัวหนังสือสี
    return `<span class="sup-pill${k === 'watch' || k === 'nosale' ? ' mute' : ''}" style="--c:${c};">${tt}</span>` + (sub ? `<div class="sup-sub">${sub}</div>` : '');
  }

  function cols() {
    return [['parent_sku', 'Product'], ['lt', 'LT'], ['cover_days', 'Days of cover'], ['on_hand', 'On hand'], ['on_order', 'Incoming'],
      ['avg_day', 'Avg/day'], ['po_due_date', 'Order by'], ['plan_qty', 'Forecast'], ['plan_end', 'Status']];
  }

  // แถวหัวกลุ่ม (Parent ที่มี ≥ 2 สี/เบอร์) — ชื่อ · Lead time · On hand รวม
  function groupRow(parent, rs) {
    const stk = rs.reduce((t, r) => t + stockAll(r), 0);
    const lts = [...new Set(rs.map(r => +r.lt || 60))].sort((a, b) => a - b);
    const ltTxt = lts.length === 1 ? `${lts[0]} d` : `${lts[0]}–${lts[lts.length - 1]} d`;
    const isCol = collapseAll ? !collapsed.has(parent) : collapsed.has(parent);
    const nAct = rs.filter(r => ['risk', 'order_now'].includes(statusKey(r))).length;   // Order now + Stockout risk
    return `<tr class="sup-group" data-parent="${esc(parent)}" title="กดเพื่อ${isCol ? 'ขยาย' : 'ย่อ'}สี/เบอร์ของ ${esc(parent)}">
      <td class="t-left"><span class="sup-caret">${isCol ? '▸' : '▾'}</span><span class="sup-parent">${esc(parent)}</span> <span class="sup-pname">${esc(rs[0].parent_name || '')}</span>
        <div class="sup-sub" style="padding-left:16px;">${rs.length} SKU${nAct ? ` · <span style="color:var(--red);font-weight:600;">Action ${nAct}</span>` : ''}</div></td>
      <td class="t-center"><span class="sup-lt">${ltTxt}</span></td>
      <td></td>
      <td>${stk ? `<b style="font-size:13px;">${fmtN(stk)}</b>` : '<span class="sup-dash">—</span>'}</td>
      <td></td><td></td><td></td><td></td><td></td>
    </tr>`;
  }

  function renderTable() {
    const list = filtered(), COLS = cols();
    const grouping = sort.key === 'parent_sku';
    const groupSize = {}; if (grouping) list.forEach(r => { groupSize[r.parent_sku] = (groupSize[r.parent_sku] || 0) + 1; });
    const isCollapsed = p => grouping && groupSize[p] >= 2 && (collapseAll ? !collapsed.has(p) : collapsed.has(p));
    const head = COLS.map(([k, l]) => `<th data-k="${esc(k)}">${esc(l)}${colTip(k)}</th>`).join('');   // (2026-09-29) หน้านี้ไม่ให้กดเรียง — เรียงตาม Parent SKU เสมอ
    let lastParent = null;
    const today0 = toD(iso(new Date()));
    const body = list.length ? list.map(r => {
      const planned = r.plan_mode === 'plan';
      const _stk = stockAll(r), _hold = HOLD[r.sku] || 0, _wip = wipQty(r.sku);
      const _avg = +r.avg_day || 0;
      const cov = _avg > 0 ? Math.floor(_stk / _avg) : null;
      const _soDate = _avg > 0 ? iso(new Date(today0.getTime() + cov * DAY)) : null;
      const _wipList = OPEN_PO[r.sku] || [];
      const _callQty = _wipList.filter(x => String(x.note || '').includes('call-off')).reduce((t, x) => t + x.q, 0);
      const _nextWip = _wipList.filter(x => !String(x.note || '').includes('call-off') && !x.nodate).map(x => x.eta).sort()[0];
      const _nodateQty = _wipList.filter(x => x.nodate).reduce((t, x) => t + x.q, 0);
      const _pc = planned ? planCalc(r) : null;
      const _needBy = _nodateQty && _pc ? _pc.needBy : null;
      const sk = statusKey(r);
      // Days of cover 3 สี: แดง = น้อยกว่า LT + รอบประชุม (รอรอบหน้าค่อยสั่งไม่ทัน) · เขียว = ปกติ · ฟ้า = เกิน 180 วัน · No reorder ไม่ขึ้นแดง/เขียว
      const _lt = +r.lt || 60;
      const covCol = cov == null ? 'var(--text3)' : cov > 180 ? '#60a5fa' : !planned ? 'var(--text3)' : cov < _lt + REVIEW_DAYS ? 'var(--red)' : 'var(--green)';
      const covPct = cov == null ? 0 : Math.max(4, Math.min(100, Math.round(cov / 200 * 100)));
      const tr = r.trend_7_vs_30;
      const newGroup0 = grouping && r.parent_sku !== lastParent;
      const grouped = grouping && groupSize[r.parent_sku] >= 2;
      const groupHead = grouped && newGroup0 ? groupRow(r.parent_sku, list.filter(x => x.parent_sku === r.parent_sku)) : '';
      lastParent = r.parent_sku;
      if (isCollapsed(r.parent_sku)) return groupHead;
      const due = planned && _pc && _pc.orderBy ? iso(_pc.orderBy) : null;
      const dueIn = due ? daysFrom(due) : null;
      // Incoming: จำนวนกำลังผลิต + วันเข้า (ETA จริงจากจัดซื้อ) / ยังไม่มีวันจากจัดซื้อ / ยอดรอเรียกผลิต
      let inc = '<span class="sup-dash">—</span>';
      if (_wip) {
        const lines = [];
        if (_nextWip) lines.push(`ETA ${dY(_nextWip)}`);
        if (_nodateQty) lines.push(_callQty ? `<span class="sup-calloff" title="ยอดคงเหลือ PO ที่ยังไม่ได้เรียกผลิต — ถ้าเรียกวันนี้ได้ของในราว 30 วัน">Call-off${_callQty !== _wip ? ' ' + fmtN(_callQty) : ''}</span>` : '<span title="จัดซื้อยังไม่ได้ลงวันคาดว่าจะผลิตเสร็จในไฟล์ PO">No ETA yet</span>');
        if (_needBy) lines.push(`Need by ${dY(iso(_needBy))}`);
        inc = `<b>${fmtN(_wip)}</b>${lines.map(x => `<div class="sup-sub">${x}</div>`).join('')}`;
      }
      const pc2 = planCells(r).split('</td>');
      return groupHead + `<tr class="sup-row${planned ? '' : ' sup-noplan'}${grouped ? ' sup-child' : ''}" data-sku="${esc(r.sku)}" style="cursor:pointer;${selSku === r.sku ? 'background:var(--bg3);' : ''}">
        <td class="t-left"><span class="sup-code">${esc(r.sku)}</span>${r.abc ? `<span class="sup-abc" title="${r.abc} = ${ABC_TXT[r.abc] || ''} · ${r.xyz} = ${XYZ_TXT[r.xyz] || ''}">${r.abc}${r.xyz}</span>` : ''}
          <div class="sup-nm">${esc(r.product_name)}</div></td>
        <td class="t-center"><span class="sup-lt${r.has_params === false ? ' def' : ''}"${r.has_params === false ? ' title="ยังไม่ได้ตั้งในหน้า Admin — ใช้ค่ากลาง 60 วัน"' : ''}>${fmtN(_lt)} d</span></td>
        <td class="sup-runc">${cov == null ? '<span class="sup-dash">—</span>' : (() => {   // (2026-11-10) แถบอายุสต็อก: แถบแดงจาง = ช่วง Lead time + รอบประชุม · แถบสี = ของที่มีพอขาย · ลายขีด = ของกำลังผลิต (WIP) ต่อจากนั้น
            const SC = 180, pctOf = d => Math.max(0, Math.min(100, d / SC * 100));
            const zone = pctOf(_lt + REVIEW_DAYS), fill = Math.max(cov > 0 ? 2 : 0, pctOf(cov));
            const wEnd = r.stockout_date_with_po && _wip ? daysFrom(r.stockout_date_with_po) : null, wip = wEnd != null && wEnd > cov ? pctOf(wEnd) - fill : 0;
            return `<div class="sup-runt"><b style="color:${covCol};">${covTxt(cov)}</b><span>Out ${dY(_soDate)}</span></div>
              <div class="sup-run" title="แถบแดงจาง = Lead time ${_lt} d + รอบประชุม ${REVIEW_DAYS} d · แถบสี = ของที่มีพอขาย ${fmtN(cov)} วัน${wip ? ' · ลายขีด = ของกำลังผลิตพอขายต่อถึง ' + dY(r.stockout_date_with_po) : ''} · เต็มแถบ = 6 เดือน"><i class="z" style="width:${zone}%"></i><i class="f" style="width:${fill}%;background:${covCol};"></i>${wip > 0 ? `<i class="w" style="left:${fill}%;width:${wip}%;"></i>` : ''}${cov > SC ? '<i class="more">›</i>' : ''}</div>`; })()}</td>
        <td>${_stk ? `<b style="font-size:13px;">${fmtN(_stk)}</b>` : '<span class="sup-dash">—</span>'}${_hold ? `<div class="sup-sub">WH ${fmtN(r.on_hand)} · Hold ${fmtN(_hold)}</div>` : ''}</td>
        <td>${inc}</td>
        <td>${!_avg ? '<span class="sup-dash">—</span>' : fmtN(_avg, _avg < 10 ? 1 : 0)}${tr == null || !_avg ? '' : `<div class="sup-sub" title="7 วันล่าสุด เทียบเฉลี่ย 30 วัน">${tr > 0 ? '▲' : tr < 0 ? '▼' : ''} ${fmtN(Math.abs(tr * 100))}%</div>`}</td>
        <td>${!due ? '<span class="sup-dash">—</span>' : `<b style="color:${dueIn < 0 ? 'var(--red)' : dueIn <= 30 ? 'var(--orange)' : 'var(--text)'};">${dY(due)}</b><div class="sup-sub"${dueIn < 0 ? ' style="color:var(--red);"' : ''}>${dueIn < 0 ? fmtN(-dueIn) + ' d late' : 'in ' + fmtN(dueIn) + ' d'}</div>`}</td>
        ${pc2[0]}</td>
        <td class="t-left">${statusCell(r)}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="${COLS.length}" class="empty">ไม่มี SKU ตรงตัวกรอง</td></tr>`;
    { const host = document.getElementById('supTbl'); let n = host.nextElementSibling;
      while (n && n.classList && n.classList.contains('auto-pager')) { const x = n.nextElementSibling; n.remove(); n = x; } }
    document.getElementById('supTbl').innerHTML = `<table class="sticky-head-table sup-main" data-no-page data-no-sort><colgroup><col style="width:15%;"><col style="width:6%;">${`<col style="width:${(79 / (COLS.length - 2)).toFixed(3)}%;">`.repeat(COLS.length - 2)}</colgroup><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    document.getElementById('supFoot').textContent = `${fmtN(list.length)} SKU · as of ${dY(DATA.as_of)} · กดแถวเพื่อดูกราฟ`;
    bindPlanInputs();
    document.querySelectorAll('.sup-group').forEach(tr => tr.onclick = () => { const p = tr.dataset.parent; if (collapsed.has(p)) collapsed.delete(p); else collapsed.add(p); renderTable(); });
    document.querySelectorAll('.sup-row').forEach(tr => tr.onclick = () => { selSku = tr.dataset.sku; document.querySelectorAll('.sup-row').forEach(x => x.style.background = x.dataset.sku === selSku ? 'var(--bg3)' : ''); loadSku(selSku); document.getElementById('supSkuCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  // ===== (2026-09-29) ตาราง "สต็อกแยกคลัง" — เจ้าของแต่ละช่องทางดูของในคลังตัวเอง + พอขายกี่วัน (จากของที่ขายออกจากคลังนั้น 30 วัน) =====
  let LOC_USE = null, locOnlyLow = false, locQ = '';
  const CH_LOCS = ['Online', 'TikTok', 'Marketplace', 'Dealer', 'Modern trade'];
  const LOC_LABEL = { 'Online': 'Online', 'TikTok': 'TikTok', 'Marketplace': 'Marketplace', 'Dealer': 'Dealer', 'Modern trade': 'Modern trade',
    '01 - 111/53': '111/53', '02 - 44/1': '44/1', '03 - พระราม2': 'Rama 2', '04 - บ้านแม่': 'Ban Mae', '05 - ETC.': 'ETC' };
  // สีประจำช่องทาง (ชุดเดียวกับหน้าแรก: Facebook ฟ้า · Shopee ส้ม · ตัวแทน เทา · MT เหลือง · TikTok ชมพู ให้เห็นชัดทั้งธีมมืด/สว่าง)
  // (2026-10-19) สีคลังตามสีช่องทางชุดเดียวทั้งเว็บ (Online = Facebook · Marketplace = Shopee)
  const CH_COL = { 'Online': 'var(--ch-facebook)', 'TikTok': 'var(--ch-tiktok)', 'Marketplace': 'var(--ch-shopee)', 'Dealer': 'var(--ch-dealer)', 'Modern trade': 'var(--ch-mt)' };
  const LOC_LOW = 14;   // ป้ายแดง = พอขายไม่ถึง 14 วัน (ตรงกับปุ่มกรอง)
  async function loadLocUse() { if (LOC_USE) return; try { LOC_USE = await supaRpc('supply_loc_usage', { p_days: 30 }) || {}; } catch (e) { LOC_USE = {}; console.warn('supply_loc_usage', e.message); } }
  function locCover(r, loc) { const q = (r.by_loc || {})[loc] || 0, u = ((LOC_USE || {})[r.sku] || {})[loc] || 0; return u > 0 ? Math.floor(q / (u / 30)) : null; }
  function renderLocTable() {
    const host = document.getElementById('supLocTbl'); if (!host) return;
    if (!LOC_USE) { host.innerHTML = '<div class="empty">กำลังโหลด…</div>'; loadLocUse().then(renderLocTable); return; }
    const locs = locList().map(l => l.location);
    const other = locs.filter(l => !CH_LOCS.includes(l));
    const q = locQ.trim().toLowerCase();
    let list = rows.filter(r => (showHidden || r.plan_mode !== 'hidden') && (stockAll(r) > 0 || Object.keys((LOC_USE || {})[r.sku] || {}).length)
      && (!q || r.sku.toLowerCase().includes(q) || String(r.parent_sku || '').toLowerCase().includes(q) || String(r.product_name || '').toLowerCase().includes(q)));
    const low = r => CH_LOCS.some(l => { const c = locCover(r, l); return c != null && ((r.by_loc || {})[l] || 0) > 0 && c < LOC_LOW; });
    if (locOnlyLow) list = list.filter(low);
    list.sort((a, b) => String(a.parent_sku).localeCompare(String(b.parent_sku)) || String(a.sku).localeCompare(String(b.sku)));
    const chs = CH_LOCS.filter(l => locs.includes(l));
    const nCol = 3 + chs.length + other.length;
    const EMPTY = '<span class="sl-empty">–</span>';
    const cellCh = (r, l, i) => {
      const qn = (r.by_loc || {})[l] || 0, used = ((LOC_USE || {})[r.sku] || {})[l] || 0, c = locCover(r, l);
      if (qn <= 0) return `<td class="sl-c${i === 0 ? ' sl-sep' : ''}">${EMPTY}</td>`;   // 0 = เว้นว่างเหมือนช่องอื่น
      // (2026-11-10) บรรทัดเดียว: จำนวน + พอขายกี่วัน (เล็ก) · พอขายไม่ถึง 14 วัน = ช่องแดง
      const lowC = used > 0 && c < LOC_LOW;
      return `<td class="sl-c${i === 0 ? ' sl-sep' : ''}${lowC ? ' sl-low' : ''}"${used > 0 ? ` title="ขายออกจากคลังนี้ ${fmtN(used)} ชิ้นใน 30 วัน → พอขาย ${covTxt(c)}"` : ''}><span class="sl-q">${fmtN(qn)}</span>${used > 0 ? `<span class="sl-dd">${covTxt(c)}</span>` : ''}</td>`;
    };
    const cellSt = (r, l, i) => { const qn = (r.by_loc || {})[l] || 0; return `<td class="sl-c${i === 0 ? ' sl-sep' : ''}">${qn ? `<div class="sl-q">${fmtN(qn)}</div>` : EMPTY}</td>`; };
    const gSize = {}; list.forEach(r => { gSize[r.parent_sku] = (gSize[r.parent_sku] || 0) + 1; });
    // (2026-09-30) ยอดรวมของ Parent (ทุกสี/เบอร์) แยกตามคลัง — โชว์ในแถวหัวกลุ่ม
    const gSum = {}; list.forEach(r => { const g = (gSum[r.parent_sku] = gSum[r.parent_sku] || { loc: {}, hold: 0, total: 0 });
      locs.forEach(l => { g.loc[l] = (g.loc[l] || 0) + ((r.by_loc || {})[l] || 0); }); g.hold += HOLD[r.sku] || 0; g.total += stockAll(r); });
    const sumCell = (v, i) => `<td class="sl-c${i === 0 ? ' sl-sep' : ''}">${v ? `<div class="sl-q">${fmtN(v)}</div>` : EMPTY}</td>`;
    let last = null;
    const body = list.map(r => {
      const grouped = gSize[r.parent_sku] >= 2;   // หัวกลุ่มเฉพาะ Parent ที่มี ≥ 2 สี/เบอร์ (แบบเดียวกับตารางบน)
      const g = gSum[r.parent_sku];
      const sep = grouped && r.parent_sku !== last ? `<tr class="sl-par"><td class="t-left"><span class="sup-parent">${esc(r.parent_sku)}</span> <span class="sup-pname">${esc(r.parent_name || '')}</span> <span class="sup-sub" style="display:inline;">· ${gSize[r.parent_sku]} SKU</span></td>
        <td class="sl-c sl-totc"><div class="sl-q sl-tot">${fmtN(g.total)}</div></td>
        ${chs.map((l, i) => sumCell(g.loc[l], i)).join('')}${other.map((l, i) => sumCell(g.loc[l], i)).join('')}${sumCell(g.hold, 0)}</tr>` : '';
      last = r.parent_sku;
      const hold = HOLD[r.sku] || 0;
      return sep + `<tr class="${grouped ? 'sup-child' : ''}"><td class="t-left"><div class="sl-pn"><span class="sup-code">${esc(r.sku)}</span><span class="sl-nm">${esc(r.product_name)}</span></div></td>
        <td class="sl-c sl-totc">${stockAll(r) ? `<div class="sl-q sl-tot">${fmtN(stockAll(r))}</div>` : EMPTY}</td>
        ${chs.map((l, i) => cellCh(r, l, i)).join('')}
        ${other.map((l, i) => cellSt(r, l, i)).join('')}
        <td class="sl-c sl-sep">${hold ? `<div class="sl-q">${fmtN(hold)}</div>` : EMPTY}</td></tr>`;
    }).join('') || `<tr><td colspan="${nCol}" class="empty">ไม่มีรายการ</td></tr>`;
    const chHead = chs.map((l, i) => `<th class="sl-c${i === 0 ? ' sl-sep' : ''}"><span class="sl-dot" style="background:${CH_COL[l] || 'var(--accent)'};"></span>${esc(LOC_LABEL[l] || l)}</th>`).join('');
    const otHead = other.map((l, i) => `<th class="sl-c${i === 0 ? ' sl-sep' : ''}">${esc(LOC_LABEL[l] || l)}</th>`).join('');
    const colg = `<colgroup><col style="width:20%;">${`<col style="width:${(80 / (nCol - 1)).toFixed(3)}%;">`.repeat(nCol - 1)}</colgroup>`;   // คอลัมน์ตัวเลขกว้างเท่ากันทุกช่อง
    host.innerHTML = `<table class="sticky-head-table sup-loc" data-no-page data-no-sort>${colg}<thead>
        <tr class="sl-grp"><th rowspan="2" class="sl-prod">Product</th><th rowspan="2" class="sl-c sl-totc">Total</th>
          <th colspan="${chs.length}" class="sl-g sl-g-ch sl-sep">Channel stock · 111/53</th>
          <th colspan="${other.length}" class="sl-g sl-g-st sl-sep">Storage</th>
          <th rowspan="2" class="sl-c sl-sep">Factory Hold</th></tr>
        <tr class="sl-names">${chHead}${otHead}</tr></thead><tbody>${body}</tbody></table>`;
  }

  function exportCsv() {
    const list = filtered(), locs = locList();
    const cols0 = ['parent_sku', 'sku', 'product_name', 'plan_mode', 'abc', 'xyz', 'lt', 'on_hand'];
    const cols1 = ['on_order', 'next_eta', 'avg7', 'avg30', 'avg90', 'avg_day', 'cover_days', 'ss_days', 'deadline_days', 'warn_days', 'po_due_date', 'order_status', 'stockout_date', 'stockout_date_with_po', 'safety_stock', 'reorder_point', 'target_stock', 'suggested_qty', 'lt', 'review', 'moq', 'pack', 'supplier'];
    const header = [...cols0, ...locs.map(l => 'คลัง ' + l.location), ...cols1];
    const q = v => v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v;
    const csv = [header.map(q).join(','), ...list.map(r => [
      ...cols0.map(c => q(r[c])),
      ...locs.map(l => (r.by_loc || {})[l.location] || 0),
      ...cols1.map(c => q(r[c]))
    ].join(','))].join('\n');
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

  // (2026-11-10) การ์ดกราฟ SKU แบบใหม่ — เดิมกราฟ 2 แกน (แท่งขาย + เส้นสต็อก + ROP) ดูงง · ตัวเลขข้างบนเป็นคำเก่า (ROP / แนะสั่ง / สายแล้ว) ไม่ตรงกับตาราง
  //   ใหม่: แถวตัวเลขชุดเดียวกับตาราง (On hand · Avg/day · Days of cover · LT · Order by · Incoming · Status)
  //   กราฟ 1 = สต็อก (แกนเดียว): 90 วันที่ผ่านมา (เส้นทึบ) → คาดการณ์ (เส้นประ) นับ PO ตามวันของเข้า · WIP ไม่มีวัน = เข้าตอนของหมด (กติกาเดียวกับตาราง)
  //            เส้นตั้ง: Today · Order by · Out · จุด PO เข้า   กราฟ 2 (เล็ก) = ยอดขายต่อวัน 90 วัน
  function renderSku(d) {
    const r = rows.find(x => x.sku === d.sku) || {}, k = statusKey(r);
    const stk = stockAll(r), hold = HOLD[r.sku] || 0, avg = +r.avg_day || 0, lt = +r.lt || 60;
    const today0 = toD(iso(new Date())), cov = avg > 0 ? Math.floor(stk / avg) : null;
    const so = cov != null ? iso(new Date(today0.getTime() + cov * DAY)) : null;
    const pc = r.plan_mode === 'plan' && avg > 0 ? planCalc(r) : null, due = pc && pc.orderBy ? iso(pc.orderBy) : null, dueIn = due ? daysFrom(due) : null;
    const pos = OPEN_PO[r.sku] || [], wip = pos.reduce((t, x) => t + x.q, 0), etaNext = pos.filter(x => !x.nodate).map(x => x.eta).sort()[0];
    const covCol = cov == null ? 'var(--text3)' : cov > 180 ? '#60a5fa' : r.plan_mode !== 'plan' ? 'var(--text)' : cov < lt + REVIEW_DAYS ? 'var(--red)' : 'var(--green)';
    const f = (l, v, sub) => `<div><span>${l}</span><b>${v}</b>${sub ? `<i>${sub}</i>` : ''}</div>`;
    const locs = Object.entries(r.by_loc || {}).filter(([, q]) => q > 0).sort((a, b) => b[1] - a[1]).map(([L, q]) => `${esc(LOC_LABEL[L] || L)} <b>${fmtN(q)}</b>`).join(' · ');
    document.getElementById('supSkuTitle').innerHTML = `${esc(r.product_name || d.sku)} <span style="font-size:12px;font-weight:500;color:var(--text3);margin-left:6px;">${esc(d.sku)}${r.abc ? ' · ' + r.abc + r.xyz : ''}</span>`;
    document.getElementById('supSkuBody').innerHTML = `
      <div class="sup-facts">
        ${f('Status', statusCell(r).replace(/<div class="sup-sub">.*$/s, ''))}
        ${f('On hand', stk ? fmtN(stk) : '—', hold ? `WH ${fmtN(r.on_hand)} · Hold ${fmtN(hold)}` : '')}
        ${f('Avg/day', avg ? fmtN(avg, avg < 10 ? 1 : 0) : '—')}
        ${f('Days of cover', cov == null ? '—' : `<span style="color:${covCol};">${covTxt(cov)}</span>`, so ? 'Out ' + dY(so) : '')}
        ${f('Lead time', lt + ' d')}
        ${f('Order by', due ? `<span style="color:${dueIn < 0 ? 'var(--red)' : dueIn <= 30 ? 'var(--orange)' : 'var(--text)'};">${dY(due)}</span>` : '—', due ? (dueIn < 0 ? fmtN(-dueIn) + ' d late' : 'in ' + fmtN(dueIn) + ' d') : '')}
        ${f('Incoming', wip ? fmtN(wip) : '—', wip ? (etaNext ? 'ETA ' + dY(etaNext) : 'No ETA yet') : '')}
      </div>
      ${locs ? `<div class="sup-locline">Stock by location: ${locs}</div>` : ''}
      <div class="sup-ch-h"><b>Stock</b><span>ผ่านมา 90 วัน · คาดการณ์ต่อจากวันนี้</span></div>
      <div class="chart-wrap" style="height:280px;"><canvas id="supChart"></canvas></div>
      <div id="supLegend" class="sup-leg"></div>
      <div class="sup-ch-h" style="margin-top:14px;"><b>Sales / day</b><span>ยอดขายจริงต่อวัน 90 วันที่ผ่านมา</span></div>
      <div class="chart-wrap" style="height:110px;"><canvas id="supChart2"></canvas></div>`;
    drawChart(d, { r, stk, avg, so, due, pos });
  }

  let chart2 = null;
  function drawChart(d, ctx) {
    ctx = ctx || {}; const s = d.series || [], r = ctx.r || {}, avg = ctx.avg || 0;
    const tick = chartTickColor(), grid = chartGridColor(), css = v => getComputedStyle(document.body).getPropertyValue(v).trim();
    const C_STOCK = css('--accent') || '#c8a96e', C_RED = css('--red') || '#ef4444', C_OR = css('--orange') || '#f59e0b', C_GREEN = css('--green') || '#22c55e';
    // คาดการณ์: จากสต็อกวันนี้ (ทุกคลัง + Hold) ลดวันละ Avg/day · PO มีวัน = บวกวันของเข้า · WIP ไม่มีวัน = บวกตอนของหมด · ไปจนหมดหลัง PO สุดท้าย (สูงสุด 365 วัน)
    const t0 = toD(iso(new Date())), posD = (ctx.pos || []).filter(x => !x.nodate).map(x => ({ d: x.eta, q: x.q })), noDate = (ctx.pos || []).filter(x => x.nodate).reduce((t, x) => t + x.q, 0);
    const lastPo = posD.map(x => x.d).sort().pop();
    const fut = [], futL = [], poMark = {}; let st = ctx.stk || 0, nd = noDate;
    for (let i = 0; i <= 365 && avg > 0; i++) {
      const di = iso(new Date(t0.getTime() + i * DAY));
      posD.filter(x => x.d === di).forEach(x => { st += x.q; poMark[di] = (poMark[di] || 0) + x.q; });
      if (st <= 0 && nd > 0) { st += nd; poMark[di] = (poMark[di] || 0) + nd; nd = 0; }
      futL.push(di); fut.push(Math.max(0, Math.round(st)));
      if (st <= 0 && i > 30 && (!lastPo || di > lastPo) && nd <= 0) break;
      st -= avg;
    }
    if (!futL.length) { futL.push(iso(t0)); fut.push(ctx.stk || 0); }
    const past = s.filter(x => x.d < futL[0]);
    const labels = [...past.map(x => x.d), ...futL], np = past.length;
    const pastSt = [...past.map(x => Number(x.stock)), fut[0]];
    const idx = dd => dd ? labels.indexOf(dd) : -1;
    const marks = [[idx(futL[0]), 'Today', tick], [idx(ctx.due), 'Order by', C_OR], [idx(ctx.so), 'Out', C_RED]].filter(m => m[0] >= 0);
    const vlines = { id: 'supV', afterDatasetsDraw(c) { const { ctx: g, chartArea: a, scales: { x } } = c; g.save(); g.font = "600 10.5px Sarabun, sans-serif";
      marks.forEach(([i, t, col], j) => { const px = x.getPixelForValue(i); g.strokeStyle = col; g.setLineDash([4, 3]); g.lineWidth = 1; g.beginPath(); g.moveTo(px, a.top); g.lineTo(px, a.bottom); g.stroke();
        g.setLineDash([]); g.fillStyle = col; g.textAlign = px > a.right - 60 ? 'right' : 'left'; g.fillText(t, px + (g.textAlign === 'left' ? 4 : -4), a.top + 10 + j * 13); });
      Object.entries(poMark).forEach(([di, q]) => { const i = idx(di); if (i < 0) return; const px = x.getPixelForValue(i); g.fillStyle = C_GREEN; g.textAlign = 'center'; g.fillText('PO +' + fmtN(q), px, a.bottom - 6); });
      g.restore(); } };
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('supChart'), {
      type: 'line',
      data: { labels, datasets: [
        { label: 'Stock (past 90 days)', data: [...pastSt, ...Array(Math.max(0, futL.length - 1)).fill(null)], borderColor: C_STOCK, backgroundColor: 'transparent', borderWidth: 2.2, pointRadius: 0, tension: .15, spanGaps: true },
        { label: 'Projected stock', data: [...Array(np).fill(null), ...fut], borderColor: C_STOCK, borderDash: [6, 4], borderWidth: 2, pointRadius: 0, tension: 0, stepped: false },
      ] },
      options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { titleFont: { family: 'Sarabun' }, bodyFont: { family: 'Sarabun' }, filter: it => it.raw != null,
          callbacks: { title: it => dY(it[0].label), label: it => `${it.dataset.label}: ${fmtN(it.raw)}`, afterBody: it => { const q = poMark[it[0].label]; return q ? `PO เข้า +${fmtN(q)}` : ''; } } } },
        scales: { x: { grid: { display: false }, ticks: { color: tick, font: { family: 'Sarabun', size: 10 }, maxTicksLimit: 10, callback: (v, i) => dY(labels[i]) } },
          y: { beginAtZero: true, grid: { color: grid }, ticks: { color: tick, font: { family: 'Sarabun', size: 10 }, callback: v => fmtN(v) }, title: { display: true, text: 'ชิ้น', color: tick, font: { family: 'Sarabun', size: 10 } } } } },
      plugins: [vlines]
    });
    const lg = document.getElementById('supLegend');
    if (lg) lg.innerHTML = `<span><i style="background:${C_STOCK};height:2px;width:16px;"></i>Stock 90 วันที่ผ่านมา</span><span><i style="border-top:2px dashed ${C_STOCK};width:16px;"></i>คาดการณ์ (ขายวันละ ${fmtN(avg, avg < 10 ? 1 : 0)} · นับ PO ตามวันของเข้า)</span><span><i style="border-top:1px dashed ${C_OR};width:16px;"></i>Order by</span><span><i style="border-top:1px dashed ${C_RED};width:16px;"></i>Out (ของเดิมหมด)</span>`;
    if (chart2) chart2.destroy();
    chart2 = new Chart(document.getElementById('supChart2'), {
      type: 'bar', data: { labels: s.map(x => x.d), datasets: [{ label: 'Sales / day', data: s.map(x => Number(x.sales) || 0), backgroundColor: 'rgba(148,163,184,.55)', borderRadius: 2, maxBarThickness: 10 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, tooltip: { titleFont: { family: 'Sarabun' }, bodyFont: { family: 'Sarabun' }, callbacks: { title: it => dY(it[0].label), label: it => `ขาย ${fmtN(it.raw)} ชิ้น` } } },
        scales: { x: { grid: { display: false }, ticks: { color: tick, font: { family: 'Sarabun', size: 10 }, maxTicksLimit: 8, callback: (v, i) => dY(s[i] && s[i].d) } },
          y: { beginAtZero: true, grid: { color: grid }, ticks: { color: tick, font: { family: 'Sarabun', size: 10 }, maxTicksLimit: 3, callback: v => fmtN(v) } } } }
    });
  }

  // เรียกจาก dashboard.html ตอนกดเมนู / สลับธีม
  window.renderSupplyPage = function () { if (DATA) { renderAll(); if (selSku && lastSeries) renderSku(lastSeries); } else load(); };
})();
