import { supabase } from '../supabase';
import type {
  Database,
  UserRoutine,
  TodoItem as TodoItemRow,
  TodoSubItem,
} from '../database.types';

// ============================================================================
// Types
// ============================================================================

export interface UserRoutineWithItems extends UserRoutine {
  todo_items?: (TodoItemRow & {
    todo_sub_items?: TodoSubItem[];
  })[];
  routines?: {
    id: string;
    title: string;
    image_url: string;
    category: string;
    color: string;
    duration_days: number;
  } | null;
}

export interface CreateCustomRoutineInput {
  userId: string;
  title: string;
  description?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  dayPlans?: unknown;
}

export interface CreateTodoItemInput {
  userRoutineId: string;
  userId: string;
  text: string;
  day?: number;
  scheduledDate?: string;
  time?: string;
  repeatDays?: string[];
  priority?: TodoItemRow['priority'];
  notification?: TodoItemRow['notification'];
  sortOrder?: number;
}

// ============================================================================
// User Routines
// ============================================================================

/** 유저의 루틴 목록 조회 */
export async function getUserRoutines(
  userId: string,
  options?: {
    status?: UserRoutine['status'];
    isCustom?: boolean;
    page?: number;
    limit?: number;
  }
): Promise<{ data: UserRoutineWithItems[]; count: number }> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('user_routines')
    .select(
      'id, user_id, routine_id, purchase_id, title, description, category, start_date, end_date, status, is_custom, completion_rate, day_plans, created_at, updated_at, routines(id, title, image_url, category, color, duration_days), todo_items(id, user_routine_id, user_id, text, completed, day, scheduled_date, time, repeat_days, memo, priority, notification, sort_order, created_at, completed_at, updated_at, todo_sub_items(id, todo_item_id, text, completed, sort_order, created_at))',
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.isCustom !== undefined) {
    query = query.eq('is_custom', options.isCustom);
  }

  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: (data as unknown as UserRoutineWithItems[]) ?? [],
    count: count ?? 0,
  };
}

