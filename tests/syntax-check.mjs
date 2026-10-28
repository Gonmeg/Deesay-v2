// ตรวจไวยากรณ์โค้ดทุกไฟล์ก่อนทดสอบหน้าเว็บ: .js ทุกไฟล์ + <script> ในทุกหน้า .html (รวม type="module")
import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import os from 'node:os'; import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bad = []; const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qa-'));
const check = (file, label) => { try { execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }); } catch (e) { bad.push(`${label}: ${String(e.stderr || e.message).split('\n').slice(0, 4).join(' ')}`); } };
for (const f of fs.readdirSync(root)) {
  if (f.endsWith('.js')) check(path.join(root, f), f);
  if (f.endsWith('.html')) {
    const html = fs.readFileSync(path.join(root, f), 'utf8'); let i = 0;
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (/type=["'](application\/ld\+json|text\/template)/.test(m[1])) continue;
      const ext = /type=["']module["']/.test(m[1]) ? '.mjs' : '.js', p = path.join(tmp, `${f}.${++i}${ext}`);
      fs.writeFileSync(p, m[2]); check(p, `${f} <script #${i}>`);
    }
  }
}
if (bad.length) { console.error('❌ ไวยากรณ์ผิด ' + bad.length + ' จุด\n' + bad.join('\n')); process.exit(1); }
console.log('✓ ไวยากรณ์ถูกทุกไฟล์');
