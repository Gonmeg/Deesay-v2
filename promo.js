// promo.js (v20261029a) — ที่มาต้นทุนบอกชัด (ไฟล์ต้นทุนขายรายเดือน / ไฟล์ต้นทุนสินค้า)
// promo.js (v20261028c) — การ์ด Rank: เปลี่ยนชื่อคลาส hd/bd/sb (ชนกับเมนูซ้ายที่ใช้ .sb → ข้อความไปลอยบนเมนู)
// promo.js (v20261028b) — ไม่ใช้เกณฑ์ 5% · หัวข้อ "รายละเอียดการคำนวณ" · คำอธิบายไปอยู่ใน ⓘ · แถวย่อยไม่ทับ · ปุ่มจำลองโปรอยู่ซ้าย · แก้จำลองโปรเลือกสินค้าแล้วคำนวณไม่ได้
// promo.js (v20261028a) — รายละเอียดคำขอแบบอ่านง่าย (ผลก่อน · 3 ตัวเลข · เงินไปไหนบ้าง + วิธีคิด + บรรทัด VAT · ซ่อนกำไรเมื่อขาดต้นทุน) · แท็บ "จำลองโปร" ในหน้าอนุมัติ
// promo.js (v20261020k) — โปรโมชั่น 3 หน้า
// (2026-10-20 i) กล่องยืนยัน / แจ้งเตือนเป็นของเว็บเอง (uiConfirm / uiAlert ใน ui.js) แทนกล่องของเบราว์เซอร์
// (2026-10-20 h) หน้าอนุมัติ: จำนวนคำขอรวมไว้ในแท็บ (เลิกการ์ดใหญ่) · รายละเอียด: ราคาที่ขออยู่บนสุด · คำอธิบายย้ายไป ⓘ · ตาราง "สินค้าในโปร" แก้จำนวน + ดู Rank ในที่เดียว (รองรับหลายสินค้า) · ไม่มีแถบเส้น Rank · ขั้นบันไดกำไรกดดูรายละเอียดค่าใช้จ่ายได้
// (2026-10-20 f) หน้าอนุมัติ: ตารางแยกคอลัมน์ (ขอโดย / วันเริ่ม / วันจบ / ส่งเมื่อ) จัดกลาง · ตัดยอดคาด / กำไรรวมที่คาด / เกณฑ์ · รายละเอียดคำขอ: สรุปเป็นช่องเรียบ ๆ ข้อความสั้น · ลองปรับตัวเลขแล้วกด "คำนวณ" หรือ Enter (ไม่คำนวณระหว่างพิมพ์)
// (2026-10-20 e) หน้าขอโปร: ไม่แสดงผลเช็คต้นทุนให้ทีมแล้ว (ผู้บริหารเห็นในหน้าอนุมัติ) · การ์ด Rank กว้างขึ้น · แถบราคารวมขีดที่ราคาเท่ากัน · "ส่งเมื่อ" เป็นคอลัมน์ท้าย · ลบคำขอที่ยกเลิกแล้วได้
// (2026-10-20 d) Rank ราคา: เช็คคำขอกับชีท Price Rank (RPC promo_rank) · กล่องผลในฟอร์ม · คอลัมน์ Rank ในตารางคำขอและหน้าอนุมัติ · การ์ด Rank ในรายละเอียดคำขอของผู้บริหาร
// (2026-10-20 c) ฟอร์มกระชับ (ช่องสินค้า / ราคาไม่ยาวเต็มจอ) · ตารางคำขอ: แยกวันเริ่ม / วันจบ / วันที่ส่ง · ไม่มีคอลัมน์เกณฑ์ต้นทุน · ปฏิทินแบบรายเดือน (จันทร์–อาทิตย์) แถบโปรวิ่งข้ามวัน
// (2026-10-20 b) หน้าขอโปร: เอาช่องยอดที่คาดว่าจะขายออก · กล่องเช็คต้นทุนขึ้นเฉพาะตอนมีคำตอบ · ตารางคำขอแยกคอลัมน์ · Feedback · ปฏิทินอยู่ล่างสุด
// (2026-10-20) ช่องเลือกสินค้า: กล่องค้นหาของเว็บเอง (เดิมใช้ datalist ของเบราว์เซอร์ = กล่องดำ ค้นได้แค่บางคำ) · ค้นจากชื่อ / รหัส / รหัสลูก / ชื่อเรียกอื่น (product_alias)
// (2026-10-20) หน้าขอโปรโมชั่น: ปฏิทินโปรโมชั่นรายเดือน — โปรที่อนุมัติแล้ว + รออนุมัติของทุกคน (RPC promo_calendar)
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
  const LAYER = { platform: 'ค่า Platform', selling: 'ค่าขาย (Commission / Ads / ขนส่ง)', overhead: 'ค่าบริหาร / Marketing' };
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
      .pr-grid { display:grid; grid-template-columns:minmax(0, 1fr) 460px; gap:16px; align-items:start; }
      @media (max-width: 1100px) { .pr-grid { grid-template-columns:1fr; } }
      .pr-grid.nosig { grid-template-columns:minmax(0, 1fr); }
      .pr-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:18px 20px; margin-bottom:16px; }
      .pr-card h3 { margin:0 0 12px; font-size:14px; font-weight:700; color:var(--text); display:flex; align-items:center; gap:8px; justify-content:space-between; }
      .pr-f { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px 16px; }
      .pr-f .full { grid-column:1 / -1; }
      .pr-f label { display:block; font-size:12px; font-weight:600; color:var(--text2); margin-bottom:6px; }
      .pr-f label small { font-weight:400; color:var(--text3); margin-left:4px; }
      .pr-in { width:100%; box-sizing:border-box; background:var(--bg); border:1px solid var(--border); border-radius:8px; color:var(--text); padding:8px 11px; font:inherit; font-size:13px; outline:none; }
      .pr-in:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(200,169,110,.15); }
      .pr-rows { max-width:640px; }
      .pr-rows .pr-row { display:grid; grid-template-columns:minmax(0, 1fr) 84px 32px; gap:8px; margin-bottom:8px; }
      .pr-f { max-width:900px; }
      .pr-pickw { position:relative; min-width:0; }
      .pr-pick { padding-right:30px; background-image:linear-gradient(45deg, transparent 50%, var(--text3) 50%), linear-gradient(135deg, var(--text3) 50%, transparent 50%); background-position:calc(100% - 15px) 52%, calc(100% - 10px) 52%; background-size:5px 5px, 5px 5px; background-repeat:no-repeat; }
      .pr-dd { position:fixed; z-index:3000; max-height:300px; overflow-y:auto; background:var(--bg2); border:1px solid var(--border); border-radius:10px; box-shadow:0 10px 30px rgba(0,0,0,.14); padding:4px; }
      .pr-dd[hidden] { display:none; }
      .pr-dd button { display:flex; align-items:center; gap:10px; width:100%; border:0; background:none; padding:8px 10px; border-radius:7px; font:inherit; font-size:13px; color:var(--text); text-align:left; cursor:pointer; }
      .pr-dd button span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .pr-dd button small { color:var(--text3); font-size:11.5px; font-variant-numeric:tabular-nums; }
      .pr-dd button em { font-style:normal; font-size:10.5px; color:var(--text3); border:1px solid var(--border); border-radius:99px; padding:0 6px; }
      .pr-dd button.on, .pr-dd button:hover { background:var(--bg3); }
      .pr-dd .none { padding:10px; font-size:12.5px; color:var(--text3); }
      .pr-cal-nav { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:var(--text); }
      .pr-cal-nav button { border:1px solid var(--border); background:var(--bg2); border-radius:7px; width:28px; height:28px; cursor:pointer; color:var(--text2); font:inherit; }
      .pr-cal-nav button:hover { background:var(--bg3); }
      .pr-cal-leg { display:flex; gap:14px; font-size:11.5px; color:var(--text3); font-weight:400; }
      .pr-cal-leg i { display:inline-block; width:18px; height:8px; border-radius:3px; margin-right:5px; vertical-align:middle; background:var(--text3); }
      .pr-cal-leg i.p { background:repeating-linear-gradient(135deg, var(--text3) 0 3px, transparent 3px 6px); border:1px solid var(--text3); }
      .pr-cal { overflow-x:auto; }
      .pr-mc { min-width:720px; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
      .pr-mc-hd { display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); background:var(--bg3); }
      .pr-mc-hd div { padding:7px 10px; font-size:11.5px; font-weight:600; color:var(--text3); }
      .pr-mc-wk { position:relative; min-height:92px; border-top:1px solid var(--border); }
      .pr-mc-bg { position:absolute; inset:0; display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); }
      .pr-mc-fg { position:relative; display:grid; grid-template-columns:repeat(7, minmax(0, 1fr)); grid-auto-rows:22px; row-gap:3px; padding:28px 0 8px; }
      .pr-mc-day { border-left:1px solid var(--border); padding:5px 8px; font-size:12px; color:var(--text2); }
      .pr-mc-day:first-child { border-left:0; }
      .pr-mc-day.out { color:var(--text3); opacity:.45; } .pr-mc-day.we { background:color-mix(in srgb, var(--bg3) 50%, transparent); }
      .pr-mc-day.td span { display:inline-block; min-width:20px; padding:0 5px; border-radius:99px; background:var(--accent); color:#fff; font-weight:700; text-align:center; }
      .pr-mc-ev { z-index:1; margin:0 4px; height:22px; border-radius:6px; background:var(--c); color:#fff; font-size:11.5px; font-weight:600; line-height:22px; padding:0 8px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; cursor:default; }
      .pr-mc-ev.pend { background:repeating-linear-gradient(135deg, color-mix(in srgb, var(--c) 28%, var(--bg2)) 0 5px, var(--bg2) 5px 10px); border:1.5px solid var(--c); color:var(--text); line-height:19px; }
      .pr-mc-ev.cl { margin-left:0; border-top-left-radius:0; border-bottom-left-radius:0; } .pr-mc-ev.cr { margin-right:0; border-top-right-radius:0; border-bottom-right-radius:0; }
      .pr-mc-more { z-index:1; margin:0 6px; font-size:11px; color:var(--text3); line-height:22px; }
      .pr-cal-empty { padding:22px; text-align:center; color:var(--text3); font-size:13px; }
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
      .pr-tb.pr-mine { table-layout:fixed; min-width:1140px; }
      .pr-tb.pr-ex { table-layout:fixed; min-width:1100px; } .pr-tb.pr-ex th, .pr-tb.pr-ex td { text-align:center; vertical-align:middle; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .pr-tb.pr-ex th:first-child, .pr-tb.pr-ex td:first-child { text-align:left; } .pr-tb.pr-ex td.tn { font-variant-numeric:tabular-nums; }
      .ex-big { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:10px 0 8px; }
      .ex-big .l { font-size:11.5px; color:var(--text3); } .ex-big .v { font-size:28px; font-weight:700; color:var(--text); letter-spacing:-.01em; font-variant-numeric:tabular-nums; line-height:1.2; }
      .ex-big .s { font-size:11.5px; color:var(--text3); }
      .ex-items { padding:12px 14px; }
      .ex-items-hd { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; } .ex-items-hd b { font-size:13px; color:var(--text); margin-right:auto; }
      .ex-items-hd label { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text2); font-weight:600; } .ex-items-hd label .pr-in { width:110px; padding:6px 10px; }
      .ex-items-hd .pr-btn { padding:7px 14px; }
      .ex-it { width:100%; border-collapse:collapse; font-size:12.5px; }
      .ex-it th { font-size:11px; color:var(--text3); font-weight:600; text-align:left; padding:6px 8px; border-bottom:1px solid var(--border); white-space:nowrap; }
      .ex-it td { padding:5px 8px; border-bottom:1px solid var(--border); color:var(--text2); vertical-align:middle; }
      .ex-it th.num, .ex-it td.num { text-align:right; font-variant-numeric:tabular-nums; } .ex-it .q { width:86px; text-align:center; }
      .ex-it td.q .pr-in { width:70px; padding:5px 8px; text-align:center; } .ex-it td.hit { background:rgba(184,134,47,.13); color:var(--text); font-weight:700; }
      .ex-it tr.gift td { color:var(--text3); } .ex-it td.miss { color:var(--text3); font-size:11.5px; white-space:nowrap; }
      .ex-it th.rk { color:var(--text3); } .ex-it th.rk:first-of-type { }
      .ex-it td:nth-child(5), .ex-it th:nth-child(5) { border-left:1px solid var(--border); } .ex-it .tag { display:inline-block; font-size:10.5px; padding:0 6px; margin-right:6px; border-radius:99px; background:var(--bg3); color:var(--text2); }
      .ex-st { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:8px; margin:0 0 14px; }
      .ex-st > div { border:1px solid var(--border); border-radius:10px; padding:9px 11px; background:var(--bg2); min-width:0; }
      .ex-st .l { font-size:11px; color:var(--text3); white-space:nowrap; } .ex-st .v { font-size:15px; font-weight:700; color:var(--text); margin-top:3px; font-variant-numeric:tabular-nums; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .ex-st .v .d { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:6px; vertical-align:1px; background:var(--text3); }
      .ex-st .v .d.g { background:var(--green, #16a34a); } .ex-st .v .d.r { background:var(--red, #dc2626); }
      .ex-st .s { font-size:11px; color:var(--text3); margin-top:1px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .ex-try { display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end; }
      .ex-try > div { flex:1 1 140px; min-width:0; } .ex-try label { display:block; font-size:11.5px; font-weight:600; color:var(--text2); margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .ex-try .acts { flex:0 0 auto; display:flex; gap:6px; }
      .ex-chg { font-size:11.5px; color:#b45309; margin-top:8px; }
      .pr-rk.cmp { padding:12px 14px; } .pr-rk.cmp .nt2 { display:none; } .pr-rk.cmp .bd { font-size:16px; padding:3px 11px; } .pr-rk.cmp .bar { margin-top:8px; }
      .pr-tb.pr-mine td { vertical-align:middle; } .pr-tb .ctr { text-align:center; } .pr-tb .nw { white-space:nowrap; }
      .pr-tb.pr-mine td > div + div { margin-top:2px; }
      .pr-tb tr.click { cursor:pointer; } .pr-tb tr.click:hover td { background:var(--bg3); }
      .pr-tb .t1 { color:var(--text); font-weight:600; } .pr-tb .t2 { font-size:11.5px; color:var(--text3); margin-top:2px; }
      .pr-pill { display:inline-flex; align-items:center; gap:5px; padding:2px 9px; border-radius:999px; font-size:11.5px; font-weight:600; background:var(--bg3); color:var(--text2); white-space:nowrap; }
      .pr-pill.good { background:rgba(34,197,94,.14); color:var(--green, #16a34a); } .pr-pill.bad { background:rgba(239,68,68,.13); color:var(--red, #dc2626); }
      .pr-pill.warn { background:rgba(245,158,11,.15); color:#d97706; }
      .pr-pill.rk1 { background:rgba(34,197,94,.14); color:#15803d; } .pr-pill.rk2 { background:rgba(59,130,246,.13); color:#1d4ed8; }
      .pr-pill.rk3 { background:rgba(245,158,11,.16); color:#b45309; } .pr-pill.rkx { background:rgba(239,68,68,.13); color:#b91c1c; } .pr-pill.rk0 { background:var(--bg3); color:var(--text3); }
      .pr-rk { border-radius:12px; padding:16px 18px; border:1px solid var(--border); background:var(--bg2); margin-bottom:12px; }
      .pr-rk .rk-hd { display:flex; align-items:center; gap:12px; }
      .pr-rk .rk-bd { font-size:20px; font-weight:800; padding:5px 13px; border-radius:11px; white-space:nowrap; }
      .pr-rk .rk-bd.rk1 { background:rgba(34,197,94,.12); color:#15803d; } .pr-rk .rk-bd.rk2 { background:rgba(59,130,246,.12); color:#1d4ed8; } .pr-rk .rk-bd.rk3 { background:rgba(245,158,11,.14); color:#b45309; }
      .pr-rk .rk-bd.rkx { background:rgba(239,68,68,.11); color:#b91c1c; font-size:15px; } .pr-rk .rk-bd.rk0 { background:var(--bg3); color:var(--text3); font-size:15px; }
      .pr-rk .rk-sb { font-size:12.5px; color:var(--text2); line-height:1.55; } .pr-rk .rk-sb b { color:var(--text); }
      .pr-rk .bar { position:relative; height:38px; margin:14px 6px 2px; }
      .pr-rk .bar .ln { position:absolute; left:0; right:0; top:9px; height:4px; border-radius:2px; background:var(--bg3); }
      .pr-rk .bar .tk { position:absolute; top:6px; transform:translateX(-50%); font-size:10.5px; color:var(--text3); white-space:nowrap; text-align:center; }
      .pr-rk .bar .tk i { display:block; width:1px; height:10px; background:var(--text3); margin:0 auto 2px; }
      .pr-rk .bar .me { position:absolute; top:2px; width:16px; height:16px; border-radius:50%; background:var(--accent); border:3px solid var(--bg2); box-shadow:0 0 0 1px var(--accent); transform:translateX(-50%); }
      .pr-rk table { width:100%; border-collapse:collapse; font-size:12.5px; margin-top:8px; }
      .pr-rk th { font-size:11px; color:var(--text3); font-weight:600; text-align:right; padding:5px 6px; border-bottom:1px solid var(--border); white-space:nowrap; }
      .pr-rk td { padding:5px 6px; text-align:right; border-bottom:1px solid var(--border); font-variant-numeric:tabular-nums; color:var(--text2); }
      .pr-rk th:first-child, .pr-rk td:first-child { text-align:left; } .pr-rk tr.sum td { font-weight:700; color:var(--text); border-bottom:0; }
      .pr-rk td.hit { background:rgba(184,134,47,.12); color:var(--text); font-weight:700; }
      .pr-rk .nt { font-size:11.5px; color:var(--text3); margin-top:8px; line-height:1.6; }
      .pr-dot { width:9px; height:9px; border-radius:50%; display:inline-block; background:var(--text3); } .pr-dot.green { background:var(--green, #22c55e); } .pr-dot.red { background:var(--red, #ef4444); }
      .pr-seg { display:inline-flex; border:1px solid var(--border); border-radius:8px; overflow:hidden; }
      .pr-seg button { border:0; background:none; padding:6px 14px; font:inherit; font-size:12.5px; color:var(--text2); cursor:pointer; }
      .pr-seg button[aria-pressed="true"] { background:var(--accent); color:#111; font-weight:700; }
      .ex-tabs button b { display:inline-block; min-width:18px; margin-left:7px; padding:0 6px; border-radius:99px; background:var(--bg3); color:var(--text2); font-size:11px; font-weight:700; line-height:18px; text-align:center; }
      .ex-tabs button[aria-pressed="true"] b { background:rgba(0,0,0,.14); color:#111; }
      .pr-metrics { display:grid; grid-template-columns:repeat(auto-fit, minmax(170px, 1fr)); gap:12px; margin-bottom:16px; }
      .pr-metric { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px; }
      .pr-metric .l { font-size:12px; color:var(--text3); } .pr-metric .v { font-size:22px; font-weight:700; color:var(--text); margin-top:4px; font-variant-numeric:tabular-nums; }
      .pr-empty { padding:28px; text-align:center; color:var(--text3); font-size:13px; }
      .pr-lad td { padding:7px 10px; } .pr-lad tr.sum td { font-weight:700; color:var(--text); background:var(--row-sum); }
      .pr-lad tr.sub td:first-child { padding-left:34px; font-size:12px; color:var(--text3); }
      .pr-lad tr.grp td { cursor:pointer; color:var(--text2); } .pr-lad tr.grp:hover td { background:var(--bg3); }
      .pr-lad tr.grp td.neg, .pr-lad tr.sub td.neg { color:var(--red, #dc2626); }
      .pr-lad .car { display:inline-block; width:16px; color:var(--text3); transition:transform .15s; } .pr-lad tr.grp.open .car { transform:rotate(90deg); }
      .pr-lad .xt { font-weight:400; color:var(--text3); font-size:11.5px; } .pr-lad tr.sub td { font-size:12px; }
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
      .pr-mx tfoot td { font-weight:700; color:var(--text); background:var(--row-sum); text-align:right; position:sticky; bottom:0; }
      .pr-mx tfoot td:first-child { text-align:left; }
      .pr-mx .iname { font-weight:600; color:var(--text); cursor:pointer; } .pr-mx .iname:hover { text-decoration:underline dotted; }
      .pr-mx .imeta { display:flex; gap:6px; margin-top:4px; }
      .pr-mx select { background:var(--bg); border:1px solid var(--border); border-radius:6px; color:var(--text2); font:inherit; font-size:11px; padding:2px 4px; }
      .pr-mx .del { border:0; background:none; color:var(--text3); cursor:pointer; font-size:12px; padding:0 2px; } .pr-mx .del:hover { color:var(--red, #ef4444); }
      .pr-note { font-size:12px; color:var(--text3); line-height:1.7; }

      .pr-i { display:inline-flex; width:15px; height:15px; align-items:center; justify-content:center; font-size:11px; color:var(--text3); cursor:default; vertical-align:1px; }
      .pr-bar2 { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:12px; }
      .pr-bar2-l { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
      .pr-chip { border:1px solid var(--border); background:var(--bg2); border-radius:999px; padding:5px 12px; font:inherit; font-size:12px; color:var(--text2); cursor:pointer; }
      .pr-chip:hover { border-color:var(--accent); color:var(--text); }
      .pr-fx { overflow-x:auto; border:1px solid var(--border); border-bottom:0; border-radius:12px 12px 0 0; background:var(--bg2); }
      .pr-sum { overflow-x:auto; position:sticky; bottom:0; z-index:5; border:1px solid var(--border); border-radius:0 0 12px 12px; background:var(--bg3); box-shadow:0 -6px 16px rgba(0,0,0,.12); scrollbar-width:none; }
      .pr-sum::-webkit-scrollbar { display:none; }
      .pr-ft { border-collapse:separate; border-spacing:0; table-layout:fixed; font-size:12.5px; }
      .pr-ft th, .pr-ft td { border-bottom:1px solid var(--row-border, rgba(127,127,127,.12)); padding:8px 10px; background:inherit; text-align:right; vertical-align:middle; }
      .pr-ft th:first-child, .pr-ft td:first-child { position:sticky; left:0; z-index:2; text-align:left; background:var(--bg2); box-shadow:1px 0 0 var(--border); }
      .pr-sum .pr-ft td { background:var(--row-sum); font-size:12.5px; color:var(--text); } .pr-sum .pr-ft td:first-child { background:var(--row-sum); font-weight:700; }
      .pr-ft thead th { font-size:11.5px; color:var(--text2); font-weight:600; background:var(--bg2); border-bottom:1px solid var(--border); vertical-align:bottom; }
      .pr-hd, .pr-rn { border:0; background:none; font:inherit; color:inherit; cursor:pointer; padding:4px 6px; margin:-4px -6px; border-radius:6px; display:flex; flex-direction:column; gap:1px; text-align:inherit; max-width:100%; }
      .pr-hd { align-items:flex-end; margin-left:auto; } .pr-hd:hover, .pr-rn:hover { background:var(--bg3); }
      .pr-hd span { white-space:normal; line-height:1.3; } .pr-hd small, .pr-rn small { font-size:10.5px; color:var(--text3); font-weight:400; }
      .pr-rn b { font-weight:600; color:var(--text); white-space:normal; line-height:1.35; }
      .pr-cell { display:flex; align-items:center; justify-content:flex-end; gap:2px; }
      .pr-cell input { width:72px; text-align:right; background:transparent; border:1px solid transparent; border-radius:6px; padding:5px 6px; color:var(--text); font:inherit; font-variant-numeric:tabular-nums; }
      .pr-cell input:hover { border-color:var(--border); background:var(--bg); } .pr-cell input:focus { border-color:var(--accent); outline:none; background:var(--bg); box-shadow:0 0 0 3px rgba(200,169,110,.15); }
      .pr-cell input.saving { opacity:.5; } .pr-cell i { font-style:normal; font-size:11px; color:var(--text3); width:16px; text-align:left; }
      .pr-act { display:inline-block; margin-top:2px; border:0; background:none; padding:0 2px; font:inherit; font-size:10.5px; color:var(--text3); cursor:pointer; text-decoration:underline dotted; text-underline-offset:2px; }
      .pr-act.hi { color:var(--red, #dc2626); } .pr-act.lo { color:var(--green, #16a34a); } .pr-act:hover { color:var(--text); }
      .pr-chk { display:inline-flex; align-items:center; gap:5px; border:1px solid var(--border); border-radius:999px; padding:4px 10px; font-size:12px; color:var(--text2); cursor:pointer; }
      .pr-hist { margin-top:16px; } .pr-hist summary { cursor:pointer; font-size:13px; font-weight:700; color:var(--text); }
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
    if (!r) return '';   // (2026-10-20) ยังกรอกไม่ครบ = ยังไม่มีคำตอบ ไม่ต้องแสดงกล่อง
    const rsp = (+r.rsp > 0 ? `<div class="m">ราคาปกติรวม ${n0(r.rsp)} · ลด ${pc(r.discount_vs_rsp)}</div>` : '')
      + `<div class="m">เกณฑ์: ราคาขายต้องครอบคลุมต้นทุนทั้งหมด (สินค้า · ของแถม · ค่าธรรมเนียมช่องทาง · ค่า Ads · ค่าบริหาร) และมีกำไรเกินอีก ${mm} ของต้นทุน</div>`;
    if (r.signal === 'green') return `<div class="pr-sig green"><div class="ic">✓</div><div class="t">ผ่านต้นทุนทั้งหมด + ${mm}</div><div class="s">ส่งขออนุมัติได้เลย · ยังต้องรอผู้บริหารอนุมัติอีกครั้ง</div>${rsp}</div>`;
    if (r.signal === 'red') return `<div class="pr-sig red"><div class="ic">✕</div><div class="t">ยังไม่ผ่านต้นทุนทั้งหมด + ${mm}</div><div class="s">ลองขึ้นราคา ลดของแถม หรือเพิ่มจำนวนสินค้าในเซต · ส่งได้ แต่ผู้บริหารจะเห็นว่ายังไม่ผ่าน</div>${rsp}</div>`;
    const miss = (r.missing_costs || []);
    const nmOf = s => ((C.products || []).find(p => p.sku === s) || { name: s }).name;
    return `<div class="pr-sig"><div class="ic">?</div><div class="t">ยังเช็คต้นทุนไม่ได้</div><div class="s">${miss.length ? 'ยังไม่มีต้นทุนของ ' + miss.map(x => esc(nmOf(x))).join(', ') + ' ในไฟล์ต้นทุนขาย · แจ้งผู้บริหาร / บัญชี' : 'กรอกช่องทาง ราคาขาย และสินค้าให้ครบ'}</div>${rsp}</div>`;
  }
  // ---------- Rank ราคา (จากหน้า สินค้า & ราคา · v_price_rank) ----------
  const rkPill = k => { if (!k || k.status === 'no_rank') return '<span class="t2">—</span>';
    return k.status === 'ok' ? `<span class="pr-pill rk${k.rank}">Rank ${k.rank}</span>` : k.status === 'below' ? '<span class="pr-pill rkx">ต่ำกว่า Rank 3</span>'
      : k.status === 'not_sold' ? '<span class="pr-pill rkx">ไม่ขายช่องทางนี้</span>' : '<span class="pr-pill rk0">ยังไม่มีราคา Rank</span>'; };
  function rankCard(k) {
    if (!k) return '';
    if (k.status === 'no_rank') return `<div class="pr-rk"><div class="rk-hd"><span class="rk-bd rk0">ไม่เช็ค Rank</span><div class="rk-sb">${esc(k.channel)} ไม่เช็ค Rank</div></div></div>`;
    const lines = k.lines || [], cat = k.category === 'สินค้าเซ็ต' ? `ราคาเซ็ต (${n0(k.pieces)} ชิ้น)` : 'ราคาเดี่ยว (1 ชิ้น)';
    const sub = `${esc(k.channel)} · ${cat} · ไม่นับของแถม`;
    if (k.status === 'missing') return `<div class="pr-rk"><div class="rk-hd"><span class="rk-bd rk0">ยังไม่มีราคา Rank</span><div class="rk-sb">${(k.missing || []).map(esc).join(', ')} ยังไม่มีราคา Rank ในหน้า สินค้า & ราคา<br>${sub}</div></div></div>`;
    if (k.status === 'not_sold') return `<div class="pr-rk"><div class="rk-hd"><span class="rk-bd rkx">ไม่ขายช่องทางนี้</span><div class="rk-sb">${(k.not_sold || []).map(esc).join(', ') || 'สินค้าในชุดนี้'} ไม่ได้ติ๊กขายใน ${esc(k.channel)}<br>${sub}</div></div></div>`;
    const S = [k.sum1, k.sum2, k.sum3].map(v => v == null ? null : +v), price = +k.price, hit = k.rank || 0;
    const ok = k.status === 'ok';
    // แถบตำแหน่งราคา: ซ้าย = ต่ำ ขวา = สูง
    const vals = S.filter(v => v != null).concat(price), lo = Math.min(...vals), hi = Math.max(...vals), span = Math.max(1, hi - lo);
    const pos = v => 8 + (v - lo) / span * 84;
    // ขีดของ Rank ที่ราคาเท่ากัน / ใกล้กันมาก รวมเป็นขีดเดียว (เช่น "R1–R3 760") ไม่ให้ตัวหนังสือทับกัน
    const ticks = []; S.forEach((v, i) => { if (v == null) return; const t = ticks.find(x => Math.abs(pos(x.v) - pos(v)) < 9); if (t) t.r.push(i + 1); else ticks.push({ v, r: [i + 1] }); });
    const bar = `<div class="bar"><div class="ln"></div>${ticks.map(t => `<div class="tk" style="left:${pos(t.v).toFixed(1)}%"><i></i>${t.r.length > 1 ? 'R' + t.r[0] + '–R' + t.r[t.r.length - 1] : 'R' + t.r[0]} · ${n0(t.v)}</div>`).join('')}<div class="me" style="left:${pos(price).toFixed(1)}%" title="ราคาที่ขอ ${n2(price)}"></div></div>`;
    const cell = (v, r) => `<td class="${hit === r ? 'hit' : ''}">${v == null || +v === 0 ? '—' : n0(v)}</td>`;
    const tbl = `<table><thead><tr><th>สินค้า</th><th>จำนวน</th><th>Rank 1</th><th>Rank 2</th><th>Rank 3</th></tr></thead><tbody>`
      + lines.map(l => `<tr><td>${esc(l.name)}</td><td>${n0(l.qty)}</td>${cell(l.p1, 1)}${cell(l.p2, 2)}${cell(l.p3, 3)}</tr>`).join('')
      + `<tr class="sum"><td>รวม × จำนวน</td><td></td>${cell(S[0], 1)}${cell(S[1], 2)}${cell(S[2], 3)}</tr></tbody></table>`;
    const why = ok ? (hit === 1 ? `ราคาที่ขอ ${n0(price)} ≥ Rank 1 (${n0(S[0])})` : `ราคาที่ขอ ${n0(price)} ≥ Rank ${hit} (${n0(S[hit - 1])}) แต่ต่ำกว่า Rank ${hit - 1} (${n0(S[hit - 2])})`)
      : `ราคาที่ขอ ${n0(price)} ต่ำกว่า Rank 3 (${n0(S[2])}) ซึ่งเป็นราคาต่ำสุดที่ยอมให้ขาย`;
    return `<div class="pr-rk"><div class="rk-hd"><span class="rk-bd ${ok ? 'rk' + hit : 'rkx'}">${ok ? 'Rank ' + hit : 'ต่ำกว่า Rank 3'}</span><div class="rk-sb"><b>${ok ? 'ราคานี้อยู่ Rank ' + hit : 'ราคานี้ต่ำกว่าเกณฑ์'}</b><br>${sub}</div></div>
      ${bar}${tbl}<div class="nt">${why}<span class="nt2"><br>ราคา Rank จากหน้า สินค้า & ราคา · ราคาต่อชิ้น${k.category === 'สินค้าเซ็ต' ? 'แบบเซ็ต เพราะมากกว่า 1 ชิ้น' : 'แบบเดี่ยว'}</span></div></div>`;
  }
  async function check() {
    const C = await cat(), p = payload(), seq = ++chkSeq, box = document.getElementById('prSig');
    if (!box) return;
    const grid = box.closest('.pr-grid'), show = h => { box.innerHTML = h; if (grid) grid.classList.toggle('nosig', !h); };
    if (!p.channel_id || !p.price || !p.items.length) { show(sigHtml(null, C)); return; }
    try { const k = await rpc('promo_rank', { p }); if (seq === chkSeq) show(rankCard(k)); }   // (2026-10-20 e) ทีมเห็นแค่ Rank · ต้นทุนผู้บริหารดูในหน้าอนุมัติ
    catch (e) { show(`<div class="pr-sig"><div class="t">ตรวจไม่สำเร็จ</div><div class="s">${esc(e.message)}</div></div>`); }
  }
  const later = () => { clearTimeout(chkTimer); chkTimer = setTimeout(check, 350); };
  function rowsHtml(key, list, C) {
    return list.map((x, i) => `<div class="pr-row"><div class="pr-pickw"><input class="pr-in pr-pick" autocomplete="off" data-k="${key}" data-i="${i}" data-f="sku" placeholder="ค้นหาชื่อสินค้าหรือรหัส" value="${esc(x.sku ? prodLabel(C.products.find(p => p.sku === x.sku) || { name: x.sku, sku: x.sku }) : '')}"></div>
      <input class="pr-in" type="number" min="1" step="1" data-k="${key}" data-i="${i}" data-f="qty" value="${esc(x.qty)}" title="จำนวนชิ้นต่อ 1 ออเดอร์">
      <button type="button" class="pr-x" data-del="${key}" data-i="${i}" aria-label="ลบ">✕</button></div>`).join('');
  }
  async function renderPromo() {
    let el = document.getElementById('page-promo'); if (!el) return;
    // (2026-10-20) เปิดหน้าซ้ำ = เปลี่ยนกล่องหน้าใหม่ ล้างตัวดักเหตุการณ์ของรอบก่อน (กันกดเพิ่มสินค้าแล้วได้ 2 แถว / ปุ่มลูกศรเลื่อน 2 ขั้น)
    { const fresh = el.cloneNode(false); el.replaceWith(fresh); el = fresh; }
    if (window._prDDOff) window._prDDOff();
    el.innerHTML = '<div class="pr-empty">กำลังโหลด…</div>';
    let C; try { C = await cat(); } catch (e) { el.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (!C) { el.innerHTML = '<div class="pr-empty">ยังไม่มีสิทธิ์ใช้หน้านี้</div>'; return; }
    el.innerHTML = `
      <div class="pr-dd" id="prDD" hidden></div>
      <div class="pr-grid nosig"><div class="pr-card"><h3><span>รายละเอียดโปร <span class="pr-i" data-tip="กรอกโปรที่อยากทำ ระบบบอก Rank ราคาทันทีจากหน้า สินค้า & ราคา แล้วส่งให้ผู้บริหารอนุมัติ">ⓘ</span></span></h3><div class="pr-f">
        <div class="full"><label>ชื่อโปร</label><input class="pr-in" data-f="title" value="${esc(F.title)}" placeholder="เช่น 11.11 แป้งดีเซ้ย์ 2 แถม 1"></div>
        <div><label>ช่องทาง</label><select class="pr-in" data-f="channel_id"><option value="">เลือกช่องทาง</option>${C.channels.map(c => `<option value="${c.id}"${+F.channel_id === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div><label>ช่วงเวลา</label><div style="display:flex;gap:8px;"><input class="pr-in" type="date" data-f="start_date" value="${esc(F.start_date)}"><input class="pr-in" type="date" data-f="end_date" value="${esc(F.end_date)}"></div></div>
        <div class="full"><label>สินค้าที่ขายใน 1 ออเดอร์ <small>ชื่อสินค้า · จำนวนชิ้น</small></label><div class="pr-rows" id="prItems">${rowsHtml('items', F.items, C)}</div><button type="button" class="pr-add" data-addrow="items">＋ เพิ่มสินค้า</button></div>
        <div class="full"><label>ของแถมใน 1 ออเดอร์ <small>ถ้ามี</small></label><div class="pr-rows" id="prGifts">${rowsHtml('gifts', F.gifts, C)}</div><button type="button" class="pr-add" data-addrow="gifts">＋ เพิ่มของแถม</button></div>
        <div><label>ราคาขายต่อออเดอร์ <small>รวม VAT หลังส่วนลด</small></label><input class="pr-in" type="number" min="0" step="0.01" data-f="price" value="${esc(F.price)}" placeholder="0.00"></div>
        <div class="full"><label>หมายเหตุ <small>ไม่บังคับ</small></label><textarea class="pr-in" rows="2" data-f="note" placeholder="เช่น เงื่อนไขพิเศษของ Platform">${esc(F.note)}</textarea></div>
      </div><div style="margin-top:16px;display:flex;gap:10px;align-items:center;"><button class="pr-btn" id="prSubmit">ส่งขออนุมัติ</button><span class="pr-note" id="prMsg"></span></div></div>
      <div id="prSig"></div></div>
      <div class="pr-card"><h3>คำขอของฉัน</h3><div id="prMine"><div class="pr-empty">กำลังโหลด…</div></div></div>
      <div class="pr-card"><h3><span>ปฏิทินโปรโมชั่น <span class="pr-i" data-tip="โปรที่อนุมัติแล้วและรออนุมัติของทุกคน แยกสีตามช่องทาง · แถบลายทาง = รออนุมัติ">ⓘ</span></span>
        <span class="pr-cal-leg"><span><i></i>อนุมัติแล้ว</span><span><i class="p"></i>รออนุมัติ</span></span>
        <span class="pr-cal-nav"><button type="button" data-calmv="-1" aria-label="เดือนก่อน">‹</button><span id="prCalM"></span><button type="button" data-calmv="1" aria-label="เดือนถัดไป">›</button></span></h3>
        <div class="pr-cal" id="prCal"><div class="pr-empty">กำลังโหลด…</div></div></div>`;
    const sync = t => { const k = t.dataset.k, i = +t.dataset.i, f = t.dataset.f; if (!f) return;
      if (k) F[k][i][f] = f === 'sku' ? (C.products.some(p => p.sku === skuOf(t.value)) ? skuOf(t.value) : '') : t.value; else F[f] = t.value; later(); };
    el.addEventListener('input', e => { if (e.target.classList.contains('pr-pick')) { if (!e.target.value.trim()) sync(e.target); pickOpen(e.target); return; } sync(e.target); });
    el.addEventListener('change', e => { if (!e.target.classList.contains('pr-pick')) sync(e.target); });
    // ---- กล่องค้นหาสินค้า ----
    const dd = document.getElementById('prDD'); let ddFor = null, ddList = [], ddOn = 0;
    const nz = t => String(t || '').toLowerCase().replace(/[\s\-._·]/g, '');
    const prodMatch = q => {
      const toks = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean).map(nz);
      const list = C.products.map(p => ({ p, nm: nz(p.name), sk: nz(p.sku), al: nz(p.alias) }));
      if (!toks.length) return list.map(x => x.p);
      return list.filter(x => toks.every(t => (x.nm + x.sk + x.al).includes(t))).map(x => {
        const t = toks.join(''); const r = x.nm.startsWith(t) ? 0 : x.nm.includes(t) ? 1 : x.sk.startsWith(t) ? 2 : 3;
        return { p: x.p, r: r + (x.p.status === 'Discontinued' ? 10 : 0) }; }).sort((a, b) => a.r - b.r || a.p.name.localeCompare(b.p.name, 'th')).map(x => x.p);
    };
    function pickDraw() {
      if (!ddFor) return;
      dd.innerHTML = ddList.length ? ddList.slice(0, 80).map((p, i) => `<button type="button" data-pick="${esc(p.sku)}" class="${i === ddOn ? 'on' : ''}"><span>${esc(p.name)}</span><small>${esc(p.sku)}</small>${p.status === 'Discontinued' ? '<em>เลิกผลิต</em>' : p.status === 'NPD' ? '<em>ใหม่</em>' : ''}</button>`).join('')
        : '<div class="none">ไม่เจอสินค้าที่ตรงกับคำค้น · ลองพิมพ์รหัสสินค้า หรือคำสั้นลง</div>';
      const r = ddFor.getBoundingClientRect(); dd.style.left = r.left + 'px'; dd.style.width = r.width + 'px';
      const below = window.innerHeight - r.bottom; dd.style.top = (below < 240 && r.top > below ? Math.max(8, r.top - Math.min(300, dd.scrollHeight) - 4) : r.bottom + 4) + 'px';
      const on = dd.querySelector('button.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
    }
    function pickOpen(inp) {
      ddFor = inp; const v = inp.value, cur = C.products.find(p => prodLabel(p) === v);
      ddList = cur ? prodMatch('') : prodMatch(v); ddOn = cur ? Math.max(0, ddList.indexOf(cur)) : 0;
      dd.hidden = false; pickDraw();
    }
    const pickClose = () => { dd.hidden = true; ddFor = null; };
    function pickSet(p) { if (!ddFor || !p) return; const inp = ddFor; inp.value = prodLabel(p); sync(inp); pickClose(); }
    el.addEventListener('focusin', e => { if (e.target.classList.contains('pr-pick')) { e.target.select(); pickOpen(e.target); } });
    el.addEventListener('focusout', e => { if (e.target === ddFor) setTimeout(() => { if (document.activeElement !== ddFor) { const inp = ddFor; pickClose(); if (inp && !C.products.some(p => prodLabel(p) === inp.value)) { const k = inp.dataset.k, i = +inp.dataset.i; const keep = F[k][i] && F[k][i].sku ? C.products.find(p => p.sku === F[k][i].sku) : null; inp.value = keep ? prodLabel(keep) : ''; } } }, 120); });
    el.addEventListener('keydown', e => {
      if (!ddFor || e.target !== ddFor || dd.hidden) return;
      if (e.key === 'ArrowDown') { ddOn = Math.min(ddList.length - 1, ddOn + 1); pickDraw(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { ddOn = Math.max(0, ddOn - 1); pickDraw(); e.preventDefault(); }
      else if (e.key === 'Enter') { pickSet(ddList[ddOn]); e.preventDefault(); }
      else if (e.key === 'Escape') { pickClose(); }
    });
    dd.addEventListener('mousedown', e => { e.preventDefault(); const b = e.target.closest('[data-pick]'); if (b) pickSet(C.products.find(p => p.sku === b.dataset.pick)); });
    const onMove = () => { if (ddFor) pickDraw(); };
    window.addEventListener('scroll', onMove, true); window.addEventListener('resize', onMove);
    window._prDDOff = () => { window.removeEventListener('scroll', onMove, true); window.removeEventListener('resize', onMove); };
    el.addEventListener('click', async e => {
      const a = e.target.closest('[data-addrow]'), d = e.target.closest('[data-del]'), cx = e.target.closest('[data-cancel]'), mv = e.target.closest('[data-calmv]'), rm = e.target.closest('[data-rm]');
      if (rm) { if (await uiConfirm('ลบคำขอ', { text: (rm.closest('tr')?.querySelector('.t1')?.textContent || '') + ' · ลบแล้วกู้คืนไม่ได้', ok: 'ลบ', tone: 'bad' })) { try { await rpc('promo_delete', { p_id: +rm.dataset.rm }); loadMine(); } catch (er) { uiAlert('ลบไม่สำเร็จ', { text: er.message, tone: 'bad' }); } } return; }
      if (mv) { const [y, m] = CAL.m.split('-').map(Number); const dt = new Date(y, m - 1 + (+mv.dataset.calmv), 1); CAL.m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`; loadCal(C); return; }
      if (a) { F[a.dataset.addrow].push({ sku: '', qty: 1 }); document.getElementById(a.dataset.addrow === 'items' ? 'prItems' : 'prGifts').innerHTML = rowsHtml(a.dataset.addrow, F[a.dataset.addrow], C); }
      if (d) { F[d.dataset.del].splice(+d.dataset.i, 1); if (d.dataset.del === 'items' && !F.items.length) F.items.push({ sku: '', qty: 1 }); document.getElementById(d.dataset.del === 'items' ? 'prItems' : 'prGifts').innerHTML = rowsHtml(d.dataset.del, F[d.dataset.del], C); later(); }
      if (cx && await uiConfirm('ยกเลิกคำขอ', { text: cx.closest('tr')?.querySelector('.t1')?.textContent || '', ok: 'ยกเลิกคำขอ', cancel: 'ปิด', tone: 'bad' })) { try { await rpc('promo_cancel', { p_id: +cx.dataset.cancel }); loadMine(); } catch (er) { uiAlert('ยกเลิกไม่สำเร็จ', { text: er.message, tone: 'bad' }); } }
    });
    document.getElementById('prSubmit').onclick = async () => {
      const p = payload(), msg = document.getElementById('prMsg');
      if (!p.title.trim() || !p.channel_id || !p.price || !p.items.length) { msg.textContent = 'กรอกชื่อโปร ช่องทาง ราคาขาย และสินค้าให้ครบก่อน'; return; }
      const b = document.getElementById('prSubmit'); b.disabled = true; msg.textContent = 'กำลังส่ง…';
      try { const r = await rpc('promo_submit', { p }); msg.textContent = ''; toast('ส่งขออนุมัติแล้ว · ' + (r.signal === 'green' ? 'ผ่านเกณฑ์ต้นทุน' : r.signal === 'red' ? 'ยังไม่ผ่านเกณฑ์ต้นทุน' : 'ยังไม่มีต้นทุนบางรายการ'));
        Object.assign(F, { title: '', items: [{ sku: '', qty: 1 }], gifts: [], price: '', orders: '', note: '' }); renderPromo(); }
      catch (er) { msg.textContent = 'ส่งไม่สำเร็จ: ' + er.message; b.disabled = false; }
    };
    check(); loadMine(); loadCal(C);
  }
  // ---------- ปฏิทินโปรโมชั่น (เดือนละหน้า) ----------
  const CAL = { m: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; })() };
  const CH_VAR = { Facebook: '--ch-facebook', TikTok: '--ch-tiktok', Shopee: '--ch-shopee', Lazada: '--ch-lazada', 'ตัวแทน': '--ch-dealer', 'Modern Trade': '--ch-mt' };
  const TH_M = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  async function loadCal(C) {
    const box = document.getElementById('prCal'), lab = document.getElementById('prCalM'); if (!box) return;
    const [y, m] = CAL.m.split('-').map(Number), want = CAL.m;
    if (lab) lab.textContent = `${TH_M[m - 1]} ${y + 543}`;
    // ช่วงที่วาด: ตั้งแต่วันจันทร์ของสัปดาห์แรก ถึงวันอาทิตย์ของสัปดาห์สุดท้ายของเดือน
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const first = new Date(y, m - 1, 1), last = new Date(y, m, 0);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const end = new Date(last); end.setDate(last.getDate() + (6 - (last.getDay() + 6) % 7));
    let L; try { L = await rpc('promo_calendar', { p_from: iso(start), p_to: iso(end) }); } catch (e) { box.innerHTML = `<div class="pr-cal-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (want !== CAL.m) return;
    const nm = s => (C.products.find(p => p.sku === s) || { name: s }).name;
    const today = iso(new Date()), MAXL = 4;
    let h = '<div class="pr-mc"><div class="pr-mc-hd">' + ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map(d => `<div>${d}</div>`).join('') + '</div>';
    for (let ws = new Date(start); ws <= end; ws.setDate(ws.getDate() + 7)) {
      const days = [...Array(7)].map((_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return d; });
      const w0 = iso(days[0]), w6 = iso(days[6]);
      const bg = days.map((d, i) => `<div class="pr-mc-day${d.getMonth() !== m - 1 ? ' out' : ''}${i >= 5 ? ' we' : ''}${iso(d) === today ? ' td' : ''}"><span>${d.getDate()}</span></div>`).join('');
      let row = '';
      // โปรที่ทับสัปดาห์นี้ → จัดลงแถว (lane) ไม่ให้ทับกัน
      const evs = (L || []).filter(r => r.start_date <= w6 && (r.end_date || r.start_date) >= w0)
        .map(r => { const s = r.start_date < w0 ? 0 : days.findIndex(d => iso(d) === r.start_date), e = (r.end_date || r.start_date) > w6 ? 6 : days.findIndex(d => iso(d) === (r.end_date || r.start_date)); return { r, s, e }; })
        .sort((a, b) => a.s - b.s || (b.e - b.s) - (a.e - a.s));
      const lanes = [], hidden = Array(7).fill(0);
      evs.forEach(ev => { let l = lanes.findIndex(end => end < ev.s); if (l < 0) { l = lanes.length; lanes.push(-1); } lanes[l] = ev.e; ev.l = l; });
      evs.forEach(ev => {
        if (ev.l >= MAXL) { for (let i = ev.s; i <= ev.e; i++) hidden[i]++; return; }
        const r = ev.r, items = (r.items || []).map(x => nm(x.sku) + ' ×' + x.qty).join(' + '), gifts = (r.gifts || []).map(x => nm(x.sku) + ' ×' + x.qty).join(' + ');
        const tip = `${r.title} · ${r.channel || ''}\n${dTh(r.start_date)} – ${dTh(r.end_date || r.start_date)} · ${(ST[r.status] || [r.status])[0]}\n${items}${gifts ? '\nแถม ' + gifts : ''}`;
        const cls = (r.status === 'pending' ? ' pend' : '') + (r.start_date < w0 ? ' cl' : '') + ((r.end_date || r.start_date) > w6 ? ' cr' : '');
        row += `<div class="pr-mc-ev${cls}" style="--c:var(${CH_VAR[r.sys] || '--text3'});grid-column:${ev.s + 1} / ${ev.e + 2};grid-row:${ev.l + 1};" title="${esc(tip)}">${esc(r.title)} <span style="opacity:.75;font-weight:400;">· ${esc(r.channel || '')}</span></div>`;
      });
      hidden.forEach((n, i) => { if (n) row += `<div class="pr-mc-more" style="grid-column:${i + 1};grid-row:${MAXL + 1};">+ อีก ${n} โปร</div>`; });
      h += `<div class="pr-mc-wk"><div class="pr-mc-bg">${bg}</div><div class="pr-mc-fg">${row}</div></div>`;
    }
    box.innerHTML = h + '</div>' + (!(L || []).length ? '<div class="pr-cal-empty" style="padding:10px 0 0;">เดือนนี้ยังไม่มีโปรที่อนุมัติแล้วหรือรออนุมัติ</div>' : '');
  }
  async function loadMine() {
    const box = document.getElementById('prMine'); if (!box) return;
    try {
      const L = await rpc('promo_list', { p_scope: 'mine' }), C = await cat();
      const nm = s => (C.products.find(p => p.sku === s) || { name: s }).name;
      const list = a => (a || []).map(x => `<div>${esc(nm(x.sku))} <span class="t2">×${x.qty}</span></div>`).join('') || '<span class="t2">—</span>';
      box.innerHTML = L.length ? `<div style="overflow-x:auto;"><table class="pr-tb pr-mine" data-no-sort data-no-page>
          <colgroup><col style="width:11%"><col style="width:9%"><col style="width:7%"><col style="width:7%"><col style="width:14%"><col style="width:10%"><col style="width:7%"><col style="width:9%"><col style="width:9%"><col style="width:11%"><col style="width:7%"><col style="width:64px"></colgroup>
          <thead><tr><th>ชื่อโปร</th><th>ช่องทาง</th><th>วันเริ่ม</th><th>วันจบ</th><th>สินค้า</th><th>ของแถม</th><th class="num">ราคา</th><th class="ctr">Rank</th><th class="ctr">สถานะ</th><th>Feedback</th><th>ส่งเมื่อ</th><th></th></tr></thead><tbody>`
        + L.map(r => { const st = ST[r.status] || [r.status, ''];
          return `<tr><td><div class="t1">${esc(r.title)}</div></td>
            <td>${esc(r.channel || '')}</td>
            <td class="nw">${dTh(r.start_date)}</td><td class="nw">${r.end_date ? dTh(r.end_date) : '—'}</td>
            <td>${list(r.items)}</td><td>${list(r.gifts)}</td>
            <td class="num">${n2(r.price)}</td>
            <td class="ctr">${rkPill(r.rank)}</td>
            <td class="ctr"><span class="pr-pill ${st[1]}">${st[0]}</span>${r.decided_name ? `<div class="t2">${esc(r.decided_name)} · ${dTh(r.decided_at)}</div>` : ''}</td>
            <td style="white-space:normal;">${r.decision_note ? esc(r.decision_note) : '<span class="t2">—</span>'}</td>
            <td class="nw">${dTh(r.requested_at)}</td>
            <td class="ctr">${r.status === 'pending' ? `<button class="pr-btn ghost" data-cancel="${r.id}" style="padding:4px 10px;font-size:12px;">ยกเลิก</button>`
              : r.status === 'cancelled' ? `<button class="pr-btn ghost" data-rm="${r.id}" style="padding:4px 10px;font-size:12px;color:var(--red,#dc2626);">ลบ</button>` : ''}</td></tr>`; }).join('') + '</tbody></table></div>'
        : '<div class="pr-empty">ยังไม่มีคำขอ</div>';
    } catch (e) { box.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; }
  }

  // ===================== หน้า โปรโมชั่น · อนุมัติ (ผู้บริหาร) =====================
  let EX = { list: [], filter: 'pending' };
  // ===================== (2026-10-28) ผลคำนวณโปรแบบอ่านง่าย — ใช้ทั้งรายละเอียดคำขอ และหน้าจำลองโปร =====================
  // บนสุดบอกผลเลย (ผ่าน / ไม่ผ่าน / ยังคำนวณไม่ได้เพราะขาดต้นทุน) → ตัวเลข 3 ช่อง → ตาราง "เงิน X ไปไหนบ้าง" พร้อมวิธีคิดทุกบรรทัด (มีบรรทัด VAT ชัด ๆ)
  if (!document.getElementById('pvStyle')) {
    const st = document.createElement('style'); st.id = 'pvStyle';
    st.textContent = `
      .pv-ban { display:flex; flex-direction:column; gap:2px; border-radius:10px; padding:10px 14px; margin-bottom:12px; font-size:12.5px; border:1px solid var(--border); background:var(--bg2); }
      .pv-ban b { font-size:14px; } .pv-ban span { color:var(--text2); }
      .pv-ban.good { border-color:rgba(22,163,74,.35); background:rgba(22,163,74,.07); } .pv-ban.good b { color:var(--green,#16a34a); }
      .pv-ban.bad { border-color:rgba(220,38,38,.35); background:rgba(220,38,38,.06); } .pv-ban.bad b { color:var(--red,#dc2626); }
      .pv-ban.warn { border-color:rgba(217,119,6,.4); background:rgba(217,119,6,.07); } .pv-ban.warn b { color:#b45309; }
      .pv-k { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin-bottom:12px; }
      .pv-k > div { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:10px 12px; min-width:0; }
      .pv-k .l { font-size:11.5px; color:var(--text3); } .pv-k .v { font-size:20px; font-weight:700; margin:2px 0; white-space:nowrap; } .pv-k .v.neg { color:var(--red,#dc2626); } .pv-k .s { font-size:11px; color:var(--text3); }
      .pv-sec { padding:12px 14px !important; } .pv-h { font-size:13.5px; font-weight:700; margin-bottom:8px; } .pv-h span { display:block; font-size:11.5px; font-weight:400; color:var(--text3); margin-top:2px; }
      .pv-lad { width:100%; border-collapse:collapse; font-size:12.5px; table-layout:fixed; }
      .pv-lad th { font-size:11px; font-weight:600; color:var(--text3); text-align:left; padding:6px 6px; border-bottom:1px solid var(--border); } .pv-lad th.num { text-align:right; width:24%; } .pv-lad th.how { width:40%; }
      .pv-lad td { padding:8px 6px; border-bottom:1px solid var(--border); vertical-align:top; } .pv-lad td.num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; } .pv-lad td.how { font-size:11.5px; color:var(--text3); }
      .pv-lad tr.neg td.num { color:var(--red,#dc2626); } .pv-lad tr.tot td { background:var(--bg3); font-weight:700; } .pv-lad tr.tot.big td { font-size:14px; border-top:1px solid var(--text3); } .pv-lad tr.negv td.num { color:var(--red,#dc2626); }
      .pv-lad tr.grp { cursor:pointer; } .pv-lad tr.grp:hover td { background:rgba(127,127,127,.05); } .pv-lad .car { display:inline-block; width:12px; font-size:9px; color:var(--text3); transition:transform .15s; } .pv-lad tr.grp.open .car { transform:rotate(90deg); }
      .pv-lad td { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .pv-lad td.how { white-space:nowrap; }
      .pv-lad tr.sub td { font-size:11.5px; color:var(--text2); padding:5px 6px 5px 22px; } .pv-lad tr.sub td.num { color:var(--text2); } .pv-lad .miss { color:#b45309; }
      .pv-sim-f .pr-row { display:grid; grid-template-columns:minmax(0,1fr) 64px 30px; gap:6px; align-items:center; margin-bottom:6px; } .pv-sim-f .pr-row .pr-in { width:100%; box-sizing:border-box; }
      .pv-simbtn[aria-pressed="true"] { background:var(--accent,#b8862f); color:#fff; border-color:transparent; }
      .pv-try { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin:0 0 12px; font-size:12.5px; } .pv-try label { color:var(--text2); } .pv-try .pr-in { width:130px; } .pv-chg { font-size:11.5px; color:#b45309; }
      .pv-items summary { cursor:pointer; font-size:12.5px; font-weight:600; padding:2px 0 8px; color:var(--text2); }
      .pv-sim { display:grid; grid-template-columns:minmax(300px, 380px) minmax(0, 1fr); gap:16px; align-items:start; padding:16px 20px 20px; }
      @media (max-width: 1000px) { .pv-sim { grid-template-columns:1fr; } }
      .pv-sim-f label { display:block; font-size:12px; font-weight:600; color:var(--text2); margin:12px 0 6px; } .pv-sim-f label small { font-weight:400; color:var(--text3); }
      .pv-sim-f .pr-row { margin-bottom:6px; }
      .pv-dd { position:fixed; z-index:1300; max-height:300px; overflow:auto; background:var(--bg2); border:1px solid var(--border); border-radius:10px; box-shadow:0 10px 28px rgba(0,0,0,.16); padding:4px; }
      .pv-dd button { display:flex; gap:8px; align-items:baseline; width:100%; text-align:left; border:0; background:none; font:inherit; font-size:12.5px; padding:7px 9px; border-radius:7px; cursor:pointer; color:var(--text); }
      .pv-dd button:hover { background:var(--bg3); } .pv-dd small { color:var(--text3); font-family:'IBM Plex Mono', monospace; font-size:11px; } .pv-dd .none { padding:10px; font-size:12px; color:var(--text3); }`;
    document.head.appendChild(st);
  }
  const PV_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  // (2026-10-29) สินค้าที่ยังไม่มีในไฟล์ต้นทุนขายรายเดือน (สินค้าใหม่) ใช้ราคาจากไฟล์ต้นทุนสินค้า → บอกที่มาให้ชัด
  const costMonthTxt = c => { const L = (c.lines || []).filter(l => l.unit_cost != null), m = L.map(l => l.cost_month).filter(Boolean).sort().pop(), fb = L.some(l => !l.cost_month);
    if (!m) return fb ? 'ไฟล์ต้นทุนสินค้า' : 'เดือนล่าสุด'; const d = new Date(m + 'T00:00:00'); return `${PV_M[d.getMonth()]} ${String(d.getFullYear() + 543).slice(2)}${fb ? ' + ไฟล์ต้นทุนสินค้า' : ''}`; };
  function calcView(c, C) {
    const nm = k => (C.products.find(p => p.sku === k) || { name: k }).name, tip = t => ` <span class="pr-i" data-tip="${esc(t)}">ⓘ</span>`;
    const miss = (c.missing_costs || []).map(nm), ok = !miss.length, vatR = +c.vat || 0.07, vp = Math.round(vatR * 100), vf = (1 + vatR).toFixed(2);
    const price = +c.price || 0, rex = +c.revenue_ex || 0, mm = pc(+c.min_markup || 0.05, 0), sum = a => a.reduce((t, x) => t + (+x || 0), 0);
    const fees = ly => (c.fees || []).filter(f => f.layer === ly), lines = c.lines || [], cogs = sum(lines.map(l => l.cost));
    const how = f => f.kind === 'pct' ? `${+(f.rate * 100).toFixed(2)}% × ${n2(price)} ÷ ${vf}` : `${n2(f.rate)} ÷ ${vf}`;
    // (2026-10-28 b) ไม่ใช้เกณฑ์กำไรขั้นต่ำ (5%) แล้ว: แถบบนขึ้นเฉพาะตอนขาดต้นทุน · ขาดทุนดูจากกำไรสุทธิที่เป็นสีแดง
    const ban = price && !ok ? `<div class="pv-ban warn"><b>ยังคำนวณกำไรไม่ได้</b><span>ยังไม่มีต้นทุนของ ${miss.map(esc).join(', ')} ในไฟล์ต้นทุนของบัญชี</span></div>` : '';
    const dif = +c.rsp > 0 ? (price - +c.rsp) / +c.rsp : null;
    const tiles = `<div class="pv-k">
        <div><div class="l">ราคาขาย (รวม VAT)</div><div class="v">${n2(price)}</div><div class="s">${dif == null ? '&nbsp;' : (dif < 0 ? 'ต่ำกว่า' : dif > 0 ? 'สูงกว่า' : 'เท่า') + 'ราคาปกติ ' + (dif ? pc(Math.abs(dif)) : '') + tip('ราคาปกติ (RSP) ของทั้งเซ็ต ' + n2(c.rsp))}</div></div>
        <div><div class="l">กำไรสุทธิ / ออเดอร์</div><div class="v${ok && +c.profit < 0 ? ' neg' : ''}">${ok ? n2(c.profit) : '—'}</div><div class="s">${ok ? (+c.profit < 0 ? 'ขาดทุน · ' : '') + pc(c.margin) + ' ของรายได้' : 'รอต้นทุนครบ'}</div></div>
        <div><div class="l">ราคาคุ้มทุน (รวม VAT)${tip('ราคาขาย (รวม VAT) ที่กำไรสุทธิเท่ากับ 0 พอดี · ขายต่ำกว่านี้ขาดทุน')}</div><div class="v">${ok && c.breakeven_price != null ? n2(c.breakeven_price) : '—'}</div><div class="s">${ok && c.breakeven_price != null && price ? (price >= +c.breakeven_price ? 'สูงกว่าคุ้มทุน ' : 'ต่ำกว่าคุ้มทุน ') + n2(Math.abs(price - c.breakeven_price)) : '&nbsp;'}</div></div></div>`;
    const row = (lbl, h, v, cls, id) => `<tr class="${cls || ''}"${id ? ` data-lad="${id}"` : ''}><td>${id ? '<span class="car">▶</span>' : ''}${lbl}</td><td class="how">${h}</td><td class="num">${v}</td></tr>`;
    const subs = (id, rows) => rows.map(x => `<tr class="sub" data-ladp="${id}" hidden><td title="${esc(String(x[0]).replace(/<[^>]+>/g, ''))}">${x[0]}</td><td class="how" title="${esc(String(x[1]).replace(/<[^>]+>/g, ''))}">${x[1]}</td><td class="num">${x[2] == null ? '—' : '−' + n2(x[2])}</td></tr>`).join('');
    const feeGrp = (ly, title) => { const F = fees(ly); if (!F.length) return '';
      return row(title, F.length === 1 ? how(F[0]) : '', '−' + n2(sum(F.map(f => f.amount_ex))), 'grp neg', ly) + subs(ly, F.map(f => [esc(f.item), how(f), f.amount_ex])); };
    const costSubs = lines.map(l => [`${l.kind === 'gift' ? 'แถม · ' : ''}${esc(l.name || nm(l.sku))}`, l.unit_cost == null ? '<span class="miss">ไม่มีต้นทุน</span>' : `${n2(l.unit_cost)} × ${l.qty} ชิ้น`, l.unit_cost == null ? null : l.cost]);
    const table = `<table class="pv-lad" data-no-sort data-no-page><thead><tr><th>รายการ</th><th class="how">วิธีคิด</th><th class="num">บาท</th></tr></thead><tbody>
        ${row('ราคาขาย (รวม VAT)', 'ตามที่กรอก', n2(price))}
        ${row(`VAT ${vp}%`, `${n2(price)} × ${vp} ÷ ${100 + vp}`, '−' + n2(price - rex), 'neg')}
        ${row('รายได้ไม่รวม VAT' + tip('ใช้ตัวเลขนี้คิดทุกรายการด้านล่าง'), '', n2(rex), 'tot')}
        ${row('ต้นทุนสินค้า + ของแถม', `ต้นทุน${costMonthTxt(c) === 'ไฟล์ต้นทุนสินค้า' ? 'จาก' : 'บัญชี '}${costMonthTxt(c)}${ok ? '' : ' · <span class="miss">ยังไม่ครบ</span>'}`, '−' + n2(cogs), 'grp neg', 'cost')}${subs('cost', costSubs)}
        ${feeGrp('platform', 'ค่า Platform')}${feeGrp('selling', 'ค่าขาย')}${feeGrp('overhead', 'ค่าบริหาร / Marketing')}
        ${row('กำไรสุทธิ / ออเดอร์', ok ? pc(c.margin) + ' ของรายได้' : 'ยังไม่รวมต้นทุนที่ขาด', ok ? n2(c.profit) : '—', 'tot big' + (ok && +c.profit < 0 ? ' negv' : ''))}
      </tbody></table>`;
    return ban + tiles + `<section class="tr-part pv-sec"><div class="pv-h">รายละเอียดการคำนวณ${tip('ราคาที่กรอกเป็นราคารวม VAT · ระบบถอด VAT ออกก่อน แล้วคิดทุกรายการแบบไม่รวม VAT · ค่าที่เป็น % คิดจากราคารวม VAT แล้วถอด VAT · กดแถวที่มี ▶ เพื่อดูรายการย่อย')}</div>${table}</section>`;
  }
  const bindLad = root => root.querySelectorAll('.pv-lad tr.grp').forEach(tr => tr.onclick = () => { const open = !tr.classList.contains('open'); tr.classList.toggle('open', open); root.querySelectorAll(`.pv-lad tr[data-ladp="${tr.dataset.lad}"]`).forEach(x => { x.hidden = !open; }); });

  // ===================== (2026-10-28) จำลองโปร (ผู้บริหาร): ลองใส่ช่องทาง สินค้า ราคา ดูว่าคุ้มไหม · ไม่ส่งเป็นคำขอ =====================
  const SIM = { channel_id: '', items: [{ sku: '', qty: 1 }], gifts: [], price: '' };
  function renderSim(box, C) {
    box.innerHTML = `<div class="pv-sim"><div class="pv-sim-f">
        <div class="pv-h">จำลองโปร${` <span class="pr-i" data-tip="ลองใส่ช่องทาง สินค้า ของแถม และราคา แล้วกดคำนวณ · ไม่ส่งเป็นคำขอ ไม่บันทึกอะไร">ⓘ</span>`}</div>
        <label>ช่องทาง</label><select class="pr-in" id="smCh"><option value="">เลือกช่องทาง</option>${C.channels.map(c => `<option value="${c.id}"${+SIM.channel_id === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        <label>สินค้าใน 1 ออเดอร์ <small>ชื่อสินค้า · จำนวนชิ้น</small></label><div id="smItems">${rowsHtml('items', SIM.items, C)}</div><button type="button" class="pr-add" data-smadd="items">＋ เพิ่มสินค้า</button>
        <label>ของแถม <small>ถ้ามี</small></label><div id="smGifts">${rowsHtml('gifts', SIM.gifts, C)}</div><button type="button" class="pr-add" data-smadd="gifts">＋ เพิ่มของแถม</button>
        <label>ราคาขายต่อออเดอร์ <small>รวม VAT หลังส่วนลด</small></label><input class="pr-in" type="number" id="smPrice" min="0" step="0.01" value="${esc(SIM.price)}" placeholder="0.00">
        <div style="margin-top:14px;"><button type="button" class="pr-btn" id="smGo">คำนวณ</button></div></div>
      <div id="smOut"><div class="pr-empty">ใส่ช่องทาง สินค้า และราคา แล้วกด คำนวณ</div></div></div>`;
    const dd = document.getElementById('pvDD') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'pvDD', className: 'pv-dd', hidden: true });
    const nz = t => String(t || '').toLowerCase().replace(/[\s\-._·]/g, '');
    const find = q => { const toks = String(q || '').trim().toLowerCase().split(/\s+/).filter(Boolean).map(nz);
      return C.products.filter(p => toks.every(t => (nz(p.name) + nz(p.sku) + nz(p.alias)).includes(t))).sort((a, b) => (a.status === 'Discontinued') - (b.status === 'Discontinued') || a.name.localeCompare(b.name, 'th')).slice(0, 60); };
    let ddFor = null;
    const ddClose = () => { dd.hidden = true; ddFor = null; };
    const ddOpen = inp => { ddFor = inp; const L = find(inp.value);
      dd.innerHTML = L.length ? L.map(p => `<button type="button" data-sk="${esc(p.sku)}"><span>${esc(p.name)}</span><small>${esc(p.sku)}</small></button>`).join('') : '<div class="none">ไม่เจอสินค้าที่ตรงกับคำค้น</div>';
      const r = inp.getBoundingClientRect(); dd.style.left = r.left + 'px'; dd.style.width = Math.max(r.width, 260) + 'px'; dd.style.top = (r.bottom + 4) + 'px'; dd.hidden = false; };
    dd.onmousedown = e => { const b = e.target.closest('button[data-sk]'); if (!b || !ddFor) return; e.preventDefault(); const p = C.products.find(x => x.sku === b.dataset.sk);
      SIM[ddFor.dataset.k][+ddFor.dataset.i].sku = p.sku; ddFor.value = prodLabel(p); ddClose(); };
    const redrawRows = () => { document.getElementById('smItems').innerHTML = rowsHtml('items', SIM.items, C); document.getElementById('smGifts').innerHTML = rowsHtml('gifts', SIM.gifts, C); };
    const skuFromLabel = v => { const s = skuOf(v); return C.products.some(p => p.sku === s) ? s : ''; };
    box.oninput = e => { const t = e.target;
      if (t.classList.contains('pr-pick')) { SIM[t.dataset.k][+t.dataset.i].sku = skuFromLabel(t.value); if (e.type === 'input') ddOpen(t); return; }
      if (t.dataset.f === 'qty') SIM[t.dataset.k][+t.dataset.i].qty = +t.value || 0;
      if (t.id === 'smPrice') SIM.price = t.value; if (t.id === 'smCh') SIM.channel_id = t.value; };
    box.onchange = box.oninput;
    box.addEventListener('focusin', e => { if (e.target.classList.contains('pr-pick')) ddOpen(e.target); });
    box.addEventListener('focusout', e => { if (e.target.classList.contains('pr-pick')) setTimeout(() => { if (document.activeElement !== ddFor) ddClose(); }, 150); });
    box.onclick = async e => {
      const add = e.target.closest('[data-smadd]'); if (add) { SIM[add.dataset.smadd].push({ sku: '', qty: 1 }); redrawRows(); return; }
      const del = e.target.closest('[data-del]'); if (del) { SIM[del.dataset.del].splice(+del.dataset.i, 1); if (!SIM.items.length) SIM.items.push({ sku: '', qty: 1 }); redrawRows(); return; }
      if (e.target.id !== 'smGo') return;
      const out = document.getElementById('smOut'), p = { channel_id: SIM.channel_id ? +SIM.channel_id : null, price: +SIM.price || 0, orders: 0,
        items: SIM.items.filter(x => x.sku).map(x => ({ sku: x.sku, qty: +x.qty || 0 })), gifts: SIM.gifts.filter(x => x.sku).map(x => ({ sku: x.sku, qty: +x.qty || 0 })) };
      if (!p.channel_id || !p.price || !p.items.length) { out.innerHTML = '<div class="pr-empty">ใส่ช่องทาง สินค้า และราคาให้ครบก่อน</div>'; return; }
      e.target.disabled = true; e.target.textContent = 'กำลังคำนวณ…';
      try { const [c, k] = await Promise.all([rpc('promo_calc', { p }), rpc('promo_rank', { p }).catch(() => null)]);
        out.innerHTML = calcView(c, C) + (k ? rankCard(k) : ''); bindLad(out); }
      catch (err) { out.innerHTML = `<div class="pr-empty">คำนวณไม่สำเร็จ: ${esc(err.message)}</div>`; }
      e.target.disabled = false; e.target.textContent = 'คำนวณ';
    };
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'smPrice') { e.preventDefault(); document.getElementById('smGo').click(); } });
  }

  async function renderExec() {
    const el = document.getElementById('page-exec'); if (!el) return;
    el.innerHTML = '<div class="pr-empty">กำลังโหลด…</div>';
    try { EX.list = await rpc('promo_list', { p_scope: 'all' }); await cat(); } catch (e) { el.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    const L = EX.list, cnt = s => L.filter(r => r.status === s).length;
    el.innerHTML = `<div class="pr-bar2"><div class="pr-bar2-l"><button type="button" class="pr-btn ghost pv-simbtn" id="exSim" aria-pressed="${EX.filter === 'sim'}">จำลองโปร</button></div>
        <div class="pr-seg ex-tabs" id="exSeg">${[['pending', 'รออนุมัติ', cnt('pending')], ['approved', 'อนุมัติแล้ว', cnt('approved')], ['rejected', 'ไม่อนุมัติ', cnt('rejected')], ['all', 'ทั้งหมด', L.filter(r => r.status !== 'cancelled').length]].map(([k, t, n]) => `<button type="button" data-f="${k}" aria-pressed="${EX.filter === k}">${t}${n == null ? '' : `<b>${n}</b>`}</button>`).join('')}</div></div>
      <div class="pr-card" style="padding:6px 0 0;"><div id="exList" style="overflow-x:auto;"></div></div>`;
    const simBtn = el.querySelector('#exSim');
    el.querySelector('#exSeg').onclick = e => { const b = e.target.closest('button[data-f]'); if (!b) return; EX.filter = b.dataset.f; el.querySelectorAll('#exSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); simBtn.setAttribute('aria-pressed', 'false'); listExec(); };
    simBtn.onclick = () => { EX.filter = 'sim'; el.querySelectorAll('#exSeg button').forEach(x => x.setAttribute('aria-pressed', 'false')); simBtn.setAttribute('aria-pressed', 'true'); renderSim(document.getElementById('exList'), CAT); };
    EX.filter === 'sim' ? renderSim(document.getElementById('exList'), CAT) : listExec();
  }
  function listExec() {
    const box = document.getElementById('exList'); if (!box) return;
    const L = EX.list.filter(r => EX.filter === 'all' ? r.status !== 'cancelled' : r.status === EX.filter);
    box.innerHTML = L.length ? `<table class="pr-tb pr-ex" data-no-sort data-no-page>
        <colgroup><col style="width:17%"><col style="width:8%"><col style="width:10%"><col style="width:8%"><col style="width:8%"><col style="width:8%"><col style="width:9%"><col style="width:9%"><col style="width:8%"><col style="width:8%"><col style="width:7%"></colgroup>
        <thead><tr><th style="padding-left:20px;">ชื่อโปร</th><th>ขอโดย</th><th>ช่องทาง</th><th>วันเริ่ม</th><th>วันจบ</th><th>ราคา</th><th>กำไร / ออเดอร์</th><th>กำไรเทียบต้นทุน</th><th>Rank</th><th>สถานะ</th><th>ส่งเมื่อ</th></tr></thead><tbody>`
      + L.map(r => { const c = r.calc || {}, s = ST[r.status] || [r.status, ''];
        return `<tr class="click" data-id="${r.id}"><td style="padding-left:20px;"><div class="t1">${esc(r.title)}</div></td>
          <td>${esc(r.requested_name || '—')}</td><td>${esc(r.channel || '')}</td>
          <td>${r.start_date ? dTh(r.start_date) : '—'}</td><td>${r.end_date ? dTh(r.end_date) : '—'}</td>
          <td class="tn">${n2(r.price)}</td>
          <td class="tn" style="color:${+c.profit < 0 ? 'var(--red,#dc2626)' : 'var(--text)'};font-weight:600;">${c.profit == null ? '—' : n2(c.profit)}</td>
          <td class="tn">${pc(c.markup)}</td><td>${rkPill(r.rank)}</td><td><span class="pr-pill ${s[1]}">${s[0]}</span></td><td>${dTh(r.requested_at)}</td></tr>`; }).join('') + '</tbody></table>'
      : '<div class="pr-empty">ไม่มีรายการ</div>';
    box.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => openReq(+tr.dataset.id));
  }
  function ladder(c, C) {
    const nm = k => (C.products.find(p => p.sku === k) || { name: k }).name;
    const fees = ly => (c.fees || []).filter(f => f.layer === ly);
    const lines = (c.lines || []);
    const sumOf = a => a.reduce((t, x) => t + (+x || 0), 0);
    const grp = (id, title, amt, subs, tip) => `<tr class="grp" data-lad="${id}"><td><span class="car">▸</span>${title}${tip ? ` <span class="pr-i" data-tip="${esc(tip)}">ⓘ</span>` : ''}</td><td class="num neg">−${n2(amt)}</td></tr>`
      + subs.map(x => `<tr class="sub" data-ladp="${id}" hidden><td>${x[0]}</td><td class="num neg">−${n2(x[1])}</td></tr>`).join('');
    const tot = (t, v, extra) => `<tr class="sum"><td>${t}${extra ? ` <span class="xt">${extra}</span>` : ''}</td><td class="num" style="color:${v < 0 ? 'var(--red,#dc2626)' : 'var(--text)'}">${n2(v)}</td></tr>`;
    const costRows = lines.map(l => [`${l.kind === 'gift' ? 'แถม ' : ''}${esc(l.name || nm(l.sku))} ×${l.qty} <span class="xt">${l.unit_cost == null ? 'ไม่มีต้นทุน' : '@ ' + n2(l.unit_cost)}</span>`, l.cost]);
    const feeRows = ly => fees(ly).map(f => [`${esc(f.item)} <span class="xt">${f.kind === 'pct' ? +(f.rate * 100).toFixed(2) + '%' : n2(f.rate) + ' ฿'}</span>`, f.amount_ex]);
    return `<table class="pr-tb pr-lad" data-no-sort data-no-page><tbody>
      <tr><td>ราคาขาย (รวม VAT)</td><td class="num">${n2(c.price)}</td></tr>
      ${tot('รายได้ไม่รวม VAT', c.revenue_ex)}
      ${grp('cost', 'ต้นทุนสินค้า + ของแถม', sumOf(lines.map(l => l.cost)), costRows)}
      ${tot('กำไรขั้นต้น', c.gross, pc(c.revenue_ex ? c.gross / c.revenue_ex : null))}
      ${grp('platform', 'ค่า Platform', sumOf(fees('platform').map(f => f.amount_ex)), feeRows('platform'))}
      ${tot('หลังค่า Platform', c.after_platform)}
      ${grp('selling', 'ค่าขาย', sumOf(fees('selling').map(f => f.amount_ex)), feeRows('selling'))}
      ${tot('หลังค่าขาย', c.after_selling)}
      ${grp('overhead', 'ค่าบริหาร / Marketing', sumOf(fees('overhead').map(f => f.amount_ex)), feeRows('overhead'))}
      ${tot('กำไรสุทธิ / ออเดอร์', c.profit, `${pc(c.margin)} ของรายได้`)}
    </tbody></table>`;
  }
  async function openReq(id) {
    const r = EX.list.find(x => x.id === id); if (!r) return;
    const C = await cat();
    trOpenShell('Promotion · รายละเอียด');
    const S = { price: r.price, items: JSON.parse(JSON.stringify(r.items || [])), gifts: JSON.parse(JSON.stringify(r.gifts || [])), rank: r.rank, note: null };
    const body = () => document.getElementById('trBody');
    const draw = (c) => {
      const st = ST[r.status] || [r.status, ''], mm = pc(+c.min_markup, 0), k = S.rank;
      const changed = +S.price !== +r.price || JSON.stringify(S.gifts) !== JSON.stringify(r.gifts || []) || JSON.stringify(S.items) !== JSON.stringify(r.items || []);
      const pnm = x => (C.products.find(p => p.sku === x) || { name: x }).name;
      const sig = c.signal === 'green' ? ['g', 'ผ่าน'] : c.signal === 'red' ? ['r', 'ไม่ผ่าน'] : ['', 'ขาดต้นทุน'];
      const miss = (c.missing_costs || []).map(pnm);
      const rsp = +c.rsp, dif = rsp ? (+c.price - rsp) / rsp : null;
      const cm = (c.lines || [])[0] && c.lines[0].cost_month ? new Date(c.lines[0].cost_month + 'T00:00:00') : null;
      const cmTxt = cm ? `${['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'][cm.getMonth()]} ${String(cm.getFullYear() + 543).slice(2)}` : 'ล่าสุด';
      const tip = (t) => ` <span class="pr-i" data-tip="${esc(t)}">ⓘ</span>`;
      // ตาราง "สินค้าในโปร": แก้จำนวนได้ + ราคา Rank ต่อชิ้น (รองรับหลายสินค้า)
      const kl = {}; ((k && k.lines) || []).forEach(l => { kl[l.sku] = l; });
      const hit = k && k.status === 'ok' ? k.rank : 0;
      const rc = (v, r) => `<td class="num${hit === r ? ' hit' : ''}">${v == null || +v === 0 ? '—' : n0(v)}</td>`;
      const showRank = k && ['ok', 'below'].includes(k.status);
      // ต้นทุนต่อชิ้น / ต้นทุนรวม ของแต่ละรายการ (จากผลคำนวณล่าสุด)
      const cl = {}; (c.lines || []).forEach(l => { cl[l.kind + '|' + l.sku] = l; });
      const costCells = (kind, sku) => { const l = cl[kind + '|' + sku]; return l && l.unit_cost != null ? `<td class="num">${n2(l.unit_cost)}</td><td class="num">${n2(l.cost)}</td>` : '<td class="num miss">ไม่มีต้นทุน</td><td class="num">—</td>'; };
      const costTot = (c.lines || []).reduce((t, l) => t + (l.unit_cost != null ? +l.cost || 0 : 0), 0), costMiss = (c.lines || []).filter(l => l.unit_cost == null).map(l => pnm(l.sku));
      const itemRows = S.items.map((g, i) => { const l = kl[g.sku] || {}; return `<tr><td>${esc(pnm(g.sku))}</td><td class="q"><input class="pr-in" type="number" min="0" step="1" data-ii="${i}" value="${g.qty}"></td>${costCells('item', g.sku)}${showRank ? rc(l.p1, 1) + rc(l.p2, 2) + rc(l.p3, 3) : ''}</tr>`; }).join('');
      const giftRows = S.gifts.map((g, i) => `<tr class="gift"><td><span class="tag">แถม</span>${esc(pnm(g.sku))}</td><td class="q"><input class="pr-in" type="number" min="0" step="1" data-gi="${i}" value="${g.qty}"></td>${costCells('gift', g.sku)}${showRank ? '<td class="num">—</td><td class="num">—</td><td class="num">—</td>' : ''}</tr>`).join('');
      const sumRow = `<tr class="ui-sum"><td>รวม</td><td></td><td></td><td class="num">${n2(costTot)}${costMiss.length ? tip('ไม่รวม ' + costMiss.join(', ') + ' (ยังไม่มีต้นทุน)') : ''}</td>${showRank ? rc(k.sum1, 1) + rc(k.sum2, 2) + rc(k.sum3, 3) : ''}</tr>`;
      const rkTip = 'ราคาที่ขอ ≥ ผลรวม Rank ไหน (ไล่จาก Rank 1) = Rank นั้น · ต่ำกว่า Rank 3 = ไม่ผ่าน\nมากกว่า 1 ชิ้นใช้ราคาเซ็ต · ไม่นับของแถม · ราคาจากหน้า สินค้า & ราคา';
      // (2026-10-28) หน้าตาใหม่: ผลก่อน → ตัวเลข 3 ช่อง → เงินไปไหนบ้าง (มีวิธีคิด + VAT) → สินค้าในโปร (พับได้) → Feedback
      body().innerHTML = `
        <div class="tr-card ex-hd"><div class="tr-card-t">${esc(r.title)} <span class="pr-pill ${st[1]}" style="margin-left:6px;">${st[0]}</span></div>
          <div class="tr-card-m"><span>${esc(r.channel || '')}</span>${r.start_date ? `<span>${dTh(r.start_date)}${r.end_date ? ' – ' + dTh(r.end_date) : ''}</span>` : ''}<span>ขอโดย ${esc(r.requested_name || '')}</span><span>${rkPill(k)}${tip(rkTip)}</span></div></div>
        <div class="pv-try"><label>ลองราคา (รวม VAT)</label><input class="pr-in" type="number" step="0.01" id="exPrice" value="${S.price}"><button type="button" class="pr-btn" id="exCalc">คำนวณ</button>${changed ? '<button type="button" class="pr-btn ghost" id="exReset">คืนค่าเดิม</button><span class="pv-chg">ตัวเลขที่ลองปรับ ยังไม่แก้คำขอ</span>' : ''}</div>
        ${calcView(c, C)}
        <details class="tr-part pv-items" style="padding:12px 14px;"${changed ? ' open' : ''}><summary>สินค้าในโปร (${S.items.length + S.gifts.length} รายการ) · ปรับจำนวนแล้วกดคำนวณ</summary>
          <table class="ex-it"><thead><tr><th>รายการ</th><th class="q">จำนวน</th><th class="num">ต้นทุน/ชิ้น</th><th class="num">ต้นทุนรวม</th>${showRank ? '<th class="num rk">Rank 1</th><th class="num rk">Rank 2</th><th class="num rk">Rank 3</th>' : ''}</tr></thead>
            <tbody>${itemRows}${giftRows}${sumRow}</tbody></table>
          ${k && !showRank ? `<div class="ex-chg" style="color:var(--text3);">${k.status === 'no_rank' ? 'ช่องทางนี้ไม่เช็ค Rank' : k.status === 'not_sold' ? 'มีสินค้าที่ไม่ได้ติ๊กขายในช่องทางนี้ จึงเทียบ Rank ไม่ได้' : 'ยังไม่มีราคา Rank ของ ' + esc((k.missing || []).join(', '))}</div>` : ''}</details>
        <section class="tr-part" style="padding:12px 14px;"><label style="font-size:12px;font-weight:600;color:var(--text2);">Feedback ถึงทีม</label>
          <textarea class="pr-in" id="exNote" rows="2" style="margin-top:6px;" placeholder="เช่น อนุมัติถ้าขึ้นราคาเป็น ${c.target_price ? n0(Math.ceil(c.target_price)) : '…'}">${esc(S.note != null ? S.note : (r.decision_note || ''))}</textarea>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
            ${r.status === 'pending' ? '<button class="pr-btn good" data-dec="approved">✓ อนุมัติ</button><button class="pr-btn bad" data-dec="rejected">✕ ไม่อนุมัติ</button>' : '<button class="pr-btn ghost" data-dec="pending">กลับเป็นรออนุมัติ</button>'}
          </div></section>
        ${r.note ? `<div class="pr-note">หมายเหตุจากทีม: ${esc(r.note)}</div>` : ''}`;
      // ขั้นบันไดกำไร: กดแถวกลุ่มเพื่อดูรายการย่อย
      bindLad(body());
      // ลองปรับ: คำนวณเมื่อกด "คำนวณ" หรือ Enter
      const recalc = async () => {
        S.note = document.getElementById('exNote').value;
        S.price = +document.getElementById('exPrice').value || 0;
        body().querySelectorAll('[data-gi]').forEach(x => { S.gifts[+x.dataset.gi].qty = +x.value || 0; });
        body().querySelectorAll('[data-ii]').forEach(x => { S.items[+x.dataset.ii].qty = +x.value || 0; });
        const btn = document.getElementById('exCalc'); if (btn) { btn.disabled = true; btn.textContent = 'กำลังคำนวณ…'; }
        try { const pp = { channel_id: r.channel_id, price: S.price, orders: 0, items: S.items, gifts: S.gifts };
          const [c2, k2] = await Promise.all([rpc('promo_calc', { p: pp }), rpc('promo_rank', { p: pp }).catch(() => null)]); S.rank = k2; draw(c2); }
        catch (e) { toast('คำนวณไม่สำเร็จ: ' + e.message); if (btn) { btn.disabled = false; btn.textContent = 'คำนวณ'; } }
      };
      document.getElementById('exCalc').onclick = recalc;
      body().querySelectorAll('#exPrice,[data-gi],[data-ii]').forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); recalc(); } }));
      const rs = document.getElementById('exReset');
      if (rs) rs.onclick = () => { S.note = document.getElementById('exNote').value; S.price = r.price; S.items = JSON.parse(JSON.stringify(r.items || [])); S.gifts = JSON.parse(JSON.stringify(r.gifts || [])); document.getElementById('exPrice').value = r.price; body().querySelectorAll('[data-ii]').forEach(x => { x.value = S.items[+x.dataset.ii].qty; }); body().querySelectorAll('[data-gi]').forEach(x => { x.value = S.gifts[+x.dataset.gi].qty; }); recalc(); };
      body().querySelectorAll('[data-dec]').forEach(b => b.onclick = async () => {
        const d = b.dataset.dec; if (d !== 'pending' && !(await uiConfirm(d === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ', { text: `${r.title} · ${r.channel || ''} · ${n0(r.price)}`, ok: d === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ', tone: d === 'approved' ? 'good' : 'bad', icon: d === 'approved' ? '✓' : '✕' }))) return;
        try { await rpc('promo_decide', { p_id: r.id, p_status: d, p_note: document.getElementById('exNote').value }); toast('บันทึกแล้ว'); trClose(); renderExec(); } catch (e) { uiAlert('บันทึกไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
      });
    };
    draw(r.calc || await rpc('promo_calc', { p: { channel_id: r.channel_id, price: r.price, orders: r.orders, items: r.items, gifts: r.gifts } }));
  }

  // ===================== หน้า ค่าธรรมเนียมช่องทาง (ผู้บริหาร) =====================
  // (2026-10-15 v2) ตารางเต็มความยาว (ไม่มีกรอบเลื่อนในตัว) · แถวรวมล็อกล่างจอ · แก้รายการ / ช่องทางผ่านแผงขวา · ใต้ตัวเลขมี "จริง" ไว้เทียบ (กดดูที่มาได้)
  const ACT_LABEL = { commission: 'Commission', ads: 'ค่า Ads', admin: 'ค่าบริหาร (ทั้งบริษัท)', marketing: 'Marketing (ทั้งบริษัท)', platform: 'ค่า Platform รวม' };
  const ACCT_CH = ['TikTok', 'Shopee Mall', 'Shopee 24', 'Lazada Mall', 'Lazada 24', 'FB-COD', 'FB-โอนเงิน', 'Telesales', 'Line my shop', 'ตัวแทน', 'Eve&Boy', 'Konvy', 'Watsons', 'CJ', 'Thaimart'];
  const SYS_CH = ['TikTok', 'Shopee', 'Lazada', 'Facebook', 'ตัวแทน', 'Modern Trade'];
  const info = tip => `<span class="pr-i" data-tip="${esc(tip)}">ⓘ</span>`;
  const mLbl = m => { const th = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']; return th[+m.slice(5, 7) - 1] + ' ' + String(+m.slice(0, 4) + 543).slice(2); };
  let FT = null, FA = null;
  const feeEdit = async p => { try { await rpc('fee_edit', { p }); toast('บันทึกแล้ว'); return true; } catch (e) { uiAlert('บันทึกไม่สำเร็จ', { text: e.message, tone: 'bad' }); return false; } };
  function seg(name, opts, cur) { return `<div class="pr-seg" data-seg="${name}">${opts.map(([k, t]) => `<button type="button" data-v="${k}" aria-pressed="${k === cur}">${t}</button>`).join('')}</div>`; }
  function segVal(root, name) { const b = root.querySelector(`[data-seg="${name}"] button[aria-pressed="true"]`); return b ? b.dataset.v : null; }
  function bindSeg(root) { root.querySelectorAll('[data-seg]').forEach(g => g.addEventListener('click', e => { const b = e.target.closest('button[data-v]'); if (!b) return; g.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); })); }
  function itemForm(it) {
    trOpenShell(it ? 'แก้ไขรายการค่าใช้จ่าย' : 'เพิ่มรายการค่าใช้จ่าย');
    const b = document.getElementById('trBody');
    b.innerHTML = `<section class="tr-part" style="padding:16px;"><div class="pr-f">
      <div class="full"><label>ชื่อรายการ</label><input class="pr-in" id="fiName" value="${esc(it ? it.name : '')}" placeholder="เช่น ค่าธรรมเนียม Campaign"></div>
      <div class="full"><label>คิดเป็น</label>${seg('kind', [['pct', '% ของราคาขาย'], ['per_order', 'บาทต่อออเดอร์']], it ? it.kind : 'pct')}</div>
      <div class="full"><label>หมวด ${info('ใช้จัดกลุ่มในขั้นบันไดกำไรของ Promotion: หลังค่า Platform → หลังค่าขาย → กำไรสุทธิ')}</label>${seg('layer', Object.entries(LAYER).map(([k, t]) => [k, t.split(' (')[0]]), it ? it.layer : 'platform')}</div>
      <div class="full"><label>ใช้กับ</label>${seg('apply', Object.entries(APPLY), it ? it.apply : 'all')}</div>
      <div class="full"><label>เทียบกับค่าจริงหมวด ${info('ใต้ตัวเลขในตารางจะแสดง % ที่เสียจริงตามงบบัญชีของหมวดนี้ไว้เทียบ')}</label>
        <select class="pr-in" id="fiAct"><option value="">ไม่เทียบ</option>${['commission', 'ads', 'admin', 'marketing'].map(k => `<option value="${k}"${it && it.actual_key === k ? ' selected' : ''}>${ACT_LABEL[k]}</option>`).join('')}</select></div>
    </div><div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;"><button class="pr-btn" id="fiSave">บันทึก</button>
      ${it ? '<button class="pr-btn ghost" id="fiDel" style="margin-left:auto;color:var(--red,#dc2626);">ลบรายการนี้</button>' : ''}</div></section>`;
    bindSeg(b);
    document.getElementById('fiSave').onclick = async () => {
      const name = document.getElementById('fiName').value.trim(); if (!name) return uiAlert('ใส่ชื่อรายการ');
      const p = { name, kind: segVal(b, 'kind'), layer: segVal(b, 'layer'), apply: segVal(b, 'apply'), actual_key: document.getElementById('fiAct').value };
      if (await feeEdit(it ? { op: 'item_update', id: it.id, ...p } : { op: 'item_add', ...p })) { trClose(); renderFee(); }
    };
    const d = document.getElementById('fiDel'); if (d) d.onclick = async () => { if (await uiConfirm('ลบรายการ', { text: `${it.name} · ตัวเลขทุกช่องทางของรายการนี้จะหายด้วย`, ok: 'ลบ', tone: 'bad' }) && await feeEdit({ op: 'item_delete', id: it.id })) { trClose(); renderFee(); } };
  }
  function channelForm(c) {
    trOpenShell(c ? 'แก้ไขช่องทาง' : 'เพิ่มช่องทาง');
    const b = document.getElementById('trBody'), sel = new Set((c && c.acct_channels) || []);
    b.innerHTML = `<section class="tr-part" style="padding:16px;"><div class="pr-f">
      <div class="full"><label>ชื่อช่องทาง</label><input class="pr-in" id="fcName" value="${esc(c ? c.name : '')}" placeholder="เช่น Shopee Video"></div>
      <div class="full"><label>อยู่ในกลุ่มช่องทาง</label>${seg('sys', SYS_CH.map(x => [x, x]), c ? c.sys_channel : '')}</div>
      <div class="full"><label>คอลัมน์ในงบบัญชีที่ใช้เทียบค่าจริง ${info('เลือกคอลัมน์ช่องทางในงบกำไรขาดทุนของบัญชีที่ตรงกับช่องทางนี้ (เลือกได้หลายคอลัมน์)')}</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${ACCT_CH.map(x => `<label class="pr-chk"><input type="checkbox" value="${esc(x)}"${sel.has(x) ? ' checked' : ''}> ${esc(x)}</label>`).join('')}</div></div>
    </div><div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;"><button class="pr-btn" id="fcSave">บันทึก</button>
      ${c ? '<button class="pr-btn ghost" id="fcDel" style="margin-left:auto;color:var(--red,#dc2626);">ลบช่องทางนี้</button>' : ''}</div></section>`;
    bindSeg(b);
    document.getElementById('fcSave').onclick = async () => {
      const name = document.getElementById('fcName').value.trim(); if (!name) return uiAlert('ใส่ชื่อช่องทาง');
      const p = { name, sys_channel: segVal(b, 'sys') || '', acct_channels: [...b.querySelectorAll('.pr-chk input:checked')].map(x => x.value) };
      if (await feeEdit(c ? { op: 'channel_update', id: c.id, ...p } : { op: 'channel_add', ...p })) { CAT = null; trClose(); renderFee(); }
    };
    const d = document.getElementById('fcDel'); if (d) d.onclick = async () => { if (await uiConfirm('ลบช่องทาง', { text: `${c.name} · ถ้ามีโปรอ้างถึง ระบบจะปิดใช้งานแทนการลบ`, ok: 'ลบ', tone: 'bad' }) && await feeEdit({ op: 'channel_delete', id: c.id })) { CAT = null; trClose(); renderFee(); } };
  }
  function thresholdForm() {
    trOpenShell('เกณฑ์สัญญาณไฟ');
    const b = document.getElementById('trBody'), cur = +(((FT.settings || {}).min_markup || 0.05) * 100).toFixed(2);
    b.innerHTML = `<section class="tr-part" style="padding:16px;"><div class="pr-f"><div class="full"><label>ไฟเขียวเมื่อกำไรเกินต้นทุนทั้งหมดอย่างน้อย (%)</label>
      <input class="pr-in" id="fmV" type="number" step="0.5" min="0" value="${cur}"></div></div>
      <div class="pr-note" style="margin-top:10px;">ต้นทุนทั้งหมด = ต้นทุนสินค้า + ของแถม + ค่าธรรมเนียมทุกรายการในตารางนี้ · คนขอโปรเห็นแค่ผ่าน / ไม่ผ่าน ไม่เห็นตัวเลข</div>
      <div style="margin-top:16px;"><button class="pr-btn" id="fmSave">บันทึก</button></div></section>`;
    document.getElementById('fmSave').onclick = async () => { const v = +document.getElementById('fmV').value; if (!isFinite(v) || v < 0) return uiAlert('ใส่ตัวเลข');
      if (await feeEdit({ op: 'settings', min_markup: v / 100 })) { CAT = null; trClose(); renderFee(); } };
  }
  async function actualTrace(chId, key, label) {
    trOpenShell('ที่มาของตัวเลข');
    const body = document.getElementById('trBody');
    let d; try { d = await rpc('fee_actual_detail', { p_channel_id: chId, p_key: key }); } catch (e) { body.innerHTML = `<div class="tr-warn">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    const ms = d.months || [], rev = d.rev || {}, lines = d.lines || [];
    const costM = m => lines.filter(x => x[0] === m).reduce((t, x) => t + +x[3], 0), revT = ms.reduce((t, m) => t + (+rev[m] || 0), 0), costT = ms.reduce((t, m) => t + costM(m), 0);
    const stds = [...new Set(lines.map(x => (x[1] ? x[1] + ' ' : '') + x[2]))];
    body.innerHTML = `<div class="tr-card"><div class="tr-card-t">${esc(label)} จริง ${info('วิธีคิด\n' + ACT_LABEL[key] + ' รวม ' + ms.length + ' เดือน ÷ ยอดขายรวม ' + ms.length + ' เดือน (ตามงบบัญชี ไม่รวม VAT)' + (d.scope === 'company' ? '\nใช้ตัวเลขทั้งบริษัท เพราะบัญชีแบ่งค่าใช้จ่ายส่วนกลางเข้าแต่ละช่องทางด้วยสัดส่วนคงที่ จึงไม่สะท้อนช่องทางจริง' : ''))}</div>
        <div class="tr-card-v">${pc(revT ? costT / revT : null)}</div>
        <div class="tr-card-m"><span>${d.scope === 'company' ? 'ทั้งบริษัท' : esc((d.acct_channels || []).join(' + '))}</span><span>${ms.length ? mLbl(ms[0]) + ' – ' + mLbl(ms[ms.length - 1]) : ''}</span></div></div>
      <section class="tr-part"><table class="tr-tb" data-no-sort data-no-page><thead><tr><th>รายการ</th>${ms.map(m => `<th>${mLbl(m)}</th>`).join('')}<th>รวม</th></tr></thead><tbody>
        <tr class="tr-gh"><td>ยอดขาย ${info('รายได้จากการขาย + ค่าขนส่ง + ส่วนลดจาก Platform − รับคืน − ส่วนลดจ่าย (ไม่รวม VAT)')}</td>${ms.map(m => `<td>${n0(rev[m])}</td>`).join('')}<td>${n0(revT)}</td></tr>
        ${stds.map(sn => `<tr class="tr-gc"><td>${esc(sn)}</td>${ms.map(m => `<td>${n0(lines.filter(x => x[0] === m && (x[1] ? x[1] + ' ' : '') + x[2] === sn).reduce((t, x) => t + +x[3], 0))}</td>`).join('')}<td>${n0(lines.filter(x => (x[1] ? x[1] + ' ' : '') + x[2] === sn).reduce((t, x) => t + +x[3], 0))}</td></tr>`).join('')}
        <tr class="tr-gh"><td>${esc(ACT_LABEL[key])} รวม</td>${ms.map(m => `<td>${n0(costM(m))}</td>`).join('')}<td>${n0(costT)}</td></tr>
        <tr><td><b>% ของยอดขาย</b></td>${ms.map(m => `<td class="tr-pc">${pc(+rev[m] ? costM(m) / rev[m] : null)}</td>`).join('')}<td class="tr-pc">${pc(revT ? costT / revT : null)}</td></tr></tbody></table></section>
      <div class="tr-src"><div class="tr-src-h">แหล่งที่มา</div><dl class="tr-dl"><dt>ไฟล์</dt><dd>งบกำไรขาดทุนของบัญชี แท็บรายเดือน (${ms.map(mLbl).join(', ')})</dd>
        <dt>คอลัมน์</dt><dd>${d.scope === 'company' ? 'ทุกช่องทางรวมกัน' : esc((d.acct_channels || []).join(' + '))}</dd>
        <dt>บรรทัดบัญชี</dt><dd><div class="tr-chips">${(d.rev_lines || []).map(x => `<span>${esc((x[0] ? x[0] + ' ' : '') + x[1])}</span>`).join('')}${stds.map(x => `<span>${esc(x)}</span>`).join('')}</div></dd></dl></div>`;
  }
  async function renderFee() {
    const el = document.getElementById('page-execfee'); if (!el) return;
    if (!FT) el.innerHTML = '<div class="pr-empty">กำลังโหลด…</div>';
    try { [FT, FA] = await Promise.all([rpc('fee_table'), rpc('fee_actuals').catch(() => null)]); } catch (e) { el.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (!FT) { el.innerHTML = '<div class="pr-empty">ยังไม่มีสิทธิ์ใช้หน้านี้</div>'; return; }
    const T = FT, A = FA || {}, AC = A.channels || {}, CO = A.company || {}, ms = A.months || [];
    const V = {}; T.values.forEach(([i, c, v]) => { V[i + '|' + c] = +v; });
    const chs = T.channels.filter(c => c.active), items = T.items.filter(it => it.active);
    const val = (it, c) => V[it.id + '|' + c.id];
    const show = (it, v) => v == null ? '' : it.kind === 'pct' ? +(v * 100).toFixed(4) : +v;
    const act = (key, c) => key === 'admin' || key === 'marketing' ? CO[key] : (AC[c.id] || {})[key];
    const tot = (c, pred) => items.filter(it => it.kind === 'pct' && pred(it)).reduce((t, it) => t + (val(it, c) || 0), 0);
    const actCell = (key, c, setV) => { const a = act(key, c); if (a == null || !(AC[c.id] || key === 'admin' || key === 'marketing')) return '';
      const diff = setV == null ? 0 : a - setV, cls = diff > 0.02 ? ' hi' : diff < -0.02 ? ' lo' : '';
      return `<button type="button" class="pr-act${cls}" data-act="${c.id}|${key}" data-tip="จริง ${ms.length ? mLbl(ms[0]) + ' – ' + mLbl(ms[ms.length - 1]) : ''} · คลิกเพื่อดูที่มา">จริง ${(a * 100).toFixed(1)}%</button>`; };
    const W0 = 260, W = 112, width = W0 + W * chs.length;
    const cols = `<colgroup><col style="width:${W0}px">${chs.map(() => `<col style="width:${W}px">`).join('')}</colgroup>`;
    const legend = `ตัวเลขในช่อง = ค่าที่ตั้งไว้ใช้คิดกำไรโปร (แก้ได้ทันที บันทึกเองเมื่อออกจากช่อง · ช่อง % ใส่เป็นตัวเลขเปอร์เซ็นต์ เช่น 7.49)\n"จริง" = % ที่เสียจริงตามงบบัญชี ${ms.length ? mLbl(ms[0]) + ' – ' + mLbl(ms[ms.length - 1]) : '3 เดือนล่าสุด'} ไว้เทียบ ไม่เขียนทับค่าที่ตั้ง · สีแดง = จริงสูงกว่าที่ตั้งเกิน 2% · สีเขียว = จริงต่ำกว่า\nค่าบริหาร / Marketing ใช้ตัวเลขทั้งบริษัท เพราะบัญชีแบ่งเข้าช่องทางด้วยสัดส่วนคงที่\nระบบเก็บประวัติการแก้ทุกครั้ง`;
    el.innerHTML = `<div class="pr-bar2"><div class="pr-bar2-l">${info(legend)}<span class="pr-note" style="margin:0;">เทียบค่าจริง: ${ms.length ? mLbl(ms[0]) + ' – ' + mLbl(ms[ms.length - 1]) : '—'}</span>
        <button type="button" class="pr-chip" id="feMm" data-tip="คลิกเพื่อแก้">ไฟเขียวเมื่อกำไร ≥ ${pc(+((T.settings || {}).min_markup || 0.05), 0)} ของต้นทุน</button></div>
        <div style="display:flex;gap:8px;"><button class="pr-btn ghost" id="feAddItem">＋ เพิ่มรายการ</button><button class="pr-btn ghost" id="feAddCh">＋ เพิ่มช่องทาง</button></div></div>
      <div class="pr-fx" id="feWrap"><table class="pr-ft" style="width:${width}px;">${cols}<thead><tr><th>รายการ</th>${chs.map(c => `<th><button type="button" class="pr-hd" data-ch="${c.id}" data-tip="คลิกเพื่อแก้ไขช่องทาง"><span>${esc(c.name)}</span><small>${esc(c.sys_channel || '')}</small></button></th>`).join('')}</tr></thead><tbody>`
      + items.map(it => `<tr><td><button type="button" class="pr-rn" data-it="${it.id}" data-tip="คลิกเพื่อแก้ไขรายการ"><b>${esc(it.name)}</b><small>${it.kind === 'pct' ? '% ของราคา' : 'บาท / ออเดอร์'} · ${esc(LAYER[it.layer].split(' (')[0])}${it.apply !== 'all' ? ' · ' + esc(APPLY[it.apply]) : ''}</small></button></td>`
        + chs.map(c => { const v = val(it, c); return `<td><div class="pr-cell"><input inputmode="decimal" data-cell="${it.id}|${c.id}" data-kind="${it.kind}" value="${show(it, v)}" placeholder="—"><i>${v == null ? '' : it.kind === 'pct' ? '%' : 'บ.'}</i></div>${it.actual_key ? actCell(it.actual_key, c, v) : ''}</td>`; }).join('') + '</tr>').join('')
      + `</tbody></table></div>
      <div class="pr-sum" id="feSum"><table class="pr-ft" style="width:${width}px;">${cols}<tbody>
        <tr><td>รวมค่า Platform</td>${chs.map(c => { const s = tot(c, it => it.layer === 'platform'); return `<td><b>${(s * 100).toFixed(2)}%</b>${actCell('platform', c, s)}</td>`; }).join('')}</tr>
        <tr><td>รวมทุกรายการ (%)</td>${chs.map(c => `<td><b>${(tot(c, () => true) * 100).toFixed(2)}%</b></td>`).join('')}</tr></tbody></table></div>
      <details class="pr-card pr-hist"><summary>ประวัติการแก้ไข (${(T.history || []).length})</summary>${(T.history || []).length ? `<table class="pr-tb" data-no-sort data-no-page><tbody>${T.history.map(h => `<tr><td style="white-space:nowrap;">${new Date(h[0]).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td><td>${esc(h[1] || '')}</td><td>${esc(h[2] || '')}</td><td class="num">${esc(h[3] ?? '')}${h[3] != null || h[4] != null ? ' → ' : ''}${esc(String(h[4] ?? '').slice(0, 60))}</td></tr>`).join('')}</tbody></table>` : '<div class="pr-empty">ยังไม่มี</div>'}</details>`;
    const wrap = document.getElementById('feWrap'), sum = document.getElementById('feSum');
    wrap.addEventListener('scroll', () => { sum.scrollLeft = wrap.scrollLeft; });
    sum.addEventListener('scroll', () => { if (Math.abs(wrap.scrollLeft - sum.scrollLeft) > 1) wrap.scrollLeft = sum.scrollLeft; });
    el.querySelectorAll('input[data-cell]').forEach(inp => {
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.value = inp.defaultValue; inp.blur(); } });
      inp.addEventListener('change', async () => {
        const [item_id, channel_id] = inp.dataset.cell.split('|').map(Number), raw = inp.value.trim().replace(/[,%\s]/g, '');
        if (raw !== '' && !isFinite(+raw)) { uiAlert('ใส่เป็นตัวเลข'); inp.value = inp.defaultValue; return; }
        inp.classList.add('saving');
        if (await feeEdit({ op: 'value', item_id, channel_id, value: raw === '' ? '' : String(inp.dataset.kind === 'pct' ? +raw / 100 : +raw) })) { const y = window.scrollY, x = wrap.scrollLeft; await renderFee(); window.scrollTo(0, y); const w2 = document.getElementById('feWrap'); if (w2) w2.scrollLeft = x; }
        else inp.classList.remove('saving');
      });
    });
    el.querySelectorAll('[data-it]').forEach(b => b.onclick = () => itemForm(T.items.find(x => x.id === +b.dataset.it)));
    el.querySelectorAll('[data-ch]').forEach(b => b.onclick = () => channelForm(T.channels.find(x => x.id === +b.dataset.ch)));
    el.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { const [cid, key] = b.dataset.act.split('|'); const c = chs.find(x => x.id === +cid); actualTrace(+cid, key, `${ACT_LABEL[key]}${key === 'admin' || key === 'marketing' ? '' : ' · ' + c.name}`); });
    document.getElementById('feAddItem').onclick = () => itemForm(null);
    document.getElementById('feAddCh').onclick = () => channelForm(null);
    document.getElementById('feMm').onclick = thresholdForm;
  }

  window.PromoUI = { render(page) { if (page === 'promo') renderPromo(); else if (page === 'exec') renderExec(); else if (page === 'execfee') renderFee(); } };
})();
