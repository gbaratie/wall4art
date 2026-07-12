import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/types';
import { Badge, Button, Card, Textarea } from '@/components/ui';
import { LocationMap } from '@/components/LocationMap';
import { ErrorAlert, QueryErrorState } from '@/components/ErrorAlert';
import {
  ProposalForm,
  buildProposalPayload,
  proposalToFormValues,
  type ProposalFormValues,
} from '@/components/ProposalForm';

const EDITABLE_STATUSES = ['DRAFT', 'SUBMITTED'];

export function LocationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [mayorComment, setMayorComment] = useState('');

  const {
    data: location,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['location', id],
    queryFn: () => api.getLocation(id!),
    enabled: !!id,
  });

  const { data: myProposals = [] } = useQuery({
    queryKey: ['proposals', 'mine'],
    queryFn: api.getMyProposals,
    enabled: !!user?.roles.includes('ARTISTE'),
  });

  const { data: hostProposals = [] } = useQuery({
    queryKey: ['location-proposals', id],
    queryFn: () => api.getLocationProposals(id!),
    enabled: !!id && !!user && location?.hostId === user.id,
  });

  const existingProposal = myProposals.find((p) => p.locationId === id);
  const canEditProposal =
    existingProposal && EDITABLE_STATUSES.includes(existingProposal.status);

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
    mutationFn: ({ values, submit }: { values: ProposalFormValues; submit: boolean }) =>
      api.createProposal(id!, { ...buildProposalPayload(values), submit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location', id] });
      queryClient.invalidateQueries({ queryKey: ['proposals', 'mine'] });
      setShowProposalForm(false);
    },
  });

  const updateProposalMutation = useMutation({
    mutationFn: ({ values, submit }: { values: ProposalFormValues; submit: boolean }) =>
      api.updateProposal(existingProposal!.id, {
        ...buildProposalPayload(values),
        submit,
      }),
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

  if (isLoading) return <p>Chargement...</p>;
  if (isError) return <QueryErrorState error={error} onRetry={() => refetch()} />;
  if (!location) return null;

  const isHost = user?.id === location.hostId;
  const isMayor = user?.roles.includes('MAIRE');
  const isArtist = user?.roles.includes('ARTISTE');
  const canPropose = isArtist && location.status === 'OPEN' && !existingProposal;

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
          <ErrorAlert error={mayorMutation.error} className="mt-3" />
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
            <ProposalForm
              mode="create"
              isPending={proposalMutation.isPending}
              error={proposalMutation.error}
              onSubmit={(values, { submit }) => proposalMutation.mutate({ values, submit })}
              onCancel={() => setShowProposalForm(false)}
            />
          )}
        </Card>
      )}

      {canEditProposal && existingProposal && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">Ma proposition</h2>
              <p className="text-sm text-slate-500">Statut : {existingProposal.status}</p>
            </div>
            {!showProposalForm && (
              <Button onClick={() => setShowProposalForm(true)}>Modifier</Button>
            )}
          </div>
          {!showProposalForm ? (
            <p className="text-sm text-slate-600">{existingProposal.description}</p>
          ) : (
            <ProposalForm
              mode="edit"
              initialValues={proposalToFormValues(existingProposal)}
              isDraft={existingProposal.status === 'DRAFT'}
              isPending={updateProposalMutation.isPending}
              error={updateProposalMutation.error}
              onSubmit={(values, { submit }) =>
                updateProposalMutation.mutate({ values, submit })
              }
              onCancel={() => setShowProposalForm(false)}
            />
          )}
        </Card>
      )}

      {isHost && (
        <Card>
          <h2 className="text-lg font-semibold">Propositions reçues</h2>
          <ErrorAlert error={statusMutation.error} className="mt-3" />
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
