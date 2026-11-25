// ระบบทดสอบหน้าเว็บ (จำลองการใช้งานจริง) — Deesay-v2
// ล็อกอินด้วยบัญชีทดสอบ → เปิดทุกหน้าในเมนู → รอโหลด → กดค้นหา → กดตัวเลขที่กดได้ (แผงที่มาของตัวเลข) → ตรวจ:
//   1) error ในหน้า / โหลดข้อมูลไม่สำเร็จ      2) หน้าเด้ง (Layout Shift) ตอนโหลดและหลังกดค้นหา
//   3) ข้อความล้นหรือถูกตัดในการ์ด / ตาราง     4) ตารางที่มีแถวรวม: ผลรวมแต่ละคอลัมน์ = แถวรวม
//   5) กดตัวเลขแล้วแผงเปิดได้และมีข้อมูล       6) เวลาโหลดแต่ละหน้า + ภาพหน้าจอทุกหน้า (ไว้ตรวจหน้าตา)
// ผลอยู่ที่ tests/qa-out/ (README.md + report.json + shots/*.png) → GitHub Actions เก็บไว้ที่ branch qa-report
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
// (2026-11-04) เกณฑ์ตรวจทุกข้ออยู่ใน checks.js ไฟล์เดียว — เครื่องมือทำรูปในแชท (tests/preview) ใช้ไฟล์เดียวกัน ผลตรวจจึงเป็นชุดเดียวกัน
const CHECKS = fileURLToPath(new URL('./checks.js', import.meta.url));
const SITE = (process.env.SITE_URL || 'https://gonmeg.github.io/Deesay-v2/').replace(/\/?$/, '/');
const OUT = 'qa-out'; fs.mkdirSync(`${OUT}/shots`, { recursive: true });
const SAFE_CLICK_MAX = 6;                       // กดตัวเลขต่อหน้าไม่เกินกี่จุด
const CLS_WARN = 0.03, CLS_FAIL = 0.1;          // เกณฑ์หน้าเด้ง (Cumulative Layout Shift) เข้มกว่ามาตรฐาน Google (0.1) — เด้งนิดเดียวก็ขึ้นเตือน
const DANGER = /ลบ|บันทึก|อนุมัติ|ไม่อนุมัติ|ส่ง|อัปโหลด|ออกจากระบบ|ยกเลิก|ใช้งานลิงก์|รีเฟรชข้อมูล|ตั้งเป้า|แก้ไข|เพิ่ม/;

