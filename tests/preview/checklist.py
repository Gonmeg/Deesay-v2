#!/usr/bin/env python3
"""เช็คลิสต์ 8 ข้อก่อนส่งไฟล์ — Deesay-v2 (ผลแปะในข้อความส่งงานทุกครั้ง)

  1. โค้ดไม่มี error                       5. ไม่มีคำต้องห้าม: ฿ · "แอด" · ตัวย่อ k / M · กล่อง alert ของเบราว์เซอร์
  2. ทุกหน้าอยู่ในกรอบ ไม่มีกล่องหลุด         6. หน้าที่แก้: การ์ด = แถวรวมของตาราง = ผลรวมในกราฟ
  3. ไม่เด้งตอนโหลด / หลังกดค้นหา            7. จอ 1440 / 1920 ทั้งธีมมืดและสว่าง ไม่มีอะไรล้นกล่อง · โหมดสว่างกล่อง / ช่องกรอกไม่กลืนพื้น
  4. ฟอนต์เป็น Sarabun ทุกข้อความที่เห็น        8. ⓘ ทุกอันที่แก้ อ่านเทียบสูตรในโค้ด (คนอ่าน — สคริปต์ลิสต์ให้)

ข้อ 2–7 ใช้เกณฑ์จาก tests/checks.js ชุดเดียวกับระบบทดสอบบน GitHub

ใช้:  python3 tests/preview/checklist.py แผน.local.json
แผน (JSON นอก repo หรือชื่อ *.local.json):
  {"base": "origin/main",                         ← เทียบโค้ดกับ GitHub (ข้อ 1, 5, 8)
   "data": ["/home/claude/fx/mthub.json"],        ← ไฟล์ข้อมูลที่ดึงมา (ดู preview.py)
   "widths": [1440, 1920], "themes": ["dark", "light"],
   "pages": [{"id": "mthub", "name": "ทั้งปี", "pre": "setDatePreset('ytd'); applyFilters()", "js": "applyFilters()",
              "eq": "[['ยอดขาย', การ์ด, แถวรวม, ผลรวมกราฟ]]"}]}   ← name = ชื่อในผลตรวจ · pre = ตั้งช่วง / ห้างก่อน แล้ววัดหน้าเด้งตอน js (กดค้นหาซ้ำ) · eq = ข้อ 6 ตัวเลขที่ต้องเท่ากัน
"""
import json, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import preview as P

CLS_WARN, CLS_FAIL = 0.03, 0.1   # เกณฑ์เดียวกับ qa.spec.mjs


def git(*a): return subprocess.run(['git', '-C', P.REPO, *a], capture_output=True, text=True).stdout


def added_lines(base):
    """บรรทัดที่เพิ่ม / แก้ เทียบกับ GitHub (ไม่นับไฟล์ทดสอบ)"""
    out, f = [], None
    for l in git('diff', '-U0', base, '--', '.', ':(exclude)tests').splitlines():
        if l.startswith('+++ '): f = l[6:]
        elif l.startswith('+') and not l.startswith('+++'): out.append((f, l[1:]))
    for f in git('ls-files', '--others', '--exclude-standard').split():   # ไฟล์ใหม่ทั้งไฟล์
        if not f.startswith('tests/') and f.endswith(('.html', '.js', '.css')):
            out += [(f, l) for l in open(os.path.join(P.REPO, f), encoding='utf-8')]
    return out


