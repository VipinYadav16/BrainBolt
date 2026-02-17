export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      answer_log: {
        Row: {
          answer: string
          answered_at: string
          correct: boolean
          difficulty_at_answer: number
          id: string
          idempotency_key: string
          question_id: string
          score_delta: number
          streak_at_answer: number
          user_id: string
        }
        Insert: {
          answer: string
          answered_at?: string
          correct: boolean
          difficulty_at_answer: number
          id?: string
          idempotency_key: string
          question_id: string
          score_delta?: number
          streak_at_answer?: number
          user_id: string
        }
        Update: {
          answer?: string
          answered_at?: string
          correct?: boolean
          difficulty_at_answer?: number
          id?: string
          idempotency_key?: string
          question_id?: string
          score_delta?: number
          streak_at_answer?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_log_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_score: {
        Row: {
          total_score: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          total_score?: number
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          total_score?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      leaderboard_streak: {
        Row: {
          max_streak: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          max_streak?: number
          updated_at?: string
          user_id: string
          username?: string
        }
        Update: {
          max_streak?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          username?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          category: string
          choices: Json
          correct_answer: string
          created_at: string
          difficulty: number
          id: string
          prompt: string
        }
        Insert: {
          category?: string
          choices: Json
          correct_answer: string
          created_at?: string
          difficulty: number
          id?: string
          prompt: string
        }
        Update: {
          category?: string
          choices?: Json
          correct_answer?: string
          created_at?: string
          difficulty?: number
          id?: string
          prompt?: string
        }
        Relationships: []
      }
      user_state: {
        Row: {
          correct_answers: number
          created_at: string
          current_difficulty: number
          last_answer_at: string | null
          last_question_id: string | null
          max_streak: number
          momentum: number
          recent_correct: number
          recent_total: number
          state_version: number
          streak: number
          total_answers: number
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_answers?: number
          created_at?: string
          current_difficulty?: number
          last_answer_at?: string | null
          last_question_id?: string | null
          max_streak?: number
          momentum?: number
          recent_correct?: number
          recent_total?: number
          state_version?: number
          streak?: number
          total_answers?: number
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_answers?: number
          created_at?: string
          current_difficulty?: number
          last_answer_at?: string | null
          last_question_id?: string | null
          max_streak?: number
          momentum?: number
          recent_correct?: number
          recent_total?: number
          state_version?: number
          streak?: number
          total_answers?: number
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_state_last_question_id_fkey"
            columns: ["last_question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
