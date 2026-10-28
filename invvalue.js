// invvalue.js (v20261028c) — ไม่มีกรอบซ้อนรอบตาราง · ราคาต่อชิ้นแสดงเฉพาะแถว parent
// invvalue.js (v20261028b) — มูลค่าสินค้าคงคลัง (Management)
// (2026-10-28 b) แสดงมูลค่า ไม่รวม VAT / รวม VAT (ปุ่มที่แถบบน · ใช้ทั้งหน้า) · คอลัมน์ต่อชิ้น (ราคาทุน / RSP) · กดหัวคอลัมน์เพื่อเรียง · แสดงทุกสินค้า (ไม่แบ่งหน้า) หัวตารางล็อกตอนเลื่อน
//                 คอลัมน์กว้างเท่ากัน ตัวเลขจัดกลาง · สีแยกกลุ่ม จำนวน / ราคาทุน / RSP · ระยะเวลาจำหน่าย 6–12 เดือนสีเหลือง เกิน 1 ปีสีส้ม
// สินค้าสำเร็จรูป = สต็อกทุกคลัง + ผลิตเสร็จรอที่โรงงาน (Hold) · PO ที่ยังไม่ผลิต = WIP · ระยะเวลาจำหน่าย = สินค้าสำเร็จรูป ÷ ยอดขายเฉลี่ยต่อวัน (ชุดเดียวกับ Supply Chain) ราย child SKU
// ข้อมูล: RPC inventory_value() — ต้นทุนไม่รวม VAT จากไฟล์ต้นทุนของบัญชี · RSP รวม VAT จากหน้า สินค้า & ราคา
(function () {
  const VATR = 1.07;
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const n0 = v => Math.round(+v || 0).toLocaleString('th-TH');
  const n2 = v => (+v || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const tip = (id, t) => window.fbeInfoIcon ? window.fbeInfoIcon(id, t) : ` <span title="${esc(t)}">ⓘ</span>`;
  if (!document.getElementById('ivStyle2')) {
    const st = document.createElement('style'); st.id = 'ivStyle2';
    st.textContent = `
      #page-invvalue { --iv-cost:rgba(59,130,246,.06); --iv-rsp:rgba(184,134,47,.08); --iv-costh:rgba(59,130,246,.12); --iv-rsph:rgba(184,134,47,.15); }
      #page-invvalue .iv-k { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin-bottom:16px; }
      #page-invvalue .iv-k > div { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px; min-width:0; border-top:3px solid var(--border); }
      #page-invvalue .iv-k > div.c { border-top-color:rgba(59,130,246,.55); } #page-invvalue .iv-k > div.r { border-top-color:rgba(184,134,47,.65); }
      #page-invvalue .iv-k .l { font-size:12.5px; color:var(--text2); font-weight:600; margin-bottom:8px; }
      #page-invvalue .iv-k .row { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:12px; color:var(--text3); padding:3px 0; }
      #page-invvalue .iv-k .row b { font-size:18px; color:var(--text); font-variant-numeric:tabular-nums; white-space:nowrap; } #page-invvalue .iv-k .row.sub b { font-size:14px; color:var(--text2); }
      #page-invvalue .iv-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px 10px; }
      #page-invvalue .iv-card h3 { margin:0 0 10px; font-size:14px; font-weight:700; color:var(--text); }
      #page-invvalue .iv-wrap { overflow:auto; max-height:calc(100vh - 230px); }   /* (2026-10-28 c) ไม่มีกรอบซ้อนในการ์ด */
      #page-invvalue table.iv { width:100%; border-collapse:separate; border-spacing:0; font-size:12.5px; min-width:1180px; table-layout:fixed; }
      #page-invvalue table.iv th { position:sticky; z-index:2; background:var(--bg2); font-size:11.5px; font-weight:600; color:var(--text3); padding:7px 6px; text-align:center; border-bottom:1px solid var(--border); white-space:normal; line-height:1.35; vertical-align:middle; }
      #page-invvalue table.iv thead tr.h1 th { top:0; } #page-invvalue table.iv thead tr.h2 th { top:var(--ivh1, 33px); }
      #page-invvalue table.iv th.sort { cursor:pointer; user-select:none; } #page-invvalue table.iv th.sort:hover { color:var(--text); } #page-invvalue table.iv th .ar { font-size:9px; margin-left:3px; color:var(--text); }
      #page-invvalue table.iv th.gc { background:linear-gradient(var(--iv-costh), var(--iv-costh)), var(--bg2); color:#2563eb; } #page-invvalue table.iv th.gr { background:linear-gradient(var(--iv-rsph), var(--iv-rsph)), var(--bg2); color:#a16207; }
      #page-invvalue table.iv th.nm, #page-invvalue table.iv td.nm { text-align:left; }
      #page-invvalue table.iv .gl { border-left:1px solid var(--border); }
      #page-invvalue table.iv td { padding:8px 6px; text-align:center; border-bottom:1px solid var(--border); font-variant-numeric:tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #page-invvalue table.iv td.cc { background:var(--iv-cost); } #page-invvalue table.iv td.rc { background:var(--iv-rsp); }
      #page-invvalue tr.par td { font-weight:600; } #page-invvalue tr.par.has { cursor:pointer; } #page-invvalue tr.par.has:hover td.nm { color:var(--accent,#b8862f); }
      #page-invvalue tr.par .car { display:inline-block; width:14px; font-size:9px; color:var(--text3); transition:transform .15s; } #page-invvalue tr.par.open .car { transform:rotate(90deg); }
      #page-invvalue tr.kid td { font-size:12px; font-weight:400; color:var(--text2); } #page-invvalue tr.kid td.nm { padding-left:32px; }
      #page-invvalue tr.kid td:not(.cc):not(.rc) { background:var(--bg3); }
      #page-invvalue .sku { font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--text3); margin-left:6px; } #page-invvalue tr.kid .sku { margin-left:0; color:var(--text2); font-size:11.5px; }
      #page-invvalue .cnt { font-size:11px; font-weight:400; color:var(--text3); margin-left:6px; }
      #page-invvalue .dash { color:var(--text3); font-weight:400; } #page-invvalue .part { color:#b45309; }
      #page-invvalue .shr { display:inline-flex; align-items:center; gap:6px; } #page-invvalue .shr i { display:block; width:48px; height:4px; border-radius:2px; background:var(--bg3); overflow:hidden; } #page-invvalue .shr i b { display:block; height:100%; background:rgba(59,130,246,.65); }
      #page-invvalue .d-mid { color:#a16207; } #page-invvalue .d-slow { color:#c2410c; font-weight:700; } #page-invvalue .d-none { color:var(--text3); font-weight:400; }
      #page-invvalue tr.ui-sum td { font-weight:700; position:sticky; bottom:0; z-index:1; background:var(--bg2); border-top:1px solid var(--text3); }
      #page-invvalue tr.ui-sum td.cc { background:linear-gradient(var(--iv-cost), var(--iv-cost)), var(--bg2); } #page-invvalue tr.ui-sum td.rc { background:linear-gradient(var(--iv-rsp), var(--iv-rsp)), var(--bg2); }
      #page-invvalue .iv-miss { font-size:11.5px; color:var(--text3); margin-top:10px; line-height:1.6; }
      #page-invvalue .iv-leg { display:flex; gap:14px; flex-wrap:wrap; font-size:11.5px; color:var(--text3); margin:0 0 10px; } #page-invvalue .iv-leg span::before { content:''; display:inline-block; width:10px; height:10px; border-radius:3px; margin-right:5px; vertical-align:-1px; }
      #page-invvalue .iv-leg .c::before { background:rgba(59,130,246,.35); } #page-invvalue .iv-leg .r::before { background:rgba(184,134,47,.45); } #page-invvalue .iv-leg .m::before { background:#ca8a04; } #page-invvalue .iv-leg .s::before { background:#c2410c; }
      @media (max-width: 1100px) { #page-invvalue .iv-k { grid-template-columns:1fr; } }`;
    document.head.appendChild(st);
  }
  let G = [], T = null, D0 = null, open = new Set(), vat = 'ex', sk = 'cAll', sd = -1;
  const cMul = () => vat === 'in' ? VATR : 1, rMul = () => vat === 'in' ? 1 : 1 / VATR;
  const vatTxt = () => vat === 'in' ? 'รวม VAT' : 'ไม่รวม VAT';
  const durTxt = d => d <= 60 ? `${n0(d)} วัน` : d <= 365 ? `${(d / 30).toFixed(1).replace(/\.0$/, '')} เดือน` : `${(d / 365).toFixed(1).replace(/\.0$/, '')} ปี`;
  const money = (v, part) => v == null ? '<span class="dash">—</span>' : part ? `${n0(v)}<span class="part" title="ไม่รวมสี / เบอร์ที่ยังไม่มีราคา">*</span>` : n0(v);
  const unitTxt = (lo, hi) => lo == null ? '<span class="dash">—</span>' : Math.abs(hi - lo) < 0.005 ? n2(lo) : `${n2(lo)}–${n2(hi)}`;
  function build(rows) {
    const by = new Map();
    rows.forEach(r => { r.cost = r.cost == null || +r.cost <= 0 ? null : +r.cost; r.rsp = r.rsp == null || +r.rsp <= 0 ? null : +r.rsp; r.fg = +r.fg || 0; r.wip = +r.wip || 0; r.avg = +r.avg || 0;
      const g = by.get(r.parent) || { parent: r.parent, name: r.pname || r.parent, kids: [] }; g.kids.push(r); by.set(r.parent, g); });
    return [...by.values()].map(g => { g.kids.sort((a, b) => String(a.sku).localeCompare(String(b.sku))); return g; });
  }
  function calc() {   // ค่าตามโหมด VAT ปัจจุบัน
    const cm = cMul(), rm = rMul();
    G.forEach(g => {
      const sum = (f, m, q) => { const v = g.kids.filter(k => k[f] != null).map(k => k[f] * m * q(k)); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
      g.fg = g.kids.reduce((a, k) => a + k.fg, 0); g.wip = g.kids.reduce((a, k) => a + k.wip, 0);
      g.cFg = sum('cost', cm, k => k.fg); g.cAll = sum('cost', cm, k => k.fg + k.wip); g.rFg = sum('rsp', rm, k => k.fg); g.rAll = sum('rsp', rm, k => k.fg + k.wip);
      const cs = g.kids.filter(k => k.cost != null).map(k => k.cost * cm), rs = g.kids.filter(k => k.rsp != null).map(k => k.rsp * rm);
      g.cLo = cs.length ? Math.min(...cs) : null; g.cHi = cs.length ? Math.max(...cs) : null; g.rLo = rs.length ? Math.min(...rs) : null; g.rHi = rs.length ? Math.max(...rs) : null;
      g.cMiss = g.kids.some(k => k.cost == null) && g.cFg != null; g.rMiss = g.kids.some(k => k.rsp == null) && g.rFg != null;
      g.days = Math.max(-1, ...g.kids.map(k => k.fg > 0 && k.avg > 0 ? k.fg / k.avg : k.fg > 0 ? 1e9 : -1));   // ไว้เรียงเท่านั้น
    });
    const s = f => G.reduce((a, g) => a + (g[f] || 0), 0);
    T = { fg: s('fg'), wip: s('wip'), cFg: s('cFg'), cAll: s('cAll'), rFg: s('rFg'), rAll: s('rAll') };
  }
  function sortG() {
    const v = g => sk === 'name' ? g.name : sk === 'share' ? (g.cAll ?? -1) : sk === 'cUnit' ? (g.cHi ?? -1) : sk === 'rUnit' ? (g.rHi ?? -1) : (g[sk] ?? -1);
    G.sort((a, b) => { const x = v(a), y = v(b); return (typeof x === 'string' ? x.localeCompare(y, 'th') : x - y) * sd || b.fg - a.fg; });
  }
  const coverCell = (fg, avg) => { if (!(fg > 0)) return '<td class="gl"><span class="dash">—</span></td>'; if (!(avg > 0)) return '<td class="gl"><span class="d-none">ยังไม่มียอดขาย</span></td>';
    const d = fg / avg; return `<td class="gl"><span class="${d > 365 ? 'd-slow' : d > 180 ? 'd-mid' : ''}">${durTxt(d)}</span></td>`; };
  const shareCell = v => { if (v == null || !T.cAll) return '<td class="gl"><span class="dash">—</span></td>'; const s = v / T.cAll * 100, mx = Math.max(...G.map(g => g.cAll || 0)) / T.cAll * 100 || 1;
    return `<td class="gl"><span class="shr">${s.toFixed(1)}%<i><b style="width:${Math.min(100, s / mx * 100).toFixed(1)}%"></b></i></span></td>`; };
  function rowsHtml() {
    const cm = cMul(), rm = rMul();
    return G.map(g => {
      const multi = g.kids.length > 1, op = open.has(g.parent), one = multi ? null : g.kids[0];
      const par = `<tr class="par${multi ? ' has' : ''}${op ? ' open' : ''}" data-p="${esc(g.parent)}">
          <td class="nm" title="${esc(g.name)}">${multi ? '<span class="car">▶</span>' : '<span class="car"></span>'}${esc(g.name)}${g.name !== g.parent ? `<span class="sku">${esc(g.parent)}</span>` : ''}${multi ? `<span class="cnt">${g.kids.length} สี / เบอร์</span>` : ''}</td>
          <td class="gl">${n0(g.fg)}</td><td>${g.wip ? n0(g.wip) : '<span class="dash">—</span>'}</td>
          <td class="gl cc">${unitTxt(g.cLo, g.cHi)}</td><td class="cc">${money(g.cFg, g.cMiss)}</td><td class="cc">${money(g.cAll, g.cMiss)}</td>
          <td class="gl rc">${unitTxt(g.rLo, g.rHi)}</td><td class="rc">${money(g.rFg, g.rMiss)}</td><td class="rc">${money(g.rAll, g.rMiss)}</td>
          ${shareCell(g.cAll)}${one ? coverCell(one.fg, one.avg) : '<td class="gl"></td>'}</tr>`;
      const kids = multi ? g.kids.map(k => { const c = k.cost == null ? null : k.cost * cm, r = k.rsp == null ? null : k.rsp * rm;
        return `<tr class="kid" data-pp="${esc(g.parent)}"${op ? '' : ' hidden'}><td class="nm"><span class="sku">${esc(k.sku)}</span>${k.name && k.name !== g.name ? ` ${esc(k.name)}` : ''}</td>
          <td class="gl">${k.fg ? n0(k.fg) : '<span class="dash">—</span>'}</td><td>${k.wip ? n0(k.wip) : '<span class="dash">—</span>'}</td>
          <td class="gl cc"></td><td class="cc">${money(c == null ? null : c * k.fg)}</td><td class="cc">${money(c == null ? null : c * (k.fg + k.wip))}</td>
          <td class="gl rc"></td><td class="rc">${money(r == null ? null : r * k.fg)}</td><td class="rc">${money(r == null ? null : r * (k.fg + k.wip))}</td>
          <td class="gl"></td>${coverCell(k.fg, k.avg)}</tr>`; }).join('') : '';
      return par + kids; }).join('');
  }
  const th = (key, label, cls, t, rs) => `<th class="sort ${cls || ''}" data-sk="${key}"${rs ? ' rowspan="2"' : ''}>${label}${t || ''}${sk === key ? `<span class="ar">${sd < 0 ? '▼' : '▲'}</span>` : ''}</th>`;
  function draw() {
    const el = document.getElementById('page-invvalue'); if (!el) return;
    calc(); sortG();
    const missC = [], missR = []; G.forEach(g => g.kids.forEach(k => { if (k.cost == null) missC.push(k.sku); if (k.rsp == null) missR.push(k.sku); }));
    const vt = vatTxt();
    el.innerHTML = `
      <div class="iv-k">
        <div><div class="l">จำนวนสินค้าคงคลัง (ชิ้น)</div><div class="row"><span>สินค้าสำเร็จรูป${tip('ivt1', 'สต็อกทุกคลัง + สินค้าที่ผลิตเสร็จแล้วรอเรียกที่โรงงาน (Hold)')}</span><b>${n0(T.fg)}</b></div><div class="row sub"><span>รวม PO ที่ยังไม่ผลิต${tip('ivt2', 'สินค้าสำเร็จรูป + จำนวนที่เปิด PO แล้วแต่ยังไม่ผลิต (WIP) จากชีท PO')}</span><b>${n0(T.fg + T.wip)}</b></div></div>
        <div class="c"><div class="l">มูลค่าตามราคาทุน (${vt})${tip('ivt3', 'จำนวนชิ้น × ต้นทุนต่อชิ้นจากไฟล์ต้นทุนของบัญชี (ต้นฉบับไม่รวม VAT · โหมดรวม VAT = × 1.07)')}</div><div class="row"><span>สินค้าสำเร็จรูป</span><b>${n0(T.cFg)}</b></div><div class="row sub"><span>รวม PO ที่ยังไม่ผลิต</span><b>${n0(T.cAll)}</b></div></div>
        <div class="r"><div class="l">มูลค่าตามราคาขาย RSP (${vt})${tip('ivt4', 'จำนวนชิ้น × ราคาขายปกติ (RSP) จากหน้า สินค้า & ราคา (ต้นฉบับรวม VAT · โหมดไม่รวม VAT = ÷ 1.07)')}</div><div class="row"><span>สินค้าสำเร็จรูป</span><b>${n0(T.rFg)}</b></div><div class="row sub"><span>รวม PO ที่ยังไม่ผลิต</span><b>${n0(T.rAll)}</b></div></div>
      </div>
      <div class="iv-card"><h3>มูลค่าสินค้าคงคลังรายสินค้า</h3>
        <div class="iv-leg"><span class="c">ราคาทุน</span><span class="r">ราคาขาย RSP</span><span class="m">ขายได้ 6–12 เดือน</span><span class="s">ขายได้นานกว่า 1 ปี</span></div>
        <div class="iv-wrap"><table class="iv" data-no-sort data-no-page>
          <colgroup><col style="width:19%">${'<col>'.repeat(10)}</colgroup>
          <thead><tr class="h1">${th('name', 'สินค้า', 'nm', '', 1)}<th class="gl" colspan="2">จำนวน (ชิ้น)</th><th class="gl gc" colspan="3">ราคาทุน (${vt})</th><th class="gl gr" colspan="3">ราคาขาย RSP (${vt})</th>
              ${th('share', 'สัดส่วน', 'gl', tip('ivt5', 'มูลค่าตามราคาทุน รวม PO ที่ยังไม่ผลิต ของสินค้านี้ ÷ มูลค่ารวมทั้งหมด'), 1)}${th('days', 'ระยะเวลาจำหน่าย', 'gl', tip('ivt6', 'สินค้าสำเร็จรูป ÷ ยอดขายเฉลี่ยต่อวัน (ชุดเดียวกับหน้า Supply Chain) · คิดแยกราย สี / เบอร์ จึงแสดงในแถวย่อย'), 1)}</tr>
            <tr class="h2">${th('fg', 'สำเร็จรูป', 'gl')}${th('wip', 'PO ยังไม่ผลิต')}${th('cUnit', 'ต่อชิ้น', 'gl gc')}${th('cFg', 'สำเร็จรูป', 'gc')}${th('cAll', 'รวม PO', 'gc')}${th('rUnit', 'ต่อชิ้น', 'gl gr')}${th('rFg', 'สำเร็จรูป', 'gr')}${th('rAll', 'รวม PO', 'gr')}</tr></thead>
          <tbody id="ivBody">${rowsHtml()}</tbody>
          <tbody><tr class="ui-sum"><td class="nm">รวม ${n0(G.length)} สินค้า</td><td class="gl">${n0(T.fg)}</td><td>${n0(T.wip)}</td><td class="gl cc"></td><td class="cc">${n0(T.cFg)}</td><td class="cc">${n0(T.cAll)}</td><td class="gl rc"></td><td class="rc">${n0(T.rFg)}</td><td class="rc">${n0(T.rAll)}</td><td class="gl">100%</td><td class="gl"></td></tr></tbody>
        </table></div>
        <div class="iv-miss">${missC.length ? `ยังไม่มีต้นทุน ${missC.length} รายการ (มูลค่าแสดง —): ${missC.map(esc).join(', ')}<br>` : ''}${missR.length ? `ยังไม่มีราคา RSP ${missR.length} รายการ: ${missR.map(esc).join(', ')}<br>` : ''}${missC.length || missR.length ? '* = ไม่รวมสี / เบอร์ที่ยังไม่มีราคา · ' : ''}กดหัวคอลัมน์เพื่อเรียง · ข้อมูล ณ ${esc((D0 && D0.as_of) || '')}</div>
      </div>`;
    const h1 = el.querySelector('thead tr.h1'); if (h1) el.style.setProperty('--ivh1', h1.offsetHeight + 'px');
    el.onclick = e => {
      const h = e.target.closest('th.sort'); if (h) { const k = h.dataset.sk; if (sk === k) sd = -sd; else { sk = k; sd = k === 'name' ? 1 : -1; } draw(); return; }
      const tr = e.target.closest('tr.par.has'); if (!tr) return;
      const p = tr.dataset.p, op = !open.has(p); op ? open.add(p) : open.delete(p); tr.classList.toggle('open', op);
      el.querySelectorAll('tr.kid').forEach(k => { if (k.dataset.pp === p) k.hidden = !op; });
    };
  }
  function setVat(v) { vat = v === 'in' ? 'in' : 'ex'; document.querySelectorAll('#ivVatGroup [data-vat]').forEach(b => b.setAttribute('aria-pressed', b.dataset.vat === vat)); if (G.length) draw(); }
  async function render() {
    const el = document.getElementById('page-invvalue'); if (!el) return;
    document.querySelectorAll('#ivVatGroup [data-vat]').forEach(b => b.setAttribute('aria-pressed', b.dataset.vat === vat));
    if (!G.length) el.innerHTML = '<div class="empty" style="padding:40px;text-align:center;color:var(--text3);">กำลังโหลด…</div>';
    try { D0 = await Auth.rpc('inventory_value'); G = build((D0 && D0.rows) || []); draw(); }
    catch (e) { el.innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; }
  }
  window.InvValue = { render, setVat };
})();
