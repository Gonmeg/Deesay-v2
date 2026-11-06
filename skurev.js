// skurev.js — หน้า "แนวโน้มสินค้า" (2026-11-05 ย้ายโค้ดออกจาก dashboard.html · หน้าตาแบบ C)
// ข้อมูลทั้งหน้า = RPC sku_trend_page ครั้งเดียว (Supabase สรุปจาก mv_sku_daily: ตัด Cancel / Return แล้ว) — ช่วงวันที่ / ช่องทาง / Sub-channel / "เทียบกับ" / "นับ" จากแถบบน
//   นับ = ออนไลน์ (ค่าเริ่ม: TikTok / Shopee / Facebook รวม Line / Lazada — ไม่รวมตัวแทน / Modern Trade เพราะยอดลอตและไฟล์ MT รายเดือนทำให้ % เพี้ยน) หรือทุกช่องทาง · ค่าใน RPC ยังเป็น p_scope = 'retail' · เลือกช่องทางเจาะจง = นับตามช่องทางนั้น
//   ช่วงนี้ vs ช่วงเทียบ (วันเดียวกันของเดือนก่อน หรือช่วงก่อนหน้าติดกัน) vs เฉลี่ย 3 ช่วง · 12 สัปดาห์ · แยกช่องทาง
//   % เทียบคิดจากวันที่ข้อมูลครบเท่านั้น (rev_cur_cmp / total_cur_cmp — ทั้ง 2 ช่วงตัดให้ยาวเท่ากันรายช่องทาง) · ตัวเลขหลักโชว์ทั้งช่วง (ตรงกับหน้าอื่น)
// กันหน้าเด้ง: วางโครงทั้งหน้าก่อนข้อมูลมา · กล่องขึ้น / ลง สูงคงที่ 10 แถว (ดูทั้งหมด = ผู้ใช้กดเอง) · ตารางอยู่ล่างสุด
// (2026-11-05 c) ตาราง "ทุกสินค้า" แสดงครบทุกแถว (ไม่แบ่งหน้า) + ล็อคหัวคอลัมน์ไว้บนสุดตอนเลื่อน
// (2026-11-05 b) ออกแบบใหม่: รายการขึ้น / ลงมีแถบขนาดสเกลเดียวกัน + ช่องทางที่พาขึ้น / ลง · ตารางเดียวมีช่องสีรายช่องทาง (แทนกล่องช่องทางและรายการข้อความ) · แถวรวม = ยอดรวมแต่ละช่องทาง
(function () {
  'use strict';
  const UP = 15, DOWN = -15, LIST_N = 10;
  const CH_ORDER = ['TikTok', 'Shopee', 'Facebook', 'ตัวแทน', 'Modern Trade', 'Lazada'], CH_SHORT = { 'Modern Trade': 'MT' };
  const CH_VAR = { TikTok: '--ch-tiktok', Shopee: '--ch-shopee', Facebook: '--ch-facebook', Lazada: '--ch-lazada', 'ตัวแทน': '--ch-dealer', 'Modern Trade': '--ch-mt' };
  const ST = {
    up: { label: '▲ Upturn', cls: 'up', rank: 1, spark: '--good' },
    down: { label: '▼ Downturn', cls: 'dn', rank: 2, spark: '--bad' },
    new: { label: 'ใหม่', cls: 'nw', rank: 3, spark: '--accent' },
    flat: { label: 'ทรงตัว', cls: '', rank: 4, spark: '--text3' },
    dead: { label: 'หยุดขาย', cls: '', rank: 5, spark: '--text3' },
  };
  let M = null, KEY = null, seq = 0, sortK = 'rev_cur', sortD = 'desc', stF = '', q = '', page = 1, more = { up: false, down: false };
  const num = v => +v || 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = v => getComputedStyle(document.body).getPropertyValue(v).trim() || '#999';
  const $ = id => document.getElementById(id);
  const cur = r => r.rev_cur_cmp != null ? num(r.rev_cur_cmp) : num(r.rev_cur);   // ยอดช่วงนี้เฉพาะวันที่ข้อมูลครบ (ใช้เทียบ)
  const pct = (a, b) => b > 0 ? (a - b) / b * 100 : null;
  const chip = (v, tip) => v == null ? `<span class="ui-chip"${tip ? ` data-tip="${esc(tip)}"` : ''}>—</span>`
    : `<span class="ui-chip ${Math.abs(v) < 3 ? '' : v > 0 ? 'up' : 'dn'}"${tip ? ` data-tip="${esc(tip)}"` : ''}>${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(1)}%</span>`;
  const info = (id, html) => typeof fbeInfoIcon === 'function' ? fbeInfoIcon(id, html) : '';

  function status(r) {
    const c = cur(r), p = num(r.rev_prev);
    if (c <= 0 && p > 0) return 'dead';
    if (p <= 0 && num(r.rev_cur) > 0) return 'new';
    const v = pct(c, p) || 0;
    return v >= UP ? 'up' : v <= DOWN ? 'down' : 'flat';
  }
  function rows() {
    const tot = num(M.total_cur) || 1;
    return (M.skus || []).map(r => {
      const st = status(r), c = cur(r);
      const chs = (r.channels || []).map(x => ({ ch: x.channel, cur: num(x.cur), prev: num(x.prev), diff: num(x.cur) - num(x.prev) }))
        .filter(x => x.cur || x.prev).sort((a, b) => a.diff - b.diff);
      return { ...r, st, rank: ST[st].rank, c, diff: c - num(r.rev_prev), chg: pct(c, num(r.rev_prev)), chg3: pct(c, num(r.rev_avg3)), share: num(r.rev_cur) / tot * 100, chs,
        price: (r.qty_retail != null ? num(r.qty_retail) : num(r.qty_cur)) ? Math.round((r.rev_retail != null ? num(r.rev_retail) : num(r.rev_cur)) / (r.qty_retail != null ? num(r.qty_retail) : num(r.qty_cur))) : null };
    });
  }
  // บรรทัดเล็กใต้สถานะ: ขึ้น / ลงกี่ช่องทาง และช่องที่เปลี่ยนมากสุด
  function why(r) {
    const chs = r.chs; if (!chs.length || r.st === 'new' || r.st === 'dead') return '';
    const dn = chs.filter(c => c.diff < 0), up = chs.filter(c => c.diff > 0), n = chs.length;
    const worst = dn[0], best = up[up.length - 1];
    if (r.st === 'down') return `ลง ${dn.length} จาก ${n} ช่องทาง${dn.length === n ? ' · ลงทุกช่องทาง' : worst ? ` · มากสุด ${esc(worst.ch)}` : ''}`;
    if (r.st === 'up') return `ขึ้น ${up.length} จาก ${n} ช่องทาง${best ? ` · มากสุด ${esc(best.ch)}` : ''}`;
    if (dn.length > up.length && best) return `${esc(best.ch)} ชดเชยช่องทางที่ลง`;
    if (up.length > dn.length && worst) return `${esc(worst.ch)} ลงกินส่วนที่ขึ้น`;
    return '';
  }
  function spark(arr, v) {
    const a = (arr || []).map(Number); if (!a.length) return '';
    const max = Math.max(...a, 1), w = 88, h = 24, step = w / Math.max(a.length - 1, 1);
    const pts = a.map((y, i) => `${(i * step).toFixed(1)},${(h - 2 - (y / max) * (h - 4)).toFixed(1)}`).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;margin-left:auto;"><polyline fill="none" stroke="${css(v)}" stroke-width="1.6" stroke-linejoin="round" points="${pts}"/></svg>`;
  }

  function injectCss() {
    if ($('sr-css')) return;
    const s = document.createElement('style'); s.id = 'sr-css';
    s.textContent = `
.sr{display:flex;flex-direction:column;gap:16px}
.sr .ui-metrics{grid-template-columns:repeat(4,minmax(0,1fr));border:1.5px solid transparent;background:var(--hero,var(--bg2)) padding-box,var(--hero-line,var(--border)) border-box;box-shadow:var(--sh,none);border-radius:14px}
.sr .ui-metric{background:transparent;box-shadow:1px 0 0 var(--border);padding:14px 18px 15px}
body.light-theme .sr .ui-metric{box-shadow:1px 0 0 #EDF0F4}
.sr .ui-metric:last-child{box-shadow:none}
.sr .ui-metric-v{font-size:clamp(22px,2vw,30px)}
.sr .ui-metric-d{display:flex;align-items:center;gap:4px 8px;flex-wrap:nowrap;margin-top:6px;font-size:12.5px;color:var(--text3);white-space:nowrap;overflow:hidden}
.sr-sk .ui-metric-v{color:var(--text3);opacity:.5}
.sr-note{margin:-6px 2px 0;font-size:12.5px;color:var(--text3)}
.sr-card{background:var(--bg2);border:1px solid var(--panel-line,var(--border));border-radius:var(--r-md,12px);padding:16px 18px;box-shadow:var(--sh,none);min-width:0}
.sr-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;margin-bottom:10px}
.sr-head h2{margin:0;font-size:15px;font-weight:700;display:flex;align-items:center;gap:6px}
.sr-sub{font-size:12.5px;color:var(--text3);font-weight:400}
.sr-two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sr-list{min-height:${LIST_N * 46}px}
.sr-li{display:flex;align-items:center;gap:12px;height:46px;border-bottom:1px solid var(--row-border,var(--border));cursor:pointer;font-size:13px}
.sr-li:hover{background:var(--bg3)}
.sr-li .nm{flex:1;min-width:0;overflow:hidden;line-height:1.35}
.sr-li .nm b{display:block;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sr-li .nm small{display:block;color:var(--text3);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sr-li .bar{width:110px;height:8px;border-radius:4px;background:var(--bg3);overflow:hidden;flex:none;display:flex}
.sr-li .bar i{display:block;height:100%;border-radius:4px}
.sr-li .bar.dn{justify-content:flex-end}
.sr-li .v{width:86px;text-align:right;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.sr-li .v.up{color:var(--good)}.sr-li .v.dn{color:var(--bad)}
.sr-li .i{width:22px;color:var(--text3);font-size:12px;text-align:right;flex:none}
.sr-more{border:0;background:none;padding:0;font:inherit;font-size:12.5px;font-weight:600;color:var(--accent-text);cursor:pointer}
.sr-dot{width:9px;height:9px;border-radius:3px;flex:none}
.sr-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.sr-seg{display:inline-flex;padding:3px;border-radius:9px;background:var(--bg3);border:1px solid var(--border)}
.sr-seg button{border:0;border-radius:7px;padding:5px 10px;font:inherit;font-size:12.5px;cursor:pointer;background:transparent;color:var(--text3);white-space:nowrap}
.sr-seg button[aria-pressed="true"]{background:var(--bg2);color:var(--text);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.2)}
.sr-q{height:32px;width:210px;padding:0 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg2);color:var(--text);font:inherit;font-size:13px}
.sr-tw{overflow-x:clip}
.sr-tw.box{overflow:auto;max-height:calc(100vh - 140px)}
.sr-tbl thead th{position:sticky;top:var(--sr-top,0px);z-index:3;background:var(--bg2);box-shadow:inset 0 -1px 0 var(--border)}
.sr-tbl thead tr:nth-child(2) th{top:calc(var(--sr-top,0px) + var(--sr-h1,0px))}
.sr-tw.box .sr-tbl thead th{top:0}.sr-tw.box .sr-tbl thead tr:nth-child(2) th{top:var(--sr-h1,0px)}
.sr-tbl{min-width:1240px;font-variant-numeric:tabular-nums}
.sr-tbl th.hg{text-align:center;border-bottom:0;padding-bottom:0;color:var(--text3);font-weight:500}
.sr-tbl th.hc{text-align:center;min-width:74px}
.sr-tbl td.ht{padding:4px 3px;text-align:center}
.sr-ht{display:block;border-radius:6px;padding:7px 4px;font-size:12.5px;font-weight:600;white-space:nowrap}
.sr-ht.z{color:var(--text3);font-weight:400}
.sr-ht.nw{background:var(--accent-soft);color:var(--accent-text)}
.sr-tbl tfoot td{vertical-align:middle}
.sr-tbl th,.sr-tbl td{padding-left:10px;padding-right:10px}
.sr-tbl td{vertical-align:middle}
.sr-tbl tbody tr{cursor:pointer}
.sr-tbl .pn{max-width:200px;overflow:hidden;text-overflow:ellipsis}
.sr-tbl .pn small{display:block;color:var(--text3);font-size:12px}
.sr-tbl .sm{display:block;color:var(--text3);font-size:12px;font-weight:400}
.sr-st{display:inline-block;padding:1px 8px;border-radius:6px;font-size:12px;font-weight:700;background:var(--bg3);color:var(--text2)}
.sr-st.up{background:var(--up-bg);color:var(--good)}.sr-st.dn{background:var(--dn-bg);color:var(--bad)}.sr-st.nw{background:var(--accent-soft);color:var(--accent-text)}
.sr-why{display:block;margin-top:3px;font-size:12px;color:var(--text3);white-space:normal;max-width:165px;line-height:1.4}
@media (max-width:1100px){.sr-two{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }

  // ===== โครงหน้า (วางครั้งเดียว ก่อนข้อมูลมา — ความสูงเท่าของจริง) =====
  function shell(root) {
    const tile = (k, l, tip) => `<div class="ui-metric is-static" data-k="${k}"><span class="ui-metric-l">${l}${info('sr-i-' + k, tip)}</span><span class="ui-metric-v" data-fit>—</span><span class="ui-metric-d">&nbsp;</span></div>`;
    const sk = Array.from({ length: LIST_N }, () => '<div class="sr-li" style="cursor:default;"><span class="nm"><b><span class="skeleton" style="width:55%;height:12px;"></span></b><small>&nbsp;</small></span></div>').join('');
    root.innerHTML = `<div class="sr">
      <section class="ui-metrics sr-sk" id="srTiles" aria-label="ตัวเลขหลัก">
        ${tile('rev', 'ยอดขาย', 'ยอดขายทุกสินค้าในช่วงที่เลือก ตามตัวกรองด้านบน<br><b>นับ: ออนไลน์</b> = TikTok / Shopee / Facebook (รวม Line) / Lazada · <b>ทุกช่องทาง</b> = รวมตัวแทน / Modern Trade ด้วย<br><b>ไม่รวม</b> ออเดอร์ที่ยกเลิก / คืน<br>% เทียบคิดจากวันที่ข้อมูลครบเท่านั้น (ช่วงเทียบตัดให้ยาวเท่ากัน)<br>ที่มา: ตารางสรุปยอดขายรายสินค้า (mv_sku_daily) แหล่งเดียวกับทุกหน้า')}
        ${tile('qty', 'จำนวนชิ้น', 'จำนวนชิ้นทุกสินค้าในช่วงที่เลือก ตามตัวกรองและตัวเลือก "นับ" ด้านบน<br><b>ไม่รวม</b> ยกเลิก / คืน และตัวอย่างฟรี<br>% เทียบคิดแบบเดียวกับยอดขาย')}
        ${tile('up', 'สินค้าที่ขึ้น', `สินค้าที่ยอดขายเพิ่มขึ้นเกิน ${UP}% เทียบช่วงเทียบ (ไม่นับสินค้าใหม่)<br>ตัวเลขเล็ก = ยอดขายที่เพิ่มขึ้นรวมของสินค้ากลุ่มนี้`)}
        ${tile('down', 'สินค้าที่ลง', `สินค้าที่ยอดขายลดลงเกิน ${Math.abs(DOWN)}% เทียบช่วงเทียบ (ไม่นับสินค้าที่หยุดขาย)<br>ตัวเลขเล็ก = ยอดขายที่หายไปรวมของสินค้ากลุ่มนี้`)}
      </section>
      <div class="sr-note" id="srNote">&nbsp;</div>
      <div class="sr-two">
        <div class="sr-card"><div class="sr-head"><h2>ขึ้นมากสุด <span class="sr-sub">เรียงตามยอดขายที่เพิ่ม</span>${info('sr-i-lu', 'ยอดขายช่วงนี้ − ช่วงเทียบ (เฉพาะวันที่ข้อมูลครบ)<br>ความยาวแถบใช้สเกลเดียวกันทั้ง 2 กล่อง เทียบขนาดกันได้ตรง ๆ<br>บรรทัดเล็ก = ช่องทางที่ยอดเพิ่มมากสุดของสินค้านั้น')}</h2><span id="srMoreUp"></span></div><div class="sr-list" id="srUp">${sk}</div></div>
        <div class="sr-card"><div class="sr-head"><h2>ลงมากสุด <span class="sr-sub">เรียงตามยอดขายที่หาย</span>${info('sr-i-ld', 'ยอดขายช่วงนี้ − ช่วงเทียบ (เฉพาะวันที่ข้อมูลครบ)<br>ความยาวแถบใช้สเกลเดียวกันทั้ง 2 กล่อง<br>บรรทัดเล็ก = ช่องทางที่ยอดหายมากสุด · "ลงทุกช่องทาง" มักเป็นที่ตัวสินค้า')}</h2><span id="srMoreDown"></span></div><div class="sr-list" id="srDown">${sk}</div></div>
      </div>
      <div class="sr-card" style="padding:16px 0 6px;">
        <div class="sr-head" style="padding:0 18px;"><h2>ทุกสินค้า <span class="sr-sub" id="srCount"></span></h2>
          <div class="sr-ctl"><div class="sr-seg" id="srSeg" role="group" aria-label="กรองสถานะ"></div>
            <input class="sr-q" id="srQ" type="search" placeholder="ค้นหา SKU หรือชื่อสินค้า" autocomplete="off">
            <button class="btn btn-ghost" type="button" id="srExport" data-tip="ทุกสินค้าตามที่กรองอยู่ พร้อมยอดแต่ละช่องทาง (ช่วงนี้ / ช่วงเทียบ)">⬇ Export</button></div></div>
        <div class="sr-tw"><table class="ui-table sr-tbl" id="srTbl" data-no-sort data-no-page><thead id="srHead"></thead>
          <tbody id="srBody"><tr><td colspan="13" class="empty">กำลังโหลด...</td></tr></tbody><tfoot id="srFoot"></tfoot></table></div>
      </div>
    </div>`;
    root.addEventListener('click', e => {
      const th = e.target.closest('th[data-sort]'); if (th && !e.target.closest('.ads-info-wrap')) { const k = th.dataset.sort; if (sortK === k) sortD = sortD === 'desc' ? 'asc' : 'desc'; else { sortK = k; sortD = k === 'rank' ? 'asc' : 'desc'; } page = 1; drawTable(); return; }
      const sg = e.target.closest('[data-st]'); if (sg) { stF = stF === sg.dataset.st ? '' : sg.dataset.st; page = 1; drawSeg(); drawTable(); return; }   // กดซ้ำ = ยกเลิก
      const mo = e.target.closest('[data-more]'); if (mo) { const k = mo.dataset.more; more[k] = !more[k]; drawLists(); return; }
      if (e.target.closest('#srExport')) { exportXlsx(); return; }
      const go = e.target.closest('[data-sku]'); if (go && !e.target.closest('.pl-trace,.ads-info-wrap')) openSkuAnalysis(go.dataset.sku);
    });
    let t = null; $('srQ').addEventListener('input', e => { clearTimeout(t); t = setTimeout(() => { q = e.target.value.trim().toLowerCase(); page = 1; drawTable(); }, 200); });
  }

  // ===== วาด =====
  function drawTiles(R) {
    const tc = num(M.total_cur), tcc = M.total_cur_cmp != null ? num(M.total_cur_cmp) : tc, tp = num(M.total_prev);
    const qc = num(M.qty_cur), qcc = M.qty_cur_cmp != null ? num(M.qty_cur_cmp) : qc, qp = num(M.qty_prev);
    const ups = R.filter(r => r.st === 'up'), dns = R.filter(r => r.st === 'down');
    const set = (k, v, d) => { const el = $('srTiles').querySelector(`[data-k="${k}"]`); el.querySelector('.ui-metric-v').textContent = v; el.querySelector('.ui-metric-d').innerHTML = d; };
    const cmpD = (a, b) => tp > 0 || b > 0 ? `${chip(pct(a, b))}<span>ช่วงเทียบ ${fmt(Math.round(b))}</span>` : '<span>ช่วงเทียบไม่มียอด</span>';
    set('rev', fmt(Math.round(tc)), cmpD(tcc, tp));
    set('qty', fmt(qc), cmpD(qcc, qp));
    // รวมจากตัวเลขที่ปัดแล้วทีละรายการ → เท่ากับผลรวมในกล่องขึ้น / ลงพอดี
    set('up', fmt(ups.length) + ' สินค้า', `<span style="color:var(--good);font-weight:600;">+${fmt(ups.reduce((s, r) => s + Math.round(Math.abs(r.diff)), 0))}</span>`);
    set('down', fmt(dns.length) + ' สินค้า', `<span style="color:var(--bad);font-weight:600;">−${fmt(dns.reduce((s, r) => s + Math.round(Math.abs(r.diff)), 0))}</span>`);
    $('srTiles').classList.remove('sr-sk');
    // ค่าเทียบนับต่างจากตัวเลขหลัก → บอกบนหน้า
    const g = {}; (M.cmp_caps || []).forEach(c => { (g[c.to] = g[c.to] || []).push(c.channel); });
    const caps = Object.entries(g).sort().map(([d, chs]) => `${chs.join(' / ')} เทียบถึง ${thShort(d)}`).join(' · ');
    $('srNote').innerHTML = `${M.scope === 'retail' ? 'นับเฉพาะช่องทางออนไลน์ (ไม่รวมตัวแทน / Modern Trade)' : 'นับทุกช่องทาง'} · เทียบกับ ${thShort(M.prev_from)} – ${thShort(M.prev_to)} (${M.mode === 'month' ? 'วันเดียวกันของเดือนก่อน' : 'ช่วงก่อนหน้าติดกัน ยาวเท่ากัน'})${caps ? ` · ${caps} เพราะวันหลังจากนั้นข้อมูลยังเข้าไม่ครบ` : ''}`;
  }
  // ช่องทางที่พาสินค้าขึ้น / ลงมากสุด
  const driver = (r, up) => { const c = up ? r.chs.filter(x => x.diff > 0).pop() : r.chs.find(x => x.diff < 0); return c || null; };
  function drawLists() {
    const R = rows().filter(r => num(r.rev_prev) > 0 && r.c > 0);
    const ups = R.filter(r => r.st === 'up').sort((a, b) => b.diff - a.diff), dns = R.filter(r => r.st === 'down').sort((a, b) => a.diff - b.diff);
    const vis = k => (k === 'up' ? ups : dns).slice(0, more[k] ? 1e9 : LIST_N);
    const max = Math.max(1, ...vis('up').map(r => Math.abs(r.diff)), ...vis('down').map(r => Math.abs(r.diff)));   // สเกลเดียวกันทั้ง 2 กล่อง
    const li = (r, up) => { const d = driver(r, up), all = !up && r.chs.length > 1 && r.chs.every(x => x.diff <= 0);
      const hint = all ? 'ลงทุกช่องทาง' : d ? `${up ? 'ขึ้น' : 'ลง'}มากสุด ${esc(d.ch)} ${up ? '+' : '−'}${fmt(Math.round(Math.abs(d.diff)))}` : '';
      return `<div class="sr-li" data-sku="${esc(r.sku)}"><span class="nm"><b title="${esc(skuToName(r.sku))}">${esc(skuToName(r.sku))}</b><small>${esc(r.sku)}${hint ? ' · ' + hint : ''}</small></span>
        <span class="bar ${up ? 'up' : 'dn'}"><i style="width:${(Math.abs(r.diff) / max * 100).toFixed(1)}%;background:var(${up ? '--good' : '--bad'});"></i></span>
        <span class="v" style="color:var(${up ? '--good' : '--bad'});">${up ? '+' : '−'}${fmt(Math.round(Math.abs(r.diff)))}</span>${chip(r.chg)}</div>`; };
    const put = (id, mid, arr, up, k) => { $(id).innerHTML = arr.length ? vis(k).map(r => li(r, up)).join('') : '<div class="empty">ไม่มีสินค้าในกลุ่มนี้</div>';
      $(mid).innerHTML = arr.length > LIST_N ? `<button type="button" class="sr-more" data-more="${k}">${more[k] ? 'ย่อ' : `ดูทั้งหมด (${arr.length})`}</button>` : `<span class="sr-sub">${fmt(arr.length)} สินค้า</span>`; };
    put('srUp', 'srMoreUp', ups, true, 'up'); put('srDown', 'srMoreDown', dns, false, 'down');
  }
  function drawSeg() {
    const R = rows(), n = k => R.filter(r => r.st === k).length;
    $('srSeg').innerHTML = ['up', 'down', 'flat', 'new', 'dead'].map(k => `<button type="button" data-st="${k}" aria-pressed="${stF === k}">${ST[k].label.replace(/^[▲▼] /, '')} ${fmt(n(k))}</button>`).join('');
  }
  function filtered() {
    let R = rows().filter(r => (!q || r.sku.toLowerCase().includes(q) || String(skuToName(r.sku)).toLowerCase().includes(q)) && (!stF || r.st === stF));
    const v = r => sortK === 'rank' ? r.rank : (r[sortK] == null ? -1e12 : num(r[sortK]));
    return R.sort((a, b) => (sortD === 'asc' ? 1 : -1) * (v(a) - v(b)));
  }
  // ช่องสีรายช่องทาง: เขียว = ขึ้น · แดง = ลง · เข้มตามขนาด % (เต็มที่ 60%)
  function heat(cur, prev, ch) {
    const tip = `${ch}: ช่วงเทียบ ${fmt(Math.round(prev))} → ช่วงนี้ ${fmt(Math.round(cur))} (${cur - prev >= 0 ? '+' : '−'}${fmt(Math.round(Math.abs(cur - prev)))})`;
    if (!cur && !prev) return '<span class="sr-ht z">·</span>';
    if (!prev) return `<span class="sr-ht nw" data-tip="${esc(tip)}">ใหม่</span>`;
    const p = (cur - prev) / prev * 100, a = Math.round(10 + Math.min(Math.abs(p), 60) / 60 * 45);
    const bg = Math.abs(p) < 3 ? 'var(--bg3)' : `color-mix(in srgb, var(${p > 0 ? '--good' : '--bad'}) ${a}%, transparent)`;
    return `<span class="sr-ht" style="background:${bg};" data-tip="${esc(tip)}">${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p) >= 100 ? Math.round(Math.abs(p)) : Math.abs(p).toFixed(0)}%</span>`;
  }
  function chList() { const have = new Set((M.skus || []).flatMap(r => (r.channels || []).filter(c => num(c.cur) || num(c.prev)).map(c => c.channel)));
    return [...CH_ORDER.filter(c => have.has(c)), ...[...have].filter(c => !CH_ORDER.includes(c)).sort()]; }
  function drawTable() {
    const all = rows(), R = filtered(), CH = chList();
    const rankOf = {}; all.slice().sort((a, b) => num(b.rev_cur) - num(a.rev_cur)).forEach((r, i) => { rankOf[r.sku] = i + 1; });
    const th = (k, l, c) => `<th class="${c || 'num'}"${k ? ` data-sort="${k}" aria-sort="${sortK === k ? (sortD === 'asc' ? 'ascending' : 'descending') : 'none'}"` : ''} rowspan="2">${l}</th>`;
    $('srHead').innerHTML = `<tr>${th('', '#')}${th('', 'สินค้า', 'l')}${th('rev_cur', 'ยอดขาย')}${th('diff', 'เปลี่ยน vs ช่วงเทียบ <span id="srIChg"></span>')}${th('chg3', 'vs เฉลี่ย 3 ช่วง <span id="srIChg3"></span>')}
      ${th('', '12 สัปดาห์ <span id="srIWk"></span>')}${th('rank', 'สถานะ <span id="srISt"></span>', 'l')}<th class="hg" colspan="${CH.length}">แต่ละช่องทาง (% เทียบช่วงเทียบ) <span id="srICh"></span></th></tr>
      <tr>${CH.map(c => `<th class="hc"${CH_SHORT[c] ? ` data-tip="${esc(c)}"` : ''}><span class="sr-dot" style="display:inline-block;vertical-align:1px;margin-right:5px;background:var(${CH_VAR[c] || '--text3'})"></span>${esc(CH_SHORT[c] || c)}</th>`).join('')}</tr>`;
    $('srCount').textContent = `${fmt(R.length)} สินค้า`;
    const cmap = r => Object.fromEntries((r.channels || []).map(c => [c.channel, c]));
    $('srBody').innerHTML = R.map(r => { const m = cmap(r);
      return `<tr data-sku="${esc(r.sku)}" title="กดเพื่อเจาะสินค้านี้">
      <td class="num ui-muted">${rankOf[r.sku]}</td>
      <td class="pn"><span class="ui-trunc" style="display:block;">${esc(skuToName(r.sku))}</span><small>${esc(r.sku)}</small></td>
      <td class="num" data-tip="${r.price == null ? '' : `ราคาเฉลี่ย ${fmt(r.price)} / ชิ้น (ไม่นับตัวแทน / Modern Trade)`}"><span class="pl-trace" style="font-weight:600;" onclick="event.stopPropagation();traceSales(getDateValue('From'),getDateValue('To'),null,'${esc(r.sku)}')">${fmt(Math.round(num(r.rev_cur)))}</span><span class="sm">${fmt(num(r.qty_cur))} ชิ้น · ${r.share.toFixed(1)}%</span></td>
      <td class="num">${num(r.rev_prev) > 0 || r.c > 0 ? `<span style="font-weight:600;color:var(${r.diff > 0 ? '--good' : r.diff < 0 ? '--bad' : '--text2'});">${r.diff > 0 ? '+' : r.diff < 0 ? '−' : ''}${fmt(Math.round(Math.abs(r.diff)))}</span> ${num(r.rev_prev) > 0 ? chip(r.chg) : '<span class="ui-chip">ใหม่</span>'}` : '<span class="ui-muted">—</span>'}<span class="sm">ช่วงเทียบ ${fmt(Math.round(num(r.rev_prev)))}</span></td>
      <td class="num">${num(r.rev_avg3) > 0 ? chip(r.chg3) : '<span class="ui-muted">—</span>'}<span class="sm">เฉลี่ย ${fmt(Math.round(num(r.rev_avg3)))}</span></td>
      <td class="num">${spark(r.weekly, ST[r.st].spark)}</td>
      <td><span class="sr-st ${ST[r.st].cls}">${ST[r.st].label}</span></td>
      ${CH.map(c => `<td class="ht">${heat(num(m[c] && m[c].cur), num(m[c] && m[c].prev), c)}</td>`).join('')}</tr>`; }).join('') || `<tr><td colspan="${7 + CH.length}" class="empty">ไม่มีสินค้าที่ตรงกับตัวกรอง</td></tr>`;
    // แถวรวม: ทุกสินค้าตามตัวกรอง (ไม่ใช่เฉพาะหน้านี้) · ไม่กรอง = เท่าแผงตัวเลขด้านบน
    const sum = f => R.reduce((s, r) => s + f(r), 0), rv = sum(r => num(r.rev_cur)), qt = sum(r => num(r.qty_cur)), cc = sum(r => r.c), pv = sum(r => num(r.rev_prev)), a3 = sum(r => num(r.rev_avg3));
    const chT = c => R.reduce((o, r) => { const x = cmap(r)[c]; if (x) { o.cur += num(x.cur); o.prev += num(x.prev); } return o; }, { cur: 0, prev: 0 });
    $('srFoot').innerHTML = R.length ? `<tr class="ui-sum"><td></td><td>รวม ${fmt(R.length)} สินค้า</td>
      <td class="num">${fmt(Math.round(rv))}<span class="sm">${fmt(qt)} ชิ้น</span></td>
      <td class="num"><span style="color:var(${cc - pv >= 0 ? '--good' : '--bad'});">${cc - pv >= 0 ? '+' : '−'}${fmt(Math.round(Math.abs(cc - pv)))}</span> ${chip(pct(cc, pv))}<span class="sm">ช่วงเทียบ ${fmt(Math.round(pv))}</span></td>
      <td class="num">${chip(pct(cc, a3))}<span class="sm">เฉลี่ย ${fmt(Math.round(a3))}</span></td><td></td><td></td>
      ${CH.map(c => { const t = chT(c); return `<td class="ht">${heat(t.cur, t.prev, c)}</td>`; }).join('')}</tr>` : '';
    drawInfo(); lockHead();
  }
  // ล็อคหัวคอลัมน์: ตารางพอดีจอ = หัวติดใต้แถบบนตอนเลื่อนทั้งหน้า · ตารางกว้างเกินจอ = เลื่อนในกล่อง (หัวติดบนกล่อง + เลื่อนซ้ายขวาได้)
  function lockHead() {
    const tw = $('srTbl').parentElement, hg = $('srTbl').querySelector('th.hg'), tb = document.querySelector('.topbar');
    tw.classList.remove('box');
    tw.style.setProperty('--sr-h1', (hg ? hg.offsetHeight : 0) + 'px');
    tw.style.setProperty('--sr-top', (tb && getComputedStyle(tb).position === 'sticky' || tb && getComputedStyle(tb).position === 'fixed' ? tb.offsetHeight : 0) + 'px');
    if ($('srTbl').offsetWidth > tw.clientWidth + 2) tw.classList.add('box');
  }
  function drawInfo() {
    const cur = `${thShort(M.from)} – ${thShort(M.to)}`, prv = `${thShort(M.prev_from)} – ${thShort(M.prev_to)}`, n = num(M.period_days) || 1;
    const addM = (s, k) => { const d = new Date(s + 'T00:00:00'), day = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() - k); d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); return fmtDateISO(d); };
    const addD = (s, k) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + k); return fmtDateISO(d); };
    const per = k => M.mode === 'month' ? [addM(M.from, k), addM(M.to, k)] : [addD(M.from, -k * n), addD(M.from, -(k - 1) * n - 1)];
    const three = [1, 2, 3].map(k => { const [a, b] = per(k); return `${thShort(a)} – ${thShort(b)}`; }).join(' / ');
    const cap = (M.cmp_caps || []).length ? '<br>วันที่ข้อมูลยังไม่ครบ (เช่น วันนี้) ไม่นับในการเทียบ ทั้ง 2 ช่วงตัดให้ยาวเท่ากัน' : '';
    const put = (id, h) => { const el = $(id); if (el) el.innerHTML = h; };
    put('srIChg', info('sr-i-chg', `<b>เปลี่ยน vs ช่วงเทียบ</b><br>ยอดขายช่วงที่เลือก (${cur}) − <b>${prv}</b> เป็นบาท และ %<br>ตัวเลขเล็ก = ยอดขายของช่วงเทียบ${cap}<br>เปลี่ยนช่วงเทียบได้ที่แถบบน "เทียบกับ"`));
    put('srIChg3', info('sr-i-chg3', `<b>vs เฉลี่ย 3 ช่วง</b><br>เทียบช่วงที่เลือก (${cur}) กับค่าเฉลี่ยของ 3 ช่วง (${three})<br>ลงเทียบช่วงเทียบ แต่ขึ้นเทียบเฉลี่ย = ช่วงเทียบสูงผิดปกติ (เช่น ตัวแทนสั่งลอต)<br>ลงทั้งคู่ = ลงจริง ควรดู`));
    put('srIWk', info('sr-i-wk', `<b>12 สัปดาห์</b><br>ยอดขายรายสัปดาห์ 12 สัปดาห์ จบที่ ${thShort(M.week_end || M.to)} (วันสุดท้ายที่ข้อมูลครบ)<br>ซ้าย = เก่า · ขวา = ล่าสุด · สีเส้นตามสถานะ`));
    put('srISt', info('sr-i-st', `<b>สถานะ</b> (จาก % vs ช่วงเทียบ)<br>Upturn = ขึ้นเกิน ${UP}% · Downturn = ลงเกิน ${Math.abs(DOWN)}%<br>ทรงตัว · ใหม่ (ช่วงเทียบไม่มียอด) · หยุดขาย (ช่วงนี้ไม่มียอด)`));
    put('srICh', info('sr-i-chx', '<b>แต่ละช่องทาง</b><br>% ที่สินค้านี้ขึ้น / ลงในแต่ละช่องทาง เทียบช่วงเทียบ (เฉพาะวันที่ข้อมูลครบ)<br>เขียว = ขึ้น · แดง = ลง · สีเข้ม = เปลี่ยนมาก · ใหม่ = ช่วงเทียบไม่มียอด · จุด = ไม่มียอดทั้ง 2 ช่วง<br>แดงทั้งแถว มักเป็นที่ตัวสินค้า · แดงบางช่อง มักเป็นที่ช่องทางนั้น (Ads / ราคา / ของหมด)<br>ชี้เมาส์ที่ช่องเพื่อดูยอดขายทั้ง 2 ช่วง · แถวรวมล่างสุด = ทุกสินค้ารวมกันของช่องทางนั้น'));
  }
  function drawAll() {
    const R = rows();
    drawTiles(R); drawLists(); drawSeg(); drawTable();
    // ข้อมูลให้สรุปด้วย AI ของหน้า (ปุ่ม "วิเคราะห์ใหม่") — ชุดเดียวกับตาราง
    window._skuSorted = R.slice().sort((a, b) => num(b.rev_cur) - num(a.rev_cur)).map(r => [r.sku, { rev: num(r.rev_cur), qty: num(r.qty_cur) }]);
    if (window.UI && UI.fit) UI.fit();
  }

  // ===== Export: ทุกสินค้าตามตัวกรอง + ยอดแต่ละช่องทาง (ช่วงนี้ / ช่วงเทียบ) =====
  function exportXlsx() {
    if (!M) return;
    const R = filtered(), chs = [...new Set((M.skus || []).flatMap(r => (r.channels || []).map(c => c.channel)))];
    const head = ['SKU', 'ชื่อสินค้า', 'ยอดขาย', 'ชิ้น', 'ราคา / ชิ้น', 'สัดส่วน %', 'ยอดช่วงเทียบ', '% vs ช่วงเทียบ', 'เฉลี่ย 3 ช่วง', '% vs เฉลี่ย 3 ช่วง', 'สถานะ',
      ...chs.flatMap(c => [c + ' ช่วงนี้', c + ' ช่วงเทียบ'])];
    const body = R.map(r => { const m = Object.fromEntries((r.channels || []).map(c => [c.channel, c]));
      return [r.sku, skuToName(r.sku), Math.round(num(r.rev_cur)), num(r.qty_cur), r.price == null ? '' : r.price, +r.share.toFixed(2), Math.round(num(r.rev_prev)),
        r.chg == null ? '' : +r.chg.toFixed(1), Math.round(num(r.rev_avg3)), r.chg3 == null ? '' : +r.chg3.toFixed(1), ST[r.st].label.replace(/^[▲▼] /, ''),
        ...chs.flatMap(c => [Math.round(num(m[c] && m[c].cur)), Math.round(num(m[c] && m[c].prev))])]; });
    const name = `แนวโน้มสินค้า_${M.scope === 'retail' ? 'ออนไลน์_' : ''}${M.from}_${M.to}`;
    if (window.XLSX) { try { const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([head, ...body]), 'แนวโน้มสินค้า'); XLSX.writeFile(wb, name + '.xlsx'); return; } catch (e) { console.warn('xlsx', e); } }
    downloadCSV([head, ...body], name + '.csv');
  }

  // ===== โหลด =====
  async function render() {
    injectCss();
    const root = $('skurev-root'); if (!root) return;
    if (!root.querySelector('.sr')) shell(root);
    const ch = $('filterChannel').value || null, sub = $('filterSubChannel').value || null;
    const from = getDateValue('From'), to = getDateValue('To'), mode = ($('momentumMode') || {}).value || 'month', scope = ($('skuScope') || {}).value || 'retail';
    const key = [from, to, ch, sub, mode, scope].join('|');
    if (KEY === key && M) { drawAll(); return; }
    const my = ++seq;
    try {
      const d = await supaRpc('sku_trend_page', { p_from: from, p_to: to, p_channel: ch, p_sub: sub, p_mode: mode, p_scope: scope });
      if (my !== seq) return;
      M = d; KEY = key; page = 1; more = { up: false, down: false };
      drawAll();
    } catch (e) {
      if (my !== seq) return;
      $('srBody').innerHTML = `<tr><td colspan="11" class="empty">โหลดข้อมูลไม่สำเร็จ: ${esc(e.message)}</td></tr>`;
    }
  }
  window.skuRev = { render, reload: () => { KEY = null; render(); } };
  window.addEventListener('resize', () => { if (M && $('srTbl')) lockHead(); });
})();
