# HTB Project — Claude Code Instructions

## 프로젝트 개요
- **HOW TO BE (HTB)** — 루틴 마켓플레이스 (React 18 + Vite + TS + Tailwind + Supabase)
- 기존 9개 페이지 구현 완료, 추가 기능 개발 중
- 프론트엔드는 현재 localStorage 기반 → Supabase 연동 전환 진행 중

## Agent 시스템

이 프로젝트는 **12개 서브 에이전트** 체계로 개발합니다.

### 문서 위치
```
doc/
├── 00_INDEX.md              # 기획서 인덱스
├── 01~09_*.md               # 기능별 기획서
├── SUBAGENT_PLAN.md         # 전체 에이전트 구성 + 실행 전략
└── agents/
    ├── INDEX.md             # 에이전트 인덱스
    ├── COMMON.md            # 공통 규약 (디자인 토큰, 코딩 컨벤션)
    ├── R0_REVIEWER.md       # 리뷰어 에이전트 (품질 게이트)
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
Phase 0 (Backend):  B1 → (B2 + B3 병렬) → R0 리뷰
Phase 1 (FE P0):   F1 + F2 + F3 병렬 → R0 리뷰
Phase 2 (FE P1):   F4 + F5 + F6 + F7 병렬 → R0 리뷰
Phase 3 (FE P2~3): F8 + F9 병렬 → R0 리뷰

각 Phase 완료 후:
1. R0 리뷰어가 산출물 품질 검증 (PASS/FAIL)
2. FAIL 항목 있으면 → 해당 에이전트 재실행하여 수정
3. 모두 PASS 후 → routes.ts + Layout.tsx 통합 머지
4. 다음 Phase 진행
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
| "통합 머지" | 현재 Phase의 routes.ts + Layout.tsx 충돌 해결 |
| "현재 상태" | 각 Phase/Agent 진행 상황 확인 |

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

### 진행 상황 추적

작업 진행 시 `doc/PROGRESS.md` 파일을 업데이트하여 상태를 기록합니다:
```markdown
## Phase 0
- [x] B1: DB Schema — 완료 (2026-02-25)
- [ ] B2: Supabase Client — 진행중
- [ ] B3: Edge Functions — 대기
- [ ] R0: 리뷰 — 대기 (Phase 완료 후)
```
