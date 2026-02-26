-- ============================================================================
-- Migration 00014: Enhanced get_user_stats RPC Function (B3 - FB-004)
-- HTB Project - Edge Functions & Server Logic
-- ============================================================================
-- get_user_stats 함수를 ProgressStatsPage의 기대 JSON 형식에 맞게 전면 재구현.
-- 기존 반환: { total_completed, total_tasks, completion_rate }
-- 새 반환: { totalCompleted, totalTasks, completionRate, currentStreak,
--           longestStreak, weeklyCheckmarks, dailyRates,
--           categoryDistribution, routineStats }
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_stats(
  target_user_id uuid,
  period text DEFAULT 'week'
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  date_from date;
  date_to date;
  _total_completed integer;
  _total_tasks integer;
  _completion_rate numeric;
  _current_streak integer;
  _longest_streak integer;
  _weekly_checkmarks jsonb;
  _daily_rates jsonb;
  _category_distribution jsonb;
  _routine_stats jsonb;
  _check_date date;
  _has_completed boolean;
  _has_todos boolean;
  _streak_count integer;
  _max_streak integer;
  _day_total integer;
  _day_completed integer;
  i integer;
BEGIN
  -- ─── 기간 설정 ───
  date_to := CURRENT_DATE;
  CASE period
    WHEN 'week' THEN date_from := CURRENT_DATE - INTERVAL '6 days';
    WHEN 'month' THEN date_from := CURRENT_DATE - INTERVAL '29 days';
    ELSE date_from := CURRENT_DATE - INTERVAL '6 days';
  END CASE;

  -- ─── 1. totalCompleted / totalTasks / completionRate ───
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE completed = true), 0),
    COALESCE(COUNT(*), 0)
  INTO _total_completed, _total_tasks
  FROM todo_items
  WHERE user_id = target_user_id
    AND scheduled_date >= date_from
    AND scheduled_date <= date_to;

  IF _total_tasks > 0 THEN
    _completion_rate := ROUND((_total_completed::numeric / _total_tasks) * 100, 1);
  ELSE
    _completion_rate := 0;
  END IF;

  -- ─── 2. currentStreak / longestStreak ───
  -- 오늘부터 과거로 거슬러 올라가며 연속 달성일 계산
  _current_streak := 0;
  _check_date := CURRENT_DATE;

  LOOP
    -- 해당 날짜에 투두가 있는지 확인
    SELECT EXISTS (
      SELECT 1 FROM todo_items
      WHERE user_id = target_user_id
        AND scheduled_date = _check_date
    ) INTO _has_todos;

    IF NOT _has_todos THEN
      -- 투두가 없는 날은 건너뜀 (최대 7일 허용)
      IF _check_date < CURRENT_DATE - INTERVAL '7 days' THEN
        EXIT;
      END IF;
      _check_date := _check_date - INTERVAL '1 day';
      CONTINUE;
    END IF;

    -- 해당 날짜에 하나라도 완료했는지 확인
    SELECT EXISTS (
      SELECT 1 FROM todo_items
      WHERE user_id = target_user_id
        AND scheduled_date = _check_date
        AND completed = true
    ) INTO _has_completed;

    IF _has_completed THEN
      _current_streak := _current_streak + 1;
    ELSE
      EXIT; -- 투두는 있는데 하나도 완료 못한 날이면 스트릭 중단
    END IF;

    _check_date := _check_date - INTERVAL '1 day';

    -- 무한 루프 방지 (최대 365일)
    IF _check_date < CURRENT_DATE - INTERVAL '365 days' THEN
      EXIT;
    END IF;
  END LOOP;

  -- longestStreak: profiles 테이블에서 조회 (calculate_streak가 업데이트함)
  SELECT COALESCE(longest_streak, 0) INTO _longest_streak
  FROM profiles
  WHERE id = target_user_id;

  -- longest_streak이 current보다 작으면 갱신
  _longest_streak := GREATEST(_longest_streak, _current_streak);

  -- ─── 3. weeklyCheckmarks: 최근 7일간 일별 완료 여부 ───
  -- 월~일 순서 (인덱스 0=월요일 ... 6=일요일)
  -- 현재 주의 월요일부터 일요일까지 계산
  _weekly_checkmarks := '[]'::jsonb;

  FOR i IN 0..6 LOOP
    _check_date := date_trunc('week', CURRENT_DATE)::date + i;  -- PostgreSQL: 주 시작 = 월요일

    -- 해당 날짜에 투두가 있고 최소 하나라도 완료한 경우 true
    SELECT
      COALESCE(COUNT(*), 0),
      COALESCE(COUNT(*) FILTER (WHERE completed = true), 0)
    INTO _day_total, _day_completed
    FROM todo_items
    WHERE user_id = target_user_id
      AND scheduled_date = _check_date;

    IF _day_total > 0 AND _day_completed > 0 THEN
      _weekly_checkmarks := _weekly_checkmarks || 'true'::jsonb;
    ELSE
      _weekly_checkmarks := _weekly_checkmarks || 'false'::jsonb;
    END IF;
  END LOOP;

  -- ─── 4. dailyRates: 기간 내 일별 완료율 ───
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'date', day_date::text,
        'rate', CASE
          WHEN day_total = 0 THEN 0
          ELSE ROUND((day_completed::numeric / day_total) * 100, 1)
        END
      )
      ORDER BY day_date
    ),
    '[]'::jsonb
  )
  INTO _daily_rates
  FROM (
    SELECT
      scheduled_date AS day_date,
      COUNT(*) AS day_total,
      COUNT(*) FILTER (WHERE completed = true) AS day_completed
    FROM todo_items
    WHERE user_id = target_user_id
      AND scheduled_date >= date_from
      AND scheduled_date <= date_to
    GROUP BY scheduled_date
  ) daily;

  -- ─── 5. categoryDistribution: 카테고리별 투두 비율 ───
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'category', cat,
        'percentage', ROUND((cat_count::numeric / total_count) * 100, 1)
      )
      ORDER BY cat_count DESC
    ),
    '[]'::jsonb
  )
  INTO _category_distribution
  FROM (
    SELECT
      COALESCE(ur.category, '미분류') AS cat,
      COUNT(ti.id) AS cat_count,
      SUM(COUNT(ti.id)) OVER () AS total_count
    FROM todo_items ti
    JOIN user_routines ur ON ur.id = ti.user_routine_id
    WHERE ti.user_id = target_user_id
      AND ti.scheduled_date >= date_from
      AND ti.scheduled_date <= date_to
    GROUP BY ur.category
  ) cats;

  -- ─── 6. routineStats: 루틴별 완료율 ───
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'routineId', routine_id::text,
        'routineName', routine_name,
        'completionRate', CASE
          WHEN r_total = 0 THEN 0
          ELSE ROUND((r_completed::numeric / r_total) * 100, 1)
        END
      )
      ORDER BY routine_name
    ),
    '[]'::jsonb
  )
  INTO _routine_stats
  FROM (
    SELECT
      ur.id AS routine_id,
      ur.title AS routine_name,
      COUNT(ti.id) AS r_total,
      COUNT(ti.id) FILTER (WHERE ti.completed = true) AS r_completed
    FROM user_routines ur
    JOIN todo_items ti ON ti.user_routine_id = ur.id
    WHERE ur.user_id = target_user_id
      AND ur.status = 'active'
      AND ti.scheduled_date >= date_from
      AND ti.scheduled_date <= date_to
    GROUP BY ur.id, ur.title
  ) routines;

  -- ─── 결과 조립 ───
  result := jsonb_build_object(
    'totalCompleted', _total_completed,
    'totalTasks', _total_tasks,
    'completionRate', _completion_rate,
    'currentStreak', _current_streak,
    'longestStreak', _longest_streak,
    'weeklyCheckmarks', _weekly_checkmarks,
    'dailyRates', _daily_rates,
    'categoryDistribution', _category_distribution,
    'routineStats', _routine_stats
  );

  RETURN result;
END;
$$;

COMMENT ON FUNCTION public.get_user_stats(uuid, text) IS
  'ProgressStatsPage용 종합 유저 통계 조회. period: week(7일) 또는 month(30일). '
  '반환: totalCompleted, totalTasks, completionRate, currentStreak, longestStreak, '
  'weeklyCheckmarks(boolean[7]), dailyRates, categoryDistribution, routineStats';
