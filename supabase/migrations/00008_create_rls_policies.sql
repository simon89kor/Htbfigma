-- ============================================================================
-- Migration 00008: Row Level Security (RLS) Policies
-- HTB Project - Database Schema
-- ============================================================================
-- 모든 테이블에 대한 RLS 정책을 정의합니다.
-- auth.uid()를 통해 현재 로그인한 유저의 ID를 참조합니다.
-- ============================================================================

-- ===========================================
-- profiles 정책
-- ===========================================
-- 누구나 프로필 조회 가능 (공개)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT
  USING (true);

-- 본인만 자신의 프로필 생성 가능
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 본인만 자신의 프로필 수정 가능
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 프로필 직접 삭제 불가 (soft delete만 사용)
-- DELETE 정책 없음 → 기본 거부

-- ===========================================
-- follows 정책
-- ===========================================
-- 누구나 팔로우 관계 조회 가능
CREATE POLICY "follows_select_public"
  ON follows FOR SELECT
  USING (true);

-- 본인이 팔로우 하기
CREATE POLICY "follows_insert_own"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- 본인이 언팔로우
CREATE POLICY "follows_delete_own"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ===========================================
-- routines 정책
-- ===========================================
-- 발행된 루틴은 누구나 조회 가능
CREATE POLICY "routines_select_published"
  ON routines FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- Provider/Admin만 루틴 생성
CREATE POLICY "routines_insert_provider"
  ON routines FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('provider', 'admin')
    )
  );

-- 본인 루틴만 수정
CREATE POLICY "routines_update_own"
  ON routines FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 루틴 삭제는 본인 또는 Admin
CREATE POLICY "routines_delete_own_or_admin"
  ON routines FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- routine_periods 정책
-- ===========================================
-- 누구나 조회 가능
CREATE POLICY "routine_periods_select_public"
  ON routine_periods FOR SELECT
  USING (true);

-- 루틴 소유자만 생성/수정/삭제
CREATE POLICY "routine_periods_insert_owner"
  ON routine_periods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM routines
      WHERE id = routine_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "routine_periods_update_owner"
  ON routine_periods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE id = routine_id AND author_id = auth.uid()
    )
  );

CREATE POLICY "routine_periods_delete_owner"
  ON routine_periods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM routines
      WHERE id = routine_id AND author_id = auth.uid()
    )
  );

-- ===========================================
-- reviews 정책
-- ===========================================
-- 활성 리뷰는 누구나 조회 가능
CREATE POLICY "reviews_select_active"
  ON reviews FOR SELECT
  USING (status = 'active');

-- 로그인한 유저는 리뷰 작성 가능
CREATE POLICY "reviews_insert_authenticated"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 리뷰만 수정
CREATE POLICY "reviews_update_own"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인 리뷰만 삭제 (soft delete)
CREATE POLICY "reviews_delete_own"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- purchases 정책
-- ===========================================
-- 본인 구매 내역만 조회
CREATE POLICY "purchases_select_own"
  ON purchases FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 로그인한 유저가 구매 생성
CREATE POLICY "purchases_insert_own"
  ON purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 구매 수정은 Admin만 (환불 처리 등)
CREATE POLICY "purchases_update_admin"
  ON purchases FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- user_routines 정책
-- ===========================================
-- 본인 루틴만 조회
CREATE POLICY "user_routines_select_own"
  ON user_routines FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 루틴만 생성
CREATE POLICY "user_routines_insert_own"
  ON user_routines FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 루틴만 수정
CREATE POLICY "user_routines_update_own"
  ON user_routines FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인 루틴만 삭제
CREATE POLICY "user_routines_delete_own"
  ON user_routines FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- todo_items 정책
-- ===========================================
-- 본인 투두만 조회
CREATE POLICY "todo_items_select_own"
  ON todo_items FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 투두만 생성
CREATE POLICY "todo_items_insert_own"
  ON todo_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 투두만 수정
CREATE POLICY "todo_items_update_own"
  ON todo_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인 투두만 삭제
CREATE POLICY "todo_items_delete_own"
  ON todo_items FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- todo_sub_items 정책
-- ===========================================
-- 부모 투두의 소유자만 서브아이템 조회
CREATE POLICY "todo_sub_items_select_own"
  ON todo_sub_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM todo_items
      WHERE id = todo_item_id AND user_id = auth.uid()
    )
  );

-- 부모 투두의 소유자만 생성
CREATE POLICY "todo_sub_items_insert_own"
  ON todo_sub_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM todo_items
      WHERE id = todo_item_id AND user_id = auth.uid()
    )
  );

-- 부모 투두의 소유자만 수정
CREATE POLICY "todo_sub_items_update_own"
  ON todo_sub_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM todo_items
      WHERE id = todo_item_id AND user_id = auth.uid()
    )
  );

-- 부모 투두의 소유자만 삭제
CREATE POLICY "todo_sub_items_delete_own"
  ON todo_sub_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM todo_items
      WHERE id = todo_item_id AND user_id = auth.uid()
    )
  );

