import { PrismaClient, Role, MediaType, PostVisibility, JobType, RSVPStatus, ConversationType, MessageType } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await argon2.hash('Password123!');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@decp.edu' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@decp.edu',
      passwordHash,
      role: Role.ADMIN,
      department: 'Computer Science',
      batchYear: 2015,
      headline: 'Platform administrator',
      skills: ['management', 'moderation'],
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@decp.edu' },
    update: {},
    create: {
      name: 'Ayesha Fernando',
      email: 'student@decp.edu',
      passwordHash,
      role: Role.STUDENT,
      department: 'Computer Science',
      batchYear: 2026,
      headline: 'Undergraduate developer',
      skills: ['nestjs', 'react-native'],
    },
  });

  const alumni = await prisma.user.upsert({
    where: { email: 'alumni@decp.edu' },
    update: {},
    create: {
      name: 'Kasun Perera',
      email: 'alumni@decp.edu',
      passwordHash,
      role: Role.ALUMNI,
      department: 'Computer Science',
      batchYear: 2020,
      headline: 'Software engineer at Tech Lanka',
      skills: ['node.js', 'cloud'],
    },
  });

  const post = await prisma.post.create({
    data: {
      authorId: student.id,
      content: 'Looking for collaborators for a machine learning project.',
      mediaType: MediaType.NONE,
      visibility: PostVisibility.PUBLIC,
    },
  });

  await prisma.comment.create({
    data: {
      postId: post.id,
      authorId: alumni.id,
      content: 'Interested. Let us discuss the scope.',
    },
  });

  const job = await prisma.job.create({
    data: {
      title: 'Backend Intern',
      company: 'Tech Lanka',
      location: 'Colombo',
      type: JobType.INTERNSHIP,
      description: 'Work on cloud native backend services.',
      postedByUserId: alumni.id,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.jobApplication.create({
    data: {
      jobId: job.id,
      applicantId: student.id,
      coverLetter: 'I have hands-on NestJS and Prisma experience.',
    },
  });

  const event = await prisma.event.create({
    data: {
      title: 'Alumni Networking Night',
      description: 'Meet alumni and discuss career pathways.',
      location: 'Main Auditorium',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
      createdByUserId: admin.id,
    },
  });

  await prisma.eventRSVP.create({
    data: {
      eventId: event.id,
      userId: student.id,
      status: RSVPStatus.GOING,
    },
  });

  const project = await prisma.researchProject.create({
    data: {
      title: 'AI for Student Success',
      description: 'Research on predictive analytics for student engagement.',
      ownerId: admin.id,
      tags: ['ai', 'analytics', 'education'],
    },
  });

  await prisma.researchCollaborator.create({
    data: {
      projectId: project.id,
      userId: student.id,
      roleInProject: 'Research Assistant',
    },
  });

  const conversation = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      participants: {
        create: [{ userId: student.id }, { userId: alumni.id }],
      },
      messages: {
        create: {
          senderId: alumni.id,
          content: 'Please send your CV before Friday.',
          messageType: MessageType.TEXT,
        },
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: student.id,
        type: 'JOB_APPLICATION',
        title: 'Application submitted',
        body: 'Your internship application has been submitted successfully.',
        relatedEntityType: 'JOB',
        relatedEntityId: job.id,
      },
      {
        userId: alumni.id,
        type: 'NEW_MESSAGE',
        title: 'Conversation started',
        body: `Conversation ${conversation.id} is active.`,
        relatedEntityType: 'CONVERSATION',
        relatedEntityId: conversation.id,
      },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
