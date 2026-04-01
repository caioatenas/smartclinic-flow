import { useState, useMemo } from 'react';
import { useClinic } from '@/lib/clinic-context';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, User, CreditCard, Phone, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AppointmentDialog({ open, onOpenChange }: Props) {
  const { doctors, doctorTypes, appointments, addAppointment } = useClinic();

  const [flow, setFlow] = useState<'byDoctor' | 'byDate'>('byDoctor');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [patientName, setPatientName] = useState('');
  const [patientCpf, setPatientCpf] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  const resetForm = () => {
    setSelectedTypeId('');
    setSelectedDoctorId('');
    setSelectedDate(undefined);
    setSelectedTime('');
    setPatientName('');
    setPatientCpf('');
    setPatientPhone('');
  };

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  const filteredDoctors = useMemo(() => {
    if (flow === 'byDoctor' && selectedTypeId) {
      return doctors.filter(d => d.doctorTypeId === selectedTypeId);
    }
    if (flow === 'byDate' && dateStr) {
      return doctors;
    }
    return [];
  }, [flow, selectedTypeId, dateStr, doctors]);

  const bookedTimes = useMemo(() => {
    if (!selectedDoctorId || !dateStr) return new Set<string>();
    return new Set(
      appointments
        .filter(a => a.doctorId === selectedDoctorId && a.date === dateStr)
        .map(a => a.time)
    );
  }, [selectedDoctorId, dateStr, appointments]);

  const availableSlots = TIME_SLOTS.filter(t => !bookedTimes.has(t));

  // Calendar availability colors
  const getDateAvailability = (date: Date) => {
    const ds = format(date, 'yyyy-MM-dd');
    if (!selectedDoctorId) {
      const totalBooked = appointments.filter(a => a.date === ds).length;
      const ratio = totalBooked / TIME_SLOTS.length;
      if (ratio >= 1) return 'full';
      if (ratio >= 0.5) return 'medium';
      return 'available';
    }
    const booked = appointments.filter(a => a.doctorId === selectedDoctorId && a.date === ds).length;
    const ratio = booked / TIME_SLOTS.length;
    if (ratio >= 1) return 'full';
    if (ratio >= 0.5) return 'medium';
    return 'available';
  };

  const handleSubmit = () => {
    if (!selectedDoctorId || !dateStr || !selectedTime || !patientName) return;
    const doctor = doctors.find(d => d.id === selectedDoctorId);
    addAppointment({
      doctorId: selectedDoctorId,
      doctorTypeId: doctor?.doctorTypeId || '',
      patientName,
      patientCpf: patientCpf || undefined,
      patientPhone: patientPhone || undefined,
      date: dateStr,
      time: selectedTime,
    });
    resetForm();
    onOpenChange(false);
  };

  const modifiers = {
    available: (date: Date) => getDateAvailability(date) === 'available',
    medium: (date: Date) => getDateAvailability(date) === 'medium',
    full: (date: Date) => getDateAvailability(date) === 'full',
  };

  const modifiersStyles = {
    available: { backgroundColor: 'hsl(var(--success) / 0.2)', color: 'hsl(var(--foreground))' },
    medium: { backgroundColor: 'hsl(var(--warning) / 0.3)', color: 'hsl(var(--foreground))' },
    full: { backgroundColor: 'hsl(var(--destructive) / 0.2)', color: 'hsl(var(--muted-foreground))' },
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-accent" />
            Agendar Consulta
          </DialogTitle>
        </DialogHeader>

        <Tabs value={flow} onValueChange={v => { setFlow(v as any); resetForm(); }}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="byDoctor">Por Médico</TabsTrigger>
            <TabsTrigger value="byDate">Por Data</TabsTrigger>
          </TabsList>

          {/* FLOW 1: By Doctor */}
          <TabsContent value="byDoctor" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Tipo de Médico *</label>
              <Select value={selectedTypeId} onValueChange={v => { setSelectedTypeId(v); setSelectedDoctorId(''); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {doctorTypes.map(dt => (
                    <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {doctorTypes.length === 0 && (
                <p className="text-xs text-warning mt-1">Cadastre tipos de médico no painel do administrador</p>
              )}
            </div>

            {selectedTypeId && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Médico *</label>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                  <SelectContent>
                    {filteredDoctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name} - {d.room}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {filteredDoctors.length === 0 && (
                  <p className="text-xs text-warning mt-1">Nenhum médico cadastrado para este tipo</p>
                )}
              </div>
            )}

            {selectedDoctorId && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">Data *</label>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={d => { setSelectedDate(d); setSelectedTime(''); }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    locale={ptBR}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    className={cn("p-3 pointer-events-auto rounded-lg border border-border")}
                  />
                </div>
                <div className="flex gap-4 justify-center mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-success/30" /> Disponível</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-warning/30" /> Parcial</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-destructive/30" /> Lotado</span>
                </div>
              </div>
            )}
          </TabsContent>

          {/* FLOW 2: By Date */}
          <TabsContent value="byDate" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Data *</label>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={d => { setSelectedDate(d); setSelectedDoctorId(''); setSelectedTime(''); }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  locale={ptBR}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className={cn("p-3 pointer-events-auto rounded-lg border border-border")}
                />
              </div>
            </div>

            {selectedDate && (
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Médico disponível *</label>
                <Select value={selectedDoctorId} onValueChange={v => { setSelectedDoctorId(v); setSelectedTime(''); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                  <SelectContent>
                    {doctors.map(d => {
                      const dtype = doctorTypes.find(dt => dt.id === d.doctorTypeId);
                      const booked = appointments.filter(a => a.doctorId === d.id && a.date === dateStr).length;
                      const free = TIME_SLOTS.length - booked;
                      return (
                        <SelectItem key={d.id} value={d.id} disabled={free === 0}>
                          {d.name} {dtype ? `(${dtype.name})` : ''} — {free} horários livres
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {doctors.length === 0 && (
                  <p className="text-xs text-warning mt-1">Cadastre médicos no painel do administrador</p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Time slots */}
        {selectedDoctorId && selectedDate && (
          <div>
            <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Horário * ({availableSlots.length} disponíveis)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {TIME_SLOTS.map(t => {
                const isBooked = bookedTimes.has(t);
                const isSelected = selectedTime === t;
                return (
                  <button
                    key={t}
                    disabled={isBooked}
                    onClick={() => setSelectedTime(t)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-sm font-medium transition-colors border",
                      isBooked && "bg-muted/30 text-muted-foreground border-border cursor-not-allowed line-through",
                      !isBooked && !isSelected && "bg-card border-border text-foreground hover:bg-accent/10 hover:border-accent/30",
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

        {/* Patient info */}
        {selectedTime && (
          <div className="space-y-3 border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-foreground">Dados do Paciente</h3>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input placeholder="Nome completo *" value={patientName} onChange={e => setPatientName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input placeholder="CPF (opcional)" value={patientCpf} onChange={e => setPatientCpf(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input placeholder="Telefone (opcional)" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} />
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm">
              <p className="font-medium text-foreground">Resumo do Agendamento:</p>
              <p className="text-muted-foreground mt-1">
                📅 {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} às {selectedTime}
              </p>
              <p className="text-muted-foreground">
                👨‍⚕️ {doctors.find(d => d.id === selectedDoctorId)?.name}
              </p>
              <p className="text-muted-foreground">👤 {patientName || '—'}</p>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={!patientName}
            >
              Confirmar Agendamento
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
