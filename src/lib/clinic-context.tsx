import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Ticket, Specialty, Doctor, DoctorType, Office, Priority, MedicalRecord, Prescription, QueueRules, SystemUser, Appointment } from './clinic-types';

const SPECIALTIES: Specialty[] = [
  { id: '1', name: 'Clínica Geral', icon: '🩺' },
  { id: '2', name: 'Cardiologia', icon: '❤️' },
  { id: '3', name: 'Ortopedia', icon: '🦴' },
  { id: '4', name: 'Dermatologia', icon: '🧴' },
  { id: '5', name: 'Pediatria', icon: '👶' },
  { id: '6', name: 'Oftalmologia', icon: '👁️' },
];

const DEFAULT_QUEUE_RULES: QueueRules = { normalBeforePriority: 2, priorityCount: 1 };

const DEFAULT_OFFICES: Office[] = [
  { id: 'of1', name: 'Consultório 1', active: true },
  { id: 'of2', name: 'Consultório 2', active: true },
  { id: 'of3', name: 'Consultório 3', active: true },
];

const DEFAULT_USERS: SystemUser[] = [
  { id: 'u1', name: 'Admin Geral', email: 'admin@cliniplus.com', password: 'admin123', role: 'admin', active: true },
  { id: 'u2', name: 'Maria Recepção', email: 'recepcao@cliniplus.com', password: '123456', role: 'receptionist', active: true },
  { id: 'u3', name: 'Ana Assistente', email: 'assistente@cliniplus.com', password: '123456', role: 'assistant', active: true },
];

const STORAGE_KEY = 'cliniplus_state';
const SYNC_CHANNEL = 'cliniplus_sync';

const DATE_FIELDS = ['createdAt', 'calledAt', 'horaChegada', 'horaChamadaRecepcao', 'horaFimRecepcao', 'horaChamadaMedico', 'horaFimAtendimento'] as const;

function serializeTicket(t: Ticket): any {
  const obj: any = { ...t };
  for (const f of DATE_FIELDS) {
    if (obj[f] instanceof Date) obj[f] = obj[f].toISOString();
  }
  return obj;
}

function deserializeTicket(obj: any): Ticket {
  for (const f of DATE_FIELDS) {
    if (obj[f]) obj[f] = new Date(obj[f]);
  }
  return obj as Ticket;
}

interface StoredState {
  tickets: any[];
  records: any[];
  prescriptions: any[];
  normalCounter: number;
  priorityCounter: number;
  queueRules: QueueRules;
  normalCalledSinceLastPriority: number;
  users: SystemUser[];
  doctorTypes: DoctorType[];
  offices: Office[];
  doctors: Doctor[];
  appointments: any[];
}

function saveState(
  tickets: Ticket[], records: MedicalRecord[], prescriptions: Prescription[],
  nc: number, pc: number, queueRules: QueueRules, normalCalledSinceLastPriority: number,
  users: SystemUser[], doctorTypes: DoctorType[], offices: Office[],
  doctors: Doctor[], appointments: Appointment[]
) {
  const data: StoredState = {
    tickets: tickets.map(serializeTicket),
    records: records.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    prescriptions: prescriptions.map(p => ({ ...p, date: p.date.toISOString() })),
    normalCounter: nc,
    priorityCounter: pc,
    queueRules,
    normalCalledSinceLastPriority,
    users,
    doctorTypes,
    offices,
    doctors,
    appointments: appointments.map(a => ({ ...a, createdAt: a.createdAt.toISOString() })),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredState = JSON.parse(raw);
    return {
      tickets: (data.tickets || []).map(deserializeTicket),
      records: (data.records || []).map(r => ({ ...r, createdAt: new Date(r.createdAt) })),
      prescriptions: (data.prescriptions || []).map(p => ({ ...p, date: new Date(p.date) })),
      normalCounter: data.normalCounter || 0,
      priorityCounter: data.priorityCounter || 0,
      queueRules: data.queueRules || DEFAULT_QUEUE_RULES,
      normalCalledSinceLastPriority: data.normalCalledSinceLastPriority || 0,
      users: data.users || DEFAULT_USERS,
      doctorTypes: data.doctorTypes || [],
      offices: data.offices || DEFAULT_OFFICES,
      doctors: (data.doctors || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        specialtyId: d.specialtyId,
        crm: d.crm || '',
      })),
      appointments: (data.appointments || []).map((a: any) => ({ ...a, status: a.status || 'agendado', createdAt: new Date(a.createdAt) })),
    };
  } catch { return null; }
}

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
  createTicket: (priority: Priority, specialtyId: string) => Ticket;
  callNextReception: () => Ticket | null;
  registerPatientAndForward: (ticketId: string, name: string, cpf?: string, phone?: string) => void;
  callNextDoctor: (doctorId: string, officeId: string, officeName: string) => Ticket | null;
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
  checkinAppointment: (id: string) => Ticket | null;
  rescheduleAppointment: (id: string, newDate: string, newTime: string) => void;
  getAppointmentsForDoctor: (doctorId: string, date: string) => Appointment[];
  getAppointmentsForDate: (date: string) => Appointment[];
}

