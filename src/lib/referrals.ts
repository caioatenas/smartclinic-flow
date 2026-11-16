import type { Tables } from '@/integrations/supabase/types';
import type { Office, Ticket } from './clinic-types';

export type Referral = Tables<'referrals'>;
export function referralDestinations(offices: Office[], currentOfficeId?: string) {
  return offices.filter(o => o.active && o.id !== currentOfficeId);
}
export function orderedRoomQueue(referrals: Referral[], tickets: Ticket[], officeId: string) {
  const priority = { priority: 0, agendado: 1, normal: 2 };
  const byId = new Map(tickets.map(t => [t.id, t]));
  return referrals.filter(r => r.office_id === officeId && r.status === 'aguardando').sort((a, b) => {
    const pa = byId.get(a.ticket_id)?.priority ?? 'normal';
    const pb = byId.get(b.ticket_id)?.priority ?? 'normal';
    return priority[pa] - priority[pb] || Date.parse(a.created_at) - Date.parse(b.created_at);
  });
}