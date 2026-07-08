import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'block rounded-lg px-3 py-2.5 text-sm font-medium transition',
    isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100',
  );

export function Layout() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const navItems = (
    <>
      <NavLink to="/" className={navLinkClass} end onClick={closeMobile}>
        Accueil
      </NavLink>
      {user && (
        <>
          <NavLink to="/dashboard" className={navLinkClass} onClick={closeMobile}>
            Tableau de bord
          </NavLink>
          {user.roles.includes('ARTISTE') && (
            <NavLink to="/explore" className={navLinkClass} onClick={closeMobile}>
              Explorer
            </NavLink>
          )}
          {user.roles.includes('PARTICULIER') && (
            <NavLink to="/locations/new" className={navLinkClass} onClick={closeMobile}>
              Proposer un lieu
            </NavLink>
          )}
          <NavLink to="/messages" className={navLinkClass} onClick={closeMobile}>
            Messages
          </NavLink>
          <NavLink to="/profile" className={navLinkClass} onClick={closeMobile}>
            Profil
          </NavLink>
        </>
      )}
    </>
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:py-4">
          <Link to="/" className="text-lg font-bold text-brand-700 sm:text-xl">
            Wall4Art
          </Link>

          <nav className="hidden items-center gap-1 md:flex">{navItems}</nav>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <span className="hidden text-sm text-slate-500 lg:inline">{user.name}</span>
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

          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 px-4 py-4 md:hidden">
            <nav className="space-y-1">{navItems}</nav>
            <div className="mt-4 border-t border-slate-100 pt-4">
              {user ? (
                <div className="space-y-2">
                  <p className="px-3 text-sm text-slate-500">{user.name}</p>
                  <button
                    onClick={() => {
                      closeMobile();
                      signOut();
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    Déconnexion
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobile}
                    className="rounded-lg bg-brand-600 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-brand-700"
                  >
                    Inscription
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