test('จำลองการใช้งานทุกหน้า', async ({ browser }) => {
  test.skip(!process.env.QA_EMAIL || !process.env.QA_PASSWORD, 'ยังไม่ได้ตั้ง QA_EMAIL / QA_PASSWORD ใน GitHub Secrets');
  const ctx = await browser.newContext();
  await ctx.addInitScript({ path: CHECKS });   // เริ่มวัดหน้าเด้ง + ดักกล่อง alert ตั้งแต่ก่อนหน้าเว็บโหลด
  const page = await ctx.newPage();
  // (2026-11-02) ประกาศก่อนใช้ครั้งแรก (เดิมประกาศไว้หลังจุดที่เรียก → ระบบทดสอบหยุดหลังล็อกอิน ไม่มีรายงานออก)
  // ปิดกล่อง "มีอะไรใหม่" ที่เด้งทับหน้า (ไม่งั้นกดตัวเลขไม่ได้ ทดสอบผิดเป็นกดแล้วไม่มีแผงเปิด)
  const dismissWhatsNew = () => page.evaluate(() => { const o = document.getElementById('wnOverlay'); if (o && o.style.display === 'flex' && window.closeWhatsNew) window.closeWhatsNew(); }).catch(() => {});
  let errs = [], ext = [];   // ext = ไฟล์จากเว็บภายนอกที่โหลดไม่ได้ (เช่น รูปปกจาก Facebook / TikTok ที่ลิงก์หมดอายุ)
  page.on('response', r => { if (r.status() >= 400 && !/supabase\.co/.test(r.url())) { let h = ''; try { h = new URL(r.url()).host; } catch (e) {} ext.push(`${r.status()} ${r.request().resourceType()} ${h}`); } });
  page.on('pageerror', e => errs.push('JS: ' + e.message.slice(0, 160) + ' @ ' + String(e.stack || '').split('\n').slice(1, 2).join('').trim().replace(/^at\s+/, '').slice(0, 120)));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|ERR_BLOCKED_BY_CLIENT/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  page.on('response', async r => { if (r.status() >= 400 && /supabase\.co/.test(r.url())) { let body = ''; try { body = (await r.text()).replace(/\s+/g, ' ').slice(0, 160); } catch (e) {} let post = ''; try { post = (r.request().postData() || '').slice(0, 120); } catch (e) {}
    errs.push(`โหลดข้อมูลไม่สำเร็จ ${r.status()} ${r.url().split('?')[0].split('/').slice(-2).join('/')} · ${body}${post ? ' · ส่งไป ' + post : ''}`); } });

  // ล็อกอิน
  await page.goto(SITE + 'login.html');
  await page.fill('#email', process.env.QA_EMAIL); await page.fill('#password', process.env.QA_PASSWORD);
  await page.click('#btnGo');
  await page.waitForURL(u => !/login\.html/.test(String(u)), { timeout: 45000 });

  // รายการหน้า: อ่านจากเมนูซ้ายจริง (หน้าที่บัญชีทดสอบมีสิทธิ์)
  await page.goto(SITE + 'dashboard.html'); await page.waitForSelector('.sb .nav-item[data-page]', { timeout: 45000 });
  await page.waitForTimeout(3000); await dismissWhatsNew();
  const menu = await page.$$eval('.sb .nav-item[data-page]', els => els.map(e => ({ id: e.dataset.page, name: (e.dataset.label || e.textContent).trim() })));
  // (2026-11-04) โครงหน้าเว็บ: ทุกหน้าต้องอยู่ในกรอบเนื้อหา และไม่มีกล่องหลุดนอกหน้า (กล่องหลุด = ขึ้นทุกหน้า และหน้าที่หลุดกรอบจะเด้งตอนโหลด)
  const structIssues = await page.evaluate(() => window.__deesayQA.structure());
  const targets = [...menu.map(m => ({ ...m, url: `dashboard.html?page=${m.id}`, dash: true })),
    { id: 'upload', name: 'อัปโหลดข้อมูล', url: 'upload.html' }, { id: 'admin', name: 'ตั้งค่า (Admin)', url: 'admin.html' }, { id: 'health', name: 'สถานะระบบข้อมูล', url: 'health.html' }];

  const waitIdle = async () => {
    try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch (e) {}
    for (let i = 0; i < 40; i++) {   // รอข้อความ "กำลังโหลด" หายจากส่วนที่มองเห็น (ไม่เกิน 20 วิ)
      const busy = await page.evaluate(() => [...document.querySelectorAll('.page.active, main, body')].slice(0, 1).some(r => /กำลังโหลด|กำลังคำนวณ/.test(r.innerText || '')));
      if (!busy) break; await page.waitForTimeout(500);
    }
    await page.waitForTimeout(1200);
    await dismissWhatsNew();
  };
  const scope = t => t.dash ? '.page.active' : 'main, body';

  // (2026-11-17) รอให้หน้าหลังล็อกอินโหลดข้อมูลเบื้องหลังเสร็จก่อนเริ่มไล่ทีละหน้า — ไม่งั้นการดึงที่ค้างอยู่ถูกตัดตอนเปลี่ยนหน้า
  // แล้วขึ้น "Failed to fetch" ไปโผล่เป็น error ของหน้าแรก (ไม่ใช่ปัญหาของหน้าเว็บจริง)
  await waitIdle();
  const report = [];
  report.push({ id: 'structure', name: 'โครงหน้าเว็บ (dashboard.html)', issues: structIssues, warn: [], errors: [] });
  for (const t of targets) {
    errs = []; ext = []; const r = { id: t.id, name: t.name, issues: [], warn: [] };
    const t0 = Date.now();
    try {
      await page.goto(SITE + t.url); await waitIdle();
      r.load_s = +((Date.now() - t0) / 1000).toFixed(1);
      r.cls_load = await page.evaluate(() => window.__deesayQA.cls());
      r.cls_src = await page.evaluate(() => window.__deesayQA.shiftSources ? window.__deesayQA.shiftSources() : []);

      // (2026-11-04) ฟอนต์ + คำต้องห้าม: ทุกข้อความที่เห็นต้องเป็น Sarabun · ห้าม ฿ · ใช้ Ads ไม่ใช่ "แอด" (แอดมิน ได้) · ตัวเลขในการ์ด/ตารางไม่ย่อเป็น k / M
      const tx = await page.evaluate(sel => window.__deesayQA.text(sel), scope(t));
      if (tx.fonts.length) r.issues.push('ฟอนต์ไม่ใช่ Sarabun: ' + tx.fonts.join(' · '));
      if (tx.words.length) r.warn.push('คำต้องห้าม (฿ / แอด): ' + tx.words.join(' · '));
      if (tx.abbr.length) r.warn.push('ตัวเลขย่อ k / M: ' + tx.abbr.join(' · '));
      if (tx.dialogs.length) r.issues.push('ใช้กล่อง alert ของเบราว์เซอร์: ' + tx.dialogs.join(' · '));

      // กดค้นหา (ถ้ามี) แล้ววัดหน้าเด้งเฉพาะหลังกด
      const search = page.locator('#topSearchBtn:visible');
      if (t.dash && await search.count()) {
        await page.evaluate(() => window.__deesayQA.resetCls());
        await search.first().click({ force: true, timeout: 5000 }).catch(() => page.evaluate(() => window.applyFilters && window.applyFilters()));
        await waitIdle();
        r.cls_search = await page.evaluate(() => window.__deesayQA.cls());
      }

      // ข้อความล้น / ถูกตัด (ตัวเลขในการ์ด ป้าย หัวตาราง)
      r.overflow = await page.evaluate(sel => window.__deesayQA.overflow(sel), scope(t));
      r.wide = await page.evaluate(sel => window.__deesayQA.wide(sel), scope(t));
      r.align = await page.evaluate(sel => window.__deesayQA.align(sel), scope(t));   // (2026-11-04) หัวคอลัมน์กับตัวเลขชิดคนละด้าน

      // ตารางที่มีแถวรวม: ผลรวมแต่ละคอลัมน์ต้องเท่าแถวรวม (ข้ามตารางที่แบ่งหน้า และคอลัมน์ % / อัตรา / ROAS / เฉลี่ย)
      r.totals = await page.evaluate(sel => window.__deesayQA.totals(sel), scope(t));
      r.kpis = await page.evaluate(sel => (window.__deesayQA.kpis ? window.__deesayQA.kpis(sel) : []), scope(t));

      // กดตัวเลขที่กดได้ (ขีดเส้นใต้จุด) → แผงที่มาต้องเปิดและมีข้อมูล → ปิด
      const cands = await page.evaluate(sel => window.__deesayQA.clickables(sel), scope(t));
      r.clicks = { found: cands.length, ok: 0, fail: [] };
      for (const id of cands.slice(0, SAFE_CLICK_MAX)) {
        const el = page.locator(`[data-qa-click="${id}"]`).first();
        const label = ((await el.innerText().catch(() => '')) || '').trim().slice(0, 30);
        if (DANGER.test(label)) continue;
        const e0 = errs.length, before = await page.evaluate(() => (document.querySelector('.page.active') || {}).id || ''), c0 = Date.now();
        await el.click({ timeout: 5000 }).catch(() => {});
        // (2026-11-25) รอแผงโหลดเสร็จ (ไม่เกิน 8 วิ) แทนรอตายตัว 1.8 วิ — แผงที่ดึงข้อมูลนานกว่านั้นเคยถูกนับเป็น "แผงเปิดแต่ไม่มีข้อมูล" ทั้งที่ข้อมูลมาครบ
        //   แผงที่ใช้เวลาเกิน 3 วิ = คำเตือน "แผงที่มาเปิดช้า" (ยังเห็นว่าช้า แต่ไม่นับเป็นหน้าเสีย)
        let open = -1;
        for (let k = 0; k < 16; k++) {
          await page.waitForTimeout(500);
          open = await page.evaluate(b => window.__deesayQA.panelOpen(b), before);
          const loading = await page.evaluate(() => { const b = document.getElementById('trBody'); return !!(b && b.offsetParent && /กำลังโหลด/.test(b.innerText || '')); });
          if ((open > 20 && !loading) || (open < 0 && k >= 3)) break;
        }
        const took = (Date.now() - c0) / 1000;
        if (open > 20 && took > 3) r.warn.push(`แผงที่มาเปิดช้า ${took.toFixed(1)} วิ: ${label || '(ไม่มีข้อความ)'}`);
        if (open > 20 && errs.length === e0) r.clicks.ok++; else r.clicks.fail.push(`${label || '(ไม่มีข้อความ)'}: ${open < 0 ? 'กดแล้วไม่มีแผงเปิด' : open <= 20 ? 'แผงเปิดแต่ไม่มีข้อมูล' : errs.slice(e0).join(' / ')}`);
        await page.keyboard.press('Escape'); await page.waitForTimeout(400);
        await page.evaluate(() => window.__deesayQA.closePanel());
        await page.waitForTimeout(300);
      }

      await page.screenshot({ path: `${OUT}/shots/${t.id}.png`, fullPage: true, timeout: 30000 }).catch(() => page.screenshot({ path: `${OUT}/shots/${t.id}.png` }));
    } catch (e) { r.issues.push('ทดสอบไม่จบ: ' + String(e.message || e).slice(0, 200)); }

    r.errors = [...new Set(errs)].slice(0, 10);
    // (2026-11-17) รูปจากเว็บภายนอกโหลดไม่ได้ = คำเตือน ไม่ใช่หน้าเสีย (หน้าแสดงช่องรูปว่างแทน) · บอกชื่อเว็บไว้ให้ไล่ต่อได้ · ไฟล์ชนิดอื่นยังนับเป็นปัญหาเหมือนเดิม
    if (ext.length) { const u = [...new Set(ext)];
      if (u.every(x => / image /.test(x))) { r.errors = r.errors.filter(e => !/^console: Failed to load resource/.test(e)); r.warn.push('รูปจากภายนอกโหลดไม่ได้: ' + u.slice(0, 4).join(' / ')); }
      else r.errors = r.errors.map(e => (/^console: Failed to load resource/.test(e) ? e + ' · ' + u.slice(0, 4).join(' / ') : e)); }
    if (r.errors.length) r.issues.push(...r.errors);
    if ((r.cls_load || 0) > CLS_FAIL) r.issues.push(`หน้าเด้งตอนโหลด CLS ${r.cls_load}${(r.cls_src || []).length ? ' · กล่องที่ขยับ: ' + r.cls_src.join(' / ') : ''}`); else if ((r.cls_load || 0) > CLS_WARN) r.warn.push(`หน้าเด้งเล็กน้อยตอนโหลด CLS ${r.cls_load}`);
    if ((r.cls_search || 0) > CLS_FAIL) r.issues.push(`หน้าเด้งหลังกดค้นหา CLS ${r.cls_search}`); else if ((r.cls_search || 0) > CLS_WARN) r.warn.push(`หน้าเด้งเล็กน้อยหลังกดค้นหา CLS ${r.cls_search}`);
    (r.totals || []).forEach(x => r.issues.push(x));
    (r.clicks?.fail || []).forEach(x => r.issues.push('กดตัวเลข: ' + x));
    if ((r.overflow || []).length) r.warn.push('ข้อความล้นกล่อง: ' + r.overflow.join(' · '));
    if ((r.align || []).length) r.warn.push('คอลัมน์ไม่ตรงแนว: ' + r.align.join(' · '));
    if (r.wide?.page) r.issues.push('ทั้งหน้าเลื่อนซ้ายขวาได้ (มีกล่องกว้างเกินจอ): ' + (r.wide.boxes.join(' · ') || '—'));
    if ((r.load_s || 0) > 15) r.warn.push(`โหลดช้า ${r.load_s} วิ`);
    report.push(r);
  }

  // (2026-11-17) เทียบตัวเลขข้ามหน้า: ตัวเลขเดียวกันต้องเท่ากันทุกหน้า · ต่าง ≤ 2 = ตรง (ปัดเศษ) · ต่าง ≤ 0.5% = ข้อมูลวันนี้เข้าเพิ่มระหว่างทดสอบ (แต่ละหน้าถ่ายห่างกันหลายนาที) · เกินนั้น = คำเตือน
  const kv = (id, label) => { const k = ((report.find(x => x.id === id) || {}).kpis || []).find(x => x[0] === label); const v = k ? parseFloat(String(k[1]).replace(/,/g, '')) : NaN; return isFinite(v) ? v : null; };
  const SAME = [
    ['ยอดขาย TikTok', [['tthub', 'ยอดขาย'], ['ttads', 'ยอดขายจริง TikTok'], ['prtest', 'ยอดขาย TikTok'], ['creatorperf', 'ยอดขายรวม']]],
    ['ค่า Ads TikTok', [['tthub', 'ค่า Ads'], ['ttads', 'ค่า Ads รวม']]],
    ['% ค่า Ads TikTok', [['tthub', '% ค่า Ads'], ['ttads', '% ค่า Ads']]],
    ['ยอดขาย Facebook', [['fbhub', 'ยอดขาย'], ['fbads', 'ยอดขายจริง Facebook']]],
    ['ค่า Ads Facebook', [['fbhub', 'ค่า Ads'], ['fbads', 'ค่า Ads Facebook รวม']]],
    ['% ค่า Ads Facebook', [['fbhub', '% ค่า Ads'], ['fbads', '% ค่า Ads']]],
    ['คนทักจาก Meta', [['fbhub', 'คนทักจาก Meta'], ['fbads', 'ทักแชท']]],
    ['ลูกค้า Facebook', [['fbhub', 'ลูกค้า Facebook'], ['crm', 'ลูกค้า Facebook ทั้งหมด']]],
    ['ยอดขาย Shopee', [['shhub', 'ยอดขาย'], ['shads', 'ยอดขายจริง Shopee']]],
    ['ค่า Ads Shopee', [['shhub', 'ค่า Ads'], ['shads', 'ค่า Ads รวมทุกประเภท']]],
    ['% ค่า Ads Shopee', [['shhub', '% ค่า Ads'], ['shads', '% ค่า Ads']]],
    ['ยอดขายออนไลน์รวม', [['skurev', 'ยอดขาย'], ['adperf', 'ยอดขาย']]],
    ['ยอดสะสมเดือนนี้ (ออนไลน์)', [['home', 'สะสมเดือนนี้'], ['kpi', 'ทำได้ถึงวันนี้']]],
  ];
  const nm = id => (report.find(x => x.id === id) || {}).name || id, cross = { id: 'cross', name: 'เทียบตัวเลขข้ามหน้า', issues: [], warn: [], errors: [], rows: [] };
  for (const [what, list] of SAME) {
    const vals = list.map(([id, l]) => ({ id, v: kv(id, l) })).filter(x => x.v !== null);
    if (vals.length < 2) { cross.rows.push(`| ${what} | — | อ่านตัวเลขได้ไม่ครบ 2 หน้า |`); continue; }
    const mx = Math.max(...vals.map(x => x.v)), mn = Math.min(...vals.map(x => x.v)), d = mx - mn, tol = mx < 1000 ? 0.011 : 2;
    const txt = vals.map(x => `${nm(x.id)} ${x.v.toLocaleString('en-US')}`).join(' · ');
    const res = d <= tol ? 'ตรง' : d / mx <= 0.005 ? `ต่าง ${+d.toFixed(2)} (ข้อมูลเข้าเพิ่มระหว่างทดสอบ)` : `ต่าง ${+d.toFixed(2)}`;
    if (d > tol && d / mx > 0.005) cross.warn.push(`${what} ไม่เท่ากัน: ${txt}`);
    cross.rows.push(`| ${what} | ${res} | ${txt} |`);
  }
  const tk = kv('tthub', 'ยอดขาย'), fb = kv('fbhub', 'ยอดขาย'), sp = kv('shhub', 'ยอดขาย'), lz = kv('lzhub', 'ยอดขาย'), all = kv('skurev', 'ยอดขาย');
  if ([tk, fb, sp, lz, all].every(x => x !== null)) { const sum = tk + fb + sp + lz, d = Math.abs(sum - all);
    cross.rows.push(`| ยอดขาย 4 Platform รวมกัน เทียบ แนวโน้มสินค้า | ${d <= 4 ? 'ตรง' : d / all <= 0.005 ? `ต่าง ${d} (ข้อมูลเข้าเพิ่มระหว่างทดสอบ)` : `ต่าง ${d}`} | รวม 4 หน้า ${sum.toLocaleString('en-US')} · แนวโน้มสินค้า ${all.toLocaleString('en-US')} |`);
    if (d > 4 && d / all > 0.005) cross.warn.push(`ยอดขาย 4 Platform รวมกัน ${sum} ไม่เท่าแนวโน้มสินค้า ${all}`); }
  report.push(cross);

  // รายงาน
  const bad = report.filter(r => r.issues.length), warn = report.filter(r => !r.issues.length && r.warn.length);
  const md = [`# ผลทดสอบหน้าเว็บ — ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`, '',
    `ทดสอบ ${report.length} หน้า · ❌ ต้องแก้ ${bad.length} · ⚠️ ควรดู ${warn.length} · ✅ ผ่าน ${report.length - bad.length - warn.length}`, '',
    '| หน้า | ผล | โหลด (วิ) | เด้งตอนโหลด | เด้งหลังค้นหา | กดตัวเลข | รายละเอียด |', '|---|---|---|---|---|---|---|',
    ...report.map(r => `| ${r.name} | ${r.issues.length ? '❌' : r.warn.length ? '⚠️' : '✅'} | ${r.load_s ?? '—'} | ${r.cls_load ?? '—'} | ${r.cls_search ?? '—'} | ${r.clicks ? `${r.clicks.ok}/${Math.min(r.clicks.found, SAFE_CLICK_MAX)}` : '—'} | ${[...r.issues, ...r.warn].join('<br>').replace(/\|/g, '/') || '—'} |`),
    '', '## เทียบตัวเลขข้ามหน้า', '', '| ตัวเลข | ผล | แต่ละหน้า |', '|---|---|---|', ...cross.rows,
    '', 'ภาพหน้าจอทุกหน้าอยู่ในโฟลเดอร์ shots/'].join('\n');
  fs.writeFileSync(`${OUT}/README.md`, md); fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
  console.log(md);
  expect(bad.map(r => `${r.name}: ${r.issues[0]}`), 'หน้าที่ต้องแก้').toEqual([]);
});
