-- ============================================================================
-- Seed Data for HTB Project
-- ============================================================================
-- 실제 서비스에서 사용할 수 있는 품질의 한국어 시드 데이터
-- 실행 순서: 마이그레이션 전체 완료 후 실행
-- ============================================================================

-- ============================================================================
-- FK & 트리거 비활성화 (시드 데이터 삽입용)
-- ============================================================================
-- profiles.id는 auth.users(id)를 참조하는 FK이지만, 시드 환경에서는
-- auth.users에 직접 INSERT할 수 없습니다 (Supabase Auth가 관리하는 테이블).
-- session_replication_role = 'replica'로 설정하면 FK 체크와 트리거가
-- 모두 비활성화되어 시드 데이터를 안전하게 삽입할 수 있습니다.
-- 운영 환경에서는 반드시 Supabase Auth를 통해 유저를 먼저 생성하세요.
-- ============================================================================
SET session_replication_role = 'replica';

-- ===========================================
-- 0. 시드 전용 Admin 프로필 (provider/admin 역할)
-- ===========================================
-- 아래 UUID는 시드 전용 고정값입니다.
-- session_replication_role = 'replica' 상태이므로 FK 체크가 비활성화되어
-- auth.users에 해당 UUID가 없어도 삽입이 가능합니다.
DO $$
BEGIN
  -- 이미 존재하면 건너뜀
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    INSERT INTO profiles (id, nickname, bio, avatar_url, email, role, status, created_at, updated_at)
    VALUES
      ('00000000-0000-0000-0000-000000000001', 'PT 김코치', '운동에 진심 100%. NSCA-CPT 자격 보유 트레이너입니다.', '', 'coach.kim@htb.app', 'provider', 'active', now(), now()),
      ('00000000-0000-0000-0000-000000000002', '라이프코치 민지', '새벽 5시 기상 3년차. 모닝 루틴으로 인생이 바뀌었습니다.', '', 'minji@htb.app', 'provider', 'active', now(), now()),
      ('00000000-0000-0000-0000-000000000003', '스터디 플래너 연구소', '수능 만점자 배출 12명. 체계적인 학습법을 연구합니다.', '', 'studylab@htb.app', 'provider', 'active', now(), now()),
      ('00000000-0000-0000-0000-000000000004', '스타트업 멘토 준혁', '사이드 프로젝트 5개 런칭 경험. 실전 노하우를 공유합니다.', '', 'junhyuk@htb.app', 'provider', 'active', now(), now()),
      ('00000000-0000-0000-0000-000000000005', '트래블러 수아', '유럽 15회 방문 여행 블로거. 알찬 여행 루틴을 만듭니다.', '', 'sua.travel@htb.app', 'provider', 'active', now(), now()),
      ('00000000-0000-0000-0000-000000000006', '영양사 유진', '임상영양 전문가. 건강한 식단으로 삶의 질을 높여보세요.', '', 'yujin.diet@htb.app', 'provider', 'active', now(), now()),
      ('00000000-0000-0000-0000-000000000007', '심리상담사 하은', '행동심리학 전문가. 습관이 인생을 바꿉니다.', '', 'haeun.psych@htb.app', 'provider', 'active', now(), now()),
      ('00000000-0000-0000-0000-000000000008', 'GTD 코치 성민', '생산성 컨설턴트 7년차. 시간 관리의 달인이 되어보세요.', '', 'sungmin.gtd@htb.app', 'provider', 'active', now(), now()),
      ('00000000-0000-0000-0000-000000000009', 'HTB 관리자', 'HOW TO BE 서비스 운영팀', '', 'admin@htb.app', 'admin', 'active', now(), now());
  END IF;
END $$;

-- ===========================================
-- 1. 루틴 9개 (기존 data.ts 이관)
-- ===========================================

