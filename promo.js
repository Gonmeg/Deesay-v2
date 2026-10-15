// promo.js (v20261015a) — โปรโมชั่น 3 หน้า
//  • promo   (หน้าทีม)     ขอโปรโมชั่น: กรอกโปร → เห็นสัญญาณไฟทันทีว่าผ่าน "ต้นทุนทั้งหมด + กำไรขั้นต่ำ" หรือยัง (ไม่เห็นต้นทุน) → ส่งขออนุมัติ
//  • exec    (ผู้บริหาร)   โปรโมชั่น · อนุมัติ: กำไรต่อออเดอร์เป็นขั้นบันได · จุดคุ้มทุน · ลองปรับราคา / ของแถม · อนุมัติ / ไม่อนุมัติ
//  • execfee (ผู้บริหาร)   ค่าธรรมเนียมช่องทาง: ตารางแก้ได้ เพิ่ม / ลบรายการและช่องทาง · เก็บประวัติทุกครั้ง
// คำนวณทั้งหมดในฐานข้อมูล (promo_calc_core) — ค่าธรรมเนียม % คิดจากราคาขายรวม VAT แล้วถอด VAT · ต้นทุนต่อชิ้นเดือนล่าสุดจากไฟล์ต้นทุนขายของบัญชี
(function () {
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const n0 = v => Math.round(+v || 0).toLocaleString('th-TH');
  const n2 = v => (+v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pc = (v, d = 1) => v == null || !isFinite(v) ? '—' : (v * 100).toFixed(d) + '%';
  const dTh = d => d ? new Date(d).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '';
  const toast = m => (window.uiToast ? window.uiToast(m) : null);
  const rpc = (n, a) => Auth.rpc(n, a);
  const ST = { pending: ['รออนุมัติ', 'warn'], approved: ['อนุมัติแล้ว', 'good'], rejected: ['ไม่อนุมัติ', 'bad'], cancelled: ['ยกเลิก', ''] };
  const LAYER = { platform: 'ค่าแพลตฟอร์ม', selling: 'ค่าขาย (Commission / Ads / ขนส่ง)', overhead: 'ค่าบริหาร / Marketing' };
  const APPLY = { all: 'ทุกออเดอร์', single: 'เฉพาะสินค้าเดี่ยว', set: 'เฉพาะเซต' };
  let CAT = null;
  const cat = async () => (CAT = CAT || await rpc('promo_catalog'));

  // ---------- หน้าตา (ใช้ตัวแปรสีเดียวกับทั้งเว็บ) ----------
  if (!document.getElementById('prStyle')) {
    const st = document.createElement('style'); st.id = 'prStyle';
    st.textContent = `
      .pr-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:16px; }
      .pr-head h2 { margin:0; font-size:20px; font-weight:700; color:var(--text); }
      .pr-head p { margin:4px 0 0; font-size:13px; color:var(--text3); max-width:760px; line-height:1.6; }
      .pr-grid { display:grid; grid-template-columns:minmax(0, 1fr) 320px; gap:16px; align-items:start; }
      @media (max-width: 1100px) { .pr-grid { grid-template-columns:1fr; } }
      .pr-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:18px 20px; margin-bottom:16px; }
      .pr-card h3 { margin:0 0 12px; font-size:14px; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px; justify-content:space-between; }
      .pr-f { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px 16px; }
      .pr-f .full { grid-column:1 / -1; }
      .pr-f label { display:block; font-size:12px; font-weight:600; color:var(--text2); margin-bottom:6px; }
      .pr-f label small { font-weight:400; color:var(--text3); margin-left:4px; }
      .pr-in { width:100%; box-sizing:border-box; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:var(--text); padding:8px 11px; font:inherit; font-size:13px; outline:none; }
      .pr-in:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(200,169,110,.15); }
      .pr-rows .pr-row { display:grid; grid-template-columns:minmax(0, 1fr) 90px 32px; gap:8px; margin-bottom:8px; }
      .pr-x { border:1px solid var(--border); background:none; border-radius:8px; color:var(--text3); cursor:pointer; font-size:14px; }
      .pr-x:hover { color:var(--red, #ef4444); border-color:var(--red, #ef4444); }
      .pr-add { border:1px dashed var(--border); background:none; border-radius:8px; color:var(--text2); padding:6px 12px; cursor:pointer; font:inherit; font-size:12px; }
      .pr-add:hover { color:var(--accent); border-color:var(--accent); }
      .pr-btn { border:0; border-radius:8px; padding:9px 18px; font:inherit; font-size:13px; font-weight:700; cursor:pointer; background:var(--accent); color:#111; }
      .pr-btn:disabled { opacity:.5; cursor:default; }
      .pr-btn.ghost { background:none; border:1px solid var(--border); color:var(--text2); font-weight:600; }
      .pr-btn.good { background:var(--green, #22c55e); color:#fff; } .pr-btn.bad { background:var(--red, #ef4444); color:#fff; }
      .pr-sig { border-radius:12px; padding:18px; border:1px solid var(--border); background:var(--bg2); position:sticky; top:12px; }
      .pr-sig .ic { width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:700; margin-bottom:10px; background:var(--bg3); color:var(--text3); }
      .pr-sig.green { border-color:rgba(34,197,94,.45); background:rgba(34,197,94,.07); } .pr-sig.green .ic { background:var(--green, #22c55e); color:#fff; }
      .pr-sig.red { border-color:rgba(239,68,68,.45); background:rgba(239,68,68,.07); } .pr-sig.red .ic { background:var(--red, #ef4444); color:#fff; }
      .pr-sig .t { font-size:16px; font-weight:700; color:var(--text); } .pr-sig .s { font-size:12.5px; color:var(--text2); margin-top:6px; line-height:1.6; }
      .pr-sig .m { margin-top:12px; padding-top:12px; border-top:1px dashed var(--border); font-size:12px; color:var(--text3); line-height:1.7; }
      .pr-tb { width:100%; border-collapse:collapse; font-size:13px; }
      .pr-tb th { text-align:left; font-size:11.5px; font-weight:600; color:var(--text3); padding:9px 10px; border-bottom:1px solid var(--border); white-space:nowrap; }
      .pr-tb td { padding:10px; border-bottom:1px solid var(--row-border, rgba(127,127,127,.12)); color:var(--text2); vertical-align:top; }
      .pr-tb td.num, .pr-tb th.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .pr-tb tr.click { cursor:pointer; } .pr-tb tr.click:hover td { background:var(--bg3); }
      .pr-tb .t1 { color:var(--text); font-weight:600; } .pr-tb .t2 { font-size:11.5px; color:var(--text3); margin-top:2px; }
      .pr-pill { display:inline-flex; align-items:center; gap:5px; padding:2px 9px; border-radius:999px; font-size:11.5px; font-weight:600; background:var(--bg3); color:var(--text2); white-space:nowrap; }
      .pr-pill.good { background:rgba(34,197,94,.14); color:var(--green, #16a34a); } .pr-pill.bad { background:rgba(239,68,68,.13); color:var(--red, #dc2626); }
      .pr-pill.warn { background:rgba(245,158,11,.15); color:#d97706; }
      .pr-dot { width:9px; height:9px; border-radius:50%; display:inline-block; background:var(--text3); } .pr-dot.green { background:var(--green, #22c55e); } .pr-dot.red { background:var(--red, #ef4444); }
      .pr-seg { display:inline-flex; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
      .pr-seg button { border:0; background:none; padding:6px 14px; font:inherit; font-size:12.5px; color:var(--text2); cursor:pointer; }
      .pr-seg button[aria-pressed="true"] { background:var(--accent); color:#111; font-weight:700; }
      .pr-metrics { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:12px; margin-bottom:16px; }
      .pr-metric { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px; }
      .pr-metric .l { font-size:12px; color:var(--text3); } .pr-metric .v { font-size:22px; font-weight:700; color:var(--text); margin-top:4px; font-variant-numeric:tabular-nums; }
      .pr-empty { padding:28px; text-align:center; color:var(--text3); font-size:13px; }
      .pr-lad td { padding:7px 10px; } .pr-lad tr.sum td { font-weight:700; color:var(--text); background:var(--bg3); }
      .pr-lad tr.sub td:first-child { padding-left:26px; font-size:12px; color:var(--text3); } .pr-lad tr.sub td { font-size:12px; }
      .pr-lad td.neg { color:var(--red, #dc2626); }
      .pr-kv { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; margin:12px 0; }
      .pr-kv div { background:var(--bg3); border-radius:10px; padding:10px 12px; } .pr-kv b { display:block; font-size:16px; color:var(--text); margin-top:2px; font-variant-numeric:tabular-nums; }
      .pr-kv span { font-size:11.5px; color:var(--text3); }
      .pr-mx { overflow:auto; max-height:70vh; border:1px solid var(--border); border-radius:10px; }
      .pr-mx table { border-collapse:separate; border-spacing:0; font-size:12.5px; min-width:100%; }
      .pr-mx th, .pr-mx td { border-bottom:1px solid var(--row-border, rgba(127,127,127,.12)); padding:6px 8px; background:var(--bg2); white-space:nowrap; }
      .pr-mx thead th { position:sticky; top:0; z-index:2; font-size:11.5px; color:var(--text2); text-align:center; vertical-align:bottom; }
      .pr-mx th:first-child, .pr-mx td:first-child { position:sticky; left:0; z-index:1; min-width:250px; text-align:left; box-shadow:1px 0 0 var(--border); }
      .pr-mx thead th:first-child { z-index:3; }
      .pr-mx td input { width:70px; text-align:right; background:transparent; border:1px solid transparent; border-radius:6px; padding:4px 6px; color:var(--text); font:inherit; font-variant-numeric:tabular-nums; }
      .pr-mx td input:hover { border-color:var(--border); } .pr-mx td input:focus { border-color:var(--accent); outline:none; background:var(--bg); }
      .pr-mx tfoot td { font-weight:700; color:var(--text); background:var(--bg3); text-align:right; position:sticky; bottom:0; }
      .pr-mx tfoot td:first-child { text-align:left; }
      .pr-mx .iname { font-weight:600; color:var(--text); cursor:pointer; } .pr-mx .iname:hover { text-decoration:underline dotted; }
      .pr-mx .imeta { display:flex; gap:6px; margin-top:4px; }
      .pr-mx select { background:var(--bg); border:1px solid var(--border); border-radius:6px; color:var(--text2); font:inherit; font-size:11px; padding:2px 4px; }
      .pr-mx .del { border:0; background:none; color:var(--text3); cursor:pointer; font-size:12px; padding:0 2px; } .pr-mx .del:hover { color:var(--red, #ef4444); }
      .pr-note { font-size:12px; color:var(--text3); line-height:1.7; }
    `;
    document.head.appendChild(st);
  }

  // ===================== หน้า ขอโปรโมชั่น (ทีม) =====================
  const F = { title: '', channel_id: '', start_date: '', end_date: '', items: [{ sku: '', qty: 1 }], gifts: [], price: '', orders: '', note: '' };
  let chkSeq = 0, chkTimer = null;
  const skuOf = v => { const s = String(v || '').trim(); const m = s.match(/·\s*([A-Z0-9._-]+)\s*$/i); return (m ? m[1] : s).toUpperCase(); };
  const prodLabel = p => `${p.name} · ${p.sku}`;
  function payload() {
    return { title: F.title, channel_id: F.channel_id ? +F.channel_id : null, start_date: F.start_date, end_date: F.end_date, price: +F.price || 0, orders: +F.orders || 0, note: F.note,
      items: F.items.filter(x => x.sku).map(x => ({ sku: x.sku, qty: +x.qty || 0 })), gifts: F.gifts.filter(x => x.sku).map(x => ({ sku: x.sku, qty: +x.qty || 0 })) };
  }
  function sigHtml(r, C) {
    const mm = pc(+(C.min_markup || 0.05), 0);
    if (!r) return `<div class="pr-sig"><div class="ic">?</div><div class="t">ยังบอกไม่ได้</div><div class="s">กรอกช่องทาง ราคาขาย และสินค้าอย่างน้อย 1 รายการ ระบบจะบอกทันทีว่าผ่านเกณฑ์หรือยัง</div>
      <div class="m">เกณฑ์: ราคาขายต้องครอบคลุม <b>ต้นทุนทั้งหมด</b> (สินค้า · ของแถม · ค่าธรรมเนียมช่องทาง · ค่า Ads · ค่าบริหาร) และมีกำไรเกินอีก <b>${mm}</b> ของต้นทุน</div></div>`;
    const rsp = +r.rsp > 0 ? `<div class="m">ราคาปกติรวม ${n0(r.rsp)} · ลด ${pc(r.discount_vs_rsp)}</div>` : '';
    if (r.signal === 'green') return `<div class="pr-sig green"><div class="ic">✓</div><div class="t">ผ่านต้นทุนทั้งหมด + ${mm}</div><div class="s">ส่งขออนุมัติได้เลย · ยังต้องรอผู้บริหารอนุมัติอีกครั้ง</div>${rsp}</div>`;
    if (r.signal === 'red') return `<div class="pr-sig red"><div class="ic">✕</div><div class="t">ยังไม่ผ่านต้นทุนทั้งหมด + ${mm}</div><div class="s">ลองขึ้นราคา ลดของแถม หรือเพิ่มจำนวนสินค้าในเซต · ส่งได้ แต่ผู้บริหารจะเห็นว่ายังไม่ผ่าน</div>${rsp}</div>`;
    const miss = (r.missing_costs || []);
    return `<div class="pr-sig"><div class="ic">?</div><div class="t">ยังบอกไม่ได้</div><div class="s">${miss.length ? 'ยังไม่มีต้นทุนของ ' + miss.map(esc).join(', ') + ' ในไฟล์ต้นทุนขาย · แจ้งผู้บริหาร / บัญชี' : 'กรอกช่องทาง ราคาขาย และสินค้าให้ครบ'}</div>${rsp}</div>`;
  }
  async function check() {
    const C = await cat(), p = payload(), seq = ++chkSeq, box = document.getElementById('prSig');
    if (!box) return;
    if (!p.channel_id || !p.price || !p.items.length) { box.innerHTML = sigHtml(null, C); return; }
    try { const r = await rpc('promo_check', { p }); if (seq === chkSeq) box.innerHTML = sigHtml(r, C); }
    catch (e) { box.innerHTML = `<div class="pr-sig"><div class="t">ตรวจไม่สำเร็จ</div><div class="s">${esc(e.message)}</div></div>`; }
  }
  const later = () => { clearTimeout(chkTimer); chkTimer = setTimeout(check, 350); };
  function rowsHtml(key, list, C) {
    return list.map((x, i) => `<div class="pr-row"><input class="pr-in" list="prProducts" data-k="${key}" data-i="${i}" data-f="sku" placeholder="ค้นหาชื่อสินค้าหรือรหัส" value="${esc(x.sku ? prodLabel(C.products.find(p => p.sku === x.sku) || { name: x.sku, sku: x.sku }) : '')}">
      <input class="pr-in" type="number" min="1" step="1" data-k="${key}" data-i="${i}" data-f="qty" value="${esc(x.qty)}" title="จำนวนชิ้นต่อ 1 ออเดอร์">
      <button type="button" class="pr-x" data-del="${key}" data-i="${i}" aria-label="ลบ">✕</button></div>`).join('');
  }
  async function renderPromo() {
    const el = document.getElementById('page-promo'); if (!el) return;
    el.innerHTML = '<div class="pr-empty">กำลังโหลด…</div>';
    let C; try { C = await cat(); } catch (e) { el.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (!C) { el.innerHTML = '<div class="pr-empty">ยังไม่มีสิทธิ์ใช้หน้านี้</div>'; return; }
    el.innerHTML = `<div class="pr-head"><div><h2>ขอโปรโมชั่น</h2><p>กรอกโปรที่อยากทำ ระบบบอกทันทีว่าราคาที่ขอ<b>ผ่านต้นทุนทั้งหมด + ${pc(+(C.min_markup || 0.05), 0)}</b> หรือยัง (ไม่แสดงตัวเลขต้นทุน) แล้วส่งให้ผู้บริหารอนุมัติ</p></div></div>
      <datalist id="prProducts">${C.products.map(p => `<option value="${esc(prodLabel(p))}">`).join('')}</datalist>
      <div class="pr-grid"><div class="pr-card"><h3>รายละเอียดโปร</h3><div class="pr-f">
        <div class="full"><label>ชื่อโปร</label><input class="pr-in" data-f="title" value="${esc(F.title)}" placeholder="เช่น 11.11 แป้งดีเซ้ย์ 2 แถม 1"></div>
        <div><label>ช่องทาง</label><select class="pr-in" data-f="channel_id"><option value="">เลือกช่องทาง</option>${C.channels.map(c => `<option value="${c.id}"${+F.channel_id === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>ช่วงเวลา</label><div style="display:flex;gap:8px;"><input class="pr-in" type="date" data-f="start_date" value="${esc(F.start_date)}"><input class="pr-in" type="date" data-f="end_date" value="${esc(F.end_date)}"></div></div>
        <div class="full"><label>สินค้าที่ขายใน 1 ออเดอร์ <small>ชื่อสินค้า · จำนวนชิ้น</small></label><div class="pr-rows" id="prItems">${rowsHtml('items', F.items, C)}</div><button type="button" class="pr-add" data-addrow="items">＋ เพิ่มสินค้า</button></div>
        <div class="full"><label>ของแถมใน 1 ออเดอร์ <small>ไม่มีก็เว้นไว้</small></label><div class="pr-rows" id="prGifts">${rowsHtml('gifts', F.gifts, C)}</div><button type="button" class="pr-add" data-addrow="gifts">＋ เพิ่มของแถม</button></div>
        <div><label>ราคาขายต่อออเดอร์ <small>รวม VAT หลังส่วนลด</small></label><input class="pr-in" type="number" min="0" step="0.01" data-f="price" value="${esc(F.price)}" placeholder="0.00"></div>
        <div><label>ยอดที่คาดว่าจะขาย <small>ออเดอร์</small></label><input class="pr-in" type="number" min="0" step="1" data-f="orders" value="${esc(F.orders)}" placeholder="0"></div>
        <div class="full"><label>หมายเหตุ <small>ไม่บังคับ</small></label><textarea class="pr-in" rows="2" data-f="note" placeholder="เช่น เงื่อนไขพิเศษของแพลตฟอร์ม">${esc(F.note)}</textarea></div>
      </div><div style="margin-top:16px;display:flex;gap:10px;align-items:center;"><button class="pr-btn" id="prSubmit">ส่งขออนุมัติ</button><span class="pr-note" id="prMsg"></span></div></div>
      <div id="prSig"></div></div>
      <div class="pr-card"><h3>คำขอของฉัน</h3><div id="prMine"><div class="pr-empty">กำลังโหลด…</div></div></div>`;
    const sync = t => { const k = t.dataset.k, i = +t.dataset.i, f = t.dataset.f; if (!f) return;
      if (k) F[k][i][f] = f === 'sku' ? (C.products.some(p => p.sku === skuOf(t.value)) ? skuOf(t.value) : '') : t.value; else F[f] = t.value; later(); };
    el.addEventListener('input', e => sync(e.target));
    el.addEventListener('change', e => sync(e.target));
    el.addEventListener('click', async e => {
      const a = e.target.closest('[data-addrow]'), d = e.target.closest('[data-del]'), cx = e.target.closest('[data-cancel]');
      if (a) { F[a.dataset.addrow].push({ sku: '', qty: 1 }); document.getElementById(a.dataset.addrow === 'items' ? 'prItems' : 'prGifts').innerHTML = rowsHtml(a.dataset.addrow, F[a.dataset.addrow], C); }
      if (d) { F[d.dataset.del].splice(+d.dataset.i, 1); if (d.dataset.del === 'items' && !F.items.length) F.items.push({ sku: '', qty: 1 }); document.getElementById(d.dataset.del === 'items' ? 'prItems' : 'prGifts').innerHTML = rowsHtml(d.dataset.del, F[d.dataset.del], C); later(); }
      if (cx && confirm('ยกเลิกคำขอนี้?')) { try { await rpc('promo_cancel', { p_id: +cx.dataset.cancel }); loadMine(); } catch (er) { alert(er.message); } }
    });
    document.getElementById('prSubmit').onclick = async () => {
      const p = payload(), msg = document.getElementById('prMsg');
      if (!p.title.trim() || !p.channel_id || !p.price || !p.items.length) { msg.textContent = 'กรอกชื่อโปร ช่องทาง ราคาขาย และสินค้าให้ครบก่อน'; return; }
      const b = document.getElementById('prSubmit'); b.disabled = true; msg.textContent = 'กำลังส่ง…';
      try { const r = await rpc('promo_submit', { p }); msg.textContent = ''; toast('ส่งขออนุมัติแล้ว · ' + (r.signal === 'green' ? 'ผ่านเกณฑ์ต้นทุน' : r.signal === 'red' ? 'ยังไม่ผ่านเกณฑ์ต้นทุน' : 'ยังไม่มีต้นทุนบางรายการ'));
        Object.assign(F, { title: '', items: [{ sku: '', qty: 1 }], gifts: [], price: '', orders: '', note: '' }); renderPromo(); }
      catch (er) { msg.textContent = 'ส่งไม่สำเร็จ: ' + er.message; b.disabled = false; }
    };
    check(); loadMine();
  }
  async function loadMine() {
    const box = document.getElementById('prMine'); if (!box) return;
    try {
      const L = await rpc('promo_list', { p_scope: 'mine' }), C = await cat();
      const nm = s => (C.products.find(p => p.sku === s) || { name: s }).name;
      box.innerHTML = L.length ? `<div style="overflow-x:auto;"><table class="pr-tb" data-no-sort data-no-page><thead><tr><th>โปร</th><th>ช่องทาง</th><th class="num">ราคา</th><th class="num">ยอดคาด</th><th>เกณฑ์ต้นทุน</th><th>สถานะ</th><th>ความเห็นผู้บริหาร</th><th></th></tr></thead><tbody>`
        + L.map(r => { const s = ST[r.status] || [r.status, ''];
          return `<tr><td><div class="t1">${esc(r.title)}</div><div class="t2">${(r.items || []).map(x => esc(nm(x.sku)) + ' ×' + x.qty).join(' + ')}${(r.gifts || []).length ? ' · แถม ' + r.gifts.map(x => esc(nm(x.sku)) + ' ×' + x.qty).join(' + ') : ''}</div>
            <div class="t2">${dTh(r.start_date)}${r.end_date ? ' – ' + dTh(r.end_date) : ''} · ส่งเมื่อ ${dTh(r.requested_at)}</div></td>
            <td>${esc(r.channel || '')}</td><td class="num">${n2(r.price)}</td><td class="num">${r.orders ? n0(r.orders) : '—'}</td>
            <td><span class="pr-dot ${r.signal === 'green' ? 'green' : r.signal === 'red' ? 'red' : ''}"></span> ${r.signal === 'green' ? 'ผ่าน' : r.signal === 'red' ? 'ไม่ผ่าน' : 'ยังบอกไม่ได้'}</td>
            <td><span class="pr-pill ${s[1]}">${s[0]}</span>${r.decided_name ? `<div class="t2">${esc(r.decided_name)} · ${dTh(r.decided_at)}</div>` : ''}</td>
            <td style="white-space:normal;max-width:240px;">${esc(r.decision_note || '')}</td>
            <td>${r.status === 'pending' ? `<button class="pr-btn ghost" data-cancel="${r.id}" style="padding:4px 10px;font-size:12px;">ยกเลิก</button>` : ''}</td></tr>`; }).join('') + '</tbody></table></div>'
        : '<div class="pr-empty">ยังไม่มีคำขอ</div>';
    } catch (e) { box.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; }
  }

  // ===================== หน้า โปรโมชั่น · อนุมัติ (ผู้บริหาร) =====================
  let EX = { list: [], filter: 'pending' };
  async function renderExec() {
    const el = document.getElementById('page-exec'); if (!el) return;
    el.innerHTML = '<div class="pr-empty">กำลังโหลด…</div>';
    try { EX.list = await rpc('promo_list', { p_scope: 'all' }); await cat(); } catch (e) { el.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    const L = EX.list, cnt = s => L.filter(r => r.status === s).length;
    const expProfit = L.filter(r => r.status === 'approved').reduce((t, r) => t + (+(r.calc || {}).total_profit || 0), 0);
    el.innerHTML = `<div class="pr-head"><div><h2>โปรโมชั่น · อนุมัติ</h2><p>คำขอโปรจากทีม พร้อมกำไรต่อออเดอร์ที่คำนวณจากต้นทุนล่าสุดและตารางค่าธรรมเนียมปัจจุบัน · คลิกแถวเพื่อดูขั้นบันไดกำไร ลองปรับราคา และอนุมัติ</p></div>
        <div class="pr-seg" id="exSeg">${[['pending', 'รออนุมัติ'], ['approved', 'อนุมัติแล้ว'], ['rejected', 'ไม่อนุมัติ'], ['all', 'ทั้งหมด']].map(([k, t]) => `<button type="button" data-f="${k}" aria-pressed="${EX.filter === k}">${t}</button>`).join('')}</div></div>
      <div class="pr-metrics"><div class="pr-metric"><div class="l">รออนุมัติ</div><div class="v">${cnt('pending')}</div></div><div class="pr-metric"><div class="l">อนุมัติแล้ว</div><div class="v">${cnt('approved')}</div></div>
        <div class="pr-metric"><div class="l">ไม่อนุมัติ</div><div class="v">${cnt('rejected')}</div></div><div class="pr-metric"><div class="l">กำไรรวมที่คาด (โปรที่อนุมัติ)</div><div class="v" style="color:${expProfit < 0 ? 'var(--red,#dc2626)' : 'var(--text)'}">${n0(expProfit)}</div></div></div>
      <div class="pr-card" style="padding:6px 0 0;"><div id="exList" style="overflow-x:auto;"></div></div>`;
    el.querySelector('#exSeg').onclick = e => { const b = e.target.closest('button[data-f]'); if (!b) return; EX.filter = b.dataset.f; el.querySelectorAll('#exSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); listExec(); };
    listExec();
  }
  function listExec() {
    const box = document.getElementById('exList'); if (!box) return;
    const L = EX.list.filter(r => EX.filter === 'all' ? r.status !== 'cancelled' : r.status === EX.filter);
    box.innerHTML = L.length ? `<table class="pr-tb" data-no-sort data-no-page><thead><tr><th style="padding-left:20px;">โปร</th><th>ช่องทาง</th><th class="num">ราคา</th><th class="num">กำไร / ออเดอร์</th><th class="num">กำไรเทียบต้นทุน</th><th class="num">ยอดคาด</th><th class="num">กำไรรวมที่คาด</th><th>เกณฑ์</th><th>สถานะ</th></tr></thead><tbody>`
      + L.map(r => { const c = r.calc || {}, s = ST[r.status] || [r.status, ''];
        return `<tr class="click" data-id="${r.id}"><td style="padding-left:20px;"><div class="t1">${esc(r.title)}</div><div class="t2">${esc(r.requested_name || '')} · ${dTh(r.requested_at)}${r.start_date ? ' · โปร ' + dTh(r.start_date) + (r.end_date ? ' – ' + dTh(r.end_date) : '') : ''}</div></td>
          <td>${esc(r.channel || '')}</td><td class="num">${n2(r.price)}</td>
          <td class="num" style="color:${+c.profit < 0 ? 'var(--red,#dc2626)' : 'var(--text)'};font-weight:600;">${c.profit == null ? '—' : n2(c.profit)}</td>
          <td class="num">${pc(c.markup)}</td><td class="num">${r.orders ? n0(r.orders) : '—'}</td><td class="num">${r.orders ? n0(c.total_profit) : '—'}</td>
          <td><span class="pr-dot ${c.signal === 'green' ? 'green' : c.signal === 'red' ? 'red' : ''}"></span></td><td><span class="pr-pill ${s[1]}">${s[0]}</span></td></tr>`; }).join('') + '</tbody></table>'
      : '<div class="pr-empty">ไม่มีรายการ</div>';
    box.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => openReq(+tr.dataset.id));
  }
  function ladder(c, C) {
    const nm = s => (C.products.find(p => p.sku === s) || { name: s }).name;
    const fee = ly => (c.fees || []).filter(f => f.layer === ly).map(f => `<tr class="sub"><td>${esc(f.item)} <span style="color:var(--text3);">${f.kind === 'pct' ? (f.rate * 100).toFixed(2) + '% ของราคา' : n2(f.rate) + ' บาท/ออเดอร์'}</span></td><td class="num neg">−${n2(f.amount_ex)}</td></tr>`).join('');
    const ln = k => (c.lines || []).filter(l => l.kind === k).map(l => `<tr class="sub"><td>${esc(l.name || nm(l.sku))} ×${l.qty} <span style="color:var(--text3);">${l.unit_cost == null ? 'ยังไม่มีต้นทุน' : '@ ' + n2(l.unit_cost)}</span></td><td class="num neg">−${n2(l.cost)}</td></tr>`).join('');
    const sum = (t, v, extra) => `<tr class="sum"><td>${t}${extra ? ` <span style="font-weight:400;color:var(--text3);">${extra}</span>` : ''}</td><td class="num" style="color:${v < 0 ? 'var(--red,#dc2626)' : 'var(--text)'}">${n2(v)}</td></tr>`;
    return `<table class="pr-tb pr-lad" data-no-sort data-no-page><tbody>
      <tr><td>ราคาขาย (รวม VAT)</td><td class="num">${n2(c.price)}</td></tr>
      ${sum('รายได้ไม่รวม VAT', c.revenue_ex)}
      ${ln('item')}${ln('gift')}
      ${sum('กำไรขั้นต้น', c.gross, pc(c.revenue_ex ? c.gross / c.revenue_ex : null))}
      ${fee('platform')}${sum('หลังค่าแพลตฟอร์ม', c.after_platform)}
      ${fee('selling')}${sum('หลังค่าขาย', c.after_selling)}
      ${fee('overhead')}${sum('กำไรสุทธิต่อออเดอร์', c.profit, `${pc(c.margin)} ของรายได้ · ${pc(c.markup)} ของต้นทุน`)}
      ${+c.orders ? sum(`กำไรรวม × ${n0(c.orders)} ออเดอร์`, c.total_profit) : ''}</tbody></table>`;
  }
  async function openReq(id) {
    const r = EX.list.find(x => x.id === id); if (!r) return;
    const C = await cat();
    trOpenShell('โปรโมชั่น · รายละเอียด');
    const S = { price: r.price, orders: r.orders || 0, items: JSON.parse(JSON.stringify(r.items || [])), gifts: JSON.parse(JSON.stringify(r.gifts || [])) };
    const body = () => document.getElementById('trBody');
    const draw = (c) => {
      const s = ST[r.status] || [r.status, ''], mm = pc(+c.min_markup, 0), changed = +S.price !== +r.price || +S.orders !== +(r.orders || 0) || JSON.stringify(S.gifts) !== JSON.stringify(r.gifts || []) || JSON.stringify(S.items) !== JSON.stringify(r.items || []);
      body().innerHTML = `
        <div class="tr-card"><div class="tr-card-t">${esc(r.title)} <span class="pr-pill ${s[1]}" style="margin-left:6px;">${s[0]}</span></div>
          <div class="tr-card-v" style="color:${+c.profit < 0 ? 'var(--red,#dc2626)' : 'var(--text)'}">${n2(c.profit)} <small style="font-size:13px;font-weight:400;color:var(--text3);">กำไรต่อออเดอร์</small></div>
          <div class="tr-card-m"><span>${esc(r.channel || '')}</span>${r.start_date ? `<span>${dTh(r.start_date)}${r.end_date ? ' – ' + dTh(r.end_date) : ''}</span>` : ''}<span>ขอโดย ${esc(r.requested_name || '')}</span></div></div>
        <div class="pr-sig ${c.signal === 'green' ? 'green' : c.signal === 'red' ? 'red' : ''}" style="position:static;margin-bottom:14px;padding:12px 14px;display:flex;gap:12px;align-items:center;">
          <div class="ic" style="margin:0;width:34px;height:34px;font-size:16px;">${c.signal === 'green' ? '✓' : c.signal === 'red' ? '✕' : '?'}</div>
          <div><div class="t" style="font-size:14px;">${c.signal === 'green' ? 'ผ่านต้นทุนทั้งหมด + ' + mm : c.signal === 'red' ? 'ยังไม่ผ่านต้นทุนทั้งหมด + ' + mm : 'ยังไม่มีต้นทุนบางรายการ: ' + (c.missing_costs || []).join(', ')}</div>
          <div class="s" style="margin-top:2px;">${changed ? 'ตัวเลขด้านล่างเป็นผลจากการลองปรับ (ยังไม่แก้คำขอ)' : 'คำนวณด้วยต้นทุนล่าสุดและค่าธรรมเนียมปัจจุบัน'}</div></div></div>
        <div class="pr-kv"><div><span>จุดคุ้มทุน (ราคา)</span><b>${c.breakeven_price == null ? '—' : n2(c.breakeven_price)}</b></div>
          <div><span>ราคาที่ผ่านเกณฑ์ + ${mm}</span><b>${c.target_price == null ? '—' : n2(c.target_price)}</b></div>
          <div><span>ราคาปกติรวม (RSP)</span><b>${+c.rsp ? n2(c.rsp) : '—'}</b>${+c.rsp ? `<span>ลด ${pc(c.discount_vs_rsp)}</span>` : ''}</div></div>
        <section class="tr-part" style="padding:12px 14px;"><div class="pr-f">
          <div><label>ลองปรับราคา (รวม VAT)</label><input class="pr-in" type="number" step="0.01" id="exPrice" value="${S.price}"></div>
          <div><label>ยอดคาด (ออเดอร์)</label><input class="pr-in" type="number" step="1" id="exOrders" value="${S.orders}"></div>
          ${S.gifts.map((g, i) => `<div><label>ของแถม: ${esc((C.products.find(p => p.sku === g.sku) || { name: g.sku }).name)}</label><input class="pr-in" type="number" min="0" step="1" data-gi="${i}" value="${g.qty}"></div>`).join('')}
          ${S.items.map((g, i) => `<div><label>สินค้า: ${esc((C.products.find(p => p.sku === g.sku) || { name: g.sku }).name)}</label><input class="pr-in" type="number" min="0" step="1" data-ii="${i}" value="${g.qty}"></div>`).join('')}
        </div></section>
        <section class="tr-part">${ladder(c, C)}</section>
        <div class="pr-note" style="margin:0 2px 14px;">ต้นทุนต่อชิ้น: ไฟล์ต้นทุนขายของบัญชี เดือนล่าสุดที่มี${(c.lines || [])[0] && c.lines[0].cost_month ? ' (' + dTh(c.lines[0].cost_month) + ')' : ''} · ค่าธรรมเนียม: ตาราง "ค่าธรรมเนียมช่องทาง" ปัจจุบัน · % คิดจากราคารวม VAT แล้วถอด VAT ${(c.vat * 100).toFixed(0)}%</div>
        <section class="tr-part" style="padding:12px 14px;"><label style="font-size:12px;font-weight:600;color:var(--text2);">ความเห็นถึงทีม</label>
          <textarea class="pr-in" id="exNote" rows="2" style="margin-top:6px;" placeholder="เช่น อนุมัติถ้าขึ้นราคาเป็น ${c.target_price ? n0(Math.ceil(c.target_price)) : '…'}">${esc(r.decision_note || '')}</textarea>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
            ${r.status === 'pending' ? '<button class="pr-btn good" data-dec="approved">✓ อนุมัติ</button><button class="pr-btn bad" data-dec="rejected">✕ ไม่อนุมัติ</button>' : '<button class="pr-btn ghost" data-dec="pending">กลับเป็นรออนุมัติ</button>'}
          </div></section>
        ${r.note ? `<div class="pr-note">หมายเหตุจากทีม: ${esc(r.note)}</div>` : ''}`;
      const recalc = async () => {
        S.price = +document.getElementById('exPrice').value || 0; S.orders = +document.getElementById('exOrders').value || 0;
        body().querySelectorAll('[data-gi]').forEach(x => { S.gifts[+x.dataset.gi].qty = +x.value || 0; });
        body().querySelectorAll('[data-ii]').forEach(x => { S.items[+x.dataset.ii].qty = +x.value || 0; });
        try { draw(await rpc('promo_calc', { p: { channel_id: r.channel_id, price: S.price, orders: S.orders, items: S.items, gifts: S.gifts } })); } catch (e) { toast('คำนวณไม่สำเร็จ: ' + e.message); }
      };
      let t = null; body().querySelectorAll('#exPrice,#exOrders,[data-gi],[data-ii]').forEach(x => x.addEventListener('input', () => { clearTimeout(t); t = setTimeout(recalc, 400); }));
      body().querySelectorAll('[data-dec]').forEach(b => b.onclick = async () => {
        const st = b.dataset.dec; if (st !== 'pending' && !confirm(st === 'approved' ? 'อนุมัติโปรนี้?' : 'ไม่อนุมัติโปรนี้?')) return;
        try { await rpc('promo_decide', { p_id: r.id, p_status: st, p_note: document.getElementById('exNote').value }); toast('บันทึกแล้ว'); trClose(); renderExec(); } catch (e) { alert(e.message); }
      });
    };
    draw(r.calc || await rpc('promo_calc', { p: { channel_id: r.channel_id, price: r.price, orders: r.orders, items: r.items, gifts: r.gifts } }));
  }

  // ===================== หน้า ค่าธรรมเนียมช่องทาง (ผู้บริหาร) =====================
  async function renderFee() {
    const el = document.getElementById('page-execfee'); if (!el) return;
    el.innerHTML = '<div class="pr-empty">กำลังโหลด…</div>';
    let T; try { T = await rpc('fee_table'); } catch (e) { el.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (!T) { el.innerHTML = '<div class="pr-empty">ยังไม่มีสิทธิ์ใช้หน้านี้</div>'; return; }
    const V = {}; T.values.forEach(([i, c, v]) => { V[i + '|' + c] = +v; });
    const chs = T.channels.filter(c => c.active), items = T.items;
    const val = (it, c) => V[it.id + '|' + c.id];
    const show = (it, v) => v == null ? '' : it.kind === 'pct' ? +(v * 100).toFixed(4) : +v;
    const tot = (c, pred) => items.filter(it => it.active && it.kind === 'pct' && pred(it)).reduce((t, it) => t + (val(it, c) || 0), 0);
    el.innerHTML = `<div class="pr-head"><div><h2>ค่าธรรมเนียมช่องทาง</h2><p>ใช้คำนวณกำไรโปรโมชั่นทุกคำขอ · แก้ตัวเลขในช่องได้ทันที (บันทึกเองเมื่อออกจากช่อง) · ช่อง % ใส่เป็นตัวเลขเปอร์เซ็นต์ เช่น 7.49 · ระบบเก็บประวัติทุกครั้ง</p></div>
        <div style="display:flex;gap:8px;"><button class="pr-btn ghost" id="feAddItem">＋ เพิ่มรายการ</button><button class="pr-btn ghost" id="feAddCh">＋ เพิ่มช่องทาง</button></div></div>
      <div class="pr-card" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><b style="font-size:13px;color:var(--text);">เกณฑ์สัญญาณไฟ</b>
        <span class="pr-note" style="margin:0;">เขียวเมื่อราคาขายครอบคลุมต้นทุนทั้งหมด และมีกำไรเกินอีก</span>
        <input class="pr-in" id="feMm" type="number" step="0.5" style="width:80px;" value="${+(((T.settings || {}).min_markup || 0.05) * 100).toFixed(2)}"><span class="pr-note" style="margin:0;">% ของต้นทุน</span>
        <button class="pr-btn" id="feMmSave" style="padding:6px 14px;">บันทึก</button></div>
      <div class="pr-mx"><table><thead><tr><th>รายการ</th>${chs.map(c => `<th>${esc(c.name)}<div style="font-weight:400;color:var(--text3);font-size:10.5px;">${esc(c.sys_channel || '')} <button class="del" data-delch="${c.id}" title="ลบช่องทางนี้">✕</button></div></th>`).join('')}</tr></thead><tbody>`
      + items.map(it => `<tr${it.active ? '' : ' style="opacity:.5;"'}><td><div class="iname" data-ren="${it.id}" title="คลิกเพื่อเปลี่ยนชื่อ">${esc(it.name)}</div><div class="imeta">
          <select data-it="${it.id}" data-fld="kind"><option value="pct"${it.kind === 'pct' ? ' selected' : ''}>% ของราคา</option><option value="per_order"${it.kind === 'per_order' ? ' selected' : ''}>บาท/ออเดอร์</option></select>
          <select data-it="${it.id}" data-fld="layer">${Object.entries(LAYER).map(([k, t]) => `<option value="${k}"${it.layer === k ? ' selected' : ''}>${t}</option>`).join('')}</select>
          <select data-it="${it.id}" data-fld="apply">${Object.entries(APPLY).map(([k, t]) => `<option value="${k}"${it.apply === k ? ' selected' : ''}>${t}</option>`).join('')}</select>
          <button class="del" data-delit="${it.id}" title="ลบรายการนี้">✕</button></div></td>`
        + chs.map(c => `<td><input inputmode="decimal" data-cell="${it.id}|${c.id}" data-kind="${it.kind}" value="${show(it, val(it, c))}" placeholder="—"></td>`).join('') + '</tr>').join('')
      + `</tbody><tfoot><tr><td>รวมค่าแพลตฟอร์ม (%)</td>${chs.map(c => `<td>${(tot(c, it => it.layer === 'platform') * 100).toFixed(2)}%</td>`).join('')}</tr>
        <tr><td>รวมทุกรายการ (%)</td>${chs.map(c => `<td>${(tot(c, () => true) * 100).toFixed(2)}%</td>`).join('')}</tr></tfoot></table></div>
      <div class="pr-card" style="margin-top:16px;"><h3>ประวัติการแก้ไข</h3>${(T.history || []).length ? `<table class="pr-tb" data-no-sort data-no-page><tbody>${T.history.map(h => `<tr><td style="white-space:nowrap;">${new Date(h[0]).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td><td>${esc(h[1] || '')}</td><td>${esc(h[2] || '')}</td><td class="num">${esc(h[3] ?? '')}${h[3] != null || h[4] != null ? ' → ' : ''}${esc(String(h[4] ?? '').slice(0, 60))}</td></tr>`).join('')}</tbody></table>` : '<div class="pr-empty">ยังไม่มี</div>'}</div>`;
    const edit = async p => { try { await rpc('fee_edit', { p }); toast('บันทึกแล้ว'); return true; } catch (e) { alert('บันทึกไม่สำเร็จ: ' + e.message); return false; } };
    el.querySelectorAll('input[data-cell]').forEach(inp => inp.addEventListener('change', async () => {
      const [item_id, channel_id] = inp.dataset.cell.split('|').map(Number), raw = inp.value.trim().replace(/[,%\s]/g, '');
      if (raw !== '' && !isFinite(+raw)) { alert('ใส่เป็นตัวเลข'); return; }
      if (await edit({ op: 'value', item_id, channel_id, value: raw === '' ? '' : String(inp.dataset.kind === 'pct' ? +raw / 100 : +raw) })) renderFee();
    }));
    el.querySelectorAll('select[data-it]').forEach(s => s.addEventListener('change', async () => { if (await edit({ op: 'item_update', id: +s.dataset.it, [s.dataset.fld]: s.value })) renderFee(); }));
    el.querySelectorAll('[data-ren]').forEach(d => d.onclick = async () => { const n = prompt('ชื่อรายการ', d.textContent); if (n && n.trim() && await edit({ op: 'item_update', id: +d.dataset.ren, name: n.trim() })) renderFee(); });
    el.querySelectorAll('[data-delit]').forEach(b => b.onclick = async () => { if (confirm('ลบรายการนี้และตัวเลขทุกช่องทางของรายการนี้?') && await edit({ op: 'item_delete', id: +b.dataset.delit })) renderFee(); });
    el.querySelectorAll('[data-delch]').forEach(b => b.onclick = async () => { if (confirm('ลบช่องทางนี้? (ถ้ามีโปรอ้างถึง ระบบจะปิดใช้งานแทนการลบ)') && await edit({ op: 'channel_delete', id: +b.dataset.delch })) { CAT = null; renderFee(); } });
    document.getElementById('feAddItem').onclick = async () => { const n = prompt('ชื่อรายการค่าใช้จ่ายใหม่'); if (!n || !n.trim()) return;
      const k = confirm('คิดเป็น % ของราคาขาย?\nกด OK = % ของราคา · กด Cancel = บาทต่อออเดอร์') ? 'pct' : 'per_order';
      if (await edit({ op: 'item_add', name: n.trim(), kind: k, layer: 'platform', apply: 'all' })) renderFee(); };
    document.getElementById('feAddCh').onclick = async () => { const n = prompt('ชื่อช่องทางใหม่ (เช่น Shopee Video)'); if (!n || !n.trim()) return;
      const s = prompt('อยู่ในกลุ่มช่องทางไหนของระบบ (Facebook / TikTok / Shopee / Lazada / ตัวแทน / Modern Trade)', '') || '';
      if (await edit({ op: 'channel_add', name: n.trim(), sys_channel: s.trim() })) { CAT = null; renderFee(); } };
    document.getElementById('feMmSave').onclick = async () => { const v = +document.getElementById('feMm').value; if (!isFinite(v) || v < 0) return alert('ใส่ตัวเลข');
      if (await edit({ op: 'settings', min_markup: v / 100 })) { CAT = null; renderFee(); } };
  }

  window.PromoUI = { render(page) { if (page === 'promo') renderPromo(); else if (page === 'exec') renderExec(); else if (page === 'execfee') renderFee(); } };
})();
