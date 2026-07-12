import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/types';
import { Button, Card, Input, Label, Textarea } from '@/components/ui';
import { ErrorAlert } from '@/components/ErrorAlert';

export function ProfilePage() {
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const profile = user?.profile;

  const [form, setForm] = useState({
    name: user?.name ?? '',
    bio: profile?.bio ?? '',
    city: profile?.city ?? '',
    searchRadiusKm: profile?.searchRadiusKm ?? 50,
    instagram: profile?.portfolioLinks?.instagram ?? '',
    behance: profile?.portfolioLinks?.behance ?? '',
    website: profile?.portfolioLinks?.website ?? '',
  });

  const mutation = useMutation({
    mutationFn: () =>
      api.updateProfile({
        name: form.name,
        bio: form.bio,
        city: form.city,
        searchRadiusKm: form.searchRadiusKm,
        portfolioLinks: {
          instagram: form.instagram || undefined,
          behance: form.behance || undefined,
          website: form.website || undefined,
        },
      }),
    onSuccess: async () => {
      await refresh();
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  if (!user) {
    return <Card>Connectez-vous pour modifier votre profil.</Card>;
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold sm:text-2xl">Mon profil</h1>
      <p className="mt-1 text-sm text-slate-500">{user.email}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="mt-6 space-y-4"
      >
        <div>
          <Label>Nom</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Ville</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Ex. Lyon, Paris 11e"
            />
          </div>
          <div>
            <Label>Rayon de recherche (km)</Label>
            <Input
              type="number"
              value={form.searchRadiusKm}
              onChange={(e) => setForm({ ...form, searchRadiusKm: Number(e.target.value) })}
            />
          </div>
        </div>
        <p className="text-sm text-slate-500">
          Votre ville sert à trouver les lieux à proximité — aucune coordonnée à saisir.
        </p>

        {user.roles.includes('ARTISTE') && (
          <>
            <h2 className="pt-2 font-semibold">Liens portfolio</h2>
            <div>
              <Label>Instagram</Label>
              <Input
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="https://instagram.com/..."
              />
            </div>
            <div>
              <Label>Behance</Label>
              <Input
                value={form.behance}
                onChange={(e) => setForm({ ...form, behance: e.target.value })}
                placeholder="https://behance.net/..."
              />
            </div>
            <div>
              <Label>Site web</Label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </>
        )}

        <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
          {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
        <ErrorAlert error={mutation.error} />
        {mutation.isSuccess && (
          <p className="text-sm text-green-600">Profil mis à jour.</p>
        )}
      </form>
    </Card>
  );
}
