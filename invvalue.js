// invvalue.js (v20261028a) — มูลค่าสินค้าคงคลัง (Management)
// จำนวนชิ้น · มูลค่าตามราคาทุน (ไม่รวม VAT) · มูลค่าตามราคาขาย RSP (รวม VAT) — แต่ละแบบแยก "สินค้าสำเร็จรูป" กับ "รวม PO ที่ยังไม่ผลิต"
// สินค้าสำเร็จรูป = สต็อกทุกคลัง + ผลิตเสร็จรอที่โรงงาน (Hold) · PO ที่ยังไม่ผลิต = WIP · ระยะเวลาจำหน่าย = สินค้าสำเร็จรูป ÷ ยอดขายเฉลี่ยต่อวัน (ชุดเดียวกับ Supply Chain) ราย child SKU
// ข้อมูล: RPC inventory_value() · กด Parent ที่มีหลาย child เพื่อดูแยกสี / เบอร์ (เปิดในที่ ไม่โหลดตารางใหม่)
(function () {
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const n0 = v => Math.round(+v || 0).toLocaleString('th-TH');
  const tip = (id, t) => window.fbeInfoIcon ? window.fbeInfoIcon(id, t) : ` <span title="${esc(t)}">ⓘ</span>`;
  if (!document.getElementById('ivStyle')) {
    const st = document.createElement('style'); st.id = 'ivStyle';
    st.textContent = `
      #page-invvalue .iv-k { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin-bottom:16px; }
      #page-invvalue .iv-k > div { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px; min-width:0; }
      #page-invvalue .iv-k .l { font-size:12.5px; color:var(--text2); font-weight:600; margin-bottom:8px; }
      #page-invvalue .iv-k .r { display:flex; justify-content:space-between; align-items:baseline; gap:8px; font-size:12px; color:var(--text3); padding:3px 0; }
      #page-invvalue .iv-k .r b { font-size:18px; color:var(--text); font-variant-numeric:tabular-nums; white-space:nowrap; } #page-invvalue .iv-k .r.sub b { font-size:14px; color:var(--text2); }
      #page-invvalue .iv-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px 10px; }
      #page-invvalue .iv-card h3 { margin:0 0 10px; font-size:14px; font-weight:700; color:var(--text); }
      #page-invvalue .iv-wrap { overflow-x:auto; }
      #page-invvalue table.iv { width:100%; border-collapse:collapse; font-size:12.5px; min-width:980px; }
      #page-invvalue table.iv th { font-size:11.5px; font-weight:600; color:var(--text3); padding:7px 8px; text-align:right; border-bottom:1px solid var(--border); white-space:nowrap; }
      #page-invvalue table.iv thead tr:first-child th.g { text-align:center; color:var(--text2); border-bottom:1px solid var(--border); }
      #page-invvalue table.iv th.g1, #page-invvalue table.iv td.g1 { border-left:1px solid var(--border); }
      #page-invvalue table.iv th.nm, #page-invvalue table.iv td.nm { text-align:left; }
      #page-invvalue table.iv td { padding:8px 8px; text-align:right; border-bottom:1px solid var(--border); font-variant-numeric:tabular-nums; white-space:nowrap; }
      #page-invvalue tr.par td { font-weight:600; } #page-invvalue tr.par.has { cursor:pointer; } #page-invvalue tr.par.has:hover td { background:rgba(127,127,127,.05); }
      #page-invvalue tr.par .car { display:inline-block; width:14px; font-size:9px; color:var(--text3); transition:transform .15s; } #page-invvalue tr.par.open .car { transform:rotate(90deg); }
      #page-invvalue tr.kid td { font-size:12px; color:var(--text2); background:var(--bg3); } #page-invvalue tr.kid td.nm { padding-left:30px; }
      #page-invvalue .sku { font-family:'IBM Plex Mono', monospace; font-size:11px; color:var(--text3); margin-left:6px; } #page-invvalue tr.kid .sku { margin-left:0; color:var(--text2); font-size:11.5px; }
      #page-invvalue .dash { color:var(--text3); } #page-invvalue .part { color:#b45309; }
      #page-invvalue .shr { display:flex; align-items:center; gap:6px; justify-content:flex-end; } #page-invvalue .shr i { display:block; width:56px; height:4px; border-radius:2px; background:var(--bg3); overflow:hidden; } #page-invvalue .shr i b { display:block; height:100%; background:var(--text3); }
      #page-invvalue .slow { color:#b45309; font-weight:600; }
      #page-invvalue tr.ui-sum td { font-weight:700; }
      #page-invvalue .iv-ft { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; padding:10px 2px 2px; font-size:11.5px; color:var(--text3); }
      #page-invvalue .iv-pg { display:flex; align-items:center; gap:6px; } #page-invvalue .iv-pg button { font:inherit; border:1px solid var(--border); background:var(--bg2); color:var(--text2); border-radius:7px; min-width:30px; height:28px; padding:0 8px; cursor:pointer; }
      #page-invvalue .iv-pg button.on { background:var(--accent,#b8862f); color:#fff; border-color:transparent; } #page-invvalue .iv-pg button:disabled { opacity:.4; cursor:default; } #page-invvalue .iv-pg select { font:inherit; border:1px solid var(--border); background:var(--bg2); color:var(--text); border-radius:7px; height:28px; padding:0 6px; }
      #page-invvalue .iv-miss { font-size:11.5px; color:var(--text3); margin-top:8px; line-height:1.6; }
      @media (max-width: 1100px) { #page-invvalue .iv-k { grid-template-columns:1fr; } }`;
    document.head.appendChild(st);
  }
  let G = [], T = null, pg = 1, per = 20, open = new Set();
  const durTxt = d => d == null ? '' : d <= 60 ? `${n0(d)} วัน` : d <= 365 ? `${(d / 30).toFixed(1).replace(/\.0$/, '')} เดือน` : `${(d / 365).toFixed(1).replace(/\.0$/, '')} ปี`;
  function money(v, part, all) { if (v == null) return '<span class="dash" title="ยังไม่มีราคา">—</span>'; return part && !all ? `${n0(v)}<span class="part" title="ไม่รวมสี / เบอร์ที่ยังไม่มีราคา">*</span>` : n0(v); }
  function build(rows) {
    const by = new Map();
    rows.forEach(r => { const g = by.get(r.parent) || { parent: r.parent, name: r.pname || r.parent, kids: [] }; g.kids.push(r); by.set(r.parent, g); });
    const val = (k, f, q) => k[f] == null ? null : (+k[f]) * q;
    const out = [...by.values()].map(g => {
      const s = (f, q) => { const v = g.kids.map(k => val(k, f, q(k))).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
      g.fg = g.kids.reduce((a, k) => a + (+k.fg || 0), 0); g.wip = g.kids.reduce((a, k) => a + (+k.wip || 0), 0);
      g.cFg = s('cost', k => +k.fg); g.cAll = s('cost', k => +k.fg + +k.wip); g.rFg = s('rsp', k => +k.fg); g.rAll = s('rsp', k => +k.fg + +k.wip);
      g.cMiss = g.kids.some(k => k.cost == null); g.rMiss = g.kids.some(k => k.rsp == null);
      g.kids.sort((a, b) => String(a.sku).localeCompare(String(b.sku)));
      return g; });
    out.sort((a, b) => (b.cAll ?? -1) - (a.cAll ?? -1) || b.fg - a.fg);
    return out;
  }
  function totals() {
    const sum = f => G.reduce((a, g) => a + (g[f] || 0), 0);
    return { fg: sum('fg'), wip: sum('wip'), cFg: sum('cFg'), cAll: sum('cAll'), rFg: sum('rFg'), rAll: sum('rAll') };
  }
  const shareCell = v => { if (v == null || !T.cAll) return '<td class="g1"><span class="dash">—</span></td>'; const s = v / T.cAll * 100;
    return `<td class="g1"><div class="shr">${s.toFixed(1)}%<i><b style="width:${Math.min(100, s / (G[0] && G[0].cAll ? G[0].cAll / T.cAll * 100 : 100) * 100).toFixed(1)}%"></b></i></div></td>`; };
  const coverCell = (fg, avg) => { if (!(fg > 0)) return '<td class="g1"><span class="dash">—</span></td>'; if (!(+avg > 0)) return '<td class="g1"><span class="dash">ยังไม่มียอดขาย</span></td>';
    const d = fg / +avg; return `<td class="g1${d > 365 ? ' slow' : ''}">${durTxt(d)}</td>`; };
  function rowsHtml() {
    const list = G.slice((pg - 1) * per, pg * per);
    return list.map(g => {
      const multi = g.kids.length > 1, op = open.has(g.parent);
      const one = g.kids.length === 1 ? g.kids[0] : null;
      const par = `<tr class="par${multi ? ' has' : ''}${op ? ' open' : ''}" data-p="${esc(g.parent)}">
          <td class="nm">${multi ? '<span class="car">▶</span>' : '<span class="car"></span>'}${esc(g.name)}${g.name !== g.parent ? `<span class="sku">${esc(g.parent)}</span>` : ''}${multi ? `<span class="sku">· ${g.kids.length} สี / เบอร์</span>` : ''}</td>
          <td class="g1">${n0(g.fg)}</td><td>${g.wip ? n0(g.wip) : '<span class="dash">—</span>'}</td>
          <td class="g1">${money(g.cFg, g.cMiss, g.cFg == null)}</td><td>${money(g.cAll, g.cMiss, g.cAll == null)}</td>
          <td class="g1">${money(g.rFg, g.rMiss, g.rFg == null)}</td><td>${money(g.rAll, g.rMiss, g.rAll == null)}</td>
          ${shareCell(g.cAll)}${one ? coverCell(+one.fg, one.avg) : '<td class="g1"></td>'}</tr>`;
      const kids = multi ? g.kids.map(k => { const fg = +k.fg, wp = +k.wip, c = k.cost == null ? null : +k.cost, r = k.rsp == null ? null : +k.rsp;
        return `<tr class="kid" data-pp="${esc(g.parent)}"${op ? '' : ' hidden'}><td class="nm"><span class="sku">${esc(k.sku)}</span>${k.name && k.name !== g.name ? ` ${esc(k.name)}` : ''}</td>
          <td class="g1">${fg ? n0(fg) : '<span class="dash">—</span>'}</td><td>${wp ? n0(wp) : '<span class="dash">—</span>'}</td>
          <td class="g1">${money(c == null ? null : c * fg)}</td><td>${money(c == null ? null : c * (fg + wp))}</td>
          <td class="g1">${money(r == null ? null : r * fg)}</td><td>${money(r == null ? null : r * (fg + wp))}</td>
          <td class="g1"></td>${coverCell(fg, k.avg)}</tr>`; }).join('') : '';
      return par + kids; }).join('');
  }
  function pager() {
    const pages = Math.max(1, Math.ceil(G.length / per)), b = [];
    for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - pg) <= 1) b.push(i); else if (b[b.length - 1] !== '…') b.push('…');
    return `<span>แสดง ${G.length ? (pg - 1) * per + 1 : 0}–${Math.min(pg * per, G.length)} จาก ${G.length} สินค้า</span>
      <div class="iv-pg"><button type="button" data-pg="${pg - 1}" ${pg <= 1 ? 'disabled' : ''}>‹</button>${b.map(x => x === '…' ? '<span>…</span>' : `<button type="button" data-pg="${x}" class="${x === pg ? 'on' : ''}">${x}</button>`).join('')}<button type="button" data-pg="${pg + 1}" ${pg >= pages ? 'disabled' : ''}>›</button>
      <span style="margin-left:8px;">ต่อหน้า</span><select id="ivPer">${[20, 50, 100].map(n => `<option${n === per ? ' selected' : ''}>${n}</option>`).join('')}</select></div>`;
  }
  function draw(el, D) {
    T = totals();
    const missC = [], missR = []; G.forEach(g => g.kids.forEach(k => { if (k.cost == null) missC.push(k.sku); if (k.rsp == null) missR.push(k.sku); }));
    el.innerHTML = `
      <div class="iv-k">
        <div><div class="l">จำนวนสินค้าคงคลัง (ชิ้น)</div><div class="r"><span>สินค้าสำเร็จรูป${tip('ivt1', 'สต็อกทุกคลัง + สินค้าที่ผลิตเสร็จแล้วรอเรียกที่โรงงาน (Hold)')}</span><b>${n0(T.fg)}</b></div><div class="r sub"><span>รวม PO ที่ยังไม่ผลิต${tip('ivt2', 'สินค้าสำเร็จรูป + จำนวนที่เปิด PO แล้วแต่ยังไม่ผลิต (WIP) จากชีท PO')}</span><b>${n0(T.fg + T.wip)}</b></div></div>
        <div><div class="l">มูลค่าตามราคาทุน (ไม่รวม VAT)${tip('ivt3', 'จำนวนชิ้น × ต้นทุนต่อชิ้นไม่รวม VAT จากไฟล์ต้นทุนของบัญชี')}</div><div class="r"><span>สินค้าสำเร็จรูป</span><b>${n0(T.cFg)}</b></div><div class="r sub"><span>รวม PO ที่ยังไม่ผลิต</span><b>${n0(T.cAll)}</b></div></div>
        <div><div class="l">มูลค่าตามราคาขาย RSP (รวม VAT)${tip('ivt4', 'จำนวนชิ้น × ราคาขายปกติ (RSP) จากหน้า สินค้า & ราคา')}</div><div class="r"><span>สินค้าสำเร็จรูป</span><b>${n0(T.rFg)}</b></div><div class="r sub"><span>รวม PO ที่ยังไม่ผลิต</span><b>${n0(T.rAll)}</b></div></div>
      </div>
      <div class="iv-card"><h3>มูลค่าสินค้าคงคลังรายสินค้า</h3><div class="iv-wrap">
        <table class="iv" data-no-sort data-no-page><thead>
          <tr><th class="nm" rowspan="2">สินค้า</th><th class="g g1" colspan="2">จำนวน (ชิ้น)</th><th class="g g1" colspan="2">มูลค่าตามราคาทุน (ไม่รวม VAT)</th><th class="g g1" colspan="2">มูลค่าตามราคาขาย RSP (รวม VAT)</th>
            <th class="g1" rowspan="2">สัดส่วน${tip('ivt5', 'มูลค่าตามราคาทุน รวม PO ที่ยังไม่ผลิต ของสินค้านี้ ÷ มูลค่ารวมทั้งหมด')}</th><th class="g1" rowspan="2">ระยะเวลาจำหน่าย${tip('ivt6', 'สินค้าสำเร็จรูป ÷ ยอดขายเฉลี่ยต่อวัน (ชุดเดียวกับหน้า Supply Chain) · คิดแยกราย สี / เบอร์ จึงแสดงในแถวย่อย · เกิน 1 ปีแสดงสีส้ม')}</th></tr>
          <tr><th class="g1">สำเร็จรูป</th><th>รวม PO</th><th class="g1">สำเร็จรูป</th><th>รวม PO</th><th class="g1">สำเร็จรูป</th><th>รวม PO</th></tr></thead>
          <tbody id="ivBody">${rowsHtml()}</tbody>
          <tbody><tr class="ui-sum"><td class="nm">รวม ${n0(G.length)} สินค้า</td><td class="g1">${n0(T.fg)}</td><td>${n0(T.wip)}</td><td class="g1">${n0(T.cFg)}</td><td>${n0(T.cAll)}</td><td class="g1">${n0(T.rFg)}</td><td>${n0(T.rAll)}</td><td class="g1">100%</td><td class="g1"></td></tr></tbody>
        </table></div>
        <div class="iv-ft" id="ivFt">${pager()}</div>
        ${missC.length || missR.length ? `<div class="iv-miss">${missC.length ? `ยังไม่มีต้นทุน ${missC.length} รายการ (มูลค่าแสดง —): ${missC.map(esc).join(', ')}` : ''}${missC.length && missR.length ? '<br>' : ''}${missR.length ? `ยังไม่มีราคา RSP ${missR.length} รายการ: ${missR.map(esc).join(', ')}` : ''}<br>* = ไม่รวมสี / เบอร์ที่ยังไม่มีราคา · ข้อมูล ณ ${esc(D.as_of || '')}</div>` : `<div class="iv-miss">ข้อมูล ณ ${esc(D.as_of || '')}</div>`}
      </div>`;
    el.onclick = e => {
      const pb = e.target.closest('[data-pg]'); if (pb && !pb.disabled) { pg = +pb.dataset.pg; document.getElementById('ivBody').innerHTML = rowsHtml(); document.getElementById('ivFt').innerHTML = pager(); return; }
      const tr = e.target.closest('tr.par.has'); if (!tr) return;
      const p = tr.dataset.p, op = !open.has(p); op ? open.add(p) : open.delete(p); tr.classList.toggle('open', op);
      el.querySelectorAll('tr.kid').forEach(k => { if (k.dataset.pp === p) k.hidden = !op; });
    };
    el.onchange = e => { if (e.target.id === 'ivPer') { per = +e.target.value; pg = 1; document.getElementById('ivBody').innerHTML = rowsHtml(); document.getElementById('ivFt').innerHTML = pager(); } };
  }
  async function render() {
    const el = document.getElementById('page-invvalue'); if (!el) return;
    if (!G.length) el.innerHTML = '<div class="empty" style="padding:40px;text-align:center;color:var(--text3);">กำลังโหลด…</div>';
    try { const D = await Auth.rpc('inventory_value'); G = build((D && D.rows) || []); pg = 1; draw(el, D || {}); }
    catch (e) { el.innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; }
  }
  window.InvValue = { render };
})();
