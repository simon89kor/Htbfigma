-- ============================================================================
-- Migration 00010: Indexes
-- HTB Project - Database Schema
-- ============================================================================
-- FK 컬럼 및 자주 WHERE에 쓰이는 컬럼에 인덱스 생성
-- ============================================================================

-- ===========================================
-- profiles 인덱스
-- ===========================================
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_nickname ON profiles(nickname);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- ===========================================
-- follows 인덱스
-- ===========================================
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);

-- ===========================================
-- routines 인덱스
-- ===========================================
CREATE INDEX idx_routines_author_id ON routines(author_id);
CREATE INDEX idx_routines_category ON routines(category);
CREATE INDEX idx_routines_status ON routines(status);
CREATE INDEX idx_routines_status_category ON routines(status, category);
CREATE INDEX idx_routines_created_at ON routines(created_at DESC);
CREATE INDEX idx_routines_rating ON routines(rating DESC);
CREATE INDEX idx_routines_purchase_count ON routines(purchase_count DESC);
-- 텍스트 검색 인덱스 (GIN)
CREATE INDEX idx_routines_title_search ON routines USING gin(to_tsvector('simple', title));
CREATE INDEX idx_routines_tags ON routines USING gin(tags);

-- ===========================================
-- routine_periods 인덱스
-- ===========================================
CREATE INDEX idx_routine_periods_routine_id ON routine_periods(routine_id);

-- ===========================================
-- reviews 인덱스
-- ===========================================
CREATE INDEX idx_reviews_routine_id ON reviews(routine_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- ===========================================
-- purchases 인덱스
-- ===========================================
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_routine_id ON purchases(routine_id);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at DESC);
CREATE INDEX idx_purchases_user_status ON purchases(user_id, status);

-- ===========================================
-- user_routines 인덱스
-- ===========================================
CREATE INDEX idx_user_routines_user_id ON user_routines(user_id);
CREATE INDEX idx_user_routines_routine_id ON user_routines(routine_id);
CREATE INDEX idx_user_routines_status ON user_routines(status);
CREATE INDEX idx_user_routines_user_status ON user_routines(user_id, status);

-- ===========================================
-- todo_items 인덱스
-- ===========================================
CREATE INDEX idx_todo_items_user_routine_id ON todo_items(user_routine_id);
CREATE INDEX idx_todo_items_user_id ON todo_items(user_id);
CREATE INDEX idx_todo_items_scheduled_date ON todo_items(scheduled_date);
CREATE INDEX idx_todo_items_completed ON todo_items(completed);
CREATE INDEX idx_todo_items_user_date ON todo_items(user_id, scheduled_date);

-- ===========================================
-- todo_sub_items 인덱스
-- ===========================================
CREATE INDEX idx_todo_sub_items_todo_item_id ON todo_sub_items(todo_item_id);

-- ===========================================
-- posts 인덱스
-- ===========================================
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_status_category ON posts(status, category);
CREATE INDEX idx_posts_status_created_at ON posts(status, created_at DESC);
CREATE INDEX idx_posts_linked_routine_id ON posts(linked_routine_id)
  WHERE linked_routine_id IS NOT NULL;
CREATE INDEX idx_posts_hashtags ON posts USING gin(hashtags);

-- ===========================================
-- post_likes 인덱스
-- ===========================================
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- ===========================================
-- post_bookmarks 인덱스
-- ===========================================
CREATE INDEX idx_post_bookmarks_post_id ON post_bookmarks(post_id);
CREATE INDEX idx_post_bookmarks_user_id ON post_bookmarks(user_id);

-- ===========================================
-- comments 인덱스
-- ===========================================
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_author_id ON comments(author_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id)
  WHERE parent_id IS NOT NULL;
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at ASC);

-- ===========================================
-- comment_likes 인덱스
-- ===========================================
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- ===========================================
-- reports 인덱스
-- ===========================================
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_target ON reports(target_type, target_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- ===========================================
-- badges 인덱스
-- ===========================================
CREATE INDEX idx_badges_category ON badges(category);
CREATE INDEX idx_badges_is_active ON badges(is_active);

-- ===========================================
-- user_badges 인덱스
-- ===========================================
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id);

-- ===========================================
-- challenges 인덱스
-- ===========================================
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_start_date ON challenges(start_date);
CREATE INDEX idx_challenges_end_date ON challenges(end_date);

-- ===========================================
-- challenge_participants 인덱스
-- ===========================================
CREATE INDEX idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_status ON challenge_participants(status);

-- ===========================================
-- challenge_rewards 인덱스
-- ===========================================
CREATE INDEX idx_challenge_rewards_challenge_id ON challenge_rewards(challenge_id);

-- ===========================================
-- notifications 인덱스
-- ===========================================
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);

-- ===========================================
-- banners 인덱스
-- ===========================================
CREATE INDEX idx_banners_is_active ON banners(is_active);
CREATE INDEX idx_banners_sort_order ON banners(sort_order);

-- ===========================================
-- search_keywords 인덱스
-- ===========================================
CREATE INDEX idx_search_keywords_count ON search_keywords(count DESC);
CREATE INDEX idx_search_keywords_keyword ON search_keywords(keyword);

-- ===========================================
-- user_search_history 인덱스
-- ===========================================
CREATE INDEX idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX idx_user_search_history_searched_at ON user_search_history(searched_at DESC);
CREATE INDEX idx_user_search_history_user_searched ON user_search_history(user_id, searched_at DESC);

-- ===========================================
-- qr_codes 인덱스
-- ===========================================
CREATE INDEX idx_qr_codes_user_id ON qr_codes(user_id);
CREATE INDEX idx_qr_codes_routine_id ON qr_codes(routine_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
