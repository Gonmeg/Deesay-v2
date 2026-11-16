// prtest.js (v20261116f) — หน้า "PR Performance · TikTok": funnel ตามงบ Awareness → Consideration → Conversion + กล่องผลที่ตามมา Shop Traffic
// ข้อมูลทั้งหน้า = RPC pr_test_page ครั้งเดียว (Supabase สรุปให้)
//   Awareness / Consideration = รายงานระดับ Campaign จาก TikTok Ads (ตาราง tiktok_campaign_daily · แยกชั้นตามประเภท Campaign: Reach, Video views = Awareness · Brand consideration, Engagement, Traffic = Consideration)
//   Shop Traffic = คนเห็นสินค้า / กดเข้าหน้าสินค้าในร้าน TikTok แยก Live · คลิป · การ์ดสินค้า (tiktok_shop_perf_daily) + โปรไฟล์ช่อง (tiktok_account_daily) · รายสินค้า = tiktok_product_perf_daily (เฉพาะตะกร้าของร้านเอง)
//   สรุปผลทดลอง 3 คำถาม: เกินเพดานไหม (ค่า Ads รวม ÷ ยอดขาย) · คนที่เห็น Ads PR สนใจสินค้าไหม (Cost per Add to Cart ของ Ads ชั้น Awareness + Consideration) · คุ้มไหม (ยอดขาย ÷ ค่า Ads รวม เทียบ Baseline)
//   Journey = ตัวเลขที่ TikTok Ads นับให้ Ads ชั้น Awareness + Consideration โดยตรง: Impressions → 6s Views → Anchor Clicks → Product Page Views → Add to Cart
//   Campaign ที่พาคนเข้า Live (ชั้น lv จาก pr_camp_tier) ไม่นับเป็น PR — แสดงเป็นส่วน Live ในแถบค่า Ads รวม
//   ตาราง Campaign: กดแถวเพื่อกรองตารางคลิปให้เหลือคลิปของ Campaign นั้น (คลิปผูกกับ Campaign ล่าสุดที่ใช้คลิปนั้น)
//   Conversion = ยอดขายจริงของ TikTok (mv_sales_daily) กับค่า Ads ที่ไม่นับ Ads สร้างการรับรู้ (mv_tt_ads_channel_daily)
//   % ของแต่ละชั้น = Spend ÷ ยอดขาย TikTok ช่วงเดียวกัน · Baseline = ค่าเฉลี่ยต่อวันของช่วงก่อนทดลอง (ล็อก) หรือ 60 วันก่อนช่วงที่ดู
//   Reach นับรายวันต่อ Campaign — คนเดียวกันที่เห็นหลายวัน / หลาย Campaign นับซ้ำ (TikTok ไม่ให้ยอดไม่ซ้ำของช่วงที่เลือกเอง)
//   ป้าย ดี / พอใช้ / ควรหยุด ของคลิป = เทียบกับคลิปของเราเองตั้งแต่ต้นปีถึงวันสุดท้ายของ Baseline (Spend 1,000 ขึ้นไป)
//   หน้าแรก = Journey 4 ขั้น (เห็น → สนใจ → เข้าร้าน → ซื้อ) ขั้นละ 1 ตัวเลขหลัก + 3 ตัวชี้วัดประกอบ · กดขั้นเพื่อดูกราฟรายวันและตารางของขั้นนั้น
(function () {
  'use strict';
  const CAP = 18;                                             // เพดานค่า Ads TikTok ต่อยอดขาย (%) รวม PR
  const PRE = { from: '2026-09-01', to: '2026-10-31' };       // Baseline "ก่อนทดลอง" (ล็อก)
  const TEST_FROM = '2026-11-14';                             // วันเริ่มทดลองเพิ่มงบ PR
  const COL = { aw: '#7c5cff', co: '#0c8599', tr: '#3b6fd4', cv: '#b8862f', live: '#ae3ec9', vid: '#f08c00', ads: '#dc2626', base: '#8b95a5' };
  const TIER = { aw: ['Awareness', 'การรับรู้'], co: ['Consideration', 'ความสนใจ'], tr: ['Shop Traffic', 'การเข้าชมร้าน'], cv: ['Conversion', 'การสั่งซื้อ'] };
  const ORDER = ['aw', 'co', 'tr', 'cv'], STG = { aw: 'Awareness', co: 'Consideration', tr: 'Shop Traffic', cv: 'Conversion' }, UNIT = { aw: 'Impressions', co: 'Clicks', tr: 'Product Page Views', cv: 'Orders' };
  const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  let D = null, KEY = '', seq = 0, sel = 'aw', baseMode = 'pre', selCamp = null, charts = {};
  const ADV = { '7138651956792360962': 'Fimiq B', '7409927410046648337': 'Fimiq Awareness', '7680042517500313621': 'Fimiq PR' };
  const OBJ = { REACH: 'Reach', VIDEO_VIEWS: 'Video views', RF_REACH: 'Reach', TOPVIEW: 'TopView', BRAND_CONSIDERATION: 'Brand consideration', ENGAGEMENT: 'Engagement', TRAFFIC: 'Traffic', COMMUNITY_INTERACTION: 'Community interaction' };
  const $ = id => document.getElementById(id);
  const num = v => +v || 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n0 = v => Math.round(num(v)).toLocaleString('en-US');
  const n1 = v => num(v).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const n2 = v => num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (a, b, d) => b > 0 ? (a / b * 100).toFixed(d == null ? 1 : d) + '%' : '—';
  const tip = t => `<span class="pt-i" data-tip="${esc(t)}">ⓘ</span>`;
  const dTh = s => { const [y, m, d] = String(s).split('-').map(Number); return `${d} ${TH_M[m - 1]} ${(y + 543) % 100}`; };
  const days = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
  const addD = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const minS = (a, b) => (a && b ? (a < b ? a : b) : a || b);

  function css() {
    if ($('ptCss')) return;
    const s = document.createElement('style'); s.id = 'ptCss';
    s.textContent = `
      #prtest-root .pt-card { background:var(--bg2); border-radius:14px; box-shadow:var(--sh, 0 1px 3px rgba(16,24,40,.08)); padding:18px 20px; margin-bottom:16px; }
      .pt-hd { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; }
      .pt-t { font-weight:700; font-size:14.5px; color:var(--text); } .pt-s { color:var(--text3); font-size:12px; margin-top:2px; }
      .pt-i { font-size:11px; color:var(--text3); margin-left:3px; cursor:help; font-weight:400; }
      .pt-tot { text-align:right; white-space:nowrap; } .pt-tot small { display:block; font-size:11.5px; color:var(--text3); } .pt-tot b { font-size:24px; font-weight:700; font-variant-numeric:tabular-nums; } .pt-tot em { display:block; font-style:normal; font-size:11.5px; color:var(--text3); }
      .pt-tier { display:grid; grid-template-columns:38% 1fr; gap:22px; align-items:center; padding:12px 10px; border-radius:12px; margin-top:8px; border:1.5px solid transparent; cursor:pointer; width:100%; background:none; font:inherit; color:inherit; text-align:left; }
      .pt-tier:hover { background:var(--bg3); } .pt-tier[aria-pressed="true"] { border-color:var(--accent); background:var(--accent-soft); }
      .pt-tb { display:flex; justify-content:center; } .pt-bar { height:58px; border-radius:10px; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:250px; white-space:nowrap; }
      .pt-bar b { font-size:14.5px; } .pt-bar span { font-size:11px; opacity:.94; }
      .pt-tm { display:grid; grid-template-columns:minmax(170px, 200px) 1fr; gap:16px; align-items:center; }
      .pt-big { font-size:24px; font-weight:700; font-variant-numeric:tabular-nums; color:var(--text); } .pt-big small { display:block; font-size:11.5px; font-weight:400; color:var(--text3); }
      .pt-k { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:10px 14px; align-items:start; } .pt-k small { display:block; font-size:11px; color:var(--text3); line-height:1.3; min-height:29px; }
      .pt-k b { font-size:15px; font-variant-numeric:tabular-nums; color:var(--text); } .pt-k em { display:block; font-style:normal; font-size:11px; color:var(--text3); line-height:1.3; }
      .pt-up { color:var(--green, #16794a) !important; font-weight:600; } .pt-dn { color:var(--red, #c0392b) !important; font-weight:600; }
      .pt-note { font-size:12px; color:var(--text3); margin-top:10px; }
      .pt-hd2 { display:flex; justify-content:space-between; align-items:center; margin:4px 2px 10px; }
      .pt-c3 { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px; margin-bottom:16px; } .pt-c3 .pt-card { margin:0; padding:14px 14px 12px; }
      .pt-cv { height:250px; margin-top:8px; position:relative; }
      .pt-lg { display:flex; gap:12px; flex-wrap:wrap; font-size:11px; color:var(--text3); margin-top:6px; } .pt-lg i { display:inline-block; width:14px; height:3px; border-radius:2px; margin-right:5px; vertical-align:middle; } .pt-lg i.d { background:none; border-top:2px dashed ${COL.base}; height:0; }
      .pt-vd { font-size:12px; color:var(--text2); margin-top:8px; padding-top:8px; border-top:1px solid var(--border); }
      .pt-chip { font-size:11.5px; font-weight:600; background:var(--accent-soft); color:var(--accent); border-radius:999px; padding:2px 10px; margin-left:8px; }
      table.pt-tbl { width:100%; border-collapse:collapse; font-size:13px; margin-top:12px; }
      table.pt-tbl th { font-size:12px; color:var(--text3); font-weight:600; padding:8px; border-bottom:1px solid var(--border); text-align:center; white-space:nowrap; }
      table.pt-tbl td { padding:9px 8px; border-bottom:1px solid var(--border); text-align:center; font-variant-numeric:tabular-nums; } table.pt-tbl th:first-child, table.pt-tbl td:first-child { text-align:left; } table.pt-tbl tr:last-child td { border-bottom:0; }
      .pt-clip { display:flex; align-items:center; gap:9px; min-width:0; } .pt-clip.sq img { height:34px; }
      .pt-bar2 { display:flex; justify-content:space-between; align-items:center; gap:18px; flex-wrap:wrap; }
      .pt-cap { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; } .pt-cap b { font-size:26px; font-weight:700; font-variant-numeric:tabular-nums; } .pt-cap span { font-size:12.5px; color:var(--text2); }
      .pt-jn { position:relative; display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:14px; margin-bottom:16px; }
      .pt-jn::before { content:''; position:absolute; top:27px; left:12.5%; right:12.5%; height:4px; border-radius:2px; background:linear-gradient(90deg, ${COL.aw}, ${COL.co} 34%, ${COL.tr} 67%, ${COL.cv}); opacity:.55; }
      .pt-col { position:relative; display:flex; flex-direction:column; min-width:0; }
      .pt-col:not(:first-child)::before { content:''; position:absolute; left:-12px; top:21px; width:10px; height:10px; border-top:3px solid var(--c); border-right:3px solid var(--c); transform:rotate(45deg); opacity:.8; }
      .pt-nd { display:flex; flex-direction:column; align-items:center; text-align:center; padding-bottom:12px; }
      .pt-nd i { position:relative; width:58px; height:58px; border-radius:50%; background:var(--c); display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 6px var(--bg, #eef1f6), 0 6px 14px -4px var(--c); }
      .pt-nd i svg { width:26px; height:26px; stroke:#fff; fill:none; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }
      .pt-nd b { margin-top:10px; font-size:17px; font-weight:700; color:var(--text); } .pt-nd b small { font-size:11.5px; font-weight:400; color:var(--text3); margin-left:7px; }
      .pt-nd span { font-size:12px; color:var(--text2); margin-top:1px; }
      .pt-sg { flex:1; background:var(--bg2); border-radius:14px; box-shadow:var(--sh, 0 1px 3px rgba(16,24,40,.08)); padding:0 0 14px; border:1.5px solid transparent; cursor:pointer; text-align:left; font:inherit; color:inherit; display:flex; flex-direction:column; min-width:0; overflow:hidden; }
      .pt-sg:hover { box-shadow:0 8px 22px -10px var(--c); } .pt-sg[aria-pressed="true"] { border-color:var(--c); }
      .pt-sg .hd { padding:14px 16px 13px; background:color-mix(in srgb, var(--c) 9%, var(--bg2)); display:flex; flex-direction:column; gap:3px; }
      .pt-sg .hl { font-size:12px; color:var(--text2); display:flex; justify-content:space-between; align-items:center; gap:8px; } .pt-sg .hv { font-size:30px; font-weight:700; font-variant-numeric:tabular-nums; color:var(--text); line-height:1.2; } .pt-sg .hv span { font-size:12.5px; font-weight:400; color:var(--text3); margin-left:6px; }
      .pt-sg .hd > em { font-style:normal; font-size:12.5px; }
      .pt-sg .pt-k { grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px 10px; padding:13px 16px 0; } .pt-sg .pt-k b { font-size:14px; }
      .pt-sg .act { margin:12px 16px 0; font-size:12px; color:var(--text2); line-height:1.45; border-left:3px solid var(--c); padding:2px 0 2px 10px; min-height:38px; } .pt-sg .act b { color:var(--text); }
      .pt-pill.a { background:#fdf0d5; color:#9a6700; }
      table.pt-tbl tr.pt-row { cursor:pointer; } table.pt-tbl tr.pt-row:hover td { background:var(--bg3); } table.pt-tbl tr.pt-row[aria-selected="true"] td { background:var(--accent-soft); } table.pt-tbl tr.pt-row[aria-selected="true"] td:first-child { box-shadow:inset 3px 0 0 var(--accent); }
      .pt-x { border:0; background:var(--bg3); color:var(--text2); font:inherit; font-size:11.5px; border-radius:999px; padding:2px 10px; margin-left:8px; cursor:pointer; }
      .pt-seg { display:inline-flex; background:var(--bg3); border-radius:9px; padding:3px; gap:2px; } .pt-seg button { border:0; background:none; font:inherit; font-size:12.5px; color:var(--text2); padding:5px 14px; border-radius:7px; cursor:pointer; } .pt-seg button[aria-pressed="true"] { background:var(--bg2); color:var(--text); font-weight:600; box-shadow:0 1px 2px rgba(16,24,40,.12); }
      .pt-cn b { display:block; font-weight:500; max-width:360px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .pt-cn small { color:var(--text3); font-size:11.5px; }
      .pt-sg .ft { margin:10px 16px 0; font-size:11.5px; color:var(--text3); }
      .pt-sum { border:1px solid var(--hero-line, var(--border)); background:var(--hero, var(--bg2)); }
      .pt-st { font-size:11.5px; font-weight:600; border-radius:999px; padding:3px 11px; background:var(--bg3); color:var(--text2); white-space:nowrap; }
      .pt-q3 { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px; margin-top:14px; }
      .pt-q { background:var(--bg3); border-radius:12px; padding:14px 16px; display:flex; flex-direction:column; gap:4px; min-width:0; }
      .pt-q h4 { margin:0; font-size:13.5px; font-weight:700; color:var(--text); display:flex; justify-content:space-between; align-items:center; gap:8px; }
      .pt-q .v { font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; color:var(--text); line-height:1.2; } .pt-q .v span { font-size:12.5px; font-weight:400; color:var(--text3); margin-left:6px; }
      .pt-q small { font-size:12px; color:var(--text3); } .pt-q em { font-style:normal; font-size:12.5px; } .pt-q p { margin:4px 0 0; font-size:12.5px; color:var(--text2); line-height:1.45; }
      .pt-jr { display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:0; margin-top:14px; }
      .pt-js { position:relative; padding:12px 14px 12px 22px; border-left:1px solid var(--border); min-width:0; } .pt-js:first-child { border-left:0; padding-left:4px; }
      .pt-js:not(:first-child)::before { content:'›'; position:absolute; left:-7px; top:50%; transform:translateY(-50%); background:var(--bg2); color:var(--text3); font-size:18px; line-height:1; padding:4px 0; }
      .pt-js small { display:block; font-size:11.5px; color:var(--text3); } .pt-js b { display:block; font-size:21px; font-weight:700; font-variant-numeric:tabular-nums; color:var(--text); margin:2px 0; }
      .pt-js span { display:block; font-size:11.5px; color:var(--text2); line-height:1.5; } .pt-js .pt-i { display:inline; } .pt-js em { display:block; font-style:normal; font-size:11.5px; color:var(--text3); }
      .pt-tr2 { display:grid; grid-template-columns:minmax(0, 1.15fr) minmax(0, 1fr); gap:26px; margin-top:14px; align-items:start; }
      .pt-hero { display:flex; align-items:center; gap:18px; padding:14px 16px; border-radius:12px; background:var(--bg3); border-left:4px solid ${COL.tr}; margin-bottom:16px; }
      .pt-hero small { display:block; font-size:12px; color:var(--text3); } .pt-hero b { font-size:28px; font-weight:700; font-variant-numeric:tabular-nums; color:var(--text); line-height:1.15; } .pt-hero b span { font-size:12.5px; font-weight:400; color:var(--text3); margin-left:6px; }
      .pt-hero em { display:block; font-style:normal; font-size:12px; } .pt-hero > div { flex:none; } .pt-hero p { margin:0; font-size:12px; color:var(--text2); line-height:1.45; border-left:1px solid var(--border); padding-left:16px; }
      .pt-tr2 .pt-k { gap:16px 14px; } .pt-tr2 .pt-cv { height:250px; margin-top:0; } table.pt-wrap th { white-space:normal; line-height:1.3; } table.pt-wrap td, table.pt-wrap th { padding-left:5px; padding-right:5px; } table.pt-wrap .pt-clip b { max-width:230px; } .pt-clip img, .pt-clip .ph { width:34px; height:46px; border-radius:6px; object-fit:cover; background:var(--bg3); flex:none; }
      .pt-clip div { min-width:0; } .pt-clip b { display:block; font-weight:500; max-width:300px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; } .pt-clip small { color:var(--text3); font-size:11.5px; }
      .pt-pill { font-size:11.5px; font-weight:600; border-radius:999px; padding:2px 10px; white-space:nowrap; } .pt-pill.g { background:#dcf5e7; color:#16794a; } .pt-pill.m { background:var(--bg3); color:var(--text2); } .pt-pill.r { background:#fde4e1; color:#c0392b; }
      .pt-base { display:flex; align-items:center; gap:8px; font-size:12.5px; color:var(--text2); } .pt-base select { min-width:230px; }
      @media (max-width:1250px) { .pt-c3 { grid-template-columns:1fr; } .pt-k { grid-template-columns:repeat(2, minmax(0,1fr)); } .pt-tier { grid-template-columns:1fr; } .pt-jn { grid-template-columns:repeat(2, minmax(0,1fr)); } .pt-jn::before, .pt-col::before { display:none; } .pt-tr2 { grid-template-columns:1fr; } .pt-q3 { grid-template-columns:1fr; } .pt-jr { grid-template-columns:repeat(2, minmax(0,1fr)); } .pt-js { border-left:0; padding-left:4px; } .pt-js::before { display:none; } }`;
    document.head.appendChild(s);
  }

  // เทียบกับ Baseline: dir = 1 ยิ่งสูงยิ่งดี · -1 ยิ่งต่ำยิ่งดี · mode 'pt' = ต่างเป็นจุด (ใช้กับ %)
  function cmp(v, b, dir, mode) {
    if (!(b > 0) || v == null || !isFinite(v)) return '<em>ยังไม่มี Baseline</em>';
    const d = mode === 'pt' ? v - b : (v - b) / b * 100, good = dir > 0 ? d > 0 : d < 0, flat = Math.abs(d) < (mode === 'pt' ? 0.05 : 0.5);
    if (flat) return '<em>เท่า Baseline</em>';
    return `<em class="${good ? 'pt-up' : 'pt-dn'}">${good ? 'ดีกว่า' : 'ด้อยกว่า'} Baseline ${Math.abs(d).toFixed(mode === 'pt' ? 1 : 0)}${mode === 'pt' ? ' จุด' : '%'}</em>`;
  }
  const K = (name, t, val, c) => `<div><small>${name}${tip(t)}</small><b>${val}</b>${c}</div>`;

  function model() {
    const T = D.tiers || {}, C = D.conv || {}, z = {};
    const g = (p, k) => (T[p] && T[p][k]) || {};
    const lastAds = minS(D.to, (D.latest || {}).camp || D.to), lastSales = minS(D.to, (D.latest || {}).sales || D.to);
    const nd = Math.max(1, days(D.from, lastAds)), ns = Math.max(1, num((C.cur || {}).days)), nb = Math.max(1, days(D.base_from, D.base_to)), nbs = Math.max(1, num((C.base || {}).days));
    const A = g('cur', 'aw'), Ab = g('base', 'aw'), O = g('cur', 'co'), Ob = g('base', 'co'), V = C.cur || {}, Vb = C.base || {};
    const rev = num(V.rev), r = (a, b) => b > 0 ? a / b : null;
    z.rev = rev; z.nd = nd; z.ns = ns; z.hasBase = num(Ab.sp) + num(Ob.sp) + num(Vb.cost) > 0;
    z.aw = { sp: num(A.sp), big: num(A.imp), bigDay: num(A.imp) / nd, bigBase: num(Ab.imp) / nb,
      cpm: r(num(A.sp) * 1000, num(A.imp)), cpmB: r(num(Ab.sp) * 1000, num(Ab.imp)), reach: num(A.reach) / nd, reachB: num(Ab.reach) / nb,
      freq: r(num(A.imp), num(A.reach)), freqB: r(num(Ab.imp), num(Ab.reach)), r6: r(num(A.v6) * 100, num(A.imp)), r6B: r(num(Ab.v6) * 100, num(Ab.imp)),
      cpr: r(num(A.sp) * 1000, num(A.reach)), cprB: r(num(Ab.sp) * 1000, num(Ab.reach)), camps: num(A.camps) };
    z.co = { sp: num(O.sp), big: num(O.clk), bigDay: num(O.clk) / nd, bigBase: num(Ob.clk) / nb,
      ctr: r(num(O.clk) * 100, num(O.imp)), ctrB: r(num(Ob.clk) * 100, num(Ob.imp)), cpc: r(num(O.sp), num(O.clk)), cpcB: r(num(Ob.sp), num(Ob.clk)),
      cons: num(O.cons) + num(A.cons), consDay: (num(O.cons) + num(A.cons)) / nd, consB: (num(Ob.cons) + num(Ab.cons)) / nb,
      cpcn: r(num(O.cons_sp) + num(A.cons_sp), num(O.cons) + num(A.cons)), cpcnB: r(num(Ob.cons_sp) + num(Ab.cons_sp), num(Ob.cons) + num(Ab.cons)), camps: num(O.camps) };
    z.cv = { sp: num(V.cost), big: num(V.orders), bigDay: num(V.orders) / ns, bigBase: num(Vb.orders) / nbs,
      pa: r(num(V.cost) * 100, rev), paB: r(num(Vb.cost) * 100, num(Vb.rev)), roas: r(rev, num(V.cost)), roasB: r(num(Vb.rev), num(Vb.cost)),
      ppv: r(num(V.ppv), num(V.ppv_days)), ppvB: r(num(Vb.ppv), num(Vb.ppv_days)), card: r(num(V.card) * 100, num(V.grid_rev)), cardB: r(num(Vb.card) * 100, num(Vb.grid_rev)) };
    const R = (D.traffic || {}).cur || {}, Rb = (D.traffic || {}).base || {}, rd = Math.max(1, num(R.days)), rb = Math.max(1, num(Rb.days));
    z.tr = { sp: 0, big: num(R.pv), bigDay: num(R.pv) / rd, bigBase: num(Rb.pv) / rb,
      imp: num(R.imp) / rd, impB: num(Rb.imp) / rb, ctr: r(num(R.pv) * 100, num(R.imp)), ctrB: r(num(Rb.pv) * 100, num(Rb.imp)),
      card: num(R.pv_card) / rd, cardB: num(Rb.pv_card) / rb, cvr: r(num(R.ord) * 100, num(R.pv)), cvrB: r(num(Rb.ord) * 100, num(Rb.pv)),
      vis: num(R.vis) / rd, visB: num(Rb.vis) / rb, prof: r(num(R.prof), num(R.acc_days)), profB: r(num(Rb.prof), num(Rb.acc_days)),
      fol: r(num(R.fol), num(R.fol_days)), folB: r(num(Rb.fol), num(Rb.fol_days)), vv: r(num(R.vv), num(R.acc_days)), vvB: r(num(Rb.vv), num(Rb.acc_days)) };
    z.cv.cpo = r(num(V.cost), num(V.orders)); z.cv.cpoB = r(num(Vb.cost), num(Vb.orders));
    const jv = (a, b, f) => num(a[f]) + num(b[f]), jr = num(A.jrows) + num(O.jrows) > 0;
    z.j = { has: jr, sp: z.aw.sp + z.co.sp, spB: num(Ab.sp) + num(Ob.sp), steps: [['Impressions', 'imp', 'จำนวนครั้งที่ Ads ชั้น Awareness + Consideration ถูกแสดง'], ['6s Views', 'v6', 'จำนวนครั้งที่ดู Ads ถึง 6 วินาที'],
      ['Anchor Clicks', 'ac', 'จำนวนครั้งที่กดตะกร้า / ลิงก์สินค้าในคลิป Ads'], ['Product Page Views', 'pdp', 'จำนวนครั้งที่เข้าหน้าสินค้าหลังเห็น Ads นี้ (TikTok Ads นับให้)'], ['Add to Cart', 'atc', 'จำนวนครั้งที่ใส่ตะกร้าหลังเห็น Ads นี้ (TikTok Ads นับให้)']]
      .map(([n, f, t]) => ({ n, f, t, v: jv(A, O, f), b: jv(Ab, Ob, f) })) };
    z.j.imp = z.j.steps[0].v; z.j.impB = z.j.steps[0].b; z.j.atc = z.j.steps[4].v; z.j.pdp = z.j.steps[3].v;
    z.j.cpa = r(z.j.sp, z.j.atc); z.j.cpaB = r(z.j.spB, z.j.steps[4].b);
    // ยอดรวมต้องเท่าหน้าภาพรวม TikTok: ค่า Ads สร้างการรับรู้ทั้งหมด (aw_cost) − ที่แยกชั้นได้ = ส่วนที่ยังไม่อยู่ในชั้นใด (ต่างกันจากประเภท Campaign อื่น / เวลาตัดยอดของ 2 รายงาน)
    z.lv = num(g('cur', 'lv').sp);
    z.unk = Math.max(0, num(V.aw_cost) - z.aw.sp - z.co.sp - z.lv);
    z.total = z.aw.sp + z.co.sp + z.lv + z.cv.sp + z.unk;
    z.mer = r(rev, z.total); z.merB = r(num(Vb.rev), num(Vb.cost) + num(Vb.aw_cost)); z.pctB = r((num(Vb.cost) + num(Vb.aw_cost)) * 100, num(Vb.rev));
    return z;
  }

  // สถานะเทียบ Baseline: 'g' ดีขึ้น · 'r' แย่ลง · 'm' เท่าเดิม / ยังไม่มี Baseline
  function stat(v, b, dir, mode) {
    if (!(b > 0) || v == null || !isFinite(v)) return 'm';
    const d = mode === 'pt' ? v - b : (v - b) / b * 100; if (Math.abs(d) < (mode === 'pt' ? 0.05 : 0.5)) return 'm';
    return (dir > 0 ? d > 0 : d < 0) ? 'g' : 'r';
  }
  function stage(k, M) {
    const a = M.aw, o = M.co, t = M.tr, c = M.cv, J = M.j, pdpC = J.pdp > 0 ? J.sp / J.pdp : null, pdpB = J.steps[3].b > 0 ? J.spB / J.steps[3].b : null;
    if (k === 'aw') return { name: 'Cost per 1,000 Reached', tipT: 'ค่า Ads ชั้น Awareness ต่อการถึงคน 1,000 คน (คิดจาก Reach รายวัน คนเดียวกันที่เห็นหลายวันนับซ้ำ) · ยิ่งต่ำยิ่งดี', val: a.cpr == null ? '—' : n1(a.cpr), unit: 'บาท', v: a.cpr, b: a.cprB, dir: -1,
      vol: `Reach ${n0(a.reach)} คนต่อวัน`, sup: [stat(a.cpm, a.cpmB, -1), stat(a.reach, a.reachB, 1), stat(a.r6, a.r6B, 1, 'pt')],
      ks: K('CPM', 'ค่า Ads ต่อการแสดง 1,000 ครั้ง · ยิ่งต่ำยิ่งดี', a.cpm == null ? '—' : n1(a.cpm), cmp(a.cpm, a.cpmB, -1))
        + K('Avg. Daily Reach', 'จำนวนคนที่เห็น Ads ต่อวัน (เฉลี่ย) · นับรายวันต่อ Campaign คนเดียวกันที่เห็นหลายวันหรือหลาย Campaign นับซ้ำ · ยิ่งสูงยิ่งดี', n0(a.reach), cmp(a.reach, a.reachB, 1))
        + K('6s View Rate', 'จำนวนการดูถึง 6 วินาที ÷ Impressions · ยิ่งสูงยิ่งดี', a.r6 == null ? '—' : a.r6.toFixed(1) + '%', cmp(a.r6, a.r6B, 1, 'pt')),
      act: { g: '<b>ดำเนินการต่อ</b> · เพิ่มงบประมาณให้คลิปที่ได้ผล ดี', r: '<b>ควรปรับปรุง</b> · เปลี่ยนคลิปหรือกลุ่มเป้าหมาย และหยุดคลิปที่ได้ผล ควรหยุด', m: 'ใกล้เคียง Baseline · ตรวจสอบผลรายคลิปในตารางด้านล่าง' },
      ft: `Spend ${n0(a.sp)} · ${pct(a.sp, M.rev)} ของยอดขาย · Impressions ${n0(a.big)}` };
    if (k === 'co') return { name: 'Cost per Add to Cart', tipT: 'ค่า Ads ชั้น Awareness + Consideration ÷ จำนวนครั้งที่คนใส่ตะกร้าหลังเห็น Ads นั้น (TikTok Ads นับให้) · ยิ่งต่ำยิ่งดี', val: J.cpa == null ? '—' : n2(J.cpa), unit: 'บาทต่อครั้ง', v: J.cpa, b: J.cpaB, dir: -1,
      vol: `Add to Cart ${n0(J.atc)} ครั้ง จาก Ads PR`, sup: [stat(pdpC, pdpB, -1), stat(o.cpc, o.cpcB, -1), stat(o.cpcn, o.cpcnB, -1)],
      ks: K('Cost per Product Page View', 'ค่า Ads ชั้น Awareness + Consideration ÷ จำนวนครั้งที่คนเข้าหน้าสินค้าหลังเห็น Ads นั้น (TikTok Ads นับให้) · ยิ่งต่ำยิ่งดี', pdpC == null ? '—' : n2(pdpC), cmp(pdpC, pdpB, -1))
        + K('CPC', 'ค่า Ads ชั้น Consideration ต่อ 1 คลิก · ยิ่งต่ำยิ่งดี', o.cpc == null ? '—' : n2(o.cpc), cmp(o.cpc, o.cpcB, -1))
        + K('Cost per Consideration', 'ค่า Ads ต่อคน 1 คนที่ TikTok นับว่าเข้าขั้นสนใจแบรนด์ · ยิ่งต่ำยิ่งดี', o.cpcn == null ? '—' : n2(o.cpcn), cmp(o.cpcn, o.cpcnB, -1)),
      act: { g: '<b>ดำเนินการต่อ</b> · เพิ่มคลิปแนวเดียวกัน', r: '<b>ควรปรับปรุง</b> · เปลี่ยนเนื้อหาคลิปหรือสินค้าที่ผูกกับ Ads', m: 'ใกล้เคียง Baseline · ตรวจสอบผลรายคลิปในตารางด้านล่าง' },
      ft: `Spend ${n0(o.sp)} · ${pct(o.sp, M.rev)} ของยอดขาย · Add to Cart ${n0(J.atc)} ครั้ง` };
    if (k === 'tr') return { name: 'Product Card Page Views', tipT: 'จำนวนครั้งต่อวันที่คนกดเข้าหน้าสินค้าจาก Product Card (หน้าร้าน / ค้นหา / แท็บ Shop) ไม่ได้กดจากตะกร้าในคลิปหรือ Live โดยตรง · รวมคนที่เห็น Ads แล้วกลับมาหาทีหลัง · ยิ่งสูงยิ่งดี', val: n0(t.card), unit: 'ต่อวัน', v: t.card, b: t.cardB, dir: 1,
      vol: `Product Page Views ${n0(t.bigDay)} ครั้งต่อวัน`, sup: [stat(t.bigDay, t.bigBase, 1), stat(t.cvr, t.cvrB, 1, 'pt'), stat(t.fol, t.folB, 1)],
      ks: K('Product Page Views', 'จำนวนครั้งต่อวันที่คนกดเข้าหน้าสินค้าในร้าน TikTok (เฉลี่ย) · รวมทุกแหล่ง: Product Card + คลิป + Live · ยิ่งสูงยิ่งดี', n0(t.bigDay), cmp(t.bigDay, t.bigBase, 1))
        + K('Page View → Order', 'Orders ของร้าน ÷ Product Page Views = เข้าหน้าสินค้าแล้วสั่งซื้อกี่ % · Orders นับตามที่ TikTok Shop รายงาน (รวมที่ยกเลิกภายหลัง) · ยิ่งสูงยิ่งดี', t.cvr == null ? '—' : t.cvr.toFixed(2) + '%', cmp(t.cvr, t.cvrB, 1, 'pt'))
        + K('Net New Followers', 'ผู้ติดตามที่เพิ่มขึ้นสุทธิต่อวัน (เฉลี่ย) = จำนวนผู้ติดตามวันสุดท้าย − วันแรกของช่วง ÷ จำนวนวัน · ยิ่งสูงยิ่งดี', t.fol == null ? '—' : n0(t.fol), cmp(t.fol, t.folB, 1)),
      act: { g: 'ตัวชี้วัดประกอบ · เปลี่ยนแปลงตามช่วง Campaign ด้วย จึงยังไม่ใช้ตัดสินผล', r: 'ตัวชี้วัดประกอบ · เปลี่ยนแปลงตามช่วง Campaign ด้วย จึงยังไม่ใช้ตัดสินผล', m: 'ตัวชี้วัดประกอบ · เปลี่ยนแปลงตามช่วง Campaign ด้วย จึงยังไม่ใช้ตัดสินผล' },
      ft: `ไม่มีงบ Ads ของขั้นนี้ · ข้อมูลถึง ${dTh(lastTraffic())}` };
    const started = D.to >= TEST_FROM;
    return { name: 'ยอดขายต่อค่า Ads รวม 1 บาท', tipT: 'ยอดขาย TikTok ÷ ค่า Ads TikTok รวมทุกชั้น (รวม PR) · ตัวตัดสินของการทดลอง · ยิ่งสูงยิ่งดี', val: M.mer == null ? '—' : n2(M.mer), unit: `บาท · Baseline ${M.merB == null ? '—' : n2(M.merB)}`, v: M.mer, b: M.merB, dir: 1, pill: { g: 'คุ้มค่า', r: 'ต่ำกว่า Baseline', m: 'เท่า Baseline' }, solo: true, vol: `${n0(c.big)} Orders · วันละ ${n0(c.bigDay)}`, sup: [],
      ks: K('%Ads (Conversion)', 'ค่า Ads ปิดการขาย (ไม่นับ Ads สร้างการรับรู้) ÷ ยอดขาย TikTok · ยิ่งต่ำยิ่งดี', c.pa == null ? '—' : c.pa.toFixed(1) + '%', cmp(c.pa, c.paB, -1, 'pt'))
        + K('ROAS (Conversion)', 'ยอดขาย TikTok ÷ ค่า Ads ปิดการขาย · ยิ่งสูงยิ่งดี', c.roas == null ? '—' : c.roas.toFixed(2) + 'x', cmp(c.roas, c.roasB, 1))
        + K('Cost per Order', 'ค่า Ads ปิดการขาย ÷ Orders ของ TikTok · ยิ่งต่ำยิ่งดี', c.cpo == null ? '—' : n2(c.cpo), cmp(c.cpo, c.cpoB, -1)),
      act: started && days(TEST_FROM, D.to) < 28 ? { g: `<b>ยังไม่ถึงกำหนดประเมินผล</b> · วันที่ ${days(TEST_FROM, D.to)} ของการทดลอง ประเมินผลสัปดาห์ที่ 4 และ 8`, r: `<b>ยังไม่ถึงกำหนดประเมินผล</b> · วันที่ ${days(TEST_FROM, D.to)} ของการทดลอง ประเมินผลสัปดาห์ที่ 4 และ 8`, m: `<b>ยังไม่ถึงกำหนดประเมินผล</b> · วันที่ ${days(TEST_FROM, D.to)} ของการทดลอง ประเมินผลสัปดาห์ที่ 4 และ 8` }
        : started ? { g: '<b>คุ้มค่า</b> · คงงบประมาณ PR หรือเพิ่มได้หากไม่เกินเพดาน', r: '<b>ยังไม่คุ้มค่า</b> · หากครบ 8 สัปดาห์ยังต่ำกว่า Baseline ควรลดงบประมาณ PR', m: 'เท่า Baseline · ทดลองต่อ ยังไม่เพิ่มงบประมาณ' }
        : { g: 'ผลก่อนเริ่มทดลอง · ใช้เปรียบเทียบหลังเริ่ม', r: 'ผลก่อนเริ่มทดลอง · ต่ำกว่า Baseline ตั้งแต่ก่อนเริ่ม', m: 'ผลก่อนเริ่มทดลอง' },
      ft: `Spend ${n0(c.sp)} · ${pct(c.sp, M.rev)} ของยอดขาย · Orders ${n0(c.big)}` };
  }
  const ICON = { aw: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    co: '<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>',
    tr: '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M5 12v8h14v-8"/><path d="M10 20v-5h4v5"/>',
    cv: '<path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>' };
  // ป้ายของขั้น: ตัวชี้วัดหลักเป็นตัวกำหนด · ถ้าตัวชี้วัดประกอบตั้งแต่ 2 ตัวไปทางตรงข้าม = "บางส่วน" (สีเหลือง) · ขั้นซื้อดูตัวชี้วัดหลักตัวเดียว (ตัวตัดสิน)
  function stageHtml(k, i, M) {
    const g = stage(k, M), st = stat(g.v, g.b, g.dir), opp = st === 'g' ? 'r' : st === 'r' ? 'g' : '', nOpp = g.solo || !opp ? 0 : g.sup.filter(x => x === opp).length, mix = nOpp >= 2;
    const pl = g.pill || { g: 'ดีขึ้น', r: 'ลดลง', m: 'คงที่' }, pc = mix ? 'a' : st, pt = !(g.b > 0) ? 'ยังไม่มี Baseline' : mix ? pl[st] + 'บางส่วน' : pl[st];
    const act = mix && k !== 'tr' ? (st === 'g' ? `<b>ควรตรวจสอบก่อนเพิ่มงบประมาณ</b> · ตัวชี้วัดหลักดีขึ้น แต่ตัวชี้วัดประกอบ ${nOpp} ตัวลดลง ตรวจสอบราย Campaign ในตารางด้านล่าง` : `<b>ควรปรับปรุง</b> · ตัวชี้วัดหลักลดลง แม้ตัวชี้วัดประกอบ ${nOpp} ตัวดีขึ้น ตรวจสอบราย Campaign ในตารางด้านล่าง`) : g.act[st];
    return `<div class="pt-col" style="--c:${COL[k]}"><div class="pt-nd"><i><svg viewBox="0 0 24 24">${ICON[k]}</svg></i><b>${i + 1} · ${TIER[k][0]}<small>${TIER[k][1]}</small></b><span>${g.vol}</span></div>
      <button type="button" class="pt-sg" data-tier="${k}" aria-pressed="${sel === k}">
      <div class="hd"><div class="hl"><span>${g.name}${tip(g.tipT)}</span><span class="pt-pill ${pc}">${pt}</span></div><div class="hv">${g.val}<span>${g.unit}</span></div>${cmp(g.v, g.b, g.dir)}</div>
      <div class="pt-k">${g.ks.replace(/(ดีกว่า|ด้อยกว่า) Baseline /g, '$1 ')}</div><div class="act">${act}</div><div class="ft">${g.ft}</div></button></div>`;
  }
  function capBar(M, over) {
    const started = D.to >= TEST_FROM, ok = over <= CAP;
    return `<div class="pt-card pt-sum"><div class="pt-bar2">
      <div><div class="pt-t">ค่า Ads TikTok รวมต่อยอดขาย ${tip('ค่า Ads TikTok ทุกชั้นรวมกัน (รวม PR) ÷ ยอดขาย TikTok ช่วงเดียวกัน · เพดาน ' + CAP + '% · ยิ่งต่ำยิ่งดี\nPR = Ads ชั้น Awareness + Consideration · Live = Ads ที่พาคนเข้า Live (ไม่นับเป็น PR) · Conversion = Ads ปิดการขาย')}</div>
        <div class="pt-cap"><b class="${ok ? 'pt-up' : 'pt-dn'}">${M.rev > 0 ? over.toFixed(1) + '%' : '—'}</b><span>เพดาน ${CAP}% · ${ok ? 'ต่ำกว่า ' + (CAP - over).toFixed(1) : 'เกิน ' + (over - CAP).toFixed(1)} จุด · PR ${pct(M.aw.sp + M.co.sp + M.unk, M.rev)}${M.lv > 0 ? ' + Live ' + pct(M.lv, M.rev) : ''} + Conversion ${pct(M.cv.sp, M.rev)} · ยอดขาย TikTok ${n0(M.rev)}</span></div></div>
      <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap;">
        <span class="pt-st">${started ? 'วันที่ ' + days(TEST_FROM, D.to) + ' ของการทดลอง' : 'ก่อนเริ่มทดลอง · เริ่ม ' + dTh(TEST_FROM)}</span>
        <label class="pt-base">Baseline ${tip('ค่าเฉลี่ยของช่วงที่เลือก ใช้เปรียบเทียบว่าช่วงที่เลือกดีขึ้นหรือลดลง\nก่อนทดลอง = ช่วงตายตัวก่อนเริ่มทดลอง (แนะนำระหว่างทดลอง)\n60 วันก่อนหน้า = เลื่อนตามช่วงที่ดู')}
          <select id="ptBase"><option value="pre"${baseMode === 'pre' ? ' selected' : ''}>ก่อนทดลอง (${dTh(PRE.from)} – ${dTh(PRE.to)})</option><option value="roll"${baseMode === 'roll' ? ' selected' : ''}>60 วันก่อนช่วงที่ดู</option></select></label></div></div></div>`;
  }
  function lastTraffic() { const a = (D.tdaily || []).filter(r => num(r[1]) + num(r[2]) + num(r[3]) > 0).map(r => r[0]); return a.length ? a[a.length - 1] : D.to; }

  function verdict(k, c) {
    const th = (D.th || {})[k] || {}, f = (v, d) => v == null ? '—' : num(v).toFixed(d);
    if (k === 'aw') { const cpm = c.imp > 0 ? c.sp / c.imp * 1000 : null, r6 = c.imp > 0 ? c.v6 / c.imp * 100 : null; if (cpm == null) return 'm';
      return cpm < th.cpm_good && r6 > th.r6_good ? 'g' : cpm > th.cpm_bad && r6 < th.r6_bad ? 'r' : 'm'; }
    if (k === 'co') { const cpc = c.clk > 0 ? c.sp / c.clk : null, ctr = c.imp > 0 ? c.clk / c.imp * 100 : null; if (cpc == null) return 'm';
      return cpc < th.cpc_good && ctr > th.ctr_good ? 'g' : cpc > th.cpc_bad && ctr < th.ctr_bad ? 'r' : 'm'; }
    const ro = c.gc > 0 ? c.gr / c.gc : null; if (ro == null) return 'm';
    return ro > th.roas_good ? 'g' : ro < th.roas_bad ? 'r' : 'm';
  }
  function ruleTip(k) {
    const th = (D.th || {})[k] || {}, src = `ที่มา: คลิปของเราเอง ${n0(th.n)} คลิปที่ Spend 1,000 ขึ้นไป ช่วง ${dTh(D.th.from)} – ${dTh(D.th.to)} · ดี = ดีกว่า 3 ใน 4 ของคลิปทั้งหมด · ควรหยุด = ด้อยกว่าครึ่งหนึ่ง`;
    if (k === 'aw') return `ดี = CPM ต่ำกว่า ${th.cpm_good} บาท และ 6s View Rate สูงกว่า ${th.r6_good}%\nควรหยุด = CPM สูงกว่า ${th.cpm_bad} บาท และ 6s View Rate ต่ำกว่า ${th.r6_bad}%\nพอใช้ = นอกเหนือจาก 2 กรณีนี้\n${src}`;
    if (k === 'co') return `ดี = CPC ต่ำกว่า ${th.cpc_good} บาท และ CTR สูงกว่า ${th.ctr_good}%\nควรหยุด = CPC สูงกว่า ${th.cpc_bad} บาท และ CTR ต่ำกว่า ${th.ctr_bad}%\nพอใช้ = นอกเหนือจาก 2 กรณีนี้\n${src}`;
    return `ดี = ROAS ของคลิปสูงกว่า ${th.roas_good}x\nควรหยุด = ROAS ของคลิปต่ำกว่า ${th.roas_bad}x\nพอใช้ = อยู่ระหว่าง 2 ค่านี้\n${src}`;
  }
  const PILL = { g: ['g', 'ดี'], m: ['m', 'พอใช้'], r: ['r', 'ควรหยุด'] };
  function clipCell(c) {
    const img = c.cv ? `<img src="${esc(c.cv)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span class="ph"></span>';
    return `<div class="pt-clip">${img}<div><b title="${esc(c.t)}">${esc(c.t || 'คลิป …' + String(c.id).slice(-6))}</b><small>${esc(c.a || '')}</small></div></div>`;
  }
  // ป้ายราย Campaign: เทียบต้นทุนของ Campaign กับค่าเฉลี่ยของขั้นเดียวกันในช่วงที่ดู (ถูกกว่าตั้งแต่ 20% = ดี · แพงกว่าตั้งแต่ 25% = ควรทบทวน)
  function drawCamps(M) {
    const box = $('ptCampCard'); if (!box) return;
    if (sel !== 'aw' && sel !== 'co') { box.style.display = 'none'; return; }
    box.style.display = '';
    const list = (D.camps || []).filter(c => c.tr === sel), dash = '—', aw = sel === 'aw';
    const avg = aw ? M.aw.cpr : M.j.cpa, pill = (c, t) => `<span class="pt-pill ${c}">${t}</span>`;
    const rule = `เทียบ${aw ? ' Cost per 1,000 Reached' : ' Cost per Add to Cart'} ของ Campaign กับค่าเฉลี่ยของขั้นนี้ในช่วงที่ดู (${avg == null ? '—' : aw ? n1(avg) : n2(avg)})\nดี = ถูกกว่าค่าเฉลี่ยตั้งแต่ 20%\nควรทบทวน = แพงกว่าค่าเฉลี่ยตั้งแต่ 25%${aw ? '' : ' หรือไม่มี Add to Cart เลย'}\nพอใช้ = อยู่ระหว่างนั้น`;
    const vd = x => avg == null || x == null ? ['m', 'พอใช้'] : x <= avg * 0.8 ? ['g', 'ดี'] : x >= avg * 1.25 ? ['r', 'ควรทบทวน'] : ['m', 'พอใช้'];
    const name = c => `<div class="pt-cn"><b title="${esc(c.n)}">${esc(c.n || 'Campaign …' + String(c.id).slice(-6))}</b><small>${esc(OBJ[c.obj] || c.obj || '')} · ${esc(ADV[c.adv] || '')} · ${n0(c.days)} วัน</small></div>`;
    const row = (c, cells) => `<tr class="pt-row" data-cid="${esc(c.id)}" aria-selected="${selCamp === c.id}">${cells}</tr>`;
    let head, rows;
    if (aw) {
      head = `<th>Campaign</th><th>Spend</th><th>Reach / วัน ${tip('จำนวนคนที่เห็น Ads ของ Campaign นี้ต่อวัน (เฉลี่ยเฉพาะวันที่ Campaign ทำงาน)')}</th><th>Cost per 1,000 Reached ${tip('Spend ÷ Reach × 1,000 · ยิ่งต่ำยิ่งดี')}</th><th>6s View Rate ${tip('การดูถึง 6 วินาที ÷ Impressions · ยิ่งสูงยิ่งดี')}</th><th>Product Page Views ${tip('จำนวนครั้งที่คนเข้าหน้าสินค้าหลังเห็น Ads ของ Campaign นี้ (TikTok Ads นับให้)')}</th><th>Add to Cart ${tip('จำนวนครั้งที่คนใส่ตะกร้าหลังเห็น Ads ของ Campaign นี้ (TikTok Ads นับให้)')}</th><th>ผล ${tip(rule)}</th>`;
      rows = list.map(c => { const cpr = c.reach > 0 ? c.sp / c.reach * 1000 : null, v = vd(cpr);
        return row(c, `<td>${name(c)}</td><td>${n0(c.sp)}</td><td>${n0(num(c.reach) / Math.max(1, num(c.days)))}</td><td>${cpr == null ? dash : n1(cpr)}</td><td>${c.imp > 0 ? (c.v6 / c.imp * 100).toFixed(1) + '%' : dash}</td><td>${n0(c.pdp)}</td><td>${n0(c.atc)}</td><td>${pill(v[0], v[1])}</td>`); });
    } else {
      head = `<th>Campaign</th><th>Spend</th><th>Clicks</th><th>CPC ${tip('Spend ÷ Clicks · ยิ่งต่ำยิ่งดี')}</th><th>Product Page Views ${tip('จำนวนครั้งที่คนเข้าหน้าสินค้าหลังเห็น Ads ของ Campaign นี้ (TikTok Ads นับให้)')}</th><th>Add to Cart ${tip('จำนวนครั้งที่คนใส่ตะกร้าหลังเห็น Ads ของ Campaign นี้ (TikTok Ads นับให้)')}</th><th>Cost per Add to Cart ${tip('Spend ÷ Add to Cart · ยิ่งต่ำยิ่งดี')}</th><th>ผล ${tip(rule)}</th>`;
      rows = list.map(c => { const cpa = c.atc > 0 ? c.sp / c.atc : null, v = cpa == null ? ['r', 'ควรทบทวน'] : vd(cpa);
        return row(c, `<td>${name(c)}</td><td>${n0(c.sp)}</td><td>${n0(c.clk)}</td><td>${c.clk > 0 ? n2(c.sp / c.clk) : dash}</td><td>${n0(c.pdp)}</td><td>${n0(c.atc)}</td><td>${cpa == null ? dash : n2(cpa)}</td><td>${pill(v[0], v[1])}</td>`); });
    }
    $('ptCampT').innerHTML = `Campaign ของขั้น ${STG[sel]}`;
    $('ptCampS').textContent = `${list.length} Campaign ที่มี Spend ในช่วงนี้ · เรียงตาม Spend · เลือก Campaign เพื่อแสดงเฉพาะคลิปของ Campaign นั้น เลือกซ้ำเพื่อยกเลิก`;
    $('ptCampBox').innerHTML = `<table class="pt-tbl" id="tblPtCamps" data-no-page><thead><tr>${head}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:22px;">ช่วงนี้ยังไม่มี Campaign ของขั้นนี้</td></tr>`}</tbody></table>`;
    $('ptCampBox').querySelectorAll('tr.pt-row').forEach(r => r.addEventListener('click', e => { if (e.target.closest('.pt-i')) return; selCamp = selCamp === r.dataset.cid ? null : r.dataset.cid; drawCamps(M); drawTable(); }));
  }
  function drawTable() {
    const camp = (sel === 'aw' || sel === 'co') && selCamp ? (D.camps || []).find(c => c.id === selCamp) : null;
    const list = ((D.clips || {})[sel] || []).filter(c => camp ? c.cid === selCamp && num(c.sp) >= 100 : num(sel === 'cv' ? c.gc : c.sp) >= 1000), dash = '—';
    const gm = c => num(c.gc) > 0 ? `${n0(c.gr)} · ${n0(c.go)} Orders` : dash;
    let head, rows;
    if (sel === 'tr') { drawProducts(); return; }
    if (sel === 'cv') {
      head = `<th>คลิป</th><th>Spend</th><th>GMV ${tip('ยอดขายที่ TikTok นับให้คลิปนี้ใน Ads ปิดการขาย (GMV Max)')}</th><th>Orders</th><th>ROAS ${tip('GMV ÷ Spend ของคลิปนี้ · ยิ่งสูงยิ่งดี')}</th><th>ผล ${tip(ruleTip('cv'))}</th>`;
      rows = list.map(c => { const v = PILL[verdict('cv', c)]; return `<tr><td>${clipCell(c)}</td><td>${n0(c.gc)}</td><td>${n0(c.gr)}</td><td>${n0(c.go)}</td><td>${c.gc > 0 ? (c.gr / c.gc).toFixed(2) + 'x' : dash}</td><td><span class="pt-pill ${v[0]}">${v[1]}</span></td></tr>`; });
    } else if (sel === 'aw') {
      head = `<th>คลิป</th><th>Spend</th><th>Impressions</th><th>CPM ${tip('ค่า Ads ต่อการแสดง 1,000 ครั้ง · ยิ่งต่ำยิ่งดี')}</th><th>6s View Rate ${tip('การดูถึง 6 วินาที ÷ Impressions · ยิ่งสูงยิ่งดี')}</th><th>Profile Visits ${tip('จำนวนครั้งที่คนกดเข้าโปรไฟล์จาก Ads นี้')}</th><th>GMV (Conversion Ads) ${tip('ยอดและออเดอร์ของคลิปเดียวกันใน Ads ปิดการขาย (GMV Max) ช่วงเดียวกัน')}</th><th>ผล ${tip(ruleTip('aw'))}</th>`;
      rows = list.map(c => { const v = PILL[verdict('aw', c)]; return `<tr><td>${clipCell(c)}</td><td>${n0(c.sp)}</td><td>${n0(c.imp)}</td><td>${c.imp > 0 ? n1(c.sp / c.imp * 1000) : dash}</td><td>${c.imp > 0 ? (c.v6 / c.imp * 100).toFixed(1) + '%' : dash}</td><td>${n0(c.pv)}</td><td>${gm(c)}</td><td><span class="pt-pill ${v[0]}">${v[1]}</span></td></tr>`; });
    } else {
      head = `<th>คลิป</th><th>Spend</th><th>Impressions</th><th>Clicks</th><th>CTR ${tip('Clicks ÷ Impressions · ยิ่งสูงยิ่งดี')}</th><th>CPC ${tip('ค่า Ads ต่อ 1 คลิก · ยิ่งต่ำยิ่งดี')}</th><th>Profile Visits ${tip('จำนวนครั้งที่คนกดเข้าโปรไฟล์จาก Ads นี้')}</th><th>GMV (Conversion Ads) ${tip('ยอดและออเดอร์ของคลิปเดียวกันใน Ads ปิดการขาย (GMV Max) ช่วงเดียวกัน')}</th><th>ผล ${tip(ruleTip('co'))}</th>`;
      rows = list.map(c => { const v = PILL[verdict('co', c)]; return `<tr><td>${clipCell(c)}</td><td>${n0(c.sp)}</td><td>${n0(c.imp)}</td><td>${n0(c.clk)}</td><td>${c.imp > 0 ? (c.clk / c.imp * 100).toFixed(2) + '%' : dash}</td><td>${c.clk > 0 ? n2(c.sp / c.clk) : dash}</td><td>${n0(c.pv)}</td><td>${gm(c)}</td><td><span class="pt-pill ${v[0]}">${v[1]}</span></td></tr>`; });
    }
    $('ptClipT').innerHTML = `คลิปของขั้น ${STG[sel]}` + (camp ? `<span class="pt-chip" title="${esc(camp.n)}">Campaign: ${esc(String(camp.n).length > 44 ? String(camp.n).slice(0, 44) + '…' : camp.n)}</span><button type="button" class="pt-x" id="ptCampX">× แสดงทุก Campaign</button>` : '');
    $('ptClipS').textContent = camp ? `คลิปของ Campaign นี้ที่ Spend 100 ขึ้นไปในช่วงนี้ · ${list.length} คลิป · คลิปผูกกับ Campaign ล่าสุดที่ใช้คลิปนั้น`
      : `คลิปที่ Spend 1,000 ขึ้นไปในช่วงนี้ · ${list.length} คลิป` + (sel === 'cv' ? ' · เลือกขั้นอื่นด้านบนเพื่อเปลี่ยน' : ' · เลือก Campaign ด้านบนเพื่อแสดงเฉพาะคลิปของ Campaign นั้น · ขั้นของคลิปดูจาก Campaign ล่าสุดที่ใช้คลิปนั้น');
    $('ptTblBox').innerHTML = `<table class="pt-tbl" id="tblPtClips"><thead><tr>${head}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:22px;">ช่วงนี้ยังไม่มีคลิปที่ Spend ถึงเกณฑ์</td></tr>`}</tbody></table>`;
    const x = $('ptCampX'); if (x) x.addEventListener('click', () => { selCamp = null; drawCamps(model()); drawTable(); });
  }

  function drawProducts() {
    const P = D.prods || {}, cd = Math.max(1, num(P.cur_days)), bd = Math.max(1, num(P.base_days)), dash = '—';
    const list = P.rows || [];
    const head = `<th>สินค้า (ตะกร้า)</th><th>Page Views / วัน ${tip('จำนวนครั้งที่คนกดเข้าหน้าสินค้านี้ต่อวัน (เฉลี่ย ทุกแหล่ง)')}</th><th>เทียบ Baseline ${tip('Page Views ต่อวันของช่วงที่ดู เทียบกับค่าเฉลี่ยต่อวันของช่วง Baseline · ยิ่งสูงยิ่งดี')}</th><th>Impressions / วัน ${tip('จำนวนครั้งที่สินค้านี้ถูกแสดงต่อวัน (เฉลี่ย)')}</th><th>CTR ${tip('Page Views ÷ Impressions ของสินค้านี้ · ยิ่งสูงยิ่งดี')}</th><th>Product Card / วัน ${tip('Page Views ที่มาจากการ์ดสินค้า (หน้าร้าน / ค้นหา) ต่อวัน = คนตั้งใจมาหาเอง')}</th><th>Orders / วัน</th><th>Page View → Order ${tip('Orders ÷ Page Views ของสินค้านี้ · ยิ่งสูงยิ่งดี')}</th><th>แนวโน้ม ${tip('เทียบ Page Views ต่อวันกับ Baseline\nเพิ่มขึ้น = สูงกว่า Baseline ตั้งแต่ 10%\nลดลง = ต่ำกว่า Baseline ตั้งแต่ 10%\nทรงตัว = ต่างไม่ถึง 10%\nใหม่ = ช่วง Baseline ยังไม่มีข้อมูลของตะกร้านี้')}</th>`;
    const rows = list.map(c => { const pv = num(c.pv) / cd, bp = num(c.b_pv) / bd, ch = bp > 0 ? (pv - bp) / bp * 100 : null;
      const v = ch == null ? ['m', 'ใหม่'] : ch >= 10 ? ['g', 'เพิ่มขึ้น'] : ch <= -10 ? ['r', 'ลดลง'] : ['m', 'ทรงตัว'];
      const img = c.img ? `<img src="${esc(c.img)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span class="ph"></span>';
      return `<tr><td><div class="pt-clip sq">${img}<div><b title="${esc(c.t)}">${esc(c.t || 'สินค้า …' + String(c.id).slice(-6))}</b><small>${esc(c.sku || '')}</small></div></div></td><td>${n0(pv)}</td>
        <td>${ch == null ? dash : `<span class="${ch >= 0.5 ? 'pt-up' : ch <= -0.5 ? 'pt-dn' : ''}">${ch > 0 ? '+' : ''}${ch.toFixed(0)}%</span>`}</td><td>${n0(num(c.imp) / cd)}</td><td>${c.imp > 0 ? (c.pv / c.imp * 100).toFixed(2) + '%' : dash}</td>
        <td>${n0(num(c.pvc) / cd)}</td><td>${n1(num(c.ord) / cd)}</td><td>${c.pv > 0 ? (num(c.ord) / c.pv * 100).toFixed(2) + '%' : dash}</td><td><span class="pt-pill ${v[0]}">${v[1]}</span></td></tr>`; });
    $('ptClipT').innerHTML = `สินค้าที่คนกดเข้าดู`;
    $('ptClipS').textContent = `${list.length} ตะกร้าที่ Page Views สูงสุดของช่วงนี้ · เฉพาะตะกร้าของร้านเอง · ข้อมูลถึง ${P.latest ? dTh(P.latest) : '—'} · เลือกขั้นอื่นด้านบนเพื่อเปลี่ยน`;
    $('ptTblBox').innerHTML = `<table class="pt-tbl pt-wrap" id="tblPtClips"><thead><tr>${head}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="9" style="text-align:center;color:var(--text3);padding:22px;">ช่วงนี้ยังไม่มีข้อมูลรายสินค้า</td></tr>`}</tbody></table>`;
  }

  function chartTr(id, labels, sets, base) {
    const cv = $(id); if (!cv || !window.Chart) return;
    if (charts[id]) { try { charts[id].destroy(); } catch (e) {} }
    const st = getComputedStyle(document.body), tx = st.getPropertyValue('--text3').trim() || '#9ca3af';
    const ds = sets.map(([label, data, color], i) => ({ label, data, borderColor: color, backgroundColor: color, tension: .3, pointRadius: i ? 0 : 2.5, borderWidth: i ? 1.8 : 2.4, yAxisID: 'y', spanGaps: false }));
    if (base > 0) ds.push({ label: 'Baseline Product Card', data: labels.map(() => base), borderColor: COL.base, borderDash: [6, 5], pointRadius: 0, borderWidth: 1.6, yAxisID: 'y' });
    charts[id] = new Chart(cv, { type: 'line', data: { labels, datasets: ds }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { itemSort: (a, b) => b.raw - a.raw, callbacks: { label: c => ` ${c.dataset.label}  ${n0(c.raw)}` } } },
      scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: tx, maxRotation: 0, autoSkip: true, font: { family: 'Sarabun', size: 10.5 } } },
        y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(127,127,127,.12)' }, ticks: { color: tx, maxTicksLimit: 5, font: { family: 'Sarabun', size: 10.5 }, callback: v => n0(v) } } } } });
  }

  function chart(id, labels, main, base, cost, color, fmtY) {
    const cv = $(id); if (!cv || !window.Chart) return;
    if (charts[id]) { try { charts[id].destroy(); } catch (e) {} }
    const st = getComputedStyle(document.body), tx = st.getPropertyValue('--text3').trim() || '#9ca3af';
    const ds = [{ label: 'main', data: main, borderColor: color, backgroundColor: color, tension: .3, pointRadius: 2.5, borderWidth: 2.4, yAxisID: 'y', spanGaps: false },
      { label: 'Spend', data: cost, borderColor: COL.ads, backgroundColor: 'transparent', tension: .3, pointRadius: 0, borderWidth: 1.7, yAxisID: 'y1' }];
    if (base > 0) ds.push({ label: 'Baseline', data: labels.map(() => base), borderColor: COL.base, borderDash: [6, 5], pointRadius: 0, borderWidth: 1.6, yAxisID: 'y' });
    charts[id] = new Chart(cv, { type: 'line', data: { labels, datasets: ds }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.dataset.label === 'main' ? fmtY : c.dataset.label}  ${n0(c.raw)}` } } },
      scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: tx, maxRotation: 0, autoSkip: true, font: { family: 'Sarabun', size: 10.5 } } },
        y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(127,127,127,.12)' }, ticks: { color: color, maxTicksLimit: 5, font: { family: 'Sarabun', size: 10.5 }, callback: v => n0(v) } },
        y1: { beginAtZero: true, position: 'right', border: { display: false }, grid: { display: false }, ticks: { color: COL.ads, maxTicksLimit: 5, font: { family: 'Sarabun', size: 10.5 }, callback: v => n0(v) } } } } });
  }
  function drawChart(M) {
    const mo = D.gran === 'month', rows = D.daily || [], lastAds = (D.latest || {}).camp || D.to, lastSales = (D.latest || {}).sales || D.to;
    const lbl = b => mo ? `${TH_M[+b.slice(5, 7) - 1]} ${(+b.slice(0, 4) + 543) % 100}` : `${+b.slice(8, 10)} ${TH_M[+b.slice(5, 7) - 1]}`;
    const cut = (r, last, v) => (!mo && r[0] > last ? null : v), per = mo ? 30 : 1, unitT = mo ? 'เดือน (30 วัน)' : 'วัน';
    const up = (arr, b) => { const a = arr.filter(v => v != null); return b > 0 ? `สูงกว่า Baseline <b>${a.filter(v => v >= b).length} จาก ${a.length} ${mo ? 'เดือน' : 'วัน'}</b>` : 'ยังไม่มี Baseline ของช่วงนี้'; };
    $('ptChT').innerHTML = `แนวโน้ม${mo ? 'รายเดือน' : 'รายวัน'} · ${STG[sel]} · ${UNIT[sel]} ${tip('ช่วงที่เลือกไม่เกิน 1 เดือน = รายวัน · เกิน 1 เดือน = รายเดือน\nเส้นสี = ผลของขั้นนั้น · เส้นประเทา = Baseline · เส้นแดง = Spend ของขั้นนั้น (แกนขวา)\nขั้นเข้าร้านไม่มี Spend ของตัวเอง แสดง Page Views แยก 3 แหล่ง: Product Card / คลิป / Live')}`;
    if (sel === 'tr') {
      const tr = D.tdaily || [], has = r => num(r[1]) + num(r[2]) + num(r[3]) > 0, tcut = (r, v) => (has(r) ? v : null), card = tr.map(r => tcut(r, r[3])), cb = M.tr.cardB * per;
      chartTr('ptCh', tr.map(r => lbl(r[0])), [['Product Card', card, COL.tr], ['คลิป', tr.map(r => tcut(r, r[2])), COL.vid], ['Live', tr.map(r => tcut(r, r[1])), COL.live]], cb);
      $('ptLg').innerHTML = `<span><i style="background:${COL.tr}"></i>Product Card</span><span><i style="background:${COL.vid}"></i>คลิป</span><span><i style="background:${COL.live}"></i>Live</span><span><i class="d"></i>Baseline Product Card ${n0(cb)} ต่อ${unitT}</span>`;
      $('ptVd').innerHTML = 'Product Card ' + up(card, cb); return;
    }
    const set = { aw: [rows.map(r => cut(r, lastAds, r[2])), M.aw.bigBase * per, rows.map(r => cut(r, lastAds, r[1]))],
      co: [rows.map(r => cut(r, lastAds, r[6])), M.co.bigBase * per, rows.map(r => cut(r, lastAds, r[5]))],
      cv: [rows.map(r => cut(r, lastSales, r[9])), M.cv.bigBase * per, rows.map(r => cut(r, lastSales, r[8]))] }[sel];
    chart('ptCh', rows.map(r => lbl(r[0])), set[0], set[1], set[2], COL[sel], UNIT[sel]);
    $('ptLg').innerHTML = `<span><i style="background:${COL[sel]}"></i>${UNIT[sel]}</span><span><i class="d"></i>Baseline ${n0(set[1])} ต่อ${unitT}</span><span><i style="background:${COL.ads}"></i>Spend (แกนขวา)</span>`;
    $('ptVd').innerHTML = up(set[0], set[1]);
  }

  function draw() {
    const M = model(), over = M.rev > 0 ? M.total / M.rev * 100 : 0, root = $('prtest-root');
    root.innerHTML = `
      ${capBar(M, over)}
      <div class="pt-hd2"><div><div class="pt-t">Customer Journey · ตั้งแต่เห็น Ads จนถึงสั่งซื้อ ${tip('อ่านจากซ้ายไปขวา ขั้นละ 1 ตัวเลขหลัก เทียบกับ Baseline\nเห็น + สนใจ = ผลของ Ads PR โดยตรง · เข้าร้าน = ตัวชี้วัดประกอบ · ซื้อ = ตัวตัดสินว่าคุ้มไหม\nป้ายของขั้น: ดูตัวเลขหลักเป็นตัวกำหนด ถ้าตัวชี้วัดประกอบตั้งแต่ 2 ใน 3 ตัวไปทางตรงข้าม จะขึ้นป้ายสีเหลืองว่า บางส่วน\nเลือกขั้นเพื่อดูกราฟรายวัน Campaign และคลิปของขั้นนั้นด้านล่าง')}</div>
        <div class="pt-s">Baseline ที่ใช้: ${dTh(D.base_from)} – ${dTh(D.base_to)}${M.hasBase ? '' : ' (ยังไม่มีข้อมูลของช่วงนี้)'} · ข้อมูล Ads ถึง ${dTh((D.latest || {}).camp || D.to)} · เลือกขั้นเพื่อดูรายละเอียดด้านล่าง</div></div></div>
      <div class="pt-jn">${ORDER.map((k, i) => stageHtml(k, i, M)).join('')}</div>
      <div class="pt-card"><div class="pt-t" id="ptChT"></div><div class="pt-cv"><canvas id="ptCh"></canvas></div><div class="pt-lg" id="ptLg"></div><div class="pt-vd" id="ptVd"></div></div>
      <div class="pt-card" id="ptCampCard"><div class="pt-t" id="ptCampT"></div><div class="pt-s" id="ptCampS"></div><div id="ptCampBox" style="overflow-x:auto;"></div></div>
      <div class="pt-card"><div class="pt-t" id="ptClipT"></div><div class="pt-s" id="ptClipS"></div><div id="ptTblBox" style="overflow-x:auto;"></div></div>`;
    drawChart(M); drawCamps(M); drawTable();
    root.querySelectorAll('.pt-sg').forEach(b => b.addEventListener('click', () => { sel = b.dataset.tier; root.querySelectorAll('.pt-sg').forEach(x => x.setAttribute('aria-pressed', x.dataset.tier === sel)); selCamp = null; drawChart(M); drawCamps(M); drawTable(); }));
    $('ptBase').addEventListener('change', e => { baseMode = e.target.value; KEY = ''; render(); });
    if (window.UI && UI.fit) UI.fit();
  }

  async function render() {
    css();
    const root = $('prtest-root'); if (!root) return;
    const from = ($('dateFrom') || {}).value, to = ($('dateTo') || {}).value; if (!from || !to) return;
    const base = baseMode === 'pre' ? PRE : { from: addD(from, -60), to: addD(from, -1) };
    const key = [from, to, base.from, base.to].join('|');
    if (key === KEY && D) { draw(); return; }
    if (!D) root.innerHTML = '<div class="pt-card" style="min-height:420px;display:flex;align-items:center;justify-content:center;color:var(--text3);">กำลังโหลด…</div>';
    const my = ++seq;
    try {
      const d = await supaRpc('pr_test_page', { p_from: from, p_to: to, p_base_from: base.from, p_base_to: base.to });
      if (my !== seq) return;
      D = d; KEY = key; draw();
    } catch (e) {
      if (my !== seq) return;
      root.innerHTML = `<div class="pt-card"><div class="ui-empty"><b>โหลดข้อมูลไม่สำเร็จ</b>${esc(e.message || e)}</div></div>`;
    }
  }
  window.prTest = { render, reload: () => { KEY = ''; render(); } };
})();
