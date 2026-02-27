# 09. Admin Dashboard 기획서

**우선순위:** P2~P3 (Phase 3 + Phase 4)
**상태:** EXISTS (9개 화면 전체 구현 완료 — Phase 3 7개 + Phase 4 2개)
**라우트:** `/admin/*` (별도 AdminLayout)

### 구현 완료 (Phase 3 — F9)
- AdminLayout (사이드바 + 헤더 + 권한 체크)
- AdminSidebar (메뉴 네비게이션, 7개 항목)
- AdminHeader (페이지 타이틀 + 관리자 프로필 + 로그아웃)
- AdminDashboard (KPI 카드 4종 + 차트 3종 + 최근 신고)
- AdminUserManagement (유저 테이블 + 검색/필터/페이지네이션)
- AdminUserDetail (유저 상세 + 역할 변경 + 상태 변경 + 구매 내역)
- AdminRoutineManagement (루틴 목록 + 발행/비발행 토글 + 삭제(보관))
- AdminPurchaseManagement (구매 내역 + 환불 처리 + 기간 필터)
- AdminPostModeration (게시물 관리 + 신고 필터 + 숨김/삭제 + 신고 상세 다이얼로그)
- admin.ts API 레이어 (전용 API 모듈)

### 구현 완료 (Phase 4 — F9)
- AdminChallengeManagement (`/admin/challenges`) — 챌린지 CRUD, 보상 설정, 참가자 현황, 상태 관리
- AdminSettings (`/admin/settings`) — 사이트 설정, 알림 설정, 콘텐츠 정책, 시스템 정보
- admin.ts API 확장 (챌린지 관리 + 설정 관리 함수 추가)
- app_settings 테이블 신규 생성 (FB-007 RESOLVED)

---

## 1. 현재 상태 분석

### 구현 완료
- 별도 AdminLayout (사이드바 240px + 헤더 + Outlet)
- 권한 체크: profiles 테이블에서 role='admin' 확인, 아니면 / 또는 /login으로 리다이렉트
- 6개 관리 화면 (대시보드, 유저, 루틴, 구매, 게시물, 유저상세)
- admin.ts 전용 API 레이어
- routes.ts에 nested routes (lazy loading)
- Backend Feedback: FB-006 (Admin RLS 정책 보강) RESOLVED, FB-007 (app_settings 테이블) RESOLVED

---

## 2. 어드민 아키텍처 개요

### 라우트 구조
```
/admin (AdminLayout)
  ├── /admin                    → Dashboard (인덱스)
  ├── /admin/users              → User Management
  ├── /admin/users/:id          → User Detail
  ├── /admin/routines           → Routine Management
  ├── /admin/routines/create    → Routine Create/Edit
  ├── /admin/purchases          → Purchase Management
  ├── /admin/posts              → Post Moderation
  ├── /admin/challenges         → Challenge Management
  └── /admin/settings           → Admin Settings
```

### 권한 체크
```typescript
// AdminLayout.tsx
const AdminLayout = () => {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">
        <AdminHeader />
        <Outlet />
      </main>
    </div>
  );
};
```

---

## 3. 페이지별 상세 기획

### ADMIN-01: Dashboard

**경로:** `/admin`
**컴포넌트:** `AdminDashboard.tsx`

#### UI 구성
```
┌──────────┬──────────────────────────┐
│          │  Dashboard        닉네임  │
│  HTB     │  ─────────────────────── │
│  Admin   │                          │
│          │  ┌──────┐ ┌──────┐      │
│  📊 대시보드│  │ 전체  │ │ 신규  │      │
│  👥 유저   │  │ 유저  │ │ 가입  │      │
│  📋 루틴   │  │ 1,234│ │ +45  │      │
│  💰 구매   │  │      │ │ (이번주)│     │
│  📝 게시물  │  └──────┘ └──────┘     │
│  🎯 챌린지  │  ┌──────┐ ┌──────┐     │
│  ⚙️ 설정   │  │ 총매출 │ │ 활성  │     │
│          │  │₩2.5M │ │ 루틴  │      │
│          │  │      │ │  89  │      │
│          │  └──────┘ └──────┘      │
│          │                          │
│          │  📈 주간 가입자 추이        │
│          │  ┌──────────────────┐    │
│          │  │  (라인 차트)       │    │
│          │  └──────────────────┘    │
│          │                          │
│          │  📊 카테고리별 매출         │
│          │  ┌──────────────────┐    │
│          │  │  (바 차트)        │    │
│          │  └──────────────────┘    │
│          │                          │
│          │  ⚠️ 최근 신고             │
│          │  ├ 게시물#123 - 스팸 신고  │
│          │  ├ 유저#456 - 부적절 콘텐츠│
│          │  └ 게시물#789 - 광고      │
└──────────┴──────────────────────────┘
```

