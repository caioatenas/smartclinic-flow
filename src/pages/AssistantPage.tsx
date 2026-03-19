import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { ArrowLeft, Activity, Clock } from 'lucide-react';

const AssistantPage = () => {
  const navigate = useNavigate();
  const { tickets, specialties } = useClinic();

  const getSpecialty = (id: string) => specialties.find(s => s.id === id);

  const statusConfig = {
    waiting: { label: 'Aguardando', color: 'bg-warning/20 text-warning' },
    in_progress: { label: 'Em Atendimento', color: 'bg-accent/20 text-accent' },
    completed: { label: 'Finalizado', color: 'bg-muted text-muted-foreground' },
  };

  const sorted = [...tickets].sort((a, b) => {
    const order = { in_progress: 0, waiting: 1, completed: 2 };
    return order[a.status] - order[b.status] || b.createdAt.getTime() - a.createdAt.getTime();
  });

  const waitingCount = tickets.filter(t => t.status === 'waiting').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const completedCount = tickets.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Activity className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Assistente</h1>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-xl">
        <div className="panel-card bg-warning/10 text-center">
          <div className="text-3xl font-bold text-warning">{waitingCount}</div>
          <div className="text-sm text-muted-foreground">Aguardando</div>
        </div>
        <div className="panel-card bg-accent/10 text-center">
          <div className="text-3xl font-bold text-accent">{inProgressCount}</div>
          <div className="text-sm text-muted-foreground">Em Atendimento</div>
        </div>
        <div className="panel-card bg-muted text-center">
          <div className="text-3xl font-bold text-muted-foreground">{completedCount}</div>
          <div className="text-sm text-muted-foreground">Finalizados</div>
        </div>
      </div>

      {/* Lista */}
      <div className="panel-card bg-card border border-border max-w-3xl">
        <h2 className="text-lg font-semibold text-foreground mb-4">Todos os Pacientes</h2>
        <div className="space-y-2">
          {sorted.map(t => {
            const cfg = statusConfig[t.status];
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
