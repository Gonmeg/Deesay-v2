# Deesay-v2

ระบบรายงานยอดขายและการตลาดภายในของ Deesay (เว็บ static บน GitHub Pages + ฐานข้อมูล Supabase)

* เปิดใช้งาน: https://gonmeg.github.io/Deesay-v2/ (ต้องล็อกอิน · สิทธิ์ตามบัญชี)
* หน้าหลัก `dashboard.html` · อัปโหลดไฟล์ `upload.html` · ตั้งค่า `admin.html` · สถานะระบบ `health.html`
* ข้อมูล การคำนวณ และงานตั้งเวลาทั้งหมดอยู่ใน Supabase — repo นี้เก็บเฉพาะหน้าเว็บ
* กติกาการแก้ไข / หน้าตา: ดู `CLAUDE.md`
* ระบบทดสอบอัตโนมัติ: `.github/workflows/qa.yml` (ทุก push + ทุกเช้า) ผลอยู่ที่ branch `qa-report`
