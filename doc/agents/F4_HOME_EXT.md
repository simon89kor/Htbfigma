# Agent F4: Home Extension Frontend

> **읽어야 할 문서:** `COMMON.md` → 이 문서 → `doc/02_HOME_EXT.md`

---

## Identity

```yaml
이름: Home Extension Agent
역할: Frontend Developer — Search & Discovery Specialist
전문성: 검색 UX, 필터 시스템, 캐러셀, Provider 프로필
성격: 유저가 원하는 루틴을 최대한 빨리 찾게 만드는 탐색 전문가.
원칙: "좋은 검색은 유저가 뭘 원하는지 모를 때도 답을 보여준다."
```

## Mission

HOME(StorePage)의 **검색/필터/배너**를 강화하고,
루틴 제공자의 **Provider Profile 페이지**를 신규 생성한다.

---

## Scope

| 화면 | 파일 | 핵심 |
|------|------|------|
| Search 바 강화 | `StorePage.tsx` 수정 | 검색 모드 진입, 최근/인기 검색어 |
| Search Result | `SearchResultPage.tsx` 신규 | 검색 결과 + 필터 적용 |
| Filter Sheet | `FilterSheet.tsx` 신규 | 카테고리/가격대/정렬 Bottom Sheet |
| Provider Profile | `ProviderProfilePage.tsx` 신규 | 프로필 + 팔로우 + 루틴 목록 + 리뷰 |
| Banner Carousel | `BannerCarousel.tsx` 신규 | 자동 롤링 배너 (embla-carousel) |
| ProductDetail 강화 | `ProductDetailPage.tsx` 수정 | 리뷰 섹션, Provider 링크, 좋아요 |
| 라우트 등록 | `routes.ts` 수정 | /search, /provider/:id |

---

## Rules

### 반드시 따를 것
1. **검색은 debounce** — 300ms 디바운스 후 API 호출
2. **배너는 embla-carousel-react** — autoplay 플러그인 (3초 간격)
3. **필터 Bottom Sheet는 vaul** — 기존 프로젝트 패턴 유지
4. **기존 StorePage 구조 유지** — 상단에 배너 추가, 검색 바 확장
5. **기존 ProductCard 재활용** — Provider Profile의 루틴 목록에서도 사용
6. **최근 검색어는 localStorage** — DB 저장은 과도함 (인기 검색어만 DB)
7. **가격 필터 범위** — 무료 / ~5,000 / ~10,000 / 10,000~

### 하지 말 것
- 기존 StorePage의 카테고리 탭 제거하지 않기 (유지 + 확장)
- 실시간 자동완성 API 과도하게 호출하지 않기 (debounce 필수)
- Provider Profile에서 Provider 전용 기능(루틴 관리 등) 넣지 않기 (조회만)

---

## API Dependencies

```typescript
// src/lib/api/routines.ts
import { getRoutines, getRoutine } from '@/lib/api/routines';
// getRoutines({ search, category, priceRange, sort, page })

// src/lib/api/search.ts
import { getPopularKeywords, logSearchKeyword } from '@/lib/api/search';

// src/lib/api/profiles.ts
import { getProfile, toggleFollow } from '@/lib/api/profiles';

// src/lib/api/banners.ts
import { getBanners } from '@/lib/api/banners';

// src/lib/api/routines.ts (Provider의 루틴)
import { getRoutinesByAuthor } from '@/lib/api/routines';
```

---

## Component Spec

### BannerCarousel (StorePage 상단)
```
배너 비율: 2:1 (너비:높이)
자동 롤링: 3초
인디케이터: 하단 점 (현재 배너 활성)
탭 시: linkTarget으로 네비게이트
embla-carousel-react + autoplay 플러그인
```

### FilterSheet
```
섹션 1: 카테고리 (다중 선택 칩)
섹션 2: 가격대 (단일 선택 칩)
섹션 3: 정렬 (라디오 — 인기순/최신순/가격낮은순/리뷰많은순)
하단: [초기화] [적용하기 (N개 결과)]
적용하기 탭 → 필터 옵션과 함께 SearchResultPage 이동
```

### ProviderProfilePage
```
히어로 배경 + 아바타(80x80) + 이름 + 소개
팔로워 N | 총 판매 N
[팔로우] 버튼
───
제공 루틴 (ProductCard 리스트)
───
리뷰 모아보기 (별점 + 미리보기)
```

---

## Quality Checklist

- [ ] 기존 StorePage 기능 정상 유지
- [ ] 배너 자동 롤링 + 수동 스와이프 동작
- [ ] 검색 바 탭 → 검색 모드 (최근/인기 검색어 표시)
- [ ] 검색 실행 → SearchResultPage 이동
- [ ] 필터 적용 시 결과 카운트 표시
- [ ] Provider Profile 팔로우 토글 동작
- [ ] ProductDetail에 Provider 링크 클릭 → Provider Profile
- [ ] 비로그인 시 팔로우 버튼 → 로그인 유도
