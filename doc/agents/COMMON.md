# HTB Project - Agent 공통 규약

> 모든 에이전트는 작업 시작 전 이 문서를 반드시 읽고 준수합니다.

---

## 1. 프로젝트 개요

- **프로젝트명:** HOW TO BE (HTB) — 루틴 마켓플레이스
- **서비스 컨셉:** 전문가가 만든 루틴을 구매하고, 매일 체크하며, 커뮤니티에서 공유하는 플랫폼
- **타겟:** 모바일 우선 (Mobile-First), 웹앱

---

## 2. 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Framework | React + TypeScript | 18.3.1 |
| Build | Vite | 6.3.5 |
| Routing | React Router | v7 |
| Styling | Tailwind CSS | 4.1.12 |
| UI Library (Primary) | HeroUI | 2.8.9 |
| UI Library (Secondary) | Radix UI (shadcn/ui) | - |
| Icons | Lucide React | 0.487.0 |
| Animation | Motion.js | 12.23.24 |
| Charts | Recharts | 2.15.2 |
| Carousel | embla-carousel-react | 8.6.0 |
| Forms | React Hook Form | 7.55.0 |
| Toast | Sonner | 2.0.3 |
| Drawer | Vaul | - |
| Date | date-fns | 3.6.0 |
| Backend | Supabase | - |
| State | React Context API | - |

---

## 3. 디자인 토큰

```css
/* 컬러 */
--primary: #1a1a2e          /* 다크 네이비 (메인 배경, 텍스트) */
--accent: #6C5CE7           /* 퍼플 (보조 강조) */
--accent-color: #65D9AC     /* 민트 그린 (메인 CTA, 프로그레스, 활성 상태) */
--secondary: #f4f3ff        /* 라이트 퍼플 (서브 배경) */
--destructive: #d4183d      /* 레드 (삭제, 에러, 로그아웃) */
--bg-secondary: #F5F5F5     /* 라이트 그레이 (비활성 배경) */
--text-secondary: #6B7280   /* 미디엄 그레이 (서브 텍스트) */
--text-muted: #9CA3AF       /* 라이트 그레이 (힌트 텍스트) */
--border: #E5E7EB           /* 보더 색상 */

/* 소셜 로그인 */
--kakao: #FEE500            /* 카카오 (텍스트: #191919) */
--apple: #000000            /* 애플 (텍스트: #FFFFFF) */
--google-border: #DADCE0    /* 구글 보더 */

/* 타이포그래피 */
--font: "Noto Sans KR", sans-serif

/* 라운딩 */
--radius-sm: 8px
--radius: 12px             /* 기본 카드/버튼 */
--radius-lg: 16px          /* Bottom Sheet 상단 */

/* 간격 */
--gap-sm: 8px
--gap: 12px
--gap-lg: 16px
--gap-xl: 20px

/* CTA 버튼 */
--cta-height: 52px
--cta-bg: var(--accent-color)
--cta-text: #FFFFFF
--cta-disabled-bg: var(--bg-secondary)
--cta-disabled-text: var(--text-muted)
```

---

## 4. 디렉토리 구조

```
src/
├── app/
│   ├── App.tsx                    # RouterProvider
│   ├── routes.ts                  # 라우트 정의
│   ├── auth-context.tsx           # 인증 Context
│   ├── store-context.tsx          # 스토어 Context
│   ├── data.ts                    # 정적 데이터 (루틴, 카테고리)
│   │
│   ├── components/
│   │   ├── Layout.tsx             # 메인 레이아웃 (네비게이션)
│   │   ├── RootProviders.tsx      # Context 래퍼
│   │   ├── [PageName].tsx         # 페이지 컴포넌트
│   │   ├── [ComponentName].tsx    # 재사용 컴포넌트
│   │   ├── ui/                    # shadcn/ui 기본 컴포넌트 (46개)
│   │   └── admin/                 # Admin 전용 컴포넌트
│   │
│   └── styles/
│
├── lib/                           # (Phase 0에서 생성)
│   ├── supabase.ts                # Supabase 클라이언트
│   ├── database.types.ts          # DB 타입
│   ├── auth.ts                    # Auth 헬퍼
│   └── api/                       # API 레이어 (테이블별)
│
└── main.tsx
```

