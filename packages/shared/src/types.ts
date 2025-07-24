export interface QuestionFormData {
  coreQuestion: string;
  context: {
    background: string;
    priorKnowledge: string;
    attemptedApproach: string;
    expectedUse: string;
  };
  tags: string[];
  enableCollaboration?: boolean;
}

export interface QuestionWithRelations {
  id: string;
  coreQuestion: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ANSWERED' | 'ARCHIVED';
  valueScore: number;
  reusability: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  context?: {
    id: string;
    background: string;
    priorKnowledge: string;
    attemptedApproach: string;
    expectedUse: string;
  };
  tags: Array<{
    tag: {
      id: string;
      name: string;
      category: string | null;
    };
  }>;
  evaluations?: Array<{
    id: string;
    totalScore: number;
    createdAt: Date;
  }>;
}

export interface EvaluationResult {
  contextCompleteness: number;
  questionQuality: number;
  rippleEffect: number;
  originality: number;
  interactivity: number;
  totalScore: number;
  metadata?: Record<string, any>;
}

export interface CollaborationSession {
  questionId: string;
  userId: string;
  role: 'VIEWER' | 'EDITOR' | 'OWNER';
  activeUsers: Array<{
    id: string;
    name: string;
    cursor?: {
      x: number;
      y: number;
    };
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface QuestionFilters {
  status?: string;
  tags?: string[];
  minScore?: number;
  userId?: string;
  search?: string;
}