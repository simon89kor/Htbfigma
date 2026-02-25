# 05. BOARD 확장 기획서

**우선순위:** P1 (Important)
**상태:** PARTIAL - CalendarView, TodoListUsable, CreateRoutinePage 존재
**관련 기존 파일:** `CalendarView.tsx`, `TodoListUsable.tsx`, `CreateRoutinePage.tsx`, `MyListsPage.tsx`

---

## 1. 현재 상태 분석

### 구현 완료
- `CalendarView.tsx` - 캘린더 뷰 (날짜별 할일 표시)
- `TodoListUsable.tsx` - 투두리스트 (체크, 서브아이템)
- `CreateRoutinePage.tsx` - 직접 루틴 만들기
- `MyListsPage.tsx` - 구매/커스텀 리스트 관리

### 부분 구현
- Todo Detail Settings - 시간 설정/반복 기능은 데이터 구조에 있으나 UI 미완성

### 누락
- Progress & Stats (완료율 차트, 스트릭, 추이)

---

## 2. 상세 기획

### BOARD-EXT-01: Todo Detail Settings 강화

**위치:** TodoListUsable 내 투두 아이템 상세 설정
**수정 대상:** `TodoListUsable.tsx`

#### 현재 데이터 구조 (store-context.tsx)
```typescript
// 이미 정의되어 있는 구조
interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  subItems: SubItem[];
  repeatDays?: string[];    // 반복 요일 (이미 존재)
  time?: string;            // 시간 설정 (이미 존재)
}
```

#### 추가 UI - Todo 상세 설정 Bottom Sheet
```
┌─────────────────────────┐
│  (반투명 오버레이)         │
├─────────────────────────┤
│  ── (드래그 핸들)         │
│                         │
│  아침 스트레칭             │  ← 할일 제목
│  ─────────────────────  │
│                         │
│  ⏰ 시간 설정              │
│  [  08:00  AM  ]        │  ← 타임 피커
│                         │
│  🔄 반복 설정              │
│  [월][화][수][목][금][토][일]│  ← 요일 선택 칩
│                         │
│  📝 메모                  │
│  [메모를 입력하세요...   ]  │
│                         │
│  🔔 알림                  │
│  ○ 없음  ● 시작 시  ○ 10분전│
│                         │
│  ─────────────────────  │
│  [ 저장하기 ]             │
└─────────────────────────┘
```

