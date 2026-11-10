// (2026-11-10) เช็คโหมดสว่าง: กล่องกลืนพื้น + ตัวเลข / ตัวหนังสือจาง — ใช้ใน checklist ข้อ 7
(() => {
  const parse = c => { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?/.exec(c || ''); return m ? [+m[1], +m[2], +m[3], m[4] == null ? 1 : +m[4]] : null; };
  const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const bgOf = el => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > .5) return c; } return [255, 255, 255, 1]; };
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 24 && r.height > 18 && s.visibility !== 'hidden' && s.display !== 'none' && r.bottom > 0 && r.top < 4000; };
  const name = el => (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : el.tagName.toLowerCase());
  const out = { boxes: [], text: [] };
  document.querySelectorAll('main *, .main *, .page *, #trPanel *, .tr-panel *, body > div *').forEach(el => {
    if (!vis(el)) return; const s = getComputedStyle(el);
    // กล่อง: มีพื้นของตัวเอง หรือเป็นช่องกรอก · แยกจากพื้นข้างหลังไม่ออก ทั้งพื้นและขอบ
    const own = parse(s.backgroundColor), isInput = /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName) && !/checkbox|radio|range/.test(el.type || '');
    if ((own && own[3] > .5 && parseFloat(s.borderRadius) >= 4) || isInput) {
      const me = own && own[3] > .5 ? own : bgOf(el), parent = bgOf(el.parentElement), bw = parseFloat(s.borderTopWidth) || 0, bc = parse(s.borderTopColor);
      const sepBg = cr(me, parent), sepBd = bw > 0 && bc && bc[3] > .3 ? Math.max(cr(bc, me), cr(bc, parent)) : 1;
      const ps = getComputedStyle(el.parentElement), pBorder = (parseFloat(ps.borderTopWidth) || 0) > 0 || /inset/.test(ps.boxShadow || '');   // ช่องย่อยในแถบที่มีกรอบ (เช่น แถบการ์ด KPI) = ตั้งใจ
      if (el.classList.contains('sup-plan-qty')) return;   // ช่อง Forecast ตั้งใจโปร่งจนกว่าจะชี้
      if (sepBg < 1.10 && sepBd < 1.30 && (isInput || (el.children.length && !pBorder && !(own && sepBg < 1.01 && el.parentElement.closest('[class*=kpi],[class*=strip],[class*=pane],.ui-metrics'))))) out.boxes.push(`${name(el)} (พื้นต่างกัน ${sepBg.toFixed(2)} · ขอบ ${sepBd.toFixed(2)})`);
    }
    // ตัวเลข / ข้อความหลัก: มีข้อความตรง ๆ ตัวใหญ่ ≥ 14px แต่คอนทราสต์ < 3
    const direct = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (direct && el.tagName === 'TH') { const c = parse(s.color); if (c && cr(c, bgOf(el)) < 3.5) out.text.push(`หัวตาราง "${el.textContent.trim().slice(0, 16)}" (${cr(c, bgOf(el)).toFixed(2)})`); }
    if (direct && parseFloat(s.fontSize) >= 14) { const c = parse(s.color); if (c && cr(c, bgOf(el)) < 3) out.text.push(`${name(el)} "${el.textContent.trim().slice(0, 16)}" (${cr(c, bgOf(el)).toFixed(2)})`); }
  });
  out.boxes = [...new Set(out.boxes)].slice(0, 25); out.text = [...new Set(out.text)].slice(0, 25);
  return out;
})()
