import { PrismaClient } from '@prisma/client';
import { hash } from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return hash('sha256', password).toString('hex');
}

async function main() {
  // Create test users
  const user1 = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: await hashPassword('password123'),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Doe',
      passwordHash: await hashPassword('password123'),
    },
  });

  // Create tags
  const tagNames = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Database',
    'Architecture',
    'Performance',
    'Security',
    'AI/ML',
    'DevOps',
  ];

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: {
          name,
          category: name === 'AI/ML' ? 'Technology' : 'Programming',
        },
      })
    )
  );

  // Create sample questions
  const question1 = await prisma.question.create({
    data: {
      coreQuestion: 'How can I optimize React component re-renders in a large-scale application?',
      status: 'PUBLISHED',
      valueScore: 8.5,
      userId: user1.id,
      context: {
        create: {
          background:
            'Working on an e-commerce platform with 1000+ components and complex state management',
          priorKnowledge:
            'Familiar with React basics, hooks, and Redux. Have tried React.memo but still seeing performance issues',
          attemptedApproach:
            'Implemented React.memo on several components, used useCallback for event handlers',
          expectedUse:
            'Need to improve page load times and interaction responsiveness for better user experience',
        },
      },
      tags: {
        create: [
          { tagId: tags.find((t) => t.name === 'React')!.id },
          { tagId: tags.find((t) => t.name === 'Performance')!.id },
          { tagId: tags.find((t) => t.name === 'JavaScript')!.id },
        ],
      },
    },
  });

  const question2 = await prisma.question.create({
    data: {
      coreQuestion: 'What is the best approach to implement real-time collaboration features?',
      status: 'PUBLISHED',
      valueScore: 9.2,
      userId: user2.id,
      context: {
        create: {
          background: 'Building a collaborative document editing tool similar to Google Docs',
          priorKnowledge: 'Experience with WebSockets and basic real-time communication',
          attemptedApproach:
            'Tried implementing with Socket.io but facing synchronization issues',
          expectedUse:
            'Support 10+ concurrent users editing the same document with conflict resolution',
        },
      },
      tags: {
        create: [
          { tagId: tags.find((t) => t.name === 'Architecture')!.id },
          { tagId: tags.find((t) => t.name === 'Node.js')!.id },
        ],
      },
    },
  });

  // Create a question chain
  await prisma.questionChain.create({
    data: {
      parentId: question1.id,
      childId: question2.id,
      relationshipType: 'related',
    },
  });

  // Create sample evaluation
  await prisma.evaluation.create({
    data: {
      questionId: question1.id,
      contextCompleteness: 0.85,
      questionQuality: 0.9,
      rippleEffect: 0.8,
      originality: 0.75,
      interactivity: 0.85,
      totalScore: 8.5,
      metadata: {
        keywords: ['react', 'performance', 'optimization'],
        complexity: 'intermediate',
      },
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });