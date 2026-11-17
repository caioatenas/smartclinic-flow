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
      bed_movements: {
        Row: {
          created_at: string
          from_bed_id: string | null
          id: string
          performed_by: string
          reason: string
          ticket_id: string
          to_bed_id: string | null
        }
        Insert: {
          created_at?: string
          from_bed_id?: string | null
          id?: string
          performed_by: string
          reason: string
          ticket_id: string
          to_bed_id?: string | null
        }
        Update: {
          created_at?: string
          from_bed_id?: string | null
          id?: string
          performed_by?: string
          reason?: string
          ticket_id?: string
          to_bed_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bed_movements_from_bed_id_fkey"
            columns: ["from_bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bed_movements_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bed_movements_to_bed_id_fkey"
            columns: ["to_bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          availability: string
          id: string
          name: string
          occupied_at: string | null
          office_id: string
          ticket_id: string | null
        }
        Insert: {
          availability?: string
          id?: string
          name: string
          occupied_at?: string | null
          office_id: string
          ticket_id?: string | null
        }
        Update: {
          availability?: string
          id?: string
          name?: string
          occupied_at?: string | null
          office_id?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beds_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beds_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
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
      medication_administrations: {
        Row: {
          administered_at: string
          created_at: string
          dose: string
          id: string
          medication: string
          notes: string
          recorded_by: string
          referral_id: string
          route: string
        }
        Insert: {
          administered_at: string
          created_at?: string
          dose: string
          id?: string
          medication: string
          notes?: string
          recorded_by: string
          referral_id: string
          route: string
        }
        Update: {
          administered_at?: string
          created_at?: string
          dose?: string
          id?: string
          medication?: string
          notes?: string
          recorded_by?: string
          referral_id?: string
          route?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_administrations_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      nursing_triages: {
        Row: {
          alerts: string
          created_at: string
          diastolic: number
          id: string
          measured_at: string
          notes: string
          oxygen: number
          pain: number
          pulse: number
          recorded_by: string
          referral_id: string
          respiratory_rate: number
          risk: string
          systolic: number
          temperature: number
        }
        Insert: {
          alerts?: string
          created_at?: string
          diastolic: number
          id?: string
          measured_at: string
          notes?: string
          oxygen: number
          pain: number
          pulse: number
          recorded_by: string
          referral_id: string
          respiratory_rate: number
          risk: string
          systolic: number
          temperature: number
        }
        Update: {
          alerts?: string
          created_at?: string
          diastolic?: number
          id?: string
          measured_at?: string
          notes?: string
          oxygen?: number
          pain?: number
          pulse?: number
          recorded_by?: string
          referral_id?: string
          respiratory_rate?: number
          risk?: string
          systolic?: number
          temperature?: number
        }
        Relationships: [
          {
            foreignKeyName: "nursing_triages_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          active: boolean
          care_type: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          care_type?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          care_type?: string
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
      profiles: {
        Row: {
          active: boolean
          doctor_id: string | null
          email: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          doctor_id?: string | null
          email?: string
          id: string
          name?: string
        }
        Update: {
          active?: boolean
          doctor_id?: string | null
          email?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      queue_display: {
        Row: {
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
          office_name: string | null
          patient_name: string | null
          priority: string
          specialty_id: string
          status: string
        }
        Insert: {
          called_at?: string | null
          code: string
          created_at: string
          doctor_id?: string | null
          hora_chamada_medico?: string | null
          hora_chamada_recepcao?: string | null
          hora_chegada: string
          hora_fim_atendimento?: string | null
          hora_fim_recepcao?: string | null
          id: string
          office_name?: string | null
          patient_name?: string | null
          priority: string
          specialty_id: string
          status: string
        }
        Update: {
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
          office_name?: string | null
          patient_name?: string | null
          priority?: string
          specialty_id?: string
          status?: string
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
      referrals: {
        Row: {
          called_at: string | null
          completed_at: string | null
          created_at: string
          doctor_id: string
          handled_by: string | null
          id: string
          office_id: string
          outcome: string
          reason: string
          status: string
          ticket_id: string
        }
        Insert: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          doctor_id: string
          handled_by?: string | null
          id?: string
          office_id: string
          outcome?: string
          reason: string
          status?: string
          ticket_id: string
        }
        Update: {
          called_at?: string | null
          completed_at?: string | null
          created_at?: string
          doctor_id?: string
          handled_by?: string | null
          id?: string
          office_id?: string
          outcome?: string
          reason?: string
          status?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_office_id_fkey"
            columns: ["office_id"]
            isOneToOne: false
            referencedRelation: "offices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_invitations: {
        Row: {
          active: boolean
          doctor_id: string | null
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          active?: boolean
          doctor_id?: string | null
          email: string
          id?: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          active?: boolean
          doctor_id?: string | null
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "staff_invitations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      call_next_room: {
        Args: { p_office_id: string }
        Returns: {
          called_at: string | null
          completed_at: string | null
          created_at: string
          doctor_id: string
          handled_by: string | null
          id: string
          office_id: string
          outcome: string
          reason: string
          status: string
          ticket_id: string
        }
        SetofOptions: {
          from: "*"
          to: "referrals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_referral: {
        Args: { p_id: string; p_outcome: string }
        Returns: undefined
      }
      create_referral: {
        Args: {
          p_complaint?: string
          p_diagnosis?: string
          p_observations?: string
          p_office_id: string
          p_reason: string
          p_ticket_id: string
        }
        Returns: {
          called_at: string | null
          completed_at: string | null
          created_at: string
          doctor_id: string
          handled_by: string | null
          id: string
          office_id: string
          outcome: string
          reason: string
          status: string
          ticket_id: string
        }
        SetofOptions: {
          from: "*"
          to: "referrals"
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
      is_clinic_staff: { Args: never; Returns: boolean }
      kiosk_ticket: {
        Args: { p_priority: string; p_specialty: string }
        Returns: {
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
          office_name: string | null
          patient_name: string | null
          priority: string
          specialty_id: string
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "queue_display"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_clinic_users: {
        Args: never
        Returns: {
          active: boolean
          doctor_id: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      manage_bed: {
        Args: {
          p_availability: string
          p_id: string
          p_name: string
          p_office_id: string
        }
        Returns: undefined
      }
      manage_clinic_user: {
        Args: {
          p_active: boolean
          p_doctor_id?: string
          p_email: string
          p_id: string
          p_name: string
          p_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: undefined
      }
      move_patient_bed: {
        Args: { p_reason: string; p_ticket_id: string; p_to_bed_id: string }
        Returns: undefined
      }
      next_ticket_code: { Args: { p_priority: string }; Returns: string }
      own_doctor: { Args: never; Returns: string }
      record_nursing_care: {
        Args: { p_data: Json; p_kind: string; p_referral_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "doctor" | "receptionist" | "assistant"
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
    Enums: {
      app_role: ["admin", "doctor", "receptionist", "assistant"],
    },
  },
} as const
