# HTB Project - Database Schema (ERD)

> 작성일: 2026-02-25
> 작성자: B1 (Database Architect Agent)
> 총 테이블: 25개 + 5개 Storage 버킷

---

## 1. 테이블 관계 다이어그램

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          auth.users (Supabase)                          │
│                              id (uuid)                                  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │ 1:1
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                            profiles                                      │
│  id, nickname, bio, avatar_url, cover_image_url, email                   │
│  role, preferences, terms/privacy, notification settings                 │
│  current_streak, longest_streak, post/follower/following_count           │
│  status, created_at, updated_at                                          │
└────┬──────────┬──────────┬──────────┬──────────┬──────────┬─────────────┘
     │          │          │          │          │          │
     │ 1:N      │ N:M      │ 1:N      │ 1:N      │ 1:N      │ 1:N
     ▼          ▼          ▼          ▼          ▼          ▼
 routines    follows    purchases  posts    notifications  user_badges
     │                     │          │                        │
     │ 1:N                 │ 1:1      │ 1:N                    │
     ▼                     ▼          ▼                        ▼
 routine_     user_     post_likes              badges
 periods     routines   post_bookmarks
                │        comments ──► comment_likes
                │
                │ 1:N
                ▼
            todo_items
                │
                │ 1:N
                ▼
            todo_sub_items
```

### 상세 관계도

```
                    ┌─────────────┐
                    │ auth.users  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐          ┌──────────┐
                    │  profiles   │◄─────────│  follows  │
                    │             │──────────►│          │
                    └──┬───┬──┬──┘          └──────────┘
                       │   │  │
          ┌────────────┘   │  └───────────────────────┐
          │                │                          │
    ┌─────▼─────┐    ┌────▼────┐              ┌──────▼──────┐
    │ routines  │    │  posts  │              │notifications│
    └──┬──┬──┬──┘    └──┬──┬──┘              └─────────────┘
       │  │  │          │  │
       │  │  │    ┌─────┘  └─────┐
       │  │  │    │              │
       │  │  │  ┌─▼────┐  ┌─────▼────┐
       │  │  │  │post_  │  │ comments │
       │  │  │  │likes  │  └──┬───────┘
       │  │  │  └───────┘     │
       │  │  │  ┌───────┐  ┌──▼───────┐
       │  │  │  │post_  │  │comment_  │
       │  │  │  │book   │  │likes     │
       │  │  │  │marks  │  └──────────┘
       │  │  │  └───────┘
       │  │  │
       │  │  └──────────────────────┐
       │  │                         │
  ┌────▼──▼──┐  ┌──────────┐  ┌────▼────┐
  │routine_  │  │purchases │  │ reviews │
  │periods   │  └────┬─────┘  └─────────┘
  └──────────┘       │
                ┌────▼──────┐
                │user_      │
                │routines   │
                └────┬──────┘
                     │
                ┌────▼──────┐
                │todo_items │
                └────┬──────┘
                     │
                ┌────▼──────┐
                │todo_sub_  │
                │items      │
                └───────────┘

    ┌──────────┐     ┌──────────────────┐
    │ badges   │◄────│  user_badges     │
    └────┬─────┘     └──────────────────┘
         │
    ┌────▼──────────┐
    │challenge_     │
    │rewards        │
    └────┬──────────┘
         │
    ┌────▼──────┐     ┌──────────────────┐
    │challenges │◄────│challenge_        │
    └───────────┘     │participants      │
                      └──────────────────┘

    ┌──────────┐  ┌───────────────┐  ┌──────────┐
    │ banners  │  │search_keywords│  │ qr_codes │
    └──────────┘  └───────────────┘  └──────────┘
                  ┌───────────────┐
                  │user_search_   │
                  │history        │
                  └───────────────┘

    ┌──────────┐
    │ reports  │  (post/comment/user 대상, 다형적 관계)
    └──────────┘
