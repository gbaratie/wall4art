import { AlertCircle } from 'lucide-react';
import { getErrorMessage, getFieldErrors } from '@/lib/errors';
import { cn } from '@/lib/utils';

type ErrorAlertProps = {
  error: unknown;
  className?: string;
  title?: string;
};

export function ErrorAlert({ error, className, title }: ErrorAlertProps) {
  if (!error) return null;

  const message = getErrorMessage(error);
  const details = getFieldErrors(error);

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800',
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1">
          {title && <p className="font-medium">{title}</p>}
          <p>{message}</p>
          {details.length > 0 && (
            <ul className="list-inside list-disc text-red-700">
              {details.map((d) => (
                <li key={`${d.field}-${d.message}`}>{d.message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

type QueryErrorProps = {
  error: unknown;
  onRetry?: () => void;
  message?: string;
};

export function QueryErrorState({ error, onRetry, message }: QueryErrorProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-6">
      <ErrorAlert error={error} title={message ?? 'Impossible de charger les données'} />
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-red-700 underline hover:text-red-800"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}
