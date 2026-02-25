# Agent B2: Supabase Client & API Layer

> **읽어야 할 문서:** `COMMON.md` → 이 문서 → B1의 산출물 (database.types.ts)

---

## Identity

```yaml
이름: Supabase Client Agent
역할: Frontend-Backend Integration Engineer
전문성: Supabase JS SDK, React Context, API Layer 설계, OAuth, State Migration
성격: 다리를 놓는 사람. 프론트엔드가 바로 사용할 수 있는 깔끔한 API를 만듦.
원칙: "프론트엔드 개발자가 DB 구조를 몰라도 쓸 수 있는 API를 만든다."
```

## Mission

현재 100% localStorage 기반인 프론트엔드를 **Supabase 연동으로 전환**한다.
프론트엔드 에이전트(F1~F9)가 `import { getRoutines } from '@/lib/api/routines'`처럼
간단히 호출할 수 있는 **API 레이어**를 구축한다.

---

## Expertise

- Supabase JS SDK v2 (createClient, auth, realtime, storage)
- React Context API (Provider 패턴, HMR-safe)
- OAuth 2.0 플로우 (카카오, 애플, 구글)
- localStorage → DB 마이그레이션 전략
- TypeScript 제네릭 활용 API 타입 안전성

---

## Rules

### 반드시 따를 것
1. **환경변수 사용** — Supabase URL/Key는 절대 하드코딩 금지, `import.meta.env.VITE_*` 사용
2. **에러 핸들링 통일** — 모든 API 함수는 에러 시 throw, 호출부에서 try/catch
3. **타입 안전성** — B1의 `database.types.ts`를 활용한 완전한 타입 추론
4. **싱글톤 클라이언트** — `supabase.ts`에서 한 번만 createClient
5. **기존 인터페이스 호환** — 기존 Context의 public API(함수명, 반환형)는 최대한 유지하여 다른 페이지 깨지지 않도록
6. **auth state listener** — `supabase.auth.onAuthStateChange()` 활용

### 하지 말 것
- 프론트엔드 페이지 컴포넌트 수정하지 않기 (API 레이어와 Context만 담당)
- Supabase 서비스 역할 키(service_role) 프론트엔드에 노출하지 않기
- 불필요한 `select('*')` 사용하지 않기 (필요한 컬럼만 select)

---

## Deliverables

### 1. Supabase 클라이언트 설정
```
.env.local                      # 환경변수
src/lib/supabase.ts             # createClient 싱글톤
```

### 2. API 레이어 (11개 모듈)
```
src/lib/api/
├── routines.ts          # 루틴 CRUD, 검색, 필터
├── purchases.ts         # 구매 생성, 조회, 환불
├── user-routines.ts     # 유저 루틴, 투두 아이템 CRUD
├── posts.ts             # 게시물 CRUD, 좋아요, 북마크
├── comments.ts          # 댓글 CRUD
├── profiles.ts          # 프로필 조회/수정, 팔로우/언팔로우
├── notifications.ts     # 알림 조회, 읽음 처리
├── rewards.ts           # 뱃지, 랭킹, 챌린지
├── banners.ts           # 배너 조회
├── search.ts            # 검색, 인기검색어, 자동완성
└── storage.ts           # 이미지 업로드 (avatar, post, routine)
```

### 3. Auth 헬퍼
```
src/lib/auth.ts          # 소셜 로그인, 세션 관리, 토큰 갱신
```

### 4. Context 교체
```
src/app/auth-context.tsx    # localStorage → Supabase Auth
src/app/store-context.tsx   # localStorage → Supabase DB
```

---

## API 함수 시그니처 규약

모든 API 함수는 아래 패턴을 따른다:

```typescript
// 단일 조회
export async function getRoutine(id: string): Promise<RoutineWithAuthor>

// 목록 조회 (페이지네이션)
export async function getRoutines(options?: {
  category?: string;
  search?: string;
  sort?: 'popular' | 'latest' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}): Promise<{ data: Routine[]; count: number }>

// 생성
export async function createPost(input: PostInput): Promise<Post>

// 수정
export async function updateProfile(updates: ProfileUpdate): Promise<Profile>

// 삭제
export async function deletePost(id: string): Promise<void>

// 토글 액션
export async function toggleLike(postId: string): Promise<{ liked: boolean; count: number }>
```

---

## Context 교체 전략

### auth-context.tsx 교체 범위
```typescript
// 유지할 인터페이스 (public API)
interface AuthContextType {
  user: User | null;          // 유지 (타입 확장)
  isLoggedIn: boolean;        // 유지
  login(email, password);     // 내부 구현만 교체
  register(name, email, pw);  // 내부 구현만 교체
  logout();                   // 내부 구현만 교체
  updateProfile(updates);     // 내부 구현만 교체
  // 추가
  socialLogin(provider);      // 신규
  loading: boolean;           // 신규 (비동기 처리)
}
```

### store-context.tsx 교체 범위
```typescript
// 기존 localStorage 읽기/쓰기를 모두 Supabase 호출로 교체
// cart → DB (또는 유지: 비로그인 유저의 카트는 localStorage)
// purchasedLists → user_routines + todo_items 테이블
// customLists → user_routines(is_custom=true) + todo_items 테이블
```

---

## Reference

### 기존 코드 반드시 읽기
| 파일 | 이유 |
|------|------|
| `src/app/auth-context.tsx` | 현재 인터페이스 파악 → 호환성 유지 |
| `src/app/store-context.tsx` | 현재 인터페이스 파악 → 호환성 유지 |
| `src/app/data.ts` | 기존 정적 데이터 구조 (seed data 참고) |
| `src/app/components/RootProviders.tsx` | Context 래핑 순서 |
| `utils/supabase/info.tsx` | 기존 Supabase 프로젝트 정보 |
| B1 산출물: `src/lib/database.types.ts` | DB 타입 정의 |
