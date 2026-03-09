# 03. Purchase Flow 기획서

**우선순위:** P0 (Critical)
**상태:** EXISTS (결제 플로우 전체 구현 완료 — Phase 1)
**관련 기존 파일:** `CartPage.tsx`, `store-context.tsx`, `ProductDetailPage.tsx`, `CheckoutStartDatePage.tsx`

---

## 1. 현재 상태 분석

### 구현 완료 (Phase 1 완료)
- `CartPage.tsx` - 장바구니 (아이템 추가/삭제/수량 변경) — 기존 유지
- `store-context.tsx` - cart 상태관리 (addToCart, removeFromCart, checkout) + refreshData
- `ProductDetailPage.tsx` - "구매하기" 버튼 추가 → PeriodSelectionSheet 연결
- `PeriodSelectionSheet.tsx` - 기간 선택 Bottom Sheet (vaul Drawer)
- `PaymentMethodPage.tsx` - 결제 수단 선택 + 금액 요약
- `PurchaseCompletePage.tsx` - 구매 완료 화면 (체크 애니메이션)

### 누락
- (없음 — Phase 1 결제 플로우 전체 구현 완료)
- FB-001: process-payment Edge Function (SUGGESTION, Phase 2 대상)

---

## 2. 전체 Purchase Flow

```
ProductDetail → [구매하기] → Period Selection (Bottom Sheet)
                                    ↓
                            Payment Method
                                    ↓
                            Payment Confirm (PG 연동)
                                    ↓
                            Purchase Complete
                                    ↓
                         [일정 선택하기] → BOARD

--- 카트 경유 플로우 (2026-03-09 추가) ---

Store → [장바구니 추가] → Cart (/cart)
                            ↓ [결제하기]
                     Checkout Start Date (/checkout/start-date)
                            ↓ (각 루틴 시작일 선택, 기본=오늘)
                     checkout(startDates)
                            ↓
                     My Lists (/my-lists)
```

---

## 3. 페이지별 상세 기획

### PURCHASE-01: Period Selection (Bottom Sheet)

**위치:** ProductDetailPage 내 Bottom Sheet
**컴포넌트:** `PeriodSelectionSheet.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  (반투명 오버레이)         │
│                         │
│                         │
├─────────────────────────┤
│  ── (드래그 핸들)         │
│                         │
│  루틴명                   │
│  by Provider 이름         │
│  ─────────────────────  │
│                         │
│  기간을 선택해주세요        │
│                         │
│  ○ 1 WEEK    ──  ₩1,400 │
│  ● 4 WEEK    ──  ₩5,600 │  ← 기본 선택
│  ○ 100 Days  ── ₩20,000 │
│                         │
│  ─────────────────────  │
│  [ 구매하기  ₩5,600 ]    │  ← 선택 금액 반영
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface PeriodOption {
  id: string;
  label: string;        // "1 WEEK", "4 WEEK", "100 Days"
  days: number;         // 7, 28, 100
  price: number;        // 1400, 5600, 20000
  originalPrice?: number; // 할인 전 가격 (선택)
}

interface PeriodSelectionProps {
  routine: {
    id: string;
    title: string;
    provider: string;
  };
  options: PeriodOption[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (option: PeriodOption) => void;
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 기간 라디오 선택 | CTA 금액 업데이트 |
| 구매하기 탭 | → Payment Method 페이지 |
| 배경 오버레이 탭 | Bottom Sheet 닫기 |
| 드래그 핸들 아래로 | Bottom Sheet 닫기 |

#### API
- `GET /api/routines/:id` - 가격 정보 포함

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| Bottom Sheet | 화면 하단 60%, border-radius 16px 16px 0 0 |
| 오버레이 | `#00000080` (반투명 검정) |
| 선택된 기간 | `--accent-color` 보더 + 배경 tint |
| 라디오 선택됨 | `--accent-color` 채우기 |
| CTA 버튼 | `--accent-color` 배경, White 텍스트, 높이 52px |

#### 기술 구현
- `vaul` (Drawer 컴포넌트) 활용 — 이미 설치됨
- 또는 기존 `ui/sheet.tsx` 활용

---

### PURCHASE-02: Payment Method