-- 1-1. 일주일 헬스장 루틴
INSERT INTO routines (id, title, description, long_description, price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, color, status, features, day_plans)
VALUES (
  '10000000-0000-0000-0000-000000000001',
  '일주일 헬스장 루틴',
  '체계적인 분할 운동으로 일주일 만에 몸의 변화를 느껴보세요',
  '운동에 진심인 트레이너가 설계한 7일 헬스장 루틴입니다. 부위별 분할 운동, 선피로 운동과 본운동을 나누어 효율적으로 근육을 자극하고, 충분한 휴식일까지 포함했습니다. 초보자부터 중급자까지 모두 따라할 수 있는 실전 루틴입니다.',
  3900,
  'https://images.unsplash.com/photo-1552848031-326ec03fe2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3b3Jrb3V0JTIwZml0bmVzcyUyMHdlaWdodCUyMHRyYWluaW5nfGVufDF8fHx8MTc3MTQ3OTY2MHww&ixlib=rb-4.1.0&q=80&w=1080',
  '운동',
  ARRAY['운동루틴', '주 7일', '헬스장'],
  '00000000-0000-0000-0000-000000000001',
  4.8, 324, 0, 7, '#FFD24F', 'published',
  ARRAY['부위별 분할', '세트/횟수 가이드', '선피로+본운동', '휴식일 포함'],
  '[
    {"day":1,"title":"등 운동","items":["암풀다운(저중량) 4SET * 20reps","시티드로우(저중량) 4SET * 15reps","루마니안 데드리프트 4SET * 10reps","바벨로우 4SET * 10reps","원암 덤벨로우 5SET * 12reps","풀업 4SET * 할 수 있는만큼","렛풀다운 5SET * 15reps"]},
    {"day":2,"title":"가슴 운동","items":["케이블 크로스오버 4SET * 20reps","인클라인 벤치프레스 4SET * 12reps","플랫 벤치프레스 4SET * 10reps","딥스 4SET * 할 수 있는만큼","덤벨 플라이 4SET * 15reps","푸시업 3SET * 20reps"]},
    {"day":3,"title":"하체 운동","items":["레그익스텐션 4SET * 20reps","바벨 스쿼트 5SET * 8reps","레그프레스 4SET * 12reps","불가리안 스플릿 스쿼트 3SET * 12reps","레그컬 4SET * 15reps","카프레이즈 5SET * 20reps"]},
    {"day":4,"title":"어깨 운동","items":["사이드 레터럴 레이즈 4SET * 20reps","밀리터리 프레스 4SET * 10reps","프론트 레이즈 3SET * 15reps","페이스풀 4SET * 15reps","덤벨 숄더프레스 4SET * 12reps","슈러그 4SET * 15reps"]},
    {"day":5,"title":"팔 운동","items":["바벨컬 4SET * 12reps","해머컬 3SET * 15reps","트라이셉스 푸시다운 4SET * 15reps","오버헤드 익스텐션 3SET * 12reps","컨센트레이션 컬 3SET * 12reps","딥스(삼두) 3SET * 할 수 있는만큼"]},
    {"day":6,"title":"전신 + 코어","items":["버피 3SET * 10reps","케틀벨 스윙 4SET * 15reps","행잉 레그레이즈 4SET * 12reps","플랭크 3SET * 60초","러시안 트위스트 3SET * 20reps","마운틴 클라이머 3SET * 30초"]},
    {"day":7,"title":"휴식 & 회복","items":["폼롤러 전신 마사지 20분","스트레칭 루틴 30분","가벼운 산책 30분","충분한 수면 8시간","단백질 보충 섭취"]}
  ]'::jsonb
);

-- 1-2. 30일 아침 루틴 챌린지
INSERT INTO routines (id, title, description, long_description, price, original_price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, color, status, features, day_plans)
VALUES (
  '10000000-0000-0000-0000-000000000002',
  '30일 아침 루틴 챌린지',
  '매일 아침 1시간으로 인생이 달라지는 30일 모닝 루틴',
  '아침 기상부터 출근/등교 전까지, 하루를 최고로 시작하는 1시간 모닝 루틴을 30일간 실천합니다. 첫째 주는 기본 습관 형성, 둘째 주는 운동 추가, 셋째 주는 자기개발, 넷째 주는 종합 루틴으로 점진적으로 레벨업됩니다.',
  4900, 7900,
  'https://images.unsplash.com/photo-1585924015977-32fd3839c21f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3JuaW5nJTIwcm91dGluZSUyMHBsYW5uZXIlMjBkZXNrfGVufDF8fHx8MTc3MTQ2ODgzNXww&ixlib=rb-4.1.0&q=80&w=1080',
  '라이프스타일',
  ARRAY['모닝루틴', '30일', '습관형성'],
  '00000000-0000-0000-0000-000000000002',
  4.7, 218, 0, 30, '#FFB347', 'published',
  ARRAY['점진적 레벨업', '주간 회고', '습관 추적', '맞춤 시간표'],
  '[
    {"day":1,"title":"기상 & 감사일기","items":["06:00 알람 즉시 기상","물 한 잔 마시기","감사한 일 3가지 적기","5분 명상","간단한 스트레칭"]},
    {"day":2,"title":"기상 & 운동","items":["06:00 기상 후 세안","물 한 잔 마시기","20분 홈트레이닝","샤워 및 준비","건강한 아침 식사"]},
    {"day":3,"title":"기상 & 독서","items":["06:00 기상","물 한 잔 마시기","30분 독서","읽은 내용 메모 정리","아침 식사 준비"]},
    {"day":4,"title":"기상 & 명상","items":["06:00 기상","물 한 잔 마시기","15분 명상 또는 요가","오늘의 목표 3가지 설정","영양소 챙기기"]},
    {"day":5,"title":"기상 & 운동","items":["06:00 기상","물 한 잔 마시기","30분 조깅 또는 홈트","프로틴 쉐이크","하루 계획 정리"]},
    {"day":6,"title":"기상 & 자기개발","items":["06:30 기상 (주말)","물 한 잔 마시기","온라인 강의 30분","배운 내용 노트 정리","느긋한 아침 식사"]},
    {"day":7,"title":"기상 & 주간 회고","items":["07:00 기상 (휴식일)","물 한 잔 마시기","이번 주 회고 작성","다음 주 계획 세우기","좋아하는 음식으로 아침"]}
  ]'::jsonb
);

