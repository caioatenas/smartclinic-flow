import { useState } from 'react';
import { toast } from 'sonner';
import { useClinic } from '@/lib/clinic-context';
import { localDateTime, medicationSchema, triageSchema, type CareType } from '@/lib/nursing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export function NursingCareHistory({ referralId }: { referralId: string }) {
  const { administrations, triages } = useClinic();
  return <div className="space-y-3 text-sm">
    {administrations.filter(m => m.referral_id === referralId).map(m => <div key={m.id} className="border-l-2 border-accent pl-3 space-y-1"><p className="font-medium">{m.medication} — {m.dose} · {m.route}</p><p className="text-muted-foreground">Administrado em {new Date(m.administered_at).toLocaleString('pt-BR')}</p>{m.notes && <p className="break-words">{m.notes}</p>}</div>)}
    {triages.filter(t => t.referral_id === referralId).map(t => <div key={t.id} className="border-l-2 border-info pl-3 space-y-1"><p className="font-medium">PA {t.systolic}/{t.diastolic} mmHg · FC {t.pulse} bpm · FR {t.respiratory_rate} irpm</p><p>{t.temperature} °C · SpO₂ {t.oxygen}% · Dor {t.pain}/10</p><p className={t.risk === 'alto' ? 'text-destructive font-semibold' : t.risk === 'atencao' ? 'text-warning font-semibold' : 'text-muted-foreground'}>{t.risk === 'alto' ? 'Alto risco' : t.risk === 'atencao' ? 'Atenção' : 'Sem alerta registrado'}{t.alerts && ` — ${t.alerts}`}</p>{t.notes && <p className="break-words">{t.notes}</p>}<p className="text-muted-foreground">Aferido em {new Date(t.measured_at).toLocaleString('pt-BR')}</p></div>)}
  </div>;
}

export default function NursingCare({ referralId, kind, disabled }: { referralId: string; kind: CareType; disabled: boolean }) {
  const { recordNursingCare } = useClinic();
  const [values, setValues] = useState<Record<string,string>>({ risk: 'sem_alerta', time: localDateTime(), notes: '', alerts: '', medication: '', dose: '', route: '' });
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = (kind === 'medication' ? medicationSchema : triageSchema).safeParse(values);
    if (!parsed.success) { toast.error('Confira os campos obrigatórios, valores e descrição do risco.'); return; }
    setSaving(true);
    try { if (await recordNursingCare(referralId, kind, { ...parsed.data, time: new Date(parsed.data.time).toISOString() })) setValues({ risk:'sem_alerta',time:localDateTime(),notes:'',alerts:'',medication:'',dose:'',route:'' }); } finally { setSaving(false); }
  };
  if (kind === 'general') return null;
  const vitals = [['systolic','Pressão sistólica (mmHg)',1,400],['diastolic','Pressão diastólica (mmHg)',1,300],['pulse','Frequência cardíaca (bpm)',1,350],['respiratory_rate','Frequência respiratória (irpm)',1,150],['temperature','Temperatura (°C)',20,50],['oxygen','Saturação SpO₂ (%)',0,100],['pain','Dor (0–10)',0,10]] as const;
  return <section className="space-y-4 border-y border-border py-5"><h3 className="font-semibold">{kind === 'medication' ? 'Medicação administrada' : 'Triagem de enfermagem'}</h3><NursingCareHistory referralId={referralId} /><form onSubmit={e => void save(e)} className="space-y-4"><fieldset disabled={disabled || saving} className="space-y-4">
    {kind === 'medication' ? <div className="grid sm:grid-cols-2 gap-3">{[['medication','Medicamento'],['dose','Dose administrada']].map(([key,label]) => <label key={key} className="text-sm space-y-1 block">{label}<Input required value={values[key] || ''} maxLength={key === 'medication' ? 200 : 100} onChange={e => set(key,e.target.value)} /></label>)}<label className="text-sm space-y-1 block">Via de administração<Select value={values.route} onValueChange={v => set('route',v)}><SelectTrigger aria-label="Via de administração"><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{['Oral','Intravenosa','Intramuscular','Subcutânea','Inalatória','Tópica','Outra'].map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></label></div> : <><div className="grid sm:grid-cols-2 gap-3">{vitals.map(([key,label,min,max]) => <label key={key} className="text-sm space-y-1 block">{label}<Input type="number" step="any" required min={min} max={max} value={values[key] || ''} onChange={e => set(key,e.target.value)} /></label>)}</div><label className="text-sm block space-y-1">Classificação da enfermagem<Select value={values.risk} onValueChange={v => set('risk',v)}><SelectTrigger aria-label="Classificação da enfermagem"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sem_alerta">Sem alerta registrado</SelectItem><SelectItem value="atencao">Atenção</SelectItem><SelectItem value="alto">Alto risco</SelectItem></SelectContent></Select></label><label className="text-sm block space-y-1">Alertas de risco<Textarea required={values.risk !== 'sem_alerta'} maxLength={4000} value={values.alerts} onChange={e => set('alerts',e.target.value)} /></label></>}
    <label className="text-sm block space-y-1">{kind === 'medication' ? 'Horário de administração' : 'Horário da aferição'}<Input type="datetime-local" step="1" required value={values.time} onChange={e => set('time',e.target.value)} /></label><label className="text-sm block space-y-1">Observações do registro<Textarea value={values.notes} maxLength={4000} onChange={e => set('notes',e.target.value)} /></label><Button type="submit" disabled={disabled || saving}>{kind === 'medication' ? 'Registrar administração' : 'Salvar triagem'}</Button>
  </fieldset></form></section>;
}