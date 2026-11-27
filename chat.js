// chat.js (2026-11-27) — หน้าแชท Facebook: รวมแชททุกเพจ + สร้างคำสั่งซื้อข้างแชท
// ข้อมูล: RPC chat_inbox_summary / chat_inbox_list / chat_thread / chat_products / chat_combo_prices / chat_customer_lookup / chat_order_create / chat_orders_list
//         ที่อยู่ไปรษณีย์จากไฟล์ th-address.json (ไฟล์เดียวกับที่โหลดเข้าตาราง th_address ใช้ตรวจตอนบันทึก)
// ระยะทดลอง: ยังไม่ส่งข้อความจากหน้านี้ (ตอบใน Facebook / Business Suite) · คำสั่งซื้อเก็บใน chat_orders ยังไม่เข้ายอดขายและ Warehouse
(function () {
  'use strict';
  try { if (localStorage.getItem('deesay_theme') === 'light') document.body.classList.add('light-theme'); } catch (e) {}   // ธีมที่เลือกไว้ (แบบเดียวกับ Warehouse)
  requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('ch-boot')));
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const num = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const dayKey = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const fmtT = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  function fmtWhen(iso) {
    if (!iso) return '';
    const d = new Date(iso), now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
    if (dayKey(d) === dayKey(now)) return fmtT(d);
    if (dayKey(d) === dayKey(y)) return 'เมื่อวาน ' + fmtT(d);
    return `${d.getDate()} ${MON[d.getMonth()]} ${fmtT(d)}`;
  }
  function fmtDay(d) {
    const now = new Date(), y = new Date(now); y.setDate(now.getDate() - 1);
    if (dayKey(d) === dayKey(now)) return 'วันนี้';
    if (dayKey(d) === dayKey(y)) return 'เมื่อวาน';
    return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear() + 543}`;
  }
  const mins = iso => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  function initials(name) {
    const w = String(name || '').trim().split(/\s+/).filter(Boolean);
    const first = s => { const c = [...s]; return /^[เแโใไ]$/.test(c[0]) && c[1] ? c[1] : c[0]; };
    return w.length ? (first(w[0]) + (w[1] ? first(w[1]) : '')).toUpperCase() : '·';
  }
  const APP_LABEL = { '263902037430900': 'ตอบจาก Business Suite', '1658549758190315': 'ตอบจากระบบเรา' };
  const PAYS = ['เก็บเงินปลายทาง', 'การโอนเงิน'];

  const S = {
    view: 'inbox', tab: 'all', page: '', q: '', list: [], sel: null, thread: null, pages: [],
    products: [], prodBy: {}, parentName: {}, combos: {}, comboList: [], addr: null,
    drafts: {}, more: true, busy: false, lastMsgId: null, orders: [], oPage: 1, oSize: 50, perm: null,
  };

  // ───── เริ่มต้น ─────
  (async function init() {
    try { S.perm = await Auth.require('chat'); } catch (e) { return; }
    bindViews(); bindInbox(); bindOrders();
    loadAddr();
    Promise.all([Auth.rpc('chat_products'), Auth.rpc('chat_combo_prices')]).then(([p, c]) => {
      S.products = p || []; S.prodBy = {}; S.parentName = {};
      for (const x of S.products) { S.prodBy[x.sku] = x; if (!S.parentName[x.parent]) S.parentName[x.parent] = x.pname || x.name; }
      S.comboList = c || []; S.combos = {}; for (const x of S.comboList) S.combos[x.combo] = x;
      if (S.thread) renderForm();
    }).catch(e => setStatus('stInbox', 'โหลดสินค้าไม่ได้: ' + e.message, 'bad'));
    await refreshInbox(true);
    setInterval(() => { if (S.view === 'inbox' && !document.hidden) refreshInbox(false); }, 30000);
    setInterval(() => { if (S.view === 'inbox' && S.sel && !document.hidden) openThread(S.sel.page_id, S.sel.psid, true); }, 15000);
  })();

  // ปุ่มสถานะข้างชื่อหน้า: "Updated HH:MM" · มีปัญหา = "1 alert" (ชี้ดูสาเหตุ)
  function setStatus(id, text, cls) { const el = $(id); if (!el) return; const bad = cls === 'bad'; el.textContent = bad ? '1 alert' : text; el.title = bad ? text : ''; el.className = 'wh-status' + (cls ? ' ' + cls : ''); }

  function bindViews() {
    document.querySelectorAll('.wh-side a[data-view]').forEach(a => a.onclick = () => setView(a.dataset.view));
    $('lb').onclick = () => $('lb').classList.remove('on');
  }
  function setView(v) {
    S.view = v;
    document.querySelectorAll('.wh-side a[data-view]').forEach(a => a.classList.toggle('on', a.dataset.view === v));
    $('v-inbox').classList.toggle('on', v === 'inbox'); $('v-orders').classList.toggle('on', v === 'orders'); document.body.classList.toggle('ch-ord', v === 'orders');
    if (v === 'orders') loadOrders(); else refreshInbox(false);
  }

  // ───── dropdown แบบเว็บ (ui.css .ui-dd) · items = [[ค่า, ข้อความ]] · กดซ้ำ = ปิด ─────
  function dd(el, items, value, onPick, width) {
    const cur = items.find(i => i[0] === value) || items[0];
    el.innerHTML = `<button type="button" class="ui-dd-btn"${width ? ` style="width:${width};justify-content:space-between"` : ''}><span>${esc(cur ? cur[1] : '')}</span></button><div class="ui-dd-menu">${items.map(([v, l]) => `<button type="button" class="ui-dd-item" data-v="${esc(v)}" aria-selected="${v === value}">${esc(l)}</button>`).join('')}</div>`;
    el.onclick = e => {
      const it = e.target.closest('.ui-dd-item');
      if (it) { el.classList.remove('is-open'); onPick(it.dataset.v); return; }
      if (e.target.closest('.ui-dd-btn')) { document.querySelectorAll('.ui-dd.is-open').forEach(x => x !== el && x.classList.remove('is-open')); el.classList.toggle('is-open'); }
    };
  }
  document.addEventListener('click', e => { if (!e.target.closest('.ui-dd')) document.querySelectorAll('.ui-dd.is-open').forEach(x => x.classList.remove('is-open')); if (!e.target.closest('.srchw')) closeSearch(); });

  // ───── กล่องแชท: แถบบน + รายการ ─────
  function bindInbox() {
    $('tabs').onclick = e => { const b = e.target.closest('button[data-t]'); if (!b || b.dataset.t === S.tab) return; S.tab = b.dataset.t; document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b)); S.list = []; S.more = true; loadList(true); };
    let qt = null;
    $('fQ').oninput = () => { clearTimeout(qt); qt = setTimeout(() => { S.q = $('fQ').value.trim(); S.list = []; S.more = true; loadList(true); }, 400); };
    $('lst').onclick = e => {
      const more = e.target.closest('#lstMore'); if (more) { loadList(false); return; }
      const it = e.target.closest('.it'); if (!it) return;
      openThread(it.dataset.page, it.dataset.psid, false);
    };
  }

  async function refreshInbox(first) {
    try {
      const sm = await Auth.rpc('chat_inbox_summary', { p_page: S.page || null });
      S.pages = sm.pages || [];
      if (first) renderPageDd();
      $('kCust').textContent = num(sm.customers);
      $('kAds').textContent = num(sm.from_ads);
      $('kNoAds').textContent = num(Math.max(0, (sm.customers || 0) - (sm.from_ads || 0)));
      $('kWait').textContent = num(sm.waiting);
      $('kFirst').textContent = sm.median_first_reply_min == null ? '—' : sm.median_first_reply_min + ' นาที';
      $('tWait').textContent = sm.waiting ? sm.waiting : '';
      setStatus('stInbox', 'Updated ' + fmtT(new Date()));
      await loadList(true, !first);
    } catch (e) { setStatus('stInbox', 'โหลดไม่ได้: ' + e.message, 'bad'); }
  }
  function renderPageDd() {
    const items = [['', `ทุกเพจ (${S.pages.length})`], ...S.pages.map(p => [p.id, p.label])];
    dd($('fPage'), items, S.page, v => { S.page = v; renderPageDd(); S.list = []; S.more = true; refreshInbox(false); }, '170px');
  }

  async function loadList(reset, keepScroll) {
    const box = $('lst'), top = box.scrollTop;
    try {
      const before = reset ? null : (S.list.length ? S.list[S.list.length - 1].last_at : null);
      const want = reset ? Math.max(50, keepScroll ? S.list.length : 0) : 50;
      const rows = await Auth.rpc('chat_inbox_list', { p_tab: S.tab, p_page: S.page || null, p_q: S.q || null, p_limit: Math.min(want, 200), p_before: before });
      S.list = reset ? rows : S.list.concat(rows);
      S.more = S.tab !== 'waiting' && rows.length >= (reset ? Math.min(want, 200) : 50);
      renderList();
      if (keepScroll) box.scrollTop = top;
    } catch (e) { box.innerHTML = `<div class="empty">โหลดรายการแชทไม่ได้<br>${esc(e.message)}</div>`; }
  }
  function renderList() {
    const box = $('lst');
    if (!S.list.length) { box.innerHTML = `<div class="empty">${S.q ? 'ไม่พบแชทที่ตรงกับคำค้น' : S.tab === 'waiting' ? 'ไม่มีแชทที่รอตอบ' : 'ยังไม่มีแชท'}</div>`; return; }
    box.innerHTML = S.list.map(t => {
      const on = S.sel && S.sel.page_id === t.page_id && S.sel.psid === t.psid;
      const tm = t.waiting ? `<span class="tm wt">รอ ${mins(t.last_in_at)} นาที</span>` : `<span class="tm">${esc(fmtWhen(t.last_at))}</span>`;
      const ad = t.ad_id ? `<span class="tag ad" title="${esc((t.ad_title || '') + (t.ad_product ? ' · ' + t.ad_product : ''))}"><b>Ads</b> ${esc(t.ad_product || t.ad_title || '')}</span>` : '';
      return `<div class="it${t.waiting ? ' wait' : ''}${on ? ' on' : ''}" data-page="${esc(t.page_id)}" data-psid="${esc(t.psid)}">
        <div class="av">${esc(initials(t.name))}</div>
        <div class="bd"><div class="r1"><span class="nm">${esc(t.name || 'ลูกค้า ··' + String(t.psid).slice(-4))}</span>${tm}</div>
          <div class="r2"><span class="tag pg" style="--c:${esc(t.page_color || 'var(--ch-facebook)')}">${esc(t.page_label || t.page_id)}</span>${ad}</div>
          <div class="pv">${esc(t.preview || '')}</div></div></div>`;
    }).join('') + (S.more ? `<div class="lst-more"><button class="wh-btn" id="lstMore">โหลดแชทเก่าเพิ่ม</button></div>` : '');
  }

  // ───── แชท 1 ห้อง ─────
  async function openThread(page, psid, silent) {
    const same = S.sel && S.sel.page_id === page && S.sel.psid === psid;
    if (!silent) { S.sel = { page_id: page, psid }; renderList(); if (!same) { $('msgs').innerHTML = '<div class="sk"></div><div class="sk"></div>'; } }
    try {
      const d = await Auth.rpc('chat_thread', { p_page: page, p_psid: psid });
      if (!S.sel || S.sel.page_id !== page || S.sel.psid !== psid) return;
      const last = d.messages.length ? d.messages[d.messages.length - 1].id : null;
      const changed = !silent || last !== S.lastMsgId;
      S.thread = d; S.lastMsgId = last;
      if (changed) { renderThread(!silent || !same); }
      if (!silent || !same) renderForm();
    } catch (e) { if (!silent) $('msgs').innerHTML = `<div class="empty">เปิดแชทไม่ได้<br>${esc(e.message)}</div>`; }
  }

  // บิลที่เปิดในโปรแกรมเปิดบิลแล้ว (ส่งสรุปคำสั่งซื้อเข้าแชท "เลขที่คำสั่งซื้อ: OD…") → เตือนก่อนสร้างซ้ำ
  const billsOf = msgs => [...new Set(msgs.filter(m => m.dir === 'out' && m.text).map(m => (m.text.match(/เลขที่คำสั่งซื้อ\s*[:：]\s*([A-Z]{2}\d{8,})/) || [])[1]).filter(Boolean))];
  function renderThread(scrollBottom) {
    const { thread: t, ad, messages } = S.thread;
    const ords = S.thread.orders || [];
    S.thread.bills = billsOf(messages);
    $('cvH').innerHTML = `<div class="av">${esc(initials(t.name))}</div>
      <div class="who"><div class="t1">${esc(t.name || 'ลูกค้า ··' + String(t.psid).slice(-4))}</div><div class="t2" title="${esc(t.sub_channel || '')}">เพจ ${esc(t.page_label || t.sub_channel || '')}</div></div>
      <div class="meta">ทักครั้งแรก ${esc(fmtWhen(t.first_at))}${S.thread.bills.length ? ` · <span class="billed">เปิดบิลแล้ว ${esc(S.thread.bills.join(', '))}</span>` : ''}${ords.length ? ` · สร้างจากหน้านี้ ${ords.length} ครั้ง` : ''}<br>${t.link ? `<a class="fbl" href="${esc(t.link)}" target="_blank" rel="noopener">เปิดใน Facebook ↗</a>` : ''}</div>`;
    const box = $('msgs'), atBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 60;
    let html = '';
    if (ad) {
      html += `<div class="adcard"><div class="th">${ad.thumb ? `<img src="${esc(ad.thumb)}" alt="" loading="lazy" onerror="this.remove()">` : '▶'}</div>
        <div class="x">ลูกค้าทักมาจาก Ads <span class="ads-info-wrap"><span>ⓘ</span><span class="ads-info-popover"><b>Ads ที่พาลูกค้ามาแชท</b><br>Meta ส่งรหัส Ads มากับแชทตอนลูกค้ากดจาก Ads · สินค้าจับคู่จากชื่อคอนเทนต์ในชีททีม Ads (แบบเดียวกับหน้า Facebook Ads)</span></span><br><b>${esc(ad.title || ad.name || ad.ad_id)}</b>${ad.campaign ? ` · ${esc(ad.campaign)}` : ''}<br>สินค้า (ชีททีม Ads): <span class="p">${esc(ad.product || 'ยังไม่ได้จับคู่')}</span></div></div>`;
    }
    let lastDay = '', i = 0;
    const found = [];
    while (i < messages.length) {
      const m = messages[i], d = new Date(m.at), dk = dayKey(d);
      if (dk !== lastDay) { html += `<div class="day">${esc(fmtDay(d))}</div>`; lastDay = dk; }
      if (m.kind === 'referral') { html += `<div class="note-c">ลูกค้ากดมาจาก Ads · ${esc(fmtT(d))}</div>`; i++; continue; }
      // กลุ่มข้อความติดกันจากฝั่งเดียวกัน ภายใน 5 นาที → เวลาใต้กลุ่ม
      let j = i; const grp = [];
      while (j < messages.length && messages[j].kind !== 'referral' && messages[j].dir === m.dir && dayKey(new Date(messages[j].at)) === dk
             && new Date(messages[j].at) - new Date(messages[Math.max(i, j - 1)].at) < 300000) { grp.push(messages[j]); j++; }
      let cards = 0;   // การ์ดข้อความ (ปุ่ม / สินค้า / สรุปคำสั่งซื้อ) ติดกัน → รวมเป็นบรรทัดเดียว
      const flush = dir => { if (cards) html += `<div class="b ${dir} cardm">การ์ดข้อความ${cards > 1 ? ' ' + cards + ' รายการ' : ''} · ดูใน Facebook</div>`; cards = 0; };
      for (const x of grp) {
        const att = (x.att || []).filter(a => !(a.type === 'fallback' && x.text));
        const isCard = a => (a.type === 'template' || a.type === 'fallback') && !a.url;
        if (!x.text && att.length && att.every(isCard)) { cards += att.length; continue; }
        flush(x.dir);
        if (x.text) html += `<div class="b ${x.dir}">${esc(x.text)}</div>`;
        for (const a of att) {
          if (isCard(a)) { html += `<div class="b ${x.dir} cardm">การ์ดข้อความ · ดูใน Facebook</div>`; continue; }
          const kind = { image: 'รูปภาพ', video: 'วิดีโอ', audio: 'ข้อความเสียง', file: 'ไฟล์' }[a.type] || 'ไฟล์แนบ';
          html += a.type === 'image' && a.url ? `<div class="b att ${x.dir}"><img src="${esc(a.url)}" alt="" loading="lazy" data-full="${esc(a.url)}"></div>`
               : `<div class="b att ${x.dir}">${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${kind} ↗</a>` : `<a>${kind}</a>`}</div>`;
        }
        if (!x.text && !att.length) html += `<div class="b ${x.dir}" style="opacity:.7">${x.kind === 'postback' ? 'กดปุ่มเริ่มต้นแชท' : 'ข้อความ'}</div>`;
        if (x.dir === 'in' && x.text) { const a = parseAddress(x.text); if (a.ok) { found.push({ id: x.id, a }); html += `<div class="det" data-mid="${x.id}">📍 พบชื่อ เบอร์ ที่อยู่ในข้อความนี้ · <button type="button" data-use="${x.id}">ใช้กรอกฟอร์ม</button></div>`; } }
      }
      flush(m.dir);
      const last = grp[grp.length - 1], lb = last.dir === 'out' ? (APP_LABEL[last.app_id] || (last.app_id ? 'ข้อความอัตโนมัติ' : '')) : '';
      html += `<div class="st${last.dir === 'out' ? ' r' : ''}">${esc(fmtT(new Date(last.at)))}${lb ? ' · ' + esc(lb) : ''}</div>`;
      i = j;
    }
    box.innerHTML = html || '<div class="empty">ยังไม่มีข้อความ</div>';
    S.found = found;
    const stick = scrollBottom || atBottom;
    box.querySelectorAll('img[data-full]').forEach(im => { im.onclick = () => { $('lb').querySelector('img').src = im.dataset.full; $('lb').classList.add('on'); }; if (stick) im.onload = () => { if (box.scrollHeight - box.scrollTop - box.clientHeight < 400) box.scrollTop = box.scrollHeight; }; });
    box.querySelectorAll('button[data-use]').forEach(b => b.onclick = () => { const f = found.find(x => String(x.id) === b.dataset.use); if (f) { applyAddress(f.a, true); } });
    if (scrollBottom || atBottom) box.scrollTop = box.scrollHeight;
  }

  // ───── ที่อยู่: ฐานข้อมูลไปรษณีย์ + แยกที่อยู่จากข้อความ ─────
  async function loadAddr() {
    try {
      const j = await (await fetch('th-address.json?v=1')).json();
      const byZip = {}, provs = new Set();
      for (const [prov, ams] of j.data) { provs.add(prov); for (const [dist, subs] of ams) for (const [sub, zip] of subs) (byZip[zip] ||= []).push({ sub, dist, prov, zip }); }
      S.addr = { byZip, provs: [...provs] };
      if (S.thread) renderForm();
    } catch (e) { S.addr = { byZip: {}, provs: [], err: true }; }
  }
  // แยก ชื่อ / เบอร์ / ที่อยู่ จากข้อความลูกค้า — ต้องมีเบอร์โทร + รหัสไปรษณีย์ที่มีจริง · ตำบล อำเภอ จังหวัดเลือกจากรหัสไปรษณีย์ (ตรงกับคำในข้อความ)
  const MARK = '(?:ต\\.|ตำบล|แขวง|อ\\.|อำเภอ|เขต|จ\\.|จังหวัด)';
  const ORDERW = /^(เก็บ(เงิน)?ปลายทาง|ปลายทาง|cod|โอน(แล้ว|ชำระ)?(ค่ะ|คะ|ครับ)?|ค่ะ|คะ|ครับ|สั่ง.*|โปร.*|-.*)$/i;
  const reEsc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function parseAddress(text) {
    const byZip = S.addr && S.addr.byZip; if (!byZip) return { ok: false };
    const raw = String(text || '').replace(/\r/g, '');
    const phoneM = raw.match(/(?:\+?66[\s-]?|0)\d(?:[\s-]?\d){7,8}(?!\d)/);
    if (!phoneM) return { ok: false };
    const noPhone = raw.replace(phoneM[0], ' ');
    const zips = [...noPhone.matchAll(/(^|\D)([1-9]\d{4})(?!\d)/g)].map(m => m[2]).filter(z => byZip[z]);
    if (!zips.length) return { ok: false };
    const zip = zips[zips.length - 1];
    let phone = phoneM[0].replace(/\D/g, ''); if (phone.startsWith('66')) phone = '0' + phone.slice(2);
    const flat = noPhone.replace(/\s+/g, ' '), cands = byZip[zip];
    let best = null, bestScore = -1;
    for (const c of cands) { let sc = 0; if (flat.includes(c.sub)) sc += 3; if (flat.includes(c.dist)) sc += 2; if (flat.includes(c.prov)) sc += 1; if (sc > bestScore) { bestScore = sc; best = c; } }
    if (cands.length === 1) { best = cands[0]; bestScore = Math.max(bestScore, 3); }
    const sure = bestScore >= 3;
    const clean = l => l.replace(phoneM[0], ' ').replace(new RegExp('(^|\\D)' + zip + '(?!\\d)'), '$1 ').replace(/(โทร(ศัพท์)?|เบอร์(โทร)?|tel\.?|mobile)\s*[:：.]?/gi, ' ').replace(/\s+/g, ' ').trim();
    const lines = raw.split('\n').map(clean).filter(Boolean);
    const isName = l => !/\d/.test(l) && !new RegExp('(^|\\s)' + MARK).test(l) && !/(หมู่|ซอย|ซ\.|ถนน|ถ\.|บ้านเลขที่|หมู่บ้าน|คอนโด|อาคาร|ชั้น)/.test(l) && !ORDERW.test(l) && /[ก-๙a-z]/i.test(l) && l.length <= 60
      && !(best && l.includes(best.prov) && l.length < best.prov.length + 4);
    const pref = /^(ชื่อ(ผู้รับ)?|ผู้รับ|คุณ|k\.|นาย|นาง|น\.ส\.|นางสาว|ด\.ช\.|ด\.ญ\.)/i;
    let ni = lines.findIndex(l => isName(l) && pref.test(l)); if (ni < 0) ni = lines.findIndex(isName);
    let name = '', rest;
    if (ni >= 0) { name = lines[ni]; rest = lines.filter((_, i) => i !== ni); }
    else {   // ข้อความบรรทัดเดียว: ชื่อ = ข้อความก่อนตัวเลขตัวแรก
      const one = lines.join(' '), m = one.match(/^([^\d]*?)\s*(?=\d)/);
      if (m && m[1] && !new RegExp('(^|\\s)' + MARK).test(m[1])) { name = m[1]; rest = [one.slice(m[0].length)]; } else rest = [one];
    }
    name = name.replace(/^(ชื่อ(ผู้รับ)?|ผู้รับ)\s*[:：]?\s*/, '').replace(/^(คุณ|k\.)\s*/i, '').replace(/[,，:：\-]+$/, '').trim();
    let line = rest.filter(l => !ORDERW.test(l)).join(' ');
    const cuts = [], mk = line.match(new RegExp('(^|\\s)' + MARK)); if (mk) cuts.push(mk.index + mk[1].length);
    if (best) for (const w of [best.sub, best.dist, best.prov]) { const i = line.search(new RegExp('(^|\\s)' + reEsc(w))); if (i >= 0) cuts.push(i); }
    for (const w of ['กรุงเทพฯ', 'กรุงเทพ', 'กทม']) { const i = line.indexOf(w); if (i > 0) cuts.push(i); }
    if (cuts.length) line = line.slice(0, Math.min(...cuts));
    line = line.replace(/^(ส่ง(ที่)?|ที่อยู่(จัดส่ง)?|บ้านเลขที่)\s*[:：]?\s*/, '').replace(/\s{2,}/g, ' ').replace(/^[\s,，-]+|[\s,，-]+$/g, '').trim();
    return { ok: true, name, phone, line, zip, sub: sure ? best.sub : '', dist: sure ? best.dist : '', prov: sure ? best.prov : '', sure };
  }

  // ───── ฟอร์มสร้างคำสั่งซื้อ (แยกตามแชท ไม่หายเมื่อสลับไปแชทอื่น) ─────
  const keyOf = () => S.sel ? S.sel.page_id + ':' + S.sel.psid : '';
  function draft() {
    const k = keyOf();
    if (!S.drafts[k]) {
      const f = S.drafts[k] = { step: 1, lines: [], price: null, priceEdited: false, disc: 0, ship: 0, pay: PAYS[0], payFrom: '', name: '', phone: '', line: '', sub: '', dist: '', prov: '', zip: '', note: '', autoFilledFrom: null, cust: null, done: null };
      // วิธีชำระเงินจากข้อความลูกค้าล่าสุดที่พูดถึง (เช่น "โอนค่ะ" / "เก็บปลายทาง") · แอดมินเปลี่ยนได้
      const ms = (S.thread && S.thread.messages) || [];
      for (let i = ms.length - 1; i >= 0; i--) {
        const x = ms[i]; if (x.dir !== 'in' || !x.text || x.text.length > 60) continue;
        if (/โอน|transfer/i.test(x.text)) { f.pay = PAYS[1]; f.payFrom = x.text.trim(); break; }
        if (/ปลายทาง|\bcod\b/i.test(x.text)) { f.pay = PAYS[0]; f.payFrom = x.text.trim(); break; }
      }
    }
    return S.drafts[k];
  }
  function comboKey(lines) {
    const by = {};
    for (const l of lines) by[l.parent] = (by[l.parent] || 0) + (Number(l.qty) || 0);
    return Object.keys(by).sort().map(p => p + 'x' + by[p]).join('+');
  }
  function suggest(lines) {
    if (!lines.length) return { price: 0, how: '' };
    const k = comboKey(lines), c = S.combos[k];
    if (c) return { price: Number(c.price), how: `ราคาที่ชุดนี้ขายบ่อยสุด (${num(c.orders)} ออเดอร์ใน 30 วัน)`, combo: k };
    let s = 0; for (const l of lines) { const p = S.prodBy[l.sku] || S.products.find(x => x.parent === l.parent); if (p && !p.gift) s += Number(p.rsp || 0) * (Number(l.qty) || 0); }
    return { price: s, how: 'ราคาปกติรวม (ชุดนี้ยังไม่เคยขายใน 30 วัน)', combo: k };
  }
  function addrValid(f) {
    const cands = (S.addr && S.addr.byZip[f.zip]) || [];
    return cands.some(c => c.sub === f.sub && c.dist === f.dist && c.prov === f.prov);
  }
  const phoneOk = p => /^0\d{8,9}$/.test(String(p || '').replace(/\D/g, ''));
  function missing(f) {
    const m = [];
    if (!f.lines.length) m.push('สินค้า');
    if (f.lines.some(l => !l.sku)) m.push('เลือกเฉดสินค้า');
    if (f.price == null || f.price < 0) m.push('ราคาสินค้ารวม');
    if (Number(f.disc) > Number(f.price)) m.push('ส่วนลดเกินราคา');
    if (!f.name.trim()) m.push('ชื่อผู้รับ');
    if (!phoneOk(f.phone)) m.push('เบอร์โทร');
    if (!f.line.trim()) m.push('บ้านเลขที่ / ถนน');
    if (!addrValid(f)) m.push('ตำบล / อำเภอ / จังหวัด / รหัสไปรษณีย์');
    return m;
  }

  // ค่าที่ใช้ซ้ำในฟอร์ม (คำนวณใหม่ทุกครั้งที่ข้อมูลเปลี่ยน ไม่แก้ค่าในฟอร์ม)
  function calc(f) {
    const total = Number(f.price || 0) - Number(f.disc || 0) + Number(f.ship || 0);
    const s1 = f.lines.length && !f.lines.some(l => !l.sku), s3 = !!(f.name.trim() && phoneOk(f.phone) && f.line.trim() && addrValid(f));
    const itemsTx = f.lines.map(l => (S.prodBy[l.sku]?.name || S.parentName[l.parent] || l.parent) + ' ×' + l.qty + (S.prodBy[l.sku]?.gift ? ' (แถม)' : '')).join(' · ');
    return { total, s1, s3, itemsTx, sg: suggest(f.lines) };
  }
  // หัวขั้นตอน (ไม่มีช่องกรอก → เปลี่ยนทั้งก้อนได้โดยไม่ทำให้ช่องที่กำลังพิมพ์หลุด)
  function headHtml(f, n, c) {
    const done = (n === 1 && c.s1) || (n === 2 && c.s1) || (n === 3 && c.s3);
    const H = {
      1: ['ตะกร้า', f.lines.length ? c.itemsTx : 'ค้นหาสินค้าแล้วกดใส่ตะกร้า', f.step !== 1 && f.lines.length ? `<span class="amt">${num(f.price)}</span><span class="ed">แก้</span>` : ''],
      2: ['การชำระเงิน', f.pay + (f.pay === PAYS[0] ? ' · ยอดเก็บ ' + num(c.total) : ''), f.step !== 2 ? '<span class="ed">แก้</span>' : ''],
      3: ['ที่อยู่จัดส่ง', c.s3 ? `${f.name} · ${f.sub} ${f.dist} ${f.prov} ${f.zip}` : f.autoFilledFrom ? 'ระบบแยกให้แล้ว ตรวจอีกครั้ง' : 'ชื่อ เบอร์ ที่อยู่ผู้รับ', f.step !== 3 && c.s3 ? '<span class="ed">แก้</span>' : ''],
      4: ['ตรวจแล้วสร้าง', 'เพจ · พนักงานขาย · Ads ระบบใส่ให้เอง', ''],
    }[n];
    return `<div class="stp-h${f.step === n ? ' open' : done ? ' done' : ''}" data-step="${n}"><i>${n}</i><div><b>${H[0]}</b><small>${esc(H[1])}</small></div>${H[2]}</div>`;
  }
  const hintHtml = (f, c) => f.lines.length ? (f.priceEdited ? `แก้จากที่ระบบเติม (${num(c.sg.price)}) · <button type="button" class="lnk" id="priceReset">ใช้ราคาระบบ</button>` : esc(c.sg.how)) : '';
  const payNoteHtml = (f, c) => (f.pay === PAYS[0] ? `ขนส่งเก็บเงินปลายทาง <b>${num(c.total)}</b> (เท่ากับรวมทั้งสิ้น)` : 'ลูกค้าโอนก่อนส่ง · ตรวจสลิปในแชทก่อนกดสร้าง') + (f.payFrom ? `<br>ระบบเลือกให้จากข้อความลูกค้า "${esc(f.payFrom)}"` : '');
  const phStatHtml = f => f.phone ? (phoneOk(f.phone) ? '<span class="ok">✓ ถูกต้อง</span>' : '<span class="no">ต้องเป็น 9–10 หลัก ขึ้นต้นด้วย 0</span>') : '';
  const custHtml = f => f.cust ? (f.cust.orders ? `ลูกค้าเก่า · เคยสั่ง ${num(f.cust.orders)} ครั้ง (ล่าสุด ${esc(f.cust.last_date || '')})` : 'เบอร์นี้ยังไม่เคยสั่งซื้อ') : phoneOk(f.phone) ? 'กำลังเช็คประวัติลูกค้า…' : '';
  const oldAddrHtml = f => f.cust && f.cust.addresses && f.cust.addresses.length ? `<div class="chk">ที่อยู่เดิมของเบอร์นี้ (กดเพื่อใช้)</div><div class="oldaddr">${f.cust.addresses.map((a, i) => `<button type="button" data-oa="${i}">${esc(a.name)} · ${esc(a.line)} ${esc(a.sub)} ${esc(a.dist)} ${esc(a.prov)} ${esc(a.zip)}</button>`).join('')}</div>` : '';
  function s4Html(f, c) {
    const t = S.thread.thread, ad = S.thread.ad;
    return `<div class="kv"><span>เพจ</span><b>${esc(t.sub_channel || '')}</b></div>
      <div class="kv"><span>พนักงานขาย</span><b>${esc((S.perm && (S.perm.name || S.perm.email)) || '')}</b></div>
      <div class="kv"><span>ชื่อเฟซลูกค้า</span><b>${esc(t.name || '—')}</b></div>
      <div class="kv"><span>มาจาก Ads</span><b>${ad ? esc((ad.title || ad.ad_id) + (ad.product ? ' · ' + ad.product : '')) : 'ไม่ได้มาจาก Ads'}</b></div>
      <div class="kv"><span>สินค้า</span><b>${esc(f.lines.length ? c.itemsTx : '—')}</b></div>
      <div class="kv"><span>${f.pay === PAYS[0] ? 'ยอดเก็บปลายทาง' : 'ยอดโอน'}</span><b>${num(c.total)}</b></div>`;
  }

  function renderForm() {
    const of = $('of');
    if (!S.thread) return;
    const f = draft(), ad = S.thread.ad;
    if (f.price == null || !f.priceEdited) f.price = suggest(f.lines).price;
    // ที่อยู่ในแชทล่าสุด → กรอกให้เองถ้าฟอร์มยังว่าง
    if (S.found && S.found.length && !f.name && !f.phone && !f.line && !f.zip) { applyAddress(S.found[S.found.length - 1].a, false); return; }
    const c = calc(f);
    const adParents = (ad && ad.parent_skus) || [];
    const combos = adParents.length ? S.comboList.filter(x => adParents.some(p => x.combo.split('+').some(y => y.replace(/x\d+$/, '') === p))).slice(0, 3) : [];
    const comboName = x => x.split('+').map(y => { const m = y.match(/^(.*)x(\d+)$/); return m ? `${S.parentName[m[1]] || m[1]} ${m[2]}` : y; }).join(' + ');
    let h = '';
    // ① ตะกร้า
    h += headHtml(f, 1, c);
    h += `<div class="stp-b${f.step === 1 ? ' on' : ''}">
      <div class="srchw"><input class="wh-in srch" id="pQ" placeholder="ค้นหาสินค้า: ชื่อ / รหัส / เฉด" autocomplete="off"><div class="dd-list" id="pList"></div></div>
      ${combos.length ? `<div class="sug">ชุดที่ขายบ่อย <span class="ads-info-wrap"><span>ⓘ</span><span class="ads-info-popover"><b>ชุดที่ขายบ่อย</b><br>ชุดสินค้าบน Facebook ที่มีสินค้าของ Ads นี้ เรียงตามจำนวนออเดอร์ 30 วันล่าสุด (ไม่รวมตัวแทน / Modern Trade) · กดแล้วใส่ตะกร้าทั้งชุด แก้ต่อได้ เป็นทางลัดเท่านั้น</span></span> · <b>${esc(ad.product || '')}</b> (สินค้าใน Ads นี้)</div>
        <div class="qs">${combos.map(x => `<button type="button" data-combo="${esc(x.combo)}"><span>${esc(comboName(x.combo))}</span><b>${num(x.price)}</b></button>`).join('')}</div>` : ''}
      <div class="bk">${f.lines.length ? f.lines.map((l, i) => {
        const p = S.prodBy[l.sku], kids = S.products.filter(x => x.parent === l.parent && x.status !== 'Discontinued');
        return `<div class="bl"><div class="bn"><b title="${esc(p ? p.name : '')}">${esc(p ? p.name : (S.parentName[l.parent] || l.parent))}</b>
          <small>${l.sku ? `${p && p.gift ? '<i class="gift">ของแถม</i> ' : ''}${p && p.status === 'Discontinued' ? '<i class="old">เลิกผลิต</i> ' : ''}${esc(l.sku)} · ${p && p.stock != null ? 'คงเหลือ ' + num(p.stock) : 'ไม่มีข้อมูลสต็อก'}` : `<span class="no">เลือกเฉด:</span> ${kids.map(k => `<button type="button" class="lnk" data-shade="${i}" data-sku="${esc(k.sku)}"${k.stock != null && k.stock <= 0 ? ' disabled title="หมด"' : ''}>${esc(k.name.replace(k.pname, '').trim() || k.sku)}</button>`).join(' · ')}`}</small></div>
          <div class="stq"><button type="button" data-q="${i}" data-d="-1" aria-label="ลดจำนวน">−</button><input data-qi="${i}" value="${l.qty}" inputmode="numeric" aria-label="จำนวน"><button type="button" data-q="${i}" data-d="1" aria-label="เพิ่มจำนวน">+</button></div>
          <button type="button" class="rm" data-rm="${i}" title="เอาออก" aria-label="เอาออก">×</button></div>`;
      }).join('') : '<div class="empty">ยังไม่มีสินค้าในตะกร้า</div>'}</div>
      <div class="tot">
        <div class="rw"><span>ราคาสินค้ารวม <span class="ads-info-wrap"><span>ⓘ</span><span class="ads-info-popover"><b>ราคาสินค้ารวม (ยอดรวมสินค้า)</b><br>ระบบเติมให้: ถ้าตะกร้าตรงกับชุดที่เคยขาย ใช้ราคาที่ชุดนั้นขายบ่อยที่สุดบน Facebook 30 วันล่าสุด (ยอดต่อออเดอร์ · ไม่รวมตัวแทน / Modern Trade) · ถ้าไม่เคยขาย ใช้ราคาปกติของสินค้ารวมกัน (ของแถม = 0) · แอดมินแก้ได้เสมอ<br>รวมทั้งสิ้น = ราคาสินค้ารวม − ส่วนลดท้ายบิล + ค่าส่ง (สูตรเดียวกับไฟล์ออเดอร์ Facebook)</span></span></span><input class="wh-in big" id="fPrice" inputmode="decimal" value="${f.lines.length ? f.price : ''}"></div>
        <div class="hint${f.priceEdited ? ' ed' : ''}" id="pHint">${hintHtml(f, c)}</div>
        <div class="rw"><span>ส่วนลดท้ายบิล <span class="ads-info-wrap"><span>ⓘ</span><span class="ads-info-popover"><b>ส่วนลดท้ายบิล</b><br>ส่วนลดทั้งบิล หักจากราคาสินค้ารวม ใส่เป็นจำนวนเงิน</span></span></span><input class="wh-in" id="fDisc" inputmode="decimal" value="${f.disc || 0}"></div>
        <div class="rw"><span>ค่าส่ง</span><input class="wh-in" id="fShip" inputmode="decimal" value="${f.ship || 0}"></div>
        <div class="rw sum"><span>รวมทั้งสิ้น</span><span id="fTotal">${num(c.total)}</span></div>
      </div>
      <div style="text-align:right;margin-top:8px"><button type="button" class="wh-btn" data-go="2">ต่อไป</button></div>
    </div>`;
    // ② การชำระเงิน
    h += headHtml(f, 2, c);
    h += `<div class="stp-b${f.step === 2 ? ' on' : ''}">
      <div class="seg">${PAYS.map(p => `<button type="button" data-pay="${esc(p)}" class="${f.pay === p ? 'on' : ''}">${p === PAYS[1] ? 'โอนเงิน' : p}</button>`).join('')}</div>
      <div class="pay-note" id="payNote">${payNoteHtml(f, c)}</div>
      <div style="text-align:right;margin-top:8px"><button type="button" class="wh-btn" data-go="3">ต่อไป</button></div>
    </div>`;
    // ③ ที่อยู่จัดส่ง
    const cands = (S.addr && S.addr.byZip[f.zip]) || [];
    const dists = [...new Set(cands.map(x => x.dist))];
    const zipBad = f.zip && f.zip.length === 5 && !cands.length;
    h += headHtml(f, 3, c);
    h += `<div class="stp-b${f.step === 3 ? ' on' : ''}">
      ${f.autoFilledFrom ? `<div class="found">📍 กรอกจากข้อความลูกค้า ${esc(f.autoFilledFrom)} · ตรวจอีกครั้งก่อนสร้าง</div>` : ''}
      <button type="button" class="lnk" id="pasteTg">${f.pasteOpen ? '▾' : '▸'} วางข้อความที่อยู่เอง</button>
      <div class="pastebox${f.pasteOpen ? ' on' : ''}" style="margin-top:6px"><textarea class="wh-in" id="pasteTx" placeholder="วางชื่อ เบอร์ ที่อยู่ ที่ลูกค้าพิมพ์มา"></textarea><div style="text-align:right;margin-top:4px"><button type="button" class="wh-btn" id="pasteGo">แยกที่อยู่</button></div></div>
      <div style="height:6px"></div>
      <div id="oldAddr">${oldAddrHtml(f)}</div>
      <div class="fld"><label for="fName">ชื่อผู้รับ</label><input class="wh-in" id="fName" value="${esc(f.name)}" autocomplete="off"></div>
      <div class="fld"><label for="fPhone">เบอร์โทร <span id="phStat">${phStatHtml(f)}</span></label><input class="wh-in${f.phone && !phoneOk(f.phone) ? ' bad' : ''}" id="fPhone" value="${esc(f.phone)}" inputmode="tel" autocomplete="off"></div>
      <div class="fld"><label for="fLine">บ้านเลขที่ / หมู่ / ซอย / ถนน</label><input class="wh-in" id="fLine" value="${esc(f.line)}" autocomplete="off"></div>
      <div class="g2">
        <div class="fld"><label for="fZip">รหัสไปรษณีย์</label><input class="wh-in${zipBad ? ' bad' : ''}" id="fZip" value="${esc(f.zip)}" inputmode="numeric" maxlength="5" autocomplete="off"></div>
        <div class="fld"><label>ตำบล / แขวง</label><div class="ui-dd" id="fSub"></div></div>
        <div class="fld"><label>อำเภอ / เขต</label><input class="wh-in" value="${esc(f.dist)}" readonly tabindex="-1" placeholder="${dists.length > 1 ? 'เลือกตำบลก่อน' : ''}"></div>
        <div class="fld"><label>จังหวัด</label><input class="wh-in" value="${esc(f.prov)}" readonly tabindex="-1"></div>
      </div>
      <div class="chk ${f.zip ? (addrValid(f) ? 'ok' : 'no') : ''}">${!S.addr ? 'กำลังโหลดฐานข้อมูลไปรษณีย์…' : !f.zip ? 'ใส่รหัสไปรษณีย์ แล้วเลือกตำบล — อำเภอและจังหวัดเติมให้เอง' : zipBad ? 'ไม่พบรหัสไปรษณีย์นี้ในฐานข้อมูลไปรษณีย์' : addrValid(f) ? '✓ ตำบล อำเภอ จังหวัด และรหัสไปรษณีย์ ตรงกันตามฐานข้อมูลไปรษณีย์' : 'เลือกตำบลให้ตรงกับรหัสไปรษณีย์'}</div>
      <div class="chk" id="custLine">${custHtml(f)}</div>
      <div class="fld"><label for="fNote">หมายเหตุถึงคลัง / ขนส่ง (ถ้ามี)</label><input class="wh-in" id="fNote" value="${esc(f.note)}" placeholder="เช่น โทรก่อนส่ง" autocomplete="off"></div>
      <div style="text-align:right;margin-top:4px"><button type="button" class="wh-btn" data-go="4">ต่อไป</button></div>
    </div>`;
    // ④ ตรวจแล้วสร้าง
    h += headHtml(f, 4, c);
    h += `<div class="stp-b${f.step === 4 ? ' on' : ''}" id="s4">${s4Html(f, c)}</div>`;
    if (f.done) h = `<div class="ord-ok">✓ สร้างคำสั่งซื้อ <b>${esc(f.done.order_no)}</b> แล้ว · ยอด ${num(f.done.total)} · ดูได้ที่เมนู "ออเดอร์จากแชท"</div><div style="text-align:center"><button type="button" class="wh-btn" id="newOrd">เปิดบิลใหม่ให้ลูกค้าคนนี้</button></div>`;
    of.innerHTML = h;
    $('ofF').style.display = f.done ? 'none' : '';
    syncFoot(f);
    bindForm(f);
  }

  // แถบล่าง (ปุ่มสร้าง / สิ่งที่ยังขาด / เตือนบิลซ้ำ) + ป้ายลูกค้าเก่า-ใหม่
  function syncFoot(f) {
    const cust = $('custChip'), n = (S.thread.orders || []).length;
    if (f.cust) { cust.style.display = ''; cust.className = 'chip-new' + (f.cust.orders ? ' old' : ''); cust.textContent = f.cust.orders ? `ลูกค้าเก่า · ${num(f.cust.orders)} ครั้ง` : 'ลูกค้าใหม่'; }
    else { cust.style.display = n ? '' : 'none'; cust.className = 'chip-new old'; cust.textContent = `สร้างจากหน้านี้แล้ว ${n} ครั้ง`; }
    const bills = S.thread.bills || [];
    $('ofBill').style.display = bills.length && !f.done ? '' : 'none';
    $('ofBill').textContent = bills.length ? `แชทนี้เปิดบิลแล้ว ${bills.join(', ')} (สรุปคำสั่งซื้อในแชท) · ตรวจก่อนสร้างซ้ำ` : '';
    const miss = missing(f);
    $('btnCreate').disabled = !!miss.length || S.busy;
    $('ofMiss').className = miss.length ? 'no' : ''; $('ofMiss').textContent = miss.length ? 'ยังขาด: ' + miss.join(' · ') : '';
  }
  // อัปเดตเฉพาะส่วนที่แสดงผล ไม่สร้างช่องกรอกใหม่ (ช่องที่กำลังพิมพ์ / Tab ไปช่องถัดไป ไม่หลุด)
  function syncForm(f) {
    if (!S.thread || f.done || f !== S.drafts[keyOf()]) return;
    const c = calc(f), of = $('of');
    for (let n = 1; n <= 4; n++) { const el = of.querySelector(`.stp-h[data-step="${n}"]`); if (el) el.outerHTML = headHtml(f, n, c); }
    const set = (id, html) => { const el = $(id); if (el && el.innerHTML !== html) el.innerHTML = html; };
    if ($('fTotal')) $('fTotal').textContent = num(c.total);
    if ($('pHint')) { set('pHint', hintHtml(f, c)); $('pHint').classList.toggle('ed', !!f.priceEdited); }
    set('payNote', payNoteHtml(f, c)); set('phStat', phStatHtml(f)); set('custLine', custHtml(f)); set('oldAddr', oldAddrHtml(f)); set('s4', s4Html(f, c));
    if ($('fPhone')) $('fPhone').classList.toggle('bad', !!f.phone && !phoneOk(f.phone));
    syncFoot(f);
  }

  function bindForm(f) {
    const of = $('of');
    if (f.done) { $('newOrd').onclick = () => { delete S.drafts[keyOf()]; renderForm(); }; return; }
    of.onclick = e => {
      const sh = e.target.closest('.stp-h'); if (sh) { f.step = Number(sh.dataset.step); renderForm(); return; }
      const go = e.target.closest('[data-go]'); if (go) { f.step = Number(go.dataset.go); renderForm(); return; }
      const cb = e.target.closest('[data-combo]'); if (cb) { addCombo(f, cb.dataset.combo); return; }
      const q = e.target.closest('[data-q]'); if (q) { const l = f.lines[q.dataset.q]; l.qty = Math.max(1, Math.min(999, l.qty + Number(q.dataset.d))); afterLines(f); return; }
      const rm = e.target.closest('[data-rm]'); if (rm) { f.lines.splice(Number(rm.dataset.rm), 1); afterLines(f); return; }
      const shd = e.target.closest('[data-shade]'); if (shd) { if (shd.disabled) return; const l = f.lines[shd.dataset.shade]; l.sku = shd.dataset.sku; mergeLines(f); afterLines(f); return; }
      const pay = e.target.closest('[data-pay]'); if (pay) { f.pay = pay.dataset.pay; f.payFrom = ''; renderForm(); return; }
      const oa = e.target.closest('[data-oa]'); if (oa) { const a = f.cust.addresses[oa.dataset.oa]; Object.assign(f, { name: a.name, line: a.line, sub: a.sub, dist: a.dist, prov: a.prov, zip: a.zip }); renderForm(); return; }
      if (e.target.id === 'priceReset') { f.priceEdited = false; f.price = suggest(f.lines).price; renderForm(); return; }
      if (e.target.id === 'pasteTg') { f.pasteOpen = !f.pasteOpen; renderForm(); return; }
      if (e.target.id === 'pasteGo') { const a = parseAddress($('pasteTx').value); if (a.ok) { applyAddress(a, true, 'ที่วางเอง'); } else uiAlert('แยกที่อยู่ไม่ได้', { text: 'ต้องมีเบอร์โทรและรหัสไปรษณีย์ 5 หลักในข้อความ' }); return; }
    };
    const num0 = v => { const n = Number(String(v).replace(/[^\d.]/g, '')); return isFinite(n) ? n : 0; };
    const pr = $('fPrice'); if (pr) pr.oninput = () => { f.price = num0(pr.value); f.priceEdited = true; syncForm(f); };
    const ds = $('fDisc'); if (ds) ds.oninput = () => { f.disc = num0(ds.value); syncForm(f); };
    const sp = $('fShip'); if (sp) sp.oninput = () => { f.ship = num0(sp.value); syncForm(f); };
    of.querySelectorAll('input[data-qi]').forEach(inp => inp.onchange = () => { const l = f.lines[inp.dataset.qi]; l.qty = Math.max(1, Math.min(999, Math.round(num0(inp.value)) || 1)); afterLines(f); });
    const bindTx = (id, key) => { const el = $(id); if (!el) return; el.oninput = () => { f[key] = el.value; if (key === 'phone') lookupSoon(f); syncForm(f); }; };
    bindTx('fName', 'name'); bindTx('fPhone', 'phone'); bindTx('fLine', 'line'); bindTx('fNote', 'note');
    // Enter = ไปช่องถัดไป (กรอกด้วยคีย์บอร์ดได้ตลอด)
    const order = ['fName', 'fPhone', 'fLine', 'fZip', 'fNote'];
    order.forEach((id, i) => { const el = $(id); if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const nx = $(order[i + 1]); if (nx) nx.focus(); } }); });
    const z = $('fZip'); if (z) z.oninput = () => { f.zip = z.value.replace(/\D/g, '').slice(0, 5); if (f.zip.length === 5 || !f.zip) { const c = (S.addr && S.addr.byZip[f.zip]) || []; const pick = c.length === 1 ? c[0] : c.find(x => x.sub === f.sub); Object.assign(f, pick ? { sub: pick.sub, dist: pick.dist, prov: pick.prov } : { sub: '', dist: '', prov: '' }); renderForm(); setTimeout(() => { const zz = $('fZip'); if (zz) { zz.focus(); zz.setSelectionRange(zz.value.length, zz.value.length); } }, 0); } else syncForm(f); };
    const subEl = $('fSub');
    if (subEl) {
      const c = (S.addr && S.addr.byZip[f.zip]) || [];
      const items = [['', c.length ? 'เลือกตำบล' : 'ใส่รหัสไปรษณีย์ก่อน'], ...c.map(x => [x.sub + '|' + x.dist, c.filter(y => y.sub === x.sub).length > 1 ? `${x.sub} (${x.dist})` : x.sub])];
      dd(subEl, items, f.sub ? f.sub + '|' + f.dist : '', v => { const [s, d] = v.split('|'); const p = c.find(x => x.sub === s && x.dist === d); Object.assign(f, p ? { sub: p.sub, dist: p.dist, prov: p.prov } : { sub: '', dist: '', prov: '' }); renderForm(); }, '100%');
    }
    bindSearch(f);
    $('btnCreate').onclick = () => createOrder(f);
  }

  // ───── ค้นหาสินค้า ─────
  const nrm = s => String(s || '').toLowerCase().replace(/\s+/g, '');
  function bindSearch(f) {
    const q = $('pQ'), list = $('pList'); if (!q) return;
    let hits = [], idx = 0;
    const show = () => {
      const k = nrm(q.value);
      if (!k) { list.classList.remove('on'); return; }
      const rank = p => (p.stock > 0 ? 0 : 2) + (p.status === 'Discontinued' ? 1 : 0);
      hits = S.products.filter(p => nrm(p.name).includes(k) || nrm(p.pname).includes(k) || nrm(p.sku).includes(k)).sort((a, b) => rank(a) - rank(b) || a.sku.localeCompare(b.sku)).slice(0, 30);
      idx = hits.findIndex(p => !(p.stock <= 0)); if (idx < 0) idx = 0;
      list.innerHTML = `<div class="dl-h">พบ ${num(hits.length)} รายการ</div>` + (hits.length ? hits.map((p, i) => {
        const out = p.stock != null && p.stock <= 0;
        return `<div class="dl${i === idx ? ' on' : ''}${out ? ' out' : ''}" data-i="${i}"><div><b>${esc(p.name)}${p.gift ? '<i class="gift">ของแถม</i>' : ''}${p.status === 'Discontinued' ? '<i class="old">เลิกผลิต</i>' : ''}</b><small>${esc(p.sku)} · ${p.stock == null ? 'ไม่มีข้อมูลสต็อก' : out ? 'หมด' : 'คงเหลือ ' + num(p.stock)}</small></div><span>${num(p.rsp)}</span></div>`;
      }).join('') + '<div class="dl-f">↑ ↓ เลือก · Enter ใส่ตะกร้า · Esc ปิด</div>' : '<div class="empty" style="padding:14px">ไม่พบสินค้า</div>');
      list.classList.add('on');
    };
    const pick = i => { const p = hits[i]; if (!p || (p.stock != null && p.stock <= 0)) return; f.lines.push({ sku: p.sku, parent: p.parent, qty: 1 }); mergeLines(f); q.value = ''; list.classList.remove('on'); afterLines(f, true); };
    q.oninput = show; q.onfocus = show;
    q.onkeydown = e => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!hits.length) return; idx = (idx + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length; list.querySelectorAll('.dl').forEach((x, i) => x.classList.toggle('on', i === idx)); list.querySelector('.dl.on')?.scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'Enter') { e.preventDefault(); pick(idx); }
      else if (e.key === 'Escape') { list.classList.remove('on'); }
    };
    list.onclick = e => { const d = e.target.closest('.dl'); if (d) pick(Number(d.dataset.i)); };
  }
  function closeSearch() { const l = $('pList'); if (l) l.classList.remove('on'); }
  function mergeLines(f) {
    const out = [];
    for (const l of f.lines) { const same = l.sku && out.find(x => x.sku === l.sku); if (same) same.qty = Math.min(999, same.qty + l.qty); else out.push(l); }
    f.lines = out;
  }
  function afterLines(f, focusSearch) { if (!f.priceEdited) f.price = suggest(f.lines).price; renderForm(); if (focusSearch) setTimeout(() => $('pQ')?.focus(), 0); }
  function addCombo(f, combo) {
    for (const part of combo.split('+')) {
      const m = part.match(/^(.*)x(\d+)$/); if (!m) continue;
      const kids = S.products.filter(x => x.parent === m[1] && x.status !== 'Discontinued');
      const only = kids.length === 1 ? kids[0].sku : null;
      f.lines.push({ sku: only, parent: m[1], qty: Number(m[2]) });
    }
    mergeLines(f); f.priceEdited = false; afterLines(f);
  }

  function applyAddress(a, rerender, from) {
    const f = draft();
    Object.assign(f, { name: a.name || f.name, phone: a.phone || f.phone, line: a.line || f.line, zip: a.zip || f.zip, sub: a.sub, dist: a.dist, prov: a.prov });
    f.autoFilledFrom = from || 'ในแชท'; f.pasteOpen = false;
    if (f.step < 3 && rerender) f.step = 3;
    lookupSoon(f, 0);
    renderForm();
  }
  let lkT = null;
  function lookupSoon(f, delay) {
    clearTimeout(lkT);
    const ph0 = String(f.phone || '').replace(/\D/g, '');
    if (f.cust && f.cust._ph === ph0) return;   // เบอร์เดิม ไม่ต้องเช็คซ้ำ
    f.cust = null;
    if (!phoneOk(f.phone)) return;
    const ph = f.phone.replace(/\D/g, '');
    lkT = setTimeout(async () => {
      try { const r = await Auth.rpc('chat_customer_lookup', { p_phone: ph }); if (f.phone.replace(/\D/g, '') === ph) { f.cust = Object.assign(r || {}, { _ph: ph }); syncForm(f); } } catch (e) {}
    }, delay == null ? 700 : delay);
  }

  async function createOrder(f) {
    const miss = missing(f); if (miss.length || S.busy) return;
    const t = S.thread.thread, total = Number(f.price) - Number(f.disc || 0) + Number(f.ship || 0);
    const ok = await uiConfirm('สร้างคำสั่งซื้อ', { text: `${t.name || ''} · ${comboKey(f.lines)} · รวม ${num(total)} (${f.pay})\nส่งถึง ${f.name} ${f.phone} · ${f.line} ${f.sub} ${f.dist} ${f.prov} ${f.zip}`, ok: 'สร้าง', tone: 'pri' });
    if (!ok) return;
    S.busy = true; $('btnCreate').disabled = true; $('btnCreate').textContent = 'กำลังบันทึก…';
    try {
      const r = await Auth.rpc('chat_order_create', { p: {
        page_id: t.page_id, psid: t.psid, items: f.lines.map(l => ({ sku: l.sku, qty: l.qty })),
        subtotal: f.price, bill_discount: f.disc || 0, shipping: f.ship || 0, suggested_price: f.priceEdited ? suggest(f.lines).price : f.price,
        payment_method: f.pay, recipient_name: f.name.trim(), phone: f.phone.replace(/\D/g, ''), address_line: f.line.trim(),
        subdistrict: f.sub, district: f.dist, province: f.prov, zipcode: f.zip, note: f.note } });
      f.done = r;
      openThread(t.page_id, t.psid, true);
    } catch (e) { uiAlert('บันทึกไม่ได้', { text: e.message }); }
    finally { S.busy = false; $('btnCreate').textContent = 'สร้างคำสั่งซื้อ'; renderForm(); }
  }

  // ───── ออเดอร์จากแชท ─────
  const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  function bindOrders() {
    const t = new Date(); $('oFrom').value = isoDate(t); $('oTo').value = isoDate(t);
    try { const v = Number(localStorage.getItem('chat_page_size')); if ([50, 100, 250].includes(v)) S.oSize = v; } catch (e) {}
    const dirty = () => $('oGo').classList.add('dirty');
    $('oFrom').addEventListener('change', dirty); $('oTo').addEventListener('change', dirty);
    $('oGo').onclick = () => { if ($('oFrom').value > $('oTo').value) { uiAlert('ช่วงวันที่ไม่ถูกต้อง', { text: 'วันเริ่มต้องไม่เกินวันสุดท้าย' }); return; } S.oPage = 1; loadOrders(); };
    $('oXls').onclick = exportXls;
    $('oPgBtns').onclick = e => { const b = e.target.closest('button[data-p]'); if (b) { S.oPage += Number(b.dataset.p); renderOrders(); window.scrollTo(0, 0); } };
    $('oPgSize').onclick = e => { const b = e.target.closest('button[data-v]'); if (!b) return; S.oSize = Number(b.dataset.v); try { localStorage.setItem('chat_page_size', String(S.oSize)); } catch (e2) {} S.oPage = 1; renderOrders(); };
  }
  async function loadOrders() {
    setStatus('stOrders', 'กำลังโหลด…', 'ld');
    try {
      S.orders = await Auth.rpc('chat_orders_list', { p_from: $('oFrom').value, p_to: $('oTo').value }) || [];
      $('oGo').classList.remove('dirty');
      setStatus('stOrders', 'Updated ' + fmtT(new Date())); renderOrders();
    } catch (e) { setStatus('stOrders', 'โหลดไม่ได้: ' + e.message, 'bad'); $('oWrap').innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  }
  function renderOrders() {
    const rows = S.orders, pages = Math.max(1, Math.ceil(rows.length / S.oSize)); S.oPage = Math.min(S.oPage, pages);
    if (!rows.length) { $('oWrap').innerHTML = '<div class="empty">ยังไม่มีคำสั่งซื้อจากแชทในช่วงวันที่นี้</div>'; $('oPagerBox').style.display = 'none'; return; }
    const part = rows.slice((S.oPage - 1) * S.oSize, S.oPage * S.oSize);
    const sum = rows.reduce((s, o) => s + Number(o.total || 0), 0);
    const pgLabel = sub => (S.pages.find(p => p.sub === sub) || {}).label || sub;
    const items = c => String(c || '').split('+').map(x => { const m = x.match(/^(.*)x(\d+)$/); return m ? `${(S.prodBy[m[1]] || {}).name || m[1]} ×${m[2]}` : x; }).join(' · ');
    const payShort = p => p === PAYS[0] ? 'เก็บปลายทาง' : p === PAYS[1] ? 'โอนเงิน' : p;
    $('oWrap').innerHTML = `<table class="or-t"><thead><tr><th>เลขที่ / เวลา</th><th>เพจ</th><th>ผู้รับ</th><th>สินค้า</th><th>ยอดรวมสินค้า</th><th>ส่วนลดท้ายบิล</th><th>ค่าส่ง</th><th>รวมทั้งสิ้น</th><th>ชำระเงิน</th><th>พนักงานขาย</th></tr></thead><tbody>${part.map(o => `<tr>
      <td class="nw">${esc(o.order_no)}<small>${esc(fmtWhen(o.created_at))}</small></td><td class="nw" title="${esc(o.sub_channel)}">${esc(pgLabel(o.sub_channel))}</td><td class="l nw">${esc(o.recipient_name)}<small>${esc(o.phone)} · ${esc(o.province)}</small></td><td class="l it2" title="${esc(o.sku_promotion_child)}">${esc(items(o.sku_promotion_child))}</td>
      <td>${num(o.subtotal)}</td><td>${num(o.bill_discount)}</td><td>${num(o.shipping)}</td><td><b>${num(o.total)}</b></td><td class="nw">${esc(payShort(o.payment_method))}</td><td class="nw">${esc(o.sales_admin || '')}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>รวม</td><td colspan="6" style="text-align:left">${num(rows.length)} คำสั่งซื้อ</td><td>${num(sum)}</td><td colspan="2"></td></tr></tfoot></table>`;
    $('oPagerBox').style.display = '';
    $('oPgInfo').textContent = `แสดง ${num((S.oPage - 1) * S.oSize + 1)}–${num(Math.min(S.oPage * S.oSize, rows.length))} จาก ${num(rows.length)} คำสั่งซื้อ`;
    $('oPgBtns').innerHTML = pages > 1 ? `<button class="wh-btn sm" data-p="-1" ${S.oPage <= 1 ? 'disabled' : ''}>‹ ก่อนหน้า</button><span>หน้า ${S.oPage} / ${pages}</span><button class="wh-btn sm" data-p="1" ${S.oPage >= pages ? 'disabled' : ''}>ถัดไป ›</button>` : '';
    [...$('oPgSize').children].forEach(b => b.classList.toggle('on', Number(b.dataset.v) === S.oSize));
  }
  function exportXls() {
    if (!S.orders.length) { uiAlert('ยังไม่มีข้อมูล', { text: 'ไม่มีคำสั่งซื้อจากแชทในช่วงวันที่ที่เลือก' }); return; }
    if (!window.XLSX) { uiAlert('ยังโหลดตัวสร้างไฟล์ไม่เสร็จ', { text: 'ลองกดอีกครั้งในอีกสักครู่' }); return; }
    // (2026-11-27) หัวคอลัมน์ / รูปแบบเหมือนไฟล์ออเดอร์ Facebook ที่นำเข้าในหน้าอัปโหลด (โปรแกรมเปิดบิลเดิม)
    // สินค้า = "SKU (จำนวน), SKU (จำนวน)" · วันที่ = ปี ค.ศ. "YYYY-MM-DD HH:mm:ss" (เวลาไทย) · ชื่อลูกค้า = ชื่อผู้รับ
    const dt = iso => { const d = new Date(iso); return `${isoDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
    const skuQty = c => String(c || '').split('+').map(x => { const m = x.match(/^(.*)x(\d+)$/); return m ? `${m[1]} (${m[2]})` : x; }).join(', ');
    const rows = S.orders.map(o => ({
      'เลขที่คำสั่งซื้อ': o.order_no, 'วันที่สั่งซื้อ': dt(o.created_at), 'ชื่อช่องทางการขาย': o.sub_channel,
      'ชื่อลูกค้า': o.recipient_name, 'เบอร์โทร': o.phone, 'ที่อยู่': o.address_line, 'ตำบล/ แขวง': o.subdistrict, 'เขต/ อำเภอ': o.district,
      'จังหวัด': o.province, 'รหัสไปรษณีย์': o.zipcode, 'รหัสสินค้า (SKU) (จำนวน)': skuQty(o.sku_promotion_child),
      'ยอดรวมสินค้า': Number(o.subtotal), 'ส่วนลดท้ายบิล': Number(o.bill_discount), 'ค่าขนส่ง': Number(o.shipping), 'รวมทั้งสิ้น': Number(o.total),
      'การชำระเงิน': o.payment_method, 'พนักงานขาย': o.sales_admin || '', 'หมายเหตุ': o.note || '', 'ชื่อเฟซ': o.customer_fb_name || '', 'รหัส Ads': o.ad_id || '' }));
    const ws = XLSX.utils.json_to_sheet(rows), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ออเดอร์จากแชท');
    XLSX.writeFile(wb, `ออเดอร์จากแชท_${$('oFrom').value}_${$('oTo').value}.xlsx`);
  }
})();
