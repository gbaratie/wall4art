import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/types';
import { Badge, Button, Card } from '@/components/ui';
import { QueryErrorState } from '@/components/ErrorAlert';

const EDITABLE_STATUSES = ['DRAFT', 'SUBMITTED'];

export function DashboardPage() {
  const { user } = useAuth();

  const {
    data: myLocations = [],
    isError: locationsError,
    error: locationsErr,
    refetch: refetchLocations,
  } = useQuery({
    queryKey: ['locations', 'mine'],
    queryFn: () => api.getLocations({ mine: true }),
    enabled: !!user?.roles.includes('PARTICULIER'),
  });

  const {
    data: pendingMayor = [],
    isError: mayorError,
    error: mayorErr,
    refetch: refetchMayor,
  } = useQuery({
    queryKey: ['mayor', 'pending'],
    queryFn: api.getPendingMayorLocations,
    enabled: !!user?.roles.includes('MAIRE'),
  });

  const {
    data: myProposals = [],
    isError: proposalsError,
    error: proposalsErr,
    refetch: refetchProposals,
  } = useQuery({
    queryKey: ['proposals', 'mine'],
    queryFn: api.getMyProposals,
    enabled: !!user?.roles.includes('ARTISTE'),
  });

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Bonjour, {user.name}</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Rôles : {user.roles.map((r) => r.toLowerCase()).join(', ')}
        </p>
      </div>

      {user.roles.includes('PARTICULIER') && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold sm:text-xl">Mes lieux</h2>
            <Link to="/locations/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Nouveau lieu</Button>
            </Link>
          </div>
          {locationsError ? (
            <QueryErrorState error={locationsErr} onRetry={() => refetchLocations()} />
          ) : myLocations.length === 0 ? (
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
          <h2 className="text-lg font-semibold sm:text-xl">Lieux en attente de validation</h2>
          {mayorError ? (
            <QueryErrorState error={mayorErr} onRetry={() => refetchMayor()} />
          ) : pendingMayor.length === 0 ? (
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold sm:text-xl">Mes propositions</h2>
            <Link to="/explore" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                Explorer les lieux
              </Button>
            </Link>
          </div>
          {proposalsError ? (
            <QueryErrorState error={proposalsErr} onRetry={() => refetchProposals()} />
          ) : myProposals.length === 0 ? (
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
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={`/locations/${p.locationId}`}
                      className="text-sm text-brand-600"
                    >
                      Voir le lieu →
                    </Link>
                    {EDITABLE_STATUSES.includes(p.status) && (
                      <Link
                        to={`/proposals/${p.id}/edit`}
                        className="text-sm font-medium text-brand-600"
                      >
                        Modifier →
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
