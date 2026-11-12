import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  Ticket, Specialty, Doctor, DoctorType, Office, Priority, MedicalRecord,
  Prescription, QueueRules, SystemUser, Appointment,
} from './clinic-types';

const SPECIALTIES: Specialty[] = [
  { id: '1', name: 'Clínica Geral', icon: '🩺' },
  { id: '2', name: 'Cardiologia', icon: '❤️' },
  { id: '3', name: 'Ortopedia', icon: '🦴' },
  { id: '4', name: 'Dermatologia', icon: '🧴' },
  { id: '5', name: 'Pediatria', icon: '👶' },
  { id: '6', name: 'Oftalmologia', icon: '👁️' },
];

const DEFAULT_QUEUE_RULES: QueueRules = { normalBeforePriority: 2, priorityCount: 1 };

// ---------- Row <-> app mappers ----------

function toTicket(r: any): Ticket {
  return {
    id: r.id,
    code: r.code,
    priority: r.priority as Priority,
    specialtyId: r.specialty_id,
    status: r.status,
    patientName: r.patient_name ?? undefined,
    patientCpf: r.patient_cpf ?? undefined,
    patientPhone: r.patient_phone ?? undefined,
    room: r.room ?? undefined,
    officeId: r.office_id ?? undefined,
    officeName: r.office_name ?? undefined,
    doctorId: r.doctor_id ?? undefined,
    appointmentId: r.appointment_id ?? undefined,
    createdAt: new Date(r.created_at),
    calledAt: r.called_at ? new Date(r.called_at) : undefined,
    horaChegada: new Date(r.hora_chegada ?? r.created_at),
    horaChamadaRecepcao: r.hora_chamada_recepcao ? new Date(r.hora_chamada_recepcao) : undefined,
    horaFimRecepcao: r.hora_fim_recepcao ? new Date(r.hora_fim_recepcao) : undefined,
    horaChamadaMedico: r.hora_chamada_medico ? new Date(r.hora_chamada_medico) : undefined,
    horaFimAtendimento: r.hora_fim_atendimento ? new Date(r.hora_fim_atendimento) : undefined,
  };
}

function toRecord(r: any): MedicalRecord {
  return {
    ticketId: r.ticket_id,
    complaint: r.complaint ?? '',
    observations: r.observations ?? '',
    diagnosis: r.diagnosis ?? '',
    createdAt: new Date(r.created_at),
  };
}

function toPrescription(r: any): Prescription {
  return {
    id: r.id,
    ticketId: r.ticket_id,
    patientName: r.patient_name ?? '',
    doctorName: r.doctor_name ?? '',
    date: new Date(r.issued_at),
    medications: (r.medications ?? []) as any,
    observations: r.observations ?? '',
  };
}

function toAppointment(r: any): Appointment {
  return {
    id: r.id,
    doctorId: r.doctor_id,
    specialtyId: r.specialty_id,
    patientName: r.patient_name,
    patientCpf: r.patient_cpf ?? undefined,
    patientPhone: r.patient_phone ?? undefined,
    date: r.appointment_date,
    time: r.appointment_time,
    status: r.status,
    createdAt: new Date(r.created_at),
  };
}

function toDoctor(r: any): Doctor {
  return { id: r.id, name: r.name, specialtyId: r.specialty_id, crm: r.crm ?? '' };
}

function toDoctorType(r: any): DoctorType {
  return { id: r.id, name: r.name };
}

function toOffice(r: any): Office {
  return { id: r.id, name: r.name, active: !!r.active };
}

function toUser(r: any): SystemUser {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    password: r.password ?? '',
    role: r.role,
    active: !!r.active,
    doctorId: r.doctor_id ?? undefined,
  };
}

function toRules(r: any): QueueRules {
  return {
    normalBeforePriority: r.normal_before_priority ?? 2,
    priorityCount: r.priority_count ?? 1,
  };
}

// ---------- Live row handler ----------

