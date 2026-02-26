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
// 헬퍼: Supabase 클라이언트 (service_role)
// ─────────────────────────────────────────────
function getServiceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

// ─────────────────────────────────────────────
// 헬퍼: JWT에서 user_id 추출
// ─────────────────────────────────────────────
function getUserClient(authHeader: string) {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
}

// ─────────────────────────────────────────────
// 인터페이스
// ─────────────────────────────────────────────
interface ProcessPaymentRequest {
  routine_id: string;
  period_id: string;
  payment_method: string;
  idempotency_key?: string;
}

interface DayPlan {
  day: number;
  title: string;
  items: string[];
}

// ─────────────────────────────────────────────
// POST /process-payment
// ─────────────────────────────────────────────
app.post("/process-payment", async (c) => {
  try {
    // 1. 인증 확인
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

    // 2. 요청 파라미터 파싱
    const body: ProcessPaymentRequest = await c.req.json();
    const { routine_id, period_id, payment_method } = body;

    if (!routine_id || !period_id || !payment_method) {
      return c.json({ error: "필수 파라미터가 누락되었습니다. (routine_id, period_id, payment_method)" }, 400);
    }

    const validMethods = ["card", "kakao", "toss", "naver", "free"];
    if (!validMethods.includes(payment_method)) {
      return c.json({ error: `유효하지 않은 결제 수단입니다. (${validMethods.join(", ")})` }, 400);
    }

    const admin = getServiceClient();

    // 3. 멱등성 체크: 동일 루틴/기간 구매 중복 방지
    const { data: existingPurchase } = await admin
      .from("purchases")
      .select("id, status")
      .eq("user_id", userId)
      .eq("routine_id", routine_id)
      .eq("period_id", period_id)
      .in("status", ["pending", "completed"])
      .maybeSingle();

    if (existingPurchase) {
      // 멱등성: 이미 완료된 구매가 있으면 해당 구매 정보 반환 (에러가 아닌 성공 처리)
      if (body.idempotency_key && existingPurchase.status === "completed") {
        return c.json({
          success: true,
          data: { purchase_id: existingPurchase.id },
          idempotent: true,
        }, 200);
      }
      return c.json({
        error: "이미 구매한 루틴/기간 조합입니다.",
        purchase_id: existingPurchase.id,
      }, 409);
    }

    // 4. 서버에서 실제 가격 조회 (클라이언트 금액을 신뢰하지 않음)
    const { data: period, error: periodError } = await admin
      .from("routine_periods")
      .select("*, routines!routine_id(id, title, description, category, day_plans, duration_days, image_url, status)")
      .eq("id", period_id)
      .eq("routine_id", routine_id)
      .single();

    if (periodError || !period) {
      return c.json({ error: "유효하지 않은 루틴 또는 기간 옵션입니다." }, 404);
    }

    const routine = period.routines as {
      id: string;
      title: string;
      description: string;
      category: string;
      day_plans: DayPlan[];
      duration_days: number;
      image_url: string;
      status: string;
    };

    // 루틴이 published 상태인지 확인
    if (routine.status !== "published") {
      return c.json({ error: "현재 구매할 수 없는 루틴입니다." }, 400);
    }

    const amount = period.price;
    const originalPrice = period.original_price || period.price;
    const discount = originalPrice - amount;
    const finalAmount = amount;

    // 4-2. 무료/유료 결제 수단 검증
    if (finalAmount === 0 && payment_method !== "free") {
      return c.json({ error: "무료 루틴은 'free' 결제 수단을 사용해야 합니다." }, 400);
    }
    if (finalAmount > 0 && payment_method === "free") {
      return c.json({ error: "유료 루틴에는 'free' 결제 수단을 사용할 수 없습니다." }, 400);
    }

    // 5. 날짜 계산
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + period.days - 1);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // 6. purchases 레코드 생성
    const { data: purchase, error: purchaseError } = await admin
      .from("purchases")
      .insert({
        user_id: userId,
        routine_id: routine_id,
        period_id: period_id,
        period_label: period.label,
        period_days: period.days,
        amount: originalPrice,
        discount: discount,
        final_amount: finalAmount,
        payment_method: payment_method,
        status: "completed",
        purchased_at: new Date().toISOString(),
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      })
      .select()
      .single();

    if (purchaseError || !purchase) {
      console.error("Purchase creation failed:", purchaseError);
      return c.json({ error: "구매 레코드 생성에 실패했습니다." }, 500);
    }

    // 7. user_routines 레코드 생성
    const { data: userRoutine, error: urError } = await admin
      .from("user_routines")
      .insert({
        user_id: userId,
        routine_id: routine_id,
        purchase_id: purchase.id,
        title: routine.title,
        description: routine.description,
        category: routine.category,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        status: "active",
        is_custom: false,
        completion_rate: 0,
        day_plans: routine.day_plans,
      })
      .select()
      .single();

    if (urError || !userRoutine) {
      console.error("User routine creation failed:", urError);
      // 롤백: 구매 레코드를 cancelled로 변경
      await admin
        .from("purchases")
        .update({ status: "cancelled" })
        .eq("id", purchase.id);
      return c.json({ error: "루틴 활성화에 실패했습니다." }, 500);
    }

    // 8. todo_items 일괄 생성 (day_plans 기반)
    const dayPlans: DayPlan[] = routine.day_plans || [];
    const todoItems: Array<{
      user_routine_id: string;
      user_id: string;
      text: string;
      completed: boolean;
      day: number;
      scheduled_date: string;
      sort_order: number;
    }> = [];

    for (const plan of dayPlans) {
      // 구매 기간 내의 day만 생성
      if (plan.day > period.days) break;

      const scheduledDate = new Date(startDate);
      scheduledDate.setDate(scheduledDate.getDate() + plan.day - 1);

      plan.items.forEach((item: string, idx: number) => {
        todoItems.push({
          user_routine_id: userRoutine.id,
          user_id: userId,
          text: item,
          completed: false,
          day: plan.day,
          scheduled_date: formatDate(scheduledDate),
          sort_order: idx,
        });
      });
    }

    if (todoItems.length > 0) {
      // 배치 삽입 (최대 500개씩 분할)
      const BATCH_SIZE = 500;
      for (let i = 0; i < todoItems.length; i += BATCH_SIZE) {
        const batch = todoItems.slice(i, i + BATCH_SIZE);
        const { error: todoError } = await admin
          .from("todo_items")
          .insert(batch);

        if (todoError) {
          console.error(`Todo items batch ${i} insert failed:`, todoError);
          // 투두 생성 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
        }
      }
    }

    // 9. 구매 완료 알림 생성
    await admin
      .from("notifications")
      .insert({
        user_id: userId,
        type: "purchase",
        sub_type: "purchase_complete",
        title: "구매 완료",
        message: `"${routine.title}" 루틴을 구매했습니다. 오늘부터 시작해보세요!`,
        icon: "shopping-bag",
        deep_link: `/board`,
        metadata: {
          routine_id: routine_id,
          user_routine_id: userRoutine.id,
          purchase_id: purchase.id,
        },
      });

    // 10. 성공 응답
    return c.json({
      success: true,
      data: {
        purchase_id: purchase.id,
        user_routine_id: userRoutine.id,
        routine_title: routine.title,
        period_label: period.label,
        period_days: period.days,
        final_amount: finalAmount,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
        todo_items_created: todoItems.length,
      },
    }, 201);
  } catch (err) {
    console.error("Unexpected error in process-payment:", err);
    return c.json({ error: "서버 오류가 발생했습니다." }, 500);
  }
});

// Health check
app.get("/process-payment/health", (c) => {
  return c.json({ status: "ok", function: "process-payment" });
});

Deno.serve(app.fetch);