-- 1-3. 수능 D-100 학습 플래너
INSERT INTO routines (id, title, description, long_description, price, original_price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, color, status, features, day_plans)
VALUES (
  '10000000-0000-0000-0000-000000000003',
  '수능 D-100 학습 플래너',
  '100일 완성! 체계적인 수능 대비 학습 로드맵',
  '수능 100일 전부터 시험 당일까지, 과목별 학습 분량을 매일 체크할 수 있는 초정밀 플래너입니다. 국/수/영/탐 4과목을 매일 균형있게 공부하고, 주간 모의고사와 복습 사이클까지 포함했습니다.',
  5900, 8900,
  'https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMHBsYW5uZXIlMjBib29rcyUyMGRlc2t8ZW58MXx8fHwxNzcxNDY4ODM1fDA&ixlib=rb-4.1.0&q=80&w=1080',
  '교육',
  ARRAY['수능', '100일', '학습플래너'],
  '00000000-0000-0000-0000-000000000003',
  4.9, 512, 0, 100, '#6CA0DC', 'published',
  ARRAY['과목별 로드맵', '주간 모의고사', '오답 사이클', 'D-day 추적'],
  '[
    {"day":1,"title":"국어 집중","items":["비문학 지문 3세트 풀기","문학 작품 분석 2편","어휘력 단어 30개 암기","오답노트 정리"]},
    {"day":2,"title":"수학 집중","items":["수학1 개념 복습","기출문제 30문항 풀기","킬러문항 도전 5문항","오답 풀이 노트 정리"]},
    {"day":3,"title":"영어 집중","items":["독해 지문 5세트","듣기 모의 연습","영단어 50개 암기","문법 포인트 정리"]},
    {"day":4,"title":"탐구 집중","items":["탐구1 개념 정리","탐구2 문제풀이","기출 분석 노트","취약 단원 보충"]},
    {"day":5,"title":"종합 복습","items":["이번 주 오답 총정리","취약 과목 보충 학습","암기 사항 복습","컨디션 체크 & 수면 관리"]},
    {"day":6,"title":"모의고사","items":["실전 모의고사 풀기","시간 배분 연습","채점 및 성적 기록","오답 분석 및 정리"]},
    {"day":7,"title":"회고 & 휴식","items":["주간 학습 회고 작성","다음 주 계획 수립","가벼운 산책 30분","충분한 수면"]}
  ]'::jsonb
);

-- 1-4. 60일 사이드 프로젝트 런칭
INSERT INTO routines (id, title, description, long_description, price, original_price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, color, status, features, day_plans)
VALUES (
  '10000000-0000-0000-0000-000000000004',
  '60일 사이드 프로젝트 런칭',
  '아이디어부터 런칭까지, 60일 완성 프로젝트 가이드',
  '사이드 프로젝트를 시작하고 싶지만 어디서부터 해야 할지 모르겠다면? 60일 동안 아이디어 검증, 기획, 개발, 디자인, 런칭까지 단계별로 진행할 수 있는 프로젝트 관리 가이드입니다.',
  7900, 12900,
  'https://images.unsplash.com/photo-1627634772120-60002287e9c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9qZWN0JTIwbWFuYWdlbWVudCUyMHRlYW13b3JrfGVufDF8fHx8MTc3MTQ2ODgzNnww&ixlib=rb-4.1.0&q=80&w=1080',
  '비즈니스',
  ARRAY['사이드프로젝트', '60일', '런칭가이드'],
  '00000000-0000-0000-0000-000000000004',
  4.7, 189, 0, 60, '#B19CD9', 'published',
  ARRAY['단계별 가이드', '마일스톤 관리', '회고 시스템', '런칭 체크리스트'],
  '[
    {"day":1,"title":"아이디어 검증 - 브레인스토밍","items":["아이디어 10개 리스트업","시장 조사 키워드 정리","경쟁사 분석 3개","타겟 유저 정의"]},
    {"day":2,"title":"아이디어 검증 - 유저 리서치","items":["설문지 작성","인터뷰 대상 5명 섭외","유저 페인포인트 정리","핵심 가치 제안 정의"]},
    {"day":3,"title":"아이디어 검증 - 아이디어 정제","items":["MVP 범위 설정","핵심 기능 3가지 선정","기술 스택 결정","프로젝트 이름 결정"]},
    {"day":4,"title":"아이디어 검증 - 검증 실험","items":["랜딩페이지 초안 작성","사전 신청 폼 만들기","SNS 채널 개설","초기 피드백 수집"]},
    {"day":5,"title":"아이디어 검증 - 1주차 회고","items":["검증 결과 분석","피봇 여부 결정","다음 단계 계획 수립","멘토 상담 신청"]},
    {"day":6,"title":"기획 & 디자인 - 정보 구조 설계","items":["사이트맵 작성","유저 플로우 설계","와이어프레임 스케치","API 설계 초안"]},
    {"day":7,"title":"기획 & 디자인 - UI 디자인","items":["디자인 시스템 정의","주요 화면 디자인","프로토타입 제작","디자인 리뷰"]}
  ]'::jsonb
);

