import type { RoutineWithAuthor } from './routines';

// ============================================================================
// Types (기존 data.ts에서 이관)
// ============================================================================

export interface DayPlan {
  day: number;
  title: string;
  items: string[];
}

export interface TodoTemplate {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  color: string;
  durationDays: number;
  tags: string[];
  author?: string;
  authorSubtitle?: string;
  authorId?: string;
  dayPlans: DayPlan[];
  features: string[];
}

// ============================================================================
// Constants
// ============================================================================

export const categories = [
  '전체',
  '운동',
  '라이프스타일',
  '교육',
  '비즈니스',
  '여행',
  '건강',
  '자기개발',
  '생산성',
];

// ============================================================================
// Adapter
// ============================================================================

/** DB RoutineWithAuthor → 프런트엔드 TodoTemplate 변환 */
export function routineToTodoTemplate(r: RoutineWithAuthor): TodoTemplate {
  return {
    id: r.id,
    name: r.title,
    description: r.description,
    longDescription: r.long_description ?? r.description,
    price: r.price,
    originalPrice: r.original_price ?? undefined,
    image: r.image_url,
    category: r.category,
    rating: Number(r.rating),
    reviews: r.review_count,
    color: r.color,
    durationDays: r.duration_days,
    tags: r.tags ?? [],
    author: r.profiles?.nickname,
    authorSubtitle: r.profiles?.bio ?? '',
    authorId: r.author_id,
    dayPlans: Array.isArray(r.day_plans) ? (r.day_plans as DayPlan[]) : [],
    features: r.features ?? [],
  };
}
