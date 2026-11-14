import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { canAccess } from '@/lib/access';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldAlert } from 'lucide-react';

export function AccessGate({ children }: { children?: ReactNode }) {
  const { user, profile, role, loading, error, refresh } = useAuth();
  const location = useLocation();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Verificando acesso…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!canAccess(role, location.pathname, profile?.doctor_id)) return <div className="min-h-screen grid place-items-center p-6"><div className="text-center space-y-4 max-w-md"><ShieldAlert className="size-12 mx-auto text-warning" /><h1 className="text-2xl font-bold">{role ? 'Acesso não permitido' : 'Acesso pendente ou desativado'}</h1><p className="text-muted-foreground">{error || (role ? 'Seu perfil não tem permissão para esta área.' : 'Peça ao administrador para liberar seu acesso à equipe.')}</p><Button asChild><Link to="/">Voltar ao início</Link></Button><Button variant="outline" onClick={() => void refresh()}>Verificar novamente</Button></div></div>;
  return children ?? <Outlet />;
}
export function StaffLayout() {
  const { profile, role, signOut } = useAuth();
  return <><header className="border-b border-border bg-card px-6 py-2 flex justify-between items-center gap-3"><Link to="/" className="font-semibold text-primary">CliniPlus</Link><div className="flex gap-3 items-center min-w-0"><span className="text-sm truncate">{profile?.name || role}</span><Button size="sm" variant="ghost" onClick={() => void signOut()}><LogOut className="size-4" /> Sair</Button></div></header><AccessGate /></>;
}