import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, DoorOpen } from 'lucide-react';
import { useClinic } from '@/lib/clinic-context';
import { useAuth } from '@/lib/auth-context';
import { orderedRoomQueue } from '@/lib/referrals';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import NursingCare from '@/components/NursingCare';
import { careLabels, canConcludeCare, type CareType } from '@/lib/nursing';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function RoomsPage() {
  const { officeId } = useParams();
  const { offices, referrals, tickets, doctors, connected, callNextRoom, completeReferral, administrations, triages, setOfficeCareType } = useClinic();
  const { user, role } = useAuth();
  const [outcome, setOutcome] = useState('');
  const [busy, setBusy] = useState(false);
  const office = offices.find(o => o.id === officeId);
  const current = referrals.find(r => r.office_id === officeId && r.status === 'em_atendimento');
  const patient = tickets.find(t => t.id === current?.ticket_id);
  const queue = orderedRoomQueue(referrals, tickets, officeId || '');
  const occupied = tickets.some(t => t.officeId === officeId && t.status === 'em_atendimento_medico');
  useEffect(() => setOutcome(''), [current?.id]);
  if (!connected) return <div className="p-6 text-muted-foreground">Carregando salas…</div>;
  if (!officeId) return <main className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
    <Button asChild variant="ghost"><Link to="/"><ArrowLeft className="size-4" /> Início</Link></Button>
    <div className="flex flex-wrap gap-3 items-center justify-between"><h1 className="text-2xl font-bold flex gap-2 items-center"><DoorOpen className="text-accent" /> Salas de atendimento</h1><Button asChild variant="outline"><Link to="/beds">Gestão de Leitos</Link></Button></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{offices.filter(o => o.active).map(o => <Button asChild variant="outline" key={o.id} className="h-auto p-5 justify-start whitespace-normal text-left"><Link to={`/rooms/${o.id}`}><DoorOpen className="size-5 shrink-0" /><span className="min-w-0 break-words">{o.name}<span className="block text-xs text-muted-foreground">{referrals.filter(r => r.office_id === o.id && r.status === 'aguardando').length} aguardando</span></span></Link></Button>)}</div>
    {!offices.some(o => o.active) && <p className="text-muted-foreground">Nenhuma sala ativa cadastrada.</p>}
  </main>;
  if (!office) return <main className="p-6 space-y-4"><h1 className="text-xl font-semibold">Sala não encontrada</h1><Button asChild variant="outline"><Link to="/rooms">Voltar às salas</Link></Button></main>;
  const handleCall = async () => { setBusy(true); try { await callNextRoom(office.id); } finally { setBusy(false); } };
  const handleComplete = async () => { if (!current) return; setBusy(true); try { if (await completeReferral(current.id, outcome)) setOutcome(''); } finally { setBusy(false); } };
  const kind = office.careType || 'general';
  const allowed = role === 'admin' || current?.handled_by === user?.id;
  const hasCare = canConcludeCare(kind, administrations.filter(m=>m.referral_id===current?.id).length, triages.filter(t=>t.referral_id===current?.id).length);
  return <main className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
    <header className="flex flex-wrap items-center gap-3"><Button asChild variant="ghost" size="icon" aria-label="Voltar às salas"><Link to="/rooms"><ArrowLeft className="size-5" /></Link></Button><h1 className="text-2xl font-bold break-words flex-1">{office.name}</h1><Button onClick={() => void handleCall()} disabled={busy || !office.active || !!current || occupied || !queue.length}>Chamar próximo</Button></header>
    {!office.active && <p className="text-warning">Sala inativa para novas chamadas.</p>}
    <div className="flex flex-wrap gap-4 items-center"><p className="font-medium text-accent">{careLabels[kind]}</p><Button asChild variant="outline" size="sm"><Link to="/beds">Leitos</Link></Button>{role==='admin' && <Select value={kind} onValueChange={v=>void setOfficeCareType(office.id,v as CareType)} disabled={!!current || busy}><SelectTrigger aria-label="Tipo de atendimento da sala" className="w-full sm:w-64"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(careLabels).map(([key,label])=><SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select>}</div>
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 space-y-4 min-w-0">
        {current ? <><div><span className="text-3xl font-bold text-accent">{patient?.code}</span><h2 className="text-xl font-semibold break-words">{patient?.patientName || 'Paciente indisponível'}</h2><p className="text-sm text-muted-foreground">Encaminhado por {doctors.find(d => d.id === current.doctor_id)?.name || 'Médico'}</p></div><div className="border-y border-border py-4"><h3 className="font-medium mb-2">Motivo do encaminhamento</h3><p className="whitespace-pre-wrap break-words">{current.reason}</p></div><NursingCare key={current.id + kind} referralId={current.id} kind={kind} disabled={busy || !allowed} /><label htmlFor="room-outcome" className="block text-sm font-medium">Conclusão do atendimento</label><Textarea id="room-outcome" value={outcome} onChange={e => setOutcome(e.target.value)} maxLength={4000} disabled={busy || !allowed} /><Button onClick={() => void handleComplete()} disabled={busy || !outcome.trim() || !hasCare || !allowed}>Concluir e devolver ao médico</Button>{!allowed && <p className="text-sm text-muted-foreground">A conclusão cabe ao profissional que chamou este paciente.</p>}</> : <p className="text-muted-foreground py-12">{occupied ? 'Sala ocupada por uma consulta médica.' : 'Nenhum encaminhamento em atendimento.'}</p>}
      </section>
      <section className="min-w-0"><h2 className="font-semibold mb-4">Aguardando ({queue.length})</h2><div className="divide-y divide-border">{queue.map(r => { const t = tickets.find(t => t.id === r.ticket_id); return <div key={r.id} className="py-3 flex gap-3"><span className="font-bold text-primary">{t?.code}</span><span className="break-words min-w-0">{t?.patientName || 'Paciente'}</span></div>; })}</div>{!queue.length && <p className="text-sm text-muted-foreground">Fila vazia</p>}</section>
    </div>
  </main>;
}