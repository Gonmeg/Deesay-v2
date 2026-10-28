// ordprofit.js (v20261028a) — ค่า Ads ของสินค้าที่เดือนนั้นไม่มียอดขาย แบ่งให้สินค้าที่ขาย (ป้าย direct_nosale)
// ordprofit.js (v20261027b) — ตารางรายสินค้ากดหัวคอลัมน์เพื่อเรียงได้ทุกคอลัมน์ (กดซ้ำกลับลำดับ)
// ordprofit.js (v20261027a) — แผง Ads + Coins: สรุปตามสินค้าพร้อมแถวรวมของคำสั่งซื้อ · ที่มาของอัตรา Ads เลือกดูทีละสินค้า (ปุ่มชื่อสินค้า + รหัส) · บอกนิยามยอดขาย (หลังหักส่วนลดร้านค้า)
// ordprofit.js (v20261026u) — โหลดเร็วขึ้น: ดึงสรุปของช่องทางที่เลือกก่อน อีกช่องทางตามมาเบื้องหลัง · ไม่เด้ง: ระหว่างโหลดคงข้อมูลเดิมไว้แบบจางลง ไม่ล้างเป็น "กำลังโหลด" และล็อกความสูงตารางไว้
// ordprofit.js (v20261026t) — ตัวเลขในตารางอยู่กึ่งกลางคอลัมน์ (คอลัมน์ข้อความ คำสั่งซื้อ / SKU / สถานะ ยังชิดซ้าย)
// ordprofit.js (v20261026s) — สถานะเงินเป็นจุดสีหน้าเลขคำสั่งซื้อ (เขียว = เงินเข้าแล้ว · แดง = เงินยังไม่เข้า · เทา = คืนเงินเต็มจำนวน) แทนป้ายในช่องสถานะ
// ordprofit.js (v20261026r) — หัวตารางพื้นทึบ (ตัวเลขไม่ทะลุตอนเลื่อน) · SKU แสดงจำนวนชิ้น (×n, รวมบรรทัดซ้ำ) · สถานะบรรทัดเดียว · มุมมอง สรุป / ละเอียด
// ordprofit.js (v20261026q) — ช่อง SKU: แสดงสูงสุด 3 ตัวในบรรทัดเดียว เกินจากนั้นเป็น +N · ไม่แสดงป้ายไม่มีต้นทุนในช่องนี้
// ordprofit.js (v20261026p) — เลือกช่องทางแล้วรอกดค้นหา (จุดแดงเหมือนหน้าอื่น) · แยกร้าน Shopee Mall / 24hr · หัวตารางล็อกตอนเลื่อน · เลือกจำนวนแถว 25/50/100 · SKU แสดงรายการแรก +N · รองรับหน้าจอหลายขนาด
// ordprofit.js (v20261026o) — ช่องทางและช่วงวันที่ใช้ตัวกรองแถบบน (เหมือนหน้าอื่น) · หมายเหตุสินค้าไม่มีต้นทุนย้ายไปปุ่ม Alert · tooltip กระชับ · คอลัมน์ "เฉลี่ยต่อคำสั่งซื้อ"
// ordprofit.js (v20261026n) — Ads + Coins: ค่าโฆษณาจริงจากแพลตฟอร์มทุกเดือน (เลิกใช้ Business Insight ในเดือนที่บัญชีปิด) รวม Coins และส่วนแบ่ง Ads PR · การ์ดที่มาใช้ยอดจากตารางแยกที่มา + แถวตัวปรับ · เอาค่าบรรจุภัณฑ์ออก
// ordprofit.js (v20261026m) — ตัดคอลัมน์การตลาดอื่น / บริหาร (กำไรหักถึงค่าโฆษณา) · เพิ่ม ราคาก่อนส่วนลด · ส่วนลดร้าน · ค่าส่งที่ผู้ซื้อจ่าย · แยกที่มาค่าโฆษณาเดือนปัจจุบัน · TikTok ที่ยังไม่ปิดยอดประมาณค่าธรรมเนียม
// ordprofit.js (v20261026k) — แผงที่มาของตัวเลขกระชับ: คำอธิบายย้ายเข้า ⓘ · ผลลัพธ์อยู่บรรทัดสุดท้ายของแต่ละส่วน · สรุปรวมท้ายแผง
// ordprofit.js (v20261026j) — เดือนที่บัญชียังไม่ปิด: ค่าโฆษณาจริงจากแพลตฟอร์ม · KOL จากไฟล์ทีม KOL · ที่เหลือประมาณการจากเดือนล่าสุดที่ปิด
// ordprofit.js (v20261026i) — แผงที่มาของตัวเลข: ตารางชัดเจน (ต้นทุนขาย: สินค้า · ต้นทุน/ชิ้น · จำนวน · รวม / ค่าใช้จ่ายปันส่วน: ทีละขั้น) + แหล่งข้อมูลไว้ล่างสุด
// ordprofit.js (v20261026h) — กดตัวเลขแสดงเฉพาะที่มาของเลขนั้น · VAT ไม่ต้องกด · "คำสั่งซื้อที่มีหลายสินค้า" · ค่าธรรมเนียมรายการย่อยกางในตารางหมวด (เลิกแท็บซ้ำ)
// ordprofit.js (v20261026g) — คำอธิบาย ⓘ สั้นลง
// ordprofit.js (v20261026f) — ค่าบริการ Shopee: ไม่ระบุชื่อโปรแกรมตายตัว (API และรายงานรายรับส่งมาเป็นยอดรวม)
// ordprofit.js (v20261026e) — ชื่อ / คำอธิบายค่าธรรมเนียมแยกตามแพลตฟอร์ม (ใช้คำเดียวกับ Seller Centre) · Shopee แยกค่าจัดส่ง
// ordprofit.js (v20261026d) — ตารางสรุปแทนแถบสี · คอลัมน์ SKU + ตัวกรองสินค้า · สถานะจาก API
// ordprofit.js (v20261026c) — หน้า "กำไรต่อคำสั่งซื้อ" (Management) · TikTok / Shopee
// รายคำสั่งซื้อแตกครบทุกรายการในตารางเดียว: ยอดขาย → ค่าธรรมเนียมแพลตฟอร์ม 5 หมวด → รายรับสุทธิ → VAT · ต้นทุนขาย · Ads + Coins → กำไร
// ตัวเลขที่คำนวณ / ปันส่วน (ขีดเส้นใต้) กดดูวิธีคิดได้ · ข้อมูล: mv_order_profit ผ่าน RPC order_profit_summary / _list / _detail
(function () {
  'use strict';
  const CHS = ['TikTok', 'Shopee'];
  const S = { ch: 'TikTok', shop: null, view: 'sum', from: null, to: null, tab: 'orders', filter: 'all', q: '', sku: '', sort: 'order_date', dir: 'desc', page: 0, size: 50, both: {}, list: null, months: [], psort: 'rev', pdir: 'desc' };
  // สถานะคำสั่งซื้อจาก API ของแพลตฟอร์ม
  const ST_TH = { COMPLETED: 'สำเร็จ', DELIVERED: 'จัดส่งถึงแล้ว', IN_TRANSIT: 'ระหว่างจัดส่ง', SHIPPED: 'จัดส่งแล้ว', TO_CONFIRM_RECEIVE: 'รอยืนยันรับสินค้า',
    AWAITING_SHIPMENT: 'รอจัดส่ง', AWAITING_COLLECTION: 'รอขนส่งรับ', READY_TO_SHIP: 'พร้อมจัดส่ง', PROCESSED: 'กำลังเตรียมสินค้า', TO_RETURN: 'คืนสินค้า', UNPAID: 'ยังไม่ชำระ', IN_CANCEL: 'กำลังยกเลิก', PARTIALLY_SHIPPING: 'จัดส่งบางส่วน' };
  const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const n0 = v => (Math.round(+v || 0)).toLocaleString('en-US');
  const n2 = v => (+v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pc = (v, b) => (+b ? (v / b * 100).toFixed(1) + '%' : '—');
  const tip = t => `<span class="ui-i" data-tip="${esc(t)}">ⓘ</span>`;
  // ร้าน Shopee (shop_id จาก Shopee Open API)
  const SHOPS = { 566792331: 'Shopee Mall', 530338789: 'Shopee 24hr' }, SHOPS_S = { 566792331: 'Mall', 530338789: '24hr' };
  const chName = () => S.ch !== 'Shopee' ? S.ch : S.shop ? (SHOPS[S.shop] || 'Shopee') : 'Shopee ทุกร้าน';
  // SKU: แสดงสูงสุด 3 ตัวในบรรทัดเดียว พร้อมจำนวนชิ้น (×n เมื่อเกิน 1) · เกินจากนั้นเป็น "+N" (ชี้เพื่อดูทั้งหมด)
  const skuCell = (items, skus) => { const L = Array.isArray(items) && items.length ? items.map(([k, q]) => [String(k), +q || 0]) : String(skus || '').split(',').map(x => [x.trim(), 1]).filter(x => x[0]);
    if (!L.length) return '<span class="z">—</span>';
    const one = ([k, q], h) => h ? `${esc(k)}${q > 1 ? ` <span class="q">×${n0(q)}</span>` : ''}` : `${k}${q > 1 ? ' ×' + n0(q) : ''}`;
    return `<span class="mono">${L.slice(0, 3).map(x => one(x, true)).join(', ')}</span>${L.length > 3 ? ` <span class="op-more" data-tip="${esc(L.map(x => one(x, false)).join(', '))}">+${L.length - 3}</span>` : ''}`; };
  const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const mLabel = m => { const [y, mm] = String(m).split('-'); return `${TH_M[+mm - 1]} ${(+y + 543) % 100}`; };
  const dLabel = d => { const [, m, dd] = String(d).split('-'); return `${+dd} ${TH_M[+m - 1]}`; };
  const lastDay = m => { const [y, mm] = m.split('-').map(Number); return new Date(Date.UTC(y, mm, 0)).toISOString().slice(0, 10); };

  // หมวดค่าธรรมเนียม (ตรงกับ op_fee_cat ในฐานข้อมูล) · ชื่อและคำอธิบายแยกตามแพลตฟอร์ม ไม่ปนกัน
  const CATS = ['comm', 'svc', 'pay', 'aff', 'oth'];
  const CATN = {
    Shopee: { comm: 'ค่าคอมมิชชั่น', svc: 'ค่าบริการ', pay: 'ค่าธุรกรรมการชำระเงิน', aff: 'ค่าคอมมิชชั่น AMS', oth: 'ค่าจัดส่งและอื่น ๆ' },
    TikTok: { comm: 'ค่าคอมมิชชั่น', svc: 'ค่าบริการโปรแกรม', pay: 'ค่าธรรมเนียมการทำธุรกรรม', aff: 'ค่าคอมมิชชั่นแอฟฟิลิเอต', oth: 'ค่าจัดส่งและอื่น ๆ' } };
  const CATS_S = { Shopee: { comm: 'ค่าคอม', svc: 'ค่าบริการ', pay: 'ชำระเงิน', aff: 'AMS', oth: 'จัดส่ง/อื่น' }, TikTok: { comm: 'ค่าคอม', svc: 'ค่าบริการ', pay: 'ธุรกรรม', aff: 'แอฟฟิลิเอต', oth: 'จัดส่ง/อื่น' } };
  const CATT = {
    Shopee: { comm: '% ของราคาสินค้า', svc: 'ค่าบริการโปรแกรมและแคมเปญ (ยอดรวมจาก Shopee)', pay: 'ตามช่องทางชำระเงินของผู้ซื้อ', aff: 'ค่าคอมมิชชั่น Affiliate', oth: 'ค่าจัดส่งสุทธิ ค่าโครงสร้างพื้นฐาน และรายการปรับปรุง' },
    TikTok: { comm: 'ค่าคอมมิชชั่นมาตรฐานและแบบไดนามิก', svc: 'ค่าบริการโปรแกรม เช่น LIVE Specials, Flash Sale', pay: 'ค่าธรรมเนียมการชำระเงิน', aff: 'ค่าคอมมิชชั่นครีเอเตอร์', oth: 'ค่าจัดส่งสุทธิ ค่าโครงสร้างพื้นฐาน และรายการปรับปรุง' } };
  const CAT_OF = k => {
    if (k.startsWith('est:')) return k.slice(4);
    const s = k.replace(/^tax:/, '');
    if (['platform_commission_amount', 'dynamic_commission_amount', 'referral_fee_amount', 'fee_per_item_sold_amount', 'platform_semi_managed_commission_fee', 'commission_fee'].includes(s)) return 'comm';
    if (['transaction_fee_amount', 'credit_card_handling_fee_amount', 'seller_paylater_handling_fee_amount', 'dt_handling_fee_amount', 'transaction_fee'].includes(s)) return 'pay';
    if (/affiliate|ams_commission|cofunded_creator|tap_shop_ads|shoppable_video|tsp_commission|brand_amplification_program_commission/.test(s)) return 'aff';
    if (/live_specials|flash_sales|voucher_xtra|bonus_cashback|sfp_service|campaign_period|smart_promotion|cofunded_promotion|mall_service|seller_growth|pre_order|special_service|growth_package|brand_campaign|category_led|gmv_max|^service_fee$|^campaign_fee$|seller_coin_cash_back/.test(s)) return 'svc';
    return 'oth';
  };
  // [ชื่อตาม Seller Centre, คำอธิบาย]
  const FEE = {
    Shopee: {
      commission_fee: ['ค่าคอมมิชชั่น', '% จากราคาสินค้า'],
      service_fee: ['ค่าบริการ', 'ยอดรวมค่าบริการโปรแกรม (รายละเอียดใน Seller Centre)'],
      processing_fee: ['ค่าธรรมเนียมโครงสร้างพื้นฐานแพลตฟอร์ม', 'ต่อคำสั่งซื้อ'],
      transaction_fee: ['ค่าธุรกรรมการชำระเงิน', 'ตามช่องทางชำระเงินของผู้ซื้อ'],
      ams_commission_fee: ['ค่าคอมมิชชั่น AMS', 'ค่าคอมมิชชั่น Affiliate'],
      campaign_fee: ['ค่าธรรมเนียมแคมเปญ', 'ค่าเข้าร่วมแคมเปญ'],
      seller_coin_cash_back: ['Coins Cashback ที่ร้านออก', 'Coins ที่ร้านมอบให้ผู้ซื้อ'],
      actual_shipping_fee: ['ค่าจัดส่งตามจริง คิดโดยผู้ให้บริการขนส่ง', 'ค่าขนส่งจริงของคำสั่งซื้อ'],
      shopee_shipping_rebate: ['ค่าจัดส่งที่ Shopee ช่วยออก', 'ส่วนที่ Shopee ออกให้'],
      reverse_shipping_fee: ['ค่าจัดส่งสินค้าคืน', 'กรณีผู้ซื้อส่งคืนสินค้า'],
      final_return_to_seller_shipping_fee: ['ค่าจัดส่งพัสดุตีกลับ', 'กรณีพัสดุตีกลับ'],
      seller_lost_compensation: ['เงินชดเชยสินค้าสูญหาย', 'กรณีสินค้าสูญหาย'],
      other: ['รายการอื่น ๆ', 'ส่วนต่างที่ไม่อยู่ในรายการข้างต้น'] },
    TikTok: {
      platform_commission_amount: ['ค่าคอมมิชชั่น', '% ของยอดขาย ตามหมวดหมู่สินค้า'],
      dynamic_commission_amount: ['ค่าคอมมิชชั่นแบบไดนามิก', 'ค่าคอมมิชชั่นเพิ่มเติมตามแคมเปญ'],
      transaction_fee_amount: ['ค่าธรรมเนียมการทำธุรกรรม', 'ค่าธรรมเนียมการชำระเงิน'],
      vn_fix_infrastructure_fee: ['ค่าธรรมเนียมโครงสร้างพื้นฐาน', 'ค่าธรรมเนียมคงที่ต่อคำสั่งซื้อ'],
      affiliate_commission_amount: ['ค่าคอมมิชชั่นแอฟฟิลิเอต', 'ค่าคอมมิชชั่นครีเอเตอร์'],
      affiliate_ads_commission_amount: ['ค่าคอมมิชชั่นโฆษณาแอฟฟิลิเอต', 'จากโฆษณาผ่านครีเอเตอร์'],
      affiliate_partner_commission_amount: ['ค่าคอมมิชชั่นพาร์ทเนอร์แอฟฟิลิเอต', 'ค่าคอมมิชชั่นพาร์ทเนอร์'],
      live_specials_fee_amount: ['ค่าธรรมเนียมบริการ LIVE Specials', 'คำสั่งซื้อจากไลฟ์ในโปรแกรม LIVE Specials'],
      flash_sales_service_fee_amount: ['ค่าธรรมเนียมบริการ Flash Sale', 'สินค้าที่ขายใน Flash Sale'],
      voucher_xtra_service_fee_amount: ['ค่าธรรมเนียมบริการ Voucher Xtra', 'โปรแกรม Voucher Xtra'],
      sfp_service_fee_amount: ['ค่าธรรมเนียมบริการโปรแกรมส่งฟรี', 'โปรแกรมส่งฟรี'],
      bonus_cashback_service_fee_amount: ['ค่าธรรมเนียมบริการโบนัสแคชแบ็ก', 'โปรแกรมโบนัสแคชแบ็ก'],
      campaign_period_fee_sp_amount: ['ค่าธรรมเนียมช่วงแคมเปญ', 'ช่วงแคมเปญที่เข้าร่วม'],
      gmv_max_ad_fee_amount: ['ค่าโฆษณา GMV Max', 'หักจากยอดขาย'],
      refund_administration_fee_amount: ['ค่าดำเนินการคืนเงิน', 'กรณีคืนเงิน'],
      shipping_cost_amount: ['ค่าจัดส่ง (สุทธิ)', 'ค่าจัดส่งที่ร้านจ่ายหลังหักส่วนที่ TikTok ออกให้'],
      adjustment_amount: ['รายการปรับปรุง', 'ปรับปรุงยอดจาก TikTok Shop'] } };
  const feeOf = (ch, k) => { if (k.startsWith('est:')) return [`${(CATN[ch] || CATN.TikTok)[k.slice(4)] || 'อื่น ๆ'} (ประมาณการ)`, 'ประมาณจากอัตราเฉลี่ยของคำสั่งซื้อที่ปิดยอดใน 45 วันล่าสุด'];
    const b = k.replace(/^tax:/, ''), x = (FEE[ch] || {})[b]; const l = x ? x[0] : b.replace(/_amount$/, '').replace(/_/g, ' '); return [k.startsWith('tax:') ? 'ภาษี: ' + l : l, x ? x[1] : '']; };
  const feeTh = k => feeOf(S.ch, k)[0];
  const CAT = new Proxy({}, { get: (t, c) => (CATN[S.ch] || CATN.TikTok)[c], ownKeys: () => CATS, getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) });
  const CAT_S = new Proxy({}, { get: (t, c) => (CATS_S[S.ch] || CATS_S.TikTok)[c] });
  const CAT_TIP = new Proxy({}, { get: (t, c) => (CATT[S.ch] || CATT.TikTok)[c] });

  async function rpc(name, params) { const j = await window.supaRpc(name, params); if (j && j.message && j.code) throw new Error(j.message); return j; }

  function shell() {
    const el = document.getElementById('page-ordprofit'); if (!el) return null;
    if (el.dataset.ready === 'c') return el;
    el.dataset.ready = 'c';
    el.innerHTML = `<style>
      #page-ordprofit { --op-line: var(--border); --op-soft: rgba(127,127,127,.05); }
      #page-ordprofit .op-bar { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:16px; }
      #page-ordprofit .op-seg { display:inline-flex; border:1px solid var(--op-line); border-radius:9px; overflow:hidden; background:var(--bg2); }
      #page-ordprofit .op-seg button { border:0; background:transparent; color:var(--text2); font:inherit; font-size:12.5px; padding:6px 14px; cursor:pointer; }
      #page-ordprofit .op-seg button.on { background:var(--accent, #b8862f); color:#fff; font-weight:700; }
      #page-ordprofit select, #page-ordprofit input[type=search] { font:inherit; font-size:12.5px; padding:6px 10px; border:1px solid var(--op-line); border-radius:8px; background:var(--bg2); color:var(--text); }
      #page-ordprofit .op-kp { display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:12px; margin-bottom:12px; }
      #page-ordprofit .op-k { background:var(--bg2); border:1px solid var(--op-line); border-radius:12px; padding:14px 16px; min-width:0; }
      #page-ordprofit .op-k .l { font-size:12px; color:var(--text2); font-weight:600; }
      #page-ordprofit .op-k .v { font-size:clamp(20px, 1.9vw, 24px); font-weight:800; margin:4px 0 2px; font-variant-numeric:tabular-nums; letter-spacing:-.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #page-ordprofit .op-k.hero .v { font-size:clamp(24px, 2.4vw, 30px); }
      #page-ordprofit .op-k .d { font-size:11.5px; color:var(--text3); overflow-wrap:anywhere; }
      #page-ordprofit .op-sumg { display:grid; grid-template-columns:minmax(0, 1.35fr) minmax(0, 1fr); gap:12px; margin-bottom:16px; }
      #page-ordprofit .op-h { font-size:13px; font-weight:700; margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:4px 10px; }
      #page-ordprofit table.op-s { width:100%; border-collapse:collapse; font-size:12.5px; }
      #page-ordprofit .op-s th { font-size:11px; color:var(--text3); font-weight:600; text-align:right; padding:6px 8px; border-bottom:1px solid var(--op-line); }
      #page-ordprofit .op-s td { text-align:right; padding:6px 8px; border-bottom:1px solid var(--op-line); font-variant-numeric:tabular-nums; }
      #page-ordprofit .op-s th:first-child, #page-ordprofit .op-s td:first-child { text-align:left; }
      #page-ordprofit .op-s tr.st td { font-weight:700; background:var(--op-soft); } #page-ordprofit .op-s tr.tot td { font-weight:800; border-bottom:0; }
      #page-ordprofit .op-s td.ind { padding-left:20px; color:var(--text2); }
      #page-ordprofit .op-s tr.op-sub td { font-size:12px; background:var(--op-soft); } #page-ordprofit .op-car { display:inline-block; width:10px; color:var(--text3); }
      @media (max-width:1100px) { #page-ordprofit .op-sumg { grid-template-columns:1fr; } }
      #page-ordprofit .op-mix { background:var(--bg2); border:1px solid var(--op-line); border-radius:12px; padding:14px 16px; margin-bottom:16px; }
      #page-ordprofit .op-mix .t { font-size:12px; color:var(--text2); font-weight:600; margin-bottom:8px; display:flex; justify-content:space-between; }
      #page-ordprofit .op-stack { display:flex; height:12px; border-radius:6px; overflow:hidden; background:var(--bg); }
      #page-ordprofit .op-stack span { display:block; height:12px; }
      #page-ordprofit .op-leg { display:flex; flex-wrap:wrap; gap:6px 18px; margin-top:10px; font-size:12px; color:var(--text2); }
      #page-ordprofit .op-leg i { display:inline-block; width:9px; height:9px; border-radius:2px; margin-right:6px; vertical-align:0; }
      #page-ordprofit .op-leg b { font-variant-numeric:tabular-nums; color:var(--text); font-weight:700; margin-left:4px; }
      #page-ordprofit .op-tabs { display:flex; gap:20px; border-bottom:1px solid var(--op-line); margin-bottom:12px; }
      #page-ordprofit .op-tabs button { border:0; background:none; font:inherit; font-size:13px; color:var(--text3); padding:8px 0; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; }
      #page-ordprofit .op-tabs button.on { color:var(--text); font-weight:700; border-bottom-color:var(--accent, #b8862f); }
      #page-ordprofit .op-card { background:var(--bg2); border:1px solid var(--op-line); border-radius:12px; padding:12px 14px; min-width:0; }
      #page-ordprofit .op-s td:not(:first-child), #page-ordprofit .op-s th:not(:first-child) { white-space:nowrap; }
      #page-ordprofit .op-tools { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
      #page-ordprofit .op-scroll { overflow:auto; max-height:max(420px, calc(100vh - 230px)); }
      #page-ordprofit .op-t thead th { position:sticky; top:0; z-index:3; background-color:var(--bg2) !important; }   /* พื้นทึบเสมอ ไม่ให้แถวที่เลื่อนผ่านโผล่ทะลุ (สีหมวดใช้ box-shadow ด้านล่าง) */
      #page-ordprofit .op-t .q { color:var(--text3); }
      #page-ordprofit .op-kp, #page-ordprofit .op-sumg, #page-ordprofit .op-scroll { transition:opacity .15s; }
      #page-ordprofit.op-busy .op-kp, #page-ordprofit.op-busy .op-sumg, #page-ordprofit.op-busy .op-scroll { opacity:.5; pointer-events:none; }
      #page-ordprofit .op-dot { display:inline-block; width:7px; height:7px; border-radius:50%; margin-right:6px; vertical-align:1px; flex:none; }
      #page-ordprofit .op-dot.ok { background:#16a34a; } #page-ordprofit .op-dot.w { background:#dc2626; } #page-ordprofit .op-dot.r { background:#94a3b8; }
      #page-ordprofit .op-leg2 { font-size:11.5px; color:var(--text3); display:inline-flex; align-items:center; gap:4px 12px; flex-wrap:wrap; }
      #page-ordprofit .op-t thead tr + tr th { top:var(--op-gh, 0px); }
      #page-ordprofit .op-t thead th.stk, #page-ordprofit .op-t thead th.pfh, #page-ordprofit .op-t thead th.pfh2 { z-index:5; }
      #page-ordprofit .op-t thead tr.g th.gf { background:var(--bg2); box-shadow:inset 0 0 0 999px rgba(239,68,68,.05); } #page-ordprofit .op-t thead tr.g th.gs { background:var(--bg2); box-shadow:inset 0 0 0 999px rgba(34,197,94,.06); } #page-ordprofit .op-t thead tr.g th.gc { background:var(--bg2); box-shadow:inset 0 0 0 999px rgba(99,102,241,.05); }
      #page-ordprofit .op-t thead th.s { background:var(--bg2); box-shadow:inset 0 0 0 999px rgba(34,197,94,.025); } #page-ordprofit .op-t thead th.f { background:var(--bg2); box-shadow:inset 0 0 0 999px rgba(239,68,68,.025); } #page-ordprofit .op-t thead th.c { background:var(--bg2); box-shadow:inset 0 0 0 999px rgba(99,102,241,.025); }
      #page-ordprofit .op-more { display:inline-block; font-size:10.5px; font-weight:700; color:var(--text2); background:var(--op-soft); border:1px solid var(--op-line); border-radius:9px; padding:0 6px; margin-left:2px; }
      #page-ordprofit table.op-t { border-collapse:separate; border-spacing:0; width:100%; font-size:12px; }
      #page-ordprofit .op-t th { font-size:11px; color:var(--text3); font-weight:600; padding:7px 8px; text-align:center; white-space:nowrap; border-bottom:1px solid var(--op-line); background:var(--bg2); }
      #page-ordprofit .op-t thead tr.g th { font-size:11px; color:var(--text2); font-weight:700; text-align:center; border-bottom:0; padding-bottom:2px; }
      #page-ordprofit .op-t thead tr.g th.gf { background:rgba(239,68,68,.05); } #page-ordprofit .op-t thead tr.g th.gs { background:rgba(34,197,94,.06); }
      #page-ordprofit .op-t th.s, #page-ordprofit .op-t td.s { background:rgba(34,197,94,.025); } #page-ordprofit .op-t thead tr.g th.gc { background:rgba(99,102,241,.05); }
      #page-ordprofit .op-t th.f, #page-ordprofit .op-t td.f { background:rgba(239,68,68,.025); } #page-ordprofit .op-t th.c, #page-ordprofit .op-t td.c { background:rgba(99,102,241,.025); }
      #page-ordprofit .op-t td { padding:7px 7px; text-align:center; white-space:nowrap; border-bottom:1px solid var(--op-line); font-variant-numeric:tabular-nums; color:var(--text); }
      #page-ordprofit .op-t th.l, #page-ordprofit .op-t td.l { text-align:left; }
      #page-ordprofit .op-t .stk { position:sticky; left:0; z-index:1; background:var(--bg2); box-shadow:1px 0 0 var(--op-line); }
      #page-ordprofit .op-t tbody tr { cursor:pointer; } #page-ordprofit .op-t tbody tr:hover td { background:rgba(184,134,47,.06); }
      #page-ordprofit .op-t td.sum, #page-ordprofit .op-t th.sum { font-weight:700; }
      #page-ordprofit .op-t td.pf { font-weight:800; } #page-ordprofit .op-t td.neg { color:var(--red); }
      #page-ordprofit .op-t th.s { cursor:pointer; } #page-ordprofit .op-t th.s.on { color:var(--text); }
      #page-ordprofit .op-t th.srt { cursor:pointer; user-select:none; } #page-ordprofit .op-t th.srt:hover, #page-ordprofit .op-t th.srt.on { color:var(--text); } #page-ordprofit .op-t th .ar { display:inline-block; min-width:12px; margin-left:3px; font-size:10px; }
      #page-ordprofit .op-t .u { text-decoration:underline dotted; text-underline-offset:3px; }
      #page-ordprofit .op-t .pfh, #page-ordprofit .op-t .pfc { position:sticky; right:46px; z-index:1; background:var(--bg2); box-shadow:-1px 0 0 var(--op-line); }
      #page-ordprofit .op-t .pfh2, #page-ordprofit .op-t .pfc2 { position:sticky; right:0; z-index:1; background:var(--bg2); min-width:46px; box-sizing:border-box; }
      #page-ordprofit .op-t tbody tr:hover td.pfc, #page-ordprofit .op-t tbody tr:hover td.pfc2, #page-ordprofit .op-t tbody tr:hover td.stk { background:#f7f1e6; }
      #page-ordprofit .op-t thead tr.g th.pfh { right:0; }
      #page-ordprofit .op-t .z { color:var(--text3); }
      #page-ordprofit .sub { font-size:10.5px; color:var(--text3); font-weight:400; } #page-ordprofit .mono { font-family:'IBM Plex Mono', monospace; font-size:11px; }
      #page-ordprofit .op-tag { display:inline-block; font-size:10px; font-weight:700; border-radius:9px; padding:0 6px; margin-left:4px; color:#b45309; background:rgba(245,158,11,.14); }
      #page-ordprofit .op-pg { display:flex; flex-wrap:wrap; gap:8px; align-items:center; justify-content:flex-end; margin-top:10px; font-size:12px; color:var(--text3); }
      #page-ordprofit .op-pg button { font:inherit; font-size:12px; border:1px solid var(--op-line); background:var(--bg2); color:var(--text); border-radius:7px; padding:4px 10px; cursor:pointer; } #page-ordprofit .op-pg button:disabled { opacity:.45; cursor:default; }
      #page-ordprofit .fl { display:grid; grid-template-columns:1fr 110px 64px; gap:8px; font-size:12.4px; padding:6px 0; border-bottom:1px solid var(--op-line); }
      #page-ordprofit .fl span:nth-child(n+2) { text-align:right; font-variant-numeric:tabular-nums; } #page-ordprofit .fl.h { font-size:11px; color:var(--text3); font-weight:600; }
      #page-ordprofit .fl.cat { font-weight:700; background:var(--op-soft); padding-left:6px; } #page-ordprofit .fl.it span:first-child { padding-left:16px; color:var(--text2); }
      @media (max-width:1100px) { #page-ordprofit .op-kp { grid-template-columns:1fr 1fr; } }
    </style>
    <div class="op-kp" id="opKpis"></div>
    <div class="op-sumg"><div class="op-card" id="opSum"></div><div class="op-card" id="opCat"></div></div>
    <div class="op-tabs" id="opTabs"><button type="button" data-v="orders">รายคำสั่งซื้อ</button><button type="button" data-v="products">รายสินค้า</button></div>
    <div class="op-card" id="opBody"></div>`;
    el.querySelectorAll('#opTabs button').forEach(b => b.onclick = () => { S.tab = b.dataset.v; drawTab(); });
    return el;
  }

  // ช่วงวันที่ = ตัวกรองวันที่แถบบน (ใช้ร่วมทุกหน้า) · ช่องทาง = ตัวเลือก Channel แถบบนของหน้านี้ (TikTok / Shopee)
  function readTop() {
    const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
    const f = (document.getElementById('dateFrom') || {}).value, to = (document.getElementById('dateTo') || {}).value;
    S.from = f || today.slice(0, 8) + '01'; S.to = to || today; if (S.to < S.from) S.to = S.from;
    const sel = document.getElementById('opChSelect'), v = sel && sel.value ? sel.value : 'TikTok', [c, sh] = v.split(':');
    S.ch = c; S.shop = sh ? +sh : null; window._opChApplied = v;   // ใช้เทียบว่าเลือกช่องทางใหม่แล้วยังไม่กดค้นหา (จุดแดงที่ปุ่มค้นหา)
  }
  const yy = d => (+String(d).slice(0, 4) + 543) % 100;
  const rLabel = () => S.from === S.to ? `${dLabel(S.from)} ${yy(S.from)}` : `${dLabel(S.from)}${yy(S.from) !== yy(S.to) ? ' ' + yy(S.from) : ''} – ${dLabel(S.to)} ${yy(S.to)}`;

  async function render() {
    shell(); readTop(); S.page = 0;
    load();
  }

  // ระหว่างโหลด: คงข้อมูลเดิมไว้แบบจางลง (ไม่ล้างหน้า → ไม่เด้ง) · นับซ้อนได้ (สรุป + ตารางโหลดพร้อมกัน)
  let _busy = 0, _seq = 0;
  const busy = d => { _busy = Math.max(0, _busy + d); const pg = document.getElementById('page-ordprofit'); if (pg) pg.classList.toggle('op-busy', _busy > 0); };
  async function load() {
    const el = shell(), my = ++_seq, other = CHS.find(c => c !== S.ch);
    const q = c => rpc('order_profit_summary', { p_ch: c, p_from: S.from, p_to: S.to, p_shop: c === 'Shopee' ? S.shop : null });
    if (!el.querySelector('#opKpis .op-k')) el.querySelector('#opKpis').innerHTML = ['', '', '', ''].map((_, i) => `<div class="op-k${i ? '' : ' hero'}"><div class="l">&nbsp;</div><div class="v">—</div><div class="d">&nbsp;</div></div>`).join('');
    busy(1);
    let cur;   // ช่องทางที่เลือกก่อน แสดงผลได้ทันที · อีกช่องทาง (ใช้แค่ตัวเลขเปรียบเทียบในการ์ดแรก) ตามมาเบื้องหลัง
    try { cur = await q(S.ch); }
    catch (e) { busy(-1); el.querySelector('#opKpis').innerHTML = `<div class="error-banner" style="display:block;grid-column:1/-1;">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    if (my !== _seq) { busy(-1); return; }
    S.both = { [S.ch]: cur };
    drawTop(); drawTab(); busy(-1);
    q(other).then(x => { if (my !== _seq) return; S.both[other] = x; drawTop(); }).catch(() => {});
  }

  function drawTop() {
    const el = shell(), s = S.both[S.ch] || {}, k = s.k || {}, rev = +k.rev || 0, n = +k.orders || 0, p = +k.profit || 0;
    const other = CHS.find(c => c !== S.ch), ko = ((S.both[other] || {}).k) || {}, po = +ko.orders ? (+ko.profit || 0) / +ko.orders : null;
    // คำสั่งซื้อที่รอปิดยอดเป็นเรื่องปกติ (สถานะในตารางบอกอยู่แล้ว) · แจ้งที่ปุ่ม Alert เฉพาะสินค้าที่ไม่มีต้นทุน ซึ่งต้องแก้ข้อมูล
    if (window.pageNote) window.pageNote('ordprofit', 'nocost', +k.no_cost ? 'warn' : null, +k.no_cost ? `${chName()}: ${n0(k.no_cost)} คำสั่งซื้อมีสินค้าที่ไม่มีต้นทุน` : '', 'นับต้นทุนเป็น 0 · เพิ่มต้นทุนในไฟล์ต้นทุนหรือหน้าสินค้า & ราคา');
    const card = (l, t, v, d, cls, style) => `<div class="op-k ${cls || ''}"><div class="l">${l} ${tip(t)}</div><div class="v" style="${style || ''}">${v}</div><div class="d">${d}</div></div>`;
    el.querySelector('#opKpis').innerHTML =
      card('กำไรต่อคำสั่งซื้อ', 'กำไรรวม ÷ จำนวนคำสั่งซื้อ (ไม่รวมคำสั่งซื้อที่คืนเงินเต็มจำนวน)', n ? n2(p / n) : '—',
        `${n0(n)} คำสั่งซื้อ${po !== null ? ` · ${other} ${n2(po)}` : ''}`, 'hero', p < 0 ? 'color:var(--red);' : 'color:#15803d;')
      + card('กำไรรวม', 'รายรับสุทธิ − VAT − ต้นทุนขาย − Ads + Coins · ไม่รวมค่าการตลาดอื่นและค่าใช้จ่ายบริหาร', n0(p), `อัตรากำไร ${pc(p, rev)}`, '', p < 0 ? 'color:var(--red);' : '')
      + card('ค่าธรรมเนียมแพลตฟอร์ม', 'ยอดขาย − รายรับสุทธิ', pc(+k.fees, rev), `${n0(k.fees)} จากยอดขาย ${n0(rev)}`)
      + card('คำสั่งซื้อที่ขาดทุน', 'สัดส่วนคำสั่งซื้อที่กำไรติดลบ', pc(+k.loss, n), `${n0(k.loss)} คำสั่งซื้อ`, '', +k.loss ? 'color:var(--red);' : '');
    // สรุปรายรับ–รายจ่าย (ตาราง) + ค่าธรรมเนียมแยกหมวด
    const mk2 = (+k.mkt_direct || 0) + (+k.mkt_other || 0), pr = (l, v, cls, t) => `<tr class="${cls || ''}"><td class="${cls ? '' : 'ind'}">${l}${t ? ' ' + tip(t) : ''}</td><td>${n2(v)}</td><td>${n ? n2((+v || 0) / n) : '—'}</td><td>${pc(+v, rev)}</td></tr>`;
    el.querySelector('#opSum').innerHTML = `<div class="op-h"><span>สรุปรายรับ–รายจ่าย ${tip('ทุกคำสั่งซื้อในช่วงที่เลือก ยกเว้นคำสั่งซื้อที่คืนเงินเต็มจำนวน')}</span><span style="font-size:11.5px;font-weight:400;color:var(--text3);">${chName()} · ${rLabel()}</span></div>
      <table class="op-s" data-no-sort data-no-page><thead><tr><th>รายการ</th><th>จำนวนเงิน (บาท)</th><th>เฉลี่ยต่อคำสั่งซื้อ ${tip('จำนวนเงิน ÷ จำนวนคำสั่งซื้อ')}</th><th>% ของยอดขาย</th></tr></thead><tbody>`
      + pr('ยอดขาย', rev, 'st', 'หลังหักส่วนลดร้าน · รวม VAT')
      + pr('หัก ค่าธรรมเนียมแพลตฟอร์ม', k.fees, '', 'รายละเอียดตามตารางแยกหมวด')
      + pr('รายรับสุทธิจากแพลตฟอร์ม', k.settle, 'st', 'ยอดที่แพลตฟอร์มโอนให้ร้าน')
      + pr('หัก ภาษีมูลค่าเพิ่ม', k.vat, '', 'รายรับสุทธิ × 7/107')
      + pr('หัก ต้นทุนขาย', k.cogs, '', 'จำนวนชิ้น × ต้นทุนต่อชิ้นจากไฟล์ต้นทุนของฝ่ายบัญชี · รวมของแถม')
      + pr('หัก Ads + Coins', k.ads, '', 'ค่าโฆษณาจริงจากแพลตฟอร์ม รวม Coins และ Ads PR · แบ่งตามสัดส่วนยอดขายของสินค้า')
      + pr('กำไร', p, 'tot', 'ไม่รวมค่าการตลาดอื่นและค่าใช้จ่ายบริหาร') + '</tbody></table>';
    const fees = (s.fees || []).filter(x => Math.abs(+x[1]) >= 0.5), all = +k.fees || 0, by = {};
    fees.forEach(([kk, v]) => { const c = CAT_OF(kk); (by[c] = by[c] || []).push([kk, -(+v)]); });
    const rest = all - fees.reduce((t, x) => t - (+x[1]), 0); if (Math.abs(rest) >= 0.5) (by.oth = by.oth || []).push(['__rest', rest]);
    const rows = CATS.filter(c => by[c]).map(c => { const L = by[c].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1])), tot = L.reduce((t, x) => t + x[1], 0);
      const single = L.length === 1 && feeOf(S.ch, L[0][0])[0] === CAT[c];
      const sub = single ? '' : L.map(([kk, v]) => { const [l, t] = kk === '__rest' ? ['ยังไม่แยกรายการ', ''] : feeOf(S.ch, kk);
        return `<tr class="op-sub" data-c="${c}" style="display:none;"><td class="ind">${esc(l)}${t ? ' ' + tip(t) : ''}</td><td>${n2(v)}</td><td>${pc(v, rev)}</td></tr>`; }).join('');
      return `<tr${single ? '' : ` style="cursor:pointer;" onclick="OrdProfit.toggleCat('${c}', this)"`}><td>${single ? '' : '<span class="op-car">▸</span> '}${CAT[c]} ${tip(CAT_TIP[c])}</td><td>${n2(tot)}</td><td>${pc(tot, rev)}</td></tr>` + sub; }).join('');
    el.querySelector('#opCat').innerHTML = `<div class="op-h"><span>ค่าธรรมเนียมแพลตฟอร์มแยกหมวด ${tip('ตามข้อมูลการเงินจากแพลตฟอร์ม · กด ▸ เพื่อดูรายการย่อย')}</span></div>
      <table class="op-s" data-no-sort data-no-page><thead><tr><th>หมวด</th><th>จำนวนเงิน (บาท)</th><th>% ของยอดขาย</th></tr></thead><tbody>${rows}
      <tr class="tot"><td>รวม</td><td>${n2(all)}</td><td>${pc(all, rev)}</td></tr></tbody></table>`;
  }

  function drawTab() {
    const el = shell();
    el.querySelectorAll('#opTabs button').forEach(b => b.classList.toggle('on', b.dataset.v === S.tab));
    if (S.tab === 'products') return drawProducts();
    return drawOrders();
  }

  // (2026-10-27) ตารางรายสินค้า: กดหัวคอลัมน์เพื่อเรียง (กดซ้ำ = กลับลำดับ) · เริ่มต้นเรียงตามยอดขายมากไปน้อย
  const PSORT = {
    name: x => x.p === 'หลายสินค้า' ? 'คำสั่งซื้อที่มีหลายสินค้า' : String(x.name || x.p),
    n: x => +x.n || 0, rev: x => +x.rev || 0, profit: x => +x.profit || 0,
    margin: x => +x.rev ? (+x.profit || 0) / +x.rev : -Infinity,
    ppo: x => +x.n ? (+x.profit || 0) / +x.n : -Infinity,
    loss: x => (+x.n ? (+x.loss || 0) / +x.n : 0) + (+x.loss || 0) * 1e-9 };
  function drawProducts() {
    const s = S.both[S.ch] || {}, box = shell().querySelector('#opBody'), k = PSORT[S.psort] ? S.psort : 'rev', dir = S.pdir === 'asc' ? 1 : -1, f = PSORT[k];
    const P = (s.products || []).slice().sort((a, b) => { const va = f(a), vb = f(b); return (k === 'name' ? String(va).localeCompare(String(vb), 'th') : va - vb) * dir; });
    const ph = (key, l, t, cls) => `<th class="srt${cls ? ' ' + cls : ''}${k === key ? ' on' : ''}" onclick="OrdProfit.sortProd('${key}')">${l}${t ? ' ' + tip(t) : ''}<span class="ar">${k === key ? (dir > 0 ? '▲' : '▼') : ''}</span></th>`;
    box.innerHTML = `<div class="op-scroll"><table class="op-t" data-no-sort data-no-page><thead><tr>${ph('name', 'สินค้า', 'จัดกลุ่มตามสินค้าหลัก (ไม่นับของแถม) · กดแถวเพื่อดูคำสั่งซื้อ', 'l')}
      ${ph('n', 'คำสั่งซื้อ')}${ph('rev', 'ยอดขาย')}${ph('profit', 'กำไร', 'หลังหัก Ads + Coins · ไม่รวมค่าการตลาดอื่นและค่าใช้จ่ายบริหาร')}${ph('margin', 'อัตรากำไร')}${ph('ppo', 'กำไรต่อคำสั่งซื้อ')}${ph('loss', 'คำสั่งซื้อที่ขาดทุน', 'สัดส่วนคำสั่งซื้อที่กำไรติดลบ (จำนวน)')}</tr></thead><tbody>`
      + (P.length ? P.map(x => `<tr onclick="OrdProfit.pickProduct('${esc(x.p === 'หลายสินค้า' ? '__multi' : x.p)}')"><td class="l">${x.p === 'หลายสินค้า' ? 'คำสั่งซื้อที่มีหลายสินค้า ' + tip('มีสินค้ามากกว่า 1 ชนิด (ไม่นับของแถม)') : esc(x.name || x.p) + ` <span class="sub mono">${esc(x.p)}</span>`}</td>
          <td>${n0(x.n)}</td><td>${n0(x.rev)}</td><td class="pf ${+x.profit < 0 ? 'neg' : ''}">${n0(x.profit)}</td><td class="${+x.profit < 0 ? 'neg' : ''}">${pc(+x.profit, +x.rev)}</td>
          <td class="${+x.profit < 0 ? 'neg' : ''}">${x.n ? n2(x.profit / x.n) : '—'}</td><td>${pc(+x.loss, +x.n)} <span class="sub">(${n0(x.loss)})</span></td></tr>`).join('')
        : '<tr><td colspan="7" class="l z">ไม่มีข้อมูล</td></tr>') + '</tbody></table></div>';
  }
  function sortProd(key) { if (!PSORT[key]) return; if (S.psort === key) S.pdir = S.pdir === 'asc' ? 'desc' : 'asc'; else { S.psort = key; S.pdir = key === 'name' ? 'asc' : 'desc'; } drawProducts(); }

  async function drawOrders() {
    // ตารางเดิมยังแสดงระหว่างโหลด (ถ้ามุมมองเดียวกัน) และล็อกความสูงไว้ แทนการล้างเป็นแถว "กำลังโหลด…" ที่ทำให้หน้าเด้ง
    const _old = shell().querySelector('#opBody'), _sc = _old && _old.querySelector('.op-scroll'), _prevH = _sc ? _sc.offsetHeight : 0, _prevRows = _old && _old.querySelector('#opRows') && S._rowsView === S.view ? _old.querySelector('#opRows').innerHTML : '';
    const box = shell().querySelector('#opBody');
    box.innerHTML = `<div class="op-tools"><div class="op-seg" id="opFilt"><button type="button" data-v="all">ทั้งหมด</button><button type="button" data-v="loss">ขาดทุน</button><button type="button" data-v="refund">คืนเงิน</button><button type="button" data-v="pending">เงินยังไม่เข้า</button></div>
      <select id="opSku"><option value="">สินค้า: ทั้งหมด</option><option value="__multi"${S.sku === '__multi' ? ' selected' : ''}>คำสั่งซื้อที่มีหลายสินค้า</option>${((S.both[S.ch] || {}).products || []).filter(x => x.p !== 'หลายสินค้า').sort((a, b) => String(a.name || a.p).localeCompare(String(b.name || b.p), 'th')).map(x => `<option value="${esc(x.p)}"${S.sku === x.p ? ' selected' : ''}>${esc(x.name || x.p)} (${esc(x.p)})</option>`).join('')}</select>
      <input type="search" id="opQ" placeholder="ค้นหาเลขคำสั่งซื้อ / รหัส SKU" style="width:200px;" value="${esc(S.q)}">
      <span class="op-leg2" style="margin-left:auto;"><span><i class="op-dot ok"></i>เงินเข้าแล้ว</span><span><i class="op-dot w"></i>เงินยังไม่เข้า</span><span>ตัวเลขขีดเส้นใต้: กดดูที่มา</span></span>
      <div class="op-seg" id="opView"><button type="button" data-v="sum">สรุป</button><button type="button" data-v="det">ละเอียด</button></div></div>
      <div class="op-scroll"><table class="op-t" data-no-sort data-no-page><thead id="opHead"></thead><tbody id="opRows"><tr><td colspan="20" class="l z">กำลังโหลด…</td></tr></tbody></table></div><div class="op-pg" id="opPg"></div>`;
    box.querySelectorAll('#opFilt button').forEach(b => { b.classList.toggle('on', b.dataset.v === S.filter); b.onclick = () => { S.filter = b.dataset.v; S.page = 0; drawOrders(); }; });
    box.querySelectorAll('#opView button').forEach(b => { b.classList.toggle('on', b.dataset.v === S.view); b.onclick = () => { if (S.view === b.dataset.v) return; S.view = b.dataset.v; drawOrders(); }; });
    box.querySelector('#opSku').onchange = e => { S.sku = e.target.value; S.page = 0; loadRows(); };
    let tm; box.querySelector('#opQ').oninput = e => { clearTimeout(tm); tm = setTimeout(() => { S.q = e.target.value.trim(); S.page = 0; loadRows(); }, 350); };
    const det = S.view === 'det';   // ละเอียด: เพิ่มรายละเอียดยอดขาย 3 คอลัมน์ + ค่าธรรมเนียมแยก 5 หมวด
    const so = (key, l, t, cls) => `<th class="${cls || ''}${key ? ' s' + (S.sort === key ? ' on' : '') : ''}"${key ? ` onclick="OrdProfit.sortBy('${key}')"` : ''}>${l}${t ? ' ' + tip(t) : ''}${S.sort === key ? (S.dir === 'asc' ? ' ▲' : ' ▼') : ''}</th>`;
    box.querySelector('#opHead').innerHTML = `<tr class="g"><th class="stk"></th><th colspan="2"></th>${det ? '<th class="gs" colspan="4">ยอดขาย</th><th class="gf" colspan="6">ค่าธรรมเนียมแพลตฟอร์ม</th>' : '<th colspan="2"></th>'}<th></th><th class="gc" colspan="3">ต้นทุนของบริษัท</th><th class="pfh" colspan="2"></th></tr>
      <tr>${so('order_date', 'คำสั่งซื้อ', 'จุดเขียว: เงินเข้าแล้ว · จุดแดง: เงินยังไม่เข้า (ค่าธรรมเนียมเป็นค่าประมาณการ) · จุดเทา: คืนเงินเต็มจำนวน · กดแถวเพื่อดูรายละเอียด', 'l stk')}<th class="l">SKU ${tip('รหัสสินค้าในคำสั่งซื้อ รวมของแถม')}</th>
        <th class="l">สถานะ ${tip('สถานะคำสั่งซื้อจาก API ของแพลตฟอร์ม')}</th>${det ? so('orig', 'ราคาก่อนส่วนลด', 'ราคาสินค้าก่อนส่วนลดของร้าน', 's') + so('sdisc', 'ส่วนลดร้าน', 'ส่วนลดและโค้ดที่ร้านออก', 's') + so('bship', 'ค่าส่งผู้ซื้อจ่าย', 'ค่าจัดส่งที่ผู้ซื้อชำระ', 's') : ''}${so('rev', 'ยอดขาย', 'ราคาก่อนส่วนลด − ส่วนลดร้าน + ค่าส่งผู้ซื้อจ่าย − คืนเงิน · รวม VAT', 's sum')}
        ${det ? CATS.map(c => `<th class="f">${CAT_S[c]} ${tip(CAT[c] + ': ' + CAT_TIP[c])}</th>`).join('') : ''}${so('fees', det ? 'รวม' : 'ค่าธรรมเนียม', 'ยอดขาย − รายรับสุทธิ', 'f sum')}
        ${so('settle', 'รายรับสุทธิ', 'ยอดที่แพลตฟอร์มโอนให้ร้าน ตามข้อมูลจาก API')}
        ${so('vat', 'VAT', 'รายรับสุทธิ × 7/107 (ภาษีขายหักภาษีซื้อในค่าธรรมเนียม)', 'c')}${so('cogs', 'ต้นทุนขาย', 'จำนวนชิ้น × ต้นทุนต่อชิ้นของเดือน · รวมของแถม', 'c')}
        ${so('ads', 'Ads + Coins', 'ค่าโฆษณาจริงจากแพลตฟอร์ม รวม Coins และ Ads PR · แบ่งตามสัดส่วนยอดขายของสินค้า', 'c')}
        ${so('profit', 'กำไร', 'รายรับสุทธิ − VAT − ต้นทุนขาย − Ads + Coins · ไม่รวมค่าการตลาดอื่นและค่าใช้จ่ายบริหาร', 'sum pfh')}${so('pct', '%', 'กำไร ÷ ยอดขาย', 'pfh2')}</tr>`;
    const gh = box.querySelector('#opHead tr.g'); if (gh) box.querySelector('table.op-t').style.setProperty('--op-gh', gh.getBoundingClientRect().height + 'px');
    if (_prevRows) box.querySelector('#opRows').innerHTML = _prevRows;
    if (_prevH > 120) box.querySelector('.op-scroll').style.minHeight = _prevH + 'px';
    S._rowsView = S.view;
    loadRows();
  }

  async function loadRows() {
    const box = shell().querySelector('#opBody'), body = box.querySelector('#opRows');
    if (!body) return;
    const sc = box.querySelector('.op-scroll'); if (sc && sc.offsetHeight > 120) sc.style.minHeight = sc.offsetHeight + 'px';   // ล็อกความสูงไว้ระหว่างโหลด ตารางไม่ยุบ
    busy(1);
    try { S.list = await rpc('order_profit_list', { p_ch: S.ch, p_from: S.from, p_to: S.to, p_sort: S.sort, p_dir: S.dir, p_offset: S.page * S.size, p_limit: S.size, p_filter: S.filter, p_q: S.q || null, p_sku: S.sku || null, p_shop: S.ch === 'Shopee' ? S.shop : null }); }
    catch (e) { busy(-1); body.innerHTML = `<tr><td colspan="19" class="l z">โหลดไม่สำเร็จ: ${esc(e.message)}</td></tr>`; return; }
    busy(-1); if (sc) requestAnimationFrame(() => { sc.style.minHeight = ''; });
    const rows = (S.list && S.list.rows) || [], total = (S.list && S.list.total) || 0;
    const det = S.view === 'det';
    const v = x => Math.abs(+x || 0) < 0.005 ? '<span class="z">—</span>' : n2(x);
    const cu = (id, x, what) => Math.abs(+x || 0) < 0.005 ? '<span class="z">—</span>' : `<span class="u" title="กดดูที่มาของตัวเลขนี้" onclick="event.stopPropagation();OrdProfit.openCell('${esc(id)}','${what}')">${n2(x)}</span>`;
    body.innerHTML = rows.length ? rows.map(r => {
      const [id, d, skus, rev, fees, settle, cogs, , prof, settled, refund, est, nocost, , cComm, cSvc, cPay, cAff, cOth, vat, pack, ads, , , st, orig, sdisc, bship, rfo, shop, items] = r;
      const dot = refund ? ['r', 'คืนเงินเต็มจำนวน'] : settled ? ['ok', 'เงินเข้าแล้ว'] : ['w', 'เงินยังไม่เข้า'];
      return `<tr onclick="OrdProfit.openOrder('${esc(id)}')"><td class="l stk"><span class="op-dot ${dot[0]}" data-tip="${dot[1]}"></span><span class="mono">${esc(id)}</span><div class="sub">${dLabel(d)}${S.ch === 'Shopee' && !S.shop && SHOPS_S[shop] ? ' · ' + SHOPS_S[shop] : ''}</div></td>
        <td class="l">${skuCell(items, skus)}</td>
        <td class="l">${esc(ST_TH[st] || st || '—')}</td>
        ${det ? `<td class="s">${v(orig)}</td><td class="s">${Math.abs(+sdisc || 0) < 0.005 ? '<span class="z">—</span>' : '−' + n2(sdisc)}</td><td class="s">${v(bship)}</td>` : ''}
        <td class="s sum">${n2(rev)}${Math.abs(+rfo || 0) >= 0.01 ? `<div class="sub">หักคืนเงิน ${n2(rfo)}</div>` : ''}</td>${det ? `<td class="f">${v(cComm)}</td><td class="f">${v(cSvc)}</td><td class="f">${v(cPay)}</td><td class="f">${v(cAff)}</td><td class="f">${v(cOth)}</td>` : ''}<td class="f sum">${n2(fees)}</td>
        <td>${n2(settle)}</td><td class="c">${v(vat)}</td><td class="c">${cu(id, cogs, 'cogs')}</td>
        <td class="c">${cu(id, ads, 'ads')}</td>
        <td class="pf pfc ${+prof < 0 ? 'neg' : ''}">${n2(prof)}</td><td class="pfc2 ${+prof < 0 ? 'neg' : ''}">${pc(+prof, +rev)}</td></tr>`; }).join('')
      : '<tr><td colspan="19" class="l z">ไม่มีคำสั่งซื้อตามเงื่อนไขนี้</td></tr>';
    const pages = Math.max(1, Math.ceil(total / S.size));
    box.querySelector('#opPg').innerHTML = `<span>แสดง</span><select onchange="OrdProfit.setSize(this.value)">${[25, 50, 100].map(x => `<option value="${x}"${S.size === x ? ' selected' : ''}>${x}</option>`).join('')}</select><span>รายการ</span><span style="margin-left:8px;">${n0(total)} คำสั่งซื้อ · หน้า ${S.page + 1} / ${n0(pages)}</span><button type="button" ${S.page <= 0 ? 'disabled' : ''} onclick="OrdProfit.go(-1)">‹ ก่อนหน้า</button><button type="button" ${S.page >= pages - 1 ? 'disabled' : ''} onclick="OrdProfit.go(1)">ถัดไป ›</button>`;
  }

  // รายการเงินของคำสั่งซื้อ จัดกลุ่มแบบ Seller Centre: ค่าจัดส่ง → ค่าธรรมเนียม (แต่ละรายการมีคำอธิบาย ⓘ และ % ของยอดขาย)
  function feeBlock(o, fees, rev) {
    const ch = o.ch || S.ch, ship = /shipping|reverse_shipping|return_to_seller|lost_compensation/;
    const row = ([k, x]) => { const [l, t] = feeOf(ch, k);
      let tt = t; if (ch === 'Shopee' && k === 'commission_fee' && rev > 0) tt += ` · คำสั่งซื้อนี้ ${(Math.abs(x) / rev * 100).toFixed(2)}%`;
      if (ch === 'Shopee' && k === 'transaction_fee' && o.payment_method) tt += ` · คำสั่งซื้อนี้: ${o.payment_method}`;
      if (ch === 'Shopee' && k === 'service_fee' && rev > 0) tt += ` · คำสั่งซื้อนี้ ${(Math.abs(x) / rev * 100).toFixed(2)}%`;
      return `<div class="tr-ln"><span class="tr-sg">${x < 0 ? '−' : '+'}</span><div class="tr-lb">${esc(l)}${tt ? ' ' + tip(tt) : ''}<div class="tr-ref">${pc(Math.abs(x), rev)} ของยอดขาย</div></div><div class="tr-num">${n2(Math.abs(x))}</div></div>`; };
    const grp = (title, list) => list.length ? `<div class="tr-ref" style="margin:8px 0 2px;font-weight:700;color:var(--text2);">${title}</div>` + list.map(row).join('') : '';
    const shipL = fees.filter(([k]) => ship.test(k)), feeL = fees.filter(([k]) => !ship.test(k) && k !== 'other' && k !== 'adjustment_amount'), othL = fees.filter(([k]) => k === 'other' || k === 'adjustment_amount');
    const ord = c => CATS.indexOf(CAT_OF(c[0]));
    return grp('ค่าจัดส่ง', shipL) + grp('ค่าธรรมเนียม', feeL.sort((a, b) => ord(a) - ord(b) || Math.abs(b[1]) - Math.abs(a[1]))) + grp('อื่น ๆ', othL);
  }
  // กดตัวเลข: แสดงเฉพาะที่มาของตัวเลขนั้น (ตารางอ่านง่าย · แหล่งข้อมูลไว้ล่างสุด)
  const PX_CSS = `<style>
    .opx-t { width:100%; border-collapse:collapse; font-size:12.5px; table-layout:fixed; }
    .opx-t td, .opx-t th { white-space:nowrap; } .opx-t td:first-child { white-space:normal; }
    .opx-t.st td:first-child { width:68%; }
    .opx-t.opx-w td, .opx-t.opx-w th { font-size:12px; padding:6px 4px; } .opx-t.opx-w th { white-space:normal; }
    .opx-t th { font-size:11px; color:var(--text3); font-weight:600; text-align:right; padding:6px 6px; border-bottom:1px solid var(--border); }
    .opx-t td { text-align:right; padding:7px 6px; border-bottom:1px solid var(--border); font-variant-numeric:tabular-nums; vertical-align:top; }
    .opx-t th:first-child, .opx-t td:first-child { text-align:left; }
    .opx-t tr.tot td { font-weight:800; border-bottom:0; background:rgba(184,134,47,.08); }
    .opx-t tr.op td { color:var(--text2); } .opx-t td .s { display:block; font-size:10.5px; color:var(--text3); font-weight:400; }
    .opx-note { font-size:11.5px; color:var(--text2); margin:2px 0 8px; line-height:1.55; }
    .opx-h { font-size:12.5px; font-weight:700; margin:0 0 6px; display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
    .opx-sub { font-size:11px; font-weight:400; color:var(--text3); }
    .opx-sku { display:inline-block; font-family:'IBM Plex Mono', monospace; font-size:10.5px; color:var(--text3); background:rgba(127,127,127,.08); border-radius:4px; padding:0 5px; margin-left:6px; }
    .opx-seg { display:flex; flex-wrap:wrap; gap:6px; margin:2px 0 10px; }
    .opx-seg button { font:inherit; font-size:12px; border:1px solid var(--border); background:var(--bg2); color:var(--text2); border-radius:15px; padding:4px 12px; cursor:pointer; }
    .opx-seg button.on { border-color:var(--accent, #b8862f); color:var(--text); font-weight:700; background:rgba(184,134,47,.08); }
    .opx-pane { display:none; } .opx-pane.on { display:block; }
  </style>`;
  async function openCell(id, what) {
    const T = { cogs: 'ต้นทุนขาย', ads: 'Ads + Coins', mkt: 'ค่าการตลาดอื่น', oh: 'ค่าใช้จ่ายบริหาร' };
    window.trOpenShell(T[what] || 'ที่มาของตัวเลข');
    let j;
    try { j = await rpc('order_profit_detail', { p_ch: S.ch, p_order: id }); if (!j || !j.o) throw new Error('ไม่พบคำสั่งซื้อ'); }
    catch (e) { const b = document.getElementById('trBody'); if (b) b.innerHTML = `<div class="tr-warn">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    const o = j.o, names = j.names || {}, rates = j.rates || [], mo = mLabel(String(o.order_date).slice(0, 7));
    const val = { cogs: +o.cogs || 0, ads: +o.ads || 0, mkt: (+o.mkt_direct || 0) + (+o.mkt_other || 0), oh: +o.overhead || 0 }[what];
    let h = PX_CSS + `<div class="tr-card"><div class="tr-card-t">${T[what]} · ${esc(S.ch)} · <span class="mono">${esc(o.order_id)}</span>${what === 'cogs' ? '' : ' ' + tip(what === 'ads' ? 'ยอดขายของแต่ละสินค้าในคำสั่งซื้อ × อัตรา Ads ทั้งเดือนของสินค้านั้น' : 'ยอดทั้งเดือน ÷ ยอดขายทั้งเดือน × ยอดขายคำสั่งซื้อนี้')}</div><div class="tr-card-v">${n2(val)}</div>
      <div class="tr-card-m"><span>${dLabel(o.order_date)} ${+String(o.order_date).slice(0, 4) + 543}</span><span>${pc(val, +o.rev)} ของยอดขาย</span></div></div>`;
    let src = [];
    if (what === 'cogs') {
      const cl = o.cogs_lines || [];
      h += `<div class="tr-fg">` + (o.full_refund ? '<div class="opx-note">คืนเงินเต็มจำนวน สินค้ากลับเข้าคลัง จึงไม่นับต้นทุน</div>'
        : `<table class="opx-t" data-no-sort data-no-page><thead><tr><th style="width:46%;">สินค้า</th><th>ต้นทุน/ชิ้น</th><th>จำนวน</th><th>รวม</th></tr></thead><tbody>`
          + cl.map(x => `<tr><td>${esc(names[x[0]] || x[0])}${x[3] ? ' <span class="op-tag">ของแถม</span>' : ''}<span class="s mono">${esc(x[0])}</span></td><td>${n2(x[2])}</td><td>${n0(x[1])}</td><td>${n2(x[1] * x[2])}</td></tr>`).join('')
          + `<tr class="tot"><td>รวมต้นทุนขาย</td><td></td><td>${n0(cl.reduce((t, x) => t + (+x[1] || 0), 0))}</td><td>${n2(val)}</td></tr></tbody></table>`) + `</div>`;
      src = [['ต้นทุนต่อชิ้น', `ไฟล์ต้นทุนขายของฝ่ายบัญชี · เดือน ${mo}`], ['จำนวนชิ้น', `คำสั่งซื้อจาก ${S.ch} API (รวมของแถม)`]];
      if (o.cost_fallback) src.push(['หมายเหตุ', `บางรายการไม่มีในไฟล์เดือน ${mo} ใช้ต้นทุนจากหน้าสินค้า & ราคา`]);
      if (o.no_cost) src.push(['หมายเหตุ', 'มีสินค้าที่ยังไม่มีต้นทุน นับเป็น 0']);
    } else {
      const op = !!j.open, biM = rates.length && rates[0].m ? mLabel(String(rates[0].m).slice(0, 7)) : mo, many = rates.length > 1;
      const fac = (act, raw) => raw && n2(raw) !== n2(act) ? act / raw : 1;   // ถ้าไม่ใส่ตัวปรับแล้วผลลัพธ์ไม่ตรงตัวเลขในตาราง (รวมเศษสตางค์) → แสดงแถวตัวปรับ
      const lab = (l, t) => t ? `${l} ${tip(t)}` : l;
      // หนึ่งส่วน: หัวข้อ (+ ป้ายประมาณการ) → ยอดทั้งเดือน ÷ ยอดขายทั้งเดือน × ยอดขายคำสั่งซื้อนี้ (× ตัวปรับ) = ผลลัพธ์
      const block = (title, ht, est, r, amt, amtL, revAll, revT, mine, mineT, f, fT) => {
        const v = (revAll ? amt / revAll : 0) * mine * f;
        return [v, `<div class="tr-fg"><div class="opx-h">${lab(title, ht)}${est ? ' <span class="op-tag">ประมาณการ</span>' : ''}${many ? ` <span class="opx-sub">${esc(r.name || r.p)}</span>` : ''}</div>
          <table class="opx-t st" data-no-sort data-no-page><tbody>
            <tr class="op"><td>${amtL}</td><td>${n2(amt)}</td></tr>
            <tr class="op"><td>${lab('÷ ยอดขายทั้งเดือน', revT)}</td><td>${n2(revAll)}<span class="s">= ${revAll ? (amt / revAll * 100).toFixed(2) : '0.00'}%</span></td></tr>
            <tr class="op"><td>${lab('× ยอดขายคำสั่งซื้อนี้', mineT)}</td><td>${n2(mine)}</td></tr>
            ${f !== 1 ? `<tr class="op"><td>${lab('× ตัวปรับ', fT)}</td><td>${f.toFixed(Math.abs(f - 1) < 0.00005 ? 6 : 4)}</td></tr>` : ''}
            <tr class="tot"><td>= ${title}</td><td>${n2(v)}</td></tr></tbody></table></div>`]; };
      const exV = r => `ก่อนภาษี = ${n2(r.rs)} ÷ 1.07`;
      const BI_FT = 'ปรับให้ยอดรวมทุกคำสั่งซื้อเท่ากับ Business Insight';
      // ส่วนจาก Business Insight (เดือนปิดแล้ว / ประมาณการจากเดือนล่าสุดที่ปิด)
      const biPart = (title, ht, est, key, amtOf, act) => {
        const L = rates.filter(r => +amtOf(r)), f = fac(act, L.reduce((t, r) => t + (r.bi_rev ? amtOf(r) / r.bi_rev : 0) * r.rs / 1.07, 0));
        if (!L.length) return [0, `<div class="tr-fg"><div class="opx-h">${lab(title, ht)}</div><div class="opx-note">ไม่มีรายการนี้ใน ${S.ch} เดือน ${biM}</div></div>`];
        let t = 0; const html = L.map(r => { const [v, b] = block(title, ht, est, r, amtOf(r), `${title} ทั้งเดือน ${biM}`, r.bi_rev, `ยอดขายก่อนภาษีของสินค้านี้บน ${S.ch}`, r.rs / 1.07, exV(r), f, BI_FT); t += v; return b; }).join('');
        return [t, html]; };
      const blocks = [], parts = [];
      if (what === 'ads') {
        // (2026-10-27) แผง Ads + Coins: สรุปตามสินค้า (มีแถวรวมของคำสั่งซื้อ) → ที่มาของอัตรา Ads แต่ละสินค้า (ปุ่มเลือกสินค้า แทนการ์ดเรียงยาวตามจำนวนสินค้า)
        // ทุกเดือนใช้ค่าโฆษณาจริง แยกตามที่มา: Product Ads ของสินค้าเอง + ก้อนที่ไม่ระบุสินค้า (แบ่งตามยอดขายในช่องทาง) + Ads PR (แบ่งตามยอดขายทุกช่องทาง)
        const PL = { direct: ['Product Ads ของสินค้านี้', 'จาก API · ผูกกับสินค้านี้โดยตรง'],
          api_rest: [S.ch === 'Shopee' ? 'Shopee Ads ที่ไม่ระบุสินค้า' : 'TikTok Ads ที่ไม่ระบุสินค้า', S.ch === 'Shopee' ? 'จาก Shopee API · ไม่ระบุสินค้า' : 'จาก TikTok API · ไม่ระบุสินค้า ไม่รวมบัญชี PR'],
          live_gmv: ['GMV Max LIVE', 'จาก TikTok API · แบ่งตามยอดขายจากไลฟ์'], 'Meta in-app': ['Meta in-app ผ่าน Shopee', 'จาก Seller Centre'],
          CPAS: ['CPAS (Meta)', 'จาก Meta API'], Live: ['Shopee Live', 'จาก Seller Centre'], Brand: ['Brand Ads', 'จาก Seller Centre'], Coins: ['Coins', 'จาก Seller Centre'],
          shopee_sheet: ['Shopee Ads ร้าน 24hr', 'จากชีท Ads Daily Reports'],
          direct_nosale: ['Product Ads ของสินค้าที่เดือนนั้นไม่มียอดขาย', 'ไม่มีคำสั่งซื้อให้ลง จึงแบ่งให้สินค้าที่ขายตามยอดขายในช่องทาง (ค่า Ads ไม่หาย)'],
          pr_fb: ['Ads PR · Facebook', 'จาก Meta API · แบ่งให้ทุกช่องทางตามยอดขาย'],
          pr_tt: ['Ads PR · TikTok', 'จาก TikTok API · แบ่งให้ทุกช่องทางตามยอดขาย'] };
        let raw = 0;
        rates.forEach(r => { const P = r.ads_parts || []; r._P = P;
          r._at = P.length ? P.reduce((t, x) => t + (+x.amt || 0), 0) : +r.sa_ads || 0; r._ar = P.length ? +P[0].rev || 0 : +r.sa_rev || 0;
          r._rate = r._ar ? r._at / r._ar : 0; raw += r._rate * (+r.rs || 0); });
        const f = fac(val, raw), adj = Math.abs(f - 1) >= 0.00005, revO = rates.reduce((t, r) => t + (+r.rs || 0), 0);
        const pname = r => esc(r.name || names[r.p] || r.p), skuT = r => `<span class="opx-sku">${esc(r.p)}</span>`, per = mo + (j.open ? ' ถึงวันนี้' : '');
        blocks.push(`<div class="tr-fg"><div class="opx-h">สรุปตามสินค้า</div>
          <table class="opx-t opx-w" data-no-sort data-no-page><thead><tr><th style="width:40%;">สินค้า</th><th>ยอดขายในคำสั่งซื้อ</th><th>อัตรา Ads ทั้งเดือน ${tip('Ads + Coins ทั้งเดือนของสินค้า ÷ ยอดขายทั้งเดือนของสินค้า')}</th><th>Ads + Coins</th></tr></thead><tbody>`
          + rates.map(r => `<tr class="op"><td>${pname(r)}${skuT(r)}</td><td>${n2(r.rs)}</td><td>${r._ar ? (r._rate * 100).toFixed(2) + '%' : '—'}</td><td>${n2(r._rate * (+r.rs || 0) * f)}</td></tr>`).join('')
          + `<tr class="tot"><td>รวมคำสั่งซื้อนี้</td><td>${n2(revO)}</td><td>${revO ? (val / revO * 100).toFixed(2) + '%' : '—'}</td><td>${n2(val)}</td></tr></tbody></table>
          <div class="opx-note" style="margin-top:6px;">อัตรา Ads ทั้งเดือน = Ads + Coins ทั้งเดือนของสินค้า ÷ ยอดขายทั้งเดือนของสินค้า (${esc(S.ch)} ${per}) · ยอดขาย = ราคาหลังหักส่วนลดร้านค้า${adj ? ` · รวมตัวปรับ × ${f.toFixed(4)} ${tip(`ปรับให้ผลรวมทุกคำสั่งซื้อเท่ากับค่าโฆษณาจริงของ ${S.ch} ทั้งเดือน`)}` : ''}</div></div>`);
        const det = rates.filter(r => r._ar > 0 || r._P.length);
        if (det.length) blocks.push(`<div class="tr-fg"><div class="opx-h">${det.length > 1 ? 'ที่มาของอัตรา Ads แต่ละสินค้า' : 'ที่มาของอัตรา Ads'}</div>`
          + (det.length > 1 ? `<div class="opx-seg" id="opxSeg">${det.map((r, i) => `<button type="button" class="${i ? '' : 'on'}" onclick="OrdProfit.adsPane(${i})">${pname(r)} · ${esc(r.p)}</button>`).join('')}</div>` : '')
          + det.map((r, i) => `<div class="opx-pane${i ? '' : ' on'}" data-i="${i}">
              <table class="opx-t st" data-no-sort data-no-page><tbody>
                <tr class="op"><td>${lab('Ads + Coins ทั้งเดือนของสินค้านี้', `${S.ch} ${per}`)}</td><td>${n2(r._at)}</td></tr>
                <tr class="op"><td>÷ ยอดขายทั้งเดือนของสินค้านี้</td><td>${n2(r._ar)}</td></tr>
                <tr class="tot"><td>= อัตรา Ads ทั้งเดือน</td><td>${(r._rate * 100).toFixed(2)}%</td></tr></tbody></table>`
            + (r._P.length ? `<table class="opx-t opx-w" style="margin-top:10px;" data-no-sort data-no-page><thead><tr><th style="width:38%;">ที่มา</th><th style="width:23%;">ยอดทั้งเดือน</th><th style="width:16%;">ส่วนของสินค้านี้ ${tip(`ยอดขายสินค้านี้ ÷ ยอดขายทั้งหมดบน ${S.ch} · Ads PR: ÷ ยอดขายทุกช่องทาง`)}</th><th style="width:23%;">Ads + Coins</th></tr></thead><tbody>`
              + r._P.map(x => { const [l, t] = PL[x.k] || [x.k, '']; return `<tr class="op"><td>${lab(l, t)}</td><td>${n2(x.pool)}</td><td>${x.k === 'direct' ? 'ทั้งหมด' : ((+x.share || 0) * 100).toFixed(2) + '%'}</td><td>${n2(x.amt)}</td></tr>`; }).join('')
              + `<tr class="tot"><td>รวม</td><td></td><td></td><td>${n2(r._at)}</td></tr></tbody></table>` : '')
            + `</div>`).join('') + `</div>`);
        src = [['Ads + Coins', 'API ของแพลตฟอร์มและ Seller Centre · ชุดเดียวกับ MKT Tracking'], ['Ads PR', 'Meta API และ TikTok API · แบ่งให้ทุกช่องทางตามยอดขาย'], ['ยอดขาย', `${S.ch} API · ราคาหลังหักส่วนลดร้านค้า`]];
      } else if (what === 'mkt' && op) {
        const kraw = rates.reduce((t, r) => t + (r.sk_rev ? r.sk_kol / r.sk_rev : 0) * r.rs, 0), eraw = rates.reduce((t, r) => t + (r.bi_rev ? ((+r.bi_dir || 0) - (+r.bi_kol || 0)) / r.bi_rev : 0) * r.rs / 1.07, 0);
        const fd = fac(+o.mkt_direct || 0, kraw + eraw);
        let kt = 0; rates.forEach(r => { const [v, b] = block('KOL', 'งบจริงจากไฟล์ทีม KOL · คิดต่อยอดขายทุกช่องทาง', false, r, +r.sk_kol || 0, `งบ KOL ทั้งเดือน ${mo}`, +r.sk_rev || 0, 'ยอดขายของสินค้านี้ทุกช่องทาง', +r.rs, '', fd, BI_FT); kt += v; blocks.push(b); });
        const [et, eb] = biPart('Presenter และอื่น ๆ', `ยังไม่มีตัวเลข ${mo} ใช้อัตรา ${biM} · ไม่รวม KOL`, true, 'dir', r => (+r.bi_dir || 0) - (+r.bi_kol || 0), (+o.mkt_direct || 0) - kt);
        blocks.push(eb);
        const [lt, lb] = biPart('Live · Brand', `ยังไม่มีตัวเลข ${mo} ใช้อัตรา ${biM}`, true, 'oth', r => +r.bi_oth || 0, +o.mkt_other || 0);
        blocks.push(lb);
        parts.push(['KOL', kt], ['Presenter และอื่น ๆ', et], ['Live · Brand', lt]);
        src = [['KOL', 'ไฟล์ทีม KOL (ชุดเดียวกับ MKT Tracking)'], ['Presenter · Live · Brand', `Business Insight · ${biM} (ประมาณการ)`]];
      } else if (what === 'mkt') {
        const [dt, db] = biPart('KOL · Presenter', '', false, 'dir', r => +r.bi_dir || 0, +o.mkt_direct || 0);
        const [lt, lb] = biPart('Live · Brand', '', false, 'oth', r => +r.bi_oth || 0, +o.mkt_other || 0);
        blocks.push(db, lb); parts.push(['KOL · Presenter', dt], ['Live · Brand', lt]);
        src = [['ค่าใช้จ่ายทั้งเดือน', `Business Insight (งบฝ่ายบัญชี) · ${biM}`]];
      } else {
        const key = what, title = T[what];
        const [, b] = biPart(title, op ? `ยังไม่มีตัวเลข ${mo} ใช้อัตรา ${biM}` : '', op, key, r => +r['bi_' + key] || 0, val);
        blocks.push(b);
        src = [['ค่าใช้จ่ายทั้งเดือน', `Business Insight (งบฝ่ายบัญชี) · ${biM}${op ? ' (ประมาณการ)' : ''}`]];
      }
      h += blocks.join('');
      if (parts.length) h += `<div class="tr-fg"><table class="opx-t st" data-no-sort data-no-page><tbody>` + parts.map(([l, v]) => `<tr class="op"><td>${l}</td><td>${n2(v)}</td></tr>`).join('')
        + `<tr class="tot"><td>รวม${T[what]}</td><td>${n2(val)}</td></tr></tbody></table></div>`;
      if (op && what !== 'ads') src.push(['หมายเหตุ', `บัญชียังไม่ปิดเดือน ${mo} · ปิดแล้วจะเปลี่ยนเป็นงบบัญชีเอง`]);
    }
    h += `<div class="tr-src"><div class="tr-src-h">แหล่งข้อมูล</div><dl class="tr-dl">${src.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl></div>`;
    const b = document.getElementById('trBody'); if (b) b.innerHTML = h;
  }
  function adsPane(i) { const b = document.getElementById('trBody'); if (!b) return; b.querySelectorAll('#opxSeg button').forEach((x, k) => x.classList.toggle('on', k === i)); b.querySelectorAll('.opx-pane').forEach(p => p.classList.toggle('on', +p.dataset.i === i)); }
  async function openOrder(id, focus) {
    window.trOpenShell('รายละเอียดคำสั่งซื้อ');
    let j;
    try { j = await rpc('order_profit_detail', { p_ch: S.ch, p_order: id }); if (!j || !j.o) throw new Error('ไม่พบคำสั่งซื้อ'); }
    catch (e) { const b = document.getElementById('trBody'); if (b) b.innerHTML = `<div class="tr-warn">โหลดไม่สำเร็จ: ${esc(e.message)}</div>`; return; }
    const o = j.o, names = j.names || {}, rev = +o.rev || 0;
    const ln = (sg, lb, v, sub) => `<div class="tr-ln"><span class="tr-sg">${sg}</span><div class="tr-lb">${lb}${sub ? `<div class="tr-ref">${sub}</div>` : ''}</div><div class="tr-num">${v}</div></div>`;
    const fees = Object.entries(o.fee_items || {}).filter(([, x]) => Math.abs(+x) >= 0.005);
    const byc = {}; fees.forEach(([kk, x]) => { const c = CAT_OF(kk); (byc[c] = byc[c] || []).push([kk, +x]); });
    const feeSum = fees.reduce((t, [, x]) => t + (+x), 0);
    let h = `<div class="tr-card"><div class="tr-card-t">${esc(S.ch)} · ${esc(o.order_id)}</div><div class="tr-card-v" style="${+o.profit < 0 ? 'color:var(--red);' : ''}">${n2(o.profit)} <span style="font-size:14px;font-weight:600;">กำไร</span></div>
      <div class="tr-card-m"><span>${dLabel(o.order_date)} ${+String(o.order_date).slice(0, 4) + 543}</span><span>อัตรากำไร ${pc(+o.profit, rev)}</span><span>${o.settled ? 'เงินเข้าแล้ว' : 'เงินยังไม่เข้า'}</span>${o.full_refund ? '<span>คืนเงินเต็มจำนวน</span>' : ''}</div></div>`;
    h += `<div class="tr-fg"${focus ? '' : ''}><div class="tr-fg-h"><span>① ยอดขาย → รายรับสุทธิ</span><span class="tr-ref">${S.ch === 'TikTok' ? 'TikTok Finance API 202501' : 'Shopee API (escrow)'}</span></div>`
      + ln('', 'ราคาก่อนส่วนลด', n2(o.orig))
      + (Math.abs(+o.sdisc || 0) >= 0.005 ? ln('−', 'ส่วนลดร้าน', n2(o.sdisc)) : '')
      + (Math.abs(+o.bship || 0) >= 0.005 ? ln('+', 'ค่าส่งที่ผู้ซื้อจ่าย', n2(o.bship)) : '')
      + (Math.abs(+o.refund_other || 0) >= 0.01 ? ln('−', 'คืนเงิน / อื่น ๆ', n2(o.refund_other)) : '')
      + `<div class="tr-eq"><span>ยอดขาย</span><b>${n2(rev)}</b></div>`
      + (fees.length ? feeBlock(o, fees, rev) : ln('−', 'ค่าธรรมเนียมแพลตฟอร์มรวม', n2(o.fees)))
      + (fees.length && Math.abs(rev + feeSum - (+o.settle || 0)) >= 0.05 ? `<div class="tr-warn">ผลรวมรายการไม่เท่ารายรับสุทธิ (ต่าง ${n2(rev + feeSum - (+o.settle || 0))})</div>` : '')
      + `<div class="tr-eq"><span>รายรับสุทธิ${o.settled ? '' : ' (ประมาณการ)'}</span><b>${n2(o.settle)}</b></div></div>`;
    const rates = j.rates || [], est = o.estimate ? ` · ประมาณการ (อัตรา ${j.bi_last ? mLabel(String(j.bi_last).slice(0, 7)) : 'เดือนล่าสุด'})` : '';
    const cl = o.cogs_lines || [];
    h += `<div class="tr-fg" id="opFocusCost"><div class="tr-fg-h"><span>② ต้นทุนของบริษัท</span><span class="tr-ref">ไฟล์ต้นทุน · ค่าโฆษณาจริงจากแพลตฟอร์ม</span></div>`
      + ln('−', 'ภาษีมูลค่าเพิ่ม', n2(o.vat), `รายรับสุทธิ ${n2(o.settle)} × 7/107 (ภาษีขายหักภาษีซื้อในค่าธรรมเนียม)`)
      + ln('−', 'ต้นทุนขาย', n2(o.cogs), o.full_refund ? 'คืนเงินเต็มจำนวน สินค้ากลับเข้าคลัง ไม่นับต้นทุน' : cl.map(x => `${esc(names[x[0]] || x[0])} <span class="mono">${esc(x[0])}</span> ${n0(x[1])} ชิ้น × ${n2(x[2])}${x[3] ? ' (ของแถม)' : ''}`).join('<br>'))
      + ln('−', 'Ads + Coins', n2(o.ads), rates.filter(r => +r.sa_rev).map(r => `${esc(r.name || r.p)}: ${(r.sa_ads / r.sa_rev * 100).toFixed(2)}% × ยอดขาย ${n2(r.rs)} (ค่าโฆษณาจริง ${mLabel(String(o.order_date).slice(0, 7))})`).join('<br>') + '<br>กดตัวเลข Ads + Coins ในตารางเพื่อดูที่มา')
      + `<div class="tr-eq"><span>กำไร (หักถึง Ads + Coins)</span><b style="${+o.profit < 0 ? 'color:var(--red);' : ''}">${n2(o.profit)}</b></div></div>`;
    h += `<div class="tr-src"><div class="tr-src-h">แหล่งข้อมูล</div><dl class="tr-dl"><dt>ค่าธรรมเนียม</dt><dd>${S.ch === 'TikTok' ? 'TikTok Shop Finance API รุ่น 202501 รายการเงินรายคำสั่งซื้อ' : 'Shopee API ข้อมูลเงินที่จะโอนรายคำสั่งซื้อ (escrow)'}</dd>
      <dt>ต้นทุนขาย</dt><dd>ไฟล์ต้นทุนขายของฝ่ายบัญชี (ต้นทุนต่อชิ้นของเดือนนั้น)</dd><dt>Ads + Coins</dt><dd>API ของแพลตฟอร์มและ Seller Centre · แบ่งตามยอดขายของสินค้า</dd></dl></div>`;
    const b = document.getElementById('trBody'); if (b) { b.innerHTML = h; if (focus) { const x = b.querySelector('#opFocusCost'); if (x) x.scrollIntoView({ block: 'start' }); } }
  }

  window.OrdProfit = {
    render, adsPane, sortProd,
    pickCh(c) { if (c === S.ch) return; S.ch = c; S.page = 0; S.q = ''; S.sku = ''; drawTop(); drawTab(); },
    sortBy(k) { if (S.sort === k) S.dir = S.dir === 'asc' ? 'desc' : 'asc'; else { S.sort = k; S.dir = k === 'order_date' ? 'desc' : 'asc'; } S.page = 0; drawOrders(); },
    go(d) { S.page = Math.max(0, S.page + d); loadRows(); },
    setSize(n) { S.size = Math.min(100, Math.max(25, +n || 50)); S.page = 0; loadRows(); },
    pickProduct(p) { S.sku = p; S.q = ''; S.page = 0; S.tab = 'orders'; drawTab(); },
    openOrder, openCell,
    toggleCat(c, tr) { const open = tr.dataset.open !== '1'; tr.dataset.open = open ? '1' : '';
      const car = tr.querySelector('.op-car'); if (car) car.textContent = open ? '▾' : '▸';
      shell().querySelectorAll(`#opCat tr.op-sub[data-c="${c}"]`).forEach(x => { x.style.display = open ? '' : 'none'; }); }
  };
})();
