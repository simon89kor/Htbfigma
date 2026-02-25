-- ============================================================================
-- Migration 00009: Triggers & Database Functions
-- HTB Project - Database Schema
-- ============================================================================
-- 자동 트리거 및 RPC 함수 정의
-- ============================================================================

-- ===========================================
-- 1. 회원가입 시 profiles 자동 생성
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(
      NEW.raw_user_meta_data->>'nickname',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(COALESCE(NEW.email, 'user'), '@', 1)
    ),
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 2. updated_at 자동 갱신 함수
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- routines
CREATE TRIGGER routines_updated_at
  BEFORE UPDATE ON routines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- reviews
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- user_routines
CREATE TRIGGER user_routines_updated_at
  BEFORE UPDATE ON user_routines
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- todo_items
CREATE TRIGGER todo_items_updated_at
  BEFORE UPDATE ON todo_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- posts
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- comments
CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- challenges
CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- banners
CREATE TRIGGER banners_updated_at
  BEFORE UPDATE ON banners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- qr_codes
CREATE TRIGGER qr_codes_updated_at
  BEFORE UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 3. 게시물 좋아요 카운트 자동 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET like_count = like_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_like_count();

-- ===========================================
-- 4. 게시물 북마크 카운트 자동 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_post_bookmark_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET bookmark_count = bookmark_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET bookmark_count = GREATEST(bookmark_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_bookmark_change
  AFTER INSERT OR DELETE ON post_bookmarks
  FOR EACH ROW
  EXECUTE FUNCTION update_post_bookmark_count();

-- ===========================================
-- 5. 댓글 카운트 자동 업데이트
-- (soft delete: status → 'deleted' 변경 시에도 카운트 감소)
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_post_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- status가 'deleted'로 변경되면 카운트 감소
    IF NEW.status = 'deleted' AND OLD.status <> 'deleted' THEN
      UPDATE posts
      SET comment_count = GREATEST(comment_count - 1, 0)
      WHERE id = NEW.post_id;
    -- status가 'deleted'에서 복원되면 카운트 증가
    ELSIF OLD.status = 'deleted' AND NEW.status <> 'deleted' THEN
      UPDATE posts
      SET comment_count = comment_count + 1
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR UPDATE OF status OR DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- ===========================================
-- 6. 댓글 좋아요 카운트 자동 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_like_count();

-- ===========================================
-- 7. 팔로우 카운트 자동 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_follow_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 팔로워 수 증가
    UPDATE profiles
    SET follower_count = follower_count + 1
    WHERE id = NEW.following_id;
    -- 팔로잉 수 증가
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 팔로워 수 감소
    UPDATE profiles
    SET follower_count = GREATEST(follower_count - 1, 0)
    WHERE id = OLD.following_id;
    -- 팔로잉 수 감소
    UPDATE profiles
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = OLD.follower_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- ===========================================
-- 8. 게시물 작성 시 프로필 post_count 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_profile_post_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET post_count = post_count + 1
    WHERE id = NEW.author_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.author_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_count_change
  AFTER INSERT OR DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_post_count();

-- ===========================================
-- 9. 챌린지 참여자 카운트 자동 업데이트
-- (soft delete: status → 'withdrawn' 변경 시에도 카운트 감소)
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_challenge_participant_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE challenges
    SET participant_count = participant_count + 1
    WHERE id = NEW.challenge_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE challenges
    SET participant_count = GREATEST(participant_count - 1, 0)
    WHERE id = OLD.challenge_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- status가 'withdrawn'으로 변경되면 카운트 감소
    IF NEW.status = 'withdrawn' AND OLD.status <> 'withdrawn' THEN
      UPDATE challenges
      SET participant_count = GREATEST(participant_count - 1, 0)
      WHERE id = NEW.challenge_id;
    -- status가 'withdrawn'에서 복원되면 카운트 증가
    ELSIF OLD.status = 'withdrawn' AND NEW.status <> 'withdrawn' THEN
      UPDATE challenges
      SET participant_count = participant_count + 1
      WHERE id = NEW.challenge_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_challenge_participant_change
  AFTER INSERT OR UPDATE OF status OR DELETE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_participant_count();

-- ===========================================
-- 10. 루틴 리뷰 작성 시 평균 평점 & 리뷰 카운트 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_routine_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating numeric(2,1);
  total_count integer;
BEGIN
  SELECT
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0),
    COUNT(*)
  INTO avg_rating, total_count
  FROM reviews
  WHERE routine_id = COALESCE(NEW.routine_id, OLD.routine_id)
    AND status = 'active';

  UPDATE routines
  SET
    rating = avg_rating,
    review_count = total_count,
    updated_at = now()
  WHERE id = COALESCE(NEW.routine_id, OLD.routine_id);

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_routine_rating();

