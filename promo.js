// promo.js (v20261102c) — ปุ่มเลือกค่าธรรมเนียมขึ้นทุกช่องทาง: ช่องทางที่ไม่มี API ปุ่ม "ค่าจริง" กดไม่ได้ พร้อมบอกเหตุผล
// promo.js (v20261102b) — เลือก ค่าจริง / ค่าที่ตั้งไว้ ตอนจำลองโปรและดูคำขอ (ปุ่มบนผลคำนวณ) แทนคอลัมน์ "ใช้คิดโปร" ในหน้าค่าธรรมเนียม · การ์ด / หัวตารางมี ⓘ อธิบายตัวเลข
// promo.js (v20261102a) — ค่าธรรมเนียมช่องทาง: คอลัมน์ "ใช้คิดโปร" เลือก ค่าจริง / ตั้งเอง ได้รายบรรทัด (สูตรคิดโปรใช้ตามที่เลือก · อัตราคำนวณที่ฐานข้อมูล fee_rates ที่เดียว) · TikTok มีมุมมอง "เทียบทุกประเภท" ในตารางเดียว
// promo.js (v20261030a) — หน้าค่าธรรมเนียมช่องทางแบบใหม่ (แท็บแพลตฟอร์ม · ค่าจริง vs ตั้งไว้ · สรุป 3 บรรทัด · Shopee/TikTok ค่าจริง 30 วัน) · ตารางเดิมยังเข้าได้
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
      .pr-x { border:1px solid var(--border); background:none; border-radius:8px; color:var(--text2); cursor:pointer; font-size:14px; }
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
      .pr-tb.pr-ex2 { table-layout:fixed; min-width:1180px; width:100%; }
      /* (2026-11-10 b) แผงรายละเอียด: การ์ดขาวบนพื้นเทา · ตัวหนังสือน้อย · 2 คอลัมน์ */
      .exd-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:14px 16px; margin-bottom:12px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
      .exd-hd .exd-t { display:flex; align-items:center; gap:8px; flex-wrap:wrap; font-size:18px; font-weight:700; color:var(--text); }
      .exd-hd .exd-m { margin-top:4px; font-size:12.5px; color:var(--text2); } .exd-note { margin-top:8px; padding:8px 10px; border-radius:8px; background:var(--bg3); font-size:12.5px; color:var(--text2); }
      .exd-ch { display:flex; align-items:center; gap:8px; margin-bottom:8px; } .exd-ch b { font-size:13.5px; color:var(--text); } .exd-cs { margin-left:auto; font-size:12.5px; color:var(--text2); font-variant-numeric:tabular-nums; }
      .exd-it { width:100%; border-collapse:collapse; font-size:13px; } .exd-it td { padding:6px 0; border-bottom:1px solid var(--border); color:var(--text); } .exd-it tr:last-child td { border-bottom:0; }
      .exd-pc { display:grid; grid-template-columns:minmax(0,1fr) 200px; gap:0; padding:0 !important; }
      .exd-pl { padding:14px 16px; min-width:0; } .exd-pr { padding:14px 16px; border-left:1px solid color-mix(in srgb, var(--accent) 35%, var(--border)); display:flex; flex-direction:column; gap:8px; background:color-mix(in srgb, var(--accent) 10%, var(--bg2)); border-radius:0 12px 12px 0; }   /* (2026-11-10) พื้นทองอ่อน แยกจากกล่องขาวชัด (เดิมเทาอ่อนกลืน) */
      .exd-pr label { font-size:12px; font-weight:600; color:var(--text); } .exd-pr input { width:100%; font-size:18px; font-weight:700; padding:6px 10px; } .exd-pr .pr-btn { justify-content:center; } .exd-pr span { font-size:11px; color:var(--text3); line-height:1.4; }
      .exd-it td.u { width:80px; text-align:right; font-size:12px; color:var(--text3); white-space:nowrap; } .exd-it tr.sum td { font-weight:700; border-top:1px solid var(--border); border-bottom:0; padding-top:8px; }
      .exd-it td:first-child { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:0; width:100%; }
      .exd-it td.q { width:70px; text-align:center; } .exd-it td.num { padding-left:10px; } .exd-it td.q input { width:52px; text-align:center; padding:3px 6px; } .exd-it td.num { width:72px; text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .exd-gift { display:inline-block; font-size:10px; font-weight:700; padding:0 6px; border-radius:4px; margin-right:6px; background:color-mix(in srgb, var(--accent) 16%, transparent); color:var(--accent); }
      .exd-try { display:flex; align-items:center; gap:8px; margin-top:10px; padding-top:10px; border-top:1px dashed var(--border); flex-wrap:wrap; }
      .exd-try label { font-size:12.5px; color:var(--text2); } .exd-try input { width:110px; font-weight:700; } .exd-try span { font-size:11.5px; color:var(--text3); }
      .exd-kpi { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); background:var(--bg2); border:1px solid var(--border); border-radius:12px; margin-bottom:12px; overflow:hidden; box-shadow:0 1px 2px rgba(15,23,42,.04); }
      .exd-kpi > div { padding:12px 14px; min-width:0; } .exd-kpi > div + div { border-left:1px solid var(--border); }
      .exd-kpi span { display:block; font-size:11.5px; color:var(--text2); } .exd-kpi b { display:block; font-size:22px; font-weight:700; color:var(--text); margin-top:2px; font-variant-numeric:tabular-nums; }
      .exd-kpi i { display:block; font-style:normal; font-size:11.5px; color:var(--text3); margin-top:1px; }
      .exd-kpi .pos b { color:var(--green,#16a34a); } .exd-kpi .neg b { color:var(--red,#dc2626); }
      .exd-fm { margin-left:auto !important; } .exd-fm button { font-size:11px !important; padding:3px 9px !important; }
      .exd-exn { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; padding:2px 4px 2px 9px; border-radius:99px; background:color-mix(in srgb, var(--accent) 14%, transparent); color:var(--text); }
      .exd-exn button { border:0; background:transparent; color:var(--text2); cursor:pointer; font-size:11px; padding:0 4px; }
      .exd-lad { table-layout:auto !important; } .exd-lad td { padding:8px 4px !important; vertical-align:middle !important; color:var(--text); border-bottom:1px solid var(--border); white-space:nowrap; }
      .exd-lad td.num { width:110px; text-align:right; } .exd-lad tr.muted td { color:var(--text2); font-size:12.5px; }
      .exd-lad tr.tot td { background:transparent !important; font-weight:700; } .exd-lad tr.tot.big td { font-size:15px; border-top:2px solid var(--text2); border-bottom:0; padding-top:10px !important; }
      .exd-lad tr.sub td { font-size:12.5px; color:var(--text2); padding-left:26px !important; } .exd-lad tr.grp td.neg { color:var(--text); } .exd-lad tr.grp.off td { color:var(--text3); }
      .exd-lad .pv-sp { display:inline-block; width:19px; } .exd-hint { margin-top:8px; font-size:11px; color:var(--text3); }
      .tm2 { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(320px,1fr); gap:16px; align-items:start; margin-bottom:16px; }
      .tm2-f .exd-card { margin-bottom:12px; } .tm2-r { position:sticky; top:76px; } .tm2-w { width:100%; box-sizing:border-box; }
      .tm2-2 { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.2fr); gap:12px; margin-top:12px; } .tm2-dates { display:flex; align-items:center; gap:6px; } .tm2-dates .pr-in { flex:1; min-width:0; } .tm2-dates span { color:var(--text3); }
      .tm2-price { font-size:20px !important; font-weight:700; padding:8px 12px !important; } .tm2-send { width:100%; justify-content:center; margin-top:12px; padding:10px 0 !important; font-size:14px; }
      .tm2-ph { display:flex; flex-direction:column; gap:6px; text-align:center; padding:36px 20px !important; color:var(--text3); font-size:12.5px; } .tm2-ph b { color:var(--text); font-size:14px; }
      .tm2-r .pr-rk { background:var(--bg2); border:1px solid var(--border); border-radius:12px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
      .pr-mine2 .tm2-fb { white-space:normal; font-size:12.5px; } .pr-mine2 .tm2-x { padding:4px 10px !important; font-size:12px !important; } .pr-mine2 .tm2-x.bad { color:var(--red,#dc2626); }
      @media (max-width:1100px) { .tm2 { grid-template-columns:1fr; } .tm2-r { position:static; } }
      .sm2 { display:grid; grid-template-columns:minmax(300px,380px) minmax(0,1fr); gap:16px; align-items:start; }
      .sm2-f .exd-card { margin-bottom:12px; } .sm2-l { display:block; font-size:12.5px; font-weight:600; color:var(--text); margin:0 0 6px; } .sm2-l small { font-weight:400; color:var(--text3); margin-left:4px; }
      .sm2-f select.pr-in, #smPrice { width:100%; } .sm2-f .pr-row { display:grid; grid-template-columns:minmax(0,1fr) 64px 30px; gap:6px; align-items:center; margin-bottom:6px; } .sm2-f .pr-row .pr-in { width:100%; box-sizing:border-box; } .sm2-f .pr-row .pr-x { height:32px; }
      .pr-card:has(> #exList > .sm2) { background:transparent !important; border:0 !important; box-shadow:none !important; padding:0 !important; } .pr-card:has(> #exList > .sm2) > #exList { overflow:visible !important; } .sm2-f .pr-add { margin-top:6px; }
      .sm2-p { background:color-mix(in srgb, var(--accent) 10%, var(--bg2)) !important; border-color:color-mix(in srgb, var(--accent) 35%, var(--border)) !important; }
      .sm2-p input.pr-in { font-size:20px; font-weight:700; padding:8px 12px; } .sm2-p .pr-btn { width:100%; justify-content:center; margin-top:10px; padding:10px 0; font-size:14px; }
      .sm2-empty { color:var(--text3); font-size:13px; text-align:center; padding:40px 16px !important; }
      .sm2-rk .pr-rk { background:var(--bg2); border:1px solid var(--border); border-radius:12px; box-shadow:0 1px 2px rgba(15,23,42,.04); }
      .exd-ov { display:inline-flex; align-items:center; gap:3px; margin-left:10px; font-size:12px; color:var(--text3); text-decoration:none !important; }
      .exd-ov input.exd-pct { width:56px; padding:2px 6px; text-align:right; font-size:12.5px; border-radius:6px; }
      .exd-ov.on input.exd-pct { border-color:var(--accent) !important; background:color-mix(in srgb, var(--accent) 10%, var(--bg2)) !important; font-weight:700; }
      .exd-lad tr.sub.off .exd-ov { opacity:.4; pointer-events:none; }
      @media (max-width:1100px) { .sm2 { grid-template-columns:1fr; } }
      .exd-act { position:sticky; bottom:-16px; margin:4px -16px -16px; padding:12px 16px 16px; background:var(--bg2); border-top:1px solid var(--border); box-shadow:0 -6px 16px rgba(15,23,42,.06); z-index:2; }
      .exd-act textarea { width:100%; } .exd-btns { display:flex; gap:8px; margin-top:10px; } .exd-btns .pr-btn { flex:1; justify-content:center; padding:10px 0; font-size:13.5px; }
      .ex-topctl { display:flex; align-items:center; gap:8px; } .ex-topctl .pr-seg { margin:0; } .ex-topctl .pv-simbtn { white-space:nowrap; }
      .pr-tb.pr-ex2 td.ctr, .pr-tb.pr-ex2 th.ctr { text-align:center; } .pr-tb.pr-ex2 .ex-m { color:var(--text3); } .pr-tb.pr-ex2 .ex-n { color:var(--red,#dc2626); }
      .pr-tb.pr-ex2 tbody td { border-bottom:1px solid var(--border); } .pr-tb.pr-ex2 th { font-size:11.5px; color:var(--text3); font-weight:600; text-align:left; padding:10px 12px; }
      .pr-tb.pr-ex2 td { vertical-align:middle; padding:10px 12px; text-align:left; } .pr-tb.pr-ex2 .tn { text-align:right; font-variant-numeric:tabular-nums; } .pr-tb.pr-ex2 th.tn { text-align:right; }
      .pr-tb.pr-ex2 .ex-c1 { padding-left:20px; } .pr-tb.pr-ex2 tr.ex-r .ex-c1 { padding-left:38px; }
      .pr-tb.pr-ex2 tr.ex-r:hover td { background:color-mix(in srgb, var(--accent) 6%, transparent); }
      .pr-tb.pr-ex2 tr.ex-g td { background:var(--bg3); cursor:pointer; padding:9px 20px; border-top:1px solid var(--border); } .pr-tb.pr-ex2 tr.ex-g:hover td { background:color-mix(in srgb, var(--accent) 8%, var(--bg3)); }
      .ex-car { display:inline-block; width:16px; color:var(--text3); font-size:11px; } .ex-gm { margin-left:10px; font-size:12px; color:var(--text3); } .ex-neg { color:var(--red,#dc2626); font-weight:600; }
      .ex-pds { display:flex; flex-wrap:wrap; gap:4px 6px; margin-top:2px; } .ex-pd { font-size:12.5px; color:var(--text); } .ex-pd b { font-weight:600; color:var(--text2); }
      .ex-pd + .ex-pd::before { content:'+'; color:var(--text3); margin-right:6px; }
      .ex-pd.gift { color:var(--text2); } .ex-pd.gift i { font-style:normal; font-size:10px; font-weight:600; padding:0 5px; border-radius:4px; margin-right:4px; background:color-mix(in srgb, var(--accent) 16%, transparent); color:var(--accent); }
      .ex-pf { font-weight:700; font-variant-numeric:tabular-nums; } .ex-pf.neg { color:var(--red,#dc2626); }
      .ex-pc { padding-left:28px !important; padding-right:40px !important; } .ex-pl { display:flex; align-items:baseline; gap:8px; } .ex-pl .ex-sub { margin:0; }
      .ex-bar { position:relative; height:5px; border-radius:3px; background:var(--bg3); margin-top:6px; } .ex-bar::after { content:''; position:absolute; left:50%; top:-2px; bottom:-2px; width:1px; background:var(--text3); opacity:.5; }
      .ex-bar i { position:absolute; top:0; bottom:0; display:block; border-radius:3px; } .ex-bar i.p { left:50%; background:var(--green,#16a34a); } .ex-bar i.n { right:50%; background:var(--red,#dc2626); }
      .ex-by { font-size:12.5px; } .ex-sub { font-size:11px; color:var(--text3); margin-top:2px; } .ex-mute { color:var(--text3); opacity:.5; }
      .pv-lad input.pv-x { width:13px; height:13px; margin:0 6px 0 0; vertical-align:-2px; accent-color:var(--accent); cursor:pointer; }
      .pv-lad tr.off td, .pv-lad tr.sub.off td { color:var(--text3) !important; } .pv-lad tr.off td:first-child, .pv-lad tr.sub.off td:first-child { text-decoration:line-through; text-decoration-color:var(--text3); }
      .pv-off { font-size:11px; font-weight:600; color:var(--text3); } .pv-exn { margin:0 0 10px; padding:8px 12px; border-radius:8px; font-size:12px; background:color-mix(in srgb, var(--accent) 10%, transparent); color:var(--text2); }
      .pv-exr { margin-left:8px; font:inherit; font-size:11.5px; padding:2px 8px; border-radius:6px; border:1px solid var(--border); background:var(--bg2); color:var(--text); cursor:pointer; }
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
      .pr-rk .rk-tiles { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:0; margin:14px 0 4px; border:1px solid var(--border); border-radius:10px; overflow:hidden; }
      .pr-rk .rk-tiles > div { padding:10px 12px; min-width:0; } .pr-rk .rk-tiles > div + div { border-left:1px solid var(--border); }
      .pr-rk .rk-tiles span { display:block; font-size:11.5px; color:var(--text2); } .pr-rk .rk-tiles b { display:block; font-size:19px; font-weight:700; color:var(--text); margin-top:2px; font-variant-numeric:tabular-nums; }
      .pr-rk .rk-tiles i { display:block; font-style:normal; font-size:11px; color:var(--text3); margin-top:1px; }
      .pr-rk .rk-tiles .me { background:var(--bg3); } .pr-rk .rk-tiles .me.bad b { color:var(--red,#dc2626); } .pr-rk .rk-tiles .me.ok b { color:var(--green,#16a34a); }
      .pr-rk .rk-tiles .hit { background:color-mix(in srgb, var(--green,#16a34a) 12%, transparent); } .pr-rk .rk-tiles .hit b { color:var(--green,#16a34a); }
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
    // (2026-11-10) เลิกใช้แถบเส้นตำแหน่งราคา → ช่องตัวเลข 4 ช่อง: ราคาที่ขอ | Rank 1 | Rank 2 | Rank 3 · ช่อง Rank ที่ราคาถึงเป็นสีเขียว · ต่ำกว่า Rank 3 = ช่องราคาที่ขอสีแดง
    const tiles = `<div class="rk-tiles"><div class="me ${ok ? 'ok' : 'bad'}"><span>ราคาที่ขอ</span><b>${n0(price)}</b></div>${S.map((v, i) => `<div class="${ok && hit === i + 1 ? 'hit' : ''}"><span>Rank ${i + 1}</span><b>${v == null || +v === 0 ? '—' : n0(v)}</b>${v != null && +v ? `<i>${price >= v ? 'ถึง' : 'ขาด ' + n0(v - price)}</i>` : ''}</div>`).join('')}</div>`;
    const bar = tiles;
    const cell = (v, r) => `<td class="${hit === r ? 'hit' : ''}">${v == null || +v === 0 ? '—' : n0(v)}</td>`;
    const tbl = `<table data-no-sort data-no-page><thead><tr><th>สินค้า</th><th>จำนวน</th><th>Rank 1</th><th>Rank 2</th><th>Rank 3</th></tr></thead><tbody>`
      + lines.map(l => `<tr><td>${esc(l.name)}</td><td>${n0(l.qty)}</td>${cell(l.p1, 1)}${cell(l.p2, 2)}${cell(l.p3, 3)}</tr>`).join('')
      + `<tr class="sum"><td>รวม × จำนวน</td><td></td>${cell(S[0], 1)}${cell(S[1], 2)}${cell(S[2], 3)}</tr></tbody></table>`;
    const why = ok ? (hit === 1 ? `ราคาที่ขอ ${n0(price)} ≥ Rank 1 (${n0(S[0])})` : `ราคาที่ขอ ${n0(price)} ≥ Rank ${hit} (${n0(S[hit - 1])}) แต่ต่ำกว่า Rank ${hit - 1} (${n0(S[hit - 2])})`)
      : `ราคาที่ขอ ${n0(price)} ต่ำกว่า Rank 3 (${n0(S[2])}) ซึ่งเป็นราคาต่ำสุดที่ยอมให้ขาย`;
    const tip = `${why} · ราคา Rank จากหน้า สินค้า & ราคา · ราคาต่อชิ้น${k.category === 'สินค้าเซ็ต' ? 'แบบเซ็ต เพราะมากกว่า 1 ชิ้น' : 'แบบเดี่ยว'} · ไม่นับของแถม`;
    return `<div class="pr-rk"><div class="rk-hd"><span class="rk-bd ${ok ? 'rk' + hit : 'rkx'}">${ok ? 'Rank ' + hit : 'ต่ำกว่า Rank 3'}</span><div class="rk-sb"><b>${ok ? 'ราคานี้อยู่ Rank ' + hit : 'ราคานี้ต่ำกว่าเกณฑ์'}</b> <span class="pr-i" data-tip="${esc(tip)}">ⓘ</span><br>${esc(k.channel)} · ${cat}</div></div>
      ${bar}${lines.length > 1 ? tbl : ''}</div>`;
  }
  async function check() {
    const C = await cat(), p = payload(), seq = ++chkSeq, box = document.getElementById('prSig');
    if (!box) return;
    const show = h => { box.innerHTML = h || '<div class="exd-card tm2-ph"><b>เช็ค Rank ราคา</b><span>เลือกช่องทาง ใส่สินค้า และราคา แล้วระบบบอกทันทีว่าราคาผ่าน Rank ไหม</span></div>'; };   // (2026-11-10) ช่องขวาคงที่ ไม่หุบ / ขยาย (กันหน้าเด้ง)
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
      <div class="tm2"><div class="tm2-f">
        <div class="exd-card"><div class="exd-ch"><b>รายละเอียดโปร</b><span class="pr-i" data-tip="กรอกโปรที่อยากทำ ระบบบอก Rank ราคาทันทีจากหน้า สินค้า & ราคา แล้วส่งให้ผู้บริหารอนุมัติ">ⓘ</span></div>
          <label class="sm2-l">ชื่อโปร</label><input class="pr-in tm2-w" data-f="title" value="${esc(F.title)}" placeholder="เช่น 11.11 แป้งดีเซ้ย์ 2 แถม 1">
          <div class="tm2-2"><div><label class="sm2-l">ช่องทาง</label><select class="pr-in tm2-w" data-f="channel_id"><option value="">เลือกช่องทาง</option>${C.channels.map(c => `<option value="${c.id}"${+F.channel_id === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
            <div><label class="sm2-l">ช่วงเวลา</label><div class="tm2-dates"><input class="pr-in" type="date" data-f="start_date" value="${esc(F.start_date)}"><span>–</span><input class="pr-in" type="date" data-f="end_date" value="${esc(F.end_date)}"></div></div></div></div>
        <div class="exd-card sm2-f"><label class="sm2-l">สินค้าที่ขายใน 1 ออเดอร์ <small>ชื่อสินค้า · จำนวนชิ้น</small></label><div class="pr-rows" id="prItems">${rowsHtml('items', F.items, C)}</div><button type="button" class="pr-add" data-addrow="items">＋ เพิ่มสินค้า</button>
          <label class="sm2-l" style="margin-top:14px;">ของแถมใน 1 ออเดอร์ <small>ถ้ามี</small></label><div class="pr-rows" id="prGifts">${rowsHtml('gifts', F.gifts, C)}</div><button type="button" class="pr-add" data-addrow="gifts">＋ เพิ่มของแถม</button></div>
        <div class="exd-card sm2-p"><label class="sm2-l">ราคาขายต่อออเดอร์ <small>รวม VAT หลังส่วนลด</small></label><input class="pr-in tm2-w tm2-price" type="number" min="0" step="0.01" data-f="price" value="${esc(F.price)}" placeholder="0.00">
          <label class="sm2-l" style="margin-top:12px;">หมายเหตุ <small>ไม่บังคับ</small></label><textarea class="pr-in tm2-w" rows="2" data-f="note" placeholder="เช่น เงื่อนไขพิเศษของ Platform">${esc(F.note)}</textarea>
          <button class="pr-btn tm2-send" id="prSubmit">ส่งขออนุมัติ</button><span class="pr-note" id="prMsg"></span></div></div>
      <div class="tm2-r"><div id="prSig"></div></div></div>
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
      // (2026-11-10) จัดกลุ่มตามโปร (ชื่อ + ช่องทาง) แบบเดียวกับหน้าอนุมัติ · หัวกลุ่มบอกช่องทาง / วันที่ / จำนวนรายการ · ไม่มีคอลัมน์ซ้อนกันแล้ว
      const prod = r => [...(r.items || []).map(x => `<span class="ex-pd">${esc(nm(x.sku))}${+x.qty > 1 ? ` <b>×${+x.qty}</b>` : ''}</span>`), ...(r.gifts || []).map(x => `<span class="ex-pd gift"><i>แถม</i>${esc(nm(x.sku))}${+x.qty > 1 ? ` <b>×${+x.qty}</b>` : ''}</span>`)].join('');
      const dr = r => !r.start_date ? '' : r.end_date && r.end_date !== r.start_date ? `${dTh(r.start_date)} – ${dTh(r.end_date)}` : dTh(r.start_date);
      const groups = [], gi = {}; L.forEach(r => { const k = (r.title || '') + '|' + (r.channel || ''); if (gi[k] == null) { gi[k] = groups.length; groups.push([]); } groups[gi[k]].push(r); });
      const row = r => { const st = ST[r.status] || [r.status, ''];
        return `<tr class="ex-r"><td class="ex-c1"><div class="ex-pds">${prod(r) || '<span class="ex-pd">—</span>'}</div></td>
          <td class="tn"><b>${n2(r.price)}</b></td><td class="ctr">${rkPill(r.rank)}</td>
          <td class="ctr"><span class="pr-pill ${st[1]}">${st[0]}</span></td>
          <td class="tm2-fb">${r.decision_note ? esc(r.decision_note) + (r.decided_name ? `<div class="ex-sub">${esc(r.decided_name)} · ${dTh(r.decided_at)}</div>` : '') : '<span class="ex-mute">—</span>'}</td>
          <td class="ex-m">${dTh(r.requested_at)}</td>
          <td class="ctr">${r.status === 'pending' ? `<button class="pr-btn ghost tm2-x" data-cancel="${r.id}">ยกเลิก</button>` : r.status === 'cancelled' ? `<button class="pr-btn ghost tm2-x bad" data-rm="${r.id}">ลบ</button>` : ''}</td></tr>`; };
      box.innerHTML = L.length ? `<div style="overflow-x:auto;"><table class="pr-tb pr-ex2 pr-mine2" data-no-sort data-no-page>
          <colgroup><col><col style="width:96px"><col style="width:92px"><col style="width:112px"><col style="width:26%"><col style="width:92px"><col style="width:84px"></colgroup>
          <thead><tr><th class="ex-c1">สินค้าในโปร</th><th class="tn">ราคา</th><th class="ctr">Rank</th><th class="ctr">สถานะ</th><th>Feedback</th><th>ส่งเมื่อ</th><th></th></tr></thead><tbody>`
        + groups.map(g => { const r0 = g[0];
            return `<tr class="ex-g"><td colspan="7"><b class="t1">${esc(r0.title)}</b><span class="ex-gm">${esc(r0.channel || '')}${dr(r0) ? ' · ' + dr(r0) : ''} · ${g.length} รายการ</span></td></tr>` + g.map(row).join(''); }).join('') + '</tbody></table></div>'
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
      .pv-dd button:hover { background:var(--bg3); } .pv-dd small { color:var(--text3); font-family:'Sarabun', sans-serif; font-size:11px; } .pv-dd .none { padding:10px; font-size:12px; color:var(--text3); }`;
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
    const how = f => (f.kind === 'pct' ? `${+(f.rate * 100).toFixed(2)}% × ${n2(price)} ÷ ${vf}` : `${n2(f.rate)} ÷ ${vf}`) + (f.src === 'actual' ? ' · ค่าจริง 30 วัน' : '');
    // (2026-10-28 b) ไม่ใช้เกณฑ์กำไรขั้นต่ำ (5%) แล้ว: แถบบนขึ้นเฉพาะตอนขาดต้นทุน · ขาดทุนดูจากกำไรสุทธิที่เป็นสีแดง
    const fm = c.fee_actual_ok === false ? `<div class="pv-fm"><span>ค่าธรรมเนียมแพลตฟอร์ม</span><div class="pr-seg"><button type="button" disabled aria-pressed="false" style="opacity:.45;cursor:default">ค่าจริง 30 วัน</button><button type="button" aria-pressed="true">ค่าที่ตั้งไว้</button></div><span class="pv-fm-n">ช่องทางนี้ไม่มีค่าจริงจาก API จึงใช้ค่าที่ตั้งไว้ในหน้าค่าธรรมเนียมช่องทาง</span></div>`
      : c.fee_actual_ok ? `<div class="pv-fm"><span>ค่าธรรมเนียมแพลตฟอร์ม${tip('ค่าจริง 30 วัน = เฉลี่ยจากออเดอร์ที่ได้เงินแล้ว 30 วันล่าสุด (อัปเดตทุกเช้า) รวมรายการที่แพลตฟอร์มหักแต่ไม่ได้ตั้งไว้\nค่าที่ตั้งไว้ = ตัวเลขในหน้าค่าธรรมเนียมช่องทาง\nค่าใช้จ่ายบริษัท (Ads / ค่าบริหาร / Marketing) ใช้ค่าที่ตั้งไว้ทั้งสองแบบ')}</span><div class="pr-seg" data-fm><button type="button" data-v="actual" aria-pressed="${c.fee_mode === 'actual'}">ค่าจริง 30 วัน</button><button type="button" data-v="set" aria-pressed="${c.fee_mode !== 'actual'}">ค่าที่ตั้งไว้</button></div></div>` : '';
    const ban = price && !ok ? `<div class="pv-ban warn"><b>ยังคำนวณกำไรไม่ได้</b><span>ยังไม่มีต้นทุนของ ${miss.map(esc).join(', ')} ในไฟล์ต้นทุนของบัญชี</span></div>` : '';
    const dif = +c.rsp > 0 ? (price - +c.rsp) / +c.rsp : null;
    const tiles = `<div class="pv-k">
        <div><div class="l">ราคาขาย (รวม VAT)</div><div class="v">${n2(price)}</div><div class="s">${dif == null ? '&nbsp;' : (dif < 0 ? 'ต่ำกว่า' : dif > 0 ? 'สูงกว่า' : 'เท่า') + 'ราคาปกติ ' + (dif ? pc(Math.abs(dif)) : '') + tip('ราคาปกติ (RSP) ของทั้งเซ็ต ' + n2(c.rsp))}</div></div>
        <div><div class="l">กำไรสุทธิ / ออเดอร์</div><div class="v${ok && +c.profit < 0 ? ' neg' : ''}">${ok ? n2(c.profit) : '—'}</div><div class="s">${ok ? (+c.profit < 0 ? 'ขาดทุน · ' : '') + pc(c.margin) + ' ของรายได้' : 'รอต้นทุนครบ'}</div></div>
        <div><div class="l">ราคาคุ้มทุน (รวม VAT)${tip('ราคาขาย (รวม VAT) ที่กำไรสุทธิเท่ากับ 0 พอดี · ขายต่ำกว่านี้ขาดทุน')}</div><div class="v">${ok && c.breakeven_price != null ? n2(c.breakeven_price) : '—'}</div><div class="s">${ok && c.breakeven_price != null && price ? (price >= +c.breakeven_price ? 'สูงกว่าคุ้มทุน ' : 'ต่ำกว่าคุ้มทุน ') + n2(Math.abs(price - c.breakeven_price)) : '&nbsp;'}</div></div></div>`;
    // (2026-11-10) ติ๊กออก = ไม่นับรายการนั้นในกำไร (เช่น สินค้าเดท ไม่คิดค่า Marketing) · คำนวณใหม่ใน Supabase (p.exclude)
    const EXC = new Set((c.exclude || []).map(String)), xbox = (key, on, title) => `<input type="checkbox" class="pv-x" data-x="${esc(key)}"${on ? ' checked' : ''} title="${esc(title || 'ติ๊กออก = ไม่นับรายการนี้')}">`;
    const row = (lbl, h, v, cls, id, xk) => `<tr class="${cls || ''}"${id ? ` data-lad="${id}"` : ''}><td>${xk || ''}${id ? '<span class="car">▶</span>' : ''}${lbl}</td><td class="how">${h}</td><td class="num">${v}</td></tr>`;
    const subs = (id, rows) => rows.map(x => `<tr class="sub${x[4] ? ' off' : ''}" data-ladp="${id}" hidden><td title="${esc(String(x[0]).replace(/<[^>]+>/g, ''))}">${x[3] || ''}${x[0]}</td><td class="how" title="${esc(String(x[1]).replace(/<[^>]+>/g, ''))}">${x[1]}</td><td class="num">${x[4] ? '<span class="pv-off">0.00</span>' : x[2] == null ? '—' : '−' + n2(x[2])}</td></tr>`).join('');
    const feeGrp = (ly, title) => { const F = fees(ly); if (!F.length) return ''; const on = F.filter(f => !f.excluded), allOff = !on.length;
      return row(title, F.length === 1 ? how(F[0]) : (on.length < F.length ? `ไม่นับ ${F.length - on.length} รายการ` : ''), allOff ? '<span class="pv-off">0.00</span>' : '−' + n2(sum(on.map(f => f.amount_ex))), 'grp neg' + (allOff ? ' off' : ''), ly, xbox('ly:' + ly, !allOff, 'ติ๊กออก = ไม่นับทั้งกลุ่ม'))
        + subs(ly, F.map(f => [esc(f.item), how(f), f.amount_ex, xbox(f.item, !f.excluded), f.excluded])); };
    const costSubs = lines.map(l => [`${l.kind === 'gift' ? 'แถม · ' : ''}${esc(l.name || nm(l.sku))}`, l.unit_cost == null ? '<span class="miss">ไม่มีต้นทุน</span>' : `${n2(l.unit_cost)} × ${l.qty} ชิ้น`, l.unit_cost == null ? null : l.cost]);
    const table = `<table class="pv-lad" data-no-sort data-no-page><thead><tr><th>รายการ</th><th class="how">วิธีคิด</th><th class="num">บาท</th></tr></thead><tbody>
        ${row('ราคาขาย (รวม VAT)', 'ตามที่กรอก', n2(price))}
        ${row(`VAT ${vp}%`, `${n2(price)} × ${vp} ÷ ${100 + vp}`, '−' + n2(price - rex), 'neg')}
        ${row('รายได้ไม่รวม VAT' + tip('ใช้ตัวเลขนี้คิดทุกรายการด้านล่าง'), '', n2(rex), 'tot')}
        ${row('ต้นทุนสินค้า + ของแถม', `ต้นทุน${costMonthTxt(c) === 'ไฟล์ต้นทุนสินค้า' ? 'จาก' : 'บัญชี '}${costMonthTxt(c)}${ok ? '' : ' · <span class="miss">ยังไม่ครบ</span>'}`, c.cogs_excluded ? '<span class="pv-off">0.00</span>' : '−' + n2(cogs), 'grp neg' + (c.cogs_excluded ? ' off' : ''), 'cost', xbox('cogs', !c.cogs_excluded, 'ติ๊กออก = ไม่นับต้นทุนสินค้า'))}${subs('cost', costSubs)}
        ${feeGrp('platform', 'ค่า Platform')}${feeGrp('selling', 'ค่าขาย')}${feeGrp('overhead', 'ค่าบริหาร / Marketing')}
        ${row('กำไรสุทธิ / ออเดอร์', ok ? pc(c.margin) + ' ของรายได้' : 'ยังไม่รวมต้นทุนที่ขาด', ok ? n2(c.profit) : '—', 'tot big' + (ok && +c.profit < 0 ? ' negv' : ''))}
      </tbody></table>`;
    const exN = EXC.size ? `<div class="pv-exn">ไม่นับ ${[...EXC].map(x => x === 'cogs' ? 'ต้นทุนสินค้า' : esc(x)).join(' · ')} — ตัวเลขด้านบนคิดแบบไม่นับรายการเหล่านี้แล้ว <button type="button" class="pv-exr" data-xreset>นับทั้งหมด</button></div>` : '';
    return fm + ban + tiles + exN + `<section class="tr-part pv-sec"><div class="pv-h">รายละเอียดการคำนวณ${tip('ติ๊กช่องหน้ารายการออก = ไม่นับรายการนั้นในกำไร (เช่น สินค้าเดท ไม่คิดค่า Marketing) แล้วระบบคำนวณใหม่ทันที · ราคาที่กรอกเป็นราคารวม VAT · ระบบถอด VAT ออกก่อน แล้วคิดทุกรายการแบบไม่รวม VAT · ค่าที่เป็น % คิดจากราคารวม VAT แล้วถอด VAT · ค่าธรรมเนียมแพลตฟอร์มใช้ค่าจริง (เฉลี่ยจากออเดอร์ที่ได้เงินแล้ว 30 วันล่าสุด) หรือค่าที่ตั้งไว้ ตามที่เลือกในหน้าค่าธรรมเนียมช่องทาง · กดแถวที่มี ▶ เพื่อดูรายการย่อย')}</div>${table}</section>`;
  }
  const bindFm = (root, fn) => root.querySelectorAll('[data-fm] button').forEach(b => b.onclick = () => { if (b.getAttribute('aria-pressed') !== 'true') fn(b.dataset.v); });
  // (2026-11-10 b) แผงรายละเอียดผู้บริหาร: การคำนวณแบบอ่านง่าย — 2 คอลัมน์ (รายการ | บาท) · วิธีคิดอยู่ในตัวชี้ (hover) แทนคอลัมน์ · ติ๊กออกได้ · โหมดค่าธรรมเนียมอยู่หัวการ์ด
  function calcPanel(c, C) {
    const nm = k => (C.products.find(p => p.sku === k) || { name: k }).name, sum = a => a.reduce((t, x) => t + (+x || 0), 0);
    const miss = (c.missing_costs || []).map(nm), ok = !miss.length, vatR = +c.vat || 0.07, vp = Math.round(vatR * 100), vf = (1 + vatR).toFixed(2);
    const price = +c.price || 0, rex = +c.revenue_ex || 0, lines = c.lines || [], cogs = sum(lines.map(l => l.cost)), fees = ly => (c.fees || []).filter(f => f.layer === ly);
    const how = f => (f.kind === 'pct' ? `${+(f.rate * 100).toFixed(2)}% × ${n2(price)} ÷ ${vf}` : `${n2(f.rate)} ÷ ${vf}`) + (f.src === 'actual' ? ' · ค่าจริง 30 วัน' : '');
    const EXC = new Set((c.exclude || []).map(String));
    const cb = (key, on) => `<input type="checkbox" class="pv-x" data-x="${esc(key)}"${on ? ' checked' : ''} title="ติ๊กออก = ไม่นับรายการนี้">`;
    const amt = (v, off) => off ? '<span class="pv-off">0.00</span>' : '−' + n2(v);   // ติ๊กออก = 0
    const grp = (id, title, v, off, key, hw) => `<tr class="grp${off ? ' off' : ''}" data-lad="${id}" title="${esc(hw || '')}"><td>${cb(key, !off)}<span class="car">▸</span>${title}</td><td class="num neg">${amt(v, off)}</td></tr>`;
    const sub = (id, label, v, off, key, hw, extra) => `<tr class="sub${off ? ' off' : ''}" data-ladp="${id}" hidden title="${esc(hw || '')}"><td>${key ? cb(key, !off) : '<span class="pv-sp"></span>'}${label}${extra || ''}</td><td class="num">${v == null ? '—' : amt(v, off)}</td></tr>`;
    // (2026-11-10) ค่าบริหาร / Marketing (ค่าที่บริษัทกำหนดเอง) ปรับ % ได้ในช่อง · คิดเฉพาะครั้งนี้ ไม่แก้ค่าที่ตั้งไว้
    const ovIn = f => f.layer === 'overhead' && f.kind === 'pct' ? `<span class="exd-ov${f.overridden ? ' on' : ''}"><input type="number" class="exd-pct" step="0.5" min="0" data-ov="${esc(f.item)}" data-base="${+(+(f.base_rate != null ? f.base_rate : f.rate) * 100).toFixed(2)}" value="${+(+f.rate * 100).toFixed(2)}" title="ปรับ % เอง (ตั้งไว้ ${+(+(f.base_rate != null ? f.base_rate : f.rate) * 100).toFixed(2)}%)">%</span>` : '';
    const feeG = (ly, title) => { const F = fees(ly); if (!F.length) return ''; const on = F.filter(f => !f.excluded);
      return grp(ly, title, sum(on.map(f => f.amount_ex)), !on.length, 'ly:' + ly, F.length === 1 ? how(F[0]) : '') + F.map(f => sub(ly, esc(f.item), f.amount_ex, f.excluded, f.item, how(f), ovIn(f))).join(''); };
    const fm = c.fee_actual_ok ? `<div class="pr-seg exd-fm" data-fm title="ค่าธรรมเนียมแพลตฟอร์ม: ค่าจริง = เฉลี่ยจากออเดอร์ที่ได้เงินแล้ว 30 วันล่าสุด · ค่าที่ตั้งไว้ = ตัวเลขในหน้าค่าธรรมเนียมช่องทาง"><button type="button" data-v="actual" aria-pressed="${c.fee_mode === 'actual'}">ค่าจริง 30 วัน</button><button type="button" data-v="set" aria-pressed="${c.fee_mode !== 'actual'}">ค่าที่ตั้งไว้</button></div>` : '';
    const OVL = (c.fees || []).filter(f => f.overridden).map(f => `${esc(f.item)} ${+(+f.rate * 100).toFixed(2)}%`);
    const exN = (EXC.size ? `<div class="exd-exn">ไม่นับ ${[...EXC].map(x => x === 'cogs' ? 'ต้นทุนสินค้า' : esc(x)).join(' · ')}<button type="button" data-xreset title="กลับไปนับทุกรายการ">✕</button></div>` : '')
      + (OVL.length ? `<div class="exd-exn">ปรับ ${OVL.join(' · ')}<button type="button" data-ovreset title="กลับไปใช้ค่าที่ตั้งไว้">✕</button></div>` : '');
    const neg = ok && +c.profit < 0;
    return `${!ok && price ? `<div class="pv-ban warn"><b>ยังคำนวณกำไรไม่ได้</b><span>ยังไม่มีต้นทุนของ ${miss.map(esc).join(', ')}</span></div>` : ''}
      <div class="exd-kpi">
        <div><span>ราคาขาย</span><b>${n2(price)}</b>${+c.rsp > 0 ? `<i>ปกติ ${n2(c.rsp)}</i>` : ''}</div>
        <div class="${neg ? 'neg' : 'pos'}"><span>กำไรสุทธิ / ออเดอร์</span><b>${ok ? n2(c.profit) : '—'}</b>${ok ? `<i>${pc(c.margin)} ของรายได้</i>` : ''}</div>
        <div><span>ราคาคุ้มทุน</span><b>${ok && c.breakeven_price != null ? n2(c.breakeven_price) : '—'}</b><i>รวม VAT</i></div>
      </div>
      <div class="exd-card"><div class="exd-ch"><b>การคำนวณ</b>${exN}${fm}</div>
        <table class="pv-lad exd-lad" data-no-sort data-no-page><tbody>
          <tr><td>ราคาขาย (รวม VAT)</td><td class="num">${n2(price)}</td></tr>
          <tr class="muted" title="${n2(price)} × ${vp} ÷ ${100 + vp}"><td>VAT ${vp}%</td><td class="num">−${n2(price - rex)}</td></tr>
          <tr class="tot"><td>รายได้ไม่รวม VAT</td><td class="num">${n2(rex)}</td></tr>
          ${grp('cost', 'ต้นทุนสินค้า + ของแถม', cogs, !!c.cogs_excluded, 'cogs')}${lines.map(l => sub('cost', `${l.kind === 'gift' ? 'แถม · ' : ''}${esc(l.name || nm(l.sku))} ×${l.qty}`, l.unit_cost == null ? null : l.cost, !!c.cogs_excluded, null, l.unit_cost == null ? 'ยังไม่มีต้นทุน' : `${n2(l.unit_cost)} × ${l.qty}`)).join('')}
          ${feeG('platform', 'ค่า Platform')}${feeG('selling', 'ค่าขาย')}${feeG('overhead', 'ค่าบริหาร / Marketing')}
          <tr class="tot big${neg ? ' negv' : ''}"><td>กำไรสุทธิ / ออเดอร์</td><td class="num">${ok ? n2(c.profit) : '—'}</td></tr>
        </tbody></table>
        <div class="exd-hint">ติ๊กออก = ไม่นับรายการนั้น · กด ▸ ดูรายการย่อย · ค่าบริหาร / Marketing แก้ % ในช่องได้ (คิดเฉพาะครั้งนี้) · ชี้แถวดูวิธีคิด</div></div>`;
  }
  // (2026-11-10 c) วาดใหม่หลังติ๊ก / คำนวณ: คงกลุ่มที่กางไว้ + ตำแหน่งเลื่อนเดิม (เดิมกลุ่มพับเอง และแผงเด้งขึ้นบนสุด)
  const scrollerOf = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if ((o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight) return e; } return document.scrollingElement; };
  const ladOpen = root => new Set([...root.querySelectorAll('.pv-lad tr.grp.open')].map(tr => tr.dataset.lad));
  const ladRestore = (root, open) => open.forEach(id => { const tr = root.querySelector(`.pv-lad tr.grp[data-lad="${id}"]`); if (!tr) return; tr.classList.add('open'); root.querySelectorAll(`.pv-lad tr[data-ladp="${id}"]`).forEach(x => { x.hidden = false; }); });
  const keepView = (root, render) => { const sc = scrollerOf(root), top = sc ? sc.scrollTop : 0, open = ladOpen(root); render(); ladRestore(root, open); if (sc) sc.scrollTop = top; };
  // (2026-11-10) ติ๊กรายการออก → fn(รายชื่อที่ไม่นับ) · ติ๊กที่หัวกลุ่ม = ทั้งกลุ่ม
  const bindOv = (root, fn) => {   // (2026-11-10) ช่อง % ค่าบริหาร / Marketing → fn({ชื่อ: อัตรา}) เฉพาะที่ต่างจากค่าที่ตั้งไว้
    const collect = () => { const o = {}; root.querySelectorAll('input.exd-pct').forEach(x => { const v = parseFloat(x.value); if (isFinite(v) && Math.abs(v - +x.dataset.base) > 1e-9) o[x.dataset.ov] = +(v / 100).toFixed(6); }); return o; };
    root.querySelectorAll('input.exd-pct').forEach(x => { x.addEventListener('click', e => e.stopPropagation()); x.addEventListener('change', () => fn(collect())); x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); x.blur(); } }); });
    const r = root.querySelector('[data-ovreset]'); if (r) r.onclick = () => fn({});
  };
  const bindEx = (root, fn) => {
    root.querySelectorAll('.pv-lad input.pv-x').forEach(cb => { cb.addEventListener('click', e => e.stopPropagation()); cb.addEventListener('change', () => {
      const k = cb.dataset.x;
      if (k.startsWith('ly:')) root.querySelectorAll(`.pv-lad tr[data-ladp="${k.slice(3)}"] input.pv-x`).forEach(x => { x.checked = cb.checked; });
      fn([...root.querySelectorAll('.pv-lad input.pv-x')].filter(x => !x.checked && !x.dataset.x.startsWith('ly:')).map(x => x.dataset.x)); }); });
    const r = root.querySelector('[data-xreset]'); if (r) r.onclick = () => fn([]);
  };
  const bindLad = root => root.querySelectorAll('.pv-lad tr.grp').forEach(tr => tr.onclick = () => { const open = !tr.classList.contains('open'); tr.classList.toggle('open', open); root.querySelectorAll(`.pv-lad tr[data-ladp="${tr.dataset.lad}"]`).forEach(x => { x.hidden = !open; }); });

  // ===================== (2026-10-28) จำลองโปร (ผู้บริหาร): ลองใส่ช่องทาง สินค้า ราคา ดูว่าคุ้มไหม · ไม่ส่งเป็นคำขอ =====================
  const SIM = { channel_id: '', items: [{ sku: '', qty: 1 }], gifts: [], price: '', fee_mode: null };
  function renderSim(box, C) {
    // (2026-11-10) หน้าตาใหม่แบบเดียวกับแผงรายละเอียดคำขอ: ฟอร์มเป็นการ์ด 3 ส่วน (ช่องทาง · สินค้า · ราคา) · ผลใช้ calcPanel (ตัวเลขหลัก + การคำนวณ ติ๊กออก / ปรับ % ได้) + Rank
    box.innerHTML = `<div class="sm2"><div class="sm2-f">
        <div class="exd-card"><div class="exd-ch"><b>จำลองโปร</b><span class="pr-i" data-tip="ลองใส่ช่องทาง สินค้า ของแถม และราคา แล้วกดคำนวณ · ไม่ส่งเป็นคำขอ ไม่บันทึกอะไร">ⓘ</span></div>
          <label class="sm2-l">ช่องทาง</label><select class="pr-in" id="smCh"><option value="">เลือกช่องทาง</option>${C.channels.map(c => `<option value="${c.id}"${+SIM.channel_id === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div class="exd-card"><label class="sm2-l">สินค้าใน 1 ออเดอร์ <small>ชื่อสินค้า · จำนวนชิ้น</small></label><div id="smItems">${rowsHtml('items', SIM.items, C)}</div><button type="button" class="pr-add" data-smadd="items">＋ เพิ่มสินค้า</button>
          <label class="sm2-l" style="margin-top:14px;">ของแถม <small>ถ้ามี</small></label><div id="smGifts">${rowsHtml('gifts', SIM.gifts, C)}</div><button type="button" class="pr-add" data-smadd="gifts">＋ เพิ่มของแถม</button></div>
        <div class="exd-card sm2-p"><label class="sm2-l" for="smPrice">ราคาขายต่อออเดอร์ <small>รวม VAT หลังส่วนลด</small></label><input class="pr-in" type="number" id="smPrice" min="0" step="0.01" value="${esc(SIM.price)}" placeholder="0.00">
          <button type="button" class="pr-btn" id="smGo">คำนวณ</button></div></div>
      <div id="smOut" class="sm2-out"><div class="exd-card sm2-empty">ใส่ช่องทาง สินค้า และราคา แล้วกด คำนวณ</div></div></div>`;
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
      if (SIM.fee_mode) p.fee_mode = SIM.fee_mode;
      if (SIM.exclude && SIM.exclude.length) p.exclude = SIM.exclude;
      if (SIM.override && Object.keys(SIM.override).length) p.override = SIM.override;
      if (!p.channel_id || !p.price || !p.items.length) { out.innerHTML = '<div class="exd-card sm2-empty">ใส่ช่องทาง สินค้า และราคาให้ครบก่อน</div>'; return; }
      e.target.disabled = true; e.target.textContent = 'กำลังคำนวณ…';
      try { const [c, k] = await Promise.all([rpc('promo_calc', { p }), rpc('promo_rank', { p }).catch(() => null)]);
        keepView(out, () => { out.innerHTML = calcPanel(c, C) + (k ? `<div class="sm2-rk">${rankCard(k)}</div>` : ''); }); bindLad(out); bindFm(out, v => { SIM.fee_mode = v; document.getElementById('smGo').click(); });
        bindEx(out, list => { SIM.exclude = list; document.getElementById('smGo').click(); });
        bindOv(out, o => { SIM.override = o; document.getElementById('smGo').click(); }); }
      catch (err) { out.innerHTML = `<div class="exd-card sm2-empty">คำนวณไม่สำเร็จ: ${esc(err.message)}</div>`; }
      e.target.disabled = false; e.target.textContent = 'คำนวณ';
    };
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'smPrice') { e.preventDefault(); document.getElementById('smGo').click(); } });
  }

  async function renderExec() {
    const el = document.getElementById('page-exec'); if (!el) return;
    el.innerHTML = '<div class="pr-empty">กำลังโหลด…</div>';
    try { EX.list = await rpc('promo_list', { p_scope: 'all' }); await cat(); } catch (e) { el.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    const L = EX.list, cnt = s => L.filter(r => r.status === s).length;
    // (2026-11-10) ปุ่มสถานะ + จำลองโปร ย้ายไปแถบบน (ข้างตัวกรองแบบหน้าอื่น) · ในหน้าเหลือแต่ตาราง
    let top = document.getElementById('exTopCtl');
    if (!top) { const f = document.querySelector('.topbar .filters'); top = document.createElement('div'); top.id = 'exTopCtl'; top.className = 'ex-topctl'; if (f) f.prepend(top); }
    top.style.display = (typeof currentPage === 'undefined' || currentPage === 'exec') ? '' : 'none';   // (2026-11-10) โหลดเสร็จช้ากว่าการสลับหน้า → ไม่โชว์บนหน้าอื่น
    top.innerHTML = `<div class="pr-seg ex-tabs" id="exSeg">${[['pending', 'รออนุมัติ', cnt('pending')], ['approved', 'อนุมัติแล้ว', cnt('approved')], ['rejected', 'ไม่อนุมัติ', cnt('rejected')], ['all', 'ทั้งหมด', L.filter(r => r.status !== 'cancelled').length]].map(([k, t, n]) => `<button type="button" data-f="${k}" aria-pressed="${EX.filter === k}">${t}${n == null ? '' : `<b>${n}</b>`}</button>`).join('')}</div>
      <button type="button" class="pr-btn ghost pv-simbtn" id="exSim" aria-pressed="${EX.filter === 'sim'}">จำลองโปร</button>`;
    el.innerHTML = `<div class="pr-card" style="padding:4px 0 0;"><div id="exList" style="overflow-x:auto;"></div></div>`;
    const simBtn = top.querySelector('#exSim');
    top.querySelector('#exSeg').onclick = e => { const b = e.target.closest('button[data-f]'); if (!b) return; EX.filter = b.dataset.f; top.querySelectorAll('#exSeg button').forEach(x => x.setAttribute('aria-pressed', x === b)); simBtn.setAttribute('aria-pressed', 'false'); listExec(); };
    simBtn.onclick = () => { EX.filter = 'sim'; top.querySelectorAll('#exSeg button').forEach(x => x.setAttribute('aria-pressed', 'false')); simBtn.setAttribute('aria-pressed', 'true'); renderSim(document.getElementById('exList'), CAT); };
    EX.filter === 'sim' ? renderSim(document.getElementById('exList'), CAT) : listExec();
  }
  // (2026-11-10) รายการคำขอแบบใหม่: จัดกลุ่มตามชื่อโปร + ช่องทาง (หัวกลุ่มบอกจำนวน / ขาดทุนกี่รายการ · กดย่อได้) · มีคอลัมน์สินค้าในโปร (ของแถมติดป้าย)
  //   กำไรติดลบสีแดง · % ใต้ตัวเลข = กำไรเทียบต้นทุน · ขอโดย + วันที่ส่งอยู่ช่องเดียว
  const EXCOL = new Set();
  function listExec() {
    const box = document.getElementById('exList'); if (!box) return;
    const C = CAT || { products: [] }, pnm = k => (C.products.find(p => p.sku === k) || { name: k }).name;
    const L = EX.list.filter(r => EX.filter === 'all' ? r.status !== 'cancelled' : r.status === EX.filter);
    if (!L.length) { box.innerHTML = '<div class="pr-empty">ไม่มีรายการ</div>'; return; }
    const prod = r => (r.items || []).map(x => `<span class="ex-pd">${esc(pnm(x.sku))}${+x.qty > 1 ? ` <b>×${+x.qty}</b>` : ''}</span>`).join('')
      + (r.gifts || []).map(x => `<span class="ex-pd gift"><i>แถม</i>${esc(pnm(x.sku))}${+x.qty > 1 ? ` <b>×${+x.qty}</b>` : ''}</span>`).join('');
    const prodTxt = r => [...(r.items || []).map(x => pnm(x.sku) + (+x.qty > 1 ? ' ×' + x.qty : '')), ...(r.gifts || []).map(x => 'แถม ' + pnm(x.sku) + (+x.qty > 1 ? ' ×' + x.qty : ''))].join(' · ');
    const dr = r => !r.start_date ? '—' : r.end_date && r.end_date !== r.start_date ? `${dTh(r.start_date)} – ${dTh(r.end_date)}` : dTh(r.start_date);
    const groups = []; const gi = {};
    L.forEach(r => { const k = (r.title || '') + '|' + (r.channel || ''); if (gi[k] == null) { gi[k] = groups.length; groups.push({ k, rows: [] }); } groups[gi[k]].rows.push(r); });
    const pcs = v => v == null || !isFinite(+v) ? '—' : `<span class="${+v < 0 ? 'ex-n' : ''}">${(+v * 100).toFixed(1)}%</span>`;
    const rowHtml = r => { const c = r.calc || {}, s = ST[r.status] || [r.status, ''], neg = +c.profit < 0, disc = +c.discount_vs_rsp;
      return `<tr class="click ex-r" data-id="${r.id}">
        <td class="ex-c1"><div class="ex-pds" title="${esc(prodTxt(r))}">${prod(r) || '<span class="ex-pd">—</span>'}</div></td>
        <td class="tn"><b>${n2(r.price)}</b></td>
        <td class="tn ex-m">${+c.rsp > 0 ? n2(c.rsp) : '—'}</td>
        <td class="tn ex-m">${+c.rsp > 0 && disc ? (disc > 0 ? '−' : '+') + (Math.abs(disc) * 100).toFixed(1) + '%' : '—'}</td>
        <td class="tn"><span class="ex-pf${neg ? ' neg' : ''}">${c.profit == null ? '—' : n2(c.profit)}</span></td>
        <td class="tn">${pcs(c.margin)}</td>
        <td class="tn">${pcs(c.markup)}</td>
        <td class="ctr">${rkPill(r.rank)}</td><td class="ctr"><span class="pr-pill ${s[1]}">${s[0]}</span></td>
        <td>${esc(r.requested_name || '—')}</td><td class="ex-m">${dTh(r.requested_at)}</td></tr>`; };
    const body = groups.map(g => {
      const r0 = g.rows[0], nNeg = g.rows.filter(r => r.calc && +r.calc.profit < 0).length, col = EXCOL.has(g.k);
      const head = `<tr class="ex-g" data-g="${esc(g.k)}"><td colspan="11"><span class="ex-car">${col ? '▸' : '▾'}</span><b>${esc(r0.title)}</b><span class="ex-gm">${esc(r0.channel || '')}${r0.start_date ? ' · ' + dr(r0) : ''} · ${g.rows.length} รายการ${nNeg ? ` · <span class="ex-neg">ขาดทุน ${nNeg}</span>` : ''}</span></td></tr>`;
      return head + (col ? '' : g.rows.map(rowHtml).join(''));
    }).join('');
    box.innerHTML = `<table class="pr-tb pr-ex2" data-no-sort data-no-page>
        <colgroup><col><col style="width:96px"><col style="width:96px"><col style="width:78px"><col style="width:110px"><col style="width:96px"><col style="width:96px"><col style="width:90px"><col style="width:104px"><col style="width:96px"><col style="width:96px"></colgroup>
        <thead><tr><th class="ex-c1">สินค้าในโปร</th><th class="tn">ราคา</th><th class="tn">ราคาปกติ</th><th class="tn">ส่วนลด</th><th class="tn">กำไร / ออเดอร์</th>
          <th class="tn">% ของรายได้ <span class="pr-i" data-tip="กำไรสุทธิ ÷ รายได้ไม่รวม VAT">ⓘ</span></th><th class="tn">% ของต้นทุน <span class="pr-i" data-tip="กำไรสุทธิ ÷ ต้นทุนทั้งหมด (สินค้า + ค่า Platform + ค่าขาย + ค่าบริหาร / Marketing)">ⓘ</span></th>
          <th class="ctr">Rank</th><th class="ctr">สถานะ</th><th>ขอโดย</th><th>ส่งเมื่อ</th></tr></thead><tbody>${body}</tbody></table>`;
    box.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => openReq(+tr.dataset.id));
    box.querySelectorAll('tr.ex-g').forEach(tr => tr.onclick = () => { const k = tr.dataset.g; EXCOL.has(k) ? EXCOL.delete(k) : EXCOL.add(k); listExec(); });
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
    const feeRows = ly => fees(ly).map(f => [`${esc(f.item)} <span class="xt">${f.kind === 'pct' ? +(f.rate * 100).toFixed(2) + '%' : n2(f.rate) + ' ฿'}${f.src === 'actual' ? ' · ค่าจริง' : ''}</span>`, f.amount_ex]);
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
    const S = { price: r.price, items: JSON.parse(JSON.stringify(r.items || [])), gifts: JSON.parse(JSON.stringify(r.gifts || [])), rank: r.rank, note: null, fee_mode: null, exclude: [], override: {} };
    const body = () => document.getElementById('trBody');
    let firstDraw = true;
    const draw = (c) => { if (firstDraw) { firstDraw = false; return drawInner(c); } keepView(body(), () => drawInner(c)); };
    const drawInner = (c) => {
      const st = ST[r.status] || [r.status, ''], mm = pc(+c.min_markup, 0), k = S.rank;
      const changed = +S.price !== +r.price || JSON.stringify(S.gifts) !== JSON.stringify(r.gifts || []) || JSON.stringify(S.items) !== JSON.stringify(r.items || []) || S.exclude.length > 0 || Object.keys(S.override).length > 0;
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
      // (2026-11-10) แผงรายละเอียดแบบใหม่: หัว (ชื่อ · สถานะ · Rank · ช่องทาง / วันที่ / ผู้ขอ) → สินค้าในโปร (เปิดตลอด) → ลองราคา → ตัวเลขหลัก + การคำนวณ (ติ๊กออกได้) → Feedback + ปุ่ม (ติดล่างแผง)
      const itRows = [...S.items.map((g, i) => ({ g, i, kind: 'item' })), ...S.gifts.map((g, i) => ({ g, i, kind: 'gift' }))].map(({ g, i, kind }) => { const l = cl[kind + '|' + g.sku];
        return `<tr><td>${kind === 'gift' ? '<span class="exd-gift">แถม</span>' : ''}${esc(pnm(g.sku))}</td><td class="q"><input class="pr-in" type="number" min="0" step="1" ${kind === 'gift' ? 'data-gi' : 'data-ii'}="${i}" value="${g.qty}"></td><td class="num" title="${l && l.unit_cost != null ? 'ต้นทุน ' + n2(l.unit_cost) + ' × ' + g.qty + ' ชิ้น' : ''}">${l && l.unit_cost != null ? n2(l.cost) : '<span class="miss">ไม่มีต้นทุน</span>'}</td></tr>`; }).join('');
      const rkTxt = showRank ? `Rank 1 ${n0(k.sum1)} · Rank 2 ${n0(k.sum2)} · Rank 3 ${n0(k.sum3)}` : '';
      body().innerHTML = `
        <div class="exd-card exd-hd"><div class="exd-t">${esc(r.title)}<span class="pr-pill ${st[1]}">${st[0]}</span><span title="${esc(rkTxt || rkTip)}">${rkPill(k)}</span></div>
          <div class="exd-m">${esc(r.channel || '')}${r.start_date ? ` · ${dTh(r.start_date)}${r.end_date ? ' – ' + dTh(r.end_date) : ''}` : ''} · ${esc(r.requested_name || '')}</div>
          ${r.note ? `<div class="exd-note">${esc(r.note)}</div>` : ''}</div>
        <div class="exd-card exd-pc"><div class="exd-pl"><div class="exd-ch"><b>สินค้าในโปร</b></div>
            <table class="exd-it" data-no-sort data-no-page><tbody>${itRows}<tr class="sum"><td>ต้นทุนรวม</td><td></td><td class="num">${n2(costTot)}</td></tr></tbody></table></div>
          <div class="exd-pr"><label for="exPrice">ราคาขาย (รวม VAT)</label><input class="pr-in" type="number" step="0.01" id="exPrice" value="${S.price}">
            <button type="button" class="pr-btn" id="exCalc">คำนวณ</button>${changed ? '<button type="button" class="pr-btn ghost" id="exReset">คืนค่าเดิม</button><span>กำลังลองปรับ · ยังไม่แก้คำขอ</span>' : '<span>ลองเปลี่ยนราคา / จำนวน แล้วกดคำนวณ</span>'}</div></div>
        ${calcPanel(c, C)}
        <section class="exd-act"><textarea class="pr-in" id="exNote" rows="2" placeholder="Feedback ถึงทีม เช่น อนุมัติถ้าขึ้นราคาเป็น ${c.target_price ? n0(Math.ceil(c.target_price)) : '…'}">${esc(S.note != null ? S.note : (r.decision_note || ''))}</textarea>
          <div class="exd-btns">${r.status === 'pending' ? '<button class="pr-btn good" data-dec="approved">✓ อนุมัติ</button><button class="pr-btn bad" data-dec="rejected">✕ ไม่อนุมัติ</button>' : '<button class="pr-btn ghost" data-dec="pending">กลับเป็นรออนุมัติ</button>'}</div></section>`;
      // ขั้นบันไดกำไร: กดแถวกลุ่มเพื่อดูรายการย่อย
      bindLad(body());
      // ลองปรับ: คำนวณเมื่อกด "คำนวณ" หรือ Enter
      const recalc = async () => {
        S.note = document.getElementById('exNote').value;
        S.price = +document.getElementById('exPrice').value || 0;
        body().querySelectorAll('[data-gi]').forEach(x => { S.gifts[+x.dataset.gi].qty = +x.value || 0; });
        body().querySelectorAll('[data-ii]').forEach(x => { S.items[+x.dataset.ii].qty = +x.value || 0; });
        const btn = document.getElementById('exCalc'); if (btn) { btn.disabled = true; btn.textContent = 'กำลังคำนวณ…'; }
        try { const pp = { channel_id: r.channel_id, price: S.price, orders: 0, items: S.items, gifts: S.gifts }; if (S.fee_mode) pp.fee_mode = S.fee_mode; if (S.exclude.length) pp.exclude = S.exclude; if (Object.keys(S.override).length) pp.override = S.override;
          const [c2, k2] = await Promise.all([rpc('promo_calc', { p: pp }), rpc('promo_rank', { p: pp }).catch(() => null)]); S.rank = k2; draw(c2); }
        catch (e) { toast('คำนวณไม่สำเร็จ: ' + e.message); if (btn) { btn.disabled = false; btn.textContent = 'คำนวณ'; } }
      };
      document.getElementById('exCalc').onclick = recalc;
      bindFm(body(), v => { S.fee_mode = v; recalc(); });
      bindEx(body(), list => { S.exclude = list; recalc(); });
      bindOv(body(), o => { S.override = o; recalc(); });
      body().querySelectorAll('#exPrice,[data-gi],[data-ii]').forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); recalc(); } }));
      const rs = document.getElementById('exReset');
      if (rs) rs.onclick = () => { S.note = document.getElementById('exNote').value; S.price = r.price; S.exclude = []; S.override = {}; S.items = JSON.parse(JSON.stringify(r.items || [])); S.gifts = JSON.parse(JSON.stringify(r.gifts || [])); document.getElementById('exPrice').value = r.price; body().querySelectorAll('[data-ii]').forEach(x => { x.value = S.items[+x.dataset.ii].qty; }); body().querySelectorAll('[data-gi]').forEach(x => { x.value = S.gifts[+x.dataset.gi].qty; }); recalc(); };
      body().querySelectorAll('[data-dec]').forEach(b => b.onclick = async () => {
        const d = b.dataset.dec; if (d !== 'pending' && !(await uiConfirm(d === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ', { text: `${r.title} · ${r.channel || ''} · ${n0(r.price)}`, ok: d === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ', tone: d === 'approved' ? 'good' : 'bad', icon: d === 'approved' ? '✓' : '✕' }))) return;
        const exTxt = [S.exclude.length ? `คิดแบบไม่นับ ${S.exclude.map(x => x === 'cogs' ? 'ต้นทุนสินค้า' : x).join(', ')}` : '', Object.keys(S.override).length ? `คิด ${Object.entries(S.override).map(([k, v]) => k + ' ' + +(v * 100).toFixed(2) + '%').join(', ')}` : ''].filter(Boolean).join(' · ');   // (2026-11-10) ติ๊กออกตอนตัดสินใจ → บันทึกไว้ใน Feedback ให้ทีมเห็น
        const note0 = document.getElementById('exNote').value.trim(), noteF = exTxt && !note0.includes(exTxt) ? (note0 ? note0 + ' · ' : '') + exTxt : note0;
        try { await rpc('promo_decide', { p_id: r.id, p_status: d, p_note: noteF }); toast('บันทึกแล้ว'); trClose(); renderExec(); } catch (e) { uiAlert('บันทึกไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
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

  // ===================== (2026-10-30) หน้า ค่าธรรมเนียมช่องทาง แบบใหม่ =====================
  // แท็บตามแพลตฟอร์ม → เลือกช่องทางย่อย → ตาราง "ค่าจริง vs ตั้งไว้" + สรุป 3 บรรทัด
  // ค่าจริง: Shopee / TikTok = ออเดอร์ที่ได้เงินแล้ว 30 วันล่าสุด (fee_actuals_30d) · ช่องทางอื่น = งบบัญชี 3 เดือนล่าสุด (fee_actuals)
  // แก้ "ตั้งไว้" ได้ในตาราง (บันทึกเมื่อออกจากช่อง) · เพิ่ม / ลบ รายการหรือช่องทาง ใช้ "ตารางแบบเดิม"
  let FEE_MODE = 'new', FE2 = { tab: null, ch: null }, FA30 = null;
  const fe2fmt = v => Math.round(+v || 0).toLocaleString('th-TH');
  async function renderFee() { return renderFeeNew(); }   // (2026-11-10) เลิกใช้ตารางแบบเดิมแล้ว
  const FE2_TABS = [['Shopee', /shopee/i], ['TikTok', /tiktok/i], ['Lazada', /lazada/i], ['Telesale', /telesale/i], ['Facebook', /facebook|line/i], ['ตัวแทน', /ตัวแทน/], ['Modern Trade', /^mt|watsons|eve|konvy|cj|thaimart|modern/i]];
  const fe2Tab = c => (FE2_TABS.find(([, re]) => re.test(c.name)) || FE2_TABS.find(([, re]) => re.test(c.sys_channel || '')) || ['อื่น ๆ'])[0];   // (2026-11-10) จับจากชื่อก่อน (Telesale ใช้ระบบ Facebook แต่แยกแท็บ)
  // (2026-11-02) การจับคู่รายการกับค่าธรรมเนียมจริงย้ายไปฐานข้อมูล (fee_rates) ใช้ชุดเดียวกับสูตรคิดโปร
  const fe2Co = it => { const k = String(it.actual_key || '').toLowerCase(), n = String(it.name || ''); return k === 'ads' || /ค่า ads/i.test(n) ? 'ads' : k === 'marketing' || /^marketing$/i.test(n) ? 'marketing' : k === 'admin' || /ค่าบริหาร/.test(n) ? 'admin' : null; };
  async function renderFeeNew() {
    const el = document.getElementById('page-execfee'); if (!el) return;
    if (!FT) el.innerHTML = '<div class="pr-empty">กำลังโหลด…</div>';
    let FR = null;
    try { [FT, FA, FA30, FR] = await Promise.all([rpc('fee_table'), rpc('fee_actuals').catch(() => null), rpc('fee_actuals_30d').catch(() => null), rpc('fee_rates_all').catch(() => null)]); }
    catch (e) { el.innerHTML = `<div class="pr-empty">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (!FT) { el.innerHTML = '<div class="pr-empty">ยังไม่มีสิทธิ์ใช้หน้านี้</div>'; return; }
    const A = FA || {}, ms = A.months || [];
    const G30 = {}; ((FA30 && FA30.groups) || []).forEach(g => { G30[g.grp] = g; });
    const IT = {}; FT.items.forEach(it => { IT[it.id] = it; });
    const ctx = { AC: A.channels || {}, CO: A.company || {}, G30, IT, RT: (FR && FR.channels) || {}, accRange: ms.length ? `${mLbl(ms[0])} – ${mLbl(ms[ms.length - 1])}` : '3 เดือนล่าสุด' };
    const chs = FT.channels.filter(c => c.active);
    const tabs = FE2_TABS.map(x => x[0]).filter(tb => chs.some(c => fe2Tab(c) === tb));
    if (!FE2.tab || !tabs.includes(FE2.tab)) FE2.tab = tabs[0];
    const tabChs = chs.filter(c => fe2Tab(c) === FE2.tab);
    const canAll = FE2.tab === 'TikTok' && tabChs.length > 1;
    if (!(canAll && FE2.ch === 'all') && !tabChs.some(c => c.id === FE2.ch)) FE2.ch = canAll ? 'all' : (tabChs[0] || {}).id;
    if (!tabChs.length) { el.innerHTML = '<div class="pr-empty">ยังไม่มีช่องทาง</div>'; return; }
    const rng = FA30 && FA30.from ? `${dTh(FA30.from)} – ${dTh(FA30.to)}` : '30 วันล่าสุด';
    const upd = FA30 && FA30.refreshed_at ? new Date(FA30.refreshed_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';
    const srcTip = `คำนวณใหม่ทุกวันเวลา 07:40 จากออเดอร์ที่แพลตฟอร์มโอนเงินแล้ว (หักค่าธรรมเนียมจริงแล้ว)${upd ? ' · คำนวณล่าสุด ' + upd : ''}`;
    const subSeg = tabChs.length > 1 ? `<div class="pr-seg fe2-sub">${canAll ? `<button type="button" data-ch="all" aria-pressed="${FE2.ch === 'all'}">เทียบทุกประเภท</button>` : ''}${tabChs.map(x => `<button type="button" data-ch="${x.id}" aria-pressed="${x.id === FE2.ch}">${esc(x.name)}</button>`).join('')}</div>` : '';
    // (2026-11-10) แท็บช่องทาง + ร้าน / ประเภท อยู่แถบบน (แบบหน้าอื่น) · ในหน้าเหลือตัวเลข + ตาราง · ที่มาของค่าจริงอยู่หัวตาราง
    let tb0 = document.getElementById('feTopCtl');
    if (!tb0) { const f = document.querySelector('.topbar .filters'); tb0 = document.createElement('div'); tb0.id = 'feTopCtl'; tb0.className = 'ex-topctl'; if (f) f.prepend(tb0); }
    tb0.style.display = (typeof currentPage === 'undefined' || currentPage === 'execfee') ? '' : 'none';
    // (2026-11-10 b) ตัวเลือกช่องทางแบบ dropdown เดียว (จัดกลุ่มตามแพลตฟอร์ม) แทนแท็บ + ปุ่มร้านที่โผล่ทีหลังแล้วแถบบนเด้ง
    const optOf = tb => { const L = chs.filter(c => fe2Tab(c) === tb), all = tb === 'TikTok' && L.length > 1;
      return `<optgroup label="${esc(tb)}">${all ? `<option value="all:${esc(tb)}"${FE2.tab === tb && FE2.ch === 'all' ? ' selected' : ''}>${esc(tb)} · เทียบทุกประเภท</option>` : ''}${L.map(c => `<option value="${c.id}"${FE2.tab === tb && FE2.ch === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</optgroup>`; };
    tb0.innerHTML = `<div class="filter-group fe2-pick"><span class="filter-label">ช่องทาง</span><select id="feChSel">${tabs.map(optOf).join('')}</select></div>`;
    const top = () => '';
    const bindNav = () => {
      const sel = tb0.querySelector('#feChSel');
      if (sel) sel.onchange = () => { const v = sel.value; if (v.startsWith('all:')) { FE2.tab = v.slice(4); FE2.ch = 'all'; } else { const c0 = chs.find(c => c.id === +v); FE2.tab = fe2Tab(c0); FE2.ch = +v; } renderFeeNew(); };
      el.querySelectorAll('[data-goch]').forEach(b => b.onclick = () => { FE2.ch = +b.dataset.goch; renderFeeNew(); });
    };
    const pct = v => v == null ? '<span class="fe2-z">—</span>' : `${(+v).toFixed(2)}%`;
    const perTxt = v => v ? ` + ${n2(v)} บาท` : '';

    // ---------- มุมมองเทียบทุกประเภท (TikTok) ----------
    if (FE2.ch === 'all') {
      const cols = tabChs.map(c => ({ c, ...fe2Lines(c, ctx) }));
      const short = c => c.name.replace(/^TikTok\s*/i, '').replace(/^\((.*)\)$/, '$1');
      const keyOf = L => L.item_id != null ? 'i' + L.item_id : 'x' + L.key;
      const rowMap = new Map();
      cols.forEach(col => col.rows.forEach(x => { const k = keyOf(x.L); if (!rowMap.has(k)) rowMap.set(k, { k, L: x.L, ord: [x.L.company ? 1 : 0, x.L.extra ? 1 : 0, +x.L.sort || 0, x.L.name] }); }));
      const rowsAll = [...rowMap.values()].sort((a, b) => a.ord[0] - b.ord[0] || a.ord[1] - b.ord[1] || a.ord[2] - b.ord[2] || String(a.ord[3]).localeCompare(String(b.ord[3]), 'th'));
      const grpShare = c => { const o = tabChs.filter(x => x.id !== c.id && x.actual_grp && x.actual_grp === c.actual_grp); return o.length ? `ค่าจริงชุดเดียวกับ ${o.map(short).join(', ')} เพราะ TikTok ไม่แยกว่าใครเป็นคน LIVE` : ''; };
      const cell = (col, r) => {
        const x = col.rows.find(y => keyOf(y.L) === r.k); if (!x) return '<td><span class="fe2-z">—</span></td>';
        const L = x.L, fmt = v => x.isPct ? `${(+v * 100).toFixed(2)}%` : `${n2(v)} บาท`;
        if (L.merged) return `<td><div class="fe2-cv fe2-z">รวมใน Commission</div><div class="fe2-cs">ตั้งไว้ ${fmt(L.set)}</div></td>`;
        if (L.company) return `<td><div class="fe2-cv">${fmt(L.set)}</div><div class="fe2-cs">ตั้งไว้</div></td>`;
        if (L.can) return `<td><div class="fe2-cv">${fmt(L.act)}</div><div class="fe2-cs">${L.extra ? 'ไม่ได้ตั้งไว้' : 'ตั้งไว้ ' + fmt(L.set)}</div></td>`;
        return `<td><div class="fe2-cv">${fmt(L.set)}</div><div class="fe2-cs">ตั้งไว้ · ไม่มีค่าจริง</div></td>`;
      };
      const body = (title, list) => list.length ? `<tr class="fe2-g"><td colspan="${cols.length + 1}">${title}</td></tr>` + list.map(r => `<tr><td class="l">${esc(r.L.name)}${r.L.extra ? ' <span class="fe2-z">· ไม่ได้ตั้งไว้</span>' : ''}</td>${cols.map(col => cell(col, r)).join('')}</tr>`).join('') : '';
      const sumR = (l, f, first) => `<tr class="fe2-s${first ? ' first' : ''}"><td class="l">${l}</td>${cols.map(col => `<td>${f(col.S)}</td>`).join('')}</tr>`;
      const tot = S => S.useCh + S.useCo, two = (a, b) => `<div class="fe2-cv">${a}</div><div class="fe2-cs">${b}</div>`;
      el.innerHTML = `
        <div class="fe2-cards" style="grid-template-columns:repeat(${cols.length},minmax(0,1fr))">${cols.map(col => `<div><div class="l">${esc(short(col.c))} · สูตรคิดโปรหัก</div><div class="v">${tot(col.S).toFixed(2)}%${perTxt(col.S.pUse)}</div><div class="s">TikTok หักจริง ${col.S.useCh.toFixed(2)}% · บริษัทตั้งไว้ ${col.S.useCo.toFixed(2)}%</div></div>`).join('')}</div>
        <div class="fe2-card"><div class="fe2-ch"><b>เทียบทุกประเภท</b><span class="fe2-src">ค่าจริงจากออเดอร์ที่ได้เงินแล้ว ${esc(rng)} ${info(srcTip + '\nตัวเลขใหญ่ = ค่าจริง (ค่าใช้จ่ายบริษัท = ค่าที่ตั้งไว้) · ตัวเล็ก = ค่าที่ตั้งไว้')}</span></div><div class="fe2-wide"><table class="fe2-t fe2-cmp" data-no-sort data-no-page><thead><tr><th class="l">รายการ</th>${cols.map(col => { const g = col.g, sh = grpShare(col.c);
            return `<th><button type="button" class="fe2-colh" data-goch="${col.c.id}" data-tip="กดเพื่อดูรายละเอียด และแก้ค่าของประเภทนี้"><b>${esc(short(col.c))}</b><small>${g ? `${fe2fmt(g.orders)} ออเดอร์ · เฉลี่ย ${n2(g.aov)} บาท` : 'ยังไม่มีค่าจริง'}</small></button>${sh ? ' ' + info(sh) : ''}</th>`; }).join('')}</tr></thead><tbody>
          ${body('ค่าธรรมเนียมจากแพลตฟอร์ม · TikTok หักจริง', rowsAll.filter(r => !r.L.company))}
          ${body('ค่าใช้จ่ายของบริษัท · ตั้งเอง', rowsAll.filter(r => r.L.company))}
          ${sumR('สรุป · ค่าธรรมเนียมช่องทาง', S => two(`${S.useCh.toFixed(2)}%${perTxt(S.pUse)}`, `ตั้งไว้ ${S.setCh.toFixed(2)}%${perTxt(S.pSet)}`), true)}
          ${sumR('สรุป · ค่าใช้จ่ายบริษัท (ตั้งไว้)', S => `${S.useCo.toFixed(2)}%`)}
          ${sumR('สูตรคิดโปรหัก (ก่อนต้นทุนสินค้า) ' + info('ค่าธรรมเนียมช่องทาง + ค่าใช้จ่ายบริษัท\nตัวเลขใหญ่ = ตอนคิดโปรเลือก "ค่าจริง" · ตัวเล็ก = เลือก "ค่าที่ตั้งไว้"\nเลือกได้ตอนจำลองโปร หรือดูคำขอโปร'), S => two(`${tot(S).toFixed(2)}%${perTxt(S.pUse)}`, `ค่าที่ตั้งไว้ ${(S.setCh + S.setCo).toFixed(2)}%${perTxt(S.pSet)}`))}
          ${sumR('เหลือไว้จ่ายต้นทุน + กำไร', S => two(`${(100 - tot(S)).toFixed(2)}%`, `ค่าที่ตั้งไว้ ${(100 - S.setCh - S.setCo).toFixed(2)}%`))}
        </tbody></table></div>
        <div class="fe2-note">กดชื่อประเภทบนหัวตาราง เพื่อดูรายละเอียดและแก้ค่าที่ตั้งไว้ของประเภทนั้น</div></div>`;
      bindNav(); return;
    }

    // ---------- มุมมองรายช่องทาง ----------
    const c = tabChs.find(x => x.id === FE2.ch);
    const { rows, S, g } = fe2Lines(c, ctx);
    const src = g ? `ค่าจริงจากออเดอร์ที่ได้เงินแล้ว ${esc(rng)} ${info(srcTip)} · ${fe2fmt(g.orders)} ออเดอร์ · ยอดขายสินค้าเฉลี่ย ${n2(g.aov)} บาท / ออเดอร์` : `ไม่มี API · ค่าจริงจากงบบัญชี ${esc(ctx.accRange)}`;
    const dif = (a, s) => a == null || s == null ? '<span class="fe2-z">—</span>' : Math.abs(a - s) < 0.05 ? `<span class="fe2-z">${a - s >= 0 ? '+' : ''}${(a - s).toFixed(2)}</span>` : `<span class="${a > s ? 'fe2-up' : 'fe2-dn'}">${a > s ? '+' : ''}${(a - s).toFixed(2)}</span>`;
    const rowHtml = x => {
      const L = x.L, act = x.act;
      const input = L.extra ? '<span class="fe2-z">—</span>' : `<input class="fe2-in" type="number" step="any" data-item="${L.item_id}" data-kind="${L.kind}" value="${x.isPct ? +(+L.set * 100).toFixed(4) : +L.set}"><span class="fe2-u">${x.isPct ? '%' : 'บาท'}</span>`;
      const actTxt = act === 'merged' ? '<span class="fe2-z">รวมใน Platform Commission</span>' : x.isPct ? pct(act) + (x.tip && act != null ? ` <span class="pr-i" data-tip="${esc(x.tip)}">ⓘ</span>` : '') : act == null ? '<span class="fe2-z">—</span>' : `${n2(act)} บาท`;
      // (2026-11-10) รายการค่าธรรมเนียมช่องทาง: ✎ เปลี่ยนชื่อ · ✕ เอาออกจากช่องทางนี้ (ค่าใช้จ่ายบริษัทลบไม่ได้)
      const act2 = !L.company && !L.extra && L.item_id != null ? `<span class="fe2-act"><button type="button" data-ren="${L.item_id}" title="เปลี่ยนชื่อรายการ">✎</button><button type="button" data-rm="${L.item_id}" title="เอาออกจากช่องทางนี้">✕</button></span>` : '';
      return `<tr><td class="l">${esc(L.name)}${L.extra ? ' <span class="fe2-z">· ไม่ได้ตั้งไว้</span>' : ''}${act2}</td><td>${actTxt}</td><td>${input}</td><td>${x.isPct && act !== 'merged' ? dif(act, x.setPct) : '<span class="fe2-z">—</span>'}</td></tr>`;
    };
    // (2026-11-10 b) รายการเหมือนกันทุกร้านในแพลตฟอร์มเดียวกัน: รายการที่ร้านอื่นมีแต่ร้านนี้ยังไม่ได้ตั้ง → ขึ้นเป็นช่องว่างให้กรอก (พิมพ์ค่า = เพิ่มให้ร้านนี้)
    const haveIds = new Set(rows.map(x => x.L.item_id).filter(v => v != null)), sib = {};
    tabChs.filter(x => x.id !== c.id).forEach(x => (ctx.RT[x.id] || []).forEach(L => { if (L.item_id != null && !L.extra && !haveIds.has(L.item_id) && !sib[L.item_id]) sib[L.item_id] = { ...L, from: x.name }; }));
    const missRow = L => `<tr class="fe2-miss"><td class="l">${esc(L.name)} <span class="fe2-z">· ร้านนี้ยังไม่ได้ตั้ง (${esc(L.from)} มี)</span></td><td><span class="fe2-z">—</span></td><td><input class="fe2-in" type="number" step="any" data-item="${L.item_id}" data-kind="${L.kind}" placeholder="—"><span class="fe2-u">${L.kind === 'pct' ? '%' : 'บาท'}</span></td><td><span class="fe2-z">—</span></td></tr>`;
    const merge = (list, company) => [...list.map(x => ({ s: +x.L.sort || 0, h: rowHtml(x) })), ...Object.values(sib).filter(L => !!L.company === company).map(L => ({ s: +L.sort || 0, h: missRow(L) }))].sort((a, b) => a.s - b.s).map(x => x.h);
    const rowsCh = merge(rows.filter(x => !x.L.company), false), rowsCo = merge(rows.filter(x => x.L.company), true);
    // (2026-11-10) เพิ่มรายการ: เลือกรายการที่มีอยู่ (ที่ช่องทางนี้ยังไม่มี) หรือสร้างใหม่ · ค่าใช้จ่ายบริษัทเพิ่มได้เฉพาะตัวที่ขาด (ค่า Ads / ค่าบริหาร / Marketing)
    const have = new Set(rows.map(x => x.L.item_id).filter(v => v != null));
    const chAvail = FT.items.filter(it => it.active !== false && !have.has(it.id) && !sib[it.id] && !fe2Co(it));
    const coMissing = FT.items.filter(it => it.active !== false && !have.has(it.id) && !sib[it.id] && fe2Co(it));
    const lyTxt = { platform: 'ค่า Platform', selling: 'ค่าขาย', overhead: 'ค่าบริหาร / Marketing' }, apTxt = { all: '', single: ' · สินค้าเดี่ยว', set: ' · เซต' };
    const addForm = g => { const L = g === 'co' ? coMissing : chAvail;
      return `<div class="fe2-af" data-af="${g}"><select class="pr-in" data-f="pick"><option value="">เลือกรายการ</option>${L.map(it => `<option value="${it.id}" data-kind="${it.kind}">${esc(it.name)} (${it.kind === 'pct' ? '%' : 'บาท'} · ${lyTxt[it.layer] || it.layer}${apTxt[it.apply] || ''})</option>`).join('')}${g === 'ch' ? '<option value="new">＋ รายการใหม่…</option>' : ''}</select>
        <span class="fe2-new" hidden><input class="pr-in" data-f="name" placeholder="ชื่อรายการ"><select class="pr-in" data-f="kind"><option value="pct">%</option><option value="per_order">บาท / ออเดอร์</option></select>
          <select class="pr-in" data-f="layer"><option value="platform">ค่า Platform</option><option value="selling">ค่าขาย</option></select><select class="pr-in" data-f="apply"><option value="all">ทุกออเดอร์</option><option value="single">เฉพาะสินค้าเดี่ยว</option><option value="set">เฉพาะเซต</option></select></span>
        <input class="pr-in fe2-in" type="number" step="any" data-f="val" placeholder="ค่า"><span class="fe2-u" data-f="unit">%</span>
        <button type="button" class="pr-btn" data-f="save">บันทึก</button><button type="button" class="pr-btn ghost" data-f="cancel">ยกเลิก</button></div>`; };
    const sumRow = (l, a, aPer, s, sPer, first) => `<tr class="fe2-s${first ? ' first' : ''}"><td class="l">${l}</td><td>${a == null ? '<span class="fe2-z">—</span>' : a.toFixed(2) + '%' + perTxt(aPer)}</td><td>${s.toFixed(2)}%${perTxt(sPer)}</td><td>${a == null ? '' : dif(a, s)}</td></tr>`;
    const calcA = S.useCh + S.useCo, calcS = S.setCh + S.setCo, hasApi = rows.some(x => x.L.can);
    const actTip = g ? 'ค่าธรรมเนียมจากช่องทาง = ที่แพลตฟอร์มหักจริง ÷ ยอดขายสินค้า (ไม่รวมค่าส่งที่ผู้ซื้อจ่าย) ของออเดอร์ที่ได้เงินแล้ว 30 วันล่าสุด · ชี้ ⓘ ในแต่ละบรรทัดเพื่อดูเป็นบาทต่อออเดอร์\nค่าใช้จ่ายของบริษัท = งบบัญชี ' + ctx.accRange + ' (ไว้ดูประกอบ)' : 'ตามงบบัญชี ' + ctx.accRange + ' (ช่องทางนี้ไม่มี API)';
    el.innerHTML = `
      <div class="fe2-cards"><div><div class="l">ค่าธรรมเนียมช่องทาง · ค่าจริง ${info('รวมทุกบรรทัดในกลุ่ม "ค่าธรรมเนียมจากช่องทาง" คอลัมน์ค่าจริง\n% = คิดจากราคาขาย · บาท = ค่าที่คิดเป็นบาทต่อออเดอร์')}</div><div class="v">${S.actChV == null ? '—' : S.actChV.toFixed(2) + '%' + perTxt(S.pAct)}</div><div class="s">ตั้งไว้ ${S.setCh.toFixed(2)}%${perTxt(S.pSet)}</div></div>
        <div><div class="l">ค่าใช้จ่ายบริษัท · ค่าจริงตามงบบัญชี ${info('ค่า Ads ของช่องทางนี้ + ค่าบริหาร + Marketing ทั้งบริษัท ÷ ยอดขาย ตามงบบัญชี ' + ctx.accRange + '\nไว้ดูประกอบ · สูตรคิดโปรใช้ค่าที่ตั้งไว้เสมอ')}</div><div class="v">${S.actCo.toFixed(2)}%</div><div class="s">ตั้งไว้ ${S.setCo.toFixed(2)}%</div></div>
        <div><div class="l">สูตรคิดโปรหัก (ก่อนต้นทุนสินค้า) ${info('= ค่าธรรมเนียมช่องทาง + ค่าใช้จ่ายบริษัท (ใช้ค่าที่ตั้งไว้เสมอ)\nเลือก "ค่าจริง" หรือ "ค่าที่ตั้งไว้" ได้ตอนจำลองโปร หรือดูคำขอโปร · เริ่มต้น = ค่าจริง\nเหลือ ' + (100 - (hasApi ? calcA : calcS)).toFixed(2) + '% ของราคาขาย ไว้จ่ายต้นทุนสินค้า + กำไร')}</div>${hasApi
          ? `<div class="v">${calcA.toFixed(2)}%${perTxt(S.pUse)}</div><div class="s">เลือกค่าจริง · ถ้าเลือกค่าที่ตั้งไว้ ${calcS.toFixed(2)}%${perTxt(S.pSet)}</div>`
          : `<div class="v">${calcS.toFixed(2)}%${perTxt(S.pSet)}</div><div class="s">ช่องทางนี้ไม่มี API ใช้ค่าที่ตั้งไว้เสมอ</div>`}</div></div>
      <div class="fe2-card"><div class="fe2-ch"><b>${esc(c.name)}</b><span class="fe2-src">${src}</span></div>
      <table class="fe2-t" data-no-sort data-no-page><thead><tr><th class="l">รายการ</th><th>ค่าจริง ${info(actTip)}</th><th>ตั้งไว้ ${info('ตัวเลขที่ตั้งไว้ใช้คิดโปร แก้ได้เลย บันทึกเมื่อออกจากช่อง')}</th><th>ต่าง ${info('ค่าจริง − ตั้งไว้ (หน่วย %)\nสีแดง = ค่าจริงสูงกว่าที่ตั้ง (ถ้าคิดโปรด้วยค่าที่ตั้งไว้ กำไรจริงจะน้อยกว่าที่เห็น) · สีเขียว = ค่าจริงต่ำกว่า')}</th></tr></thead><tbody>
        <tr class="fe2-g"><td colspan="4">ค่าธรรมเนียมจากช่องทาง<button type="button" class="fe2-addb" data-add="ch">＋ เพิ่มรายการ</button></td></tr>${rowsCh.join('') || '<tr><td colspan="4" class="l fe2-z">ไม่มีรายการ</td></tr>'}<tr class="fe2-addr" data-addr="ch" hidden><td colspan="4">${addForm('ch')}</td></tr>
        <tr class="fe2-g"><td colspan="4">ค่าใช้จ่ายของบริษัท · ค่าจริงไว้ดูประกอบ${coMissing.length ? '<button type="button" class="fe2-addb" data-add="co">＋ เพิ่ม</button>' : ''}</td></tr>${rowsCo.join('') || '<tr><td colspan="4" class="l fe2-z">ไม่มีรายการ</td></tr>'}${coMissing.length ? `<tr class="fe2-addr" data-addr="co" hidden><td colspan="4">${addForm('co')}</td></tr>` : ''}
        ${sumRow('สรุป · ค่าธรรมเนียมช่องทาง', S.actChV, S.pAct, S.setCh, S.pSet, true)}
        ${sumRow('สรุป · ค่าใช้จ่ายบริษัท', S.actCo, 0, S.setCo, 0)}
        ${sumRow('สรุป · ทั้งหมดก่อนต้นทุนสินค้า', S.actChV == null ? null : S.actChV + S.actCo, S.pAct, S.setCh + S.setCo, S.pSet)}
      </tbody></table>
      <div class="fe2-note">แก้ตัวเลขช่อง "ตั้งไว้" ได้เลย บันทึกเมื่อออกจากช่อง</div></div>`;
    bindNav();
    // ---- เพิ่ม / เปลี่ยนชื่อ / เอาออก
    el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { const r = el.querySelector(`tr[data-addr="${b.dataset.add}"]`); if (r) { r.hidden = !r.hidden; if (!r.hidden) r.querySelector('select').focus(); } });
    el.querySelectorAll('.fe2-af').forEach(f => {
      const q = k => f.querySelector(`[data-f="${k}"]`), unit = () => { const pick = q('pick'), isNew = pick.value === 'new'; const kind = isNew ? q('kind').value : (pick.selectedOptions[0] || {}).dataset ? pick.selectedOptions[0].dataset.kind : 'pct'; q('unit').textContent = kind === 'pct' ? '%' : 'บาท'; };
      q('pick').onchange = () => { f.querySelector('.fe2-new').hidden = q('pick').value !== 'new'; unit(); };
      if (q('kind')) q('kind').onchange = unit;
      q('cancel').onclick = () => { f.closest('tr').hidden = true; };
      q('save').onclick = async () => {
        const pick = q('pick').value, raw = q('val').value.trim(); if (!pick) { uiAlert('เลือกรายการก่อน', { tone: 'bad' }); return; } if (raw === '') { uiAlert('ใส่ค่าก่อน', { tone: 'bad' }); return; }
        let id = +pick, kind = pick === 'new' ? q('kind').value : (FT.items.find(it => it.id === id) || {}).kind;
        if (pick === 'new') { const nm = q('name').value.trim(); if (!nm) { uiAlert('ใส่ชื่อรายการก่อน', { tone: 'bad' }); return; }
          try { await rpc('fee_edit', { p: { op: 'item_add', name: nm, kind, layer: q('layer').value, apply: q('apply').value } }); const t = await rpc('fee_table'); const it = (t.items || []).filter(x => x.name === nm).sort((a, b) => b.id - a.id)[0]; if (!it) throw new Error('หารายการที่เพิ่งสร้างไม่เจอ'); id = it.id; }
          catch (e) { uiAlert('เพิ่มรายการไม่สำเร็จ', { text: e.message, tone: 'bad' }); return; } }
        if (await feeEdit({ op: 'value', item_id: id, channel_id: c.id, value: String(kind === 'pct' ? +raw / 100 : +raw) })) renderFeeNew();
      };
    });
    el.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => { const it = FT.items.find(x => x.id === +b.dataset.rm) || {};
      if (!(await uiConfirm('เอารายการออก', { text: `เอา "${it.name || ''}" ออกจาก ${c.name} · ช่องทางอื่นยังมีเหมือนเดิม`, ok: 'เอาออก', tone: 'bad' }))) return;
      if (await feeEdit({ op: 'value', item_id: +b.dataset.rm, channel_id: c.id, value: '' })) renderFeeNew(); });
    el.querySelectorAll('[data-ren]').forEach(b => b.onclick = async () => { const it = FT.items.find(x => x.id === +b.dataset.ren) || {};
      const nm = await uiPrompt('เปลี่ยนชื่อรายการ', { text: 'ชื่อนี้ใช้กับทุกช่องทางที่มีรายการนี้', value: it.name || '', ok: 'บันทึก' }); if (nm == null || !nm.trim() || nm.trim() === it.name) return;
      if (await feeEdit({ op: 'item_update', id: it.id, name: nm.trim() })) renderFeeNew(); });
    el.querySelectorAll('.fe2-in:not([data-f])').forEach(inp => inp.onchange = async () => {
      const raw = inp.value.trim(), item_id = +inp.dataset.item;
      if (await feeEdit({ op: 'value', item_id, channel_id: c.id, value: raw === '' ? '' : String(inp.dataset.kind === 'pct' ? +raw / 100 : +raw) })) renderFeeNew();
    });
  }
  // แถวของช่องทาง 1 ช่อง: อัตราที่ใช้คิดโปรมาจากฐานข้อมูล (fee_rates) ชุดเดียวกับสูตรคิดโปร · ค่าจริงของค่าใช้จ่ายบริษัท / ช่องทางที่ไม่มี API = งบบัญชี (ไว้ดูประกอบ)
  function fe2Lines(c, ctx) {
    const R = ctx.RT[c.id] || [], g = (c.actual_grp && ctx.G30[c.actual_grp]) || null;
    const rows = R.map(L => {
      let act = null, tip = '';
      if (L.company) { const co = fe2Co(ctx.IT[L.item_id] || L); const a = co === 'ads' ? (ctx.AC[c.id] || {}).ads : ctx.CO[co]; act = a == null ? null : a * 100; tip = `งบบัญชี ${ctx.accRange}`; }
      else if (L.extra || g) { if (L.merged) act = 'merged'; else if (L.act != null) { act = L.kind === 'pct' ? +L.act * 100 : +L.act; if (L.kind === 'pct' && L.per_order != null) tip = `≈ ${n2(L.per_order)} บาท / ออเดอร์`; } }
      else { const k = /commission/i.test(L.name) && !/platform/i.test(L.name) ? 'commission' : /platform/i.test(L.name) ? 'platform' : null; const a = k ? (ctx.AC[c.id] || {})[k] : null; act = a == null ? null : a * 100; tip = `งบบัญชี ${ctx.accRange}`; }
      const isPct = L.kind === 'pct';
      return { L, act, tip, isPct, setPct: isPct ? +L.set * 100 : null, usePct: isPct ? +L.rate * 100 : null };
    });
    const S = { setCh: 0, actCh: 0, hasAct: false, useCh: 0, pSet: 0, pAct: 0, pUse: 0, setCo: 0, actCo: 0, useCo: 0 };
    const PO = { set: { all: 0, single: 0, set: 0 }, act: { all: 0, single: 0, set: 0 }, use: { all: 0, single: 0, set: 0 } };   // บาท / ออเดอร์ แยกตามว่าใช้กับออเดอร์แบบไหน
    rows.forEach(x => {
      if (x.L.company) { S.setCo += x.setPct || 0; if (typeof x.act === 'number') S.actCo += x.act; S.useCo += x.usePct || 0; }
      else if (x.isPct) { S.setCh += x.setPct; if (typeof x.act === 'number') { S.actCh += x.act; S.hasAct = true; } S.useCh += x.usePct; }
      else { const ap = PO.set[x.L.apply] == null ? 'all' : x.L.apply; PO.set[ap] += +x.L.set || 0; if (typeof x.act === 'number') PO.act[ap] += x.act; PO.use[ap] += +x.L.rate || 0; }
    });
    const po = o => o.all + Math.max(o.single, o.set);   // 1 ออเดอร์เป็นสินค้าเดี่ยวหรือเซตอย่างใดอย่างหนึ่ง
    S.pSet = po(PO.set); S.pAct = po(PO.act); S.pUse = po(PO.use);
    S.actChV = S.hasAct || !g ? S.actCh : null;
    return { rows, S, g };
  }
  if (!document.getElementById('fe2Style')) { const st = document.createElement('style'); st.id = 'fe2Style'; st.textContent = `
    #page-execfee .fe2-top{display:flex;align-items:center;gap:10px;margin-bottom:10px}
    #page-execfee .fe2-back{margin-bottom:10px}
    #page-execfee .fe2-tabs{display:flex;gap:20px;border-bottom:1px solid var(--border);margin-bottom:12px}
    #page-execfee .fe2-tabs button{background:none;border:none;border-bottom:2px solid transparent;padding:8px 0;font:inherit;font-size:13px;color:var(--text2);cursor:pointer}
    #page-execfee .fe2-tabs button.on{color:var(--text);font-weight:700;border-bottom-color:var(--accent,#b8862f)}
    #page-execfee .fe2-sub{margin-bottom:12px}
    #page-execfee .fe2-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;margin-bottom:14px;background:var(--bg2);border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.04)}
    #page-execfee .fe2-cards>div{padding:14px 18px;min-width:0} #page-execfee .fe2-cards>div+div{border-left:1px solid var(--border)}
    .fe2-tabs2 button{white-space:nowrap} #feTopCtl .fe2-sub{margin:0}
    .fe2-pick select{min-width:220px} #page-execfee tr.fe2-miss td{background:color-mix(in srgb,var(--orange,#f59e0b) 6%,var(--bg2))} #page-execfee tr.fe2-miss .fe2-in{border-style:dashed !important}
    #page-execfee .fe2-addb{float:right;font:inherit;font-size:12px;font-weight:600;padding:2px 10px;border-radius:6px;border:1px dashed color-mix(in srgb,var(--accent) 55%,var(--border));background:transparent;color:var(--accent);cursor:pointer}
    #page-execfee .fe2-addb:hover{background:color-mix(in srgb,var(--accent) 10%,transparent)}
    #page-execfee .fe2-act{display:inline-flex;gap:2px;margin-left:8px;opacity:0;transition:opacity .12s} #page-execfee tr:hover .fe2-act{opacity:1}
    #page-execfee .fe2-act button{border:0;background:transparent;color:var(--text3);cursor:pointer;font-size:12px;padding:1px 5px;border-radius:5px} #page-execfee .fe2-act button:hover{background:var(--bg3);color:var(--text)}
    #page-execfee tr.fe2-addr td{background:color-mix(in srgb,var(--accent) 6%,var(--bg2));text-align:left}
    #page-execfee .fe2-af{display:flex;flex-wrap:wrap;gap:6px;align-items:center} #page-execfee .fe2-af select.pr-in, #page-execfee .fe2-af input.pr-in{height:30px;padding:0 8px;font-size:12.5px}
    #page-execfee .fe2-af select[data-f=pick]{min-width:260px} #page-execfee .fe2-af input[data-f=name]{width:200px} #page-execfee .fe2-af .fe2-new{display:inline-flex;gap:6px} #page-execfee .fe2-af .fe2-new[hidden]{display:none}
    #page-execfee .fe2-af .pr-btn{height:30px;padding:0 14px}
    #page-execfee .fe2-ch{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap} #page-execfee .fe2-src{font-size:12px;color:var(--text3);font-weight:400}
    #page-execfee .fe2-card{padding:16px 0 10px !important} #page-execfee .fe2-card .fe2-ch, #page-execfee .fe2-card .fe2-note{padding:0 18px}
    #page-execfee table.fe2-t{table-layout:fixed} #page-execfee table.fe2-t:not(.fe2-cmp) col.c1{width:auto}
    #page-execfee table.fe2-t th, #page-execfee table.fe2-t td{padding-left:18px;padding-right:18px}
    #page-execfee table.fe2-t:not(.fe2-cmp) th:not(.l), #page-execfee table.fe2-t:not(.fe2-cmp) td:not(.l){width:17%}
    #page-execfee tr.fe2-g td{font-size:12px;letter-spacing:0;padding-top:8px;padding-bottom:8px}
    #page-execfee tr.fe2-s td{background:transparent !important} #page-execfee tr.fe2-s.first td{border-top:2px solid var(--tot-line, var(--text2)) !important}
    #page-execfee .fe2-cards .l{font-size:12px;color:var(--text2)} #page-execfee .fe2-cards .v{font-size:20px;font-weight:700;margin:2px 0;font-variant-numeric:tabular-nums} #page-execfee .fe2-cards .s{font-size:11.5px;color:var(--text3)}
    #page-execfee .fe2-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px 14px}
    #page-execfee .fe2-ch{margin-bottom:8px;font-size:14px}
    #page-execfee table.fe2-t{width:100%;border-collapse:collapse;font-size:12.5px}
    #page-execfee table.fe2-t th{font-size:11px;color:var(--text3);font-weight:600;text-align:right;padding:8px;border-bottom:1px solid var(--border)} #page-execfee table.fe2-t th.l{text-align:left}
    #page-execfee table.fe2-t td{padding:7px 8px;border-bottom:1px solid var(--border);text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap} #page-execfee table.fe2-t td.l{text-align:left;white-space:normal}
    #page-execfee tr.fe2-g td{background:var(--bg3);font-size:11.5px;font-weight:700;color:var(--text2);text-align:left}
    #page-execfee tr.fe2-s td{font-weight:700}
    #page-execfee .fe2-in{width:62px!important;height:26px;box-sizing:border-box;border:1px solid var(--border);border-radius:6px;background:var(--bg3);color:var(--text);text-align:right;padding:0 7px;font:inherit;font-size:12.5px;-moz-appearance:textfield}
    #page-execfee .fe2-in::-webkit-outer-spin-button,#page-execfee .fe2-in::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
    #page-execfee .fe2-u{display:inline-block;width:30px;text-align:left;margin-left:5px;font-size:12px;color:var(--text3)}
    #page-execfee .fe2-up{color:#dc2626;font-weight:600} #page-execfee .fe2-dn{color:#16a34a} #page-execfee .fe2-z{color:var(--text3);font-weight:400}
    .pv-fm{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px;font-size:12px;color:var(--text2)} .pv-fm .pr-seg button{padding:4px 12px;font-size:12px} .pv-fm-n{font-size:11.5px;color:var(--text3)}
    #page-execfee .fe2-wide{overflow-x:auto}
    #page-execfee table.fe2-cmp th{vertical-align:bottom;white-space:nowrap} #page-execfee table.fe2-cmp td{vertical-align:top}
    #page-execfee .fe2-colh{border:0;background:none;font:inherit;color:inherit;cursor:pointer;padding:4px 6px;margin:-4px -6px;border-radius:6px;display:inline-flex;flex-direction:column;align-items:flex-end;gap:1px}
    #page-execfee .fe2-colh:hover{background:var(--bg3)} #page-execfee .fe2-colh b{font-size:12px;color:var(--text);font-weight:700} #page-execfee .fe2-colh small{font-size:10.5px;color:var(--text3);font-weight:400}
    #page-execfee .fe2-cv{color:var(--text)} #page-execfee .fe2-cs{font-size:10.5px;color:var(--text3);margin-top:1px}
    #page-execfee .fe2-note{font-size:11.5px;color:var(--text3);margin-top:10px;line-height:1.6}
    @media (max-width:900px){#page-execfee .fe2-cards{grid-template-columns:1fr}}`; document.head.appendChild(st); }

  async function renderFeeOld() {
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
