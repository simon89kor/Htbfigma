# 04. POST (Community) 기획서

**우선순위:** P1 (Important)
**상태:** EXISTS - Phase 2(F5)에서 구현 완료 (2026-02-26)
**라우트:** `/community`, `/community/:id`, `/community/create`, `/user/:id`, `/ranking`
**신규 파일:** `CommunityFeedPage.tsx`, `PostCard.tsx`, `CommentList.tsx`, `PostDetailPage.tsx`, `PostCreatePage.tsx`, `UserProfileViewPage.tsx`, `RankingDetailPage.tsx`, `community-context.tsx`

---

## 1. 현재 상태 분석

### 구현 완료 (Phase 2 — F5 에이전트)
- `CommunityFeedPage.tsx` — 커뮤니티 메인 피드 (무한 스크롤, 탭 필터, FAB)
- `PostCard.tsx` — 게시물 카드 (이미지 스와이프, 좋아요/댓글/북마크/공유)
- `CommentList.tsx` — 댓글 리스트 + 입력 폼
- `PostDetailPage.tsx` — 게시물 상세 (이미지 뷰어, 인터랙션, 댓글)
- `PostCreatePage.tsx` — 게시물 작성 6단계 멀티스텝
- `UserProfileViewPage.tsx` — 타 유저 프로필 (팔로우, 게시물/루틴 탭)
- `RankingDetailPage.tsx` — 랭킹 상세 (주간/월간, 카테고리별)
- `community-context.tsx` — 커뮤니티 상태관리 Context
- `Layout.tsx` 수정 — 커뮤니티 탭 추가
- `RootProviders.tsx` 수정 — CommunityProvider 추가

### 구현 차이점 (기획 대비)
- **피드 탭**: 기획의 `[팔로잉, MY TO-BE, NOW, 랭킹, 감사일기, 다이어트]` → 구현은 `[전체, 팔로잉, MY TO-BE, NOW, 감사일기, 다이어트, 운동인증, 자기개발]`. "전체" 탭이 추가되고, "랭킹" 탭은 별도 페이지(/ranking)로 분리, "운동인증"과 "자기개발" 탭이 추가됨.
- **QR스캔 버튼**: 기획 헤더의 QR스캔 아이콘 미구현 (검색 아이콘만 배치)
- **메시지 버튼**: UserProfileViewPage에서 기획의 [메시지] 버튼 미구현 (팔로우 버튼만 배치). 메시지 기능은 별도 Phase에서 처리 예정.
- **사진 편집/필터**: Step 2, 3은 placeholder UI만 구현 (기획 의도 반영, F5 규칙에 따라 실제 편집/필터 미구현)
- **낙관적 업데이트**: 좋아요/북마크에 낙관적 업데이트 패턴 적용 (UI 즉시 반영 → 백그라운드 API)

---

## 2. 전체 Flow

```
Bottom Tab [POST] → Community Feed
                      ├── Post Card 탭 → Post Detail
                      ├── 유저 프로필 탭 → User Profile View
                      ├── + 버튼 → Post Create (6 steps)
                      ├── 검색 → 검색 결과
                      └── 랭킹 탭 → Ranking Detail
```

---

## 3. 페이지별 상세 기획

### POST-01: Community Feed

**경로:** `/community`
**컴포넌트:** `CommunityFeedPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  커뮤니티       🔍  📷   │  ← 검색 + QR스캔
│                         │
│ [팔로잉][MY TO-BE][NOW]  │
│ [랭킹][감사일기][다이어트]  │  ← 탭 바 (수평 스크롤)
│  ─────────────────────  │
│                         │
│  ┌─────────────────────┐│
│  │ 😀 닉네임  ·  2시간전 ││  ← 유저 프로필
│  │                     ││
│  │ ┌─────────────────┐ ││
│  │ │                 │ ││
│  │ │   이미지 4:3     │ ││
│  │ │                 │ ││
│  │ └─────────────────┘ ││
│  │ ┌──────────────┐   ││
│  │ │ 루틴 뱃지 태그 │   ││  ← 연결된 루틴
│  │ └──────────────┘   ││
│  │                     ││
│  │ 좋아요 32  댓글 8     ││
│  │ ❤️ 💬 📌 ↗️        ││  ← 인터랙션 바
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│
│  │  (다음 게시물 카드)   ││
│  └─────────────────────┘│
│                         │
│              [+]        │  ← FAB (게시물 작성)
└─────────────────────────┘
```