#### 대시보드 KPI 카드
```typescript
interface DashboardStats {
  totalUsers: number;
  newUsersThisWeek: number;
  totalRevenue: number;
  revenueThisMonth: number;
  activeRoutines: number;
  totalPosts: number;
  pendingReports: number;
  activeChallenges: number;
}
```

#### 차트
1. **주간 가입자 추이** - 라인 차트 (최근 4주)
2. **카테고리별 매출** - 바 차트
3. **일일 활성 유저 (DAU)** - 라인 차트
4. **루틴 완료율 분포** - 히스토그램

#### API
- `GET /api/admin/dashboard`
- `GET /api/admin/stats?period={week|month}`

---

### ADMIN-02: User Management

**경로:** `/admin/users`
**컴포넌트:** `AdminUserManagement.tsx`

#### UI 구성
```
┌──────────────────────────────────┐
│  유저 관리                        │
│  ─────────────────────────────── │
│  🔍 [검색...]  [상태▼] [역할▼]   │
│  ─────────────────────────────── │
│                                  │
│  ┌────┬──────┬──────┬────┬────┐ │
│  │ ID │ 닉네임 │ 이메일 │ 역할 │ 상태│ │
│  ├────┼──────┼──────┼────┼────┤ │
│  │ 1  │ 유저1 │ a@.. │일반 │활성 │ │
│  │ 2  │ 유저2 │ b@.. │제공자│활성 │ │
│  │ 3  │ 유저3 │ c@.. │일반 │정지 │ │
│  └────┴──────┴──────┴────┴────┘ │
│                                  │
│  < 1 2 3 ... 10 >   총 1,234명   │
└──────────────────────────────────┘
```

#### 유저 상세 (유저 행 클릭 시)
```
┌──────────────────────────────────┐
│  ← 유저 상세: 닉네임1             │
│  ─────────────────────────────── │
│                                  │
│  기본 정보                        │
│  ├ ID: 1                         │
│  ├ 이메일: user@example.com       │
│  ├ 가입일: 2026.01.15            │
│  ├ 역할: 일반 [변경▼]            │
│  └ 상태: 활성 [정지] [탈퇴처리]    │
│  ─────────────────────────────── │
│  활동 통계                        │
│  ├ 구매 루틴: 5개                 │
│  ├ 커스텀 루틴: 3개               │
│  ├ 게시물: 12개                   │
│  ├ 총 결제금액: ₩28,000           │
│  └ 최근 접속: 2026.02.24         │
│  ─────────────────────────────── │
│  구매 내역                        │
│  (테이블)                        │
│  ─────────────────────────────── │
│  게시물                          │
│  (게시물 목록)                    │
└──────────────────────────────────┘
```

#### 기능
- 유저 검색 (닉네임, 이메일)
- 필터: 상태 (전체/활성/정지/탈퇴), 역할 (전체/일반/Provider/Admin)
- 유저 상세 보기
- 역할 변경 (일반 ↔ Provider ↔ Admin)
- 계정 정지/해제
- 계정 탈퇴 처리

#### API
- `GET /api/admin/users?search={q}&status={status}&role={role}&page={page}`
- `GET /api/admin/users/:id`
- `PUT /api/admin/users/:id` - body: `{ role?, status? }`
- `DELETE /api/admin/users/:id`

---

### ADMIN-03: Routine Management

**경로:** `/admin/routines`
**컴포넌트:** `AdminRoutineManagement.tsx`

#### 기능
- 루틴 목록 (테이블): ID, 제목, Provider, 카테고리, 가격, 판매수, 상태
- 루틴 CRUD (생성/수정/삭제)
- 루틴 발행/비발행 상태 관리
- 카테고리별 필터링
- Provider별 필터링

#### API
- `GET /api/admin/routines?category={cat}&provider={id}&status={status}&page={page}`
- `POST /api/admin/routines`
- `PUT /api/admin/routines/:id`
- `DELETE /api/admin/routines/:id`
- `PUT /api/admin/routines/:id/publish` - 발행/비발행

---

### ADMIN-04: Purchase Management

**경로:** `/admin/purchases`
**컴포넌트:** `AdminPurchaseManagement.tsx`

#### 기능
- 구매 내역 테이블: ID, 유저, 루틴, 기간, 금액, 결제수단, 상태, 일시
- 환불 처리
- 기간별 매출 통계
- 결제 상태 필터 (완료/환불/취소)

