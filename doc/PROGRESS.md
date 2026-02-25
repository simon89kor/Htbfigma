# HTB Project — 개발 진행 상황

> 이 파일은 에이전트 실행 시 자동 업데이트됩니다.

## Phase 0: Backend Foundation
- [x] B1: DB Architect — 완료 (2026-02-25)
  - 마이그레이션 SQL 11개 (supabase/migrations/)
  - TypeScript 타입 정의 (src/lib/database.types.ts)
  - ERD 문서 (doc/DATABASE_SCHEMA.md)
  - 테이블 25개, 트리거 11개, RPC 함수 4개, Storage 버킷 5개
- [x] B2: Supabase Client — 완료 (2026-02-25)
  - Supabase 클라이언트 싱글톤 (src/lib/supabase.ts)
  - API 레이어 11개 모듈 (src/lib/api/*.ts)
  - Auth 헬퍼 (src/lib/auth.ts)
  - auth-context.tsx, store-context.tsx Supabase 연동 교체
  - @supabase/supabase-js 패키지 설치
- [x] B3: Edge Functions — 완료 (2026-02-25)
  - RPC 함수 추가 (00012_create_rpc_functions.sql)
  - Edge Functions 4개 (process-payment, send-notification, aggregate-stats, qr-generate)
  - Seed Data (supabase/seed.sql)
- [x] Phase 0 통합 — 완료 (2026-02-25)
- [x] R0: 리뷰 — PASS (2026-02-25)
  - B1: 92/100, B2: 88/100, B3: 90/100
  - Critical 7건 발견 → 수정 완료 → 재리뷰 PASS
  - Non-critical 2건 (soft delete-트리거 불일치) → 수정 완료
    - on_comment_change: UPDATE OF status 이벤트 추가 (status='deleted' 감지)
    - on_challenge_participant_change: UPDATE OF status 이벤트 추가 (status='withdrawn' 감지)

## Phase 1: Frontend P0 (Critical)
- [ ] F1: Onboarding — 대기 (Phase 0 완료 후)
- [ ] F2: Purchase — 대기 (Phase 0 완료 후)
- [ ] F3: MyPage Core — 대기 (Phase 0 완료 후)
- [ ] Phase 1 routes.ts 통합 — 대기

## Phase 2: Frontend P1 (Important)
- [ ] F4: Home Extension — 대기
- [ ] F5: Community — 대기
- [ ] F6: Board Extension — 대기
- [ ] F7: Notification — 대기
- [ ] Phase 2 routes.ts + Layout.tsx 통합 — 대기

## Phase 3: Frontend P2~P3
- [ ] F8: Reward — 대기
- [ ] F9: Admin — 대기
- [ ] Phase 3 최종 통합 — 대기
