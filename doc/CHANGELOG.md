# HTB Project — CHANGELOG

> 기획 변경, 스키마 변경, 에이전트 범위 변경 등을 기록합니다.
> P0 Planner가 매 Phase 완료 후 업데이트합니다.

---

## [2026-02-25] Phase 0 완료 — Backend Foundation

### 기획 변경
- (Phase 0에서는 기획 변경 없음 — 기획서 기반으로 스키마 신규 생성)

### 스키마 변경
- 전체 스키마 신규 생성: 25개 테이블, 11개 트리거, 4개 RPC 함수
- comments 트리거: soft delete(status='deleted') 시 comment_count 감소 추가
- challenge_participants 트리거: soft delete(status='withdrawn') 시 participant_count 감소 추가

### 에이전트 범위 변경
- R0_REVIEWER 에이전트 신설 (품질 게이트)

### Backend Feedback 반영
- (Phase 0에서는 FE 작업 없으므로 피드백 없음)

### R0 리뷰 결과
- B1: 92/100 → 재수정 후 PASS
- B2: 88/100 → 재수정 후 PASS
- B3: 90/100 → 재수정 후 PASS
- Critical 7건 수정 완료, Non-critical 2건 수정 완료
