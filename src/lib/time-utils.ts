import { Ticket } from './clinic-types';

export function formatDuration(ms: number): string {
  if (ms < 0) return '--';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
}

export function tempoAteRecepcao(t: Ticket): number | null {
  if (!t.horaChamadaRecepcao) return null;
  return t.horaChamadaRecepcao.getTime() - t.horaChegada.getTime();
}

export function tempoNaRecepcao(t: Ticket): number | null {
  if (!t.horaChamadaRecepcao || !t.horaFimRecepcao) return null;
  return t.horaFimRecepcao.getTime() - t.horaChamadaRecepcao.getTime();
}

export function tempoEsperaMedico(t: Ticket): number | null {
  if (!t.horaFimRecepcao || !t.horaChamadaMedico) return null;
  return t.horaChamadaMedico.getTime() - t.horaFimRecepcao.getTime();
}

export function tempoAtendimentoMedico(t: Ticket): number | null {
  if (!t.horaChamadaMedico || !t.horaFimAtendimento) return null;
  return t.horaFimAtendimento.getTime() - t.horaChamadaMedico.getTime();
}

export function tempoTotal(t: Ticket): number | null {
  if (!t.horaFimAtendimento) return null;
  return t.horaFimAtendimento.getTime() - t.horaChegada.getTime();
}

export function tempoEsperaAtual(t: Ticket): number {
  return Date.now() - t.horaChegada.getTime();
}

export function calcularMedias(tickets: Ticket[]) {
  const finalizados = tickets.filter(t => t.status === 'finalizado' && t.horaFimAtendimento);
  if (finalizados.length === 0) return null;

  let sumEspera = 0, sumAtend = 0, sumTotal = 0, count = 0;
  for (const t of finalizados) {
    const te = tempoAteRecepcao(t);
    const ta = tempoAtendimentoMedico(t);
    const tt = tempoTotal(t);
    if (te !== null) sumEspera += te;
    if (ta !== null) sumAtend += ta;
    if (tt !== null) { sumTotal += tt; count++; }
  }

  return {
    mediaEspera: count > 0 ? sumEspera / finalizados.length : 0,
    mediaAtendimento: count > 0 ? sumAtend / finalizados.length : 0,
    mediaTotal: count > 0 ? sumTotal / count : 0,
    totalAtendimentos: finalizados.length,
  };
}
