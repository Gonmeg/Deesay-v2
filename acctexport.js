// acctexport.js (2026-11-09) — ส่งออกให้บัญชี · ใช้ร่วม: หน้า Admin → Export และปุ่มเดิมในหน้าอัปโหลดข้อมูล (ไฟล์หน้าตาเดียวกันทุกที่)
// ไฟล์ "จำนวนชิ้นที่ได้เงินแล้ว ระดับสินค้าย่อย" (ต้นทุนวอลเล็ท) — ข้อมูล = RPC acct_child_qty_export (Supabase แตกโปรโมชั่นเป็นสินค้าย่อยให้)
//   กติกา: ออเดอร์ที่ได้เงินแล้ว นับตามเดือนที่สั่งซื้อ · ตัดเพจที่ไม่ใช่การขาย · แยกประเภทการชำระเฉพาะ Facebook · Modern Trade = ใบกำกับที่ส่งให้ห้าง (sell-in)
//   หน้าตาไฟล์ = ไฟล์ที่ส่งบัญชีทุกเดือน: แท็บ "Child SKU Qty (Exact)" · หัวตารางพื้นเข้ม ตัวขาวหนา · ล็อคแถวหัว · ความกว้างคอลัมน์เดิม · เรียงช่องทาง → ร้าน/เพจ → ประเภทชำระ → จำนวนมากไปน้อย
//   ชื่อไฟล์ Child_SKU_Qty_<เดือนภาษาอังกฤษ><ปี ค.ศ.>.xlsx เช่น Child_SKU_Qty_August2026.xlsx
//   สร้างไฟล์ด้วย ExcelJS (ใส่สี / ล็อคแถวได้) โหลดเฉพาะตอนกด Export
(function () {
  'use strict';
  const EXCELJS_URL = 'https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js';
  const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const COLS = [['month', 10], ['channel', 12], ['sub_channel', 40], ['payment_type', 20], ['child_sku', 14], ['total_qty', 12]];
  let xjP = null;
  const loadExcelJS = () => window.ExcelJS ? Promise.resolve(window.ExcelJS) : (xjP = xjP || new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = EXCELJS_URL;
    s.onload = () => window.ExcelJS ? res(window.ExcelJS) : rej(new Error('โหลดตัวสร้างไฟล์ Excel ไม่สำเร็จ'));
    s.onerror = () => { xjP = null; rej(new Error('โหลดตัวสร้างไฟล์ Excel ไม่สำเร็จ — เช็คอินเทอร์เน็ตแล้วลองใหม่')); };
    document.head.appendChild(s);
  }));
  const nf = v => Math.round(+v || 0).toLocaleString('th-TH');
  const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;   // เรียงแบบไฟล์เดิม (อังกฤษก่อนไทย)

  async function saveXlsx(wb, name) {
    const buf = await wb.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  // o = { db, month: 'YYYY-MM', btn, alert, out }
  async function childQty(o) {
    const { db, month: mo, btn, alert: al, out } = o;
    if (al) al.style.display = 'none';
    if (!mo) { if (al) { al.textContent = 'กรุณาเลือกเดือน'; al.style.display = 'block'; } return; }
    const label = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '⏳ กำลังดึงข้อมูล…'; }
    try {
      const [{ data, error }, ExcelJS] = await Promise.all([db.rpc('acct_child_qty_export', { p_month: mo + '-01' }), loadExcelJS()]);
      if (error) throw new Error(error.message);
      const rows = (data.rows || []).map(r => [r[0], r[1], r[2], r[3], r[4], Math.round(+r[5] || 0)])
        .sort((a, b) => cmp(a[1], b[1]) || cmp(a[2], b[2]) || cmp(a[3], b[3]) || b[5] - a[5] || cmp(a[4], b[4]));
      const cov = data.coverage || [], total = rows.reduce((t, r) => t + r[5], 0);
      const low = cov.filter(c => c[1] > 0 && c[2] / c[1] < 0.95);
      const [y, m] = mo.split('-'), name = `Child_SKU_Qty_${MONTH_EN[+m - 1]}${y}.xlsx`;
      if (out) {
        const td = 'padding:6px 10px;border-bottom:1px solid var(--border,#333);', r = 'text-align:right;';
        out.innerHTML = `<div style="font-weight:700;margin:4px 0 10px;">เดือน ${mo} · ${nf(rows.length)} แถว · รวม ${nf(total)} ชิ้น</div>
          <table style="width:100%;max-width:620px;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums;">
            <thead><tr><th style="${td}text-align:left;">ช่องทาง</th><th style="${td}${r}">ออเดอร์ (ไม่รวมยกเลิก / คืน)</th><th style="${td}${r}">ได้เงินแล้ว</th><th style="${td}${r}">%</th></tr></thead>
            <tbody>${cov.map(c => { const p = c[1] ? c[2] / c[1] * 100 : 0; return `<tr><td style="${td}">${c[0]}</td><td style="${td}${r}">${nf(c[1])}</td><td style="${td}${r}">${nf(c[2])}</td><td style="${td}${r}${p < 95 ? 'color:var(--danger,#ef4444);font-weight:700;' : ''}">${p.toFixed(1)}%</td></tr>`; }).join('')}</tbody></table>
          <p style="margin-top:10px;font-size:13px;${low.length ? 'color:var(--danger,#ef4444);' : 'color:var(--muted,#999);'}">${low.length ? `⚠️ ${low.map(c => c[0]).join(' · ')} ยังได้เงินไม่ครบ ตัวเลขในไฟล์จะน้อยกว่าที่ควร · อัปไฟล์รับเงินของช่องทางนั้นก่อน หรือรอให้ได้เงินครบ แล้ว Export ใหม่` : '✓ ทุกช่องทางได้เงินครบเกือบทั้งหมดแล้ว'}</p>`;
        out.style.display = 'block';
      }
      if (!rows.length) throw new Error('ไม่มีออเดอร์ที่ได้เงินแล้วในเดือนนี้');
      const ask = window.uiConfirm || ((t, x) => Promise.resolve(window.confirm(t + '\n' + (x.text || ''))));
      if (low.length && !(await ask('ยังได้เงินไม่ครบ', { text: `${low.map(c => `${c[0]} ได้เงินแล้ว ${Math.round(c[2] / c[1] * 100)}%`).join('\n')}\nตัวเลขจะน้อยกว่าที่ควร ดาวน์โหลดต่อไหม?`, ok: 'ดาวน์โหลด' }))) return;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Child SKU Qty (Exact)', { views: [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2' }] });
      ws.columns = COLS.map(([h, w], i) => ({ header: h, key: 'c' + i, width: w }));
      rows.forEach(r => ws.addRow(r));
      ws.getRow(1).eachCell(c => {
        c.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        c.alignment = { horizontal: 'center' };
      });
      await saveXlsx(wb, name);
    } catch (e) {
      if (al) { al.textContent = 'ส่งออกไม่สำเร็จ: ' + e.message; al.style.display = 'block'; }
    } finally { if (btn) { btn.disabled = false; btn.textContent = label; } }
  }

  window.AcctExport = { childQty };
})();
