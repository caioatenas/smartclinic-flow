export type Priority = 'normal' | 'priority';
export type TicketStatus = 'aguardando_recepcao' | 'em_atendimento_recepcao' | 'aguardando_medico' | 'em_atendimento_medico' | 'finalizado';
export type UserRole = 'patient' | 'receptionist' | 'assistant' | 'doctor' | 'admin';

export interface Specialty {
  id: string;
  name: string;
  icon: string;
}

export interface Ticket {
  id: string;
  code: string;
  priority: Priority;
  specialtyId: string;
  status: TicketStatus;
  patientName?: string;
  patientCpf?: string;
  patientPhone?: string;
  room?: string;
  doctorId?: string;
  createdAt: Date;
  calledAt?: Date;
  // Timestamps for time tracking
  horaChegada: Date;
  horaChamadaRecepcao?: Date;
  horaFimRecepcao?: Date;
  horaChamadaMedico?: Date;
  horaFimAtendimento?: Date;
}

export interface Doctor {
  id: string;
  name: string;
  specialtyId: string;
  room: string;
}

export interface MedicalRecord {
  ticketId: string;
  complaint: string;
  observations: string;
  diagnosis: string;
  createdAt: Date;
}

export interface Prescription {
  id: string;
  ticketId: string;
  patientName: string;
  doctorName: string;
  date: Date;
  medications: PrescriptionItem[];
  observations: string;
}

export interface PrescriptionItem {
  name: string;
  dosage: string;
  instructions: string;
}
