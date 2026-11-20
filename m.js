// m.js — มุมมองมือถือของ Deesay (m.html) · 2026-11-20
//   หน้า 1 สรุปภาพรวม: ยอดขาย (sales_summary — แหล่งเดียวกับหน้าภาพรวมยอดขาย) + ค่า Ads (mv_ad_spend_daily — แหล่งเดียวกับ Ad Performance) ของทุกช่องทาง
//     · ยอดบนการ์ด = ทั้งช่วงที่เลือก · ป้าย % = เทียบวันเดียวกันของเดือนก่อน โดยตัดวันที่ยอดยังเข้าไม่ครบออก (เหมือนหน้าบนคอม)
//     · Facebook PR นับรวมในค่า Ads ของ Facebook · ตัวแทน / Modern Trade ไม่มี Ads ของตัวเอง · % ค่า Ads รวม = ค่า Ads ÷ ยอดขายออนไลน์
//   หน้า 2 อนุมัติ Promotion (เฉพาะบัญชีที่มีสิทธิ์หน้าผู้บริหาร — เห็นต้นทุน): ใช้คำสั่งชุดเดียวกับ promo.js (promo_list / promo_calc / promo_decide / promo_counter)
//   ไม่มีกราฟ · ตัวเลขไม่ต้องกดดูที่มา (ดูละเอียดที่หน้าเต็ม dashboard.html?full=1)
(function () {
  const $ = id => document.getElementById(id), app = $('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const n0 = v => Math.round(+v || 0).toLocaleString('en-US'), n2 = v => (+v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const pD = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addD = (s, n) => { const d = pD(s); d.setDate(d.getDate() + n); return iso(d); };
  const dTh = s => { const d = pD(s); return d.getDate() + ' ' + TH[d.getMonth()]; };
  const rngTh = (a, b) => a === b ? dTh(a) : (a.slice(0, 7) === b.slice(0, 7) ? pD(a).getDate() + '–' + dTh(b) : dTh(a) + ' – ' + dTh(b));
  const yTh = s => (pD(s).getFullYear() + 543);
  // ช่วงเทียบ = วันเดียวกันของเดือนก่อน (กติกาเดียวกับ dashboard.html getPrevPeriodRange)
  const shiftM = (s, n) => { const d = pD(s), t = new Date(d.getFullYear(), d.getMonth() + n, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); t.setDate(Math.min(d.getDate(), last)); return iso(t); };
  const prevRange = (from, to) => { const f = pD(from), t = pD(to), n = (t.getFullYear() - f.getFullYear()) * 12 + t.getMonth() - f.getMonth() + 1, nx = new Date(t); nx.setDate(t.getDate() + 1);
    if (f.getDate() === 1 && nx.getDate() === 1) return { from: iso(new Date(f.getFullYear(), f.getMonth() - n, 1)), to: iso(new Date(f.getFullYear(), f.getMonth(), 0)) };
    return { from: shiftM(from, -n), to: shiftM(to, -n) }; };
  const toast = t => { const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; document.body.appendChild(e); setTimeout(() => e.remove(), 2600); };

  // ---------- เรียกข้อมูล (ส่ง token ของคนที่ login · แบ่งหน้าทีละ 1,000 แถว) ----------
  const hdr = () => ({ apikey: window.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + Auth.token(), 'Content-Type': 'application/json' });
  async function getAll(url, opt) { const out = [];
    for (let off = 0; ; off += 1000) { const res = await fetch(`${window.SUPABASE_URL}/rest/v1/${url}${url.includes('?') ? '&' : '?'}limit=1000&offset=${off}`, Object.assign({ headers: hdr() }, opt || {}));
      const rows = await res.json(); if (!Array.isArray(rows)) { if (rows && rows.message) throw new Error(rows.message); return rows; } out.push(...rows); if (rows.length < 1000) break; }
    return out; }
  const rpcAll = (name, args) => getAll('rpc/' + name, { method: 'POST', body: JSON.stringify(args || {}) });
  const rpc = (name, args) => Auth.rpc(name, args);

  // ---------- หน้า 1: สรุปภาพรวม ----------
  const CH = [['TikTok', '#111827', '#e5e7eb'], ['Facebook', '#1877f2', '#5b8def'], ['Shopee', '#ee4d2d', '#f2643f'], ['Lazada', '#f0168c', '#ff4fb0'], ['ตัวแทน', '#0f9d8a', '#2dd4bf'], ['Modern Trade', '#7c5cff', '#a78bfa']];
  const ONLINE = ['TikTok', 'Facebook', 'Shopee', 'Lazada'];
  const today = () => iso(new Date());
  const PRESETS = { month: ['เดือนนี้', () => { const t = today(); return [t.slice(0, 8) + '01', t]; }], last: ['เดือนก่อน', () => { const t = pD(today()); return [iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), iso(new Date(t.getFullYear(), t.getMonth(), 0))]; }],
    d7: ['7 วันล่าสุด', () => [addD(today(), -6), today()]], yest: ['เมื่อวาน', () => [addD(today(), -1), addD(today(), -1)]] };
  let preset = 'month', sumSeq = 0;
  const chip = (cur, prv, neutral) => { if (!(prv > 0)) return ''; const d = (cur - prv) / prv * 100, cls = neutral || Math.abs(d) < 3 ? 'fl' : d > 0 ? 'up' : 'dn'; return `<span class="chip ${cls}">${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}%</span>`; };
  const adChOf = c => CH.map(x => x[0]).find(n => String(c || '').toLowerCase().startsWith(n.toLowerCase())) || '_other';
  function sumShell() {
    app.innerHTML = `<div class="top"><div class="t1"><b>สรุปภาพรวม</b><span class="st" id="sumSt" hidden><i></i><span></span></span></div>
        <div class="dt"><select id="sumPre" aria-label="ช่วงวันที่">${Object.entries(PRESETS).map(([k, v]) => { const [a, b] = v[1](); return `<option value="${k}"${k === preset ? ' selected' : ''}>${v[0]} · ${rngTh(a, b)} ${yTh(b)}</option>`; }).join('')}</select></div></div>
      <div class="body" id="sumBody"><div class="sk big"></div>${'<div class="sk"></div>'.repeat(4)}</div>`;
    $('sumPre').onchange = e => { preset = e.target.value; loadSum(); };
  }
  async function loadSum() {
    const my = ++sumSeq, [from, to] = PRESETS[preset][1](), body = $('sumBody'); if (!body) return;
    body.innerHTML = `<div class="sk big"></div>${'<div class="sk"></div>'.repeat(4)}`;
    try {
      const prAll = prevRange(from, to), lo = prAll.from < from ? prAll.from : from;
      const [sales, ads, comp] = await Promise.all([rpcAll('sales_summary', { p_from: lo, p_to: to }),
        getAll(`mv_ad_spend_daily?select=channel,date,ads&date=gte.${lo}&date=lte.${to}&order=date.asc,k.asc`), rpc('sales_completeness').catch(() => null)]);
      if (my !== sumSeq || !$('sumBody')) return;
      // วันล่าสุดที่ยอดเข้าครบทุกช่องทางออนไลน์ → ใช้ตัดช่วงตอนคิดป้าย %
      let cap = to; const cm = (comp && comp.complete) || {}; ONLINE.forEach(c => { if (cm[c] && cm[c] < cap) cap = cm[c]; }); if (cap < from) cap = to;
      const pr = prevRange(from, cap);
      const S = (rows, f, a, b, pick) => rows.reduce((t, r) => { const d = String(r.date).slice(0, 10); return d >= a && d <= b && pick(r) ? t + (parseFloat(r[f]) || 0) : t; }, 0);
      const rows = CH.map(([n, cl, cd]) => { const isCh = r => r.channel === n, isAd = r => adChOf(r.channel) === n, on = ONLINE.includes(n);
        return { n, cl, cd, on, rev: S(sales, 'net_revenue', from, to, isCh), revC: S(sales, 'net_revenue', from, cap, isCh), revP: S(sales, 'net_revenue', pr.from, pr.to, isCh),
          ads: on ? S(ads, 'ads', from, to, isAd) : null }; });
      const any = () => true, onl = r => ONLINE.includes(r.channel);
      const T = { rev: S(sales, 'net_revenue', from, to, any), revC: S(sales, 'net_revenue', from, cap, any), revP: S(sales, 'net_revenue', pr.from, pr.to, any),
        on: S(sales, 'net_revenue', from, to, onl), onC: S(sales, 'net_revenue', from, cap, onl), onP: S(sales, 'net_revenue', pr.from, pr.to, onl),
        ads: S(ads, 'ads', from, to, any), adsC: S(ads, 'ads', from, cap, any), adsP: S(ads, 'ads', pr.from, pr.to, any) };
      const other = T.ads - rows.reduce((t, r) => t + (r.ads || 0), 0);
      const dark = document.documentElement.classList.contains('dark');
      const pct = (a, r) => r > 0 && a > 0 ? (a / r * 100).toFixed(1) + '%' : '—', roas = (a, r) => r > 0 && a > 0 ? `ROAS ${(r / a).toFixed(2)}x` : '';
      const st = $('sumSt'); if (st) { st.hidden = false; st.lastElementChild.textContent = 'ข้อมูลถึง ' + dTh(cap); }
      body.innerHTML = `<div class="hero"><div class="h1"><span>ยอดขายรวมทุกช่องทาง</span><b>${n0(T.rev)}</b><div>${chip(T.revC, T.revP)}${T.revP > 0 ? `<em>เดือนก่อน ${n0(T.revP)}</em>` : ''}</div></div>
          <div class="h2"><div><span>ออนไลน์</span><b>${n0(T.on)}</b><div>${chip(T.onC, T.onP)}</div></div>
            <div><span>ค่า Ads รวม</span><b>${n0(T.ads)}</b><div>${chip(T.adsC, T.adsP, true)}</div></div>
            <div><span>% ค่า Ads</span><b>${pct(T.ads, T.on)}</b><div><em>${roas(T.ads, T.on)}</em></div></div></div></div>
        <div class="sec">แยกตามช่องทาง <em>ป้าย % เทียบ ${rngTh(from, cap)} กับ ${rngTh(pr.from, pr.to)}</em></div>
        ${rows.filter(r => r.rev || r.revP || r.ads).map(r => `<div class="ch"><div class="ch-h"><i style="background:${dark ? r.cd : r.cl}"></i><b>${esc(r.n)}</b>${chip(r.revC, r.revP)}</div>
          <div class="ch-g"><div><span>ยอดขาย</span><b>${n0(r.rev)}</b></div><div><span>ค่า Ads</span><b>${r.on ? n0(r.ads) : '—'}</b></div>
            <div><span>% ค่า Ads</span><b>${r.on ? pct(r.ads, r.rev) : '—'}</b><em>${r.on ? roas(r.ads, r.rev) : 'ไม่มี Ads ของตัวเอง'}</em></div></div></div>`).join('')}
        ${other > 0.5 ? `<div class="ch"><div class="ch-h"><i style="background:var(--t3)"></i><b>ค่า Ads อื่น ๆ</b></div><div class="ch-g"><div><span>ยอดขาย</span><b>—</b></div><div><span>ค่า Ads</span><b>${n0(other)}</b></div><div><span>% ค่า Ads</span><b>—</b><em>นับรวมในค่า Ads รวมแล้ว</em></div></div></div>` : ''}
        <div class="foot"><span>ยอดขายรวม VAT · Facebook รวม Ads PR</span><span><button type="button" id="mTheme">${dark ? 'โหมดสว่าง' : 'โหมดมืด'}</button> · <a href="dashboard.html?full=1">เปิดแบบเต็ม</a> · <button type="button" id="mOut">ออกจากระบบ</button></span></div>`;
      $('mTheme').onclick = () => { const d = document.documentElement.classList.toggle('dark'); try { localStorage.setItem('deesay_theme', d ? 'dark' : 'light'); } catch (e) {} loadSum(); };
      $('mOut').onclick = () => Auth.signOut();
    } catch (e) { if (my === sumSeq && $('sumBody')) $('sumBody').innerHTML = `<div class="msg err">โหลดข้อมูลไม่สำเร็จ: ${esc(e.message)}</div>`; }
  }

  // ---------- หน้า 2: อนุมัติ Promotion ----------
  let LIST = null, CAT = null, pTab = 'pending';
  const pname = sku => ((CAT && CAT.products || []).find(p => p.sku === sku) || { name: sku }).name;
  const itemsTxt = r => [...(r.items || []).map(x => pname(x.sku) + (+x.qty > 1 ? ' × ' + x.qty : '')), ...(r.gifts || []).map(x => 'แถม ' + pname(x.sku) + (+x.qty > 1 ? ' × ' + x.qty : ''))].join(' + ');
  const TABS = [['pending', 'รออนุมัติ', r => r.status === 'pending' || r.status === 'countered'], ['approved', 'อนุมัติแล้ว', r => r.status === 'approved'], ['rejected', 'ไม่อนุมัติ', r => r.status === 'rejected']];
  const nPend = () => (LIST || []).filter(r => r.status === 'pending').length;
  const navBadge = () => { const u = $('navN'), n = nPend(); if (u) { u.hidden = !n; u.textContent = n; } };
  const kpi2 = c => { const ok = c && !(c.missing_costs || []).length, neg = ok && +c.profit < 0;
    return `<div class="g2"><div><span>ราคาขาย</span><b>${n2(c ? c.price : 0)}</b>${c && +c.rsp > 0 ? `<em>ปกติ ${n2(c.rsp)}</em>` : ''}</div><div class="${neg ? 'neg' : 'pos'}"><span>กำไรสุทธิ / ออเดอร์</span><b>${ok ? n2(c.profit) : '—'}</b><em>${ok ? (+c.margin * 100).toFixed(1) + '% ของรายได้' : 'รอต้นทุนครบ'}</em></div></div>`; };
  function promoShell() {
    app.innerHTML = `<div class="top"><div class="t1"><b>อนุมัติ Promotion</b></div><div class="tabs" id="pTabs"></div></div><div class="body" id="pBody">${'<div class="sk big"></div>'.repeat(3)}</div>`;
  }
  function drawPromo() {
    const tb = $('pTabs'), body = $('pBody'); if (!tb || !body || !LIST) return;
    tb.innerHTML = TABS.map(([k, l]) => `<button type="button" data-t="${k}" class="${k === pTab ? 'on' : ''}">${l}${k === 'pending' && nPend() ? ` <u>${nPend()}</u>` : ''}</button>`).join('');
    tb.querySelectorAll('button').forEach(b => b.onclick = () => { pTab = b.dataset.t; drawPromo(); });
    const rows = LIST.filter(TABS.find(t => t[0] === pTab)[2]);
    body.innerHTML = rows.length ? rows.map(r => { const c = Object.assign({ price: r.price }, r.calc || {});
      return `<div class="rq" data-id="${r.id}"><div class="rq-h"><b>${esc(r.channel || '')}${r.status === 'countered' ? '<span class="pill a">เสนอกลับแล้ว</span>' : ''}</b><span>${r.start_date ? dTh(r.start_date) + (r.end_date ? ' – ' + dTh(r.end_date) : '') : ''}</span></div>
        <div class="rq-p">${esc(itemsTxt(r))}</div>${kpi2(c)}
        ${r.decision_note && r.status !== 'pending' ? `<div class="rq-n">${esc(r.decision_note)}</div>` : ''}
        <div class="rq-f"><span>ขอโดย ${esc(r.requested_name || '—')}</span><button type="button" data-open="${r.id}">ดูการคำนวณ ›</button></div>
        ${r.status === 'pending' ? `<div class="rq-b"><button type="button" class="btn" data-dec="rejected" data-id="${r.id}">ไม่อนุมัติ</button><button type="button" class="btn ok" data-dec="approved" data-id="${r.id}">อนุมัติ</button></div>` : ''}</div>`; }).join('')
      : `<div class="msg">${pTab === 'pending' ? 'ไม่มีคำขอที่รออนุมัติ' : 'ไม่มีรายการ'}</div>`;
    body.querySelectorAll('[data-open]').forEach(b => b.onclick = () => openCalc(LIST.find(r => String(r.id) === b.dataset.open)));
    body.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => decide(LIST.find(r => String(r.id) === b.dataset.id), b.dataset.dec, ''));
    navBadge();
  }
  async function loadPromo() {
    try { const [l, c] = await Promise.all([rpc('promo_list', { p_scope: 'all' }), CAT ? CAT : rpc('promo_catalog')]); LIST = l || []; CAT = c || {}; drawPromo(); }
    catch (e) { const b = $('pBody'); if (b) b.innerHTML = `<div class="msg err">โหลดคำขอไม่สำเร็จ: ${esc(e.message)}</div>`; }
  }
  // กล่องยืนยันของหน้าเอง (ไม่ใช้ confirm ของ browser)
  function sheet(title, text, okLabel, okCls, withNote, note0) {
    return new Promise(res => { const o = document.createElement('div'); o.className = 'ovl';
      o.innerHTML = `<div class="sheet" role="dialog" aria-label="${esc(title)}"><h3>${esc(title)}</h3><p>${esc(text)}</p>${withNote ? `<textarea class="ta" id="shNote" placeholder="Feedback ถึงผู้ขอ (ไม่บังคับ)">${esc(note0 || '')}</textarea>` : ''}<div class="bt"><button type="button" class="btn" data-x>ยกเลิก</button><button type="button" class="btn ${okCls}" data-ok>${esc(okLabel)}</button></div></div>`;
      const done = v => { const n = o.querySelector('#shNote'); o.remove(); res(v ? { note: n ? n.value.trim() : '' } : null); };
      o.addEventListener('click', e => { if (e.target === o || e.target.closest('[data-x]')) done(false); else if (e.target.closest('[data-ok]')) done(true); });
      document.body.appendChild(o); });
  }
  async function decide(r, d, extra) {
    if (!r) return false;
    const a = await sheet(d === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ', `${r.channel || ''} · ${itemsTxt(r)} · ราคา ${n2(r.price)}`, d === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ', d === 'approved' ? 'ok' : 'bad', true, '');
    if (!a) return false;
    const note = extra && !a.note.includes(extra) ? (a.note ? a.note + ' · ' : '') + extra : a.note;
    try { await rpc('promo_decide', { p_id: r.id, p_status: d, p_note: note }); toast('บันทึกแล้ว'); closeViews(); await loadPromo(); return true; }
    catch (e) { toast('บันทึกไม่สำเร็จ: ' + e.message); return false; }
  }
  const closeViews = () => document.querySelectorAll('.view').forEach(v => v.remove());

  // ---------- การคำนวณ (ขั้นบันไดกำไร) + เสนอกลับ ----------
  function openCalc(r) {
    if (!r) return;
    const S = { price: +r.price, items: JSON.parse(JSON.stringify(r.items || [])), gifts: JSON.parse(JSON.stringify(r.gifts || [])), fee_mode: null, exclude: [], override: {}, open: new Set(['selling', 'overhead']), c: null, mode: 'calc', note: '' };
    const v = document.createElement('div'); v.className = 'view'; document.body.appendChild(v);
    const pp = () => { const p = { channel_id: r.channel_id, price: S.price, orders: 0, items: S.items.filter(x => +x.qty > 0), gifts: S.gifts.filter(x => +x.qty > 0) }; if (S.fee_mode) p.fee_mode = S.fee_mode; if (S.exclude.length) p.exclude = S.exclude; if (Object.keys(S.override).length) p.override = S.override; return p; };
    let seq = 0;
    const recalc = async () => { const my = ++seq; try { const c = await rpc('promo_calc', { p: pp() }); if (my !== seq || !v.isConnected) return; S.c = c; draw(); } catch (e) { toast('คำนวณไม่สำเร็จ: ' + e.message); } };
    const changed = () => +S.price !== +r.price || JSON.stringify(S.items) !== JSON.stringify(r.items || []) || JSON.stringify(S.gifts) !== JSON.stringify(r.gifts || []);
    const exTxt = () => [S.exclude.length ? `คิดแบบไม่นับ ${S.exclude.map(x => x === 'cogs' ? 'ต้นทุนสินค้า' : x.replace(/^ly:/, '')).join(', ')}` : '', Object.keys(S.override).length ? `คิด ${Object.entries(S.override).map(([k, x]) => k + ' ' + +(x * 100).toFixed(2) + '%').join(', ')}` : ''].filter(Boolean).join(' · ');
    function ladder(c) {
      const sum = a => a.reduce((t, x) => t + (+x || 0), 0), price = +c.price || 0, rex = +c.revenue_ex || 0, lines = c.lines || [], vp = Math.round((+c.vat || 0.07) * 100);
      const ok = !(c.missing_costs || []).length, neg = ok && +c.profit < 0, amt = (x, off) => off ? '0.00' : '−' + n2(x);
      const ck = (key, on) => `<input type="checkbox" class="ck" data-x="${esc(key)}"${on ? ' checked' : ''} aria-label="นับรายการนี้">`;
      const grp = (id, title, x, off, key) => `<div class="r g${S.open.has(id) ? ' open' : ''}${off ? ' off' : ''}" data-g="${id}">${ck(key, !off)}<span>${title}</span><b>${amt(x, off)}</b></div>`;
      const sub = (id, label, x, off, key, extra) => `<div class="r s${off ? ' off' : ''}" data-gp="${id}"${S.open.has(id) ? '' : ' hidden'}>${key ? ck(key, !off) : ''}<span>${label}</span>${extra || ''}<b>${x == null ? '—' : amt(x, off)}</b></div>`;
      const ov = f => f.layer === 'overhead' && f.kind === 'pct' ? `<input type="number" inputmode="decimal" step="0.5" min="0" class="pc" data-ov="${esc(f.item)}" data-base="${+(+(f.base_rate != null ? f.base_rate : f.rate) * 100).toFixed(2)}" value="${+(+f.rate * 100).toFixed(2)}" aria-label="% ${esc(f.item)}"><span class="pcu">%</span>` : '';
      const feeG = (ly, title) => { const F = (c.fees || []).filter(f => f.layer === ly); if (!F.length) return ''; const on = F.filter(f => !f.excluded);
        return grp(ly, title, sum(on.map(f => f.amount_ex)), !on.length, 'ly:' + ly) + F.map(f => sub(ly, esc(f.item), f.amount_ex, f.excluded, f.item, ov(f))).join(''); };
      return `${!ok ? `<div class="warn">ยังคำนวณกำไรไม่ได้ — ยังไม่มีต้นทุนของ ${(c.missing_costs || []).map(pname).map(esc).join(', ')}</div>` : ''}
        <div class="ld"><div class="ld-h"><b>ขั้นการคำนวณ</b>${c.fee_actual_ok ? `<div class="seg" id="cFm"><button type="button" data-v="actual" class="${c.fee_mode === 'actual' ? 'on' : ''}">ค่าจริง 30 วัน</button><button type="button" data-v="set" class="${c.fee_mode !== 'actual' ? 'on' : ''}">ค่าที่ตั้งไว้</button></div>` : ''}</div>
          <div class="r"><span>ราคาขาย (รวม VAT)</span><b>${n2(price)}</b></div>
          <div class="r m"><span>VAT ${vp}%</span><b>−${n2(price - rex)}</b></div>
          <div class="r t"><span>รายได้ไม่รวม VAT</span><b>${n2(rex)}</b></div>
          ${grp('cost', 'ต้นทุนสินค้า + ของแถม', sum(lines.map(l => l.cost)), !!c.cogs_excluded, 'cogs')}${lines.map(l => sub('cost', `${l.kind === 'gift' ? 'แถม · ' : ''}${esc(l.name || pname(l.sku))} × ${l.qty}`, l.unit_cost == null ? null : l.cost, !!c.cogs_excluded, null)).join('')}
          ${feeG('platform', 'ค่า Platform')}${feeG('selling', 'ค่าขาย')}${feeG('overhead', 'ค่าบริหาร / Marketing')}
          <div class="r tot ${neg ? 'neg' : 'pos'}"><span>กำไรสุทธิ / ออเดอร์</span><b>${ok ? n2(c.profit) : '—'}</b></div></div>
        <div class="hint">ติ๊กออก = ไม่นับรายการนั้น · แตะชื่อกลุ่มเพื่อดูรายการย่อย · ช่อง % ของค่าบริหาร / Marketing ใส่ค่าเองได้ (คิดเฉพาะครั้งนี้)</div>`;
    }
    function bindLadder(root, c) {
      root.querySelectorAll('.r.g').forEach(g => g.addEventListener('click', e => { if (e.target.closest('.ck')) return; const id = g.dataset.g; if (S.open.has(id)) S.open.delete(id); else S.open.add(id); g.classList.toggle('open', S.open.has(id)); root.querySelectorAll(`[data-gp="${id}"]`).forEach(x => { x.hidden = !S.open.has(id); }); }));
      root.querySelectorAll('.ck').forEach(b => b.addEventListener('change', () => { const key = b.dataset.x, set = new Set(S.exclude), F = c.fees || [];
        if (key === 'cogs') { b.checked ? set.delete('cogs') : set.add('cogs'); }
        else if (key.startsWith('ly:')) { const ly = key.slice(3); F.filter(f => f.layer === ly).forEach(f => set.delete(f.item)); b.checked ? set.delete(key) : set.add(key); }
        else { const f = F.find(x => x.item === key), gk = f ? 'ly:' + f.layer : null;
          if (gk && set.has(gk)) { set.delete(gk); F.filter(x => x.layer === f.layer && x.item !== key).forEach(x => set.add(x.item)); }
          b.checked ? set.delete(key) : set.add(key); }
        S.exclude = [...set]; recalc(); }));
      root.querySelectorAll('.pc').forEach(i => i.addEventListener('change', () => { const x = parseFloat(i.value), base = parseFloat(i.dataset.base); if (!isFinite(x) || x < 0 || Math.abs(x - base) < 1e-9) delete S.override[i.dataset.ov]; else S.override[i.dataset.ov] = x / 100; recalc(); }));
      const fm = root.querySelector('#cFm'); if (fm) fm.querySelectorAll('button').forEach(b => b.onclick = () => { S.fee_mode = b.dataset.v; recalc(); });
    }
    function draw() {
      const c = S.c || Object.assign({ price: S.price }, r.calc || {}), pend = r.status === 'pending';
      if (S.mode === 'calc') {
        v.innerHTML = `<div class="top"><div class="bk"><button type="button" data-back aria-label="กลับ">‹</button><b>การคำนวณ</b><span>คำขอเลขที่ ${esc(r.id)}</span></div></div>
          <div class="scr"><div class="sum"><h4>${esc(r.channel || '')}</h4><p>${esc(itemsTxt({ items: S.items, gifts: S.gifts }))}${r.start_date ? ' · ' + dTh(r.start_date) + (r.end_date ? ' – ' + dTh(r.end_date) : '') : ''} · ขอโดย ${esc(r.requested_name || '—')}</p>${kpi2(c)}${r.note ? `<div class="rq-n">${esc(r.note)}</div>` : ''}</div>${ladder(c)}</div>
          ${pend ? `<div class="act"><button type="button" class="btn" data-dec="rejected">ไม่อนุมัติ</button><button type="button" class="btn cn" data-cn>เสนอกลับ</button><button type="button" class="btn ok" data-dec="approved">อนุมัติ</button></div>` : ''}`;
        bindLadder(v, c);
        v.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => decide(r, b.dataset.dec, exTxt()));
        const cn = v.querySelector('[data-cn]'); if (cn) cn.onclick = () => { S.mode = 'counter'; draw(); };
        v.querySelector('[data-back]').onclick = () => v.remove();
      } else {
        const ok = !(c.missing_costs || []).length, neg = ok && +c.profit < 0, opts = (CAT.products || []).map(p => `<option value="${esc(p.sku)}">${esc(p.name)}</option>`).join('');
        const line = (x, i, k) => `<div class="it"><b>${k === 'gift' ? 'แถม · ' : ''}${esc(pname(x.sku))}<small>${esc(x.sku)}</small></b><div class="stp"><button type="button" data-q="-1" data-i="${i}" data-k="${k}" aria-label="ลด">−</button><u>${+x.qty || 0}</u><button type="button" data-q="1" data-i="${i}" data-k="${k}" aria-label="เพิ่ม">+</button></div><button type="button" class="x" data-rm="${i}" data-k="${k}" aria-label="ลบ">×</button></div>`;
        v.innerHTML = `<div class="top"><div class="bk"><button type="button" data-back aria-label="กลับ">‹</button><b>เสนอกลับ</b><span>คำขอเลขที่ ${esc(r.id)}</span></div></div>
          <div class="scr"><div class="fld"><span>ราคาขายที่เสนอ (รวม VAT)</span><input class="inp" id="cnPrice" type="number" inputmode="decimal" step="0.01" value="${S.price}"><small>ราคาที่ขอมา ${n2(r.price)}${+c.rsp > 0 ? ' · ปกติ ' + n2(c.rsp) : ''}</small></div>
            <div class="fld"><span>สินค้าใน Promotion</span>${S.items.map((x, i) => line(x, i, 'item')).join('')}${S.gifts.map((x, i) => line(x, i, 'gift')).join('')}
              <div class="adds"><label>+ เพิ่มสินค้า<select data-add="item" aria-label="เพิ่มสินค้า"><option value="">เลือกสินค้า</option>${opts}</select></label><label>+ เพิ่มของแถม<select data-add="gift" aria-label="เพิ่มของแถม"><option value="">เลือกของแถม</option>${opts}</select></label></div></div>
            <div class="g2" style="background:var(--card);margin-bottom:10px;"><div><span>รายได้ไม่รวม VAT</span><b>${n2(c.revenue_ex)}</b><em>หลัง VAT ${Math.round((+c.vat || 0.07) * 100)}%</em></div><div class="${neg ? 'neg' : 'pos'}"><span>กำไรสุทธิ / ออเดอร์</span><b>${ok ? n2(c.profit) : '—'}</b><em>${ok ? (+c.margin * 100).toFixed(1) + '% ของรายได้' : 'รอต้นทุนครบ'}</em></div></div>
            <div class="hint">แก้ราคาหรือสินค้าแล้ว กำไรจะคำนวณใหม่ให้ทันที · ผู้ขอกด "รับตามที่เสนอ" = อนุมัติทันที</div>
            <div class="fld"><span>Feedback ถึงผู้ขอ</span><textarea class="ta" id="cnNote" placeholder="พิมพ์ข้อความ (ไม่บังคับ)">${esc(S.note)}</textarea></div></div>
          <div class="act two"><button type="button" class="btn" data-back2>ยกเลิก</button><button type="button" class="btn ok" data-send${changed() ? '' : ' disabled'}>ส่งข้อเสนอกลับ</button></div>`;
        const keep = () => { S.note = v.querySelector('#cnNote').value; };
        const pi = v.querySelector('#cnPrice'); pi.addEventListener('change', () => { keep(); S.price = +pi.value || 0; recalc(); });
        v.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { keep(); const a = b.dataset.k === 'gift' ? S.gifts : S.items, x = a[+b.dataset.i]; x.qty = Math.max(1, (+x.qty || 0) + +b.dataset.q); recalc(); });
        v.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { keep(); const a = b.dataset.k === 'gift' ? S.gifts : S.items; if (b.dataset.k !== 'gift' && S.items.length <= 1) { toast('ต้องมีสินค้าอย่างน้อย 1 รายการ'); return; } a.splice(+b.dataset.rm, 1); recalc(); });
        v.querySelectorAll('[data-add]').forEach(sel => sel.addEventListener('change', () => { const sku = sel.value; if (!sku) return; keep(); const a = sel.dataset.add === 'gift' ? S.gifts : S.items, ex = a.find(x => x.sku === sku); if (ex) ex.qty = (+ex.qty || 0) + 1; else a.push({ sku, qty: 1 }); recalc(); }));
        const back = () => { keep(); S.mode = 'calc'; draw(); };
        v.querySelector('[data-back]').onclick = back; v.querySelector('[data-back2]').onclick = back;
        v.querySelector('[data-send]').onclick = async () => { keep(); const items = S.items.filter(x => +x.qty > 0), gifts = S.gifts.filter(x => +x.qty > 0);
          if (!items.length || !(S.price > 0)) { toast('ต้องมีราคา และสินค้าอย่างน้อย 1 รายการ'); return; }
          const a = await sheet('เสนอกลับ', `${r.channel || ''} · ราคา ${n2(r.price)} → ${n2(S.price)} · ผู้ขอกดรับ = อนุมัติทันที`, 'ส่งข้อเสนอกลับ', 'ok', false); if (!a) return;
          try { await rpc('promo_counter', { p_id: r.id, p: { price: S.price, items, gifts }, p_note: S.note.trim() }); toast('เสนอกลับแล้ว'); closeViews(); loadPromo(); } catch (e) { toast('เสนอกลับไม่สำเร็จ: ' + e.message); } };
      }
    }
    draw(); if (!r.calc || !(r.calc.fees || []).length) recalc();
  }

  // ---------- เริ่ม ----------
  let tab = 'sum';
  function show(t) { tab = t; closeViews(); document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); window.scrollTo(0, 0);
    if (t === 'promo') { promoShell(); if (LIST) drawPromo(); loadPromo(); } else { sumShell(); loadSum(); } }
  (async () => {
    try { await Auth.require('dashboard'); } catch (e) { app.innerHTML = `<div class="body"><div class="msg err">เข้าสู่ระบบไม่สำเร็จ: ${esc(e.message)}</div></div>`; return; }
    const exec = Auth.canPage('exec');
    if (exec) { $('nav').hidden = false; document.body.classList.remove('no-nav'); document.querySelectorAll('#nav button').forEach(b => b.onclick = () => show(b.dataset.tab));
      rpc('promo_list', { p_scope: 'all' }).then(l => { LIST = l || []; navBadge(); }).catch(() => {}); }
    show(exec && /[?&#]promo\b/.test(location.search + location.hash) ? 'promo' : 'sum');
  })();
})();
