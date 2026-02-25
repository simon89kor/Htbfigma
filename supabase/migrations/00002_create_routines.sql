-- ============================================================================
-- Migration 00002: Routines, Routine Periods, Reviews
-- HTB Project - Database Schema
-- ============================================================================
-- routines: 루틴 상품 (기존 data.ts의 products를 DB로 이관)
-- routine_periods: 기간별 가격 옵션 (1 WEEK, 4 WEEK, 100 Days)
-- reviews: 루틴 리뷰
-- ============================================================================

-- ===========================================
-- 1. routines 테이블
-- ===========================================
CREATE TABLE routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  long_description text DEFAULT '',
  price integer NOT NULL DEFAULT 0,
  original_price integer,
  image_url text DEFAULT '',
  category text NOT NULL DEFAULT '',
  tags text[] DEFAULT '{}',
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  rating numeric(2,1) DEFAULT 0.0
    CHECK (rating >= 0 AND rating <= 5),
  review_count integer DEFAULT 0,
  purchase_count integer DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 7,
  day_plans jsonb DEFAULT '[]'::jsonb,
  features text[] DEFAULT '{}',
  color text DEFAULT '#65D9AC',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE routines IS '루틴 상품';
COMMENT ON COLUMN routines.price IS '기본 가격 (원)';
COMMENT ON COLUMN routines.original_price IS '할인 전 원래 가격';
COMMENT ON COLUMN routines.day_plans IS '일별 계획 (jsonb 배열), [{day, title, items}]';
COMMENT ON COLUMN routines.features IS '루틴 특징 태그 배열';
COMMENT ON COLUMN routines.status IS 'draft(초안), published(발행됨), archived(보관됨)';

-- ===========================================
-- 2. routine_periods 테이블
-- ===========================================
CREATE TABLE routine_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  label text NOT NULL,
  days integer NOT NULL,
  price integer NOT NULL,
  original_price integer,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE routine_periods IS '루틴 기간별 가격 옵션';
COMMENT ON COLUMN routine_periods.label IS '표시 라벨: "1 WEEK", "4 WEEK", "100 Days" 등';
COMMENT ON COLUMN routine_periods.days IS '기간 일수: 7, 28, 100 등';
COMMENT ON COLUMN routine_periods.price IS '해당 기간 가격 (원)';

-- ===========================================
-- 3. reviews 테이블
-- ===========================================
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text DEFAULT '',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- 한 유저가 같은 루틴에 리뷰를 중복 작성 방지
  CONSTRAINT reviews_unique_user_routine UNIQUE (routine_id, user_id)
);

COMMENT ON TABLE reviews IS '루틴 리뷰';
COMMENT ON COLUMN reviews.rating IS '별점 (1~5)';

-- RLS 활성화
ALTER TABLE routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
