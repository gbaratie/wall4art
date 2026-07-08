import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/types';
import { Badge, Button, Card, Input, Label, Textarea } from '@/components/ui';
import { LocationMap } from '@/components/LocationMap';

export function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [mayorComment, setMayorComment] = useState('');
  const [proposal, setProposal] = useState({
    title: '',
    description: '',
    commitments: '',
    estimatedDurationDays: 14,
    fundingRequested: false,
    fundingAmount: 0,
    fundingDescription: '',
    sketchUrl: '',
    submit: true,
  });

  const { data: location, isLoading } = useQuery({
    queryKey: ['location', id],
    queryFn: () => api.getLocation(id!),
    enabled: !!id,
  });

  const { data: hostProposals = [] } = useQuery({
    queryKey: ['location-proposals', id],
    queryFn: () => api.getLocationProposals(id!),
    enabled: !!id && !!user && location?.hostId === user.id,
  });

  const mayorMutation = useMutation({
    mutationFn: ({ action }: { action: 'approve' | 'reject' }) =>
      action === 'approve'
        ? api.approveLocation(id!, mayorComment)
        : api.rejectLocation(id!, mayorComment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location', id] });
      queryClient.invalidateQueries({ queryKey: ['mayor', 'pending'] });
    },
  });

  const proposalMutation = useMutation({
    mutationFn: () => {
      const { sketchUrl, fundingAmount, fundingDescription, ...rest } = proposal;
      return api.createProposal(id!, {
        ...rest,
        ...(sketchUrl ? { sketchUrl } : {}),
        ...(rest.fundingRequested
          ? {
              fundingAmount: fundingAmount || undefined,
              fundingDescription: fundingDescription || undefined,
            }
          : { fundingRequested: false }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location', id] });
      queryClient.invalidateQueries({ queryKey: ['proposals', 'mine'] });
      setShowProposalForm(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ proposalId, status }: { proposalId: string; status: string }) =>
      api.updateProposalStatus(proposalId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location-proposals', id] });
      queryClient.invalidateQueries({ queryKey: ['location', id] });
    },
  });

  if (isLoading || !location) return <p>Chargement...</p>;

  const isHost = user?.id === location.hostId;
  const isMayor = user?.roles.includes('MAIRE');
  const isArtist = user?.roles.includes('ARTISTE');
  const canPropose = isArtist && location.status === 'OPEN';

  const handleSketch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await api.uploadImage(file);
    setProposal((p) => ({ ...p, sketchUrl: result.url }));
  };

  return (
    <div className="space-y-6">
      <img
        src={location.photoUrl}
        alt={location.title}
        className="h-48 w-full rounded-xl object-cover sm:h-56 sm:rounded-2xl md:h-64"
      />
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">{location.title}</h1>
        <Badge>{location.status}</Badge>
        <Badge tone="brand">{location.kind}</Badge>
      </div>
      <p className="text-slate-600">
        {location.address}, {location.postalCode} {location.city}
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Description</h2>
          <p className="mt-2 text-sm text-slate-600">{location.description}</p>
          <h2 className="mt-4 font-semibold">Attendu</h2>
          <p className="mt-2 text-sm text-slate-600">{location.expectedOutcome}</p>
        </Card>
        <LocationMap locations={[location]} center={[location.latitude, location.longitude]} zoom={14} />
      </div>

      {isMayor && location.status === 'PENDING_VALIDATION' && (
        <Card>
          <h2 className="font-semibold">Validation maire</h2>
          <Textarea
            className="mt-3"
            placeholder="Commentaire (optionnel)"
            value={mayorComment}
            onChange={(e) => setMayorComment(e.target.value)}
          />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => mayorMutation.mutate({ action: 'approve' })} className="w-full sm:w-auto">
              Approuver
            </Button>
            <Button
              variant="danger"
              onClick={() => mayorMutation.mutate({ action: 'reject' })}
              className="w-full sm:w-auto"
            >
              Rejeter
            </Button>
          </div>
        </Card>
      )}

      {canPropose && (
        <Card>
          {!showProposalForm ? (
            <Button onClick={() => setShowProposalForm(true)}>Soumettre une proposition</Button>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                proposalMutation.mutate();
              }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold">Nouvelle proposition</h2>
              <div>
                <Label>Titre</Label>
                <Input
                  value={proposal.title}
                  onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={proposal.description}
                  onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Engagements</Label>
                <Textarea
                  value={proposal.commitments}
                  onChange={(e) => setProposal({ ...proposal, commitments: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Durée estimée (jours)</Label>
                <Input
                  type="number"
                  value={proposal.estimatedDurationDays}
                  onChange={(e) =>
                    setProposal({ ...proposal, estimatedDurationDays: Number(e.target.value) })
                  }
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={proposal.fundingRequested}
                  onChange={(e) =>
                    setProposal({ ...proposal, fundingRequested: e.target.checked })
                  }
                />
                Demande de financement
              </label>
              {proposal.fundingRequested && (
                <>
                  <div>
                    <Label>Montant (€)</Label>
                    <Input
                      type="number"
                      value={proposal.fundingAmount}
                      onChange={(e) =>
                        setProposal({ ...proposal, fundingAmount: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <Label>Description du financement</Label>
                    <Textarea
                      value={proposal.fundingDescription}
                      onChange={(e) =>
                        setProposal({ ...proposal, fundingDescription: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
              <div>
                <Label>Croquis (optionnel)</Label>
                <Input type="file" accept="image/*" onChange={handleSketch} />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={proposalMutation.isPending} className="w-full sm:w-auto">
                  Envoyer
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowProposalForm(false)}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {isHost && (
        <Card>
          <h2 className="text-lg font-semibold">Propositions reçues</h2>
          {hostProposals.length === 0 ? (
            <p className="mt-2 text-sm text-slate-600">Aucune proposition pour le moment.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {hostProposals.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium">{p.title}</h3>
                      <p className="text-sm text-slate-500">par {p.artist?.name}</p>
                    </div>
                    <Badge>{p.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{p.description}</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        statusMutation.mutate({ proposalId: p.id, status: 'UNDER_REVIEW' })
                      }
                      className="w-full sm:w-auto"
                    >
                      En revue
                    </Button>
                    <Button
                      onClick={() => statusMutation.mutate({ proposalId: p.id, status: 'ACCEPTED' })}
                      className="w-full sm:w-auto"
                    >
                      Accepter
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => statusMutation.mutate({ proposalId: p.id, status: 'REJECTED' })}
                      className="w-full sm:w-auto"
                    >
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
