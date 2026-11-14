import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Activity, LogIn, Mail, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  if (user && !loading) return <Navigate to="/" replace />;
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'forgot') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        if (err) throw err;
        setMessage('Se este e-mail possui uma conta, você receberá um link para redefinir sua senha.');
      } else if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin, data: { name: name.trim() } } });
        if (err) throw err;
        setMessage('Confira seu e-mail e confirme a conta. O acesso depende da autorização do administrador.');
        setPassword('');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      }
    } catch { setError(mode === 'login' ? 'E-mail ou senha inválidos, ou e-mail ainda não confirmado.' : 'Não foi possível concluir. Confira os dados e tente novamente.'); }
    finally { setBusy(false); }
  }
  async function social(provider: 'google' | 'lovable') {
    setBusy(true); setError('');
    try { const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin }); if (result.error) setError('Não foi possível entrar. Tente novamente.'); }
    catch { setError('Não foi possível entrar. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <main className="min-h-screen bg-background px-6 py-12 flex flex-col items-center justify-center">
    <Link to="/" className="mb-8 flex gap-2 items-center text-muted-foreground"><ArrowLeft className="size-4" /> Início</Link>
    <div className="w-full max-w-sm space-y-6">
      <div className="text-center"><Activity className="size-10 mx-auto text-accent mb-3" /><h1 className="text-3xl font-bold">Clini<span className="text-accent">Plus</span></h1><h2 className="mt-2 text-lg text-muted-foreground">{mode === 'login' ? 'Acesso da equipe' : mode === 'signup' ? 'Ativar minha conta' : 'Recuperar senha'}</h2></div>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" autoComplete="name" required value={name} onChange={e => setName(e.target.value)} /></div>}
        <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        {mode !== 'forgot' && <div className="space-y-2"><Label htmlFor="password">Senha</Label><Input id="password" type="password" required minLength={mode === 'signup' ? 8 : undefined} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} /></div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}{message && <p role="status" className="text-sm text-success">{message}</p>}
        <Button className="w-full" disabled={busy} type="submit">{mode === 'forgot' ? <Mail /> : <LogIn />}{busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}</Button>
      </form>
      {mode === 'login' && <div className="space-y-3"><Button variant="outline" className="w-full google-sign-in" disabled={busy} onClick={() => void social('google')}><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-[18px]"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>Entrar com Google</Button><Button variant="outline" className="w-full" disabled={busy} onClick={() => void social('lovable')}>Entrar com Lovable</Button></div>}
      <div className="flex justify-center flex-wrap gap-2"><Button variant="link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage(''); }}>{mode === 'login' ? 'Ativar minha conta' : 'Já tenho conta'}</Button>{mode === 'login' && <Button variant="link" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}>Esqueci minha senha</Button>}</div>
    </div>
  </main>;
}