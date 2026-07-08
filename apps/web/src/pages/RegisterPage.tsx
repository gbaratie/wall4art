import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserRole } from '@wall4art/shared';
import { api } from '@/lib/types';
import { authClient } from '@/lib/auth-client';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input, Label } from '@/components/ui';

const roleOptions = [
  { value: UserRole.PARTICULIER, label: 'Particulier (proposer des lieux)' },
  { value: UserRole.ARTISTE, label: 'Artiste (proposer des œuvres)' },
  { value: UserRole.MAIRE, label: 'Maire (valider les lieux publics)' },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<string[]>([UserRole.PARTICULIER]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleRole = (role: string) => {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (roles.length === 0) {
      setError('Sélectionnez au moins un rôle');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.register({ name, email, password, roles });
      const result = await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message);
      await refresh();
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold">Inscription</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label>Nom</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
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
            minLength={8}
            required
          />
        </div>
        <div>
          <Label>Rôles</Label>
          <div className="mt-2 space-y-2">
            {roleOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={roles.includes(opt.value)}
                  onChange={() => toggleRole(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Création...' : 'Créer mon compte'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Déjà inscrit ?{' '}
        <Link to="/login" className="font-medium text-brand-600">
          Se connecter
        </Link>
      </p>
    </Card>
  );
}
