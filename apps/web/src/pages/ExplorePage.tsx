import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/types';
import { Badge, Card } from '@/components/ui';
import { QueryErrorState } from '@/components/ErrorAlert';
import { LocationMap } from '@/components/LocationMap';

export function ExplorePage() {
  const { user } = useAuth();
  const profile = user?.profile;

  const { data: locations = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['locations', 'explore', profile?.latitude, profile?.longitude, profile?.city],
    queryFn: () =>
      api.getLocations({
        status: 'OPEN',
        ...(profile?.latitude != null && profile?.longitude != null
          ? {
              latitude: profile.latitude,
              longitude: profile.longitude,
            }
          : profile?.city
            ? { city: profile.city }
            : {}),
        radiusKm: profile?.searchRadiusKm ?? 50,
      }),
    enabled: !!user,
  });

  if (!user) {
    return <Card>Connectez-vous en tant qu&apos;artiste pour explorer les lieux.</Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Explorer les lieux</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Lieux ouverts dans un rayon de {profile?.searchRadiusKm ?? 50} km
          {profile?.city ? ` autour de ${profile.city}` : ''}.
        </p>
      </div>

      <LocationMap
        locations={locations}
        center={
          profile?.latitude != null && profile?.longitude != null
            ? [profile.latitude, profile.longitude]
            : undefined
        }
      />

      {isError ? (
        <QueryErrorState error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <p>Chargement...</p>
      ) : locations.length === 0 ? (
        <Card>
          <p className="text-slate-600">Aucun lieu ouvert dans votre zone pour le moment.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((loc) => (
            <Card key={loc.id}>
              <img
                src={loc.photoUrl}
                alt={loc.title}
                className="mb-4 h-40 w-full rounded-lg object-cover"
              />
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-lg font-semibold">{loc.title}</h2>
                <Badge tone="brand">{loc.kind}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {loc.address}, {loc.postalCode} {loc.city}
              </p>
              {loc.distanceKm != null && (
                <p className="text-sm text-slate-500">{loc.distanceKm.toFixed(1)} km</p>
              )}
              <Link to={`/locations/${loc.id}`} className="mt-4 inline-block text-sm text-brand-600">
                Voir et proposer →
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
