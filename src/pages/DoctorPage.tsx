import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import { ArrowLeft, Activity, FileText, Printer, Clock, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDuration, tempoEsperaAtual, tempoAteRecepcao, tempoNaRecepcao, tempoEsperaMedico } from '@/lib/time-utils';

const DoctorPage = () => {
  const navigate = useNavigate();
  const { doctorId } = useParams<{ doctorId: string }>();
  const { doctors, specialties, tickets, offices, getDoctorQueue, callNextDoctor, completeAttendance, addRecord, addPrescription } = useClinic();
  const [, setTick] = useState(0);
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const doctor = doctors.find(d => d.id === doctorId);
  const specialty = specialties.find(s => s.id === doctor?.specialtyId);
  const queue = doctorId ? getDoctorQueue(doctorId) : [];
  const currentPatient = tickets.find(t => t.doctorId === doctorId && t.status === 'em_atendimento_medico');
  const finishedToday = tickets.filter(t => t.doctorId === doctorId && t.status === 'finalizado');
  const activeOffices = offices.filter(o => o.active);
  const selectedOffice = offices.find(o => o.id === selectedOfficeId);

  const [complaint, setComplaint] = useState('');
  const [observations, setObservations] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [showPrescription, setShowPrescription] = useState(false);
  const [medications, setMedications] = useState([{ name: '', dosage: '', instructions: '' }]);
  const [prescNotes, setPrescNotes] = useState('');
  const [showPrint, setShowPrint] = useState(false);
  const [printData, setPrintData] = useState<any>(null);

  const handleCallNext = () => {
    if (doctorId && selectedOfficeId && selectedOffice) {
      callNextDoctor(doctorId, selectedOfficeId, selectedOffice.name);
    }
  };

  const handleFinish = () => {
    if (!currentPatient) return;
    addRecord({ ticketId: currentPatient.id, complaint, observations, diagnosis });
    completeAttendance(currentPatient.id);
    setComplaint('');
    setObservations('');
    setDiagnosis('');
  };

  const addMed = () => setMedications(prev => [...prev, { name: '', dosage: '', instructions: '' }]);
  const updateMed = (i: number, field: string, value: string) => {
    setMedications(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  };

  const handlePrescription = () => {
    if (!currentPatient || !doctor) return;
    const data = {
      ticketId: currentPatient.id,
      patientName: currentPatient.patientName || currentPatient.code,
      doctorName: doctor.name,
      medications,
      observations: prescNotes,
    };
    addPrescription(data);
    setPrintData({ ...data, date: new Date() });
    setShowPrescription(false);
    setShowPrint(true);
    setMedications([{ name: '', dosage: '', instructions: '' }]);
    setPrescNotes('');
  };

  if (!doctor) return <div className="p-8">Médico não encontrado</div>;

  // Office selection gate
  if (!selectedOfficeId) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="panel-card bg-card border border-border max-w-md w-full text-center">
          <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <DoorOpen className="w-12 h-12 text-accent mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{doctor.name}</h1>
          <p className="text-muted-foreground mb-6">Selecione seu consultório para iniciar</p>

          <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
            <SelectTrigger className="text-lg h-12">
              <SelectValue placeholder="Selecione o consultório" />
            </SelectTrigger>
            <SelectContent>
              {activeOffices.map(o => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeOffices.length === 0 && (
            <p className="text-sm text-destructive mt-4">Nenhum consultório ativo. Peça ao administrador para cadastrar consultórios.</p>
          )}
        </div>
      </div>
    );
  }

  const TimeInfo = ({ ticket }: { ticket: typeof currentPatient }) => {
    if (!ticket) return null;
    const t1 = tempoAteRecepcao(ticket);
    const t2 = tempoNaRecepcao(ticket);
    const t3 = tempoEsperaMedico(ticket);
    return (
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
        {t1 !== null && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Espera recepção: {formatDuration(t1)}</span>}
        {t2 !== null && <span>Na recepção: {formatDuration(t2)}</span>}
        {t3 !== null && <span>Espera médico: {formatDuration(t3)}</span>}
        <span>Total: {formatDuration(tempoEsperaAtual(ticket))}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <Activity className="w-6 h-6 text-accent" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">{doctor.name}</h1>
          <p className="text-sm text-muted-foreground">{specialty?.name} • {selectedOffice?.name}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button onClick={() => setSelectedOfficeId('')} className="text-xs text-muted-foreground hover:text-foreground underline">
            Trocar consultório
          </button>
          <span className="text-xs text-muted-foreground">{finishedToday.length} atendidos</span>
          <Button onClick={handleCallNext} className="bg-accent text-accent-foreground hover:bg-accent/90" disabled={!!currentPatient || queue.length === 0}>
            Chamar Próximo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {currentPatient ? (
            <div className="panel-card bg-card border border-border animate-slide-in">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-3xl font-bold text-accent">{currentPatient.code}</span>
                  <h3 className="text-xl font-semibold text-foreground mt-1">{currentPatient.patientName}</h3>
                  {currentPatient.officeName && (
                    <span className="text-sm text-primary flex items-center gap-1 mt-1">
                      <DoorOpen className="w-4 h-4" /> {currentPatient.officeName}
                    </span>
                  )}
                  <TimeInfo ticket={currentPatient} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowPrescription(true)} className="gap-2">
                    <FileText className="w-4 h-4" /> Receita
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Queixa</label>
                  <Textarea placeholder="Queixa principal do paciente..." value={complaint} onChange={e => setComplaint(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Observações</label>
                  <Textarea placeholder="Observações clínicas..." value={observations} onChange={e => setObservations(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Diagnóstico</label>
                  <Textarea placeholder="Diagnóstico..." value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
                </div>
                <Button onClick={handleFinish} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Finalizar Atendimento
                </Button>
              </div>
            </div>
          ) : (
            <div className="panel-card bg-card border border-border text-center py-16">
              <p className="text-muted-foreground text-lg">Nenhum paciente em atendimento</p>
              <p className="text-sm text-muted-foreground mt-1">Clique em "Chamar Próximo" para iniciar</p>
            </div>
          )}
        </div>

        <div className="panel-card bg-card border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">Aguardando Consulta ({queue.length})</h2>
          <div className="space-y-2">
            {queue.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <span className={`font-bold ${t.priority === 'priority' ? 'text-warning' : 'text-primary'}`}>{t.code}</span>
                <div className="flex-1">
                  <span className="text-sm text-foreground">{t.patientName}</span>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDuration(tempoEsperaAtual(t))}
                  </div>
                </div>
                {t.priority === 'priority' && <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded-full ml-auto">P</span>}
              </div>
            ))}
            {queue.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum paciente aguardando</p>}
          </div>
        </div>
      </div>

      {/* Receita Dialog */}
      <Dialog open={showPrescription} onOpenChange={setShowPrescription}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Gerar Receita Médica</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Paciente: <span className="font-medium text-foreground">{currentPatient?.patientName || currentPatient?.code}</span>
            </p>
            {medications.map((med, i) => (
              <div key={i} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <Input placeholder="Medicamento" value={med.name} onChange={e => updateMed(i, 'name', e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Dosagem" value={med.dosage} onChange={e => updateMed(i, 'dosage', e.target.value)} />
                  <Input placeholder="Instruções" value={med.instructions} onChange={e => updateMed(i, 'instructions', e.target.value)} />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addMed} className="w-full">+ Adicionar Medicamento</Button>
            <Textarea placeholder="Observações da receita..." value={prescNotes} onChange={e => setPrescNotes(e.target.value)} />
            <Button onClick={handlePrescription} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Gerar Receita</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      <Dialog open={showPrint} onOpenChange={setShowPrint}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Receita Médica</DialogTitle></DialogHeader>
          {printData && (
            <div className="border border-border rounded-lg p-6 space-y-4" id="prescription-print">
              <div className="text-center border-b border-border pb-4">
                <h3 className="text-xl font-bold text-primary">CliniPlus</h3>
                <p className="text-sm text-muted-foreground">Receita Médica</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Paciente:</span> <span className="font-medium text-foreground">{printData.patientName}</span></div>
                <div><span className="text-muted-foreground">Data:</span> <span className="font-medium text-foreground">{printData.date.toLocaleDateString('pt-BR')}</span></div>
                <div><span className="text-muted-foreground">Médico:</span> <span className="font-medium text-foreground">{printData.doctorName}</span></div>
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="font-semibold text-foreground mb-2">Medicamentos:</h4>
                {printData.medications.filter((m: any) => m.name).map((m: any, i: number) => (
                  <div key={i} className="mb-2 text-sm">
                    <span className="font-medium text-foreground">{i + 1}. {m.name}</span>
                    {m.dosage && <span className="text-muted-foreground"> — {m.dosage}</span>}
                    {m.instructions && <div className="text-muted-foreground ml-4">{m.instructions}</div>}
                  </div>
                ))}
              </div>
              {printData.observations && (
                <div className="border-t border-border pt-4 text-sm">
                  <span className="text-muted-foreground">Obs:</span> <span className="text-foreground">{printData.observations}</span>
                </div>
              )}
              <div className="border-t border-border pt-6 mt-6 text-center">
                <div className="border-t border-foreground w-48 mx-auto pt-2 text-sm text-muted-foreground">{printData.doctorName}</div>
              </div>
            </div>
          )}
          <Button onClick={() => window.print()} className="w-full gap-2"><Printer className="w-4 h-4" /> Imprimir</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorPage;