#### 탭 카테고리
| 탭 | 설명 | 필터 키 |
|------|------|--------|
| 팔로잉 | 팔로우한 유저의 게시물 | `following` |
| MY TO-BE | 목표/다짐 게시물 | `mytobe` |
| NOW | 실시간 인증 게시물 | `now` |
| 랭킹 | 주간/월간 랭킹 | `ranking` |
| 감사일기 | 감사일기 카테고리 | `gratitude` |
| 다이어트 | 다이어트 카테고리 | `diet` |

#### 게시물 카드 컴포넌트
```typescript
interface Post {
  id: string;
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  images: string[];
  content: string;
  hashtags: string[];
  linkedRoutine?: {
    id: string;
    title: string;
    badge: string;
  };
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  category: string;
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 탭 선택 | 필터링된 피드 로드 |
| 게시물 카드 탭 | → Post Detail |
| 유저 프로필 탭 | → User Profile View |
| ❤️ 좋아요 | 토글 + 카운트 업데이트 |
| 💬 댓글 | → Post Detail (댓글 포커스) |
| 📌 관심(북마크) | 토글 |
| ↗️ 공유 | 공유 시트 |
| [+] FAB | → Post Create |
| Pull-to-Refresh | 피드 새로고침 |
| Infinite Scroll | 다음 페이지 로드 |

#### API
- `GET /api/posts?tab={tab}&page={page}&limit=20`
- `POST /api/posts/:id/like`
- `DELETE /api/posts/:id/like`
- `POST /api/posts/:id/bookmark`
- `DELETE /api/posts/:id/bookmark`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 탭 바 | 수평 스크롤, 선택 탭 `--accent-color` 밑줄 |
| 이미지 | 4:3 비율, border-radius 8px |
| 루틴 뱃지 | 이미지 하단 오버레이, 반투명 배경 |
| 인터랙션 바 | 아이콘 24x24, gap 16px |
| FAB | 56x56 원형, `--accent-color`, 우하단 고정 |
| 카드 간격 | 16px |

---

### POST-02: Post Detail

**경로:** `/community/:id`
**컴포넌트:** `PostDetailPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  ← 게시물          ...   │  ← 뒤로가기 + 더보기
│                         │
│  😀 닉네임  ·  2시간전    │
│     소개 한줄             │
│                         │
│  ┌─────────────────────┐│
│  │                     ││
│  │    이미지 뷰어       ││  ← 스와이프 가능
│  │    (1/3)            ││
│  │                     ││
│  └─────────────────────┘│
│                         │
│  ❤️ 💬 📌 ↗️           │
│  좋아요 32개              │
│                         │
│  ┌──────────────┐       │
│  │ 🏋️ 아침운동루틴│       │  ← 연결 루틴
│  └──────────────┘       │
│                         │
│  본문 텍스트...           │
│  #해시태그 #루틴인증       │
│  ─────────────────────  │
│  댓글 8개                 │
│  😀 닉네임1: 좋아요!      │
│  😀 닉네임2: 저도 해볼...  │
│  ... (더보기)             │
│  ─────────────────────  │
│  [댓글 입력...]    [전송]  │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface PostDetail extends Post {
  comments: Comment[];
}

