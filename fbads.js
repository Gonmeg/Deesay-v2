// fbads.js — หน้า "Facebook Ads" (Meta Marketing API → fb_ads_daily) — โหลดครั้งแรกที่กดเมนู (เหมือน supply.js) · v20260916e: ตัดตัวกรองประเภทบนแถบ (ย้ายไปตารางแอด) · ค่าแอด Facebook = Conversion+PR (CPAS/MT ไม่นับ) · กัน daily_bucket ว่าง · PR ย้ายขึ้นก่อนตารางแอด + metric picker + กราฟเลือก metric · ตารางรายวันเลือก Conversion/รวม · แอดสูงสุด 3,000 · ส่วน PR แยก + แก้ตัวเลือก traffic · แบ่งก้อน Conversion/PR/CPAS/MT (fb_page_map) · ROAS ใช้ Conversion · ตัวกรองก้อน · tooltip ใหม่ · funnel เต็มพื้นที่ · กราฟเงินแกนเดียว · เส้นทึบ · legend สีจริง · funnel ใหม่ · กราฟเงิน (สลับ ยอด / ROAS&%) · กราฟ traffic เลือก 2 เส้น · funnel · ตารางรายวัน (⚙ Metrics) · ตัดวงกลมที่วางแอด · ต้อง RPC v2 (SQL 87)
// ข้อมูล: RPC fb_ads_page(p_from, p_to) ครั้งเดียว · ยอดขายจริง = ออเดอร์ Facebook ของเรา (mv_sales_daily) ไม่ใช่ที่ Meta นับ
// ใช้ helper ของ dashboard.html: supaRpc, makeChart, fmt, fmtB, thShort, ttcEsc, ttcEscAttr, exportTable, fbeInfoIcon, COLORS, getDateValue, chartTickColor/chartGridColor, setBgSync
(function () {
  let _data = null, _seq = 0, _sortKey = 'spend', _sortDir = 'desc', _adsSortKey = 'spend', _adsSortDir = 'desc', _filterAccount = '', _filterObjective = '', _filterBucket = '';
  const BUCKET_TH = { Conversion: 'Conversion — ยิงให้เพจขาย', PR: 'PR — KOL / เพจอื่น / บัญชี PR', CPAS: 'CPAS — ยิงเข้า Shopee', MT: 'Modern Trade — awareness' };
  const OBJ_TH = { OUTCOME_SALES: 'ยอดขาย', OUTCOME_ENGAGEMENT: 'การมีส่วนร่วม', OUTCOME_TRAFFIC: 'คลิกเข้าเว็บ', OUTCOME_LEADS: 'ลูกค้าเป้าหมาย', OUTCOME_AWARENESS: 'การรับรู้', OUTCOME_APP_PROMOTION: 'แอป', MESSAGES: 'ข้อความ', CONVERSIONS: 'คอนเวอร์ชัน', LINK_CLICKS: 'คลิกลิงก์', POST_ENGAGEMENT: 'การมีส่วนร่วม', REACH: 'การเข้าถึง', VIDEO_VIEWS: 'ยอดวิว' };
  const obj = o => OBJ_TH[o] || o || '—';
  const money = n => n ? '฿' + fmt(n) : '—';
  const pct = (a, b) => b ? (a / b * 100).toFixed(2) + '%' : '—';
  const per = (spend, n) => n ? '฿' + fmt(spend / n) : '—';
  const roasCell = (rev, spend) => { if (!spend) return '<span style="color:var(--text3);">—</span>'; const r = rev / spend; const col = r >= 2 ? 'var(--green)' : r >= 1 ? 'var(--accent)' : 'var(--red)'; return `<span style="color:${col};font-weight:700;">${r.toFixed(2)}x</span>`; };
  const postUrl = p => p ? `https://www.facebook.com/${p}` : '';

  // ---- ตัวชี้วัดทั้งหมดที่ Meta ให้ (เลือก/เรียงได้ด้วย ⚙ Metrics เหมือนหน้า TikTok Ads) ----
  const M = {
    spend:           { label: 'ค่าแอด', default: true, fmt: r => '฿' + fmt(r.spend), val: r => +r.spend },
    impressions:     { label: 'Impressions', default: true, fmt: r => fmt(r.impressions), val: r => +r.impressions },
    reach:           { label: 'Reach (คนที่เห็น)', default: false, fmt: r => fmt(r.reach), val: r => +r.reach },
    frequency:       { label: 'ความถี่', default: false, fmt: r => +r.reach ? (r.impressions / r.reach).toFixed(2) : '—', val: r => +r.reach ? r.impressions / r.reach : 0 },
    cpm:             { label: 'CPM (฿ ต่อ 1,000 เห็น)', default: true, fmt: r => +r.impressions ? '฿' + (r.spend / r.impressions * 1000).toFixed(0) : '—', val: r => +r.impressions ? r.spend / r.impressions * 1000 : 0 },
    clicks:          { label: 'คลิกทั้งหมด', default: false, fmt: r => fmt(r.clicks), val: r => +r.clicks },
    link_clicks:     { label: 'คลิกลิงก์', default: true, fmt: r => fmt(r.link_clicks), val: r => +r.link_clicks },
    ctr:             { label: 'CTR (คลิกลิงก์/เห็น)', default: true, fmt: r => pct(r.link_clicks, r.impressions), val: r => +r.impressions ? r.link_clicks / r.impressions : 0 },
    cpc:             { label: 'CPC (฿ ต่อคลิกลิงก์)', default: false, fmt: r => per(r.spend, r.link_clicks), val: r => +r.link_clicks ? r.spend / r.link_clicks : 0 },
    post_engagement: { label: 'มีส่วนร่วม', default: true, fmt: r => fmt(r.post_engagement), val: r => +r.post_engagement },
    er:              { label: 'ER (มีส่วนร่วม/เห็น)', default: true, fmt: r => pct(r.post_engagement, r.impressions), val: r => +r.impressions ? r.post_engagement / r.impressions : 0 },
    cpe:             { label: '฿ ต่อการมีส่วนร่วม', default: false, fmt: r => per(r.spend, r.post_engagement), val: r => +r.post_engagement ? r.spend / r.post_engagement : 0 },
    reactions:       { label: 'ไลค์/รีแอค', default: false, fmt: r => fmt(r.reactions), val: r => +r.reactions },
    comments:        { label: 'คอมเมนต์', default: false, fmt: r => fmt(r.comments), val: r => +r.comments },
    shares:          { label: 'แชร์', default: false, fmt: r => fmt(r.shares), val: r => +r.shares },
    saves:           { label: 'เซฟ', default: false, fmt: r => fmt(r.saves), val: r => +r.saves },
    video_3s:        { label: 'ดูวิดีโอ (เริ่มเล่น)', default: false, fmt: r => fmt(r.video_3s), val: r => +r.video_3s },
    thruplay:        { label: 'ThruPlay (ดูจบ/15 วิ)', default: false, fmt: r => fmt(r.thruplay), val: r => +r.thruplay },
    cpv:             { label: '฿ ต่อ ThruPlay', default: false, fmt: r => per(r.spend, r.thruplay), val: r => +r.thruplay ? r.spend / r.thruplay : 0 },
    msg_started:     { label: 'ทักแชท', default: true, fmt: r => fmt(r.msg_started), val: r => +r.msg_started },
    cost_per_msg:    { label: '฿ ต่อการทัก', default: true, fmt: r => per(r.spend, r.msg_started), val: r => +r.msg_started ? r.spend / r.msg_started : 0 },
    purchases:       { label: 'ซื้อ (Meta นับ)', default: true, fmt: r => fmt(r.purchases), val: r => +r.purchases },
    purchase_value:  { label: 'มูลค่าซื้อ (Meta นับ)', default: false, fmt: r => money(+r.purchase_value), val: r => +r.purchase_value },
    cpa:             { label: '฿ ต่อการซื้อ (Meta)', default: false, fmt: r => per(r.spend, r.purchases), val: r => +r.purchases ? r.spend / r.purchases : 0 },
    roas_meta:       { label: 'ROAS (Meta นับ)', default: false, fmt: r => +r.spend && +r.purchase_value ? (r.purchase_value / r.spend).toFixed(2) + 'x' : '—', val: r => +r.spend ? r.purchase_value / r.spend : 0 },
    days:            { label: 'จำนวนวันที่รัน', default: false, fmt: r => fmt(r.days ?? 0), val: r => +(r.days ?? 0) },
    period:          { label: 'ช่วงที่รัน', default: true, fmt: r => `<span style="font-family:'IBM Plex Mono',monospace;font-size:10.5px;white-space:nowrap;">${thShort(r.first_date)}${r.last_date !== r.first_date ? ' – ' + thShort(r.last_date) : ''}</span>`, val: r => r.first_date || '' }
  };
  const R = {
    revenue: { label: 'ยอดขายจริง Facebook', default: true, fmt: r => money(+r.revenue), val: r => +r.revenue },
    spend_conv: { label: 'ค่าแอด Conversion', default: true, fmt: r => money(+r.spend_conv), val: r => +r.spend_conv || 0 },
    roas:    { label: 'ROAS (ยอดจริง/Conversion)', default: true, fmt: r => roasCell(+r.revenue, +r.spend_conv), val: r => +r.spend_conv ? r.revenue / r.spend_conv : 0 },
    acos:    { label: '% Conversion ต่อยอดขาย', default: true, fmt: r => +r.revenue ? ((+r.spend_conv || 0) / r.revenue * 100).toFixed(1) + '%' : '—', val: r => +r.revenue ? (+r.spend_conv || 0) / r.revenue * 100 : 0 }
  };
  const TRAF_KEYS = ['spend_conv','msg_started','cost_per_msg','link_clicks','ctr','cpc','post_engagement','er','impressions','reach','frequency','cpm','purchases','cpa','thruplay','revenue','roas','acos','spend'];
  const mv = (k, r) => (R[k] ? R[k].val : M[k].val)(r);
  const mlabel = k => (R[k] ? R[k].label : M[k].label);
  let _moneyMode = 'money';
  const grid = () => (typeof isLightTheme === 'function' && isLightTheme()) ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
  const axis = (color, cb, title) => ({ ticks: { color: color || chartTickColor(), font: { family: 'Sarabun', size: 10 }, callback: cb, maxTicksLimit: 6 }, grid: { color: grid(), drawBorder: false }, border: { display: false }, title: title ? { display: true, text: title, color: color || chartTickColor(), font: { family: 'Sarabun', size: 10 } } : undefined });
  const xaxis = () => ({ ticks: { color: chartTickColor(), font: { family: 'Sarabun', size: 10 }, maxTicksLimit: 14, maxRotation: 0 }, grid: { display: false }, border: { display: false } });
  // legend: ใช้สีเส้นจริง (ไม่ใช่สีพื้นจางๆ) + สัญลักษณ์เป็นเส้น
  const legendOpts = () => ({ position: 'top', align: 'end', labels: { color: (typeof chartLegendColor === 'function' ? chartLegendColor() : chartTickColor()), font: { family: 'Sarabun', size: 11 }, boxWidth: 28, boxHeight: 3, usePointStyle: false,
    generateLabels: chart => Chart.defaults.plugins.legend.labels.generateLabels(chart).map(l => { const ds = chart.data.datasets[l.datasetIndex]; l.fillStyle = ds.borderColor; l.strokeStyle = ds.borderColor; l.lineWidth = 0; return l; }) } });
  // tooltip: กล่องสะอาด ฟอนต์ Sarabun จุดสีตามเส้น
  const tooltipOpts = callbacks => { const light = typeof isLightTheme === 'function' && isLightTheme(); return {
    backgroundColor: light ? 'rgba(255,255,255,0.97)' : 'rgba(22,22,32,0.96)', titleColor: light ? '#1a1a2e' : '#f0f0f5', bodyColor: light ? '#3a3a55' : '#c8c8d8', footerColor: light ? '#6b6b85' : '#9090a8',
    borderColor: light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)', borderWidth: 1, padding: 10, cornerRadius: 8, caretSize: 6,
    titleFont: { family: 'Sarabun', size: 12, weight: '700' }, bodyFont: { family: 'Sarabun', size: 12 }, footerFont: { family: 'Sarabun', size: 11, weight: '400' },
    usePointStyle: true, boxWidth: 8, boxHeight: 8, boxPadding: 5, titleMarginBottom: 6, bodySpacing: 4, footerMarginTop: 6, callbacks }; };
  const line = (label, data, color, opts) => Object.assign({ label, data, borderColor: color, backgroundColor: color, borderWidth: 1.8, tension: 0.35, pointRadius: 0, pointHoverRadius: 4, fill: false }, opts || {});
  const ORDER = ['spend','impressions','reach','frequency','cpm','clicks','link_clicks','ctr','cpc','post_engagement','er','cpe','reactions','comments','shares','saves','video_3s','thruplay','cpv','msg_started','cost_per_msg','purchases','purchase_value','cpa','roas_meta','days','period'];
  function registerMetrics() {
    if (typeof METRIC_CONFIGS === 'undefined' || typeof metricState === 'undefined') return false;
    if (!METRIC_CONFIGS.fbaCamp) {
      const meta = {}; ORDER.forEach(k => { meta[k] = { label: M[k].label, default: M[k].default }; });
      METRIC_CONFIGS.fbaCamp = { order: [...ORDER], meta };
      METRIC_CONFIGS.fbaAds = { order: ORDER.filter(k => k !== 'days').concat(['days']), meta };
      const dmeta = { revenue: { label: R.revenue.label, default: true }, spend_conv: { label: R.spend_conv.label, default: true }, roas: { label: R.roas.label, default: true }, acos: { label: R.acos.label, default: true } };
      ORDER.filter(k => k !== 'days' && k !== 'period').forEach(k => { dmeta[k] = { label: M[k].label, default: ['spend','impressions','reach','cpm','link_clicks','ctr','msg_started','cost_per_msg','purchases'].includes(k) }; });
      METRIC_CONFIGS.fbaDaily = { order: ['revenue','spend_conv','spend','roas','acos', ...ORDER.filter(k => k !== 'spend' && k !== 'days' && k !== 'period')], meta: dmeta };
      metricState.fbaDaily = { order: [...METRIC_CONFIGS.fbaDaily.order], active: {} }; Object.keys(dmeta).forEach(k => { metricState.fbaDaily.active[k] = !!dmeta[k].default; });
      const prOrder = ['spend','impressions','reach','frequency','cpm','post_engagement','er','cpe','reactions','comments','shares','saves','link_clicks','ctr','cpc','video_3s','thruplay','cpv','msg_started','cost_per_msg'];
      const prMeta = {}; prOrder.forEach(k => { prMeta[k] = { label: M[k].label, default: ['spend','impressions','reach','cpm','post_engagement','er','link_clicks','msg_started'].includes(k) }; });
      METRIC_CONFIGS.fbaPr = { order: prOrder, meta: prMeta };
      metricState.fbaPr = { order: [...prOrder], active: {} }; prOrder.forEach(k => { metricState.fbaPr.active[k] = !!prMeta[k].default; });
      ['fbaCamp', 'fbaAds'].forEach(pg => { metricState[pg] = { order: [...METRIC_CONFIGS[pg].order], active: {} }; ORDER.forEach(k => { metricState[pg].active[k] = !!M[k].default; }); });
      const _rr = window.rerenderPage;
      window.rerenderPage = p => { if (p === 'fbaCamp') renderCampaigns(); else if (p === 'fbaAds') renderAds(); else if (p === 'fbaDaily') renderDailyTable(); else if (p === 'fbaPr') renderPr(); else if (typeof _rr === 'function') _rr(p); };
    }
    return true;
  }
  const cols = pg => (typeof activeCols === 'function' && metricState[pg]) ? activeCols(pg) : ORDER.filter(k => M[k].default);
  function sortInd(tblId, key, dir) { document.querySelectorAll(`#${tblId} .sort-ind`).forEach(x => x.textContent = ''); const th = document.querySelector(`#${tblId} th[data-k="${key}"] .sort-ind`); if (th) th.textContent = dir === 'asc' ? '▲' : '▼'; }
  function bindSort(tblId, onSort) { document.querySelectorAll(`#${tblId} th.sortable-th`).forEach(th => th.onclick = () => onSort(th.dataset.k)); }

  function shell() {
    const el = document.getElementById('page-fbads'); if (!el) return null;
    if (!el.dataset.built) {
      el.dataset.built = '1';
      el.innerHTML = `
        <div class="card" style="margin-bottom:16px;padding:10px 16px;">
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;font-size:10.5px;color:var(--text3);line-height:1.6;"><span id="fba-last-sync" style="margin-left:auto;order:2;"></span><span style="order:1;"><b>ค่าแอด</b> = ตัวเลขจาก Meta ทุกบัญชีโฆษณา (เท่ากับ Ads Manager) · <b>ยอดขายจริง</b> = ออเดอร์ Facebook ในระบบเรา (ขายผ่านแชท Meta ไม่รู้) · <b>ทักแชท</b> = จำนวนคนที่เริ่มคุยจากแอด (Meta นับ) · <b>ซื้อ (Meta นับ)</b> = ที่ pixel จับได้ ไว้ดูประกอบเท่านั้น · ตัวกรองบัญชี/objective อยู่แถบด้านบนข้างวันที่</span></div>
        </div>
        <div id="fba-kpis" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;"></div>
        <div class="card" style="margin-bottom:20px;">
          <div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">ค่าแอด vs ยอดขายจริง Facebook รายวัน</div>
            <div class="toggle-group" id="fbaMoneyMode"><button class="toggle-btn active" data-m="money">ยอด (บาท)</button><button class="toggle-btn" data-m="ratio">ROAS & % ค่าแอดต่อยอด</button></div></div>
          <div class="chart-wrap" style="height:280px;"><canvas id="chartFbaDaily"></canvas></div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:6px;">ROAS = ยอดขายจริง ÷ ค่าแอด · % ค่าแอดต่อยอด = ค่าแอด ÷ ยอดขายจริง × 100 (ยิ่งต่ำยิ่งดี) · ยอดขายจริงคือทั้งช่องทาง Facebook ไม่แยกตามบัญชีโฆษณา</div>
        </div>
        <div class="grid-2" style="margin-bottom:20px;">
          <div class="card" style="grid-column:span 2;">
            <div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">Traffic รายวัน — เลือกดู 2 เส้น</div>
              <div style="display:flex;gap:8px;align-items:center;font-size:11px;color:var(--text3);">ซ้าย <select class="ls-input" id="fbaTrafL" style="width:190px;padding:5px 8px;font-size:12px;"></select> ขวา <select class="ls-input" id="fbaTrafR" style="width:190px;padding:5px 8px;font-size:12px;"></select></div></div>
            <div class="chart-wrap" style="height:240px;"><canvas id="chartFbaTraffic"></canvas></div>
          </div>
          <div class="card"><div class="section-header"><div class="section-title">Funnel — เห็น → คลิก → ทัก → ซื้อ</div></div><div id="fba-funnel"></div></div>
          <div class="card"><div class="section-header"><div class="section-title">แยกตาม objective</div></div><div class="table-wrap"><table id="tblFbaObjective" data-no-page><thead><tr><th>objective</th><th>แคมเปญ</th><th>ค่าแอด</th><th>% งบ</th><th>ทักแชท</th><th>฿/ทัก</th><th>ซื้อ (Meta นับ)</th></tr></thead><tbody id="tbodyFbaObjective"></tbody></table></div></div>
        </div>
        <div class="card" style="margin-bottom:20px;"><div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">รายงานรายวัน <span id="fba-daily-count" style="font-size:11px;font-weight:400;color:var(--text3);"></span></div>
          <div style="display:flex;gap:8px;align-items:center;">
            <select class="ls-input" id="fbaDailyMode" style="width:210px;padding:6px 10px;font-size:12px;" title="metric ทุกตัวในตารางจะเปลี่ยนตามที่เลือก"><option value="conv">เฉพาะ Conversion (เพจขาย)</option><option value="all">Conversion + PR</option></select>
            <div style="position:relative;"><button class="btn btn-ghost" id="fbaDailyMetricsBtn" onclick="toggleMetricsPanel('fbaDaily')">⚙ Metrics <span id="fbaDaily-metric-count" style="color:var(--accent);"></span></button>
              <div id="fbaDaily-metrics-panel" class="metrics-panel" style="display:none;"><div style="font-size:9.5px;color:var(--text3);margin-bottom:8px;font-family:'IBM Plex Mono',monospace;">ลาก ⠿ เพื่อสลับลำดับ · ติ๊กเพื่อเปิด/ปิด</div><div id="fbaDaily-metrics-checks"></div>
                <div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);"><button class="btn btn-ghost" style="flex:1;justify-content:center;" onclick="resetMetrics('fbaDaily')">ค่าแนะนำ</button><button class="btn btn-ghost" style="flex:1;justify-content:center;" onclick="allMetrics('fbaDaily')">เลือกทั้งหมด</button></div></div></div>
            <button class="btn btn-ghost" onclick="exportTable('tblFbaDaily')">⬇ Export CSV</button></div></div>
          <div class="table-wrap" style="overflow-x:auto;"><table id="tblFbaDaily"><thead id="theadFbaDaily"></thead><tbody id="tbodyFbaDaily"></tbody></table></div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:8px;">เรียงวันล่าสุดขึ้นก่อน · แถวสุดท้ายคือผลรวมทั้งช่วง · ยอดขายจริงมาจากออเดอร์ Facebook ในระบบ (ทั้งช่องทาง)</div></div>
        <div class="card" style="margin-bottom:20px;"><div class="section-header"><div class="section-title">ตามบัญชีโฆษณา</div><button class="btn btn-ghost" onclick="exportTable('tblFbaAccount')">⬇ Export CSV</button></div>
          <div class="table-wrap"><table id="tblFbaAccount" data-no-page><thead><tr><th>บัญชี</th><th>แอด</th><th>ค่าแอด</th><th>% งบ</th><th>Impressions</th><th>Reach</th><th>CPM</th><th>คลิกลิงก์</th><th>฿/คลิก</th><th>ทักแชท</th><th>฿/ทัก</th><th>ซื้อ (Meta นับ)</th></tr></thead><tbody id="tbodyFbaAccount"></tbody></table></div></div>
        <div class="card" style="margin-bottom:20px;"><div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">แคมเปญ <span id="fba-camp-count" style="font-size:11px;font-weight:400;color:var(--text3);"></span></div>
          <div style="display:flex;gap:8px;align-items:center;">
            <div style="position:relative;"><button class="btn btn-ghost" id="fbaCampMetricsBtn" onclick="toggleMetricsPanel('fbaCamp')">⚙ Metrics <span id="fbaCamp-metric-count" style="color:var(--accent);"></span></button>
              <div id="fbaCamp-metrics-panel" class="metrics-panel" style="display:none;"><div style="font-size:9.5px;color:var(--text3);margin-bottom:8px;font-family:'IBM Plex Mono',monospace;">ลาก ⠿ เพื่อสลับลำดับ · ติ๊กเพื่อเปิด/ปิด</div><div id="fbaCamp-metrics-checks"></div>
                <div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);"><button class="btn btn-ghost" style="flex:1;justify-content:center;" onclick="resetMetrics('fbaCamp')">ค่าแนะนำ</button><button class="btn btn-ghost" style="flex:1;justify-content:center;" onclick="allMetrics('fbaCamp')">เลือกทั้งหมด</button></div></div></div>
            <button class="btn btn-ghost" onclick="exportTable('tblFbaCampaign')">⬇ Export CSV</button></div></div>
          <div class="table-wrap" style="overflow-x:auto;"><table id="tblFbaCampaign"><thead id="theadFbaCampaign"></thead><tbody id="tbodyFbaCampaign"></tbody></table></div></div>
        <div class="card" style="margin-bottom:20px;border-left:3px solid #a78bfa;">
          <div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">PR / KOL — ใช้ต่อวันเท่าไร ได้อะไรกลับมา <span style="font-size:11px;font-weight:400;color:var(--text3);">(ไม่นับใน ROAS)</span></div>
            <div style="display:flex;gap:8px;align-items:center;"><span style="font-size:11px;color:var(--text3);">กราฟ:</span><select class="ls-input" id="fbaPrMetric" style="width:190px;padding:5px 8px;font-size:12px;"></select>
              <div style="position:relative;"><button class="btn btn-ghost" id="fbaPrMetricsBtn" onclick="toggleMetricsPanel('fbaPr')">⚙ Metrics <span id="fbaPr-metric-count" style="color:var(--accent);"></span></button>
                <div id="fbaPr-metrics-panel" class="metrics-panel" style="display:none;"><div style="font-size:9.5px;color:var(--text3);margin-bottom:8px;font-family:'IBM Plex Mono',monospace;">ลาก ⠿ เพื่อสลับลำดับ · ติ๊กเพื่อเปิด/ปิด</div><div id="fbaPr-metrics-checks"></div>
                  <div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);"><button class="btn btn-ghost" style="flex:1;justify-content:center;" onclick="resetMetrics('fbaPr')">ค่าแนะนำ</button><button class="btn btn-ghost" style="flex:1;justify-content:center;" onclick="allMetrics('fbaPr')">เลือกทั้งหมด</button></div></div></div>
              <button class="btn btn-ghost" onclick="exportTable('tblFbaPr')">⬇ Export CSV</button></div></div>
          <div id="fba-pr-kpis" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;"></div>
          <div class="chart-wrap" style="height:220px;"><canvas id="chartFbaPr"></canvas></div>
          <div class="table-wrap" style="margin-top:12px;overflow-x:auto;"><table id="tblFbaPr"><thead id="theadFbaPr"></thead><tbody id="tbodyFbaPr"></tbody></table></div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:8px;">PR = แอดที่ไม่ได้ยิงให้เพจขาย (boost โพสต์ KOL, บัญชี PR, เพจอื่น) วัดผลด้วยการเห็น/มีส่วนร่วม ไม่ใช่ยอดขาย · เพจ = เพจของโพสต์ที่แอดใช้ (ถ้าไม่มีชื่อเพจ ใช้ชื่อ KOL จากชื่อแอด) · เลือกคอลัมน์ได้ที่ ⚙ Metrics</div>
        </div>
        <div class="card" style="margin-bottom:20px;"><div class="section-header" style="flex-wrap:wrap;gap:8px;"><div class="section-title">แอด / โพสต์ที่ยิง <span id="fba-ads-count" style="font-size:11px;font-weight:400;color:var(--text3);"></span></div>
          <div style="display:flex;gap:8px;align-items:center;"><select class="ls-input" id="fbaAdsBucket" style="width:190px;padding:6px 10px;font-size:12px;"><option value="">ทุกประเภทแอด</option><option value="Conversion">Conversion — เพจขาย</option><option value="PR">PR — KOL / เพจอื่น</option><option value="CPAS">CPAS — เข้า Shopee</option><option value="MT">Modern Trade</option></select><input type="text" class="ls-input" id="fbaAdsSearch" placeholder="🔎 ชื่อแอด / แคมเปญ / KOL" style="width:220px;padding:6px 10px;font-size:12px;">
            <div style="position:relative;"><button class="btn btn-ghost" id="fbaAdsMetricsBtn" onclick="toggleMetricsPanel('fbaAds')">⚙ Metrics <span id="fbaAds-metric-count" style="color:var(--accent);"></span></button>
              <div id="fbaAds-metrics-panel" class="metrics-panel" style="display:none;"><div style="font-size:9.5px;color:var(--text3);margin-bottom:8px;font-family:'IBM Plex Mono',monospace;">ลาก ⠿ เพื่อสลับลำดับ · ติ๊กเพื่อเปิด/ปิด</div><div id="fbaAds-metrics-checks"></div>
                <div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);"><button class="btn btn-ghost" style="flex:1;justify-content:center;" onclick="resetMetrics('fbaAds')">ค่าแนะนำ</button><button class="btn btn-ghost" style="flex:1;justify-content:center;" onclick="allMetrics('fbaAds')">เลือกทั้งหมด</button></div></div></div>
            <button class="btn btn-ghost" onclick="exportTable('tblFbaAds')">⬇ Export CSV</button></div></div>
          <div class="table-wrap" style="overflow-x:auto;"><table id="tblFbaAds"><thead id="theadFbaAds"></thead><tbody id="tbodyFbaAds"></tbody></table></div>
          <div style="font-size:10.5px;color:var(--text3);margin-top:8px;line-height:1.6;">ER = มีส่วนร่วม ÷ Impressions · ความถี่ = Impressions ÷ Reach (คนเดิมเห็นกี่ครั้ง) · โพสต์ที่ยิงคือโพสต์จริงบนเพจ (ของเราหรือของ KOL) คลิกรูปเพื่อเปิด · "KOL" มาจากท้ายชื่อแอดที่ทีมตั้ง (…_KOLs_สินค้า_ชื่อKOL) · ปุ่ม ⚙ Metrics เลือก/เรียงคอลัมน์ได้ บันทึกเป็น preset ได้</div></div>`;
      document.getElementById('fbaAdsSearch').oninput = () => renderAds();
      document.getElementById('fbaAdsBucket').onchange = () => renderAds();
      document.getElementById('fbaDailyMode').onchange = () => renderDailyTable();
      const prOpts = ['spend','impressions','reach','post_engagement','er','link_clicks','msg_started','cpm','cpe','thruplay'];
      const prSel = document.getElementById('fbaPrMetric'); prSel.innerHTML = prOpts.map(k => `<option value="${k}">${M[k].label}</option>`).join(''); prSel.value = 'reach'; prSel.onchange = () => renderPr();
      document.querySelectorAll('#fbaMoneyMode .toggle-btn').forEach(bt => bt.onclick = () => { document.querySelectorAll('#fbaMoneyMode .toggle-btn').forEach(x => x.classList.remove('active')); bt.classList.add('active'); _moneyMode = bt.dataset.m; renderMoneyChart(); });
      const trafOpts = TRAF_KEYS.map(k => `<option value="${k}">${mlabel(k)}</option>`).join('');
      const tl = document.getElementById('fbaTrafL'), tr = document.getElementById('fbaTrafR'); tl.innerHTML = trafOpts; tr.innerHTML = trafOpts; tl.value = 'msg_started'; tr.value = 'cost_per_msg';
      tl.onchange = tr.onchange = () => renderTrafficChart();
      window.fbaApplyFilters = () => { _filterAccount = document.getElementById('fbaFilterAccount')?.value || ''; _filterObjective = document.getElementById('fbaFilterObjective')?.value || ''; if (_data) render(); };
    }
    return el;
  }

  async function load() {
    const el = shell(); if (!el) return;
    registerMetrics();
    const seq = ++_seq;
    const from = getDateValue('From'), to = getDateValue('To');
    document.getElementById('fba-kpis').innerHTML = Array.from({ length: 5 }, () => `<div class="card" style="flex:1;min-width:150px;"><div class="card-title">&nbsp;</div><div class="kpi-value"><span class="skeleton" style="display:inline-block;width:70%;height:22px;border-radius:4px;"></span></div></div>`).join('');
    try {
      const d = await supaRpc('fb_ads_page', { p_from: from, p_to: to });
      if (seq !== _seq) return;
      _data = d;
      // ตัวกรอง
      const accSel = document.getElementById('fbaFilterAccount'), objSel = document.getElementById('fbaFilterObjective');   // อยู่แถบตัวกรองด้านบน (dashboard.html)
      const keep = (sel, values) => { if (!sel) return; const cur = sel.value; sel.innerHTML = sel.options[0].outerHTML + values.map(v => `<option value="${ttcEscAttr(v.value)}">${ttcEsc(v.label)}</option>`).join(''); if ([...sel.options].some(o => o.value === cur)) sel.value = cur; else { sel.value = ''; } };
      keep(accSel, (d.by_account || []).map(a => ({ value: a.name || a.account_id, label: `${a.name || a.account_id} (฿${fmtB(a.spend)})` })));
      keep(objSel, (d.by_objective || []).map(o => ({ value: o.objective, label: `${obj(o.objective)} (฿${fmtB(o.spend)})` })));
      _filterAccount = accSel ? accSel.value : ''; _filterObjective = objSel ? objSel.value : '';
      document.getElementById('fba-last-sync').textContent = d.last_sync ? 'ดึงล่าสุด ' + new Date(d.last_sync).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '';
      render();
    } catch (e) {
      document.getElementById('fba-kpis').innerHTML = `<div class="card" style="flex:1;"><div style="color:var(--red);font-size:12px;">โหลดข้อมูลไม่สำเร็จ: ${ttcEsc(e.message)} — รัน 82 + 83 แล้วหรือยัง?</div></div>`;
    }
  }

  function filteredAds() {
    let a = _data.ads || [];
    const bkF = document.getElementById('fbaAdsBucket')?.value || '';
    if (bkF) a = a.filter(x => (x.bucket || '') === bkF);
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
    const conv = (d.daily || []).reduce((s, r) => s + (+r.spend_conv || 0), 0);
    const bk = {}; (d.by_bucket || []).forEach(b => { bk[b.bucket] = +b.spend; });
    const fbSpend = (bk.Conversion || 0) + (bk.PR || 0);
    const bucketLine = `Conversion ฿${fmtB(bk.Conversion || 0)} · PR ฿${fmtB(bk.PR || 0)}` + ((bk.CPAS || bk.MT) ? ` <span style="color:var(--text3);">(ไม่นับ: CPAS ฿${fmtB(bk.CPAS || 0)} · MT ฿${fmtB(bk.MT || 0)})</span>` : '');
    const kpi = (t, v, sub, style) => `<div class="card" style="flex:1;min-width:150px;${style || ''}"><div class="card-title">${t}</div><div class="kpi-value">${v}</div>${sub ? `<div style="font-size:10px;color:var(--text3);margin-top:3px;">${sub}</div>` : ''}</div>`;
    document.getElementById('fba-kpis').innerHTML =
      kpi('ค่าแอด Facebook (Conversion + PR) ' + fbeInfoIcon('fba-info-bk', '<b>แบ่งประเภทตามเพจ/บัญชี</b><br>Conversion = แอดที่ยิงให้เพจขาย → ต้นทุนเทียบยอดขาย Facebook (ROAS)<br>PR = boost โพสต์ KOL, บัญชี PR, เพจอื่น → ไม่หารยอดขาย<br>CPAS (ยิงเข้า Shopee) และ Modern Trade ไม่นับเป็นค่าแอด Facebook — ไปอยู่หน้าของตัวเอง<br>แก้รายชื่อเพจขายที่ตาราง fb_page_map'), '฿' + fmtB(fbSpend), bucketLine, 'border-left:3px solid #60a5fa;') +
      kpi('ยอดขายจริง Facebook ' + fbeInfoIcon('fba-info-rev', 'ออเดอร์ช่องทาง Facebook ในระบบเรา (ทุกเพจ) ช่วงเดียวกัน — ไม่แยกตามบัญชีโฆษณาได้ เพราะออเดอร์มาจากแชท ไม่รู้ว่ามาจากแอดไหน'), '฿' + fmtB(rev), filtered ? 'ทั้งช่องทาง (ไม่กรองตามบัญชี)' : '', 'border-left:3px solid var(--green);') +
      kpi('ROAS ' + fbeInfoIcon('fba-info-roas', 'ยอดขายจริง Facebook ÷ <b>ค่าแอด Conversion</b> (เฉพาะแอดที่ยิงให้เพจขาย — ไม่รวม PR/KOL, CPAS, MT)<br>เขียว ≥ 2x · ทอง 1–2x · แดง < 1x'), roasCell(rev, conv), conv ? `ค่าแอด Conversion ฿${fmtB(conv)} · ROI ${((rev - conv) / conv * 100).toFixed(0)}%` : '') +
      kpi('ทักแชท', fmt(T.msg_started), `฿${T.msg_started ? fmt(T.spend / T.msg_started) : '—'} ต่อการทัก 1 ครั้ง · คลิกลิงก์ ${fmt(T.link_clicks)}`) +
      kpi('ซื้อ (Meta นับ) ' + fbeInfoIcon('fba-info-pur', 'จำนวนซื้อที่ pixel/CAPI ของ Meta จับได้ — ต่ำกว่าจริงแน่นอนสำหรับการขายผ่านแชท ไว้ดูแนวโน้ม ไม่ใช่ยอดจริง'), fmt(T.purchases), T.purchase_value ? `มูลค่าที่ Meta นับ ฿${fmtB(T.purchase_value)}` : '');

    renderMoneyChart(); renderTrafficChart(); renderFunnel(T, rev); renderDailyTable(); renderPr();
    // objective
    const totalSpend = (d.by_objective || []).reduce((s, o) => s + +o.spend, 0);
    document.getElementById('tbodyFbaObjective').innerHTML = (d.by_objective || []).map(o => `<tr><td><b>${ttcEsc(obj(o.objective))}</b><div class="muted" style="font-size:10px;color:var(--text3);">${ttcEsc(o.objective)}</div></td><td>${fmt(o.campaigns)}</td><td>฿${fmt(o.spend)}</td><td>${pct(o.spend, totalSpend)}</td><td>${fmt(o.msg_started)}</td><td>${per(o.spend, o.msg_started)}</td><td>${fmt(o.purchases)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">ไม่มีข้อมูล</td></tr>';
    // บัญชี
    document.getElementById('tbodyFbaAccount').innerHTML = (d.by_account || []).map(a => `<tr><td><b>${ttcEsc(a.name || a.account_id)}</b></td><td>${fmt(a.ads)}</td><td style="font-weight:600;">฿${fmt(a.spend)}</td><td>${pct(a.spend, totalSpend)}</td><td>${fmt(a.impressions)}</td><td>${fmt(a.reach)}</td><td>฿${a.impressions ? (a.spend / a.impressions * 1000).toFixed(0) : '—'}</td><td>${fmt(a.link_clicks)}</td><td>${per(a.spend, a.link_clicks)}</td><td>${fmt(a.msg_started)}</td><td>${per(a.spend, a.msg_started)}</td><td>${fmt(a.purchases)}</td></tr>`).join('') || '<tr><td colspan="12" class="empty">ไม่มีข้อมูล</td></tr>';
    renderCampaigns(); renderAds();
  }

  function renderMoneyChart() {
    const daily = _data?.daily || []; const labels = daily.map(r => thShort(r.d));
    if (_moneyMode === 'money') {
      makeChart('chartFbaDaily', 'line', labels, [
        line('ยอดขายจริง Facebook', daily.map(r => +r.revenue), '#22c55e', { fill: true, backgroundColor: 'rgba(34,197,94,0.10)', yAxisID: 'y', borderWidth: 2 }),
        line('ค่าแอด Conversion', daily.map(r => +r.spend_conv || 0), '#ef4444', { fill: true, backgroundColor: 'rgba(239,68,68,0.10)', yAxisID: 'y', borderWidth: 2 })
      ], { options: { interaction: { mode: 'index', intersect: false } }, legend: legendOpts(),
        scales: { x: xaxis(), y: Object.assign(axis(undefined, v => fmtB(v), 'บาท'), { position: 'left', beginAtZero: true }) },   // แกนเดียว สเกลเดียวกัน จะได้เห็นจริงว่าค่าแอดเล็กกว่ายอดขายแค่ไหน
        tooltip: tooltipOpts({ label: it => `${it.dataset.label}: ฿${fmt(it.raw)}`, footer: items => { const r = daily[items[0].dataIndex]; return +r.spend_conv ? `ROAS ${(r.revenue / r.spend_conv).toFixed(2)}x · Conversion ${r.revenue ? ((+r.spend_conv) / r.revenue * 100).toFixed(1) : '—'}% ของยอด · ทั้งหมด ฿${fmt(r.spend)}` : ''; } }) });
    } else {
      makeChart('chartFbaDaily', 'line', labels, [
        line('ROAS (Conversion)', daily.map(r => +r.spend_conv ? +(r.revenue / r.spend_conv).toFixed(2) : null), '#d4a017', { yAxisID: 'y', spanGaps: true, borderWidth: 2 }),
        line('% ค่าแอด Conversion ต่อยอด', daily.map(r => +r.revenue ? +((+r.spend_conv || 0) / r.revenue * 100).toFixed(1) : null), '#ef4444', { yAxisID: 'y1', spanGaps: true, borderWidth: 2 })
      ], { options: { interaction: { mode: 'index', intersect: false } }, legend: legendOpts(),
        scales: { x: xaxis(), y: Object.assign(axis('#d4a017', v => v + 'x', 'ROAS'), { position: 'left', beginAtZero: true }), y1: Object.assign(axis('#ef4444', v => v + '%', '% ค่าแอด'), { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }) },
        tooltip: tooltipOpts({ label: it => `${it.dataset.label}: ${it.raw == null ? '—' : it.dataset.label === 'ROAS' ? it.raw + 'x' : it.raw + '%'}`, footer: items => { const r = daily[items[0].dataIndex]; return `ยอด ฿${fmt(r.revenue)} · ค่าแอด Conversion ฿${fmt(+r.spend_conv || 0)} · ทั้งหมด ฿${fmt(r.spend)}`; } }) });
    }
  }
  function renderTrafficChart() {
    const daily = _data?.daily || []; const labels = daily.map(r => thShort(r.d));
    const kl = document.getElementById('fbaTrafL')?.value || 'msg_started', kr = document.getElementById('fbaTrafR')?.value || 'cost_per_msg';
    const isMoney = k => ['spend','spend_conv','revenue','cpm','cpc','cost_per_msg','cpa','cpe','cpv'].includes(k), isPct = k => ['ctr','er','acos'].includes(k);
    const fmtv = (k, v) => v == null ? '—' : isMoney(k) ? '฿' + fmt(v) : isPct(k) ? (v * (k === 'acos' ? 1 : 100)).toFixed(2) + '%' : k === 'roas' ? v.toFixed(2) + 'x' : k === 'frequency' ? v.toFixed(2) : fmt(v);
    const tick = k => v => isMoney(k) ? fmtB(v) : isPct(k) ? (v * (k === 'acos' ? 1 : 100)).toFixed(1) + '%' : k === 'roas' ? v + 'x' : fmtB(v);
    makeChart('chartFbaTraffic', 'line', labels, [
      line(mlabel(kl), daily.map(r => mv(kl, r)), '#ec4899', { fill: true, backgroundColor: 'rgba(236,72,153,0.10)', yAxisID: 'y', borderWidth: 2 }),
      line(mlabel(kr), daily.map(r => mv(kr, r)), '#2563eb', { yAxisID: 'y1', borderWidth: 2 })
    ], { options: { interaction: { mode: 'index', intersect: false } }, legend: legendOpts(),
      scales: { x: xaxis(), y: Object.assign(axis('#ec4899', tick(kl), mlabel(kl)), { position: 'left', beginAtZero: true }), y1: Object.assign(axis('#2563eb', tick(kr), mlabel(kr)), { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }) },
      tooltip: tooltipOpts({ label: it => `${it.dataset.label}: ${fmtv(it.datasetIndex === 0 ? kl : kr, it.raw)}` }) });
  }
  function renderFunnel(T, rev) {
    const steps = [
      { label: 'เห็นแอด', sub: 'Impressions', v: T.impressions, color: '#60a5fa' },
      { label: 'คลิกลิงก์', sub: 'Link clicks', v: T.link_clicks, color: '#818cf8' },
      { label: 'ทักแชท', sub: 'Messaging started', v: T.msg_started, color: '#c084fc' },
      { label: 'ซื้อ (Meta นับ)', sub: 'Purchases (pixel)', v: T.purchases, color: '#f472b6' }
    ];
    const max = steps[0].v || 1;
    document.getElementById('fba-funnel').innerHTML = `<div style="display:flex;flex-direction:column;justify-content:space-evenly;min-height:250px;gap:10px;padding:4px 0;">` +
      steps.map((st, i) => {
        const prev = i ? steps[i - 1].v : null; const rate = prev ? (st.v / prev * 100) : null;
        const w = Math.max(3, Math.sqrt(st.v / max) * 100);
        const cost = st.v ? T.spend / st.v : null;
        return `<div style="display:grid;grid-template-columns:150px 1fr 120px 170px;gap:0 14px;align-items:center;">
          <div><div style="font-size:13px;font-weight:700;color:var(--text);">${st.label}</div><div style="font-size:10.5px;color:var(--text3);">${st.sub}</div></div>
          <div style="height:30px;background:var(--bg3);border-radius:8px;overflow:hidden;"><div style="height:100%;width:${w.toFixed(1)}%;background:linear-gradient(90deg,${st.color},${st.color}cc);border-radius:8px;"></div></div>
          <div style="text-align:right;font-size:17px;font-weight:700;color:var(--text);letter-spacing:-0.3px;">${fmt(st.v)}</div>
          <div style="font-size:11px;color:var(--text3);line-height:1.45;">${rate !== null ? `<span style="font-size:13px;font-weight:700;color:${st.color};">${rate < 1 ? rate.toFixed(2) : rate.toFixed(1)}%</span> จากขั้นก่อน<br>` : '<span style="font-size:13px;font-weight:700;color:var(--text2);">100%</span> ฐาน<br>'}${cost !== null ? '฿' + fmt(cost) + ' ต่อครั้ง' : ''}</div></div>`;
      }).join('') + `</div>
      <div style="font-size:11px;color:var(--text3);margin-top:10px;line-height:1.6;border-top:1px solid var(--border);padding-top:8px;">ยอดขายจริง Facebook ในช่วงนี้ <b style="color:var(--text2);">฿${fmtB(rev)}</b> · ทัก 1 ครั้ง ≈ <b style="color:var(--text2);">฿${T.msg_started ? fmt(rev / T.msg_started) : '—'}</b> ยอดขาย (คิดจากยอดทั้งช่องทาง) · ขั้น "ซื้อ" นับได้เฉพาะที่ pixel เห็น ต่ำกว่าจริง</div>`;
  }
  function renderPr() {
    const d = _data; if (!d) return;
    const prAds = (d.ads || []).filter(a => a.bucket === 'PR');
    const sum = (rows, k) => rows.reduce((s, r) => s + (+r[k] || 0), 0);
    const T = { spend: sum(prAds, 'spend'), impressions: sum(prAds, 'impressions'), reach: sum(prAds, 'reach'), post_engagement: sum(prAds, 'post_engagement'), msg_started: sum(prAds, 'msg_started'), link_clicks: sum(prAds, 'link_clicks') };
    const pr = (d.daily_bucket || []).filter(r => r.bucket === 'PR');
    const days = pr.filter(r => +r.spend > 0).length || Math.max(1, new Set(prAds.map(a => a.first_date)).size);
    const k = (t, v, sub) => `<div class="card" style="flex:1;min-width:120px;padding:10px 12px;"><div class="card-title">${t}</div><div class="kpi-value" style="font-size:20px;">${v}</div>${sub ? `<div style="font-size:10px;color:var(--text3);margin-top:2px;">${sub}</div>` : ''}</div>`;
    document.getElementById('fba-pr-kpis').innerHTML = k('ค่าแอด PR รวม', '฿' + fmtB(T.spend), `เฉลี่ย ฿${fmt(Math.round(T.spend / days))} / วันที่ยิง · ${fmt(prAds.length)} แอด`) + k('คนเห็น (Impressions)', fmt(T.impressions), `CPM ฿${T.impressions ? (T.spend / T.impressions * 1000).toFixed(0) : '—'}`) + k('Reach', fmt(T.reach), T.reach ? `ความถี่ ${(T.impressions / T.reach).toFixed(2)}` : '') + k('มีส่วนร่วม', fmt(T.post_engagement), `ER ${pct(T.post_engagement, T.impressions)} · ฿${T.post_engagement ? fmt(T.spend / T.post_engagement) : '—'}/ครั้ง`) + k('ทักแชท', fmt(T.msg_started), `฿${T.msg_started ? fmt(T.spend / T.msg_started) : '—'}/ทัก · คลิกลิงก์ ${fmt(T.link_clicks)}`);
    // กราฟ: ค่าแอด PR รายวัน + metric ที่เลือก
    const mk = document.getElementById('fbaPrMetric')?.value || 'reach';
    const labels = pr.map(r => thShort(r.d));
    const isMoneyK = ['cpm','cpe','cost_per_msg','cpc','cpv'].includes(mk);
    makeChart('chartFbaPr', 'line', labels, [
      line('ค่าแอด PR', pr.map(r => +r.spend), '#a78bfa', { fill: true, backgroundColor: 'rgba(167,139,250,0.10)', yAxisID: 'y', borderWidth: 2 }),
      line(M[mk].label, pr.map(r => M[mk].val(r)), '#2563eb', { yAxisID: 'y1', borderWidth: 1.6 })
    ], { options: { interaction: { mode: 'index', intersect: false } }, legend: legendOpts(),
      scales: { x: xaxis(), y: Object.assign(axis('#a78bfa', v => fmtB(v), 'ค่าแอด'), { position: 'left', beginAtZero: true }), y1: Object.assign(axis('#2563eb', v => isMoneyK ? fmtB(v) : (mk === 'er' || mk === 'ctr') ? (v * 100).toFixed(1) + '%' : fmtB(v), M[mk].label), { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } }) },
      tooltip: tooltipOpts({ label: it => `${it.dataset.label}: ${it.datasetIndex === 0 || isMoneyK ? '฿' + fmt(it.raw) : (mk === 'er' || mk === 'ctr') ? (it.raw * 100).toFixed(2) + '%' : fmt(it.raw)}` }) });
    if (!pr.length) { const c = document.getElementById('chartFbaPr'); if (c) c.parentElement.innerHTML = '<div class="empty" style="padding:30px;">ยังไม่มีข้อมูลรายวันต่อประเภท — รัน SQL 95 ตัวล่าสุด (daily_bucket) แล้วรีเฟรช</div>'; }
    // ตารางรายเพจ/KOL — metric เลือกได้
    const byPage = {};
    prAds.forEach(a => { const key = a.page_name || (a.kol_hint ? 'KOL: ' + a.kol_hint : (a.page_id ? 'เพจ ' + a.page_id : a.account || '—')); const o = byPage[key] = byPage[key] || { name: key, page_id: a.page_id, ads: 0 }; o.ads++; ORDER.forEach(k => { if (!['frequency','cpm','ctr','cpc','er','cpe','cpv','cost_per_msg','cpa','roas_meta','days','period'].includes(k)) o[k] = (o[k] || 0) + (+a[k] || 0); }); });
    const ks = cols('fbaPr');
    const rows = Object.values(byPage).sort((a, b) => b.spend - a.spend);
    document.getElementById('theadFbaPr').innerHTML = `<tr><th>เพจ / KOL ที่ยิงให้</th><th>แอด</th><th>% ของ PR</th>${ks.map(k => `<th>${M[k].label}</th>`).join('')}</tr>`;
    document.getElementById('tbodyFbaPr').innerHTML = rows.map(o => `<tr><td>${o.page_id ? `<a href="https://www.facebook.com/${ttcEscAttr(o.page_id)}" target="_blank" rel="noopener" style="color:var(--text);text-decoration:none;">${ttcEsc(o.name)} ↗</a>` : ttcEsc(o.name)}</td><td>${fmt(o.ads)}</td><td>${pct(o.spend, T.spend)}</td>${ks.map(k => `<td${k === 'spend' ? ' style="font-weight:600;"' : ''}>${M[k].fmt(o)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${3 + ks.length}" class="empty">ไม่มีแอด PR ในช่วงนี้</td></tr>`;
  }
  function renderDailyTable() {
    const ks = cols('fbaDaily');
    const mode = document.getElementById('fbaDailyMode')?.value || 'conv';
    let daily = (_data?.daily || []).slice();
    const db = _data?.daily_bucket || [];
    if (!db.length) {
      // ยังไม่มีข้อมูลรายวันต่อประเภท (ต้องรัน SQL 95 ตัวล่าสุด) → ใช้ค่าแอด Conversion จาก daily และ metric อื่นแบบรวม พร้อมบอกไว้
      daily = daily.map(r => ({ ...r, spend: mode === 'conv' ? (+r.spend_conv || 0) : +r.spend }));
    } else {
      const want = mode === 'conv' ? ['Conversion'] : ['Conversion', 'PR'];
      const agg = {}; db.filter(r => want.includes(r.bucket)).forEach(r => { const o = agg[r.d] = agg[r.d] || {}; ['spend','impressions','reach','clicks','link_clicks','post_engagement','reactions','comments','shares','saves','video_3s','thruplay','msg_started','purchases','purchase_value','ads'].forEach(k => { o[k] = (o[k] || 0) + (+r[k] || 0); }); });
      daily = daily.map(r => { const c = agg[r.d] || {}; const o = { ...r, spend: +c.spend || 0 }; ['impressions','reach','clicks','link_clicks','post_engagement','reactions','comments','shares','saves','video_3s','thruplay','msg_started','purchases','purchase_value','ads'].forEach(k => { o[k] = +c[k] || 0; }); return o; });
    }
    daily.sort((a, b) => b.d.localeCompare(a.d));
    const all = R; const F = k => (R[k] ? R[k].fmt : M[k].fmt);
    document.getElementById('theadFbaDaily').innerHTML = `<tr><th>วันที่</th>${ks.map(k => `<th>${mlabel(k)}</th>`).join('')}</tr>`;
    document.getElementById('fba-daily-count').textContent = `(${fmt(daily.length)} วัน · ${mode === 'conv' ? 'เฉพาะ Conversion' : 'Conversion + PR'}${db.length ? '' : ' · ⚠ รัน SQL 95 ตัวล่าสุดเพื่อให้ metric แยกประเภทได้'})`;
    const tot = daily.reduce((t, r) => { Object.keys(r).forEach(k => { if (k !== 'd' && typeof r[k] !== 'object') t[k] = (t[k] || 0) + (+r[k] || 0); }); return t; }, {});
    document.getElementById('tbodyFbaDaily').innerHTML = daily.map(r => `<tr><td style="font-family:'IBM Plex Mono',monospace;font-size:11px;white-space:nowrap;">${thShort(r.d)}</td>${ks.map(k => `<td${k === 'spend' || k === 'revenue' ? ' style="font-weight:600;"' : ''}>${F(k)(r)}</td>`).join('')}</tr>`).join('')
      + (daily.length ? `<tr style="font-weight:700;background:var(--bg3);"><td>รวม</td>${ks.map(k => `<td>${F(k)(tot)}</td>`).join('')}</tr>` : `<tr><td colspan="${1 + ks.length}" class="empty">ไม่มีข้อมูล</td></tr>`);
  }

  function sortRows(rows, key, dir) { const v = M[key] ? M[key].val : (r => +r[key] || 0); return rows.slice().sort((a, b) => { const x = v(a), y = v(b); const c = typeof x === 'string' ? x.localeCompare(y) : x - y; return dir === 'asc' ? c : -c; }); }
  function renderCampaigns() {
    const ks = cols('fbaCamp');
    if (!M[_sortKey]) _sortKey = 'spend';
    const rows = sortRows(filteredCampaigns(), _sortKey, _sortDir);
    document.getElementById('theadFbaCampaign').innerHTML = `<tr><th>แคมเปญ</th><th>บัญชี</th><th>objective</th><th>สถานะ</th><th>แอด</th>${ks.map(k => `<th class="sortable-th" data-k="${k}">${M[k].label} <span class="sort-ind"></span></th>`).join('')}</tr>`;
    bindSort('tblFbaCampaign', k => { if (_sortKey === k) _sortDir = _sortDir === 'desc' ? 'asc' : 'desc'; else { _sortKey = k; _sortDir = 'desc'; } renderCampaigns(); });
    sortInd('tblFbaCampaign', _sortKey, _sortDir);
    document.getElementById('fba-camp-count').textContent = `(${fmt(rows.length)})`;
    const st = s => s === 'ACTIVE' ? '<span style="color:var(--green);font-size:10.5px;font-weight:600;">รันอยู่</span>' : `<span style="color:var(--text3);font-size:10.5px;">${ttcEsc((s || '').toLowerCase().replace('_', ' '))}</span>`;
    document.getElementById('tbodyFbaCampaign').innerHTML = rows.map(c => `<tr><td><b>${ttcEsc(c.name || c.campaign_id)}</b></td><td style="font-size:11px;color:var(--text3);">${ttcEsc(c.account || '')}</td><td style="font-size:11px;">${ttcEsc(obj(c.objective))}</td><td>${st(c.effective_status)}</td><td>${fmt(c.ads)}</td>${ks.map(k => `<td${k === 'spend' ? ' style="font-weight:600;"' : ''}>${M[k].fmt(c)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${5 + ks.length}" class="empty">ไม่มีข้อมูล</td></tr>`;
  }

  function renderAds() {
    const ks = cols('fbaAds');
    if (!M[_adsSortKey]) _adsSortKey = 'spend';
    const q = (document.getElementById('fbaAdsSearch')?.value || '').toLowerCase().trim();
    let rows = filteredAds();
    if (q) rows = rows.filter(a => (a.name || '').toLowerCase().includes(q) || (a.campaign || '').toLowerCase().includes(q) || (a.kol_hint || '').toLowerCase().includes(q));
    rows = sortRows(rows, _adsSortKey, _adsSortDir);
    document.getElementById('theadFbaAds').innerHTML = `<tr><th>โพสต์</th><th>แอด</th><th>แคมเปญ</th><th>บัญชี</th>${ks.map(k => `<th class="sortable-th" data-k="${k}">${M[k].label} <span class="sort-ind"></span></th>`).join('')}</tr>`;
    bindSort('tblFbaAds', k => { if (_adsSortKey === k) _adsSortDir = _adsSortDir === 'desc' ? 'asc' : 'desc'; else { _adsSortKey = k; _adsSortDir = 'desc'; } renderAds(); });
    sortInd('tblFbaAds', _adsSortKey, _adsSortDir);
    document.getElementById('fba-ads-count').textContent = `(${fmt(rows.length)})`;
    document.getElementById('tbodyFbaAds').innerHTML = rows.map(a => {
      const link = postUrl(a.post_id);
      const thumb = a.thumbnail_url ? `<img src="${ttcEscAttr(a.thumbnail_url)}" class="zoom-thumb" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">` : '📘';
      return `<tr><td><div style="display:flex;align-items:center;gap:8px;"><a ${link ? `href="${ttcEscAttr(link)}" target="_blank" rel="noopener"` : ''} style="display:block;width:44px;height:44px;border-radius:6px;overflow:hidden;background:var(--bg3);flex:0 0 auto;text-align:center;line-height:44px;">${thumb}</a>
        <div style="font-size:10.5px;color:var(--text3);line-height:1.3;"><div style="display:inline-block;font-size:9.5px;font-weight:700;padding:0 5px;border-radius:4px;background:${a.bucket === 'Conversion' ? 'rgba(34,197,94,0.15)' : a.bucket === 'CPAS' ? 'rgba(96,165,250,0.15)' : 'rgba(167,139,250,0.15)'};color:${a.bucket === 'Conversion' ? 'var(--green)' : a.bucket === 'CPAS' ? '#60a5fa' : '#a78bfa'};">${ttcEsc(a.bucket || '—')}</div>${a.page_name ? `<div style="color:var(--text2);">${ttcEsc(a.page_name)}</div>` : ''}${a.kol_hint ? `<div style="color:var(--text2);font-weight:600;">KOL: ${ttcEsc(a.kol_hint)}</div>` : ''}${a.instagram_url ? `<a href="${ttcEscAttr(a.instagram_url)}" target="_blank" rel="noopener" style="color:var(--accent);">IG ↗</a>` : ''}</div></div></td>
        <td style="font-size:11px;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${ttcEscAttr(a.name || '')}">${ttcEsc(a.name || a.ad_id)}</td>
        <td style="font-size:11px;color:var(--text3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${ttcEscAttr(a.campaign || '')}">${ttcEsc(a.campaign || '')}</td>
        <td style="font-size:11px;color:var(--text3);">${ttcEsc(a.account || '')}</td>
        ${ks.map(k => `<td${k === 'spend' ? ' style="font-weight:600;"' : ''}>${M[k].fmt(a)}</td>`).join('')}</tr>`;
    }).join('') || `<tr><td colspan="${4 + ks.length}" class="empty">ไม่มีแอดตามเงื่อนไข</td></tr>`;
  }

  window.renderFbAdsPage = load;
})();
