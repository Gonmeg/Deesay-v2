// Edge Function: tiktok-organic
// หน้าที่ตอนนี้: "ตัวสำรวจ" — ต่ออายุ token ให้อัตโนมัติ แล้วยิงถาม TikTok ว่าให้ข้อมูลอะไรเราได้บ้าง
//                ยังไม่เขียนอะไรลงตารางข้อมูล (นอกจากอัปเดต token) — ดูผลก่อนแล้วค่อยตัดสินใจว่าจะเก็บอะไร
//
// deploy แบบปิดการตรวจ JWT (เรียกจากเบราว์เซอร์ได้):
//   supabase functions deploy tiktok-organic --no-verify-jwt
//
// วิธีใช้ (ต่อท้าย URL):
//   ?mode=token   → เช็คว่า token ยังไม่หมดอายุ และต่ออายุให้ถ้าใกล้หมด
//   ?mode=account → ข้อมูลบัญชี ผู้ติดตาม คนเข้าดูโปรไฟล์   (/business/get/)
//   ?mode=videos  → รายชื่อคลิปทั้งหมดของช่อง               (/business/video/list/)
//   ?mode=sync    → เก็บลงตารางจริง (tiktok_videos / tiktok_account_daily / tiktok_account_profile)
//   ?mode=all     → สำรวจทั้งหมดโดยไม่เขียนอะไร (ค่าเริ่มต้น)
//   เพิ่ม &days=30 เพื่อเปลี่ยนช่วงวันที่ (ค่าเริ่มต้น 30 วัน)
//
// Secrets ที่ใช้: TIKTOK_APP_ID, TIKTOK_APP_SECRET (ชุดเดียวกับ tiktok-account-auth)

import { createClient } from "npm:@supabase/supabase-js@2";

const SB = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const pick = (...names: string[]) => { for (const n of names) { const v = Deno.env.get(n); if (v) return v; } return ""; };
const APP_ID = pick("TIKTOK_APP_ID", "TIKTOK_CLIENT_KEY", "TT_APP_ID", "TIKTOK_BUSINESS_APP_ID");
const APP_SECRET = pick("TIKTOK_APP_SECRET", "TIKTOK_CLIENT_SECRET", "TT_APP_SECRET", "TIKTOK_BUSINESS_APP_SECRET");

const BASE = "https://business-api.tiktok.com/open_api/v1.3";
const REFRESH_URL = `${BASE}/tt_user/oauth2/refresh_token/`;

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};
function json(obj: unknown, status = 200) {
  const h = new Headers();
  h.set("content-type", "application/json; charset=utf-8");
  h.set("cache-control", "no-store");
  Object.entries(CORS).forEach(([k, v]) => h.set(k, v));
  return new Response(new TextEncoder().encode(JSON.stringify(obj, null, 2)), { status, headers: h });
}

// ---------- token ----------
async function getUser() {
  const { data, error } = await SB.from("tiktok_tt_users").select("*").order("updated_at", { ascending: false }).limit(1);
  if (error) throw new Error("อ่านตาราง tiktok_tt_users ไม่ได้: " + error.message);
  if (!data || !data.length) throw new Error("ยังไม่มี token ในตาราง tiktok_tt_users — ต้องกดลิงก์ authorization ก่อน");
  return data[0];
}

