export interface DayPlan {
  day: number;
  title: string;
  items: string[];
}

export interface TodoTemplate {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  color: string;
  durationDays: number;
  tags: string[];
  author?: string;
  authorSubtitle?: string;
  dayPlans: DayPlan[];
  features: string[];
}

// Helper: repeat a weekly pattern for N weeks
function repeatWeekly(weekPlan: DayPlan[], totalDays: number): DayPlan[] {
  const plans: DayPlan[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const weekIndex = (d - 1) % weekPlan.length;
    const base = weekPlan[weekIndex];
    plans.push({
      day: d,
      title: base.title,
      items: [...base.items],
    });
  }
  return plans;
}

export const products: TodoTemplate[] = [
  {
    id: "fitness-weekly",
    name: "일주일 헬스장 루틴",
    description: "체계적인 분할 운동으로 일주일 만에 몸의 변화를 느껴보세요",
    longDescription:
      "운동에 진심인 트레이너가 설계한 7일 헬스장 루틴입니다. 부위별 분할 운동, 선피로 운동과 본운동을 나누어 효율적으로 근육을 자극하고, 충분한 휴식일까지 포함했습니다. 초보자부터 중급자까지 모두 따라할 수 있는 실전 루틴입니다.",
    price: 3900,
    image:
      "https://images.unsplash.com/photo-1552848031-326ec03fe2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3b3Jrb3V0JTIwZml0bmVzcyUyMHdlaWdodCUyMHRyYWluaW5nfGVufDF8fHx8MTc3MTQ3OTY2MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "운동",
    rating: 4.8,
    reviews: 324,
    color: "#FFD24F",
    durationDays: 7,
    tags: ["운동루틴", "주 7일", "헬스장"],
    author: "PT 김코치",
    authorSubtitle: "운동에 진심 100%",
    dayPlans: [
      {
        day: 1,
        title: "등 운동",
        items: [
          "암풀다운(저중량) 4SET * 20reps",
          "시티드로우(저중량) 4SET * 15reps",
          "루마니안 데드리프트 4SET * 10reps",
          "바벨로우 4SET * 10reps",
          "원암 덤벨로우 5SET * 12reps",
          "풀업 4SET * 할 수 있는만큼",
          "렛풀다운 5SET * 15reps",
        ],
      },
      {
        day: 2,
        title: "가슴 운동",
        items: [
          "케이블 크로스오버 4SET * 20reps",
          "인클라인 벤치프레스 4SET * 12reps",
          "플랫 벤치프레스 4SET * 10reps",
          "딥스 4SET * 할 수 있는만큼",
          "덤벨 플라이 4SET * 15reps",
          "푸시업 3SET * 20reps",
        ],
      },
      {
        day: 3,
        title: "하체 운동",
        items: [
          "레그익스텐션 4SET * 20reps",
          "바벨 스쿼트 5SET * 8reps",
          "레그프레스 4SET * 12reps",
          "불가리안 스플릿 스쿼트 3SET * 12reps",
          "레그컬 4SET * 15reps",
          "카프레이즈 5SET * 20reps",
        ],
      },
      {
        day: 4,
        title: "어깨 운동",
        items: [
          "사이드 레터럴 레이즈 4SET * 20reps",
          "밀리터리 프레스 4SET * 10reps",
          "프론트 레이즈 3SET * 15reps",
          "페이스풀 4SET * 15reps",
          "덤벨 숄더프레스 4SET * 12reps",
          "슈러그 4SET * 15reps",
        ],
      },
      {
        day: 5,
        title: "팔 운동",
        items: [
          "바벨컬 4SET * 12reps",
          "해머컬 3SET * 15reps",
          "트라이셉스 푸시다운 4SET * 15reps",
          "오버헤드 익스텐션 3SET * 12reps",
          "컨센트레이션 컬 3SET * 12reps",
          "딥스(삼두) 3SET * 할 수 있는만큼",
        ],
      },
      {
        day: 6,
        title: "전신 + 코어",
        items: [
          "버피 3SET * 10reps",
          "케틀벨 스윙 4SET * 15reps",
          "행잉 레그레이즈 4SET * 12reps",
          "플랭크 3SET * 60초",
          "러시안 트위스트 3SET * 20reps",
          "마운틴 클라이머 3SET * 30초",
        ],
      },
      {
        day: 7,
        title: "휴식 & 회복",
        items: [
          "폼롤러 전신 마사지 20분",
          "스트레칭 루틴 30분",
          "가벼운 산책 30분",
          "충분한 수면 8시간",
          "단백질 보충 섭취",
        ],
      },
    ],
    features: ["부위별 분할", "세트/횟수 가이드", "선피로+본운동", "휴식일 포함"],
  },
  {
    id: "morning-routine-30",
    name: "30일 아침 루틴 챌린지",
    description: "매일 아침 1시간으로 인생이 달라지는 30일 모닝 루틴",
    longDescription:
      "아침 기상부터 출근/등교 전까지, 하루를 최고로 시작하는 1시간 모닝 루틴을 30일간 실천합니다. 첫째 주는 기본 습관 형성, 둘째 주는 운동 추가, 셋째 주는 자기개발, 넷째 주는 종합 루틴으로 점진적으로 레벨업됩니다.",
    price: 4900,
    originalPrice: 7900,
    image:
      "https://images.unsplash.com/photo-1585924015977-32fd3839c21f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3JuaW5nJTIwcm91dGluZSUyMHBsYW5uZXIlMjBkZXNrfGVufDF8fHx8MTc3MTQ2ODgzNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "라이프스타일",
    rating: 4.7,
    reviews: 218,
    color: "#FFB347",
    durationDays: 30,
    tags: ["모닝루틴", "30일", "습관형성"],
    author: "라이프코치 민지",
    authorSubtitle: "새벽 5시 기상 3년차",
    dayPlans: repeatWeekly(
      [
        {
          day: 1,
          title: "기상 & 감사일기",
          items: [
            "06:00 알람 즉시 기상",
            "물 한 잔 마시기",
            "감사한 일 3가지 적기",
            "5분 명상",
            "간단한 스트레칭",
          ],
        },
        {
          day: 2,
          title: "기상 & 운동",
          items: [
            "06:00 기상 후 세안",
            "물 한 잔 마시기",
            "20분 홈트레이닝",
            "샤워 및 준비",
            "건강한 아침 식사",
          ],
        },
        {
          day: 3,
          title: "기상 & 독서",
          items: [
            "06:00 기상",
            "물 한 잔 마시기",
            "30분 독서",
            "읽은 내용 메모 정리",
            "아침 식사 준비",
          ],
        },
        {
          day: 4,
          title: "기상 & 명상",
          items: [
            "06:00 기상",
            "물 한 잔 마시기",
            "15분 명상 또는 요가",
            "오늘의 목표 3가지 설정",
            "영양소 챙기기",
          ],
        },
        {
          day: 5,
          title: "기상 & 운동",
          items: [
            "06:00 기상",
            "물 한 잔 마시기",
            "30분 조깅 또는 홈트",
            "프로틴 쉐이크",
            "하루 계획 정리",
          ],
        },
        {
          day: 6,
          title: "기상 & 자기개발",
          items: [
            "06:30 기상 (주말)",
            "물 한 잔 마시기",
            "온라인 강의 30분",
            "배운 내용 노트 정리",
            "느긋한 아침 식사",
          ],
        },
        {
          day: 7,
          title: "기상 & 주간 회고",
          items: [
            "07:00 기상 (휴식일)",
            "물 한 잔 마시기",
            "이번 주 회고 작성",
            "다음 주 계획 세우기",
            "좋아하는 음식으로 아침",
          ],
        },
      ],
      30
    ),
    features: ["점진적 레벨업", "주간 회고", "습관 추적", "맞춤 시간표"],
  },
  {
    id: "study-100days",
    name: "수능 D-100 학습 플래너",
    description: "100일 완성! 체계적인 수능 대비 학습 로드맵",
    longDescription:
      "수능 100일 전부터 시험 당일까지, 과목별 학습 분량을 매일 체크할 수 있는 초정밀 플래너입니다. 국/수/영/탐 4과목을 매일 균형있게 공부하고, 주간 모의고사와 복습 사이클까지 포함했습니다.",
    price: 5900,
    originalPrice: 8900,
    image:
      "https://images.unsplash.com/photo-1731983568664-9c1d8a87e7a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkeSUyMHBsYW5uZXIlMjBib29rcyUyMGRlc2t8ZW58MXx8fHwxNzcxNDY4ODM1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "교육",
    rating: 4.9,
    reviews: 512,
    color: "#6CA0DC",
    durationDays: 100,
    tags: ["수능", "100일", "학습플래너"],
    author: "스터디 플래너 연구소",
    authorSubtitle: "수능 만점자 배출 12명",
    dayPlans: repeatWeekly(
      [
        {
          day: 1,
          title: "국어 집중",
          items: [
            "비문학 지문 3세트 풀기",
            "문학 작품 분석 2편",
            "어휘력 단어 30개 암기",
            "오답노트 정리",
          ],
        },
        {
          day: 2,
          title: "수학 집중",
          items: [
            "수학1 개념 복습",
            "기출문제 30문항 풀기",
            "킬러문항 도전 5문항",
            "오답 풀이 노트 정리",
          ],
        },
        {
          day: 3,
          title: "영어 집중",
          items: [
            "독해 지문 5세트",
            "듣기 모의 연습",
            "영단어 50개 암기",
            "문법 포인트 정리",
          ],
        },
        {
          day: 4,
          title: "탐구 집중",
          items: [
            "탐구1 개념 정리",
            "탐구2 문제풀이",
            "기출 분석 노트",
            "취약 단원 보충",
          ],
        },
        {
          day: 5,
          title: "종합 복습",
          items: [
            "이번 주 오답 총정리",
            "취약 과목 보충 학습",
            "암기 사항 복습",
            "컨디션 체크 & 수면 관리",
          ],
        },
        {
          day: 6,
          title: "모의고사",
          items: [
            "실전 모의고사 풀기",
            "시간 배분 연습",
            "채점 및 성적 기록",
            "오답 분석 및 정리",
          ],
        },
        {
          day: 7,
          title: "회고 & 휴식",
          items: [
            "주간 학습 회고 작성",
            "다음 주 계획 수립",
            "가벼운 산책 30분",
            "충분한 수면",
          ],
        },
      ],
      100
    ),
    features: ["과목별 로드맵", "주간 모의고사", "오답 사이클", "D-day 추적"],
  },
  {
    id: "project-60days",
    name: "60일 사이드 프로젝트 런칭",
    description: "아이디어부터 런칭까지, 60일 완성 프로젝트 가이드",
    longDescription:
      "사이드 프로젝트를 시작하고 싶지만 어디서부터 해야 할지 모르겠다면? 60일 동안 아이디어 검증, 기획, 개발, 디자인, 런칭까지 단계별로 진행할 수 있는 프로젝트 관리 가이드입니다.",
    price: 7900,
    originalPrice: 12900,
    image:
      "https://images.unsplash.com/photo-1627634772120-60002287e9c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9qZWN0JTIwbWFuYWdlbWVudCUyMHRlYW13b3JrfGVufDF8fHx8MTc3MTQ2ODgzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "비즈니스",
    rating: 4.7,
    reviews: 189,
    color: "#B19CD9",
    durationDays: 60,
    tags: ["사이드프로젝트", "60일", "런칭가이드"],
    author: "스타트업 멘토 준혁",
    authorSubtitle: "사이드 프로젝트 5개 런칭 경험",
    dayPlans: (() => {
      const phases = [
        {
          name: "아이디어 검증",
          days: 10,
          weekly: [
            { title: "아이디어 브레인스토밍", items: ["아이디어 10개 리스트업", "시장 조사 키워드 정리", "경쟁사 분석 3개", "타겟 유저 정의"] },
            { title: "유저 리서치", items: ["설문지 작성", "인터뷰 대상 5명 섭외", "유저 페인포인트 정리", "핵심 가치 제안 정의"] },
            { title: "아이디어 정제", items: ["MVP 범위 설정", "핵심 기능 3가지 선정", "기술 스택 결정", "프로젝트 이름 결정"] },
            { title: "검증 실험", items: ["랜딩페이지 초안 작성", "사전 신청 폼 만들기", "SNS 채널 개설", "초기 피드백 수집"] },
            { title: "1주차 회고", items: ["검증 결과 분석", "피봇 여부 결정", "다음 단계 계획 수립", "멘토 상담 신청"] },
          ],
        },
        {
          name: "기획 & 디자인",
          days: 15,
          weekly: [
            { title: "정보 구조 설계", items: ["사이트맵 작성", "유저 플로우 설계", "와이어프레임 스케치", "API 설계 초안"] },
            { title: "UI 디자인", items: ["디자인 시스템 정의", "주요 화면 디자인", "프로토타입 제작", "디자인 리뷰"] },
            { title: "기획 확정", items: ["기능 명세서 완성", "일정 계획 수립", "리소스 체크", "개발 환경 세팅"] },
            { title: "개발 준비", items: ["Git 저장소 생성", "프로젝트 보일러플레이트", "CI/CD 설정", "테스트 환경 구축"] },
            { title: "2주차 회고", items: ["기획 완성도 점검", "디자인 최종 확인", "개발 타임라인 확정", "팀원 역할 재확인"] },
          ],
        },
        {
          name: "개발",
          days: 25,
          weekly: [
            { title: "핵심 기능 개발", items: ["메인 기능 코딩", "DB 스키마 생성", "인증 시스템 구현", "API 개발"] },
            { title: "서브 기능 개발", items: ["부가 기능 코딩", "에러 핸들링", "로딩/빈 상태 처리", "코드 리뷰"] },
            { title: "UI 구현", items: ["반응형 레이아웃", "애니메이션 추가", "접근성 점검", "크로스 브라우저 테스트"] },
            { title: "테스트", items: ["유닛 테스트 작성", "통합 테스트", "유저 시나리오 테스트", "버그 수정"] },
            { title: "개발 마무리", items: ["성능 최적화", "SEO 설정", "분석 도구 연동", "최종 코드 리뷰"] },
          ],
        },
        {
          name: "런칭 준비",
          days: 10,
          weekly: [
            { title: "런칭 콘텐츠", items: ["런칭 페이지 완성", "소개 영상 제작", "블로그 포스팅 작성", "SNS 홍보 준비"] },
            { title: "베타 테스트", items: ["베타 유저 모집", "피드백 수집", "긴급 버그 수정", "최종 기능 점검"] },
            { title: "런칭!", items: ["Product Hunt 등록", "커뮤니티 공유", "런칭 메일 발송", "실시간 모니터링"] },
            { title: "런칭 후 모니터링", items: ["유저 피드백 수집", "핵심 지표 분석", "긴급 이슈 대응", "후속 업데이트 계획"] },
            { title: "프로젝트 회고", items: ["60일 전체 회고", "KPI 달성률 확인", "다음 스프린트 계획", "감사 인사 전달"] },
          ],
        },
      ];
      const plans: DayPlan[] = [];
      let dayNum = 1;
      for (const phase of phases) {
        for (let i = 0; i < phase.days; i++) {
          const weeklyIdx = i % phase.weekly.length;
          const item = phase.weekly[weeklyIdx];
          plans.push({
            day: dayNum,
            title: `${phase.name} - ${item.title}`,
            items: item.items,
          });
          dayNum++;
        }
      }
      return plans;
    })(),
    features: ["단계별 가이드", "마일스톤 관리", "회고 시스템", "런칭 체크리스트"],
  },
  {
    id: "europe-travel-14",
    name: "14일 유럽 배낭여행 체크리스트",
    description: "2주간의 완벽한 유럽 여행을 위한 올인원 체크리스트",
    longDescription:
      "파리, 런던, 바르셀로나, 로마를 2주 안에 알차게 여행할 수 있는 완벽한 체크리스트입니다. 출발 전 준비물부터 도시별 여행 코스, 맛집, 교통편까지 빠짐없이 체크할 수 있습니다.",
    price: 2900,
    image:
      "https://images.unsplash.com/photo-1627836604409-5910fad626f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBjaGVja2xpc3QlMjBwYWNraW5nfGVufDF8fHx8MTc3MTQ2ODgzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "여행",
    rating: 4.5,
    reviews: 276,
    color: "#FF6961",
    durationDays: 14,
    tags: ["유럽여행", "14일", "배낭여행"],
    author: "트래블러 수아",
    authorSubtitle: "유럽 15회 방문 여행 블로거",
    dayPlans: [
      { day: 1, title: "출발 준비", items: ["여권/비자 최종 확인", "환전 완료 체크", "여행자 보험 가입", "짐 최종 점검", "공항 이동"] },
      { day: 2, title: "파리 Day 1", items: ["샤를드골 공항 도착", "숙소 체크인", "에펠탑 방문", "세느강 산책", "현지 레스토랑 저녁"] },
      { day: 3, title: "파리 Day 2", items: ["루브르 박물관 관람", "몽마르뜨 언덕 방문", "마카롱 맛집 방문", "개선문 야경 감상"] },
      { day: 4, title: "파리 Day 3", items: ["베르사유 궁전 당일치기", "오르세 미술관", "샹젤리제 쇼핑", "에펠탑 야경 사진"] },
      { day: 5, title: "런던 이동", items: ["유로스타 탑승", "런던 킹스크로스 도착", "숙소 체크인", "피쉬앤칩스 저녁", "런던아이 야경"] },
      { day: 6, title: "런던 Day 1", items: ["대영박물관 관람", "버킹엄 궁전 근위병 교대식", "빅벤 & 웨스트민스터", "코벤트 가든 구경"] },
      { day: 7, title: "런던 Day 2", items: ["타워브릿지 방문", "보로마켓 브런치", "해리포터 스튜디오", "소호 거리 저녁 식사"] },
      { day: 8, title: "바르셀로나 이동", items: ["히드로 공항 출발", "바르셀로나 도착", "숙소 체크인", "람블라스 거리 산책", "타파스 저녁"] },
      { day: 9, title: "바르셀로나 Day 1", items: ["사그라다 파밀리아", "구엘공원 방문", "고딕지구 탐방", "해변 산책"] },
      { day: 10, title: "바르셀로나 Day 2", items: ["카사 바트요 관람", "보케리아 시장", "몬주익 언덕", "플라멩코 공연 관람"] },
      { day: 11, title: "로마 이동", items: ["바르셀로나 공항 출발", "로마 피우미치노 도착", "숙소 체크인", "트레비 분수 방문", "로마 파스타 저녁"] },
      { day: 12, title: "로마 Day 1", items: ["콜로세움 입장", "포로 로마노 관람", "판테온 방문", "나보나 광장 산책", "젤라또 맛보기"] },
      { day: 13, title: "로마 Day 2", items: ["바티칸 박물관", "시스티나 성당", "성 베드로 대성당", "스페인 광장", "기념품 쇼핑"] },
      { day: 14, title: "귀국", items: ["숙소 체크아웃", "면세점 쇼핑", "공항 이동", "탑승 및 귀국", "여행 사진 백업"] },
    ],
    features: ["도시별 코스", "맛집 가이드", "교통편 정보", "준비물 체크"],
  },
  {
    id: "clean-diet-28",
    name: "28일 클린 식단 플랜",
    description: "4주간 건강한 식습관을 만드는 체계적인 식단 관리",
    longDescription:
      "영양사가 설계한 28일 클린 식단 플랜입니다. 매주 식단이 점진적으로 변화하며, 장보기 리스트부터 밀프렙 가이드까지 포함되어 있어 누구나 쉽게 따라할 수 있습니다. 체중 관리와 건강 개선 두 마리 토끼를 잡아보세요.",
    price: 3900,
    originalPrice: 5900,
    image:
      "https://images.unsplash.com/photo-1641301547846-2cf73f58fdca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWFsJTIwcGxhbm5pbmclMjBoZWFsdGh5JTIwZm9vZHxlbnwxfHx8fDE3NzE0Njg4Mzd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "건강",
    rating: 4.4,
    reviews: 156,
    color: "#98D8C8",
    durationDays: 28,
    tags: ["클린식단", "28일", "다이어트"],
    author: "영양사 유진",
    authorSubtitle: "임상영양 전문가",
    dayPlans: repeatWeekly(
      [
        {
          day: 1,
          title: "클린 식단 시작",
          items: [
            "아침: 오트밀 + 바나나 + 아몬드",
            "점심: 닭가슴살 샐러드 + 현미밥",
            "저녁: 연어 구이 + 채소 볶음",
            "간식: 그릭 요거트",
            "물 2L 마시기",
          ],
        },
        {
          day: 2,
          title: "고단백 식단",
          items: [
            "아침: 계란 프라이 2개 + 통밀빵",
            "점심: 소고기 덮밥 + 미소된장국",
            "저녁: 두부 스테이크 + 현미밥",
            "간식: 삶은 계란 + 견과류",
            "물 2L 마시기",
          ],
        },
        {
          day: 3,
          title: "저탄수화물 데이",
          items: [
            "아침: 아보카도 에그 보트",
            "점심: 치킨 시저 샐러드",
            "저녁: 새우 볶음 + 브로콜리",
            "간식: 방울토마토 + 치즈",
            "물 2L 마시기",
          ],
        },
        {
          day: 4,
          title: "지중해식 식단",
          items: [
            "아침: 그릭 요거트 + 그래놀라",
            "점심: 지중해식 파스타",
            "저녁: 생선구이 + 올리브 샐러드",
            "간식: 과일 플레이트",
            "물 2L 마시기",
          ],
        },
        {
          day: 5,
          title: "한식 클린 식단",
          items: [
            "아침: 잡곡밥 + 된장국 + 나물반찬",
            "점심: 비빔밥 (현미)",
            "저녁: 닭볶음탕 + 샐러드",
            "간식: 고구마 1개",
            "물 2L 마시기",
          ],
        },
        {
          day: 6,
          title: "밀프렙 데이",
          items: [
            "장보기 리스트 확인",
            "다음 주 식재료 구매",
            "닭가슴살 5일분 조리",
            "현미밥 5일분 소분",
            "채소 손질 및 보관",
          ],
        },
        {
          day: 7,
          title: "치팅 & 회고",
          items: [
            "좋아하는 음식 1끼 허용",
            "이번 주 체중/체지방 기록",
            "식단 일지 회고",
            "다음 주 식단 확인",
            "충분한 수면",
          ],
        },
      ],
      28
    ),
    features: ["매일 식단 제공", "장보기 리스트", "밀프렙 가이드", "영양 균형 체크"],
  },
  {
    id: "habit-21days",
    name: "21일 습관 만들기 챌린지",
    description: "뇌과학 기반, 21일이면 새로운 습관이 만들어집니다",
    longDescription:
      "뇌과학 연구에 따르면 21일이면 새로운 신경 경로가 형성됩니다. 이 챌린지는 하루 하나씩 작은 습관을 쌓아가며 21일 후 완전히 새로운 자신을 만들어갑니다. 매일 미션, 동기부여 메시지, 진행률 추적이 포함되어 있습니다.",
    price: 4900,
    image:
      "https://images.unsplash.com/photo-1768335566098-3b46cc4baeaa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWJpdCUyMGJ1aWxkaW5nJTIwam91cm5hbGluZyUyMHNlbGYlMjBpbXByb3ZlbWVudHxlbnwxfHx8fDE3NzE0Nzk2NTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "자기개발",
    rating: 4.6,
    reviews: 298,
    color: "#C8A2C8",
    durationDays: 21,
    tags: ["습관형성", "21일", "자기개발"],
    author: "심리상담사 하은",
    authorSubtitle: "행동심리학 전문가",
    dayPlans: [
      { day: 1, title: "시작 선언", items: ["21일 목표 구체적으로 적기", "현재 상태 기록 (사진/글)", "환경 설계하기", "동기부여 문구 적어 붙이기"] },
      { day: 2, title: "작은 시작", items: ["목표 습관 2분만 실천", "실천 후 기분 기록", "트리거 설정하기", "보상 정하기"] },
      { day: 3, title: "반복의 힘", items: ["어제와 같은 시간에 실천", "방해 요소 제거하기", "진행 기록 남기기", "긍정 확언 3번 읽기"] },
      { day: 4, title: "루틴에 연결", items: ["기존 습관에 새 습관 연결", "습관 스태킹 실천", "오늘의 감사일기", "수면 시간 기록"] },
      { day: 5, title: "5일차 점검", items: ["5일간 기록 되돌아보기", "어려웠던 점 적기", "전략 수정하기", "자신에게 칭찬하기"] },
      { day: 6, title: "환경 최적화", items: ["실천 환경 개선하기", "습관 큐 잘 보이게 배치", "방해물 숨기기", "오늘의 습관 실천"] },
      { day: 7, title: "1주차 회고", items: ["1주 성과 정리", "성공률 계산하기", "개선점 도출", "다음 주 목표 수정"] },
      { day: 8, title: "난이도 업", items: ["습관 시간 약간 늘리기", "오늘의 습관 실천", "에너지 레벨 기록", "명상 5분"] },
      { day: 9, title: "마인드셋", items: ["성장 마인드셋 글 읽기", "습관 관련 영상 시청", "오늘의 습관 실천", "감정 일기 쓰기"] },
      { day: 10, title: "중간 점검", items: ["10일 진행률 체크", "초기 기록과 비교", "변화한 점 기록", "SNS에 인증하기"] },
      { day: 11, title: "슬럼프 대비", items: ["의지력 저하 대처법 읽기", "비상 계획 세우기", "오늘의 습관 실천", "좋아하는 음악 들으며 실천"] },
      { day: 12, title: "연속성 강화", items: ["습관 체인 이어가기", "놓쳐도 2번 연속 놓치지 않기", "오늘의 습관 실천", "진행 그래프 그리기"] },
      { day: 13, title: "사회적 연결", items: ["함께 할 동료 찾기", "습관 인증 공유", "오늘의 습관 실천", "다른 사람 응원하기"] },
      { day: 14, title: "2주차 회고", items: ["2주 성과 정리", "습관 난이도 평가", "3주차 계획 수립", "보상 자신에게 주기"] },
      { day: 15, title: "자동화 시작", items: ["의식적 노력 줄이기", "자연스러운 실천 체험", "오늘의 습관 실천", "진행률 사진 기록"] },
      { day: 16, title: "응용 실천", items: ["습관의 변형 시도", "다른 상황에서 적용", "오늘의 습관 실천", "유연성 기르기"] },
      { day: 17, title: "장기 비전", items: ["6개월 후 모습 상상하기", "비전보드 만들기", "오늘의 습관 실천", "장기 계획 세우기"] },
      { day: 18, title: "감사 실천", items: ["이 습관을 시작한 자신에게 감사", "도움 준 사람에게 감사", "오늘의 습관 실천", "긍정 일기 쓰기"] },
      { day: 19, title: "최종 스퍼트", items: ["마지막 3일 집중 다짐", "습관 마무리 전략", "오늘의 습관 실천", "변화 기록 정리"] },
      { day: 20, title: "성찰의 날", items: ["21일간의 여정 되돌아보기", "가장 어려웠던 순간 기록", "오늘의 습관 실천", "내일 준비하기"] },
      { day: 21, title: "습관 완성!", items: ["최종 습관 실천", "Day 1 vs Day 21 비교", "전체 회고 작성", "다음 습관 계획 세우기", "축하하기!"] },
    ],
    features: ["매일 미션", "동기부여 메시지", "진행률 추적", "뇌과학 기반"],
  },
  {
    id: "productivity-90days",
    name: "90일 생산성 마스터 플랜",
    description: "분기 단위로 완성하는 생산성 극대화 시스템",
    longDescription:
      "3개월간 생산성을 체계적으로 높여가는 종합 플랜입니다. 첫 달은 시간 관리, 둘째 달은 집중력 강화, 셋째 달은 시스템 구축에 집중합니다. 포모도로 기법, 타임블로킹, GTD 등 검증된 생산성 방법론을 실천합니다.",
    price: 6900,
    originalPrice: 9900,
    image:
      "https://images.unsplash.com/photo-1705417272217-490f4511abeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0aXZpdHklMjB3b3Jrc3BhY2UlMjBtb3JuaW5nJTIwZGVzayUyMHBsYW5uZXJ8ZW58MXx8fHwxNzcxNDc5NjYzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    category: "생산성",
    rating: 4.8,
    reviews: 245,
    color: "#87CEEB",
    durationDays: 90,
    tags: ["생산성", "90일", "시간관리"],
    author: "GTD 코치 성민",
    authorSubtitle: "생산성 컨설턴트 7년차",
    dayPlans: repeatWeekly(
      [
        {
          day: 1,
          title: "시간 감사",
          items: [
            "오늘 시간 사용 기록하기",
            "포모도로 4세트 실천",
            "내일 할 일 3가지 적기",
            "디지털 디톡스 1시간",
          ],
        },
        {
          day: 2,
          title: "우선순위 설정",
          items: [
            "아이젠하워 매트릭스 작성",
            "MIT(Most Important Task) 1개 완료",
            "이메일 배치 처리",
            "15분 산책으로 리프레시",
          ],
        },
        {
          day: 3,
          title: "딥워크",
          items: [
            "2시간 방해 없는 집중 시간",
            "알림 모두 끄기",
            "중요 프로젝트 진행",
            "집중 후 보상 시간",
          ],
        },
        {
          day: 4,
          title: "시스템 정비",
          items: [
            "할 일 목록 정리",
            "불필요한 약속 정리",
            "자동화 가능한 일 찾기",
            "업무 환경 정리정돈",
          ],
        },
        {
          day: 5,
          title: "학습 & 성장",
          items: [
            "생산성 관련 글 읽기 20분",
            "새로운 도구/기법 시도",
            "멘토에게 질문하기",
            "주간 성과 중간 점검",
          ],
        },
        {
          day: 6,
          title: "회고 & 계획",
          items: [
            "이번 주 성과 정리",
            "시간 낭비 요인 분석",
            "다음 주 목표 설정",
            "에너지 관리 체크",
          ],
        },
        {
          day: 7,
          title: "충전",
          items: [
            "완전한 휴식 취하기",
            "취미 활동 시간",
            "다음 주 준비",
            "충분한 수면",
          ],
        },
      ],
      90
    ),
    features: ["포모도로 기법", "타임블로킹", "GTD 방법론", "분기 목표 관리"],
  },
];

export const categories = [
  "전체",
  "운동",
  "라이프스타일",
  "교육",
  "비즈니스",
  "여행",
  "건강",
  "자기개발",
  "생산성",
];