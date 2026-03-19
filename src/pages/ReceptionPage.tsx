import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { ArrowLeft, Activity, Phone, User, CreditCard, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ReceptionPage = () => {
  const navigate = useNavigate();
  const { tickets, specialties, doctors, callNext, registerPatient, assignDoctor } = useClinic();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');

  const waiting = tickets
    .filter(t => t.status === 'waiting')
    .sort((a, b) => {
      if (a.priority === 'priority' && b.priority !== 'priority') return -1;
      if (b.priority === 'priority' && a.priority !== 'priority') return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  const inProgress = tickets.filter(t => t.status === 'in_progress');
  const getSpecialty = (id: string) => specialties.find(s => s.id === id);

  const handleRegister = () => {
    if (!selectedTicket || !name) return;
    registerPatient(selectedTicket, name, cpf || undefined, phone || undefined);
    setSelectedTicket(null);
    setName('');
    setCpf('');
    setPhone('');
  };

  const handleCallNext = (specialtyId?: string) => {
    callNext(specialtyId);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Activity className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Recepção</h1>
        <Button onClick={() => handleCallNext()} className="ml-auto bg-accent text-accent-foreground hover:bg-accent/90">
          Chamar Próximo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Em Atendimento */}
        <div className="panel-card bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <span className="pulse-dot bg-accent" /> Em Atendimento ({inProgress.length})
          </h2>
          <div className="space-y-3">
            {inProgress.map(t => (
              <div key={t.id} className="bg-accent/10 rounded-lg p-4 border border-accent/20">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-accent">{t.code}</span>
                  <span className="text-sm text-muted-foreground">{t.room}</span>
                </div>
                <div className="text-foreground font-medium mt-1">{t.patientName || 'Não cadastrado'}</div>
                <div className="text-sm text-muted-foreground">{getSpecialty(t.specialtyId)?.name}</div>
              </div>
            ))}
            {inProgress.length === 0 && <p className="text-muted-foreground text-sm">Nenhum atendimento em andamento</p>}
          </div>
        </div>

        {/* Fila de Espera */}
        <div className="panel-card bg-card border border-border lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Fila de Espera ({waiting.length})
          </h2>
          <div className="space-y-2">
            {waiting.map(t => (
              <div
                key={t.id}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => { setSelectedTicket(t.id); setName(t.patientName || ''); }}
              >
                <div className={`text-xl font-bold min-w-[70px] ${t.priority === 'priority' ? 'text-warning' : 'text-primary'}`}>
                  {t.code}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground">{t.patientName || 'Sem cadastro'}</div>
                  <div className="text-sm text-muted-foreground">{getSpecialty(t.specialtyId)?.name}</div>
                </div>
                {t.priority === 'priority' && (
                  <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">Prioritário</span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
            {waiting.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Fila vazia</p>}
          </div>
        </div>
      </div>

      {/* Dialog Cadastro */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} />
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
              Cadastrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceptionPage;