#### 추가 필요 데이터
```typescript
interface TodoItem {
  // 기존...
  memo?: string;           // 메모
  notification?: 'none' | 'ontime' | '10min' | '30min';  // 알림
  priority?: 'low' | 'medium' | 'high';  // 우선순위
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 투두 아이템 길게 누르기 또는 > 탭 | 상세 설정 Bottom Sheet 열기 |
| 시간 설정 | 타임 피커 표시 |
| 요일 선택 | 토글 (다중 선택) |
| 저장하기 | store-context 업데이트 + Bottom Sheet 닫기 |

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 선택된 요일 칩 | `--accent-color` 배경 + White 텍스트 |
| 비선택 요일 칩 | `--bg-secondary` 배경 |
| 타임 피커 | 네이티브 time input 또는 커스텀 피커 |
| 저장 버튼 | `--accent-color` 배경, 52px |

---

### BOARD-EXT-02: Progress & Stats

**경로:** `/stats`
**컴포넌트:** `ProgressStatsPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  ← 통계           [기간]▼│
│  ─────────────────────  │
│                         │
│  📊 이번 주 달성률         │
│  ┌─────────────────────┐│
│  │    75%              ││
│  │  ████████░░░        ││  ← 원형 프로그레스
│  │                     ││
│  │  완료 15 / 전체 20   ││
│  └─────────────────────┘│
│                         │
│  🔥 연속 달성일 (Streak)   │
│  ┌─────────────────────┐│
│  │  🔥 12일 연속!       ││
│  │  월 화 수 목 금 토 일  ││
│  │  ✅ ✅ ✅ ✅ ✅ ○ ○  ││
│  └─────────────────────┘│
│                         │
│  📈 주간 달성 추이         │
│  ┌─────────────────────┐│
│  │  (라인 차트)          ││
│  │  100%─              ││
│  │   80%─    ╱╲        ││
│  │   60%─  ╱    ╲╱     ││
│  │   40%─╱             ││
│  │       월 화 수 목 금  ││
│  └─────────────────────┘│
│                         │
│  🥧 카테고리별 시간 분배    │
│  ┌─────────────────────┐│
│  │  (파이 차트)          ││
│  │   운동 40%           ││
│  │   식단 30%           ││
│  │   자기개발 20%        ││
│  │   기타 10%           ││
│  └─────────────────────┘│
│                         │
│  📋 루틴별 완료율          │
│  ┌─────────────────────┐│
│  │ 아침 운동   ████░ 80%││
│  │ 식단 관리   ███░░ 60%││
│  │ 독서 습관   █████ 100%│
│  └─────────────────────┘│
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface StatsData {
  period: 'week' | 'month' | 'all';

  // 전체 달성률
  totalCompleted: number;
  totalTasks: number;
  completionRate: number;

  // 스트릭
  currentStreak: number;
  longestStreak: number;
  weeklyCheckmarks: boolean[];  // [월~일]

  // 주간 추이
  dailyRates: {
    date: string;
    rate: number;
  }[];

  // 카테고리별 분배
  categoryDistribution: {
    category: string;
    percentage: number;
    color: string;
  }[];

  // 루틴별 완료율
  routineStats: {
    routineId: string;
    routineName: string;
    completionRate: number;
  }[];
}
```

#### 섹션 상세

**1. 이번 주 달성률**
- 원형 프로그레스 (또는 반원 게이지)
- 완료 수 / 전체 수 텍스트
- `recharts`의 `PieChart` 또는 `RadialBarChart` 활용

**2. 연속 달성일 (Streak)**
- 불꽃 이모지 + 연속 일수
- 이번 주 체크마크 그리드 (월~일)
- 최장 스트릭 기록 표시

**3. 주간/월간 달성 추이**
- 라인 차트 (x: 날짜, y: 달성률 %)
- `recharts`의 `LineChart` 활용
- 기간 필터: 1주 / 1개월 / 3개월

**4. 카테고리별 시간 분배**
- 파이 차트 (도넛 차트)
- `recharts`의 `PieChart` 활용
- 각 카테고리별 색상 + 퍼센트

**5. 루틴별 완료율**
- 가로 프로그레스 바
- 루틴명 + 퍼센트
- 탭 시 BOARD 해당 루틴으로 이동

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 기간 필터 변경 | 모든 차트 데이터 업데이트 |
| 루틴 항목 탭 | → BOARD 해당 루틴 |
| 차트 데이터 포인트 탭 | 툴팁 표시 |

#### API
- `GET /api/users/me/stats?period={week|month|all}`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 카드 | White 배경, border-radius 12px, shadow-sm |
| 프로그레스 색상 | `--accent-color` (#65D9AC) |
| 차트 색상 | `--accent-color` 기반 팔레트 |
| 스트릭 불꽃 | 🔥 이모지 + 숫자 강조 |
| 체크마크 | ✅ 달성 / ○ 미달성 |

#### 기술 구현
- `recharts` 라이브러리 활용 (이미 설치됨)
- 차트 종류: `LineChart`, `PieChart`, `BarChart`, `RadialBarChart`
- 반응형 `ResponsiveContainer` 사용

---

### BOARD-EXT-03: CalendarView 강화 사항

현재 CalendarView에 추가하면 좋을 요소:

| 항목 | 설명 |
|------|------|
| 월간 뷰 달성 마커 | 날짜에 달성률 표시 (도트 또는 색상) |
| 주간 뷰 | 주간 타임라인 뷰 옵션 |
| 통계 링크 | 캘린더 상단에 "통계 보기" 버튼 |
| 드래그 이동 | 미완료 투두를 다른 날짜로 드래그 이동 |

---

## 3. 라우트 추가

```typescript
// routes.ts
{ path: '/stats', element: <ProgressStatsPage /> },
```

## 4. 신규 파일 목록

| 파일 | 설명 |
|------|------|
| `src/app/components/ProgressStatsPage.tsx` | 통계 & 진척도 페이지 |
| `src/app/components/TodoDetailSheet.tsx` | 투두 상세 설정 Bottom Sheet |
| `src/app/components/StatsChart.tsx` | 차트 래퍼 컴포넌트 (선택) |
