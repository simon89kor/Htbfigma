-- ============================================================================
-- Migration 00016: app_settings 테이블 생성 + RLS + 초기 데이터 시딩
-- HTB Project - Database Schema
-- ============================================================================
-- FB-007: Admin Settings 페이지에서 사이트 설정, 알림 설정, 콘텐츠 정책을 저장하기 위한
--         app_settings 테이블 생성
-- Reporter: F9 | Target: B1 | Severity: BLOCKER | Category: DB_SCHEMA
--
-- 변경 사항:
--   1. app_settings 테이블 생성 (key-value 기반 설정 저장)
--   2. RLS 활성화 + admin 전용 정책 (SELECT/INSERT/UPDATE)
--   3. 인덱스 (key 컬럼 UNIQUE, updated_by FK)
--   4. 초기 데이터 시딩 (9개 설정 키)
-- ============================================================================

-- ===========================================
-- 1. app_settings 테이블
-- ===========================================
CREATE TABLE app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb DEFAULT '{}' NOT NULL,
  description text DEFAULT '' NOT NULL,
  updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app_settings IS '어플리케이션 전역 설정 (admin만 관리)';
COMMENT ON COLUMN app_settings.key IS '설정 키 (유니크)';
COMMENT ON COLUMN app_settings.value IS '설정 값 (JSON)';
COMMENT ON COLUMN app_settings.description IS '설정 설명';
COMMENT ON COLUMN app_settings.updated_by IS '마지막 수정한 admin ID';
COMMENT ON COLUMN app_settings.updated_at IS '마지막 수정 시각';

-- ===========================================
-- 2. RLS 활성화
-- ===========================================
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- 3. RLS 정책 (admin 전용)
-- ===========================================
-- admin만 설정 조회 가능
CREATE POLICY "app_settings_select_admin"
  ON app_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- admin만 설정 추가 가능
CREATE POLICY "app_settings_insert_admin"
  ON app_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- admin만 설정 수정 가능
CREATE POLICY "app_settings_update_admin"
  ON app_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "app_settings_select_admin" ON app_settings IS
  'Admin만 앱 설정 조회 가능';
COMMENT ON POLICY "app_settings_insert_admin" ON app_settings IS
  'Admin만 앱 설정 추가 가능';
COMMENT ON POLICY "app_settings_update_admin" ON app_settings IS
  'Admin만 앱 설정 수정 가능';

-- ===========================================
-- 4. 인덱스
-- ===========================================
-- key 컬럼은 UNIQUE 제약조건으로 자동 인덱스 생성됨
-- updated_by FK 인덱스
CREATE INDEX idx_app_settings_updated_by ON app_settings(updated_by);

-- ===========================================
-- 5. updated_at 자동 갱신 트리거
-- ===========================================
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- ===========================================
-- 6. 초기 데이터 시딩 (9개 설정 키)
-- ===========================================
INSERT INTO app_settings (key, value, description) VALUES
  ('site_name', '"HOW TO BE"', '사이트 이름'),
  ('announcement_message', '""', '공지사항 메시지'),
  ('announcement_enabled', 'false', '공지사항 배너 표시 여부'),
  ('maintenance_mode', 'false', '유지보수 모드 활성화'),
  ('global_notification_enabled', 'true', '전체 알림 활성화'),
  ('marketing_notification_enabled', 'true', '마케팅 알림 활성화'),
  ('auto_hide_report_threshold', '5', '자동 숨김 처리 신고 횟수 임계값'),
  ('banned_words', '[]', '금지어 목록'),
  ('min_report_reason_length', '10', '신고 사유 최소 글자 수');
