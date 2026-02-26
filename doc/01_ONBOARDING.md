# 01. Onboarding Flow 기획서

**우선순위:** P0 (Critical)
**상태:** EXISTS (6개 화면 구현 완료 — Phase 1)
**라우트:** `/splash`, `/walkthrough`, `/login` (기존 강화), `/auth/callback`, `/terms`, `/preference`

---

## 1. 현재 상태 분석

### 구현 완료 (Phase 1 완료)
- `LoginPage.tsx` - 이메일/비밀번호 로그인 + 카카오/애플/구글 소셜 로그인 버튼
- `RegisterPage.tsx` - 이메일/비밀번호 회원가입 폼
- `auth-context.tsx` - 인증 상태 관리 (login, socialLogin, register, logout, updateProfileFull)
- `SplashScreen.tsx` - 로고 애니메이션 + 세션 체크 분기
- `WalkthroughPage.tsx` - 3장 슬라이드 (embla-carousel)
- `AuthCallbackPage.tsx` - OAuth 리다이렉트 콜백 처리
- `TermsAgreementPage.tsx` - 전체동의, 필수/선택, CTA 활성화
- `PreferenceSetupPage.tsx` - 카테고리 칩 다중 선택

### 미구현
- (없음 — Phase 1 온보딩 범위 전체 구현 완료)

---

## 2. 페이지별 상세 기획

### ONBOARD-01: Splash Screen

**경로:** `/splash` (또는 앱 초기 로딩 시 자동 표시)
**컴포넌트:** `SplashScreen.tsx`

#### UI 구성
```
┌─────────────────────────┐
│                         │
│                         │
│                         │
│       [HTB LOGO]        │
│                         │
│     ● ● ● (spinner)     │
│                         │
│                         │
└─────────────────────────┘
배경: #65D9AC 그라데이션 또는 White
```

#### 컴포넌트 구조
- HTB 로고 (SVG/PNG) - 화면 중앙
- 브랜드 컬러 배경 (`--accent-color` 그라데이션 또는 White)
- 로딩 인디케이터 (subtle spinner)

#### 인터랙션
| 조건 | 동작 |
|------|------|
| 최초 방문 | 2초 후 → Walkthrough |
| 재방문 + 토큰 있음 | API 검증 → HOME (`/`) |
| 재방문 + 토큰 없음 | 2초 후 → Login (`/login`) |

#### 구현 로직
```typescript
// SplashScreen.tsx 실제 구현
// localStorage 키: 'htb_walkthrough_done' (워크스루 완료 여부)
// 세션 체크: supabase.auth.getSession()
useEffect(() => {
  // Logo animation: fade-in(500ms) -> hold(1000ms) -> fade-out(500ms)
  const navigateTimer = setTimeout(async () => {
    const walkthroughDone = localStorage.getItem('htb_walkthrough_done');

    if (!walkthroughDone) {
      // First visit: show walkthrough
      navigate('/walkthrough', { replace: true });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      navigate('/', { replace: true });      // Has valid session
    } else {
      navigate('/login', { replace: true }); // No session
    }
  }, 2000); // SPLASH_TOTAL_MS
  return () => clearTimeout(navigateTimer);
}, []);
```

#### API
- `supabase.auth.getSession()` - 기존 세션 확인 (Supabase Auth 사용)

#### 애니메이션
- 로고: fade-in (0→1, 500ms) → hold (1000ms) → fade-out (1→0, 500ms)
- 전환: fade transition to next page

---

### ONBOARD-02~04: Walkthrough Slides (3장)

**경로:** `/walkthrough`
**컴포넌트:** `WalkthroughPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│                [건너뛰기]│
│                         │
│    ┌─────────────────┐  │
│    │                 │  │
│    │   일러스트 60%   │  │
│    │                 │  │
│    └─────────────────┘  │
│                         │
│  전문가가 만든 루틴으로  │
│     시작하세요          │
│  서브 설명 텍스트        │
│                         │
│       ● ○ ○            │
│                         │
│    [  다  음  ]         │
└─────────────────────────┘
```

