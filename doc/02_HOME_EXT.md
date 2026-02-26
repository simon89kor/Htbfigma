# 02. HOME 확장 기획서

**우선순위:** P1 (Important)
**상태:** EXISTS - Phase 2(F4)에서 구현 완료 (2026-02-26)
**관련 기존 파일:** `StorePage.tsx`, `ProductDetailPage.tsx`, `ProductCard.tsx`
**신규 파일:** `BannerCarousel.tsx`, `FilterSheet.tsx`, `SearchResultPage.tsx`, `ProviderProfilePage.tsx`

---

## 1. 현재 상태 분석

### 구현 완료 (Phase 2 — F4 에이전트)
- `StorePage.tsx` - 스토어 메인 (배너 캐러셀 + 검색 모드 + 카테고리 탭)
- `ProductDetailPage.tsx` - 상품 상세 (리뷰 섹션, Provider 링크, 좋아요, 공유 추가)
- `ProductCard.tsx` - 상품 카드 컴포넌트
- `BannerCarousel.tsx` - 배너 캐러셀 (embla-carousel, 자동 롤링 3초)
- `FilterSheet.tsx` - 필터 Bottom Sheet (카테고리/가격대/정렬, vaul)
- `SearchResultPage.tsx` - 검색 결과 전용 페이지 (debounce 300ms, 필터 적용)
- `ProviderProfilePage.tsx` - Provider 프로필 (히어로/팔로우/루틴/리뷰)

### 구현 차이점 (기획 대비)
- **자동완성 API**: 미구현 — 검색 모드에서 최근 검색어(localStorage)와 인기 검색어(API)만 표시. 입력 중 자동완성 드롭다운은 미구현.
- **Banner linkType**: 기획의 `'routine' | 'category' | 'external'` 외에 `'challenge'` 타입이 DB 스키마에 포함되어 구현에도 반영됨.
- **좋아요 저장**: ProductDetailPage 좋아요는 localStorage 기반 (`htb_liked_products`). 서버 사이드 저장은 FB-003으로 추후 처리.
- **필터 카테고리 목록**: 기획의 `[운동, 식단, 자기개발, 자격증, 취미]` → 구현은 DB 카테고리 기준 `[운동, 라이프스타일, 교육, 비즈니스, 여행, 건강, 자기개발, 생산성]` 8종.
- **검색 결과 데이터**: 현재 로컬 data.ts 기반 클라이언트 필터링. API 통합은 FB-002로 추후 처리.
- **기간별 가격 표시**: 미구현 — 기존 단일 가격 표시 유지 (PeriodSelectionSheet에서 기간 선택 가능).

---

## 2. 페이지별 상세 기획

### HOME-EXT-01: Search & Filter 강화

**경로:** `/` (기존 StorePage 내 강화) + `/search?q={query}` (검색 결과)
**수정 대상:** `StorePage.tsx`, 신규 `SearchResultPage.tsx`

#### 현재 → 목표
| 항목 | 현재 | 목표 |
|------|------|------|
| 검색 | 기본 텍스트 필터 | 키워드 검색 + 자동완성 + 최근 검색어 |
| 필터 | 카테고리 탭만 | 카테고리 + 가격대 + 정렬 + 기간 |
| 결과 | 같은 페이지 | 전용 검색 결과 페이지 |

#### UI 구성 - 검색 바 확장
```
┌─────────────────────────┐
│  🔍 루틴을 검색해보세요    │  ← 탭 시 검색 모드 진입
└─────────────────────────┘

검색 모드 진입 시:
┌─────────────────────────┐
│  ← 🔍 [검색어 입력     ]│
│  ─────────────────────  │
│  최근 검색어         전체삭제│
│  운동루틴  식단관리  아침   │
│  ─────────────────────  │
│  인기 검색어              │
│  1. 홈트레이닝            │
│  2. 다이어트 식단         │
│  3. 아침 루틴             │
└─────────────────────────┘
```

#### UI 구성 - 필터 Bottom Sheet
```
┌─────────────────────────┐
│  ── (드래그 핸들)         │
│  필터                 초기화│
│  ─────────────────────  │
│  카테고리                 │
│  [운동] [식단] [자기개발]  │
│  [자격증] [취미]          │
│  ─────────────────────  │
│  가격대                   │
│  [무료] [~5,000] [~10,000]│
│  [10,000~]              │
│  ─────────────────────  │
│  정렬                    │
│  ○ 인기순  ○ 최신순       │
│  ○ 가격낮은순 ○ 리뷰많은순  │
│  ─────────────────────  │
│  [  적용하기 (N개 결과)  ] │
└─────────────────────────┘
```

#### API
- `GET /api/routines/search?q={query}&category={cat}&priceRange={range}&sort={sort}&page={page}`
- `GET /api/search/popular` - 인기 검색어
- `GET /api/search/suggest?q={query}` - 자동완성

#### 인터랙션
- 검색 바 탭 → 검색 모드 (최근/인기 검색어 표시)
- 검색어 입력 → 자동완성 드롭다운
- 검색 실행 → 검색 결과 페이지 이동
- 필터 아이콘 탭 → 필터 Bottom Sheet
- 적용하기 → 필터링된 결과 표시

---

### HOME-EXT-02: Provider Profile

