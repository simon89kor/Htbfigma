// ============================================================================
// data.ts — DB 기반 마이그레이션 후, 타입과 상수만 re-export
// 실제 상품 데이터는 Supabase DB에서 API로 가져옵니다.
// ============================================================================

export type { DayPlan, TodoTemplate } from '@/lib/api/routine-adapter';
export { categories } from '@/lib/api/routine-adapter';
