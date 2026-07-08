import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
  );

export function Layout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-xl font-bold text-brand-700">
            Wall4Art
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" className={navLinkClass} end>
              Accueil
            </NavLink>
            {user && (
              <>
                <NavLink to="/dashboard" className={navLinkClass}>
                  Tableau de bord
                </NavLink>
                {user.roles.includes('ARTISTE') && (
                  <NavLink to="/explore" className={navLinkClass}>
                    Explorer
                  </NavLink>
                )}
                {user.roles.includes('PARTICULIER') && (
                  <NavLink to="/locations/new" className={navLinkClass}>
                    Proposer un lieu
                  </NavLink>
                )}
                <NavLink to="/messages" className={navLinkClass}>
                  Messages
                </NavLink>
                <NavLink to="/profile" className={navLinkClass}>
                  Profil
                </NavLink>
              </>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-500 sm:inline">{user.name}</span>
                <button
                  onClick={() => signOut()}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
                >
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
