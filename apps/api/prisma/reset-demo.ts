import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SEED = {
  locations: [
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
  ],
  proposals: ['00000000-0000-4000-8000-000000000010'],
  messages: [
    '00000000-0000-4000-8000-000000000020',
    '00000000-0000-4000-8000-000000000021',
  ],
};

async function main() {
  await prisma.message.deleteMany({
    where: { id: { notIn: SEED.messages } },
  });

  await prisma.artworkProposal.deleteMany({
    where: { id: { notIn: SEED.proposals } },
  });

  await prisma.conversation.deleteMany({
    where: { locationId: { notIn: SEED.locations } },
  });

  await prisma.location.deleteMany({
    where: { id: { notIn: SEED.locations } },
  });

  const mayor = await prisma.user.findUniqueOrThrow({
    where: { email: 'maire@wall4art.local' },
  });

  await prisma.location.update({
    where: { id: SEED.locations[0] },
    data: { status: 'OPEN' },
  });

  await prisma.location.update({
    where: { id: SEED.locations[1] },
    data: {
      status: 'PENDING_VALIDATION',
      mayorValidationStatus: 'PENDING',
      mayorValidatedById: null,
      mayorValidatedAt: null,
    },
  });

  await prisma.location.update({
    where: { id: SEED.locations[2] },
    data: {
      status: 'OPEN',
      mayorValidationStatus: 'APPROVED',
      mayorValidatedById: mayor.id,
      mayorValidatedAt: new Date(),
    },
  });

  await prisma.artworkProposal.update({
    where: { id: SEED.proposals[0] },
    data: { status: 'SUBMITTED' },
  });

  const lea = await prisma.user.findUniqueOrThrow({
    where: { email: 'lea@wall4art.local' },
  });

  await prisma.profile.update({
    where: { userId: lea.id },
    data: {
      city: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      searchRadiusKm: 30,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
