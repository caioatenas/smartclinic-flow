import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { ArrowLeft, Activity, Clock } from 'lucide-react';

const statusConfig: Record<string, { label: string; color: string }> = {
  aguardando_recepcao: { label: 'Aguardando Recepção', color: 'bg-warning/20 text-warning' },
  em_atendimento_recepcao: { label: 'Na Recepção', color: 'bg-accent/20 text-accent' },
  aguardando_medico: { label: 'Aguardando Médico', color: 'bg-primary/20 text-primary' },
  em_atendimento_medico: { label: 'Em Consulta', color: 'bg-accent/20 text-accent' },
  finalizado: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
};

const AssistantPage = () => {
  const navigate = useNavigate();
  const { tickets, specialties } = useClinic();

  const getSpecialty = (id: string) => specialties.find(s => s.id === id);

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
        <h2 className="text-lg font-semibold text-foreground mb-4">Todos os Pacientes</h2>
        <div className="space-y-2">
          {sorted.map(t => {
            const cfg = statusConfig[t.status] || { label: t.status, color: '' };
            return (
              <div key={t.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className={`text-lg font-bold min-w-[70px] ${t.priority === 'priority' ? 'text-warning' : 'text-primary'}`}>
                  {t.code}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{t.patientName || 'Sem cadastro'}</div>
                  <div className="text-sm text-muted-foreground">{getSpecialty(t.specialtyId)?.name}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>{cfg.label}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {t.createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
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