-- 1-5. 14일 유럽 배낭여행 체크리스트
INSERT INTO routines (id, title, description, long_description, price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, color, status, features, day_plans)
VALUES (
  '10000000-0000-0000-0000-000000000005',
  '14일 유럽 배낭여행 체크리스트',
  '2주간의 완벽한 유럽 여행을 위한 올인원 체크리스트',
  '파리, 런던, 바르셀로나, 로마를 2주 안에 알차게 여행할 수 있는 완벽한 체크리스트입니다. 출발 전 준비물부터 도시별 여행 코스, 맛집, 교통편까지 빠짐없이 체크할 수 있습니다.',
  2900,
  'https://images.unsplash.com/photo-1627836604409-5910fad626f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBjaGVja2xpc3QlMjBwYWNraW5nfGVufDF8fHx8MTc3MTQ2ODgzNnww&ixlib=rb-4.1.0&q=80&w=1080',
  '여행',
  ARRAY['유럽여행', '14일', '배낭여행'],
  '00000000-0000-0000-0000-000000000005',
  4.5, 276, 0, 14, '#FF6961', 'published',
  ARRAY['도시별 코스', '맛집 가이드', '교통편 정보', '준비물 체크'],
  '[
    {"day":1,"title":"출발 준비","items":["여권/비자 최종 확인","환전 완료 체크","여행자 보험 가입","짐 최종 점검","공항 이동"]},
    {"day":2,"title":"파리 Day 1","items":["샤를드골 공항 도착","숙소 체크인","에펠탑 방문","세느강 산책","현지 레스토랑 저녁"]},
    {"day":3,"title":"파리 Day 2","items":["루브르 박물관 관람","몽마르뜨 언덕 방문","마카롱 맛집 방문","개선문 야경 감상"]},
    {"day":4,"title":"파리 Day 3","items":["베르사유 궁전 당일치기","오르세 미술관","샹젤리제 쇼핑","에펠탑 야경 사진"]},
    {"day":5,"title":"런던 이동","items":["유로스타 탑승","런던 킹스크로스 도착","숙소 체크인","피쉬앤칩스 저녁","런던아이 야경"]},
    {"day":6,"title":"런던 Day 1","items":["대영박물관 관람","버킹엄 궁전 근위병 교대식","빅벤 & 웨스트민스터","코벤트 가든 구경"]},
    {"day":7,"title":"런던 Day 2","items":["타워브릿지 방문","보로마켓 브런치","해리포터 스튜디오","소호 거리 저녁 식사"]},
    {"day":8,"title":"바르셀로나 이동","items":["히드로 공항 출발","바르셀로나 도착","숙소 체크인","람블라스 거리 산책","타파스 저녁"]},
    {"day":9,"title":"바르셀로나 Day 1","items":["사그라다 파밀리아","구엘공원 방문","고딕지구 탐방","해변 산책"]},
    {"day":10,"title":"바르셀로나 Day 2","items":["카사 바트요 관람","보케리아 시장","몬주익 언덕","플라멩코 공연 관람"]},
    {"day":11,"title":"로마 이동","items":["바르셀로나 공항 출발","로마 피우미치노 도착","숙소 체크인","트레비 분수 방문","로마 파스타 저녁"]},
    {"day":12,"title":"로마 Day 1","items":["콜로세움 입장","포로 로마노 관람","판테온 방문","나보나 광장 산책","젤라또 맛보기"]},
    {"day":13,"title":"로마 Day 2","items":["바티칸 박물관","시스티나 성당","성 베드로 대성당","스페인 광장","기념품 쇼핑"]},
    {"day":14,"title":"귀국","items":["숙소 체크아웃","면세점 쇼핑","공항 이동","탑승 및 귀국","여행 사진 백업"]}
  ]'::jsonb
);