**경로:** `/payment`
**컴포넌트:** `PaymentMethodPage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│  ← 결제하기               │
│  ─────────────────────  │
│  결제 금액                │
│  ┌─────────────────────┐│
│  │ 상품 금액    ₩5,600  ││
│  │ 할인        -₩0     ││
│  │─────────────────────││
│  │ 최종 금액    ₩5,600  ││
│  └─────────────────────┘│
│  ─────────────────────  │
│  결제 수단 선택            │
│                         │
│  ┌─────────────────────┐│
│  │ 💳 카드결제      ○   ││
│  ├─────────────────────┤│
│  │ 🟡 카카오페이    ○   ││
│  ├─────────────────────┤│
│  │ 🔵 토스         ○   ││
│  ├─────────────────────┤│
│  │ 🟢 네이버페이    ○   ││
│  └─────────────────────┘│
│                         │
│  [ 결제하기  ₩5,600 ]    │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface PaymentMethod {
  id: string;
  name: string;          // "카드결제", "카카오페이" 등
  icon: string;          // 아이콘 경로
  type: 'card' | 'kakao' | 'toss' | 'naver';
}

interface PaymentState {
  routineId: string;
  period: PeriodOption;
  paymentMethod: PaymentMethod | null;
  amount: number;
  discount: number;
  finalAmount: number;
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 결제 수단 선택 | 라디오 활성화 |
| 결제하기 탭 | PG 결제 연동 → 결제 진행 |
| 결제 성공 | → Purchase Complete |
| 결제 실패 | 에러 토스트 + 재시도 |
| 뒤로가기 | → ProductDetail |

#### API
- `POST /api/purchases` - body:
```json
{
  "routineId": "string",
  "period": "1week | 4week | 100days",
  "paymentMethod": "card | kakao | toss | naver",
  "amount": 5600
}
```

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 금액 카드 | White 배경, 보더 1px `--border`, radius 12px |
| 결제 수단 카드 | 아이콘 좌측 + 이름 + 라디오 우측 |
| 선택된 수단 | `--accent-color` 보더 |
| CTA | `--accent-color` 배경, White 텍스트 |

---

### PURCHASE-03: Payment Confirm

**설명:** PG 결제 진행 중 확인 화면 (PG사 SDK 연동)

#### 구현 방식
- **Phase 1 (MVP):** PG 연동 없이 즉시 결제 완료 처리 (기존 checkout 로직 활용)
- **Phase 2:** 토스페이먼츠 / 포트원(PortOne) SDK 연동

#### Phase 1 구현
```typescript
// 결제하기 버튼 클릭 시
const handlePayment = async () => {
  setLoading(true);
  try {
    // 기존 store-context의 checkout 활용
    checkout();
    navigate('/purchase-complete', {
      state: { routineId, period, amount }
    });
  } catch (error) {
    toast.error('결제에 실패했습니다.');
  } finally {
    setLoading(false);
  }
};
```

#### Phase 2 PG 연동 (참고)
```typescript
// 포트원 SDK 연동 예시
import PortOne from '@portone/browser-sdk/v2';

const handlePayment = async () => {
  const response = await PortOne.requestPayment({
    storeId: 'store-xxx',
    paymentId: `payment_${Date.now()}`,
    orderName: routine.title,
    totalAmount: finalAmount,
    currency: 'KRW',
    payMethod: selectedMethod.type,
  });
  // 서버 검증 후 완료
};
```

---

### PURCHASE-04: Purchase Complete

**경로:** `/purchase-complete`
**컴포넌트:** `PurchaseCompletePage.tsx`

#### UI 구성
```
┌─────────────────────────┐
│                         │
│                         │
│         ✅              │
│    결제가 완료되었습니다!   │
│                         │
│  ┌─────────────────────┐│
│  │ 루틴명: 아침 운동 루틴 ││
│  │ 기간: 4 WEEK         ││
│  │ 금액: ₩5,600         ││
│  │ 결제일: 2026.02.25   ││
│  └─────────────────────┘│
│                         │
│  [ 일정 선택하기 ]        │  ← Primary CTA
│                         │
│  HOME으로 돌아가기         │  ← Secondary
│                         │
└─────────────────────────┘
```

#### 컴포넌트 구조
```typescript
interface PurchaseCompleteProps {
  routineName: string;
  period: string;
  amount: number;
  purchaseDate: string;
}
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 일정 선택하기 | → CalendarView 또는 Schedule Select |
| HOME으로 돌아가기 | → StorePage (`/`) |