```

---

## 2. 테이블 상세 설명

### 2.1 인증 & 유저

#### profiles
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | - | auth.users.id 참조 |
| nickname | text | '' | 닉네임 |
| bio | text | '' | 소개 한 줄 |
| avatar_url | text | '' | 프로필 이미지 URL |
| cover_image_url | text | '' | 배경 이미지 URL |
| email | text | '' | 이메일 |
| role | text | 'user' | 역할 (user/provider/admin) |
| preferences | jsonb | '[]' | 관심 카테고리 배열 |
| terms_agreed_at | timestamptz | null | 이용약관 동의 일시 |
| privacy_agreed_at | timestamptz | null | 개인정보 동의 일시 |
| marketing_agreed | boolean | false | 마케팅 수신 동의 |
| notification_schedule | boolean | true | 일정 알림 설정 |
| notification_community | boolean | true | 커뮤니티 알림 설정 |
| notification_marketing | boolean | false | 마케팅 알림 설정 |
| current_streak | integer | 0 | 현재 연속 달성일 |
| longest_streak | integer | 0 | 최장 연속 달성일 |
| last_active_date | date | null | 마지막 활동일 |
| post_count | integer | 0 | 게시물 수 (트리거 자동 관리) |
| follower_count | integer | 0 | 팔로워 수 (트리거 자동 관리) |
| following_count | integer | 0 | 팔로잉 수 (트리거 자동 관리) |
| total_completed_routines | integer | 0 | 총 완료 루틴 수 |
| status | text | 'active' | 계정 상태 (active/suspended/deleted) |
| deleted_at | timestamptz | null | soft delete 시점 |
| created_at | timestamptz | now() | 가입일 |
| updated_at | timestamptz | now() | 수정일 (트리거 자동) |

#### follows
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| follower_id | uuid (FK) | - | 팔로우 하는 유저 |
| following_id | uuid (FK) | - | 팔로우 당하는 유저 |
| created_at | timestamptz | now() | - |
| **UNIQUE** | (follower_id, following_id) | | 중복 팔로우 방지 |
| **CHECK** | follower_id <> following_id | | 자기 팔로우 방지 |

### 2.2 루틴 & 상품

#### routines
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| title | text | - | 루틴 제목 |
| description | text | '' | 짧은 설명 |
| long_description | text | '' | 상세 설명 |
| price | integer | 0 | 기본 가격 (원) |
| original_price | integer | null | 할인 전 가격 |
| image_url | text | '' | 상품 이미지 |
| category | text | '' | 카테고리 |
| tags | text[] | {} | 태그 배열 |
| author_id | uuid (FK) | - | Provider/Admin 프로필 |
| rating | numeric(2,1) | 0.0 | 평균 별점 (0~5, 트리거 자동) |
| review_count | integer | 0 | 리뷰 수 (트리거 자동) |
| purchase_count | integer | 0 | 구매 수 (트리거 자동) |
| duration_days | integer | 7 | 기본 기간 (일) |
| day_plans | jsonb | [] | 일별 계획 |
| features | text[] | {} | 특징 태그 |
| color | text | '#65D9AC' | 테마 색상 |
| status | text | 'draft' | 상태 (draft/published/archived) |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

#### routine_periods
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| routine_id | uuid (FK) | - | 소속 루틴 |
| label | text | - | "1 WEEK", "4 WEEK", "100 Days" |
| days | integer | - | 기간 일수 (7, 28, 100) |
| price | integer | - | 해당 기간 가격 |
| original_price | integer | null | 할인 전 가격 |
| sort_order | integer | 0 | 정렬 순서 |
| created_at | timestamptz | now() | - |

#### reviews
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| routine_id | uuid (FK) | - | 리뷰 대상 루틴 |
| user_id | uuid (FK) | - | 작성자 |
| rating | integer | - | 별점 (1~5) |
| content | text | '' | 리뷰 내용 |
| status | text | 'active' | 상태 |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |
| **UNIQUE** | (routine_id, user_id) | | 중복 리뷰 방지 |

### 2.3 구매 & 결제

#### purchases
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| user_id | uuid (FK) | - | 구매자 |
| routine_id | uuid (FK) | - | 구매 루틴 |
| period_id | uuid (FK) | null | 선택 기간 옵션 |
| period_label | text | '' | 기간 라벨 사본 |
| period_days | integer | 0 | 기간 일수 사본 |
| amount | integer | 0 | 상품 금액 |
| discount | integer | 0 | 할인 금액 |
| final_amount | integer | 0 | 최종 결제액 |
| payment_method | text | 'card' | 결제수단 |
| status | text | 'completed' | 상태 |
| purchased_at | timestamptz | now() | 결제 시점 |
| start_date | date | null | 루틴 시작일 |
| end_date | date | null | 루틴 종료일 |
| refunded_at | timestamptz | null | 환불 시점 |
| created_at | timestamptz | now() | - |

#### user_routines
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| user_id | uuid (FK) | - | 소유 유저 |
| routine_id | uuid (FK) | null | 원본 루틴 (구매 시) |
| purchase_id | uuid (FK) | null | 관련 구매 |
| title | text | '' | 루틴 제목 |
| description | text | '' | 설명 |
| category | text | '' | 카테고리 |
| start_date | date | null | 시작일 |
| end_date | date | null | 종료일 |
| status | text | 'active' | 상태 (active/completed/expired/paused) |
| is_custom | boolean | false | 직접 만든 루틴 여부 |
| completion_rate | numeric(5,2) | 0.00 | 완료율 (0~100) |
| day_plans | jsonb | [] | 커스텀 루틴 일별 계획 |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

#### todo_items
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| user_routine_id | uuid (FK) | - | 소속 유저 루틴 |
| user_id | uuid (FK) | - | 소유 유저 (RLS 조건용) |
| text | text | - | 할일 내용 |
| completed | boolean | false | 완료 여부 |
| day | integer | null | 루틴 기준 일차 |
| scheduled_date | date | null | 실제 예정 날짜 |
| time | text | null | 시간 ("08:00") |
| repeat_days | text[] | {} | 반복 요일 |
| memo | text | '' | 메모 |
| priority | text | 'medium' | 우선순위 (low/medium/high) |
| notification | text | 'none' | 알림 설정 |
| sort_order | integer | 0 | 정렬 순서 |
| created_at | timestamptz | now() | - |
| completed_at | timestamptz | null | 완료 시점 |
| updated_at | timestamptz | now() | - |

#### todo_sub_items
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| todo_item_id | uuid (FK) | - | 부모 투두 |
| text | text | - | 서브 아이템 내용 |
| completed | boolean | false | 완료 여부 |
| sort_order | integer | 0 | 정렬 순서 |
| created_at | timestamptz | now() | - |

### 2.4 커뮤니티

#### posts
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| author_id | uuid (FK) | - | 작성자 |
| title | text | '' | 게시물 제목 |
| content | text | '' | 본문 |
| images | text[] | {} | 이미지 URL 배열 (최대 10장) |
| hashtags | text[] | {} | 해시태그 배열 |
| category | text | 'mytobe' | 카테고리 |
| linked_routine_id | uuid (FK) | null | 연결 루틴 |
| like_count | integer | 0 | 좋아요 수 (트리거 자동) |
| comment_count | integer | 0 | 댓글 수 (트리거 자동) |
| bookmark_count | integer | 0 | 북마크 수 (트리거 자동) |
| status | text | 'active' | 상태 (active/hidden/deleted) |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

#### post_likes
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| post_id | uuid (FK) | - | 게시물 |
| user_id | uuid (FK) | - | 좋아요 유저 |
| created_at | timestamptz | now() | - |
| **UNIQUE** | (post_id, user_id) | | 중복 좋아요 방지 |

#### post_bookmarks
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| post_id | uuid (FK) | - | 게시물 |
| user_id | uuid (FK) | - | 북마크 유저 |
| created_at | timestamptz | now() | - |
| **UNIQUE** | (post_id, user_id) | | 중복 북마크 방지 |

#### comments
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| post_id | uuid (FK) | - | 소속 게시물 |
| author_id | uuid (FK) | - | 작성자 |
| parent_id | uuid (FK) | null | 대댓글 부모 (셀프 참조) |
| content | text | - | 댓글 내용 |
| like_count | integer | 0 | 좋아요 수 (트리거 자동) |
| status | text | 'active' | 상태 |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

#### comment_likes
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| comment_id | uuid (FK) | - | 댓글 |
| user_id | uuid (FK) | - | 좋아요 유저 |
| created_at | timestamptz | now() | - |
| **UNIQUE** | (comment_id, user_id) | | 중복 방지 |

#### reports
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| reporter_id | uuid (FK) | - | 신고자 |
| target_type | text | - | 대상 타입 (post/comment/user) |
| target_id | uuid | - | 대상 ID |
| reason | text | '' | 신고 사유 |
| description | text | '' | 상세 설명 |
| status | text | 'pending' | 처리 상태 |
| admin_note | text | '' | 관리자 메모 |
| resolved_at | timestamptz | null | 처리 시점 |
| created_at | timestamptz | now() | - |

### 2.5 보상 & 챌린지

#### badges
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| name | text | - | 뱃지 이름 |
| description | text | '' | 설명 |
| icon | text | '' | 이모지 또는 이미지 URL |
| category | text | 'routine' | 카테고리 |
| condition_type | text | 'count' | 획득 조건 타입 |
| condition_value | jsonb | {} | 획득 조건 상세 |
| sort_order | integer | 0 | 정렬 |
| is_active | boolean | true | 활성 여부 |
| created_at | timestamptz | now() | - |

#### user_badges
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| user_id | uuid (FK) | - | 유저 |
| badge_id | uuid (FK) | - | 뱃지 |
| unlocked_at | timestamptz | now() | 획득 시점 |
| **UNIQUE** | (user_id, badge_id) | | 중복 획득 방지 |

#### challenges
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| title | text | - | 챌린지 제목 |
| description | text | '' | 설명 |
| image_url | text | '' | 이미지 |
| category | text | '' | 카테고리 |
| start_date | timestamptz | - | 시작일 |
| end_date | timestamptz | - | 종료일 |
| rules | text[] | {} | 규칙 배열 |
| participant_count | integer | 0 | 참여자 수 (트리거 자동) |
| max_participants | integer | null | 최대 참여자 수 |
| status | text | 'upcoming' | 상태 |
| created_by | uuid (FK) | null | 생성자 (Admin) |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

#### challenge_participants
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| challenge_id | uuid (FK) | - | 챌린지 |
| user_id | uuid (FK) | - | 참여자 |
| progress | numeric(5,2) | 0.00 | 진행률 (0~100) |
| status | text | 'active' | 상태 |
| joined_at | timestamptz | now() | 참여 시점 |
| completed_at | timestamptz | null | 완료 시점 |
| **UNIQUE** | (challenge_id, user_id) | | 중복 참여 방지 |

#### challenge_rewards
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| challenge_id | uuid (FK) | - | 챌린지 |
| type | text | - | 보상 타입 (badge/coupon/point) |
| name | text | - | 보상 이름 |
| icon | text | '' | 아이콘 |
| description | text | '' | 설명 |
| badge_id | uuid (FK) | null | 뱃지 보상인 경우 참조 |
| sort_order | integer | 0 | 정렬 |
| created_at | timestamptz | now() | - |

### 2.6 알림

#### notifications
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| user_id | uuid (FK) | - | 수신 유저 |
| type | text | - | 카테고리 (schedule/community/purchase/system) |
| sub_type | text | '' | 세부 타입 (routine_reminder/like/comment 등) |
| title | text | '' | 알림 제목 |
| message | text | '' | 알림 메시지 |
| icon | text | '' | 아이콘 |
| is_read | boolean | false | 읽음 여부 |
| deep_link | text | '' | 클릭 시 이동 경로 |
| metadata | jsonb | {} | 추가 데이터 |
| created_at | timestamptz | now() | - |

### 2.7 기타

#### banners
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| image_url | text | - | 배너 이미지 |
| title | text | '' | 제목 |
| subtitle | text | '' | 부제 |
| link_type | text | 'routine' | 링크 타입 |
| link_target | text | '' | 링크 대상 |
| sort_order | integer | 0 | 정렬 |
| is_active | boolean | true | 활성 여부 |
| start_date | timestamptz | null | 노출 시작일 |
| end_date | timestamptz | null | 노출 종료일 |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

#### search_keywords
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| keyword | text (UNIQUE) | - | 검색 키워드 |
| count | integer | 1 | 검색 횟수 |
| is_trending | boolean | false | 트렌딩 여부 |
| updated_at | timestamptz | now() | - |

#### user_search_history
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| user_id | uuid (FK) | - | 유저 |
| keyword | text | - | 검색어 |
| searched_at | timestamptz | now() | 검색 시점 |

#### qr_codes
| 컬럼 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| id | uuid (PK) | gen_random_uuid() | - |
| user_id | uuid (FK) | - | 생성 유저 |
| routine_id | uuid (FK) | - | 대상 루틴 |
| code | text (UNIQUE) | - | 고유 QR 코드 |
| shared_count | integer | 0 | 공유 횟수 |
| is_active | boolean | true | 활성 여부 |
| created_at | timestamptz | now() | - |
| updated_at | timestamptz | now() | - |

---

## 3. RLS 정책 요약

| 테이블 | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| profiles | 모든 유저 | 본인만 (id=auth.uid()) | 본인만 | 불가 (soft delete) |
| follows | 모든 유저 | 본인이 팔로우 | - | 본인이 언팔로우 |
| routines | published + 본인 | provider/admin | 본인 작성분 | 본인/admin |
| routine_periods | 모든 유저 | 루틴 소유자 | 루틴 소유자 | 루틴 소유자 |
| reviews | active 상태 | 인증 유저 (본인) | 본인 | 본인 |
| purchases | 본인 + admin | 본인 | admin만 | - |
| user_routines | 본인 | 본인 | 본인 | 본인 |
| todo_items | 본인 | 본인 | 본인 | 본인 |
| todo_sub_items | 부모 투두 소유자 | 부모 투두 소유자 | 부모 투두 소유자 | 부모 투두 소유자 |
| posts | active + 본인 + admin | 인증 유저 (author) | 본인 + admin | 본인 + admin |
| post_likes | 모든 유저 | 본인 | - | 본인 |
| post_bookmarks | 본인 | 본인 | - | 본인 |
| comments | active + 본인 | 인증 유저 (author) | 본인 | 본인 + admin |
| comment_likes | 모든 유저 | 본인 | - | 본인 |
| reports | 본인 + admin | 인증 유저 | admin | - |
| badges | 모든 유저 | admin | admin | - |
| user_badges | 모든 유저 | 본인 (시스템) | - | - |
| challenges | 모든 유저 | admin | admin | - |
| challenge_participants | 모든 유저 | 본인 | 본인 | - |
| challenge_rewards | 모든 유저 | admin | - | - |
| notifications | 본인 | 본인 | 본인 (읽음) | 본인 |
| banners | active + admin | admin | admin | admin |
| search_keywords | 모든 유저 | 인증 유저 | 인증 유저 | - |
| user_search_history | 본인 | 본인 | - | 본인 |
| qr_codes | 모든 유저 | 본인 | 본인 | 본인 |

---

## 4. 트리거 요약

| 트리거 | 테이블 | 이벤트 | 동작 |
|--------|--------|--------|------|
| on_auth_user_created | auth.users | INSERT | profiles 자동 생성 (SECURITY DEFINER) |
| profiles_updated_at | profiles | UPDATE | updated_at 자동 갱신 |
| routines_updated_at | routines | UPDATE | updated_at 자동 갱신 |
| reviews_updated_at | reviews | UPDATE | updated_at 자동 갱신 |
| user_routines_updated_at | user_routines | UPDATE | updated_at 자동 갱신 |
| todo_items_updated_at | todo_items | UPDATE | updated_at 자동 갱신 |
| posts_updated_at | posts | UPDATE | updated_at 자동 갱신 |
| comments_updated_at | comments | UPDATE | updated_at 자동 갱신 |
| challenges_updated_at | challenges | UPDATE | updated_at 자동 갱신 |
| banners_updated_at | banners | UPDATE | updated_at 자동 갱신 |
| qr_codes_updated_at | qr_codes | UPDATE | updated_at 자동 갱신 |
| on_post_like_change | post_likes | INSERT/DELETE | posts.like_count 증감 |
| on_post_bookmark_change | post_bookmarks | INSERT/DELETE | posts.bookmark_count 증감 |
| on_comment_change | comments | INSERT/DELETE | posts.comment_count 증감 |
| on_comment_like_change | comment_likes | INSERT/DELETE | comments.like_count 증감 |
| on_follow_change | follows | INSERT/DELETE | profiles.follower/following_count 증감 |
| on_post_count_change | posts | INSERT/DELETE | profiles.post_count 증감 |
| on_challenge_participant_change | challenge_participants | INSERT/DELETE | challenges.participant_count 증감 |
| on_review_change | reviews | INSERT/UPDATE/DELETE | routines.rating, review_count 재계산 |
| on_purchase_completed | purchases | INSERT/UPDATE | routines.purchase_count 증가 |
| on_todo_completion_change | todo_items | UPDATE (completed) | user_routines.completion_rate 재계산 |
| on_routine_completed | user_routines | UPDATE (status) | profiles.total_completed_routines 증가 |

---

## 5. RPC 함수 요약

| 함수 | 파라미터 | 반환 | 용도 | 마이그레이션 |
|------|---------|------|------|-------------|
| upsert_search_keyword | search_keyword text | void | 인기 검색어 카운트 업서트 | 00009 |
| get_user_stats | target_user_id uuid, period text | jsonb | 유저 통계 (완료율 등) | 00009 |
| get_ranking | ranking_period, ranking_category, result_limit | TABLE | 랭킹 조회 | 00009 |
| get_admin_dashboard_stats | - | jsonb | 어드민 대시보드 KPI | 00009 |
| log_search_keyword | search_keyword text | void | 인기 검색어 카운트 + 유저 검색 기록 동시 저장 | 00012 |
| get_trending_keywords | result_limit integer (기본 10) | TABLE(keyword, search_count) | 최근 7일간 인기 검색어 조회 | 00012 |
| get_user_routine_progress | target_user_routine_id uuid | jsonb | 특정 user_routine의 상세 진행률 (전체/오늘) | 00012 |
| calculate_streak | target_user_id uuid | jsonb | 유저 스트릭 계산 및 프로필 업데이트 | 00012 |
| check_purchase_exists | _user_id, _routine_id, _period_id (uuid) | boolean | 동일 루틴/기간 구매 중복 여부 (멱등성) | 00012 |
| expire_overdue_routines | - | integer | 만료일 지난 활성 루틴 expired 처리 (cron용) | 00012 |
| update_user_routine_completion_rate | - (트리거 함수) | trigger | todo 완료 시 user_routines.completion_rate 자동 계산 | 00012 |
| update_total_completed_routines | - (트리거 함수) | trigger | user_routine 완료 시 profiles.total_completed_routines 증가 | 00012 |

---

## 6. 인덱스 전략 요약

### 원칙
1. **FK 컬럼**: 모든 FK에 인덱스 (JOIN 성능)
2. **상태 필터**: status 컬럼에 인덱스 (WHERE 조건)
3. **시간순 정렬**: created_at DESC 인덱스 (목록 조회)
4. **복합 인덱스**: 자주 함께 사용되는 조건 (user_id + status, status + created_at 등)
5. **GIN 인덱스**: 배열(text[]) 및 전문 검색용 (tags, hashtags, title)
6. **부분 인덱스**: NULL이 아닌 경우만 인덱스 (linked_routine_id, parent_id)

### 주요 인덱스 (총 70+ 개)
- profiles: role, status, nickname, created_at
- routines: author_id, category, status, rating(DESC), title(GIN 전문검색), tags(GIN)
- posts: author_id, status+category, status+created_at, hashtags(GIN)
- todo_items: user_id+scheduled_date (캘린더 조회에 핵심)
- notifications: user_id+is_read, user_id+created_at(DESC)
- purchases: user_id+status, purchased_at(DESC)

---

## 7. Storage 버킷

| 버킷 | 용도 | 공개 | 크기 제한 | 허용 타입 | 접근 권한 |
|------|------|------|----------|----------|----------|
| avatars | 프로필 아바타 | public | 5MB | jpeg, png, webp, gif | 본인 폴더만 업로드/수정/삭제 |
| covers | 프로필 배경 | public | 10MB | jpeg, png, webp | 본인 폴더만 |
| post-images | 게시물 이미지 | public | 10MB | jpeg, png, webp, gif | 본인 폴더만 |
| routine-images | 루틴 상품 이미지 | public | 10MB | jpeg, png, webp | provider/admin만 |
| banners | 배너 이미지 | public | 10MB | jpeg, png, webp | admin만 |

### 파일 경로 규칙
```
{bucket}/{user_id}/{filename}
예: avatars/550e8400-e29b-41d4-a716-446655440000/avatar.jpg
    post-images/550e8400-e29b-41d4-a716-446655440000/photo1.webp
