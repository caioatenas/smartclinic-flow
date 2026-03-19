import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Ticket, Specialty, Doctor, Priority, MedicalRecord, Prescription } from './clinic-types';

const SPECIALTIES: Specialty[] = [
  { id: '1', name: 'Clínica Geral', icon: '🩺' },
  { id: '2', name: 'Cardiologia', icon: '❤️' },
  { id: '3', name: 'Ortopedia', icon: '🦴' },
  { id: '4', name: 'Dermatologia', icon: '🧴' },
  { id: '5', name: 'Pediatria', icon: '👶' },
  { id: '6', name: 'Oftalmologia', icon: '👁️' },
];

const DOCTORS: Doctor[] = [
  { id: 'd1', name: 'Dr. Carlos Silva', specialtyId: '1', room: 'Sala 01' },
  { id: 'd2', name: 'Dra. Ana Souza', specialtyId: '2', room: 'Sala 02' },
  { id: 'd3', name: 'Dr. Pedro Lima', specialtyId: '3', room: 'Sala 03' },
  { id: 'd4', name: 'Dra. Maria Oliveira', specialtyId: '4', room: 'Sala 04' },
  { id: 'd5', name: 'Dra. Juliana Costa', specialtyId: '5', room: 'Sala 05' },
  { id: 'd6', name: 'Dr. Roberto Mendes', specialtyId: '6', room: 'Sala 06' },
];

const STORAGE_KEY = 'cliniplus_state';
const SYNC_CHANNEL = 'cliniplus_sync';

interface StoredState {
  tickets: (Omit<Ticket, 'createdAt' | 'calledAt'> & { createdAt: string; calledAt?: string })[];
  records: (Omit<MedicalRecord, 'createdAt'> & { createdAt: string })[];
  prescriptions: (Omit<Prescription, 'date'> & { date: string })[];
  normalCounter: number;
  priorityCounter: number;
}

function saveState(tickets: Ticket[], records: MedicalRecord[], prescriptions: Prescription[], nc: number, pc: number) {
  const data: StoredState = {
    tickets: tickets.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), calledAt: t.calledAt?.toISOString() })),
    records: records.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    prescriptions: prescriptions.map(p => ({ ...p, date: p.date.toISOString() })),
    normalCounter: nc,
    priorityCounter: pc,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState(): { tickets: Ticket[]; records: MedicalRecord[]; prescriptions: Prescription[]; normalCounter: number; priorityCounter: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: StoredState = JSON.parse(raw);
    return {
      tickets: data.tickets.map(t => ({ ...t, createdAt: new Date(t.createdAt), calledAt: t.calledAt ? new Date(t.calledAt) : undefined })),
      records: data.records.map(r => ({ ...r, createdAt: new Date(r.createdAt) })),
      prescriptions: data.prescriptions.map(p => ({ ...p, date: new Date(p.date) })),
      normalCounter: data.normalCounter,
      priorityCounter: data.priorityCounter,
    };
  } catch { return null; }
}

interface ClinicContextType {
  tickets: Ticket[];
  specialties: Specialty[];
  doctors: Doctor[];
  records: MedicalRecord[];
  prescriptions: Prescription[];
  createTicket: (priority: Priority, specialtyId: string) => Ticket;
  callNextReception: () => Ticket | null;
  registerPatientAndForward: (ticketId: string, name: string, cpf?: string, phone?: string) => void;
  callNextDoctor: (doctorId: string) => Ticket | null;
  completeAttendance: (ticketId: string) => void;
  addRecord: (record: Omit<MedicalRecord, 'createdAt'>) => void;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'date'>) => void;
  getReceptionQueue: () => Ticket[];
  getDoctorQueue: (doctorId: string) => Ticket[];
}

const ClinicContext = createContext<ClinicContextType | null>(null);

