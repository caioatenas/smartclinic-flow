import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { canAccess } from '@/lib/access';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, LogIn } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { user, profile, role, loading, signOut } = useAuth();

  const roles = [
    { label: 'Totem Paciente', path: '/kiosk', icon: '🖥️', desc: 'Gerar senha de atendimento', color: 'bg-primary text-primary-foreground' },
    { label: 'Painel de Espera', path: '/panel', icon: '📺', desc: 'Visualizar senhas na TV', color: 'bg-panel text-panel-foreground' },
    { label: 'Recepção', path: '/reception', icon: '🧑‍💼', desc: 'Gerenciar fila e pacientes', color: 'bg-info text-info-foreground' },
    { label: 'Assistente', path: '/assistant', icon: '👩‍💻', desc: 'Acompanhar fila e status', color: 'bg-warning text-warning-foreground' },
    { label: 'Médico', path: '/doctor', icon: '👨‍⚕️', desc: 'Atender e prescrever', color: 'bg-success text-success-foreground' },
    { label: 'Salas de Atendimento', path: '/rooms', icon: '🚪', desc: 'Encaminhamentos', color: 'bg-accent text-accent-foreground' },
    { label: 'Administrador', path: '/admin', icon: '🛠️', desc: 'Configurações do sistema', color: 'bg-destructive text-destructive-foreground' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12 animate-slide-in">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Activity className="w-10 h-10 text-accent" />
          <h1 className="text-5xl font-bold text-foreground tracking-tight">
            Clini<span className="text-accent">Plus</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-lg">Sistema de Gestão de Filas e Atendimentos</p>
      </div>

      {!loading && <div className="mb-6 text-center space-y-2">{user ? <><p className="text-muted-foreground">{profile?.name || 'Minha conta'}{!role && ' — acesso pendente ou desativado'}</p><Button variant="outline" onClick={() => void signOut()}><LogOut className="size-4" /> Sair</Button></> : <Button onClick={() => navigate('/login')}><LogIn className="size-4" /> Entrar como equipe</Button>}</div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
        {roles.filter(item => canAccess(role, item.path, profile?.doctor_id)).map((role) => (
          <Button
            key={role.path}
            onClick={() => navigate(role.path)}
            className={`${role.color} h-auto whitespace-normal kiosk-btn flex flex-col items-center gap-3 text-center`}
          >
            <span className="text-4xl">{role.icon}</span>
            <span className="text-xl font-bold">{role.label}</span>
            <span className="text-sm opacity-80">{role.desc}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
