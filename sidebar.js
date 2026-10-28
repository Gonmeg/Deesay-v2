// sidebar.js (v20261028b) — เมนูมูลค่าสินค้าคงคลัง · — กันพังเมื่อไม่มีกล่องชื่อผู้ใช้ · — เมนูเป็น <div role="navigation"> แทนแท็ก <nav> (หน้า admin ซ่อนแท็ก nav ทั้งหมดด้วย !important ทำให้เมนูหายทั้งแถบ)
// sidebar.js (v20261026a) — เมนูซ้ายกลาง ใช้ร่วมทุกหน้า: dashboard / upload / admin / health
// วาง <div id="sbMount" data-page="dashboard|upload|admin|health" data-build="v…"></div> แล้วตามด้วย <script src="sidebar.js"></script>
// · ขยาย 208px / ย่อเหลือไอคอน 64px (ปุ่ม « มุมบน · จำค่าไว้ใน localStorage 'sbMini' ใช้ทุกหน้า) · จอแคบกว่า 760px ย่ออัตโนมัติ
// · ตอนย่อ: ชี้ไอคอน = ชื่อเมนู · ชี้กลุ่ม (Facebook / TikTok / Shopee / MT) = เมนูย่อยลอยออกมาให้กด
// · ไอคอนกลุ่มช่องทางใช้สี CI จาก ui.css (--ch-facebook / --ch-tiktok / --ch-shopee / --ch-mt)
// · บน dashboard สร้างโครงเดิมครบ (class / id / onclick="showPage(…)" / navGroup-* / exec-only / id ปุ่มท้ายเมนู)
//   โค้ดเดิมของ dashboard (สิทธิ์ผู้ใช้ · เปลี่ยนหน้า · รีเฟรชข้อมูล · มีอะไรใหม่ · โหมดมืด) จึงทำงานเหมือนเดิม
// · หน้าอื่น: เมนูหน้า dashboard เป็นลิงก์ dashboard.html?page=… · ปุ่มเดิมของหน้า (ธีม / ออกจากระบบ / แท็บ admin) ซ่อนไว้ แล้วให้เมนูนี้กดแทน
(function () {
  const M = document.getElementById('sbMount');
  if (!M) return;
  const PAGE = M.dataset.page || 'dashboard', DASH = PAGE === 'dashboard', BUILD = M.dataset.build || '';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const I = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    chart: '<path d="M3 21h18"/><path d="M6 17v-6"/><path d="M11 17V6"/><path d="M16 17v-4"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r=".6"/>',
    fb: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
    tt: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
    bag: '<path d="M6 7h12l1 14H5L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    store: '<path d="M3 9l2-5h14l2 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
    mega: '<path d="M3 11v2a1 1 0 0 0 1 1h3l6 5V5L7 10H4a1 1 0 0 0-1 1z"/><path d="M17 8a5 5 0 0 1 0 8"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M22 20c0-2.6-1.6-4.6-4-5.5"/>',
    box: '<path d="M12 3l9 5v8l-9 5-9-5V8l9-5z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    pct: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3z"/><path d="M9 8h6M9 12h6"/>',
    spark: '<path d="M12 3l1.8 4.7 4.7 1.8-4.7 1.8L12 16l-1.8-4.7-4.7-1.8 4.7-1.8L12 3z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z"/>',
    upload: '<path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 20h16"/>',
    sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
    heart: '<path d="M20.8 8.6a5 5 0 0 0-8.8-3.2 5 5 0 0 0-8.8 3.2c0 5.4 8.8 11.4 8.8 11.4s8.8-6 8.8-11.4z"/><path d="M3.5 12h4l2-3 3 6 2-3h6"/>',
    ext: '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>',
    back: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    logout: '<path d="M15 4h4v16h-4"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h10"/>',
    collapse: '<path d="M11 6l-6 6 6 6"/><path d="M19 6l-6 6 6 6"/>',
  };
  const svg = k => `<svg class="sb-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k] || ''}</svg>`;

  // ── เมนู (แหล่งเดียวของทุกหน้า · เพิ่มหน้าใหม่ที่นี่) ──
  const MENU = [
    ['home', 'หน้าแรก', 'home'], ['overview', 'ภาพรวมยอดขาย', 'chart'], ['kpi', 'เป้าหมาย KPI', 'target'],
    { g: 'fb', label: 'Facebook', icon: 'fb', color: 'var(--ch-facebook)', items: [['fbhub', 'ภาพรวม Facebook'], ['crm', 'CRM'], ['flow', 'เส้นทางซื้อซ้ำ'], ['neverbought', 'ลูกค้าที่ยังไม่ซื้อ'], ['fbengage', 'Engagement รายวัน'], ['fbads', 'Facebook Ads']] },
    { g: 'tt', label: 'TikTok', icon: 'tt', color: 'var(--ch-tiktok)', items: [['tthub', 'ภาพรวม TikTok'], ['ttcontent', 'ผลงานคอนเทนต์'], ['ttkeyword', 'ค้นหาคำบน TikTok'], ['ttads', 'TikTok Ads'], ['livesearch', 'ค้นหา Live'], ['creatorperf', 'Creator Performance']] },
    { g: 'sh', label: 'Shopee / Lazada', icon: 'bag', color: 'var(--ch-shopee)', items: [['shhub', 'ภาพรวม Shopee'], ['shads', 'Shopee Ads'], ['lzhub', 'ภาพรวม Lazada']] },
    { g: 'mt', label: 'Modern Trade', icon: 'store', color: 'var(--ch-mt)', items: [['mthub', 'ภาพรวม Modern Trade', "_mtRetailer='';"]] },
    ['skurev', 'แนวโน้มสินค้า', 'trend'], ['mktlive', 'MKT Tracking', 'pulse'], ['skuanalysis', 'เจาะสินค้า', 'search'], ['adperf', 'Ad Performance', 'mega'],
    ['kol', 'KOL', 'users'], ['supply', 'Supply Chain', 'box'], ['products', 'สินค้า & ราคา', 'layers'], ['promo', 'ขอ Promotion', 'pct'],
    { sec: 'ผู้บริหาร', exec: true },
    ['exec', 'Promotion · อนุมัติ', 'check', true], ['cost', 'Business Insight', 'brief', true], ['ordprofit', 'กำไรต่อคำสั่งซื้อ', 'coin', true], ['invvalue', 'มูลค่าสินค้าคงคลัง', 'box', true], ['execfee', 'ค่าธรรมเนียมช่องทาง', 'receipt', true],
  ];
  const SYS = [['upload.html', 'อัปโหลดข้อมูล', 'upload', 'upload'], ['admin.html', 'ตั้งค่า (Admin)', 'sliders', 'admin'], ['health.html', 'สุขภาพระบบ', 'heart', 'health']];

  // ── สร้างรายการ ──
  const pageItem = (id, label, icon, sub, exec, pre) => {
    const ic = icon ? `<span class="nav-icon">${svg(icon)}</span>` : '';
    const cls = `nav-item${sub ? ' nav-sub' : ''}${exec ? ' exec-only' : ''}`;
    return DASH
      ? `<div class="${cls}${id === 'overview' ? ' active' : ''}" onclick="${pre || ''}showPage('${id}',null,this)" data-label="${esc(label)}" data-page="${id}">${ic}<span class="sb-tx">${esc(label)}</span></div>`
      : `<a class="${cls}" href="dashboard.html?page=${id}" data-label="${esc(label)}" data-page="${id}">${ic}<span class="sb-tx">${esc(label)}</span></a>`;
  };
  let nav = '';
  // หน้า admin: แท็บของหน้าอยู่บนสุด (กดแล้วไปกดปุ่มแท็บเดิมของหน้าให้)
  if (PAGE === 'admin') {
    const tabs = [...document.querySelectorAll('.side .side-item[data-tab]')];
    if (tabs.length) {
      const ic = { fbads: 'mega', targets: 'target', perms: 'lock' };
      const txt = b => [...b.childNodes].filter(n => !(n.classList && n.classList.contains('ico'))).map(n => n.textContent).join('').trim();   // ไม่เอาอีโมจิของปุ่มเดิม
      nav += `<div class="nav-group-label sb-sec">ตั้งค่า (Admin)</div>` + tabs.map(b => `<button type="button" class="nav-item sb-proxy" data-proxy="${esc(b.dataset.tab)}" data-label="${esc(txt(b))}"><span class="nav-icon">${svg(ic[b.dataset.tab] || 'sliders')}</span><span class="sb-tx">${esc(txt(b))}</span></button>`).join('')
        + `<div class="nav-group-label sb-sec">Dashboard</div>`;
    }
  }
  for (const m of MENU) {
    if (Array.isArray(m)) { nav += pageItem(m[0], m[1], m[2], false, m[3]); continue; }
    if (m.sec) { nav += `<div class="nav-group-label sb-sec${m.exec ? ' exec-only' : ''}"${m.exec ? ' id="navExecLabel"' : ''}>${esc(m.sec)}</div>`; continue; }
    nav += `<div class="nav-group-label nav-group-toggle" onclick="${DASH ? `toggleNavGroup('${m.g}')` : `SB.toggle('${m.g}')`}" id="navGroupLabel-${m.g}" data-g="${m.g}" data-label="${esc(m.label)}">`
      + `<span class="nav-icon" style="color:${m.color}">${svg(m.icon)}</span><span class="sb-tx">${esc(m.label)}</span><span class="nav-group-chevron" id="navGroupChevron-${m.g}">▸</span></div>`
      + `<div id="navGroup-${m.g}" class="sb-subs" style="display:none;">${m.items.map(x => pageItem(x[0], x[1], null, true, false, x[2])).join('')}</div>`;
  }
  nav += `<div class="nav-group-label sb-sec">ระบบ</div>`;
  if (DASH) nav += `<a class="nav-item nav-sub" id="navToExec" href="exec.html" target="_blank" rel="noopener" style="display:none;" data-label="Management">${'<span class="nav-icon">' + svg('ext') + '</span>'}<span class="sb-tx">Management ↗</span></a>`
    + `<a class="nav-item nav-sub" id="navToOps" href="dashboard.html" style="display:none;" data-label="Team View"><span class="nav-icon">${svg('back')}</span><span class="sb-tx">Team View</span></a>`
    + `<div class="nav-item nav-sub" onclick="openWhatsNew(false)" id="navWhatsNew" data-label="มีอะไรใหม่"><span class="nav-icon">${svg('spark')}</span><span class="sb-tx">มีอะไรใหม่</span><span class="wn-dot" id="wnDot" style="display:none;"></span></div>`;
  nav += SYS.map(([h, l, ic]) => `<a class="nav-item nav-sub${h === PAGE + '.html' ? ' active' : ''}" href="${h}" data-label="${esc(l)}" data-sys="${h}"><span class="nav-icon">${svg(ic)}</span><span class="sb-tx">${esc(l)}</span></a>`).join('');

  // ── ส่วนล่าง: ผู้ใช้ · สถานะ · เวอร์ชัน · ปุ่ม ──
  const legacy = DASH ? `<span id="authUser" hidden></span><span id="buildTag" hidden>${esc(BUILD)}</span>
      <button type="button" id="themeToggleBtn" hidden></button><button type="button" id="btnRefreshMV" hidden></button>
      <span id="cacheStatus" class="sb-note"></span>
      <div class="sb-bar" id="refreshMVBarWrap" style="display:none;"><div id="refreshMVBar"></div></div>
      <div id="refreshMVStatus" class="sb-note"></div>
      <div id="bgSyncWrap" style="display:none;"><div id="bgSyncStatus" class="sb-note"></div><div class="sb-bar"><div id="bgSyncBar" style="background:#a78bfa;"></div></div></div>` : '';
  const html = `<aside class="sb" id="sbAside">
    <div class="sb-h"><div class="sb-mark">D</div><div class="sb-brand"><b>Deesay</b><small>Sales &amp; Marketing</small></div>
      <button type="button" class="sb-tg" id="sbToggle" data-label="ย่อ / ขยายเมนู" aria-label="ย่อ / ขยายเมนู">${svg('collapse')}</button></div>
    <div class="nav sb-nav" role="navigation">${nav}</div>
    <div class="sb-ft">
      <div class="sb-usr"><div class="sb-av" id="sbAv">·</div><div class="sb-who"><b id="sbName">—</b><small id="sbRole"></small></div></div>
      <div class="sb-st"><i class="sb-dot" data-label="เชื่อมต่อฐานข้อมูลแล้ว"></i><span class="sb-tx" id="lastUpdate">เชื่อมต่อแล้ว</span>${BUILD ? `<span class="sb-ver">เวอร์ชัน ${esc(BUILD.replace(/^v/, ''))}</span>` : ''}</div>
      ${legacy}
      <div class="sb-acts">${DASH ? `<button type="button" class="sb-ib" onclick="refreshDashboardData()" data-label="รีเฟรชข้อมูล Dashboard">${svg('refresh')}</button>` : ''}
        <button type="button" class="sb-ib" id="sbTheme" data-label="สลับโหมดมืด / สว่าง">${svg('moon')}</button>
        <button type="button" class="sb-ib" id="sbLogout" data-label="ออกจากระบบ">${svg('logout')}</button></div>
    </div>
  </aside><div class="sb-fly" id="sbFly"></div>`;

  const css = `
  body.has-sb { --sb-w: 208px; }
  body.has-sb.sb-mini { --sb-w: 64px; }
  body.has-sb:not(.sb-dash) { padding-left: var(--sb-w); transition: padding-left .18s ease; }
  body.has-sb > nav, body.has-sb .side { display: none !important; }   /* เมนูเดิมของหน้า upload / health / admin (ซ่อนไว้ ปุ่มเดิมยังทำงานผ่านเมนูนี้) */
  .sb { position: fixed; top: 0; left: 0; bottom: 0; width: var(--sb-w); background: var(--bg2); border-right: 1px solid var(--border); display: flex; flex-direction: column; z-index: 100; transition: width .18s ease; font-family: 'Sarabun', sans-serif; padding-top: env(safe-area-inset-top, 0px); }
  .sb-h { display: flex; align-items: center; gap: 10px; padding: 14px 12px 12px 14px; border-bottom: 1px solid var(--border); min-height: 58px; }
  .sb-mark { width: 32px; height: 32px; border-radius: 9px; background: var(--accent, #b8862f); color: #fff; display: grid; place-items: center; font-weight: 700; font-size: 16px; flex: none; }
  .sb-brand { min-width: 0; overflow: hidden; white-space: nowrap; } .sb-brand b { display: block; font-size: 15px; line-height: 1.1; color: var(--text); } .sb-brand small { font-size: 11px; color: var(--text3); }
  .sb-tg { margin-left: auto; width: 26px; height: 26px; border-radius: 7px; border: 1px solid var(--border); background: transparent; color: var(--text2); display: grid; place-items: center; cursor: pointer; flex: none; padding: 0; }
  .sb-tg:hover { background: var(--bg3); color: var(--text); } .sb-tg .sb-ic { width: 14px; height: 14px; transition: transform .18s; }
  .sb-nav { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 8px 8px 12px; }
  .sb .sb-nav { display: block; height: auto; border: 0; position: static; top: auto; z-index: auto; background: none; box-shadow: none; backdrop-filter: none; justify-content: normal; align-items: normal; }   /* กัน CSS nav { … } ของแต่ละหน้า */
  .sb .nav-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 10px; margin: 0; border: 0; border-left: 0; border-radius: 8px; color: var(--text2); background: none; font: inherit; font-size: 13px; font-weight: 500; text-decoration: none; cursor: pointer; text-align: left; position: relative; white-space: nowrap; }
  .sb .nav-item:hover { background: var(--bg3); color: var(--text); }
  .sb .nav-item.active { background: var(--accent-soft); color: var(--text); font-weight: 600; }
  .sb .nav-item.active::before { content: ""; position: absolute; left: -8px; top: 7px; bottom: 7px; width: 3px; border-radius: 0 3px 3px 0; background: var(--accent); }
  .sb .nav-item.nav-sub { padding-left: 10px; font-size: 13px; }
  .sb .sb-subs .nav-item.nav-sub { padding: 5px 8px 5px 38px; font-size: 12.5px; }
  .sb .nav-icon { display: inline-flex; flex: none; } .sb-ic { width: 18px; height: 18px; flex: none; }
  .sb-tx { overflow: hidden; text-overflow: ellipsis; }
  .sb .nav-group-label { display: flex; align-items: center; gap: 10px; padding: 7px 10px; margin: 0; border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--text2); white-space: nowrap; }
  .sb .nav-group-toggle { cursor: pointer; } .sb .nav-group-toggle:hover { background: var(--bg3); color: var(--text); }
  .sb .nav-group-chevron { margin-left: auto; font-size: 10px; color: var(--text3); transition: transform .15s; } .sb .nav-group-chevron.open { transform: rotate(90deg); }
  .sb .sb-sec { display: block; margin: 12px 10px 4px; padding: 10px 0 0; border-top: 1px solid var(--border); border-radius: 0; font-size: 11px; font-weight: 600; color: var(--text3); }
  .sb .wn-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--red, #ef4444); margin-left: auto; flex: none; }
  .sb-ft { border-top: 1px solid var(--border); padding: 10px; }
  .sb-usr { display: flex; align-items: center; gap: 10px; padding: 6px; }
  .sb-av { width: 32px; height: 32px; border-radius: 50%; background: var(--accent-soft); color: var(--accent); display: grid; place-items: center; font-weight: 700; font-size: 13px; flex: none; border: 1px solid var(--border); }
  .sb-who { min-width: 0; line-height: 1.25; } .sb-who b { display: block; font-size: 13px; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .sb-who small { display: block; font-size: 11px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sb-st { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 11px; color: var(--text3); padding: 6px 6px 8px; }
  .sb-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--green, #16a34a); flex: none; }
  .sb-ver { flex-basis: 100%; padding-left: 13px; font-size: 11px; color: var(--text3); }
  .sb-note { display: block; font-size: 10.5px; color: var(--text3); line-height: 1.4; padding: 0 6px; }
  .sb-note:empty { display: none; }
  .sb-bar { height: 4px; background: var(--bg3); border-radius: 3px; overflow: hidden; margin: 4px 6px 6px; } .sb-bar > div { width: 0%; height: 100%; background: var(--accent); transition: width .3s ease; }
  .sb-acts { display: flex; gap: 6px; }
  .sb-ib { flex: 1; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--text2); display: grid; place-items: center; cursor: pointer; padding: 0; }
  .sb-ib:hover { background: var(--bg3); color: var(--text); } .sb-ib .sb-ic { width: 16px; height: 16px; }
  .sb-fly { position: fixed; z-index: 1200; display: none; background: var(--bg2); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.18); padding: 6px; min-width: 180px; font-family: 'Sarabun', sans-serif; color: var(--text); }
  .sb-fly.tip { min-width: 0; padding: 5px 10px; font-size: 12px; white-space: nowrap; }
  .sb-fly .t { font-size: 12px; font-weight: 600; padding: 5px 8px 6px; }
  .sb-fly a, .sb-fly button { display: block; width: 100%; text-align: left; padding: 6px 8px; border: 0; border-radius: 7px; background: none; font: inherit; font-size: 12.5px; color: var(--text2); text-decoration: none; cursor: pointer; white-space: nowrap; }
  .sb-fly a:hover, .sb-fly button:hover { background: var(--bg3); color: var(--text); }
  body.sb-mini .sb-brand, body.sb-mini .sb-tx, body.sb-mini .nav-group-chevron, body.sb-mini .sb-subs, body.sb-mini .sb-who, body.sb-mini .sb-ver, body.sb-mini .sb-note { display: none !important; }
  body.sb-mini .sb-h { flex-direction: column; padding: 12px 0 10px; gap: 8px; } body.sb-mini .sb-tg { margin: 0; } body.sb-mini .sb-tg .sb-ic { transform: rotate(180deg); }
  body.sb-mini .sb-nav { padding: 8px 10px 12px; } body.sb-mini .sb .nav-item, body.sb-mini .sb .nav-group-label:not(.sb-sec) { justify-content: center; padding: 9px 0; }
  body.sb-mini .sb .sb-sec { font-size: 0; margin: 10px 4px 6px; padding: 0; }
  body.sb-mini .sb .wn-dot { position: absolute; top: 6px; right: 8px; }
  body.sb-mini .sb-usr { justify-content: center; padding: 6px 0; } body.sb-mini .sb-st { justify-content: center; padding: 4px 0 8px; } body.sb-mini .sb-acts { flex-direction: column; }
  @media (max-width: 760px) { body.has-sb { --sb-w: 64px; } }`;

  const st = document.createElement('style'); st.id = 'sbStyle'; st.textContent = css; document.head.appendChild(st);
  M.outerHTML = html;
  const B = document.body, mq = window.matchMedia ? matchMedia('(max-width: 760px)') : null;
  B.classList.add('has-sb'); if (DASH) B.classList.add('sb-dash');
  const setMini = on => { B.classList.toggle('sb-mini', !!on); };
  try { setMini(localStorage.getItem('sbMini') === '1' || (mq && mq.matches)); } catch (e) {}
  if (mq && mq.addEventListener) mq.addEventListener('change', e => { let pref = false; try { pref = localStorage.getItem('sbMini') === '1'; } catch (x) {} setMini(e.matches || pref); });
  const fly = document.getElementById('sbFly'); let flyT = null;
  const hideFly = () => { fly.style.display = 'none'; };
  document.getElementById('sbToggle').onclick = () => {
    const on = !B.classList.contains('sb-mini'); setMini(on); hideFly();
    try { localStorage.setItem('sbMini', on ? '1' : '0'); } catch (e) {}
    setTimeout(() => window.dispatchEvent(new Event('resize')), 200);   // ให้กราฟ / ตารางจัดความกว้างใหม่
  };

  // ── ตอนย่อ: ชี้ไอคอน = ชื่อ · ชี้กลุ่ม = เมนูย่อยลอย (กดแล้วไปกดรายการจริงในเมนู) ──
  const aside = document.getElementById('sbAside');
  const showFor = el => {
    const mini = B.classList.contains('sb-mini'), isBtn = el.matches('.sb-ib, .sb-tg, .sb-dot');
    if (!mini && !isBtn) return;
    clearTimeout(flyT);
    const r = el.getBoundingClientRect(), g = el.matches('.nav-group-toggle') ? document.getElementById('navGroup-' + el.dataset.g) : null;
    if (g && mini) {
      fly.className = 'sb-fly';
      fly.innerHTML = `<div class="t">${esc(el.dataset.label)}</div>`;
      g.querySelectorAll('.nav-item').forEach(it => { const b = document.createElement('button'); b.type = 'button'; b.textContent = it.dataset.label || it.textContent.trim(); b.onclick = () => { hideFly(); it.click(); }; fly.appendChild(b); });
    } else { fly.className = 'sb-fly tip'; fly.textContent = el.dataset.label || el.textContent.trim(); }
    fly.style.display = 'block';
    const top = fly.classList.contains('tip') ? r.top + (r.height - fly.offsetHeight) / 2 : r.top - 6;
    fly.style.left = (r.right + 8) + 'px'; fly.style.top = Math.max(8, Math.min(top, innerHeight - fly.offsetHeight - 8)) + 'px';
  };
  aside.addEventListener('mouseover', e => {
    const el = e.target.closest('.nav-item, .nav-group-toggle, .sb-ib, .sb-tg, .sb-dot');
    if (el && aside.contains(el) && el.offsetParent !== null) showFor(el);
  });
  aside.addEventListener('mouseout', e => { if (!aside.contains(e.relatedTarget) || !e.relatedTarget.closest('.nav-item, .nav-group-toggle, .sb-ib, .sb-tg, .sb-dot')) flyT = setTimeout(hideFly, 180); });
  fly.addEventListener('mouseenter', () => clearTimeout(flyT)); fly.addEventListener('mouseleave', () => { flyT = setTimeout(hideFly, 150); });
  // ตอนย่อ: กดไอคอนกลุ่ม = เปิดเมนูย่อยลอย (ใช้ได้บนจอสัมผัสที่ไม่มีการชี้) แทนการกางกลุ่มในแถบแคบ
  aside.addEventListener('click', e => { const g = e.target.closest('.nav-group-toggle'); if (B.classList.contains('sb-mini') && g) { e.stopPropagation(); showFor(g); } }, true);

  // ── ปุ่มท้ายเมนู ──
  const pick = ids => ids.map(id => document.getElementById(id)).find(Boolean);
  document.getElementById('sbTheme').onclick = () => {
    if (DASH && typeof window.toggleTheme === 'function') return window.toggleTheme();
    const b = pick(['themeBtnSide', 'themeBtn', 'themeToggleBtn']);
    if (b) return b.click();
    const light = B.classList.toggle('light-theme'); try { localStorage.setItem('deesay_theme', light ? 'light' : 'dark'); } catch (e) {}
  };
  document.getElementById('sbLogout').onclick = () => {
    const b = DASH ? null : pick(['logoutBtnSide', 'logoutBtn']);
    if (b) return b.click();
    if (window.Auth && Auth.signOut) Auth.signOut();
  };

  // ── admin: แท็บในเมนูนี้ → กดปุ่มแท็บเดิม · สถานะ active / ซ่อน ตามปุ่มเดิม ──
  document.querySelectorAll('.sb-proxy').forEach(p => {
    const o = document.querySelector(`.side .side-item[data-tab="${p.dataset.proxy}"]`); if (!o) return;
    const sync = () => { p.classList.toggle('active', o.classList.contains('active')); p.style.display = o.style.display === 'none' ? 'none' : ''; };
    p.onclick = () => o.click(); sync();
    new MutationObserver(sync).observe(o, { attributes: true, attributeFilter: ['class', 'style'] });
  });

  // ── ชื่อผู้ใช้ + สิทธิ์ (รอ Auth โหลดสิทธิ์เสร็จ) · หน้าอื่นที่ไม่ใช่ dashboard: ซ่อนเมนูที่ไม่มีสิทธิ์ ──
  let tries = 0;
  const waitPerm = () => {
    const p = window.Auth && Auth.perm;
    if (!p) { if (++tries < 120) setTimeout(waitPerm, 250); return; }
    const name = p.name || String(p.email || '').split('@')[0] || '—';
    const setT = (id, v) => { const x = document.getElementById(id); if (x) x.textContent = v; };   // (2026-10-28) หน้าที่ไม่มีสิทธิ์อาจไม่มีกล่องนี้
    setT('sbName', name);
    setT('sbRole', p.is_admin ? 'ผู้ดูแลระบบ' : (p.email || 'ผู้ใช้งาน'));
    setT('sbAv', (name.trim()[0] || '·').toUpperCase());
    if (DASH) return;   // dashboard กรองเมนูเองใน applyPermissions() (โค้ดเดิม)
    document.querySelectorAll('.sb-nav [data-page]').forEach(el => { if (Auth.canPage && !Auth.canPage(el.dataset.page)) el.remove(); });
    document.querySelectorAll('.sb-nav .sb-subs').forEach(g => { if (!g.querySelector('.nav-item')) { g.previousElementSibling && g.previousElementSibling.remove(); g.remove(); } });
    const sys = { 'upload.html': p.is_admin || p.can_upload, 'admin.html': p.is_admin || p.can_admin, 'health.html': p.is_admin };
    document.querySelectorAll('.sb-nav [data-sys]').forEach(a => { if (!sys[a.dataset.sys]) a.remove(); });
    if (!document.querySelector('.sb-nav .exec-only[data-page]')) document.querySelectorAll('.sb-nav .exec-only').forEach(x => x.remove());
  };
  waitPerm();

  // หน้าอื่น: เปิดกลุ่มเมนูย่อย
  window.SB = { toggle(k) { const g = document.getElementById('navGroup-' + k), c = document.getElementById('navGroupChevron-' + k); if (!g) return; const open = g.style.display === 'none'; g.style.display = open ? 'block' : 'none'; if (c) c.classList.toggle('open', open); } };
})();
