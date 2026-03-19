import React, { createContext, useContext, useState, useCallback } from 'react';
import { Ticket, Specialty, Doctor, Priority, MedicalRecord, Prescription, PrescriptionItem } from './clinic-types';

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

interface ClinicContextType {
  tickets: Ticket[];
  specialties: Specialty[];
  doctors: Doctor[];
  records: MedicalRecord[];
  prescriptions: Prescription[];
  createTicket: (priority: Priority, specialtyId: string) => Ticket;
  callNext: (specialtyId?: string) => Ticket | null;
  registerPatient: (ticketId: string, name: string, cpf?: string, phone?: string) => void;
  assignDoctor: (ticketId: string, doctorId: string) => void;
  startAttendance: (ticketId: string) => void;
  completeAttendance: (ticketId: string) => void;
  addRecord: (record: Omit<MedicalRecord, 'createdAt'>) => void;
  addPrescription: (prescription: Omit<Prescription, 'id' | 'date'>) => void;
  getCurrentTicket: () => Ticket | undefined;
  getWaitingTickets: (specialtyId?: string) => Ticket[];
  getDoctorQueue: (doctorId: string) => Ticket[];
}

const ClinicContext = createContext<ClinicContextType | null>(null);

let normalCounter = 0;
let priorityCounter = 0;

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  const createTicket = useCallback((priority: Priority, specialtyId: string) => {
    const prefix = priority === 'priority' ? 'P' : 'N';
    const counter = priority === 'priority' ? ++priorityCounter : ++normalCounter;
    const code = `${prefix}${String(counter).padStart(3, '0')}`;
    
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      code,
      priority,
      specialtyId,
      status: 'waiting',
      createdAt: new Date(),
    };

    // Auto-assign doctor
    const doctor = DOCTORS.find(d => d.specialtyId === specialtyId);
    if (doctor) {
      ticket.doctorId = doctor.id;
      ticket.room = doctor.room;
    }

    setTickets(prev => [...prev, ticket]);
    return ticket;
  }, []);

  const callNext = useCallback((specialtyId?: string) => {
    setTickets(prev => {
      const waiting = prev
        .filter(t => t.status === 'waiting' && (!specialtyId || t.specialtyId === specialtyId))
        .sort((a, b) => {
          if (a.priority === 'priority' && b.priority !== 'priority') return -1;
          if (b.priority === 'priority' && a.priority !== 'priority') return 1;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      if (waiting.length === 0) return prev;

      const next = waiting[0];
      return prev.map(t => t.id === next.id ? { ...t, status: 'in_progress' as const, calledAt: new Date() } : t);
    });
    return null;
  }, []);

  const registerPatient = useCallback((ticketId: string, name: string, cpf?: string, phone?: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, patientName: name, patientCpf: cpf, patientPhone: phone } : t));
  }, []);

  const assignDoctor = useCallback((ticketId: string, doctorId: string) => {
    const doctor = DOCTORS.find(d => d.id === doctorId);
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, doctorId, room: doctor?.room } : t));
  }, []);

  const startAttendance = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'in_progress' as const, calledAt: new Date() } : t));
  }, []);

  const completeAttendance = useCallback((ticketId: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'completed' as const } : t));
  }, []);

  const addRecord = useCallback((record: Omit<MedicalRecord, 'createdAt'>) => {
    setRecords(prev => [...prev, { ...record, createdAt: new Date() }]);
  }, []);

  const addPrescription = useCallback((prescription: Omit<Prescription, 'id' | 'date'>) => {
    setPrescriptions(prev => [...prev, { ...prescription, id: crypto.randomUUID(), date: new Date() }]);
  }, []);

  const getCurrentTicket = useCallback(() => {
    return tickets.find(t => t.status === 'in_progress');
  }, [tickets]);

  const getWaitingTickets = useCallback((specialtyId?: string) => {
    return tickets
      .filter(t => t.status === 'waiting' && (!specialtyId || t.specialtyId === specialtyId))
      .sort((a, b) => {
        if (a.priority === 'priority' && b.priority !== 'priority') return -1;
        if (b.priority === 'priority' && a.priority !== 'priority') return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }, [tickets]);

  const getDoctorQueue = useCallback((doctorId: string) => {
    return tickets
      .filter(t => t.doctorId === doctorId && t.status !== 'completed')
      .sort((a, b) => {
        if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
        if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
        if (a.priority === 'priority' && b.priority !== 'priority') return -1;
        if (b.priority === 'priority' && a.priority !== 'priority') return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }, [tickets]);

  return (
    <ClinicContext.Provider value={{
      tickets, specialties: SPECIALTIES, doctors: DOCTORS, records, prescriptions,
      createTicket, callNext, registerPatient, assignDoctor,
      startAttendance, completeAttendance, addRecord, addPrescription,
      getCurrentTicket, getWaitingTickets, getDoctorQueue,
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
