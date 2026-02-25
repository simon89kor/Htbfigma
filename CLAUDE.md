# HTB Project — Claude Code Instructions

## 프로젝트 개요
- **HOW TO BE (HTB)** — 루틴 마켓플레이스 (React 18 + Vite + TS + Tailwind + Supabase)
- 기존 9개 페이지 구현 완료, 추가 기능 개발 중
- 프론트엔드는 현재 localStorage 기반 → Supabase 연동 전환 진행 중

## Agent 시스템

이 프로젝트는 **14개 서브 에이전트** 체계로 개발합니다. (개발 12 + 기획 1 + 리뷰 1)

### 문서 위치
```
doc/
├── 00_INDEX.md              # 기획서 인덱스
├── 01~09_*.md               # 기능별 기획서
├── SUBAGENT_PLAN.md         # 전체 에이전트 구성 + 실행 전략
├── BACKEND_FEEDBACK.md      # FE→BE 피드백 큐
├── CHANGELOG.md             # 변경 이력 (기획 변경, 스키마 변경 추적)
└── agents/
    ├── INDEX.md             # 에이전트 인덱스
    ├── COMMON.md            # 공통 규약 (디자인 토큰, 코딩 컨벤션)
    ├── P0_PLANNER.md        # 기획 에이전트 (형상관리, 문서 동기화)
    ├── R0_REVIEWER.md       # 리뷰어 에이전트 (품질 게이트 + 통합 검증)
    ├── B1_DB_ARCHITECT.md   # DB 설계 에이전트
    ├── B2_SUPABASE_CLIENT.md # FE-BE 연동 에이전트
    ├── B3_EDGE_FUNCTIONS.md # 서버 로직 에이전트
    ├── F1_ONBOARDING.md     # 온보딩 에이전트
    ├── F2_PURCHASE.md       # 결제 에이전트
    ├── F3_MYPAGE_CORE.md    # 마이페이지 에이전트
    ├── F4_HOME_EXT.md       # 홈 확장 에이전트
    ├── F5_COMMUNITY.md      # 커뮤니티 에이전트
    ├── F6_BOARD_EXT.md      # 보드 확장 에이전트
    ├── F7_NOTIFICATION.md   # 알림 에이전트
    ├── F8_REWARD.md         # 리워드 에이전트
    └── F9_ADMIN.md          # 어드민 에이전트
```

### 실행 순서 & 의존성
```
Phase 0 (Backend):  B1 → (B2 + B3 병렬) → R0 리뷰(통합 검증) → P0 기획 동기화
Phase 1 (FE P0):   F1 + F2 + F3 병렬 → R0 리뷰(통합 검증) → Backend Feedback 처리 → P0 기획 동기화
Phase 2 (FE P1):   F4 + F5 + F6 + F7 병렬 → R0 리뷰(통합 검증) → Backend Feedback 처리 → P0 기획 동기화
Phase 3 (FE P2~3): F8 + F9 병렬 → R0 리뷰(통합 검증) → Backend Feedback 처리 → P0 기획 동기화

각 Phase 완료 후:
1. R0 리뷰어가 산출물 품질 + 시스템 통합 검증 (PASS/FAIL)
   - 시스템 통합: API 계약, 에이전트 간 충돌, 이전 Phase 호환성, 공유 파일 무결성
2. FAIL / 통합 ISSUE 있으면 → 해당 에이전트 재실행하여 수정
3. Backend Feedback 확인 → 피드백 있으면 B-에이전트 재실행 (아래 참조)
4. 모두 PASS 후 → routes.ts + Layout.tsx 통합 머지
5. P0 Planner 실행 → 기획 문서 동기화 + CHANGELOG 기록
6. 다음 Phase 진행
```

### 유저 명령어 → 실행 매핑