---

## 5. 코딩 컨벤션

### 파일 & 네이밍
- **페이지 컴포넌트:** `PascalCase` + `Page` 접미사 (e.g., `StorePage.tsx`)
- **재사용 컴포넌트:** `PascalCase` (e.g., `PostCard.tsx`)
- **Bottom Sheet:** `PascalCase` + `Sheet` 접미사 (e.g., `PeriodSelectionSheet.tsx`)
- **Context:** `kebab-case` (e.g., `auth-context.tsx`)
- **API 레이어:** `kebab-case` (e.g., `api/user-routines.ts`)
- **타입/인터페이스:** `PascalCase`, `I` 접두사 사용하지 않음

### React 패턴
```typescript
// 함수형 컴포넌트 + export default
const MyComponent = () => {
  // ...
};
export default MyComponent;

// 인터페이스는 컴포넌트 위에 선언
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// Context 패턴 (HMR-safe)
const CTX_KEY = Symbol.for('htb-context-name');
```

### 스타일링
- Tailwind CSS 클래스 사용 (인라인 style 지양)
- 반응형: `mobile-first` 접근 (`sm:`, `md:`, `lg:`)
- 컬러는 디자인 토큰 CSS 변수 또는 Tailwind 클래스 사용
- `cn()` 유틸리티로 조건부 클래스 결합 (clsx + tailwind-merge)

### Import 순서
```typescript
// 1. React
import { useState, useEffect } from 'react';
// 2. Third-party
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
// 3. UI Components
import { Button } from './ui/button';
// 4. Lib / API
import { supabase } from '@/lib/supabase';
import { getRoutines } from '@/lib/api/routines';
// 5. Types
import type { Routine } from '@/lib/database.types';
// 6. Local
import PostCard from './PostCard';
```

---

## 6. UI 패턴

### CTA 버튼
```tsx
// 활성
<Button className="w-full h-[52px] bg-[#65D9AC] text-white rounded-xl text-lg font-semibold">
  동의하고 시작하기
</Button>

// 비활성
<Button disabled className="w-full h-[52px] bg-gray-100 text-gray-400 rounded-xl text-lg">
  동의하고 시작하기
</Button>
```

