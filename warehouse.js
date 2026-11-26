// warehouse.js (2026-11-23) — หน้า Warehouse: พิมพ์ใบปะหน้า TikTok จากระบบเราเอง (สั่งจัดส่ง + ดึงใบปะหน้า) / สรุปการจัดส่ง / ประวัติการพิมพ์
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

  const S = { platform: 'tiktok', shop: 'all', admin: false, view: 'print', tab: 'ship', raw: [], rows: [], printed: {}, names: {}, sel: new Set(), page: 1, size: 50, round: '1', pat: new Set(), pats: [], patAll: 0, basket: '', car: '', prf: '', busy: false, pickTab: 'sku', counts: {} };
  try { const z = Number(localStorage.getItem('wh_page_size')); if ([50, 100, 250].includes(z)) S.size = z; } catch (e) {}
  const cuts = (() => { try { return Object.assign({ c1: '10:30', c2: '16:00' }, JSON.parse(localStorage.getItem('wh_cuts') || '{}')); } catch (e) { return { c1: '10:30', c2: '16:00' }; } })();

  // (2026-11-24) Shopee ใช้ Edge Function แยก (wh-shopee) · หน้าพิมพ์ใบปะหน้าเรียกผ่าน apiP ให้ไปตาม Platform ที่เลือก
  // (2026-11-24) ร้าน = ตัวกรองในแถบตัวกรอง (เหมือนขนส่ง) · ดึงทั้ง 2 ร้านครั้งเดียวแล้วกรองในหน้า เปลี่ยนร้านไม่ต้องโหลดใหม่
  const SHOPS = [['566792331', 'Shopee Mall'], ['530338789', 'Shopee 24hr']], SHOPNAME = { 566792331: 'Mall', 530338789: '24hr' };
  const PL = p => (p || S.platform) === 'shopee' ? 'Shopee' : 'TikTok';
  // (2026-11-25) Shopee ใช้เวลายืนยันคำสั่งซื้อ (ct = เวลาที่พร้อมให้เตรียมจัดส่ง: จ่ายออนไลน์ = เวลาชำระเงิน · เก็บเงินปลายทาง = เวลาสั่ง) กับรอบพิมพ์ / ช่วงเวลา / การเรียง · TikTok ใช้เวลาสั่งเหมือนเดิม
  const tOf = o => (S.platform === 'shopee' && o.ct) ? o.ct : o.t;
  const TW = () => S.platform === 'shopee' ? 'ยืนยัน' : 'สั่ง';   // เวลาสั่ง / เวลายืนยัน
  // (2026-11-25) ชื่อร้านบนหัวกระดาษรายการเตรียมสินค้า · TikTok เชื่อมร้านเดียว (Deesay Thailand)
  const shopLabel = list => S.platform !== 'shopee' ? 'TikTok · Deesay Thailand'
    : ([...new Set(list.map(o => o.shop).filter(Boolean).map(String))].map(id => (SHOPS.find(x => x[0] === id) || [id, 'Shopee ' + id])[1]).join(' + ') || 'Shopee');
  const apiP = body => S.platform === 'shopee' ? api({ ...body, shop: 'all' }, 'wh-shopee') : api(body);
  async function api(body, fn) {
    const r = await fetch(window.SUPABASE_URL + '/functions/v1/' + (fn || 'wh-labels'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + Auth.token(), apikey: window.SUPABASE_ANON_KEY }, body: JSON.stringify(body) });
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

  // ───── รอบพิมพ์ ─────
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
  function dirty() { $('searchBtn').classList.add('dirty'); }   // (2026-11-24) ข้อความ "ไม่จำกัด" อยู่ในปุ่มเลือกเวลาแล้ว

  // ───── โหลดรายการ ─────
  // (2026-11-23) โหลด 3 แท็บพร้อมกัน (รอจัดส่ง / รอเข้ารับ / ยกเลิกหลังพิมพ์) ตัวเลขขึ้นครบทุกแท็บ · ระหว่างโหลดมีกล่อง "กำลังโหลด" บังหน้าไว้ เสร็จแล้วปิดเอง
  // จำผลแต่ละแท็บ / ช่วงเวลา ไว้ 5 นาที — สลับแท็บแล้วโชว์ทันที · กดค้นหา / พิมพ์เสร็จ = ดึงใหม่เสมอ
  // (2026-11-24) ความเร็ว: ดึงทั้งรายการครั้งเดียวต่อ Platform (ไม่ส่งช่วงเวลา) แล้วกรองรอบ / เวลาในหน้า → กดรอบ / สลับแท็บขึ้นทันที
  //   ข้อมูลเก่าเกิน 5 นาที = แสดงของเดิมไปก่อน แล้วอัปเดตเบื้องหลัง (ไม่บังหน้าจอ) · บังหน้าจอเฉพาะครั้งแรกที่ยังไม่มีข้อมูล
  const FRESH = 5 * 60 * 1000, LC = {}, PK = {};   // PK[platform] = { map: { order_id: { by, at, shop, snap } }, got } = คำสั่งซื้อในแท็บกำลังแพ็ค
  const TABS = ['ship', 'collect', 'cancel'], TNAME = { ship: 'รอจัดส่ง', pack: 'กำลังแพ็ค', collect: 'รอเข้ารับ', cancel: 'ยกเลิกหลังพิมพ์' };
  const dk = t => t === 'pack' ? 'ship' : t;   // กำลังแพ็ค = คำสั่งซื้อรอจัดส่งที่น้องย้ายมา (สถานะในแพลตฟอร์มยังเป็นรอจัดส่ง)
  const keyOf = (t, plat) => [plat || S.platform, dk(t)].join('#');
  const fresh = t => { const c = LC[keyOf(t)]; return !!c && Date.now() - c.got < FRESH; };
  const packMap = plat => (PK[plat || S.platform] || {}).map || {};
  function rangeText() {
    const a = $('fFrom').value, b = $('fTo').value, f = v => fmtDT(new Date(v));
    if (!a && !b) return `ทั้งหมด · ไม่กรองเวลา${TW()}`;
    const r = S.round === '1' ? 'รอบ 1 · ' : S.round === '2' ? 'รอบ 2 · ' : '';
    return r + (a ? `${TW()} ${f(a)} – ${b ? f(b) : 'ตอนนี้'}` : `${TW()}ก่อน ${b ? f(b) : 'ตอนนี้'} (รวมที่ค้างจากวันก่อน)`);
  }
  // แถวของแต่ละแท็บ: รอจัดส่ง = ที่ยังไม่ย้าย · กำลังแพ็ค = ที่ย้ายมาแล้ว + ที่ไม่อยู่ในรอจัดส่งแล้ว (ถูกยกเลิก / จัดส่งที่อื่น) ใช้ข้อมูลที่เก็บไว้ตอนย้าย
  function rowsFor(t, plat) {
    plat = plat || S.platform; const c = LC[keyOf(t, plat)];
    if (!c) return null;
    if (t !== 'ship' && t !== 'pack') return c.rows;
    const P = packMap(plat);
    if (t === 'ship') return c.rows.filter(o => !P[o.id]);
    if (!PK[plat]) return null;
    const ids = new Set(c.rows.map(o => o.id));
    const gone = Object.entries(P).filter(([id]) => !ids.has(id)).map(([id, p]) => derive({ ...(p.snap || {}), id, shop: p.shop || (p.snap || {}).shop || null, gone: true }));
    return c.rows.filter(o => P[o.id]).concat(gone);
  }
  const printedFor = (t, plat) => ((LC[keyOf(t, plat)] || {}).j || {}).printed || {};
  function showTab() {
    const rows = rowsFor(S.tab);
    if (!rows) { S.raw = []; S.rows = []; render(); $('empty').style.display = 'block'; $('empty').textContent = S.busy ? 'กำลังโหลด…' : 'โหลดข้อมูลไม่ได้ กด "ค้นหา" อีกครั้ง'; return; }
    S.raw = rows; S.printed = printedFor(S.tab); S.names = (LC[keyOf(S.tab)] || {}).j?.names || S.names || {};
    fillOptions(); applyFilters(true);
    stamp();
  }
  function stamp() {   // เวลาที่ดึงข้อมูลชุดที่กำลังดูอยู่ · ระหว่างอัปเดตเบื้องหลังขึ้นว่า "กำลังอัปเดต…"
    const c = LC[keyOf(S.tab)];
    $('stPrint').classList.toggle('bad', !!S.err);
    $('stPrint').textContent = S.err ? '1 alert' : S.busy && c ? 'กำลังอัปเดต…' : c ? 'Updated ' + fmtT(new Date(c.got)) : 'กำลังโหลด…';
    $('stPrint').title = S.err || '';
  }
  async function loadPack(plat) {
    const j = await Auth.rpc('wh_pack_list', { p_platform: plat });
    const map = {}; (j || []).forEach(r => { map[r.order_id] = { by: r.by, at: r.at, shop: r.shop, snap: r.snap || {} }; });
    PK[plat] = { map, got: Date.now() };
  }
  async function loadAll(force) {
    if (S.busy) { if (force === true) S.again = true; return; }
    $('searchBtn').classList.remove('dirty');
    const plat = S.platform;
    const need = TABS.filter(t => force === true || !fresh(t)), needPack = force === true || !PK[plat] || Date.now() - PK[plat].got > FRESH;
    if (!need.length && !needPack) { showTab(); return; }
    const first = !rowsFor(S.tab, plat);   // ยังไม่มีข้อมูลของแท็บที่เปิดอยู่ = บังหน้าจอรอ (ครั้งแรก) · มีแล้ว = อัปเดตเบื้องหลัง
    S.busy = true; S.err = ''; stamp();
    const st = {}; TABS.forEach(t => { st[t] = need.includes(t) ? 'wait' : 'ok'; });
    const head = `<h2>กำลังโหลดคำสั่งซื้อ</h2><div class="s">${PL(plat)}${plat === 'shopee' ? ' · ทั้ง 2 ร้าน' : ''} · ทุกคำสั่งซื้อ (เลือกรอบได้ทันทีหลังโหลด)</div>`;
    const draw = () => { $('ldDlg').innerHTML = head + TABS.map(t => `<div class="r"><span>${TNAME[t]}</span>${st[t] === 'wait' ? '<span class="wh-spin"></span>' : st[t] === 'err' ? '<span class="pc2">โหลดไม่ได้</span>' : `<b>${num((rowsFor(t, plat) || []).length)}</b>`}</div>`).join(''); };
    if (first) { draw(); $('ldOv').classList.add('on'); }
    const errs = [];
    const done = () => { if (plat !== S.platform) return; if (first && rowsFor(S.tab, plat)) $('ldOv').classList.remove('on'); countTabs(); showTab(); };
    await Promise.all(need.map(async t => {
      try {
        const j = t === 'cancel' ? await api(plat === 'shopee' ? { action: 'cancelled', sc: true, shop: 'all' } : { action: 'cancelled', sc: true }, plat === 'shopee' ? 'wh-shopee' : undefined)
          : await api(plat === 'shopee' ? { action: 'list', tab: t, from: null, to: null, shop: 'all' } : { action: 'list', tab: t, from: null, to: null }, plat === 'shopee' ? 'wh-shopee' : undefined);
        const rows = (j.orders || []).map(derive);
        if (plat === 'shopee' && t !== 'cancel') rows.sort((x, y) => (x.ct || x.t) - (y.ct || y.t));   // (2026-11-25) Shopee เรียงตามเวลายืนยัน
        LC[keyOf(t, plat)] = { j, rows, got: Date.now() }; st[t] = 'ok';
      } catch (e) { st[t] = 'err'; errs.push(TNAME[t] + ': ' + e.message); }
      if (first) draw(); done();
    }).concat(needPack ? [loadPack(plat).catch(e => { errs.push('กำลังแพ็ค: ' + e.message); })] : []));
    // คำสั่งซื้อในกำลังแพ็คที่ไปอยู่รอเข้ารับแล้ว (จัดส่งจากที่อื่น เช่น Seller Center) = เอาออกจากกำลังแพ็คเอง
    const col = LC[keyOf('collect', plat)], P = packMap(plat);
    if (col) { const out = col.rows.filter(o => P[o.id]).map(o => o.id); if (out.length) { out.forEach(id => delete P[id]); Auth.rpc('wh_pack_remove', { p_platform: plat, p_ids: out }).catch(() => {}); } }
    S.busy = false; S.err = errs.join(' · ');
    if (plat === S.platform) { countTabs(); showTab(); }
    if (first) { if (errs.length && !rowsFor(S.tab, plat)) { $('ldDlg').insertAdjacentHTML('beforeend', `<div class="wh-note err">${errs.map(esc).join('<br>')}</div><div class="wh-act"><button class="wh-btn pri" id="ldClose" type="button">ปิด</button></div>`); $('ldClose').onclick = () => $('ldOv').classList.remove('on'); } else $('ldOv').classList.remove('on'); }
    if (S.again) { S.again = false; loadAll(true); }
  }
  // (2026-11-23) ตัวกรองรูปแบบคำสั่งซื้อ (SKU) = รูปแบบที่มีจริงในแท็บที่เปิดอยู่ + จำนวนคำสั่งซื้อ เรียงมาก → น้อย · ตะกร้า = เฉพาะที่อยู่ในรูปแบบที่เลือก
  //   เลือกแล้วกรองทันที (กรองจากข้อมูลที่โหลดไว้ ไม่ดึง TikTok ใหม่)
  //   (2026-11-24) ขนส่ง = เฉพาะขนส่งที่มีตามตัวกรองอื่นที่เลือก + จำนวนคำสั่งซื้อ · เลือกขนส่งแล้วรูปแบบ / ตะกร้าก็แสดงเฉพาะของขนส่งนั้น
  const carOf = o => o.carrier || '-';
  function carCount() { const cc = {}; S.raw.forEach(o => { if (passes(o, S.printed, { car: true })) cc[carOf(o)] = (cc[carOf(o)] || 0) + 1; }); return cc; }
  function fillOptions() {
    if (S.platform === 'shopee') {   // ร้าน + จำนวนคำสั่งซื้อตามตัวกรองอื่น (แสดงครบ 2 ร้านเสมอ แม้เป็น 0)
      const sc = {}; S.raw.forEach(o => { if (passes(o, S.printed, { shop: true })) sc[o.shop] = (sc[o.shop] || 0) + 1; });
      dd('fShop', [['all', 'ทั้ง 2 ร้าน'], ...SHOPS.map(([v, l]) => [v, `${l} · ${num(sc[v] || 0)}`])], S.shop, v => { S.shop = v; fillOptions(); applyFilters(); });
    }
    if (S.car && !carCount()[S.car]) S.car = '';
    const pc = {}; let all = 0;
    S.raw.forEach(o => { if (passes(o, S.printed, { pat: true, basket: true })) { pc[o.pat] = (pc[o.pat] || 0) + 1; all++; } });
    S.pats = Object.entries(pc).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); S.patAll = all;
    [...S.pat].forEach(p => { if (!pc[p]) S.pat.delete(p); });   // รูปแบบที่เลือกไว้แต่ไม่มีแล้วตามตัวกรองอื่น = เอาออก
    const bs = new Set(); S.raw.forEach(o => { if (passes(o, S.printed, { basket: true })) o.bnames.forEach(b => bs.add(b)); });
    if (S.basket && !bs.has(S.basket)) S.basket = '';
    dd('fBasket', [['', 'ทั้งหมด'], ...[...bs].sort().map(v => [v, v])], S.basket, v => { S.basket = v; fillOptions(); applyFilters(); });
    const cc = carCount(), cs = Object.keys(cc).sort((a, b) => a === '-' ? 1 : b === '-' ? -1 : a.localeCompare(b, 'en', { sensitivity: 'base' }));
    dd('fCarrier', [['', 'ทั้งหมด'], ...cs.map(c => [c, `${c === '-' ? 'ไม่ระบุ' : c} · ${num(cc[c])}`])], S.car, v => { S.car = v; fillOptions(); applyFilters(); });
    renderPat();
  }
  // (2026-11-23) dropdown แบบเว็บ (ui.css .ui-dd) แทน <select> ของ browser · items = [[ค่า, ข้อความ]] · กดปุ่มเดิมซ้ำ = ปิด
  // ───── ช่องวันที่ + เวลา / ช่องเวลา แบบเว็บ (2026-11-24) — แทนกล่องของ browser · หน้าตาเดียวกับปฏิทินกลาง (ui.css .ui-cal)
  // ค่าจริงยังอยู่ใน input เดิม (YYYY-MM-DDTHH:MM / HH:MM) โค้ดเดิมที่อ่าน .value / ฟัง input ใช้ได้เหมือนเดิม
  const MLONG = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'], WDAY = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const ymdOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const TP = { pop: null, inp: null };
  function tpClose() { if (TP.pop) { TP.pop.remove(); TP.pop = null; TP.inp = null; } }
  function tpLabel(inp) {
    const v = inp.value; if (!v) return inp.dataset.ph || 'เลือกเวลา';
    if (inp.type === 'time') return v.slice(0, 5) + ' น.';
    const d = new Date(v); return `${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear() + 543} · ${pad(d.getHours())}:${pad(d.getMinutes())} น.`;
  }
  function tpEnhance(inp) {
    if (!inp || inp._tpBtn) return;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ui-datebtn';
    btn.innerHTML = inp.type === 'time' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span></span>'
      : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg><span></span>';
    const sync = () => { btn.querySelector('span').textContent = tpLabel(inp); btn.classList.toggle('is-empty', !inp.value); };
    const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    Object.defineProperty(inp, 'value', { configurable: true, get() { return proto.get.call(this); }, set(v) { proto.set.call(this, v); sync(); } });
    inp.classList.add('ui-native-hidden'); inp.tabIndex = -1; inp.after(btn); inp._tpBtn = btn;
    btn.addEventListener('click', e => { e.stopPropagation(); if (TP.inp === inp) tpClose(); else tpOpen(inp, btn); });
    sync();
  }
  function tpOpen(inp, btn) {
    tpClose();
    const dt = inp.type === 'datetime-local';
    const parts = () => { const v = inp.value; if (!v) return null; const t = dt ? v.split('T')[1] || '00:00' : v; return { d: dt ? v.split('T')[0] : null, h: +t.slice(0, 2), m: +t.slice(3, 5) }; };
    const p0 = parts(), base = p0 && p0.d ? new Date(p0.d + 'T00:00:00') : new Date();
    let view = new Date(base.getFullYear(), base.getMonth(), 1), first = true;
    const pop = TP.pop = document.createElement('div'); TP.inp = inp;
    pop.className = 'ui-cal wh-tp' + (document.body.classList.contains('light-theme') ? ' ui-light' : '');
    pop.setAttribute('role', 'dialog'); document.documentElement.appendChild(pop);
    const fire = () => { inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); };
    const set = (d, h, m) => { inp.value = dt ? `${d}T${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}`; fire(); draw(); };
    const draw = () => {
      const p = parts(), today = ymdOf(new Date()), keep = [...pop.querySelectorAll('.wh-tp-col')].map(c => c.scrollTop);
      let cal = '';
      if (dt) {
        const start = new Date(view); start.setDate(1 - view.getDay()); let cells = '';
        for (let i = 0; i < 42; i++) { const d = new Date(start); d.setDate(start.getDate() + i); const s = ymdOf(d);
          cells += `<button type="button" class="ui-cal-d${d.getMonth() !== view.getMonth() ? ' is-out' : ''}${s === today ? ' is-today' : ''}" data-d="${s}"${p && p.d === s ? ' aria-selected="true"' : ''}>${d.getDate()}</button>`; }
        cal = `<div class="wh-tp-cal"><div class="ui-cal-h"><button type="button" class="ui-cal-nav" data-nav="-1" aria-label="เดือนก่อน">‹</button><b>${MLONG[view.getMonth()]} ${view.getFullYear() + 543}</b><button type="button" class="ui-cal-nav" data-nav="1" aria-label="เดือนถัดไป">›</button></div><div class="ui-cal-w">${WDAY.map(w => `<span>${w}</span>`).join('')}</div><div class="ui-cal-g">${cells}</div></div>`;
      }
      const col = (k, n, step, sel) => `<div class="wh-tp-col">${Array.from({ length: n / step }, (_, i) => i * step).map(v => `<button type="button" class="ui-cal-d" data-${k}="${v}"${sel === v ? ' aria-selected="true"' : ''}>${pad(v)}</button>`).join('')}</div>`;
      pop.innerHTML = `<div class="wh-tp-body">${cal}<div class="wh-tp-time"><div class="wh-tp-th"><span>ชั่วโมง</span><span>นาที</span></div><div class="wh-tp-cols">${col('h', 24, 1, p ? p.h : null)}${col('m', 60, 5, p ? p.m : null)}</div></div></div>`
        + `<div class="ui-cal-f wh-tp-f">${dt ? `<button type="button" class="ui-cal-link" data-act="clear">${inp.dataset.ph ? 'ไม่จำกัด' : 'ล้าง'}</button><button type="button" class="ui-cal-link" data-act="now">ปัจจุบัน</button>` : ''}<span class="sp"></span><button type="button" class="ui-cal-link" data-act="ok">ตกลง</button></div>`;
      if (dt) pop.querySelector('.wh-tp-cols').style.height = (pop.querySelector('.wh-tp-cal').offsetHeight - pop.querySelector('.wh-tp-th').offsetHeight) + 'px';   // คอลัมน์เวลาสูงเท่าปฏิทิน
      pop.querySelectorAll('.wh-tp-col').forEach((c, i) => { const s = c.querySelector('[aria-selected="true"]');
        c.scrollTop = first ? (s ? s.offsetTop - c.offsetTop - c.clientHeight / 2 + s.offsetHeight / 2 : 0) : keep[i]; });
      first = false;
      const r = btn.getBoundingClientRect(), w = pop.offsetWidth, hh = pop.offsetHeight;
      let top = r.bottom + 6; if (top + hh > innerHeight - 8 && r.top - hh - 6 > 8) top = r.top - hh - 6;
      pop.style.top = top + 'px'; pop.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    };
    pop.addEventListener('click', e => {
      e.stopPropagation();
      const b = e.target.closest('button'); if (!b) return;
      const p = parts() || { d: ymdOf(new Date()), h: 0, m: 0 }, d = p.d || ymdOf(new Date());
      if (b.dataset.nav) { view.setMonth(view.getMonth() + +b.dataset.nav); draw(); }
      else if (b.dataset.d) set(b.dataset.d, p.h, p.m);
      else if (b.dataset.h != null) set(d, +b.dataset.h, p.m);
      else if (b.dataset.m != null) set(d, p.h, +b.dataset.m);
      else if (b.dataset.act === 'now') { const n = new Date(); view = new Date(n.getFullYear(), n.getMonth(), 1); set(ymdOf(n), n.getHours(), n.getMinutes()); }
      else if (b.dataset.act === 'clear') { inp.value = ''; fire(); tpClose(); btn.focus(); }
      else if (b.dataset.act === 'ok') { tpClose(); btn.focus(); }
    });
    draw();
  }
  document.addEventListener('click', e => { if (TP.pop && !TP.pop.contains(e.target)) tpClose(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && TP.pop) { const b = TP.inp && TP.inp._tpBtn; tpClose(); if (b) b.focus(); } });
  addEventListener('resize', tpClose);
  addEventListener('scroll', e => { if (TP.pop && !TP.pop.contains(e.target)) tpClose(); }, true);

  // (2026-11-24) Platform: TikTok / Shopee · Shopee เลือกร้านได้ (ทั้ง 2 ร้าน / Mall / 24hr) — เปลี่ยนแล้วโหลดรายการใหม่
  function drawPlat() {
    const plats = [['tiktok', 'Platform: TikTok'], ['shopee', 'Platform: Shopee']];   // (2026-11-24) เปิด Shopee ให้ทุกบัญชีที่มีสิทธิ์ Warehouse (เมฆอนุมัติ)
    dd('fPlatform', plats, S.platform, v => { if (v === S.platform) return; S.platform = v; drawPlat(); switchList(); });
    $('fShopF').style.display = S.platform === 'shopee' ? '' : 'none';
    $('fFromL').textContent = `เวลา${TW()} ตั้งแต่`;   // (2026-11-25) Shopee = เวลายืนยัน
  }
  function switchList() { S.sel.clear(); S.pat.clear(); S.basket = ''; S.car = ''; S.shop = 'all'; S.page = 1; S.raw = []; S.rows = []; render(); loadAll(); }

  function dd(id, items, value, onPick) {
    const el = $(id), cur = items.find(x => x[0] === value) || items[0];
    el.innerHTML = `<button type="button" class="ui-dd-btn"><span>${esc(cur[1])}</span></button><div class="ui-dd-menu">${items.map(([v, l]) => `<button type="button" class="ui-dd-item" data-v="${esc(v)}" aria-selected="${v === cur[0]}">${esc(l)}</button>`).join('')}</div>`;
    el.title = cur[0] ? cur[1] : ''; el._pick = onPick;
  }
  const PRF = [['', 'ทั้งหมด'], ['0', 'ยังไม่พิมพ์'], ['1', 'พิมพ์แล้ว']];
  function renderPrf() { dd('fPrinted', PRF, S.prf, v => { S.prf = v; renderPrf(); fillOptions(); applyFilters(); }); }
  const normQ = t => String(t).toUpperCase().replace(/×/g, 'X').replace(/\s+/g, '');
  // (2026-11-24) รูปแบบคำสั่งซื้อ: ติ๊กเลือกได้หลายแบบ · ค้นหาแล้วเลือกทั้งหมดที่ค้นเจอได้ · ทั้งหมด = ล้างที่เลือก · กล่องไม่ปิดระหว่างเลือก
  function renderPat() {
    const n = S.pat.size, one = n === 1 ? [...S.pat][0] : '';
    $('fPatTx').textContent = !n ? 'ทั้งหมด' : one || `เลือก ${num(n)} รูปแบบ`; $('fPatBtn').title = [...S.pat].join('\n');
    const q = normQ($('fPatQ').value), items = S.pats.filter(([p]) => !q || normQ(p).includes(q));
    const allQ = q && items.length > 1 && items.every(([p]) => S.pat.has(p));
    $('fPatList').innerHTML = (q ? (items.length > 1 ? `<button type="button" data-p="__q" class="all${allQ ? ' on' : ''}"><i class="ck"></i><span>${allQ ? 'ยกเลิกที่ค้นเจอทั้งหมด' : 'เลือกทั้งหมดที่ค้นเจอ'}</span><small>${num(items.length)} รูปแบบ</small></button>` : '')
      : `<button type="button" data-p="" class="${n ? '' : 'on'}"><i class="ck"></i><span>ทั้งหมด</span><small>${num(S.patAll)} คำสั่งซื้อ</small></button>`)
      + items.map(([p, c]) => `<button type="button" data-p="${esc(p)}" class="${S.pat.has(p) ? 'on' : ''}"><i class="ck"></i><span>${esc(p)}</span><small>${num(c)} คำสั่งซื้อ</small></button>`).join('')
      + (q && !items.length ? '<div class="wh-dd-empty">ไม่พบรูปแบบที่มี SKU นี้</div>' : '');
  }
  function passes(o, printed, skip = {}) {
    const b = S.basket, pr = S.prf;
    if (S.tab !== 'cancel' && !inRange(o)) return false;
    if (S.pat.size && !skip.pat && !S.pat.has(o.pat)) return false;
    if (b && !skip.basket && !(o.bnames || []).includes(b)) return false;
    if (S.car && !skip.car && carOf(o) !== S.car) return false;
    if (S.shop !== 'all' && !skip.shop && String(o.shop) !== S.shop) return false;
    const n = printed[o.id] || 0;
    if (pr === '0' && n > 0) return false;
    if (pr === '1' && n === 0) return false;
    return true;
  }
  function inRange(o) {   // เวลาสั่งตามรอบ / ช่วงที่เลือก (เดิมส่งให้ระบบหลังบ้านกรอง · ตอนนี้กรองในหน้า)
    const a = $('fFrom').value, b = $('fTo').value;
    if (a && tOf(o) * 1000 < new Date(a).getTime()) return false;
    if (b && tOf(o) * 1000 >= new Date(b).getTime()) return false;
    return true;
  }
  function countTabs() {
    const cur = S.tab;
    ['ship', 'pack', 'collect', 'cancel'].forEach(t => { const r = rowsFor(t); S.tab = t; S.counts[t] = r ? r.filter(o => passes(o, printedFor(t))).length : undefined; });
    S.tab = cur;
  }
  function applyFilters(keepPage) {
    S.rows = S.raw.filter(o => passes(o, S.printed));
    const keep = new Set(S.rows.filter(o => !o.gone).map(o => o.id)); S.sel = new Set([...S.sel].filter(id => keep.has(id)));
    if (keepPage !== true) S.page = 1;
    countTabs(); render();
  }

  // ───── ตาราง ─────
  function itemsHtml(o) {   // (2026-11-23) เรียงตามรหัส + คั่นด้วย "+" ให้ตรงกับตัวกรองรูปแบบคำสั่งซื้อ · ไม่มีป้าย "หลายรายการ" (ล้นช่อง)
    return Object.keys(o.parts).sort().map(k => `<b title="${esc(S.names[k] || '')}">${esc(k)}</b> × ${o.parts[k]}`).join(' + ');
  }
  // ยกเลิกหลังพิมพ์นานเท่าไร (เวลายกเลิก − เวลาพิมพ์)
  function afterTxt(o) { const m = Math.max(0, Math.round((o.cancel_time * 1000 - new Date(o.printed_at).getTime()) / 60000)); return 'หลังพิมพ์ ' + (m < 60 ? `${m} นาที` : m < 1440 ? `${Math.round(m / 60)} ชม.` : `${Math.round(m / 1440)} วัน`); }
  function printedHtml(id) { const n = S.printed[id] || 0; return n === 0 ? '<span class="pc0">ยังไม่พิมพ์</span>' : n === 1 ? '<span class="pc1">1</span>' : `<span class="pc2">${n}</span>`; }
  function render() {
    const cancel = S.tab === 'cancel';
    [...$('tabs').children].forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
    $('nShip').textContent = S.counts.ship ?? ''; $('nPack').textContent = S.counts.pack ?? ''; $('nCollect').textContent = S.counts.collect ?? ''; $('nCancel').textContent = S.counts.cancel ?? '';
    const pack = S.tab === 'pack', P = packMap();
    const infoCt = `<span class="wh-i">i<span class="pop"><b>เวลายืนยัน (Confirmed time)</b><br>เวลาที่คำสั่งซื้อพร้อมให้เตรียมจัดส่งใน Shopee<br>จ่ายออนไลน์ = เวลาที่ชำระเงินสำเร็จ<br>เก็บเงินปลายทาง (COD) = เวลาที่สั่งซื้อ<br>รอบพิมพ์ ช่วงเวลา และการเรียง ใช้เวลานี้<br>ตัวเล็กด้านล่าง = เวลาที่ลูกค้าสั่ง (แสดงเมื่อต่างกันเกิน 1 นาที)</span></span>`;
    const infoPk = `<span class="wh-i r">i<span class="pop"><b>ย้ายมาเมื่อ</b><br>เวลาที่ย้ายคำสั่งซื้อจากรอจัดส่งมากำลังแพ็ค และชื่อบัญชีที่ย้าย</span></span>`;
    const whoShort = e => String(e || '').split('@')[0];
    const lastCell = o => pack ? (o.gone ? `<span class="wh-pill bad">ไม่อยู่ในรอจัดส่งแล้ว</span><div><button class="wh-btn sm" data-rm="${esc(o.id)}" type="button">เอาออก</button></div>`
      : `${P[o.id] && P[o.id].at ? fmtDT(new Date(P[o.id].at)) : '—'}<div class="wh-sub">${esc(whoShort(P[o.id] && P[o.id].by))}</div>`) : printedHtml(o.id);
    const info = `<span class="wh-i r">i<span class="pop"><b>พิมพ์แล้ว (ครั้ง)</b><br>จำนวนครั้งที่ใบปะหน้าของคำสั่งซื้อนี้ถูกพิมพ์จากหน้านี้ รวมการพิมพ์ซ้ำ<br>ไม่นับการพิมพ์จาก Seller Center</span></span>`;
    // (2026-11-23) ยกเลิกหลังพิมพ์: รวมที่กดจัดส่ง / พิมพ์จาก Seller Center แล้วถูกยกเลิกก่อนขนส่งมารับ (src = sc)
    // (2026-11-23) บอกให้ชัดว่า "พิมพ์แล้ว" + ยกเลิกหลังพิมพ์นานเท่าไร (เช่น ระหว่างน้องพิมพ์ทีละ 250 ใบ แล้วลูกค้ายกเลิก)
    const infoSrc = `<span class="wh-i r">i<span class="pop"><b>พิมพ์จาก</b><br>หน้านี้ = พิมพ์จากหน้า Warehouse (ตัวเลข = จำนวนครั้งที่พิมพ์)<br>Seller Center = กดจัดส่ง / พิมพ์ใบปะหน้าจาก Seller Center</span></span>`;
    const infoSt = `<span class="wh-i">i<span class="pop"><b>สถานะ</b><br>พิมพ์แล้ว · ยกเลิกแล้ว = ลูกค้ายกเลิกหลังพิมพ์ใบปะหน้า ขนส่งยังไม่มารับ พัสดุยังอยู่ในคลัง<br>พิมพ์แล้ว · ลูกค้าขอยกเลิก = มีคำขอยกเลิกค้างอยู่ อย่าเพิ่งส่งให้ขนส่ง</span></span>`;
    $('thead').innerHTML = cancel
      ? `<tr><th>พิมพ์ใบปะหน้าเมื่อ</th><th>ยกเลิกเมื่อ</th><th>เลขคำสั่งซื้อ</th><th class="l">สินค้าที่ต้องรับคืน (SKU × จำนวน)</th><th>จำนวนชิ้น</th><th>สถานะ ${infoSt}</th><th class="l">เหตุผลที่ยกเลิก</th><th>พิมพ์จาก ${infoSrc}</th></tr>`
      : `<tr><th style="width:36px"><input type="checkbox" id="chkAll" title="เลือกทั้งหมดที่ค้นเจอ"></th><th>เวลา${TW()}${S.platform === 'shopee' ? ' ' + infoCt : ''}</th><th>เลขคำสั่งซื้อ</th><th class="l">ตะกร้า</th><th class="l">สินค้า (SKU × จำนวน)</th><th>จำนวนชิ้น</th><th>การชำระ</th><th>ขนส่ง</th><th>${pack ? 'ย้ายมาเมื่อ ' + infoPk : 'พิมพ์แล้ว (ครั้ง) ' + info}</th></tr>`;
    const pages = Math.max(1, Math.ceil(S.rows.length / S.size)); if (S.page > pages) S.page = pages;
    const view = S.rows.slice((S.page - 1) * S.size, S.page * S.size);
    $('tbody').innerHTML = view.map(o => cancel
      ? `<tr><td>${o.printed_at ? fmtDT(new Date(o.printed_at)) : '—'}</td><td>${o.cancel_time ? fmtDT(new Date(o.cancel_time * 1000)) + `<div class="wh-sub">${afterTxt(o)}</div>` : '—'}</td><td>${esc(o.id)}${shopSub(o)}</td><td class="l">${itemsHtml(o)}</td><td>${o.qty}</td><td>${o.st === 'CANCELLED' ? '<span class="wh-pill bad">พิมพ์แล้ว · ยกเลิกแล้ว</span>' : '<span class="wh-pill cod">พิมพ์แล้ว · ลูกค้าขอยกเลิก</span>'}</td><td class="l">${esc(o.cancel_reason || (o.st === 'CANCELLED' ? 'ยกเลิกแล้ว' : 'มีคำขอยกเลิก'))}</td><td>${o.src === 'sc' ? 'Seller Center' : `หน้านี้ (${num(S.printed[o.id] || 1)} ครั้ง)`}</td></tr>`
      : `<tr class="${o.gone ? 'gone' : 'pick'} ${S.sel.has(o.id) ? 'sel' : ''}" data-id="${esc(o.id)}"><td>${o.gone ? '' : `<input type="checkbox" ${S.sel.has(o.id) ? 'checked' : ''}>`}</td><td>${fmtDT(new Date(tOf(o) * 1000))}${tOf(o) - o.t > 60 ? `<div class="wh-sub">สั่ง ${fmtDT(new Date(o.t * 1000))}</div>` : ''}</td><td>${esc(o.id)}${shopSub(o)}</td><td class="l"><span class="wh-bk" title="${esc(o.bnames.join(' + '))}">${esc(o.bnames.join(' + '))}</span></td><td class="l">${itemsHtml(o)}</td><td>${o.qty}</td><td>${o.cod ? '<span class="wh-pill cod">COD</span>' : '<span class="wh-pill">ชำระแล้ว</span>'}</td><td>${esc(o.carrier || '—')}</td><td>${lastCell(o)}</td></tr>`).join('');
    const empty = !S.rows.length;
    $('empty').style.display = empty ? 'block' : 'none';
    if (empty) $('empty').textContent = cancel ? 'ไม่มีคำสั่งซื้อที่ถูกยกเลิกหลังจัดส่ง / พิมพ์ (ย้อนหลัง 7 วัน)' : pack && !Object.keys(P).length ? 'ยังไม่มีคำสั่งซื้อในกำลังแพ็ค — เลือกคำสั่งซื้อในแท็บรอจัดส่ง แล้วกด "ย้ายไปกำลังแพ็ค"' : 'ไม่มีคำสั่งซื้อตามเงื่อนไขที่เลือก';
    $('pgInfo').textContent = empty ? '' : `แสดง ${num((S.page - 1) * S.size + 1)}–${num(Math.min(S.page * S.size, S.rows.length))} จาก ${num(S.rows.length)} คำสั่งซื้อ`;
    $('pgBtns').innerHTML = pages > 1 ? `<button class="wh-btn sm" data-p="-1" ${S.page <= 1 ? 'disabled' : ''}>‹ ก่อนหน้า</button><span>หน้า ${S.page} / ${pages}</span><button class="wh-btn sm" data-p="1" ${S.page >= pages ? 'disabled' : ''}>ถัดไป ›</button>` : '';
    [...$('pgSize').children].forEach(b => b.classList.toggle('on', Number(b.dataset.v) === S.size));
    const nSel = S.rows.filter(o => !o.gone).length, all = $('chkAll'); if (all) { all.checked = nSel > 0 && S.sel.size === nSel; all.indeterminate = S.sel.size > 0 && S.sel.size < nSel; }
    renderSel();
  }
  function selected() { return S.rows.filter(o => S.sel.has(o.id)); }
  const shopSub = o => o.shop ? `<div class="wh-sub">Shopee ${SHOPNAME[o.shop] || ''}</div>` : '';
  function summarize(list) {
    const sku = {}, pat = {}, skuC = {}, patC = {}, car = {}; let qty = 0;
    list.forEach(o => {
      const c = o.carrier || 'ไม่ระบุ'; qty += o.qty; car[c] = (car[c] || 0) + 1;
      for (const k in o.parts) { sku[k] = (sku[k] || 0) + o.parts[k]; (skuC[k] ??= {})[c] = (skuC[k][c] || 0) + o.parts[k]; }
      pat[o.pat] = (pat[o.pat] || 0) + 1; (patC[o.pat] ??= {})[c] = (patC[o.pat][c] || 0) + 1;
    });
    return { sku, pat, skuC, patC, cars: Object.keys(car).sort((a, b) => car[b] - car[a] || a.localeCompare(b)), qty, n: list.length };
  }
  function renderSel() {
    const cancel = S.tab === 'cancel', s = summarize(selected());
    $('selN').innerHTML = cancel ? `${num(S.rows.length)} คำสั่งซื้อที่พิมพ์ใบปะหน้าแล้วแต่ถูกยกเลิก · ต้องนำสินค้ากลับเข้าคลัง <span class="wh-i">i<span class="pop"><b>ยกเลิกหลังพิมพ์</b><br>พิมพ์ใบปะหน้าแล้ว (จากหน้านี้หรือ Seller Center) แต่ลูกค้ายกเลิกก่อนขนส่งเข้ารับ พัสดุจึงยังอยู่ในคลัง ต้องแยกออกจากกองพัสดุและนำสินค้ากลับเข้าคลัง<br>แสดงย้อนหลัง 7 วัน (หน้าสรุปการจัดส่งนับเฉพาะวันที่เลือก) · ไม่รวมพัสดุที่ขนส่งรับไปแล้ว</span></span>` : `เลือกแล้ว ${num(s.n)} คำสั่งซื้อ`;
    $('selM').textContent = cancel || !s.n ? '' : `รวม ${num(s.qty)} ชิ้น · ${Object.keys(s.sku).length} รายการสินค้า`;
    $('pickBtn').style.display = cancel ? 'none' : ''; $('goBtn').style.display = cancel ? 'none' : ''; $('backBtn').style.display = S.tab === 'pack' ? '' : 'none';
    $('pickBtn').disabled = !s.n; $('goBtn').disabled = !s.n; $('backBtn').disabled = !s.n;
    // (2026-11-24) รอจัดส่ง = ย้ายไปกำลังแพ็ค · กำลังแพ็ค = จัดส่ง + พิมพ์ (และย้ายกลับ) · รอเข้ารับ = พิมพ์ซ้ำ
    $('goBtn').textContent = S.tab === 'collect' ? 'พิมพ์ใบปะหน้าซ้ำ' : S.tab === 'ship' ? 'ย้ายไปกำลังแพ็ค' : 'จัดส่ง + พิมพ์ใบปะหน้า';
    if (S.tab === 'pack' && !cancel) $('selN').insertAdjacentHTML('beforeend', ` <span class="wh-i">i<span class="pop"><b>กำลังแพ็ค</b><br>คำสั่งซื้อที่ย้ายมาจากรอจัดส่ง เพื่อแพ็คและพิมพ์ใบปะหน้ากลุ่มนี้ · ทุกเครื่องเห็นเหมือนกัน<br>สถานะใน ${PL()} ยังเป็นรอจัดส่ง จนกว่าจะกด "จัดส่ง + พิมพ์ใบปะหน้า" แล้วจะย้ายไปรอเข้ารับ<br>ถ้าจัดส่งจาก Seller Center แทน คำสั่งซื้อจะออกจากกำลังแพ็คเอง · "ไม่อยู่ในรอจัดส่งแล้ว" = ถูกยกเลิก หรือสถานะเปลี่ยน กด "เอาออก"</span></span>`);
  }

  // ───── กล่องรายการเตรียมสินค้า ─────
  // (2026-11-24) แยกตามขนส่ง: 1 คอลัมน์ต่อขนส่ง (หัวตาราง 2 ชั้น) + คอลัมน์รวม เมื่อมีมากกว่า 1 ขนส่ง · 0 = จางลง
  function pickTables(s) {
    const cs = s.cars, multi = cs.length > 1, z = v => v ? num(v) : '<span class="wh-z">0</span>';
    const cells = (byC, tot) => cs.map(c => `<td>${z((byC || {})[c] || 0)}</td>`).join('') + (multi ? `<td><b>${num(tot)}</b></td>` : '');
    const head = (lead, what) => `<thead><tr>${lead}<th colspan="${cs.length}">${what} แยกตามขนส่ง</th>${multi ? '<th rowspan="2">รวม</th>' : ''}</tr><tr>${cs.map(c => `<th class="wh-car">${esc(c)}</th>`).join('')}</tr></thead>`;
    const foot = (lead, byC, tot) => `<tfoot><tr>${lead}${cs.map(c => `<td>${num(byC[c] || 0)}</td>`).join('')}${multi ? `<td>${num(tot)}</td>` : ''}</tr></tfoot>`;
    const sumBy = m => { const o = {}; Object.values(m).forEach(x => { for (const c in x) o[c] = (o[c] || 0) + x[c]; }); return o; };
    const skuRows = Object.keys(s.sku).sort().map(k => `<tr><td class="l"><b>${esc(k)}</b></td><td class="l">${esc(S.names[k] || '—')}</td>${cells(s.skuC[k], s.sku[k])}</tr>`).join('');
    // (2026-11-23) แท็บ 2 = รูปแบบคำสั่งซื้อ (แทนตะกร้า / Promotion) — ไม่มีชื่อตะกร้า นับจำนวนคำสั่งซื้อต่อรูปแบบ เรียงมาก → น้อย
    const patRows = Object.entries(s.pat).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([p, n]) => `<tr><td class="l"><b>${esc(p)}</b></td>${cells(s.patC[p], n)}</tr>`).join('');
    return {
      sku: `<table class="wh-t wh-pk">${head('<th class="l" rowspan="2">SKU</th><th class="l" rowspan="2">ชื่อสินค้า</th>', 'จำนวนชิ้นที่ต้องหยิบ')}<tbody>${skuRows}</tbody>${foot('<td class="l" colspan="2">รวม</td>', sumBy(s.skuC), s.qty)}</table>`,
      pat: `<table class="wh-t wh-pk">${head('<th class="l" rowspan="2">รูปแบบคำสั่งซื้อ (SKU × จำนวน)</th>', 'จำนวนคำสั่งซื้อ')}<tbody>${patRows}</tbody>${foot('<td class="l">รวม</td>', sumBy(s.patC), s.n)}</table>`,
      nSku: Object.keys(s.sku).length, nPat: Object.keys(s.pat).length,
    };
  }
  function openPick() {
    const list = selected(); if (!list.length) return;
    const s = summarize(list), t = pickTables(s), reprint = S.tab === 'collect', toPack = S.tab === 'ship';
    const when = fmtDT(new Date());
    $('dlg').innerHTML = `<h2>รายการเตรียมสินค้า</h2><div class="s">สรุปจากคำสั่งซื้อที่เลือก · ${esc(shopLabel(list))} · ${when}</div>
      <div class="wh-kp"><div><small>คำสั่งซื้อที่เลือก</small><b>${num(s.n)}</b></div><div><small>จำนวนสินค้า (รายการ)</small><b>${t.nSku}</b></div><div><small>จำนวนชิ้นรวม</small><b>${num(s.qty)}</b></div></div>
      <div class="wh-tabs" id="pkTabs"><button data-k="sku" type="button">สินค้าที่ต้องหยิบ<small>${t.nSku}</small></button><button data-k="pat" type="button">รูปแบบคำสั่งซื้อ<small>${t.nPat}</small></button></div>
      <div id="pkBody"></div>
      <div class="wh-note" id="pkNote">${toPack ? `ย้ายไปแท็บกำลังแพ็ค เพื่อแพ็คและพิมพ์ใบปะหน้ากลุ่มนี้ · สถานะใน ${PL()} ยังไม่เปลี่ยน ย้ายกลับได้` : reprint ? `พิมพ์ซ้ำ: สถานะใน ${PL()} ไม่เปลี่ยน ระบบจะนับจำนวนครั้งที่พิมพ์เพิ่ม` : `เมื่อกด "ยืนยันจัดส่ง" คำสั่งซื้อทั้งหมดที่เลือกจะย้ายไปสถานะรอเข้ารับใน ${PL()} ทันที${S.platform === 'shopee' ? ' และนัดขนส่งเข้ารับที่คลังรอบเวลาแรกที่มี' : ''} และยกเลิกย้อนกลับไม่ได้`}</div>
      <div class="wh-act"><button class="wh-btn" id="pkClose" type="button">ยกเลิก</button><button class="wh-btn" id="pkPrint" type="button">พิมพ์รายการในแท็บนี้</button><button class="wh-btn pri" id="pkGo" type="button">${toPack ? 'ย้ายไปกำลังแพ็ค' : reprint ? 'พิมพ์ใบปะหน้าซ้ำ' : 'ยืนยันจัดส่ง + พิมพ์ใบปะหน้า'}</button></div>`;
    const show = k => { S.pickTab = k; [...$('pkTabs').children].forEach(b => b.classList.toggle('on', b.dataset.k === k)); $('pkBody').innerHTML = t[k]; };
    show(t[S.pickTab] ? S.pickTab : 'sku');
    $('pkTabs').onclick = e => { const b = e.target.closest('button'); if (b) show(b.dataset.k); };
    $('pkClose').onclick = closeDlg;
    $('pkPrint').onclick = () => {
      const title = S.pickTab === 'sku' ? 'รายการเตรียมสินค้า — สินค้าที่ต้องหยิบ' : 'รายการเตรียมสินค้า — รูปแบบคำสั่งซื้อ';
      $('printArea').innerHTML = `<div class="shop">${esc(shopLabel(list))}</div><h2>${title}</h2><div class="s">${when} · ${num(s.n)} คำสั่งซื้อ · ${num(s.qty)} ชิ้น · ${esc(rangeText())}</div>${t[S.pickTab]}`;
      window.print();
    };
    $('pkGo').onclick = () => toPack ? (closeDlg(), packMove(true, list)) : runPrint(reprint ? 'reprint' : 'ship', list.map(o => o.id));
    $('ov').classList.add('on');
  }
  // ───── กำลังแพ็ค (2026-11-24) — เก็บในตาราง wh_packing ผ่าน RPC wh_pack_add / wh_pack_remove (ทุกเครื่องเห็นเหมือนกัน)
  const snapOf = o => ({ id: o.id, t: o.t, ct: o.ct || null, carrier: o.carrier || '', cod: !!o.cod, shop: o.shop || null, lines: (o.lines || []).map(l => ({ sku: l.sku, pname: l.pname })) });
  async function packMove(on, list) {
    const plat = S.platform; if (!list.length) return;
    try {
      if (on) await Auth.rpc('wh_pack_add', { p_platform: plat, p_items: list.map(o => ({ id: o.id, shop: o.shop ? String(o.shop) : null, snap: snapOf(o) })) });
      else await Auth.rpc('wh_pack_remove', { p_platform: plat, p_ids: list.map(o => o.id) });
    } catch (e) { uiAlert(on ? 'ย้ายไปกำลังแพ็คไม่สำเร็จ' : 'ย้ายกลับไม่สำเร็จ', { text: e.message, tone: 'bad' }); return; }
    const P = (PK[plat] ??= { map: {}, got: Date.now() }).map, me = (Auth.perm || {}).email || '', now = new Date().toISOString();
    list.forEach(o => { if (on) P[o.id] = { by: me, at: now, shop: o.shop ? String(o.shop) : null, snap: snapOf(o) }; else delete P[o.id]; });
    S.sel.clear(); showTab();
    toast(on ? `ย้าย ${num(list.length)} คำสั่งซื้อไปกำลังแพ็คแล้ว` : `ย้าย ${num(list.length)} คำสั่งซื้อออกจากกำลังแพ็คแล้ว`);
  }
  function toast(msg) { const t = $('whToast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 2600); }
  // พิมพ์เสร็จ: อัปเดตในหน้าทันที (ไม่ต้องรอโหลดใหม่) แล้วค่อยดึงสดเบื้องหลัง
  function afterPrintLocal(action, okIds, plat) {
    const ok = new Set(okIds), shp = LC[keyOf('ship', plat)], col = LC[keyOf('collect', plat)];
    if (action === 'ship' && shp) {
      const moved = shp.rows.filter(o => ok.has(o.id)); shp.rows = shp.rows.filter(o => !ok.has(o.id));
      if (col) { moved.forEach(o => { o.st = 'AWAITING_COLLECTION'; }); col.rows = col.rows.concat(moved); }
      const P = packMap(plat); okIds.forEach(id => delete P[id]);
    }
    [shp, col].forEach(c => { if (!c) return; c.j.printed = c.j.printed || {}; okIds.forEach(id => { c.j.printed[id] = (c.j.printed[id] || 0) + 1; }); });
  }
  function closeDlg() { if (S.printing) return; $('ov').classList.remove('on'); const f = S.afterPrint; S.afterPrint = null; if (f) f(); }

  // ───── สั่งจัดส่ง + พิมพ์ใบปะหน้า ─────
  function b64ToU8(b) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
  async function runPrint(action, ids, plat, shopOf) {   // (2026-11-24) plat / shopOf ส่งมาจากประวัติการพิมพ์ · ไม่ส่ง = ตาม Platform ที่เลือกในหน้า
    if (S.printing || !ids.length) return;
    plat = plat || S.platform; shopOf = shopOf || Object.fromEntries((S.raw || []).map(o => [o.id, o.shop]));
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
        const j = plat === 'shopee' ? await api({ action, order_ids: part, batch_id: batch, shop_of: Object.fromEntries(part.map(id => [id, shopOf[id]])) }, 'wh-shopee')
          : await api({ action, order_ids: part, batch_id: batch, doc: 'label_slip' });   // (2026-11-23) ใบปะหน้า + รายการสินค้าในหน้าเดียว (แบบ Seller Center)
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
    $('dlg').innerHTML = `<h2>${action === 'ship' ? 'จัดส่ง + พิมพ์ใบปะหน้า' : 'พิมพ์ใบปะหน้าซ้ำ'} เสร็จแล้ว</h2><div class="s">${fmtDT(new Date())}</div>
      <div class="wh-kp"><div><small>สำเร็จ</small><b>${num(okAll.length)}</b></div><div><small>ไม่สำเร็จ</small><b>${num(failAll.length)}</b></div></div>
      ${okAll.length ? `<div class="wh-note ok">ใบปะหน้า ${num(okAll.length)} คำสั่งซื้อ (${num(sheets)} แผ่น) เปิดในแท็บใหม่แล้ว ให้สั่งพิมพ์จากแท็บนั้น${sheets > okAll.length ? `<br>มี ${num(sheets - okAll.length)} แผ่นเป็นรายการสินค้าต่อ (ออเดอร์ที่มีสินค้า 3 รายการขึ้นไป) แผ่นนั้นมีเลขคำสั่งซื้อกำกับ ให้แปะคู่กับใบปะหน้าของออเดอร์เดียวกัน` : ''}${url ? ` · <a href="${url}" target="_blank" style="color:inherit">เปิดอีกครั้ง</a>` : ''}</div>` : ''}
      ${failAll.length ? `<div class="wh-note err"><b>คำสั่งซื้อที่ไม่สำเร็จ</b><br>${failAll.map(f => `${esc(f.id)} — ${esc(f.error || '')}`).join('<br>')}</div>` : ''}
      <div class="wh-act"><button class="wh-btn pri" id="doneBtn" type="button">ปิด</button></div>`;
    // (2026-11-24 แก้บั๊ก) ปิดกล่องผลการพิมพ์ด้วยวิธีไหนก็ตาม (ปุ่มปิด / คลิกพื้นหลัง) ต้องล้างที่เลือก + ดึงข้อมูลใหม่เสมอ
    //   เดิมคลิกพื้นหลังแล้วข้ามขั้นนี้ → ตัวเลข "พิมพ์แล้ว" ยังเป็นของเก่า (ยังไม่พิมพ์) และคำสั่งซื้อยังถูกเลือกค้างไว้ → น้องพิมพ์ซ้ำ
    S.afterPrint = () => {
      S.sel.clear(); delete SC.d;
      afterPrintLocal(action, okAll.map(r => String(r.id)), plat);
      if (action === 'ship') Auth.rpc('wh_pack_remove', { p_platform: plat, p_ids: okAll.map(r => String(r.id)) }).catch(() => {});
      if (S.view === 'print') { if (plat === S.platform) showTab(); setTimeout(() => loadAll(true), 4000); } else loadHistory();   // ดึงสดเบื้องหลัง (ไม่บังหน้าจอ)
    };
    $('doneBtn').onclick = closeDlg;
  }

  // ───── สรุปการจัดส่ง ─────
  const SC = {};   // ผลสรุปล่าสุด { d: วันที่, j, got }
  // (2026-11-26) ตารางสรุป 2 มุมมอง: ตามช่องทาง (ช่องทาง → ขนส่ง) / ตามขนส่ง (ขนส่ง → ช่องทาง) · ตัวเลขชุดเดียวกัน ยอดรวมเท่ากัน
  //   ตามขนส่ง: ชื่อขนส่งเดียวกันข้าม Platform รวมเป็นแถวเดียว (ตัดคำว่า Thailand ท้ายชื่อ เช่น Flash Express Thailand = Flash Express)
  const carKey = c => String(c || 'ไม่ระบุ').replace(/\s*thailand\s*$/i, '').trim().toLowerCase();
  function drawSummary() {
    const chans = SC.chans || [], byCar = SC.by === 'car', tri = v => ({ w: v.wait_collect || 0, p: v.picked || 0, x: v.cancelled || 0 }), tot = r => r.w + r.p + r.x;
    let A = 0, B = 0, X = 0, W = 0, html = '';
    const groups = [];
    if (!byCar) chans.forEach(ch => groups.push({ name: ch.name, rows: Object.entries(ch.carriers || {}).map(([c, v]) => [c, tri(v)]) }));
    else {
      const m = new Map();
      chans.forEach(ch => Object.entries(ch.carriers || {}).forEach(([c, v]) => { const k = carKey(c); const g = m.get(k) || { name: c, rows: [] }; if (c.length < g.name.length) g.name = c; g.rows.push([ch.name, tri(v)]); m.set(k, g); }));
      groups.push(...m.values());
    }
    groups.forEach(g => { g.rows.sort((a, b) => tot(b[1]) - tot(a[1])); g.t = g.rows.reduce((m, [, v]) => ({ w: m.w + v.w, p: m.p + v.p, x: m.x + v.x }), { w: 0, p: 0, x: 0 }); });
    if (byCar) groups.sort((a, b) => tot(b.t) - tot(a.t));
    groups.forEach(g => {
      A += g.t.w; B += g.t.p; X += g.t.x;
      html += `<tr class="wh-ch"><td class="l">${esc(g.name)}</td><td>${num(g.t.w)}</td><td>${num(g.t.p)}</td><td>${num(g.t.x)}</td><td>${num(tot(g.t))}</td></tr>`
        + g.rows.map(([c, v]) => `<tr><td class="l ci">${esc(c)}</td><td>${num(v.w)}</td><td>${num(v.p)}</td><td>${num(v.x)}</td><td>${num(tot(v))}</td></tr>`).join('');
    });
    chans.forEach(ch => { W += ch.wait || 0; });
    $('sumBody').innerHTML = html;
    $('sumFoot').innerHTML = `<tr><td class="l">${byCar ? 'รวมทุกขนส่ง' : 'รวมทุกช่องทาง'}</td><td>${num(A)}</td><td>${num(B)}</td><td>${num(X)}</td><td>${num(A + B + X)}</td></tr>`;
    $('sumTh').textContent = byCar ? 'บริษัทขนส่ง / ช่องทาง' : 'ช่องทาง / บริษัทขนส่ง';
    $('sumTtl').textContent = byCar ? 'คำสั่งซื้อที่พิมพ์ใบปะหน้า แยกตามบริษัทขนส่งและช่องทาง' : 'คำสั่งซื้อที่พิมพ์ใบปะหน้า แยกตามช่องทางและบริษัทขนส่ง';
    document.querySelectorAll('#sumBy button').forEach(b => b.classList.toggle('on', b.dataset.v === (byCar ? 'car' : 'ch')));
    return { A, B, X, W };
  }
  async function loadSummary(force) {
    const day = $('sumDate').value;
    if (force !== true && (SC.pend === day || (SC.d === day && Date.now() - SC.got < FRESH))) return;   // ผลเดิมยังแสดงอยู่ / กำลังโหลดวันเดียวกันอยู่ (โหลดล่วงหน้า) ไม่ต้องดึงซ้ำ
    const my = SC.seq = (SC.seq || 0) + 1; SC.pend = day;
    $('stSum').textContent = 'กำลังโหลด…'; $('stSum').classList.remove('bad');
    try {
      const d0 = Math.floor(new Date(day + 'T00:00:00').getTime() / 1000);
      // (2026-11-24) ทุกช่องทาง: TikTok (wh-labels) + Shopee 2 ร้าน (wh-shopee) โหลดพร้อมกัน · Shopee โหลดไม่ได้ = ยังแสดง TikTok แล้วแจ้งที่ปุ่มสถานะ
      const [j, js] = await Promise.all([api({ action: 'summary', day_start: d0, sc: true }), api({ action: 'summary', day_start: d0 }, 'wh-shopee').catch(e => ({ error: e.message }))]);
      if (my !== SC.seq) return; SC.pend = null;
      Object.assign(SC, { d: day, j, js, got: Date.now() });
      // ยอดตามที่พิมพ์: รวมที่ถูกยกเลิกทีหลัง ให้ตรงกับจำนวนที่น้องพิมพ์จริง — แยก รอเข้ารับ / ขนส่งรับแล้ว / ยกเลิกหลังพิมพ์ · แต่ละช่องทางแยกตามขนส่ง
      SC.chans = [{ name: 'TikTok', carriers: j.carriers, wait: j.wait_ship }].concat((js.shops || []).map(x => ({ name: 'Shopee ' + (SHOPNAME[x.shop] || x.shop), carriers: x.carriers, wait: x.wait_ship })));
      const { A, B, X, W } = drawSummary();
      $('sumEmpty').style.display = js.error ? 'block' : 'none'; $('sumEmpty').textContent = js.error ? 'Shopee โหลดไม่ได้: ' + js.error : '';
      $('sP').textContent = num(A + B + X); $('sA').textContent = num(A); $('sB').textContent = num(B); $('sD').textContent = num(X); $('sC').textContent = num(W);
      $('stSum').textContent = js.error ? '1 alert' : 'Updated ' + fmtT(new Date(j.at || Date.now())); $('stSum').classList.toggle('bad', !!js.error);
    } catch (e) { if (my !== SC.seq) return; SC.pend = null; $('stSum').textContent = '1 alert'; $('stSum').classList.add('bad'); $('sumBody').innerHTML = ''; $('sumFoot').innerHTML = ''; $('sumEmpty').style.display = 'block'; $('sumEmpty').textContent = 'โหลดข้อมูลไม่ได้: ' + e.message; }
  }

  // ───── สต็อกวันนี้ (2026-11-23 ทดลองเทียบกับชีทตัดสต็อก · ยังไม่ใช้ตัดสต็อกจริง) ─────
  // ออกตามที่พิมพ์ = คำสั่งซื้อที่กดจัดส่งวันนั้น (wh-labels outday ชุดเดียวกับหน้าสรุป) แตกชุดเป็น SKU · ชีท = inventory_movements คลัง TikTok ประเภท sold วันเดียวกัน
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
    if (force !== true && (STK.pend === day || (STK.d === day && Date.now() - STK.got < FRESH))) return;
    const my = ++STK.seq; STK.pend = day; $('stStk').textContent = 'กำลังโหลด…'; $('stStk').classList.remove('bad');   // กดค้นหาซ้ำระหว่างโหลด = ใช้ผลของครั้งล่าสุด
    try {
      const d0 = Math.floor(new Date(day + 'T00:00:00').getTime() / 1000);
      const [j, sh] = await Promise.all([api({ action: 'outday', day_start: d0 }), sheetSold(day)]);
      if (my !== STK.seq) return; STK.pend = null;
      S.names = { ...S.names, ...(j.names || {}) };
      const m = {}, k = { on: 0, oq: 0, cn: 0, cq: 0, sq: 0 }, row = c => (m[c] ||= { out: 0, cx: 0, sh: 0 });
      (j.orders || []).map(derive).forEach(o => { const cx = o.st === 'CANCELLED'; k.on++; k.oq += o.qty; if (cx) { k.cn++; k.cq += o.qty; } for (const c in o.parts) { row(c).out += o.parts[c]; if (cx) row(c).cx += o.parts[c]; } });
      for (const c in sh) { row(c).sh += sh[c]; k.sq += sh[c]; }
      const hasSheet = Object.keys(sh).length > 0, rows = Object.keys(m).sort().map(c => [c, m[c]]);
      Object.assign(STK, { d: day, got: Date.now(), k, hasSheet, page: 1, rows });   // (2026-11-24) เรียงตาม SKU A–Z
      renderStock(); $('stStk').textContent = 'Updated ' + fmtT(new Date());
    } catch (e) {
      if (my !== STK.seq) return; STK.pend = null;
      $('stStk').textContent = '1 alert'; $('stStk').classList.add('bad'); STK.rows = []; $('stkBody').innerHTML = ''; $('stkFoot').innerHTML = '';
      $('stkEmpty').style.display = 'block'; $('stkEmpty').textContent = 'โหลดข้อมูลไม่ได้: ' + e.message;
    }
  }
  function renderStock() {
    const { rows, k, hasSheet } = STK, size = 50, sgn = v => (v > 0 ? '+' : '') + num(v);
    $('kOut').textContent = num(k.oq); $('kOutS').textContent = `${num(k.on)} คำสั่งซื้อ`;
    $('kCx').textContent = num(k.cq); $('kCxS').textContent = `${num(k.cn)} คำสั่งซื้อ · รอรับคืนเข้าคลัง`;
    $('kSh').textContent = hasSheet ? num(k.sq) : '—'; $('kShS').textContent = hasSheet ? 'คลัง TikTok · Sold' : 'ยังไม่มีข้อมูลของวันที่เลือกในชีท';
    const bad = rows.filter(([, r]) => r.out !== r.sh).length, df = k.oq - k.sq;
    $('kDf').innerHTML = hasSheet ? (df ? `<span style="color:var(--bad)">${sgn(df)}</span>` : '0') : '—'; $('kDfS').textContent = hasSheet ? (bad ? `${num(bad)} SKU ไม่ตรงกัน` : 'ตรงกันทุก SKU') : '';
    const pages = Math.max(1, Math.ceil(rows.length / size)); if (STK.page > pages) STK.page = pages;
    $('stkBody').innerHTML = rows.slice((STK.page - 1) * size, STK.page * size).map(([c, r]) => { const d = r.out - r.sh;
      return `<tr><td class="l"><b>${esc(c)}</b></td><td class="l">${esc(S.names[c] || '—')}</td><td>${num(r.out)}</td><td>${r.cx ? num(r.cx) : ''}</td><td class="sh">${num(r.sh)}</td><td class="sh">${d ? `<b style="color:var(--bad)">${sgn(d)}</b>` : ''}</td></tr>`; }).join('');
    $('stkFoot').innerHTML = rows.length ? `<tr><td class="l" colspan="2">รวม</td><td>${num(k.oq)}</td><td>${num(k.cq)}</td><td class="sh">${num(k.sq)}</td><td class="sh">${df ? sgn(df) : ''}</td></tr>` : '';
    $('stkTbl').classList.toggle('nosh', !hasSheet);   // ยังไม่มีชีทของวันนั้น: ซ่อนคอลัมน์ชีท / ต่าง (การ์ดบนบอกแล้วว่ายังไม่มี)
    $('stkEmpty').style.display = rows.length ? 'none' : 'block'; $('stkEmpty').textContent = 'ไม่มีสินค้าออกในวันที่เลือก';
    $('stkPgInfo').textContent = rows.length ? `แสดง ${num((STK.page - 1) * size + 1)}–${num(Math.min(STK.page * size, rows.length))} จาก ${num(rows.length)} SKU` : '';
    $('stkPgBtns').innerHTML = pages > 1 ? `<button class="wh-btn sm" data-p="-1" ${STK.page <= 1 ? 'disabled' : ''}>‹ ก่อนหน้า</button><span>หน้า ${STK.page} / ${pages}</span><button class="wh-btn sm" data-p="1" ${STK.page >= pages ? 'disabled' : ''}>ถัดไป ›</button>` : '';
  }

  // ───── ประวัติการพิมพ์ ─────
  let HIS = [];
  async function loadHistory() {
    $('stHis').textContent = 'กำลังโหลด…'; $('stHis').classList.remove('bad');
    try {
      const j = await api({ action: 'history' }); HIS = j.batches || [];
      $('hisBody').innerHTML = HIS.map((b, i) => `<tr><td>${fmtDT(new Date(b.at))}</td><td>${b.platform === 'shopee' ? 'Shopee ' + [...new Set(Object.values(b.shop_of || {}).map(x => SHOPNAME[x]))].join(' + ') : 'TikTok'}</td><td class="l">${esc(b.by || '—')}</td><td>${num(b.ship)}</td><td>${num(b.reprint)}</td><td>${b.fail ? `<span class="pc2" title="${esc((b.fails || []).map(f => f.id + ' — ' + (f.error || '')).join('\n'))}">${num(b.fail)}</span>` : '0'}</td><td style="white-space:nowrap">${b.order_ids.length ? `<button class="wh-btn sm" data-i="${i}" data-a="all" type="button">พิมพ์ซ้ำทั้งรอบ</button> <button class="wh-btn sm" data-i="${i}" data-a="pick" type="button">เลือกบางรายการ</button>` : ''}</td></tr>`).join('');
      $('hisEmpty').style.display = HIS.length ? 'none' : 'block'; $('hisEmpty').textContent = 'ยังไม่มีประวัติการพิมพ์';
      $('stHis').textContent = 'Updated ' + fmtT(new Date());
    } catch (e) { $('stHis').textContent = '1 alert'; $('stHis').classList.add('bad'); $('hisBody').innerHTML = ''; $('hisEmpty').style.display = 'block'; $('hisEmpty').textContent = 'โหลดข้อมูลไม่ได้: ' + e.message; }
  }

  // (2026-11-26) พิมพ์ซ้ำ: เลือกเฉพาะบางเลขคำสั่งซื้อในรอบนั้น (ค้นเลขได้ · ติ๊กทั้งหมดได้)
  function openReprintPick(h) {
    const ids = [...new Set(h.order_ids)], pick = new Set();
    const plat = h.platform === 'shopee' ? 'Shopee ' + [...new Set(Object.values(h.shop_of || {}).map(x => SHOPNAME[x]))].join(' + ') : 'TikTok';
    $('dlg').innerHTML = `<h2>พิมพ์ซ้ำ เลือกบางรายการ</h2><div class="s">รอบที่พิมพ์ ${fmtDT(new Date(h.at))} · ${esc(plat)} · ${num(ids.length)} คำสั่งซื้อ</div>
      <div class="rp-top"><label style="display:flex;align-items:center;gap:6px;cursor:pointer"><input type="checkbox" id="rpAll"> เลือกทั้งหมด</label><input type="text" id="rpQ" placeholder="ค้นเลขคำสั่งซื้อ…"><span id="rpN" style="color:var(--text2)">เลือก 0 รายการ</span></div>
      <div class="rp-list" id="rpList">${ids.map(id => `<label data-id="${esc(id)}"><input type="checkbox" value="${esc(id)}"> ${esc(id)}</label>`).join('')}</div>
      <div class="wh-note">พิมพ์ซ้ำได้เฉพาะคำสั่งซื้อที่ขนส่งยังไม่มารับ — ที่ขนส่งรับไปแล้วจะขึ้นเป็น ไม่สำเร็จ พร้อมเหตุผล</div>
      <div class="wh-act"><button class="wh-btn" id="rpClose" type="button">ยกเลิก</button><button class="wh-btn pri" id="rpGo" type="button" disabled>พิมพ์ซ้ำที่เลือก</button></div>`;
    const sync = () => { $('rpN').textContent = `เลือก ${num(pick.size)} รายการ`; $('rpGo').disabled = !pick.size; $('rpGo').textContent = pick.size ? `พิมพ์ซ้ำที่เลือก (${num(pick.size)})` : 'พิมพ์ซ้ำที่เลือก';
      const vis = [...document.querySelectorAll('#rpList label')].filter(l => l.style.display !== 'none'); $('rpAll').checked = vis.length > 0 && vis.every(l => pick.has(l.dataset.id)); };
    $('rpList').onchange = e => { const c = e.target; if (c.type !== 'checkbox') return; c.checked ? pick.add(c.value) : pick.delete(c.value); sync(); };
    $('rpAll').onchange = e => { document.querySelectorAll('#rpList label').forEach(l => { if (l.style.display === 'none') return; const c = l.querySelector('input'); c.checked = e.target.checked; e.target.checked ? pick.add(c.value) : pick.delete(c.value); }); sync(); };
    $('rpQ').oninput = e => { const q = e.target.value.trim(); document.querySelectorAll('#rpList label').forEach(l => { l.style.display = !q || l.dataset.id.includes(q) ? '' : 'none'; }); sync(); };
    $('rpClose').onclick = closeDlg;
    $('rpGo').onclick = () => { const sel = ids.filter(id => pick.has(id)); if (sel.length) runPrint('reprint', sel, h.platform, h.shop_of); };
    $('ov').classList.add('on');
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
    $('fRound').onclick = e => { const b = e.target.closest('button'); if (!b) return; setRound(b.dataset.v); if (b.dataset.v !== 'c') { $('searchBtn').classList.remove('dirty'); S.sel.clear(); fillOptions(); applyFilters(); } };   // (2026-11-24) รอบ = กรองในหน้าทันที ไม่ดึงใหม่ · กำหนดเอง = ตั้งเวลาแล้วกดค้นหา
    ['fFrom', 'fTo'].forEach(id => $(id).addEventListener('input', () => { S.round = 'c'; [...$('fRound').children].forEach(b => b.classList.toggle('on', b.dataset.v === 'c')); dirty(); }));
    renderPrf(); drawPlat();
    document.addEventListener('click', e => {   // เปิด / ปิด / เลือก dropdown แบบเว็บ (ตะกร้า / การพิมพ์ / Platform) — กรองทันที ไม่ดึงใหม่
      const sel = e.target.closest('.wh-sel');
      document.querySelectorAll('.wh-sel.is-open').forEach(x => { if (x !== sel) x.classList.remove('is-open'); });
      if (!sel) return;
      const it = e.target.closest('.ui-dd-item');
      if (it) { sel.classList.remove('is-open'); sel._pick && sel._pick(it.dataset.v); return; }
      if (e.target.closest('.ui-dd-btn')) sel.classList.toggle('is-open');
    });
    $('fPatBtn').onclick = () => { const dd = $('fPat'), on = !dd.classList.contains('on'); dd.classList.toggle('on', on); if (on) { $('fPatQ').value = ''; renderPat(); $('fPatQ').focus(); } };
    $('fPatQ').oninput = renderPat;
    $('fPatQ').onkeydown = e => { if (e.key === 'Escape') $('fPat').classList.remove('on'); if (e.key === 'Enter') { const b = $('fPatList').querySelector('button[data-p]:not([data-p="__q"])') || $('fPatList').querySelector('button'); if (b) b.click(); } };
    $('fPatList').onclick = e => {
      const b = e.target.closest('button[data-p]'); if (!b) return; e.stopPropagation();   // กล่องเปิดค้างไว้ เลือกต่อได้
      const p = b.dataset.p, q = normQ($('fPatQ').value);
      if (p === '') S.pat.clear();
      else if (p === '__q') { const hit = S.pats.filter(([x]) => normQ(x).includes(q)).map(([x]) => x), all = hit.every(x => S.pat.has(x)); hit.forEach(x => all ? S.pat.delete(x) : S.pat.add(x)); }
      else S.pat.has(p) ? S.pat.delete(p) : S.pat.add(p);
      S.page = 1; fillOptions(); applyFilters();
    };
    document.addEventListener('click', e => { if (!e.target.closest('#fPat')) $('fPat').classList.remove('on'); });
    $('roundCfgBtn').onclick = () => { $('cut1').value = cuts.c1; $('cut2').value = cuts.c2; $('roundCfg').classList.toggle('on'); };
    $('cutSave').onclick = () => { if ($('cut1').value) cuts.c1 = $('cut1').value; if ($('cut2').value) cuts.c2 = $('cut2').value; try { localStorage.setItem('wh_cuts', JSON.stringify(cuts)); } catch (e) {} $('roundCfg').classList.remove('on'); if (S.round !== 'c') setRound(S.round); };
    $('searchBtn').onclick = () => { S.sel.clear(); fillOptions(); applyFilters(); loadAll(true); };   // ใช้ช่วงเวลาที่ตั้ง + ดึงข้อมูลสดจากแพลตฟอร์ม
    $('tabs').onclick = e => { const b = e.target.closest('button'); if (!b || b.dataset.tab === S.tab) return; S.tab = b.dataset.tab; S.sel.clear(); showTab(); if (!fresh(S.tab)) loadAll(); };   // สลับแท็บ = ขึ้นทันทีจากที่โหลดไว้ · เก่าเกิน 5 นาที อัปเดตเบื้องหลัง
    $('tbody').onclick = e => { const rm = e.target.closest('button[data-rm]'); if (rm) { const o = S.rows.find(x => x.id === rm.dataset.rm); if (o) packMove(false, [o]); return; } const tr = e.target.closest('tr.pick'); if (!tr) return; const id = tr.dataset.id; if (S.sel.has(id)) S.sel.delete(id); else S.sel.add(id); render(); };
    $('thead').onclick = e => { if (e.target.id !== 'chkAll') return; const can = S.rows.filter(o => !o.gone); if (S.sel.size === can.length) S.sel.clear(); else S.sel = new Set(can.map(o => o.id)); render(); };
    $('pgBtns').onclick = e => { const b = e.target.closest('button'); if (b) { S.page += Number(b.dataset.p); render(); window.scrollTo(0, 0); } };
    $('pgSize').onclick = e => { const b = e.target.closest('button'); if (!b) return; S.size = Number(b.dataset.v); try { localStorage.setItem('wh_page_size', String(S.size)); } catch (e2) {} S.page = 1; render(); };
    $('pickBtn').onclick = openPick; $('goBtn').onclick = () => S.tab === 'ship' ? packMove(true, selected()) : openPick();
    $('backBtn').onclick = () => packMove(false, selected());
    // (2026-11-24) อัปเดตเบื้องหลังทุก 5 นาทีเมื่อเปิดหน้านี้อยู่ (ไม่บังหน้าจอ · ไม่ทำระหว่างพิมพ์ / เปิดกล่อง)
    setInterval(() => { if (document.visibilityState === 'visible' && S.view === 'print' && !S.busy && !S.printing && !$('ov').classList.contains('on') && TABS.some(t => !fresh(t))) loadAll(); }, 60000);
    $('ov').onclick = e => { if (e.target === $('ov')) closeDlg(); };
    $('sumBtn').onclick = () => loadSummary(true);
    $('stkBtn').onclick = () => loadStock(true);
    $('stkPgBtns').onclick = e => { const b = e.target.closest('button[data-p]'); if (b) { STK.page += Number(b.dataset.p); renderStock(); } };
    $('hisBody').onclick = e => { const b = e.target.closest('button'); if (b) { const h = HIS[Number(b.dataset.i)]; if (b.dataset.a === 'pick') openReprintPick(h); else runPrint('reprint', h.order_ids, h.platform, h.shop_of); } };
    $('sumBy').onclick = e => { const b = e.target.closest('button'); if (b) { SC.by = b.dataset.v; if (SC.chans) drawSummary(); } };
  }

  async function start() {
    try { if (localStorage.getItem('deesay_theme') === 'light') document.body.classList.add('light-theme'); } catch (e) {}
    const perm = await Auth.require('warehouse');   // (2026-11-23) ผู้ดูแลระบบ หรือคนที่ติ๊กช่อง Warehouse ในหน้าตั้งค่า
    S.admin = !!perm.is_admin;
    // มีแค่สิทธิ์ Warehouse (ไม่มีหน้าอื่น) = ซ่อนปุ่มกลับหน้าหลัก เพราะหน้าหลักจะพากลับมาที่นี่อยู่ดี
    if (!(perm.is_admin || perm.pages.some(x => x !== 'warehouse') || perm.can_upload || perm.can_admin || perm.can_edit_kpi)) document.querySelector('.wh-side .home')?.remove();
    $('whoMail').textContent = perm.email || '';
    bind();
    const now = new Date(), ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; $('sumDate').value = ymd(now);
    $('stkDate').value = ymd(now); $('stkDate').max = ymd(now); $('stkDate').min = ymd(new Date(now.getTime() - 3 * 86400000));   // ยอดตามที่พิมพ์ดูย้อนหลังได้ 3 วัน
    ['fFrom', 'fTo', 'cut1', 'cut2'].forEach(id => tpEnhance($(id)));   // (2026-11-24) ช่องวันที่ + เวลาแบบเว็บ
    setRound('all');   // (2026-11-23) เปิดหน้า = ทั้งหมด ไม่กรองเวลา
    render(); loadAll().then(() => { loadSummary(); loadStock(); });   // (2026-11-24) โหลดหน้าสรุป / สต็อกล่วงหน้า กดเข้าแล้วขึ้นทันที
  }
  start();
})();