-- ===========================================
-- posts 정책
-- ===========================================
-- 활성 게시물은 누구나 조회 + 본인 숨김/삭제된 게시물도 조회 가능
CREATE POLICY "posts_select_active_or_own"
  ON posts FOR SELECT
  USING (
    status = 'active'
    OR auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 로그인한 유저는 게시물 작성 가능
CREATE POLICY "posts_insert_authenticated"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 본인 게시물만 수정
CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 본인 게시물만 삭제 또는 Admin
CREATE POLICY "posts_delete_own_or_admin"
  ON posts FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- post_likes 정책
-- ===========================================
-- 누구나 좋아요 조회 가능
CREATE POLICY "post_likes_select_public"
  ON post_likes FOR SELECT
  USING (true);

-- 본인만 좋아요 생성
CREATE POLICY "post_likes_insert_own"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 좋아요 삭제
CREATE POLICY "post_likes_delete_own"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- post_bookmarks 정책
-- ===========================================
-- 본인 북마크만 조회
CREATE POLICY "post_bookmarks_select_own"
  ON post_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- 본인만 북마크 생성
CREATE POLICY "post_bookmarks_insert_own"
  ON post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 북마크 삭제
CREATE POLICY "post_bookmarks_delete_own"
  ON post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- comments 정책
-- ===========================================
-- 활성 댓글은 누구나 조회
CREATE POLICY "comments_select_active"
  ON comments FOR SELECT
  USING (status = 'active' OR auth.uid() = author_id);

-- 로그인한 유저는 댓글 작성 가능
CREATE POLICY "comments_insert_authenticated"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- 본인 댓글만 수정
CREATE POLICY "comments_update_own"
  ON comments FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 본인 또는 Admin만 삭제
CREATE POLICY "comments_delete_own_or_admin"
  ON comments FOR DELETE
  USING (
    auth.uid() = author_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- comment_likes 정책
-- ===========================================
CREATE POLICY "comment_likes_select_public"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "comment_likes_insert_own"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comment_likes_delete_own"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- reports 정책
-- ===========================================
-- 본인 신고만 조회 + Admin은 모두 조회
CREATE POLICY "reports_select_own_or_admin"
  ON reports FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 로그인한 유저는 신고 생성 가능
CREATE POLICY "reports_insert_authenticated"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Admin만 신고 상태 업데이트
CREATE POLICY "reports_update_admin"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- badges 정책
-- ===========================================
-- 누구나 뱃지 조회 가능
CREATE POLICY "badges_select_public"
  ON badges FOR SELECT
  USING (true);

-- Admin만 뱃지 관리
CREATE POLICY "badges_insert_admin"
  ON badges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "badges_update_admin"
  ON badges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- user_badges 정책
-- ===========================================
-- 누구나 유저 뱃지 조회 가능
CREATE POLICY "user_badges_select_public"
  ON user_badges FOR SELECT
  USING (true);

-- 시스템(서비스 역할)만 생성 가능 (트리거 또는 Edge Function에서)
-- 서비스 역할은 RLS를 우회하므로 별도 INSERT 정책 불필요
-- 안전을 위해 본인에게만 허용하는 대안:
CREATE POLICY "user_badges_insert_system"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- challenges 정책
-- ===========================================
-- 누구나 챌린지 조회 가능
CREATE POLICY "challenges_select_public"
  ON challenges FOR SELECT
  USING (true);

-- Admin만 챌린지 관리
CREATE POLICY "challenges_insert_admin"
  ON challenges FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "challenges_update_admin"
  ON challenges FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- challenge_participants 정책
-- ===========================================
-- 누구나 참여자 조회 가능
CREATE POLICY "challenge_participants_select_public"
  ON challenge_participants FOR SELECT
  USING (true);

-- 본인만 챌린지 참여
CREATE POLICY "challenge_participants_insert_own"
  ON challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 진행률 업데이트
CREATE POLICY "challenge_participants_update_own"
  ON challenge_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- challenge_rewards 정책
-- ===========================================
-- 누구나 보상 조회 가능
CREATE POLICY "challenge_rewards_select_public"
  ON challenge_rewards FOR SELECT
  USING (true);

-- Admin만 보상 관리
CREATE POLICY "challenge_rewards_insert_admin"
  ON challenge_rewards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- notifications 정책
-- ===========================================
-- 본인 알림만 조회
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- 시스템이 알림 생성 (서비스 역할 우회) + 본인 알림 생성 허용
CREATE POLICY "notifications_insert_own"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 알림만 수정 (읽음 처리)
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 본인 알림만 삭제
CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- banners 정책
-- ===========================================
-- 활성 배너는 누구나 조회
CREATE POLICY "banners_select_active"
  ON banners FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admin만 배너 관리
CREATE POLICY "banners_insert_admin"
  ON banners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "banners_update_admin"
  ON banners FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "banners_delete_admin"
  ON banners FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ===========================================
-- search_keywords 정책
-- ===========================================
-- 누구나 인기 검색어 조회
CREATE POLICY "search_keywords_select_public"
  ON search_keywords FOR SELECT
  USING (true);

-- 로그인한 유저는 검색어 카운트 증가 (upsert)
CREATE POLICY "search_keywords_insert_authenticated"
  ON search_keywords FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "search_keywords_update_authenticated"
  ON search_keywords FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- ===========================================
-- user_search_history 정책
-- ===========================================
-- 본인 검색 기록만 조회
CREATE POLICY "user_search_history_select_own"
  ON user_search_history FOR SELECT
  USING (auth.uid() = user_id);

-- 본인 검색 기록만 생성
CREATE POLICY "user_search_history_insert_own"
  ON user_search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인 검색 기록만 삭제
CREATE POLICY "user_search_history_delete_own"
  ON user_search_history FOR DELETE
  USING (auth.uid() = user_id);

-- ===========================================
-- qr_codes 정책
-- ===========================================
-- 누구나 QR 코드 조회 가능 (코드로 루틴 접근)
CREATE POLICY "qr_codes_select_public"
  ON qr_codes FOR SELECT
  USING (true);

-- 본인만 QR 생성
CREATE POLICY "qr_codes_insert_own"
  ON qr_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 본인만 QR 수정
CREATE POLICY "qr_codes_update_own"
  ON qr_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- 본인만 QR 삭제
CREATE POLICY "qr_codes_delete_own"
  ON qr_codes FOR DELETE
  USING (auth.uid() = user_id);
