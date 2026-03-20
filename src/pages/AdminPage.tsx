import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { ArrowLeft, Activity, Users, Stethoscope, ListChecks, Clock, BarChart3 } from 'lucide-react';
import { calcularMedias, formatDuration } from '@/lib/time-utils';

const AdminPage = () => {
  const navigate = useNavigate();
  const { doctors, specialties, tickets } = useClinic();

  const totalToday = tickets.length;
  const waiting = tickets.filter(t => t.status === 'aguardando_recepcao' || t.status === 'aguardando_medico').length;
  const completed = tickets.filter(t => t.status === 'finalizado').length;
  const metrics = calcularMedias(tickets);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Activity className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="panel-card bg-card border border-border text-center">
          <ListChecks className="w-8 h-8 text-primary mx-auto mb-2" />
          <div className="text-3xl font-bold text-foreground">{totalToday}</div>
          <div className="text-sm text-muted-foreground">Total Senhas</div>
        </div>
        <div className="panel-card bg-card border border-border text-center">
          <div className="text-3xl font-bold text-warning">{waiting}</div>
          <div className="text-sm text-muted-foreground">Aguardando</div>
        </div>
        <div className="panel-card bg-card border border-border text-center">
          <div className="text-3xl font-bold text-accent">{completed}</div>
          <div className="text-sm text-muted-foreground">Finalizados</div>
        </div>
        <div className="panel-card bg-card border border-border text-center">
          <div className="text-3xl font-bold text-info">{doctors.length}</div>
          <div className="text-sm text-muted-foreground">Médicos</div>
        </div>
      </div>

      {/* Time Metrics */}
      <div className="panel-card bg-card border border-border mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-accent" /> Métricas de Tempo
        </h2>
        {metrics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">{formatDuration(metrics.mediaEspera)}</div>
              <div className="text-xs text-muted-foreground">Tempo médio espera</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <Clock className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">{formatDuration(metrics.mediaAtendimento)}</div>
              <div className="text-xs text-muted-foreground">Tempo médio atendimento</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">{formatDuration(metrics.mediaTotal)}</div>
              <div className="text-xs text-muted-foreground">Tempo total médio</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/30 text-center">
              <ListChecks className="w-5 h-5 text-accent mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">{metrics.totalAtendimentos}</div>
              <div className="text-xs text-muted-foreground">Atendimentos do dia</div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhum atendimento finalizado ainda</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Médicos */}
        <div className="panel-card bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-accent" /> Médicos
          </h2>
          <div className="space-y-3">
            {doctors.map(d => {
              const spec = specialties.find(s => s.id === d.specialtyId);
              const queueCount = tickets.filter(t => t.doctorId === d.id && t.status === 'aguardando_medico').length;
              const doneCount = tickets.filter(t => t.doctorId === d.id && t.status === 'finalizado').length;
              return (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {d.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{d.name}</div>
                    <div className="text-sm text-muted-foreground">{spec?.name} • {d.room}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm bg-accent/10 text-accent px-2 py-1 rounded-full">{queueCount} na fila</span>
                    <span className="text-xs text-muted-foreground">{doneCount} atendidos</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Especialidades */}
        <div className="panel-card bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" /> Especialidades
          </h2>
          <div className="space-y-3">
            {specialties.map(s => {
              const count = tickets.filter(t => t.specialtyId === s.id).length;
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <span className="text-2xl">{s.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{s.name}</div>
                  </div>
                  <span className="text-sm text-muted-foreground">{count} atendimentos</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
