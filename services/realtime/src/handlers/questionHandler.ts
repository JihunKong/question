import { Server, Socket } from 'socket.io';
import { prisma } from '@question-exchange/database';
import { logger } from '../utils/logger';
import { requireAuth } from '../utils/auth';

export function questionHandler(_io: Server, socket: Socket) {
  // Join question room
  socket.on('join-question', async (questionId: string) => {
    if (!requireAuth(socket)) return;

    try {
      // Verify question exists and user has access
      const question = await prisma.question.findUnique({
        where: { id: questionId },
        include: {
          collaborations: {
            where: { userId: socket.data.userId },
          },
        },
      });

      if (!question) {
        socket.emit('error', { message: 'Question not found' });
        return;
      }

      // Check if user is owner or has collaboration access
      const isOwner = question.userId === socket.data.userId;
      const hasCollaboration = question.collaborations.length > 0;

      if (!isOwner && !hasCollaboration && question.status !== 'PUBLISHED') {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Join the room
      const room = `question:${questionId}`;
      socket.join(room);

      // Update collaboration status if needed
      if (hasCollaboration || isOwner) {
        await prisma.collaboration.upsert({
          where: {
            questionId_userId: {
              questionId,
              userId: socket.data.userId,
            },
          },
          update: {
            lastActive: new Date(),
          },
          create: {
            questionId,
            userId: socket.data.userId,
            role: isOwner ? 'OWNER' : 'VIEWER',
          },
        });
      }

      // Get active users
      const activeUsers = await getActiveUsers(questionId);
      
      // Notify others
      socket.to(room).emit('user-joined', {
        userId: socket.data.userId,
        email: socket.data.email,
      });

      // Send current state
      socket.emit('question-state', {
        questionId,
        activeUsers,
        role: isOwner ? 'OWNER' : hasCollaboration ? question.collaborations[0].role : 'VIEWER',
      });

      logger.info(`User ${socket.data.userId} joined question ${questionId}`);
    } catch (error) {
      logger.error('Error joining question:', error);
      socket.emit('error', { message: 'Failed to join question' });
    }
  });

  // Leave question room
  socket.on('leave-question', async (questionId: string) => {
    const room = `question:${questionId}`;
    socket.leave(room);

    // Notify others
    socket.to(room).emit('user-left', {
      userId: socket.data.userId,
    });

    logger.info(`User ${socket.data.userId} left question ${questionId}`);
  });

  // Handle question updates
  socket.on('update-question', async (data: {
    questionId: string;
    updates: any;
  }) => {
    if (!requireAuth(socket)) return;

    try {
      // Verify user has edit access
      const collaboration = await prisma.collaboration.findUnique({
        where: {
          questionId_userId: {
            questionId: data.questionId,
            userId: socket.data.userId,
          },
        },
      });

      if (!collaboration || collaboration.role === 'VIEWER') {
        socket.emit('error', { message: 'No edit permission' });
        return;
      }

      // Broadcast update to room
      const room = `question:${data.questionId}`;
      socket.to(room).emit('question-updated', {
        updates: data.updates,
        userId: socket.data.userId,
        timestamp: new Date(),
      });

      logger.info(`Question ${data.questionId} updated by ${socket.data.userId}`);
    } catch (error) {
      logger.error('Error updating question:', error);
      socket.emit('error', { message: 'Failed to update question' });
    }
  });

  // Handle cursor position updates
  socket.on('cursor-position', (data: {
    questionId: string;
    position: { x: number; y: number };
  }) => {
    const room = `question:${data.questionId}`;
    socket.to(room).emit('cursor-update', {
      userId: socket.data.userId,
      position: data.position,
    });
  });
}

async function getActiveUsers(questionId: string) {
  const recentActivity = new Date(Date.now() - 5 * 60 * 1000); // Last 5 minutes
  
  const collaborations = await prisma.collaboration.findMany({
    where: {
      questionId,
      lastActive: { gte: recentActivity },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  });

  return collaborations.map((c) => ({
    id: c.user.id,
    email: c.user.email,
    name: c.user.name,
    role: c.role,
  }));
}