/** 유저 루틴 단일 조회 */
export async function getUserRoutine(id: string): Promise<UserRoutineWithItems> {
  const { data, error } = await supabase
    .from('user_routines')
    .select(
      'id, user_id, routine_id, purchase_id, title, description, category, start_date, end_date, status, is_custom, completion_rate, day_plans, created_at, updated_at, routines(id, title, image_url, category, color, duration_days), todo_items(id, user_routine_id, user_id, text, completed, day, scheduled_date, time, repeat_days, memo, priority, notification, sort_order, created_at, completed_at, updated_at, todo_sub_items(id, todo_item_id, text, completed, sort_order, created_at))'
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as unknown as UserRoutineWithItems;
}

/** 구매 후 유저 루틴 생성 */
export async function createUserRoutineFromPurchase(input: {
  userId: string;
  routineId: string;
  purchaseId: string;
  title: string;
  description?: string;
  category?: string;
  startDate: string;
  endDate: string;
  dayPlans?: unknown;
}) {
  const { data, error } = await supabase
    .from('user_routines')
    .insert({
      user_id: input.userId,
      routine_id: input.routineId,
      purchase_id: input.purchaseId,
      title: input.title,
      description: input.description ?? '',
      category: input.category ?? '',
      start_date: input.startDate,
      end_date: input.endDate,
      status: 'active',
      is_custom: false,
      day_plans: input.dayPlans as Database['public']['Tables']['user_routines']['Insert']['day_plans'],
    })
    .select('id, title, status, start_date, end_date')
    .single();

  if (error) throw error;
  return data;
}

/** 커스텀 루틴 생성 */
export async function createCustomRoutine(input: CreateCustomRoutineInput) {
  const { data, error } = await supabase
    .from('user_routines')
    .insert({
      user_id: input.userId,
      title: input.title,
      description: input.description ?? '',
      category: input.category ?? '',
      start_date: input.startDate ?? new Date().toISOString(),
      end_date: input.endDate ?? null,
      status: 'active',
      is_custom: true,
      day_plans: input.dayPlans as Database['public']['Tables']['user_routines']['Insert']['day_plans'],
    })
    .select('id, title, status, is_custom, start_date, end_date, created_at')
    .single();

  if (error) throw error;
  return data;
}

/** 유저 루틴 삭제 */
export async function deleteUserRoutine(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_routines')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/** 유저 루틴 상태 업데이트 */
export async function updateUserRoutineStatus(
  id: string,
  status: UserRoutine['status']
) {
  const { data, error } = await supabase
    .from('user_routines')
    .update({ status })
    .eq('id', id)
    .select('id, status')
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// Todo Items
// ============================================================================

/** 투두 아이템 생성 */
export async function createTodoItem(input: CreateTodoItemInput) {
  const { data, error } = await supabase
    .from('todo_items')
    .insert({
      user_routine_id: input.userRoutineId,
      user_id: input.userId,
      text: input.text,
      day: input.day ?? null,
      scheduled_date: input.scheduledDate ?? null,
      time: input.time ?? null,
      repeat_days: input.repeatDays ?? [],
      priority: input.priority ?? 'medium',
      notification: input.notification ?? 'none',
      sort_order: input.sortOrder ?? 0,
    })
    .select('id, text, completed, day, scheduled_date, time, sort_order, created_at')
    .single();

  if (error) throw error;
  return data;
}

/** 투두 아이템 여러 개 한번에 생성 */
export async function createTodoItemsBulk(
  items: CreateTodoItemInput[]
) {
  const insertData = items.map((input) => ({
    user_routine_id: input.userRoutineId,
    user_id: input.userId,
    text: input.text,
    day: input.day ?? null,
    scheduled_date: input.scheduledDate ?? null,
    time: input.time ?? null,
    repeat_days: input.repeatDays ?? [],
    priority: input.priority ?? 'medium',
    notification: input.notification ?? 'none',
    sort_order: input.sortOrder ?? 0,
  }));

  const { data, error } = await supabase
    .from('todo_items')
    .insert(insertData)
    .select('id, text, completed, day, sort_order');

  if (error) throw error;
  return data ?? [];
}

/** 투두 아이템 완료 토글 */
export async function toggleTodoItem(id: string, completed: boolean) {
  const { data, error } = await supabase
    .from('todo_items')
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', id)
    .select('id, completed, completed_at')
    .single();

  if (error) throw error;
  return data;
}

/** 투두 아이템 수정 */
export async function updateTodoItem(
  id: string,
  updates: {
    text?: string;
    day?: number | null;
    time?: string | null;
    repeatDays?: string[];
    memo?: string;
    priority?: TodoItemRow['priority'];
    notification?: TodoItemRow['notification'];
    sortOrder?: number;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (updates.text !== undefined) updateData.text = updates.text;
  if (updates.day !== undefined) updateData.day = updates.day;
  if (updates.time !== undefined) updateData.time = updates.time;
  if (updates.repeatDays !== undefined) updateData.repeat_days = updates.repeatDays;
  if (updates.memo !== undefined) updateData.memo = updates.memo;
  if (updates.priority !== undefined) updateData.priority = updates.priority;
  if (updates.notification !== undefined) updateData.notification = updates.notification;
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;

  const { data, error } = await supabase
    .from('todo_items')
    .update(updateData)
    .eq('id', id)
    .select('id, text, completed, day, time, sort_order, updated_at')
    .single();

  if (error) throw error;
  return data;
}

/** 투두 아이템 삭제 */
export async function deleteTodoItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('todo_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================================================
// Todo Sub Items
// ============================================================================

/** 서브 아이템 생성 */
export async function createTodoSubItem(input: {
  todoItemId: string;
  text: string;
  sortOrder?: number;
}) {
  const { data, error } = await supabase
    .from('todo_sub_items')
    .insert({
      todo_item_id: input.todoItemId,
      text: input.text,
      sort_order: input.sortOrder ?? 0,
    })
    .select('id, text, completed, sort_order, created_at')
    .single();

  if (error) throw error;
  return data;
}

/** 서브 아이템 완료 토글 */
export async function toggleTodoSubItem(id: string, completed: boolean) {
  const { data, error } = await supabase
    .from('todo_sub_items')
    .update({ completed })
    .eq('id', id)
    .select('id, completed')
    .single();

  if (error) throw error;
  return data;
}

/** 서브 아이템 삭제 */
export async function deleteTodoSubItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('todo_sub_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
