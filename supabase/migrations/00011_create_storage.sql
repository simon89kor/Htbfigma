-- ============================================================================
-- Migration 00011: Storage Buckets & Policies
-- HTB Project - Database Schema
-- ============================================================================
-- Supabase Storage 버킷 생성 및 접근 정책 정의
-- ============================================================================

-- ===========================================
-- 1. Storage 버킷 생성
-- ===========================================

-- 프로필 아바타 이미지
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 프로필 배경 이미지
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 게시물 이미지
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- 루틴 상품 이미지
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'routine-images',
  'routine-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- 배너 이미지
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'banners',
  'banners',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- ===========================================
-- 2. Storage RLS 정책
-- ===========================================

-- ─── avatars 버킷 정책 ───────────────────
-- 누구나 아바타 이미지 조회 가능 (public bucket)
CREATE POLICY "avatars_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- 인증된 유저는 자신의 폴더에 업로드 가능
CREATE POLICY "avatars_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 인증된 유저는 자신의 파일 업데이트 가능
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 인증된 유저는 자신의 파일 삭제 가능
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── covers 버킷 정책 ───────────────────
CREATE POLICY "covers_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

CREATE POLICY "covers_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "covers_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "covers_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'covers'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── post-images 버킷 정책 ───────────────
CREATE POLICY "post_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "post_images_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "post_images_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "post_images_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── routine-images 버킷 정책 ─────────────
CREATE POLICY "routine_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'routine-images');

-- Provider/Admin만 루틴 이미지 업로드
CREATE POLICY "routine_images_insert_provider"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'routine-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('provider', 'admin')
    )
  );

CREATE POLICY "routine_images_update_provider"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'routine-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('provider', 'admin')
    )
  );

CREATE POLICY "routine_images_delete_provider"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'routine-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('provider', 'admin')
    )
  );

-- ─── banners 버킷 정책 ───────────────────
CREATE POLICY "banners_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

-- Admin만 배너 이미지 관리
CREATE POLICY "banners_images_insert_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "banners_images_update_admin"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banners'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "banners_images_delete_admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banners'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
