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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string
          doctor_id: string
          id: string
          patient_cpf: string | null
          patient_name: string
          patient_phone: string | null
          specialty_id: string
          status: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string
          doctor_id: string
          id?: string
          patient_cpf?: string | null
          patient_name: string
          patient_phone?: string | null
          specialty_id: string
          status?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          doctor_id?: string
          id?: string
          patient_cpf?: string | null
          patient_name?: string
          patient_phone?: string | null
          specialty_id?: string
          status?: string
        }
        Relationships: []
      }
      doctor_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      doctors: {
        Row: {
          created_at: string
          crm: string
          id: string
          name: string
          specialty_id: string
        }
        Insert: {
          created_at?: string
          crm?: string
          id?: string
          name: string
          specialty_id: string
        }
        Update: {
          created_at?: string
          crm?: string
          id?: string
          name?: string
          specialty_id?: string
        }
        Relationships: []
      }
      medical_records: {
        Row: {
          complaint: string
          created_at: string
          diagnosis: string
          id: string
          observations: string
          ticket_id: string
        }
        Insert: {
          complaint?: string
          created_at?: string
          diagnosis?: string
          id?: string
          observations?: string
          ticket_id: string
        }
        Update: {
          complaint?: string
          created_at?: string
          diagnosis?: string
          id?: string
          observations?: string
          ticket_id?: string
        }
        Relationships: []
      }
      offices: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          doctor_name: string
          id: string
          issued_at: string
          medications: Json
          observations: string
          patient_name: string
          ticket_id: string
        }
        Insert: {
          doctor_name?: string
          id?: string
          issued_at?: string
          medications?: Json
          observations?: string
          patient_name?: string
          ticket_id: string
        }
        Update: {
          doctor_name?: string
          id?: string
          issued_at?: string
          medications?: Json
          observations?: string
          patient_name?: string
          ticket_id?: string
        }
        Relationships: []
      }
      queue_rules: {
        Row: {
          id: number
          normal_before_priority: number
          priority_count: number
        }
        Insert: {
          id?: number
          normal_before_priority?: number
          priority_count?: number
        }
        Update: {
          id?: number
          normal_before_priority?: number
          priority_count?: number
        }
        Relationships: []
      }
      system_users: {
        Row: {
          active: boolean
          created_at: string
          doctor_id: string | null
          email: string
          id: string
          name: string
          password: string
          role: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          doctor_id?: string | null
          email: string
          id?: string
          name: string
          password?: string
          role?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          doctor_id?: string | null
          email?: string
          id?: string
          name?: string
          password?: string
          role?: string
        }
        Relationships: []
      }
      ticket_counters: {
        Row: {
          agendado: number
          id: number
          normal: number
          normal_called_since_last_priority: number
          priority: number
        }
        Insert: {
          agendado?: number
          id?: number
          normal?: number
          normal_called_since_last_priority?: number
          priority?: number
        }
        Update: {
          agendado?: number
          id?: number
          normal?: number
          normal_called_since_last_priority?: number
          priority?: number
        }
        Relationships: []
      }
      tickets: {
        Row: {
          appointment_id: string | null
          called_at: string | null
          code: string
          created_at: string
          doctor_id: string | null
          hora_chamada_medico: string | null
          hora_chamada_recepcao: string | null
          hora_chegada: string
          hora_fim_atendimento: string | null
          hora_fim_recepcao: string | null
          id: string
          office_id: string | null
          office_name: string | null
          patient_cpf: string | null
          patient_name: string | null
          patient_phone: string | null
          priority: string
          room: string | null
          specialty_id: string
          status: string
        }
        Insert: {
          appointment_id?: string | null
          called_at?: string | null
          code: string
          created_at?: string
          doctor_id?: string | null
          hora_chamada_medico?: string | null
          hora_chamada_recepcao?: string | null
          hora_chegada?: string
          hora_fim_atendimento?: string | null
          hora_fim_recepcao?: string | null
          id?: string
          office_id?: string | null
          office_name?: string | null
          patient_cpf?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          priority?: string
          room?: string | null
          specialty_id: string
          status?: string
        }
        Update: {
          appointment_id?: string | null
          called_at?: string | null
          code?: string
          created_at?: string
          doctor_id?: string | null
          hora_chamada_medico?: string | null
          hora_chamada_recepcao?: string | null
          hora_chegada?: string
          hora_fim_atendimento?: string | null
          hora_fim_recepcao?: string | null
          id?: string
          office_id?: string | null
          office_name?: string | null
          patient_cpf?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          priority?: string
          room?: string | null
          specialty_id?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      call_next_doctor: {
        Args: {
          p_doctor_id: string
          p_office_id: string
          p_office_name: string
        }
        Returns: {
          appointment_id: string | null
          called_at: string | null
          code: string
          created_at: string
          doctor_id: string | null
          hora_chamada_medico: string | null
          hora_chamada_recepcao: string | null
          hora_chegada: string
          hora_fim_atendimento: string | null
          hora_fim_recepcao: string | null
          id: string
          office_id: string | null
          office_name: string | null
          patient_cpf: string | null
          patient_name: string | null
          patient_phone: string | null
          priority: string
          room: string | null
          specialty_id: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      call_next_reception: {
        Args: never
        Returns: {
          appointment_id: string | null
          called_at: string | null
          code: string
          created_at: string
          doctor_id: string | null
          hora_chamada_medico: string | null
          hora_chamada_recepcao: string | null
          hora_chegada: string
          hora_fim_atendimento: string | null
          hora_fim_recepcao: string | null
          id: string
          office_id: string | null
          office_name: string | null
          patient_cpf: string | null
          patient_name: string | null
          patient_phone: string | null
          priority: string
          room: string | null
          specialty_id: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      next_ticket_code: { Args: { p_priority: string }; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
