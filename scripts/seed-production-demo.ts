/**
 * Peuple la base de production via l'API publique (comptes + contenu de démo).
 * Idempotent : ignore les comptes déjà existants, ne recrée pas les lieux déjà présents.
 *
 * Usage :
 *   pnpm seed:production:demo
 *   API_URL=https://wall4art-api.onrender.com pnpm seed:production:demo
 */

const API_URL = process.env.API_URL ?? 'https://wall4art-api.onrender.com';
const ORIGIN = process.env.CORS_ORIGIN ?? 'https://gbaratie.github.io';
const PASSWORD = 'password123';
const AUTH_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 5): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimit = message.includes('(429)');
      if (!isRateLimit || i === attempts - 1) throw error;
      const wait = AUTH_DELAY_MS * (i + 2);
      console.log(`⏳ Rate limit sur ${label}, nouvel essai dans ${wait}ms…`);
      await sleep(wait);
    }
  }
  throw new Error(`Échec après ${attempts} tentatives : ${label}`);
}

const ACCOUNTS = {
  maire: { email: 'maire@wall4art.local', name: 'Mairesse de Paris', roles: ['MAIRE'] as const },
  marie: { email: 'marie@wall4art.local', name: 'Marie Dupont', roles: ['PARTICULIER'] as const },
  pierre: { email: 'pierre@wall4art.local', name: 'Pierre Martin', roles: ['PARTICULIER'] as const },
  lea: { email: 'lea@wall4art.local', name: 'Léa Artiste Paris', roles: ['ARTISTE'] as const },
  tom: { email: 'tom@wall4art.local', name: 'Tom Artiste Lyon', roles: ['ARTISTE'] as const },
};

const PROFILES: Record<keyof typeof ACCOUNTS, Record<string, unknown>> = {
  maire: { city: 'Paris', bio: 'Maire de démonstration — validation des lieux publics.' },
  marie: {
    city: 'Paris',
    bio: 'Particulière parisienne, propose des murs de cour et de jardin.',
    searchRadiusKm: 30,
  },
  pierre: {
    city: 'Paris',
    bio: 'Passionné de street art, propose des espaces publics du 20e.',
    searchRadiusKm: 40,
  },
  lea: {
    city: 'Paris',
    bio: 'Artiste muraliste spécialisée en fresques végétales et nature urbaine.',
    searchRadiusKm: 30,
    portfolioLinks: {
      instagram: 'https://instagram.com/example',
      website: 'https://example.com',
    },
  },
  tom: {
    city: 'Lyon',
    bio: 'Artiste lyonnais, styles géométriques et couleurs vives.',
    searchRadiusKm: 50,
    portfolioLinks: {
      instagram: 'https://instagram.com/example',
      behance: 'https://behance.net/example',
    },
  },
};

const PHOTOS = {
  private: 'https://images.unsplash.com/photo-1518998053901-8ea9341191a5?w=800',
  pending: 'https://images.unsplash.com/photo-1499781350151-5dea69240ad9?w=800',
  public: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
  sketch: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
};

type AccountKey = keyof typeof ACCOUNTS;

class ApiClient {
  private cookies = new Map<string, string>();

