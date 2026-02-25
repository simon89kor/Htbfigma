# 01. Onboarding Flow 기획서

**우선순위:** P0 (Critical)
**상태:** MISSING (5개 화면 모두 미구현)
**예상 라우트:** `/splash`, `/walkthrough`, `/login` (기존 강화), `/terms`, `/preference`

---

## 1. 현재 상태 분석

### 구현 완료
- `LoginPage.tsx` - 이메일/비밀번호 기반 로그인 폼
- `RegisterPage.tsx` - 이메일/비밀번호 회원가입 폼
- `auth-context.tsx` - 인증 상태 관리 (login, register, logout, updateProfile)

### 미구현
- Splash Screen
- Walkthrough Slides (3장)
- Social Login (카카오/애플/구글)
- Terms Agreement (약관 동의)
- Preference Setup (관심 카테고리)

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
// SplashScreen.tsx 의사코드
useEffect(() => {
  const timer = setTimeout(async () => {
    const isFirstVisit = !localStorage.getItem('htb_visited');
    const token = localStorage.getItem('htb_token');

    if (isFirstVisit) {
      localStorage.setItem('htb_visited', 'true');
      navigate('/walkthrough');
    } else if (token) {
      // GET /health 서버 상태 확인
      // GET /api/auth/refresh 토큰 갱신
      navigate('/');
    } else {
      navigate('/login');
    }
  }, 2000);
  return () => clearTimeout(timer);
}, []);
```

#### API
- `GET /health` - 서버 상태 확인
- `GET /api/auth/refresh` - 토큰 갱신

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
- `react-slick` 또는 `embla-carousel-react` 활용 (이미 설치됨)
- `localStorage`에 walkthrough 완료 플래그 저장

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
- `POST /api/auth/social` - body: `{ provider: "kakao" | "apple" | "google", token: string }`
- `POST /api/auth/signup` - 이메일 가입 (기존)

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
// routes.ts 에 추가할 라우트
{ path: '/splash', element: <SplashScreen /> },       // Layout 밖
{ path: '/walkthrough', element: <WalkthroughPage /> }, // Layout 밖
{ path: '/terms', element: <TermsAgreementPage /> },
{ path: '/preference', element: <PreferenceSetupPage /> },
// /login, /register 는 기존 유지 (LoginPage 수정)
```

> Splash, Walkthrough는 Layout(네비게이션 바) 밖에 위치해야 함

---

## 4. AuthContext 확장 필요 사항

```typescript
// auth-context.tsx 에 추가할 상태/메서드
interface AuthContextType {
  // 기존...
  socialLogin: (provider: 'kakao' | 'apple' | 'google') => Promise<void>;
  agreeTerms: (terms: TermsAgreement) => Promise<void>;
  setPreferences: (categories: string[]) => Promise<void>;
  isNewUser: boolean;
  hasCompletedOnboarding: boolean;
}
```

---

## 5. 신규 파일 목록

| 파일 | 설명 |
|------|------|
| `src/app/components/SplashScreen.tsx` | Splash 화면 |
| `src/app/components/WalkthroughPage.tsx` | 워크스루 슬라이드 |
| `src/app/components/TermsAgreementPage.tsx` | 약관 동의 |
| `src/app/components/PreferenceSetupPage.tsx` | 관심사 설정 |
| `src/assets/logo-htb.svg` | HTB 로고 (필요 시) |
| `src/assets/walkthrough-*.png` | 워크스루 일러스트 3장 |
