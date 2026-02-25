-- ============================================================================
-- Migration 00012: Additional RPC Functions & Triggers (B3)
-- HTB Project - Edge Functions & Server Logic
-- ============================================================================
-- B1의 00009에서 기본 RPC(get_user_stats, get_ranking, get_admin_dashboard_stats,
-- upsert_search_keyword)를 이미 생성했으므로, 여기서는 추가 로직만 정의한다.
-- ============================================================================

-- ===========================================
-- 1. log_search_keyword: 유저 검색 기록 + 인기 검색어 동시 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.log_search_keyword(search_keyword text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _keyword text;
BEGIN
  _keyword := lower(trim(search_keyword));

  -- 빈 문자열 무시
  IF _keyword = '' THEN
    RETURN;
  END IF;

  -- 인기 검색어 카운트 업데이트 (기존 upsert_search_keyword와 동일 로직이지만 통합)
  INSERT INTO search_keywords (keyword, count, updated_at)
  VALUES (_keyword, 1, now())
  ON CONFLICT (keyword)
  DO UPDATE SET
    count = search_keywords.count + 1,
    updated_at = now();

  -- 유저 검색 기록 저장 (인증된 유저인 경우)
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO user_search_history (user_id, keyword, searched_at)
    VALUES (auth.uid(), _keyword, now());
  END IF;
END;
$$;

COMMENT ON FUNCTION public.log_search_keyword(text) IS '검색 시 인기 검색어 카운트 + 유저 검색 기록 동시 저장';

-- ===========================================
-- 2. get_trending_keywords: 트렌딩 검색어 조회
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_trending_keywords(result_limit integer DEFAULT 10)
RETURNS TABLE (
  keyword text,
  search_count integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sk.keyword,
    sk.count AS search_count
  FROM search_keywords sk
  WHERE sk.updated_at >= now() - INTERVAL '7 days'
  ORDER BY sk.count DESC
  LIMIT result_limit;
END;
$$;

COMMENT ON FUNCTION public.get_trending_keywords(integer) IS '최근 7일간 인기 검색어 조회';

-- ===========================================
-- 3. get_user_routine_progress: 유저의 특정 루틴 상세 진행률
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_user_routine_progress(target_user_routine_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  _user_id uuid;
  _total integer;
  _completed integer;
  _today_total integer;
  _today_completed integer;
BEGIN
  -- 권한 확인: 본인 루틴만 조회 가능
  SELECT user_id INTO _user_id
  FROM user_routines
  WHERE id = target_user_routine_id;

  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- 전체 투두 완료율
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO _total, _completed
  FROM todo_items
  WHERE user_routine_id = target_user_routine_id;

  -- 오늘의 투두 완료율
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO _today_total, _today_completed
  FROM todo_items
  WHERE user_routine_id = target_user_routine_id
    AND scheduled_date = CURRENT_DATE;

  result := jsonb_build_object(
    'total_items', COALESCE(_total, 0),
    'completed_items', COALESCE(_completed, 0),
    'completion_rate', CASE
      WHEN COALESCE(_total, 0) = 0 THEN 0
      ELSE ROUND((_completed::numeric / _total) * 100, 1)
    END,
    'today_total', COALESCE(_today_total, 0),
    'today_completed', COALESCE(_today_completed, 0),
    'today_rate', CASE
      WHEN COALESCE(_today_total, 0) = 0 THEN 0
      ELSE ROUND((_today_completed::numeric / _today_total) * 100, 1)
    END
  );

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_user_routine_progress(uuid) IS '특정 user_routine의 상세 진행률 조회';

-- ===========================================
-- 4. calculate_streak: 유저 스트릭 계산 및 업데이트
-- ===========================================
CREATE OR REPLACE FUNCTION public.calculate_streak(target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_streak integer := 0;
  _check_date date := CURRENT_DATE;
  _has_completed boolean;
  _longest integer;
BEGIN
  -- 오늘부터 과거로 거슬러 올라가며 연속 달성일 계산
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM todo_items
      WHERE user_id = target_user_id
        AND scheduled_date = _check_date
        AND completed = true
      LIMIT 1
    ) INTO _has_completed;

    -- 해당 날짜에 완료한 투두가 없으면 중단
    -- 단, 해당 날짜에 예정된 투두가 아예 없으면 건너뜀
    IF NOT _has_completed THEN
      -- 해당 날짜에 투두가 있었는지 확인
      IF EXISTS (
        SELECT 1 FROM todo_items
        WHERE user_id = target_user_id
          AND scheduled_date = _check_date
      ) THEN
        EXIT; -- 투두가 있었는데 하나도 완료 못했으면 스트릭 중단
      END IF;
      -- 투두 자체가 없는 날이면 건너뜀 (최대 7일까지)
      IF _check_date < CURRENT_DATE - INTERVAL '7 days' THEN
        EXIT;
      END IF;
    ELSE
      _current_streak := _current_streak + 1;
    END IF;

    _check_date := _check_date - INTERVAL '1 day';

    -- 무한 루프 방지 (최대 365일)
    IF _check_date < CURRENT_DATE - INTERVAL '365 days' THEN
      EXIT;
    END IF;
  END LOOP;

  -- longest_streak 조회
  SELECT longest_streak INTO _longest
  FROM profiles
  WHERE id = target_user_id;

  -- 프로필 업데이트
  UPDATE profiles
  SET
    current_streak = _current_streak,
    longest_streak = GREATEST(COALESCE(_longest, 0), _current_streak),
    last_active_date = CURRENT_DATE
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'current_streak', _current_streak,
    'longest_streak', GREATEST(COALESCE(_longest, 0), _current_streak)
  );
END;
$$;

COMMENT ON FUNCTION public.calculate_streak(uuid) IS '유저 스트릭 계산 및 프로필 업데이트';

-- ===========================================
-- 5. check_idempotency: 결제 멱등성 체크 함수
-- ===========================================
CREATE OR REPLACE FUNCTION public.check_purchase_exists(
  _user_id uuid,
  _routine_id uuid,
  _period_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM purchases
    WHERE user_id = _user_id
      AND routine_id = _routine_id
      AND period_id = _period_id
      AND status IN ('pending', 'completed')
  );
END;
$$;

COMMENT ON FUNCTION public.check_purchase_exists(uuid, uuid, uuid) IS '동일 루틴/기간 구매 중복 여부 체크 (멱등성)';

-- ===========================================
-- 6. todo_items 완료 시 user_routines completion_rate 자동 업데이트 트리거
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_user_routine_completion_rate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total integer;
  _completed integer;
  _rate numeric(5,2);
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed = true)
  INTO _total, _completed
  FROM todo_items
  WHERE user_routine_id = NEW.user_routine_id;

  IF _total > 0 THEN
    _rate := ROUND((_completed::numeric / _total) * 100, 2);
  ELSE
    _rate := 0;
  END IF;

  UPDATE user_routines
  SET completion_rate = _rate
  WHERE id = NEW.user_routine_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_todo_completion_change
  AFTER UPDATE OF completed ON todo_items
  FOR EACH ROW
  WHEN (OLD.completed IS DISTINCT FROM NEW.completed)
  EXECUTE FUNCTION update_user_routine_completion_rate();

-- ===========================================
-- 7. user_routines 만료 자동 처리 함수 (cron용)
-- ===========================================
CREATE OR REPLACE FUNCTION public.expire_overdue_routines()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  WITH expired AS (
    UPDATE user_routines
    SET status = 'expired'
    WHERE status = 'active'
      AND end_date IS NOT NULL
      AND end_date < CURRENT_DATE
    RETURNING id
  )
  SELECT COUNT(*) INTO _count FROM expired;

  RETURN _count;
END;
$$;

COMMENT ON FUNCTION public.expire_overdue_routines() IS '만료일이 지난 활성 루틴을 expired 상태로 변경 (cron용)';

-- ===========================================
-- 8. 완료된 루틴 카운트 업데이트 (user_routines status 변경 시)
-- ===========================================
CREATE OR REPLACE FUNCTION public.update_total_completed_routines()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    UPDATE profiles
    SET total_completed_routines = total_completed_routines + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_routine_completed
  AFTER UPDATE OF status ON user_routines
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status <> 'completed')
  EXECUTE FUNCTION update_total_completed_routines();
