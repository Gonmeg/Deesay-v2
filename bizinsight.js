// bizinsight.js (v20261009b) — Business Insight จากไฟล์ต้นฉบับบัญชี (Google Sheet เผยแพร่ ดึงอัตโนมัติ → acct_src_lines)
// ทุกยอดรวมเท่าไฟล์บัญชี (คอลัมน์ "ใช้ช่องนี้ หัก MO") · ส่วนบน = ทั้งบริษัท · แท็บ รายสินค้า / รายช่องทาง / งบกำไรขาดทุน
// RPC: biz_insight_data (บรรทัดบัญชี + รายช่องทาง), biz_insight_issues (แถบแจ้งเตือน)
// (b) แท็บรายสินค้า = ตารางกำไรขั้นบันไดแบบเดิม (renderPl ใน dashboard.html) ที่เปลี่ยนไปอ่าน v_biz_pl_monthly / v_biz_channel_pl_monthly / v_biz_cost_alloc / v_biz_cost_lines
//     แสดงทุกแถว ไม่มีกล่องเลื่อน · หัวคอลัมน์ล็อกไว้ใต้แถบด้านบนตอนเลื่อนหน้า
// ช่วงเดือน = ตัวเลือก "ตั้งแต่–ถึง" ด้านบนของ dashboard (topMonthsFor) · ไม่มีตัวเลือกช่วงในหน้า
(function () {
  const CSS = `.bi .seg{display:inline-flex;border:1px solid var(--border);border-radius:8px;overflow:hidden;background:var(--bg3)}
.bi .seg button{font-family:inherit;font-size:12.5px;border:0;background:transparent;color:var(--text2);padding:6px 12px;cursor:pointer;white-space:nowrap}
.bi .seg button.on{background:var(--bg2);color:var(--accent);font-weight:700;box-shadow:inset 0 -2px 0 var(--accent)}
.bi .sp{flex:1}
.bi .kpi{padding:14px 16px;cursor:pointer;border-right:1px solid var(--border);position:relative;min-width:0;transition:background .15s}
.bi .kpi:last-child{border-right:0}
.bi .kpi:hover{background:var(--bg3)}
.bi .kpi.on{background:var(--accent-soft)}
.bi .kpi.on::before{content:'';position:absolute;left:0;right:0;top:0;height:3px;background:var(--accent)}
.bi .kpi .l{color:var(--text2);font-size:12.5px;display:flex;align-items:center;gap:6px}
.bi .kpi .v{font-size:22px;font-weight:700;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.bi .kpi .d{font-size:12px;color:var(--text3);margin-top:3px;display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.bi .up{color:var(--green);font-weight:600}
.bi .dn{color:var(--red);font-weight:600}
.bi .pos{color:var(--green)}
.bi .neg{color:var(--red)}
.bi .card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);padding:16px 18px}
.bi .ch{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;margin-bottom:10px}
.bi .ct{font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}
.bi .cs{color:var(--text3);font-size:12px;margin-top:2px}
.bi .chart{position:relative;height:290px}
.bi .i{display:inline-flex;width:15px;height:15px;border-radius:50%;border:1px solid var(--text3);color:var(--text3);font-size:9.5px;align-items:center;justify-content:center;cursor:help;font-weight:700;position:relative;flex:0 0 auto}
.bi .i:hover .tip{display:block}
.bi .tip{display:none;position:absolute;z-index:30;top:20px;left:-12px;width:320px;background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:10px 12px;color:var(--text);font-weight:400;font-size:12.5px;line-height:1.6;box-shadow:0 14px 34px rgba(0,0,0,.35);text-align:left;white-space:normal}
.bi .stack{display:flex;height:14px;border-radius:7px;overflow:hidden;margin:4px 0 14px;background:var(--grid)}
.bi .stack i{display:block;height:100%}
.bi .cl{display:grid;grid-template-columns:12px 1fr auto auto;gap:8px 10px;align-items:center;font-size:13px}
.bi .cl .sw{width:10px;height:10px;border-radius:3px}
.bi .cl .n{font-variant-numeric:tabular-nums;text-align:right;font-weight:600}
.bi .cl .a{font-variant-numeric:tabular-nums;text-align:right;color:var(--text3);font-size:12px;min-width:110px}
.bi .cl .tot{border-top:1px solid var(--border);padding-top:8px;margin-top:2px}
.bi .callout{margin-top:12px;padding:10px 12px;border-radius:8px;font-size:12.5px;line-height:1.55;background:var(--bg3);border:1px solid var(--border);color:var(--text2)}
.bi table{width:100%;border-collapse:separate;border-spacing:0;font-variant-numeric:tabular-nums}
.bi th,.bi td{padding:9px 12px;border-bottom:1px solid var(--row);text-align:right;white-space:nowrap;font-size:13px}
.bi th{color:var(--text3);font-weight:600;font-size:12px;position:sticky;top:0;background:var(--bg3);z-index:2;border-bottom:1px solid var(--border)}
.bi td:first-child,.bi th:first-child{text-align:left;position:sticky;left:0;background:var(--bg2);z-index:1}
.bi th:first-child{background:var(--bg3);z-index:3}
.bi .scroll{overflow:auto;max-height:640px;border:1px solid var(--border);border-radius:10px}
.bi tr.sec td{color:var(--text3);font-size:11.5px;font-weight:700;letter-spacing:.3px;padding-top:14px;background:var(--bg2)}
.bi tr.sum td{font-weight:700;background:color-mix(in srgb,var(--accent) 7%,var(--bg2))}
.bi tr.big td{font-size:14px;border-top:1px solid var(--border)}
.bi tr.note td{color:var(--text3);font-size:12px}
.bi .pct{color:var(--text3);font-size:12px}
.bi .chdot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:8px;vertical-align:1px}
.bi .share{display:flex;align-items:center;gap:8px;justify-content:flex-end}
.bi .share .bar{width:64px;height:6px;border-radius:3px;background:var(--grid);overflow:hidden}
.bi .share .bar i{display:block;height:100%;background:var(--accent)}
.bi .mpill{display:inline-block;min-width:58px;text-align:center;padding:2px 8px;border-radius:999px;font-size:12px;font-weight:700}
.bi .mpill.p{background:color-mix(in srgb,var(--green) 14%,transparent);color:var(--green)}
.bi .mpill.n{background:color-mix(in srgb,var(--red) 14%,transparent);color:var(--red)}
.bi .items{display:grid;gap:8px}
.bi .it{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start;padding:11px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg3);font-size:13px;line-height:1.55}
.bi .it .tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap}
.bi .it .tag.w{background:color-mix(in srgb,var(--warn) 18%,transparent);color:var(--warn)}
.bi .it .tag.i{background:color-mix(in srgb,var(--blue) 18%,transparent);color:var(--blue)}
.bi .it .amt{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.bi .alert{border-radius:var(--r);border:1px solid color-mix(in srgb,var(--red) 40%,var(--border));background:color-mix(in srgb,var(--red) 8%,var(--bg2));margin-bottom:14px;overflow:hidden}
.bi .alert .al-line{display:flex;align-items:center;gap:10px;padding:10px 14px;flex-wrap:wrap;font-size:13px}
.bi .alert .al-dot{width:8px;height:8px;border-radius:50%;background:var(--red);box-shadow:0 0 0 4px color-mix(in srgb,var(--red) 20%,transparent)}
.bi .alert .al-sum{color:var(--text2);flex:1;min-width:200px}
.bi .alert .al-link{color:var(--accent);cursor:pointer;font-weight:600;white-space:nowrap}
.bi .alert .al-body{display:none;border-top:1px solid color-mix(in srgb,var(--red) 25%,var(--border));padding:6px 14px 10px}
.bi .alert.open .al-body{display:block}
.bi .al-item{display:grid;grid-template-columns:110px 1fr auto;gap:12px;align-items:start;padding:9px 0;border-bottom:1px dashed var(--row);font-size:13px;line-height:1.55}
.bi .al-item:last-child{border-bottom:0}
.bi .tg{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;white-space:nowrap;justify-self:start}
.bi .tg.w{background:color-mix(in srgb,var(--red) 15%,transparent);color:var(--red)}
.bi .tg.n{background:color-mix(in srgb,var(--blue) 15%,transparent);color:var(--blue)}
.bi .al-item .amt{font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.bi .al-item .src{color:var(--text3);font-size:12px}
.bi .plwrap{border:0;max-height:none;overflow-x:auto}
.bi .pl{border-collapse:separate;border-spacing:0 2px}
.bi .pl th{text-align:right;padding:8px 14px 10px;background:transparent;border-bottom:1px solid var(--border);color:var(--text3);font-weight:600;font-size:12px;position:sticky;top:0;background:var(--bg2);z-index:2}
.bi .pl th:first-child{text-align:left;background:var(--bg2)}
.bi .pl td{padding:7px 14px;border:0;background:transparent}
.bi .pl td:first-child{background:var(--bg2);border-radius:8px 0 0 8px}
.bi .pl td:last-child{border-radius:0 8px 8px 0}
.bi .pl tbody tr:hover td{background:color-mix(in srgb,var(--text) 4%,var(--bg2))}
.bi .pl .lab{display:flex;align-items:center;gap:6px;min-width:280px}
.bi .pl .chev{width:16px;flex:0 0 16px;color:var(--text3);font-size:10px;text-align:center;transition:transform .15s}
.bi .pl tr.cat.has td:first-child{cursor:pointer}
.bi .pl tr.cat.open .chev{transform:rotate(90deg)}
.bi .pl tr.line td{color:var(--text3);font-size:12.5px;padding-top:4px;padding-bottom:4px}
.bi .pl tr.line .lab{padding-left:22px}
.bi .pl tr.secrow td{padding:18px 6px 6px;background:var(--bg2)!important}
.bi .pl .chip{display:inline-flex;align-items:center;gap:7px;padding:4px 12px;border-radius:999px;font-size:12.5px;font-weight:700;color:var(--c);background:color-mix(in srgb,var(--c) 13%,transparent)}
.bi .pl .chip::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--c)}
.bi .pl tr.sub td{font-weight:700;background:color-mix(in srgb,var(--c) 7%,var(--bg2))}
.bi .pl tr.sub td:first-child{background:color-mix(in srgb,var(--c) 7%,var(--bg2))}
.bi .pl tr.res td{font-weight:700;font-size:14px;padding-top:10px;padding-bottom:10px;background:var(--bg3)}
.bi .pl tr.res td:first-child{background:var(--bg3)}
.bi .pl tr.res.key td{font-size:15px;background:color-mix(in srgb,var(--accent) 16%,var(--bg2))}
.bi .pl tr.res.key td:first-child{background:color-mix(in srgb,var(--accent) 16%,var(--bg2));box-shadow:inset 3px 0 0 var(--accent)}
.bi .pl tr.gap td{padding:6px;background:var(--bg2)!important}
.bi .pl td.tot{font-weight:700}
.bi .pl svg.spk{display:block;margin-left:auto}
.bi .pl tr.note td{text-align:left;color:var(--text3);font-size:12px;padding-top:14px;background:var(--bg2)!important}
.bi .tbtools{display:flex;gap:8px;align-items:center}
.bi{--row:color-mix(in srgb,var(--text) 7%,transparent);--grid:color-mix(in srgb,var(--text) 7%,transparent);--r:12px;font-size:14px}
.bi .kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;margin-bottom:14px}
.bi .row2{display:grid;grid-template-columns:1.35fr 1fr;gap:14px;margin-bottom:14px}
.bi .btn{font-family:inherit;font-size:13px;background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:8px;padding:6px 10px;cursor:pointer}
.bi .bar-top{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.bi .src{color:var(--text3);font-size:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.bi .okp{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;color:var(--green);border:1px solid color-mix(in srgb,var(--green) 35%,transparent);background:color-mix(in srgb,var(--green) 9%,transparent)}
.bi .tabs{display:inline-flex;border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--bg3);margin:4px 0 12px}
.bi .tabs button{font-family:inherit;font-size:13.5px;border:0;background:transparent;color:var(--text2);padding:8px 16px;cursor:pointer}
.bi .tabs button.on{background:var(--bg2);color:var(--accent);font-weight:700;box-shadow:inset 0 -2px 0 var(--accent)}
.bi .prod td{padding:9px 12px;border-bottom:1px solid var(--row)}
.bi .prod tbody tr.pr{cursor:pointer}.bi .prod tbody tr.pr:hover td{background:color-mix(in srgb,var(--text) 4%,var(--bg2))}
.bi .prod tr.det td{background:var(--bg3);padding:14px 18px;white-space:normal}
.bi .det-grid{display:grid;grid-template-columns:1fr 1.4fr;gap:20px}
.bi .mini{width:100%;font-size:12.5px}.bi .mini td,.bi .mini th{padding:4px 8px;border:0;background:transparent!important;position:static;white-space:nowrap}
.bi .mini th{color:var(--text3);font-weight:600;font-size:11.5px}.bi .mini tr.t td{font-weight:700;border-top:1px solid var(--border)}
.bi .mini td:first-child,.bi .mini th:first-child{text-align:left}
.bi .wait{color:var(--text3);font-size:12px;font-weight:400}
.bi tr.co td{color:var(--text2)}
@media (max-width:1200px){.bi .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.bi .row2{grid-template-columns:1fr}.bi .det-grid{grid-template-columns:1fr}}
.bi .flow{overflow:visible;border:1px solid var(--border);border-radius:10px}
.bi .flow table thead th{position:sticky;top:var(--bi-top,0px);z-index:5;background:var(--bg3)}
.bi .flow .pl thead th{background:var(--bg2)}
.bi .flow:has(.pl){border:0}
#page-cost #plCard,#page-cost #plTableWrap{overflow:visible!important}
#page-cost #tblPl thead th{position:sticky;top:var(--bi-top,0px);z-index:6;background:var(--bg2);box-shadow:0 1px 0 var(--border)}`;
  if (!document.getElementById('bi-css')) { const st = document.createElement('style'); st.id = 'bi-css'; st.textContent = CSS; document.head.appendChild(st); }

  const TH = m => MONTHS_TH[parseInt(m.slice(5, 7), 10) - 1];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = n => getComputedStyle(document.body).getPropertyValue(n).trim() || '#888';
  const fmt = n => (n < 0 ? '−' : '') + '฿' + Math.round(Math.abs(n)).toLocaleString('en-US');
  const fmt2 = n => (n < 0 ? '−' : '') + '฿' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtM = n => (n < 0 ? '−' : '') + (Math.abs(n) / 1e6).toFixed(2) + 'M';
  const pctf = (a, b, d = 1) => b ? (a / b * 100).toFixed(d) + '%' : '—';
  const tip = t => `<span class="i">i<span class="tip">${t}</span></span>`;

  let D = null, ISS = [], M = [], LINES = [], CH = [], A = 0, B = 0;
  let basis = 'order', split = 'a', metric = 'op', tab = 'prod', openAll = false, chart = null;
  const COSTCAT = [['ต้นทุนสินค้า', '#94A3B8'], ['Ads', '#EF4444'], ['ค่า Platform', '#F2643F'], ['KOL และ Affiliate', '#A78BFA'], ['Presenter และ Live', '#22D3EE'], ['ค่าใช้จ่ายขายอื่น', '#FBBF24'], ['ค่าใช้จ่ายบริหาร', '#60A5FA']];
  const CHMETA = { 'TikTok': ['var(--ch-tiktok)', 'ช่องทางออนไลน์'], 'Shopee Mall': ['var(--ch-shopee)', 'ช่องทางออนไลน์'], 'Shopee 24': ['var(--ch-shopee)', 'ช่องทางออนไลน์'],
    'Lazada Mall': ['var(--ch-lazada)', 'ช่องทางออนไลน์'], 'Lazada 24': ['var(--ch-lazada)', 'ช่องทางออนไลน์'], 'FB-COD': ['var(--ch-facebook)', 'ช่องทางออนไลน์'],
    'FB-โอนเงิน': ['var(--ch-facebook)', 'ช่องทางออนไลน์'], 'Line my shop': ['var(--ch-facebook)', 'ช่องทางออนไลน์'], 'Eve&Boy': ['var(--ch-mt)', 'Modern Trade'],
    'Konvy': ['var(--ch-mt)', 'Modern Trade'], 'Watsons': ['var(--ch-mt)', 'Modern Trade'], 'CJ': ['var(--ch-mt)', 'Modern Trade'], 'Thaimart': ['var(--ch-mt)', 'Modern Trade'],
    'ตัวแทน': ['var(--ch-dealer)', 'ตัวแทนจำหน่าย'] };

  // ---------- ข้อมูล ----------
  const g = (kinds, i) => LINES.filter(l => kinds.includes(l.kind)).reduce((s, l) => s + l.v[i], 0);
  const gc = (cat, i) => LINES.filter(l => l.cat === cat && (l.kind === 'sell' || l.kind === 'admin')).reduce((s, l) => s + l.v[i], 0);
  const mainCogsKind = i => (D.cogs_basis || {})[M[i]] || 'cogs_ship';
  function P(i) {
    const rev = g(['rev'], i), oth = g(['oth'], i), sell = g(['sell'], i), adm = g(['admin'], i), vat = g(['vat'], i), adj = g(['plat_wallet'], i) - g(['plat_invoice'], i);
    const cogs = basis === 'acct' ? g(['cogs_acct'], i) : basis === 'wallet' ? g(['cogs_wallet'], i) : g([mainCogsKind(i)], i);
    const platAdj = basis === 'wallet' ? adj : 0, ni = rev + oth, gp = ni - cogs, exp = sell + adm + platAdj, op = gp - exp;
    return { rev, oth, ni, cogs, sell, adm, platAdj, exp, gp, op, vat, after: op - vat, adj,
      ads: gc('Ads', i), plat: gc('ค่า Platform', i) + platAdj, kol: gc('KOL และ Affiliate', i), pl: gc('Presenter และ Live', i) };
  }
  const sumP = (a, b) => { const r = {}; for (let i = a; i <= b; i++) { const p = P(i); for (const k in p) r[k] = (r[k] || 0) + p[k]; } return r; };
  const MET = {
    ni: ['รายได้สุทธิ', 'ยอดขายหลังหักส่วนลดและรับคืน + รายได้อื่น (ไม่รวม VAT) ตรงกับ "รวมรายได้สุทธิ" ในไฟล์บัญชี', false],
    gp: ['กำไรขั้นต้น', 'รายได้สุทธิ − ต้นทุนสินค้า', true],
    exp: ['ค่าใช้จ่ายในการขายและบริหาร', 'ค่าใช้จ่ายในการขาย (Ads, ค่า Platform, KOL, Presenter ฯลฯ) + ค่าใช้จ่ายบริหาร (เงินเดือน, สำนักงาน ฯลฯ)', false],
    op: ['กำไร (ขาดทุน) จากการดำเนินงาน', 'กำไรก่อนหัก ภพ.30 / ภพ.36 — ตรงกับบรรทัด "กำไรขาดทุนจากต้นทุน" ตามเกณฑ์ที่เลือกในไฟล์บัญชี', true],
    after: ['กำไร (ขาดทุน) หลังหัก ภพ.30 / ภพ.36', 'ฝ่ายบัญชีหักภาษีมูลค่าเพิ่มที่ชำระในเดือน (ภพ.30) และ VAT ค่าบริการต่างประเทศ เช่น Meta / TikTok (ภพ.36) อีกชั้น', true] };

  function build() {
    M = (D.all_months || []).map(m => String(m).slice(0, 10));
    const idx = {}; M.forEach((m, i) => idx[m] = i);
    const map = {};
    (D.lines || []).forEach(([m, std, kind, cat, sort, amt]) => {
      const k = std + '|' + kind; const o = map[k] || (map[k] = { std, kind, cat, sort: +sort, v: M.map(() => 0) });
      const i = idx[String(m).slice(0, 10)]; if (i != null) o.v[i] += +amt || 0;
    });
    LINES = Object.values(map).sort((a, b) => a.sort - b.sort || a.std.localeCompare(b.std));
    CH = (D.channels || []).map(r => ({ ch: r[1], m: idx[String(r[0]).slice(0, 10)], rev: (+r[2] || 0) + (+r[3] || 0), cogs: +r[4] || 0,
      sa: +r[5] || 0, ss: +r[6] || 0, aa: +r[7] || 0, as: +r[8] || 0, ads: +r[9] || 0, plat: +r[10] || 0 }));
  }

  // ---------- ส่วนบน ----------
  function alerts() {
    const rows = (ISS || []).filter(x => { const m = String(x.month).slice(0, 10); return m >= M[A] && m <= M[B]; });
    const el = document.getElementById('biAlert'); if (!el) return;
    if (!rows.length) { el.innerHTML = ''; return; }
    const warn = rows.filter(r => r.sev === '1'), info = rows.filter(r => r.sev !== '1');
    const tags = {}; warn.forEach(r => tags[r.tag] = (tags[r.tag] || 0) + 1);
    const sum = Object.entries(tags).map(([t, n]) => `${t} ${n}`).join(' · ') + (info.length ? ` · รายการพิเศษ ${info.length}` : '');
    el.innerHTML = `<div class="alert${el.dataset.open ? ' open' : ''}">
      <div class="al-line"><span class="al-dot"></span><b>${warn.length ? `พบ ${warn.length} รายการในไฟล์บัญชีที่ควรตรวจสอบ` : 'มีรายการพิเศษในช่วงที่เลือก'}</b><span class="al-sum">${sum}</span>
        <span class="al-link" onclick="BI.togAlert()">${el.dataset.open ? 'ซ่อนรายละเอียด' : `ดูรายละเอียด (${rows.length})`}</span></div>
      <div class="al-body">${rows.map(r => `<div class="al-item"><span class="tg ${r.sev === '1' ? 'w' : 'n'}">${esc(r.tag)}</span>
        <div><b>${TH(String(r.month))} — ${esc(r.title)}</b><br>${esc(r.detail)}</div><span class="amt">${r.amount == null ? '' : fmt2(+r.amount)}</span></div>`).join('')}</div></div>`;
  }
  function kpis() {
    const n = B - A + 1, t = sumP(A, B), pv = A - n >= 0 ? sumP(A - n, A - 1) : null;
    const cmp = k => { if (!pv) return `เฉลี่ยต่อเดือน ${fmt(t[k] / n)}`; const d = t[k] - pv[k], signed = MET[k][2], good = k === 'exp' ? d < 0 : d > 0;
      const amt = signed || !pv[k] ? fmt(Math.abs(d)) : Math.abs(d / pv[k] * 100).toFixed(1) + '%';
      return `<span class="${good ? 'up' : 'dn'}">${d >= 0 ? '▲' : '▼'} ${amt}</span> เทียบ ${TH(M[A - n])}${n > 1 ? '–' + TH(M[A - 1]) : ''}`; };
    const sub = { ni: '', gp: `อัตรากำไรขั้นต้น ${pctf(t.gp, t.ni)}`, exp: `${pctf(t.exp, t.ni)} ของรายได้`, op: `อัตรากำไร ${pctf(t.op, t.ni)}`, after: `ภพ.30 / 36 ${fmt(t.vat)}` };
    document.getElementById('biKpis').innerHTML = Object.entries(MET).map(([k, [l, tp, sign]]) => `<div class="kpi${metric === k ? ' on' : ''}" onclick="BI.setMetric('${k}')">
      <div class="l">${l}${tip(tp)}</div><div class="v ${sign ? (t[k] < 0 ? 'neg' : 'pos') : ''}" title="${fmt2(t[k])}">${fmt(t[k])}</div>
      <div class="d">${sub[k] ? sub[k] + ' · ' : ''}${cmp(k)}</div></div>`).join('');
  }
  const labelPlugin = { id: 'biLabels', afterDatasetsDraw(c) { const { ctx } = c; c.data.datasets.forEach((ds, di) => { if (ds.type === 'line') return;
    c.getDatasetMeta(di).data.forEach((bar, i) => { const v = ds.data[i]; if (v == null) return; ctx.save(); ctx.font = '600 11px Sarabun'; ctx.fillStyle = css('--text2'); ctx.textAlign = 'center';
      ctx.fillText(fmtM(v), bar.x, v >= 0 ? bar.y - 6 : bar.y + 14); ctx.restore(); }); }); } };
  function trend() {
    const [label, , sign] = MET[metric], ps = M.map((_, i) => P(i)), vals = ps.map(p => p[metric]);
    document.getElementById('biTrTitle').textContent = `${label} รายเดือน`;
    document.getElementById('biTrSub').textContent = sign ? 'แท่งเขียว = กำไร · แท่งแดง = ขาดทุน · เส้น = อัตรากำไร (% ของรายได้)' : 'กดการ์ดด้านบนเพื่อเปลี่ยนตัวเลขที่แสดง';
    const inR = i => i >= A && i <= B;
    const colors = vals.map((v, i) => inR(i) ? (sign ? (v < 0 ? css('--red') : css('--green')) : css('--accent')) : 'rgba(128,128,128,.18)');
    const ds = [{ type: 'bar', data: vals, backgroundColor: colors, borderRadius: 6, maxBarThickness: 46, yAxisID: 'y' }];
    if (sign) ds.push({ type: 'line', data: ps.map(p => p.ni ? +(p[metric] / p.ni * 100).toFixed(1) : null), borderColor: css('--blue'), backgroundColor: css('--blue'), pointRadius: 3, tension: .3, yAxisID: 'y2', borderWidth: 2 });
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('biTrend'), { data: { labels: M.map(TH), datasets: ds }, plugins: [labelPlugin],
      options: { maintainAspectRatio: false, layout: { padding: { top: 18 } }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => c.dataset.type === 'line' ? ` อัตรากำไร ${c.raw}%` : ` ${label} ${fmt(c.raw)}` } } },
        scales: { x: { ticks: { color: css('--text2'), font: { family: 'Sarabun' } }, grid: { display: false } },
          y: { ticks: { color: css('--text3'), callback: v => (v / 1e6).toFixed(0) + 'M' }, grid: { color: 'rgba(128,128,128,.12)' } },
          y2: { display: sign, position: 'right', ticks: { color: css('--blue'), callback: v => v + '%' }, grid: { display: false } } } } });
  }
  function costStruct() {
    const t = sumP(A, B), ni = t.ni;
    const vals = [t.cogs, t.ads, t.plat, t.kol, t.pl, t.sell - (t.ads + t.kol + t.pl + (t.plat - t.platAdj)), t.adm];
    const per = vals.map(v => ni ? v / ni * 100 : 0), tot = per.reduce((a, b) => a + b, 0), profit = 100 - tot, scale = Math.max(100, tot);
    document.getElementById('biCsSub').textContent = `${TH(M[A])}${A !== B ? '–' + TH(M[B]) : ''} · รายได้สุทธิ ${fmt(ni)}`;
    document.getElementById('biCsStack').innerHTML = COSTCAT.map(([n, c], i) => `<i title="${n} ${per[i].toFixed(1)} บาท" style="width:${Math.max(per[i], 0) / scale * 100}%;background:${c}"></i>`).join('') + (profit > 0 ? `<i style="width:${profit / scale * 100}%;background:var(--green)"></i>` : '');
    document.getElementById('biCsList').innerHTML = COSTCAT.map(([n, c], i) => `<span class="sw" style="background:${c}"></span><span>${n}</span><span class="n">${per[i].toFixed(1)} บาท</span><span class="a">${fmt(vals[i])}</span>`).join('') +
      `<span class="sw tot" style="background:${profit < 0 ? 'var(--red)' : 'var(--green)'}"></span><span class="tot" style="font-weight:700">${profit < 0 ? 'ขาดทุน' : 'กำไร'}</span><span class="n tot ${profit < 0 ? 'neg' : 'pos'}">${profit.toFixed(1)} บาท</span><span class="a tot">${fmt(t.op)}</span>`;
    const top = COSTCAT.map(([n], i) => [n, per[i]]).slice(1).sort((a, b) => b[1] - a[1]).slice(0, 2);
    document.getElementById('biCsNote').innerHTML = profit < 0
      ? `ทุก 100 บาทที่ขายได้ มีค่าใช้จ่ายรวม <b>${tot.toFixed(1)} บาท</b> จึงขาดทุน <b class="neg">${Math.abs(profit).toFixed(1)} บาท</b> · ค่าใช้จ่ายที่สูงที่สุดรองจากต้นทุนสินค้าคือ ${top.map(x => `${x[0]} (${x[1].toFixed(1)} บาท)`).join(' และ ')}`
      : `ทุก 100 บาทที่ขายได้ มีค่าใช้จ่ายรวม <b>${tot.toFixed(1)} บาท</b> เหลือกำไร <b class="pos">${profit.toFixed(1)} บาท</b>`;
  }

  // ---------- แท็บ: งบกำไรขาดทุน ----------
  function spark(vals, color) { if (vals.length < 2) return ''; const w = 80, h = 20, mn = Math.min(...vals), mx = Math.max(...vals), r = mx - mn || 1;
    return `<svg class="spk" width="${w}" height="${h}"><polyline fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" points="${vals.map((v, i) => `${(i / (vals.length - 1) * (w - 4) + 2).toFixed(1)},${(h - 3 - (v - mn) / r * (h - 6)).toFixed(1)}`).join(' ')}"/></svg>`; }
  function plTable() {
    const R = []; for (let i = A; i <= B; i++) R.push(i);
    const ps = R.map(P), tot = sumP(A, B), multi = R.length > 1, cols = R.length + 2 + (multi ? 1 : 0);
    const SEC = { 'รายได้': '#16A34A', 'ต้นทุนสินค้า': '#64748B', 'ค่าใช้จ่ายในการขาย': '#EA580C', 'ค่าใช้จ่ายในการบริหาร': '#2563EB', 'ภาษีมูลค่าเพิ่ม': '#7C3AED' };
    let SC = 'var(--text3)', id = 0;
    const num = (v, cls = '') => `<td class="${cls}${v < -.004 ? ' neg' : ''}">${Math.abs(v) < .005 ? '<span class="pct">—</span>' : fmt(v)}</td>`;
    const row = (cls, lab, vals, total, o = {}) => `<tr class="${cls}" style="--c:${SC};${o.hide ? 'display:none' : ''}" ${o.attr || ''}><td><div class="lab"><span class="chev">${o.chev ? '▸' : ''}</span>${lab}</div></td>${vals.map(v => num(v)).join('')}${num(total, 'tot')}${multi ? `<td>${spark(vals, o.tone || css('--text3'))}</td>` : ''}</tr>`;
    let h = `<thead><tr><th style="text-align:left">รายการ</th>${R.map(i => `<th>${TH(M[i])}</th>`).join('')}<th class="tot">รวม</th>${multi ? '<th>แนวโน้ม</th>' : ''}</tr></thead><tbody>`;
    const sec = label => { SC = SEC[label]; h += `<tr class="secrow"><td colspan="${cols}"><span class="chip" style="--c:${SC}">${label}</span></td></tr>`; };
    const group = kinds => { const cats = [...new Set(LINES.filter(l => kinds.includes(l.kind)).map(l => l.cat))];
      cats.forEach(c => { const ls = LINES.filter(l => kinds.includes(l.kind) && l.cat === c && R.some(i => Math.abs(l.v[i]) > .004)); if (!ls.length) return;
        const vals = R.map(i => ls.reduce((s, l) => s + l.v[i], 0)), gid = 'bg' + (id++), many = ls.length > 1, open = openAll && many;
        h += row('cat' + (many ? ' has' : '') + (open ? ' open' : ''), ({ 'ยอดขาย': 'ยอดขายราคาเต็ม (ก่อนหักส่วนลด)' })[c] || c, vals, vals.reduce((a, b) => a + b, 0), { attr: many ? `data-g="${gid}" onclick="BI.tog(this)"` : '', chev: many });
        if (many) ls.forEach(l => { const v = R.map(i => l.v[i]); h += row('line', esc(l.std), v, v.reduce((a, b) => a + b, 0), { attr: `data-p="${gid}"`, hide: !open }); }); }); };
    const sub = (l, v, t) => h += row('sub', l, v, t);
    const res = (l, v, t, key) => h += row('res' + (key ? ' key' : ''), l, v, t, { tone: t < 0 ? css('--red') : css('--green') });
    sec('รายได้'); group(['rev']); sub('ยอดขายสุทธิ', ps.map(p => p.rev), tot.rev); group(['oth']); res('รวมรายได้สุทธิ', ps.map(p => p.ni), tot.ni);
    sec('ต้นทุนสินค้า'); h += row('cat', { order: 'ต้นทุนสินค้า (ตามคำสั่งซื้อ / Shipment)', acct: 'ต้นทุนสินค้า (ทางบัญชี)', wallet: 'ต้นทุนสินค้า (ตามวอลเลต)' }[basis], ps.map(p => p.cogs), tot.cogs);
    res('กำไรขั้นต้น', ps.map(p => p.gp), tot.gp);
    sec('ค่าใช้จ่ายในการขาย'); group(['sell']);
    if (basis === 'wallet') h += row('cat', 'ปรับค่า Platform เป็นยอดตามวอลเลต', ps.map(p => p.platAdj), tot.platAdj);
    sub('รวมค่าใช้จ่ายในการขาย', ps.map(p => p.sell + p.platAdj), tot.sell + tot.platAdj);
    sec('ค่าใช้จ่ายในการบริหาร'); group(['admin']); sub('รวมค่าใช้จ่ายในการบริหาร', ps.map(p => p.adm), tot.adm);
    h += `<tr class="gap"><td colspan="${cols}"></td></tr>`;
    res('กำไร (ขาดทุน) จากการดำเนินงาน', ps.map(p => p.op), tot.op, true);
    sec('ภาษีมูลค่าเพิ่ม'); h += row('cat', 'หัก ภพ.30 + ภพ.36', ps.map(p => p.vat), tot.vat);
    res('กำไร (ขาดทุน) หลังหัก ภพ.30 / ภพ.36', ps.map(p => p.after), tot.after);
    if (basis !== 'wallet') h += `<tr class="note"><td colspan="${cols}">หมายเหตุ: ถ้าใช้ค่า Platform ตามที่ถูกหักจริงในวอลเลต ค่าใช้จ่ายช่วงนี้จะ${tot.adj >= 0 ? 'เพิ่มขึ้น' : 'ลดลง'} ${fmt(Math.abs(tot.adj))} (เลือกเกณฑ์ "ตามวอลเลต" ด้านบนเพื่อดูทั้งงบ)</td></tr>`;
    return `<div class="card"><div class="ch"><div><div class="ct">งบกำไรขาดทุน (Profit &amp; Loss) ${tip('กดชื่อกลุ่มที่มีลูกศรเพื่อดูรายการย่อย<br>แถบสีอ่อน = ยอดรวมของหมวด · แถบสีทอง = กำไร (ขาดทุน) จากการดำเนินงาน<br>ค่า Platform ตามใบแจ้งหนี้ ส่วนต่างตามวอลเลตอยู่ในหมายเหตุท้ายตาราง')}</div>
      <div class="cs">ทุกจำนวนเงินมาจากไฟล์บัญชีและตรงกับไฟล์ทุกบรรทัด</div></div>
      <button class="btn" onclick="BI.expandAll()">${openAll ? 'ย่อรายการย่อยทั้งหมด' : 'แสดงรายการย่อยทั้งหมด'}</button></div>
      <div class="flow"><table class="pl" data-no-sort data-no-page>${h}</tbody></table></div></div>`;
  }

  // ---------- แท็บ: รายช่องทาง ----------
  function chTable() {
    const by = {}; CH.filter(r => r.m >= A && r.m <= B).forEach(r => { const o = by[r.ch] || (by[r.ch] = { rev: 0, cogs: 0, exp: 0, ads: 0, plat: 0 });
      o.rev += r.rev; o.cogs += r.cogs; o.exp += split === 'a' ? r.sa + r.aa : r.ss + r.as; o.ads += r.ads; o.plat += r.plat; });
    const rows = Object.entries(by).filter(([, o]) => Math.abs(o.rev) + Math.abs(o.exp) > 1).map(([ch, o]) => ({ ch, ...o, gp: o.rev - o.cogs, pr: o.rev - o.cogs - o.exp }));
    const T = rows.reduce((s, r) => s + r.rev, 0);
    const mp = (pr, rev) => { const p = rev ? pr / rev * 100 : 0; return `<span class="mpill ${p < 0 ? 'n' : 'p'}">${rev ? p.toFixed(1) + '%' : '—'}</span>`; };
    const tr = (r, cls = '') => `<tr class="${cls}"><td>${r.dot || ''}${esc(r.ch)}</td><td>${fmt(r.rev)}</td><td><div class="share"><span class="pct">${pctf(r.rev, T)}</span><div class="bar"><i style="width:${T ? Math.max(r.rev, 0) / T * 100 : 0}%"></i></div></div></td>
      <td>${fmt(r.cogs)}</td><td>${fmt(r.gp)} <span class="pct">${pctf(r.gp, r.rev, 0)}</span></td><td>${r.ads ? fmt(r.ads) : '—'}</td><td>${r.plat ? fmt(r.plat) : '—'}</td><td>${fmt(r.exp)}</td>
      <td class="${r.pr < 0 ? 'neg' : 'pos'}" style="font-weight:700">${fmt(r.pr)}</td><td>${mp(r.pr, r.rev)}</td></tr>`;
    let h = `<thead><tr><th>ช่องทาง</th><th>รายได้สุทธิ</th><th>สัดส่วนรายได้</th><th>ต้นทุนสินค้า</th><th>กำไรขั้นต้น</th><th>Ads</th><th>ค่า Platform</th><th>ค่าใช้จ่ายรวม</th><th>กำไร (ขาดทุน)</th><th>อัตรากำไร</th></tr></thead><tbody>`;
    const all = { ch: 'รวมทุกช่องทาง', rev: 0, cogs: 0, gp: 0, ads: 0, plat: 0, exp: 0, pr: 0 };
    ['ช่องทางออนไลน์', 'Modern Trade', 'ตัวแทนจำหน่าย'].forEach(gn => { const rs = rows.filter(r => (CHMETA[r.ch] || [])[1] === gn).sort((a, b) => b.rev - a.rev); if (!rs.length) return;
      const sg = { ch: 'รวม' + gn, rev: 0, cogs: 0, gp: 0, ads: 0, plat: 0, exp: 0, pr: 0 };
      rs.forEach(r => { r.dot = `<span class="chdot" style="background:${CHMETA[r.ch][0]}"></span>`; for (const k in sg) if (k !== 'ch') sg[k] += r[k]; });
      if (rs.length > 1) { rs.forEach(r => h += tr(r)); h += tr(sg, 'sum'); } else { const r = { ...rs[0], ch: gn }; h += tr(r, 'sum'); }
      for (const k in all) if (k !== 'ch') all[k] += sg[k]; });
    h += tr(all, 'sum big');
    return `<div class="card"><div class="ch"><div><div class="ct">กำไร (ขาดทุน) แยกตามช่องทาง ${tip('ค่าใช้จ่ายที่ฝ่ายบัญชีลงตรงช่องทาง (เช่น Ads Facebook, ค่า Live TikTok) อยู่ที่ช่องทางนั้นเสมอ<br><b>ตามสัดส่วนฝ่ายบัญชี</b> ค่าใช้จ่ายส่วนกลางปันส่วนด้วย % คงที่ เช่น TikTok 36.62%<br><b>ตามยอดขายจริง</b> ปันส่วนใหม่ตามรายได้ของแต่ละเดือน<br>ทั้งสองแบบยอดรวมเท่ากัน · ใช้ต้นทุนตามคำสั่งซื้อ / Shipment<br>ช่องรายช่องทางในไฟล์บัญชีปัดเศษ 2 ตำแหน่ง ผลรวมจึงอาจต่างจากยอดรวมบริษัทไม่เกิน ฿1')}</div>
      <div class="cs">${TH(M[A])}${A !== B ? '–' + TH(M[B]) : ''} · ${split === 'a' ? 'ค่าใช้จ่ายส่วนกลางปันส่วนด้วยสัดส่วนคงที่ของฝ่ายบัญชี' : 'ค่าใช้จ่ายส่วนกลางปันส่วนตามรายได้จริงของแต่ละเดือน'}</div></div>
      <div class="seg"><button class="${split === 'a' ? 'on' : ''}" onclick="BI.setSplit('a')">ปันส่วนตามสัดส่วนฝ่ายบัญชี</button><button class="${split === 's' ? 'on' : ''}" onclick="BI.setSplit('s')">ปันส่วนตามยอดขายจริง</button></div></div>
      <div class="flow"><table data-no-sort data-no-page>${h}</tbody></table></div></div>`;
  }

  // ---------- แท็บ: รายสินค้า (ตารางเดิม) ----------
  const PROD_HTML = `<div style="display:none"><input type="hidden" id="plFrom"><input type="hidden" id="plTo"><span id="plPeriodNote"></span><div id="mktTopKpis"></div><div id="mktTopCh"></div></div><div class="card" id="plCard" style="margin-bottom:20px;">
        <div class="section-header">
          <div class="section-title">กำไรขั้นบันไดต่อสินค้า <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-main')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-main" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;"><b>CM · Contribution Margin</b> = เงินที่สินค้าเหลือหลังหักค่าใช้จ่ายของตัวเอง<br>① หักค่าการตลาดที่ระบุสินค้าได้ + ค่า Ads ทั้งหมด → CM1<br>② หักค่า Platform / ช่องทาง → CM2<br>③ หักค่าการตลาดอื่น (ปันตามยอดขาย) → CM3<br>④ หักค่าบริหาร → สุทธิ<br>ตัวเลขจากไฟล์ต้นฉบับบัญชี รวมทุกสินค้าเท่ายอดบัญชี · ต้นทุนสินค้าจากไฟล์ต้นทุนขายของบัญชี</div></span></div>
          <div style="display:flex;gap:6px;align-items:center;">
            <div class="pl-seg" id="plViewSeg"><button class="on" data-v="prod" onclick="plSetView('prod')">ตามสินค้า</button><button data-v="mx" onclick="plSetView('mx')">สินค้า × ช่องทาง</button></div>
            <div class="pl-seg" id="plMetricSeg" style="display:none;"><button data-m="cm1" onclick="plSetMetric('cm1')">CM1</button><button class="on" data-m="cm2" onclick="plSetMetric('cm2')">CM2</button></div>
            <button class="btn btn-ghost" style="white-space:nowrap;padding:6px 12px;font-size:12px;" onclick="exportPl()">⬇ Export CSV</button>
          </div>
        </div>
        <div id="plNote" style="font-size:11.5px;color:var(--text2);margin:-4px 0 12px;"></div>
        <div id="plKpis" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;"></div>
        <div id="plMatrix" style="display:none;overflow-x:auto;"></div>
        <div id="plTableWrap">
          <table id="tblPl" class="mkt-tbl" data-no-sort data-no-page style="table-layout:fixed;min-width:1260px;">
            <colgroup><col style="width:16%"><col style="width:8.4%"><col style="width:7.6%"><col style="width:7.6%"><col style="width:7.6%"><col style="width:7.6%"><col style="width:7.6%"><col style="width:7.6%"><col style="width:7.6%"><col style="width:7.6%"><col style="width:7.6%"><col style="width:7.6%"></colgroup>
            <thead><tr>
              <th class="sortable-th c-left" onclick="plSort('name')">สินค้า <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-row')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-row" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;">กดชื่อสินค้า = ดูผลแยกตามช่องทาง<br>กดตัวเลขค่าใช้จ่าย = ดูว่าก้อนนั้นประกอบด้วยอะไร (ยอดรวมเท่าตัวเลขที่กด)<br>ตัวเลขใหญ่ในช่อง CM = % ของยอดขาย · สีแดง = ติดลบ</div></span> <span class="sort-ind" id="pls-name"></span></th>
              <th class="sortable-th" onclick="plSort('rev')">ยอดขาย <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-plh-vat')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-plh-vat" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:280px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;">ยอดขาย<b>ของบัญชี</b> (ไม่รวม VAT) แต่ละช่องทาง แบ่งลงสินค้าตามสัดส่วนที่ขายจริงในระบบ · รวมทุกสินค้าเท่ายอดบัญชี</div></span> <span class="sort-ind" id="pls-rev"></span></th>
              <th class="sortable-th" onclick="plSort('dir')">ค่าการตลาดตรง <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-dir')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-dir" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;">ค่าการตลาดที่<b>ระบุสินค้าได้ตรงๆ</b>: ค่าที่บัญชีระบุสินค้านี้ไว้ (เช่น ค่ารีวิว KOL) · ค่า Presenter ตามสินค้าของแต่ละคน<br>👆 กดที่ตัวเลขเพื่อดูว่าประกอบด้วยอะไร</div></span> <span class="sort-ind" id="pls-dir"></span></th>
              <th class="sortable-th" onclick="plSort('ads')">ค่า Ads <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-ads')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-ads" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;">ค่า Ads ตามบัญชี แบ่งลงสินค้าตามการผูก Ads กับสินค้า (Meta / TikTok / Shopee / Lazada)<br><b>Product Ads</b> = ยิงสินค้านี้ตรงๆ · <b>Shared Ads</b> = Ads ที่ไม่ผูกสินค้า (awareness เพจ Live Promotion Shop Ads) ปันตามยอดขายในช่องทาง<br>👆 กดที่ตัวเลขเพื่อดูแยกช่องทาง</div></span> <span class="sort-ind" id="pls-ads"></span></th>
              <th class="sortable-th pl-cm" onclick="plSort('cm1p')">CM1 <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-cm1')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-cm1" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;"><b>CM1 · Contribution Margin 1</b><br>ยอดขาย − ค่าการตลาดที่ระบุสินค้าได้ (KOL, Presenter ฯลฯ) − ค่า Ads ทั้งหมด</div></span> <span class="sort-ind" id="pls-cm1p"></span></th>
              <th class="sortable-th" onclick="plSort('ch')">ค่า Platform <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-ch')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-ch" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;">ค่าที่เกิดจากการขายผ่านแพลตฟอร์ม/ช่องทาง: ค่าธรรมเนียม/บริการ Platform · Commission · ค่าส่ง · Live — แบ่งตามยอดขายของสินค้าในช่องทางนั้น<br>👆 กดที่ตัวเลขเพื่อดูรายละเอียด</div></span> <span class="sort-ind" id="pls-ch"></span></th>
              <th class="sortable-th pl-cm" onclick="plSort('cm2p')">CM2 <span title="ค่า Live TikTok ปันให้เฉพาะสินค้าที่ขายใน Live TikTok — ดูรายละเอียดที่ ⓘ" style="color:var(--orange);font-size:11px;cursor:help;">❗</span> <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-cm2')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-cm2" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;"><b>CM2 · Contribution Margin 2</b><br>CM1 − ค่า Platform / ช่องทาง (ค่าธรรมเนียม, Commission, ค่าส่ง, Live)</div></span> <span class="sort-ind" id="pls-cm2p"></span></th>
              <th class="sortable-th" onclick="plSort('br')">การตลาดอื่น (ปัน) <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-br')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-br" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;">ค่าการตลาดที่ระบุสินค้าไม่ได้ ปันตามสัดส่วนยอดขาย (ถ้าบัญชีลงไว้ที่ช่องทาง ปันตามยอดขายในช่องทางนั้น)<br>👆 กดที่ตัวเลขเพื่อดูรายละเอียด</div></span> <span class="sort-ind" id="pls-br"></span></th>
              <th class="sortable-th pl-cm" onclick="plSort('cm3p')">CM3 <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-cm3')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-cm3" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;right:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;"><b>CM3 · Contribution Margin 3</b><br>CM2 − ค่าการตลาดที่ระบุสินค้าไม่ได้ ปันตามยอดขาย (Promotion, Affiliate, Rebranding, ที่ปรึกษา ฯลฯ)</div></span> <span class="sort-ind" id="pls-cm3p"></span></th>
              <th class="sortable-th" onclick="plSort('oh')">ค่าบริหาร <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-oh')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-oh" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;right:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;">ค่าใช้จ่ายบริหารทั้งบริษัท (เงินเดือน ค่าเช่า ค่าสำนักงาน) แบ่งตามสัดส่วนยอดขายรวม</div></span> <span class="sort-ind" id="pls-oh"></span></th>
              <th>ต้นทุนสินค้า <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-cogs')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-cogs" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;right:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;">จากไฟล์ต้นทุนขายของบัญชี: จำนวนชิ้นรายสินค้า × ต้นทุนของเดือนนั้น</div></span></th>
              <th class="sortable-th pl-cm" onclick="plSort('netp')">สุทธิ <span class="ads-info-wrap" style="position:relative;display:inline-block;" onclick="event.stopPropagation()"><span onclick="event.stopPropagation();toggleTip('tip-pl-net2')" style="cursor:pointer;color:var(--text3);font-size:11px;font-weight:400;">ⓘ</span><div id="tip-pl-net2" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:18px;right:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11.5px;line-height:1.65;width:300px;z-index:60;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);text-align:left;font-weight:400;white-space:normal;"><b>สุทธิ · Net Margin</b><br>CM3 − ค่าบริหารที่ปันตามยอดขาย (เงินเดือน ค่าเช่า ฯลฯ) − ต้นทุนสินค้า</div></span> <span class="sort-ind" id="pls-netp"></span></th>
            </tr></thead>
            <tbody id="tbodyPl"><tr><td colspan="11" class="empty">กำลังโหลด…</td></tr></tbody>
          </table>
        </div>
      </div>`;
  // ---------- วาด ----------
  function drawTop() { alerts(); kpis(); trend(); costStruct(); }
  function drawTab() {
    document.querySelectorAll('#biTabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const el = document.getElementById('biTab');
    if (tab === 'prod') { el.innerHTML = PROD_HTML; if (window.renderPl) window.renderPl(); return; }
    el.innerHTML = tab === 'ch' ? chTable() : plTable();
  }
  const LAYOUT = `<div class="bi">
    <div class="bar-top"><div class="src" id="biSrc"></div>
      <div style="display:flex;align-items:center;gap:8px"><span class="src">เกณฑ์ต้นทุนสินค้า ${tip('<b>ตามคำสั่งซื้อ</b> ต้นทุนของสินค้าที่ขายในเดือนนั้น (ม.ค.–พ.ค. ตาม Shipment) สะท้อนผลการขายจริง ใช้เป็นตัวหลัก<br><b>ทางบัญชี</b> สต็อกต้นเดือน + ซื้อเข้า − สต็อกปลายเดือน รวมของแถม ตัวอย่าง สินค้าเสียหาย และการปรับสต็อกจากการตรวจนับ<br><b>ตามวอลเลต</b> ต้นทุนของออเดอร์ที่ได้รับเงินเดือนนั้น และค่า Platform ตามที่ถูกหักจริง<br>แท็บรายสินค้าและรายช่องทางใช้เกณฑ์ตามคำสั่งซื้อเสมอ')}</span>
        <div class="seg" id="biBasis"><button data-v="order" class="on">ตามคำสั่งซื้อ (หลัก)</button><button data-v="acct">ทางบัญชี</button><button data-v="wallet">ตามวอลเลต</button></div></div></div>
    <div id="biAlert"></div>
    <div class="kpis" id="biKpis"></div>
    <div class="row2">
      <div class="card"><div class="ch"><div><div class="ct" id="biTrTitle"></div><div class="cs" id="biTrSub"></div></div></div><div class="chart"><canvas id="biTrend"></canvas></div></div>
      <div class="card"><div class="ch"><div><div class="ct">โครงสร้างต้นทุนต่อรายได้ 100 บาท ${tip('รายได้สุทธิทุก 100 บาท ถูกใช้เป็นค่าอะไรบ้าง<br>ถ้าผลรวมเกิน 100 บาท = ขาดทุน')}</div><div class="cs" id="biCsSub"></div></div></div>
        <div class="stack" id="biCsStack"></div><div class="cl" id="biCsList"></div><div class="callout" id="biCsNote"></div></div>
    </div>
    <div class="tabs" id="biTabs"><button data-t="prod" class="on" onclick="BI.setTab('prod')">รายสินค้า</button><button data-t="ch" onclick="BI.setTab('ch')">รายช่องทาง</button><button data-t="pl" onclick="BI.setTab('pl')">งบกำไรขาดทุน</button></div>
    <div id="biTab"></div></div>`;

  async function render() {
    const page = document.getElementById('page-cost'); if (!page) return;
    if (!page.dataset.bi) { page.innerHTML = LAYOUT; page.dataset.bi = '1';
      page.querySelectorAll('#biBasis button').forEach(b => b.onclick = () => { basis = b.dataset.v; page.querySelectorAll('#biBasis button').forEach(x => x.classList.toggle('on', x === b)); drawTop(); if (tab === 'pl') drawTab(); }); }
    const seq = (render._seq = (render._seq || 0) + 1);
    try {
      const [d, iss] = await Promise.all([Auth.rpc('biz_insight_data', { p_from: '2026-01-01' }), Auth.rpc('biz_insight_issues', {}).catch(() => [])]);
      if (seq !== render._seq) return;   // มีการโหลดรอบใหม่แล้ว
      D = d; ISS = iss || []; build();
    } catch (e) { page.querySelector('#biTab').innerHTML = `<div class="error-banner" style="display:block;">โหลดข้อมูลบัญชีไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (!M.length) { page.querySelector('#biTab').innerHTML = '<div class="card"><div class="cs">ยังไม่มีข้อมูลบัญชี</div></div>'; return; }
    const M7 = M.map(m => m.slice(0, 7));   // รูปแบบเดือนเดียวกับตารางเดิม (YYYY-MM) ตัวเลือกด้านบนจะได้ไม่สลับไปมา
    const [a, b] = topMonthsFor('cost', M7); A = Math.max(0, M7.indexOf(a)); B = Math.max(A, M7.indexOf(b));
    const setTop = () => { const tb = document.querySelector('.topbar'); page.style.setProperty('--bi-top', (tb ? Math.round(tb.getBoundingClientRect().height) : 0) + 'px'); };
    setTop(); if (!window._biResize) { window._biResize = true; window.addEventListener('resize', () => { const p = document.getElementById('page-cost'); if (p && p.dataset.bi) { const tb = document.querySelector('.topbar'); p.style.setProperty('--bi-top', (tb ? Math.round(tb.getBoundingClientRect().height) : 0) + 'px'); } }); }
    const sync = D.synced_at ? new Date(D.synced_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
    const bad = (D.checks || []).filter(c => +c.bad > 0).length, nm = (D.checks || []).length;
    document.getElementById('biSrc').innerHTML = `<span>งบกำไรขาดทุนตามไฟล์บัญชี · ไม่รวม VAT · ไม่รวม MO</span><span class="okp">${bad ? '⚠ ' : '✓ '}ตรงกับไฟล์บัญชี ${nm - bad}/${nm} เดือน</span><span>ข้อมูลบัญชีถึง ${PL_TH_M(M[M.length - 1])} · ดึงจากไฟล์ล่าสุด ${sync}</span>`;
    drawTop(); drawTab();
  }

  window.BI = {
    setMetric: k => { metric = k; kpis(); trend(); },
    setTab: t => { tab = t; drawTab(); },
    setSplit: s => { split = s; drawTab(); },
    expandAll: () => { openAll = !openAll; drawTab(); },
    tog: tr => { const gid = tr.dataset.g; if (!gid) return; const o = !tr.classList.contains('open'); tr.classList.toggle('open', o); document.querySelectorAll(`.bi tr[data-p="${gid}"]`).forEach(r => r.style.display = o ? '' : 'none'); },
    togAlert: () => { const el = document.getElementById('biAlert'); if (el.dataset.open) delete el.dataset.open; else el.dataset.open = '1'; alerts(); }
  };
  window.renderBizInsight = render;
})();
