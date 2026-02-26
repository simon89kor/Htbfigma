-- ============================================================================
-- Migration 00013: routine_likes 테이블
-- HTB Project - Database Schema
-- ============================================================================
-- routine_likes: 루틴 상품 좋아요 (하트 토글)
-- FB-003 피드백 처리: ProductDetailPage 좋아요 기능의 서버 사이드 저장
-- ============================================================================

-- ===========================================
-- 1. routine_likes 테이블
-- ===========================================
CREATE TABLE routine_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- 한 유저가 같은 루틴에 중복 좋아요 방지
  CONSTRAINT routine_likes_unique_user_routine UNIQUE (user_id, routine_id)
);

COMMENT ON TABLE routine_likes IS '루틴 상품 좋아요 (하트 토글)';
COMMENT ON COLUMN routine_likes.user_id IS '좋아요를 누른 유저 ID';
COMMENT ON COLUMN routine_likes.routine_id IS '좋아요 대상 루틴 ID';

-- ===========================================
-- 2. RLS 활성화
-- ===========================================
ALTER TABLE routine_likes ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 3. RLS 정책
-- ===========================================
-- 누구나 좋아요 조회 가능 (좋아요 수 카운트 등)
CREATE POLICY "routine_likes_select_public"
  ON routine_likes FOR SELECT
  USING (true);

-- 본인만 좋아요 생성
CREATE POLICY "routine_likes_insert_own"
  ON routine_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 좋아요 삭제 (토글 해제)
CREATE POLICY "routine_likes_delete_own"
  ON routine_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- 4. 인덱스
-- ===========================================
-- FK 컬럼 인덱스 (자주 조회되는 컬럼)
CREATE INDEX idx_routine_likes_user_id ON routine_likes(user_id);
CREATE INDEX idx_routine_likes_routine_id ON routine_likes(routine_id);
-- 특정 루틴의 좋아요 수 카운트 최적화
CREATE INDEX idx_routine_likes_routine_created ON routine_likes(routine_id, created_at DESC);
