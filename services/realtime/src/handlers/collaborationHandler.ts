import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { logger } from '../utils/logger';
import { requireAuth } from '../utils/auth';
import { prisma } from '@question-exchange/database';

// Store Yjs documents in memory
const documents = new Map<string, Y.Doc>();

export function collaborationHandler(io: Server, socket: Socket) {
  // Handle Yjs sync
  socket.on('doc-sync', async (data: {
    questionId: string;
    state: Uint8Array;
  }) => {
    if (!requireAuth(socket)) return;

    try {
      const docName = `question:${data.questionId}`;
      let doc = documents.get(docName);

      if (!doc) {
        doc = new Y.Doc();
        documents.set(docName, doc);

        // Load initial content from database
        const question = await prisma.question.findUnique({
          where: { id: data.questionId },
          include: { context: true },
        });

        if (question) {
          const questionText = doc.getText('question');
          questionText.insert(0, question.coreQuestion);

          if (question.context) {
            const contextMap = doc.getMap('context');
            contextMap.set('background', question.context.background);
            contextMap.set('priorKnowledge', question.context.priorKnowledge);
            contextMap.set('attemptedApproach', question.context.attemptedApproach);
            contextMap.set('expectedUse', question.context.expectedUse);
          }
        }
      }

      // Apply state vector
      if (data.state) {
        Y.applyUpdate(doc, data.state);
      }

      // Send current state back
      const stateVector = Y.encodeStateAsUpdate(doc);
      socket.emit('doc-sync-reply', {
        questionId: data.questionId,
        state: stateVector,
      });

      logger.info(`Document synced for question ${data.questionId}`);
    } catch (error) {
      logger.error('Error syncing document:', error);
      socket.emit('error', { message: 'Failed to sync document' });
    }
  });

  // Handle Yjs updates
  socket.on('doc-update', async (data: {
    questionId: string;
    update: Uint8Array;
  }) => {
    if (!requireAuth(socket)) return;

    try {
      const docName = `question:${data.questionId}`;
      const doc = documents.get(docName);

      if (!doc) {
        socket.emit('error', { message: 'Document not found' });
        return;
      }

      // Apply update
      Y.applyUpdate(doc, data.update);

      // Broadcast to other clients
      const room = `question:${data.questionId}`;
      socket.to(room).emit('doc-update', {
        questionId: data.questionId,
        update: data.update,
        userId: socket.data.userId,
      });

      // Schedule save to database (debounced)
      scheduleSave(data.questionId, doc);

    } catch (error) {
      logger.error('Error updating document:', error);
      socket.emit('error', { message: 'Failed to update document' });
    }
  });

  // Handle awareness updates (cursor positions, selections)
  socket.on('awareness-update', (data: {
    questionId: string;
    awareness: any;
  }) => {
    const room = `question:${data.questionId}`;
    socket.to(room).emit('awareness-update', {
      userId: socket.data.userId,
      awareness: data.awareness,
    });
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    // Remove user's awareness from all documents
    socket.rooms.forEach((room) => {
      if (room.startsWith('question:')) {
        socket.to(room).emit('awareness-remove', {
          userId: socket.data.userId,
        });
      }
    });
  });
}

// Debounced save to database
const saveTimeouts = new Map<string, NodeJS.Timeout>();

function scheduleSave(questionId: string, doc: Y.Doc) {
  // Clear existing timeout
  const existingTimeout = saveTimeouts.get(questionId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Schedule new save
  const timeout = setTimeout(async () => {
    try {
      const questionText = doc.getText('question').toString();
      const contextMap = doc.getMap('context');

      await prisma.$transaction(async (tx) => {
        // Update question
        await tx.question.update({
          where: { id: questionId },
          data: {
            coreQuestion: questionText,
            updatedAt: new Date(),
          },
        });

        // Update context
        const contextData = {
          background: contextMap.get('background') as string || '',
          priorKnowledge: contextMap.get('priorKnowledge') as string || '',
          attemptedApproach: contextMap.get('attemptedApproach') as string || '',
          expectedUse: contextMap.get('expectedUse') as string || '',
        };

        await tx.context.update({
          where: { questionId },
          data: contextData,
        });
      });

      logger.info(`Saved document for question ${questionId}`);
      saveTimeouts.delete(questionId);
    } catch (error) {
      logger.error('Error saving document:', error);
    }
  }, 5000); // Save after 5 seconds of inactivity

  saveTimeouts.set(questionId, timeout);
}

// Clean up old documents periodically
setInterval(() => {
  const now = Date.now();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  documents.forEach((doc, key) => {
    // Simple cleanup - in production, track last access time
    if (doc.clientID === 0) { // No clients connected
      documents.delete(key);
      logger.info(`Cleaned up document ${key}`);
    }
  });
}, 5 * 60 * 1000); // Every 5 minutes