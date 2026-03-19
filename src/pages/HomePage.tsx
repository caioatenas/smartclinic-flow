import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  const roles = [
    { label: 'Totem Paciente', path: '/kiosk', icon: '🖥️', desc: 'Gerar senha de atendimento', color: 'bg-primary text-primary-foreground' },
    { label: 'Painel de Espera', path: '/panel', icon: '📺', desc: 'Visualizar senhas na TV', color: 'bg-panel text-panel-foreground' },
    { label: 'Recepção', path: '/reception', icon: '🧑‍💼', desc: 'Gerenciar fila e pacientes', color: 'bg-info text-info-foreground' },
    { label: 'Assistente', path: '/assistant', icon: '👩‍💻', desc: 'Acompanhar fila e status', color: 'bg-warning text-warning-foreground' },
    { label: 'Médico', path: '/doctor/d1', icon: '👨‍⚕️', desc: 'Atender e prescrever', color: 'bg-success text-success-foreground' },
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl w-full">
        {roles.map((role) => (
          <button
            key={role.path}
            onClick={() => navigate(role.path)}
            className={`${role.color} kiosk-btn flex flex-col items-center gap-3 text-center`}
          >
            <span className="text-4xl">{role.icon}</span>
            <span className="text-xl font-bold">{role.label}</span>
            <span className="text-sm opacity-80">{role.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