#### API
- `GET /api/admin/purchases?status={status}&dateFrom={date}&dateTo={date}&page={page}`
- `POST /api/admin/purchases/:id/refund`

---

### ADMIN-05: Post Moderation

**경로:** `/admin/posts`
**컴포넌트:** `AdminPostModeration.tsx`

#### 기능
- 게시물 목록: ID, 작성자, 카테고리, 신고수, 상태, 작성일
- 신고 접수된 게시물 우선 표시
- 게시물 숨김/삭제 처리
- 신고 내역 확인
- 게시물 상세 미리보기

#### 신고 처리 워크플로우
```
신고 접수 → 검토 → [승인(게시 유지)] or [경고] or [숨김] or [삭제 + 유저 경고]
```

#### API
- `GET /api/admin/posts?status={status}&hasReport={bool}&page={page}`
- `GET /api/admin/posts/:id/reports`
- `PUT /api/admin/posts/:id` - body: `{ status: 'active' | 'hidden' | 'deleted' }`

---

### ADMIN-06: Challenge Management

**경로:** `/admin/challenges`
**컴포넌트:** `AdminChallengeManagement.tsx`
**상태:** EXISTS (Phase 4 완료)

#### UI 구성
```
┌──────────────────────────────────────────────────┐
│  챌린지 관리                                       │
│  ──────────────────────────────────────────────── │
│  🔍 [검색...]   [상태▼]   [카테고리▼]   [+ 새 챌린지] │
│  ──────────────────────────────────────────────── │
│                                                    │
│  ┌────┬──────┬──────┬────┬─────┬─────┬────┬────┐ │
│  │ ID │ 제목  │카테고리│ 상태 │ 참여자 │ 기간      │ 보상 │ 액션 │ │
│  ├────┼──────┼──────┼────┼─────┼─────┼────┼────┤ │
│  │ 1  │30일   │ 운동  │활성  │1,234│02.01~│뱃지 │[편집]│ │
│  │    │운동   │      │    │     │03.02 │    │[삭제]│ │
│  ├────┼──────┼──────┼────┼─────┼─────┼────┼────┤ │
│  │ 2  │독서   │자기   │예정  │  0  │03.01~│뱃지 │[편집]│ │
│  │    │30일   │개발   │    │     │03.31 │+쿠폰│[삭제]│ │
│  ├────┼──────┼──────┼────┼─────┼─────┼────┼────┤ │
│  │ 3  │식단   │ 식단  │완료  │ 567 │01.01~│포인트│[보기]│ │
│  │    │관리   │      │    │     │01.31 │    │     │ │
│  └────┴──────┴──────┴────┴─────┴─────┴────┴────┘ │
│                                                    │
│  < 1 2 3 ... 10 >                  총 25개 챌린지    │
└──────────────────────────────────────────────────┘

챌린지 생성/수정 다이얼로그:
┌──────────────────────────────────────────────────┐
│  챌린지 생성 (또는 "챌린지 수정")                     │
│  ──────────────────────────────────────────────── │
│                                                    │
│  제목 *                                            │
│  [30일 운동 챌린지                          ]       │
│                                                    │
│  설명                                              │
│  [매일 30분 이상 운동을 인증하는...           ]       │
│                                                    │
│  카테고리            상태                           │
│  [운동 ▼]           [draft ▼]                      │
│                                                    │
│  이미지 URL                                        │
│  [https://...                               ]      │
│                                                    │
│  시작일 *               종료일 *                     │
│  [2026-03-01]          [2026-03-31]                │
│                                                    │
│  최대 참가자 (0 = 무제한)                            │
│  [0                                         ]      │
│                                                    │
│  규칙 (줄바꿈으로 구분)                               │
│  [매일 운동 루틴 1개 완료                     ]       │
│  [인증 게시물 업로드                          ]       │
│                                                    │
│  ── 보상 설정 ──────────────────────────────────── │
│  ┌──────┬──────┬──────┬──────┬────┐              │
│  │ 유형  │ 이름  │ 아이콘 │ 설명  │ 삭제 │              │
│  ├──────┼──────┼──────┼──────┼────┤              │
│  │badge │운동   │ 🏅   │운동   │ ✕  │              │
│  │      │마스터 │      │마스터 │    │              │
│  │      │      │      │뱃지   │    │              │
│  ├──────┼──────┼──────┼──────┼────┤              │
│  │coupon│10%   │ 🎫   │스토어 │ ✕  │              │
│  │      │할인   │      │할인   │    │              │
│  └──────┴──────┴──────┴──────┴────┘              │
│  [+ 보상 추가]                                     │
│                                                    │
│  ──────────────────────────────────────────────── │
│  [취소]                              [저장]         │
└──────────────────────────────────────────────────┘

참가자 현황 다이얼로그 (테이블 행의 참여자 수 클릭 시):
┌──────────────────────────────────────────────────┐
│  참가자 현황: 30일 운동 챌린지                        │
│  ──────────────────────────────────────────────── │
│  총 참여자: 1,234명  |  완료: 156명  |  진행중: 1,078명│
│  ──────────────────────────────────────────────── │
│                                                    │
│  🔍 [검색...]     [상태▼]                           │
│  ┌────┬──────┬──────┬────┬──────┬──────┐        │
│  │ #  │ 닉네임 │ 참여일 │ 상태 │ 진행률  │ 완료일  │        │
│  ├────┼──────┼──────┼────┼──────┼──────┤        │
│  │ 1  │유저1  │02.01 │완료 │ 100% │02.28  │        │
│  │ 2  │유저2  │02.03 │진행 │  80% │  -    │        │
│  │ 3  │유저3  │02.05 │탈퇴 │  30% │  -    │        │
│  └────┴──────┴──────┴────┴──────┴──────┘        │
│                                                    │
│  < 1 2 3 ... >                                    │
│                                                    │
│  [닫기]                                            │
└──────────────────────────────────────────────────┘
```

