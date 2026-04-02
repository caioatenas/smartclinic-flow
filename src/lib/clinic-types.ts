export type Priority = 'normal' | 'priority' | 'agendado';
export type TicketStatus = 'aguardando_recepcao' | 'em_atendimento_recepcao' | 'aguardando_medico' | 'em_atendimento_medico' | 'finalizado';
export type AppointmentStatus = 'agendado' | 'checked_in' | 'cancelado';
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
  officeId?: string;
  officeName?: string;
  doctorId?: string;
  appointmentId?: string;
  createdAt: Date;
  calledAt?: Date;
  horaChegada: Date;
  horaChamadaRecepcao?: Date;
  horaFimRecepcao?: Date;
  horaChamadaMedico?: Date;
  horaFimAtendimento?: Date;
}

export interface Office {
  id: string;
  name: string;
  active: boolean;
}

export interface DoctorType {
  id: string;
  name: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialtyId: string;
  crm?: string;
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

export interface Appointment {
  id: string;
  doctorId: string;
  specialtyId: string;
  patientName: string;
  patientCpf?: string;
  patientPhone?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: AppointmentStatus;
  createdAt: Date;
}

export interface QueueRules {
  normalBeforePriority: number;
  priorityCount: number;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  active: boolean;
  doctorId?: string;
}
