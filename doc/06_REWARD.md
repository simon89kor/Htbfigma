# 06. REWARD (보상 & 달성) 기획서

**우선순위:** P1~P2
**상태:** MISSING (4개 화면 모두 미구현)
**예상 라우트:** `/reward`, `/reward/badges`, `/reward/ranking`, `/reward/challenges`

---

## 1. 현재 상태 분석

### 구현 완료
- 없음

### 미구현
- Reward Main (메인 대시보드)
- Badge Collection (뱃지 컬렉션)
- Ranking Board (랭킹)
- Challenge (챌린지)

---

## 2. 페이지별 상세 기획

### REWARD-01: Reward Main

**경로:** `/reward`
**컴포넌트:** `RewardMainPage.tsx`
**우선순위:** P1

#### UI 구성
```
┌─────────────────────────┐
│  리워드            ⚙️    │
│  ─────────────────────  │
│                         │
│  닉네임님의 달성 현황       │
│  ┌─────────────────────┐│
│  │  총 달성 루틴          ││
│  │      127개           ││
│  └─────────────────────┘│
│                         │
│  🔥 연속 달성 (Streak)    │
│  ┌─────────────────────┐│
│  │                     ││
│  │   🔥 12일 연속!      ││
│  │   최장 기록: 28일     ││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  🏅 획득 뱃지         더보기│
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐  │
│  │🌟│ │💪│ │📚│ │🎯│  │  ← 뱃지 미리보기
│  └──┘ └──┘ └──┘ └──┘  │
│                         │
│  🏆 현재 랭킹         더보기│
│  ┌─────────────────────┐│
│  │  전체 23위 / 운동 8위  ││
│  └─────────────────────┘│
│                         │
│  🎯 진행 중 챌린지     더보기│
│  ┌─────────────────────┐│
│  │  30일 운동 챌린지      ││
│  │  ████████░░ 80%     ││
│  │  D-6                ││
│  └─────────────────────┘│
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface RewardSummary {
  totalCompletedRoutines: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];          // 최근 4개
  ranking: {
    overall: number;
    category: string;
    categoryRank: number;
  };
  activeChallenges: Challenge[];
}
```

#### 섹션 구성
1. **총 달성 루틴 수** - 큰 숫자 강조 카드
2. **연속 달성 (Streak)** - 불꽃 애니메이션 + 현재/최장 기록
3. **획득 뱃지 미리보기** - 원형 아이콘 4개 + 더보기
4. **현재 랭킹** - 전체 순위 + 카테고리 순위
5. **진행 중 챌린지** - 프로그레스 바 + 남은 기간

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 뱃지 더보기 | → Badge Collection (`/reward/badges`) |
| 랭킹 더보기 | → Ranking Board (`/reward/ranking`) |
| 챌린지 더보기 | → Challenge (`/reward/challenges`) |
| 뱃지 개별 탭 | 뱃지 상세 Bottom Sheet |

#### API
- `GET /api/rewards/summary`
- `GET /api/rewards/streak`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 스트릭 카드 | 그라데이션 배경 (`--accent-color` → tint) |
| 뱃지 아이콘 | 40x40 원형 |
| 카드 | border-radius 12px, shadow-sm |
| 챌린지 프로그레스 | `--accent-color` 배경 |

---

### REWARD-02: Badge Collection

**경로:** `/reward/badges`
**컴포넌트:** `BadgeCollectionPage.tsx`
**우선순위:** P2

#### UI 구성
```
┌─────────────────────────┐
│  ← 뱃지 컬렉션            │
│                         │
│  [전체] [획득] [미획득]    │  ← 필터 탭
│  ─────────────────────  │
│                         │
│  🌟 루틴 마스터            │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │🌟│ │💪│ │📚│       │
│  │첫 │ │운동│ │독서│       │
│  │루틴│ │7일│ │30일│       │
│  └──┘ └──┘ └──┘       │
│                         │
│  🔥 스트릭 달성            │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │🔥│ │🔥│ │🔒│       │
│  │3일│ │7일│ │30일│       │
│  └──┘ └──┘ └──┘       │
│                         │
│  🤝 커뮤니티              │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │❤️│ │🔒│ │🔒│       │
│  │첫 │ │10 │ │100│       │
│  │좋아요│ │좋아요│ │좋아요│     │
│  └──┘ └──┘ └──┘       │
└─────────────────────────┘
```

