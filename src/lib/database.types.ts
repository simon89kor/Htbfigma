export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          nickname: string
          bio: string
          avatar_url: string
          cover_image_url: string
          email: string
          role: 'user' | 'provider' | 'admin'
          preferences: Json
          terms_agreed_at: string | null
          privacy_agreed_at: string | null
          marketing_agreed: boolean
          notification_schedule: boolean
          notification_community: boolean
          notification_marketing: boolean
          current_streak: number
          longest_streak: number
          last_active_date: string | null
          post_count: number
          follower_count: number
          following_count: number
          total_completed_routines: number
          status: 'active' | 'suspended' | 'deleted'
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string
          bio?: string
          avatar_url?: string
          cover_image_url?: string
          email?: string
          role?: 'user' | 'provider' | 'admin'
          preferences?: Json
          terms_agreed_at?: string | null
          privacy_agreed_at?: string | null
          marketing_agreed?: boolean
          notification_schedule?: boolean
          notification_community?: boolean
          notification_marketing?: boolean
          current_streak?: number
          longest_streak?: number
          last_active_date?: string | null
          post_count?: number
          follower_count?: number
          following_count?: number
          total_completed_routines?: number
          status?: 'active' | 'suspended' | 'deleted'
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string
          bio?: string
          avatar_url?: string
          cover_image_url?: string
          email?: string
          role?: 'user' | 'provider' | 'admin'
          preferences?: Json
          terms_agreed_at?: string | null
          privacy_agreed_at?: string | null
          marketing_agreed?: boolean
          notification_schedule?: boolean
          notification_community?: boolean
          notification_marketing?: boolean
          current_streak?: number
          longest_streak?: number
          last_active_date?: string | null
          post_count?: number
          follower_count?: number
          following_count?: number
          total_completed_routines?: number
          status?: 'active' | 'suspended' | 'deleted'
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      follows: {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      routines: {
        Row: {
          id: string
          title: string
          description: string
          long_description: string
          price: number
          original_price: number | null
          image_url: string
          category: string
          tags: string[]
          author_id: string
          rating: number
          review_count: number
          purchase_count: number
          duration_days: number
          day_plans: Json
          features: string[]
          color: string
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          long_description?: string
          price?: number
          original_price?: number | null
          image_url?: string
          category?: string
          tags?: string[]
          author_id: string
          rating?: number
          review_count?: number
          purchase_count?: number
          duration_days?: number
          day_plans?: Json
          features?: string[]
          color?: string
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          long_description?: string
          price?: number
          original_price?: number | null
          image_url?: string
          category?: string
          tags?: string[]
          author_id?: string
          rating?: number
          review_count?: number
          purchase_count?: number
          duration_days?: number
          day_plans?: Json
          features?: string[]
          color?: string
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routines_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      routine_periods: {
        Row: {
          id: string
          routine_id: string
          label: string
          days: number
          price: number
          original_price: number | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          label: string
          days: number
          price: number
          original_price?: number | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          routine_id?: string
          label?: string
          days?: number
          price?: number
          original_price?: number | null
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_periods_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          routine_id: string
          user_id: string
          rating: number
          content: string
          status: 'active' | 'hidden' | 'deleted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          user_id: string
          rating: number
          content?: string
          status?: 'active' | 'hidden' | 'deleted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          routine_id?: string
          user_id?: string
          rating?: number
          content?: string
          status?: 'active' | 'hidden' | 'deleted'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          routine_id: string
          period_id: string | null
          period_label: string
          period_days: number
          amount: number
          discount: number
          final_amount: number
          payment_method: 'card' | 'kakao' | 'toss' | 'naver' | 'free'
          status: 'pending' | 'completed' | 'refunded' | 'cancelled'
          purchased_at: string
          start_date: string | null
          end_date: string | null
          refunded_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          routine_id: string
          period_id?: string | null
          period_label?: string
          period_days?: number
          amount?: number
          discount?: number
          final_amount?: number
          payment_method?: 'card' | 'kakao' | 'toss' | 'naver' | 'free'
          status?: 'pending' | 'completed' | 'refunded' | 'cancelled'
          purchased_at?: string
          start_date?: string | null
          end_date?: string | null
          refunded_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          routine_id?: string
          period_id?: string | null
          period_label?: string
          period_days?: number
          amount?: number
          discount?: number
          final_amount?: number
          payment_method?: 'card' | 'kakao' | 'toss' | 'naver' | 'free'
          status?: 'pending' | 'completed' | 'refunded' | 'cancelled'
          purchased_at?: string
          start_date?: string | null
          end_date?: string | null
          refunded_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "routine_periods"
            referencedColumns: ["id"]
          }
        ]
      }
      user_routines: {
        Row: {
          id: string
          user_id: string
          routine_id: string | null
          purchase_id: string | null
          title: string
          description: string
          category: string
          start_date: string | null
          end_date: string | null
          status: 'active' | 'completed' | 'expired' | 'paused'
          is_custom: boolean
          completion_rate: number
          day_plans: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          routine_id?: string | null
          purchase_id?: string | null
          title?: string
          description?: string
          category?: string
          start_date?: string | null
          end_date?: string | null
          status?: 'active' | 'completed' | 'expired' | 'paused'
          is_custom?: boolean
          completion_rate?: number
          day_plans?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          routine_id?: string | null
          purchase_id?: string | null
          title?: string
          description?: string
          category?: string
          start_date?: string | null
          end_date?: string | null
          status?: 'active' | 'completed' | 'expired' | 'paused'
          is_custom?: boolean
          completion_rate?: number
          day_plans?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_routines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_routines_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_routines_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          }
        ]
      }
      todo_items: {
        Row: {
          id: string
          user_routine_id: string
          user_id: string
          text: string
          completed: boolean
          day: number | null
          scheduled_date: string | null
          time: string | null
          repeat_days: string[]
          memo: string
          priority: 'low' | 'medium' | 'high'
          notification: 'none' | 'ontime' | '10min' | '30min'
          sort_order: number
          created_at: string
          completed_at: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          user_routine_id: string
          user_id: string
          text: string
          completed?: boolean
          day?: number | null
          scheduled_date?: string | null
          time?: string | null
          repeat_days?: string[]
          memo?: string
          priority?: 'low' | 'medium' | 'high'
          notification?: 'none' | 'ontime' | '10min' | '30min'
          sort_order?: number
          created_at?: string
          completed_at?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          user_routine_id?: string
          user_id?: string
          text?: string
          completed?: boolean
          day?: number | null
          scheduled_date?: string | null
          time?: string | null
          repeat_days?: string[]
          memo?: string
          priority?: 'low' | 'medium' | 'high'
          notification?: 'none' | 'ontime' | '10min' | '30min'
          sort_order?: number
          created_at?: string
          completed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_items_user_routine_id_fkey"
            columns: ["user_routine_id"]
            isOneToOne: false
            referencedRelation: "user_routines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todo_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      todo_sub_items: {
        Row: {
          id: string
          todo_item_id: string
          text: string
          completed: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          todo_item_id: string
          text: string
          completed?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          todo_item_id?: string
          text?: string
          completed?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "todo_sub_items_todo_item_id_fkey"
            columns: ["todo_item_id"]
            isOneToOne: false
            referencedRelation: "todo_items"
            referencedColumns: ["id"]
          }
        ]
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          images: string[]
          hashtags: string[]
          category: 'mytobe' | 'now' | 'gratitude' | 'diet' | 'exercise' | 'selfdev' | 'general'
          linked_routine_id: string | null
          like_count: number
          comment_count: number
          bookmark_count: number
          status: 'active' | 'hidden' | 'deleted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title?: string
          content?: string
          images?: string[]
          hashtags?: string[]
          category?: 'mytobe' | 'now' | 'gratitude' | 'diet' | 'exercise' | 'selfdev' | 'general'
          linked_routine_id?: string | null
          like_count?: number
          comment_count?: number
          bookmark_count?: number
          status?: 'active' | 'hidden' | 'deleted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: string
          images?: string[]
          hashtags?: string[]
          category?: 'mytobe' | 'now' | 'gratitude' | 'diet' | 'exercise' | 'selfdev' | 'general'
          linked_routine_id?: string | null
          like_count?: number
          comment_count?: number
          bookmark_count?: number
          status?: 'active' | 'hidden' | 'deleted'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_linked_routine_id_fkey"
            columns: ["linked_routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      post_bookmarks: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          parent_id: string | null
          content: string
          like_count: number
          status: 'active' | 'hidden' | 'deleted'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          parent_id?: string | null
          content: string
          like_count?: number
          status?: 'active' | 'hidden' | 'deleted'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          parent_id?: string | null
          content?: string
          like_count?: number
          status?: 'active' | 'hidden' | 'deleted'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      comment_likes: {
        Row: {
          id: string
          comment_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          comment_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          comment_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          target_type: 'post' | 'comment' | 'user'
          target_id: string
          reason: string
          description: string
          status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_note: string
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_type: 'post' | 'comment' | 'user'
          target_id: string
          reason?: string
          description?: string
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_note?: string
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          target_type?: 'post' | 'comment' | 'user'
          target_id?: string
          reason?: string
          description?: string
          status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
          admin_note?: string
          resolved_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      badges: {
        Row: {
          id: string
          name: string
          description: string
          icon: string
          category: 'routine' | 'streak' | 'community' | 'challenge' | 'special'
          condition_type: string
          condition_value: Json
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          icon?: string
          category?: 'routine' | 'streak' | 'community' | 'challenge' | 'special'
          condition_type?: string
          condition_value?: Json
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          icon?: string
          category?: 'routine' | 'streak' | 'community' | 'challenge' | 'special'
          condition_type?: string
          condition_value?: Json
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          }
        ]
      }
      challenges: {
        Row: {
          id: string
          title: string
          description: string
          image_url: string
          category: string
          start_date: string
          end_date: string
          rules: string[]
          participant_count: number
          max_participants: number | null
          status: 'upcoming' | 'active' | 'completed' | 'cancelled'
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          image_url?: string
          category?: string
          start_date: string
          end_date: string
          rules?: string[]
          participant_count?: number
          max_participants?: number | null
          status?: 'upcoming' | 'active' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          image_url?: string
          category?: string
          start_date?: string
          end_date?: string
          rules?: string[]
          participant_count?: number
          max_participants?: number | null
          status?: 'upcoming' | 'active' | 'completed' | 'cancelled'
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      challenge_participants: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          progress: number
          status: 'active' | 'completed' | 'withdrawn'
          joined_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          progress?: number
          status?: 'active' | 'completed' | 'withdrawn'
          joined_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          progress?: number
          status?: 'active' | 'completed' | 'withdrawn'
          joined_at?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      challenge_rewards: {
        Row: {
          id: string
          challenge_id: string
          type: 'badge' | 'coupon' | 'point'
          name: string
          icon: string
          description: string
          badge_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          challenge_id: string
          type: 'badge' | 'coupon' | 'point'
          name: string
          icon?: string
          description?: string
          badge_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          challenge_id?: string
          type?: 'badge' | 'coupon' | 'point'
          name?: string
          icon?: string
          description?: string
          badge_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_rewards_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_rewards_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'schedule' | 'community' | 'purchase' | 'system'
          sub_type: string
          title: string
          message: string
          icon: string
          is_read: boolean
          deep_link: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'schedule' | 'community' | 'purchase' | 'system'
          sub_type?: string
          title?: string
          message?: string
          icon?: string
          is_read?: boolean
          deep_link?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'schedule' | 'community' | 'purchase' | 'system'
          sub_type?: string
          title?: string
          message?: string
          icon?: string
          is_read?: boolean
          deep_link?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      banners: {
        Row: {
          id: string
          image_url: string
          title: string
          subtitle: string
          link_type: 'routine' | 'category' | 'external' | 'challenge'
          link_target: string
          sort_order: number
          is_active: boolean
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          image_url: string
          title?: string
          subtitle?: string
          link_type?: 'routine' | 'category' | 'external' | 'challenge'
          link_target?: string
          sort_order?: number
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          image_url?: string
          title?: string
          subtitle?: string
          link_type?: 'routine' | 'category' | 'external' | 'challenge'
          link_target?: string
          sort_order?: number
          is_active?: boolean
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      search_keywords: {
        Row: {
          id: string
          keyword: string
          count: number
          is_trending: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          keyword: string
          count?: number
          is_trending?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          keyword?: string
          count?: number
          is_trending?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      user_search_history: {
        Row: {
          id: string
          user_id: string
          keyword: string
          searched_at: string
        }
        Insert: {
          id?: string
          user_id: string
          keyword: string
          searched_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          keyword?: string
          searched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      qr_codes: {
        Row: {
          id: string
          user_id: string
          routine_id: string
          code: string
          shared_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          routine_id: string
          code: string
          shared_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          routine_id?: string
          code?: string
          shared_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      upsert_search_keyword: {
        Args: {
          search_keyword: string
        }
        Returns: undefined
      }
      get_user_stats: {
        Args: {
          target_user_id: string
          period?: string
        }
        Returns: Json
      }
      get_ranking: {
        Args: {
          ranking_period?: string
          ranking_category?: string
          result_limit?: number
        }
        Returns: {
          rank: number
          user_id: string
          nickname: string
          avatar_url: string
          completion_rate: number
        }[]
      }
      get_admin_dashboard_stats: {
        Args: Record<string, never>
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ============================================================================
// Helper Types
// ============================================================================

// 테이블별 Row 타입 단축형
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Routine = Database['public']['Tables']['routines']['Row']
export type RoutinePeriod = Database['public']['Tables']['routine_periods']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Purchase = Database['public']['Tables']['purchases']['Row']
export type UserRoutine = Database['public']['Tables']['user_routines']['Row']
export type TodoItem = Database['public']['Tables']['todo_items']['Row']
export type TodoSubItem = Database['public']['Tables']['todo_sub_items']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type PostLike = Database['public']['Tables']['post_likes']['Row']
export type PostBookmark = Database['public']['Tables']['post_bookmarks']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type CommentLike = Database['public']['Tables']['comment_likes']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type UserBadge = Database['public']['Tables']['user_badges']['Row']
export type Challenge = Database['public']['Tables']['challenges']['Row']
export type ChallengeParticipant = Database['public']['Tables']['challenge_participants']['Row']
export type ChallengeReward = Database['public']['Tables']['challenge_rewards']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Banner = Database['public']['Tables']['banners']['Row']
export type SearchKeyword = Database['public']['Tables']['search_keywords']['Row']
export type UserSearchHistory = Database['public']['Tables']['user_search_history']['Row']
export type QrCode = Database['public']['Tables']['qr_codes']['Row']

// 테이블별 Insert 타입 단축형
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type FollowInsert = Database['public']['Tables']['follows']['Insert']
export type RoutineInsert = Database['public']['Tables']['routines']['Insert']
export type RoutinePeriodInsert = Database['public']['Tables']['routine_periods']['Insert']
export type ReviewInsert = Database['public']['Tables']['reviews']['Insert']
export type PurchaseInsert = Database['public']['Tables']['purchases']['Insert']
export type UserRoutineInsert = Database['public']['Tables']['user_routines']['Insert']
export type TodoItemInsert = Database['public']['Tables']['todo_items']['Insert']
export type TodoSubItemInsert = Database['public']['Tables']['todo_sub_items']['Insert']
export type PostInsert = Database['public']['Tables']['posts']['Insert']
export type PostLikeInsert = Database['public']['Tables']['post_likes']['Insert']
export type PostBookmarkInsert = Database['public']['Tables']['post_bookmarks']['Insert']
export type CommentInsert = Database['public']['Tables']['comments']['Insert']
export type CommentLikeInsert = Database['public']['Tables']['comment_likes']['Insert']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']
export type BadgeInsert = Database['public']['Tables']['badges']['Insert']
export type UserBadgeInsert = Database['public']['Tables']['user_badges']['Insert']
export type ChallengeInsert = Database['public']['Tables']['challenges']['Insert']
export type ChallengeParticipantInsert = Database['public']['Tables']['challenge_participants']['Insert']
export type ChallengeRewardInsert = Database['public']['Tables']['challenge_rewards']['Insert']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type BannerInsert = Database['public']['Tables']['banners']['Insert']
export type SearchKeywordInsert = Database['public']['Tables']['search_keywords']['Insert']
export type UserSearchHistoryInsert = Database['public']['Tables']['user_search_history']['Insert']
export type QrCodeInsert = Database['public']['Tables']['qr_codes']['Insert']

// 테이블별 Update 타입 단축형
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type FollowUpdate = Database['public']['Tables']['follows']['Update']
export type RoutineUpdate = Database['public']['Tables']['routines']['Update']
export type RoutinePeriodUpdate = Database['public']['Tables']['routine_periods']['Update']
export type ReviewUpdate = Database['public']['Tables']['reviews']['Update']
export type PurchaseUpdate = Database['public']['Tables']['purchases']['Update']
export type UserRoutineUpdate = Database['public']['Tables']['user_routines']['Update']
export type TodoItemUpdate = Database['public']['Tables']['todo_items']['Update']
export type TodoSubItemUpdate = Database['public']['Tables']['todo_sub_items']['Update']
export type PostUpdate = Database['public']['Tables']['posts']['Update']
export type PostLikeUpdate = Database['public']['Tables']['post_likes']['Update']
export type PostBookmarkUpdate = Database['public']['Tables']['post_bookmarks']['Update']
export type CommentUpdate = Database['public']['Tables']['comments']['Update']
export type CommentLikeUpdate = Database['public']['Tables']['comment_likes']['Update']
export type ReportUpdate = Database['public']['Tables']['reports']['Update']
export type BadgeUpdate = Database['public']['Tables']['badges']['Update']
export type UserBadgeUpdate = Database['public']['Tables']['user_badges']['Update']
export type ChallengeUpdate = Database['public']['Tables']['challenges']['Update']
export type ChallengeParticipantUpdate = Database['public']['Tables']['challenge_participants']['Update']
export type ChallengeRewardUpdate = Database['public']['Tables']['challenge_rewards']['Update']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
export type BannerUpdate = Database['public']['Tables']['banners']['Update']
export type SearchKeywordUpdate = Database['public']['Tables']['search_keywords']['Update']
export type UserSearchHistoryUpdate = Database['public']['Tables']['user_search_history']['Update']
export type QrCodeUpdate = Database['public']['Tables']['qr_codes']['Update']