#### DB 스키마 참조

**challenges 테이블:**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 챌린지 ID |
| title | text | 제목 |
| description | text | 설명 |
| image_url | text | 대표 이미지 |
| category | text | 카테고리 (운동/식단/자기개발 등) |
| start_date | timestamptz | 시작일 |
| end_date | timestamptz | 종료일 |
| rules | text[] | 규칙 목록 |
| participant_count | integer | 현재 참여자 수 |
| max_participants | integer | null | 최대 참여자 (null=무제한) |
| status | enum | 'upcoming' / 'active' / 'completed' / 'cancelled' |
| created_by | uuid (FK→profiles) | 생성자 |
| created_at | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |

**challenge_participants 테이블:**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 참여 ID |
| challenge_id | uuid (FK→challenges) | 챌린지 ID |
| user_id | uuid (FK→profiles) | 참여자 ID |
| progress | integer | 진행률 (0~100) |
| status | enum | 'active' / 'completed' / 'withdrawn' |
| joined_at | timestamptz | 참여일 |
| completed_at | timestamptz | null | 완료일 |

**challenge_rewards 테이블:**
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 보상 ID |
| challenge_id | uuid (FK→challenges) | 챌린지 ID |
| type | enum | 'badge' / 'coupon' / 'point' |
| name | text | 보상 이름 |
| icon | text | 아이콘 |
| description | text | 보상 설명 |
| badge_id | uuid | null (FK→badges) | 연결 뱃지 (type='badge'인 경우) |
| sort_order | integer | 정렬 순서 |
| created_at | timestamptz | 생성일 |

#### 기능

1. **챌린지 목록 테이블**
   - 컬럼: ID, 제목, 카테고리, 상태, 참여자 수, 기간(시작일~종료일), 보상 요약, 액션
   - 기본 정렬: 최신 생성순 (created_at DESC)
   - 행 수: 페이지당 20개

2. **검색 & 필터**
   - 키워드 검색: 제목(title) 기준 ilike 검색
   - 상태 필터: 전체 / 예정(upcoming) / 진행중(active) / 완료(completed) / 취소(cancelled)
   - 카테고리 필터: 전체 / 운동 / 식단 / 자기개발 / 기타

3. **챌린지 CRUD**
   - **생성**: [+ 새 챌린지] 버튼 → 생성 다이얼로그 (title*, start_date*, end_date* 필수)
   - **수정**: 행의 [편집] 버튼 → 수정 다이얼로그 (동일 폼, 기존 값 프리필)
   - **삭제**: 행의 [삭제] 버튼 → 확인 다이얼로그 후 status를 'cancelled'로 변경 (soft delete)
     - 참여자가 있는 경우 삭제 불가 경고: "참여자가 있는 챌린지는 취소만 가능합니다"

4. **상태 관리**
   - 상태 배지 색상: upcoming=blue, active=green, completed=gray, cancelled=red
   - 상태 전환 규칙:
     - draft → upcoming: 시작일/종료일 설정 완료 시
     - upcoming → active: 시작일 도래 (자동 또는 수동)
     - active → completed: 종료일 경과 (자동 또는 수동)
     - upcoming/active → cancelled: 관리자 수동 취소
   - completed/cancelled → 수정 불가 (읽기 전용)

