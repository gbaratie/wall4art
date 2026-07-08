import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/types';
import { Badge, Button, Card } from '@/components/ui';

export function DashboardPage() {
  const { user } = useAuth();

  const { data: myLocations = [] } = useQuery({
    queryKey: ['locations', 'mine'],
    queryFn: () => api.getLocations({ mine: true }),
    enabled: !!user?.roles.includes('PARTICULIER'),
  });

  const { data: pendingMayor = [] } = useQuery({
    queryKey: ['mayor', 'pending'],
    queryFn: api.getPendingMayorLocations,
    enabled: !!user?.roles.includes('MAIRE'),
  });

  const { data: myProposals = [] } = useQuery({
    queryKey: ['proposals', 'mine'],
    queryFn: api.getMyProposals,
    enabled: !!user?.roles.includes('ARTISTE'),
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bonjour, {user.name}</h1>
        <p className="mt-2 text-slate-600">
          Rôles : {user.roles.map((r) => r.toLowerCase()).join(', ')}
        </p>
      </div>

      {user.roles.includes('PARTICULIER') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mes lieux</h2>
            <Link to="/locations/new">
              <Button>Nouveau lieu</Button>
            </Link>
          </div>
          {myLocations.length === 0 ? (
            <Card>
              <p className="text-slate-600">Aucun lieu proposé pour le moment.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myLocations.map((loc) => (
                <Card key={loc.id}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{loc.title}</h3>
                    <Badge tone={loc.status === 'OPEN' ? 'success' : 'warning'}>{loc.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{loc.city}</p>
                  <Link to={`/locations/${loc.id}`} className="mt-4 inline-block text-sm text-brand-600">
                    Voir le détail →
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {user.roles.includes('MAIRE') && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Lieux en attente de validation</h2>
          {pendingMayor.length === 0 ? (
            <Card>
              <p className="text-slate-600">Aucune demande en attente.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingMayor.map((loc) => (
                <Card key={loc.id}>
                  <h3 className="font-semibold">{loc.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{loc.address}, {loc.city}</p>
                  <Link to={`/locations/${loc.id}`} className="mt-3 inline-block text-sm text-brand-600">
                    Examiner →
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {user.roles.includes('ARTISTE') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Mes propositions</h2>
            <Link to="/explore">
              <Button variant="secondary">Explorer les lieux</Button>
            </Link>
          </div>
          {myProposals.length === 0 ? (
            <Card>
              <p className="text-slate-600">Aucune proposition soumise.</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myProposals.map((p) => (
                <Card key={p.id}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold">{p.title}</h3>
                    <Badge>{p.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{p.location?.title}</p>
                  <Link
                    to={`/locations/${p.locationId}`}
                    className="mt-4 inline-block text-sm text-brand-600"
                  >
                    Voir le lieu →
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
