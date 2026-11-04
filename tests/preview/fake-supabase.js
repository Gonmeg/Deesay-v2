// ตัวแทน supabase-js สำหรับเครื่องมือทำรูป (tests/preview) — ไม่ต่อ Supabase จริง ไม่มีข้อมูลบริษัท
// ล็อกอินเป็นบัญชีทดสอบเสมอ · rpc() / from() ส่งคำขอไปที่ URL เดิมของ Supabase แล้ว preview.py ตอบจากไฟล์ข้อมูลที่ดึงมาเฉพาะรอบ
(() => {
  const session = { access_token: 'preview', user: { email: 'preview@example.com' } };
  const rest = (path, init) => fetch(window.SUPABASE_URL + '/rest/v1/' + path, init).then(r => r.json()).then(data => ({ data, error: null }), e => ({ data: null, error: { message: String(e) } }));
  const query = table => {
    const p = new URLSearchParams(); let one = false;
    const add = (k, v) => { p.append(k, v); return q; };
    const q = {
      select: c => add('select', c || '*'), eq: (c, v) => add(c, 'eq.' + v), neq: (c, v) => add(c, 'neq.' + v), gt: (c, v) => add(c, 'gt.' + v), gte: (c, v) => add(c, 'gte.' + v),
      lt: (c, v) => add(c, 'lt.' + v), lte: (c, v) => add(c, 'lte.' + v), like: (c, v) => add(c, 'like.' + v), ilike: (c, v) => add(c, 'ilike.' + v), is: (c, v) => add(c, 'is.' + v),
      in: (c, v) => add(c, 'in.(' + v.map(x => '"' + x + '"').join(',') + ')'), order: () => q, limit: n => add('limit', n), range: (a, b) => { add('offset', a); return add('limit', b - a + 1); },
      not: () => q, or: () => q, filter: () => q, match: () => q,
      single: () => { one = true; return q; }, maybeSingle: () => { one = true; return q; },
      insert: async () => ({ data: null, error: null }), update: () => q, upsert: async () => ({ data: null, error: null }), delete: () => q,
      then: (res, rej) => rest(table + '?' + p.toString()).then(r => (one ? { data: Array.isArray(r.data) ? r.data[0] || null : r.data, error: r.error } : r)).then(res, rej),
    };
    return q;
  };
  window.supabase = {
    createClient: () => ({
      auth: {
        getSession: async () => ({ data: { session }, error: null }), getUser: async () => ({ data: { user: session.user }, error: null }),
        refreshSession: async () => ({ data: { session }, error: null }), signOut: async () => ({ error: null }),
        signInWithPassword: async () => ({ data: { session }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      rpc: (name, args) => rest('rpc/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) }),
      from: query,
      channel: () => ({ on() { return this; }, subscribe() { return this; } }), removeChannel() {},
    }),
  };
})();
