import { Router } from 'express';
import { prisma } from '@question-exchange/database';
import {
  questionFormSchema,
  questionUpdateSchema,
  paginationSchema,
  questionFiltersSchema,
  type ApiResponse,
  type QuestionWithRelations,
} from '@question-exchange/shared';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

export const questionsRouter = Router();

// Create question
questionsRouter.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = questionFormSchema.parse(req.body);
    
    const result = await prisma.$transaction(async (tx) => {
      // Create question
      const question = await tx.question.create({
        data: {
          coreQuestion: data.coreQuestion,
          status: 'DRAFT',
          userId: req.userId!,
        },
      });
      
      // Create context
      await tx.context.create({
        data: {
          questionId: question.id,
          ...data.context,
        },
      });
      
      // Handle tags
      const tagPromises = data.tags.map(async (tagName) => {
        const tag = await tx.tag.upsert({
          where: { name: tagName },
          update: { usageCount: { increment: 1 } },
          create: { name: tagName },
        });
        
        return tx.questionTag.create({
          data: {
            questionId: question.id,
            tagId: tag.id,
          },
        });
      });
      
      await Promise.all(tagPromises);
      
      // Fetch complete question with relations
      return tx.question.findUnique({
        where: { id: question.id },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          context: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });
    
    // Trigger AI evaluation (async - don't await)
    if (process.env.AI_SERVICE_URL) {
      fetch(`${process.env.AI_SERVICE_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: result!.id }),
      }).catch((err) => {
        console.error('Failed to trigger AI evaluation:', err);
      });
    }
    
    res.status(201).json({
      success: true,
      data: result,
    } as ApiResponse<QuestionWithRelations>);
  } catch (error) {
    next(error);
  }
});

// List questions with filters and pagination
questionsRouter.get('/', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const pagination = paginationSchema.parse(req.query);
    const filters = questionFiltersSchema.parse(req.query);
    
    const where: any = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.minScore !== undefined) {
      where.valueScore = { gte: filters.minScore };
    }
    
    if (filters.search) {
      where.coreQuestion = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }
    
    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            name: { in: filters.tags },
          },
        },
      };
    }
    
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: {
          [pagination.orderBy || 'createdAt']: pagination.orderDirection,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          context: true,
          tags: {
            include: {
              tag: true,
            },
          },
          evaluations: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.question.count({ where }),
    ]);
    
    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single question
questionsRouter.get('/:id', optionalAuth, async (req: AuthRequest, res, next) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        context: true,
        tags: {
          include: {
            tag: true,
          },
        },
        evaluations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        parentChains: {
          include: {
            parent: {
              select: { id: true, coreQuestion: true },
            },
          },
        },
        childChains: {
          include: {
            child: {
              select: { id: true, coreQuestion: true },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 5,
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
    
    if (!question) {
      throw new AppError(404, 'Question not found', 'NOT_FOUND');
    }
    
    // Increment reusability count
    await prisma.question.update({
      where: { id: req.params.id },
      data: { reusability: { increment: 1 } },
    });
    
    res.json({
      success: true,
      data: question,
    });
  } catch (error) {
    next(error);
  }
});

// Update question
questionsRouter.put('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const data = questionUpdateSchema.parse(req.body);
    
    // Check ownership
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      select: { userId: true, coreQuestion: true },
    });
    
    if (!question) {
      throw new AppError(404, 'Question not found', 'NOT_FOUND');
    }
    
    if (question.userId !== req.userId) {
      throw new AppError(403, 'Not authorized to update this question', 'FORBIDDEN');
    }
    
    // Update question and create version if core question changed
    const result = await prisma.$transaction(async (tx) => {
      if (data.coreQuestion && data.coreQuestion !== question.coreQuestion) {
        // Get current version number
        const latestVersion = await tx.questionVersion.findFirst({
          where: { questionId: req.params.id },
          orderBy: { versionNumber: 'desc' },
        });
        
        const versionNumber = (latestVersion?.versionNumber || 0) + 1;
        
        // Create version
        await tx.questionVersion.create({
          data: {
            questionId: req.params.id,
            coreQuestion: question.coreQuestion,
            versionNumber,
            userId: req.userId!,
            changeReason: 'Question updated',
          },
        });
      }
      
      // Update question
      return tx.question.update({
        where: { id: req.params.id },
        data,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          context: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

// Delete question (soft delete by setting status to ARCHIVED)
questionsRouter.delete('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Check ownership
    const question = await prisma.question.findUnique({
      where: { id: req.params.id },
      select: { userId: true },
    });
    
    if (!question) {
      throw new AppError(404, 'Question not found', 'NOT_FOUND');
    }
    
    if (question.userId !== req.userId) {
      throw new AppError(403, 'Not authorized to delete this question', 'FORBIDDEN');
    }
    
    // Archive question
    await prisma.question.update({
      where: { id: req.params.id },
      data: { status: 'ARCHIVED' },
    });
    
    res.json({
      success: true,
      data: { message: 'Question archived successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// Create question chain
questionsRouter.post('/:id/chain', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { childId, relationshipType } = req.body;
    
    if (!childId || !relationshipType) {
      throw new AppError(400, 'childId and relationshipType are required', 'VALIDATION_ERROR');
    }
    
    // Check if both questions exist
    const [parent, child] = await Promise.all([
      prisma.question.findUnique({ where: { id: req.params.id } }),
      prisma.question.findUnique({ where: { id: childId } }),
    ]);
    
    if (!parent || !child) {
      throw new AppError(404, 'Question not found', 'NOT_FOUND');
    }
    
    // Create chain
    const chain = await prisma.questionChain.create({
      data: {
        parentId: req.params.id,
        childId,
        relationshipType,
      },
      include: {
        parent: {
          select: { id: true, coreQuestion: true },
        },
        child: {
          select: { id: true, coreQuestion: true },
        },
      },
    });
    
    res.status(201).json({
      success: true,
      data: chain,
    });
  } catch (error) {
    next(error);
  }
});