```

---

## 8. 기획서-테이블 매핑

| 기획서 | 사용 테이블 |
|--------|-----------|
| 01 Onboarding | profiles (가입, 약관동의, 관심 카테고리) |
| 02 Home Ext | routines, routine_periods, banners, search_keywords, user_search_history |
| 03 Purchase | purchases, user_routines, routine_periods |
| 04 Community | posts, post_likes, post_bookmarks, comments, comment_likes, reports |
| 05 Board Ext | user_routines, todo_items, todo_sub_items |
| 06 Reward | badges, user_badges, challenges, challenge_participants, challenge_rewards |
| 07 My Page | profiles, follows, user_routines, purchases, qr_codes |
| 08 Notification | notifications |
| 09 Admin | 모든 테이블 (관리자 뷰), reports |

---

## 9. FK 관계 참조 테이블

| 테이블 | FK 컬럼 | 참조 테이블 | ON DELETE |
|--------|---------|-----------|-----------|
| profiles | id | auth.users(id) | CASCADE |
| follows | follower_id | profiles(id) | CASCADE |
| follows | following_id | profiles(id) | CASCADE |
| routines | author_id | profiles(id) | RESTRICT |
| routine_periods | routine_id | routines(id) | CASCADE |
| reviews | routine_id | routines(id) | CASCADE |
| reviews | user_id | profiles(id) | CASCADE |
| purchases | user_id | profiles(id) | RESTRICT |
| purchases | routine_id | routines(id) | RESTRICT |
| purchases | period_id | routine_periods(id) | SET NULL |
| user_routines | user_id | profiles(id) | CASCADE |
| user_routines | routine_id | routines(id) | SET NULL |
| user_routines | purchase_id | purchases(id) | SET NULL |
| todo_items | user_routine_id | user_routines(id) | CASCADE |
| todo_items | user_id | profiles(id) | CASCADE |
| todo_sub_items | todo_item_id | todo_items(id) | CASCADE |
| posts | author_id | profiles(id) | CASCADE |
| posts | linked_routine_id | routines(id) | SET NULL |
| post_likes | post_id | posts(id) | CASCADE |
| post_likes | user_id | profiles(id) | CASCADE |
| post_bookmarks | post_id | posts(id) | CASCADE |
| post_bookmarks | user_id | profiles(id) | CASCADE |
| comments | post_id | posts(id) | CASCADE |
| comments | author_id | profiles(id) | CASCADE |
| comments | parent_id | comments(id) | CASCADE (셀프 참조) |
| comment_likes | comment_id | comments(id) | CASCADE |
| comment_likes | user_id | profiles(id) | CASCADE |
| reports | reporter_id | profiles(id) | CASCADE |
| badges | - | - | - (독립 테이블) |
| user_badges | user_id | profiles(id) | CASCADE |
| user_badges | badge_id | badges(id) | CASCADE |
| challenges | created_by | profiles(id) | SET NULL |
| challenge_participants | challenge_id | challenges(id) | CASCADE |
| challenge_participants | user_id | profiles(id) | CASCADE |
| challenge_rewards | challenge_id | challenges(id) | CASCADE |
| challenge_rewards | badge_id | badges(id) | SET NULL |
| notifications | user_id | profiles(id) | CASCADE |
| user_search_history | user_id | profiles(id) | CASCADE |
| qr_codes | user_id | profiles(id) | CASCADE |
| qr_codes | routine_id | routines(id) | CASCADE |

---

## 10. 마이그레이션 파일 인덱스

| 파일 | 내용 | 생성 테이블/객체 |
|------|------|----------------|
| 00001_create_profiles.sql | 프로필 & 팔로우 | profiles, follows |
| 00002_create_routines.sql | 루틴 상품 | routines, routine_periods, reviews |
| 00003_create_purchases.sql | 구매 & 투두 | purchases, user_routines, todo_items, todo_sub_items |
| 00004_create_community.sql | 커뮤니티 | posts, post_likes, post_bookmarks, comments, comment_likes, reports |
| 00005_create_rewards.sql | 보상 & 챌린지 | badges, user_badges, challenges, challenge_participants, challenge_rewards |
| 00006_create_notifications.sql | 알림 | notifications |
| 00007_create_banners_search.sql | 배너, 검색, QR | banners, search_keywords, user_search_history, qr_codes |
| 00008_create_rls_policies.sql | RLS 정책 | 전 테이블 RLS 정책 (25개 테이블) |
| 00009_create_triggers.sql | 트리거 & 기본 RPC | 트리거 13개 + RPC 4개 (handle_new_user, update_updated_at 등) |
| 00010_create_indexes.sql | 인덱스 | 전 테이블 인덱스 (70+ 개) |
| 00011_create_storage.sql | Storage | 5개 버킷 + Storage RLS 정책 |
| 00012_create_rpc_functions.sql | 추가 RPC & 트리거 (B3) | RPC 6개 + 트리거 2개 (log_search_keyword, calculate_streak 등) |

---

## 11. SECURITY DEFINER 함수 목록

> 주의: SECURITY DEFINER 함수는 함수 소유자 권한으로 실행되므로 `search_path` 설정이 권장됩니다.

| 함수명 | SET search_path | 비고 |
|--------|----------------|------|
| handle_new_user() | public | 00009 정의 |
| update_post_like_count() | 미설정 | 00009 정의 - 향후 추가 권장 |
| update_post_bookmark_count() | 미설정 | 00009 정의 - 향후 추가 권장 |
| update_post_comment_count() | 미설정 | 00009 정의 - 향후 추가 권장 |
| update_comment_like_count() | 미설정 | 00009 정의 - 향후 추가 권장 |
| update_follow_counts() | 미설정 | 00009 정의 - 향후 추가 권장 |
| update_profile_post_count() | 미설정 | 00009 정의 - 향후 추가 권장 |
| update_challenge_participant_count() | 미설정 | 00009 정의 - 향후 추가 권장 |
| update_routine_rating() | 미설정 | 00009 정의 - 향후 추가 권장 |
| update_routine_purchase_count() | 미설정 | 00009 정의 - 향후 추가 권장 |
| upsert_search_keyword() | 미설정 | 00009 정의 - 향후 추가 권장 |
| get_user_stats() | 미설정 | 00009 정의 - 향후 추가 권장 |
| get_ranking() | 미설정 | 00009 정의 - 향후 추가 권장 |
| get_admin_dashboard_stats() | 미설정 | 00009 정의 - 향후 추가 권장 |
| log_search_keyword() | public | 00012 정의 |
| get_trending_keywords() | public | 00012 정의 |
| get_user_routine_progress() | public | 00012 정의 |
| calculate_streak() | public | 00012 정의 |
| check_purchase_exists() | public | 00012 정의 |
| expire_overdue_routines() | public | 00012 정의 |
| update_user_routine_completion_rate() | public | 00012 정의 |
| update_total_completed_routines() | public | 00012 정의 |
