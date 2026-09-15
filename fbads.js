// fbads.js — หน้า "Facebook Ads" (Meta Marketing API → fb_ads_daily) — โหลดครั้งแรกที่กดเมนู (เหมือน supply.js)
// ข้อมูล: RPC fb_ads_page(p_from, p_to) ครั้งเดียว · ยอดขายจริง = ออเดอร์ Facebook ของเรา (mv_sales_daily) ไม่ใช่ที่ Meta นับ
// ใช้ helper ของ dashboard.html: supaRpc, makeChart, fmt, fmtB, thShort, ttcEsc, ttcEscAttr, exportTable, fbeInfoIcon, COLORS, getDateValue, chartTickColor/chartGridColor, setBgSync
(function () {
  let _data = null, _seq = 0, _sortKey = 'spend', _sortDir = 'desc', _adsSortKey = 'spend', _adsSortDir = 'desc', _filterAccount = '', _filterObjective = '';
  const OBJ_TH = { OUTCOME_SALES: 'ยอดขาย', OUTCOME_ENGAGEMENT: 'การมีส่วนร่วม', OUTCOME_TRAFFIC: 'คลิกเข้าเว็บ', OUTCOME_LEADS: 'ลูกค้าเป้าหมาย', OUTCOME_AWARENESS: 'การรับรู้', OUTCOME_APP_PROMOTION: 'แอป', MESSAGES: 'ข้อความ', CONVERSIONS: 'คอนเวอร์ชัน', LINK_CLICKS: 'คลิกลิงก์', POST_ENGAGEMENT: 'การมีส่วนร่วม', REACH: 'การเข้าถึง', VIDEO_VIEWS: 'ยอดวิว' };
  const obj = o => OBJ_TH[o] || o || '—';
  const money = n => n ? '฿' + fmt(n) : '—';
  const pct = (a, b) => b ? (a / b * 100).toFixed(2) + '%' : '—';
  const per = (spend, n) => n ? '฿' + fmt(spend / n) : '—';
  const roasCell = (rev, spend) => { if (!spend) return '<span style="color:var(--text3);">—</span>'; const r = rev / spend; const col = r >= 2 ? 'var(--green)' : r >= 1 ? 'var(--accent)' : 'var(--red)'; return `<span style="color:${col};font-weight:700;">${r.toFixed(2)}x</span>`; };
  const postUrl = p => p ? `https://www.facebook.com/${p}` : '';

  function shell() {
    const el = document.getElementById('page-fbads'); if (!el) return null;
    if (!el.dataset.built) {
      el.dataset.built = '1';
      el.innerHTML = `
        <div class="card" style="margin-bottom:16px;padding:12px 16px;">
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
            <span style="font-size:11px;color:var(--text3);">กรอง</span>
            <select class="ls-input" id="fbaFilterAccount" style="width:200px;flex:0 0 auto;padding:6px 10px;font-size:12px;"><option value="">ทุกบัญชีโฆษณา</option></select>
            <select class="ls-input" id="fbaFilterObjective" style="width:170px;flex:0 0 auto;padding:6px 10px;font-size:12px;"><option value="">ทุก objective</option></select>
            <span id="fba-last-sync" style="font-size:10.5px;color:var(--text3);margin-left:auto;"></span>
          </div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:8px;line-height:1.6;"><b>ค่าแอด</b> = ตัวเลขจาก Meta ทุกบัญชีโฆษณา (เท่ากับ Ads Manager) · <b>ยอดขายจริง</b> = ออเดอร์ Facebook ในระบบเรา (ขายผ่านแชท Meta ไม่รู้) · <b>ทักแชท</b> = จำนวนคนที่เริ่มคุยจากแอด (Meta นับ) · <b>ซื้อ (Meta นับ)</b> = ที่ pixel จับได้ ไว้ดูประกอบเท่านั้น · ช่วงวันที่ตามตัวกรองด้านบน</div>
        </div>
        <div id="fba-kpis" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;"></div>
        <div class="grid-2" style="margin-bottom:20px;">
          <div class="card" style="grid-column:span 2;"><div class="section-header"><div class="section-title">ค่าแอด vs ยอดขายจริง Facebook รายวัน</div></div><div class="chart-wrap" style="height:280px;"><canvas id="chartFbaDaily"></canvas></div></div>
          <div class="card"><div class="section-header"><div class="section-title">แยกตามที่วางแอด</div></div><div class="chart-wrap" style="height:220px;"><canvas id="chartFbaPlatform"></canvas></div></div>
          <div class="card"><div class="section-header"><div class="section-title">แยกตาม objective</div></div><div class="table-wrap"><table id="tblFbaObjective" data-no-page><thead><tr><th>objective</th><th>แคมเปญ</th><th>ค่าแอด</th><th>% งบ</th><th>ทักแชท</th><th>฿/ทัก</th><th>ซื้อ (Meta นับ)</th></tr></thead><tbody id="tbodyFbaObjective"></tbody></table></div></div>
        </div>
        <div class="card" style="margin-bottom:20px;"><div class="section-header"><div class="section-title">ตามบัญชีโฆษณา</div><button class="btn btn-ghost" onclick="exportTable('tblFbaAccount')">⬇ Export CSV</button></div>
          <div class="table-wrap"><table id="tblFbaAccount" data-no-page><thead><tr><th>บัญชี</th><th>แอด</th><th>ค่าแอด</th><th>% งบ</th><th>Impressions</th><th>Reach</th><th>CPM</th><th>คลิกลิงก์</th><th>฿/คลิก</th><th>ทักแชท</th><th>฿/ทัก</th><th>ซื้อ (Meta นับ)</th></tr></thead><tbody id="tbodyFbaAccount"></tbody></table></div></div>
        <div class="card" style="margin-bottom:20px;"><div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">แคมเปญ <span id="fba-camp-count" style="font-size:11px;font-weight:400;color:var(--text3);"></span></div><button class="btn btn-ghost" onclick="exportTable('tblFbaCampaign')">⬇ Export CSV</button></div>
          <div class="table-wrap" style="overflow-x:auto;"><table id="tblFbaCampaign"><thead><tr>
            <th>แคมเปญ</th><th>บัญชี</th><th>objective</th><th>สถานะ</th><th>แอด</th>
            <th class="sortable-th" data-k="spend">ค่าแอด <span class="sort-ind"></span></th><th class="sortable-th" data-k="impressions">Impr. <span class="sort-ind"></span></th><th>CPM</th>
            <th class="sortable-th" data-k="link_clicks">คลิกลิงก์ <span class="sort-ind"></span></th><th>CTR</th><th class="sortable-th" data-k="msg_started">ทักแชท <span class="sort-ind"></span></th><th>฿/ทัก</th>
            <th class="sortable-th" data-k="purchases">ซื้อ (Meta) <span class="sort-ind"></span></th><th>ช่วงที่รัน</th></tr></thead><tbody id="tbodyFbaCampaign"></tbody></table></div></div>
        <div class="card" style="margin-bottom:20px;"><div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">แอด / โพสต์ที่ยิง <span id="fba-ads-count" style="font-size:11px;font-weight:400;color:var(--text3);"></span></div>
          <div style="display:flex;gap:8px;align-items:center;"><input type="text" class="ls-input" id="fbaAdsSearch" placeholder="🔎 ชื่อแอด / แคมเปญ / KOL" style="width:220px;padding:6px 10px;font-size:12px;"><button class="btn btn-ghost" onclick="exportTable('tblFbaAds')">⬇ Export CSV</button></div></div>
          <div class="table-wrap" style="overflow-x:auto;"><table id="tblFbaAds"><thead><tr>
            <th>โพสต์</th><th>แอด</th><th>แคมเปญ</th><th>บัญชี</th>
            <th class="sortable-th" data-k="spend">ค่าแอด <span class="sort-ind"></span></th><th class="sortable-th" data-k="impressions">Impr. <span class="sort-ind"></span></th><th class="sortable-th" data-k="reach">Reach <span class="sort-ind"></span></th>
            <th class="sortable-th" data-k="post_engagement">มีส่วนร่วม <span class="sort-ind"></span></th><th>ER</th><th class="sortable-th" data-k="link_clicks">คลิกลิงก์ <span class="sort-ind"></span></th>
            <th class="sortable-th" data-k="msg_started">ทักแชท <span class="sort-ind"></span></th><th>฿/ทัก</th><th class="sortable-th" data-k="purchases">ซื้อ (Meta) <span class="sort-ind"></span></th><th>วันที่รัน</th></tr></thead><tbody id="tbodyFbaAds"></tbody></table></div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:8px;line-height:1.6;">ER = มีส่วนร่วม ÷ Impressions · โพสต์ที่ยิงคือโพสต์จริงบนเพจ (ของเราหรือของ KOL) คลิกรูปเพื่อเปิด · "KOL" มาจากท้ายชื่อแอดที่ทีมตั้ง (…_KOLs_สินค้า_ชื่อKOL)</div></div>`;
      document.getElementById('fbaFilterAccount').onchange = e => { _filterAccount = e.target.value; render(); };
      document.getElementById('fbaFilterObjective').onchange = e => { _filterObjective = e.target.value; render(); };
      document.getElementById('fbaAdsSearch').oninput = () => renderAds();
      document.querySelectorAll('#tblFbaCampaign th.sortable-th').forEach(th => th.onclick = () => { const k = th.dataset.k; if (_sortKey === k) _sortDir = _sortDir === 'desc' ? 'asc' : 'desc'; else { _sortKey = k; _sortDir = 'desc'; } renderCampaigns(); });
      document.querySelectorAll('#tblFbaAds th.sortable-th').forEach(th => th.onclick = () => { const k = th.dataset.k; if (_adsSortKey === k) _adsSortDir = _adsSortDir === 'desc' ? 'asc' : 'desc'; else { _adsSortKey = k; _adsSortDir = 'desc'; } renderAds(); });
    }
    return el;
  }

  async function load() {
    const el = shell(); if (!el) return;
    const seq = ++_seq;
    const from = getDateValue('From'), to = getDateValue('To');
    document.getElementById('fba-kpis').innerHTML = Array.from({ length: 5 }, () => `<div class="card" style="flex:1;min-width:150px;"><div class="card-title">&nbsp;</div><div class="kpi-value"><span class="skeleton" style="display:inline-block;width:70%;height:22px;border-radius:4px;"></span></div></div>`).join('');
    try {
      const d = await supaRpc('fb_ads_page', { p_from: from, p_to: to });
      if (seq !== _seq) return;
      _data = d;
      // ตัวกรอง
      const accSel = document.getElementById('fbaFilterAccount'), objSel = document.getElementById('fbaFilterObjective');
      const keep = (sel, values) => { const cur = sel.value; sel.innerHTML = sel.options[0].outerHTML + values.map(v => `<option value="${ttcEscAttr(v.value)}">${ttcEsc(v.label)}</option>`).join(''); if ([...sel.options].some(o => o.value === cur)) sel.value = cur; else { sel.value = ''; } };
      keep(accSel, (d.by_account || []).map(a => ({ value: a.name || a.account_id, label: `${a.name || a.account_id} (฿${fmtB(a.spend)})` })));
      keep(objSel, (d.by_objective || []).map(o => ({ value: o.objective, label: `${obj(o.objective)} (฿${fmtB(o.spend)})` })));
      _filterAccount = accSel.value; _filterObjective = objSel.value;
      document.getElementById('fba-last-sync').textContent = d.last_sync ? 'ดึงล่าสุด ' + new Date(d.last_sync).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '';
      render();
    } catch (e) {
      document.getElementById('fba-kpis').innerHTML = `<div class="card" style="flex:1;"><div style="color:var(--red);font-size:12px;">โหลดข้อมูลไม่สำเร็จ: ${ttcEsc(e.message)} — รัน 82 + 83 แล้วหรือยัง?</div></div>`;
    }
  }

  function filteredAds() {
    let a = _data.ads || [];
    if (_filterAccount) a = a.filter(x => (x.account || '') === _filterAccount);
    if (_filterObjective) a = a.filter(x => (x.objective || 'ไม่ระบุ') === _filterObjective);
    return a;
  }
  function filteredCampaigns() {
    let c = _data.by_campaign || [];
    if (_filterAccount) c = c.filter(x => (x.account || '') === _filterAccount);
    if (_filterObjective) c = c.filter(x => (x.objective || 'ไม่ระบุ') === _filterObjective);
    return c;
  }

  function render() {
    const d = _data; if (!d) return;
    const filtered = _filterAccount || _filterObjective;
    // KPI: ถ้ากรอง ใช้ผลรวมจากแคมเปญที่กรอง · ไม่กรอง ใช้ daily (มี revenue)
    const camps = filteredCampaigns();
    const T = filtered ? camps.reduce((s, c) => ({ spend: s.spend + +c.spend, impressions: s.impressions + +c.impressions, link_clicks: s.link_clicks + +c.link_clicks, msg_started: s.msg_started + +c.msg_started, purchases: s.purchases + +c.purchases, purchase_value: s.purchase_value + +c.purchase_value }), { spend: 0, impressions: 0, link_clicks: 0, msg_started: 0, purchases: 0, purchase_value: 0 })
      : (d.daily || []).reduce((s, r) => ({ spend: s.spend + +r.spend, impressions: s.impressions + +r.impressions, link_clicks: s.link_clicks + +r.link_clicks, msg_started: s.msg_started + +r.msg_started, purchases: s.purchases + +r.purchases, purchase_value: s.purchase_value + +r.purchase_value }), { spend: 0, impressions: 0, link_clicks: 0, msg_started: 0, purchases: 0, purchase_value: 0 });
    const rev = (d.daily || []).reduce((s, r) => s + +r.revenue, 0);
    const kpi = (t, v, sub, style) => `<div class="card" style="flex:1;min-width:150px;${style || ''}"><div class="card-title">${t}</div><div class="kpi-value">${v}</div>${sub ? `<div style="font-size:10px;color:var(--text3);margin-top:3px;">${sub}</div>` : ''}</div>`;
    document.getElementById('fba-kpis').innerHTML =
      kpi('ค่าแอดรวม', '฿' + fmtB(T.spend), `${fmt(T.impressions)} impressions · CPM ฿${T.impressions ? (T.spend / T.impressions * 1000).toFixed(0) : '—'}`, 'border-left:3px solid #60a5fa;') +
      kpi('ยอดขายจริง Facebook ' + fbeInfoIcon('fba-info-rev', 'ออเดอร์ช่องทาง Facebook ในระบบเรา (ทุกเพจ) ช่วงเดียวกัน — ไม่แยกตามบัญชีโฆษณาได้ เพราะออเดอร์มาจากแชท ไม่รู้ว่ามาจากแอดไหน'), '฿' + fmtB(rev), filtered ? 'ทั้งช่องทาง (ไม่กรองตามบัญชี)' : '', 'border-left:3px solid var(--green);') +
      kpi('ROAS ' + fbeInfoIcon('fba-info-roas', 'ยอดขายจริง Facebook ÷ ค่าแอด' + (filtered ? ' (ค่าแอดเฉพาะที่กรอง แต่ยอดขายทั้งช่องทาง — ตีความระวัง)' : '') + '<br>เขียว ≥ 2x · ทอง 1–2x · แดง < 1x'), roasCell(rev, T.spend), T.spend ? `ROI ${((rev - T.spend) / T.spend * 100).toFixed(0)}%` : '') +
      kpi('ทักแชท', fmt(T.msg_started), `฿${T.msg_started ? fmt(T.spend / T.msg_started) : '—'} ต่อการทัก 1 ครั้ง · คลิกลิงก์ ${fmt(T.link_clicks)}`) +
      kpi('ซื้อ (Meta นับ) ' + fbeInfoIcon('fba-info-pur', 'จำนวนซื้อที่ pixel/CAPI ของ Meta จับได้ — ต่ำกว่าจริงแน่นอนสำหรับการขายผ่านแชท ไว้ดูแนวโน้ม ไม่ใช่ยอดจริง'), fmt(T.purchases), T.purchase_value ? `มูลค่าที่ Meta นับ ฿${fmtB(T.purchase_value)}` : '');

    // กราฟรายวัน
    const daily = d.daily || [];
    const labels = daily.map(r => thShort(r.d));
    makeChart('chartFbaDaily', 'bar', labels, [
      { type: 'line', label: 'ยอดขายจริง Facebook', data: daily.map(r => +r.revenue), borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,0.15)', fill: true, tension: 0.3, pointRadius: 2, yAxisID: 'y' },
      { type: 'bar', label: 'ค่าแอด', data: daily.map(r => +r.spend), backgroundColor: 'rgba(96,165,250,0.6)', yAxisID: 'y1', borderRadius: 3 },
      { type: 'line', label: 'ทักแชท', data: daily.map(r => +r.msg_started), borderColor: '#f472b6', borderDash: [4, 3], pointRadius: 0, yAxisID: 'y2', hidden: true }
    ], {
      options: { interaction: { mode: 'index', intersect: false } },
      scales: {
        x: { ticks: { color: chartTickColor(), font: { family: 'Sarabun', size: 10 }, maxTicksLimit: 14 }, grid: { color: chartGridColor() } },
        y: { position: 'left', ticks: { color: chartTickColor(), font: { family: 'Sarabun', size: 10 }, callback: v => fmtB(v) }, grid: { color: chartGridColor() }, title: { display: true, text: 'ยอดขาย', color: chartTickColor(), font: { family: 'Sarabun', size: 10 } } },
        y1: { position: 'right', ticks: { color: chartTickColor(), font: { family: 'Sarabun', size: 10 }, callback: v => fmtB(v) }, grid: { drawOnChartArea: false }, title: { display: true, text: 'ค่าแอด', color: chartTickColor(), font: { family: 'Sarabun', size: 10 } } },
        y2: { display: false }
      },
      tooltip: { callbacks: { label: it => `${it.dataset.label}: ${it.dataset.label === 'ทักแชท' ? fmt(it.raw) : '฿' + fmt(it.raw)}` } }
    });
    // แพลตฟอร์ม
    const plat = d.by_platform || [];
    const PN = { facebook: 'Facebook', instagram: 'Instagram', messenger: 'Messenger', audience_network: 'Audience Network' };
    makeChart('chartFbaPlatform', 'doughnut', plat.map(p => PN[p.publisher_platform] || p.publisher_platform), [{ data: plat.map(p => +p.spend), backgroundColor: ['#60a5fa', '#f472b6', '#a78bfa', '#fbbf24'] }],
      { options: { cutout: '60%' }, tooltip: { callbacks: { label: it => `${it.label}: ฿${fmt(it.raw)}` } } });
    // objective
    const totalSpend = (d.by_objective || []).reduce((s, o) => s + +o.spend, 0);
    document.getElementById('tbodyFbaObjective').innerHTML = (d.by_objective || []).map(o => `<tr><td><b>${ttcEsc(obj(o.objective))}</b><div class="muted" style="font-size:10px;color:var(--text3);">${ttcEsc(o.objective)}</div></td><td>${fmt(o.campaigns)}</td><td>฿${fmt(o.spend)}</td><td>${pct(o.spend, totalSpend)}</td><td>${fmt(o.msg_started)}</td><td>${per(o.spend, o.msg_started)}</td><td>${fmt(o.purchases)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">ไม่มีข้อมูล</td></tr>';
    // บัญชี
    document.getElementById('tbodyFbaAccount').innerHTML = (d.by_account || []).map(a => `<tr><td><b>${ttcEsc(a.name || a.account_id)}</b></td><td>${fmt(a.ads)}</td><td style="font-weight:600;">฿${fmt(a.spend)}</td><td>${pct(a.spend, totalSpend)}</td><td>${fmt(a.impressions)}</td><td>${fmt(a.reach)}</td><td>฿${a.impressions ? (a.spend / a.impressions * 1000).toFixed(0) : '—'}</td><td>${fmt(a.link_clicks)}</td><td>${per(a.spend, a.link_clicks)}</td><td>${fmt(a.msg_started)}</td><td>${per(a.spend, a.msg_started)}</td><td>${fmt(a.purchases)}</td></tr>`).join('') || '<tr><td colspan="12" class="empty">ไม่มีข้อมูล</td></tr>';
    renderCampaigns(); renderAds();
  }

  function renderCampaigns() {
    const rows = filteredCampaigns().slice().sort((a, b) => (_sortDir === 'asc' ? 1 : -1) * ((+a[_sortKey] || 0) - (+b[_sortKey] || 0)));
    document.querySelectorAll('#tblFbaCampaign .sort-ind').forEach(s => s.textContent = ''); const th = document.querySelector(`#tblFbaCampaign th[data-k="${_sortKey}"] .sort-ind`); if (th) th.textContent = _sortDir === 'asc' ? '▲' : '▼';
    document.getElementById('fba-camp-count').textContent = `(${fmt(rows.length)})`;
    const st = s => s === 'ACTIVE' ? '<span style="color:var(--green);font-size:10.5px;font-weight:600;">รันอยู่</span>' : `<span style="color:var(--text3);font-size:10.5px;">${ttcEsc((s || '').toLowerCase().replace('_', ' '))}</span>`;
    document.getElementById('tbodyFbaCampaign').innerHTML = rows.map(c => `<tr><td><b>${ttcEsc(c.name || c.campaign_id)}</b></td><td style="font-size:11px;color:var(--text3);">${ttcEsc(c.account || '')}</td><td style="font-size:11px;">${ttcEsc(obj(c.objective))}</td><td>${st(c.effective_status)}</td><td>${fmt(c.ads)}</td>
      <td style="font-weight:600;">฿${fmt(c.spend)}</td><td>${fmt(c.impressions)}</td><td>฿${c.impressions ? (c.spend / c.impressions * 1000).toFixed(0) : '—'}</td><td>${fmt(c.link_clicks)}</td><td>${pct(c.link_clicks, c.impressions)}</td><td>${fmt(c.msg_started)}</td><td>${per(c.spend, c.msg_started)}</td><td>${fmt(c.purchases)}</td>
      <td style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;white-space:nowrap;">${thShort(c.first_date)} – ${thShort(c.last_date)}</td></tr>`).join('') || '<tr><td colspan="14" class="empty">ไม่มีข้อมูล</td></tr>';
  }

  function renderAds() {
    const q = (document.getElementById('fbaAdsSearch')?.value || '').toLowerCase().trim();
    let rows = filteredAds();
    if (q) rows = rows.filter(a => (a.name || '').toLowerCase().includes(q) || (a.campaign || '').toLowerCase().includes(q) || (a.kol_hint || '').toLowerCase().includes(q));
    rows = rows.slice().sort((a, b) => (_adsSortDir === 'asc' ? 1 : -1) * ((+a[_adsSortKey] || 0) - (+b[_adsSortKey] || 0)));
    document.querySelectorAll('#tblFbaAds .sort-ind').forEach(s => s.textContent = ''); const th = document.querySelector(`#tblFbaAds th[data-k="${_adsSortKey}"] .sort-ind`); if (th) th.textContent = _adsSortDir === 'asc' ? '▲' : '▼';
    document.getElementById('fba-ads-count').textContent = `(${fmt(rows.length)})`;
    document.getElementById('tbodyFbaAds').innerHTML = rows.map(a => {
      const link = postUrl(a.post_id);
      const thumb = a.thumbnail_url ? `<img src="${ttcEscAttr(a.thumbnail_url)}" class="zoom-thumb" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : '📘';
      const er = a.impressions ? (a.post_engagement / a.impressions * 100) : null;
      return `<tr><td><div style="display:flex;align-items:center;gap:8px;"><a ${link ? `href="${ttcEscAttr(link)}" target="_blank" rel="noopener"` : ''} style="display:block;width:44px;height:44px;border-radius:6px;overflow:hidden;background:var(--bg3);flex:0 0 auto;text-align:center;line-height:44px;">${thumb}</a>
        <div style="font-size:10.5px;color:var(--text3);line-height:1.3;">${a.kol_hint ? `<div style="color:var(--text2);font-weight:600;">KOL: ${ttcEsc(a.kol_hint)}</div>` : ''}${a.instagram_url ? `<a href="${ttcEscAttr(a.instagram_url)}" target="_blank" rel="noopener" style="color:var(--accent);">IG ↗</a>` : ''}</div></div></td>
        <td style="font-size:11px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${ttcEscAttr(a.name || '')}">${ttcEsc(a.name || a.ad_id)}</td>
        <td style="font-size:11px;color:var(--text3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${ttcEscAttr(a.campaign || '')}">${ttcEsc(a.campaign || '')}</td>
        <td style="font-size:11px;color:var(--text3);">${ttcEsc(a.account || '')}</td>
        <td style="font-weight:600;">฿${fmt(a.spend)}</td><td>${fmt(a.impressions)}</td><td>${fmt(a.reach)}</td><td>${fmt(a.post_engagement)}</td><td>${er === null ? '—' : er.toFixed(2) + '%'}</td><td>${fmt(a.link_clicks)}</td><td>${fmt(a.msg_started)}</td><td>${per(a.spend, a.msg_started)}</td><td>${fmt(a.purchases)}</td>
        <td style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;white-space:nowrap;">${thShort(a.first_date)}${a.days > 1 ? ` – ${thShort(a.last_date)}` : ''}<div style="color:var(--text3);">${fmt(a.days)} วัน</div></td></tr>`;
    }).join('') || '<tr><td colspan="14" class="empty">ไม่มีแอดตามเงื่อนไข</td></tr>';
  }

  window.renderFbAdsPage = load;
})();
