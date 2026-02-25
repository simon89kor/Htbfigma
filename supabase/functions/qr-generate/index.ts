import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "GET", "OPTIONS"],
  maxAge: 600,
}));

// ─────────────────────────────────────────────
// 헬퍼
// ─────────────────────────────────────────────
function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function getUserClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

// ─────────────────────────────────────────────
// 고유 코드 생성 함수
// ─────────────────────────────────────────────
function generateUniqueCode(length = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    code += chars[array[i] % chars.length];
  }
  return code;
}

// ─────────────────────────────────────────────
// QR 코드 SVG 생성 (순수 서버사이드, 외부 의존 없음)
// Google Charts API를 활용한 QR URL 반환
// ─────────────────────────────────────────────
function generateQrUrl(data: string, size = 300): string {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=svg`;
}

// ─────────────────────────────────────────────
// POST /qr-generate (QR 코드 생성 + 공유 링크)
// ─────────────────────────────────────────────
app.post("/qr-generate", async (c) => {
  try {
    // 인증 확인
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const userClient = getUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return c.json({ error: "유효하지 않은 인증입니다." }, 401);
    }

    const userId = user.id;

    const body = await c.req.json();
    const { routine_id } = body;

    if (!routine_id) {
      return c.json({ error: "routine_id는 필수입니다." }, 400);
    }

    const admin = getServiceClient();

    // 루틴 존재 확인
    const { data: routine, error: routineError } = await admin
      .from("routines")
      .select("id, title, status")
      .eq("id", routine_id)
      .single();

    if (routineError || !routine) {
      return c.json({ error: "존재하지 않는 루틴입니다." }, 404);
    }

    if (routine.status !== "published") {
      return c.json({ error: "공유할 수 없는 루틴입니다." }, 400);
    }

    // 이미 생성된 QR 코드가 있는지 확인 (멱등성)
    const { data: existingQr } = await admin
      .from("qr_codes")
      .select("*")
      .eq("user_id", userId)
      .eq("routine_id", routine_id)
      .eq("is_active", true)
      .maybeSingle();

    if (existingQr) {
      // 기존 QR 코드 반환 + 공유 카운트 증가
      await admin
        .from("qr_codes")
        .update({
          shared_count: existingQr.shared_count + 1,
        })
        .eq("id", existingQr.id);

      const appUrl = Deno.env.get("APP_URL") || "https://howtobe.app";
      const shareUrl = `${appUrl}/share/${existingQr.code}`;

      return c.json({
        success: true,
        data: {
          qr_id: existingQr.id,
          code: existingQr.code,
          share_url: shareUrl,
          qr_image_url: generateQrUrl(shareUrl),
          routine_title: routine.title,
          shared_count: existingQr.shared_count + 1,
          is_new: false,
        },
      });
    }

    // 새 QR 코드 생성 (고유 코드 충돌 방지를 위한 재시도 로직)
    let code = "";
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (attempts < MAX_ATTEMPTS) {
      code = generateUniqueCode(8);
      const { data: collision } = await admin
        .from("qr_codes")
        .select("id")
        .eq("code", code)
        .maybeSingle();

      if (!collision) break;
      attempts++;
    }

    if (attempts >= MAX_ATTEMPTS) {
      return c.json({ error: "QR 코드 생성에 실패했습니다. 다시 시도해주세요." }, 500);
    }

    const { data: qrCode, error: insertError } = await admin
      .from("qr_codes")
      .insert({
        user_id: userId,
        routine_id: routine_id,
        code,
        shared_count: 1,
        is_active: true,
      })
      .select()
      .single();

    if (insertError || !qrCode) {
      console.error("QR code creation failed:", insertError);
      return c.json({ error: "QR 코드 생성에 실패했습니다." }, 500);
    }

    const appUrl = Deno.env.get("APP_URL") || "https://howtobe.app";
    const shareUrl = `${appUrl}/share/${code}`;

    return c.json({
      success: true,
      data: {
        qr_id: qrCode.id,
        code,
        share_url: shareUrl,
        qr_image_url: generateQrUrl(shareUrl),
        routine_title: routine.title,
        shared_count: 1,
        is_new: true,
      },
    }, 201);
  } catch (err) {
    console.error("Error in qr-generate:", err);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

// ─────────────────────────────────────────────
// GET /qr-generate/resolve/:code (QR 코드 → 루틴 정보 반환)
// 공개 엔드포인트 (인증 불필요 — 공유 링크 접근용)
// ─────────────────────────────────────────────
app.get("/qr-generate/resolve/:code", async (c) => {
  try {
    const code = c.req.param("code");

    if (!code) {
      return c.json({ error: "코드가 필요합니다." }, 400);
    }

    const admin = getServiceClient();

    const { data: qrCode, error } = await admin
      .from("qr_codes")
      .select(`
        id,
        routine_id,
        user_id,
        shared_count,
        is_active,
        routines!routine_id (
          id,
          title,
          description,
          image_url,
          category,
          price,
          rating,
          review_count,
          author_id,
          status
        )
      `)
      .eq("code", code)
      .single();

    if (error || !qrCode) {
      return c.json({ error: "유효하지 않은 공유 코드입니다." }, 404);
    }

    if (!qrCode.is_active) {
      return c.json({ error: "비활성화된 공유 코드입니다." }, 410);
    }

    const routine = qrCode.routines as {
      id: string;
      title: string;
      description: string;
      image_url: string;
      category: string;
      price: number;
      rating: number;
      review_count: number;
      author_id: string;
      status: string;
    };

    if (routine.status !== "published") {
      return c.json({ error: "현재 이용할 수 없는 루틴입니다." }, 400);
    }

    // 공유자 프로필
    const { data: sharer } = await admin
      .from("profiles")
      .select("nickname, avatar_url")
      .eq("id", qrCode.user_id)
      .single();

    return c.json({
      success: true,
      data: {
        routine: {
          id: routine.id,
          title: routine.title,
          description: routine.description,
          image_url: routine.image_url,
          category: routine.category,
          price: routine.price,
          rating: routine.rating,
          review_count: routine.review_count,
        },
        shared_by: sharer ? {
          nickname: sharer.nickname,
          avatar_url: sharer.avatar_url,
        } : null,
      },
    });
  } catch (err) {
    console.error("Error in qr-generate/resolve:", err);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

// Health check
app.get("/qr-generate/health", (c) => {
  return c.json({ status: "ok", function: "qr-generate" });
});

Deno.serve(app.fetch);