#### 뱃지 데이터
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;           // 이모지 또는 이미지 URL
  category: string;       // 'routine' | 'streak' | 'community' | 'challenge'
  condition: string;      // 획득 조건 설명
  isUnlocked: boolean;
  unlockedAt?: string;    // 획득 일시
  progress?: number;      // 진행률 (0~100)
}
```

#### 뱃지 카테고리
| 카테고리 | 뱃지 예시 |
|---------|---------|
| 루틴 마스터 | 첫 루틴 완료, 7일 연속, 30일 완료, 100개 달성 |
| 스트릭 달성 | 3일 연속, 7일 연속, 30일 연속, 100일 연속 |
| 커뮤니티 | 첫 좋아요, 첫 게시물, 10 팔로워 달성 |
| 챌린지 | 첫 챌린지 완료, 챌린지 3회 완료 |

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 뱃지 탭 | 상세 Bottom Sheet (이름/설명/획득조건/날짜) |
| 필터 탭 | 전체/획득/미획득 필터링 |
| 공유 버튼 (Bottom Sheet 내) | SNS 공유 또는 이미지 저장 |

#### API
- `GET /api/rewards/badges`
- `GET /api/rewards/badges/:id`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 획득 뱃지 | 컬러풀 + 그림자 |
| 미획득 뱃지 | 회색(grayscale) + 🔒 잠금 아이콘 |
| 그리드 | 3열, 정사각형 카드, gap 12px |
| 카드 | 80x80 아이콘 + 이름 텍스트 |

---

### REWARD-03: Ranking Board

**경로:** `/reward/ranking`
**컴포넌트:** `RankingBoardPage.tsx`
**우선순위:** P2

#### UI 구성
```
┌─────────────────────────┐
│  ← 랭킹                  │
│                         │
│  [주간] [월간]            │
│  [전체][운동][식단][자기개발]│
│  ─────────────────────  │
│                         │
│        🥇               │
│      닉네임1             │
│     달성 95%             │
│                         │
│  🥈          🥉          │
│  닉네임2     닉네임3       │
│  90%        88%          │
│  ─────────────────────  │
│  4  😀 닉네임4    85%    │
│  5  😀 닉네임5    82%    │
│  6  😀 닉네임6    80%    │
│  7  😀 닉네임7    78%    │
│  ...                    │
│  ─────────────────────  │
│  ┌─────────────────────┐│
│  │ 내 순위: 23위  72%   ││  ← sticky bottom
│  └─────────────────────┘│
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface RankingEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatar: string;
  completionRate: number;
  isMe: boolean;
}

interface RankingData {
  period: 'weekly' | 'monthly';
  category: string;
  entries: RankingEntry[];
  myRanking: RankingEntry;
}
```

#### 인터랙션
- 기간/카테고리 탭 전환 → 데이터 리로드
- 유저 탭 → User Profile View
- 내 순위: 화면 하단 고정 (sticky)

#### API
- `GET /api/rewards/ranking?period={weekly|monthly}&category={all|exercise|diet|...}`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 1~3위 | 크게 표시 + 메달 아이콘 (🥇🥈🥉) |
| 4위~ | 일반 리스트 항목 |
| 내 순위 | `--accent-color` 하이라이트, 하단 고정 |

---

### REWARD-04: Challenge

**경로:** `/reward/challenges`
**컴포넌트:** `ChallengePage.tsx`
**우선순위:** P2

#### UI 구성
```
┌─────────────────────────┐
│  ← 챌린지                 │
│                         │
│  [진행중] [예정] [완료]    │
│  ─────────────────────  │
│                         │
│  ┌─────────────────────┐│
│  │ 🏋️ 30일 운동 챌린지   ││
│  │                     ││
│  │ 참여자 1,234명        ││
│  │ ████████░░ 80%      ││
│  │ D-6                 ││
│  │                     ││
│  │ 보상: 🏅 운동마스터 뱃지││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │ 📚 독서 30일 챌린지   ││
│  │ 참여자 567명          ││
│  │ ██░░░░░░░░ 20%      ││
│  │ D-24                ││
│  │ 보상: 🏅 독서가 뱃지   ││
│  └─────────────────────┘│
└─────────────────────────┘

