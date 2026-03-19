import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { Priority } from '@/lib/clinic-types';
import { ArrowLeft, Activity } from 'lucide-react';

type Step = 'priority' | 'specialty' | 'done';

const KioskPage = () => {
  const navigate = useNavigate();
  const { specialties, createTicket } = useClinic();
  const [step, setStep] = useState<Step>('priority');
  const [priority, setPriority] = useState<Priority>('normal');
  const [generatedCode, setGeneratedCode] = useState('');

  const handlePriority = (p: Priority) => {
    setPriority(p);
    setStep('specialty');
  };

  const handleSpecialty = (specialtyId: string) => {
    const ticket = createTicket(priority, specialtyId);
    setGeneratedCode(ticket.code);
    setStep('done');
  };

  const reset = () => {
    setStep('priority');
    setGeneratedCode('');
  };

  return (
    <div className="min-h-screen bg-kiosk flex flex-col items-center justify-center p-8">
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-8 h-8" />
      </button>

      <div className="flex items-center gap-2 mb-8">
        <Activity className="w-8 h-8 text-accent" />
        <h1 className="text-3xl font-bold text-foreground">Clini<span className="text-accent">Plus</span></h1>
      </div>

      {step === 'priority' && (
        <div className="animate-slide-in text-center max-w-lg w-full">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Bem-vindo!</h2>
          <p className="text-muted-foreground mb-8">Selecione o tipo de atendimento:</p>
          <div className="grid grid-cols-1 gap-6">
            <button onClick={() => handlePriority('normal')} className="kiosk-btn bg-primary text-primary-foreground">
              <div className="text-4xl mb-2">🟢</div>
              Atendimento Normal
            </button>
            <button onClick={() => handlePriority('priority')} className="kiosk-btn bg-warning text-warning-foreground">
              <div className="text-4xl mb-2">🟡</div>
              Atendimento Prioritário
              <div className="text-sm font-normal opacity-80 mt-1">Idosos, gestantes, PCD</div>
            </button>
          </div>
        </div>
      )}

      {step === 'specialty' && (
        <div className="animate-slide-in text-center max-w-2xl w-full">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Escolha a Especialidade</h2>
          <p className="text-muted-foreground mb-8">
            Senha: <span className="font-bold text-accent">{priority === 'priority' ? 'Prioritária' : 'Normal'}</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {specialties.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSpecialty(s.id)}
                className="kiosk-btn bg-card text-card-foreground border-2 border-border hover:border-accent"
              >
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="text-base">{s.name}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep('priority')} className="mt-6 text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="animate-slide-in text-center">
          <div className="bg-card rounded-3xl p-12 shadow-2xl border border-border">
            <p className="text-muted-foreground mb-4 text-lg">Sua senha é:</p>
            <div className="text-8xl font-black text-accent mb-4 tracking-wider">{generatedCode}</div>
            <p className="text-muted-foreground">Aguarde ser chamado no painel</p>
          </div>
          <button onClick={reset} className="mt-8 kiosk-btn bg-secondary text-secondary-foreground text-base">
            Nova Senha
          </button>
        </div>
      )}
    </div>
  );
};

export default KioskPage;