function liveRows<T extends { id: string }>(
  setter: React.Dispatch<React.SetStateAction<T[]>>,
  map: (row: any) => T,
) {
  return (payload: any) => {
    if (payload.eventType === 'DELETE') {
      const id = (payload.old as any)?.id;
      if (id) setter(prev => prev.filter(x => x.id !== id));
      return;
    }
    const mapped = map(payload.new);
    setter(prev => {
      const i = prev.findIndex(x => x.id === mapped.id);
      if (i === -1) return [...prev, mapped];
      const next = [...prev];
      next[i] = mapped;
      return next;
    });
  };
}

// ---------- Context ----------

interface ClinicContextType {
  tickets: Ticket[];
  specialties: Specialty[];
  doctors: Doctor[];
  doctorTypes: DoctorType[];
  offices: Office[];
  records: MedicalRecord[];
  prescriptions: Prescription[];
  appointments: Appointment[];
  queueRules: QueueRules;
  users: SystemUser[];
  connected: boolean;
  createTicket: (priority: Priority, specialtyId: string) => Promise<Ticket | null>;
  callNextReception: () => Promise<Ticket | null>;
  registerPatientAndForward: (ticketId: string, name: string, cpf?: string, phone?: string) => void;
  callNextDoctor: (doctorId: string, officeId: string, officeName: string) => Promise<Ticket | null>;
  completeAttendance: (ticketId: string) => void;
  addRecord: (record: Omit<MedicalRecord, 'createdAt'>) => void;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'date'>) => void;
  getReceptionQueue: () => Ticket[];
  getDoctorQueue: (doctorId: string) => Ticket[];
  updateQueueRules: (rules: QueueRules) => void;
  addUser: (user: Omit<SystemUser, 'id'>) => void;
  updateUser: (id: string, data: Partial<SystemUser>) => void;
  toggleUserActive: (id: string) => void;
  addDoctorType: (name: string) => void;
  updateDoctorType: (id: string, name: string) => void;
  deleteDoctorType: (id: string) => void;
  addOffice: (name: string) => void;
  addOfficesBulk: (count: number) => void;
  updateOffice: (id: string, name: string) => void;
  toggleOfficeActive: (id: string) => void;
  addDoctor: (doctor: Omit<Doctor, 'id'>) => void;
  updateDoctor: (id: string, data: Partial<Doctor>) => void;
  deleteDoctor: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => void;
  cancelAppointment: (id: string) => void;
  checkinAppointment: (id: string) => Promise<Ticket | null>;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  getAppointmentsForDoctor: (doctorId: string, date: string) => Appointment[];
  getAppointmentsForDate: (date: string) => Appointment[];
}

const ClinicContext = createContext<ClinicContextType | null>(null);

