# Agent Identity Documents — Index

> 각 에이전트는 작업 시작 전 **반드시** `COMMON.md` + 자신의 Identity 문서를 읽어야 합니다.

## 공통 규약
- [COMMON.md](./COMMON.md) — 모든 에이전트 공통 (디자인 토큰, 코딩 컨벤션, 디렉토리 구조, UI 패턴)

## 리뷰어
| Agent | 문서 | 역할 | 핵심 키워드 |
|-------|------|------|-----------|
| R0 | [R0_REVIEWER.md](./R0_REVIEWER.md) | Quality Assurance & Code Reviewer | 품질 게이트, PASS/FAIL, 수정 지시 |

## Phase 0: Backend Foundation
| Agent | 문서 | 역할 | 핵심 키워드 |
|-------|------|------|-----------|
| B1 | [B1_DB_ARCHITECT.md](./B1_DB_ARCHITECT.md) | Database Architect | PostgreSQL, 스키마, RLS, 마이그레이션 |
| B2 | [B2_SUPABASE_CLIENT.md](./B2_SUPABASE_CLIENT.md) | FE-BE Integration | Supabase SDK, API 레이어, Context 교체 |
| B3 | [B3_EDGE_FUNCTIONS.md](./B3_EDGE_FUNCTIONS.md) | Backend Developer | Edge Functions, Triggers, Seed Data |

## Phase 1: Frontend P0
| Agent | 문서 | 역할 | 핵심 키워드 |
|-------|------|------|-----------|
| F1 | [F1_ONBOARDING.md](./F1_ONBOARDING.md) | Onboarding Specialist | Splash, Walkthrough, OAuth, Terms |
| F2 | [F2_PURCHASE.md](./F2_PURCHASE.md) | Commerce Specialist | Period, Payment, Purchase Complete |
| F3 | [F3_MYPAGE_CORE.md](./F3_MYPAGE_CORE.md) | Profile Specialist | Profile, My Routines, Settings |

## Phase 2: Frontend P1
| Agent | 문서 | 역할 | 핵심 키워드 |
|-------|------|------|-----------|
| F4 | [F4_HOME_EXT.md](./F4_HOME_EXT.md) | Search & Discovery | Search, Filter, Provider, Banner |
| F5 | [F5_COMMUNITY.md](./F5_COMMUNITY.md) | Social & Community | Feed, Post, Comment, Ranking |
| F6 | [F6_BOARD_EXT.md](./F6_BOARD_EXT.md) | Productivity & Charts | Todo Detail, Stats, Recharts |
| F7 | [F7_NOTIFICATION.md](./F7_NOTIFICATION.md) | Notification & Realtime | 알림 센터, Realtime, 뱃지 |

## Phase 3: Frontend P2~P3
| Agent | 문서 | 역할 | 핵심 키워드 |
|-------|------|------|-----------|
| F8 | [F8_REWARD.md](./F8_REWARD.md) | Gamification | Badge, Ranking, Challenge |
| F9 | [F9_ADMIN.md](./F9_ADMIN.md) | Admin Panel | Dashboard, CRUD, Moderation |

---

## 에이전트 실행 시 프롬프트 템플릿

```
당신은 HTB 프로젝트의 [{에이전트명}] 입니다.

작업 시작 전 반드시 다음 문서를 순서대로 읽으세요:
1. doc/agents/COMMON.md (공통 규약)
2. doc/agents/{에이전트_ID}.md (당신의 Identity)
3. doc/{관련_기획서}.md (기획 상세)

당신의 역할, 규칙, 산출물을 Identity 문서에 정의된 대로 준수하며 작업하세요.
품질 체크리스트의 모든 항목을 충족해야 작업이 완료된 것입니다.
```
