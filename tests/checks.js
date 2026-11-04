// ชุดตรวจหน้าเว็บกลาง (ใช้ร่วมกัน 2 ที่ ให้ผลตรวจเป็นชุดเดียวกัน)
//   1) ระบบทดสอบบน GitHub: tests/qa.spec.mjs (ล็อกอินจริง ข้อมูลจริง ทุกหน้า)
//   2) เครื่องมือทำรูปในแชท: tests/preview/preview.py (ข้อมูลสรุปที่ดึงมาเฉพาะรอบ ไม่เก็บใน repo)
// วิธีใช้: ใส่ไฟล์นี้เป็น init script ของเบราว์เซอร์ (โหลดก่อนหน้าเว็บ) → เริ่มวัดหน้าเด้งทันที แล้วเรียก window.__deesayQA.<ตรวจ>(selector)
// ไม่มีข้อมูลบริษัทในไฟล์นี้ · แก้เกณฑ์ที่นี่ที่เดียว ทั้ง 2 ที่ใช้ตามทันที
(() => {
  if (window.__deesayQA) return;
  // ข้อ 3: หน้าเด้ง (Cumulative Layout Shift) — สะสมตั้งแต่เปิดหน้า · resetCls() ก่อนกดค้นหา แล้วอ่าน cls() หลังโหลดเสร็จ
  window.__cls = 0; window.__shifts = [];
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(e.value); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  // ข้อ 5: กล่อง alert / confirm ของเบราว์เซอร์ — ห้ามใช้ (ต้องใช้กล่องของเว็บเอง) · นับทุกครั้งที่หน้าเรียก
  window.__nativeDialogs = [];
  for (const k of ['alert', 'confirm', 'prompt']) { const f = window[k]; window[k] = function (m) { window.__nativeDialogs.push(k + ': ' + String(m || '').slice(0, 60)); return k === 'confirm' ? false : k === 'prompt' ? null : undefined; }; window[k].__orig = f; }

  const own = e => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const uniq = (a, n = 5) => [...new Set(a)].slice(0, n);
  const rootOf = sel => (sel && document.querySelector(sel)) || document.body;
  const num = s => { const m = String(s || '').replace(/,/g, '').match(/^\s*(-?\d+(?:\.\d+)?)/); return m ? +m[1] : null; };

  window.__deesayQA = {
    cls: () => +(window.__cls || 0).toFixed(3),
    resetCls: () => { window.__cls = 0; window.__shifts = []; },

    // ข้อ 2: โครงหน้าเว็บ — ทุกหน้าต้องอยู่ในกรอบเนื้อหา ไม่มีกล่องหลุดนอกหน้า (กล่องหลุด = ขึ้นทุกหน้า)
    structure() {
      const c = document.querySelector('.content'); if (!c) return ['ไม่พบกรอบเนื้อหา (.content)'];
      const out = [...document.querySelectorAll('.page')].filter(p => p.parentElement !== c).map(p => 'หน้าหลุดออกนอกกรอบเนื้อหา: ' + p.id);
      [...c.children].filter(e => !e.classList.contains('page') && !['errorBanner', 'dgBanner'].includes(e.id)).forEach(e => out.push('มีกล่องหลุดนอกหน้า (ขึ้นทุกหน้า): ' + (e.id || e.className || e.tagName)));
      return out;
    },

    // ข้อ 4–5: ทุกข้อความที่เห็นต้องเป็น Sarabun · ห้าม ฿ · ใช้ Ads ไม่ใช่ "แอด" (แอดมิน ได้) · ตัวเลขในการ์ด / ตารางไม่ย่อเป็น k / M · ห้ามกล่อง alert ของเบราว์เซอร์
    text(sel) {
      const root = rootOf(sel);
      const vis = [...root.querySelectorAll('*')].filter(e => e.offsetParent !== null && !e.closest('svg') && own(e));
      return {
        fonts: uniq(vis.filter(e => !/^["']?Sarabun/.test(getComputedStyle(e).fontFamily)).map(e => `«${own(e).slice(0, 20)}» ${getComputedStyle(e).fontFamily.split(',')[0]}`)),
        words: uniq(vis.filter(e => /฿|แอด(?!มิน)/.test(own(e))).map(e => `«${own(e).slice(0, 30)}»`)),
        abbr: uniq([...root.querySelectorAll('.ui-metric-v, .kpi-value, td')].filter(e => e.offsetParent !== null && /\d\s?[kKM]\b/.test(e.textContent) && !/ml\b/i.test(e.textContent)).map(e => `«${e.textContent.trim().slice(0, 24)}»`)),
        dialogs: uniq(window.__nativeDialogs || []),
      };
    },

    // ข้อ 7: ข้อความล้น / ถูกตัด (ตัวเลขในการ์ด ป้าย หัวตาราง ปุ่ม)
    overflow(sel) {
      const root = rootOf(sel), out = [];
      root.querySelectorAll('.kpi-val, .kpi-label, .ui-metric *, .hm-metric *, [class*="card"] [class*="v"], th, .ui-badge, button').forEach(el => {
        if (!el.offsetParent || el.children.length > 2) return;
        if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) out.push((el.innerText || '').trim().slice(0, 40));
      });
      return uniq(out, 8);
    },

    // ข้อ 7: ล้นจอด้านข้าง — ทั้งหน้าเลื่อนซ้ายขวาได้ (ต้องแก้) / ตารางกว้างกว่ากล่องจนต้องเลื่อนในกล่อง (ควรดู)
    wide(sel) {
      const root = rootOf(sel), vw = document.documentElement.clientWidth;
      const page = document.documentElement.scrollWidth > vw + 1;
      const boxes = uniq([...root.querySelectorAll('*')].filter(e => { if (!e.offsetParent || e.closest('.table-wrap, [style*="overflow"]')) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.right > vw + 1 && getComputedStyle(e).position !== 'fixed'; })
        .map(e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/)[0] : '')));
      const tables = uniq([...root.querySelectorAll('table')].filter(t => { if (!t.offsetParent) return false; const w = t.parentElement; return w && t.scrollWidth > w.clientWidth + 1; })
        .map(t => `${t.id || 'ตาราง'} ${t.scrollWidth}>${t.parentElement.clientWidth}`), 8);
      return { page, boxes, tables };
    },

    // ข้อ 7: หัวคอลัมน์กับตัวเลขในคอลัมน์ต้องชิดด้านเดียวกัน (หัวชิดขวา แต่ตัวเลขชิดซ้าย = ดูเหมือนคอลัมน์เลื่อน)
    align(sel) {
      const root = rootOf(sel), out = [];
      const side = el => { const a = getComputedStyle(el).textAlign; return a === 'right' || a === 'end' ? 'R' : a === 'center' || a === '-webkit-center' ? 'C' : 'L'; };
      (root.matches('table') ? [root] : [...root.querySelectorAll('table')]).forEach((tb, ti) => {
        if (!tb.offsetParent) return;
        const hr = tb.querySelector('thead tr:last-child'); if (!hr) return;
        const heads = [...hr.cells]; if (heads.some(c => (c.colSpan || 1) > 1)) return;
        const row = [...tb.querySelectorAll('tbody tr')].find(r => r.offsetParent && r.cells.length === heads.length && [...r.cells].every(c => (c.colSpan || 1) === 1)); if (!row) return;
        heads.forEach((h, i) => {
          const c = row.cells[i], hs = side(h), cs = side(c), txt = (c.innerText || '').trim();
          if (hs === 'C' || cs === 'C' || hs === cs || !/^-?[\d,.]+/.test(txt)) return;   // เช็คเฉพาะช่องตัวเลข
          out.push(`ตาราง ${tb.id || ti + 1} คอลัมน์ "${(h.innerText || '').trim().slice(0, 20)}": หัว${hs === 'R' ? 'ชิดขวา' : 'ชิดซ้าย'} ตัวเลข${cs === 'R' ? 'ชิดขวา' : 'ชิดซ้าย'}`);
        });
      });
      return uniq(out, 8);
    },

    // ข้อ 6: ตารางที่มีแถวรวม — ผลรวมแต่ละคอลัมน์ต้องเท่าแถวรวม
    //   ข้ามตารางที่แบ่งหน้า (แถวรวมนับทุกหน้า แต่จอเห็นหน้าเดียว) และคอลัมน์ % / อัตรา / ROAS / เฉลี่ย
    totals(sel) {
      const root = rootOf(sel), out = [];
      root.querySelectorAll('table').forEach((tb, ti) => {
        if (!tb.offsetParent) return;
        const host = tb.closest('section, .card, .sec') || tb.parentElement?.parentElement || tb;
        if (/ถัดไป|ต่อหน้า/.test(host.innerText || '') || [...tb.querySelectorAll('tbody tr')].some(x => x.style.display === 'none')) return;
        const rows = [...tb.querySelectorAll('tbody tr')].filter(x => x.offsetParent);
        const tot = rows.find(x => /\b(tot|total|pl-total|sum)\b/.test(x.className) || /^\s*รวม/.test(x.cells[0]?.innerText || '')); if (!tot) return;
        const body = rows.filter(x => x !== tot && !/\b(child|sub|pl-ch|op-sub|detail)\b/.test(x.className));
        const grid = tr => { const o = []; [...tr.cells].forEach(c => { o.push(c.innerText); for (let k = 1; k < (c.colSpan || 1); k++) o.push(null); }); return o; };   // ช่องที่รวมคอลัมน์ (colspan)
        const hr = tb.querySelector('thead tr:last-child'), heads = hr ? grid(hr).map(h => (h || '').trim()) : [];
        const T = grid(tot), Bs = body.map(grid);
        T.forEach((cv, i) => {
          if (i === 0 || cv == null || /%|อัตรา|ROAS|ROI|เฉลี่ย|ราคา|ต่อ|MER|CPA|CPM|CPC|CPO|CTR|สัดส่วน|AOV|\//i.test(heads[i] || '')) return;
          const tv = num(cv); if (tv === null) return;
          const vals = Bs.map(r => num(r[i])); if (vals.some(v => v === null) || !vals.length) return;
          const s = vals.reduce((a, b) => a + b, 0);
          if (Math.abs(s - tv) > Math.max(1.5, Math.abs(tv) * 0.002)) out.push(`ตาราง ${tb.id || ti + 1} คอลัมน์ "${heads[i] || i}": ผลรวม ${Math.round(s).toLocaleString()} ≠ แถวรวม ${Math.round(tv).toLocaleString()}`);
        });
      });
      return out.slice(0, 8);
    },

    // ตัวเลขที่กดดูที่มาได้ (เส้นประใต้ + เมาส์รูปมือ) → ใส่ป้าย data-qa-click ให้ตัวทดสอบกดทีละตัว
    clickables(sel) {
      const root = rootOf(sel), out = [];
      root.querySelectorAll('td, span, b, div, a').forEach((el, i) => {
        if (!el.offsetParent || el.children.length > 1) return;
        const cs = getComputedStyle(el);
        if ((cs.textDecorationStyle === 'dotted' || cs.borderBottomStyle === 'dotted') && cs.cursor === 'pointer') { el.setAttribute('data-qa-click', String(i)); out.push(String(i)); }
      });
      return out;
    },
    // หลังกดตัวเลข: แผงเปิดไหม มีข้อความกี่ตัวอักษร (-1 = ไม่มีแผงเปิด · 999 = พาไปหน้าอื่น)
    panelOpen(beforePageId) {
      const b = document.getElementById('trBody'); if (b && b.offsetParent) return (b.innerText || '').trim().length;
      const pop = [...document.querySelectorAll('[role="dialog"], .modal, [class*="drawer"], [class*="popover"], [class*="pop-"], .ui-pop, .fbe-pop')].find(x => x.offsetParent && (x.innerText || '').trim().length > 20);
      if (pop) return (pop.innerText || '').trim().length;
      const act = document.querySelector('.page.active'); if (act && act.id !== beforePageId) return 999;
      return -1;
    },
    closePanel() { const x = document.querySelector('.tr-x, .tr-close, [onclick*="trClose"]'); if (x && x.offsetParent) x.click(); },

    // รวมทุกข้อที่ตรวจได้ในครั้งเดียว (เครื่องมือทำรูปใช้)
    all(sel) { return { cls: this.cls(), structure: this.structure(), text: this.text(sel), overflow: this.overflow(sel), wide: this.wide(sel), align: this.align(sel), totals: this.totals(sel) }; },
  };
})();
