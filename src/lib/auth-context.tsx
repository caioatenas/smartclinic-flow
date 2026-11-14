import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { StaffRole } from './access';

type Profile = { id: string; name: string; active: boolean; doctor_id: string | null };
type AuthState = { user: User | null; profile: Profile | null; role: StaffRole | null; loading: boolean; error: string; refresh: () => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    const { data, error: authError } = await supabase.auth.getUser();
    if (!data.user || authError) { setUser(null); setProfile(null); setRole(null); setLoading(false); return; }
    const [p, r] = await Promise.all([
      supabase.from('profiles').select('id,name,active,doctor_id').eq('id', data.user.id).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle(),
    ]);
    setUser(data.user);
    setProfile(p.data);
    setRole(p.data?.active ? r.data?.role ?? null : null);
    setError(p.error || r.error ? 'Não foi possível verificar seu acesso. Tente novamente.' : '');
    setLoading(false);
  }, []);
  useEffect(() => {
    let live = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setLoading(true);
      window.setTimeout(() => { if (live) void refresh(); }, 0);
    });
    void refresh();
    const interval = window.setInterval(() => void refresh(), 15000);
    const channel = supabase.channel(`staff-access-${crypto.randomUUID()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => void refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => void refresh()).subscribe();
    return () => { live = false; subscription.unsubscribe(); clearInterval(interval); void supabase.removeChannel(channel); };
  }, [refresh]);
  const signOut = async () => {
    const { error: e } = await supabase.auth.signOut();
    if (e) { setError('Não foi possível sair. Tente novamente.'); return; }
    setUser(null); setProfile(null); setRole(null);
  };
  return <AuthContext.Provider value={{ user, profile, role, loading, error, refresh, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('AuthProvider required');
  return auth;
}