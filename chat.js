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
    loadAddr(); loadAllTags();
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
      const tq = e.target.closest('[data-tq]'); if (tq) { $('fQ').value = '#' + tq.dataset.tq; S.q = $('fQ').value; S.list = []; S.more = true; loadList(true); return; }   // กดแท็ก = ค้นหาแท็กนี้
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
  // ชื่อเพจตามที่ตั้งใน Facebook (เมฆขอ 27 พ.ย.) · ไม่มีชื่อ = ชื่อย่อ
  const pgName = id => { const p = S.pages.find(x => x.id === id); return p ? (p.name || p.label) : ''; };
  function renderPageDd() {
    const items = [['', `ทุกเพจ (${S.pages.length})`], ...S.pages.map(p => [p.id, p.name || p.label])];
    dd($('fPage'), items, S.page, v => { S.page = v; renderPageDd(); S.list = []; S.more = true; refreshInbox(false); }, '260px');
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
          <div class="r2"><span class="tag pg" style="--c:${esc(t.page_color || 'var(--ch-facebook)')}" title="${esc(pgName(t.page_id) || t.page_label || '')}"><span>${esc(pgName(t.page_id) || t.page_label || t.page_id)}</span></span>${ad}</div>
          <div class="pv">${esc(t.preview || '')}</div>${(t.tags || []).length ? `<div class="r3">${t.tags.slice(0, 3).map(g => `<button type="button" class="tgs" data-tq="${esc(g)}" title="ค้นหาแท็กนี้">#${esc(g)}</button>`).join('')}${t.tags.length > 3 ? `<span class="tgs more">+${t.tags.length - 3}</span>` : ''}</div>` : ''}</div></div>`;
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
      if (!silent || !same) { renderForm(); renderTags(); }
      syncComposer(!silent || !same);
    } catch (e) { if (!silent) $('msgs').innerHTML = `<div class="empty">เปิดแชทไม่ได้<br>${esc(e.message)}</div>`; }
  }

  // บิลที่เปิดในโปรแกรมเปิดบิลแล้ว (ส่งสรุปคำสั่งซื้อเข้าแชท "เลขที่คำสั่งซื้อ: OD…") → เตือนก่อนสร้างซ้ำ
  const billsOf = msgs => [...new Set(msgs.filter(m => m.dir === 'out' && m.text).map(m => (m.text.match(/เลขที่คำสั่งซื้อ\s*[:：]\s*([A-Z]{2}\d{8,})/) || [])[1]).filter(Boolean))];
  function renderThread(scrollBottom) {
    const { thread: t, ad, messages } = S.thread;
    const ords = S.thread.orders || [];
    S.thread.bills = billsOf(messages);
    $('cvH').innerHTML = `<div class="av">${esc(initials(t.name))}</div>
      <div class="who"><div class="t1">${esc(t.name || 'ลูกค้า ··' + String(t.psid).slice(-4))}</div><div class="t2" title="${esc(t.sub_channel || '')}">เพจ ${esc(pgName(t.page_id) || t.page_label || t.sub_channel || '')}</div></div>
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
      const last = grp[grp.length - 1], lb = last.dir === 'out' ? (last.by ? 'ตอบจากหน้านี้ · ' + last.by : APP_LABEL[last.app_id] || (last.app_id ? 'ข้อความอัตโนมัติ' : '')) : '';
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

  async function fnCall(name, body) {
    const r = await fetch(window.SUPABASE_URL + '/functions/v1/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Auth.token(), apikey: window.SUPABASE_ANON_KEY }, body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j || j.error) throw new Error((j && (j.error || j.message)) || ('เชื่อมต่อไม่ได้ (' + r.status + ')'));
    return j;
  }
  function showImg(url) { $('lb').querySelector('img').src = url; $('lb').classList.add('on'); }

  // ───── ตอบแชท (Edge Function fb-inbox-send) ─────
  // Meta: ตอบจากระบบได้ภายใน 24 ชม. หลังลูกค้าทักล่าสุด · แชทที่เริ่มจากกด Ads อาจได้ถึง 7 วัน (Meta ตัดสินสุดท้าย ส่งไม่ได้จะแจ้งกลับ)
  // (2026-11-27) แนบรูป (jpg / png / gif ไม่เกิน 5 MB) + อีโมจิ (เมฆขอ)
  S.cmp = {}; S.cmpImg = {}; S.sending = false;
  const EMO = ['🙏', '😊', '🥰', '😍', '😘', '🤗', '😄', '😂', '😅', '🥺', '🙇‍♀️', '👍', '👌', '👇', '👉', '💖', '💕', '💜', '💙', '❤️', '✨', '🌸', '🎁', '🎉', '🔥', '⭐', '💯', '✅', '‼️', '❗', '🚚', '📦', '🛒', '💰', '💳', '📍', '📞', '⏰', '💄', '🧴'];
  function winOf(t, ad) {
    const now = Date.now(), lastIn = t.last_in_at ? new Date(t.last_in_at).getTime() : 0, left = lastIn + 864e5 - now;
    if (lastIn && left > 0) return { open: true, cls: left < 3600e3 ? 'warn' : '', txt: `ตอบได้อีก ${left >= 3600e3 ? Math.floor(left / 3600e3) + ' ชม. ' : ''}${Math.floor((left % 3600e3) / 60e3)} นาที` };
    const adAt = ad && ad.at ? new Date(ad.at).getTime() : 0;
    if (lastIn && adAt && now - adAt < 7 * 864e5) return { open: true, cls: 'warn', txt: `แชทจาก Ads ตอบได้ถึง ${fmtWhen(new Date(adAt + 7 * 864e5).toISOString())} (ถ้า Meta ไม่รับ ให้ตอบใน Business Suite)` };
    return { open: false, cls: 'bad', txt: lastIn ? 'เกิน 24 ชม. หลังลูกค้าทักล่าสุดแล้ว — ตอบใน Business Suite (ปุ่ม "เปิดใน Facebook")' : 'ลูกค้ายังไม่ได้ทักเพจ — ส่งข้อความไม่ได้' };
  }
  function syncComposer(reset) {
    const tx = $('cmpTx'), bt = $('cmpBtn'), nt = $('cmpNote'); if (!tx || !S.thread) return;
    const k = keyOf(), w = winOf(S.thread.thread, S.thread.ad), img = S.cmpImg[k];
    if (reset) { tx.value = S.cmp[k] || ''; $('emoPop').classList.remove('on'); }
    tx.disabled = !w.open || S.sending;
    $('emoBtn').disabled = $('imgBtn').disabled = !w.open || S.sending;
    tx.placeholder = w.open ? 'พิมพ์ข้อความตอบลูกค้า · Enter ส่ง' : 'ตอบจากหน้านี้ไม่ได้แล้ว — กด "เปิดใน Facebook" ด้านบน';
    bt.disabled = !w.open || S.sending || (!tx.value.trim() && !img);
    bt.textContent = S.sending ? 'กำลังส่ง…' : 'ส่ง';
    nt.className = w.cls; nt.textContent = w.txt;
    const n = tx.value.length; $('cmpCnt').textContent = n > 1500 ? `${num(n)} / 2,000` : '';
    const att = $('cmpAtt');
    att.innerHTML = img && w.open ? `<div class="att-chip"><img src="${esc(img.data)}" alt=""><span>${esc(img.name)}<small>รูปจะส่งก่อนข้อความ</small></span><button type="button" id="attDel" title="เอาออก" aria-label="เอารูปออก">×</button></div>` : '';
    att.style.display = att.innerHTML ? '' : 'none';
  }
  function insertAtCursor(tx, s) {
    const a = tx.selectionStart ?? tx.value.length, b = tx.selectionEnd ?? a;
    tx.value = tx.value.slice(0, a) + s + tx.value.slice(b); tx.focus(); tx.setSelectionRange(a + s.length, a + s.length);
    S.cmp[keyOf()] = tx.value; syncComposer(false);
  }
  (function bindComposer() {
    const tx = $('cmpTx'), pop = $('emoPop');
    pop.innerHTML = EMO.map(e => `<button type="button" data-emo="${e}">${e}</button>`).join('');
    tx.addEventListener('input', () => { S.cmp[keyOf()] = tx.value; syncComposer(false); });
    tx.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); sendMsg(); } else if (e.key === 'Escape') pop.classList.remove('on'); });
    tx.addEventListener('paste', e => {   // วางรูปจากคลิปบอร์ด = แนบรูป
      const it = [...(e.clipboardData && e.clipboardData.items || [])].find(x => x.kind === 'file' && /^image\//.test(x.type));
      if (it) { e.preventDefault(); pickImage(it.getAsFile()); }
    });
    $('emoBtn').onclick = () => pop.classList.toggle('on');   // กดซ้ำ = ปิด
    pop.onclick = e => { const b = e.target.closest('[data-emo]'); if (b) insertAtCursor(tx, b.dataset.emo); };
    document.addEventListener('click', e => { if (!e.target.closest('#emoPop, #emoBtn')) pop.classList.remove('on'); });
    $('imgBtn').onclick = () => $('cmpFile').click();
    $('cmpFile').onchange = () => { const f = $('cmpFile').files[0]; $('cmpFile').value = ''; if (f) pickImage(f); };
    $('cmpAtt').onclick = e => { if (e.target.closest('#attDel')) { delete S.cmpImg[keyOf()]; syncComposer(false); } else if (e.target.closest('img')) showImg(S.cmpImg[keyOf()].data); };
    $('cmpBtn').onclick = sendMsg;
  })();
  function pickImage(file) {
    if (!S.thread || !winOf(S.thread.thread, S.thread.ad).open) return;
    if (!/^image\/(jpeg|png|gif)$/.test(file.type)) { uiAlert('แนบรูปไม่ได้', { text: 'ส่งได้เฉพาะรูป jpg / png / gif', tone: 'bad' }); return; }
    if (file.size > 5 * 1024 * 1024) { uiAlert('แนบรูปไม่ได้', { text: 'รูปใหญ่เกิน 5 MB', tone: 'bad' }); return; }
    const k = keyOf(), rd = new FileReader();
    rd.onload = () => { S.cmpImg[k] = { data: rd.result, name: file.name || 'รูปจากคลิปบอร์ด' }; if (keyOf() === k) { syncComposer(false); $('cmpTx').focus(); } };
    rd.readAsDataURL(file);
  }
  async function sendMsg() {
    const tx = $('cmpTx'), text = tx.value.trim(), k = keyOf(), img = S.cmpImg[k];
    if (!S.thread || S.sending || (!text && !img) || !winOf(S.thread.thread, S.thread.ad).open) return;
    const { page_id, psid } = S.thread.thread;
    S.sending = true; syncComposer(false); $('emoPop').classList.remove('on');
    const box = $('msgs'), tmps = [];
    const bubble = (cls, html) => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; box.appendChild(d); tmps.push(d); box.scrollTop = box.scrollHeight; return d; };
    if (img) bubble('b att out sending', `<img src="${esc(img.data)}" alt="">`);
    if (text) bubble('b out sending', esc(text));
    let sentImg = false;
    try {
      if (img) { await fnCall('fb-inbox-send', { page_id, psid, image: img.data }); sentImg = true; delete S.cmpImg[k]; }
      if (text) { await fnCall('fb-inbox-send', { page_id, psid, text }); S.cmp[k] = ''; if (keyOf() === k) tx.value = ''; }
      S.sending = false; tmps.forEach(t => t.classList.remove('sending'));
      if (S.sel && S.sel.page_id === page_id && S.sel.psid === psid) {   // วาดแชทใหม่จากฐานข้อมูล (รูปรอข้อความสะท้อนจาก Meta ~1–2 วิ)
        S.lastMsgId = null; await openThread(page_id, psid, true);
        if (img) setTimeout(() => { if (S.sel && S.sel.psid === psid) { S.lastMsgId = null; openThread(page_id, psid, true); } }, 2500);
      }
      loadList(true, true);
    } catch (e) {
      tmps.forEach(t => t.remove()); S.sending = false;
      uiAlert(sentImg ? 'ส่งรูปแล้ว แต่ข้อความยังไม่ได้ส่ง' : 'ส่งไม่สำเร็จ', { text: e.message, tone: 'bad' });
      if (sentImg && S.sel && S.sel.psid === psid) { S.lastMsgId = null; openThread(page_id, psid, true); }
    } finally { S.sending = false; syncComposer(false); if (keyOf() === k) tx.focus(); }
  }

  // ───── แฮชแท็กลูกค้า (เมฆขอ 27 พ.ย.) — ติดที่แชท (เพจ + ลูกค้า) · ค้นหาในรายการแชทด้วย #แท็ก ─────
  S.allTags = [];
  function loadAllTags() { Auth.rpc('chat_tags_all').then(r => { S.allTags = r || []; }).catch(() => {}); }
  function renderTags() {
    const bar = $('tagBar'); if (!S.thread) { bar.innerHTML = ''; return; }
    const tags = S.thread.thread.tags || [];
    bar.innerHTML = `<span class="tg-l">แท็ก <span class="ads-info-wrap"><span>ⓘ</span><span class="ads-info-popover"><b>แท็กลูกค้า</b><br>ติดป้ายให้ลูกค้าคนนี้ (ในเพจนี้) เช่น #สนใจแต่ยังไม่ซื้อ · #VIP · #ส่งของแล้ว — ทุกคนที่ใช้หน้าแชทเห็นเหมือนกัน<br>ค้นหา: พิมพ์ # ตามด้วยชื่อแท็กในช่องค้นหาด้านซ้าย หรือกดแท็กในรายการแชท · ติดได้ไม่เกิน 10 แท็กต่อคน</span></span></span>
      ${tags.map((t, i) => `<span class="tg">#${esc(t)}<button type="button" data-tdel="${i}" title="เอาแท็กออก" aria-label="เอาแท็กออก">×</button></span>`).join('')}
      <span class="tg-add"><button type="button" class="lnk" id="tgAddBtn">+ เพิ่มแท็ก</button><span class="tg-in" id="tgIn" style="display:none"><input class="wh-in" id="tgTx" placeholder="#พิมพ์แท็ก แล้วกด Enter" maxlength="41" autocomplete="off"><span class="tg-sug" id="tgSug"></span></span></span>`;
  }
  async function setTags(tags) {
    const t = S.thread.thread, k = keyOf();
    try {
      const r = await Auth.rpc('chat_tags_set', { p_page: t.page_id, p_psid: t.psid, p_tags: tags });
      if (keyOf() !== k) return;
      t.tags = r || [];
      const li = S.list.find(x => x.page_id === t.page_id && x.psid === t.psid); if (li) { li.tags = t.tags; renderList(); }
      renderTags(); loadAllTags();
    } catch (e) { uiAlert('บันทึกแท็กไม่ได้', { text: e.message, tone: 'bad' }); }
  }
  (function bindTags() {
    const bar = $('tagBar');
    const sug = () => {
      const q = ($('tgTx').value || '').replace(/^[#＃\s]+/, '').trim().toLowerCase(), have = new Set((S.thread.thread.tags || []).map(x => x.toLowerCase()));
      const hits = S.allTags.filter(x => !have.has(x.tag.toLowerCase()) && (!q || x.tag.toLowerCase().includes(q))).slice(0, 8);
      $('tgSug').innerHTML = hits.map(x => `<button type="button" data-tadd="${esc(x.tag)}">#${esc(x.tag)} <small>${num(x.n)}</small></button>`).join('');
      $('tgSug').style.display = hits.length ? '' : 'none';
    };
    const add = v => { v = String(v || '').replace(/^[#＃\s]+/, '').trim(); if (!v) return; const cur = S.thread.thread.tags || []; if (cur.some(x => x.toLowerCase() === v.toLowerCase())) { renderTags(); return; } setTags([...cur, v]); };
    bar.addEventListener('click', e => {
      const d = e.target.closest('[data-tdel]'); if (d) { const cur = [...(S.thread.thread.tags || [])]; cur.splice(Number(d.dataset.tdel), 1); setTags(cur); return; }
      const a = e.target.closest('[data-tadd]'); if (a) { add(a.dataset.tadd); return; }
      if (e.target.id === 'tgAddBtn') { $('tgAddBtn').style.display = 'none'; $('tgIn').style.display = ''; $('tgTx').focus(); sug(); }
    });
    bar.addEventListener('input', e => { if (e.target.id === 'tgTx') sug(); });
    bar.addEventListener('keydown', e => {
      if (e.target.id !== 'tgTx') return;
      if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) { e.preventDefault(); add(e.target.value); }
      else if (e.key === 'Escape') renderTags();
    });
    bar.addEventListener('focusout', e => { if (e.target.id === 'tgTx') setTimeout(() => { if (!bar.contains(document.activeElement) && $('tgIn') && $('tgIn').style.display !== 'none' && !$('tgTx').value.trim()) renderTags(); }, 200); });
  })();

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
    else {   // ข้อความบรรทัดเดียว (ชื่ออยู่ตรงไหนก็ได้): ชื่อ = กลุ่มคำที่ไม่มีตัวเลข ไม่ใช่คำบอกที่อยู่ / ตำบล อำเภอ จังหวัด / คำลงท้าย
      const one = lines.join(' '), tk = one.split(/\s+/).filter(Boolean);
      const KW = /^(ม\.|หมู่|ซ\.|ซอย|ถ\.|ถนน|ต\.|ตำบล|แขวง|อ\.|อำเภอ|เขต|จ\.|จังหวัด|กทม|กรุงเทพ|บ้านเลขที่|เลขที่|ที่อยู่|ส่ง|อาคาร|คอนโด|ชั้น)/;
      const BARE = /^(ม\.|หมู่|หมู่บ้าน|ซ\.|ซอย|ถ\.|ถนน|อาคาร|คอนโด)$/, END = /^(เก็บ|ปลายทาง|cod|โอน|ค่ะ|คะ|ครับ|นะ|จ้า|ด้วย)/i;
      const place = w => best && [best.sub, best.dist, best.prov].some(p => w.replace(/^(ต\.|อ\.|จ\.|แขวง|เขต|ตำบล|อำเภอ|จังหวัด)/, '') === p || w.includes(p));
      const runs = []; let cur = [], skip = false;
      tk.forEach((w, i) => {
        const bad = /\d/.test(w) || KW.test(w) || place(w) || END.test(w) || skip;
        skip = BARE.test(w);
        if (bad) { if (cur.length) runs.push(cur); cur = []; } else cur.push(i);
      });
      if (cur.length) runs.push(cur);
      const pick = runs.find(r => pref.test(tk[r[0]])) || runs.find(r => r.length <= 4);
      if (pick) { name = pick.map(i => tk[i]).join(' '); rest = [tk.filter((_, i) => !pick.includes(i) && !END.test(tk[i])).join(' ')]; } else rest = [one];
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
      2: ['การชำระเงิน', f.pay + (f.pay === PAYS[0] ? ' · ยอดเก็บ ' + num(c.total) : f.slip ? ' · แนบสลิปแล้ว' : ' · ยังไม่แนบสลิป'), f.step !== 2 ? '<span class="ed">แก้</span>' : ''],
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
    return `<div class="kv"><span>เพจ</span><b title="${esc(t.sub_channel || '')}">${esc(pgName(t.page_id) || t.sub_channel || '')}</b></div>
      <div class="kv"><span>พนักงานขาย</span><b>${esc((S.perm && (S.perm.name || S.perm.email)) || '')}</b></div>
      <div class="kv"><span>ชื่อเฟซลูกค้า</span><b>${esc(t.name || '—')}</b></div>
      <div class="kv"><span>มาจาก Ads</span><b>${ad ? esc((ad.title || ad.ad_id) + (ad.product ? ' · ' + ad.product : '')) : 'ไม่ได้มาจาก Ads'}</b></div>
      <div class="kv"><span>สินค้า</span><b>${esc(f.lines.length ? c.itemsTx : '—')}</b></div>
      <div class="kv"><span>${f.pay === PAYS[0] ? 'ยอดเก็บปลายทาง' : 'ยอดโอน'}</span><b>${num(c.total)}</b></div>${f.pay === PAYS[1] ? `<div class="kv"><span>สลิป</span><b>${f.slip ? 'แนบแล้ว' : 'ยังไม่แนบ'}</b></div>` : ''}`;
  }

  // สลิปโอนเงิน: เลือกรูปที่ลูกค้าส่งในแชท หรืออัปโหลดจากเครื่อง → เก็บสำเนาไว้ในระบบ (Edge Function chat-slip · ลิงก์รูปของ Facebook หมดอายุเองได้)
  function slipHtml(f) {
    if (f.slipBusy) return '<div class="slip"><div class="slip-h">สลิปโอนเงิน</div><div class="chk">กำลังแนบสลิป…</div></div>';
    if (f.slip) return `<div class="slip"><div class="slip-h">สลิปโอนเงิน</div><div class="slip-sel"><button type="button" class="slip-img" id="slipView" title="กดดูรูปเต็ม"><img src="${esc(f.slip.src || f.slip.url || '')}" alt="สลิปที่แนบ"></button><div>✓ แนบแล้ว · <button type="button" class="lnk" id="slipView2">ดูรูปเต็ม</button> · <button type="button" class="lnk" id="slipDel">เอาออก</button></div></div></div>`;
    const imgs = [];
    for (const m of [...((S.thread && S.thread.messages) || [])].reverse()) { if (m.dir !== 'in') continue; (m.att || []).forEach((a, i) => { if (a.type === 'image' && a.url && imgs.length < 6) imgs.push({ id: m.id, i, url: a.url, at: m.at }); }); }
    return `<div class="slip"><div class="slip-h">สลิปโอนเงิน <small>(ถ้ามี)</small> <span class="ads-info-wrap"><span>ⓘ</span><span class="ads-info-popover"><b>แนบสลิป</b><br>กดรูปที่ลูกค้าส่งในแชทนี้ (ใหม่สุดอยู่ซ้าย) หรืออัปโหลดรูปจากเครื่อง (jpg / png / webp ไม่เกิน 5 MB)<br>ระบบเก็บสำเนาไว้กับคำสั่งซื้อ ดูย้อนหลังได้ที่ "ออเดอร์จากแชท" (รูปในแชท Facebook หมดอายุเองได้)</span></span></div>
      ${imgs.length ? `<div class="slip-pick">${imgs.map(x => `<button type="button" data-slipmsg="${x.id}" data-idx="${x.i}" data-src="${esc(x.url)}" title="รูปจากลูกค้า ${esc(fmtWhen(x.at))}"><img src="${esc(x.url)}" alt="" loading="lazy"></button>`).join('')}</div>` : '<div class="chk">ลูกค้ายังไม่ได้ส่งรูปในแชทนี้</div>'}
      <label class="wh-btn sm slip-up">อัปโหลดจากเครื่อง<input type="file" id="slipFile" accept="image/jpeg,image/png,image/webp" hidden></label></div>`;
  }
  async function attachSlip(f, body, src) {
    if (f.slipBusy) return;
    f.slipBusy = true; renderForm();
    try { const r = await fnCall('chat-slip', body); f.slip = { path: r.path, url: r.url, src }; }
    catch (e) { uiAlert('แนบสลิปไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
    finally { f.slipBusy = false; if (f === S.drafts[keyOf()]) renderForm(); }
  }

  // ───── หลังสร้างคำสั่งซื้อ: สรุปเป็นช่อง ๆ + ข้อความสรุปส่งให้ลูกค้าในแชท (เมฆขอ 27 พ.ย.) ─────
  const phoneFmt = p => { const d = String(p || '').replace(/\D/g, ''); return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : d.length === 9 ? `${d.slice(0, 2)}-${d.slice(2, 5)}-${d.slice(5)}` : d; };
  const addrTx = f => { const bkk = f.prov === 'กรุงเทพมหานคร'; return `${f.line} ${bkk ? 'แขวง' : 'ต.'}${f.sub} ${bkk ? 'เขต' : 'อ.'}${f.dist} ${bkk ? '' : 'จ.'}${f.prov} ${f.zip}`.replace(/\s+/g, ' ').trim(); };
  const lineName = l => (S.prodBy[l.sku] && S.prodBy[l.sku].name) || S.parentName[l.parent] || l.sku || l.parent;
  function summaryText(f) {
    const d = f.done, total = Number(f.price || 0) - Number(f.disc || 0) + Number(f.ship || 0), cod = f.pay === PAYS[0];
    const L = [`📦 สรุปคำสั่งซื้อ ${d.order_no}`, '━━━━━━━━━━━━━━', '🛍️ รายการสินค้า'];
    for (const l of f.lines) L.push(`• ${lineName(l)} × ${l.qty}${S.prodBy[l.sku] && S.prodBy[l.sku].gift ? ' (ของแถม)' : ''}`);
    L.push('', `💰 ราคาสินค้า ${num(f.price)} บาท`);
    if (Number(f.disc) > 0) L.push(`🎟️ ส่วนลด −${num(f.disc)} บาท`);
    L.push(`🚚 ค่าส่ง ${Number(f.ship) > 0 ? num(f.ship) + ' บาท' : 'ฟรี'}`, `✅ ยอดรวม ${num(total)} บาท`, '',
      cod ? `💵 ชำระเงิน: เก็บเงินปลายทาง ${num(total)} บาท` : `💳 ชำระเงิน: โอนเงิน${f.slip ? ' (ได้รับสลิปแล้ว)' : ''}`,
      '━━━━━━━━━━━━━━', '📍 ที่อยู่จัดส่ง', `คุณ${f.name.replace(/^คุณ\s*/, '')}`, `โทร ${phoneFmt(f.phone)}`, addrTx(f));
    L.push('', 'ขอบคุณที่สั่งซื้อกับ Deesay นะคะ 🙏', 'หากข้อมูลไม่ถูกต้อง แจ้งแอดมินได้เลยค่ะ');
    return L.join('\n');
  }
  function doneHtml(f) {
    const d = f.done, total = Number(f.price || 0) - Number(f.disc || 0) + Number(f.ship || 0), w = S.thread ? winOf(S.thread.thread, S.thread.ad) : { open: false };
    const row = (k, v) => `<div class="rc-r"><span>${k}</span><b>${v}</b></div>`;
    return `<div class="rc">
      <div class="rc-h"><span class="rc-ok">✓</span><div><b>สร้างคำสั่งซื้อแล้ว</b><small>บันทึกที่ "ออเดอร์จากแชท" · ยังไม่เข้ายอดขายและ Warehouse</small></div></div>
      ${row('เลขที่', esc(d.order_no))}
      ${row('ยอดรวม', `<span class="rc-big">${num(total)}</span>`)}
      ${row('ชำระเงิน', esc(f.pay === PAYS[0] ? 'เก็บเงินปลายทาง' : 'โอนเงิน' + (f.slip ? ' · แนบสลิปแล้ว' : ' · ยังไม่แนบสลิป')))}
      ${row('สินค้า', f.lines.map(l => `${esc(lineName(l))} ×${l.qty}`).join('<br>'))}
      ${row('ผู้รับ', `${esc(f.name)}<br><span class="rc-sub">${esc(phoneFmt(f.phone))}</span>`)}
      ${row('ที่อยู่', esc(addrTx(f)))}
      ${row('พนักงานขาย', esc((S.perm && (S.perm.name || S.perm.email)) || ''))}
    </div>
    <div class="rc-msg">
      <div class="rc-mh">ข้อความสรุปส่งให้ลูกค้า <span class="ads-info-wrap"><span>ⓘ</span><span class="ads-info-popover"><b>ส่งสรุปคำสั่งซื้อ</b><br>ส่งข้อความนี้เข้าแชทลูกค้าในนามเพจ (เหมือนตอบแชทปกติ · ต้องอยู่ในเวลาที่ Meta ให้ตอบ) · กด "แก้ก่อนส่ง" เพื่อนำไปแก้ในช่องพิมพ์ด้านล่างก่อนส่งเอง</span></span></div>
      <div class="rc-pre">${esc(summaryText(f))}</div>
      ${f.sumSent ? `<div class="rc-sent">✓ ส่งสรุปให้ลูกค้าแล้ว ${esc(f.sumSent)}</div>` : ''}
      <div class="rc-btns"><button type="button" class="wh-btn${f.sumSent ? '' : ' pri'}" id="sumSend" ${!w.open || f.sumBusy ? 'disabled' : ''}>${f.sumBusy ? 'กำลังส่ง…' : f.sumSent ? 'ส่งอีกครั้ง' : 'ส่งสรุปให้ลูกค้า'}</button><button type="button" class="wh-btn" id="sumEdit" ${!w.open ? 'disabled' : ''}>แก้ก่อนส่ง</button></div>
      ${!w.open ? '<div class="chk no">เกินเวลาที่ Meta ให้ตอบจากระบบแล้ว — คัดลอกข้อความไปส่งใน Business Suite</div>' : ''}
    </div>
    <div class="rc-foot"><button type="button" class="lnk" id="goOrders">ดูใน "ออเดอร์จากแชท"</button><button type="button" class="wh-btn" id="newOrd">เปิดบิลใหม่ให้ลูกค้าคนนี้</button></div>`;
  }
  async function sendSummary(f) {
    if (f.sumBusy || !S.thread) return;
    const { page_id, psid } = S.thread.thread, k = keyOf();
    if (f.sumSent && !(await uiConfirm('ส่งสรุปอีกครั้ง', { text: 'ส่งสรุปคำสั่งซื้อนี้ให้ลูกค้าไปแล้ว ต้องการส่งซ้ำไหม', ok: 'ส่งอีกครั้ง' }))) return;
    f.sumBusy = true; renderForm();
    try {
      await fnCall('fb-inbox-send', { page_id, psid, text: summaryText(f) });
      f.sumSent = fmtT(new Date());
      if (S.sel && S.sel.psid === psid) { S.lastMsgId = null; openThread(page_id, psid, true); }
      loadList(true, true);
    } catch (e) { uiAlert('ส่งสรุปไม่สำเร็จ', { text: e.message, tone: 'bad' }); }
    finally { f.sumBusy = false; if (keyOf() === k) renderForm(); }
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
      ${f.pay === PAYS[1] ? slipHtml(f) : ''}
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
    if (f.done) h = doneHtml(f);
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
    if (f.done) {
      $('newOrd').onclick = () => { delete S.drafts[keyOf()]; renderForm(); };
      $('goOrders').onclick = () => setView('orders');
      $('sumSend').onclick = () => sendSummary(f);
      $('sumEdit').onclick = () => { const k = keyOf(); S.cmp[k] = summaryText(f); syncComposer(true); $('cmpTx').focus(); $('cmpTx').setSelectionRange(0, 0); $('cmpTx').scrollTop = 0; };
      return;
    }
    of.onclick = e => {
      const sh = e.target.closest('.stp-h'); if (sh) { f.step = Number(sh.dataset.step); renderForm(); return; }
      const go = e.target.closest('[data-go]'); if (go) { f.step = Number(go.dataset.go); renderForm(); return; }
      const cb = e.target.closest('[data-combo]'); if (cb) { addCombo(f, cb.dataset.combo); return; }
      const q = e.target.closest('[data-q]'); if (q) { const l = f.lines[q.dataset.q]; l.qty = Math.max(1, Math.min(999, l.qty + Number(q.dataset.d))); afterLines(f); return; }
      const rm = e.target.closest('[data-rm]'); if (rm) { f.lines.splice(Number(rm.dataset.rm), 1); afterLines(f); return; }
      const shd = e.target.closest('[data-shade]'); if (shd) { if (shd.disabled) return; const l = f.lines[shd.dataset.shade]; l.sku = shd.dataset.sku; mergeLines(f); afterLines(f); return; }
      const pay = e.target.closest('[data-pay]'); if (pay) { f.pay = pay.dataset.pay; f.payFrom = ''; renderForm(); return; }
      const oa = e.target.closest('[data-oa]'); if (oa) { const a = f.cust.addresses[oa.dataset.oa]; Object.assign(f, { name: a.name, line: a.line, sub: a.sub, dist: a.dist, prov: a.prov, zip: a.zip }); renderForm(); return; }
      const sp0 = e.target.closest('[data-slipmsg]'); if (sp0) { attachSlip(f, { action: 'from_chat', msg_id: Number(sp0.dataset.slipmsg), idx: Number(sp0.dataset.idx) }, sp0.dataset.src); return; }
      if (e.target.closest('#slipView, #slipView2')) { if (f.slip) showImg(f.slip.url || f.slip.src); return; }
      if (e.target.closest('#slipDel')) { f.slip = null; renderForm(); return; }
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
    const sf = $('slipFile'); if (sf) sf.onchange = () => {
      const file = sf.files && sf.files[0]; sf.value = ''; if (!file) return;
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { uiAlert('แนบสลิปไม่ได้', { text: 'รับเฉพาะรูป jpg / png / webp', tone: 'bad' }); return; }
      if (file.size > 5 * 1024 * 1024) { uiAlert('แนบสลิปไม่ได้', { text: 'รูปใหญ่เกิน 5 MB', tone: 'bad' }); return; }
      const rd = new FileReader(); rd.onload = () => attachSlip(f, { action: 'upload', data: rd.result }, rd.result); rd.readAsDataURL(file);
    };
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
        subdistrict: f.sub, district: f.dist, province: f.prov, zipcode: f.zip, note: f.note,
        slip_path: f.pay === PAYS[1] && f.slip ? f.slip.path : null } });
      f.done = r;
      openThread(t.page_id, t.psid, true);
    } catch (e) { uiAlert('บันทึกไม่ได้', { text: e.message }); }
    finally { S.busy = false; $('btnCreate').textContent = 'สร้างคำสั่งซื้อ'; renderForm(); if (f.done) $('of').scrollTop = 0; }
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
    $('oWrap').onclick = async e => { const b = e.target.closest('[data-slip]'); if (!b) return; try { showImg((await fnCall('chat-slip', { action: 'view', path: b.dataset.slip })).url); } catch (x) { uiAlert('เปิดสลิปไม่ได้', { text: x.message, tone: 'bad' }); } };
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
    const pgLabel = sub => { const p = S.pages.find(x => x.sub === sub); return p ? (p.name || p.label) : sub; };
    const items = c => String(c || '').split('+').map(x => { const m = x.match(/^(.*)x(\d+)$/); return m ? `${(S.prodBy[m[1]] || {}).name || m[1]} ×${m[2]}` : x; }).join(' · ');
    const payShort = p => p === PAYS[0] ? 'เก็บปลายทาง' : p === PAYS[1] ? 'โอนเงิน' : p;
    $('oWrap').innerHTML = `<table class="or-t"><thead><tr><th>เลขที่ / เวลา</th><th>เพจ</th><th>ผู้รับ</th><th>สินค้า</th><th>ยอดรวมสินค้า</th><th>ส่วนลดท้ายบิล</th><th>ค่าส่ง</th><th>รวมทั้งสิ้น</th><th>ชำระเงิน</th><th>พนักงานขาย</th></tr></thead><tbody>${part.map(o => `<tr>
      <td class="nw">${esc(o.order_no)}<small>${esc(fmtWhen(o.created_at))}</small></td><td class="nw" title="${esc(o.sub_channel)}">${esc(pgLabel(o.sub_channel))}</td><td class="l nw">${esc(o.recipient_name)}<small>${esc(o.phone)} · ${esc(o.province)}</small></td><td class="l it2" title="${esc(o.sku_promotion_child)}">${esc(items(o.sku_promotion_child))}</td>
      <td>${num(o.subtotal)}</td><td>${num(o.bill_discount)}</td><td>${num(o.shipping)}</td><td><b>${num(o.total)}</b></td><td class="nw">${esc(payShort(o.payment_method))}${o.slip_path ? `<small><button type="button" class="lnk" data-slip="${esc(o.slip_path)}">ดูสลิป</button></small>` : ''}</td><td class="nw">${esc(o.sales_admin || '')}</td></tr>`).join('')}</tbody>
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
      'การชำระเงิน': o.payment_method, 'สลิป': o.slip_path ? 'แนบแล้ว' : '', 'พนักงานขาย': o.sales_admin || '', 'หมายเหตุ': o.note || '', 'ชื่อเฟซ': o.customer_fb_name || '', 'รหัส Ads': o.ad_id || '' }));
    const ws = XLSX.utils.json_to_sheet(rows), wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ออเดอร์จากแชท');
    XLSX.writeFile(wb, `ออเดอร์จากแชท_${$('oFrom').value}_${$('oTo').value}.xlsx`);
  }
})();
