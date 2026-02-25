import { supabase } from '../supabase';
import type { Database, Purchase } from '../database.types';

// ============================================================================
// Types
// ============================================================================

type PurchaseRow = Database['public']['Tables']['purchases']['Row'];

export interface PurchaseWithRoutine extends PurchaseRow {
  routines: {
    id: string;
    title: string;
    image_url: string;
    category: string;
    color: string;
    duration_days: number;
    profiles: {
      nickname: string;
      avatar_url: string;
    } | null;
  } | null;
}

export interface CreatePurchaseInput {
  userId: string;
  routineId: string;
  periodId?: string;
  periodLabel: string;
  periodDays: number;
  amount: number;
  discount?: number;
  finalAmount: number;
  paymentMethod: Purchase['payment_method'];
  startDate: string;
}

// ============================================================================
// Queries
// ============================================================================

/** 구매 생성 */
export async function createPurchase(input: CreatePurchaseInput) {
  const endDate = new Date(input.startDate);
  endDate.setDate(endDate.getDate() + input.periodDays);

  const { data, error } = await supabase
    .from('purchases')
    .insert({
      user_id: input.userId,
      routine_id: input.routineId,
      period_id: input.periodId ?? null,
      period_label: input.periodLabel,
      period_days: input.periodDays,
      amount: input.amount,
      discount: input.discount ?? 0,
      final_amount: input.finalAmount,
      payment_method: input.paymentMethod,
      status: 'completed',
      purchased_at: new Date().toISOString(),
      start_date: input.startDate,
      end_date: endDate.toISOString(),
    })
    .select('id, user_id, routine_id, status, purchased_at, start_date, end_date')
    .single();

  if (error) throw error;
  return data;
}

/** 유저의 구매 목록 조회 */
export async function getUserPurchases(
  userId: string,
  options?: { status?: Purchase['status']; page?: number; limit?: number }
): Promise<{ data: PurchaseWithRoutine[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('purchases')
    .select(
      'id, user_id, routine_id, period_label, period_days, amount, discount, final_amount, payment_method, status, purchased_at, start_date, end_date, refunded_at, created_at, period_id, routines(id, title, image_url, category, color, duration_days, profiles!author_id(nickname, avatar_url))',
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data as unknown as PurchaseWithRoutine[]) ?? [],
    count: count ?? 0,
  };
}

/** 구매 단일 조회 */
export async function getPurchase(id: string): Promise<PurchaseWithRoutine> {
  const { data, error } = await supabase
    .from('purchases')
    .select(
      'id, user_id, routine_id, period_label, period_days, amount, discount, final_amount, payment_method, status, purchased_at, start_date, end_date, refunded_at, created_at, period_id, routines(id, title, image_url, category, color, duration_days, profiles!author_id(nickname, avatar_url))'
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as PurchaseWithRoutine;
}

/** 해당 루틴 이미 구매했는지 확인 */
export async function hasUserPurchasedRoutine(
  userId: string,
  routineId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from('purchases')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('routine_id', routineId)
    .in('status', ['completed', 'pending']);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/** 구매 환불 */
export async function refundPurchase(purchaseId: string) {
  const { data, error } = await supabase
    .from('purchases')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('id', purchaseId)
    .select('id, status, refunded_at')
    .single();

  if (error) throw error;
  return data;
}