const sortByCreatedAt = (list: Ticket[]) =>
  [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

const sortByPriority = (list: Ticket[]) => {
  const priorityOrder: Record<Priority, number> = { priority: 0, agendado: 1, normal: 2 };
  return [...list].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
};

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorTypes, setDoctorTypes] = useState<DoctorType[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [queueRules, setQueueRules] = useState<QueueRules>(DEFAULT_QUEUE_RULES);
  const [connected, setConnected] = useState(false);

  // Load everything once, then keep every screen in sync through realtime.
  useEffect(() => {
    let active = true;

    async function load() {
      const [t, r, p, a, d, dt, o, u, q] = await Promise.all([
        supabase.from('tickets').select('*'),
        supabase.from('medical_records').select('*'),
        supabase.from('prescriptions').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('doctors').select('*'),
        supabase.from('doctor_types').select('*'),
        supabase.from('offices').select('*'),
        supabase.from('system_users').select('*'),
        supabase.from('queue_rules').select('*').eq('id', 1).maybeSingle(),
      ]);
      if (!active) return;
      setTickets((t.data ?? []).map(toTicket));
      setRecords((r.data ?? []).map(toRecord));
      setPrescriptions((p.data ?? []).map(toPrescription));
      setAppointments((a.data ?? []).map(toAppointment));
      setDoctors((d.data ?? []).map(toDoctor));
      setDoctorTypes((dt.data ?? []).map(toDoctorType));
      setOffices((o.data ?? []).map(toOffice));
      setUsers((u.data ?? []).map(toUser));
      if (q.data) setQueueRules(toRules(q.data));
      setConnected(true);
    }

    load();

    const channel = supabase
      .channel(`clinic-sync-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, liveRows(setTickets, toTicket))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, liveRows(setAppointments, toAppointment))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctors' }, liveRows(setDoctors, toDoctor))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offices' }, liveRows(setOffices, toOffice))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'doctor_types' }, liveRows(setDoctorTypes, toDoctorType))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_users' }, liveRows(setUsers, toUser))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prescriptions' }, liveRows(setPrescriptions, toPrescription))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_records' }, (payload: any) => {
        if (payload.eventType === 'DELETE') {
          const tid = (payload.old as any)?.ticket_id;
          setRecords(prev => prev.filter(x => x.ticketId !== tid));
          return;
        }
        const mapped = toRecord(payload.new);
        setRecords(prev => {
          const i = prev.findIndex(x => x.ticketId === mapped.ticketId);
          if (i === -1) return [...prev, mapped];
          const next = [...prev];
          next[i] = mapped;
          return next;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queue_rules' }, (payload: any) => {
        if (payload.new) setQueueRules(toRules(payload.new));
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // ---------- Queue / tickets ----------

  const createTicket = useCallback(async (
    priority: Priority,
    specialtyId: string,
    appointmentId?: string,
    patientName?: string,
    patientCpf?: string,
    patientPhone?: string,
  ): Promise<Ticket | null> => {
    const { data: code, error: codeError } = await supabase.rpc('next_ticket_code', { p_priority: priority });
    if (codeError || !code) {
      console.error('next_ticket_code', codeError);
      return null;
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase.from('tickets').insert({
      code,
      priority,
      specialty_id: specialtyId,
      status: 'aguardando_recepcao',
      created_at: now,
      hora_chegada: now,
      appointment_id: appointmentId ?? null,
      patient_name: patientName ?? null,
      patient_cpf: patientCpf ?? null,
      patient_phone: patientPhone ?? null,
    })
      .select()
      .single();

    if (error) {
      console.error('createTicket', error);
      return null;
    }
    return toTicket(data);
  }, []);

  const callNextReception = useCallback(async (): Promise<Ticket | null> => {
    const { data, error } = await supabase.rpc('call_next_reception');
    if (error) {
      console.error('call_next_reception', error);
      return null;
    }
    const row = (data ?? [])[0] as any;
    return row ? toTicket(row) : null;
  }, []);

  const registerPatientAndForward = useCallback(async (
    ticketId: string,
    name: string,
    cpf?: string,
    phone?: string,
  ) => {
    const ticket = tickets.find(t => t.id === ticketId);
    const doctor = doctors.find(d => d.specialtyId === ticket?.specialtyId);
    const { error } = await supabase.from('tickets').update({
      patient_name: name,
      patient_cpf: cpf ?? null,
      patient_phone: phone ?? null,
      status: 'aguardando_medico',
      doctor_id: doctor?.id ?? null,
      hora_fim_recepcao: new Date().toISOString(),
    }).eq('id', ticketId);
    if (error) console.error('registerPatientAndForward', error);
  }, [tickets, doctors]);

  const callNextDoctor = useCallback(async (
    doctorId: string,
    officeId: string,
    officeName: string,
  ): Promise<Ticket | null> => {
    const { data, error } = await supabase.rpc('call_next_doctor', {
      p_doctor_id: doctorId,
      p_office_id: officeId,
      p_office_name: officeName,
    });
    if (error) {
      console.error('call_next_doctor', error);
      return null;
    }
    const row = (data ?? [])[0] as any;
    return row ? toTicket(row) : null;
  }, []);

  const completeAttendance = useCallback(async (ticketId: string) => {
    const { error } = await supabase.from('tickets').update({
      status: 'finalizado',
      hora_fim_atendimento: new Date().toISOString(),
    }).eq('id', ticketId);
    if (error) console.error('completeAttendance', error);
  }, []);

  const addRecord = useCallback(async (record: Omit<MedicalRecord, 'createdAt'>) => {
    const { error } = await supabase.from('medical_records').insert({
      ticket_id: record.ticketId,
      complaint: record.complaint,
      observations: record.observations,
      diagnosis: record.diagnosis,
    });
    if (error) console.error('addRecord', error);
  }, []);

  const addPrescription = useCallback(async (prescription: Omit<Prescription, 'id' | 'date'>) => {
    const { error } = await supabase.from('prescriptions').insert({
      ticket_id: prescription.ticketId,
      patient_name: prescription.patientName,
      doctor_name: prescription.doctorName,
      medications: prescription.medications as unknown as Json,
      observations: prescription.observations,
    });
    if (error) console.error('addPrescription', error);
  }, []);

  const getReceptionQueue = useCallback(() => {
    return sortByCreatedAt(tickets.filter(t => t.status === 'aguardando_recepcao'));
  }, [tickets]);

  const getDoctorQueue = useCallback((doctorId: string) => {
    return sortByPriority(tickets.filter(t => t.doctorId === doctorId && t.status === 'aguardando_medico'));
  }, [tickets]);

  // ---------- Admin: rules, users, offices, doctors ----------

  const updateQueueRules = useCallback(async (rules: QueueRules) => {
    setQueueRules(rules);
    const { error } = await supabase.from('queue_rules').upsert({
      id: 1,
      normal_before_priority: rules.normalBeforePriority,
      priority_count: rules.priorityCount,
    });
    if (error) console.error('updateQueueRules', error);
  }, []);

  const addUser = useCallback(async (user: Omit<SystemUser, 'id'>) => {
    const { error } = await supabase.from('system_users').insert({
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role,
      active: user.active,
      doctor_id: user.doctorId ?? null,
    });
    if (error) console.error('addUser', error);
  }, []);

  const updateUser = useCallback(async (id: string, data: Partial<SystemUser>) => {
    const patch: {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      active?: boolean;
      doctor_id?: string | null;
    } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.password !== undefined) patch.password = data.password;
    if (data.role !== undefined) patch.role = data.role;
    if (data.active !== undefined) patch.active = data.active;
    if (data.doctorId !== undefined) patch.doctor_id = data.doctorId || null;
    const { error } = await supabase.from('system_users').update(patch).eq('id', id);
    if (error) console.error('updateUser', error);
  }, []);

  const toggleUserActive = useCallback(async (id: string) => {
    const current = users.find(u => u.id === id);
    if (!current) return;
    const { error } = await supabase.from('system_users').update({ active: !current.active }).eq('id', id);
    if (error) console.error('toggleUserActive', error);
  }, [users]);

  const addDoctorType = useCallback(async (name: string) => {
    const { error } = await supabase.from('doctor_types').insert({ name });
    if (error) console.error('addDoctorType', error);
  }, []);

  const updateDoctorType = useCallback(async (id: string, name: string) => {
    const { error } = await supabase.from('doctor_types').update({ name }).eq('id', id);
    if (error) console.error('updateDoctorType', error);
  }, []);

  const deleteDoctorType = useCallback(async (id: string) => {
    const { error } = await supabase.from('doctor_types').delete().eq('id', id);
    if (error) console.error('deleteDoctorType', error);
  }, []);

  const addOffice = useCallback(async (name: string) => {
    const { error } = await supabase.from('offices').insert({ name, active: true });
    if (error) console.error('addOffice', error);
  }, []);

  const addOfficesBulk = useCallback(async (count: number) => {
    const existing = offices.length;
    const rows = Array.from({ length: count }, (_, i) => ({
      name: `Consultório ${existing + i + 1}`,
      active: true,
    }));
    const { error } = await supabase.from('offices').insert(rows);
    if (error) console.error('addOfficesBulk', error);
  }, [offices]);

  const updateOffice = useCallback(async (id: string, name: string) => {
    const { error } = await supabase.from('offices').update({ name }).eq('id', id);
    if (error) console.error('updateOffice', error);
  }, []);

  const toggleOfficeActive = useCallback(async (id: string) => {
    const current = offices.find(o => o.id === id);
    if (!current) return;
    const { error } = await supabase.from('offices').update({ active: !current.active }).eq('id', id);
    if (error) console.error('toggleOfficeActive', error);
  }, [offices]);

  const addDoctor = useCallback(async (doctor: Omit<Doctor, 'id'>) => {
    const { error } = await supabase.from('doctors').insert({
      name: doctor.name,
      specialty_id: doctor.specialtyId,
      crm: doctor.crm ?? '',
    });
    if (error) console.error('addDoctor', error);
  }, []);

  const updateDoctor = useCallback(async (id: string, data: Partial<Doctor>) => {
    const patch: { name?: string; specialty_id?: string; crm?: string } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.specialtyId !== undefined) patch.specialty_id = data.specialtyId;
    if (data.crm !== undefined) patch.crm = data.crm;
    const { error } = await supabase.from('doctors').update(patch).eq('id', id);
    if (error) console.error('updateDoctor', error);
  }, []);

  const deleteDoctor = useCallback(async (id: string) => {
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) console.error('deleteDoctor', error);
  }, []);

  // ---------- Appointments ----------

  const addAppointment = useCallback(async (appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => {
    const exists = appointments.some(a =>
      a.doctorId === appointment.doctorId &&
      a.date === appointment.date &&
      a.time === appointment.time &&
      a.status !== 'cancelado'
    );
    if (exists) return;

    const { error } = await supabase.from('appointments').insert({
      doctor_id: appointment.doctorId,
      specialty_id: appointment.specialtyId,
      patient_name: appointment.patientName,
      patient_cpf: appointment.patientCpf ?? null,
      patient_phone: appointment.patientPhone ?? null,
      appointment_date: appointment.date,
      appointment_time: appointment.time,
      status: 'agendado',
    });
    if (error) console.error('addAppointment', error);
  }, [appointments]);

  const cancelAppointment = useCallback(async (id: string) => {
    const { error } = await supabase.from('appointments').update({ status: 'cancelado' }).eq('id', id);
    if (error) console.error('cancelAppointment', error);
  }, []);

  const checkinAppointment = useCallback(async (id: string): Promise<Ticket | null> => {
    const appt = appointments.find(a => a.id === id);
    if (!appt || appt.status !== 'agendado') return null;

    const { error } = await supabase.from('appointments').update({ status: 'checked_in' }).eq('id', id);
    if (error) {
      console.error('checkinAppointment', error);
      return null;
    }

    return createTicket('agendado', appt.specialtyId, appt.id, appt.patientName, appt.patientCpf, appt.patientPhone);
  }, [appointments, createTicket]);

  const rescheduleAppointment = useCallback(async (id: string, newDate: string, newTime: string) => {
    const appt = appointments.find(a => a.id === id);
    if (!appt) return;
    const conflict = appointments.some(a =>
      a.id !== id &&
      a.doctorId === appt.doctorId &&
      a.date === newDate &&
      a.time === newTime &&
      a.status !== 'cancelado'
    );
    if (conflict) return;

    const { error } = await supabase.from('appointments').update({
      appointment_date: newDate,
      appointment_time: newTime,
    }).eq('id', id);
    if (error) console.error('rescheduleAppointment', error);
  }, [appointments]);

  const getAppointmentsForDoctor = useCallback((doctorId: string, date: string) => {
    return appointments.filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'cancelado');
  }, [appointments]);

  const getAppointmentsForDate = useCallback((date: string) => {
    return appointments.filter(a => a.date === date && a.status !== 'cancelado');
  }, [appointments]);

  return (
    <ClinicContext.Provider value={{
      tickets, specialties: SPECIALTIES, doctors, doctorTypes, offices, records, prescriptions,
      appointments, queueRules, users, connected,
      createTicket,
      callNextReception, registerPatientAndForward, callNextDoctor,
      completeAttendance, addRecord, addPrescription, getReceptionQueue, getDoctorQueue,
      updateQueueRules, addUser, updateUser, toggleUserActive,
      addDoctorType, updateDoctorType, deleteDoctorType,
      addOffice, addOfficesBulk, updateOffice, toggleOfficeActive,
      addDoctor, updateDoctor, deleteDoctor,
      addAppointment, cancelAppointment, checkinAppointment, rescheduleAppointment,
      getAppointmentsForDoctor, getAppointmentsForDate,
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be used within ClinicProvider');
  return ctx;
}
