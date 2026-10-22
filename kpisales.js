// kpisales.js (v20261022a) — หน้า "เป้าหมาย KPI" › แท็บ "เป้ายอดขายรายช่องทาง" (ดูผลอย่างเดียว)
// การ์ดละ 1 แถว: % ทั้งปี + แถบ (ขีด = ควรถึงตรงนี้แล้ว) · กราฟ 12 เดือน (แท่ง = ทำได้ · เส้น = เป้าของเดือนที่รวมยอดยกมาแล้ว) · เดือนนี้ต้องทำอีกเท่าไร / วันละเท่าไร
//   TikTok = GMV ตาม TikTok (แอฟฟิลิเอต / ผู้ขาย ไลฟ์ / วิดีโอ / การ์ดสินค้า) · Facebook = ต่อเพจ · Shopee / Lazada = ต่อร้าน (ยอดขายจริง)
//   ตั้งเป้าที่หน้า Admin › ตั้งเป้ายอดขาย (ปุ่ม ⚙ ตั้งเป้า เห็นเฉพาะคนที่มีสิทธิ์) · ที่มา: RPC kpi_sales_targets(p_year, p_channel)
(function () {
  'use strict';
  const CHS = [['TikTok', '--ch-tiktok'], ['Facebook', '--ch-facebook'], ['Shopee', '--ch-shopee'], ['Lazada', '--ch-lazada']];
  const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n0 = v => v == null || isNaN(+v) ? '—' : Math.round(+v).toLocaleString('en-US');
  const short = v => { v = +v || 0; const a = Math.abs(v); return a >= 1e6 ? (v / 1e6).toFixed(2) + 'M' : a >= 1e3 ? Math.round(v / 1e3) + 'k' : String(Math.round(v)); };
  const tip = t => ` <span class="ui-i" data-tip="${esc(t)}">ⓘ</span>`;
  const rpc = (n, a) => (window.Auth && typeof Auth.rpc === 'function') ? Auth.rpc(n, a) : supaRpc(n, a, true);
  const thisYear = () => new Date(Date.now() + 7 * 3600000).getUTCFullYear();
  let S = { ch: 'TikTok', year: null, data: null, seq: 0, showNo: false };

  async function load() {
    const my = ++S.seq, box = $('kpPaneTt'); if (!box) return;
    if (!S.data) box.innerHTML = '<div class="card"><div class="empty">กำลังโหลด...</div></div>'; else box.style.opacity = '.6';
    try { const d = await rpc('kpi_sales_targets', { p_year: S.year, p_channel: S.ch }); if (my !== S.seq) return; S.data = d; box.style.opacity = ''; draw(); }
    catch (e) { box.style.opacity = ''; box.innerHTML = `<div class="error-banner" style="display:block;">โหลดเป้ายอดขายไม่สำเร็จ: ${esc(e.message || e)}</div>`; }
  }
  window.ksCh = c => { if (c === S.ch) return; S.ch = c; S.showNo = false; load(); };
  window.ksYear = y => { S.year = +y; load(); };
  window.ksNo = () => { S.showNo = !S.showNo; draw(); };

  const colr = (r, p) => r >= p ? 'var(--green, #16a34a)' : r >= p * 0.9 ? '#c9851a' : 'var(--red, #dc2626)';
  // รวมทุกแถว (ยกยอดคิดจากผลรวม)
  function totalOf(rows) {
    const m = Array.from({ length: 12 }, (_, i) => ({ plan: null, actual: null, started: false, days: 30, month: '' }));
    let annual = null;
    rows.forEach(r => { if (r.annual != null) annual = (annual || 0) + +r.annual;
      (r.months || []).forEach((x, i) => { const o = m[i]; o.month = x.month; o.days = x.days; o.started = x.started;
        if (x.plan != null) o.plan = (o.plan || 0) + +x.plan; if (x.actual != null) o.actual = (o.actual || 0) + +x.actual; }); });
    let cp = 0, ca = 0;
    m.forEach(o => { o.carry = o.started && o.plan != null ? cp - ca : null; o.eff = o.plan == null ? null : (o.started ? Math.max(0, o.plan + o.carry) : o.plan);
      cp += o.plan || 0; ca += o.actual || 0; });
    return { k: '__tot', label: 'รวม ' + S.ch, annual, ytd: rows.reduce((a, r) => a + (+r.ytd || 0), 0), months: m, total: true };
  }

  function card(r, latest) {
    const yr = S.data.year, ms = r.months || [];
    const lt = latest ? new Date(latest + 'T00:00:00') : null;
    const yDays = (Date.UTC(yr + 1, 0, 1) - Date.UTC(yr, 0, 1)) / 864e5;
    const yEl = lt && lt.getFullYear() === yr ? Math.round((Date.UTC(yr, lt.getMonth(), lt.getDate()) - Date.UTC(yr, 0, 1)) / 864e5) + 1 : (lt && lt.getFullYear() > yr ? yDays : 0);
    const yPace = yEl / yDays, ytd = +r.ytd || 0, ann = +r.annual || 0;
    const curI = lt && lt.getFullYear() === yr ? lt.getMonth() : -1, cur = curI >= 0 ? ms[curI] : null;
    const dEl = cur ? Math.min(lt.getDate(), cur.days) : 0, dLeft = cur ? cur.days - dEl : 0, mPace = cur ? dEl / cur.days : 1;
    // หัวการ์ด + % ทั้งปี
    const yr2 = ann ? ytd / ann : null;
    let h = `<div class="ks-card${r.total ? ' is-tot' : ''}"><div class="ks-h"><div class="ks-n" title="${esc(r.label)}">${esc(r.label)}</div><div class="ks-e">${ann ? `เป้าทั้งปี <b>${n0(ann)}</b>` : 'ยังไม่ได้ตั้งเป้า'}</div></div>`;
    h += ann ? `<div class="ks-p"><div class="ks-big" style="color:${colr(yr2, yPace)};">${Math.round(yr2 * 100)}%</div><div><div class="ks-bar"><div style="width:${Math.min(yr2, 1) * 100}%;background:${colr(yr2, yPace)};"></div><i style="left:${yPace * 100}%;"></i></div><div class="ks-t">ทำได้ ${n0(ytd)} · ควรถึง ${Math.round(yPace * 100)}% แล้ว</div></div></div>`
      : `<div class="ks-p"><div class="ks-big" style="font-size:20px;">${n0(ytd)}</div><div class="ks-t">ทำได้ทั้งปีถึงตอนนี้</div></div>`;
    // กราฟ 12 เดือน
    const mx = Math.max(1, ...ms.map(x => Math.max(+x.actual || 0, +x.eff || 0)));
    h += `<div class="ks-ch">${ms.map((x, i) => {
      const a = x.actual != null ? +x.actual : null, ef = x.eff != null ? +x.eff : null;
      const done = a != null && i !== curI && ef != null && a >= ef;
      const bg = i === curI ? 'var(--accent, #b8862f)' : done ? 'var(--green, #16a34a)' : 'var(--bg4, #cbd5e1)';
      const tl = ef != null ? `<i class="${a == null ? 'fut' : ''}" style="bottom:${ef / mx * 100}%;"></i>` : '';
      const tt = `${MS[i]} · ${ef != null ? 'เป้า ' + n0(ef) : 'ไม่มีเป้า'}${a != null ? ' · ทำได้ ' + n0(a) : ''}`;
      return `<div class="ks-b${i === curI ? ' cur' : ''}" data-tip="${esc(tt)}">${tl}<b style="height:${a != null ? a / mx * 100 : 0}%;background:${bg};"></b><span>${MS[i].replace('.', '').slice(0, 3)}</span></div>`; }).join('')}</div>`;
    // เดือนนี้
    if (cur && cur.eff != null) {
      const a = +cur.actual || 0, ef = +cur.eff, left = Math.max(0, ef - a), r2 = ef > 0 ? a / ef : 1;
      const carry = +cur.carry || 0;
      h += `<div class="ks-now"><div><span>เป้า ${MS[curI]}</span><b>${n0(ef)}</b><em>แผน ${short(cur.plan)} ${carry > 0 ? '+ ขาดยกมา ' + short(carry) : carry < 0 ? '− เกินยกมา ' + short(-carry) : ''}</em></div>
        <div><span>ทำได้</span><b>${n0(a)}</b><em style="color:${colr(r2, mPace)};">${Math.round(r2 * 100)}% ของเป้า</em></div>
        <div><span>ต้องทำอีก</span><b style="color:${left > 0 ? 'var(--red, #dc2626)' : 'var(--green, #16a34a)'};">${left > 0 ? n0(left) : 'ถึงเป้าแล้ว'}</b><em>${left > 0 && dLeft > 0 ? `วันละ ${n0(left / dLeft)} ใน ${dLeft} วัน` : left > 0 ? 'เดือนนี้หมดเวลาแล้ว' : `เกิน ${n0(a - ef)}`}</em></div></div>`;
    }
    return h + '</div>';
  }

  function draw() {
    const box = $('kpPaneTt'); if (!box || !S.data) return;
    const D = S.data, rows = D.rows || [], latest = D.latest, y = D.year;
    const withT = rows.filter(r => r.annual != null && +r.annual > 0), noT = rows.filter(r => !(r.annual != null && +r.annual > 0));
    const pills = CHS.map(([c, v]) => `<button type="button" class="ks-pill${c === S.ch ? ' on' : ''}" onclick="ksCh('${c}')"><i style="background:var(${v});"></i>${c}</button>`).join('');
    const yrs = [y - 1, y, y + 1].map(v => `<option value="${v}"${v === y ? ' selected' : ''}>ปี ${v + 543}</option>`).join('');
    const setBtn = D.can_edit ? `<a class="btn btn-ghost btn-sm" href="admin.html#targets?ch=${encodeURIComponent(S.ch)}&y=${y}" style="text-decoration:none;">⚙ ตั้งเป้า</a>` : '';
    const basis = D.basis === 'gmv' ? 'GMV ตาม TikTok (ตรงกับ Seller Center › ตามแหล่งที่มาของคำสั่งซื้อ)' : 'ยอดขายจริง หักยกเลิก / คืนแล้ว (ชุดเดียวกับการ์ดยอดขาย)';
    const lt = latest ? new Date(latest + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) : '';
    let h = `<div class="ks-top"><div class="ks-pills">${pills}</div><span class="ks-meta">ทำได้ถึง ${lt}${tip('ทำได้ = ' + basis + '\n% ทั้งปี: ขีดดำบนแถบ = ควรถึงตรงนี้แล้วตามจำนวนวัน · สี: เขียว ทัน · ส้ม ช้าไม่เกิน 10% · แดง ช้ามาก\nกราฟ: แท่ง = ทำได้รายเดือน (เขียว = ถึงเป้า · สีทอง = เดือนนี้) · เส้น = เป้าของเดือนนั้นที่รวมยอดยกมาแล้ว\nเป้าเดือน = แผน (เป้าทั้งปีแบ่งตามจำนวนวัน) + ยอดยกมา (ขาด = เพิ่ม · เกิน = ลด)')}</span>
      <span style="flex:1;"></span><select class="ks-yr" onchange="ksYear(this.value)">${yrs}</select>${setBtn}</div>`;
    if (!withT.length) h += `<div class="card"><div class="empty" style="padding:28px;">ยังไม่ได้ตั้งเป้า ${esc(S.ch)} ปี ${y + 543}${D.can_edit ? ' — กด ⚙ ตั้งเป้า มุมขวาบน' : ''}</div></div>`;
    else h += `<div class="ks-grid">${withT.length > 1 ? card(totalOf(withT), latest) : ''}${withT.map(r => card(r, latest)).join('')}</div>`;
    if (noT.length) h += `<div class="ks-no"><button type="button" class="ks-nob" onclick="ksNo()">${S.showNo ? '▾' : '▸'} ยังไม่ได้ตั้งเป้า ${noT.length} ${S.ch === 'Facebook' ? 'เพจ' : 'แถว'}</button>${S.showNo ? `<div class="ks-nol">${noT.map(r => `<div><span>${esc(r.label)}</span><b>${n0(r.ytd)}</b></div>`).join('')}</div>` : ''}</div>`;
    box.innerHTML = h;
  }

  window.renderKpiSales = () => { if (!S.year) S.year = thisYear(); load(); };

  if (!$('ksStyle')) {
    const st = document.createElement('style'); st.id = 'ksStyle'; st.textContent = `
.ks-top { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
.ks-pills { display:flex; gap:6px; flex-wrap:wrap; }
.ks-pill { border:1px solid var(--border); background:var(--bg2); border-radius:20px; padding:6px 14px; font-size:13px; color:var(--text2); cursor:pointer; font-family:inherit; display:inline-flex; align-items:center; gap:6px; }
.ks-pill i { width:8px; height:8px; border-radius:50%; display:inline-block; }
.ks-pill.on { background:var(--accent, #b8862f); border-color:var(--accent, #b8862f); color:#fff; font-weight:700; }
.ks-meta { font-size:11.5px; color:var(--text3); }
.ks-yr { border:1px solid var(--border); background:var(--bg2); color:var(--text); border-radius:9px; padding:6px 10px; font-family:inherit; font-size:13px; }
.ks-grid { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:14px; }
@media (max-width:1000px) { .ks-grid { grid-template-columns:1fr; } }
.ks-card { background:var(--bg2); border:1px solid var(--border); border-radius:14px; padding:16px 18px; }
.ks-card.is-tot { border-color:var(--accent, #b8862f); }
.ks-h { display:flex; justify-content:space-between; align-items:baseline; gap:10px; }
.ks-n { font-weight:700; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ks-e { font-size:12px; color:var(--text3); white-space:nowrap; } .ks-e b { color:var(--text); }
.ks-p { display:grid; grid-template-columns:auto 1fr; align-items:center; column-gap:14px; margin:10px 0 4px; }
.ks-big { font-size:28px; font-weight:800; font-variant-numeric:tabular-nums; }
.ks-bar { position:relative; height:8px; background:var(--bg3); border-radius:5px; } .ks-bar > div { height:8px; border-radius:5px; }
.ks-bar i { position:absolute; top:-4px; width:2px; height:16px; background:var(--text); }
.ks-t { font-size:11.5px; color:var(--text3); margin-top:5px; }
.ks-ch { display:grid; grid-template-columns:repeat(12, 1fr); gap:5px; height:86px; margin:14px 0 22px; align-items:end; }
.ks-b { position:relative; height:100%; display:flex; align-items:flex-end; cursor:default; }
.ks-b b { width:100%; border-radius:4px 4px 0 0; display:block; }
.ks-b i { position:absolute; left:-1px; right:-1px; height:2px; background:var(--text); z-index:1; } .ks-b i.fut { background:var(--text3); opacity:.6; }
.ks-b span { position:absolute; bottom:-17px; left:0; right:0; text-align:center; font-size:10px; color:var(--text3); }
.ks-b.cur span { color:var(--accent, #b8862f); font-weight:700; }
.ks-now { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:8px; border-top:1px solid var(--border); padding-top:12px; }
.ks-now > div { display:flex; flex-direction:column; min-width:0; } .ks-now span { font-size:11px; color:var(--text3); } .ks-now b { font-size:17px; font-variant-numeric:tabular-nums; }
.ks-now em { font-style:normal; font-size:11px; color:var(--text3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ks-no { margin-top:14px; } .ks-nob { border:0; background:transparent; color:var(--text2); font-size:12.5px; cursor:pointer; font-family:inherit; padding:4px 0; }
.ks-nol { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:6px 14px; margin-top:6px; }
.ks-nol > div { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid var(--border); font-size:12.5px; } .ks-nol > div:last-child { border:0; }
.ks-nol b { font-variant-numeric:tabular-nums; font-weight:600; }`;
    document.head.appendChild(st);
  }
})();
