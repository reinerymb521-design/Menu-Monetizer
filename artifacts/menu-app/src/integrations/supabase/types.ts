export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      libros: {
        Row: {
          id: string
          titulo: string
          autor: string
          descripcion: string | null
          portada_url: string | null
          genero: string
          es_premium: boolean
        }
        Insert: {
          id?: string
          titulo: string
          autor: string
          descripcion?: string | null
          portada_url?: string | null
          genero: string
          es_premium?: boolean
        }
        Update: {
          id?: string
          titulo?: string
          autor?: string
          descripcion?: string | null
          portada_url?: string | null
          genero?: string
          es_premium?: boolean
        }
        Relationships: []
      }
      audiolibros: {
        Row: {
          id: string
          titulo: string
          audio_url: string | null
          libro_id: string
        }
        Insert: {
          id?: string
          titulo: string
          audio_url?: string | null
          libro_id: string
        }
        Update: {
          id?: string
          titulo?: string
          audio_url?: string | null
          libro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audiolibros_libro_id_fkey"
            columns: ["libro_id"]
            isOneToOne: false
            referencedRelation: "libros"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          id: string
          user_id: string
          email: string | null
          avatar_url: string | null
          es_premium: boolean
          es_admin: boolean
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          avatar_url?: string | null
          es_premium?: boolean
          es_admin?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          email?: string | null
          avatar_url?: string | null
          es_premium?: boolean
          es_admin?: boolean
        }
        Relationships: []
      }
      suscripciones: {
        Row: {
          id: string
          estado: string
          fecha_inicio: string | null
          fecha_fin: string | null
        }
        Insert: {
          id?: string
          estado?: string
          fecha_inicio?: string | null
          fecha_fin?: string | null
        }
        Update: {
          id?: string
          estado?: string
          fecha_inicio?: string | null
          fecha_fin?: string | null
        }
        Relationships: []
      }
      progreso_lectura: {
        Row: {
          id: string
          audiolibro_id: string
          completado: boolean
        }
        Insert: {
          id?: string
          audiolibro_id: string
          completado?: boolean
        }
        Update: {
          id?: string
          audiolibro_id?: string
          completado?: boolean
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          id: string
          titulo: string
          mensaje: string | null
          leida: boolean
        }
        Insert: {
          id?: string
          titulo: string
          mensaje?: string | null
          leida?: boolean
        }
        Update: {
          id?: string
          titulo?: string
          mensaje?: string | null
          leida?: boolean
        }
        Relationships: []
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
