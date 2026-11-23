// warehouse.js (2026-11-23) — หน้า Warehouse: ปริ้นใบปะหน้า TikTok จากระบบเราเอง (สั่งจัดส่ง + ดึงใบปะหน้า) / สรุปการจัดส่ง / ประวัติการปริ้น
// ข้อมูลทั้งหมดมาจาก Edge Function `wh-labels` (อ่านสดจาก TikTok + ตารางประวัติ wh_print_log) — หน้านี้ไม่อ่านตารางตรง ๆ
// ช่วงทดสอบ: เข้าได้เฉพาะบัญชีผู้ดูแลระบบ
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const fmtDT = d => `${d.getDate()} ${MON[d.getMonth()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const fmtT = d => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const toLocalInput = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const num = n => Number(n || 0).toLocaleString('en-US');
  const CHUNK = 20;   // จำนวนคำสั่งซื้อต่อ 1 ครั้งที่ส่งให้ระบบหลังบ้าน

  const S = { view: 'print', tab: 'ship', raw: [], rows: [], printed: {}, names: {}, sel: new Set(), page: 1, size: 50, round: '1', mode: 'only', busy: false, pickTab: 'sku', counts: {} };
  try { const z = Number(localStorage.getItem('wh_page_size')); if ([50, 100, 250].includes(z)) S.size = z; } catch (e) {}
  const cuts = (() => { try { return Object.assign({ c1: '10:30', c2: '16:00' }, JSON.parse(localStorage.getItem('wh_cuts') || '{}')); } catch (e) { return { c1: '10:30', c2: '16:00' }; } })();

  async function api(body) {
    const r = await fetch(window.SUPABASE_URL + '/functions/v1/wh-labels', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Auth.token(), apikey: window.SUPABASE_ANON_KEY }, body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch (e) {}
    if (!r.ok || !j || j.error) throw new Error((j && j.error) || ('เชื่อมต่อไม่ได้ (' + r.status + ')'));
    return j;
  }

  // ───── แปลงคำสั่งซื้อ: แตกรหัสชุด "AAAx1+BBBx2" เป็นสินค้าจริงทีละตัว ─────
  function splitSku(s) {
    const out = [];
    String(s || '').split('+').forEach(p => {
      p = p.trim(); if (!p) return;
      const m = p.match(/^(.*?)\s*[xX×]\s*(\d+)$/);
      out.push(m && m[1] ? { code: m[1].trim().toUpperCase(), qty: Number(m[2]) } : { code: p.toUpperCase(), qty: 1 });
    });
    return out.length ? out : [{ code: '(ไม่มี SKU)', qty: 1 }];
  }
  function derive(o) {
    const parts = {}, baskets = {};
    (o.lines || []).forEach(l => {
      splitSku(l.sku).forEach(p => { parts[p.code] = (parts[p.code] || 0) + p.qty; });
      const k = (l.pname || '(ไม่มีชื่อตะกร้า)') + '\u0001' + (l.sku || '');
      baskets[k] = (baskets[k] || 0) + 1;
    });
    o.parts = parts; o.baskets = baskets; o.qty = Object.values(parts).reduce((a, b) => a + b, 0);
    o.bnames = [...new Set((o.lines || []).map(l => l.pname || '(ไม่มีชื่อตะกร้า)'))];
    return o;
  }

  // ───── รอบปริ้น ─────
  function atTime(base, hhmm, dayOffset) { const [h, m] = hhmm.split(':').map(Number); const d = new Date(base); d.setDate(d.getDate() + (dayOffset || 0)); d.setHours(h, m, 0, 0); return d; }
  function setRound(v) {
    S.round = v;
    [...$('fRound').children].forEach(b => b.classList.toggle('on', b.dataset.v === v));
    const now = new Date();
    if (v === 'all') { $('fFrom').value = ''; $('fTo').value = ''; }   // (2026-11-23) ทั้งหมด = ไม่กรองเวลาสั่ง เห็นทุกคำสั่งซื้อในแต่ละสถานะ (ค่าเริ่มต้น)
    if (v === '1') { $('fFrom').value = ''; $('fTo').value = toLocalInput(atTime(now, cuts.c1, 0)); }   // (2026-11-23) รอบ 1 = ทุกคำสั่งซื้อที่สั่งก่อนเวลาตัดรอบ 1 วันนี้ ไม่มีเวลาเริ่ม (ค้างเสาร์-อาทิตย์ / วันหยุดเข้ารอบนี้เอง)
    if (v === '2') { $('fFrom').value = toLocalInput(atTime(now, cuts.c1, 0)); $('fTo').value = toLocalInput(atTime(now, cuts.c2, 0)); }
    dirty();
  }
  function dirty() { $('searchBtn').classList.add('dirty'); ['fFrom', 'fTo'].forEach(id => { const e = !$(id).value; $(id).classList.toggle('noval', e); $(id + 'Ph').classList.toggle('on', e); }); }

  // ───── โหลดรายการ ─────
  // (2026-11-23) โหลด 3 แท็บพร้อมกัน (รอจัดส่ง / รอเข้ารับ / ยกเลิกหลังปริ้น) ตัวเลขขึ้นครบทุกแท็บ · ระหว่างโหลดมีกล่อง "กำลังโหลด" บังหน้าไว้ เสร็จแล้วปิดเอง
  // จำผลแต่ละแท็บ / ช่วงเวลา ไว้ 5 นาที — สลับแท็บแล้วโชว์ทันที · กดค้นหา / ปริ้นเสร็จ = ดึงใหม่เสมอ
  const FRESH = 5 * 60 * 1000, LC = {};
  const TABS = ['ship', 'collect', 'cancel'], TNAME = { ship: 'รอจัดส่ง', collect: 'รอเข้ารับ', cancel: 'ยกเลิกหลังปริ้น' };
  const keyOf = t => t === 'cancel' ? 'cancel' : [t, $('fFrom').value, $('fTo').value].join('|');
  const fresh = t => { const c = LC[keyOf(t)]; return !!c && Date.now() - c.got < FRESH; };
  function rangeText() {
    const a = $('fFrom').value, b = $('fTo').value, f = v => fmtDT(new Date(v));
    if (!a && !b) return 'ทั้งหมด · ไม่กรองเวลาสั่ง';
    const r = S.round === '1' ? 'รอบ 1 · ' : S.round === '2' ? 'รอบ 2 · ' : '';
    return r + (a ? `สั่ง ${f(a)} – ${b ? f(b) : 'ตอนนี้'}` : `สั่งก่อน ${b ? f(b) : 'ตอนนี้'} (รวมที่ค้างจากวันก่อน)`);
  }
  function showTab() {
    const c = LC[keyOf(S.tab)];
    if (!c) { S.raw = []; S.rows = []; render(); $('empty').style.display = 'block'; $('empty').textContent = 'โหลดข้อมูลไม่ได้ กด "ค้นหา" อีกครั้ง'; return; }
    S.raw = c.rows; S.printed = c.j.printed || {}; S.names = c.j.names || S.names || {};
    fillOptions(); applyFilters();
    $('stPrint').textContent = 'Updated ' + fmtT(new Date(c.got)); $('stPrint').classList.remove('bad');   // เวลาที่ดึงข้อมูลชุดที่กำลังดูอยู่
  }
  async function loadAll(force) {
    if (S.busy) return;
    $('searchBtn').classList.remove('dirty');
    const need = TABS.filter(t => force === true || !fresh(t));
    if (!need.length) { showTab(); return; }
    S.busy = true; $('searchBtn').disabled = true;
    $('stPrint').textContent = 'กำลังโหลด…'; $('stPrint').classList.remove('bad');
    const st = {}; TABS.forEach(t => { st[t] = need.includes(t) ? 'wait' : 'ok'; });
    const keys = {}; TABS.forEach(t => { keys[t] = keyOf(t); });
    const f = $('fFrom').value ? Math.floor(new Date($('fFrom').value).getTime() / 1000) : null;
    const to = $('fTo').value ? Math.floor(new Date($('fTo').value).getTime() / 1000) : null;
    const head = `<h2>กำลังโหลดคำสั่งซื้อ</h2><div class="s">TikTok · ${esc(rangeText())}</div>`;
    const draw = () => { $('ldDlg').innerHTML = head + TABS.map(t => `<div class="r"><span>${TNAME[t]}</span>${st[t] === 'wait' ? '<span class="wh-spin"></span>' : st[t] === 'err' ? '<span class="pc2">โหลดไม่ได้</span>' : `<b>${num(S.counts[t] ?? 0)}</b>`}</div>`).join(''); };
    countTabs(); draw(); $('ldOv').classList.add('on');
    const errs = [];
    await Promise.all(need.map(async t => {
      try {
        const j = t === 'cancel' ? await api({ action: 'cancelled' }) : await api({ action: 'list', tab: t, from: f, to });
        LC[keys[t]] = { j, rows: (j.orders || []).map(derive), got: Date.now() }; st[t] = 'ok';
      } catch (e) { delete LC[keys[t]]; st[t] = 'err'; errs.push(TNAME[t] + ': ' + e.message); }
      countTabs(); draw();
    }));
    S.busy = false; $('searchBtn').disabled = false;
    showTab();
    if (errs.length) {
      $('stPrint').textContent = '1 alert'; $('stPrint').classList.add('bad');
      $('ldDlg').insertAdjacentHTML('beforeend', `<div class="wh-note err">${errs.map(esc).join('<br>')}</div><div class="wh-act"><button class="wh-btn pri" id="ldClose" type="button">ปิด</button></div>`);
      $('ldClose').onclick = () => $('ldOv').classList.remove('on');
    } else setTimeout(() => $('ldOv').classList.remove('on'), 300);
  }
  function fillOptions() {
    const bs = new Set(), ss = new Set();
    S.raw.forEach(o => { o.bnames.forEach(b => bs.add(b)); Object.keys(o.parts).forEach(c => ss.add(c)); });
    const fill = (el, vals, label) => { const cur = el.value; el.innerHTML = '<option value="">ทั้งหมด</option>' + [...vals].sort().map(v => `<option value="${esc(v)}">${esc(label ? label(v) : v)}</option>`).join(''); if ([...vals].includes(cur)) el.value = cur; };
    fill($('fBasket'), bs); fill($('fSku'), ss, c => S.names[c] ? `${c} · ${S.names[c]}` : c);
  }
  function passes(o, printed) {
    const b = $('fBasket').value, sku = $('fSku').value, pr = $('fPrinted').value;
    if (b && !(o.bnames || []).includes(b)) return false;
    if (sku) { const codes = Object.keys(o.parts || {}); if (!codes.includes(sku)) return false; if (S.mode === 'only' && codes.length !== 1) return false; }
    const n = printed[o.id] || 0;
    if (pr === '0' && n > 0) return false;
    if (pr === '1' && n === 0) return false;
    return true;
  }
  function countTabs() { TABS.forEach(t => { const c = LC[keyOf(t)]; S.counts[t] = c ? c.rows.filter(o => passes(o, c.j.printed || {})).length : undefined; }); }
  function applyFilters() {
    S.rows = S.raw.filter(o => passes(o, S.printed));
    const keep = new Set(S.rows.map(o => o.id)); S.sel = new Set([...S.sel].filter(id => keep.has(id)));
    S.page = 1; countTabs(); render();
  }

  // ───── ตาราง ─────
  function itemsHtml(o) {
    const e = Object.entries(o.parts);
    return e.map(([k, v]) => `<b title="${esc(S.names[k] || '')}">${esc(k)}</b> × ${v}`).join(' , ') + (e.length > 1 ? '<span class="wh-pill mix">หลายรายการ</span>' : '');
  }
  function printedHtml(id) { const n = S.printed[id] || 0; return n === 0 ? '<span class="pc0">ยังไม่ปริ้น</span>' : n === 1 ? '<span class="pc1">1</span>' : `<span class="pc2">${n}</span>`; }
  function render() {
    const cancel = S.tab === 'cancel';
    [...$('tabs').children].forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
    $('nShip').textContent = S.counts.ship ?? ''; $('nCollect').textContent = S.counts.collect ?? ''; $('nCancel').textContent = S.counts.cancel ?? '';
    const info = `<span class="wh-i r">i<span class="pop"><b>ปริ้นแล้ว (ครั้ง)</b><br>จำนวนครั้งที่ใบปะหน้าของคำสั่งซื้อนี้ถูกปริ้นจากหน้านี้ รวมการปริ้นซ้ำ<br>ไม่นับการปริ้นจาก Seller Center</span></span>`;
    $('thead').innerHTML = cancel
      ? `<tr><th>เวลาที่ปริ้น</th><th>เลขคำสั่งซื้อ</th><th class="l">สินค้าที่ต้องดึงกลับ (SKU × จำนวน)</th><th>จำนวนชิ้น</th><th>ขนส่ง</th><th class="l">เหตุผลที่ยกเลิก</th><th>ปริ้นแล้ว (ครั้ง) ${info}</th></tr>`
      : `<tr><th style="width:36px"><input type="checkbox" id="chkAll" title="เลือกทั้งหมดที่ค้นเจอ"></th><th>เวลาสั่ง</th><th>เลขคำสั่งซื้อ</th><th class="l">ตะกร้า</th><th class="l">สินค้า (SKU × จำนวน)</th><th>จำนวนชิ้น</th><th>การชำระ</th><th>ขนส่ง</th><th>ปริ้นแล้ว (ครั้ง) ${info}</th></tr>`;
    const pages = Math.max(1, Math.ceil(S.rows.length / S.size)); if (S.page > pages) S.page = pages;
    const view = S.rows.slice((S.page - 1) * S.size, S.page * S.size);
    $('tbody').innerHTML = view.map(o => cancel
      ? `<tr><td>${o.printed_at ? fmtDT(new Date(o.printed_at)) : '—'}</td><td>${esc(o.id)}</td><td class="l">${itemsHtml(o)}</td><td>${o.qty}</td><td>${esc(o.carrier || '—')}</td><td class="l">${esc(o.cancel_reason || (o.st === 'CANCELLED' ? 'ยกเลิกแล้ว' : 'มีคำขอยกเลิก'))}</td><td>${printedHtml(o.id)}</td></tr>`
      : `<tr class="pick ${S.sel.has(o.id) ? 'sel' : ''}" data-id="${esc(o.id)}"><td><input type="checkbox" ${S.sel.has(o.id) ? 'checked' : ''}></td><td>${fmtDT(new Date(o.t * 1000))}</td><td>${esc(o.id)}</td><td class="l"><span class="wh-bk" title="${esc(o.bnames.join(' + '))}">${esc(o.bnames.join(' + '))}</span></td><td class="l">${itemsHtml(o)}</td><td>${o.qty}</td><td>${o.cod ? '<span class="wh-pill cod">COD</span>' : '<span class="wh-pill">ชำระแล้ว</span>'}</td><td>${esc(o.carrier || '—')}</td><td>${printedHtml(o.id)}</td></tr>`).join('');
    const empty = !S.rows.length;
    $('empty').style.display = empty ? 'block' : 'none';
    if (empty) $('empty').textContent = cancel ? 'ไม่มีคำสั่งซื้อที่ถูกยกเลิกหลังปริ้น (ย้อนหลัง 7 วัน)' : 'ไม่มีคำสั่งซื้อตามเงื่อนไขที่เลือก';
    $('pgInfo').textContent = empty ? '' : `แสดง ${num((S.page - 1) * S.size + 1)}–${num(Math.min(S.page * S.size, S.rows.length))} จาก ${num(S.rows.length)} คำสั่งซื้อ`;
    $('pgBtns').innerHTML = pages > 1 ? `<button class="wh-btn sm" data-p="-1" ${S.page <= 1 ? 'disabled' : ''}>‹ ก่อนหน้า</button><span>หน้า ${S.page} / ${pages}</span><button class="wh-btn sm" data-p="1" ${S.page >= pages ? 'disabled' : ''}>ถัดไป ›</button>` : '';
    [...$('pgSize').children].forEach(b => b.classList.toggle('on', Number(b.dataset.v) === S.size));
    const all = $('chkAll'); if (all) { all.checked = S.rows.length > 0 && S.sel.size === S.rows.length; all.indeterminate = S.sel.size > 0 && S.sel.size < S.rows.length; }
    renderSel();
  }
  function selected() { return S.rows.filter(o => S.sel.has(o.id)); }
  function summarize(list) {
    const sku = {}, bk = {}; let qty = 0;
    list.forEach(o => { qty += o.qty; for (const k in o.parts) sku[k] = (sku[k] || 0) + o.parts[k]; for (const k in o.baskets) bk[k] = (bk[k] || 0) + o.baskets[k]; });
    return { sku, bk, qty, n: list.length };
  }
  function renderSel() {
    const cancel = S.tab === 'cancel', s = summarize(selected());
    $('selN').textContent = cancel ? `${num(S.rows.length)} คำสั่งซื้อที่ต้องดึงสินค้ากลับ` : `เลือกแล้ว ${num(s.n)} คำสั่งซื้อ`;
    $('selM').textContent = cancel || !s.n ? '' : `รวม ${num(s.qty)} ชิ้น · ${Object.keys(s.sku).length} รายการสินค้า`;
    $('pickBtn').style.display = cancel ? 'none' : ''; $('goBtn').style.display = cancel ? 'none' : '';
    $('pickBtn').disabled = !s.n; $('goBtn').disabled = !s.n;
    $('goBtn').textContent = S.tab === 'collect' ? 'ปริ้นใบปะหน้าซ้ำ' : 'จัดส่ง + ปริ้นใบปะหน้า';
  }

  // ───── กล่องรายการเตรียมสินค้า ─────
  function pickTables(s) {
    const skuRows = Object.keys(s.sku).sort().map(k => `<tr><td class="l"><b>${esc(k)}</b></td><td class="l">${esc(S.names[k] || '—')}</td><td><b>${num(s.sku[k])}</b></td></tr>`).join('');
    let bt = 0;
    const bkRows = Object.keys(s.bk).sort().map(k => { const [a, b] = k.split('\u0001'); bt += s.bk[k]; return `<tr><td class="l">${esc(a)}</td><td class="l"><b>${esc(splitSku(b).map(p => p.code + ' × ' + p.qty).join(' + '))}</b></td><td><b>${num(s.bk[k])}</b></td></tr>`; }).join('');
    return {
      sku: `<table class="wh-t"><thead><tr><th class="l">SKU</th><th class="l">ชื่อสินค้า</th><th>จำนวนชิ้นที่ต้องหยิบ</th></tr></thead><tbody>${skuRows}</tbody><tfoot><tr><td class="l" colspan="2">รวม</td><td>${num(s.qty)}</td></tr></tfoot></table>`,
      bk: `<table class="wh-t"><thead><tr><th class="l">ตะกร้า</th><th class="l">รหัสชุด</th><th>จำนวนชุด</th></tr></thead><tbody>${bkRows}</tbody><tfoot><tr><td class="l" colspan="2">รวม</td><td>${num(bt)}</td></tr></tfoot></table>`,
      nSku: Object.keys(s.sku).length, nBk: Object.keys(s.bk).length,
    };
  }
  function openPick() {
    const list = selected(); if (!list.length) return;
    const s = summarize(list), t = pickTables(s), reprint = S.tab === 'collect';
    const when = fmtDT(new Date());
    $('dlg').innerHTML = `<h2>รายการเตรียมสินค้า</h2><div class="s">สรุปจากคำสั่งซื้อที่เลือก · TikTok · ${when}</div>
      <div class="wh-kp"><div><small>คำสั่งซื้อที่เลือก</small><b>${num(s.n)}</b></div><div><small>จำนวนสินค้า (รายการ)</small><b>${t.nSku}</b></div><div><small>จำนวนชิ้นรวม</small><b>${num(s.qty)}</b></div></div>
      <div class="wh-tabs" id="pkTabs"><button data-k="sku" type="button">สินค้าที่ต้องหยิบ<small>${t.nSku}</small></button><button data-k="bk" type="button">ตะกร้า / Promotion<small>${t.nBk}</small></button></div>
      <div id="pkBody"></div>
      <div class="wh-note" id="pkNote">${reprint ? 'ปริ้นซ้ำ: สถานะใน TikTok ไม่เปลี่ยน ระบบจะนับจำนวนครั้งที่ปริ้นเพิ่ม' : 'เมื่อกด "ยืนยันจัดส่ง" คำสั่งซื้อทั้งหมดที่เลือกจะย้ายไปสถานะรอเข้ารับใน TikTok ทันที และยกเลิกย้อนกลับไม่ได้'}</div>
      <div class="wh-act"><button class="wh-btn" id="pkClose" type="button">ยกเลิก</button><button class="wh-btn" id="pkPrint" type="button">ปริ้นรายการในแท็บนี้</button><button class="wh-btn pri" id="pkGo" type="button">${reprint ? 'ปริ้นใบปะหน้าซ้ำ' : 'ยืนยันจัดส่ง + ปริ้นใบปะหน้า'}</button></div>`;
    const show = k => { S.pickTab = k; [...$('pkTabs').children].forEach(b => b.classList.toggle('on', b.dataset.k === k)); $('pkBody').innerHTML = t[k]; };
    show(S.pickTab);
    $('pkTabs').onclick = e => { const b = e.target.closest('button'); if (b) show(b.dataset.k); };
    $('pkClose').onclick = closeDlg;
    $('pkPrint').onclick = () => {
      const title = S.pickTab === 'sku' ? 'รายการเตรียมสินค้า — สินค้าที่ต้องหยิบ' : 'รายการเตรียมสินค้า — ตะกร้า / Promotion';
      $('printArea').innerHTML = `<h2>${title}</h2><div class="s">TikTok · ${when} · ${num(s.n)} คำสั่งซื้อ · ${num(s.qty)} ชิ้น · ${esc(rangeText())}</div>${t[S.pickTab]}`;
      window.print();
    };
    $('pkGo').onclick = () => runPrint(reprint ? 'reprint' : 'ship', list.map(o => o.id));
    $('ov').classList.add('on');
  }
  function closeDlg() { if (S.printing) return; $('ov').classList.remove('on'); }

  // ───── สั่งจัดส่ง + ปริ้นใบปะหน้า ─────
  function b64ToU8(b) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  async function runPrint(action, ids) {
    if (S.printing || !ids.length) return;
    S.printing = true;
    const win = window.open('', '_blank');   // เปิดแท็บไว้ก่อน กัน browser บล็อก popup
    if (win) win.document.write('<title>ใบปะหน้า</title><p style="font-family:Sarabun,sans-serif;padding:24px">กำลังเตรียมใบปะหน้า… ห้ามปิดหน้านี้</p>');
    const batch = (crypto.randomUUID && crypto.randomUUID()) || '';
    const okAll = [], failAll = [], pdfs = [];
    $('dlg').innerHTML = `<h2>${action === 'ship' ? 'กำลังสั่งจัดส่งและเตรียมใบปะหน้า' : 'กำลังเตรียมใบปะหน้า'}</h2><div class="s" id="prg">เริ่มทำงาน…</div><div class="wh-note">ห้ามปิดหรือรีเฟรชหน้านี้จนกว่าจะเสร็จ</div>`;
    $('ov').classList.add('on');
    for (let i = 0; i < ids.length; i += CHUNK) {
      const part = ids.slice(i, i + CHUNK);
      $('prg').textContent = `ทำแล้ว ${num(i)} จาก ${num(ids.length)} คำสั่งซื้อ…`;
      try {
        const j = await api({ action, order_ids: part, batch_id: batch });
        (j.results || []).forEach(r => (r.ok ? okAll : failAll).push(r));
        if (j.pdf) pdfs.push(b64ToU8(j.pdf));
      } catch (e) { part.forEach(id => failAll.push({ id, ok: false, error: 'ไม่ได้รับคำตอบจากระบบ: ' + e.message + ' (ให้เช็คสถานะในแท็บรอเข้ารับก่อนกดซ้ำ)' })); }
    }
    let url = '';
    try {
      if (pdfs.length === 1) url = URL.createObjectURL(new Blob([pdfs[0]], { type: 'application/pdf' }));
      else if (pdfs.length > 1) {
        const out = await PDFLib.PDFDocument.create();
        for (const p of pdfs) { const src = await PDFLib.PDFDocument.load(p); (await out.copyPages(src, src.getPageIndices())).forEach(pg => out.addPage(pg)); }
        url = URL.createObjectURL(new Blob([await out.save()], { type: 'application/pdf' }));
      }
    } catch (e) { failAll.push({ id: '-', error: 'รวมไฟล์ใบปะหน้าไม่ได้: ' + e.message }); }
    if (url && win) win.location.href = url; else if (win) win.close();
    S.printing = false;
    $('dlg').innerHTML = `<h2>${action === 'ship' ? 'จัดส่ง + ปริ้นใบปะหน้า' : 'ปริ้นใบปะหน้าซ้ำ'} เสร็จแล้ว</h2><div class="s">${fmtDT(new Date())}</div>
      <div class="wh-kp"><div><small>สำเร็จ</small><b>${num(okAll.length)}</b></div><div><small>ไม่สำเร็จ</small><b>${num(failAll.length)}</b></div></div>
      ${okAll.length ? `<div class="wh-note ok">ใบปะหน้า ${num(okAll.length)} คำสั่งซื้อ เปิดในแท็บใหม่แล้ว ให้สั่งปริ้นจากแท็บนั้น${url ? ` · <a href="${url}" target="_blank" style="color:inherit">เปิดอีกครั้ง</a>` : ''}</div>` : ''}
      ${failAll.length ? `<div class="wh-note err"><b>คำสั่งซื้อที่ไม่สำเร็จ</b><br>${failAll.map(f => `${esc(f.id)} — ${esc(f.error || '')}`).join('<br>')}</div>` : ''}
      <div class="wh-act"><button class="wh-btn pri" id="doneBtn" type="button">ปิด</button></div>`;
    $('doneBtn').onclick = () => { $('ov').classList.remove('on'); S.sel.clear(); Object.keys(LC).forEach(k => delete LC[k]); delete SC.d; if (S.view === 'print') loadAll(true); else loadHistory(); };
  }

  // ───── สรุปการจัดส่ง ─────
  const SC = {};   // ผลสรุปล่าสุด { d: วันที่, j, got }
  async function loadSummary(force) {
    const day = $('sumDate').value;
    if (force !== true && SC.d === day && Date.now() - SC.got < FRESH) return;   // ผลเดิมยังแสดงอยู่บนหน้า ไม่ต้องดึงใหม่
    $('stSum').textContent = 'กำลังโหลด…'; $('stSum').classList.remove('bad');
    try {
      const d = new Date(day + 'T00:00:00');
      const j = await api({ action: 'summary', day_start: Math.floor(d.getTime() / 1000) });
      Object.assign(SC, { d: day, j, got: Date.now() });
      const rows = Object.entries(j.carriers || {}).sort((a, b) => (b[1].wait_collect + b[1].picked) - (a[1].wait_collect + a[1].picked));
      let A = 0, B = 0;
      $('sumBody').innerHTML = rows.map(([c, v]) => { A += v.wait_collect; B += v.picked; return `<tr><td class="l"><b>${esc(c)}</b></td><td>${num(v.wait_collect)}</td><td>${num(v.picked)}</td><td>${num(v.wait_collect + v.picked)}</td></tr>`; }).join('');
      $('sumFoot').innerHTML = rows.length ? `<tr><td class="l">รวม</td><td>${num(A)}</td><td>${num(B)}</td><td>${num(A + B)}</td></tr>` : '';
      $('sumEmpty').style.display = rows.length ? 'none' : 'block'; $('sumEmpty').textContent = 'ยังไม่มีคำสั่งซื้อที่จัดส่งในวันที่เลือก';
      $('sA').textContent = num(A); $('sB').textContent = num(B); $('sC').textContent = num(j.wait_ship); $('sD').textContent = num(j.cancelled_after_print);
      $('stSum').textContent = 'Updated ' + fmtT(new Date(j.at || Date.now()));
    } catch (e) { $('stSum').textContent = '1 alert'; $('stSum').classList.add('bad'); $('sumBody').innerHTML = ''; $('sumFoot').innerHTML = ''; $('sumEmpty').style.display = 'block'; $('sumEmpty').textContent = 'โหลดข้อมูลไม่ได้: ' + e.message; }
  }

  // ───── ประวัติการปริ้น ─────
  let HIS = [];
  async function loadHistory() {
    $('stHis').textContent = 'กำลังโหลด…'; $('stHis').classList.remove('bad');
    try {
      const j = await api({ action: 'history' }); HIS = j.batches || [];
      $('hisBody').innerHTML = HIS.map((b, i) => `<tr><td>${fmtDT(new Date(b.at))}</td><td class="l">${esc(b.by || '—')}</td><td>${num(b.ship)}</td><td>${num(b.reprint)}</td><td>${b.fail ? `<span class="pc2" title="${esc((b.fails || []).map(f => f.id + ' — ' + (f.error || '')).join('\n'))}">${num(b.fail)}</span>` : '0'}</td><td>${b.order_ids.length ? `<button class="wh-btn sm" data-i="${i}" type="button">ปริ้นซ้ำทั้งรอบ</button>` : ''}</td></tr>`).join('');
      $('hisEmpty').style.display = HIS.length ? 'none' : 'block'; $('hisEmpty').textContent = 'ยังไม่มีประวัติการปริ้น';
      $('stHis').textContent = 'Updated ' + fmtT(new Date());
    } catch (e) { $('stHis').textContent = '1 alert'; $('stHis').classList.add('bad'); $('hisBody').innerHTML = ''; $('hisEmpty').style.display = 'block'; $('hisEmpty').textContent = 'โหลดข้อมูลไม่ได้: ' + e.message; }
  }

  // ───── เมนู / ปุ่ม ─────
  function setView(v) {
    S.view = v;
    document.querySelectorAll('.wh-side a[data-view]').forEach(a => a.classList.toggle('on', a.dataset.view === v));
    document.querySelectorAll('.wh-page').forEach(p => p.classList.toggle('on', p.id === 'v-' + v));
    if (v === 'summary') loadSummary(); if (v === 'history') loadHistory();   // สรุป: ใช้ผลเดิมถ้ายังไม่เกิน 5 นาที · ประวัติ: อ่านจากตารางเรา เร็วอยู่แล้ว
  }
  function bind() {
    document.querySelectorAll('.wh-side a[data-view]').forEach(a => a.onclick = () => setView(a.dataset.view));
    $('themeBtn').onclick = () => { document.body.classList.toggle('light-theme'); try { localStorage.setItem('deesay_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark'); } catch (e) {} };
    $('outBtn').onclick = () => Auth.signOut();
    $('fRound').onclick = e => { const b = e.target.closest('button'); if (!b || S.busy) return; setRound(b.dataset.v); if (b.dataset.v !== 'c') loadAll(); };   // รอบ 1 / 2 = โหลดเลย · กำหนดเอง = ตั้งเวลาแล้วกดค้นหา
    ['fFrom', 'fTo'].forEach(id => $(id).addEventListener('input', () => { S.round = 'c'; [...$('fRound').children].forEach(b => b.classList.toggle('on', b.dataset.v === 'c')); dirty(); }));
    ['fBasket', 'fSku', 'fPrinted'].forEach(id => $(id).addEventListener('change', dirty));
    $('fMode').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.mode = b.dataset.v; [...$('fMode').children].forEach(x => x.classList.toggle('on', x === b)); dirty(); };
    $('roundCfgBtn').onclick = () => { $('cut1').value = cuts.c1; $('cut2').value = cuts.c2; $('roundCfg').classList.toggle('on'); };
    $('cutSave').onclick = () => { if ($('cut1').value) cuts.c1 = $('cut1').value; if ($('cut2').value) cuts.c2 = $('cut2').value; try { localStorage.setItem('wh_cuts', JSON.stringify(cuts)); } catch (e) {} $('roundCfg').classList.remove('on'); if (S.round !== 'c') setRound(S.round); };
    $('searchBtn').onclick = () => loadAll(true);
    $('tabs').onclick = e => { const b = e.target.closest('button'); if (!b || b.dataset.tab === S.tab || S.busy) return; S.tab = b.dataset.tab; S.sel.clear(); if (fresh(S.tab)) { showTab(); return; } S.raw = []; S.rows = []; render(); loadAll(); };
    $('tbody').onclick = e => { const tr = e.target.closest('tr.pick'); if (!tr) return; const id = tr.dataset.id; if (S.sel.has(id)) S.sel.delete(id); else S.sel.add(id); render(); };
    $('thead').onclick = e => { if (e.target.id !== 'chkAll') return; if (S.sel.size === S.rows.length) S.sel.clear(); else S.sel = new Set(S.rows.map(o => o.id)); render(); };
    $('pgBtns').onclick = e => { const b = e.target.closest('button'); if (b) { S.page += Number(b.dataset.p); render(); window.scrollTo(0, 0); } };
    $('pgSize').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.size = Number(b.dataset.v); try { localStorage.setItem('wh_page_size', String(S.size)); } catch (e2) {} S.page = 1; render(); };
    $('pickBtn').onclick = openPick; $('goBtn').onclick = openPick;
    $('ov').onclick = e => { if (e.target === $('ov')) closeDlg(); };
    $('sumBtn').onclick = () => loadSummary(true);
    $('hisBody').onclick = e => { const b = e.target.closest('button'); if (b) runPrint('reprint', HIS[Number(b.dataset.i)].order_ids); };
  }

  async function start() {
    try { if (localStorage.getItem('deesay_theme') === 'light') document.body.classList.add('light-theme'); } catch (e) {}
    const perm = await Auth.require('health');   // ช่วงทดสอบ: เฉพาะผู้ดูแลระบบ
    $('whoMail').textContent = perm.email || '';
    bind();
    const now = new Date(); $('sumDate').value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    setRound('all');   // (2026-11-23) เปิดหน้า = ทั้งหมด ไม่กรองเวลา
    render(); loadAll();
  }
  start();
})();