async function refreshToken(u: any) {
  // ใช้รูปแบบเดียวกับตอนแลก token ครั้งแรกที่สำเร็จ (client_id / client_secret)
  const bodies = [
    { client_id: APP_ID, client_secret: APP_SECRET, grant_type: "refresh_token", refresh_token: u.refresh_token },
    { app_id: APP_ID, secret: APP_SECRET, grant_type: "refresh_token", refresh_token: u.refresh_token },
  ];
  const tried: any[] = [];
  for (const b of bodies) {
    const res = await fetch(REFRESH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
    const j = await res.json();
    tried.push({ http: res.status, reply_code: j?.code, reply_message: j?.message });
    const d = j?.data ?? (j?.access_token ? j : null);
    if (d?.access_token) {
      const now = Date.now();
      const row = {
        open_id: u.open_id,
        access_token: d.access_token,
        refresh_token: d.refresh_token ?? u.refresh_token,
        scope: Array.isArray(d.scope) ? d.scope.join(",") : (d.scope ?? u.scope),
        expires_at: d.expires_in ? new Date(now + Number(d.expires_in) * 1000).toISOString() : null,
        // TikTok ใช้ชื่อ refresh_token_expires_in (ไม่ใช่ refresh_expires_in)
        refresh_expires_at: (d.refresh_token_expires_in ?? d.refresh_expires_in)
          ? new Date(now + Number(d.refresh_token_expires_in ?? d.refresh_expires_in) * 1000).toISOString() : null,
        raw: d,
        updated_at: new Date().toISOString(),
      };
      await SB.from("tiktok_tt_users").upsert(row, { onConflict: "open_id" });
      return { ok: true, expires_at: row.expires_at, refresh_expires_at: row.refresh_expires_at, tried };
    }
  }
  return { ok: false, tried };
}

async function ensureToken() {
  let u = await getUser();
  const left = u.expires_at ? (new Date(u.expires_at).getTime() - Date.now()) / 3600000 : -1;
  let refreshed: any = null;
  if (left < 6) {                       // เหลือน้อยกว่า 6 ชั่วโมง → ต่ออายุเลย
    refreshed = await refreshToken(u);
    if (refreshed.ok) u = await getUser();
  }
  return { u, hours_left: Math.round(left * 10) / 10, refreshed };
}

// ---------- เรียก API ----------
async function call(path: string, token: string, params: Record<string, string>) {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { "Access-Token": token } });
  const j = await res.json();
  return { http: res.status, url: url.toString().replace(/Access-Token[^&]*/, ""), reply: j };
}

// ชื่อช่องที่ TikTok ยอมรับจริง (ได้มาจากข้อความ error รอบแรก)
const ACCOUNT_FIELDS = ["display_name", "username", "profile_image", "is_business_account", "is_verified",
  "bio_description", "followers_count", "following_count", "videos_count", "total_likes",
  "daily_new_followers", "daily_lost_followers", "daily_total_followers", "followers_growth_rate",
  "profile_views", "video_views", "unique_video_views", "likes", "comments", "shares",
  "engagement_rate", "completion_rate", "average_views", "average_likes", "average_comments", "average_shares",
  "audience_countries", "audience_cities", "audience_genders", "audience_ages", "audience_activity",
  "bio_link_clicks", "profile_deep_link"];
