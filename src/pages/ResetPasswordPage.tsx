import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
export default function ResetPasswordPage() {
  const [recovery, setRecovery] = useState(window.location.hash.includes('type=recovery'));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const { data: { subscription } } = supabase.auth.onAuthStateChange(event => { if (event === 'PASSWORD_RECOVERY') setRecovery(true); }); return () => subscription.unsubscribe(); }, []);
  async function submit(e: FormEvent) {
    e.preventDefault(); if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    setBusy(true); setError('');
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) setError('Link inválido ou senha recusada. Solicite outro link ou tente uma senha diferente.');
    else { setDone(true); await supabase.auth.signOut(); }
    setBusy(false);
  }
  return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-sm w-full space-y-5"><h1 className="text-2xl font-bold">Nova senha</h1>{done ? <p role="status">Senha atualizada.</p> : recovery ? <form className="space-y-4" onSubmit={submit}><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /><Label htmlFor="confirm-password">Confirmar senha</Label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} />{error && <p role="alert" className="text-destructive text-sm">{error}</p>}<Button type="submit" disabled={busy}>Salvar senha</Button></form> : <p className="text-muted-foreground">Abra o link enviado ao seu e-mail para redefinir a senha.</p>}<Button asChild variant="outline"><Link to="/login">Voltar ao login</Link></Button></div></main>;
}