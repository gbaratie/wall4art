import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/types';
import { Card } from '@/components/ui';
import { QueryErrorState } from '@/components/ErrorAlert';
import {
  ProposalForm,
  buildProposalPayload,
  proposalToFormValues,
  type ProposalFormValues,
} from '@/components/ProposalForm';

const EDITABLE_STATUSES = ['DRAFT', 'SUBMITTED'];

export function EditProposalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: proposal, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['proposal', id],
    queryFn: () => api.getProposal(id!),
    enabled: !!id && !!user,
  });

  const mutation = useMutation({
    mutationFn: ({ values, submit }: { values: ProposalFormValues; submit: boolean }) =>
      api.updateProposal(id!, { ...buildProposalPayload(values), submit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal', id] });
      queryClient.invalidateQueries({ queryKey: ['proposals', 'mine'] });
      if (proposal) {
        queryClient.invalidateQueries({ queryKey: ['location', proposal.locationId] });
      }
      navigate('/dashboard');
    },
  });

  if (!user) return null;
  if (isLoading) return <p>Chargement...</p>;
  if (isError) return <QueryErrorState error={error} onRetry={() => refetch()} />;
  if (!proposal) return null;

  if (proposal.artistId !== user.id) {
    return (
      <Card>
        <p className="text-slate-600">Vous ne pouvez pas modifier cette proposition.</p>
      </Card>
    );
  }

  if (!EDITABLE_STATUSES.includes(proposal.status)) {
    return (
      <Card>
        <p className="text-slate-600">
          Cette proposition ne peut plus être modifiée (statut : {proposal.status}).
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-2xl">
      <ProposalForm
        mode="edit"
        initialValues={proposalToFormValues(proposal)}
        isDraft={proposal.status === 'DRAFT'}
        isPending={mutation.isPending}
        error={mutation.error}
        onSubmit={(values, { submit }) => mutation.mutate({ values, submit })}
        onCancel={() => navigate(-1)}
      />
    </Card>
  );
}