5. **참가자 현황 조회**
   - 참여자 수 셀 클릭 → 참가자 현황 다이얼로그
   - 참가자 테이블: 닉네임, 참여일, 상태, 진행률, 완료일
   - 참가자 필터: 전체 / 진행중(active) / 완료(completed) / 탈퇴(withdrawn)
   - 참가자 검색: 닉네임 기준

6. **보상 설정**
   - 챌린지 생성/수정 시 보상 항목 동적 추가/삭제
   - 보상 유형: badge(뱃지), coupon(쿠폰), point(포인트)
   - badge 유형 선택 시 기존 badges 테이블에서 연결할 뱃지 선택 (badge_id)
   - 보상 항목별: type, name, icon, description 입력

7. **기간 설정**
   - 시작일/종료일 날짜 피커 (date input)
   - 종료일은 시작일 이후여야 함 (유효성 검증)
   - 기간 표시 형식: "YYYY.MM.DD ~ YYYY.MM.DD"

8. **페이지네이션**
   - 기존 AdminRoutineManagement/AdminPurchaseManagement과 동일한 패턴
   - 하단 "< 1 2 3 ... N >" + 총 N개 챌린지 표시

#### API

```typescript
// admin.ts에 추가

// --- Types ---
export interface AdminChallengeRow extends Challenge {
  profiles: { nickname: string } | null;
  challenge_rewards: ChallengeReward[];
}

export interface AdminChallengeListOptions {
  search?: string;
  status?: Challenge['status'] | 'all';
  category?: string;
  page?: number;
  limit?: number;
}

export interface AdminChallengeParticipantRow extends ChallengeParticipant {
  profiles: { nickname: string; avatar_url: string } | null;
}

export interface AdminParticipantListOptions {
  challengeId: string;
  search?: string;
  status?: ChallengeParticipant['status'] | 'all';
  page?: number;
  limit?: number;
}

// --- Functions ---

// 챌린지 목록 (관리자용)
GET  getAdminChallenges(options?: AdminChallengeListOptions)
     → { data: AdminChallengeRow[]; count: number }
     쿼리: challenges + profiles!created_by(nickname) + challenge_rewards(*)
     필터: status, category(ilike), search(title ilike)
     정렬: created_at DESC
     페이지네이션: range(from, to)

// 챌린지 상세
GET  getAdminChallenge(challengeId: string)
     → AdminChallengeRow
     쿼리: challenges + profiles!created_by(nickname) + challenge_rewards(*)
     조건: id = challengeId

// 챌린지 생성
POST createAdminChallenge(data: ChallengeInsert & { rewards: ChallengeRewardInsert[] })
     → Challenge
     1. challenges 테이블에 INSERT
     2. challenge_rewards 테이블에 보상 항목 INSERT (bulk)
     3. created_by = 현재 admin user id

// 챌린지 수정
PUT  updateAdminChallenge(challengeId: string, data: ChallengeUpdate & { rewards?: ChallengeRewardInsert[] })
     → Challenge
     1. challenges 테이블 UPDATE
     2. 보상이 변경된 경우: 기존 challenge_rewards DELETE → 새로 INSERT

// 챌린지 취소 (soft delete)
PUT  cancelAdminChallenge(challengeId: string)
     → Challenge
     challenges.status = 'cancelled' 로 UPDATE

// 참가자 목록
GET  getAdminChallengeParticipants(options: AdminParticipantListOptions)
     → { data: AdminChallengeParticipantRow[]; count: number }
     쿼리: challenge_participants + profiles!user_id(nickname, avatar_url)
     필터: challenge_id, status, search(nickname ilike)
     정렬: joined_at DESC
     페이지네이션: range(from, to)
```

#### 인터랙션

| 동작 | 결과 |
|------|------|
| [+ 새 챌린지] 클릭 | 생성 다이얼로그 열림 (빈 폼) |
| [편집] 클릭 | 수정 다이얼로그 열림 (기존 데이터 프리필) |
| [삭제] 클릭 | 확인 다이얼로그 → 'cancelled' 상태로 변경 |
| 참여자 수 클릭 | 참가자 현황 다이얼로그 열림 |
| 상태 필터 변경 | 테이블 리로드 (페이지 1로 리셋) |
| 카테고리 필터 변경 | 테이블 리로드 (페이지 1로 리셋) |
| 검색 입력 (Enter/blur) | 테이블 리로드 (페이지 1로 리셋) |
| 보상 [+ 보상 추가] | 보상 행 추가 (type/name/icon/description 입력 필드) |
| 보상 행 [✕] | 해당 보상 행 삭제 |
| [저장] 클릭 | 유효성 검증 → API 호출 → 성공 토스트 → 다이얼로그 닫힘 → 목록 리로드 |
| [취소] 클릭 | 다이얼로그 닫힘 (변경사항 폐기) |

