import { z } from 'zod';
import type { Tables } from '@/integrations/supabase/types';
export type CareType = 'general' | 'medication' | 'triage';
export type Bed = Tables<'beds'>;
export type BedMovement = Tables<'bed_movements'>;
export type MedicationAdministration = Tables<'medication_administrations'>;
export type NursingTriage = Tables<'nursing_triages'>;
export const careLabels: Record<CareType, string> = { general: 'Atendimento geral', medication: 'Sala de Medicação', triage: 'Triagem de Enfermagem' };
export function localDateTime() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 19);
}
export const medicationSchema = z.object({ medication: z.string().trim().min(1).max(200), dose: z.string().trim().min(1).max(100), route: z.string().trim().min(1).max(100), time: z.string().min(1), notes: z.string().max(4000) });
const numeric = (min: number, max: number) => z.preprocess(v => v === '' ? undefined : Number(v), z.number().min(min).max(max));
export const triageSchema = z.object({ systolic: numeric(1,400), diastolic: numeric(1,300), pulse: numeric(1,350), respiratory_rate: numeric(1,150), temperature: numeric(20,50), oxygen: numeric(0,100), pain: numeric(0,10), risk: z.enum(['sem_alerta','atencao','alto']), alerts: z.string().max(4000), notes: z.string().max(4000), time: z.string().min(1) }).refine(v => v.risk === 'sem_alerta' || !!v.alerts.trim(), { message: 'Descreva o alerta de risco.' });
export function canConcludeCare(kind: CareType, medications: number, triages: number) {
  return kind === 'medication' ? medications > 0 : kind === 'triage' ? triages > 0 : true;
}
export function bedStatus(bed: Bed) { return bed.ticket_id ? 'ocupado' : bed.availability; }