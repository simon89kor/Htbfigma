import { supabase } from '../supabase';

// ============================================================================
// routine_likes API
// ============================================================================

/**
 * Check if the current user has liked a routine
 */
export async function isRoutineLiked(routineId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { count } = await supabase
    .from('routine_likes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('routine_id', routineId);

  return (count ?? 0) > 0;
}

/**
 * Toggle like on a routine (add if not liked, remove if liked)
 * Returns the new liked state
 */
export async function toggleRoutineLike(routineId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('로그인이 필요합니다');

  const liked = await isRoutineLiked(routineId);

  if (liked) {
    const { error } = await supabase
      .from('routine_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('routine_id', routineId);
    if (error) throw error;
    return false;
  } else {
    const { error } = await supabase
      .from('routine_likes')
      .insert({ user_id: user.id, routine_id: routineId });
    if (error) throw error;
    return true;
  }
}

/**
 * Get the total like count for a routine
 */
export async function getRoutineLikeCount(routineId: string): Promise<number> {
  const { count } = await supabase
    .from('routine_likes')
    .select('*', { count: 'exact', head: true })
    .eq('routine_id', routineId);

  return count ?? 0;
}
