# 08. Notification Center 기획서

**우선순위:** P1 (Important)
**상태:** EXISTS - Phase 2(F7)에서 구현 완료 (2026-02-26)
**라우트:** `/notifications`
**신규 파일:** `NotificationCenterPage.tsx`, `NotificationCard.tsx`, `notification-context.tsx`

---

## 1. 현재 상태 분석

### 구현 완료 (Phase 2 — F7 에이전트)
- `NotificationCenterPage.tsx` — 알림 센터 (전체/일정/커뮤니티/구매 탭, 무한 스크롤, 일괄 읽음)
- `NotificationCard.tsx` — 알림 카드 (타입별 이모지 아이콘, 미읽음 빨간 점, deepLink 네비게이션)
- `notification-context.tsx` — 알림 Context (Supabase Realtime 구독, unreadCount 전역 관리)
- `Layout.tsx` 수정 — 헤더에 알림 아이콘 + 미읽음 카운트 뱃지 추가
- `RootProviders.tsx` 수정 — NotificationProvider 추가

### 구현 차이점 (기획 대비)
- **탭 구성**: 기획의 `[일정, 커뮤니티, 구매]` 3탭 → 구현은 `[전체, 일정, 커뮤니티, 구매]` 4탭. "전체" 탭이 추가됨.
- **미읽음 점 색상**: 기획의 `--accent-color`(민트) → 구현은 `--destructive`(#d4183d, 빨간색). 읽지 않은 알림의 시각적 긴급성을 높이기 위한 의도적 변경.
- **알림 뱃지**: 기획의 헤더 위치 배치 구현 완료. 99+ 표시, 빨간 원형 뱃지.
- **Supabase Realtime**: notifications 테이블 INSERT 이벤트 구독, 새 알림 시 unreadCount +1 자동 반영.

---

## 2. 상세 기획

### NOTI-01: Notification Center

**경로:** `/notifications`
**컴포넌트:** `NotificationCenterPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  ← 알림          일괄 읽음│
│                         │
│ [일정] [커뮤니티] [구매]   │  ← 탭
│  ─────────────────────  │
│                         │
│  일정 알림 탭:             │
│  ┌─────────────────────┐│
│  │ 🔴 📅 아침 운동 루틴   ││  ← 미읽음 (빨간 점)
│  │ 오전 7:00에 시작할      ││
│  │ 시간이에요!            ││
│  │              3분 전   ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │    📅 식단 관리       ││  ← 읽음 (점 없음)
│  │ 오늘의 식단을 확인      ││
│  │ 해보세요               ││
│  │              1시간 전  ││
│  └─────────────────────┘│
│                         │
│  커뮤니티 알림 탭:          │
│  ┌─────────────────────┐│
│  │ 🔴 ❤️ 닉네임1님이     ││
│  │ 회원님의 게시물을       ││
│  │ 좋아합니다            ││
│  │              30분 전  ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 🔴 💬 닉네임2님이     ││
│  │ 댓글을 남겼습니다:     ││
│  │ "화이팅이에요!"        ││
│  │              2시간 전  ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │    👤 닉네임3님이      ││
│  │ 회원님을 팔로우하기     ││
│  │ 시작했습니다           ││
│  │              어제     ││
│  └─────────────────────┘│
│                         │
│  구매 알림 탭:             │
│  ┌─────────────────────┐│
│  │ 🔴 🛒 아침 운동 루틴   ││
│  │ 구매가 완료되었습니다   ││
│  │              어제     ││
│  └─────────────────────┘│
│                         │
│  Empty State:            │
│  ┌─────────────────────┐│
│  │  🔔                 ││
│  │  알림이 없습니다       ││
│  └─────────────────────┘│
└─────────────────────────┘
```

#### 알림 데이터 구조
```typescript
interface Notification {
  id: string;
  type: 'schedule' | 'community' | 'purchase';
  subType: string;       // 'routine_reminder' | 'like' | 'comment' | 'follow' | 'purchase_complete'
  title: string;
  message: string;
  icon: string;          // 아이콘 타입
  isRead: boolean;
  createdAt: string;
  deepLink: string;      // 클릭 시 이동할 경로
  metadata?: {
    postId?: string;
    userId?: string;
    routineId?: string;
    purchaseId?: string;
  };
}
```

#### 알림 타입별 상세

| 카테고리 | subType | 아이콘 | 메시지 예시 | Deep Link |
|---------|---------|-------|-----------|-----------|
| 일정 | routine_reminder | 📅 | "아침 운동 루틴 시작 시간이에요!" | `/my-lists` |
| 일정 | streak_alert | 🔥 | "12일 연속 달성 중! 오늘도 화이팅!" | `/stats` |
| 일정 | routine_expiry | ⏰ | "식단 관리 루틴이 3일 후 만료됩니다" | `/my-routines` |
| 커뮤니티 | like | ❤️ | "닉네임님이 게시물을 좋아합니다" | `/community/:postId` |
| 커뮤니티 | comment | 💬 | "닉네임님이 댓글을 남겼습니다" | `/community/:postId` |
| 커뮤니티 | follow | 👤 | "닉네임님이 팔로우를 시작했습니다" | `/user/:userId` |
| 구매 | purchase_complete | 🛒 | "루틴 구매가 완료되었습니다" | `/purchase-complete` |
| 구매 | refund | 💰 | "환불이 처리되었습니다" | `/my-routines` |

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 알림 카드 탭 | 해당 페이지로 이동 (deepLink) + 읽음 처리 |
| 일괄 읽음 | 모든 알림 읽음 처리 |
| 탭 전환 | 카테고리별 필터링 |
| Pull-to-Refresh | 새 알림 로드 |

#### API
- `GET /api/notifications?tab={schedule|community|purchase}&page={page}`
- `PUT /api/notifications/:id/read` - 개별 읽음
- `PUT /api/notifications/read-all` - 일괄 읽음
- `GET /api/notifications/unread-count` - 미읽은 알림 수

---

## 3. 네비게이션 바 알림 뱃지

`Layout.tsx`에 알림 아이콘 + 미읽음 카운트 뱃지 추가.

#### 위치
```
┌─────────────────────────┐
│  HTB     검색  🔔(3)  Me │  ← 헤더 바
│  ...                    │
└─────────────────────────┘
```

#### 구현
```typescript
// Layout.tsx 헤더에 추가
const { unreadCount } = useNotifications();

<Link to="/notifications">
  <Bell size={24} />
  {unreadCount > 0 && (
    <Badge count={unreadCount} />  // 빨간 원 + 숫자
  )}
</Link>
```

---

## 4. 디자인 스펙

| 요소 | 스펙 |
|------|------|
| 미읽음 점 | `--accent-color` 8x8 원형, 아이콘 좌측 |
| 읽음 카드 | 배경 White |
| 미읽음 카드 | 배경 `--accent-color` 5% tint |
| 아이콘 | 24x24, 각 타입별 이모지 |
| 시간 텍스트 | `--text-muted`, 12px |
| 뱃지 (헤더) | `--destructive` 배경, White 텍스트, 16px 원형 |
| Empty State | 🔔 큰 아이콘 + "알림이 없습니다" 텍스트 |
| 탭 바 | 선택 탭 `--accent-color` 밑줄 |

---

## 5. 라우트 추가

```typescript
// routes.ts
{ path: '/notifications', element: <NotificationCenterPage /> },
```

## 6. 신규 파일 목록

| 파일 | 설명 |
|------|------|
| `src/app/components/NotificationCenterPage.tsx` | 알림 센터 페이지 |
| `src/app/components/NotificationCard.tsx` | 알림 카드 컴포넌트 |

## 7. Context 추가

```typescript
// notification-context.tsx (신규)
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loadNotifications: (tab: string, page: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}
```

> Layout에 NotificationProvider 추가 필요 (미읽음 카운트 전역 사용)
