import { Router } from 'express';
import { prisma } from '@question-exchange/database';
import { optionalAuth } from '../middleware/auth';

export const tagsRouter = Router();

// Get all tags with usage count
tagsRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { category, search, limit = 50 } = req.query;
    
    const where: any = {};
    
    if (category) {
      where.category = category as string;
    }
    
    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive',
      };
    }
    
    const tags = await prisma.tag.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: Number(limit),
      include: {
        _count: {
          select: { questions: true },
        },
      },
    });
    
    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
});

// Get tag categories
tagsRouter.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.tag.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
    });
    
    const categoryList = categories
      .map((c) => c.category)
      .filter((c): c is string => c !== null);
    
    res.json({
      success: true,
      data: categoryList,
    });
  } catch (error) {
    next(error);
  }
});

// Get popular tags
tagsRouter.get('/popular', async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    const tags = await prisma.tag.findMany({
      orderBy: { usageCount: 'desc' },
      take: Number(limit),
      select: {
        id: true,
        name: true,
        category: true,
        usageCount: true,
      },
    });
    
    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
});

// Get questions by tag
tagsRouter.get('/:name/questions', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    const tag = await prisma.tag.findUnique({
      where: { name: req.params.name },
    });
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Tag not found',
          code: 'NOT_FOUND',
        },
      });
    }
    
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where: {
          tags: {
            some: {
              tagId: tag.id,
            },
          },
          status: 'PUBLISHED',
        },
        skip,
        take: Number(limit),
        orderBy: { valueScore: 'desc' },
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
      }),
      prisma.question.count({
        where: {
          tags: {
            some: {
              tagId: tag.id,
            },
          },
          status: 'PUBLISHED',
        },
      }),
    ]);
    
    res.json({
      success: true,
      data: {
        tag,
        questions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});