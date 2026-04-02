import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { ArrowLeft, Activity, Clock, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDuration } from '@/lib/time-utils';
import type { Ticket } from '@/lib/clinic-types';

const statusConfig: Record<string, { label: string; color: string }> = {
  aguardando_recepcao: { label: 'Aguardando Recepção', color: 'bg-warning/20 text-warning' },
  em_atendimento_recepcao: { label: 'Na Recepção', color: 'bg-accent/20 text-accent' },
  aguardando_medico: { label: 'Aguardando Médico', color: 'bg-primary/20 text-primary' },
  em_atendimento_medico: { label: 'Em Consulta', color: 'bg-accent/20 text-accent' },
  finalizado: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
};

function useLiveDuration(startDate: Date | undefined, endDate: Date | undefined, active: boolean): string {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active || !startDate) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active, startDate]);

  if (!startDate) return '--';
  const end = endDate ? endDate.getTime() : now;
  return formatDuration(end - startDate.getTime());
}

const TimeRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-foreground">{value}</span>
  </div>
);

const PatientTimeline = ({ t }: { t: Ticket }) => {
  const isFinished = t.status === 'finalizado';

  const t1 = useLiveDuration(t.horaChegada, t.horaChamadaRecepcao, !t.horaChamadaRecepcao && t.status === 'aguardando_recepcao');
  const t2 = useLiveDuration(t.horaChamadaRecepcao, t.horaFimRecepcao, !!t.horaChamadaRecepcao && !t.horaFimRecepcao);
  const t3 = useLiveDuration(t.horaFimRecepcao, t.horaChamadaMedico, !!t.horaFimRecepcao && !t.horaChamadaMedico);
  const t4 = useLiveDuration(t.horaChamadaMedico, t.horaFimAtendimento, !!t.horaChamadaMedico && !t.horaFimAtendimento);

  const total = isFinished && t.horaFimAtendimento
    ? formatDuration(t.horaFimAtendimento.getTime() - t.horaChegada.getTime())
    : formatDuration(Date.now() - t.horaChegada.getTime());

  return (
    <div className="space-y-1.5 mt-2 pt-2 border-t border-border/50">
      <TimeRow label="⏳ Espera recepção" value={t1} />
      {t.horaChamadaRecepcao && <TimeRow label="📋 Na recepção" value={t2} />}
      {t.horaFimRecepcao && <TimeRow label="⏳ Espera médico" value={t3} />}
      {t.horaChamadaMedico && <TimeRow label="🩺 Atendimento" value={t4} />}
      <div className="flex justify-between text-xs font-bold pt-1 border-t border-border/30">
        <span className="text-muted-foreground">⏱ Total</span>
        <span className="text-primary">{total}</span>
      </div>
    </div>
  );
};

const AssistantPage = () => {
  const navigate = useNavigate();
  const { tickets, specialties, doctors } = useClinic();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  // Force re-render every second for live times in summary
  useEffect(() => {
    const id = setInterval(() => setTick(c => c + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const getSpecialty = (id: string) => specialties.find(s => s.id === id);
  const getDoctor = (id?: string) => doctors.find(d => d.id === id);
  

  const sorted = [...tickets].sort((a, b) => {
    const order: Record<string, number> = { em_atendimento_medico: 0, em_atendimento_recepcao: 1, aguardando_medico: 2, aguardando_recepcao: 3, finalizado: 4 };
    return (order[a.status] ?? 5) - (order[b.status] ?? 5) || b.createdAt.getTime() - a.createdAt.getTime();
  });

  const counts = {
    aguardando_recepcao: tickets.filter(t => t.status === 'aguardando_recepcao').length,
    aguardando_medico: tickets.filter(t => t.status === 'aguardando_medico').length,
    em_atendimento: tickets.filter(t => t.status === 'em_atendimento_recepcao' || t.status === 'em_atendimento_medico').length,
    finalizado: tickets.filter(t => t.status === 'finalizado').length,
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Activity className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Assistente</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8 max-w-2xl">
        <div className="panel-card bg-warning/10 text-center">
          <div className="text-3xl font-bold text-warning">{counts.aguardando_recepcao}</div>
          <div className="text-xs text-muted-foreground">Ag. Recepção</div>
        </div>
        <div className="panel-card bg-primary/10 text-center">
          <div className="text-3xl font-bold text-primary">{counts.aguardando_medico}</div>
          <div className="text-xs text-muted-foreground">Ag. Médico</div>
        </div>
        <div className="panel-card bg-accent/10 text-center">
          <div className="text-3xl font-bold text-accent">{counts.em_atendimento}</div>
          <div className="text-xs text-muted-foreground">Em Atendimento</div>
        </div>
        <div className="panel-card bg-muted text-center">
          <div className="text-3xl font-bold text-muted-foreground">{counts.finalizado}</div>
          <div className="text-xs text-muted-foreground">Finalizados</div>
        </div>
      </div>

      <div className="panel-card bg-card border border-border max-w-3xl">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Timer className="w-5 h-5 text-accent" /> Todos os Pacientes
        </h2>
        <div className="space-y-2">
          {sorted.map(t => {
            const cfg = statusConfig[t.status] || { label: t.status, color: '' };
            const doctor = getDoctor(t.doctorId);
            const doctorType = doctor ? getDoctorType(doctor.doctorTypeId) : null;
            const expanded = expandedId === t.id;

            return (
              <div
                key={t.id}
                className="p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedId(expanded ? null : t.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold min-w-[70px] ${t.priority === 'priority' ? 'text-warning' : 'text-primary'}`}>
                    {t.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{t.patientName || 'Sem cadastro'}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {getSpecialty(t.specialtyId)?.name}
                      {doctorType && <span className="ml-1 text-xs">• {doctorType.name}</span>}
                      {doctor && <span className="ml-1 text-xs">• {doctor.name}</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${cfg.color}`}>{cfg.label}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <Clock className="w-3 h-3" />
                    {t.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
                {expanded && <PatientTimeline t={t} />}
              </div>
            );
          })}
          {sorted.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum paciente registrado</p>}
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