-- 1-6. 28일 클린 식단 플랜
INSERT INTO routines (id, title, description, long_description, price, original_price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, color, status, features, day_plans)
VALUES (
  '10000000-0000-0000-0000-000000000006',
  '28일 클린 식단 플랜',
  '4주간 건강한 식습관을 만드는 체계적인 식단 관리',
  '영양사가 설계한 28일 클린 식단 플랜입니다. 매주 식단이 점진적으로 변화하며, 장보기 리스트부터 밀프렙 가이드까지 포함되어 있어 누구나 쉽게 따라할 수 있습니다. 체중 관리와 건강 개선 두 마리 토끼를 잡아보세요.',
  3900, 5900,
  'https://images.unsplash.com/photo-1641301547846-2cf73f58fdca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWFsJTIwcGxhbm5pbmclMjBoZWFsdGh5JTIwZm9vZHxlbnwxfHx8fDE3NzE0Njg4Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080',
  '건강',
  ARRAY['클린식단', '28일', '다이어트'],
  '00000000-0000-0000-0000-000000000006',
  4.4, 156, 0, 28, '#98D8C8', 'published',
  ARRAY['매일 식단 제공', '장보기 리스트', '밀프렙 가이드', '영양 균형 체크'],
  '[
    {"day":1,"title":"클린 식단 시작","items":["아침: 오트밀 + 바나나 + 아몬드","점심: 닭가슴살 샐러드 + 현미밥","저녁: 연어 구이 + 채소 볶음","간식: 그릭 요거트","물 2L 마시기"]},
    {"day":2,"title":"고단백 식단","items":["아침: 계란 프라이 2개 + 통밀빵","점심: 소고기 덮밥 + 미소된장국","저녁: 두부 스테이크 + 현미밥","간식: 삶은 계란 + 견과류","물 2L 마시기"]},
    {"day":3,"title":"저탄수화물 데이","items":["아침: 아보카도 에그 보트","점심: 치킨 시저 샐러드","저녁: 새우 볶음 + 브로콜리","간식: 방울토마토 + 치즈","물 2L 마시기"]},
    {"day":4,"title":"지중해식 식단","items":["아침: 그릭 요거트 + 그래놀라","점심: 지중해식 파스타","저녁: 생선구이 + 올리브 샐러드","간식: 과일 플레이트","물 2L 마시기"]},
    {"day":5,"title":"한식 클린 식단","items":["아침: 잡곡밥 + 된장국 + 나물반찬","점심: 비빔밥 (현미)","저녁: 닭볶음탕 + 샐러드","간식: 고구마 1개","물 2L 마시기"]},
    {"day":6,"title":"밀프렙 데이","items":["장보기 리스트 확인","다음 주 식재료 구매","닭가슴살 5일분 조리","현미밥 5일분 소분","채소 손질 및 보관"]},
    {"day":7,"title":"치팅 & 회고","items":["좋아하는 음식 1끼 허용","이번 주 체중/체지방 기록","식단 일지 회고","다음 주 식단 확인","충분한 수면"]}
  ]'::jsonb
);

-- 1-7. 21일 습관 만들기 챌린지
INSERT INTO routines (id, title, description, long_description, price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, color, status, features, day_plans)
VALUES (
  '10000000-0000-0000-0000-000000000007',
  '21일 습관 만들기 챌린지',
  '뇌과학 기반, 21일이면 새로운 습관이 만들어집니다',
  '뇌과학 연구에 따르면 21일이면 새로운 신경 경로가 형성됩니다. 이 챌린지는 하루 하나씩 작은 습관을 쌓아가며 21일 후 완전히 새로운 자신을 만들어갑니다. 매일 미션, 동기부여 메시지, 진행률 추적이 포함되어 있습니다.',
  4900,
  'https://images.unsplash.com/photo-1768335566098-3b46cc4baeaa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWJpdCUyMGJ1aWxkaW5nJTIwam91cm5hbGluZyUyMHNlbGYlMjBpbXByb3ZlbWVudHxlbnwxfHx8fDE3NzE0Nzk2NTl8MA&ixlib=rb-4.1.0&q=80&w=1080',
  '자기개발',
  ARRAY['습관형성', '21일', '자기개발'],
  '00000000-0000-0000-0000-000000000007',
  4.6, 298, 0, 21, '#C8A2C8', 'published',
  ARRAY['매일 미션', '동기부여 메시지', '진행률 추적', '뇌과학 기반'],
  '[
    {"day":1,"title":"시작 선언","items":["21일 목표 구체적으로 적기","현재 상태 기록 (사진/글)","환경 설계하기","동기부여 문구 적어 붙이기"]},
    {"day":2,"title":"작은 시작","items":["목표 습관 2분만 실천","실천 후 기분 기록","트리거 설정하기","보상 정하기"]},
    {"day":3,"title":"반복의 힘","items":["어제와 같은 시간에 실천","방해 요소 제거하기","진행 기록 남기기","긍정 확언 3번 읽기"]},
    {"day":4,"title":"루틴에 연결","items":["기존 습관에 새 습관 연결","습관 스태킹 실천","오늘의 감사일기","수면 시간 기록"]},
    {"day":5,"title":"5일차 점검","items":["5일간 기록 되돌아보기","어려웠던 점 적기","전략 수정하기","자신에게 칭찬하기"]},
    {"day":6,"title":"환경 최적화","items":["실천 환경 개선하기","습관 큐 잘 보이게 배치","방해물 숨기기","오늘의 습관 실천"]},
    {"day":7,"title":"1주차 회고","items":["1주 성과 정리","성공률 계산하기","개선점 도출","다음 주 목표 수정"]}
  ]'::jsonb
);

