import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '@/lib/clinic-context';
import {
  ArrowLeft, Activity, Users, Stethoscope, ListChecks, Clock, BarChart3,
  Settings, UserPlus, Shield, Sliders, Eye, EyeOff, Pencil, Save, X, Plus, Trash2, DoorOpen
} from 'lucide-react';
import { calcularMedias, formatDuration } from '@/lib/time-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserRole, SystemUser } from '@/lib/clinic-types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  doctor: 'Médico',
  receptionist: 'Recepcionista',
  assistant: 'Assistente',
  patient: 'Paciente',
};

const AdminPage = () => {
  const navigate = useNavigate();
  const {
    doctors, specialties, tickets, queueRules, users, doctorTypes, offices,
    updateQueueRules, addUser, updateUser, toggleUserActive,
    addDoctorType, updateDoctorType, deleteDoctorType,
    addOffice, addOfficesBulk, updateOffice, toggleOfficeActive,
  } = useClinic();

  const totalToday = tickets.length;
  const waiting = tickets.filter(t => t.status === 'aguardando_recepcao' || t.status === 'aguardando_medico').length;
  const completed = tickets.filter(t => t.status === 'finalizado').length;
  const metrics = calcularMedias(tickets);

  // Queue rules state
  const [normalCount, setNormalCount] = useState(String(queueRules.normalBeforePriority));
  const [priorityCount, setPriorityCount] = useState(String(queueRules.priorityCount));

  // User form
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('receptionist');
  const [userDoctorId, setUserDoctorId] = useState('');
  const [userDoctorTypeId, setUserDoctorTypeId] = useState('');

  // Doctor type form
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');

  // Office form
  const [newOfficeName, setNewOfficeName] = useState('');
  const [bulkCount, setBulkCount] = useState('');
  const [editingOfficeId, setEditingOfficeId] = useState<string | null>(null);
  const [editingOfficeName, setEditingOfficeName] = useState('');

  const handleSaveRules = () => {
    const n = Math.max(1, parseInt(normalCount) || 1);
    const p = Math.max(1, parseInt(priorityCount) || 1);
    updateQueueRules({ normalBeforePriority: n, priorityCount: p });
  };

  const openNewUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setUserRole('receptionist');
    setUserDoctorId('');
    setUserDoctorTypeId('');
    setShowUserForm(true);
  };

  const openEditUser = (u: SystemUser) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserEmail(u.email);
    setUserPassword('');
    setUserRole(u.role);
    setUserDoctorId(u.doctorId || '');
    setUserDoctorTypeId('');
    setShowUserForm(true);
  };

  const handleSaveUser = () => {
    if (!userName || !userEmail) return;
    if (editingUser) {
      const data: Partial<SystemUser> = { name: userName, email: userEmail, role: userRole };
      if (userPassword) data.password = userPassword;
      if (userRole === 'doctor') data.doctorId = userDoctorId || undefined;
      else data.doctorId = undefined;
      updateUser(editingUser.id, data);
    } else {
      if (!userPassword) return;
      addUser({
        name: userName,
        email: userEmail,
        password: userPassword,
        role: userRole,
        active: true,
        doctorId: userRole === 'doctor' ? userDoctorId || undefined : undefined,
      });
    }
    setShowUserForm(false);
  };

  const handleAddType = () => {
    if (!newTypeName.trim()) return;
    addDoctorType(newTypeName.trim());
    setNewTypeName('');
  };

  const handleSaveType = () => {
    if (!editingTypeId || !editingTypeName.trim()) return;
    updateDoctorType(editingTypeId, editingTypeName.trim());
    setEditingTypeId(null);
    setEditingTypeName('');
  };

  const handleAddOffice = () => {
    if (!newOfficeName.trim()) return;
    addOffice(newOfficeName.trim());
    setNewOfficeName('');
  };

  const handleBulkOffices = () => {
    const count = parseInt(bulkCount);
    if (!count || count < 1) return;
    addOfficesBulk(count);
    setBulkCount('');
  };

  const handleSaveOffice = () => {
    if (!editingOfficeId || !editingOfficeName.trim()) return;
    updateOffice(editingOfficeId, editingOfficeName.trim());
    setEditingOfficeId(null);
    setEditingOfficeName('');
  };

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

      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rules" className="gap-2"><Sliders className="w-4 h-4" /> Fila</TabsTrigger>
          <TabsTrigger value="offices" className="gap-2"><DoorOpen className="w-4 h-4" /> Consultórios</TabsTrigger>
          <TabsTrigger value="doctorTypes" className="gap-2"><Stethoscope className="w-4 h-4" /> Tipos</TabsTrigger>
          <TabsTrigger value="users" className="gap-2"><Shield className="w-4 h-4" /> Usuários</TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2"><BarChart3 className="w-4 h-4" /> Métricas</TabsTrigger>
          <TabsTrigger value="overview" className="gap-2"><Settings className="w-4 h-4" /> Visão</TabsTrigger>
        </TabsList>

        {/* ===== QUEUE RULES TAB ===== */}
        <TabsContent value="rules">
          <div className="panel-card bg-card border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-accent" /> Configuração da Fila
            </h2>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-foreground font-medium">📌 Regra ativa:</p>
              <p className="text-lg text-accent font-bold mt-1">
                {queueRules.normalBeforePriority} normal(is) → {queueRules.priorityCount} prioritário(s)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  🔢 Normais antes do prioritário
                </label>
                <Input type="number" min="1" max="10" value={normalCount} onChange={e => setNormalCount(e.target.value)} className="text-lg" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  ⭐ Prioritários na sequência
                </label>
                <Input type="number" min="1" max="5" value={priorityCount} onChange={e => setPriorityCount(e.target.value)} className="text-lg" />
              </div>
            </div>

            <Button onClick={handleSaveRules} className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
              <Save className="w-4 h-4" /> Salvar Regra
            </Button>
          </div>
        </TabsContent>

        {/* ===== DOCTOR TYPES TAB ===== */}
        <TabsContent value="doctorTypes">
          <div className="panel-card bg-card border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-accent" /> Tipos de Médico
            </h2>

            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Nome do novo tipo (ex: Cardiologista)"
                value={newTypeName}
                onChange={e => setNewTypeName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddType()}
              />
              <Button onClick={handleAddType} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2" disabled={!newTypeName.trim()}>
                <Plus className="w-4 h-4" /> Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {doctorTypes.map(dt => {
                const isEditing = editingTypeId === dt.id;
                const doctorsOfType = doctors.filter(d => d.doctorTypeId === dt.id);
                return (
                  <div key={dt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    {isEditing ? (
                      <>
                        <Input
                          value={editingTypeName}
                          onChange={e => setEditingTypeName(e.target.value)}
                          className="flex-1"
                          onKeyDown={e => e.key === 'Enter' && handleSaveType()}
                        />
                        <Button size="sm" onClick={handleSaveType} className="bg-accent text-accent-foreground gap-1">
                          <Save className="w-3 h-3" /> Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingTypeId(null)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Stethoscope className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{dt.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {doctorsOfType.length} médico(s) vinculado(s)
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => { setEditingTypeId(dt.id); setEditingTypeName(dt.name); }}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteDoctorType(dt.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
              {doctorTypes.length === 0 && (
                <p className="text-muted-foreground text-center py-6">Nenhum tipo cadastrado</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ===== USERS TAB ===== */}
        <TabsContent value="users">
          <div className="panel-card bg-card border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" /> Gestão de Usuários
              </h2>
              <Button onClick={openNewUser} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2">
                <UserPlus className="w-4 h-4" /> Novo Usuário
              </Button>
            </div>

            <div className="space-y-3">
              {users.map(u => (
                <div
                  key={u.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                    u.active ? 'bg-muted/30 border-border' : 'bg-muted/10 border-border/50 opacity-60'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{u.name}</div>
                    <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    u.role === 'admin' ? 'bg-destructive/10 text-destructive' :
                    u.role === 'doctor' ? 'bg-accent/10 text-accent' :
                    u.role === 'receptionist' ? 'bg-info/10 text-info' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    u.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditUser(u)} className="h-8 w-8">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleUserActive(u.id)} className="h-8 w-8">
                      {u.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ===== METRICS TAB ===== */}
        <TabsContent value="metrics">
          <div className="panel-card bg-card border border-border">
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
        </TabsContent>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="panel-card bg-card border border-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-accent" /> Médicos
              </h2>
              <div className="space-y-3">
                {doctors.map(d => {
                  const spec = specialties.find(s => s.id === d.specialtyId);
                  const dtype = doctorTypes.find(dt => dt.id === d.doctorTypeId);
                  const queueCount = tickets.filter(t => t.doctorId === d.id && t.status === 'aguardando_medico').length;
                  const doneCount = tickets.filter(t => t.doctorId === d.id && t.status === 'finalizado').length;
                  return (
                    <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {d.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-foreground">{d.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {spec?.name} • {d.room}
                          {dtype && <span className="ml-1 text-xs text-accent">• {dtype.name}</span>}
                        </div>
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
        </TabsContent>
      </Tabs>

      {/* User Form Dialog */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Nome *</label>
              <Input placeholder="Nome completo" value={userName} onChange={e => setUserName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Email/Login *</label>
              <Input placeholder="email@cliniplus.com" value={userEmail} onChange={e => setUserEmail(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                {editingUser ? 'Nova Senha (deixe vazio para manter)' : 'Senha *'}
              </label>
              <Input type="password" placeholder="••••••" value={userPassword} onChange={e => setUserPassword(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Perfil de Acesso *</label>
              <Select value={userRole} onValueChange={v => setUserRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="doctor">Médico</SelectItem>
                  <SelectItem value="receptionist">Recepcionista</SelectItem>
                  <SelectItem value="assistant">Assistente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {userRole === 'doctor' && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Vincular ao Médico</label>
                  <Select value={userDoctorId} onValueChange={setUserDoctorId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o médico" /></SelectTrigger>
                    <SelectContent>
                      {doctors.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name} - {d.room}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Tipo de Médico *</label>
                  <Select value={userDoctorTypeId} onValueChange={setUserDoctorTypeId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>
                      {doctorTypes.map(dt => (
                        <SelectItem key={dt.id} value={dt.id}>{dt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSaveUser} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 gap-2" disabled={!userName || !userEmail || (!editingUser && !userPassword)}>
                <Save className="w-4 h-4" /> {editingUser ? 'Salvar' : 'Criar Usuário'}
              </Button>
              <Button variant="outline" onClick={() => setShowUserForm(false)} className="gap-2">
                <X className="w-4 h-4" /> Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