**경로:** `/provider/:id`
**컴포넌트:** `ProviderProfilePage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │  히어로 배경 이미지    │ │
│ │                     │ │
│ │  ┌──┐               │ │
│ │  │  │ 이름            │ │
│ │  └──┘ 소개 한줄        │ │
│ └─────────────────────┘ │
│                         │
│  팔로워 128  |  총 판매 1.2K│
│                         │
│  [ 팔로우 ]              │
│  ─────────────────────  │
│  제공 루틴                │
│  ┌──────┐ ┌──────┐     │
│  │Card 1│ │Card 2│     │
│  └──────┘ └──────┘     │
│  ─────────────────────  │
│  리뷰 (45개)          더보기│
│  ⭐⭐⭐⭐⭐ 4.8          │
│  "정말 좋은 루틴..."      │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface ProviderProfile {
  id: string;
  name: string;
  avatar: string;
  coverImage: string;
  bio: string;
  followerCount: number;
  totalSales: number;
  routines: Routine[];
  reviews: Review[];
  isFollowing: boolean;
}
```

#### 섹션 구성
1. **프로필 헤더** - 배경이미지 + 아바타(80x80) + 이름 + 소개
2. **통계** - 팔로워 수 | 총 판매량
3. **팔로우 버튼** - 토글 (팔로우/언팔로우)
4. **제공 루틴 목록** - RoutineCard 형태 (기존 ProductCard 재활용)
5. **리뷰 모아보기** - 별점 + 리뷰 미리보기 + 더보기

#### 인터랙션
- 루틴 카드 탭 → Product Detail (`/product/:id`)
- 팔로우 토글 → API 호출
- 리뷰 더보기 → 리뷰 전체 목록 (Bottom Sheet 또는 별도 화면)

#### API
- `GET /api/users/:id` - Provider 정보
- `GET /api/users/:id/routines` - 제공 루틴 목록
- `GET /api/users/:id/reviews` - 리뷰 목록
- `POST /api/users/:id/follow` - 팔로우
- `DELETE /api/users/:id/follow` - 언팔로우

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 헤더 | 히어로 이미지 + 그라데이션 오버레이 |
| 아바타 | 80x80 원형, 보더 2px white |
| 팔로우 버튼 | `--accent-color` 배경 (팔로우 전), `--bg-secondary` (팔로우 후) |
| 루틴 카드 | 기존 ProductCard 스타일 유지 |

---

### HOME-EXT-03: Banner & Promotions

**위치:** StorePage 상단 (카테고리 탭 위)
**수정 대상:** `StorePage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│ ┌─────────────────────┐ │
│ │                     │ │
│ │  프로모션 배너 슬라이드 │ │
│ │  (자동 롤링)          │ │
│ │                     │ │
│ │            ● ○ ○    │ │
│ └─────────────────────┘ │
│                         │
│  [운동] [식단] [자기개발]  │  ← 기존 카테고리 탭
│  ...                    │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
// 구현 시 DB 타입(Banner from database.types) 사용
// linkType에 'challenge'가 추가됨 (DB 스키마에 포함)
interface Banner {
  id: string;
  image_url: string;
  title: string;
  subtitle: string;
  link_type: 'routine' | 'category' | 'challenge' | 'external';
  link_target: string;
}
```

- 배너 캐러셀 (자동 롤링 3초 간격, loop: true)
- 배너 인디케이터 (하단 점, 활성 점은 accent-color + 넓게)
- 배너 비율: 2:1 (aspect-[2/1])
- Autoplay: stopOnInteraction: false

#### 인터랙션
- 자동 롤링 (3초 간격)
- 수동 스와이프
- 배너 탭 → linkTarget으로 이동
- 인디케이터 탭 → 해당 배너로 이동

#### API
- `GET /api/banners?placement=home` - 배너 목록

#### 기술 구현
- `embla-carousel-react` 활용 (이미 설치됨)
- autoplay 플러그인 사용

---

## 3. ProductDetailPage 강화 사항

현재 ProductDetailPage에 추가 필요한 요소:

| 항목 | 현재 | 추가 필요 |
|------|------|----------|
| 가격 표시 | 기본 가격 | 기간별 가격 (1주/4주/100일) |
| 리뷰 | 없음 | 리뷰 섹션 (별점 + 텍스트) |
| Provider 정보 | 기본 | Provider 프로필 링크 |
| 구매 버튼 | 장바구니 추가 | "구매하기" → Period Selection Bottom Sheet |
| 좋아요 | 없음 | 하트 아이콘 토글 |
| 공유 | 없음 | 공유 버튼 |

---

## 4. 라우트 추가

```typescript
// routes.ts 에 추가
{ path: '/search', element: <SearchResultPage /> },
{ path: '/provider/:id', element: <ProviderProfilePage /> },
```

## 5. 신규 파일 목록

| 파일 | 설명 |
|------|------|
| `src/app/components/SearchResultPage.tsx` | 검색 결과 페이지 |
| `src/app/components/ProviderProfilePage.tsx` | Provider 프로필 |
| `src/app/components/BannerCarousel.tsx` | 배너 캐러셀 컴포넌트 |
| `src/app/components/FilterSheet.tsx` | 필터 Bottom Sheet |
