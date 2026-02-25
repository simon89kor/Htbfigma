-- ============================================================================
-- Migration 00007: Banners, Search, QR Codes
-- HTB Project - Database Schema
-- ============================================================================
-- banners: 홈 배너
-- search_keywords: 인기 검색어
-- user_search_history: 유저 검색 기록
-- qr_codes: QR 코드
-- ============================================================================

-- ===========================================
-- 1. banners 테이블
-- ===========================================
CREATE TABLE banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  link_type text NOT NULL DEFAULT 'routine'
    CHECK (link_type IN ('routine', 'category', 'external', 'challenge')),
  link_target text NOT NULL DEFAULT '',
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE banners IS '홈 배너';
COMMENT ON COLUMN banners.link_type IS '링크 타입: routine, category, external, challenge';
COMMENT ON COLUMN banners.link_target IS '링크 대상 (루틴ID, 카테고리명, URL 등)';
COMMENT ON COLUMN banners.start_date IS '노출 시작일 (NULL이면 즉시 노출)';
COMMENT ON COLUMN banners.end_date IS '노출 종료일 (NULL이면 무기한)';

-- ===========================================
-- 2. search_keywords 테이블
-- ===========================================
CREATE TABLE search_keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL UNIQUE,
  count integer NOT NULL DEFAULT 1,
  is_trending boolean DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE search_keywords IS '인기 검색어';
COMMENT ON COLUMN search_keywords.count IS '검색 횟수';
COMMENT ON COLUMN search_keywords.is_trending IS '트렌딩 여부 (수동 지정 또는 자동 계산)';

-- ===========================================
-- 3. user_search_history 테이블
-- ===========================================
CREATE TABLE user_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  keyword text NOT NULL,
  searched_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_search_history IS '유저 검색 기록';

-- ===========================================
-- 4. qr_codes 테이블
-- ===========================================
CREATE TABLE qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  shared_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE qr_codes IS 'QR 코드';
COMMENT ON COLUMN qr_codes.code IS '고유 QR 코드 문자열';
COMMENT ON COLUMN qr_codes.shared_count IS '공유 횟수';

-- RLS 활성화
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