const ClinicContext = createContext<ClinicContextType | null>(null);

let normalCounter = 0;
let priorityCounter = 0;
let normalCalledSinceLastPriority = 0;
let agendadoCounter = 0;

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [queueRules, setQueueRules] = useState<QueueRules>(DEFAULT_QUEUE_RULES);
  const [users, setUsers] = useState<SystemUser[]>(DEFAULT_USERS);
  const [doctorTypes, setDoctorTypes] = useState<DoctorType[]>([]);
  const [offices, setOffices] = useState<Office[]>(DEFAULT_OFFICES);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = loadState();
    if (saved) {
      setTickets(saved.tickets);
      setRecords(saved.records);
      setPrescriptions(saved.prescriptions);
      normalCounter = saved.normalCounter;
      priorityCounter = saved.priorityCounter;
      setQueueRules(saved.queueRules);
      normalCalledSinceLastPriority = saved.normalCalledSinceLastPriority;
      setUsers(saved.users);
      setDoctorTypes(saved.doctorTypes);
      setOffices(saved.offices);
      setDoctors(saved.doctors);
      setAppointments(saved.appointments);
    }
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    saveState(tickets, records, prescriptions, normalCounter, priorityCounter, queueRules, normalCalledSinceLastPriority, users, doctorTypes, offices, doctors, appointments);
    try {
      const bc = new BroadcastChannel(SYNC_CHANNEL);
      bc.postMessage('sync');
      bc.close();
    } catch {}
  }, [tickets, records, prescriptions, queueRules, users, doctorTypes, offices, doctors, appointments]);

  useEffect(() => {
    const bc = new BroadcastChannel(SYNC_CHANNEL);
    bc.onmessage = () => {
      const saved = loadState();
      if (saved) {
        setTickets(saved.tickets);
        setRecords(saved.records);
        setPrescriptions(saved.prescriptions);
        normalCounter = saved.normalCounter;
        priorityCounter = saved.priorityCounter;
        setQueueRules(saved.queueRules);
        normalCalledSinceLastPriority = saved.normalCalledSinceLastPriority;
        setUsers(saved.users);
        setDoctorTypes(saved.doctorTypes);
        setOffices(saved.offices);
        setDoctors(saved.doctors);
        setAppointments(saved.appointments);
      }
    };
    return () => bc.close();
  }, []);

  const sortByCreatedAt = (list: Ticket[]) =>
    [...list].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  // Sort queue: priority first, then agendado, then normal
  const sortByPriority = (list: Ticket[]) => {
    const priorityOrder: Record<Priority, number> = { priority: 0, agendado: 1, normal: 2 };
    return [...list].sort((a, b) => {
      const pa = priorityOrder[a.priority] ?? 2;
      const pb = priorityOrder[b.priority] ?? 2;
      if (pa !== pb) return pa - pb;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  };

  const createTicket = useCallback((priority: Priority, specialtyId: string, appointmentId?: string, patientName?: string, patientCpf?: string, patientPhone?: string) => {
    let prefix: string;
    let counter: number;
    if (priority === 'priority') {
      prefix = 'P';
      counter = ++priorityCounter;
    } else if (priority === 'agendado') {
      prefix = 'A';
      counter = ++agendadoCounter;
    } else {
      prefix = 'N';
      counter = ++normalCounter;
    }
    const code = `${prefix}${String(counter).padStart(3, '0')}`;
    const now = new Date();

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      code,
      priority,
      specialtyId,
      status: 'aguardando_recepcao',
      createdAt: now,
      horaChegada: now,
      appointmentId,
      patientName,
      patientCpf,
      patientPhone,
    };

    setTickets(prev => [...prev, ticket]);
    return ticket;
  }, []);

  const callNextReception = useCallback(() => {
    let called: Ticket | null = null;
    setTickets(prev => {
      const waiting = prev.filter(t => t.status === 'aguardando_recepcao');
      const waitingNormal = sortByCreatedAt(waiting.filter(t => t.priority === 'normal'));
      const waitingPriority = sortByCreatedAt(waiting.filter(t => t.priority === 'priority'));
      const waitingAgendado = sortByCreatedAt(waiting.filter(t => t.priority === 'agendado'));

      // Priority order: priority > agendado > normal
      let next: Ticket | undefined;

      const shouldCallPriority = waitingPriority.length > 0 && (
        normalCalledSinceLastPriority >= queueRules.normalBeforePriority ||
        (waitingNormal.length === 0 && waitingAgendado.length === 0)
      );

      if (shouldCallPriority) {
        next = waitingPriority[0];
        normalCalledSinceLastPriority = 0;
      } else if (waitingAgendado.length > 0) {
        next = waitingAgendado[0];
        normalCalledSinceLastPriority++;
      } else if (waitingNormal.length > 0) {
        next = waitingNormal[0];
        normalCalledSinceLastPriority++;
      } else if (waitingPriority.length > 0) {
        next = waitingPriority[0];
        normalCalledSinceLastPriority = 0;
      } else {
        return prev;
      }

      if (!next) return prev;

      const now = new Date();
      called = { ...next, status: 'em_atendimento_recepcao', calledAt: now, horaChamadaRecepcao: now };
      return prev.map(t => t.id === next!.id ? called! : t);
    });
    return called;
  }, [queueRules]);

  const registerPatientAndForward = useCallback((ticketId: string, name: string, cpf?: string, phone?: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const doctor = doctors.find(d => d.specialtyId === t.specialtyId);
      return {
        ...t,
        patientName: name,
        patientCpf: cpf,
        patientPhone: phone,
        status: 'aguardando_medico' as const,
        doctorId: doctor?.id,
        horaFimRecepcao: new Date(),
      };
    }));
  }, [doctors]);

  const callNextDoctor = useCallback((doctorId: string, officeId: string, officeName: string) => {
    let called: Ticket | null = null;
    setTickets(prev => {
      const waiting = prev.filter(t => t.status === 'aguardando_medico' && t.doctorId === doctorId);
      const sorted = sortByPriority(waiting);
      if (sorted.length === 0) return prev;
      const next = sorted[0];
      const now = new Date();
      called = { ...next, status: 'em_atendimento_medico', calledAt: now, horaChamadaMedico: now, officeId, officeName };
      return prev.map(t => t.id === next.id ? called! : t);
    });
    return called;
  }, []);

  const completeAttendance = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t =>
      t.id === ticketId ? { ...t, status: 'finalizado' as const, horaFimAtendimento: new Date() } : t
    ));
  }, []);

  const addRecord = useCallback((record: Omit<MedicalRecord, 'createdAt'>) => {
    setRecords(prev => [...prev, { ...record, createdAt: new Date() }]);
  }, []);

  const addPrescription = useCallback((prescription: Omit<Prescription, 'id' | 'date'>) => {
    setPrescriptions(prev => [...prev, { ...prescription, id: crypto.randomUUID(), date: new Date() }]);
  }, []);

  const getReceptionQueue = useCallback(() => {
    return sortByCreatedAt(tickets.filter(t => t.status === 'aguardando_recepcao'));
  }, [tickets]);

  const getDoctorQueue = useCallback((doctorId: string) => {
    const waiting = tickets.filter(t => t.doctorId === doctorId && t.status === 'aguardando_medico');
    return sortByPriority(waiting);
  }, [tickets]);

  const updateQueueRules = useCallback((rules: QueueRules) => {
    setQueueRules(rules);
  }, []);

  const addUser = useCallback((user: Omit<SystemUser, 'id'>) => {
    setUsers(prev => [...prev, { ...user, id: crypto.randomUUID() }]);
  }, []);

  const updateUser = useCallback((id: string, data: Partial<SystemUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  }, []);

  const toggleUserActive = useCallback((id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  }, []);

  const addDoctorType = useCallback((name: string) => {
    setDoctorTypes(prev => [...prev, { id: crypto.randomUUID(), name }]);
  }, []);

  const updateDoctorType = useCallback((id: string, name: string) => {
    setDoctorTypes(prev => prev.map(dt => dt.id === id ? { ...dt, name } : dt));
  }, []);

  const deleteDoctorType = useCallback((id: string) => {
    setDoctorTypes(prev => prev.filter(dt => dt.id !== id));
  }, []);

  const addOffice = useCallback((name: string) => {
    setOffices(prev => [...prev, { id: crypto.randomUUID(), name, active: true }]);
  }, []);

  const addOfficesBulk = useCallback((count: number) => {
    setOffices(prev => {
      const existing = prev.length;
      const newOffices: Office[] = [];
      for (let i = 1; i <= count; i++) {
        newOffices.push({ id: crypto.randomUUID(), name: `Consultório ${existing + i}`, active: true });
      }
      return [...prev, ...newOffices];
    });
  }, []);

  const updateOffice = useCallback((id: string, name: string) => {
    setOffices(prev => prev.map(o => o.id === id ? { ...o, name } : o));
  }, []);

  const toggleOfficeActive = useCallback((id: string) => {
    setOffices(prev => prev.map(o => o.id === id ? { ...o, active: !o.active } : o));
  }, []);

  const addDoctor = useCallback((doctor: Omit<Doctor, 'id'>) => {
    setDoctors(prev => [...prev, { ...doctor, id: crypto.randomUUID() }]);
  }, []);

  const updateDoctor = useCallback((id: string, data: Partial<Doctor>) => {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...data } : d));
  }, []);

  const deleteDoctor = useCallback((id: string) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
  }, []);

  const addAppointment = useCallback((appointment: Omit<Appointment, 'id' | 'createdAt' | 'status'>) => {
    setAppointments(prev => {
      const exists = prev.some(a => a.doctorId === appointment.doctorId && a.date === appointment.date && a.time === appointment.time && a.status !== 'cancelado');
      if (exists) return prev;
      return [...prev, { ...appointment, id: crypto.randomUUID(), status: 'agendado' as const, createdAt: new Date() }];
    });
  }, []);

  const cancelAppointment = useCallback((id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelado' as const } : a));
  }, []);

  const checkinAppointment = useCallback((id: string): Ticket | null => {
    const appt = appointments.find(a => a.id === id);
    if (!appt || appt.status !== 'agendado') return null;

    // Mark appointment as checked in
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'checked_in' as const } : a));

    // Create ticket with 'agendado' priority
    const ticket = createTicket('agendado', appt.specialtyId, appt.id, appt.patientName, appt.patientCpf, appt.patientPhone);
    return ticket;
  }, [appointments, createTicket]);

  const rescheduleAppointment = useCallback((id: string, newDate: string, newTime: string) => {
    setAppointments(prev => {
      const appt = prev.find(a => a.id === id);
      if (!appt) return prev;
      // Check conflict
      const conflict = prev.some(a => a.id !== id && a.doctorId === appt.doctorId && a.date === newDate && a.time === newTime && a.status !== 'cancelado');
      if (conflict) return prev;
      return prev.map(a => a.id === id ? { ...a, date: newDate, time: newTime } : a);
    });
  }, []);

  const getAppointmentsForDoctor = useCallback((doctorId: string, date: string) => {
    return appointments.filter(a => a.doctorId === doctorId && a.date === date && a.status !== 'cancelado');
  }, [appointments]);

  const getAppointmentsForDate = useCallback((date: string) => {
    return appointments.filter(a => a.date === date && a.status !== 'cancelado');
  }, [appointments]);

  return (
    <ClinicContext.Provider value={{
      tickets, specialties: SPECIALTIES, doctors, doctorTypes, offices, records, prescriptions,
      appointments, queueRules, users,
      createTicket: (priority: Priority, specialtyId: string) => createTicket(priority, specialtyId),
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
