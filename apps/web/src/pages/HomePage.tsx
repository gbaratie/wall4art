import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-brand-600 to-violet-800 px-8 py-16 text-white">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight">
          Connectez lieux à décorer et artistes muralistes
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-violet-100">
          Wall4Art met en relation particuliers, collectivités et artistes pour transformer les murs
          en œuvres. Proposez un lieu, soumettez une proposition, échangez et validez en toute
          transparence.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register">
            <Button className="bg-white text-brand-700 hover:bg-violet-50">Créer un compte</Button>
          </Link>
          <Link to="/explore">
            <Button variant="secondary" className="border-white/30 bg-white/10 text-white">
              Explorer les lieux
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
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
