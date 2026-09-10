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
    stockout: ['var(--red)', 'ขาดสต็อก'], stockout_before_po: ['var(--red)', 'จะขาดก่อนของเข้า'], reorder: ['var(--orange)', 'ถึงจุดสั่ง'],
    ok: ['var(--green)', 'ปกติ'], overstock: ['var(--blue)', 'เกินสต็อก'], dead: ['var(--text3)', 'ไม่เคลื่อนไหว'], inactive: ['var(--text3)', 'เลิกขาย'],
    watch: ['var(--text3)', 'ดูเฉย ๆ'], hidden: ['var(--text3)', 'ซ่อนไว้'],
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
    + T('รหัสแม่ / SKU', 'รหัสแม่คือสินค้าตัวเดียวกันทุกสี/เบอร์ (เช่น NDSP) · SKU คือรหัสแยกสี/เบอร์ (NDSP01, NDSP02) — สต็อกและแผนสั่งคิดที่ระดับ SKU เพราะเวลาสั่งของต้องระบุสี')
    + T('สต็อกรวม', 'ของคงเหลือที่ขายได้ รวมทุกคลัง คำนวณจาก log ทีมแพ็ค (ของเข้า + คืน + โอนเข้า − ขายออก − โอนออก) · กดปุ่ม <b>🏭 แยกคลัง</b> เพื่อดูว่าของอยู่ที่ไหนเท่าไร')
    + T('PO ค้าง', 'ของที่สั่งไปแล้วแต่ยังไม่เข้าคลัง (จากใบ PO ที่ยังไม่ปิด) วันที่ข้างล่างคือ ETA ที่คาดว่าจะเข้า')
    + T('ขาย/วัน', 'ยอดขายจริงเฉลี่ยต่อวัน ถ่วงน้ำหนัก 7 วันล่าสุด 50% · 30 วัน 30% · 90 วัน 20% และ<b>ตัดวันที่มีโปรออก</b> เพื่อไม่ให้วันโปรดันค่าเฉลี่ยสูงเกินจริง')
    + T('7 vs 30 วัน', 'ยอดขาย 7 วันล่าสุดเทียบกับค่าเฉลี่ย 30 วัน — เขียวคือกำลังมาแรง แดงคือกำลังตก ใช้เตือนว่าแผนที่คำนวณไว้อาจต้องปรับ')
    + T('พอใช้ (วัน)', 'ของที่มีจะขายได้อีกกี่วัน = สต็อก ÷ ขาย/วัน · <span style="color:var(--red);">แดง</span> = น้อยกว่า lead time (สั่งตอนนี้ก็ไม่ทัน) · <span style="color:var(--orange);">ส้ม</span> = พอถึงรอบสั่งหน้าแบบเฉียดฉิว')
    + T('LT (lead time)', 'สั่งของแล้วกี่วันของถึงคลัง ตั้งค่าต่อสินค้าได้ที่หน้า Admin แท็บ Supply Chain · ตัวที่มี <b>*</b> คือยังไม่ได้ตั้ง ใช้ค่ากลาง 60 วันไปก่อน')
    + T('safety stock (ของกันเหนียว)', 'ของสำรองเผื่อขายดีกว่าปกติหรือของเข้าช้า คิดจากความแกว่งของยอดของออกจริง 90 วัน คูณรากที่สองของ lead time — สินค้ากลุ่ม A เผื่อมาก (มั่นใจ 95%) กลุ่ม C เผื่อน้อย (80%)')
    + T('จุดสั่ง', 'สต็อกลดลงถึงตัวเลขนี้เมื่อไร = ต้องสั่งแล้ว = ยอดขายช่วงรอของ + safety stock')
    + T('แนะสั่ง', 'จำนวนที่ควรสั่งรอบนี้ = ยอดขายช่วง (lead time + รอบสั่ง) + safety stock − สต็อกที่มี − PO ค้าง แล้วปัดขึ้นตามจำนวนต่อแพ็คและ MOQ — เป้าหมายคือของพอขายโดยสต็อกไม่บวม')
    + T('โหมดการวางแผน (ตั้งที่หน้า Admin)', '<b>วางแผนปกติ</b> = คำนวณครบทุกอย่าง · <b>ดูเฉย ๆ</b> = ของที่ไม่สั่งต่อแล้วแต่ยังมีสต็อก แสดงให้เห็นว่าเหลือเท่าไร แต่ไม่คำนวณ forecast ไม่แนะให้สั่ง ไม่นับในตัวเลขเตือน · <b>ซ่อน</b> = ไม่แสดงในตาราง (กดปุ่ม 👁 เพื่อดูชั่วคราวได้)')
    + T('สถานะ', '<span style="color:var(--red);">ขาดสต็อก</span> = ไม่มีของแล้ว · <span style="color:var(--red);">จะขาดก่อนของเข้า</span> = ของหมดก่อน PO มาถึง · <span style="color:var(--orange);">ถึงจุดสั่ง</span> = ต้องสั่งแล้ว · <span style="color:var(--green);">ปกติ</span> · <span style="color:var(--blue);">เกินสต็อก</span> = ของพอเกิน lead time + รอบสั่ง + 60 วัน (เงินจม) · <span style="color:var(--text3);">ไม่เคลื่อนไหว</span> = มีของแต่ 90 วันไม่มียอดขาย');
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
    if (filt.status === 'need') return ['stockout', 'stockout_before_po', 'reorder'].includes(r.status);
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
    const urgent = rows.filter(r => r.status === 'stockout' || r.status === 'stockout_before_po');
    if (urgent.length) banners.push(['var(--red)', `⛔ ${urgent.length} SKU ขาดแล้วหรือจะขาดก่อนของเข้า: ${urgent.slice(0, 8).map(r => `<b>${esc(r.sku)}</b>${r.days_of_cover != null ? ` (${r.days_of_cover} วัน)` : ''}`).join(', ')}${urgent.length > 8 ? ` และอีก ${urgent.length - 8}` : ''}`]);
    if (k.no_params > 0) banners.push(['var(--accent)', `🛠 ${k.no_params} SKU ยังไม่ได้ตั้ง lead time / MOQ — ใช้ค่ากลาง 60 วันไปก่อน (ตั้งค่าได้ที่หน้า Admin → แท็บ Supply Chain)`]);

    const need = (k.stockout || 0) + (k.stockout_before_po || 0) + (k.reorder || 0);
    const kpis = [
      ['ต้องสั่งตอนนี้', `<span style="color:${need ? 'var(--red)' : 'var(--green)'};">${fmtN(need)} SKU</span>`, `ขาดแล้ว ${fmtN(k.stockout)} · จะขาดก่อนของเข้า ${fmtN(k.stockout_before_po)} · ถึงจุดสั่ง ${fmtN(k.reorder)}`, 'need'],
      ['จำนวนที่ควรสั่งรอบนี้', `${fmtN(k.suggested_units)} ชิ้น`, `จาก ${fmtN(k.suggested_skus)} SKU`, 'suggest'],
      ['สต็อกขายได้รวม', `${fmtN(k.on_hand_total)} ชิ้น`, `PO ค้างรับ ${fmtN(k.on_order_total)} ชิ้น`, ''],
      ['วันคงเหลือ (กลาง)', k.median_cover != null ? `${fmtN(k.median_cover)} วัน` : '—', 'ครึ่งหนึ่งของ SKU มีของพอเกินนี้', ''],
      ['เกินสต็อก', `<span style="color:var(--blue);">${fmtN(k.overstock)} SKU</span>`, 'ของพอเกิน lead time + รอบสั่ง + 60 วัน', 'overstock'],
      ['ไม่เคลื่อนไหว', `<span style="color:var(--text3);">${fmtN(k.dead)} SKU</span>`, 'มีของแต่ 90 วันไม่มียอดขาย', 'dead'],
    ];
    const cellOf = (a, x) => m.find(c => c.abc === a && c.xyz === x) || { n: 0 };
    const locs = locList();
    const locChips = locs.map(l => `<span style="display:inline-block;font-size:11.5px;padding:4px 10px;border-radius:99px;background:var(--bg3);border:1px solid var(--border);margin:0 6px 6px 0;white-space:nowrap;color:var(--text3);">${esc(l.location)} <b style="color:var(--text);">${fmtN(l.on_hand)}</b></span>`).join('');

    root().innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
        <div style="font-size:11.5px;color:var(--text3);">สต็อกจาก log ทีมแพ็ค · ความต้องการจากยอดขายจริง · คำนวณใหม่ทุกคืน 04:00 · แผน ณ <b>${dTH(d.as_of)}</b> · log ล่าสุด ${dTH(d.ledger_last)} · ยอดขายล่าสุด ${dTH(d.sales_last)}</div>
        <button class="btn btn-ghost" id="supRefresh">↻ รีเฟรช</button>
      </div>
      ${banners.map(([c, t]) => `<div style="padding:10px 14px;border-radius:8px;margin-bottom:10px;font-size:12px;color:${c};background:color-mix(in srgb, ${c} 10%, transparent);border:1px solid color-mix(in srgb, ${c} 30%, transparent);">${t}</div>`).join('')}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px;" id="supKpis">
        ${kpis.map(([l, v, s, f]) => `<div class="card" data-f="${f}" style="cursor:${f ? 'pointer' : 'default'};${f && filt.status === f ? 'border-color:var(--accent);' : ''}"><div class="card-title">${l}</div><div class="kpi-value" style="font-size:22px;">${v}</div><div class="kpi-sub" style="display:block;">${s}</div></div>`).join('')}
      </div>

      <div class="card" style="margin-bottom:20px;">
        <div class="section-header"><div class="section-title">สต็อกแยกตามคลัง</div><span style="font-size:10.5px;color:var(--text3);">รวมทุกคลัง ${fmtN(k.on_hand_total)} ชิ้น · ดูรายสินค้าได้ที่ปุ่ม 🏭 แยกคลัง ในตารางด้านล่าง</span></div>
        <div style="margin-top:8px;">${locChips || '<span style="color:var(--text3);font-size:12px;">—</span>'}</div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:16px;margin-bottom:20px;" class="sup-grid2">
        <div class="card">
          <div class="section-header">
            <div class="section-title">แผนเติมสต็อก ${infoIcon('supGloss', GLOSSARY)}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
              <input type="text" class="ls-input" id="supQ" placeholder="🔎 รหัสแม่ / SKU / ชื่อสินค้า" value="${esc(filt.q)}" style="width:200px;padding:6px 10px;font-size:12px;">
              <select class="ls-input" id="supStatus" style="width:170px;flex:0 0 auto;padding:6px 10px;font-size:12px;"><option value="">ทุกสถานะ</option><option value="need">ต้องสั่งตอนนี้</option>${Object.entries(STATUS).map(([k2, v]) => `<option value="${k2}">${v[1]}</option>`).join('')}</select>
              <button class="btn btn-ghost" id="supLocToggle" style="${showLoc ? 'background:var(--accent);color:#0a0a0f;border-color:var(--accent);' : ''}">🏭 แยกคลัง</button>
              <button class="btn btn-ghost" id="supHiddenToggle" style="${showHidden ? 'background:var(--accent);color:#0a0a0f;border-color:var(--accent);' : ''}" title="สินค้าที่ตั้งเป็น ซ่อน ในหน้า Admin">👁 ที่ซ่อนไว้${d.hidden_count ? ' (' + fmtN(d.hidden_count) + ')' : ''}</button>
              <button class="btn btn-ghost" id="supClear">✕ ล้าง</button>
              <button class="btn btn-ghost" id="supExport">⬇ Export CSV</button>
            </div>
          </div>
          <div class="table-wrap" id="supTbl" style="max-height:560px;overflow-y:auto;"></div>
          <div id="supFoot" style="font-size:10.5px;color:var(--text3);margin-top:8px;"></div>
        </div>
        <div class="card">
          <div class="section-header"><div class="section-title">ABC × XYZ ${infoIcon('supAbc', ABC_INFO, 'right')}</div><span style="font-size:10.5px;color:var(--text3);">กดช่องเพื่อกรอง</span></div>
          <div style="display:grid;grid-template-columns:auto repeat(3,1fr);gap:6px;font-size:12px;">
            <div></div>${['X', 'Y', 'Z'].map(x => `<div style="font-size:10px;color:var(--text3);text-align:center;">${x}<br>${XYZ_TXT[x]}</div>`).join('')}
            ${['A', 'B', 'C'].map(a => `<div style="font-size:10px;color:var(--text3);">${a}<br>${ABC_TXT[a]}</div>` + ['X', 'Y', 'Z'].map(x => { const c = cellOf(a, x); const on = filt.abc === a && filt.xyz === x; return `<div class="sup-cell" data-a="${a}" data-x="${x}" style="background:var(--bg3);border:1px solid ${on ? 'var(--accent)' : 'var(--border)'};border-radius:8px;padding:10px 6px;text-align:center;cursor:pointer;"><b style="display:block;font-size:16px;">${fmtN(c.n)}</b><span style="font-size:10px;color:var(--text3);">SKU</span></div>`; }).join('')).join('')}
          </div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:12px;line-height:1.6;">AX ควรมีของตลอด · AZ ต้องเผื่อมากที่สุด · CZ อย่าตุน — กด &#9432; ข้างหัวข้อเพื่อดูคำอธิบายเต็ม</div>
        </div>
      </div>
      <div class="card" id="supSkuCard">
        <div class="section-header"><div class="section-title" id="supSkuTitle">กราฟ SKU</div><span style="font-size:10.5px;color:var(--text3);">กดแถวในตารางเพื่อดู ยอดขาย · ของออก · สต็อก · จุดสั่ง · คาดการณ์ 60 วัน</span></div>
        <div id="supSkuBody"><div class="empty">เลือก SKU จากตารางด้านบน</div></div>
      </div>
      <style>
        /* หน้านี้ใช้ Sarabun ทั้งหมด (หัวตารางกลางเป็น monospace ตัวพิมพ์ใหญ่ อ่านภาษาไทยยาก) เว้นรหัสสินค้าที่คงเป็น monospace ให้อ่านรหัสง่าย */
        #page-supply .card-title { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:12px; font-weight:600; color:var(--text2); margin-bottom:8px; }
        #page-supply th { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:11.5px; font-weight:600; color:var(--text2); }
        #page-supply .section-title { font-family:'Sarabun',sans-serif; }
        #page-supply td { font-size:12.5px; }
        #page-supply #supKpis .card { display:flex; flex-direction:column; justify-content:space-between; min-width:0; }
        #page-supply #supKpis .kpi-sub { font-size:11px; color:var(--text3); margin-top:8px; line-height:1.4; }
        #page-supply .sup-locstock { color:var(--text3); font-size:11.5px; }
        #page-supply .sup-locstock.has { color:var(--text); }
        #page-supply .sup-num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
        #page-supply th { text-align:left; }
        #page-supply th[data-k="abc"] { text-align:center; }
        #page-supply th:not([data-k="parent_sku"]):not([data-k="abc"]):not([data-k="status"]) { text-align:right; }
        #page-supply td { padding:9px 10px; vertical-align:middle; }
        #page-supply .sup-sub { font-size:9.5px; color:var(--text3); line-height:1.4; margin-top:2px; }
        #page-supply .sup-chip { display:inline-block; font-family:'IBM Plex Mono',monospace; font-size:10.5px; font-weight:600; padding:2px 7px; border-radius:6px; background:var(--bg3); border:1px solid var(--border); color:var(--text2); }
        #page-supply .sup-bar { height:3px; border-radius:2px; background:var(--bg3); margin:3px 0 0 auto; width:52px; overflow:hidden; }
        #page-supply .sup-bar i { display:block; height:100%; border-radius:2px; }
        #page-supply .sup-sticky { position:sticky; left:0; background:var(--bg2); z-index:2; min-width:230px; }
        #page-supply tbody tr:hover .sup-sticky { background:var(--bg3); }
        #page-supply tbody tr:hover { background:var(--bg3); }
        @media (max-width:1000px){ .sup-grid2 { grid-template-columns:1fr !important; } }
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
    const c = [['parent_sku', 'รหัสแม่ / SKU'], ['abc', 'ABC·XYZ'], ['on_hand', 'สต็อกรวม']];
    if (showLoc) locList().forEach(l => c.push(['loc:' + l.location, l.location]));
    return c.concat([['on_order', 'PO ค้าง'], ['avg_day', 'ขาย/วัน'], ['trend_7_vs_30', '7 vs 30 วัน'],
      ['days_of_cover', 'พอใช้ / วันหมด'], ['suggested_qty', 'แนะสั่ง / จุดสั่ง'], ['lt', 'LT'], ['status', 'สถานะ']]);
  }

  function renderTable() {
    const list = filtered(), COLS = cols(), locs = locList();
    const head = COLS.map(([k, l]) => `<th class="sortable-th" data-k="${esc(k)}"${k.indexOf('loc:') === 0 ? ' style="font-size:10.5px;"' : ''}>${esc(l)}${sort.key === k ? `<span class="sort-arrow">${sort.dir > 0 ? '▲' : '▼'}</span>` : ''}</th>`).join('');
    let lastParent = null;
    const body = list.length ? list.map(r => {
      const [c, t] = STATUS[r.status] || ['var(--text3)', r.status];
      const planned = r.plan_mode === 'plan';
      const cov = r.days_of_cover;
      const covCol = !planned ? 'var(--text3)' : cov == null ? 'var(--text3)' : cov < r.lt ? 'var(--red)' : cov < r.lt + r.review ? 'var(--orange)' : 'var(--text)';
      const covPct = cov == null ? 0 : Math.max(4, Math.min(100, Math.round(cov / ((r.lt || 60) + (r.review || 30) + 60) * 100)));
      const tr = r.trend_7_vs_30;
      const sameParent = r.parent_sku === lastParent;
      const newGroup = sort.key === 'parent_sku' && !sameParent;
      lastParent = r.parent_sku;
      const dim = planned ? '' : 'opacity:.62;';
      const locTds = showLoc ? locs.map(l => { const q = (r.by_loc || {})[l.location] || 0; return `<td class="sup-num sup-locstock${q ? ' has' : ''}">${q ? fmtN(q) : '·'}</td>`; }).join('') : '';
      return `<tr class="sup-row" data-sku="${esc(r.sku)}" style="cursor:pointer;${dim}${selSku === r.sku ? 'background:var(--bg3);' : ''}${newGroup ? 'border-top:2px solid var(--border2);' : ''}">
        <td class="sup-sticky">
          ${(sort.key === 'parent_sku' && sameParent) ? '' : `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--accent);font-weight:700;">${esc(r.parent_sku)} <span style="color:var(--text3);font-family:'Sarabun',sans-serif;font-weight:400;">${esc(r.parent_name || '')}</span></div>`}
          <div style="${(sort.key === 'parent_sku' && sameParent) ? '' : 'padding-left:12px;'}display:flex;align-items:center;gap:6px;">
            <b style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;">${esc(r.sku)}</b>
            <span style="font-size:10.5px;color:var(--text3);">${esc(r.product_name)}</span>
          </div>
        </td>
        <td><span class="sup-chip">${r.abc}${r.xyz}</span></td>
        <td class="sup-num"><b style="font-size:13px;">${fmtN(r.on_hand)}</b></td>
        ${locTds}
        <td class="sup-num">${r.on_order ? fmtN(r.on_order) + (r.next_eta ? `<div class="sup-sub">เข้า ${dTH(r.next_eta)}</div>` : '') : '<span style="color:var(--text3);">—</span>'}</td>
        <td class="sup-num">${fmtN(r.avg_day, 1)}</td>
        <td class="sup-num" style="color:${tr == null ? 'var(--text3)' : tr > 0.2 ? 'var(--green)' : tr < -0.2 ? 'var(--red)' : 'var(--text2)'};">${tr == null ? '—' : (tr > 0 ? '+' : '') + fmtN(tr * 100) + '%'}</td>
        <td class="sup-num">
          ${cov == null ? '<span style="color:var(--text3);">—</span>' : `<b style="color:${covCol};">${fmtN(cov)}</b> <span class="sup-sub" style="display:inline;">วัน</span>
          <div class="sup-bar"><i style="width:${covPct}%;background:${covCol};"></i></div>
          <div class="sup-sub">${r.stockout_date ? 'หมด ' + dTH(r.stockout_date) : ''}</div>`}
        </td>
        <td class="sup-num">${r.suggested_qty ? `<b style="font-size:13px;color:var(--accent2);">${fmtN(r.suggested_qty)}</b>` : '<span style="color:var(--text3);">—</span>'}${r.reorder_point != null ? `<div class="sup-sub">จุดสั่ง ${fmtN(r.reorder_point)}</div>` : ''}</td>
        <td class="sup-num">${r.lt}${r.has_params ? '' : '<span style="color:var(--text3);" title="ค่ากลาง ยังไม่ได้ตั้งในหน้า Admin">*</span>'}</td>
        <td>${pill(c, t)}</td></tr>`;
    }).join('') : `<tr><td colspan="${COLS.length}" class="empty">ไม่มี SKU ตรงตัวกรอง</td></tr>`;
    document.getElementById('supTbl').innerHTML = `<table class="sticky-head-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    const nWatch = list.filter(r => r.plan_mode === 'watch').length;
    document.getElementById('supFoot').textContent = `${fmtN(list.length)} SKU${nWatch ? ` (ในนี้ ${fmtN(nWatch)} ตัวเป็น "ดูเฉย ๆ" ไม่คำนวณแผนสั่ง)` : ''} · เรียงตามรหัสแม่ · LT* = ยังใช้ค่ากลาง 60 วัน · คลิกหัวคอลัมน์เพื่อเรียงใหม่`;
    document.querySelectorAll('#supTbl th[data-k]').forEach(th => th.onclick = () => { const k = th.dataset.k; if (sort.key === k) sort.dir = -sort.dir; else { sort.key = k; sort.dir = ['parent_sku', 'sku', 'abc', 'xyz', 'status'].indexOf(k) >= 0 ? 1 : -1; } renderTable(); });
    document.querySelectorAll('.sup-row').forEach(tr => tr.onclick = () => { selSku = tr.dataset.sku; document.querySelectorAll('.sup-row').forEach(x => x.style.background = x.dataset.sku === selSku ? 'var(--bg3)' : ''); loadSku(selSku); document.getElementById('supSkuCard').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  }

  function exportCsv() {
    const list = filtered(), locs = locList();
    const cols0 = ['parent_sku', 'sku', 'product_name', 'plan_mode', 'abc', 'xyz', 'on_hand'];
    const cols1 = ['on_order', 'next_eta', 'avg7', 'avg30', 'avg90', 'avg_day', 'days_of_cover', 'stockout_date', 'stockout_date_with_po', 'safety_stock', 'reorder_point', 'target_stock', 'suggested_qty', 'lt', 'moq', 'pack', 'supplier', 'status'];
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
      ['สถานะ', pill(c, t)], ['สต็อกขายได้', fmtN(p.on_hand) + ' ชิ้น'], ['ขาย/วัน', fmtN(p.avg_day, 1)], ['พอใช้', p.days_of_cover != null ? fmtN(p.days_of_cover) + ' วัน' : '—'],
      ['คาดว่าหมด', p.stockout_date ? dTH(p.stockout_date) : '—'], ['จุดสั่ง', fmtN(p.reorder_point)], ['safety stock', fmtN(p.safety_stock)], ['แนะสั่ง', p.suggested_qty ? fmtN(p.suggested_qty) + ' ชิ้น' : '—'],
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
