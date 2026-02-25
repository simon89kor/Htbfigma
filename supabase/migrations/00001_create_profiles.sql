-- ============================================================================
-- Migration 00001: Profiles & Follows
-- HTB Project - Database Schema
-- ============================================================================
-- profiles: Supabase Auth 확장 테이블 (auth.users 직접 수정 금지)
-- follows: 팔로우 관계 테이블
-- ============================================================================

-- ===========================================
-- 1. profiles 테이블
-- ===========================================
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text NOT NULL DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  cover_image_url text DEFAULT '',
  email text DEFAULT '',
  role text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'provider', 'admin')),
  preferences jsonb DEFAULT '[]'::jsonb,
  terms_agreed_at timestamptz,
  privacy_agreed_at timestamptz,
  marketing_agreed boolean DEFAULT false,
  notification_schedule boolean DEFAULT true,
  notification_community boolean DEFAULT true,
  notification_marketing boolean DEFAULT false,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_active_date date,
  post_count integer DEFAULT 0,
  follower_count integer DEFAULT 0,
  following_count integer DEFAULT 0,
  total_completed_routines integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'deleted')),
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE profiles IS '유저 프로필 (auth.users 확장)';
COMMENT ON COLUMN profiles.id IS 'auth.users.id와 동일한 UUID';
COMMENT ON COLUMN profiles.role IS '역할: user(일반), provider(루틴 제공자), admin(관리자)';
COMMENT ON COLUMN profiles.preferences IS '관심 카테고리 배열 (jsonb), 예: ["exercise","diet"]';
COMMENT ON COLUMN profiles.current_streak IS '현재 연속 달성일';
COMMENT ON COLUMN profiles.longest_streak IS '최장 연속 달성일';
COMMENT ON COLUMN profiles.status IS '계정 상태: active, suspended, deleted';

-- ===========================================
-- 2. follows 테이블
-- ===========================================
CREATE TABLE follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- 자기 자신을 팔로우할 수 없음
  CONSTRAINT follows_no_self_follow CHECK (follower_id <> following_id),
  -- 같은 팔로우 관계 중복 방지
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id)
);

COMMENT ON TABLE follows IS '팔로우 관계';
COMMENT ON COLUMN follows.follower_id IS '팔로우 하는 유저';
COMMENT ON COLUMN follows.following_id IS '팔로우 당하는 유저';

-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
