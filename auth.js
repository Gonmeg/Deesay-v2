// auth.js — ด่านล็อกอินใช้ร่วมทุกหน้า (dashboard / upload / admin / health)
// วิธีใช้: ใส่ <script src="config.js"></script><script src="auth.js"></script> ใน <head>
//   แล้วเรียก  Auth.require('dashboard')  (หรือ 'upload' / 'admin' / 'health') ก่อนโหลดข้อมูล
//   - ยังไม่ล็อกอิน → เด้งไป login.html (กลับมาหน้าเดิมหลังล็อกอิน)
//   - ล็อกอินแล้วแต่ยังไม่มีสิทธิ์หน้านี้ → หน้า "รอเมฆเปิดสิทธิ์" (ออกจากระบบได้)
//   - ผ่านแล้ว → คืนค่าสิทธิ์ { email, name, is_admin, pages, can_upload, can_admin }
// ฟังก์ชันอื่น: Auth.canPage('overview') · Auth.perm · Auth.token() · Auth.signOut() · Auth.client (supabase-js)

// รายชื่อหน้าใน dashboard.html (ใช้ทั้งกรองเมนูซ้าย และตารางติ๊กสิทธิ์ใน admin.html) — เพิ่มหน้าใหม่ที่นี่ที่เดียว
window.DEESAY_PAGES = [
  { id: 'overview',     name: 'ภาพรวมยอดขาย',        group: 'ยอดขาย' },
  { id: 'channel',      name: 'แยกตาม Channel',       group: 'ยอดขาย' },
  { id: 'fbhub',        name: 'ภาพรวม Facebook',       group: 'Facebook' },
  { id: 'crm',          name: 'CRM',                   group: 'Facebook' },
  { id: 'flow',         name: 'เส้นทางซื้อซ้ำ',        group: 'Facebook' },
  { id: 'neverbought',  name: 'ลูกค้าที่ยังไม่ซื้อ',     group: 'Facebook' },
  { id: 'promotarget',  name: 'ตั้งเป้าโปรโมชั่น',      group: 'Facebook' },
  { id: 'fbengage',     name: 'Engagement รายวัน',     group: 'Facebook' },
  { id: 'fbads',        name: 'Facebook Ads',          group: 'Facebook' },
  { id: 'tthub',        name: 'ภาพรวม TikTok',         group: 'TikTok' },
  { id: 'ttcontent',    name: 'ผลงานคอนเทนต์',         group: 'TikTok' },
  { id: 'ttkeyword',    name: 'ค้นหาคำบน TikTok',      group: 'TikTok' },
  { id: 'ttads',        name: 'TikTok Ads',            group: 'TikTok' },
  { id: 'livesearch',   name: 'ค้นหา Live',            group: 'TikTok' },
  { id: 'creatorperf',  name: 'Creator Performance',   group: 'TikTok' },
  { id: 'shhub',        name: 'ภาพรวม Shopee',         group: 'Shopee / Lazada' },
  { id: 'shads',        name: 'Shopee Ads',            group: 'Shopee / Lazada' },
  { id: 'lzhub',        name: 'ภาพรวม Lazada',         group: 'Shopee / Lazada' },
  { id: 'mthub',        name: 'ภาพรวม Modern Trade',   group: 'Modern Trade' },
  { id: 'skurev',       name: 'แนวโน้มสินค้า',          group: 'สินค้า / การตลาด' },
  { id: 'cost',         name: 'Business Insight',      group: 'สินค้า / การตลาด' },
  { id: 'mktlive',      name: 'MKT Tracking',          group: 'สินค้า / การตลาด' },
  { id: 'skuanalysis',  name: 'เจาะสินค้า',             group: 'สินค้า / การตลาด' },
  { id: 'adperf',       name: 'Ad Performance',        group: 'สินค้า / การตลาด' },
  { id: 'kol',          name: 'KOL / Affiliate',       group: 'สินค้า / การตลาด' },
  { id: 'supply',       name: 'Supply Chain',          group: 'สินค้า / การตลาด' },
];
// ปุ่มลัด "ให้แบบพนักงานทั่วไป" ใน admin.html = หน้าชุดนี้ (แก้ได้ตามใจ)
window.DEESAY_STAFF_PAGES = ['overview', 'channel', 'fbhub', 'tthub', 'ttcontent', 'shhub', 'lzhub', 'skurev', 'skuanalysis'];

