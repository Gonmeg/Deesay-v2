// kpi.js (v20261007b) — หน้า "เป้าหมาย KPI" · โหลดครั้งแรกที่กดเมนู
// เป้ารายเดือน ต่อสินค้า (parent) ต่อช่องทาง · กรอกเป็นชิ้น → เป้าเงิน = ชิ้น × ราคาเฉลี่ยต่อชิ้นจริง 3 เดือนก่อนเดือนเป้า (ล็อกเมื่อเดือนจบ: kpi_price_lock)
// ที่มา: RPC kpi_page(p_month) — ยอดจริงจาก mv_sku_daily (แหล่งเดียวกับเจาะสินค้า / แนวโน้มสินค้า) นับถึงเมื่อวาน · บันทึก: RPC kpi_set_targets (ตรวจสิทธิ์ + เก็บประวัติ)
// สิทธิ์แก้ = ผู้ดูแลระบบ + คนที่ติ๊ก "แก้เป้า KPI" ใน Admin · เดือนที่จบแล้วแก้ได้เฉพาะผู้ดูแลระบบ
(function () {
  'use strict';
  const CH = ['Facebook', 'TikTok', 'Shopee', 'Lazada', 'ตัวแทน', 'Modern Trade'];
  const ONLINE = ['Facebook', 'TikTok', 'Shopee', 'Lazada'];
  const isBulk = c => c === 'ตัวแทน' || c === 'Modern Trade';
  const CHC = { Facebook: '--ch-facebook', TikTok: '--ch-tiktok', Shopee: '--ch-shopee', Lazada: '--ch-lazada', 'ตัวแทน': '--ch-dealer', 'Modern Trade': '--ch-mt' };
  const PACE_UP = 1.05, PACE_DN = 0.95, FIN_NEAR = 0.9;   // นำเป้า ≥105% · ช้ากว่าเป้า <95% ของ "ควรได้ถึงวันนี้" · เดือนที่จบ: เกือบถึง ≥90%
  const MIN_M = '2026-01';
  const MS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const ML = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  let TODAY = null, YEST = null, CUR = null;   // มาจากเซิร์ฟเวอร์ (เวลาไทย)

  const fmt = v => Math.round(+v || 0).toLocaleString('en-US');
  const money = v => (Math.round(v) < 0 ? '−฿' : '฿') + fmt(Math.abs(v));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const css = n => getComputedStyle(document.body).getPropertyValue(n).trim();
  const $ = id => document.getElementById(id);
  const onPage = () => typeof currentPage !== 'undefined' && currentPage === 'kpi';

  const mAdd = (mo, n) => { const [y, m] = mo.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const dim = mo => { const [y, m] = mo.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const mLong = mo => ML[+mo.slice(5) - 1] + ' ' + (+mo.slice(0, 4) + 543);
  const mShort = mo => MS[+mo.slice(5) - 1];
  const dShort = iso => +iso.slice(8) + ' ' + MS[+iso.slice(5, 7) - 1];
  const dLong = iso => dShort(iso) + ' ' + (+iso.slice(0, 4) + 543);
  const state3 = mo => mo < CUR ? 'past' : mo === CUR ? 'cur' : 'future';
  const lastComplete = mo => { const a = mAdd(mo, -1), b = mAdd(CUR, -1); return a < b ? a : b; };
  const prev3 = mo => [mAdd(mo, -3), mAdd(mo, -2), mAdd(mo, -1)];

  /* ───── ข้อมูล (ชุดละเดือน จาก kpi_page) ───── */
  const CACHE = {};                              // CACHE[เดือน] = { A, DL, P, T, LOCK, HIST, me, at }
  let A = {}, DL = {}, P = {}, T = {}, LOCK = {}, HIST = [], ME = { can_edit: false, is_admin: false };
  function build(mo, d) {
    const a = {}, put = (m, s, c, q, r) => { ((a[m] ||= {})[s] ||= {})[c] = [+q, +r]; };
    (d.monthly || []).forEach(x => put(x[2], x[0], x[1], x[3], x[4]));
    const dl = {}; (d.daily || []).forEach(x => { (dl[x[0]] ||= {})[x[1]] = [+x[2], +x[3]]; });
    CH.forEach(c => {   // ปัดเศษรายวันให้รวมเท่ายอดเดือนพอดี (กราฟ = การ์ด)
      let mq = 0, mr = 0; Object.keys(a[mo] || {}).forEach(s => { const v = (a[mo][s] || {})[c]; if (v) { mq += v[0]; mr += v[1]; } });
      const days = Object.keys(dl[c] || {}).sort(); if (!days.length) return;
      let dq = 0, dr = 0; days.forEach(x => { dq += dl[c][x][0]; dr += dl[c][x][1]; });
      const last = dl[c][days[days.length - 1]]; last[0] += mq - dq; last[1] += mr - dr;
    });
    const p = {}; (d.products || []).forEach(x => { p[x[0]] = { sku: x[0], name: x[1] || x[0], status: x[2] || '', rsp: +x[3] || 0 }; });
    const t = {}; (d.targets || []).forEach(x => { ((t[x[0]] ||= {})[x[1]] ||= {})[x[2]] = +x[3]; });
    const lock = {}; (d.locks || []).forEach(x => { lock[x[0] + '|' + x[1]] = { v: +x[2], src: x[3] }; });
    const hist = (d.history || []).map(x => ({ ts: new Date(x[0]), who: x[1] || '', how: x[2] || '', mo, s: x[3], c: x[4], old: x[5], nu: x[6] }));
    return { A: a, DL: dl, P: p, T: t, LOCK: lock, HIST: hist, me: d.me || {}, at: Date.now() };
  }
  function use(mo) { const c = CACHE[mo]; A = c.A; DL = c.DL; P = c.P; T = c.T; LOCK = c.LOCK; HIST = c.HIST; ME = c.me; }
  async function load(mo, force) {   // mo ว่าง = เดือนปัจจุบัน (เวลาไทยจากเซิร์ฟเวอร์)
    if (mo && !force && CACHE[mo] && Date.now() - CACHE[mo].at < 5 * 60 * 1000) { use(mo); return mo; }
    const n = new Date(), here = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-01';
    const d = await Auth.rpc('kpi_page', { p_month: mo ? mo + '-01' : here });
    TODAY = d.today; YEST = d.yest; CUR = d.cur; mo = d.month;
    CACHE[mo] = build(mo, d); use(mo); return mo;
  }

  const act = (mo, s, c) => ((A[mo] || {})[s] || {})[c] || [0, 0];
  const isGift = s => !P[s] || P[s].status === 'GWP' || !(P[s].rsp > 0);
  const nameOf = s => P[s] ? P[s].name : s;
  const lastData = (mo, c) => { const days = Object.keys(DL[c] || {}).filter(d => d.startsWith(mo) && d <= YEST).sort(); return days.length ? days[days.length - 1] : null; };

  /* ราคาเฉลี่ยต่อชิ้น = 3 เดือนก่อนเดือนเป้า ในช่องทางนั้น → ไม่เคยขายในช่องนี้: เฉลี่ยช่องทางออนไลน์ → ไม่เคยขายเลย: RSP · เดือนที่จบแล้วใช้ราคาที่ล็อกไว้ */
  const PRICE = {};
  function price(mo, s, c) {
    const lk = mo === S.mo ? LOCK[s + '|' + c] : null;
    if (lk) return { v: lk.v, src: lk.src, ms: prev3(mo), locked: true };
    const k = mo + '|' + s + '|' + c + '|' + (CACHE[mo] ? CACHE[mo].at : 0); if (PRICE[k]) return PRICE[k];
    const ms = prev3(mo); let q = 0, r = 0, out;
    ms.forEach(m => { const v = act(m, s, c); if (v[0] > 0) { q += v[0]; r += v[1]; } });
    if (q > 0 && r > 0) out = { v: r / q, src: 'ch' };
    else {
      let q2 = 0, r2 = 0; ms.forEach(m => ONLINE.forEach(cc => { const v = act(m, s, cc); if (v[0] > 0) { q2 += v[0]; r2 += v[1]; } }));
      out = q2 > 0 && r2 > 0 ? { v: r2 / q2, src: 'online' } : { v: P[s] ? P[s].rsp : 0, src: 'rsp' };
    }
    out.ms = ms; return (PRICE[k] = out);
  }
  const priceNote = p => (p.src === 'ch' ? `ราคาเฉลี่ยจริง ${mShort(p.ms[0])}–${mShort(p.ms[2])} ในช่องทางนี้`
    : p.src === 'online' ? `ยังไม่เคยขายในช่องทางนี้ ใช้ราคาเฉลี่ยช่องทางออนไลน์ ${mShort(p.ms[0])}–${mShort(p.ms[2])}` : 'ยังไม่เคยขาย ใช้ราคาขายปลีก (RSP) ในหน้า Admin') + (p.locked ? ' · ล็อกแล้ว' : '');

  const nice = v => v < 1 ? 0 : v < 20 ? Math.round(v) : v < 200 ? Math.round(v / 5) * 5 : v < 2000 ? Math.round(v / 10) * 10 : Math.round(v / 50) * 50;
  const tq = (mo, s, c) => { const v = ((T[mo] || {})[s] || {})[c]; return v == null ? null : v; };
  const hasT = (mo, s) => !!(T[mo] && T[mo][s] && Object.keys(T[mo][s]).length);

  /* ───── สถานะหน้า ───── */
  const S = { mo: null, F: '', unit: 'rev', mode: 'track', sort: { k: 't', d: -1 }, page: 1, per: 25, q: '', st: '', showDisc: false };
  const ADDED = {}, UNDO = [];
  let saveMsg = '', histPage = 1;
  const canEdit = mo => !!ME.can_edit && (mo >= CUR || !!ME.is_admin);
  const myName = () => (window.Auth && Auth.perm && (Auth.perm.name || Auth.perm.email)) || 'คุณ';

  function soldRecently(mo, s) { return [...prev3(mo), mo].some(m => CH.some(c => act(m, s, c)[0] > 0)); }
  function rowSkus(mo) {
    return Object.keys(P).filter(s => !isGift(s) && (hasT(mo, s) || (ADDED[mo] && ADDED[mo].has(s)) ||
      (soldRecently(mo, s) && (['Existing', 'NPD'].includes(P[s].status) || S.showDisc))));
  }
  const rev3 = (mo, s) => prev3(mo).reduce((a, m) => a + CH.reduce((b, c) => b + act(m, s, c)[1], 0), 0);

  function ctx(mo) {
    const st = state3(mo), n = dim(mo), el = {}, last = {}, now = st === 'cur' ? +YEST.slice(8) : st === 'past' ? n : 0;
    CH.forEach(c => {
      if (st !== 'cur') { el[c] = st === 'past' ? n : 0; return; }
      const L = lastData(mo, c); last[c] = L; el[c] = isBulk(c) ? now : (L ? +L.slice(8) : now);
    });
    return { mo, st, n, el, last, now };
  }
  function cell(mo, s, c) { const [aq, ar] = act(mo, s, c), t = tq(mo, s, c), p = price(mo, s, c); return { aq, ar, tq: t, tr: t == null ? null : Math.round(t * p.v), p }; }

  // รวมหลายช่องทาง: a ทำได้ · t เป้า · ex ควรได้ถึงวันนี้ (ออนไลน์) · pj คาดการณ์ (ออนไลน์) · ot/oa เป้า/ทำได้ ออนไลน์ · rate ต่อวัน
  function agg(K, cells, u) {
    let a = 0, t = 0, has = false, ex = 0, pj = 0, ot = 0, oa = 0, rate = 0;
    cells.forEach(({ c, x }) => {
      const av = u === 'rev' ? x.ar : x.aq, tv = u === 'rev' ? x.tr : x.tq;
      a += av; if (tv != null) { t += tv; has = true; }
      if (K.st === 'cur' && !isBulk(c)) {
        const e = K.el[c]; oa += av;
        if (tv != null) { ot += tv; ex += tv * e / K.n; }
        if (e > 0) { pj += av / e * K.n; rate += av / e; }
      }
    });
    return { a, t: has ? t : null, ex, pj, ot, oa, rate, online: cells.some(x => !isBulk(x.c)) };
  }
  function tot(K, chs, u) {
    const cells = chs.map(c => {
      let aq = 0, ar = 0; Object.keys(A[K.mo] || {}).forEach(s => { const v = act(K.mo, s, c); aq += v[0]; ar += v[1]; });
      let q = 0, r = 0, has = false;
      Object.keys(T[K.mo] || {}).forEach(s => { const t = tq(K.mo, s, c); if (t != null) { has = true; q += t; r += Math.round(t * price(K.mo, s, c).v); } });
      return { c, x: { aq, ar, tq: has ? q : null, tr: has ? r : null } };
    });
    return agg(K, cells, u);
  }
  function status(K, g) {
    if (g.t == null || g.t <= 0) return { k: 'none', c: 'flat', l: g.a > 0 ? 'ไม่มีเป้า' : '—' };
    if (K.st === 'future') return { k: 'future', c: 'flat', l: 'ยังไม่เริ่ม' };
    if (K.st === 'past') { const r = g.a / g.t; return r >= 1 ? { k: 'good', c: 'good', l: 'ถึงเป้า' } : r >= FIN_NEAR ? { k: 'mid', c: 'mid', l: 'เกือบถึง' } : { k: 'bad', c: 'bad', l: 'ไม่ถึงเป้า' }; }
    if (g.ot > 0 && g.ex > 0) { const r = g.oa / g.ex; return r >= PACE_UP ? { k: 'good', c: 'good', l: 'นำเป้า' } : r >= PACE_DN ? { k: 'mid', c: 'mid', l: 'ตามเป้า' } : { k: 'bad', c: 'bad', l: 'ช้ากว่าเป้า' }; }
    return g.a >= g.t ? { k: 'good', c: 'good', l: 'ถึงเป้าแล้ว' } : { k: 'wait', c: 'flat', l: 'รอสิ้นเดือน' };
  }
  const barColor = c => c === 'good' ? 'var(--good)' : c === 'mid' ? 'var(--accent)' : c === 'bad' ? 'var(--bad)' : 'var(--text3)';
  const badge = st => st.k === 'none' && st.l === '—' ? '<span class="ui-muted">—</span>'
    : `<span class="ui-badge ${st.c === 'good' ? 'good' : st.c === 'bad' ? 'bad' : st.c === 'mid' ? 'gold' : ''}">${st.l}</span>`;
  function prog(g, st, tick, wide) {
    if (g.t == null || g.t <= 0) return `<div class="kp-p flat">${g.a > 0 ? 'ไม่มีเป้า' : ''}</div>`;
    const pct = g.a / g.t * 100, w = Math.max(0, Math.min(100, pct));
    const tk = tick != null ? `<i style="left:${Math.min(100, tick * 100).toFixed(1)}%"></i>` : '';
    return `<div class="kp-p ${st.c}${wide ? ' is-wide' : ''}"><span class="kp-bar" style="--c:${barColor(st.c)}"><b style="width:${w.toFixed(1)}%"></b>${tk}</span><span class="kp-pct">${pct.toFixed(pct > 0 && pct < 1 ? 1 : 0)}%</span></div>`;
  }
  const gapTxt = (v, fm) => Math.round(v) === 0 ? '<span class="ui-delta flat">ตรงเป้า</span>'
    : v > 0 ? `<span class="ui-delta good">▲ นำ ${fm(v)}</span>` : `<span class="ui-delta bad">▼ ช้ากว่า ${fm(-v)}</span>`;
  const diffTxt = (v, fm) => Math.round(v) === 0 ? '<span class="ui-delta flat">ตรงเป้า</span>'
    : v > 0 ? `<span class="ui-delta good">+${fm(v)}</span>` : `<span class="ui-delta bad">−${fm(-v)}</span>`;
  const info = (id, html) => `<span class="ads-info-wrap" style="position:relative;display:inline-block;"><span class="hm-info" onclick="event.stopPropagation();toggleFbeInfo('${id}')" aria-label="ดูคำอธิบายเพิ่มเติม">ⓘ</span><div id="${id}" class="ads-info-popover hm-info-pop" style="display:none;" onclick="event.stopPropagation()">${html}</div></span>`;
  const dot = c => `<span class="ui-chdot${c === 'TikTok' ? ' ui-tt' : ''}" style="--c:var(${CHC[c]});"></span>`;
  const fmU = u => u === 'rev' ? money : v => fmt(v);
  const unitWord = u => u === 'rev' ? 'ยอดขาย' : 'จำนวนชิ้น';

  /* ───── วาดทั้งหน้า ───── */
  function render() {
    if (!S.mo || !CACHE[S.mo] || !$('kpHead')) return;
    const sel = $('filterChannel'); S.F = sel && CH.includes(sel.value) ? sel.value : '';
    const K = ctx(S.mo);
    if (S.mode === 'edit' && !ME.can_edit) S.mode = 'track';
    renderTopbar();
    renderHead(K);
    renderNote(K);
    renderCards(K);
    if (S.mode === 'edit') renderEdit(K); else renderTrack(K);
    if (window.UI) UI.fit();
  }
  function renderTopbar() {
    const mi = $('kpMonth');
    if (mi) { mi.setAttribute('min', MIN_M); mi.setAttribute('max', mAdd(CUR, 3)); if (mi.value !== S.mo) mi.value = S.mo; }
    document.querySelectorAll('#kpMonthPresets button').forEach(b => b.setAttribute('aria-pressed', presetMonth(b.dataset.p) === S.mo));
  }
  const presetMonth = p => p === 'm0' ? CUR : p === 'm1' ? mAdd(CUR, -1) : mAdd(CUR, 1);
  function renderHead(K) {
    const sub = K.st === 'cur' ? `ผ่านไป ${K.now} จาก ${K.n} วัน · นับยอดถึง ${dLong(YEST)} (ไม่นับวันนี้ที่ยังไม่จบ)`
      : K.st === 'past' ? 'จบเดือนแล้ว · ผลสุดท้าย' : 'เดือนนี้ยังไม่เริ่ม · ใช้ตั้งเป้าล่วงหน้า';
    const lock = K.st === 'past' ? `<span class="ui-badge" data-tip="เดือนที่จบแล้วแก้เป้าได้เฉพาะผู้ดูแลระบบ">🔒 ล็อกแล้ว</span>` : '';
    const modeBtns = !ME.can_edit ? '' : `<div class="ui-presets" id="kpMode" role="group" aria-label="โหมดของหน้า">
        <button type="button" data-m="track" aria-pressed="${S.mode === 'track'}">📊 ติดตามผล</button>
        <button type="button" data-m="edit" aria-pressed="${S.mode === 'edit'}">✏️ ตั้งเป้า</button></div>`;
    const unitBtns = `<div class="ui-presets" id="kpUnit" role="group" aria-label="หน่วย">
        <button type="button" data-u="rev" aria-pressed="${S.unit === 'rev'}">ยอดขาย (฿)</button>
        <button type="button" data-u="qty" aria-pressed="${S.unit === 'qty'}">จำนวนชิ้น</button></div>`;
    $('kpHead').innerHTML = `<div><h1>🏁 เป้าหมาย KPI <span class="ui-badge gold">${mLong(S.mo)}</span>${lock}</h1><p>${sub}</p></div>
      <div class="kp-head-r">${S.mode === 'track' ? unitBtns : ''}${modeBtns}</div>`;
  }
  function renderNote(K) {
    let h = '';
    if (K.st === 'cur' && S.mode === 'track') {
      const late = ONLINE.filter(c => (!S.F || S.F === c) && K.last[c] && K.last[c] < YEST);
      if (late.length) h += `<div class="ui-status warn" style="margin-bottom:12px;"><b>ยอดบางช่องทางยังไม่ถึง ${dShort(YEST)}</b><span>${late.map(c => `${c} ถึง ${dShort(K.last[c])}`).join(' · ')} — "ควรได้ถึงวันนี้" ของช่องนั้นนับถึงวันที่มีข้อมูล ไม่ทำให้ดูช้ากว่าเป้าเกินจริง</span></div>`;
    }
    $('kpNote').innerHTML = h;
  }

  function renderCards(K) {
    const chs = S.F ? [S.F] : CH, u = S.unit, fm = fmU(u);
    const R = tot(K, chs, 'rev'), Q = tot(K, chs, 'qty'), G = u === 'rev' ? R : Q;
    const tick = K.st === 'cur' ? (S.F ? (isBulk(S.F) ? null : K.el[S.F] / K.n) : K.now / K.n) : null;
    const lc = lastComplete(S.mo), lcR = lcRows(chs, 'rev'), lcQ = lcRows(chs, 'qty');
    const mbar = (g, st) => g.t ? `<span class="kp-mbar" style="--c:${barColor(st.c)}"><b style="width:${Math.min(100, g.a / g.t * 100).toFixed(1)}%"></b>${tick != null ? `<i style="left:${(tick * 100).toFixed(1)}%"></i>` : ''}</span>` : '';
    const vsTxt = (g, st) => g.t ? `เป้า ${g === R ? money(g.t) : fmt(g.t) + ' ชิ้น'} · <b class="kp-c-${st.c}">${(g.a / g.t * 100).toFixed(1)}%</b>` : 'ยังไม่ได้ตั้งเป้า';
    const pctVs = (a, b) => b > 0 ? `<span class="ui-delta ${a >= b ? 'good' : 'bad'}">${a >= b ? '▲' : '▼'} ${Math.abs((a / b - 1) * 100).toFixed(1)}%</span>` : '<span class="ui-delta flat">—</span>';
    const m = (label, value, sub, inf, bar) => `<div class="ui-metric is-static"><span class="ui-metric-l">${label}${inf || ''}</span><span class="ui-metric-v">${value}</span><span class="ui-metric-d">${sub}</span>${bar || ''}</div>`;
    let h = '';
    if (S.mode === 'edit' || K.st === 'future') {
      const nT = rowSkus(S.mo).filter(s => chs.some(c => tq(S.mo, s, c) != null)).length;
      const nC = rowSkus(S.mo).reduce((a, s) => a + chs.filter(c => tq(S.mo, s, c) != null).length, 0);
      h += m('เป้ายอดขาย', R.t != null ? money(R.t) : '—', R.t != null ? `${pctVs(R.t, lcR)} เทียบยอดจริง ${mShort(lc)} (${money(lcR)})` : 'ยังไม่ได้ตั้งเป้า',
        info('kp-i-tr', `<b>เป้ายอดขาย</b> คำนวณให้เองจากจำนวนชิ้นที่กรอก × ราคาเฉลี่ยต่อชิ้นจริง 3 เดือนก่อนเดือนเป้า ของสินค้านั้นในช่องทางนั้น ไม่ต้องกรอกยอดเงินเอง<br><b>เทียบยอดจริง ${mShort(lc)}</b> นับเฉพาะสินค้าในตาราง จึงเทียบแบบรายการเดียวกัน (ไม่รวมของแถมและสินค้าที่ไม่ได้แสดง)`));
      h += m('เป้าจำนวนชิ้น', Q.t != null ? fmt(Q.t) : '—', Q.t != null ? `${pctVs(Q.t, lcQ)} เทียบยอดจริง ${mShort(lc)} (${fmt(lcQ)} ชิ้น)` : 'ยังไม่ได้ตั้งเป้า');
      h += m('เป้าเฉลี่ยต่อวัน', G.t != null ? fm(G.t / K.n) : '—', `${K.n} วันในเดือน${u === 'qty' ? ' · หน่วยชิ้น' : ''}`,
        info('kp-i-day', '<b>เป้าเฉลี่ยต่อวัน</b> = เป้าทั้งเดือน ÷ จำนวนวันในเดือน (แบ่งเท่าๆ กันทุกวัน)'));
      h += m('ตั้งเป้าแล้ว', `${fmt(nT)} สินค้า`, `${fmt(nC)} ช่อง (สินค้า × ช่องทาง)`);
    } else if (K.st === 'cur') {
      const stR = status(K, R), stQ = status(K, Q);
      h += m('ยอดขายเทียบเป้า', money(R.a), vsTxt(R, stR), info('kp-i-a', `<b>ยอดขาย</b> ทุกสินค้า (รวมสินค้าที่ไม่ได้ตั้งเป้า) ตั้งแต่ 1 ${mShort(S.mo)} ถึง ${dShort(YEST)} — ตรงกับหน้าอื่นเมื่อเลือกช่วงเดียวกัน<br><b>ขีดเล็กบนแถบ</b> ผ่านไปกี่ % ของเดือนแล้ว ถ้าแถบยาวเลยขีด = เร็วกว่าเป้า`), mbar(R, stR));
      h += m('จำนวนชิ้นเทียบเป้า', fmt(Q.a), vsTxt(Q, stQ), '', mbar(Q, stQ));
      if (S.F && isBulk(S.F)) {
        h += m('ควรได้ถึงวันนี้', '—', S.F === 'ตัวแทน' ? 'ตัวแทนสั่งเป็นก้อน ดูผลตอนสิ้นเดือน' : 'ห้างส่งยอดเป็นรายเดือน ดูผลตอนสิ้นเดือน');
        h += m('คาดการณ์สิ้นเดือน', '—', 'ไม่คาดการณ์ เพราะยอดไม่ได้เข้าทุกวัน');
      } else {
        const lbl = S.F ? '' : ' <small class="kp-scope">ออนไลน์</small>';
        const scopeInfo = S.F ? '' : '<br>นับเฉพาะ Facebook, TikTok, Shopee, Lazada เพราะตัวแทนสั่งเป็นก้อน และ Modern Trade ส่งยอดเป็นรายเดือน';
        h += m('ควรได้ถึงวันนี้' + lbl, G.ot > 0 ? fm(G.ex) : '—', G.ot > 0 ? `ทำได้ ${fm(G.oa)} · ${gapTxt(G.oa - G.ex, fm)}` : 'ยังไม่ได้ตั้งเป้า',
          info('kp-i-ex', `<b>ควรได้ถึงวันนี้</b> = เป้าทั้งเดือน ÷ จำนวนวันในเดือน × วันที่ผ่านไปแล้ว (ไม่นับวันนี้)<br>ช่องทางที่อัปยอดยังไม่ถึงเมื่อวาน นับถึงวันที่มีข้อมูล${scopeInfo}<br><b>นำเป้า</b> ทำได้ ≥ 105% · <b>ตามเป้า</b> 95–105% · <b>ช้ากว่าเป้า</b> < 95%`));
        const rem = K.n - K.now, need = G.ot > 0 && rem > 0 ? Math.max(0, (G.ot - G.oa) / rem) : null;
        h += m('คาดการณ์สิ้นเดือน' + lbl, G.oa > 0 ? fm(G.pj) : '—', G.ot > 0 ? `<b class="kp-c-${G.pj >= G.ot ? 'good' : 'bad'}">${(G.pj / G.ot * 100).toFixed(0)}%</b> ของเป้า · ต้องได้วันละ ${fm(need || 0)} (ตอนนี้ ${fm(G.rate)})` : 'ยังไม่ได้ตั้งเป้า',
          info('kp-i-pj', `<b>คาดการณ์สิ้นเดือน</b> = ยอดเฉลี่ยต่อวันตอนนี้ × จำนวนวันในเดือน<br><b>ต้องได้วันละ</b> ยอดที่ต้องทำต่อวันจากนี้จนสิ้นเดือนเพื่อให้ถึงเป้า${scopeInfo}`));
      }
    } else {   // past
      const stR = status(K, R), stQ = status(K, Q);
      h += m('ยอดขายเทียบเป้า', money(R.a), vsTxt(R, stR), info('kp-i-a2', '<b>ยอดขาย</b> ทั้งเดือน ทุกสินค้า (รวมสินค้าที่ไม่ได้ตั้งเป้า)'), mbar(R, stR));
      h += m('จำนวนชิ้นเทียบเป้า', fmt(Q.a), vsTxt(Q, stQ), '', mbar(Q, stQ));
      h += m(`ผลต่างจากเป้า (${unitWord(u)})`, G.t != null ? `<span class="kp-c-${G.a >= G.t ? 'good' : 'bad'}">${G.a >= G.t ? '+' : '−'}${fm(Math.abs(G.a - G.t))}</span>` : '—', G.t != null ? (G.a >= G.t ? 'ทำได้เกินเป้า' : 'ขาดจากเป้า') : '');
      const rs = rowSkus(S.mo).map(s => { const g = agg(K, chs.map(c => ({ c, x: cell(S.mo, s, c) })), u); return status(K, g); }).filter(x => x.k !== 'none');
      const chHit = S.F ? null : CH.filter(c => { const g = tot(K, [c], u); return g.t && g.a >= g.t; }).length, chN = CH.filter(c => tot(K, [c], u).t).length;
      h += m('สินค้าที่ถึงเป้า', `${rs.filter(x => x.k === 'good').length} / ${rs.length}`, S.F ? `ใน ${S.F}` : `ช่องทางที่ถึงเป้า ${chHit} / ${chN}`);
    }
    $('kpCards').innerHTML = h;
  }
  // ยอดจริงเดือนอ้างอิง เฉพาะสินค้าในตาราง (เทียบกับเป้าแบบรายการเดียวกัน)
  function lcRows(chs, u) { const lc = lastComplete(S.mo); return rowSkus(S.mo).reduce((a, s) => a + chs.reduce((b, c) => b + act(lc, s, c)[u === 'rev' ? 1 : 0], 0), 0); }
  function totLc(mo, chs, u) { let v = 0; Object.keys(A[mo] || {}).forEach(s => chs.forEach(c => { v += act(mo, s, c)[u === 'rev' ? 1 : 0]; })); return v; }

  /* ───── โหมดติดตามผล ───── */
  function renderTrack(K) {
    const u = S.unit;
    let h = `<section class="hm-panel">
      <div class="hm-panel-h"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;"><h2>ยอดสะสมรายวันเทียบเป้า ${info('kp-i-ch', `<b>ยอดจริงสะสม</b> ยอดตั้งแต่วันที่ 1 รวมขึ้นไปทุกวัน<br><b>เป้าสะสม</b> เป้าเดือนแบ่งเท่าๆ กันทุกวัน${S.F && isBulk(S.F) ? ' (ตัวแทน / Modern Trade แสดงเป็นเส้นเป้าทั้งเดือน เพราะยอดเข้าเป็นก้อน)' : ''}<br><b>คาดการณ์</b> ถ้าขายต่อด้วยความเร็วเท่าตอนนี้ สิ้นเดือนจะได้เท่าไหร่<br>เส้นยอดจริงหยุดที่วันล่าสุดที่ทุกช่องทางในกราฟมีข้อมูลครบ`)}</h2>
        <span class="kp-scope-l">${S.F ? dot(S.F) + esc(S.F) : 'ช่องทางออนไลน์ (Facebook · TikTok · Shopee · Lazada)'} · ${unitWord(u)}</span></div>
        <div class="ui-legend" id="kpLegend"></div></div>
      <div class="chart-wrap" id="kpChartBox" style="height:280px;"></div>
    </section><div class="hm-gap"></div>`;
    if (!S.F) h += `<section class="hm-panel">${chPanel(K)}</section><div class="hm-gap"></div>`;
    h += `<section class="hm-panel" id="kpProdPanel">${prodPanel(K)}</section>`;
    $('kpMain').innerHTML = h;
    renderChart(K);
  }

  function renderChart(K) {
    const box = $('kpChartBox'); if (!box) return;
    if (window._kpChart) { window._kpChart.destroy(); window._kpChart = null; }
    box.innerHTML = '<canvas id="kpChart"></canvas>';
    const u = S.unit, i = u === 'rev' ? 1 : 0, fm = fmU(u), bulk = !!(S.F && isBulk(S.F)), scope = S.F ? [S.F] : ONLINE, n = K.n;
    const G = tot(K, scope, u);
    const days = Array.from({ length: n }, (_, k) => k + 1), iso = d => K.mo + '-' + String(d).padStart(2, '0');
    const lastD = K.st === 'past' ? n : K.st === 'future' ? 0 : bulk ? K.now : Math.min(...scope.map(c => K.el[c]));
    let cum = 0;
    const actual = days.map(d => { if (d > lastD) return null; scope.forEach(c => { const v = (DL[c] || {})[iso(d)]; if (v) cum += v[i]; }); return cum; });
    const target = G.t == null ? null : days.map(d => bulk ? G.t : G.t * d / n);
    let proj = null;
    if (K.st === 'cur' && !bulk && lastD > 0 && lastD < n) { const s0 = actual[lastD - 1], e = G.pj; proj = days.map(d => d < lastD ? null : s0 + (e - s0) * (d - lastD) / (n - lastD)); }
    const col = S.F ? css(CHC[S.F]) : css('--accent'), t3 = css('--text3'), grid = css('--grid'), font = { family: 'Sarabun', size: 12 };
    const ds = [];
    if (K.st !== 'future') ds.push({ label: 'ยอดจริงสะสม', data: actual, borderColor: col, backgroundColor: col, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, tension: .25, spanGaps: false });
    if (proj) ds.push({ label: 'คาดการณ์', data: proj, borderColor: col, borderDash: [2, 4], borderWidth: 2, pointRadius: 0, pointHoverRadius: 3, tension: 0, _proj: true });
    if (target) ds.push({ label: bulk ? 'เป้าทั้งเดือน' : 'เป้าสะสม', data: target, borderColor: t3, borderDash: [6, 4], borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 3, tension: 0 });
    $('kpLegend').innerHTML = ds.map(d => `<span><i class="${d.borderDash ? 'kp-dash' : ''}${S.F === 'TikTok' && !d.borderDash ? ' ui-tt' : ''}" style="--c:${d.borderColor};"></i>${d.label}${d.label === 'ยอดจริงสะสม' && K.st === 'cur' ? ` <small class="kp-muted">ถึง ${lastD} ${mShort(K.mo)}</small>` : ''}</span>`).join('')
      + (K.st === 'future' && !target ? '<span class="kp-muted">ยังไม่ได้ตั้งเป้า</span>' : '');
    window._kpChart = new Chart($('kpChart'), {
      type: 'line', data: { labels: days.map(String), datasets: ds },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false },
          tooltip: { itemSort: (a, b) => b.parsed.y - a.parsed.y, filter: c => c.parsed.y != null,
            callbacks: { title: it => dLong(iso(+it[0].label)), label: c => `${c.dataset.label}: ${fm(c.parsed.y)}`,
              footer: it => { const a = it.find(x => x.dataset.label === 'ยอดจริงสะสม'), t = it.find(x => !x.dataset._proj && x.dataset.label !== 'ยอดจริงสะสม');
                return a && t && t.parsed.y > 0 ? `เทียบเป้า: ${(a.parsed.y / t.parsed.y * 100).toFixed(1)}%` : ''; } } } },
        scales: { x: { grid: { display: false }, ticks: { color: t3, font, maxRotation: 0, autoSkip: true, maxTicksLimit: 16 } },
          y: { beginAtZero: true, grid: { color: grid }, border: { display: false }, ticks: { color: t3, font, callback: v => fm(v) } } } }
    });
  }

  function chPanel(K) {
    const u = S.unit, fm = fmU(u), lc = lastComplete(S.mo);
    const head = K.st === 'cur' ? ['ช่องทาง', 'เป้า', 'ทำได้', 'ความคืบหน้า', 'ควรได้ถึงวันนี้', 'นำ / ช้า', 'คาดการณ์สิ้นเดือน', 'ข้อมูลถึง', 'สถานะ']
      : K.st === 'past' ? ['ช่องทาง', 'เป้า', 'ทำได้', 'ความคืบหน้า', 'ผลต่าง', 'สถานะ'] : ['ช่องทาง', 'เป้า', `ยอดจริง ${mShort(lc)} *`, 'เป้าเทียบยอดจริง', 'เป้าต่อวัน'];
    const row = (c, g, isTot) => {
      const st = status(K, g), name = isTot ? 'รวม' : `<span class="hm-ch-name is-link" onclick="kpSetChannel('${c}')" data-tip="ดูเฉพาะ ${esc(c)}">${dot(c)}${esc(c)}</span>`;
      const t = g.t != null ? fm(g.t) : '<span class="ui-muted">—</span>';
      if (K.st === 'future') {
        const la = isTot ? lcRows(CH, u) : lcRows([c], u);
        return `<tr><td>${name}</td><td class="num">${t}</td><td class="num">${fm(la)}</td><td class="num">${g.t != null && la > 0 ? diffPct(g.t, la) : '—'}</td><td class="num">${g.t != null ? fm(g.t / K.n) : '—'}</td></tr>`;
      }
      const tick = K.st === 'cur' ? (isTot ? K.now / K.n : isBulk(c) ? null : K.el[c] / K.n) : null;
      if (K.st === 'past') return `<tr><td>${name}</td><td class="num">${t}</td><td class="num">${fm(g.a)}</td><td class="num">${prog(g, st, null, true)}</td><td class="num">${g.t != null ? diffTxt(g.a - g.t, fm) : '—'}</td><td>${badge(st)}</td></tr>`;
      const bulk = !isTot && isBulk(c), dash = '<span class="ui-muted">—</span>';
      const on = isTot ? ' <small class="kp-scope">ออนไลน์</small>' : '';
      const upto = isTot ? '' : bulk ? `<span class="ui-muted">${c === 'ตัวแทน' ? 'สั่งเป็นก้อน' : 'ยอดรายเดือน'}</span>` : (K.last[c] ? dShort(K.last[c]) : dash) + (K.last[c] && K.last[c] < YEST ? ' <span class="ui-badge warn">ยังไม่ครบ</span>' : '');
      return `<tr><td>${name}</td><td class="num">${t}</td><td class="num">${fm(g.a)}</td><td class="num">${prog(g, st, tick, true)}</td>
        <td class="num">${bulk || !g.ot ? dash : fm(g.ex) + on}</td><td class="num">${bulk || !g.ot ? dash : gapTxt(g.oa - g.ex, fm)}</td>
        <td class="num">${bulk || !g.oa ? dash : fm(g.pj) + on}</td><td class="num">${upto}</td><td>${badge(st)}</td></tr>`;
    };
    const body = CH.map(c => row(c, tot(K, [c], u))).join('');
    return `<div class="hm-panel-h"><h2>แยกตามช่องทาง ${info('kp-i-cht', `กดชื่อช่องทางเพื่อดูเฉพาะช่องทางนั้นทั้งหน้า<br><b>ความคืบหน้า</b> ทำได้ ÷ เป้าทั้งเดือน · ขีดเล็ก = ผ่านไปกี่ % ของเดือน<br><b>ตัวแทน</b> สั่งเป็นก้อน · <b>Modern Trade</b> ห้างส่งยอดเป็นรายเดือน จึงไม่คิด "ควรได้ถึงวันนี้" และ "คาดการณ์" ดูผลตอนสิ้นเดือน${K.st === 'future' ? `<br><b>ยอดจริง ${mShort(lc)} *</b> นับเฉพาะสินค้าในตาราง เพื่อเทียบกับเป้าแบบรายการเดียวกัน` : ''}`)}</h2></div>
      <div class="table-wrap"><table class="ui-table hm-tbl kp-tbl" data-no-sort data-no-page><thead><tr>${head.map((x, i) => `<th${i && x !== 'สถานะ' ? ' class="num"' : ''}>${x}</th>`).join('')}</tr></thead>
      <tbody>${body}</tbody><tfoot>${row('', tot(K, CH, u), true)}</tfoot></table></div>`;
  }
  const diffPct = (a, b) => `<span class="ui-delta ${a >= b ? 'good' : 'bad'}">${a >= b ? '▲' : '▼'} ${Math.abs((a / b - 1) * 100).toFixed(1)}%</span>`;

  function prodData(K) {
    const u = S.unit, chs = S.F ? [S.F] : CH, q = S.q.trim().toLowerCase();
    let rows = rowSkus(S.mo).map(s => {
      const cells = chs.map(c => ({ c, x: cell(S.mo, s, c) }));
      const g = agg(K, cells, u);
      return { s, cells, g, st: status(K, g), r3: rev3(S.mo, s) };
    });
    if (q) rows = rows.filter(r => (nameOf(r.s) + ' ' + r.s).toLowerCase().includes(q));
    return rows;
  }
  function sortRows(rows, K) {
    const { k, d } = S.sort, num = v => v == null ? -Infinity : v;
    const key = r => k === 'name' ? nameOf(r.s) : k === 't' ? num(r.g.t) : k === 'a' ? r.g.a : k === 'pct' ? (r.g.t ? r.g.a / r.g.t : -Infinity)
      : k === 'gap' ? (r.g.t ? (K.st === 'cur' ? r.g.oa - r.g.ex : r.g.a - r.g.t) : -Infinity) : k === 'pj' ? r.g.pj : k === 'ex' ? r.g.ex
      : k.startsWith('ch:') ? (r.cells.find(x => x.c === k.slice(3)) || { x: { ar: 0, aq: 0 } }).x[S.unit === 'rev' ? 'ar' : 'aq'] : k === 'price' ? r.cells[0].x.p.v : 0;
    return rows.sort((a, b) => { const x = key(a), y = key(b); const c = typeof x === 'string' ? x.localeCompare(y, 'th') : x - y; return c !== 0 ? c * d : b.g.a - a.g.a; });
  }
  function nmCell(s) {
    const disc = P[s] && P[s].status === 'Discontinued' ? ' <span class="ui-badge" data-tip="สถานะในหน้า Admin = เลิกผลิต (ยังมีของขาย)">เลิกผลิต</span>' : '';
    return `<td class="kp-nmc"><span class="kp-nm is-link" onclick="kpOpenSku('${s}')" data-tip="เปิดหน้าเจาะสินค้า">${esc(nameOf(s))}</span>${disc}<span class="ui-code kp-code">${esc(s)}</span></td>`;
  }
  function pager(N) {
    const pages = Math.max(1, Math.ceil(N / S.per)); if (S.page > pages) S.page = pages;
    const a = N ? (S.page - 1) * S.per + 1 : 0, b = Math.min(N, S.page * S.per);
    let btns = `<button type="button" data-pg="${S.page - 1}" ${S.page <= 1 ? 'disabled' : ''} aria-label="หน้าก่อน">‹</button>`;
    for (let p = 1; p <= pages; p++) btns += `<button type="button" data-pg="${p}"${p === S.page ? ' aria-current="page"' : ''}>${p}</button>`;
    btns += `<button type="button" data-pg="${S.page + 1}" ${S.page >= pages ? 'disabled' : ''} aria-label="หน้าถัดไป">›</button>`;
    return `<div class="ui-pager"><span>แสดง ${a}–${b} จาก ${N} สินค้า · ต่อหน้า <select class="kp-per" aria-label="จำนวนต่อหน้า">${[10, 25, 50, 100].map(v => `<option${v === S.per ? ' selected' : ''}>${v}</option>`).join('')}</select></span><div class="ui-pager-btns">${btns}</div></div>`;
  }
  const th = (label, k, cls) => `<th class="${cls || 'num'}" data-sort="${k}"${S.sort.k === k ? ` aria-sort="${S.sort.d < 0 ? 'descending' : 'ascending'}"` : ''}>${label}</th>`;

  function prodPanel(K) {
    const u = S.unit, fm = fmU(u), lc = lastComplete(S.mo);
    let rows = sortRows(prodData(K), K);
    const stLabels = K.st === 'past' ? [['bad', 'ไม่ถึงเป้า'], ['mid', 'เกือบถึง'], ['good', 'ถึงเป้า']] : [['bad', 'ช้ากว่าเป้า'], ['mid', 'ตามเป้า'], ['good', 'นำเป้า']];
    if (S.st) rows = rows.filter(r => S.st === 'none' ? r.st.k === 'none' : r.st.c === S.st && r.st.k !== 'none');
    const N = rows.length, view = rows.slice((S.page - 1) * S.per, S.page * S.per);
    const tools = `<div class="kp-tools">
      <input type="search" class="kp-search" id="kpSearch" placeholder="ค้นหาสินค้า / รหัส" value="${esc(S.q)}" aria-label="ค้นหาสินค้า">
      ${K.st === 'future' ? '' : `<div class="ui-presets" id="kpStFilter" role="group" aria-label="กรองตามสถานะ"><button type="button" data-st="" aria-pressed="${!S.st}">ทั้งหมด</button>${stLabels.map(([k, l]) => `<button type="button" data-st="${k}" aria-pressed="${S.st === k}">${l}</button>`).join('')}<button type="button" data-st="none" aria-pressed="${S.st === 'none'}">ไม่มีเป้า</button></div>`}
      <label class="kp-chk"><input type="checkbox" id="kpDisc" ${S.showDisc ? 'checked' : ''}> แสดงสินค้าเลิกผลิต</label></div>`;
    const infoTxt = `<b>สินค้าที่แสดง</b> สินค้าปกติ / สินค้าใหม่ที่มียอดใน 3 เดือนล่าสุด และทุกสินค้าที่ตั้งเป้าไว้ · ของแถม (ราคา 0) ไม่แสดง<br><b>สินค้าอื่น</b> ยอดของสินค้าที่ไม่ได้แสดงและของแถม เพื่อให้แถวรวมเท่ากับตัวเลขหลักด้านบนเสมอ<br>${S.F ? '' : 'ชี้ที่ช่องเพื่อดูเป้า / ควรได้ถึงวันนี้ / คาดการณ์ของช่องนั้น<br>'}กดชื่อสินค้าเพื่อเปิดหน้าเจาะสินค้า`;
    let head, body, foot;
    // แถว "สินค้าอื่น" + "รวม" (= ตัวเลขหลัก)
    const chs = S.F ? [S.F] : CH, shown = new Set(rowSkus(S.mo));
    const others = chs.map(c => { let aq = 0, ar = 0; Object.keys(A[S.mo] || {}).forEach(s => { if (!shown.has(s)) { const v = act(S.mo, s, c); aq += v[0]; ar += v[1]; } }); return { c, x: { aq, ar, tq: null, tr: null } }; });
    const oG = agg(K, others, u);
    if (!S.F) {
      head = `<tr>${th('สินค้า', 'name', '')}${CH.map(c => th(`${dot(c)}${c === 'Modern Trade' ? 'MT' : esc(c)}`, 'ch:' + c)).join('')}${th('รวม', 't')}</tr>`;
      const mcell = (c, x, sku) => {
        const g = agg(K, [{ c, x }], u), st = status(K, g);
        if (K.st === 'future') { const la = act(lc, sku, c)[u === 'rev' ? 1 : 0]; return `<td class="num kp-cell"><div class="kp-a">${g.t != null ? fm(g.t) : '<span class="ui-muted">—</span>'}</div><div class="kp-p flat">${la ? mShort(lc) + ' ' + fm(la) : ''}</div></td>`; }
        if (!g.a && g.t == null) return '<td class="num kp-cell"><span class="ui-muted">—</span></td>';
        if (K.st === 'cur' && isBulk(c) && !g.a) return `<td class="num kp-cell" data-tip="${esc(c + (c === 'ตัวแทน' ? ' สั่งเป็นก้อน' : ' ห้างส่งยอดเป็นรายเดือน') + ' · ยังไม่มียอดเดือนนี้ · เป้า ' + fm(g.t))}"><div class="kp-a"><span class="ui-muted">—</span></div><div class="kp-p flat">เป้า ${fm(g.t)}</div></td>`;
        const tick = K.st === 'cur' && !isBulk(c) ? K.el[c] / K.n : null;
        const tip = g.t != null ? `${c} · เป้า ${fm(g.t)}${K.st === 'cur' && !isBulk(c) ? ` · ควรได้ถึงวันนี้ ${fm(g.ex)} · คาดการณ์ ${fm(g.pj)}` : ''} · ${st.l}` : `${c} · ยังไม่ได้ตั้งเป้า`;
        return `<td class="num kp-cell" data-tip="${esc(tip)}"><div class="kp-a">${fm(g.a)}</div>${prog(g, st, tick)}</td>`;
      };
      body = view.map(r => `<tr>${nmCell(r.s)}${r.cells.map(({ c, x }) => mcell(c, x, r.s)).join('')}${K.st === 'future'
        ? `<td class="num kp-cell"><div class="kp-a">${r.g.t != null ? fm(r.g.t) : '—'}</div></td>`
        : `<td class="num kp-cell kp-tot" data-tip="${esc(`รวม · เป้า ${r.g.t != null ? fm(r.g.t) : '—'} · ${r.st.l}`)}"><div class="kp-a">${fm(r.g.a)}</div>${prog(r.g, r.st, K.st === 'cur' ? K.now / K.n : null)}</td>`}</tr>`).join('');
      const totC = CH.map(c => tot(K, [c], u)), all = tot(K, CH, u);
      const fcell = g => { const st = status(K, g); return K.st === 'future' ? `<td class="num"><div class="kp-a">${g.t != null ? fm(g.t) : '—'}</div></td>` : `<td class="num kp-cell"><div class="kp-a">${fm(g.a)}</div>${prog(g, st, null)}</td>`; };
      foot = `<tr class="kp-other"><td>สินค้าอื่น <span class="ui-muted">(ไม่ได้ตั้งเป้า + ของแถม)</span></td>${others.map(o => `<td class="num">${K.st === 'future' ? '' : fm(u === 'rev' ? o.x.ar : o.x.aq)}</td>`).join('')}<td class="num">${K.st === 'future' ? '' : fm(oG.a)}</td></tr>
        <tr><td>รวม</td>${totC.map(fcell).join('')}${fcell(all)}</tr>`;
    } else {
      const c = S.F, bulk = isBulk(c), dash = '<span class="ui-muted">—</span>';
      const cols = K.st === 'cur' ? [th('สินค้า', 'name', ''), th('เป้า', 't'), th('ทำได้', 'a'), th('ความคืบหน้า', 'pct'), th('ควรได้ถึงวันนี้', 'ex'), th('นำ / ช้า', 'gap'), th('คาดการณ์สิ้นเดือน', 'pj'), th('ราคาเฉลี่ย/ชิ้น', 'price'), '<th>สถานะ</th>']
        : K.st === 'past' ? [th('สินค้า', 'name', ''), th('เป้า', 't'), th('ทำได้', 'a'), th('ความคืบหน้า', 'pct'), th('ผลต่าง', 'gap'), th('ราคาเฉลี่ย/ชิ้น', 'price'), '<th>สถานะ</th>']
          : [th('สินค้า', 'name', ''), th('เป้า', 't'), `<th class="num">ยอดจริง ${mShort(lc)}</th>`, '<th class="num">เป้าเทียบยอดจริง</th>', th('ราคาเฉลี่ย/ชิ้น', 'price')];
      head = `<tr>${cols.join('')}</tr>`;
      const pr = x => `<span data-tip="${esc(priceNote(x.p))}">${money(x.p.v)}${x.p.src !== 'ch' ? ' <span class="ui-muted">*</span>' : ''}</span>`;
      body = view.map(r => {
        const x = r.cells[0].x, g = r.g, st = r.st, t = g.t != null ? fm(g.t) : dash;
        if (K.st === 'future') { const la = act(lc, r.s, c)[u === 'rev' ? 1 : 0]; return `<tr>${nmCell(r.s)}<td class="num">${t}</td><td class="num">${fm(la)}</td><td class="num">${g.t != null && la > 0 ? diffPct(g.t, la) : '—'}</td><td class="num">${pr(x)}</td></tr>`; }
        if (K.st === 'past') return `<tr>${nmCell(r.s)}<td class="num">${t}</td><td class="num">${fm(g.a)}</td><td class="num">${prog(g, st, null, true)}</td><td class="num">${g.t != null ? diffTxt(g.a - g.t, fm) : dash}</td><td class="num">${pr(x)}</td><td>${badge(st)}</td></tr>`;
        return `<tr>${nmCell(r.s)}<td class="num">${t}</td><td class="num">${fm(g.a)}</td><td class="num">${prog(g, st, bulk ? null : K.el[c] / K.n, true)}</td>
          <td class="num">${bulk || g.t == null ? dash : fm(g.ex)}</td><td class="num">${bulk || g.t == null ? dash : gapTxt(g.oa - g.ex, fm)}</td><td class="num">${bulk || !g.a ? dash : fm(g.pj)}</td><td class="num">${pr(x)}</td><td>${badge(st)}</td></tr>`;
      }).join('');
      const all = tot(K, [c], u), stA = status(K, all), n = cols.length;
      const fRow = K.st === 'future' ? `<td class="num">${all.t != null ? fm(all.t) : '—'}</td><td class="num">${fm(lcRows([c], u))}</td><td></td><td></td>`
        : K.st === 'past' ? `<td class="num">${all.t != null ? fm(all.t) : '—'}</td><td class="num">${fm(all.a)}</td><td class="num">${prog(all, stA, null, true)}</td><td class="num">${all.t != null ? diffTxt(all.a - all.t, fm) : ''}</td><td></td><td>${badge(stA)}</td>`
          : `<td class="num">${all.t != null ? fm(all.t) : '—'}</td><td class="num">${fm(all.a)}</td><td class="num">${prog(all, stA, bulk ? null : K.el[c] / K.n, true)}</td><td class="num">${bulk || all.t == null ? dash : fm(all.ex)}</td><td class="num">${bulk || all.t == null ? dash : gapTxt(all.oa - all.ex, fm)}</td><td class="num">${bulk ? dash : fm(all.pj)}</td><td></td><td>${badge(stA)}</td>`;
      foot = `<tr class="kp-other"><td>สินค้าอื่น <span class="ui-muted">(ไม่ได้ตั้งเป้า + ของแถม)</span></td><td></td><td class="num">${K.st === 'future' ? '' : fm(oG.a)}</td>${'<td></td>'.repeat(n - 3)}</tr><tr><td>รวม</td>${fRow}</tr>`;
    }
    const empty = !N ? `<tr><td colspan="9"><div class="ui-empty"><b>ไม่พบสินค้า</b>${S.q || S.st ? 'ลองล้างคำค้นหาหรือตัวกรองสถานะ' : 'เดือนนี้ยังไม่มีสินค้าที่ตั้งเป้า'}</div></td></tr>` : '';
    const cta = K.st === 'future' && !Object.keys(T[S.mo] || {}).length && ME.can_edit
      ? `<div class="ui-status warn" style="margin:4px 0 10px;"><b>เดือนนี้ยังไม่มีเป้า</b><span>กด "✏️ ตั้งเป้า" ด้านบน แล้วใช้ปุ่ม "คัดลอกเป้าเดือนก่อน" หรือ "ตั้งจากยอดจริง" เพื่อเริ่มเร็วๆ</span></div>` : '';
    return `<div class="hm-panel-h"><h2>แยกตามสินค้า${S.F ? ` <span class="kp-scope-l">${dot(S.F)}${esc(S.F)}</span>` : ''} ${info('kp-i-pt', infoTxt)}</h2>${tools}</div>${cta}
      <div class="table-wrap"><table class="ui-table hm-tbl kp-tbl${S.F ? '' : ' kp-mx'}" id="kpProdTbl" data-no-sort data-no-page><thead>${head}</thead><tbody>${body || empty}</tbody><tfoot>${foot}</tfoot></table></div>${pager(N)}`;
  }

  /* ───── โหมดตั้งเป้า ───── */
  let editOrder = null;   // ลำดับแถวคงที่ระหว่างกรอก (ไม่กระโดด)
  function editRows() {
    const q = S.q.trim().toLowerCase();
    let rows = rowSkus(S.mo);
    if (!editOrder || editOrder.mo !== S.mo) editOrder = { mo: S.mo, list: rows.slice().sort((a, b) => rev3(S.mo, b) - rev3(S.mo, a) || nameOf(a).localeCompare(nameOf(b), 'th')) };
    rows.forEach(s => { if (!editOrder.list.includes(s)) editOrder.list.push(s); });
    let list = editOrder.list.filter(s => rows.includes(s));
    if (q) list = list.filter(s => (nameOf(s) + ' ' + s).toLowerCase().includes(q));
    return list;
  }
  function renderEdit(K) {
    const chs = S.F ? [S.F] : CH, lc = lastComplete(S.mo), ok = canEdit(S.mo);
    const list = editRows(), N = list.length, view = list.slice((S.page - 1) * S.per, S.page * S.per), off = (S.page - 1) * S.per;
    const lockNote = K.st === 'past' ? (ok
      ? `<div class="ui-status warn" style="margin-bottom:10px;"><b>เดือนนี้จบแล้ว</b><span>คุณแก้ได้เพราะเป็นผู้ดูแลระบบ · ทุกการแก้เก็บประวัติ</span></div>`
      : `<div class="ui-status warn" style="margin-bottom:10px;"><b>🔒 เดือนนี้จบแล้ว ล็อกไว้</b><span>แก้ได้เฉพาะผู้ดูแลระบบ</span></div>`) : '';
    const cand = Object.keys(P).filter(s => !isGift(s) && !list.includes(s) && !rowSkus(S.mo).includes(s)).sort((a, b) => nameOf(a).localeCompare(nameOf(b), 'th'));
    const addDd = ok ? `<div class="ui-dd" id="kpAddDd"><button class="ui-dd-btn" type="button" data-dd="kpAddDd">＋ เพิ่มสินค้า</button><div class="ui-dd-menu" style="max-height:320px;overflow-y:auto;min-width:240px;">
        <div class="ui-dd-h">สินค้าที่ยังไม่อยู่ในตาราง</div>${cand.length ? cand.map(s => `<button class="ui-dd-item" type="button" data-add="${s}">${esc(nameOf(s))} <span class="ui-code kp-code">${s}</span></button>`).join('') : '<div class="ui-dd-h">ครบทุกสินค้าแล้ว</div>'}</div></div>` : '';
    const growDd = ok ? `<div class="ui-dd" id="kpGrowDd"><button class="ui-dd-btn" type="button" data-dd="kpGrowDd">📈 ตั้งจากยอดจริง</button><div class="ui-dd-menu kp-grow" style="right:0;left:auto;">
        <div class="ui-dd-h">ใช้ยอดจริงของ</div>
        <label class="kp-radio"><input type="radio" name="kpBase" value="last" checked> เดือนล่าสุดที่จบแล้ว (${mShort(lc)})</label>
        <label class="kp-radio"><input type="radio" name="kpBase" value="avg3"> เฉลี่ย 3 เดือน (${mShort(mAdd(lc, -2))}–${mShort(lc)})</label>
        <div class="ui-dd-h">บวกเพิ่ม</div>
        <div class="kp-row"><input type="number" id="kpGrowPct" class="kp-in" value="10" step="1" style="width:72px;"> % <span class="ui-muted">(ติดลบได้)</span></div>
        <div class="ui-dd-h">ใส่ในช่อง</div>
        <label class="kp-radio"><input type="radio" name="kpScope" value="empty" checked> เฉพาะช่องที่ยังว่าง</label>
        <label class="kp-radio"><input type="radio" name="kpScope" value="all"> ทุกช่อง (ทับของเดิม)</label>
        <div class="kp-row" style="justify-content:flex-end;"><button class="btn btn-primary" type="button" id="kpGrowGo">ใช้กับ ${S.F ? esc(S.F) : 'ทุกช่องทาง'}</button></div></div></div>` : '';
    const tools = `<div class="kp-tools">
      <input type="search" class="kp-search" id="kpSearch" placeholder="ค้นหาสินค้า / รหัส" value="${esc(S.q)}" aria-label="ค้นหาสินค้า">
      <label class="kp-chk"><input type="checkbox" id="kpDisc" ${S.showDisc ? 'checked' : ''}> แสดงสินค้าเลิกผลิต</label>
      ${ok ? `<button class="btn btn-ghost" type="button" id="kpCopyPrev" data-tip="ใช้เป้าของ ${mShort(mAdd(S.mo, -1))} เป็นจุดเริ่ม">📋 คัดลอกเป้าเดือนก่อน</button>${growDd}${addDd}
      <button class="btn btn-ghost" type="button" id="kpUndo" ${UNDO.length ? '' : 'disabled'} data-tip="ย้อนการแก้ล่าสุด (รวมการวางทีละหลายช่อง)">↶ ย้อนกลับ</button>` : ''}
      <button class="btn btn-ghost" type="button" id="kpHistBtn">🕘 ประวัติการแก้ไข</button>
      <span class="kp-saved" id="kpSaved">${saveMsg}</span></div>`;
    const cellH = (s, c, r, ci) => {
      const t = tq(S.mo, s, c), p = price(S.mo, s, c), la = act(lc, s, c)[0];
      const tip = `${c} · ขายจริง ${mShort(lc)} ${fmt(la)} ชิ้น · ราคาที่ใช้ ${money(p.v)}/ชิ้น (${priceNote(p)})`;
      return `<td class="num kp-ec" data-tip="${esc(tip)}"><input class="kp-in" inputmode="numeric" autocomplete="off" data-r="${r}" data-c="${ci}" data-s="${s}" data-ch="${esc(c)}" value="${t != null ? fmt(t) : ''}" placeholder="${la ? mShort(lc) + ' ' + fmt(la) : ''}" ${ok ? '' : 'disabled'} aria-label="${esc(nameOf(s))} · ${esc(c)} (ชิ้น)">
        <div class="kp-rv" id="kprv-${r}-${ci}">${t != null ? '≈ ' + money(Math.round(t * p.v)) : ''}</div></td>`;
    };
    const body = view.map((s, i) => `<tr>${nmCell(s)}${chs.map((c, ci) => cellH(s, c, off + i, ci)).join('')}<td class="num kp-etot" id="kprt-${off + i}"></td></tr>`).join('')
      || `<tr><td colspan="${chs.length + 2}"><div class="ui-empty"><b>ไม่พบสินค้า</b>ลองล้างคำค้นหา หรือกด "＋ เพิ่มสินค้า"</div></td></tr>`;
    const foot = `<tr><td>รวมเป้า</td>${chs.map((c, ci) => `<td class="num kp-etot" id="kpft-${ci}"></td>`).join('')}<td class="num kp-etot" id="kpft-all"></td></tr>
      <tr class="kp-other"><td>ขายจริง ${mShort(lc)} <span class="ui-muted">(สินค้าในตาราง ไว้เทียบ)</span></td>${chs.map(c => `<td class="num">${fmt(lcRows([c], 'qty'))} ชิ้น<div class="kp-rv">${money(lcRows([c], 'rev'))}</div></td>`).join('')}<td class="num">${fmt(lcRows(chs, 'qty'))} ชิ้น<div class="kp-rv">${money(lcRows(chs, 'rev'))}</div></td></tr>`;
    $('kpMain').innerHTML = `${lockNote}<section class="hm-panel">
      <div class="hm-panel-h"><h2>ตั้งเป้า ${mLong(S.mo)} ${info('kp-i-edit', `<b>กรอกจำนวนชิ้น</b> ต่อสินค้า ต่อช่องทาง · ยอดเงินคำนวณให้เอง (≈) จากราคาเฉลี่ยต่อชิ้นจริง 3 เดือนก่อนเดือนเป้า<br><b>บันทึกเอง</b> ทันทีที่ออกจากช่อง · ช่องว่าง = ไม่มีเป้า<br><b>ปุ่มลัด</b> Enter / ↓ ลงล่าง · ↑ ขึ้น · Tab ไปขวา · Esc ยกเลิกช่องนั้น<br><b>วางจาก Excel</b> ก๊อปทีละหลายช่องใน Excel แล้ววางที่ช่องแรก ระบบเติมไปทางขวาและลงล่างให้<br><b>ตัวเลขจางในช่องว่าง</b> ขายจริงเดือนล่าสุดที่จบแล้ว ไว้เทียบ<br><b>ยอดรวม</b> รวมช่องทางและรวมทั้งแบรนด์ให้เอง ไม่ต้องกรอก`)}</h2>${tools}</div>
      <div class="table-wrap"><table class="ui-table hm-tbl kp-tbl kp-edit" data-no-sort data-no-page><thead><tr><th>สินค้า</th>${chs.map(c => `<th class="num">${dot(c)}${c === 'Modern Trade' ? 'MT' : esc(c)} <span class="ui-muted">(ชิ้น)</span></th>`).join('')}<th class="num">รวม</th></tr></thead>
      <tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div>${pager(N)}</section>`;
    editTotals();
  }
  function editTotals() {
    const chs = S.F ? [S.F] : CH, list = editRows(); let aq = 0, ar = 0;
    document.querySelectorAll('#kpMain .kp-etot[id^="kprt-"]').forEach(td => {
      const s = list[+td.id.slice(5)]; let q = 0, r = 0, any = false;
      chs.forEach(c => { const t = tq(S.mo, s, c); if (t != null) { any = true; q += t; r += Math.round(t * price(S.mo, s, c).v); } });
      td.innerHTML = any ? `${fmt(q)} ชิ้น<div class="kp-rv">${money(r)}</div>` : '<span class="ui-muted">—</span>';
    });
    chs.forEach((c, ci) => {
      let q = 0, r = 0; Object.keys(T[S.mo] || {}).forEach(s => { const t = tq(S.mo, s, c); if (t != null) { q += t; r += Math.round(t * price(S.mo, s, c).v); } });
      aq += q; ar += r; const td = $('kpft-' + ci); if (td) td.innerHTML = `${fmt(q)} ชิ้น<div class="kp-rv">${money(r)}</div>`;
    });
    const tdA = $('kpft-all'); if (tdA) tdA.innerHTML = `${fmt(aq)} ชิ้น<div class="kp-rv">${money(ar)}</div>`;
    const sv = $('kpSaved'); if (sv) sv.textContent = saveMsg;
    const ub = $('kpUndo'); if (ub) ub.disabled = !UNDO.length;
  }

  // แก้ค่า (ทุกทางผ่านตรงนี้ → เก็บประวัติ + ย้อนกลับได้)
  function setT(mo, s, c, v, batch) {
    const old = tq(mo, s, c), nu = v == null || v <= 0 ? null : Math.round(v);
    if (old === nu) return;
    if (nu == null) { if (T[mo] && T[mo][s]) { delete T[mo][s][c]; if (!Object.keys(T[mo][s]).length) delete T[mo][s]; } }
    else ((T[mo] ||= {})[s] ||= {})[c] = nu;
    batch.push({ mo, s, c, old, nu });
  }
  // แก้ค่าในหน้าแล้ว → บันทึกลงฐานข้อมูล (ถ้าไม่สำเร็จ คืนค่าเดิมทั้งก้อน)
  function setMsg(t) { saveMsg = t; const sv = $('kpSaved'); if (sv) sv.textContent = t; }
  function commit(batch, how, noUndo) {
    if (!batch.length) return 0;
    if (!noUndo) UNDO.push(batch);
    save(batch, how || '', noUndo);
    return batch.length;
  }
  async function save(batch, how, noUndo) {
    const mo = batch[0].mo, rows = batch.map(b => ({ s: b.s, c: b.c, q: b.nu }));
    setMsg('กำลังบันทึก…');
    try {
      for (let i = 0; i < rows.length; i += 300) await Auth.rpc('kpi_set_targets', { p_month: mo + '-01', p_rows: rows.slice(i, i + 300), p_how: how || null });
      const ts = new Date(), who = myName();
      if (CACHE[mo]) batch.forEach(b => CACHE[mo].HIST.unshift({ ts, who, how, ...b }));
      setMsg(`✓ บันทึกแล้ว ${ts.toTimeString().slice(0, 5)}`);
    } catch (e) {
      const tt = CACHE[mo] && CACHE[mo].T;
      if (tt) batch.slice().reverse().forEach(b => { if (b.old == null) { if (tt[mo] && tt[mo][b.s]) { delete tt[mo][b.s][b.c]; if (!Object.keys(tt[mo][b.s]).length) delete tt[mo][b.s]; } } else ((tt[mo] ||= {})[b.s] ||= {})[b.c] = b.old; });
      if (!noUndo) { const i = UNDO.indexOf(batch); if (i >= 0) UNDO.splice(i, 1); }
      setMsg(''); toast('บันทึกไม่สำเร็จ ค่าที่แก้ถูกคืนกลับ: ' + (e.message || e));
      if (onPage()) render();
    }
  }
  const parseNum = t => { const v = String(t ?? '').replace(/[,\s฿]/g, ''); if (v === '') return null; const n = Number(v); return isFinite(n) && n >= 0 ? n : NaN; };

  /* ───── ป๊อปอัป / แจ้งเตือน (ไม่ใช้ alert ของ browser) ───── */
  function toast(msg) {
    let el = $('kpToast'); if (!el) { el = document.createElement('div'); el.id = 'kpToast'; el.className = 'kp-toast'; document.documentElement.appendChild(el); }
    el.classList.toggle('ui-light', document.body.classList.contains('light-theme'));
    el.textContent = msg; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2600);
  }
  function modal(html) {
    closeModal();
    const bg = document.createElement('div'); bg.className = 'kp-modal-bg'; bg.id = 'kpModal';
    bg.innerHTML = `<div class="kp-modal" role="dialog" aria-modal="true">${html}</div>`;
    bg.addEventListener('click', e => { if (e.target === bg) closeModal(); });
    document.body.appendChild(bg); const f = bg.querySelector('button'); if (f) f.focus();
    return bg;
  }
  function closeModal() { const m = $('kpModal'); if (m) m.remove(); }
  function ask(title, text, buttons) {   // buttons: [[label, fn, primary]]
    const bg = modal(`<h3>${title}</h3><p>${text}</p><div class="kp-modal-btns">${buttons.map((b, i) => `<button class="btn ${b[2] ? 'btn-primary' : 'btn-ghost'}" type="button" data-i="${i}">${b[0]}</button>`).join('')}</div>`);
    bg.querySelectorAll('[data-i]').forEach(btn => btn.addEventListener('click', () => { closeModal(); const f = buttons[+btn.dataset.i][1]; if (f) f(); }));
  }
  function showHistory() {
    const rows = (CACHE[S.mo] ? CACHE[S.mo].HIST : []), per = 10, pages = Math.max(1, Math.ceil(rows.length / per));
    if (histPage > pages) histPage = pages;
    const view = rows.slice((histPage - 1) * per, histPage * per);
    const btns = pages > 1 ? `<div class="ui-pager"><span>${rows.length} รายการ</span><div class="ui-pager-btns">${Array.from({ length: pages }, (_, i) => `<button type="button" data-hp="${i + 1}"${i + 1 === histPage ? ' aria-current="page"' : ''}>${i + 1}</button>`).join('')}</div></div>` : '';
    const bg = modal(`<h3>🕘 ประวัติการแก้เป้า · ${mLong(S.mo)}</h3>
      ${rows.length ? `<div class="table-wrap"><table class="ui-table hm-tbl" data-no-sort data-no-page><thead><tr><th>เวลา</th><th>ผู้แก้</th><th>สินค้า</th><th>ช่องทาง</th><th class="num">จาก</th><th class="num">เป็น</th></tr></thead><tbody>
      ${view.map(h => `<tr><td>${h.ts.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })} ${h.ts.toTimeString().slice(0, 5)}</td><td>${esc(h.who)}${h.how ? ` <span class="ui-muted">· ${h.how}</span>` : ''}</td><td>${esc(nameOf(h.s))}</td><td>${esc(h.c)}</td><td class="num">${h.old == null ? '—' : fmt(h.old)}</td><td class="num">${h.nu == null ? '—' : fmt(h.nu)}</td></tr>`).join('')}</tbody></table></div>${btns}`
        : '<div class="ui-empty"><b>ยังไม่มีการแก้ไขในเดือนนี้</b>ทุกการแก้จะเก็บว่าใครแก้ เมื่อไหร่ จากเท่าไหร่เป็นเท่าไหร่</div>'}
      <div class="kp-modal-btns"><button class="btn btn-ghost" type="button" data-close>ปิด</button></div>`);
    bg.querySelector('[data-close]').addEventListener('click', closeModal);
    bg.querySelectorAll('[data-hp]').forEach(b => b.addEventListener('click', () => { histPage = +b.dataset.hp; showHistory(); }));
  }

  /* ───── การกระทำ ───── */
  function copyPrev() {
    const src = mAdd(S.mo, -1), chs = S.F ? [S.F] : CH, has = T[src] && Object.keys(T[src]).length;
    if (!has) { toast(`${mLong(src)} ยังไม่มีเป้าให้คัดลอก`); return; }
    const run = mode => {
      const batch = [];
      Object.keys(T[src]).forEach(s => chs.forEach(c => { const v = tq(src, s, c); if (v == null) return; if (mode === 'empty' && tq(S.mo, s, c) != null) return; setT(S.mo, s, c, v, batch); }));
      const n = commit(batch, 'คัดลอกเป้าเดือนก่อน'); render(); toast(n ? `คัดลอกแล้ว ${fmt(n)} ช่อง` : 'ไม่มีช่องที่ต้องเปลี่ยน');
    };
    const cur = chs.some(c => Object.keys(T[S.mo] || {}).some(s => tq(S.mo, s, c) != null));
    if (!cur) { run('all'); return; }
    ask('คัดลอกเป้าเดือนก่อน', `เดือนนี้มีเป้าอยู่แล้วบางช่อง จะใส่เป้าของ ${mLong(src)} แบบไหน`, [['เฉพาะช่องที่ยังว่าง', () => run('empty'), true], ['ทับทุกช่อง', () => run('all')], ['ยกเลิก', null]]);
  }
  function growFromActual() {
    const base = (document.querySelector('input[name="kpBase"]:checked') || {}).value || 'last';
    const scope = (document.querySelector('input[name="kpScope"]:checked') || {}).value || 'empty';
    const pct = parseFloat(($('kpGrowPct') || {}).value); if (!isFinite(pct)) { toast('กรอก % ให้ถูกต้อง'); return; }
    const lc = lastComplete(S.mo), ms = base === 'last' ? [lc] : [mAdd(lc, -2), mAdd(lc, -1), lc], chs = S.F ? [S.F] : CH, batch = [];
    editRows().forEach(s => chs.forEach(c => {
      if (scope === 'empty' && tq(S.mo, s, c) != null) return;
      const v = ms.reduce((a, m) => a + Math.max(0, act(m, s, c)[0]), 0) / ms.length;
      if (v > 0) setT(S.mo, s, c, nice(v * (1 + pct / 100)), batch);
    }));
    const n = commit(batch, `ยอดจริง${base === 'last' ? mShort(lc) : 'เฉลี่ย 3 เดือน'} ${pct >= 0 ? '+' : ''}${pct}%`);
    render(); toast(n ? `ตั้งเป้าแล้ว ${fmt(n)} ช่อง` : 'ไม่มีช่องที่ต้องเปลี่ยน');
  }
  function undo() {
    const b = UNDO[UNDO.length - 1]; if (!b) return;
    if (b[0].mo !== S.mo) { toast(`การแก้ล่าสุดอยู่เดือน ${mLong(b[0].mo)} — เปลี่ยนเดือนก่อนแล้วค่อยย้อนกลับ`); return; }
    UNDO.pop();
    const back = []; b.slice().reverse().forEach(x => setT(x.mo, x.s, x.c, x.old, back));
    commit(back, 'ย้อนกลับ', true); render(); toast(`ย้อนกลับ ${fmt(back.length)} ช่องแล้ว`);
  }
  function focusCell(r, c) {
    const per = S.per, page = Math.floor(r / per) + 1;
    if (page !== S.page) { S.page = page; render(); }
    const el = document.querySelector(`.kp-in[data-r="${r}"][data-c="${c}"]`); if (el) { el.focus(); el.select(); }
  }
  function commitInput(el) {
    const v = parseNum(el.value);
    if (Number.isNaN(v)) { el.classList.add('is-err'); toast('กรอกเป็นตัวเลขจำนวนชิ้นเท่านั้น'); const t = tq(S.mo, el.dataset.s, el.dataset.ch); el.value = t != null ? fmt(t) : ''; setTimeout(() => el.classList.remove('is-err'), 1200); return; }
    const batch = []; setT(S.mo, el.dataset.s, el.dataset.ch, v, batch);
    if (commit(batch, '')) {
      const t = tq(S.mo, el.dataset.s, el.dataset.ch), p = price(S.mo, el.dataset.s, el.dataset.ch);
      el.value = t != null ? fmt(t) : '';
      const rv = $(`kprv-${el.dataset.r}-${el.dataset.c}`); if (rv) rv.textContent = t != null ? '≈ ' + money(Math.round(t * p.v)) : '';
      el.classList.remove('is-saved'); void el.offsetWidth; el.classList.add('is-saved');
      editTotals(); renderCards(ctx(S.mo)); if (window.UI) UI.fit();
    } else { const t = tq(S.mo, el.dataset.s, el.dataset.ch); el.value = t != null ? fmt(t) : ''; }
  }
  function pasteGrid(el, text) {
    const lines = text.replace(/\r/g, '').split('\n'); while (lines.length && lines[lines.length - 1] === '') lines.pop();
    const grid = lines.map(l => l.split('\t')), list = editRows(), chs = S.F ? [S.F] : CH, r0 = +el.dataset.r, c0 = +el.dataset.c, batch = [];
    let bad = 0;
    grid.forEach((row, i) => row.forEach((val, j) => {
      const s = list[r0 + i], c = chs[c0 + j]; if (!s || !c) return;
      const v = parseNum(val); if (Number.isNaN(v)) { bad++; return; }
      setT(S.mo, s, c, v, batch);
    }));
    const n = commit(batch, 'วางจาก Excel'); render(); focusCell(r0, c0);
    toast(`วางแล้ว ${fmt(n)} ช่อง${bad ? ` · ข้าม ${bad} ช่องที่ไม่ใช่ตัวเลข` : ''}`);
  }

  /* ───── ผูก event ───── */
  document.addEventListener('click', e => {
    if (!onPage()) return;
    const t = e.target;
    const b = t.closest('button');
    if (!t.closest('.ads-info-wrap')) document.querySelectorAll('.ads-info-popover').forEach(p => { p.style.display = 'none'; });
    if (!t.closest('.ui-dd')) document.querySelectorAll('#page-kpi .ui-dd.is-open').forEach(d => d.classList.remove('is-open'));
    if (!b) return;
    if (b.closest('#kpMonthPresets')) { goMonth(presetMonth(b.dataset.p)); return; }
    if (b.closest('#kpMode')) { S.mode = b.dataset.m; S.page = 1; S.st = ''; editOrder = null; render(); return; }
    if (b.closest('#kpUnit')) { S.unit = b.dataset.u; render(); return; }
    if (b.closest('#kpStFilter')) { S.st = b.dataset.st; S.page = 1; render(); return; }
    if (b.dataset.pg) { S.page = +b.dataset.pg; render(); return; }
    if (b.dataset.dd) { const d = $(b.dataset.dd); const open = !d.classList.contains('is-open'); document.querySelectorAll('#page-kpi .ui-dd.is-open').forEach(x => x.classList.remove('is-open')); d.classList.toggle('is-open', open); return; }
    if (b.dataset.add) { (ADDED[S.mo] ||= new Set()).add(b.dataset.add); const s = b.dataset.add; render(); const r = editRows().indexOf(s); if (r >= 0) focusCell(r, 0); toast(`เพิ่ม ${nameOf(s)} แล้ว`); return; }
    if (b.id === 'kpCopyPrev') { copyPrev(); return; }
    if (b.id === 'kpGrowGo') { $('kpGrowDd').classList.remove('is-open'); growFromActual(); return; }
    if (b.id === 'kpUndo') { undo(); return; }
    if (b.id === 'kpHistBtn') { histPage = 1; showHistory(); return; }
  });
  document.addEventListener('click', e => {   // เรียงตาราง
    if (!onPage()) return;
    const h = e.target.closest('#kpProdTbl th[data-sort]'); if (!h) return;
    const k = h.dataset.sort; S.sort = S.sort.k === k ? { k, d: -S.sort.d } : { k, d: k === 'name' ? 1 : -1 }; S.page = 1; render();
  });
  document.addEventListener('change', e => {
    if (!onPage()) return;
    const t = e.target;
    if (t.id === 'kpMonth') { if (t.value && t.value !== S.mo) goMonth(t.value); return; }
    if (t.id === 'filterChannel') { S.page = 1; S.st = ''; S.sort = { k: 't', d: -1 }; render(); return; }
    if (t.classList.contains('kp-per')) { S.per = +t.value; S.page = 1; render(); return; }
    if (t.id === 'kpDisc') { S.showDisc = t.checked; S.page = 1; render(); return; }
    if (t.classList.contains('kp-in') && t.dataset.s) { commitInput(t); }
  });
  let qTimer = null;
  document.addEventListener('input', e => {
    if (!onPage() || e.target.id !== 'kpSearch') return;
    clearTimeout(qTimer); const v = e.target.value;
    qTimer = setTimeout(() => { S.q = v; S.page = 1; render(); const s = $('kpSearch'); if (s) { s.focus(); s.setSelectionRange(v.length, v.length); } }, 250);
  });
  // คลิกช่อง = เลือกทั้งช่อง พิมพ์ทับได้ทันทีแบบ Excel (กันเมาส์ปล่อยแล้วยกเลิกการเลือก)
  document.addEventListener('focusin', e => { const t = e.target; if (t.classList && t.classList.contains('kp-in') && t.dataset.s) { t._orig = t.value; t.select(); t._justFocused = true; } });
  document.addEventListener('mouseup', e => { const t = e.target; if (t._justFocused) { t._justFocused = false; if (t.selectionStart === t.selectionEnd) t.select(); } });
  document.addEventListener('keydown', e => {
    const el = e.target;
    if (!onPage()) return;
    if (e.key === 'Escape' && $('kpModal')) { closeModal(); return; }
    if (!el.classList || !el.classList.contains('kp-in') || !el.dataset.s) return;
    const r = +el.dataset.r, c = +el.dataset.c, ncol = (S.F ? 1 : CH.length);
    const go = (rr, cc) => { if (rr < 0 || cc < 0 || cc >= ncol || rr >= editRows().length) return; e.preventDefault(); el.blur(); focusCell(rr, cc); };
    if (e.key === 'Enter') { go(e.shiftKey ? r - 1 : r + 1, c); if (r + 1 >= editRows().length && !e.shiftKey) { e.preventDefault(); el.blur(); } }
    else if (e.key === 'ArrowDown') go(r + 1, c);
    else if (e.key === 'ArrowUp') go(r - 1, c);
    else if (e.key === 'ArrowRight' && el.selectionStart === el.value.length && el.selectionEnd === el.value.length) go(r, c + 1);
    else if (e.key === 'ArrowLeft' && el.selectionStart === 0 && el.selectionEnd === 0) go(r, c - 1);
    else if (e.key === 'Escape') { el.value = el._orig ?? el.value; el.blur(); }
  });
  document.addEventListener('paste', e => {
    const el = e.target; if (!onPage() || !el.classList || !el.classList.contains('kp-in') || !el.dataset.s) return;
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!/[\t\n]/.test(text.replace(/\n$/, ''))) return;   // ค่าเดียว → วางปกติ
    e.preventDefault(); pasteGrid(el, text);
  });

  // ใช้จากปุ่มใน HTML
  window.kpSetChannel = c => { const sel = $('filterChannel'); if (sel) sel.value = c; S.page = 1; S.st = ''; S.sort = { k: 't', d: -1 }; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  window.kpOpenSku = s => { if (typeof openSkuAnalysis === 'function') openSkuAnalysis(s); };

  const SKEL = `<div class="hm-head"><div><div class="skeleton" style="height:22px;width:200px;margin-bottom:8px;"></div><div class="skeleton" style="height:13px;width:260px;"></div></div></div>
    <div class="skeleton" style="height:106px;border-radius:10px;"></div><div class="hm-gap"></div><div class="skeleton" style="height:300px;border-radius:10px;"></div>`;
  function shell() {
    const pg = $('page-kpi');
    if (!$('kpHead')) pg.innerHTML = `<div class="hm-head" id="kpHead"></div><div id="kpNote"></div><section class="ui-metrics hm-metrics" id="kpCards" aria-label="ตัวเลขหลัก"></section><div class="hm-gap"></div><div id="kpMain"></div>`;
  }
  let seq = 0;
  async function goMonth(mo, force) {
    const my = ++seq, pg = $('page-kpi');
    if (!CACHE[mo] || force) { if (!CACHE[S.mo || mo]) pg.innerHTML = SKEL; else pg.style.opacity = '.55'; }
    let got;
    try { got = await load(mo, force); }
    catch (e) { if (my !== seq) return; pg.style.opacity = ''; pg.innerHTML = `<div class="error-banner" style="display:block;">โหลดข้อมูลเป้าหมาย KPI ไม่สำเร็จ: ${esc(e.message || e)}</div>`; return; }
    if (my !== seq) return;
    pg.style.opacity = '';
    if (S.mo !== got) { S.mo = got; S.page = 1; S.st = ''; editOrder = null; }
    shell(); render();
  }
  // เรียกจาก dashboard: เข้าหน้า (reload = true → ดึงยอดล่าสุด) / เปลี่ยนธีม (reload = false)
  window.renderKpiPage = reload => { if (!S.mo || reload) return goMonth(S.mo, true); use(S.mo); shell(); render(); };

  if (!document.getElementById('kpStyle')) {
    const st = document.createElement('style'); st.id = 'kpStyle'; st.textContent = `/* ===== เป้าหมาย KPI (2026-10-07) — ใช้ชิ้นส่วน ui.css + .hm-* ของหน้าแรก ===== */
.kp-head-r { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.hm-head h1 .ui-badge { font-size:12px; font-weight:600; }
.kp-scope { font-size:11px; font-weight:500; color:var(--text3); }
.kp-scope-l { display:inline-flex; align-items:center; font-size:13px; font-weight:400; color:var(--text3); }
.kp-muted { color:var(--text3); font-weight:400; }
.kp-c-good { color:var(--good); } .kp-c-bad { color:var(--bad); } .kp-c-mid { color:var(--accent-text); } .kp-c-flat { color:var(--text2); }
/* แถบความคืบหน้าในการ์ด + ในตาราง · ขีด = ผ่านไปกี่ % ของเดือน */
.kp-mbar { position:relative; display:block; height:6px; margin-top:10px; border-radius:3px; background:var(--bg3); }
.kp-mbar b { display:block; height:100%; border-radius:3px; background:var(--c, var(--accent)); }
.kp-mbar i, .kp-bar i { position:absolute; top:-3px; width:2px; height:12px; margin-left:-1px; border-radius:1px; background:var(--text); opacity:.55; }
.kp-bar { position:relative; display:inline-block; flex:none; width:52px; height:6px; border-radius:3px; background:var(--bg3); }
.kp-bar b { position:absolute; left:0; top:0; bottom:0; border-radius:3px; background:var(--c, var(--accent)); }
.kp-p { display:flex; align-items:center; justify-content:flex-end; gap:6px; margin-top:3px; font-size:12px; font-weight:600; font-variant-numeric:tabular-nums; white-space:nowrap; }
.kp-p .kp-pct { min-width:34px; text-align:right; }
.kp-p.good { color:var(--good); } .kp-p.mid { color:var(--accent-text); } .kp-p.bad { color:var(--bad); } .kp-p.flat { color:var(--text3); font-weight:400; }
.kp-p.is-wide { margin-top:0; } .kp-p.is-wide .kp-bar { width:96px; }
.kp-a { font-weight:600; color:var(--text); font-variant-numeric:tabular-nums; white-space:nowrap; }
/* ตาราง */
.kp-tbl td { vertical-align:middle; }
.kp-tbl th:first-child, .kp-tbl td:first-child { text-align:left; }
.kp-tbl tfoot td { font-weight:600; color:var(--text); }
.kp-tbl tr.kp-other td { font-weight:400; color:var(--text2); }
.kp-mx td.kp-cell, .kp-mx th.num { min-width:104px; }
.kp-mx td.kp-tot { background:color-mix(in srgb, var(--accent) 5%, transparent); }
.kp-nmc { min-width:190px; max-width:260px; white-space:normal !important; }
.kp-nm { font-weight:600; color:var(--text); }
.kp-nm.is-link { cursor:pointer; } .kp-nm.is-link:hover { color:var(--accent-text); text-decoration:underline; }
.kp-nmc .ui-badge { margin-left:6px; font-size:11px; font-weight:500; }
.kp-code { display:block; margin-top:1px; font-size:11px; color:var(--text3); }
.ui-dd-item .kp-code { display:inline; margin-left:6px; }
.kp-tbl th .ui-chdot, .kp-scope-l .ui-chdot { margin-right:6px; }
/* แถบเครื่องมือของแผง */
.kp-tools { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.kp-search { width:200px; padding:6px 10px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg); color:var(--text); font:inherit; font-size:13px; }
.kp-search:focus { outline:none; border-color:var(--accent); }
.kp-chk { display:inline-flex; align-items:center; gap:6px; font-size:13px; color:var(--text2); cursor:pointer; white-space:nowrap; }
.kp-chk input, .kp-radio input { accent-color:var(--accent); }
.kp-saved { font-size:12px; color:var(--good); white-space:nowrap; }
.ui-pager select { margin-left:4px; padding:2px 6px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg2); color:var(--text); font:inherit; font-size:12px; }
/* โหมดตั้งเป้า */
.kp-edit td { padding-top:6px; padding-bottom:6px; }
.kp-in { width:92px; padding:5px 8px; border:1px solid var(--border); border-radius:var(--r-sm); background:var(--bg); color:var(--text);
  font:inherit; font-size:13px; font-weight:600; text-align:right; font-variant-numeric:tabular-nums; }
.kp-in::placeholder { color:var(--text3); font-weight:400; font-size:12px; opacity:.8; }
.kp-in:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-soft); }
.kp-in:disabled { border-color:transparent; background:transparent; color:var(--text2); }
.kp-in.is-saved { animation:kpSaved 1.3s ease; }
.kp-in.is-err { border-color:var(--bad); box-shadow:0 0 0 2px color-mix(in srgb, var(--bad) 22%, transparent); }
@keyframes kpSaved { 0% { border-color:var(--good); box-shadow:0 0 0 2px color-mix(in srgb, var(--good) 28%, transparent); } 100% { } }
.kp-rv { margin-top:2px; min-height:15px; font-size:11.5px; font-weight:400; color:var(--text3); font-variant-numeric:tabular-nums; }
.kp-etot { color:var(--text); font-weight:600; white-space:nowrap; }
.kp-grow { padding:6px 4px 10px; min-width:270px; }
.kp-radio { display:flex; align-items:center; gap:8px; padding:5px 12px; font-size:13px; color:var(--text2); cursor:pointer; }
.kp-row { display:flex; align-items:center; gap:8px; padding:4px 12px; font-size:13px; color:var(--text2); }
.kp-grow .kp-in { font-weight:400; }
/* ป๊อปอัป + แจ้งเตือน */
.kp-modal-bg { position:fixed; inset:0; z-index:400; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,.45); }
.kp-modal { width:min(640px, 92vw); padding:18px 20px; border:1px solid var(--border); border-radius:12px; background:var(--bg2); box-shadow:var(--shadow-pop); color:var(--text2); font-size:13px; }
.kp-modal h3 { margin:0 0 8px; font-size:16px; font-weight:600; color:var(--text); }
.kp-modal p { margin:0 0 14px; line-height:1.7; }
.kp-modal-btns { display:flex; justify-content:flex-end; gap:8px; margin-top:14px; }
.kp-toast { position:fixed; right:22px; bottom:22px; z-index:450; max-width:360px; padding:10px 14px; border-radius:10px; background:var(--text); color:var(--bg);
  font-family:var(--font); font-size:13px; box-shadow:var(--shadow-pop); opacity:0; transform:translateY(8px); transition:opacity .2s, transform .2s; pointer-events:none; }
.kp-toast.on { opacity:1; transform:none; }
/* เส้นประใน legend */
.ui-legend i.kp-dash { background:repeating-linear-gradient(90deg, var(--c) 0 4px, transparent 4px 7px) !important; }
`; document.head.appendChild(st);
  }
})();