#### API
- `GET /api/purchases/:id` - 구매 상세 (확인용)

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 체크 아이콘 | `--accent-color`, 64x64, scale-up 애니메이션 |
| 구매 요약 카드 | 보더 1px, radius 12px, padding 20px |
| Primary CTA | `--accent-color` 배경, White 텍스트, 52px |
| Secondary | 텍스트 링크, `--text-secondary` |

#### 애니메이션
- 체크 아이콘: scale 0→1 (300ms, spring easing)
- 텍스트: fade-in (200ms delay)
- 카드: slide-up + fade-in (400ms delay)

---

## 4. StoreContext 확장 필요 사항

```typescript
// store-context.tsx 확장
interface StoreContextType {
  // 기존...
  selectedPeriod: PeriodOption | null;
  setSelectedPeriod: (option: PeriodOption) => void;
  selectedPaymentMethod: PaymentMethod | null;
  setSelectedPaymentMethod: (method: PaymentMethod) => void;
  purchaseRoutine: (routineId: string, period: PeriodOption, method: PaymentMethod) => Promise<PurchaseResult>;
  purchaseHistory: Purchase[];
}

interface Purchase {
  id: string;
  routineId: string;
  routineName: string;
  period: string;
  amount: number;
  paymentMethod: string;
  purchaseDate: string;
  status: 'completed' | 'refunded' | 'cancelled';
}
```

---

---

### PURCHASE-05: Checkout Start Date (시작일 선택)

**경로:** `/checkout/start-date`
**컴포넌트:** `CheckoutStartDatePage.tsx`
**상태:** EXISTS (2026-03-09 추가)

> 기존 결제 플로우(/cart → checkout() → /my-lists)에서 시작일 선택 단계를 삽입.
> /cart → /checkout/start-date → checkout(startDates) → /my-lists

#### 설계 방식: Plan C (기본값 오늘 + 개별 조정)
- 시작일 기본값은 **오늘**으로 자동 설정
- 사용자가 원하면 캘린더를 열어 개별 루틴의 시작일을 조정
- 복수 구매 시 "모든 루틴 같은 날짜로 시작" 스위치 제공 (기본 ON)

#### UI 구성
```
┌─────────────────────────┐
│  ← 시작일 선택            │
│  ━━━━━━━━━━━━━━━━━━━━━ │  ← Progress bar (100%)
│                         │
│  구매한 루틴의 시작일을     │
│  선택해주세요.             │
│  시작일부터 Day 1이       │
│  시작됩니다.              │
│                         │
│  ┌─────────────────────┐│  ← (복수 구매 시만 표시)
│  │ 📅 모든 루틴 같은     ││
│  │    날짜로 시작  [ON]  ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│  ← 루틴 카드 (반복)
│  │ [이미지] 루틴명       ││
│  │         카테고리 28일  ││
│  │ ─────────────────── ││
│  │ 시작일  2026년 3월 9일 ││  ← 녹색 강조
│  │ 종료일  2026년 4월 5일 ││
│  │                  📅  ││  ← 캘린더 아이콘 (토글)
│  │ ┌─────────────────┐ ││  ← (캘린더 펼침 시)
│  │ │  < 2026년 3월 >  │ ││
│  │ │ 일 월 화 수 목 금 토│ ││
│  │ │ ... ⬤9 10 11 ... │ ││  ← 시작일 녹색, 범위 연녹색
│  │ └─────────────────┘ ││
│  └─────────────────────┘│
│                         │
│  ┌─────────────────────┐│  ← 하단 고정 CTA
│  │  N개 루틴  [시작하기]  ││
│  │  ₩금액               ││
│  └─────────────────────┘│
└─────────────────────────┘
```

