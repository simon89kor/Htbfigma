import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const app = new Hono();

app.use("/*", cors({
  origin: "*",
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["POST", "OPTIONS"],
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
// 알림 타입별 템플릿
// ─────────────────────────────────────────────
interface NotificationTemplate {
  icon: string;
  titleTemplate: string;
  messageTemplate: string;
  deepLinkTemplate: string;
}

const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  // 스케줄 관련
  routine_reminder: {
    icon: "bell",
    titleTemplate: "루틴 알림",
    messageTemplate: "오늘의 {routine_title} 루틴을 확인하세요!",
    deepLinkTemplate: "/board",
  },
  streak_alert: {
    icon: "flame",
    titleTemplate: "스트릭 위기!",
    messageTemplate: "{streak_days}일 연속 달성 중이에요! 오늘도 루틴을 완료해주세요.",
    deepLinkTemplate: "/board",
  },
  routine_expiry: {
    icon: "clock",
    titleTemplate: "루틴 만료 예정",
    messageTemplate: '"{routine_title}" 루틴이 {days_left}일 후 만료됩니다.',
    deepLinkTemplate: "/board",
  },
  // 커뮤니티 관련
  like: {
    icon: "heart",
    titleTemplate: "좋아요",
    messageTemplate: "{actor_name}님이 회원님의 게시물을 좋아합니다.",
    deepLinkTemplate: "/community/{post_id}",
  },
  comment: {
    icon: "message-circle",
    titleTemplate: "댓글",
    messageTemplate: '{actor_name}님이 댓글을 남겼습니다: "{comment_preview}"',
    deepLinkTemplate: "/community/{post_id}",
  },
  follow: {
    icon: "user-plus",
    titleTemplate: "새 팔로워",
    messageTemplate: "{actor_name}님이 회원님을 팔로우합니다.",
    deepLinkTemplate: "/mypage/{actor_id}",
  },
  // 구매 관련
  purchase_complete: {
    icon: "shopping-bag",
    titleTemplate: "구매 완료",
    messageTemplate: '"{routine_title}" 루틴을 구매했습니다. 오늘부터 시작해보세요!',
    deepLinkTemplate: "/board",
  },
  refund_complete: {
    icon: "credit-card",
    titleTemplate: "환불 완료",
    messageTemplate: '"{routine_title}" 루틴의 환불이 완료되었습니다.',
    deepLinkTemplate: "/mypage/purchase-history",
  },
  // 시스템 관련
  badge_earned: {
    icon: "award",
    titleTemplate: "뱃지 획득!",
    messageTemplate: '"{badge_name}" 뱃지를 획득했습니다!',
    deepLinkTemplate: "/mypage",
  },
  challenge_start: {
    icon: "flag",
    titleTemplate: "챌린지 시작",
    messageTemplate: '"{challenge_title}" 챌린지가 시작되었습니다!',
    deepLinkTemplate: "/reward",
  },
  system_notice: {
    icon: "info",
    titleTemplate: "공지사항",
    messageTemplate: "{message}",
    deepLinkTemplate: "/",
  },
};

// ─────────────────────────────────────────────
// 템플릿 변수 치환 함수
// ─────────────────────────────────────────────
function applyTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return result;
}

// ─────────────────────────────────────────────
// 알림 타입 → type 매핑
// ─────────────────────────────────────────────
function getNotificationType(subType: string): string {
  const mapping: Record<string, string> = {
    routine_reminder: "schedule",
    streak_alert: "schedule",
    routine_expiry: "schedule",
    like: "community",
    comment: "community",
    follow: "community",
    purchase_complete: "purchase",
    refund_complete: "purchase",
    badge_earned: "system",
    challenge_start: "system",
    system_notice: "system",
  };
  return mapping[subType] || "system";
}

// ─────────────────────────────────────────────
// 인터페이스
// ─────────────────────────────────────────────
interface SingleNotification {
  user_id: string;
  sub_type: string;
  variables?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

interface BulkNotification {
  user_ids: string[];
  sub_type: string;
  variables?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// POST /send-notification (단일 알림)
// ─────────────────────────────────────────────
app.post("/send-notification", async (c) => {
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

    const body: SingleNotification = await c.req.json();
    const { user_id, sub_type, variables = {}, metadata = {} } = body;

    if (!user_id || !sub_type) {
      return c.json({ error: "user_id와 sub_type은 필수입니다." }, 400);
    }

    const template = NOTIFICATION_TEMPLATES[sub_type];
    if (!template) {
      return c.json({ error: `알 수 없는 알림 타입입니다: ${sub_type}` }, 400);
    }

    const admin = getServiceClient();

    // 수신자의 알림 설정 확인
    const notifType = getNotificationType(sub_type);
    const { data: profile } = await admin
      .from("profiles")
      .select("notification_schedule, notification_community, notification_marketing")
      .eq("id", user_id)
      .single();

    if (profile) {
      const settingMap: Record<string, boolean> = {
        schedule: profile.notification_schedule,
        community: profile.notification_community,
        purchase: true, // 구매 알림은 항상 발송
        system: true,   // 시스템 알림은 항상 발송
      };

      if (!settingMap[notifType]) {
        return c.json({ success: true, skipped: true, reason: "알림 수신 거부" });
      }
    }

    const title = applyTemplate(template.titleTemplate, variables);
    const message = applyTemplate(template.messageTemplate, variables);
    const deepLink = applyTemplate(template.deepLinkTemplate, variables);

    const { data: notification, error: insertError } = await admin
      .from("notifications")
      .insert({
        user_id,
        type: notifType,
        sub_type,
        title,
        message,
        icon: template.icon,
        deep_link: deepLink,
        metadata,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Notification insert failed:", insertError);
      return c.json({ error: "알림 생성에 실패했습니다." }, 500);
    }

    return c.json({ success: true, notification_id: notification.id });
  } catch (err) {
    console.error("Error in send-notification:", err);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

// ─────────────────────────────────────────────
// POST /send-notification/bulk (대량 알림)
// ─────────────────────────────────────────────
app.post("/send-notification/bulk", async (c) => {
  try {
    // 인증 확인 (admin 또는 시스템 호출만 허용)
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const userClient = getUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return c.json({ error: "유효하지 않은 인증입니다." }, 401);
    }

    // admin 권한 확인
    const admin = getServiceClient();
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return c.json({ error: "관리자 권한이 필요합니다." }, 403);
    }

    const body: BulkNotification = await c.req.json();
    const { user_ids, sub_type, variables = {}, metadata = {} } = body;

    if (!user_ids || user_ids.length === 0 || !sub_type) {
      return c.json({ error: "user_ids 배열과 sub_type은 필수입니다." }, 400);
    }

    if (user_ids.length > 1000) {
      return c.json({ error: "한 번에 최대 1000명까지 발송할 수 있습니다." }, 400);
    }

    const template = NOTIFICATION_TEMPLATES[sub_type];
    if (!template) {
      return c.json({ error: `알 수 없는 알림 타입입니다: ${sub_type}` }, 400);
    }

    const notifType = getNotificationType(sub_type);
    const title = applyTemplate(template.titleTemplate, variables);
    const message = applyTemplate(template.messageTemplate, variables);
    const deepLink = applyTemplate(template.deepLinkTemplate, variables);

    const notifications = user_ids.map((uid: string) => ({
      user_id: uid,
      type: notifType,
      sub_type,
      title,
      message,
      icon: template.icon,
      deep_link: deepLink,
      metadata,
    }));

    // 배치 삽입 (500개씩)
    const BATCH_SIZE = 500;
    let totalCreated = 0;
    let totalFailed = 0;

    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      const { data, error } = await admin
        .from("notifications")
        .insert(batch)
        .select("id");

      if (error) {
        console.error(`Bulk notification batch ${i} failed:`, error);
        totalFailed += batch.length;
      } else {
        totalCreated += data.length;
      }
    }

    return c.json({
      success: true,
      total_requested: user_ids.length,
      total_created: totalCreated,
      total_failed: totalFailed,
    });
  } catch (err) {
    console.error("Error in send-notification/bulk:", err);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

// Health check
app.get("/send-notification/health", (c) => {
  return c.json({ status: "ok", function: "send-notification" });
});

Deno.serve(app.fetch);