#### 슬라이드 콘텐츠
| Slide | 타이틀 | 서브타이틀 | 일러스트 |
|-------|--------|-----------|---------|
| 1 | 전문가가 만든 루틴으로 시작하세요 | 운동, 식단, 자기개발 등 검증된 루틴을 만나보세요 | 루틴 스토어 일러스트 |
| 2 | 매일 체크하며 나를 바꿔보세요 | 캘린더와 투두리스트로 꾸준히 관리하세요 | 체크리스트 일러스트 |
| 3 | 함께하면 더 재미있어요 | 커뮤니티에서 경험을 나누고 동기부여를 받으세요 | 커뮤니티 일러스트 |

#### 컴포넌트 구조
```typescript
interface WalkthroughSlide {
  illustration: string;    // 이미지 경로
  title: string;
  subtitle: string;
}
```

- 일러스트 영역 (화면 60%)
- 타이틀 + 서브타이틀 (화면 30%)
- 페이지 인디케이터 (3점)
- 다음/건너뛰기 버튼
- Slide 3에는 "시작하기" CTA 버튼

#### 인터랙션
- Swipe 좌우 또는 버튼으로 슬라이드 전환
- 건너뛰기 → Login 페이지
- 시작하기 (Slide 3) → Login 페이지
- 페이지 인디케이터 탭으로 직접 이동

#### 애니메이션
- horizontal swipe transition (300ms ease-in-out)
- 인디케이터 dot: scale + color transition

#### 기술 구현
- `embla-carousel-react` 활용 (설치됨)
- `localStorage`에 `htb_walkthrough_done` 플래그 저장
- 일러스트 대신 Lucide 아이콘 placeholder 사용 (BookOpen, CalendarCheck, Users)

---

### ONBOARD-05: Social Login (기존 Login 강화)

**경로:** `/login` (기존 페이지 확장)
**컴포넌트:** `LoginPage.tsx` 수정

#### UI 구성
```
┌─────────────────────────┐
│                         │
│       [HTB LOGO]        │
│    나를 바꾸는 루틴 습관   │
│                         │
│ ┌─────────────────────┐ │
│ │  🟡 카카오로 시작하기  │ │  ← #FEE500 배경
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │  ⚫ Apple로 시작하기   │ │  ← Black 배경
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │  ⬜ Google로 시작하기  │ │  ← White + 보더
│ └─────────────────────┘ │
│                         │
│    이메일로 시작하기 →    │
│                         │
└─────────────────────────┘
```

#### 컴포넌트 구조
- 상단: HTB 로고 + 서비스 슬로건
- 카카오 로그인 버튼 (`#FEE500` 배경, 카카오 로고)
- 애플 로그인 버튼 (Black 배경, 애플 로고)
- 구글 로그인 버튼 (White + 보더, 구글 로고)
- 이메일로 시작하기 텍스트 링크

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 소셜 버튼 탭 | OAuth 인증 플로우 시작 |
| 인증 성공 + 기존 유저 | → HOME (`/`) |
| 인증 성공 + 신규 유저 | → Terms (`/terms`) → Preference (`/preference`) |
| 이메일 링크 탭 | → 기존 이메일 로그인/회원가입 폼 |

#### API
- `supabase.auth.signInWithOAuth({ provider })` - Supabase OAuth (카카오/애플/구글)
- 인증 성공 시 → `/auth/callback` 으로 리다이렉트
- `supabase.auth.signInWithPassword({ email, password })` - 이메일 로그인 (기존)

---

### ONBOARD-05.5: Auth Callback (OAuth 리다이렉트 처리)

**경로:** `/auth/callback`
**컴포넌트:** `AuthCallbackPage.tsx` (Phase 1에서 추가)

> 기획서 원본에는 없었으나, Supabase OAuth 플로우에서 리다이렉트 콜백을 처리하기 위해 F1 에이전트가 추가 구현함.

