import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input, Label } from '@/components/ui';

export function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message);
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    await authClient.signIn.social({ provider: 'google', callbackURL: window.location.origin });
  };

  return (
    <Card className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold">Connexion</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label>Mot de passe</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Connexion...' : 'Se connecter'}
        </Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-sm text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        ou
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      <Button variant="secondary" className="w-full" onClick={handleGoogle}>
        Continuer avec Google
      </Button>
      <p className="mt-4 text-center text-sm text-slate-500">
        Pas encore de compte ?{' '}
        <Link to="/register" className="font-medium text-brand-600">
          S&apos;inscrire
        </Link>
      </p>
    </Card>
  );
}
