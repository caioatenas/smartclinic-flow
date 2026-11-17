import { useClinic } from '@/lib/clinic-context';
import { NursingCareHistory } from './NursingCare';

export default function ReferralHistory({ ticketId }: { ticketId: string }) {
  const { referrals, offices } = useClinic();
  const history = referrals.filter(r => r.ticket_id === ticketId).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  if (!history.length) return null;
  return <section className="mt-6 border-t border-border pt-4 space-y-3">
    <h2 className="font-semibold">Encaminhamentos deste atendimento</h2>
    {history.map(r => <div key={r.id} className="border-b border-border pb-3 text-sm space-y-1">
      <div className="flex flex-wrap gap-2 justify-between"><span className="font-medium">{offices.find(o => o.id === r.office_id)?.name || 'Sala indisponível'}</span><span className="text-muted-foreground">{r.status === 'concluido' ? 'Concluído' : r.status === 'em_atendimento' ? 'Em atendimento' : 'Aguardando'}</span></div>
      <p className="whitespace-pre-wrap break-words">{r.reason}</p>
      {r.outcome && <p className="whitespace-pre-wrap break-words text-muted-foreground">Conclusão: {r.outcome}</p>}
      <NursingCareHistory referralId={r.id} />
      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString('pt-BR')}</p>
    </div>)}
  </section>;
}