#### 역할
- Supabase OAuth 인증 완료 후 리다이렉트되는 페이지
- 세션 확인 → profile 조회 → 라우팅 분기

#### 인터랙션
| 조건 | 동작 |
|------|------|
| 세션 확인 + `terms_agreed_at` 있음 | → HOME (`/`) |
| 세션 확인 + `terms_agreed_at` 없음 | → Terms (`/terms`) |
| 프로필 조회 실패 (신규 유저) | → Terms (`/terms`) |
| 에러 발생 | 에러 메시지 + "로그인으로 돌아가기" 버튼 |
| 타임아웃 (10초) | 에러 메시지 표시 |

#### UI
- 로딩 상태: HTB 로고 + "로그인 처리 중..." + 로딩 도트
- 에러 상태: 에러 아이콘 + 에러 메시지 + CTA 버튼

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 카카오 버튼 | 배경 `#FEE500`, 텍스트 `#191919`, 카카오 로고 좌측 |
| 애플 버튼 | 배경 `#000000`, 텍스트 `#FFFFFF`, 애플 로고 좌측 |
| 구글 버튼 | 배경 `#FFFFFF`, 보더 `#DADCE0`, 구글 로고 좌측 |
| 버튼 간격 | 12px |
| 버튼 라운드 | 8px radius |
| 버튼 높이 | 48px |

---

### ONBOARD-06: Terms Agreement

**경로:** `/terms`
**컴포넌트:** `TermsAgreementPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  ← 약관 동의              │
│                         │
│  서비스 이용을 위해        │
│  아래 약관에 동의해주세요   │
│                         │
│  ☑ 전체 동의             │
│  ─────────────────────  │
│  ☑ [필수] 서비스 이용약관  >│
│  ☑ [필수] 개인정보 처리방침 >│
│  ☐ [선택] 마케팅 정보 수신  │
│                         │
│                         │
│  [  동의하고 시작하기  ]   │  ← 필수 체크 시 활성화
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface TermsState {
  all: boolean;
  service: boolean;     // 필수
  privacy: boolean;     // 필수
  marketing: boolean;   // 선택
}
```

- 전체 동의 체크박스
- [필수] 서비스 이용약관 (보기 링크 → Bottom Sheet)
- [필수] 개인정보 처리방침 (보기 링크 → Bottom Sheet)
- [선택] 마케팅 정보 수신 동의
- "동의하고 시작하기" CTA 버튼

#### 인터랙션
- 전체 동의 체크 → 모든 항목 체크
- 전체 동의 해제 → 모든 항목 해제
- 필수 항목 미체크 시 CTA 비활성화 (gray 배경)
- 필수 항목 모두 체크 시 CTA 활성화 (`--accent-color` 배경)
- 보기(>) 탭 → 약관 전문 Bottom Sheet 또는 모달
- CTA 탭 → Preference 페이지로 이동

#### API
- `POST /api/auth/terms` - body: `{ termsAgreed: boolean, privacyAgreed: boolean, marketingAgreed: boolean }`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 체크박스 활성 | `--accent-color` 채우기 |
| CTA 비활성 | `--bg-secondary` 배경 + gray 텍스트 |
| CTA 활성 | `--accent-color` 배경 + White 텍스트 |
| 약관 텍스트 | `--text-secondary` 색상 |

---

### ONBOARD-07: Preference Setup

**경로:** `/preference`
**컴포넌트:** `PreferenceSetupPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  ← 관심사 설정            │
│                         │
│  어떤 루틴에 관심이        │
│  있나요?                 │
│  최소 1개를 선택해주세요    │
│                         │
│  ┌────┐ ┌────┐ ┌────┐  │
│  │🏋️ │ │🥗 │ │📚 │  │
│  │운동 │ │식단 │ │자기 │  │
│  │루틴 │ │관리 │ │개발 │  │
│  └────┘ └────┘ └────┘  │
│  ┌────┐ ┌────┐         │
│  │📝 │ │💡 │          │
│  │자격증│ │취미 │          │
│  └────┘ └────┘         │
│                         │
│           건너뛰기        │
│  [     완  료     ]      │
└─────────────────────────┘
```