-- 1-8. (없는 루틴 — data.ts에는 9개이나, 8번째는 "90일 생산성 마스터 플랜")
INSERT INTO routines (id, title, description, long_description, price, original_price, image_url, category, tags, author_id, rating, review_count, purchase_count, duration_days, color, status, features, day_plans)
VALUES (
  '10000000-0000-0000-0000-000000000008',
  '90일 생산성 마스터 플랜',
  '분기 단위로 완성하는 생산성 극대화 시스템',
  '3개월간 생산성을 체계적으로 높여가는 종합 플랜입니다. 첫 달은 시간 관리, 둘째 달은 집중력 강화, 셋째 달은 시스템 구축에 집중합니다. 포모도로 기법, 타임블로킹, GTD 등 검증된 생산성 방법론을 실천합니다.',
  6900, 9900,
  'https://images.unsplash.com/photo-1705417272217-490f4511abeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0aXZpdHklMjB3b3Jrc3BhY2UlMjBtb3JuaW5nJTIwZGVzayUyMHBsYW5uZXJ8ZW58MXx8fHwxNzcxNDc5NjYzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  '생산성',
  ARRAY['생산성', '90일', '시간관리'],
  '00000000-0000-0000-0000-000000000008',
  4.8, 245, 0, 90, '#87CEEB', 'published',
  ARRAY['포모도로 기법', '타임블로킹', 'GTD 방법론', '분기 목표 관리'],
  '[
    {"day":1,"title":"시간 감사","items":["오늘 시간 사용 기록하기","포모도로 4세트 실천","내일 할 일 3가지 적기","디지털 디톡스 1시간"]},
    {"day":2,"title":"우선순위 설정","items":["아이젠하워 매트릭스 작성","MIT(Most Important Task) 1개 완료","이메일 배치 처리","15분 산책으로 리프레시"]},
    {"day":3,"title":"딥워크","items":["2시간 방해 없는 집중 시간","알림 모두 끄기","중요 프로젝트 진행","집중 후 보상 시간"]},
    {"day":4,"title":"시스템 정비","items":["할 일 목록 정리","불필요한 약속 정리","자동화 가능한 일 찾기","업무 환경 정리정돈"]},
    {"day":5,"title":"학습 & 성장","items":["생산성 관련 글 읽기 20분","새로운 도구/기법 시도","멘토에게 질문하기","주간 성과 중간 점검"]},
    {"day":6,"title":"회고 & 계획","items":["이번 주 성과 정리","시간 낭비 요인 분석","다음 주 목표 설정","에너지 관리 체크"]},
    {"day":7,"title":"충전","items":["완전한 휴식 취하기","취미 활동 시간","다음 주 준비","충분한 수면"]}
  ]'::jsonb
);

-- ===========================================
-- 2. routine_periods (기간별 가격 옵션)
-- ===========================================

