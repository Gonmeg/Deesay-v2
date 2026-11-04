#!/usr/bin/env bash
# เตรียมเครื่องมือทำรูป (รันครั้งแรกของแต่ละแชท ~20 วิ) — ของที่โหลดเก็บใน tests/preview/.cache (ไม่ commit)
#   Chart.js 4.4.1 (เวอร์ชันเดียวกับหน้าเว็บ) · ฟอนต์ Sarabun 5 น้ำหนัก · ตรวจว่าเบราว์เซอร์ทดสอบ (Chromium) ใช้ได้
set -e
cd "$(dirname "$0")" && mkdir -p .cache/fonts && cd .cache
[ -f package.json ] || echo '{"private":true}' > package.json
[ -f node_modules/chart.js/dist/chart.umd.js ] || npm i --prefix "$PWD" --silent --no-audit --no-fund chart.js@4.4.1 >/dev/null
: > fonts.css
for w in Light:300 Regular:400 Medium:500 SemiBold:600 Bold:700; do
  n=${w%%:*}; v=${w##*:}
  [ -s fonts/Sarabun-$n.ttf ] || curl -sfL -o fonts/Sarabun-$n.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/sarabun/Sarabun-$n.ttf"
  echo "@font-face{font-family:'Sarabun';font-weight:$v;font-display:block;src:url(/tests/preview/.cache/fonts/Sarabun-$n.ttf);}" >> fonts.css
done
python3 -c "from playwright.sync_api import sync_playwright as s; p=s().start(); b=p.chromium.launch(); print('✓ พร้อม: Chromium', b.version, '· Chart.js 4.4.1 · Sarabun'); b.close(); p.stop()" \
  || { echo '✗ ยังไม่มี Playwright: pip install playwright --break-system-packages && python3 -m playwright install chromium'; exit 1; }