#### 상태 관리
```typescript
// 각 루틴별 시작일 (기본값: 오늘)
startDates: Record<string, Date>

// "모든 루틴 같은 날짜로 시작" 토글
sameDate: boolean  // 기본 true

// 현재 캘린더를 열고 있는 루틴 ID
activeRoutineId: string | null
```

#### 인터랙션
| 동작 | 결과 |
|------|------|
| 캘린더 영역 탭 | 해당 루틴의 캘린더 토글 (펼침/접기) |
| 날짜 선택 | 시작일 변경 + 종료일 자동 계산 (시작일 + durationDays - 1) |
| 과거 날짜 탭 | 선택 불가 (disabled, 연한 회색) |
| sameDate ON 상태에서 날짜 선택 | 모든 루틴에 같은 날짜 적용 |
| sameDate ON → OFF | 각 루틴 개별 조정 가능 |
| sameDate OFF → ON | 첫 번째 루틴의 날짜를 전체에 적용 |
| "시작하기" 버튼 탭 | checkout(dateMap) 호출 → 성공 시 /my-lists로 이동 |
| 카트가 비어있을 때 진입 | /cart로 리다이렉트 |
| 비로그인 상태로 진입 | /login?redirect=/cart로 리다이렉트 |

#### 캘린더 시각화
| 요소 | 스타일 |
|------|--------|
| 시작일 | `bg-success text-white font-bold` (녹색 원) |
| 종료일 | `bg-success/60 text-white` (연녹색 원) |
| 시작~종료 범위 | `bg-success/15` (연녹색 배경) |
| 오늘 표시 | 하단 작은 녹색 점 (시작일이 아닌 경우) |
| 과거 날짜 | `text-default-300 cursor-not-allowed` |

#### CartPage 변경 사항
```typescript
// 변경 전: checkout() 직접 호출
const handleCheckout = () => {
  checkout();
  navigate('/my-lists');
};

// 변경 후: /checkout/start-date로 이동
const handleCheckout = () => {
  if (!isLoggedIn) { /* 로그인 리다이렉트 */ }
  navigate("/checkout/start-date");
};
```

#### store-context 변경 사항
```typescript
// checkout 시그니처 변경
checkout: (startDates?: Record<string, string>) => Promise<void>;

// startDates가 전달되면 해당 날짜를, 없으면 현재 시간을 시작일로 사용
const itemStartDate = startDates?.[item.product.id]
  ? new Date(startDates[item.product.id])
  : new Date();
```

#### 디자인 스펙
| 요소 | 스펙 |
|------|------|
| 루틴 카드 | HeroUI Card shadow="sm", 이미지 64x64 rounded-xl |
| 날짜 표시 영역 | bg-default-50 rounded-xl p-3 |
| 캘린더 | Card border border-default-200, 7열 그리드, 셀 높이 36px |
| 하단 CTA 바 | fixed bottom-0, bg-background border-t shadow-lg |
| CTA 버튼 | HeroUI Button color="primary" size="lg", ShoppingBag 아이콘 |
| sameDate 스위치 | HeroUI Switch color="success" size="sm" |

---

## 5. 라우트 추가

```typescript
// routes.ts 에 추가
{ path: '/payment', element: <PaymentMethodPage /> },
{ path: '/purchase-complete', element: <PurchaseCompletePage /> },
{ path: 'checkout/start-date', Component: CheckoutStartDatePage },
```

## 6. 파일 목록 (현재 상태)

| 파일 | 설명 | 상태 |
|------|------|------|
| `src/app/components/PeriodSelectionSheet.tsx` | 기간 선택 Bottom Sheet | EXISTS |
| `src/app/components/PaymentMethodPage.tsx` | 결제 수단 선택 | EXISTS |
| `src/app/components/PurchaseCompletePage.tsx` | 구매 완료 | EXISTS |
| `src/app/components/ProductDetailPage.tsx` | 구매하기 버튼 + PeriodSheet 연결 | MODIFIED |
| `src/app/components/CheckoutStartDatePage.tsx` | 시작일 선택 (캘린더 UI) | EXISTS |
| `src/app/components/CartPage.tsx` | handleCheckout → /checkout/start-date 이동으로 변경 | MODIFIED |
| `src/app/store-context.tsx` | checkout(startDates?) 시그니처 변경 | MODIFIED |
