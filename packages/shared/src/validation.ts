import { z } from 'zod';

export const contextSchema = z.object({
  background: z.string().min(10, 'Background must be at least 10 characters'),
  priorKnowledge: z.string().min(10, 'Prior knowledge must be at least 10 characters'),
  attemptedApproach: z.string().min(10, 'Attempted approach must be at least 10 characters'),
  expectedUse: z.string().min(10, 'Expected use must be at least 10 characters'),
});

export const questionFormSchema = z.object({
  coreQuestion: z.string().min(10, 'Question must be at least 10 characters'),
  context: contextSchema,
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(5, 'Maximum 5 tags allowed'),
  enableCollaboration: z.boolean().optional(),
});

export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const questionUpdateSchema = z.object({
  coreQuestion: z.string().min(10).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ANSWERED', 'ARCHIVED']).optional(),
});

export const evaluationRequestSchema = z.object({
  questionId: z.string().cuid(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const questionFiltersSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ANSWERED', 'ARCHIVED']).optional(),
  tags: z.array(z.string()).optional(),
  minScore: z.coerce.number().min(0).max(10).optional(),
  userId: z.string().cuid().optional(),
  search: z.string().optional(),
});

export type QuestionFormInput = z.infer<typeof questionFormSchema>;
export type UserRegistrationInput = z.infer<typeof userRegistrationSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type QuestionFiltersInput = z.infer<typeof questionFiltersSchema>;