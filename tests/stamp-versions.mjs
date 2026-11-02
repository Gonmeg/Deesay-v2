// (2026-11-02) ใส่เลขเวอร์ชันไฟล์ (?v=) ให้อัตโนมัติตอน deploy — ไม่ต้องเปลี่ยนเลขเองทุกครั้งที่แก้ไฟล์
// หลักการ: ทุกที่ที่เรียก ไฟล์.js?v=… / ไฟล์.css?v=… (ไฟล์ที่อยู่ใน repo) → เปลี่ยนเลขเป็นรหัสจากเนื้อไฟล์ (8 ตัว)
//   ไฟล์ไม่เปลี่ยน = เลขเดิม (เบราว์เซอร์ใช้ของที่จำไว้ได้) · ไฟล์เปลี่ยน = เลขใหม่ (เบราว์เซอร์โหลดใหม่ทันที)
// ใช้: node tests/stamp-versions.mjs [โฟลเดอร์]  (ค่าเริ่มต้น = โฟลเดอร์ปัจจุบัน) · แก้ไฟล์ในโฟลเดอร์นั้น
import fs from 'fs'; import path from 'path'; import crypto from 'crypto';
const dir = process.argv[2] || '.';
const files = fs.readdirSync(dir).filter(f => /\.(html|js)$/.test(f));
const RE = /\b([A-Za-z0-9_-]+\.(?:js|css))\?v=[0-9A-Za-z_-]+/g;
// รหัสคิดจากเนื้อไฟล์โดยไม่นับเลข ?v= ที่อยู่ในไฟล์ (กันวนไม่จบเมื่อไฟล์อ้างถึงตัวเอง เช่นคอมเมนต์วิธีใช้ใน ui.js)
const hashOf = f => crypto.createHash('sha1').update(fs.readFileSync(path.join(dir, f), 'utf8').replace(RE, '$1?v=')).digest('hex').slice(0, 8);
let total = 0;
for (let round = 1; round <= 6; round++) {   // ไฟล์ .js ที่เรียกไฟล์อื่นก็ถูกแก้เลข → วนจนเลขนิ่ง
  const H = {}; let changed = 0;
  for (const f of files) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    const out = src.replace(RE, (m, name) => fs.existsSync(path.join(dir, name)) ? `${name}?v=${H[name] ??= hashOf(name)}` : m);
    if (out !== src) { fs.writeFileSync(path.join(dir, f), out); changed++; }
  }
  total += changed; if (!changed) { console.log(`✓ เลขเวอร์ชันนิ่งแล้ว (รอบ ${round}) · แก้ ${total} ครั้ง`); process.exit(0); }
}
console.log('⚠️ เลขเวอร์ชันยังไม่นิ่งหลัง 6 รอบ (มีไฟล์เรียกกันวน) — ใช้เลขล่าสุด'); process.exit(0);
