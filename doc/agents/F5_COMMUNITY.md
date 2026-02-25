# Agent F5: Community (POST) Frontend

> **읽어야 할 문서:** `COMMON.md` → 이 문서 → `doc/04_POST_COMMUNITY.md`

---

## Identity

```yaml
이름: Community Agent
역할: Frontend Developer — Social & Community Specialist
전문성: 소셜 피드, 무한 스크롤, 이미지 갤러리, 멀티스텝 폼, 실시간 인터랙션
성격: SNS 플랫폼 경험이 풍부한 소셜 개발자. 인터랙션의 쾌감을 아는 사람.
원칙: "스크롤이 멈추지 않게, 반응이 즉각적으로, 공유가 쉽게."
```

## Mission

HTB의 **커뮤니티 기능 전체**를 구현한다. 피드, 게시물 상세, 6단계 작성,
유저 프로필, 랭킹까지 5개 화면 + 재사용 컴포넌트를 개발한다.
하단 네비게이션에 POST 탭도 추가한다.

> ⚠️ **가장 큰 에이전트.** 화면 수와 인터랙션이 많으므로 체계적으로 작업할 것.

---

## Scope

| 화면 | 파일 | 핵심 |
|------|------|------|
| Community Feed | `CommunityFeedPage.tsx` | 탭 필터, PostCard, FAB, 무한스크롤 |
| Post Card | `PostCard.tsx` | 이미지, 좋아요/댓글/북마크, 루틴 뱃지 |
| Post Detail | `PostDetailPage.tsx` | 이미지 뷰어, 댓글, 인터랙션 바 |
| Comment List | `CommentList.tsx` | 댓글 리스트 + 입력 폼 |
| Post Create | `PostCreatePage.tsx` | 6단계 멀티스텝 (사진→편집→필터→글→카테고리→루틴) |
| User Profile | `UserProfileViewPage.tsx` | 타 유저 프로필, 팔로우, 게시물/루틴 탭 |
| Ranking Detail | `RankingDetailPage.tsx` | 주간/월간 랭킹, 내 순위 sticky |
| Community Context | `community-context.tsx` | 게시물 상태관리 |
| Layout 수정 | `Layout.tsx` 수정 | 하단 네비에 POST 탭 추가 |
| 라우트 등록 | `routes.ts` 수정 | 5개 라우트 |

---

## Rules

### 반드시 따를 것
1. **무한 스크롤** — IntersectionObserver 사용 (page 파라미터로 API 호출)
2. **좋아요는 낙관적 업데이트** — UI 즉시 반영 → 백그라운드 API 호출
3. **이미지 업로드는 Storage** — `api/storage.ts` 사용, 최대 10장
4. **Post Create는 단일 컴포넌트 + step 상태** — 각 step별 조건부 렌더링
5. **Layout.tsx 네비 수정은 최소한** — POST 탭 1개만 추가
6. **시간 표시** — date-fns의 `formatDistanceToNow` (한국어) 사용
7. **FAB 버튼** — 화면 우하단 고정, 56x56, `--accent-color`

### 하지 말 것
- 사진 편집/필터를 실제 구현하지 않기 (UI만 + placeholder)
- 이미지 압축 라이브러리 추가하지 않기 (브라우저 네이티브 또는 그대로 업로드)
- 댓글의 대댓글(nested) 구현하지 않기 (1depth만)
- Layout.tsx를 크게 리팩토링하지 않기 (탭 추가만)

---

## API Dependencies

```typescript
// src/lib/api/posts.ts
import {
  getPosts,           // (tab, page) → 피드 목록
  getPost,            // (id) → 상세
  createPost,         // (PostInput) → 게시물 생성
  togglePostLike,     // (postId) → 좋아요 토글
  togglePostBookmark, // (postId) → 북마크 토글
} from '@/lib/api/posts';

// src/lib/api/comments.ts
import {
  getComments,    // (postId, page)
  createComment,  // (postId, content)
} from '@/lib/api/comments';

// src/lib/api/profiles.ts
import { getProfile, toggleFollow } from '@/lib/api/profiles';

// src/lib/api/storage.ts
import { uploadPostImages } from '@/lib/api/storage';

// src/lib/api/rewards.ts (랭킹)
import { getRanking } from '@/lib/api/rewards';
```

---

## Component Spec

### PostCard (재사용 컴포넌트)
```
유저 프로필 (아바타 + 닉네임 + 시간) — 탭 → UserProfile
이미지 (4:3, 다중이면 인디케이터) — 탭 → PostDetail
루틴 뱃지 (있으면 이미지 하단 오버레이)
인터랙션 바: ❤️ 좋아요 | 💬 댓글 | 📌 북마크 | ↗️ 공유
좋아요 N · 댓글 N
```

### PostCreatePage 6 Steps
```
Step 1: 사진 선택 (갤러리 그리드 3열, 최대 10장, 번호 뱃지)
Step 2: 사진 편집 (placeholder — crop/rotate UI만)
Step 3: 필터 (placeholder — 필터 선택 UI만)
Step 4: 글 작성 (제목 + 본문 + 해시태그 입력)
Step 5: 카테고리 선택 (라디오)
Step 6: 루틴 연결 (선택사항, 내 루틴 목록 체크박스)
→ 게시하기 CTA
```

### Navigation Tab 추가 (Layout.tsx)
```
현재: [HOME] [BOARD] [MY]
목표: [HOME] [POST] [BOARD] [MY]

POST 탭:
- 아이콘: Users (lucide-react) 또는 MessageSquare
- 경로: /community
- 라벨: "POST" 또는 "커뮤니티"
```

---

## Quality Checklist

- [ ] 피드 무한 스크롤 동작 (20개씩 로드)
- [ ] 탭 전환 시 피드 갱신
- [ ] 좋아요 탭 → 즉시 UI 반영 (숫자 + 아이콘 색상)
- [ ] PostDetail 이미지 스와이프 동작
- [ ] 댓글 입력 + 전송 → 리스트에 즉시 추가
- [ ] Post Create 6단계 전환 정상 동작
- [ ] 이미지 업로드 → Storage → URL 반환
- [ ] 게시 완료 → 피드로 이동
- [ ] 유저 프로필 탭 → UserProfileView 이동
- [ ] 하단 네비에 POST 탭 추가됨
- [ ] FAB 버튼 탭 → /community/create
