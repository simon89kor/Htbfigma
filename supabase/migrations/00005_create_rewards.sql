-- ============================================================================
-- Migration 00005: Rewards (Badges, Challenges)
-- HTB Project - Database Schema
-- ============================================================================
-- badges: 뱃지 정의
-- user_badges: 유저 획득 뱃지
-- challenges: 챌린지
-- challenge_participants: 챌린지 참여
-- challenge_rewards: 챌린지 보상
-- ============================================================================

-- ===========================================
-- 1. badges 테이블
-- ===========================================
CREATE TABLE badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'routine'
    CHECK (category IN ('routine', 'streak', 'community', 'challenge', 'special')),
  condition_type text NOT NULL DEFAULT 'count',
  condition_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order integer DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE badges IS '뱃지 정의';
COMMENT ON COLUMN badges.icon IS '이모지 또는 이미지 URL';
COMMENT ON COLUMN badges.category IS '뱃지 카테고리: routine, streak, community, challenge, special';
COMMENT ON COLUMN badges.condition_type IS '획득 조건 타입: count, streak, event 등';
COMMENT ON COLUMN badges.condition_value IS '획득 조건 상세 (jsonb), 예: {"type":"todo_complete","count":100}';

-- ===========================================
-- 2. user_badges 테이블
-- ===========================================
CREATE TABLE user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),

  -- 같은 뱃지 중복 획득 방지
  CONSTRAINT user_badges_unique UNIQUE (user_id, badge_id)
);

COMMENT ON TABLE user_badges IS '유저가 획득한 뱃지';

-- ===========================================
-- 3. challenges 테이블
-- ===========================================
CREATE TABLE challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text DEFAULT '',
  category text DEFAULT '',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  rules text[] DEFAULT '{}',
  participant_count integer NOT NULL DEFAULT 0,
  max_participants integer,
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE challenges IS '챌린지';
COMMENT ON COLUMN challenges.rules IS '챌린지 규칙 배열';
COMMENT ON COLUMN challenges.status IS 'upcoming(예정), active(진행중), completed(완료), cancelled(취소)';

-- ===========================================
-- 4. challenge_participants 테이블
-- ===========================================
CREATE TABLE challenge_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  progress numeric(5,2) NOT NULL DEFAULT 0.00
    CHECK (progress >= 0 AND progress <= 100),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'withdrawn')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,

  -- 같은 챌린지에 중복 참여 방지
  CONSTRAINT challenge_participants_unique UNIQUE (challenge_id, user_id)
);

COMMENT ON TABLE challenge_participants IS '챌린지 참여자';
COMMENT ON COLUMN challenge_participants.progress IS '진행률 (0.00 ~ 100.00)';

-- ===========================================
-- 5. challenge_rewards 테이블
-- ===========================================
CREATE TABLE challenge_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  type text NOT NULL
    CHECK (type IN ('badge', 'coupon', 'point')),
  name text NOT NULL,
  icon text DEFAULT '',
  description text DEFAULT '',
  badge_id uuid REFERENCES badges(id) ON DELETE SET NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE challenge_rewards IS '챌린지 보상';
COMMENT ON COLUMN challenge_rewards.type IS '보상 타입: badge(뱃지), coupon(쿠폰), point(포인트)';
COMMENT ON COLUMN challenge_rewards.badge_id IS '보상이 뱃지인 경우 해당 뱃지 참조';

-- RLS 활성화
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_rewards ENABLE ROW LEVEL SECURITY;
