import { useClinic } from '@/lib/clinic-context';
import { Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const WaitPanelPage = () => {
  const navigate = useNavigate();
  const { tickets, specialties, doctors } = useClinic();

  const current = tickets.filter(t => t.status === 'in_progress');
  const waiting = tickets
    .filter(t => t.status === 'waiting')
    .sort((a, b) => {
      if (a.priority === 'priority' && b.priority !== 'priority') return -1;
      if (b.priority === 'priority' && a.priority !== 'priority') return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, 8);

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

      {current.length > 0 ? (
        <div className="mb-10">
          <h2 className="text-xl font-semibold text-panel-highlight mb-4 text-center">🔔 Chamando Agora</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {current.map(t => (
              <div key={t.id} className="bg-panel-highlight/20 border-2 border-panel-highlight rounded-2xl p-8 text-center animate-slide-in">
                <div className="text-6xl font-black text-panel-highlight mb-2">{t.code}</div>
                <div className="text-2xl font-semibold">{t.patientName || '---'}</div>
                <div className="text-panel-foreground/70 mt-2">
                  {getSpecialty(t.specialtyId)?.name} • {t.room || 'Aguardando sala'}
                </div>
                <div className="text-panel-foreground/50 text-sm mt-1">
                  {getDoctor(t.doctorId)?.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center mb-10 text-panel-foreground/40 text-xl">
          Nenhuma senha sendo chamada no momento
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-panel-foreground/70 mb-4 text-center">Próximas Senhas</h2>
        {waiting.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {waiting.map(t => (
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

      <div className="fixed bottom-4 right-4 text-panel-foreground/30 text-sm">
        {new Date().toLocaleDateString('pt-BR')} • {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default WaitPanelPage;
