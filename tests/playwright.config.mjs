// ตั้งค่าระบบทดสอบ: Chromium หน้าจอ MacBook 13–14" (1440×900) · ทดสอบแบบเรียงหน้า (ล็อกอินครั้งเดียว)
export default {
  testDir: '.',
  testMatch: ['qa.spec.mjs'],
  timeout: 25 * 60 * 1000,
  workers: 1,
  use: { viewport: { width: 1440, height: 900 }, locale: 'th-TH', timezoneId: 'Asia/Bangkok', actionTimeout: 15000, navigationTimeout: 45000 },
};