챌린지 상세 (탭 시):
┌─────────────────────────┐
│  ← 30일 운동 챌린지       │
│                         │
│  ┌─────────────────────┐│
│  │  히어로 이미지         ││
│  └─────────────────────┘│
│                         │
│  기간: 2026.02.01~03.02  │
│  참여자: 1,234명          │
│  ─────────────────────  │
│  챌린지 설명               │
│  매일 30분 이상 운동을     │
│  인증하는 챌린지입니다.     │
│  ─────────────────────  │
│  규칙                    │
│  • 매일 운동 루틴 1개 완료  │
│  • 인증 게시물 업로드       │
│  ─────────────────────  │
│  보상                    │
│  🏅 운동마스터 뱃지         │
│  🎫 스토어 10% 할인 쿠폰   │
│  ─────────────────────  │
│  [ 참여하기 ]             │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface Challenge {
  id: string;
  title: string;
  description: string;
  image: string;
  startDate: string;
  endDate: string;
  participantCount: number;
  rules: string[];
  rewards: ChallengeReward[];
  progress: number;        // 내 진행률 (참여 중인 경우)
  isParticipating: boolean;
  status: 'upcoming' | 'active' | 'completed';
}

interface ChallengeReward {
  type: 'badge' | 'coupon' | 'point';
  name: string;
  icon: string;
  description: string;
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 챌린지 카드 탭 | → 챌린지 상세 |
| 참여하기 | 챌린지 등록 + BOARD에 반영 |
| 탭 필터 | 진행중/예정/완료 필터링 |

#### API
- `GET /api/challenges?status={active|upcoming|completed}`
- `GET /api/challenges/:id`
- `POST /api/challenges/:id/join`

---

## 3. 하단 네비게이션 변경

REWARD 탭 추가:

```
현재:  [HOME] [BOARD] [MY]
목표:  [HOME] [POST] [BOARD] [REWARD] [MY]
```

---

## 4. 라우트 추가

```typescript
// routes.ts
{ path: '/reward', element: <RewardMainPage /> },
{ path: '/reward/badges', element: <BadgeCollectionPage /> },
{ path: '/reward/ranking', element: <RankingBoardPage /> },
{ path: '/reward/challenges', element: <ChallengePage /> },
{ path: '/reward/challenges/:id', element: <ChallengeDetailPage /> },
```

## 5. 신규 파일 목록

| 파일 | 설명 |
|------|------|
| `src/app/components/RewardMainPage.tsx` | 리워드 메인 |
| `src/app/components/BadgeCollectionPage.tsx` | 뱃지 컬렉션 |
| `src/app/components/RankingBoardPage.tsx` | 랭킹 보드 |
| `src/app/components/ChallengePage.tsx` | 챌린지 리스트 |
| `src/app/components/ChallengeDetailPage.tsx` | 챌린지 상세 |

## 6. Context 추가

```typescript
// reward-context.tsx (신규)
interface RewardContextType {
  summary: RewardSummary | null;
  badges: Badge[];
  ranking: RankingData | null;
  challenges: Challenge[];
  loadSummary: () => Promise<void>;
  loadBadges: () => Promise<void>;
  loadRanking: (period: string, category: string) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
}
```