const VIDEO_FIELDS = ["item_id", "create_time", "thumbnail_url", "share_url", "embed_url", "caption",
  "video_views", "likes", "comments", "shares", "reach", "full_video_watched_rate",
  "total_time_watched", "average_time_watched", "impression_sources", "audience_countries"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });   // เบราว์เซอร์ถามสิทธิ์ก่อนเรียกจริง
  const t0 = Date.now();
  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "all";
  const days = parseInt(url.searchParams.get("days") || "30");

  try {
    if (!APP_ID || !APP_SECRET) return json({ result: "ยังไม่ได้ตั้ง secret TIKTOK_APP_ID / TIKTOK_APP_SECRET" }, 500);

    const { u, hours_left, refreshed } = await ensureToken();
    const token = u.access_token;
    const bizId = u.open_id;

    const out: any = {
      token_status: {
        open_id: bizId,
        เหลืออีกกี่ชั่วโมง: hours_left,
        หมดอายุ: u.expires_at,
        refresh_หมดอายุ: u.refresh_expires_at,
        ต่ออายุรอบนี้: refreshed ? (refreshed.ok ? "สำเร็จ" : "ไม่สำเร็จ") : "ยังไม่ถึงเวลา",
        ต่ออายุ_รายละเอียด: refreshed?.tried ?? null,
      },
    };
    if (mode === "token") return json(out);

    const end = new Date(Date.now() - 86400000);                       // เมื่อวาน — TikTok ไม่รับวันนี้
    // ฝั่งข้อมูลบัญชี TikTok ให้ช่วงละไม่เกิน ~30 วัน (คลิปไม่จำกัด ใช้ days เต็ม)
    const accDays = Math.min(days, 30);
    const start = new Date(Date.now() - (accDays + 1) * 86400000);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const writing = mode === "sync";

    if (mode === "account" || mode === "all" || writing) {
      out.account = await call("/business/get/", token, {
        business_id: bizId,
        fields: JSON.stringify(ACCOUNT_FIELDS),
        start_date: fmt(start), end_date: fmt(end),
      });
      out.account_range = { start: fmt(start), end: fmt(end) };
    }

    if (writing) {
      const d = out.account?.reply?.data;
      if (d) {
        await SB.from("tiktok_account_profile").upsert({
          open_id: bizId, username: d.username, display_name: d.display_name,
          bio_description: d.bio_description, profile_image: d.profile_image, profile_deep_link: d.profile_deep_link,
          followers_count: d.followers_count, following_count: d.following_count,
          videos_count: d.videos_count, total_likes: d.total_likes,
          audience_ages: d.audience_ages, audience_genders: d.audience_genders,
          audience_countries: d.audience_countries, audience_cities: d.audience_cities,
          updated_at: new Date().toISOString(),
        }, { onConflict: "open_id" });

        const rows = (d.metrics ?? [])
          .filter((m: any) => m.date && (m.followers_count || m.video_views))   // ตัดวันที่ยังไม่มีข้อมูล
          .map((m: any) => ({
            stat_date: m.date,
            followers_count: m.followers_count, daily_new_followers: m.daily_new_followers,
            daily_lost_followers: m.daily_lost_followers,
            daily_net_followers: (m.daily_new_followers ?? 0) - (m.daily_lost_followers ?? 0),
            profile_views: m.profile_views, video_views: m.video_views, unique_video_views: m.unique_video_views,
            likes: m.likes, comments: m.comments, shares: m.shares, bio_link_clicks: m.bio_link_clicks,
            audience_activity: m.audience_activity, updated_at: new Date().toISOString(),
          }));
        if (rows.length) {
          const { error } = await SB.from("tiktok_account_daily").upsert(rows, { onConflict: "stat_date" });
          out.saved_account_daily = error ? "ผิดพลาด: " + error.message : rows.length + " วัน";
        }
      }
      if (!out.saved_account_daily) out.saved_account_daily = "ไม่ได้บันทึก — " + (out.account?.reply?.message ?? "ไม่มีข้อมูลส่งกลับมา");
      // ไม่ต้องโชว์ข้อมูลดิบก้อนใหญ่ตอนเก็บจริง
      delete out.account;
    }

    if (mode === "videos" || mode === "all" || writing) {
      // ไล่ทีละหน้าจนหมด (หรือจนถึงเพดานกันวน)
      const maxPages = parseInt(url.searchParams.get("pages") || "80");
      const cutoff = Math.floor((Date.now() - days * 86400000) / 1000);   // ดึงย้อนหลังแค่ตามช่วงที่ขอ
      let cursor: string | null = null, pages = 0;
      const seen = new Set<string>();
      const all: any[] = []; let last: any = null; const pageLog: any[] = [];
      while (pages < maxPages) {
        const params: Record<string, string> = { business_id: bizId, fields: JSON.stringify(VIDEO_FIELDS), max_count: "20" };
        if (cursor) params.cursor = cursor;
        const r = await call("/business/video/list/", token, params);
        last = r; pages++;
        const d = r.reply?.data;
        const list = d?.videos ?? d?.list ?? null;
        const before = all.length;
        if (Array.isArray(list)) {
          for (const v of list) { const id = String(v.item_id); if (!seen.has(id)) { seen.add(id); all.push(v); } }
        }
        pageLog.push({
          หน้าที่: pages, ได้มา: Array.isArray(list) ? list.length : null, ใหม่จริง: all.length - before,
          has_more: d?.has_more ?? null, cursor_ที่ส่งกลับ: d?.cursor ?? null,
          ช่องใน_data: d ? Object.keys(d) : null, code: r.reply?.code, message: r.reply?.message,
        });
        // หน้าที่ไม่มีคลิปเลยก็ต้องเดินต่อ — TikTok เดินทีละช่วงเวลา บางช่วงไม่มีคลิป
        if (!d?.has_more) break;
        const next = d?.cursor ?? d?.next_cursor ?? d?.page_cursor ?? null;
        if (next === null || next === undefined || String(next) === "" || String(next) === cursor) break;
        cursor = String(next);
        // cursor เป็นเวลาแบบมิลลิวินาที — ถ้าย้อนเลยช่วงที่ขอแล้วก็หยุด
        if (Number(cursor) > 1000000000000 && Number(cursor) / 1000 < cutoff) break;
      }
      const oldest = all.length ? Math.min(...all.map(v => Number(v.create_time || 0))) : null;
      out.videos = {
        reply_code: last?.reply?.code,
        reply_message: last?.reply?.message,
        จำนวนคลิปทั้งหมดที่ดึงได้: all.length,
        จำนวนหน้าที่ไล่: pages,
        ยังมีต่อไหม: last?.reply?.data?.has_more ?? null,
        คลิปเก่าสุดที่ได้: oldest ? new Date(oldest * 1000).toISOString().slice(0, 10) : null,
        ช่องที่ได้มา: all.length ? Object.keys(all[0]) : null,
        ไล่ทีละหน้า_สรุป: { หน้าที่มีคลิป: pageLog.filter(x => (x.ได้มา ?? 0) > 0).length, หน้าที่ว่าง: pageLog.filter(x => !x.ได้มา).length },
        ไล่ทีละหน้า_5หน้าสุดท้าย: pageLog.slice(-5),
        ตัวอย่าง_1_คลิป: all.length ? all[0] : null,
        คำตอบดิบ_ถ้าไม่สำเร็จ: (!all.length ? last?.reply : undefined),
      };

      if (writing && all.length) {
        const srcOf = (v: any, name: string) =>
          (v.impression_sources ?? []).find((x: any) => x.impression_source === name)?.percentage ?? null;
        const rows = all.map(v => ({
          item_id: String(v.item_id),
          create_time: v.create_time ? new Date(Number(v.create_time) * 1000).toISOString() : null,
          post_date: v.create_time ? new Date(Number(v.create_time) * 1000).toISOString().slice(0, 10) : null,
          caption: v.caption ?? null,
          thumbnail_url: v.thumbnail_url ?? null,
          share_url: v.share_url ?? null,
          embed_url: v.embed_url ?? null,
          video_views: v.video_views ?? 0, likes: v.likes ?? 0, comments: v.comments ?? 0,
          shares: v.shares ?? 0, reach: v.reach ?? 0,
          full_video_watched_rate: v.full_video_watched_rate ?? null,
          average_time_watched: v.average_time_watched ?? null,
          total_time_watched: v.total_time_watched ?? null,
          impression_sources: v.impression_sources ?? null,
          src_foryou: srcOf(v, "For You"), src_search: srcOf(v, "Search"),
          src_follow: srcOf(v, "Follow"), src_profile: srcOf(v, "Personal Profile"),
          raw: v, updated_at: new Date().toISOString(),
        }));
        let saved = 0;
        for (let i = 0; i < rows.length; i += 200) {
          const { error } = await SB.from("tiktok_videos").upsert(rows.slice(i, i + 200), { onConflict: "item_id" });
          if (error) { out.saved_videos = "ผิดพลาด: " + error.message; saved = -1; break; }
          saved += rows.slice(i, i + 200).length;
        }
        if (saved >= 0) out.saved_videos = saved + " คลิป";
        // เก็บแล้วไม่ต้องโชว์ก้อนใหญ่
        delete out.videos.ตัวอย่าง_1_คลิป;
        delete out.videos.ไล่ทีละหน้า_5หน้าสุดท้าย;
      }
    }

    // ---------- คอมเมนต์ของคลิป 30 วันล่าสุด + ค่าเฉลี่ยวงการ (เฉพาะตอนเก็บจริง) ----------
    if (writing) {
      // ค่าเฉลี่ยวงการความงาม
      try {
        const bEnd = new Date(Date.now() - 86400000), bStart = new Date(Date.now() - 31 * 86400000);
        const b = await call("/business/benchmark/", token, {
          business_id: bizId, business_category: "BEAUTY",
          start_date: bStart.toISOString().slice(0, 10), end_date: bEnd.toISOString().slice(0, 10),
        });
        const bd = b.reply?.data;
        if (bd) {
          await SB.from("tiktok_benchmark").upsert({
            stat_date: bEnd.toISOString().slice(0, 10),
            business_category: bd.business_category ?? "BEAUTY",
            average_engagement_rate: bd.average_engagement_rate,
            average_follower_count: bd.average_follower_count,
            average_follower_growth: bd.average_follower_growth,
            average_video_views: bd.average_video_views,
            average_likes: bd.average_likes, average_comments: bd.average_comments,
            average_shares: bd.average_shares, average_video_count: bd.average_video_count,
            updated_at: new Date().toISOString(),
          }, { onConflict: "stat_date" });
          out.saved_benchmark = "1 วัน";
        } else out.saved_benchmark = "ไม่ได้ — " + (b.reply?.message ?? "");
      } catch (e) { out.saved_benchmark = "ไม่ได้ — " + String(e); }

      // คอมเมนต์: เฉพาะคลิปที่โพสต์ใน 30 วันล่าสุด และมีคอมเมนต์อย่างน้อย 1
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const { data: recent, error: recErr } = await SB.from("tiktok_videos")
        .select("item_id, comments, post_date").gte("post_date", since).gt("comments", 0)
        .order("post_date", { ascending: false }).limit(120);
      out.comment_scan = {
        ตั้งแต่วันที่: since,
        คลิปที่มีคอมเมนต์: recent?.length ?? 0,
        error: recErr?.message ?? null,
        ตัวอย่าง: (recent ?? []).slice(0, 3),
      };
      let cRows: any[] = [], cClips = 0;
      for (const v of (recent ?? [])) {
        let cur: string | null = null, guard = 0;
        while (guard++ < 10) {
          const params: Record<string, string> = { business_id: bizId, video_id: String(v.item_id), max_count: "20" };
          if (cur) params.cursor = cur;
          const r = await call("/business/comment/list/", token, params);
          const d = r.reply?.data; const list = d?.comments;
          if (!Array.isArray(list)) {
            if (!out.comment_error) out.comment_error = { คลิป: String(v.item_id), code: r.reply?.code, message: r.reply?.message };
            break;
          }
          for (const c of list) {
            const mine = (c.reply_list ?? []).find((x: any) => x.owner === true);
            cRows.push({
              comment_id: String(c.comment_id), video_id: String(c.video_id ?? v.item_id),
              text: c.text ?? null, display_name: c.display_name ?? null, username: c.username ?? null,
              profile_image: c.profile_image ?? null, likes: c.likes ?? 0, replies: c.replies ?? 0,
              pinned: !!c.pinned, is_owner: !!c.owner,
              answered: !!mine, answered_at: mine?.create_time ? new Date(String(mine.create_time).replace(" ", "T") + "+00:00").toISOString() : null,
              our_reply: mine?.text ?? null,
              create_time: c.create_time ? new Date(Number(c.create_time) * 1000).toISOString() : null,
              comment_date: c.create_time ? new Date(Number(c.create_time) * 1000).toISOString().slice(0, 10) : null,
              raw: c, updated_at: new Date().toISOString(),
            });
          }
          if (!d?.has_more) break;
          cur = String(d.cursor ?? ""); if (!cur) break;
        }
        cClips++;
      }
      if (cRows.length) {
        let ok = 0;
        for (let i = 0; i < cRows.length; i += 200) {
          const { error } = await SB.from("tiktok_comments").upsert(cRows.slice(i, i + 200), { onConflict: "comment_id" });
          if (error) { out.saved_comments = "ผิดพลาด: " + error.message; ok = -1; break; }
          ok += cRows.slice(i, i + 200).length;
        }
        if (ok >= 0) out.saved_comments = ok + " คอมเมนต์ จาก " + cClips + " คลิป";
      } else out.saved_comments = "ไม่มีคอมเมนต์ที่ดึงได้ — ดู comment_scan ว่าเจอคลิปกี่คลิป";
    }

    out.ms = Date.now() - t0;
    return json(out);
  } catch (e) {
    return json({ result: "ไม่สำเร็จ", error: String((e as Error).message ?? e), ms: Date.now() - t0 }, 500);
  }
});