interface Comment {
  id: string;
  author: {
    id: string;
    nickname: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  likeCount: number;
  isLiked: boolean;
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 이미지 스와이프 | 다음/이전 사진 |
| 루틴 뱃지 탭 | → Product Detail |
| 댓글 입력 + 전송 | 댓글 등록 + 리스트 업데이트 |
| ... 더보기 | 신고/차단 선택 Bottom Sheet |
| 유저 프로필 탭 | → User Profile View |

#### API
- `GET /api/posts/:id`
- `GET /api/posts/:id/comments?page={page}`
- `POST /api/posts/:id/comments` - body: `{ content: string }`
- `POST /api/posts/:id/report` - body: `{ reason: string }`

---

### POST-03: Post Create (6 Steps)

**경로:** `/community/create`
**컴포넌트:** `PostCreatePage.tsx`

#### Step Flow
```
Step 1: 사진 선택 → Step 2: 사진 편집 → Step 3: 필터
    → Step 4: 글 작성 → Step 5: 카테고리 → Step 6: 루틴 연결 → 완료
```

#### Step별 UI

**Step 1: 사진 선택**
```
┌─────────────────────────┐
│  ← 사진 선택      다음 →  │
│  ─────────────────────  │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │  │ │  │ │  │       │  ← 갤러리 그리드 (3열)
│  └──┘ └──┘ └──┘       │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │  │ │  │ │  │       │
│  └──┘ └──┘ └──┘       │
│  ...                    │
└─────────────────────────┘
선택된 사진: 좌측 상단 번호 뱃지
최대 10장 선택 가능
```

**Step 2: 사진 편집**
```
┌─────────────────────────┐
│  ← 편집          다음 →  │
│  ┌─────────────────────┐│
│  │                     ││
│  │   사진 편집 영역      ││  ← crop/rotate
│  │                     ││
│  └─────────────────────┘│
│  [자르기] [회전] [비율]    │
└─────────────────────────┘
```

**Step 3: 필터**
```
┌─────────────────────────┐
│  ← 필터          다음 →  │
│  ┌─────────────────────┐│
│  │  필터 적용 미리보기    ││
│  └─────────────────────┘│
│  [원본][밝게][따뜻][시원]  │  ← 수평 스크롤 필터
└─────────────────────────┘
```

**Step 4: 글 작성**
```
┌─────────────────────────┐
│  ← 글 작성        다음 → │
│                         │
│  제목                    │
│  [제목을 입력하세요     ]  │
│                         │
│  본문                    │
│  [내용을 작성하세요...   ] │
│  [                     ] │
│                         │
│  해시태그                 │
│  [# 해시태그 입력       ]  │
│  #추천: 루틴인증 아침루틴   │
└─────────────────────────┘
```

**Step 5: 카테고리 선택**
```
┌─────────────────────────┐
│  ← 카테고리       다음 → │
│                         │
│  게시물 카테고리를 선택하세요│
│                         │
│  ● MY TO-BE             │
│  ○ 감사일기               │
│  ○ 다이어트               │
│  ○ 운동인증               │
│  ○ 자기개발               │
└─────────────────────────┘
```

**Step 6: 루틴 연결 + 게시**
```
┌─────────────────────────┐
│  ← 루틴 연결             │
│                         │
│  게시물에 루틴을 연결할까요? │
│  (선택사항)               │
│                         │
│  내 루틴 목록:             │
│  ☐ 아침 운동 루틴         │
│  ☐ 식단 관리             │
│  ☐ 독서 습관             │
│                         │
│  [ 게시하기 ]             │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface PostCreateState {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  images: File[];
  editedImages: string[];  // base64 or blob URL
  filter: string;
  title: string;
  content: string;
  hashtags: string[];
  category: string;
  linkedRoutineId?: string;
}
```

#### API
- `POST /api/upload/images` - multipart 이미지 업로드
- `POST /api/posts` - body:
```json
{
  "title": "string",
  "content": "string",
  "images": ["url1", "url2"],
  "hashtags": ["태그1", "태그2"],
  "category": "mytobe",
  "routineId": "string (optional)"
}
```

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| Step indicator | 상단 프로그레스 바 (6단계) |
| 사진 그리드 | 3열, gap 2px |
| 필터 리스트 | 수평 스크롤, 썸네일 72x72 |
| 해시태그 | Chip 스타일, `--accent-color` 배경 |
| 게시 버튼 | `--accent-color` 배경, 52px 높이 |

---

### POST-04: User Profile View

**경로:** `/user/:id`
**컴포넌트:** `UserProfileViewPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  ← 닉네임                │
│                         │
│     😀                  │
│   닉네임                 │
│   소개 한줄               │
│                         │
│  게시물 12 | 팔로워 45     │
│  팔로잉 23               │
│                         │
│  [ 팔로우 ]  [ 메시지 ]   │
│  ─────────────────────  │
│  [게시물] [루틴]          │  ← 탭
│                         │
│  ┌──┐ ┌──┐ ┌──┐       │
│  │  │ │  │ │  │       │  ← 게시물 그리드
│  └──┘ └──┘ └──┘       │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  bio: string;
  postCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  posts: Post[];
  routines: Routine[];
}
```

#### 인터랙션
- 팔로우/언팔로우 토글
- 게시물 탭 → 게시물 그리드 (정사각형 썸네일)
- 루틴 탭 → 유저의 공개 루틴 목록
- 게시물 탭 → Post Detail

#### API
- `GET /api/users/:id`
- `GET /api/users/:id/posts`
- `GET /api/users/:id/routines`
- `POST /api/users/:id/follow`
- `DELETE /api/users/:id/follow`

---

### POST-05: Ranking Detail

**경로:** `/ranking`
**컴포넌트:** `RankingDetailPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  ← 랭킹                  │
│                         │
│  [주간] [월간]            │  ← 기간 탭
│  [전체] [운동] [식단] ... │  ← 카테고리 탭
│  ─────────────────────  │
│                         │
│     🥇                  │
│   닉네임1  달성 95%       │
│                         │
│  🥈 닉네임2  달성 90%     │
│  🥉 닉네임3  달성 88%     │
│  ─────────────────────  │
│  4. 닉네임4    85%       │
│  5. 닉네임5    82%       │
│  ...                    │
│  ─────────────────────  │
│  ┌─────────────────────┐│
│  │ 내 순위: 23위  72%   ││  ← sticky bottom
│  └─────────────────────┘│
└─────────────────────────┘
```

#### API
- `GET /api/rewards/ranking?tab={tab}&period={period}&category={category}`

---

## 4. 하단 네비게이션 변경

Community 탭 추가 필요:

```
현재: [HOME] [BOARD] [MY]
목표: [HOME] [POST] [BOARD] [MY]
```

`Layout.tsx`의 하단 네비게이션에 POST 탭 추가.

---

## 5. 라우트 추가

```typescript
// routes.ts
{ path: '/community', element: <CommunityFeedPage /> },
{ path: '/community/:id', element: <PostDetailPage /> },
{ path: '/community/create', element: <PostCreatePage /> },
{ path: '/user/:id', element: <UserProfileViewPage /> },
{ path: '/ranking', element: <RankingDetailPage /> },
```

## 6. 신규 파일 목록

| 파일 | 설명 |
|------|------|
| `src/app/components/CommunityFeedPage.tsx` | 커뮤니티 메인 피드 |
| `src/app/components/PostDetailPage.tsx` | 게시물 상세 |
| `src/app/components/PostCreatePage.tsx` | 게시물 작성 (6단계) |
| `src/app/components/UserProfileViewPage.tsx` | 타 유저 프로필 |
| `src/app/components/RankingDetailPage.tsx` | 랭킹 상세 |
| `src/app/components/PostCard.tsx` | 게시물 카드 컴포넌트 |
| `src/app/components/CommentList.tsx` | 댓글 리스트 컴포넌트 |

## 7. Context 추가 필요

```typescript
// community-context.tsx (신규)
interface CommunityContextType {
  posts: Post[];
  loadPosts: (tab: string, page: number) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  createPost: (data: PostCreateState) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
}
```
