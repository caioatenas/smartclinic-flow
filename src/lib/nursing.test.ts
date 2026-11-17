import { describe,it,expect } from 'vitest';
import { canConcludeCare, bedStatus, triageSchema, medicationSchema, type Bed } from './nursing';
describe('nursing workflows',()=>{
 it('requires an administered medication before concluding medication care',()=>{expect(canConcludeCare('medication',0,1)).toBe(false);expect(canConcludeCare('medication',1,0)).toBe(true);});
 it('requires saved vital signs before returning from triage',()=>{expect(canConcludeCare('triage',1,0)).toBe(false);expect(canConcludeCare('triage',0,1)).toBe(true);});
 it('occupied beds are not available',()=>{expect(bedStatus({ticket_id:'patient',availability:'disponivel'} as Bed)).toBe('ocupado');expect(bedStatus({ticket_id:null,availability:'higienizacao'} as Bed)).toBe('higienizacao');});
 it('requires medication, dose and administration route',()=>{expect(medicationSchema.safeParse({medication:'',dose:'',route:'',time:'2026-11-17T01:00',notes:''}).success).toBe(false);expect(medicationSchema.safeParse({medication:'Registro teste',dose:'1 dose',route:'Oral',time:'2026-11-17T01:00',notes:''}).success).toBe(true);});
 it('requires an explicit description for a staff-entered risk alert',()=>{const values={systolic:120,diastolic:80,pulse:80,respiratory_rate:16,temperature:36.5,oxygen:98,pain:0,risk:'alto',alerts:'',notes:'',time:'2026-11-17T01:00'};expect(triageSchema.safeParse(values).success).toBe(false);expect(triageSchema.safeParse({...values,alerts:'Alerta registrado pela equipe'}).success).toBe(true);expect(triageSchema.safeParse({...values,oxygen:101,alerts:'Teste'}).success).toBe(false);});
});