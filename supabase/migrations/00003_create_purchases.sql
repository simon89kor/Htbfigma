-- ============================================================================
-- Migration 00003: Purchases, User Routines, Todo Items, Todo Sub Items
-- HTB Project - Database Schema
-- ============================================================================
-- purchases: 구매 내역
-- user_routines: 유저의 활성 루틴 (구매 or 커스텀)
-- todo_items: 투두 아이템 (체크리스트)
-- todo_sub_items: 투두 서브 아이템
-- ============================================================================

-- ===========================================
-- 1. purchases 테이블
-- ===========================================
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE RESTRICT,
  period_id uuid REFERENCES routine_periods(id) ON DELETE SET NULL,
  period_label text DEFAULT '',
  period_days integer DEFAULT 0,
  amount integer NOT NULL DEFAULT 0,
  discount integer DEFAULT 0,
  final_amount integer NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'card'
    CHECK (payment_method IN ('card', 'kakao', 'toss', 'naver', 'free')),
  status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('pending', 'completed', 'refunded', 'cancelled')),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  start_date date,
  end_date date,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE purchases IS '구매 내역';
COMMENT ON COLUMN purchases.amount IS '상품 금액 (원)';
COMMENT ON COLUMN purchases.discount IS '할인 금액';
COMMENT ON COLUMN purchases.final_amount IS '최종 결제 금액';
COMMENT ON COLUMN purchases.payment_method IS '결제 수단: card, kakao, toss, naver, free';
COMMENT ON COLUMN purchases.status IS '결제 상태: pending, completed, refunded, cancelled';

-- ===========================================
-- 2. user_routines 테이블
-- ===========================================
CREATE TABLE user_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id uuid REFERENCES routines(id) ON DELETE SET NULL,
  purchase_id uuid REFERENCES purchases(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  category text DEFAULT '',
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'expired', 'paused')),
  is_custom boolean NOT NULL DEFAULT false,
  completion_rate numeric(5,2) DEFAULT 0.00,
  day_plans jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_routines IS '유저의 활성 루틴 (구매 또는 커스텀)';
COMMENT ON COLUMN user_routines.is_custom IS 'true: 직접 만든 루틴, false: 구매한 루틴';
COMMENT ON COLUMN user_routines.completion_rate IS '전체 완료율 (0.00 ~ 100.00)';
COMMENT ON COLUMN user_routines.day_plans IS '커스텀 루틴의 일별 계획 (jsonb)';

-- ===========================================
-- 3. todo_items 테이블
-- ===========================================
CREATE TABLE todo_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_routine_id uuid NOT NULL REFERENCES user_routines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  day integer,
  scheduled_date date,
  time text,
  repeat_days text[] DEFAULT '{}',
  memo text DEFAULT '',
  priority text DEFAULT 'medium'
    CHECK (priority IN ('low', 'medium', 'high')),
  notification text DEFAULT 'none'
    CHECK (notification IN ('none', 'ontime', '10min', '30min')),
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE todo_items IS '투두 아이템';
COMMENT ON COLUMN todo_items.day IS '루틴 기준 일차 (Day 1, Day 2...)';
COMMENT ON COLUMN todo_items.scheduled_date IS '실제 예정 날짜';
COMMENT ON COLUMN todo_items.repeat_days IS '반복 요일 배열: ["mon","tue","wed",...]';
COMMENT ON COLUMN todo_items.priority IS '우선순위: low, medium, high';
COMMENT ON COLUMN todo_items.notification IS '알림 설정: none, ontime, 10min, 30min';

-- ===========================================
-- 4. todo_sub_items 테이블
-- ===========================================
CREATE TABLE todo_sub_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  todo_item_id uuid NOT NULL REFERENCES todo_items(id) ON DELETE CASCADE,
  text text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE todo_sub_items IS '투두 서브 아이템';

-- RLS 활성화
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_sub_items ENABLE ROW LEVEL SECURITY;
