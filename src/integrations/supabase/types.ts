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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent_key: string
          agent_name: string
          completed_at: string | null
          duration_ms: number | null
          id: string
          output: Json | null
          project_id: string
          reasoning: string | null
          started_at: string
          status: string
          summary: string | null
          user_id: string
        }
        Insert: {
          agent_key: string
          agent_name: string
          completed_at?: string | null
          duration_ms?: number | null
          id?: string
          output?: Json | null
          project_id: string
          reasoning?: string | null
          started_at?: string
          status?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          agent_key?: string
          agent_name?: string
          completed_at?: string | null
          duration_ms?: number | null
          id?: string
          output?: Json | null
          project_id?: string
          reasoning?: string | null
          started_at?: string
          status?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approved: boolean | null
          created_at: string
          decided_at: string | null
          id: string
          notes: string | null
          project_id: string
          stage: string
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          decided_at?: string | null
          id?: string
          notes?: string | null
          project_id: string
          stage: string
          user_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          decided_at?: string | null
          id?: string
          notes?: string | null
          project_id?: string
          stage?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
          project_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          kind: string
          project_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_accounts: {
        Row: {
          created_at: string
          included: number
          period: string
          plan: string
          topups: number
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          created_at?: string
          included?: number
          period?: string
          plan?: string
          topups?: number
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          created_at?: string
          included?: number
          period?: string
          plan?: string
          topups?: number
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          balance_after: number | null
          created_at: string
          credits: number
          entry_type: Database["public"]["Enums"]["credit_entry_type"]
          id: string
          kind: string
          label: string
          metadata: Json
          period: string
          request_id: string | null
          reverses_id: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          credits: number
          entry_type: Database["public"]["Enums"]["credit_entry_type"]
          id?: string
          kind: string
          label: string
          metadata?: Json
          period: string
          request_id?: string | null
          reverses_id?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          credits?: number
          entry_type?: Database["public"]["Enums"]["credit_entry_type"]
          id?: string
          kind?: string
          label?: string
          metadata?: Json
          period?: string
          request_id?: string | null
          reverses_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_ledger_reverses_id_fkey"
            columns: ["reverses_id"]
            isOneToOne: false
            referencedRelation: "credit_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_resets: {
        Row: {
          created_at: string
          from_period: string
          id: string
          included_before: number
          plan: string
          to_period: string
          topups_before: number
          used_before: number
          user_id: string
        }
        Insert: {
          created_at?: string
          from_period: string
          id?: string
          included_before: number
          plan: string
          to_period: string
          topups_before: number
          used_before: number
          user_id: string
        }
        Update: {
          created_at?: string
          from_period?: string
          id?: string
          included_before?: number
          plan?: string
          to_period?: string
          topups_before?: number
          used_before?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          cloud: Database["public"]["Enums"]["cloud_provider"]
          compliance: string[]
          created_at: string
          current_stage: string | null
          estimated_monthly_cost: number | null
          id: string
          name: string
          requirement: string
          scale_hint: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          cloud?: Database["public"]["Enums"]["cloud_provider"]
          compliance?: string[]
          created_at?: string
          current_stage?: string | null
          estimated_monthly_cost?: number | null
          id?: string
          name: string
          requirement: string
          scale_hint?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          cloud?: Database["public"]["Enums"]["cloud_provider"]
          compliance?: string[]
          created_at?: string
          current_stage?: string | null
          estimated_monthly_cost?: number | null
          id?: string
          name?: string
          requirement?: string
          scale_hint?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      adjust_credits: {
        Args: { _amount: number; _kind?: string; _label: string }
        Returns: Json
      }
      consume_credits: {
        Args: {
          _kind: string
          _label: string
          _metadata?: Json
          _multiplier?: number
          _plan?: string
          _request_id?: string
        }
        Returns: Json
      }
      credit_cost: { Args: { _kind: string }; Returns: number }
      credit_plan_config: { Args: { _plan: string }; Returns: Json }
      credit_snapshot: { Args: { _plan?: string }; Returns: Json }
      ensure_credit_account: {
        Args: { _plan?: string; _user_id: string }
        Returns: {
          created_at: string
          included: number
          period: string
          plan: string
          topups: number
          updated_at: string
          used: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "credit_accounts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refund_credits: {
        Args: { _amount?: number; _entry_id: string; _reason?: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      cloud_provider: "aws" | "azure" | "gcp" | "multi"
      credit_entry_type: "charge" | "refund" | "adjustment" | "topup" | "reset"
      project_status:
        | "draft"
        | "running"
        | "awaiting_approval"
        | "completed"
        | "failed"
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
    Enums: {
      app_role: ["admin", "user"],
      cloud_provider: ["aws", "azure", "gcp", "multi"],
      credit_entry_type: ["charge", "refund", "adjustment", "topup", "reset"],
      project_status: [
        "draft",
        "running",
        "awaiting_approval",
        "completed",
        "failed",
      ],
    },
  },
} as const
