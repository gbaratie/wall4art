import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button, Card, Input } from '@/components/ui';
import { formatDate } from '@/lib/utils';

export function MessagesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [content, setContent] = useState('');

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: api.getConversations,
    enabled: !!user,
    refetchInterval: 10000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => api.getMessages(selectedId!),
    enabled: !!selectedId,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: () => api.sendMessage(selectedId!, content),
    onSuccess: () => {
      setContent('');
      queryClient.invalidateQueries({ queryKey: ['messages', selectedId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  if (!user) {
    return <Card>Connectez-vous pour accéder à la messagerie.</Card>;
  }

  const selected = conversations.find((c) => c.id === selectedId);
  const showListOnMobile = !selectedId;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className={`lg:col-span-1 ${!showListOnMobile ? 'hidden lg:block' : ''}`}>
        <h1 className="text-xl font-bold sm:text-2xl">Conversations</h1>
        <div className="mt-4 space-y-2">
          {conversations.length === 0 && (
            <p className="text-sm text-slate-500">Aucune conversation pour le moment.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full rounded-lg border px-3 py-3 text-left text-sm ${
                selectedId === c.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200'
              }`}
            >
              <div className="font-medium">{c.location.title}</div>
              <div className="text-slate-500">
                {user.id === c.hostId ? c.artist.name : c.host.name}
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card
        className={`flex min-h-[20rem] flex-col sm:min-h-[24rem] lg:col-span-2 lg:min-h-[28rem] ${showListOnMobile ? 'hidden lg:flex' : ''}`}
      >
        {!selected ? (
          <p className="text-slate-500">Sélectionnez une conversation.</p>
        ) : (
          <>
            <div className="border-b border-slate-100 pb-4">
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="mb-2 flex items-center gap-1 text-sm text-brand-600 lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <h2 className="font-semibold">{selected.location.title}</h2>
              <p className="text-sm text-slate-500">
                {user.id === selected.hostId ? selected.artist.name : selected.host.name}
              </p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto py-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm sm:max-w-[80%] ${
                    m.sender.id === user.id
                      ? 'ml-auto bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  <p>{m.content}</p>
                  <p className="mt-1 text-xs opacity-70">{formatDate(m.createdAt)}</p>
                </div>
              ))}
            </div>
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (!content.trim()) return;
                sendMutation.mutate();
              }}
            >
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Votre message..."
                className="flex-1"
              />
              <Button type="submit" disabled={sendMutation.isPending} className="shrink-0 sm:w-auto">
                Envoyer
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
