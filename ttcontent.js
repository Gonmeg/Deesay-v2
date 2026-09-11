// ttcontent.js — หน้า "ผลงานคอนเทนต์ (TikTok)" เวอร์ชันใหม่ ใช้ข้อมูลจาก TikTok API ตรง (เลิกใช้ Windsor)
// ใช้ของกลางจาก dashboard.html: supaRpc, fmtDateISO, chartTickColor/chartGridColor, Chart.js, CSS
// RPC: tiktok_content_page(p_days) จาก 66_tiktok_comments_benchmark.sql
// v1 (2026-09-11)
(function () {
  const fmtN = (n, d = 0) => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toLocaleString('th-TH', { maximumFractionDigits: d, minimumFractionDigits: d });
  const pct = (n, d = 1) => (n === null || n === undefined || isNaN(n)) ? '—' : (Number(n) * 100).toFixed(d) + '%';
  const dTH = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let DATA = null, days = 30, tab = 'clips', chart = null, q = '', sortKey = 'post_date', sortDir = -1, onlyQuestions = true;

  const root = () => document.getElementById('page-ttcontent');

  // คอมเมนต์ที่เป็น "คำถาม" จริง ๆ (ที่เหลือคือชมเฉย ๆ / อีโมจิ)
  const QWORDS = ['ไหม', 'มั้ย', 'หรือ', 'ยังไง', 'เท่าไร', 'เท่าไหร่', 'กี่', 'ที่ไหน', 'อะไร', 'เมื่อไร', 'เมื่อไหร่', 'ราคา', 'ส่ง', 'สั่ง', 'ซื้อ', 'มีขาย', 'สอบถาม', '?'];
  const isQuestion = t => { const x = String(t || ''); return QWORDS.some(w => x.includes(w)); };

  async function load() {
    if (!root()) return;
    root().innerHTML = '<div class="card"><div class="empty">กำลังโหลดข้อมูลคอนเทนต์...</div></div>';
    try {
      DATA = await supaRpc('tiktok_content_page', { p_days: Number(days) });
      if (Array.isArray(DATA)) DATA = DATA[0] ?? {};                 // เผื่อ PostgREST ห่อมาเป็น array
      if (DATA && DATA.tiktok_content_page) DATA = DATA.tiktok_content_page;  // เผื่อห่อด้วยชื่อฟังก์ชัน
      window._ttcRaw = DATA;
    } catch (e) {
      root().innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)} — ถ้าขึ้น "function not found" แปลว่ายังไม่ได้รัน 66_tiktok_comments_benchmark.sql</div>`;
      return;
    }
    render();
  }

  function render() {
    const d = DATA || {}, p = d.profile || {}, t = d.totals || {}, b = d.benchmark || {};
    const daily = d.daily || [], vids = d.videos || [];

    // ---- ตัวเลขช่วงนี้ ----
    const newFollow = daily.reduce((s, x) => s + (+x.daily_new_followers || 0), 0);
    const lostFollow = daily.reduce((s, x) => s + (+x.daily_lost_followers || 0), 0);
    const profileViews = daily.reduce((s, x) => s + (+x.profile_views || 0), 0);
    const bioClicks = daily.reduce((s, x) => s + (+x.bio_link_clicks || 0), 0);
    const engRate = t.views ? ((+t.likes + +t.comments + +t.shares) / +t.views) : null;

    const kpis = [
      ['ผู้ติดตามตอนนี้', fmtN(p.followers_count), `${days} วันนี้ +${fmtN(newFollow)} · เลิกตาม ${fmtN(lostFollow)}`],
      ['คลิปในช่วงนี้', fmtN(t.clips), `ยอดวิวรวม ${fmtN(t.views)}`],
      ['Engagement rate', pct(engRate, 2), b.average_engagement_rate ? `ค่าเฉลี่ยวงการ ${pct(b.average_engagement_rate, 2)}` : ''],
      ['ดูจนจบเฉลี่ย', pct(t.avg_watched_rate, 1), `ดูเฉลี่ย ${fmtN(t.avg_time, 1)} วินาที`],
      ['คนเข้าดูโปรไฟล์', fmtN(profileViews), `กดลิงก์ในไบโอ ${fmtN(bioClicks)} ครั้ง`],
      ['คอมเมนต์ค้างตอบ', `<span style="color:${d.unanswered_count ? 'var(--orange)' : 'var(--green)'};">${fmtN(d.unanswered_count)}</span>`, 'กดแท็บคอมเมนต์เพื่อดู'],
    ];

    // ---- เทียบกับวงการ ----
    const cmp = [];
    if (b.average_engagement_rate != null) {
      const avgFollowDay = daily.length ? newFollow / daily.length - lostFollow / daily.length : null;
      cmp.push(['Engagement rate', engRate, b.average_engagement_rate, v => pct(v, 2)]);
      cmp.push(['ผู้ติดตามโต/วัน', avgFollowDay, b.average_follower_growth, v => fmtN(v, 1) + ' คน']);
      cmp.push(['จำนวนคลิปทั้งช่อง', p.videos_count, b.average_video_count, v => fmtN(v) + ' คลิป']);
      cmp.push(['ผู้ติดตาม', p.followers_count, b.average_follower_count, v => fmtN(v) + ' คน']);
    }

    root().innerHTML = `
      <div id="ttcDebug" style="display:none;"></div>
      <div class="ttc-head">
        <div style="font-size:11.5px;color:var(--text3);">ข้อมูลจาก TikTok API โดยตรง · อัปเดตทุกเช้า 07:30 · แสดง ${days} วันล่าสุด · ข้อมูล ณ ${dTH(d.as_of)}</div>
        <div style="display:flex;gap:6px;align-items:center;">
          <div class="toggle-group">
            ${[7, 30, 90].map(n => `<button class="toggle-btn ${days === n ? 'active' : ''}" data-days="${n}">${n} วัน</button>`).join('')}
          </div>
          <button class="btn btn-ghost" id="ttcRefresh">↻ รีเฟรช</button>
        </div>
      </div>

      <div class="ttc-kpis">
        ${kpis.map(([l, v, s]) => `<div class="card ttc-kpi"><div class="card-title">${l}</div><div class="kpi-value">${v}</div><div class="kpi-sub">${s}</div></div>`).join('')}
      </div>

      <div class="ttc-grid2">
        <div class="card">
          <div class="section-header"><div class="section-title">ยอดวิวมาจากไหน</div><span style="font-size:10.5px;color:var(--text3);">เฉลี่ยทุกคลิปในช่วงนี้</span></div>
          ${[['หน้าฟีด (For You)', t.foryou, 'var(--accent)'], ['ค้นหา', t.search, '#60a5fa'], ['ผู้ติดตาม', t.follow, '#4ade80'], ['โปรไฟล์', t.profile, '#c084fc']]
            .map(([l, v, c]) => `<div class="ttc-src"><span>${l}</span><div class="ttc-srcbar"><i style="width:${Math.min(100, (v || 0) * 100)}%;background:${c};"></i></div><b>${pct(v, 1)}</b></div>`).join('')}
          <div style="font-size:10.5px;color:var(--text3);margin-top:10px;line-height:1.6;">ฟีดเยอะ = อัลกอริทึมดัน ได้คนใหม่ · ค้นหาเยอะ = คนตั้งใจหาแบรนด์เรา · ผู้ติดตามเยอะแต่ฟีดน้อย = ไม่กระจายออกนอกกลุ่มเดิม</div>
        </div>
        <div class="card">
          <div class="section-header"><div class="section-title">เทียบกับวงการความงาม</div><span style="font-size:10.5px;color:var(--text3);">ค่าเฉลี่ยช่องหมวดเดียวกันในไทย</span></div>
          ${cmp.length ? cmp.map(([l, mine, avg, f]) => {
            const good = mine != null && avg != null && mine >= avg;
            return `<div class="ttc-cmp"><span>${l}</span><b style="color:${good ? 'var(--green)' : 'var(--orange)'};">${f(mine)}</b><span class="ttc-cmp-avg">เฉลี่ย ${f(avg)}</span></div>`;
          }).join('') : '<div class="empty" style="padding:20px;">ยังไม่มีข้อมูลเทียบ</div>'}
        </div>
      </div>

      <div class="card" style="margin-bottom:18px;">
        <div class="section-header"><div class="section-title">ช่วงเวลาที่คนดูออนไลน์</div><span style="font-size:10.5px;color:var(--text3);">เฉลี่ย 30 วัน · เวลาไทย · ใช้วางแผนเวลาลงคลิปและไลฟ์</span></div>
        <div class="chart-wrap" style="height:190px;"><canvas id="ttcHours"></canvas></div>
      </div>

      <div class="tabs-row">
        ${[['clips', `คลิป (${fmtN(vids.length)})`], ['comments', `คอมเมนต์ค้างตอบ (${fmtN(d.unanswered_count)})`], ['keywords', 'ค้นหาคำที่คนใช้']]
          .map(([k, l]) => `<button class="toggle-btn ${tab === k ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}
      </div>
      <div id="ttcTab"></div>

      <style>
        #page-ttcontent .ttc-head { display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
        #page-ttcontent .ttc-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
        #page-ttcontent .ttc-kpi { padding:13px 15px; }
        #page-ttcontent .ttc-kpi .card-title { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:11.5px; font-weight:600; color:var(--text2); margin-bottom:4px; }
        #page-ttcontent .ttc-kpi .kpi-value { font-size:19px; line-height:1.15; }
        #page-ttcontent .ttc-kpi .kpi-sub { font-size:10.5px; color:var(--text3); margin-top:5px; display:block; line-height:1.4; }
        #page-ttcontent .ttc-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:18px; }
        #page-ttcontent .ttc-src { display:flex; align-items:center; gap:10px; font-size:12px; margin:9px 0; }
        #page-ttcontent .ttc-src span:first-child { width:120px; color:var(--text2); }
        #page-ttcontent .ttc-src b { width:52px; text-align:right; font-variant-numeric:tabular-nums; }
        #page-ttcontent .ttc-srcbar { flex:1; height:7px; border-radius:4px; background:var(--bg3); overflow:hidden; }
        #page-ttcontent .ttc-srcbar i { display:block; height:100%; border-radius:4px; }
        #page-ttcontent .ttc-cmp { display:flex; align-items:center; gap:10px; font-size:12px; margin:11px 0; }
        #page-ttcontent .ttc-cmp span:first-child { flex:1; color:var(--text2); }
        #page-ttcontent .ttc-cmp b { font-size:13px; font-variant-numeric:tabular-nums; }
        #page-ttcontent .ttc-cmp-avg { font-size:10.5px; color:var(--text3); width:110px; text-align:right; }
        #page-ttcontent .tabs-row { display:flex; gap:6px; margin-bottom:14px; flex-wrap:wrap; }
        #page-ttcontent table { width:100%; border-collapse:collapse; }
        #page-ttcontent th { font-family:'Sarabun',sans-serif; text-transform:none; letter-spacing:0; font-size:11.5px; font-weight:600;
          color:var(--text2); padding:11px 12px; white-space:nowrap; text-align:right; position:sticky; top:0; background:var(--bg2); z-index:3; border-bottom:1px solid var(--border2); }
        #page-ttcontent th:first-child, #page-ttcontent th.t-left { text-align:left; }
        #page-ttcontent td { padding:11px 12px; font-size:12.5px; text-align:right; border-top:1px solid var(--border); vertical-align:middle; font-variant-numeric:tabular-nums; }
        #page-ttcontent td.t-left { text-align:left; }
        #page-ttcontent tbody tr:hover td { background:var(--bg3); }
        #page-ttcontent .ttc-thumb { width:44px; height:58px; object-fit:cover; border-radius:6px; background:var(--bg3); display:block; }
        #page-ttcontent .ttc-cap { font-size:11.5px; line-height:1.5; max-width:380px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        #page-ttcontent .ttc-sub { font-size:10px; color:var(--text3); margin-top:3px; }
        #page-ttcontent .ttc-chip { display:inline-block; font-size:10px; padding:2px 7px; border-radius:99px; background:var(--bg3); border:1px solid var(--border); color:var(--text2); margin-right:4px; }
        @media (max-width:1100px){ #page-ttcontent .ttc-kpis { grid-template-columns:repeat(2,1fr); } #page-ttcontent .ttc-grid2 { grid-template-columns:1fr; } }
      </style>`;

    // แถบตรวจสอบ — โชว์เฉพาะตอนข้อมูลหลักว่าง จะได้รู้ว่าขาดตรงไหน
    if (!t.clips || !p.followers_count) {
      const dbg = document.getElementById('ttcDebug');
      if (dbg) {
        dbg.style.display = 'block';
        dbg.innerHTML = `<div class="error-banner" style="display:block;margin-bottom:12px;">
          ข้อมูลบางส่วนว่าง — ที่ได้รับมา: ${Object.keys(d || {}).join(', ') || '(ไม่มีเลย)'}
          <br>clips=${JSON.stringify(t.clips)} · videos=${(d.videos || []).length} · daily=${(d.daily || []).length}
          · profile=${p && p.followers_count ? 'มี' : 'ไม่มี'} · benchmark=${b && b.average_engagement_rate ? 'มี' : 'ไม่มี'}
          · unanswered=${d.unanswered_count ?? '—'}
          <br><span style="font-size:11px;">เปิด Console แล้วพิมพ์ <code>window._ttcRaw</code> เพื่อดูข้อมูลดิบทั้งหมด</span>
        </div>`;
      }
    }
    drawHours(d.best_hours || []);
    renderTab();

    root().querySelectorAll('[data-days]').forEach(b2 => b2.onclick = () => { days = +b2.dataset.days; load(); });
    root().querySelector('#ttcRefresh').onclick = load;
    root().querySelectorAll('[data-tab]').forEach(b2 => b2.onclick = () => { tab = b2.dataset.tab; render(); });
  }

  function drawHours(hours) {
    const el = document.getElementById('ttcHours'); if (!el) return;
    const byHour = {}; hours.forEach(h => byHour[h.hour] = +h.count);
    const labels = [...Array(24).keys()];
    const data = labels.map(h => byHour[h] ?? 0);
    const max = Math.max(...data, 1);
    if (chart) chart.destroy();
    chart = new Chart(el, {
      type: 'bar',
      data: { labels: labels.map(h => String(h).padStart(2, '0') + ':00'),
        datasets: [{ data, backgroundColor: data.map(v => v >= max * 0.92 ? '#c8a96e' : 'rgba(200,169,110,.32)'), borderRadius: 3 }] },
      options: { responsive: true, maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { titleFont: { family: 'Sarabun' }, bodyFont: { family: 'Sarabun' },
          callbacks: { label: it => fmtN(it.raw) + ' คน' } } },
        scales: { x: { grid: { display: false }, ticks: { color: chartTickColor(), font: { family: 'Sarabun', size: 9 }, maxTicksLimit: 12 } },
          y: { beginAtZero: true, grid: { color: chartGridColor() }, ticks: { color: chartTickColor(), font: { family: 'Sarabun', size: 9 }, callback: v => (v / 1000) + 'k' } } } }
    });
  }

  function renderTab() {
    const el = document.getElementById('ttcTab'); if (!el) return;
    if (tab === 'clips') return renderClips(el);
    if (tab === 'comments') return renderComments(el);
    return renderKeywords(el);
  }

  function renderClips(el) {
    const all = (DATA.videos || []).filter(v => !q || String(v.caption || '').toLowerCase().includes(q.toLowerCase()));
    const rows = [...all].sort((a, b) => {
      const x = a[sortKey], y = b[sortKey];
      if (typeof x === 'number' || typeof y === 'number') return ((+x || 0) - (+y || 0)) * sortDir;
      return String(x || '').localeCompare(String(y || '')) * sortDir;
    });
    const COLS = [['post_date', 'วันที่'], ['video_views', 'วิว'], ['likes', 'ไลก์'], ['comments', 'คอมเมนต์'], ['shares', 'แชร์'],
      ['full_video_watched_rate', 'ดูจนจบ'], ['average_time_watched', 'ดูเฉลี่ย (วิ)'], ['src_foryou', 'ฟีด'], ['src_search', 'ค้นหา']];
    el.innerHTML = `
      <div class="card">
        <div class="section-header">
          <div class="section-title">คลิปทั้งหมดในช่วงนี้</div>
          <input type="text" class="ls-input" id="ttcQ" placeholder="🔎 ค้นหาจากแคปชั่น" value="${esc(q)}" style="width:240px;padding:6px 10px;font-size:12px;">
        </div>
        <div class="table-wrap" style="max-height:1000px;overflow:auto;">
          <table data-no-sort><thead><tr><th class="t-left">คลิป</th>${COLS.map(([k, l]) => `<th data-k="${k}" style="cursor:pointer;">${l}${sortKey === k ? `<span class="sort-arrow">${sortDir < 0 ? '▼' : '▲'}</span>` : ''}</th>`).join('')}</tr></thead>
          <tbody>${rows.length ? rows.map(v => `
            <tr>
              <td class="t-left">
                <div style="display:flex;gap:10px;align-items:flex-start;">
                  <a href="${esc(v.share_url || '#')}" target="_blank" rel="noopener"><img class="ttc-thumb" src="${esc(v.thumbnail_url || '')}" loading="lazy" onerror="this.style.visibility='hidden'"></a>
                  <div><div class="ttc-cap">${esc(v.caption || '(ไม่มีแคปชั่น)')}</div>
                  <div class="ttc-sub">${dTH(v.post_date)}</div></div>
                </div>
              </td>
              <td>${dTH(v.post_date)}</td>
              <td><b>${fmtN(v.video_views)}</b></td>
              <td>${fmtN(v.likes)}</td>
              <td>${fmtN(v.comments)}</td>
              <td>${fmtN(v.shares)}</td>
              <td>${pct(v.full_video_watched_rate, 1)}</td>
              <td>${fmtN(v.average_time_watched, 1)}</td>
              <td>${pct(v.src_foryou, 1)}</td>
              <td>${pct(v.src_search, 1)}</td>
            </tr>`).join('') : '<tr><td colspan="10" class="empty">ไม่มีคลิปในช่วงนี้</td></tr>'}
          </tbody></table>
        </div>
      </div>`;
    el.querySelector('#ttcQ').oninput = e => { q = e.target.value; renderTab(); };
    el.querySelectorAll('th[data-k]').forEach(th => th.onclick = () => {
      const k = th.dataset.k;
      if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = -1; }
      renderTab();
    });
  }

  function renderComments(el) {
    let list = DATA.unanswered || [];
    if (onlyQuestions) list = list.filter(c => isQuestion(c.text));
    el.innerHTML = `
      <div class="card">
        <div class="section-header">
          <div class="section-title">คอมเมนต์ที่ยังไม่มีใครตอบ</div>
          <div style="display:flex;gap:8px;align-items:center;">
            <label class="chip-toggle ${onlyQuestions ? 'on' : ''}" style="cursor:pointer;font-size:11.5px;"><input type="checkbox" id="ttcOnlyQ" ${onlyQuestions ? 'checked' : ''} style="margin-right:6px;">เฉพาะที่เป็นคำถาม</label>
            <span style="font-size:10.5px;color:var(--text3);">ทั้งหมด ${fmtN(DATA.unanswered_count)} · แสดง ${fmtN(list.length)}</span>
          </div>
        </div>
        <div class="table-wrap" style="max-height:900px;overflow:auto;">
          <table data-no-sort><thead><tr><th class="t-left">วันที่</th><th class="t-left">คนเขียน</th><th class="t-left">ข้อความ</th><th>ไลก์</th><th class="t-left">คลิป</th></tr></thead>
          <tbody>${list.length ? list.map(c => `
            <tr>
              <td class="t-left">${dTH(c.comment_date)}</td>
              <td class="t-left">${esc(c.display_name || c.username || '')}</td>
              <td class="t-left" style="max-width:420px;white-space:normal;line-height:1.55;">${esc(c.text || '')}</td>
              <td>${fmtN(c.likes)}</td>
              <td class="t-left"><a href="${esc(c.share_url || '#')}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;"><div class="ttc-cap" style="max-width:230px;-webkit-line-clamp:1;">${esc(c.caption || 'เปิดคลิป')}</div></a></td>
            </tr>`).join('') : '<tr><td colspan="5" class="empty">ไม่มีคอมเมนต์ค้างตอบ 🎉</td></tr>'}
          </tbody></table>
        </div>
        <div style="font-size:10.5px;color:var(--text3);margin-top:10px;line-height:1.6;">"เป็นคำถาม" ดูจากคำอย่าง ไหม / มั้ย / เท่าไร / ราคา / สั่ง / ซื้อ / มีขาย — ที่เหลือมักเป็นคำชมหรืออีโมจิ ซึ่งไม่ต้องรีบตอบ</div>
      </div>`;
    el.querySelector('#ttcOnlyQ').onchange = e => { onlyQuestions = e.target.checked; renderTab(); };
  }

  function renderKeywords(el) {
    el.innerHTML = `
      <div class="card">
        <div class="section-header"><div class="section-title">ค้นหาคำที่คนใช้จริงบน TikTok</div><span style="font-size:10.5px;color:var(--text3);">พิมพ์คำที่เกี่ยวกับสินค้า แล้วดูว่าคนค้นคำใกล้เคียงอะไรบ้าง</span></div>
        <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
          <input type="text" class="ls-input" id="kwInput" placeholder="เช่น แป้ง, กันแดด, ลิป" style="width:260px;padding:8px 12px;font-size:13px;">
          <button class="btn btn-primary" id="kwGo">ค้นหา</button>
          ${['แป้ง', 'กันแดด', 'ลิป', 'คุชชั่น'].map(w => `<button class="btn btn-ghost kw-quick" data-w="${w}">${w}</button>`).join('')}
        </div>
        <div id="kwResult" style="font-size:12.5px;color:var(--text3);">พิมพ์คำแล้วกดค้นหา — ผลลัพธ์เอาไปใช้ตั้งชื่อคลิปและใส่แฮชแท็กได้</div>
      </div>`;
    const go = async () => {
      const w = el.querySelector('#kwInput').value.trim();
      if (!w) return;
      const box = el.querySelector('#kwResult');
      box.innerHTML = 'กำลังค้นหา...';
      try {
        const r = await fetch(`${window.SUPABASE_URL}/functions/v1/tiktok-probe?only=keyword&q=${encodeURIComponent(w)}`);
        const j = await r.json();
        const arr = j?.keyword?.ตัวอย่าง_2_รายการ ? null : null;
        const raw = j?.keyword;
        const words = raw && raw.จำนวนที่ได้ ? (raw.ตัวอย่าง_2_รายการ || []) : [];
        box.innerHTML = words.length
          ? `<div style="margin-bottom:8px;color:var(--text2);">คนที่ค้นคำว่า "<b>${esc(w)}</b>" มักค้นคำพวกนี้ด้วย</div>` +
            words.map(x => `<span class="ttc-chip" style="font-size:12px;padding:5px 11px;margin:0 6px 6px 0;">${esc(x)}</span>`).join('')
          : `ไม่พบคำที่เกี่ยวข้อง (${esc(raw?.message || '')})`;
      } catch (e) { box.innerHTML = 'ค้นหาไม่สำเร็จ: ' + esc(e.message); }
    };
    el.querySelector('#kwGo').onclick = go;
    el.querySelector('#kwInput').onkeydown = e => { if (e.key === 'Enter') go(); };
    el.querySelectorAll('.kw-quick').forEach(b => b.onclick = () => { el.querySelector('#kwInput').value = b.dataset.w; go(); });
  }

  window.renderTtContentPage = function () { if (DATA) render(); else load(); };
})();
