import { supabase } from '../supabase';
import type { Banner } from '../database.types';

// ============================================================================
// Queries
// ============================================================================

/** 활성 배너 목록 조회 */
export async function getActiveBanners(): Promise<Banner[]> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('banners')
    .select(
      'id, image_url, title, subtitle, link_type, link_target, sort_order, is_active, start_date, end_date, created_at, updated_at'
    )
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/** 배너 단일 조회 */
export async function getBanner(id: string): Promise<Banner> {
  const { data, error } = await supabase
    .from('banners')
    .select(
      'id, image_url, title, subtitle, link_type, link_target, sort_order, is_active, start_date, end_date, created_at, updated_at'
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/** 전체 배너 목록 (어드민용) */
export async function getAllBanners(): Promise<Banner[]> {
  const { data, error } = await supabase
    .from('banners')
    .select(
      'id, image_url, title, subtitle, link_type, link_target, sort_order, is_active, start_date, end_date, created_at, updated_at'
    )
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