let normalCounter = 0;
let priorityCounter = 0;

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const initialized = useRef(false);

  // Load from localStorage on mount
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
    }
  }, []);

  // Persist & broadcast on every change
  useEffect(() => {
    if (!initialized.current) return;
    saveState(tickets, records, prescriptions, normalCounter, priorityCounter);
    // Broadcast to other tabs
    try {
      const bc = new BroadcastChannel(SYNC_CHANNEL);
      bc.postMessage('sync');
      bc.close();
    } catch {}
  }, [tickets, records, prescriptions]);

  // Listen for changes from other tabs
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
      }
    };
    return () => bc.close();
  }, []);

  const sortByPriority = (list: Ticket[]) =>
    list.sort((a, b) => {
      if (a.priority === 'priority' && b.priority !== 'priority') return -1;
      if (b.priority === 'priority' && a.priority !== 'priority') return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  const createTicket = useCallback((priority: Priority, specialtyId: string) => {
    const prefix = priority === 'priority' ? 'P' : 'N';
    const counter = priority === 'priority' ? ++priorityCounter : ++normalCounter;
    const code = `${prefix}${String(counter).padStart(3, '0')}`;

    const ticket: Ticket = {
      id: crypto.randomUUID(),
      code,
      priority,
      specialtyId,
      status: 'aguardando_recepcao',
      createdAt: new Date(),
    };

    setTickets(prev => [...prev, ticket]);
    return ticket;
  }, []);

  const callNextReception = useCallback(() => {
    let called: Ticket | null = null;
    setTickets(prev => {
      const waiting = sortByPriority(prev.filter(t => t.status === 'aguardando_recepcao'));
      if (waiting.length === 0) return prev;
      const next = waiting[0];
      called = { ...next, status: 'em_atendimento_recepcao', calledAt: new Date() };
      return prev.map(t => t.id === next.id ? called! : t);
    });
    return called;
  }, []);

  const registerPatientAndForward = useCallback((ticketId: string, name: string, cpf?: string, phone?: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t;
      const doctor = DOCTORS.find(d => d.specialtyId === t.specialtyId);
      return {
        ...t,
        patientName: name,
        patientCpf: cpf,
        patientPhone: phone,
        status: 'aguardando_medico' as const,
        doctorId: doctor?.id,
        room: doctor?.room,
      };
    }));
  }, []);

  const callNextDoctor = useCallback((doctorId: string) => {
    let called: Ticket | null = null;
    setTickets(prev => {
      const waiting = sortByPriority(prev.filter(t => t.status === 'aguardando_medico' && t.doctorId === doctorId));
      if (waiting.length === 0) return prev;
      const next = waiting[0];
      called = { ...next, status: 'em_atendimento_medico', calledAt: new Date() };
      return prev.map(t => t.id === next.id ? called! : t);
    });
    return called;
  }, []);

  const completeAttendance = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'finalizado' as const } : t));
  }, []);

  const addRecord = useCallback((record: Omit<MedicalRecord, 'createdAt'>) => {
    setRecords(prev => [...prev, { ...record, createdAt: new Date() }]);
  }, []);

  const addPrescription = useCallback((prescription: Omit<Prescription, 'id' | 'date'>) => {
    setPrescriptions(prev => [...prev, { ...prescription, id: crypto.randomUUID(), date: new Date() }]);
  }, []);

  const getReceptionQueue = useCallback(() => {
    return sortByPriority(tickets.filter(t => t.status === 'aguardando_recepcao'));
  }, [tickets]);

  const getDoctorQueue = useCallback((doctorId: string) => {
    return sortByPriority(tickets.filter(t => t.doctorId === doctorId && t.status === 'aguardando_medico'));
  }, [tickets]);

  return (
    <ClinicContext.Provider value={{
      tickets, specialties: SPECIALTIES, doctors: DOCTORS, records, prescriptions,
      createTicket, callNextReception, registerPatientAndForward, callNextDoctor,
      completeAttendance, addRecord, addPrescription, getReceptionQueue, getDoctorQueue,
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