-- 헬스장 루틴 (원래 7일이므로 1주/4주 옵션)
INSERT INTO routine_periods (routine_id, label, days, price, original_price, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000001', '1 WEEK', 7, 3900, NULL, 1),
  ('10000000-0000-0000-0000-000000000001', '4 WEEK', 28, 12900, 15600, 2);

-- 아침 루틴 (30일 기본, 1주 체험)
INSERT INTO routine_periods (routine_id, label, days, price, original_price, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000002', '1 WEEK', 7, 1900, NULL, 1),
  ('10000000-0000-0000-0000-000000000002', '4 WEEK', 28, 4900, 7900, 2);

-- 수능 플래너 (4주/100일)
INSERT INTO routine_periods (routine_id, label, days, price, original_price, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000003', '4 WEEK', 28, 2900, NULL, 1),
  ('10000000-0000-0000-0000-000000000003', '100 Days', 100, 5900, 8900, 2);

-- 사이드 프로젝트 (4주/60일)
INSERT INTO routine_periods (routine_id, label, days, price, original_price, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000004', '4 WEEK', 28, 3900, NULL, 1),
  ('10000000-0000-0000-0000-000000000004', '60 Days', 60, 7900, 12900, 2);

-- 유럽여행 (2주 고정)
INSERT INTO routine_periods (routine_id, label, days, price, original_price, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000005', '2 WEEK', 14, 2900, NULL, 1);

-- 클린 식단 (1주/4주)
INSERT INTO routine_periods (routine_id, label, days, price, original_price, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000006', '1 WEEK', 7, 1500, NULL, 1),
  ('10000000-0000-0000-0000-000000000006', '4 WEEK', 28, 3900, 5900, 2);

-- 습관 만들기 (1주/3주)
INSERT INTO routine_periods (routine_id, label, days, price, original_price, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000007', '1 WEEK', 7, 1900, NULL, 1),
  ('10000000-0000-0000-0000-000000000007', '21 Days', 21, 4900, NULL, 2);

-- 생산성 마스터 (4주/90일)
INSERT INTO routine_periods (routine_id, label, days, price, original_price, sort_order) VALUES
  ('10000000-0000-0000-0000-000000000008', '4 WEEK', 28, 2900, NULL, 1),
  ('10000000-0000-0000-0000-000000000008', '90 Days', 90, 6900, 9900, 2);

-- ===========================================
-- 3. 뱃지 15개
-- ===========================================
INSERT INTO badges (name, description, icon, category, condition_type, condition_value, sort_order, is_active) VALUES
  -- 루틴 관련 (5개)
  ('첫 루틴 시작', '첫 번째 루틴을 구매하고 시작했습니다', '🎯', 'routine', 'count', '{"type":"routine_start","count":1}', 1, true),
  ('루틴 수집가', '루틴을 3개 이상 구매했습니다', '📚', 'routine', 'count', '{"type":"routine_purchase","count":3}', 2, true),
  ('루틴 마스터', '루틴을 처음으로 100% 완료했습니다', '🏆', 'routine', 'count', '{"type":"routine_complete","count":1}', 3, true),
  ('루틴 프로', '5개 이상의 루틴을 완료했습니다', '⭐', 'routine', 'count', '{"type":"routine_complete","count":5}', 4, true),
  ('만점 달성', '하루 투두를 모두 완료했습니다', '💯', 'routine', 'count', '{"type":"daily_all_complete","count":1}', 5, true),

  -- 스트릭 관련 (4개)
  ('3일 연속', '3일 연속으로 루틴을 달성했습니다', '🔥', 'streak', 'streak', '{"type":"streak","days":3}', 6, true),
  ('7일 연속', '일주일 연속으로 루틴을 달성했습니다', '💪', 'streak', 'streak', '{"type":"streak","days":7}', 7, true),
  ('30일 연속', '한 달 연속으로 루틴을 달성했습니다', '🏅', 'streak', 'streak', '{"type":"streak","days":30}', 8, true),
  ('100일 연속', '100일 연속으로 루틴을 달성했습니다', '👑', 'streak', 'streak', '{"type":"streak","days":100}', 9, true),

  -- 커뮤니티 관련 (3개)
  ('첫 게시물', '커뮤니티에 첫 게시물을 작성했습니다', '✍️', 'community', 'count', '{"type":"post_create","count":1}', 10, true),
  ('인기 작가', '게시물이 좋아요 10개를 받았습니다', '❤️', 'community', 'count', '{"type":"post_likes","count":10}', 11, true),
  ('소셜 나비', '팔로워가 10명이 되었습니다', '🦋', 'community', 'count', '{"type":"followers","count":10}', 12, true),

  -- 챌린지 관련 (2개)
  ('챌린지 도전자', '첫 챌린지에 참여했습니다', '🚀', 'challenge', 'count', '{"type":"challenge_join","count":1}', 13, true),
  ('챌린지 우승자', '챌린지를 성공적으로 완료했습니다', '🥇', 'challenge', 'count', '{"type":"challenge_complete","count":1}', 14, true),

  -- 특별 뱃지 (1개)
  ('얼리 어답터', 'HOW TO BE 초기 멤버입니다', '🌟', 'special', 'event', '{"type":"early_adopter"}', 15, true);

-- ===========================================
-- 4. 배너 3개
-- ===========================================
INSERT INTO banners (image_url, title, subtitle, link_type, link_target, sort_order, is_active, start_date) VALUES
  (
    'https://images.unsplash.com/photo-1552848031-326ec03fe2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    '오늘부터 시작하는 나만의 루틴',
    '전문가가 설계한 루틴으로 매일 성장하세요',
    'category',
    '전체',
    1,
    true,
    now()
  ),
  (
    'https://images.unsplash.com/photo-1585924015977-32fd3839c21f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    '30일 모닝 루틴 챌린지',
    '아침 1시간으로 인생이 달라집니다 | 38% 할인 중',
    'routine',
    '10000000-0000-0000-0000-000000000002',
    2,
    true,
    now()
  ),
  (
    'https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    '수능 D-100 학습 플래너',
    '수능 만점자 12명 배출! 검증된 학습 로드맵',
    'routine',
    '10000000-0000-0000-0000-000000000003',
    3,
    true,
    now()
  );

-- ===========================================
-- 5. 챌린지 2개 + 보상
-- ===========================================

-- 챌린지 1: 21일 습관 만들기 챌린지
INSERT INTO challenges (id, title, description, image_url, category, start_date, end_date, rules, participant_count, max_participants, status, created_by)
VALUES (
  '20000000-0000-0000-0000-000000000001',
  '21일 습관 만들기 챌린지',
  '21일 동안 매일 하나씩 새로운 습관을 실천하고, 커뮤니티에 인증하세요! 완주하면 특별 뱃지를 드립니다.',
  'https://images.unsplash.com/photo-1768335566098-3b46cc4baeaa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
  '자기개발',
  now(),
  now() + INTERVAL '21 days',
  ARRAY[
    '매일 1개 이상의 투두를 완료해야 합니다',
    '커뮤니티에 매일 인증 게시물을 작성해야 합니다',
    '3일 이상 연속으로 빠지면 탈락입니다',
    '21일 완주 시 챌린지 도전자 뱃지 획득'
  ],
  0,
  100,
  'active',
  '00000000-0000-0000-0000-000000000009'
);

-- 챌린지 1 보상
INSERT INTO challenge_rewards (challenge_id, type, name, icon, description, badge_id, sort_order)
SELECT
  '20000000-0000-0000-0000-000000000001',
  'badge',
  '챌린지 도전자',
  '🚀',
  '21일 습관 만들기 챌린지 완주 보상',
  b.id,
  1
FROM badges b WHERE b.name = '챌린지 도전자';

-- 챌린지 2: 아침 기상 30일 챌린지
INSERT INTO challenges (id, title, description, image_url, category, start_date, end_date, rules, participant_count, max_participants, status, created_by)
VALUES (
  '20000000-0000-0000-0000-000000000002',
  '아침 6시 기상 30일 챌린지',
  '30일 동안 매일 아침 6시에 기상하고 모닝 루틴을 실천하세요. 성공하면 얼리버드 뱃지와 함께 다음 달 루틴 할인 쿠폰을 드립니다!',
  'https://images.unsplash.com/photo-1585924015977-32fd3839c21f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
  '라이프스타일',
  now() + INTERVAL '7 days',
  now() + INTERVAL '37 days',
  ARRAY[
    '매일 아침 6시 이전에 기상 인증 (커뮤니티 게시물)',
    '모닝 루틴 투두 1개 이상 완료',
    '주 5일 이상 달성해야 합니다',
    '30일 중 25일 이상 달성 시 챌린지 완료'
  ],
  0,
  200,
  'upcoming',
  '00000000-0000-0000-0000-000000000009'
);

-- 챌린지 2 보상
INSERT INTO challenge_rewards (challenge_id, type, name, icon, description, sort_order) VALUES
  ('20000000-0000-0000-0000-000000000002', 'coupon', '루틴 30% 할인 쿠폰', '🎟️', '다음 달 루틴 구매 시 30% 할인', 1),
  ('20000000-0000-0000-0000-000000000002', 'badge', '얼리 버드', '🐦', '아침 6시 기상 30일 챌린지 완주', 2);

-- ===========================================
-- 6. 인기 검색어 초기 데이터
-- ===========================================
INSERT INTO search_keywords (keyword, count, is_trending, updated_at) VALUES
  ('운동', 156, true, now()),
  ('다이어트', 134, true, now()),
  ('모닝루틴', 98, true, now()),
  ('수능', 87, true, now()),
  ('습관', 76, true, now()),
  ('생산성', 65, false, now()),
  ('식단', 54, false, now()),
  ('여행', 45, false, now()),
  ('사이드프로젝트', 34, false, now()),
  ('자기개발', 28, false, now());

-- ============================================================================
-- FK & 트리거 복원
-- ============================================================================
-- 시드 데이터 삽입이 완료되었으므로 FK 체크와 트리거를 원래 상태로 복원합니다.
-- 이후 모든 INSERT/UPDATE는 정상적인 FK 제약 조건이 적용됩니다.
-- ============================================================================
SET session_replication_role = 'origin';