#### 카테고리 칩 데이터
```typescript
const CATEGORIES = [
  { id: 'exercise', emoji: '🏋️', label: '운동루틴' },
  { id: 'diet',     emoji: '🥗', label: '식단관리' },
  { id: 'selfdev',  emoji: '📚', label: '자기개발' },
  { id: 'cert',     emoji: '📝', label: '자격증' },
  { id: 'hobby',    emoji: '💡', label: '취미' },
];
```

#### 컴포넌트 구조
- 타이틀: "어떤 루틴에 관심이 있나요?"
- 카테고리 Chip 버튼 (아이콘 + 이모지 + 텍스트), 다중 선택 가능
- 완료 CTA 버튼
- 건너뛰기 옵션 (선택사항)

#### 인터랙션
- 카테고리 탭 → 토글 선택 (다중 선택 가능)
- 최소 1개 미선택 시 CTA 비활성화
- 완료 → HOME (`/`) 으로 이동
- 건너뛰기 → HOME으로 이동 (기본 카테고리 없이)

#### API
- `PUT /api/users/me/preference` - body: `{ categories: string[] }`

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 선택된 칩 | `--accent-color` 배경 + White 텍스트 |
| 비선택 칩 | `--bg-secondary` 배경 + `--text-secondary` |
| 칩 레이아웃 | Flex wrap, gap 12px |
| 칩 사이즈 | padding 16px, border-radius 12px |

---

## 3. 라우트 설정 변경

```typescript
// routes.ts — Layout 밖 (풀스크린, 네비게이션 바 없음)
{ path: 'splash', lazy: () => import('./SplashScreen') },
{ path: 'walkthrough', lazy: () => import('./WalkthroughPage') },
{ path: 'auth/callback', lazy: () => import('./AuthCallbackPage') },
{ path: 'terms', lazy: () => import('./TermsAgreementPage') },
{ path: 'preference', lazy: () => import('./PreferenceSetupPage') },
// /login, /register 는 Layout 내부에 유지 (LoginPage 수정)
```

> Splash, Walkthrough, AuthCallback, Terms, Preference 모두 Layout(네비게이션 바) 밖에 위치.
> lazy import 패턴 사용으로 코드 스플리팅 적용됨.

---

## 4. AuthContext 확장 (Phase 1 구현 완료)

```typescript
// auth-context.tsx — 추가된 메서드
interface AuthContextType {
  // 기존...
  socialLogin: (provider: SocialProvider) => Promise<{ success: boolean; error?: string }>;
  updateProfileFull: (updates: Partial<Profile>) => Promise<void>;
  // 약관 동의: updateProfile({ terms_agreed_at, privacy_agreed_at, marketing_agreed })
  // 관심사 설정: updateProfile({ preferences })
}

// SocialProvider 타입 (src/lib/auth.ts에서 export)
type SocialProvider = 'kakao' | 'apple' | 'google';
```

---

## 5. 파일 목록 (Phase 1 완료 상태)

| 파일 | 설명 | 상태 |
|------|------|------|
| `src/app/components/SplashScreen.tsx` | Splash 화면 | EXISTS |
| `src/app/components/WalkthroughPage.tsx` | 워크스루 슬라이드 | EXISTS |
| `src/app/components/AuthCallbackPage.tsx` | OAuth 콜백 처리 | EXISTS (기획 추가) |
| `src/app/components/TermsAgreementPage.tsx` | 약관 동의 | EXISTS |
| `src/app/components/PreferenceSetupPage.tsx` | 관심사 설정 | EXISTS |
| `src/app/components/LoginPage.tsx` | 소셜 로그인 버튼 추가 | MODIFIED |
| `src/assets/logo-htb.svg` | HTB 로고 | 미생성 (Lucide 아이콘으로 대체) |
| `src/assets/walkthrough-*.png` | 워크스루 일러스트 3장 | 미생성 (Lucide 아이콘으로 대체) |
