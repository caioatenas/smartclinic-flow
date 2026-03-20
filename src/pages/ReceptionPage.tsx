import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { ArrowLeft, Activity, Phone, User, CreditCard, ChevronRight, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatDuration, tempoEsperaAtual } from '@/lib/time-utils';

const ReceptionPage = () => {
  const navigate = useNavigate();
  const { tickets, specialties, queueRules, callNextReception, registerPatientAndForward } = useClinic();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const waitingReception = tickets
    .filter(t => t.status === 'aguardando_recepcao')
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const inReception = tickets.filter(t => t.status === 'em_atendimento_recepcao');
  const waitingDoctor = tickets.filter(t => t.status === 'aguardando_medico');
  const getSpecialty = (id: string) => specialties.find(s => s.id === id);

  const handleCallNext = () => {
    const called = callNextReception();
    if (called) {
      setSelectedTicket(called.id);
      setName('');
      setCpf('');
      setPhone('');
    }
  };

  const handleRegister = () => {
    if (!selectedTicket || !name) return;
    registerPatientAndForward(selectedTicket, name, cpf || undefined, phone || undefined);
    setSelectedTicket(null);
    setName('');
    setCpf('');
    setPhone('');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Activity className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Recepção</h1>
        <Button onClick={handleCallNext} className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90" disabled={waitingReception.length === 0}>
          Chamar Próximo
        </Button>
      </div>

      {/* Active queue rule banner */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm">
        <Info className="w-4 h-4 text-accent shrink-0" />
        <span className="text-foreground">
          Regra ativa: <strong className="text-accent">{queueRules.normalBeforePriority} normal(is) → {queueRules.priorityCount} prioritário(s)</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="panel-card bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="pulse-dot bg-accent" /> Na Recepção ({inReception.length})
          </h2>
          <div className="space-y-3">
            {inReception.map(t => (
              <div
                key={t.id}
                className="bg-accent/10 rounded-lg p-4 border border-accent/20 cursor-pointer hover:bg-accent/20 transition-colors"
                onClick={() => { setSelectedTicket(t.id); setName(t.patientName || ''); }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-accent">{t.code}</span>
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Cadastrar</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{getSpecialty(t.specialtyId)?.name}</div>
              </div>
            ))}
            {inReception.length === 0 && <p className="text-muted-foreground text-sm">Nenhum paciente na recepção</p>}
          </div>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-4 flex items-center gap-2">
            ✅ Aguardando Médico ({waitingDoctor.length})
          </h2>
          <div className="space-y-2">
            {waitingDoctor.map(t => (
              <div key={t.id} className="rounded-lg p-3 bg-muted/30">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">{t.code}</span>
                  <span className="text-xs text-muted-foreground">{t.room}</span>
                </div>
                <div className="text-sm text-foreground">{t.patientName}</div>
                <div className="text-xs text-muted-foreground">{getSpecialty(t.specialtyId)?.name}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card bg-card border border-border lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Fila de Espera - Recepção ({waitingReception.length})
          </h2>
          <div className="space-y-2">
            {waitingReception.map(t => (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className={`text-xl font-bold min-w-[70px] ${t.priority === 'priority' ? 'text-warning' : 'text-primary'}`}>
                  {t.code}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">{getSpecialty(t.specialtyId)?.name}</div>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDuration(tempoEsperaAtual(t))}
                </div>
                {t.priority === 'priority' && (
                  <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">Prioritário</span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
            {waitingReception.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Fila vazia</p>}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Paciente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Senha: <span className="font-bold text-accent">{tickets.find(t => t.id === selectedTicket)?.code}</span>
            {' • '}
            {getSpecialty(tickets.find(t => t.id === selectedTicket)?.specialtyId || '')?.name}
          </p>
          <div className="space-y-4 mt-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Nome completo *" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="CPF (opcional)" value={cpf} onChange={e => setCpf(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Telefone (opcional)" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <Button onClick={handleRegister} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={!name}>
              Cadastrar e Encaminhar ao Médico
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceptionPage;