window.Auth = (function () {
  const LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
  let client = null, session = null, perm = null;

  // โหลด supabase-js (UMD) ถ้าหน้านั้นยังไม่มี
  const ready = new Promise((resolve, reject) => {
    const make = () => { client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }); resolve(client); };
    if (window.supabase?.createClient) return make();
    const s = document.createElement('script'); s.src = LIB; s.onload = make; s.onerror = () => reject(new Error('โหลด supabase-js ไม่ได้')); document.head.appendChild(s);
  });

  function thisPageUrl() { return (location.pathname.split('/').pop() || 'dashboard.html') + location.search + location.hash; }
  function goLogin() { location.replace('login.html?redirect=' + encodeURIComponent(thisPageUrl())); return new Promise(() => {}); } // ค้างไว้ ไม่ให้โค้ดหลังจากนี้รันต่อ

  // หน้าบอกว่ายังไม่มีสิทธิ์ / ถูกปิดใช้งาน (ธีมเดียวกับ dashboard)
  function showBlocked(title, msg) {
    document.documentElement.style.background = '#0a0a0f';
    const light = (() => { try { return localStorage.getItem('deesay_theme') === 'light'; } catch (e) { return false; } })();
    const bg = light ? '#f5f5f7' : '#0a0a0f', bg2 = light ? '#ffffff' : '#111118', border = light ? '#d8d8e0' : '#2a2a3a',
          text = light ? '#1a1a2e' : '#e8e8f0', text2 = light ? '#4a4a6a' : '#9090a8', accent = light ? '#b8892e' : '#c8a96e';
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:${bg};display:flex;align-items:center;justify-content:center;font-family:'Sarabun',sans-serif;color:${text};z-index:99999;">
        <div style="background:${bg2};border:1px solid ${border};border-radius:16px;padding:36px 40px;max-width:420px;width:92%;text-align:center;">
          <div style="font-size:22px;font-weight:700;letter-spacing:2px;color:${accent};">DEESAY</div>
          <div style="font-size:18px;font-weight:600;margin:18px 0 8px;">${title}</div>
          <div style="font-size:14px;color:${text2};line-height:1.6;">${msg}</div>
          <div style="font-size:12px;color:${text2};margin-top:14px;">บัญชี: ${perm?.email || ''}</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:22px;">
            <button onclick="location.reload()" style="padding:9px 16px;border-radius:8px;border:1px solid ${border};background:transparent;color:${text};font-family:inherit;font-size:13px;cursor:pointer;">ลองใหม่</button>
            <button onclick="Auth.signOut()" style="padding:9px 16px;border-radius:8px;border:none;background:${accent};color:#0a0a0f;font-weight:600;font-family:inherit;font-size:13px;cursor:pointer;">ออกจากระบบ</button>
          </div>
        </div>
      </div>`;
    return new Promise(() => {});
  }

  async function rpc(name, args) {
    const { data, error } = await client.rpc(name, args || {});
    if (error) throw new Error(error.message);
    return data;
  }

  function canPage(id) { return !!perm && perm.is_active && (perm.is_admin || perm.pages.includes('*') || perm.pages.includes(id)); }

  // ด่านหลัก — where = 'dashboard' | 'upload' | 'admin' | 'health'
  async function require(where) {
    await ready;
    const { data } = await client.auth.getSession();
    session = data.session;
    if (!session) return goLogin();
    client.auth.onAuthStateChange((ev, s) => { session = s; if (ev === 'SIGNED_OUT' || !s) goLogin(); });
    // อ่านสิทธิ์ — ถ้าเซิร์ฟเวอร์สะดุดชั่วคราว (เช่น กำลังโหลด schema ใหม่) ลองซ้ำเองก่อน ไม่เด้งคนออก
    let lastErr = null;
    for (const wait of [0, 1500, 3000, 5000, 8000]) {
      if (wait) await new Promise(r => setTimeout(r, wait));
      try { perm = await rpc('my_permissions'); lastErr = null; break; } catch (e) { lastErr = e; }
    }
    if (lastErr) { setTimeout(() => location.reload(), 15000); return showBlocked('เชื่อมต่อไม่ได้ชั่วคราว', 'เซิร์ฟเวอร์ตอบช้า จะลองใหม่ให้เองใน 15 วินาที — หรือกด "ลองใหม่" ได้เลย<br><span style="font-size:11px;opacity:.7;">' + lastErr.message + '</span>'); }
    if (!perm.logged_in) return goLogin();
    perm.pages = perm.pages || [];
    if (!perm.is_active) return showBlocked('บัญชีถูกปิดใช้งาน', 'ติดต่อผู้ดูแลระบบถ้าต้องการใช้งานต่อ');
    const ok = where === 'upload' ? (perm.is_admin || perm.can_upload)
             : where === 'admin'  ? (perm.is_admin || perm.can_admin)
             : where === 'health' ? perm.is_admin
             : (perm.is_admin || perm.pages.length > 0);
    if (!ok) return showBlocked('รอเปิดสิทธิ์ใช้งาน', where === 'dashboard'
      ? 'สมัครเรียบร้อยแล้ว — รอผู้ดูแลระบบเปิดสิทธิ์ให้ แล้วกด "ลองใหม่"'
      : 'บัญชีนี้ยังไม่ได้รับสิทธิ์เข้าหน้านี้ — ติดต่อผู้ดูแลระบบถ้าต้องใช้');
    return perm;
  }

  async function signOut() { try { await ready; await client.auth.signOut(); } catch (e) {} location.replace('login.html'); }

  return { require, canPage, signOut, ready, rpc,
    get perm() { return perm; }, get client() { return client; }, token() { return session?.access_token || null; } };
})();
