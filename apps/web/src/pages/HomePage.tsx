import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';

export function HomePage() {
  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="rounded-2xl bg-gradient-to-br from-brand-600 to-violet-800 px-5 py-10 text-white sm:rounded-3xl sm:px-8 sm:py-16">
        <h1 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
          Connectez lieux à décorer et artistes muralistes
        </h1>
        <p className="mt-3 max-w-2xl text-base text-violet-100 sm:mt-4 sm:text-lg">
          Wall4Art met en relation particuliers, collectivités et artistes pour transformer les murs
          en œuvres. Proposez un lieu, soumettez une proposition, échangez et validez en toute
          transparence.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
          <Link to="/register" className="w-full sm:w-auto">
            <Button className="w-full bg-white text-brand-700 hover:bg-violet-50 sm:w-auto">
              Créer un compte
            </Button>
          </Link>
          <Link to="/explore" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full border-white/30 bg-white/10 text-white sm:w-auto"
            >
              Explorer les lieux
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <Card>
          <h2 className="text-lg font-semibold">Proposer un lieu</h2>
          <p className="mt-2 text-sm text-slate-600">
            Particuliers et porteurs de projet décrivent le mur, l&apos;attendu et la localisation.
            Les lieux publics peuvent nécessiter la validation du maire.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Soumettre une œuvre</h2>
          <p className="mt-2 text-sm text-slate-600">
            Artistes : croquis, descriptif, engagements, délai estimé et option de financement pour
            chaque proposition.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Échanger et valider</h2>
          <p className="mt-2 text-sm text-slate-600">
            Discutez entre hôte et artiste, demandez des précisions, puis acceptez ou refusez la
            proposition retenue.
          </p>
        </Card>
      </section>
    </div>
  );
}
