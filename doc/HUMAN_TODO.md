# Human TODO — 수동 처리 필요 항목

> 에이전트가 구현하지 않았거나, 사람이 직접 처리해야 하는 작업 목록입니다.
> 각 Phase 완료 시 업데이트됩니다.

---

## 상태 범례
- `[ ]` 미처리
- `[~]` 진행중
- `[x]` 완료

---

## Phase 1 잔여 항목

### 에셋 준비
- [ ] HTB 로고 SVG 에셋 — 현재 Lucide `CheckSquare` 아이콘으로 대체 중
  - 대상: `SplashScreen.tsx`, `WalkthroughPage.tsx`
- [ ] 워크스루 일러스트 3장 — 현재 Lucide 아이콘(BookOpen, CalendarCheck, Users) placeholder
  - 대상: `WalkthroughPage.tsx`

### Settings 페이지 기능 구현
- [ ] 비밀번호 변경 — 현재 `toast.info("준비 중입니다")` placeholder
  - 대상: `SettingsPage.tsx` → Supabase `updateUser({ password })` 연동 필요
- [ ] 소셜 계정 연동 관리 — 현재 placeholder
  - 대상: `SettingsPage.tsx` → Supabase Auth identities API 연동
- [ ] 결제 수단 관리 — 현재 placeholder
  - 대상: `SettingsPage.tsx` → Phase 2 PG 연동 후 구현 가능

### 기획 확인 필요
- [ ] MyListsPage 탭 구조 최종 결정 — 기획서(4탭) vs 구현(3탭) 괴리
  - DB `user_routines` 테이블: `status`(진행상태)와 `is_custom`(소유형태)로 2축 분류 가능
  - 현재 구현: 소유 형태 기준 3탭 + 프로그레스 요약 카드로 진행/완료 표시
  - **결정 필요**: 기획서를 현재 구현에 맞춰 수정할지, 구현을 변경할지

---

## Phase 2 사전 준비

### Backend Feedback
- [ ] FB-001 검토: `process-payment` Edge Function 필요 (SUGGESTION)
  - Phase 2에서 PG 연동 시 함께 처리 여부 결정

### 에셋 / 외부 연동
- [ ] 카카오/구글/애플 OAuth Provider 설정 (Supabase Dashboard)
  - 현재 코드는 준비되어 있으나 Provider 등록이 필요

---

## Phase 3+ 예정

_(Phase 2 완료 후 업데이트)_

---

## 완료 항목

_(처리 완료된 항목은 여기로 이동)_