  private storeCookies(response: Response) {
    for (const raw of response.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(';');
      const eq = pair.indexOf('=');
      if (eq === -1) continue;
      this.cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  }

  clearCookies() {
    this.cookies.clear();
  }

  async request<T = unknown>(
    path: string,
    options: RequestInit = {},
  ): Promise<{ status: number; body: T | null }> {
    const headers = new Headers(options.headers);
    headers.set('Origin', ORIGIN);
    if (!(options.body instanceof FormData) && options.body != null) {
      headers.set('Content-Type', 'application/json');
    }
    if (this.cookies.size > 0) {
      headers.set(
        'Cookie',
        [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '),
      );
    }

    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    this.storeCookies(response);

    const text = await response.text();
    const body = text ? (JSON.parse(text) as T) : null;
    return { status: response.status, body };
  }
}

async function registerAccount(client: ApiClient, key: AccountKey) {
  const account = ACCOUNTS[key];
  const { status, body } = await client.request('/api/v1/register', {
    method: 'POST',
    body: JSON.stringify({
      ...account,
      password: PASSWORD,
      roles: [...account.roles],
    }),
  });

  if (status === 201) {
    console.log(`✓ Compte créé : ${account.email}`);
    return;
  }
  if (status === 409) {
    console.log(`· Compte existant : ${account.email}`);
    return;
  }
  throw new Error(`Inscription ${account.email} échouée (${status}) : ${JSON.stringify(body)}`);
}

async function login(client: ApiClient, key: AccountKey) {
  await withRetry(`connexion ${ACCOUNTS[key].email}`, async () => {
    client.clearCookies();
    const { status, body } = await client.request('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email: ACCOUNTS[key].email, password: PASSWORD }),
    });
    if (status !== 200) {
      throw new Error(`Connexion ${ACCOUNTS[key].email} échouée (${status}) : ${JSON.stringify(body)}`);
    }
  });
  await sleep(AUTH_DELAY_MS);
}

async function updateProfile(client: ApiClient, key: AccountKey) {
  const { status, body } = await client.request('/api/v1/me', {
    method: 'PATCH',
    body: JSON.stringify(PROFILES[key]),
  });
  if (status !== 200) {
    throw new Error(`Profil ${ACCOUNTS[key].email} échoué (${status}) : ${JSON.stringify(body)}`);
  }
}

async function listMyLocations(client: ApiClient) {
  const { status, body } = await client.request<Array<{ id: string; title: string }>>(
    '/api/v1/locations?mine=true',
  );
  if (status !== 200 || !Array.isArray(body)) {
    throw new Error(`Liste lieux échouée (${status})`);
  }
  return body;
}

async function createLocation(
  client: ApiClient,
  data: {
    title: string;
    description: string;
    expectedOutcome: string;
    kind: 'PRIVATE' | 'PUBLIC';
    requiresMayorValidation: boolean;
    address: string;
    city: string;
    postalCode: string;
    photoUrl: string;
    publish: boolean;
  },
) {
  const existing = await listMyLocations(client);
  const found = existing.find((loc) => loc.title === data.title);
  if (found) {
    console.log(`· Lieu existant : ${data.title} (${found.id})`);
    return found.id;
  }

  const { status, body } = await client.request<{ id: string; title: string }>('/api/v1/locations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (status !== 201 || !body?.id) {
    throw new Error(`Création lieu "${data.title}" échouée (${status}) : ${JSON.stringify(body)}`);
  }
  console.log(`✓ Lieu créé : ${data.title} (${body.id})`);
  return body.id;
}

async function createProposal(
  client: ApiClient,
  locationId: string,
  data: {
    title: string;
    description: string;
    commitments: string;
    estimatedDurationDays: number;
    sketchUrl: string;
    fundingRequested: boolean;
    fundingAmount?: number;
    fundingDescription?: string;
  },
) {
  const { status: listStatus, body: proposals } = await client.request<
    Array<{ id: string; title: string; locationId: string }>
  >('/api/v1/proposals/mine');
  if (listStatus === 200 && Array.isArray(proposals)) {
    const found = proposals.find((p) => p.locationId === locationId && p.title === data.title);
    if (found) {
      console.log(`· Proposition existante : ${data.title} (${found.id})`);
      return found.id;
    }
  }

  const { status, body } = await client.request<{ id: string }>(
    `/api/v1/locations/${locationId}/proposals`,
    {
      method: 'POST',
      body: JSON.stringify({ ...data, submit: true }),
    },
  );
  if (status !== 201 || !body?.id) {
    throw new Error(`Proposition "${data.title}" échouée (${status}) : ${JSON.stringify(body)}`);
  }
  console.log(`✓ Proposition créée : ${data.title} (${body.id})`);
  return body.id;
}

async function ensureConversation(client: ApiClient, locationId: string) {
  const { status, body } = await client.request<{ id: string }>('/api/v1/conversations', {
    method: 'POST',
    body: JSON.stringify({ locationId }),
  });
  if ((status !== 201 && status !== 200) || !body?.id) {
    throw new Error(`Conversation échouée (${status}) : ${JSON.stringify(body)}`);
  }
  return body.id;
}

async function sendMessage(client: ApiClient, conversationId: string, content: string) {
  const { status, body } = await client.request(`/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  if (status !== 201) {
    throw new Error(`Message échoué (${status}) : ${JSON.stringify(body)}`);
  }
}

async function listPendingMayorLocations(client: ApiClient) {
  const { status, body } = await client.request<Array<{ id: string; title: string }>>(
    '/api/v1/mayor/locations/pending',
  );
  if (status !== 200 || !Array.isArray(body)) return [];
  return body;
}

async function approveLocation(client: ApiClient, locationId: string, comment?: string) {
  const { status, body } = await client.request(`/api/v1/mayor/locations/${locationId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });
  if (status !== 200) {
    throw new Error(`Approbation ${locationId} échouée (${status}) : ${JSON.stringify(body)}`);
  }
  console.log(`✓ Lieu approuvé par la maire : ${locationId}`);
}

async function main() {
  console.log(`Peuplement démo → ${API_URL}\n`);
  const client = new ApiClient();

  for (const key of Object.keys(ACCOUNTS) as AccountKey[]) {
    await registerAccount(client, key);
    await sleep(500);
  }

  for (const key of Object.keys(ACCOUNTS) as AccountKey[]) {
    await login(client, key);
    await updateProfile(client, key);
  }

  await login(client, 'marie');
  const privateLocationId = await createLocation(client, {
    title: 'Mur de cour intérieure',
    description: 'Cour privée avec un grand mur blanc, exposition sud.',
    expectedOutcome: 'Fresque colorée sur le thème de la nature urbaine.',
    kind: 'PRIVATE',
    requiresMayorValidation: false,
    address: '12 rue des Fleurs',
    city: 'Paris',
    postalCode: '75011',
    photoUrl: PHOTOS.private,
    publish: true,
  });

  await login(client, 'pierre');
  const pendingLocationId = await createLocation(client, {
    title: 'Sous-passage place du marché',
    description: 'Espace public sous le marché, fort passage piéton.',
    expectedOutcome: 'Œuvre participative célébrant le quartier.',
    kind: 'PUBLIC',
    requiresMayorValidation: true,
    address: 'Place du Marché',
    city: 'Paris',
    postalCode: '75020',
    photoUrl: PHOTOS.pending,
    publish: true,
  });

  const publicLocationId = await createLocation(client, {
    title: 'Mur bibliothèque municipale',
    description: 'Mur latéral de la bibliothèque, visible depuis le parc.',
    expectedOutcome: 'Fresque littéraire et inclusive.',
    kind: 'PUBLIC',
    requiresMayorValidation: true,
    address: '5 avenue de la Lecture',
    city: 'Paris',
    postalCode: '75013',
    photoUrl: PHOTOS.public,
    publish: true,
  });

  await login(client, 'lea');
  await createProposal(client, privateLocationId, {
    title: 'Jardin vertical peint',
    description: 'Proposition de fresque végétale avec oiseaux et plantes locales.',
    commitments: 'Utilisation de peintures écologiques, protection du sol, nettoyage quotidien.',
    estimatedDurationDays: 14,
    sketchUrl: PHOTOS.sketch,
    fundingRequested: true,
    fundingAmount: 2500,
    fundingDescription: 'Matériaux, nacelles et temps artiste.',
  });

  await login(client, 'lea');
  const conversationId = await ensureConversation(client, privateLocationId);
  await sendMessage(
    client,
    conversationId,
    'Bonjour ! Voici ma proposition pour votre mur. Des questions sur le croquis ?',
  );

  await login(client, 'marie');
  const marieConversationId = await ensureConversation(client, privateLocationId);
  await sendMessage(
    client,
    marieConversationId,
    'Merci Léa ! Pouvez-vous préciser les couleurs dominantes prévues ?',
  );

  await login(client, 'maire');
  const pending = await listPendingMayorLocations(client);
  const toApprove = pending.find((loc) => loc.id === publicLocationId);
  if (toApprove) {
    await approveLocation(client, publicLocationId, 'Projet validé en conseil municipal de démo.');
  } else {
    console.log(`· Lieu public déjà traité ou absent de la file maire : ${publicLocationId}`);
  }

  console.log('\nRécapitulatif des comptes de démo :');
  for (const key of Object.keys(ACCOUNTS) as AccountKey[]) {
    const account = ACCOUNTS[key];
    console.log(`  ${account.email} / ${PASSWORD} — ${account.roles.join(', ')}`);
  }
  console.log('\nLieux créés :');
  console.log(`  Privé (proposition + messagerie) : Mur de cour intérieure`);
  console.log(`  Public en attente maire : Sous-passage place du marché`);
  console.log(`  Public approuvé : Mur bibliothèque municipale`);
}

main().catch((error) => {
  console.error('\nÉchec du peuplement :', error);
  process.exit(1);
});
