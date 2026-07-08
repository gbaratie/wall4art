import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }) {
  return (
    <button
      className={cn(
        'rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:opacity-50 sm:py-2',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-700',
        variant === 'secondary' && 'border border-slate-200 bg-white hover:bg-slate-50',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        className,
      )}
      {...props}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6', className)}>
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      {...props}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      {...props}
    />
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-sm font-medium text-slate-700">{children}</label>;
}

export function Badge({ children, tone = 'default' }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    brand: 'bg-brand-100 text-brand-700',
  };
  return (
    <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', tones[tone] ?? tones.default)}>
      {children}
    </span>
  );
}
