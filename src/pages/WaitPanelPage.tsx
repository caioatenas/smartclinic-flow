import { useClinic } from '@/lib/clinic-context';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDuration, tempoEsperaAtual } from '@/lib/time-utils';

const WaitPanelPage = () => {
  const navigate = useNavigate();
  const { tickets, specialties, doctors } = useClinic();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const calledReception = tickets.filter(t => t.status === 'em_atendimento_recepcao');
  const calledDoctor = tickets.filter(t => t.status === 'em_atendimento_medico');
  const waitingReception = tickets
    .filter(t => t.status === 'aguardando_recepcao')
    .sort((a, b) => {
      if (a.priority === 'priority' && b.priority !== 'priority') return -1;
      if (b.priority === 'priority' && a.priority !== 'priority') return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, 6);
  const waitingDoctor = tickets
    .filter(t => t.status === 'aguardando_medico')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, 6);
  const finalizados = tickets
    .filter(t => t.status === 'finalizado')
    .sort((a, b) => (b.horaFimAtendimento?.getTime() || 0) - (a.horaFimAtendimento?.getTime() || 0))
    .slice(0, 8);

  const allCalled = [...calledReception, ...calledDoctor];
  const getSpecialty = (id: string) => specialties.find(s => s.id === id);
  const getDoctor = (id?: string) => doctors.find(d => d.id === id);

  const statusBadge = (status: string) => {
    switch (status) {
      case 'em_atendimento_recepcao': return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">📋 Recepção</span>;
      case 'em_atendimento_medico': return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">🩺 Consulta</span>;
      case 'aguardando_recepcao': return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Aguardando</span>;
      case 'aguardando_medico': return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Ag. Médico</span>;
      case 'finalizado': return <span className="text-xs bg-panel-foreground/20 text-panel-foreground/50 px-2 py-0.5 rounded-full">Finalizado</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-panel text-panel-foreground p-8">
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-panel-foreground/60 hover:text-panel-foreground transition-colors">
        <ArrowLeft className="w-8 h-8" />
      </button>

      <div className="flex items-center justify-center gap-3 mb-8">
        <Activity className="w-10 h-10 text-panel-highlight" />
        <h1 className="text-4xl font-bold">Clini<span className="text-panel-highlight">Plus</span></h1>
        <span className="ml-4 text-panel-foreground/60 text-lg">Painel de Chamadas</span>
      </div>

      {allCalled.length > 0 ? (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-panel-highlight mb-4 text-center">🔔 Chamando Agora</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {allCalled.map(t => (
              <div key={t.id} className="bg-panel-highlight/20 border-2 border-panel-highlight rounded-2xl p-8 text-center animate-slide-in">
                <div className="text-6xl font-black text-panel-highlight mb-2">{t.code}</div>
                <div className="text-2xl font-semibold">{t.patientName || '---'}</div>
                <div className="text-panel-foreground/70 mt-2">
                  {t.status === 'em_atendimento_recepcao'
                    ? '📋 Recepção'
                    : `${getSpecialty(t.specialtyId)?.name} • ${t.room || ''}`}
                </div>
                {t.status === 'em_atendimento_medico' && (
                  <div className="text-panel-foreground/50 text-sm mt-1">{getDoctor(t.doctorId)?.name}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center mb-8 text-panel-foreground/40 text-xl">
          Nenhuma senha sendo chamada no momento
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Waiting for reception */}
        <div>
          <h2 className="text-lg font-semibold text-yellow-400 mb-4 text-center">🟡 Aguardando Recepção</h2>
          {waitingReception.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {waitingReception.map(t => (
                <div key={t.id} className="bg-panel-foreground/10 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${t.priority === 'priority' ? 'text-warning' : 'text-panel-foreground'}`}>
                    {t.code}
                  </div>
                  <div className="text-xs text-panel-foreground/50 mt-1">{getSpecialty(t.specialtyId)?.name}</div>
                  <div className="text-xs text-panel-foreground/40 mt-1">{formatDuration(tempoEsperaAtual(t))}</div>
                  {t.priority === 'priority' && (
                    <span className="inline-block mt-1 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">P</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-panel-foreground/40 text-sm">Fila vazia</div>
          )}
        </div>

        {/* Waiting for doctor */}
        <div>
          <h2 className="text-lg font-semibold text-blue-400 mb-4 text-center">🔵 Aguardando Médico</h2>
          {waitingDoctor.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {waitingDoctor.map(t => (
                <div key={t.id} className="bg-panel-foreground/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-panel-foreground">{t.code}</div>
                  <div className="text-sm font-medium text-panel-foreground/80 mt-1">{t.patientName}</div>
                  <div className="text-xs text-panel-foreground/50 mt-1">{getSpecialty(t.specialtyId)?.name} • {t.room}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-panel-foreground/40 text-sm">Nenhum aguardando</div>
          )}
        </div>

        {/* Finalized - History */}
        <div>
          <h2 className="text-lg font-semibold text-panel-foreground/50 mb-4 text-center">⚪ Finalizados ({finalizados.length})</h2>
          {finalizados.length > 0 ? (
            <div className="space-y-2">
              {finalizados.map(t => (
                <div key={t.id} className="bg-panel-foreground/5 rounded-lg p-3 flex items-center gap-3">
                  <span className="font-bold text-panel-foreground/40 text-sm">{t.code}</span>
                  <span className="text-sm text-panel-foreground/50 flex-1 truncate">{t.patientName || '---'}</span>
                  {t.priority === 'priority' && <span className="text-xs text-warning">P</span>}
                  {statusBadge(t.status)}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-panel-foreground/40 text-sm">Nenhum finalizado</div>
          )}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 text-panel-foreground/30 text-sm">
        {time.toLocaleDateString('pt-BR')} • {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default WaitPanelPage;
