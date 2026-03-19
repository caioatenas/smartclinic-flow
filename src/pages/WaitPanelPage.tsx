import { useClinic } from '@/lib/clinic-context';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';

const WaitPanelPage = () => {
  const navigate = useNavigate();
  const { tickets, specialties, doctors } = useClinic();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Being called at reception
  const calledReception = tickets.filter(t => t.status === 'em_atendimento_recepcao');
  // Being called by doctor
  const calledDoctor = tickets.filter(t => t.status === 'em_atendimento_medico');
  // Waiting for reception
  const waitingReception = tickets
    .filter(t => t.status === 'aguardando_recepcao')
    .sort((a, b) => {
      if (a.priority === 'priority' && b.priority !== 'priority') return -1;
      if (b.priority === 'priority' && a.priority !== 'priority') return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, 6);
  // Waiting for doctor
  const waitingDoctor = tickets
    .filter(t => t.status === 'aguardando_medico')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, 6);

  const allCalled = [...calledReception, ...calledDoctor];
  const getSpecialty = (id: string) => specialties.find(s => s.id === id);
  const getDoctor = (id?: string) => doctors.find(d => d.id === id);

  return (
    <div className="min-h-screen bg-panel text-panel-foreground p-8">
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-panel-foreground/60 hover:text-panel-foreground transition-colors">
        <ArrowLeft className="w-8 h-8" />
      </button>

      <div className="flex items-center justify-center gap-3 mb-10">
        <Activity className="w-10 h-10 text-panel-highlight" />
        <h1 className="text-4xl font-bold">Clini<span className="text-panel-highlight">Plus</span></h1>
        <span className="ml-4 text-panel-foreground/60 text-lg">Painel de Chamadas</span>
      </div>

      {allCalled.length > 0 ? (
        <div className="mb-10">
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
                  <div className="text-panel-foreground/50 text-sm mt-1">
                    {getDoctor(t.doctorId)?.name}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center mb-10 text-panel-foreground/40 text-xl">
          Nenhuma senha sendo chamada no momento
        </div>
      )}

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Waiting for reception */}
        <div>
          <h2 className="text-lg font-semibold text-panel-foreground/70 mb-4 text-center">Aguardando Recepção</h2>
          {waitingReception.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {waitingReception.map(t => (
                <div key={t.id} className="bg-panel-foreground/10 rounded-xl p-4 text-center">
                  <div className={`text-2xl font-bold ${t.priority === 'priority' ? 'text-warning' : 'text-panel-foreground'}`}>
                    {t.code}
                  </div>
                  <div className="text-sm text-panel-foreground/50 mt-1">
                    {getSpecialty(t.specialtyId)?.name}
                  </div>
                  {t.priority === 'priority' && (
                    <span className="inline-block mt-1 text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full">Prioritário</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-panel-foreground/40">Nenhuma senha na fila</div>
          )}
        </div>

        {/* Waiting for doctor */}
        <div>
          <h2 className="text-lg font-semibold text-panel-foreground/70 mb-4 text-center">Aguardando Médico</h2>
          {waitingDoctor.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {waitingDoctor.map(t => (
                <div key={t.id} className="bg-panel-foreground/10 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-panel-foreground">{t.code}</div>
                  <div className="text-sm font-medium text-panel-foreground/80 mt-1">{t.patientName}</div>
                  <div className="text-xs text-panel-foreground/50 mt-1">
                    {getSpecialty(t.specialtyId)?.name} • {t.room}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-panel-foreground/40">Nenhum paciente aguardando</div>
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
