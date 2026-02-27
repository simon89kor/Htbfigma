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

_(현재 미해결 피드백 없음)_

---

## Resolved Feedbacks

### FB-001: process-payment Edge Function 필요 (Phase 2)
- **Reporter:** F2
- **Target:** B3
- **Severity:** SUGGESTION
- **Category:** EDGE_FUNCTION
- **Description:** 현재 MVP에서는 클라이언트가 `createPurchase` API를 직접 호출하여 구매를 처리하고 있음. Phase 2에서는 결제 검증과 금액 검증을 서버에서 수행하는 `process-payment` Edge Function이 필요함.
- **Status:** RESOLVED (2026-02-26)
- **Resolution:** B3 처리. `supabase/functions/process-payment/index.ts` — JWT 인증, 멱등성 체크, 서버 가격 산출, 결제수단 검증, purchase+user_routines+todo_items 생성. Hono+Deno 기반.

### FB-002: getRoutines에 priceRange 필터 옵션 추가 필요
- **Reporter:** F4
- **Target:** B2
- **Severity:** SUGGESTION
- **Category:** API_LAYER
- **Description:** `getRoutines()` API에 가격대 필터링 옵션 없음.
- **Status:** RESOLVED (2026-02-26)
- **Resolution:** B2 처리. `RoutineListOptions`에 `priceRange?: PriceRange` 추가. free/under5000/under10000/over10000 서버 필터링.

### FB-003: routine_likes 테이블 및 API 필요
- **Reporter:** F4
- **Target:** B1
- **Severity:** SUGGESTION
- **Category:** DB_SCHEMA
- **Description:** ProductDetailPage 좋아요 기능에 `routine_likes` 테이블 필요.
- **Status:** RESOLVED (2026-02-26)
- **Resolution:** B1 처리. `supabase/migrations/00013_create_routine_likes.sql` — routine_likes 테이블 + UNIQUE 제약조건 + RLS + 인덱스. `database.types.ts` 타입 추가.

### FB-004: get_user_stats RPC 함수 반환 형식 명세 필요
- **Reporter:** F6
- **Target:** B3
- **Severity:** IMPORTANT
- **Category:** EDGE_FUNCTION
- **Description:** `get_user_stats` RPC 반환 JSON이 ProgressStatsPage 기대 형식과 불일치.
- **Status:** RESOLVED (2026-02-26)
- **Resolution:** B3 처리. `supabase/migrations/00014_enhance_get_user_stats.sql` — 3개→9개 필드(camelCase) 전면 재구현. streak/weeklyCheckmarks/dailyRates/categoryDistribution/routineStats 추가.

### FB-005: store-context의 updateTodoItem에 memo/notification 서버 동기화 필요
- **Reporter:** F6
- **Target:** B2
- **Severity:** SUGGESTION
- **Category:** API_LAYER
- **Description:** store-context의 updateTodoItem이 memo/notification을 서버에 전달하지 않음.
- **Status:** RESOLVED (2026-02-26)
- **Resolution:** B2 처리. TodoItem 인터페이스에 memo/notification 필드 추가. updateTodoItem/updateCustomTodoItem에 파라미터 전달 + dbRoutineToTodoItem 매핑 추가.

### FB-006: Admin용 RLS 정책 보강 필요 (profiles UPDATE, routines SELECT/UPDATE)
- **Reporter:** F9
- **Target:** B1
- **Severity:** IMPORTANT
- **Category:** RLS_POLICY
- **Description:** Admin이 다른 유저 프로필 수정, 전체 루틴 조회/수정 시 RLS 차단.
- **Status:** RESOLVED (2026-02-26)
- **Resolution:** B1 처리. `supabase/migrations/00015_admin_rls_policies.sql` — profiles_update_own_or_admin, routines_select_published_or_admin, routines_update_own_or_admin 3개 정책 교체.
