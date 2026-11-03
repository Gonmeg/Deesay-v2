// ttcontent.js (v20261103d) — เอาหน้า "ค้นหาคำบน TikTok" ออก (ไม่มีคนใช้ · TikTok หยุดส่งแฮชแท็กมาแรงตั้งแต่ 5 ต.ค.)
// ttcontent.js (v20261103c) — กราฟมีส่วนร่วมเป็น Engagement rate รายวัน เทียบค่าเฉลี่ยวงการ
// ttcontent.js (v20261103b) — ผู้ติดตามโตสุทธิจากยอดรวม (เชื่อถือได้กว่าตัวเลขรายวัน) · สรุปขั้น ยอดวิว → โปรไฟล์ → ลิงก์ไบโอ
// ttcontent.js (v20261103a) — หน้าตาแบบ C: แถบตัวเลขเดียว · เทียบวงการเป็นป้ายสี · โน้ตใต้กล่องย้ายเข้า ⓘ
// ttcontent.js — หน้า "ผลงานคอนเทนต์ (TikTok)" เวอร์ชันใหม่ ใช้ข้อมูลจาก TikTok API ตรง (เลิกใช้ Windsor)
// ใช้ของกลางจาก dashboard.html: supaRpc, fmtDateISO, chartTickColor/chartGridColor, Chart.js, CSS
// RPC: tiktok_content_page(p_days) จาก 66_tiktok_comments_benchmark.sql
// v1 (2026-09-11) · v2 (2026-09-14) แถบบอกสถานะข้อมูล: แยก "TikTok ยังไม่ส่ง" กับ "ระบบยังไม่ได้ดึง"
(function () {
  const fmtN = (n, d = 0) => (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toLocaleString('th-TH', { maximumFractionDigits: d, minimumFractionDigits: d });
  const pct = (n, d = 1) => (n === null || n === undefined || isNaN(n)) ? '—' : (Number(n) * 100).toFixed(d) + '%';
  const dTH = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) : '—';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let DATA = null, days = 30, tab = 'clips', q = '', sortKey = 'post_date', sortDir = -1, onlyQuestions = true;
  let FRESH = null;   // { lastDay, lastPull } — ข้อมูลช่องล่าสุดถึงวันไหน และระบบดึงครั้งล่าสุดเมื่อไร (ไม่ขึ้นกับตัวกรองวันที่)

  // วันนี้ตามเวลาไทย (YYYY-MM-DD)
  const todayTH = () => new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
  const dayDiff = (a, b) => Math.round((new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime()) / 86400000);

  // อ่าน 2 ค่าเล็ก ๆ จากตาราง tiktok_account_daily ตรง ๆ: วันล่าสุดที่มีข้อมูล + เวลาที่ดึงครั้งสุดท้าย
  async function loadFreshness() {
    try {
      const h = { apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + authJwt() };
      const base = `${window.SUPABASE_URL}/rest/v1/tiktok_account_daily`;
      const [a, b] = await Promise.all([
        fetch(`${base}?select=stat_date&order=stat_date.desc&limit=1`, { headers: h }).then(r => r.json()),
        fetch(`${base}?select=updated_at&order=updated_at.desc&limit=1`, { headers: h }).then(r => r.json()),
      ]);
      FRESH = { lastDay: a?.[0]?.stat_date || null, lastPull: b?.[0]?.updated_at || null };
    } catch { FRESH = null; }
  }

  // ข้อความบอกสถานะข้อมูล (สั้น ๆ ให้ทุกคนอ่านเข้าใจ) — คืน '' ถ้าทุกอย่างปกติ
  function freshnessNote() {
    // (2026-10-18) แจ้งที่ปุ่มสถานะข้อมูลข้างชื่อหน้า (ที่เดียว) แทนแถบในหน้า — คืน '' เสมอ
    const pg = typeof currentPage !== 'undefined' ? currentPage : 'ttcontent';
    const set = (lv, title, detail) => { if (window.pageNote) window.pageNote(pg, 'fresh', lv, title, detail); return ''; };
    if (!FRESH || !FRESH.lastDay) return set(null);
    const today = todayTH();
    const gap = dayDiff(today, FRESH.lastDay);                 // 1 = มีถึงเมื่อวาน (ปกติ)
    const pulledToday = FRESH.lastPull ? new Date(new Date(FRESH.lastPull).getTime() + 7 * 3600000).toISOString().slice(0, 10) === today : false;
    const pullTxt = FRESH.lastPull ? new Date(FRESH.lastPull).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
    const nd = new Date(FRESH.lastDay + 'T00:00:00'); nd.setDate(nd.getDate() + 1);
    const missing = nd.getFullYear() + '-' + String(nd.getMonth() + 1).padStart(2, '0') + '-' + String(nd.getDate()).padStart(2, '0');
    if (gap <= 1) return set(null);
    // (2026-10-19) บอกแค่ข้อมูลมีถึงวันไหน ไม่บอกผลพ่วง · TikTok ส่งตัวเลขช้า 1 วันเป็นเรื่องปกติ (ไม่เตือน)
    if (pulledToday && gap === 2) return set(null);
    return set(pulledToday ? 'warn' : 'bad', `ข้อมูล TikTok มีถึง ${dTH(FRESH.lastDay)}`, '');
  }


  // ===== metric ทั้งหมดที่ TikTok ให้ได้ + ที่คำนวณต่อเอง =====
  // v = ค่าที่เอาไปเรียง · f = วิธีแสดง
  const M = {
    post_date:   { label: 'Date',        tip: 'วันที่โพสต์คลิป',
                   v: c => c.post_date || '',             f: c => dTH(c.post_date) },
    video_views: { label: 'Views',       tip: 'ยอดวิวสะสมทั้งหมดของคลิป (รวมทั้งที่มาจาก Ads และ Organic)',
                   v: c => +c.video_views || 0,           f: c => `<b>${fmtN(c.video_views)}</b>` },
    views_day:   { label: 'Views/day',   tip: 'ยอดวิวสะสม ÷ จำนวนวันตั้งแต่โพสต์ — ใช้เทียบคลิปใหม่กับคลิปเก่าอย่างยุติธรรม',
                   v: c => viewsPerDay(c),                f: c => fmtN(viewsPerDay(c)) },
    likes:       { label: 'Likes',       tip: 'จำนวนคนกดหัวใจ',
                   v: c => +c.likes || 0,                 f: c => fmtN(c.likes) },
    comments:    { label: 'Comments',    tip: 'จำนวนคอมเมนต์ใต้คลิป',
                   v: c => +c.comments || 0,              f: c => fmtN(c.comments) },
    shares:      { label: 'Shares',      tip: 'จำนวนครั้งที่ถูกแชร์ต่อ',
                   v: c => +c.shares || 0,                f: c => fmtN(c.shares) },
    eng_rate:    { label: 'ER%',         tip: 'Engagement Rate = (ไลก์ + คอมเมนต์ + แชร์) ÷ วิว — ค่าเฉลี่ยวงการความงามอยู่ที่ 1.01%',
                   v: c => engOf(c),                      f: c => pct(engOf(c), 2) },
    like_rate:   { label: 'Like rate',   tip: 'ไลก์ ÷ วิว — คนดูแล้วชอบมากแค่ไหน',
                   v: c => rate(c.likes, c.video_views),  f: c => pct(rate(c.likes, c.video_views), 2) },
    cmt_rate:    { label: 'Comment rate',tip: 'คอมเมนต์ ÷ วิว — คลิปที่ชวนให้คนอยากพิมพ์ตอบ มักเป็นคลิปที่ตั้งคำถามหรือมีดราม่า',
                   v: c => rate(c.comments, c.video_views), f: c => pct(rate(c.comments, c.video_views), 2) },
    shr_rate:    { label: 'Share rate',  tip: 'แชร์ ÷ วิว — ตัวชี้วัดที่ดีที่สุดว่าคอนเทนต์มีคุณค่าจริง เพราะคนยอมส่งต่อให้เพื่อน',
                   v: c => rate(c.shares, c.video_views), f: c => pct(rate(c.shares, c.video_views), 2) },
    watched:     { label: 'Watched full',tip: '% ของคนที่ดูคลิปจนจบ — คลิปสั้นจะได้ค่าสูงกว่าคลิปยาวโดยธรรมชาติ',
                   v: c => +c.full_video_watched_rate || 0, f: c => pct(c.full_video_watched_rate, 1) },
    avg_time:    { label: 'Avg watch (s)',tip: 'เวลาที่คนดูเฉลี่ยกี่วินาทีก่อนเลื่อนผ่าน — ยิ่งสูงยิ่งดี แปลว่าท่อนเปิดดึงคนอยู่',
                   v: c => +c.average_time_watched || 0,  f: c => fmtN(c.average_time_watched, 1) },
    total_time:  { label: 'Watch time (h)',tip: 'เวลาที่คนดูคลิปนี้รวมกันทั้งหมด คิดเป็นชั่วโมง',
                   v: c => (+c.total_time_watched || 0) / 3600, f: c => fmtN((+c.total_time_watched || 0) / 3600, 1) },
    src_foryou:  { label: 'For You',     tip: 'ยอดวิว % ที่มาจากหน้าฟีด — สูง = อัลกอริทึมดันให้คนใหม่เห็น',
                   v: c => +c.src_foryou || 0,            f: c => pct(c.src_foryou, 1) },
    src_search:  { label: 'Search',      tip: 'ยอดวิว % ที่มาจากคนกดค้นหา — สูง = คนตั้งใจหา Brand หรือสินค้าเรา',
                   v: c => +c.src_search || 0,            f: c => pct(c.src_search, 1) },
    src_follow:  { label: 'Followers',   tip: 'ยอดวิว % ที่มาจากคนที่ติดตามอยู่แล้ว — สูงแต่ For You ต่ำ = ไม่กระจายออกนอกกลุ่มเดิม',
                   v: c => +c.src_follow || 0,            f: c => pct(c.src_follow, 1) },
    src_profile: { label: 'Profile',     tip: 'ยอดวิว % ที่มาจากคนเข้ามาดูในโปรไฟล์เรา',
                   v: c => +c.src_profile || 0,           f: c => pct(c.src_profile, 1) },
    src_sound:   { label: 'Sound',       tip: 'ยอดวิว % ที่มาจากคนกดดูผ่านหน้าเสียง/เพลงที่ใช้ในคลิป',
                   v: c => srcOf(c, 'Sound'),             f: c => pct(srcOf(c, 'Sound'), 1) },
    src_dm:      { label: 'DM',          tip: 'ยอดวิว % ที่มาจากคนส่งคลิปให้กันทางข้อความ',
                   v: c => srcOf(c, 'Direct Message'),    f: c => pct(srcOf(c, 'Direct Message'), 1) },
    src_others:  { label: 'Others',      tip: 'ยอดวิว % จากช่องทางอื่นที่ TikTok ไม่ได้แยกไว้',
                   v: c => srcOf(c, 'Others'),            f: c => pct(srcOf(c, 'Others'), 1) },
  };
  const DEFAULT_COLS = ['post_date', 'video_views', 'likes', 'comments', 'shares', 'eng_rate', 'watched', 'avg_time', 'src_foryou', 'src_search'];
  const LS = 'ttc_cols_v1';
  let cols = (() => { try { const x = JSON.parse(localStorage.getItem(LS)); return Array.isArray(x) && x.length ? x.filter(k => M[k]) : [...DEFAULT_COLS]; } catch { return [...DEFAULT_COLS]; } })();
  const saveCols = () => { try { localStorage.setItem(LS, JSON.stringify(cols)); } catch {} };

  const rate = (a, b) => (+b ? (+a || 0) / +b : null);
  const engOf = c => rate((+c.likes || 0) + (+c.comments || 0) + (+c.shares || 0), c.video_views);
  const srcOf = (c, name) => { const x = (c.impression_sources || []).find(s2 => s2.impression_source === name); return x ? +x.percentage : null; };
  const viewsPerDay = c => { if (!c.post_date) return 0; const d2 = Math.max(1, Math.round((Date.now() - new Date(c.post_date + 'T00:00:00').getTime()) / 86400000)); return Math.round((+c.video_views || 0) / d2); };

  const root = () => document.getElementById('page-ttcontent');

  // อ่านช่วงวันที่จากตัวกรองด้านบนของแดชบอร์ด แล้วแปลงเป็น "ย้อนหลังกี่วัน"
  function daysFromFilter() {
    const from = document.getElementById('dateFrom')?.value;
    if (!from) return 30;
    const n = Math.ceil((Date.now() - new Date(from + 'T00:00:00').getTime()) / 86400000);
    return Math.max(1, Math.min(400, n));
  }
  function filterLabel() {
    const from = document.getElementById('dateFrom')?.value, to = document.getElementById('dateTo')?.value;
    return (from && to) ? `${dTH(from)} – ${dTH(to)}` : `${days} วันล่าสุด`;
  }

  // คอมเมนต์ที่เป็น "คำถาม" จริง ๆ (ที่เหลือคือชมเฉย ๆ / อีโมจิ)
  const QWORDS = ['ไหม', 'มั้ย', 'หรือ', 'ยังไง', 'เท่าไร', 'เท่าไหร่', 'กี่', 'ที่ไหน', 'อะไร', 'เมื่อไร', 'เมื่อไหร่', 'ราคา', 'ส่ง', 'สั่ง', 'ซื้อ', 'มีขาย', 'สอบถาม', '?'];
  const isQuestion = t => { const x = String(t || ''); return QWORDS.some(w => x.includes(w)); };

  async function load() {
    if (!root()) return;
    root().innerHTML = '<div class="card"><div class="empty">กำลังโหลดข้อมูลคอนเทนต์...</div></div>';
    days = daysFromFilter();
    try {
      const fresh = loadFreshness();
      DATA = await supaRpc('tiktok_content_page', { p_days: Number(days) });
      await fresh;
      if (Array.isArray(DATA)) DATA = DATA[0] ?? {};                 // เผื่อ PostgREST ห่อมาเป็น array
      if (DATA && DATA.tiktok_content_page) DATA = DATA.tiktok_content_page;  // เผื่อห่อด้วยชื่อฟังก์ชัน
      window._ttcRaw = DATA;
      await fillMissingCovers();
    } catch (e) {
      root().innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)} — ถ้าขึ้น "function not found" แปลว่ายังไม่ได้รัน 66_tiktok_comments_benchmark.sql</div>`;
      return;
    }
    render();
  }

  // คลิปที่ยังไม่มีรูป (ลิงก์รูปจาก API หมดอายุก่อนรอบ sync ใหม่) → หยิบรูปสำรองจากตาราง tiktok_ad_covers (เชื่อมด้วยเลขคลิป)
  async function fillMissingCovers() {
    try {
      const vids = (DATA && DATA.videos) || [];
      const idOf = v => String(v.item_id || v.video_id || (String(v.share_url || '').match(/video\/(\d+)/) || [])[1] || '');
      const missing = vids.filter(v => !v.thumbnail_url && idOf(v));
      if (!missing.length) return;
      const h = { apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + authJwt() };
      const map = {};
      for (let i = 0; i < missing.length; i += 150) {
        const ids = missing.slice(i, i + 150).map(idOf).join(',');
        const rows = await fetch(`${window.SUPABASE_URL}/rest/v1/tiktok_ad_covers?select=item_id,cover_url&found=eq.true&item_id=in.(${ids})`, { headers: h }).then(r => r.json());
        (Array.isArray(rows) ? rows : []).forEach(r => { if (r.cover_url) map[r.item_id] = r.cover_url; });
      }
      missing.forEach(v => { const c = map[idOf(v)]; if (c) v.thumbnail_url = c; });
    } catch {}
  }

  function render() {
    const d = DATA || {}, p = d.profile || {}, t = d.totals || {}, b = d.benchmark || {};
    const daily = d.daily || [], vids = d.videos || [];
    const lastDay = daily.length ? daily[daily.length - 1].stat_date : null;
    const lag = lastDay ? Math.round((Date.now() - new Date(lastDay + 'T00:00:00').getTime()) / 86400000) : null;

    // ---- ตัวเลขช่วงนี้ ----
    const newFollow = daily.reduce((s, x) => s + (+x.daily_new_followers || 0), 0);
    // (2026-11-03) โตสุทธิ = ยอดผู้ติดตามรวมวันสุดท้าย − วันแรกของช่วง (ตัวเลขติดตามใหม่ / เลิกตามรายวัน TikTok ส่งมาแค่บางวัน)
    const fc = daily.map(x => +x.followers_count || 0).filter(Boolean), netFollow = fc.length > 1 ? fc[fc.length - 1] - fc[0] : null;
    const lostFollow = daily.reduce((s, x) => s + (+x.daily_lost_followers || 0), 0);
    const profileViews = daily.reduce((s, x) => s + (+x.profile_views || 0), 0);
    const bioClicks = daily.reduce((s, x) => s + (+x.bio_link_clicks || 0), 0);
    const engRate = t.views ? ((+t.likes + +t.comments + +t.shares) / +t.views) : null;

    const kpis = [
      ['ผู้ติดตามตอนนี้', fmtN(p.followers_count), netFollow != null ? `${netFollow >= 0 ? '+' : '−'}${fmtN(Math.abs(netFollow))} ใน ${fc.length} วัน (สุทธิ)` : ''],
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
      cmp.push(['ผู้ติดตามโต/วัน', netFollow != null && fc.length > 1 ? netFollow / (fc.length - 1) : avgFollowDay, b.average_follower_growth, v => fmtN(v, 1) + ' คน']);
      cmp.push(['จำนวนคลิปทั้งช่อง', p.videos_count, b.average_video_count, v => fmtN(v) + ' คลิป']);
      cmp.push(['ผู้ติดตาม', p.followers_count, b.average_follower_count, v => fmtN(v) + ' คน']);
    }

    root().innerHTML = `
      <div id="ttcDebug" style="display:none;"></div>
      ${freshnessNote()}
      <section class="ui-metrics sa-hero" aria-label="ตัวเลขหลัก" style="grid-template-columns:repeat(6, minmax(0, 1fr)) !important;">
        ${kpis.map(([l, v, s]) => `<div class="ui-metric is-static"><span class="ui-metric-l">${l}</span><span class="ui-metric-v" data-fit>${v}</span><span class="sa-md"><span>${s || '&nbsp;'}</span></span></div>`).join('')}
      </section>

      <div class="ttc-grid2">
        <div class="card">
          <div class="section-header"><div class="section-title">ยอดวิวมาจากไหน <span class="pr-i" data-tip="ฟีดเยอะ = อัลกอริทึมดัน ได้คนใหม่ · ค้นหาเยอะ = คนตั้งใจหา Brand เรา · ผู้ติดตามเยอะแต่ฟีดน้อย = ไม่กระจายออกนอกกลุ่มเดิม" style="font-size:11px;color:var(--text3);font-weight:400;cursor:default;">ⓘ</span></div><span style="font-size:10.5px;color:var(--text3);">เฉลี่ยทุกคลิปในช่วงนี้</span></div>
          ${[['หน้าฟีด (For You)', t.foryou, 'var(--accent)'], ['ค้นหา', t.search, '#60a5fa'], ['ผู้ติดตาม', t.follow, '#4ade80'], ['โปรไฟล์', t.profile, '#c084fc']]
            .map(([l, v, c]) => `<div class="ttc-src"><span>${l}</span><div class="ttc-srcbar"><i style="width:${Math.min(100, (v || 0) * 100)}%;background:${c};"></i></div><b>${pct(v, 1)}</b></div>`).join('')}
        </div>
        <div class="card">
          <div class="section-header"><div class="section-title">เทียบกับวงการความงาม</div><span style="font-size:10.5px;color:var(--text3);">ค่าเฉลี่ยช่องหมวดเดียวกันในไทย</span></div>
          ${cmp.length ? cmp.map(([l, mine, avg, f]) => {
            const good = mine != null && avg != null && mine >= avg;
            return `<div class="ttc-cmp"><span>${l}</span><span class="ui-chip ${mine == null || avg == null ? '' : good ? 'up' : 'dn'}">${f(mine)}</span><span class="ttc-cmp-avg">เฉลี่ย ${f(avg)}</span></div>`;   // (2026-11-03) ป้ายเขียว = ดีกว่าค่าเฉลี่ย · แดง = ต่ำกว่า
          }).join('') : '<div class="empty" style="padding:20px;">ยังไม่มีข้อมูลเทียบ</div>'}
        </div>
      </div>

      <div class="card" style="margin-bottom:16px;">
        <div class="section-header"><div class="section-title">คนเข้ามาที่ช่องเท่าไร</div><span style="font-size:10.5px;color:var(--text3);">เห็นคลิป → กดเข้าช่อง → กดลิงก์ไปซื้อ</span></div>
        <div class="ttc-funnel">${(() => { const v = +t.views || 0, pv = profileViews, bc = bioClicks, st = (l, n, r) => `<div><span>${l}</span><b>${fmtN(n)}</b>${r != null ? `<em>${r}</em>` : ''}</div>`;
          return st('ยอดวิวคลิป', v) + '<i>→</i>' + st('เข้าดูโปรไฟล์', pv, v ? (pv / v * 100).toFixed(2) + '% ของยอดวิว' : null) + '<i>→</i>' + st('กดลิงก์ในไบโอ', bc, pv ? (bc / pv * 100).toFixed(2) + '% ของคนเข้าโปรไฟล์' : null); })()}</div>
        <div class="chart-wrap" style="height:230px;"><canvas id="ttcTraffic"></canvas></div>
        <div class="ttc-legend" id="lgTraffic"></div>
      </div>

      <div class="ttc-grid2">
        <div class="card">
          <div class="section-header"><div class="section-title">คนมีส่วนร่วมแค่ไหน <span class="pr-i" data-tip="Engagement rate = (ไลก์ + คอมเมนต์ + แชร์) ÷ ยอดวิว ของแต่ละวัน · เขียว = ถึงค่าเฉลี่ยช่องหมวดความงามในไทย · แดง = ต่ำกว่า · ชี้ที่แท่งเพื่อดูจำนวนไลก์ / คอมเมนต์ / แชร์" style="font-size:11px;color:var(--text3);font-weight:400;cursor:default;">ⓘ</span></div><span style="font-size:10.5px;color:var(--text3);">Engagement rate รายวัน เทียบวงการ</span></div>
          <div class="chart-wrap" style="height:210px;"><canvas id="ttcEngage"></canvas></div>
          <div class="ttc-legend" id="lgEngage"></div>
        </div>
        <div class="card">
          <div class="section-header"><div class="section-title">ผู้ติดตาม <span class="pr-i" data-tip="แท่ง = ยอดผู้ติดตามรวมเปลี่ยนจากวันก่อนเท่าไร (ได้มา − เสียไป) · บางวัน TikTok ไม่ส่งตัวเลขคนติดตามใหม่มา (ขึ้นเป็น 0) ทั้งที่ยอดรวมขยับ — เป็นข้อจำกัดฝั่ง TikTok ไม่ใช่ข้อมูลหาย" style="font-size:11px;color:var(--text3);font-weight:400;cursor:default;">ⓘ</span></div><span style="font-size:10.5px;color:var(--text3);">โตสุทธิต่อวัน</span></div>
          <div class="chart-wrap" style="height:210px;"><canvas id="ttcFollow"></canvas></div>
          <div class="ttc-legend" id="lgFollow"></div>
        </div>
      </div>

      <div class="tabs-row">
        ${[['clips', `คลิป (${fmtN(vids.length)})`], ['comments', `คอมเมนต์ค้างตอบ (${fmtN(d.unanswered_count)})`]]
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
        #page-ttcontent .ttc-funnel { display:flex; align-items:stretch; gap:10px; margin:2px 0 12px; flex-wrap:wrap; }
        #page-ttcontent .ttc-funnel > div { flex:1; min-width:150px; padding:10px 12px; border-radius:10px; background:var(--bg3); display:flex; flex-direction:column; gap:2px; }
        #page-ttcontent .ttc-funnel span { font-size:12px; color:var(--text3); } #page-ttcontent .ttc-funnel b { font-size:20px; color:var(--text); font-variant-numeric:tabular-nums; } #page-ttcontent .ttc-funnel em { font-style:normal; font-size:12px; color:var(--text2); }
        #page-ttcontent .ttc-funnel > i { align-self:center; font-style:normal; color:var(--text3); }
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
        #page-ttcontent .ttc-legend { display:flex; gap:16px; flex-wrap:wrap; font-size:10.5px; color:var(--text3); margin-top:9px; }
        #page-ttcontent .ttc-legend span { display:inline-flex; align-items:center; gap:6px; }
        #page-ttcontent .ttc-legend i { display:inline-block; width:11px; height:11px; border-radius:2px; }
        #page-ttcontent .ttc-hint { background:var(--bg3); border:1px solid var(--border); border-left:3px solid var(--accent);
          border-radius:8px; padding:11px 14px; font-size:11.5px; line-height:1.75; color:var(--text2); margin-bottom:14px; }
        #page-ttcontent .ttc-mpanel { background:var(--bg3); border:1px solid var(--border); border-radius:10px; padding:14px 16px; margin-bottom:14px; }
        #page-ttcontent .ttc-mtitle { font-size:11.5px; font-weight:600; color:var(--text2); margin-bottom:8px; }
        #page-ttcontent .ttc-mlist { display:flex; flex-wrap:wrap; gap:7px; }
        #page-ttcontent .ttc-mchip { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; padding:6px 11px; border-radius:7px;
          background:var(--bg2); border:1px solid var(--border); color:var(--text2); cursor:pointer; user-select:none; }
        #page-ttcontent .ttc-mchip.on { background:rgba(200,169,110,.14); border-color:rgba(200,169,110,.45); color:var(--text); cursor:grab; }
        #page-ttcontent .ttc-drag { color:var(--text3); font-size:12px; cursor:grab; }
        #page-ttcontent .ttc-x { color:var(--text3); font-size:10px; padding:0 2px; }
        #page-ttcontent .ttc-x:hover { color:var(--red); }
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
    drawCharts(daily);
    renderTab();


    root().querySelectorAll('[data-tab]').forEach(b2 => b2.onclick = () => { tab = b2.dataset.tab; render(); });
  }

  let charts = {};
  function mkLegend(id, items) {
    const el = document.getElementById(id); if (!el) return;
    el.innerHTML = items.map(([c, l, dash]) => `<span><i style="${dash ? `border-top:2px dashed ${c};height:0;width:14px;` : `background:${c};`}"></i>${l}</span>`).join('');
  }
  function drawCharts(daily) {
    const labels = daily.map(x => x.stat_date);
    const tick = chartTickColor(), grid = chartGridColor();
    const xAxis = { grid: { display: false }, ticks: { color: tick, font: { family: 'Sarabun', size: 9 }, maxTicksLimit: 10, callback: (v, i) => dTH(labels[i]) } };
    const yA = { beginAtZero: true, grid: { color: grid }, ticks: { color: tick, font: { family: 'Sarabun', size: 9 }, callback: v => v >= 1000 ? (v / 1000) + 'k' : v } };
    const common = { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { titleFont: { family: 'Sarabun' }, bodyFont: { family: 'Sarabun' },
        callbacks: { title: it => dTH(labels[it[0].dataIndex]), label: it => `${it.dataset.label}: ${fmtN(it.raw)}` } } } };

    // 1) คนเข้ามาที่ช่อง
    Object.values(charts).forEach(c => { try { c.destroy(); } catch {} });
    charts = {};
    const el1 = document.getElementById('ttcTraffic');
    if (el1) {
      charts.traffic = new Chart(el1, {
        type: 'line',
        data: { labels, datasets: [
          { label: 'ยอดวิว', data: daily.map(x => +x.video_views || 0), borderColor: '#c8a96e', backgroundColor: 'rgba(200,169,110,.12)', fill: true, borderWidth: 2, pointRadius: 0, tension: .25, yAxisID: 'y' },
          { label: 'คนเข้าดูโปรไฟล์', data: daily.map(x => +x.profile_views || 0), borderColor: '#60a5fa', borderWidth: 2, pointRadius: 0, tension: .25, yAxisID: 'y2' },
          { label: 'กดลิงก์ในไบโอ', data: daily.map(x => +x.bio_link_clicks || 0), borderColor: '#4ade80', borderWidth: 2, pointRadius: 2, tension: .25, yAxisID: 'y2' },
        ] },
        options: Object.assign({}, common, { scales: { x: xAxis,
          y: Object.assign({}, yA, { position: 'left', title: { display: true, text: 'ยอดวิว', color: tick, font: { family: 'Sarabun', size: 9 } } }),
          y2: Object.assign({}, yA, { position: 'right', grid: { display: false }, title: { display: true, text: 'คนเข้าช่อง / กดลิงก์', color: tick, font: { family: 'Sarabun', size: 9 } } }) } })
      });
      mkLegend('lgTraffic', [['#c8a96e', 'ยอดวิว (แกนซ้าย)'], ['#60a5fa', 'คนเข้าดูโปรไฟล์ (แกนขวา)'], ['#4ade80', 'กดลิงก์ในไบโอ (แกนขวา)']]);
    }

    // 2) การมีส่วนร่วม
    const el2 = document.getElementById('ttcEngage');
    if (el2) {
      // (2026-11-03) Engagement rate รายวัน เทียบค่าเฉลี่ยวงการ (เดิมแท่งซ้อน ไลก์บังคอมเมนต์ / แชร์ จนมองไม่เห็น และยอดดิบขึ้นลงตามยอดวิวอยู่แล้ว)
      const er = daily.map(x => +x.video_views ? ((+x.likes || 0) + (+x.comments || 0) + (+x.shares || 0)) / +x.video_views * 100 : null);
      const bmo = (DATA && DATA.benchmark) || {}, bm = bmo.average_engagement_rate != null ? +bmo.average_engagement_rate * 100 : null;
      const dsE = [{ type: 'bar', label: 'Engagement rate', data: er, backgroundColor: er.map(v => bm == null || v == null ? 'rgba(200,169,110,.8)' : v >= bm ? 'rgba(74,222,128,.8)' : 'rgba(248,113,113,.75)'), borderRadius: 3 }];
      if (bm != null) dsE.push({ type: 'line', label: 'ค่าเฉลี่ยวงการ', data: daily.map(() => bm), borderColor: tick, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0 });
      charts.engage = new Chart(el2, {
        type: 'bar', data: { labels, datasets: dsE },
        options: Object.assign({}, common, { plugins: Object.assign({}, common.plugins || {}, { legend: { display: false }, tooltip: { filter: c => c.dataset.type === 'bar', callbacks: {
            label: c => `Engagement rate ${c.parsed.y != null ? c.parsed.y.toFixed(2) + '%' : '—'}`,
            footer: it => { const x = daily[it[0].dataIndex] || {}; return `ไลก์ ${fmtN(x.likes)} · คอมเมนต์ ${fmtN(x.comments)} · แชร์ ${fmtN(x.shares)} · วิว ${fmtN(x.video_views)}`; } } } }),
          scales: { x: xAxis, y: Object.assign({}, yA, { ticks: Object.assign({}, yA.ticks, { callback: v => v + '%' }) }) } })
      });
      mkLegend('lgEngage', bm != null ? [['#4ade80', 'ถึงค่าเฉลี่ยวงการ'], ['#f87171', 'ต่ำกว่าค่าเฉลี่ย'], [tick, 'ค่าเฉลี่ยวงการ ' + bm.toFixed(2) + '%']] : [['#c8a96e', 'Engagement rate']]);
    }

    // 3) ผู้ติดตาม
    const el3 = document.getElementById('ttcFollow');
    if (el3) {
      charts.follow = new Chart(el3, {
        type: 'bar',
        data: { labels, datasets: [
          { label: 'โตสุทธิต่อวัน', data: daily.map((x, i) => i && +x.followers_count && +daily[i - 1].followers_count ? +x.followers_count - +daily[i - 1].followers_count : null), backgroundColor: daily.map((x, i) => i && +x.followers_count - +daily[i - 1].followers_count < 0 ? 'rgba(248,113,113,.75)' : 'rgba(74,222,128,.8)'), yAxisID: 'y' },
          { type: 'line', label: 'ผู้ติดตามรวม', data: daily.map(x => +x.followers_count || null), borderColor: '#c8a96e', borderWidth: 2, pointRadius: 0, tension: .25, yAxisID: 'y2' },
        ] },
        options: Object.assign({}, common, {
          plugins: Object.assign({}, common.plugins, { tooltip: { titleFont: { family: 'Sarabun' }, bodyFont: { family: 'Sarabun' },
            callbacks: { title: it => dTH(labels[it[0].dataIndex]), label: it => `${it.dataset.label}: ${fmtN(Math.abs(it.raw))}` } } }),
          scales: { x: xAxis,
            y: { grid: { color: grid }, ticks: { color: tick, font: { family: 'Sarabun', size: 9 }, callback: v => fmtN(Math.abs(v)) } },
            y2: Object.assign({}, yA, { position: 'right', grid: { display: false }, beginAtZero: false }) } })
      });
      mkLegend('lgFollow', [['#4ade80', 'โตสุทธิต่อวัน (ลด = แดง)'], ['#c8a96e', 'ผู้ติดตามรวม (แกนขวา)']]);
    }
  }

  function renderTab() {
    const el = document.getElementById('ttcTab'); if (!el) return;
    if (tab === 'comments') return renderComments(el);
    return renderClips(el);
  }

  function renderClips(el) {
    const all = (DATA.videos || []).filter(v => !q || String(v.caption || '').toLowerCase().includes(q.toLowerCase()));
    const sk = M[sortKey] ? sortKey : 'post_date';
    const rows = [...all].sort((x, y) => {
      const a2 = M[sk].v(x), b2 = M[sk].v(y);
      if (typeof a2 === 'number' && typeof b2 === 'number') return (a2 - b2) * sortDir;
      return String(a2).localeCompare(String(b2)) * sortDir;
    });
    el.innerHTML = `
      <div class="card">
        <div class="section-header">
          <div class="section-title">คลิปทั้งหมดในช่วงนี้</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <input type="text" class="ls-input" id="ttcQ" placeholder="🔎 ค้นหาจากแคปชั่น" value="${esc(q)}" style="width:220px;padding:6px 10px;font-size:12px;">
            <div style="position:relative;">
              <button class="btn btn-ghost" id="ttcMetricBtn">⚙ Metrics <span style="color:var(--accent);">${cols.length}</span></button>
              <div id="ttcMetricPanel" class="metrics-panel" style="display:none;"></div>
            </div>
          </div>
        </div>
        <div class="table-wrap" style="max-height:1000px;overflow:auto;">
          <table data-no-sort><thead><tr><th class="t-left">คลิป</th>${cols.map(k => `<th data-k="${k}" style="cursor:pointer;" title="${esc(M[k].tip)}">${M[k].label}${sortKey === k ? `<span class="sort-arrow">${sortDir < 0 ? '▼' : '▲'}</span>` : ''}</th>`).join('')}</tr></thead>
          <tbody>${rows.length ? rows.map(v => `
            <tr>
              <td class="t-left">
                <div style="display:flex;gap:10px;align-items:flex-start;">
                  <a href="${esc(v.share_url || '#')}" target="_blank" rel="noopener"><img class="ttc-thumb" src="${esc(v.thumbnail_url || '')}" loading="lazy" onerror="this.style.visibility='hidden'"></a>
                  <div><div class="ttc-cap">${esc(v.caption || '(ไม่มีแคปชั่น)')}</div>
                  <div class="ttc-sub">${dTH(v.post_date)}</div></div>
                </div>
              </td>
              ${cols.map(k => `<td>${M[k].f(v)}</td>`).join('')}
            </tr>`).join('') : `<tr><td colspan="${cols.length + 1}" class="empty">ไม่มีคลิปในช่วงนี้</td></tr>`}
          </tbody></table>
        </div>
      </div>`;
    el.querySelector('#ttcQ').oninput = e => { q = e.target.value; renderTab(); };
    el.querySelectorAll('th[data-k]').forEach(th => th.onclick = () => {
      const k = th.dataset.k;
      if (sortKey === k) sortDir = -sortDir; else { sortKey = k; sortDir = -1; }
      renderTab();
    });
    el.querySelector('#ttcMetricBtn').onclick = e => {
      e.stopPropagation();
      const panel = el.querySelector('#ttcMetricPanel');
      if (panel.style.display === 'block') { panel.style.display = 'none'; return; }
      panel.style.display = 'block';
      renderMetricPanel(panel);
    };
    document.addEventListener('click', ev => {
      const panel = document.querySelector('#ttcMetricPanel');
      if (panel && panel.style.display === 'block' && !panel.contains(ev.target) && ev.target.id !== 'ttcMetricBtn') panel.style.display = 'none';
    });
  }

  // แผงเลือก Metrics — หน้าตาเดียวกับหน้าอื่นในแดชบอร์ด (ติ๊กเปิด/ปิด · ลาก ⠿ สลับลำดับ · ชี้ที่ชื่อเพื่อดูคำอธิบาย)
  function renderMetricPanel(panel) {
    const order = [...cols, ...Object.keys(M).filter(k => !cols.includes(k))];
    panel.innerHTML = `
      <div style="font-size:9.5px;color:var(--text3);margin-bottom:8px;font-family:'IBM Plex Mono',monospace;">ลาก ⠿ เพื่อสลับลำดับ · ติ๊กเพื่อเปิด/ปิด · ชี้ที่ชื่อเพื่อดูคำอธิบาย</div>
      <div id="ttcMetricRows">
        ${order.map(k => {
          const on = cols.includes(k);
          return `<div class="metrics-dragrow" data-k="${k}" ${on ? 'draggable="true"' : ''} title="${esc(M[k].tip)}">
            <span class="drag-handle" style="${on ? '' : 'opacity:.25;'}">⠿</span>
            <input type="checkbox" ${on ? 'checked' : ''} data-chk="${k}" style="accent-color:var(--accent);cursor:pointer;">
            <span style="font-size:11.5px;color:${on ? 'var(--text)' : 'var(--text3)'};flex:1;">${M[k].label}</span>
          </div>`;
        }).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;padding-top:10px;border-top:1px solid var(--border);">
        <button class="btn btn-ghost" style="flex:1;justify-content:center;" id="ttcMreset">ค่าแนะนำ</button>
        <button class="btn btn-ghost" style="flex:1;justify-content:center;" id="ttcMall">เลือกทั้งหมด</button>
      </div>`;

    panel.querySelectorAll('[data-chk]').forEach(cb => cb.onchange = () => {
      const k = cb.dataset.chk;
      if (cb.checked) { if (!cols.includes(k)) cols.push(k); }
      else { if (cols.length <= 1) { cb.checked = true; return; } cols = cols.filter(x => x !== k); }
      saveCols(); renderTab(); openPanel();
    });
    panel.querySelector('#ttcMreset').onclick = () => { cols = [...DEFAULT_COLS]; saveCols(); renderTab(); openPanel(); };
    panel.querySelector('#ttcMall').onclick = () => { cols = Object.keys(M); saveCols(); renderTab(); openPanel(); };

    let dragK = null;
    panel.querySelectorAll('.metrics-dragrow[draggable="true"]').forEach(row => {
      row.ondragstart = e => { dragK = row.dataset.k; e.dataTransfer.effectAllowed = 'move'; };
      row.ondragover = e => { e.preventDefault(); row.classList.add('drag-over'); };
      row.ondragleave = () => row.classList.remove('drag-over');
      row.ondrop = e => {
        e.preventDefault(); row.classList.remove('drag-over');
        const to = row.dataset.k;
        if (!dragK || dragK === to || !cols.includes(to)) return;
        cols.splice(cols.indexOf(dragK), 1);
        cols.splice(cols.indexOf(to), 0, dragK);
        saveCols(); renderTab(); openPanel();
      };
    });
  }

  function openPanel() {
    const panel = document.querySelector('#ttcMetricPanel');
    if (panel) { panel.style.display = 'block'; renderMetricPanel(panel); }
  }

  function renderComments(el) {
    let list = DATA.unanswered || [];
    if (onlyQuestions) list = list.filter(c => isQuestion(c.text));
    el.innerHTML = `
      <div class="card">
        <div class="section-header">
          <div class="section-title">คอมเมนต์ที่ยังไม่มีใครตอบ</div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <label class="chip-toggle ${onlyQuestions ? 'on' : ''}" style="cursor:pointer;font-size:11.5px;"><input type="checkbox" id="ttcOnlyQ" ${onlyQuestions ? 'checked' : ''} style="margin-right:6px;">เฉพาะที่เป็นคำถาม</label>
            <button class="btn btn-primary" id="ttcPull">↻ ดึงคอมเมนต์ล่าสุด</button>
          </div>
        </div>

        <div class="ttc-hint">
          <b>ตัวเลขนี้เป็นข้อมูล ณ เวลาที่ระบบดึงมาล่าสุด (วันละ 2 รอบ 07:30 และ 19:30)</b> ไม่ได้ถามสดจาก TikTok ตลอดเวลา<br>
          ถ้าเพิ่งเข้าไปตอบคอมเมนต์ในแอปมา ให้กดปุ่ม <b>↻ ดึงคอมเมนต์ล่าสุด</b> รายการที่ตอบไปแล้วจะหายออกจากตารางนี้
        </div>

        <div id="ttcPullMsg" style="display:none;margin-bottom:12px;"></div>

        <div style="font-size:11px;color:var(--text3);margin-bottom:10px;">ค้างตอบทั้งหมด ${fmtN(DATA.unanswered_count)} · แสดง ${fmtN(list.length)}</div>
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
    el.querySelector('#ttcPull').onclick = pullComments;
  }

  // ไปถาม TikTok สด ๆ แล้วโหลดหน้าใหม่
  async function pullComments() {
    const btn = document.getElementById('ttcPull');
    const msg = document.getElementById('ttcPullMsg') || (() => {
      const m = document.createElement('div'); m.id = 'ttcPullMsg'; root().prepend(m); return m;
    })();
    btn.disabled = true; const oldTxt = btn.textContent; btn.textContent = 'กำลังดึง...';
    msg.style.display = 'block';
    msg.innerHTML = '<div class="ttc-hint" style="border-color:rgba(200,169,110,.4);">กำลังไปถาม TikTok ว่ามีคอมเมนต์อะไรใหม่ และอันไหนตอบไปแล้วบ้าง — ใช้เวลาประมาณ 1-2 นาที อย่าเพิ่งปิดหน้านี้</div>';
    try {
      const r = await fetch(`${window.SUPABASE_URL}/functions/v1/tiktok-organic?mode=sync&days=30`);
      const j = await r.json();
      msg.innerHTML = `<div class="ttc-hint" style="border-color:rgba(74,222,128,.4);color:var(--green);">อัปเดตเรียบร้อย — ${esc(j.saved_comments || 'ดึงคอมเมนต์แล้ว')}</div>`;
      await load();
      render();
    } catch (e) {
      msg.innerHTML = `<div class="ttc-hint" style="border-color:rgba(248,113,113,.4);color:var(--red);">ดึงไม่สำเร็จ: ${esc(e.message)}<br><span style="font-size:11px;">ถ้าขึ้น Failed to fetch แปลว่ายังไม่ได้ deploy tiktok-organic ตัวใหม่ที่เปิดให้เบราว์เซอร์เรียกได้</span></div>`;
      btn.disabled = false; btn.textContent = oldTxt;
    }
  }

  window.renderTtContentPage = function () { if (DATA) render(); else load(); };
})();
