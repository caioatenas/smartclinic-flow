import { describe, it, expect } from 'vitest';
import { referralDestinations, orderedRoomQueue, type Referral } from './referrals';
import type { Ticket } from './clinic-types';

describe('room referrals', () => {
  it('offers only active destinations different from the current office', () => {
    expect(referralDestinations([{ id: 'one', name: 'Consulta', active: true }, { id: 'two', name: 'Destino', active: true }, { id: 'three', name: 'Inativa', active: false }], 'one').map(o => o.id)).toEqual(['two']);
  });
  it('orders the destination queue by priority and arrival without mixing rooms or completed referrals', () => {
    const referrals = [
      { id: 'n', ticket_id: 'n', office_id: 'two', status: 'aguardando', created_at: '2026-11-16T08:00:00Z' },
      { id: 'p2', ticket_id: 'p2', office_id: 'two', status: 'aguardando', created_at: '2026-11-16T10:00:00Z' },
      { id: 'a', ticket_id: 'a', office_id: 'two', status: 'aguardando', created_at: '2026-11-16T08:00:00Z' },
      { id: 'p1', ticket_id: 'p1', office_id: 'two', status: 'aguardando', created_at: '2026-11-16T09:00:00Z' },
      { id: 'done', office_id: 'two', status: 'concluido' }, { id: 'other', office_id: 'one', status: 'aguardando' },
    ] as Referral[];
    const tickets = [{ id: 'n', priority: 'normal' }, { id: 'a', priority: 'agendado' }, { id: 'p1', priority: 'priority' }, { id: 'p2', priority: 'priority' }] as Ticket[];
    expect(orderedRoomQueue(referrals, tickets, 'two').map(r => r.id)).toEqual(['p1', 'p2', 'a', 'n']);
  });
});