-- ============================================================================
-- Migration 00004: Community (Posts, Likes, Bookmarks, Comments, Reports)
-- HTB Project - Database Schema
-- ============================================================================
-- posts: 게시물
-- post_likes: 게시물 좋아요
-- post_bookmarks: 게시물 북마크
-- comments: 댓글
-- comment_likes: 댓글 좋아요
-- reports: 신고
-- ============================================================================

-- ===========================================
-- 1. posts 테이블
-- ===========================================
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text DEFAULT '',
  content text NOT NULL DEFAULT '',
  images text[] DEFAULT '{}',
  hashtags text[] DEFAULT '{}',
  category text NOT NULL DEFAULT 'mytobe'
    CHECK (category IN ('mytobe', 'now', 'gratitude', 'diet', 'exercise', 'selfdev', 'general')),
  linked_routine_id uuid REFERENCES routines(id) ON DELETE SET NULL,
  like_count integer NOT NULL DEFAULT 0,
  comment_count integer NOT NULL DEFAULT 0,
  bookmark_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE posts IS '커뮤니티 게시물';
COMMENT ON COLUMN posts.images IS '이미지 URL 배열 (최대 10장)';
COMMENT ON COLUMN posts.hashtags IS '해시태그 배열';
COMMENT ON COLUMN posts.category IS '게시물 카테고리';
COMMENT ON COLUMN posts.linked_routine_id IS '연결된 루틴 (선택사항)';
COMMENT ON COLUMN posts.status IS 'active(활성), hidden(숨김), deleted(삭제됨)';

-- ===========================================
-- 2. post_likes 테이블
-- ===========================================
CREATE TABLE post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- 같은 게시물에 중복 좋아요 방지
  CONSTRAINT post_likes_unique UNIQUE (post_id, user_id)
);

COMMENT ON TABLE post_likes IS '게시물 좋아요';

-- ===========================================
-- 3. post_bookmarks 테이블
-- ===========================================
CREATE TABLE post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- 같은 게시물에 중복 북마크 방지
  CONSTRAINT post_bookmarks_unique UNIQUE (post_id, user_id)
);

COMMENT ON TABLE post_bookmarks IS '게시물 북마크';

-- ===========================================
-- 4. comments 테이블
-- ===========================================
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  like_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'hidden', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE comments IS '댓글';
COMMENT ON COLUMN comments.parent_id IS '대댓글인 경우 부모 댓글 ID';

-- ===========================================
-- 5. comment_likes 테이블
-- ===========================================
CREATE TABLE comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- 같은 댓글에 중복 좋아요 방지
  CONSTRAINT comment_likes_unique UNIQUE (comment_id, user_id)
);

COMMENT ON TABLE comment_likes IS '댓글 좋아요';

-- ===========================================
-- 6. reports 테이블
-- ===========================================
CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL
    CHECK (target_type IN ('post', 'comment', 'user')),
  target_id uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_note text DEFAULT '',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE reports IS '신고';
COMMENT ON COLUMN reports.target_type IS '신고 대상 타입: post, comment, user';
COMMENT ON COLUMN reports.target_id IS '신고 대상의 UUID';
COMMENT ON COLUMN reports.status IS '처리 상태: pending, reviewed, resolved, dismissed';

-- RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
