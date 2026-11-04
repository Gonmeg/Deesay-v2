#!/usr/bin/env python3
"""เครื่องมือทำรูปหน้าจริง + ตรวจหน้า (ใช้ในแชท claude.ai) — Deesay-v2

เปิดไฟล์หน้าเว็บจาก repo นี้ในเบราว์เซอร์จำลอง (Chromium) โดยไม่ต่อ Supabase จริง:
  • ล็อกอิน = บัญชีทดสอบ (fake-supabase.js)
  • ข้อมูล = ไฟล์ JSON ที่ดึงสรุปมาจาก Supabase เฉพาะรอบนั้น (เก็บนอก repo ห้าม commit)
  • ตรวจหน้า = tests/checks.js ชุดเดียวกับระบบทดสอบบน GitHub

ใช้:
  bash tests/preview/setup.sh                                   # ครั้งแรกของแต่ละแชท
  python3 tests/preview/preview.py calls modtrade --js "setDatePreset('thisMonth'); applyFilters()"
      → บอกว่าหน้านี้เรียกข้อมูลอะไรบ้าง (ชื่อ RPC + ค่าที่ส่ง) จะได้ดึงจาก Supabase เฉพาะที่ใช้
  python3 tests/preview/preview.py shot modtrade --data /home/claude/fx/modtrade.json --themes dark,light
      → รูปเต็มหน้าที่จอ 1440 และ 1920 + ผลตรวจ (JSON) · รูปอยู่ที่ tests/preview/out/

ไฟล์ข้อมูล (JSON):
  {"rpc":   {"ชื่อ_rpc": ผลลัพธ์ | {"cases": [{"args": {บางค่าที่ต้องตรง}, "data": ผลลัพธ์}], "default": ผลลัพธ์}},
   "table": {"ชื่อตาราง/view": [แถว, ...]},
   "perm":  {สิทธิ์ผู้ใช้ (ไม่ใส่ = admin ทุกหน้า)}}
  ผลลัพธ์ที่เป็นรายการ แบ่งตอบทีละ 1,000 แถวเหมือน Supabase จริง · RPC / ตารางที่ไม่มีในไฟล์ = ตอบว่าง ([])
"""
import argparse, json, os, re, socket, socketserver, sys, threading, http.server, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = os.path.join(HERE, '.cache')
OUT = os.path.join(HERE, 'out')
CHECKS_JS = os.path.join(REPO, 'tests', 'checks.js')
THEME_KEY = 'deesay_theme'
PERM = dict(logged_in=True, is_active=True, is_admin=True, pages=['*'], email='preview@example.com', name='Preview', can_upload=True, can_admin=True)


# ---------- ข้อมูลจำลอง ----------
class Data:
    def __init__(self, files=()):
        self.rpc, self.table, self.perm, self.log = {}, {}, dict(PERM), []
        for f in files or ():
            d = json.load(open(f, encoding='utf-8'))
            self.rpc.update(d.get('rpc', {})); self.table.update(d.get('table', {})); self.perm.update(d.get('perm', {}))

    @staticmethod
    def _page(v, qs, headers):
        if not isinstance(v, list): return v
        off, lim = int((qs.get('offset') or [0])[0]), qs.get('limit')
        rng = headers.get('range') or headers.get('Range')
        if rng and re.match(r'^\d+-\d+$', rng): a, b = map(int, rng.split('-')); off, lim = a, [b - a + 1]
        n = min(int(lim[0]) if lim else 1000, 1000)
        return v[off:off + n]

    def answer(self, url, body, headers):
        p = urllib.parse.urlparse(url); qs = urllib.parse.parse_qs(p.query); path = p.path.split('/rest/v1/', 1)[-1]
        if path.startswith('rpc/'):
            name = path[4:]
            try: args = json.loads(body or '{}')
            except Exception: args = {}
            self.log.append(('rpc', name, args, dict((k, v[0]) for k, v in qs.items())))
            if name == 'my_permissions': return self.perm
            v = self.rpc.get(name, [])
            if isinstance(v, dict) and 'cases' in v:
                hit = next((c['data'] for c in v['cases'] if all(str(args.get(k)) == str(x) for k, x in c.get('args', {}).items())), None)
                v = hit if hit is not None else v.get('default', [])
            return self._page(v, qs, headers)
        self.log.append(('table', path, {k: v[0] for k, v in qs.items() if k not in ('select', 'offset', 'limit')}, {}))
        return self._page(self.table.get(path, []), qs, headers)


