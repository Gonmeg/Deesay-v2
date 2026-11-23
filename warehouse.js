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

  const S = { view: 'print', tab: 'ship', raw: [], rows: [], printed: {}, names: {}, sel: new Set(), page: 1, size: 50, round: '1', pat: '', pats: [], patAll: 0, basket: '', prf: '', busy: false, pickTab: 'sku', counts: {} };
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
    const parts = {};
    (o.lines || []).forEach(l => { splitSku(l.sku).forEach(p => { parts[p.code] = (parts[p.code] || 0) + p.qty; }); });
    o.parts = parts; o.qty = Object.values(parts).reduce((a, b) => a + b, 0);
    // (2026-11-23) รูปแบบคำสั่งซื้อ = สินค้าทั้งหมดในออเดอร์ (SKU จริง × จำนวน) เรียงตามรหัส — ออเดอร์ที่สั่งเหมือนกันได้ค่าเดียวกัน
    o.pat = Object.keys(parts).sort().map(k => `${k} × ${parts[k]}`).join(' + ') || '(ไม่มีรายการสินค้า)';
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
        const j = t === 'cancel' ? await api({ action: 'cancelled', sc: true }) : await api({ action: 'list', tab: t, from: f, to });
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
  // (2026-11-23) ตัวกรองรูปแบบคำสั่งซื้อ (SKU) = รูปแบบที่มีจริงในแท็บที่เปิดอยู่ + จำนวนคำสั่งซื้อ เรียงมาก → น้อย · ตะกร้า = เฉพาะที่อยู่ในรูปแบบที่เลือก
  //   เลือกแล้วกรองทันที (กรองจากข้อมูลที่โหลดไว้ ไม่ดึง TikTok ใหม่)
  function fillOptions() {
    const pc = {}; let all = 0;
    S.raw.forEach(o => { if (passes(o, S.printed, { pat: true, basket: true })) { pc[o.pat] = (pc[o.pat] || 0) + 1; all++; } });
    S.pats = Object.entries(pc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); S.patAll = all;
    if (S.pat && !pc[S.pat]) S.pat = '';
    const bs = new Set(); S.raw.forEach(o => { if (passes(o, S.printed, { basket: true })) o.bnames.forEach(b => bs.add(b)); });
    if (S.basket && !bs.has(S.basket)) S.basket = '';
    dd('fBasket', [['', 'ทั้งหมด'], ...[...bs].sort().map(v => [v, v])], S.basket, v => { S.basket = v; fillOptions(); applyFilters(); });
    renderPat();
  }
  // (2026-11-23) dropdown แบบเว็บ (ui.css .ui-dd) แทน <select> ของ browser · items = [[ค่า, ข้อความ]] · กดปุ่มเดิมซ้ำ = ปิด
  function dd(id, items, value, onPick) {
    const el = $(id), cur = items.find(x => x[0] === value) || items[0];
    el.innerHTML = `<button type="button" class="ui-dd-btn"><span>${esc(cur[1])}</span></button><div class="ui-dd-menu">${items.map(([v, l]) => `<button type="button" class="ui-dd-item" data-v="${esc(v)}" aria-selected="${v === cur[0]}">${esc(l)}</button>`).join('')}</div>`;
    el.title = cur[0] ? cur[1] : ''; el._pick = onPick;
  }
  const PRF = [['', 'ทั้งหมด'], ['0', 'ยังไม่ปริ้น'], ['1', 'ปริ้นแล้ว']];
  function renderPrf() { dd('fPrinted', PRF, S.prf, v => { S.prf = v; renderPrf(); fillOptions(); applyFilters(); }); }
  const normQ = t => String(t).toUpperCase().replace(/×/g, 'X').replace(/\s+/g, '');
  function renderPat() {
    $('fPatTx').textContent = S.pat || 'ทั้งหมด'; $('fPatBtn').title = S.pat || '';
    const q = normQ($('fPatQ').value), items = S.pats.filter(([p]) => !q || normQ(p).includes(q));
    $('fPatList').innerHTML = (q ? '' : `<button type="button" data-p="" class="${S.pat ? '' : 'on'}"><span>ทั้งหมด</span><small>${num(S.patAll)} คำสั่งซื้อ</small></button>`)
      + items.map(([p, n]) => `<button type="button" data-p="${esc(p)}" class="${p === S.pat ? 'on' : ''}"><span>${esc(p)}</span><small>${num(n)} คำสั่งซื้อ</small></button>`).join('')
      + (q && !items.length ? '<div class="wh-dd-empty">ไม่พบรูปแบบที่มี SKU นี้</div>' : '');
  }
  function passes(o, printed, skip = {}) {
    const b = S.basket, pr = S.prf;
    if (S.pat && !skip.pat && o.pat !== S.pat) return false;
    if (b && !skip.basket && !(o.bnames || []).includes(b)) return false;
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
  function itemsHtml(o) {   // (2026-11-23) เรียงตามรหัส + คั่นด้วย "+" ให้ตรงกับตัวกรองรูปแบบคำสั่งซื้อ · ไม่มีป้าย "หลายรายการ" (ล้นช่อง)
    return Object.keys(o.parts).sort().map(k => `<b title="${esc(S.names[k] || '')}">${esc(k)}</b> × ${o.parts[k]}`).join(' + ');
  }
  // ยกเลิกหลังปริ้นนานเท่าไร (เวลายกเลิก − เวลาปริ้น)
  function afterTxt(o) { const m = Math.max(0, Math.round((o.cancel_time * 1000 - new Date(o.printed_at).getTime()) / 60000)); return 'หลังปริ้น ' + (m < 60 ? `${m} นาที` : m < 1440 ? `${Math.round(m / 60)} ชม.` : `${Math.round(m / 1440)} วัน`); }
  function printedHtml(id) { const n = S.printed[id] || 0; return n === 0 ? '<span class="pc0">ยังไม่ปริ้น</span>' : n === 1 ? '<span class="pc1">1</span>' : `<span class="pc2">${n}</span>`; }
  function render() {
    const cancel = S.tab === 'cancel';
    [...$('tabs').children].forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
    $('nShip').textContent = S.counts.ship ?? ''; $('nCollect').textContent = S.counts.collect ?? ''; $('nCancel').textContent = S.counts.cancel ?? '';
    const info = `<span class="wh-i r">i<span class="pop"><b>ปริ้นแล้ว (ครั้ง)</b><br>จำนวนครั้งที่ใบปะหน้าของคำสั่งซื้อนี้ถูกปริ้นจากหน้านี้ รวมการปริ้นซ้ำ<br>ไม่นับการปริ้นจาก Seller Center</span></span>`;
    // (2026-11-23) ยกเลิกหลังปริ้น: รวมที่กดจัดส่ง / ปริ้นจาก Seller Center แล้วถูกยกเลิกก่อนขนส่งมารับ (src = sc)
    // (2026-11-23) บอกให้ชัดว่า "ปริ้นแล้ว" + ยกเลิกหลังปริ้นนานเท่าไร (เช่น ระหว่างน้องปริ้นทีละ 250 ใบ แล้วลูกค้ายกเลิก)
    const infoSrc = `<span class="wh-i r">i<span class="pop"><b>ปริ้นจาก</b><br>หน้านี้ = ปริ้นจากหน้า Warehouse (ตัวเลข = จำนวนครั้งที่ปริ้น)<br>Seller Center = กดจัดส่ง / ปริ้นใบปะหน้าจาก Seller Center</span></span>`;
    const infoSt = `<span class="wh-i">i<span class="pop"><b>สถานะ</b><br>ปริ้นแล้ว · ยกเลิกแล้ว = ลูกค้ายกเลิกหลังปริ้นใบปะหน้า ขนส่งยังไม่มารับ พัสดุยังอยู่ในคลัง<br>ปริ้นแล้ว · ลูกค้าขอยกเลิก = มีคำขอยกเลิกค้างอยู่ อย่าเพิ่งส่งให้ขนส่ง</span></span>`;
    $('thead').innerHTML = cancel
      ? `<tr><th>ปริ้นใบปะหน้าเมื่อ</th><th>ยกเลิกเมื่อ</th><th>เลขคำสั่งซื้อ</th><th class="l">สินค้าที่ต้องดึงกลับ (SKU × จำนวน)</th><th>จำนวนชิ้น</th><th>สถานะ ${infoSt}</th><th class="l">เหตุผลที่ยกเลิก</th><th>ปริ้นจาก ${infoSrc}</th></tr>`
      : `<tr><th style="width:36px"><input type="checkbox" id="chkAll" title="เลือกทั้งหมดที่ค้นเจอ"></th><th>เวลาสั่ง</th><th>เลขคำสั่งซื้อ</th><th class="l">ตะกร้า</th><th class="l">สินค้า (SKU × จำนวน)</th><th>จำนวนชิ้น</th><th>การชำระ</th><th>ขนส่ง</th><th>ปริ้นแล้ว (ครั้ง) ${info}</th></tr>`;
    const pages = Math.max(1, Math.ceil(S.rows.length / S.size)); if (S.page > pages) S.page = pages;
    const view = S.rows.slice((S.page - 1) * S.size, S.page * S.size);
    $('tbody').innerHTML = view.map(o => cancel
      ? `<tr><td>${o.printed_at ? fmtDT(new Date(o.printed_at)) : '—'}</td><td>${o.cancel_time ? fmtDT(new Date(o.cancel_time * 1000)) + `<div class="wh-sub">${afterTxt(o)}</div>` : '—'}</td><td>${esc(o.id)}</td><td class="l">${itemsHtml(o)}</td><td>${o.qty}</td><td>${o.st === 'CANCELLED' ? '<span class="wh-pill bad">ปริ้นแล้ว · ยกเลิกแล้ว</span>' : '<span class="wh-pill cod">ปริ้นแล้ว · ลูกค้าขอยกเลิก</span>'}</td><td class="l">${esc(o.cancel_reason || (o.st === 'CANCELLED' ? 'ยกเลิกแล้ว' : 'มีคำขอยกเลิก'))}</td><td>${o.src === 'sc' ? 'Seller Center' : `หน้านี้ (${num(S.printed[o.id] || 1)} ครั้ง)`}</td></tr>`
      : `<tr class="pick ${S.sel.has(o.id) ? 'sel' : ''}" data-id="${esc(o.id)}"><td><input type="checkbox" ${S.sel.has(o.id) ? 'checked' : ''}></td><td>${fmtDT(new Date(o.t * 1000))}</td><td>${esc(o.id)}</td><td class="l"><span class="wh-bk" title="${esc(o.bnames.join(' + '))}">${esc(o.bnames.join(' + '))}</span></td><td class="l">${itemsHtml(o)}</td><td>${o.qty}</td><td>${o.cod ? '<span class="wh-pill cod">COD</span>' : '<span class="wh-pill">ชำระแล้ว</span>'}</td><td>${esc(o.carrier || '—')}</td><td>${printedHtml(o.id)}</td></tr>`).join('');
    const empty = !S.rows.length;
    $('empty').style.display = empty ? 'block' : 'none';
    if (empty) $('empty').textContent = cancel ? 'ไม่มีคำสั่งซื้อที่ถูกยกเลิกหลังจัดส่ง / ปริ้น (ย้อนหลัง 7 วัน)' : 'ไม่มีคำสั่งซื้อตามเงื่อนไขที่เลือก';
    $('pgInfo').textContent = empty ? '' : `แสดง ${num((S.page - 1) * S.size + 1)}–${num(Math.min(S.page * S.size, S.rows.length))} จาก ${num(S.rows.length)} คำสั่งซื้อ`;
    $('pgBtns').innerHTML = pages > 1 ? `<button class="wh-btn sm" data-p="-1" ${S.page <= 1 ? 'disabled' : ''}>‹ ก่อนหน้า</button><span>หน้า ${S.page} / ${pages}</span><button class="wh-btn sm" data-p="1" ${S.page >= pages ? 'disabled' : ''}>ถัดไป ›</button>` : '';
    [...$('pgSize').children].forEach(b => b.classList.toggle('on', Number(b.dataset.v) === S.size));
    const all = $('chkAll'); if (all) { all.checked = S.rows.length > 0 && S.sel.size === S.rows.length; all.indeterminate = S.sel.size > 0 && S.sel.size < S.rows.length; }
    renderSel();
  }
  function selected() { return S.rows.filter(o => S.sel.has(o.id)); }
  function summarize(list) {
    const sku = {}, pat = {}; let qty = 0;
    list.forEach(o => { qty += o.qty; for (const k in o.parts) sku[k] = (sku[k] || 0) + o.parts[k]; pat[o.pat] = (pat[o.pat] || 0) + 1; });
    return { sku, pat, qty, n: list.length };
  }
  function renderSel() {
    const cancel = S.tab === 'cancel', s = summarize(selected());
    $('selN').innerHTML = cancel ? `${num(S.rows.length)} คำสั่งซื้อที่ปริ้นใบปะหน้าแล้วแต่ถูกยกเลิก · ต้องดึงสินค้ากลับเข้าสต็อก <span class="wh-i">i<span class="pop"><b>ยกเลิกหลังปริ้น</b><br>ปริ้นใบปะหน้าแล้ว (จากหน้านี้หรือ Seller Center) แต่ลูกค้ายกเลิกก่อนขนส่งมารับ = พัสดุยังอยู่ในคลัง ต้องดึงออกจากกอง แล้วเอาสินค้ากลับเข้าสต็อก<br>ย้อนหลัง 7 วัน · ไม่รวมพัสดุที่ขนส่งรับไปแล้ว</span></span>` : `เลือกแล้ว ${num(s.n)} คำสั่งซื้อ`;
    $('selM').textContent = cancel || !s.n ? '' : `รวม ${num(s.qty)} ชิ้น · ${Object.keys(s.sku).length} รายการสินค้า`;
    $('pickBtn').style.display = cancel ? 'none' : ''; $('goBtn').style.display = cancel ? 'none' : '';
    $('pickBtn').disabled = !s.n; $('goBtn').disabled = !s.n;
    $('goBtn').textContent = S.tab === 'collect' ? 'ปริ้นใบปะหน้าซ้ำ' : 'จัดส่ง + ปริ้นใบปะหน้า';
  }

  // ───── กล่องรายการเตรียมสินค้า ─────
  function pickTables(s) {
    const skuRows = Object.keys(s.sku).sort().map(k => `<tr><td class="l"><b>${esc(k)}</b></td><td class="l">${esc(S.names[k] || '—')}</td><td><b>${num(s.sku[k])}</b></td></tr>`).join('');
    // (2026-11-23) แท็บ 2 = รูปแบบคำสั่งซื้อ (แทนตะกร้า / Promotion) — ไม่มีชื่อตะกร้า นับจำนวนคำสั่งซื้อต่อรูปแบบ เรียงมาก → น้อย
    const patRows = Object.entries(s.pat).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([p, n]) => `<tr><td class="l"><b>${esc(p)}</b></td><td><b>${num(n)}</b></td></tr>`).join('');
    return {
      sku: `<table class="wh-t"><thead><tr><th class="l">SKU</th><th class="l">ชื่อสินค้า</th><th>จำนวนชิ้นที่ต้องหยิบ</th></tr></thead><tbody>${skuRows}</tbody><tfoot><tr><td class="l" colspan="2">รวม</td><td>${num(s.qty)}</td></tr></tfoot></table>`,
      pat: `<table class="wh-t"><thead><tr><th class="l">รูปแบบคำสั่งซื้อ (SKU × จำนวน)</th><th>จำนวนคำสั่งซื้อ</th></tr></thead><tbody>${patRows}</tbody><tfoot><tr><td class="l">รวม</td><td>${num(s.n)}</td></tr></tfoot></table>`,
      nSku: Object.keys(s.sku).length, nPat: Object.keys(s.pat).length,
    };
  }
  function openPick() {
    const list = selected(); if (!list.length) return;
    const s = summarize(list), t = pickTables(s), reprint = S.tab === 'collect';
    const when = fmtDT(new Date());
    $('dlg').innerHTML = `<h2>รายการเตรียมสินค้า</h2><div class="s">สรุปจากคำสั่งซื้อที่เลือก · TikTok · ${when}</div>
      <div class="wh-kp"><div><small>คำสั่งซื้อที่เลือก</small><b>${num(s.n)}</b></div><div><small>จำนวนสินค้า (รายการ)</small><b>${t.nSku}</b></div><div><small>จำนวนชิ้นรวม</small><b>${num(s.qty)}</b></div></div>
      <div class="wh-tabs" id="pkTabs"><button data-k="sku" type="button">สินค้าที่ต้องหยิบ<small>${t.nSku}</small></button><button data-k="pat" type="button">รูปแบบคำสั่งซื้อ<small>${t.nPat}</small></button></div>
      <div id="pkBody"></div>
      <div class="wh-note" id="pkNote">${reprint ? 'ปริ้นซ้ำ: สถานะใน TikTok ไม่เปลี่ยน ระบบจะนับจำนวนครั้งที่ปริ้นเพิ่ม' : 'เมื่อกด "ยืนยันจัดส่ง" คำสั่งซื้อทั้งหมดที่เลือกจะย้ายไปสถานะรอเข้ารับใน TikTok ทันที และยกเลิกย้อนกลับไม่ได้'}</div>
      <div class="wh-act"><button class="wh-btn" id="pkClose" type="button">ยกเลิก</button><button class="wh-btn" id="pkPrint" type="button">ปริ้นรายการในแท็บนี้</button><button class="wh-btn pri" id="pkGo" type="button">${reprint ? 'ปริ้นใบปะหน้าซ้ำ' : 'ยืนยันจัดส่ง + ปริ้นใบปะหน้า'}</button></div>`;
    const show = k => { S.pickTab = k; [...$('pkTabs').children].forEach(b => b.classList.toggle('on', b.dataset.k === k)); $('pkBody').innerHTML = t[k]; };
    show(t[S.pickTab] ? S.pickTab : 'sku');
    $('pkTabs').onclick = e => { const b = e.target.closest('button'); if (b) show(b.dataset.k); };
    $('pkClose').onclick = closeDlg;
    $('pkPrint').onclick = () => {
      const title = S.pickTab === 'sku' ? 'รายการเตรียมสินค้า — สินค้าที่ต้องหยิบ' : 'รายการเตรียมสินค้า — รูปแบบคำสั่งซื้อ';
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
    const okAll = [], failAll = [], pdfs = []; let sheets = 0;
    $('dlg').innerHTML = `<h2>${action === 'ship' ? 'กำลังสั่งจัดส่งและเตรียมใบปะหน้า' : 'กำลังเตรียมใบปะหน้า'}</h2><div class="s" id="prg">เริ่มทำงาน…</div><div class="wh-note">ห้ามปิดหรือรีเฟรชหน้านี้จนกว่าจะเสร็จ</div>`;
    $('ov').classList.add('on');
    for (let i = 0; i < ids.length; i += CHUNK) {
      const part = ids.slice(i, i + CHUNK);
      $('prg').textContent = `ทำแล้ว ${num(i)} จาก ${num(ids.length)} คำสั่งซื้อ…`;
      try {
        const j = await api({ action, order_ids: part, batch_id: batch, doc: 'label_slip' });   // (2026-11-23) ใบปะหน้า + รายการสินค้าในหน้าเดียว (แบบ Seller Center)
        (j.results || []).forEach(r => (r.ok ? okAll : failAll).push(r));
        if (j.pdf) { pdfs.push(b64ToU8(j.pdf)); sheets += j.pages || 0; }
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
      ${okAll.length ? `<div class="wh-note ok">ใบปะหน้า ${num(okAll.length)} คำสั่งซื้อ (${num(sheets)} แผ่น) เปิดในแท็บใหม่แล้ว ให้สั่งปริ้นจากแท็บนั้น${sheets > okAll.length ? `<br>มี ${num(sheets - okAll.length)} แผ่นเป็นรายการสินค้าต่อ (ออเดอร์ที่มีสินค้า 3 รายการขึ้นไป) แผ่นนั้นมีเลขคำสั่งซื้อกำกับ ให้แปะคู่กับใบปะหน้าของออเดอร์เดียวกัน` : ''}${url ? ` · <a href="${url}" target="_blank" style="color:inherit">เปิดอีกครั้ง</a>` : ''}</div>` : ''}
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
      const j = await api({ action: 'summary', day_start: Math.floor(d.getTime() / 1000), sc: true });
      Object.assign(SC, { d: day, j, got: Date.now() });
      // (2026-11-23) ยอดตามที่ปริ้น: รวมที่ถูกยกเลิกทีหลัง ให้ตรงกับจำนวนที่น้องปริ้นจริง — แยก รอเข้ารับ / ขนส่งรับแล้ว / ยกเลิกหลังปริ้น
      const rows = Object.entries(j.carriers || {}).map(([c, v]) => [c, { w: v.wait_collect || 0, p: v.picked || 0, x: v.cancelled || 0 }]).sort((a, b) => (b[1].w + b[1].p + b[1].x) - (a[1].w + a[1].p + a[1].x));
      let A = 0, B = 0, X = 0;
      $('sumBody').innerHTML = rows.map(([c, v]) => { A += v.w; B += v.p; X += v.x; return `<tr><td class="l"><b>${esc(c)}</b></td><td>${num(v.w)}</td><td>${num(v.p)}</td><td>${num(v.x)}</td><td><b>${num(v.w + v.p + v.x)}</b></td></tr>`; }).join('');
      $('sumFoot').innerHTML = rows.length ? `<tr><td class="l">รวม</td><td>${num(A)}</td><td>${num(B)}</td><td>${num(X)}</td><td>${num(A + B + X)}</td></tr>` : '';
      $('sumEmpty').style.display = rows.length ? 'none' : 'block'; $('sumEmpty').textContent = 'ยังไม่มีคำสั่งซื้อที่ปริ้น / จัดส่งในวันที่เลือก';
      $('sP').textContent = num(A + B + X); $('sA').textContent = num(A); $('sB').textContent = num(B); $('sD').textContent = num(X); $('sC').textContent = num(j.wait_ship);
      $('stSum').textContent = 'Updated ' + fmtT(new Date(j.at || Date.now()));
    } catch (e) { $('stSum').textContent = '1 alert'; $('stSum').classList.add('bad'); $('sumBody').innerHTML = ''; $('sumFoot').innerHTML = ''; $('sumEmpty').style.display = 'block'; $('sumEmpty').textContent = 'โหลดข้อมูลไม่ได้: ' + e.message; }
  }

  // ───── สต็อกวันนี้ (2026-11-23 ทดลองเทียบกับชีทตัดสต็อก · ยังไม่ใช้ตัดสต็อกจริง) ─────
  // ออกตามที่ปริ้น = คำสั่งซื้อที่กดจัดส่งวันนั้น (wh-labels outday ชุดเดียวกับหน้าสรุป) แตกชุดเป็น SKU · ชีท = inventory_movements คลัง TikTok ประเภท sold วันเดียวกัน
  const STK = { page: 1, rows: [], seq: 0 };
  async function sheetSold(day) {
    const out = {};
    for (let from = 0; ; from += 1000) {
      const { data, error } = await Auth.client.from('inventory_movements').select('sku, qty').eq('location', 'TikTok').eq('move_type', 'sold').eq('move_date', day).or('voided.is.null,voided.eq.false').range(from, from + 999);
      if (error) throw new Error(error.message);
      (data || []).forEach(r => { const k = String(r.sku || '').trim().toUpperCase(); if (k) out[k] = (out[k] || 0) - Number(r.qty || 0); });
      if (!data || data.length < 1000) break;
    }
    return out;
  }
  async function loadStock(force) {
    const day = $('stkDate').value; if (!day) return;
    if (force !== true && STK.d === day && Date.now() - STK.got < FRESH) return;
    const my = ++STK.seq; $('stStk').textContent = 'กำลังโหลด…'; $('stStk').classList.remove('bad');   // กดค้นหาซ้ำระหว่างโหลด = ใช้ผลของครั้งล่าสุด
    try {
      const d0 = Math.floor(new Date(day + 'T00:00:00').getTime() / 1000);
      const [j, sh] = await Promise.all([api({ action: 'outday', day_start: d0 }), sheetSold(day)]);
      if (my !== STK.seq) return;
      S.names = { ...S.names, ...(j.names || {}) };
      const m = {}, k = { on: 0, oq: 0, cn: 0, cq: 0, sq: 0 }, row = c => (m[c] ||= { out: 0, cx: 0, sh: 0 });
      (j.orders || []).map(derive).forEach(o => { const cx = o.st === 'CANCELLED'; k.on++; k.oq += o.qty; if (cx) { k.cn++; k.cq += o.qty; } for (const c in o.parts) { row(c).out += o.parts[c]; if (cx) row(c).cx += o.parts[c]; } });
      for (const c in sh) { row(c).sh += sh[c]; k.sq += sh[c]; }
      const hasSheet = Object.keys(sh).length > 0, rows = Object.keys(m).sort().map(c => [c, m[c]]);
      if (hasSheet) rows.sort((a, b) => Math.abs(b[1].out - b[1].sh) - Math.abs(a[1].out - a[1].sh));   // แถวที่ไม่ตรงขึ้นก่อน (ต่างมากก่อน) ที่เหลือคงเรียงตาม SKU
      Object.assign(STK, { d: day, got: Date.now(), k, hasSheet, page: 1, rows });
      renderStock(); $('stStk').textContent = 'Updated ' + fmtT(new Date());
    } catch (e) {
      if (my !== STK.seq) return;
      $('stStk').textContent = '1 alert'; $('stStk').classList.add('bad'); STK.rows = []; $('stkBody').innerHTML = ''; $('stkFoot').innerHTML = '';
      $('stkEmpty').style.display = 'block'; $('stkEmpty').textContent = 'โหลดข้อมูลไม่ได้: ' + e.message;
    }
  }
  function renderStock() {
    const { rows, k, hasSheet } = STK, size = 50, sgn = v => (v > 0 ? '+' : '') + num(v);
    $('kOut').textContent = num(k.oq); $('kOutS').textContent = `${num(k.on)} คำสั่งซื้อ`;
    $('kCx').textContent = num(k.cq); $('kCxS').textContent = `${num(k.cn)} คำสั่งซื้อ · จะเป็นของตีกลับ`;
    $('kSh').textContent = hasSheet ? num(k.sq) : '—'; $('kShS').textContent = hasSheet ? 'ที่น้องกรอกในชีท' : 'ยังไม่มีข้อมูลวันนี้ในชีท';
    const bad = rows.filter(([, r]) => r.out !== r.sh).length, df = k.oq - k.sq;
    $('kDf').innerHTML = hasSheet ? (df ? `<span style="color:var(--bad)">${sgn(df)}</span>` : '0') : '—'; $('kDfS').textContent = hasSheet ? (bad ? `${num(bad)} SKU ไม่ตรง` : 'ตรงทุก SKU') : '';
    const pages = Math.max(1, Math.ceil(rows.length / size)); if (STK.page > pages) STK.page = pages;
    $('stkBody').innerHTML = rows.slice((STK.page - 1) * size, STK.page * size).map(([c, r]) => { const d = r.out - r.sh;
      return `<tr><td class="l"><b>${esc(c)}</b></td><td class="l">${esc(S.names[c] || '—')}</td><td>${num(r.out)}</td><td>${r.cx ? num(r.cx) : ''}</td><td class="sh">${num(r.sh)}</td><td class="sh">${d ? `<b style="color:var(--bad)">${sgn(d)}</b>` : ''}</td></tr>`; }).join('');
    $('stkFoot').innerHTML = rows.length ? `<tr><td class="l" colspan="2">รวม</td><td>${num(k.oq)}</td><td>${num(k.cq)}</td><td class="sh">${num(k.sq)}</td><td class="sh">${df ? sgn(df) : ''}</td></tr>` : '';
    $('stkTbl').classList.toggle('nosh', !hasSheet);   // ยังไม่มีชีทของวันนั้น: ซ่อนคอลัมน์ชีท / ต่าง (การ์ดบนบอกแล้วว่ายังไม่มี)
    $('stkEmpty').style.display = rows.length ? 'none' : 'block'; $('stkEmpty').textContent = 'ยังไม่มีสินค้าออกในวันที่เลือก';
    $('stkPgInfo').textContent = rows.length ? `แสดง ${num((STK.page - 1) * size + 1)}–${num(Math.min(STK.page * size, rows.length))} จาก ${num(rows.length)} SKU` : '';
    $('stkPgBtns').innerHTML = pages > 1 ? `<button class="wh-btn sm" data-p="-1" ${STK.page <= 1 ? 'disabled' : ''}>‹ ก่อนหน้า</button><span>หน้า ${STK.page} / ${pages}</span><button class="wh-btn sm" data-p="1" ${STK.page >= pages ? 'disabled' : ''}>ถัดไป ›</button>` : '';
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
    if (v === 'summary') loadSummary(); if (v === 'history') loadHistory(); if (v === 'stock') loadStock();   // สรุป: ใช้ผลเดิมถ้ายังไม่เกิน 5 นาที · ประวัติ: อ่านจากตารางเรา เร็วอยู่แล้ว
  }
  function bind() {
    document.querySelectorAll('.wh-side a[data-view]').forEach(a => a.onclick = () => setView(a.dataset.view));
    $('themeBtn').onclick = () => { document.body.classList.toggle('light-theme'); try { localStorage.setItem('deesay_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark'); } catch (e) {} };
    $('outBtn').onclick = () => Auth.signOut();
    $('fRound').onclick = e => { const b = e.target.closest('button'); if (!b || S.busy) return; setRound(b.dataset.v); if (b.dataset.v !== 'c') loadAll(); };   // รอบ 1 / 2 = โหลดเลย · กำหนดเอง = ตั้งเวลาแล้วกดค้นหา
    ['fFrom', 'fTo'].forEach(id => $(id).addEventListener('input', () => { S.round = 'c'; [...$('fRound').children].forEach(b => b.classList.toggle('on', b.dataset.v === 'c')); dirty(); }));
    renderPrf(); dd('fPlatform', [['tiktok', 'Platform: TikTok']], 'tiktok', () => {});
    document.addEventListener('click', e => {   // เปิด / ปิด / เลือก dropdown แบบเว็บ (ตะกร้า / การปริ้น / Platform) — กรองทันที ไม่ดึงใหม่
      const sel = e.target.closest('.wh-sel');
      document.querySelectorAll('.wh-sel.is-open').forEach(x => { if (x !== sel) x.classList.remove('is-open'); });
      if (!sel) return;
      const it = e.target.closest('.ui-dd-item');
      if (it) { sel.classList.remove('is-open'); sel._pick && sel._pick(it.dataset.v); return; }
      if (e.target.closest('.ui-dd-btn')) sel.classList.toggle('is-open');
    });
    $('fPatBtn').onclick = () => { const dd = $('fPat'), on = !dd.classList.contains('on'); dd.classList.toggle('on', on); if (on) { $('fPatQ').value = ''; renderPat(); $('fPatQ').focus(); } };
    $('fPatQ').oninput = renderPat;
    $('fPatQ').onkeydown = e => { if (e.key === 'Escape') $('fPat').classList.remove('on'); if (e.key === 'Enter') { const b = $('fPatList').querySelector('button'); if (b) b.click(); } };
    $('fPatList').onclick = e => { const b = e.target.closest('button[data-p]'); if (!b) return; S.pat = b.dataset.p; $('fPat').classList.remove('on'); fillOptions(); applyFilters(); };
    document.addEventListener('click', e => { if (!e.target.closest('#fPat')) $('fPat').classList.remove('on'); });
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
    $('stkBtn').onclick = () => loadStock(true);
    $('stkPgBtns').onclick = e => { const b = e.target.closest('button[data-p]'); if (b) { STK.page += Number(b.dataset.p); renderStock(); } };
    $('hisBody').onclick = e => { const b = e.target.closest('button'); if (b) runPrint('reprint', HIS[Number(b.dataset.i)].order_ids); };
  }

  async function start() {
    try { if (localStorage.getItem('deesay_theme') === 'light') document.body.classList.add('light-theme'); } catch (e) {}
    const perm = await Auth.require('warehouse');   // (2026-11-23) ผู้ดูแลระบบ หรือคนที่ติ๊กช่อง Warehouse ในหน้าตั้งค่า
    // มีแค่สิทธิ์ Warehouse (ไม่มีหน้าอื่น) = ซ่อนปุ่มกลับหน้าหลัก เพราะหน้าหลักจะพากลับมาที่นี่อยู่ดี
    if (!(perm.is_admin || perm.pages.some(x => x !== 'warehouse') || perm.can_upload || perm.can_admin || perm.can_edit_kpi)) document.querySelector('.wh-side .home')?.remove();
    $('whoMail').textContent = perm.email || '';
    bind();
    const now = new Date(), ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; $('sumDate').value = ymd(now);
    $('stkDate').value = ymd(now); $('stkDate').max = ymd(now); $('stkDate').min = ymd(new Date(now.getTime() - 3 * 86400000));   // ยอดตามที่ปริ้นดูย้อนหลังได้ 3 วัน
    setRound('all');   // (2026-11-23) เปิดหน้า = ทั้งหมด ไม่กรองเวลา
    render(); loadAll();
  }
  start();
})();