| 유저가 말하면 | 실행할 작업 |
|-------------|-----------|
| "Phase 0 시작" | B1 먼저 실행 → 완료 후 B2 + B3 병렬 실행 → R0 리뷰 |
| "Phase 1 시작" | F1 + F2 + F3 병렬 실행 (worktree 격리) → R0 리뷰 |
| "Phase 2 시작" | F4 + F5 + F6 + F7 병렬 실행 (worktree 격리) → R0 리뷰 |
| "Phase 3 시작" | F8 + F9 병렬 실행 (worktree 격리) → R0 리뷰 |
| "B1 실행" | B1 단독 실행 |
| "F5 실행" | F5(community) 단독 실행 |
| "리뷰" / "Phase N 리뷰" | R0 리뷰어로 현재/지정 Phase 산출물 검증 |
| "피드백 처리" | BACKEND_FEEDBACK.md의 OPEN 피드백을 B-에이전트로 처리 |
| "피드백 확인" | BACKEND_FEEDBACK.md 현황 요약 |
| "기획 동기화" / "P0 실행" | P0 Planner로 기획 문서 ↔ 구현 정합성 검증 + 동기화 |
| "통합 머지" | 현재 Phase의 routes.ts + Layout.tsx 충돌 해결 |
| "현재 상태" | 각 Phase/Agent 진행 상황 확인 |
| "변경 이력" | CHANGELOG.md 확인 |

### 에이전트 실행 방법

에이전트를 실행할 때는 반드시 **Task 도구**를 사용하며, 아래 프롬프트 구조를 따릅니다:

```
당신은 HTB 프로젝트의 [{에이전트ID}: {역할}] 입니다.

## 사전 준비
작업 시작 전 반드시 다음 문서를 순서대로 읽으세요:
1. doc/agents/COMMON.md (공통 규약)
2. doc/agents/{에이전트ID}.md (당신의 Identity, Rules, Quality Checklist)
3. doc/{관련_기획서}.md (기획 상세)

## 작업 지시
{구체적 작업 내용}

## 규칙
- Identity 문서의 Rules 섹션을 반드시 준수
- 작업 완료 시 Quality Checklist 모든 항목 충족 확인
- 다른 에이전트 담당 파일은 수정하지 않기
```

### 병렬 실행 시 충돌 방지

같은 Phase 내 에이전트들이 동시 실행될 때:
- **worktree 격리 사용** (`isolation: "worktree"`)
- 공유 파일(routes.ts, Layout.tsx)은 Phase 완료 후 메인에서 통합
- 각 에이전트는 자기 담당 파일만 수정

### 리뷰어 실행 방법

Phase 완료 후 R0 리뷰어를 실행할 때는 아래 프롬프트 구조를 따릅니다:

```
당신은 HTB 프로젝트의 [R0: Reviewer] 입니다.

## 사전 준비
작업 시작 전 반드시 다음 문서를 순서대로 읽으세요:
1. doc/agents/COMMON.md (공통 규약)
2. doc/agents/R0_REVIEWER.md (당신의 Identity, Rules, Review Checklist)
3. 리뷰 대상 에이전트들의 Identity 문서
4. 관련 기획서

## 리뷰 대상
Phase {N}의 모든 에이전트 산출물

## 리뷰 지시
1. 각 에이전트의 산출물 파일을 직접 읽고 검증
2. Identity 문서의 Quality Checklist 항목 대조
3. 기획서 요구사항 누락 여부 확인
4. 에이전트 간 연동 정합성 확인
5. PASS/FAIL 판정 및 수정 지시 반환

## 규칙
- 실제 파일을 직접 읽어서 검증 (보고서만 보지 말 것)
- 산출물을 직접 수정하지 말 것 (리뷰만)
- Critical 문제와 Non-critical 개선을 구분할 것
```

### 리뷰 후 수정 플로우

R0 리뷰 결과가 FAIL인 경우:
1. FAIL 항목의 수정 지시를 해당 에이전트에게 전달
2. 해당 에이전트 재실행 (수정 사항만 포커스)
3. R0 재리뷰 (수정된 부분만)
4. 모두 PASS → 다음 Phase 진행

### Backend Feedback 처리 플로우

FE 에이전트(F1~F9)가 작업 중 백엔드 변경이 필요하면 `doc/BACKEND_FEEDBACK.md`에 피드백을 작성합니다.

#### FE 에이전트 작업 중 (피드백 작성)
```
FE 에이전트가 백엔드 문제 발견
  → BLOCKER: 피드백 작성 + TODO 주석으로 임시 우회 후 나머지 작업 계속
  → IMPORTANT: 피드백 작성 + 우회 코드로 작업 계속
  → SUGGESTION: 피드백 작성만 (작업에 영향 없음)
```

