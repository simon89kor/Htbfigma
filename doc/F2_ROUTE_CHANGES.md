# F2 Purchase Flow - Route Changes

> 통합 머지 시 routes.ts에 반영해야 할 변경사항

## 추가된 Import

```typescript
import { PaymentMethodPage } from "./components/PaymentMethodPage";
import { PurchaseCompletePage } from "./components/PurchaseCompletePage";
```

## 추가된 라우트 (Layout children 내부)

```typescript
{ path: "payment", Component: PaymentMethodPage },
{ path: "purchase-complete", Component: PurchaseCompletePage },
```

## 위치

- `{ path: "*", Component: NotFoundPage }` 라인 **바로 위**에 삽입

## 신규 파일

| 파일 | 설명 |
|------|------|
| `src/app/components/PeriodSelectionSheet.tsx` | 기간 선택 Bottom Sheet (vaul) |
| `src/app/components/PaymentMethodPage.tsx` | 결제 수단 선택 페이지 |
| `src/app/components/PurchaseCompletePage.tsx` | 구매 완료 페이지 |

## 수정된 파일

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/components/ProductDetailPage.tsx` | "구매하기" 버튼 추가, PeriodSelectionSheet 연동 |
| `src/app/routes.ts` | /payment, /purchase-complete 라우트 추가 |
