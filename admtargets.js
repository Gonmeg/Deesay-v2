// admtargets.js (v20261022a) — หน้า Admin › "ตั้งเป้ายอดขาย" (ตารางแบบ Excel)
// แถว = ช่องทางย่อย (TikTok: แอฟฟิลิเอต / ผู้ขาย ไลฟ์ / วิดีโอ / การ์ดสินค้า · Facebook: เพจ · Shopee / Lazada: ร้าน) · คอลัมน์ = ทั้งปี + 12 เดือน
//   พิมพ์ "ทั้งปี" → 12 เดือนแบ่งตามจำนวนวันให้เอง · พิมพ์ทับรายเดือน = ล็อกเดือนนั้น (สีส้ม) เดือนที่เหลือแบ่งส่วนที่เหลือ รวมเท่าทั้งปี
//   ลบให้ว่าง: ช่องเดือน = กลับไปแบ่งอัตโนมัติ · ช่องทั้งปี = ลบเป้าแถวนั้น · Enter / กดที่อื่น = บันทึก · Esc = ยกเลิก
//   ใช้ได้เฉพาะผู้ดูแลระบบ + คนที่มีสิทธิ์แก้ KPI · RPC kpi_sales_targets / kpi_sales_targets_save (ตรวจสิทธิ์ฝั่งเซิร์ฟเวอร์)
(function () {
  'use strict';
  const CHS = ['TikTok', 'Facebook', 'Shopee', 'Lazada'];
  const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n0 = v => v == null || isNaN(+v) ? '' : Math.round(+v).toLocaleString('en-US');
  const short = v => { v = +v || 0; const a = Math.abs(v); return a >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : a >= 1e3 ? Math.round(v / 1e3) + 'k' : String(Math.round(v)); };
  const thisYear = () => new Date(Date.now() + 7 * 3600000).getUTCFullYear();
  let S = { ch: 'TikTok', year: thisYear(), data: null, seq: 0 };

  async function load() {
    const my = ++S.seq, box = $('atBody'); if (!box) return;
    box.innerHTML = '<div class="at-empty">กำลังโหลด…</div>';
    try { const d = await Auth.rpc('kpi_sales_targets', { p_year: S.year, p_channel: S.ch }); if (my !== S.seq) return; S.data = d; draw(); }
    catch (e) { box.innerHTML = `<div class="at-empty" style="color:var(--red,#dc2626);">โหลดไม่สำเร็จ: ${esc(e.message || e)}</div>`; }
  }
  async function save(p) {
    const box = $('atBody'); if (box) box.style.opacity = '.6';
    try { S.data = await Auth.rpc('kpi_sales_targets_save', { p_year: S.year, p_channel: S.ch, p }); }
    catch (e) { if (typeof uiAlert === 'function') uiAlert('บันทึกไม่สำเร็จ', { text: e.message || String(e), tone: 'bad' }); else alert(e.message || e); }
    if (box) box.style.opacity = ''; draw();
  }
  function edit(td, cur, onSave) {
    if (td.querySelector('input')) return;
    td.innerHTML = `<input class="at-in" inputmode="numeric" value="${cur == null ? '' : n0(cur)}">`;
    const inp = td.querySelector('input'); inp.focus(); inp.select();
    let done = false;
    const fin = ok => { if (done) return; done = true; if (!ok) return draw(); const v = String(inp.value || '').replace(/[^\d.]/g, ''); onSave(v === '' ? null : String(Math.round(+v))); };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') fin(true); else if (e.key === 'Escape') fin(false); else if (e.key === 'Tab') { e.preventDefault(); fin(true); } });
    inp.addEventListener('blur', () => fin(true));
  }
  window.atAnnual = (td, k) => { const r = S.data.rows.find(x => x.k === k); edit(td, r && r.annual, v => save({ annual: { [k]: v } })); };
  window.atMonth = (td, k, i) => {
    const r = S.data.rows.find(x => x.k === k); if (!r) return;
    const m = (r.months || [])[i]; const ym = `${S.year}-${String(i + 1).padStart(2, '0')}`;
    edit(td, m && m.is_override ? m.plan : (m && m.plan != null ? Math.round(+m.plan) : null), v => save({ months: { [ym]: { [k]: v } } }));
  };
  window.atCh = c => { S.ch = c; load(); syncHash(); };
  window.atYear = y => { S.year = +y; load(); syncHash(); };
  const syncHash = () => { try { history.replaceState(null, '', `#targets?ch=${encodeURIComponent(S.ch)}&y=${S.year}`); } catch (e) {} };

  function draw() {
    const box = $('atBody'); if (!box || !S.data) return;
    const rows = S.data.rows || [];
    const tot = { annual: 0, m: Array(12).fill(0) };
    rows.forEach(r => { tot.annual += +r.annual || 0; (r.months || []).forEach((x, i) => { tot.m[i] += +x.plan || 0; }); });
    const body = rows.map(r => {
      const has = r.annual != null && +r.annual > 0;
      return `<tr><td class="l" title="${esc(r.label)}">${esc(r.label)}<div class="at-sub">ทำได้ปีนี้ ${n0(r.ytd) || 0}</div></td>
        <td class="at-an" onclick="atAnnual(this,'${esc(r.k)}')" data-tip="พิมพ์เป้าทั้งปี · ลบให้ว่าง = ลบเป้าแถวนี้">${has ? n0(r.annual) : '<span class="at-add">＋ ตั้งเป้า</span>'}</td>
        ${(r.months || []).map((x, i) => `<td class="${x.is_override ? 'at-ov' : ''}${has ? '' : ' at-off'}"${has ? ` onclick="atMonth(this,'${esc(r.k)}',${i})" data-tip="${x.is_override ? 'แก้เอง · ลบให้ว่าง = กลับไปแบ่งอัตโนมัติ' : 'แบ่งอัตโนมัติ · พิมพ์ทับเพื่อล็อกเดือนนี้'}"` : ''}>${x.plan != null ? short(x.plan) : '—'}</td>`).join('')}</tr>`;
    }).join('');
    const yrs = [S.year - 1, S.year, S.year + 1].map(v => `<option value="${v}"${v === S.year ? ' selected' : ''}>ปี ${v + 543}</option>`).join('');
    box.innerHTML = `<div class="at-top"><div class="at-pills">${CHS.map(c => `<button type="button" class="at-pill${c === S.ch ? ' on' : ''}" onclick="atCh('${c}')">${c}</button>`).join('')}</div>
        <span style="flex:1;"></span><select class="at-yr" onchange="atYear(this.value)">${yrs}</select>
        <a class="at-link" href="dashboard.html?page=kpi&tab=sales">ดูผลที่หน้าเป้าหมาย KPI ↗</a></div>
      <div class="at-wrap"><table class="at-tbl"><thead><tr><th class="l">${S.ch === 'Facebook' ? 'เพจ' : S.ch === 'TikTok' ? 'แถว (GMV ตาม TikTok)' : 'ร้าน'}</th><th>ทั้งปี</th>${MS.map(m => `<th>${m}</th>`).join('')}</tr></thead>
      <tbody>${body || '<tr><td colspan="14" class="at-empty">ไม่มีข้อมูล</td></tr>'}</tbody>
      <tfoot><tr><td class="l">รวม</td><td>${tot.annual ? n0(tot.annual) : '—'}</td>${tot.m.map(v => `<td>${v ? short(v) : '—'}</td>`).join('')}</tr></tfoot></table></div>
      <div class="at-hint">พิมพ์ช่อง <b>ทั้งปี</b> → 12 เดือนแบ่งตามจำนวนวันให้เอง · อยากให้เดือนไหนสูงกว่า พิมพ์ทับได้ (ช่องสีส้ม = แก้เอง) เดือนที่เหลือปรับให้รวมเท่าทั้งปีเอง · Enter บันทึก · Esc ยกเลิก<br>
      ยอดที่ขาด / เกินในแต่ละเดือนจะยกไปเพิ่ม / ลดเป้าเดือนถัดไปให้อัตโนมัติ (ดูที่หน้าเป้าหมาย KPI)</div>`;
  }

  // เปิดจากลิงก์ admin.html#targets?ch=Facebook&y=2026
  window.openAdminTargets = () => {
    const m = /#targets\?(.*)$/.exec(location.hash || ''); if (m) { const q = new URLSearchParams(m[1]); if (CHS.includes(q.get('ch'))) S.ch = q.get('ch'); if (+q.get('y') > 2000) S.year = +q.get('y'); }
    load();
  };

  if (!$('atStyle')) {
    const st = document.createElement('style'); st.id = 'atStyle'; st.textContent = `
.at-top { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
.at-pills { display:flex; gap:6px; } .at-pill { border:1px solid var(--border, #e5e7eb); background:transparent; border-radius:20px; padding:6px 14px; font-size:13px; color:inherit; cursor:pointer; font-family:inherit; opacity:.8; }
.at-pill.on { background:#b8862f; border-color:#b8862f; color:#fff; font-weight:700; opacity:1; }
.at-yr { border:1px solid var(--border, #e5e7eb); background:transparent; color:inherit; border-radius:9px; padding:6px 10px; font-family:inherit; font-size:13px; }
.at-link { font-size:12.5px; color:#b8862f; text-decoration:none; }
.at-wrap { overflow-x:auto; }
.at-tbl { width:100%; border-collapse:collapse; font-size:12.5px; min-width:1100px; }
.at-tbl th { font-size:11px; opacity:.65; font-weight:600; padding:8px 4px; border-bottom:1px solid var(--border, #e5e7eb); text-align:center; }
.at-tbl td { padding:9px 4px; border-bottom:1px solid var(--border, #e5e7eb); text-align:center; font-variant-numeric:tabular-nums; white-space:nowrap; cursor:pointer; }
.at-tbl th.l, .at-tbl td.l { text-align:left; width:260px; max-width:260px; overflow:hidden; text-overflow:ellipsis; cursor:default; }
.at-sub { font-size:10.5px; opacity:.55; font-weight:400; }
.at-tbl td.at-an { font-weight:700; background:rgba(184,134,47,.10); border-left:1px solid rgba(184,134,47,.35); border-right:1px solid rgba(184,134,47,.35); }
.at-tbl td.at-ov { background:rgba(245,158,11,.16); font-weight:700; }
.at-tbl td.at-off { opacity:.4; cursor:default; }
.at-tbl td:hover:not(.l):not(.at-off) { outline:1.5px solid #b8862f; outline-offset:-2px; }
.at-tbl tfoot td { font-weight:700; cursor:default; border-bottom:0; }
.at-add { opacity:.55; font-weight:400; }
.at-in { width:100%; max-width:120px; text-align:right; padding:4px 6px; font-size:12.5px; border:1.5px solid #b8862f; border-radius:6px; background:var(--bg, #fff); color:inherit; font-family:inherit; }
.at-hint { font-size:11.5px; opacity:.6; margin-top:10px; line-height:1.6; }
.at-empty { padding:24px; text-align:center; opacity:.6; }`;
    document.head.appendChild(st);
  }
})();