#### R0 리뷰 후 (피드백 처리)
```
R0 리뷰 완료 → doc/BACKEND_FEEDBACK.md 확인
  → OPEN 피드백이 있으면:
    1. BLOCKER/IMPORTANT → 해당 B-에이전트(B1/B2/B3) 재실행
    2. B-에이전트가 백엔드 수정 + 피드백 Status를 RESOLVED로 변경
    3. 영향받은 FE 에이전트 재실행 (TODO 주석/우회 코드 제거)
    4. SUGGESTION → 다음 Phase 전 검토하여 필요시 처리
  → OPEN 피드백 없으면: 다음 Phase 진행
```

#### 피드백 작성 형식
```markdown
### FB-{번호}: {제목}
- **Reporter:** {에이전트ID}
- **Target:** {B1 | B2 | B3}
- **Severity:** {BLOCKER | IMPORTANT | SUGGESTION}
- **Category:** {DB_SCHEMA | API_LAYER | TYPE_DEF | RLS_POLICY | EDGE_FUNCTION | AUTH}
- **Description:** {문제 상세}
- **Affected Files:** {관련 파일 경로}
- **Workaround:** {임시 우회 방법}
- **Status:** OPEN
```

#### B-에이전트 재실행 프롬프트
```
당신은 HTB 프로젝트의 [{B에이전트ID}: {역할}] 입니다.

## 사전 준비
1. doc/agents/COMMON.md (공통 규약)
2. doc/agents/{B에이전트ID}.md (당신의 Identity)
3. doc/BACKEND_FEEDBACK.md (처리할 피드백 목록)

## 작업 지시
BACKEND_FEEDBACK.md에서 Target이 당신({B에이전트ID})인 OPEN 피드백을 처리하세요.

## 규칙
- 각 피드백의 Description과 Affected Files를 확인하고 수정
- 수정 완료 후 해당 피드백의 Status를 RESOLVED로 변경
- Resolution 내용을 피드백 항목에 추가
```

### P0 Planner 실행 방법 (기획 동기화)

R0 리뷰 + Backend Feedback 처리가 모두 완료된 후, P0 Planner를 실행합니다:

```
당신은 HTB 프로젝트의 [P0: Planner & Configuration Manager] 입니다.

## 사전 준비
작업 시작 전 반드시 다음 문서를 순서대로 읽으세요:
1. doc/agents/COMMON.md (공통 규약)
2. doc/agents/P0_PLANNER.md (당신의 Identity, Rules, Workflow)
3. Phase {N}에 해당하는 기획서 (doc/0N_*.md)
4. Phase {N}의 에이전트 Identity 문서 (산출물 목록 확인)
5. doc/CHANGELOG.md (이전 변경 이력)

## 작업 지시
Phase {N} 완료 후 기획 문서 동기화를 수행하세요.

1. 해당 Phase의 산출물 파일을 직접 읽고, 기획서와 대조
2. 기획 ↔ 구현 괴리가 있으면 기획서를 업데이트
3. DATABASE_SCHEMA.md가 최신 상태인지 확인
4. PROGRESS.md 업데이트
5. CHANGELOG.md에 변경 사항 기록
6. Planning Sync Report 작성하여 반환

## 규칙
- 코드는 수정하지 않기 (문서만 수정)
- 기획서 수정 시 반드시 CHANGELOG에 사유 기록
- 기획 의도를 임의로 변경하지 않기 (구현에 맞추되, 의도 변경 시 명시)
```

### 전체 Phase 완료 플로우 요약

```
에이전트 작업 완료
  → R0 리뷰 (품질 + 시스템 통합 검증)
    → FAIL → 수정 → 재리뷰
    → PASS
  → Backend Feedback 확인
    → OPEN 있음 → B-에이전트 재실행 → FE 에이전트 재실행
    → 없음
  → 통합 머지 (routes.ts + Layout.tsx)
  → P0 Planner (기획 동기화 + CHANGELOG)
  → 다음 Phase 진행
```

### 진행 상황 추적

작업 진행 시 `doc/PROGRESS.md` 파일을 업데이트하여 상태를 기록합니다:
```markdown
## Phase 0
- [x] B1: DB Schema — 완료 (2026-02-25)
- [ ] B2: Supabase Client — 진행중
- [ ] B3: Edge Functions — 대기
- [ ] R0: 리뷰 — 대기 (Phase 완료 후)
- [ ] P0: 기획 동기화 — 대기 (리뷰 완료 후)
```
