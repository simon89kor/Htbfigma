# Backend Feedback Queue

> FE 에이전트(F1~F9)가 작업 중 백엔드 변경이 필요한 경우 이 파일에 피드백을 작성합니다.
> 각 Phase R0 리뷰 시 이 파일을 확인하여, 피드백이 있으면 B-에이전트를 재실행합니다.

---

## 작성 규칙

```markdown
### FB-{번호}: {제목}
- **Reporter:** {에이전트ID} (예: F1)
- **Target:** {B1 | B2 | B3}
- **Severity:** {BLOCKER | IMPORTANT | SUGGESTION}
- **Category:** {DB_SCHEMA | API_LAYER | TYPE_DEF | RLS_POLICY | EDGE_FUNCTION | AUTH}
- **Description:** {문제 상세}
- **Affected Files:** {관련 파일 경로}
- **Workaround:** {임시 우회 방법 (있으면)}
- **Status:** OPEN
```

### Severity 기준
| 레벨 | 설명 | 처리 시점 |
|------|------|----------|
| **BLOCKER** | FE 작업을 완료할 수 없음 (API 누락, 타입 에러 등) | Phase 완료 전 즉시 처리 |
| **IMPORTANT** | 우회 가능하나 반드시 수정 필요 (RLS 차단, 카운트 불일치 등) | Phase R0 리뷰 후 처리 |
| **SUGGESTION** | 성능/편의 개선 (새 RPC, 인덱스 추가 등) | 다음 Phase 전 검토 |

### Category 분류
| 카테고리 | 담당 | 예시 |
|---------|------|------|
| `DB_SCHEMA` | B1 | 테이블/컬럼/인덱스 추가·변경 필요 |
| `API_LAYER` | B2 | API 함수 누락, 시그니처 불일치, 반환 타입 오류 |
| `TYPE_DEF` | B1 | database.types.ts 불일치 |
| `RLS_POLICY` | B1 | RLS가 정상 접근을 차단 |
| `EDGE_FUNCTION` | B3 | Edge Function 수정/추가 필요 |
| `AUTH` | B2 | Auth 플로우 이슈 |

---

## Pending Feedbacks

### FB-001: process-payment Edge Function 필요 (Phase 2)
- **Reporter:** F2
- **Target:** B3
- **Severity:** SUGGESTION
- **Category:** EDGE_FUNCTION
- **Description:** 현재 MVP에서는 클라이언트가 `createPurchase` API를 직접 호출하여 구매를 처리하고 있음. Phase 2에서는 결제 검증과 금액 검증을 서버에서 수행하는 `process-payment` Edge Function이 필요함. 클라이언트는 Edge Function만 호출하고, Edge Function이 금액 검증 후 purchase 레코드를 생성하는 구조로 변경 필요.
- **Affected Files:** `src/app/components/PaymentMethodPage.tsx`, `src/lib/api/purchases.ts`, `supabase/functions/process-payment/`
- **Workaround:** 클라이언트에서 `createPurchase` API 직접 호출 (금액 검증 없이 MVP 처리)
- **Status:** RESOLVED
- **Resolution:** B3이 처리 완료 (2026-02-26). `supabase/functions/process-payment/index.ts`에 완전한 Edge Function 구현 완료. 주요 기능: (1) JWT 인증 검증, (2) 요청 파라미터 유효성 검사, (3) 멱등성 체크 (동일 루틴/기간 중복 구매 방지 + idempotency_key 지원), (4) 서버에서 `routine_periods` 테이블 조회하여 실제 가격 산출 (클라이언트 금액 불신), (5) 무료/유료 결제 수단 교차 검증, (6) 루틴 published 상태 확인, (7) purchases 레코드 생성, (8) user_routines 레코드 생성 (실패 시 purchase 롤백), (9) day_plans 기반 todo_items 일괄 생성 (500개 배치), (10) 구매 완료 알림 생성. Hono + Deno 기반, CORS 설정 및 health check 엔드포인트 포함.

### FB-002: getRoutines에 priceRange 필터 옵션 추가 필요
- **Reporter:** F4
- **Target:** B2
- **Severity:** SUGGESTION
- **Category:** API_LAYER
- **Description:** `getRoutines()` API 함수에 가격대 필터링 옵션(`priceRange`)이 없음. 검색 결과 페이지에서 "무료 / ~5,000 / ~10,000 / 10,000~" 가격대 필터를 적용할 때 서버 사이드 필터링이 필요함. 현재는 클라이언트에서 로컬 데이터(data.ts)를 기반으로 필터링하고 있어 기능 동작에는 문제 없음.
- **Affected Files:** `src/lib/api/routines.ts` (RoutineListOptions 인터페이스 + getRoutines 함수)
- **Workaround:** 클라이언트 사이드 필터링으로 처리 (SearchResultPage.tsx)
- **Status:** RESOLVED
- **Resolution:** `RoutineListOptions`에 `priceRange?: PriceRange` 옵션 추가 (`PriceRange = 'free' | 'under5000' | 'under10000' | 'over10000'`). `getRoutines` 함수에 priceRange에 따른 `.eq()/.gt()/.lte()` 필터 로직 추가. free: price=0, under5000: price>0 AND price<=5000, under10000: price>5000 AND price<=10000, over10000: price>10000.

