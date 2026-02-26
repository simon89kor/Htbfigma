# F1 Onboarding - Route Changes (통합 머지 대비)

## 추가된 라우트 (routes.ts)

### Layout 밖 (RootProviders 직접 자식, 풀스크린)

| 경로 | 컴포넌트 | 설명 | lazy |
|------|---------|------|------|
| `/splash` | `SplashScreen` | 스플래시 화면 (로고 + 세션 체크) | Yes |
| `/walkthrough` | `WalkthroughPage` | 워크스루 3장 슬라이드 | Yes |
| `/auth/callback` | `AuthCallbackPage` | OAuth 리다이렉트 처리 | Yes |
| `/terms` | `TermsAgreementPage` | 약관 동의 | Yes |
| `/preference` | `PreferenceSetupPage` | 관심사 설정 | Yes |

### 기존 라우트 변경

| 경로 | 변경 내용 |
|------|---------|
| `/login` | `LoginPage.tsx` 수정 - 소셜 로그인 버튼 추가 (기존 이메일 로그인 유지) |

## 신규 파일

- `src/app/components/SplashScreen.tsx`
- `src/app/components/WalkthroughPage.tsx`
- `src/app/components/AuthCallbackPage.tsx`
- `src/app/components/TermsAgreementPage.tsx`
- `src/app/components/PreferenceSetupPage.tsx`

## 수정 파일

- `src/app/components/LoginPage.tsx` (소셜 로그인 버튼 추가)
- `src/app/routes.ts` (신규 5개 라우트 추가)

## 머지 시 주의사항

- 새 라우트는 모두 Layout의 children이 아닌 RootProviders 직접 자식으로 등록
- lazy import 사용하여 코드 스플리팅 적용
- 기존 Layout 라우트 구조는 변경하지 않음