#### 유효성 검증
| 필드 | 규칙 | 에러 메시지 |
|------|------|-----------|
| title | 필수, 2자 이상 | "챌린지 제목을 입력해주세요" |
| start_date | 필수 | "시작일을 선택해주세요" |
| end_date | 필수, start_date 이후 | "종료일은 시작일 이후여야 합니다" |
| rewards[].name | 보상 추가 시 필수 | "보상 이름을 입력해주세요" |

---

### ADMIN-07: Admin Settings

**경로:** `/admin/settings`
**컴포넌트:** `AdminSettings.tsx`
**상태:** EXISTS (Phase 4 완료)

> 유저용 SettingsPage.tsx (`/settings`)와 완전히 별도인 **관리자 전용 시스템 설정** 페이지입니다.

#### UI 구성
```
┌──────────────────────────────────────────────────┐
│  관리자 설정                                       │
│  ──────────────────────────────────────────────── │
│                                                    │
│  ── 사이트 설정 ─────────────────────────────────── │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │  앱 이름                                      │ │
│  │  [HOW TO BE                            ]     │ │
│  │                                              │ │
│  │  공지사항 메시지                                │ │
│  │  [시스템 점검 안내: 3/1 02:00~06:00    ]       │ │
│  │  ☑ 공지사항 활성화                             │ │
│  │                                              │ │
│  │  유지보수 모드                                  │ │
│  │  [○─────] OFF                                │ │
│  │  (활성화 시 일반 유저 접근 차단, 관리자만 접근 가능)│ │
│  │                                              │ │
│  │  [저장]                                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ── 알림 설정 ─────────────────────────────────── │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │  글로벌 알림                                   │ │
│  │  [─────○] ON                                 │ │
│  │  (OFF 시 전체 푸시 알림 발송 중지)               │ │
│  │                                              │ │
│  │  마케팅 알림                                   │ │
│  │  [─────○] ON                                 │ │
│  │  (OFF 시 마케팅/프로모션 알림 발송 중지)          │ │
│  │                                              │ │
│  │  [저장]                                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ── 콘텐츠 정책 ────────────────────────────────── │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │  자동 숨김 기준 (최소 신고 수)                    │ │
│  │  [5                                    ]     │ │
│  │  (해당 수 이상 신고 접수 시 게시물 자동 숨김)       │ │
│  │                                              │ │
│  │  금지어 목록 (쉼표로 구분)                       │ │
│  │  [광고, 스팸, 도박, 사기, ...             ]     │ │
│  │                                              │ │
│  │  최소 신고 사유 길이 (글자)                      │ │
│  │  [10                                   ]     │ │
│  │                                              │ │
│  │  [저장]                                      │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ── 시스템 정보 (읽기 전용) ─────────────────────── │
│  ┌──────────────────────────────────────────────┐ │
│  │                                              │ │
│  │  DB 상태        ● 정상                        │ │
│  │  총 테이블 수    25개                          │ │
│  │  총 유저 수      1,234명                      │ │
│  │  총 루틴 수      89개                          │ │
│  │  총 게시물 수    3,456개                       │ │
│  │  총 챌린지 수    12개                          │ │
│  │  스토리지 사용량  1.2 GB / 10 GB              │ │
│  │  Supabase 프로젝트 ID  jwigqrgynvrgwrinjdiw  │ │
│  │                                              │ │
│  │  마지막 갱신: 2026.02.27 14:30               │ │
│  │  [새로고침]                                   │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

#### DB 스키마 참조

> app_settings 테이블 생성 완료 (FB-007 RESOLVED, 2026-02-27).
> 마이그레이션: `supabase/migrations/00016_create_app_settings.sql`

**app_settings 테이블 (구현 완료)**
| 컬럼 | 타입 | 설명 | 기본값 |
|------|------|------|--------|
| id | uuid (PK) | 설정 ID | gen_random_uuid() |
| key | text (UNIQUE) | 설정 키 | - |
| value | jsonb | 설정 값 | '{}' |
| description | text | 설정 설명 | '' |
| updated_by | uuid (FK→profiles) | 마지막 수정자 | null |
| updated_at | timestamptz | 수정일 | now() |

**초기 설정 키:**
| key | value (기본값) | 설명 |
|-----|---------------|------|
| `site_name` | `"HOW TO BE"` | 앱 이름 |
| `announcement_message` | `""` | 공지사항 메시지 |
| `announcement_enabled` | `false` | 공지사항 활성화 여부 |
| `maintenance_mode` | `false` | 유지보수 모드 |
| `global_notification_enabled` | `true` | 글로벌 알림 on/off |
| `marketing_notification_enabled` | `true` | 마케팅 알림 on/off |
| `auto_hide_report_threshold` | `5` | 자동 숨김 기준 신고 수 |
| `banned_words` | `[]` | 금지어 목록 (JSON 배열) |
| `min_report_reason_length` | `10` | 최소 신고 사유 길이 |

#### 기능

1. **사이트 설정 (Site Settings)**
   - 앱 이름 변경
   - 공지사항 메시지 입력 + 활성화 토글
   - 유지보수 모드 토글 (ON 시 일반 유저 접근 차단 경고)
   - 각 섹션별 독립 [저장] 버튼

2. **알림 설정 (Notification Settings)**
   - 글로벌 알림 on/off 토글 (OFF 시 전체 푸시 알림 발송 중지)
   - 마케팅 알림 on/off 토글 (OFF 시 프로모션 알림 발송 중지)

3. **콘텐츠 정책 (Content Policy)**
   - 자동 숨김 기준: 최소 신고 수 설정 (해당 수 이상 → 게시물 자동 숨김 처리)
   - 금지어 목록: 쉼표 구분 텍스트 → JSON 배열로 저장
   - 최소 신고 사유 길이: 신고 시 사유 텍스트 최소 글자 수

4. **시스템 정보 (System Info) — 읽기 전용**
   - DB 연결 상태 (Supabase health check)
   - 테이블별 레코드 수: 유저/루틴/게시물/챌린지
   - 스토리지 사용량 (Supabase Storage API)
   - Supabase 프로젝트 ID (환경 변수에서 읽기)
   - [새로고침] 버튼으로 최신 정보 갱신

#### API

```typescript
// admin.ts에 추가