# ---------- เซิร์ฟเวอร์ไฟล์ repo + ตัวดักคำขอ ----------
def _serve():
    s = socket.socket(); s.bind(('127.0.0.1', 0)); port = s.getsockname()[1]; s.close()
    class H(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k): super().__init__(*a, directory=REPO, **k)
        def log_message(self, *a): pass
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', port), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return port

PORT = None
def _read(p):
    try: return open(p, encoding='utf-8').read()
    except FileNotFoundError: sys.exit(f'ไม่พบ {p} — รัน bash tests/preview/setup.sh ก่อน')

def make_router(data):
    chart = _read(os.path.join(CACHE, 'node_modules', 'chart.js', 'dist', 'chart.umd.js'))
    fonts = _read(os.path.join(CACHE, 'fonts.css')); fake = _read(os.path.join(HERE, 'fake-supabase.js'))
    def route(r):
        u = r.request.url
        if u.startswith(f'http://127.0.0.1:{PORT}'): return r.continue_()
        if 'chart.umd' in u or '/chart.js' in u: return r.fulfill(body=chart, content_type='application/javascript')
        if 'fonts.googleapis.com' in u: return r.fulfill(body=fonts, content_type='text/css')
        if 'supabase-js' in u or 'supabase.js' in u: return r.fulfill(body=fake, content_type='application/javascript')
        if 'supabase.co' in u:
            h = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*', 'content-range': '*/*'}
            if r.request.method == 'OPTIONS': return r.fulfill(status=204, headers=h)
            ans = data.answer(u, r.request.post_data, r.request.headers)
            return r.fulfill(body=json.dumps(ans, ensure_ascii=False), content_type='application/json', headers=h)
        if u.endswith('.woff2') or u.endswith('.ttf'): return r.continue_()
        if u.endswith('.js') or '.js?' in u: return r.fulfill(body='', content_type='application/javascript')   # ไลบรารีภายนอกอื่น (xlsx ฯลฯ)
        return r.fulfill(status=204, body='')
    return route


# ---------- เปิดหน้า ----------
def open_page(browser, data, page_id, width=1440, theme='dark', js=None, wait=3500, after=2500, height=1000, url=None):
    """เปิดหน้า → รอโหลด → รัน js (เช่นตั้งช่วงวันที่) → คืน (ctx, page, errors)"""
    global PORT
    if PORT is None: PORT = _serve()
    ctx = browser.new_context(viewport={'width': width, 'height': height}, timezone_id='Asia/Bangkok', locale='th-TH')
    ctx.add_init_script(path=CHECKS_JS)
    ctx.add_init_script(f"try{{localStorage.setItem('{THEME_KEY}','{theme}')}}catch(e){{}}")
    ctx.route('**/*', make_router(data))
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append('JS: ' + str(e)[:200]))
    pg.on('console', lambda m: errs.append('console: ' + m.text[:160]) if m.type == 'error' and 'favicon' not in m.text else None)
    target = url or f'dashboard.html?page={page_id}'
    pg.goto(f'http://127.0.0.1:{PORT}/{target}'); pg.wait_for_timeout(wait)
    pg.evaluate("() => { const o = document.getElementById('wnOverlay'); if (o && o.style.display === 'flex' && window.closeWhatsNew) window.closeWhatsNew(); }")
    if js:
        pg.evaluate(f"() => {{ window.__deesayQA.resetCls(); {js} }}"); pg.wait_for_timeout(after)
    return ctx, pg, errs


