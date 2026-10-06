# Deesay-v2 — กติกาสำหรับ Claude Code (อ่านทุกครั้งก่อนเริ่มงาน)

## ระบบ

* เว็บ static (HTML/JS ไม่มี build) บน GitHub Pages: https://gonmeg.github.io/Deesay-v2/ — อ่านจาก branch `main`
* ฐานข้อมูล / ตัวดึงข้อมูล / ตารางสรุป อยู่ที่ Supabase project `plfdizmjdmhyjqraohfv` (งานฝั่งฐานข้อมูลทำในแชต claude.ai Project "Sales Analysis and marketing intelligence system" — repo นี้แก้เฉพาะหน้าเว็บ)
* ผู้ดูแล: Meg (ตอบเป็นภาษาไทย อธิบายแบบเข้าใจง่าย ถ้าไม่แน่ใจให้ถามก่อน)

## ไฟล์

* `dashboard.html` (~1 MB) หน้าหลักทุกหน้า · `upload.html` อัปไฟล์ · `admin.html` · `health.html` (Data Guard) · `login.html` / `auth.js` / `config.js`
* โค้ดแยกที่โหลดตอนเปิดหน้า: `fbads.js` `supply.js` `skudeep.js` `ttcontent.js` `ttapi.js` — ชื่อไฟล์ตัวพิมพ์เล็กทั้งหมด (GitHub Pages แยกตัวพิมพ์เล็ก-ใหญ่)
* ทุกครั้งที่แก้ไฟล์ .js เหล่านี้ ต้องเปลี่ยนเลข `?v=YYYYMMDDx` ตรงที่ `dashboard.html` โหลดไฟล์นั้นด้วย (กันเบราว์เซอร์ใช้ของเก่า)
* ทุกครั้งที่แก้ `dashboard.html` ให้ขยับ `buildTag` (เช่น v2026.10.06-d → v2026.10.06-e / วันใหม่เริ่ม -a)

## การส่งงาน

* แก้เฉพาะที่ถูกขอ ไม่แก้อย่างอื่นเพิ่มเอง
* ก่อน push ตรวจว่า script ใน HTML ไม่มี syntax error (`node -e` แยก `<script>` แล้ว `new vm.Script`)
* commit message ภาษาไทยหรืออังกฤษสั้นๆ บอกว่าแก้อะไร แล้ว push ขึ้น `main` (ถ้า push ตรงไม่ได้ให้เปิด Pull Request)
* ห้ามแก้ `config.js` (รหัสผ่านในไฟล์นี้จะย้ายไป Supabase Auth ทีหลังพร้อมเปิด RLS — ทำพร้อมกันทั้งฐานข้อมูลและหน้าเว็บ)

## กฎหน้าเว็บ (ใช้ทุกหน้า)

* ช่วงวันที่ไม่เกิน 1 เดือน = กราฟรายวันเสมอ · หลายเดือน = รายเดือน
* กราฟใช้ `makeChart()` (สไตล์กลาง) tooltip เรียงมากไปน้อย
* คำอธิบายใส่ใน ⓘ popover (`toggleFbeInfo(id)` + class `ads-info-popover`) ไม่เขียนเป็นข้อความโชว์บนหน้า ห้ามใช้ `alert()`
* ตาราง/รายการยาว แบ่งหน้าด้วย `renderPagerHtml()` + `pgSize()` ห้ามทำกล่องเลื่อน
* ฟอนต์ Sarabun ทุกข้อความและตัวเลข · IBM Plex Mono เฉพาะรหัส (SKU, handle, เวอร์ชัน)
* คำทับศัพท์เขียนภาษาอังกฤษ: Ads, Live, Commission, Brand, Platform, Campaign, Promotion
* ยอดเงินเต็มจำนวน (฿89,855,564) ไม่ย่อเป็น M/K ในตารางและการ์ด
* ตัวกรองทั้งหน้าอยู่แถบบน (วันที่ / Channel / Sub-channel) ห้ามทำตัวกรองซ้ำในหน้า
* ตัวเลขเดียวกันต้องมาจากแหล่งเดียว — การ์ด ตาราง และหน้าอื่นต้องตรงกัน
* ตัวแทน และ Modern Trade ไม่นับใน AOV / ราคาเฉลี่ยต่อชิ้น / การวิเคราะห์ Promotion
* dropdown ใช้หน้าตาแบบ dropdown สถานะในหน้า Supply Chain
* ชื่อครีเอเตอร์: username TikTok เป็นหลัก ชื่อแสดงตัวเล็กข้างๆ

## ข้อมูลที่เลิกใช้แล้ว ห้ามอ้างถึง

Normalized_All, SKU_Revenue.csv, Power BI, Windsor, skill settlement-mapping / weekly-normalized