-- ===========================================
-- 11. 구매 완료 시 루틴 purchase_count 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_routine_purchase_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status <> 'completed') THEN
    UPDATE routines
    SET purchase_count = purchase_count + 1
    WHERE id = NEW.routine_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_purchase_completed
  AFTER INSERT OR UPDATE ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_routine_purchase_count();

-- ===========================================
-- 12. 인기 검색어 업데이트 RPC
-- ===========================================
CREATE OR REPLACE FUNCTION public.upsert_search_keyword(search_keyword text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO search_keywords (keyword, count, updated_at)
  VALUES (lower(trim(search_keyword)), 1, now())
  ON CONFLICT (keyword)
  DO UPDATE SET
    count = search_keywords.count + 1,
    updated_at = now();
END;
$$;

-- ===========================================
-- 13. 유저 통계 조회 RPC
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_user_stats(
  target_user_id uuid,
  period text DEFAULT 'week'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  date_from date;
  total_completed integer;
  total_tasks integer;
BEGIN
  -- 기간 계산
  CASE period
    WHEN 'week' THEN date_from := CURRENT_DATE - INTERVAL '7 days';
    WHEN 'month' THEN date_from := CURRENT_DATE - INTERVAL '30 days';
    ELSE date_from := '1970-01-01';
  END CASE;

  -- 완료/전체 투두 카운트
  SELECT
    COUNT(*) FILTER (WHERE completed = true),
    COUNT(*)
  INTO total_completed, total_tasks
  FROM todo_items
  WHERE user_id = target_user_id
    AND (scheduled_date >= date_from OR scheduled_date IS NULL)
    AND created_at >= date_from;

  result := jsonb_build_object(
    'total_completed', COALESCE(total_completed, 0),
    'total_tasks', COALESCE(total_tasks, 0),
    'completion_rate', CASE
      WHEN COALESCE(total_tasks, 0) = 0 THEN 0
      ELSE ROUND((total_completed::numeric / total_tasks) * 100, 1)
    END
  );

  RETURN result;
END;
$$;

-- ===========================================
-- 14. 랭킹 조회 RPC
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_ranking(
  ranking_period text DEFAULT 'weekly',
  ranking_category text DEFAULT 'all',
  result_limit integer DEFAULT 50
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  nickname text,
  avatar_url text,
  completion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  date_from date;
BEGIN
  -- 기간 계산
  CASE ranking_period
    WHEN 'weekly' THEN date_from := CURRENT_DATE - INTERVAL '7 days';
    WHEN 'monthly' THEN date_from := CURRENT_DATE - INTERVAL '30 days';
    ELSE date_from := CURRENT_DATE - INTERVAL '7 days';
  END CASE;

  RETURN QUERY
  WITH user_stats AS (
    SELECT
      ti.user_id AS uid,
      COUNT(*) FILTER (WHERE ti.completed = true) AS completed_count,
      COUNT(*) AS total_count
    FROM todo_items ti
    JOIN user_routines ur ON ur.id = ti.user_routine_id
    WHERE ti.created_at >= date_from
      AND (ranking_category = 'all' OR ur.category = ranking_category)
    GROUP BY ti.user_id
    HAVING COUNT(*) > 0
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY (us.completed_count::numeric / us.total_count) DESC
    ) AS rank,
    us.uid AS user_id,
    p.nickname,
    p.avatar_url,
    ROUND((us.completed_count::numeric / us.total_count) * 100, 1) AS completion_rate
  FROM user_stats us
  JOIN profiles p ON p.id = us.uid
  WHERE p.status = 'active'
  ORDER BY rank
  LIMIT result_limit;
END;
$$;

-- ===========================================
-- 15. Admin 대시보드 통계 RPC
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles WHERE status = 'active'),
    'new_users_this_week', (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'total_revenue', (SELECT COALESCE(SUM(final_amount), 0) FROM purchases WHERE status = 'completed'),
    'revenue_this_month', (SELECT COALESCE(SUM(final_amount), 0) FROM purchases WHERE status = 'completed' AND purchased_at >= date_trunc('month', CURRENT_DATE)),
    'active_routines', (SELECT COUNT(*) FROM routines WHERE status = 'published'),
    'total_posts', (SELECT COUNT(*) FROM posts WHERE status = 'active'),
    'pending_reports', (SELECT COUNT(*) FROM reports WHERE status = 'pending'),
    'active_challenges', (SELECT COUNT(*) FROM challenges WHERE status = 'active')
  ) INTO result;

  RETURN result;
END;
$$;
