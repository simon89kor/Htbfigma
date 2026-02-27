-- ============================================================================
-- Migration 00015: Admin RLS 정책 보강
-- HTB Project - Database Schema
-- ============================================================================
-- FB-006: Admin용 RLS 정책 보강 필요
-- Reporter: F9 | Target: B1 | Severity: IMPORTANT | Category: RLS_POLICY
--
-- 변경 사항:
--   1. profiles UPDATE: admin이 다른 유저의 role/status를 UPDATE할 수 있도록 정책 교체
--   2. routines SELECT: admin이 모든 status(draft/archived 포함)의 루틴을 SELECT할 수 있도록 정책 교체
--   3. routines UPDATE: admin이 모든 루틴을 UPDATE할 수 있도록 정책 교체
--
-- 참고: posts UPDATE(posts_update_own)와 purchases SELECT/UPDATE는 이미 admin 조건이
--       포함되어 있으므로 변경하지 않습니다.
-- ============================================================================

-- ===========================================
-- 1. profiles: admin도 다른 유저 프로필 수정 가능
-- ===========================================
-- 기존 정책: profiles_update_own (auth.uid() = id 만 허용)
-- 변경: admin role 유저도 다른 유저 프로필 수정 가능
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_update_own_or_admin"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "profiles_update_own_or_admin" ON profiles IS
  'Admin은 모든 유저 프로필(role, status 등) 수정 가능, 일반 유저는 본인만 수정';

-- ===========================================
-- 2. routines: admin은 모든 루틴 조회 가능 (draft/archived 포함)
-- ===========================================
-- 기존 정책: routines_select_published (published OR author_id 만 허용)
-- 변경: admin은 모든 status의 루틴 조회 가능
DROP POLICY IF EXISTS "routines_select_published" ON routines;

CREATE POLICY "routines_select_published_or_admin"
  ON routines FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "routines_select_published_or_admin" ON routines IS
  'Published 루틴은 공개, 작성자는 자기 루틴 모든 상태 조회, Admin은 전체 조회';

-- ===========================================
-- 3. routines: admin은 모든 루틴 수정 가능
-- ===========================================
-- 기존 정책: routines_update_own (author_id 만 허용)
-- 변경: admin도 모든 루틴 수정 가능
DROP POLICY IF EXISTS "routines_update_own" ON routines;

CREATE POLICY "routines_update_own_or_admin"
  ON routines FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "routines_update_own_or_admin" ON routines IS
  'Provider는 자기 루틴만 수정, Admin은 모든 루틴 수정 가능';