def check(pg, scope='.page.active'):
    return pg.evaluate("s => window.__deesayQA.all(s)", scope)


def shot(page_id, data, widths=(1440, 1920), themes=('dark',), js=None, name=None, scope='.page.active', url=None, eq=None, after=2500):
    """รูปเต็มหน้าทุกขนาดจอ × ธีม + ผลตรวจ · eq = js ที่คืน [[ชื่อ, ค่า1, ค่า2, ...]] ตัวเลขที่ต้องเท่ากัน (การ์ด = แถวรวม = กราฟ)"""
    from playwright.sync_api import sync_playwright
    os.makedirs(OUT, exist_ok=True); res = {}
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for th in themes:
            for w in widths:
                ctx, pg, errs = open_page(b, data, page_id, w, th, js, url=url, after=after)
                r = check(pg, scope); r['errors'] = errs[:8]
                if eq: r['eq'] = pg.evaluate(f"() => {{ {eq} }}") if 'return' in eq else pg.evaluate(f"() => ({eq})")
                fn = os.path.join(OUT, f'{name or page_id}_{w}_{th}.png'); pg.screenshot(path=fn, full_page=True); r['file'] = fn
                res[f'{w}_{th}'] = r; ctx.close()
        b.close()
    return res


def calls(page_id, data, js=None, url=None):
    """หน้านี้เรียกข้อมูลอะไรบ้าง (ไว้ดึงจาก Supabase เฉพาะที่ใช้)"""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch(); ctx, pg, errs = open_page(b, data, page_id, js=js, url=url); ctx.close(); b.close()
    seen, out = set(), []
    for kind, name, args, qs in data.log:
        k = json.dumps([kind, name, args], ensure_ascii=False, sort_keys=True)
        if k in seen or name == 'my_permissions': continue
        seen.add(k); out.append({'kind': kind, 'name': name, 'args': args, 'has_data': name in (data.rpc if kind == 'rpc' else data.table)})
    return out


def crop(src, dst, y0=0, y1=None, scale=0.6):
    """ตัดรูปเฉพาะช่วงที่แก้ + ย่อ ไว้ดูเองโดยไม่กินที่ (รูปที่ส่งให้เมฆใช้ไฟล์เต็ม)"""
    from PIL import Image
    im = Image.open(src); w, h = im.size; y1 = min(h, y1 or h)
    im.crop((0, y0, w, y1)).resize((int(w * scale), int((y1 - y0) * scale))).save(dst); return dst


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description='เครื่องมือทำรูปหน้าจริง Deesay-v2')
    ap.add_argument('cmd', choices=['shot', 'calls'])
    ap.add_argument('page', help='id หน้า เช่น modtrade, skutrend, mkttracking')
    ap.add_argument('--data', action='append', default=[], help='ไฟล์ข้อมูล JSON (ใส่ได้หลายไฟล์)')
    ap.add_argument('--js', help='คำสั่งหลังเปิดหน้า เช่น "setDatePreset(\'thisMonth\'); applyFilters()"')
    ap.add_argument('--widths', default='1440,1920'); ap.add_argument('--themes', default='dark')
    ap.add_argument('--url', help='เปิดไฟล์อื่นแทน dashboard.html เช่น admin.html'); ap.add_argument('--name')
    ap.add_argument('--after', type=int, default=2500, help='รอหลังรัน --js กี่มิลลิวินาที (กราฟที่ข้อมูลมาช้าให้รอนานขึ้น)')
    ap.add_argument('--eq', help='js ที่คืน [[ชื่อ, ค่า1, ค่า2...]] ตัวเลขที่ต้องเท่ากัน')
    a = ap.parse_args(); d = Data(a.data)
    if a.cmd == 'calls': r = calls(a.page, d, a.js, a.url)
    else: r = shot(a.page, d, tuple(int(x) for x in a.widths.split(',')), tuple(a.themes.split(',')), a.js, a.name, url=a.url, eq=a.eq, after=a.after)
    print(json.dumps(r, ensure_ascii=False, indent=1))