// --- Types ---
export interface AppSetting {
  id: string;
  key: string;
  value: Json;
  description: string;
  updated_by: string | null;
  updated_at: string;
}

export interface SystemInfo {
  dbStatus: 'healthy' | 'degraded' | 'down';
  totalTables: number;
  totalUsers: number;
  totalRoutines: number;
  totalPosts: number;
  totalChallenges: number;
  storageUsed: string;       // e.g., "1.2 GB"
  storageLimit: string;      // e.g., "10 GB"
  supabaseProjectId: string;
  lastRefreshed: string;     // ISO timestamp
}

// --- Functions ---

// 전체 설정 조회
GET  getAdminSettings()
     → AppSetting[]
     쿼리: app_settings 테이블 전체 SELECT
     정렬: key ASC

// 개별 설정 조회
GET  getAdminSetting(key: string)
     → AppSetting
     쿼리: app_settings WHERE key = key

// 설정 업데이트 (단건)
PUT  updateAdminSetting(key: string, value: Json)
     → AppSetting
     쿼리: app_settings UPDATE SET value = value, updated_by = auth.uid(), updated_at = now()
     조건: WHERE key = key

// 설정 일괄 업데이트 (섹션별)
PUT  updateAdminSettingsBatch(settings: { key: string; value: Json }[])
     → AppSetting[]
     각 key에 대해 upsert 수행

// 시스템 정보 조회
GET  getSystemInfo()
     → SystemInfo
     1. profiles count (neq status='deleted')
     2. routines count
     3. posts count (neq status='deleted')
     4. challenges count
     5. Supabase storage usage (supabase.storage API)
     6. 환경변수에서 프로젝트 ID 읽기
