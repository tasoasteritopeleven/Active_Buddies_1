/* eslint-disable no-console */
import { PrismaClient, UserRole, ChallengeType, CommunityMemberRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding database...');

  const password = await argon2.hash('Passw0rd!', { type: argon2.argon2id });

  const [alice, bob, charlie] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@example.com' },
      update: {},
      create: {
        email: 'alice@example.com',
        passwordHash: password,
        firstName: 'Alice',
        lastName: 'Adams',
        role: UserRole.ADMIN,
        bio: 'Marathon runner & yoga enthusiast',
        fitnessLevel: 'advanced',
        goals: ['running', 'yoga', 'strength'],
        locationCity: 'Athens',
        isVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@example.com' },
      update: {},
      create: {
        email: 'bob@example.com',
        passwordHash: password,
        firstName: 'Bob',
        lastName: 'Brown',
        bio: 'Casual cyclist looking for weekend pals',
        fitnessLevel: 'intermediate',
        goals: ['cycling', 'running'],
        locationCity: 'Athens',
        isVerified: true,
      },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@example.com' },
      update: {},
      create: {
        email: 'charlie@example.com',
        passwordHash: password,
        firstName: 'Charlie',
        lastName: 'Chen',
        bio: 'Gym rat — 4x a week',
        fitnessLevel: 'advanced',
        goals: ['strength', 'hiit'],
        locationCity: 'Thessaloniki',
      },
    }),
  ]);

  console.log(`✓ Users: ${alice.email}, ${bob.email}, ${charlie.email}`);

  // Community
  const community = await prisma.community.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Athens Runners',
      description: 'A community for runners in Athens',
      icon: '🏃',
      color: '#22c55e',
      isPublic: true,
      createdById: alice.id,
      membersCount: 2,
      members: {
        create: [
          { userId: alice.id, role: CommunityMemberRole.ADMIN },
          { userId: bob.id, role: CommunityMemberRole.MEMBER },
        ],
      },
    },
  });
  console.log(`✓ Community: ${community.name}`);

  // Challenge
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const challenge = await prisma.challenge.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: '30-Day Run Streak',
      description: 'Run at least 2km every day for 30 days',
      challengeType: ChallengeType.STREAK,
      startDate: now,
      endDate: end,
      createdById: alice.id,
      targetValue: 30,
      participantsCount: 2,
      participants: {
        create: [
          { userId: alice.id, progress: 5 },
          { userId: bob.id, progress: 3 },
        ],
      },
    },
  });
  console.log(`✓ Challenge: ${challenge.title}`);

  console.log('🌱 Seeding done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
