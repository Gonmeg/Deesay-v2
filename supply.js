// supply.js — หน้า Supply Chain ของ dashboard.html (โหลดตอนกดเมนูครั้งแรกเท่านั้น)
// ใช้ของกลางจาก dashboard.html: supaRpc, fmtDateISO, chartTickColor/chartGridColor, Chart.js, CSS (.card/.section-header/.table-wrap/.btn/.ls-input)
// RPC: supply_chain_page() จาก 55_supply_rpc_v2.sql + supply_sku_series(p_sku, p_days) จาก 48_supply_rpc.sql
// v2 (2026-09-09): เพิ่มคอลัมน์รหัสแม่ + เรียงตามรหัสแม่ · สต็อกแยกรายคลัง (ปุ่มสลับ) · ตัดเรื่องเงิน/ต้นทุนออกทั้งหมด · เพิ่ม ⓘ อธิบายศัพท์ · หัวตารางเป็น Sarabun
(function () {
  const fmtN = (n, d = 0) => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toLocaleString('th-TH', { maximumFractionDigits: d, minimumFractionDigits: d });
  const dTH = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—';
  const daysFrom = d => d ? Math.round((new Date(d + 'T00:00:00').getTime() - Date.now()) / 86400000) : null;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const STATUS = {
    stockout: ['var(--red)', 'ขาดสต็อก'], late: ['var(--red)', 'สายแล้ว'], reorder: ['var(--orange)', 'ต้องสั่งรอบนี้'],
    ok: ['var(--green)', 'ปกติ'], overstock: ['var(--blue)', 'สต็อกจม'], dead: ['var(--text3)', 'ไม่เคลื่อนไหว'], inactive: ['var(--text3)', 'เลิกขาย'],
  };
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
    return `<span style="position:relative;display:inline-block;vertical-align:middle;">`
      + `<span onclick="window._supInfo('${id}')" style="cursor:pointer;color:var(--text3);font-size:13px;font-weight:400;font-family:'Sarabun',sans-serif;padding:0 4px;">&#9432;</span>`
      + `<div id="${id}" class="sup-info" style="display:none;position:absolute;top:24px;${align === 'right' ? 'right:0;' : 'left:0;'}background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px 16px;font-size:12.5px;line-height:1.8;width:380px;max-width:min(380px,82vw);z-index:200;box-shadow:0 6px 22px rgba(0,0,0,.45);color:var(--text2);font-weight:400;text-align:left;white-space:normal;font-family:'Sarabun',sans-serif;text-transform:none;letter-spacing:normal;">${html}</div></span>`;
  }
  const T = (a, b) => `<div style="margin-bottom:9px;"><b style="color:var(--text);">${a}</b><br>${b}</div>`;
  const GLOSSARY = ''
    + T('ตัวเลขตั้งต้น 4 ตัว', '<b>ขายได้อีกกี่วัน</b> = สต็อก ÷ ขาย/วัน<br><b>LT</b> = สั่งแล้วกี่วันของถึง<br><b>เผื่อ</b> = ของกันไว้เผื่อวันคึก<br><b>รอบสั่ง</b> = ประชุมสต็อกทุกกี่วัน (ตั้งไว้ 14 วัน)<br><br>ทุกตัวเลขในตารางมาจาก 4 ตัวนี้ทั้งหมด')
    + T('เส้นตาย กับ เส้นเตือน', '<b>เส้นตาย = LT + เผื่อ</b> — ของเหลือน้อยกว่านี้ แปลว่าสั่งวันนี้ก็ไม่ทัน<br><b>เส้นเตือน = LT + เผื่อ + รอบสั่ง</b> — ต่ำกว่านี้ต้องเปิด PO ในประชุมรอบนี้ ไม่งั้นรอบหน้าจะเลยเส้นตายไปแล้ว<br><br>ตัวอย่าง LT 60 · เผื่อ 10 · รอบสั่ง 14 → เส้นตาย 74 วัน เส้นเตือน 88 วัน')
    + T('ขายได้อีก / วันหมด', 'ของที่มีจะขายได้อีกกี่วัน และวันที่คาดว่าจะหมด · แถบสีใต้ตัวเลข: <span style="color:var(--red);">แดง</span> = ต่ำกว่าเส้นตาย · <span style="color:var(--orange);">ส้ม</span> = ต่ำกว่าเส้นเตือน · <span style="color:var(--blue);">ฟ้า</span> = เกิน 180 วัน (ของจม)')
    + T('เผื่อ (วัน)', 'ของกันไว้เผื่อวันที่ขายดีเกินคาด คิดเป็นวัน<br><br>ของที่ยอดเหวี่ยงเยอะเผื่อมาก ของที่ขายนิ่งเผื่อน้อย · ตัวทำเงินหลัก (กลุ่ม A) เผื่อมากกว่าตัวขายน้อย (กลุ่ม C)<br><br>เพดานสูงสุด 14 วัน — กันเคสตัวแทนสั่งทีเดียวก้อนใหญ่ ซึ่งทำให้ระบบเข้าใจผิดว่ายอดเหวี่ยงโหดแล้วเผื่อบาน')
    + T('ต้องเปิด PO ภายใน', '<b>= วันที่ของจะหมด − เส้นตาย</b><br><br>วันสุดท้ายที่เปิด PO แล้วของยังมาทัน · เรียงคอลัมน์นี้จากน้อยไปมาก = ได้ลิสต์ PO ของรอบประชุมทันที<br><br><span style="color:var(--red);">แดง</span> = เลยกำหนดแล้ว · <span style="color:var(--orange);">ส้ม</span> = ภายใน 30 วัน')
    + T('แนะสั่ง / ROP', '<b>แนะสั่ง</b> (ตัวใหญ่สีทอง) = สั่งเท่าไร = ของที่ควรมีให้พอขายถึงรอบสั่งหน้า ลบของที่มีอยู่ ลบ PO ค้าง แล้วปัดขึ้นตามแพ็คและ MOQ<br><br><b>ROP</b> (Re-Order Point, ตัวเล็ก) = เมื่อไรต้องสั่ง = สต็อกลดถึงตัวเลขนี้คือต้องสั่งแล้ว<br><br>สั้น ๆ: ROP บอก<b>เมื่อไร</b> · แนะสั่งบอก<b>เท่าไร</b>')
    + T('ขาย/วัน', 'ถ่วงน้ำหนัก 7 วันล่าสุด 50% + 30 วัน 30% + 90 วัน 20% — ให้ของใหม่มีน้ำหนักมากกว่า และ<b>ตัดวันที่มีโปรออก</b> (ต้องกรอกปฏิทินโปรก่อน ตอนนี้ยังไม่มีข้อมูลโปร จึงยังไม่มีการตัด)')
    + T('7 vs 30 วัน', 'ยอด 7 วันล่าสุดเทียบค่าเฉลี่ย 30 วัน — เขียวคือมาแรง แดงคือกำลังตก · ตัวเลขนี้<b>ไม่ได้เข้าสูตร</b> มีไว้เตือนตาเราเอง เพราะระบบไม่ได้มองแนวโน้มขาขึ้น')
    + T('PO ค้าง', 'ของที่สั่งไปแล้วยังไม่เข้าคลัง (จากใบ PO ที่ยังไม่ปิด) วันที่ข้างล่างคือ ETA')
    + T('สถานะทั้ง 7 แบบ', 'เช็คจากบนลงล่าง เข้าอันไหนก่อนหยุดตรงนั้น<br><br>1. <b>เลิกขาย</b> — ตั้งไว้ในหน้า Admin<br>2. <b>ไม่เคลื่อนไหว</b> — มีของ แต่ 90 วันขายได้ 0<br>3. <span style="color:var(--red);"><b>ขาดสต็อก</b></span> — ของเหลือ 0 แต่ยังขายอยู่<br>4. <span style="color:var(--red);"><b>สายแล้ว</b></span> — ขายได้อีก < เส้นตาย (สั่งวันนี้ก็ไม่ทัน ต้องเร่งโรงงาน)<br>5. <span style="color:var(--orange);"><b>ต้องสั่งรอบนี้</b></span> — ขายได้อีก < เส้นเตือน (ยังทัน แต่ต้องเปิด PO วันนี้)<br>6. <span style="color:var(--blue);"><b>สต็อกจม</b></span> — ขายได้อีกเกิน 180 วัน (เงินจม + เสี่ยงหมดอายุ)<br>7. <span style="color:var(--green);"><b>ปกติ</b></span> — ไม่เข้าข้อไหนเลย')
    + T('ไม่สั่งซ้ำแล้ว', 'สินค้าที่ตั้งไว้ในหน้า Admin ว่าจะไม่สั่งผลิตอีก — ยังดูการเคลื่อนไหวได้ครบ แต่ช่อง เผื่อ / ต้องเปิด PO / แนะสั่ง / LT เป็นขีด และไม่ถูกนับในการ์ดเตือน<br><br>ที่ตั้งเป็น <b>ซ่อน</b> จะไม่แสดงเลย กดปุ่ม 👁 เพื่อดูชั่วคราวได้')
    + T('ข้อจำกัดที่ต้องรู้', '1. LT ยังเป็นค่ากลาง 60 วันเกือบทุกตัว (ตัวที่มี * ) — LT อยู่ในทุกสูตร ถ้าไม่ตรงความจริง ตัวเลขทั้งแถวจะเพี้ยน<br>2. ระบบไม่มองแนวโน้มขาขึ้น-ขาลง และไม่มองฤดูกาล<br>3. สินค้าใหม่ที่ขายมายังไม่ถึง 90 วันจะถูกประเมินต่ำกว่าจริง<br>4. ยอดส่งตัวแทนถูกนับรวมกับยอดขายปลีก');
  const ABC_INFO = ''
    + T('ABC — แบ่งตามความสำคัญของยอดขาย', 'เรียงสินค้าตามยอดขาย 90 วันจากมากไปน้อยแล้วไล่สะสม<br><b>A</b> = กลุ่มที่รวมกันได้ 80% แรกของยอดขาย (ตัวทำเงิน ห้ามขาด)<br><b>B</b> = 15% ถัดมา<br><b>C</b> = 5% สุดท้าย (ตัวหางยาว สั่งเท่าที่จำเป็น)')
    + T('XYZ — แบ่งตามความคาดเดาได้', 'ดูว่ายอดขายรายสัปดาห์ 12 สัปดาห์แกว่งแค่ไหน<br><b>X</b> = ขายสม่ำเสมอ ทำนายง่าย<br><b>Y</b> = แกว่งปานกลาง<br><b>Z</b> = แกว่งมาก เดายาก (มักเป็นของที่ขายทีละล็อตใหญ่นาน ๆ ที)')
    + T('เอาไปใช้ยังไง', '<b>AX</b> = ตัวหลักที่คาดเดาได้ → ต้องมีของตลอด ไม่ต้องเผื่อเยอะ<br><b>AZ</b> = ตัวหลักแต่เดายาก → ต้องเผื่อ safety stock มากที่สุด<br><b>CZ</b> = ขายน้อยและเดายาก → อย่าตุน สั่งตามออเดอร์');

  let DATA = null, rows = [], filt = { status: '', abc: '', xyz: '', q: '' },
      sort = { key: 'parent_sku', dir: 1 }, showLoc = false, showHidden = false,
      selSku = null, chart = null, lastSeries = null, seq = 0;

  function root() { return document.getElementById('page-supply'); }
  function locList() { return (DATA && DATA.locations) ? DATA.locations : []; }

  async function load() {
    const el = root(); if (!el) return;
    const mySeq = ++seq;
    if (!DATA) el.innerHTML = '<div class="card"><div class="empty">กำลังโหลดแผนสต็อก...</div></div>';
    let data;
    try { data = await supaRpc('supply_chain_page', {}); }
    catch (e) { el.innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)} — ถ้าขึ้น "function not found" แปลว่ายังไม่ได้รัน 55_supply_rpc_v2.sql</div>`; return; }
    if (mySeq !== seq) return;
    if (data && data.message && !data.rows) { el.innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(data.message)}</div>`; return; }
    DATA = data; rows = data.rows || [];
    renderAll();
    if (selSku) loadSku(selSku);
  }

  function matchStatus(r) {
    if (!filt.status) return true;
    if (filt.status === 'need') return ['stockout', 'late', 'reorder'].includes(r.status);
    if (filt.status === 'soon') return r.plan_mode === 'plan' && r.po_due_date && daysFrom(r.po_due_date) >= 0 && daysFrom(r.po_due_date) <= 30;
    if (filt.status === 'hot') return r.plan_mode === 'plan' && r.trend_7_vs_30 > 0.3 && r.cover_days != null && r.cover_days < r.lt;
    if (filt.status === 'suggest') return r.suggested_qty > 0;
    return r.status === filt.status;
  }
  function filtered() {
    const q = filt.q.trim().toLowerCase();
    let out = rows.filter(r => (showHidden || r.plan_mode !== 'hidden') && matchStatus(r) && (!filt.abc || r.abc === filt.abc) && (!filt.xyz || r.xyz === filt.xyz)
      && (!q || r.sku.toLowerCase().includes(q) || String(r.parent_sku || '').toLowerCase().includes(q) || String(r.product_name || '').toLowerCase().includes(q)));
    const k = sort.key;
    out = [...out].sort((a, b) => {
      let x = a[k], y = b[k];
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
    if (ledgerAge > 2) banners.push(['var(--orange)', `⚠️ log ทีมแพ็คล่าสุดคือ ${dTH(d.ledger_last)} (${ledgerAge} วันก่อน) — สต็อกที่เห็นอาจไม่ใช่ปัจจุบัน เช็ค cron sync-inventory-log ในหน้าสถานะระบบ`]);
    if (salesAge > 3) banners.push(['var(--orange)', `⚠️ ยอดขายล่าสุดคือ ${dTH(d.sales_last)} (${salesAge} วันก่อน) — ค่าเฉลี่ยขาย/วันจะต่ำกว่าจริงจนกว่าจะอัปโหลดออเดอร์`]);
    const urgent = rows.filter(r => r.plan_mode === 'plan' && (r.status === 'stockout' || r.status === 'late'));
    if (urgent.length) banners.push(['var(--red)', `⛔ ${urgent.length} SKU ขาดแล้วหรือสั่งไม่ทันแล้ว: ${urgent.slice(0, 8).map(r => `<b>${esc(r.sku)}</b>${r.cover_days != null ? ` (${r.cover_days} วัน)` : ''}`).join(', ')}${urgent.length > 8 ? ` และอีก ${urgent.length - 8}` : ''}`]);
    if (k.no_params > 0) banners.push(['var(--accent)', `🛠 ${k.no_params} SKU ยังไม่ได้ตั้ง lead time / MOQ — ใช้ค่ากลาง 60 วันไปก่อน (ตั้งค่าได้ที่หน้า Admin → แท็บ Supply Chain)`]);

    const P = rows.filter(r => r.plan_mode === 'plan');
    const nNeed = P.filter(r => ['stockout', 'late', 'reorder'].includes(r.status)).length;
    const nLate = P.filter(r => r.status === 'late').length;
    const nOut = P.filter(r => r.status === 'stockout').length;
    const nSoon = P.filter(r => r.po_due_date && daysFrom(r.po_due_date) >= 0 && daysFrom(r.po_due_date) <= 30).length;
    const nHot = P.filter(r => r.trend_7_vs_30 > 0.3 && r.cover_days != null && r.cover_days < r.lt).length;
    const stuck = rows.filter(r => r.plan_mode !== 'hidden' && r.status === 'overstock');
    const stuckUnits = stuck.reduce((s2, r) => s2 + (+r.on_hand || 0), 0);
    const nDead = rows.filter(r => r.plan_mode !== 'hidden' && r.status === 'dead').length;
    const deadUnits = rows.filter(r => r.plan_mode !== 'hidden' && r.status === 'dead').reduce((s2, r) => s2 + (+r.on_hand || 0), 0);
    const kpis = [
      ['ต้องเปิด PO รอบนี้', `<span style="color:${nNeed ? 'var(--red)' : 'var(--green)'};">${fmtN(nNeed)} SKU</span>`,
        `ขาดแล้ว ${fmtN(nOut)} · สายแล้ว ${fmtN(nLate)} · ถึงเส้นเตือน ${fmtN(nNeed - nOut - nLate)}`, 'need'],
      ['ต้องเปิด PO ภายใน 30 วัน', `<span style="color:${nSoon ? 'var(--orange)' : 'var(--text)'};">${fmtN(nSoon)} SKU</span>`,
        'ยังไม่ถึงเส้นเตือน แต่วันเปิด PO อยู่ในเดือนนี้', 'soon'],
      ['ยอดพุ่งแต่ของไม่พอ', `<span style="color:${nHot ? 'var(--orange)' : 'var(--text)'};">${fmtN(nHot)} SKU</span>`,
        'ยอดโตเกิน 30% และของเหลือน้อยกว่าเวลารอของ', 'hot'],
      ['สต็อกจม', `<span style="color:var(--blue);">${fmtN(stuck.length)} SKU</span>`,
        `ของพอขายเกิน 180 วัน · รวม ${fmtN(stuckUnits)} ชิ้น`, 'overstock'],
      ['ไม่เคลื่อนไหว', `<span style="color:var(--text3);">${fmtN(nDead)} SKU</span>`,
        `90 วันไม่มียอดขาย · ค้างอยู่ ${fmtN(deadUnits)} ชิ้น`, 'dead'],
      ['สต็อกรวมที่แสดง', `${fmtN(k.on_hand_total)} ชิ้น`, 'ไม่รวมที่ตั้งเป็นซ่อน', ''],
    ];
    const cellOf = (a, x) => m.find(c => c.abc === a && c.xyz === x) || { n: 0 };
    const locs = locList();
    root().innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        <div style="font-size:11.5px;color:var(--text3);">สต็อกจาก log ทีมแพ็ค · ความต้องการจากยอดขายจริง · คำนวณใหม่ทุกคืน 04:00 · แผน ณ <b>${dTH(d.as_of)}</b> · log ล่าสุด ${dTH(d.ledger_last)} · ยอดขายล่าสุด ${dTH(d.sales_last)}</div>
        <button class="btn btn-ghost" id="supRefresh">↻ รีเฟรช</button>
      </div>
      ${banners.map(([c, t]) => `<div style="padding:10px 14px;border-radius:8px;margin-bottom:10px;font-size:12px;color:${c};background:color-mix(in srgb, ${c} 10%, transparent);border:1px solid color-mix(in srgb, ${c} 30%, transparent);">${t}</div>`).join('')}

      <div class="sup-top">
        <div class="sup-kpis" id="supKpis">
          ${kpis.map(([l, v, s, f]) => `<div class="card sup-kpi" data-f="${f}" style="cursor:${f ? 'pointer' : 'default'};${f && filt.status === f ? 'border-color:var(--accent);' : ''}"><div class="card-title">${l}</div><div class="kpi-value" style="font-size:21px;">${v}</div><div class="kpi-sub" style="display:block;">${s}</div></div>`).join('')}
        </div>
        <div class="card sup-abc">
          <div class="section-header"><div class="section-title">ABC × XYZ ${infoIcon('supAbc', ABC_INFO, 'right')}</div><span style="font-size:10.5px;color:var(--text3);">กดช่องเพื่อกรอง</span></div>
          <div style="display:grid;grid-template-columns:auto repeat(3,1fr);gap:6px;font-size:12px;">
            <div></div>${['X', 'Y', 'Z'].map(x => `<div style="font-size:10px;color:var(--text3);text-align:center;line-height:1.4;">${x}<br>${XYZ_TXT[x]}</div>`).join('')}
            ${['A', 'B', 'C'].map(a => `<div style="font-size:10px;color:var(--text3);line-height:1.4;align-self:center;">${a}<br>${ABC_TXT[a]}</div>` + ['X', 'Y', 'Z'].map(x => { const c = cellOf(a, x); const on = filt.abc === a && filt.xyz === x; return `<div class="sup-cell" data-a="${a}" data-x="${x}" style="background:var(--bg3);border:1px solid ${on ? 'var(--accent)' : 'var(--border)'};border-radius:8px;padding:10px 6px;text-align:center;cursor:pointer;"><b style="display:block;font-size:16px;">${fmtN(c.n)}</b><span style="font-size:10px;color:var(--text3);">SKU</span></div>`; }).join('')).join('')}
          </div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:12px;line-height:1.6;">AX ควรมีของตลอด · AZ ต้องเผื่อมากที่สุด · CZ อย่าตุน — กด &#9432; ข้างหัวข้อเพื่อดูคำอธิบายเต็ม</div>
        </div>
      </div>

      <div class="card">
        <div class="section-header">
          <div class="section-title">สต็อกสินค้า ${infoIcon('supGloss', GLOSSARY)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
            <input type="text" class="ls-input" id="supQ" placeholder="🔎 Parent SKU / SKU / ชื่อสินค้า" value="${esc(filt.q)}" style="width:210px;padding:6px 10px;font-size:12px;">
            <select class="ls-input" id="supStatus" style="width:170px;flex:0 0 auto;padding:6px 10px;font-size:12px;"><option value="">ทุกสถานะ</option><option value="need">ต้องเปิด PO รอบนี้</option><option value="soon">เปิด PO ภายใน 30 วัน</option><option value="hot">ยอดพุ่งแต่ของไม่พอ</option>${Object.entries(STATUS).map(([k2, v]) => `<option value="${k2}">${v[1]}</option>`).join('')}</select>
            <button class="btn btn-ghost" id="supLocToggle" style="${showLoc ? 'background:var(--accent);color:#0a0a0f;border-color:var(--accent);' : ''}">🏭 แยกคลัง</button>
            <button class="btn btn-ghost" id="supHiddenToggle" style="${showHidden ? 'background:var(--accent);color:#0a0a0f;border-color:var(--accent);' : ''}" title="สินค้าที่ตั้งเป็น ซ่อน ในหน้า Admin">👁 ที่ซ่อนไว้${d.hidden_count ? ' (' + fmtN(d.hidden_count) + ')' : ''}</button>
            <button class="btn btn-ghost" id="supClear">✕ ล้าง</button>
            <button class="btn btn-ghost" id="supExport">⬇ Export CSV</button>
          </div>
        </div>
        <div class="table-wrap" id="supTbl" style="max-height:600px;overflow:auto;"></div>
        <div id="supFoot" style="font-size:10.5px;color:var(--text3);margin-top:10px;"></div>
      </div>

      <div class="card" id="supSkuCard">
        <div class="section-header"><div class="section-title" id="supSkuTitle">กราฟ SKU</div><span style="font-size:10.5px;color:var(--text3);">กดแถวในตารางเพื่อดู ยอดขาย · ของออก · สต็อก · จุดสั่ง · คาดการณ์ 60 วัน</span></div>
        <div id="supSkuBody"><div class="empty">เลือก SKU จากตารางด้านบน</div></div>
      </div>
      <style>
        /* หน้านี้ใช้ Sarabun ทั้งหมด เว้นรหัสสินค้าที่คงเป็น monospace ให้อ่านรหัสง่าย */
        #page-supply .card-title { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:12px; font-weight:600; color:var(--text2); margin-bottom:8px; }
        #page-supply .section-title { font-family:'Sarabun',sans-serif; }
        #page-supply .sup-top { display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:16px; align-items:start; margin-bottom:18px; }
        #page-supply .sup-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        #page-supply .sup-kpi { display:flex; flex-direction:column; justify-content:space-between; min-width:0; padding:16px 18px; }
        #page-supply .sup-kpi .kpi-sub { font-size:11px; color:var(--text3); margin-top:8px; line-height:1.45; }
        #page-supply .sup-abc { align-self:stretch; }

        #page-supply table { width:100%; border-collapse:collapse; }
        #page-supply th { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:11.5px; font-weight:600;
          color:var(--text2); padding:10px 14px; white-space:nowrap; text-align:right; position:sticky; top:0; background:var(--bg2); z-index:3; }
        #page-supply th:nth-child(1), #page-supply th:nth-child(2) { text-align:left; }
        #page-supply th[data-k="abc"], #page-supply th[data-k="status"] { text-align:center; }
        #page-supply td { padding:10px 14px; font-size:12.5px; text-align:right; vertical-align:middle;
          font-variant-numeric:tabular-nums; white-space:nowrap; border-top:1px solid var(--border); }
        #page-supply td.t-left { text-align:left; }
        #page-supply td.t-center { text-align:center; }
        #page-supply tbody tr:hover td { background:var(--bg3); }
        #page-supply .sup-parent { font-family:'IBM Plex Mono',monospace; font-size:11.5px; font-weight:700; color:var(--accent); }
        #page-supply .sup-skucode { font-family:'IBM Plex Mono',monospace; font-size:11.5px; font-weight:600; }
        #page-supply .sup-sub { font-size:10px; color:var(--text3); line-height:1.4; margin-top:2px; font-variant-numeric:normal; }
        #page-supply .sup-chip { display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:10.5px; font-weight:600;
          padding:3px 8px; border-radius:6px; background:var(--bg3); border:1px solid var(--border); color:var(--text2); }
        #page-supply .sup-bar { height:3px; border-radius:2px; background:var(--bg3); margin:4px 0 0 auto; width:56px; overflow:hidden; }
        #page-supply .sup-bar i { display:block; height:100%; border-radius:2px; }
        #page-supply .sup-dash { color:var(--text3); }
        @media (max-width:1200px){ #page-supply .sup-top { grid-template-columns:1fr; } #page-supply .sup-kpis { grid-template-columns:repeat(3,1fr); } }
        @media (max-width:800px){ #page-supply .sup-kpis { grid-template-columns:repeat(2,1fr); } }
      </style>`;

    renderTable();
    document.getElementById('supRefresh').onclick = () => { DATA = null; load(); };
    document.getElementById('supQ').oninput = e => { filt.q = e.target.value; renderTable(); };
    const st = document.getElementById('supStatus'); st.value = filt.status; st.onchange = e => { filt.status = e.target.value; renderAll(); };
    document.getElementById('supClear').onclick = () => { filt = { status: '', abc: '', xyz: '', q: '' }; renderAll(); };
    document.getElementById('supExport').onclick = exportCsv;
    document.getElementById('supLocToggle').onclick = () => { showLoc = !showLoc; renderAll(); };
    document.getElementById('supHiddenToggle').onclick = () => { showHidden = !showHidden; renderAll(); };
    document.querySelectorAll('#supKpis .card[data-f]').forEach(el => { const f = el.dataset.f; if (!f) return; el.onclick = () => { filt.status = filt.status === f ? '' : f; renderAll(); }; });
    document.querySelectorAll('.sup-cell').forEach(el => el.onclick = () => { const a = el.dataset.a, x = el.dataset.x; if (filt.abc === a && filt.xyz === x) { filt.abc = ''; filt.xyz = ''; } else { filt.abc = a; filt.xyz = x; } renderAll(); });
    if (selSku && lastSeries) renderSku(lastSeries);
  }

  function cols() {
    const c = [['parent_sku', 'Parent SKU'], ['sku', 'SKU'], ['abc', 'ABC·XYZ'], ['on_hand', 'สต็อกรวม']];
    if (showLoc) locList().forEach(l => c.push(['loc:' + l.location, l.location]));
    return c.concat([['on_order', 'PO ค้าง'], ['avg_day', 'ขาย/วัน'], ['trend_7_vs_30', '7 vs 30 วัน'],
      ['cover_days', 'ขายได้อีก / วันหมด'], ['ss_days', 'เผื่อ (วัน)'], ['po_due_date', 'ต้องเปิด PO ภายใน'],
      ['suggested_qty', 'แนะสั่ง / ROP'], ['lt', 'LT'], ['status', 'สถานะ']]);
  }

  function renderTable() {
    const list = filtered(), COLS = cols(), locs = locList();
    const head = COLS.map(([k, l]) => `<th class="sortable-th" data-k="${esc(k)}"${k.indexOf('loc:') === 0 ? ' style="font-size:10.5px;"' : ''}>${esc(l)}${sort.key === k ? `<span class="sort-arrow">${sort.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('');
    let lastParent = null;
    const body = list.length ? list.map(r => {
      const [c, t] = STATUS[r.status] || ['var(--text3)', r.status];
      const planned = r.plan_mode === 'plan';
      const cov = r.cover_days;
      const covCol = cov == null ? 'var(--text3)'
        : cov < r.deadline_days ? 'var(--red)'
        : cov < r.warn_days ? 'var(--orange)'
        : cov > 180 ? 'var(--blue)' : 'var(--text)';
      const covPct = cov == null ? 0 : Math.max(4, Math.min(100, Math.round(cov / 200 * 100)));
      const tr = r.trend_7_vs_30;
      const sameParent = sort.key === 'parent_sku' && r.parent_sku === lastParent;
      const newGroup = sort.key === 'parent_sku' && !sameParent;
      lastParent = r.parent_sku;
      const dueIn = r.po_due_date ? daysFrom(r.po_due_date) : null;
      const dueCol = dueIn == null ? 'var(--text3)' : dueIn < 0 ? 'var(--red)' : dueIn <= 30 ? 'var(--orange)' : 'var(--text2)';
      const locTds = showLoc ? locs.map(l => { const q = (r.by_loc || {})[l.location] || 0; return `<td class="${q ? '' : 'sup-dash'}" style="font-size:11.5px;">${q ? fmtN(q) : '·'}</td>`; }).join('') : '';
      return `<tr class="sup-row" data-sku="${esc(r.sku)}" style="cursor:pointer;${selSku === r.sku ? 'background:var(--bg3);' : ''}${newGroup ? 'border-top:2px solid var(--border2);' : ''}">
        <td class="t-left">${sameParent ? '' : `<span class="sup-parent">${esc(r.parent_sku)}</span><div class="sup-sub">${esc(r.parent_name || '')}</div>`}</td>
        <td class="t-left"><span class="sup-skucode">${esc(r.sku)}</span><div class="sup-sub">${esc(r.product_name)}</div>${planned ? '' : '<div class="sup-sub" style="color:var(--orange);">ไม่สั่งซ้ำแล้ว</div>'}</td>
        <td class="t-center"><span class="sup-chip">${r.abc}${r.xyz}</span></td>
        <td><b style="font-size:13px;">${fmtN(r.on_hand)}</b></td>
        ${locTds}
        <td>${r.on_order ? fmtN(r.on_order) + (r.next_eta ? `<div class="sup-sub">เข้า ${dTH(r.next_eta)}</div>` : '') : '<span class="sup-dash">—</span>'}</td>
        <td>${fmtN(r.avg_day, 1)}</td>
        <td style="color:${tr == null ? 'var(--text3)' : tr > 0.2 ? 'var(--green)' : tr < -0.2 ? 'var(--red)' : 'var(--text2)'};">${tr == null ? '—' : (tr > 0 ? '+' : '') + fmtN(tr * 100) + '%'}</td>
        <td>${cov == null ? '<span class="sup-dash">—</span>' : `<b style="color:${covCol};">${fmtN(cov)}</b> <span class="sup-sub" style="display:inline;">วัน</span>
          <div class="sup-bar"><i style="width:${covPct}%;background:${covCol};"></i></div>
          ${r.stockout_date ? `<div class="sup-sub">หมด ${dTH(r.stockout_date)}</div>` : ''}`}
        </td>
        <td>${r.ss_days == null || !planned ? '<span class="sup-dash">—</span>' : fmtN(r.ss_days, 1)}</td>
        <td>${!planned || !r.po_due_date ? '<span class="sup-dash">—</span>'
             : `<b style="color:${dueCol};">${dTH(r.po_due_date)}</b><div class="sup-sub">${dueIn < 0 ? 'เลยมา ' + fmtN(-dueIn) + ' วัน' : 'อีก ' + fmtN(dueIn) + ' วัน'}</div>`}</td>
        <td>${!planned ? '<span class="sup-dash">—</span>'
             : (r.suggested_qty ? `<b style="font-size:13px;color:var(--accent2);">${fmtN(r.suggested_qty)}</b>` : '<span class="sup-dash">—</span>')
               + (r.reorder_point != null ? `<div class="sup-sub">ROP ${fmtN(r.reorder_point)}</div>` : '')}</td>
        <td>${planned ? r.lt + (r.has_params ? '' : '<span class="sup-dash" title="ค่ากลาง ยังไม่ได้ตั้งในหน้า Admin">*</span>') : '<span class="sup-dash">—</span>'}</td>
        <td class="t-center">${pill(c, t)}</td></tr>`;
    }).join('') : `<tr><td colspan="${COLS.length}" class="empty">ไม่มี SKU ตรงตัวกรอง</td></tr>`;
    document.getElementById('supTbl').innerHTML = `<table class="sticky-head-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    const nWatch = list.filter(r => r.plan_mode === 'watch').length;
    document.getElementById('supFoot').textContent = `${fmtN(list.length)} SKU${nWatch ? ` · ${fmtN(nWatch)} ตัวตั้งเป็น "ไม่สั่งซ้ำแล้ว" (ยังดูการเคลื่อนไหวได้ แต่ไม่มีตัวเลขแนะสั่ง)` : ''} · เรียงตาม Parent SKU · LT* = ยังใช้ค่ากลาง 60 วัน · คลิกหัวคอลัมน์เพื่อเรียงใหม่`;
    document.querySelectorAll('#supTbl th[data-k]').forEach(th => th.onclick = () => { const k = th.dataset.k; if (sort.key === k) sort.dir = -sort.dir; else { sort.key = k; sort.dir = ['parent_sku', 'sku', 'abc', 'xyz', 'status', 'po_due_date'].indexOf(k) >= 0 ? 1 : -1; } renderTable(); });
    document.querySelectorAll('.sup-row').forEach(tr => tr.onclick = () => { selSku = tr.dataset.sku; document.querySelectorAll('.sup-row').forEach(x => x.style.background = x.dataset.sku === selSku ? 'var(--bg3)' : ''); loadSku(selSku); document.getElementById('supSkuCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  function exportCsv() {
    const list = filtered(), locs = locList();
    const cols0 = ['parent_sku', 'sku', 'product_name', 'plan_mode', 'abc', 'xyz', 'on_hand'];
    const cols1 = ['on_order', 'next_eta', 'avg7', 'avg30', 'avg90', 'avg_day', 'cover_days', 'ss_days', 'deadline_days', 'warn_days', 'po_due_date', 'stockout_date', 'stockout_date_with_po', 'safety_stock', 'reorder_point', 'target_stock', 'suggested_qty', 'lt', 'review', 'moq', 'pack', 'supplier', 'status'];
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

  function renderSku(d) {
    const p = d.plan || {}, r = rows.find(x => x.sku === d.sku) || {};
    const [c, t] = STATUS[p.status] || ['var(--text3)', p.status || '—'];
    const facts = [
      ['สถานะ', pill(c, t)], ['สต็อกขายได้', fmtN(p.on_hand) + ' ชิ้น'], ['ขาย/วัน', fmtN(p.avg_day, 1)], ['ขายได้อีก', r.cover_days != null ? fmtN(r.cover_days) + ' วัน' : '—'],
      ['คาดว่าหมด', p.stockout_date ? dTH(p.stockout_date) : '—'], ['ROP', fmtN(p.reorder_point)], ['ของเผื่อ', fmtN(p.safety_stock) + (r.ss_days != null ? ` (${fmtN(r.ss_days, 1)} วัน)` : '')], ['แนะสั่ง', p.suggested_qty ? fmtN(p.suggested_qty) + ' ชิ้น' : '—'],
      ['ต้องเปิด PO', r.po_due_date ? dTH(r.po_due_date) : '—'],
      ['lead time', `${p.lt ?? '—'} วัน`], ['PO ค้าง', p.on_order ? `${fmtN(p.on_order)} ชิ้น` : '—'],
    ];
    const byLoc = r.by_loc || {};
    const locs = Object.keys(byLoc).length
      ? Object.entries(byLoc).sort((a, b) => b[1] - a[1]).map(([L, qty]) => pill('var(--text3)', `${esc(L)} ${fmtN(qty)}`)).join(' ')
      : (d.by_location || []).map(l => pill('var(--text3)', `${esc(l.location)} ${fmtN(l.on_hand)}`)).join(' ');
    const po = (d.po || []).length ? `<div style="font-size:11px;margin-top:8px;">PO ค้าง: ${d.po.map(x => pill('var(--blue)', `${esc(x.po_no || '(ไม่มีเลข)')} ${fmtN(x.qty)} ชิ้น${x.eta ? ' เข้า ' + dTH(x.eta) : ' ไม่มี ETA'}`)).join(' ')}</div>` : '';
    document.getElementById('supSkuBody').innerHTML = `
      <div style="font-size:13px;margin-bottom:10px;"><b>${esc(r.product_name || d.sku)}</b> <span style="color:var(--text3);font-family:'IBM Plex Mono',monospace;font-size:11px;">${esc(r.parent_sku || '')} · ${esc(d.sku)}</span></div>
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