```

#### 인터랙션

| 동작 | 결과 |
|------|------|
| 사이트 설정 [저장] | site_name, announcement_*, maintenance_mode 일괄 저장 → 성공 토스트 |
| 유지보수 모드 ON 토글 | 확인 다이얼로그: "유지보수 모드를 활성화하면 일반 유저가 접근할 수 없습니다. 계속하시겠습니까?" |
| 알림 설정 [저장] | global_notification_enabled, marketing_notification_enabled 저장 → 성공 토스트 |
| 콘텐츠 정책 [저장] | auto_hide_report_threshold, banned_words, min_report_reason_length 저장 → 성공 토스트 |
| 시스템 정보 [새로고침] | getSystemInfo() 재호출 → 정보 갱신 |
| 입력값 변경 없이 [저장] | "변경사항이 없습니다" 토스트 (info) |
| 유효하지 않은 값 입력 | 필드 하단 에러 메시지 표시 |

#### 유효성 검증
| 필드 | 규칙 | 에러 메시지 |
|------|------|-----------|
| site_name | 필수, 1자 이상 | "앱 이름을 입력해주세요" |
| auto_hide_report_threshold | 양의 정수, 1 이상 | "1 이상의 숫자를 입력해주세요" |
| min_report_reason_length | 양의 정수, 1 이상 | "1 이상의 숫자를 입력해주세요" |
| banned_words | 쉼표 구분 문자열 | (자유 입력, 파싱 오류 시 경고) |

#### Backend Feedback 처리 완료
- **FB-007:** `app_settings` 테이블 생성 + RLS 정책 (admin만 read/write) + 초기 데이터 시딩 9개 키 — **RESOLVED** (2026-02-27, B1 처리)
  - 마이그레이션: `supabase/migrations/00016_create_app_settings.sql`
  - `database.types.ts`에 AppSetting Row/Insert/Update/Relationships 타입 추가

---

## 4. 어드민 레이아웃 컴포넌트

### AdminSidebar
```typescript
const ADMIN_MENU = [
  { icon: BarChart3, label: '대시보드', path: '/admin' },
  { icon: Users, label: '유저 관리', path: '/admin/users' },
  { icon: ClipboardList, label: '루틴 관리', path: '/admin/routines' },
  { icon: CreditCard, label: '구매 관리', path: '/admin/purchases' },
  { icon: FileText, label: '게시물 관리', path: '/admin/posts' },
  { icon: Target, label: '챌린지 관리', path: '/admin/challenges' },
  { icon: Settings, label: '설정', path: '/admin/settings' },
];
```

### AdminHeader
- 현재 페이지 타이틀
- 관리자 프로필/로그아웃
- 알림 아이콘 (신고 미처리 건수)

---

## 5. 디자인 스펙

| 요소 | 스펙 |
|------|------|
| 사이드바 | width 240px, `--primary` 배경, White 텍스트 |
| 콘텐츠 영역 | `--bg-secondary` 배경 |
| KPI 카드 | White 배경, shadow-sm, radius 12px |
| 테이블 | 기존 `ui/table.tsx` 활용 |
| 차트 | `recharts` 활용 |
| 페이지네이션 | 기존 `ui/pagination.tsx` 활용 |

---

## 6. AuthContext 확장

```typescript
// auth-context.tsx 수정
interface User {
  // 기존...
  role: 'user' | 'provider' | 'admin';
}
```

---

## 7. 라우트 추가

```typescript
// routes.ts - 별도 레이아웃 그룹
{
  path: '/admin',
  element: <AdminLayout />,
  children: [
    { index: true, element: <AdminDashboard /> },
    { path: 'users', element: <AdminUserManagement /> },
    { path: 'users/:id', element: <AdminUserDetail /> },
    { path: 'routines', element: <AdminRoutineManagement /> },
    { path: 'purchases', element: <AdminPurchaseManagement /> },
    { path: 'posts', element: <AdminPostModeration /> },
    { path: 'challenges', element: <AdminChallengeManagement /> },
    { path: 'settings', element: <AdminSettings /> },
  ],
},
```

## 8. 신규 파일 목록 (구현 반영)

| 파일 | 설명 | 상태 |
|------|------|------|
| `src/app/components/admin/AdminLayout.tsx` | 어드민 레이아웃 | EXISTS |
| `src/app/components/admin/AdminSidebar.tsx` | 사이드바 | EXISTS |
| `src/app/components/admin/AdminHeader.tsx` | 헤더 | EXISTS |
| `src/app/components/admin/AdminDashboard.tsx` | 대시보드 | EXISTS |
| `src/app/components/admin/AdminUserManagement.tsx` | 유저 관리 | EXISTS |
| `src/app/components/admin/AdminUserDetail.tsx` | 유저 상세 | EXISTS |
| `src/app/components/admin/AdminRoutineManagement.tsx` | 루틴 관리 | EXISTS |
| `src/app/components/admin/AdminPurchaseManagement.tsx` | 구매 관리 | EXISTS |
| `src/app/components/admin/AdminPostModeration.tsx` | 게시물 관리 | EXISTS |
| `src/app/components/admin/AdminChallengeManagement.tsx` | 챌린지 관리 | EXISTS (Phase 4 완료) |
| `src/app/components/admin/AdminSettings.tsx` | 어드민 설정 | EXISTS (Phase 4 완료) |
| `src/lib/api/admin.ts` | Admin 전용 API 레이어 | EXISTS (Phase 4 확장 — 챌린지+설정 API 추가) |

> 어드민 컴포넌트는 `src/app/components/admin/` 디렉토리에 분리하여 관리
> 전체 9개 화면 + API 레이어 구현 완료 (Phase 3 + Phase 4)
