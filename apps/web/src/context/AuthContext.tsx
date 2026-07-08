import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { api, type UserProfile } from '@/lib/types';

type AuthContextValue = {
  user: UserProfile | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [sessionChecked, setSessionChecked] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.me();
      } catch {
        return null;
      }
    },
    enabled: sessionChecked,
    retry: false,
  });

  useEffect(() => {
    authClient.getSession().finally(() => setSessionChecked(true));
  }, []);

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const signOut = async () => {
    await authClient.signOut();
    queryClient.setQueryData(['me'], null);
    await queryClient.invalidateQueries();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: !sessionChecked || isLoading,
        refresh,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
