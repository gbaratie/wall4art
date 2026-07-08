import { PrismaClient, UserRole } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';

const prisma = new PrismaClient();

async function createUserWithRole(
  email: string,
  name: string,
  password: string,
  roles: UserRole[],
) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return existing;

  const user = await prisma.user.create({
    data: { email, name, emailVerified: true },
  });

  const hashed = await hashPassword(password);

  await prisma.account.create({
    data: {
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashed,
    },
  });

  await prisma.userRoleAssignment.createMany({
    data: roles.map((role) => ({ userId: user.id, role })),
  });

  await prisma.profile.create({
    data: {
      userId: user.id,
      city: name.includes('Paris') ? 'Paris' : name.includes('Lyon') ? 'Lyon' : 'Marseille',
      latitude: name.includes('Paris') ? 48.8566 : name.includes('Lyon') ? 45.764 : 43.2965,
      longitude: name.includes('Paris') ? 2.3522 : name.includes('Lyon') ? 4.8357 : 5.3698,
      searchRadiusKm: 30,
      bio: `Profil de démonstration pour ${name}`,
      portfolioLinks: {
        instagram: 'https://instagram.com/example',
        website: 'https://example.com',
      },
    },
  });

  return user;
}

async function main() {
  const mayor = await createUserWithRole(
    'maire@wall4art.local',
    'Mairesse de Paris',
    'password123',
    ['MAIRE'],
  );
  const host1 = await createUserWithRole(
    'marie@wall4art.local',
    'Marie Dupont',
    'password123',
    ['PARTICULIER'],
  );
  const host2 = await createUserWithRole(
    'pierre@wall4art.local',
    'Pierre Martin',
    'password123',
    ['PARTICULIER'],
  );
  const artist1 = await createUserWithRole(
    'lea@wall4art.local',
    'Léa Artiste Paris',
    'password123',
    ['ARTISTE'],
  );
  const artist2 = await createUserWithRole(
    'tom@wall4art.local',
    'Tom Artiste Lyon',
    'password123',
    ['ARTISTE'],
  );

  const privateLocation = await prisma.location.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      hostId: host1.id,
      title: 'Mur de cour intérieure',
      description: 'Cour privée avec un grand mur blanc, exposition sud.',
      expectedOutcome: 'Fresque colorée sur le thème de la nature urbaine.',
      kind: 'PRIVATE',
      requiresMayorValidation: false,
      mayorValidationStatus: 'NOT_REQUIRED',
      address: '12 rue des Fleurs',
      city: 'Paris',
      postalCode: '75011',
      latitude: 48.8575,
      longitude: 2.3794,
      photoUrl: 'https://images.unsplash.com/photo-1518998053901-8ea9341191a5?w=800',
      status: 'OPEN',
    },
  });

  const pendingLocation = await prisma.location.upsert({
    where: { id: '00000000-0000-4000-8000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000002',
      hostId: host2.id,
      title: 'Sous-passage place du marché',
      description: 'Espace public sous le marché, fort passage piéton.',
      expectedOutcome: 'Œuvre participative célébrant le quartier.',
      kind: 'PUBLIC',
      requiresMayorValidation: true,
      mayorValidationStatus: 'PENDING',
      address: 'Place du Marché',
      city: 'Paris',
      postalCode: '75020',
      latitude: 48.8649,
      longitude: 2.3985,
      photoUrl: 'https://images.unsplash.com/photo-1499781350151-5dea69240ad9?w=800',
      status: 'PENDING_VALIDATION',
    },
  });

  const publicLocation = await prisma.location.upsert({
    where: { id: '00000000-0000-4000-8000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000003',
      hostId: host2.id,
      title: 'Mur bibliothèque municipale',
      description: 'Mur latéral de la bibliothèque, visible depuis le parc.',
      expectedOutcome: 'Fresque littéraire et inclusive.',
      kind: 'PUBLIC',
      requiresMayorValidation: true,
      mayorValidationStatus: 'APPROVED',
      mayorValidatedById: mayor.id,
      mayorValidatedAt: new Date(),
      address: '5 avenue de la Lecture',
      city: 'Paris',
      postalCode: '75013',
      latitude: 48.8322,
      longitude: 2.3561,
      photoUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
      status: 'OPEN',
    },
  });

  const proposal = await prisma.artworkProposal.upsert({
    where: { id: '00000000-0000-4000-8000-000000000010' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000010',
      artistId: artist1.id,
      locationId: privateLocation.id,
      title: 'Jardin vertical peint',
      description: 'Proposition de fresque végétale avec oiseaux et plantes locales.',
      commitments: 'Utilisation de peintures écologiques, protection du sol, nettoyage quotidien.',
      estimatedDurationDays: 14,
      sketchUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
      fundingRequested: true,
      fundingAmount: 2500,
      fundingDescription: 'Matériaux, nacelles et temps artiste.',
      status: 'SUBMITTED',
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: {
      locationId_artistId: {
        locationId: privateLocation.id,
        artistId: artist1.id,
      },
    },
    update: {},
    create: {
      locationId: privateLocation.id,
      hostId: host1.id,
      artistId: artist1.id,
    },
  });

  await prisma.message.upsert({
    where: { id: '00000000-0000-4000-8000-000000000020' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000020',
      conversationId: conversation.id,
      senderId: artist1.id,
      content: 'Bonjour ! Voici ma proposition pour votre mur. Des questions sur le croquis ?',
    },
  });

  await prisma.message.upsert({
    where: { id: '00000000-0000-4000-8000-000000000021' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000021',
      conversationId: conversation.id,
      senderId: host1.id,
      content: 'Merci Léa ! Pouvez-vous préciser les couleurs dominantes prévues ?',
    },
  });

  console.log('Seed completed:', {
    mayor: mayor.email,
    hosts: [host1.email, host2.email],
    artists: [artist1.email, artist2.email],
    locations: [privateLocation.id, pendingLocation.id, publicLocation.id],
    proposal: proposal.id,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
