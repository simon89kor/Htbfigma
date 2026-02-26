# 07. MY Page 확장 기획서

**우선순위:** P0~P1
**상태:** PARTIAL (P0 범위 구현 완료 — Phase 1, P1 범위 미구현)
**관련 기존 파일:** `ProfilePage.tsx`, `MyListsPage.tsx`, `SettingsPage.tsx`

---

## 1. 현재 상태 분석

### 구현 완료 (Phase 1 완료)
- `ProfilePage.tsx` - 커버이미지, 아바타 업로드, 팔로워/팔로잉 카운트, 게시물/루틴/구매내역 탭, 인라인 편집
- `MyListsPage.tsx` - 전체 프로그레스 요약 + 루틴별 프로그레스 바 + 3탭(전체/구매한 루틴/나만의 루틴)
- `SettingsPage.tsx` - 알림 토글(3개), 계정관리, 앱정보, 고객센터, 로그아웃(확인모달), 탈퇴(이중확인)

### 미구현 (P1 범위 → Phase 2 이후)
- QR Code Center (`QRCodeCenterPage.tsx`)
- Following/Followers (`FollowingPage.tsx`)

---

## 2. 페이지별 상세 기획

### MY-01: My Profile 확장

**경로:** `/profile` (기존 수정)
**수정 대상:** `ProfilePage.tsx`
**우선순위:** P0

#### 현재 → 목표
| 항목 | 현재 | 추가 필요 |
|------|------|----------|
| 프로필 헤더 | 기본 정보만 | 배경 이미지 + 아바타 확대 |
| 팔로워/팔로잉 | 없음 | 카운트 + 목록 링크 |
| 내 게시물 | 없음 | 게시물 그리드 (3열) |
| 프로필 편집 | 기본 | 닉네임/소개/아바타 인라인 편집 |
| 설정 아이콘 | 없음 | 우측 상단 설정 링크 |

#### UI 구성
```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │   배경 이미지         │ │
│ │                     │ │
│ │    ┌────┐           │ │
│ │    │    │           │ │
│ │    │ 😀 │           │ │
│ │    └────┘           │ │
│ └─────────────────────┘ │
│                         │
│  닉네임              ⚙️  │
│  소개 한줄                │
│                         │
│  게시물 12 | 팔로워 45    │
│  팔로잉 23               │
│                         │
│  [ 프로필 편집 ]          │
│  ─────────────────────  │
│  [게시물] [루틴] [구매내역] │  ← 탭
│                         │
│  게시물 탭:               │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │  │ │  │ │  │       │  ← 3열 썸네일 그리드
│  └──┘ └──┘ └──┘       │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │  │ │  │ │  │       │
│  └──┘ └──┘ └──┘       │
│                         │
│  루틴 탭:                │
│  (루틴 카드 리스트)        │
│                         │
│  구매내역 탭:             │
│  (구매 히스토리 리스트)     │
└─────────────────────────┘
```

