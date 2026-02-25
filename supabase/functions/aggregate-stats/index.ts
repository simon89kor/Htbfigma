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
// POST /aggregate-stats (cron 또는 admin 호출)
// 전체 유저 통계를 일괄 갱신
// ─────────────────────────────────────────────
app.post("/aggregate-stats", async (c) => {
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

    const results = {
      streaks_updated: 0,
      routines_expired: 0,
      completion_rates_updated: 0,
      expiry_notifications_sent: 0,
    };

    // ─── 1. 모든 활성 유저의 스트릭 업데이트 ───
    const { data: activeUsers, error: usersError } = await admin
      .from("profiles")
      .select("id")
      .eq("status", "active");

    if (usersError) {
      console.error("Failed to fetch active users:", usersError);
    } else if (activeUsers) {
      for (const profile of activeUsers) {
        const { error: streakError } = await admin.rpc("calculate_streak", {
          target_user_id: profile.id,
        });
        if (!streakError) {
          results.streaks_updated++;
        }
      }
    }

    // ─── 2. 만료된 루틴 자동 처리 ───
    const { data: expiredCount, error: expireError } = await admin.rpc("expire_overdue_routines");

    if (!expireError && expiredCount !== null) {
      results.routines_expired = expiredCount as number;
    }

    // ─── 3. 활성 루틴의 completion_rate 재계산 ───
    const { data: activeRoutines, error: routinesError } = await admin
      .from("user_routines")
      .select("id")
      .eq("status", "active");

    if (!routinesError && activeRoutines) {
      for (const ur of activeRoutines) {
        // 해당 user_routine의 todo 완료율 계산
        const { data: stats } = await admin
          .from("todo_items")
          .select("completed")
          .eq("user_routine_id", ur.id);

        if (stats && stats.length > 0) {
          const total = stats.length;
          const completed = stats.filter((t: { completed: boolean }) => t.completed).length;
          const rate = Math.round((completed / total) * 10000) / 100; // 소수점 둘째자리

          await admin
            .from("user_routines")
            .update({ completion_rate: rate })
            .eq("id", ur.id);

          results.completion_rates_updated++;
        }
      }
    }

    // ─── 4. 만료 임박 루틴 알림 (3일 전, 1일 전) ───
    const today = new Date();
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(today.getDate() + 3);
    const oneDayLater = new Date(today);
    oneDayLater.setDate(today.getDate() + 1);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // 3일 후 만료 루틴
    const { data: expiringIn3 } = await admin
      .from("user_routines")
      .select("id, user_id, title")
      .eq("status", "active")
      .eq("end_date", formatDate(threeDaysLater));

    if (expiringIn3) {
      for (const ur of expiringIn3) {
        await admin.from("notifications").insert({
          user_id: ur.user_id,
          type: "schedule",
          sub_type: "routine_expiry",
          title: "루틴 만료 예정",
          message: `"${ur.title}" 루틴이 3일 후 만료됩니다.`,
          icon: "clock",
          deep_link: "/board",
          metadata: { user_routine_id: ur.id, days_left: 3 },
        });
        results.expiry_notifications_sent++;
      }
    }

    // 1일 후 만료 루틴
    const { data: expiringIn1 } = await admin
      .from("user_routines")
      .select("id, user_id, title")
      .eq("status", "active")
      .eq("end_date", formatDate(oneDayLater));

    if (expiringIn1) {
      for (const ur of expiringIn1) {
        await admin.from("notifications").insert({
          user_id: ur.user_id,
          type: "schedule",
          sub_type: "routine_expiry",
          title: "루틴 만료 임박",
          message: `"${ur.title}" 루틴이 내일 만료됩니다!`,
          icon: "alert-circle",
          deep_link: "/board",
          metadata: { user_routine_id: ur.id, days_left: 1 },
        });
        results.expiry_notifications_sent++;
      }
    }

    return c.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    console.error("Error in aggregate-stats:", err);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

// ─────────────────────────────────────────────
// GET /aggregate-stats/user/:userId (개별 유저 통계)
// 특정 유저의 통계를 즉시 재계산
// ─────────────────────────────────────────────
app.get("/aggregate-stats/user/:userId", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const userClient = getUserClient(authHeader);
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return c.json({ error: "유효하지 않은 인증입니다." }, 401);
    }

    const targetUserId = c.req.param("userId");

    // 본인 또는 admin만 조회 가능
    if (user.id !== targetUserId) {
      const admin = getServiceClient();
      const { data: callerProfile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!callerProfile || callerProfile.role !== "admin") {
        return c.json({ error: "본인의 통계만 조회할 수 있습니다." }, 403);
      }
    }

    const admin = getServiceClient();

    // 스트릭 계산
    const { data: streakResult } = await admin.rpc("calculate_streak", {
      target_user_id: targetUserId,
    });

    // 주간 통계
    const { data: weeklyStats } = await admin.rpc("get_user_stats", {
      target_user_id: targetUserId,
      period: "week",
    });

    // 월간 통계
    const { data: monthlyStats } = await admin.rpc("get_user_stats", {
      target_user_id: targetUserId,
      period: "month",
    });

    // 활성 루틴 수
    const { count: activeRoutineCount } = await admin
      .from("user_routines")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("status", "active");

    // 획득 뱃지 수
    const { count: badgeCount } = await admin
      .from("user_badges")
      .select("id", { count: "exact", head: true })
      .eq("user_id", targetUserId);

    return c.json({
      success: true,
      data: {
        streak: streakResult,
        weekly: weeklyStats,
        monthly: monthlyStats,
        active_routines: activeRoutineCount || 0,
        badges_earned: badgeCount || 0,
      },
    });
  } catch (err) {
    console.error("Error in aggregate-stats/user:", err);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

// Health check
app.get("/aggregate-stats/health", (c) => {
  return c.json({ status: "ok", function: "aggregate-stats" });
});

Deno.serve(app.fetch);
