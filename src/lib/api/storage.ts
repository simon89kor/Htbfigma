import { supabase } from '../supabase';

// ============================================================================
// Types
// ============================================================================

type StorageBucket = 'avatars' | 'covers' | 'post-images' | 'routine-images' | 'banners';

interface UploadOptions {
  /** 저장할 버킷 */
  bucket: StorageBucket;
  /** 파일 경로 (버킷 내 상대 경로) */
  path: string;
  /** 업로드할 파일 */
  file: File;
  /** 기존 파일 URL (교체 시 삭제용) */
  previousUrl?: string;
}

interface UploadResult {
  /** 공개 URL */
  publicUrl: string;
  /** 저장 경로 */
  path: string;
}

// ============================================================================
// Helpers
// ============================================================================

/** 파일 확장자 추출 */
function getFileExtension(file: File): string {
  const parts = file.name.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : 'png';
}

/** 고유 파일명 생성 */
function generateFileName(userId: string, file: File, prefix?: string): string {
  const ext = getFileExtension(file);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const prefixStr = prefix ? `${prefix}-` : '';
  return `${userId}/${prefixStr}${timestamp}-${random}.${ext}`;
}

/** Storage URL에서 경로 추출 */
function extractPathFromUrl(url: string, bucket: StorageBucket): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

// ============================================================================
// Upload Functions
// ============================================================================

/** 범용 파일 업로드 */
async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  // 기존 파일 삭제 (교체 시)
  if (options.previousUrl) {
    const prevPath = extractPathFromUrl(options.previousUrl, options.bucket);
    if (prevPath) {
      await supabase.storage.from(options.bucket).remove([prevPath]);
    }
  }

  const { error } = await supabase.storage
    .from(options.bucket)
    .upload(options.path, options.file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(options.bucket)
    .getPublicUrl(options.path);

  return {
    publicUrl: urlData.publicUrl,
    path: options.path,
  };
}

/** 아바타 이미지 업로드 */
export async function uploadAvatar(
  userId: string,
  file: File,
  previousUrl?: string
): Promise<UploadResult> {
  const path = generateFileName(userId, file, 'avatar');
  return uploadFile({
    bucket: 'avatars',
    path,
    file,
    previousUrl,
  });
}

/** 게시물 이미지 업로드 */
export async function uploadPostImage(
  userId: string,
  file: File
): Promise<UploadResult> {
  const path = generateFileName(userId, file, 'post');
  return uploadFile({
    bucket: 'post-images',
    path,
    file,
  });
}

/** 게시물 이미지 여러 장 업로드 */
export async function uploadPostImages(
  userId: string,
  files: File[]
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file) => uploadPostImage(userId, file))
  );
  return results;
}

/** 루틴 이미지 업로드 */
export async function uploadRoutineImage(
  userId: string,
  file: File,
  previousUrl?: string
): Promise<UploadResult> {
  const path = generateFileName(userId, file, 'routine');
  return uploadFile({
    bucket: 'routine-images',
    path,
    file,
    previousUrl,
  });
}

/** 커버 이미지 업로드 */
export async function uploadCoverImage(
  userId: string,
  file: File,
  previousUrl?: string
): Promise<UploadResult> {
  const path = generateFileName(userId, file, 'cover');
  return uploadFile({
    bucket: 'covers',
    path,
    file,
    previousUrl,
  });
}

/** 이미지 삭제 */
export async function deleteImage(
  bucket: StorageBucket,
  url: string
): Promise<void> {
  const path = extractPathFromUrl(url, bucket);
  if (!path) return;

  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/** 여러 이미지 삭제 */
export async function deleteImages(
  bucket: StorageBucket,
  urls: string[]
): Promise<void> {
  const paths = urls
    .map((url) => extractPathFromUrl(url, bucket))
    .filter((p): p is string => p !== null);

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(bucket).remove(paths);
  if (error) throw error;
}
