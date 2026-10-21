// ttapi.js (v20261021a) — หน้าภาพรวม TikTok 2 มุมมอง (ยอดขายจริง / GMV ตาม TikTok) · ตารางแบ่งแบบ TikTok (แอฟฟิลิเอต / ผู้ขาย × ไลฟ์ / วิดีโอ / การ์ดสินค้า) + ค่า Ads
// ttapi.js (v20261006d) — (d) ตัวกรอง ทุกคน / KOL / Affiliate บนแถบด้านบน (dashboard: cpTypeOk) ใช้กับส่วน Commission + ป้ายประเภทหลังชื่อ (cpKindBadge)
// ttapi.js (v20261006c) — มุมมองใหม่จาก TikTok Shop API · โหลดครั้งแรกที่เปิดหน้าภาพรวม TikTok / Creator Performance
//   ภาพรวม TikTok  → ตาราง "ยอดขายแยกตามช่องทาง" จาก API (แทนช่อง Order Channel ในไฟล์) · ทราฟฟิกร้าน (Impression → เข้าชม → ยอด) · ผลงานรายรอบ Live
//   (v20261006c) ตัดส่วนที่ซ้ำ: GMV ในทราฟฟิก (ซ้ำกับกราฟยอดขาย / ตารางช่องทาง) · ยอดขายครีเอเตอร์ในส่วน Commission (ซ้ำกับการ์ดด้านบน) · Top 10 ครีเอเตอร์ 3 ตาราง (รวมเป็นตารางเดียวที่กรองได้)
//   Creator Performance (วิธีนับ API) → Commission ที่จ่ายจริงต่อครีเอเตอร์ · แยก Open (เปิด) / Target (ปิด) · คอนเทนต์ที่ขายได้
// RPC: tiktok_traffic_daily · tiktok_lives_list · creator_commission_api · creator_content_api
(function () {
  const num = v => Number(v) || 0;
  const pct = (a, b) => (b > 0 ? (a / b) * 100 : 0);
  const pctTxt = (a, b, d = 1) => (b > 0 ? pct(a, b).toFixed(d) + '%' : '—');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const baht = v => fmt(Math.round(num(v)));
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
      let before = beforeId && document.getElementById(beforeId);
      while (before && before.parentElement && before.parentElement !== page) before = before.parentElement;   // ขึ้นไปถึงกล่องชั้นนอกสุดในหน้า
      if (before && before.parentElement === page) page.insertBefore(el, before); else page.appendChild(el);
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
    const el = box('page-tthub', 'ttapi-traffic', document.getElementById('ttPromoDiv') ? 'ttPromoDiv' : 'tblTopSKUTt'); if (!el || !from || !to) return;   // (2026-10-20) วางก่อนหัวข้อ Promotion / SKU (เดิมไปแทรกใต้หัวข้อ)
    const seq = ++_trSeq;
    el.innerHTML = `
      <div class="section-divider"><span>📈 TikTok Shop Traffic ${info('ttapi-tr-info', '<b>ที่มา:</b> TikTok Shop Analytics (API) รายวัน<br><b>GMV</b> = ยอดตามที่ TikTok นับ (ก่อนหักยกเลิก / คืน) ใช้เทียบประสิทธิภาพช่องทาง · ยอดขายจริงดูที่กราฟและตารางช่องทางด้านบน<br>TikTok ให้ข้อมูลย้อนหลังได้ถึง 10 เม.ย. 69 เท่านั้น<br><b>Impression</b> = จำนวนครั้งที่สินค้าถูกแสดง · <b>เข้าชม</b> = จำนวนครั้งที่เปิดหน้าสินค้า<br><b>CTR</b> = เข้าชม ÷ Impression · <b>GMV / 1,000 Impression</b> = ช่องทางไหนเปลี่ยนการมองเห็นเป็นยอดได้ดี')} <span id="ttapi-tr-note" style="font-weight:400;color:var(--text3);text-transform:none;letter-spacing:normal;"></span></span></div>
      <div id="ttapi-tr-kpis" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;"></div>
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
      const last = rows.length ? rows[rows.length - 1].date : null, first = rows.length ? rows[0].date : null;
      const nt = document.getElementById('ttapi-tr-note'); if (nt) nt.textContent = first && first > from ? '· ข้อมูลเริ่ม ' + new Date(first + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '';
      document.getElementById('ttapi-tr-kpis').innerHTML =
        kpi('Impression สินค้า', fmt(impr), last ? 'ข้อมูลถึง ' + last : '') +
        kpi('เข้าชมหน้าสินค้า', fmt(pv), 'CTR ' + pctTxt(pv, impr, 2)) +
        kpi('ออเดอร์', fmt(T.orders), 'ต่อการเข้าชม ' + pctTxt(T.orders, pv)) +
        kpi('คืนเงิน', baht(T.refunds), pctTxt(T.refunds, T.gmv) + ' ของ GMV');
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
  // ===== (2026-10-21) หน้าภาพรวม TikTok: 2 มุมมอง (ปุ่ม "มุมมอง" บนแถบด้านบน) =====
  //   order  = ยอดขายจริงตามคำสั่งซื้อ (หักยกเลิก / คืน) — การ์ด / กราฟ จาก sales.js เหมือนเดิม · ตาราง = tt_channel_grid
  //   tiktok = GMV ตามที่ TikTok นับ (Seller Center › รายละเอียด GMV › ตามแหล่งที่มาของคำสั่งซื้อ) — การ์ด / กราฟ / ตาราง จาก tt_gmv_view
  //   ตารางทั้ง 2 มุมมองแบ่งแบบเดียวกับ TikTok: แอฟฟิลิเอต / ผู้ขาย × ไลฟ์ / วิดีโอ / การ์ดสินค้า + ค่า Ads (tt_channel_ads)
  let _ocSeq = 0, _view = 'order', _gmvChart = null;
  const fmt2 = v => num(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const iTip = t => ` <span class="ui-i" data-tip="${esc(t)}">ⓘ</span>`;
  const thTip = (label, t) => `${label}${t ? iTip(t) : ''}`;
  const AD_KEY = { 'Live (บัญชีร้าน)': 'sel.live', 'คลิป (บัญชีร้าน)': 'sel.video', 'หน้าสินค้า': 'sel.card', 'คลิป (ครีเอเตอร์)': 'aff.video', 'Ads สร้างการรับรู้': 'aw' };
  const GRP = [['aff', 'แอฟฟิลิเอต', '#14b8a6'], ['sel', 'ผู้ขาย', '#f5b942']];
  const TYP = [['live', 'ไลฟ์'], ['video', 'วิดีโอ'], ['card', 'การ์ดสินค้า']];
  const thDate = d => { const x = new Date(d + 'T00:00:00'); return x.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }); };
  function applyView() {
    const ov = document.getElementById('tthub-ov'); if (ov) ov.style.display = _view === 'tiktok' ? 'none' : '';
    let g = document.getElementById('ttgmv-ov');
    if (!g && ov) { g = document.createElement('div'); g.id = 'ttgmv-ov'; g.style.marginBottom = '20px'; ov.parentNode.insertBefore(g, ov); }
    if (g) g.style.display = _view === 'tiktok' ? '' : 'none';
    if (typeof ttViewMark === 'function') ttViewMark(_view);   // ปุ่มมุมมองบนแถบด้านบน
  }
  function setView(v, from, to) { _view = v === 'tiktok' ? 'tiktok' : 'order'; applyView(); renderOrderChannel(from, to); }
  // การ์ด + กราฟ ของมุมมอง TikTok (หน้าตาแบบเดียวกับแม่แบบ 1)
  function renderGmvTop(V, ads, adTo) {
    const g = document.getElementById('ttgmv-ov'); if (!g) return;
    const gmv = num(V.gmv), ind = num(V.aff_live_i) + num(V.aff_video_i) + num(V.sel_live_i) + num(V.sel_video_i);
    const capNote = V.latest_date && V.to > V.latest_date ? `ข้อมูลถึง ${thDate(V.latest_date)}` : 'ตามที่ TikTok นับ';
    const tile = (l, v, d, t) => `<div class="ui-metric is-static"><span class="ui-metric-l">${l}${t ? iTip(t) : ''}</span><span class="ui-metric-v" data-fit>${v}</span><span class="ui-metric-d">${d || '&nbsp;'}</span></div>`;
    g.innerHTML = `<div class="ov"><section class="ui-metrics">`
      + tile('GMV', fmt2(gmv), capNote, 'GMV ตามที่ TikTok นับ ก่อนหักยกเลิก / คืน · ตรงกับ Seller Center\nTikTok ปล่อยข้อมูลให้ API ช้าราว 2 วัน')
      + tile('คำสั่งซื้อ', fmt(num(V.orders)), '', 'จำนวนคำสั่งซื้อตามที่ TikTok นับ')
      + tile('สินค้าที่ขายได้', fmt(num(V.items)), '', 'จำนวนชิ้นตามที่ TikTok นับ')
      + tile('ค่า Ads', ads ? baht(ads) : '—', ads && gmv ? pctTxt(ads, gmv) + ' ของ GMV' : '', `ค่า Ads TikTok ทุกบัญชี ถึงวันเดียวกับ GMV${adTo ? ' (' + thDate(adTo) + ')' : ''}`)
      + tile('ROAS', ads ? (gmv / ads).toFixed(2) + 'x' : '—', 'GMV ÷ ค่า Ads', 'GMV ÷ ค่า Ads (ช่วงวันเดียวกัน)')
      + tile('GMV โดยอ้อม', fmt2(ind), gmv ? pctTxt(ind, gmv) + ' ของ GMV' : '', 'ยอดที่ลูกค้าซื้อหลังดูไลฟ์ / วิดีโอ แต่ไม่ได้ซื้อตรงจากคอนเทนต์นั้น (TikTok นับ)')
      + `</section><div class="ov-card"><div class="ov-head"><div style="font-weight:700;font-size:15px;">แนวโน้ม GMV (TikTok)</div><div class="ov-leg" style="margin-left:auto;font-size:11.5px;color:var(--text2);"><span style="display:inline-block;width:14px;height:3px;background:#b8862f;border-radius:2px;vertical-align:middle;margin-right:5px;"></span>GMV<span style="display:inline-block;width:14px;height:3px;background:#dc2626;border-radius:2px;vertical-align:middle;margin:0 5px 0 12px;"></span>ค่า Ads</div></div><div class="ov-chart"><canvas id="ttgmvChart"></canvas></div></div></div>`;
    // กราฟ: ช่วงไม่เกิน 1 เดือน = รายวัน · หลายเดือน = รายเดือน · ค่า Ads ถึงวันเดียวกับ GMV
    const daily = (V.daily || []).map(x => ({ d: x.d, v: num(x.gmv) }));
    const multi = (V.from || '').slice(0, 7) !== (V.to || '').slice(0, 7) && daily.length > 31;
    const key = d => multi ? d.slice(0, 7) : d;
    const keys = [...new Set(daily.map(x => key(x.d)))];
    const gm = {}, am = {}; daily.forEach(x => { gm[key(x.d)] = (gm[key(x.d)] || 0) + x.v; });
    (typeof adRawData !== 'undefined' ? adRawData : []).forEach(a => { if (a.channel === 'TikTok' && a.date >= V.from && a.date <= (adTo || V.to)) { const k = key(a.date); if (k in gm) am[k] = (am[k] || 0) + (+a.ads || 0); } });
    const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const lbl = k => multi ? `${TH[+k.slice(5, 7) - 1]} ${(+k.slice(0, 4) + 543) % 100}` : `${+k.slice(8, 10)} ${TH[+k.slice(5, 7) - 1]}`;
    const cv = document.getElementById('ttgmvChart'); if (!cv || !window.Chart) return;
    if (_gmvChart) { try { _gmvChart.destroy(); } catch (e) {} }
    const css = getComputedStyle(document.body), grid = css.getPropertyValue('--border') || '#e5e7eb', tx = css.getPropertyValue('--text3') || '#9ca3af';
    _gmvChart = new Chart(cv, { type: 'line', data: { labels: keys.map(lbl), datasets: [
        { label: 'GMV', data: keys.map(k => Math.round(gm[k] || 0)), borderColor: '#b8862f', backgroundColor: 'transparent', tension: .35, pointRadius: 0, borderWidth: 2.2, yAxisID: 'y' },
        { label: 'ค่า Ads', data: keys.map(k => Math.round(am[k] || 0)), borderColor: '#dc2626', backgroundColor: 'transparent', tension: .35, pointRadius: 0, borderWidth: 2.2, yAxisID: 'y1' }] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { itemSort: (a, b) => b.raw - a.raw, callbacks: { label: c => ` ${c.dataset.label}  ${fmt(c.raw)}` } } },
        scales: { x: { grid: { display: false }, ticks: { color: tx, font: { family: 'Sarabun', size: 11 } } }, y: { display: false, beginAtZero: true }, y1: { display: false, beginAtZero: true, position: 'right' } } } });
  }
  async function renderOrderChannel(from, to) {
    const tb = document.getElementById('tbodyTtOrderChannel'); if (!tb) return;
    const seq = ++_ocSeq; applyView();
    const tbl = tb.closest('table'), card = tb.closest('.card'), title = card && card.querySelector('.section-title');
    const tk = _view === 'tiktok';
    if (title) title.innerHTML = tk
      ? 'GMV แยกตามแหล่งที่มาของคำสั่งซื้อ' + iTip('ตัวเลขชุดเดียวกับ TikTok Seller Center › รายละเอียด GMV › ตามแหล่งที่มาของคำสั่งซื้อ\nGMV ก่อนหักยกเลิก / คืน · ไม่ใช้รวมกับยอดขายช่องทางอื่น')
      : 'ยอดขายแยกตามช่องทาง' + iTip('ยอดขายจริงตามคำสั่งซื้อ (หักยกเลิก / คืนแล้ว) · ชุดเดียวกับการ์ดยอดขาย รวมทุกแถวเท่าการ์ดเสมอ\nแบ่งแบบเดียวกับ TikTok: แอฟฟิลิเอต = ออเดอร์ที่ TikTok จ่าย Commission ให้ครีเอเตอร์ · ผู้ขาย = บัญชีร้าน\nลดหนี้ (CN) = ยอดลดหนี้ตามบัญชี');
    if (tbl && tbl.tHead) tbl.tHead.innerHTML = `<tr><th class="l">ช่องทาง</th>`
      + (tk ? `<th>${thTip('GMV', 'GMV ตามที่ TikTok นับ (ก่อนหักยกเลิก / คืน) = GMV ตรง + GMV โดยอ้อม')}</th><th>${thTip('GMV โดยอ้อม', 'ยอดที่ลูกค้าซื้อหลังดูไลฟ์ / วิดีโอ แต่ไม่ได้ซื้อตรงจากคอนเทนต์นั้น')}</th>`
            : `<th>${thTip('ยอดขาย', 'ยอดขายจริง หักยกเลิก / คืนแล้ว')}</th><th>ออเดอร์</th>`)
      + `<th>สัดส่วน</th><th class="tt-gl tt-ad">ค่า Ads</th><th class="tt-ad">${thTip('ROAS', tk ? 'GMV ÷ ค่า Ads (ค่า Ads ถึงวันเดียวกับ GMV)' : 'ยอดขายจริง ÷ ค่า Ads')}</th><th class="tt-ad">${thTip('%Ads', tk ? 'ค่า Ads ÷ GMV' : 'ค่า Ads ÷ ยอดขายจริง')}</th>`
      + `<th class="tt-gl tt-ad">${thTip('ยอดขายจาก Ads (TikTok)', 'ยอดขายที่ TikTok บอกว่ามาจาก Ads\nTikTok นับตอนลูกค้ากดสั่ง (ก่อนหักยกเลิก / คืน) และนับยอดทั้งไลฟ์ที่มี Ads วิ่ง')}</th><th class="tt-ad">${thTip('ROI (TikTok)', 'ROI ที่ TikTok คำนวณ = ยอดขายจาก Ads (TikTok) ÷ ค่า Ads\nแถวรวมไม่นับ Ads สร้างการรับรู้')}</th></tr>`;
    try {
      let C = {}, ord = {}, ind = {}, est = {}, adTo = to, V = null;
      if (tk) {
        V = await supaRpc('tt_gmv_view', { p_from: from, p_to: to }, true);
        adTo = V && V.latest_date && V.latest_date < to ? V.latest_date : to;
        const m = { 'aff.live': [V.aff_live_d, V.aff_live_i], 'aff.video': [V.aff_video_d, V.aff_video_i], 'aff.card': [V.aff_card, null], 'sel.live': [V.sel_live_d, V.sel_live_i], 'sel.video': [V.sel_video_d, V.sel_video_i], 'sel.card': [V.sel_card, null] };
        Object.entries(m).forEach(([k, [d, i]]) => { C[k] = num(d) + num(i); ind[k] = i == null ? null : num(i); });
      } else {
        const rows = await supaRpc('tt_channel_grid', { p_from: from, p_to: to }, true);
        (rows || []).forEach(r => { const k = r.grp + '.' + r.typ; C[k] = num(r.revenue); ord[k] = num(r.orders); est[k] = !!r.est; });
      }
      const adRows = adTo >= from ? await supaRpc('tt_channel_ads', { p_from: from, p_to: adTo }, true).catch(() => []) : [];
      if (seq !== _ocSeq) return;
      const AD = {}; (adRows || []).forEach(a => { const k = AD_KEY[a.label]; if (k) AD[k] = { cost: num(a.ad_cost), rev: a.ad_rev == null ? null : num(a.ad_rev) }; });
      const dash = '<span style="color:var(--text3);">—</span>';
      const money = v => tk ? fmt2(v) : baht(v);
      const adCells = (sales, a) => {
        if (!a || !(a.cost > 0)) return `<td class="tt-gl">${dash}</td><td>${dash}</td><td>${dash}</td><td class="tt-gl">${a && a.rev ? baht(a.rev) : dash}</td><td>${dash}</td>`;
        return `<td class="tt-gl">${baht(a.cost)}</td><td>${sales > 0 ? (sales / a.cost).toFixed(2) + 'x' : dash}</td><td>${sales > 0 ? pctTxt(a.cost, sales) : dash}</td><td class="tt-gl">${a.rev == null ? dash : baht(a.rev)}</td><td>${a.rev == null ? dash : (a.rev / a.cost).toFixed(2) + 'x'}</td>`;
      };
      const sumAd = keys => keys.reduce((o, k) => { const a = AD[k]; if (a) { o.cost += a.cost; if (a.rev != null) o.rev = (o.rev || 0) + a.rev; } return o; }, { cost: 0, rev: null });
      const cn = num(C['cn.cn']);
      const tot = GRP.reduce((t, [g]) => t + TYP.reduce((a, [ty]) => a + num(C[g + '.' + ty]), 0), 0) + cn;
      const estTip = 'ตั้งแต่ออเดอร์มาจาก API (ต.ค. 69) ออเดอร์ไม่บอกว่ามาจากคลิปร้านหรือการ์ดสินค้า · แบ่งยอดรายวันตามสัดส่วนที่ TikTok บอก (ผู้ขาย · วิดีโอ : ผู้ขาย · การ์ดสินค้า) · ยอดรวมผู้ขายยังตรง';
      let h = '';
      GRP.forEach(([g, gname, color]) => {
        const keys = TYP.map(([ty]) => g + '.' + ty), gv = keys.reduce((a, k) => a + num(C[k]), 0);
        const g2 = tk ? keys.reduce((a, k) => a + (ind[k] || 0), 0) : keys.reduce((a, k) => a + num(ord[k]), 0);
        h += `<tr class="tt-grp"><td class="l"><span class="tt-dot" style="background:${color}"></span><b>${gname}</b></td><td><b>${money(gv)}</b></td><td><b>${tk ? fmt2(g2) : fmt(g2)}</b></td><td><b>${pctTxt(gv, tot)}</b></td>${adCells(gv, sumAd(keys))}</tr>`;
        TYP.forEach(([ty, tname]) => {
          const k = g + '.' + ty, v = num(C[k]), e = !tk && est[k];
          const c2 = tk ? (ind[k] == null ? dash : fmt2(ind[k])) : (ord[k] ? fmt(ord[k]) : dash);
          h += `<tr><td class="l tt-sub">${tname}${e ? ` <span data-tip="${esc(estTip)}" style="color:var(--text3);">≈</span>` : ''}</td><td>${money(v)}</td><td>${c2}</td><td>${pctTxt(v, tot)}</td>${adCells(v, AD[k])}</tr>`;
        });
      });
      if (!tk && cn) h += `<tr style="color:var(--text3);"><td class="l">ลดหนี้ (CN)</td><td>${baht(cn)}</td><td>${dash}</td><td>${pctTxt(cn, tot)}</td>${adCells(0, null)}</tr>`;
      if (AD.aw) h += `<tr style="color:var(--text3);"><td class="l">Ads สร้างการรับรู้${iTip('Ads แบบ Reach / Video views / Brand ที่ไม่ผูกกับยอดขาย · แยกแถวไว้ ไม่ให้ ROAS ของช่องทางอื่นเพี้ยน')}</td><td>${dash}</td><td>${dash}</td><td>${dash}</td>${adCells(0, { cost: AD.aw.cost, rev: null })}</tr>`;
      const adCost = Object.values(AD).reduce((a, x) => a + x.cost, 0), adRev = Object.values(AD).reduce((a, x) => a + (x.rev || 0), 0);
      const roiCost = Object.values(AD).filter(x => x.rev != null).reduce((a, x) => a + x.cost, 0);
      const t2 = tk ? fmt2(Object.values(ind).reduce((a, x) => a + (x || 0), 0)) : fmt(Object.values(ord).reduce((a, x) => a + num(x), 0));
      h += `<tr class="ui-sum"><td class="l">รวม</td><td>${money(tot)}</td><td>${t2}</td><td>100%</td><td class="tt-gl">${adCost ? baht(adCost) : dash}</td><td>${adCost && tot > 0 ? (tot / adCost).toFixed(2) + 'x' : dash}</td><td>${adCost && tot > 0 ? pctTxt(adCost, tot) : dash}</td><td class="tt-gl">${adRev ? baht(adRev) : dash}</td><td>${roiCost ? (adRev / roiCost).toFixed(2) + 'x' : dash}</td></tr>`;
      tb.innerHTML = tot || adCost ? h : '<tr><td colspan="9" class="empty">ไม่มีข้อมูล</td></tr>';
      if (tk && V) renderGmvTop(V, adCost, adTo);
    } catch (e) { console.warn('tt channel grid', e); tb.innerHTML = `<tr><td colspan="9" class="empty">โหลดไม่สำเร็จ: ${esc(e.message)}</td></tr>`; }
  }
  function setLiveScope(s) { _liveScope = s; if (typeof renderTtHub === 'function' && currentPage === 'tthub') renderTraffic(getDateValue('From'), getDateValue('To')); }

  // ================= Creator Performance (วิธี API): Commission + คอนเทนต์ =================
  let _crSeq = 0, _crType = 'all', _crCh = 'all', _crArgs = null;
  const CT_LABEL = { open: 'เปิด', target: 'ปิด', both: 'เปิด + ปิด' };
  const kb = h => (typeof cpKindBadge === 'function' ? cpKindBadge(h) : '');   // (d) ป้าย KOL / Affiliate / บัญชีร้าน
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
      <div class="section-divider"><span>💰 ครีเอเตอร์ · Commission · คอนเทนต์ (TikTok API) ${info('ttapi-cr-info', '<b>ที่มา:</b> Affiliate API ของ TikTok Shop — ทุกออเดอร์ที่ TikTok จ่าย Commission ให้ครีเอเตอร์<br><b>ยอดขาย</b> = ยอดสุทธิของออเดอร์ (ไม่นับยกเลิก / คืน) · 1 ออเดอร์นับให้ครีเอเตอร์ที่ได้ Commission มากสุด<br><b>Commission</b> = ที่ TikTok จ่ายครีเอเตอร์ · <b>Ads Commission</b> = ส่วนที่จ่ายผ่าน GMV Max<br><b>ยอดต่อ 1</b> = ยอดขาย ÷ (Commission + Ads Commission)<br><b>กรองช่องทาง</b> (Live / คลิป / โชว์เคส): ยอดขายเป็นของช่องทางนั้น แต่ Commission เป็นของทั้งคน (TikTok ไม่แยกตามช่องทาง) จึงไม่คำนวณ % และยอดต่อ 1<br><b>เปิด (Open Collaboration)</b> = ครีเอเตอร์คนไหนก็หยิบสินค้าไปขายได้ ตามอัตรา Commission ที่ร้านเปิดไว้<br><b>ปิด (Target Collaboration)</b> = ร้านเชิญครีเอเตอร์เฉพาะคน ตั้งอัตราเฉพาะ (ส่วนใหญ่คือ KOL ที่จ้าง — Commission จึงต่ำ เพราะจ่ายค่าจ้างแยก ดูหน้า KOL)<br><b>ตัวกรองด้านบน</b> ทุกคน / KOL / Affiliate ใช้กับส่วนนี้ด้วย · ป้ายหลังชื่อ = กลุ่มของครีเอเตอร์ (KOL = มีงานในไฟล์ทีม KOL)')}</span></div>
      <div id="ttapi-cr-kpis" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;"></div>
      <div class="card" style="margin-bottom:16px;"><div class="section-header"><div class="section-title">เปิด vs ปิด</div></div>
        <div class="table-wrap"><table><thead><tr><th>แบบ</th><th>ครีเอเตอร์</th><th>ออเดอร์</th><th>ยอดขาย</th><th>สัดส่วนยอด</th><th>Commission</th><th>Ads Commission</th><th>% Commission</th><th>ยอดเฉลี่ย / คน</th><th>Commission เฉลี่ย / คน</th></tr></thead><tbody id="ttapi-ct-cmp"><tr><td colspan="10" class="empty">กำลังโหลด...</td></tr></tbody></table></div></div>
      <div class="card" style="margin-bottom:16px;"><div class="section-header"><div class="section-title">ครีเอเตอร์ทั้งหมด (กดชื่อเพื่อดูรายละเอียด)</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <div class="toggle-group">${[['all', 'ทุกช่องทาง'], ['live', 'Live'], ['video', 'คลิป'], ['other', 'โชว์เคส / ลิงก์']].map(([k, l]) => `<button class="toggle-btn ${_crCh === k ? 'active' : ''}" onclick="ttApi.setCrCh('${k}')">${l}</button>`).join('')}</div>
          <div class="toggle-group">${[['all', 'เปิด + ปิด'], ['open', 'เปิด'], ['target', 'ปิด']].map(([k, l]) => `<button class="toggle-btn ${_crType === k ? 'active' : ''}" onclick="ttApi.setCrType('${k}')">${l}</button>`).join('')}</div>
        </div></div>
        <div class="table-wrap"><table><thead><tr><th>ครีเอเตอร์</th><th>แบบ</th><th>ยอดขาย</th><th>ออเดอร์</th><th>Commission</th><th>Ads Commission</th><th>% ของยอด</th><th>ยอดต่อ 1</th>${_crType === 'all' ? '<th>Live / คลิป / อื่นๆ</th>' : ''}<th>คอนเทนต์</th></tr></thead><tbody id="ttapi-cr-body"><tr><td colspan="10" class="empty">กำลังโหลด...</td></tr></tbody></table></div><div id="ttapi-cr-pager"></div></div>
      <div class="card" style="margin-bottom:20px;"><div class="section-header"><div class="section-title">คอนเทนต์ที่ขายได้${handle ? ' — @' + esc(handle) : ''}</div></div>
        <div class="table-wrap"><table><thead><tr><th>ประเภท</th><th>ครีเอเตอร์</th><th>คอนเทนต์</th><th>ยอดขาย</th><th>ออเดอร์</th><th>Commission</th><th>ขายช่วง</th></tr></thead><tbody id="ttapi-ct-body"><tr><td colspan="7" class="empty">กำลังโหลด...</td></tr></tbody></table></div><div id="ttapi-ct-pager"></div></div>`;
    try {
      const [cr, ct] = await Promise.all([supaRpc('creator_commission_api', { p_from: from, p_to: to }, true), supaRpc('creator_content_api', { p_from: from, p_to: to, p_handle: handle || null, p_limit: 500 }, true)]);
      if (seq !== _crSeq) return;
      const typeOk = h => (typeof cpTypeOk === 'function' ? cpTypeOk(h) : true);   // (d) ตัวกรอง ทุกคน / KOL / Affiliate
      const base = handle ? cr.filter(r => r.creator === String(handle).toLowerCase()) : cr.filter(r => typeOk(r.creator));
      const ctRows = handle ? ct : ct.filter(r => typeOk(r.creator));
      const sum = (arr, k) => arr.reduce((t, r) => t + num(r[k]), 0);
      const S = { rev: sum(base, 'revenue'), com: sum(base, 'commission'), ads: sum(base, 'shop_ads_commission'), ct: sum(base, 'contents') };
      const op = base.filter(r => num(r.open_orders) > 0), tg = base.filter(r => num(r.target_orders) > 0);
      const O = { n: op.length, ord: sum(op, 'open_orders'), rev: sum(op, 'open_rev'), com: sum(op, 'open_com'), ads: sum(op, 'open_ads') };
      const G = { n: tg.length, ord: sum(tg, 'target_orders'), rev: sum(tg, 'target_rev'), com: sum(tg, 'target_com'), ads: sum(tg, 'target_ads') };
      document.getElementById('ttapi-cr-kpis').innerHTML =
        kpi('Commission', baht(S.com), pctTxt(S.com, S.rev) + ' ของยอดครีเอเตอร์ · ' + fmt(base.length) + ' คน') +
        kpi('เปิด (Open)', baht(O.rev), `${fmt(O.n)} คน · Commission ${baht(O.com)}`) +
        kpi('ปิด (Target)', baht(G.rev), `${fmt(G.n)} คน · Commission ${baht(G.com)}`) +
        kpi('Ads Commission (GMV Max)', baht(S.ads), '') +
        kpi('คอนเทนต์ที่ขายได้', fmt(S.ct), '');
      const cmpRow = (label, X) => `<tr><td>${label}</td><td>${fmt(X.n)}</td><td>${fmt(X.ord)}</td><td>${baht(X.rev)}</td><td>${pctTxt(X.rev, O.rev + G.rev)}</td><td>${baht(X.com)}</td><td>${X.ads ? baht(X.ads) : '—'}</td><td>${pctTxt(X.com, X.rev)}</td><td>${X.n ? baht(X.rev / X.n) : '—'}</td><td>${X.n ? baht(X.com / X.n) : '—'}</td></tr>`;
      const all = { n: base.length, ord: O.ord + G.ord, rev: O.rev + G.rev, com: O.com + G.com, ads: O.ads + G.ads };
      document.getElementById('ttapi-ct-cmp').innerHTML = cmpRow(ctBadge('open') + ' Open Collaboration', O) + cmpRow(ctBadge('target') + ' Target Collaboration', G) + cmpRow('<b>รวม</b>', all).replace('<tr>', '<tr style="font-weight:700;">');
      // ตารางรายคน: ทั้งหมด = ยอดรวมของคนนั้น · เปิด / ปิด = เฉพาะยอดแบบนั้น
      const pick = (r, k) => _crType === 'all' ? num(r[{ ord: 'orders', rev: 'revenue', com: 'commission', ads: 'shop_ads_commission' }[k]]) : num(r[_crType + '_' + { ord: 'orders', rev: 'rev', com: 'com', ads: 'ads' }[k]]);
      // กรองช่องทาง: ยอดเฉพาะช่องทางนั้น (Commission / ออเดอร์ยังเป็นของทั้งคน เพราะ TikTok ไม่แยก Commission ตามช่องทาง)
      const chRev = r => _crCh === 'all' ? null : num(r['rev_' + _crCh]);
      const rows = (_crType === 'all' ? base : _crType === 'open' ? op : tg)
        .map(r => ({ r, ord: pick(r, 'ord'), rev: chRev(r) ?? pick(r, 'rev'), com: pick(r, 'com'), ads: pick(r, 'ads') }))
        .filter(x => x.rev > 0).sort((x, y) => y.rev - x.rev);
      const bar = r => { const t = num(r.revenue) || 1; const seg = (v, c) => `<span style="display:inline-block;height:8px;width:${(num(v) / t * 100).toFixed(1)}%;background:${c};"></span>`;
        return `<div title="Live ${baht(r.rev_live)} · คลิป ${baht(r.rev_video)} · อื่นๆ ${baht(r.rev_other)}" style="width:120px;background:var(--bg3);border-radius:4px;overflow:hidden;display:flex;">${seg(r.rev_live, '#f472b6')}${seg(r.rev_video, '#60a5fa')}${seg(r.rev_other, '#c8a96e')}</div>`; };
      pagedTable('ttapi-cr', rows, x => { const r = x.r, cost = x.com + x.ads;
        return `<tr><td style="font-family:'IBM Plex Mono',monospace;font-size:11px;"><a href="javascript:void(0)" onclick="selectCpCreator('${esc(r.creator)}')" style="color:inherit;text-decoration:underline dotted;">@${esc(r.creator)}</a>${kb(r.creator)}</td><td>${ctBadge(r.collab)}</td><td>${baht(x.rev)}</td><td>${fmt(x.ord)}</td><td>${baht(x.com)}</td><td>${x.ads ? baht(x.ads) : '—'}</td><td>${_crCh === 'all' ? pctTxt(x.com, x.rev) : '—'}</td><td>${_crCh === 'all' && cost > 0 ? baht(x.rev / cost) : '—'}</td>${_crType === 'all' ? `<td>${bar(r)}</td>` : ''}<td>${fmt(r.contents)}</td></tr>`; }, _crType === 'all' ? 10 : 9);
      const TYPE = { LIVE: 'Live', VIDEO: 'คลิป', SHOWCASE: 'โชว์เคส', LINKSHARE: 'ลิงก์', SHOP: 'ร้าน' };
      pagedTable('ttapi-ct', ctRows, r => {
        const link = r.content_type === 'VIDEO' ? `<a href="https://www.tiktok.com/@${encodeURIComponent(r.creator)}/video/${encodeURIComponent(r.content_id)}" target="_blank" rel="noopener" style="color:var(--blue,#60a5fa);">เปิดคลิป ↗</a>`
          : `<span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--text3);">${esc(r.content_id)}</span>`;
        return `<tr><td>${TYPE[r.content_type] || esc(r.content_type || '—')}</td><td style="font-family:'IBM Plex Mono',monospace;font-size:11px;">@${esc(r.creator)}${kb(r.creator)}</td><td>${link}</td><td>${baht(r.revenue)}</td><td>${fmt(r.orders)}</td><td>${baht(r.commission)}</td><td style="white-space:nowrap;">${r.first_date === r.last_date ? r.first_date : r.first_date + ' – ' + r.last_date}</td></tr>`;
      }, 7);
    } catch (e) {
      if (seq === _crSeq) document.getElementById('ttapi-cr-kpis').innerHTML = `<div class="error-banner" style="display:block;">โหลด Commission ไม่สำเร็จ: ${esc(e.message)}</div>`;
    }
  }

  function setCrType(t) { _crType = t; if (t !== 'all') _crCh = 'all'; if (_crArgs) renderCreatorExtras(..._crArgs); }
  function setCrCh(c) { _crCh = c; if (c !== 'all') _crType = 'all'; if (_crArgs) renderCreatorExtras(..._crArgs); }
  window.ttApi = { renderTraffic, renderOrderChannel, renderCreatorExtras, setLiveScope, setCrType, setCrCh, setView, getView: () => _view };
})();
