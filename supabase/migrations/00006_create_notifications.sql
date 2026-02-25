-- ============================================================================
-- Migration 00006: Notifications
-- HTB Project - Database Schema
-- ============================================================================
-- notifications: 통합 알림 테이블
-- ============================================================================

-- ===========================================
-- 1. notifications 테이블
-- ===========================================
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('schedule', 'community', 'purchase', 'system')),
  sub_type text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  icon text DEFAULT '',
  is_read boolean NOT NULL DEFAULT false,
  deep_link text DEFAULT '',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE notifications IS '통합 알림';
COMMENT ON COLUMN notifications.type IS '알림 카테고리: schedule, community, purchase, system';
COMMENT ON COLUMN notifications.sub_type IS '알림 세부 타입: routine_reminder, like, comment, follow, purchase_complete, refund, streak_alert, routine_expiry 등';
COMMENT ON COLUMN notifications.icon IS '알림 아이콘 (이모지 또는 아이콘 키)';
COMMENT ON COLUMN notifications.deep_link IS '클릭 시 이동할 앱 내 경로';
COMMENT ON COLUMN notifications.metadata IS '추가 데이터 (postId, userId, routineId 등)';

-- RLS 활성화
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
