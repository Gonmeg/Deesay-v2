// fbadmin.js (v20261006b) — หน้า "พนักงานขาย" (Facebook / Line) · โหลดครั้งแรกที่กดเมนู
// ที่มา: RPC sales_admin_page(p_from, p_to) — ยอด/ออเดอร์จาก mv_fb_admin_daily ที่ refresh พร้อม mv_sales_daily → เท่ากับยอด Facebook ทุกหน้าเสมอ
//   ลูกค้า (เบอร์ไม่ซ้ำ) และสินค้าขายดี นับจากออเดอร์จริง · ค่าคอม: ยังไม่ตั้งสูตร
// (b) อันดับ · ชื่อย่อ · ออเดอร์ต่อวัน · ส่วนแบ่งในเพจหลัก · ซ่อนการเทียบช่วงก่อนเมื่อช่วงนั้นยังไม่มีชื่อพนักงานครบ (กันตัวเลขเพี้ยน)
(function () {
  const num = v => Number(v) || 0;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const baht = v => '฿' + fmt(Math.round(num(v)));
  const pct = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '—';
  const PALETTE = ['#2a78d6', '#f472b6', '#14b8a6', '#f59e0b', '#a78bfa', '#ef4444', '#22c55e', '#60a5fa', '#c8a96e', '#94a3b8'];
  const NONE = 'ไม่ระบุ', FULL = 0.95;   // ช่วงที่มีชื่อพนักงาน ≥ 95% ของยอด ถึงจะเทียบรายคนได้
  let _data = null, _key = null, _seq = 0, _sel = null;
  const short = n => n === NONE ? NONE : String(n).replace(/^Admin\s*-\s*/i, '');
  const colorOf = (name, order) => name === NONE ? '#94a3b8' : PALETTE[Math.max(0, order.indexOf(name)) % PALETTE.length];
  const pageShort = p => String(p || '').replace(/^\d+\.\s*/, '').replace(/^FB - [NM] - /, '');
  const thDate = d => new Date(d + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const thMonth = m => new Date(m + '-01T00:00:00').toLocaleDateString('th-TH', { month: 'short', year: '2-digit' });
  const dash = '<span style="color:var(--text3);">—</span>';
  const delta = (cur, prev, ok) => {
    if (!ok) return dash;
    if (!prev) return cur > 0 ? '<span style="color:var(--purple);font-weight:600;">ใหม่</span>' : dash;
    const p = (cur - prev) / prev * 100;
    return `<span style="color:${p >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:600;">${p >= 0 ? '▲' : '▼'} ${Math.abs(p).toFixed(0)}%</span>`;
  };
  const skel = '<span class="skeleton" style="display:inline-block;width:60%;height:22px;border-radius:4px;"></span>';

  function shell(el) {
    el.innerHTML = `
      <div id="fba-kpis" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;"></div>
      <div class="card" style="margin-bottom:16px;">
        <div class="section-header"><div class="section-title" id="fba-chart-title">ยอดขายต่อพนักงาน</div></div>
        <div class="chart-wrap" style="height:300px;"><canvas id="chartFbAdmin"></canvas></div>
      </div>
      <div class="card" style="margin-bottom:16px;">
        <div class="section-header"><div class="section-title">อันดับพนักงานขาย ${fbeInfoIcon('fba-info-tbl', '<b>ยอดขาย</b> = ยอดของออเดอร์ที่คนนี้เปิดบิล (ยอดรวมสินค้า − ส่วนลดท้ายบิล + ค่าส่ง) ชุดเดียวกับยอด Facebook ทุกหน้า · ไม่นับเคลม รีวิว MT ตัวแทน และชาฟ้าใส<br><b>เทียบช่วงก่อน</b> = ช่วงยาวเท่ากันก่อนหน้า · แสดงเมื่อทั้งสองช่วงมีชื่อพนักงานครบ (≥ 95% ของยอด) ไม่งั้นตัวเลขจะเพี้ยน<br><b>ยอดต่อออเดอร์</b> = ยอดขาย ÷ ออเดอร์ (AOV)<br><b>ออเดอร์ต่อวัน</b> = ออเดอร์ ÷ วันที่มีบิล — เทียบคนที่ทำงานไม่เท่ากันได้แฟร์กว่ายอดรวม<br><b>ส่วนแบ่งในเพจหลัก</b> = ยอดของคนนี้ในเพจที่ขายมากสุด ÷ ยอดทั้งเพจนั้น — เทียบกับคนที่ดูแลเพจเดียวกัน (เพจใหญ่ยอดย่อมสูงกว่า)<br><b>ลูกค้า</b> = เบอร์โทรไม่ซ้ำ<br><b>ไม่ระบุ</b> = ออเดอร์ที่ยังไม่มีชื่อพนักงานในระบบ')}<span style="font-size:11.5px;color:var(--text3);font-weight:400;margin-left:6px;">กดชื่อเพื่อดูรายละเอียด</span></div></div>
        <div class="table-wrap"><table><thead><tr><th>#</th><th>พนักงานขาย</th><th>ยอดขาย</th><th>เทียบช่วงก่อน</th><th>ออเดอร์</th><th>ยอดต่อออเดอร์</th><th>ออเดอร์ต่อวัน</th><th>ลูกค้า</th><th>สัดส่วน</th><th>ส่วนแบ่งในเพจหลัก</th></tr></thead>
          <tbody id="fba-body"><tr><td colspan="10" class="empty">กำลังโหลด...</td></tr></tbody></table></div>
      </div>
      <div class="card" id="fba-detail" style="display:none;margin-bottom:20px;"></div>`;
  }

  async function render() {
    const el = document.getElementById('page-fbadmin'); if (!el) return;
    const from = getDateValue('From'), to = getDateValue('To');
    if (!document.getElementById('fba-body')) shell(el);
    const key = from + '|' + to, seq = ++_seq;
    if (_key !== key) {
      document.getElementById('fba-kpis').innerHTML = [1, 2, 3, 4].map(() => `<div class="card" style="flex:1;min-width:150px;">${skel}</div>`).join('');
      try { _data = await supaRpc('sales_admin_page', { p_from: from, p_to: to }); _key = key; }
      catch (e) { if (seq === _seq) document.getElementById('fba-kpis').innerHTML = `<div class="error-banner" style="display:block;">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
      if (seq !== _seq) return;
    }
    draw(from, to);
  }

  function draw(from, to) {
    const D = _data || {}, admins = D.admins || [];
    const named = admins.filter(a => a.admin !== NONE);
    const order = named.map(a => a.admin);
    const tot = admins.reduce((t, a) => t + num(a.revenue), 0), totOrd = admins.reduce((t, a) => t + num(a.orders), 0);
    const totNamed = named.reduce((t, a) => t + num(a.revenue), 0), prevTot = admins.reduce((t, a) => t + num(a.prev_revenue), 0);
    const share = num(D.named_share), cmpOk = share >= FULL && num(D.prev_named_share) >= FULL;
    const cov = D.coverage || {};
    const top = named[0];
    document.getElementById('fba-kpis').innerHTML = `
      <div class="card" style="flex:1;min-width:150px;"><div class="card-title">ยอดขาย Facebook / Line</div><div class="kpi-value">${baht(tot)}</div><div class="kpi-sub">${fmt(totOrd)} ออเดอร์ · ${delta(tot, prevTot, true)} เทียบช่วงก่อน</div></div>
      <div class="card" style="flex:1;min-width:150px;"><div class="card-title">พนักงานขาย</div><div class="kpi-value">${fmt(named.length)} คน</div><div class="kpi-sub">เฉลี่ย ${baht(named.length ? totNamed / named.length : 0)} ต่อคน</div></div>
      <div class="card" style="flex:1;min-width:150px;"><div class="card-title">ระบุพนักงานได้ ${fbeInfoIcon('fba-info-cov', 'สัดส่วนยอดขายที่รู้ว่าใครเปิดบิล · ที่เหลือคือออเดอร์ที่ยังไม่มีชื่อพนักงาน (เดือนที่ยังไม่ได้เติมจากไฟล์ หรือไฟล์ที่อัปก่อนระบบเก็บช่องนี้)<br>ถ้าต่ำกว่า 95% ตัวเลขรายคนยังไม่ครบ และจะไม่แสดงการเทียบช่วงก่อนรายคน')}</div><div class="kpi-value" style="color:${share >= FULL ? 'var(--green)' : 'var(--orange)'};">${(share * 100).toFixed(1)}%</div><div class="kpi-sub">${cov.first_date ? 'มีชื่อพนักงาน ' + thDate(cov.first_date) + ' – ' + thDate(cov.last_date) : 'ยังไม่มีชื่อพนักงานในระบบ'}</div></div>
      <div class="card" style="flex:1;min-width:150px;"><div class="card-title">อันดับ 1</div><div class="kpi-value" style="font-size:20px;">${top ? esc(short(top.admin)) : '—'}</div><div class="kpi-sub">${top ? baht(top.revenue) + ' · ' + pct(num(top.revenue), tot) + ' ของยอด' : ''}</div></div>`;

    // ส่วนแบ่งในเพจหลัก
    const pages = D.pages || [], pageTot = {}; (D.page_totals || []).forEach(p => { pageTot[p.page] = num(p.revenue); });
    const mainOf = a => pages.filter(x => x.admin === a).sort((x, y) => num(y.revenue) - num(x.revenue))[0];
    let rank = 0;
    document.getElementById('fba-body').innerHTML = admins.length ? admins.map(a => {
      const isNone = a.admin === NONE, mp = mainOf(a.admin), r = isNone ? '' : ++rank;
      const perDay = num(a.active_days) ? num(a.orders) / num(a.active_days) : 0;
      return `<tr style="${_sel === a.admin ? 'background:var(--bg3);' : ''}${isNone ? 'color:var(--text3);' : ''}">
        <td style="font-weight:700;color:${r === 1 ? 'var(--accent)' : 'var(--text3)'};">${r}</td>
        <td>${isNone ? NONE : `<a href="javascript:void(0)" onclick="fbAdmin.select(${esc(JSON.stringify(a.admin))})" title="${esc(a.admin)}" style="color:inherit;font-weight:600;text-decoration:underline dotted;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colorOf(a.admin, order)};margin-right:6px;"></span>${esc(short(a.admin))}</a>`}</td>
        <td>${baht(a.revenue)}</td><td>${isNone ? dash : delta(num(a.revenue), num(a.prev_revenue), cmpOk)}</td><td>${fmt(a.orders)}</td>
        <td>${baht(num(a.orders) ? num(a.revenue) / num(a.orders) : 0)}</td><td>${perDay.toFixed(1)}</td><td>${fmt(a.customers)}</td><td>${pct(num(a.revenue), tot)}</td>
        <td style="font-size:11.5px;">${isNone || !mp ? dash : `${pct(num(mp.revenue), pageTot[mp.page])} <span style="color:var(--text3);">· ${esc(pageShort(mp.page))}</span>`}</td></tr>`;
    }).join('') : '<tr><td colspan="10" class="empty">ไม่มีออเดอร์ในช่วงนี้</td></tr>';

    // กราฟ: ช่วงไม่เกิน 1 เดือน = รายวัน · หลายเดือน = รายเดือน (กติกาเดียวกับทุกหน้า) · ไม่รวม "ไม่ระบุ"
    const monthly = (new Date(to) - new Date(from)) / 86400000 > 31;
    const bucket = d => monthly ? String(d).slice(0, 7) : String(d);
    const daily = D.daily || [];
    const labels = [...new Set(daily.map(r => bucket(r.date)))].sort();
    const show = _sel ? [_sel] : order.slice(0, 8);
    const datasets = show.map(name => {
      const m = {}; daily.filter(r => r.admin === name).forEach(r => { const k = bucket(r.date); m[k] = (m[k] || 0) + num(r.revenue); });
      const c = colorOf(name, order);
      return { label: short(name), data: labels.map(k => m[k] || 0), borderColor: c, backgroundColor: c + '22', fill: !!_sel };
    });
    document.getElementById('fba-chart-title').textContent = (_sel ? 'ยอดขายของ ' + short(_sel) : 'ยอดขายต่อพนักงาน') + (monthly ? ' (รายเดือน)' : ' (รายวัน)');
    makeChart('chartFbAdmin', 'line', labels.map(k => monthly ? thMonth(k) : thDate(k)), datasets, { options: { interaction: { mode: 'index', intersect: false } } });

    // รายละเอียดคนที่เลือก
    const det = document.getElementById('fba-detail');
    const a = _sel && admins.find(x => x.admin === _sel);
    if (!a) { _sel = null; det.style.display = 'none'; det.innerHTML = ''; return; }
    const myPages = pages.filter(x => x.admin === _sel).sort((x, y) => num(y.revenue) - num(x.revenue));
    const mySkus = (D.top_skus || []).filter(x => x.admin === _sel);
    const chip = (t, v) => `<div style="background:var(--bg3);border-radius:8px;padding:8px 12px;min-width:110px;"><div style="font-size:11px;color:var(--text3);">${t}</div><div style="font-weight:700;font-size:15px;">${v}</div></div>`;
    det.style.display = '';
    det.innerHTML = `<div class="section-header"><div class="section-title">${esc(short(_sel))} <span style="font-size:12px;color:var(--text3);font-weight:400;">${esc(_sel)}</span></div>
        <button class="btn btn-ghost" style="padding:4px 10px;font-size:12px;" onclick="fbAdmin.select(null)">✕ ดูทุกคน</button></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
        ${chip('อันดับ', '#' + (order.indexOf(_sel) + 1) + ' จาก ' + order.length)}${chip('ยอดขาย', baht(a.revenue))}${chip('ออเดอร์', fmt(a.orders))}
        ${chip('ยอดต่อออเดอร์', baht(num(a.orders) ? num(a.revenue) / num(a.orders) : 0))}${chip('ออเดอร์ต่อวัน', (num(a.active_days) ? num(a.orders) / num(a.active_days) : 0).toFixed(1))}${chip('ลูกค้า', fmt(a.customers))}
      </div>
      <div class="grid-2">
        <div><div style="font-weight:600;margin-bottom:6px;">ยอดตามเพจ / ช่องทาง</div><div class="table-wrap"><table><thead><tr><th>เพจ</th><th>ยอดขาย</th><th>ออเดอร์</th><th>ส่วนแบ่งในเพจ</th></tr></thead><tbody>
          ${myPages.map(p => `<tr><td style="font-size:12px;">${esc(pageShort(p.page))}</td><td>${baht(p.revenue)}</td><td>${fmt(p.orders)}</td><td>${pct(num(p.revenue), pageTot[p.page])}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">—</td></tr>'}
        </tbody></table></div></div>
        <div><div style="font-weight:600;margin-bottom:6px;">สินค้าขายดี 5 อันดับ ${fbeInfoIcon('fba-info-sku', 'ยอดต่อสินค้าแบ่งจากยอดออเดอร์ตามสัดส่วนราคาสินค้า (ชุดเดียวกับหน้าแนวโน้มสินค้า / เจาะสินค้า)')}</div><div class="table-wrap"><table><thead><tr><th>สินค้า</th><th>ชิ้น</th><th>ยอดขาย</th></tr></thead><tbody>
          ${mySkus.map(s => `<tr><td style="font-size:12px;">${esc(typeof skuToName === 'function' ? skuToName(s.sku) : s.sku)} <span style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--text3);">${esc(s.sku)}</span></td><td>${fmt(s.qty)}</td><td>${baht(s.revenue)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">—</td></tr>'}
        </tbody></table></div></div>
      </div>`;
  }

  function select(name) { _sel = name || null; draw(getDateValue('From'), getDateValue('To')); if (_sel) document.getElementById('fba-detail').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  window.fbAdmin = { select };
  window.renderFbAdminPage = render;
})();
