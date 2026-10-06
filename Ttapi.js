// ttapi.js (v20261006b) — มุมมองใหม่จาก TikTok Shop API · โหลดครั้งแรกที่เปิดหน้าภาพรวม TikTok / Creator Performance
//   ภาพรวม TikTok  → ทราฟฟิกร้าน (Impression → เข้าชมหน้าสินค้า → ยอดขาย แยก Live / คลิป / หน้าสินค้า) + ผลงานรายรอบ Live
//   Creator Performance (วิธีนับ API) → Commission ที่จ่ายจริงต่อครีเอเตอร์ · แยก Open (เปิด) / Target (ปิด) · คอนเทนต์ที่ขายได้
// RPC: tiktok_traffic_daily · tiktok_lives_list · creator_commission_api · creator_content_api
(function () {
  const num = v => Number(v) || 0;
  const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
  const pctTxt = (a, b, d = 1) => (b > 0 ? pct(a, b).toFixed(d) + '%' : '—');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const baht = v => '฿' + fmt(Math.round(num(v)));
  const SRC = [{ k: 'live', label: 'Live', color: '#f472b6' }, { k: 'video', label: 'คลิป', color: '#60a5fa' }, { k: 'card', label: 'หน้าสินค้า', color: '#c8a96e' }];

  // ⓘ แบบเดียวกับทั้งเว็บ
  const info = (id, html) => `<span class="ads-info-wrap" style="position:relative;display:inline-block;"><span onclick="toggleFbeInfo('${id}')" aria-label="ดูคำอธิบายเพิ่มเติม" style="cursor:pointer;color:var(--text3);font-size:12px;font-weight:400;">ⓘ</span><div id="${id}" class="ads-info-popover" style="display:none;text-transform:none;letter-spacing:normal;font-family:'Sarabun',sans-serif;position:absolute;top:20px;left:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px 12px;font-size:11px;line-height:1.6;white-space:normal;width:320px;z-index:50;box-shadow:0 4px 16px rgba(0,0,0,0.3);color:var(--text2);font-weight:400;">${html}</div></span>`;
  const kpi = (title, value, sub, tip) => `<div class="card" style="flex:1;min-width:150px;"><div class="card-title">${title}${tip ? ' ' + tip : ''}</div><div class="kpi-value" style="font-family:'Sarabun',sans-serif;">${value}</div>${sub ? `<div class="kpi-sub">${sub}</div>` : ''}</div>`;
  const loading = cols => `<tr><td colspan="${cols}">${typeof skeletonRows === 'function' ? '' : 'กำลังโหลด...'}</td></tr>`;
  function box(pageId, id, beforeId) {
    let el = document.getElementById(id);
    if (!el) {
      const page = document.getElementById(pageId); if (!page) return null;
      el = document.createElement('div'); el.id = id;
      const before = beforeId && document.getElementById(beforeId);
      if (before && before.parentNode) before.parentNode.insertBefore(el, before); else page.appendChild(el);
    }
    return el;
  }
  // ตารางแบ่งหน้า (ตัวแบ่งหน้า + ต่อหน้า แบบเดียวกับทั้งเว็บ)
  const pagers = {};
  function pagedTable(key, rows, rowHtml, cols) {
    const st = (pagers[key] = pagers[key] || { page: 1 }); st.rows = rows; st.rowHtml = rowHtml; st.cols = cols;
    const size = pgSize(), total = Math.max(1, Math.ceil(rows.length / size));
    if (st.page > total) st.page = total;
    const body = document.getElementById(key + '-body');
    if (body) body.innerHTML = rows.length ? rows.slice((st.page - 1) * size, st.page * size).map(rowHtml).join('') : `<tr><td colspan="${cols}" class="empty">ไม่มีข้อมูลในช่วงนี้</td></tr>`;
    renderPagerHtml(key + '-pager', st.page, total, `ttApi.go_${key.replace(/-/g, '_')}`);
    window.ttApi['go_' + key.replace(/-/g, '_')] = p => { st.page = p; pagedTable(key, st.rows, st.rowHtml, st.cols); };
  }
  const isMonthly = (from, to) => (new Date(to) - new Date(from)) / 86400000 > 31;   // กฎหน้าเว็บ: ไม่เกิน 1 เดือน = รายวัน

  // ================= ภาพรวม TikTok: ทราฟฟิกร้าน + รอบ Live =================
  let _trSeq = 0, _liveScope = 'own';
  async function renderTraffic(from, to) {
    const el = box('page-tthub', 'ttapi-traffic'); if (!el || !from || !to) return;
    const seq = ++_trSeq;
    el.innerHTML = `
      <div class="section-divider"><span>📈 ทราฟฟิกร้าน TikTok ${info('ttapi-tr-info', '<b>ที่มา:</b> TikTok Shop Analytics (API) รายวัน<br><b>GMV</b> = ยอดตามที่ TikTok นับ (ก่อนหักยกเลิก / คืน) ใช้ดูสัดส่วนและแนวโน้ม ยอดขายบัญชีดูที่กราฟด้านบน<br><b>Impression</b> = จำนวนครั้งที่สินค้าถูกแสดง · <b>เข้าชม</b> = จำนวนครั้งที่เปิดหน้าสินค้า<br><b>CTR</b> = เข้าชม ÷ Impression · <b>GMV / 1,000 Impression</b> = ช่องทางไหนเปลี่ยนการมองเห็นเป็นยอดได้ดี')}</span></div>
      <div id="ttapi-tr-kpis" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;"></div>
      <div class="card" style="margin-bottom:16px;"><div class="section-header"><div class="section-title">GMV แยกช่องทาง</div></div><div class="chart-wrap" style="height:300px;"><canvas id="chartTtApiTraffic"></canvas></div></div>
      <div class="card" style="margin-bottom:20px;"><div class="section-header"><div class="section-title">ประสิทธิภาพแต่ละช่องทาง</div></div>
        <div class="table-wrap"><table><thead><tr><th>ช่องทาง</th><th>GMV</th><th>สัดส่วน</th><th>Impression</th><th>เข้าชม</th><th>CTR</th><th>GMV / 1,000 Impression</th><th>GMV / เข้าชม</th></tr></thead><tbody id="ttapi-tr-src"><tr><td colspan="8" class="empty">กำลังโหลด...</td></tr></tbody></table></div></div>
      <div class="card" style="margin-bottom:20px;"><div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">ผลงานรายรอบ Live ${info('ttapi-live-info', 'รอบ Live ที่ขายสินค้าของร้าน จาก TikTok Shop Analytics · เรียงจาก GMV มากไปน้อย<br><b>CTR</b> = คลิกสินค้า ÷ การแสดงสินค้าใน Live · <b>คลิก→สั่ง</b> = สั่งซื้อ ÷ คลิกสินค้า · <b>ดูเฉลี่ย</b> = วินาทีต่อคนดู')}</div>
        <div class="toggle-group" id="ttapi-live-scope"><button class="toggle-btn ${_liveScope === 'own' ? 'active' : ''}" onclick="ttApi.setLiveScope('own')">บัญชีร้าน</button><button class="toggle-btn ${_liveScope === 'all' ? 'active' : ''}" onclick="ttApi.setLiveScope('all')">ทุกบัญชี</button></div></div>
        <div class="table-wrap"><table><thead><tr><th>วันเวลา</th><th>บัญชี</th><th>นาน</th><th>GMV</th><th>คนซื้อ</th><th>ชิ้น</th><th>คนดู</th><th>คลิกสินค้า</th><th>CTR</th><th>คลิก→สั่ง</th><th>ดูเฉลี่ย</th><th>ผู้ติดตามใหม่</th></tr></thead><tbody id="ttapi-live-body"><tr><td colspan="12" class="empty">กำลังโหลด...</td></tr></tbody></table></div><div id="ttapi-live-pager"></div></div>`;
    try {
      const [rows, lives] = await Promise.all([supaRpc('tiktok_traffic_daily', { p_from: from, p_to: to }, true), supaRpc('tiktok_lives_list', { p_from: from, p_to: to, p_user: _liveScope === 'own' ? 'deesaythailand' : null, p_limit: 500 }, true)]);
      if (seq !== _trSeq) return;
      const T = { gmv: 0, orders: 0, refunds: 0 }; SRC.forEach(s => { T['gmv_' + s.k] = 0; T['impr_' + s.k] = 0; T['pv_' + s.k] = 0; });
      rows.forEach(r => { T.gmv += num(r.gmv); T.orders += num(r.orders); T.refunds += num(r.refunds); SRC.forEach(s => { T['gmv_' + s.k] += num(r['gmv_' + s.k]); T['impr_' + s.k] += num(r['impr_' + s.k]); T['pv_' + s.k] += num(r['pv_' + s.k]); }); });
      const impr = SRC.reduce((a, s) => a + T['impr_' + s.k], 0), pv = SRC.reduce((a, s) => a + T['pv_' + s.k], 0);
      const last = rows.length ? rows[rows.length - 1].date : null;
      document.getElementById('ttapi-tr-kpis').innerHTML =
        kpi('GMV', baht(T.gmv), last ? 'ข้อมูลถึง ' + last : '') +
        kpi('Impression สินค้า', fmt(impr), '') +
        kpi('เข้าชมหน้าสินค้า', fmt(pv), 'CTR ' + pctTxt(pv, impr, 2)) +
        kpi('ออเดอร์', fmt(T.orders), 'ต่อการเข้าชม ' + pctTxt(T.orders, pv)) +
        kpi('คืนเงิน', baht(T.refunds), pctTxt(T.refunds, T.gmv) + ' ของ GMV');
      // กราฟ: รายวัน (ไม่เกิน 1 เดือน) / รายเดือน
      const monthly = isMonthly(from, to), agg = {};
      rows.forEach(r => { const k = monthly ? String(r.date).slice(0, 7) : r.date; const a = (agg[k] = agg[k] || { live: 0, video: 0, card: 0 }); SRC.forEach(s => { a[s.k] += num(r['gmv_' + s.k]); }); });
      const labels = Object.keys(agg).sort();
      const tick = { color: chartTickColor(), font: { family: 'Sarabun', size: 10 } };
      makeChart('chartTtApiTraffic', 'bar', labels.map(l => (monthly ? l : l.slice(5).split('-').reverse().join('/'))),
        SRC.map(s => ({ label: s.label, data: labels.map(l => Math.round(agg[l][s.k])), backgroundColor: s.color, borderColor: s.color, stack: 'g' })),
        { scales: { x: { stacked: true, ticks: { ...tick, maxRotation: 0, autoSkip: true }, grid: { display: false }, border: { display: false } },
                    y: { stacked: true, ticks: { ...tick, callback: v => fmtB(v), maxTicksLimit: 6 }, grid: { color: chartGridColor() }, border: { display: false } } },
          tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${baht(c.parsed.y)}`, footer: items => 'รวม ' + baht(items.reduce((a, i) => a + (i.parsed?.y || 0), 0)) } } });
      document.getElementById('ttapi-tr-src').innerHTML = SRC.map(s => {
        const g = T['gmv_' + s.k], im = T['impr_' + s.k], p = T['pv_' + s.k];
        return `<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${s.color};margin-right:6px;"></span>${s.label}</td><td>${baht(g)}</td><td>${pctTxt(g, T.gmv)}</td><td>${fmt(im)}</td><td>${fmt(p)}</td><td>${pctTxt(p, im, 2)}</td><td>${im > 0 ? baht(g / im * 1000) : '—'}</td><td>${p > 0 ? baht(g / p) : '—'}</td></tr>`;
      }).join('');
      const liveRow = r => {
        const d = new Date(r.start_time), when = isNaN(d) ? '—' : d.toLocaleString('th-TH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
        return `<tr><td style="white-space:nowrap;">${when}</td><td style="font-family:'IBM Plex Mono',monospace;font-size:11px;">@${esc(r.username)}</td><td>${r.minutes != null ? fmt(r.minutes) + ' น.' : '—'}</td><td>${baht(r.gmv)}</td><td>${fmt(r.customers)}</td><td>${fmt(r.items_sold)}</td><td>${fmt(r.viewers)}</td><td>${fmt(r.product_clicks)}</td><td>${r.ctr != null ? num(r.ctr).toFixed(2) + '%' : '—'}</td><td>${r.click_to_order != null ? num(r.click_to_order).toFixed(2) + '%' : '—'}</td><td>${r.avg_watch_s != null ? fmt(r.avg_watch_s) + ' วิ' : '—'}</td><td>${fmt(r.new_followers)}</td></tr>`;
      };
      pagedTable('ttapi-live', lives, liveRow, 12);
    } catch (e) {
      if (seq === _trSeq) el.querySelector('#ttapi-tr-kpis').innerHTML = `<div class="error-banner" style="display:block;">โหลดทราฟฟิกร้าน TikTok ไม่สำเร็จ: ${esc(e.message)}</div>`;
    }
  }
  function setLiveScope(s) { _liveScope = s; if (typeof renderTtHub === 'function' && currentPage === 'tthub') renderTraffic(getDateValue('From'), getDateValue('To')); }

  // ================= Creator Performance (วิธี API): Commission + คอนเทนต์ =================
  let _crSeq = 0, _crType = 'all', _crArgs = null;
  const CT_LABEL = { open: 'เปิด', target: 'ปิด', both: 'เปิด + ปิด' };
  const ctBadge = t => `<span style="display:inline-block;padding:1px 8px;border-radius:10px;font-size:10.5px;background:${t === 'target' ? 'rgba(167,139,250,0.18)' : t === 'both' ? 'rgba(251,191,36,0.18)' : 'rgba(74,222,128,0.15)'};color:${t === 'target' ? '#a78bfa' : t === 'both' ? '#fbbf24' : '#4ade80'};">${CT_LABEL[t] || t}</span>`;
  async function renderCreatorExtras(from, to, on, handle) {
    _crArgs = [from, to, on, handle];
    const el = box('page-creatorperf', 'ttapi-creator', null);
    if (!el) return;
    const host = document.getElementById('cp-content'); if (host && el.parentNode !== host) host.appendChild(el);
    if (!on) { el.innerHTML = ''; el.style.display = 'none'; return; }
    el.style.display = 'block';
    const seq = ++_crSeq;
    el.innerHTML = `
      <div class="section-divider"><span>💰 Commission & คอนเทนต์ (TikTok API) ${info('ttapi-cr-info', '<b>ที่มา:</b> Affiliate API ของ TikTok Shop — ทุกออเดอร์ที่ TikTok จ่าย Commission ให้ครีเอเตอร์<br><b>ยอดขาย</b> = ยอดสุทธิของออเดอร์ (ไม่นับยกเลิก / คืน) · 1 ออเดอร์นับให้ครีเอเตอร์ที่ได้ Commission มากสุด<br><b>Commission</b> = ที่ TikTok จ่ายครีเอเตอร์ · <b>Ads Commission</b> = ส่วนที่จ่ายผ่าน GMV Max<br><b>ยอดต่อ ฿1</b> = ยอดขาย ÷ (Commission + Ads Commission)<br><b>เปิด (Open Collaboration)</b> = ครีเอเตอร์คนไหนก็หยิบสินค้าไปขายได้ ตามอัตรา Commission ที่ร้านเปิดไว้<br><b>ปิด (Target Collaboration)</b> = ร้านเชิญครีเอเตอร์เฉพาะคน ตั้งอัตราเฉพาะ (ส่วนใหญ่คือ KOL ที่จ้าง — Commission จึงต่ำ เพราะจ่ายค่าจ้างแยก ดูหน้า KOL)')}</span></div>
      <div id="ttapi-cr-kpis" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;"></div>
      <div class="card" style="margin-bottom:16px;"><div class="section-header"><div class="section-title">เปิด vs ปิด</div></div>
        <div class="table-wrap"><table><thead><tr><th>แบบ</th><th>ครีเอเตอร์</th><th>ออเดอร์</th><th>ยอดขาย</th><th>สัดส่วนยอด</th><th>Commission</th><th>Ads Commission</th><th>% Commission</th><th>ยอดเฉลี่ย / คน</th><th>Commission เฉลี่ย / คน</th></tr></thead><tbody id="ttapi-ct-cmp"><tr><td colspan="10" class="empty">กำลังโหลด...</td></tr></tbody></table></div></div>
      <div class="card" style="margin-bottom:16px;"><div class="section-header"><div class="section-title">ครีเอเตอร์: ยอดขาย vs Commission</div>
        <div class="toggle-group"><button class="toggle-btn ${_crType === 'all' ? 'active' : ''}" onclick="ttApi.setCrType('all')">ทั้งหมด</button><button class="toggle-btn ${_crType === 'open' ? 'active' : ''}" onclick="ttApi.setCrType('open')">เปิด</button><button class="toggle-btn ${_crType === 'target' ? 'active' : ''}" onclick="ttApi.setCrType('target')">ปิด</button></div></div>
        <div class="table-wrap"><table><thead><tr><th>ครีเอเตอร์</th><th>แบบ</th><th>ยอดขาย</th><th>ออเดอร์</th><th>Commission</th><th>Ads Commission</th><th>% ของยอด</th><th>ยอดต่อ ฿1</th>${_crType === 'all' ? '<th>Live / คลิป / อื่นๆ</th>' : ''}<th>คอนเทนต์</th></tr></thead><tbody id="ttapi-cr-body"><tr><td colspan="10" class="empty">กำลังโหลด...</td></tr></tbody></table></div><div id="ttapi-cr-pager"></div></div>
      <div class="card" style="margin-bottom:20px;"><div class="section-header"><div class="section-title">คอนเทนต์ที่ขายได้${handle ? ' — @' + esc(handle) : ''}</div></div>
        <div class="table-wrap"><table><thead><tr><th>ประเภท</th><th>ครีเอเตอร์</th><th>คอนเทนต์</th><th>ยอดขาย</th><th>ออเดอร์</th><th>Commission</th><th>ขายช่วง</th></tr></thead><tbody id="ttapi-ct-body"><tr><td colspan="7" class="empty">กำลังโหลด...</td></tr></tbody></table></div><div id="ttapi-ct-pager"></div></div>`;
    try {
      const [cr, ct] = await Promise.all([supaRpc('creator_commission_api', { p_from: from, p_to: to }, true), supaRpc('creator_content_api', { p_from: from, p_to: to, p_handle: handle || null, p_limit: 500 }, true)]);
      if (seq !== _crSeq) return;
      const base = handle ? cr.filter(r => r.creator === String(handle).toLowerCase()) : cr;
      const sum = (arr, k) => arr.reduce((t, r) => t + num(r[k]), 0);
      const S = { rev: sum(base, 'revenue'), com: sum(base, 'commission'), ads: sum(base, 'shop_ads_commission'), ct: sum(base, 'contents') };
      const op = base.filter(r => num(r.open_orders) > 0), tg = base.filter(r => num(r.target_orders) > 0);
      const O = { n: op.length, ord: sum(op, 'open_orders'), rev: sum(op, 'open_rev'), com: sum(op, 'open_com'), ads: sum(op, 'open_ads') };
      const G = { n: tg.length, ord: sum(tg, 'target_orders'), rev: sum(tg, 'target_rev'), com: sum(tg, 'target_com'), ads: sum(tg, 'target_ads') };
      document.getElementById('ttapi-cr-kpis').innerHTML =
        kpi('ยอดขายจากครีเอเตอร์', baht(S.rev), fmt(base.length) + ' คน') +
        kpi('Commission', baht(S.com), pctTxt(S.com, S.rev) + ' ของยอด') +
        kpi('เปิด (Open)', baht(O.rev), `${fmt(O.n)} คน · Commission ${baht(O.com)}`) +
        kpi('ปิด (Target)', baht(G.rev), `${fmt(G.n)} คน · Commission ${baht(G.com)}`) +
        kpi('Ads Commission (GMV Max)', baht(S.ads), '') +
        kpi('คอนเทนต์ที่ขายได้', fmt(S.ct), '');
      const cmpRow = (label, X) => `<tr><td>${label}</td><td>${fmt(X.n)}</td><td>${fmt(X.ord)}</td><td>${baht(X.rev)}</td><td>${pctTxt(X.rev, O.rev + G.rev)}</td><td>${baht(X.com)}</td><td>${X.ads ? baht(X.ads) : '—'}</td><td>${pctTxt(X.com, X.rev)}</td><td>${X.n ? baht(X.rev / X.n) : '—'}</td><td>${X.n ? baht(X.com / X.n) : '—'}</td></tr>`;
      const all = { n: base.length, ord: O.ord + G.ord, rev: O.rev + G.rev, com: O.com + G.com, ads: O.ads + G.ads };
      document.getElementById('ttapi-ct-cmp').innerHTML = cmpRow(ctBadge('open') + ' Open Collaboration', O) + cmpRow(ctBadge('target') + ' Target Collaboration', G) + cmpRow('<b>รวม</b>', all).replace('<tr>', '<tr style="font-weight:700;">');
      // ตารางรายคน: ทั้งหมด = ยอดรวมของคนนั้น · เปิด / ปิด = เฉพาะยอดแบบนั้น
      const pick = (r, k) => _crType === 'all' ? num(r[{ ord: 'orders', rev: 'revenue', com: 'commission', ads: 'shop_ads_commission' }[k]]) : num(r[_crType + '_' + { ord: 'orders', rev: 'rev', com: 'com', ads: 'ads' }[k]]);
      const rows = (_crType === 'all' ? base : _crType === 'open' ? op : tg).map(r => ({ r, ord: pick(r, 'ord'), rev: pick(r, 'rev'), com: pick(r, 'com'), ads: pick(r, 'ads') })).sort((x, y) => y.rev - x.rev);
      const bar = r => { const t = num(r.revenue) || 1; const seg = (v, c) => `<span style="display:inline-block;height:8px;width:${(num(v) / t * 100).toFixed(1)}%;background:${c};"></span>`;
        return `<div title="Live ${baht(r.rev_live)} · คลิป ${baht(r.rev_video)} · อื่นๆ ${baht(r.rev_other)}" style="width:120px;background:var(--bg3);border-radius:4px;overflow:hidden;display:flex;">${seg(r.rev_live, '#f472b6')}${seg(r.rev_video, '#60a5fa')}${seg(r.rev_other, '#c8a96e')}</div>`; };
      pagedTable('ttapi-cr', rows, x => { const r = x.r, cost = x.com + x.ads;
        return `<tr><td style="font-family:'IBM Plex Mono',monospace;font-size:11px;">@${esc(r.creator)}</td><td>${ctBadge(r.collab)}</td><td>${baht(x.rev)}</td><td>${fmt(x.ord)}</td><td>${baht(x.com)}</td><td>${x.ads ? baht(x.ads) : '—'}</td><td>${pctTxt(x.com, x.rev)}</td><td>${cost > 0 ? baht(x.rev / cost) : '—'}</td>${_crType === 'all' ? `<td>${bar(r)}</td>` : ''}<td>${fmt(r.contents)}</td></tr>`; }, _crType === 'all' ? 10 : 9);
      const TYPE = { LIVE: 'Live', VIDEO: 'คลิป', SHOWCASE: 'โชว์เคส', LINKSHARE: 'ลิงก์', SHOP: 'ร้าน' };
      pagedTable('ttapi-ct', ct, r => {
        const link = r.content_type === 'VIDEO' ? `<a href="https://www.tiktok.com/@${encodeURIComponent(r.creator)}/video/${encodeURIComponent(r.content_id)}" target="_blank" rel="noopener" style="color:var(--blue,#60a5fa);">เปิดคลิป ↗</a>`
          : `<span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--text3);">${esc(r.content_id)}</span>`;
        return `<tr><td>${TYPE[r.content_type] || esc(r.content_type || '—')}</td><td style="font-family:'IBM Plex Mono',monospace;font-size:11px;">@${esc(r.creator)}</td><td>${link}</td><td>${baht(r.revenue)}</td><td>${fmt(r.orders)}</td><td>${baht(r.commission)}</td><td style="white-space:nowrap;">${r.first_date === r.last_date ? r.first_date : r.first_date + ' – ' + r.last_date}</td></tr>`;
      }, 7);
    } catch (e) {
      if (seq === _crSeq) document.getElementById('ttapi-cr-kpis').innerHTML = `<div class="error-banner" style="display:block;">โหลด Commission ไม่สำเร็จ: ${esc(e.message)}</div>`;
    }
  }

  function setCrType(t) { _crType = t; if (_crArgs) renderCreatorExtras(..._crArgs); }
  window.ttApi = { renderTraffic, renderCreatorExtras, setLiveScope, setCrType };
})();