#### 프로필 편집 모드
```
┌─────────────────────────┐
│  ← 프로필 편집     [저장]  │
│                         │
│      ┌────┐             │
│      │ 😀 │  📷          │  ← 아바타 변경
│      └────┘             │
│                         │
│  닉네임                   │
│  [현재 닉네임          ]   │
│                         │
│  소개                    │
│  [소개를 입력하세요...  ]   │
│                         │
│  배경 이미지               │
│  [ 이미지 선택 ]           │
└─────────────────────────┘
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 팔로워/팔로잉 탭 | → Following/Followers 페이지 |
| 게시물 썸네일 탭 | → Post Detail |
| 프로필 편집 | 편집 모드 → 인라인 편집 + 저장 |
| ⚙️ 설정 | → Settings 페이지 |
| 루틴 탭 → 카드 탭 | → BOARD 해당 루틴 |

#### API
- `GET /api/users/me` (기존)
- `PUT /api/users/me` (기존)
- `GET /api/users/me/posts`
- `POST /api/upload/avatar` (아바타 업로드)

---

### MY-02: My Routines (탭 구조)

**위치:** `/my-lists` (기존 MyListsPage 확장)
**수정 대상:** `MyListsPage.tsx`
**우선순위:** P0

#### 탭 분류 기준

DB `user_routines` 테이블의 분류 축:
- **소유 형태**: `is_custom` (true=직접 생성, false=구매) / `purchase_id` (null=직접, not null=구매)
- **진행 상태**: `status` (active/completed/expired/paused)

**소유 형태 기준 3탭** 채택:
- 진행 상태 × 소유 형태가 2차원이라 4탭(진행중/완료/구매/직접)으로 넣으면 겹침 발생
- 소유 형태로 1차 분류 후, 각 카드에 프로그레스 바로 진행 상태 표시
- 전체 프로그레스 요약 카드에서 진행중/완료 카운트 표시로 보완

#### UI 구성

```
┌─────────────────────────┐
│  TODAY                   │
│                         │
│  ┌─────────────────────┐│
│  │ 전체 진행률    75%    ││ ← 프로그레스 요약 카드
│  │ ▶ 진행중 3 ✅ 완료 2  ││
│  │ 완료 12/16 할일       ││
│  └─────────────────────┘│
│                         │
│ [전체] [구매한 루틴] [나만의 루틴]│
│  ─────────────────────  │
│                         │
│  ┌─────────────────────┐│
│  │ 🟢 아침 운동 루틴      ││
│  │ ████████░░ 80%      ││ ← 루틴별 프로그레스 바
│  │ ┌─ 투두 리스트 ──────┐││
│  │ │ ☑ 스트레칭 10분    │││
│  │ │ ☐ 러닝 30분       │││
│  │ └──────────────────┘││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │ ✅ 독서 습관 30일      ││ ← 완료 루틴도 같은 탭에
│  │ ██████████ 100%     ││
│  └─────────────────────┘│
└─────────────────────────┘
```

#### 탭 필터 매핑
| 탭 | DB 쿼리 조건 |
|-----|-------------|
| 전체 | `user_routines WHERE user_id = ?` |
| 구매한 루틴 | `user_routines WHERE user_id = ? AND is_custom = false` |
| 나만의 루틴 | `user_routines WHERE user_id = ? AND is_custom = true` |

#### 루틴 카드 데이터
```typescript
// DB user_routines 테이블과 1:1 매핑
interface MyRoutine {
  id: string;
  title: string;
  category: string;
  start_date: string | null;
  end_date: string | null;
  completion_rate: number;     // 0~100, DB 트리거 자동 계산
  status: 'active' | 'completed' | 'expired' | 'paused';
  is_custom: boolean;
  purchase_id: string | null;
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 루틴 카드 탭 | 카드 확장 → 해당 루틴 투두 리스트 표시 |
| 투두 체크 | `todo_items.completed` 토글 → `user_routines.completion_rate` 트리거 재계산 |

#### API
- `GET user_routines WHERE user_id = ? (+ is_custom 필터)`
- Supabase: `getUserRoutines()` from `src/lib/api/user-routines.ts`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 프로그레스 요약 카드 | 전체 진행률 + 진행중/완료 카운트 |
| 루틴별 프로그레스 바 | `--accent-color` (#65D9AC), 높이 4px |
| 완료 카드 | 프로그레스 바 100% 채움 |
| Empty State | 일러스트 + "루틴을 시작해보세요" |

---

### MY-03: QR Code Center

**경로:** `/qr`
**컴포넌트:** `QRCodeCenterPage.tsx`
**우선순위:** P1

#### UI 구성
```
┌─────────────────────────┐
│  ← QR 코드               │
│                         │
│  [내 QR] [스캔]          │  ← 탭
│  ─────────────────────  │
│                         │
│  내 QR 탭:               │
│  루틴을 선택하세요          │
│  ┌─────────────────────┐│
│  │ ○ 아침 운동 루틴      ││
│  │ ● 식단 관리          ││  ← 라디오 선택
│  │ ○ 독서 습관          ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │   ┌─────────────┐   ││
│  │   │             │   ││
│  │   │   QR CODE   │   ││
│  │   │             │   ││
│  │   └─────────────┘   ││
│  │                     ││
│  │   식단 관리          ││
│  │   by HTB            ││
│  └─────────────────────┘│
│                         │
│  [이미지 저장]  [공유하기]  │
│  ─────────────────────  │
│  공유 이력                │
│  • 닉네임1에게 공유 (2/24) │
│  • 닉네임2에게 공유 (2/23) │
└─────────────────────────┘
```

#### 스캔 탭
```
┌─────────────────────────┐
│  ← QR 코드               │
│  [내 QR] [스캔]          │
│  ─────────────────────  │
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │  ┌───────────────┐  ││
│  │  │               │  ││
│  │  │  카메라 뷰파인더 │  ││
│  │  │               │  ││
│  │  └───────────────┘  ││
│  │                     ││
│  │  QR 코드를 스캔하세요  ││
│  └─────────────────────┘│
│                         │
│  [  갤러리에서 선택  ]     │
└─────────────────────────┘
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 루틴 선택 | QR 코드 생성/변경 |
| 이미지 저장 | 갤러리에 QR 이미지 저장 |
| 공유하기 | 공유 시트 (SNS/메신저) |
| QR 스캔 | 카메라 → 스캔 → 루틴 상세 연결 |
| 갤러리에서 선택 | 이미지 내 QR 인식 |

#### API
- `POST /api/qr/generate` - body: `{ routineId: string }` → QR 이미지 URL
- `GET /api/qr/:code` → 루틴 상세 연결

#### 기술 구현
- QR 생성: `qrcode.react` 또는 `qr-code-styling` 라이브러리
- QR 스캔: `html5-qrcode` 또는 `@yudiel/react-qr-scanner`

---

### MY-04: Following/Followers

**경로:** `/following`
**컴포넌트:** `FollowingPage.tsx`
**우선순위:** P1

#### UI 구성
```
┌─────────────────────────┐
│  ← 닉네임                │
│                         │
│  [팔로워 45] [팔로잉 23]  │  ← 탭
│  ─────────────────────  │
│  🔍 [검색...]            │
│  ─────────────────────  │
│                         │
│  😀 닉네임1              │
│     소개 한줄    [팔로우]  │
│                         │
│  😀 닉네임2  🏷️Provider  │
│     소개 한줄    [팔로잉]  │
│                         │
│  😀 닉네임3              │
│     소개 한줄    [팔로우]  │
│  ...                    │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface FollowUser {
  id: string;
  nickname: string;
  avatar: string;
  bio: string;
  isFollowing: boolean;
  isProvider: boolean;    // Provider 태그 표시
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 팔로우/언팔로우 토글 | API 호출 + UI 업데이트 |
| 유저 탭 | → User Profile View |
| 검색 | 리스트 필터링 |

#### API
- `GET /api/users/me/followers`
- `GET /api/users/me/following`
- `POST /api/users/:id/follow`
- `DELETE /api/users/:id/follow`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 팔로우 버튼 | `--accent-color` 배경, White 텍스트 |
| 팔로잉 버튼 | `--bg-secondary` 배경, `--text-secondary` |
| Provider 태그 | 작은 뱃지, `--accent` 색상 |
| 아바타 | 48x48 원형 |

---

### MY-05: Settings

**경로:** `/settings`
**컴포넌트:** `SettingsPage.tsx`
**우선순위:** P0 (원본 P1에서 앞당김 — Phase 1에서 구현 완료)

#### UI 구성
```
┌─────────────────────────┐
│  ← 설정                  │
│  ─────────────────────  │
│                         │
│  알림 설정                │
│  ├ 일정 알림        [🔵]  │
│  ├ 커뮤니티 알림    [🔵]  │
│  └ 마케팅 알림      [⚪]  │
│  ─────────────────────  │
│  계정 관리                │
│  ├ 이메일       user@... >│
│  ├ 비밀번호 변경          >│
│  └ 소셜 계정 연동         >│
│  ─────────────────────  │
│  결제 수단 관리           >│
│  ─────────────────────  │
│  앱 정보                  │
│  ├ 버전          1.0.0   │
│  ├ 이용약관              >│
│  ├ 개인정보처리방침        >│
│  └ 오픈소스 라이선스       >│
│  ─────────────────────  │
│  고객센터                 │
│  ├ FAQ                  >│
│  └ 1:1 문의              >│
│  ─────────────────────  │
│                         │
│  로그아웃                 │  ← 빨간색 텍스트
│                         │
│  회원탈퇴                 │  ← 회색 텍스트
└─────────────────────────┘
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 알림 토글 | API 호출 + 설정 변경 |
| 계정 관리 항목 탭 | 상세 페이지 또는 편집 모달 |
| 이용약관/개인정보 | 약관 전문 페이지 |
| FAQ | FAQ 아코디언 페이지 |
| 로그아웃 | 확인 모달 → 토큰 삭제 → Login |
| 회원탈퇴 | 확인 모달 (한번 더) → 계정 삭제 → Login |

#### API
- `GET /api/users/me/settings`
- `PUT /api/users/me/settings` - body: `{ notifications: {...}, ... }`
- `POST /api/auth/logout`
- `DELETE /api/users/me`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 리스트 | 섹션 구분 + 항목 나열 |
| 토글 | iOS 스타일 스위치 (`--accent-color` 활성) |
| 로그아웃 | `--destructive` 텍스트 |
| 회원탈퇴 | `--text-muted` 텍스트 |
| 화살표 | Chevron right 아이콘 |

---

## 3. 라우트 추가

```typescript
// routes.ts
{ path: '/my-routines', element: <MyRoutinesPage /> }, // 또는 기존 my-lists 확장
{ path: '/qr', element: <QRCodeCenterPage /> },
{ path: '/following', element: <FollowingPage /> },
{ path: '/settings', element: <SettingsPage /> },
```

## 4. 파일 목록 (Phase 1 완료 상태)

| 파일 | 설명 | 상태 |
|------|------|------|
| `src/app/components/ProfilePage.tsx` | 프로필 확장 (커버, 탭, 인라인편집) | MODIFIED |
| `src/app/components/MyListsPage.tsx` | 프로그레스 요약 + 루틴별 프로그레스 바 | MODIFIED |
| `src/app/components/SettingsPage.tsx` | 설정 | EXISTS |
| `src/app/components/QRCodeCenterPage.tsx` | QR 코드 센터 | MISSING (P1) |
| `src/app/components/FollowingPage.tsx` | 팔로잉/팔로워 | MISSING (P1) |