def main(plan_file):
    plan = json.load(open(plan_file, encoding='utf-8'))
    base = plan.get('base', 'origin/main'); widths = plan.get('widths', [1440, 1920]); themes = plan.get('themes', ['dark', 'light'])
    data = P.Data(plan.get('data', []))
    R = {i: {'s': '✅', 'n': []} for i in range(1, 9)}
    def bad(i, msg, warn=False):
        if not warn or R[i]['s'] == '✅': R[i]['s'] = '⚠️' if warn else '❌'
        if msg not in R[i]['n']: R[i]['n'].append(msg)

    # ข้อ 1: ไวยากรณ์ทุกไฟล์ (ตัวเดียวกับบน GitHub)
    r = subprocess.run(['node', os.path.join(P.REPO, 'tests', 'syntax-check.mjs')], capture_output=True, text=True)
    if r.returncode: bad(1, (r.stderr or r.stdout).strip()[:300])

    # ข้อ 5 + 8 จากโค้ดที่แก้
    lines = added_lines(base); tips = []
    for f, l in lines:
        if re.search(r'฿|แอด(?!มิน)', re.sub(r'//.*$|<!--.*?-->', '', l)): bad(5, f'{f}: «{l.strip()[:70]}»')
        if re.search(r'(?<![\w.$])(alert|confirm|prompt)\(', l): bad(5, f'{f}: กล่องของเบราว์เซอร์ «{l.strip()[:70]}»')
        tips += [(f, t) for t in re.findall(r'data-tip="([^"]{3,})"', l)]

    # ข้อ 2–7 จากหน้าจริง (ทุกหน้าในแผน × ขนาดจอ × ธีม)
    from playwright.sync_api import sync_playwright
    detail = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for pg_plan in plan.get('pages', []):
            pid = pg_plan['id']
            for th in pg_plan.get('themes', themes):
                for w in pg_plan.get('widths', widths):
                    ctx, pg, errs = P.open_page(b, data, pid, w, th, None, url=pg_plan.get('url'))
                    cls_load = pg.evaluate('() => window.__deesayQA.cls()')
                    if pg_plan.get('pre'): pg.evaluate(f"() => {{ {pg_plan['pre']} }}"); pg.wait_for_timeout(pg_plan.get('after', 2500))   # ตั้งช่วง / ห้างก่อน แล้ววัดหน้าเด้งตอนกดค้นหาซ้ำ (แบบเดียวกับระบบทดสอบบน GitHub)
                    if pg_plan.get('js'): pg.evaluate(f"() => {{ window.__deesayQA.resetCls(); {pg_plan['js']} }}"); pg.wait_for_timeout(pg_plan.get('after', 2500))
                    c = P.check(pg, pg_plan.get('scope', '.page.active' if not pg_plan.get('url') else 'body'))
                    eq = []
                    if pg_plan.get('eq'):
                        try: eq = pg.evaluate(f"() => ({pg_plan['eq']})")
                        except Exception as e: eq = [['eq error', str(e)[:120]]]
                    nm = pg_plan.get('name', pid); key = f'{nm} {w} {th}'; tag = f'{nm} {w}{"" if th == "dark" else " สว่าง"}'
                    detail[key] = dict(cls_load=cls_load, **c, eq=eq, errors=errs[:6])
                    for e in errs: bad(1, f'{tag}: {e[:120]}')
                    for s in c['structure']: bad(2, s)
                    for v, when in ((cls_load, 'ตอนโหลด'), (c['cls'], 'หลังค้นหา')):
                        if v > CLS_FAIL: bad(3, f'{tag} เด้ง{when} {v}')
                        elif v > CLS_WARN: bad(3, f'{tag} เด้งเล็กน้อย{when} {v}', True)
                    for x in c['text']['fonts']: bad(4, f'{nm}: {x}')
                    for x in c['text']['words']: bad(5, f'{nm}: {x}', True)
                    for x in c['text']['abbr']: bad(5, f'{nm} ตัวย่อ: {x}', True)
                    for x in c['text']['dialogs']: bad(5, f'{nm}: {x}')
                    for x in c['totals']: bad(6, f'{nm}: {x}')
                    for row in eq or []:
                        vals = [v for v in row[1:] if isinstance(v, (int, float))]
                        if len(vals) < 2 or max(vals) - min(vals) > 0.5: bad(6, f'{nm} {row[0]}: ' + ' / '.join(f'{v:,.2f}' if isinstance(v, (int, float)) else str(v) for v in row[1:]))
                    if c['wide']['page']: bad(7, f'{tag}: ทั้งหน้าเลื่อนซ้ายขวาได้ {" · ".join(c["wide"]["boxes"])}')
                    for x in c['overflow']: bad(7, f'{tag}: ข้อความล้น «{x}»')
                    for x in c.get('align', []): bad(7, f'{tag}: {x}')
                    for x in c['wide']['tables']: bad(7, f'{tag}: ตารางต้องเลื่อนในกล่อง {x}', True)
                    if th == 'light':   # (2026-11-10) โหมดสว่าง: กล่อง / ช่องกรอกกลืนพื้น · ตัวเลขจาง (contrast.js)
                        try:
                            cc = pg.evaluate(open(os.path.join(os.path.dirname(__file__), 'contrast.js'), encoding='utf-8').read())
                            for x in cc['boxes']: bad(7, f'{tag}: กล่องกลืนพื้น {x}')
                            for x in cc['text']: bad(7, f'{tag}: ตัวหนังสือจาง {x}', True)
                        except Exception as e: bad(7, f'{tag}: เช็คสีไม่ได้ {str(e)[:80]}', True)
                    ctx.close()
            if pg_plan.get('eq') and R[6]['s'] == '✅': R[6]['n'].append(f"{pg_plan.get('name', pid)}: ตรงกันทุกจอ")
        b.close()
    if not plan.get('pages'): R[6]['n'].append('งานนี้ไม่ได้เปิดหน้า'); R[7]['n'].append('งานนี้ไม่ได้เปิดหน้า')
    if tips: R[8]['s'] = '👀'; R[8]['n'].append(f'ⓘ ที่แก้ {len(tips)} จุด — อ่านเทียบสูตรแล้วเขียนผลเอง')
    else: R[8]['n'].append('งานนี้ไม่ได้แก้ข้อความ ⓘ')

    names = {1: 'โค้ดไม่มี error', 2: 'ทุกหน้าอยู่ในกรอบ ไม่มีกล่องหลุด', 3: 'ไม่เด้งตอนโหลด / หลังค้นหา', 4: 'ฟอนต์ Sarabun ทุกข้อความ',
             5: 'ไม่มีคำต้องห้าม (฿ / แอด / k M / alert)', 6: 'การ์ด = แถวรวม = กราฟ', 7: f'จอ {" / ".join(map(str, widths))} {" + ".join({"dark": "มืด", "light": "สว่าง"}.get(t, t) for t in themes)} ไม่ล้น · สว่างไม่กลืนพื้น', 8: 'คำอธิบาย ⓘ ตรงสูตร'}
    md = ['| ข้อ | ผล | หมายเหตุ |', '|---|---|---|'] + [f'| {i}. {names[i]} | {R[i]["s"]} | {" · ".join(R[i]["n"][:4]) or "—"} |' for i in range(1, 9)]
    os.makedirs(P.OUT, exist_ok=True)
    json.dump({'items': R, 'tips': tips, 'pages': detail}, open(os.path.join(P.OUT, 'checklist.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('\n'.join(md))
    if tips: print('\nⓘ ที่ต้องอ่าน:\n' + '\n'.join(f'- {f}: {t[:160]}' for f, t in tips[:40]))


if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    main(sys.argv[1])
