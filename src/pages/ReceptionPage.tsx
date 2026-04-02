import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { ArrowLeft, Activity, Phone, User, CreditCard, ChevronRight, Clock, Info, CalendarPlus, Calendar, CheckCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { formatDuration, tempoEsperaAtual } from '@/lib/time-utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AppointmentDialog from '@/components/AppointmentDialog';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

const ReceptionPage = () => {
  const navigate = useNavigate();
  const {
    tickets, specialties, queueRules, appointments, doctors,
    callNextReception, registerPatientAndForward,
    checkinAppointment, cancelAppointment, rescheduleAppointment,
  } = useClinic();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [, setTick] = useState(0);

  // Reschedule state
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

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

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayAppointments = appointments
    .filter(a => a.date === todayStr && a.status === 'agendado')
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleCallNext = () => {
    const called = callNextReception();
    if (called) {
      setSelectedTicket(called.id);
      setName(called.patientName || '');
      setCpf(called.patientCpf || '');
      setPhone(called.patientPhone || '');
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

  const handleCheckin = (appointmentId: string) => {
    checkinAppointment(appointmentId);
  };

  const handleReschedule = () => {
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) return;
    rescheduleAppointment(rescheduleId, rescheduleDate, rescheduleTime);
    setRescheduleId(null);
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const rescheduleAppt = rescheduleId ? appointments.find(a => a.id === rescheduleId) : null;
  const rescheduleBookedTimes = rescheduleAppt && rescheduleDate
    ? new Set(appointments.filter(a => a.id !== rescheduleId && a.doctorId === rescheduleAppt.doctorId && a.date === rescheduleDate && a.status !== 'cancelado').map(a => a.time))
    : new Set<string>();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Activity className="w-6 h-6 text-accent" />
        <h1 className="text-2xl font-bold text-foreground">Recepção</h1>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => setShowSchedule(true)} variant="outline" className="gap-2">
            <CalendarPlus className="w-4 h-4" /> Agendar Consulta
          </Button>
          <Button onClick={handleCallNext} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={waitingReception.length === 0}>
            Chamar Próximo
          </Button>
        </div>
      </div>

      {/* Active queue rule banner */}
      <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm">
        <Info className="w-4 h-4 text-accent shrink-0" />
        <span className="text-foreground">
          Regra ativa: <strong className="text-accent">{queueRules.normalBeforePriority} normal(is) → {queueRules.priorityCount} prioritário(s)</strong>
          <span className="text-muted-foreground ml-2">(Prioridade: P → A → N)</span>
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
                onClick={() => { setSelectedTicket(t.id); setName(t.patientName || ''); setCpf(t.patientCpf || ''); setPhone(t.patientPhone || ''); }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-accent">{t.code}</span>
                  <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Cadastrar</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{getSpecialty(t.specialtyId)?.name}</div>
                {t.patientName && <div className="text-sm text-foreground mt-1">{t.patientName}</div>}
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
                  <span className={`font-bold ${t.priority === 'priority' ? 'text-warning' : t.priority === 'agendado' ? 'text-info' : 'text-primary'}`}>{t.code}</span>
                  {t.priority === 'agendado' && <span className="text-xs bg-info/20 text-info px-2 py-0.5 rounded-full">Agendado</span>}
                </div>
                <div className="text-sm text-foreground">{t.patientName}</div>
                <div className="text-xs text-muted-foreground">{getSpecialty(t.specialtyId)?.name}</div>
              </div>
            ))}
          </div>

          {/* Today's appointments */}
          {todayAppointments.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-foreground mt-6 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Agendamentos Hoje ({todayAppointments.length})
              </h2>
              <div className="space-y-2">
                {todayAppointments.map(a => {
                  const doctor = doctors.find(d => d.id === a.doctorId);
                  const spec = specialties.find(s => s.id === a.specialtyId);
                  return (
                    <div key={a.id} className="rounded-lg p-3 bg-primary/5 border border-primary/10">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">{a.time}</span>
                        <span className="text-xs text-muted-foreground">{spec?.name}</span>
                      </div>
                      <div className="text-sm text-foreground">{a.patientName}</div>
                      <div className="text-xs text-muted-foreground">{doctor?.name}</div>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" onClick={() => handleCheckin(a.id)} className="bg-success text-success-foreground hover:bg-success/90 gap-1 text-xs h-7">
                          <CheckCircle className="w-3 h-3" /> Paciente Chegou
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setRescheduleId(a.id); setRescheduleDate(a.date); setRescheduleTime(a.time); }} className="gap-1 text-xs h-7">
                          <RefreshCw className="w-3 h-3" /> Remarcar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => cancelAppointment(a.id)} className="text-destructive hover:text-destructive gap-1 text-xs h-7">
                          <X className="w-3 h-3" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="panel-card bg-card border border-border lg:col-span-2">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Fila de Espera - Recepção ({waitingReception.length})
          </h2>
          <div className="space-y-2">
            {waitingReception.map(t => (
              <div key={t.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <div className={`text-xl font-bold min-w-[70px] ${t.priority === 'priority' ? 'text-warning' : t.priority === 'agendado' ? 'text-info' : 'text-primary'}`}>
                  {t.code}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground">{getSpecialty(t.specialtyId)?.name}</div>
                  {t.patientName && <div className="text-sm text-foreground">{t.patientName}</div>}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {formatDuration(tempoEsperaAtual(t))}
                </div>
                {t.priority === 'priority' && (
                  <span className="text-xs bg-warning/20 text-warning px-2 py-1 rounded-full font-medium">Prioritário</span>
                )}
                {t.priority === 'agendado' && (
                  <span className="text-xs bg-info/20 text-info px-2 py-1 rounded-full font-medium">Agendado</span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            ))}
            {waitingReception.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">Fila vazia</p>}
          </div>
        </div>
      </div>

      {/* Patient registration dialog */}
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

      {/* Reschedule dialog */}
      <Dialog open={!!rescheduleId} onOpenChange={() => setRescheduleId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remarcar Consulta</DialogTitle>
          </DialogHeader>
          {rescheduleAppt && (
            <div className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                Paciente: <span className="font-medium text-foreground">{rescheduleAppt.patientName}</span>
              </p>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Nova Data *</label>
                <Input type="date" value={rescheduleDate} onChange={e => { setRescheduleDate(e.target.value); setRescheduleTime(''); }} min={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              {rescheduleDate && (
                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Novo Horário *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map(t => {
                      const isBooked = rescheduleBookedTimes.has(t);
                      const isSelected = rescheduleTime === t;
                      return (
                        <button
                          key={t}
                          disabled={isBooked}
                          onClick={() => setRescheduleTime(t)}
                          className={cn(
                            "py-2 px-3 rounded-lg text-sm font-medium border transition-colors",
                            isBooked && "bg-muted/30 text-muted-foreground border-border cursor-not-allowed line-through",
                            !isBooked && !isSelected && "bg-card border-border text-foreground hover:bg-accent/10",
                            isSelected && "bg-accent text-accent-foreground border-accent",
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <Button onClick={handleReschedule} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={!rescheduleDate || !rescheduleTime}>
                Confirmar Remarcação
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment scheduling dialog */}
      <AppointmentDialog open={showSchedule} onOpenChange={setShowSchedule} />
    </div>
  );
};

export default ReceptionPage;
