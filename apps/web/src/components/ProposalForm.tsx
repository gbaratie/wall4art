import { useState } from 'react';
import { Button, Input, Label, Textarea } from '@/components/ui';
import { ErrorAlert } from '@/components/ErrorAlert';
import { api } from '@/lib/types';
import type { Proposal } from '@/lib/types';

export type ProposalFormValues = {
  title: string;
  description: string;
  commitments: string;
  estimatedDurationDays: number;
  fundingRequested: boolean;
  fundingAmount: number;
  fundingDescription: string;
  sketchUrl: string;
};

const emptyValues: ProposalFormValues = {
  title: '',
  description: '',
  commitments: '',
  estimatedDurationDays: 14,
  fundingRequested: false,
  fundingAmount: 0,
  fundingDescription: '',
  sketchUrl: '',
};

export function proposalToFormValues(proposal: Proposal): ProposalFormValues {
  return {
    title: proposal.title,
    description: proposal.description,
    commitments: proposal.commitments,
    estimatedDurationDays: proposal.estimatedDurationDays,
    fundingRequested: proposal.fundingRequested,
    fundingAmount: proposal.fundingAmount ?? 0,
    fundingDescription: proposal.fundingDescription ?? '',
    sketchUrl: proposal.sketchUrl ?? '',
  };
}

type ProposalFormProps = {
  mode: 'create' | 'edit';
  initialValues?: ProposalFormValues;
  isDraft?: boolean;
  isPending?: boolean;
  error?: unknown;
  onSubmit: (values: ProposalFormValues, options: { submit: boolean }) => void;
  onCancel: () => void;
};

export function ProposalForm({
  mode,
  initialValues,
  isDraft = false,
  isPending = false,
  error,
  onSubmit,
  onCancel,
}: ProposalFormProps) {
  const [form, setForm] = useState<ProposalFormValues>(initialValues ?? emptyValues);
  const [uploadError, setUploadError] = useState<unknown>(null);

  const handleSketch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    try {
      const result = await api.uploadImage(file);
      setForm((p) => ({ ...p, sketchUrl: result.url }));
    } catch (err) {
      setUploadError(err);
    }
  };

  const buildPayload = (values: ProposalFormValues) => {
    const { sketchUrl, fundingAmount, fundingDescription, ...rest } = values;
    return {
      ...rest,
      ...(sketchUrl ? { sketchUrl } : {}),
      ...(rest.fundingRequested
        ? {
            fundingAmount: fundingAmount || undefined,
            fundingDescription: fundingDescription || undefined,
          }
        : { fundingRequested: false }),
    };
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form, { submit: true });
      }}
      className="space-y-4"
    >
      <h2 className="text-lg font-semibold">
        {mode === 'create' ? 'Nouvelle proposition' : 'Modifier la proposition'}
      </h2>

      <ErrorAlert error={error} />
      <ErrorAlert error={uploadError} />

      <div>
        <Label>Titre</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Engagements</Label>
        <Textarea
          value={form.commitments}
          onChange={(e) => setForm({ ...form, commitments: e.target.value })}
          required
        />
      </div>
      <div>
        <Label>Durée estimée (jours)</Label>
        <Input
          type="number"
          value={form.estimatedDurationDays}
          onChange={(e) =>
            setForm({ ...form, estimatedDurationDays: Number(e.target.value) })
          }
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.fundingRequested}
          onChange={(e) => setForm({ ...form, fundingRequested: e.target.checked })}
        />
        Demande de financement
      </label>
      {form.fundingRequested && (
        <>
          <div>
            <Label>Montant (€)</Label>
            <Input
              type="number"
              value={form.fundingAmount}
              onChange={(e) => setForm({ ...form, fundingAmount: Number(e.target.value) })}
            />
          </div>
          <div>
            <Label>Description du financement</Label>
            <Textarea
              value={form.fundingDescription}
              onChange={(e) => setForm({ ...form, fundingDescription: e.target.value })}
            />
          </div>
        </>
      )}
      <div>
        <Label>Croquis (optionnel)</Label>
        <Input type="file" accept="image/*" onChange={handleSketch} />
        {form.sketchUrl && (
          <p className="mt-1 text-xs text-green-600">Croquis téléversé</p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
          {isPending ? 'Enregistrement...' : mode === 'create' ? 'Envoyer' : 'Enregistrer'}
        </Button>
        {isDraft && (
          <Button
            variant="secondary"
            type="button"
            disabled={isPending}
            className="w-full sm:w-auto"
            onClick={() => onSubmit(form, { submit: false })}
          >
            Enregistrer le brouillon
          </Button>
        )}
        <Button
          variant="secondary"
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}

export function buildProposalPayload(values: ProposalFormValues) {
  const { sketchUrl, fundingAmount, fundingDescription, ...rest } = values;
  return {
    ...rest,
    ...(sketchUrl ? { sketchUrl } : {}),
    ...(rest.fundingRequested
      ? {
          fundingAmount: fundingAmount || undefined,
          fundingDescription: fundingDescription || undefined,
        }
      : { fundingRequested: false }),
  };
}
