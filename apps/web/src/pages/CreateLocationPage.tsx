import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LocationKind } from '@wall4art/shared';
import { api } from '@/lib/types';
import { Button, Card, Input, Label, Textarea } from '@/components/ui';

export function CreateLocationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    expectedOutcome: '',
    kind: LocationKind.PRIVATE,
    requiresMayorValidation: false,
    address: '',
    city: '',
    postalCode: '',
    latitude: 48.8566,
    longitude: 2.3522,
    publish: true,
  });

  const update = (key: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await api.uploadImage(file);
    setPhotoUrl(result.url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setError('Ajoutez une photo du lieu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const location = await api.createLocation({ ...form, photoUrl });
      navigate(`/locations/${location.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <h1 className="text-2xl font-bold">Proposer un lieu à décorer</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label>Titre</Label>
          <Input value={form.title} onChange={(e) => update('title', e.target.value)} required />
        </div>
        <div>
          <Label>Description du lieu</Label>
          <Textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            required
          />
        </div>
        <div>
          <Label>Ce qui est attendu</Label>
          <Textarea
            value={form.expectedOutcome}
            onChange={(e) => update('expectedOutcome', e.target.value)}
            rows={4}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Type de lieu</Label>
            <select
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={form.kind}
              onChange={(e) => update('kind', e.target.value)}
            >
              <option value={LocationKind.PRIVATE}>Privé</option>
              <option value={LocationKind.PUBLIC}>Public</option>
            </select>
          </div>
          {form.kind === LocationKind.PUBLIC && (
            <label className="flex items-end gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={form.requiresMayorValidation}
                onChange={(e) => update('requiresMayorValidation', e.target.checked)}
              />
              Validation du maire requise
            </label>
          )}
        </div>
        <div>
          <Label>Adresse</Label>
          <Input value={form.address} onChange={(e) => update('address', e.target.value)} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Ville</Label>
            <Input value={form.city} onChange={(e) => update('city', e.target.value)} required />
          </div>
          <div>
            <Label>Code postal</Label>
            <Input
              value={form.postalCode}
              onChange={(e) => update('postalCode', e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Latitude</Label>
            <Input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => update('latitude', Number(e.target.value))}
              required
            />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => update('longitude', Number(e.target.value))}
              required
            />
          </div>
        </div>
        <div>
          <Label>Photo du lieu</Label>
          <Input type="file" accept="image/*" onChange={handlePhoto} />
          {photoUrl && (
            <img src={photoUrl} alt="Aperçu" className="mt-2 h-40 rounded-lg object-cover" />
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? 'Publication...' : 'Publier le lieu'}
        </Button>
      </form>
    </Card>
  );
}
