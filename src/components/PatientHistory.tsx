import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinic } from '@/lib/clinic-context';
import { formatCpf, onlyDigits } from '@/lib/cpf';
import { History, Pill, ChevronDown } from 'lucide-react';

type Visit = {
  id: string; date: string; doctorId: string | null; specialtyId: string;
  complaint?: string; observations?: string; diagnosis?: string;
  meds: { name?: string; dosage?: string; instructions?: string }[];
};

const PatientHistory = ({ ticketId, cpf, name }: { ticketId: string; cpf?: string; name?: string }) => {
  const { doctors, specialties } = useClinic();
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setVisits(null);
      const digits = cpf ? onlyDigits(cpf) : '';
      let q = supabase.from('tickets').select('id, created_at, doctor_id, specialty_id')
        .eq('status', 'finalizado').neq('id', ticketId).order('created_at', { ascending: false }).limit(20);
      if (digits.length === 11) q = q.in('patient_cpf', [digits, formatCpf(digits)]);
      else if (name) q = q.ilike('patient_name', name.trim());
      else { setVisits([]); return; }
      const { data: ts } = await q;
      const ids = (ts || []).map(t => t.id);
      const [recs, rx] = ids.length
        ? await Promise.all([
            supabase.from('medical_records').select('*').in('ticket_id', ids),
            supabase.from('prescriptions').select('*').in('ticket_id', ids),
          ])
        : [{ data: [] }, { data: [] }];
      if (cancelled) return;
      setVisits((ts || []).map(t => {
        const r = (recs.data || []).find(x => x.ticket_id === t.id);
        const meds = (rx.data || []).filter(x => x.ticket_id === t.id)
          .flatMap(x => (Array.isArray(x.medications) ? x.medications : []) as Visit['meds']);
        return { id: t.id, date: t.created_at, doctorId: t.doctor_id, specialtyId: t.specialty_id,
          complaint: r?.complaint, observations: r?.observations, diagnosis: r?.diagnosis, meds };
      }));
    })();
    return () => { cancelled = true; };
  }, [ticketId, cpf, name]);

  return (
    <div className="mt-6 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-primary" /> Histórico do paciente
        {visits && <span className="text-muted-foreground font-normal">({visits.length})</span>}
      </h3>
      {!cpf && <p className="text-xs text-muted-foreground mb-2">Sem CPF — buscando pelo nome.</p>}
      {visits === null ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : visits.length === 0 ? (
        <p className="text-sm text-muted-foreground">Primeira consulta — nenhum atendimento anterior.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {visits.map(v => (
            <div key={v.id} className="rounded-lg bg-muted/40 p-3">
              <button className="w-full flex items-center gap-2 text-left" onClick={() => setOpen(open === v.id ? null : v.id)}>
                <span className="text-sm font-medium text-foreground">{new Date(v.date).toLocaleDateString('pt-BR')}</span>
                <span className="text-xs text-muted-foreground flex-1 truncate">
                  {specialties.find(s => s.id === v.specialtyId)?.name} • {doctors.find(d => d.id === v.doctorId)?.name || 'Médico'}
                  {v.diagnosis ? ` • ${v.diagnosis}` : ''}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open === v.id ? 'rotate-180' : ''}`} />
              </button>
              {open === v.id && (
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Queixa:</span> {v.complaint || '—'}</p>
                  <p><span className="text-muted-foreground">Observações:</span> {v.observations || '—'}</p>
                  <p><span className="text-muted-foreground">Diagnóstico:</span> {v.diagnosis || '—'}</p>
                  {v.meds.length > 0 && (
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1"><Pill className="w-3 h-3" /> Receita:</span>
                      <ul className="ml-4 list-disc">
                        {v.meds.map((m, i) => <li key={i}>{[m.name, m.dosage, m.instructions].filter(Boolean).join(' — ')}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientHistory;