### Bottom Sheet (vaul)
```tsx
import { Drawer } from 'vaul';

<Drawer.Root>
  <Drawer.Trigger />
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 bg-black/50" />
    <Drawer.Content className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl">
      <div className="mx-auto w-12 h-1.5 bg-gray-300 rounded-full my-3" />
      {/* 내용 */}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

### 탭 바 (수평 스크롤)
```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-hide px-4">
  {tabs.map(tab => (
    <button
      key={tab.key}
      className={cn(
        "px-4 py-2 rounded-full whitespace-nowrap text-sm",
        activeTab === tab.key
          ? "bg-[#65D9AC] text-white"
          : "bg-gray-100 text-gray-600"
      )}
      onClick={() => setActiveTab(tab.key)}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-20 text-gray-400">
  <IconComponent size={48} className="mb-4" />
  <p className="text-lg">표시할 내용이 없습니다</p>
</div>
```

### Toast (Sonner)
```tsx
import { toast } from 'sonner';
toast.success('저장되었습니다');
toast.error('오류가 발생했습니다');
```

---

## 7. Supabase 연동 패턴

### API 함수 작성 패턴
```typescript
// src/lib/api/routines.ts
import { supabase } from '../supabase';
import type { Database } from '../database.types';

type Routine = Database['public']['Tables']['routines']['Row'];

export async function getRoutines(options?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  let query = supabase
    .from('routines')
    .select('*, profiles!author_id(nickname, avatar_url)')
    .eq('status', 'published');

  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
```

### Context에서 API 호출 패턴
```typescript
// Context 내부
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await getRoutines({ category });
    setRoutines(data);
  } catch (error) {
    toast.error('데이터를 불러오지 못했습니다');
    console.error(error);
  } finally {
    setLoading(false);
  }
};
```

---

## 8. Backend Feedback (FE → BE 피드백)

FE 에이전트(F1~F9)가 작업 중 백엔드 변경이 필요한 상황을 발견하면,
`doc/BACKEND_FEEDBACK.md`에 구조화된 피드백을 작성합니다.

### 피드백을 작성해야 하는 경우
- API 함수가 누락되었거나 시그니처가 맞지 않을 때
- `database.types.ts` 타입이 실제 필요한 구조와 다를 때
- RLS 정책이 정상적인 데이터 접근을 차단할 때
- 새로운 RPC 함수나 Edge Function이 필요할 때
- DB 스키마에 컬럼/테이블 추가가 필요할 때

### 작성 규칙
1. **BLOCKER**: `// TODO: [FB-N] {설명}` 주석을 남기고, 가능한 우회 방법으로 나머지 작업 계속
2. **IMPORTANT**: 우회 코드로 작업 계속 + 피드백 작성
3. **SUGGESTION**: 피드백만 작성 (작업 중단 불필요)
4. 피드백 번호는 기존 항목 뒤에 순서대로 부여 (FB-001, FB-002, ...)
5. 같은 문제를 중복 작성하지 않기 (기존 피드백에 Reporter 추가)

### 예시
```markdown
### FB-001: profiles 테이블에 onboarding_completed 컬럼 필요
- **Reporter:** F1
- **Target:** B1
- **Severity:** BLOCKER
- **Category:** DB_SCHEMA
- **Description:** 온보딩 완료 여부를 저장할 boolean 컬럼이 profiles 테이블에 없음.
  Walkthrough → Login → Terms → Preference 완료 후 true로 설정해야 함.
- **Affected Files:** supabase/migrations/00001_create_profiles.sql, src/lib/database.types.ts
- **Workaround:** localStorage에 임시 저장 (`htb_onboarding_done`)
- **Status:** OPEN
```

---

## 9. 품질 기준

### 필수 체크리스트 (모든 에이전트)
- [ ] TypeScript strict mode 에러 없음
- [ ] 미사용 import 없음
- [ ] console.log 디버깅 코드 제거
- [ ] 하드코딩된 문자열 최소화 (상수로 분리)
- [ ] 로딩 상태 처리 (스켈레톤 또는 스피너)
- [ ] 에러 상태 처리 (사용자에게 보여줄 메시지)
- [ ] Empty State 처리 (데이터 없을 때)
- [ ] 모바일 반응형 확인 (max-width: 640px 기준)

### 프론트엔드 추가 체크리스트
- [ ] 디자인 토큰 색상 사용 (하드코딩 hex 지양)
- [ ] 기존 ui/ 컴포넌트 최대한 재활용
- [ ] 페이지 간 네비게이션 일관성 (뒤로가기 등)
- [ ] 키보드 접근성 기본 확보 (tabIndex, aria-label)

### 백엔드 추가 체크리스트
- [ ] RLS 정책 누락 없음 (모든 테이블)
- [ ] SQL injection 방지 (parameterized query)
- [ ] 에러 응답 형식 일관성
- [ ] 인덱스 설계 (자주 조회하는 컬럼)

---

## 10. 기존 참조 파일

작업 전 반드시 읽어야 할 기존 코드:

| 파일 | 이유 |
|------|------|
| `src/app/routes.ts` | 라우트 구조 이해 + 추가 시 형식 맞추기 |
| `src/app/components/Layout.tsx` | 네비게이션 구조 이해 |
| `src/app/components/RootProviders.tsx` | Context 래핑 순서 이해 |
| `src/app/auth-context.tsx` | 현재 인증 로직 이해 |
| `src/app/store-context.tsx` | 현재 상태관리 로직 이해 |
| `src/app/data.ts` | 기존 데이터 구조 이해 |
| `src/app/components/ui/button.tsx` | UI 컴포넌트 스타일 참고 |
| `doc/BACKEND_FEEDBACK.md` | FE→BE 피드백 작성 (FE 에이전트) / 처리할 피드백 확인 (BE 에이전트) |
| `package.json` | 설치된 패키지 확인 |