### FB-003: routine_likes 테이블 및 API 필요
- **Reporter:** F4
- **Target:** B1
- **Severity:** SUGGESTION
- **Category:** DB_SCHEMA
- **Description:** ProductDetailPage에 좋아요(하트) 토글 기능을 추가했으나, 현재 DB에 `routine_likes` 테이블이 없어 localStorage로 우회 처리함. 서버 사이드 좋아요 저장을 위해 `routine_likes(id, user_id, routine_id, created_at)` 테이블과 API가 필요함.
- **Affected Files:** `src/lib/database.types.ts`, 신규 `src/lib/api/routine-likes.ts` 또는 `routines.ts` 확장
- **Workaround:** localStorage 기반 좋아요 상태 저장 (`htb_liked_products` 키)
- **Status:** RESOLVED
- **Resolution:** B1이 처리 완료 (2026-02-26). `routine_likes` 테이블 생성 마이그레이션 추가 (`supabase/migrations/00013_create_routine_likes.sql`). 스키마: id(uuid PK), user_id(FK->auth.users), routine_id(FK->routines), created_at(timestamptz). UNIQUE(user_id, routine_id) 제약조건. RLS 정책: SELECT 공개, INSERT/DELETE 본인만. 인덱스: user_id, routine_id, (routine_id, created_at DESC). `database.types.ts`에 RoutineLike/RoutineLikeInsert/RoutineLikeUpdate 타입 추가 완료. API 레이어(`routine-likes.ts`) 생성은 B2 담당.

### FB-004: get_user_stats RPC 함수 반환 형식 명세 필요
- **Reporter:** F6
- **Target:** B3
- **Severity:** IMPORTANT
- **Category:** EDGE_FUNCTION
- **Description:** `get_user_stats(target_user_id, period)` RPC 함수의 반환 JSON 형식이 명시되지 않음. ProgressStatsPage에서 아래 형식을 기대하고 구현함. RPC가 이 형식과 다르면 파싱 실패할 수 있음.
  ```json
  {
    "totalCompleted": number,
    "totalTasks": number,
    "completionRate": number,
    "currentStreak": number,
    "longestStreak": number,
    "weeklyCheckmarks": boolean[7],
    "dailyRates": [{ "date": string, "rate": number }],
    "categoryDistribution": [{ "category": string, "percentage": number }],
    "routineStats": [{ "routineId": string, "routineName": string, "completionRate": number }]
  }
  ```
- **Affected Files:** `src/app/components/ProgressStatsPage.tsx`, DB function `get_user_stats`
- **Workaround:** ProgressStatsPage에서 RPC 실패 시 빈 데이터 객체로 폴백 처리됨. 차트들은 Empty State를 표시.
- **Status:** RESOLVED
- **Resolution:** B3이 처리 완료 (2026-02-26). `supabase/migrations/00014_enhance_get_user_stats.sql`에서 `get_user_stats` 함수를 `CREATE OR REPLACE`로 전면 재구현. 기존 3개 필드(total_completed, total_tasks, completion_rate) 반환에서 ProgressStatsPage의 기대 형식(camelCase)에 완전히 맞춘 9개 필드로 확장: (1) totalCompleted/totalTasks/completionRate: period(week=7일, month=30일) 기간 내 todo_items 집계, (2) currentStreak: 오늘부터 과거로 연속 달성일 계산 (투두 없는 날 7일까지 건너뜀), (3) longestStreak: profiles 테이블의 longest_streak과 현재값 비교 후 큰 값, (4) weeklyCheckmarks: 이번 주 월~일 7일간 boolean 배열, (5) dailyRates: 기간 내 일별 완료율 배열, (6) categoryDistribution: user_routines.category 기반 비율 분포, (7) routineStats: 활성 루틴별 완료율.

### FB-005: store-context의 updateTodoItem에 memo/notification 서버 동기화 필요
- **Reporter:** F6
- **Target:** B2
- **Severity:** SUGGESTION
- **Category:** API_LAYER
- **Description:** TodoDetailSheet에서 memo와 notification 필드를 저장할 때, `updateTodoItem` API 함수를 통해 서버에 전달함. `user-routines.ts`의 `updateTodoItem`은 `memo`와 `notification` 파라미터를 이미 지원하지만, store-context의 `updateTodoItem`/`updateCustomTodoItem`은 현재 `memo`와 `notification`을 서버에 전달하지 않음 (repeatDays와 time만 전달). store-context 수정 필요.
- **Affected Files:** `src/app/store-context.tsx` (updateTodoItem, updateCustomTodoItem 함수)
- **Workaround:** 시간, 반복 설정은 정상 저장됨. memo/notification은 로컬 상태에만 반영되고 서버 동기화는 store-context 수정 후 완전해짐.
- **Status:** RESOLVED
- **Resolution:** `TodoItem` 인터페이스에 `memo?: string`과 `notification?: 'none' | 'ontime' | '10min' | '30min'` 필드 추가. `updateTodoItem`과 `updateCustomTodoItem` 함수의 `apiUpdateTodoItem` 호출부에 `memo`와 `notification` 파라미터 전달 추가. `dbRoutineToTodoItem` 헬퍼에도 `memo`/`notification` 매핑 추가하여 서버에서 로드 시에도 값이 유지됨.

---

## Resolved Feedbacks

_(처리 완료된 피드백은 여기로 이동)_
